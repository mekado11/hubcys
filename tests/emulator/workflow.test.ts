import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer as httpServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { chromium, expect, type Page } from '@playwright/test';
import { createServer as viteServer } from 'vite';
import commands from '../../api/v2/commands.js';
import workspace from '../../api/v2/exercise.js';
import readiness from '../../api/v2/readiness.js';
import { getServerFirestore, getServerAuth } from '../../server/security/firebase.js';
import { executeExerciseCommand } from '../../server/v2/command-service.js';
import { getEvidenceDrilldown } from '../../server/v2/readiness-query.js';

test('actual application: create → facilitate → six employee responses → evaluator observations → explainable result', { timeout: 180_000 }, async () => {
  assert.equal(process.env.FIREBASE_PROJECT_ID, 'demo-hubcys-v2');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  process.env.HUBCYS_V2_ENABLED = 'true';
  Object.assign(process.env, {
    VITE_FIREBASE_API_KEY: 'local-emulator-only', VITE_FIREBASE_PROJECT_ID: 'demo-hubcys-v2',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-hubcys-v2.firebaseapp.com', VITE_FIREBASE_APP_ID: 'local-test',
    VITE_HUBCYS_V2_ENABLED: 'true',
  });
  const db = getServerFirestore();
  const auth = getServerAuth();
  const root = db.doc('organizations/workflow-org');
  const now = new Date().toISOString();
  const base = (id: string) => ({ id, organization_id: 'workflow-org', schema_version: 1, created_at: now, created_by_uid: 'workflow-leader' });
  await root.set({ ...base('workflow-org'), name: 'Local workflow test organization', status: 'active' });
  const users = ['workflow-leader', ...Array.from({ length: 6 }, (_, i) => `workflow-p${i + 1}`)];
  for (const uid of users) {
    try { await auth.deleteUser(uid); } catch {}
    await auth.createUser({ uid, email: `${uid}@example.test`, password: 'Local-only-pass-123!' });
    await db.doc(`users/${uid}`).set({ approval_status: 'approved', company_id: 'workflow-org', company_onboarding_completed: true, disclaimer_acknowledged: true, full_name: uid });
    await root.collection('memberships').doc(uid).set({ ...base(uid), uid, status: 'active', roles: uid === 'workflow-leader' ? ['readiness_lead'] : ['participant'] });
  }
  const vite = await viteServer({ mode: 'workflow-test', server: { middlewareMode: true }, appType: 'spa' });
  const handlers = { '/api/v2/commands': commands, '/api/v2/exercise': workspace, '/api/v2/readiness': readiness };
  const server = httpServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const handler = handlers[url.pathname as keyof typeof handlers];
    if (!handler) return vite.middlewares(req, res);
    try {
      let raw = ''; for await (const part of req) raw += part;
      Object.assign(req, { query: Object.fromEntries(url.searchParams), body: raw ? JSON.parse(raw) : undefined });
      Object.assign(res, {
        status(code: number) { res.statusCode = code; return res; },
        json(value: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); },
      });
      await handler(req as Parameters<typeof handler>[0], res as Parameters<typeof handler>[1]);
    } catch { res.statusCode = 500; res.end('Local test adapter error'); }
  });
  await new Promise<void>(resolve => server.listen(5182, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  const contexts = [];
  const errors: string[] = [];
  async function signIn(page: Page, uid: string, returnUrl: string) {
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:5182/Login?returnUrl=${encodeURIComponent(returnUrl)}`);
    await page.getByLabel('Email', { exact: true }).fill(`${uid}@example.test`);
    await page.getByLabel('Password', { exact: true }).fill('Local-only-pass-123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(`**${returnUrl}`);
  }
  try {
    const leaderContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    contexts.push(leaderContext);
    const leader = await leaderContext.newPage();
    await signIn(leader, 'workflow-leader', '/app/exercises/new?org=workflow-org');
    await leader.getByLabel('Systems and business context').fill('Identity provider, endpoints and shared business files. Preserve forensic evidence before rebuilding systems.');
    for (let i = 1; i <= 6; i++) await leader.getByRole('checkbox', { name: `workflow-p${i} Participant`, exact: true }).check();
    await leader.getByRole('button', { name: 'Create exercise', exact: true }).click();
    await leader.getByRole('button', { name: 'Schedule exercise', exact: true }).waitFor();
    const exerciseId = new URL(leader.url()).pathname.split('/').at(-1)!;
    for (const name of ['Schedule exercise', 'Mark ready', 'Start exercise']) {
      await leader.getByRole('button', { name, exact: true }).click();
    }
    for (const title of ['Suspicious sign-in and script execution', 'Encryption activity detected', 'Executive status request']) {
      const button = leader.getByRole('button', { name: `Release ${title}`, exact: true });
      await button.click();
      await expect(button.locator('..').getByText('Released', { exact: true })).toBeVisible();
      await expect(leader.getByRole('button', { name: 'Check for updates', exact: true })).toBeEnabled();
    }
    mkdirSync('test-results/workflow', { recursive: true });
    await leader.screenshot({ path: 'test-results/workflow/facilitator.png', fullPage: true });
    for (let i = 1; i <= 6; i++) {
      const context = await browser.newContext({ viewport: i === 1 ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
      contexts.push(context);
      const participant = await context.newPage();
      await signIn(participant, `workflow-p${i}`, `/app/exercises/${exerciseId}?org=workflow-org`);
      await participant.getByRole('heading', { name: 'Record your response' }).waitFor();
      assert.equal(await participant.getByRole('heading', { name: 'Facilitator controls' }).count(), 0);
      for (const [inject, text] of [
        ['inject-triage', 'Affected identity and endpoint recorded. Incident classified and response lead assigned.'],
        ['inject-preserve', 'Endpoint reimaged before acquiring a forensic image.'],
        ['inject-communicate', 'Leadership informed of confirmed impact and uncertainty. Response lead owns the next update.'],
      ]) {
        await participant.getByLabel('Released inject', { exact: true }).selectOption(inject!);
        await participant.getByLabel('Your decision, action or communication').fill(text!);
        await participant.getByRole('button', { name: 'Submit response', exact: true }).click();
        await participant.getByLabel('Your decision, action or communication').waitFor();
        await participant.waitForFunction(() => (document.querySelector('textarea') as HTMLTextAreaElement)?.value === '');
      }
      if (i === 1) {
        assert.equal(await participant.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await participant.screenshot({ path: 'test-results/workflow/participant-mobile.png', fullPage: true });
      }
      await context.close();
    }
    await leader.getByRole('button', { name: 'Check for updates' }).click();
    await leader.getByRole('button', { name: 'End response phase', exact: true }).click();
    for (const [criterion, inject, result] of [['criterion-triage', 'inject-triage', 'pass'], ['criterion-preserve', 'inject-preserve', 'fail'], ['criterion-communicate', 'inject-communicate', 'pass']]) {
      await leader.getByLabel('Criterion', { exact: true }).selectOption(criterion!);
      await leader.getByLabel('Observed result', { exact: true }).selectOption(result!);
      const choices = leader.locator('.v2-evidence-choice').filter({ hasText: inject! }).getByRole('checkbox');
      assert.equal(await choices.count(), 6);
      for (const choice of await choices.all()) await choice.check();
      await leader.getByLabel('Evaluator rationale').fill(result === 'fail' ? 'Each responder explicitly reported reimaging before forensic acquisition.' : 'Recorded responses directly address the stated exercise objective.');
      await leader.getByRole('button', { name: 'Accept observation', exact: true }).click();
      await leader.waitForFunction(() => !Array.from(document.querySelectorAll('button')).some(b => b.textContent === 'Refreshing…'));
      await leader.getByRole('heading', { name: criterion === 'criterion-communicate' ? 'All criteria have accepted observations' : 'Accept an evaluator observation', exact: true }).waitFor();
    }
    await leader.getByRole('link', { name: 'View evidence and results', exact: true }).first().click();
    await leader.getByRole('button', { name: 'Evidence Preservation 0' }).click();
    await leader.getByRole('button', { name: /Preserve forensic evidence before reimaging/ }).click();
    await leader.screenshot({ path: 'test-results/workflow/evidence-result.png', fullPage: true });
    const view = await getEvidenceDrilldown(db, 'workflow-leader', 'workflow-org', exerciseId);
    assert.equal(view.score?.result.score, 67);
    assert.equal(view.observations.length, 3);
    assert.equal(view.sources.length, 18);
    assert.equal((await root.collection('audit_events').get()).size, 29);
    const rejected = { command: 'accept_observation', organization_id: 'workflow-org', exercise_id: exerciseId, expected_record_version: view.exercise.record_version, criterion_id: 'criterion-preserve', measurement: { kind: 'completion', completed: true, omission_observed: false }, rationale: 'Attempt to change a recorded result', evidence_ids: [view.sources[0]!.evidence.id], idempotency_key: 'cannot-overwrite' };
    await assert.rejects(executeExerciseCommand(db, 'workflow-leader', rejected), /OBSERVATION_ALREADY_ACCEPTED/);
    await assert.rejects(executeExerciseCommand(db, 'workflow-p1', { ...rejected, idempotency_key: 'cannot-self-grade' }), /FORBIDDEN/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await vite.close();
    await new Promise<void>(resolve => server.close(() => resolve()));
    for (const uid of users) await auth.deleteUser(uid);
    delete process.env.HUBCYS_V2_ENABLED;
  }
});
