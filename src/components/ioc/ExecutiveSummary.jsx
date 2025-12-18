import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Activity, Info } from "lucide-react";

export default function ExecutiveSummary({ summary, primaryTheme, affectedSystems = [], topPatterns = [] }) {
  if (!summary) return null;
  const { total_events = 0, total_iocs = 0, high = 0, medium = 0, low = 0 } = summary || {};

  return (
    <Card className="glass-effect border-cyan-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 text-xl flex items-center gap-2">
          <Target className="w-5 h-5" /> Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="text-gray-300 text-sm mb-1">Total Events</div>
          <div className="text-2xl font-bold text-white">{total_events}</div>
          <div className="text-gray-400 text-xs mt-1">IOC-tagged: {total_iocs}</div>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="text-gray-300 text-sm mb-2">Severity Breakdown</div>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-red-500/20 text-red-300">{high} High</Badge>
            <Badge className="bg-amber-500/20 text-amber-300">{medium} Medium</Badge>
            <Badge className="bg-blue-500/20 text-blue-300">{low} Low</Badge>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="text-gray-300 text-sm mb-2">Primary Incident Theme</div>
          <div className="text-white">{primaryTheme || "No dominant pattern detected"}</div>
        </div>

        <div className="md:col-span-2 bg-slate-800/40 rounded-lg p-4">
          <div className="text-gray-300 text-sm mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Affected Systems
          </div>
          <div className="text-white text-sm">
            {affectedSystems.length ? affectedSystems.join(", ") : "Not identified"}
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="text-gray-300 text-sm mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Top Threat Patterns
          </div>
          <ul className="text-sm text-gray-200 space-y-1">
            {topPatterns.length ? topPatterns.map((t, i) => <li key={i}>• {t}</li>) : <li>No clear patterns</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}