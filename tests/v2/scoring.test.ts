import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateExerciseScore, canonicalJson } from '../../server/v2/scoring.js';
import { scoringFixture } from './fixtures.js';

test('score is derived from retained weighted inputs, not an opaque percentage', () => {
  const score = calculateExerciseScore(scoringFixture());
  assert.equal(score.result.score, 60);
  assert.equal(score.result.earned_weight, 6);
  assert.equal(score.result.planned_weight, 10);
  assert.equal(score.result.coverage_percent, 100);
  assert.equal(score.inputs.length, 4);
  assert.deepEqual(score.inputs.map(input => input.points), [1, 0, 0.5, 1]);
  assert.equal(score.capabilities[0]?.score, 60);
  assert.match(score.input_sha256, /^[a-f0-9]{64}$/);
});

test('replaying frozen inputs is deterministic and does not mutate them', () => {
  const fixture = scoringFixture();
  const before = structuredClone(fixture);
  assert.deepEqual(calculateExerciseScore(fixture), calculateExerciseScore(fixture));
  assert.deepEqual(fixture, before);
});

test('record ordering does not change input digest or result', () => {
  const fixture = scoringFixture();
  const expected = calculateExerciseScore(fixture);
  fixture.criteria.reverse();
  fixture.observations.reverse();
  fixture.evidence.reverse();
  fixture.expected_actions.reverse();
  assert.deepEqual(calculateExerciseScore(fixture), expected);
});

test('missing observations withhold readiness, but show provisional measured subset', () => {
  const fixture = scoringFixture();
  fixture.observations = fixture.observations.slice(0, 1);
  const score = calculateExerciseScore(fixture);
  assert.equal(score.result.score, null);
  assert.equal(score.result.provisional_score, 100);
  assert.equal(score.result.coverage_percent, 40);
  assert.equal(score.result.status, 'insufficient_evidence');
});

test('no observations is not tested, not zero and not a perfect score', () => {
  const fixture = scoringFixture();
  fixture.observations = [];
  const score = calculateExerciseScore(fixture);
  assert.equal(score.result.status, 'not_tested');
  assert.equal(score.result.score, null);
  assert.equal(score.result.provisional_score, null);
  assert.equal(score.result.coverage_percent, 0);
});

test('all observed failures can produce a valid zero', () => {
  const fixture = scoringFixture();
  fixture.observations[0]!.measurement = { kind: 'completion', completed: false, omission_observed: true };
  fixture.observations[2]!.measurement = { kind: 'quality', rating: 'fail' };
  fixture.observations[3]!.measurement = { kind: 'deadline', elapsed_ms: 900_001 };
  assert.equal(calculateExerciseScore(fixture).result.score, 0);
});

test('missing observation coverage cannot be manufactured by dropping a criterion', () => {
  const fixture = scoringFixture();
  fixture.criteria.splice(1, 1);
  fixture.observations.splice(1, 1);
  assert.throws(() => calculateExerciseScore(fixture), /SCENARIO_MANIFEST_MISMATCH/);
});

test('expected action manifest cannot be truncated', () => {
  const fixture = scoringFixture();
  fixture.expected_actions.pop();
  assert.throws(() => calculateExerciseScore(fixture), /SCENARIO_MANIFEST_MISMATCH/);
});

test('omission requires observation of omission, not merely no completion', () => {
  const fixture = scoringFixture();
  fixture.observations[0]!.measurement = { kind: 'completion', completed: false, omission_observed: false };
  const result = calculateExerciseScore(fixture);
  assert.equal(result.inputs[0]?.reason, 'omission_not_observed');
  assert.equal(result.result.score, null);
});

for (const source_kind of ['ai_advisory', 'simulation_artifact', 'legacy_import'] as const) {
  test(`${source_kind} is not evidence of participant performance`, () => {
    const fixture = scoringFixture();
    fixture.evidence[0]!.source_kind = source_kind;
    const result = calculateExerciseScore(fixture);
    assert.equal(result.result.score, null);
    assert.equal(result.inputs[0]?.reason, 'ineligible_evidence');
  });
}

for (const status of ['pending', 'quarantined', 'unavailable'] as const) {
  test(`${status} evidence cannot count toward readiness`, () => {
    const fixture = scoringFixture();
    fixture.evidence[0]!.status = status;
    assert.equal(calculateExerciseScore(fixture).result.score, null);
  });
}

for (const collection of ['evidence', 'observations', 'criteria', 'expected_actions'] as const) {
  test(`reject cross-tenant ${collection}`, () => {
    const fixture = scoringFixture();
    fixture[collection][0]!.organization_id = 'org-b';
    assert.throws(() => calculateExerciseScore(fixture), /TENANT_MISMATCH/);
  });
}

test('reject cross-tenant scenario', () => {
  const fixture = scoringFixture();
  fixture.scenario.organization_id = 'org-b';
  assert.throws(() => calculateExerciseScore(fixture), /TENANT_MISMATCH/);
});

test('reject missing evidence references instead of silently dropping them', () => {
  const fixture = scoringFixture();
  fixture.evidence = [];
  assert.throws(() => calculateExerciseScore(fixture), /DANGLING_EVIDENCE_REFERENCE/);
});

test('reject evidence from a different exercise inside the same tenant', () => {
  const fixture = scoringFixture();
  fixture.evidence[0]!.exercise_id = 'exercise-elsewhere';
  assert.throws(() => calculateExerciseScore(fixture), /EVIDENCE_EXERCISE_MISMATCH/);
});

test('reject duplicate accepted observations instead of selecting a favorable score', () => {
  const fixture = scoringFixture();
  fixture.observations.push({ ...fixture.observations[0]!, id: 'other-revision' });
  assert.throws(() => calculateExerciseScore(fixture), /AMBIGUOUS_OBSERVATION_REVISION/);
});

test('draft observation is excluded; accepted observation requires human attribution', () => {
  const fixture = scoringFixture();
  fixture.observations[0]!.status = 'draft';
  assert.equal(calculateExerciseScore(fixture).inputs[0]?.reason, 'observation_not_accepted');
  fixture.observations[0]!.status = 'accepted';
  fixture.observations[0]!.accepted_by_uid = null;
  assert.throws(() => calculateExerciseScore(fixture), /requires reviewer/);
});

test('reject superseded observation', () => {
  const fixture = scoringFixture();
  fixture.observations[0]!.status = 'superseded';
  assert.throws(() => calculateExerciseScore(fixture), /SUPERSEDED_OBSERVATION/);
});

test('reject mismatched measurement and out-of-range weights', () => {
  const fixture = scoringFixture();
  fixture.observations[0]!.measurement = { kind: 'sequence', followed: true };
  assert.throws(() => calculateExerciseScore(fixture), /MEASUREMENT_KIND_MISMATCH/);
  fixture.criteria[0]!.weight = -1;
  assert.throws(() => calculateExerciseScore(fixture));
});

test('policy version is explicit and unknown future policies are rejected', () => {
  const fixture = scoringFixture();
  fixture.exercise.scoring_policy_version = 'ai-chosen-policy';
  assert.throws(() => calculateExerciseScore(fixture), /UNSUPPORTED_SCORING_POLICY/);
});

test('running exercises and draft scenarios cannot become finalized scores', () => {
  const fixture = scoringFixture();
  fixture.exercise.state = 'running';
  assert.throws(() => calculateExerciseScore(fixture), /EXERCISE_NOT_REVIEWABLE/);
  fixture.exercise.state = 'review';
  fixture.scenario.state = 'draft';
  assert.throws(() => calculateExerciseScore(fixture), /SCENARIO_NOT_PUBLISHED/);
});

test('unknown observation stays unknown even with accepted evidence', () => {
  const fixture = scoringFixture();
  fixture.observations[0]!.measurement = { kind: 'unknown', reason: 'Capture unavailable' };
  assert.equal(calculateExerciseScore(fixture).inputs[0]?.reason, 'unknown_measurement');
});
test('an exercised capability with only unknown observations is insufficient, not untested', () => {
  const fixture = scoringFixture();
  fixture.observations.forEach(observation => {
    observation.measurement = { kind: 'unknown', reason: 'Capture unavailable' };
  });
  const result = calculateExerciseScore(fixture);
  assert.equal(result.result.status, 'insufficient_evidence');
  assert.equal(result.result.score, null);
  assert.equal(result.result.provisional_score, null);
});
test('an optional exploratory criterion cannot raise or dilute required score', () => {
  const fixture = scoringFixture();
  fixture.criteria[1]!.required = false;
  const result = calculateExerciseScore(fixture);
  assert.equal(result.result.score, 86);
  assert.equal(result.result.planned_weight, 7);
  assert.equal(result.inputs[1]?.included, false);
  assert.equal(result.inputs[1]?.reason, 'optional_not_in_required_score');
});
test('a declared capability cannot disappear from coverage because it has no criteria', () => {
  const fixture = scoringFixture();
  fixture.scenario.capability_ids.push('recovery');
  assert.throws(() => calculateExerciseScore(fixture), /CAPABILITY_HAS_NO_REQUIRED_CRITERIA/);
});

test('changed measurement generates a new input digest without rewriting old result', () => {
  const fixture = scoringFixture();
  const old = calculateExerciseScore(fixture);
  fixture.observations[1]!.measurement = { kind: 'sequence', followed: true };
  const corrected = calculateExerciseScore(fixture);
  assert.equal(old.result.score, 60);
  assert.equal(corrected.result.score, 90);
  assert.notEqual(old.input_sha256, corrected.input_sha256);
});

test('negative response time, duplicate evidence IDs and arbitrary score fields are rejected', () => {
  const fixture = scoringFixture();
  fixture.observations[3]!.measurement = { kind: 'deadline', elapsed_ms: -1 };
  assert.throws(() => calculateExerciseScore(fixture));
  const second = scoringFixture();
  second.observations[0]!.evidence_ids = ['evidence-1', 'evidence-1'];
  assert.throws(() => calculateExerciseScore(second), /Duplicate reference/);
  assert.throws(() => calculateExerciseScore({ ...scoringFixture(), score: 100 }));
});

test('canonical serialization rejects undefined and sorts object keys', () => {
  assert.equal(canonicalJson({ b: 2, a: 1 }), canonicalJson({ a: 1, b: 2 }));
  assert.throws(() => canonicalJson(undefined));
});
