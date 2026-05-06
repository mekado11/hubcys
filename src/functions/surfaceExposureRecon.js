/**
 * surfaceExposureRecon — external attack surface OSINT via the Hubcys surface-recon API.
 *
 * @param {object} params
 * @param {string} params.target  Domain to analyse (e.g. "example.com")
 * @returns {{ data: object }}   Exposed assets, risk score, recommendations
 */
import { auth } from '@/api/firebase';

export const surfaceExposureRecon = async ({ target }) => {
  if (!target) throw new Error('surfaceExposureRecon: target is required');

  let idToken = '';
  try {
    if (auth?.currentUser) idToken = await auth.currentUser.getIdToken();
  } catch (_) { /* caller gets 401 */ }

  const res = await fetch('/api/surface-recon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ target }),
  });

  const json = await res.json().catch(() => ({ error: 'Invalid response from server' }));
  if (!res.ok) throw new Error(json.error || `Reconnaissance failed (${res.status})`);
  return json;
};
