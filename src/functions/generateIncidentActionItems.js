/**
 * generateIncidentActionItems — AI-generated action items for an incident.
 *
 * Creates ActionItem Firestore documents based on AI analysis of the incident.
 *
 * @param {object} params
 * @param {string} params.incidentId  Firestore document ID of the incident
 * @returns {{ count: number }} on success or {{ error: string }} on failure
 */
import { Incident } from '@/entities/Incident';
import { ActionItem } from '@/entities/ActionItem';
import { User } from '@/entities/User';
import { InvokeLLM } from '@/integrations/Core';

export const generateIncidentActionItems = async ({ incidentId }) => {
  if (!incidentId) return { error: 'incidentId is required' };

  let incident, currentUser;
  try {
    [incident, currentUser] = await Promise.all([
      Incident.get(incidentId),
      User.me(),
    ]);
  } catch (e) {
    return { error: `Failed to fetch data: ${e.message}` };
  }

  if (!incident) return { error: 'Incident not found' };

  const prompt = `You are an incident response coordinator. Generate prioritised action items for this incident.

INCIDENT:
Title: ${incident.title || 'Untitled'}
Description: ${incident.description || 'No description'}
Category: ${incident.category || 'Unknown'}
Priority: ${incident.priority || 'Medium'}
Status: ${incident.status || 'Detected'}
Affected Systems: ${incident.affected_systems || 'Unknown'}

Generate 5-8 specific, actionable tasks. Return JSON:
{
  "action_items": [
    {
      "title": "Short task title",
      "description": "Detailed description of what needs to be done",
      "priority": "Critical|High|Medium|Low",
      "category": "Containment|Investigation|Eradication|Recovery|Communication|Documentation",
      "estimated_hours": 2,
      "due_days": 1
    }
  ]
}

Order by priority (Critical first). Due dates should be realistic (Critical: 1 day, High: 2 days, Medium: 5 days, Low: 14 days).`;

  let result;
  try {
    result = await InvokeLLM({
      prompt,
      feature: 'incident_playbook',
      response_json_schema: { type: 'object' },
    });
  } catch (e) {
    return { error: `AI generation failed: ${e.message}` };
  }

  const items = Array.isArray(result?.action_items) ? result.action_items : [];
  if (items.length === 0) return { error: 'No action items generated' };

  const now = new Date();
  let created = 0;

  for (const item of items) {
    try {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + (item.due_days || 7));

      await ActionItem.create({
        company_id:       currentUser?.company_id,
        incident_id:      incidentId,
        title:            item.title || 'Untitled action',
        description:      item.description || '',
        priority:         item.priority || 'Medium',
        category:         item.category || 'Investigation',
        status:           'Open',
        due_date:         dueDate.toISOString().split('T')[0],
        estimated_hours:  item.estimated_hours || 1,
        source:           'AI Generated',
      });
      created++;
    } catch (e) {
      console.error('[generateIncidentActionItems] Failed to create action item:', e.message);
    }
  }

  return { count: created };
};
