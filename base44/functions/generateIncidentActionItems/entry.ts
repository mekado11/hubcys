import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== generateIncidentActionItems: Starting ===');

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

    // --- Build context for action item generation ---
    const actionItemContext = `
INCIDENT DETAILS:
Title: ${incident.title}
Category: ${incident.category || incident.ai_suggested_category || 'Unknown'}
Priority: ${incident.priority || incident.ai_suggested_priority || 'Medium'}
Description: ${incident.description || 'No description provided'}
Affected Systems: ${incident.affected_systems || 'Not specified'}
Root Cause: ${incident.root_cause || 'Under investigation'}
Control Gaps Identified: ${incident.control_gaps_identified || 'Not yet identified'}

ENRICHED DATA:
${incident.enriched_threat_intelligence ? 'Threat Intelligence Available: Yes' : 'Threat Intelligence: Not enriched'}
${incident.ai_suggested_remediation || ''}

LESSONS LEARNED:
${incident.lessons_learned || 'Not yet documented'}
`;

    console.log('Calling LLM to generate action items...');

    // --- Call LLM to generate action items ---
    const aiPrompt = `You are an expert incident response manager. Based on the following security incident, generate 3-5 specific, actionable remediation tasks.

${actionItemContext}

**Your Task:**
Generate action items that address:
1. Immediate containment/remediation steps (if not already done)
2. Root cause elimination
3. Control improvements to prevent recurrence
4. Documentation and policy updates
5. Training or awareness needs

**Action Item Guidelines:**
- Be specific and actionable (not vague like "improve security")
- Include clear success criteria
- Assign appropriate priority and timeframe
- Consider the incident's actual impact and complexity
- For LOW/MEDIUM incidents: 2-3 action items
- For HIGH/CRITICAL incidents: 4-5 action items

**Timeframe Categories:**
- 30_day: Critical fixes, immediate containment improvements
- 60_day: Control enhancements, process improvements
- 90_day: Strategic improvements, training programs

Output as a JSON array of action items.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          action_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical']
                },
                category: {
                  type: 'string',
                  enum: ['30_day', '60_day', '90_day']
                },
                responsible_team: { type: 'string' }
              },
              required: ['title', 'description', 'priority', 'category']
            }
          }
        },
        required: ['action_items']
      }
    });

    console.log(`Generated ${llmResponse.action_items.length} action items. Creating in database...`);

    // --- Create action items in the database ---
    const actionItemsToCreate = llmResponse.action_items.map(item => ({
      company_id: user.company_id,
      incident_id: incidentId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      category: item.category,
      status: 'not_started',
      responsible_team: item.responsible_team || 'Security Team',
      assigned_to: incident.assigned_to || user.email
    }));

    const createdActionItems = await base44.asServiceRole.entities.ActionItem.bulkCreate(
      actionItemsToCreate
    );

    console.log(`Successfully created ${createdActionItems.length} action items`);

    // --- Update incident to note that action items were generated ---
    await base44.asServiceRole.entities.Incident.update(incidentId, {
      action_items_generated: `${createdActionItems.length} AI-generated action items created on ${new Date().toISOString()}`
    });

    console.log('=== generateIncidentActionItems: Complete ===');

    return Response.json({
      success: true,
      action_items: createdActionItems,
      count: createdActionItems.length,
      message: `Successfully generated ${createdActionItems.length} action items`
    });

  } catch (error) {
    console.error('=== generateIncidentActionItems: ERROR ===');
    console.error('Error details:', error);
    const errorMessage = error.message || 'Failed to generate incident action items';
    return Response.json({
      error: errorMessage,
      details: error.toString()
    }, { status: 500 });
  }
});