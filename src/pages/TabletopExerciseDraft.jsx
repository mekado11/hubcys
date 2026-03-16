import React, { useState, useEffect, useCallback, useRef } from "react";
import { TabletopExercise } from "@/entities/TabletopExercise";
import { User } from "@/entities/User";
import { ExerciseParticipant } from "@/entities/ExerciseParticipant";
import { BIA } from "@/entities/BIA";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TabletopExerciseDetail from "./TabletopExerciseDetail";
import { AlertTriangle, Loader2, Users, Plus, Trash2, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CachedEntityManager } from "@/components/utils/networkUtils";

export default function TabletopExerciseDraft() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingExercise, setExistingExercise] = useState(null);
  const [exerciseId, setExerciseId] = useState(null);

  // State for participant management
  const [participants, setParticipants] = useState([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    participant_email: "",
    participant_name: "",
    role_title: "",
    functional_roles: [],
    systems_owned: "",
    contact_methods: ""
  });

  // Throttle + loading flags to avoid hammering the API (helps with 429)
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const lastParticipantsLoadRef = useRef(0);
  const PARTICIPANTS_REFRESH_MIN_INTERVAL = 5000; // 5 seconds

  const [companyBias, setCompanyBias] = useState([]);
  const [showBiaImport, setShowBiaImport] = useState(false);

  const [exerciseData, setExerciseData] = useState({
    exercise_name: "",
    exercise_description: "",
    company_name: "",
    company_size: "",
    industry_sector: "",
    critical_systems_scope: "",
    business_context: "",
    exercise_objectives: "",
    compliance_requirements: "",
    scenarios: "[]",
    // Removed 'participants' from exerciseData as it's now managed via ExerciseParticipant entity
    status: "Planning",
    facilitator_email: ""
  });

  const loadCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("TabletopExerciseDraft: Loading current user...");
      const user = await User.me();
      console.log("TabletopExerciseDraft: User loaded:", user.email);

      setCurrentUser(user);

      // Validate user has company setup
      if (!user.company_id || !user.company_name) {
        throw new Error("Company setup incomplete. Please complete company onboarding first.");
      }

      // Check if we're editing an existing exercise
      const urlParams = new URLSearchParams(location.search);
      const idFromUrl = urlParams.get('id'); // Get ID from URL
      setExerciseId(idFromUrl); // Set exerciseId state

      if (idFromUrl) { // Use idFromUrl for checks
        console.log("TabletopExerciseDraft: Loading existing exercise:", idFromUrl);
        try {
          // Use cache + retry/backoff wrapper to reduce rate limits
          const exercise = await CachedEntityManager.get(
            TabletopExercise,
            'filter',
            [{ id: idFromUrl, company_id: user.company_id }],
            `tte_${idFromUrl}_${user.company_id}`
          );
          if (exercise && exercise.length > 0) {
            console.log("TabletopExerciseDraft: Existing exercise loaded");
            setExistingExercise(exercise[0]);
            setExerciseData(exercise[0]); // Populate exerciseData from existing exercise
          } else {
            console.log("TabletopExerciseDraft: Exercise not found for ID, starting new draft.");
          }
        } catch (exerciseError) {
          console.log("TabletopExerciseDraft: Error loading exercise, starting new draft:", exerciseError.message);
          // If exercise doesn't exist or can't be loaded, continue with new exercise
        }
      }

      // Set default values for new exercise or if no existing exercise found/loaded
      // Ensure we don't overwrite if an existing exercise's data was just loaded
      if (!idFromUrl || !existingExercise) { // If no ID or existingExercise wasn't set (e.g. not found)
        setExerciseData(prev => ({
          ...prev,
          facilitator_email: user.email,
          company_name: user.company_name || "",
          company_size: user.company_size || "",
          industry_sector: user.company_industry || ""
        }));
      }

    } catch (error) {
      console.error("TabletopExerciseDraft: Error loading user:", error);
      setError(error.message);

      // Only redirect after a delay to show error message
      if (error.message.includes("Company setup incomplete")) {
        setTimeout(() => {
          navigate(createPageUrl("CompanyOnboarding"));
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [location.search, navigate, existingExercise]);

  const loadParticipants = useCallback(async () => {
    if (!exerciseId) return;

    // Throttle repeated loads to avoid rate-limit bursts
    if (participantsLoading) return;
    const now = Date.now();
    if (now - lastParticipantsLoadRef.current < PARTICIPANTS_REFRESH_MIN_INTERVAL) {
      console.log("TabletopExerciseDraft: Throttling participant load.");
      return;
    }

    setParticipantsLoading(true);
    try {
      const participantData = await CachedEntityManager.get(
        ExerciseParticipant,
        'filter',
        [{ exercise_id: exerciseId }],
        `participants_${exerciseId}`
      );
      setParticipants(participantData);
      lastParticipantsLoadRef.current = Date.now();
    } catch (error) {
      console.error("TabletopExerciseDraft: Error loading participants:", error);
      const msg = typeof error?.message === 'string' ? error.message : String(error);
      if (msg.includes("429") || msg.includes("rate limit")) {
        toast.warning("We're being rate limited. Retrying shortly...");
        // Retry gently after a short delay; throttle will still apply
        setTimeout(() => {
          lastParticipantsLoadRef.current = 0; // Reset ref to force next call to go through
          setParticipantsLoading(false); // Reset to allow next load attempt
          if (exerciseId) {
            loadParticipants(); // Trigger retry
          }
        }, 3000);
        return; 
      }
      toast.error("Failed to load participants: " + (msg || "Unknown error"));
    } finally {
      setParticipantsLoading(false);
    }
  }, [exerciseId, participantsLoading]); 

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (currentUser?.company_id) {
      BIA.filter({ company_id: currentUser.company_id }, "-updated_date", 20).then(list => setCompanyBias(list || []));
    }
  }, [currentUser]);

  // Effect to load participants once exerciseId and currentUser are available
  useEffect(() => {
    if (exerciseId && currentUser) {
      loadParticipants();
    }
  }, [loadParticipants, exerciseId, currentUser]);

  const handleDataChange = (updatedData) => {
    console.log("TabletopExerciseDraft: Data changed:", updatedData.exercise_name);
    setExerciseData(updatedData);
  };

  const handleSave = async (dataToSave) => {
    try {
      if (!currentUser?.company_id) {
        throw new Error("No company associated with your account");
      }

      console.log("TabletopExerciseDraft: Saving exercise...");

      // Deep copy to avoid mutating component state during the save process
      const exerciseToSave = JSON.parse(JSON.stringify(dataToSave));

      exerciseToSave.company_id = currentUser.company_id;
      exerciseToSave.facilitator_email = currentUser.email;

      // Stringify arrays before sending to the backend
      if (Array.isArray(exerciseToSave.scenarios)) {
        exerciseToSave.scenarios.forEach(scenario => {
          if (Array.isArray(scenario.injects)) {
            scenario.injects = JSON.stringify(scenario.injects);
          }
        });
        exerciseToSave.scenarios = JSON.stringify(exerciseToSave.scenarios);
      }

      // Removed old logic for stringifying exerciseToSave.participants
      // Participants are now managed via the ExerciseParticipant entity

      let savedExercise;
      if (exerciseToSave.id) {
        console.log("TabletopExerciseDraft: Updating existing exercise");
        savedExercise = await TabletopExercise.update(exerciseToSave.id, exerciseToSave);
        // Invalidate cache for this specific exercise after update
        CachedEntityManager.invalidate(`tte_${exerciseToSave.id}_${currentUser.company_id}`);
      } else {
        console.log("TabletopExerciseDraft: Creating new exercise");
        savedExercise = await TabletopExercise.create(exerciseToSave);
        setExerciseId(savedExercise.id); // Update exerciseId state if new exercise is created
      }

      console.log("TabletopExerciseDraft: Exercise saved successfully");

      // Update local state with the saved exercise ID
      setExerciseData(prev => ({ ...prev, id: savedExercise.id }));

      return savedExercise;
    } catch (error) {
      console.error("TabletopExerciseDraft: Error saving exercise:", error);
      throw error;
    }
  };

  const handleRetry = () => {
    setError(null);
    loadCurrentUser();
  };

  const handleAddParticipant = async () => {
    if (!newParticipant.participant_email || !newParticipant.participant_name) {
      toast.error("Email and name are required");
      return;
    }

    try {
      if (exerciseId) { // If exercise is already saved, add directly to backend
        const participantData = {
          ...newParticipant,
          exercise_id: exerciseId // Link participant to the current exercise
        };
        await ExerciseParticipant.create(participantData);
        toast.success("Participant added successfully");
        CachedEntityManager.invalidate(`participants_${exerciseId}`); // Invalidate cache
        // Force an immediate reload for user action feedback
        lastParticipantsLoadRef.current = 0; // Reset throttle
        await loadParticipants(); // Await to see changes immediately if possible
      } else {
        // If exercise not saved yet, add to local state with a temporary ID
        setParticipants(prev => [...prev, { ...newParticipant, id: Date.now() }]);
        toast.success("Participant added (will be saved when exercise is saved)");
      }

      // Reset form and close dialog
      setNewParticipant({
        participant_email: "",
        participant_name: "",
        role_title: "",
        functional_roles: [],
        systems_owned: "",
        contact_methods: ""
      });
      setShowAddParticipant(false);
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("Failed to add participant");
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    try {
      // Check if participantId is a string (meaning it's from the backend, having a real ID)
      if (typeof participantId === 'string' && exerciseId) {
        await ExerciseParticipant.delete(participantId);
        toast.success("Participant removed");
        CachedEntityManager.invalidate(`participants_${exerciseId}`); // Invalidate cache
        // Force an immediate reload for user action feedback
        lastParticipantsLoadRef.current = 0; // Reset throttle
        await loadParticipants(); // Await to see changes immediately if possible
      } else {
        // If not a string, it's a temporary local ID, or exerciseId is not present
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        toast.success("Participant removed from local list");
      }
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Failed to remove participant");
    }
  };


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Tabletop Exercise</h2>
          <p className="text-gray-400">Setting up your exercise workspace...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-red-500/30 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Unable to Load Exercise</h1>
          <p className="text-gray-400 mb-6">{error}</p>

          <div className="flex flex-col gap-3">
            <Button onClick={handleRetry} className="bg-gradient-to-r from-cyan-500 to-purple-500">
              Try Again
            </Button>
            <Link to={createPageUrl("ResponseReadiness")}>
              <Button variant="outline" className="w-full hover:bg-gray-800">
                Back to Command Center
              </Button>
            </Link>
          </div>

          {error.includes("Company setup incomplete") && (
            <p className="text-sm text-gray-500 mt-4">Redirecting to company setup in 3 seconds...</p>
          )}
        </div>
      </div>
    );
  }

  // Authentication check
  if (!currentUser) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please log in to continue with tabletop exercises.</p>
          <Button onClick={() => User.login()} className="bg-gradient-to-r from-cyan-500 to-purple-500">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // Render exercise detail and participant section if everything loaded successfully
  const handleExportPdf = async () => {
    const id = exerciseData.id || exerciseId;
    if (!id) { toast.error("Please save the exercise first before exporting."); return; }
    try {
      const { generateTabletopReportPdf } = await import("@/functions/generateTabletopReportPdf");
      const { data } = await generateTabletopReportPdf({ exerciseId: id });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exerciseData.exercise_name?.replace(/\s+/g, '_') || 'Tabletop_Exercise'}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleImportFromBia = (bia) => {
    const items = bia.bia_items ? JSON.parse(bia.bia_items) : [];
    const systemsList = items.map(i => i.inputs?.bia_process_name || i.name).filter(Boolean).join(", ");
    const rtoRpo = items.length > 0
      ? `\nRTO targets: ${items.map(i => i.result?.rtoHours ? `${i.inputs?.bia_process_name || 'Function'}: ${i.result.rtoHours}h` : null).filter(Boolean).join(", ")}`
      : "";
    setExerciseData(prev => ({
      ...prev,
      critical_systems_scope: [prev.critical_systems_scope, systemsList].filter(Boolean).join("\n"),
      business_context: [prev.business_context, `Imported from BIA: ${bia.title}. Scope: ${bia.scope || "—"}.${rtoRpo}`].filter(Boolean).join("\n"),
    }));
    setShowBiaImport(false);
    toast.success(`Imported critical functions from "${bia.title}"`);
  };

  return (
    <div className="min-h-screen">
      {/* BIA Import Banner */}
      {companyBias.length > 0 && !exerciseData.id && (
        <div className="bg-slate-800/80 border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            You have {companyBias.length} BIA record{companyBias.length > 1 ? "s" : ""} — import critical functions to pre-fill this exercise.
          </div>
          <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10" onClick={() => setShowBiaImport(true)}>
            Import from BIA
          </Button>
        </div>
      )}

      {/* BIA Import Dialog */}
      <Dialog open={showBiaImport} onOpenChange={setShowBiaImport}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Critical Systems from BIA</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm mb-4">Select a BIA to import its critical functions and RTO/RPO data into this exercise.</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {companyBias.map(bia => {
              const items = bia.bia_items ? (() => { try { return JSON.parse(bia.bia_items); } catch { return []; } })() : [];
              return (
                <div key={bia.id} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700 hover:border-cyan-500/40">
                  <div>
                    <p className="text-white font-medium text-sm">{bia.title}</p>
                    <p className="text-gray-400 text-xs">{items.length} function(s) · {bia.scope || "No scope"}</p>
                  </div>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => handleImportFromBia(bia)}>
                    Import
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <TabletopExerciseDetail
        initialExerciseData={exerciseData}
        onDataChange={handleDataChange}
        onSave={handleSave}
        onExportPdf={handleExportPdf}
        currentUser={currentUser}
        externalParticipantsCount={participants.length}
      />

      <div className="p-4 md:p-8 lg:p-12 space-y-8 max-w-4xl mx-auto">
        {/* Participants Section */}
        <Card className="glass-effect border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-cyan-300 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Exercise Participants
                {participantsLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin text-cyan-400" />}
              </CardTitle>
              <Button
                onClick={() => setShowAddParticipant(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Participant
              </Button>
            </div>
            <p className="text-gray-400">
              Add team members who will participate in this tabletop exercise.
              {!exerciseId && <span className="italic text-yellow-300"> Participants added here will be saved when you first save the exercise details.</span>}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={participant.id || index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{participant.participant_name}</p>
                    <p className="text-gray-400 text-sm">{participant.participant_email}</p>
                    {participant.role_title && (
                      <p className="text-gray-400 text-sm">{participant.role_title}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-gray-500 text-center py-8">No participants added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Participant Dialog */}
        <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Add Exercise Participant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="participantEmail">Email *</Label>
                <Input
                  id="participantEmail"
                  value={newParticipant.participant_email}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, participant_email: e.target.value }))}
                  placeholder="participant@company.com"
                  className="bg-slate-800/50 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="participantName">Full Name *</Label>
                <Input
                  id="participantName"
                  value={newParticipant.participant_name}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, participant_name: e.target.value }))}
                  placeholder="John Doe"
                  className="bg-slate-800/50 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="roleTitle">Job Title</Label>
                <Input
                  id="roleTitle"
                  value={newParticipant.role_title}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, role_title: e.target.value }))}
                  placeholder="Security Analyst"
                  className="bg-slate-800/50 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="systemsOwned">Systems/Areas of Responsibility</Label>
                <Textarea
                  id="systemsOwned"
                  value={newParticipant.systems_owned}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, systems_owned: e.target.value }))}
                  placeholder="Network infrastructure, email security, HR systems..."
                  className="bg-slate-800/50 border-gray-600 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddParticipant(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddParticipant}>
                  Add Participant
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}