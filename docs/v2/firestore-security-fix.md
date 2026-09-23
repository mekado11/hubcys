# Firestore authority and tenant-isolation fix

This review unit hardens the existing Firestore application. It is based on `main`, independent of exercise-workflow PR #23. It does not deploy rules, provision users, issue custom claims, migrate data or activate V2.

## Authority changes

- Global legacy administration requires the boolean Firebase Auth custom claim `is_super_admin: true`. A field in `users/{uid}` or the public build variable `VITE_SUPER_ADMIN_EMAIL` no longer confers that authority.
- The current-user client and AuthContext derive effective super-admin status from the Auth token, and keep UID/email anchored to Firebase identity. Automatic privileged-profile creation and company-ID backfilling are removed.
- Ordinary registration keeps existing safe defaults but cannot include a tenant assignment, global privilege, app role, paid entitlement or alternate identity.
- Self-profile updates are allowlisted to non-authoritative preferences/display metadata. Company ID, company role, approval status, entitlement, email and unknown privilege fields cannot be changed or removed by the account owner.
- Existing approved company admins may approve/suspend members or change `admin`/`member` company roles within their assigned company. They cannot grant global privileges, change company IDs or assign paid entitlements.
- Existing legacy profile-based company assignments/roles are still used for legacy access, but become client-immutable. **Existing assignments must be independently validated before deployment. Locking a previously forged value does not make it trustworthy.**

## Tenant and evidence protection

All 36 existing company-scoped collection aliases retain approved same-company CRUD, but updates cannot transfer or remove the record's `company_id`. Pending, suspended, missing-profile and cross-tenant callers are denied.

Company document reads are tenant-scoped; directory listing and access-code lookup are unavailable to ordinary browsers. Only company admins can edit business metadata. Owner identity, access codes, status, entitlements and destructive company operations require trusted global administration.

The personal-record aliases also prevent tenant/owner reassignment and cross-tenant record creation. Email-only ownership requires a verified Auth email. This does not implement granular intra-company RBAC for every legacy collection; existing same-company collaboration is preserved.

The explicit browser deny on `organizations/**` remains, and the recursive legacy admin allow excludes that namespace. Tests now include a genuinely claimed super-admin token, not only a forged profile flag. Server V2 authorization remains independent.

## Intentional workflow effects requiring review

| Workflow | Result after deployment |
|---|---|
| Existing approved user, same-company CRUD | Preserved |
| Basic profile preferences | Preserved |
| New company creation | Preserved with UID-bound ownership and one-time profile assignment; no cross-tenant lookup |
| Company settings | Fetches only the assigned company; approved company admins can edit business metadata |
| Existing company membership approval | Available to approved same-company admins; membership must already be assigned by a trusted process |
| Self-service joining by access code | Paused with an explicit notice; requires a separately reviewed server-side invitation/enrollment flow |
| Missing-company recovery | Does not recreate or relink from cached profile fields; requires verified operator recovery |
| Legacy email-based super-admin bootstrap | Removed; operator-managed Auth claim required |
| Unverified-email personal record ownership | Denied until email verification or authorized same-company access applies |
| Global legacy administration | Preserved only for independently verified operators holding the Auth claim |

No invitation endpoint or general migration tool is added in this focused fix. New-company creation still uses the existing two-request create/assign flow; an interrupted assignment may leave an unclaimed owner-bound company record requiring reviewed recovery. It must not be treated as proof of verified real-world organization ownership or V2 membership.

## Verification

The new emulator suite covers registration privilege injection, self-elevation, tenant switching/removal, forged historical admin flags, genuine admin claims, same-company user administration, cross-tenant company reads and code lookups, owner/entitlement changes, one-time new-company assignment, denied access-code enrollment, batched attacks, all 36 tenant-scoped aliases, personal-record ownership, and nested V2 authority/evidence/audit paths.

The actual React application is also exercised against local Firebase Auth and Firestore emulators: safe profile creation despite a matching `VITE_SUPER_ADMIN_EMAIL`, rejected privileged writes, explicit paused enrollment, and forged-profile identity/authority suppression. Desktop/mobile screenshots are captured as the CI artifact `profile-security-browser`. Emulator wiring is injected only by the test process, not added to production source.

`test:emulator:inner` now clears generated `.v2-build` output before compiling, preventing tests from another branch from being silently executed.

## Deployment gate: do not merge and blindly deploy

1. Establish working read-only production access. Back up the deployed rules and affected profiles/company metadata, and identify the rollout owner.
2. Verify every existing tenant assignment and privileged account against an independent roster/owner approval. Check both `company`/`companies` and `users`; audit historical `created_by_uid` values before trusting new-company ownership predicates. Do not bulk-promote legacy `is_super_admin`, email matches or browser-written company roles into trusted claims.
3. Using an authorized Admin SDK/operator process, provision `is_super_admin: true` only to explicitly approved Firebase Auth UIDs, preserving unrelated claims. No browser API for this is shipped. Confirm recovery access, then obtain a fresh login/token and verify the claim. Account for already-issued token lifetime during claim revocation; this PR does not provide immediate token invalidation in Firestore rules.
4. Coordinate the rules and frontend release in a controlled window. Rules-only rollout makes old email bootstrap, onboarding queries and reconciliation fail closed; frontend-only rollout leaves the underlying vulnerabilities open. No Firebase deployment is triggered by the repository's Vercel build.
5. Run target-environment acceptance with approved test accounts: one ordinary member, company admin, global operator, outsider and revoked/pending user. Confirm both negative access and allowed settings/profile operations, and verify the new-company path if it will remain enabled.
6. Keep the V2 activation flags off. V2 memberships, indexes, server credentials and live exercise acceptance remain separate gates. Do not restore the vulnerable catch-all rules as a rollback; prefer a reviewed restrictive containment rule set and operator recovery.

The connected Firebase administration tool and Vercel configuration access remain blocked in this session. Production rules/IAM, existing account integrity, dependency vulnerabilities, Storage controls, rate limits and live release readiness are not cleared by this PR.
