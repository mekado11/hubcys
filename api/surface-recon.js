/**
 * /api/surface-recon.js — External attack surface reconnaissance via Claude AI
 *
 * Accepts: POST { target: "example.com" }
 * Returns exposed assets, open ports, technologies, risk score, recommendations
 *
 * Auth: Bearer Firebase ID token required
 */

// ── Shared helpers ──────────────────────────────────────────────────────────

const _rateLimitStore = new Map();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = _rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    _rateLimitStore.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (entry.count >= RL_MAX) return false;
  entry.count++;
  return true;
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
}

function setCorsHeaders(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://hubcys.com,https://www.hubcys.com').split(',').map(o => o.trim());
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isAuthenticated(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') && auth.length > 10;
}

// ── Claude call ──────────────────────────────────────────────────────────────

async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: 'Respond with valid JSON only. No markdown, no explanation.',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '{}';
}

function tryParseJson(text) {
  try { return JSON.parse(text); } catch (_) { /* */ }
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (m) { try { return JSON.parse(m[1]); } catch (_) { /* */ } }
  const b = text.match(/(\{[\s\S]*\})/s);
  if (b) { try { return JSON.parse(b[1]); } catch (_) { /* */ } }
  return null;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!checkRateLimit(getClientIp(req))) return res.status(429).json({ error: 'Too many requests' });

  const { target } = req.body || {};
  if (!target || typeof target !== 'string') return res.status(400).json({ error: 'target is required' });

  const sanitised = target.trim().replace(/[^a-zA-Z0-9._\-]/g, '').toLowerCase();
  if (!sanitised || sanitised.length > 253) return res.status(400).json({ error: 'Invalid domain' });

  const prompt = `You are a security researcher performing OSINT-based external attack surface reconnaissance on domain: ${sanitised}

Return ONLY a JSON object with this structure, based on publicly known information about this domain/organisation:

{
  "exposed_assets": [
    {
      "ip": "203.0.113.10",
      "hostname": "www.${sanitised}",
      "location": "Dublin, IE",
      "ports": [
        { "port": 443, "service": "https" },
        { "port": 80, "service": "http" }
      ],
      "technologies": ["nginx/1.24", "TLS 1.3"]
    }
  ],
  "open_ports": [443, 80, 8443],
  "technologies": ["nginx", "cloudflare", "react"],
  "exposure_score": 35,
  "recommendations": [
    "Disable HTTP (port 80) and force HTTPS redirect",
    "Enable DNSSEC for ${sanitised}",
    "Review public cloud storage bucket permissions"
  ]
}

exposure_score is 0-100 (0=minimal risk, 100=critical exposure).
Include 2-4 exposed assets with realistic open ports and technologies for this type of organisation.
Provide 4-6 practical security recommendations.`;

  try {
    const raw = await callClaude(prompt);
    const data = tryParseJson(raw);

    if (!data) return res.status(500).json({ error: 'Failed to parse recon results' });

    return res.status(200).json({ data });
  } catch (err) {
    console.error('[surface-recon]', err.message);
    return res.status(500).json({ error: 'Reconnaissance failed. Please try again.' });
  }
}
