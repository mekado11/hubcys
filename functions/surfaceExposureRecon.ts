import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Normalize a user-provided value into a bare domain
function normalizeDomain(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return (url.hostname || '').replace(/^www\./i, '');
  } catch {
    return String(value)
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0];
  }
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// DNS resolution using Deno.resolveDns with a DNS-over-HTTPS fallback (Google)
async function resolveDomainToIps(domain) {
  const ips = new Set();
  // Try Deno.resolveDns first (A + AAAA)
  try {
    // A records
    const a = await Deno.resolveDns(domain, 'A');
    (a || []).forEach((ip) => ip && ips.add(ip));
  } catch {
    // ignore - fall back to DoH
  }
  try {
    // AAAA records
    const aaaa = await Deno.resolveDns(domain, 'AAAA');
    (aaaa || []).forEach((ip) => ip && ips.add(ip));
  } catch {
    // ignore
  }

  // If nothing yet, use DNS over HTTPS (Google)
  if (ips.size === 0) {
    const doh = async (type) => {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`);
      if (!res.ok) return;
      const json = await res.json();
      const answers = json?.Answer || [];
      answers.forEach((ans) => {
        // type 1 = A, 28 = AAAA
        if ((type === 'A' && ans.type === 1) || (type === 'AAAA' && ans.type === 28)) {
          if (ans.data) ips.add(ans.data);
        }
      });
    };
    await doh('A');
    await doh('AAAA');
  }

  return Array.from(ips);
}

// Wrapper that handles simple backoff on 429 and network blips
async function shodanFetchJson(url, maxRetries = 3) {
  let delay = 600; // ms
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await sleep(delay);
      delay *= 2;
      continue;
    }
    if (!res.ok) {
      // Return null to indicate a failure for the caller to handle
      return null;
    }
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return null;
}

// Query full host details by IP
async function shodanHost(ip, key) {
  const url = `https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${encodeURIComponent(key)}`;
  return await shodanFetchJson(url);
}

// Fallback: search by hostname to find IPs/services Shodan already knows
async function shodanHostSearchByHostname(hostname, key, limit = 50) {
  const query = `hostname:${hostname}`;
  const url = `https://api.shodan.io/shodan/host/search?key=${encodeURIComponent(key)}&query=${encodeURIComponent(query)}`;
  const json = await shodanFetchJson(url);
  if (!json || !Array.isArray(json.matches)) return [];
  // Return limited set to avoid UI overload
  return json.matches.slice(0, limit);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Accept both POST JSON payload and querystring fallback
    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const url = new URL(req.url);
    const input =
      body.domain ||
      body.url ||
      body.target ||
      url.searchParams.get('domain') ||
      url.searchParams.get('url') ||
      '';

    const domain = normalizeDomain(input);
    if (!domain) {
      return Response.json({ error: 'Invalid or missing domain parameter. Provide a domain like "example.com" or a full URL.' }, { status: 400 });
    }

    const SHODAN_API_KEY = Deno.env.get('SHODAN_API_KEY');
    if (!SHODAN_API_KEY) {
      return Response.json({ error: 'SHODAN_API_KEY is not configured on the server.' }, { status: 500 });
    }

    // 1) Resolve the domain to IPs reliably
    let ips = await resolveDomainToIps(domain);

    // 2) If DNS gave nothing, try Shodan host search by hostname as a fallback
    let source = 'dns+host';
    const exposed_assets = [];
    const techSet = new Set();

    if (ips.length === 0) {
      const matches = await shodanHostSearchByHostname(domain, SHODAN_API_KEY, 50);
      source = 'host-search';
      // From search matches, build assets and gather IPs/ports
      const discoveredIps = new Set();
      for (const m of matches) {
        if (m.ip_str) discoveredIps.add(m.ip_str);
        const ports = Array.isArray(m.ports) ? m.ports : (typeof m.port === 'number' ? [m.port] : []);
        (ports || []).forEach((p) => {
          exposed_assets.push({
            ip: m.ip_str || '',
            port: p,
            transport: m.transport || '',
            service: m._shodan?.module || '',
            product: (m.product || m.org || m.os || '').toString()
          });
        });

        if (m.product) techSet.add(m.product);
        if (Array.isArray(m.cpe)) m.cpe.forEach((c) => c && techSet.add(c));
      }
      ips = Array.from(discoveredIps);
    }

    // 3) If we do have IPs, query /shodan/host for rich data (limit to avoid rate-limits)
    const ipLimit = Math.min(ips.length, 10);
    for (let i = 0; i < ipLimit; i++) {
      const ip = ips[i];
      const host = await shodanHost(ip, SHODAN_API_KEY);
      if (!host || !Array.isArray(host.data)) continue;

      for (const entry of host.data) {
        exposed_assets.push({
          ip,
          port: entry.port,
          transport: entry.transport,
          service: entry._shodan?.module || entry.transport || '',
          product: entry.product || entry.org || ''
        });

        if (entry.product) techSet.add(entry.product);
        const cpeField = entry.cpe;
        if (Array.isArray(cpeField)) cpeField.forEach((c) => c && techSet.add(c));
        else if (typeof cpeField === 'string' && cpeField) techSet.add(cpeField);
      }

      // small jitter to be gentle with API
      await sleep(250);
    }

    // 4) Aggregate open ports for UI counters
    const openPortsSet = new Set();
    exposed_assets.forEach(a => {
      if (typeof a.port === 'number') openPortsSet.add(a.port);
    });

    // Lightweight heuristic risk score
    const uniquePorts = openPortsSet.size;
    const risk_score = Math.min(100, uniquePorts * 4 + techSet.size * 2 + Math.ceil(exposed_assets.length / 5));

    const result = {
      domain,
      total_exposures: exposed_assets.length,
      open_ports: Array.from(openPortsSet).sort((a, b) => a - b),
      risk_score,
      exposed_assets,
      tech_stack: Array.from(techSet),
      cve_correlations: { critical: [], high: [], medium: [] },
      resolution_method: source
    };

    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unexpected server error' }, { status: 500 });
  }
});