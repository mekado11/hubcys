
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Database, Server, Code, Handshake, Siren, Landmark, KeyRound, GraduationCap, Cloud, ChevronDown, ChevronUp, ShieldQuestion, Sparkles, Info, BarChart } from "lucide-react"; // Added Sparkles, Info, BarChart
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from '@/components/ui/alert'; // Added Alert components
import MaturityLevelGuide from "./MaturityLevelGuide";

export default function MaturitySliders({ data, onUpdate, onNext, onBack, onSave, saving, hasUnsavedChanges }) {
  const [activeTab, setActiveTab] = useState("maturity_identity");
  const [expandedDetails, setExpandedDetails] = useState({});

  const toggleDetails = (categoryKey) => {
    setExpandedDetails(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const handleNotApplicableChange = (categoryKey, isNotApplicable) => {
    const naKey = `${categoryKey}_na`;
    onUpdate(naKey, isNotApplicable);
    
    // If marking as N/A, reset the maturity score to 0
    if (isNotApplicable) {
      onUpdate(categoryKey, 0);
    }
  };

  const categories = [
    {
      key: 'maturity_identity',
      detailKey: 'details_identity',
      naKey: 'maturity_identity_na', // Added naKey
      name: 'Identity',
      icon: Users,
      color: 'cyan',
      description: 'IAM, SSO, MFA, JML processes.',
      placeholder: "Example: We use Okta for SSO across 20 apps, Duo for MFA, and a manual JML process via Jira tickets. Access reviews are conducted quarterly for critical systems.",
      levels: [
        { level: 0, title: "Ad-Hoc Identity", description: "Shared credentials, no formal access control.", example: "Team shares the 'admin' login for servers." },
        { level: 1, title: "Basic IAM", description: "Individual accounts exist, basic password policies.", example: "Users have their own logins, password complexity required." },
        { level: 2, title: "MFA & SSO Adoption", description: "MFA enforced on critical apps, some SSO.", example: "Okta used for Google Workspace and Salesforce." },
        { level: 3, title: "Role-Based Access (RBAC)", description: "Defined roles, automated Joiner/Mover/Leaver (JML).", example: "Engineer role grants access to AWS, Sales role to CRM." },
        { level: 4, title: "Privileged Access Management (PAM)", description: "PAM solution for sensitive access, regular reviews.", example: "CyberArk for production database access." },
        { level: 5, title: "Zero Trust Principles", description: "Continuous verification, context-aware access.", example: "Access decisions based on device health, location, and behavior." }
      ]
    },
    {
      key: 'maturity_asset_management',
      detailKey: 'details_asset_management',
      naKey: 'maturity_asset_management_na', // Added naKey
      name: 'Asset Mgmt',
      icon: Database,
      color: 'purple',
      description: 'Inventory, ownership, and classification.',
      placeholder: "Example: We use an outdated spreadsheet for hardware. Software is tracked by individual teams. We have no formal data classification policy.",
      levels: [
        { level: 0, title: "No Inventory", description: "No formal tracking of hardware or software assets.", example: "We find out about servers when they go down." },
        { level: 1, title: "Manual Spreadsheets", description: "Asset lists are kept manually, often outdated.", example: "An Excel sheet of laptops, updated annually." },
        { level: 2, title: "Automated Discovery", description: "Scanning tools identify assets on the network.", example: "Weekly Nmap scans to find new devices." },
        { level: 3, title: "Centralized CMDB", description: "A central database tracks assets and configurations.", example: "ServiceNow CMDB is the source of truth for assets." },
        { level: 4, title: "Ownership & Classification", description: "Assets have defined owners and data is classified.", example: "All S3 buckets have an owner tag and data sensitivity label." },
        { level: 5, title: "Lifecycle Management", description: "Full lifecycle from procurement to disposal is tracked.", example: "Automated process for de-provisioning assets of leavers." }
      ]
    },
    {
      key: 'maturity_infra_security',
      detailKey: 'details_infra_security',
      naKey: 'maturity_infra_security_na', // Added naKey
      name: 'Infra Security',
      icon: Server,
      color: 'green',
      description: 'Endpoints, firewalls, and networks.',
      placeholder: "Example: We use Crowdstrike for EDR on all endpoints. Our network is flat, but we have a Palo Alto perimeter firewall. Patching is done 'best effort'.",
      levels: [
        { level: 0, title: "No Defenses", description: "No endpoint protection or network firewalls.", example: "Devices connect directly to the internet." },
        { level: 1, title: "Basic Defenses", description: "Antivirus on endpoints, basic perimeter firewall.", example: "Windows Defender and a basic office firewall." },
        { level: 2, title: "Hardening & Patching", description: "Systems hardened, regular vulnerability patching.", example: "CIS benchmarks applied, Patch Tuesday is managed." },
        { level: 3, title: "Network Segmentation", description: "Internal network is segmented to limit lateral movement.", example: "Production network is separate from corporate VLANs." },
        { level: 4, title: "EDR & Advanced Firewalls", description: "Endpoint Detection & Response (EDR) and NGFW/WAF.", example: "Crowdstrike Falcon deployed, Palo Alto firewall with threat intel." },
        { level: 5, title: "Micro-segmentation", description: "Workloads are isolated with granular policies.", example: "Illumio prevents any unauthorized server-to-server communication." }
      ]
    },
    {
      key: 'maturity_app_security',
      detailKey: 'details_app_security',
      naKey: 'maturity_app_security_na', // Added naKey
      name: 'App Security',
      icon: Code,
      color: 'yellow',
      description: 'SDLC, code scanning, and dependencies.',
      placeholder: "Example: Developers receive annual OWASP Top 10 training. We use Snyk for dependency scanning in our CI/CD pipeline, but no static analysis (SAST) is currently performed.",
      levels: [
        { level: 0, title: "No AppSec", description: "No security involvement in software development.", example: "Security is an afterthought, post-deployment." },
        { level: 1, title: "Occasional Testing", description: "Annual penetration tests on major applications.", example: "We hire a pentester once a year before our big release." },
        { level: 2, title: "Developer Training", description: "Developers receive secure coding training.", example: "Mandatory OWASP Top 10 training for all new developers." },
        { level: 3, title: "Integrated SAST/DAST", description: "Static and dynamic scanning integrated into CI/CD.", example: "Checkmarx scans run on every pull request." },
        { level: 4, title: "Dependency Management", description: "Software Composition Analysis (SCA) manages libraries.", example: "Snyk scans for vulnerable dependencies and suggests fixes." },
        { level: 5, title: "Threat Modeling", description: "Threat modeling is a standard part of design.", example: "STRIDE models are created for all new microservices." }
      ]
    },
    {
      key: 'maturity_third_party_risk',
      detailKey: 'details_third_party_risk',
      naKey: 'maturity_third_party_risk_na',
      name: 'Supply Chain Risk',
      icon: Handshake,
      color: 'orange',
      description: 'Vendor & supplier security management.',
      placeholder: "Example: We send a simple security questionnaire to new vendors but have no process for re-assessment. We use SecurityScorecard for our top 5 critical vendors.",
      levels: [
        { level: 0, title: "No Vendor Review", description: "Vendors are onboarded without security checks.", example: "We use whatever SaaS tool the team wants." },
        { level: 1, title: "Basic Questionnaires", description: "Simple security questionnaires sent to vendors.", example: "We send a checklist from a template we found online." },
        { level: 2, title: "Risk-Based Assessments", description: "Assessments are based on vendor criticality.", example: "Vendors handling PII get a full SIG questionnaire." },
        { level: 3, title: "Contractual Requirements", description: "Security requirements are included in contracts.", example: "Contracts require vendors to be SOC 2 compliant." },
        { level: 4, title: "Continuous Monitoring", description: "Vendor security posture is monitored continuously.", example: "We use SecurityScorecard to monitor our critical vendors." },
        { level: 5, title: "Supply Chain Integration", description: "Deep integration, SBOM review, and validation of vendor security.", example: "We have right-to-audit clauses and perform our own vendor pentests." }
      ]
    },
    {
      key: 'maturity_incident_response',
      detailKey: 'details_incident_response',
      naKey: 'maturity_incident_response_na', // Added naKey
      name: 'Incident Response',
      icon: Siren,
      color: 'red',
      description: 'IR plan, DR testing, RTO/RPO.',
      placeholder: "Example: We have a documented IR plan that was last tested 18 months ago. We use Splunk for logs but have no formal playbooks. Our RTO/RPO are undefined.",
      levels: [
        { level: 0, title: "No Plan", description: "No documented incident response plan.", example: "If something happens, we panic and call IT." },
        { level: 1, title: "Basic Plan", description: "A basic, informal plan exists.", example: "A Word doc with some steps for malware." },
        { level: 2, title: "Documented & Tested", description: "Formal plan is documented and tested annually.", example: "We run a tabletop exercise for a ransomware scenario each year." },
        { level: 3, title: "Defined Roles & Playbooks", description: "Clear roles, responsibilities, and step-by-step playbooks.", example: "The IR playbook for data breaches specifies legal, PR, and tech steps." },
        { level: 4, title: "SOAR & Automation", description: "Security Orchestration, Automation, and Response is used.", example: "Phishing alerts automatically trigger account suspension and sandboxing." },
        { level: 5, title: "Disaster Recovery Tested", description: "Full DR failover is tested with defined RTO/RPO.", example: "We can failover our production environment to DR in under 4 hours." }
      ]
    },
    {
      key: 'maturity_governance_risk',
      detailKey: 'details_governance_risk',
      naKey: 'maturity_governance_risk_na', // Added naKey
      name: 'Governance & Risk',
      icon: Landmark,
      color: 'blue',
      description: 'Policies, risk assessments, exec oversight.',
      placeholder: "Example: We have key policies like AUP and an InfoSec Policy stored on a wiki. A risk register exists in Excel but is rarely updated. CISO provides a quarterly update to the exec team.",
      levels: [
        { level: 0, title: "No Governance", description: "No formal policies or risk management.", example: "We operate on tribal knowledge." },
        { level: 1, title: "Basic Policies", description: "Some key policies (e.g., AUP) are documented.", example: "We have an Acceptable Use Policy for new employees." },
        { level: 2, title: "Formal Policy Library", description: "A comprehensive set of security policies exists.", example: "All policies are stored in SharePoint and reviewed annually." },
        { level: 3, title: "Risk Register", description: "A formal risk register is maintained and reviewed.", example: "The CISO reviews the top 10 risks with the board quarterly." },
        { level: 4, title: "GRC Tooling", description: "A GRC tool is used to manage compliance and risk.", example: "We use Vanta to map controls to our policies and frameworks." },
        { level: 5, title: "Executive Oversight", description: "Security risk is a board-level conversation.", example: "The CEO can speak to the company's key cyber risks." }
      ]
    },
    {
      key: 'maturity_data_protection',
      detailKey: 'details_data_protection',
      naKey: 'maturity_data_protection_na', // Added naKey
      name: 'Data Protection',
      icon: KeyRound,
      color: 'indigo',
      description: 'Encryption, backups, and retention.',
      placeholder: "Example: All our production databases on AWS RDS are encrypted at rest. We use TLS 1.2 for all external traffic. Backups are performed daily but we only test restores annually.",
      levels: [
        { level: 0, title: "No Protection", description: "Data is not encrypted at rest or in transit.", example: "Data is stored in plain text on servers." },
        { level: 1, title: "Transit Encryption", description: "TLS is used for external-facing sites.", example: "Our website uses HTTPS." },
        { level: 2, title: "At-Rest Encryption", description: "Databases and storage are encrypted.", example: "Our AWS RDS instances and S3 buckets have encryption enabled." },
        { level: 3, title: "Data Classification", description: "Data is classified by sensitivity level.", example: "Data is tagged as Public, Internal, or Confidential." },
        { level: 4, title: "DLP & Backups", description: "Data Loss Prevention tools and tested backups are in place.", example: "DLP alerts on PII leaving the network; backups are restored weekly." },
        { level: 5, title: "Key Management", description: "Customer-managed encryption keys (CMEK) are used.", example: "We use a KMS for granular control over data encryption." }
      ]
    },
    {
      key: 'maturity_security_training',
      detailKey: 'details_security_training',
      naKey: 'maturity_security_training_na', // Added naKey
      name: 'Security Training',
      icon: GraduationCap,
      color: 'pink',
      description: 'Employee awareness, social engineering.',
      placeholder: "Example: We use KnowBe4 for annual awareness training and monthly phishing simulations. Our click rate is currently 12%. No role-based training is provided.",
      levels: [
        { level: 0, title: "No Training", description: "No security training for employees.", example: "Employees learn about security from the news." },
        { level: 1, title: "Annual Training", description: "Once-a-year generic security awareness training.", example: "A mandatory 30-minute video every October." },
        { level: 2, title: "Phishing Simulations", description: "Regular phishing tests are sent to employees.", example: "We send a monthly phishing test and track click rates." },
        { level: 3, title: "Role-Based Training", description: "Training is tailored to specific job roles.", example: "Devs get secure coding training, finance gets BEC training." },
        { level: 4, title: "Security Champions", description: "A program for security advocates in different teams.", example: "We have a security champion in each engineering squad." },
        { level: 5, title: "Embedded Security Culture", description: "Security is a shared responsibility and valued.", example: "Employees proactively report suspicious activity." }
      ]
    },
    {
      key: 'maturity_cloud_security',
      detailKey: 'details_cloud_security',
      naKey: 'maturity_cloud_security_na', // Added naKey
      name: 'Cloud Security',
      icon: Cloud,
      color: 'teal',
      description: 'IAM, misconfigs, workload isolation.',
      placeholder: "Example: We are primarily an AWS shop. We use Security Hub for posture management. IAM roles are often overly permissive. We have no runtime protection for our EKS containers.",
      levels: [
        { level: 0, title: "No Cloud Security", description: "Using cloud with default 'allow all' settings.", example: "Our S3 buckets are public." },
        { level: 1, title: "Basic IAM", description: "Using basic cloud IAM roles, no fine-grained access.", example: "We have an 'admin' and 'read-only' role in AWS." },
        { level: 2, title: "CSPM Tooling", description: "Cloud Security Posture Management tools are used.", example: "AWS Security Hub alerts us to misconfigurations." },
        { level: 3, title: "Least Privilege", description: "IAM policies are scoped to the minimum required access.", example: "The service role for our Lambda can only write to one DynamoDB table." },
        { level: 4, title: "Workload Protection (CWPP)", description: "Runtime protection for containers and VMs.", example: "Aqua Security scans our containers for vulnerabilities." },
        { level: 5, title: "Automated Remediation", description: "Misconfigurations are automatically fixed.", example: "A public S3 bucket is automatically made private within 60 seconds." }
      ]
    },
    {
      key: 'maturity_business_continuity',
      detailKey: 'details_business_continuity',
      naKey: 'maturity_business_continuity_na',
      name: 'Business Continuity',
      icon: ShieldQuestion,
      color: 'lime',
      description: 'BCP, DR, crisis management, backups.',
      placeholder: "Example: We have a BCP and DR plan that is tested annually via a tabletop exercise. Backups are performed daily with weekly restore tests for critical systems.",
      levels: [
        { level: 0, title: "No Plan", description: "No formal business continuity or disaster recovery plan.", example: "If our primary site goes down, we are offline." },
        { level: 1, title: "Backup Strategy Only", description: "Data backups exist but no formal recovery plan.", example: "We backup our data but have never tested a full restore." },
        { level: 2, title: "Documented BCP/DR Plan", description: "Formal plans exist but are not regularly tested.", example: "We have a written DR plan but it's two years old." },
        { level: 3, title: "Tested BCP/DR Plan", description: "Plans are tested at least annually, with some findings.", example: "We ran a DR test and found we couldn't meet our RTO." },
        { level: 4, title: "Defined RTO/RPO", description: "Recovery Time/Point Objectives are defined and tested.", example: "We have a 4-hour RTO and 1-hour RPO for critical services." },
        { level: 5, title: "Integrated Crisis Management", description: "Crisis management is integrated with BCP/DR and tested.", example: "Our crisis team, including legal and PR, drills with the tech team." }
      ]
    }
  ];

  const getColorClass = (color) => {
    const colors = {
      cyan: 'text-cyan-300 border-cyan-500/30',
      purple: 'text-purple-300 border-purple-500/30',
      green: 'text-green-300 border-green-500/30',
      yellow: 'text-yellow-300 border-yellow-500/30',
      orange: 'text-orange-300 border-orange-500/30',
      red: 'text-red-300 border-red-500/30',
      blue: 'text-blue-300 border-blue-500/30',
      indigo: 'text-indigo-300 border-indigo-500/30',
      pink: 'text-pink-300 border-pink-500/30',
      teal: 'text-teal-300 border-teal-500/30',
      lime: 'text-lime-300 border-lime-500/30'
    };
    return colors[color] || colors.cyan;
  };

  // Effect for preventing accidental page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault(); // Standard for browser to show prompt
        event.returnValue = ''; // For older browsers (Safari, etc.)
        return ''; // For some browsers to show prompt
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Derived values for AI Generation Notice and TabsTrigger
  const hasAnyScore = categories.some(d => (data[d.key] || 0) > 0);
  const hasAnyDetails = categories.some(d => data[d.detailKey] && data[d.detailKey].trim().length > 0);

  return (
    <TooltipProvider>
      <Card className="glass-effect border-purple-500/30"> {/* Updated border color */}
        <CardHeader>
          <CardTitle className="text-2xl text-purple-300 flex items-center gap-2"> {/* Updated text color and added flex with icon */}
            <BarChart className="w-6 h-6" />
            Security Maturity Assessment
          </CardTitle>
          <p className="text-gray-400 text-sm mt-2"> {/* Updated description text size */}
            Rate your organization's maturity level (0-5) for each security domain
          </p>
        </CardHeader>
        <CardContent>
          {/* AI Generation Notice */}
          {hasAnyScore && ( // Only show if at least one score is > 0 (implying AI prepopulation)
            <Alert className="bg-purple-900/20 border-purple-500/30 mb-8"> {/* Added mb-8 for spacing */}
              <Sparkles className="w-5 h-5 text-purple-400" />
              <AlertDescription className="text-purple-200">
                <strong>AI-Generated Initial Scores:</strong> The scores and descriptions below have been
                pre-populated by our AI based on your company profile, industry, and selected framework.
                Please review and adjust them based on your actual security posture.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-auto bg-slate-800/50 p-2"> {/* Updated grid, removed w-full and mb-8, added gap, h-auto, p-2 */}
              {categories.map((category) => {
                const Icon = category.icon;
                const value = data[category.key] || 0;
                const isNA = data[category.naKey] || false; // Get N/A status

                // New logic for content indicator
                const score = isNA ? "N/A" : (data[category.key] || 0);
                const hasContent = (data[category.key] || 0) > 0 || (data[category.detailKey] && data[category.detailKey].trim().length > 0);

                return (
                  <TabsTrigger
                    key={category.key}
                    value={category.key}
                    className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 relative" // Updated active state colors
                  >
                    {/* Content indicator */}
                    {hasContent && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                    <Icon className="w-5 h-5 mb-1" /> {/* Increased icon size as per outline */}
                    <span className="text-xs text-center leading-tight">{category.name}</span> {/* Removed .split(' ')[0] to show full name, added text-center leading-tight */}
                    {/* Conditional Badge styling based on N/A and category color */}
                    <Badge
                      variant="secondary"
                      className={`mt-1 text-xs ${
                        isNA
                          ? 'bg-gray-500/50 text-gray-300' // Use gray for N/A
                          : `bg-${category.color}-500/50 text-${category.color}-300` // Use category's color for active
                      }`}
                    >
                      {score}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {categories.map((category) => {
              const Icon = category.icon;
              const value = data[category.key] || 0;
              const isNA = data[category.naKey] || false; // Get N/A status
              const isExpanded = expandedDetails[category.key];
              const currentLevel = category.levels[value];
              
              return (
                <TabsContent key={category.key} value={category.key} className="space-y-6 mt-6"> {/* Updated TabsContent className */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-lg bg-${category.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${category.color}-400`} />
                        </div>
                        <div className="flex-1 mx-4">
                          <h3 className="font-semibold text-white">{category.name}</h3>
                          <p className="text-sm text-gray-400">{category.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${
                            isNA 
                              ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' 
                              : `${getColorClass(category.color)} bg-${category.color}-500/20 border`
                          }`}>
                            {isNA ? 'Not Applicable' : `Level ${value}`}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Not Applicable Checkbox */}
                      <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-gray-700/50">
                        <Checkbox
                          id={`${category.key}_na`}
                          checked={isNA}
                          onCheckedChange={(checked) => handleNotApplicableChange(category.key, checked)}
                          className="data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-500"
                        />
                        <Label 
                          htmlFor={`${category.key}_na`} 
                          className="text-sm font-medium text-gray-300 cursor-pointer"
                        >
                          Not Applicable to our organization
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-4 h-4 rounded-full bg-gray-600 text-xs flex items-center justify-center text-white">?</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">
                              Check this if {category.name.toLowerCase()} doesn't apply to your organization. 
                              This domain will be excluded from your overall score calculation.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Conditionally render slider and details if not N/A */}
                      {!isNA && (
                        <>
                          {/* Add a subtle indicator if AI-generated for this specific detail field */}
                          {data[category.detailKey] && data[category.detailKey].trim().length > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-purple-900/10 rounded-lg border border-purple-500/20">
                              <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-purple-200">
                                This description was AI-generated based on your company profile. 
                                Please review and edit to reflect your actual practices.
                              </p>
                            </div>
                          )}

                          <div className="px-4">
                            <Slider
                              value={[value]}
                              onValueChange={(newValue) => onUpdate(category.key, newValue[0])}
                              max={5}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              {[0,1,2,3,4,5].map(level => (
                                <Tooltip key={level}>
                                  <TooltipTrigger>
                                    <span className={value === level ? 'text-cyan-300 font-bold' : ''}>{level}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold">{category.levels[level]?.title}</p>
                                    {category.levels[level]?.example && (
                                      <p className="text-xs mt-1 italic">e.g., {category.levels[level].example}</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <div className="mb-3">
                              <p className="text-sm text-gray-300 mb-1">
                                <strong>Current Level {value}:</strong> {currentLevel?.title}
                              </p>
                              <p className="text-xs text-gray-400">{currentLevel?.description}</p>
                              {currentLevel?.example && (
                                <p className="text-xs text-cyan-300 mt-1 italic">Example: {currentLevel.example}</p>
                              )}
                            </div>
                            
                            <Collapsible open={isExpanded} onOpenChange={() => toggleDetails(category.key)}>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 w-full justify-center">
                                  {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                  {isExpanded ? 'Hide Details' : 'Add Details for Better Smart Analysis'}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-4 space-y-6">
                                <div>
                                  <Label htmlFor={category.detailKey} className="text-sm font-semibold text-cyan-300 mb-2 block">
                                    Provide specific details about your environment for {category.name}.
                                  </Label>
                                  <Textarea
                                    id={category.detailKey}
                                    value={data[category.detailKey] || ""}
                                    onChange={(e) => onUpdate(category.detailKey, e.target.value)}
                                    placeholder={category.placeholder}
                                    className="bg-slate-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 h-32"
                                  />
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </>
                      )}

                      {/* Display message if N/A is checked */}
                      {isNA && (
                        <div className="bg-gray-800/30 rounded-lg p-6 text-center border border-gray-600/30">
                          <p className="text-gray-400 text-sm">
                            This domain has been marked as "Not Applicable" and will be excluded from your assessment scoring.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="lg:col-span-1">
                      {/* Conditionally render MaturityLevelGuide if not N/A */}
                      {!isNA && (
                        <MaturityLevelGuide 
                          category={category}
                          currentLevel={value}
                          allLevels={category.levels}
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
          
          <div className="pt-6 border-t border-slate-700/50 mt-8">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">Compliance Management & Evidence Collection</h3>
            <div className="space-y-2">
              <Label htmlFor="compliance_tooling_details" className="text-gray-300">
                How do you currently track compliance obligations and manage evidence collection? Include tools, processes, and challenges.
              </Label>
              <Textarea
                id="compliance_tooling_details"
                value={data.compliance_tooling_details || ""}
                onChange={(e) => onUpdate('compliance_tooling_details', e.target.value)}
                placeholder="Examples: 'We use Vanta for SOC 2 continuous monitoring and evidence automation. Manual evidence collection for ISO 27001. Quarterly compliance reviews with legal team. Main challenge is keeping policies updated and ensuring consistent implementation across teams.'"
                className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 h-28"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
