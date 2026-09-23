import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Badge, LegacyLink, Loading, label, date } from './ui';
import { useLatestEvidence, EvidenceUnavailable } from './ReadinessOverview';

export default function RemediationView({ client, data, org }) {
  const resource = useLatestEvidence(client, data, org);
  const [filter, setFilter] = useState('all');
  if (resource.loading) return <Loading />;
  if (resource.error) return <EvidenceUnavailable resource={resource} />;
  const view = resource.data;
  const actions = view?.actions ?? [];
  const shown = actions.filter(row => filter === 'all' || row.state === filter);
  return <>
    <div className="v2-scope-strip"><span><ClipboardCheck size={16} /> Corrective work</span><span>{view ? `Latest review: ${label(view.exercise.threat_id)}` : 'No reviewable exercise'}</span><span>Not an organization-wide queue</span></div>
    <section className="v2-panel">
      <div className="v2-section-heading"><div><p className="v2-eyebrow">Evidence-linked actions</p><h2>From finding to verified outcome</h2></div>
        {view && <Link className="v2-text-link" to={`/app/readiness/${view.exercise.id}?org=${encodeURIComponent(org)}`}>Exercise evidence <ArrowUpRight size={16} /></Link>}</div>
      <div className="v2-filter-tabs" role="group" aria-label="Filter corrective actions">{[['all','All actions'],['ready_for_verification','Awaiting verification'],['verified','Verified']].map(([key,text]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{text}<span>{key === 'all' ? actions.length : actions.filter(row => row.state === key).length}</span></button>)}</div>
      <div className="v2-action-register">
        <div className="v2-register-heading"><span>Action / finding</span><span>Owner</span><span>Due date</span><span>Status</span></div>
        {shown.map(action => <article className="v2-action-row" key={action.id}>
          <div><strong>{action.id}</strong><p>{action.verification_requirements}</p><small>Finding {action.finding_ids.join(', ')}</small></div>
          <div><span className="v2-mobile-label">Owner</span>{action.owner_uid || 'Unassigned'}</div>
          <div><span className="v2-mobile-label">Due date</span>{date(action.due_at)}</div>
          <div><Badge tone={action.state === 'ready_for_verification' ? 'warning' : action.state === 'verified' ? 'good' : ''}>{label(action.state)}</Badge>
            <Link className="v2-text-link" to={`/app/readiness/${view.exercise.id}?org=${encodeURIComponent(org)}&capability=${encodeURIComponent(view.findings.find(finding => action.finding_ids.includes(finding.id))?.capability_id ?? '')}`}>Trace finding <ArrowUpRight size={14} /></Link></div>
        </article>)}
        {!shown.length && <div className="v2-baseline-state"><ClipboardCheck size={28} /><h3>No actions in this selection</h3><p>{view ? 'There are no matching recorded actions in this exercise evidence view.' : 'Actions appear here when they are linked to a reviewable exercise.'}</p></div>}
      </div>
    </section>
    <section className="v2-verification-guide"><div><p className="v2-eyebrow">Keep the distinction clear</p><h2>Completed is not yet verified.</h2><p>Remediation records the work. Verification establishes whether the capability improved.</p></div><div className="v2-verification-steps"><span>Finding</span><ArrowRight size={16}/><span>Corrective work</span><ArrowRight size={16}/><strong>Verified outcome</strong></div></section>
    <section className="v2-legacy-strip"><div><h3>Existing action items</h3><p>Preserved separately. Legacy completion does not establish V2 verification.</p></div><LegacyLink to="ActionItems">Open existing action items</LegacyLink></section>
  </>;
}
