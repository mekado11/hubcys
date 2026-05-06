/**
 * cveSearch — CVE lookup via the /api/cve-search serverless proxy (OpenCVE).
 * Credentials are kept server-side; no API key in the browser bundle.
 *
 * @param {object} params
 * @param {string} [params.keyword]  Free-text search (product name, keyword)
 * @param {string} [params.cveId]   Exact CVE ID, e.g. "CVE-2024-1234"
 * @param {number} [params.limit]   Max results (default 10)
 * @returns {{ data: object[], total: number }}
 */
import { auth } from '@/api/firebase';

export const cveSearch = async ({ keyword, cveId, limit = 10 } = {}) => {
  if (!keyword && !cveId) throw new Error('cveSearch: keyword or cveId is required');

  let idToken = '';
  try {
    if (auth?.currentUser) idToken = await auth.currentUser.getIdToken();
  } catch (_) { /* caller will get 401 */ }

  const res = await fetch('/api/cve-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ keyword, cveId, limit }),
  });

  const json = await res.json().catch(() => ({ error: 'Invalid server response' }));
  if (!res.ok) throw new Error(json.error || `CVE search failed (${res.status})`);

  return { data: json.data || [], total: json.total || 0 };
};
