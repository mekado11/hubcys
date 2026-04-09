/**
 * Core integrations — Firebase Storage + AI proxy.
 *
 * InvokeLLM routes through /api/ai (Vercel serverless function) so API keys
 * never leave the server. Default provider is Claude (Anthropic).
 * Pass model: 'gpt-4o' (or any 'gpt-*') to use OpenAI instead.
 */
import { storage } from '@/api/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/** Upload a file to Firebase Storage, return { file_url } */
export const UploadFile = async ({ file }) => {
  if (!file) throw new Error('UploadFile: no file provided');
  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { file_url: url };
};

/**
 * InvokeLLM — calls the /api/ai serverless proxy.
 *
 * @param {object} params
 * @param {string} params.prompt               - The user/system prompt
 * @param {string} [params.model]              - 'claude-sonnet-4-6' (default) | 'claude-opus-4-6' | 'gpt-4o' | 'gpt-4o-mini'
 * @param {object} [params.response_json_schema] - When set, the response is a parsed JS object
 * @param {boolean} [params.add_context_from_internet] - Ignored (reserved for future use)
 * @returns {Promise<string|object>} Plain text, or parsed JSON when response_json_schema is provided
 */
export const InvokeLLM = async ({ prompt, model, response_json_schema } = {}) => {
  if (!prompt) throw new Error('InvokeLLM: prompt is required');

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, response_json_schema }),
  });

  if (!res.ok) {
    let message = `AI request failed (${res.status})`;
    try {
      const err = await res.json();
      message = err.error || message;
    } catch (_) { /* ignore */ }
    throw new Error(message);
  }

  const { content } = await res.json();
  return content;
};

/**
 * ExtractDataFromUploadedFile — sends a file URL to Claude for data extraction.
 * Use this for parsing uploaded documents (PDFs, images, spreadsheets).
 *
 * @param {object} params
 * @param {string} params.file_url    - Publicly accessible URL of the uploaded file
 * @param {string} [params.json_schema] - Desired output schema description
 * @returns {Promise<object>}
 */
export const ExtractDataFromUploadedFile = async ({ file_url, json_schema } = {}) => {
  if (!file_url) throw new Error('ExtractDataFromUploadedFile: file_url is required');

  const prompt = `Extract structured data from the file at this URL: ${file_url}

${json_schema ? `Return a JSON object matching this structure:\n${JSON.stringify(json_schema, null, 2)}` : 'Return a JSON object with all relevant data you can extract.'}`;

  return InvokeLLM({ prompt, response_json_schema: json_schema || {} });
};
