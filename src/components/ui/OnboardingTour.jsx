
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, BarChart3, TrendingUp, CheckCircle, ShieldCheck } from 'lucide-react';

const tourSteps = [
  {
    icon: ShieldCheck,
    title: 'Your Security Dashboard',
    content: 'This is your mission control for monitoring your organization\'s security posture. Here you can see key stats at a glance.',
  },
  {
    icon: BarChart3,
    title: 'Maturity & Trends',
    content: 'These charts give you a visual breakdown of your security maturity across different domains and track your improvement over time.',
  },
  {
    icon: CheckCircle,
    title: 'Assessments & Action Items',
    content: 'Review your recent assessments and track the prioritized action items generated to improve your security.',
  },
  {
    icon: Rocket,
    title: 'You\'re Ready to Go!',
    content: 'You have everything you need to start strengthening your security. Begin by starting a new assessment or reviewing your action items.',
  },
];

export default function OnboardingTour({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(0); // 0 is the initial welcome screen

  if (!isOpen) return null;

  const handleStart = () => {
    setStep(1);
  };

  const handleNext = () => {
    if (step < tourSteps.length) {
      setStep(prev => prev + 1);
    }
  };

  // SECURITY FIX: Use sessionStorage instead of localStorage for UI state
  const handleComplete = () => {
    sessionStorage.setItem('onboardingTourCompleted', 'true');
    onComplete(); // Call the external onComplete prop
    onClose();    // Close the tour UI
  };

  // SECURITY FIX: Use sessionStorage instead of localStorage for UI state
  const handleSkip = () => {
    sessionStorage.setItem('onboardingTourCompleted', 'true');
    onClose();
  };

  const CurrentIcon = step > 0 ? tourSteps[step - 1].icon : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-slate-900/90 border border-cyan-500/30 rounded-2xl w-full max-w-md max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
      >
        <button onClick={handleSkip} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 text-center"
              >
                <div className="flex justify-center mb-6">
                   <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/27b05ae20_fortigap.png" 
                      alt="Hubcys Logo" 
                      className="w-20 h-20 object-contain"
                    />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Welcome to Hubcys</h2>
                <p className="text-gray-400 mb-8">
                  Let's begin with a quick tour to get you started on your cybersecurity journey.
                </p>
                <Button
                  onClick={handleStart}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 cyber-glow"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Tour
                </Button>
              </motion.div>
            )}

            {step > 0 && (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="p-8"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-cyan-500/20 flex items-center justify-center">
                    <CurrentIcon className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white text-center mb-3">{tourSteps[step - 1].title}</h3>
                <p className="text-gray-400 text-center mb-8 min-h-[60px]">{tourSteps[step - 1].content}</p>
                
                <div className="flex gap-3">
                  {step > 1 && (
                    <Button
                      onClick={() => setStep(prev => prev - 1)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-1"
                    >
                      Back
                    </Button>
                  )}
                  
                  {step < tourSteps.length ? (
                    <Button
                      onClick={handleNext}
                      className="bg-slate-700/80 text-white hover:bg-slate-600/80 flex-1"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleComplete} // Changed from handleFinish to handleComplete
                      className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 cyber-glow flex-1"
                    >
                      Finish Tour
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 pb-6 flex-shrink-0">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step === index + 1 ? 'bg-cyan-400 scale-125' : 'bg-slate-600'
              }`}
            ></div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
