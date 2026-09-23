import { createHash } from 'node:crypto';
import type { Firestore, Transaction, DocumentReference, DocumentData } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  Id, Membership, ProviderGrant, Exercise, ExerciseParticipant, ScenarioVersion,
  ExpectedAction, Criterion, InjectRelease, Response, Evidence, assertTenant,
  type PermissionName,
} from '../../shared/v2/contracts.js';
import { ExerciseCommand, Organization, ContextVersion, InjectDefinition, type ExerciseCommandInput } from '../../shared/v2/commands.js';
import { authorizeCommand, AuthorizationError } from './authorization.js';
import { assertExerciseTransition } from './lifecycle.js';
import { canonicalJson, validateScenarioManifest } from './scoring.js';

export class CommandError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
const digest = (value: unknown) => createHash('sha256').update(canonicalJson(value)).digest('hex');
const envelope = (id: string, organization_id: string, uid: string, now: string) => ({
  id, organization_id, schema_version: 1 as const, created_at: now, created_by_uid: uid,
});
const permissions: Record<ExerciseCommandInput['command'], PermissionName> = {
  create_exercise: 'exercise:create',
  transition_exercise: 'exercise:start',
  release_inject: 'inject:release',
  submit_response: 'response:submit',
};

export async function loadAuthority(tx: Transaction, db: Firestore, organizationId: string, uid: string) {
  const root = db.collection('organizations').doc(organizationId);
  const orgSnap = await tx.get(root);
  if (!orgSnap.exists) throw new AuthorizationError();
  const organization = Organization.parse(orgSnap.data());
  if (organization.id !== organizationId) throw new AuthorizationError();
  assertTenant(organizationId, [organization]);
  const memberSnap = await tx.get(root.collection('memberships').doc(uid));
  if (memberSnap.exists) {
    const membership = Membership.parse(memberSnap.data());
    assertTenant(organizationId, [membership]);
    if (membership.id !== uid || membership.uid !== uid) throw new AuthorizationError();
    return { organization, membership };
  }
  // A caller cannot choose a provider by sending its ID. An operator-managed
  // customer grant identifies the provider, which must itself remain active.
  const grantSnap = await tx.get(root.collection('provider_grants').doc(uid));
  if (!grantSnap.exists) throw new AuthorizationError();
  const provider_grant = ProviderGrant.parse(grantSnap.data());
  assertTenant(organizationId, [provider_grant]);
  if (provider_grant.id !== uid || provider_grant.subject_uid !== uid) throw new AuthorizationError();
  const providerRef = db.collection('organizations').doc(provider_grant.provider_organization_id);
  const providerSnap = await tx.get(providerRef);
  if (!providerSnap.exists) throw new AuthorizationError();
  const provider = Organization.parse(providerSnap.data());
  if (provider.status !== 'active' || provider.id !== providerRef.id || provider.organization_id !== providerRef.id) {
    throw new AuthorizationError();
  }
  const providerMember = await tx.get(providerRef.collection('memberships').doc(uid));
  if (!providerMember.exists) throw new AuthorizationError();
  const membership = Membership.parse(providerMember.data());
  if (membership.organization_id !== provider_grant.provider_organization_id ||
      membership.id !== uid || membership.uid !== uid) throw new AuthorizationError();
  return { organization, membership, provider_grant };
}

async function parseDocument<T>(
  tx: Transaction, ref: DocumentReference, schema: z.ZodType<T>,
): Promise<T> {
  const snapshot = await tx.get(ref);
  if (!snapshot.exists) throw new CommandError(404, 'RESOURCE_NOT_FOUND');
  const value = schema.parse(snapshot.data());
  if ((value as { id?: string }).id !== ref.id) throw new CommandError(409, 'RECORD_ID_MISMATCH');
  return value;
}

/**
 * All authority and parent records are read inside the same Firestore
 * transaction as the mutation, receipt, audit and outbox records.
 * uid MUST come from verified Firebase identity, never a request body.
 */
export async function executeExerciseCommand(db: Firestore, uid: string, raw: unknown) {
  Id.parse(uid);
  const command = ExerciseCommand.parse(raw);
  const orgId = command.organization_id;
  const key = digest([orgId, uid, command.idempotency_key]);
  const payloadHash = digest(command);
  const root = db.collection('organizations').doc(orgId);
  const receiptRef = root.collection('command_receipts').doc(key);
  return db.runTransaction(async tx => {
    const now = new Date().toISOString();
    const authority = await loadAuthority(tx, db, orgId, uid);
    let exercise: z.infer<typeof Exercise> | undefined;
    let participant: z.infer<typeof ExerciseParticipant> | undefined;
    if (command.command !== 'create_exercise') {
      exercise = await parseDocument(tx, root.collection('exercises').doc(command.exercise_id), Exercise);
      assertTenant(orgId, [exercise]);
      const assignmentSnap = await tx.get(root.collection('exercises').doc(exercise.id).collection('participants').doc(uid));
      if (assignmentSnap.exists) participant = ExerciseParticipant.parse(assignmentSnap.data());
    }
    authorizeCommand({
      principal_uid: uid, organization_id: orgId, organization_status: authority.organization.status,
      permission: permissions[command.command], now, membership: authority.membership,
      ...('provider_grant' in authority ? { provider_grant: authority.provider_grant } : {}),
      ...(exercise ? { exercise_id: exercise.id } : {}),
      ...(participant ? { exercise_participant: participant } : {}),
    });
    // Replays still require CURRENT authority/assignment; revoked users cannot
    // use receipts as an authorization bypass.
    const receipt = await tx.get(receiptRef);
    if (receipt.exists) {
      if (receipt.data()?.payload_sha256 !== payloadHash) throw new CommandError(409, 'IDEMPOTENCY_KEY_REUSED');
      return { ...receipt.data()!.result, replayed: true };
    }
    const writes: Array<{ ref: DocumentReference; data: DocumentData; update?: boolean }> = [];
    let result: Record<string, unknown>;
    let entityId: string;
    let beforeHash: string | null = exercise ? digest(exercise) : null;

    if (command.command === 'create_exercise') {
      const scenarioRef = root.collection('scenario_versions').doc(command.scenario_version_id);
      const scenario = await parseDocument(tx, scenarioRef, ScenarioVersion);
      const context = await parseDocument(tx, root.collection('context_versions').doc(command.context_version_id), ContextVersion);
      assertTenant(orgId, [scenario, context]);
      if (scenario.state !== 'published' || context.status !== 'published') throw new CommandError(409, 'PUBLISHED_CONTEXT_REQUIRED');
      // Validate the whole published manifest, not just the version label.
      const expectedActions: z.infer<typeof ExpectedAction>[] = [];
      const criteria: z.infer<typeof Criterion>[] = [];
      for (const id of scenario.expected_action_ids) {
        const expected = await parseDocument(tx, scenarioRef.collection('expected_actions').doc(id), ExpectedAction);
        assertTenant(orgId, [expected]);
        expectedActions.push(expected);
      }
      for (const id of scenario.criterion_ids) {
        const criterion = await parseDocument(tx, scenarioRef.collection('criteria').doc(id), Criterion);
        assertTenant(orgId, [criterion]);
        criteria.push(criterion);
      }
      try { validateScenarioManifest(scenario, expectedActions, criteria); }
      catch { throw new CommandError(409, 'MANIFEST_MISMATCH'); }
      for (const member of command.participants) {
        const memberAuthority = await loadAuthority(tx, db, orgId, member.uid);
        if (memberAuthority.membership.uid !== member.uid || memberAuthority.membership.status !== 'active') throw new AuthorizationError();
        if ('provider_grant' in memberAuthority) {
          const grant = memberAuthority.provider_grant;
          if (grant.status !== 'active' || grant.subject_uid !== member.uid || Date.parse(grant.expires_at) <= Date.parse(now)) {
            throw new AuthorizationError();
          }
        }
      }
      entityId = `exercise-${key}`;
      const newExercise = Exercise.parse({
        ...envelope(entityId, orgId, uid, now),
        scenario_version_id: scenario.id, context_version_id: context.id,
        scoring_policy_version: scenario.scoring_policy_version, threat_id: scenario.threat_id,
        state: 'draft', purpose: 'exercise', scope_key: command.scope_key, record_version: 0,
      });
      const exerciseRef = root.collection('exercises').doc(entityId);
      writes.push({ ref: exerciseRef, data: newExercise });
      for (const member of command.participants) {
        writes.push({
          ref: exerciseRef.collection('participants').doc(member.uid),
          data: ExerciseParticipant.parse({
            ...envelope(member.uid, orgId, uid, now), exercise_id: entityId,
            uid: member.uid, roles: member.roles, status: 'active',
          }),
        });
      }
      result = { exercise_id: entityId, state: 'draft', record_version: 0 };
    } else {
      const current = exercise!;
      entityId = current.id;
      const exerciseRef = root.collection('exercises').doc(entityId);
      if ('expected_record_version' in command && command.expected_record_version !== current.record_version) {
        throw new CommandError(409, 'RECORD_VERSION_CONFLICT');
      }
      if (command.command === 'transition_exercise') {
        try { assertExerciseTransition(current.state, command.next_state); }
        catch { throw new CommandError(409, 'INVALID_EXERCISE_TRANSITION'); }
        // Finalizing review will require the scoring/review command, not an
        // arbitrary facilitator state patch.
        if (command.next_state === 'completed' || command.next_state === 'archived') {
          throw new CommandError(409, 'FINALIZATION_REQUIRES_REVIEW');
        }
        const updated = Exercise.parse({ ...current, state: command.next_state, record_version: current.record_version + 1 });
        writes.push({ ref: exerciseRef, data: updated, update: true });
        result = { exercise_id: entityId, state: updated.state, record_version: updated.record_version };
      } else if (command.command === 'release_inject') {
        if (current.state !== 'running') throw new CommandError(409, 'EXERCISE_NOT_RUNNING');
        const inject = await parseDocument(tx, root.collection('scenario_versions').doc(current.scenario_version_id)
          .collection('injects').doc(command.inject_definition_id), InjectDefinition);
        assertTenant(orgId, [inject]);
        if (inject.scenario_version_id !== current.scenario_version_id) throw new CommandError(409, 'INJECT_SCOPE_MISMATCH');
        const releaseRef = exerciseRef.collection('releases').doc(inject.id);
        if ((await tx.get(releaseRef)).exists) throw new CommandError(409, 'INJECT_ALREADY_RELEASED');
        const release = InjectRelease.parse({
          ...envelope(inject.id, orgId, uid, now), exercise_id: entityId,
          inject_definition_id: inject.id, released_at: now, sequence: current.record_version + 1,
        });
        writes.push({ ref: releaseRef, data: {
          ...release,
          artifact: { title: inject.title, artifact_type: inject.artifact_type, content: inject.content, simulation: true },
        } });
        writes.push({ ref: exerciseRef, data: { record_version: current.record_version + 1 }, update: true });
        result = { exercise_id: entityId, release_id: release.id, released_at: now, record_version: current.record_version + 1 };
      } else {
        if (current.state !== 'running') throw new CommandError(409, 'EXERCISE_NOT_RUNNING');
        const releaseSnap = await tx.get(exerciseRef.collection('releases').doc(command.inject_release_id));
        if (!releaseSnap.exists || releaseSnap.data()?.exercise_id !== entityId ||
            releaseSnap.data()?.organization_id !== orgId) throw new CommandError(409, 'INJECT_NOT_RELEASED');
        const responseId = `response-${key}`;
        const response = Response.parse({
          ...envelope(responseId, orgId, uid, now), exercise_id: entityId,
          inject_release_id: command.inject_release_id, actor_uid: uid,
          received_at: now, content: command.content, receipt_id: key,
        });
        const evidenceId = `evidence-${key}`;
        const evidence = Evidence.parse({
          ...envelope(evidenceId, orgId, uid, now), exercise_id: entityId,
          source_kind: 'participant_response', source_record_id: responseId,
          content_sha256: digest(response), status: 'accepted',
        });
        // This proves a response was submitted. It does not prove that the
        // technical action described by the participant occurred in production.
        writes.push({ ref: exerciseRef.collection('responses').doc(responseId), data: response });
        writes.push({ ref: root.collection('evidence').doc(evidenceId), data: evidence });
        beforeHash = null;
        result = { exercise_id: entityId, response_id: responseId, evidence_id: evidenceId, received_at: now };
      }
    }
    const event = {
      ...envelope(key, orgId, uid, now),
      actor_uid: uid, action: command.command, entity_type: 'exercise', entity_id: entityId,
      request_id: command.idempotency_key, before_sha256: beforeHash,
      after_sha256: digest(writes.map(write => ({ path: write.ref.path, data: write.data }))),
      payload_sha256: payloadHash,
      changed_paths: writes.map(write => write.ref.path),
    };
    // No writes occur until EVERY permission, parent and transition check passed.
    for (const write of writes) {
      if (write.update) tx.update(write.ref, write.data);
      else tx.create(write.ref, write.data);
    }
    tx.create(root.collection('audit_events').doc(key), event);
    tx.create(root.collection('outbox').doc(key), {
      ...envelope(key, orgId, uid, now), event_id: key, state: 'pending', attempts: 0,
    });
    tx.create(receiptRef, { uid, payload_sha256: payloadHash, result, created_at: now });
    return { ...result, replayed: false };
  });
}
