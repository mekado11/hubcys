
import React, { useState, useEffect } from "react";
import { Assessment } from "@/entities/Assessment";
import { ComplianceFramework } from "@/entities/ComplianceFramework";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Loader2,
  AlertCircle,
  Edit,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { generateReportPdf } from "@/functions/generateReportPdf";
import ProfessionalReport from "../components/report/ProfessionalReport";

export default function ProfessionalReportView() {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [frameworkName, setFrameworkName] = useState('');
  const [frameworkType, setFrameworkType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customizations, setCustomizations] = useState(null); // Initialized to null as per outline
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false); // New state variable

  useEffect(() => {
    const loadAssessmentData = async () => {
      console.log("=== STARTING REPORT DATA LOAD ===");
      setLoading(true);
      setError(null);

      try {
        // Get assessment ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const assessmentId = urlParams.get('id');
        
        console.log("Assessment ID from URL:", assessmentId);
        
        if (!assessmentId) {
          throw new Error("No assessment ID provided in URL");
        }

        // Get customizations from URL if provided
        const customizationsParam = urlParams.get('customizations');
        if (customizationsParam) {
          try {
            const parsedCustomizations = JSON.parse(decodeURIComponent(customizationsParam));
            console.log("Parsed customizations:", parsedCustomizations);
            setCustomizations(parsedCustomizations);
          } catch (e) {
            console.warn("Failed to parse customizations, using defaults:", e);
            // Fallback to default if parsing fails
            setCustomizations({
              reportTitle: 'Cybersecurity Gap Analysis Report',
              sections: {
                executiveSummary: true,
                keyStrengths: true,
                criticalGaps: true,
                complianceConsiderations: true,
                actionPlans: true,
                toolRecommendations: true,
                industryRisks: true,
                finalRecommendations: true
              }
            });
          }
        } else {
          // Default customizations if no param provided
          setCustomizations({
            reportTitle: 'Cybersecurity Gap Analysis Report',
            sections: {
              executiveSummary: true,
              keyStrengths: true,
              criticalGaps: true,
              complianceConsiderations: true,
              actionPlans: true,
              toolRecommendations: true,
              industryRisks: true,
              finalRecommendations: true
            }
          });
        }

        // Verify user authentication
        console.log("Checking user authentication...");
        const currentUser = await User.me();
        if (!currentUser) {
          throw new Error("User not authenticated.");
        }
        console.log("User authenticated:", currentUser.email);
        console.log("SECURITY CHECK: Current User's Company ID:", currentUser.company_id);

        // Fetch the assessment data
        console.log("Fetching assessment data...");
        const assessmentData = await Assessment.get(assessmentId);
        
        if (!assessmentData) {
          throw new Error("Assessment not found or accessible.");
        }

        // CRITICAL RLS FIX: Verify assessment belongs to the current user's company
        console.log("SECURITY CHECK: Loaded Assessment's Company ID:", assessmentData.company_id);
        if (assessmentData.company_id !== currentUser.company_id) {
          console.error("SECURITY BREACH ATTEMPT: User tried to access assessment from different company!");
          console.error("User Company ID:", currentUser.company_id);
          console.error("Assessment Company ID:", assessmentData.company_id);
          throw new Error("Access Denied: This assessment does not belong to your company.");
        }
        
        console.log("SECURITY CHECK PASSED: Assessment belongs to user's company");
        console.log("Assessment data retrieved:", {
          id: assessmentData.id,
          company_name: assessmentData.company_name,
          status: assessmentData.status,
          overall_score: assessmentData.overall_score,
          maturity_level: assessmentData.maturity_level
        });

        setAssessment(assessmentData);

        // Fetch the framework name and type using the ID from the assessment (preserving existing logic)
        if (assessmentData?.framework) {
          console.log("Fetching framework details for ID:", assessmentData.framework);
          try {
            const frameworkData = await ComplianceFramework.get(assessmentData.framework);
            setFrameworkName(frameworkData.name);
            setFrameworkType(frameworkData.framework_type);
            console.log("Framework details retrieved:", {
              name: frameworkData.name,
              type: frameworkData.framework_type
            });
          } catch (fwError) {
            console.error("Could not fetch framework details, falling back to ID:", fwError);
            setFrameworkName(assessmentData.framework);
            setFrameworkType('');
          }
        }

        console.log("=== REPORT DATA LOAD COMPLETED SUCCESSFULLY ===");

      } catch (error) {
        console.error("=== REPORT DATA LOAD FAILED ===");
        console.error("Error details:", error);
        setError(error.message || "Failed to load assessment data");
      } finally {
        setLoading(false);
      }
    };
    loadAssessmentData();
  }, []);

  const handleGeneratePdf = async () => {
    if (!assessment) return;
    setGeneratingPdf(true);
    try {
      const response = await generateReportPdf({
        assessmentId: assessment.id,
        customizations: customizations
      });

      if (response.error || response.status >= 400) {
        throw new Error(response.error || 'Failed to generate PDF');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const companyNameSanitized = assessment.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `Hubcys-Report-${companyNameSanitized}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("There was an error generating your PDF. Please try again. " + (err.message || ''));
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Report...</h2>
          <p className="text-gray-400">Generating your professional assessment report</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    const displayMessage = error || "The assessment data could not be found or loaded.";
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center p-4">
        <Card className="glass-effect border-red-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Report Not Available</h2>
            <p className="text-gray-400 mb-6">{displayMessage}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-cyan-500 to-purple-500">
                Try Again
              </Button>
              <Link to={createPageUrl("Dashboard")}>
                <Button variant="outline" className="border-gray-600 text-gray-300">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Edit Button and Export PDF */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-3">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Professional Assessment Report</h1>
            <p className="text-gray-400">Comprehensive cybersecurity gap analysis with AI-powered recommendations</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl(`Assessment?loadFromId=${assessment.id}`)}>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Edit className="w-4 h-4 mr-2" />
                Edit Assessment
              </Button>
            </Link>
            <Button 
              onClick={handleGeneratePdf} 
              disabled={generatingPdf} 
              className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" /> 
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-8 report-body">
          {assessment && (
            <ProfessionalReport 
              assessment={assessment} 
              customizations={customizations}
              frameworkName={frameworkName}
              frameworkType={frameworkType}
            />
          )}
        </div>
      </div>
    </div>
  );
}
