import type { Firestore } from 'firebase-admin/firestore';
import { Id, Membership } from '../../shared/v2/contracts.js';
import { loadAuthority, CommandError } from './command-service.js';
import { authorizeCommand } from './authorization.js';
import { ContextVersion } from '../../shared/v2/commands.js';

export async function getExerciseSetup(db: Firestore, uid: string, org: string) {
  [uid, org].forEach(value => Id.parse(value));
  return db.runTransaction(async tx => {
    const authority = await loadAuthority(tx, db, org, uid);
    authorizeCommand({
      principal_uid: uid, organization_id: org, organization_status: authority.organization.status,
      permission: 'exercise:create', now: new Date().toISOString(), membership: authority.membership,
      ...('provider_grant' in authority ? { provider_grant: authority.provider_grant } : {}),
    });
    const rows = await tx.get(db.collection(`organizations/${org}/memberships`).limit(101));
    if (rows.size > 100) throw new CommandError(409, 'TEAM_DIRECTORY_LIMIT');
    const members = rows.docs.map(doc => {
      const row = Membership.parse(doc.data());
      if (row.id !== doc.id || row.uid !== doc.id || row.organization_id !== org) throw new CommandError(409, 'MEMBERSHIP_SCOPE_MISMATCH');
      return row;
    }).filter(row => row.status === 'active').map(row => ({ uid: row.uid, roles: row.roles }));
    const contexts = await tx.get(db.collection(`organizations/${org}/context_versions`).orderBy('created_at', 'desc').limit(20));
    const context = contexts.docs.map(doc => {
      const row = ContextVersion.parse(doc.data());
      if (row.id !== doc.id || row.organization_id !== org) throw new CommandError(409, 'CONTEXT_SCOPE_MISMATCH');
      return row;
    }).find(row => row.status === 'published');
    return { principal_uid: uid, members, context_description: context?.description ?? '', organization_name: authority.organization.name };
  });
}
