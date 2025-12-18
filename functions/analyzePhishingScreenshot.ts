import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Main analysis function
Deno.serve(async (req) => {
  try {
    // 1. Authentication and Authorization
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Safely parse request body
    const { file_urls, email_headers, suspicious_urls, file_hashes } = await req.json();
    if (!file_urls || !Array.isArray(file_urls) || file_urls.length === 0) {
      return new Response(JSON.stringify({ error: 'No file URLs provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Define the ENHANCED JSON output from the AI
    const responseSchema = {
      type: "object",
      properties: {
        verdict: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Overall risk verdict." },
        score: { type: "number", minimum: 0, maximum: 100, description: "A numerical risk score from 0 to 100." },
        reasons: { type: "array", items: { type: "string" }, description: "A list of general red flags identified." },
        overall_risk_assessment_narrative: { type: "string", description: "A concise paragraph summarizing the findings and explaining the verdict. Explain WHY the score was given." },
        extracted_text: { type: "string", description: "All text extracted from the screenshot. Can be empty." },
        suspicious_phrases: { type: "array", items: { type: "string" }, description: "Specific words or phrases within the extracted_text that are indicative of a scam (e.g., 'urgent action required', 'verify your account')." },
        artifacts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["domain", "url", "email", "ip", "hash_md5", "hash_sha256"], description: "The type of indicator." },
              value: { type: "string", description: "The indicator's value." },
              risk: { type: "string", enum: ["low", "medium", "high", "critical", "unknown"], description: "The assessed risk of this specific indicator." },
              source: { type: "string", enum: ["screenshot_ocr", "email_header", "user_submitted_url", "user_submitted_hash", "inferred"], description: "How this artifact was identified." },
              reasoning: { type: "string", description: "A concise explanation of WHY this specific artifact is considered risky or suspicious." }
            },
            required: ["type", "value", "risk", "source", "reasoning"]
          },
          description: "A list of security indicators found. Can be an empty array."
        }
      },
      required: ["verdict", "score", "reasons", "overall_risk_assessment_narrative", "artifacts"]
    };
    
    // 4. Build context block
    let context_block = "No additional metadata provided by the user.";
    const contexts = [];
    if (email_headers) {
      contexts.push(`\n\n--- EMAIL HEADERS (FOR ANALYSIS) ---\n${email_headers}`);
    }
    if (suspicious_urls && suspicious_urls.length > 0) {
      contexts.push(`\n\n--- USER-SUBMITTED SUSPICIOUS URLS ---\n${suspicious_urls.join('\n')}`);
    }
    if (file_hashes && file_hashes.length > 0) {
      contexts.push(`\n\n--- USER-SUBMITTED FILE HASHES ---\n${file_hashes.join('\n')}`);
    }
    if (contexts.length > 0) {
      context_block = contexts.join('');
    }

    // 5. Create the NEW, more detailed prompt for the AI
    const prompt = `
You are an expert cybersecurity analyst. Your task is to analyze the provided screenshot(s) and any user-submitted metadata to produce a detailed and clear security assessment.

**Analysis Rules:**
1.  **Holistic Analysis:** Synthesize information from the screenshot's visual content AND any provided metadata. Metadata is highly reliable.
2.  **Complete All Fields:** You MUST populate all fields in the response schema, including the new 'overall_risk_assessment_narrative', 'suspicious_phrases', and 'reasoning' for each artifact.
3.  **Narrative is Key:** The 'overall_risk_assessment_narrative' must be a clear, concise paragraph explaining the final verdict and score. Example: "This is a critical risk due to a suspicious sender domain combined with urgent language designed to pressure the user. The primary threat is credential theft via a malicious link."
4.  **Identify Suspicious Phrases:** In the 'suspicious_phrases' array, list the exact words/phrases from the email body that are red flags (e.g., "account suspended," "verify immediately," "unusual login"). This is crucial.
5.  **Reasoning for Artifacts:** For each artifact, the 'reasoning' field must explain WHY it's a risk.
    - URL: "Domain appears to be typosquatting 'google.com'."
    - Email: "Sender from a generic free-mail domain, not an official company domain."
    - Hash: "Matches known malware signature."
6.  **Source Attribution:** Meticulously label the 'source' for every artifact ('screenshot_ocr', 'email_header', 'user_submitted_url', 'user_submitted_hash', 'inferred').
7.  **If Benign:** If the item is safe, clearly state it. Verdict: "low", Score: <10, Narrative: "Analysis shows this is likely a legitimate communication...", Artifacts: risk: "low", reasoning: "Matches official company domain."

**User-Provided Context:**
${context_block}

Analyze the attached screenshot(s) and provide your findings in the required JSON format.
`;

    // 6. Execute AI analysis
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls,
      add_context_from_internet: false, // Keep this disabled for stability
      response_json_schema: responseSchema,
    });

    // 7. Validate the response
    if (!analysisResult || !analysisResult.verdict || !analysisResult.artifacts) {
      throw new Error('AI analysis returned an incomplete or invalid response.');
    }

    // 8. Return the successful response
    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Phishing analysis function failed:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    return new Response(JSON.stringify({ error: `Analysis failed: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});