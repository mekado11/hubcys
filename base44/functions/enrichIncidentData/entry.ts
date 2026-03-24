import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== enrichIncidentData: Starting ===');

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

    // --- Extract relevant data from incident ---
    const extractedIOCs = incident.iocs_identified || '';
    const affectedSystems = incident.affected_systems || '';
    const incidentDescription = incident.description || '';
    const incidentCategory = incident.category || 'Unknown';

    // --- Build context for AI enrichment ---
    const enrichmentContext = `
INCIDENT DETAILS:
Title: ${incident.title}
Category: ${incidentCategory}
Priority: ${incident.priority || 'Not set'}
Description: ${incidentDescription}
Affected Systems: ${affectedSystems}
IOCs Identified: ${extractedIOCs || 'None yet'}
Detection Source: ${incident.detection_source || 'Not specified'}
Detection Time: ${incident.detection_timestamp ? new Date(incident.detection_timestamp).toISOString() : 'Not recorded'}

COMPANY CONTEXT:
Industry: ${user.company_industry || 'Not specified'}
Size: ${user.company_size || 'Not specified'}
`;

    console.log('Calling LLM for threat intelligence enrichment...');

    // --- Call LLM to synthesize threat intelligence ---
    const aiPrompt = `You are an expert cybersecurity threat analyst. Analyze the following security incident and provide comprehensive threat intelligence enrichment.

${enrichmentContext}

**Your Task:**
1. Identify relevant threat campaigns, APT groups, or known attack patterns that match this incident profile
2. Highlight any recent CISA advisories, CVEs, or threat bulletins related to the incident category and IOCs
3. Assess potential threat actor motivations and TTPs (Tactics, Techniques, Procedures)
4. Identify additional IOCs or signatures that incident responders should look for
5. Provide vulnerability context - what weaknesses are commonly exploited in similar incidents
6. Note any industry-specific threats relevant to ${user.company_industry || 'this organization'}

**Guidelines:**
- Focus on actionable, recent threat intelligence (last 6-12 months)
- Cite specific CVEs, advisory IDs, or threat group names where applicable
- Be concrete and specific, avoid generic security advice
- If IOCs are present, provide additional context on those specific indicators
- Highlight any critical or time-sensitive threats

Provide your analysis as structured JSON.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      add_context_from_internet: true, // Enable internet search for recent threat intel
      response_json_schema: {
        type: 'object',
        properties: {
          threat_campaigns: {
            type: 'string',
            description: 'Recent threat campaigns or APT activity matching this incident'
          },
          relevant_advisories: {
            type: 'string',
            description: 'CISA KEV, CVEs, or security bulletins related to this incident'
          },
          threat_actor_profile: {
            type: 'string',
            description: 'Likely threat actor type, motivations, and TTPs'
          },
          additional_iocs: {
            type: 'string',
            description: 'Additional IOCs or signatures to hunt for'
          },
          vulnerability_context: {
            type: 'string',
            description: 'Common vulnerabilities exploited in similar incidents'
          },
          industry_specific_threats: {
            type: 'string',
            description: 'Industry-specific threats and considerations'
          },
          recommended_actions: {
            type: 'string',
            description: 'Immediate recommended actions based on threat intel'
          }
        },
        required: [
          'threat_campaigns',
          'relevant_advisories',
          'threat_actor_profile',
          'additional_iocs',
          'vulnerability_context',
          'industry_specific_threats',
          'recommended_actions'
        ]
      }
    });

    console.log('LLM Response received. Synthesizing enrichment data...');

    // --- Synthesize into readable format ---
    const enrichedThreatIntelligence = `
## Threat Intelligence Enrichment

### Recent Threat Campaigns
${llmResponse.threat_campaigns}

### Relevant Security Advisories
${llmResponse.relevant_advisories}

### Threat Actor Profile
${llmResponse.threat_actor_profile}

### Additional IOCs to Hunt
${llmResponse.additional_iocs}

### Vulnerability Context
${llmResponse.vulnerability_context}

### Industry-Specific Threats
${llmResponse.industry_specific_threats}

### Recommended Actions
${llmResponse.recommended_actions}
`;

    // --- Update incident with enriched data ---
    const updatedIncident = await base44.asServiceRole.entities.Incident.update(incidentId, {
      enriched_threat_intelligence: enrichedThreatIntelligence,
      ai_enrichment_timestamp: new Date().toISOString()
    });

    console.log('=== enrichIncidentData: Complete ===');

    return Response.json({
      success: true,
      incident: updatedIncident,
      enrichment: llmResponse,
      message: 'Incident data enriched successfully with threat intelligence'
    });

  } catch (error) {
    console.error('=== enrichIncidentData: ERROR ===');
    console.error('Error details:', error);
    const errorMessage = error.message || 'Failed to enrich incident data';
    return Response.json({
      error: errorMessage,
      details: error.toString()
    }, { status: 500 });
  }
});