import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Eraser, RefreshCw, FileText, CheckCircle } from "lucide-react";

const PHASES = [
  {
    id: "phase-detection",
    title: "Detection & Analysis",
    desc: "Identify, validate, analyze, and triage the incident.",
    icon: Search,
  },
  {
    id: "phase-containment",
    title: "Containment",
    desc: "Limit spread and stabilize the environment.",
    icon: Shield,
  },
  {
    id: "phase-eradication",
    title: "Eradication",
    desc: "Remove root cause and all malicious artifacts.",
    icon: Eraser,
  },
  {
    id: "phase-recovery",
    title: "Recovery",
    desc: "Restore operations and monitor for reoccurrence.",
    icon: RefreshCw,
  },
  {
    id: "phase-post",
    title: "Post‑Incident Review",
    desc: "Lessons learned, reporting, and improvements.",
    icon: FileText,
  },
];

function statusToPhaseIndex(status) {
  switch (status) {
    case "Detected":
    case "Triaged":
      return 0;
    case "Contained":
      return 1;
    case "Eradicated":
      return 2;
    case "Recovering":
      return 3;
    case "Closed":
    case "Under_Review":
    default:
      return 4;
  }
}

export default function IncidentLifecycle({ status = "Detected", onPhaseClick }) {
  const currentIdx = statusToPhaseIndex(status);

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-cyan-300">Incident Lifecycle</CardTitle>
        <p className="text-gray-400 text-sm">Aligned with NIST SP 800-61 and ISO/IEC 27035</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {PHASES.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = index === currentIdx;
            const isDone = index < currentIdx;

            return (
              <button
                key={phase.id}
                onClick={() => onPhaseClick && onPhaseClick(phase.id)}
                className={`
                  snap-start text-left min-w-[260px] max-w-[320px] rounded-lg p-4 border transition-all
                  ${isActive
                    ? "bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border-cyan-500/40"
                    : "bg-slate-800/40 border-gray-700 hover:border-cyan-500/30"}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isActive ? "text-cyan-300" : "text-gray-300"}`} />
                    <h4 className={`font-semibold ${isActive ? "text-white" : "text-gray-200"}`}>
                      {phase.title}
                    </h4>
                  </div>
                  {isActive ? (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Active</Badge>
                  ) : isDone ? (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Done
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-600 text-gray-400">Pending</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{phase.desc}</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}