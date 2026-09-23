import { ScenarioVersion, ExpectedAction, Criterion } from '../../shared/v2/contracts.js';
import { ContextVersion, InjectDefinition } from '../../shared/v2/commands.js';

/** Authored exercise objectives, not a claim of legal/policy compliance or actual attacks. */
export function ransomwareTemplate(org: string, uid: string, key: string, now: string, description: string) {
  const base = (id: string) => ({ id, organization_id: org, schema_version: 1 as const, created_at: now, created_by_uid: uid });
  const scenarioId = `scenario-${key}`;
  const definitions = [
    { id: 'triage', capability: 'triage', requirement: 'Identify the affected account and endpoint, and record the initial incident classification.', title: 'Suspicious sign-in and script execution', type: 'siem_alert', content: 'SIMULATED EXERCISE\n01:38 UTC: An unusual sign-in is followed by script execution on a workstation. The account has access to shared business files. What do you investigate, record and escalate?' },
    { id: 'preserve', capability: 'evidence_preservation', requirement: 'Preserve forensic evidence before reimaging or other destructive remediation.', title: 'Encryption activity detected', type: 'edr_alert', content: 'SIMULATED EXERCISE\n01:51 UTC: The workstation is rapidly modifying shared files. Operations asks to reimage it immediately. Record your containment decision and how evidence will be preserved.' },
    { id: 'communicate', capability: 'executive_communication', requirement: 'Communicate known impact, uncertainty, response ownership and the next update to leadership.', title: 'Executive status request', type: 'email', content: 'SIMULATED EXERCISE\n02:02 UTC: Leadership asks whether critical services and customer data are affected. Draft a factual update that distinguishes confirmed facts from unknowns and names the next decision owner.' },
  ] as const;
  const scenario = ScenarioVersion.parse({
    ...base(scenarioId), scenario_id: 'ransomware-response', version: 1, state: 'published',
    threat_id: 'ransomware', capability_ids: definitions.map(row => row.capability),
    expected_action_ids: definitions.map(row => `expected-${row.id}`),
    criterion_ids: definitions.map(row => `criterion-${row.id}`), scoring_policy_version: 'readiness-v1',
  });
  const expected_actions = definitions.map(row => ExpectedAction.parse({
    ...base(`expected-${row.id}`), scenario_version_id: scenarioId, capability_id: row.capability,
    requirement: row.requirement, policy_version_id: null,
  }));
  const criteria = definitions.map(row => Criterion.parse({
    ...base(`criterion-${row.id}`), scenario_version_id: scenarioId, expected_action_id: `expected-${row.id}`,
    capability_id: row.capability, weight: 1, required: true, evidence_required: true, kind: 'completion',
  }));
  const injects = definitions.map(row => InjectDefinition.parse({
    ...base(`inject-${row.id}`), scenario_version_id: scenarioId, title: row.title,
    artifact_type: row.type, content: row.content, simulation: true,
  }));
  const context = ContextVersion.parse({ ...base(`context-${key}`), status: 'published', description });
  return { scenario, context, expected_actions, criteria, injects };
}
