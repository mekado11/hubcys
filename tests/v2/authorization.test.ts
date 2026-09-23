import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeCommand } from '../../server/v2/authorization.js';
import { SubmitResponseCommand, CompleteRemediationCommand } from '../../shared/v2/contracts.js';
import { base, membership, NOW } from './fixtures.js';

function authFixture() {
  return {
    principal_uid: 'leader', organization_id: 'org-a', organization_status: 'active',
    permission: 'exercise:create', now: NOW, membership: membership(),
  };
}
function participant(roles: string[] = ['participant']) {
  return { ...base('participant-1'), exercise_id: 'exercise-1', uid: 'leader', roles, status: 'active' };
}

test('active readiness lead can create exercise', () => assert.doesNotThrow(() => authorizeCommand(authFixture())));
for (const role of ['participant', 'observer', 'auditor'] as const) {
  test(`${role} cannot create exercise`, () => {
    assert.throws(() => authorizeCommand({ ...authFixture(), membership: membership([role]) }), /FORBIDDEN/);
  });
}
for (const status of ['suspended', 'revoked'] as const) {
  test(`${status} membership is denied`, () => {
    assert.throws(() => authorizeCommand({ ...authFixture(), membership: { ...membership(), status } }), /FORBIDDEN/);
  });
}
test('suspended organization is denied', () => {
  assert.throws(() => authorizeCommand({ ...authFixture(), organization_status: 'suspended' }), /FORBIDDEN/);
});
test('forged tenant and mismatched principal are denied', () => {
  assert.throws(() => authorizeCommand({ ...authFixture(), organization_id: 'org-b' }), /FORBIDDEN/);
  assert.throws(() => authorizeCommand({ ...authFixture(), principal_uid: 'attacker' }), /FORBIDDEN/);
});
test('arbitrary legacy admin fields and permissions fail strict parsing', () => {
  assert.throws(() => authorizeCommand({
    ...authFixture(), membership: { ...membership(['participant']), is_super_admin: true },
  }), /FORBIDDEN/);
  assert.throws(() => authorizeCommand({ ...authFixture(), permission: '*' }), /FORBIDDEN/);
});
test('even organization admin must have facilitator assignment to release injects', () => {
  const request = { ...authFixture(), membership: membership(['organization_admin']), permission: 'inject:release', exercise_id: 'exercise-1' };
  assert.throws(() => authorizeCommand(request), /FORBIDDEN/);
  assert.doesNotThrow(() => authorizeCommand({ ...request, exercise_participant: participant(['facilitator']) }));
});
test('participant cannot release injects even with spoofed facilitator assignment alone', () => {
  assert.throws(() => authorizeCommand({
    ...authFixture(), membership: membership(['participant']), permission: 'inject:release',
    exercise_id: 'exercise-1', exercise_participant: participant(['facilitator']),
  }), /FORBIDDEN/);
});
test('response requires active enrollment in exact exercise under own identity', () => {
  const request = {
    ...authFixture(), permission: 'response:submit', membership: membership(['participant']),
    exercise_id: 'exercise-1', exercise_participant: participant(),
  };
  assert.doesNotThrow(() => authorizeCommand(request));
  for (const patch of [{ exercise_id: 'elsewhere' }, { uid: 'other' }, { organization_id: 'org-b' }, { status: 'withdrawn' }]) {
    assert.throws(() => authorizeCommand({ ...request, exercise_participant: { ...participant(), ...patch } }), /FORBIDDEN/);
  }
});
test('observer cannot respond', () => {
  assert.throws(() => authorizeCommand({
    ...authFixture(), permission: 'response:submit', membership: membership(['observer']),
    exercise_id: 'exercise-1', exercise_participant: participant(['observer']),
  }), /FORBIDDEN/);
});
test('participant can update only owned action', () => {
  const request = { ...authFixture(), permission: 'remediation:update', membership: membership(['participant']) };
  assert.throws(() => authorizeCommand(request), /FORBIDDEN/);
  assert.throws(() => authorizeCommand({ ...request, action_owner_uid: 'someone-else' }), /FORBIDDEN/);
  assert.doesNotThrow(() => authorizeCommand({ ...request, action_owner_uid: 'leader' }));
});
test('verification requires independent owner even for organization admin', () => {
  const request = { ...authFixture(), permission: 'verification:record', membership: membership(['organization_admin']) };
  assert.throws(() => authorizeCommand(request), /FORBIDDEN/);
  assert.throws(() => authorizeCommand({ ...request, verification_subject_owner_uid: 'leader' }), /FORBIDDEN/);
  assert.doesNotThrow(() => authorizeCommand({ ...request, verification_subject_owner_uid: 'someone-else' }));
});
test('provider customer grant is required, scoped, active, expiring and permission-limited', () => {
  const request = { ...authFixture(), membership: { ...membership(), organization_id: 'provider-a' } };
  const grant = {
    ...base('grant-1'), provider_organization_id: 'provider-a', subject_uid: 'leader',
    permissions: ['exercise:create'], status: 'active', expires_at: '2026-09-24T00:00:00.000Z',
  };
  assert.throws(() => authorizeCommand(request), /FORBIDDEN/);
  assert.doesNotThrow(() => authorizeCommand({ ...request, provider_grant: grant }));
  for (const patch of [
    { organization_id: 'org-b' }, { provider_organization_id: 'provider-b' },
    { subject_uid: 'other' }, { status: 'revoked' }, { permissions: ['report:read'] },
    { expires_at: NOW },
  ]) {
    assert.throws(() => authorizeCommand({ ...request, provider_grant: { ...grant, ...patch } }), /FORBIDDEN/);
  }
});
test('provider grant cannot amplify permissions beyond provider membership role', () => {
  assert.throws(() => authorizeCommand({
    ...authFixture(), membership: { ...membership(['observer']), organization_id: 'provider-a' },
    provider_grant: {
      ...base('grant-1'), provider_organization_id: 'provider-a', subject_uid: 'leader',
      permissions: ['exercise:create'], status: 'active', expires_at: '2026-09-24T00:00:00.000Z',
    },
  }), /FORBIDDEN/);
});
test('reports require class scope and restrict observers to executive view', () => {
  const request = { ...authFixture(), permission: 'report:read', membership: membership(['observer']) };
  assert.throws(() => authorizeCommand(request), /FORBIDDEN/);
  assert.throws(() => authorizeCommand({ ...request, report_class: 'audit_evidence' }), /FORBIDDEN/);
  assert.doesNotThrow(() => authorizeCommand({ ...request, report_class: 'executive_readiness' }));
});
test('command payloads reject caller-owned identity, tenant and truth fields', () => {
  const response = { exercise_id: 'ex-1', inject_release_id: 'release-1', content: 'Escalated', idempotency_key: 'request-1' };
  assert.doesNotThrow(() => SubmitResponseCommand.parse(response));
  for (const patch of [{ actor_uid: 'other' }, { organization_id: 'org-b' }, { received_at: NOW }, { score: 100 }]) {
    assert.throws(() => SubmitResponseCommand.parse({ ...response, ...patch }));
  }
  assert.throws(() => CompleteRemediationCommand.parse({
    action_id: 'action-1', expected_record_version: 1, evidence_ids: ['evidence-1'],
    idempotency_key: 'request-1', state: 'verified',
  }));
});
