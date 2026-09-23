import { z } from 'zod';
import {
  ActionState, Evidence, ExerciseState, Id, Instant, RemediationAction, Verification,
  assertTenant, uniqueById,
} from '../../shared/v2/contracts.js';

const exerciseTransitions: Record<z.infer<typeof ExerciseState>, readonly z.infer<typeof ExerciseState>[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['ready', 'cancelled'],
  ready: ['running', 'cancelled'],
  running: ['paused', 'review', 'aborted'],
  paused: ['running', 'review', 'aborted'],
  aborted: ['review'],
  review: ['completed'],
  completed: ['archived'],
  archived: [],
  cancelled: [],
};

export function assertExerciseTransition(from: unknown, to: unknown): void {
  const current = ExerciseState.parse(from);
  const next = ExerciseState.parse(to);
  if (!exerciseTransitions[current].includes(next)) throw new Error('INVALID_EXERCISE_TRANSITION');
}

const actionTransitions: Record<z.infer<typeof ActionState>, readonly z.infer<typeof ActionState>[]> = {
  open: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['blocked', 'ready_for_verification'],
  blocked: ['in_progress'],
  ready_for_verification: ['verified', 'failed_verification'],
  failed_verification: ['in_progress'],
  verified: ['closed'],
  closed: [],
};
const verificationEvidenceKinds = new Set(['participant_response', 'facilitator_observation', 'system_event', 'file']);
const TransitionRequest = z.object({
  action: RemediationAction,
  next_state: ActionState,
  expected_record_version: z.number().int().nonnegative(),
  now: Instant,
  actor_uid: Id,
  evidence: z.array(Evidence),
  verification: Verification.optional(),
}).strict();

/**
 * State invariant guard only. Caller must authorize the command and, for a
 * targeted retest, independently validate the linked retest outcome. This
 * function neither creates verification records nor changes readiness scores.
 */
export function transitionRemediation(raw: unknown) {
  const request = TransitionRequest.parse(raw);
  const { action, next_state, verification, evidence } = request;
  assertTenant(action.organization_id, [...evidence, ...(verification ? [verification] : [])]);
  if (action.record_version !== request.expected_record_version) throw new Error('RECORD_VERSION_CONFLICT');
  if (!actionTransitions[action.state].includes(next_state)) throw new Error('INVALID_REMEDIATION_TRANSITION');
  if (!action.owner_uid) throw new Error('ACTION_OWNER_REQUIRED');
  const evidenceMap = uniqueById(evidence);
  const validEvidence = (ids: string[]) => ids.length > 0 && ids.every(id => {
    const item = evidenceMap.get(id);
    return item && item.status === 'accepted' && verificationEvidenceKinds.has(item.source_kind);
  });
  if (next_state === 'ready_for_verification' && !validEvidence(action.completion_evidence_ids)) {
    throw new Error('COMPLETION_EVIDENCE_REQUIRED');
  }
  if (['verified', 'failed_verification', 'closed'].includes(next_state)) {
    if (!verification || verification.action_id !== action.id ||
        verification.verifier_uid === action.owner_uid ||
        verification.verifier_uid !== request.actor_uid ||
        verification.method !== action.verification_method ||
        verification.finding_ids.length !== action.finding_ids.length ||
        !action.finding_ids.every(id => verification.finding_ids.includes(id)) ||
        !validEvidence(verification.evidence_ids)) throw new Error('VALID_INDEPENDENT_VERIFICATION_REQUIRED');
    if (Date.parse(verification.completed_at) > Date.parse(request.now)) throw new Error('VERIFICATION_IN_FUTURE');
    if (next_state === 'failed_verification' && verification.result !== 'fail') throw new Error('VERIFICATION_RESULT_MISMATCH');
    if (next_state !== 'failed_verification' && verification.result !== 'pass') throw new Error('VERIFICATION_RESULT_MISMATCH');
    if (verification.method === 'targeted_retest' &&
        verification.evidence_ids.some(id => evidenceMap.get(id)?.exercise_id !== verification.retest_exercise_id)) {
      throw new Error('RETEST_EVIDENCE_SCOPE_MISMATCH');
    }
  }
  return {
    action: {
      ...action,
      state: next_state,
      record_version: action.record_version + 1,
    },
    // Return an event description; persistence must append it transactionally.
    transition: {
      actor_uid: request.actor_uid,
      occurred_at: request.now,
      from: action.state,
      to: next_state,
      verification_id: verification?.id ?? null,
    },
  };
}

const Occurrence = z.object({
  exercise_id: Id,
  organization_id: Id,
  capability_id: Id,
  obligation_key: Id,
  scope_key: Id,
  context_version_id: Id,
  scoring_policy_version: Id,
  finalized_at: Instant,
  outcome: z.enum(['pass', 'fail', 'unknown']),
}).strict();

/** Caller selects one comparable obligation cohort; never aggregate dissimilar scopes. */
export function persistentGap(raw: unknown) {
  const records = z.array(Occurrence).parse(raw);
  const ids = new Set<string>();
  const cohort = (record: z.infer<typeof Occurrence>) => JSON.stringify([
    record.organization_id, record.capability_id, record.obligation_key,
    record.scope_key, record.context_version_id, record.scoring_policy_version,
  ]);
  const first = records[0];
  for (const record of records) {
    if (ids.has(record.exercise_id)) throw new Error('DUPLICATE_EXERCISE_OCCURRENCE');
    ids.add(record.exercise_id);
    if (first && cohort(record) !== cohort(first)) throw new Error('NON_COMPARABLE_OCCURRENCES');
  }
  const ordered = [...records].sort((a, b) => {
    const delta = Date.parse(a.finalized_at) - Date.parse(b.finalized_at);
    return delta || a.exercise_id.localeCompare(b.exercise_id, 'en');
  });
  for (let i = 1; i < ordered.length; i++) {
    const previous = ordered[i - 1]!;
    const current = ordered[i]!;
    if (Date.parse(previous.finalized_at) === Date.parse(current.finalized_at) &&
        previous.outcome !== current.outcome) throw new Error('AMBIGUOUS_OCCURRENCE_ORDER');
  }
  const failures: string[] = [];
  for (const record of ordered) {
    if (record.outcome === 'pass') failures.length = 0;
    else if (record.outcome === 'fail') failures.push(record.exercise_id);
  }
  return { persistent: failures.length >= 2, consecutive_failures: failures.length, exercise_ids: failures };
}
