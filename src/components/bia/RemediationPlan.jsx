import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function synthesizePlan({ impact, likelihood, topDrivers }) {
  const items = {
    quickWins: [],
    days90: [],
    year: []
  };
  const drivers = (topDrivers || []).map((d) => String(d).toLowerCase());

  // Heuristics based on drivers
  if (drivers.some(d => d.includes("single point") || d.includes("spof"))) {
    items.quickWins.push("Document failover runbook and test a basic manual failover for SPOF.");
    items.days90.push("Design and implement redundancy or auto-failover for SPOF assets.");
  }
  if (drivers.some(d => d.includes("legacy") || d.includes("eol"))) {
    items.quickWins.push("Harden legacy/EOL systems (MFA on admin, network isolation, backups).");
    items.days90.push("Plan and budget for migration off EOL components.");
  }
  if (drivers.some(d => d.includes("vendor") || d.includes("external control"))) {
    items.quickWins.push("Define vendor exit plan and ensure data portability/backups.");
    items.days90.push("Add compensating controls (monitoring, SLAs) for key vendor-managed systems.");
  }
  if (drivers.some(d => d.includes("external staff") || d.includes("privileged"))) {
    items.quickWins.push("Enforce PAM for all external privileged accounts; remove stale access.");
    items.days90.push("Move contractors to JIT/JEA access with session recording.");
  }

  // General based on magnitude
  const risk = (impact || 0) * (likelihood || 0);
  if (risk >= 12) {
    items.quickWins.push("Define incident RTO/RPO targets and validate backup restore times.");
    items.days90.push("Tabletop exercise focused on this process; integrate lessons into IR plan.");
  }

  // De-duplicate
  items.quickWins = Array.from(new Set(items.quickWins));
  items.days90 = Array.from(new Set(items.days90));
  items.year = Array.from(new Set(items.year));

  return items;
}

export default function RemediationPlan({ impact, likelihood, topDrivers, actionPlan }) {
  const auto = useMemo(() => synthesizePlan({ impact, likelihood, topDrivers }), [impact, likelihood, topDrivers]);
  const plan = actionPlan && (actionPlan.quickWins?.length || actionPlan.days90?.length || actionPlan.year?.length)
    ? actionPlan
    : auto;

  const Section = ({ title, items }) => (
    <div className="mt-4">
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      {items?.length ? (
        <ul className="list-disc list-inside text-slate-300 space-y-1">
          {items.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      ) : (
        <p className="text-slate-500">No items.</p>
      )}
    </div>
  );

  return (
    <Card className="glass-effect border-emerald-500/20">
      <CardHeader>
        <CardTitle className="text-emerald-300">Remediation Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">
          Based on: impact {impact ?? "—"} • likelihood {likelihood ?? "—"} • drivers: {(topDrivers || []).join(", ") || "—"}
        </p>
        <Section title="30-Day Quick Wins" items={plan.quickWins} />
        <Section title="90-Day Initiatives" items={plan.days90} />
        <Section title="6–12 Month Goals" items={plan.year} />
      </CardContent>
    </Card>
  );
}