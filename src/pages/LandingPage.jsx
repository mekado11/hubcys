
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/entities/User';
import { ShieldCheck, ArrowRight, Target, FileText, BookOpen, TrendingUp, Quote, AlertTriangle, Gamepad2 } from 'lucide-react';

const FeatureCard = ({ icon, title, description, gradient }) => (
  <Card className="premium-feature-card group card-entrance">
    <CardContent className="p-4 sm:p-5 md:p-6 text-center h-full flex flex-col">
      <div className={`premium-feature-icon mb-3 sm:mb-4 md:mb-5 mx-auto bg-gradient-to-r ${gradient}`}>
        {React.cloneElement(icon, { className: "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" })}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-300 leading-relaxed flex-grow">{description}</p>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleGetStarted = () => {
    if (currentUser) {
      window.location.href = createPageUrl("Dashboard");
    } else {
      User.loginWithRedirect(window.location.origin + createPageUrl("CompanyOnboarding"));
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen refined-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-3 border-cyan-400 mx-auto mb-4 sm:mb-6"></div>
          <p className="text-gray-300 font-medium text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
      {/* Background image layer */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1534177616070-ef7dc1201aaa?auto=format&fit=crop&w=2400&q=80"
          alt=""
          loading="eager"
          className="w-full h-full object-cover opacity-[0.15]"
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-6 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0">
        </div>
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Reduced scale and added more bottom margin to prevent overlap */}
          <div className="relative inline-block mb-6 sm:mb-8 md:mb-12 lg:mb-14 transform origin-center scale-[1.25]">
            <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-800/40 to-slate-700/40 flex items-center justify-center border border-cyan-500/20 backdrop-blur-sm mx-auto">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686c4c7cddeaa31e94f721d6/3e69b2e7d_Hubcys.png"
                alt="Hubcys Logo"
                className="w-18 h-18 sm:w-28 sm:h-28 md:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute -inset-2 sm:-inset-3 md:-inset-4 lg:-inset-5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-xl sm:blur-2xl md:blur-3xl animate-pulse-slow"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4 md:mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Integrated Cybersecurity
            </span>
            <br />
            Management Platform
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto mb-5 sm:mb-6 md:mb-8 font-light px-4 sm:px-0">
            From security assessments and gap analysis to incident response and tabletop exercises.
            Get Smart insights, executive reports, and actionable remediation plans all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="premium-button group text-sm sm:text-base md:text-lg lg:text-xl px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 md:py-6 lg:py-8 h-auto w-full max-w-xs sm:max-w-sm md:max-w-none md:w-auto mx-4 sm:mx-0"
            >
              <span className="block sm:inline">{currentUser ? 'Go to Dashboard' : 'Start Your Security Journey'}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ml-2 sm:ml-3 transition-transform group-hover:translate-x-1" />
            </Button>

            <Link to={createPageUrl("PricingAndFeatures")} className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="premium-outline-button text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 h-auto w-full sm:w-auto"
              >
                Explore Features
              </Button>
            </Link>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 px-4">
            <span className="chip">28-day free trial</span>
            <span className="chip">No credit card required</span>
            <span className="chip">Enterprise-ready</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-cyan-200 to-purple-200 bg-clip-text text-transparent px-4 sm:px-0">
            Why Choose Hubcys?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
            <div className="text-center group px-4 sm:px-0">
              <div className="premium-icon-container mb-3 sm:mb-4 md:mb-5 mx-auto">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-white">Comprehensive Assessment</h3>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">Smart-powered security assessments that identify gaps, provide strategic recommendations, and create actionable roadmaps tailored to your organization.</p>
            </div>
            <div className="text-center group px-4 sm:px-0">
              <div className="premium-icon-container mb-3 sm:mb-4 md:mb-5 mx-auto">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-white">Incident Management</h3>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">Full lifecycle incident response tracking from detection to closure, with integrated action items and comprehensive after-action reports.</p>
            </div>
            <div className="text-center group px-4 sm:px-0">
              <div className="premium-icon-container mb-3 sm:mb-4 md:mb-5 mx-auto">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-white">Continuous Improvement</h3>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">Track progress over time, run tabletop exercises to test readiness, and build a culture of security excellence through data-driven insights.</p>
            </div>
          </div>

          <div className="text-center px-4 sm:px-0">
            <Link to={createPageUrl("EducationalResources")}>
              <Button variant="outline" className="premium-outline-button text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                Access the Training Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-center">
            <div className="card-entrance stagger-4 space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                Your Complete Security Operations Center
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start group">
                  <div className="premium-step-number mr-4 sm:mr-6 flex-shrink-0">1</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">Assess & Analyze</h3>
                    <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed">Smart-powered security assessments to identify gaps and receive Smart-generated insights tailored to your industry and compliance needs.</p>
                  </div>
                </div>
                <div className="flex items-start group">
                  <div className="premium-step-number mr-4 sm:mr-6 flex-shrink-0">2</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">Manage & Respond</h3>
                    <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed">Track incidents from detection through closure, manage action items, and coordinate team responses with built-in collaboration tools.</p>
                  </div>
                </div>
                <div className="flex items-start group">
                  <div className="premium-step-number mr-4 sm:mr-6 flex-shrink-0">3</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">Test & Improve</h3>
                    <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed">Test your incident response capabilities and continuously improve your security posture with data-driven insights.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-entrance stagger-5 px-4 lg:px-0">
              <div className="max-w-sm mx-auto lg:max-w-none lg:mx-0">
                <Card className="vibrant-card border-gradient-purple p-1 sm:p-2 transform-gpu rotate-1 hover:rotate-0 transition-transform duration-300 shadow-2xl">
                  <div className="border border-gradient-inner rounded-lg p-3 sm:p-4 md:p-5 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm">
                     <div className="flex justify-between items-center mb-2 sm:mb-3">
                        <h3 className="text-sm sm:text-base font-bold text-white">Executive Security Report</h3>
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white"/>
                        </div>
                     </div>
                     <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-end">
                           <span className="text-xs sm:text-sm text-gray-300">Overall Score:</span>
                           <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">72%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
                           <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-1.5 sm:h-2 rounded-full shadow-lg transition-all duration-1000" style={{width: '72%'}}></div>
                        </div>
                        <p className="text-2xs sm:text-xs text-gray-300 leading-relaxed">
                          This report outlines key strengths, critical vulnerabilities, and a smart-generated strategic roadmap for enhancing your security posture...
                        </p>
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-lg p-2 sm:p-3">
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between text-2xs sm:text-xs text-gray-400">
                              <span>• Identity & Access: 4/5</span>
                              <span>Strong</span>
                            </div>
                            <div className="flex justify-between text-2xs sm:text-xs text-gray-400">
                              <span>• Threat Detection: 2/5</span>
                              <span className="text-orange-400">Critical Gap</span>
                            </div>
                            <div className="flex justify-between text-2xs sm:text-xs text-gray-400">
                              <span>• Incident Response: 3/5</span>
                              <span>Developing</span>
                            </div>
                            <div className="text-2xs sm:text-xs text-cyan-400 font-medium mt-2">
                              + 12 Key Recommendations
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cybersecurity Cost Analysis Section */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/20">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 md:mb-8">
            The True Cost of 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400"> Cyber Incidents</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto">
            Data breaches cost millions, but proactive cybersecurity investment is a fraction of that cost. 
            See how your industry compares and why prevention is always better than reaction.
          </p>
          
          <div className="flex justify-center">
            <Card className="glass-effect border-slate-700/50 overflow-hidden max-w-[70%]">
              <CardContent className="p-0">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686c4c7cddeaa31e94f721d6/81e0a8c6c_image.png"
                  alt="Cybersecurity Breach Cost vs Spend by Industry - Data showing average cybersecurity spending as percentage of IT budget compared to typical breach costs across different industries including Financial Services, Healthcare, Retail, Manufacturing, and Government sectors"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
              Don't wait for a breach to happen. Start your security assessment today.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="premium-button group text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 h-auto"
            >
              <span className="mr-2">Assess Your Security Posture</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Sample Reports Section */}
      <section className="py-6 sm:py-10 md:py-14 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold cyber-text-glow mb-3 sm:mb-4">
              See What You Get
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Explore sample reports to see the comprehensive analysis and professional documentation
              Hubcys delivers for your cybersecurity assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="card-entrance stagger-1">
              <Card className="glass-effect border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 h-full">
                <CardContent className="p-4 sm:p-5 md:p-6 text-center h-full flex flex-col">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Security Assessment Report</h3>
                  <p className="text-gray-400 mb-3 sm:mb-4 flex-grow text-sm sm:text-base">
                    Comprehensive cybersecurity gap analysis with AI-powered recommendations and strategic action plans.
                  </p>
                  <Link to={createPageUrl("SampleAssessmentReportView")} target="_blank" rel="noopener noreferrer">
                    <Button
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    >
                      View Sample Report
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="card-entrance stagger-2">
              <Card className="glass-effect border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 h-full">
                <CardContent className="p-4 sm:p-5 md:p-6 text-center h-full flex flex-col">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Incident Response Report</h3>
                  <p className="text-gray-400 mb-3 sm:mb-4 flex-grow text-sm sm:text-base">
                    Detailed incident documentation from detection to lessons learned, including NIS2 compliance reporting.
                  </p>
                  <Button
                    onClick={() => window.open(createPageUrl('SampleIncidentReport'), '_blank')}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    View Sample Report
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="card-entrance stagger-3">
              <Card className="glass-effect border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 h-full">
                <CardContent className="p-4 sm:p-5 md:p-6 text-center h-full flex flex-col">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Tabletop Exercise Report</h3>
                  <p className="text-gray-400 mb-3 sm:mb-4 flex-grow text-sm sm:text-base">
                    Crisis simulation after-action report with performance analysis and improvement recommendations.
                  </p>
                  <Button
                    onClick={() => window.open(createPageUrl('SampleTabletopReport'), '_blank')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    View Sample Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-6 sm:py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-12 bg-gradient-to-r from-cyan-200 to-purple-200 bg-clip-text text-transparent">
            Trusted by Industry Leaders
          </h2>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>

            <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-8 sm:px-8" style={{scrollBehavior: 'smooth'}}>
              <Card className="vibrant-card border-gradient-cyan card-entrance flex-shrink-0 w-72 sm:w-80">
                <CardContent className="p-4 sm:p-5 flex flex-col h-52 sm:h-56">
                  <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500/50 mb-2 sm:mb-3" />
                  <p className="text-gray-300 mb-3 italic flex-grow text-xs sm:text-sm leading-relaxed">
                    "Hubcys gave us clarity we didn't even know we were missing. In one week, we discovered gaps that had been overlooked for months. Their platform didn't just assess our posture — it taught us how to improve it without slowing down our dev teams."
                  </p>
                  <div className="text-right mt-auto">
                    <p className="font-semibold text-white text-xs sm:text-sm">Alex M.</p>
                    <p className="text-xs text-gray-400">CTO, Fintech Startup</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="vibrant-card border-gradient-purple card-entrance flex-shrink-0 w-72 sm:w-80">
                <CardContent className="p-4 sm:p-5 flex flex-col h-52 sm:h-56">
                  <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500/50 mb-2 sm:mb-3" />
                  <p className="text-gray-300 mb-3 italic flex-grow text-xs sm:text-sm leading-relaxed">
                    "We needed to prepare for HIPAA and SOC 2, but we didn't know where to start. Hubcys made the process simple, actionable, and surprisingly stress-free. It's like having a virtual CISO built into your workflow."
                  </p>
                  <div className="text-right mt-auto">
                    <p className="font-semibold text-white text-xs sm:text-sm">Chloe R.</p>
                    <p className="text-xs text-gray-400">Compliance Lead, Regional Health Network</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="vibrant-card border-gradient-emerald card-entrance flex-shrink-0 w-72 sm:w-80">
                <CardContent className="p-4 sm:p-5 flex flex-col h-52 sm:h-56">
                  <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500/50 mb-2 sm:mb-3" />
                  <p className="text-gray-300 mb-3 italic flex-grow text-xs sm:text-sm leading-relaxed">
                    "I don't have an IT department — just me and a few contractors. Hubcys showed me where we were vulnerable and gave me step-by-step fixes in plain English. This isn't just for techies, it's for business survival."
                  </p>
                  <div className="text-right mt-auto">
                    <p className="font-semibold text-white text-xs sm:text-sm">Marcus J.</p>
                    <p className="text-xs text-gray-400">Founder, MJ Logistics</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="vibrant-card border-gradient-orange card-entrance flex-shrink-0 w-72 sm:w-80">
                <CardContent className="p-4 sm:p-5 flex flex-col h-52 sm:h-56">
                  <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500/50 mb-2 sm:mb-3" />
                  <p className="text-gray-300 mb-3 italic flex-grow text-xs sm:text-sm leading-relaxed">
                    "I use Hubcys with every small client I onboard. The 360° view, framework-aligned questions, and visual dashboards make it a no-brainer. It's the fastest way to go from zero to security maturity."
                  </p>
                  <div className="text-right mt-auto">
                    <p className="font-semibold text-white text-xs sm:text-sm">Tanya B.</p>
                    <p className="text-xs text-gray-400">Virtual CISO & Security Advisor</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Training Guide Section */}
      <section className="py-4 sm:py-6 md:py-8 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-cyan-300 mb-3 sm:mb-4">
            Unlock Your Full Potential
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6">
            Dive deeper into cybersecurity best practices and learn how to maximize the value
            of Hubcys's insights with our comprehensive training guide.
          </p>
          <Button
            onClick={() => window.open('https://drive.google.com/file/d/1wM9r2jvDrKlGI6YoOkjEtYH2qPfUITXG/view?usp=sharing', '_blank')}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-semibold"
          >
            Access the Training Guide
            <span className="ml-2">📖</span>
          </Button>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-6 sm:py-10 md:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="glass-effect border-cyan-500/30">
            <CardContent className="p-5 sm:p-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl sm:text-2xl font-bold text-white">Ready to strengthen your security posture?</h3>
              </div>
              <p className="text-gray-300 mb-5 max-w-2xl">
                Start with a guided assessment, get Smart insights, and generate a board-ready report in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {currentUser ? 'Go to Dashboard' : 'Start Free Trial'}
                </Button>
                <Link to={createPageUrl('Pricing')}>
                  <Button variant="outline" className="premium-outline-button">
                    View Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Links Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs text-gray-500">
            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-cyan-400 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-gray-700">•</span>
            <a 
              href="mailto:careers@fortigap.com?subject=Career Opportunity Inquiry" 
              className="hover:text-cyan-400 transition-colors"
            >
              Careers
            </a>
            <span className="text-gray-700">•</span>
            <Link to={createPageUrl('TermsOfService')} className="hover:text-cyan-400 transition-colors">
              Legal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="text-center text-gray-400">
            <p className="text-sm sm:text-base">© {new Date().getFullYear()} Hubcys. Empowering CISOs with intelligent security assessments.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .refined-gradient {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 15%, #0F172A 30%, #1E293B 45%, #0F172A 60%, #1E293B 75%, #0F172A 100%);
          background-size: 400% 400%;
          animation: refined-gradient-flow 20s ease infinite;
        }

        @keyframes refined-gradient-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .premium-button {
          background: linear-gradient(135deg, #059669, #06B6D4, #3B82F6, #8B5CF6);
          background-size: 400% 400%;
          border: none !important;
          border-radius: 16px;
          box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 0 40px rgba(6, 182, 212, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: premium-gradient-shift 6s ease infinite;
          font-weight: 700;
          letter-spacing: 0.025em;
          outline: none !important;
        }

        .premium-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.4),
            0 0 60px rgba(6, 182, 212, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          outline: none !important;
          border: none !important;
        }

        .premium-button:focus {
          outline: none !important;
          border: none !important;
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.4),
            0 0 60px rgba(6, 182, 212, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .premium-secondary-button {
          background: linear-gradient(135deg, #1E293B, #0F172A);
          border: 2px solid;
          border-image: linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899) 1;
          border-radius: 16px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: premium-gradient-shift 8s ease infinite;
          font-weight: 600;
          outline: none !important;
          position: relative;
        }

        .premium-secondary-button:hover {
          transform: translateY(-2px) scale(1.02);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
          border-image: linear-gradient(135deg, #06B6D4, #8B5CF6, #EC4899) 1;
          outline: none !important;
        }

        .premium-secondary-button:focus {
          outline: none !important;
          transform: translateY(-2px) scale(1.02);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
          border-image: linear-gradient(135deg, #06B6D4, #8B5CF6, #EC4899) 1;
        }

        .premium-outline-button {
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid;
          border-image: linear-gradient(135deg, #06B6D4, #8B5CF6) 1;
          border-radius: 12px;
          transition: all 0.3s ease;
          font-weight: 600;
          outline: none !important;
        }

        .premium-outline-button:hover {
          background: rgba(6, 182, 212, 0.1);
          border-image: linear-gradient(135deg, #06B6D4, #8B5CF6) 1;
          transform: translateY(-1px);
          outline: none !important;
        }

        .premium-outline-button:focus {
          outline: none !important;
          background: rgba(6, 182, 212, 0.1);
          border-image: linear-gradient(135deg, #06B6D4, #8B5CF6) 1;
        }

        @keyframes premium-gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .premium-icon-container {
          width: 60px;
          height: 60px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
          border: 1px solid rgba(6, 182, 212, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .premium-icon-container {
            width: 70px;
            height: 70px;
            border-radius: 22px;
          }
        }

        @media (min-width: 768px) {
          .premium-icon-container {
            width: 80px;
            height: 80px;
            border-radius: 24px;
          }
        }

        .premium-icon-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .group:hover .premium-icon-container {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 20px 40px rgba(6, 182, 212, 0.2);
        }

        .group:hover .premium-icon-container::before {
          left: 100%;
        }

        .premium-step-number {
          width: 40px;
          height: 40px;
          border-radius: 16px;
          background: linear-gradient(135deg, #F97316, #EF4444, #EC4899);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.25rem;
          color: white;
          box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
          transition: all 0.3s ease;
        }

        @media (min-width: 640px) {
          .premium-step-number {
            width: 50px;
            height: 50px;
            border-radius: 18px;
            font-size: 1.375rem;
          }
        }

        @media (min-width: 768px) {
          .premium-step-number {
            width: 60px;
            height: 60px;
            border-radius: 20px;
            font-size: 1.5rem;
          }
        }

        .group:hover .premium-step-number {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 15px 30px rgba(239, 68, 68, 0.4);
        }

        .vibrant-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        @media (min-width: 640px) {
          .vibrant-card {
            border-radius: 24px;
          }
        }

        .vibrant-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(6, 182, 212, 0.1);
        }

        .border-gradient-cyan {
          border-image: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(16, 185, 129, 0.3)) 1;
        }

        .border-gradient-purple {
          border-image: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3)) 1;
        }

        .border-gradient-emerald {
          border-image: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.3)) 1;
        }

        .border-gradient-orange {
          border-image: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(239, 68, 68, 0.3)) 1;
        }

        .premium-feature-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .premium-feature-card {
            border-radius: 20px;
          }
        }

        .premium-feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(139, 92, 246, 0.05));
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .premium-feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 0 40px rgba(6, 182, 212, 0.1);
        }

        .premium-feature-card:hover::before {
          opacity: 1;
        }

        .premium-feature-icon {
          width: 60px;
          height: 60px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 640px) {
          .premium-feature-icon {
            width: 70px;
            height: 70px;
            border-radius: 22px;
          }
        }

        @media (min-width: 768px) {
          .premium-feature-icon {
            width: 80px;
            height: 80px;
            border-radius: 24px;
          }
        }

        .group:hover .premium-feature-icon {
          transform: scale(1.1) rotate(-5deg);
          box-shadow: 0 12px 24px rgba(6, 182, 212, 0.2);
        }

        .card-entrance {
          animation: premium-slideUp 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
          transform: translateY(40px);
        }

        @keyframes premium-slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .border-gradient-inner {
          border-image: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3)) 1;
        }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
        .stagger-7 { animation-delay: 0.7s; }
        .stagger-8 { animation-delay: 0.8s; }
        .stagger-9 { animation-delay: 0.9s; }
        .stagger-10 { animation-delay: 1.0s; }
        .stagger-11 { animation-delay: 1.1s; }
        .stagger-12 { animation-delay: 1.2s; }
        .stagger-13 { animation-delay: 1.3s; }
        .stagger-14 { animation-delay: 1.4s; }

        .cyber-text-glow {
          text-shadow: 0 0 8px rgba(6, 182, 212, 0.6),
                       0 0 16px rgba(6, 182, 212, 0.4),
                       0 0 24px rgba(6, 182, 212, 0.2);
          color: white;
        }

        .glass-effect {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(25px);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }

        .glass-effect:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        @media (min-width: 640px) {
          .glass-effect {
            border-radius: 24px;
          }
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.25);
          color: #a5f3fc;
          font-size: 0.75rem;
          line-height: 1rem;
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .premium-button,
          .premium-secondary-button {
            font-size: 0.875rem;
            padding: 0.75rem 1.5rem;
          }

          .premium-outline-button {
            font-size: 0.875rem;
            padding: 0.625rem 1.25rem;
          }
        }

        @media (prefers-contrast: high) {
          .vibrant-card,
          .premium-feature-card,
          .glass-effect {
            border-width: 2px;
            border-color: rgba(255, 255, 255, 0.3);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .premium-button,
          .vibrant-card,
          .premium-feature-card,
          .premium-icon-container,
          .premium-step-number,
          .glass-effect {
            transition: none;
            animation: none;
          }

          .card-entrance {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
