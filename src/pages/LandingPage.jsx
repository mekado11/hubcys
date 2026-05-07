import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/entities/User';
import {
  ShieldCheck, ArrowRight, Target, FileText, BookOpen, TrendingUp,
  Quote, AlertTriangle, Gamepad2, BarChart3, Gavel, Bot, Zap,
  CheckCircle, Globe, Lock, Award, ChevronRight
} from 'lucide-react';

const FEATURES = [
  {
    icon: Target,
    gradient: 'from-cyan-500 to-blue-500',
    title: 'Security Assessments',
    description: 'AI-powered gap analysis across all major frameworks — NIST, ISO 27001, CIS — with a prioritised remediation roadmap tailored to your industry.'
  },
  {
    icon: AlertTriangle,
    gradient: 'from-orange-500 to-red-500',
    title: 'Incident Management',
    description: 'Full lifecycle tracking from detection to closure. Built-in playbooks, action items, and NIS2-compliant after-action reports in minutes.'
  },
  {
    icon: Gamepad2,
    gradient: 'from-purple-500 to-pink-500',
    title: 'Tabletop Exercises',
    description: 'Realistic crisis simulations with AI-generated scenarios. Measure team readiness and produce board-ready performance reports.'
  },
  {
    icon: Gavel,
    gradient: 'from-emerald-500 to-teal-500',
    title: 'Policy Library',
    description: 'Generate, customise, and version-control security policies. Pre-built templates aligned to GDPR, HIPAA, SOC 2, and more.'
  },
  {
    icon: Bot,
    gradient: 'from-blue-500 to-violet-500',
    title: 'IOC Analyzer',
    description: 'Enrich threat indicators in real time — IPs, domains, hashes — with context from global threat feeds and CVE correlation.'
  },
  {
    icon: BarChart3,
    gradient: 'from-teal-500 to-cyan-500',
    title: 'Business Impact Analysis',
    description: 'Quantify operational risk. Map critical assets, model recovery timelines (RTO/RPO), and present findings to leadership automatically.'
  }
];

const TESTIMONIALS = [
  {
    quote: "Hubcys gave us clarity we didn't even know we were missing. In one week we discovered gaps overlooked for months. It didn't just assess our posture — it taught us how to improve it without slowing down our dev teams.",
    name: "Alex M.",
    role: "CTO, Fintech Startup",
    accent: "cyan"
  },
  {
    quote: "We needed to prepare for HIPAA and SOC 2 but didn't know where to start. Hubcys made the process simple, actionable, and surprisingly stress-free. It's like having a virtual CISO built into your workflow.",
    name: "Chloe R.",
    role: "Compliance Lead, Regional Health Network",
    accent: "purple"
  },
  {
    quote: "I don't have an IT department — just me and a few contractors. Hubcys showed me where we were vulnerable and gave me step-by-step fixes in plain English. This isn't just for techies; it's for business survival.",
    name: "Marcus J.",
    role: "Founder, MJ Logistics",
    accent: "emerald"
  },
  {
    quote: "I use Hubcys with every small client I onboard. The 360° view, framework-aligned questions, and visual dashboards make it a no-brainer. The fastest way to go from zero to security maturity.",
    name: "Tanya B.",
    role: "Virtual CISO & Security Advisor",
    accent: "orange"
  }
];

const accentMap = {
  cyan:    { border: 'border-cyan-500/25',    icon: 'text-cyan-400/40',    name: 'text-cyan-300' },
  purple:  { border: 'border-purple-500/25',  icon: 'text-purple-400/40',  name: 'text-purple-300' },
  emerald: { border: 'border-emerald-500/25', icon: 'text-emerald-400/40', name: 'text-emerald-300' },
  orange:  { border: 'border-orange-500/25',  icon: 'text-orange-400/40',  name: 'text-orange-300' }
};

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
      window.location.href = '/Login?mode=register';
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-cyan-400 mx-auto mb-5" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* ── Sticky Nav ─────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={createPageUrl("LandingPage")} className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686c4c7cddeaa31e94f721d6/3e69b2e7d_Hubcys.png"
                alt="Hubcys"
                className="w-8 h-8 object-contain"
              />
              <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur-sm pointer-events-none" />
            </div>
            <span className="text-lg font-bold tracking-tight cyber-text-glow">Hubcys</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link to={createPageUrl("PricingAndFeatures")} className="hover:text-white transition-colors">Features</Link>
            <Link to={createPageUrl("Pricing")} className="hover:text-white transition-colors">Pricing</Link>
            <Link to={createPageUrl("EducationalResources")} className="hover:text-white transition-colors">Resources</Link>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm px-4 py-2 h-auto rounded-lg font-semibold"
              >
                Dashboard <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = '/Login'}
                  className="text-slate-400 hover:text-white text-sm hidden sm:flex"
                >
                  Sign in
                </Button>
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm px-4 py-2 h-auto rounded-lg font-semibold"
                >
                  Start free trial
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* background grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.04) 1px,transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        {/* radial glow */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%,rgba(6,182,212,0.12) 0%,rgba(139,92,246,0.06) 50%,transparent 70%)'
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Logo badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Integrated Cybersecurity Management Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            <span className="text-white">Security clarity for</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              modern organisations
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            From gap assessments and incident response to tabletop exercises and policy management —
            one platform, every layer of your security posture.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="premium-button text-base px-8 py-4 h-auto w-full sm:w-auto"
            >
              {currentUser ? 'Go to Dashboard' : 'Start your security journey'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Link to={createPageUrl("PricingAndFeatures")} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="premium-outline-button text-base px-8 py-4 h-auto w-full"
              >
                Explore features
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <span className="chip"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 28-day free trial</span>
            <span className="chip"><Lock className="w-3.5 h-3.5 text-cyan-400" /> No credit card required</span>
            <span className="chip"><Award className="w-3.5 h-3.5 text-purple-400" /> Enterprise-ready</span>
          </div>
        </div>
      </section>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '28-day', label: 'Free trial' },
            { value: '6+',     label: 'Security frameworks' },
            { value: 'NIS2',   label: 'Compliance reporting' },
            { value: '∞',      label: 'Assessments on enterprise' }
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-cyan-400 tracking-widest uppercase mb-3">Platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything your security team needs
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Purpose-built tools for every phase of your security programme — assess, respond, train, and improve.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className={`premium-feature-card group card-entrance stagger-${i + 1}`}>
                  <div className="p-6">
                    <div className={`premium-feature-icon mb-5 bg-gradient-to-br ${feat.gradient}`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-purple-400 tracking-widest uppercase mb-3">How it works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Your complete security operations centre
              </h2>
              <div className="space-y-8">
                {[
                  {
                    n: '1',
                    title: 'Assess & Analyse',
                    body: 'AI-powered security assessments identify gaps across your entire attack surface and generate insights tailored to your industry and compliance requirements.'
                  },
                  {
                    n: '2',
                    title: 'Manage & Respond',
                    body: 'Track incidents from detection through closure. Manage action items, coordinate team responses, and generate NIS2-compliant reports automatically.'
                  },
                  {
                    n: '3',
                    title: 'Test & Improve',
                    body: 'Run tabletop exercises, measure team readiness over time, and build a measurable culture of security excellence with data-driven insights.'
                  }
                ].map((step) => (
                  <div key={step.n} className="group flex gap-5 items-start">
                    <div className="premium-step-number">{step.n}</div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample report card */}
            <div className="lg:flex lg:justify-end">
              <div className="w-full max-w-sm">
                <Card className="glass-effect border-cyan-500/20 p-1">
                  <div className="bg-slate-900/80 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-white text-sm">Executive Security Report</h4>
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs text-slate-400">Overall Score</span>
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">72%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full"
                        style={{ width: '72%' }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      This report outlines key strengths, critical vulnerabilities, and a strategic roadmap for enhancing your security posture.
                    </p>
                    <div className="bg-slate-800/60 rounded-lg p-3 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>• Identity &amp; Access</span><span className="text-emerald-400">4 / 5 — Strong</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>• Threat Detection</span><span className="text-orange-400">2 / 5 — Critical Gap</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>• Incident Response</span><span className="text-yellow-400">3 / 5 — Developing</span>
                      </div>
                      <div className="text-cyan-400 font-semibold pt-1">+ 12 Key Recommendations</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cost of inaction ───────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-semibold text-red-400 tracking-widest uppercase mb-3">Risk quantification</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            The true cost of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              cyber incidents
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12">
            Data breaches cost millions, but proactive investment is a fraction of that cost. See how your industry compares.
          </p>

          <Card className="glass-effect border-slate-700/50 overflow-hidden mb-10">
            <CardContent className="p-0">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686c4c7cddeaa31e94f721d6/81e0a8c6c_image.png"
                alt="Cybersecurity breach cost vs spend by industry"
                className="w-full h-auto"
                loading="lazy"
              />
            </CardContent>
          </Card>

          <Button
            size="lg"
            onClick={handleGetStarted}
            className="premium-button text-base px-8 py-4 h-auto"
          >
            Assess your security posture
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* ── Sample Reports ─────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-cyan-400 tracking-widest uppercase mb-3">See the output</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Professional reports, instantly</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every assessment and incident generates board-ready documentation in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                gradient: 'from-cyan-500 to-blue-500',
                title: 'Security Assessment Report',
                description: 'Comprehensive gap analysis with AI-powered recommendations and strategic action plans.',
                href: 'SampleAssessmentReportView',
                btnClass: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
              },
              {
                icon: AlertTriangle,
                gradient: 'from-orange-500 to-red-500',
                title: 'Incident Response Report',
                description: 'Detailed incident documentation from detection to lessons learned, including NIS2 reporting.',
                href: 'SampleIncidentReport',
                btnClass: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              },
              {
                icon: Gamepad2,
                gradient: 'from-purple-500 to-pink-500',
                title: 'Tabletop Exercise Report',
                description: 'Crisis simulation after-action report with performance analysis and improvement recommendations.',
                href: 'SampleTabletopReport',
                btnClass: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }
            ].map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.title} className="glass-effect border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${report.gradient} flex items-center justify-center mb-4 flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{report.title}</h3>
                    <p className="text-slate-400 text-sm mb-5 flex-1">{report.description}</p>
                    <Button
                      onClick={() => window.open(createPageUrl(report.href), '_blank')}
                      className={`w-full text-sm ${report.btnClass}`}
                    >
                      View sample report
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-purple-400 tracking-widest uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Trusted by industry leaders</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => {
              const a = accentMap[t.accent];
              return (
                <div key={t.name} className={`card-entrance stagger-${i + 1} vibrant-card ${a.border} p-6 flex flex-col gap-4`}>
                  <Quote className={`w-6 h-6 flex-shrink-0 ${a.icon}`} />
                  <p className="text-slate-300 text-sm leading-relaxed italic flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${a.name}`}>{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Training Guide ─────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/[0.015]">
        <div className="max-w-2xl mx-auto text-center">
          <BookOpen className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-cyan-300 mb-3">Unlock your full potential</h2>
          <p className="text-slate-400 mb-6">
            Dive deeper into cybersecurity best practices with our comprehensive training guide.
          </p>
          <Button
            onClick={() => window.open('https://drive.google.com/file/d/1wM9r2jvDrKlGI6YoOkjEtYH2qPfUITXG/view?usp=sharing', '_blank')}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 px-8 py-3 h-auto font-semibold"
          >
            Access the training guide
          </Button>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="glass-effect border-cyan-500/20 overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%,rgba(6,182,212,0.08) 0%,transparent 70%)'
              }}
            />
            <CardContent className="relative p-10 sm:p-14 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to strengthen your security posture?
              </h3>
              <p className="text-slate-400 mb-8 max-w-lg">
                Start with a guided assessment, get AI-powered insights, and generate a board-ready report in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="premium-button text-base px-8 py-4 h-auto"
                >
                  {currentUser ? 'Go to Dashboard' : 'Start free trial'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Link to={createPageUrl('Pricing')}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="premium-outline-button text-base px-8 py-4 h-auto w-full"
                  >
                    View plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Hubcys. Empowering security teams worldwide.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link to={createPageUrl('TermsOfService')} className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <a href="mailto:careers@hubcys.com?subject=Career Opportunity Inquiry" className="hover:text-cyan-400 transition-colors">Careers</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
