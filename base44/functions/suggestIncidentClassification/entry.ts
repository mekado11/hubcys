import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== suggestIncidentClassification: Starting ===');

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
    const { incidentId } = await req.json();

    if (!incidentId) {
      console.error('Missing incidentId in request');
      return Response.json({ error: 'incidentId is required' }, { status: 400 });
    }

    console.log(`Loading incident: ${incidentId}`);

    // Load the incident
    const incident = await base44.asServiceRole.entities.Incident.get(incidentId);

    if (!incident) {
      console.error(`Incident not found: ${incidentId}`);
      return Response.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Security check: ensure incident belongs to user's company
    if (incident.company_id !== user.company_id) {
      console.error(`Security violation: User ${user.email} tried to access incident from different company`);
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log(`Incident loaded successfully: ${incident.title}`);

    // --- Build context for classification ---
    const classificationContext = `
INCIDENT DETAILS:
Title: ${incident.title}
Description: ${incident.description || 'No description provided'}
Current Category: ${incident.category || 'Not set'}
Current Priority: ${incident.priority || 'Not set'}
Affected Systems: ${incident.affected_systems || 'Not specified'}
Affected Users: ${incident.affected_users || 'Not specified'}
Business Impact: ${incident.business_impact || 'Not assessed'}
Detection Source: ${incident.detection_source || 'Not specified'}
IOCs: ${incident.iocs_identified || 'None identified'}

ENRICHED THREAT INTELLIGENCE:
${incident.enriched_threat_intelligence || 'Not yet enriched'}

COMPANY RISK PROFILE:
Industry: ${user.company_industry || 'Not specified'}
Size: ${user.company_size || 'Not specified'}
Critical Systems: ${incident.affected_systems?.includes('critical') ? 'YES - Critical systems affected' : 'Unknown'}
`;

    console.log('Calling LLM for incident classification...');

    // --- Call LLM to suggest classification ---
    const aiPrompt = `You are an expert security operations center (SOC) analyst performing incident triage and classification.

${classificationContext}

**Your Task:**
Analyze this security incident and suggest:
1. **Priority Level** (Critical, High, Medium, Low) - Consider business impact, affected systems, threat severity, and company risk profile
2. **Incident Category** (Malware, Phishing, Data_Breach, Insider_Threat, DDoS, Unauthorized_Access, System_Compromise, Network_Intrusion, Physical_Security, Other)
3. **Clear Rationale** - Explain your reasoning in 2-3 sentences

**Priority Guidelines:**
- **Critical**: Active data breach, ransomware encryption in progress, critical system compromise, confirmed APT activity
- **High**: Confirmed malware on multiple systems, successful phishing with credential theft, unauthorized access to sensitive data
- **Medium**: Suspicious activity requiring investigation, isolated malware infection, failed attack attempts
- **Low**: Policy violations, unsuccessful attacks, low-impact security events

**Industry Considerations:**
- Healthcare/Finance: Data breaches and unauthorized access are typically HIGH or CRITICAL
- Manufacturing/Energy: Operational disruption and system compromise are typically HIGH or CRITICAL
- Technology: Intellectual property theft and supply chain attacks are typically HIGH or CRITICAL

**Current Threat Landscape:**
- Consider any critical CVEs or ongoing threat campaigns mentioned in enriched threat intel
- Prioritize incidents matching known active threats

Provide your classification as structured JSON.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      add_context_from_internet: false, // Use provided context only
      response_json_schema: {
        type: 'object',
        properties: {
          suggested_priority: {
            type: 'string',
            enum: ['Low', 'Medium', 'High', 'Critical'],
            description: 'Suggested priority level'
          },
          suggested_category: {
            type: 'string',
            enum: [
              'Malware',
              'Phishing',
              'Data_Breach',
              'Insider_Threat',
              'DDoS',
              'Unauthorized_Access',
              'System_Compromise',
              'Network_Intrusion',
              'Physical_Security',
              'Other'
            ],
            description: 'Suggested incident category'
          },
          rationale: {
            type: 'string',
            description: 'Clear explanation for the suggested classification'
          },
          confidence: {
            type: 'string',
            enum: ['Low', 'Medium', 'High'],
            description: 'Confidence level in this classification'
          }
        },
        required: ['suggested_priority', 'suggested_category', 'rationale', 'confidence']
      }
    });

    console.log('LLM Response received. Updating incident...');

    // --- Update incident with AI suggestions ---
    const updatedIncident = await base44.asServiceRole.entities.Incident.update(incidentId, {
      ai_suggested_priority: llmResponse.suggested_priority,
      ai_suggested_category: llmResponse.suggested_category,
      ai_classification_rationale: `${llmResponse.rationale}\n\nConfidence: ${llmResponse.confidence}`
    });

    console.log('=== suggestIncidentClassification: Complete ===');

    return Response.json({
      success: true,
      incident: updatedIncident,
      classification: llmResponse,
      message: 'Incident classification suggested successfully'
    });

  } catch (error) {
    console.error('=== suggestIncidentClassification: ERROR ===');
    console.error('Error details:', error);
    const errorMessage = error.message || 'Failed to suggest incident classification';
    return Response.json({
      error: errorMessage,
      details: error.toString()
    }, { status: 500 });
  }
});