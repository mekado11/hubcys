import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createServer } from 'vite';
import { getServerAuth, getServerFirestore } from '../../server/security/firebase.js';

test('actual client loads safe profiles, denies privilege writes and explains paused joining', { timeout: 120_000 }, async () => {
  assert.equal(process.env.FIREBASE_PROJECT_ID, 'demo-hubcys-v2');
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  const auth = getServerAuth();
  const db = getServerFirestore();
  const uid = 'browser-profile-test';
  const email = `${uid}@example.test`;
  try { await auth.deleteUser(uid); } catch {}
  await auth.createUser({ uid, email, password: 'Local-only-test-123!', emailVerified: true });
  await db.doc(`users/${uid}`).delete();
  Object.assign(process.env, {
    VITE_FIREBASE_API_KEY: 'local-test-only', VITE_FIREBASE_PROJECT_ID: 'demo-hubcys-v2',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-hubcys-v2.firebaseapp.com', VITE_FIREBASE_APP_ID: 'local-test',
    VITE_HUBCYS_V2_ENABLED: 'false',
    // Previously this value enabled client-controlled admin bootstrapping.
    VITE_SUPER_ADMIN_EMAIL: email,
  });
  const server = await createServer({
    server: { host: '127.0.0.1', port: 5183, strictPort: true },
    plugins: [{
      name: 'local-profile-emulators', enforce: 'post',
      transform(code, id) {
        if (!id.endsWith('/src/api/firebase.js')) return null;
        // Test-process-only instrumentation; no emulator hook enters application source.
        return `${code}
          import { connectAuthEmulator as connectLocalAuth } from 'firebase/auth';
          import { connectFirestoreEmulator as connectLocalFirestore } from 'firebase/firestore';
          if (auth.app.options.projectId !== 'demo-hubcys-v2' || location.hostname !== '127.0.0.1') throw new Error('Unsafe test target');
          connectLocalAuth(auth, 'http://127.0.0.1:9099', {disableWarnings:true});
          connectLocalFirestore(db, '127.0.0.1', 8080);
        `;
      },
    }],
  });
  await server.listen();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => localStorage.setItem('cookieConsent', 'declined'));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:5183/Login?returnUrl=%2FCompanyOnboarding');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Local-only-test-123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Welcome to Hubcys!', { exact: true })).toBeVisible();
    const profile = (await db.doc(`users/${uid}`).get()).data()!;
    assert.equal(profile.is_super_admin, false);
    assert.equal(profile.company_id, undefined);
    assert.equal(profile.subscription_tier, 'free_trial');
    const effective = await page.evaluate(async () => {
      const modulePath = '/src/entities/User.js';
      const module = await import(/* @vite-ignore */ modulePath);
      const me = await module.User.me({ force: true });
      try { await module.User.updateMyUserData({ is_super_admin: true }); return { me, denied: false }; }
      catch { return { me, denied: true }; }
    });
    assert.equal(effective.me.is_super_admin, false);
    assert.equal(effective.denied, true);
    await page.getByRole('button', { name: /Join Existing Company/ }).click();
    await expect(page.getByText('Self-service joining is paused. Contact your administrator for verified account provisioning.')).toBeVisible();
    assert.equal(await page.getByRole('button', { name: 'Join Company', exact: true }).count(), 0);
    assert.equal(await page.getByRole('textbox').count(), 0);
    assert.equal((await db.doc(`users/${uid}`).get()).data()?.company_id, undefined);
    mkdirSync('test-results/profile-security', { recursive: true });
    await page.screenshot({ path: 'test-results/profile-security/join-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/profile-security/join-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

    // A historical forged profile flag stays ineffective in the actual User client.
    await db.doc(`users/${uid}`).update({ is_super_admin: true, id: 'another-user' });
    const forged = await page.evaluate(async () => {
      const modulePath = '/src/entities/User.js';
      const module = await import(/* @vite-ignore */ modulePath);
      return module.User.me({ force: true });
    });
    assert.equal(forged.is_super_admin, false);
    assert.equal(forged.id, uid);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await server.close();
    await auth.deleteUser(uid);
  }
});
