import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

function parseDate(d) {
  const dt = d ? new Date(d) : null;
  return isNaN(dt?.getTime?.()) ? null : dt;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (!(await base44.auth.isAuthenticated())) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { host } = await req.json();
    if (!host || typeof host !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid host parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tryUrls = [
      `https://tls-certificate-fingerprint-scanner.p.rapidapi.com/?domain=${encodeURIComponent(host)}`,
      `https://tls-certificate-fingerprint-scanner.p.rapidapi.com/?host=${encodeURIComponent(host)}`,
      `https://tls-certificate-fingerprint-scanner.p.rapidapi.com/?url=${encodeURIComponent(host)}`
    ];

    let raw = null;
    let ok = false;
    let lastText = '';

    for (const url of tryUrls) {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY'),
          'X-RapidAPI-Host': 'tls-certificate-fingerprint-scanner.p.rapidapi.com'
        }
      });
      if (resp.ok) {
        raw = await resp.json();
        ok = true;
        break;
      } else {
        lastText = await resp.text();
      }
    }

    if (!ok || !raw) {
      return new Response(JSON.stringify({ error: 'RapidAPI TLS call failed', details: lastText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Attempt to normalize common fields while keeping raw
    const subject = raw.subject || raw.subject_name || raw.common_name || null;
    const issuer = raw.issuer || raw.issuer_name || null;
    const cn = raw.common_name || raw.subjectCN || null;
    const notBefore = parseDate(raw.valid_from || raw.not_before || raw.validity_start);
    const notAfter = parseDate(raw.valid_to || raw.not_after || raw.validity_end);
    const san = raw.san || raw.subject_alternative_names || raw.alt_names || null;
    const sha256 = raw.fingerprint_sha256 || raw.sha256 || raw['SHA-256'] || null;
    const sha1 = raw.fingerprint_sha1 || raw.sha1 || raw['SHA-1'] || null;
    const sigAlg = raw.signature_algorithm || raw.sig_alg || null;
    const protocol = raw.tls_version || raw.protocol || null;

    let daysToExpiry = null;
    let isExpired = null;
    if (notAfter) {
      const diffMs = notAfter.getTime() - Date.now();
      daysToExpiry = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      isExpired = diffMs < 0;
    }

    const normalized = {
      host,
      subject,
      common_name: cn,
      issuer,
      valid_from: notBefore ? notBefore.toISOString() : null,
      valid_to: notAfter ? notAfter.toISOString() : null,
      days_to_expiry: daysToExpiry,
      is_expired: isExpired,
      fingerprint_sha256: sha256,
      fingerprint_sha1: sha1,
      san: Array.isArray(san) ? san : (typeof san === 'string' ? san.split(',').map(s => s.trim()).filter(Boolean) : null),
      signature_algorithm: sigAlg,
      protocol,
      raw
    };

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});