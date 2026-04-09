/**
 * /api/ai — Vercel serverless function that proxies AI requests.
 *
 * Supports two providers:
 *   • Anthropic (Claude)  — default, uses ANTHROPIC_API_KEY env var
 *   • OpenAI   (GPT)      — selected when `model` starts with "gpt-", uses OPENAI_API_KEY env var
 *
 * POST body: { prompt, model?, response_json_schema? }
 * Returns:   { content: string | object }
 *   - If response_json_schema is provided, content is a parsed JS object.
 *   - Otherwise content is a plain string.
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const OPENAI_API    = 'https://api.openai.com/v1/chat/completions';

async function callClaude(prompt, model, wantJson) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured in environment variables.');

  const system = wantJson
    ? 'You are a helpful AI. Respond with valid JSON only — no markdown, no explanation, just a raw JSON object.'
    : 'You are Nathan, an expert cybersecurity AI assistant for the Hubcys platform. ' +
      'Provide clear, practical, and actionable security guidance.';

  const body = {
    model:      model || 'claude-sonnet-4-6',
    max_tokens: 4096,
    system,
    messages:   [{ role: 'user', content: prompt }],
  };

  const res = await fetch(ANTHROPIC_API, {
    method:  'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callOpenAI(prompt, model, wantJson) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured in environment variables.');

  const body = {
    model:      model || 'gpt-4o',
    max_tokens: 4096,
    messages:   [{ role: 'user', content: prompt }],
    ...(wantJson ? { response_format: { type: 'json_object' } } : {}),
  };

  const res = await fetch(OPENAI_API, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function tryParseJson(text) {
  // Direct parse
  try { return JSON.parse(text); } catch (_) { /* */ }
  // Strip markdown code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch (_) { /* */ } }
  // Find first {...} or [...]
  const bracketMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (bracketMatch) { try { return JSON.parse(bracketMatch[1]); } catch (_) { /* */ } }
  return text; // fallback: return raw string
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model, response_json_schema } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const wantJson = !!response_json_schema;
  const useGpt   = typeof model === 'string' && model.startsWith('gpt');

  try {
    const raw = useGpt
      ? await callOpenAI(prompt, model, wantJson)
      : await callClaude(prompt, model, wantJson);

    const content = wantJson ? tryParseJson(raw) : raw;
    return res.status(200).json({ content });

  } catch (err) {
    console.error('[/api/ai]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
