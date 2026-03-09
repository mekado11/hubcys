import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, Plus, Save, Zap, Target, ChevronRight,
  DollarSign, Clock, AlertTriangle, BarChart3
} from "lucide-react";
import BIACard from "./BIACard";
import StreamlinedBIAWizard from "./StreamlinedBIAWizard";
import FAIRMetricsDisplay from "./FAIRMetricsDisplay";
import EnhancedBIASummary from "./EnhancedBIASummary";

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BIAWorkbench({
  selectedBia,
  setSelectedBia,
  items,
  showWizard,
  setShowWizard,
  editingItemIndex,
  setEditingItemIndex,
  expandedCardIndex,
  setExpandedCardIndex,
  handleEditItem,
  removeAt,
  handleWizardComplete,
  handleSave,
  handleCalculate,
  saving,
  calculating,
  fairMetrics,
  industryBenchmarks,
  calculationError,
}) {
  const canCalculate = selectedBia?.id && items.length > 0;

  return (
    <div className="space-y-5">

      {/* ── Step 1: BIA Details ── */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">1</span>
          Name & Scope
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">BIA Title</label>
            <Input
              value={selectedBia.title || ""}
              onChange={(e) => setSelectedBia((p) => ({ ...p, title: e.target.value }))}
              className="bg-slate-900/70 border-slate-600 text-white placeholder-gray-500"
              placeholder="e.g., Q2 2026 Risk Assessment"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Scope</label>
            <Input
              value={selectedBia.scope || ""}
              onChange={(e) => setSelectedBia((p) => ({ ...p, scope: e.target.value }))}
              placeholder="e.g., Engineering, IT, DevOps, Cyber"
              className="bg-slate-900/70 border-slate-600 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* ── Step 2: Critical Functions ── */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">2</span>
            Critical Functions
            {items.length > 0 && (
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 ml-1">
                {items.length}
              </Badge>
            )}
          </p>
          <Button
            onClick={() => { setEditingItemIndex(null); setShowWizard(true); }}
            size="sm"
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Function
          </Button>
        </div>

        {items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-cyan-500/40 hover:bg-slate-900/30 transition-all"
            onClick={() => { setEditingItemIndex(null); setShowWizard(true); }}
          >
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
              <Plus className="w-7 h-7 text-gray-500" />
            </div>
            <p className="text-gray-300 font-semibold">Add your first critical function</p>
            <p className="text-gray-500 text-sm mt-1">Tap anywhere here or click "Add Function" above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <BIACard
                key={item.id}
                item={item}
                index={idx}
                onEdit={handleEditItem}
                onDelete={removeAt}
                onExpand={() => setExpandedCardIndex(expandedCardIndex === idx ? null : idx)}
                isExpanded={expandedCardIndex === idx}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Step 3: Calculate ── */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">3</span>
          Run Analysis
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            className="border-slate-600 text-gray-300 hover:bg-slate-700 w-full sm:w-auto"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save BIA</>
            )}
          </Button>

          <Button
            onClick={handleCalculate}
            disabled={calculating || !canCalculate}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold w-full sm:w-auto min-w-[180px] shadow-lg shadow-orange-900/30"
          >
            {calculating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculating...</>
            ) : (
              <><Zap className="w-5 h-5 mr-2" />Calculate BIA<ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>

          {!selectedBia.id && items.length > 0 && (
            <p className="text-amber-400 text-xs">Save first, then calculate.</p>
          )}
          {selectedBia.id && items.length === 0 && (
            <p className="text-gray-500 text-xs">Add at least one function to calculate.</p>
          )}
        </div>

        {calculationError && (
          <p className="mt-3 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
            {calculationError}
          </p>
        )}
      </div>

      {/* ── Results (auto-appear after calculation) ── */}
      {fairMetrics && (
        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              FAIR Risk Analysis Results
            </h2>
            <Button
              onClick={handleCalculate}
              disabled={calculating || !canCalculate}
              variant="outline"
              size="sm"
              className="border-orange-500/40 text-orange-300 hover:bg-orange-500/10"
            >
              {calculating ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Recalculating...</>
              ) : (
                <><Zap className="w-3 h-3 mr-1" />Recalculate</>
              )}
            </Button>
          </div>

          <FAIRMetricsDisplay fairMetrics={fairMetrics} />

          {industryBenchmarks && (
            <div className="bg-slate-800/40 border border-purple-500/20 rounded-xl p-5">
              <h3 className="text-purple-300 font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Industry Benchmarks
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: "Avg Breach Frequency",
                    value: `${(industryBenchmarks.avg_breach_frequency * 100).toFixed(1)}%`,
                    sub: "per year",
                    icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
                  },
                  {
                    label: "Cost per Record",
                    value: `$${industryBenchmarks.avg_cost_per_record}`,
                    icon: <DollarSign className="w-4 h-4 text-green-400" />,
                  },
                  {
                    label: "Downtime Cost/Hr",
                    value: formatCurrency(industryBenchmarks.avg_downtime_cost_per_hour),
                    icon: <Clock className="w-4 h-4 text-cyan-400" />,
                  },
                  {
                    label: "Ransomware Risk",
                    value: `${(industryBenchmarks.ransomware_likelihood * 100).toFixed(1)}%`,
                    icon: <Target className="w-4 h-4 text-red-400" />,
                  },
                ].map(({ label, value, sub, icon }) => (
                  <div key={label} className="bg-slate-900/60 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      {icon}
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                    <p className="text-lg font-bold text-white">{value}</p>
                    {sub && <p className="text-xs text-gray-500">{sub}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Risk Analysis by Asset</h3>
            {(() => {
              const parsed = selectedBia.bia_items ? JSON.parse(selectedBia.bia_items) : [];
              return parsed.map((item, idx) => (
                <EnhancedBIASummary key={item.id || idx} item={item} />
              ));
            })()}
          </div>
        </div>
      )}

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingItemIndex !== null ? "Edit Critical Function" : "Add Critical Function"}
            </DialogTitle>
          </DialogHeader>
          <StreamlinedBIAWizard
            initialData={editingItemIndex !== null ? items[editingItemIndex]?.inputs : undefined}
            onComplete={handleWizardComplete}
            onCancel={() => { setShowWizard(false); setEditingItemIndex(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}