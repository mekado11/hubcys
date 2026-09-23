import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getServerAuth, getServerFirestore } from '../../server/security/firebase.js';
import { auditLegacyAdmins, inspectAccount, planMembership, planOperatorClaim, planProvisionOrganization } from '../../server/v2/operator.js';
import { getExerciseSetup } from '../../server/v2/exercise-setup.js';
import { getReadinessContext } from '../../server/v2/readiness-query.js';
import { AuditEvent, Membership } from '../../shared/v2/contracts.js';
import { ContextVersion, Organization } from '../../shared/v2/commands.js';
import { run } from '../../scripts/operator.js';

const auth = getServerAuth();
const db = getServerFirestore();
const NOW = '2026-09-23T12:00:00.000Z';
const ORG = 'op-org';

async function user(uid: string, opts: { verified?: boolean; claims?: Record<string, unknown> } = {}) {
  try { await auth.deleteUser(uid); } catch { /* fresh */ }
  await auth.createUser({ uid, email: `${uid}@example.test`, emailVerified: opts.verified ?? true });
  if (opts.claims) await auth.setCustomUserClaims(uid, opts.claims);
}
async function clearOrg() {
  await db.recursiveDelete(db.doc(`organizations/${ORG}`));
  await db.doc('users/owner').delete();
}
const provision = (actorUid = 'operator', name = 'Operator test org') => planProvisionOrganization(auth, db, {
  organizationId: ORG, name, contextDescription: 'Synthetic context only', actorUid, now: NOW,
});
const member = (uid: string, roles: string[], actorUid = 'operator') =>
  planMembership(auth, db, { organizationId: ORG, uid, roles, actorUid, now: NOW });

beforeEach(async () => {
  await clearOrg();
  await user('operator', { claims: { is_super_admin: true } });
  await user('owner', { claims: { unrelated: 'keep' } });
  await user('unverified', { verified: false });
});

test('operator claim: dry run writes nothing, apply preserves unrelated claims, revoke removes and revokes tokens', async () => {
  const plan = await planOperatorClaim(auth, 'owner', true);
  assert.equal(plan.changes.length, 1);
  assert.deepEqual((await auth.getUser('owner')).customClaims, { unrelated: 'keep' }, 'planning is read-only');
  await plan.apply();
  assert.deepEqual((await auth.getUser('owner')).customClaims, { unrelated: 'keep', is_super_admin: true });
  assert.equal((await planOperatorClaim(auth, 'owner', true)).changes.length, 0, 'idempotent');

  const before = (await auth.getUser('owner')).tokensValidAfterTime;
  await new Promise(resolve => setTimeout(resolve, 1100));
  await (await planOperatorClaim(auth, 'owner', false)).apply();
  const after = await auth.getUser('owner');
  assert.deepEqual(after.customClaims, { unrelated: 'keep' });
  assert.notEqual(after.tokensValidAfterTime, before, 'existing sessions are revoked');
});

test('operator claim is refused for unverified or unknown accounts', async () => {
  await assert.rejects(planOperatorClaim(auth, 'unverified', true), { code: 'EMAIL_NOT_VERIFIED' });
  await assert.rejects(planOperatorClaim(auth, 'nobody', true), { code: 'USER_NOT_FOUND' });
});

test('organization provisioning requires a claimed operator, validates records, audits, and never overwrites', async () => {
  await assert.rejects(provision('owner'), { code: 'ACTOR_NOT_OPERATOR' });
  // A forged profile flag is not authority.
  await db.doc('users/owner').set({ is_super_admin: true, company_id: ORG });
  await assert.rejects(provision('owner'), { code: 'ACTOR_NOT_OPERATOR' });

  const plan = await provision();
  assert.equal(plan.changes.length, 2);
  assert.equal((await db.doc(`organizations/${ORG}`).get()).exists, false, 'dry run is read-only');
  await plan.apply();
  Organization.parse((await db.doc(`organizations/${ORG}`).get()).data());
  ContextVersion.parse((await db.doc(`organizations/${ORG}/context_versions/context-v1`).get()).data());
  const audit = await db.collection(`organizations/${ORG}/audit_events`).get();
  assert.equal(audit.size, 1);
  const event = audit.docs[0]!.data();
  AuditEvent.parse(Object.fromEntries(Object.entries(event).filter(([k]) => !['changed_paths', 'source'].includes(k))));
  assert.equal(event.actor_uid, 'operator');
  assert.deepEqual(event.changed_paths, [`organizations/${ORG}`, `organizations/${ORG}/context_versions/context-v1`]);

  assert.equal((await provision()).changes.length, 0, 'second run is a no-op');
  await assert.rejects(provision('operator', 'Renamed org'), { code: 'ORGANIZATION_EXISTS_WITH_DIFFERENT_NAME' });
});

test('membership provisioning validates the member, roles and organization, and is optimistic and audited', async () => {
  await assert.rejects(member('owner', ['readiness_lead']), { code: 'ORGANIZATION_NOT_FOUND' });
  await (await provision()).apply();
  await assert.rejects(member('unverified', ['participant']), { code: 'EMAIL_NOT_VERIFIED' });
  await assert.rejects(member('owner', ['superuser']));
  await assert.rejects(member('owner', ['participant', 'participant']), { code: 'INVALID_ROLES' });
  await assert.rejects(member('owner', ['readiness_lead'], 'owner'), { code: 'ACTOR_NOT_OPERATOR' });

  const create = await member('owner', ['readiness_lead']);
  assert.equal(create.action, 'membership.create');
  await create.apply();
  const stored = Membership.parse((await db.doc(`organizations/${ORG}/memberships/owner`).get()).data());
  assert.deepEqual([stored.uid, stored.status, stored.roles], ['owner', 'active', ['readiness_lead']]);
  assert.equal((await member('owner', ['readiness_lead'])).changes.length, 0);

  const stale = await member('owner', ['readiness_lead', 'evaluator']);
  await db.doc(`organizations/${ORG}/memberships/owner`).update({ status: 'suspended' });
  await assert.rejects(stale.apply(), { code: 'MEMBERSHIP_CHANGED_SINCE_PLAN' });
  await (await member('owner', ['readiness_lead', 'evaluator'])).apply();
  const updated = Membership.parse((await db.doc(`organizations/${ORG}/memberships/owner`).get()).data());
  assert.deepEqual([updated.status, updated.roles, updated.created_at], ['active', ['readiness_lead', 'evaluator'], NOW]);
  assert.equal((await db.collection(`organizations/${ORG}/audit_events`).get()).size, 3);
});

test('a provisioned readiness lead is recognized by the existing V2 read and setup paths', async () => {
  await (await provision()).apply();
  await (await member('owner', ['readiness_lead'])).apply();
  const context = await getReadinessContext(db, 'owner') as { organizations?: { id?: string; organization_id?: string }[] };
  assert.ok(JSON.stringify(context).includes(ORG), 'organization is discoverable by the member');
  const setup = await getExerciseSetup(db, 'owner', ORG);
  assert.equal(setup.organization_name, 'Operator test org');
  assert.equal(setup.context_description, 'Synthetic context only');
  assert.deepEqual(setup.members, [{ uid: 'owner', roles: ['readiness_lead'] }]);
});

test('inspect reports authority facts and flags forged legacy profile fields without trusting them', async () => {
  await db.doc('users/owner').set({ is_super_admin: true, company_id: 'legacy-co', role: 'admin' });
  const report = await inspectAccount(auth, db, { email: 'owner@example.test' });
  assert.equal(report.auth.operator_claim, false);
  assert.equal(report.legacy_profile?.untrusted_profile_super_admin_flag, true);
  assert.equal(report.legacy_profile?.company_id, 'legacy-co');
  assert.deepEqual(report.v2_memberships, []);
});

test('CLI refuses a project mismatch and defaults to dry run', async () => {
  const lines: string[] = [];
  await assert.rejects(run(['grant-operator', '--project', 'hubcys-prod', '--uid', 'owner'], l => lines.push(l)),
    (error: { code?: string }) => String(error.code).startsWith('PROJECT_MISMATCH'));
  await run(['grant-operator', '--project', 'demo-hubcys-v2', '--uid', 'owner'], l => lines.push(l));
  assert.match(lines.join('\n'), /"mode": "dry-run"/);
  assert.deepEqual((await auth.getUser('owner')).customClaims, { unrelated: 'keep' });
  await run(['grant-operator', '--project', 'demo-hubcys-v2', '--uid', 'owner', '--apply'], l => lines.push(l));
  assert.equal((await auth.getUser('owner')).customClaims?.is_super_admin, true);
});

test('legacy admin audit lists profile-flagged accounts with their real claim state', async () => {
  await db.doc('users/owner').set({ is_super_admin: true, company_id: 'legacy-co' });
  await db.doc('users/operator').set({ is_super_admin: true });
  await db.doc('users/ghost').set({ is_super_admin: true });
  const report = await auditLegacyAdmins(auth, db);
  const byUid = Object.fromEntries(report.accounts.map(row => [row.uid, row]));
  assert.equal(byUid.owner?.operator_claim, false);
  assert.equal(byUid.owner?.company_id, 'legacy-co');
  assert.equal(byUid.operator?.operator_claim, true);
  assert.equal(byUid.ghost?.auth_account_exists, false);
  await db.doc('users/operator').delete();
  await db.doc('users/ghost').delete();
});
