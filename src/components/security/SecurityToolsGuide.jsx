import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield, Code2, GitBranch, Sparkles, BookOpen, Settings, Upload, Download, ChevronDown, Link as LinkIcon
} from "lucide-react";
import { createPageUrl } from "@/utils";
import HowToUnifyScans from "@/components/security/HowToUnifyScans";

function BeaTraceSastHowTo() {
  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-300">
            <Shield className="w-5 h-5" />
            BeaTrace SAST Scanner — Quick Tutorial
          </CardTitle>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30">Step-by-step</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert className="border-cyan-500/30 bg-cyan-500/10">
          <AlertDescription className="text-cyan-100">
            Paste code or upload files for an AI-assisted security review aligned with OWASP Top 10:2021.
            Use “Unify with External Findings” to merge Semgrep/ZAP/dependency results.
          </AlertDescription>
        </Alert>

        <ol className="list-decimal list-inside text-gray-300 space-y-2">
          <li>Open Command Center → Security Tools → <strong>BeaTrace SAST</strong>.</li>
          <li>Paste JS/TS/React code or <span className="inline-flex items-center gap-1"><Upload className="w-3 h-3" /> upload</span> up to 6 files.</li>
          <li>Click <span className="inline-flex items-center gap-1"><Settings className="w-3 h-3" /> Scan Settings</span> to:
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Align to OWASP Top 10 and include cheat sheet links.</li>
              <li>Paste external tool JSON into “External findings”.</li>
            </ul>
          </li>
          <li>Press <span className="inline-flex items-center gap-1"><Code2 className="w-3 h-3" /> Analyze</span> to generate findings and a risk score.</li>
          <li>Use <span className="inline-flex items-center gap-1"><GitBranch className="w-3 h-3" /> Unify with External Findings</span> to normalize, deduplicate, and enrich results.</li>
          <li>Review OWASP badges and remediation, then <span className="inline-flex items-center gap-1"><Download className="w-3 h-3" /> export</span> or copy JSON.</li>
        </ol>

        <div className="flex flex-wrap gap-2 pt-1">
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

        <div className="text-xs text-gray-500 flex items-center gap-1">
          <LinkIcon className="w-3 h-3" />
          Tip: Keep OWASP alignment on to auto-tag findings with A0x:2021 categories and CWE IDs.
        </div>
      </CardContent>
    </Card>
  );
}

export default function SecurityToolsGuide() {
  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-purple-300">
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Security Tools Tutorials
          </span>
          <span className="text-xs text-gray-400">Compact, collapsible guides</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full text-left rounded-lg border border-slate-700/50 px-4 py-3 hover:bg-slate-800/40 transition flex items-center justify-between">
              <span className="text-cyan-300 font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" /> BeaTrace SAST Scanner — How to run a scan
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <BeaTraceSastHowTo />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full text-left rounded-lg border border-slate-700/50 px-4 py-3 hover:bg-slate-800/40 transition flex items-center justify-between">
              <span className="text-cyan-300 font-medium flex items-center gap-2">
                <GitBranch className="w-4 h-4" /> How to “Unify with External Scan”
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <HowToUnifyScans />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}