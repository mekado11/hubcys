
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BIAIntro from "./BIAIntro";
import BIAHelperPanel from "./BIAHelperPanel";
import BIAQuestionBank from "./BIAQuestionBank";
import BIASummary from "./BIASummary";
import RiskRegister from "./RiskRegister";
import RemediationPlan from "./RemediationPlan";
import WhatIfModeler from "./WhatIfModeler";
import { runBIA } from "./biaEngine";
import { Loader2 } from "lucide-react";
import AssetTypeManager from "./AssetTypeManager";
// FIX: correct filename (was "./AssetTypeTypeSelect")
import AssetTypeSelect from "./AssetTypeSelect";
import { AssetType } from "@/entities/AssetType";
import { OrgUnit } from "@/entities/OrgUnit";
import { User } from "@/entities/User";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeBia } from "@/functions/computeBia";
import CriticalPiecesManager from "./CriticalPiecesManager";
import AggregatedRiskPanel from "./AggregatedRiskPanel";
import ScoreMeters from "./ScoreMeters";

// Add once near the top (after imports)
const normalizeDash = (v) => (typeof v === "string" ? v.replace(/\u2013|\u2014/g, "-") : v);
const toEnDash = (v) => (typeof v === "string" ? v.replace(/-/g, "–") : v);

export default function BIASection({ data, onUpdate }) {
  // Multi‑item state
  const parseItems = () => {
    try {
      if (data?.bia_items) {
        const arr = typeof data.bia_items === "string" ? JSON.parse(data.bia_items) : data.bia_items;
        if (Array.isArray(arr) && arr.length) {
          // normalize shape
          return arr.slice(0, 5).map((it, idx) => ({
            id: it.id || `item-${idx + 1}`,
            name: it.name || it.inputs?.bia_process_name || `Critical Piece ${idx + 1}`,
            type: it.type || it.inputs?.bia_process_type || "",
            inputs: it.inputs || {},
            result: it.result || null
          }));
        }
      }
    } catch {}
    // Seed from legacy single-input fields if present
    const seed = {
      bia_process_type: data.bia_process_type || "",
      bia_process_name: data.bia_process_name || "",
      bia_impact_time_to_hurt: data.bia_impact_time_to_hurt || "",
      bia_impact_revenue_loss_rate: data.bia_impact_revenue_loss_rate || "",
      bia_impact_revenue_loss_rate_override: data.bia_impact_revenue_loss_rate_override ?? null,
      bia_impact_contract_exposure: data.bia_impact_contract_exposure || "",
      bia_impact_ops_dependency_share: data.bia_impact_ops_dependency_share || "",
      bia_data_classification: data.bia_data_classification || "",
      bia_data_public_notice_required: data.bia_data_public_notice_required || "",
      bia_data_regulatory_exposure: data.bia_data_regulatory_exposure || "",
      bia_exposure_vendor_control: data.bia_exposure_vendor_control || "",
      bia_exposure_legacy_status: data.bia_exposure_legacy_status || "",
      bia_exposure_single_point_of_failure: data.bia_exposure_single_point_of_failure || "",
      bia_exposure_external_staff_access: data.bia_exposure_external_staff_access || "",
      bia_override_expected_downtime_hours: data.bia_override_expected_downtime_hours ?? null,
      bia_override_expected_incidents_per_year: data.bia_override_expected_incidents_per_year ?? null,
    };
    const hasLegacy = Object.values(seed).some(v => v !== "" && v !== null && v !== undefined);
    return [{
      id: "item-1",
      name: seed.bia_process_name || "Critical Piece 1",
      type: seed.bia_process_type || "",
      inputs: hasLegacy ? seed : {},
      result: null
    }];
  };

  const [items, setItems] = useState(parseItems);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [advanced, setAdvanced] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [agentRunning, setAgentRunning] = React.useState(false);
  const [agentOut, setAgentOut] = React.useState(null);

  // Add duplicate and reorder handlers
  const duplicateItem = useCallback(() => {
    setItems(prev => {
      if (prev.length >= 5) return prev;
      const src = prev[selectedIndex];
      const copy = {
        id: `item-${prev.length + 1}`,
        name: (src?.name ? `${src.name} (copy)` : `Critical Piece ${prev.length + 1}`),
        type: src?.type || "",
        inputs: { ...(src?.inputs || {}) },
        result: null
      };
      const next = [...prev, copy];
      return next;
    });
    setSelectedIndex(prevIdx => prevIdx + 1);
  }, [selectedIndex]);

  const removeAt = useCallback((indexToRemove) => {
    setItems(prev => {
      if (prev.length <= 1) return prev;
      const next = prev
        .filter((_, i) => i !== indexToRemove)
        .map((it, idx) => ({ ...it, id: `item-${idx + 1}` }));
      return next;
    });
    setSelectedIndex(prevSelectedIndex => {
      if (prevSelectedIndex === indexToRemove) {
        return Math.max(0, prevSelectedIndex - 1);
      } else if (prevSelectedIndex > indexToRemove) {
        return prevSelectedIndex - 1;
      }
      return prevSelectedIndex;
    });
  }, []);

  const reorderItems = useCallback((from, to) => {
    setItems(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr.map((it, i) => ({ ...it, id: `item-${i + 1}` }));
    });
    setSelectedIndex(prevSelectedIndex => (prevSelectedIndex === from ? to : prevSelectedIndex));
  }, []);

  const loadTypesAndOwners = useCallback(async () => {
    const me = await User.me();
    const [ts, ous] = await Promise.all([
      AssetType.filter({ company_id: me.company_id }, "order_index", 500),
      OrgUnit.filter({ company_id: me.company_id }, "order_index", 1000)
    ]);
    // Seed defaults for this company if none exist
    if (!ts || ts.length === 0) {
      const seeds = [
        { name: "Server", category: "IT", keywords: ["server","vm","baremetal"], order_index: 10 },
        { name: "Database", category: "Data_Store", keywords: ["db","postgres","mysql","sql"], order_index: 20 },
        { name: "Application", category: "Application", keywords: ["app","service","api"], order_index: 30 },
        { name: "Network", category: "Network", keywords: ["firewall","switch","router","network"], order_index: 40 },
        { name: "IAM", category: "Security", keywords: ["identity","okta","auth","sso","iam"], order_index: 50 },
        { name: "SCADA", category: "OT_ICS", keywords: ["scada","plc","ics"], order_index: 60 },
        { name: "MES", category: "OT_ICS", keywords: ["mes","manufacturing"], order_index: 70 },
        { name: "SaaS", category: "Cloud", keywords: ["saas"], order_index: 80 },
      ].map(s => ({ ...s, company_id: me.company_id, active: true, is_seed: true }));
      await AssetType.bulkCreate(seeds);
      const nts = await AssetType.filter({ company_id: me.company_id }, "order_index", 500);
      setAssetTypes(nts || []);
    } else {
      setAssetTypes(ts || []);
    }
    setOrgUnits(ous || []);
  }, []);

  useEffect(() => { loadTypesAndOwners(); }, [loadTypesAndOwners]);

  const selected = items[selectedIndex];
  const inputs = useMemo(() => ({
    bia_process_type: selected?.inputs?.bia_process_type || "",
    bia_process_name: selected?.inputs?.bia_process_name || "",
    bia_impact_time_to_hurt: selected?.inputs?.bia_impact_time_to_hurt || "",
    bia_impact_revenue_loss_rate: selected?.inputs?.bia_impact_revenue_loss_rate || "",
    bia_impact_revenue_loss_rate_override: selected?.inputs?.bia_impact_revenue_loss_rate_override ?? null,
    bia_impact_contract_exposure: selected?.inputs?.bia_impact_contract_exposure || "",
    bia_impact_ops_dependency_share: selected?.inputs?.bia_impact_ops_dependency_share || "",
    bia_data_classification: selected?.inputs?.bia_data_classification || "",
    bia_data_public_notice_required: selected?.inputs?.bia_data_public_notice_required || "",
    bia_data_regulatory_exposure: selected?.inputs?.bia_data_regulatory_exposure || "",
    bia_exposure_vendor_control: selected?.inputs?.bia_exposure_vendor_control || "",
    bia_exposure_legacy_status: selected?.inputs?.bia_exposure_legacy_status || "",
    bia_exposure_single_point_of_failure: selected?.inputs?.bia_exposure_single_point_of_failure || "",
    bia_exposure_external_staff_access: selected?.inputs?.bia_exposure_external_staff_access || "",
    bia_override_expected_downtime_hours: selected?.inputs?.bia_override_expected_downtime_hours ?? null,
    bia_override_expected_incidents_per_year: selected?.inputs?.bia_override_expected_incidents_per_year ?? null,
  }), [selected]);

  const updateInput = useCallback((field, value) => {
    setItems(prev => {
      const copy = [...prev];
      const curr = { ...copy[selectedIndex] };
      curr.inputs = { ...curr.inputs, [field]: value };
      if (field === "bia_process_name") curr.name = value || curr.name;
      if (field === "bia_process_type") curr.type = value || curr.type;
      copy[selectedIndex] = curr;
      return copy;
    });
  }, [selectedIndex]);

  // Suggested type from name/keywords
  const suggestedType = useMemo(() => {
    const nm = (inputs.bia_process_name || "").toLowerCase();
    if (!nm || !assetTypes?.length) return "";
    let best = "";
    let score = 0;
    assetTypes.forEach(t => {
      if (t.active === false) return;
      const kws = (t.keywords || []).map(k => String(k).toLowerCase());
      const hits = kws.filter(k => k && nm.includes(k)).length;
      if (hits > score && hits > 0) { score = hits; best = t.name; }
    });
    return best;
  }, [inputs.bia_process_name, assetTypes]);

  // If empty type and we have a strong suggestion, we can auto-apply once (non-destructive)
  useEffect(() => {
    if (!inputs.bia_process_type && suggestedType) {
      // do not auto-set, just offer via UI (below). Keeping UX gentle.
    }
  }, [inputs, suggestedType]);

  const ready1 = inputs.bia_impact_time_to_hurt && inputs.bia_impact_revenue_loss_rate && inputs.bia_impact_contract_exposure && inputs.bia_impact_ops_dependency_share && (inputs.bia_process_name || "").length > 0;
  const ready2 = inputs.bia_data_classification && inputs.bia_data_public_notice_required && inputs.bia_data_regulatory_exposure;
  const ready3 = inputs.bia_exposure_vendor_control && inputs.bia_exposure_legacy_status && inputs.bia_exposure_single_point_of_failure && inputs.bia_exposure_external_staff_access;

  const selectedTypeProfile = useMemo(() => {
    const t = assetTypes.find(a => a.name === inputs.bia_process_type);
    return t || null;
  }, [assetTypes, inputs.bia_process_type]);

  const result = useMemo(() => {
    if (ready1 && ready2 && ready3) return runBIA(inputs, selectedTypeProfile?.risk_profile || null);
    return null;
  }, [inputs, ready1, ready2, ready3, selectedTypeProfile]);

  // Prepare a view model for child components that expect en-dash ranges
  const inputsForChild = useMemo(() => {
    return {
      ...inputs,
      // ensure we pass this field as-is so it matches SelectItem values
      bia_impact_ops_dependency_share: inputs.bia_impact_ops_dependency_share || ""
    };
  }, [inputs]);

  // Persist all items (compute results for any that are complete)
  const persistAll = () => {
    // Build a clean array (max 5)
    const computed = items.slice(0, 5).map((it) => {
      let res = it.result;
      const inp = it.inputs || {};
      const haveAll =
        inp.bia_impact_time_to_hurt && inp.bia_impact_revenue_loss_rate && inp.bia_impact_contract_exposure &&
        inp.bia_impact_ops_dependency_share && inp.bia_data_classification && inp.bia_data_public_notice_required &&
        inp.bia_data_regulatory_exposure && inp.bia_exposure_vendor_control && inp.bia_exposure_legacy_status &&
        inp.bia_exposure_single_point_of_failure && inp.bia_exposure_external_staff_access && (inp.bia_process_name || "");
      if (haveAll) {
        const tp = assetTypes.find(a => a.name === inp.bia_process_type) || null;
        res = runBIA(inp, tp?.risk_profile || null);
      }
      return { id: it.id, name: it.name, type: it.type, inputs: inp, result: res || null };
    });

    // Save to assessment as JSON array
    onUpdate("bia_items", JSON.stringify(computed));
    onUpdate("bia_enabled", true);

    // Backward-compat: reflect currently selected item's computed values into legacy single fields
    if (result) {
      onUpdate("bia_inputs", JSON.stringify(inputs));
      onUpdate("bia_composite_impact", result.impact);
      onUpdate("bia_likelihood", result.likelihood);
      onUpdate("bia_risk_score", result.riskScore);
      onUpdate("bia_financials", JSON.stringify({ ale: result.annualizedLoss }));
      onUpdate("bia_rto_hours", result.rtoHours);
      onUpdate("bia_rpo_hours", result.rpoHours);
      onUpdate("bia_risk_register", result.topDrivers);
      onUpdate("bia_last_calculated_date", new Date().toISOString());
    }

    alert("BIA results saved. Click Save Draft to persist your assessment.");
  };

  const addItem = useCallback(() => {
    if (items.length >= 5) return;
    setItems(prev => [...prev, {
      id: `item-${prev.length + 1}`,
      name: `Critical Piece ${prev.length + 1}`,
      type: "",
      inputs: {},
      result: null
    }]);
    setSelectedIndex(items.length);
  }, [items.length]);

  // Inputs/top step guidance
  const tips = [
    { title: "Vendor/foreign control", body: "Any external/foreign party controlling core components or data raises likelihood." },
    { title: "Legacy/EOL", body: "Mixed legacy or EOL core systems materially increase incident likelihood." },
    { title: "Single point of failure", body: "No failover or unknown redundancy increases likelihood." },
    { title: "External staff access", body: "Privileged non-employees without strong oversight increase likelihood." },
  ];

  return (
    <div className="space-y-6">
      <BIAIntro currentStep={step} />

      {/* Multi-asset manager (drag, select, duplicate, delete) */}
      <CriticalPiecesManager
        items={items}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onAdd={addItem}
        onDuplicate={duplicateItem}
        onRemove={removeAt}
        onReorder={reorderItems}
      />

      {/* Edit basic identity for selected piece */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <AssetTypeSelect
            types={assetTypes}
            value={inputs.bia_process_type}
            onChange={(v) => updateInput("bia_process_type", v)}
            onManage={() => setShowTypeManager(true)}
            suggested={suggestedType}
          />
          {selectedTypeProfile?.linked_org_unit_id && (
            <div className="text-xs text-slate-400 mt-1">
              Owner: {orgUnits.find(u=>u.id===selectedTypeProfile.linked_org_unit_id)?.name || "—"}
            </div>
          )}
        </div>
        <div>
          <Label className="text-xs text-gray-400">Name / Identifier</Label>
          <Input
            className="bg-slate-800/50 border-gray-600 text-white mt-1"
            value={inputs.bia_process_name}
            onChange={(e)=>updateInput("bia_process_name", e.target.value)}
            placeholder="e.g., Order Processing System"
          />
        </div>
      </div>

      <AssetTypeManager
        open={showTypeManager}
        onOpenChange={setShowTypeManager}
        onAfterSave={loadTypesAndOwners}
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr]">
        {/* HOW TO + overrides panel */}
        <div className="md:sticky md:top-4 self-start">
          <BIAHelperPanel
            tips={tips}
            showAdvanced={advanced}
            onToggleAdvanced={setAdvanced}
            overrides={{
              downtime_hours: inputs.bia_override_expected_downtime_hours ?? "",
              incidents_per_year: inputs.bia_override_expected_incidents_per_year ?? "",
              revenue_rate_override: inputs.bia_impact_revenue_loss_rate_override ?? ""
            }}
            onChangeOverride={(key, val) => {
              if (key === "downtime_hours") updateInput("bia_override_expected_downtime_hours", val);
              if (key === "incidents_per_year") updateInput("bia_override_expected_incidents_per_year", val);
              if (key === "revenue_rate_override") updateInput("bia_impact_revenue_loss_rate_override", val);
            }}
          />
        </div>

        <div className="space-y-6">
          {/* Question bank bound to selected item */}
          <BIAQuestionBank
            currentStep={step}
            data={inputsForChild}
            onUpdate={(field, val) => updateInput(field, normalizeDash(val))}
          />

          <div className="flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={()=>setStep(step-1)} className="border-gray-600 text-gray-300 hover:bg-gray-800">Back</Button>
            ) : <div />}
            {step < 3 ? (
              <Button
                onClick={()=>setStep(step+1)}
                disabled={(step===1 && !ready1) || (step===2 && !ready2)}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
              >
                Next
              </Button>
            ) : (
              <Button onClick={persistAll} disabled={!result} className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700">
                Save BIA to Assessment
              </Button>
            )}
          </div>

          {/* Aggregated panel across all critical pieces */}
          <AggregatedRiskPanel items={items} assetTypes={assetTypes} />

          {/* AI BIA Agent Panel */}
          <Card className="glass-effect border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-300">AI BIA Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-300">
                Generate machine-readable JSON and a business-friendly report using your current inputs.
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    setAgentRunning(true);
                    setAgentOut(null);
                    const payload = {
                      process_name: inputs.bia_process_name || selected?.name || "Critical Process",
                      bia_process_type: inputs.bia_process_type || selected?.type || "Process",
                      inputs
                    };
                    const { data } = await computeBia(payload);
                    setAgentOut(data);
                    setAgentRunning(false);
                  }}
                  disabled={agentRunning || !(ready1 && ready2)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {agentRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running…</> : 'Run BIA Agent'}
                </Button>
                {agentOut?.bia_json && (
                  <Button
                    variant="outline"
                    className="border-cyan-500/40 text-cyan-300"
                    onClick={() => {
                      // Persist key metrics back to record for reuse in reports
                      const calc = agentOut.bia_json.calculations || {};
                      onUpdate("bia_financials", JSON.stringify({ ale: calc.annualized_loss_expectancy, sle: calc.single_loss_expectancy, downtime_cost: calc.downtime_cost }));
                      onUpdate("bia_risk_score", (calc.rto_hours && calc.rto_hours) ? (calc.rto_hours + calc.rto_hours) / 2 : 0); // simple tie-in
                      onUpdate("bia_rto_hours", calc.rto_hours);
                      onUpdate("bia_rpo_hours", calc.rpo_hours);
                      onUpdate("bia_last_calculated_date", new Date().toISOString());
                      alert("Agent results saved into this BIA record fields.");
                    }}
                  >
                    Save Agent Results
                  </Button>
                )}
              </div>

              {agentOut?.bia_report_md && (
                <div className="mt-4 p-4 rounded-md border border-slate-700 bg-slate-900/40">
                  <ReactMarkdown
                    className="prose prose-invert bia-markdown max-w-none"
                    components={{
                      p: ({children}) => <p className="leading-relaxed">{children}</p>,
                      li: ({children}) => <li className="leading-relaxed">{children}</li>,
                      code: ({children}) => (
                        <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs">{children}</code>
                      ),
                      pre: ({children}) => (
                        <pre className="bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">{children}</pre>
                      ),
                      h2: ({children}) => <h2 className="text-lg font-semibold text-cyan-300 mt-4 mb-2">{children}</h2>,
                      h3: ({children}) => <h3 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h3>,
                      strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                    }}
                  >
                    {agentOut.bia_report_md}
                  </ReactMarkdown>
                </div>
              )}

              {agentOut?.bia_json && (
                <div className="mt-4">
                  <div className="text-xs text-slate-400 mb-2">bia_json</div>
                  <pre className="text-xs bg-slate-800/70 border border-slate-700 rounded-md p-3 overflow-auto max-h-64">
                    {JSON.stringify(agentOut.bia_json, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {result && step === 3 && (
            <>
              <ScoreMeters
                impact={result.impact}
                likelihood={result.likelihood}
                riskScore={result.riskScore}
              />

              <BIASummary result={result} />

              <RiskRegister
                topDrivers={result.topDrivers}
                impact={result.impact}
                likelihood={result.likelihood}
                riskScore={result.riskScore}
                annualizedLoss={result.annualizedLoss}
              />

              <RemediationPlan
                impact={result.impact}
                likelihood={result.likelihood}
                topDrivers={result.topDrivers}
                actionPlan={result.actionPlan}
                assessmentId={data?.id}
              />

              <WhatIfModeler
                baselineImpact={result.impact}
                baselineLikelihood={result.likelihood}
                baselineAnnualizedLoss={result.annualizedLoss}
                inputs={inputs}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
