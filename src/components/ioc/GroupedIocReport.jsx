
import React from "react";
import ExecutiveSummary from "./ExecutiveSummary";
import SeveritySection from "./SeveritySection";
import NarrativeTimeline from "./NarrativeTimeline";
import AnalyticalNotes from "./AnalyticalNotes";
import Recommendations from "./Recommendations";
import ValidationMatrix from "./ValidationMatrix";

export default function GroupedIocReport({ data }) {
  if (!data) return null;
  const summary = data.summary || {};
  const results = Array.isArray(data.results) ? data.results : [];
  const eventGroups = Array.isArray(data.event_groups) ? data.event_groups : [];

  // Group by severity
  const highs = results.filter(r => r.verdict === "high");
  const mediums = results.filter(r => r.verdict === "medium");
  const lows = results.filter(r => r.verdict === "low");

  // Primary theme + patterns from eventGroups
  const typeCounts = eventGroups.reduce((acc, g) => { acc[g.group_type] = (acc[g.group_type] || 0) + 1; return acc; }, {});
  const primaryType = Object.entries(typeCounts).sort((a,b) => b[1]-a[1])?.[0]?.[0];
  const THEME_LABEL = {
    impossible_travel: "Credential misuse or session replay",
    privilege_escalation: "Suspicious role/policy changes",
    c2_beaconing: "Command & Control communication",
    data_exfiltration: "Potential data exfiltration",
    off_hours_activity: "Anomalous off-hours activity",
  };
  const primaryTheme = THEME_LABEL[primaryType] || null;
  const topPatterns = Object.keys(typeCounts).slice(0, 3).map(t => THEME_LABEL[t] || t);

  // Affected systems/users (best-effort from event_context)
  const users = new Set();
  const hosts = new Set();
  results.forEach(r => {
    const ec = r.event_context || {};
    if (ec.user) users.add(ec.user);
    if (ec.resource_name) hosts.add(ec.resource_name);
  });
  const affectedSystems = [...hosts, ...users].slice(0, 4);

  return (
    <div className="space-y-6">
      <ExecutiveSummary
        summary={summary}
        primaryTheme={primaryTheme}
        affectedSystems={affectedSystems}
        topPatterns={topPatterns}
      />

      <SeveritySection title="High-Severity IOC Findings" severity="high" items={highs} collapsible={false} defaultOpen />

      <SeveritySection title="Medium-Severity Events" severity="medium" items={mediums} collapsible defaultOpen={false} />

      <SeveritySection title="Low-Severity Events" severity="low" items={lows} collapsible defaultOpen={false} />

      <NarrativeTimeline eventGroups={eventGroups} />
      <AnalyticalNotes results={results} eventGroups={eventGroups} />
      <Recommendations results={results} eventGroups={eventGroups} />
      <ValidationMatrix summary={summary} />
    </div>
  );
}
