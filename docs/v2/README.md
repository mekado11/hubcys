# HubCyS V2 domain foundation

This additive foundation establishes validated records, domain rules and an initial server boundary for evidence-backed readiness. The server review unit adds verified API identity and a feature-gated V2 exercise command/query service; it does not migrate customer data, rebuild the frontend or deploy production policies.

## Included

- Strict V2 record and command contracts with tenant ownership, stable capability/threat identifiers, separate observations/evidence/findings, remediation, verification, retest, reporting, advisory and audit concepts.
- Deterministic exercise/capability scoring with versioned policy, published criterion manifests, retained inputs and input digest. Unknown or ineligible evidence withholds an unqualified score; advisory, legacy and simulated-artifact records cannot count as participant-performance evidence.
- Central command authorization policy for organization membership, exercise assignments, ownership, independent verification and explicitly scoped provider-customer grants.
- Exercise/remediation state invariant guards and comparable persistent-gap detection. Completion remains separate from verification and does not alter readiness.
- Isolated strict TypeScript compilation and Node tests without Firebase, provider calls, customer records or secrets.
- Firebase Admin identity verification, operator-managed V2 authority, transactional exercise/response/evidence/audit writes, and synthetic Auth/Firestore emulator coverage. See [server boundary and deployment prerequisites](server-boundary.md).

## Run

```sh
npm ci --ignore-scripts
npm run typecheck:v2
npm run test:v2
npm run test:security
npm run test:emulator
npm run build
```

Compilation writes temporary test output to the ignored `.v2-build` directory. Existing root lint/typecheck remain separate and must not be represented as repaired by this change.

## Integration boundary

The command/query endpoints expose only the implemented exercise operations, with `HUBCYS_V2_ENABLED=true` required. They verify identity and load memberships, grants and assignments server-side in the mutation transaction. They are not wired into the legacy frontend. Scoring, verification, report and migration services remain unexposed pure-domain foundations.

The scorer expects the entire published criterion and expected-action manifests, not a caller-selected successful subset. It returns `inputs` separately from aggregate `result`/`capabilities`; persist individual input records and immutable run/result records transactionally, rather than storing only a percentage or a growing JSON blob.

`transitionRemediation` checks local state/evidence/verification invariants but does not establish that a retest executed successfully. A later verification command must validate the retest request, baseline-to-retest obligation mapping, accepted outcomes, comparability, complete finding obligations and verifier authorization before using this guard; never accept a Verification record supplied by a browser.

`authorizeCommand` is an authorization primitive, not JWT verification. Its principal and record arguments are trusted server inputs only; no existing endpoint or Firestore rule becomes protected merely by importing this module.

## Still required

The [connected exercise workflow](./exercise-workflow.md) now provides actual-app creation, manual inject release, participation, accepted observations and current-evidence scoring, verified through real APIs and local Firebase emulators.

Authoritative membership provisioning, legacy tenant-policy repairs, Storage policies, scheduled inject dispatch and outbox workers, file ingestion, persisted score runs and finalization, complete verification/retest services, organization readiness projection, reports, migration tooling and production-environment acceptance remain subsequent review units. No production-readiness claim is made by these test suites.
