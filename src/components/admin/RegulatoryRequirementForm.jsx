
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Save, XCircle } from "lucide-react";

const clean = (s) => (typeof s === "string" ? s.replace(/<script[^>]*>.*?<\/script>/gi, "").trim() : s);

export default function RegulatoryRequirementForm({ initial, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    regulation_code: initial?.regulation_code || "NIS2",
    jurisdiction: initial?.jurisdiction || "EU",
    article_id: initial?.article_id || "",
    title: initial?.title || "",
    description: initial?.description || "",
    mapped_control_hints: Array.isArray(initial?.mapped_control_hints) ? initial.mapped_control_hints.join(", ") : "",
    priority: initial?.priority || "Medium",
  }));
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  const requiredOk = useMemo(() => {
    return clean(form.regulation_code) && clean(form.jurisdiction) && clean(form.article_id) && clean(form.title) && clean(form.description);
  }, [form]);

  const toArray = (s) => (typeof s === "string" ? s.split(",").map((x) => clean(x)).filter(Boolean) : []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requiredOk) return;
    setSaving(true);
    const payload = {
      regulation_code: form.regulation_code,
      jurisdiction: form.jurisdiction,
      article_id: clean(form.article_id),
      title: clean(form.title),
      description: clean(form.description),
      mapped_control_hints: toArray(form.mapped_control_hints),
      priority: form.priority,
    };
    await onSubmit(payload);
    setSaving(false);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-base">{isEdit ? "Edit Requirement" : "New Requirement"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-300">Regulation *</label>
              <Select value={form.regulation_code} onValueChange={(v) => setForm({ ...form, regulation_code: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIS2">NIS2</SelectItem>
                  <SelectItem value="DORA">DORA</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="CRA">CRA</SelectItem>
                  <SelectItem value="FCA">FCA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-300">Jurisdiction *</label>
              <Select value={form.jurisdiction} onValueChange={(v) => setForm({ ...form, jurisdiction: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EU">EU</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="EU+UK">EU+UK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-300">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300">Article ID *</label>
              <Input value={form.article_id} onChange={(e) => setForm({ ...form, article_id: e.target.value })} required className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="bg-slate-800 border-slate-600 text-white" />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300">Description *</label>
            <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="bg-slate-800 border-slate-600 text-white" />
          </div>

          <div>
            <label className="text-sm text-gray-300">Mapped Control Hints (comma separated)</label>
            <Input value={form.mapped_control_hints} onChange={(e) => setForm({ ...form, mapped_control_hints: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="border-slate-600 text-gray-300">
              <XCircle className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" disabled={!requiredOk || saving} className="bg-cyan-600 hover:bg-cyan-700">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
