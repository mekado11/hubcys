
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, ShieldAlert, Bug, AlertTriangle, Loader2, Shield, TrendingUp } from "lucide-react";
import { UploadFile } from "@/integrations/Core";
import { analyzeIocs } from "@/functions/analyzeIocs";
import { Incident } from "@/entities/Incident";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import IocSettings from "@/components/ioc/IocSettings";
import { IOCAnalyzerConfig } from "@/entities/IOCAnalyzerConfig";
import { User } from "@/entities/User";
import { IocFeedback } from "@/entities/IocFeedback";
import LogAnalysisAnimation from "@/components/ui/LogAnalysisAnimation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupedIocReport from "@/components/ioc/GroupedIocReport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function IOCAnalyzer() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState({});
  const [detailIoc, setDetailIoc] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [aiMapping, setAiMapping] = useState(true);
  const [showIncidentPreview, setShowIncidentPreview] = useState(false);
  const [incidentPreview, setIncidentPreview] = useState([]);
  const [logType, setLogType] = useState('cyber');

  const isPrivateIp = (ip) => {
    if (typeof ip !== 'string') return false;
    return (
      /^10\./.test(ip) ||
      /^192\.168\./.test(ip) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
      /^127\./.test(ip)
    );
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setSelected({});
    try {
      const up = await UploadFile({ file });
      const file_url = up?.file_url || up?.data?.file_url || up?.data?.url || null;
      if (!file_url) throw new Error("Failed to upload file");

      const { data } = await analyzeIocs({ file_url, enable_ai_mapping: aiMapping, log_type: logType });
      setResult(data);
    } catch (e) {
      alert(`Analysis failed: ${e.message || e}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const addToWhitelist = async (value) => {
    try {
      const rows = await IOCAnalyzerConfig.filter({}, "-updated_date", 1);
      let cfg = rows?.[0];
      if (!cfg) {
        const currentUser = await User.me();
        const companyId = currentUser?.company_id;
        if (!companyId) {
          throw new Error("Could not determine company ID for whitelist creation.");
        }
        cfg = await IOCAnalyzerConfig.create({ company_id: companyId, whitelist_patterns: [value] });
      } else {
        const list = Array.isArray(cfg.whitelist_patterns) ? [...cfg.whitelist_patterns] : [];
        if (!list.includes(value)) list.push(value);
        await IOCAnalyzerConfig.update(cfg.id, { whitelist_patterns: list });
      }
      alert("Added to whitelist. Re-run analysis to apply.");
    } catch (err) {
      alert(`Failed to update whitelist: ${err.message || err}`);
    }
  };

  const toggleSelect = (ioc) => {
    const key = `${ioc.type}:${ioc.value}`;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = ioc;
      return next;
    });
  };

  const prepareIncidentPreview = () => {
    if (!result) return;
    const iocsToCreate = Object.values(selected);
    if (iocsToCreate.length === 0) {
      alert("Select at least one IOC to create an incident.");
      return;
    }
    
    const preview = iocsToCreate.map((ioc) => {
      const mitreList = (ioc.mitre_with_names || []).map(m => `${m.id} - ${m.name}`).join(", ") || "N/A";
      const rationaleText = (ioc.rationale || []).slice(0, 3).join(" • ");
      const samplesText = (ioc.samples || []).slice(0, 2).map(s => JSON.stringify(s)).join("\n");
      
      const title = `IOC: ${ioc.type.toUpperCase()} ${ioc.value} (${ioc.verdict.toUpperCase()})`;
      const description = [
        `Detected IOC value: ${ioc.value}`,
        `Type: ${ioc.type}`,
        `Score: ${ioc.score}`,
        `Verdict: ${ioc.verdict}`,
        `Mapped MITRE: ${mitreList}`,
        `Mapped OWASP: ${(ioc.owasp_categories || []).join(", ") || "N/A"}`,
        `Mapped NIST: ${ioc.nist_category || "N/A"}`,
        `Recommended actions: ${(ioc.recommended_actions || []).join("; ")}`,
        `Rationale: ${rationaleText}`,
        `Sample events:\n${samplesText}`
      ].join("\n\n");
      
      return {
        ioc,
        title,
        description,
        priority: ioc.verdict === 'high' ? 'High' : ioc.verdict === 'medium' ? 'Medium' : 'Low',
        category: 'Unauthorized_Access'
      };
    });
    
    setIncidentPreview(preview);
    setShowIncidentPreview(true);
  };

  const createIncidentsFromPreview = async () => {
    let created = 0;
    for (const item of incidentPreview) {
      await Incident.create({
        title: item.title,
        description: item.description,
        priority: item.priority,
        category: item.category,
        detection_timestamp: new Date().toISOString(),
        status: 'Detected'
      });
      created += 1;
    }
    alert(`Created ${created} incident(s).`);
    setShowIncidentPreview(false);
    setSelected({});
  };

  const autoSelectHigh = () => {
    if (!result) return;
    const map = {};
    result.results.filter(r => r.verdict === 'high').forEach((r) => {
      map[`${r.type}:${r.value}`] = r;
    });
    setSelected(map);
  };

  const markFeedback = async (ioc, label) => {
    try {
      const currentUser = await User.me();
      const companyId = currentUser?.company_id;
      if (!companyId) {
        alert("Cannot submit feedback: missing company id");
        return;
      }
      const payload = {
        company_id: companyId,
        ioc_type: ioc.type,
        ioc_value: ioc.value,
        label
      };
      if (label === 'true_positive') {
        if (ioc.verdict === 'high') payload.severity_override = 'high';
        if (ioc.verdict === 'medium') payload.severity_override = 'medium';
      }
      await IocFeedback.create(payload);
      alert(`Saved ${label === 'true_positive' ? 'True Positive' : 'False Positive'} feedback for ${ioc.type}:${ioc.value}`);
    } catch (e) {
      alert(`Failed to save feedback: ${e.message || e}`);
    }
  };

  const summarizeRationale = (row) => {
    if (row?.analyst_note) {
      const txt = String(row.analyst_note);
      return txt.length > 180 ? txt.slice(0, 177) + "..." : txt;
    }
    const items = Array.isArray(row?.rationale) ? row.rationale.filter(Boolean) : [];
    if (!items.length) return "—";
    const priority = items.filter((t) =>
      /(credential|stuffing|privilege|beacon|session|token|new country|raised to|true positive|false positive|blacklist|whitelist|multi-source|correlation|download|bulk|exfiltration|large object|windows event 5145|impossible travel|off-hours)/i.test(t)
    );
    const rest = items.filter((t) => !priority.includes(t));
    const ordered = [...priority, ...rest];
    const summary = ordered.slice(0, 3).join(" • ");
    return summary.length > 180 ? summary.slice(0, 177) + "..." : summary;
  };

  const formatActionLabel = (code) => {
    const map = {
      block_ip: "Block IP",
      watchlist_ip: "Watchlist IP",
      auto_enrich_ip: "Auto-enrich IP",
      open_incident: "Open Incident",
      hunt_netflow_24h: "Hunt Netflow (24h)",
      block_domain_or_sinkhole: "Block/Sinkhole Domain",
      passive_dns_sweep: "Passive DNS Sweep",
      alert: "Alert Team",
      watchlist_domain: "Watchlist Domain",
      auto_enrich_domain: "Auto-enrich Domain",
      quarantine_artifact: "Quarantine Artifact",
      block_hash_edr: "Block Hash (EDR)",
      fleet_search_filename_and_parent_cmdline: "Fleet Search (file & parent cmd)",
      collect_memory_and_persistence: "Collect Memory & Persistence",
      watchlist_hash: "Watchlist Hash",
      auto_enrich_hash: "Auto-enrich Hash",
      investigate_internal_host: "Investigate Internal Host"
    };
    return map[code] || code;
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <Shield className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686c4c7cddeaa31e94f721d6/0031e6902_image.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.12
        }}
      />
      
      {/* Content Layer - Now with semi-transparent background and blur */}
      <div 
        className="relative z-10 min-h-screen p-6"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bug className="w-6 h-6 text-cyan-300" /> IOC Analyzer
            </h1>
            <div className="flex items-center gap-3">
              {/* Log type selector */}
              <div className="text-sm text-gray-300 flex items-center gap-2">
                <span className="hidden sm:inline">Log Type</span>
                <Select value={logType} onValueChange={setLogType}>
                  <SelectTrigger className="w-[200px] bg-slate-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Select log type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cyber">Cybersecurity Logs</SelectItem>
                    <SelectItem value="physical_access">Visitor Entry Logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="text-sm text-gray-300 flex items-center gap-2">
                <input type="checkbox" checked={aiMapping} onChange={(e) => setAiMapping(e.target.checked)} />
                AI mapping
              </label>
              <Button variant="outline" onClick={() => setShowSettings(true)} className="border-cyan-500/40 text-cyan-300">
                Settings
              </Button>
            </div>
          </div>

          <Card className="glass-effect border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-cyan-300 text-base">
                {logType === 'physical_access' ? 'Upload Visitor Entry Logs (CSV)' : 'Upload Logs (JSON, CSV, LOG, XML)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="file"
                  accept={logType === 'physical_access' ? '.csv' : '.json,.csv,.log,.txt,.xml'}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="bg-slate-800/50 border-gray-600 text-white"
                />
                <Button onClick={handleUploadAndAnalyze} disabled={!file || analyzing} className="gap-2">
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {analyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
              <p className="text-sm text-gray-400">
                {logType === 'physical_access'
                  ? 'We analyze visitor entry/badge logs to detect anomalies like after-hours access, multiple denials, and entry to high-risk areas.'
                  : 'We normalize and inspect logs to extract suspicious IPs, domains, URLs, and hashes, then score and classify them.'}
              </p>
            </CardContent>
          </Card>

          {analyzing && (
            <LogAnalysisAnimation
              isAnalyzing={analyzing}
              fileName={file?.name || "logfile"}
              aiEnabled={aiMapping}
            />
          )}

          {result && (
            <>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-slate-800/60">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="highlights">Event Highlights</TabsTrigger>
                  <TabsTrigger value="iocs">IOCs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card className="glass-effect border-purple-500/20 bg-slate-900/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-purple-300 text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-slate-800/40 rounded p-3">
                        <div className="text-gray-400 text-xs">Total Events</div>
                        <div className="text-white text-lg font-semibold">{result.summary.total_events}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded p-3">
                        <div className="text-gray-400 text-xs">Total IOCs</div>
                        <div className="text-white text-lg font-semibold">{result.summary.total_iocs}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded p-3 border-2 border-red-500/30">
                        <div className="text-gray-400 text-xs">High</div>
                        <div className="text-red-300 text-2xl font-bold">{result.summary.high}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded p-3 border-2 border-yellow-500/30">
                        <div className="text-gray-400 text-xs">Medium</div>
                        <div className="text-yellow-300 text-2xl font-bold">{result.summary.medium}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded p-3 border-2 border-blue-500/30">
                        <div className="text-gray-400 text-xs">Low</div>
                        <div className="text-blue-300 text-2xl font-bold">{result.summary.low}</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="highlights" className="space-y-4">
                  {result?.event_groups && result.event_groups.length > 0 ? (
                    <div className="grid gap-4">
                      {result.event_groups.map((g, idx) => (
                        <Card key={idx} className="glass-effect border-indigo-500/20 bg-slate-900/80 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getSeverityIcon(g.severity)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={
                                    g.severity === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                    g.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  }>
                                    {g.severity?.toUpperCase()}
                                  </Badge>
                                  <span className="text-gray-400 text-xs">{g.group_type}</span>
                                </div>
                                <p className="text-white text-sm mb-2">{g.narrative}</p>
                                {g.mitre_techniques && g.mitre_techniques.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {g.mitre_techniques.map((tech, i) => (
                                      <Badge key={i} variant="outline" className="text-xs border-purple-500/40 text-purple-200">
                                        {tech}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-effect border-slate-700/40 bg-slate-900/80 backdrop-blur-sm">
                      <CardContent className="p-8 text-center">
                        <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No significant event patterns detected</p>
                        <p className="text-sm text-gray-500 mt-2">Run analysis on logs with behavioral anomalies to see event highlights</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="iocs" className="space-y-4">
                  <GroupedIocReport data={result} />
                </TabsContent>
              </Tabs>
            </>
          )}

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl">
              <DialogHeader>
                <DialogTitle>IOC Analyzer Settings</DialogTitle>
              </DialogHeader>
              <IocSettings onClose={() => setShowSettings(false)} onSaved={() => setShowSettings(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={!!detailIoc} onOpenChange={(open) => !open && setDetailIoc(null)}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  IOC Details — {detailIoc?.type?.toUpperCase()}: {detailIoc?.value}
                </DialogTitle>
              </DialogHeader>
              {detailIoc && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Badge className={
                      detailIoc.verdict === 'high' ? 'bg-red-500/30 text-red-200 border-red-500/50 font-bold' :
                      detailIoc.verdict === 'medium' ? 'bg-yellow-500/30 text-yellow-200 border-yellow-500/50 font-semibold' :
                      'bg-blue-500/30 text-blue-200 border-blue-500/50'
                    }>
                      Verdict: {detailIoc.verdict}
                    </Badge>
                    <Badge variant="outline" className="text-cyan-200 border-cyan-500/40">Score: {Math.round(detailIoc.score)}</Badge>
                    {detailIoc.enrichment?.country_name && (
                      <Badge variant="outline" className="text-emerald-200 border-emerald-500/40">
                        Country: {detailIoc.enrichment.country_name}
                      </Badge>
                    )}
                    {detailIoc.enrichment?.hostname && (
                      <Badge variant="outline" className="text-blue-200 border-blue-500/40">
                        Host: {detailIoc.enrichment.hostname}
                      </Badge>
                    )}
                  </div>

                  {Array.isArray(detailIoc.mitre_with_names) && detailIoc.mitre_with_names.length > 0 && (
                    <div>
                      <div className="text-gray-300 text-sm mb-2">MITRE ATT&CK Techniques</div>
                      <div className="grid grid-cols-1 gap-2">
                        {detailIoc.mitre_with_names.map((tech, i) => (
                          <div key={i} className="bg-slate-800/40 rounded p-2 border border-purple-500/30">
                            <div className="text-purple-200 font-mono text-xs">{tech.id}</div>
                            <div className="text-gray-300 text-sm">{tech.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailIoc.event_context && (
                    <div>
                      <div className="text-gray-300 text-sm mb-2">Event Context</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-300">
                        <div><span className="text-gray-400">Source:</span> {detailIoc.event_context.source || '—'}</div>
                        <div><span className="text-gray-400">Event ID:</span> {detailIoc.event_context.event_id ?? '—'}</div>
                        <div><span className="text-gray-400">Action:</span> {detailIoc.event_context.action || '—'}</div>
                        <div><span className="text-gray-400">Outcome:</span> {detailIoc.event_context.outcome || '—'}</div>
                        <div><span className="text-gray-400">User:</span> {detailIoc.event_context.user || '—'}</div>
                        <div><span className="text-gray-400">Process:</span> {detailIoc.event_context.process_name || '—'}</div>
                        <div><span className="text-gray-400">Source IP:</span> {detailIoc.event_context.src_ip || '—'}</div>
                        <div><span className="text-gray-400">Share/Object:</span> {detailIoc.event_context.share_name || '—'}</div>
                        <div><span className="text-gray-400">Access Mask:</span> {detailIoc.event_context.access_mask || '—'}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-gray-300 text-sm mb-2">Recommended Actions</div>
                    <div className="flex flex-wrap gap-2">
                      {(detailIoc.recommended_actions || []).map((a, idx) => (
                        <Badge key={idx} className="bg-cyan-500/15 text-cyan-200 border-cyan-500/30">
                          {formatActionLabel(a)}
                        </Badge>
                      ))}
                      {(!detailIoc.recommended_actions || detailIoc.recommended_actions.length === 0) && (
                        <span className="text-gray-400 text-sm">No specific actions suggested</span>
                      )}
                    </div>
                  </div>

                  {detailIoc.enrichment?.ti_summary && (
                    <div>
                      <div className="text-gray-300 text-sm mb-1">Threat Intel</div>
                      <div className="text-sm text-gray-300">{detailIoc.enrichment.ti_summary}</div>
                    </div>
                  )}

                  {detailIoc.analyst_note && (
                    <div>
                      <div className="text-gray-300 text-sm mb-1">Analyst Note</div>
                      <div className="text-sm text-gray-300">{detailIoc.analyst_note}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-gray-300 text-sm mb-2">Why this matters</div>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                      {(detailIoc.rationale || []).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-gray-300 text-sm mb-2">Sample Events</div>
                    {Array.isArray(detailIoc.samples) && detailIoc.samples.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-auto rounded-md border border-slate-700 bg-slate-950 p-3">
                        {detailIoc.samples.slice(0, 3).map((s, i) => (
                          <pre key={i} className="text-xs text-gray-200 whitespace-pre-wrap">
  {typeof s === 'string' ? s : JSON.stringify(s, null, 2)}
                          </pre>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">No sample events available</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                      onClick={() => navigator.clipboard.writeText(detailIoc.value || '')}
                    >
                      Copy IOC Value
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(detailIoc, null, 2))}
                    >
                      Copy IOC JSON
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={showIncidentPreview} onOpenChange={setShowIncidentPreview}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Incidents Before Creation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  Review the incidents that will be created from the selected IOCs. You can modify details before proceeding.
                </div>
                {incidentPreview.map((item, idx) => (
                  <Card key={idx} className="glass-effect border-slate-700/40">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-white">{item.title}</div>
                          <div className="flex gap-2 mt-2">
                            <Badge className={
                              item.priority === 'High' ? 'bg-red-500/30 text-red-200' :
                              item.priority === 'Medium' ? 'bg-yellow-500/30 text-yellow-200' :
                              'bg-blue-500/30 text-blue-200'
                            }>
                              {item.priority}
                            </Badge>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {item.description}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowIncidentPreview(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    onClick={createIncidentsFromPreview}
                  >
                    Create {incidentPreview.length} Incident(s)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
