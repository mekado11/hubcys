import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function PreflightChecklist({ data, missing, onProceed }) {
  const hasIssues = missing && missing.length > 0;

  return (
    <div className={`rounded-lg p-4 border ${hasIssues ? "border-amber-400 bg-amber-900/20" : "border-emerald-400 bg-emerald-900/20"} text-sm`}>
      <div className="flex items-start gap-3">
        {hasIssues ? (
          <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <div className="font-semibold text-white mb-1">
            {hasIssues ? "Preflight checks found items to improve" : "Preflight checks passed"}
          </div>
          {hasIssues ? (
            <ul className="list-disc list-inside text-amber-100/90 space-y-1">
              {missing.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          ) : (
            <p className="text-emerald-100/90">Inputs look solid for high‑quality analysis.</p>
          )}
          {hasIssues && (
            <button onClick={onProceed} className="mt-3 text-xs px-3 py-1.5 rounded bg-amber-500/20 border border-amber-400 text-amber-100 hover:bg-amber-500/30">
              Proceed anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
}