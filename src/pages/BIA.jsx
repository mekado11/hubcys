import React, { useEffect, useState, useCallback } from "react";
import { Assessment } from "@/entities/Assessment";
import { BIA } from "@/entities/BIA";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, BarChart3, ExternalLink, Plus, Link2, Info, ChevronRight, FolderOpen, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { canAccessBIA, SUBSCRIPTION_TIERS } from "@/components/utils/subscriptionUtils";
import SubscriptionGate from "@/components/ui/SubscriptionGate";
import { computeBia } from "@/functions/computeBia";
import BIAMethodologyGuide from "@/components/bia/BIAMethodologyGuide";
import FAIRIntroBanner from "@/components/bia/FAIRIntroBanner";
import BIAWorkbench from "@/components/bia/BIAWorkbench";

export default function BIAPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [bias, setBias] = useState([]);
  const [selectedBiaId, setSelectedBiaId] = useState("");
  const [newBiaTitle, setNewBiaTitle] = useState("");

  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [linkedBias, setLinkedBias] = useState([]);
  const [selectedLinkedBiaId, setSelectedLinkedBiaId] = useState("");

  const [selectedBia, setSelectedBia] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [fairMetrics, setFairMetrics] = useState(null);
  const [industryBenchmarks, setIndustryBenchmarks] = useState(null);

  const [showWizard, setShowWizard] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [items, setItems] = useState([]);

  // ── Loaders ──
  const loadUser = useCallback(async () => {
    const me = await User.me();
    setUser(me);
    return me;
  }, []);

  const loadBIAs = useCallback(async (companyId) => {
    if (!companyId) { setBias([]); return; }
    const list = await BIA.filter({ company_id: companyId }, "-updated_date", 100);
    setBias(list || []);
  }, []);

  const loadAssessments = useCallback(async (companyId) => {
    if (!companyId) { setAssessments([]); return; }
    const list = await Assessment.filter({ company_id: companyId }, "-updated_date", 100);
    setAssessments(list || []);
  }, []);

  const loadLinkedBias = useCallback(async (assessmentId) => {
    if (!assessmentId || !user?.company_id) { setLinkedBias([]); return; }
    const list = await BIA.filter({ linked_assessment_id: assessmentId, company_id: user.company_id }, "-updated_date", 50);
    setLinkedBias(list || []);
  }, [user]);

  const loadBia = useCallback(async (biaId) => {
    if (!biaId) { setSelectedBia(null); setFairMetrics(null); setIndustryBenchmarks(null); return; }
    const rec = await BIA.get(biaId);
    setSelectedBia(rec);
    setFairMetrics(rec?.fair_metrics ? JSON.parse(rec.fair_metrics) : null);
    setIndustryBenchmarks(rec?.industry_benchmarks ? JSON.parse(rec.industry_benchmarks) : null);
  }, []);

  // Sync items ↔ selectedBia.bia_items
  useEffect(() => {
    if (selectedBia?.bia_items) {
      try { setItems(JSON.parse(selectedBia.bia_items)); } catch { setItems([]); }
    } else {
      setItems([]);
    }
    setShowWizard(false);
    setEditingItemIndex(null);
    setExpandedCardIndex(null);
  }, [selectedBia?.id]);

  useEffect(() => {
    if (!selectedBia) return;
    const newStr = JSON.stringify(items);
    if ((selectedBia.bia_items || "[]") !== newStr) {
      setSelectedBia(prev => ({ ...prev, bia_items: newStr }));
    }
  }, [items]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const me = await loadUser();
      if (me?.company_id) {
        await Promise.all([loadBIAs(me.company_id), loadAssessments(me.company_id)]);
      }
      setLoading(false);
    })();
  }, [loadUser, loadBIAs, loadAssessments]);

  // ── Item Handlers ──
  const handleEditItem = useCallback((itemToEdit) => {
    const idx = items.findIndex(i => i.id === itemToEdit.id);
    if (idx !== -1) { setEditingItemIndex(idx); setShowWizard(true); }
  }, [items]);

  const removeAt = useCallback((idx) => setItems(prev => prev.filter((_, i) => i !== idx)), []);

  const handleWizardComplete = useCallback((itemInputs) => {
    setItems(prev => {
      const updated = [...prev];
      if (editingItemIndex !== null && editingItemIndex < updated.length) {
        updated[editingItemIndex] = { ...updated[editingItemIndex], inputs: itemInputs };
      } else {
        updated.push({ id: Date.now().toString(), inputs: itemInputs, result: null });
      }
      return updated;
    });
    setShowWizard(false);
    setEditingItemIndex(null);
  }, [editingItemIndex]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!selectedBia) return;
    setSaving(true);
    try {
      if (selectedBia.id) {
        const updated = await BIA.update(selectedBia.id, { ...selectedBia, status: selectedBia.status || "draft" });
        setSelectedBia(updated);
        setSelectedBiaId(updated.id);
      } else {
        const created = await BIA.create({ ...selectedBia, status: "draft" });
        setSelectedBia(created);
        setSelectedBiaId(created.id);
      }
      await loadBIAs(user.company_id);
      if (selectedBia.linked_assessment_id) await loadLinkedBias(selectedAssessmentId);
    } finally {
      setSaving(false);
    }
  }, [selectedBia, user, selectedAssessmentId, loadBIAs, loadLinkedBias]);

  // ── Calculate ──
  const handleCalculate = async () => {
    if (!selectedBia?.id) { setCalculationError("Please save the BIA first."); return; }
    setCalculating(true);
    setCalculationError(null);
    try {
      const response = await computeBia({ biaId: selectedBia.id, assessmentId: selectedBia.linked_assessment_id || null });
      if (response.status === 200 && response.data) {
        const updatedBia = response.data.bia;
        setSelectedBia(updatedBia);
        setFairMetrics(updatedBia.fair_metrics ? JSON.parse(updatedBia.fair_metrics) : null);
        setIndustryBenchmarks(updatedBia.industry_benchmarks ? JSON.parse(updatedBia.industry_benchmarks) : null);
        if (updatedBia.linked_assessment_id) {
          setLinkedBias(prev => prev.map(b => b.id === updatedBia.id ? updatedBia : b));
        } else {
          setBias(prev => prev.map(b => b.id === updatedBia.id ? updatedBia : b));
        }
      } else {
        throw new Error(response.message || "Failed to calculate BIA");
      }
    } catch (error) {
      setCalculationError(error.message || "Failed to calculate BIA");
    } finally {
      setCalculating(false);
    }
  };

  const createNewBia = (linked = false) => {
    const now = new Date();
    setSelectedBia({
      company_id: user.company_id,
      title: newBiaTitle?.trim() || `BIA - ${now.toLocaleDateString()}`,
      description: "",
      scope: "",
      status: "draft",
      bia_items: "[]",
      fair_metrics: null,
      industry_benchmarks: null,
      ...(linked && selectedAssessmentId ? { linked_assessment_id: selectedAssessmentId } : {}),
    });
    setSelectedBiaId("");
    setSelectedLinkedBiaId("");
    setNewBiaTitle("");
    setFairMetrics(null);
    setIndustryBenchmarks(null);
  };

  // ── Guard: loading ──
  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-gray-400">Loading BIA...</p>
        </div>
      </div>
    );
  }

  // ── Guard: subscription ──
  if (!canAccessBIA(user?.subscription_tier)) {
    return (
      <div className="min-h-screen cyber-gradient p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold cyber-text-glow mb-2">Business Impact Analysis</h1>
          <SubscriptionGate currentTier={user?.subscription_tier} requiredTier={SUBSCRIPTION_TIERS.GROWTH} featureName="Business Impact Analysis" />
        </div>
      </div>
    );
  }

  const isLinked = !!(selectedBia?.linked_assessment_id);

  return (
    <div className="min-h-screen cyber-gradient p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mr-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Business Impact Analysis</h1>
              <p className="text-xs text-gray-400">FAIR-based quantitative risk calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedBia?.linked_assessment_id && (
              <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-300"
                onClick={() => window.open(createPageUrl(`ProfessionalReportView?id=${selectedBia.linked_assessment_id}`), "_blank")}>
                <ExternalLink className="w-4 h-4 mr-1" /> Open Assessment
              </Button>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                  <Info className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
                <DialogHeader><DialogTitle className="text-white">BIA Methodology & Calculations</DialogTitle></DialogHeader>
                <BIAMethodologyGuide />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── FAIR Intro Banner ── */}
        <FAIRIntroBanner />

        {/* ── Two-column selector panel ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Standalone */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Standalone BIA
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="New BIA title (optional)"
                value={newBiaTitle}
                onChange={(e) => setNewBiaTitle(e.target.value)}
                className="bg-slate-900/60 border-slate-600 text-white placeholder-gray-500 text-sm"
              />
              <Button
                onClick={() => createNewBia(false)}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {bias.length > 0 && (
              <Select
                value={selectedBiaId}
                onValueChange={async (v) => {
                  setSelectedBiaId(v);
                  setSelectedLinkedBiaId("");
                  await loadBia(v);
                }}
              >
                <SelectTrigger className="bg-slate-900/60 border-slate-600 text-white text-sm">
                  <FolderOpen className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Open existing BIA..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-gray-700 text-white max-h-60">
                  {bias.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title || "Untitled"} · {new Date(b.updated_date || b.created_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Linked to Assessment */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-purple-400" /> Link to Assessment
            </h2>
            <Select value={selectedAssessmentId} onValueChange={async (id) => {
              setSelectedAssessmentId(id);
              setSelectedLinkedBiaId("");
              setSelectedBia(null);
              setFairMetrics(null);
              setIndustryBenchmarks(null);
              await loadLinkedBias(id);
            }}>
              <SelectTrigger className="bg-slate-900/60 border-slate-600 text-white text-sm">
                <SelectValue placeholder="Choose an assessment..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-gray-700 text-white max-h-60">
                {assessments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.company_name} · {new Date(a.created_date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAssessmentId && (
              <div className="flex gap-2">
                <Button onClick={() => createNewBia(true)} size="sm" className="bg-purple-600 hover:bg-purple-700 shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> New
                </Button>
                {linkedBias.length > 0 && (
                  <Select value={selectedLinkedBiaId} onValueChange={async (v) => {
                    setSelectedLinkedBiaId(v);
                    setSelectedBiaId("");
                    await loadBia(v);
                  }}>
                    <SelectTrigger className="bg-slate-900/60 border-slate-600 text-white text-sm flex-1">
                      <SelectValue placeholder="Open linked BIA..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-gray-700 text-white max-h-60">
                      {linkedBias.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title || "Untitled"} · {new Date(b.updated_date || b.created_date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Active BIA label ── */}
        {selectedBia && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-sm text-gray-300">
              Editing: <span className="text-white font-semibold">{selectedBia.title || "Untitled BIA"}</span>
              {isLinked && <span className="ml-2 text-xs text-purple-400">(Linked to assessment)</span>}
            </p>
          </div>
        )}

        {/* ── Workbench ── */}
        {selectedBia ? (
          <BIAWorkbench
            selectedBia={selectedBia}
            setSelectedBia={setSelectedBia}
            items={items}
            showWizard={showWizard}
            setShowWizard={setShowWizard}
            editingItemIndex={editingItemIndex}
            setEditingItemIndex={setEditingItemIndex}
            expandedCardIndex={expandedCardIndex}
            setExpandedCardIndex={setExpandedCardIndex}
            handleEditItem={handleEditItem}
            removeAt={removeAt}
            handleWizardComplete={handleWizardComplete}
            handleSave={handleSave}
            handleCalculate={handleCalculate}
            saving={saving}
            calculating={calculating}
            fairMetrics={fairMetrics}
            industryBenchmarks={industryBenchmarks}
            calculationError={calculationError}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-300 font-semibold text-lg">No BIA selected</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">
              Create a new BIA or open an existing one from the panels above to get started.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}