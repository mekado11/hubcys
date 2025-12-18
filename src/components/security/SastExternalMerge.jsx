
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GitBranch } from "lucide-react";
import { unifySastFindings } from "@/functions/unifySastFindings";

const sevClass = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "critical") return "bg-red-600/20 text-red-300 border-red-600/40";
  if (v === "high") return "bg-orange-600/20 text-orange-300 border-orange-600/40";
  if (v === "medium") return "bg-yellow-600/20 text-yellow-300 border-yellow-600/40";
  if (v === "low") return "bg-blue-600/20 text-blue-300 border-blue-600/40";
  return "bg-slate-600/20 text-slate-300 border-slate-600/40";
};

export default function SastExternalMerge({ initialLlmFindings = null, initialExternalFindings = null }) {
  const [llmInput, setLlmInput] = useState(
    initialLlmFindings ? JSON.stringify(initialLlmFindings, null, 2) : ""
  );
  const [extInput, setExtInput] = useState(
    initialExternalFindings ? JSON.stringify(initialExternalFindings, null, 2) : ""
  );
  const [loading, setLoading] = useState(false);
  const [merged, setMerged] = useState(null);
  const [error, setError] = useState("");

  const safeParse = (txt) => {
    if (!txt || !txt.trim()) return null;
    try {
      return JSON.parse(txt);
    } catch {
      return null;
    }
  };

  const extractFindingsArray = (obj) => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    if (Array.isArray(obj.findings)) return obj.findings;
    if (obj.data && Array.isArray(obj.data.findings)) return obj.data.findings;
    return [];
  };

  const handleMerge = async () => {
    setError("");
    setMerged(null);
    setLoading(true);
    try {
      const llmParsed = safeParse(llmInput);
      const extParsed = safeParse(extInput);

      const llmFindings = extractFindingsArray(llmParsed);
      // For simplicity, treat pasted external JSON as semgrep-like payload
      const semgrepFindings = extractFindingsArray(extParsed);

      const { data } = await unifySastFindings({
        llmFindings,
        semgrepFindings,
        zapFindings: [],
        dependencyFindings: []
      });

      setMerged(data);
    } catch (e) {
      setError(e?.message || "Failed to merge findings. Please verify your JSON inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-300">
          <GitBranch className="w-5 h-5" />
          Merge External Scanner Results
        </CardTitle>
        <p className="text-sm text-gray-400">
          Paste your SAST LLM findings and any external tool JSON (Semgrep/ZAP/Deps) to create a single, unified result set.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-300 mb-2">LLM Findings JSON (full object or findings array)</div>
            <Textarea
              className="bg-slate-900/50 border-slate-700 text-gray-200 h-48"
              placeholder='Ex: {"findings":[...]} or just [...]'
              value={llmInput}
              onChange={(e) => setLlmInput(e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm text-gray-300 mb-2">External Tool JSON (Semgrep/ZAP/Deps)</div>
            <Textarea
              className="bg-slate-900/50 border-slate-700 text-gray-200 h-48"
              placeholder="Paste raw JSON array or object that contains a findings array"
              value={extInput}
              onChange={(e) => setExtInput(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleMerge} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Merge Findings
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        {merged?.findings?.length > 0 && (
          <div className="mt-2">
            <div className="text-sm text-gray-400 mb-2">
              Unified Results: {merged.count} findings
            </div>
            <div className="space-y-3">
              {merged.findings.map((f, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={sevClass(f.severity)}>{f.severity || "info"}</Badge>
                    {f.owasp_category && (
                      <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/40">
                        {f.owasp_category}
                      </Badge>
                    )}
                    {Array.isArray(f.sources) && f.sources.length > 0 && (
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {f.sources.join(", ")}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 text-white font-medium">{f.title || "Finding"}</div>
                  {f.description && (
                    <div className="text-sm text-gray-400 mt-1">{f.description}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {f.file ? `${f.file}${f.line ? `:${f.line}` : ""}` : null}
                  </div>
                  {f.owasp_cheat_sheet_url && (
                    <a
                      href={f.owasp_cheat_sheet_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-300 underline mt-2 inline-block"
                    >
                      OWASP Cheat Sheet
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
