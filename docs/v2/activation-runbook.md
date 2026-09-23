# V2 production activation runbook

The ordered, reversible path to turning on the redesigned workspace for the first operator. Each step is independently verifiable. Nothing here changes hubcys.com, which is still served by the legacy Base44 app and uses a separate backend. The target is the Vercel production deployment (`mekado11s-projects/hubcys`) and its Firebase project.

Run everything as a Firebase project owner on Node 22, from a checkout of `main` with `npm ci --ignore-scripts` done. `P` is the production Firebase project ID.

## 0. Local operator credentials

```sh
gcloud auth application-default login
gcloud auth application-default set-quota-project P
export FIREBASE_PROJECT_ID=P
```

Every operator command also requires `--project P`, and refuses to run if it differs from `FIREBASE_PROJECT_ID`. Commands are **dry runs unless `--apply` is given**, and print the exact before/after changes.

## 1. Back up and assess (read-only)

```sh
firebase firestore:indexes --project P > backup-indexes.json
gcloud firestore export gs://<backup-bucket>/pre-v2-activation --project P   # optional full data backup
npm run operator -- audit-legacy-admins --project P
npm run operator -- inspect --project P --email mekadogroup@gmail.com
```

- Save the current rules from **Firebase console → Firestore → Rules** (history is retained there).
- `audit-legacy-admins` lists every account whose profile says `is_super_admin`. After step 5 those profile flags confer **nothing**; only the Auth claim does. For each row, decide whether it is a real operator (grant the claim in step 3) or a forged or stale flag (leave it).
- In `inspect` output, confirm `email_verified: true`. If it is false, verify the email through the app first; unverified accounts are refused. Note your `uid`.

## 2. Server credentials

Follow [vercel-credentials.md](vercel-credentials.md). Done when `/api/health` returns 200 with `credential_mode: "workload_identity"`, `auth_admin.ok` and `firestore.ok`.

## 3. Operator claim for your account

```sh
npm run operator -- grant-operator --project P --uid <your-uid>           # review
npm run operator -- grant-operator --project P --uid <your-uid> --apply
```

Sign out and back in so your ID token carries the claim. Other claims on the account are preserved. `revoke-operator` removes the claim and revokes existing sessions.

## 4. Organization and membership

```sh
npm run operator -- provision-org --project P --org <org-id> --name "<Organization name>" \
  --context "<one paragraph: industry, critical systems, identity provider, key vendors>" --actor <your-uid>
npm run operator -- provision-org ... --apply
npm run operator -- add-member --project P --org <org-id> --uid <your-uid> --roles readiness_lead --actor <your-uid>
npm run operator -- add-member ... --apply
```

- `<org-id>` must match `[A-Za-z0-9][A-Za-z0-9_.:-]*`, for example `hubcys-internal`.
- Records are validated against the V2 contracts. Existing records are never overwritten; a re-run is a no-op.
- Each write appends an audit event under `organizations/<org-id>/audit_events`.
- Membership updates abort if the record changed after planning.
- The `--context` text becomes the published context shown to exercise creators.
- To run and review a real exercise you need at least one more verified account as a participant (`--roles participant`), because evaluators cannot grade their own responses.

## 5. Indexes, then rules

```sh
firebase deploy --only firestore:indexes --project P    # never --force: keeps unrelated deployed indexes
firebase deploy --only firestore:rules --project P
```

- Wait until the `memberships.uid` and `provider_grants.subject_uid` collection-group indexes show **Enabled** in the console before deploying rules.
- The rules deploy is the hardened `firestore.rules` from main. The Vercel production frontend already ships the matching client, so the two are consistent.
- Expected effects are listed in [firestore-security-fix.md](firestore-security-fix.md): profile-based admin stops working, access-code joining is paused, and same-company CRUD is preserved.
- Rollback: republish a previous version from console rules history **only after review**. Never restore the vulnerable self-editable `users` rule; prefer a restrictive containment rule set.

## 6. Enable V2

In Vercel, set **Production** `HUBCYS_V2_ENABLED=true` and `VITE_HUBCYS_V2_ENABLED=true`, then redeploy. The `VITE_` flag is compiled into the bundle, so a rebuild is required. Rollback: set both to `false` and redeploy. No data changes.

## 7. Acceptance (record results in activation-status.md)

Positive:
- Log in on the production URL. **Dashboard** redirects to `/app/overview` and your organization appears in the selector.
- On Exercises, create the ransomware exercise, schedule, set ready, start, and release an inject.
- The participant account submits a response.
- You accept an observation, then open the evidence drill-down and see the source-backed result.

Negative:
- A verified account with no membership sees the no-membership state.
- A legacy user from another company cannot read your records.
- `inspect` on a non-operator shows `operator_claim: false`.

Afterwards, unset `HEALTH_CHECK_SECRET` if the health endpoint should be disabled.
