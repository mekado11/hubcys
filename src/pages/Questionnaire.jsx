import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Loader2, ArrowLeft } from "lucide-react";
import { generateQuestionnaireMarkdown } from "@/functions/generateQuestionnaireMarkdown";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Questionnaire() {
  const [loadingMd, setLoadingMd] = useState(false);
  const [markdown, setMarkdown] = useState("");

  const downloadTemplate = () => {
    // Direct link to the professionally formatted PDF template
    const pdfUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686c4c7cddeaa31e94f721d6/a107556f2_FortigapCybersecurityAssessmentQuestions.pdf";
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "Fortigap_Assessment_Questionnaire.pdf";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const getMarkdown = async (save) => {
    setLoadingMd(true);
    const res = await generateQuestionnaireMarkdown();
    const text = typeof res.data === "string" ? res.data : new TextDecoder().decode(res.data);
    setMarkdown(text || "");
    if (save) {
      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fortigap_assessment_questionnaire.md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    setLoadingMd(false);
  };

  return (
    <div className="min-h-screen cyber-gradient text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Assessment Questionnaire</h1>
          <Link to={createPageUrl("Assessment")}>
            <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessment
            </Button>
          </Link>
        </div>

        <p className="text-gray-300 mb-6">
          Download the full set of assessment questions to share with your engineering team for offline input.
        </p>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Button onClick={downloadTemplate} className="bg-indigo-600 hover:bg-indigo-700">
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF Template
          </Button>
          <Button onClick={() => getMarkdown(true)} disabled={loadingMd} variant="outline" className="border-cyan-500/30 text-cyan-300">
            {loadingMd ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            Download Markdown
          </Button>
          <Button onClick={() => getMarkdown(false)} disabled={loadingMd} variant="ghost" className="text-gray-300 hover:text-white">
            {loadingMd ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            Preview Markdown
          </Button>
        </div>

        {markdown && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-200">{markdown}</pre>
          </div>
        )}
      </div>
    </div>
  );
}