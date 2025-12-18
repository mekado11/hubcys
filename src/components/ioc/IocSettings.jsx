import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, RotateCcw, Info, AlertCircle } from "lucide-react";
import { IOCAnalyzerConfig } from "@/entities/IOCAnalyzerConfig";
import { User } from "@/entities/User";
import { toast } from "sonner";

/**
 * Fortigap – IOC Analyzer Settings
 *
 * Key features:
 * - Strong typing + defaults
 * - Client-side validation with inline errors
 * - Weight normalization (sum to 1.0) + visual meter
 * - Threshold guards (0–100; HIGH > MED)
 * - Dirty-state + Reset to defaults
 * - Safer async loading with abort guard
 * - Robust array field UX (whitelist/blacklist)
 * - Save button disabled when invalid or unchanged
 */

// ---------------------- Types & defaults ----------------------

const DEFAULTS = {
  company_id: "",
  thresholds: { high: 75, medium: 50 },
  weights: { w_hash: 0.25, w_ip: 0.2, w_behavior: 0.35, w_geo: 0.1, w_ctx: 0.1 },
  context_multiplier: 1,
  whitelist_patterns: [],
  blacklist_values: [],
  enable_ai_mapping: false,
  enable_shodan_enrichment: true,
  geo_risk_weights: null
};

// Utility to deep clone defaults with a given company id
const makeDefaults = (company_id) => ({
  ...DEFAULTS,
  company_id,
  thresholds: { ...DEFAULTS.thresholds },
  weights: { ...DEFAULTS.weights },
  whitelist_patterns: [...DEFAULTS.whitelist_patterns],
  blacklist_values: [...DEFAULTS.blacklist_values],
});

// ---------------------- Data normalization ----------------------

const clampNum = (v, min, max) => {
  const n = Number(v);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
};

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

const normalizeIncoming = (raw) => {
  const base = makeDefaults(raw.company_id || "");
  
  return {
    id: raw.id,
    company_id: raw.company_id || base.company_id,
    thresholds: {
      high: clampNum(raw.thresholds?.high, 0, 100) || base.thresholds.high,
      medium: clampNum(raw.thresholds?.medium, 0, 100) || base.thresholds.medium,
    },
    weights: {
      w_hash: clampNum(raw.weights?.w_hash, 0, 1) || base.weights.w_hash,
      w_ip: clampNum(raw.weights?.w_ip, 0, 1) || base.weights.w_ip,
      w_behavior: clampNum(raw.weights?.w_behavior, 0, 1) || base.weights.w_behavior,
      w_geo: clampNum(raw.weights?.w_geo, 0, 1) || base.weights.w_geo,
      w_ctx: clampNum(raw.weights?.w_ctx, 0, 1) || base.weights.w_ctx,
    },
    context_multiplier: clampNum(raw.context_multiplier, 0.1, 10) || base.context_multiplier,
    whitelist_patterns: Array.isArray(raw.whitelist_patterns) ? raw.whitelist_patterns : base.whitelist_patterns,
    blacklist_values: Array.isArray(raw.blacklist_values) ? raw.blacklist_values : base.blacklist_values,
    enable_ai_mapping: Boolean(raw.enable_ai_mapping),
    enable_shodan_enrichment: raw.enable_shodan_enrichment !== false,
    geo_risk_weights: raw.geo_risk_weights || null,
    updated_date: raw.updated_date,
  };
};

// ---------------------- Validation ----------------------

const validate = (cfg) => {
  const issues = {};
  
  if (!cfg) {
    return { issues: { general: "Configuration not loaded" }, isValid: false };
  }

  // Threshold validation
  if (cfg.thresholds.high < 0 || cfg.thresholds.high > 100) {
    issues.high = "High threshold must be between 0-100";
  }
  if (cfg.thresholds.medium < 0 || cfg.thresholds.medium > 100) {
    issues.medium = "Medium threshold must be between 0-100";
  }
  if ((cfg.thresholds.high ?? 0) <= (cfg.thresholds.medium ?? 0)) {
    issues.medium = "Medium must be lower than High";
  }

  // Weight validation
  const weightSum = sum(Object.values(cfg.weights || {}));
  if (weightSum <= 0) {
    issues.weights = "Weights must sum to a positive value";
  }

  // Context multiplier validation
  if (cfg.context_multiplier < 0.1 || cfg.context_multiplier > 10) {
    issues.context_multiplier = "Context multiplier must be between 0.1-10";
  }

  return { issues, isValid: Object.keys(issues).length === 0 };
};

// ---------------------- Component ----------------------

export default function IocSettings({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [original, setOriginal] = useState(null);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const u = await User.me();
        const rows = await IOCAnalyzerConfig.filter(
          { company_id: u.company_id },
          "-updated_date",
          1
        );
        const initial = rows?.[0]
          ? normalizeIncoming(rows[0])
          : makeDefaults(u.company_id);
        if (!mounted.current) return;
        setCfg(initial);
        setOriginal(initial);
      } catch (e) {
        console.error(e);
        if (mounted.current) {
          setError("Failed to load settings");
          toast.error("Failed to load IOC Analyzer settings");
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  // ---------------------- Validation ----------------------

  const { issues, isValid } = useMemo(() => validate(cfg), [cfg]);

  const weightSum = useMemo(() =>
    cfg ? sum(Object.values(cfg.weights || {})) : 0,
  [cfg]);

  const dirty = useMemo(() => {
    return JSON.stringify(cfg) !== JSON.stringify(original);
  }, [cfg, original]);

  // ---------------------- Handlers ----------------------

  const setThreshold = (key, v) =>
    cfg && setCfg({ ...cfg, thresholds: { ...cfg.thresholds, [key]: v } });

  const setWeight = (key, v) =>
    cfg && setCfg({ ...cfg, weights: { ...cfg.weights, [key]: v } });

  const normalizeWeights = () => {
    if (!cfg) return;
    const values = Object.values(cfg.weights);
    const s = sum(values);
    if (s === 0) {
      toast.error("Cannot normalize zero weights");
      return;
    }
    const normalized = {
      w_hash: +(cfg.weights.w_hash / s).toFixed(2),
      w_ip: +(cfg.weights.w_ip / s).toFixed(2),
      w_behavior: +(cfg.weights.w_behavior / s).toFixed(2),
      w_geo: +(cfg.weights.w_geo / s).toFixed(2),
      w_ctx: +(cfg.weights.w_ctx / s).toFixed(2),
    };
    setCfg({ ...cfg, weights: normalized });
    toast.success("Weights normalized to sum to 1.0");
  };

  const updateArray = (key, idx, val) => {
    if (!cfg) return;
    const copy = [...cfg[key]];
    copy[idx] = val;
    setCfg({ ...cfg, [key]: copy });
  };

  const addArray = (key) => {
    if (!cfg) return;
    setCfg({ ...cfg, [key]: [...cfg[key], ""] });
  };

  const removeArray = (key, idx) => {
    if (!cfg) return;
    setCfg({ ...cfg, [key]: cfg[key].filter((_, i) => i !== idx) });
  };

  const handleReset = () => {
    if (!window.confirm("Reset all settings to defaults?")) return;
    const defaults = makeDefaults(cfg?.company_id || "");
    setCfg(defaults);
    toast.info("Settings reset to defaults (not saved yet)");
  };

  const handleSave = async () => {
    if (!cfg || !isValid) return;
    setSaving(true);
    setError(null);
    try {
      let saved;
      if (cfg.id) {
        saved = await IOCAnalyzerConfig.update(cfg.id, cfg);
      } else {
        saved = await IOCAnalyzerConfig.create(cfg);
      }
      if (!mounted.current) return;
      const normalized = normalizeIncoming(saved);
      setCfg(normalized);
      setOriginal(normalized);
      toast.success("IOC Analyzer settings saved successfully");
      onSaved?.(normalized);
    } catch (e) {
      console.error(e);
      if (mounted.current) {
        setError("Failed to save settings");
        toast.error("Failed to save settings: " + (e.message || "Unknown error"));
      }
    } finally {
      if (mounted.current) setSaving(false);
    }
  };

  // ---------------------- Render ----------------------

  if (loading) {
    return (
      <Card className="glass-effect border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-gray-400">Loading IOC Analyzer settings...</div>
        </CardContent>
      </Card>
    );
  }

  if (error && !cfg) {
    return (
      <Card className="glass-effect border-red-500/30">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-300 mb-4">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!cfg) return null;

  const canSave = isValid && dirty && !saving;

  return (
    <div className="space-y-6">
      {/* Header with dirty indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">IOC Analyzer Settings</h2>
        {dirty && (
          <Badge variant="outline" className="border-yellow-500/50 text-yellow-300">
            Unsaved changes
          </Badge>
        )}
      </div>

      {/* Thresholds */}
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-300">Verdict Thresholds (0-100)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="high-threshold">High Threshold</Label>
            <Input
              id="high-threshold"
              type="number"
              min="0"
              max="100"
              value={cfg.thresholds.high}
              onChange={(e) => setThreshold("high", Number(e.target.value))}
              className="bg-slate-800/50 border-gray-600 text-white"
            />
            {issues.high && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {issues.high}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="medium-threshold">Medium Threshold</Label>
            <Input
              id="medium-threshold"
              type="number"
              min="0"
              max="100"
              value={cfg.thresholds.medium}
              onChange={(e) => setThreshold("medium", Number(e.target.value))}
              className="bg-slate-800/50 border-gray-600 text-white"
            />
            {issues.medium && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {issues.medium}
              </p>
            )}
          </div>

          <div className="text-xs text-gray-400 flex items-start gap-2 p-3 bg-slate-800/30 rounded">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Scores ≥ High = "high" verdict, ≥ Medium = "medium", else "low". 
              High must be greater than Medium.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Weights */}
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-cyan-300">Scoring Weights</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={weightSum === 1 ? "default" : "outline"} 
                     className={weightSum === 1 ? "bg-green-500/20 text-green-300" : "border-yellow-500/50 text-yellow-300"}>
                Sum: {weightSum.toFixed(2)}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={normalizeWeights}
                disabled={weightSum === 0}
                className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
              >
                Normalize
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(cfg.weights).map(([key, val]) => (
            <div key={key}>
              <Label htmlFor={`weight-${key}`} className="text-sm capitalize">
                {key.replace('w_', '').replace('_', ' ')}
              </Label>
              <Input
                id={`weight-${key}`}
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={val}
                onChange={(e) => setWeight(key, Number(e.target.value))}
                className="bg-slate-800/50 border-gray-600 text-white"
              />
            </div>
          ))}
          {issues.weights && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {issues.weights}
            </p>
          )}
          <div className="text-xs text-gray-400 flex items-start gap-2 p-3 bg-slate-800/30 rounded">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Weights don't need to sum to exactly 1.0, but the "Normalize" button will adjust them proportionally if needed.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Context Multiplier */}
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-300">Context Multiplier</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="ctx-mult">Multiplier (0.1 - 10.0)</Label>
          <Input
            id="ctx-mult"
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={cfg.context_multiplier}
            onChange={(e) => setCfg({ ...cfg, context_multiplier: Number(e.target.value) })}
            className="bg-slate-800/50 border-gray-600 text-white"
          />
          {issues.context_multiplier && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {issues.context_multiplier}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Applied to asset criticality or business context scores (1.0 = neutral).
          </p>
        </CardContent>
      </Card>

      {/* Whitelist */}
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-300">Whitelist Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cfg.whitelist_patterns.map((pat, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={pat}
                onChange={(e) => updateArray("whitelist_patterns", idx, e.target.value)}
                placeholder="e.g. 10.0.*, *.internal.com"
                className="bg-slate-800/50 border-gray-600 text-white flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeArray("whitelist_patterns", idx)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArray("whitelist_patterns")}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pattern
          </Button>
          <p className="text-xs text-gray-400">
            Patterns support * wildcard at start/end. Matching IOCs will be excluded from analysis.
          </p>
        </CardContent>
      </Card>

      {/* Blacklist */}
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-300">Blacklist Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cfg.blacklist_values.map((val, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={val}
                onChange={(e) => updateArray("blacklist_values", idx, e.target.value)}
                placeholder="Exact IOC value"
                className="bg-slate-800/50 border-gray-600 text-white flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeArray("blacklist_values", idx)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArray("blacklist_values")}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Value
          </Button>
          <p className="text-xs text-gray-400">
            Exact IOC values (case-sensitive). Matching IOCs will always be marked high-risk.
          </p>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-300">Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-mapping">AI-Based ATT&CK Mapping</Label>
              <p className="text-xs text-gray-400">
                Use LLM to enhance ATT&CK/OWASP/NIST mappings for IOCs
              </p>
            </div>
            <Switch
              id="ai-mapping"
              checked={cfg.enable_ai_mapping}
              onCheckedChange={(v) => setCfg({ ...cfg, enable_ai_mapping: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="shodan">Shodan Enrichment</Label>
              <p className="text-xs text-gray-400">
                Query Shodan for exposed services on IP addresses
              </p>
            </div>
            <Switch
              id="shodan"
              checked={cfg.enable_shodan_enrichment}
              onCheckedChange={(v) => setCfg({ ...cfg, enable_shodan_enrichment: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <div className="flex items-start gap-2 text-xs text-gray-400 flex-1">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            These settings control how the IOC Analyzer scores and classifies indicators from uploaded log files.
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!dirty || saving}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}