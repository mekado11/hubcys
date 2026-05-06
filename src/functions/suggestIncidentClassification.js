/**
 * suggestIncidentClassification — AI classification of an incident's category,
 * severity, and NIS2 significance.
 *
 * @param {object} params
 * @param {string} params.incidentId  Firestore document ID of the incident
 * @returns {{}} on success or {{ error: string }} on failure
 */
import { Incident } from '@/entities/Incident';
import { InvokeLLM } from '@/integrations/Core';

export const suggestIncidentClassification = async ({ incidentId }) => {
  if (!incidentId) return { error: 'incidentId is required' };

  let incident;
  try {
    incident = await Incident.get(incidentId);
  } catch (e) {
    return { error: `Failed to fetch incident: ${e.message}` };
  }

  if (!incident) return { error: 'Incident not found' };

  const prompt = `You are a cybersecurity incident classifier. Classify the following incident.

INCIDENT:
Title: ${incident.title || 'Untitled'}
Description: ${incident.description || 'No description'}
Affected Systems: ${incident.affected_systems || 'Unknown'}
Affected Users: ${incident.affected_users || 'Unknown'}
Detection Source: ${incident.detection_source || 'Unknown'}

Return ONLY a JSON object:
{
  "category": "Malware|Ransomware|Phishing|DDoS|Data Breach|Insider Threat|Credential Theft|Supply Chain|Vulnerability Exploitation|Unauthorised Access|Other",
  "priority": "Critical|High|Medium|Low",
  "nis2_significance": "Significant|Not Significant|Unclear",
  "nis2_reasoning": "Brief explanation of NIS2 significance assessment (1-2 sentences)",
  "threat_actor_type": "Cybercriminal|Nation State|Insider|Hacktivist|Script Kiddie|Unknown",
  "classification_confidence": "High|Medium|Low",
  "classification_notes": "Brief notes on classification rationale"
}

NIS2 Significance criteria:
- Significant if: affects >500 users, impacts critical services, involves personal data breach >1000 records,
  or has cross-border impact, or involves essential/important entity per NIS2 Annex I/II.`;

  let classification;
  try {
    classification = await InvokeLLM({
      prompt,
      feature: 'incident_playbook',
      response_json_schema: { type: 'object' },
    });
  } catch (e) {
    return { error: `AI classification failed: ${e.message}` };
  }

  // Apply classification to incident
  const updates = {};
  if (classification.category)         updates.category          = classification.category;
  if (classification.priority)         updates.priority          = classification.priority;
  if (classification.nis2_significance) updates.nis2_significance = classification.nis2_significance;
  if (classification.threat_actor_type) updates.threat_actor_type = classification.threat_actor_type;
  updates.ai_classification = classification;
  updates.classified_at = new Date().toISOString();

  try {
    await Incident.update(incidentId, updates);
  } catch (e) {
    return { error: `Failed to save classification: ${e.message}` };
  }

  return {};
};
