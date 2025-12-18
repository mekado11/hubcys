import React from "react";
import { CheckCircle, Edit, Activity, Shield } from "lucide-react";

const stepsConfig = [
  { name: "Company Info", icon: Edit },
  { name: "Operational Security", icon: Shield },
  { name: "Maturity Assessment", icon: Activity },
  { name: "Results & Analysis", icon: CheckCircle }
];

export default function AssessmentProgressBar({ currentStep = 1, onStepClick }) {
  const total = stepsConfig.length;
  const progressPct = ((currentStep - 1) / (total - 1)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-400">Step {currentStep} of {total}</div>
      </div>
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2"></div>
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 -translate-y-1/2 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
        <div className="relative flex justify-between">
          {stepsConfig.map((s, idx) => {
            const Icon = s.icon;
            const stepNumber = idx + 1;
            const completed = stepNumber < currentStep;
            const current = stepNumber === currentStep;

            const ring =
              completed ? "ring-cyan-500" :
              current ? "ring-purple-500" : "ring-slate-600";
            const color =
              completed ? "text-cyan-300" :
              current ? "text-purple-300" : "text-slate-500";
            const clickable = completed;

            return (
              <button
                key={s.name}
                type="button"
                onClick={clickable && onStepClick ? () => onStepClick(stepNumber) : undefined}
                className="flex flex-col items-center group outline-none"
                title={s.name}
              >
                <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center ring-2 transition-all duration-300 ${ring}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className={`mt-2 text-xs font-medium ${color}`}>{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}