import { z } from 'zod';

// These contracts are additive and are NOT the schema for legacy collections.
export const Id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/);
export const Instant = z.string().datetime();
export const Digest = z.string().regex(/^[a-f0-9]{64}$/);
export const NonEmptyText = z.string().trim().min(1).max(20_000);
const uniqueIds = z.array(Id).max(500).refine(ids => new Set(ids).size === ids.length, 'Duplicate reference');

export const CapabilityId = z.enum([
  'detection', 'triage', 'escalation', 'incident_command',
  'identity_containment', 'endpoint_containment', 'network_containment',
  'cloud_containment', 'evidence_preservation', 'threat_investigation',
  'internal_communication', 'executive_communication', 'legal_coordination',
  'regulatory_response', 'third_party_coordination', 'business_continuity',
  'recovery', 'lessons_learned',
]);
export const ThreatId = z.enum([
  'ransomware', 'business_email_compromise', 'oauth_device_code_compromise',
  'credential_compromise', 'privileged_account_compromise', 'identity_compromise',
  'insider_threat', 'data_exfiltration', 'cloud_compromise',
  'third_party_compromise', 'supply_chain_compromise', 'destructive_malware',
]);
export const Role = z.enum([
  'organization_admin', 'readiness_lead', 'facilitator', 'evaluator',
  'participant', 'observer', 'auditor',
]);
export const Permission = z.enum([
  'organization:manage', 'exercise:create', 'exercise:read', 'exercise:review', 'exercise:start', 'inject:release',
  'response:submit', 'observation:accept', 'remediation:assign',
  'remediation:update', 'verification:record', 'report:read', 'report:export',
]);
export type PermissionName = z.infer<typeof Permission>;

export const TenantRecord = z.object({
  id: Id,
  organization_id: Id,
  schema_version: z.literal(1),
  created_at: Instant,
  created_by_uid: Id,
}).strict();

export const Membership = TenantRecord.extend({
  uid: Id,
  roles: z.array(Role).min(1).max(7).refine(r => new Set(r).size === r.length, 'Duplicate role'),
  status: z.enum(['active', 'suspended', 'revoked']),
}).strict();

export const ProviderGrant = TenantRecord.extend({
  provider_organization_id: Id,
  subject_uid: Id,
  permissions: z.array(Permission).min(1),
  status: z.enum(['active', 'revoked']),
  expires_at: Instant,
}).strict();

export const ExerciseRole = z.enum(['facilitator', 'participant', 'observer', 'evaluator']);
export const ExerciseParticipant = TenantRecord.extend({
  exercise_id: Id,
  uid: Id,
  roles: z.array(ExerciseRole).min(1).max(4),
  status: z.enum(['invited', 'active', 'withdrawn']),
}).strict();

export const ExerciseState = z.enum([
  'draft', 'scheduled', 'ready', 'running', 'paused', 'review',
  'completed', 'archived', 'cancelled', 'aborted',
]);
export const Exercise = TenantRecord.extend({
  threat_id: ThreatId,
  scenario_version_id: Id,
  context_version_id: Id,
  scoring_policy_version: Id,
  state: ExerciseState,
  purpose: z.enum(['baseline', 'exercise', 'retest']),
  scope_key: Id,
  record_version: z.number().int().nonnegative(),
}).strict();

export const ScenarioVersion = TenantRecord.extend({
  scenario_id: Id,
  version: z.number().int().positive(),
  state: z.enum(['draft', 'published', 'retired']),
  threat_id: ThreatId,
  capability_ids: z.array(CapabilityId).min(1).refine(
    ids => new Set(ids).size === ids.length, 'Duplicate capability',
  ),
  expected_action_ids: uniqueIds.refine(ids => ids.length > 0),
  criterion_ids: uniqueIds.refine(ids => ids.length > 0),
  scoring_policy_version: Id,
}).strict();

export const ExpectedAction = TenantRecord.extend({
  scenario_version_id: Id,
  capability_id: CapabilityId,
  requirement: NonEmptyText,
  policy_version_id: Id.nullable(),
}).strict();

const criterionBase = TenantRecord.extend({
  scenario_version_id: Id,
  expected_action_id: Id,
  capability_id: CapabilityId,
  weight: z.number().int().min(1).max(100),
  required: z.boolean(),
  evidence_required: z.literal(true),
});
export const Criterion = z.discriminatedUnion('kind', [
  criterionBase.extend({ kind: z.literal('completion') }).strict(),
  criterionBase.extend({
    kind: z.literal('deadline'), max_elapsed_ms: z.number().int().nonnegative().max(604_800_000),
  }).strict(),
  criterionBase.extend({ kind: z.literal('sequence') }).strict(),
  criterionBase.extend({
    kind: z.literal('quality'),
    anchors: z.object({ fail: NonEmptyText, partial: NonEmptyText, pass: NonEmptyText }).strict(),
  }).strict(),
]);

export const Measurement = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('completion'), completed: z.boolean(), omission_observed: z.boolean(),
  }).strict(),
  z.object({
    kind: z.literal('deadline'), elapsed_ms: z.number().int().nonnegative().max(604_800_000),
  }).strict(),
  z.object({ kind: z.literal('sequence'), followed: z.boolean() }).strict(),
  z.object({
    kind: z.literal('quality'), rating: z.enum(['fail', 'partial', 'pass']),
  }).strict(),
  z.object({ kind: z.literal('unknown'), reason: NonEmptyText }).strict(),
]);

export const Evidence = TenantRecord.extend({
  exercise_id: Id,
  source_kind: z.enum([
    'participant_response', 'facilitator_observation', 'system_event',
    'file', 'legacy_import', 'ai_advisory', 'simulation_artifact',
  ]),
  source_record_id: Id,
  content_sha256: Digest,
  status: z.enum(['accepted', 'pending', 'quarantined', 'unavailable']),
}).strict();

export const Observation = TenantRecord.extend({
  exercise_id: Id,
  criterion_id: Id,
  expected_action_id: Id,
  capability_id: CapabilityId,
  status: z.enum(['draft', 'accepted', 'superseded']),
  accepted_by_uid: Id.nullable(),
  accepted_at: Instant.nullable(),
  measurement: Measurement,
  rationale: NonEmptyText,
  evidence_ids: uniqueIds,
}).strict().superRefine((record, ctx) => {
  if (record.status === 'accepted' && (!record.accepted_at || !record.accepted_by_uid)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Accepted observation requires reviewer and time' });
  }
  if (record.accepted_at && Date.parse(record.accepted_at) < Date.parse(record.created_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Acceptance cannot precede observation creation' });
  }
});

export const InjectRelease = TenantRecord.extend({
  exercise_id: Id,
  inject_definition_id: Id,
  released_at: Instant,
  sequence: z.number().int().nonnegative(),
}).strict();

export const Response = TenantRecord.extend({
  exercise_id: Id,
  inject_release_id: Id,
  actor_uid: Id,
  received_at: Instant,
  content: NonEmptyText,
  receipt_id: Id,
}).strict();

export const Finding = TenantRecord.extend({
  exercise_id: Id,
  threat_id: ThreatId,
  capability_id: CapabilityId,
  scope_key: Id,
  observation_ids: uniqueIds.refine(ids => ids.length > 0, 'Finding requires observation'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  state: z.enum(['open', 'under_remediation', 'awaiting_verification', 'verified', 'closed', 'risk_accepted']),
}).strict();

export const ActionState = z.enum([
  'open', 'assigned', 'in_progress', 'blocked', 'ready_for_verification',
  'verified', 'failed_verification', 'closed',
]);
export const RemediationAction = TenantRecord.extend({
  finding_ids: uniqueIds.refine(ids => ids.length > 0, 'Action requires finding'),
  owner_uid: Id.nullable(),
  state: ActionState,
  completion_evidence_ids: uniqueIds,
  due_at: Instant.nullable(),
  verification_requirements: NonEmptyText,
  verification_method: z.enum(['document_review', 'targeted_retest']),
  record_version: z.number().int().nonnegative(),
}).strict();

export const RetestRequest = TenantRecord.extend({
  baseline_exercise_id: Id,
  retest_exercise_id: Id,
  finding_ids: uniqueIds.refine(ids => ids.length > 0),
  action_ids: uniqueIds.refine(ids => ids.length > 0),
  targets: z.array(z.object({
    baseline_criterion_id: Id,
    retest_criterion_id: Id,
    capability_id: CapabilityId,
  }).strict()).min(1).max(500),
  scope_key: Id,
  context_version_id: Id,
}).strict();

export const Verification = TenantRecord.extend({
  action_id: Id,
  finding_ids: uniqueIds.refine(ids => ids.length > 0),
  verifier_uid: Id,
  method: z.enum(['document_review', 'targeted_retest']),
  retest_exercise_id: Id.nullable(),
  result: z.enum(['pass', 'fail', 'inconclusive']),
  evidence_ids: uniqueIds.refine(ids => ids.length > 0),
  completed_at: Instant,
}).strict().superRefine((record, ctx) => {
  if (record.method === 'targeted_retest' && !record.retest_exercise_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Capability verification requires retest' });
  }
});

export const ReportClass = z.enum(['executive_readiness', 'exercise_after_action', 'operational_readiness', 'audit_evidence']);
export const ReportSnapshot = TenantRecord.extend({
  report_class: ReportClass,
  as_of: Instant,
  score_run_ids: uniqueIds,
  finding_ids: uniqueIds,
  action_ids: uniqueIds,
  verification_ids: uniqueIds,
  evidence_ids: uniqueIds,
  manifest_sha256: Digest,
}).strict();

export const AdvisoryOutput = TenantRecord.extend({
  kind: z.enum(['scenario', 'inject', 'summary', 'finding_suggestion', 'remediation_suggestion', 'retest_recommendation']),
  model_id: NonEmptyText,
  prompt_version: Id,
  input_reference_ids: uniqueIds,
  content: NonEmptyText,
  review_state: z.enum(['unreviewed', 'accepted', 'rejected']),
}).strict();

export const AuditEvent = TenantRecord.extend({
  actor_uid: Id,
  action: Id,
  entity_type: Id,
  entity_id: Id,
  request_id: Id,
  before_sha256: Digest.nullable(),
  after_sha256: Digest,
}).strict();

// Parse request payloads separately from stored envelopes. Caller cannot set
// organization, identity, timestamps, score, reviewer, or verification result.
export const SubmitResponseCommand = z.object({
  exercise_id: Id,
  inject_release_id: Id,
  content: NonEmptyText,
  idempotency_key: Id,
}).strict();
export const CompleteRemediationCommand = z.object({
  action_id: Id,
  expected_record_version: z.number().int().nonnegative(),
  evidence_ids: uniqueIds.refine(ids => ids.length > 0),
  idempotency_key: Id,
}).strict();

export function assertTenant(organizationId: string, records: ReadonlyArray<{ organization_id: string }>): void {
  Id.parse(organizationId);
  if (records.some(record => record.organization_id !== organizationId)) {
    throw new Error('TENANT_MISMATCH');
  }
}

export function uniqueById<T extends { id: string }>(records: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const record of records) {
    if (map.has(record.id)) throw new Error('DUPLICATE_RECORD_ID');
    map.set(record.id, record);
  }
  return map;
}
