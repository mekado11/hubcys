
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { User } from "@/entities/User";
import { ThreatAdvisory } from "@/entities/ThreatAdvisory";
import { RegulatoryRequirement } from "@/entities/RegulatoryRequirement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ShieldAlert, BookText, AlertTriangle, Search } from "lucide-react";
import ThreatAdvisoryForm from "@/components/admin/ThreatAdvisoryForm";
import RegulatoryRequirementForm from "@/components/admin/RegulatoryRequirementForm";

export default function AdminThreats() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("advisories");

  // ThreatAdvisory state
  const [advisories, setAdvisories] = useState([]);
  const [advQuery, setAdvQuery] = useState("");
  const [editingAdvisory, setEditingAdvisory] = useState(null);
  const [showAdvForm, setShowAdvForm] = useState(false);

  // RegulatoryRequirement state
  const [requirements, setRequirements] = useState([]);
  const [reqQuery, setReqQuery] = useState("");
  const [editingReq, setEditingReq] = useState(null);
  const [showReqForm, setShowReqForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadAdvisories = useCallback(async () => {
    const list = await ThreatAdvisory.list("-published_date", 100);
    setAdvisories(list || []);
  }, []);

  const loadRequirements = useCallback(async () => {
    const list = await RegulatoryRequirement.list("-article_id", 200);
    setRequirements(list || []);
  }, []);

  useEffect(() => {
    if (!loading && currentUser?.company_role === "admin") {
      loadAdvisories();
      loadRequirements();
    }
  }, [loading, currentUser, loadAdvisories, loadRequirements]);

  const filteredAdvisories = useMemo(() => {
    const q = advQuery.toLowerCase();
    return advisories.filter(a =>
      (a.title || "").toLowerCase().includes(q) ||
      (a.source || "").toLowerCase().includes(q) ||
      (a.summary || "").toLowerCase().includes(q) ||
      (a.cves || []).join(",").toLowerCase().includes(q) ||
      (a.tags || []).join(",").toLowerCase().includes(q)
    );
  }, [advisories, advQuery]);

  const filteredRequirements = useMemo(() => {
    const q = reqQuery.toLowerCase();
    return requirements.filter(r =>
      (r.title || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.regulation_code || "").toLowerCase().includes(q) ||
      (r.article_id || "").toLowerCase().includes(q)
    );
  }, [requirements, reqQuery]);

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white">
        <span>Loading…</span>
      </div>
    );
  }

  if (currentUser?.company_role !== "admin") {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <Card className="bg-slate-800/60 border border-red-500/30 p-6 max-w-lg">
          <CardHeader><CardTitle className="text-red-300">Access Restricted</CardTitle></CardHeader>
          <CardContent className="text-gray-300">
            You must be an administrator to manage advisories and regulatory requirements.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Threats & Regulations (Admin)</h1>
          <p className="text-gray-400">Create, edit, and manage threat advisories and regulatory requirements.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="advisories" className="gap-2">
              <ShieldAlert className="w-4 h-4" /> Advisories
            </TabsTrigger>
            <TabsTrigger value="requirements" className="gap-2">
              <BookText className="w-4 h-4" /> Requirements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="advisories" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={advQuery} onChange={(e) => setAdvQuery(e.target.value)} placeholder="Search advisories…" className="pl-8 bg-slate-800 border-slate-700 text-white" />
              </div>
              <Button onClick={() => { setEditingAdvisory(null); setShowAdvForm(true); }} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-2" /> New Advisory
              </Button>
            </div>

            {showAdvForm && (
              <ThreatAdvisoryForm
                initial={editingAdvisory}
                onCancel={() => { setShowAdvForm(false); setEditingAdvisory(null); }}
                onSubmit={async (payload) => {
                  if (editingAdvisory?.id) {
                    await ThreatAdvisory.update(editingAdvisory.id, payload);
                  } else {
                    await ThreatAdvisory.create(payload);
                  }
                  setShowAdvForm(false);
                  setEditingAdvisory(null);
                  await loadAdvisories();
                }}
              />
            )}

            <div className="space-y-3">
              {filteredAdvisories.map((a) => (
                <Card key={a.id} className="bg-slate-800/40 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{a.title}</h3>
                          <Badge className={
                            a.severity === "Critical" ? "bg-red-500/20 text-red-300" :
                            a.severity === "High" ? "bg-orange-500/20 text-orange-300" :
                            a.severity === "Medium" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-green-500/20 text-green-300"
                          }>{a.severity || "Medium"}</Badge>
                          <Badge variant="outline" className="border-slate-600 text-gray-300">{a.source}</Badge>
                        </div>
                        <p className="text-gray-300 mt-1 line-clamp-2">{a.summary}</p>
                        <div className="text-xs text-gray-400 mt-1">
                          {(a.cves || []).slice(0, 5).join(", ")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="border-slate-600 text-slate-900 hover:bg-slate-100" onClick={() => { setEditingAdvisory(a); setShowAdvForm(true); }}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button variant="outline" className="border-red-500/30 text-red-700 hover:bg-red-500/10" onClick={async () => {
                          if (confirm("Delete this advisory?")) {
                            await ThreatAdvisory.delete(a.id);
                            await loadAdvisories();
                          }
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredAdvisories.length === 0 && (
                <div className="text-gray-400 text-sm">No advisories found.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={reqQuery} onChange={(e) => setReqQuery(e.target.value)} placeholder="Search requirements…" className="pl-8 bg-slate-800 border-slate-700 text-white" />
              </div>
              <Button onClick={() => { setEditingReq(null); setShowReqForm(true); }} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-2" /> New Requirement
              </Button>
            </div>

            {showReqForm && (
              <RegulatoryRequirementForm
                initial={editingReq}
                onCancel={() => { setShowReqForm(false); setEditingReq(null); }}
                onSubmit={async (payload) => {
                  if (editingReq?.id) {
                    await RegulatoryRequirement.update(editingReq.id, payload);
                  } else {
                    await RegulatoryRequirement.create(payload);
                  }
                  setShowReqForm(false);
                  setEditingReq(null);
                  await loadRequirements();
                }}
              />
            )}

            <div className="space-y-3">
              {filteredRequirements.map((r) => (
                <Card key={r.id} className="bg-slate-800/40 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{r.title}</h3>
                          <Badge variant="outline" className="border-slate-600 text-gray-300">{r.regulation_code}</Badge>
                          <Badge className={
                            r.priority === "Critical" ? "bg-red-500/20 text-red-300" :
                            r.priority === "High" ? "bg-orange-500/20 text-orange-300" :
                            r.priority === "Medium" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-green-500/20 text-green-300"
                          }>{r.priority || "Medium"}</Badge>
                        </div>
                        <div className="text-gray-300 text-sm mt-1">
                          <span className="text-gray-400 mr-2">Article:</span>{r.article_id} <span className="text-gray-400 mx-2">•</span>
                          <span className="text-gray-400 mr-2">Jurisdiction:</span>{r.jurisdiction}
                        </div>
                        <p className="text-gray-300 mt-1 line-clamp-2">{r.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="border-slate-600 text-slate-900 hover:bg-slate-100" onClick={() => { setEditingReq(r); setShowReqForm(true); }}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button variant="outline" className="border-red-500/30 text-red-700 hover:bg-red-500/10" onClick={async () => {
                          if (confirm("Delete this requirement?")) {
                            await RegulatoryRequirement.delete(r.id);
                            await loadRequirements();
                          }
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredRequirements.length === 0 && (
                <div className="text-gray-400 text-sm">No requirements found.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-yellow-300 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <p>Tip: Use tags and consistent titles to improve search and recommendation relevance across the platform.</p>
        </div>
      </div>
    </div>
  );
}
