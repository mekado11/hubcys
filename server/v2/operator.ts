import { createHash } from 'node:crypto';
import type { Auth, UserRecord } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { Id, Membership, Role } from '../../shared/v2/contracts.js';
import { ContextVersion, Organization } from '../../shared/v2/commands.js';
import { canonicalJson } from './scoring.js';

// Operator provisioning for trusted authority. Runs only from a reviewed operator
// process with Admin credentials (never from a browser or public API). Every
// function plans first; nothing is written unless the caller invokes `apply`.

export class OperatorError extends Error {
  constructor(public readonly code: string) { super(code); }
}

export type Change = { target: string; before: unknown; after: unknown };
export type Plan = { action: string; changes: Change[]; apply: () => Promise<void> };

const digest = (value: unknown) => createHash('sha256').update(canonicalJson(value)).digest('hex');
const roleList = (roles: readonly string[]) => {
  const parsed = roles.map(role => Role.parse(role));
  if (!parsed.length || new Set(parsed).size !== parsed.length) throw new OperatorError('INVALID_ROLES');
  return parsed;
};

async function userOrThrow(auth: Auth, uid: string): Promise<UserRecord> {
  Id.parse(uid);
  try { return await auth.getUser(uid); } catch (error) {
    if ((error as { code?: string })?.code === 'auth/user-not-found') throw new OperatorError('USER_NOT_FOUND');
    throw error;
  }
}

function activeVerified(user: UserRecord) {
  if (user.disabled) throw new OperatorError('USER_DISABLED');
  if (!user.emailVerified) throw new OperatorError('EMAIL_NOT_VERIFIED');
}

/** The acting operator must be a real, enabled, verified account holding the operator claim. */
async function operatorActor(auth: Auth, actorUid: string) {
  const actor = await userOrThrow(auth, actorUid);
  activeVerified(actor);
  if (actor.customClaims?.is_super_admin !== true) throw new OperatorError('ACTOR_NOT_OPERATOR');
  return actor.uid;
}

/** Read-only account report. Legacy profile fields are reported, never trusted. */
export async function inspectAccount(auth: Auth, db: Firestore, lookup: { uid?: string; email?: string }) {
  const user = lookup.uid ? await userOrThrow(auth, lookup.uid)
    : await auth.getUserByEmail(String(lookup.email)).catch(() => { throw new OperatorError('USER_NOT_FOUND'); });
  const profile = (await db.doc(`users/${user.uid}`).get()).data() ?? null;
  const companyId = typeof profile?.company_id === 'string' && profile.company_id ? profile.company_id : null;
  const company = companyId ? (await db.doc(`company/${companyId}`).get()).data() ?? null : null;
  const memberships = await db.collectionGroup('memberships').where('uid', '==', user.uid).limit(50).get();
  return {
    auth: {
      uid: user.uid, email: user.email ?? null, email_verified: user.emailVerified, disabled: user.disabled,
      operator_claim: user.customClaims?.is_super_admin === true,
      claim_keys: Object.keys(user.customClaims ?? {}).sort(),
      last_sign_in: user.metadata.lastSignInTime ?? null,
    },
    legacy_profile: profile && {
      company_id: companyId,
      company_role: profile.company_role ?? profile.role ?? null,
      approval_status: profile.approval_status ?? profile.status ?? null,
      // A profile flag never confers authority; flagged so forged values are noticed.
      untrusted_profile_super_admin_flag: profile.is_super_admin === true,
    },
    legacy_company: company && {
      id: companyId, name: company.name ?? null,
      created_by_matches_uid: company.created_by_uid === user.uid,
    },
    v2_memberships: memberships.docs.map(doc => ({
      organization_id: doc.ref.parent.parent?.id ?? null,
      roles: doc.get('roles') ?? null, status: doc.get('status') ?? null,
    })),
  };
}

/**
 * Read-only: accounts whose legacy profile claims global admin. After the hardened rules
 * deploy, only the Auth claim confers that authority, so each row needs an explicit decision.
 */
export async function auditLegacyAdmins(auth: Auth, db: Firestore) {
  const flagged = await db.collection('users').where('is_super_admin', '==', true).limit(200).get();
  const rows = [];
  for (const doc of flagged.docs) {
    const user = await auth.getUser(doc.id).catch(() => null);
    rows.push({
      uid: doc.id, email: user?.email ?? null, auth_account_exists: Boolean(user),
      disabled: user?.disabled ?? null, email_verified: user?.emailVerified ?? null,
      operator_claim: user?.customClaims?.is_super_admin === true,
      company_id: typeof doc.get('company_id') === 'string' ? doc.get('company_id') : null,
    });
  }
  return { profile_flag_count: flagged.size, truncated: flagged.size === 200, accounts: rows };
}

/**
 * Grant or revoke the global legacy-administration claim, preserving unrelated claims.
 * Revocation also revokes refresh tokens and records the revocation time, which the
 * Firestore rules compare with each ID token's auth_time. Already-issued tokens stop
 * conferring authority at once, not when they expire.
 */
export async function planOperatorClaim(auth: Auth, db: Firestore, uid: string, grant: boolean): Promise<Plan> {
  const user = await userOrThrow(auth, uid);
  if (grant) activeVerified(user);
  const before = { ...(user.customClaims ?? {}) };
  const after: Record<string, unknown> = { ...before };
  if (grant) after.is_super_admin = true; else delete after.is_super_admin;
  const claimChanged = canonicalJson(before) !== canonicalJson(after);
  const revocationRef = db.doc(`operator_revocations/${user.uid}`);
  const changes: Change[] = claimChanged ? [{ target: `auth/users/${uid}/customClaims`, before, after }] : [];
  // Revocation is always recorded, so that tokens cached from earlier sessions are cut off
  // even when the claim itself was already removed elsewhere.
  if (!grant) changes.push({ target: revocationRef.path, before: null, after: { uid: user.uid, revoked_at_seconds: '<time of revocation>' } });
  return {
    action: grant ? 'operator.grant' : 'operator.revoke',
    changes,
    apply: async () => {
      if (claimChanged) await auth.setCustomUserClaims(uid, after);
      if (grant) return;
      await auth.revokeRefreshTokens(uid);
      const validAfter = (await auth.getUser(uid)).tokensValidAfterTime;
      const revokedAt = Math.floor(Date.parse(validAfter ?? new Date().toISOString()) / 1000);
      await revocationRef.set({ uid: user.uid, revoked_at_seconds: revokedAt, recorded_at: new Date().toISOString(), source: 'operator_cli' });
    },
  };
}

type ProvisionInput = { organizationId: string; name: string; contextDescription: string; actorUid: string; now: string };

/** Creates an organization and its first published context. Never overwrites an existing record. */
export async function planProvisionOrganization(auth: Auth, db: Firestore, input: ProvisionInput): Promise<Plan> {
  const actor = await operatorActor(auth, input.actorUid);
  const org = Id.parse(input.organizationId);
  const base = (id: string) => ({ id, organization_id: org, schema_version: 1 as const, created_at: input.now, created_by_uid: actor });
  const organization = Organization.parse({ ...base(org), name: input.name, status: 'active' });
  const context = ContextVersion.parse({ ...base('context-v1'), status: 'published', description: input.contextDescription });
  const orgRef = db.doc(`organizations/${org}`);
  const contextRef = orgRef.collection('context_versions').doc(context.id);
  const [orgSnap, contextSnap] = await Promise.all([orgRef.get(), contextRef.get()]);
  if (orgSnap.exists && orgSnap.get('name') !== organization.name) throw new OperatorError('ORGANIZATION_EXISTS_WITH_DIFFERENT_NAME');
  if (contextSnap.exists) {
    // A re-run must not silently keep a retired or different context while reporting success.
    const existing = ContextVersion.safeParse(contextSnap.data());
    if (!existing.success || existing.data.status !== 'published' || existing.data.description !== context.description) {
      throw new OperatorError('CONTEXT_EXISTS_WITH_DIFFERENT_CONTENT');
    }
  }
  const writes = [
    ...(orgSnap.exists ? [] : [{ ref: orgRef, data: organization }]),
    ...(contextSnap.exists ? [] : [{ ref: contextRef, data: context }]),
  ];
  return {
    action: 'organization.provision',
    changes: writes.map(write => ({ target: write.ref.path, before: null, after: write.data })),
    apply: async () => {
      if (!writes.length) return;
      await db.runTransaction(async tx => {
        const event = auditEvent(org, actor, input.now, 'organization.provision', 'organization', org, null, writes);
        for (const write of writes) tx.create(write.ref, write.data); // create() fails on a concurrent writer
        tx.create(orgRef.collection('audit_events').doc(event.id), event);
      });
    },
  };
}

type MembershipInput = { organizationId: string; uid: string; roles: readonly string[]; actorUid: string; now: string };

/** Adds or re-activates a member with exactly the given roles. The member must be a verified account. */
export async function planMembership(auth: Auth, db: Firestore, input: MembershipInput): Promise<Plan> {
  const actor = await operatorActor(auth, input.actorUid);
  const org = Id.parse(input.organizationId);
  const member = await userOrThrow(auth, input.uid);
  activeVerified(member);
  const roles = roleList(input.roles);
  const orgRef = db.doc(`organizations/${org}`);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) throw new OperatorError('ORGANIZATION_NOT_FOUND');
  if (Organization.parse(orgSnap.data()).status !== 'active') throw new OperatorError('ORGANIZATION_INACTIVE');
  const ref = orgRef.collection('memberships').doc(member.uid);
  const snap = await ref.get();
  const before = snap.exists ? Membership.parse(snap.data()) : null;
  const after = Membership.parse(before
    ? { ...before, roles, status: 'active' }
    : { id: member.uid, organization_id: org, schema_version: 1, created_at: input.now, created_by_uid: actor, uid: member.uid, roles, status: 'active' });
  const changed = !before || canonicalJson(before) !== canonicalJson(after);
  return {
    action: before ? 'membership.update' : 'membership.create',
    changes: changed ? [{ target: ref.path, before, after }] : [],
    apply: async () => {
      if (!changed) return;
      await db.runTransaction(async tx => {
        const current = await tx.get(ref);
        // Optimistic check: abort if someone changed the membership since planning.
        if (canonicalJson(current.exists ? current.data() : null) !== canonicalJson(before)) throw new OperatorError('MEMBERSHIP_CHANGED_SINCE_PLAN');
        const event = auditEvent(org, actor, input.now, before ? 'membership.update' : 'membership.create',
          'membership', member.uid, before, [{ ref, data: after }]);
        tx.set(ref, after);
        tx.create(orgRef.collection('audit_events').doc(event.id), event);
      });
    },
  };
}

function auditEvent(org: string, actor: string, now: string, action: string, entityType: string, entityId: string,
  before: unknown, writes: { ref: { path: string }; data: unknown }[]) {
  const after = writes.map(write => ({ path: write.ref.path, data: write.data }));
  const requestId = `operator.${digest({ action, entityId, now }).slice(0, 32)}`;
  const id = digest({ action, org, entityId, requestId, after });
  return {
    id, organization_id: org, schema_version: 1, created_at: now, created_by_uid: actor,
    actor_uid: actor, action, entity_type: entityType, entity_id: entityId, request_id: requestId,
    before_sha256: before === null ? null : digest(before), after_sha256: digest(after),
    changed_paths: writes.map(write => write.ref.path), source: 'operator_cli',
  };
}
