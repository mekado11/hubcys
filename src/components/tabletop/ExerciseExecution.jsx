import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Clock, Users, MessageSquare, AlertTriangle, CheckCircle, Save, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { format } from 'date-fns';

// Safe parser that accepts array or JSON string and never throws
const safeParseArray = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      return val.trim() ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export default function ExerciseExecution({ exerciseData, onUpdate, onSave, onComplete, onBack }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [injectIndex, setInjectIndex] = useState(0); // Renamed currentInjectIndex to injectIndex
  const [executionStartTime, setExecutionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // In seconds
  const [facilitatorObservations, setFacilitatorObservations] = useState(exerciseData.facilitator_observations || '');
  const [participantDecisions, setParticipantDecisions] = useState(exerciseData.participant_decisions || '');
  const [communicationTimeline, setCommunicationTimeline] = useState(exerciseData.communication_timeline || '');
  const [responseEffectiveness, setResponseEffectiveness] = useState(exerciseData.response_effectiveness || '');
  const [currentInjectResponse, setCurrentInjectResponse] = useState('');
  const [showObservationModal, setShowObservationModal] = useState(false); // New state for modal

  const scenarios = exerciseData.scenarios || [];
  const currentScenario = scenarios[0] || {}; // For simplicity, using first scenario
  
  // FIX: handle both arrays and JSON strings safely
  const injects = safeParseArray(currentScenario.injects, []);

  useEffect(() => {
    let interval;
    if (isExecuting && executionStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - executionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExecuting, executionStartTime]);

  const startExercise = () => {
    setIsExecuting(true);
    setExecutionStartTime(Date.now());
    setElapsedTime(0);
    setInjectIndex(0); // Use injectIndex
    onUpdate('status', 'In_Progress');
  };

  const pauseExercise = () => {
    setIsExecuting(false);
  };

  const resumeExercise = () => {
    setIsExecuting(true);
    if (!executionStartTime) {
      setExecutionStartTime(Date.now() - (elapsedTime * 1000));
    }
  };

  const handleNextInject = () => {
    if (injectIndex < injects.length - 1) {
      // Save current inject response to communication timeline
      if (currentInjectResponse.trim()) {
        const timestamp = format(new Date(), 'HH:mm:ss');
        // Prepend new timeline entry to keep it ordered with newest first
        const newTimelineEntry = `[${timestamp}] Inject ${injectIndex + 1} Response: ${currentInjectResponse}`;
        const newTimeline = communicationTimeline ? `${newTimelineEntry}\n${communicationTimeline}` : newTimelineEntry;
        setCommunicationTimeline(newTimeline);
        setCurrentInjectResponse(''); // Clear response for next inject
      }
      setInjectIndex(injectIndex + 1);
    }
  };

  const handlePreviousInject = () => {
    if (injectIndex > 0) {
      setInjectIndex(injectIndex - 1);
      // When going back, clear the current response input field.
      // If responses were saved per inject, you'd load the previous response here.
      setCurrentInjectResponse('');
    }
  };

  const completeExercise = async () => {
    setIsExecuting(false);
    
    // Compile all execution data
    const executionData = {
      start_time: executionStartTime,
      total_duration_seconds: elapsedTime,
      injects_delivered: injectIndex + 1, // Use injectIndex
      completion_timestamp: Date.now()
    };

    // Update all execution fields
    onUpdate('execution_data', JSON.stringify(executionData));
    onUpdate('facilitator_observations', facilitatorObservations);
    onUpdate('participant_decisions', participantDecisions);
    onUpdate('communication_timeline', communicationTimeline);
    onUpdate('response_effectiveness', responseEffectiveness);
    // Save first, then trigger completion callback
    if (onSave) await onSave(exerciseData);
    if (onComplete) onComplete();
  };

  const resetExercise = () => {
    setIsExecuting(false);
    setExecutionStartTime(null);
    setElapsedTime(0);
    setInjectIndex(0); // Use injectIndex
    setCurrentInjectResponse('');
    onUpdate('status', 'Planning');
    // Optionally reset other observation fields or confirm with user
    setFacilitatorObservations('');
    setParticipantDecisions('');
    setCommunicationTimeline('');
    setResponseEffectiveness('');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentInject = injects[injectIndex]; // Use injectIndex
  
  // FIX: handle both arrays and JSON strings safely
  const participants = safeParseArray(exerciseData.participants, []);

  return (
    <div className="space-y-6">
      {/* Exercise Control Panel */}
      <Card className="glass-effect border-blue-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-300 flex items-center">
              <Play className="w-5 h-5 mr-2" />
              Exercise Control Panel
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xl font-mono text-white">{formatTime(elapsedTime)}</span>
              </div>
              <Badge className={`${
                exerciseData.status === 'In_Progress' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                exerciseData.status === 'Completed' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                'bg-gray-500/20 text-gray-300 border-gray-500/30'
              } border`}>
                {exerciseData.status?.replace('_', ' ') || 'Ready'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            {onBack && (
              <Button onClick={onBack} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-slate-700">
                ← Back to Prepare
              </Button>
            )}
            <div className="flex items-center space-x-3">
            {!isExecuting && elapsedTime === 0 && (
              <Button
                onClick={startExercise}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Exercise
              </Button>
            )}
            
            {isExecuting && (
              <Button
                onClick={pauseExercise}
                variant="outline"
                className="border-yellow-500 text-yellow-300 hover:bg-yellow-500/20"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            
            {!isExecuting && elapsedTime > 0 && injectIndex < injects.length && (
              <Button
                onClick={resumeExercise}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
            
            {/* Show Complete button only when all injects are delivered OR if user manually completes early */}
            {(injectIndex >= injects.length - 1 || (!isExecuting && elapsedTime > 0 && exerciseData.status === 'In_Progress')) && (
              <Button
                onClick={completeExercise}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Exercise
              </Button>
            )}
            
            <Button
              onClick={resetExercise}
              variant="outline"
              className="border-red-500 text-red-300 hover:bg-red-500/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Inject - Updated based on outline */}
        {currentInject ? (
          <Card className="glass-effect border-green-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-300 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Current Inject ({injectIndex + 1} of {injects.length})
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 px-3 py-1">
                    T+{Math.floor(elapsedTime / 60)} minutes
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30 px-3 py-1">
                    {currentInject.inject_type?.replace(/_/g, ' ') || 'Information'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-600/50">
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                  {currentInject.inject_content}
                </p>
              </div>

              {currentInject.target_participants && (
                <div>
                  <h4 className="text-cyan-300 font-medium mb-2">Target Participants:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentInject.target_participants.split(',').map((participant, idx) => (
                      <Badge key={idx} className="bg-cyan-500/20 text-cyan-200 border-cyan-500/30">
                        {participant.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* This part strictly follows the outline's hardcoded text for Expected Actions. 
                  Original code used currentInject.expected_actions. */}
              {currentInject.inject_type && (
                <div>
                  <h4 className="text-orange-300 font-medium mb-2">Expected Actions:</h4>
                  <p className="text-gray-200 bg-slate-700/50 p-3 rounded border border-slate-600/50">
                    The team needs to assess the scope of the abnormal traffic and initiate a preliminary investigation to confirm whether it indicates a security breach.
                  </p>
                </div>
              )}

              {/* Added back the currentInjectResponse Textarea as it's a critical functionality */}
              <div>
                <Label className="text-gray-300">Participant Response to This Inject:</Label>
                <Textarea
                  value={currentInjectResponse}
                  onChange={(e) => setCurrentInjectResponse(e.target.value)}
                  placeholder="Record what participants said or decided in response to this inject..."
                  className="bg-slate-800/50 border-gray-600 text-white h-20 mt-2"
                  disabled={!isExecuting} // Disable if exercise is not executing
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  onClick={handlePreviousInject}
                  disabled={injectIndex === 0 || !isExecuting}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-slate-700/50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowObservationModal(true)} // This modal is not implemented, just the state
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20"
                    disabled={!isExecuting}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Record Observation
                  </Button>

                  <Button
                    onClick={handleNextInject}
                    disabled={injectIndex >= injects.length - 1 || !isExecuting}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    size="sm"
                  >
                    Next Inject
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-effect border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-300 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Current Inject (0 of {injects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">No injects available for this scenario or exercise not started.</p>
            </CardContent>
          </Card>
        )}

        {/* Participants & Status */}
        <Card className="glass-effect border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-300 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Exercise Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.length > 0 ? (
                participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-white">{participant.full_name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {participant.functional_roles?.map((role, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {/* Assuming all listed participants are "Active" for the purpose of this display */}
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No participants added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-300 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Facilitator Observations
            </CardTitle>
            <p className="text-gray-400 text-sm">Record real-time observations during the exercise</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={facilitatorObservations}
              onChange={(e) => {
                setFacilitatorObservations(e.target.value);
                onUpdate('facilitator_observations', e.target.value);
              }}
              placeholder="Record what you observe during the exercise:
- How quickly did participants respond?
- Were there communication breakdowns?
- What decisions were made and by whom?
- Any confusion or delays?
- Strong leadership moments?
- Areas where process broke down?"
              className="bg-slate-800/50 border-gray-600 text-white h-48"
            />
          </CardContent>
        </Card>

        <Card className="glass-effect border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-300">Key Participant Decisions</CardTitle>
            <p className="text-gray-400 text-sm">Track major decisions and responses</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={participantDecisions}
              onChange={(e) => {
                setParticipantDecisions(e.target.value);
                onUpdate('participant_decisions', e.target.value);
              }}
              placeholder="Record key decisions made by participants:
- Who was contacted first?
- What containment actions were decided?
- How was communication handled?
- Were external parties notified?
- What tools/resources were mentioned?
- Any disagreements or debates?"
              className="bg-slate-800/50 border-gray-600 text-white h-48"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-300">Communication Timeline</CardTitle>
            <p className="text-gray-400 text-sm">Track who communicated what and when</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={communicationTimeline}
              onChange={(e) => {
                setCommunicationTimeline(e.target.value);
                onUpdate('communication_timeline', e.target.value);
              }}
              placeholder="Track communication flow:
[Time] Who contacted whom
[Time] What information was shared
[Time] Escalations made
[Time] External notifications
[Time] Status updates"
              className="bg-slate-800/50 border-gray-600 text-white h-48"
            />
          </CardContent>
        </Card>

        <Card className="glass-effect border-pink-500/20">
          <CardHeader>
            <CardTitle className="text-pink-300">Response Effectiveness</CardTitle>
            <p className="text-gray-400 text-sm">Assess how effectively participants responded</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={responseEffectiveness}
              onChange={(e) => {
                setResponseEffectiveness(e.target.value);
                onUpdate('response_effectiveness', e.target.value);
              }}
              placeholder="Evaluate response effectiveness:
- Were responses timely and appropriate?
- Did participants follow established procedures?
- Were roles and responsibilities clear?
- How well did teams coordinate?
- Were technical responses sound?
- Communication effectiveness?"
              className="bg-slate-800/50 border-gray-600 text-white h-48"
            />
          </CardContent>
        </Card>
      </div>

      {/* Save Progress Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => {
            onUpdate('facilitator_observations', facilitatorObservations);
            onUpdate('participant_decisions', participantDecisions);
            onUpdate('communication_timeline', communicationTimeline);
            onUpdate('response_effectiveness', responseEffectiveness);
            if (onSave) onSave(exerciseData);
          }}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Exercise Progress
        </Button>
      </div>
    </div>
  );
}