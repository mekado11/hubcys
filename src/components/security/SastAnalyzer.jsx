import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Bug, CheckCircle, Code2, FileCode, Upload, Loader2, Copy, Download, Shield, Info, BookOpen, Link as LinkIcon, GitBranch, SlidersHorizontal } from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OwaspKnowledgePanel from "./OwaspKnowledgePanel";
import SastExternalMerge from "./SastExternalMerge";
import SastDashboard from "./SastDashboard";
import SastBenchmark from "./SastBenchmark";

const severityColor = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "critical") return "bg-red-500/20 text-red-300 border-red-500/30";
  if (v === "high") return "bg-orange-500/20 text-orange-300 border-orange-500/30";
  if (v === "medium") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  if (v === "low") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  return "bg-gray-500/20 text-gray-300 border-gray-500/30";
};

const SastAnalyzer = () => {
  const [code, setCode] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const [alignOwasp, setAlignOwasp] = useState(true);
  const [includeOwaspLinks, setIncludeOwaspLinks] = useState(true);
  const [externalFindingsRaw, setExternalFindingsRaw] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [activeTab, setActiveTab] = useState("findings");

  // Derive OWASP IDs from results for contextual guidance
  const guidanceOwaspIds = React.useMemo(() => {
    if (!results?.findings) return [];
    const ids = new Set();
    results.findings.forEach(f => {
      const cat = String(f?.owasp_category || "");
      const match = cat.match(/A\d{2}:(?:2017|2021)/i);
      if (match) ids.add(match[0].toUpperCase());
    });
    return Array.from(ids);
  }, [results]);

  const handleFiles = async (fileList) => {
    const accepted = Array.from(fileList || []).filter((f) =>
      /\.(jsx?|tsx?|json|md|mjs|cjs)$/i.test(f.name)
    ).slice(0, 6); // cap to 6 files per run
    setFiles(accepted);

    // Read contents and append to code input (non-destructive)
    const readers = accepted.map((f) => new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve({ name: f.name, text: String(fr.result || "") });
      fr.readAsText(f);
    }));

    const contents = await Promise.all(readers);
    const stitched = contents.map(c => `// FILE: ${c.name}\n${c.text}\n`).join("\n\n");
    setCode(prev => prev ? `${prev}\n\n${stitched}` : stitched);
  };

  const analyze = async () => {
    if (!code.trim()) {
      setError("Please paste code or upload files to analyze.");
      return;
    }
    setError("");
    setResults(null);
    setLoading(true);

    // Trim extremely large inputs to keep within model limits
    const MAX_LEN = 18000; // characters
    const codeForScan = code.length > MAX_LEN
      ? `${code.slice(0, MAX_LEN)}\n\n// [Truncated due to size; analyze representative sections above]`
      : code;

    // UPDATED: response schema with OWASP grounding
    const responseSchema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        risk_score: { type: "number" },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
              cwe: { type: "string" },
              owasp_category: { type: "string" },
              owasp_cwe_mapping: { type: "array", items: { type: "string" } },
              owasp_guidance_snippet: { type: "string" },
              owasp_cheat_sheet_url: { type: "string" },
              description: { type: "string" },
              file: { type: "string" },
              line: { type: "number" },
              code_snippet: { type: "string" },
              recommendation: { type: "string" },
              confidence: { type: "string", enum: ["low", "medium", "high"] }
            },
            required: ["title", "severity", "description", "recommendation"]
          }
        }
      },
      required: ["findings"]
    };

    // NEW: OWASP and external tools directives
    const owaspDirective = alignOwasp ? `
- Classify each finding under OWASP Top 10:2021 using "owasp_category" (e.g., "A01:2021-Broken Access Control").
- Include "owasp_cwe_mapping" (CWE IDs) where relevant.
- Provide "owasp_guidance_snippet" paraphrased from OWASP Cheat Sheet Series.
- ${includeOwaspLinks ? 'Include "owasp_cheat_sheet_url" to the most relevant cheat sheet page when possible.' : ''}` : "";

    const externalToolsNote = externalFindingsRaw.trim()
      ? `EXTERNAL TOOL FINDINGS (JSON):
${externalFindingsRaw.trim()}

Reconcile these raw results with your analysis. Do NOT invent results not reflected by the code or tools.`
      : "";

    // UPDATED: prompt augmentation
    const prompt = `You are a senior application security engineer performing SAST for JavaScript/TypeScript (React/Vite) and Deno functions.
Follow OWASP Cheat Sheet Series and ASVS guidance for classification and remediation.

${owaspDirective}

${externalToolsNote}

Analyze the provided code for security vulnerabilities and insecure patterns. Focus on:
- XSS (incl. dangerouslySetInnerHTML, unsanitized HTML, improper React Markdown usage)
- SSRF / insecure fetch/URL handling
- Insecure use of localStorage/sessionStorage for sensitive data
- Hard-coded secrets or tokens
- Broken access control (client-side only checks)
- Insecure crypto/randomness
- Command/file injection (for backend code)
- Insecure CORS or CSRF surfaces
- Missing security headers/CSP implications
- Known bad patterns in React (e.g., ref leaks of secrets, direct DOM sinks)

For each issue: include title, severity (critical/high/medium/low), CWE if applicable, description, file (if known), line (if known), a short relevant code_snippet, recommendation (specific code change), confidence.

Provide an overall risk_score (0-100) and a concise summary.

CODE START
${codeForScan}
CODE END`;

    try {
      const analysis = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: responseSchema
      });
      // Ensure structure
      const normalized = {
        summary: analysis?.summary || "Scan completed.",
        risk_score: Number(analysis?.risk_score ?? 0),
        findings: Array.isArray(analysis?.findings) ? analysis.findings : []
      };
      setResults(normalized);
    } catch (e) {
      console.error("SAST analysis error:", e);
      setError(e?.message || "Failed to analyze code.");
    } finally {
      setLoading(false);
    }
  };

  const copyJson = () => {
    if (!results) return;
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text);
  };

  const downloadJson = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sast_report.json";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-cyan-300 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          BeaTrace SAST Scanner
        </CardTitle>
        <p className="text-gray-400">
          Paste code or upload files to get a static security review with prioritized findings and actionable fixes.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-500/30 bg-yellow-500/10">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-yellow-100 text-sm">
            AI-assisted analysis: results may include false positives or miss issues. Use as guidance only and perform human review before changes. Do not paste secrets.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste JavaScript/TypeScript/React code here..."
              className="bg-slate-800/50 border-gray-600 text-white min-h-[220px]"
            />
          </div>
          <div className="space-y-3">
            <div>
              <Input
                type="file"
                accept=".js,.jsx,.ts,.tsx,.json,.md,.mjs,.cjs"
                onChange={(e) => handleFiles(e.target.files)}
                className="bg-slate-800/50 border-gray-600 text-white"
              />
              <div className="text-xs text-gray-400 mt-1 flex items-center">
                <Upload className="w-3 h-3 mr-1" /> Up to 6 files; large files are truncated for analysis.
              </div>
            </div>
            {files.length > 0 && (
              <div className="bg-slate-900/40 rounded-lg p-2 max-h-40 overflow-y-auto border border-slate-700/50">
                <div className="text-xs text-gray-400 mb-1 flex items-center">
                  <FileCode className="w-3 h-3 mr-1" /> Selected Files ({files.length})
                </div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {files.map((f) => <li key={f.name}>• {f.name}</li>)}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={analyze} disabled={loading || !code.trim()} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 w-full">
                {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>) : (<><Code2 className="w-4 h-4 mr-2" />Analyze</>)}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-gray-600 text-gray-300"
                onClick={() => setShowSettings(true)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Scan Settings
              </Button>
            </div>
            {error && (
              <div className="text-sm p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
            <div className="text-xs text-gray-500 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5" />
              <span>Results are AI-generated and may include false positives. Review before action. Consider scanning targeted modules for best accuracy.</span>
            </div>
          </div>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-purple-300" />
                <span className="text-white font-medium">Findings</span>
                <Badge className="bg-purple-500/20 text-purple-300">{results.findings?.length || 0}</Badge>
                <Badge className="bg-cyan-500/20 text-cyan-300">
                  Risk Score: {Math.max(0, Math.min(100, Number(results.risk_score || 0)))}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                  onClick={() => setShowGuidance(true)}
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" /> View OWASP Guidance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                  onClick={() => setShowMerge(true)}
                >
                  <GitBranch className="w-3.5 h-3.5 mr-1" /> Unify with External Findings
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 desirous-300" onClick={copyJson}>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy JSON
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300" onClick={downloadJson}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </Button>
              </div>
            </div>

            {results.summary && (
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
                <div className="text-white font-medium mb-1">Summary</div>
                <div className="text-gray-300 text-sm">{results.summary}</div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-800/50">
                <TabsTrigger value="findings">Findings List</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard & Analytics</TabsTrigger>
                <TabsTrigger value="benchmark">Benchmark Testing</TabsTrigger>
              </TabsList>

              <TabsContent value="findings" className="mt-4">
                <div className="space-y-3">
                  {results.findings?.length > 0 ? results.findings.map((f, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {String(f.severity).toLowerCase() === "low" ? (
                        <CheckCircle className="w-4 h-4 text-blue-300" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-300" />
                      )}
                      <div className="text-white font-medium">{f.title || "Issue"}</div>
                      {/* NEW: OWASP and CWE badges */}
                      {f.owasp_category && (
                        <Badge className="bg-cyan-600/20 text-cyan-300 border-cyan-600/40">
                          {f.owasp_category}
                        </Badge>
                      )}
                      {f.cwe && (
                        <Badge className="bg-slate-700/70 text-gray-200">CWE: {f.cwe}</Badge>
                      )}
                      {f.owasp_cheat_sheet_url && (
                        <a
                          href={f.owasp_cheat_sheet_url}
                          className="text-xs text-cyan-300 underline inline-flex items-center gap-1"
                          target="_blank"
                          rel="noreferrer"
                          title="OWASP Cheat Sheet"
                        >
                          <LinkIcon className="w-3 h-3" /> Cheat Sheet
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {f.owasp_cwe_mapping && Array.isArray(f.owasp_cwe_mapping) && f.owasp_cwe_mapping.length > 0 && (
                        <Badge className="bg-slate-700/70 text-gray-200">
                          Mapped: {f.owasp_cwe_mapping.slice(0, 3).join(", ")}
                        </Badge>
                      )}
                      <Badge className={severityColor(f.severity)}>{String(f.severity || "info").toUpperCase()}</Badge>
                      {f.confidence && <Badge className="bg-slate-700/70 text-gray-200">Conf: {f.confidence}</Badge>}
                    </div>
                  </div>
                  {f.file && (
                    <div className="text-gray-400 text-xs mt-1">
                      Location: {f.file}{typeof f.line === "number" ? `:${f.line}` : ""}
                    </div>
                  )}
                  {f.description && (
                    <div className="text-gray-300 text-sm mt-2">
                      {f.description}
                    </div>
                  )}
                  {f.owasp_guidance_snippet && (
                    <div className="text-gray-300 text-sm mt-2 italic">
                      “{f.owasp_guidance_snippet}”
                    </div>
                  )}
                  {f.code_snippet && (
                    <pre className="bg-slate-950/60 text-slate-100 rounded-md p-3 mt-3 overflow-x-auto text-xs border border-slate-800">
{f.code_snippet}
                    </pre>
                  )}
                  {f.recommendation && (
                    <div className="text-emerald-300 text-sm mt-3">
                      <span className="font-semibold">Fix:</span> {f.recommendation}
                    </div>
                  )}
                </div>
                  )) : (
                    <div className="text-gray-400 text-sm">No issues found in the analyzed content.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="dashboard" className="mt-4">
                <SastDashboard findings={results.findings || []} />
              </TabsContent>

              <TabsContent value="benchmark" className="mt-4">
                <SastBenchmark />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* SETTINGS SHEET */}
        <Sheet open={showSettings} onOpenChange={setShowSettings}>
          <SheetContent side="right" className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Scan Settings</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">Align with OWASP Top 10</div>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-cyan-500"
                  checked={alignOwasp}
                  onChange={(e) => setAlignOwasp(e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">Include cheat sheet links</div>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-cyan-500"
                  checked={includeOwaspLinks}
                  onChange={(e) => setIncludeOwaspLinks(e.target.checked)}
                />
              </div>
              <div>
                <div className="text-sm text-gray-300 mb-2">External findings (JSON)</div>
                <Textarea
                  className="bg-slate-900/50 border-slate-700 text-gray-200 h-40"
                  placeholder="Paste JSON from Semgrep/ZAP/Dependency scanners..."
                  value={externalFindingsRaw}
                  onChange={(e) => setExternalFindingsRaw(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-1">Optional. Will be reconciled with AI analysis.</div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* OWASP GUIDANCE MODAL */}
        <Dialog open={showGuidance} onOpenChange={setShowGuidance}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>OWASP Guidance</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <OwaspKnowledgePanel filterIds={guidanceOwaspIds} />
            </div>
          </DialogContent>
        </Dialog>

        {/* UNIFY FINDINGS MODAL */}
        <Dialog open={showMerge} onOpenChange={setShowMerge}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Unify with External Findings</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <SastExternalMerge
                initialLlmFindings={results || {}}
                initialExternalFindings={externalFindingsRaw ? (() => { try { return JSON.parse(externalFindingsRaw); } catch { return null; } })() : null}
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SastAnalyzer;