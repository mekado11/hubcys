
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  Calendar,
  AlertTriangle,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { generateGrandSummary } from "@/functions/generateGrandSummary";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GrandSummarySection({ assessmentData, onGrandSummaryUpdate }) {
  const [regenerating, setRegenerating] = useState(false);
  const [notice, setNotice] = useState(null); // {type: 'success' | 'error', text: string}

  const handleRegenerate = async () => {
    // Add safety check for assessmentData and id
    if (!assessmentData?.id) {
      setNotice({ type: "error", text: "Assessment ID not found. Please ensure the assessment is properly saved before regenerating the grand summary." });
      return;
    }

    setRegenerating(true);
    setNotice(null); // Clear any previous notices
    try {
      const response = await generateGrandSummary({
        assessmentId: assessmentData.id
      });
      
      if (response.status === 200 && response.data?.grand_summary) {
        onGrandSummaryUpdate(response.data.grand_summary);
        setNotice({ type: "success", text: "Grand Summary regenerated successfully!" });
      } else {
        throw new Error("Failed to generate grand summary");
      }
    } catch (error) {
      console.error("Error regenerating grand summary:", error);
      setNotice({ type: "error", text: "Failed to regenerate grand summary. Please try again." });
    } finally {
      setRegenerating(false);
    }
  };

  // Improved markdown components for better formatting
  const markdownComponents = {
    h1: ({ children, ...props }) => (
      <h1 className="text-2xl font-bold text-white mb-6 mt-8 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-xl font-semibold text-white mb-4 mt-6" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-lg font-semibold text-white mb-3 mt-5" {...props}>
        {children}
      </h3>
    ),
    p: ({ children, ...props }) => (
      <p className="text-gray-300 mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-gray-300 leading-relaxed pl-1" {...props}>
        {children}
      </li>
    ),
    strong: ({ children, ...props }) => (
      <strong className="text-white font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="text-cyan-300" {...props}>
        {children}
      </em>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-cyan-500 pl-4 my-4 bg-slate-800/30 py-2 rounded-r" {...props}>
        {children}
      </blockquote>
    ),
    code: ({ inline, children, ...props }) => {
      return inline ? (
        <code className="bg-slate-700 px-2 py-1 rounded text-cyan-300 text-sm" {...props}>
          {children}
        </code>
      ) : (
        <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto mb-4">
          <code className="text-cyan-300" {...props}>
            {children}
          </code>
        </pre>
      );
    }
  };

  // Add safety checks for assessmentData
  const hasGrandSummary = assessmentData?.grand_summary?.trim();
  const hasExternalData = assessmentData?.external_attack_surface || assessmentData?.surface_exposure_score;
  const isAssessmentValid = assessmentData?.id;

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-cyan-300 flex items-center">
                Grand Summary with External Intelligence
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                AI-powered synthesis of internal assessment and external attack surface findings
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasExternalData && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 flex items-center space-x-1">
                <ExternalLink className="w-3 h-3" />
                <span>External Data Linked</span>
              </Badge>
            )}
            <Button
              onClick={handleRegenerate}
              disabled={regenerating || !isAssessmentValid}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              title={!isAssessmentValid ? "Assessment must be saved before regenerating grand summary" : ""}
            >
              {regenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Grand Summary
                </>
              )}
            </Button>
          </div>
        </div>

        {hasGrandSummary && assessmentData?.grand_summary_generated_date && (
          <div className="flex items-center text-sm text-gray-400 mt-3">
            <Calendar className="w-4 h-4 mr-2" />
            Generated on {format(new Date(assessmentData.grand_summary_generated_date), 'PPP \'at\' p')}
          </div>
        )}
        {notice && (
          <div className="mt-3">
            <Alert className={notice.type === "error" ? "border-red-500/30 bg-red-500/10" : "border-green-500/30 bg-green-500/10"}>
              <AlertDescription className={notice.type === "error" ? "text-red-300" : "text-green-300"}>
                {notice.text}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {!isAssessmentValid ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Assessment Not Available
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Unable to generate grand summary. Please ensure the assessment is properly saved and try again.
            </p>
          </div>
        ) : hasGrandSummary ? (
          <div className="prose prose-invert prose-slate max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {assessmentData.grand_summary}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Grand Summary Available
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Generate a comprehensive analysis that combines your internal assessment with external threat intelligence.
            </p>
            <Button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {regenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Grand Summary
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
