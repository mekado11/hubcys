import React from 'react';
import { ArrowDownRight, ArrowUpRight, Check, Clock3, FileText, Radio, Send, ShieldAlert } from 'lucide-react';
import { Badge, Empty, date, label } from './ui';

const stages = [
  ['Preparation', ['draft', 'scheduled', 'ready']],
  ['Response', ['running', 'paused']],
  ['Review', ['review']],
  ['Complete', ['completed']],
];

export function ExerciseStatus({ workspace }) {
  const { exercise } = workspace;
  return <section className="v2-session-status" aria-label="Exercise status">
    <div className="v2-session-identity">
      <span className="v2-session-state"><Radio size={16} aria-hidden="true" /><strong>{label(exercise.state)}</strong></span>
      <span>Simulated exercise</span>
      <span className="v2-session-role">{workspace.assignment?.roles?.map(label).join(' · ') || 'Authorized workspace access'}</span>
    </div>
    <ol className="v2-stage-rail" aria-label="Exercise stages">
      {stages.map(([name, states], index) => <li key={name} aria-current={states.includes(exercise.state) ? 'step' : undefined}>
        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{name}
      </li>)}
    </ol>
    <div className="v2-session-counts"><span><strong>{workspace.releases.length}</strong> released {workspace.releases.length === 1 ? 'inject' : 'injects'}</span><span><strong>{workspace.responses.length}</strong> {workspace.responses.length === 1 ? 'response' : 'responses'} in your view</span></div>
  </section>;
}

export function FacilitatorConsole({ workspace, transitions, disabled, send }) {
  const { exercise } = workspace;
  const released = new Set(workspace.releases.map(row => row.inject_definition_id));
  return <section className="v2-panel v2-facilitator-console">
    <div className="v2-console-heading"><ShieldAlert size={19} aria-hidden="true" /><div><p className="v2-eyebrow">Exercise operations</p><h2>Facilitator controls</h2></div></div>
    <p className="v2-muted">Ending the response phase closes submissions and opens evaluator review.</p>
    <div className="v2-session-transitions">
      {(transitions[exercise.state] ?? []).map(([next, text]) => <button key={next} className={`v2-button ${next === 'running' ? '' : 'secondary'}`} disabled={disabled} onClick={() => send({ command: 'transition_exercise', next_state: next, expected_record_version: exercise.record_version })}>{text}<ArrowUpRight size={14} aria-hidden="true" /></button>)}
      {!(transitions[exercise.state]?.length) && <p className="v2-small-note">No facilitator state transition is available in this phase.</p>}
    </div>
    <div className="v2-queue-heading"><div><p className="v2-eyebrow">Private to facilitators</p><h3>Inject release queue</h3></div><Badge>{workspace.available_injects.filter(row => !released.has(row.id)).length} unreleased</Badge></div>
    <p className="v2-small-note">Manual release. Scenario definitions are not a scheduled delivery sequence.</p>
    <div className="v2-inject-queue">
      {workspace.available_injects.map(row => <article className="v2-queue-item" key={row.id}>
        <div className="v2-between"><span className="v2-artifact-type">{label(row.artifact_type)}</span><Badge tone={released.has(row.id) ? 'good' : ''}>{released.has(row.id) ? 'Released' : 'Unreleased'}</Badge></div>
        <h3>{row.title}</h3>
        <details><summary>Inspect scenario text</summary><p className="v2-artifact-content">{row.content}</p></details>
        <button className="v2-button secondary" aria-label={`Release ${row.title}`} disabled={disabled || exercise.state !== 'running' || released.has(row.id)} onClick={() => send({ command: 'release_inject', inject_definition_id: row.id, expected_record_version: exercise.record_version })}>
          {released.has(row.id) ? <Check size={15} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}{released.has(row.id) ? 'Already released' : 'Release inject'}
        </button>
      </article>)}
    </div>
  </section>;
}

export function IncidentTimeline({ workspace, selectedRelease, onRespond }) {
  return <section className="v2-panel v2-incident-timeline">
    <div className="v2-section-heading"><div><p className="v2-eyebrow">Incident timeline</p><h2>Released incident artifacts</h2></div><Badge>{workspace.releases.length} in view</Badge></div>
    <p className="v2-muted">Ordered by recorded release sequence. Times in scenario text are simulated; release timestamps below are system records.</p>
    {!workspace.releases.length ? <Empty title="Waiting for the first inject"><p>The facilitator must start the exercise and release an inject. Unreleased artifacts are not shown to participants.</p></Empty> :
      <ol className="v2-timeline-events">{workspace.releases.map((row, index) => <li className="v2-timeline-event" key={row.id}>
        <span className="v2-event-marker" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <div className="v2-event-record">
          <div className="v2-event-time"><Clock3 size={13} aria-hidden="true" /><span>Released <time dateTime={row.released_at}>{date(row.released_at)}</time></span></div>
          <article className={`v2-incident-artifact ${selectedRelease === row.id && workspace.can_respond ? 'is-selected' : ''}`}>
            <div className="v2-artifact-header"><span><FileText size={15} aria-hidden="true" />{label(row.artifact?.artifact_type) || 'Incident artifact'}</span><Badge tone="warning">Simulated exercise</Badge></div>
            <h3>{row.artifact?.title || row.inject_definition_id}</h3>
            <blockquote className="v2-artifact-content">{row.artifact?.content || 'No artifact content was included in this release record.'}</blockquote>
            {workspace.can_respond && <button className="v2-text-link" onClick={() => onRespond(row.id)} aria-label={`Respond to ${row.artifact?.title || row.inject_definition_id}`}>Respond to inject<ArrowDownRight size={16} aria-hidden="true" /></button>}
          </article>
        </div>
      </li>)}</ol>}
  </section>;
}

export function ResponseLedger({ workspace }) {
  const titleByRelease = new Map(workspace.releases.map(row => [row.id, row.artifact?.title || row.inject_definition_id]));
  const responses = [...workspace.responses].sort((a, b) => Date.parse(a.received_at) - Date.parse(b.received_at));
  return <section className="v2-panel v2-response-ledger">
    <div className="v2-section-heading"><div><p className="v2-eyebrow">Response record</p><h2>{workspace.can_review ? 'Recorded participant responses' : 'Your recorded responses'}</h2></div><Badge>{workspace.responses.length} in view</Badge></div>
    {!workspace.responses.length && <p className="v2-muted">No responses in this view.</p>}
    {responses.map(row => <article className="v2-response-record" key={row.id}>
      <div className="v2-response-attribution"><strong>{row.actor_uid}</strong><time dateTime={row.received_at}>{date(row.received_at)}</time></div>
      <div className="v2-response-detail"><p className="v2-small-note">{titleByRelease.get(row.inject_release_id) || row.inject_release_id}</p><blockquote>{row.content}</blockquote><span className="v2-small-note">Recorded response · <span className="v2-id">{row.id}</span></span></div>
    </article>)}
    {workspace.possibly_truncated && <p className="v2-caution" role="status">This workspace is bounded; additional records may exist outside this view.</p>}
  </section>;
}
