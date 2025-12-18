
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Target, CheckCircle, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AssessmentOnboardingDialog({ isOpen, onProceed, isLoading }) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-cyan-300 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            Welcome to Security Assessments
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Your comprehensive cybersecurity evaluation toolkit
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* What You'll Get */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                What You'll Get
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                  <p><strong>Smart Analysis:</strong> AI-powered insights tailored to your industry and compliance needs</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                  <p><strong>Executive Reports:</strong> Professional documentation for leadership and stakeholders</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                  <p><strong>Action Items:</strong> Prioritized, time-bound remediation plans with effort estimates</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                  <p><strong>Framework Alignment:</strong> Direct mapping to NIST, ISO 27001, SOC 2, and more</p>
                </div>
              </div>
            </div>

            {/* How It Works (Previous Content) */}
            <div className="space-y-6"> {/* Added a div to group these for the second column */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                  <span className="text-xl font-bold text-cyan-400">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-lg mb-1">Start with a Framework</h4>
                  <p className="text-gray-300">
                    Your assessment is linked to a compliance framework (e.g., NIST, SOC2, ISO 27001). To begin, select an existing framework from the dropdown menu.
                  </p>
                  <p className="text-gray-300 mt-2">
                    If you're starting a new initiative, click the <b className="text-cyan-400">"+ New Framework"</b> button to create and name it first.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                  <span className="text-xl font-bold text-cyan-400">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-lg mb-1">Provide Detailed Information</h4>
                  <p className="text-gray-300">
                    All free-text boxes require detailed information. Our platform utilizes <b className="text-cyan-400">content-aware technology</b> to analyze your specific environment and provide robust, tailored recommendations.
                  </p>
                  <p className="text-gray-300 mt-2">
                    The more detail you provide about your tools, processes, and challenges, the more accurate your final report will be.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button
            onClick={onProceed}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up your workspace...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start My First Assessment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
