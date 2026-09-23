import type { Firestore } from 'firebase-admin/firestore';
import { Exercise, ExerciseParticipant, Id, assertTenant } from '../../shared/v2/contracts.js';
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
    // Never read private scenario definitions or expected actions in a
    // participant workspace. Only immutable released artifact snapshots return.
    return {
      exercise, assignment: assignment ?? null,
      releases: releases.docs.map(doc => doc.data()),
      responses: responses.docs.map(doc => doc.data()),
      limits: { releases: 100, responses: 200 },
      possibly_truncated: releases.size === 100 || responses.size === 200,
    };
  });
}
