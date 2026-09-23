import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  Criterion, Evidence, Exercise, ExpectedAction, Observation, ScenarioVersion,
  assertTenant, uniqueById,
} from '../../shared/v2/contracts.js';

export const SCORING_POLICY_VERSION = 'readiness-v1';
const scorableSources = new Set(['participant_response', 'facilitator_observation', 'system_event', 'file']);

const ScoringRequest = z.object({
  exercise: Exercise,
  scenario: ScenarioVersion,
  expected_actions: z.array(ExpectedAction).min(1).max(500),
  criteria: z.array(Criterion).min(1).max(500),
  observations: z.array(Observation).max(500),
  evidence: z.array(Evidence).max(2000),
}).strict();

type CriterionRecord = z.infer<typeof Criterion>;
type ObservationRecord = z.infer<typeof Observation>;

export type ScoringInput = {
  criterion: CriterionRecord;
  observation: ObservationRecord | null;
  evidence: z.infer<typeof Evidence>[];
  included: boolean;
  points: number | null;
  reason: string;
};

function pointsFor(criterion: CriterionRecord, observation: ObservationRecord): number | null {
  const measurement = observation.measurement;
  if (measurement.kind === 'unknown') return null;
  if (criterion.kind !== measurement.kind) throw new Error('MEASUREMENT_KIND_MISMATCH');
  switch (measurement.kind) {
    case 'completion':
      return measurement.completed ? 1 : measurement.omission_observed ? 0 : null;
    case 'deadline':
      if (criterion.kind !== 'deadline') throw new Error('MEASUREMENT_KIND_MISMATCH');
      return measurement.elapsed_ms <= criterion.max_elapsed_ms ? 1 : 0;
    case 'sequence':
      return measurement.followed ? 1 : 0;
    case 'quality':
      return { fail: 0, partial: 0.5, pass: 1 }[measurement.rating];
  }
}

function aggregate(inputs: ScoringInput[]) {
  const required = inputs.filter(input => input.criterion.required);
  const plannedWeight = required.reduce((sum, input) => sum + input.criterion.weight, 0);
  const eligible = required.filter(input => input.included);
  const evaluatedWeight = eligible.reduce((sum, input) => sum + input.criterion.weight, 0);
  const earnedWeight = eligible.reduce((sum, input) => sum + input.criterion.weight * (input.points ?? 0), 0);
  const provisionalScore = evaluatedWeight > 0 ? Math.round(100 * earnedWeight / evaluatedWeight) : null;
  const complete = plannedWeight > 0 && evaluatedWeight === plannedWeight;
  const observed = required.some(input => input.observation !== null);
  return {
    status: complete ? 'scored' : observed ? 'insufficient_evidence' : 'not_tested',
    score: complete ? provisionalScore : null,
    provisional_score: provisionalScore,
    earned_weight: earnedWeight,
    evaluated_weight: evaluatedWeight,
    planned_weight: plannedWeight,
    coverage_percent: plannedWeight > 0 ? 100 * evaluatedWeight / plannedWeight : 0,
    unknown_criterion_ids: required.filter(input => !input.included).map(input => input.criterion.id),
  };
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b, 'en')).map(
      ([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`,
    ).join(',')}}`;
  }
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error('UNSERIALIZABLE_SCORE_INPUT');
  return json;
}

/** Shared by publication/creation boundaries and scoring; records are schema-validated first. */
export function validateScenarioManifest(
  scenario: z.infer<typeof ScenarioVersion>,
  expectedActions: z.infer<typeof ExpectedAction>[],
  criteria: CriterionRecord[],
) {
  assertTenant(scenario.organization_id, [...expectedActions, ...criteria]);
  if (scenario.state !== 'published') throw new Error('SCENARIO_NOT_PUBLISHED');
  if (scenario.scoring_policy_version !== SCORING_POLICY_VERSION) throw new Error('UNSUPPORTED_SCORING_POLICY');
  const actionMap = uniqueById(expectedActions);
  const criteriaMap = uniqueById(criteria);
  const matches = (ids: string[], records: Map<string, unknown>) =>
    ids.length === records.size && ids.every(id => records.has(id));
  if (!matches(scenario.expected_action_ids, actionMap) || !matches(scenario.criterion_ids, criteriaMap)) {
    throw new Error('SCENARIO_MANIFEST_MISMATCH');
  }
  for (const action of expectedActions) {
    if (action.scenario_version_id !== scenario.id || !scenario.capability_ids.includes(action.capability_id)) {
      throw new Error('EXPECTED_ACTION_SCOPE_MISMATCH');
    }
  }
  for (const criterion of criteria) {
    const action = actionMap.get(criterion.expected_action_id);
    if (!action || action.capability_id !== criterion.capability_id ||
        criterion.scenario_version_id !== scenario.id || !scenario.capability_ids.includes(criterion.capability_id)) {
      throw new Error('CRITERION_SCOPE_MISMATCH');
    }
  }
  for (const capability of scenario.capability_ids) {
    if (!criteria.some(criterion => criterion.capability_id === capability && criterion.required)) {
      throw new Error('CAPABILITY_HAS_NO_REQUIRED_CRITERIA');
    }
  }
  return criteriaMap;
}

/**
 * Pure domain calculation. Call ONLY with server-loaded records from an
 * authorized command; this function is not a persistence or authorization API.
 * Returns input records separately from results for auditable persistence.
 */
export function calculateExerciseScore(raw: unknown) {
  const request = ScoringRequest.parse(raw);
  const { exercise, scenario, expected_actions, criteria, observations, evidence } = request;
  assertTenant(exercise.organization_id, [scenario, ...expected_actions, ...criteria, ...observations, ...evidence]);
  if (!['review', 'completed'].includes(exercise.state)) throw new Error('EXERCISE_NOT_REVIEWABLE');
  if (scenario.state !== 'published') throw new Error('SCENARIO_NOT_PUBLISHED');
  if (exercise.scenario_version_id !== scenario.id || exercise.threat_id !== scenario.threat_id) {
    throw new Error('SCENARIO_MISMATCH');
  }
  if (exercise.scoring_policy_version !== SCORING_POLICY_VERSION ||
      scenario.scoring_policy_version !== SCORING_POLICY_VERSION) throw new Error('UNSUPPORTED_SCORING_POLICY');

  const criteriaMap = validateScenarioManifest(scenario, expected_actions, criteria);
  const evidenceMap = uniqueById(evidence);
  uniqueById(observations);
  const observationMap = new Map<string, ObservationRecord>();
  for (const item of evidence) {
    if (item.exercise_id !== exercise.id) throw new Error('EVIDENCE_EXERCISE_MISMATCH');
  }
  for (const observation of observations) {
    const criterion = criteriaMap.get(observation.criterion_id);
    if (!criterion || observation.exercise_id !== exercise.id ||
        observation.expected_action_id !== criterion.expected_action_id ||
        observation.capability_id !== criterion.capability_id) throw new Error('OBSERVATION_SCOPE_MISMATCH');
    if (observation.status === 'superseded') throw new Error('SUPERSEDED_OBSERVATION');
    if (observationMap.has(observation.criterion_id)) throw new Error('AMBIGUOUS_OBSERVATION_REVISION');
    for (const id of observation.evidence_ids) {
      if (!evidenceMap.has(id)) throw new Error('DANGLING_EVIDENCE_REFERENCE');
    }
    observationMap.set(observation.criterion_id, observation);
  }

  const inputs: ScoringInput[] = [...criteria].sort((a, b) => a.id.localeCompare(b.id, 'en')).map(criterion => {
    const storedObservation = observationMap.get(criterion.id);
    const observation = storedObservation
      ? { ...storedObservation, evidence_ids: [...storedObservation.evidence_ids].sort() } : null;
    const linkedEvidence = (observation?.evidence_ids ?? []).map(id => evidenceMap.get(id)!);
    let reason = 'evaluated';
    let points: number | null = null;
    if (!criterion.required) reason = 'optional_not_in_required_score';
    else if (!observation) reason = 'no_observation';
    else if (observation.status !== 'accepted') reason = 'observation_not_accepted';
    else if (!linkedEvidence.length) reason = 'missing_required_evidence';
    else if (linkedEvidence.some(item => item.status !== 'accepted' || !scorableSources.has(item.source_kind))) {
      reason = 'ineligible_evidence';
    } else {
      points = pointsFor(criterion, observation);
      if (points === null) reason = observation.measurement.kind === 'unknown' ? 'unknown_measurement' : 'omission_not_observed';
    }
    return { criterion, observation, evidence: linkedEvidence, included: points !== null, points, reason };
  });
  const capabilities = [...scenario.capability_ids].sort().map(capability_id => ({
    capability_id,
    ...aggregate(inputs.filter(input => input.criterion.capability_id === capability_id)),
  }));
  const input_sha256 = createHash('sha256').update(canonicalJson({
    policy_version: SCORING_POLICY_VERSION, exercise, scenario,
    expected_actions: [...expected_actions].sort((a, b) => a.id.localeCompare(b.id, 'en')),
    inputs,
  })).digest('hex');
  return {
    organization_id: exercise.organization_id,
    exercise_id: exercise.id,
    policy_version: SCORING_POLICY_VERSION,
    input_sha256,
    inputs,
    result: aggregate(inputs),
    capabilities,
  };
}
