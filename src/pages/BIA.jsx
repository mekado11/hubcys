import React, { useEffect, useState, useCallback } from "react";
import { Assessment } from "@/entities/Assessment";
import { BIA } from "@/entities/BIA";
import { User } from "@/entities/User";
// import BIASection from "../components/bia/BIASection"; // Removed: Replaced with new components
import SimpleBIAWizard from "../components/bia/SimpleBIAWizard";
import BIACard from "../components/bia/BIACard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, BarChart3, ExternalLink, Plus, Save as SaveIcon, Link2, Target, Info } from "lucide-react";
import { createPageUrl } from "@/utils";
import { canAccessBIA, SUBSCRIPTION_TIERS } from "@/components/utils/subscriptionUtils";
import SubscriptionGate from "@/components/ui/SubscriptionGate";
import FAIRMetricsDisplay from "@/components/bia/FAIRMetricsDisplay";
import EnhancedBIASummary from "@/components/bia/EnhancedBIASummary";
import { computeBia } from "@/functions/computeBia";
import BIAMethodologyGuide from "@/components/bia/BIAMethodologyGuide";
import FAIRIntroBanner from "@/components/bia/FAIRIntroBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BIAPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  // Standalone BIAs
  const [bias, setBias] = useState([]);
  const [selectedBiaId, setSelectedBiaId] = useState("");
  const [newBiaTitle, setNewBiaTitle] = useState("");

  // Linked-to-Assessment
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [linkedBias, setLinkedBias] = useState([]);
  const [selectedLinkedBiaId, setSelectedLinkedBiaId] = useState("");

  // The BIA currently being viewed/edited/calculated, regardless of standalone or linked origin
  const [selectedBia, setSelectedBia] = useState(null);

  // Calculation & Display States
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [fairMetrics, setFairMetrics] = useState(null);
  const [industryBenchmarks, setIndustryBenchmarks] = useState(null);
  const [currentView, setCurrentView] = useState('workbench'); // 'workbench' or 'results'
  const [activeTabValue, setActiveTabValue] = useState('standalone'); // Tracks the active tab

  // New states for the item management UI
  const [showWizard, setShowWizard] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null); // Index of item being edited in `items` array
  const [expandedCardIndex, setExpandedCardIndex] = useState(null); // Index of currently expanded BIACard
  const [items, setItems] = useState([]); // This will hold the parsed array of BIA items for UI manipulation

  // Helper for currency formatting
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loaders
  const loadUser = useCallback(async () => {
    const me = await User.me();
    setUser(me);
    return me; // Return user to use its company_id immediately
  }, []);

  const loadBIAs = useCallback(async (companyId) => {
    if (!companyId) {
      setBias([]);
      return;
    }
    const list = await BIA.filter({ company_id: companyId }, "-updated_date", 100);
    setBias(list || []);
  }, []);

  const loadAssessments = useCallback(async (companyId) => {
    if (!companyId) {
      setAssessments([]);
      return;
    }
    const list = await Assessment.filter({ company_id: companyId }, "-updated_date", 100);
    setAssessments(list || []);
  }, []);

  const loadLinkedBias = useCallback(async (assessmentId) => {
    if (!assessmentId || !user?.company_id) { // Ensure company_id is present
      setLinkedBias([]);
      return;
    }
    const list = await BIA.filter({ linked_assessment_id: assessmentId, company_id: user.company_id }, "-updated_date", 50);
    setLinkedBias(list || []);
  }, [user]); // Add user to dependency array

  // Modified loadBia to load into selectedBia state and extract FAIR metrics/benchmarks
  const loadBia = useCallback(async (biaId) => {
    if (!biaId) {
      setSelectedBia(null);
      setFairMetrics(null);
      setIndustryBenchmarks(null);
      setCurrentView('workbench');
      return;
    }
    const rec = await BIA.get(biaId);
    setSelectedBia(rec);
    setFairMetrics(rec?.fair_metrics ? JSON.parse(rec.fair_metrics) : null);
    setIndustryBenchmarks(rec?.industry_benchmarks ? JSON.parse(rec.industry_benchmarks) : null);
    setCurrentView('workbench'); // Default to workbench when loading an existing BIA
  }, []);

  // Effect to parse selectedBia.bia_items into 'items' state when selectedBia changes
  useEffect(() => {
    if (selectedBia?.bia_items) {
      try {
        setItems(JSON.parse(selectedBia.bia_items));
      } catch (e) {
        console.error("Failed to parse bia_items:", e);
        setItems([]);
      }
    } else {
      setItems([]);
    }
    // Reset wizard/card states when a new BIA is loaded or cleared
    setShowWizard(false);
    setEditingItemIndex(null);
    setExpandedCardIndex(null);
  }, [selectedBia]);

  // Effect to update selectedBia.bia_items when 'items' state changes
  useEffect(() => {
    if (!selectedBia) return;
    
    const currentBiaItemsString = selectedBia.bia_items || "[]";
    const newItemsString = JSON.stringify(items);

    if (currentBiaItemsString !== newItemsString) {
      setSelectedBia(prev => ({
        ...prev,
        bia_items: newItemsString
      }));
    }
  }, [items]); // Only depend on items to avoid infinite loop

  // Init
  useEffect(() => {
    (async () => {
      setLoading(true);
      const currentUser = await loadUser(); // Wait for user to load
      if (currentUser?.company_id) {
        await Promise.all([loadBIAs(currentUser.company_id), loadAssessments(currentUser.company_id)]);
      }
      setLoading(false);
    })();
  }, [loadUser, loadBIAs, loadAssessments]);

  // Handlers - Item Management
  const handleEditItem = useCallback((itemToEdit) => {
    const idx = items.findIndex(item => item.id === itemToEdit.id);
    if (idx !== -1) {
      setEditingItemIndex(idx);
      setShowWizard(true);
    }
  }, [items]); // `items` is a dependency because `findIndex` operates on it

  const removeAt = useCallback((indexToRemove) => {
    setItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  }, []);

  const handleWizardComplete = useCallback((itemInputs) => {
    setItems(prev => {
      const updated = [...prev];
      if (editingItemIndex !== null && editingItemIndex < updated.length) {
        updated[editingItemIndex] = {
          ...updated[editingItemIndex],
          inputs: itemInputs,
        };
      } else {
        updated.push({
          id: Date.now().toString(),
          inputs: itemInputs,
          result: null
        });
      }
      return updated;
    });
    setShowWizard(false);
    setEditingItemIndex(null);
    triggerAutoSave();
  }, [editingItemIndex]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      if (selectedBia?.id) {
        handleSaveBia();
      }
    }, 2000);
    setAutoSaveTimer(timer);
  }, [autoSaveTimer, selectedBia]);

  // Handlers - Standalone
  const handleCreateStandalone = async () => {
    if (!user?.company_id) return;
    const now = new Date();
    const title = newBiaTitle?.trim() || `New BIA - ${now.toLocaleDateString()}`;

    const draft = {
      company_id: user.company_id,
      title,
      description: "",
      scope: "",
      status: "draft",
      bia_items: "[]", // New BIA starts with an empty array of items
      fair_metrics: null, // New BIA starts without results
      industry_benchmarks: null, // New BIA starts without results
    };
    setSelectedBia(draft);
    setSelectedBiaId(""); // No ID yet, it's a draft
    setNewBiaTitle("");
    setFairMetrics(null); // Clear metrics for new draft
    setIndustryBenchmarks(null);
    setCurrentView('workbench'); // Always start new BIA in workbench view
  };

  const handleSaveStandalone = async () => {
    if (!selectedBia) return;
    setSaving(true);
    try {
      if (selectedBia.id) { // If it has an ID, update it
        const updated = await BIA.update(selectedBia.id, {
          ...selectedBia,
          status: selectedBia.status || "draft",
          bia_last_calculated_date: new Date().toISOString()
        });
        setSelectedBia(updated); // Update selectedBia with the saved version
        setSelectedBiaId(updated.id);
      } else { // No ID, create new
        const created = await BIA.create({
          ...selectedBia,
          status: selectedBia.status || "draft",
          bia_last_calculated_date: new Date().toISOString()
        });
        setSelectedBia(created); // Update selectedBia with the created version
        setSelectedBiaId(created.id);
      }
      await loadBIAs(user.company_id); // Refresh the list of standalone BIAs, passing companyId
    } finally {
      setSaving(false);
    }
  };

  // Handlers - Linked
  const handleSelectAssessment = async (id) => {
    setSelectedAssessmentId(id);
    setSelectedLinkedBiaId(""); // Clear previously selected linked BIA
    setSelectedBia(null); // Clear active selected BIA when assessment changes
    setFairMetrics(null);
    setIndustryBenchmarks(null);
    setCurrentView('workbench');
    await loadLinkedBias(id);
  };

  const handleCreateLinked = async () => {
    if (!user?.company_id || !selectedAssessmentId) return;
    const now = new Date();
    const title = `BIA for Assessment ${now.toLocaleDateString()}`;

    const draft = {
      company_id: user.company_id,
      title,
      description: "",
      scope: "",
      status: "draft",
      linked_assessment_id: selectedAssessmentId,
      bia_items: "[]", // New BIA starts with an empty array of items
      fair_metrics: null, // New BIA starts without results
      industry_benchmarks: null, // New BIA starts without results
    };
    setSelectedBia(draft);
    setSelectedLinkedBiaId(""); // No ID yet, it's a draft
    setFairMetrics(null); // Clear metrics for new draft
    setIndustryBenchmarks(null);
    setCurrentView('workbench'); // Always start new BIA in workbench view
  };

  const handleSaveLinked = async () => {
    if (!selectedBia) return;
    setSaving(true);
    try {
      if (selectedBia.id) { // If it has an ID, update it
        const updated = await BIA.update(selectedBia.id, {
          ...selectedBia,
          status: selectedBia.status || "draft",
          bia_last_calculated_date: new Date().toISOString()
        });
        setSelectedBia(updated); // Update selectedBia with the saved version
        setSelectedLinkedBiaId(updated.id);
      } else { // No ID, create new
        const created = await BIA.create({
          ...selectedBia,
          status: selectedBia.status || "draft",
          bia_last_calculated_date: new Date().toISOString()
        });
        setSelectedBia(created); // Update selectedBia with the created version
        setSelectedLinkedBiaId(created.id);
      }
      await loadLinkedBias(selectedAssessmentId); // Refresh the list of linked BIAs
    } finally {
      setSaving(false);
    }
  };

  // New handleCalculate function
  const handleCalculate = async () => {
    if (!selectedBia?.id) {
      setCalculationError("Please save the BIA before calculating.");
      return;
    }
    
    setCalculating(true);
    setCalculationError(null);

    try {
      const assessmentIdForCalculation = selectedBia.linked_assessment_id || null;

      const response = await computeBia({
        biaId: selectedBia.id,
        assessmentId: assessmentIdForCalculation
      });

      if (response.status === 200 && response.data) {
        const updatedBia = response.data.bia;
        
        setSelectedBia(updatedBia); // Update the selected BIA itself
        
        // Update the list where the BIA belongs, for display in the select dropdowns
        if (updatedBia.linked_assessment_id) {
          setLinkedBias(prev => prev.map(b => b.id === updatedBia.id ? updatedBia : b));
        } else {
          setBias(prev => prev.map(b => b.id === updatedBia.id ? updatedBia : b));
        }

        setFairMetrics(updatedBia.fair_metrics ? JSON.parse(updatedBia.fair_metrics) : null);
        setIndustryBenchmarks(updatedBia.industry_benchmarks ? JSON.parse(updatedBia.industry_benchmarks) : null);
        
        setCurrentView('results'); // Switch to results view after successful calculation
      } else {
        throw new Error(response.message || 'Failed to calculate BIA');
      }
    } catch (error) {
      console.error('BIA calculation error:', error);
      setCalculationError(error.message || 'Failed to calculate BIA');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p>Loading BIA...</p>
        </div>
      </div>
    );
  }

  // Add subscription check
  if (!canAccessBIA(user?.subscription_tier)) {
    return (
      <div className="min-h-screen cyber-gradient p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold cyber-text-glow mb-2">Business Impact Analysis</h1>
            <p className="text-gray-400">Quantify business risks and get precise recovery recommendations</p>
          </div>
          
          <SubscriptionGate
            currentTier={user?.subscription_tier}
            requiredTier={SUBSCRIPTION_TIERS.GROWTH}
            featureName="Business Impact Analysis"
            description="Our comprehensive BIA module helps you quantify business risks, calculate financial impacts, and determine optimal RTO/RPO targets."
          >
            <div className="bg-slate-800/30 rounded-lg p-4 mt-4">
              <h4 className="text-white font-medium mb-2">What you'll get with BIA:</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• <strong>Quantified Impact Scoring:</strong> Data-driven business impact calculations</li>
                <li>• <strong>Financial Risk Analysis:</strong> Annual loss expectations and cost modeling</li>
                <li>• <strong>RTO/RPO Recommendations:</strong> Optimal recovery targets based on your business</li>
                <li>• <strong>Risk Register:</strong> Prioritized list of risks with action plans</li>
                <li>• <strong>What-If Modeling:</strong> Test different scenarios and mitigation strategies</li>
              </ul>
            </div>
          </SubscriptionGate>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Business Impact Analysis (BIA)</h1>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                      <Info className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">BIA Methodology & Calculations</DialogTitle>
                    </DialogHeader>
                    <BIAMethodologyGuide />
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-gray-400 text-sm">
                FAIR-based quantitative risk analysis with real-world breach intelligence
              </p>
            </div>
          </div>
          {selectedBia?.linked_assessment_id && (
            <Button
              variant="outline"
              className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
              onClick={() =>
                window.open(createPageUrl(`ProfessionalReportView?id=${selectedBia.linked_assessment_id}`), "_blank")
              }
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Assessment Report
            </Button>
          )}
        </div>

        {/* NEW: FAIR Intro Banner */}
        <FAIRIntroBanner />

        {/* Mode Tabs */}
        <Tabs defaultValue="standalone" value={activeTabValue} onValueChange={setActiveTabValue} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="standalone">Standalone BIA</TabsTrigger>
            <TabsTrigger value="linked">Link to Assessment</TabsTrigger>
          </TabsList>

          {/* Standalone */}
          <TabsContent value="standalone" className="space-y-6">
            <Card className="glass-effect border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-300">Create or Select a BIA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New BIA title (optional)"
                      value={newBiaTitle}
                      onChange={(e) => setNewBiaTitle(e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                    />
                    <Button onClick={handleCreateStandalone} className="bg-cyan-600 hover:bg-cyan-700">
                      <Plus className="w-4 h-4 mr-1" /> New BIA
                    </Button>
                  </div>
                  <div>
                    <Select
                      value={selectedBiaId}
                      onValueChange={async (v) => {
                        setSelectedBiaId(v); // Set standalone BIA ID
                        setSelectedLinkedBiaId(""); // Clear linked BIA selection
                        await loadBia(v); // Load BIA into selectedBia state
                      }}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                        <SelectValue placeholder="Open an existing BIA..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-gray-700 text-white max-h-80">
                        {bias.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.title || "Untitled"} • {new Date(b.updated_date || b.created_date).toLocaleDateString()}
                            {b.linked_assessment_id ? " • (Linked)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(selectedBia && !selectedBia.linked_assessment_id) && (
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      onClick={handleSaveStandalone}
                      disabled={saving}
                      className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="w-4 h-4 mr-2" />
                          Save BIA
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setCurrentView('workbench')}
                      variant="outline"
                      className={`border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 ${currentView === 'workbench' ? 'bg-emerald-500/10' : ''}`}
                    >
                      Workbench
                    </Button>
                    <Button
                      onClick={() => setCurrentView('results')}
                      disabled={!fairMetrics && !industryBenchmarks}
                      variant="outline"
                      className={`border-purple-500/30 text-purple-300 hover:bg-purple-500/20 ${currentView === 'results' ? 'bg-purple-500/10' : ''}`}
                    >
                      Results
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Show workbench if a standalone BIA is selected/drafted and current view is workbench */}
            {selectedBia && !selectedBia.linked_assessment_id && currentView === 'workbench' && (
              <div className="space-y-6">
                {/* General BIA Info */}
                <Card className="glass-effect border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300">BIA Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Title</label>
                        <Input
                          value={selectedBia.title || ""}
                          onChange={(e) => setSelectedBia((p) => ({ ...p, title: e.target.value }))}
                          className="bg-slate-800/50 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Scope</label>
                        <Input
                          value={selectedBia.scope || ""}
                          onChange={(e) => setSelectedBia((p) => ({ ...p, scope: e.target.value }))}
                          placeholder="Engineering, IT/Desktop, DevOps, Cyber"
                          className="bg-slate-800/50 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Critical Functions Cards */}
                <Card className="glass-effect border-cyan-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-cyan-300">Critical Functions</CardTitle>
                      <Button
                        onClick={() => {
                          setEditingItemIndex(null); // Indicate adding a new item
                          setShowWizard(true);
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Function
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No critical functions defined yet.</p>
                        <p className="text-sm mt-2">Click "Add Function" to get started.</p>
                      </div>
                    ) : (
                      items.map((item, idx) => (
                        <BIACard
                          key={item.id} // Use item.id as unique key
                          item={item}
                          index={idx}
                          onEdit={handleEditItem}
                          onDelete={removeAt}
                          onExpand={() => setExpandedCardIndex(expandedCardIndex === idx ? null : idx)}
                          isExpanded={expandedCardIndex === idx}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Wizard Dialog */}
                {showWizard && (
                  <Dialog open={showWizard} onOpenChange={setShowWizard}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          {editingItemIndex !== null ? "Edit Critical Function" : "Add Critical Function"}
                        </DialogTitle>
                      </DialogHeader>
                      <SimpleBIAWizard
                        item={editingItemIndex !== null ? items[editingItemIndex] : null}
                        onUpdate={(inputs) => {
                          // Optional: live update as user types (can be used for preview)
                          // For now, full update only on complete
                        }}
                        onComplete={handleWizardComplete}
                      />
                    </DialogContent>
                  </Dialog>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleSaveStandalone}
                    disabled={saving}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save BIA"}
                  </Button>
                  <Button 
                    onClick={handleCalculate} 
                    disabled={calculating || !selectedBia.id || items.length === 0} // Disable calculate if BIA is not yet saved (has no ID) or no items
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {calculating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculating...</> : "Calculate BIA"}
                  </Button>
                </div>
                {calculationError && <p className="text-red-500 mt-2">{calculationError}</p>}
              </div>
            )}
          </TabsContent>

          {/* Linked to Assessment */}
          <TabsContent value="linked" className="space-y-6">
            <Card className="glass-effect border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-300">Select Assessment and BIA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Select
                      value={selectedAssessmentId}
                      onValueChange={handleSelectAssessment}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                        <SelectValue placeholder="Choose an assessment..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-gray-700 text-white max-h-80">
                        {assessments.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {new Date(a.created_date).toLocaleDateString()} • {a.company_name} • {a.framework || "No framework"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateLinked}
                      disabled={!selectedAssessmentId}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Link2 className="w-4 h-4 mr-1" /> New Linked BIA
                    </Button>

                    <Select
                      value={selectedLinkedBiaId}
                      onValueChange={async (v) => {
                        setSelectedLinkedBiaId(v); // Set linked BIA ID
                        setSelectedBiaId(""); // Clear standalone BIA selection
                        await loadBia(v); // Load BIA into selectedBia state
                      }}
                      disabled={!selectedAssessmentId}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                        <SelectValue placeholder="Open an existing linked BIA..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-gray-700 text-white max-h-80">
                        {linkedBias.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.title || "Untitled"} • {new Date(b.updated_date || b.created_date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(selectedBia && selectedBia.linked_assessment_id) && (
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      onClick={handleSaveLinked}
                      disabled={saving}
                      className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="w-4 h-4 mr-2" />
                          Save Linked BIA
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setCurrentView('workbench')}
                      variant="outline"
                      className={`border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 ${currentView === 'workbench' ? 'bg-emerald-500/10' : ''}`}
                    >
                      Workbench
                    </Button>
                    <Button
                      onClick={() => setCurrentView('results')}
                      disabled={!fairMetrics && !industryBenchmarks}
                      variant="outline"
                      className={`border-purple-500/30 text-purple-300 hover:bg-purple-500/20 ${currentView === 'results' ? 'bg-purple-500/10' : ''}`}
                    >
                      Results
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Show workbench if a linked BIA is selected/drafted and current view is workbench */}
            {selectedBia && selectedBia.linked_assessment_id && currentView === 'workbench' && (
              <div className="space-y-6">
                {/* General BIA Info */}
                <Card className="glass-effect border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300">BIA Details (Linked)</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Title</label>
                        <Input
                          value={selectedBia.title || ""}
                          onChange={(e) => setSelectedBia((p) => ({ ...p, title: e.target.value }))}
                          className="bg-slate-800/50 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Scope</label>
                        <Input
                          value={selectedBia.scope || ""}
                          onChange={(e) => setSelectedBia((p) => ({ ...p, scope: e.target.value }))}
                          placeholder="Engineering, IT/Desktop, DevOps, Cyber"
                          className="bg-slate-800/50 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Critical Functions Cards */}
                <Card className="glass-effect border-cyan-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-cyan-300">Critical Functions</CardTitle>
                      <Button
                        onClick={() => {
                          setEditingItemIndex(null); // Indicate adding a new item
                          setShowWizard(true);
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Function
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No critical functions defined yet for this linked BIA.</p>
                        <p className="text-sm mt-2">Click "Add Function" to get started.</p>
                      </div>
                    ) : (
                      items.map((item, idx) => (
                        <BIACard
                          key={item.id} // Use item.id as unique key
                          item={item}
                          index={idx}
                          onEdit={handleEditItem}
                          onDelete={removeAt}
                          onExpand={() => setExpandedCardIndex(expandedCardIndex === idx ? null : idx)}
                          isExpanded={expandedCardIndex === idx}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Wizard Dialog (for linked BIA) */}
                {showWizard && (
                  <Dialog open={showWizard} onOpenChange={setShowWizard}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          {editingItemIndex !== null ? "Edit Critical Function" : "Add Critical Function"}
                        </DialogTitle>
                      </DialogHeader>
                      <SimpleBIAWizard
                        item={editingItemIndex !== null ? items[editingItemIndex] : null}
                        onUpdate={(inputs) => {
                          // Optional: live update as user types
                        }}
                        onComplete={handleWizardComplete}
                      />
                    </DialogContent>
                  </Dialog>
                )}

                <div className="flex justify-end mt-6 gap-2">
                  <Button
                    onClick={handleSaveLinked}
                    disabled={saving}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Linked BIA"}
                  </Button>
                  <Button 
                    onClick={handleCalculate} 
                    disabled={calculating || !selectedBia.id || items.length === 0} // Disable calculate if BIA is not yet saved (has no ID) or no items
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {calculating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculating...</> : "Calculate BIA"}
                  </Button>
                </div>
                {calculationError && <p className="text-red-500 mt-2">{calculationError}</p>}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* This is the new results section, appearing AFTER the tabs but only if currentView is 'results' */}
        {currentView === 'results' && selectedBia && (
          <div className="space-y-6">
            {/* FAIR Metrics Dashboard */}
            {fairMetrics && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-cyan-400" />
                  FAIR Risk Analysis
                </h2>
                <FAIRMetricsDisplay fairMetrics={fairMetrics} />
              </div>
            )}

            {/* Industry Benchmarks */}
            {industryBenchmarks && (
              <Card className="glass-effect border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-purple-300">Industry Benchmarks</CardTitle>
                  <p className="text-sm text-gray-400">Comparative risk data for your sector</p>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Avg Breach Frequency</p>
                    <p className="text-lg font-bold text-white">
                      {(industryBenchmarks.avg_breach_frequency * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">per year</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Cost per Record</p>
                    <p className="text-lg font-bold text-white">
                      ${industryBenchmarks.avg_cost_per_record}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Downtime Cost/Hr</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(industryBenchmarks.avg_downtime_cost_per_hour)}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Ransomware Risk</p>
                    <p className="text-lg font-bold text-white">
                      {(industryBenchmarks.ransomware_likelihood * 100).toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced BIA Items with FAIR Analysis */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Risk Analysis by Asset</h2>
              {(() => {
                const itemsToShow = selectedBia.bia_items ? JSON.parse(selectedBia.bia_items) : [];
                return itemsToShow.map((item, idx) => (
                  <EnhancedBIASummary key={item.id || idx} item={item} />
                ));
              })()}
            </div>
            {/* Recalculate button for the results view */}
             <div className="flex justify-end mt-6">
                <Button 
                    onClick={handleCalculate} 
                    disabled={calculating || !selectedBia.id || items.length === 0} 
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                    {calculating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recalculating...</> : "Recalculate BIA"}
                </Button>
            </div>
            {calculationError && <p className="text-red-500 mt-2">{calculationError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}