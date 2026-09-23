import { z } from 'zod';
import {
  Id, Instant, Membership, Permission, ProviderGrant, ExerciseParticipant,
  ReportClass, type PermissionName,
} from '../../shared/v2/contracts.js';

const permissionSets: Record<z.infer<typeof Membership>['roles'][number], readonly PermissionName[]> = {
  organization_admin: ['organization:manage', 'exercise:create', 'exercise:start', 'inject:release', 'response:submit',
    'observation:accept', 'remediation:assign', 'remediation:update', 'verification:record', 'report:read', 'report:export'],
  readiness_lead: ['exercise:create', 'exercise:start', 'inject:release', 'response:submit', 'observation:accept',
    'remediation:assign', 'remediation:update', 'verification:record', 'report:read', 'report:export'],
  facilitator: ['exercise:start', 'inject:release', 'response:submit', 'remediation:update', 'report:read'],
  evaluator: ['observation:accept', 'verification:record', 'response:submit', 'remediation:update', 'report:read'],
  participant: ['response:submit', 'remediation:update'],
  observer: ['report:read'],
  auditor: ['report:read', 'report:export'],
};

const AuthorizationRequest = z.object({
  // The caller of this library MUST derive principal_uid from a verified token.
  principal_uid: Id,
  organization_id: Id,
  organization_status: z.enum(['active', 'suspended']),
  permission: Permission,
  now: Instant,
  membership: Membership,
  provider_grant: ProviderGrant.optional(),
  exercise_id: Id.optional(),
  exercise_participant: ExerciseParticipant.optional(),
  action_owner_uid: Id.optional(),
  verification_subject_owner_uid: Id.optional(),
  report_class: ReportClass.optional(),
}).strict();

export class AuthorizationError extends Error {
  constructor() { super('FORBIDDEN'); this.name = 'AuthorizationError'; }
}

/**
 * Central policy primitive, not token authentication. Inputs must be loaded
 * server-side. Never accept membership/grant/assignment objects from a browser.
 */
export function authorizeCommand(raw: unknown): void {
  const parsed = AuthorizationRequest.safeParse(raw);
  if (!parsed.success) throw new AuthorizationError();
  const request = parsed.data;
  const { membership, permission, principal_uid, organization_id, provider_grant: grant } = request;
  const deny = () => { throw new AuthorizationError(); };
  if (request.organization_status !== 'active' || membership.status !== 'active' || membership.uid !== principal_uid) deny();
  if (membership.organization_id !== organization_id) {
    if (!grant || grant.status !== 'active' || grant.organization_id !== organization_id ||
        grant.provider_organization_id !== membership.organization_id || grant.subject_uid !== principal_uid ||
        Date.parse(grant.expires_at) <= Date.parse(request.now) || !grant.permissions.includes(permission)) deny();
  } else if (grant) {
    // A customer-local member must not smuggle an unrelated provider grant.
    deny();
  }
  if (!membership.roles.some(role => permissionSets[role].includes(permission))) deny();

  const needsAssignment = ['exercise:start', 'inject:release', 'response:submit', 'observation:accept'].includes(permission);
  if (needsAssignment) {
    const assignment = request.exercise_participant;
    if (!request.exercise_id || !assignment || assignment.exercise_id !== request.exercise_id ||
        assignment.organization_id !== organization_id || assignment.uid !== principal_uid || assignment.status !== 'active') deny();
    const requiredRole = permission === 'response:submit' ? 'participant'
      : permission === 'observation:accept' ? 'evaluator' : 'facilitator';
    if (!assignment?.roles.includes(requiredRole)) deny();
  }
  if (permission === 'remediation:update') {
    const managesWork = membership.roles.includes('organization_admin') || membership.roles.includes('readiness_lead');
    if (!managesWork && request.action_owner_uid !== principal_uid) deny();
  }
  if (permission === 'verification:record') {
    if (!request.verification_subject_owner_uid || request.verification_subject_owner_uid === principal_uid) deny();
  }
  if (permission === 'report:read' || permission === 'report:export') {
    if (!request.report_class) deny();
    const broadReportAccess = membership.roles.some(role =>
      ['organization_admin', 'readiness_lead', 'auditor'].includes(role));
    if (!broadReportAccess) {
      if (membership.roles.includes('observer') && request.report_class === 'executive_readiness') return;
      const assignment = request.exercise_participant;
      if (request.report_class !== 'exercise_after_action' || !request.exercise_id || !assignment ||
          assignment.organization_id !== organization_id || assignment.exercise_id !== request.exercise_id ||
          assignment.uid !== principal_uid || assignment.status !== 'active') deny();
    }
  }
}
