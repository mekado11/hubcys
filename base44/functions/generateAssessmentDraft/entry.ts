import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== generateAssessmentDraft: Starting ===');

  try {
    const base44 = createClientFromRequest(req);

    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      console.error('Authentication failed: No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Authenticated user: ${user.email}`);

    // Parse request body
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

    console.log(`Assessment loaded successfully: ${assessment.company_name}`);

    // Load the selected framework details
    let frameworkDetails = null;
    if (assessment.framework) {
      try {
        frameworkDetails = await base44.asServiceRole.entities.ComplianceFramework.get(assessment.framework);
        console.log(`Framework loaded: ${frameworkDetails.framework_type}`);
      } catch (err) {
        console.warn('Could not load framework details:', err);
      }
    }

    // --- Build comprehensive context for AI ---
    const aiContext = `
COMPANY PROFILE:
- Name: ${assessment.company_name}
- Website: ${assessment.company_website}
- Industry: ${assessment.industry_sector}
- Size: ${assessment.company_size}
- Description: ${assessment.company_description || 'Not provided'}

COMPLIANCE FRAMEWORK:
- Selected Framework: ${frameworkDetails?.framework_type || 'Not specified'}
- Framework Name: ${frameworkDetails?.name || 'N/A'}
${frameworkDetails?.framework_type === 'NIST_800_53A_REV5' ? `
- Note: NIST 800-53A Rev 5 (Updated 2024) - This is the latest assessment procedures publication from NIST
- Focus on assessment procedures for security and privacy controls
- Emphasize continuous monitoring and risk-based approaches
` : ''}
${frameworkDetails?.framework_type === 'NIST_800_53_REV5' ? `
- Note: NIST 800-53 Rev 5 - Focus on security and privacy control catalog
` : ''}
${frameworkDetails?.framework_type === 'NIST_CSF' ? `
- Note: NIST Cybersecurity Framework - Focus on Identify, Protect, Detect, Respond, Recover
` : ''}

STRATEGIC CONTEXT:
- Security Goals: ${assessment.security_compliance_goals || 'Not specified'}
- Previous Gap Analysis: ${assessment.previous_gap_analysis_details || 'None'}
- Current Top Risks: ${assessment.current_biggest_risks || 'Not specified'}
- Critical Systems: ${assessment.business_critical_systems || 'Not specified'}
- CISO Perspective: ${assessment.ciso_perspective || 'Not specified'}

EXTERNAL RECONNAISSANCE (if available):
${assessment.external_attack_surface ? `
- Attack Surface Data Available: Yes
- External Exposure Score: ${assessment.surface_exposure_score || 'N/A'}
` : '- No external scan data yet'}

OPERATIONAL SECURITY PRACTICES:
${assessment.ops_local_admin_privileges ? `- Local Admin Privileges: ${assessment.ops_local_admin_privileges}` : ''}
${assessment.ops_remote_access_method ? `- Remote Access: ${assessment.ops_remote_access_method}` : ''}
${assessment.ops_patch_management_cadence ? `- Patch Management: ${assessment.ops_patch_management_cadence}` : ''}
${assessment.ops_endpoint_edr_coverage ? `- EDR Coverage: ${assessment.ops_endpoint_edr_coverage}` : ''}
`;

    console.log('Calling LLM to generate AI-powered assessment draft...');

    // --- Call LLM to generate maturity scores ---
    const aiPrompt = `You are an expert cybersecurity consultant conducting a comprehensive security maturity assessment.

${aiContext}

**Your Task:**
Based on the company profile, selected compliance framework, strategic context, and any operational security data provided, generate realistic initial maturity scores (0-5) for the following security domains:

**Security Domains:**
1. **Identity & Access Management (IAM)** - SSO, MFA, RBAC, privileged access management, identity lifecycle
2. **Asset Management** - IT asset inventory, ownership, classification, hardware/software management
3. **Infrastructure Security** - Network security, endpoints, servers, firewalls, segmentation
4. **Application Security** - SDLC security, code scanning, dependency management, DevSecOps
5. **Third-Party Risk Management** - Vendor security assessments, supply chain security, contracts
6. **Incident Response** - IR plan, detection capabilities, DR testing, playbooks, RTO/RPO
7. **Governance & Risk Management** - Policies, risk assessments, executive oversight, metrics
8. **Data Protection** - Encryption, DLP, backup, retention, access controls, data classification
9. **Security Training & Awareness** - Employee training, phishing simulations, security culture
10. **Cloud Security** - Cloud IAM, misconfig detection, workload isolation, CSPM
11. **Business Continuity** - BCP/DR plans, crisis management, supply chain continuity

**Maturity Scale:**
- 0: Not Implemented / No capability
- 1: Initial / Ad-hoc (some awareness, no formal process)
- 2: Developing / Repeatable (documented processes, inconsistent implementation)
- 3: Defined / Managed (standardized processes, mostly consistent)
- 4: Managed / Measured (metrics tracked, continuous improvement)
- 5: Optimized / Leading (industry-leading, automated, predictive)

**Scoring Guidelines:**
- **Industry Context**: ${assessment.industry_sector} companies typically need higher scores in data protection and compliance
- **Company Size**: ${assessment.company_size} organizations generally have ${assessment.company_size.includes('Small') ? 'less mature' : assessment.company_size.includes('Medium') ? 'moderate' : 'more mature'} security programs
- **Framework Alignment**: Consider ${frameworkDetails?.framework_type || 'best practices'} requirements
${frameworkDetails?.framework_type === 'NIST_800_53A_REV5' ? `
- **NIST 800-53A Rev 5 Specific**: Focus on assessment rigor, evidence collection, continuous monitoring capabilities
- Emphasize assessment procedures and validation methods for each control family
- Consider the organization's ability to demonstrate and document control effectiveness
` : ''}
- **Operational Security**: Factor in the operational practices mentioned (patching, EDR, admin privileges, etc.)
- **Risk Profile**: Consider stated top risks and critical systems
- **Realism**: Most organizations score 2-3 on average; score 0-1 for immature areas, 4-5 only for exceptional capabilities

**Additional Guidance:**
- If external reconnaissance shows high exposure (score > 70), reduce Infrastructure and Cloud Security scores
- If compliance goals mention specific frameworks (SOC 2, ISO), give slightly higher scores in Governance
- If critical systems are mentioned but no robust controls, flag Incident Response as lower
- Consider industry regulations (Healthcare → HIPAA focus, Finance → SOX focus)

Provide your assessment as structured JSON with scores and brief rationales.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      add_context_from_internet: false, // Use provided company context only
      response_json_schema: {
        type: 'object',
        properties: {
          maturity_scores: {
            type: 'object',
            properties: {
              maturity_identity: { type: 'number', minimum: 0, maximum: 5 },
              maturity_asset_management: { type: 'number', minimum: 0, maximum: 5 },
              maturity_infra_security: { type: 'number', minimum: 0, maximum: 5 },
              maturity_app_security: { type: 'number', minimum: 0, maximum: 5 },
              maturity_third_party_risk: { type: 'number', minimum: 0, maximum: 5 },
              maturity_incident_response: { type: 'number', minimum: 0, maximum: 5 },
              maturity_governance_risk: { type: 'number', minimum: 0, maximum: 5 },
              maturity_data_protection: { type: 'number', minimum: 0, maximum: 5 },
              maturity_security_training: { type: 'number', minimum: 0, maximum: 5 },
              maturity_cloud_security: { type: 'number', minimum: 0, maximum: 5 },
              maturity_business_continuity: { type: 'number', minimum: 0, maximum: 5 }
            },
            required: [
              'maturity_identity',
              'maturity_asset_management',
              'maturity_infra_security',
              'maturity_app_security',
              'maturity_third_party_risk',
              'maturity_incident_response',
              'maturity_governance_risk',
              'maturity_data_protection',
              'maturity_security_training',
              'maturity_cloud_security',
              'maturity_business_continuity'
            ]
          },
          rationale: {
            type: 'string',
            description: 'Overall rationale for the scoring approach'
          },
          key_strengths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Top 3 areas of relative strength'
          },
          priority_improvements: {
            type: 'array',
            items: { type: 'string' },
            description: 'Top 5 priority areas for improvement'
          }
        },
        required: ['maturity_scores', 'rationale', 'key_strengths', 'priority_improvements']
      }
    });

    console.log('LLM Response received. Calculating overall metrics...');

    // --- Calculate overall score and maturity level ---
    const scores = llmResponse.maturity_scores;
    const scoreValues = Object.values(scores);
    const avgScore = scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length;
    const overallScore = Math.round((avgScore / 5) * 100);

    let maturityLevel = 'Beginner';
    if (overallScore >= 80) maturityLevel = 'Expert';
    else if (overallScore >= 60) maturityLevel = 'Advanced';
    else if (overallScore >= 40) maturityLevel = 'Intermediate';
    else if (overallScore >= 20) maturityLevel = 'Developing';

    // --- Generate initial smart analysis ---
    const smartAnalysis = `
## AI-Generated Assessment Summary

**Overall Maturity Level:** ${maturityLevel} (${overallScore}%)

### Scoring Rationale
${llmResponse.rationale}

### Key Strengths
${llmResponse.key_strengths.map((strength, idx) => `${idx + 1}. ${strength}`).join('\n')}

### Priority Improvements
${llmResponse.priority_improvements.map((improvement, idx) => `${idx + 1}. ${improvement}`).join('\n')}

### Next Steps
1. Review the AI-generated maturity scores in the assessment
2. Adjust scores based on your specific knowledge of controls
3. Complete the Operational Security questionnaire for more accurate scoring
4. Proceed to generate a comprehensive report with tailored recommendations

*This is an AI-generated draft assessment. Please review and refine the scores based on your organization's actual security posture.*
`;

    // --- Update assessment with AI-generated data ---
    const updatedAssessment = await base44.asServiceRole.entities.Assessment.update(assessmentId, {
      ...scores,
      overall_score: overallScore,
      maturity_level: maturityLevel,
      applicable_categories: 11,
      total_categories: 11,
      smart_analysis: smartAnalysis
    });

    console.log('=== generateAssessmentDraft: Complete ===');

    return Response.json({
      success: true,
      assessment: updatedAssessment,
      ai_insights: {
        overall_score: overallScore,
        maturity_level: maturityLevel,
        key_strengths: llmResponse.key_strengths,
        priority_improvements: llmResponse.priority_improvements,
        rationale: llmResponse.rationale
      },
      message: 'AI-powered assessment draft generated successfully'
    });

  } catch (error) {
    console.error('=== generateAssessmentDraft: ERROR ===');
    console.error('Error details:', error);
    const errorMessage = error.message || 'Failed to generate assessment draft';
    return Response.json({
      error: errorMessage,
      details: error.toString()
    }, { status: 500 });
  }
});