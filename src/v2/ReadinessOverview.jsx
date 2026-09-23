import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ArrowDownRight, FileCheck2, ShieldCheck, CircleDashed } from 'lucide-react';
import { Badge, Empty, Loading, label, date, useResource } from './ui';

export function useLatestEvidence(client, data, org) {
  const exercise = data.exercises.find(row => row.can_review && ['review', 'completed'].includes(row.state));
  // Index refresh creates a new data object. Refresh the evidence snapshot too,
  // even if the exercise ID and version have not changed.
  const key = useMemo(() => exercise ? { org, id: exercise.id, index: data } : null, [org, exercise?.id, data]); // eslint-disable-line react-hooks/exhaustive-deps
  return { exercise, ...useResource(key, signal => client.evidence(org, exercise.id, signal)) };
}

export function EvidenceUnavailable({ resource }) {
  return <div className="v2-inline-notice" role="alert">
    <FileCheck2 size={20} aria-hidden="true" />
    <div><strong>Evidence unavailable</strong><p>{resource.error.message}</p>
      <button className="v2-text-link" onClick={resource.refresh}>Retry evidence <ArrowRight size={15} /></button>
    </div>
  </div>;
}

export function CapabilityBars({ data, org, exerciseId }) {
  const capabilities = data?.score?.capabilities ?? [];
  return <div className="v2-capability-bars">
    {capabilities.map(row => <Link key={row.capability_id} className="v2-capability-bar"
      to={`/app/readiness/${exerciseId}?org=${encodeURIComponent(org)}&capability=${row.capability_id}`}>
      <div><span>{label(row.capability_id)}</span><strong>{row.score ?? 'Not scored'}<ArrowUpRight size={14} /></strong></div>
      <div className="v2-meter" aria-hidden="true"><span className={row.score == null ? 'unknown' : row.score < 70 ? 'attention' : ''} style={{ width: `${row.score ?? 0}%` }} /></div>
    </Link>)}
    {!capabilities.length && <p className="v2-muted">Capability results appear after evaluator review.</p>}
  </div>;
}

export default function ReadinessOverview({ client, data, org, children }) {
  const resource = useLatestEvidence(client, data, org);
  const view = resource.data;
  const result = view?.score?.result;
  const reviewed = data.exercises.filter(row => row.can_review && ['review', 'completed'].includes(row.state));
  const running = data.exercises.filter(row => row.state === 'running');
  const lowest = [...(view?.score?.capabilities ?? [])].filter(row => row.score != null).sort((a, b) => a.score - b.score)[0];
  const pending = view?.actions?.filter(row => row.state === 'ready_for_verification') ?? [];
  const link = resource.exercise ? `/app/readiness/${resource.exercise.id}?org=${encodeURIComponent(org)}` : `/app/exercises?org=${encodeURIComponent(org)}`;
  return <>
    <div className="v2-scope-strip"><span><ShieldCheck size={16} /> Evidence-led assessment</span><span>Organization readiness <strong>Not measured</strong></span>
      <Link to={`/app/readiness?org=${encodeURIComponent(org)}`}>Inspect readiness profiles <ArrowUpRight size={14} /></Link></div>
    <div className="v2-command-grid">
      <section className="v2-panel v2-performance-panel">
        <div className="v2-section-heading"><div><p className="v2-eyebrow">Latest reviewable exercise</p><h2>{resource.exercise ? label(resource.exercise.threat_id) : 'Establish your baseline'}</h2></div>
          <Badge tone={resource.exercise ? 'warning' : ''}>{resource.exercise ? label(resource.exercise.state) : 'Not tested'}</Badge></div>
        {resource.loading ? <Loading /> : resource.error ? <EvidenceUnavailable resource={resource} /> : view ? <>
          <div className="v2-performance-main">
            <div className="v2-exercise-score"><strong>{result?.score ?? '—'}</strong><span>{result?.score != null ? '/ 100' : 'Not scored'}</span><p>Exercise result</p></div>
            <div className="v2-performance-context"><p className="v2-muted">{label(view.exercise.scope_key.replaceAll('-', '_'))}</p>
              <p>{result?.score == null ? 'A complete result needs eligible evidence for every required criterion.' : 'An observed result. Every capability links to its scoring inputs and source evidence.'}</p>
              <p className="v2-small-note">Created {date(view.exercise.created_at)}</p></div>
          </div>
          <CapabilityBars data={view} org={org} exerciseId={view.exercise.id} />
          <div className="v2-panel-footer"><span><FileCheck2 size={15} /> {view.sources.filter(row => row.integrity === 'verified').length} verified source digests</span>
            <Link className="v2-text-link" to={link}>Open evidence chain <ArrowRight size={16} /></Link></div>
        </> : <div className="v2-baseline-state"><CircleDashed size={30} /><h3>Start with an observed response</h3><p>No reviewable exercise is available in this view. Run an exercise before making readiness claims.</p><Link className="v2-text-link" to={link}>Explore exercises <ArrowRight size={16} /></Link></div>}
      </section>
      <aside className="v2-focus-panel">
        <p className="v2-eyebrow">Attention required</p>
        <h2>{lowest && lowest.score < 100 ? label(lowest.capability_id) : 'What needs your attention?'}</h2>
        <p>{lowest && lowest.score < 100 ? 'The lowest measured capability in this exercise. Inspect what happened before deciding what to change.' : 'Use the latest exercise evidence to distinguish response gaps from missing observations.'}</p>
        {lowest && lowest.score < 100 && <div className="v2-focus-result"><ArrowDownRight size={22} /><strong>{lowest.score}<small>/ 100</small></strong><span>Capability result</span></div>}
        <Link className="v2-button secondary" to={lowest ? `${link}&capability=${lowest.capability_id}` : link}>Inspect evidence <ArrowUpRight size={16} /></Link>
        <div className="v2-focus-divider" />
        <p className="v2-eyebrow">Verification</p><h3>{view ? `${pending.length} ${pending.length === 1 ? 'action awaits' : 'actions await'} verification` : 'Completion is not verification'}</h3>
        <p>Corrective work is not proof of improvement. A verified outcome needs evidence.</p>
        <Link className="v2-text-link" to={`/app/remediation?org=${encodeURIComponent(org)}`}>Review corrective work <ArrowRight size={16} /></Link>
      </aside>
    </div>
    <section className="v2-activity-strip" aria-label="Exercise activity in this view">
      <div><span>Recorded exercises</span><strong>{data.exercises.length}</strong></div>
      <div><span>In progress</span><strong>{running.length}</strong></div>
      <div><span>Reviewable exercises</span><strong>{reviewed.length}</strong></div>
      <div><span>Verified improvement</span><strong className="v2-small-value">Not established</strong></div>
    </section>
    <section className="v2-panel v2-recent-panel"><div className="v2-section-heading"><div><p className="v2-eyebrow">Exercise activity</p><h2>Recent exercises</h2></div>
      <Link className="v2-text-link" to={`/app/exercises?org=${encodeURIComponent(org)}`}>View all <ArrowRight size={16} /></Link></div>
      {children || <Empty title="No exercises in this view"><p>Create an exercise to begin collecting response evidence.</p></Empty>}
    </section>
    <p className="v2-small-note">Exercise results are not organization-wide readiness scores. Historical improvement is not inferred from these records.</p>
  </>;
}
