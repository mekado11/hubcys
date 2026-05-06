/**
 * analyzeIocs — parses and analyses a log/IOC file for indicators of compromise.
 *
 * Fetches the uploaded file from Firebase Storage, extracts IOCs via AI,
 * and returns a structured analysis.
 *
 * @param {object}  params
 * @param {string}  params.file_url         Firebase Storage download URL of the log file
 * @param {boolean} [params.enable_ai_mapping]  Whether to enable full AI MITRE ATT&CK mapping
 * @param {string}  [params.log_type]        Log type hint: 'cyber', 'network', 'endpoint', 'auth'
 * @returns {{ data: object }}   Structured IOC analysis result
 */
import { InvokeLLM } from '@/integrations/Core';

const MAX_FILE_BYTES = 64 * 1024; // Read first 64 KB of the log file

async function fetchFileText(url) {
  const res = await fetch(url, {
    headers: { Range: `bytes=0-${MAX_FILE_BYTES - 1}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok && res.status !== 206) throw new Error(`Failed to fetch file: HTTP ${res.status}`);
  return res.text();
}

export const analyzeIocs = async ({ file_url, enable_ai_mapping = true, log_type = 'cyber' }) => {
  if (!file_url) throw new Error('analyzeIocs: file_url is required');

  // Fetch log content
  let logContent = '';
  try {
    logContent = await fetchFileText(file_url);
  } catch (err) {
    throw new Error(`Could not read file for analysis: ${err.message}`);
  }

  // Truncate for AI context window
  const truncated = logContent.slice(0, 48_000);

  const prompt = `You are a threat intelligence analyst. Analyse the following ${log_type} log file and extract all Indicators of Compromise (IOCs).

LOG CONTENT (first 48KB):
\`\`\`
${truncated}
\`\`\`

Extract and return a JSON object with ALL IOCs found:

{
  "iocs": [
    {
      "type": "ip|domain|url|hash|email|filename|registry_key|user_agent|cve",
      "value": "<the actual IOC value>",
      "context": "Brief context (which line/event it appeared in)",
      "severity": "critical|high|medium|low|info",
      "mitre_tactic": "${enable_ai_mapping ? 'MITRE ATT&CK Tactic (e.g. Initial Access, Execution, Persistence)' : 'N/A'}",
      "mitre_technique": "${enable_ai_mapping ? 'e.g. T1566.001' : 'N/A'}",
      "description": "What this IOC suggests"
    }
  ],
  "summary": {
    "total_iocs": 0,
    "by_type": { "ip": 0, "domain": 0, "url": 0, "hash": 0, "email": 0 },
    "by_severity": { "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0 },
    "log_type": "${log_type}",
    "analysis_notes": "Brief overview of what the log shows"
  },
  "threat_assessment": {
    "overall_severity": "critical|high|medium|low|info",
    "confidence": "high|medium|low",
    "likely_attack_type": "Description of suspected attack type or 'No clear attack pattern detected'",
    "recommended_actions": ["action 1", "action 2"]
  }
}

Be thorough — extract every IP, domain, URL, file hash, email address, and suspicious string.
Exclude RFC1918 private IPs and localhost unless they appear in a suspicious context.`;

  const result = await InvokeLLM({
    prompt,
    feature: 'ioc_analysis',
    response_json_schema: { type: 'object' },
  });

  return { data: result };
};
