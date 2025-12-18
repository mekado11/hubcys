import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function cellColor(score) {
  // score from 1 to 25 (impact x likelihood)
  if (score >= 20) return "bg-red-600/60 border-red-500/40";
  if (score >= 15) return "bg-orange-500/60 border-orange-400/40";
  if (score >= 10) return "bg-amber-500/60 border-amber-400/40";
  if (score >= 6) return "bg-yellow-400/60 border-yellow-300/40";
  return "bg-green-500/60 border-green-400/40";
}

export default function RiskHeatmap({ impact = 0, likelihood = 0 }) {
  const x = Math.max(1, Math.min(5, Math.round(impact || 0)));
  const y = Math.max(1, Math.min(5, Math.round(likelihood || 0)));

  const grid = useMemo(() => {
    // y: 5 (top) to 1 (bottom), x: 1..5 left->right
    const rows = [];
    for (let row = 5; row >= 1; row--) {
      const cols = [];
      for (let col = 1; col <= 5; col++) {
        const score = row * col;
        cols.push({ row, col, score });
      }
      rows.push(cols);
    }
    return rows;
  }, []);

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Risk Heatmap</CardTitle>
        <p className="text-gray-400">Impact vs Likelihood (1–5). Marker shows current result.</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Y axis label */}
          <div className="flex flex-col justify-center items-center mr-2">
            <div className="rotate-180 [writing-mode:vertical-rl] text-gray-400 text-sm">Likelihood</div>
          </div>

          <div className="flex flex-col gap-2">
            {grid.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-5 gap-2">
                {row.map((cell) => {
                  const isMarker = cell.col === x && cell.row === y;
                  return (
                    <div
                      key={`${cell.row}-${cell.col}`}
                      className={`relative h-12 w-12 rounded-md border ${cellColor(cell.score)} flex items-center justify-center`}
                      title={`Impact ${cell.col}, Likelihood ${cell.row}`}
                    >
                      {isMarker && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-6 w-6 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.3)]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* X axis */}
            <div className="grid grid-cols-5 gap-2 mt-2">
              {[1,2,3,4,5].map((n) => (
                <div key={n} className="text-center text-gray-400 text-xs">{n}</div>
              ))}
            </div>
            <div className="text-center text-gray-400 text-sm mt-1">Impact</div>
          </div>

          {/* Legend */}
          <div className="ml-auto">
            <div className="text-gray-300 mb-2 text-sm">Legend</div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-green-400/40 bg-green-500/60" />
                <span className="text-gray-400">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-yellow-300/40 bg-yellow-400/60" />
                <span className="text-gray-400">Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-amber-400/40 bg-amber-500/60" />
                <span className="text-gray-400">Elevated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-orange-400/40 bg-orange-500/60" />
                <span className="text-gray-400">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-red-500/40 bg-red-600/60" />
                <span className="text-gray-400">Critical</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}