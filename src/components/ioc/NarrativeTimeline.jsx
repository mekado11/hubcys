import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

const PHASE_MAP = {
  impossible_travel: "Initial Access / Credential Compromise",
  privilege_escalation: "Privilege Escalation / Defense Evasion",
  c2_beaconing: "C2 Communication",
  data_exfiltration: "Exfiltration",
  off_hours_activity: "Discovery / Anomalous Behavior",
};

export default function NarrativeTimeline({ eventGroups = [] }) {
  const phases = eventGroups.map(g => ({
    phase: PHASE_MAP[g.group_type] || g.group_type,
    narrative: g.narrative,
    severity: g.severity,
  }));
  const unique = [];
  const seen = new Set();
  for (const p of phases) {
    const key = p.phase + "|" + p.narrative;
    if (!seen.has(key)) {
      unique.push(p);
      seen.add(key);
    }
  }

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 text-lg flex items-center gap-2">
          <ListChecks className="w-5 h-5" /> Attack Narrative (Kill-Chain)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unique.length ? unique.map((p, i) => (
          <div key={i} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
            <div className="text-white font-semibold">{p.phase}</div>
            <div className="text-gray-300 text-sm mt-1">{p.narrative}</div>
          </div>
        )) : <div className="text-gray-400 text-sm">No behavioral highlights found.</div>}
      </CardContent>
    </Card>
  );
}