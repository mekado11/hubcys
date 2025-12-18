import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function AnalyticalNotes({ results = [], eventGroups = [] }) {
  // Linked infrastructure (most frequent external IPs)
  const ipCounts = {};
  for (const r of results) {
    if (r.type === "ip") ipCounts[r.value] = (ipCounts[r.value] || 0) + 1;
  }
  const topIps = Object.entries(ipCounts).sort((a,b) => b[1]-a[1]).slice(0,3).map(([ip]) => ip);

  const hasC2 = eventGroups.some(g => g.group_type === "c2_beaconing");
  const hasExfil = eventGroups.some(g => g.group_type === "data_exfiltration");
  const hasImpossible = eventGroups.some(g => g.group_type === "impossible_travel");
  const hasPrivEsc = eventGroups.some(g => g.group_type === "privilege_escalation");

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 text-lg flex items-center gap-2">
          <Info className="w-5 h-5" /> Analytical Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <div className="text-gray-300 font-semibold mb-1">Linked Infrastructure</div>
          <ul className="text-gray-200 list-disc ml-5 space-y-1">
            {topIps.length ? topIps.map((ip) => (<li key={ip}>{ip}</li>)) : <li>No standout external IPs</li>}
          </ul>
        </div>

        <div>
          <div className="text-gray-300 font-semibold mb-1">Cloud & Endpoint Signals</div>
          <ul className="text-gray-200 list-disc ml-5 space-y-1">
            {hasPrivEsc ? <li>Privilege elevation behavior observed (policy/role actions).</li> : null}
            {hasExfil ? <li>Large data retrieval pattern detected (possible exfiltration).</li> : null}
            {hasC2 ? <li>Beacon-like periodic connections observed.</li> : null}
            {hasImpossible ? <li>Geo-velocity anomaly suggesting credential theft/session replay.</li> : null}
            {!hasPrivEsc && !hasExfil && !hasC2 && !hasImpossible ? <li>No notable patterns beyond low-severity context.</li> : null}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}