import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Sparkles, FileJson, Copy, Link as LinkIcon, BookOpen } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function HowToUnifyScans() {
  const semgrepExample = `{
  "findings": [
    {
      "title": "Possible XSS via dangerouslySetInnerHTML",
      "severity": "high",
      "file": "src/components/Unsafe.jsx",
      "line": 14,
      "description": "Untrusted HTML rendered without sanitization.",
      "cwe": "CWE-79"
    }
  ]
}`;

  const llmExample = `{
  "findings": [
    {
      "title": "Unsanitized HTML sink",
      "severity": "high",
      "owasp_category": "A03:2021 - Injection",
      "cwe": "CWE-79",
      "file": "src/components/Unsafe.jsx",
      "line": 14,
      "description": "User-provided HTML is injected into DOM.",
      "recommendation": "Use trusted sanitization and avoid dangerouslySetInnerHTML.",
      "owasp_cheat_sheet_url": "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"
    }
  ]
}`;

  const copy = (txt) => navigator.clipboard.writeText(txt);

  return (
    <div className="mt-8">
      <Card className="glass-effect border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-cyan-300">
              <GitBranch className="w-5 h-5" />
              How to “Unify with External Scan”
            </CardTitle>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">SAST Pro Tip</Badge>
          </div>
          <p className="text-gray-400 mt-1">
            Merge AI findings with outputs from tools like Semgrep, ZAP, or dependency scanners into one, deduplicated report.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-cyan-500/30 bg-cyan-500/10">
            <AlertDescription className="text-cyan-100">
              Why unify? Different tools see different angles. Unification normalizes, deduplicates, and enriches findings so you act on one authoritative list instead of juggling multiple outputs.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-medium">
                  <FileJson className="w-4 h-4 text-yellow-300" />
                  Example: External (Semgrep-like) JSON
                </div>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300" onClick={() => copy(semgrepExample)}>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                </Button>
              </div>
              <pre className="text-xs leading-relaxed bg-black/40 border border-slate-800 rounded-md p-3 overflow-x-auto text-slate-200">
{semgrepExample}
              </pre>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-medium">
                  <Sparkles className="w-4 h-4 text-pink-300" />
                  Example: BeaTrace LLM Findings JSON
                </div>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300" onClick={() => copy(llmExample)}>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                </Button>
              </div>
              <pre className="text-xs leading-relaxed bg-black/40 border border-slate-800 rounded-md p-3 overflow-x-auto text-slate-200">
{llmExample}
              </pre>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/50">
            <div className="text-white font-medium mb-2">Step-by-step</div>
            <ol className="list-decimal list-inside text-gray-300 space-y-2">
              <li>Open Command Center → Security Tools → <strong>BeaTrace SAST Scanner</strong>.</li>
              <li>Paste code or upload files, then click <strong>Analyze</strong>.</li>
              <li>Click <strong>Scan Settings</strong> and paste external tool JSON into <em>External findings</em>.</li>
              <li>Use <strong>Unify with External Findings</strong> to merge and deduplicate results.</li>
              <li>Review OWASP-aligned output and export/share as needed.</li>
            </ol>
            <div className="flex gap-2 mt-3">
              <a href={createPageUrl("ResponseReadiness?tab=tools&tool=sast")} className="inline-flex">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Open BeaTrace SAST
                </Button>
              </a>
              <a href="https://cheatsheetseries.owasp.org/index.html" target="_blank" rel="noreferrer" className="inline-flex">
                <Button variant="outline" className="border-gray-600 text-gray-300">
                  <BookOpen className="w-4 h-4 mr-2" />
                  OWASP Cheat Sheets
                </Button>
              </a>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1">
            <LinkIcon className="w-3 h-3" />
            Tip: Keep OWASP alignment enabled to receive mapped A0x:2021 categories, CWE IDs, and cheat sheet links.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}