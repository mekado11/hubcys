import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionRemediation, assertExerciseTransition, persistentGap } from '../../server/v2/lifecycle.js';
import { actionFixture, verificationFixture, scoringFixture, NOW } from './fixtures.js';

function requestFixture() {
  return {
    action: actionFixture(), next_state: 'ready_for_verification',
    expected_record_version: 1, now: NOW, actor_uid: 'owner', evidence: scoringFixture().evidence,
  };
}

test('completion becomes ready for verification, not verified or closed', () => {
  const result = transitionRemediation(requestFixture());
  assert.equal(result.action.state, 'ready_for_verification');
  assert.equal(result.action.record_version, 2);
  assert.equal(result.transition.verification_id, null);
  assert.equal('score' in result, false);
  assert.equal('readiness' in result, false);
  for (const next_state of ['verified', 'closed']) {
    assert.throws(() => transitionRemediation({ ...requestFixture(), next_state }), /INVALID_REMEDIATION_TRANSITION/);
  }
});
test('completion needs accepted evidence, assignment, and matching record version', () => {
  assert.throws(() => transitionRemediation({ ...requestFixture(), evidence: [] }), /COMPLETION_EVIDENCE_REQUIRED/);
  assert.throws(() => transitionRemediation({
    ...requestFixture(), action: { ...actionFixture(), owner_uid: null },
  }), /ACTION_OWNER_REQUIRED/);
  assert.throws(() => transitionRemediation({ ...requestFixture(), expected_record_version: 0 }), /RECORD_VERSION_CONFLICT/);
});
test('completion rejects cross-tenant evidence', () => {
  const request = requestFixture();
  request.evidence[0]!.organization_id = 'org-b';
  assert.throws(() => transitionRemediation(request), /TENANT_MISMATCH/);
});
test('verified transition requires independent scoped verification record', () => {
  const request = {
    ...requestFixture(), action: { ...actionFixture(), state: 'ready_for_verification' },
    next_state: 'verified', actor_uid: 'evaluator', verification: verificationFixture(),
  };
  assert.equal(transitionRemediation(request).action.state, 'verified');
  for (const patch of [
    { verifier_uid: 'owner' }, { verifier_uid: 'other' }, { action_id: 'other' },
    { finding_ids: ['other-finding'] }, { result: 'inconclusive' }, { result: 'fail' },
    { retest_exercise_id: 'other-exercise' }, { completed_at: '2026-09-24T00:00:00.000Z' },
  ]) {
    assert.throws(() => transitionRemediation({ ...request, verification: { ...verificationFixture(), ...patch } }));
  }
});
test('failed verification returns to work, never directly to closed', () => {
  const result = transitionRemediation({
    ...requestFixture(), action: { ...actionFixture(), state: 'ready_for_verification' },
    next_state: 'failed_verification', actor_uid: 'evaluator',
    verification: { ...verificationFixture(), result: 'fail' },
  });
  assert.equal(result.action.state, 'failed_verification');
  assert.throws(() => transitionRemediation({
    ...requestFixture(), action: { ...actionFixture(), state: 'failed_verification' }, next_state: 'closed',
  }), /INVALID_REMEDIATION_TRANSITION/);
});
test('closure still requires retained verification, not status alone', () => {
  const request = {
    ...requestFixture(), action: { ...actionFixture(), state: 'verified' }, next_state: 'closed', actor_uid: 'evaluator',
  };
  assert.throws(() => transitionRemediation(request), /VALID_INDEPENDENT_VERIFICATION_REQUIRED/);
  assert.equal(transitionRemediation({ ...request, verification: verificationFixture() }).action.state, 'closed');
});
test('all findings on an action must be covered by its verification', () => {
  assert.throws(() => transitionRemediation({
    ...requestFixture(), action: { ...actionFixture(), finding_ids: ['finding-1', 'finding-2'], state: 'ready_for_verification' },
    next_state: 'verified', actor_uid: 'evaluator', verification: verificationFixture(),
  }), /VALID_INDEPENDENT_VERIFICATION_REQUIRED/);
});
test('exercise transitions cannot skip review or reopen historical completion', () => {
  for (const [from, to] of [['draft', 'scheduled'], ['scheduled', 'ready'], ['ready', 'running'], ['running', 'paused'], ['paused', 'running'], ['running', 'review'], ['review', 'completed']]) {
    assert.doesNotThrow(() => assertExerciseTransition(from, to));
  }
  assert.throws(() => assertExerciseTransition('running', 'completed'));
  assert.throws(() => assertExerciseTransition('completed', 'running'));
  assert.throws(() => assertExerciseTransition('archived', 'draft'));
});

function occurrence(exercise_id: string, outcome: string, day: number) {
  return {
    organization_id: 'org-a', exercise_id, capability_id: 'evidence_preservation',
    obligation_key: 'preserve-before-reimage', scope_key: 'production',
    context_version_id: 'context-v1', scoring_policy_version: 'readiness-v1',
    finalized_at: `2026-09-${String(day).padStart(2, '0')}T00:00:00.000Z`, outcome,
  };
}
test('persistent gap counts distinct comparable failures; unknown does not erase failures', () => {
  const result = persistentGap([occurrence('ex-1', 'fail', 1), occurrence('ex-2', 'unknown', 2), occurrence('ex-3', 'fail', 3)]);
  assert.equal(result.persistent, true);
  assert.deepEqual(result.exercise_ids, ['ex-1', 'ex-3']);
});
test('qualifying pass clears current streak, not historical records', () => {
  const records = [occurrence('ex-1', 'fail', 1), occurrence('ex-2', 'fail', 2), occurrence('ex-3', 'pass', 3)];
  assert.equal(persistentGap(records).persistent, false);
  assert.equal(records.length, 3);
});
test('single failure and no data do not manufacture persistence', () => {
  assert.equal(persistentGap([occurrence('ex-1', 'fail', 1)]).persistent, false);
  assert.equal(persistentGap([]).persistent, false);
});
test('duplicate exercise recalculations cannot inflate persistent failures', () => {
  assert.throws(() => persistentGap([occurrence('ex-1', 'fail', 1), occurrence('ex-1', 'fail', 2)]), /DUPLICATE_EXERCISE_OCCURRENCE/);
});
test('cross-tenant, context, scope or obligation history cannot be compared silently', () => {
  const first = occurrence('ex-1', 'fail', 1);
  for (const patch of [{ organization_id: 'org-b' }, { scope_key: 'other' }, { context_version_id: 'new' }, { obligation_key: 'easier-action' }]) {
    assert.throws(() => persistentGap([first, { ...occurrence('ex-2', 'pass', 2), ...patch }]), /NON_COMPARABLE_OCCURRENCES/);
  }
});
test('conflicting simultaneous outcomes require explicit ordering, not favorable ID sorting', () => {
  assert.throws(() => persistentGap([
    occurrence('ex-1', 'fail', 1), occurrence('ex-2', 'pass', 1),
  ]), /AMBIGUOUS_OCCURRENCE_ORDER/);
});
