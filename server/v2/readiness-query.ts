import { createHash } from "node:crypto";
import type {
  Firestore,
  Transaction,
  DocumentReference,
} from "firebase-admin/firestore";
import { z } from "zod";
import {
  Id,
  Exercise,
  ExerciseParticipant,
  ScenarioVersion,
  ExpectedAction,
  Criterion,
  Observation,
  Evidence,
  Response,
  Finding,
  RemediationAction,
  assertTenant,
} from "../../shared/v2/contracts.js";
import { loadAuthority, CommandError } from "./command-service.js";
import { authorizeCommand, AuthorizationError } from "./authorization.js";
import {
  calculateExerciseScore,
  canonicalJson,
  validateScenarioManifest,
} from "./scoring.js";

async function record<T extends { id: string; organization_id: string }>(
  tx: Transaction,
  ref: DocumentReference,
  schema: z.ZodType<T>,
  org: string,
): Promise<T> {
  const snap = await tx.get(ref);
  if (!snap.exists) throw new CommandError(409, "EVIDENCE_CHAIN_INCOMPLETE");
  const data = schema.parse(snap.data());
  assertTenant(org, [data]);
  if (data.id !== ref.id) throw new CommandError(409, "RECORD_ID_MISMATCH");
  return data;
}

/** Discovery candidates never confer authority. Every returned organization is revalidated. */
export async function getReadinessContext(db: Firestore, uid: string) {
  Id.parse(uid);
  return db.runTransaction(async (tx) => {
    const members = await tx.get(
      db.collectionGroup("memberships").where("uid", "==", uid).limit(101),
    );
    const grants = await tx.get(
      db
        .collectionGroup("provider_grants")
        .where("subject_uid", "==", uid)
        .limit(101),
    );
    if (members.size > 100 || grants.size > 100)
      throw new CommandError(409, "ACCESS_DIRECTORY_LIMIT");
    const ids = new Set(
      [...members.docs, ...grants.docs].flatMap((doc) => {
        const path = doc.ref.path.split("/");
        return path.length === 4 &&
          path[0] === "organizations" &&
          path[3] === uid
          ? [path[1]!]
          : [];
      }),
    );
    const organizations = [];
    for (const id of ids) {
      try {
        const authority = await loadAuthority(tx, db, id, uid);
        const { membership, organization } = authority;
        if (organization.status !== "active" || membership.status !== "active")
          continue;
        if ("provider_grant" in authority) {
          const grant = authority.provider_grant;
          if (
            grant.status !== "active" ||
            Date.parse(grant.expires_at) <= Date.now() ||
            !grant.permissions.includes("exercise:read")
          )
            continue;
        }
        organizations.push({
          id,
          name: organization.name,
          roles: membership.roles,
        });
      } catch (error) {
        if (!(error instanceof AuthorizationError)) throw error;
      }
    }
    return {
      organizations: organizations.sort((a, b) => a.name.localeCompare(b.name)),
    };
  });
}

async function exerciseAccess(
  tx: Transaction,
  db: Firestore,
  uid: string,
  org: string,
  exercise: z.infer<typeof Exercise>,
) {
  const authority = await loadAuthority(tx, db, org, uid);
  const snap = await tx.get(
    db.doc(`organizations/${org}/exercises/${exercise.id}/participants/${uid}`),
  );
  const assignment = snap.exists
    ? ExerciseParticipant.parse(snap.data())
    : undefined;
  return {
    principal_uid: uid,
    organization_id: org,
    organization_status: authority.organization.status,
    membership: authority.membership,
    exercise_id: exercise.id,
    now: new Date().toISOString(),
    ...(assignment ? { exercise_participant: assignment } : {}),
    ...("provider_grant" in authority
      ? { provider_grant: authority.provider_grant }
      : {}),
  };
}

export async function getReadinessIndex(
  db: Firestore,
  uid: string,
  org: string,
) {
  [uid, org].forEach((value) => Id.parse(value));
  return db.runTransaction(async (tx) => {
    const authority = await loadAuthority(tx, db, org, uid);
    if (
      authority.organization.status !== "active" ||
      authority.membership.status !== "active"
    )
      throw new AuthorizationError();
    if ("provider_grant" in authority) {
      const grant = authority.provider_grant;
      if (
        grant.status !== "active" ||
        Date.parse(grant.expires_at) <= Date.now() ||
        !grant.permissions.includes("exercise:read")
      )
        throw new AuthorizationError();
    }
    let canManageOrganization = false;
    try {
      authorizeCommand({
        principal_uid: uid,
        organization_id: org,
        organization_status: authority.organization.status,
        permission: "organization:manage",
        now: new Date().toISOString(),
        membership: authority.membership,
        ...("provider_grant" in authority
          ? { provider_grant: authority.provider_grant }
          : {}),
      });
      canManageOrganization = true;
    } catch (error) {
      if (!(error instanceof AuthorizationError)) throw error;
    }
    const snapshots = await tx.get(
      db
        .collection(`organizations/${org}/exercises`)
        .orderBy("created_at", "desc")
        .limit(51),
    );
    const exercises = [];
    for (const snap of snapshots.docs.slice(0, 50)) {
      const exercise = Exercise.parse(snap.data());
      assertTenant(org, [exercise]);
      if (exercise.id !== snap.id)
        throw new CommandError(409, "RECORD_ID_MISMATCH");
      const access = await exerciseAccess(tx, db, uid, org, exercise);
      try {
        authorizeCommand({ ...access, permission: "exercise:read" });
      } catch (error) {
        if (error instanceof AuthorizationError) continue;
        throw error;
      }
      let can_review = false;
      try {
        authorizeCommand({ ...access, permission: "exercise:review" });
        can_review = true;
      } catch (error) {
        if (!(error instanceof AuthorizationError)) throw error;
      }
      exercises.push({ ...exercise, can_review });
    }
    return {
      organization: {
        id: org,
        name: authority.organization.name,
        roles: authority.membership.roles,
        can_manage_organization: canManageOrganization,
      },
      exercises,
      scope: "latest_50_exercises",
      truncated: snapshots.size > 50,
      readiness: { status: "not_measured", score: null },
    };
  });
}

/** Read-only, point-in-time explanation. This is NOT a persisted historical score run. */
export async function getEvidenceDrilldown(
  db: Firestore,
  uid: string,
  org: string,
  exerciseId: string,
) {
  [uid, org, exerciseId].forEach((value) => Id.parse(value));
  return db.runTransaction(async (tx) => {
    const authority = await loadAuthority(tx, db, org, uid);
    if (
      authority.organization.status !== "active" ||
      authority.membership.status !== "active"
    )
      throw new AuthorizationError();
    const root = db.doc(`organizations/${org}`);
    const exerciseRef = root.collection("exercises").doc(exerciseId);
    const exercise = await record(tx, exerciseRef, Exercise, org);
    const access = await exerciseAccess(tx, db, uid, org, exercise);
    authorizeCommand({ ...access, permission: "exercise:review" });
    const scenarioRef = root
      .collection("scenario_versions")
      .doc(exercise.scenario_version_id);
    const scenario = await record(tx, scenarioRef, ScenarioVersion, org);
    if (scenario.threat_id !== exercise.threat_id)
      throw new CommandError(409, "SCENARIO_MISMATCH");
    const expected_actions = [];
    const criteria = [];
    for (const id of scenario.expected_action_ids)
      expected_actions.push(
        await record(
          tx,
          scenarioRef.collection("expected_actions").doc(id),
          ExpectedAction,
          org,
        ),
      );
    for (const id of scenario.criterion_ids)
      criteria.push(
        await record(
          tx,
          scenarioRef.collection("criteria").doc(id),
          Criterion,
          org,
        ),
      );
    validateScenarioManifest(scenario, expected_actions, criteria);
    const observationRows = await tx.get(
      root
        .collection("observations")
        .where("exercise_id", "==", exerciseId)
        .limit(501),
    );
    const evidenceRows = await tx.get(
      root
        .collection("evidence")
        .where("exercise_id", "==", exerciseId)
        .limit(501),
    );
    const findingRows = await tx.get(
      root
        .collection("findings")
        .where("exercise_id", "==", exerciseId)
        .limit(101),
    );
    if (
      observationRows.size > 500 ||
      evidenceRows.size > 500 ||
      findingRows.size > 100
    )
      throw new CommandError(409, "EVIDENCE_VIEW_LIMIT");
    const observations = observationRows.docs
      .map((snap) => Observation.parse(snap.data()))
      .filter((row) => row.status === "accepted");
    const evidence = evidenceRows.docs.map((snap) =>
      Evidence.parse(snap.data()),
    );
    const findings = findingRows.docs.map((snap) => Finding.parse(snap.data()));
    assertTenant(org, [...observations, ...evidence, ...findings]);
    for (const [rows, schema] of [
      [observationRows, Observation],
      [evidenceRows, Evidence],
      [findingRows, Finding],
    ] as const) {
      for (const snap of rows.docs)
        if (schema.parse(snap.data()).id !== snap.id)
          throw new CommandError(409, "RECORD_ID_MISMATCH");
    }
    const sources = [];
    const scoreEvidence = [];
    for (const item of evidence) {
      let response: z.infer<typeof Response> | null = null;
      let integrity = "source_not_resolved";
      if (item.source_kind === "participant_response") {
        const snap = await tx.get(
          exerciseRef.collection("responses").doc(item.source_record_id),
        );
        if (snap.exists) {
          const parsed = Response.parse(snap.data());
          assertTenant(org, [parsed]);
          if (parsed.id !== snap.id || parsed.exercise_id !== exerciseId)
            throw new CommandError(409, "SOURCE_SCOPE_MISMATCH");
          const digest = createHash("sha256")
            .update(canonicalJson(parsed))
            .digest("hex");
          integrity =
            digest === item.content_sha256 ? "verified" : "digest_mismatch";
          if (integrity === "verified") response = parsed;
        } else integrity = "source_missing";
      }
      sources.push({ evidence: item, integrity, response });
      scoreEvidence.push(
        integrity === "verified"
          ? item
          : { ...item, status: "unavailable" as const },
      );
    }
    const observedIds = new Set(observations.map((row) => row.id));
    for (const finding of findings) {
      if (
        finding.threat_id !== exercise.threat_id ||
        finding.scope_key !== exercise.scope_key ||
        finding.observation_ids.some(
          (id) =>
            !observedIds.has(id) ||
            observations.find((row) => row.id === id)?.capability_id !==
              finding.capability_id,
        )
      )
        throw new CommandError(409, "FINDING_CHAIN_INCOMPLETE");
    }
    const actions = new Map<string, z.infer<typeof RemediationAction>>();
    for (let i = 0; i < findings.length; i += 30) {
      const rows = await tx.get(
        root
          .collection("actions")
          .where(
            "finding_ids",
            "array-contains-any",
            findings.slice(i, i + 30).map((row) => row.id),
          )
          .limit(101),
      );
      if (rows.size > 100) throw new CommandError(409, "EVIDENCE_VIEW_LIMIT");
      for (const snap of rows.docs) {
        const action = RemediationAction.parse(snap.data());
        assertTenant(org, [action]);
        if (action.id !== snap.id)
          throw new CommandError(409, "RECORD_ID_MISMATCH");
        actions.set(action.id, action);
      }
    }
    const score = ["review", "completed"].includes(exercise.state)
      ? calculateExerciseScore({
          exercise,
          scenario,
          expected_actions,
          criteria,
          observations,
          evidence: scoreEvidence,
        })
      : null;
    const result = {
      exercise,
      scenario,
      expected_actions,
      observations,
      sources,
      findings,
      actions: [...actions.values()],
      score,
      calculated_at: new Date().toISOString(),
      calculation_kind: "current_evidence_view",
      limitations: [
        "Not a persisted historical score run.",
        "Participant statements do not prove technical execution.",
        "Only source-verified participant response records are currently resolved by this view.",
        "Recorded action status is not independently verified by this view.",
      ],
    };
    if (Buffer.byteLength(JSON.stringify(result), "utf8") > 2_000_000)
      throw new CommandError(409, "EVIDENCE_VIEW_LIMIT");
    return result;
  });
}
