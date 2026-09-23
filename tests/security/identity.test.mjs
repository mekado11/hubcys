import test from 'node:test';
import assert from 'node:assert/strict';
import { bearerToken, createIdentityVerifier } from '../../server/security/identity.js';
import { validateServerEnvironment } from '../../server/security/firebase.js';

const decoded = {
  uid: 'person', sub: 'person', aud: 'hubcys',
  iss: 'https://securetoken.google.com/hubcys',
  is_super_admin: true, company_id: 'untrusted-claim',
};
test('verified identity invokes Firebase revocation checks and strips authority fields', async () => {
  const verify = createIdentityVerifier({
    projectId: () => 'hubcys',
    getAuth: () => ({
      verifyIdToken: async (token, revoked) => {
        assert.equal(token, 'valid.token.signature');
        assert.equal(revoked, true);
        return decoded;
      },
    }),
  });
  const identity = await verify({ authorization: 'Bearer valid.token.signature' });
  assert.deepEqual(identity, { uid: 'person', project_id: 'hubcys' });
  assert.equal(Object.isFrozen(identity), true);
});

for (const credential of [undefined, '', 'Bearer not-valid', 'Basic abc', ['Bearer a.b.c'], 'Bearer a.b.c extra', 'Bearer a.b.c,Bearer d.e.f', 'Bearer ' + 'a'.repeat(20_000)]) {
  test(`reject malformed header ${String(credential).slice(0, 40)}`, () => {
    assert.throws(() => bearerToken({ authorization: credential }), error => error.status === 401);
  });
}
for (const code of ['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/user-disabled', 'auth/user-not-found']) {
  test(`${code} fails authentication`, async () => {
    const verify = createIdentityVerifier({
      projectId: () => 'hubcys',
      getAuth: () => ({ verifyIdToken: async () => { throw Object.assign(new Error('private SDK detail'), { code }); } }),
    });
    await assert.rejects(verify({ authorization: 'Bearer a.b.c' }), error => error.status === 401 && error.message === 'Unauthorized');
  });
}
for (const patch of [{ uid: '' }, { sub: 'different' }, { aud: 'another-project' }, { iss: 'https://attacker.invalid' }]) {
  test(`reject mismatched verified claim ${Object.keys(patch)[0]}`, async () => {
    const verify = createIdentityVerifier({
      projectId: () => 'hubcys', getAuth: () => ({ verifyIdToken: async () => ({ ...decoded, ...patch }) }),
    });
    await assert.rejects(verify({ authorization: 'Bearer a.b.c' }), error => error.status === 401);
  });
}
test('upstream/configuration errors fail closed with 503 rather than allowing access', async () => {
  const verify = createIdentityVerifier({
    projectId: () => 'hubcys', getAuth: () => { throw new Error('secret infrastructure detail'); },
  });
  await assert.rejects(verify({ authorization: 'Bearer a.b.c' }), error => error.status === 503 && !error.message.includes('secret'));
});
test('production cannot enable emulator token acceptance, even with a demo project', () => {
  for (const env of [
    { FIREBASE_PROJECT_ID: 'hubcys', NODE_ENV: 'production', FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099' },
    { FIREBASE_PROJECT_ID: 'demo-hubcys-v2', NODE_ENV: 'test', FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099', VERCEL: '1' },
    { FIREBASE_PROJECT_ID: 'hubcys', NODE_ENV: 'test', FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099' },
    { FIREBASE_PROJECT_ID: 'demo-hubcys-v2', NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: 'remote.test:8080' },
    {},
  ]) assert.throws(() => validateServerEnvironment(env));
  assert.equal(validateServerEnvironment({
    FIREBASE_PROJECT_ID: 'demo-hubcys-v2', NODE_ENV: 'test',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  }), 'demo-hubcys-v2');
});
