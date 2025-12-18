
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// In-memory cache
let cachedKevData = { data: null, timestamp: 0, ttl: 4 * 60 * 60 * 1000 };

// CSV parser stays for fallback
function parseCsv(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row) continue;
    const values = [];
    let inQuote = false, currentVal = '';
    for (let j = 0; j < row.length; j++) {
      const ch = row[j];
      if (ch === '"') {
        const nextCh = row[j + 1];
        if (nextCh === '"') { currentVal += '"'; j++; } else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += ch;
      }
    }
    values.push(currentVal.trim());

    if (values.length === headers.length) {
      const entry = {};
      headers.forEach((h, idx) => {
        const key = h.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
        entry[key] = values[idx].replace(/"/g, '');
      });
      results.push(entry);
    }
  }
  return results;
}

// Normalize JSON feed from CISA (preferred)
function normalizeFromJson(json) {
  const arr = (json && (json.vulnerabilities || json.Vulnerabilities)) || [];
  const normalized = arr.map((v) => ({
    cve_id: v.cveID || v.cveId || '',
    vulnerability_name: v.vulnerabilityName || v.vulnerability_name || '',
    vendor_product: [v.vendorProject || v.vendor_project, v.product || v.productName].filter(Boolean).join(' / '),
    date_added: v.dateAdded || v.date_added || '',
    due_date: v.dueDate || v.due_date || '',
    required_action: v.requiredAction || v.required_action || '',
    short_description: v.shortDescription || v.short_description || '',
    notes: v.notes || ''
  }));
  normalized.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
  return normalized;
}

// Normalize CSV feed fallback
function normalizeFromCsv(rawRows) {
  const normalized = rawRows.map(r => ({
    cve_id: r.cveid || r.cve_id || '',
    vulnerability_name: r.vulnerabilityname || r.vulnerability_name || '',
    vendor_product: [r.vendorproject, r.product].filter(Boolean).join(' / '),
    date_added: r.dateadded || r.date_added || '',
    due_date: r.duedate || r.due_date || '',
    required_action: r.requiredaction || r.required_action || '',
    short_description: r.shortdescription || r.short_description || '',
    notes: r.notes || ''
  }));
  normalized.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
  return normalized;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = Date.now();
    if (cachedKevData.data && (now - cachedKevData.timestamp < cachedKevData.ttl)) {
      return Response.json(cachedKevData.data);
    }

    // 1) Try JSON feeds (official)
    const jsonUrls = [
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.min.json'
    ];
    for (const url of jsonUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          const normalized = normalizeFromJson(json);
          cachedKevData = { data: normalized, timestamp: Date.now(), ttl: cachedKevData.ttl };
          return Response.json(normalized);
        }
      } catch (jsonErr) {
        console.warn(`Failed to fetch or parse JSON from ${url}:`, jsonErr.message);
        // Continue to the next URL or fallback
      }
    }

    // 2) Fallback to CSV feeds
    const csvUrls = [
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.csv',
      // Legacy path used previously; keep as last resort
      'https://www.cisa.gov/cisa-known-exploited-vulnerabilities-catalog.csv'
    ];
    for (const url of csvUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const csv = await res.text();
          const raw = parseCsv(csv);
          const normalized = normalizeFromCsv(raw);
          cachedKevData = { data: normalized, timestamp: Date.now(), ttl: cachedKevData.ttl };
          return Response.json(normalized);
        }
      } catch (csvErr) {
        console.warn(`Failed to fetch or parse CSV from ${url}:`, csvErr.message);
        // Continue to the next URL or fallback
      }
    }

    // 3) If fetches failed but we have cache, serve it
    if (cachedKevData.data) {
      return Response.json(cachedKevData.data);
    }

    // 4) Otherwise return a clear error
    return Response.json({ error: 'Failed to fetch CISA KEV from all known endpoints' }, { status: 502 });
  } catch (err) {
    console.error('fetchCisaKev error:', err);
    // If an unexpected error occurs, but we have cached data, return that
    if (cachedKevData.data) return Response.json(cachedKevData.data);
    return Response.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
});
