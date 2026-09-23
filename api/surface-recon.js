/**
 * /api/surface-recon.js — External attack surface recon
 *
 * If SHODAN_API_KEY is set: resolves the domain to IPs via Shodan DNS,
 * fetches live host data (ports, services, vulns), then asks Claude to
 * score and narrate the findings.
 *
 * If SHODAN_API_KEY is not set: falls back to Claude-only simulated analysis.
 *
 * POST { target: "example.com" }
 */

import { requireIdentity } from '../server/security/identity.js';

const RL_WINDOW_MS = 60_000;
const RL_MAX = 5;
const _rateLimitStore = new Map();

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

// ── Shodan helpers ────────────────────────────────────────────────────────────

async function shodanResolveDomain(domain, key) {
  const url = `https://api.shodan.io/dns/resolve?hostnames=${encodeURIComponent(domain)}&key=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];
  const data = await res.json();
  return Object.values(data).filter(Boolean);
}

async function shodanHostLookup(ip, key) {
  const url = `https://api.shodan.io/shodan/host/${ip}?key=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

function parseShodanHost(host) {
  const ports = [...new Set((host.data || []).map(s => s.port))].sort((a, b) => a - b);
  const services = (host.data || []).map(s => ({
    port: s.port,
    service: s._shodan?.module || s.transport || 'unknown',
    product: s.product || null,
    version: s.version || null,
  }));
  const technologies = [...new Set(
    (host.data || []).flatMap(s => [s.product, s.cpe ? s.cpe[0] : null].filter(Boolean))
  )];
  const vulns = Object.keys(host.vulns || {});
  const location = [host.city, host.country_name].filter(Boolean).join(', ') || 'Unknown';

  return {
    ip: host.ip_str,
    hostname: (host.hostnames || [])[0] || host.ip_str,
    location,
    ports: services,
    technologies,
    vulns,
    last_update: host.last_update,
  };
}

// ── Claude helpers ────────────────────────────────────────────────────────────

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
      max_tokens: 2000,
      system: 'Respond with valid JSON only. No markdown, no explanation.',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout ? AbortSignal.timeout(25_000) : undefined,
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

// ── Shodan-informed analysis via Claude ───────────────────────────────────────

async function analyseWithShodan(domain, shodanKey) {
  // 1. Resolve domain → IPs
  const ips = await shodanResolveDomain(domain, shodanKey);
  if (!ips.length) return null;

  // 2. Fetch host data for up to 3 IPs in parallel
  const hostData = (await Promise.all(ips.slice(0, 3).map(ip => shodanHostLookup(ip, shodanKey))))
    .filter(Boolean)
    .map(parseShodanHost);

  if (!hostData.length) return null;

  const allPorts = [...new Set(hostData.flatMap(h => h.ports.map(p => p.port)))];
  const allVulns = [...new Set(hostData.flatMap(h => h.vulns))];
  const allTech = [...new Set(hostData.flatMap(h => h.technologies))];

  // 3. Ask Claude to score and recommend based on real Shodan data
  const prompt = `You are a security analyst. Based on these real Shodan findings for domain "${domain}",
provide an exposure_score (0-100, higher = more risk) and 4-6 specific remediation recommendations.

Live Shodan data:
- Resolved IPs: ${ips.join(', ')}
- Open ports across all hosts: ${allPorts.join(', ')}
- Technologies detected: ${allTech.join(', ') || 'none detected'}
- Known CVEs: ${allVulns.length ? allVulns.slice(0, 10).join(', ') : 'none found'}
- Host details: ${JSON.stringify(hostData.map(h => ({ ip: h.ip, hostname: h.hostname, location: h.location, ports: h.ports.length })))}

Return JSON:
{
  "exposure_score": 45,
  "recommendations": ["...", "...", "...", "..."]
}`;

  const raw = await callClaude(prompt);
  const analysis = tryParseJson(raw) || { exposure_score: 50, recommendations: [] };

  return {
    exposed_assets: hostData,
    open_ports: allPorts,
    technologies: allTech,
    tech_stack: allTech,
    total_exposures: hostData.length,
    exposure_score: analysis.exposure_score ?? 50,
    risk_score: analysis.exposure_score ?? 50,
    recommendations: analysis.recommendations || [],
    cve_correlations: {
      critical: allVulns.filter(v => v.startsWith('CVE')).slice(0, 5),
      high: allVulns.filter(v => v.startsWith('CVE')).slice(5, 10),
    },
    data_source: 'shodan',
  };
}

// ── Claude-only fallback ──────────────────────────────────────────────────────

async function analyseWithClaudeOnly(domain) {
  const prompt = `You are a security researcher performing OSINT-based external attack surface analysis for domain: ${domain}

Return ONLY this JSON structure with realistic findings:
{
  "exposed_assets": [
    {
      "ip": "203.0.113.10",
      "hostname": "www.${domain}",
      "location": "Dublin, IE",
      "ports": [{ "port": 443, "service": "https" }, { "port": 80, "service": "http" }],
      "technologies": ["nginx/1.24", "TLS 1.3"]
    }
  ],
  "open_ports": [443, 80],
  "technologies": ["nginx", "cloudflare"],
  "exposure_score": 35,
  "risk_score": 35,
  "recommendations": [
    "Disable HTTP (port 80) and enforce HTTPS",
    "Enable DNSSEC for ${domain}",
    "Review public cloud storage bucket permissions",
    "Implement HSTS with preloading"
  ],
  "cve_correlations": { "critical": [], "high": [] },
  "data_source": "ai_simulated"
}`;

  const raw = await callClaude(prompt);
  const parsed = tryParseJson(raw);
  if (!parsed) return null;
  // Normalize fields so component always gets consistent shape
  parsed.tech_stack = parsed.tech_stack || parsed.technologies || [];
  parsed.total_exposures = parsed.total_exposures ?? (parsed.exposed_assets || []).length;
  parsed.risk_score = parsed.risk_score ?? parsed.exposure_score ?? 50;
  return parsed;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireIdentity(req, res)) return;
  if (!checkRateLimit(getClientIp(req))) return res.status(429).json({ error: 'Too many requests' });

  const { target } = req.body || {};
  if (!target || typeof target !== 'string') return res.status(400).json({ error: 'target is required' });

  const sanitised = target.trim().replace(/[^a-zA-Z0-9._\-]/g, '').toLowerCase();
  if (!sanitised || sanitised.length > 253) return res.status(400).json({ error: 'Invalid domain' });

  try {
    const shodanKey = process.env.SHODAN_API_KEY;
    let data = null;

    if (shodanKey) {
      try {
        data = await analyseWithShodan(sanitised, shodanKey);
      } catch (shodanErr) {
        console.warn('[surface-recon] Shodan failed, falling back to Claude:', shodanErr.message);
      }
    }

    if (!data) {
      data = await analyseWithClaudeOnly(sanitised);
    }

    if (!data) return res.status(500).json({ error: 'Failed to parse recon results' });

    return res.status(200).json({ data });
  } catch (err) {
    console.error('[surface-recon]', err.message);
    return res.status(500).json({ error: 'Reconnaissance failed. Please try again.' });
  }
}
