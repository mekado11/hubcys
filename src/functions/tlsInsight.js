/**
 * tlsInsight — TLS certificate inspection via the Hubcys tls-insight API.
 *
 * @param {object} params
 * @param {string} params.host  Hostname to inspect (e.g. "example.com")
 * @returns {{ data: object }}  TLS cert details: issuer, CN, SANs, expiry, fingerprints
 */
import { auth } from '@/api/firebase';

export const tlsInsight = async ({ host }) => {
  if (!host) throw new Error('tlsInsight: host is required');

  let idToken = '';
  try {
    if (auth?.currentUser) idToken = await auth.currentUser.getIdToken();
  } catch (_) { /* caller gets 401 */ }

  const res = await fetch('/api/tls-insight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ host }),
  });

  const json = await res.json().catch(() => ({ error: 'Invalid response from server' }));
  if (!res.ok) throw new Error(json.error || `TLS lookup failed (${res.status})`);
  return json;
};
