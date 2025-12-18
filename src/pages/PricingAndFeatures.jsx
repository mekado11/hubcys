
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TooltipInfo from "@/components/ui/TooltipInfo";
import { 
  Check, 
  Shield, 
  Users, 
  Mail,
  MessageCircle,
  Star,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PricingAndFeatures() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      description: "For startups & small teams proving basic compliance (capped usage)",
      color: "blue",
      features: [
        "4 Security Gap Assessments per month",
        "2 Core Compliance Frameworks (NIST CSF, ISO 27001)",
        "Automated PDF Report Generation",
        "Action Item Tracking & Management",
        "Command Center Access (URL Scanner, CVE Database)",
        "Email Support"
      ],
      limitations: [
        "Up to 2 Security Engineers",
        "No AI recommendations",
        "No custom branding on reports",
        "Basic security tools only"
      ]
    },
    {
      name: "Growth",
      price: "$1,500",
      period: "month", 
      yearlyPrice: "$12,000",
      description: "For growing organizations needing continuous visibility & smart insights",
      color: "purple",
      popular: true,
      features: [
        "Unlimited Security Gap Assessments",
        "Multiple Compliance Frameworks (NIST CSF, ISO 27001/2, SOC 2 Type 1)",
        "Smart AI Recommendations & Analysis",
        "AI-Generated Incident Response Playbooks",
        "Action Item Tracking + AI-Driven Remediation Guidance",
        "PDF Reports with Basic Custom Branding",
        "Full Command Center Access (URL Scanner, CVE DB, IP/TLS Intelligence, Phishing Analyzer)",
        "Business Impact Analysis (BIA) Module",
        "Priority Email Support"
      ],
      limitations: [
        "Up to 5 Security Engineers",
        "No advanced integrations",
        "No Role-Based Access Control (RBAC)",
        "Limited custom policy generation"
      ]
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For regulated industries & large enterprises demanding comprehensive GRC capabilities",
      color: "gold",
      features: [
        "Unlimited Security Gap Assessments",
        "All Major Compliance Frameworks (NIST CSF, ISO 27001/2, SOC 2, HIPAA, PCI DSS, GDPR)",
        "Advanced AI Analysis & Custom Policy Generation",
        "AI-Generated Incident Response Playbooks & Advanced IR Planning",
        "Tabletop Exercise Management & Execution",
        "Fully Customizable Branded Reports & Dashboards",
        "Complete Command Center Suite + BIA Module",
        "Advanced Integrations (Ticketing, Vulnerability Scanners, Cloud Security)",
        "Evidence Management & Cross-Framework Control Mapping", 
        "Role-Based Access Control (RBAC) & Audit Logging",
        "Premium Support (Email, Chat, Phone) + Dedicated Customer Success Manager",
        "API Access & SSO Integration"
      ],
      limitations: [
        "Unlimited Security Engineers",
        "Custom implementation timeline"
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

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Back Navigation */}
        <div className="mb-8">
          <Link to={createPageUrl('Pricing')}>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing Overview
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pricing & Features Comparison
          </h1>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto">
            Choose the right plan for your organization's security gap analysis and compliance needs. 
            All plans include our core gap assessment capabilities with additional features to help you scale.
          </p>
        </div>

        {/* Key Value Proposition */}
        <div className="mb-12">
          <Card className="glass-effect border-cyan-500/30 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-cyan-300 text-center text-xl flex items-center justify-center">
                <Shield className="w-6 h-6 mr-3" />
                Gap Analysis First, Everything Else is a Bonus
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 text-base leading-relaxed">
                Hubcys is built around comprehensive security gap analysis and compliance assessment.
                Features like incident response planning, tabletop exercises, and security intelligence tools
                are added benefits designed to help smaller organizations scale their security programs effectively.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Hubcys + CyGRiC GRC Custom Services Section */}
        <div className="mb-16">
          <Card className="glass-effect border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-300 text-center text-xl mb-2">
                Need a Human Cybersecurity Team?{" "}
                <span className="inline-flex items-center gap-1">
                  Meet <a href="https://www.cygric.com" target="_blank" rel="noopener noreferrer" className="underline decoration-yellow-400/60 hover:text-yellow-200">CyGRiC</a>
                  <TooltipInfo title="What is CyGRiC?">
                    CyGRiC is our dedicated cybersecurity consulting arm, offering human expertise in risk management, compliance, and training to complement the Hubcys platform.
                  </TooltipInfo>
                </span>
              </CardTitle>
              <div className="text-center">
                <p className="text-gray-300 text-base">
                  Hubcys provides the automation. CyGRiC adds the human expertise.{" "}
                  <span className="text-white font-semibold">Together, you get a Virtual CISO team</span> without the cost of hiring.
                </p>
                <div className="mt-3">
                  <a href="https://www.cygric.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-yellow-300 hover:text-yellow-200 text-sm underline">
                    Visit cygric.com <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Roles clarification */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-cyan-300 font-semibold mb-2">Hubcys = Software (SaaS)</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• AI-driven assessments, gap analysis, automation</li>
                    <li>• Executive reporting and compliance mapping</li>
                    <li>• Command Center tools (URL, CVE, IP/TLS, more)</li>
                  </ul>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-yellow-300 font-semibold mb-2">CyGRiC = Services (Human Expertise)</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• vCISO advisory and consulting</li>
                    <li>• GRC framework implementation and audits</li>
                    <li>• Policy development, training, and tabletop exercises</li>
                  </ul>
                </div>
              </div>

              {/* Simple pricing overview row */}
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-white font-semibold mb-1">Starter</div>
                    <div className="text-gray-300">Limited assessments, 2 frameworks</div>
                    <div className="text-green-300 mt-1">$6,000/year</div>
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Growth</div>
                    <div className="text-gray-300">Unlimited assessments, AI modules, 5 users</div>
                    <div className="text-green-300 mt-1">$12,000/year</div>
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Enterprise</div>
                    <div className="text-gray-300">Unlimited, integrations, multi-user</div>
                    <div className="text-cyan-300 mt-1">Contact us for custom pricing</div>
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Enterprise + CyGRiC</div>
                    <div className="text-gray-300">All Enterprise SaaS + dedicated human expertise</div>
                    <div className="text-cyan-300 mt-1">Contact us for custom pricing</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-3">
                  Pricing for Enterprise and Enterprise + CyGRiC is based on company size and the volume of work.
                </div>
              </div>

              {/* Keep value props previously present but reworded to match messaging */}
              <div className="space-y-8">
                <h3 className="text-white text-center text-lg font-bold">
                  Hubcys Enterprise + CyGRiC (Human Expertise Layer)
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-yellow-300 font-bold text-sm">Cost-Effective Expertise</h4>
                    <p className="text-gray-300 text-xs">
                      Avoid six-figure in-house costs; get seasoned security leadership on-demand.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-yellow-300 font-bold text-sm">Comprehensive GRC Services</h4>
                    <p className="text-gray-300 text-xs">
                      From posture reviews and framework rollouts to audits and evidence management.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-yellow-300 font-bold text-sm">Training & Readiness</h4>
                    <p className="text-gray-300 text-xs">
                      Tabletop exercises, IR playbooks, and targeted training for executives and staff.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-6 text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-cyan-300 mb-2">
                    <MessageCircle className="w-5 h-5" />
                    <h4 className="text-base font-bold">Ready to Explore Enterprise + CyGRiC?</h4>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      className="bg-cyan-500 hover:bg-cyan-600 text-white"
                      onClick={() => window.location.href = 'mailto:sales@fortigap.com'}
                    >
                      Contact Sales
                    </Button>
                    <a href="https://www.cygric.com" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20">
                        Learn more at cygric.com
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Feature Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={getCardClasses(plan)}>
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center py-3 text-sm font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  Most Popular
                </div>
              )}
              
              <CardHeader className={plan.popular ? "pt-16" : "pt-6"}>
                <CardTitle className="text-center">
                  <h3 className="text-xl font-bold text-white mb-3">{plan.name}</h3>
                  <div className="text-center mb-4">
                    {plan.price === "Custom" ? (
                      <div className="text-2xl font-bold text-white">Custom</div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        <span className="text-gray-400 text-sm">/{plan.period}</span>
                        {plan.yearlyPrice && (
                          <div className="text-xs text-green-400 mt-1">
                            {plan.yearlyPrice}/year (save 2 months!)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">{plan.description}</p>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-white text-sm mb-4 flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    Features Included:
                  </h4>
                  <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-300">
                        <Check className="w-4 h-4 mr-3 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-400 mb-3 text-xs">Plan Limitations:</h4>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, idx) => (
                        <li key={idx} className="text-xs text-gray-500">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  className={`w-full ${getButtonClasses(plan)} text-white py-3`}
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
                      Get Started - Contact Sales
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Categories Breakdown */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Feature Categories Explained</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass-effect border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-300 flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2" />
                  Gap Analysis Core
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p className="text-xs">• Security maturity assessments</p>
                <p className="text-xs">• Compliance framework mapping</p>
                <p className="text-xs">• Risk identification & scoring</p>
                <p className="text-xs">• Action item generation</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center text-lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  AI Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p className="text-xs">• Smart recommendations</p>
                <p className="text-xs">• Automated playbook generation</p>
                <p className="text-xs">• Custom policy creation</p>
                <p className="text-xs">• Remediation guidance</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Operational Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p className="text-xs">• Command Center security tools</p>
                <p className="text-xs">• Business Impact Analysis</p>
                <p className="text-xs">• Tabletop exercise management</p>
                <p className="text-xs">• Evidence & compliance tracking</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Back to App */}
        {user && (
          <div className="pt-8 border-t border-gray-700/50 mt-8 text-center">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
