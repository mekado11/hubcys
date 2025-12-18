
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_BIA_WEIGHTS } from "./biaEngine";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import WeightsGuide from "./WeightsGuide";

export default function BIAWeightsEditor({ value, onChange }) {
  const weights = value || DEFAULT_BIA_WEIGHTS;
  const set = (k, val) => {
    const w = { ...weights, [k]: Number(val) };
    onChange && onChange(w);
  };
  const total = Object.values(weights).reduce((a,b)=>a+Number(b||0),0);

  const fields = [
    ['criticality','Criticality'],['financial','Financial'],['regulatory','Regulatory/Legal'],
    ['operational','Operational'],['customer','Customer/Market'],['data','Data'],
    ['technology','Technology Dependency'],['people','People/Insider'],
    ['facilities','Facilities/Geo'],['security','Security Posture']
  ];

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Domain Weights</CardTitle>
        <p className="text-gray-400">Tune weights to your industry. They should sum to 1.0. Current total: <span className={Math.abs(total-1) < 0.001 ? 'text-green-300' : 'text-red-300'}>{total.toFixed(3)}</span></p>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        {fields.map(([k,label])=>(
          <div key={k}>
            <div className="text-sm text-gray-300 mb-1">{label}</div>
            <Input type="number" step="0.001" value={weights[k]} onChange={(e)=>set(k, e.target.value)} />
          </div>
        ))}
        <div className="mt-4 md:col-span-2">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full text-left text-sm px-3 py-2 rounded-md border border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/40 text-cyan-300"
              >
                Need help understanding the domain weights?
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <WeightsGuide />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
