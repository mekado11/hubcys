import React from "react";
import { AssetType } from "@/entities/AssetType";
import { OrgUnit } from "@/entities/OrgUnit";
import { User } from "@/entities/User";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

export default function AssetTypeManager({ open, onOpenChange, onAfterSave }) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [companyId, setCompanyId] = React.useState(null);
  const [types, setTypes] = React.useState([]);
  const [orgUnits, setOrgUnits] = React.useState([]);
  const [form, setForm] = React.useState({
    name: "",
    category: "IT",
    active: true,
    order_index: 100,
    keywords: "",
    linked_org_unit_id: "",
    risk_profile: ""
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const me = await User.me();
    setCompanyId(me.company_id);
    const [ts, ous] = await Promise.all([
      AssetType.filter({ company_id: me.company_id }, "order_index", 500),
      OrgUnit.filter({ company_id: me.company_id }, "order_index", 1000)
    ]);
    setTypes(ts || []);
    setOrgUnits(ous || []);
    setLoading(false);
  }, []);

  React.useEffect(() => { if (open) load(); }, [open, load]);

  const createType = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await AssetType.create({
      company_id: companyId,
      name: form.name.trim(),
      category: form.category,
      active: form.active,
      order_index: Number(form.order_index) || 100,
      keywords: (form.keywords || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
      linked_org_unit_id: form.linked_org_unit_id || undefined,
      risk_profile: form.risk_profile ? form.risk_profile : undefined
    });
    setForm({
      name: "",
      category: "IT",
      active: true,
      order_index: 100,
      keywords: "",
      linked_org_unit_id: "",
      risk_profile: ""
    });
    await load();
    setSaving(false);
    onAfterSave && onAfterSave();
  };

  const update = async (id, patch) => {
    setSaving(true);
    await AssetType.update(id, patch);
    await load();
    setSaving(false);
    onAfterSave && onAfterSave();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this type? This won’t affect existing BIAs.")) return;
    await AssetType.delete(id);
    await load();
    onAfterSave && onAfterSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl">
        <DialogHeader><DialogTitle>Manage Asset Types</DialogTitle></DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-300"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : (
          <div className="space-y-6">
            {/* Create new */}
            <div className="rounded-lg border border-slate-700 p-3">
              <div className="grid md:grid-cols-6 gap-2">
                <Input placeholder="Name (e.g., SaaS)" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="bg-slate-800 border-slate-700 md:col-span-2" />
                <Select value={form.category} onValueChange={(v)=>setForm({...form, category:v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {["IT","OT_ICS","Cloud","Data_Store","Security","Application","Network","Other"].map(c=>(
                      <SelectItem key={c} value={c}>{c.replace("_","/")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Keywords (comma-separated)" value={form.keywords} onChange={(e)=>setForm({...form, keywords:e.target.value})} className="bg-slate-800 border-slate-700 md:col-span-2" />
                <Select value={form.linked_org_unit_id} onValueChange={(v)=>setForm({...form, linked_org_unit_id:v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Owner (optional)" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value={null}>—</SelectItem>
                    {orgUnits.map(u=> (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button onClick={createType} disabled={saving || !form.name.trim()} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="mt-2">
                <Input placeholder='Risk profile JSON (optional). Example: {"impactWeightMultipliers":{"bia_impact_ops_dependency_share":1.2}}'
                  value={form.risk_profile}
                  onChange={(e)=>setForm({...form, risk_profile:e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            {/* List/manage */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {types.sort((a,b)=>(a.order_index??999)-(b.order_index??999)).map(t=>(
                <div key={t.id} className="rounded-md border border-slate-700 p-3 grid md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-2 font-medium">{t.name}</div>
                  <div className="md:col-span-2">
                    <Select value={t.category || "IT"} onValueChange={(v)=>update(t.id,{category:v})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {["IT","OT_ICS","Cloud","Data_Store","Security","Application","Network","Other"].map(c=>(
                          <SelectItem key={c} value={c}>{c.replace("_","/")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Input type="number" value={t.order_index ?? 100} onChange={(e)=>update(t.id,{order_index:Number(e.target.value)||100})} className="bg-slate-800 border-slate-700" />
                  </div>
                  <div className="md:col-span-3">
                    <Input value={(t.keywords||[]).join(", ")} onChange={(e)=>update(t.id,{keywords:e.target.value.split(",").map(s=>s.trim().toLowerCase()).filter(Boolean)})} className="bg-slate-800 border-slate-700" />
                  </div>
                  <div className="md:col-span-2">
                    <Select value={t.linked_org_unit_id || ""} onValueChange={(v)=>update(t.id,{linked_org_unit_id: v || undefined})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Owner" /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value={null}>—</SelectItem>
                        {orgUnits.map(u=> (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-1">
                    <Checkbox checked={t.active !== false} onCheckedChange={(v)=>update(t.id,{active: !!v})} />
                    <span className="text-sm text-slate-300">Active</span>
                  </div>
                  <div className="md:col-span-12">
                    <div className="flex gap-2">
                      <Button variant="outline" className="border-slate-600 text-slate-300" onClick={()=>update(t.id,{})}>
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button variant="ghost" className="text-red-300" onClick={()=>remove(t.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Input value={t.risk_profile || ""} onChange={(e)=>update(t.id,{risk_profile: e.target.value})} className="bg-slate-800 border-slate-700"
                        placeholder='Risk profile JSON (optional). Example: {"likelihoodWeightMultipliers":{"bia_exposure_legacy_status":1.1}}'
                      />
                    </div>
                  </div>
                </div>
              ))}
              {types.length === 0 && (
                <div className="text-sm text-slate-400">No types yet. Add the first one above.</div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}