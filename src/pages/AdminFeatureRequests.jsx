import React, { useEffect, useState } from "react";
import { FeatureRequest } from "@/entities/FeatureRequest";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminFeatureRequests() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const me = await User.me();
    setCurrentUser(me);
    // Company admin sees all requests in their company; others will be blocked by RLS
    const list = await FeatureRequest.filter({ company_id: me.company_id }, "-created_date", 100);
    setRequests(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await FeatureRequest.update(id, { status });
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Simple guard: if not company admin, show nothing (RLS also protects)
  if (currentUser?.company_role !== "admin") {
    return (
      <div className="min-h-screen cyber-gradient text-white flex items-center justify-center p-6">
        <Card className="bg-slate-900/60 border-slate-800 max-w-md">
          <CardHeader><CardTitle>Access Restricted</CardTitle></CardHeader>
          <CardContent>You need company admin access to view feature requests.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient text-white p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold">Feature Requests (Admin)</h1>
        {requests.length === 0 ? (
          <p className="text-gray-300">No feature requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <Card key={r.id} className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{r.title}</span>
                    <span className="text-xs text-gray-400">by {r.created_by}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-200 mb-3 whitespace-pre-wrap">{r.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Severity: {r.severity}</span>
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Status: {r.status}</span>
                    {r.category && <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Category: {r.category}</span>}
                    <div className="ml-auto flex items-center gap-2">
                      <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="new">new</SelectItem>
                          <SelectItem value="in_review">in_review</SelectItem>
                          <SelectItem value="planned">planned</SelectItem>
                          <SelectItem value="in_progress">in_progress</SelectItem>
                          <SelectItem value="done">done</SelectItem>
                          <SelectItem value="rejected">rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" className="h-8 border-slate-700 text-gray-300" onClick={() => updateStatus(r.id, r.status)}>
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}