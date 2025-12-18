import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function ValidationMatrix({ summary }) {
  if (!summary) return null;
  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 text-lg flex items-center gap-2">
          <Activity className="w-5 h-5" /> Validation Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: summary.total_events },
          { label: "IOC Events", value: summary.total_iocs },
          { label: "High", value: summary.high },
          { label: "Medium", value: summary.medium },
          { label: "Low", value: summary.low },
        ].map((it) => (
          <div key={it.label} className="bg-slate-800/40 rounded-lg p-4">
            <div className="text-gray-300 text-sm">{it.label}</div>
            <div className="text-white text-xl font-bold">{it.value ?? "—"}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}