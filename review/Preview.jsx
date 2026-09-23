import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Link, Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import ReadinessApp from "../src/v2/ReadinessApp";
import { WorkspaceError } from "../src/v2/api-client";
import fixture from "./fixture.json";
import { workspaceFixture } from "./workspace-fixture";

function Preview() {
  const [mode, setMode] = useState("populated");
  const navigate = useNavigate();
  const location = useLocation();
  function selectMode(next) {
    setMode(next);
    if (['facilitator', 'participant'].includes(next)) navigate('/app/exercises/exercise-live?org=org-a');
    else if (location.pathname === '/app/exercises/exercise-live') navigate('/app/overview');
  }
  const client = useMemo(() => {
    async function respond(data, signal) {
      if (mode === "loading")
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 4000);
          signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(timeout);
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        });
      if (mode === "unavailable")
        throw new WorkspaceError(
          503,
          "Synthetic unavailable-service state. No customer connection is used.",
        );
      return structuredClone(data);
    }
    const organizations = [
      {
        id: "org-a",
        name: "Northstar Response Lab",
        roles: [mode === 'participant' ? 'participant' : "readiness_lead"],
      },
      {
        id: "org-empty",
        name: "Empty organization (synthetic)",
        roles: ["readiness_lead"],
      },
    ];
    return {
      setup: (org, signal) => respond({
        principal_uid: "review-facilitator",
        context_description: "Synthetic review environment: identity services, endpoints and business-critical operations.",
        members: [{ uid: "synthetic-responder", roles: ["participant"] }],
      }, signal),
      workspace: (org, id, signal) => org === 'org-a' && id === 'exercise-live' && ['facilitator', 'participant'].includes(mode)
        ? respond(workspaceFixture(mode), signal)
        : Promise.reject(new WorkspaceError(409, "This preview has no live-workspace snapshot for this exercise. Use Live exercise preview to inspect the read-only example. No production writes are available.")),
      command: () => Promise.reject(new WorkspaceError(403, "This interface preview is read-only.")),
      context: (signal) =>
        respond(
          { organizations: mode === "unassigned" ? [] : organizations },
          signal,
        ),
      index: (org, signal) =>
        respond(
          {
            organization: organizations.find((row) => row.id === org),
            exercises:
              mode === "empty" || org === "org-empty"
                ? []
                : ['facilitator', 'participant'].includes(mode) ? [{ ...workspaceFixture(mode).exercise, can_review: false }]
                : [
                    { ...fixture.exercise, can_review: true },
                    {
                      ...fixture.exercise,
                      id: "exercise-2",
                      threat_id: "cloud_compromise",
                      scope_key: "Cloud operations",
                      state: "running",
                      can_review: false,
                    },
                    {
                      ...fixture.exercise,
                      id: "exercise-3",
                      threat_id: "business_email_compromise",
                      scope_key: "Finance & identity",
                      state: "draft",
                      can_review: false,
                    },
                  ],
            scope: "latest_50_exercises",
            truncated: false,
            readiness: { status: "not_measured", score: null },
          },
          signal,
        ),
      evidence: (org, id, signal) => {
        if (mode === "restricted")
          return Promise.reject(
            new WorkspaceError(
              403,
              "Synthetic access-denied state. Reviewer permission is required.",
            ),
          );
        if (org !== "org-a" || id !== fixture.exercise.id)
          return Promise.reject(
            new WorkspaceError(
              409,
              "No synthetic evidence chain exists for this selection.",
            ),
          );
        const data = structuredClone(fixture);
        if (mode === "integrity") {
          data.sources[1].integrity = "digest_mismatch";
          data.sources[1].response = null;
          data.score = data.integrity_score;
        }
        return respond(data, signal);
      },
    };
  }, [mode]);
  return (
    <>
      <div
        className="review-controls"
        style={{
          background: "#142236",
          color: "#eef5f4",
          padding: "8px 16px",
          font: "14px sans-serif",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label htmlFor="review-state">Interface review state</label>
        <select
          id="review-state"
          value={mode}
          onChange={(event) => selectMode(event.target.value)}
          style={{
            padding: 8,
            color: "#142a2c",
            background: "#fff",
            maxWidth: "100%",
          }}
        >
          {[
            ["populated", "Populated evidence"],
            ["empty", "Empty exercise list"],
            ["unassigned", "No organization assigned"],
            ["restricted", "Evidence access denied"],
            ["unavailable", "Service unavailable"],
            ["loading", "Delayed loading"],
            ["integrity", "Unverified source"],
            ["facilitator", "Live exercise: facilitator"],
            ["participant", "Live exercise: participant"],
          ].map(([value, text]) => (
            <option value={value} key={value}>
              {text}
            </option>
          ))}
        </select>
        <Link style={{ color: '#eef5f4', textDecoration: 'underline', minHeight: 44, display: 'inline-flex', alignItems: 'center' }} to="/app/exercises/exercise-live?org=org-a" onClick={() => setMode('facilitator')}>Live exercise preview</Link>
      </div>
      <Routes>
        <Route path="/" element={<Navigate replace to="/app/overview" />} />
        <Route
          path="/app/*"
          element={
            <ReadinessApp
              key={mode}
              client={client}
              userLabel={mode === 'participant' ? 'Review participant' : "Review facilitator"}
              preview
            />
          }
        />
        <Route
          path="*"
          element={
            <div className="v2-app v2-gate">
              <h1>Preserved legacy destination</h1>
              <p>
                This isolated preview does not contain legacy workflows. Their
                routes remain in the production application.
              </p>
              <Link className="v2-text-link" to="/app/overview">
                Return to the V2 preview
              </Link>
            </div>
          }
        />
      </Routes>
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <HashRouter>
    <Preview />
  </HashRouter>,
);
