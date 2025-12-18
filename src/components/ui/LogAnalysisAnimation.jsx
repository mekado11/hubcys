import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  Upload,
  ListChecks,
  Globe,
  Activity,
  Brain,
  Shield,
  Loader2,
  CheckCircle2
} from "lucide-react";

const phases = [
  { key: "upload", label: "Uploading file", icon: Upload, duration: 1000 },
  { key: "parse", label: "Parsing logs", icon: FileSearch, duration: 1400 },
  { key: "extract", label: "Extracting IOCs", icon: ListChecks, duration: 1400 },
  { key: "enrich", label: "Enriching indicators", icon: Globe, duration: 1600 },
  { key: "behavior", label: "Analyzing behaviors", icon: Activity, duration: 1600 },
  { key: "ai", label: "AI mapping", icon: Brain, duration: 1600 },
  { key: "finalize", label: "Finalizing results", icon: Shield, duration: 900 }
];

export default function LogAnalysisAnimation({ isAnalyzing, fileName = "logfile", aiEnabled = true }) {
  const [current, setCurrent] = useState(0);
  const [overall, setOverall] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrent(0);
      setOverall(0);
      return;
    }

    let phaseTimer;
    let progressTimer;

    const runPhase = (idx) => {
      if (!isAnalyzing) return;
      if (idx >= phases.length) {
        setOverall(100);
        return;
      }
      setCurrent(idx);
      const start = Date.now();
      const dur = phases[idx].key === "ai" && !aiEnabled ? 400 : phases[idx].duration;

      progressTimer = setInterval(() => {
        const elapsed = Date.now() - start;
        const phaseProgress = Math.min(1, elapsed / dur);
        const overallPct = ((idx + phaseProgress) / phases.length) * 100;
        setOverall(overallPct);
        if (phaseProgress >= 1) {
          clearInterval(progressTimer);
          phaseTimer = setTimeout(() => runPhase(idx + 1), 50);
        }
      }, 60);
    };

    runPhase(0);
    return () => {
      clearInterval(progressTimer);
      clearTimeout(phaseTimer);
    };
  }, [isAnalyzing, aiEnabled]);

  if (!isAnalyzing) return null;

  const CurrentIcon = phases[current]?.icon || Loader2;

  return (
    <div className="relative my-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/60 border border-cyan-500/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <CurrentIcon className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-white font-semibold">Analyzing logs</p>
              <p className="text-xs text-cyan-300/80">{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {aiEnabled ? (
              <span className="text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> AI mapping on
              </span>
            ) : (
              <span className="text-gray-300">AI mapping off</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">Overall Progress</span>
            <span className="text-cyan-300 font-mono text-sm">{Math.round(overall)}%</span>
          </div>
          <div className="w-full bg-slate-700/70 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${overall}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {phases.map((p, i) => {
            const Icon = p.icon;
            const state =
              i < current ? "done" : i === current ? "active" : "idle";
            return (
              <div
                key={p.key}
                className={`rounded-lg p-2 text-center border ${
                  state === "done"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                    : state === "active"
                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200"
                    : "bg-slate-700/40 border-slate-600/40 text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" />
                <div className="text-[10px] leading-tight">{p.label}</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}