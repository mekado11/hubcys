# Six-section shell and evidence drill-down

## Review scope

`/app/*` adds Overview, Readiness, Exercises, Remediation, Threats and Reporting, with Organization, Team, Settings and Administration as secondary destinations. Existing routes remain intact, with a return link from their navigation. `VITE_HUBCYS_V2_ENABLED=true` redirects the former Dashboard entry to the new overview; it does not grant server access.

The existing `HUBCYS_V2_ENABLED` server gate remains mandatory. The browser obtains a Firebase token, discovers server-managed organization memberships/grants, and sends a selected organization identifier that is independently authorized on each read. No legacy profile field establishes V2 authority.

Organization discovery requires the collection-group single-field indexes described in `firestore.v2.indexes.json`. Merge these definitions with the authoritative deployment index configuration during a reviewed deployment; do not replace unrelated indexes or deploy automatically. Emulator tests do not establish that production indexes exist.

The evidence endpoint requires current reviewer permission and an active facilitator/evaluator exercise assignment. Participants cannot retrieve expectations, rubrics or others' evidence by guessing a URL. Provider grants must include the corresponding read/review permissions.

## Read-model boundaries

The index is a bounded view of the latest 50 exercise records, filtered to the caller's access. It is not an organization-wide count or readiness projection. Organizations with more records receive an explicit truncation notice; full pagination is subsequent work.

Evidence drill-down uses complete scenario manifests and accepted observations. Participant-response sources are resolved from the same organization/exercise and checked against their SHA-256 digest. Missing, altered and unresolved source types cannot contribute to the displayed calculation. This read-only computation is explicitly labeled current-evidence view, not persisted score history.

The UI shows expected actions, observed measurements, scoring weights, evaluator identity/time, evidence provenance, findings and linked corrective-action states. It does not infer verification from completion or assert that a participant's statement proves a technical action occurred.

Observation rows live under `organizations/{id}/observations`, findings under `findings`, and V2 corrective work under `actions`. No records are created or migrated by this read-only shell. Provisioning and observation acceptance still require their planned server workflows.

Remediation queue aggregation, new report generation and personalized threat recommendations are not implemented here. Those sections label that boundary and preserve access to existing workflows rather than showing fabricated counts, scores or recommendations.

## Isolated interface review

Run `npm run build:review` on Node 22, then serve `review-dist` with `review.html` as its entry. This separate entry uses synthetic fixtures and the same UI components, but imports neither production Firebase initialization nor authentication. The primary production entry cannot import this fixture by a URL flag or request header.

`review/fixture.json` is generated from validated test data and excluded from Git. `npm run build` does not include the review entry. The review banner remains visible in every fixture state; no review operation accesses customer data or writes to production.

## QA inventory

- Six primary routes: click each at desktop and mobile; confirm active navigation and distinct content.
- Secondary destinations: verify organization context and utilities, with administration hidden unless server role permits it.
- Overview: no invented organization score or improvement trend; visible evidence entry point.
- Organization selection: switch to an empty organization and back; no stale evidence survives.
- Readiness: filter threat, filter exercise text, clear filters and open an evidence chain.
- Evidence: select capability; expand expected/observed row; inspect source, calculation, provenance, finding and action status; return to readiness.
- Defensive states: loading, no membership, empty list, access denied, unavailable service and unresolved evidence.
- Mobile navigation: open, close, Escape, active item and keyboard focus; no horizontal overflow at 390px or 375px.
- Theme: light/dark toggle and 200% zoom/reflow.
- Production auth boundary: signed-out access does not show evidence; real emulator role/tenant negative tests cover the read API.
- Legacy route links: preserved destinations, not silently replaced with synthetic data.

Visual preview evidence does not establish deployed IAM, server credential configuration or a live customer workflow. The full readiness/remediation/retest/report acceptance story remains separate work.

## Verification at this review boundary

Node 22 verification passed: strict V2 server/domain typecheck, scoped interface lint, 68 domain tests, 34 identity/client tests, 18 Firebase emulator integration tests and 14 Playwright browser tests across desktop and mobile. Production and isolated-review builds passed. The production bundle was checked for synthetic organization, responder and finding identifiers; none were included.

Rendered review covered all six sections, expanded source provenance, capability switching, light/dark themes, organization switching, preserved legacy destinations, empty/restricted/unavailable/loading states and enlarged-text reflow at 720px. A mobile current-route menu-close issue and enlarged-text grid overflow were found and fixed. No page errors or horizontal overflow remained in the tested desktop/mobile views.

Existing repository-wide checks remain unresolved: 23 lint errors and 2,991 root typecheck diagnostics. npm audit still reports 34 findings including 2 critical and 13 high; no dependency-security clearance is claimed. New source is behind the documented server authority/activation boundary, not a production release verdict.
