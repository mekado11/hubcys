import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RtoRpoCard({ tier, rtoHours, rpoHours }) {
  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">RTO / RPO Recommendation</CardTitle>
        <p className="text-gray-400">Targets based on impact and likelihood.</p>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-gray-400 text-sm">Tier</div>
          <div className="text-white font-semibold text-xl">{tier}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">RTO (hours)</div>
          <div className="text-white font-semibold text-xl">{rtoHours}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">RPO (hours)</div>
          <div className="text-white font-semibold text-xl">{rpoHours}</div>
        </div>
      </CardContent>
    </Card>
  );
}