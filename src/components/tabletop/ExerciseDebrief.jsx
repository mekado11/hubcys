import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Sparkles,
  // CheckCircle, // Not used in new consolidated UI
  // AlertTriangle, // Not used in new consolidated UI
  Lightbulb, // Used for the consolidated debrief section
  Loader2,
  Download,
  Save
} from 'lucide-react';
import { InvokeLLM } from '@/integrations/Core';
import ReactMarkdown from 'react-markdown';

export default function ExerciseDebrief({ exerciseData, onUpdate, onSave, onExportPdf, onBack }) {
  // Renamed generatingDebrief to isGeneratingDebrief as per outline
  const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);

  // Consolidated all debrief content into a single state variable
  // Prioritize `aar_document` if it exists, falling back to `lessons_learned`
  const [debriefContent, setDebriefContent] = useState(
    exerciseData.aar_document || exerciseData.lessons_learned || ''
  );

  const generateSmartDebrief = async () => {
    // New pre-check from outline to ensure execution data exists
    if (!exerciseData.facilitator_observations && !exerciseData.participant_decisions) {
      alert('Please ensure the exercise has been executed with observations recorded before generating the debrief.');
      return;
    }

    setIsGeneratingDebrief(true);

    try {
      // Parse scenarios data, handling potential stringified JSON
      let scenarios = [];
      try {
        scenarios = exerciseData.scenarios ? JSON.parse(exerciseData.scenarios) : [];
      } catch (e) {
        console.error("Error parsing scenarios:", e);
        scenarios = []; // Fallback to empty array if parsing fails
      }
      const scenarioContext = scenarios.map(s => `${s.name}: ${s.details}`).join('\n\n');

      // Parse participants data, handling potential stringified JSON
      let participants = [];
      try {
        participants = exerciseData.participants ? JSON.parse(exerciseData.participants) : [];
      } catch (e) {
        console.error("Error parsing participants:", e);
        participants = []; // Fallback to empty array if parsing fails
      }
      const participantContext = participants.map(p => `${p.full_name} (${p.functional_roles?.join(', ')})`).join(', ') || 'Not specified';

      // Parse execution data, handling potential stringified JSON
      let executionDataContext = {};
      try {
        // Assuming 'execution_data' is the new field name replacing 'exercise_data' for execution logs
        executionDataContext = exerciseData.execution_data ? JSON.parse(exerciseData.execution_data) : {};
      } catch (e) {
        console.error("Error parsing execution_data:", e);
        executionDataContext = {}; // Fallback to empty object if parsing fails
      }

      // Build comprehensive prompt for AI based on outline
      const prompt = `You are conducting an After-Action Review (AAR) for a cybersecurity tabletop exercise. Generate a comprehensive, realistic debrief based ONLY on the actual exercise execution data provided.

EXERCISE CONTEXT:
Company: ${exerciseData.company_name || 'Not specified'}
Industry: ${exerciseData.industry_sector?.replace(/_/g, ' ') || 'Not specified'}
Exercise: ${exerciseData.exercise_name || 'Not specified'}
Participants: ${participantContext}
Critical Systems: ${exerciseData.critical_systems_scope || 'Not specified'}

SCENARIOS TESTED:
${scenarioContext || 'No scenarios specified'}

ACTUAL EXECUTION DATA (BASE YOUR ANALYSIS ON THIS):
Facilitator Observations: ${exerciseData.facilitator_observations || 'No observations recorded'}
Participant Decisions: ${exerciseData.participant_decisions || 'No decisions recorded'}
Communication Timeline: ${exerciseData.communication_timeline || 'No timeline recorded'}
Response Effectiveness: ${exerciseData.response_effectiveness || 'No effectiveness assessment'}
Exercise Duration: ${executionDataContext.total_duration_seconds ? Math.floor(executionDataContext.total_duration_seconds / 60) + ' minutes' : 'Not recorded'}

CRITICAL: Your analysis must be based ONLY on the execution data above. Do not fabricate or assume activities that were not recorded. If certain areas lack data, acknowledge this as a gap rather than inventing content.

Provide your analysis in the following format:

**STRENGTHS IDENTIFIED:**
- List specific strengths observed during the actual exercise execution
- Base these on the recorded observations and decisions
- If no clear strengths were recorded, state "Limited strength data recorded during execution"

**GAPS IDENTIFIED:**
- List specific gaps based on what was actually observed
- Include communication issues, process breakdowns, knowledge gaps noted by the facilitator
- If no clear gaps were recorded, state "Limited gap data recorded during execution"

**LESSONS LEARNED & ACTION ITEMS:**
- Specific, actionable lessons based on the real execution
- Concrete action items to address observed gaps
- Process improvements based on what actually happened

**EXERCISE EFFECTIVENESS ASSESSMENT:**
- How well did the exercise achieve its stated objectives based on execution?
- Data quality assessment (what was captured vs. what could be improved for future exercises)

Remember: This is a real debrief, not a hypothetical one. Only reference what actually happened during the exercise execution.`;

      const response = await InvokeLLM({
        prompt: prompt,
        feature: 'tabletop',
      });

      // Set the generated content to the single debriefContent state
      setDebriefContent(response);

      // Update the exercise data with the full generated debrief
      // Updating both for compatibility/future use
      onUpdate('lessons_learned', response);
      onUpdate('aar_document', response);

    } catch (error) {
      console.error('Error generating smart debrief:', error);
      alert('Failed to generate smart debrief. Please try again.');
    } finally {
      setIsGeneratingDebrief(false);
    }
  };

  const [exporting, setExporting] = useState(false);

  const saveDebrief = async () => {
    onUpdate('lessons_learned', debriefContent);
    onUpdate('aar_document', debriefContent);
    if (onSave) await onSave();
  };

  const handleExport = async () => {
    if (!onExportPdf) return;
    setExporting(true);
    try {
      await onExportPdf();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Generate Button */}
      <Card className="glass-effect border-orange-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-orange-300 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Post-Exercise Debrief / After-Action Review (AAR)
            </CardTitle>
            <Button
              onClick={generateSmartDebrief}
              disabled={isGeneratingDebrief}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isGeneratingDebrief ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Smart Debrief (AAR)
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Consolidated Debrief Section */}
      <Card className="glass-effect border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-300 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Full After-Action Review Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="debrief-content" className="text-gray-300 mb-2 block">
            Generated Debrief Content (Edit if needed)
          </Label>
          {debriefContent ? (
            // If content exists, display it as markdown for viewing
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{debriefContent}</ReactMarkdown>
            </div>
          ) : (
            // If no content, provide a Textarea for manual input or initial generation
            <Textarea
              id="debrief-content"
              value={debriefContent}
              onChange={(e) => setDebriefContent(e.target.value)}
              placeholder="Click 'Generate Smart Debrief' to create a comprehensive After-Action Review, or type your own AAR here. The AI-generated AAR will include sections for strengths, gaps, lessons learned, and action items."
              className="bg-slate-800/50 border-gray-600 text-white h-[400px]" // Increased height for a full document
            />
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="border-gray-600 text-gray-300 hover:bg-slate-700">
              ← Back to Execute
            </Button>
          )}
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={saveDebrief}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Debrief
          </Button>
          <Button
            variant="outline"
            className="border-cyan-500 text-cyan-300"
            onClick={handleExport}
            disabled={exporting || !onExportPdf}
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export PDF Report
          </Button>
        </div>
      </div>
    </div>
  );
}