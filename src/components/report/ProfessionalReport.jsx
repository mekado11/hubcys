import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RadarChart from "../assessment/RadarChart";
import {
  Shield,
  TrendingUp,
  Target,
  Building
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// Helper function for maturity colors
const getMaturityColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert':
      return 'from-green-400 to-emerald-600';
    case 'advanced':
      return 'from-blue-400 to-indigo-600';
    case 'intermediate':
      return 'from-yellow-400 to-orange-600';
    case 'beginner':
      return 'from-red-400 to-rose-600';
    default:
      return 'from-gray-400 to-gray-600';
  }
};

export default function ProfessionalReport({ assessment, customizations = {}, frameworkName, frameworkType }) {
  const [loading, setLoading] = useState(true);

  console.log('ProfessionalReport received assessment:', {
    id: assessment?.id,
    company_name: assessment?.company_name,
    overall_score: assessment?.overall_score,
    maturity_level: assessment?.maturity_level,
    has_ai_analysis: !!assessment?.ai_analysis
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Parse AI analysis with fallback
  let parsedAnalysis = null;
  if (assessment?.ai_analysis) {
    try {
      parsedAnalysis = typeof assessment.ai_analysis === 'string'
        ? JSON.parse(assessment.ai_analysis)
        : assessment.ai_analysis;
    } catch (e) {
      console.error('Failed to parse ai_analysis:', e);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating your professional report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-slate-700 pb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          {customizations.title || 'Cybersecurity Assessment Report'}
        </h1>
        <p className="text-xl text-gray-300">{assessment?.company_name || 'Company Name'}</p>
        <p className="text-gray-400 mt-2">
          Generated on {assessment?.created_date ? new Date(assessment.created_date).toLocaleDateString() : new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Executive Summary */}
      {customizations.sections?.executiveSummary !== false && (
        <Card className="glass-effect border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-300 flex items-center text-2xl">
              <TrendingUp className="w-6 h-6 mr-3" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className={`text-5xl font-bold bg-gradient-to-r ${getMaturityColor(assessment?.maturity_level)} bg-clip-text text-transparent`}>
                  {assessment?.overall_score || 0}%
                </div>
                <p className="text-gray-400 mt-2">Overall Score</p>
              </div>
              <div>
                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${getMaturityColor(assessment?.maturity_level)} text-white text-xl font-bold`}>
                  {assessment?.maturity_level || 'Beginner'}
                </div>
                <p className="text-gray-400 mt-2">Maturity Level</p>
              </div>
              <div>
                <div className="inline-block px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xl font-bold">
                  {frameworkName || 'Framework Not Specified'}
                </div>
                <p className="text-gray-400 mt-2">Framework</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis & Recommendations */}
      <Card className="glass-effect border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center text-2xl">
            <Target className="w-6 h-6 mr-3" />
            Detailed Analysis & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parsedAnalysis ? (
            <div className="space-y-6 text-gray-200 prose prose-invert max-w-none">
              {/* Executive Snapshot */}
              {parsedAnalysis.executive_snapshot && (
                <div>
                  <h3 className="text-xl font-bold text-cyan-300 mb-4">Executive Snapshot</h3>
                  <div className="space-y-4">
                    {parsedAnalysis.executive_snapshot.overall_maturity && (
                      <div>
                        <strong className="text-white">Overall Maturity:</strong>
                        <p className="mt-1 text-gray-300">{parsedAnalysis.executive_snapshot.overall_maturity}</p>
                      </div>
                    )}
                    {parsedAnalysis.executive_snapshot.top_business_risks && parsedAnalysis.executive_snapshot.top_business_risks.length > 0 && (
                      <div>
                        <strong className="text-white">Top Business Risks:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300">
                          {parsedAnalysis.executive_snapshot.top_business_risks.map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {parsedAnalysis.executive_snapshot.estimated_risk_exposure && (
                      <div>
                        <strong className="text-white">Estimated Risk Exposure:</strong>
                        <p className="mt-1 text-gray-300">{parsedAnalysis.executive_snapshot.estimated_risk_exposure}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantified Current State */}
              {parsedAnalysis.quantified_current_state && (
                <div>
                  <h3 className="text-xl font-bold text-cyan-300 mb-4">Quantified Current State</h3>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{parsedAnalysis.quantified_current_state}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Credible Attack Paths */}
              {parsedAnalysis.credible_attack_paths && (
                <div>
                  <h3 className="text-xl font-bold text-orange-300 mb-4">Credible Attack Paths</h3>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{parsedAnalysis.credible_attack_paths}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Control Gap Analysis */}
              {parsedAnalysis.control_gap_analysis && (
                <div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-4">Control Gap Analysis</h3>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{parsedAnalysis.control_gap_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Strategic Roadmap */}
              {parsedAnalysis.strategic_roadmap && (
                <div>
                  <h3 className="text-xl font-bold text-green-300 mb-4">Strategic Roadmap</h3>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{parsedAnalysis.strategic_roadmap}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-400 text-xl">⚠</span>
              </div>
              <p className="text-gray-300 text-lg">Analysis not available.</p>
              <p className="text-gray-400 text-sm mt-2">Please generate the Smart Analysis to see detailed recommendations.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Maturity Radar */}
      <Card className="glass-effect border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-2xl text-cyan-300 flex items-center">
            <Shield className="w-6 h-6 mr-3" />
            Security Maturity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <RadarChart data={assessment} />
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="glass-effect border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-2xl text-cyan-300 flex items-center">
            <Building className="w-6 h-6 mr-3" />
            Organization Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Industry Sector</h4>
              <p className="text-gray-300">
                {assessment?.industry_sector?.replace(/_/g, ' ') || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Company Size</h4>
              <p className="text-gray-300">
                {assessment?.company_size?.replace(/_/g, ' ') || 'Not specified'}
              </p>
            </div>
          </div>

          {assessment?.company_description && (
            <div>
              <h4 className="font-semibold text-white mb-2">About the Organization</h4>
              <p className="text-gray-300 leading-relaxed">
                {assessment?.company_description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pt-12 border-t border-slate-700">
        <p className="text-gray-400 mb-2">
          This report was generated using advanced cybersecurity assessment methodologies
        </p>
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} FortiGaP - Professional Cybersecurity Assessment Platform
        </p>
      </div>
    </div>
  );
}