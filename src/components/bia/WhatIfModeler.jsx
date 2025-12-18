
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { runBIA } from "./biaEngine";
import { ArrowLeftRight, Brain } from "lucide-react";
import { formatCurrency } from "@/components/utils/currencyFormatter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

// Module-level constant to keep reference stable for hooks
const OPTIONS = {
  bia_exposure_vendor_control: ["Full external control", "Some third-party", "None"],
  bia_exposure_legacy_status: ["EOL core system", "Mixed legacy", "Supported & patched"],
  bia_exposure_single_point_of_failure: ["Yes", "Unknown", "No"],
  bia_exposure_external_staff_access: ["Many/critical without oversight", "Few with oversight", "None"],
};

const Box = ({ label, before, after, formatter = (v)=>v, color="" }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
    <div className="text-xs text-gray-400">{label}</div>
    <div className={`mt-1 font-semibold flex items-center gap-2 ${color}`}>
      {formatter(before)} <ArrowLeftRight className="w-3 h-3 text-gray-400" /> {formatter(after)}
    </div>
  </div>
);

export default function WhatIfModeler({ baselineImpact, baselineLikelihood, baselineAnnualizedLoss, inputs }) {
  const [vendorLift, setVendorLift] = useState(0);
  const [legacyLift, setLegacyLift] = useState(0);
  const [spofLift, setSpofLift] = useState(0);
  const [extLift, setExtLift] = useState(0);

  const simulate = useMemo(() => {
    const updated = { ...inputs };
    updated.bia_exposure_vendor_control = OPTIONS.bia_exposure_vendor_control[Math.min(vendorLift, 2)];
    updated.bia_exposure_legacy_status = OPTIONS.bia_exposure_legacy_status[Math.min(legacyLift, 2)];
    updated.bia_exposure_single_point_of_failure = OPTIONS.bia_exposure_single_point_of_failure[Math.min(spofLift, 2)];
    updated.bia_exposure_external_staff_access = OPTIONS.bia_exposure_external_staff_access[Math.min(extLift, 2)];
    return runBIA(updated);
  }, [inputs, vendorLift, legacyLift, spofLift, extLift]);

  const riskColor = simulate.riskScore >= 16 ? "text-red-300" : simulate.riskScore >= 8 ? "text-orange-300" : "text-green-300";

  const thresholds = { low: 8, medium: 15, high: 16 }; // explanatory display only

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-300">
          <Brain className="w-5 h-5" /> What‑If Modeling
        </CardTitle>
        <p className="text-gray-400 text-sm">Drag sliders to simulate improvements to key likelihood drivers.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-300 mb-1">Vendor control</div>
            <Slider min={0} max={2} step={1} value={[vendorLift]} onValueChange={(v)=>setVendorLift(v[0])} />
            <div className="text-xs text-gray-400 mt-1">Move from Full → Some → None</div>
          </div>
          <div>
            <div className="text-sm text-gray-300 mb-1">Legacy/EOL</div>
            <Slider min={0} max={2} step={1} value={[legacyLift]} onValueChange={(v)=>setLegacyLift(v[0])} />
            <div className="text-xs text-gray-400 mt-1">Move from EOL → Mixed → Patched</div>
          </div>
          <div>
            <div className="text-sm text-gray-300 mb-1">Single point of failure</div>
            <Slider min={0} max={2} step={1} value={[spofLift]} onValueChange={(v)=>setSpofLift(v[0])} />
            <div className="text-xs text-gray-400 mt-1">Move from Yes → Unknown → No</div>
          </div>
          <div>
            <div className="text-sm text-gray-300 mb-1">External staff access</div>
            <Slider min={0} max={2} step={1} value={[extLift]} onValueChange={(v)=>setExtLift(v[0])} />
            <div className="text-xs text-gray-400 mt-1">Move from Many → Few → None</div>
          </div>
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <Box label="Impact" before={baselineImpact.toFixed(1)} after={simulate.impact.toFixed(1)} />
            <Box label="Likelihood" before={baselineLikelihood.toFixed(1)} after={simulate.likelihood.toFixed(1)} />
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                Risk
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center cursor-help">
                      <Info className="w-3.5 h-3.5 text-slate-300" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="text-xs text-slate-700">
                      Risk = Impact × Likelihood (range 1–25).
                      <br />
                      Low: ≤{thresholds.low} • Medium: {thresholds.low + 1}–{thresholds.medium} • High: ≥{thresholds.high}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className={`mt-1 font-semibold flex items-center gap-2 ${riskColor}`}>
                {(baselineImpact * baselineLikelihood).toFixed(1)} <ArrowLeftRight className="w-3 h-3 text-gray-400" /> {simulate.riskScore.toFixed(1)}
              </div>
            </div>
          </div>
        </TooltipProvider>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Box label="Annualized Loss (ALE)" before={formatCurrency(baselineAnnualizedLoss)} after={formatCurrency(simulate.annualizedLoss)} formatter={(v)=>v} />
          <Box label="RTO/RPO" before={`—`} after={`${simulate.rtoHours}h / ${simulate.rpoHours}h`} formatter={(v)=>v} />
        </div>
      </CardContent>
    </Card>
  );
}
