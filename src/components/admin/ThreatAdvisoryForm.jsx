
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Save, XCircle } from "lucide-react";

// Simple sanitizer - trims and strips script tags
const clean = (s) => (typeof s === "string" ? s.replace(/<script[^>]*>.*?<\/script>/gi, "").trim() : s);

export default function ThreatAdvisoryForm({ initial, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    title: initial?.title || "",
    source: initial?.source || "",
    published_date: initial?.published_date ? initial.published_date.substring(0, 16) : "",
    severity: initial?.severity || "Medium",
    summary: initial?.summary || "",
    cves: Array.isArray(initial?.cves) ? initial.cves.join(", ") : "",
    mitre_techniques: Array.isArray(initial?.mitre_techniques) ? initial.mitre_techniques.join(", ") : "",
    tags: Array.isArray(initial?.tags) ? initial.tags.join(", ") : "",
    affected_sectors: Array.isArray(initial?.affected_sectors) ? initial.affected_sectors.join(", ") : "",
    regions: Array.isArray(initial?.regions) ? initial.regions.join(", ") : "",
    references: Array.isArray(initial?.references) ? initial.references.join(", ") : ""
  }));
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  const requiredOk = useMemo(() => {
    return clean(form.title) && clean(form.source) && clean(form.published_date) && clean(form.summary);
  }, [form]);

  const toArray = (s) => (typeof s === "string" ? s.split(",").map((x) => clean(x)).filter(Boolean) : []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requiredOk) return;
    setSaving(true);
    const payload = {
      title: clean(form.title),
      source: clean(form.source),
      published_date: new Date(form.published_date).toISOString(),
      severity: form.severity,
      summary: clean(form.summary),
      cves: toArray(form.cves),
      mitre_techniques: toArray(form.mitre_techniques),
      tags: toArray(form.tags),
      affected_sectors: toArray(form.affected_sectors),
      regions: toArray(form.regions),
      references: toArray(form.references)
    };
    await onSubmit(payload);
    setSaving(false);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-base">{isEdit ? "Edit Advisory" : "New Advisory"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Source *</label>
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Published (local) *</label>
              <Input type="datetime-local" value={form.published_date} onChange={(e) => setForm({ ...form, published_date: e.target.value })} required className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Severity</label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select severity" />
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

          <div>
            <label className="text-sm text-gray-300">Summary *</label>
            <Textarea rows={4} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required className="bg-slate-800 border-slate-600 text-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300">CVEs (comma separated)</label>
              <Input value={form.cves} onChange={(e) => setForm({ ...form, cves: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">MITRE Techniques (comma separated)</label>
              <Input value={form.mitre_techniques} onChange={(e) => setForm({ ...form, mitre_techniques: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Tags (comma separated)</label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Affected Sectors (comma separated)</label>
              <Input value={form.affected_sectors} onChange={(e) => setForm({ ...form, affected_sectors: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Regions (comma separated)</label>
              <Input value={form.regions} onChange={(e) => setForm({ ...form, regions: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">References (comma separated URLs)</label>
              <Input value={form.references} onChange={(e) => setForm({ ...form, references: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
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
