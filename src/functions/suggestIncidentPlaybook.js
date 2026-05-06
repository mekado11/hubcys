/**
 * suggestIncidentPlaybook — AI-generated incident response playbook and remediation steps.
 *
 * @param {object} params
 * @param {string} params.incidentId  Firestore document ID of the incident
 * @returns {{}} on success or {{ error: string }} on failure
 */
import { Incident } from '@/entities/Incident';
import { InvokeLLM } from '@/integrations/Core';

export const suggestIncidentPlaybook = async ({ incidentId }) => {
  if (!incidentId) return { error: 'incidentId is required' };

  let incident;
  try {
    incident = await Incident.get(incidentId);
  } catch (e) {
    return { error: `Failed to fetch incident: ${e.message}` };
  }

  if (!incident) return { error: 'Incident not found' };

  const prompt = `You are an incident response expert. Generate a comprehensive response playbook for this incident.

INCIDENT:
Title: ${incident.title || 'Untitled'}
Description: ${incident.description || 'No description'}
Category: ${incident.category || 'Unknown'}
Priority: ${incident.priority || 'Medium'}
Status: ${incident.status || 'Detected'}
Affected Systems: ${incident.affected_systems || 'Unknown'}
Affected Users: ${incident.affected_users || 'Unknown'}
Detection Source: ${incident.detection_source || 'Unknown'}
IOCs: ${incident.iocs_identified || 'None identified'}

Write a detailed incident response playbook in Markdown format:

## Immediate Actions (0-1 hour)
Step-by-step containment and initial response actions.

## Investigation Steps
How to investigate the full scope and root cause.

## Containment Strategy
Specific containment actions for this incident type.

## Eradication & Recovery
Steps to remove the threat and restore normal operations.

## Evidence Collection
What evidence to collect and how to preserve it.

## Stakeholder Communication
Who to notify and communication templates.

## Lessons Learned
Key questions to address in the post-incident review.

Be specific, actionable, and tailored to the incident category.`;

  let playbook;
  try {
    playbook = await InvokeLLM({
      prompt,
      feature: 'incident_playbook',
    });
  } catch (e) {
    return { error: `AI playbook generation failed: ${e.message}` };
  }

  const playbookText = typeof playbook === 'string' ? playbook : JSON.stringify(playbook);

  try {
    await Incident.update(incidentId, {
      ai_playbook: playbookText,
      playbook_generated_at: new Date().toISOString(),
    });
  } catch (e) {
    return { error: `Failed to save playbook: ${e.message}` };
  }

  return {};
};
