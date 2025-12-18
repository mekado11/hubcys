
import React, { useState, useEffect } from "react";
import { Incident } from "@/entities/Incident";
import { User } from "@/entities/User";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, AlertTriangle, Calendar, User as UserIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import IncidentNotesManager from "../components/incident/IncidentNotesManager";
import SmartAnalysisDisplay from "../components/incident/SmartAnalysisDisplay";
import NIS2ComplianceSection from "../components/incident/NIS2ComplianceSection";
import IncidentLifecycle from "../components/incident/IncidentLifecycle";
import { Checkbox } from "@/components/ui/checkbox";
import { generateIncidentReportPdf } from "@/functions/generateIncidentReportPdf";
import EditingWarning from '../components/collaboration/EditingWarning';
import RoleGate, { canEditEntity } from '../components/collaboration/RoleGate';
import AIEnrichmentPanel from '../components/incident/AIEnrichmentPanel'; // New import

export default function IncidentDetail() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isNewIncident, setIsNewIncident] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [error, setError] = useState(null); // New state for error handling


  // Initialize with proper default values for all fields
  const [incident, setIncident] = useState({ // Renamed from incidentData
    company_id: "",
    incident_id: "",
    title: "",
    description: "",
    status: "Detected",
    priority: "Medium",
    category: "",
    threat_actor_type: "",
    threat_actor_name: "",
    threat_actor_motivation: "",
    threat_actor_confidence: "",
    detection_timestamp: "",
    nis2_significance: "Not Assessed",
    nis2_initial_notification_sent_at: "",
    nis2_interim_update_sent_at: "",
    nis2_final_report_sent_at: "",
    nis2_notified_authorities: "",
    nis2_cross_border_impact: false,
    nis2_affected_services: "",
    detection_source: "",
    reporter_name: "",
    reporter_email: "",
    affected_systems: "",
    affected_users: "",
    affected_data: "",
    business_impact: "",
    containment_actions: "",
    containment_timestamp: "",
    containment_effective: null,
    stakeholders_notified: "",
    root_cause: "",
    eradication_actions: "",
    eradication_timestamp: "",
    tools_used: "",
    iocs_identified: "",
    patches_applied: "",
    systems_restored: "",
    recovery_timestamp: "",
    verification_steps: "",
    monitoring_enabled: "",
    return_to_service: "",
    incident_timeline: "",
    what_worked: "",
    what_failed: "",
    communication_issues: "",
    escalation_timeline: "",
    team_performance: "",
    lessons_learned: "",
    action_items_generated: "",
    control_gaps_identified: "",
    runbooks_updated: "",
    training_needs: "",
    final_report: "",
    assigned_to: "",
    closed_timestamp: "",
    mttr_minutes: null,
    mttd_minutes: null,
    external_notifications: "",
    cost_estimate: null
  });

  useEffect(() => {
    const initializeIncident = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors

        // Get current user first
        const user = await User.me();
        setCurrentUser(user);

        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const incidentId = urlParams.get('id');
        const isNew = urlParams.get('new') === 'true';

        if (isNew) {
          // Creating new incident
          console.log('Creating new incident');
          setIsNewIncident(true);
          const newIncidentData = {
            ...incident, // Start with initial default state (renamed incidentData)
            company_id: user.company_id,
            incident_id: `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            detection_timestamp: new Date().toISOString(),
            reporter_name: user.full_name || "",
            reporter_email: user.email || "",
            assigned_to: user.email
          };
          setIncident(newIncidentData); // Updated setIncidentData to setIncident
          console.log('New incident data set:', newIncidentData);
        } else if (incidentId) {
          // Loading existing incident
          console.log('Loading existing incident:', incidentId);
          const existingIncident = await Incident.get(incidentId);
          console.log('Loaded incident data from database:', existingIncident);

          if (existingIncident.company_id !== user.company_id) {
            throw new Error("Access denied: This incident belongs to a different company.");
          }

          // CRITICAL FIX: Merge existing data with defaults to ensure all fields are populated
          const mergedData = {
            ...incident, // Start with defaults (renamed incidentData)
            ...existingIncident, // Override with saved data
            // Ensure critical fields are properly set
            company_id: existingIncident.company_id || user.company_id
          };

          setIncident(mergedData); // Updated setIncidentData to setIncident
          setIsNewIncident(false);
          console.log('Existing incident data merged and set:', mergedData);
        } else {
            // No incident ID and not a new incident, redirect
            console.warn("No incident ID or 'new' parameter found. Redirecting.");
            navigate(createPageUrl("ResponseReadiness"));
        }

      } catch (error) {
        console.error("Error initializing incident:", error);
        setError(error.message); // Set error state
        // alert(`Error loading incident: ${error.message}`); // Removed alert
        // navigate(createPageUrl("ResponseReadiness")); // Removed direct navigation
      } finally {
        setLoading(false);
      }
    };

    initializeIncident();
  }, [navigate, incident.company_id, incident.incident_id, incident.title, incident.description, incident.status, incident.priority, incident.category, incident.threat_actor_type, incident.threat_actor_name, incident.threat_actor_motivation, incident.threat_actor_confidence, incident.detection_timestamp, incident.nis2_significance, incident.nis2_initial_notification_sent_at, incident.nis2_interim_update_sent_at, incident.nis2_final_report_sent_at, incident.nis2_notified_authorities, incident.nis2_cross_border_impact, incident.nis2_affected_services, incident.detection_source, incident.reporter_name, incident.reporter_email, incident.affected_systems, incident.affected_users, incident.affected_data, incident.business_impact, incident.containment_actions, incident.containment_timestamp, incident.containment_effective, incident.stakeholders_notified, incident.root_cause, incident.eradication_actions, incident.eradication_timestamp, incident.tools_used, incident.iocs_identified, incident.patches_applied, incident.systems_restored, incident.recovery_timestamp, incident.verification_steps, incident.monitoring_enabled, incident.return_to_service, incident.incident_timeline, incident.what_worked, incident.what_failed, incident.communication_issues, incident.escalation_timeline, incident.team_performance, incident.lessons_learned, incident.action_items_generated, incident.control_gaps_identified, incident.runbooks_updated, incident.training_needs, incident.final_report, incident.assigned_to, incident.closed_timestamp, incident.mttr_minutes, incident.mttd_minutes, incident.external_notifications, incident.cost_estimate]); // Added incident dependencies for completeness, though specific fields might not be necessary for initial load

  const handleInputChange = (field, value) => {
    console.log(`Updating field ${field} with value:`, value);
    setIncident(prev => { // Updated setIncidentData to setIncident
      const updated = {
        ...prev,
        [field]: value
      };
      console.log('Updated incident data:', updated);
      return updated;
    });
  };

  const handleSaveIncident = async () => { // Renamed from handleSaveIncident to handleSave for consistency with outline
    try {
      setSaving(true);
      console.log('=== SAVING INCIDENT ===');
      console.log('Current incident data:', incident); // Updated incidentData to incident

      // Validate required fields
      if (!incident.title?.trim()) { // Updated incidentData to incident
        alert('Please enter a title for the incident');
        return;
      }

      // Prepare data for saving - ensure all fields are included
      const dataToSave = {
        ...incident, // Updated incidentData to incident
        company_id: currentUser.company_id,
        // Ensure proper data types for specific fields
        nis2_cross_border_impact: Boolean(incident.nis2_cross_border_impact), // Updated incidentData to incident
        containment_effective: incident.containment_effective === null ? null : Boolean(incident.containment_effective), // Updated incidentData to incident
        mttr_minutes: incident.mttr_minutes ? Number(incident.mttr_minutes) : null, // Updated incidentData to incident
        mttd_minutes: incident.mttd_minutes ? Number(incident.mttd_minutes) : null, // Updated incidentData to incident
        cost_estimate: incident.cost_estimate ? Number(incident.cost_estimate) : null // Updated incidentData to incident
      };

      console.log('Data being saved to database:', dataToSave);

      let savedIncident;

      if (isNewIncident) {
        // Create new incident with all data
        console.log('Creating new incident with data:', dataToSave);
        savedIncident = await Incident.create(dataToSave);
        console.log('New incident created with ID:', savedIncident.id);
        setIsNewIncident(false);

        // Update URL to reflect the new incident ID
        window.history.replaceState({}, '', createPageUrl(`IncidentDetail?id=${savedIncident.id}`));
      } else {
        // Update existing incident with all data
        console.log('Updating existing incident ID:', incident.id); // Updated incidentData to incident
        savedIncident = await Incident.update(incident.id, dataToSave); // Updated incidentData to incident
        console.log('Incident updated successfully');
      }

      // Update local state with saved data to ensure consistency (e.g., ID for new incidents)
      setIncident(prev => ({ // Updated setIncidentData to setIncident
        ...prev,
        ...savedIncident
      }));

      alert('Incident saved successfully!');

    } catch (error) {
      console.error("Error saving incident:", error);
      alert(`Failed to save incident: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBackToList = () => {
    navigate(createPageUrl("ResponseReadiness"));
  };

  // Add this helper before the return
  const scrollToPhase = (phaseId) => {
    const el = document.getElementById(phaseId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGenerateIncidentReport = async () => {
    if (!incident?.id) { // Updated incidentData to incident
      alert('Please save the incident first before generating a report.');
      return;
    }
    setReportGenerating(true);
    try {
      const { data } = await generateIncidentReportPdf({ incidentId: incident.id }); // Updated incidentData to incident
      const blob = new Blob([data], { type: "application/pdf" }); // Assuming PDF is the actual type
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      // optional: revoke after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error("Error generating incident report:", error);
      alert(`Failed to generate report: ${error.message}`);
    } finally {
      setReportGenerating(false);
    }
  };

  // Add a refresh function to reload incident data after AI operations
  const refreshIncident = async () => {
    if (!incident?.id) return;
    try {
      const refreshed = await Incident.get(incident.id);
      setIncident(refreshed);
    } catch (error) {
      console.error('Error refreshing incident:', error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Incident...</h2> {/* Updated text */}
        </div>
      </div>
    );
  }

  // New error rendering block
  if (error) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center p-6 bg-red-900/30 border border-red-500 rounded-lg shadow-lg">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Incident</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <Button onClick={() => navigate(createPageUrl("ResponseReadiness"))} className="bg-red-600 hover:bg-red-700">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // This check is implicitly handled by the error block above, but important for further rendering
  if (!incident || !incident.id && !isNewIncident) {
    // This case should ideally be caught by the error handler or new incident logic
    // but acts as a safeguard. A new incident might not have an ID yet, so `!incident.id` alone is not enough.
    // However, if we're not loading, and not a new incident, and have no ID, something is wrong.
    return (
        <div className="min-h-screen cyber-gradient flex items-center justify-center">
            <div className="text-center p-6 bg-yellow-900/30 border border-yellow-500 rounded-lg shadow-lg">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Incident Data Not Available</h2>
                <p className="text-yellow-200 mb-4">Could not load or create incident. Please try again.</p>
                <Button onClick={() => navigate(createPageUrl("ResponseReadiness"))} className="bg-yellow-600 hover:bg-yellow-700">
                    Go Back
                </Button>
            </div>
        </div>
    );
  }


  // Debug log before rendering
  console.log('Rendering IncidentDetail with incident:', incident); // Updated incidentData to incident

  const canEdit = canEditEntity(currentUser, 'incidents', incident); // New canEdit variable

  return (
    <div className="min-h-screen cyber-gradient"> {/* Changed outer div class */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> {/* Changed inner div class */}
        {/* Editing Warning */}
        <EditingWarning
          entityType="incident"
          entityId={incident.id}
          currentUser={currentUser}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"> {/* Changed header class */}
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("ResponseReadiness")}> {/* Changed Button to Link */}
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{incident.title}</h1> {/* Updated to incident.title */}
              <p className="text-gray-400 text-sm mt-1">{incident.incident_id}</p> {/* Updated to incident.incident_id */}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2"> {/* Added flex-wrap */}
            <RoleGate user={currentUser} permission="edit:incidents"> {/* Wrapped with RoleGate */}
              <Button 
                onClick={handleSaveIncident} // Renamed handleSave to handleSaveIncident
                disabled={saving || !canEdit} // Added !canEdit to disabled
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </RoleGate>
            
            {/* Other buttons */}
            {!isNewIncident && incident?.id && ( // Updated incidentData to incident
              <Button
                variant="outline"
                onClick={handleGenerateIncidentReport}
                disabled={reportGenerating}
                className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
              >
                <FileText className="w-4 h-4 mr-2" />
                {reportGenerating ? "Generating..." : "Generate Report"}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-6">
            <IncidentLifecycle status={incident?.status || "Detected"} onPhaseClick={scrollToPhase} />

            <div id="phase-detection" className="h-0"></div>

            {/* AI Enrichment Panel - Add this FIRST */}
            {!isNewIncident && incident?.id && (
              <AIEnrichmentPanel 
                incident={incident} 
                onUpdate={refreshIncident}
                canEdit={canEdit}
              />
            )}

            {/* Basic Information */}
            <Card className="glass-effect border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-300">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Incident ID
                    </label>
                    <Input
                      value={incident.incident_id || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('incident_id', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="INC-2024-001"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Detection Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={incident.detection_timestamp ? incident.detection_timestamp.slice(0, 16) : ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('detection_timestamp', e.target.value ? new Date(e.target.value).toISOString() : "")}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Incident Title *
                  </label>
                  <Input
                    value={incident.title || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white"
                    placeholder="Brief description of the incident"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={incident.description || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-24"
                    placeholder="Detailed description of what happened..."
                    disabled={!canEdit}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <Select value={incident.status || "Detected"} onValueChange={(value) => handleInputChange('status', value)} disabled={!canEdit}> {/* Updated incidentData to incident */}
                      <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-gray-600">
                        <SelectItem value="Detected">Detected</SelectItem>
                        <SelectItem value="Triaged">Triaged</SelectItem>
                        <SelectItem value="Contained">Contained</SelectItem>
                        <SelectItem value="Eradicated">Eradicated</SelectItem>
                        <SelectItem value="Recovering">Recovering</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Under_Review">Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority
                    </label>
                    <Select value={incident.priority || "Medium"} onValueChange={(value) => handleInputChange('priority', value)} disabled={!canEdit}> {/* Updated incidentData to incident */}
                      <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-gray-600">
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <Select value={incident.category || ""} onValueChange={(value) => handleInputChange('category', value)} disabled={!canEdit}> {/* Updated incidentData to incident */}
                      <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-gray-600">
                        <SelectItem value="Malware">Malware</SelectItem>
                        <SelectItem value="Phishing">Phishing</SelectItem>
                        <SelectItem value="Data_Breach">Data Breach</SelectItem>
                        <SelectItem value="Insider_Threat">Insider Threat</SelectItem>
                        <SelectItem value="DDoS">DDoS</SelectItem>
                        <SelectItem value="Unauthorized_Access">Unauthorized Access</SelectItem>
                        <SelectItem value="System_Compromise">System Compromise</SelectItem>
                        <SelectItem value="Network_Intrusion">Network Intrusion</SelectItem>
                        <SelectItem value="Physical_Security">Physical Security</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* NEW: Inline Status Summary under status/priority/category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incident.detection_timestamp && ( // Updated incidentData to incident
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Detected: {format(new Date(incident.detection_timestamp), 'MMM d, yyyy HH:mm')}</span> {/* Updated incidentData to incident */}
                    </div>
                  )}
                  {incident.assigned_to && ( // Updated incidentData to incident
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <UserIcon className="w-4 h-4" />
                      <span>Assigned: {incident.assigned_to}</span> {/* Updated incidentData to incident */}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detection & Reporting */}
            <Card className="glass-effect border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-300">Detection & Reporting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Detection Source
                    </label>
                    <Input
                      value={incident.detection_source || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('detection_source', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="SIEM, User Report, IDS, etc."
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Assigned To
                    </label>
                    <Input
                      value={incident.assigned_to || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="Email of incident commander"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reporter Name
                    </label>
                    <Input
                      value={incident.reporter_name || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('reporter_name', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="Who reported this incident?"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reporter Email
                    </label>
                    <Input
                      type="email"
                      value={incident.reporter_email || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('reporter_email', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="reporter@company.com"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Assessment */}
            <Card className="glass-effect border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-orange-300">Impact Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Affected Systems
                  </label>
                  <Textarea
                    value={incident.affected_systems || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('affected_systems', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-20"
                    placeholder="List of affected systems, applications, or infrastructure..."
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Affected Users
                  </label>
                  <Textarea
                    value={incident.affected_users || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('affected_users', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-20"
                    placeholder="Users or departments impacted..."
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Impact
                  </label>
                  <Textarea
                    value={incident.business_impact || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('business_impact', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-20"
                    placeholder="Assessment of business operations impact..."
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Smart Analysis directly under Impact Assessment */}
            <div className="overflow-x-auto">
              <SmartAnalysisDisplay incident={incident} onUpdate={handleInputChange} canEdit={canEdit} /> {/* Updated incidentData to incident and passed canEdit */}
            </div>

            {/* Containment Phase */}
            <div id="phase-containment" className="h-0"></div>
            <Card className="glass-effect border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-300">Containment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Containment Actions
                  </label>
                  <Textarea
                    value={incident.containment_actions || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('containment_actions', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-24"
                    placeholder="Describe immediate actions taken to contain the incident..."
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Containment Achieved At
                    </label>
                    <Input
                      type="datetime-local"
                      value={incident.containment_timestamp ? incident.containment_timestamp.slice(0,16) : ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('containment_timestamp', e.target.value ? new Date(e.target.value).toISOString() : "")}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-6 md:mt-[30px]">
                    <Checkbox
                      id="containment_effective"
                      checked={Boolean(incident.containment_effective)} // Updated incidentData to incident
                      onCheckedChange={(checked) => handleInputChange('containment_effective', Boolean(checked))}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-500"
                      disabled={!canEdit}
                    />
                    <label htmlFor="containment_effective" className="text-gray-300 cursor-pointer">
                      Containment Effective
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Stakeholders Notified
                    </label>
                    <Input
                      value={incident.stakeholders_notified || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('stakeholders_notified', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="Internal/external stakeholders notified"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eradication Phase */}
            <div id="phase-eradication" className="h-0"></div>
            <Card className="glass-effect border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-yellow-300">Eradication & Root Cause</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Root Cause
                    </label>
                    <Textarea
                      value={incident.root_cause || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('root_cause', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      placeholder="Describe the underlying cause identified..."
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Eradication Actions
                    </label>
                    <Textarea
                      value={incident.eradication_actions || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('eradication_actions', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      placeholder="Steps taken to remove malware, close vectors, etc."
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Eradication Completed At
                    </label>
                    <Input
                      type="datetime-local"
                      value={incident.eradication_timestamp ? incident.eradication_timestamp.slice(0,16) : ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('eradication_timestamp', e.target.value ? new Date(e.target.value).toISOString() : "")}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tools Used
                    </label>
                    <Input
                      value={incident.tools_used || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('tools_used', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="Forensics/EDR/IR tools used"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      IOCs Identified
                    </label>
                    <Input
                      value={incident.iocs_identified || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('iocs_identified', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="Hashes, domains, IPs..."
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Patches / Config Changes Applied
                  </label>
                  <Textarea
                    value={incident.patches_applied || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('patches_applied', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-20"
                    placeholder="Remediations applied to prevent recurrence"
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recovery Phase */}
            <div id="phase-recovery" className="h-0"></div>
            <Card className="glass-effect border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-blue-300">Recovery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Recovery Completed At
                    </label>
                    <Input
                      type="datetime-local"
                      value={incident.recovery_timestamp ? incident.recovery_timestamp.slice(0,16) : ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('recovery_timestamp', e.target.value ? new Date(e.target.value).toISOString() : "")}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Return to Service
                    </label>
                    <Input
                      type="datetime-local"
                      value={incident.return_to_service ? incident.return_to_service.slice(0,16) : ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('return_to_service', e.target.value ? new Date(e.target.value).toISOString() : "")}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Monitoring Enabled
                    </label>
                    <Input
                      value={incident.monitoring_enabled || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('monitoring_enabled', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="Additional monitoring after recovery"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Systems Restored
                  </label>
                  <Textarea
                    value={incident.systems_restored || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('systems_restored', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-20"
                    placeholder="Systems/services restored and validation steps"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Steps
                  </label>
                  <Textarea
                    value={incident.verification_steps || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('verification_steps', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-20"
                    placeholder="Steps to verify system integrity"
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Post‑Incident Review Phase */}
            <div id="phase-post" className="h-0"></div>
            <Card className="glass-effect border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-300">Post‑Incident Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Incident Timeline (Key Events)
                  </label>
                  <Textarea
                    value={incident.incident_timeline || ""} // Updated incidentData to incident
                    onChange={(e) => handleInputChange('incident_timeline', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-24"
                    placeholder="Chronological summary of major events and decisions"
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      What Worked
                    </label>
                    <Textarea
                      value={incident.what_worked || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('what_worked', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      What Failed / Gaps
                    </label>
                    <Textarea
                      value={incident.what_failed || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('what_failed', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Communication Issues
                    </label>
                    <Textarea
                      value={incident.communication_issues || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('communication_issues', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Escalation Timeline
                    </label>
                    <Textarea
                      value={incident.escalation_timeline || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('escalation_timeline', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Team Performance
                    </label>
                    <Textarea
                      value={incident.team_performance || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('team_performance', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Lessons Learned
                    </label>
                    <Textarea
                      value={incident.lessons_learned || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('lessons_learned', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Action Items Generated
                    </label>
                    <Textarea
                      value={incident.action_items_generated || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('action_items_generated', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Control Gaps Identified
                    </label>
                    <Textarea
                      value={incident.control_gaps_identified || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('control_gaps_identified', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Runbooks Updated
                    </label>
                    <Textarea
                      value={incident.runbooks_updated || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('runbooks_updated', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Training Needs
                    </label>
                    <Textarea
                      value={incident.training_needs || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('training_needs', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Final Report Content / Link
                    </label>
                    <Textarea
                      value={incident.final_report || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('final_report', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      External Notifications Summary
                    </label>
                    <Textarea
                      value={incident.external_notifications || ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('external_notifications', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white h-20"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Closed At
                    </label>
                    <Input
                      type="datetime-local"
                      value={incident.closed_timestamp ? incident.closed_timestamp.slice(0,16) : ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('closed_timestamp', e.target.value ? new Date(e.target.value).toISOString() : "")}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      MTTD (minutes)
                    </label>
                    <Input
                      type="number"
                      value={incident.mttd_minutes ?? ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('mttd_minutes', e.target.value ? Number(e.target.value) : null)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="e.g., 45"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      MTTR (minutes)
                    </label>
                    <Input
                      type="number"
                      value={incident.mttr_minutes ?? ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('mttr_minutes', e.target.value ? Number(e.target.value) : null)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="e.g., 180"
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cost Estimate (USD)
                    </label>
                    <Input
                      type="number"
                      value={incident.cost_estimate ?? ""} // Updated incidentData to incident
                      onChange={(e) => handleInputChange('cost_estimate', e.target.value ? Number(e.target.value) : null)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="e.g., 25000"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NIS2 Compliance Section - Only render when we have incident data */}
            {incident && incident.nis2_significance && ( // Updated incidentData to incident
              <NIS2ComplianceSection
                incident={incident} // Updated incidentData to incident
                onUpdate={handleInputChange}
                canEdit={canEdit}
              />
            )}

            {/* Incident Notes Section - Moved from sidebar to bottom of main column */}
            {!isNewIncident && incident.id && ( // Updated incidentData to incident
              <IncidentNotesManager incidentId={incident.id} canEdit={canEdit} /> // Updated incidentData to incident and passed canEdit
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
