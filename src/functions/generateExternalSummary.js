/**
 * generateExternalSummary — AI executive summary of external attack surface scan.
 *
 * @param {object}   params
 * @param {object}   params.externalData   Results from surfaceExposureRecon
 * @param {object[]} params.cveData        Correlated CVEs
 * @param {string}   params.targetDomain   Domain that was scanned
 * @returns {{ data: { success: boolean, executive_summary: string, scan_timestamp: string } }}
 */
import { InvokeLLM } from '@/integrations/Core';

export const generateExternalSummary = async ({ externalData = {}, cveData = [], targetDomain = '' }) => {
  const cveSummary = cveData.length > 0
    ? cveData.map(c => `- ${c.cve_id} (${c.severity?.toUpperCase()}, CVSS ${c.cvss_score}): ${c.description}`).join('\n')
    : 'No critical CVEs identified.';

  const assetCount   = externalData.exposed_assets?.length || 0;
  const portCount    = externalData.open_ports?.length || 0;
  const techCount    = externalData.technologies?.length || 0;
  const riskScore    = externalData.exposure_score ?? 0;
  const recs         = (externalData.recommendations || []).join('\n- ');

  const prompt = `You are a senior cybersecurity consultant. Write a concise executive summary report for the external attack surface analysis of "${targetDomain}".

SCAN DATA SUMMARY:
- Exposure Score: ${riskScore}/100
- Exposed Assets: ${assetCount}
- Open Ports: ${portCount}
- Technologies Detected: ${techCount}

CVE FINDINGS:
${cveSummary}

SECURITY RECOMMENDATIONS FROM SCAN:
${recs ? '- ' + recs : 'None provided.'}

Write a professional executive summary in Markdown format with these sections:
1. ## Executive Overview — Brief risk assessment (2-3 sentences)
2. ## Key Findings — Bullet points of most significant issues
3. ## Risk Assessment — Overall risk posture with rationale
4. ## Priority Actions — Top 3-5 immediate remediation steps

Keep it concise, professional, and actionable. Use **bold** for critical items.`;

  const summary = await InvokeLLM({
    prompt,
    feature: 'smart_analysis',
  });

  return {
    data: {
      success: true,
      executive_summary: typeof summary === 'string' ? summary : JSON.stringify(summary),
      scan_timestamp: new Date().toISOString(),
    }
  };
};
