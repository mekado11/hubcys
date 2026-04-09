
import React, { useState, useEffect, useCallback } from "react";
import { Incident } from "@/entities/Incident";
import { TabletopExercise } from "@/entities/TabletopExercise";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  Loader2,
  RefreshCw,
  Activity,
  Trash2,
  Gamepad2,
  Users,
  Calendar,
  PlayCircle,
  Globe,
  Sparkles,
  Lock,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CachedEntityManager } from '@/components/utils/networkUtils';
import { webScanner } from "@/functions/webScanner";
import { InvokeLLM } from "@/integrations/Core";
import SecurityScanningAnimation from "../components/ui/SecurityScanningAnimation";
import AnimatedResultsDisplay from "../components/ui/AnimatedResultsDisplay";
import ReactMarkdown from 'react-markdown';
import ArchitectureAudit from "../components/architecture/ArchitectureAudit";
import PasswordGenerator from "../components/security/PasswordGenerator";
import CveSearch from "../components/security/CveSearch";
import IncidentPlaybookCreator from "../components/incident/IncidentPlaybookCreator";
import SurfaceExposureRecon from "../components/assessment/SurfaceExposureRecon";
import PhishingScreenshotAnalyzer from "../components/security/PhishingScreenshotAnalyzer";
import CisaFeed from "../components/security/CisaFeed"; // NEW: CisaFeed import
import { toast } from 'react-hot-toast';
import { getCommandCenterFeatures, canAccessTabletops, SUBSCRIPTION_TIERS } from "@/components/utils/subscriptionUtils";
import SubscriptionGate from "@/components/ui/SubscriptionGate";
import SastAnalyzer from "../components/security/SastAnalyzer"; // NEW: SastAnalyzer import
import PciScopingTool from "../components/pci/PciScopingTool";
// import OwaspKnowledgePanel from "../components/security/OwaspKnowledgePanel"; // REMOVED: OwaspKnowledgePanel import - now managed contextually by SastAnalyzer
// import SastExternalMerge from "../components/security/SastExternalMerge"; // REMOVED: SastExternalMerge import - now managed contextually by SastAnalyzer

export default function ResponseReadiness() {
  const navigate = useNavigate();

  // Read URL params to select tabs on load (e.g., ?tab=tools&tool=pci-scoping)
  const urlParams = new URLSearchParams(window.location.search);
  const initialMainTab = urlParams.get("tab") || "incidents";
  const initialToolsTab = urlParams.get("tool") || "password";

  // Incidents state
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState(null);
  const [incidentSearchTerm, setIncidentSearchTerm] = useState("");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("all");
  const [incidentPriorityFilter, setIncidentPriorityFilter] = useState("all");

  // Tabletop Exercises state
  const [exercises, setExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exercisesError, setExercisesError] = useState(null);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");
  const [exerciseStatusFilter, setExerciseStatusFilter] = useState("all");

  // Common state
  const [currentUser, setCurrentUser] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Vulnerability Scans state (now URL Scanner)
  const [scanTarget, setScanTarget] = useState("");
  const [scanResults, setScanResults] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [smartAnalysis, setSmartAnalysis] = useState(null);

  // Architectural Diagram state (Removed functionality related to diagram generation)
  // const [architectureDescription, setArchitectureDescription] = useState("");
  // const [diagramLoading, setDiagramLoading] = useState(false);
  // const [diagramError, setDiagramError] = useState(null);
  // const [generatedDiagram, setGeneratedDiagram, setMermaidSyntax] = useState(null);

  // FIXED: Wrap loadIncidents in useCallback to make it a stable dependency
  const loadIncidents = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    } else {
      setRetryCount(0);
    }

    setIncidentsLoading(true);
    setIncidentsError(null);

    try {
      // Get user data if not already loaded
      let userData = currentUser;
      if (!userData) {
        userData = await CachedEntityManager.get(User, 'me', [], 'response_current_user');
        setCurrentUser(userData);
      }

      // Load incidents with company filtering
      const companyFilter = { company_id: userData.company_id };
      const incidentData = await CachedEntityManager.get(Incident, 'filter', [companyFilter, "-created_date", 100], 'response_incidents_list');
      setIncidents(incidentData || []);

    } catch (err) {
      console.error("Error loading incidents:", err);
      setIncidentsError(err.message || "Failed to load incidents");
      setIncidents([]);
    } finally {
      setIncidentsLoading(false);
    }
  }, [currentUser, setRetryCount, setIncidentsLoading, setIncidentsError, setIncidents, setCurrentUser]);

  // FIXED: Wrap loadExercises in useCallback to make it a stable dependency
  const loadExercises = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    }

    setExercisesLoading(true);
    setExercisesError(null);

    try {
      // Get user data if not already loaded
      let userData = currentUser;
      if (!userData) {
        userData = await CachedEntityManager.get(User, 'me', [], 'response_current_user');
        setCurrentUser(userData);
      }

      // Load exercises with company filtering
      const companyFilter = { company_id: userData.company_id };
      const exerciseData = await CachedEntityManager.get(TabletopExercise, 'filter', [companyFilter, "-created_date", 100], 'response_exercises_list');
      setExercises(exerciseData || []);

    } catch (err) {
      console.error("Error loading exercises:", err);
      setExercisesError(err.message || "Failed to load tabletop exercises");
      setExercises([]);
    } finally {
      setExercisesLoading(false);
    }
  }, [currentUser, setRetryCount, setExercisesLoading, setExercisesError, setExercises, setCurrentUser]);

  // FIXED: Now the useEffect has stable dependencies
  useEffect(() => {
    loadIncidents();
    loadExercises();
  }, [loadIncidents, loadExercises]);

  const handleRetryIncidents = () => {
    CachedEntityManager.clearCache('response_incidents');
    loadIncidents(true);
  };

  const handleRetryExercises = () => {
    CachedEntityManager.clearCache('response_exercises');
    loadExercises(true);
  };

  const handleDeleteIncident = async (incidentId) => {
    const confirmDelete = window.confirm("Delete this incident? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await Incident.delete(incidentId);
      await loadIncidents();
      toast.success("Incident deleted successfully");
    } catch (error) {
      console.error("Error deleting incident:", error);
      toast.error(`Failed to delete incident: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    const confirmDelete = window.confirm("Delete this tabletop exercise? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await TabletopExercise.delete(exerciseId);
      await loadExercises();
      toast.success("Exercise deleted successfully");
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast.error(`Failed to delete exercise: ${error.message || 'Unknown error'}`);
    }
  };

  // Incident utility functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Detected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Triaged': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Contained': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Eradicated': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Recovering': return 'bg-purple-500/20 text-purple-300 border-purple-300/30';
      case 'Closed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Under_Review': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getExerciseStatusColor = (status) => {
    switch (status) {
      case 'Planning': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Ready_to_Execute': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'In_Progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Completed': return 'bg-purple-500/20 text-purple-300 border-purple-300/30';
      case 'Archived': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Critical': return <Zap className="w-4 h-4" />;
      case 'High': return <AlertTriangle className="w-4 h-4" />;
      case 'Medium': return <Clock className="w-4 h-4" />;
      case 'Low': return <CheckCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // Helper to color threat risk
  const getRiskColor = (score) => {
    if (score === null || score === undefined) return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    if (score >= 8) return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (score >= 6) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    if (score >= 3) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-green-500/20 text-green-300 border-green-500/30';
  };

  const generateSmartAnalysis = async () => {
    if (!scanResults || !scanResults.findings || scanResults.findings.length === 0) {
      setScanError("No scan results available to analyze. Please run a scan first and ensure there are findings.");
      return;
    }

    setAnalysisLoading(true);
    setScanError(null);
    setSmartAnalysis(null);

    try {
      // Build a CVE summary from the findings to ground the LLM
      const cveFindings = Array.isArray(scanResults.findings)
        ? scanResults.findings.filter(f => !!f.cve)
        : [];
      const cveSummaryText = cveFindings.length > 0
        ? cveFindings.map(f => {
            const parts = [
              f.cve,
              f.title ? `- ${f.title}` : '',
              (typeof f.cvss_score !== 'undefined' && f.cvss_score !== null) ? ` (CVSS ${f.cvss_score})` : '',
              f.severity ? ` | Severity: ${String(f.severity).toUpperCase()}` : ''
            ].filter(Boolean).join(''); // filter(Boolean) removes empty strings
            return `- ${parts}`;
          }).join('\n')
        : 'No CVE findings detected by the scanner.';

      const analysisPrompt = `You are a cybersecurity expert analyzing vulnerability scan results. Please provide a comprehensive, evidence-led analysis for ${scanResults.target} (IP: ${scanResults.target_ip}).

MANDATORY PROMPT EMPHASIS:
- If any CVEs exist, call them out in the Executive Summary explicitly (by ID and implication).
- Include a dedicated "CVE Findings Summary" section listing each CVE (ID, severity, CVSS if present, short rationale).
- In "Overall Risk Assessment", include a "CVE Impact" sub-bullet that explains the systemic implication of the detected CVEs (e.g., outdated components, patch hygiene), even if CVE severity is low/medium.
- Do NOT assume a control is missing solely because it’s not labeled; make assumptions explicit and conservative.

CVE FINDINGS DETECTED (from scanner):
${cveSummaryText}

SCAN FINDINGS:
${JSON.stringify(scanResults.findings, null, 2)}

SCAN SUMMARY:
- Total findings: ${scanResults.summary.total_vulnerabilities}
- Critical: ${scanResults.summary.critical}
- High: ${scanResults.summary.high}
- Medium: ${scanResults.summary.medium}
- Low: ${scanResults.summary.low}
- Info: ${scanResults.summary.info}

Please provide your analysis in the following structured format:

## Executive Summary
Brief overview of posture and most critical concerns.
- Explicitly mention CVEs found (IDs) and what they imply (e.g., outdated stack), even if low/medium severity.

## CVE Findings Summary
For each CVE, provide:
- CVE ID, severity, CVSS (if provided), published date (if provided)
- Why it matters here (risk relevance), even if low severity
- Action urgency and remediation hint

## Critical/High Findings Analysis
For each critical/high severity finding, explain:
- Why this finding matters (technical significance)
- What risks it presents (potential attack vectors)
- Immediate actions needed

## Medium/Low Risk Assessment
Summarize medium and low priority findings and their collective impact.

## Open Ports Analysis
${scanResults.open_ports && scanResults.open_ports.length > 0 ?
  scanResults.open_ports.map(port => `- Port ${port.port}: Service ${port.service || 'unknown'}, State ${port.state || 'unknown'}, Reason ${port.reason || 'unknown'}`).join('\n') + `
For each open port found, explain:
- What service typically runs on this port
- Why it might be exposed
- Security implications and best practices
- Whether this exposure is necessary for business operations
` : 'No open ports found or provided for analysis.'}

## Software/System Analysis
${scanResults.cpes && scanResults.cpes.length > 0 ?
  scanResults.cpes.map(cpe => `- CPE: ${cpe.cpe || cpe}, Product: ${cpe.product || 'unknown'}, Version: ${cpe.version || 'unknown'}`).join('\n') + `
Based on CPEs and system information detected:
- What systems/software were identified
- Known vulnerability patterns for these systems
- Update and patching recommendations
` : 'No software/system information (CPEs) found or provided for analysis.'}

## Overall Risk Assessment
- Current security posture rating (1-10)
- Primary attack vectors available to attackers
- CVE Impact: tie detected CVEs (by ID) to systemic risk (e.g., outdated IIS/ASP.NET), even if CVSS is low.
- Business impact if exploited
- Compliance considerations (if applicable)

## Recommended Actions
Prioritized list of specific actions to improve security posture (patches for cited CVEs, configuration hardening, WAF, monitoring, etc.).

Be specific, actionable, and explain technical concepts in business-friendly terms where useful.`;

      const response = await InvokeLLM({
        prompt: analysisPrompt,
        feature: 'smart_analysis',
        add_context_from_internet: false
      });

      setSmartAnalysis(response);
    } catch (error) {
      console.error("Smart Analysis error:", error);
      setScanError("Failed to generate Smart Analysis. Please try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleStartScan = async () => {
    if (!scanTarget.trim()) {
      setScanError("Please enter a target URL");
      return;
    }

    setScanLoading(true);
    setScanError(null);
    setScanResults(null);
    setSmartAnalysis(null);
    setAnalysisLoading(false);

    // Keep animation visible for a minimum duration
    const minScanDuration = 21000;
    const scanStartTime = Date.now();

    try {
      const { data } = await webScanner({ target: scanTarget.trim() });
      // Set results now; UI will reveal after loading ends
      setScanResults(data);
    } catch (error) {
      console.error("Scan error:", error);
      setScanError(error.message || "Failed to perform URL security scan");
    } finally {
      // Ensure the animation completes its full duration before stopping
      const elapsed = Date.now() - scanStartTime;
      const remainingTime = Math.max(0, minScanDuration - elapsed);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      setScanLoading(false);
    }
  };

  const handleScanPhaseChange = (phaseName, currentPhase, totalPhases) => {
    // Optional: You can add phase-specific logic here
    console.log(`Scan phase: ${phaseName} (${currentPhase}/${totalPhases})`);
  };

  const handleAnalysisPhaseChange = (phaseName, currentPhase, totalPhases) => {
    // Optional: You can add analysis phase-specific logic here
    console.log(`Analysis phase: ${phaseName} (${currentPhase}/${totalPhases})`);
  };

  // Removed Architecture Diagram Generation functions:
  // const generateArchitecturalDiagramWithImage = async () => { /* ... */ };
  // const clearDiagram = () => { /* ... */ };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'info': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Filter functions
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title?.toLowerCase().includes(incidentSearchTerm.toLowerCase()) ||
                         incident.incident_id?.toLowerCase().includes(incidentSearchTerm.toLowerCase());
    const matchesStatus = incidentStatusFilter === "all" || incident.status === incidentStatusFilter;
    const matchesPriority = incidentPriorityFilter === "all" || incident.priority === incidentPriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.exercise_name?.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                         exercise.exercise_description?.toLowerCase().includes(exerciseSearchTerm.toLowerCase());
    const matchesStatus = exerciseStatusFilter === "all" || exercise.status === exerciseStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Subscription tier gating logic
  const allowedCommandCenterTabs = getCommandCenterFeatures(currentUser?.subscription_tier);
  const canAccessTabletopExercises = canAccessTabletops(currentUser?.subscription_tier);
  const isSastBlocked = (currentUser?.subscription_tier || '').toLowerCase() === 'starter';
  // Assuming 'cisa-feed' is a feature for Growth tier and above.
  const isCisaFeedBlocked = !allowedCommandCenterTabs.includes('cisa-feed');


  if (incidentsLoading && exercisesLoading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading Response & Readiness...</p>
          {retryCount > 0 && (
            <p className="text-gray-400 text-sm mt-2">Retry attempt {retryCount}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold cyber-text-glow mb-2">Command Center</h1>
          <p className="text-gray-400">Manage security incidents, assess external attack surfaces, and leverage security intelligence tools to enhance your security posture.</p>
        </div>

        <Tabs defaultValue={initialMainTab} className="w-full">
          {/* UPDATED: Tabs list with subscription gating */}
          <TabsList className="mb-6 bg-transparent p-0 h-auto gap-4 justify-start">
            <TabsTrigger
              value="incidents"
              className="
                bg-gradient-to-r from-slate-700 to-slate-600
                hover:from-slate-600 hover:to-slate-500
                data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600
                text-white data-[state=active]:text-white
                px-6 py-3 rounded-lg font-medium
                shadow-lg hover:shadow-xl
                transform hover:scale-105 transition-all duration-200
                border border-slate-600 data-[state=active]:border-cyan-400
              "
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Incidents
            </TabsTrigger>

            {/* Tabletop Exercises Tab - Gated */}
            <TabsTrigger
              value="exercises"
              disabled={!canAccessTabletopExercises}
              className={`
                bg-gradient-to-r from-slate-700 to-slate-600
                hover:from-slate-600 hover:to-slate-500
                data-[state=active]:from-blue-500 data-[state=active]:to-blue-600
                text-white data-[state=active]:text-white
                px-6 py-3 rounded-lg font-medium
                shadow-lg hover:shadow-xl
                transform hover:scale-105 transition-all duration-200
                border border-slate-600 data-[state=active]:border-blue-400
                ${!canAccessTabletopExercises ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              Tabletop Exercises
              {!canAccessTabletopExercises && <Lock className="w-3 h-3 ml-2" />}
            </TabsTrigger>

            <TabsTrigger
              value="intelligence"
              className="
                bg-gradient-to-r from-slate-700 to-slate-600
                hover:from-slate-600 hover:to-slate-500
                data-[state=active]:from-green-500 data-[state=active]:to-green-600
                text-white data-[state=active]:text-white
                px-6 py-3 rounded-lg font-medium
                shadow-lg hover:shadow-xl
                transform hover:scale-105 transition-all duration-200
                border border-slate-600 data-[state=active]:border-green-400
              "
            >
              <Shield className="w-4 h-4 mr-2" />
              Security Intelligence
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="
                bg-gradient-to-r from-slate-700 to-slate-600
                hover:from-slate-600 hover:to-slate-500
                data-[state=active]:from-purple-500 data-[state=active]:to-purple-600
                text-white data-[state=active]:text-white
                px-6 py-3 rounded-lg font-medium
                shadow-lg hover:shadow-xl
                transform hover:scale-105 transition-all duration-200
                border border-slate-600 data-[state=active]:border-purple-400
              "
            >
              <Activity className="w-4 h-4 mr-2" />
              Security Tools
            </TabsTrigger>
          </TabsList>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-6">
            {/* NEW: Section header card with CTA + filters */}
            <Card className="glass-effect border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Security Incidents</h2>
                    <p className="text-gray-400">Track and manage security incidents from detection to closure</p>
                  </div>
                  <Link to={createPageUrl("IncidentDetail?new=true")}>
                    <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md hover:shadow-lg focus:ring-2 focus:ring-orange-400/30">
                      <Plus className="w-4 h-4 mr-2" />
                      Report Incident
                    </Button>
                  </Link>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search incidents..."
                      value={incidentSearchTerm}
                      onChange={(e) => setIncidentSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-gray-600 text-white"
                    />
                  </div>
                  <Select value={incidentStatusFilter} onValueChange={setIncidentStatusFilter}>
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Detected">Detected</SelectItem>
                      <SelectItem value="Triaged">Triaged</SelectItem>
                      <SelectItem value="Contained">Contained</SelectItem>
                      <SelectItem value="Eradicated">Eradicated</SelectItem>
                      <SelectItem value="Recovering">Recovering</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Under_Review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={incidentPriorityFilter} onValueChange={setIncidentPriorityFilter}>
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600">
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Add Automated Playbook Generator */}
            <IncidentPlaybookCreator />

            {/* Incidents List */}
            {incidentsError ? (
              <Card className="glass-effect border-red-500/30">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-4">Loading Error</h2>
                  <p className="text-gray-300 mb-6">{incidentsError}</p>
                  <Button onClick={handleRetryIncidents}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : filteredIncidents.length === 0 ? (
              <Card className="glass-effect border-cyan-500/20">
                <CardContent className="p-12 text-center">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Incidents Found</h3>
                  <p className="text-gray-400 mb-6">
                    {incidents.length === 0
                      ? "No incidents have been reported yet. Use the 'Report Incident' button above to get started."
                      : "No incidents match your current filters"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((incident, index) => (
                  <Card key={incident.id} className={`glass-effect border-slate-700/50 hover:border-cyan-500/40 transition-all duration-300 card-entrance stagger-${(index % 6) + 1}`}>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 z-10 text-red-300 hover:text-red-200"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteIncident(incident.id); }}
                        title="Delete incident"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Link to={createPageUrl(`IncidentDetail?id=${incident.id}`)} className="block">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-cyan-300">
                                  {incident.incident_id || `INC-${incident.id?.slice(-6).toUpperCase()}`}
                                </h3>
                                <Badge className={getPriorityColor(incident.priority)}>
                                  {getPriorityIcon(incident.priority)}
                                  <span className="ml-1">{incident.priority}</span>
                                </Badge>
                                <Badge className={getStatusColor(incident.status)}>
                                  {incident.status?.replace('_', ' ')}
                                </Badge>
                              </div>
                              <h4 className="text-white font-medium mb-2">{incident.title}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Category: {incident.category?.replace('_', ' ')}</span>
                                {incident.detection_timestamp && (
                                  <span>Detected: {format(new Date(incident.detection_timestamp), 'MMM d, yyyy HH:mm')}</span>
                                )}
                                {incident.assigned_to && (
                                  <span>Assigned: {incident.assigned_to}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Exercises Tab - Gated Content */}
          <TabsContent value="exercises" className="space-y-6">
            {canAccessTabletopExercises ? (
              <>
                {/* Section header card with CTA + filters */}
                <Card className="glass-effect border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Tabletop Exercises</h2>
                        <p className="text-gray-400">Plan and evaluate incident response through realistic simulations</p>
                      </div>
                      <Link to={createPageUrl("TabletopExerciseDraft?new=true")}>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400/30">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Exercise
                        </Button>
                      </Link>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search exercises..."
                          value={exerciseSearchTerm}
                          onChange={(e) => setExerciseSearchTerm(e.target.value)}
                          className="pl-10 bg-slate-800/50 border-gray-600 text-white"
                        />
                      </div>
                      <Select value={exerciseStatusFilter} onValueChange={setExerciseStatusFilter}>
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-gray-600">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Ready_to_Execute">Ready to Execute</SelectItem>
                          <SelectItem value="In_Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Exercises List */}
                {exercisesError ? (
                  <Card className="glass-effect border-red-500/30">
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-white mb-4">Loading Error</h2>
                      <p className="text-gray-300 mb-6">{exercisesError}</p>
                      <Button onClick={handleRetryExercises}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                ) : filteredExercises.length === 0 ? (
                  <Card className="glass-effect border-cyan-500/20">
                    <CardContent className="p-12 text-center">
                      <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Tabletop Exercises Found</h3>
                      <p className="text-gray-400 mb-6">
                        {exercises.length === 0
                          ? "Get started by using the 'Create Exercise' button above to plan your first tabletop exercise."
                          : "No exercises match your current filters"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExercises.map((exercise, index) => (
                      <Card key={exercise.id} className={`glass-effect border-slate-700/50 hover:border-cyan-500/40 transition-all duration-300 h-full card-entrance stagger-${(index % 6) + 1}`}>
                        <div className="relative h-full flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 right-3 z-10 text-red-300 hover:text-red-200 hover:bg-red-500/20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteExercise(exercise.id);
                            }}
                            title="Delete exercise"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                          <CardHeader className="flex-shrink-0">
                            <div className="flex items-center justify-between">
                              <Badge className={getExerciseStatusColor(exercise.status)}>
                                {exercise.status?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <CardTitle className="text-cyan-300 text-lg leading-tight">
                              {exercise.exercise_name}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="flex-grow flex flex-col justify-between">
                            <div className="space-y-3 mb-4">
                              {exercise.exercise_description && (
                                <p className="text-gray-400 text-sm line-clamp-3">
                                  {exercise.exercise_description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {exercise.facilitator_email && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{exercise.facilitator_email.split('@')[0]}</span>
                                  </div>
                                )}
                                {exercise.scheduled_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{format(new Date(exercise.scheduled_date), 'MMM d')}</span>
                                  </div>
                                )}
                              </div>
                              {/* NEW: BIA Score Meters */}
                              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                <div className="flex flex-col items-start">
                                  <span className="text-gray-400">Financial Impact:</span>
                                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div
                                      className="bg-yellow-500 h-2.5 rounded-full"
                                      style={{ width: `${(exercise.financial_impact_score / (exercise.financial_impact_max || 10)) * 100}%` }}
                                      title={`${exercise.financial_impact_score}/${exercise.financial_impact_max || 10}`}
                                    ></div>
                                  </div>
                                  <span className="text-gray-500 text-xs mt-1">{exercise.financial_impact_score}/{exercise.financial_impact_max || 10}</span>
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="text-gray-400">Reputational Impact:</span>
                                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div
                                      className="bg-red-500 h-2.5 rounded-full"
                                      style={{ width: `${(exercise.reputational_impact_score / (exercise.reputational_impact_max || 10)) * 100}%` }}
                                      title={`${exercise.reputational_impact_score}/${exercise.reputational_impact_max || 10}`}
                                    ></div>
                                  </div>
                                  <span className="text-gray-500 text-xs mt-1">{exercise.reputational_impact_score}/{exercise.reputational_impact_max || 10}</span>
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="text-gray-400">Operational Impact:</span>
                                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div
                                      className="bg-orange-500 h-2.5 rounded-full"
                                      style={{ width: `${(exercise.operational_impact_score / (exercise.operational_impact_max || 10)) * 100}%` }}
                                      title={`${exercise.operational_impact_score}/${exercise.operational_impact_max || 10}`}
                                    ></div>
                                  </div>
                                  <span className="text-gray-500 text-xs mt-1">{exercise.operational_impact_score}/{exercise.operational_impact_max || 10}</span>
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="text-gray-400">Legal/Compliance Impact:</span>
                                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div
                                      className="bg-purple-500 h-2.5 rounded-full"
                                      style={{ width: `${(exercise.legal_compliance_impact_score / (exercise.legal_compliance_impact_max || 10)) * 100}%` }}
                                      title={`${exercise.legal_compliance_impact_score}/${exercise.legal_compliance_impact_max || 10}`}
                                    ></div>
                                  </div>
                                  <span className="text-gray-500 text-xs mt-1">{exercise.legal_compliance_impact_score}/{exercise.legal_compliance_impact_max || 10}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Link to={createPageUrl(`TabletopExerciseDraft?id=${exercise.id}`)} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                                  Edit
                                </Button>
                              </Link>
                              {exercise.status === 'Ready_to_Execute' && (
                                <Link to={createPageUrl(`TabletopExerciseDetail?id=${exercise.id}&mode=execute`)} className="flex-1">
                                  <Button size="sm" className="w-full bg-gradient-to-r from-green-500 to-blue-500">
                                    <PlayCircle className="w-3 h-3 mr-1" />
                                    Execute
                                  </Button>
                                </Link>
                              )}
                              {exercise.status === 'Completed' && (
                                <>
                                  <Link to={createPageUrl(`TabletopExerciseDetail?id=${exercise.id}`)} className="flex-1">
                                    <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                                      View Report
                                    </Button>
                                  </Link>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                    onClick={async () => {
                                      try {
                                        const { generateTabletopReportPdf } = await import("@/functions/generateTabletopReportPdf");
                                        const { data } = await generateTabletopReportPdf({ exerciseId: exercise.id });
                                        const blob = new Blob([data], { type: 'application/pdf' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${exercise.exercise_name?.replace(/\s+/g, '_') || 'Tabletop_Exercise'}_Report.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        a.remove();
                                      } catch (error) {
                                        console.error("Error generating PDF:", error);
                                        alert("Failed to generate PDF report");
                                      }
                                    }}
                                    title="Download PDF Report"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <SubscriptionGate
                currentTier={currentUser?.subscription_tier}
                requiredTier={SUBSCRIPTION_TIERS.ENTERPRISE}
                featureName="Tabletop Exercise Management"
                description="Plan, execute, and analyze comprehensive incident response tabletop exercises with our Enterprise platform."
              >
                <div className="bg-slate-800/30 rounded-lg p-4 mt-4">
                  <h4 className="text-white font-medium mb-2">Enterprise Tabletop Features:</h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• <strong>Exercise Planning:</strong> Structured scenario development with AI assistance</li>
                    <li>• <strong>Real-time Execution:</strong> Facilitate live exercises with dynamic inject delivery</li>
                    <li>• <strong>Performance Analytics:</strong> Measure team effectiveness and identify gaps</li>
                    <li>• <strong>After-Action Reports:</strong> Comprehensive analysis with improvement recommendations</li>
                    <li>• <strong>Compliance Integration:</strong> Map exercises to regulatory requirements</li>
                  </ul>
                </div>
              </SubscriptionGate>
            )}
          </TabsContent>

          {/* Security Intelligence Tab - Feature Restrictions */}
          <TabsContent value="intelligence" className="space-y-6">
            <Tabs defaultValue="url-scanner" className="w-full">
              <TabsList className="mb-6">
                {allowedCommandCenterTabs.includes('url-scanner') && (
                  <TabsTrigger value="url-scanner">URL Scanner</TabsTrigger>
                )}
                {allowedCommandCenterTabs.includes('cve-search') && (
                  <TabsTrigger value="cve-search">CVE Database</TabsTrigger>
                )}
                {/* NEW: Add Surface Exposure Reconnaissance tab */}
                {allowedCommandCenterTabs.includes('surface-recon') ? (
                  <TabsTrigger value="surface-recon">Surface Exposure Recon</TabsTrigger>
                ) : (
                  <TabsTrigger value="surface-recon" disabled className="opacity-50">
                    Surface Exposure Recon <Lock className="w-3 h-3 ml-1" />
                  </TabsTrigger>
                )}
                {/* NEW: Add Screenshot Phishing Check tab */}
                {allowedCommandCenterTabs.includes('phishing-check') ? (
                  <TabsTrigger value="phishing-check">Screenshot Phishing Check</TabsTrigger>
                ) : (
                  <TabsTrigger value="phishing-check" disabled className="opacity-50">
                    Screenshot Phishing Check <Lock className="w-3 h-3 ml-1" />
                  </TabsTrigger>
                )}
                {/* NEW: Add CISA News Feed tab */}
                {allowedCommandCenterTabs.includes('cisa-feed') ? (
                  <TabsTrigger value="cisa-feed">CISA News Feed</TabsTrigger>
                ) : (
                  <TabsTrigger value="cisa-feed" disabled className="opacity-50">
                    CISA News Feed <Lock className="w-3 h-3 ml-1" />
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="url-scanner">
                {/* Section header card with scan input */}
                <Card className="glass-effect border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5">
                      <div>
                        <h2 className="text-xl font-semibold text-white">URL Security Scanner</h2>
                        <p className="text-gray-400">Check URLs for malicious content, phishing, and security threats</p>
                      </div>
                    </div>

                    {/* Scan Input */}
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Enter URL to scan (e.g., https://example.com)"
                          value={scanTarget}
                          onChange={(e) => setScanTarget(e.target.value)}
                          className="pl-10 bg-slate-800/50 border-gray-600 text-white"
                          disabled={scanLoading}
                        />
                      </div>
                      <Button
                        onClick={handleStartScan}
                        disabled={scanLoading || !scanTarget.trim()}
                        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-md hover:shadow-lg focus:ring-2 focus:ring-green-400/30"
                      >
                        {scanLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deep Scanning...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Start Deep Scan
                          </>
                        )}
                      </Button>
                    </div>

                    {scanError && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center text-red-300">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          <span className="text-sm">{scanError}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Animated Scanning Interface */}
                {scanLoading && (
                  <SecurityScanningAnimation
                    isScanning={scanLoading}
                    targetUrl={scanTarget}
                    onPhaseChange={handleScanPhaseChange}
                    mode="scanning"
                  />
                )}

                {/* Smart Analysis Animation */}
                {analysisLoading && (
                  <SecurityScanningAnimation
                    isScanning={analysisLoading}
                    targetUrl={scanTarget}
                    onPhaseChange={handleAnalysisPhaseChange}
                    mode="analysis"
                  />
                )}

                {/* NEW: Animated Scan Results */}
                {scanResults && (
                  <AnimatedResultsDisplay results={scanResults} type="url_scan" />
                )}

                {/* Enhanced Smart Analysis Card */}
                {scanResults && (
                  <Card className="glass-effect border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-cyan-300 flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Smart Security Analysis
                      </CardTitle>
                      <p className="text-gray-400">
                        AI-powered analysis explaining the security implications and recommended actions
                      </p>
                    </CardHeader>
                    <CardContent>
                      {!smartAnalysis && !analysisLoading && (
                        <div className="text-center py-8">
                          <Button
                            onClick={generateSmartAnalysis}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg"
                            disabled={!scanResults || scanResults.findings.length === 0}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analyze My Scan
                          </Button>
                          {scanResults && scanResults.findings.length === 0 && (
                            <p className="text-gray-500 text-sm mt-2">No findings to analyze.</p>
                          )}
                        </div>
                      )}

                      {smartAnalysis && (
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown
                            className="text-gray-300 leading-relaxed"
                            components={{
                              h2: ({children}) => {
                                const text = children.toString().toLowerCase();
                                let colorClass = 'text-cyan-300';

                                if (text.includes('executive summary')) {
                                  colorClass = 'text-cyan-300';
                                } else if (text.includes('cve findings summary')) {
                                  colorClass = 'text-red-300'; // New color for CVE summary
                                } else if (text.includes('critical') || text.includes('high')) {
                                  colorClass = 'text-orange-300'; // Changed from red-300 for distinct critical/high
                                } else if (text.includes('medium') || text.includes('low') || text.includes('risk')) {
                                  colorClass = 'text-yellow-300';
                                } else if (text.includes('ports') || text.includes('software') || text.includes('system')) {
                                  colorClass = 'text-green-300';
                                } else if (text.includes('overall') || text.includes('assessment')) {
                                  colorClass = 'text-purple-300';
                                } else if (text.includes('recommended') || text.includes('actions')) {
                                  colorClass = 'text-emerald-300';
                                }

                                return (
                                  <h2 className={`text-xl font-bold ${colorClass} mb-4 mt-8 first:mt-0 border-b border-slate-700/50 pb-2`}>
                                    {children}
                                  </h2>
                                );
                              },
                              h3: ({children}) => (
                                <h3 className="text-lg font-semibold text-white mb-3 mt-6">
                                  {children}
                                </h3>
                              ),
                              p: ({children}) => (
                                <p className="text-gray-300 mb-4 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              ul: ({children}) => (
                                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                                  {children}
                                </ul>
                              ),
                              li: ({children}) => (
                                <li className="text-gray-300 leading-relaxed">
                                  {children}
                                </li>
                              ),
                              // FIX: correct closing tag for strong
                              strong: ({children}) => (
                                <strong className="text-white font-semibold">
                                  {children}
                                </strong>
                              ),
                              code: ({children}) => (
                                <code className="bg-slate-800 text-cyan-300 px-2 py-1 rounded text-sm">
                                  {children}
                                </code>
                              )
                            }}
                          >
                            {smartAnalysis}
                          </ReactMarkdown>
                          <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end">
                            <Button
                              onClick={generateSmartAnalysis}
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-800"
                              disabled={analysisLoading}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Regenerate Analysis
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="cve-search">
                <CveSearch />
              </TabsContent>

              {/* NEW: Surface Exposure Reconnaissance tab content - Gated */}
              <TabsContent value="surface-recon">
                {allowedCommandCenterTabs.includes('surface-recon') ? (
                  <SurfaceExposureRecon />
                ) : (
                  <SubscriptionGate
                    currentTier={currentUser?.subscription_tier}
                    requiredTier={SUBSCRIPTION_TIERS.GROWTH}
                    featureName="Surface Exposure Reconnaissance"
                    description="Discover your organization's external attack surface and exposed assets across the internet."
                    showUpgrade={false}
                  />
                )}
              </TabsContent>

              {/* NEW: Phishing Screenshot Analyzer tab content - Gated */}
              <TabsContent value="phishing-check">
                {allowedCommandCenterTabs.includes('phishing-check') ? (
                  <PhishingScreenshotAnalyzer />
                ) : (
                  <SubscriptionGate
                    currentTier={currentUser?.subscription_tier}
                    requiredTier={SUBSCRIPTION_TIERS.GROWTH}
                    featureName="Screenshot Phishing Analysis"
                    description="Upload suspicious screenshots and get AI-powered phishing detection and analysis."
                    showUpgrade={false}
                  />
                )}
              </TabsContent>

              {/* NEW: CISA News Feed tab content - Gated */}
              <TabsContent value="cisa-feed">
                {allowedCommandCenterTabs.includes('cisa-feed') ? (
                  <CisaFeed />
                ) : (
                  <SubscriptionGate
                    currentTier={currentUser?.subscription_tier}
                    requiredTier={SUBSCRIPTION_TIERS.GROWTH} // Adjust required tier as needed
                    featureName="CISA News Feed"
                    description="Stay informed with the latest cybersecurity alerts, advisories, and news from CISA."
                    showUpgrade={false}
                  />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Security Tools Tab - UPDATED: tabbed tools */}
          <TabsContent value="tools" className="space-y-6">
            <Tabs defaultValue={initialToolsTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="password">Password Generator</TabsTrigger>
                <TabsTrigger
                  value="sast"
                  disabled={isSastBlocked}
                  className={`${isSastBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  BeaTrace SAST Scanner {isSastBlocked && <Lock className="w-3 h-3 ml-2" />}
                </TabsTrigger>
                <TabsTrigger value="architecture-audit">Architecture Audit</TabsTrigger>
                <TabsTrigger value="pci-scoping">PCI DSS Scoping</TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <PasswordGenerator />
              </TabsContent>

              <TabsContent value="sast">
                {isSastBlocked ? (
                  <SubscriptionGate
                    currentTier={currentUser?.subscription_tier}
                    requiredTier={SUBSCRIPTION_TIERS.GROWTH}
                    featureName="BeaTrace SAST Scanner"
                    description="Static code security analysis with AI-assisted findings and remediation guidance."
                  />
                ) : (
                  <>
                    <SastAnalyzer />
                    {/* Removed always-on OWASP panel and merge tool; now opened contextually from SastAnalyzer */}
                  </>
                )}
              </TabsContent>

              <TabsContent value="architecture-audit">
                <ArchitectureAudit />
              </TabsContent>

              <TabsContent value="pci-scoping">
                <PciScopingTool />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
