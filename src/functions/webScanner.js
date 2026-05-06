/**
 * webScanner — URL security analysis via the Hubcys web-scanner API.
 *
 * @param {object} params
 * @param {string} params.target  URL or hostname to scan
 * @returns {{ data: object }}   Structured scan results with findings, ports, CVEs
 */
import { auth } from '@/api/firebase';

export const webScanner = async ({ target }) => {
  if (!target) throw new Error('webScanner: target is required');

  let idToken = '';
  try {
    if (auth?.currentUser) idToken = await auth.currentUser.getIdToken();
  } catch (_) { /* caller gets 401 */ }

  const res = await fetch('/api/web-scanner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ target }),
  });

  const json = await res.json().catch(() => ({ error: 'Invalid response from server' }));
  if (!res.ok) throw new Error(json.error || `Scan failed (${res.status})`);
  return json;
};
