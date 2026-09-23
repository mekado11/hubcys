import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  Radio,
  ListChecks,
  Radar,
  FileText,
  Building2,
  Users,
  Settings,
  SlidersHorizontal,
  ArrowRight,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  Search,
} from "lucide-react";
import EvidenceView from "./EvidenceView";
import ReadinessOverview from "./ReadinessOverview";
import RemediationView from "./RemediationView";
import { CreateExercise, ExerciseWorkspace } from './ExerciseWorkflow';
import {
  Badge,
  PageHeader,
  Empty,
  Failure,
  Loading,
  LegacyLink,
  useResource,
  threats,
  label,
  date,
} from "./ui";
import "./readiness.css";

const primary = [
  ["overview", "Overview", LayoutDashboard],
  ["readiness", "Readiness", ShieldCheck],
  ["exercises", "Exercises", Radio],
  ["remediation", "Remediation", ListChecks],
  ["threats", "Threats", Radar],
  ["reporting", "Reporting", FileText],
];
const secondary = [
  ["organization", "Organization", Building2],
  ["team", "Team", Users],
  ["settings", "Settings", Settings],
  ["administration", "Administration", SlidersHorizontal],
];
const notes = {
  overview: [
    "Organization readiness",
    "An evidence-led view of response capability and the work that still needs verification.",
  ],
  readiness: [
    "Readiness profiles",
    "Start with a threat, then inspect the exercises and evidence behind your response capability.",
  ],
  exercises: [
    "Exercises",
    "Inspect recorded exercises and their evidence. Results stay separate from organization-wide readiness.",
  ],
  remediation: [
    "Remediation",
    "Corrective work must be completed, verified and, where required, tested again.",
  ],
  threats: [
    "Threats",
    "Prioritize intelligence that changes what your organization should test.",
  ],
  reporting: [
    "Reporting",
    "Executive, operational and audit conclusions must trace back to recorded evidence.",
  ],
};
function Brand({ org, onNavigate }) {
  return (
    <Link
      className="v2-brand"
      onClick={onNavigate}
      to={`/app/overview${org ? `?org=${encodeURIComponent(org)}` : ""}`}
      aria-label="HubCyS overview"
    >
      <svg
        viewBox="0 0 32 36"
        width="29"
        height="33"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 2 29 7v11c0 7-7 12-13 16C10 30 3 25 3 18V7L16 2Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M10 12v12m12-12v12M10 18h12"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span>
        HubCyS<small>READINESS WORKSPACE</small>
      </span>
    </Link>
  );
}
function ExerciseRows({
  exercises,
  org,
  workspaceLinks = false,
  emptyTitle = "No exercises in this view",
}) {
  const [search, setSearch] = useState("");
  const rows = exercises.filter((row) =>
    `${label(row.threat_id)} ${row.scope_key} ${row.state}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <label className="v2-search">
        <Search size={17} aria-hidden="true" />
        <span className="v2-sr">Filter exercises</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by threat, scope or state"
        />
      </label>
      {!rows.length ? (
        <Empty title={search ? "No matching exercises" : emptyTitle}>
          <p>
            {search
              ? "Try a different threat, scope or state."
              : "Once an authorized V2 exercise is recorded, its scope, state and evidence entry point appear here. Existing records have not been imported automatically."}
          </p>
        </Empty>
      ) : (
        <div className="v2-exercise-list">
          <div className="v2-list-head">
            <span>Exercise / scope</span>
            <span>State</span>
            <span>Created</span>
            <span>Review</span>
          </div>
          {rows.map((row) => (
            <article key={row.id} className="v2-exercise-row">
              <div>
                <strong>{label(row.threat_id)}</strong>
                <span className="v2-muted">{row.scope_key}</span>
              </div>
              <Badge>{label(row.state)}</Badge>
              <time className="v2-muted">{date(row.created_at)}</time>
              <div className="v2-row-actions">
              {workspaceLinks && <Link className="v2-text-link" to={`/app/exercises/${encodeURIComponent(row.id)}?org=${encodeURIComponent(org)}`}>Open workspace <ArrowRight size={16} /></Link>}
              {row.can_review ? (
                <Link
                  className="v2-text-link"
                  to={`/app/readiness/${encodeURIComponent(row.id)}?org=${encodeURIComponent(org)}`}
                >
                  View evidence
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <span className="v2-muted">Reviewer access required</span>
              )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function Profiles({ data, org }) {
  const [selected, setSelected] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const orderedThreats = [...threats].sort((a, b) =>
    Number(data.exercises.some(row => row.threat_id === b)) - Number(data.exercises.some(row => row.threat_id === a)),
  );
  const selectedRows = data.exercises.filter(
    (row) => selected === "all" || row.threat_id === selected,
  );
  return (
    <>
      <div className="v2-profile-index" aria-label="Threat coverage in this view">
        {(expanded ? orderedThreats : orderedThreats.slice(0, 3)).map(threat => {
          const count = data.exercises.filter(row => row.threat_id === threat).length;
          return <button key={threat} aria-pressed={selected === threat} onClick={() => setSelected(selected === threat ? "all" : threat)}>
            <ShieldCheck size={18} aria-hidden="true" /><span>{label(threat)}<small>{count ? `${count} exercise${count === 1 ? "" : "s"} in view` : "No exercises in view"}</small></span><ArrowRight size={15} />
          </button>;
        })}
      </div>
      <button className="v2-text-link v2-profile-expand" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? "Show fewer profiles" : "Show all threat profiles"} <ArrowRight size={15} /></button>
      <div className="v2-toolbar">
        <label>
          Threat profile
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="all">All threats</option>
            {threats.map((threat) => (
              <option key={threat} value={threat}>
                {label(threat)}
              </option>
            ))}
          </select>
        </label>
        <p className="v2-muted">
          No organization score or trend inferred from exercise counts.
        </p>
      </div>
      <section className="v2-panel">
        <div className="v2-section-heading">
          <h2>
            {selected === "all" ? "Evidence by exercise" : label(selected)}
          </h2>
          <Badge>Organization readiness: not measured</Badge>
        </div>
        <ExerciseRows exercises={selectedRows} org={org} />
      </section>
    </>
  );
}
function SupportingSection({ section, data, org }) {
  if (section === "threats")
    return (
      <>
        <section className="v2-panel">
          <h2>Readiness recommendations are not connected yet</h2>
          <p className="v2-muted">
            This view will connect relevant threat changes to the capabilities
            your organization should test. No generic news feed or unverified
            recommendation is substituted.
          </p>
          <Link
            className="v2-button"
            to={`/app/readiness?org=${encodeURIComponent(org)}`}
          >
            Review threat profiles
            <ArrowRight size={16} />
          </Link>
        </section>
        <section className="v2-panel">
          <h2>Preserved intelligence workflows</h2>
          <p className="v2-muted">
            Existing incident enrichment and threat context remain in the
            command center. Their outputs do not become readiness evidence
            automatically.
          </p>
          <LegacyLink to="ResponseReadiness">
            Open existing command center
          </LegacyLink>
        </section>
      </>
    );
  if (section === "reporting")
    return (
      <section className="v2-panel">
        <h2>Readiness report classes</h2>
        <p className="v2-muted">
          V2 report generation is not connected in this release. Existing
          reports remain separate from evidence-backed V2 reports.
        </p>
        <div className="v2-report-list">
          {[
            [
              "Executive readiness",
              "Major exposures, business impact and verified improvement.",
            ],
            [
              "Exercise after-action",
              "Timeline, decisions, observations and corrective work.",
            ],
            [
              "Operational readiness",
              "Capability-level performance and evidence sufficiency.",
            ],
            [
              "Audit / evidence",
              "What was tested, what happened and what was verified.",
            ],
          ].map(([name, description]) => (
            <article key={name}>
              <FileText size={20} aria-hidden="true" />
              <div>
                <h3>{name}</h3>
                <p className="v2-muted">{description}</p>
              </div>
              <Badge>Not connected</Badge>
            </article>
          ))}
        </div>
        <LegacyLink to="Reports">Open existing reports</LegacyLink>
      </section>
    );
  if (section === "organization")
    return (
      <>
        <section className="v2-panel">
          <h2>{data.organization.name}</h2>
          <dl className="v2-facts">
            <div>
              <dt>Organization ID</dt>
              <dd className="v2-id">{org}</dd>
            </div>
            <div>
              <dt>Your server-managed roles</dt>
              <dd>{data.organization.roles.map(label).join(", ")}</dd>
            </div>
            <div>
              <dt>Authority</dt>
              <dd>Verified membership or explicit provider grant</dd>
            </div>
          </dl>
          <p className="v2-muted">
            Organization context editing and membership provisioning remain
            controlled operations. Your existing company record has not been
            automatically converted.
          </p>
          <LegacyLink to="CompanyManagement">
            Existing company management
          </LegacyLink>
        </section>
      </>
    );
  if (section === "team")
    return (
      <section className="v2-panel">
        <h2>Exercise roles and organization access</h2>
        <p className="v2-muted">
          V2 access comes from server-managed membership and exercise
          assignments. Existing team records are preserved but do not grant V2
          access by themselves.
        </p>
        <LegacyLink to="TeamManagement">Existing team management</LegacyLink>
      </section>
    );
  if (section === "administration")
    return (
      <section className="v2-panel">
        <h2>Controlled administration</h2>
        <p className="v2-muted">
          V2 authority cannot be edited from legacy user profiles. Provisioning
          and migration require a reviewed server operation.
        </p>
        {data.organization.can_manage_organization && (
          <LegacyLink to="UserManagement">Existing user management</LegacyLink>
        )}
      </section>
    );
  return (
    <section className="v2-panel">
      <h2>Workspace preferences & supporting utilities</h2>
      <p className="v2-muted">
        Use the appearance control in the header to change this session's theme.
        Existing utilities remain available outside the six core sections.
      </p>
      <div className="v2-utility-links">
        {[
          ["BIA", "Business impact analysis"],
          ["PolicyLibrary", "Policy library"],
          ["IOCAnalyzer", "IOC analyzer"],
          ["PCIScopingGuide", "PCI scoping"],
          ["EtsiAssessmentsList", "ETSI assessments"],
        ].map(([to, text]) => (
          <LegacyLink key={to} to={to}>
            {text}
          </LegacyLink>
        ))}
      </div>
    </section>
  );
}
function IndexPage({ section, resource, org, client }) {
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <Failure error={resource.error} retry={resource.refresh} />;
  if (!resource.data) return null;
  const [title, description] = notes[section] ?? [
    label(section),
    "Organization context and supporting services.",
  ];
  return (
    <>
      <PageHeader
        eyebrow="Cyber readiness"
        title={title}
        description={description}
      >
        <button className="v2-button secondary v2-refresh" aria-label="Refresh" onClick={resource.refresh}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </PageHeader>
      {section === "overview" ? (
        <ReadinessOverview client={client} data={resource.data} org={org}>
          <ExerciseRows exercises={resource.data.exercises.slice(0, 5)} org={org} />
        </ReadinessOverview>
      ) : section === "readiness" ? (
        <Profiles data={resource.data} org={org} />
      ) : section === "exercises" ? (
        <section className="v2-panel">
          <div className="v2-section-heading"><div><p className="v2-eyebrow">Response operations</p><h2>Exercise register</h2></div><Link className="v2-button" to={`/app/exercises/new?org=${encodeURIComponent(org)}`}>Create ransomware exercise <ArrowRight size={16} /></Link></div>
          <ExerciseRows exercises={resource.data.exercises} org={org} workspaceLinks />
          <p className="v2-muted v2-footnote">
            Open an exercise to release injects, submit assigned responses or review captured evidence.
          </p>
        </section>
      ) : section === "remediation" ? (
        <RemediationView client={client} data={resource.data} org={org} />
      ) : (
        <SupportingSection section={section} data={resource.data} org={org} />
      )}
      <p className="v2-footnote v2-muted">
        Scope: latest 50 exercise records, filtered to your access.
        {resource.data.truncated
          ? " Additional records exist outside this view."
          : ""}{" "}
        Counts are not organization-wide totals.
      </p>
    </>
  );
}
export default function ReadinessApp({
  client,
  userLabel = "Signed-in user",
  onSignOut,
  preview = false,
}) {
  const context = useResource("context", (signal) => client.context(signal));
  const [params] = useSearchParams();
  const org = params.get("org") || context.data?.organizations[0]?.id;
  const organizations = context.data?.organizations ?? [];
  const index = useResource(
    org && organizations.some((item) => item.id === org)
      ? `index:${org}`
      : null,
    (signal) => client.index(org, signal),
  );
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  const [logoutError, setLogoutError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = (event) => {
      if (event.key === "Escape") {
        setMenu(false);
        requestAnimationFrame(() =>
          document.querySelector(".v2-menu")?.focus(),
        );
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);
  const nav = (rows) =>
    rows
      .filter(
        ([path]) =>
          path !== "administration" ||
          index.data?.organization.can_manage_organization,
      )
      .map(([path, title, Icon]) => (
        <NavLink
          key={path}
          onClick={() => {
            setMenu(false);
            window.scrollTo(0, 0);
          }}
          to={`/app/${path}${org ? `?org=${encodeURIComponent(org)}` : ""}`}
        >
          <Icon size={18} aria-hidden="true" />
          <span>{title}</span>
        </NavLink>
      ));
  return (
    <div className="v2-app" data-theme={theme}>
      <a
        className="v2-skip"
        href="#v2-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("v2-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside
        id="v2-navigation"
        className={`v2-sidebar ${menu ? "is-open" : ""}`}
      >
        <Brand
          org={org}
          onNavigate={() => {
            setMenu(false);
            window.scrollTo(0, 0);
          }}
        />
        <button
          className="v2-close"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <p className="v2-nav-label">WORKSPACE</p>
        <nav aria-label="Primary">{nav(primary)}</nav>
        <p className="v2-nav-label">MANAGE</p>
        <nav aria-label="Organization">{nav(secondary)}</nav>
        <div className="v2-sidebar-bottom">
          <ShieldCheck size={18} />
          <span>
            Evidence-backed readiness<small>Observe. Improve. Verify.</small>
          </span>
        </div>
      </aside>
      <div className="v2-workspace">
        {preview && (
          <div className="v2-preview-banner">
            SYNTHETIC REVIEW DATA · Isolated interface preview · No customer
            data or production writes
          </div>
        )}
        <header className="v2-topbar">
          <button
            className="v2-menu"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-controls="v2-navigation"
            aria-expanded={menu}
            onClick={() => setMenu((value) => !value)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <label className="v2-org-select">
            <Building2 size={18} />
            <span className="v2-sr">Organization</span>
            <select
              value={organizations.some((item) => item.id === org) ? org : ""}
              onChange={(event) =>
                navigate(
                  `/app/overview?org=${encodeURIComponent(event.target.value)}`,
                )
              }
              disabled={!organizations.length}
            >
              <option value="" disabled>
                Select organization
              </option>
              {organizations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <span className="v2-location-label" aria-hidden="true">
            <span>/</span>{[...primary, ...secondary].find(([path]) => location.pathname.split("/")[2] === path)?.[1] || "Workspace"}
          </span>
          <div className="v2-top-actions">
            <span className="v2-user">{userLabel}</span>
            <button
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={() =>
                setTheme((value) => (value === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {onSignOut && (
              <button
                aria-label="Sign out"
                onClick={async () => {
                  try {
                    await onSignOut();
                  } catch {
                    setLogoutError("Sign out failed. Please try again.");
                  }
                }}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <main id="v2-content" tabIndex="-1" className="v2-main">
          {logoutError && <p role="alert">{logoutError}</p>}
          {context.loading ? (
            <Loading />
          ) : context.error ? (
            <Failure error={context.error} retry={context.refresh} />
          ) : !organizations.length ? (
            <>
              <PageHeader
                eyebrow="Organization access"
                title="No V2 organization assigned"
                description="Your identity is signed in, but no active server-managed organization membership is available."
              />
              <Empty title="Your existing records are preserved">
                <p>
                  Ask your organization administrator to provision V2 access.
                  Legacy profile permissions are not automatically converted.
                </p>
                <LegacyLink to="ResponseReadiness">
                  Existing command center
                </LegacyLink>
              </Empty>
            </>
          ) : !organizations.some((item) => item.id === org) ? (
            <Failure
              error={{
                status: 403,
                message:
                  "This organization is not in your current access list. Select an authorized organization above.",
              }}
              retry={context.refresh}
            />
          ) : (
            <Routes>
              <Route path="exercises/new" element={<CreateExercise key={org} client={client} org={org} preview={preview} />} />
              <Route path="exercises/:exerciseId" element={<ExerciseWorkspace key={`${org}:${location.pathname}`} client={client} org={org} preview={preview} />} />
              <Route
                index
                element={
                  <Navigate
                    replace
                    to={`overview?org=${encodeURIComponent(org)}`}
                  />
                }
              />
              {[...primary, ...secondary].map(([path]) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <IndexPage section={path} resource={index} org={org} client={client} />
                  }
                />
              ))}
              <Route
                path="readiness/:exerciseId"
                element={
                  <EvidenceView
                    key={`${org}:${location.pathname}`}
                    client={client}
                    organizationId={org}
                  />
                }
              />
              <Route
                path="*"
                element={
                  <Empty headingLevel={1} title="Workspace page not found">
                    <Link
                      className="v2-text-link"
                      to={`/app/overview?org=${encodeURIComponent(org)}`}
                    >
                      Return to overview
                    </Link>
                  </Empty>
                }
              />
            </Routes>
          )}
        </main>
        <footer className="v2-footer">
          HubCyS / Cyber readiness workspace
          <span>Evidence determines the conclusion.</span>
        </footer>
      </div>
    </div>
  );
}
