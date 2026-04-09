/**
 * /api/ai.js — Cost-optimised AI gateway for Hubcys
 *
 * Two-lane routing:
 *   FAST  lane → cheap model  (gpt-4o-mini by default)  for structured drafting / summarisation
 *   DEEP  lane → premium model (claude-sonnet-4-6)       for reasoning / synthesis / security analysis
 *
 * Pipeline per request:
 *   1. Normalise & trim input (strip whitespace junk, collapse blank lines)
 *   2. SHA-256 hash → check in-process LRU cache (15-min TTL)
 *   3. Route to model using explicit `feature` key or auto-detect heuristic
 *   4. Enforce per-feature max_tokens budget (no runaway outputs)
 *   5. Call provider (Anthropic or OpenAI)
 *   6. Store result in cache + log usage metadata (cost estimate, latency)
 *   7. Return structured JSON to client
 *
 * Environment variables (set in Vercel dashboard — never use VITE_ prefix here):
 *   ANTHROPIC_API_KEY     required for Claude
 *   OPENAI_API_KEY        required for GPT
 *   CHEAP_MODEL_ID        optional override, defaults to gpt-4o-mini
 *   PREMIUM_MODEL_ID      optional override, defaults to claude-sonnet-4-6
 */

import { createHash } from 'crypto';

// ─── Model IDs ────────────────────────────────────────────────────────────────
const CHEAP_MODEL   = process.env.CHEAP_MODEL_ID   || 'gpt-4o-mini';
const PREMIUM_MODEL = process.env.PREMIUM_MODEL_ID || 'claude-sonnet-4-6';

// Published token pricing (USD per token)
const PRICING = {
  'gpt-4o-mini':        { in: 0.25  / 1e6, out: 2.00  / 1e6 },
  'gpt-4o':             { in: 2.50  / 1e6, out: 10.00 / 1e6 },
  'claude-sonnet-4-6':  { in: 3.00  / 1e6, out: 15.00 / 1e6 },
  'claude-haiku-4-5-20251001': { in: 0.80 / 1e6, out: 4.00 / 1e6 },
};

// ─── Routing table ─────────────────────────────────────────────────────────────
// feature key → { lane: 'fast'|'deep', maxTokens }
const ROUTES = {
  // FAST lane — structured extraction / summarisation / reformatting
  cve_lookup:        { lane: 'fast',  maxTokens: 600  },
  cve_summary:       { lane: 'fast',  maxTokens: 500  },
  task_rewrite:      { lane: 'fast',  maxTokens: 500  },
  checkin_summary:   { lane: 'fast',  maxTokens: 600  },
  list_generation:   { lane: 'fast',  maxTokens: 700  },
  extraction:        { lane: 'fast',  maxTokens: 800  },
  summarize:         { lane: 'fast',  maxTokens: 600  },
  policy_outline:    { lane: 'fast',  maxTokens: 900  },

  // DEEP lane — reasoning / security analysis / synthesis
  policy_generate:       { lane: 'deep', maxTokens: 3000 },
  policy_refine:         { lane: 'deep', maxTokens: 2000 },
  incident_playbook:     { lane: 'deep', maxTokens: 2000 },
  architecture_audit:    { lane: 'deep', maxTokens: 2000 },
  sast_analysis:         { lane: 'deep', maxTokens: 1500 },
  bia_analysis:          { lane: 'deep', maxTokens: 2000 },
  tabletop:              { lane: 'deep', maxTokens: 2000 },
  smart_analysis:        { lane: 'deep', maxTokens: 2000 },
  consultation:          { lane: 'deep', maxTokens: 1500 },
  ioc_analysis:          { lane: 'deep', maxTokens: 1500 },
};

// Keywords that force the DEEP lane when auto-detecting (no explicit feature)
const DEEP_KEYWORDS = [
  'incident', 'playbook', 'architecture', 'sast', 'vulnerability', 'exploit',
  'tabletop', 'compliance', 'risk assessment', 'fair', 'cvss', 'malware',
  'threat actor', 'lateral movement', 'privilege escalation', 'penetration',
  'forensic', 'ioc', 'indicator of compromise', 'policy document', 'audit report',
];

function autoRoute(prompt) {
  const lower = prompt.toLowerCase();
  const isComplex =
    prompt.length > 1800 ||
    DEEP_KEYWORDS.some(kw => lower.includes(kw));
  return isComplex
    ? { lane: 'deep',  maxTokens: 2000 }
    : { lane: 'fast',  maxTokens: 800  };
}

// ─── In-process LRU cache (per warm function instance, 15-min TTL) ────────────
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_ENTRIES = 200;

const _cache = new Map(); // key → { content, ts }

function cacheGet(hash) {
  const entry = _cache.get(hash);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(hash); return null; }
  return entry.content;
}

function cacheSet(hash, content) {
  if (_cache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entry
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
  _cache.set(hash, { content, ts: Date.now() });
}

// ─── Input normalisation ──────────────────────────────────────────────────────
function normalise(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')         // normalise line endings
    .replace(/[ \t]+/g, ' ')        // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')     // max 2 consecutive blank lines
    .trim();
}

function hashInput(normalised, feature, wantJson) {
  return createHash('sha256')
    .update(`${feature}|${wantJson}|${normalised}`)
    .digest('hex')
    .slice(0, 16); // 16 hex chars is plenty for a cache key
}

// Rough token estimate: ~4 chars per token for English
function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

// ─── Provider calls ───────────────────────────────────────────────────────────
async function callClaude(prompt, model, wantJson, maxTokens) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set — add it in Vercel Environment Variables.');

  const system = wantJson
    ? 'Respond with valid JSON only. No markdown, no explanation — output a raw JSON object or array.'
    : 'You are Nathan, an expert cybersecurity AI for the Hubcys platform. Be concise, accurate, and actionable.';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    text:        data.content?.[0]?.text ?? '',
    inputTokens: data.usage?.input_tokens  ?? estimateTokens(prompt),
    outTokens:   data.usage?.output_tokens ?? 0,
  };
}

async function callOpenAI(prompt, model, wantJson, maxTokens) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set — add it in Vercel Environment Variables.');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      ...(wantJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    text:        data.choices?.[0]?.message?.content ?? '',
    inputTokens: data.usage?.prompt_tokens     ?? estimateTokens(prompt),
    outTokens:   data.usage?.completion_tokens ?? 0,
  };
}

// ─── JSON extraction ──────────────────────────────────────────────────────────
function tryParseJson(text) {
  try { return JSON.parse(text); } catch (_) { /* */ }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch (_) { /* */ } }
  const bracket = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (bracket) { try { return JSON.parse(bracket[1]); } catch (_) { /* */ } }
  return text;
}

// ─── Usage logger ─────────────────────────────────────────────────────────────
function logUsage({ feature, model, inputTokens, outTokens, latencyMs, cacheHit, costUsd }) {
  // Structured log — visible in Vercel log dashboard and can be piped to Datadog / LogTail
  console.log(JSON.stringify({
    ts:           new Date().toISOString(),
    service:      'ai-gateway',
    feature,
    model,
    inputTokens,
    outTokens,
    totalTokens:  inputTokens + outTokens,
    latencyMs,
    cacheHit,
    costUsd:      costUsd.toFixed(6),
  }));
}

// ─── CORS helper ─────────────────────────────────────────────────────────────
function setCorsHeaders(req, res) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://hubcys.com,https://www.hubcys.com').split(',').map(o => o.trim());
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

// ─── Simple token check ───────────────────────────────────────────────────────
// Verifies the client passes a non-empty Bearer token.
// Full Firebase token verification requires the Firebase Admin SDK;
// add that when you wire up server-side Firebase Admin.
function isAuthenticated(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') && auth.length > 10;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require a Firebase ID token from the client
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    prompt,
    feature,      // optional: key from ROUTES table
    model,        // optional: explicit model override
    response_json_schema,
  } = req.body || {};

  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const wantJson    = !!response_json_schema;
  const normalised  = normalise(prompt);
  const featureKey  = feature || 'default';
  const cacheKey    = hashInput(normalised, featureKey, wantJson);

  // ── Cache check ────────────────────────────────────────────────────────────
  const cached = cacheGet(cacheKey);
  if (cached) {
    logUsage({ feature: featureKey, model: 'cache', inputTokens: 0, outTokens: 0, latencyMs: 0, cacheHit: true, costUsd: 0 });
    return res.status(200).json({ content: cached, cached: true });
  }

  // ── Routing ───────────────────────────────────────────────────────────────
  let resolvedModel, maxTokens;

  if (model) {
    // Caller forced a specific model
    resolvedModel = model;
    maxTokens     = ROUTES[featureKey]?.maxTokens ?? 1000;
  } else if (ROUTES[featureKey]) {
    const route   = ROUTES[featureKey];
    resolvedModel = route.lane === 'fast' ? CHEAP_MODEL : PREMIUM_MODEL;
    maxTokens     = route.maxTokens;
  } else {
    // Auto-detect from prompt content
    const auto    = autoRoute(normalised);
    resolvedModel = auto.lane === 'fast' ? CHEAP_MODEL : PREMIUM_MODEL;
    maxTokens     = auto.maxTokens;
  }

  const useOpenAI = resolvedModel.startsWith('gpt') || resolvedModel.startsWith('o1') || resolvedModel.startsWith('o3');
  const t0 = Date.now();

  try {
    const { text, inputTokens, outTokens } = useOpenAI
      ? await callOpenAI(normalised, resolvedModel, wantJson, maxTokens)
      : await callClaude(normalised, resolvedModel, wantJson, maxTokens);

    const latencyMs = Date.now() - t0;
    const pricing   = PRICING[resolvedModel] ?? { in: 0, out: 0 };
    const costUsd   = inputTokens * pricing.in + outTokens * pricing.out;

    const content = wantJson ? tryParseJson(text) : text;

    // ── Cache store ──────────────────────────────────────────────────────────
    cacheSet(cacheKey, content);

    logUsage({ feature: featureKey, model: resolvedModel, inputTokens, outTokens, latencyMs, cacheHit: false, costUsd });

    return res.status(200).json({
      content,
      cached: false,
      meta: { model: resolvedModel, inputTokens, outTokens, latencyMs, costUsd: +costUsd.toFixed(6) },
    });

  } catch (err) {
    console.error('[ai-gateway]', err.message);
    return res.status(500).json({ error: 'AI request failed. Please try again later.' });
  }
}
