
import React, { useState, useEffect, useCallback } from "react";
import { Assessment } from "@/entities/Assessment";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Loader2,
  Eye,
  Shield,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Target,
  Globe,
  Download,
  Plus
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { generateReportPdf } from "@/functions/generateReportPdf";
import GrandSummarySection from "../components/report/GrandSummarySection";
import ThreatsTab from "@/components/reports/ThreatsTab";
import { generateRegulatoryReport } from "@/functions/generateRegulatoryReport";
import { generateNis2Report } from "@/functions/generateNis2Report";
import MyAssessmentsList from "@/components/assessment/MyAssessmentsList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Executive Dashboard Component (remains unchanged)
const ExecutiveDashboard = ({ assessment }) => {
  const maturityDistribution = React.useMemo(() => {
    const domains = [
      { key: 'maturity_identity', name: 'Identity' },
      { key: 'maturity_asset_management', name: 'Asset Management' },
      { key: 'maturity_infra_security', name: 'Infrastructure Security' },
      { key: 'maturity_app_security', name: 'Application Security' },
      { key: 'maturity_third_party_risk', name: 'Third-Party Risk' },
      { key: 'maturity_incident_response', name: 'Incident Response' },
      { key: 'maturity_governance_risk', name: 'Governance & Risk' },
      { key: 'maturity_data_protection', name: 'Data Protection' },
      { key: 'maturity_security_training', name: 'Security Training' },
      { key: 'maturity_cloud_security', name: 'Cloud Security' }
    ];

    return domains
      .filter(domain => !assessment[`${domain.key}_na`])
      .map(domain => ({
        name: domain.name,
        score: assessment[domain.key] || 0,
        percentage: ((assessment[domain.key] || 0) / 5) * 100
      }))
      .sort((a, b) => a.score - b.score);
  }, [assessment]);

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-green-400';
    if (score >= 3) return 'text-yellow-400';
    if (score >= 2) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score) => {
    if (score >= 4) return 'bg-green-500/20 border-green-500/30';
    if (score >= 3) return 'bg-yellow-500/20 border-yellow-500/30';
    if (score >= 2) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overall Score</p>
                  <p className="text-2xl font-bold text-cyan-300">{assessment.overall_score}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Maturity Level</p>
                  <p className="text-lg font-bold text-purple-300">{assessment.maturity_level}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {assessment.surface_exposure_score != null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-effect border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">External Risk</p>
                    <p className="text-2xl font-bold text-orange-300">{assessment.surface_exposure_score}/100</p>
                  </div>
                  <Globe className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-effect border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Domains Assessed</p>
                  <p className="text-2xl font-bold text-green-300">{maturityDistribution.length}/10</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Domain Breakdown */}
      <Card className="glass-effect border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Security Domain Analysis</CardTitle>
          <p className="text-gray-400">Detailed breakdown of your security maturity across all domains</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maturityDistribution.map((domain, index) => (
              <motion.div
                key={domain.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{domain.name}</span>
                    <Badge className={getScoreBackground(domain.score)}>
                      <span className={getScoreColor(domain.score)}>
                        {domain.score}/5
                      </span>
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        domain.score >= 4 ? 'bg-green-500' :
                        domain.score >= 3 ? 'bg-yellow-500' :
                        domain.score >= 2 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${domain.percentage}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// PDF Export Component (remains unchanged)
const PdfExportSection = ({ assessment }) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadPdf = async () => {
    if (!assessment?.id) return;
    
    setGenerating(true);
    setError('');

    try {
      const { data } = await generateReportPdf({ 
        assessmentId: assessment.id,
        customizations: {}
      });
      
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FortiGaP_Report_${assessment.company_name?.replace(/\s+/g, '_') || 'Assessment'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="glass-effect border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-blue-300 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </CardTitle>
        <p className="text-gray-400">Generate a comprehensive PDF report for stakeholders and compliance purposes</p>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="border-red-500/30 bg-red-500/10 mb-4">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}
        <Button
          onClick={handleDownloadPdf}
          disabled={generating}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PDF Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function ReportsPage() {
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [hasAssessments, setHasAssessments] = useState(false);
  const [loadingInitialAssessment, setLoadingInitialAssessment] = useState(true);
  const [listStatusFilter, setListStatusFilter] = useState("all"); // NEW: filter state

  // Effect to check if any assessments exist (drafts or completed)
  useEffect(() => {
    const checkAssessments = async () => {
      try {
        const user = await User.me();
        const assessmentList = await Assessment.filter(
          { company_id: user.company_id },
          '-created_date',
          1
        );
        setHasAssessments(assessmentList.length > 0);
      } catch (error) {
        console.error("Error checking assessments:", error);
      }
    };
    checkAssessments();
  }, []);

  // Effect to set the initial selected assessment (prefer completed, fallback to latest any)
  useEffect(() => {
    const fetchInitialAssessment = async () => {
      if (!selectedAssessment) {
        setLoadingInitialAssessment(true);
        try {
          const user = await User.me();
          // Try latest completed first
          let assessmentList = await Assessment.filter(
            { company_id: user.company_id, status: 'completed' },
            '-created_date',
            1
          );
          if (assessmentList.length === 0) {
            // Fallback: latest any status
            assessmentList = await Assessment.filter(
              { company_id: user.company_id },
              '-created_date',
              1
            );
          }
          if (assessmentList.length > 0) {
            setSelectedAssessment(assessmentList[0]);
          }
        } catch (error) {
          console.error("Error fetching initial assessment:", error);
        } finally {
          setLoadingInitialAssessment(false);
        }
      } else {
        setLoadingInitialAssessment(false);
      }
    };
    fetchInitialAssessment();
  }, [selectedAssessment]);

  // Add proper grand summary update handler
  const handleGrandSummaryUpdate = useCallback((newGrandSummary) => {
    if (!selectedAssessment?.id) return;
    
    setSelectedAssessment(prev => ({
      ...prev,
      grand_summary: newGrandSummary,
      grand_summary_generated_date: new Date().toISOString()
    }));
  }, [selectedAssessment]);

  // NEW: clear selection if the deleted assessment was selected
  const handleAssessmentDeleted = (deletedId) => {
    if (selectedAssessment?.id === deletedId) {
      setSelectedAssessment(null);
    }
  };

  // UPDATED: Header for the list with filter control
  const MyAssessmentsListHeader = (
    <CardHeader>
      <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
        <div>
          <CardTitle className="text-cyan-300 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Select Assessment
          </CardTitle>
          <p className="text-gray-400">Choose an assessment to view analysis and reports</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Show:</span>
          <Select value={listStatusFilter} onValueChange={(v) => setListStatusFilter(v)}>
            <SelectTrigger className="w-36 bg-slate-900 border-slate-700 text-gray-200">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
  );

  // UPDATED: Empty state messaging based on filter
  const MyAssessmentsListEmptyState = (
    <div className="max-w-md mx-auto">
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/20">
          <FileText className="w-6 h-6 text-cyan-300" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          {listStatusFilter === 'completed' ? 'No Completed Assessments' :
           listStatusFilter === 'draft' ? 'No Draft Assessments' :
           'No Assessments Yet'}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {listStatusFilter === 'completed'
            ? 'Complete an assessment to view it here.'
            : listStatusFilter === 'draft'
            ? 'Create a new assessment or continue an existing one.'
            : 'Start your first assessment to view reports and analysis.'}
        </p>
        <Button
          size="sm"
          onClick={() => window.location.href = createPageUrl("Assessment?new=true")}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
        >
          Start New Assessment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen cyber-gradient p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className={`mb-8 ${hasAssessments ? 'flex justify-between items-start' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold cyber-text-glow mb-2">Assessment Reports</h1>
            <p className="text-gray-400">
              Comprehensive analysis and insights from your security assessments
            </p>
          </div>
          
          {/* Show header button only when there are assessments */}
          {hasAssessments && (
            <Button
              onClick={() => window.location.href = createPageUrl("Assessment")}
              variant="outline"
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Assessment
            </Button>
          )}
        </div>

        {/* Replaced AssessmentSelector with MyAssessmentsList */}
        <div className="mb-8">
          {loadingInitialAssessment ? (
            <Card className="glass-effect border-cyan-500/20">
              {MyAssessmentsListHeader}
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mr-3" />
                  <span className="text-gray-400">Loading assessments...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <MyAssessmentsList
              limit={12}
              statusFilter={listStatusFilter === 'all' ? undefined : listStatusFilter}
              onSelectAssessment={setSelectedAssessment}
              selectedAssessmentId={selectedAssessment?.id}
              headerComponent={MyAssessmentsListHeader}
              emptyStateComponent={MyAssessmentsListEmptyState}
              cardClassName="glass-effect border-cyan-500/20"
              gridItemClassName="p-4 rounded-lg border-2 cursor-pointer transition-all duration-200"
              selectedGridItemClassName="border-cyan-500 bg-cyan-500/10"
              defaultGridItemClassName="border-slate-700 hover:border-cyan-500/50 bg-slate-800/30"
              onAssessmentDeleted={handleAssessmentDeleted}
            />
          )}
        </div>

        {selectedAssessment ? (
          <Tabs defaultValue="executive" className="w-full">
            <TabsList className="mb-8 bg-slate-800/50">
              <TabsTrigger value="executive">Executive Dashboard</TabsTrigger>
              <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="threats">Threats</TabsTrigger>
              <TabsTrigger value="export">Export & Share</TabsTrigger>
            </TabsList>

            <TabsContent value="executive">
              <ExecutiveDashboard assessment={selectedAssessment} />
            </TabsContent>

            <TabsContent value="ai-analysis" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">AI-Powered Analysis</h2>
                <p className="text-gray-400">
                  Advanced insights combining your assessment with external intelligence
                </p>
              </div>
              <GrandSummarySection 
                assessmentData={selectedAssessment}
                onGrandSummaryUpdate={handleGrandSummaryUpdate}
              />
            </TabsContent>

            <TabsContent value="threats">
              <ThreatsTab assessment={selectedAssessment} />
            </TabsContent>

            <TabsContent value="export">
              <div className="grid gap-6 lg:grid-cols-2">
                <PdfExportSection assessment={selectedAssessment} />
                <Card className="glass-effect border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-blue-300">EU/UK Regulatory Readiness</CardTitle>
                    <p className="text-gray-400">Generate a regulator-friendly summary for NIS2 / DORA / FCA (sample)</p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={async () => {
                        try {
                          const { data } = await generateRegulatoryReport({
                            assessmentId: selectedAssessment.id,
                            company_name: selectedAssessment.company_name
                          });
                          const blob = new Blob([data], { type: "application/pdf" });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `FortiGaP_Regulatory_Readiness_${selectedAssessment.company_name?.replace(/\s+/g, '_') || 'Assessment'}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          a.remove();
                        } catch (error) {
                          console.error("Error generating regulatory report:", error);
                          alert("Failed to generate regulatory report. Please try again.");
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Regulatory PDF
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-blue-300">NIS2 Compliance Report</CardTitle>
                    <p className="text-gray-400">
                      Generate a NIS2-only report with context from your latest completed assessment.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={async () => {
                        try {
                          // The generateNis2Report function currently takes no arguments based on the import and usage.
                          // If it requires assessmentId, it would need to be passed here. Assuming current signature.
                          const { data } = await generateNis2Report({});
                          const blob = new Blob([data], { type: "application/pdf" });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `FortiGaP_NIS2_${selectedAssessment?.company_name?.replace(/\s+/g, '_') || 'Report'}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          a.remove();
                        } catch (error) {
                          console.error("Error generating NIS2 report:", error);
                          alert("Failed to generate NIS2 report. Please try again.");
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download NIS2 PDF
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          hasAssessments && !loadingInitialAssessment && (
            // Tightened placeholder when assessments exist but none selected (MyAssessmentsList handles its own empty state)
            <div className="max-w-2xl mx-auto text-center py-12 bg-slate-800/40 rounded-xl glass-effect border-slate-700/60 px-6">
              <Eye className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Select an Assessment to View Details</h3>
              <p className="text-sm text-gray-400">
                Choose an assessment from the list above to display its comprehensive report.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
