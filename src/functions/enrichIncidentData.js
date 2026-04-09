/**
 * enrichIncidentData — enriches an incident with AI-generated threat intelligence context.
 *
 * Fetches the incident, generates threat intel enrichment via AI, and writes
 * key enrichment fields back to the incident document.
 *
 * @param {object} params
 * @param {string} params.incidentId  Firestore document ID of the incident
 * @returns {{}} on success or {{ error: string }} on failure
 */
import { Incident } from '@/entities/Incident';
import { InvokeLLM } from '@/integrations/Core';

export const enrichIncidentData = async ({ incidentId }) => {
  if (!incidentId) return { error: 'incidentId is required' };

  let incident;
  try {
    incident = await Incident.get(incidentId);
  } catch (e) {
    return { error: `Failed to fetch incident: ${e.message}` };
  }

  if (!incident) return { error: 'Incident not found' };

  const prompt = `You are a threat intelligence analyst. Enrich the following cybersecurity incident with threat intelligence context.

INCIDENT:
Title: ${incident.title || 'Untitled'}
Description: ${incident.description || 'No description'}
Category: ${incident.category || 'Unknown'}
Affected Systems: ${incident.affected_systems || 'Unknown'}
IOCs Identified: ${incident.iocs_identified || 'None listed'}
Threat Actor Type: ${incident.threat_actor_type || 'Unknown'}

Return a JSON object:
{
  "threat_actor_profile": "Brief profile of likely threat actor type based on TTPs",
  "attack_vector": "Most likely initial access vector",
  "likely_motivation": "Financial/Espionage/Hacktivism/Ransomware/Insider Threat/etc",
  "mitre_tactics": ["Initial Access", "Execution", "Persistence"],
  "mitre_techniques": ["T1566.001 - Spearphishing", "T1059.001 - PowerShell"],
  "threat_level": "critical|high|medium|low",
  "enrichment_notes": "2-3 sentence threat intelligence context",
  "similar_campaigns": "Known campaigns or APT groups with similar TTPs (if any)",
  "recommended_threat_hunts": ["Hunt query 1", "Hunt query 2"]
}`;

  let enrichment;
  try {
    enrichment = await InvokeLLM({
      prompt,
      feature: 'incident_playbook',
      response_json_schema: { type: 'object' },
    });
  } catch (e) {
    return { error: `AI enrichment failed: ${e.message}` };
  }

  // Write enrichment fields to incident
  try {
    const updates = {
      threat_intelligence_enrichment: enrichment,
      enriched_at: new Date().toISOString(),
    };

    if (enrichment.threat_actor_type && !incident.threat_actor_type) {
      updates.threat_actor_type = enrichment.likely_motivation || incident.threat_actor_type;
    }

    await Incident.update(incidentId, updates);
  } catch (e) {
    return { error: `Failed to save enrichment: ${e.message}` };
  }

  return {};
};
