import { z } from 'zod';
import { Id, NonEmptyText, TenantRecord, ExerciseRole, ExerciseState, Measurement } from './contracts.js';

export const Organization = TenantRecord.extend({
  name: NonEmptyText,
  status: z.enum(['active', 'suspended']),
}).strict();

export const ContextVersion = TenantRecord.extend({
  status: z.enum(['published', 'retired']),
  description: NonEmptyText,
}).strict();

export const InjectDefinition = TenantRecord.extend({
  scenario_version_id: Id,
  title: NonEmptyText,
  artifact_type: z.enum(['siem_alert', 'edr_alert', 'identity_event', 'email', 'team_message', 'ransom_note', 'cloud_log', 'helpdesk_ticket']),
  content: NonEmptyText,
  simulation: z.literal(true),
}).strict();

const commandBase = z.object({ organization_id: Id, idempotency_key: Id });
const existingExercise = commandBase.extend({ exercise_id: Id });
const versionedExercise = existingExercise.extend({ expected_record_version: z.number().int().nonnegative() });
const ParticipantInput = z.object({ uid: Id, roles: z.array(ExerciseRole).min(1).max(4) }).strict();
const Participants = z.array(ParticipantInput).min(2).max(100)
  .refine(rows => new Set(rows.map(row => row.uid)).size === rows.length, 'Duplicate participant')
  .refine(rows => rows.some(row => row.roles.includes('facilitator')), 'Facilitator required')
  .refine(rows => rows.some(row => row.roles.includes('participant')), 'Participant required');
export const ExerciseCommand = z.discriminatedUnion('command', [
  commandBase.extend({
    command: z.literal('create_ransomware_exercise'),
    scope_key: Id, context_description: NonEmptyText, participants: Participants,
  }).strict(),
  commandBase.extend({
    command: z.literal('create_exercise'),
    scenario_version_id: Id,
    context_version_id: Id,
    scope_key: Id,
    participants: Participants,
  }).strict(),
  versionedExercise.extend({ command: z.literal('transition_exercise'), next_state: ExerciseState }).strict(),
  versionedExercise.extend({ command: z.literal('release_inject'), inject_definition_id: Id }).strict(),
  existingExercise.extend({
    command: z.literal('submit_response'), inject_release_id: Id, content: NonEmptyText,
  }).strict(),
  versionedExercise.extend({
    command: z.literal('accept_observation'), criterion_id: Id, measurement: Measurement,
    rationale: NonEmptyText, evidence_ids: z.array(Id).min(1).max(20)
      .refine(ids => new Set(ids).size === ids.length, 'Duplicate evidence'),
  }).strict(),
]);
export type ExerciseCommandInput = z.infer<typeof ExerciseCommand>;
