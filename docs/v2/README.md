# HubCyS V2 domain foundation

This additive foundation establishes validated records and pure domain rules for evidence-backed readiness. It does not change live routes, legacy Firestore collections/rules, identity bootstrap, API authentication, billing, or production behavior.

## Included

- Strict V2 record and command contracts with tenant ownership, stable capability/threat identifiers, separate observations/evidence/findings, remediation, verification, retest, reporting, advisory and audit concepts.
- Deterministic exercise/capability scoring with versioned policy, published criterion manifests, retained inputs and input digest. Unknown or ineligible evidence withholds an unqualified score; advisory, legacy and simulated-artifact records cannot count as participant-performance evidence.
- Central command authorization policy for organization membership, exercise assignments, ownership, independent verification and explicitly scoped provider-customer grants.
- Exercise/remediation state invariant guards and comparable persistent-gap detection. Completion remains separate from verification and does not alter readiness.
- Isolated strict TypeScript compilation and Node tests without Firebase, provider calls, customer records or secrets.

## Run

```sh
npm ci --ignore-scripts
npm run typecheck:v2
npm run test:v2
npm run build
```

Compilation writes temporary test output to the ignored `.v2-build` directory. Existing root lint/typecheck remain separate and must not be represented as repaired by this change.

## Integration boundary

These modules are not exposed as browser APIs and are not wired into legacy workflows. An integration must verify the identity token, resolve memberships/grants/assignments from authoritative server storage, validate all parent-child references, and call the policy before privileged database operations.

The scorer expects the entire published criterion and expected-action manifests, not a caller-selected successful subset. It returns `inputs` separately from aggregate `result`/`capabilities`; persist individual input records and immutable run/result records transactionally, rather than storing only a percentage or a growing JSON blob.

`transitionRemediation` checks local state/evidence/verification invariants but does not establish that a retest executed successfully. A later verification command must validate the retest request, baseline-to-retest obligation mapping, accepted outcomes, comparability, complete finding obligations and verifier authorization before using this guard; never accept a Verification record supplied by a browser.

`authorizeCommand` is an authorization primitive, not JWT verification. Its principal and record arguments are trusted server inputs only; no existing endpoint or Firestore rule becomes protected merely by importing this module.

## Still required

Server identity verification, authoritative membership provisioning, Firestore/Storage policies and emulator tests, transactional commands/audit/outbox, durable exercise runtime, real participant responses, file ingestion, complete verification/retest services, organization readiness projection, reports, migration tooling, and environment-matched end-to-end acceptance remain subsequent review units. No production-readiness claim is made by the unit suite.
