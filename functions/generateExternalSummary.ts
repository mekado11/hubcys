import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth check
    if (!(await base44.auth.isAuthenticated())) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { externalData, cveData, targetDomain } = await req.json();

    if (!externalData || !targetDomain) {
      return new Response(JSON.stringify({ error: 'External reconnaissance data and target domain are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create comprehensive prompt for external-focused executive summary
    const executiveSummaryPrompt = `
You are a senior cybersecurity consultant creating an executive-level security summary based on external attack surface reconnaissance for the domain: ${targetDomain}

## EXTERNAL RECONNAISSANCE FINDINGS
Target Domain: ${targetDomain}
External Exposure Score: ${externalData.exposure_score}/100
Scan Date: ${new Date(externalData.scan_timestamp).toLocaleDateString()}

Exposed Assets: ${JSON.stringify(externalData.exposed_assets || [], null, 2)}
Open Ports: ${JSON.stringify(externalData.open_ports || [], null, 2)}
Technologies Detected: ${JSON.stringify(externalData.technologies || [], null, 2)}

${cveData && cveData.length > 0 ? `
CRITICAL CVE FINDINGS:
${cveData.map(cve => `- ${cve.cve_id}: ${cve.description} (Severity: ${cve.severity}, CVSS: ${cve.cvss_score})`).join('\n')}
` : 'No critical CVEs detected in external scan.'}

## INSTRUCTIONS
Create a comprehensive "Executive Summary" that focuses specifically on external attack surface findings:

1. **Executive Overview**: Provide a high-level assessment of the organization's external security posture based on what's publicly visible to attackers.

2. **Critical External Risks**: Highlight the most urgent security issues visible from the outside:
   - High-severity CVEs on exposed assets
   - Publicly accessible services that may be sensitive
   - Outdated or vulnerable technologies exposed externally
   - Open ports that may indicate security gaps

3. **Attack Surface Analysis**: Analyze what an attacker can see and potentially exploit:
   - Geographic distribution of assets
   - Service fingerprinting results
   - Technology stack exposure
   - Potential attack vectors based on exposed services

4. **Immediate Action Items**: Provide 3-5 specific, prioritized recommendations that can be acted upon immediately:
   - Services that should be moved behind VPN/authentication
   - Critical patches that need to be applied
   - Network segmentation recommendations
   - Monitoring and detection improvements

5. **Risk Quantification**: Translate findings into business risk language:
   - "Immediate exploitability" risks
   - "High visibility to attackers" concerns
   - Potential impact on business operations
   - Regulatory or compliance implications

6. **Methodology Note**: Briefly explain that this assessment is based on external reconnaissance using Shodan and CVE correlation, and note that internal security maturity assessment would provide additional insights for a complete security posture evaluation.

Format your response in clear, executive-appropriate sections with actionable insights that would be valuable for leadership and technical teams. Use markdown formatting for better readability.

Focus on being practical and actionable rather than purely technical. This summary should help executives understand their external risk exposure and what needs to be done about it.
`;

    // Generate the executive summary using LLM
    const executiveSummary = await base44.integrations.Core.InvokeLLM({
      prompt: executiveSummaryPrompt,
      add_context_from_internet: false
    });

    return new Response(JSON.stringify({
      success: true,
      executive_summary: executiveSummary,
      target_domain: targetDomain,
      scan_timestamp: externalData.scan_timestamp,
      exposure_score: externalData.exposure_score
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating external executive summary:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate executive summary',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});