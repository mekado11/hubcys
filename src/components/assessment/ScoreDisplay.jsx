import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const levelGradient = (level) => {
  const l = (level || "").toLowerCase();
  if (l === "expert") return "from-green-400 to-emerald-600";
  if (l === "advanced") return "from-blue-400 to-indigo-600";
  if (l === "intermediate") return "from-yellow-400 to-orange-600";
  if (l === "developing") return "from-amber-400 to-orange-600";
  return "from-red-400 to-rose-600";
};

export default function ScoreDisplay({ data }) {
  const score = typeof data?.overall_score === "number" ? data.overall_score : 0;
  const level = data?.maturity_level || "Beginner";

  return (
    <Card className="glass-effect border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-cyan-300 text-2xl">Assessment Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-gray-400 mb-2">Overall Security Score</p>
            <div className={`text-6xl font-bold bg-gradient-to-r ${levelGradient(level)} bg-clip-text text-transparent`}>
              {score}%
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-400 mb-2">Maturity Level</p>
            <div className={`inline-block px-6 py-3 rounded-full bg-gradient-to-r ${levelGradient(level)} text-white text-2xl font-bold`}>
              {level}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}