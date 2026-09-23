# Keyless Vercel → Firebase server credentials

## Problem

`server/security/firebase.js` initializes Firebase Admin with `applicationDefault()`. Vercel functions have no Google Application Default Credentials, so every identity-verified API (`/api/ai`, the five utility APIs and all `/api/v2/*`) fails closed with 503 in production.

firebase-admin's Firestore client accepts only a service-account certificate or ADC. A custom credential object would work for Auth but break Firestore. Federation is therefore delivered *through* ADC.

## How it works

`server/security/workload-identity.js`, called by `requireIdentity` after a syntactically valid bearer token is presented:

1. Reads `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT_EMAIL`. If both are absent, plain ADC applies (local `gcloud auth application-default login`). Partial or malformed values fail closed (503).
2. Writes the per-request Vercel OIDC token (`x-vercel-oidc-token` header, falling back to `VERCEL_OIDC_TOKEN`) to `/tmp/hubcys-wif/vercel-oidc-token` (mode 0600, atomic rename).
3. Writes an `external_account` config pointing at that file, and sets `GOOGLE_APPLICATION_CREDENTIALS` to it. It refuses to override a different operator-supplied credential file.
4. google-auth-library exchanges the token at Google STS and impersonates the runtime service account. Both Firebase Auth admin calls and Firestore use the resulting short-lived token.

No key is stored anywhere, and the token is never logged or returned. A forged header cannot widen access: STS accepts only Vercel-signed tokens that satisfy the provider's attribute condition.

## One-time setup (project owner)

Replace `PROJECT_ID` with the reviewed production Firebase project. The Vercel team slug is `mekado11s-projects` and the project is `hubcys`.

```sh
PROJECT_ID=your-firebase-project
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SUBJECT='owner:mekado11s-projects:project:hubcys:environment:production'
SA="hubcys-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud services enable sts.googleapis.com iamcredentials.googleapis.com --project="$PROJECT_ID"

gcloud iam workload-identity-pools create vercel-pool \
  --project="$PROJECT_ID" --location=global --display-name="Vercel"
gcloud iam workload-identity-pools providers create-oidc vercel-hubcys \
  --project="$PROJECT_ID" --location=global --workload-identity-pool=vercel-pool \
  --issuer-uri="https://oidc.vercel.com/mekado11s-projects" \
  --allowed-audiences="https://vercel.com/mekado11s-projects" \
  --attribute-mapping="google.subject=assertion.sub" \
  --attribute-condition="assertion.sub == '${SUBJECT}'"

gcloud iam service-accounts create hubcys-runtime --project="$PROJECT_ID" \
  --display-name="HubCyS Vercel runtime"
# Least privilege: Firestore data access and Auth user lookup (revocation checks).
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA}" --role=roles/datastore.user
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA}" --role=roles/firebaseauth.viewer
# Only the production deployment of this Vercel project may impersonate it.
gcloud iam service-accounts add-iam-policy-binding "$SA" --project="$PROJECT_ID" \
  --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/vercel-pool/subject/${SUBJECT}"
```

In Vercel, go to **Project → Settings → Security → Secure backend access with OIDC federation** and enable it in **Team** issuer mode. Then set these **Production-only** environment variables and redeploy:

| Variable | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | `$PROJECT_ID` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-hubcys` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | `$SA` |
| `HEALTH_CHECK_SECRET` | output of `openssl rand -hex 32` (sensitive) |
| `HUBCYS_V2_ENABLED` | `false` (unchanged until activation acceptance) |

Preview deployments are intentionally excluded by the attribute condition. Add a separate provider/subject if previews ever need server access.

## Verify

The deployment is behind Vercel Deployment Protection. Use a [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) secret, or run the request from a browser session that is logged in to Vercel.

```sh
curl -sS https://<production-host>/api/health \
  -H "x-hubcys-health-secret: $HEALTH_CHECK_SECRET" \
  -H "x-vercel-protection-bypass: $VERCEL_BYPASS"
```

Expected: HTTP 200 with `credential_mode: "workload_identity"`, `auth_admin.ok: true` and `firestore.ok: true`. The probe reads a nonexistent user and document, and returns only booleans and sanitized error codes. Common failures:

- `auth_admin.error: auth/insufficient-permission`: the `firebaseauth.viewer` role is missing.
- `firestore.error: grpc/7`: the `datastore.user` role is missing.
- `credential_mode: invalid`: the env vars are malformed or OIDC is not enabled.

Unset `HEALTH_CHECK_SECRET` to disable the endpoint again (404).

## Scope

This changes only how the server obtains Google credentials. It does not deploy rules, provision memberships, grant claims or enable V2.
