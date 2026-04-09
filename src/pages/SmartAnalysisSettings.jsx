import React, { useEffect, useState } from "react";
import { User } from "@/entities/User";
import { SmartAnalysisConfig } from "@/entities/SmartAnalysisConfig";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Save, Loader2, Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SmartAnalysisSettings() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    prompt_preamble: "",
    force_sections: true,
    min_recommendations: 6,
    include_external_data: true,
    include_operational_security: true,
    notes_for_analyst: ""
  });
  const [record, setRecord] = useState(null);

  useEffect(() => {
    (async () => {
      const user = await User.me();
      setMe(user);
      const cfg = await SmartAnalysisConfig.filter({ company_id: user.company_id }, "-updated_date", 1);
      if (cfg && cfg.length) {
        setRecord(cfg[0]);
        setConfig({
          prompt_preamble: cfg[0].prompt_preamble || "",
          force_sections: cfg[0].force_sections !== false,
          min_recommendations: cfg[0].min_recommendations ?? 6,
          include_external_data: cfg[0].include_external_data !== false,
          include_operational_security: cfg[0].include_operational_security !== false,
          notes_for_analyst: cfg[0].notes_for_analyst || ""
        });
      }
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    const payload = {
      company_id: me.company_id,
      ...config
    };
    if (record?.id) {
      await SmartAnalysisConfig.update(record.id, payload);
    } else {
      const created = await SmartAnalysisConfig.create(payload);
      setRecord(created);
    }
    setSaving(false);
    alert("Settings saved.");
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (me?.role !== "admin") {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center p-6">
        <Card className="max-w-lg w-full bg-slate-900/70 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Access restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            Only admins can edit Smart Analysis settings.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Smart Analysis Settings</h1>
        </div>
        <Card className="bg-slate-900/60 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-300">Prompt & Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm text-gray-300">Prompt preamble (optional)</label>
              <Textarea
                value={config.prompt_preamble}
                onChange={(e) => setConfig(prev => ({ ...prev, prompt_preamble: e.target.value }))}
                placeholder="Additional instructions injected at the top of the AI prompt"
                className="bg-slate-800/60 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="force_sections"
                  checked={config.force_sections}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, force_sections: Boolean(v) }))}
                />
                <label htmlFor="force_sections" className="text-gray-300 text-sm">Force all sections</label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="include_external_data"
                  checked={config.include_external_data}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, include_external_data: Boolean(v) }))}
                />
                <label htmlFor="include_external_data" className="text-gray-300 text-sm">Include external recon/CVE data</label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="include_operational_security"
                  checked={config.include_operational_security}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, include_operational_security: Boolean(v) }))}
                />
                <label htmlFor="include_operational_security" className="text-gray-300 text-sm">Include operational security practices</label>
              </div>
              <div>
                <label className="text-sm text-gray-300">Minimum recommendations</label>
                <Input
                  type="number"
                  min={3}
                  max={12}
                  value={config.min_recommendations}
                  onChange={(e) => setConfig(prev => ({ ...prev, min_recommendations: Number(e.target.value) || 6 }))}
                  className="bg-slate-800/60 border-slate-700 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-300">Notes for analyst (private)</label>
              <Textarea
                value={config.notes_for_analyst}
                onChange={(e) => setConfig(prev => ({ ...prev, notes_for_analyst: e.target.value }))}
                placeholder="Tone, industry nuances, frameworks to emphasize, risk appetite, etc."
                className="bg-slate-800/60 border-slate-700 text-white"
              />
            </div>
            <Button onClick={onSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save settings</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}