import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getServerFirestore, getServerAuth } from '../../server/security/firebase.js';
import { verifyRequestIdentity } from '../../server/security/identity.js';
import { executeExerciseCommand } from '../../server/v2/command-service.js';
import { getExerciseWorkspace } from '../../server/v2/workspace-query.js';
import commandHandler from '../../api/v2/commands.js';
import workspaceHandler from '../../api/v2/exercise.js';
import { base, NOW, scoringFixture } from '../v2/fixtures.js';

let rules: RulesTestEnvironment;
const db = getServerFirestore();
const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

before(async () => {
  assert.equal(process.env.FIREBASE_PROJECT_ID, 'demo-hubcys-v2');
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):8080$/);
  rules = await initializeTestEnvironment({
    projectId: 'demo-hubcys-v2',
    firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
});
beforeEach(async () => {
  await rules.clearFirestore();
  const fixture = scoringFixture();
  const root = db.collection('organizations').doc('org-a');
  const batch = db.batch();
  batch.set(root, { ...base('org-a'), name: 'Synthetic organization A', status: 'active' });
  batch.set(db.collection('organizations').doc('org-b'), {
    ...base('org-b'), organization_id: 'org-b', name: 'Synthetic organization B', status: 'active',
  });
  for (const uid of ['leader', ...participants, 'observer']) {
    batch.set(root.collection('memberships').doc(uid), {
      ...base(uid), uid, status: 'active',
      roles: uid === 'leader' ? ['readiness_lead'] : uid === 'observer' ? ['observer'] : ['participant'],
    });
  }
  batch.set(root.collection('scenario_versions').doc(fixture.scenario.id), fixture.scenario);
  batch.set(root.collection('context_versions').doc('context-v1'), {
    ...base('context-v1'), status: 'published', description: 'Synthetic context only',
  });
  for (const expected of fixture.expected_actions) {
    batch.set(root.collection('scenario_versions').doc(fixture.scenario.id).collection('expected_actions').doc(expected.id), expected);
  }
  for (const criterion of fixture.criteria) {
    batch.set(root.collection('scenario_versions').doc(fixture.scenario.id).collection('criteria').doc(criterion.id), criterion);
  }
  for (const id of ['inject-1', 'inject-hidden']) {
    batch.set(root.collection('scenario_versions').doc(fixture.scenario.id).collection('injects').doc(id), {
      ...base(id), scenario_version_id: fixture.scenario.id, title: `Synthetic ${id}`,
      artifact_type: 'siem_alert', content: `SIMULATED EXERCISE: ${id}`, simulation: true,
    });
  }
  // A legacy browser-editable flag must not grant ANY V2 access.
  batch.set(db.collection('users').doc('legacy-admin'), { is_super_admin: true, company_id: 'org-a' });
  await batch.commit();
});
after(async () => { await rules.cleanup(); });

function createCommand(key = 'create-1') {
  return {
    command: 'create_exercise', organization_id: 'org-a', idempotency_key: key,
    scenario_version_id: 'scenario-v1', context_version_id: 'context-v1', scope_key: 'synthetic-scope',
    participants: [
      { uid: 'leader', roles: ['facilitator', 'evaluator'] },
      ...participants.map(uid => ({ uid, roles: ['participant'] })),
    ],
  };
}
async function runningExercise() {
  let result = await executeExerciseCommand(db, 'leader', createCommand());
  for (const next_state of ['scheduled', 'ready', 'running']) {
    result = await executeExerciseCommand(db, 'leader', {
      command: 'transition_exercise', organization_id: 'org-a', exercise_id: result.exercise_id,
      expected_record_version: result.record_version, next_state, idempotency_key: `transition-${next_state}`,
    });
  }
  return result;
}
async function releasedExercise() {
  const exercise = await runningExercise();
  return executeExerciseCommand(db, 'leader', {
    command: 'release_inject', organization_id: 'org-a', exercise_id: exercise.exercise_id,
    expected_record_version: exercise.record_version, inject_definition_id: 'inject-1', idempotency_key: 'release-1',
  });
}
function responseCommand(exerciseId: unknown, uid = 'p1') {
  return {
    command: 'submit_response', organization_id: 'org-a', exercise_id: exerciseId,
    inject_release_id: 'inject-1', content: `Synthetic response from ${uid}`, idempotency_key: `response-${uid}`,
  };
}

test('all direct V2 reads and writes are denied, including legacy super-admin', async () => {
  for (const uid of ['leader', 'p1', 'legacy-admin', 'outsider']) {
    const client = rules.authenticatedContext(uid).firestore();
    const refs = [
      doc(client, 'organizations/org-a'),
      doc(client, 'organizations/org-a/memberships/leader'),
      doc(client, 'organizations/org-a/scenario_versions/scenario-v1'),
      doc(client, 'organizations/org-a/audit_events/forged'),
      doc(client, 'organizations/org-b/exercises/guessed-id'),
    ];
    for (const ref of refs) {
      await assertFails(getDoc(ref));
      await assertFails(setDoc(ref, { forged: true }));
      await assertFails(updateDoc(ref, { forged: true }));
      await assertFails(deleteDoc(ref));
    }
  }
  await assertFails(getDoc(doc(rules.unauthenticatedContext().firestore(), 'organizations/org-a')));
});

test('creation validates tenant membership, scenario manifest and participant ownership', async () => {
  const result = await executeExerciseCommand(db, 'leader', createCommand());
  const ref = db.doc(`organizations/org-a/exercises/${result.exercise_id}`);
  assert.equal((await ref.get()).data()?.created_by_uid, 'leader');
  assert.equal((await ref.collection('participants').get()).size, 7);
  await assert.rejects(executeExerciseCommand(db, 'p1', createCommand('denied')), /FORBIDDEN/);
  await assert.rejects(executeExerciseCommand(db, 'legacy-admin', createCommand('legacy-denied')), /FORBIDDEN/);
  await assert.rejects(executeExerciseCommand(db, 'leader', { ...createCommand(), organization_id: 'org-b' }), /FORBIDDEN/);
  const tampered = createCommand('parent-tampered');
  await db.doc('organizations/org-a/scenario_versions/scenario-v1/criteria/criterion-1').update({ organization_id: 'org-b' });
  await assert.rejects(executeExerciseCommand(db, 'leader', tampered), /TENANT_MISMATCH/);
});

test('six distinct employees persist independent responses, evidence, audit and receipts', async () => {
  const released = await releasedExercise();
  await Promise.all(participants.map(uid => executeExerciseCommand(db, uid, responseCommand(released.exercise_id, uid))));
  const root = db.doc('organizations/org-a');
  const responseRows = await root.collection('exercises').doc(String(released.exercise_id)).collection('responses').get();
  assert.equal(responseRows.size, 6);
  assert.deepEqual(responseRows.docs.map(doc => doc.data().actor_uid).sort(), participants);
  for (const doc of responseRows.docs) {
    assert.equal(doc.data().created_by_uid, doc.data().actor_uid);
    assert.match(doc.data().received_at, /^\d{4}-\d{2}-\d{2}T/);
    assert.notEqual(doc.data().received_at, NOW);
  }
  assert.equal((await root.collection('evidence').get()).size, 6);
  assert.equal((await root.collection('audit_events').get()).size, 11);
  assert.equal((await root.collection('outbox').get()).size, 11);
  assert.equal((await root.collection('command_receipts').get()).size, 11);
});

test('exercise creation rejects a published manifest the scorer cannot evaluate', async () => {
  const criterion = db.doc('organizations/org-a/scenario_versions/scenario-v1/criteria/criterion-1');
  await criterion.update({ capability_id: 'recovery' });
  await assert.rejects(executeExerciseCommand(db, 'leader', createCommand('wrong-capability')), /MANIFEST_MISMATCH/);
  assert.equal((await db.collection('organizations/org-a/exercises').get()).size, 0);
  assert.equal((await db.collection('organizations/org-a/audit_events').get()).size, 0);
});

test('retries and concurrent duplicates produce one logical response and reject payload reuse', async () => {
  const released = await releasedExercise();
  const command = responseCommand(released.exercise_id);
  const results = await Promise.all([executeExerciseCommand(db, 'p1', command), executeExerciseCommand(db, 'p1', command)]);
  assert.equal(results[0]!.response_id, results[1]!.response_id);
  assert.equal(results.filter(result => result.replayed).length, 1);
  assert.equal((await db.doc(`organizations/org-a/exercises/${released.exercise_id}`).collection('responses').get()).size, 1);
  await assert.rejects(executeExerciseCommand(db, 'p1', { ...command, content: 'Different payload' }), /IDEMPOTENCY_KEY_REUSED/);
});

test('unreleased inject, caller-supplied actor/time, and paused submissions cannot become evidence', async () => {
  const released = await releasedExercise();
  const before = (await db.collection('organizations/org-a/audit_events').get()).size;
  await assert.rejects(executeExerciseCommand(db, 'p1', {
    ...responseCommand(released.exercise_id), inject_release_id: 'inject-hidden',
  }), /INJECT_NOT_RELEASED/);
  for (const forged of [{ actor_uid: 'leader' }, { received_at: NOW }, { score: 100 }]) {
    await assert.rejects(executeExerciseCommand(db, 'p1', { ...responseCommand(released.exercise_id), ...forged }));
  }
  assert.equal((await db.collection('organizations/org-a/audit_events').get()).size, before);
  await executeExerciseCommand(db, 'leader', {
    command: 'transition_exercise', organization_id: 'org-a', exercise_id: released.exercise_id,
    expected_record_version: released.record_version, next_state: 'paused', idempotency_key: 'pause',
  });
  await assert.rejects(executeExerciseCommand(db, 'p1', responseCommand(released.exercise_id)), /EXERCISE_NOT_RUNNING/);
  assert.equal((await db.collection('organizations/org-a/evidence').get()).size, 0);
});

test('revoking membership blocks commands and receipt replays', async () => {
  const released = await releasedExercise();
  await executeExerciseCommand(db, 'p1', responseCommand(released.exercise_id));
  await db.doc('organizations/org-a/memberships/p1').update({ status: 'revoked' });
  await assert.rejects(executeExerciseCommand(db, 'p1', responseCommand(released.exercise_id)), /FORBIDDEN/);
  await assert.rejects(getExerciseWorkspace(db, 'p1', 'org-a', String(released.exercise_id)), /FORBIDDEN/);
});

test('participant workspace never includes unreleased definitions, rubric or other responses', async () => {
  const released = await releasedExercise();
  await executeExerciseCommand(db, 'p1', responseCommand(released.exercise_id));
  await executeExerciseCommand(db, 'p2', responseCommand(released.exercise_id, 'p2'));
  const workspace = await getExerciseWorkspace(db, 'p1', 'org-a', String(released.exercise_id));
  assert.equal(workspace.responses.length, 1);
  assert.equal(workspace.responses[0]?.actor_uid, 'p1');
  assert.equal(workspace.releases.length, 1);
  assert.equal(workspace.releases[0]?.artifact.simulation, true);
  assert.equal(JSON.stringify(workspace).includes('inject-hidden'), false);
  assert.equal('criteria' in workspace, false);
  const facilitator = await getExerciseWorkspace(db, 'leader', 'org-a', String(released.exercise_id));
  assert.equal(facilitator.responses.length, 2);
  await assert.rejects(getExerciseWorkspace(db, 'observer', 'org-a', String(released.exercise_id)), /FORBIDDEN/);
});

test('exercise assignment cannot elevate a participant into a reviewer', async () => {
  const exercise = await releasedExercise();
  await executeExerciseCommand(db, 'p1', responseCommand(exercise.exercise_id));
  await executeExerciseCommand(db, 'p2', responseCommand(exercise.exercise_id, 'p2'));
  await db.doc(`organizations/org-a/exercises/${exercise.exercise_id}/participants/p1`)
    .update({ roles: ['participant', 'facilitator', 'evaluator'] });
  const workspace = await getExerciseWorkspace(db, 'p1', 'org-a', String(exercise.exercise_id));
  assert.equal(workspace.responses.length, 1);
  assert.equal(workspace.responses[0]?.actor_uid, 'p1');
  await assert.rejects(executeExerciseCommand(db, 'p1', {
    command: 'release_inject', organization_id: 'org-a', exercise_id: exercise.exercise_id,
    inject_definition_id: 'inject-hidden', expected_record_version: exercise.record_version,
    idempotency_key: 'cannot-elevate',
  }), /FORBIDDEN/);
});

test('provider authority intersects customer grant, organization role and exercise assignment', async () => {
  const root = db.doc('organizations/org-a');
  await root.collection('memberships').doc('leader').delete();
  await db.doc('organizations/org-b/memberships/leader').set({
    ...base('leader'), organization_id: 'org-b', uid: 'leader',
    roles: ['readiness_lead'], status: 'active',
  });
  const grant = root.collection('provider_grants').doc('leader');
  const permissions = ['exercise:create', 'exercise:read', 'exercise:start', 'inject:release'];
  await grant.set({
    ...base('leader'), provider_organization_id: 'org-b', subject_uid: 'leader',
    permissions, status: 'active', expires_at: '2099-01-01T00:00:00.000Z',
  });
  const exercise = await releasedExercise();
  await executeExerciseCommand(db, 'p1', responseCommand(exercise.exercise_id));
  assert.equal((await getExerciseWorkspace(db, 'leader', 'org-a', String(exercise.exercise_id))).responses.length, 0);
  await grant.update({ permissions: [...permissions, 'exercise:review'] });
  assert.equal((await getExerciseWorkspace(db, 'leader', 'org-a', String(exercise.exercise_id))).responses.length, 1);
  await grant.update({ expires_at: '2000-01-01T00:00:00.000Z' });
  await assert.rejects(getExerciseWorkspace(db, 'leader', 'org-a', String(exercise.exercise_id)), /FORBIDDEN/);
  await grant.update({ expires_at: '2099-01-01T00:00:00.000Z', status: 'revoked' });
  await assert.rejects(executeExerciseCommand(db, 'leader', createCommand()), /FORBIDDEN/);
  await grant.update({ status: 'active' });
  await db.doc('organizations/org-b').update({ status: 'suspended' });
  await assert.rejects(executeExerciseCommand(db, 'leader', createCommand()), /FORBIDDEN/);
});

test('server API handlers use verified identity, gate activation and reject cross-tenant commands', async () => {
  const auth = getServerAuth();
  await auth.createUser({ uid: 'leader', email: 'leader@example.test', password: 'Synthetic-local-test-only-123!' });
  const signedIn = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'leader@example.test', password: 'Synthetic-local-test-only-123!', returnSecureToken: true }),
  }).then(response => response.json()) as { idToken: string };
  assert.ok(signedIn.idToken);
  async function invoke(handler: typeof commandHandler | typeof workspaceHandler, method: string, body?: unknown, query?: unknown) {
    const result = { code: 0, payload: undefined as unknown, headers: {} as Record<string, string> };
    const response = {
      setHeader(key: string, value: string) { result.headers[key] = value; },
      status(code: number) { result.code = code; return this; },
      json(payload: unknown) { result.payload = payload; },
    };
    const request = { method, headers: { authorization: `Bearer ${signedIn.idToken}` }, body, query };
    await handler(request as unknown as Parameters<typeof handler>[0], response as unknown as Parameters<typeof handler>[1]);
    return result;
  }
  const previous = process.env.HUBCYS_V2_ENABLED;
  try {
    delete process.env.HUBCYS_V2_ENABLED;
    assert.equal((await invoke(commandHandler, 'POST', createCommand())).code, 404);
    assert.equal((await db.collection('organizations/org-a/exercises').get()).size, 0);
    process.env.HUBCYS_V2_ENABLED = 'true';
    const result = await invoke(commandHandler, 'POST', createCommand());
    assert.equal(result.code, 200);
    assert.equal(result.headers['Cache-Control'], 'no-store');
    const payload = result.payload as { data: { exercise_id: string } };
    assert.equal((await invoke(workspaceHandler, 'GET', undefined, {
      organization_id: 'org-a', exercise_id: payload.data.exercise_id,
    })).code, 200);
    assert.equal((await invoke(commandHandler, 'POST', { ...createCommand('cross'), organization_id: 'org-b' })).code, 403);
    assert.equal((await invoke(commandHandler, 'POST', { ...createCommand('forged'), actor_uid: 'p1' })).code, 400);
    assert.equal((await invoke(commandHandler, 'GET')).code, 405);
    await auth.updateUser('leader', { disabled: true });
    assert.equal((await invoke(commandHandler, 'POST', createCommand())).code, 401);
  } finally {
    if (previous === undefined) delete process.env.HUBCYS_V2_ENABLED;
    else process.env.HUBCYS_V2_ENABLED = previous;
    await auth.deleteUser('leader');
  }
});

test('concurrent release commands do not double-release an inject', async () => {
  const running = await runningExercise();
  const command = {
    command: 'release_inject', organization_id: 'org-a', exercise_id: running.exercise_id,
    expected_record_version: running.record_version, inject_definition_id: 'inject-1',
  };
  const results = await Promise.allSettled([
    executeExerciseCommand(db, 'leader', { ...command, idempotency_key: 'release-a' }),
    executeExerciseCommand(db, 'leader', { ...command, idempotency_key: 'release-b' }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await db.collection(`organizations/org-a/exercises/${running.exercise_id}/releases`).get()).size, 1);
});

test('transaction failure leaves no response, evidence, audit or receipt partial state', async () => {
  const released = await releasedExercise();
  const root = db.doc('organizations/org-a');
  const command = responseCommand(released.exercise_id);
  const { createHash } = await import('node:crypto');
  const { canonicalJson } = await import('../../server/v2/scoring.js');
  const key = createHash('sha256').update(canonicalJson(['org-a', 'p1', command.idempotency_key])).digest('hex');
  // Synthetic write conflict after validation must roll back every write.
  await root.collection('audit_events').doc(key).create({ preexisting: true });
  await assert.rejects(executeExerciseCommand(db, 'p1', command));
  assert.equal((await root.collection('exercises').doc(String(released.exercise_id)).collection('responses').get()).size, 0);
  assert.equal((await root.collection('evidence').get()).size, 0);
  assert.equal((await root.collection('command_receipts').doc(key).get()).exists, false);
});

test('real Auth emulator identity verifies, and disabled identity is denied', async () => {
  const auth = getServerAuth();
  const uid = `auth-user-${Date.now()}`;
  const email = `${uid}@example.test`;
  const password = 'Synthetic-test-only-password1!';
  await auth.createUser({ uid, email, password });
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await response.json() as { idToken: string };
  assert.equal(response.status, 200);
  const identity = await verifyRequestIdentity({ authorization: `Bearer ${body.idToken}` });
  assert.equal(identity.uid, uid);
  await auth.updateUser(uid, { disabled: true });
  await assert.rejects(verifyRequestIdentity({ authorization: `Bearer ${body.idToken}` }), error => (error as { status?: number }).status === 401);
  await auth.deleteUser(uid);
});
