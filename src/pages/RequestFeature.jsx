import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeatureRequest } from "@/entities/FeatureRequest";
import { User } from "@/entities/User";
import { CheckCircle2, Send, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RequestFeature() {
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await User.me();
        setCurrentUser(u);
      } catch {
        setCurrentUser(null);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title,
      description,
      severity,
      category: category || undefined,
      company_id: currentUser?.company_id || undefined
    };
    const created = await FeatureRequest.create(payload);
    setSubmittedId(created.id);
    setSubmitting(false);
    setTitle("");
    setDescription("");
    setCategory("");
    setSeverity("medium");
  };

  return (
    <div className="min-h-screen cyber-gradient text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Request a Feature</h1>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <p className="text-gray-300 mb-6">Tell us what would make Fortigap better for you. Your request is visible only to admins.</p>

        {submittedId ? (
          <div className="bg-green-900/20 border border-green-600/40 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-green-200 font-medium">Thanks! Your request has been submitted.</p>
              <p className="text-sm text-green-300/80">Reference ID: {submittedId}</p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <Label className="text-gray-200">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" className="bg-slate-800/60 border-slate-700 text-white" required />
          </div>

          <div>
            <Label className="text-gray-200">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the feature, the problem it solves, and your ideal outcome." className="bg-slate-800/60 border-slate-700 text-white min-h-[140px]" required />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-200">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                  <SelectValue placeholder="Choose severity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-200">Category (optional)</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., assessment, dashboard, reporting" className="bg-slate-800/60 border-slate-700 text-white" />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
            {submitting ? <><Send className="w-4 h-4 mr-2 animate-pulse" /> Submitting…</> : <><Send className="w-4 h-4 mr-2" /> Submit Feature Request</>}
          </Button>
        </form>
      </div>
    </div>
  );
}