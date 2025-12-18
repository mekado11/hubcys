
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== generateGrandSummary v2.7: Starting ===');

  try {
    const base44 = createClientFromRequest(req);

    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      console.error('Authentication failed: No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Authenticated user: ${user.email}`);

    // Parse request body for assessmentId
    const { assessmentId } = await req.json();

    if (!assessmentId) {
      console.error('Missing assessmentId in request');
      return Response.json({ error: 'assessmentId is required' }, { status: 400 });
    }

    console.log(`Loading assessment: ${assessmentId}`);

    // Load the assessment
    const assessment = await base44.asServiceRole.entities.Assessment.get(assessmentId);

    if (!assessment) {
      console.error(`Assessment not found: ${assessmentId}`);
      return Response.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Security check: ensure assessment belongs to user's company
    if (assessment.company_id !== user.company_id) {
      console.error(`Security violation: User ${user.email} tried to access assessment from different company`);
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log(`Assessment loaded successfully for company: ${assessment.company_name}`);

    // --- Data Gathering for Prompt ---

    const companyName = assessment.company_name || 'a company';
    const industrySector = assessment.industry_sector?.replace(/_/g, ' ') || 'not specified';
    const companySize = assessment.company_size?.replace(/_/g, ' ') || 'size not specified';
    const overallScore = assessment.overall_score || 0;
    const maturityLevel = assessment.maturity_level || 'Beginner';

    const maturityScores = `Identity: ${assessment.maturity_identity || 0}/5, Asset Mgmt: ${assessment.maturity_asset_management || 0}/5, Infrastructure: ${assessment.maturity_infra_security || 0}/5, App Security: ${assessment.maturity_app_security || 0}/5, Third-Party: ${assessment.maturity_third_party_risk || 0}/5, Incident Response: ${assessment.maturity_incident_response || 0}/5, Governance: ${assessment.maturity_governance_risk || 0}/5, Data Protection: ${assessment.maturity_data_protection || 0}/5, Training: ${assessment.maturity_security_training || 0}/5, Cloud: ${assessment.maturity_cloud_security || 0}/5`;

    const operationalContext = `
- Local Admin Privileges: ${assessment.ops_local_admin_privileges || 'Unknown'}
- Software Installation Control: ${assessment.ops_software_installation_control || 'Unknown'}
- BYOD Security Controls: ${assessment.ops_byod_security_controls || 'Unknown'}
- Remote Access Method: ${assessment.ops_remote_access_method || 'Unknown'}
- Unsanctioned Cloud Apps: ${assessment.ops_unsanctioned_cloud_apps || 'Unknown'}
- Personal Cloud Storage: ${assessment.ops_personal_cloud_storage || 'Unknown'}
- Patch Management Cadence: ${assessment.ops_patch_management_cadence || 'Unknown'}
- Mobile Device Management: ${assessment.ops_mobile_device_management || 'Unknown'}
- Data Classification System: ${assessment.ops_data_classification_system || 'Unknown'}
- Network Access Control: ${assessment.ops_network_access_control || 'Unknown'}
- Offboarding Data Management: ${assessment.ops_offboarding_data_management || 'Unknown'}
- EDR Coverage: ${assessment.ops_endpoint_edr_coverage || 'Unknown'}
- Centralized Logging/SIEM: ${assessment.ops_centralized_logging_siem || 'Unknown'}
- Vulnerability Scanning: ${assessment.ops_vulnerability_scanning_frequency || 'Unknown'}
- Data Loss Prevention: ${assessment.ops_data_loss_prevention || 'Unknown'}
- Security Baseline Enforcement: ${assessment.ops_security_baseline_enforcement || 'Unknown'}
`;

    const keyDetails = `
${assessment.details_identity ? `Identity: ${assessment.details_identity}` : ''}
${assessment.details_asset_management ? `Asset Management: ${assessment.details_asset_management}` : ''}
${assessment.details_infra_security ? `Infrastructure: ${assessment.details_infra_security}` : ''}
${assessment.details_app_security ? `Application Security: ${assessment.details_app_security}` : ''}
${assessment.details_third_party_risk ? `Third-Party Risk: ${assessment.details_third_party_risk}` : ''}
${assessment.details_incident_response ? `Incident Response: ${assessment.details_incident_response}` : ''}
${assessment.details_governance_risk ? `Governance & Risk: ${assessment.details_governance_risk}` : ''}
${assessment.details_data_protection ? `Data Protection: ${assessment.details_data_protection}` : ''}
${assessment.details_security_training ? `Security Training: ${assessment.details_security_training}` : ''}
${assessment.details_cloud_security ? `Cloud Security: ${assessment.details_cloud_security}` : ''}
${assessment.details_business_continuity ? `Business Continuity: ${assessment.details_business_continuity}` : ''}
`;

    const strategicContext = `
- Security/Compliance Goals: ${assessment.security_compliance_goals || 'Not specified'}
- Previous Gap Analysis Findings: ${assessment.previous_gap_analysis_details || 'Not specified'}
- Current Biggest Risks: ${assessment.current_biggest_risks || 'Not specified'}
- Business Critical Systems: ${assessment.business_critical_systems || 'Not specified'}
- CISO Perspective: ${assessment.ciso_perspective || 'Not specified'}
- Compliance Tooling: ${assessment.compliance_tooling_details || 'Not specified'}
`;

    const externalAttackSurface = assessment.external_attack_surface ? JSON.parse(assessment.external_attack_surface) : null;
    const externalCVEThreats = assessment.external_cve_threats ? JSON.parse(assessment.external_cve_threats) : null;
    const surfaceExposureScore = assessment.surface_exposure_score || 0;

    const externalDataSummary = externalAttackSurface ? `
External Attack Surface Summary:
- Total Exposures: ${externalAttackSurface.total_exposures || 'N/A'}
- Exposed Assets: ${externalAttackSurface.exposed_assets?.map(a => `${a.ip}:${a.port} (${a.service})`).join(', ').slice(0, 200) + '...' || 'None specified'}
- Technology Stack: ${externalAttackSurface.tech_stack?.join(', ').slice(0, 200) + '...' || 'None specified'}
- Surface Exposure Risk Score: ${surfaceExposureScore}/100
${externalCVEThreats && (externalCVEThreats.critical?.length > 0 || externalCVEThreats.high?.length > 0) ? `
  Correlated CVEs:
  - Critical: ${externalCVEThreats.critical?.length || 0}
  - High: ${externalCVEThreats.high?.length || 0}` : ''}
` : 'No external attack surface data was provided.';

    const applicableLaws = assessment.applicable_us_privacy_laws?.join(', ').replace(/_/g, ' ') || '';

    const nis2Details = assessment.nis2_supply_chain_security || assessment.nis2_business_continuity || assessment.nis2_vulnerability_handling ? `
NIS2 Directive Alignment Details:
- Supply Chain Security: ${assessment.nis2_supply_chain_security || 'Not provided'}
- Business Continuity: ${assessment.nis2_business_continuity || 'Not provided'}
- Vulnerability Handling: ${assessment.nis2_vulnerability_handling || 'Not provided'}
- Use of Cryptography: ${assessment.nis2_use_of_crypto || 'Not provided'}
- Essential Services Identification: ${assessment.nis2_essential_services || 'Not provided'}
- Cybersecurity Governance: ${assessment.nis2_governance_framework || 'Not provided'}
- Human Resources Security: ${assessment.nis2_human_resources_security || 'Not provided'}
` : '';

    let biaFinancials = '';
    if (assessment.bia_financials) {
        try {
            const financials = JSON.parse(assessment.bia_financials);
            biaFinancials = `
Financial Quantifications from BIA:
- Annualized Loss Expectancy (ALE): ${financials.ale_total ? `$${financials.ale_total.toLocaleString()} USD` : 'N/A'}
- Single Loss Expectancy (SLE) Range: ${financials.sle_range || 'N/A'}
- Incident Response Cost Range: ${financials.incident_response_cost_range || 'N/A'}
- Regulatory Fine Potential: ${financials.regulatory_fine_potential ? `$${financials.regulatory_fine_potential.toLocaleString()} USD` : 'N/A'}
`;
        } catch (e) {
            biaFinancials = 'BIA Financials data is available but could not be parsed.';
        }
    }
    
    // --- The Enhanced Prompt ---
    const executiveAssessmentPrompt = `
You are Nathan, the Fortigap AI Security Advisor. Your task is to create an *executive-level cybersecurity maturity report* that merges business, financial, and technical insight.
The report will be read by board members, CISOs, and regulators.

Available data includes:
- Domain maturity scores across security areas (0–5 scale)
- Business impact metrics (downtime cost, data value, regulatory fines)
- Control gaps with references to NIST CSF, ISO 27001, CIS Controls, GDPR, NIS2, PCI DSS, and NCSC Cyber Essentials
- Mapped CVE and threat intelligence data
- Financial risk exposure (ALE/SLE/EF if provided)
- Risk trends over time (if available)

# INSTRUCTIONS FOR GENERATING THE REPORT

1. **Executive Snapshot (Strategic View)**
   - 2–3 sentences summarizing the organization's overall cybersecurity maturity (average maturity score, trend direction, and relative industry position if known).
   - Identify 3–5 *top business risks* using quantifiable and financial terms (e.g., "$2.4M potential annualized loss due to ransomware exposure", "Regulatory fines up to $500k under GDPR Article 32").
   - Include a calculated *Estimated Annualized Financial Exposure (USD)* using available data.

2. **Quantified Current State (By Domain)**
   - For each domain (Identity, Infrastructure, Data Protection, Application Security, Governance, etc.), provide:
     - Maturity score (x/5)
     - Strengths (what’s working)
     - Weaknesses (key control or policy gaps)
     - Trend indicators if available (↑ stable ↓)
   - Quantify where possible: "% endpoints with EDR", "% systems with MFA", "% vendors with contracts reviewed".

3. **Credible Attack Path Simulation**
   - Describe 3–4 realistic attack scenarios based on the current weaknesses.
   - Map each to MITRE ATT&CK IDs (e.g., T1566, T1078, T1190).
   - Include a short narrative of attacker progression:
     > “Phishing → Credential reuse → Privilege escalation → Data exfiltration → Ransom demand.”
   - Estimate business impact (financial, downtime, regulatory) per scenario.

4. **Control Gap Analysis (Framework-Aligned)**
   - Identify the most critical missing or weak controls across domains.
   - For each, describe:
     - *Why it matters* in operational or compliance terms.
     - Reference 1–2 relevant controls or standards (e.g., “NIST CSF PR.AC-1”, “ISO 27001 A.9.2.1”, “NCSC Cyber Essentials 4.1”).
     - Indicate control maturity (e.g., “1/5 – Not Implemented”).
     - Estimate residual risk: High, Medium, Low.
   - End this section with a “Coverage Table” summary (% overlap with frameworks).

5. **Strategic Roadmap (Prioritized & Financially Scaled)**
   - Organize actions in 3 horizons:
     - **Critical (0–30 Days):** Immediate fixes to stop ongoing risk. Include Owner, Effort (Low/Med/High), and Estimated Cost.
     - **High Priority (30–90 Days):** Tactical hardening and control improvements.
     - **Medium Priority (90–180 Days):** Governance, awareness, or long-term automation.
   - Include estimated ROI or cost-avoidance impact in USD (e.g., “$20k investment prevents $450k annual risk exposure”).

6. **Forward Outlook (Optional if data available)**
   - Predict 6–12 month risk trajectory based on maturity trend, threat landscape, and control roadmap completion.
   - Add a 1–2 sentence “CISO Insight” – what the next phase should focus on strategically.

7. **Formatting**
   - Output in **Markdown** for readability.
   - Sections:
     # Executive Snapshot
     # Quantified Current State
     # Credible Attack Paths
     # Control Gap Analysis
     # Strategic Roadmap
     # Forward Outlook (if applicable)
   - Keep tone professional, authoritative, and data-backed. Avoid generic statements.
   - Use business terms — not just technical — to explain risk impact (revenue, operations, brand, compliance).

Remember:
Your role is to synthesize *technical findings into business intelligence*.
Write as if this will be presented to the CEO, CISO, and CFO.

Provided Context:
Company Profile:
- Company Name: ${companyName}
- Industry: ${industrySector}
- Size: ${companySize}
- Framework in Use: ${assessment.framework || 'N/A'}
${assessment.company_description ? `Description: ${assessment.company_description}` : ''}

Internal Assessment Findings:
- Overall Security Score: ${overallScore}% (Maturity: ${maturityLevel})
- Maturity Scores (0-5 scale): ${maturityScores}
- Detailed Domain-Specific Insights:
${keyDetails}

Operational Security Context:
${operationalContext}

Strategic Context:
${strategicContext}

External Threat Intelligence:
${externalDataSummary}

Compliance Context:
${applicableLaws ? `Applicable Laws: ${applicableLaws}` : ''}
${nis2Details}
${biaFinancials}
`;

    console.log('Calling LLM with upgraded prompt...');

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: executiveAssessmentPrompt,
      add_context_from_internet: false
    });

    console.log('LLM Response received. Saving to database...');

    await base44.asServiceRole.entities.Assessment.update(assessmentId, {
      grand_summary: llmResponse,
      grand_summary_generated_date: new Date().toISOString()
    });

    console.log('=== generateGrandSummary v2.7: Complete ===');

    return Response.json({
      success: true,
      grand_summary: llmResponse
    });

  } catch (error) {
    console.error('=== generateGrandSummary: ERROR ===');
    console.error('Error details:', error);
    const errorMessage = error.message || 'Failed to generate grand summary';
    return Response.json({
      error: errorMessage
    }, { status: 500 });
  }
});
