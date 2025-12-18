import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Building, Database, Factory } from "lucide-react";

export default function FrameworkSpecificQuestions({ framework, onResponseChange }) {
  const [responses, setResponses] = useState({});

  const handleResponseChange = (questionKey, value) => {
    const newResponses = { ...responses, [questionKey]: value };
    setResponses(newResponses);
    onResponseChange(newResponses);
  };

  const getFrameworkConfig = (framework) => {
    const configs = {
      FEDRAMP: {
        icon: Shield,
        color: "blue",
        title: "FedRAMP Specific Assessment",
        description: "Federal Risk and Authorization Management Program requirements for cloud service providers",
        questions: [
          {
            key: "fedramp_level",
            label: "What FedRAMP authorization level are you targeting?",
            type: "select",
            options: [
              { value: "low", label: "Low Impact (FedRAMP Low)" },
              { value: "moderate", label: "Moderate Impact (FedRAMP Moderate)" },
              { value: "high", label: "High Impact (FedRAMP High)" }
            ],
            required: true
          },
          {
            key: "cloud_service_type",
            label: "What type of cloud service do you provide?",
            type: "select",
            options: [
              { value: "saas", label: "Software as a Service (SaaS)" },
              { value: "paas", label: "Platform as a Service (PaaS)" },
              { value: "iaas", label: "Infrastructure as a Service (IaaS)" }
            ]
          },
          {
            key: "continuous_monitoring",
            label: "Describe your continuous monitoring capabilities and tools (ConMon)",
            type: "textarea",
            placeholder: "Detail your continuous monitoring implementation, including tools like Splunk, security scanning frequency, vulnerability management processes, and how you handle the monthly ConMon deliverables..."
          },
          {
            key: "boundary_protection",
            label: "How do you implement boundary protection and network segmentation?",
            type: "textarea",
            placeholder: "Describe your network architecture, firewalls, DMZ implementation, network segmentation strategies, and how you protect the authorization boundary..."
          },
          {
            key: "cryptographic_controls",
            label: "What FIPS 140-2 validated cryptographic modules and encryption standards do you use?",
            type: "textarea",
            placeholder: "List your FIPS 140-2 validated encryption modules, TLS versions, encryption at rest and in transit implementations, key management practices..."
          }
        ]
      },
      CMMC: {
        icon: Building,
        color: "green",
        title: "CMMC Specific Assessment",
        description: "Cybersecurity Maturity Model Certification for DoD contractors",
        questions: [
          {
            key: "cmmc_level",
            label: "What CMMC level does your contract require?",
            type: "select",
            options: [
              { value: "level1", label: "CMMC Level 1 (Foundational)" },
              { value: "level2", label: "CMMC Level 2 (Advanced)" },
              { value: "level3", label: "CMMC Level 3 (Expert)" }
            ],
            required: true
          },
          {
            key: "cui_handling",
            label: "How do you handle Controlled Unclassified Information (CUI)?",
            type: "textarea",
            placeholder: "Describe how you identify, mark, protect, and dispose of CUI. Include data classification processes, access controls, and storage requirements..."
          },
          {
            key: "supply_chain_security",
            label: "What supply chain security measures do you have in place?",
            type: "textarea",
            placeholder: "Detail your supplier vetting process, supply chain risk assessments, requirements flowing down to subcontractors, and how you ensure suppliers meet CMMC requirements..."
          },
          {
            key: "incident_reporting",
            label: "How do you handle cybersecurity incident reporting to DoD?",
            type: "textarea",
            placeholder: "Describe your incident detection, classification, and reporting procedures, including timeline for reporting to DoD (72 hours), DIBNet reporting, and coordination with DCSA..."
          },
          {
            key: "system_media_protection",
            label: "What controls do you have for system and communications protection?",
            type: "textarea",
            placeholder: "Detail your approach to system boundaries, communications security, network segmentation, and protection of system media and communications..."
          }
        ]
      },
      SOX_ITGC: {
        icon: Database,
        color: "purple",
        title: "SOX IT General Controls Assessment",
        description: "Sarbanes-Oxley IT General Controls for financial reporting systems",
        questions: [
          {
            key: "financial_systems",
            label: "What financial systems are in scope for SOX compliance?",
            type: "textarea",
            placeholder: "List your ERP systems (SAP, Oracle, etc.), general ledger, accounts payable/receivable, payroll systems, and any custom financial applications..."
          },
          {
            key: "change_management",
            label: "How do you manage changes to financial systems?",
            type: "textarea",
            placeholder: "Describe your change management process, approval workflows, testing procedures, emergency change procedures, and how you ensure segregation of duties..."
          },
          {
            key: "user_access_reviews",
            label: "What is your process for user access reviews for financial systems?",
            type: "textarea",
            placeholder: "Detail your access review frequency, approval processes, role-based access controls, privileged access management, and how you handle access certifications..."
          },
          {
            key: "data_backup_recovery",
            label: "How do you ensure data backup and recovery for financial systems?",
            type: "textarea",
            placeholder: "Describe your backup procedures, recovery testing, retention policies, and how you ensure integrity and availability of financial data..."
          },
          {
            key: "segregation_duties",
            label: "How do you enforce segregation of duties in IT operations?",
            type: "textarea",
            placeholder: "Explain how you separate incompatible duties, prevent single points of failure, and ensure appropriate approval levels for system changes..."
          }
        ]
      },
      IEC_62443: {
        icon: Factory,
        color: "orange",
        title: "IEC 62443 Industrial Control Systems Security",
        description: "Industrial Automation and Control Systems security standards",
        questions: [
          {
            key: "industrial_systems",
            label: "What types of industrial control systems do you operate?",
            type: "textarea",
            placeholder: "List your SCADA systems, PLCs, DCS, HMI systems, industrial networks, and any IoT devices in your operational technology environment..."
          },
          {
            key: "network_segmentation",
            label: "How do you implement network segmentation between IT and OT?",
            type: "textarea",
            placeholder: "Describe your network architecture, firewalls, DMZ implementation, air gaps, and how you control communication between IT and OT networks..."
          },
          {
            key: "remote_access_controls",
            label: "What controls do you have for remote access to industrial systems?",
            type: "textarea",
            placeholder: "Detail your remote access procedures, VPN usage, multi-factor authentication, session monitoring, and how you secure vendor remote access..."
          },
          {
            key: "vulnerability_management_ot",
            label: "How do you manage vulnerabilities in operational technology?",
            type: "textarea",
            placeholder: "Describe your OT vulnerability assessment process, patching procedures, compensating controls, and how you balance security with operational continuity..."
          },
          {
            key: "incident_response_ot",
            label: "What is your incident response plan for OT security incidents?",
            type: "textarea",
            placeholder: "Detail your OT incident response procedures, coordination with IT security, operational recovery processes, and how you handle safety-critical incidents..."
          }
        ]
      }
    };

    return configs[framework] || null;
  };

  const config = getFrameworkConfig(framework);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Card className={`glass-effect border-${config.color}-500/20`}>
      <CardHeader>
        <CardTitle className={`flex items-center text-${config.color}-300`}>
          <Icon className="w-5 h-5 mr-2" />
          {config.title}
        </CardTitle>
        <p className="text-gray-400">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {config.questions.map((question) => (
          <div key={question.key} className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              {question.label}
              {question.required && <Badge variant="outline" className="text-xs">Required</Badge>}
            </Label>
            
            {question.type === "select" ? (
              <Select 
                value={responses[question.key] || ""} 
                onValueChange={(value) => handleResponseChange(question.key, value)}
              >
                <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white focus:border-cyan-500 focus:ring-cyan-500">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  {question.options.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Textarea
                value={responses[question.key] || ""}
                onChange={(e) => handleResponseChange(question.key, e.target.value)}
                placeholder={question.placeholder}
                className={`bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-${config.color}-500 focus:ring-${config.color}-500 h-32`}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}