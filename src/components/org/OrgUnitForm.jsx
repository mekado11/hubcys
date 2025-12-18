import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function OrgUnitForm({ units = [], initialUnit = null, saving = false, onCancel, onSubmit }) {
  const [form, setForm] = React.useState(() => {
    const u = initialUnit || {};
    return {
      name: u.name || "",
      unit_type: u.unit_type || "Engineering",
      description: u.description || "",
      responsibilities: Array.isArray(u.responsibilities) ? u.responsibilities : [],
      parent_unit_id: u.parent_unit_id || "",
      contact_email: u.contact_email || "",
      headcount: typeof u.headcount === "number" ? u.headcount : "",
      order_index: typeof u.order_index === "number" ? u.order_index : "",
      enabled: u.enabled !== false
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      headcount: form.headcount === "" ? undefined : Number(form.headcount),
      order_index: form.order_index === "" ? undefined : Number(form.order_index),
      responsibilities: form.responsibilities
        .map((r) => (r || "").trim())
        .filter((r) => r.length > 0)
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="text-gray-300">Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          placeholder="e.g., Engineering"
          className="bg-slate-800/50 border-gray-600 text-white"
        />
      </div>

      <div>
        <Label className="text-gray-300">Unit Type</Label>
        <Select
          value={form.unit_type}
          onValueChange={(v) => setForm((s) => ({ ...s, unit_type: v }))}
        >
          <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
            <SelectValue placeholder="Select unit type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-gray-700 text-white">
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="IT_Desktop">IT/Desktop</SelectItem>
            <SelectItem value="DevOps">DevOps</SelectItem>
            <SelectItem value="Cybersecurity">Cyber</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-300">Reports To (Parent Unit)</Label>
        <Select
          value={form.parent_unit_id}
          onValueChange={(v) => setForm((s) => ({ ...s, parent_unit_id: v }))}
        >
          <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
            <SelectValue placeholder="None (top-level)" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-gray-700 text-white">
            <SelectItem value={null}>None</SelectItem>
            {units
              .filter((u) => !initialUnit || u.id !== initialUnit.id)
              .map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-300">What they do</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          rows={3}
          placeholder="Describe this function..."
          className="bg-slate-800/50 border-gray-600 text-white"
        />
      </div>

      <div>
        <Label className="text-gray-300">Responsibilities (one per line)</Label>
        <Textarea
          value={(form.responsibilities || []).join("\n")}
          onChange={(e) =>
            setForm((s) => ({ ...s, responsibilities: e.target.value.split("\n") }))
          }
          rows={4}
          placeholder="e.g., Secure SDLC practices&#10;e.g., Endpoint management"
          className="bg-slate-800/50 border-gray-600 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300">Contact Email</Label>
          <Input
            value={form.contact_email}
            onChange={(e) => setForm((s) => ({ ...s, contact_email: e.target.value }))}
            placeholder="team@company.com"
            className="bg-slate-800/50 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300">Headcount</Label>
          <Input
            type="number"
            value={form.headcount}
            onChange={(e) => setForm((s) => ({ ...s, headcount: e.target.value }))}
            placeholder="e.g., 8"
            className="bg-slate-800/50 border-gray-600 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300">Order</Label>
          <Input
            type="number"
            value={form.order_index}
            onChange={(e) => setForm((s) => ({ ...s, order_index: e.target.value }))}
            placeholder="Optional sort order"
            className="bg-slate-800/50 border-gray-600 text-white"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={!form.name || saving}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {initialUnit ? "Save Changes" : "Create Unit"}
          </Button>
        </div>
      </div>

      {initialUnit && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full border-gray-600 text-gray-300"
        >
          Cancel
        </Button>
      )}
    </form>
  );
}