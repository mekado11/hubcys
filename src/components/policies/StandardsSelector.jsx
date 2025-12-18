import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const FRAMEWORK_CATALOG = {
  NIST_CSF: {
    label: "NIST Cybersecurity Framework",
    controls: ["ID.AM-1", "ID.GV-1", "PR.AC-1", "PR.DS-1", "DE.CM-1", "RS.RP-1", "RC.IM-1"],
  },
  ISO_27001: {
    label: "ISO/IEC 27001 / 27002",
    controls: ["A.5.1", "A.6.1", "A.9.2", "A.12.4", "A.16.1", "A.18.1"],
  },
  SOC_2: {
    label: "SOC 2 Trust Services Criteria",
    controls: ["CC1.1", "CC6.1", "CC6.2", "CC7.2", "CC8.1"],
  },
  CIS_Controls: {
    label: "CIS Critical Security Controls",
    controls: ["CIS 1", "CIS 3", "CIS 6", "CIS 13", "CIS 17"],
  },
};

export default function StandardsSelector({ value, onChange }) {
  const selected = value || { frameworks: [], mappings: {} };

  const toggleFramework = (fw) => {
    const frameworks = new Set(selected.frameworks);
    const mappings = { ...(selected.mappings || {}) };
    if (frameworks.has(fw)) {
      frameworks.delete(fw);
      delete mappings[fw];
    } else {
      frameworks.add(fw);
      mappings[fw] = [...FRAMEWORK_CATALOG[fw].controls];
    }
    onChange({ frameworks: Array.from(frameworks), mappings });
  };

  const toggleControl = (fw, control, checked) => {
    const mappings = { ...(selected.mappings || {}) };
    const list = new Set(mappings[fw] || []);
    if (checked) list.add(control);
    else list.delete(control);
    mappings[fw] = Array.from(list);
    onChange({ frameworks: selected.frameworks, mappings });
  };

  return (
    <Card className="glass-effect border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white">Standards Alignment</CardTitle>
        <p className="text-gray-400 text-sm">
          Select standards and specific controls to align the generated policy with recognized best practices.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(FRAMEWORK_CATALOG).map(([fw, meta]) => (
            <div key={fw} className="p-3 rounded-lg border border-gray-700/50 bg-slate-800/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`fw_${fw}`}
                    checked={selected.frameworks.includes(fw)}
                    onCheckedChange={() => toggleFramework(fw)}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-500"
                  />
                  <Label htmlFor={`fw_${fw}`} className="text-white font-medium cursor-pointer">
                    {meta.label}
                  </Label>
                </div>
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {fw.replace("_", " ")}
                </Badge>
              </div>

              {selected.frameworks.includes(fw) && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {meta.controls.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm text-gray-200">
                      <Checkbox
                        checked={(selected.mappings[fw] || []).includes(c)}
                        onCheckedChange={(checked) => toggleControl(fw, c, checked)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-500"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {selected.frameworks.length > 0 && (
          <div className="text-xs text-gray-400">
            Tip: These selections will be embedded in the policy under a Standards Alignment section and influence the AI output.
          </div>
        )}
      </CardContent>
    </Card>
  );
}