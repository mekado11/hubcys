import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileCheck2 } from "lucide-react";
import {
  Badge,
  PageHeader,
  Empty,
  Failure,
  Loading,
  useResource,
  date,
  label,
} from "./ui";

function measurement(value) {
  if (!value) return "No accepted observation";
  if (value.kind === "completion")
    return value.completed
      ? "Action completed"
      : value.omission_observed
        ? "Omission observed"
        : "Completion unknown";
  if (value.kind === "deadline")
    return `${(value.elapsed_ms / 60000).toFixed(1)} minutes elapsed`;
  if (value.kind === "sequence")
    return value.followed
      ? "Required sequence followed"
      : "Required sequence not followed";
  if (value.kind === "quality") return label(value.rating);
  return value.reason;
}
function SourceRecord({ source }) {
  return (
    <article className="v2-source">
      <div className="v2-between">
        <h3>
          <FileCheck2 size={17} aria-hidden="true" />
          {label(source.evidence.source_kind)}
        </h3>
        <Badge tone={source.integrity === "verified" ? "good" : "warning"}>
          {source.integrity === "verified"
            ? "Digest verified"
            : label(source.integrity)}
        </Badge>
      </div>
      <p className="v2-id">{source.evidence.id}</p>
      {source.response ? (
        <>
          <blockquote>{source.response.content}</blockquote>
          <dl className="v2-facts">
            <div>
              <dt>Recorded actor</dt>
              <dd>{source.response.actor_uid}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{date(source.response.received_at)}</dd>
            </div>
            <div>
              <dt>Inject reference</dt>
              <dd className="v2-id">{source.response.inject_release_id}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="v2-muted">
          The original source could not be verified by this view. It does not
          contribute to this calculation.
        </p>
      )}
      <details>
        <summary>Integrity and provenance</summary>
        <dl className="v2-facts">
          <div>
            <dt>Evidence state</dt>
            <dd>{label(source.evidence.status)}</dd>
          </div>
          <div>
            <dt>Source record</dt>
            <dd className="v2-id">{source.evidence.source_record_id}</dd>
          </div>
          <div>
            <dt>SHA-256</dt>
            <dd className="v2-id">{source.evidence.content_sha256}</dd>
          </div>
        </dl>
      </details>
    </article>
  );
}
export default function EvidenceView({ client, organizationId }) {
  const { exerciseId } = useParams();
  const [params, setParams] = useSearchParams();
  const resource = useResource(
    `evidence:${organizationId}:${exerciseId}`,
    (signal) => client.evidence(organizationId, exerciseId, signal),
  );
  const [expanded, setExpanded] = useState(null);
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <Failure error={resource.error} retry={resource.refresh} />;
  const data = resource.data;
  const capabilities = data.scenario.capability_ids;
  const selected = capabilities.includes(params.get("capability"))
    ? params.get("capability")
    : capabilities[0];
  const capability = data.score?.capabilities.find(
    (item) => item.capability_id === selected,
  );
  const inputs =
    data.score?.inputs.filter(
      (item) => item.criterion.capability_id === selected,
    ) ?? [];
  const expectations = data.expected_actions.filter(
    (item) => item.capability_id === selected,
  );
  const sourceMap = new Map(
    data.sources.map((item) => [item.evidence.id, item]),
  );
  const findingList = data.findings.filter(
    (item) => item.capability_id === selected,
  );
  return (
    <>
      <Link
        className="v2-text-link"
        to={`/app/readiness?org=${encodeURIComponent(organizationId)}`}
      >
        <ArrowLeft size={16} />
        Readiness profiles
      </Link>
      <PageHeader
        eyebrow="Exercise evidence"
        title={label(data.exercise.threat_id)}
        description={`${data.exercise.scope_key} · ${label(data.exercise.state)} · Created ${date(data.exercise.created_at)}`}
      >
        <Badge>Read-only evidence view</Badge>
      </PageHeader>
      <div className="v2-trace" aria-label="Evidence chain">
        <span>Threat</span>
        <ArrowRight />
        <span>Exercise</span>
        <ArrowRight />
        <span>Capability</span>
        <ArrowRight />
        <span>Observation</span>
        <ArrowRight />
        <span>Evidence</span>
        <ArrowRight />
        <span>Finding</span>
      </div>
      <div className="v2-evidence-grid">
        <aside className="v2-capabilities">
          <h2>Tested capabilities</h2>
          <nav aria-label="Capabilities">
            {capabilities.map((id) => {
              const result = data.score?.capabilities.find(
                (item) => item.capability_id === id,
              );
              return (
                <button
                  key={id}
                  aria-current={selected === id ? "true" : undefined}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set("capability", id);
                    setParams(next);
                    setExpanded(null);
                  }}
                >
                  <span>{label(id)}</span>
                  <strong>{result?.score ?? "Not scored"}</strong>
                </button>
              );
            })}
          </nav>
          <p className="v2-muted">
            Exercise performance, not an organization-wide readiness score.
          </p>
        </aside>
        <div className="v2-evidence-body">
          <section className="v2-panel">
            <div className="v2-between">
              <div>
                <p className="v2-eyebrow">Capability result</p>
                <h2>{label(selected)}</h2>
              </div>
              <div className="v2-score">
                <strong>{capability?.score ?? "—"}</strong>
                <span>
                  {capability?.score != null ? "out of 100" : "Not scored"}
                </span>
              </div>
            </div>
            <p className="v2-muted">
              {capability?.status === "scored"
                ? "Every required criterion has eligible evidence. Select an observation to inspect its source."
                : "A complete score is withheld until all required criteria have eligible evidence."}
            </p>
            {capability && (
              <div className="v2-inline">
                <Badge>
                  {Math.round(capability.coverage_percent)}% evidence coverage
                </Badge>
                <span className="v2-muted">
                  {capability.earned_weight} earned /{" "}
                  {capability.planned_weight} planned weight
                </span>
              </div>
            )}
            <details>
              <summary>How this result is calculated</summary>
              <p>
                Required criterion weights determine the result. Completion,
                timing and sequence are pass/fail; anchored decision quality may
                receive half credit. Missing or unverified evidence withholds a
                complete score.
              </p>
              <p>
                Calculation: earned weight ÷ evaluated weight × 100, rounded. A
                complete score requires evaluated weight to equal planned
                weight.
              </p>
              <dl className="v2-facts">
                <div>
                  <dt>Policy</dt>
                  <dd>{data.exercise.scoring_policy_version}</dd>
                </div>
                <div>
                  <dt>Calculated</dt>
                  <dd>{date(data.calculated_at)}</dd>
                </div>
                <div>
                  <dt>Input digest</dt>
                  <dd className="v2-id">
                    {data.score?.input_sha256 ||
                      "No calculation while exercise is in progress"}
                  </dd>
                </div>
              </dl>
              <p className="v2-muted">
                This is a current-evidence calculation, not a persisted
                historical score or improvement trend.
              </p>
            </details>
          </section>
          <section className="v2-panel">
            <div className="v2-between">
              <h2>Expected vs. observed</h2>
              <Badge>{inputs.length} criteria</Badge>
            </div>
            {!inputs.length && (
              <Empty title="Review is not scored yet">
                <p>
                  The published expectations below are available to assigned
                  reviewers. Accepted observations will be evaluated when the
                  exercise reaches review.
                </p>
                {expectations.map((row) => (
                  <p key={row.id}>{row.requirement}</p>
                ))}
              </Empty>
            )}
            {inputs.map((input) => {
              const expected = expectations.find(
                (row) => row.id === input.criterion.expected_action_id,
              );
              const outcome = !input.included
                ? "Not scored"
                : input.points === 1
                  ? "Pass"
                  : input.points === 0
                    ? "Fail"
                    : "Partial";
              const open = expanded === input.criterion.id;
              return (
                <article className="v2-observation" key={input.criterion.id}>
                  <button
                    className="v2-observation-toggle"
                    aria-expanded={open}
                    aria-controls={`detail-${input.criterion.id}`}
                    onClick={() =>
                      setExpanded(open ? null : input.criterion.id)
                    }
                  >
                    <span>
                      <span className="v2-eyebrow">Expected action</span>
                      <strong>{expected?.requirement}</strong>
                    </span>
                    <Badge
                      tone={
                        outcome === "Pass"
                          ? "good"
                          : outcome === "Fail"
                            ? "bad"
                            : "warning"
                      }
                    >
                      {outcome}
                    </Badge>
                  </button>
                  <div className="v2-observed">
                    <span>Observed</span>
                    <p>{measurement(input.observation?.measurement)}</p>
                    <span className="v2-muted">
                      Weight {input.criterion.weight} ·{" "}
                      {input.included
                        ? `${input.points * input.criterion.weight} earned`
                        : label(input.reason)}
                    </span>
                  </div>
                  {open && (
                    <div
                      id={`detail-${input.criterion.id}`}
                      className="v2-observation-detail"
                    >
                      <p>
                        {input.observation?.rationale ||
                          "No accepted evaluator observation is available."}
                      </p>
                      {input.criterion.kind === "deadline" && (
                        <p>
                          Expected response within{" "}
                          {input.criterion.max_elapsed_ms / 60000} minutes.
                        </p>
                      )}
                      {input.criterion.kind === "quality" && (
                        <dl className="v2-facts">
                          {Object.entries(input.criterion.anchors).map(
                            ([key, value]) => (
                              <div key={key}>
                                <dt>{label(key)} anchor</dt>
                                <dd>{value}</dd>
                              </div>
                            ),
                          )}
                        </dl>
                      )}
                      {input.observation && (
                        <p className="v2-muted">
                          Accepted by {input.observation.accepted_by_uid} ·{" "}
                          {date(input.observation.accepted_at)}
                        </p>
                      )}
                      {(input.observation?.evidence_ids ?? []).map((id) =>
                        sourceMap.has(id) ? (
                          <SourceRecord key={id} source={sourceMap.get(id)} />
                        ) : (
                          <p key={id}>Evidence unavailable: {id}</p>
                        ),
                      )}
                      <p className="v2-caution">
                        A participant statement records a decision or claim. It
                        does not prove technical execution.
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
          <section className="v2-panel">
            <h2>Linked findings & corrective work</h2>
            {!findingList.length ? (
              <p className="v2-muted">
                No finding records are linked to this capability. A failed
                criterion does not automatically create a finding.
              </p>
            ) : (
              findingList.map((finding) => (
                <article className="v2-finding" key={finding.id}>
                  <div className="v2-between">
                    <h3>{finding.id}</h3>
                    <Badge tone="warning">{label(finding.severity)}</Badge>
                  </div>
                  <p>{label(finding.state)}</p>
                  {data.actions
                    .filter((action) => action.finding_ids.includes(finding.id))
                    .map((action) => (
                      <dl className="v2-facts" key={action.id}>
                        <div>
                          <dt>Corrective action</dt>
                          <dd>{action.id}</dd>
                        </div>
                        <div>
                          <dt>Owner</dt>
                          <dd>{action.owner_uid || "Unassigned"}</dd>
                        </div>
                        <div>
                          <dt>Recorded state</dt>
                          <dd>{label(action.state)}</dd>
                        </div>
                        <div>
                          <dt>Verification required</dt>
                          <dd>{action.verification_requirements}</dd>
                        </div>
                        <div>
                          <dt>Due</dt>
                          <dd>{date(action.due_at)}</dd>
                        </div>
                      </dl>
                    ))}
                </article>
              ))
            )}
            <p className="v2-caution">
              Completion is not verification. Recorded action state does not
              independently establish a successful retest in this view.
            </p>
          </section>
          <details className="v2-panel">
            <summary>Evidence register ({data.sources.length})</summary>
            {data.sources.map((source) => (
              <SourceRecord key={source.evidence.id} source={source} />
            ))}
          </details>
        </div>
      </div>
    </>
  );
}
