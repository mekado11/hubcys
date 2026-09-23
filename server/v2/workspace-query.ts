import type { Firestore } from 'firebase-admin/firestore';
import { Exercise, ExerciseParticipant, Id, assertTenant, ScenarioVersion, Criterion, ExpectedAction, type PermissionName } from '../../shared/v2/contracts.js';
import { InjectDefinition } from '../../shared/v2/commands.js';
import { authorizeCommand, AuthorizationError } from './authorization.js';
import { loadAuthority, CommandError } from './command-service.js';

export async function getExerciseWorkspace(db: Firestore, uid: string, organizationId: string, exerciseId: string) {
  [uid, organizationId, exerciseId].forEach(value => Id.parse(value));
  return db.runTransaction(async tx => {
    const authority = await loadAuthority(tx, db, organizationId, uid);
    const ref = db.collection('organizations').doc(organizationId).collection('exercises').doc(exerciseId);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new CommandError(404, 'RESOURCE_NOT_FOUND');
    const exercise = Exercise.parse(snap.data());
    if (exercise.id !== exerciseId) throw new CommandError(409, 'RECORD_ID_MISMATCH');
    assertTenant(organizationId, [exercise]);
    const assignmentSnap = await tx.get(ref.collection('participants').doc(uid));
    const assignment = assignmentSnap.exists ? ExerciseParticipant.parse(assignmentSnap.data()) : undefined;
    const access = {
      principal_uid: uid, organization_id: organizationId, organization_status: authority.organization.status,
      now: new Date().toISOString(), membership: authority.membership,
      exercise_id: exerciseId,
      ...(assignment ? { exercise_participant: assignment } : {}),
      ...('provider_grant' in authority ? { provider_grant: authority.provider_grant } : {}),
    };
    authorizeCommand({ ...access, permission: 'exercise:read' });
    const permits = (permission: PermissionName) => {
      try { authorizeCommand({ ...access, permission }); return true; }
      catch (error) { if (error instanceof AuthorizationError) return false; throw error; }
    };
    const can_facilitate = permits('exercise:start');
    const can_respond = permits('response:submit');
    const can_evaluate = permits('observation:accept');
    const releases = await tx.get(ref.collection('releases').orderBy('sequence').limit(100));
    let privileged = false;
    try {
      authorizeCommand({ ...access, permission: 'exercise:review' });
      privileged = true;
    } catch (error) {
      if (!(error instanceof AuthorizationError)) throw error;
    }
    const query = privileged
      ? ref.collection('responses').orderBy('received_at').limit(200)
      : ref.collection('responses').where('actor_uid', '==', uid).limit(200);
    const responses = await tx.get(query);
    for (const doc of [...releases.docs, ...responses.docs]) {
      if (doc.data().organization_id !== organizationId || doc.data().exercise_id !== exerciseId) throw new AuthorizationError();
    }
    let available_injects: Array<ReturnType<typeof InjectDefinition.parse>> = [];
    let criteria: Array<ReturnType<typeof Criterion.parse>> = [];
    let expected_actions: Array<ReturnType<typeof ExpectedAction.parse>> = [];
    const scenarioRef = db.doc(`organizations/${organizationId}/scenario_versions/${exercise.scenario_version_id}`);
    if (can_facilitate) {
      const injects = await tx.get(scenarioRef.collection('injects').limit(101));
      if (injects.size > 100) throw new CommandError(409, 'INJECT_DIRECTORY_LIMIT');
      available_injects = injects.docs.map(doc => {
        const row = InjectDefinition.parse(doc.data());
        if (row.id !== doc.id || row.organization_id !== organizationId || row.scenario_version_id !== scenarioRef.id) throw new AuthorizationError();
        return row;
      });
    }
    if (privileged && can_evaluate) {
      const scenario = ScenarioVersion.parse((await tx.get(scenarioRef)).data());
      assertTenant(organizationId, [scenario]);
      if (scenario.id !== scenarioRef.id) throw new AuthorizationError();
      for (const id of scenario.criterion_ids) {
        const row = Criterion.parse((await tx.get(scenarioRef.collection('criteria').doc(id))).data());
        if (row.id !== id || row.scenario_version_id !== scenario.id || row.organization_id !== organizationId) throw new AuthorizationError();
        criteria.push(row);
      }
      for (const id of scenario.expected_action_ids) {
        const row = ExpectedAction.parse((await tx.get(scenarioRef.collection('expected_actions').doc(id))).data());
        if (row.id !== id || row.scenario_version_id !== scenario.id || row.organization_id !== organizationId) throw new AuthorizationError();
        expected_actions.push(row);
      }
    }
    // Never read private scenario definitions or expected actions in a
    // participant workspace. Only immutable released artifact snapshots return.
    return {
      exercise, assignment: assignment ?? null,
      principal_uid: uid, can_facilitate, can_respond, can_evaluate: privileged && can_evaluate,
      can_review: privileged, available_injects,
      ...(privileged && can_evaluate ? { criteria, expected_actions } : {}),
      releases: releases.docs.map(doc => doc.data()),
      responses: responses.docs.map(doc => doc.data()),
      limits: { releases: 100, responses: 200 },
      possibly_truncated: releases.size === 100 || responses.size === 200,
    };
  });
}
