import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Failure, Loading, useResource, label, date } from './ui';
import { ExerciseStatus, FacilitatorConsole, IncidentTimeline, ResponseLedger } from './ExercisePanels';
import './exercise-workspace.css';

function useCommand(client) {
  const request = useRef(null);
  const confirmed = useRef(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  async function run(payload, success) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError('');
    if (!request.current) { request.current = { ...payload, idempotency_key: crypto.randomUUID() }; confirmed.current = success; }
    try {
      const result = await client.command(request.current);
      request.current = null; setLocked(false);
      await confirmed.current(result);
    } catch (cause) {
      if (cause.status >= 400 && cause.status < 500) { request.current = null; setLocked(false); }
      else setLocked(true);
      setError(cause.message || 'The action was not confirmed. Retry to check the same request.');
    } finally { setBusy(false); inFlight.current = false; }
  }
  return { run, busy, error, locked };
}
function CommandError({ operation }) {
  return operation.error ? <p className="v2-caution" role="alert">{operation.error}{operation.locked && ' The original request is retained. Retry before changing this action.'}</p> : null;
}

export function CreateExercise({ client, org, preview = false }) {
  const setup = useResource(`setup:${org}`, signal => client.setup(org, signal));
  const [scope, setScope] = useState('production-response');
  const [context, setContext] = useState(null);
  const [selected, setSelected] = useState([]);
  const operation = useCommand(client);
  const navigate = useNavigate();
  if (setup.loading) return <Loading />;
  if (setup.error) return <Failure error={setup.error} retry={setup.refresh} />;
  const data = setup.data;
  const eligible = data.members.filter(row => row.uid !== data.principal_uid && row.roles.some(role => ['participant', 'facilitator', 'evaluator', 'readiness_lead', 'organization_admin'].includes(role)));
  return <>
    <PageHeader eyebrow="New exercise" title="Ransomware response exercise" description="Create a tenant-owned exercise with three simulated injects and explicit response objectives. No participant actions or results are prefilled." />
    <form className="v2-panel v2-form" onSubmit={event => {
      event.preventDefault();
      if (preview) return;
      operation.run({
        command: 'create_ransomware_exercise', organization_id: org, scope_key: scope,
        context_description: context ?? data.context_description,
        participants: [{ uid: data.principal_uid, roles: ['facilitator', 'evaluator'] }, ...selected.map(uid => ({ uid, roles: ['participant'] }))],
      }, result => navigate(`/app/exercises/${result.exercise_id}?org=${encodeURIComponent(org)}`));
    }}>
      <fieldset disabled={operation.busy || operation.locked}>
        <label>Exercise scope<input required pattern="[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}" value={scope} onChange={event => setScope(event.target.value)} /></label>
        <p className="v2-muted">Use a stable scope identifier, such as production-response or finance-team.</p>
        <label>Systems and business context<textarea required maxLength={20000} value={context ?? data.context_description} onChange={event => setContext(event.target.value)} placeholder="Critical systems, response roles and business services in scope." /></label>
        <p className="v2-muted">Your latest recorded context is reused when available. This exercise keeps its own context snapshot.</p>
        <fieldset><legend>Participants</legend><p className="v2-muted">You are the facilitator and evaluator. Select at least one other authorized responder. Identifiers below are server-managed member UIDs, not invitations.</p>
          {!eligible.length && <p role="status">No other eligible members are provisioned. An administrator must add responders before an exercise can be created.</p>}
          {eligible.map(row => <label className="v2-check" key={row.uid}><input type="checkbox" checked={selected.includes(row.uid)} onChange={event => setSelected(values => event.target.checked ? [...values, row.uid] : values.filter(uid => uid !== row.uid))} /><span>{row.uid}<small>{row.roles.map(label).join(', ')}</small></span></label>)}
        </fieldset>
      </fieldset>
      <div className="v2-panel"><h2>What this exercise tests</h2><p>Triage, evidence preservation before destructive remediation, and factual executive communication. These are exercise objectives, not assumed regulatory obligations.</p></div>
      <CommandError operation={operation} />
      {preview && <p className="v2-caution" role="note">This interface preview is read-only. Exercise creation and participant provisioning require the connected application.</p>}
      <button className="v2-button" disabled={preview || operation.busy || (!selected.length && !operation.locked)}>{operation.busy ? 'Creating…' : operation.locked ? 'Retry creation' : 'Create exercise'}</button>
    </form>
  </>;
}

const transitions = {
  draft: [['scheduled', 'Schedule exercise']], scheduled: [['ready', 'Mark ready']],
  ready: [['running', 'Start exercise']], running: [['paused', 'Pause exercise'], ['review', 'End response phase']],
  paused: [['running', 'Resume exercise'], ['review', 'End response phase']],
};

function ObservationReview({ client, org, workspace, refresh }) {
  const resource = useResource(`review:${org}:${workspace.exercise.id}:${workspace.exercise.record_version}`, signal => client.evidence(org, workspace.exercise.id, signal));
  const operation = useCommand(client);
  const [criterionId, setCriterionId] = useState('');
  const [evidenceIds, setEvidenceIds] = useState([]);
  const [result, setResult] = useState('unknown');
  const [elapsed, setElapsed] = useState('');
  const [rationale, setRationale] = useState('');
  if (resource.loading) return <Loading />;
  if (resource.error) return <Failure error={resource.error} retry={resource.refresh} />;
  const view = resource.data;
  const completed = new Set(view.observations.map(row => row.criterion_id));
  const criteria = workspace.criteria.filter(row => !completed.has(row.id));
  const criterion = criteria.find(row => row.id === criterionId) ?? criteria[0];
  if (!criterion) return <section className="v2-panel"><h2>All criteria have accepted observations</h2><p>Inspect the complete score and evidence below. This does not establish remediation or a successful retest.</p><Link className="v2-button" to={`/app/readiness/${workspace.exercise.id}?org=${encodeURIComponent(org)}`}>View evidence and results</Link></section>;
  const expected = workspace.expected_actions.find(row => row.id === criterion.expected_action_id);
  const sources = view.sources.filter(row => row.integrity === 'verified' && row.evidence.status === 'accepted' && row.response?.actor_uid !== workspace.principal_uid);
  return <form className="v2-panel v2-form" onSubmit={event => {
    event.preventDefault();
    const measurement = result === 'unknown' ? { kind: 'unknown', reason: rationale }
      : criterion.kind === 'completion' ? { kind: 'completion', completed: result === 'pass', omission_observed: result === 'fail' }
      : criterion.kind === 'sequence' ? { kind: 'sequence', followed: result === 'pass' }
      : criterion.kind === 'quality' ? { kind: 'quality', rating: result }
      : { kind: 'deadline', elapsed_ms: Math.round(Number(elapsed) * 60_000) };
    operation.run({
      command: 'accept_observation', organization_id: org, exercise_id: workspace.exercise.id,
      expected_record_version: workspace.exercise.record_version, criterion_id: criterion.id,
      evidence_ids: evidenceIds, measurement, rationale,
    }, async () => { setCriterionId(''); setEvidenceIds([]); setRationale(''); setResult('unknown'); await refresh(); });
  }}>
    <h2>Accept an evaluator observation</h2><p className="v2-muted">You are recording your review, not asking AI to invent a result. Accepted observations are append-only in this workflow.</p>
    <fieldset disabled={operation.busy || operation.locked}>
      <label>Criterion<select aria-label="Criterion" value={criterion.id} onChange={event => { setCriterionId(event.target.value); setEvidenceIds([]); setResult('unknown'); setRationale(''); }} >{criteria.map(row => <option key={row.id} value={row.id}>{label(row.capability_id)} · {row.id}</option>)}</select></label>
      <p>{expected?.requirement}</p>
      {criterion.kind === 'quality' && <dl className="v2-facts">{Object.entries(criterion.anchors).map(([key, text]) => <div key={key}><dt>{label(key)}</dt><dd>{text}</dd></div>)}</dl>}
      {criterion.kind === 'deadline' && <p>Exercise target: {criterion.max_elapsed_ms / 60000} minutes.</p>}
      <label>Observed result<select aria-label="Observed result" value={result} onChange={event => setResult(event.target.value)}><option value="unknown">Unknown / insufficient evidence</option>{criterion.kind === 'deadline' ? <option value="measured">Measured elapsed time</option> : <><option value="pass">Pass: requirement observed</option><option value="fail">Fail: failure or omission observed</option>{criterion.kind === 'quality' && <option value="partial">Partial: meets the partial anchor</option>}</>}</select></label>
      {criterion.kind === 'deadline' && result === 'measured' && <label>Observed elapsed minutes<input type="number" required min="0" max="10080" step="0.01" value={elapsed} onChange={event => setElapsed(event.target.value)} /></label>}
      <fieldset><legend>Supporting evidence</legend>{sources.length === 0 && <p>No eligible independent participant evidence is available.</p>}{sources.map(row => <label className="v2-check v2-evidence-choice" key={row.evidence.id}><input type="checkbox" checked={evidenceIds.includes(row.evidence.id)} onChange={event => setEvidenceIds(ids => event.target.checked ? [...ids, row.evidence.id] : ids.filter(id => id !== row.evidence.id))} /><span><strong>{row.response.actor_uid}</strong> · {row.response.inject_release_id}<blockquote>{row.response.content}</blockquote><small>{date(row.response.received_at)}</small></span></label>)}</fieldset>
      <label>Evaluator rationale<textarea required maxLength={20000} value={rationale} onChange={event => setRationale(event.target.value)} /></label>
    </fieldset>
    <CommandError operation={operation} /><button className="v2-button" disabled={operation.busy || (!evidenceIds.length && !operation.locked)}>{operation.busy ? 'Saving…' : operation.locked ? 'Retry observation' : 'Accept observation'}</button>
  </form>;
}

export function ExerciseWorkspace({ client, org, preview = false }) {
  const { exerciseId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [releaseId, setReleaseId] = useState('');
  const [content, setContent] = useState('');
  const [receipt, setReceipt] = useState(null);
  const operation = useCommand(client);
  const responseForm = useRef(null);
  const live = useRef(true);
  async function refresh() {
    setLoading(true);
    try {
      const data = await client.workspace(org, exerciseId);
      if (live.current) { setWorkspace(data); setError(null); }
    } catch (cause) { if (live.current) setError(cause); }
    finally { if (live.current) setLoading(false); }
  }
  useEffect(() => { live.current = true; refresh(); return () => { live.current = false; }; }, [org, exerciseId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (error) return <Failure error={error} retry={refresh} />;
  if (!workspace) return <Loading />;
  const { exercise } = workspace;
  const disabled = preview || operation.busy || operation.locked || loading;
  const send = payload => operation.run({ organization_id: org, exercise_id: exerciseId, ...payload }, refresh);
  return <>
    <PageHeader eyebrow="Exercise workspace" title={label(exercise.threat_id)} description={`${exercise.scope_key} · ${label(exercise.state)} · All artifacts below are simulated.`}><button className="v2-button secondary" disabled={loading || operation.busy} onClick={refresh}>{loading ? 'Refreshing…' : 'Check for updates'}</button></PageHeader>
    <ExerciseStatus workspace={workspace} />
    <p className="v2-session-notice">Check for updates when the facilitator announces a new inject. Draft responses remain in this tab during refresh, but are not saved until submitted.</p>
    {preview && <p className="v2-session-notice" role="note">Read-only synthetic workspace. State transitions, inject release and response submission are disabled; no production writes are available.</p>}
    <CommandError operation={operation} />
    {operation.locked && <button className="v2-button" disabled={operation.busy} onClick={() => operation.run({}, refresh)}>Retry unconfirmed action</button>}
    <div className={`v2-session-layout ${workspace.can_facilitate || workspace.can_respond ? 'has-console' : ''}`}>
      <IncidentTimeline workspace={workspace} selectedRelease={releaseId || workspace.releases[0]?.id} onRespond={id => {
        setReleaseId(id);
        responseForm.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
        responseForm.current?.querySelector('textarea')?.focus({ preventScroll: true });
      }} />
      {(workspace.can_facilitate || workspace.can_respond) && <aside className="v2-session-console" aria-label="Exercise actions">
      {workspace.can_facilitate && <FacilitatorConsole workspace={workspace} transitions={transitions} disabled={disabled} send={send} />}
    {workspace.can_respond && <form ref={responseForm} className="v2-panel v2-form v2-response-composer" onSubmit={event => {
      event.preventDefault();
      if (preview) return;
      operation.run({ command: 'submit_response', organization_id: org, exercise_id: exerciseId, inject_release_id: releaseId || workspace.releases[0]?.id, content },
        async result => { setReceipt(result); setContent(''); await refresh(); });
    }}><p className="v2-eyebrow">Participant workspace</p><h2>Record your response</h2><p className="v2-muted">Capture a decision, an action or a communication. Only submitted responses become records.</p><fieldset disabled={disabled || exercise.state !== 'running' || !workspace.releases.length}>
      <label>Released inject<select aria-label="Released inject" value={releaseId || workspace.releases[0]?.id || ''} onChange={event => setReleaseId(event.target.value)}>{workspace.releases.map(row => <option value={row.id} key={row.id}>{row.artifact?.title || row.inject_definition_id}</option>)}</select></label>
      <label>Your decision, action or communication<textarea required maxLength={20000} value={content} onChange={event => setContent(event.target.value)} placeholder="Record what you decided, what you did, who owns the action, and what remains unknown." /></label>
      <div className="v2-response-submit"><span className="v2-small-note">{content.trim() ? 'Draft · not submitted' : 'No draft response'}</span><button className="v2-button" disabled={!content.trim()}>Submit response</button></div>
    </fieldset>{exercise.state !== 'running' && <p role="status">Responses are closed while the exercise is {label(exercise.state).toLowerCase()}.</p>}{receipt && <p className="v2-response-receipt" role="status">Response saved at {date(receipt.received_at)}. Receipt: <span className="v2-id">{receipt.response_id}</span></p>}</form>}
      </aside>}
    </div>
    <ResponseLedger workspace={workspace} />
    {workspace.can_evaluate && exercise.state === 'review' && <ObservationReview client={client} org={org} workspace={workspace} refresh={refresh} />}
    {workspace.can_review && (preview
      ? <p className="v2-small-note">Evidence and result review for this live-workspace sample require connected exercise records.</p>
      : <Link className="v2-button" to={`/app/readiness/${exerciseId}?org=${encodeURIComponent(org)}`}>View evidence and results</Link>)}
  </>;
}
