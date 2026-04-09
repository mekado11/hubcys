/**
 * /api/tls-insight.js — TLS certificate inspection
 *
 * Accepts: POST { host: "example.com" }
 * Returns TLS cert details: issuer, CN, SANs, expiry, fingerprints
 *
 * Auth: Bearer Firebase ID token required
 */

import tls from 'tls';

// ── Shared helpers ──────────────────────────────────────────────────────────

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

// ── TLS cert fetcher ──────────────────────────────────────────────────────────

function fetchTlsCert(hostname, port = 443) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('TLS connection timed out'));
    }, 10_000);

    const socket = tls.connect({ host: hostname, port, servername: hostname, rejectUnauthorized: false }, () => {
      clearTimeout(timeout);
      try {
        const cert = socket.getPeerCertificate(true);
        socket.end();
        resolve(cert);
      } catch (e) {
        socket.destroy();
        reject(e);
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function daysToExpiry(validTo) {
  if (!validTo) return null;
  const expiry = new Date(validTo);
  if (isNaN(expiry.getTime())) return null;
  return Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatFingerprint(hex) {
  if (!hex) return null;
  // Insert colons every 2 chars for readability
  return hex.replace(/(.{2})(?=.)/g, '$1:').toUpperCase();
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { host } = req.body || {};
  if (!host || typeof host !== 'string') return res.status(400).json({ error: 'host is required' });

  // Sanitise: strip non-hostname characters
  const sanitised = host.trim().replace(/[^a-zA-Z0-9._\-]/g, '').toLowerCase();
  if (!sanitised || sanitised.length > 253) return res.status(400).json({ error: 'Invalid hostname' });

  try {
    const cert = await fetchTlsCert(sanitised);

    if (!cert || Object.keys(cert).length === 0) {
      return res.status(200).json({ data: { host: sanitised, error: 'No certificate returned' } });
    }

    const subject = cert.subject || {};
    const issuer = cert.issuer || {};

    // Subject Alt Names
    const san = cert.subjectaltname
      ? cert.subjectaltname.split(', ').map(s => s.replace(/^DNS:/, ''))
      : [];

    const data = {
      host: sanitised,
      common_name: subject.CN || null,
      subject: Object.entries(subject).map(([k, v]) => `${k}=${v}`).join(', '),
      issuer: issuer.O || issuer.CN || Object.entries(issuer).map(([k, v]) => `${k}=${v}`).join(', '),
      issuer_cn: issuer.CN || null,
      valid_from: cert.valid_from || null,
      valid_to: cert.valid_to || null,
      days_to_expiry: daysToExpiry(cert.valid_to),
      san,
      fingerprint_sha256: formatFingerprint(cert.fingerprint256?.replace(/:/g, '')),
      fingerprint_sha1: formatFingerprint(cert.fingerprint?.replace(/:/g, '')),
      signature_algorithm: cert.infoAccess ? null : (cert.sigalg || null),
      serial_number: cert.serialNumber || null,
      protocol: req.connection?.getPeerCertificate ? 'TLS' : 'TLS',
    };

    return res.status(200).json({ data });
  } catch (err) {
    console.error('[tls-insight]', err.message);
    return res.status(500).json({ error: `TLS lookup failed: ${err.message}` });
  }
}
