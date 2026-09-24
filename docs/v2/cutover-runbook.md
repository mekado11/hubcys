# hubcys.com cut-over runbook (Base44 → Vercel redesign)

Owner decision (2026-09-24): release the current redesign on hubcys.com now, and build the crisis-simulation experience afterwards behind the same V2 flag.

Today hubcys.com is served by the **legacy Base44 app**, with its own backend and data, behind Cloudflare. The redesign runs on the Vercel project `mekado11s-projects/hubcys` with Firebase. Moving the domain changes which app, and therefore **which user accounts and data**, visitors reach.

## Prerequisite

Finish [activation-runbook.md](activation-runbook.md) steps 0–7 on the Vercel production URL first. That covers credentials, your operator claim, your org and membership, indexes, rules and flags, plus acceptance. Do not move the domain onto an app that has not passed acceptance.

## Blockers to clear before switching

| # | Blocker | How to clear it | Owner |
|---|---|---|---|
| B1 | **Customer data lives in Base44, not Firebase.** Base44 users' accounts, assessments, incidents and policies are not in the new app. After the switch those users land on an app where they have no account. | In the Base44 admin panel, list the users and companies that have signed in over the last 90 days. If there are none, record that and continue. If there are, choose: (a) export and migrate them into Firebase legacy collections (a separate reviewed migration PR, not yet built), or (b) notify them and keep Base44 reachable on a legacy hostname for a set period. | You |
| B2 | **Vercel Deployment Protection is on for production.** Every production URL currently redirects to a Vercel login. | Vercel → Project → Settings → Deployment Protection: set protection to cover **preview deployments only**, so production is public and previews stay protected. | You |
| B3 | **Firebase Auth authorized domains.** Sign-in fails on a domain that isn't authorized. | Firebase console → Authentication → Settings → Authorized domains: add `hubcys.com` and `www.hubcys.com`. | You |
| B4 | **API CORS origins.** | Vercel production env `ALLOWED_ORIGINS=https://hubcys.com,https://www.hubcys.com`. These are already the defaults in code; set them explicitly anyway. | You |
| B5 | **Billing.** The new app has Stripe checkout disabled (the Pricing page and TrialExpired use a contact-sales flow). Base44 may still have live subscriptions. | Stripe dashboard: check for active subscriptions and for webhooks pointing at Base44. If paid customers exist, decide how they are served before the switch (a manual entitlement on their Firebase company, or keep them on Base44 via B1(b)). | You |
| B6 | **Assets hotlinked from Base44 storage.** | Fixed in this PR: the logo, landing images and questionnaire PDF are self-hosted under `public/brand/`. | Done |

## Switch (a low-traffic window, about 30 minutes)

1. **Vercel:** Project → Settings → Domains → add `hubcys.com`, then `www.hubcys.com` set to redirect to `hubcys.com`. Vercel shows the exact DNS records to create.
2. **Cloudflare DNS:** first **record the current Base44 records** for `hubcys.com` and `www` (screenshot them). This is your rollback. Then replace them with the Vercel records. Set the proxy status to **DNS only** (grey cloud) so Vercel can issue its certificate. Proxying through Cloudflare can be revisited later.
3. **Optional legacy hostname:** if B1(b) applies and Base44 supports custom domains, add `legacy.hubcys.com` in Base44 and in Cloudflare before step 2, so existing users keep access.
4. Wait for Vercel to show the domain as **Valid** and the certificate as issued.

## Verify (in a private browser window)

- `https://hubcys.com` shows the redesign's landing page, not the Base44 one. Response headers include `x-vercel-id`.
- `https://www.hubcys.com` redirects to `https://hubcys.com`.
- Signing up with a new test account (for example `cutover-test+<date>@…`) works. It gets no company or admin rights until assigned (expected). Delete it afterwards.
- Your account signs in. `/Dashboard` redirects to `/app/overview` and shows your organization.
- `/api/health` with the secret header returns 200.
- A logged-out visit to `/app/overview` shows sign-in, not data.
- Spot-check the legacy pages that stay in use (Assessment, Action Items, Policy Library) as a normal member.

## Rollback

1. **Record the switch time (UTC)** when you change DNS. Anything created in Firebase after that time exists only in the new app. The two backends are not synchronized.
2. **Restore the recorded Base44 DNS records** in Cloudflare. This is also the write freeze: once DNS propagates (within the TTL), no new sign-ups or saves reach Firebase through hubcys.com.
3. **Snapshot what the new app received**, after propagation: run `gcloud firestore export gs://<backup-bucket>/post-cutover-<date>`. In Firebase console → Authentication, list users created after the switch time.

Nothing is deleted by rolling back, but accounts and records created during the window become **unreachable to those users** until they are reconciled. If step 3 shows any real users or data, contact those users. Their records stay in the Firebase export and can be migrated when the cut-over is retried. For this reason, keep the window before deciding on rollback short, and use a clearly named test account for the verification sign-up (delete it afterwards in Firebase Authentication).

## After the switch

- Watch the Vercel function logs (`/api/*` 4xx/5xx) and Firebase Auth sign-ups for 48 hours.
- Keep Base44 running, and don't cancel its plan, until B1 is fully closed.
- Continue the simulation-first build behind `HUBCYS_V2_ENABLED`.
