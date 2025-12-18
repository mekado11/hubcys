import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, DollarSign, Clock } from "lucide-react";

export default function BIAReportSection({ assessment = {} }) {
  const a = assessment || {};
  const hasBia = !!a.bia_composite_impact || !!a.bia_risk_register || !!a.bia_financials;

  if (!hasBia) return null;

  let domainScores = {};
  let riskRegister = [];
  let financials = {};
  try {
    domainScores = a.bia_domain_scores ? JSON.parse(a.bia_domain_scores) : {};
  } catch {}
  try {
    riskRegister = a.bia_risk_register ? JSON.parse(a.bia_risk_register) : [];
  } catch {}
  try {
    financials = a.bia_financials ? JSON.parse(a.bia_financials) : {};
  } catch {}

  const impact = Number(a.bia_composite_impact || 0);
  const likelihood = Number(a.bia_likelihood || 0);
  const riskScore = Number(a.bia_risk_score || (impact * likelihood));
  const rto = a.bia_rto_hours;
  const rpo = a.bia_rpo_hours;

  return (
    <Card className="glass-effect border-cyan-500/20 mt-6">
      <CardHeader>
        <CardTitle className="text-white">Business Impact Analysis (BIA)</CardTitle>
        <p className="text-gray-400 text-sm">
          Summary of impact, likelihood, risk score, expected loss, and recovery objectives derived from the BIA.
        </p>
      </CardHeader>
      <CardContent className="text-gray-200">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
            <div className="text-xs text-gray-400 flex items-center gap-2"><Activity className="w-4 h-4" /> Composite Impact</div>
            <div className="text-xl font-semibold mt-1">{impact.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
            <div className="text-xs text-gray-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Likelihood</div>
            <div className="text-xl font-semibold mt-1">{likelihood.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
            <div className="text-xs text-gray-400 flex items-center gap-2"><Activity className="w-4 h-4" /> Risk Score (IxL)</div>
            <div className="text-xl font-semibold mt-1">{riskScore.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
            <div className="text-xs text-gray-400 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Expected Annual Loss</div>
            <div className="text-xl font-semibold mt-1">${Number(financials?.totalExpectedLoss || 0).toLocaleString()}</div>
          </div>
        </div>

        {(rto || rpo) && (
          <div className="mt-4 bg-slate-800/50 p-3 rounded border border-slate-700">
            <div className="text-xs text-gray-400 flex items-center gap-2"><Clock className="w-4 h-4" /> Recovery Objectives</div>
            <div className="mt-1">RTO ≤ {rto || "-"} hours • RPO ≤ {rpo || "-"} hours</div>
          </div>
        )}

        {riskRegister?.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-300 mb-2">Top Risks</div>
            <div className="space-y-2">
              {riskRegister.slice(0, 5).map((r, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-800/40 border border-slate-700 rounded p-2">
                  <div className="text-white">{r.name || "Aggregate"}</div>
                  <div className="text-gray-300 text-sm">
                    IxL: {Number(r.impact || 0).toFixed(1)}×{Number(r.likelihood || 0).toFixed(1)} = {Number(r.riskScore || 0).toFixed(2)} • EAL: ${Number(r.expectedAnnualLoss || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {domainScores && Object.keys(domainScores).length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-300 mb-2">Key Drivers</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(domainScores)
                .sort((a,b)=>b[1]-a[1])
                .slice(0,6)
                .map(([k,v]) => (
                  <span key={k} className="px-2 py-1 text-xs rounded border border-slate-700 bg-slate-800/50 text-gray-200">
                    {k}: {Number(v).toFixed(1)}
                  </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}