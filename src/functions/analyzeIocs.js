/**
 * analyzeIocs — parses and analyses a log/IOC file for indicators of compromise.
 *
 * @param {object}  params
 * @param {string}  params.file_url            Firebase Storage download URL of the log file
 * @param {boolean} [params.enable_ai_mapping] Whether to enable full AI MITRE ATT&CK mapping
 * @param {string}  [params.log_type]          Log type hint: 'cyber', 'physical_access', etc.
 * @returns {{ data: object }}   Structured IOC analysis result matching the IOCAnalyzer UI schema
 */
import { InvokeLLM } from '@/integrations/Core';

const MAX_FILE_BYTES = 64 * 1024;

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

  let logContent = '';
  try {
    logContent = await fetchFileText(file_url);
  } catch (err) {
    throw new Error(`Could not read file for analysis: ${err.message}`);
  }

  const truncated = logContent.slice(0, 48_000);

  const mitreFallback = enable_ai_mapping
    ? '"mitre_with_names": [{"id": "T1234", "name": "Technique Name"}],'
    : '"mitre_with_names": [],';

  const prompt = `You are a threat intelligence analyst. Analyse the following ${log_type} log file and extract all Indicators of Compromise (IOCs).

LOG CONTENT (first 48KB):
\`\`\`
${truncated}
\`\`\`

Return a JSON object with EXACTLY this structure:

{
  "results": [
    {
      "type": "ip|domain|url|hash|email|filename|registry_key|user_agent|cve",
      "value": "<the actual IOC value>",
      "verdict": "high|medium|low",
      "score": <integer 0-100, where >=70 is high, >=40 is medium, <40 is low>,
      "rationale": ["<why this is suspicious, reason 1>", "<reason 2>"],
      "recommended_actions": ["block_ip|watchlist_ip|open_incident|alert|block_domain_or_sinkhole|watchlist_domain|block_hash_edr|watchlist_hash|investigate_internal_host"],
      "samples": ["<raw log line where this IOC appeared>"],
      "event_context": {
        "source": "<log source name or null>",
        "event_id": null,
        "action": "<action taken or null>",
        "outcome": "<success|failure|null>",
        "user": "<username if present or null>",
        "process_name": "<process name if present or null>",
        "src_ip": "<source IP if applicable or null>",
        "share_name": null,
        "access_mask": null
      },
      "enrichment": {
        "country_name": null,
        "hostname": null,
        "ti_summary": "<1-sentence threat intel summary>"
      },
      ${mitreFallback}
      "owasp_categories": ${enable_ai_mapping ? '["A01:2021-Broken Access Control"]' : '[]'},
      "nist_category": ${enable_ai_mapping ? '"PR.AC-3"' : 'null'},
      "analyst_note": null
    }
  ],
  "summary": {
    "total_events": <integer — total log lines/events parsed>,
    "total_iocs": <integer — total distinct IOCs found>,
    "high": <integer — count of high-verdict IOCs>,
    "medium": <integer — count of medium-verdict IOCs>,
    "low": <integer — count of low-verdict IOCs>
  },
  "event_groups": [
    {
      "group_type": "impossible_travel|privilege_escalation|c2_beaconing|data_exfiltration|off_hours_activity|brute_force|lateral_movement",
      "severity": "high|medium|low",
      "narrative": "<2-3 sentence description of the attack pattern detected>",
      "mitre_techniques": ["T1078", "T1110"]
    }
  ]
}

Rules:
- verdict = "high" if score >= 70, "medium" if score >= 40, "low" otherwise
- Extract all suspicious IPs, domains, URLs, hashes, emails, filenames
- Exclude RFC1918 private IPs and localhost UNLESS in a clearly suspicious context
- event_groups captures behavioral patterns across multiple IOCs (return 1-3 groups, or [] if none)
- If log is empty or no IOCs found, return results=[], summary with zeros, event_groups=[]`;

  const result = await InvokeLLM({
    prompt,
    feature: 'ioc_analysis',
    response_json_schema: { type: 'object' },
  });

  return { data: result };
};
