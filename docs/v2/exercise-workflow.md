# Connected exercise workflow

This increment connects the existing six-section application to the V2 command service. It is not a separate demo and does not migrate or activate production.

## What is implemented

- Create a ransomware exercise from the Exercises section, using authorized organization members and a versioned context snapshot.
- Facilitate draft, scheduled, ready, running, paused and review states. Release three explicitly simulated incident injects manually.
- Assigned participants submit decisions and actions through authenticated APIs. Server timestamps, receipts, response digests, evidence, audit events and outbox records are committed transactionally.
- Assigned evaluators accept source-backed observations in review. The service rejects own-response grading, wrong-tenant or altered sources, invalid criterion types, duplicate acceptance and unauthorized callers.
- Open the existing evidence drill-down to see capability results, requirements, evaluator rationale and original participant responses. The deterministic scoring policy computes the current result from these persisted inputs.

## Verification

The emulator test opens the actual Login page, application routes and API handlers. A leader creates and facilitates an exercise; six distinct Firebase-authenticated users submit three responses each; the leader accepts three observations and opens the source-backed result.

The test asserts 18 response sources, three observations, 29 audit events and a deterministic score of 67 from two passing criteria and one failing criterion. This is deliberately local test data, not a customer readiness result. It includes mobile participation without horizontal overflow and checks that participants cannot see facilitator controls.

Run with Node 22 and Java 21 or later:

```sh
npx playwright install chromium
npm run test:emulator
npm run test:v2
npm run test:security
npm run lint:v2
npm run build
```

The test-only browser emulator connection is restricted to the `workflow-test` build mode, `demo-hubcys-v2` and loopback. Production builds do not enable it. CI installs Chromium before the emulator workflow.

## Boundaries and follow-up

- No existing customer records are deleted, converted or assigned new privileges.
- Production still needs verified server credentials, V2 activation flags, deny rules/indexes and authoritative organization memberships. Existing browser-editable legacy profiles are not a source of V2 authority.
- The connected Firebase administration tool failed before returning data during this increment. Live memberships and deployment configuration were not verified; production activation is not claimed.
- Exercise creation currently supports one authored ransomware template, direct members shown by UID, and a bounded 100-member directory. It does not send invitations or schedule notifications.
- Inject delivery is manual. Participants use “Check for updates”; unsubmitted drafts remain in the current tab during refresh but are not durable saved work.
- Context is captured and reused, but does not yet generate personalized inject content.
- Accepted observations are append-only in this workflow. Corrections require a subsequent audited supersession workflow, not overwriting.
- Exercises stop in review. Historical persisted score runs, finalization, findings creation, remediation/verification/retesting, automated reports and organization-wide readiness aggregation are not completed by this increment.
- Recorded statements prove what participants submitted, not that technical actions occurred on real infrastructure.

These checks do not establish overall production readiness. Existing repository-wide debt and the live environment gates documented in the audit remain.
