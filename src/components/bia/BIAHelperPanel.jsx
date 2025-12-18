
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export default function BIAHelperPanel({
  tips = [],
  showAdvanced = false,
  onToggleAdvanced,
  overrides = {},
  onChangeOverride
}) {
  return (
    <aside
      className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-auto pr-2"
      aria-label="How to Answer"
    >
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
        <h4 className="text-xs tracking-widest text-slate-400 mb-2">HOW TO ANSWER</h4>
        <div className="space-y-3">
          {tips.map((t, i) => (
            <div key={i} className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3">
              <div className="text-sm text-cyan-300 font-semibold">{t.title}</div>
              <p className="text-xs text-slate-300 mt-1">{t.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/40">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-200 font-medium">Advanced numeric overrides</span>
            <Switch checked={showAdvanced} onCheckedChange={onToggleAdvanced} />
          </div>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Downtime per incident (hours)</label>
                <Input
                  type="number"
                  placeholder="e.g., 8"
                  value={overrides?.downtime_hours ?? ""}
                  onChange={(e) => onChangeOverride?.("downtime_hours", Number(e.target.value))}
                  className="bg-slate-800/60 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Incidents per year</label>
                <Input
                  type="number"
                  placeholder="e.g., 1"
                  value={overrides?.incidents_per_year ?? ""}
                  onChange={(e) => onChangeOverride?.("incidents_per_year", Number(e.target.value))}
                  className="bg-slate-800/60 border-slate-700 text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Revenue loss rate (USD/hr) override</label>
                <Input
                  type="number"
                  placeholder="e.g., 15000"
                  value={overrides?.revenue_rate_override ?? ""}
                  onChange={(e) => onChangeOverride?.("revenue_rate_override", Number(e.target.value))}
                  className="bg-slate-800/60 border-slate-700 text-slate-100"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
