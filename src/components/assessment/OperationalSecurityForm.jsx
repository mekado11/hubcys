import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, Users, Monitor, Cloud, Key, Eye, ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OperationalSecurityForm({ data, onUpdate, onNext, onBack, onSave, saving }) {
  const handleUpdate = (field, value) => {
    onUpdate(field, value);
  };

  const isComplete = () => {
    const requiredFields = [
      'ops_local_admin_privileges',
      'ops_software_installation_control',
      'ops_byod_security_controls',
      'ops_remote_access_method',
      'ops_unsanctioned_cloud_apps',
      'ops_personal_cloud_storage',
      'ops_patch_management_cadence',
      'ops_mobile_device_management',
      'ops_data_classification_system',
      'ops_network_access_control',
      'ops_offboarding_data_management',
      'ops_endpoint_edr_coverage',
      'ops_centralized_logging_siem',
      'ops_vulnerability_scanning_frequency',
      'ops_data_loss_prevention',
      'ops_security_baseline_enforcement'
    ];
    
    return requiredFields.every(field => data[field]);
  };

  const questionSections = [
    {
      title: "Endpoint & Device Management",
      icon: Monitor,
      description: "Understanding device control and software management practices",
      questions: [
        {
          id: 'ops_local_admin_privileges',
          question: "What is the approximate percentage of end-user workstations (laptops, desktops) where users have local administrator privileges?",
          options: [
            { value: "0-10%", label: "0-10% (Few or none)", risk: "low" },
            { value: "11-30%", label: "11-30% (Some users)", risk: "medium" },
            { value: "31-60%", label: "31-60% (Many users)", risk: "high" },
            { value: "61-90%", label: "61-90% (Most users)", risk: "critical" },
            { value: "91-100%", label: "91-100% (Almost all users)", risk: "critical" }
          ]
        },
        {
          id: 'ops_software_installation_control',
          question: "How is new software typically installed on company-issued endpoints?",
          options: [
            { value: "centrally_managed", label: "Centrally managed (e.g., SCCM, Intune, application store)", risk: "low" },
            { value: "requires_it_approval", label: "Requires IT approval and manual installation by IT staff", risk: "medium" },
            { value: "user_download_it_approval", label: "Users can download software but require IT approval for admin rights", risk: "high" },
            { value: "user_download_free", label: "Users can download and install software freely using local admin privileges", risk: "critical" }
          ]
        },
        {
          id: 'ops_patch_management_cadence',
          question: "How frequently are security patches (for operating systems and major applications) deployed to end-user workstations and laptops?",
          options: [
            { value: "continuous_weekly", label: "Continuously/Weekly (automated deployment)", risk: "low" },
            { value: "monthly", label: "Monthly (within standard patch cycles)", risk: "medium" },
            { value: "quarterly", label: "Quarterly (less frequent, but still regular)", risk: "high" },
            { value: "ad_hoc", label: "Less often than quarterly, or on an ad-hoc basis (reactive)", risk: "critical" }
          ]
        },
        {
          id: 'ops_endpoint_edr_coverage',
          question: "What percentage of all endpoints (laptops, desktops, servers) have Endpoint Detection and Response (EDR) solutions deployed for advanced threat detection and response?",
          description: "EDR solutions provide continuous monitoring, threat detection, investigation, and response capabilities beyond traditional antivirus.",
          options: [
            { value: "no_edr", label: "0% (No EDR deployed)", risk: "critical" },
            { value: "pilot_limited", label: "1-25% (Pilot or very limited deployment)", risk: "high" },
            { value: "partial_deployment", label: "26-75% (Partial deployment)", risk: "medium" },
            { value: "comprehensive_coverage", label: "76-100% (Comprehensive coverage)", risk: "low" }
          ]
        }
      ]
    },
    {
      title: "BYOD & Remote Access",
      icon: Users,
      description: "Personal device usage and remote connectivity security",
      questions: [
        {
          id: 'ops_byod_security_controls',
          question: "Does your organization have a formal policy for Bring Your Own Device (BYOD), and are personal devices used for work subject to security controls?",
          options: [
            { value: "not_permitted", label: "BYOD is not permitted", risk: "low" },
            { value: "comprehensive_controls", label: "Comprehensive BYOD policy with strong security controls (MDM, app wrapping)", risk: "low" },
            { value: "limited_controls", label: "BYOD policy exists, but security controls are limited or inconsistently applied", risk: "medium" },
            { value: "no_policy_controls", label: "BYOD is permitted, but there are no formal policies or security controls", risk: "critical" }
          ]
        },
        {
          id: 'ops_remote_access_method',
          question: "How do remote employees access internal company networks and sensitive data?",
          options: [
            { value: "zero_trust", label: "Zero Trust Network Access (ZTNA) or other secure remote access solutions", risk: "low" },
            { value: "vpn_with_mfa", label: "VPN with enforced multi-factor authentication (MFA)", risk: "medium" },
            { value: "basic_vpn", label: "Basic VPN without multi-factor authentication (MFA)", risk: "high" },
            { value: "direct_internet", label: "Direct internet access (no VPN or secure gateway)", risk: "critical" }
          ]
        },
        {
          id: 'ops_mobile_device_management',
          question: "What percentage of company-owned mobile devices (smartphones, tablets) are managed by a Mobile Device Management (MDM) or Unified Endpoint Management (UEM) solution?",
          options: [
            { value: "76-100%", label: "76-100% (Majority or all devices managed)", risk: "low" },
            { value: "26-75%", label: "26-75% (Partial deployment)", risk: "medium" },
            { value: "1-25% (Pilot or very limited deployment)", label: "1-25% (Pilot or very limited deployment)", risk: "high" },
            { value: "0%", label: "0% (No MDM/UEM)", risk: "critical" }
          ]
        }
      ]
    },
    {
      title: "Shadow IT & Cloud Services",
      icon: Cloud,
      description: "Unsanctioned application usage and data storage practices",
      questions: [
        {
          id: 'ops_unsanctioned_cloud_apps',
          question: "How does your organization identify and manage the use of unsanctioned cloud applications (SaaS) by employees (Shadow IT)?",
          options: [
            { value: "comprehensive_monitoring", label: "Comprehensive monitoring (CASB solution, network traffic analysis) with policies to control usage", risk: "low" },
            { value: "basic_monitoring", label: "Basic monitoring tools (firewall logs, manual audits) to identify unsanctioned apps", risk: "medium" },
            { value: "reactive_approach", label: "Reactive approach: investigate only when a security incident or report occurs", risk: "high" },
            { value: "no_process", label: "No process is in place to identify or manage unsanctioned apps", risk: "critical" }
          ]
        },
        {
          id: 'ops_personal_cloud_storage',
          question: "What is your company's policy and enforcement regarding employees storing company data on personal cloud storage services?",
          options: [
            { value: "dlp_monitoring", label: "Technical controls (DLP, network monitoring) actively prevent and detect unauthorized uploads", risk: "low" },
            { value: "technical_blocking", label: "Technical controls block access to personal cloud storage from company networks/devices", risk: "medium" },
            { value: "policy_no_enforcement", label: "Policy prohibits it, but no technical enforcement mechanisms", risk: "high" },
            { value: "no_policy", label: "No policy or restrictions exist", risk: "critical" }
          ]
        }
      ]
    },
    {
      title: "Network & Data Governance",
      icon: Key,
      description: "Network access control and data management practices",
      questions: [
        {
          id: 'ops_network_access_control',
          question: "How are devices (both company-owned and personal) authenticated and authorized when connecting to your internal corporate network?",
          options: [
            { value: "nac_solution", label: "Network Access Control (NAC) solution authenticates users/devices, checks health, enforces segmentation", risk: "low" },
            { value: "credential_registration", label: "Requires credentials for Wi-Fi/wired access; basic device registration", risk: "medium" },
            { value: "basic_authentication", label: "Basic network authentication (shared Wi-Fi password for guests/employees)", risk: "high" },
            { value: "open_access", label: "Open access (anyone can connect)", risk: "critical" }
          ]
        },
        {
          id: 'ops_data_classification_system',
          question: "Is a formal data classification system (e.g., Public, Internal, Confidential, Restricted) defined and consistently applied across all company data assets?",
          options: [
            { value: "enforced_technical", label: "Well-defined, documented, and actively enforced with technical controls", risk: "low" },
            { value: "defined_inconsistent", label: "Defined and documented, but enforcement is inconsistent or manual", risk: "medium" },
            { value: "general_understanding", label: "General understanding of data sensitivity exists, but no formal classification system", risk: "high" },
            { value: "no_system", label: "No formal data classification system exists", risk: "critical" }
          ]
        },
        {
          id: 'ops_offboarding_data_management',
          question: "When an employee leaves the company, what is the standard process for revoking access and ensuring company data is secured on all devices?",
          options: [
            { value: "automated_workflows", label: "Automated de-provisioning workflows integrated with identity management and MDM solutions", risk: "low" },
            { value: "standardized_checklist", label: "Standardized checklist including remote wipe/container removal for all devices", risk: "medium" },
            { value: "manual_checklist", label: "Manual checklist for IT; data removal from personal devices is not enforced", risk: "high" },
            { value: "no_process", label: "No formal process; relies on the employee to remove data", risk: "critical" }
          ]
        }
      ]
    },
    {
      title: "Advanced Security Controls",
      icon: Eye,
      description: "Monitoring, detection, and vulnerability management capabilities",
      questions: [
        {
          id: 'ops_centralized_logging_siem',
          question: "Are security logs from critical systems (servers, firewalls, endpoints) centrally collected and analyzed by a Security Information and Event Management (SIEM) system or similar log management solution?",
          options: [
            { value: "siem_real_time", label: "Yes, logs are centrally collected and fed into a SIEM (or similar) for real-time correlation and alerting", risk: "low" },
            { value: "basic_collection_analysis", label: "Logs are centrally collected and stored, but analysis is basic or inconsistent", risk: "medium" },
            { value: "manual_review_only", label: "Logs are collected, but only reviewed manually/reactively during incidents", risk: "high" },
            { value: "no_central_logging", label: "No central logging or analysis", risk: "critical" }
          ]
        },
        {
          id: 'ops_vulnerability_scanning_frequency',
          question: "How often are vulnerability scans performed on all endpoints (laptops, desktops, servers) to identify software vulnerabilities and misconfigurations?",
          options: [
            { value: "monthly_automated", label: "Monthly or more frequently (automated and integrated into patching cycles)", risk: "low" },
            { value: "quarterly_semi", label: "Quarterly or semi-annually", risk: "medium" },
            { value: "annually_less", label: "Annually or less frequently", risk: "high" },
            { value: "never_on_request", label: "Never, or only upon request/incident", risk: "critical" }
          ]
        },
        {
          id: 'ops_data_loss_prevention',
          question: "Are Data Loss Prevention (DLP) measures implemented on endpoints to prevent sensitive company data from being exfiltrated (e.g., copied to USB, uploaded to personal cloud, sent via unauthorized email)?",
          options: [
            { value: "comprehensive_dlp", label: "Comprehensive DLP solution is deployed, actively monitoring and blocking sensitive data exfiltration attempts", risk: "low" },
            { value: "basic_dlp", label: "Basic DLP (e.g., blocking USBs, preventing specific websites) is implemented", risk: "medium" },
            { value: "policy_no_enforcement", label: "Policies exist, but no technical enforcement or monitoring", risk: "high" },
            { value: "no_dlp", label: "No DLP measures in place", risk: "critical" }
          ]
        },
        {
          id: 'ops_security_baseline_enforcement',
          question: "Are security baseline configurations (e.g., CIS Benchmarks, custom hardening standards) defined and automatically enforced/monitored across all company endpoints?",
          options: [
            { value: "automated_enforcement", label: "Yes, baselines are centrally managed and automatically enforced/monitored (e.g., via Group Policy, MDM, configuration management tools), with automated remediation of deviations", risk: "low" },
            { value: "periodic_audits", label: "Baselines are defined and implemented, with periodic audits for compliance", risk: "medium" },
            { value: "manual_inconsistent", label: "Baselines are defined but manually implemented or inconsistently applied", risk: "high" },
            { value: "no_baselines", label: "No defined security baselines", risk: "critical" }
          ]
        }
      ]
    }
  ];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'low': return <Shield className="w-4 h-4" />;
      case 'medium': case 'high': case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Operational Security Practices</h2>
        </div>
        <p className="text-gray-400 max-w-3xl mx-auto">
          These questions help us understand your organization's current practices around device management, 
          remote access, shadow IT, and endpoint security controls.
        </p>
      </div>

      {/* Question Sections */}
      {questionSections.map((section, sectionIndex) => {
        const SectionIcon = section.icon;
        
        return (
          <Card key={sectionIndex} className="glass-effect border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-cyan-300">
                <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center">
                  <SectionIcon className="w-5 h-5" />
                </div>
                {section.title}
              </CardTitle>
              <p className="text-gray-400 text-sm">{section.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.questions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <Label className="text-white font-medium leading-relaxed">
                    {question.question}
                    {question.description && (
                      <span className="block text-sm text-gray-400 mt-1 font-normal">
                        {question.description}
                      </span>
                    )}
                  </Label>
                  <Select
                    value={data[question.id] || ""}
                    onValueChange={(value) => handleUpdate(question.id, value)}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 max-w-2xl">
                      {question.options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-white hover:bg-slate-700 focus:bg-slate-700 px-3 py-2"
                        >
                          <div className="flex items-start justify-between w-full max-w-full">
                            <span className="flex-1 pr-3 text-sm leading-tight break-words">{option.label}</span>
                            <div className={`flex items-center gap-1 ml-3 flex-shrink-0 ${getRiskColor(option.risk)}`}>
                              {getRiskIcon(option.risk)}
                              <span className="text-xs font-medium capitalize">{option.risk}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-700">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={async () => { await onSave(); }}
            disabled={saving}
            variant="outline"
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/20"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button
            onClick={onNext}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-8 py-3 text-lg"
          >
            Continue to Maturity Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}