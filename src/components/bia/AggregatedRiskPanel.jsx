import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { runBIA } from "./biaEngine";

export default function AggregatedRiskPanel({ items, assetTypes = [] }) {
  const computed = useMemo(() => {
    const out = [];
    items.forEach((it) => {
      const inp = it.inputs || {};
      const complete =
        inp.bia_impact_time_to_hurt &&
        inp.bia_impact_revenue_loss_rate &&
        inp.bia_impact_contract_exposure &&
        inp.bia_impact_ops_dependency_share &&
        inp.bia_data_classification &&
        inp.bia_data_public_notice_required &&
        inp.bia_data_regulatory_exposure &&
        inp.bia_exposure_vendor_control &&
        inp.bia_exposure_legacy_status &&
        inp.bia_exposure_single_point_of_failure &&
        inp.bia_exposure_external_staff_access &&
        (inp.bia_process_name || "");
      if (complete) {
        const tp = assetTypes.find(a => a.name === (inp.bia_process_type || it.type)) || null;
        const r = runBIA(inp, tp?.risk_profile || null);
        out.push({
          id: it.id,
          name: it.name || "Critical Piece",
          type: it.type || inp.bia_process_type || "",
          result: r
        });
      }
    });
    out.sort((a, b) => (b.result?.riskScore || 0) - (a.result?.riskScore || 0));
    const totals = {
      count: out.length,
      totalALE: Math.round(out.reduce((s, x) => s + (x.result?.annualizedLoss || 0), 0)),
      maxRisk: out[0]?.result?.riskScore || 0
    };
    return { list: out, totals };
  }, [items, assetTypes]);

  const heatClass = (score) =>
    score >= 16 ? "text-red-300" : score >= 8 ? "text-orange-300" : "text-green-300";

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-cyan-300">Aggregated Risks</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
            Items: {computed.totals.count}
          </Badge>
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-200">
            Total ALE: ${computed.totals.totalALE.toLocaleString()}
          </Badge>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-200">
            Max Risk: {computed.totals.maxRisk.toFixed(1)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-200"
            onClick={() => {
              const blob = new Blob([JSON.stringify(computed, null, 2)], { type: "application/json" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "bia_aggregated.json";
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              a.remove();
            }}
          >
            <Download className="w-4 h-4 mr-2" /> Export JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {computed.list.length === 0 ? (
          <div className="text-sm text-slate-300">No complete items yet. Fill the fields to see the aggregated risks.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {computed.list.map((x) => (
              <div key={x.id} className="rounded-md border border-slate-700/50 p-3 bg-slate-900/40">
                <div className="text-slate-200 font-semibold">{x.name}</div>
                <div className="text-xs text-slate-400">{x.type || "—"}</div>
                <div className="mt-2 text-sm text-slate-300">
                  Risk: <span className={`${heatClass(x.result.riskScore)} font-semibold`}>{x.result.riskScore.toFixed(1)}</span>
                  {" "}• ALE: ${Math.round(x.result.annualizedLoss).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Impact {x.result.impact.toFixed(1)} • Likelihood {x.result.likelihood.toFixed(1)} • RTO {x.result.rtoHours}h • RPO {x.result.rpoHours}h
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}