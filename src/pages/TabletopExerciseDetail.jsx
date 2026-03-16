import React, { useState, useEffect } from "react";
// Kept Link in case it's used internally by createPageUrl or other components, though not directly in this file's JSX header anymore.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Save,
  Users,
  Building,
  Target,
  Sparkles,
  Play,
  Plus,
  X,
  Trash2,
  Loader2,
  BarChart2
} from "lucide-react";
import { useAutoSave } from '../components/hooks/useAutoSave';
import ParticipantManager from '../components/tabletop/ParticipantManager';
import ExerciseExecution from '../components/tabletop/ExerciseExecution';
import ExerciseDebrief from '../components/tabletop/ExerciseDebrief';
import { InvokeLLM } from "@/integrations/Core";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createPageUrl } from '@/utils'; // Changed path from @/lib/utils to @/utils
import BreadcrumbNavigation from '../components/ui/BreadcrumbNavigation'; // Added BreadcrumbNavigation import

// Helper function to safely parse JSON strings
const safeJsonParse = (jsonString, defaultValue = []) => {
  if (typeof jsonString === 'object' && jsonString !== null) {
    return jsonString;
  }
  if (typeof jsonString !== 'string' || !jsonString.trim()) {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON parse error:", error, "on string:", jsonString);
    return defaultValue;
  }
};

// Simple UUID generator function
const generateId = () => {
  return 'id-' + Math.random().toString(36).substr(2, 16);
};

export default function TabletopExerciseDetail({
  initialExerciseData = {},
  onDataChange,
  onSave,
  onExportPdf,
  currentUser,
  externalParticipantsCount = 0
}) {
  const [exerciseData, setExerciseData] = useState(() => {
    console.log("TabletopExerciseDetail: Initializing with data:", initialExerciseData.exercise_name);

    const initialData = initialExerciseData ? { ...initialExerciseData } : {};

    // Safely parse scenarios and their nested injects
    let scenarios = safeJsonParse(initialData.scenarios, []);
    if (Array.isArray(scenarios)) {
      scenarios = scenarios.map(scenario => ({
        ...scenario,
        id: scenario.id || generateId(),
        injects: safeJsonParse(scenario.injects, [])
      }));
    } else {
      scenarios = [];
    }
    initialData.scenarios = scenarios;

    // Ensure status is set for new exercises
    if (!initialData.status) {
      initialData.status = 'Planning';
    }

    return initialData;
  });

  // State for parsed participants, managed separately for direct array manipulation
  const [parsedParticipants, setParsedParticipants] = useState(() =>
    safeJsonParse(exerciseData.participants, [])
  );

  const [saving, setSaving] = useState(false);
  const [scenarioSuggestions, setScenarioSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);

  // Auto-save the exercise data
  useAutoSave('tabletopExerciseDraft', exerciseData);

  // Update parsedParticipants if exerciseData.participants changes from external source or initial load
  useEffect(() => {
    setParsedParticipants(safeJsonParse(exerciseData.participants, []));
  }, [exerciseData.participants]);

  // Sync with parent component data changes
  useEffect(() => {
    if (initialExerciseData && Object.keys(initialExerciseData).length > 0) {
      console.log("TabletopExerciseDetail: Syncing with parent data:", initialExerciseData.exercise_name);
      setExerciseData(prevData => {
        // Only update if there are meaningful changes to prevent infinite loops or unnecessary re-renders
        if (JSON.stringify(prevData) !== JSON.stringify(initialExerciseData)) {
          return { ...initialExerciseData };
        }
        return prevData;
      });
    }
  }, [initialExerciseData]);


  const updateExerciseData = (field, value) => {
    console.log(`TabletopExerciseDetail: Updating ${field}`);

    const updatedData = {
      ...exerciseData,
      [field]: value
    };

    setExerciseData(updatedData);

    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateExerciseData(name, value);
  };

  const handleParticipantsChange = (participants) => {
    console.log("TabletopExerciseDetail: Participants changed:", participants.length);

    // Convert participants array to JSON string for storage
    const participantsJson = JSON.stringify(participants);
    updateExerciseData('participants', participantsJson);

    // Update the parsed participants for immediate UI feedback
    setParsedParticipants(participants);

    // Check if we should advance status
    // Only advance if currently 'Planning' and participants are added
    if (participants.length > 0 && exerciseData.status === 'Planning') {
      console.log("TabletopExerciseDetail: Auto-advancing status to Ready_to_Execute");
      // Use the new handleStatusChange to ensure auto-save and validation
      handleStatusChange('Ready_to_Execute');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("TabletopExerciseDetail: Saving exercise data");

      if (onSave) {
        const savedExercise = await onSave(exerciseData);
        console.log("TabletopExerciseDetail: Exercise saved successfully");

        // Update local state with saved data (e.g., if ID is new)
        if (savedExercise) {
          setExerciseData(prev => ({ ...prev, ...savedExercise }));
        }
      }
    } catch (error) {
      console.error("TabletopExerciseDetail: Error saving exercise:", error);
      alert("Failed to save exercise. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Helper: effective participant count (local json participants vs external entity participants)
  const getParticipantsCount = () => {
    const localCount = Array.isArray(parsedParticipants) ? parsedParticipants.length : 0;
    const externalCount = Number(externalParticipantsCount) || 0;
    return Math.max(localCount, externalCount);
  };

  const handleStatusChange = async (newStatus) => {
    console.log("TabletopExerciseDetail: Changing status to", newStatus);

    const currentStatus = exerciseData.status; // Store current status to revert on error

    // Validation before status change
    if (newStatus === 'Ready_to_Execute' && getParticipantsCount() === 0) {
      alert("Please add at least one participant before proceeding.");
      return;
    }

    if (newStatus === 'In_Progress') {
      const scenarios = safeJsonParse(exerciseData.scenarios, []);
      if (!exerciseData.exercise_name || exerciseData.exercise_name.trim() === '') {
        alert("Please provide an exercise name.");
        return;
      }
      if (scenarios.length === 0) {
        alert("Please add at least one scenario before starting the exercise.");
        return;
      }
      if (getParticipantsCount() === 0) {
        alert("Please add at least one participant before starting the exercise.");
        return;
      }
      // Add scheduled_date validation here if it's a required field for In_Progress
      // if (!exerciseData.scheduled_date) {
      //   alert("Please set a scheduled date before starting the exercise.");
      //   return;
      // }
    }

    // Only update and save if validation passes
    const updatedData = { ...exerciseData, status: newStatus };
    setExerciseData(updatedData); // Update local state immediately

    // Auto-save when status changes
    if (onSave) {
      try {
        setSaving(true);
        await onSave(updatedData); // Save the updated state
        console.log("TabletopExerciseDetail: Status change saved successfully");
      } catch (error) {
        console.error("TabletopExerciseDetail: Error saving status change:", error);
        setExerciseData(prev => ({ ...prev, status: currentStatus })); // Revert on save error
        alert("Failed to save status change. Please try again.");
      } finally {
        setSaving(false);
      }
    }
  };

  const generateScenarioSuggestions = async () => {
    if (!exerciseData.company_name || !exerciseData.industry_sector) {
      alert("Please fill in company name and industry sector first to get personalized suggestions.");
      return;
    }

    setLoadingSuggestions(true);
    try {
      const prompt = `Generate 4 realistic tabletop exercise scenarios for a ${exerciseData.company_size || 'medium-sized'} ${exerciseData.industry_sector?.replace('_', ' ')} company called "${exerciseData.company_name}".

Consider their business context: ${exerciseData.business_context || 'Standard business operations'}
Critical systems in scope: ${exerciseData.critical_systems_scope || 'Standard IT infrastructure'}

For each scenario, provide:
1. A compelling scenario name that's specific to their industry and context
2. The scenario type (e.g., "Ransomware", "Data Breach", "Insider Threat", "Supply Chain", "DDoS", "Physical Security")
3. A detailed rationale explaining why this scenario is particularly relevant to their organization and industry
4. Key systems, processes, or business functions that would be at risk
5. Specific challenges this scenario would present to their organization

Return the response as a JSON object with this structure:
{
  "scenarios": [
    {
      "name": "Scenario Name",
      "scenario_type": "Type",
      "rationale": "Why this scenario is critical for this organization...",
      "key_risks": "Systems/processes at risk..."
    }
  ]
}

Make the scenarios realistic, industry-specific, and challenging but not overwhelming.`;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  scenario_type: { type: "string" },
                  rationale: { type: "string" },
                  key_risks: { type: "string" }
                },
                required: ["name", "scenario_type", "rationale", "key_risks"]
              }
            }
          },
          required: ["scenarios"]
        }
      });

      if (response && response.scenarios) {
        setScenarioSuggestions(response.scenarios);
      }
    } catch (error) {
      console.error("Error generating scenarios:", error);
      alert("Failed to generate scenario suggestions. Please try again.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addNewScenario = () => {
    const scenarios = safeJsonParse(exerciseData.scenarios, []);
    const newScenario = {
      id: generateId(),
      type: 'Ransomware',
      name: `Scenario ${scenarios.length + 1}`,
      details: '',
      injects: []
    };

    const updatedScenarios = [...scenarios, newScenario];
    updateExerciseData('scenarios', updatedScenarios);
    setActiveScenarioIndex(updatedScenarios.length - 1);
  };

  const addScenarioFromSuggestion = (suggestion) => {
    const scenarios = safeJsonParse(exerciseData.scenarios, []);
    const newScenario = {
      id: generateId(),
      type: suggestion.scenario_type || 'Custom',
      name: suggestion.name,
      details: `${suggestion.rationale}\n\nKey systems/processes at risk: ${suggestion.key_risks}`,
      injects: []
    };

    const updatedScenarios = [...scenarios, newScenario];
    updateExerciseData('scenarios', updatedScenarios);
    setActiveScenarioIndex(updatedScenarios.length - 1);

    // Don't auto-navigate to scenario tab, just remove from suggestions
    setScenarioSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
  };

  const updateScenario = (index, field, value) => {
    const scenarios = safeJsonParse(exerciseData.scenarios, []);
    const updatedScenarios = [...scenarios];
    updatedScenarios[index] = { ...updatedScenarios[index], [field]: value };
    updateExerciseData('scenarios', updatedScenarios);
  };

  const deleteScenario = (index) => {
    const scenarios = safeJsonParse(exerciseData.scenarios, []);
    const updatedScenarios = scenarios.filter((_, i) => i !== index);
    updateExerciseData('scenarios', updatedScenarios);
    if (activeScenarioIndex >= updatedScenarios.length) {
      setActiveScenarioIndex(Math.max(0, updatedScenarios.length - 1));
    }
  };

  const addInjectToScenario = (scenarioIndex) => {
    const scenarios = safeJsonParse(exerciseData.scenarios, []);
    const updatedScenarios = [...scenarios];
    const currentInjects = safeJsonParse(updatedScenarios[scenarioIndex].injects, []);

    const newInject = {
      id: generateId(),
      sequence: currentInjects.length + 1,
      type: 'Information_Update',
      content: '',
      timing: '5 minutes',
      target_roles: []
    };

    updatedScenarios[scenarioIndex].injects = [...currentInjects, newInject];
    updateExerciseData('scenarios', updatedScenarios);
  };

  const updateInject = (scenarioIndex, injectIndex, field, value) => {
    const scenarios = safeJsonParse(exerciseData.scenarios, []);
    const updatedScenarios = [...scenarios];
    const injects = safeJsonParse(updatedScenarios[scenarioIndex].injects, []);
    const updatedInjects = [...injects];
    updatedInjects[injectIndex] = { ...updatedInjects[injectIndex], [field]: value };
    updatedScenarios[scenarioIndex].injects = updatedInjects;
    updateExerciseData('scenarios', updatedScenarios);
  };

  const deleteInject = (scenarioIndex, injectIndex) => {
    const scenarios = safeJsonParse(exerciseData.scenarios, []);
    const updatedScenarios = [...scenarios];
    const injects = safeJsonParse(updatedScenarios[scenarioIndex].injects, []);
    const updatedInjects = injects.filter((_, i) => i !== injectIndex);
    updatedScenarios[scenarioIndex].injects = updatedInjects;
    updateExerciseData('scenarios', updatedScenarios);
  };

  const renderPlanningTab = () => (
    <div className="space-y-8">
      <Card className="glass-effect border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-300 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Exercise Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="exercise_name">Exercise Name *</Label>
              <Input
                id="exercise_name"
                name="exercise_name"
                value={exerciseData.exercise_name || ""}
                onChange={handleInputChange}
                placeholder="e.g., Q3 2024 Ransomware Response Exercise"
                className="bg-slate-800/50 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={exerciseData.company_name || ""}
                onChange={handleInputChange}
                placeholder="Organization name"
                className="bg-slate-800/50 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="exercise_description">Exercise Description</Label>
            <Textarea
              id="exercise_description"
              name="exercise_description"
              value={exerciseData.exercise_description || ""}
              onChange={handleInputChange}
              placeholder="Describe the objectives and scope of this tabletop exercise..."
              className="bg-slate-800/50 border-gray-600 text-white h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="industry_sector">Industry Sector</Label>
              <Select
                value={exerciseData.industry_sector || ""}
                onValueChange={(value) => updateExerciseData('industry_sector', value)}
              >
                <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Financial_Services">Financial Services</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Energy">Energy & Utilities</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="company_size">Company Size</Label>
              <Select
                value={exerciseData.company_size || ""}
                onValueChange={(value) => updateExerciseData('company_size', value)}
              >
                <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  <SelectItem value="Small_1-50">Small (1-50 employees)</SelectItem>
                  <SelectItem value="Medium_51-500">Medium (51-500 employees)</SelectItem>
                  <SelectItem value="Large_501-2000">Large (501-2000 employees)</SelectItem>
                  <SelectItem value="Enterprise_2000+">Enterprise (2000+ employees)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="critical_systems_scope">Critical Systems & Infrastructure</Label>
            <Textarea
              id="critical_systems_scope"
              name="critical_systems_scope"
              value={exerciseData.critical_systems_scope || ""}
              onChange={handleInputChange}
              placeholder="Describe the critical systems, applications, and infrastructure that will be in scope for this exercise..."
              className="bg-slate-800/50 border-gray-600 text-white h-24"
            />
          </div>

          <div>
            <Label htmlFor="business_context">Business Context & Dependencies</Label>
            <Textarea
              id="business_context"
              name="business_context"
              value={exerciseData.business_context || ""}
              onChange={handleInputChange}
              placeholder="Additional business context, key processes, dependencies, and operational considerations..."
              className="bg-slate-800/50 border-gray-600 text-white h-24"
            />
          </div>
          <div className="flex justify-end mt-8">
            <Button
              onClick={() => handleStatusChange('Ready_to_Execute')}
              disabled={saving || !exerciseData.exercise_name || exerciseData.exercise_name.trim() === ''}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Next: Prepare Exercise
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderScenariosTab = () => {
    const scenarios = safeJsonParse(exerciseData.scenarios, []);

    return (
      <div className="space-y-8">
        {/* Suggested Scenarios Section */}
        <Card className="glass-effect border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Suggested Scenarios for Your Industry
              </div>
              <Button
                onClick={generateScenarioSuggestions}
                disabled={loadingSuggestions || !exerciseData.company_name || !exerciseData.industry_sector}
                className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get Suggestions
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSuggestions && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Generating personalized scenarios...</p>
              </div>
            )}

            {!loadingSuggestions && scenarioSuggestions.length === 0 && (
              <p className="text-gray-400 text-center py-4">
                Fill in company details and click "Get Suggestions" to see personalized scenarios for your organization.
              </p>
            )}

            {scenarioSuggestions.length > 0 && (
              <div className="space-y-4">
                {scenarioSuggestions.map((suggestion, index) => (
                  <div key={index} className="border border-gray-600/50 rounded-lg p-4 bg-slate-700/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{suggestion.name}</h4>
                        <Badge className="bg-purple-500/20 text-purple-300 mb-2">{suggestion.scenario_type}</Badge>
                        <p className="text-gray-300 text-sm mb-2">{suggestion.rationale}</p>
                        <p className="text-gray-400 text-sm">
                          <strong>Key risks:</strong> {suggestion.key_risks}
                        </p>
                      </div>
                      <Button
                        onClick={() => addScenarioFromSuggestion(suggestion)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white ml-4"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise Scenarios */}
        <Card className="glass-effect border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-purple-300 flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Exercise Scenarios
              </div>
              <Button onClick={addNewScenario} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Scenario
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scenarios.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No scenarios created yet. Click "Add Scenario" or use the suggestions above to get started.
              </p>
            ) : (
              <Accordion type="single" collapsible value={activeScenarioIndex.toString()} onValueChange={(value) => setActiveScenarioIndex(parseInt(value) || 0)}>
                {scenarios.map((scenario, scenarioIndex) => (
                  <AccordionItem key={scenario.id || scenarioIndex} value={scenarioIndex.toString()}>
                    <AccordionTrigger className="text-white hover:text-cyan-300">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>{scenario.name || `Scenario ${scenarioIndex + 1}`}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-500/20 text-purple-300">{scenario.type}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteScenario(scenarioIndex);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Scenario Name</Label>
                            <Input
                              value={scenario.name || ""}
                              onChange={(e) => updateScenario(scenarioIndex, 'name', e.target.value)}
                              placeholder="Scenario name"
                              className="bg-slate-800/50 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label>Scenario Type</Label>
                            <Select
                              value={scenario.type || ""}
                              onValueChange={(value) => updateScenario(scenarioIndex, 'type', value)}
                            >
                              <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-gray-600">
                                <SelectItem value="Ransomware">Ransomware</SelectItem>
                                <SelectItem value="Data_Breach">Data Breach</SelectItem>
                                <SelectItem value="Insider_Threat">Insider Threat</SelectItem>
                                <SelectItem value="Supply_Chain">Supply Chain Attack</SelectItem>
                                <SelectItem value="DDoS">DDoS Attack</SelectItem>
                                <SelectItem value="Physical_Security">Physical Security</SelectItem>
                                <SelectItem value="Social_Engineering">Social Engineering</SelectItem>
                                <SelectItem value="System_Outage">System Outage</SelectItem>
                                <SelectItem value="Natural_Disaster">Natural Disaster</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Scenario Details</Label>
                          <Textarea
                            value={scenario.details || ""}
                            onChange={(e) => updateScenario(scenarioIndex, 'details', e.target.value)}
                            placeholder="Describe the scenario in detail..."
                            className="bg-slate-800/50 border-gray-600 text-white h-32"
                          />
                        </div>

                        {/* Injects Section */}
                        <div className="border-t border-gray-600/50 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-cyan-300">Injects</h4>
                            <Button
                              onClick={() => addInjectToScenario(scenarioIndex)}
                              size="sm"
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Inject
                            </Button>
                          </div>

                          {safeJsonParse(scenario.injects, []).map((inject, injectIndex) => (
                            <div key={inject.id || injectIndex} className="mb-4 p-4 border border-gray-600/30 rounded-lg bg-slate-800/30">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                                    {inject.type?.replace(/_/g, ' ') || 'Information Update'}
                                  </Badge>
                                  <span className="text-sm text-gray-400">#{inject.sequence || injectIndex + 1}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteInject(scenarioIndex, injectIndex)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <Select
                                  value={inject.type || ""}
                                  onValueChange={(value) => updateInject(scenarioIndex, injectIndex, 'type', value)}
                                >
                                  <SelectTrigger className="bg-slate-700/50 border-gray-600 text-white text-sm">
                                    <SelectValue placeholder="Inject type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-gray-600">
                                    <SelectItem value="Initial_Detection">Initial Detection</SelectItem>
                                    <SelectItem value="Information_Update">Information Update</SelectItem>
                                    <SelectItem value="Escalation">Escalation</SelectItem>
                                    <SelectItem value="External_Pressure">External Pressure</SelectItem>
                                    <SelectItem value="System_Status">System Status</SelectItem>
                                    <SelectItem value="Stakeholder_Query">Stakeholder Query</SelectItem>
                                    <SelectItem value="Media_Inquiry">Media Inquiry</SelectItem>
                                    <SelectItem value="Regulatory_Contact">Regulatory Contact</SelectItem>
                                    <SelectItem value="Technical_Finding">Technical Finding</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Input
                                  value={inject.timing || ""}
                                  onChange={(e) => updateInject(scenarioIndex, injectIndex, 'timing', e.target.value)}
                                  placeholder="Timing (e.g., 5 minutes)"
                                  className="bg-slate-700/50 border-gray-600 text-white text-sm"
                                />
                              </div>

                              <Textarea
                                value={inject.content || ""}
                                onChange={(e) => updateInject(scenarioIndex, injectIndex, 'content', e.target.value)}
                                placeholder="Inject content - what information or challenge will you present to participants?"
                                className="bg-slate-700/50 border-gray-600 text-white text-sm h-20"
                              />
                            </div>
                          ))}

                          {safeJsonParse(scenario.injects, []).length === 0 && (
                            <p className="text-gray-400 text-sm text-center py-4 border border-dashed border-gray-600/50 rounded-lg">
                              No injects added yet. Click "Add Inject" to create timeline events for this scenario.
                            </p>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Helper to get status color for badge
  const getStatusColor = (status) => {
    switch (status) {
      case 'Planning': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Ready_to_Execute': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'In_Progress': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Archived': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Status steps for the progress indicator
  const statusSteps = [
    { key: 'Planning', label: 'Plan', icon: Building },
    { key: 'Ready_to_Execute', label: 'Prepare', icon: Users },
    { key: 'In_Progress', label: 'Execute', icon: Play },
    { key: 'Completed', label: 'Debrief', icon: BarChart2 },
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === exerciseData.status);
  };

  // Function to determine which component to render based on status
  const renderCurrentStep = () => {
    switch (exerciseData.status) {
      case 'Planning':
        return renderPlanningTab();
      case 'Ready_to_Execute':
        // Show scenarios and participants here
        return (
          <div className="space-y-8">
            {renderScenariosTab()}
            <Card className="glass-effect border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-300 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Exercise Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ParticipantManager
                  exerciseData={exerciseData}
                  onUpdate={updateExerciseData}
                  onParticipantsChange={handleParticipantsChange} // Pass the new handler
                />
              </CardContent>
            </Card>
            <div className="flex justify-end mt-8">
              <Button
                onClick={() => handleStatusChange('In_Progress')}
                disabled={
                  saving ||
                  !exerciseData.exercise_name ||
                  exerciseData.exercise_name.trim() === '' ||
                  safeJsonParse(exerciseData.scenarios, []).length === 0
                }
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Exercise
              </Button>
            </div>
          </div>
        );
      case 'In_Progress':
        return <ExerciseExecution exerciseData={exerciseData} onUpdate={updateExerciseData} currentUser={currentUser} onComplete={() => handleStatusChange('Completed')} />;
      case 'Completed':
        return <ExerciseDebrief exerciseData={exerciseData} onUpdate={updateExerciseData} currentUser={currentUser} onSave={async () => { if (onSave) await onSave(exerciseData); }} onExportPdf={onExportPdf} />;
      case 'Archived': // Handle archived state if applicable
      default:
        return renderPlanningTab(); // Fallback to planning
    }
  };


  return (
    <div className="min-h-screen cyber-gradient font-sans text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with breadcrumb navigation */}
        <div className="mb-8">
          <BreadcrumbNavigation
            items={[
              { label: 'Command Center', href: createPageUrl('ResponseReadiness') },
              { label: exerciseData.exercise_name || 'Tabletop Exercise' }
            ]}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold cyber-text-glow">
                {exerciseData.exercise_name || 'Tabletop Exercise'}
              </h1>
              <p className="text-gray-400 mt-2">
                {exerciseData.exercise_description || 'Plan and execute incident response exercises'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(exerciseData.status)}>
                {exerciseData.status?.replace(/_/g, ' ') || 'Planning'}
              </Badge>
              {exerciseData.status === 'Completed' && onExportPdf && (
                <Button
                  onClick={onExportPdf}
                  variant="outline"
                  className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Status Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {statusSteps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  getCurrentStepIndex() >= index
                    ? 'border-cyan-500 bg-cyan-500 text-white'
                    : 'border-gray-600 bg-slate-800 text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                {index < statusSteps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 transition-colors ${
                    getCurrentStepIndex() > index ? 'bg-cyan-500' : 'bg-gray-600'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400 px-2">
            {statusSteps.map((step) => (
              <span key={step.key} className={
                exerciseData.status === step.key ? 'text-cyan-300 font-medium' : ''
              }>
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Content based on status */}
        <div className="min-h-[600px]">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
}