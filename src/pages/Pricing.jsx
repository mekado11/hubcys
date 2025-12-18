
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Shield,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Star,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Bug
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TooltipInfo from "@/components/ui/TooltipInfo";

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(null); // Used just for brief UX feedback

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: "Starter",
      price: "$600",
      period: "month",
      yearlyPrice: "$6,000",
      description: "Essential gap analysis for startups & small teams (capped usage)",
      color: "blue",
      highlights: [
        "4 Security Assessments/month",
        "2 Compliance Frameworks",
        "PDF Reports & Action Items",
        "Up to 2 Security Engineers"
      ]
    },
    {
      name: "Growth",
      price: "$1,500",
      period: "month",
      yearlyPrice: "$12,000",
      description: "Unlimited assessments with AI insights",
      color: "purple",
      popular: true,
      highlights: [
        "Unlimited Security Assessments",
        "AI Recommendations & BIA",
        "Full Command Center Access",
        "Up to 5 Security Engineers"
      ]
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "Complete GRC platform for large organizations",
      color: "gold",
      highlights: [
        "All Compliance Frameworks",
        "Advanced Integrations & RBAC",
        "Dedicated Customer Success",
        "Unlimited Security Engineers"
      ]
    }
  ];

  const getCardClasses = (plan) => {
    const baseClasses = "relative overflow-hidden transition-all duration-300 hover:scale-105";

    if (plan.color === "blue") {
      return `${baseClasses} glass-effect border-blue-500/30 hover:border-blue-400/50`;
    } else if (plan.color === "purple") {
      return `${baseClasses} glass-effect border-purple-500/40 hover:border-purple-400/60 ring-2 ring-purple-500/20`;
    } else if (plan.color === "gold") {
      return `${baseClasses} glass-effect border-yellow-500/30 hover:border-yellow-400/50`;
    }
    return baseClasses;
  };

  const getButtonClasses = (plan) => {
    if (plan.color === "blue") {
      return "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700";
    } else if (plan.color === "purple") {
      return "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700";
    } else if (plan.color === "gold") {
      return "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700";
    }
    return "bg-gradient-to-r from-gray-500 to-gray-600";
  };

  // Replace Stripe checkout with email flow
  const startEarlyCareerCheckout = async (plan) => {
    setLoadingPlan(plan);
    try {
      const subject = `Early Career ${plan === 'plus' ? 'Plus ($899/year)' : 'Standard ($699/year)'} - Activation Request`;
      const body = `Hello Hubcys Team,

I'd like to purchase the Early Career ${plan === 'plus' ? 'Plus ($899/year)' : 'Standard ($699/year)'} plan.

My details:
- Name:
- Email:
- Company (if any):
- Notes:

Please send an invoice and activate my account. Thank you!`;

      window.location.href = `mailto:sales@fortigap.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      // small delay so users see the button state change before mail client opens
      setTimeout(() => setLoadingPlan(null), 400);
    }
  };

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Back to Landing */}
        <div className="mb-6">
          <Link to={createPageUrl('LandingPage')}>
            <Button variant="outline" className="border-cyan-500/30 bg-white text-slate-800 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <Clock className="w-4 h-4 mr-2" />
            28-Day Free Trial Available
          </Badge>
          <h1 className="font-bold text-white mb-4 text-2xl md:text-3xl">
            Choose Your Security Plan
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto mb-6 text-sm md:text-base">
            Comprehensive security gap analysis and compliance management.
            Start with essential assessments, scale with AI-powered insights.
          </p>

          {/* View Detailed Features Link */}
          <Link to={createPageUrl('PricingAndFeatures')}>
            <Button variant="outline" className="border-cyan-500/30 bg-white text-slate-800 hover:bg-gray-100 mb-8 text-sm py-2 px-4">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Detailed Features Comparison
            </Button>
          </Link>
        </div>

        {/* Simplified Pricing Cards (Business Plans) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={getCardClasses(plan)}>
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center py-2 text-xs font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  Most Popular
                </div>
              )}

              <CardHeader className={plan.popular ? "pt-12" : ""}>
                <CardTitle className="text-center">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="text-center mb-3">
                    {plan.price === "Custom" ? (
                      <div className="text-2xl font-bold text-white">Custom</div>
                    ) : (
                      <div>
                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                        <span className="text-gray-400">/{plan.period}</span>
                        {plan.yearlyPrice && (
                          <div className="text-xs text-green-400 mt-1">
                            {plan.yearlyPrice}/year (save 2 months!)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-300 text-xs">{plan.description}</p>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <h4 className="font-semibold text-white mb-2 text-xs">Key Features:</h4>
                  <ul className="space-y-2">
                    {plan.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-300">
                        <Check className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button
                    className={`w-full ${getButtonClasses(plan)} text-white py-2 text-sm`}
                    onClick={() => {
                      const subject = `Inquiry about ${plan.name} Plan`;
                      const body = `Hello,\n\nI'm interested in the ${plan.name} plan for my organization. Could you please provide more information about pricing and setup?\n\nThank you!`;
                      window.location.href = `mailto:sales@fortigap.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                  >
                    {plan.price === "Custom" ? (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Sales
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Get Started
                      </>
                    )}
                  </Button>

                  <Link to={createPageUrl('PricingAndFeatures')} className="block">
                    <Button variant="outline" className="w-full border-gray-600 bg-white text-slate-800 hover:bg-gray-100 text-sm py-2">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      See All Features
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* NEW: CyGRiC Add-on / Services Layer */}
        <div className="mb-16">
          <Card className="glass-effect border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-300 text-center text-xl flex items-center justify-center gap-2">
                Need a Human Cybersecurity Team?{" "}
                <span className="inline-flex items-center gap-1">
                  Meet <a href="https://www.cygric.com" target="_blank" rel="noopener noreferrer" className="underline decoration-yellow-400/60 hover:text-yellow-200">CyGRiC</a>
                  <TooltipInfo title="What is CyGRiC?">
                    CyGRiC is our dedicated cybersecurity consulting arm, offering human expertise in risk management, compliance, and training to complement the Hubcys platform.
                  </TooltipInfo>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-cyan-300 font-semibold mb-2">Hubcys = Software (SaaS)</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• AI-driven assessments and gap analysis</li>
                    <li>• Automated playbooks and smart recommendations</li>
                    <li>• Compliance automation and reporting</li>
                    <li>• Command Center security tools</li>
                  </ul>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-yellow-300 font-semibold mb-2">CyGRiC = Services (Human Expertise)</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Consulting and advisory (vCISO)</li>
                    <li>• GRC framework implementation</li>
                    <li>• Policy and procedure development</li>
                    <li>• Training, tabletop facilitation, IR planning</li>
                  </ul>
                </div>
              </div>
              <p className="text-center text-sm text-gray-300">
                <span className="font-semibold text-white">Together</span> = your Virtual CISO-in-a-box. Hubcys provides the automation. CyGRiC adds the human expertise.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="https://www.cygric.com" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button variant="outline" className="border-yellow-500/40 bg-white text-slate-800 hover:bg-gray-100 w-full sm:w-auto">
                    Visit cygric.com
                  </Button>
                </a>
                <Button
                  onClick={() => window.location.href = 'mailto:sales@fortigap.com'}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 w-full sm:w-auto"
                >
                  Learn about Enterprise + CyGRiC
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Early Career section */}
        <div className="mt-16">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-purple-300" />
            <h2 className="text-xl font-semibold text-white">Early Career (Individuals)</h2>
          </div>
          <p className="text-gray-300 mb-5 text-sm">
            Professional-grade tools and training for individuals starting their security career. Limited features, personal use only.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Plan */}
            <Card className="glass-effect border-slate-700/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">Early Career Standard</CardTitle>
                  <Badge className="bg-purple-500/20 text-purple-300 text-xs">Most popular</Badge>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-bold text-white">$699</span>
                  <span className="text-gray-400 text-xs"> / year</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <Feature text="URL Security Scanner" icon={Shield} />
                <Feature text="CVE Database Search & analysis" icon={Bug} />
                <Feature text="Password Generator" icon={Zap} />
                <Feature text="Security Training & Resources" icon={BookOpen} />
                <Feature text="Personal reports (basic)" icon={CheckCircle2} />
                <p className="text-gray-400 text-[11px] mt-1">Best for students and aspiring security professionals.</p>
                <Button
                  onClick={() => startEarlyCareerCheckout('standard')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm py-2"
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === 'standard' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Get Early Career Standard
                </Button>
                <p className="text-[11px] text-gray-500 mt-1">Non-recurring one-year access. You can renew manually next year.</p>
              </CardContent>
            </Card>

            {/* Plus Plan */}
            <Card className="glass-effect border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">Early Career Plus</CardTitle>
                <div className="mt-2">
                  <span className="text-xl font-bold text-white">$899</span>
                  <span className="text-gray-400 text-xs"> / year</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <Feature text="Everything in Standard" icon={CheckCircle2} />
                <Feature text="Limited SAST (small code snippets)" icon={Zap} />
                <Feature text="Extra training content and examples" icon={BookOpen} />
                <Feature text="Priority email support" icon={Shield} />
                <p className="text-gray-400 text-[11px] mt-1">For ambitious learners who want more practice and support.</p>
                <Button
                  onClick={() => startEarlyCareerCheckout('plus')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-sm py-2"
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === 'plus' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Get Early Career Plus
                </Button>
                <p className="text-[11px] text-gray-500 mt-1">Non-recurring one-year access. You can renew manually next year.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center space-y-6 mt-14">
          <Card className="glass-effect border-cyan-500/30 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center justify-center text-base">
                <MessageCircle className="w-5 h-5 mr-2" />
                Ready to Get Started?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">
                Our security experts are ready to help you choose the right plan and get you set up quickly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  className="border-cyan-500/30 bg-white text-slate-800 hover:bg-gray-100 text-sm py-2"
                  onClick={() => window.location.href = 'mailto:sales@fortigap.com'}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  sales@fortigap.com
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-500/30 bg-white text-slate-800 hover:bg-gray-100 text-sm py-2"
                  onClick={() => window.location.href = 'tel:+1-555-SECURITY'}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Schedule a Demo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back to App */}
          {user && (
            <div className="pt-6 border-t border-gray-700/50 mt-6">
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" className="text-gray-400 hover:text-white text-sm">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function Feature({ text, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 text-gray-200 text-xs">
      <Icon className="w-4 h-4 text-purple-300" />
      <span>{text}</span>
    </div>
  );
}
