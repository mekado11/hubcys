
import React, { useEffect, useMemo, useState } from "react";
import { User } from "@/entities/User";
import { PciScope } from "@/entities/PciScope";
import { Assessment } from "@/entities/Assessment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed: import { Separator } from "@/components/ui/separator"; // Replaced with <hr>
import { Plus, Save, Download, BookOpen, HelpCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Define once at module scope so hooks don't depend on it
const INTRO_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const emptyScope = (company_id) => ({
  company_id,
  title: "",
  description: "",
  linked_assessment_id: "",
  cde_assets: [],
  connected_systems: [],
  data_flows: [],
  network_segments: [],
  scope_summary: "",
  compliance_gaps: [],
  scope_stats: { assets_total: 0, cde_assets: 0, connected_systems: 0, data_flows: 0 },
  status: "draft",
  last_calculated: new Date().toISOString()
});

export default function PciScopingTool() {
  const [currentUser, setCurrentUser] = useState(null);
  const [scopes, setScopes] = useState([]);
  const [selectedScopeId, setSelectedScopeId] = useState(null);
  const [scope, setScope] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const me = await User.me();
      if (!mounted) return;
      setCurrentUser(me);
      const list = await PciScope.filter({ company_id: me.company_id }, "-updated_date", 100);
      setScopes(list || []);
      if (list && list.length > 0) {
        setSelectedScopeId(list[0].id);
        setScope(list[0]);
      } else {
        setScope(emptyScope(me.company_id));
      }
      const as = await Assessment.filter({ company_id: me.company_id }, "-updated_date", 50);
      setAssessments(as || []);
      setLoading(false);

      // UPDATED: Show intro once every 24 hours (per user)
      const introKey = `pci_scoping_intro_last_shown:${me.email || me.id || "anon"}`;
      const lastShown = parseInt(localStorage.getItem(introKey) || "0", 10);
      if (!lastShown || isNaN(lastShown) || (Date.now() - lastShown) > INTRO_INTERVAL_MS) {
        setShowIntro(true);
        // Record immediately so it does not flash repeatedly on re-renders
        // This timestamp will be overwritten on dialog close if user explicitly closes it.
        localStorage.setItem(introKey, Date.now().toString());
      }
    })();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const s = scope || {};
    return {
      assets_total: (s.cde_assets?.length || 0),
      cde_assets: (s.cde_assets?.filter(a => a.stores_pan || a.processes_pan || a.transmits_pan)?.length || 0),
      connected_systems: (s.connected_systems?.length || 0),
      data_flows: (s.data_flows?.length || 0)
    };
  }, [scope]);

  const selectScope = async (id) => {
    setSelectedScopeId(id);
    const rec = scopes.find(s => s.id === id);
    if (rec) {
      setScope(rec);
    } else {
      const filtered = await PciScope.filter({ id }, "-updated_date", 1);
      setScope(filtered?.[0] || null);
    }
  };

  const createNewScope = async () => {
    if (!currentUser?.company_id) return;
    const base = emptyScope(currentUser.company_id);
    base.title = "New PCI Scope";
    const created = await PciScope.create(base);
    const list = await PciScope.filter({ company_id: currentUser.company_id }, "-updated_date", 100);
    setScopes(list || []);
    setSelectedScopeId(created.id);
    setScope(created);
  };

  const saveScope = async () => {
    if (!scope?.title) {
      setError("Please provide a title for this scope.");
      return;
    }
    setSaving(true);
    const payload = {
      ...scope,
      company_id: currentUser.company_id,
      scope_stats: stats,
      last_calculated: new Date().toISOString()
    };
    if (selectedScopeId) {
      await PciScope.update(selectedScopeId, payload);
    } else {
      const created = await PciScope.create(payload);
      setSelectedScopeId(created.id);
    }
    const list = await PciScope.filter({ company_id: currentUser.company_id }, "-updated_date", 100);
    setScopes(list || []);
    // refresh current
    if (selectedScopeId) {
      const refreshed = await PciScope.filter({ id: selectedScopeId }, "-updated_date", 1);
      setScope(refreshed?.[0] || scope);
    }
    setSaving(false);
    setError("");
  };

  const exportJSON = () => {
    const data = {
      ...scope,
      scope_stats: stats
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(scope?.title || "pci_scope").replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const addCdeAsset = () => {
    const item = {
      name: "",
      type: "web_app",
      stores_pan: false,
      processes_pan: false,
      transmits_pan: false,
      location: "",
      segment: "",
      notes: ""
    };
    setScope(s => ({ ...s, cde_assets: [...(s.cde_assets || []), item] }));
  };
  const updateCdeAsset = (idx, patch) => {
    const arr = [...(scope.cde_assets || [])];
    arr[idx] = { ...arr[idx], ...patch };
    setScope(s => ({ ...s, cde_assets: arr }));
  };
  const removeCdeAsset = (idx) => {
    const arr = [...(scope.cde_assets || [])];
    arr.splice(idx, 1);
    setScope(s => ({ ...s, cde_assets: arr }));
  };

  const addConnected = () => {
    const item = {
      name: "",
      function: "",
      connection_type: "bidirectional",
      transmits_pan: false,
      segment: "",
      notes: ""
    };
    setScope(s => ({ ...s, connected_systems: [...(s.connected_systems || []), item] }));
  };
  const updateConnected = (idx, patch) => {
    const arr = [...(scope.connected_systems || [])];
    arr[idx] = { ...arr[idx], ...patch };
    setScope(s => ({ ...s, connected_systems: arr }));
  };
  const removeConnected = (idx) => {
    const arr = [...(scope.connected_systems || [])];
    arr.splice(idx, 1);
    setScope(s => ({ ...s, connected_systems: arr }));
  };

  const addFlow = () => {
    const item = {
      source: "",
      destination: "",
      data_type: "PAN",
      encryption_in_transit: true,
      encryption_at_rest: true,
      notes: ""
    };
    setScope(s => ({ ...s, data_flows: [...(s.data_flows || []), item] }));
  };
  const updateFlow = (idx, patch) => {
    const arr = [...(scope.data_flows || [])];
    arr[idx] = { ...arr[idx], ...patch };
    setScope(s => ({ ...s, data_flows: arr }));
  };
  const removeFlow = (idx) => {
    const arr = [...(scope.data_flows || [])];
    arr.splice(idx, 1);
    setScope(s => ({ ...s, data_flows: arr }));
  };

  const addSegment = () => {
    const item = { name: "", description: "", scope: "out_of_scope", controls: [] };
    setScope(s => ({ ...s, network_segments: [...(s.network_segments || []), item] }));
  };
  const updateSegment = (idx, patch) => {
    const arr = [...(scope.network_segments || [])];
    arr[idx] = { ...arr[idx], ...patch };
    setScope(s => ({ ...s, network_segments: arr }));
  };
  const removeSegment = (idx) => {
    const arr = [...(scope.network_segments || [])];
    arr.splice(idx, 1);
    setScope(s => ({ ...s, network_segments: arr }));
  };

  const hasScopes = (scopes || []).length > 0; // ensure layout doesn't reserve left column when empty

  if (loading || !scope) {
    return (
      <Card className="glass-effect border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-cyan-300">PCI DSS Scoping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-300">Loading…</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="pci-scoping-root" className="space-y-6">
      {/* Intro Onboarding Dialog */}
      <Dialog
        open={showIntro}
        onOpenChange={(open) => {
          setShowIntro(open);
          // When the user closes the dialog, stamp the last-shown time (per user) to enforce 24h interval
          if (!open) {
            const me = currentUser || {};
            const key = `pci_scoping_intro_last_shown:${me.email || me.id || "anon"}`;
            localStorage.setItem(key, Date.now().toString());
          }
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                Welcome to PCI DSS Scoping
              </span>
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Quickly define your Cardholder Data Environment (CDE), map connected systems, and document data flows to reduce audit effort and clarify PCI scope.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <strong className="text-white">How to use:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Add CDE Assets that store, process, or transmit cardholder data.</li>
                <li>List Connected Systems that interact with the CDE and could impact its security.</li>
                <li>Document Data Flows for how CHD/SAD/CHD moves (ensure encryption in transit/at rest).</li>
                <li>Summarize scope and export your JSON for auditors or internal records.</li>
              </ul>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="text-gray-400">
                Look for the ? icons next to section titles for quick tips.
              </div>
              <Link to={createPageUrl("PCIScopingGuide")}>
                <Button
                  variant="outline"
                  className="bg-white text-black border-gray-200 hover:bg-gray-100 shadow-sm"
                >
                  <BookOpen className="w-4 h-4 mr-2 text-black" />
                  Read Quick Guide
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="glass-effect border-slate-700/50">
        <CardHeader className="flex flex-col gap-2">
          {/* Header: calmer, professional title/subtitle */}
          <div className="flex flex-col">
            <CardTitle className="text-white text-2xl font-semibold tracking-tight">
              PCI DSS Scoping & CDE Identification
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Define CDE assets, connected systems, and data flows. Save and export for audit prep.
            </p>
          </div>

          {/* Actions row - compact, consistent spacing */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={createNewScope}>
              <Plus className="w-4 h-4 mr-2" /> New Scope
            </Button>
            <Button onClick={saveScope} disabled={saving || !scope.title} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={exportJSON}>
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
            {/* Manual open: give users a help button to trigger the intro on demand */}
            <Button
              variant="outline"
              className="border-gray-600 text-gray-200"
              onClick={() => setShowIntro(true)}
              title="How it works"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              How it works
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {error && (
            <div className="mb-3 text-sm text-red-300">{error}</div>
          )}
          <div className={`grid grid-cols-1 ${hasScopes ? 'lg:grid-cols-3' : ''} gap-6`}>
            {/* Left: scope list - render only if there are scopes */}
            {hasScopes && (
              <div className="lg:col-span-1">
                <div className="text-gray-300 text-sm mb-2">Your PCI Scopes</div>
                <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
                  {(scopes || []).map(s => (
                    <button
                      key={s.id}
                      onClick={() => selectScope(s.id)}
                      className={`w-full text-left p-3 rounded-lg border ${selectedScopeId === s.id ? "border-cyan-400 bg-slate-800/60" : "border-slate-700/50 bg-slate-800/30"} hover:border-cyan-400 transition`}
                    >
                      <div className="text-white font-medium">{s.title}</div>
                      <div className="text-xs text-gray-400 truncate">{s.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-slate-700/70 text-gray-200">CDE: {s.scope_stats?.cde_assets || 0}</Badge>
                        <Badge className="bg-slate-700/70 text-gray-200">Connected: {s.scope_stats?.connected_systems || 0}</Badge>
                        <Badge className="bg-slate-700/70 text-gray-200">Flows: {s.scope_stats?.data_flows || 0}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right: editor - span full width when no left column */}
            <div className={`${hasScopes ? 'lg:col-span-2' : ''} space-y-6`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-300">Title</label>
                  <Input value={scope.title || ""} onChange={(e) => setScope(s => ({ ...s, title: e.target.value }))} className="bg-slate-800/50 border-gray-600 text-white" />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Link to Assessment (optional)</label>
                  <Select
                    value={scope.linked_assessment_id || ""}
                    onValueChange={(v) => setScope(s => ({ ...s, linked_assessment_id: v }))}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue placeholder="Choose assessment" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600">
                      <SelectItem value={null}>None</SelectItem>
                      {(assessments || []).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.company_name} — {a.framework}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Description / Scope Notes</label>
                <Textarea value={scope.description || ""} onChange={(e) => setScope(s => ({ ...s, description: e.target.value }))} rows={3} className="bg-slate-800/50 border-gray-600 text-white" />
              </div>

              <hr className="border-slate-700/60" />

              {/* CDE Assets */}
              <div>
                <div className="flex items-center justify-start gap-3 mb-3">
                  <h3 className="text-white font-medium text-base">
                    CDE Assets
                  </h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-cyan-300/80 hover:text-cyan-200" aria-label="What are CDE Assets?">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-gray-200">
                      <div className="text-sm">
                        <div className="font-semibold text-white mb-1">What are CDE Assets?</div>
                        Systems that store, process, or transmit cardholder data (CHD/SAD), such as payment apps,
                        databases, and payment processors. These are fully in PCI DSS scope.
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="border-slate-600 text-slate-100 bg-slate-800 hover:bg-slate-700"
                    onClick={addCdeAsset}
                  >
                    + Add Asset
                  </Button>
                </div>
                <div className="space-y-3">
                  {(scope.cde_assets || []).map((a, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <Input placeholder="Name" value={a.name} onChange={(e) => updateCdeAsset(idx, { name: e.target.value })} className="bg-slate-800/50 border-gray-600 text-white md:col-span-2" />
                        <Select value={a.type} onValueChange={(v) => updateCdeAsset(idx, { type: v })}>
                          <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-gray-600">
                            <SelectItem value="web_app">Web App</SelectItem>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="payment_processor">Payment Processor</SelectItem>
                            <SelectItem value="endpoint">Endpoint</SelectItem>
                            <SelectItem value="network_device">Network Device</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Location" value={a.location || ""} onChange={(e) => updateCdeAsset(idx, { location: e.target.value })} className="bg-slate-800/50 border-gray-600 text-white" />
                        <Input placeholder="Segment" value={a.segment || ""} onChange={(e) => updateCdeAsset(idx, { segment: e.target.value })} className="bg-slate-800/50 border-gray-600 text-white" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-300">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={a.stores_pan || false} onChange={(e) => updateCdeAsset(idx, { stores_pan: e.target.checked })} />
                          Stores PAN
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={a.processes_pan || false} onChange={(e) => updateCdeAsset(idx, { processes_pan: e.target.checked })} />
                          Processes PAN
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={a.transmits_pan || false} onChange={(e) => updateCdeAsset(idx, { transmits_pan: e.target.checked })} />
                          Transmits PAN
                        </label>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Textarea placeholder="Notes" value={a.notes || ""} onChange={(e) => updateCdeAsset(idx, { notes: e.target.value })} rows={2} className="bg-slate-800/50 border-gray-600 text-white" />
                        <Button variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => removeCdeAsset(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-700/60" />

              {/* Connected Systems */}
              <div>
                <div className="flex items-center justify-start gap-3 mb-3">
                  <h3 className="text-white font-medium text-base">Connected Systems</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-cyan-300/80 hover:text-cyan-200" aria-label="What are Connected Systems?">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-gray-200">
                      <div className="text-sm">
                        <div className="font-semibold text-white mb-1">What are Connected Systems?</div>
                        Systems that do not handle CHD directly but connect to the CDE or can affect its security
                        (e.g., AD, logging, monitoring). They are partially in scope.
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="border-slate-600 text-slate-100 bg-slate-800 hover:bg-slate-700"
                    onClick={addConnected}
                  >
                    + Add System
                  </Button>
                </div>
                <div className="space-y-3">
                  {(scope.connected_systems || []).map((c, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <Input placeholder="Name" value={c.name} onChange={(e) => updateConnected(idx, { name: e.target.value })} className="bg-slate-800/50 border-gray-600 text-white md:col-span-2" />
                        <Input placeholder="Function" value={c.function || ""} onChange={(e) => updateConnected(idx, { function: e.target.value })} className="bg-slate-800/50 border-gray-600 text-white" />
                        <Select value={c.connection_type || "bidirectional"} onValueChange={(v) => updateConnected(idx, { connection_type: v })}>
                          <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                            <SelectValue placeholder="Connection" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-gray-600">
                            <SelectItem value="inbound">Inbound</SelectItem>
                            <SelectItem value="outbound">Outbound</SelectItem>
                            <SelectItem value="bidirectional">Bidirectional</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Segment" value={c.segment || ""} onChange={(e) => updateConnected(idx, { segment: e.target.value })} className="bg-slate-800/50 border-gray-600 text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-300">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={c.transmits_pan || false} onChange={(e) => updateConnected(idx, { transmits_pan: e.target.checked })} />
                          Transmits PAN
                        </label>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Textarea placeholder="Notes" value={c.notes || ""} onChange={(e) => updateConnected(idx, { notes: e.target.value })} rows={2} className="bg-slate-800/50 border-gray-600 text-white" />
                        <Button variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => removeConnected(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-700/60" />

              {/* Data Flows */}
              <div>
                <div className="flex items-center justify-start gap-3 mb-3">
                  <h3 className="text-white font-medium text-base">Data Flows</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-cyan-300/80 hover:text-cyan-200" aria-label="What are Data Flows?">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-gray-200">
                      <div className="text-sm">
                        <div className="font-semibold text-white mb-1">What are Data Flows?</div>
                        Map how cardholder data moves into, within, and out of your environment.
                        Ensure encryption in transit and at rest where applicable.
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="border-slate-600 text-slate-100 bg-slate-800 hover:bg-slate-700"
                    onClick={addFlow}
                  >
                    + Add Flow
                  </Button>
                </div>
                <div className="space-y-3">
                  {(scope.data_flows || []).map((f, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <Input placeholder="Source" value={f.source} onChange={(e) => updateFlow(idx, { source: e.target.value })} className="bg-slate-800/50 border-gray-600 text-white" />
                        <Input placeholder="Destination" value={f.destination} onChange={(e) => updateFlow(idx, { destination: e.target.value })} className="bg-slate-800/50 border-gray-600 text-white" />
                        <Select value={f.data_type || "PAN"} onValueChange={(v) => updateFlow(idx, { data_type: v })}>
                          <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                            <SelectValue placeholder="Data Type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-gray-600">
                            <SelectItem value="PAN">PAN</SelectItem>
                            <SelectItem value="SAD">SAD</SelectItem>
                            <SelectItem value="CHD">CHD</SelectItem>
                            <SelectItem value="Tokenized">Tokenized</SelectItem>
                            <SelectItem value="None">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 text-xs text-gray-300">
                          <input type="checkbox" checked={f.encryption_in_transit || false} onChange={(e) => updateFlow(idx, { encryption_in_transit: e.target.checked })} />
                          TLS in transit
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-300">
                          <input type="checkbox" checked={f.encryption_at_rest || false} onChange={(e) => updateFlow(idx, { encryption_at_rest: e.target.checked })} />
                          Encryption at rest
                        </label>
                      </div>
                      <Textarea placeholder="Notes" value={f.notes || ""} onChange={(e) => updateFlow(idx, { notes: e.target.value })} rows={2} className="bg-slate-800/50 border-gray-600 text-white mt-2" />
                      <div className="flex justify-end">
                        <Button variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => removeFlow(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-700/60" />

              {/* Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-start gap-3 mb-2">
                  <h3 className="text-white font-medium text-base">Scope Summary</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-cyan-300/80 hover:text-cyan-200" aria-label="What is Scope Summary?">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-gray-200">
                      <div className="text-sm">
                        <div className="font-semibold text-white mb-1">Scope Summary</div>
                        Provide a narrative of boundaries, segmentation, and justification for what’s in or out of scope.
                        This helps auditors understand your CDE quickly.
                      </div>
                    </PopoverContent>
                  </Popover>
                  <a
                    href={createPageUrl("PCIScopingGuide")}
                    className="text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-500"
                  >
                    Quick Guide
                  </a>
                </div>
                <div className="text-xs text-slate-400 mb-3">
                  Assets: {stats.assets_total} • CDE: {stats.cde_assets} • Connected: {stats.connected_systems} • Flows: {stats.data_flows}
                </div>
                <Textarea
                  placeholder="Write your narrative summary, boundaries, and out-of-scope justification…"
                  value={scope.scope_summary || ""}
                  onChange={(e) => setScope(s => ({ ...s, scope_summary: e.target.value }))}
                  rows={3}
                  className="bg-slate-800/50 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
