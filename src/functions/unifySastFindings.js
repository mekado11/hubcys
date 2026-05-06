/**
 * unifySastFindings — merges and deduplicates SAST findings from multiple scanners via AI.
 *
 * @param {object}   params
 * @param {object[]} params.llmFindings          Findings from LLM analysis
 * @param {object[]} params.semgrepFindings       Findings from Semgrep
 * @param {object[]} params.zapFindings           Findings from OWASP ZAP
 * @param {object[]} params.dependencyFindings    Findings from dependency scanner
 * @returns {{ data: object }}   Unified, deduplicated findings list
 */
import { InvokeLLM } from '@/integrations/Core';

export const unifySastFindings = async ({
  llmFindings = [],
  semgrepFindings = [],
  zapFindings = [],
  dependencyFindings = [],
}) => {
  const totalCount = llmFindings.length + semgrepFindings.length + zapFindings.length + dependencyFindings.length;

  if (totalCount === 0) {
    return { data: { findings: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 } } };
  }

  const prompt = `You are a security engineer. Merge and deduplicate the following SAST findings from multiple scanners.

LLM FINDINGS (${llmFindings.length}):
${JSON.stringify(llmFindings.slice(0, 20), null, 2)}

SEMGREP FINDINGS (${semgrepFindings.length}):
${JSON.stringify(semgrepFindings.slice(0, 20), null, 2)}

ZAP FINDINGS (${zapFindings.length}):
${JSON.stringify(zapFindings.slice(0, 20), null, 2)}

DEPENDENCY FINDINGS (${dependencyFindings.length}):
${JSON.stringify(dependencyFindings.slice(0, 20), null, 2)}

Produce a unified JSON object:
{
  "findings": [
    {
      "id": "SAST-001",
      "title": "Finding title",
      "severity": "critical|high|medium|low|info",
      "category": "Injection|XSS|Auth|Config|Dependency|...",
      "file": "path/to/file.js or null",
      "line": 42,
      "description": "What the issue is",
      "evidence": "Code snippet or technical detail",
      "remediation": "How to fix it",
      "sources": ["llm", "semgrep", "zap", "dependency"],
      "cwe": "CWE-89"
    }
  ],
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "info": 0
  }
}

Rules:
- Deduplicate by combining findings that describe the same issue (same file+line or same vulnerability type)
- Mark source as array of all scanners that found it
- Normalise severity to: critical, high, medium, low, info
- Sort by severity (critical first)`;

  const result = await InvokeLLM({
    prompt,
    feature: 'sast_analysis',
    response_json_schema: { type: 'object' },
  });

  return { data: result };
};
