import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LIKELIHOOD_DEFAULT_WEIGHTS } from "./biaEngine";

export default function BIALikelihoodTuner({ value, onChange }) {
  const v = useMemo(() => value || LIKELIHOOD_DEFAULT_WEIGHTS, [value]);
  const set = (k, val) => {
    const next = { ...v, [k]: Number(val) };
    onChange && onChange(next);
  };
  const total = Object.values(v).reduce((a,b)=>a+Number(b||0),0);

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Likelihood Weights</CardTitle>
        <p className="text-gray-400">Adjust how security, technology, and people factors influence likelihood. They will be normalized automatically. Current sum: <span className="font-semibold">{total.toFixed(3)}</span></p>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-300 mb-1">Security posture weight</div>
          <Input type="number" step="0.01" value={v.security} onChange={(e)=>set('security', e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-gray-300 mb-1">Technology weight</div>
          <Input type="number" step="0.01" value={v.technology} onChange={(e)=>set('technology', e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-gray-300 mb-1">People/insider weight</div>
          <Input type="number" step="0.01" value={v.people} onChange={(e)=>set('people', e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}