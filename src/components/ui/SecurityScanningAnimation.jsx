import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Globe, 
  AlertTriangle, 
  Zap,
  Network,
  Bug,
  Database,
  Server,
  Brain,
  BarChart3,
  FileText,
  Target
} from 'lucide-react';

const scanPhases = [
  {
    name: "DNS Resolution",
    icon: Globe,
    description: "Resolving hostname to IP address",
    duration: 2000,
    color: "from-blue-500 to-cyan-500"
  },
  {
    name: "Port Discovery",
    icon: Network,
    description: "Scanning for open ports and services",
    duration: 4000,
    color: "from-cyan-500 to-teal-500"
  },
  {
    name: "Service Detection",
    icon: Server,
    description: "Identifying running services and versions",
    duration: 3000,
    color: "from-teal-500 to-green-500"
  },
  {
    name: "Vulnerability Analysis",
    icon: Bug,
    description: "Analyzing for known security vulnerabilities",
    duration: 5000,
    color: "from-green-500 to-yellow-500"
  },
  {
    name: "CVE Enrichment",
    icon: Database,
    description: "Enriching findings with CVE database",
    duration: 3000,
    color: "from-yellow-500 to-orange-500"
  },
  {
    name: "Risk Assessment",
    icon: AlertTriangle,
    description: "Calculating risk scores and priorities",
    duration: 2000,
    color: "from-orange-500 to-red-500"
  },
  {
    name: "Final Analysis",
    icon: Shield,
    description: "Compiling comprehensive security report",
    duration: 2000,
    color: "from-red-500 to-purple-500"
  }
];

const analysisPhases = [
  {
    name: "Data Processing",
    icon: Database,
    description: "Processing scan results and findings",
    duration: 2500,
    color: "from-blue-500 to-cyan-500"
  },
  {
    name: "Risk Correlation",
    icon: Target,
    description: "Correlating vulnerabilities with threat landscape",
    duration: 3000,
    color: "from-cyan-500 to-teal-500"
  },
  {
    name: "Impact Analysis",
    icon: BarChart3,
    description: "Analyzing business impact and criticality",
    duration: 3500,
    color: "from-teal-500 to-green-500"
  },
  {
    name: "AI Reasoning",
    icon: Brain,
    description: "Applying AI intelligence to security findings",
    duration: 4000,
    color: "from-green-500 to-yellow-500"
  },
  {
    name: "Recommendation Engine",
    icon: Zap,
    description: "Generating actionable security recommendations",
    duration: 3000,
    color: "from-yellow-500 to-orange-500"
  },
  {
    name: "Report Generation",
    icon: FileText,
    description: "Compiling comprehensive security analysis",
    duration: 2000,
    color: "from-orange-500 to-purple-500"
  }
];

export default function SecurityScanningAnimation({ 
  isScanning, 
  targetUrl, 
  onPhaseChange,
  mode = "scanning",
  totalDuration = 21000,
  correlateWithTotal = true
}) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [discoveredPorts, setDiscoveredPorts] = useState([]);
  const [vulnerabilityCount, setVulnerabilityCount] = useState(0);
  const [analysisInsights, setAnalysisInsights] = useState([]);
  const [scanStartTime, setScanStartTime] = useState(null);

  const phases = mode === "analysis" ? analysisPhases : scanPhases;
  const isAnalysisMode = mode === "analysis";

  // Correlate overall progress with elapsed real time to hit 100% at totalDuration
  useEffect(() => {
    if (!isScanning || !correlateWithTotal || !scanStartTime) return;

    const overallTimer = setInterval(() => {
      const elapsed = Date.now() - scanStartTime;
      const progress = Math.min(100, (elapsed / totalDuration) * 100);
      setOverallProgress(progress);
      if (progress >= 100) {
        clearInterval(overallTimer);
      }
    }, 50);

    return () => clearInterval(overallTimer);
  }, [isScanning, correlateWithTotal, totalDuration, scanStartTime]);

  useEffect(() => {
    if (!isScanning) {
      setCurrentPhase(0);
      setPhaseProgress(0);
      setOverallProgress(0);
      setDiscoveredPorts([]);
      setVulnerabilityCount(0);
      setAnalysisInsights([]);
      setScanStartTime(null);
      return;
    }

    setScanStartTime(Date.now());
    let phaseTimer;
    let progressTimer;

    const runPhase = (index) => {
      if (index >= phases.length || !isScanning) return;

      setCurrentPhase(index);
      setPhaseProgress(0);

      const phase = phases[index];
      const phaseStartTime = Date.now();
      
      // Simulate phase-specific activities
      if (!isAnalysisMode) {
        if (phase.name === "Port Discovery") {
          simulatePortDiscovery();
        } else if (phase.name === "Vulnerability Analysis") {
          simulateVulnerabilityDetection();
        }
      } else {
        if (phase.name === "Risk Correlation") {
          simulateAnalysisInsights();
        }
      }

      // Progress animation for current phase
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - phaseStartTime;
        const progress = Math.min((elapsed / phase.duration) * 100, 100);
        setPhaseProgress(progress);

        // Fallback overall progress when not correlating with total time
        if (!correlateWithTotal) {
          const completedPhases = index;
          const currentPhaseWeight = progress / 100;
          const overall = ((completedPhases + currentPhaseWeight) / phases.length) * 100;
          setOverallProgress(overall);
        }

        if (progress >= 100) {
          clearInterval(progressTimer);
        }
      }, 50);

      // Phase completion timer
      phaseTimer = setTimeout(() => {
        if (onPhaseChange) {
          onPhaseChange(phase.name, index + 1, phases.length);
        }
        runPhase(index + 1);
      }, phase.duration);
    };

    runPhase(0);

    return () => {
      clearTimeout(phaseTimer);
      clearInterval(progressTimer);
    };
  }, [isScanning, onPhaseChange, mode, correlateWithTotal]);

  const simulatePortDiscovery = () => {
    const commonPorts = [80, 443, 22, 25, 53, 110, 143, 993, 995, 3389, 21, 23];
    let portIndex = 0;

    const discoverPort = () => {
      if (portIndex < commonPorts.length && isScanning) {
        const port = commonPorts[portIndex];
        const isOpen = Math.random() > 0.7;
        if (isOpen) {
          setDiscoveredPorts(prev => [...prev, port]);
        }
        portIndex++;
        setTimeout(discoverPort, 200 + Math.random() * 300);
      }
    };

    setTimeout(discoverPort, 500);
  };

  const simulateVulnerabilityDetection = () => {
    let count = 0;
    const maxVulns = Math.floor(Math.random() * 8) + 2;

    const detectVuln = () => {
      if (count < maxVulns && isScanning) {
        count++;
        setVulnerabilityCount(count);
        setTimeout(detectVuln, 300 + Math.random() * 700);
      }
    };

    setTimeout(detectVuln, 800);
  };

  const simulateAnalysisInsights = () => {
    const insights = [
      "Correlating port exposure with known attack vectors...",
      "Analyzing service versions against CVE database...",
      "Assessing business impact of identified vulnerabilities...",
      "Evaluating compliance implications...",
      "Calculating risk priorities...",
      "Generating remediation roadmap..."
    ];

    let insightIndex = 0;

    const addInsight = () => {
      if (insightIndex < insights.length && isScanning) {
        setAnalysisInsights(prev => [...prev, insights[insightIndex]]);
        insightIndex++;
        setTimeout(addInsight, 400 + Math.random() * 600);
      }
    };

    setTimeout(addInsight, 600);
  };

  const formatElapsedTime = () => {
    if (!scanStartTime) return "00:00";
    const elapsed = Math.floor((Date.now() - scanStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isScanning) return null;

  const CurrentIcon = phases[currentPhase]?.icon || Shield;
  const currentGradient = phases[currentPhase]?.color || "from-blue-500 to-purple-500";

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8"
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
            {isAnalysisMode ? 'AI Security Analysis in Progress' : 'Deep Security Scan in Progress'}
          </h2>
          <p className="text-cyan-300 text-lg font-mono">{targetUrl}</p>
          <p className="text-gray-400 text-sm mt-2">Elapsed: {formatElapsedTime()}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 font-medium">Overall Progress</span>
            <span className="text-cyan-300 font-mono">{Math.round(overallProgress)}%</span>
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
              <CurrentIcon className="w-6 h-6 mr-3 text-cyan-400" />
              <div>
                <h3 className="text-white font-semibold">{phases[currentPhase]?.name}</h3>
                <p className="text-gray-400 text-sm">{phases[currentPhase]?.description}</p>
              </div>
            </div>
            <span className="text-cyan-300 font-mono">{Math.round(phaseProgress)}%</span>
          </div>
          
          <div className="w-full bg-slate-700 rounded-full h-2">
            <motion.div
              className={`h-full bg-gradient-to-r ${currentGradient} rounded-full`}
              style={{ width: `${phaseProgress}%` }}
            />
          </div>
        </div>

        <div className={`grid ${isAnalysisMode ? 'grid-cols-6' : 'grid-cols-7'} gap-2 mb-8`}>
          {phases.map((phase, index) => {
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
                    ? 'bg-cyan-500/20 border-cyan-500/50' 
                    : 'bg-slate-700/50 border-slate-600/50'
                }`}
                animate={isCurrent ? { 
                  borderColor: ["rgba(6, 182, 212, 0.5)", "rgba(6, 182, 212, 1)", "rgba(6, 182, 212, 0.5)"]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${
                  isCompleted ? 'text-green-400' : isCurrent ? 'text-cyan-400' : 'text-gray-500'
                }`} />
                <span className={`text-xs ${
                  isCompleted ? 'text-green-300' : isCurrent ? 'text-cyan-300' : 'text-gray-500'
                }`}>
                  {phase.name.split(' ')[0]}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!isAnalysisMode ? (
            <>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <Network className="w-4 h-4 mr-2 text-green-400" />
                  Open Ports ({discoveredPorts.length})
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  <AnimatePresence>
                    {discoveredPorts.map((port) => (
                      <motion.div
                        key={port}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-green-300 text-sm font-mono flex items-center"
                      >
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                        Port {port}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <Bug className="w-4 h-4 mr-2 text-orange-400" />
                  Vulnerabilities Found
                </h4>
                <div className="flex items-center">
                  <motion.div
                    key={vulnerabilityCount}
                    initial={{ scale: 1.5, color: "#f59e0b" }}
                    animate={{ scale: 1, color: "#fb923c" }}
                    className="text-3xl font-bold text-orange-400 mr-3"
                  >
                    {vulnerabilityCount}
                  </motion.div>
                  <div className="text-gray-400 text-sm">
                    {vulnerabilityCount > 0 ? 'Issues detected' : 'Scanning...'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-700/30 rounded-lg p-4 md:col-span-2">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-purple-400" />
                  AI Analysis Insights
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  <AnimatePresence>
                    {analysisInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-purple-300 text-sm flex items-center"
                      >
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse" />
                        {insight}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400/20 rounded-full"
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