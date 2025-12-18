
import React, { useEffect, useMemo, useState } from "react";
import { User } from "@/entities/User";
import { Assessment } from "@/entities/Assessment";
import { Policy } from "@/entities/Policy";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { Loader2, Sparkles, Save, RefreshCw, FileText, ListChecks, CheckCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StandardsSelector from "@/components/policies/StandardsSelector";
import { ActionItem } from '@/entities/ActionItem';
import { Badge } from "@/components/ui/badge";


const POLICY_TYPES = [
  { value: "Access_Control", label: "Access Control" },
  { value: "Incident_Response", label: "Incident Response" },
  { value: "Data_Backup_and_Recovery", label: "Data Backup & Recovery" },
  { value: "Data_Retention_and_Disposal", label: "Data Retention & Disposal" },
  { value: "Vendor_Security_Management", label: "Vendor Security" },
  { value: "Password_Policy", label: "Password Policy" },
  { value: "Change_Management", label: "Change Management" },
  { value: "Vulnerability_Management", label: "Vulnerability Management" },
  { value: "Physical_Security", label: "Physical Security" },
  { value: "Business_Continuity", label: "Business Continuity" },
  { value: "Third-Party_Risk_Management", label: "Third-Party Risk Management" },
  { value: "BYOD", label: "Bring Your Own Device (BYOD)" }, // Added BYOD policy type
  { value: "Other", label: "Other" },
];

const FRAMEWORKS = ["NIST_CSF", "ISO_27001", "SOC_2", "CIS_Controls", "HIPAA", "GDPR"];

const getStandardsGuidance = (policyType) => {
  const standardsMapping = {
    'Access_Control': `
  - **NIST CSF:** PR.AC (Identity Management, Authentication, Access Control)
  - **SOC 2:** CC6 (Logical and Physical Access Controls)
  - **ISO 27002:** A.9 (Access Control Management), A.18 (Compliance)
  - Focus on: Multi-factor authentication, least privilege, role-based access, privileged account management`,

    'Incident_Response': `
  - **NIST CSF:** RS (Response - Response Planning, Communications, Analysis, Mitigation, Improvements)
  - **SOC 2:** CC7 (System Operations), CC9 (Risk Mitigation)
  - **ISO 27002:** A.16 (Information Security Incident Management)
  - Focus on: Incident classification, response team roles, communication procedures, forensics, lessons learned`,

    'Data_Backup_and_Recovery': `
  - **NIST CSF:** PR.IP (Information Protection Processes), RC (Recovery - Recovery Planning, Improvements)
  - **SOC 2:** A1.2 (Availability - System Backup and Recovery)
  - **ISO 27002:** A.12.3 (Information Backup), A.17 (Business Continuity)
  - Focus on: Backup frequency, retention periods, recovery testing, RTO/RPO objectives`,

    'Password_Policy': `
  - **NIST CSF:** PR.AC-1 (Identity Management and Authentication)
  - **SOC 2:** CC6.1 (Logical Access Controls)
  - **ISO 27002:** A.9.4 (Use of Secret Authentication Information)
  - Focus on: Password complexity, multi-factor authentication, password managers, account lockout`,

    'Vendor_Security_Management': `
  - **NIST CSF:** ID.SC (Supply Chain Risk Management)
  - **SOC 2:** CC9.1 (Third-Party Risk Management)
  - **ISO 27002:** A.15 (Supplier Relationships), A.13.2 (Information Transfer)
  - Focus on: Vendor risk assessments, security requirements in contracts, monitoring, data handling agreements`,

    'Vulnerability_Management': `
  - **NIST CSF:** ID.RA (Risk Assessment), DE.CM (Continuous Monitoring), PR.IP (Protective Technology)
  - **SOC 2:** CC7.1 (System Monitoring)
  - **ISO 27002:** A.12.6 (Management of Technical Vulnerabilities), A.18.2 (Information Security Reviews)
  - Focus on: Vulnerability scanning, patch management, risk scoring, remediation timelines`,

    'Change_Management': `
  - **NIST CSF:** PR.IP-3 (Configuration Change Control)
  - **SOC 2:** CC8 (Change Management)
  - **ISO 27002:** A.12.1 (Operational Procedures), A.14.2 (System Development Security)
  - Focus on: Change approval processes, testing procedures, rollback plans, documentation requirements`,

    'Physical_Security': `
  - **NIST CSF:** PR.AC-2 (Physical Access Management)
  - **SOC 2:** CC6.4 (Physical Access Controls)
  - **ISO 27002:** A.11 (Physical and Environmental Security)
  - Focus on: Facility access controls, visitor management, equipment protection, environmental monitoring`,

    'Business_Continuity': `
  - **NIST CSF:** RC (Recover - Recovery Planning, Improvements, Communications)
  - **SOC 2:** A1.3 (Availability - Business Continuity)
  - **ISO 27002:** A.17 (Information Security in Business Continuity)
  - Focus on: Business impact analysis, continuity strategies, testing procedures, crisis management`,

    'Acceptable_Use': `
  - **NIST CSF:** PR.AT (Awareness and Training), PR.IP (Data Security)
  - **SOC 2:** CC2 (Communication and Information), CC6 (Logical Access)
  - **ISO 27002:** A.7.2 (Terms and Conditions of Employment), A.8.1 (Information Classification)
  - Focus on: Acceptable usage guidelines, prohibited activities, monitoring rights, consequences`,

    'BYOD': `
  - **NIST CSF:** PR.AC (Access Control), PR.IP (Information Protection Processes)
  - **SOC 2:** CC6 (Logical and Physical Access Controls)
  - **ISO 27002:** A.6.2 (Mobile Device Policy), A.11.2 (Equipment Protection)
  - Focus on: Device enrollment, security requirements, data separation, remote wipe capabilities, acceptable use`,

    'Other': `
  - **NIST CSF:** Apply relevant functions based on policy focus area
  - **SOC 2:** Address applicable Trust Services Criteria
  - **ISO 27002:** Align with relevant Annex A controls
  - Focus on: Risk-based approach, continuous monitoring, regular review processes`
  };

  return standardsMapping[policyType] || standardsMapping['Other'];
};

export default function PolicyCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const preselectedType = urlParams.get("type") || "";

  const [user, setUser] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [form, setForm] = useState({
    policy_type: preselectedType,
    title: "",
    framework: "NIST_CSF",
    company_size: "",
    industry: "",
    key_systems: "",
    regulatory_requirements: "",
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState("");
  const [standards, setStandards] = useState({ frameworks: [], mappings: {} });

  // New state for action items
  const [generatingActionItems, setGeneratingActionItems] = useState(false);
  const [actionItems, setActionItems] = useState([]);
  const [actionItemsError, setActionItemsError] = useState('');
  const [saved, setSaved] = useState(false); // New state for 'Saved!' feedback

  useEffect(() => {
    const init = async () => {
      try {
        const fetchedUser = await User.me();
        setUser(fetchedUser);
        // Try to prefill basic context
        setForm((prev) => ({
          ...prev,
          company_size: fetchedUser.company_size || "",
          industry: fetchedUser.company_industry || "",
        }));
        // Fetch latest completed assessment (if any) for richer context
        const assessments = await Assessment.filter({ status: "completed" }, "-created_date", 1);
        if (assessments && assessments.length > 0) {
          setAssessment(assessments[0]);
        }
      } catch (e) {
        console.error('Failed to initialize PolicyCenter data', e);
      }
    };
    init();
  }, []);

  const resolvedTitle = useMemo(() => {
    if (form.title?.trim()) return form.title.trim();
    const typeLabel = POLICY_TYPES.find((t) => t.value === form.policy_type)?.label || "Security Policy";
    return `New ${typeLabel}`;
  }, [form.title, form.policy_type]);

  const buildPrompt = () => {
    const companyName = user?.company_name || "Your Organization";
    const industry = form.industry || user?.company_industry || "General";
    const size = form.company_size || user?.company_size || "Small/Medium Business";
    const keySystems = form.key_systems || "Cloud apps, endpoints, email, identity provider";
    const regs = form.regulatory_requirements || "General data protection and security obligations";
    const typeLabel = POLICY_TYPES.find((t) => t.value === form.policy_type)?.label || "Security Policy";

    const assessmentContext = assessment
      ? `
Latest Assessment Snapshot:
- Overall Maturity: ${assessment.overall_score || "N/A"}%
- Identity: ${assessment.maturity_identity ?? "N/A"}, AppSec: ${assessment.maturity_app_security ?? "N/A"}, IR: ${assessment.maturity_incident_response ?? "N/A"}
- NIS2 Readiness: ${assessment.nis2_readiness_level || "N/A"}`
      : "";

    const standardsContext = standards.frameworks.length > 0
      ? `
**STANDARDS ALIGNMENT REQUIREMENTS:**
This policy MUST explicitly align with the following frameworks and controls:
${standards.frameworks.map(fw => {
  const controls = standards.mappings[fw] || [];
  return `- ${fw.replace(/_/g, ' ')}: ${controls.join(', ')}`;
}).join('\n')}

CRITICAL: Include a dedicated "Standards Alignment" section in the policy that maps specific policy requirements to these controls.`
      : `
**STANDARDS ALIGNMENT REQUIREMENTS:**
This policy should align with industry best practices from NIST CSF, ISO 27001, and SOC 2 where applicable.`;

    return `You are a senior security compliance expert creating a comprehensive, audit-ready policy document.

CRITICAL FORMATTING REQUIREMENTS:
- Use proper markdown formatting with # for main headings, ## for sections, and ### or #### for subsections.
- For sub-sections or topics within a main section (e.g., "Password Creation" within "Procedures"), YOU MUST use a markdown heading (e.g., \`### Password Creation\`). DO NOT just use bold text for these sub-headings. This is essential for proper document structure.
- Use **bold** for emphasis and key terms within paragraphs.
- Use bullet points (-) and numbered lists (1.) for procedures.
- Include a professional "Standards Alignment" section that explicitly maps policy requirements to specific controls.

${standardsContext}

**COMPANY CONTEXT:**
- Organization: ${companyName}
- Industry: ${industry} 
- Size: ${size}
- Key Systems: ${keySystems}
- Regulatory Requirements: ${regs}
- Framework Focus: ${form.framework}

${assessmentContext}

**POLICY REQUIREMENTS:**
Create a comprehensive ${typeLabel} that includes:

1.  **Purpose** - Clear statement of why this policy exists
2.  **Scope** - Who and what this policy covers
3.  **Policy Statement** - High-level commitments and principles
4.  **Procedures** - Detailed step-by-step requirements with specific actions. Use sub-headings for different procedures.
5.  **Roles & Responsibilities** - Clear accountability assignments
6.  **Standards Alignment** - Explicit mapping to relevant security controls and frameworks
7.  **Compliance** - Consequences and monitoring requirements
8.  **Review** - Policy maintenance and update procedures

Make this policy immediately implementable for a ${size} ${industry} organization. Include specific, actionable procedures that can be followed by non-technical staff.

Generate ONLY the policy content in clean markdown format.`;
  };

  const generatePolicy = async () => {
    setGenerating(true);
    setGenerated(""); // Clear previous generated content
    setActionItems([]); // Clear previous action items
    setActionItemsError(""); // Clear any previous errors
    setSaved(false); // Reset saved state
    try {
      if (!form.policy_type) {
        alert("Please select a Policy Type first.");
        setGenerating(false);
        return;
      }
      const prompt = buildPrompt();
      const response = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      let policyContent = typeof response === 'string' ? response : response.content || '';

      // Add standards alignment section if not already included and standards are selected
      if (standards.frameworks.length > 0 && !policyContent.includes('Standards Alignment')) {
        const standardsSection = `

## Standards Alignment

This policy directly supports compliance with the following security frameworks and controls:

${standards.frameworks.map(fw => {
  const controls = standards.mappings[fw] || [];
  const frameworkName = {
    'NIST_CSF': 'NIST Cybersecurity Framework',
    'ISO_27001': 'ISO/IEC 27001',
    'SOC_2': 'SOC 2 Trust Services Criteria',
    'CIS_Controls': 'CIS Critical Security Controls',
    'HIPAA': 'HIPAA',
    'GDPR': 'GDPR'
  }[fw] || fw.replace(/_/g, ' ');
  
  return `### ${frameworkName}
${controls.length > 0
  ? controls.map(control => `- **${control}**: Policy procedures directly address this control requirement`).join('\n')
  : `- General alignment to ${frameworkName}`}`;
}).join('\n\n')}

Regular assessment against these controls should be conducted to ensure ongoing compliance.`;
        
        policyContent = policyContent.replace(
          /\n?\s*##\s*Review/i, 
          standardsSection + '\n\n## Review'
        );
        if (!policyContent.includes('## Review') && standards.frameworks.length > 0) {
          policyContent += standardsSection;
        }
      }
      
      setGenerated(policyContent);
    } catch (error) {
      console.error('Policy generation failed:', error);
      alert('Failed to generate policy. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateActionItemsFromPolicy = async () => {
    if (!generated) return;
    setGeneratingActionItems(true);
    setActionItemsError('');
    setActionItems([]);

    const prompt = `Based on the following security policy, identify 3-5 high-impact, strategic action items required for its successful implementation. For each action item, provide a concise title, a detailed description, a priority ('critical', 'high', 'medium', or 'low'), and a suggested completion category ('30_day', '60_day', or '90_day').

Your response MUST be a valid JSON object with a single key "action_items" which is an array of objects. Example:
{
  "action_items": [
    {
      "title": "Example: Develop Data Classification Guide",
      "description": "Create and distribute a comprehensive guide for all employees on how to classify data according to the new policy (e.g., Public, Internal, Confidential, Restricted).",
      "priority": "high",
      "category": "30_day"
    }
  ]
}

Policy to analyze:
---
${generated}
---`;

    try {
      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            action_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  category: { type: "string", enum: ["30_day", "60_day", "90_day"] }
                },
                required: ["title", "description", "priority", "category"]
              }
            }
          },
          required: ["action_items"]
        }
      });
      if (response && response.action_items) {
        setActionItems(response.action_items);
      } else {
        throw new Error("AI response did not contain valid action items.");
      }
    } catch (error) {
      console.error("Action item generation failed:", error);
      setActionItemsError("Failed to generate action items. Please try again.");
    } finally {
      setGeneratingActionItems(false);
    }
  };

  const savePolicy = async () => {
    if (!generated) {
      alert("Generate a policy first.");
      return;
    }
    setSaving(true);
    try {
      // Ensure we have user data with company_id
      if (!user || !user.company_id) {
        throw new Error('User company information not available. Please refresh and try again.');
      }

      const framework_alignment_list = (standards.frameworks || []).map((fw) => {
        const list = standards.mappings?.[fw] || [];
        return list.length ? `${fw}: ${list.join(", ")}` : fw;
      });
      const typeLabel = POLICY_TYPES.find((t) => t.value === form.policy_type)?.label || "Security Policy";

      const policyData = {
        company_id: user.company_id,
        policy_type: form.policy_type || "Other",
        title: resolvedTitle || "Security Policy",
        content: generated || "",
        status: "Draft",
        framework_alignment: framework_alignment_list,
        standards_mapping: JSON.stringify(standards.mappings),
        tags: ['AI Generated', typeLabel],
      };
      
      console.log('Saving policy with data:', policyData); // Debug log
      
      const newPolicy = await Policy.create(policyData);
      
      // Only create action items if we successfully created the policy and there are items
      if (actionItems.length > 0 && newPolicy && newPolicy.id) {
        const itemsToCreate = actionItems.map(item => ({
          ...item,
          policy_id: newPolicy.id,
          company_id: user.company_id,
          status: 'not_started'
        }));
        await ActionItem.bulkCreate(itemsToCreate);
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigate(createPageUrl("PolicyLibrary"));
      }, 1500); // Navigate after a short 'Saved!' display
    } catch (error) {
      console.error('Failed to save policy:', error);
      alert(`Error saving policy: ${error.message || 'Unknown error'}. Please check console for details.`);
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-300';
      case 'high': return 'bg-orange-500/20 text-orange-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'low': return 'bg-blue-500/20 text-blue-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold cyber-text-glow flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-cyan-300" />
              Policy Center
            </h1>
            <p className="text-gray-400 mt-1">
              Generate standards-aligned, production-ready security policies tailored to your organization.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generatePolicy} className="bg-gradient-to-r from-cyan-500 to-blue-500">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate
            </Button>
            {generated && (
                <Button onClick={() => {setGenerated(""); setActionItems([]); setActionItemsError(""); setSaved(false);}} variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700">
                  <RefreshCw className="w-4 h-4 mr-2" /> Clear Draft
                </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card className="glass-effect border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Policy Type</Label>
                  <Select value={form.policy_type} onValueChange={(v) => setForm({ ...form, policy_type: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue placeholder="Choose a policy type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-700 text-white">
                      {POLICY_TYPES.map((pt) => (
                        <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Framework Focus (Contextual)</Label>
                  <Select value={form.framework} onValueChange={(v) => setForm({ ...form, framework: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-700 text-white">
                      {FRAMEWORKS.map((f) => (
                        <SelectItem key={f} value={f}>{f.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Custom Title (optional)</Label>
                  <Input
                    placeholder="e.g., FortiGap Incident Response Policy"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Organization Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Company Size</Label>
                  <Input
                    placeholder="e.g., 120 employees"
                    value={form.company_size}
                    onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Industry</Label>
                  <Input
                    placeholder="e.g., SaaS / Healthcare / Manufacturing"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Key Systems/Tools</Label>
                  <Input
                    placeholder="e.g., AWS, Okta, Microsoft 365, GitHub, EDR"
                    value={form.key_systems}
                    onChange={(e) => setForm({ ...form, key_systems: e.target.value })}
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Regulatory Requirements</Label>
                  <Input
                    placeholder="e.g., GDPR, HIPAA, PCI DSS"
                    value={form.regulatory_requirements}
                    onChange={(e) => setForm({ ...form, regulatory_requirements: e.target.value })}
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-effect border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Specific Standards Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">Select frameworks and specific controls to ensure the policy directly addresses them.</p>
                <StandardsSelector
                  value={standards}
                  onChange={setStandards}
                />
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Generator and Preview */}
          <div className="lg:col-span-2">
            {/* Preview Section */}
            <Card className="glass-effect border-cyan-500/20 mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-6 h-6 mr-2 text-cyan-400" />
                      Preview: {resolvedTitle}
                    </div>
                    {saved && <span className="text-sm text-green-400 flex items-center"><CheckCircle className="w-4 h-4 mr-2"/>Saved</span>}
                  </CardTitle>
                  {generated && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={generateActionItemsFromPolicy}
                        disabled={generatingActionItems || actionItems.length > 0}
                        className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
                      >
                        {generatingActionItems ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ListChecks className="w-4 h-4 mr-2" />
                        )}
                        Generate Implementation Tasks
                      </Button>
                      <Button size="sm" onClick={savePolicy} disabled={saving || saved} className="bg-green-600 hover:bg-green-700">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />)}
                        {saved ? 'Saved!' : 'Save Policy & Tasks'}
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-gray-400 text-sm">Review the generated policy. You can save it to your library or go back and adjust the inputs.</p>
              </CardHeader>
              <CardContent>
                {generating ? (
                  <div className="text-center text-gray-400 py-16 flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
                    <p className="text-lg font-semibold">Generating your custom policy...</p>
                    <p className="text-sm mt-1">This might take a moment. We're leveraging AI to craft a comprehensive document.</p>
                  </div>
                ) : (
                  !generated ? (
                    <div className="text-center text-gray-400 py-16">
                      <Sparkles className="w-10 h-10 mx-auto mb-3 text-cyan-400" />
                      Click Generate to create a standards-aligned policy.
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-gray-700 min-h-[500px] max-h-[70vh] overflow-y-auto">
                      <div className="prose prose-invert max-w-none text-gray-300
                                  prose-h1:text-2xl prose-h1:font-bold prose-h1:text-cyan-300 prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-cyan-500/30
                                  prose-h2:text-xl prose-h2:font-bold prose-h2:text-purple-300 prose-h2:mt-8 prose-h2:mb-4
                                  prose-h3:text-lg prose-h3:font-bold prose-h3:text-white prose-h3:mt-6 prose-h3:mb-3
                                  prose-h4:font-bold prose-h4:text-gray-200 prose-h4:mt-4 prose-h4:mb-2
                                  prose-p:my-4 prose-p:leading-relaxed
                                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-5 prose-li:my-2
                                  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-5
                                  prose-strong:text-amber-300
                                  prose-hr:my-8 prose-hr:border-slate-700">
                        <ReactMarkdown>{generated}</ReactMarkdown>
                      </div>
                    </div>
                  )
                )}
                {/* Display Generated Action Items */}
                {actionItems.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-cyan-500/30">
                    <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center">
                      <ListChecks className="w-5 h-5 mr-2" />
                      Suggested Implementation Tasks
                    </h3>
                    <div className="space-y-3">
                      {actionItems.map((item, index) => (
                        <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-gray-700">
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <Badge className={`capitalize ${getPriorityColor(item.priority)}`}>{item.priority}</Badge>
                            <Badge className="bg-blue-500/20 text-blue-300">{item.category.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {actionItemsError && <p className="text-red-400 mt-4">{actionItemsError}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
