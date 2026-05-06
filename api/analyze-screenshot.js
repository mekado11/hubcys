/**
 * /api/analyze-screenshot.js — Phishing screenshot analysis via Claude vision.
 *
 * POST body:
 *   {
 *     file_urls:       string[]   Firebase Storage download URLs (public)
 *     email_headers:   string?    Raw email header block for extra context
 *     suspicious_urls: string[]?  URLs found in the email/screenshot
 *     file_hashes:     string[]?  SHA-256 hashes of attachments
 *   }
 *
 * Returns:
 *   {
 *     verdict:         "PHISHING" | "SUSPICIOUS" | "LIKELY_SAFE"
 *     risk_level:      "high" | "medium" | "low"
 *     confidence:      0-100
 *     summary:         string
 *     indicators:      string[]
 *     artifacts:       { type, value, risk }[]
 *     recommendations: string[]
 *     technique:       string
 *   }
 */

// ─── Rate limiter (10 screenshot analyses per IP per 5 minutes) ───────────────
const _rl = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const window = 5 * 60_000;
  const max = 10;
  const e = _rl.get(ip);
  if (!e || now > e.resetAt) { _rl.set(ip, { count: 1, resetAt: now + window }); return true; }
  if (e.count >= max) return false;
  e.count++;
  return true;
}
function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

// ─── CORS helper ──────────────────────────────────────────────────────────────
function setCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://hubcys.com,https://www.hubcys.com').split(',').map(s => s.trim());
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

function isAuthenticated(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') && auth.length > 10;
}

// ─── Fetch image and convert to base64 ───────────────────────────────────────
async function urlToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status}): ${url}`);
  const contentType = res.headers.get('content-type') || 'image/png';
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  // Claude vision accepts: image/jpeg, image/png, image/gif, image/webp
  const mediaType = contentType.split(';')[0].trim();
  const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return { base64, mediaType: supported.includes(mediaType) ? mediaType : 'image/png' };
}

// ─── Build Claude vision prompt ───────────────────────────────────────────────
function buildPrompt(emailHeaders, suspiciousUrls, fileHashes) {
  const extras = [];
  if (emailHeaders) extras.push(`EMAIL HEADERS:\n${emailHeaders}`);
  if (suspiciousUrls?.length) extras.push(`URLs FOUND IN EMAIL:\n${suspiciousUrls.join('\n')}`);
  if (fileHashes?.length) extras.push(`ATTACHMENT HASHES:\n${fileHashes.join('\n')}`);

  return `You are a senior threat intelligence analyst specialising in phishing detection. Analyse the provided screenshot(s) and any supplementary metadata below for phishing indicators.

${extras.length ? extras.join('\n\n') + '\n\n' : ''}Your task:
1. Examine the visual content carefully for phishing indicators (brand impersonation, urgency language, suspicious links, fake login forms, typosquatted domains, misleading sender names, etc.)
2. Extract all visible text from the screenshot(s).
3. Cross-reference any URLs/domains in the metadata with known phishing tactics.
4. Return a single JSON object with this exact schema:

{
  "verdict": "PHISHING" | "SUSPICIOUS" | "LIKELY_SAFE",
  "score": <integer 0-100, phishing risk score>,
  "overall_risk_assessment_narrative": "<2-3 sentence analyst summary of the overall risk>",
  "technique": "<phishing technique name, e.g. 'Credential Harvesting', 'BEC', 'Malware Delivery'>",
  "reasons": ["<red flag 1>", "<red flag 2>", ...],
  "extracted_text": "<all visible text extracted from the screenshot(s), preserving line breaks>",
  "suspicious_phrases": ["<phrase 1>", "<phrase 2>"],
  "artifacts": [
    {
      "type": "domain|url|email|ip|hash_sha256|hash_md5",
      "value": "<value>",
      "risk": "high|medium|low",
      "source": "screenshot|email_header|provided_url|provided_hash",
      "reasoning": "<why this artifact is suspicious or notable>"
    }
  ],
  "recommendations": ["<action 1>", "<action 2>", ...]
}

suspicious_phrases should be short phrases from extracted_text that are particularly suspicious (urgency language, threats, reward claims, etc.).
Respond with valid JSON only. No markdown, no explanation.`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (!checkRateLimit(getIp(req))) {
    return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
  }

  const { file_urls, email_headers, suspicious_urls, file_hashes } = req.body || {};

  if (!file_urls?.length) {
    return res.status(400).json({ error: 'file_urls is required' });
  }
  if (file_urls.length > 3) {
    return res.status(400).json({ error: 'Maximum 3 images per request' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

  try {
    // Fetch all images in parallel, convert to base64
    const images = await Promise.all(file_urls.map(urlToBase64));

    const imageContent = images.map(({ base64, mediaType }) => ({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    }));

    const textContent = {
      type: 'text',
      text: buildPrompt(email_headers, suspicious_urls, file_hashes),
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.PREMIUM_MODEL_ID || 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: 'You are a senior threat intelligence analyst. Respond with valid JSON only.',
        messages: [{ role: 'user', content: [...imageContent, textContent] }],
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('[analyze-screenshot] Anthropic error:', err);
      return res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }

    const body = await response.json();
    const raw = body.content?.[0]?.text || '';

    // Parse JSON — strip markdown fences if present
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch (_) {
      console.error('[analyze-screenshot] JSON parse failed:', raw.slice(0, 200));
      return res.status(500).json({ error: 'Analysis returned invalid data. Please try again.' });
    }

    return res.status(200).json(analysis);

  } catch (err) {
    console.error('[analyze-screenshot]', err.message);
    return res.status(500).json({ error: 'Screenshot analysis failed. Please try again.' });
  }
}
