# Operational UI redesign

## Scope and boundary

This review unit is stacked on the connected exercise workflow in PR #23. It changes the actual V2 application components, not a separate mock application. It does not merge the independent security fix in PR #24 or enable V2 in production.

The layout uses a quiet navigation rail, a compact evidence-led overview, capability comparisons, a threat coverage index, an exercise register and a finding-linked action register. Typography, status treatment, source records and controls share one stylesheet. Existing authorization and deterministic scoring remain unchanged.

The overview and remediation register fetch the latest reviewable exercise through the existing authorized evidence endpoint. They are explicitly exercise-scoped, not organization-wide projections. Organization readiness and verified improvement stay unmeasured until those capabilities exist. Threat recommendations and V2 report generation remain visibly unconnected. Existing utilities remain available.

## QA inventory

- Six sections: desktop and mobile navigation, headings, selected state, no horizontal overflow.
- Overview: show the actual returned exercise score; keep organization readiness unmeasured; capability link selects the correct evidence result.
- Readiness: threat index toggle, threat selector and text filter; source drill-down, accepted observations, calculation, provenance and finding.
- Remediation: all / awaiting verification / verified filters; finding trace; no assertion that completed work is verified.
- Exercises: create form, workspace links, live local-emulator create / release / respond / review journey.
- Shared controls: organization switch, refresh, theme toggle, keyboard skip link, mobile menu and Escape.
- Failure cases: no membership, empty records, unavailable service, access denial, unverified source and replacement request while loading.
- Visual review: desktop and mobile six-section renders, expanded evidence, dark overview and constrained/zoomed viewport.

## Review preview

The review build mounts the same application with clearly labeled synthetic records. It cannot write to production. Its create form is explicitly read-only; exercise workspace operations require the connected application and are not simulated as successful saves. The real exercise journey is tested separately against local Firebase emulators.

## Verification

- V2 typecheck and scoped lint passed.
- 68 domain tests and 34 security/client tests passed.
- 20 local-emulator tests passed, including the actual application journey with a facilitator and six participant identities.
- 20 UI tests passed across desktop and mobile. The suite covers the new result drill-down, action-state filtering and finding trace, plus the original authorization/error/tenant-switch boundaries.
- Production and synthetic-review builds passed. Existing legacy-bundle size and browser-compatibility database warnings remain.
- Rendered all six primary sections at 1440px desktop and 390px mobile; inspected expanded source evidence and dark overview. No horizontal overflow was found at those sizes or the effective 720px CSS viewport corresponding to a 1440px display at 200% browser zoom. This is viewport-reflow evidence, not native browser zoom automation.
- Threat recommendations, report generation, organization-wide remediation aggregation, readiness projections and historical improvement remain outside this UI review unit. No production acceptance, rules deployment, membership provisioning or feature activation was performed.
