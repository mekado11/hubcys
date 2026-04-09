/**
 * correlateCVEs — correlates exposed technologies/assets with known CVEs via AI.
 *
 * @param {object}   params
 * @param {object[]} params.exposed_assets   Array of exposed assets from surfaceExposureRecon
 * @param {string}   params.target_domain    Domain being analysed
 * @returns {{ data: { correlatedCVEs: object[] } }}
 */
import { InvokeLLM } from '@/integrations/Core';

export const correlateCVEs = async ({ exposed_assets = [], target_domain = '' }) => {
  const assetSummary = exposed_assets
    .map(a => `IP: ${a.ip || 'unknown'} — Technologies: ${(a.technologies || []).join(', ')}`)
    .join('\n');

  const prompt = `You are a CVE correlation analyst. Given the following exposed assets for domain "${target_domain}", identify relevant known CVEs.

EXPOSED ASSETS:
${assetSummary || 'No specific assets provided'}

Return a JSON object with this structure:
{
  "correlatedCVEs": [
    {
      "cve_id": "CVE-YYYY-NNNNN",
      "severity": "critical|high|medium|low",
      "cvss_score": 7.5,
      "description": "Short description of the vulnerability",
      "affected_technology": "Technology name and version",
      "published_date": "YYYY-MM-DD",
      "remediation": "How to fix or mitigate this vulnerability"
    }
  ]
}

Focus on CVEs that are:
- Actively exploited in the wild (if any)
- Relevant to the detected technology stack
- From the last 3 years (priority) or well-known older CVEs

Return 3-8 relevant CVEs. If no specific technologies are detected, return common web server CVEs.`;

  const result = await InvokeLLM({
    prompt,
    feature: 'ioc_analysis',
    response_json_schema: { type: 'object' },
  });

  return { data: result };
};
