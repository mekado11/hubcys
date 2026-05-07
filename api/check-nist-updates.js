/**
 * /api/check-nist-updates.js — Quarterly NIST SP 800-53 framework version checker
 *
 * Triggered automatically by Vercel Cron every 3 months (see vercel.json).
 * Can also be called manually: GET /api/check-nist-updates?secret=<CRON_SECRET>
 *
 * What it does:
 *   1. Fetches the first 4 KB of the NIST OSCAL catalog JSON from GitHub
 *      (authoritative machine-readable source maintained by NIST)
 *   2. Extracts metadata.version and metadata.last-modified
 *   3. Compares against NIST_800_53_KNOWN_VERSION env var (current: "5.2.0")
 *   4. If a newer version is detected:
 *      a. Logs prominently to Vercel function logs
 *      b. POSTs to FRAMEWORK_UPDATE_WEBHOOK_URL (Slack / Teams / Discord / generic)
 *   5. Returns JSON with the check result
 *
 * Environment variables:
 *   CRON_SECRET                 Required. Vercel sets this automatically for cron jobs.
 *                               Set it manually for GET-based testing.
 *   NIST_800_53_KNOWN_VERSION   The last version you've already implemented (default: "5.2.0").
 *                               Update this in Vercel dashboard after applying code changes.
 *   FRAMEWORK_UPDATE_WEBHOOK_URL Optional. Slack/Teams/Discord/generic webhook URL.
 *
 * Vercel Cron note: requires Pro or Enterprise plan.
 * Schedule: 09:00 UTC on 1st Jan, Apr, Jul, Oct  →  "0 9 1 1,4,7,10 *"
 */

// ── Source ────────────────────────────────────────────────────────────────────
// Official NIST OSCAL catalog — version-controlled, updated on every NIST release
const NIST_OSCAL_URL =
  'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json';

// 800-53A assessment procedures catalog
const NIST_OSCAL_A_URL =
  'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53Ar5_assessment-procedures_catalog.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch only the first N bytes of a URL (to avoid downloading 50 MB OSCAL catalogs).
 * The NIST JSON structure puts metadata at the very top, so 4 KB is always enough.
 */
async function fetchHead(url, bytes = 4096) {
  const res = await fetch(url, {
    headers: { Range: `bytes=0-${bytes - 1}` },
    signal: AbortSignal.timeout(15_000),
  });
  // Some CDNs return 200 instead of 206 — both are fine
  if (!res.ok && res.status !== 206) {
    throw new Error(`Failed to fetch ${url} — HTTP ${res.status}`);
  }
  return res.text();
}

/**
 * Extract a named string field from a partial JSON snippet.
 * e.g. extractField(text, 'version') → "5.2.0"
 */
function extractField(text, field) {
  // Handles both "field": "value" and "field" : "value"
  const m = text.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
  return m ? m[1] : null;
}

/**
 * Compare semantic versions — returns true if latestStr > knownStr.
 * Handles "5.2.0" vs "5.2.0", "5.3.0" vs "5.2.0", etc.
 */
function isNewer(latestStr, knownStr) {
  const parse = (v) => String(v || '0').split('.').map(Number);
  const [lMaj, lMin, lPat] = parse(latestStr);
  const [kMaj, kMin, kPat] = parse(knownStr);
  if (lMaj !== kMaj) return lMaj > kMaj;
  if (lMin !== kMin) return lMin > kMin;
  return lPat > kPat;
}

/**
 * POST a notification to the configured webhook.
 * Supports Slack (block kit), Teams (adaptive card), and generic JSON.
 */
async function notify(webhookUrl, payload) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error('[check-nist-updates] Webhook delivery failed:', err.message);
  }
}

function buildSlackPayload({ publication, latestVersion, latestDate, knownVersion, oscalUrl }) {
  return {
    text: `🔔 NIST Framework Update Detected`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔔 NIST Framework Update Detected', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Publication:*\n${publication}` },
          { type: 'mrkdwn', text: `*New Version:*\n${latestVersion}` },
          { type: 'mrkdwn', text: `*Published:*\n${latestDate || 'unknown'}` },
          { type: 'mrkdwn', text: `*Previously known:*\n${knownVersion}` },
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Action required:*\n1. Review new/changed controls at <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final|csrc.nist.gov>\n2. Update `NIST_800_53_CONTROL_FAMILIES` in `AddFrameworkDialog.jsx`\n3. Update `NIST_800_53_KNOWN_VERSION` env var in Vercel dashboard'
        }
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Source: ${oscalUrl}` }]
      }
    ]
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Vercel Cron calls with Authorization: Bearer <CRON_SECRET>
  // Manual calls use ?secret=<CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  const querySecret = new URL(req.url, 'http://localhost').searchParams.get('secret');

  // Require secret — if not configured, deny all requests rather than open the endpoint
  if (!cronSecret) {
    return res.status(503).json({ error: 'CRON_SECRET not configured' });
  }
  const provided = authHeader.replace('Bearer ', '').trim() || querySecret;
  if (!provided || provided !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const knownVersion = (process.env.NIST_800_53_KNOWN_VERSION || '5.2.0').trim();
  const webhookUrl   = process.env.FRAMEWORK_UPDATE_WEBHOOK_URL;

  const results = [];

  const checks = [
    { key: 'NIST SP 800-53 Rev 5 (Controls)',             url: NIST_OSCAL_URL },
    { key: 'NIST SP 800-53A Rev 5 (Assessment Procedures)', url: NIST_OSCAL_A_URL },
  ];

  for (const { key, url } of checks) {
    try {
      const head = await fetchHead(url);
      const latestVersion  = extractField(head, 'version');
      const latestDate     = extractField(head, 'last-modified');
      const oscalVersion   = extractField(head, 'oscal-version');

      if (!latestVersion) {
        results.push({ publication: key, status: 'parse_error', detail: 'Could not extract version from OSCAL metadata' });
        continue;
      }

      const updated = isNewer(latestVersion, knownVersion);

      const result = {
        publication:   key,
        knownVersion,
        latestVersion,
        latestDate,
        oscalVersion,
        status:        updated ? 'UPDATE_AVAILABLE' : 'up_to_date',
        oscalSource:   url,
      };

      results.push(result);

      if (updated) {
        // Prominent server log — always visible in Vercel Functions tab
        console.warn(
          `\n${'='.repeat(60)}\n` +
          `NIST FRAMEWORK UPDATE DETECTED\n` +
          `Publication : ${key}\n` +
          `Known       : ${knownVersion}\n` +
          `Latest      : ${latestVersion}  (${latestDate})\n` +
          `Action      : Update AddFrameworkDialog.jsx and set\n` +
          `              NIST_800_53_KNOWN_VERSION=${latestVersion} in Vercel\n` +
          `${'='.repeat(60)}\n`
        );

        // Webhook notification
        if (webhookUrl) {
          await notify(webhookUrl, buildSlackPayload({
            publication: key,
            latestVersion,
            latestDate,
            knownVersion,
            oscalUrl: url,
          }));
        }
      } else {
        console.log(`[check-nist-updates] ${key}: up to date (${latestVersion})`);
      }

    } catch (err) {
      console.error(`[check-nist-updates] Error checking ${key}:`, err.message);
      results.push({ publication: key, status: 'error', detail: err.message });
    }
  }

  const hasUpdate = results.some(r => r.status === 'UPDATE_AVAILABLE');

  return res.status(200).json({
    checked_at:    new Date().toISOString(),
    known_version: knownVersion,
    has_update:    hasUpdate,
    results,
    next_check:    'Quarterly — 1 Jan, 1 Apr, 1 Jul, 1 Oct at 09:00 UTC',
  });
}
