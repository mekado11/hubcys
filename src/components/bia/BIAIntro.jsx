import React from "react";
import { Info, Sparkles } from "lucide-react";

export default function BIAIntro({ currentStep }) {
  const steps = {
    1: {
      title: "Step 1: Business Impact",
      desc: "How quickly it hurts and how much money is at stake.",
      tips: ["Pick the time-to-hurt band.", "Choose a revenue band (rough estimate is fine)."]
    },
    2: {
      title: "Step 2: Data & Compliance",
      desc: "What sensitive data is handled and what disclosure/regulatory duties exist.",
      tips: ["Choose the most sensitive class involved.", "Would you need to notify customers or the public?"]
    },
    3: {
      title: "Step 3: Exposure",
      desc: "Technology and operational factors that drive likelihood.",
      tips: ["Be honest on vendor control and legacy/EOL.", "Call out single points of failure."]
    }
  };
  const s = steps[currentStep] || steps[1];

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/40 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <Info className="h-4 w-4 text-cyan-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-white font-semibold">{s.title}</h3>
          <p className="text-sm text-gray-300">{s.desc}</p>
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            {s.tips.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}