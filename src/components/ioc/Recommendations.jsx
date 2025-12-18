import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function Recommendations({ results = [], eventGroups = [] }) {
  const topBadIps = results.filter(r => r.type === "ip" && r.verdict === "high").slice(0,3).map(r => r.value);
  const hasC2 = eventGroups.some(g => g.group_type === "c2_beaconing");
  const hasImpossible = eventGroups.some(g => g.group_type === "impossible_travel");
  const hasExfil = eventGroups.some(g => g.group_type === "data_exfiltration");
  const hasPrivEsc = eventGroups.some(g => g.group_type === "privilege_escalation");

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 text-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="text-white font-semibold mb-2">Immediate Containment</div>
          <ul className="text-gray-200 list-disc ml-5 space-y-1">
            {hasC2 ? <li>Isolate any endpoints communicating with suspected C2.</li> : null}
            {hasImpossible ? <li>Invalidate sessions and rotate credentials for affected users.</li> : null}
            {hasPrivEsc ? <li>Revoke suspicious policies/roles; review recent IAM changes.</li> : null}
            {topBadIps.length ? <li>Block IPs: {topBadIps.join(", ")}.</li> : <li>Block suspicious IPs observed in High IOCs.</li>}
          </ul>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="text-white font-semibold mb-2">Forensic & Review</div>
          <ul className="text-gray-200 list-disc ml-5 space-y-1">
            <li>Collect host artifacts (EDR, command history, sched tasks).</li>
            {hasExfil ? <li>Correlate cloud logs for data egress timelines.</li> : null}
            <li>Search for token reuse across services.</li>
          </ul>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="text-white font-semibold mb-2">Preventive Actions</div>
          <ul className="text-gray-200 list-disc ml-5 space-y-1">
            <li>Enforce MFA and geo-velocity detection.</li>
            <li>Auto-flag encoded PowerShell + outbound C2 as High.</li>
            <li>Alert on large cloud object retrievals from non-corp ASNs.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}