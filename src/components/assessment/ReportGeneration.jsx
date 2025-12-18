import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ExternalLink, Download } from "lucide-react";
import { createPageUrl } from "@/utils";
import { generateGrandSummary } from "@/functions/generateGrandSummary";
import { generateReportPdf } from "@/functions/generateReportPdf";

export default function ReportGeneration({ data, onSave }) {
  const [aiRunning, setAiRunning] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const runAiAnalysis = async () => {
    setAiRunning(true);
    try {
      const id = await onSave?.();
      if (!id) return;
      await generateGrandSummary({ assessmentId: id });
      // No toast system used here; simply finish silently
    } finally {
      setAiRunning(false);
    }
  };

  const openProfessionalReport = async () => {
    const id = (await onSave?.()) || data?.id;
    if (!id) return;
    window.location.href = createPageUrl(`ProfessionalReportView?id=${id}`);
  };

  const downloadPdf = async () => {
    setPdfGenerating(true);
    try {
      const id = (await onSave?.()) || data?.id;
      if (!id) return;
      const { data: pdf } = await generateReportPdf({ assessmentId: id, customizations: {} });
      const blob = new Blob([pdf], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FortiGaP_Report_${data?.company_name?.replace(/\s+/g, "_") || "Assessment"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } finally {
      setPdfGenerating(false);
    }
  };

  const score = typeof data?.overall_score === "number" ? data.overall_score : 0;
  const level = data?.maturity_level || "Beginner";

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Smart Analysis
        </CardTitle>
        <p className="text-gray-400">
          Generate an AI-driven executive summary and prioritized recommendations from your inputs.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-slate-700/50 p-4 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-sm">Overall Score</div>
            <div className="text-white text-2xl font-bold">{score}%</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Maturity Level</div>
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-white font-semibold">
              {level}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={runAiAnalysis}
            disabled={aiRunning}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            {aiRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running AI…</> : <>Run AI Analysis</>}
          </Button>

          <Button
            onClick={openProfessionalReport}
            className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Professional Report
          </Button>

          <Button
            onClick={downloadPdf}
            variant="outline"
            disabled={pdfGenerating}
            className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
          >
            {pdfGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><Download className="w-4 h-4 mr-2" />Download PDF</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}