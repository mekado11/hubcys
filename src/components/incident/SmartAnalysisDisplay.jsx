
import React, { useState, useEffect } from 'react';
import { CardHeader, CardContent } from "@/components/ui/card";
import { Brain, ShieldCheck, CheckSquare, AlertTriangle, Loader2, FileText, Lightbulb, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvokeLLM } from "@/integrations/Core";

export default function SmartAnalysisDisplay({ incident, incidentData, onUpdate, readOnly = false }) {
  // Use whichever prop is provided; stay resilient if one is missing
  const inc = incident || incidentData || null;

  const [analysis, setAnalysis] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Attempt to parse existing smart_analysis from provided incident object
    if (inc?.smart_analysis) {
      try {
        const parsedAnalysis = JSON.parse(inc.smart_analysis);
        setAnalysis(parsedAnalysis);
        setError(null);
      } catch (e) {
        console.error("Failed to parse existing smart_analysis:", e);
        setError("Failed to load existing Smart analysis. It might be corrupted.");
        setAnalysis(null);
      }
    } else {
      setAnalysis(null);
    }
  }, [inc?.smart_analysis]);

  const generateSmartAnalysis = async () => {
    setGenerating(true);
    setAnalysis(null);
    setError(null);

    // Enhanced prompt that includes NIS2 considerations
    const nis2Context = inc?.nis2_significance === 'Significant'
      ? `\n\n**NIS2 COMPLIANCE CONTEXT:**
- This incident has been assessed as SIGNIFICANT under NIS2 criteria
- Affected services: ${inc?.nis2_affected_services || 'Not specified'}
- Cross-border impact: ${inc?.nis2_cross_border_impact ? 'YES' : 'NO'}
- Notified authorities: ${inc?.nis2_notified_authorities || 'Not specified'}
- Initial notification: ${inc?.nis2_initial_notification_sent_at ? 'SENT' : 'PENDING'}
- Interim update: ${inc?.nis2_interim_update_sent_at ? 'SENT' : 'PENDING'}
- Final report: ${inc?.nis2_final_report_sent_at ? 'COMPLETED' : 'PENDING'}`
      : '';

    const prompt = `You are an expert cybersecurity incident commander and compliance specialist. Analyze this security incident and provide comprehensive Smart insights.

**INCIDENT DETAILS:**
- Title: ${inc?.title || 'Untitled'}
- Category: ${inc?.category || 'Not specified'}
- Priority: ${inc?.priority || 'Not specified'}
- Status: ${inc?.status || 'Not specified'}
- Detection: ${inc?.detection_timestamp ? new Date(inc.detection_timestamp).toLocaleString() : 'Not specified'}
- Description: ${inc?.description || 'Not provided'}
- Affected Systems: ${inc?.affected_systems || 'Not specified'}
- Business Impact: ${inc?.business_impact || 'Not specified'}
- Root Cause: ${inc?.root_cause || 'Under investigation'}
- Containment Actions: ${inc?.containment_actions || 'Not specified'}
- Current Status: ${inc?.status || 'Not specified'}${nis2Context}

Your response MUST be a valid JSON object with exactly this structure:
{
  "severity_assessment": "Professional assessment of incident severity and business impact",
  "technical_analysis": "Technical analysis of the incident, including attack vectors, compromised systems, and IOCs",
  "response_effectiveness": "Analysis of response actions taken so far and their effectiveness",
  "compliance_implications": "Analysis of regulatory and compliance implications, including NIS2 requirements if applicable",
  "recommendations": "Specific actionable recommendations for immediate and future actions",
  "lessons_learned": "Key lessons learned and process improvements"
}
`;

    try {
      const response = await InvokeLLM({
        prompt: prompt,
        feature: 'smart_analysis',
        response_json_schema: {
          type: "object",
          properties: {
            severity_assessment: { type: "string" },
            technical_analysis: { type: "string" },
            response_effectiveness: { type: "string" },
            compliance_implications: { type: "string" },
            recommendations: { type: "string" },
            lessons_learned: { type: "string" }
          },
          required: ["severity_assessment", "technical_analysis", "response_effectiveness", "compliance_implications", "recommendations", "lessons_learned"]
        }
      });

      if (response && typeof response === 'object') {
        const cleaned = {};
        for (const key in response) {
          if (Object.prototype.hasOwnProperty.call(response, key)) {
            cleaned[key] = (response[key] || "").toString();
          }
        }
        setAnalysis(cleaned);
        if (!readOnly && onUpdate) {
          onUpdate('smart_analysis', JSON.stringify(cleaned));
        }
      } else {
        throw new Error("Invalid response format received from LLM.");
      }
    } catch (err) {
      console.error("Error generating Smart analysis:", err);
      setError(`Failed to generate Smart analysis: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setGenerating(false);
    }
  };

  // Helper to render a compact card
  const Box = ({ title, content, icon }) => (
    <div className="bg-slate-800/40 border border-gray-700/50 rounded-lg p-4 min-w-[280px] md:min-w-[320px] max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
        {content || 'Not specified'}
      </p>
    </div>
  );

  return (
    <div className="glass-effect border border-purple-500/30 rounded-lg p-6">
      <CardHeader className="px-0 pt-0 pb-4">
        <h3 className="text-purple-300 flex items-center text-xl font-bold">
          <Brain className="w-6 h-6 mr-3" />
          Auto Triage Summary & Smart Analysis
        </h3>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {/* Initial state: No analysis, no generation in progress, no error */}
        {!analysis && !generating && !error && (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-4">No Smart Analysis available yet for this incident.</p>
            {!readOnly && (
              <Button onClick={generateSmartAnalysis} disabled={generating}>
                Generate Smart Analysis
              </Button>
            )}
            {readOnly && <p className="text-gray-500 text-sm">Contact an administrator to generate analysis.</p>}
          </div>
        )}

        {/* Loading state */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p>Generating Smart Analysis...</p>
            <p className="text-sm">This may take a moment.</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-8 text-red-400">
            <p className="font-semibold mb-2">Error:</p>
            <p>{error}</p>
            {!readOnly && (
              <Button onClick={generateSmartAnalysis} disabled={generating} className="mt-4">
                Retry Generation
              </Button>
            )}
          </div>
        )}

        {/* Display analysis if available */}
        {analysis && (
          <>
            <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
              <div className="flex gap-4 min-w-max pr-2">
                <Box
                  title="Severity Assessment"
                  content={analysis.severity_assessment}
                  icon={<TrendingUp className="w-4 h-4 text-orange-400" />}
                />
                <Box
                  title="Technical Analysis"
                  content={analysis.technical_analysis}
                  icon={<FileText className="w-4 h-4 text-blue-400" />}
                />
                <Box
                  title="Response Effectiveness"
                  content={analysis.response_effectiveness}
                  icon={<ShieldCheck className="w-4 h-4 text-green-400" />}
                />
                <Box
                  title="Compliance Implications"
                  content={analysis.compliance_implications}
                  icon={<AlertTriangle className="w-4 h-4 text-purple-400" />}
                />
                <Box
                  title="Recommendations"
                  content={analysis.recommendations}
                  icon={<Lightbulb className="w-4 h-4 text-cyan-400" />}
                />
                <Box
                  title="Lessons Learned"
                  content={analysis.lessons_learned}
                  icon={<CheckSquare className="w-4 h-4 text-green-300" />}
                />
              </div>
            </div>

            {!readOnly && (
              <div className="flex justify-end pt-4">
                <Button onClick={generateSmartAnalysis} disabled={generating} variant="outline">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Regenerate Analysis
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </div>
  );
}
