import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Brain, 
  Shield, 
  Users,
  Clock,
  AlertTriangle,
  Zap,
  Sparkles
} from 'lucide-react';

const generationPhases = [
  {
    name: "Analyzing Context",
    icon: Brain,
    description: "Processing company information and incident type",
    duration: 2000,
    color: "from-blue-500 to-cyan-500"
  },
  {
    name: "Structuring Response",
    icon: Shield,
    description: "Creating incident response framework",
    duration: 3000,
    color: "from-cyan-500 to-teal-500"
  },
  {
    name: "Defining Team Roles",
    icon: Users,
    description: "Identifying key personnel and responsibilities",
    duration: 2500,
    color: "from-teal-500 to-green-500"
  },
  {
    name: "Planning Response Phases",
    icon: Clock,
    description: "Outlining detection, containment, and recovery steps",
    duration: 4000,
    color: "from-green-500 to-yellow-500"
  },
  {
    name: "Setting Decision Points",
    icon: AlertTriangle,
    description: "Establishing escalation criteria and thresholds",
    duration: 2500,
    color: "from-yellow-500 to-orange-500"
  },
  {
    name: "Industry Customization",
    icon: Zap,
    description: "Tailoring recommendations for your industry",
    duration: 3000,
    color: "from-orange-500 to-red-500"
  },
  {
    name: "Final Assembly",
    icon: FileText,
    description: "Compiling comprehensive playbook document",
    duration: 2000,
    color: "from-red-500 to-purple-500"
  }
];

export default function PlaybookGenerationAnimation({ 
  isGenerating, 
  incidentType,
  onPhaseChange,
  totalDuration = 19000
}) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [insights, setInsights] = useState([]);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentPhase(0);
      setPhaseProgress(0);
      setOverallProgress(0);
      setInsights([]);
      setStartTime(null);
      return;
    }

    setStartTime(Date.now());
    let phaseTimer;
    let progressTimer;

    const runPhase = (index) => {
      if (index >= generationPhases.length || !isGenerating) return;

      setCurrentPhase(index);
      setPhaseProgress(0);

      const phase = generationPhases[index];
      const phaseStartTime = Date.now();
      
      // Add phase-specific insights
      setTimeout(() => {
        if (isGenerating) {
          const phaseInsights = [
            `Configuring ${incidentType} response protocols...`,
            `Identifying critical ${incidentType} indicators...`,
            `Setting up communication chains...`,
            `Establishing containment procedures...`,
            `Planning recovery workflows...`
          ];
          const randomInsight = phaseInsights[Math.floor(Math.random() * phaseInsights.length)];
          setInsights(prev => [...prev.slice(-3), randomInsight]);
        }
      }, 800);

      // Progress animation for current phase
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - phaseStartTime;
        const progress = Math.min((elapsed / phase.duration) * 100, 100);
        setPhaseProgress(progress);

        if (progress >= 100) {
          clearInterval(progressTimer);
        }
      }, 50);

      // Phase completion timer
      phaseTimer = setTimeout(() => {
        if (onPhaseChange) {
          onPhaseChange(phase.name, index + 1, generationPhases.length);
        }
        runPhase(index + 1);
      }, phase.duration);
    };

    // Overall progress based on real time
    const overallTimer = setInterval(() => {
      if (startTime) {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / totalDuration) * 100);
        setOverallProgress(progress);
        if (progress >= 100) {
          clearInterval(overallTimer);
        }
      }
    }, 50);

    runPhase(0);

    return () => {
      clearTimeout(phaseTimer);
      clearInterval(progressTimer);
      clearInterval(overallTimer);
    };
  }, [isGenerating, onPhaseChange, incidentType, totalDuration, startTime]);

  const formatElapsedTime = () => {
    if (!startTime) return "00:00";
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isGenerating) return null;

  const CurrentIcon = generationPhases[currentPhase]?.icon || FileText;
  const currentGradient = generationPhases[currentPhase]?.color || "from-blue-500 to-purple-500";

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotateY: [0, 180, 360]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-block mb-4"
          >
            <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${currentGradient} flex items-center justify-center`}>
              <CurrentIcon className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Generating {incidentType} Playbook
          </h2>
          <p className="text-purple-300 text-lg">AI-powered incident response guide</p>
          <p className="text-gray-400 text-sm mt-2">Elapsed: {formatElapsedTime()}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 font-medium">Overall Progress</span>
            <span className="text-purple-300 font-mono">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${currentGradient} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CurrentIcon className="w-6 h-6 mr-3 text-purple-400" />
              <div>
                <h3 className="text-white font-semibold">{generationPhases[currentPhase]?.name}</h3>
                <p className="text-gray-400 text-sm">{generationPhases[currentPhase]?.description}</p>
              </div>
            </div>
            <span className="text-purple-300 font-mono">{Math.round(phaseProgress)}%</span>
          </div>
          
          <div className="w-full bg-slate-700 rounded-full h-2">
            <motion.div
              className={`h-full bg-gradient-to-r ${currentGradient} rounded-full`}
              style={{ width: `${phaseProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-8">
          {generationPhases.map((phase, index) => {
            const Icon = phase.icon;
            const isCompleted = index < currentPhase;
            const isCurrent = index === currentPhase;

            return (
              <motion.div
                key={phase.name}
                className={`text-center p-3 rounded-lg border ${
                  isCompleted 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : isCurrent 
                    ? 'bg-purple-500/20 border-purple-500/50' 
                    : 'bg-slate-700/50 border-slate-600/50'
                }`}
                animate={isCurrent ? { 
                  borderColor: ["rgba(168, 85, 247, 0.5)", "rgba(168, 85, 247, 1)", "rgba(168, 85, 247, 0.5)"]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Icon className={`w-4 h-4 mx-auto mb-1 ${
                  isCompleted ? 'text-green-400' : isCurrent ? 'text-purple-400' : 'text-gray-500'
                }`} />
                <span className={`text-xs ${
                  isCompleted ? 'text-green-300' : isCurrent ? 'text-purple-300' : 'text-gray-500'
                }`}>
                  {phase.name.split(' ')[0]}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
            AI Processing Insights
          </h4>
          <div className="space-y-2 max-h-24 overflow-y-auto">
            <AnimatePresence>
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-purple-300 text-sm flex items-center"
                >
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse" />
                  {insight}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
              animate={{
                x: [0, Math.random() * 400, 0],
                y: [0, Math.random() * 300, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}