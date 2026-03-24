// Update Base44 SDK to the required version and pattern
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { audioUrl, language } = await req.json();
    if (!audioUrl || typeof audioUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing audioUrl' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ASSEMBLYAI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const langMap = {
      'en-US': 'en_us',
      'en-GB': 'en',
      'fr-FR': 'fr',
      'es-ES': 'es',
      'de-DE': 'de',
    };
    const language_code = language && langMap[language] ? langMap[language] : undefined;

    // 1) Create transcript job
    const createResp = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        punctuate: true,
        format_text: true,
        ...(language_code ? { language_code } : { language_detection: true }),
      }),
    });

    const createBodyText = await createResp.text();
    let createBody;
    try { createBody = JSON.parse(createBodyText); } catch { createBody = { raw: createBodyText }; }

    if (!createResp.ok || !createBody.id) {
      return new Response(JSON.stringify({ error: 'AssemblyAI create job failed', details: createBody }), {
        status: createResp.status || 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const transcriptId = createBody.id;

    // 2) Poll for completion
    const maxMs = 120000; // 2 minutes
    const intervalMs = 2000;
    const start = Date.now();
    let finalData = null;

    while (Date.now() - start < maxMs) {
      const pollResp = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: apiKey },
      });

      const pollText = await pollResp.text();
      let pollBody;
      try { pollBody = JSON.parse(pollText); } catch { pollBody = { raw: pollText }; }

      if (!pollResp.ok) {
        return new Response(JSON.stringify({ error: 'AssemblyAI poll failed', details: pollBody }), {
          status: pollResp.status || 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (pollBody.status === 'completed') {
        finalData = pollBody;
        break;
      }
      if (pollBody.status === 'error') {
        return new Response(JSON.stringify({ error: pollBody.error || 'Transcription failed', raw: pollBody }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    if (!finalData) {
      return new Response(JSON.stringify({ error: 'Transcription timed out' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      language: language || finalData.language_code || null,
      text: finalData.text || '',
      raw: finalData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});