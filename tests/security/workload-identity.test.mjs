import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { syncWorkloadIdentity, workloadIdentityConfig } from '../../server/security/workload-identity.js';
import { createIdentityVerifier } from '../../server/security/identity.js';
import { createHealthHandler } from '../../api/health.js';

const PROVIDER = 'projects/123456789/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-hubcys';
const ACCOUNT = 'hubcys-runtime@hubcys-prod.iam.gserviceaccount.com';
const TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJvd25lcjpwcm9qIn0.c2lnbmF0dXJl';
const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hubcys-wif-test-'));
const configured = extra => ({ GCP_WORKLOAD_IDENTITY_PROVIDER: PROVIDER, GCP_SERVICE_ACCOUNT_EMAIL: ACCOUNT, ...extra });

test('without federation settings the server keeps plain application default credentials', () => {
  const env = {};
  const dir = tempDir();
  assert.equal(workloadIdentityConfig(env), null);
  assert.equal(syncWorkloadIdentity({ headers: {}, env, dir }), 'application_default');
  assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, undefined);
  assert.deepEqual(fs.readdirSync(dir), []);
});

for (const [name, env] of [
  ['provider only', { GCP_WORKLOAD_IDENTITY_PROVIDER: PROVIDER }],
  ['service account only', { GCP_SERVICE_ACCOUNT_EMAIL: ACCOUNT }],
  ['malformed provider', configured({ GCP_WORKLOAD_IDENTITY_PROVIDER: 'projects/x/providers/y' })],
  ['non-service-account email', configured({ GCP_SERVICE_ACCOUNT_EMAIL: 'person@gmail.com' })],
]) {
  test(`partial or malformed federation config fails closed: ${name}`, () => {
    assert.throws(() => workloadIdentityConfig(env), error => error.code === 'server/configuration');
  });
}

test('federation writes a private external-account config fed by the request OIDC token', () => {
  const env = configured({ VERCEL_OIDC_TOKEN: 'stale.build.token' });
  const dir = tempDir();
  assert.equal(syncWorkloadIdentity({ headers: { 'x-vercel-oidc-token': TOKEN }, env, dir }), 'workload_identity');
  const configPath = path.join(dir, 'external-account.json');
  const tokenPath = path.join(dir, 'vercel-oidc-token');
  assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, configPath);
  assert.equal(fs.readFileSync(tokenPath, 'utf8'), TOKEN, 'request header is preferred over the env token');
  assert.equal(fs.statSync(tokenPath).mode & 0o777, 0o600);
  assert.equal(fs.statSync(configPath).mode & 0o777, 0o600);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.deepEqual(config, {
    type: 'external_account',
    audience: `//iam.googleapis.com/${PROVIDER}`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${ACCOUNT}:generateAccessToken`,
    credential_source: { file: tokenPath, format: { type: 'text' } },
  });
  assert.equal(JSON.stringify(config).includes(TOKEN), false, 'the token is never embedded in the config');
  assert.deepEqual(fs.readdirSync(dir).sort(), ['external-account.json', 'vercel-oidc-token']);
});

test('each request refreshes the subject token; the env token is the fallback', () => {
  const dir = tempDir();
  const env = configured({ VERCEL_OIDC_TOKEN: TOKEN });
  syncWorkloadIdentity({ headers: {}, env, dir });
  assert.equal(fs.readFileSync(path.join(dir, 'vercel-oidc-token'), 'utf8'), TOKEN);
  const next = `${TOKEN}x`;
  syncWorkloadIdentity({ headers: { 'x-vercel-oidc-token': next }, env, dir });
  assert.equal(fs.readFileSync(path.join(dir, 'vercel-oidc-token'), 'utf8'), next);
});

for (const [name, headers, extra] of [
  ['missing', {}, {}],
  ['malformed header', { 'x-vercel-oidc-token': 'not a jwt' }, {}],
  ['array header', { 'x-vercel-oidc-token': [TOKEN] }, {}],
  ['oversized', { 'x-vercel-oidc-token': `${'a'.repeat(17_000)}.b.c` }, {}],
]) {
  test(`federation without a usable OIDC token fails closed: ${name}`, () => {
    assert.throws(() => syncWorkloadIdentity({ headers, env: configured(extra), dir: tempDir() }),
      error => error.code === 'server/configuration');
  });
}

test('federation refuses to override a different operator credential file', () => {
  const env = configured({ GOOGLE_APPLICATION_CREDENTIALS: '/secrets/other.json' });
  assert.throws(() => syncWorkloadIdentity({ headers: { 'x-vercel-oidc-token': TOKEN }, env, dir: tempDir() }),
    error => error.code === 'server/configuration');
  assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, '/secrets/other.json');
});

test('identity verification prepares credentials only for syntactically valid bearer tokens', async () => {
  let prepared = 0;
  const verify = createIdentityVerifier({
    projectId: () => 'hubcys',
    prepareCredentials: () => { prepared += 1; },
    getAuth: () => ({ verifyIdToken: async () => ({ uid: 'u', sub: 'u', aud: 'hubcys', iss: 'https://securetoken.google.com/hubcys' }) }),
  });
  await assert.rejects(verify({ authorization: 'Bearer nope' }), error => error.status === 401);
  assert.equal(prepared, 0);
  assert.deepEqual(await verify({ authorization: 'Bearer a.b.c' }), { uid: 'u', project_id: 'hubcys' });
  assert.equal(prepared, 1);
});

test('credential preparation failure is a 503, never an authenticated or 401 result', async () => {
  let verified = false;
  const verify = createIdentityVerifier({
    projectId: () => 'hubcys',
    prepareCredentials: () => { throw Object.assign(new Error('bad config'), { code: 'server/configuration' }); },
    getAuth: () => ({ verifyIdToken: async () => { verified = true; } }),
  });
  await assert.rejects(verify({ authorization: 'Bearer a.b.c' }), error => error.status === 503);
  assert.equal(verified, false);
});

// ── /api/health ────────────────────────────────────────────────────────────────
const SECRET = 's'.repeat(40);
function call(handler, { method = 'GET', headers = {} } = {}) {
  const res = {
    code: 0, payload: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  return handler({ method, headers }, res).then(() => res);
}
const healthEnv = extra => ({ FIREBASE_PROJECT_ID: 'hubcys-prod', HEALTH_CHECK_SECRET: SECRET, ...extra });
const okAuth = () => ({ getUser: async () => { throw Object.assign(new Error('x'), { code: 'auth/user-not-found' }); } });
const okDb = () => ({ doc: () => ({ get: async () => ({ exists: false }) }) });

test('health is hidden without a strong secret and rejects wrong secrets and methods', async () => {
  for (const env of [{}, { HEALTH_CHECK_SECRET: 'short' }]) {
    assert.equal((await call(createHealthHandler({ env }), { headers: { 'x-hubcys-health-secret': 'short' } })).code, 404);
  }
  const handler = createHealthHandler({ env: healthEnv(), getAuth: okAuth, getFirestore: okDb, syncCredentials: () => 'application_default' });
  assert.equal((await call(handler, { headers: { 'x-hubcys-health-secret': 'wrong' } })).code, 401);
  assert.equal((await call(handler, { headers: {} })).code, 401);
  assert.equal((await call(handler, { method: 'POST', headers: { 'x-hubcys-health-secret': SECRET } })).code, 405);
});

test('health reports booleans only when credentials reach Auth and Firestore', async () => {
  const handler = createHealthHandler({
    env: healthEnv({ HUBCYS_V2_ENABLED: 'false' }), getAuth: okAuth, getFirestore: okDb,
    syncCredentials: () => 'workload_identity',
  });
  const res = await call(handler, { headers: { 'x-hubcys-health-secret': SECRET, 'x-vercel-oidc-token': TOKEN } });
  assert.equal(res.code, 200);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.deepEqual(res.payload, {
    project_configured: true, credential_mode: 'workload_identity',
    auth_admin: { ok: true }, firestore: { ok: true }, v2_server_enabled: false,
  });
  assert.equal(JSON.stringify(res.payload).includes(TOKEN), false);
});

test('health surfaces sanitized failure codes without SDK messages', async () => {
  const handler = createHealthHandler({
    env: healthEnv(),
    getAuth: () => ({ getUser: async () => { throw Object.assign(new Error('secret detail'), { code: 'auth/insufficient-permission' }); } }),
    getFirestore: () => ({ doc: () => ({ get: async () => { throw Object.assign(new Error('secret detail'), { code: 7 }); } }) }),
    syncCredentials: () => 'workload_identity',
  });
  const res = await call(handler, { headers: { 'x-hubcys-health-secret': SECRET } });
  assert.equal(res.code, 503);
  assert.deepEqual(res.payload.auth_admin, { ok: false, error: 'auth/insufficient-permission' });
  assert.deepEqual(res.payload.firestore, { ok: false, error: 'grpc/7' });
  assert.equal(JSON.stringify(res.payload).includes('secret detail'), false);
});

test('health fails closed on invalid project or credential configuration', async () => {
  const bad = createHealthHandler({ env: healthEnv({ FIREBASE_PROJECT_ID: 'X' }), getAuth: okAuth, getFirestore: okDb });
  const res = await call(bad, { headers: { 'x-hubcys-health-secret': SECRET } });
  assert.equal(res.code, 503);
  assert.equal(res.payload.project_configured, false);
  assert.equal(res.payload.credential_mode, 'invalid');
});
