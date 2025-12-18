import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== suggestIncidentPlaybook: Starting ===');

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

    // --- Build context for playbook suggestion ---
    const playbookContext = `
INCIDENT DETAILS:
Title: ${incident.title}
Category: ${incident.category || incident.ai_suggested_category || 'Unknown'}
Priority: ${incident.priority || incident.ai_suggested_priority || 'Medium'}
Description: ${incident.description || 'No description provided'}
Status: ${incident.status}
Affected Systems: ${incident.affected_systems || 'Not specified'}
Affected Users: ${incident.affected_users || 'Not specified'}
IOCs: ${incident.iocs_identified || 'None identified'}

THREAT CONTEXT:
${incident.enriched_threat_intelligence || 'Not enriched'}

CLASSIFICATION RATIONALE:
${incident.ai_classification_rationale || 'Not yet classified'}
`;

    console.log('Calling LLM to suggest playbooks and remediation...');

    // --- Call LLM to suggest playbooks and remediation steps ---
    const aiPrompt = `You are an expert incident response consultant. Based on the following security incident, suggest relevant response playbooks and provide immediate tactical remediation steps.

${playbookContext}

**Your Task:**

1. **Suggest 2-3 Relevant Playbooks:**
   - Identify the most applicable incident response playbook types
   - Common playbooks: Malware Response, Phishing Response, Ransomware Response, Data Breach Response, Insider Threat Response, DDoS Mitigation, Unauthorized Access Response, etc.

2. **Provide Immediate Remediation Steps:**
   - Create a step-by-step tactical checklist for the current incident phase
   - Focus on actionable, technical steps specific to this incident type
   - Format as a markdown checklist
   - Include both immediate actions and short-term remediation

**Remediation Checklist Guidelines:**
- Start with the current incident status: ${incident.status}
- For "Detected" status: Focus on triage, initial containment, evidence collection
- For "Contained" status: Focus on eradication and root cause analysis
- For "Eradicated" status: Focus on recovery and verification
- Be specific to the incident category and affected systems
- Include forensic preservation steps where relevant
- Note any compliance requirements (e.g., breach notification deadlines)

Output as structured JSON.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          suggested_playbooks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                relevance: { type: 'string' }
              },
              required: ['name', 'description', 'relevance']
            },
            description: 'Array of 2-3 relevant playbook recommendations'
          },
          remediation_steps: {
            type: 'string',
            description: 'Markdown-formatted checklist of immediate remediation steps'
          },
          phase_specific_guidance: {
            type: 'string',
            description: 'Additional guidance specific to the current incident phase'
          }
        },
        required: ['suggested_playbooks', 'remediation_steps', 'phase_specific_guidance']
      }
    });

    console.log('LLM Response received. Formatting playbook suggestions...');

    // --- Format the playbook suggestions ---
    const playbooksList = llmResponse.suggested_playbooks.map(pb => pb.name);
    const playbooksJSON = JSON.stringify(llmResponse.suggested_playbooks);

    const remediationMarkdown = `
## Suggested Incident Response Playbooks

${llmResponse.suggested_playbooks.map(pb => `
### ${pb.name}
**Description:** ${pb.description}

**Relevance:** ${pb.relevance}
`).join('\n')}

---

## Immediate Remediation Steps

${llmResponse.remediation_steps}

---

## Phase-Specific Guidance (Current: ${incident.status})

${llmResponse.phase_specific_guidance}
`;

    // --- Update incident with playbook suggestions ---
    const updatedIncident = await base44.asServiceRole.entities.Incident.update(incidentId, {
      ai_suggested_playbooks: playbooksJSON,
      ai_suggested_remediation: remediationMarkdown
    });

    console.log('=== suggestIncidentPlaybook: Complete ===');

    return Response.json({
      success: true,
      incident: updatedIncident,
      playbooks: llmResponse.suggested_playbooks,
      remediation_markdown: remediationMarkdown,
      message: 'Playbooks and remediation steps suggested successfully'
    });

  } catch (error) {
    console.error('=== suggestIncidentPlaybook: ERROR ===');
    console.error('Error details:', error);
    const errorMessage = error.message || 'Failed to suggest incident playbooks';
    return Response.json({
      error: errorMessage,
      details: error.toString()
    }, { status: 500 });
  }
});