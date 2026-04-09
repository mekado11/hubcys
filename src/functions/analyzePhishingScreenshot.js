/**
 * analyzePhishingScreenshot — sends screenshot(s) to the Hubcys AI backend
 * for phishing detection via Claude vision.
 *
 * @param {object}   params
 * @param {string[]} params.file_urls        Firebase Storage public download URLs (max 3)
 * @param {string}   [params.email_headers]  Raw email header block
 * @param {string[]} [params.suspicious_urls] URLs found in the email/screenshot
 * @param {string[]} [params.file_hashes]    SHA-256 hashes of attachments
 *
 * @returns {{ status: number, data: object }}
 */
import { auth } from '@/api/firebase';

export const analyzePhishingScreenshot = async ({
  file_urls,
  email_headers,
  suspicious_urls,
  file_hashes,
}) => {
  if (!file_urls?.length) {
    throw new Error('No screenshot URLs provided for analysis.');
  }

  // Attach Firebase ID token so the server verifies the caller is authenticated
  let idToken = '';
  try {
    if (auth?.currentUser) idToken = await auth.currentUser.getIdToken();
  } catch (_) { /* caller will get 401 from server */ }

  const res = await fetch('/api/analyze-screenshot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ file_urls, email_headers, suspicious_urls, file_hashes }),
  });

  const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));

  if (!res.ok) {
    throw new Error(data.error || `Analysis request failed (${res.status})`);
  }

  return { status: res.status, data };
};
