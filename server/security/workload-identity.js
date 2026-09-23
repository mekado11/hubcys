import fs from 'node:fs';
import path from 'node:path';
import { ServerConfigurationError } from './firebase.js';

// Keyless server credentials for Vercel: a Vercel-issued OIDC token is exchanged
// through GCP Workload Identity Federation for a short-lived, impersonated
// service-account token. firebase-admin's Firestore accepts only certificate or
// Application Default Credentials, so federation is delivered through ADC:
// an `external_account` config whose subject token is a file refreshed per request.

const PROVIDER = /^projects\/\d{1,20}\/locations\/global\/workloadIdentityPools\/[a-z0-9-]{4,32}\/providers\/[a-z0-9-]{4,32}$/;
const SERVICE_ACCOUNT = /^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z][a-z0-9-]{4,28}[a-z0-9]\.iam\.gserviceaccount\.com$/;
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
export const DEFAULT_CREDENTIAL_DIR = '/tmp/hubcys-wif';

/** Returns null when federation is not configured (plain ADC applies). Partial or malformed config fails closed. */
export function workloadIdentityConfig(env = process.env) {
  const provider = env.GCP_WORKLOAD_IDENTITY_PROVIDER;
  const serviceAccount = env.GCP_SERVICE_ACCOUNT_EMAIL;
  if (!provider && !serviceAccount) return null;
  if (!PROVIDER.test(provider || '') || !SERVICE_ACCOUNT.test(serviceAccount || '')) throw new ServerConfigurationError();
  return { provider, serviceAccount };
}

export function externalAccountConfig({ provider, serviceAccount }, tokenPath) {
  return {
    type: 'external_account',
    audience: `//iam.googleapis.com/${provider}`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    credential_source: { file: tokenPath, format: { type: 'text' } },
  };
}

// Vercel injects the runtime token as a request header; the env var covers builds and `vercel dev`.
// A forged header cannot widen access: STS only accepts tokens signed by the configured Vercel issuer
// that also satisfy the provider's attribute condition.
function oidcToken(headers, env) {
  const header = headers?.['x-vercel-oidc-token'];
  const token = typeof header === 'string' && header ? header : env.VERCEL_OIDC_TOKEN;
  if (typeof token !== 'string' || token.length > 16_384 || !JWT.test(token)) throw new ServerConfigurationError();
  return token;
}

function writeAtomic(file, contents) {
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tmp, contents, { mode: 0o600 });
  fs.renameSync(tmp, file);
}

/**
 * Refreshes the federated credential before any Firebase Admin call in this request.
 * Returns 'workload_identity' or 'application_default'. Never logs or returns the token.
 */
export function syncWorkloadIdentity({ headers, env = process.env, dir = DEFAULT_CREDENTIAL_DIR } = {}) {
  const config = workloadIdentityConfig(env);
  if (!config) return 'application_default';
  const tokenPath = path.join(dir, 'vercel-oidc-token');
  const configPath = path.join(dir, 'external-account.json');
  // Refuse to silently override a different operator-supplied credential file.
  if (env.GOOGLE_APPLICATION_CREDENTIALS && env.GOOGLE_APPLICATION_CREDENTIALS !== configPath) {
    throw new ServerConfigurationError();
  }
  const token = oidcToken(headers, env);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeAtomic(tokenPath, token);
  const serialized = JSON.stringify(externalAccountConfig(config, tokenPath));
  let current = null;
  try { current = fs.readFileSync(configPath, 'utf8'); } catch { /* first request on this instance */ }
  if (current !== serialized) writeAtomic(configPath, serialized);
  env.GOOGLE_APPLICATION_CREDENTIALS = configPath;
  return 'workload_identity';
}
