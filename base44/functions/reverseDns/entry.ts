import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function toArpa(ip) {
  // IPv4 only for now
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some(p => isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255)) {
    return null;
  }
  return `${parts.reverse().join('.')}.in-addr.arpa`;
}

async function dohQueryCF(name) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=PTR`;
  const resp = await fetch(url, { headers: { accept: 'application/dns-json' } });
  if (!resp.ok) return null;
  return await resp.json();
}

async function dohQueryGoogle(name) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=PTR`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  return await resp.json();
}

function parsePtr(json) {
  if (!json) return null;
  const answers = json.Answer || json.answers || [];
  for (const a of answers) {
    // type 12 = PTR
    if ((a.type === 12 || a.type === 'PTR') && a.data) {
      return String(a.data).replace(/\.$/, '');
    }
    if (a.data && typeof a.data === 'string') {
      // Some providers return string type names
      return String(a.data).replace(/\.$/, '');
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ip } = await req.json();
    if (!ip || typeof ip !== 'string') {
      return Response.json({ error: 'Missing ip' }, { status: 400 });
    }

    const arpa = toArpa(ip);
    if (!arpa) {
      return Response.json({ hostname: null, note: 'Unsupported IP format (only IPv4 PTR)' });
    }

    let json = await dohQueryCF(arpa);
    let host = parsePtr(json);
    if (!host) {
      json = await dohQueryGoogle(arpa);
      host = parsePtr(json);
    }

    return Response.json({ hostname: host || null });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});