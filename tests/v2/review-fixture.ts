import { createHash } from "node:crypto";
import { scoringFixture, base, NOW } from "./fixtures.js";
import {
  canonicalJson,
  calculateExerciseScore,
} from "../../server/v2/scoring.js";
export function reviewFixture() {
  const fixture = scoringFixture();
  fixture.exercise.scope_key = "production-environment";
  fixture.scenario.capability_ids.push("escalation");
  fixture.expected_actions[3]!.capability_id = "escalation";
  fixture.criteria[3]!.capability_id = "escalation";
  fixture.observations[3]!.capability_id = "escalation";
  const requirements = [
    "Capture the endpoint evidence before destructive remediation.",
    "Acquire forensic evidence before reimaging the endpoint.",
    "Preserve the minimum investigation record with a documented chain of custody.",
    "Escalate the incident to the response lead within 15 minutes.",
  ];
  const content = [
    "We captured the EDR investigation package and recorded the endpoint identifier.",
    "We reimaged the affected endpoint to restore service. The disk image was not acquired before reimaging.",
    "The investigation package was preserved. The transfer record does not identify the receiving custodian.",
    "The response lead was notified 15 minutes after the inject was released.",
  ];
  fixture.expected_actions.forEach((row, i) => {
    row.requirement = requirements[i]!;
  });
  const responses = fixture.evidence.map((item, i) => ({
    ...base(item.source_record_id),
    exercise_id: fixture.exercise.id,
    inject_release_id: "inject-1",
    actor_uid: `responder-${i + 1}`,
    received_at: NOW,
    content: content[i]!,
    receipt_id: `receipt-${i + 1}`,
  }));
  fixture.evidence.forEach((item, i) => {
    item.content_sha256 = createHash("sha256")
      .update(canonicalJson(responses[i]))
      .digest("hex");
  });
  fixture.observations.forEach((row, i) => {
    row.rationale = [
      "The captured response records completion of the evidence package.",
      "Destructive remediation preceded forensic acquisition.",
      "Evidence handling was only partially documented.",
      "The recorded escalation met the 15-minute deadline.",
    ][i]!;
  });
  const findings = [
    {
      ...base("FND-014"),
      exercise_id: fixture.exercise.id,
      threat_id: fixture.exercise.threat_id,
      capability_id: "evidence_preservation" as const,
      scope_key: fixture.exercise.scope_key,
      observation_ids: ["observation-2"],
      severity: "high" as const,
      state: "awaiting_verification" as const,
    },
  ];
  const actions = [
    {
      ...base("ACT-021"),
      finding_ids: ["FND-014"],
      owner_uid: "soc-manager",
      state: "ready_for_verification" as const,
      completion_evidence_ids: [],
      due_at: "2026-10-12T16:00:00.000Z",
      verification_requirements:
        "Demonstrate evidence acquisition before endpoint reimaging in a targeted retest.",
      verification_method: "targeted_retest" as const,
      record_version: 1,
    },
  ];
  return {
    ...fixture,
    responses,
    findings,
    actions,
    sources: fixture.evidence.map((evidence, i) => ({
      evidence,
      integrity: "verified",
      response: responses[i],
    })),
    score: calculateExerciseScore(fixture),
    calculated_at: NOW,
    calculation_kind: "current_evidence_view",
    integrity_score: calculateExerciseScore({
      ...fixture,
      evidence: fixture.evidence.map((row, i) =>
        i === 1 ? { ...row, status: "unavailable" } : row,
      ),
    }),
    limitations: [
      "Synthetic interface review data. Not a historical score run.",
    ],
  };
}
