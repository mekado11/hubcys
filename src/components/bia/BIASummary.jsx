import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { formatCurrency } from "@/components/utils/currencyFormatter";

export default function BIASummary(props) {
  // Accept either {result} or discrete props
  const r = props.result || {};
  const impact = props.impact ?? r.impact ?? null;
  const likelihood = props.likelihood ?? r.likelihood ?? null;
  const riskScore = props.riskScore ?? r.riskScore ?? (impact && likelihood ? impact * likelihood : null);
  const annualizedLoss = props.annualizedLoss ?? r.annualizedLoss ?? null;
  const rto = props.rtoHours ?? r.rtoHours ?? null;
  const rpo = props.rpoHours ?? r.rpoHours ?? null;

  // Simple heat tier
  const tier = (() => {
    if (riskScore == null) return "Unknown";
    if (riskScore >= 20) return "Critical";
    if (riskScore >= 12) return "High";
    if (riskScore >= 7) return "Medium";
    return "Low";
  })();

  const tierClass = {
    Critical: "bg-red-500/20 text-red-300",
    High: "bg-orange-500/20 text-orange-300",
    Medium: "bg-yellow-500/20 text-yellow-300",
    Low: "bg-green-500/20 text-green-300",
    Unknown: "bg-gray-500/20 text-gray-300",
  }[tier];

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-cyan-300">BIA Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4">
            <div className="text-sm text-slate-400 flex items-center gap-2">
              Risk (Impact × Likelihood)
              <Info className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-semibold text-white">
                {typeof riskScore === "number" ? riskScore.toFixed(1) : "N/A"}
              </div>
              <div className="text-xs text-slate-400">/ 25</div>
              <Badge className={`ml-auto ${tierClass}`} variant="secondary">{tier}</Badge>
            </div>
          </div>

          <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4">
            <div className="text-sm text-slate-400">Annualized Loss (ALE)</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {typeof annualizedLoss === "number" ? formatCurrency(annualizedLoss) : "N/A"}
            </div>
          </div>

          <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4">
            <div className="text-sm text-slate-400">RTO / RPO Target</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {rto != null && rpo != null ? `${rto}h / ${rpo}h` : "— / —"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}