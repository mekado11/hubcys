import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/components/utils/currencyFormatter";

export default function RiskRegister({ topDrivers = [], impact, likelihood, riskScore, annualizedLoss }) {
  const tier = (() => {
    if (riskScore == null) return "Low";
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
  }[tier];

  return (
    <Card className="glass-effect border-orange-500/20">
      <CardHeader>
        <CardTitle className="text-orange-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Risk Register
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <div className="text-white font-semibold">Critical Process Outage</div>
          <div className="flex items-center gap-2 mt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={tierClass}>{typeof riskScore === "number" ? `${riskScore.toFixed(1)} / 25` : "—"}</Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-700 text-white">
                  Risk = Impact × Likelihood (scale 0–25)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-slate-400 text-sm">
              Impact {impact ?? "—"} • Likelihood {likelihood ?? "—"} • ALE {typeof annualizedLoss === "number" ? formatCurrency(annualizedLoss) : "N/A"}
            </span>
          </div>
          {topDrivers?.length > 0 && (
            <div className="text-slate-400 text-sm mt-2">
              Top drivers: {topDrivers.join(", ")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}