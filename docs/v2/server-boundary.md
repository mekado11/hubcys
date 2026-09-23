# HubCyS V2 server boundary

This review unit depends on the V2 domain foundation. It is an additive implementation boundary, not a production release or a complete readiness workflow.

## Implemented behavior

- Identity: six existing utility/AI API handlers now use Firebase Admin ID-token verification with revocation checking. Only verified UID/project identity is retained; legacy user profile fields and caller-provided roles do not establish V2 authority. The existing AI cache is partitioned by UID, model and schema as well as request content.
- V2 commands: `POST /api/v2/commands` accepts strict create-exercise, state-transition, manual-inject-release and participant-response commands. Request bodies cannot specify actor, server timestamp, scoring result or membership authority.
- Workspace: `GET /api/v2/exercise?organization_id=...&exercise_id=...` returns the exercise, caller assignment, released artifact snapshots and permitted responses. Participants receive only their responses. Reviewing all responses requires organization role, active facilitator/evaluator assignment and an explicit provider permission when applicable. Unreleased artifacts and scoring rubrics are never read into this projection.
- Atomicity: mutations, accepted participant-response evidence, append-created audit event, outbox event and idempotency receipt commit in one Firestore transaction. No email, AI or other external side effects run inside that transaction.
- Concurrency: state/release commands require the current record version. A definition can be released once per exercise. Retrying the same caller/key/payload returns the prior receipt; changing a payload under the same key fails. Receipt replay still requires current authority.
- Authority: memberships live under the organization, are read server-side and cannot be changed by browser clients. Provider access intersects provider membership, customer grant, current expiry/status and exercise assignment. The customer cannot be selected merely by asserting a `company_id`.
- Simulation boundary: released artifacts carry `simulation: true`. Response evidence proves who submitted a message and what it contained; it does not prove that a claimed technical action occurred. Evaluator acceptance of capability observations remains separate work.

Finalization to `completed` or `archived` is blocked until review/scoring services can enforce their requirements. Starting, pausing, returning to review and manual inject release are supported; timed dispatch, branching and scheduling workers are not implemented.

## Storage paths

The dedicated root is `organizations/{organizationId}`. All nested records are tenant-scoped:

```text
memberships/{uid}
provider_grants/{uid}
context_versions/{versionId}
scenario_versions/{versionId}
  expected_actions/{expectedActionId}
  criteria/{criterionId}
  injects/{injectId}
exercises/{exerciseId}
  participants/{uid}
  releases/{injectDefinitionId}
  responses/{responseId}
evidence/{evidenceId}
audit_events/{commandDigest}
outbox/{commandDigest}
command_receipts/{commandDigest}
```

The checked-in Firestore rules deny all browser access to this root, including legacy elevated profiles. Firebase Admin bypasses rules, so API policy checks and database IAM remain mandatory. The legacy wildcard is narrowed only to exclude this root; legacy collection authorization is not claimed repaired.

Audit records are append-created by these commands and browser-immutable. This is not WORM storage: a sufficiently privileged infrastructure administrator can still alter them. Outbox rows are pending durable work, not a running notification or scoring worker.

## Server configuration and activation

No production configuration, data, rules or deployment is changed by committing this code. There is no staging environment assumed or required for local development.

- Set `FIREBASE_PROJECT_ID` on the server to the explicitly reviewed production project when deployment is authorized. Do not infer the server trust target from a browser request or `VITE_` value.
- Use Node 22, as pinned in `package.json` and CI, for the current Firebase Admin SDK. Confirm the deployment runtime honors that pin before activation.
- Provision Google Application Default Credentials through a server-only, reviewed deployment mechanism. `applicationDefault()` does not make Vercel credentials appear automatically. On Vercel this is keyless Workload Identity Federation fed through ADC; see [Vercel credentials](vercel-credentials.md) for setup and the `/api/health` check. Do not paste service-account keys into source, client variables or PR comments.
- Server credentials need the intended Firebase Auth user lookup/revocation checks and Firestore operations. Apply least-privilege IAM and separate deploy/admin ownership from application runtime where feasible.
- The six existing API authentication changes are NOT feature-gated. Missing identity configuration fails closed with 503. Before deploying them, confirm that valid existing users receive successful token verification and that disabled/revoked users fail; otherwise those six APIs will be unavailable.
- V2 endpoints are additionally disabled unless `HUBCYS_V2_ENABLED=true`. Keep this flag off until the V2 Firestore deny policy is deployed, authoritative organization/membership records are provisioned, schema-valid published scenario/context records exist, and deployment-level acceptance has passed.
- Never enable Auth/Firestore emulator environment variables in Vercel or any production runtime. The environment validator permits emulator connections only in `NODE_ENV=test`, with a `demo-` project and loopback hosts.

Membership provisioning is not implemented as a public signup API in this unit. A later reviewed provisioning/migration command must verify organization ownership and operator authority. Never import self-editable legacy privilege fields as authoritative memberships automatically. Existing customer records stay untouched and are not silently reclassified as V2 evidence.

## Verification

```sh
npm ci --ignore-scripts
npm run typecheck:v2
npm run test:v2
npm run test:security
npm run test:emulator
npm run build
```

The emulator command explicitly selects `demo-hubcys-v2`, loopback Auth/Firestore services and synthetic users/organizations. Its inner command checks those settings before running. It requires Java 21 or newer and may download the Firebase emulator on first run. CI supplies Java 21 and Node 22 without production secrets.

Coverage includes verified/disabled identity, malformed tokens at the actual legacy API handlers, feature-gated V2 handlers, all client CRUD denied on V2 paths, cross-tenant commands, self-elevation attempts, provider grants and revocation, six independent responses, hidden scenario/rubric separation, duplicate/reordered commands, concurrent release, audit atomicity and forced transaction failure.

The emulator is not proof of deployed IAM, rules, Storage policies, Vercel environment configuration, network protections or user-visible acceptance. Existing root lint/typecheck and dependency findings remain separate release gates.

## Deliberately unfinished

No new frontend route, customer data migration, file ingestion, tenant administration UI, observation acceptance, persisted score calculation, verification/retest API or report generation is included. Existing utilities still need authorization/entitlement and destination/network validation review beyond identity verification; their outputs do not enter the V2 evidence ledger. Legacy authority/tenant controls, upload security, rate limiting, retention and dependency remediation remain tracked hardening work.

The next product integration must use these server boundaries rather than granting browser access to the V2 namespace or reusing mutable legacy profile authority. Production activation requires a separate reviewed deployment action; merging this review branch is not itself evidence that the full rebuild is ready.
