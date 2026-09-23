import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, deleteDoc, deleteField, writeBatch } from 'firebase/firestore';

let rules: RulesTestEnvironment;
const tenantCollections = [
  'assessment', 'assessments', 'compliance_framework', 'compliance_frameworks',
  'compliance_control', 'compliance_controls', 'action_item', 'action_items',
  'incident', 'incidents', 'incident_note', 'policy', 'policies', 'risk', 'risks',
  'b_i_a', 'b_i_as', 'tabletop_exercise', 'tabletop_exercises', 'exercise_participant',
  'team', 'teams', 'team_member', 'team_members', 'etsi_assessment', 'evidence',
  'pci_scope', 'regulatory_requirement', 'org_unit', 'asset_type', 'subtask', 'comment',
  'editing_session', 'smart_analysis_config', 'i_o_c_analyzer_config', 'ioc_analyzer_config',
];
const personalCollections = ['training_progress', 'training_badge', 'video_progress', 'ioc_feedback', 'notification'];
const ordinary = (email: string) => ({
  email, full_name: 'Local test user', approval_status: 'approved',
  company_onboarding_completed: false, disclaimer_acknowledged: false,
  subscription_tier: 'free_trial', company_role: 'admin', is_super_admin: false,
});
const client = (uid: string, claims: Record<string, unknown> = {}) =>
  rules.authenticatedContext(uid, { email: `${uid}@example.test`, email_verified: true, ...claims }).firestore();

before(async () => {
  assert.equal(process.env.FIREBASE_PROJECT_ID, 'demo-hubcys-v2');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  rules = await initializeTestEnvironment({
    projectId: 'demo-hubcys-v2',
    firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
});
beforeEach(async () => {
  await rules.clearFirestore();
  await rules.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const batch = writeBatch(db);
    for (const [uid, company, role, status] of [
      ['member-a', 'org-a', 'member', 'approved'], ['admin-a', 'org-a', 'admin', 'approved'],
      ['member-b', 'org-b', 'member', 'approved'], ['pending-a', 'org-a', 'member', 'pending'],
      ['suspended-a', 'org-a', 'admin', 'suspended'],
    ]) batch.set(doc(db, `users/${uid}`), {
      ...ordinary(`${uid}@example.test`), company_id: company, company_role: role, approval_status: status,
    });
    // Previously browser-set admin flags must no longer grant global authority.
    batch.set(doc(db, 'users/forged-admin'), { ...ordinary('forged-admin@example.test'), is_super_admin: true });
    for (const name of ['company', 'companies']) for (const id of ['org-a', 'org-b']) {
      batch.set(doc(db, `${name}/${id}`), { name: id, status: 'active', access_code: 'LOCAL-NOT-A-CREDENTIAL',
        admin_user_email: id === 'org-a' ? 'admin-a@example.test' : 'member-b@example.test' });
    }
    for (const name of tenantCollections) for (const id of ['org-a', 'org-b']) {
      batch.set(doc(db, `${name}/${id}`), { company_id: id, title: 'Local record' });
    }
    for (const name of personalCollections) batch.set(doc(db, `${name}/own`), {
      company_id: 'org-a', user_email: 'member-a@example.test', user_id: 'member-a', progress: 0,
    });
    batch.set(doc(db, 'smart_consultation/own'), {
      company_id: 'org-a', user_email: 'member-a@example.test', content: 'Local consultation',
    });
    for (const path of ['organizations/org-a', 'organizations/org-a/memberships/member-a',
      'organizations/org-a/provider_grants/member-a', 'organizations/org-a/evidence/e1',
      'organizations/org-a/audit_events/a1', 'organizations/org-a/observations/o1',
      'organizations/org-a/exercises/ex1/responses/r1']) batch.set(doc(db, path), { local: true });
    await batch.commit();
  });
});
after(async () => { await rules.cleanup(); });

test('registration permits ordinary defaults but denies every authority-bearing addition', async () => {
  const db = client('new');
  const ref = doc(db, 'users/new');
  for (const changes of [
    { is_super_admin: true }, { company_id: 'org-b' }, { app_role: 'super_admin' },
    { company_role: 'super_admin' }, { subscription_tier: 'enterprise' },
    { approval_status: 'pending' }, { email: 'someone-else@example.test' },
    { id: 'admin-a' }, { roles: ['admin'] },
  ]) await assertFails(setDoc(ref, { ...ordinary('new@example.test'), ...changes }));
  await assertSucceeds(setDoc(ref, ordinary('new@example.test')));
  await assertFails(setDoc(doc(db, 'users/someone-else'), ordinary('new@example.test')));
});

test('self-profile edits preserve harmless preferences but cannot change, remove or alias authority', async () => {
  const db = client('member-a');
  const ref = doc(db, 'users/member-a');
  await assertSucceeds(updateDoc(ref, { full_name: 'Updated name', disclaimer_acknowledged: true, onboarding_completed: true, role_type: 'technical' }));
  for (const changes of [
    { is_super_admin: true }, { company_id: 'org-b' }, { company_id: deleteField() },
    { company_role: 'admin' }, { app_role: 'admin' }, { approval_status: 'approved', subscription_tier: 'enterprise' },
    { email: 'admin-a@example.test' }, { is_super_admin: deleteField() }, { id: 'admin-a' },
    { company_onboarding_completed: true }, { roles: ['organization_admin'] },
  ]) await assertFails(updateDoc(ref, changes));
  await assertFails(deleteDoc(ref));
  await assertFails(setDoc(ref, ordinary('member-a@example.test')));
  await assertFails(updateDoc(doc(client('pending-a'), 'users/pending-a'), { approval_status: 'approved' }));
  await assertFails(updateDoc(doc(client('suspended-a'), 'users/suspended-a'), { approval_status: 'approved' }));
});

test('profile-based admin forgery fails while trusted Auth claim supports legacy administration', async () => {
  const forged = client('forged-admin');
  for (const path of ['company/org-b', 'incident/org-b', 'users/member-b', 'unknown/private']) {
    await assertFails(getDoc(doc(forged, path)));
    await assertFails(setDoc(doc(forged, path), { is_super_admin: true }));
  }
  const trusted = client('operator', { is_super_admin: true });
  await assertSucceeds(getDoc(doc(trusted, 'company/org-b')));
  await assertSucceeds(updateDoc(doc(trusted, 'users/member-b'), { subscription_tier: 'enterprise' }));
  await assertSucceeds(setDoc(doc(trusted, 'unknown/private'), { approved: true }));
  await assertFails(getDoc(doc(client('operator'), 'unknown/private')));
  await assertFails(getDoc(doc(client('operator', { is_super_admin: 'true' }), 'unknown/private')));
});

test('same-company user administration is bounded and member directories cannot enumerate other tenants', async () => {
  const admin = client('admin-a');
  await assertSucceeds(updateDoc(doc(admin, 'users/pending-a'), {
    approval_status: 'approved', company_role: 'member', approved_by: 'admin-a@example.test',
  }));
  await assertSucceeds(updateDoc(doc(admin, 'users/member-a'), { company_role: 'admin' }));
  await assertSucceeds(getDocs(query(collection(admin, 'users'), where('company_id', '==', 'org-a'))));
  await assertFails(getDocs(collection(admin, 'users')));
  for (const changes of [{ is_super_admin: true }, { company_id: 'org-b' }, { subscription_tier: 'enterprise' },
    { app_role: 'admin' }, { company_role: 'super_admin' }]) {
    await assertFails(updateDoc(doc(admin, 'users/member-a'), changes));
  }
  await assertFails(updateDoc(doc(admin, 'users/member-b'), { company_role: 'admin' }));
  await assertFails(updateDoc(doc(client('member-b'), 'users/admin-a'), { approval_status: 'banned' }));
});

test('company metadata is scoped, and ordinary members cannot change owners or entitlements', async () => {
  for (const name of ['company', 'companies']) {
    await assertSucceeds(getDoc(doc(client('member-a'), `${name}/org-a`)));
    await assertFails(getDoc(doc(client('member-a'), `${name}/org-b`)));
    await assertFails(getDocs(collection(client('member-a'), name)));
    await assertFails(getDocs(query(collection(client('member-a'), name), where('access_code', '==', 'LOCAL-NOT-A-CREDENTIAL'))));
    await assertSucceeds(updateDoc(doc(client('admin-a'), `${name}/org-a`), { name: 'Updated', description: 'Safe metadata' }));
    await assertFails(updateDoc(doc(client('member-a'), `${name}/org-a`), { name: 'Unauthorized edit' }));
    for (const changes of [{ admin_user_email: 'other@example.test' }, { created_by_uid: 'member-a' },
      { subscription_tier: 'enterprise' }, { access_code: 'changed' }, { status: 'active', company_id: 'org-b' }]) {
      await assertFails(updateDoc(doc(client('admin-a'), `${name}/org-a`), changes));
    }
    await assertFails(deleteDoc(doc(client('admin-a'), `${name}/org-a`)));
  }
});

test('new-company creation and one-time owner assignment work without directory queries', async () => {
  const db = client('new');
  await setDoc(doc(db, 'users/new'), ordinary('new@example.test'));
  const company = { name: 'New organization', admin_user_email: 'new@example.test', created_by_uid: 'new',
    access_code: 'LOCAL-CODE', status: 'active', description: '', industry: 'Other', size: 'Small_1-50' };
  await assertFails(setDoc(doc(db, 'company/forged'), { ...company, created_by_uid: 'member-b' }));
  await assertFails(setDoc(doc(db, 'company/forged'), { ...company, subscription_tier: 'enterprise' }));
  await assertSucceeds(setDoc(doc(db, 'company/new-org'), company));
  await assertSucceeds(getDoc(doc(db, 'company/new-org')));
  await assertFails(updateDoc(doc(db, 'users/new'), {
    company_id: 'org-b', company_role: 'admin', approval_status: 'approved',
    company_onboarding_completed: true, company_access_code: 'LOCAL-NOT-A-CREDENTIAL',
  }));
  await assertSucceeds(updateDoc(doc(db, 'users/new'), {
    company_id: 'new-org', company_name: company.name, company_access_code: company.access_code,
    company_description: '', company_industry: 'Other', company_size: 'Small_1-50',
    company_onboarding_completed: true, company_role: 'admin', approval_status: 'approved',
  }));
  await assertSucceeds(getDoc(doc(db, 'company/new-org')));
  await assertSucceeds(setDoc(doc(db, 'incident/first'), { company_id: 'new-org', title: 'Incident' }));
  await assertFails(updateDoc(doc(db, 'users/new'), { company_id: 'org-b' }));
  await assertFails(setDoc(doc(db, 'company/second'), company));
});

test('access-code knowledge, missing profiles and pending users confer no tenant access', async () => {
  const db = client('new');
  await setDoc(doc(db, 'users/new'), ordinary('new@example.test'));
  await assertFails(updateDoc(doc(db, 'users/new'), {
    company_id: 'org-b', company_role: 'member', approval_status: 'pending',
    company_onboarding_completed: true, company_access_code: 'LOCAL-NOT-A-CREDENTIAL',
  }));
  for (const uid of ['no-profile', 'pending-a', 'suspended-a']) {
    await assertFails(getDoc(doc(client(uid), 'incident/org-a')));
    await assertFails(getDoc(doc(client(uid), 'company/org-a')));
  }
  const memberDb = client('member-a');
  const batch = writeBatch(memberDb);
  batch.update(doc(memberDb, 'users/member-a'), { company_id: 'org-b' });
  batch.set(doc(memberDb, 'incident/batch-forgery'), { company_id: 'org-b' });
  await assertFails(batch.commit());
});

test('every company-scoped collection preserves CRUD but denies cross-tenant access and reassignment', async () => {
  const db = client('member-a');
  for (const name of tenantCollections) {
    await assertSucceeds(getDoc(doc(db, `${name}/org-a`)));
    await assertSucceeds(getDocs(query(collection(db, name), where('company_id', '==', 'org-a'))));
    await assertSucceeds(updateDoc(doc(db, `${name}/org-a`), { title: 'Updated' }));
    await assertSucceeds(setDoc(doc(db, `${name}/new`), { company_id: 'org-a' }));
    await assertSucceeds(deleteDoc(doc(db, `${name}/new`)));
    await assertFails(getDoc(doc(db, `${name}/org-b`)));
    await assertFails(setDoc(doc(db, `${name}/foreign`), { company_id: 'org-b' }));
    await assertFails(updateDoc(doc(db, `${name}/org-a`), { company_id: 'org-b' }));
    await assertFails(updateDoc(doc(db, `${name}/org-a`), { company_id: deleteField() }));
    await assertFails(deleteDoc(doc(db, `${name}/org-b`)));
  }
});

test('personal records cannot smuggle content into another tenant or transfer ownership', async () => {
  const db = client('member-a');
  for (const name of [...personalCollections, 'smart_consultation']) {
    await assertSucceeds(getDoc(doc(db, `${name}/own`)));
    await assertSucceeds(updateDoc(doc(db, `${name}/own`), { progress: 50 }));
    await assertFails(updateDoc(doc(db, `${name}/own`), { company_id: 'org-b' }));
    await assertFails(updateDoc(doc(db, `${name}/own`), { user_email: 'member-b@example.test' }));
    await assertFails(updateDoc(doc(db, `${name}/own`), { user_id: 'member-b' }));
    await assertFails(setDoc(doc(db, `${name}/foreign`), {
      user_email: 'member-a@example.test', user_id: 'member-a', company_id: 'org-b',
    }));
  }
  await assertSucceeds(setDoc(doc(db, 'notification/local'), { user_email: 'member-a@example.test', company_id: 'org-a' }));
  await assertFails(setDoc(doc(client('new', { email_verified: false }), 'notification/spoof'), { user_email: 'new@example.test' }));
});

test('V2 root and nested authority, evidence and audit stay browser-inaccessible even to claimed super admins', async () => {
  const paths = ['organizations/org-a', 'organizations/org-a/memberships/member-a',
    'organizations/org-a/provider_grants/member-a', 'organizations/org-a/evidence/e1',
    'organizations/org-a/audit_events/a1', 'organizations/org-a/observations/o1',
    'organizations/org-a/exercises/ex1/responses/r1'];
  for (const db of [client('member-a'), client('forged-admin'), client('operator', { is_super_admin: true }),
    rules.unauthenticatedContext().firestore()]) {
    for (const path of paths) {
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), { forged: true }));
      await assertFails(updateDoc(doc(db, path), { forged: true }));
      await assertFails(deleteDoc(doc(db, path)));
    }
  }
});
