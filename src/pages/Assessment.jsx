import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Assessment } from "@/entities/Assessment";
import { ComplianceFramework } from "@/entities/ComplianceFramework";
import { User } from "@/entities/User";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, ArrowRight, Download } from "lucide-react";

import AssessmentProgressBar from "@/components/assessment/AssessmentProgressBar";
import CompanyInfoForm from "@/components/assessment/CompanyInfoForm";
import OperationalSecurityForm from "@/components/assessment/OperationalSecurityForm";
import MaturitySliders from "@/components/assessment/MaturitySliders";
import ScoreDisplay from "@/components/assessment/ScoreDisplay";
import ReportGeneration from "@/components/assessment/ReportGeneration";
import AssessmentOnboardingDialog from "@/components/assessment/AssessmentOnboardingDialog";
import MyAssessmentsList from "@/components/assessment/MyAssessmentsList";
import GeneratingAnimation from "@/components/ui/GeneratingAnimation";

import { generateQuestionnairePdf } from "@/functions/generateQuestionnairePdf";

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const [managedFrameworks, setManagedFrameworks] = useState([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);

  const [assessmentData, setAssessmentData] = useState({
    company_id: "",
    company_name: "",
    company_website: "",
    company_description: "",
    industry_sector: "Technology",
    company_size: "Small_1-50",
    framework: "",
    target_completion_date: "",
    applicable_us_privacy_laws: [],
    nis2_supply_chain_security: "",
    nis2_business_continuity: "",
    nis2_vulnerability_handling: "",
    nis2_use_of_crypto: "",
    nis2_essential_services: "",
    nis2_governance_framework: "",
    nis2_human_resources_security: "",
    security_compliance_goals: "",
    previous_gap_analysis_details: "",
    current_biggest_risks: "",
    business_critical_systems: "",
    ciso_perspective: "",
    compliance_tooling_details: "",
    external_attack_surface: "",
    exposed_assets: "",
    external_cve_threats: "",
    surface_exposure_score: 0,

    ops_local_admin_privileges: undefined,
    ops_software_installation_control: undefined,
    ops_byod_security_controls: undefined,
    ops_remote_access_method: undefined,
    ops_unsanctioned_cloud_apps: undefined,
    ops_personal_cloud_storage: undefined,
    ops_patch_management_cadence: undefined,
    ops_mobile_device_management: undefined,
    ops_data_classification_system: undefined,
    ops_network_access_control: undefined,
    ops_offboarding_data_management: undefined,
    ops_endpoint_edr_coverage: undefined,
    ops_centralized_logging_siem: undefined,
    ops_vulnerability_scanning_frequency: undefined,
    ops_data_loss_prevention: undefined,
    ops_security_baseline_enforcement: undefined,

    maturity_identity: 0,
    maturity_asset_management: 0,
    maturity_infra_security: 0,
    maturity_app_security: 0,
    maturity_third_party_risk: 0,
    maturity_incident_response: 0,
    maturity_governance_risk: 0,
    maturity_data_protection: 0,
    maturity_security_training: 0,
    maturity_cloud_security: 0,
    maturity_business_continuity: 0,

    maturity_identity_na: false,
    maturity_asset_management_na: false,
    maturity_infra_security_na: false,
    maturity_app_security_na: false,
    maturity_third_party_risk_na: false,
    maturity_incident_response_na: false,
    maturity_governance_risk_na: false,
    maturity_data_protection_na: false,
    maturity_security_training_na: false,
    maturity_cloud_security_na: false,
    maturity_business_continuity_na: false,

    overall_score: 0,
    maturity_level: "Beginner",
    applicable_categories: 0,
    total_categories: 11,

    smart_analysis: "",
    grand_summary: "",
    status: "draft",
  });

  const steps = useMemo(() => ([
    { id: 1, title: "Company Info" },
    { id: 2, title: "Operational Security" },
    { id: 3, title: "Maturity Assessment" },
    { id: 4, title: "Results & Analysis" }
  ]), []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const assessmentId = urlParams.get("id");
    const newAssessmentFlag = urlParams.get("new");
    if (assessmentId || newAssessmentFlag) {
        setCurrentStep(1);
        loadUserAndAssessment();
    } else {
        loadUserForHub();
    }
  }, []);

  const loadUserForHub = async () => {
    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to load user:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFrameworks = async (user) => {
    try {
      setLoadingFrameworks(true);
      const data = await ComplianceFramework.filter({ company_id: user.company_id }, "-updated_date", 100);
      setManagedFrameworks(data || []);
    } finally {
      setLoadingFrameworks(false);
    }
  };

  const loadUserAndAssessment = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const assessmentId = urlParams.get("id");
    const newAssessmentFlag = urlParams.get("new");

    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);

      await loadFrameworks(user);

      if (assessmentId) {
        const rows = await Assessment.filter(
          { id: assessmentId, company_id: user.company_id },
          "-updated_date",
          1
        );
        const existing = rows?.[0];
        if (existing) {
          setAssessmentData(prev => ({ ...prev, ...existing }));
        }
      } else if (newAssessmentFlag) {
        setAssessmentData(prev => ({
          ...prev,
          company_id: user.company_id,
          company_name: user.company_name || prev.company_name
        }));
      }
    } catch (err) {
      console.error("Assessment: failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    const domains = [
      { key: "maturity_identity", na: "maturity_identity_na" },
      { key: "maturity_asset_management", na: "maturity_asset_management_na" },
      { key: "maturity_infra_security", na: "maturity_infra_security_na" },
      { key: "maturity_app_security", na: "maturity_app_security_na" },
      { key: "maturity_third_party_risk", na: "maturity_third_party_risk_na" },
      { key: "maturity_incident_response", na: "maturity_incident_response_na" },
      { key: "maturity_governance_risk", na: "maturity_governance_risk_na" },
      { key: "maturity_data_protection", na: "maturity_data_protection_na" },
      { key: "maturity_security_training", na: "maturity_security_training_na" },
      { key: "maturity_cloud_security", na: "maturity_cloud_security_na" },
      { key: "maturity_business_continuity", na: "maturity_business_continuity_na" }
    ];

    const applicable = domains.filter(d => !assessmentData[d.na]);
    const totalApplicable = applicable.length || 1;

    const sum = applicable.reduce((acc, d) => acc + (Number(assessmentData[d.key]) || 0), 0);
    const avg = sum / totalApplicable;
    const overall = Math.round((avg / 5) * 100);

    let level = "Beginner";
    if (overall >= 80) level = "Expert";
    else if (overall >= 60) level = "Advanced";
    else if (overall >= 40) level = "Intermediate";
    else if (overall >= 20) level = "Developing";

    return {
      overall_score: overall,
      maturity_level: level,
      applicable_categories: totalApplicable,
      total_categories: domains.length
    };
  };

  const updateField = (field, value) => {
    setAssessmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (finalize = false) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const scores = calculateScore();

      const normalizeDate = (val) => {
        if (!val) return val;
        if (val instanceof Date) return val.toISOString().split("T")[0];
        return val;
      };

      const payload = {
        ...assessmentData,
        company_id: currentUser.company_id,
        target_completion_date: normalizeDate(assessmentData.target_completion_date),
        ...scores,
        status: finalize ? "completed" : "draft"
      };

      let saved;
      if (assessmentData.id) {
        saved = await Assessment.update(assessmentData.id, payload);
      } else {
        saved = await Assessment.create(payload);
      }

      setAssessmentData(saved);
      return saved?.id;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    setCurrentStep((s) => Math.min(steps.length, s + 1));
  };

  const handleBack = () => {
    if (currentStep === 1) {
        setCurrentStep(0);
        navigate(createPageUrl("Assessment"));
    } else {
        setCurrentStep((s) => Math.max(1, s - 1));
    }
  };

  const handleExportQuestionnaire = async () => {
    const doc = await generateQuestionnairePdf();
    const filename = `Hubcys_Questionnaire_${assessmentData.company_name?.replace(/\s+/g, "_") || "Assessment"}.pdf`;
    doc.save(filename);
  };

  const onStepClick = (step) => {
    if (step >= 1 && step <= steps.length) {
      setCurrentStep(step);
    }
  };

  if (generatingDraft) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <GeneratingAnimation 
          message="AI is analyzing your organization..." 
          subMessage="Generating personalized maturity scores and recommendations based on your industry, size, and framework selection. This may take 30-60 seconds."
        />
      </div>
    );
  }

  if (loading && currentStep !== 0) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Loading Assessment...</h2>
        </div>
      </div>
    );
  }

  if (currentStep === 0) {
    return (
        <div className="min-h-screen cyber-gradient p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Assessments Hub</h1>
                        <p className="text-lg text-gray-400">Manage your organizational maturity assessments.</p>
                    </div>
                </div>

                <MyAssessmentsList onStartNew={() => {
                    navigate(createPageUrl("Assessment") + "?new=true");
                    setCurrentStep(1);
                }} />

            </div>
        </div>
    );
  }

  const scoreData = { ...assessmentData, ...calculateScore() };

  return (
    <div className="min-h-screen cyber-gradient p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link to={createPageUrl("Assessment")}>
              <Button variant="ghost" className="text-gray-300 hover:text-white mb-3">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assessment Hub
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white">Security Assessment</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-cyan-500/30 text-cyan-300" onClick={handleExportQuestionnaire}>
              <Download className="w-4 h-4 mr-2" />
              Export/Download Questionnaire
            </Button>
          </div>
        </div>

        <Card className="glass-effect mb-6 border-cyan-500/30">
          <div className="p-4">
            <AssessmentProgressBar currentStep={currentStep} onStepClick={onStepClick} />
          </div>
        </Card>

        {currentStep === 1 && (
          <CompanyInfoForm
            data={assessmentData}
            onUpdate={updateField}
            onNext={handleNext}
            managedFrameworks={managedFrameworks}
            loadingFrameworks={loadingFrameworks}
            onFrameworkCreated={async (newFramework) => {
              // Optimistic update so the new framework appears immediately
              if (newFramework) setManagedFrameworks(prev => [newFramework, ...prev]);
              // Re-fetch fresh user (company_id may have just been backfilled) then reload list
              try {
                const fresh = await User.me();
                setCurrentUser(fresh);
                await loadFrameworks(fresh);
              } catch (_) {}
            }}
            onSave={handleSave}
            saving={saving}
            currentUser={currentUser}
          />
        )}

        {currentStep === 2 && (
          <OperationalSecurityForm
            data={assessmentData}
            onUpdate={updateField}
            onNext={handleNext}
            onBack={handleBack}
            onSave={handleSave}
            saving={saving}
          />
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 gap-6">
            <MaturitySliders
              data={assessmentData}
              onUpdate={updateField}
              onNext={handleNext}
              onBack={handleBack}
              onSave={handleSave}
              saving={saving}
            />
            <ScoreDisplay
              data={scoreData}
              onBack={handleBack}
              onSave={() => handleSave(false)}
              saving={saving}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="grid grid-cols-1 gap-6">
            <ScoreDisplay
              data={scoreData}
              onBack={handleBack}
              onSave={() => handleSave(false)}
              saving={saving}
            />
            <ReportGeneration
              data={scoreData}
              onSave={async () => {
                const id = await handleSave(true);
                return id || assessmentData.id;
              }}
              onBack={() => setCurrentStep(3)}
            />
            <div className="flex justify-between mt-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-300"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Draft
                </Button>
                <Button
                  onClick={async () => { await handleSave(true); }}
                  disabled={saving}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  Complete
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AssessmentOnboardingDialog isOpen={false} />
    </div>
  );
}