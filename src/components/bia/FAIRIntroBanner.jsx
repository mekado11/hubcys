import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, X, TrendingUp, DollarSign, Database, Cpu, BarChart3, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FAIRIntroBanner() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('biaIntroBannerDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('biaIntroBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-effect border-cyan-500/30 mb-6 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-purple-500 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white mb-1">
                  FAIR-Based Business Impact Analysis Engine
                </CardTitle>
                <p className="text-sm text-white/90 font-medium">
                  Powered by FortiGAP Intelligence Framework
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <p className="text-gray-300 leading-relaxed">
              Your Business Impact Analysis leverages the <strong className="text-white">FAIR (Factor Analysis of Information Risk)</strong> model — 
              the industry standard for quantifying cybersecurity risk in financial terms.
            </p>

            {/* How It Works Section */}
            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                How It Works
              </h3>
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-cyan-300 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">FAIR Metrics Display</h4>
                      <p className="text-sm text-gray-400">
                        Aggregates core FAIR metrics: <strong className="text-gray-300">ALE</strong> (Annualized Loss Expectancy), 
                        <strong className="text-gray-300"> SLE</strong> (Single Loss Expectancy), 
                        <strong className="text-gray-300"> LEF</strong> (Loss Event Frequency), and full risk distribution curves.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-300 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Breach Case Intelligence</h4>
                      <p className="text-sm text-gray-400">
                        Enriches analysis with real-world precedents from major incidents (Target, Equifax, Colonial Pipeline, 
                        Change Healthcare, SolarWinds, MGM Resorts).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-orange-500/20 hover:border-orange-500/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-300 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Enhanced BIA Summary</h4>
                      <p className="text-sm text-gray-400">
                        Generates dynamic, narrative-driven reports linking FAIR metrics to business context, 
                        control weaknesses, and AI-derived insights.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-green-500/20 hover:border-green-500/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-300 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">ComputeBIA Engine</h4>
                      <p className="text-sm text-gray-400 mb-2">
                        Performs end-to-end FAIR computation with:
                      </p>
                      <ul className="text-sm text-gray-400 space-y-1 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>CVE correlation via NVD and control weakness scoring</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>LEF derived from control maturity, exposure level, and external intelligence</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>SLE integrating downtime cost, data loss, regulatory fines, and reputational damage</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>ALE automatically calculated (LEF × SLE)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>Breach case matching for scenario realism</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-300 font-bold text-sm">5</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Benchmark Intelligence</h4>
                      <p className="text-sm text-gray-400">
                        AI-weighted calibration using seeded breach case studies to enhance accuracy and realism.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why It Matters Section */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg p-5 border border-cyan-500/30">
              <h3 className="text-xl font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Why It Matters
              </h3>
              <p className="text-gray-300 mb-3 leading-relaxed">
                FortiGAP's FAIR-based BIA turns <em className="text-cyan-300">qualitative risk</em> into <strong className="text-white">quantified business impact</strong> — 
                empowering CISOs, risk officers, and executives to:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <span><strong>Prioritize cybersecurity investments</strong> with ROI clarity</span>
                </li>
                <li className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Translate cyber exposure</strong> into monetary language</span>
                </li>
                <li className="flex items-start gap-2">
                  <Database className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                  <span><strong>Compare risk posture</strong> to global breach precedents</span>
                </li>
                <li className="flex items-start gap-2">
                  <Scale className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                  <span><strong>Justify compliance, insurance, and resilience decisions</strong> with data-backed confidence</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center pt-2">
              <Button 
                onClick={handleDismiss}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-6 text-lg cyber-glow"
              >
                Get Started with FAIR Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}