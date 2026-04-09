/**
 * Core integrations — Firebase Storage + AI gateway client.
 *
 * InvokeLLM routes through /api/ai (Vercel serverless) so API keys
 * never appear in the browser bundle.
 *
 * Pass `feature` to get correct model + token budget automatically:
 *
 *   FAST lane  (gpt-4o-mini)      — cve_lookup, summarize, task_rewrite,
 *                                   checkin_summary, list_generation, extraction
 *
 *   DEEP lane  (claude-sonnet-4-6) — policy_generate, incident_playbook,
 *                                   architecture_audit, sast_analysis,
 *                                   bia_analysis, tabletop, smart_analysis,
 *                                   consultation, ioc_analysis
 *
 * Omit `feature` and the gateway auto-detects lane from prompt content.
 */
import { auth, storage } from '@/api/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/** Upload a file to Firebase Storage, return { file_url } */
export const UploadFile = async ({ file }) => {
  if (!file) throw new Error('UploadFile: no file provided');
  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  const snapshot   = await uploadBytes(storageRef, file);
  const url        = await getDownloadURL(snapshot.ref);
  return { file_url: url };
};

/**
 * InvokeLLM — calls the /api/ai gateway.
 *
 * @param {object}  params
 * @param {string}  params.prompt                  Required. The prompt text.
 * @param {string}  [params.feature]               Route key — see ROUTES table in /api/ai.js
 * @param {string}  [params.model]                 Override model ID (e.g. 'gpt-4o-mini', 'claude-opus-4-6')
 * @param {object}  [params.response_json_schema]  When set, response is a parsed JS object
 * @param {boolean} [params.add_context_from_internet]  Ignored (reserved)
 * @returns {Promise<string|object>}  Plain string, or parsed object if response_json_schema given
 */
export const InvokeLLM = async ({
  prompt,
  feature,
  model,
  response_json_schema,
  // eslint-disable-next-line no-unused-vars
  add_context_from_internet,
} = {}) => {
  if (!prompt) throw new Error('InvokeLLM: prompt is required');

  // Attach Firebase ID token so the server can verify the caller is authenticated
  let idToken = '';
  try {
    if (auth?.currentUser) idToken = await auth.currentUser.getIdToken();
  } catch (_) { /* no-op — unauthenticated users get 401 from server */ }

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ prompt, feature, model, response_json_schema }),
  });

  if (!res.ok) {
    let message = `AI request failed (${res.status})`;
    try { const err = await res.json(); message = err.error || message; } catch (_) { /* */ }
    throw new Error(message);
  }

  const { content } = await res.json();
  return content;
};

/**
 * ExtractDataFromUploadedFile — sends a file URL to Claude for extraction.
 *
 * @param {object} params
 * @param {string} params.file_url     Publicly accessible URL of the uploaded file
 * @param {object} [params.json_schema] Desired output structure
 * @returns {Promise<object>}
 */
export const ExtractDataFromUploadedFile = async ({ file_url, json_schema } = {}) => {
  if (!file_url) throw new Error('ExtractDataFromUploadedFile: file_url is required');

  const prompt = `Extract structured data from the file at this URL: ${file_url}

${json_schema
  ? `Return a JSON object matching this structure:\n${JSON.stringify(json_schema, null, 2)}`
  : 'Return a JSON object with all relevant data you can extract.'}`;

  return InvokeLLM({ prompt, feature: 'extraction', response_json_schema: json_schema || {} });
};
