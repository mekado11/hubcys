import type { z } from 'zod';
import { Evidence, Exercise, ScenarioVersion, ExpectedAction, Criterion, Observation, Membership, RemediationAction, Verification } from '../../shared/v2/contracts.js';

export const NOW = '2026-09-23T08:00:00.000Z';
export function base(id: string) {
  return { id, organization_id: 'org-a', schema_version: 1 as const, created_at: NOW, created_by_uid: 'leader' };
}
export function scoringFixture() {
  const exercise: z.infer<typeof Exercise> = {
    ...base('exercise-1'), threat_id: 'ransomware', scenario_version_id: 'scenario-v1',
    context_version_id: 'context-v1', scoring_policy_version: 'readiness-v1',
    state: 'review', purpose: 'baseline', scope_key: 'production', record_version: 1,
  };
  const scenario: z.infer<typeof ScenarioVersion> = {
    ...base('scenario-v1'), scenario_id: 'ransomware-1', version: 1, state: 'published',
    threat_id: 'ransomware', capability_ids: ['evidence_preservation'],
    scoring_policy_version: 'readiness-v1',
    expected_action_ids: ['expected-1', 'expected-2', 'expected-3', 'expected-4'],
    criterion_ids: ['criterion-1', 'criterion-2', 'criterion-3', 'criterion-4'],
  };
  const expected_actions: z.infer<typeof ExpectedAction>[] = [1, 2, 3, 4].map(i => ({
    ...base(`expected-${i}`), scenario_version_id: scenario.id, capability_id: 'evidence_preservation',
    requirement: `Preservation requirement ${i}`, policy_version_id: null,
  }));
  const criterionBase = (i: number, weight: number) => ({
    ...base(`criterion-${i}`), scenario_version_id: scenario.id, expected_action_id: `expected-${i}`,
    capability_id: 'evidence_preservation' as const, weight, required: true, evidence_required: true as const,
  });
  const criteria: z.infer<typeof Criterion>[] = [
    { ...criterionBase(1, 4), kind: 'completion' },
    { ...criterionBase(2, 3), kind: 'sequence' },
    { ...criterionBase(3, 2), kind: 'quality', anchors: { fail: 'Not preserved', partial: 'Partially preserved', pass: 'Fully preserved' } },
    { ...criterionBase(4, 1), kind: 'deadline', max_elapsed_ms: 900_000 },
  ];
  const evidence: z.infer<typeof Evidence>[] = [1, 2, 3, 4].map(i => ({
    ...base(`evidence-${i}`), exercise_id: exercise.id, source_kind: 'participant_response',
    source_record_id: `response-${i}`, content_sha256: 'a'.repeat(64), status: 'accepted',
  }));
  const measurements: z.infer<typeof Observation>['measurement'][] = [
    { kind: 'completion', completed: true, omission_observed: false },
    { kind: 'sequence', followed: false },
    { kind: 'quality', rating: 'partial' },
    { kind: 'deadline', elapsed_ms: 900_000 },
  ];
  const observations: z.infer<typeof Observation>[] = [1, 2, 3, 4].map(i => ({
    ...base(`observation-${i}`), exercise_id: exercise.id, criterion_id: `criterion-${i}`,
    expected_action_id: `expected-${i}`, capability_id: 'evidence_preservation',
    status: 'accepted', accepted_by_uid: 'evaluator', accepted_at: NOW,
    measurement: measurements[i - 1]!, rationale: 'Reviewed against captured response',
    evidence_ids: [`evidence-${i}`],
  }));
  return { exercise, scenario, expected_actions, criteria, evidence, observations };
}

export function membership(roles: z.infer<typeof Membership>['roles'] = ['readiness_lead']) {
  return { ...base('membership-1'), uid: 'leader', roles, status: 'active' as const };
}
export function actionFixture(): z.infer<typeof RemediationAction> {
  return {
    ...base('action-1'), finding_ids: ['finding-1'], owner_uid: 'owner',
    state: 'in_progress', completion_evidence_ids: ['evidence-1'], due_at: NOW,
    verification_requirements: 'Preserve evidence in a targeted retest',
    verification_method: 'targeted_retest', record_version: 1,
  };
}
export function verificationFixture(): z.infer<typeof Verification> {
  return {
    ...base('verification-1'), action_id: 'action-1', finding_ids: ['finding-1'],
    verifier_uid: 'evaluator', method: 'targeted_retest', retest_exercise_id: 'exercise-1',
    result: 'pass', evidence_ids: ['evidence-1'], completed_at: NOW,
  };
}
