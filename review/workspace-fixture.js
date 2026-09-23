// Synthetic, read-only visual review data. Never imported by the production entry.
export function workspaceFixture(role) {
  const exercise = {
    id: 'exercise-live', organization_id: 'org-a', schema_version: 1,
    created_at: '2026-09-23T08:00:00.000Z', created_by_uid: 'synthetic-facilitator',
    threat_id: 'cloud_compromise', scope_key: 'cloud-operations',
    scenario_version_id: 'synthetic-cloud-v1', context_version_id: 'synthetic-context-v1',
    scoring_policy_version: 'readiness-v1', state: 'running', purpose: 'baseline', record_version: 6,
  };
  const injects = [
    { id: 'cloud-session', title: 'Suspicious cloud session', artifact_type: 'cloud_log',
      content: 'SIMULATED EXERCISE\nA new administrative session appears from an unfamiliar network. Audit records show access to the production storage inventory.\n\nWhat would you validate, preserve and contain before changing the account?' },
    { id: 'cloud-credential', title: 'New privileged credential', artifact_type: 'identity_event',
      content: 'SIMULATED EXERCISE\nA new access credential was created during the suspicious session. The application owner warns that revoking all credentials may interrupt order processing.\n\nRecord your containment decision, the business trade-off and the next owner.' },
    { id: 'cloud-impact', title: 'Business owner impact request', artifact_type: 'team_message',
      content: 'SIMULATED EXERCISE\nOperations requests a factual impact update. Separate confirmed effects from unknowns and identify the next update owner.' },
  ].map(row => ({ ...row, simulation: true }));
  const releases = injects.slice(0, 2).map((row, index) => ({
    id: `release-${index + 1}`, inject_definition_id: row.id, sequence: index + 1,
    exercise_id: exercise.id, organization_id: 'org-a',
    released_at: index === 0 ? '2026-09-23T08:05:00.000Z' : '2026-09-23T08:12:00.000Z',
    artifact: { title: row.title, content: row.content, artifact_type: row.artifact_type, simulation: true },
  }));
  const responses = [
    { id: 'synthetic-response-1', actor_uid: 'synthetic-responder', inject_release_id: 'release-1',
      received_at: '2026-09-23T08:07:00.000Z', content: 'Audit records exported. Requested validation of the session with the account owner before revoking access.' },
    { id: 'synthetic-response-2', actor_uid: 'synthetic-operations', inject_release_id: 'release-2',
      received_at: '2026-09-23T08:14:00.000Z', content: 'Operations is checking the service dependency before credential rotation. The incident lead owns the containment decision.' },
  ];
  const facilitator = role === 'facilitator';
  return {
    exercise, principal_uid: facilitator ? 'synthetic-facilitator' : 'synthetic-responder',
    assignment: { roles: [role] }, can_facilitate: facilitator, can_respond: !facilitator,
    can_evaluate: false, can_review: facilitator,
    available_injects: facilitator ? injects : [], releases,
    responses: facilitator ? responses : responses.filter(row => row.actor_uid === 'synthetic-responder'),
    possibly_truncated: false,
  };
}
