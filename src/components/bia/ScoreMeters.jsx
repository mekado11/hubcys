import React from "react";
import { Card, CardContent } from "@/components/ui/card";

function ScoreItem({ label, value = 0, max = 5, barColor = "bg-cyan-500" }) {
  const safeVal = typeof value === "number" ? value : Number(value) || 0;
  const pct = Math.max(0, Math.min(100, (safeVal / max) * 100));
  const display = `${safeVal.toFixed(1)}/${max}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-cyan-300 font-mono">{display}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreMeters({ impact = 0, likelihood = 0, riskScore = 0 }) {
  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ScoreItem label="Impact" value={impact} max={5} barColor="bg-cyan-500" />
          <ScoreItem label="Likelihood" value={likelihood} max={5} barColor="bg-purple-500" />
          <ScoreItem label="Risk (Impact×Likelihood)" value={riskScore} max={25} barColor="bg-rose-500" />
        </div>
      </CardContent>
    </Card>
  );
}