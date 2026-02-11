import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Policy } from '@/entities/Policy';
import { Assessment } from '@/entities/Assessment';
import { User } from '@/entities/User';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Loader2, AlertTriangle, Lock, Sparkles, FileText, Shield, CheckCircle, Info, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';

const POLICY_TYPES = [
  { value: 'Access_Control', label: 'Access Control Policy', description: 'User access management and authorization', frameworks: ['ISO_27001', 'NIST_CSF', 'SOC2'] },
  { value: 'Incident_Response', label: 'Incident Response Policy', description: 'Security incident handling procedures', frameworks: ['NIST_CSF', 'ISO_27001', 'SOC2'] },
  { value: 'Data_Backup_and_Recovery', label: 'Data Backup & Recovery Policy', description: 'Data backup and disaster recovery', frameworks: ['ISO_27001', 'SOC2'] },
  { value: 'Data_Retention_and_Disposal', label: 'Data Retention & Disposal Policy', description: 'Data lifecycle management', frameworks: ['GDPR', 'SOC2', 'ISO_27001'] },
  { value: 'Vendor_Security_Management', label: 'Vendor Security Management Policy', description: 'Third-party security requirements', frameworks: ['SOC2', 'ISO_27001', 'NIST_CSF'] },
  { value: 'Acceptable_Use', label: 'Acceptable Use Policy', description: 'Proper use of company resources', frameworks: ['ISO_27001', 'SOC2'] },
  { value: 'Password_Policy', label: 'Password Policy', description: 'Password requirements and management', frameworks: ['NIST_800_53', 'ISO_27001', 'PCI_DSS'] },
  { value: 'Change_Management', label: 'Change Management Policy', description: 'System change control procedures', frameworks: ['SOC2', 'ISO_27001', 'ITIL'] },
  { value: 'Vulnerability_Management', label: 'Vulnerability Management Policy', description: 'Vulnerability scanning and patching', frameworks: ['NIST_CSF', 'ISO_27001', 'PCI_DSS'] },
  { value: 'Physical_Security', label: 'Physical Security Policy', description: 'Physical access and facility security', frameworks: ['ISO_27001', 'SOC2'] },
  { value: 'Business_Continuity', label: 'Business Continuity Policy', description: 'Business continuity and resilience', frameworks: ['ISO_22301', 'NIST_CSF', 'SOC2'] },
  { value: 'BYOD', label: 'BYOD Policy', description: 'Bring Your Own Device guidelines', frameworks: ['ISO_27001', 'NIST_CSF'] },
  { value: 'PCI_DSS_Compliance', label: 'PCI DSS Compliance Policy', description: 'Payment card data protection', frameworks: ['PCI_DSS'] },
  { value: 'Data_Classification', label: 'Data Classification Policy', description: 'Data sensitivity classification', frameworks: ['ISO_27001', 'NIST_CSF', 'SOC2'] },
  { value: 'Encryption', label: 'Encryption Policy', description: 'Data encryption standards', frameworks: ['PCI_DSS', 'ISO_27001', 'NIST_CSF'] },
  { value: 'Remote_Work', label: 'Remote Work Policy', description: 'Secure remote work practices', frameworks: ['ISO_27001', 'NIST_CSF'] },
  { value: 'Mobile_Device', label: 'Mobile Device Management Policy', description: 'Mobile device security requirements', frameworks: ['ISO_27001', 'NIST_CSF'] },
  { value: 'Cloud_Security', label: 'Cloud Security Policy', description: 'Cloud service usage and security', frameworks: ['ISO_27001', 'NIST_CSF', 'CSA_CCM'] },
  { value: 'API_Security', label: 'API Security Policy', description: 'API development and security standards', frameworks: ['OWASP', 'ISO_27001'] },
  { value: 'Other', label: 'Custom Policy', description: 'Other security policy', frameworks: [] }
];

const FRAMEWORKS = [
  'ISO_27001', 'ISO_27002', 'NIST_CSF', 'NIST_800_53', 'SOC2', 'PCI_DSS', 
  'HIPAA', 'GDPR', 'CCPA', 'FedRAMP', 'CIS_Controls', 'COBIT'
];

export default function PolicyGeneratorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [assessments, setAssessments] = useState([]);
  
  const [formData, setFormData] = useState({
    policy_type: '',
    company_context: '',
    specific_requirements: '',
    framework_alignment: [],
    urgency_reason: '',
    linked_assessment_id: '',
    policy_owner: '',
    review_frequency: 'Annually',
    enforcement_mechanisms: []
  });
  
  const [generatedPolicy, setGeneratedPolicy] = useState(null);
  const [policyTitle, setPolicyTitle] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Load assessments for context
        try {
          const userAssessments = await Assessment.filter({ company_id: userData.company_id });
          setAssessments(userAssessments || []);
        } catch (e) {
          console.warn('Failed to load assessments:', e);
        }
        
        setFormData(prev => ({
          ...prev,
          company_context: `Company: ${userData.company_name || 'Not specified'}
Industry: ${userData.company_industry || 'Not specified'}  
Size: ${userData.company_size || 'Not specified'}
Description: ${userData.company_description || 'Not specified'}`,
          policy_owner: userData.email
        }));
        
        const params = new URLSearchParams(location.search);
        const policyType = params.get('type');
        const context = params.get('context');
        
        if (policyType) {
          setFormData(prev => ({ ...prev, policy_type: policyType }));
        }
        
        if (context) {
          try {
            const contextData = JSON.parse(context);
            setFormData(prev => ({ 
              ...prev, 
              urgency_reason: contextData.reason || '',
              specific_requirements: contextData.requirements || ''
            }));
          } catch (e) {
            console.warn('Failed to parse context data');
          }
        }
        
      } catch (e) {
        setIsAuthenticated(false);
        setError('You must be logged in to generate policies.');
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [location.search]);

  const selectedPolicyType = POLICY_TYPES.find(p => p.value === formData.policy_type);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFrameworkToggle = (framework) => {
    setFormData(prev => ({
      ...prev,
      framework_alignment: prev.framework_alignment.includes(framework)
        ? prev.framework_alignment.filter(f => f !== framework)
        : [...prev.framework_alignment, framework]
    }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedPolicy(null);
    setPolicyTitle('');
    setError(null);
    
    try {
      if (!formData.policy_type) {
        throw new Error('Please select a policy type');
      }
      
      // Get assessment context if linked
      let assessmentContext = '';
      if (formData.linked_assessment_id) {
        const assessment = assessments.find(a => a.id === formData.linked_assessment_id);
        if (assessment) {
          assessmentContext = `
**LINKED ASSESSMENT CONTEXT:**
- Overall Maturity Score: ${assessment.overall_score || 'N/A'}
- Maturity Level: ${assessment.maturity_level || 'N/A'}
- Framework: ${assessment.framework || 'N/A'}
- Key Gaps: Reference the assessment's identified gaps and weaknesses`;
        }
      }

      const prompt = `You are an expert cybersecurity policy writer with deep knowledge of compliance frameworks and industry best practices. Generate a comprehensive, production-ready, AUDIT-GRADE security policy document based on the following requirements:

**POLICY TYPE:** ${formData.policy_type.replace(/_/g, ' ')}

**COMPANY CONTEXT:**
${formData.company_context}

**SPECIFIC REQUIREMENTS:**
${formData.specific_requirements || 'Standard industry best practices'}

**BUSINESS JUSTIFICATION:**
${formData.urgency_reason || 'Proactive security policy development'}

**FRAMEWORK ALIGNMENT:**
${formData.framework_alignment.length > 0 ? formData.framework_alignment.join(', ') : 'Industry best practices'}

**REVIEW FREQUENCY:**
${formData.review_frequency}

${assessmentContext}

**CRITICAL: AUDIT-READY REQUIREMENTS**
Every policy MUST include these enterprise-grade elements:

1. **Joiner-Mover-Leaver (JML) Coverage:**
   - Explicit access provisioning process for new users
   - Access modification within 24 hours of role changes
   - Periodic access reconciliation to ensure current access matches job function
   - Immediate access revocation upon termination

2. **Time-Bound Access:**
   - Temporary or elevated access must have expiration dates
   - Automatic revocation mechanisms
   - Approval and justification requirements for extensions

3. **Specific Technical Requirements (not vague):**
   - For Access Control: Passwords must be at least 12 characters and resistant to commonly used or breached passwords (NIST-aligned)
   - For Logging: Access logs must be retained for a minimum of 90 days (or longer if required by regulation)
   - For Device Management: Explicitly cover corporate-managed laptops, servers, mobile devices, and cloud workloads

4. **Enforceable Language:**
   - Use "must" instead of "should" for critical controls
   - Include measurable timeframes (24h, 48h, 90 days, etc.)
   - Define clear ownership and accountability

5. **Control Mapping Appendix:**
   - Map each major requirement to specific compliance controls
   - Include SOC 2 (CC6, CC7), ISO 27001 (A.9, A.12), NIST CSF (PR.AC, DE.CM), CIS Controls
   - Format as a table at the end of the policy

6. **Evidence Guidance:**
   - Include a brief "Audit Evidence Examples" section
   - List 3-5 types of evidence auditors will request (screenshots, logs, reports, tickets)

**MANDATORY SECTIONS:**
1. Executive Summary (2-3 sentences)
2. Purpose & Scope (include explicit device/system coverage)
3. Policy Statement (principles)
4. Requirements & Controls (numbered, with JML, time-bound access, specific technical reqs)
5. Roles & Responsibilities (with accountability)
6. Authentication & Authorization (if relevant - specific password/MFA requirements)
7. Monitoring, Logging & Retention (with specific retention periods)
8. Exceptions Process (formal approval workflow)
9. Enforcement & Consequences
10. Review & Maintenance (with schedule)
11. Related Policies & Standards
12. Appendix A: Control Mapping (table format)
13. Appendix B: Audit Evidence Examples

${formData.policy_type === 'PCI_DSS_Compliance' ? `
**PCI DSS SPECIFIC REQUIREMENTS:**
- Address all 12 PCI DSS requirements with specific implementation guidance
- Include detailed CDE (Cardholder Data Environment) scope definition
- Network segmentation requirements with technical specifications
- Data protection measures: encryption standards (AES-256), tokenization, masking, secure deletion
- Vulnerability management: quarterly scans, annual penetration testing, monthly patching
- Access control: MFA for all CDE access, least privilege, unique IDs, quarterly access reviews
- Monitoring and logging: SIEM integration, file integrity monitoring, centralized log management, 1-year retention
- Incident response procedures specifically for payment data breaches (24-hour notification requirements)
- Physical security for card processing equipment
- Vendor management for service providers with access to cardholder data
` : ''}

${formData.policy_type === 'Access_Control' ? `
**ACCESS CONTROL SPECIFIC REQUIREMENTS:**
- Joiner-Mover-Leaver process with 24-hour SLA for changes
- Unique user IDs (no shared accounts)
- MFA for all remote access and privileged accounts
- Quarterly access reviews with documented approval
- Temporary/elevated access expiration (maximum 30 days)
- Privileged account management (separate from standard accounts)
- Access logging with 90-day minimum retention
- Failed login attempt thresholds and account lockout
- Password requirements: 12+ characters, breach-resistant, no complexity rules (NIST-aligned)
` : ''}

${formData.policy_type === 'Incident_Response' ? `
**INCIDENT RESPONSE SPECIFIC REQUIREMENTS:**
- Incident classification levels with response timeframes (Critical: 15 min, High: 1 hour, etc.)
- On-call rotation and escalation procedures
- Evidence preservation and chain of custody
- Communication templates for stakeholders, customers, regulators
- Post-incident review requirements (within 5 business days)
- Lessons learned documentation and action item tracking
- Annual tabletop exercise requirement
` : ''}

**OUTPUT FORMAT:**
Return ONLY a JSON object with this structure:
{
  "title": "Complete policy title",
  "content": "Full policy document content in markdown format with ALL mandatory sections including appendices",
  "summary": "2-3 sentence executive summary emphasizing audit-readiness",
  "key_controls": ["At least 8 specific, measurable controls with JML, time-bound access, retention periods"],
  "compliance_frameworks": ["Specific frameworks with control IDs where applicable"],
  "enforcement_mechanisms": ["At least 5 technical or procedural enforcement mechanisms"],
  "review_recommendations": "Specific recommendations for policy review, including frequency and triggers for updates",
  "control_mappings": [
    {"requirement": "Unique user IDs", "soc2": "CC6.1", "iso27001": "A.9.2.1", "nist": "PR.AC-1", "cis": "6.1"},
    {"requirement": "Access reviews", "soc2": "CC6.2", "iso27001": "A.9.2.5", "nist": "PR.AC-4", "cis": "6.2"}
  ],
  "audit_evidence_examples": ["Evidence type 1", "Evidence type 2", "Evidence type 3", "Evidence type 4", "Evidence type 5"]
}

**QUALITY STANDARDS:**
- This policy must be ready for immediate use in a SOC 2 Type II, ISO 27001, or PCI DSS audit
- Auditors should find ZERO gaps in JML coverage, access controls, or logging requirements
- Every "must" statement should be measurable and verifiable
- Include at least 8 specific, enforceable controls with clear owners and timeframes

Generate an enterprise-grade lite policy that passes real audits without being bloated or overly complex.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            summary: { type: "string" },
            key_controls: { type: "array", items: { type: "string" } },
            compliance_frameworks: { type: "array", items: { type: "string" } },
            enforcement_mechanisms: { type: "array", items: { type: "string" } },
            review_recommendations: { type: "string" },
            control_mappings: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  requirement: { type: "string" },
                  soc2: { type: "string" },
                  iso27001: { type: "string" },
                  nist: { type: "string" },
                  cis: { type: "string" }
                }
              } 
            },
            audit_evidence_examples: { type: "array", items: { type: "string" } }
          },
          required: ["title", "content", "summary", "key_controls"]
        }
      });

      setGeneratedPolicy(response);
      setPolicyTitle(response.title);
      setActiveTab('review');
      
    } catch (error) {
      console.error('Error generating policy:', error);
      setError(`Failed to generate policy: ${error.message || 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPolicy || !policyTitle.trim()) {
      setError("Please generate a policy and provide a title before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const policyData = {
        policy_type: formData.policy_type,
        title: policyTitle,
        content: generatedPolicy.content,
        status: 'Draft',
        version: '1.0',
        framework_alignment: generatedPolicy.compliance_frameworks || formData.framework_alignment,
        tags: ['AI Generated', formData.policy_type.replace(/_/g, ' ')],
        company_id: user.company_id,
        policy_owner: formData.policy_owner,
        review_frequency: formData.review_frequency,
        enforcement_mechanisms: generatedPolicy.enforcement_mechanisms || [],
        linked_assessment_ids: formData.linked_assessment_id ? [formData.linked_assessment_id] : []
      };
      
      await Policy.create(policyData);
      navigate(createPageUrl('PolicyLibrary'));
      
    } catch (error) {
      console.error('Error saving policy:', error);
      setError(`Failed to save policy: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!generatedPolicy) return;
    const blob = new Blob([generatedPolicy.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policyTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="min-h-screen cyber-gradient flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-cyan-400" /></div>;
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-red-500/30 max-w-md">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-gradient-to-r from-cyan-500 to-purple-500">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link to={createPageUrl("PolicyLibrary")}>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold cyber-text-glow mb-2">AI Policy Generator</h1>
            <p className="text-gray-400">Generate comprehensive, audit-ready security policies tailored to your organization</p>
          </div>
        </div>

        {error && (
          <Alert className="bg-red-500/10 border-red-500/30 text-red-300 mb-6">
            <AlertTriangle className="w-5 h-5"/>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            <TabsTrigger value="review" disabled={!generatedPolicy}>Review & Save</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="glass-effect border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-purple-400" />
                  Policy Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Select the type of policy you need and provide basic context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-300 mb-2 block">Policy Type *</Label>
                  <Select value={formData.policy_type} onValueChange={(value) => handleInputChange('policy_type', value)}>
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue placeholder="Select policy type to generate" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600 text-white max-h-96">
                      {POLICY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-gray-400">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPolicyType && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedPolicyType.frameworks.map(fw => (
                        <Badge key={fw} variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                          {fw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-300">Company Context</Label>
                  <Textarea 
                    value={formData.company_context}
                    onChange={(e) => handleInputChange('company_context', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-24"
                    placeholder="Company details, industry, size, etc."
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Specific Requirements</Label>
                  <Textarea 
                    value={formData.specific_requirements}
                    onChange={(e) => handleInputChange('specific_requirements', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-32"
                    placeholder="Any specific requirements, systems, processes, or regulatory needs that should be addressed in this policy..."
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Business Justification</Label>
                  <Textarea 
                    value={formData.urgency_reason}
                    onChange={(e) => handleInputChange('urgency_reason', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white h-20"
                    placeholder="e.g., 'Gap identified in security assessment', 'Required for SOC 2 compliance', 'Recent incident highlighted need'..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => setActiveTab('advanced')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    Advanced Options
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    disabled={!formData.policy_type || generating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Policy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="glass-effect border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Advanced Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Fine-tune your policy with framework alignment and governance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-300 mb-3 block">Framework Alignment</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FRAMEWORKS.map((framework) => (
                      <div key={framework} className="flex items-center space-x-2 bg-slate-800/30 p-3 rounded border border-slate-700">
                        <Checkbox
                          id={framework}
                          checked={formData.framework_alignment.includes(framework)}
                          onCheckedChange={() => handleFrameworkToggle(framework)}
                        />
                        <label htmlFor={framework} className="text-sm text-gray-300 cursor-pointer">
                          {framework.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Link to Assessment (Optional)</Label>
                  <Select value={formData.linked_assessment_id} onValueChange={(value) => handleInputChange('linked_assessment_id', value)}>
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue placeholder="Link to existing assessment for context" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600 text-white">
                      <SelectItem value={null}>No Assessment</SelectItem>
                      {assessments.map((assessment) => (
                        <SelectItem key={assessment.id} value={assessment.id}>
                          {assessment.company_name} - {assessment.framework}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Policy Owner</Label>
                    <Input
                      value={formData.policy_owner}
                      onChange={(e) => handleInputChange('policy_owner', e.target.value)}
                      className="bg-slate-800/50 border-gray-600 text-white"
                      placeholder="email@company.com"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Review Frequency</Label>
                    <Select value={formData.review_frequency} onValueChange={(value) => handleInputChange('review_frequency', value)}>
                      <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-gray-600 text-white">
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Semi_Annually">Semi-Annually</SelectItem>
                        <SelectItem value="Annually">Annually</SelectItem>
                        <SelectItem value="Biannually">Biannually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => setActiveTab('basic')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    disabled={!formData.policy_type || generating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Policy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            {generatedPolicy && (
              <>
                <Card className="glass-effect border-green-500/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center mb-2">
                          <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                          Policy Generated Successfully
                        </CardTitle>
                        <p className="text-gray-400">{generatedPolicy.summary}</p>
                      </div>
                      <Button onClick={handleExportMarkdown} variant="outline" size="sm" className="border-gray-600">
                        <Download className="w-4 h-4 mr-2" />
                        Export MD
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-gray-300 mb-2 block">Policy Title *</Label>
                      <Input
                        value={policyTitle}
                        onChange={(e) => setPolicyTitle(e.target.value)}
                        placeholder="Enter policy title"
                        className="bg-slate-800/50 border-gray-600 text-white text-lg"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 block">Policy Content</Label>
                      <div className="bg-slate-900/50 p-6 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                        <div className="prose prose-sm prose-invert max-w-none text-gray-300">
                          <ReactMarkdown>{generatedPolicy.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    {generatedPolicy.key_controls && generatedPolicy.key_controls.length > 0 && (
                      <div>
                        <Label className="text-gray-300 mb-2 block">Key Controls Addressed</Label>
                        <div className="flex flex-wrap gap-2">
                          {generatedPolicy.key_controls.map((control, index) => (
                            <Badge key={index} className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {control}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedPolicy.enforcement_mechanisms && generatedPolicy.enforcement_mechanisms.length > 0 && (
                      <div>
                        <Label className="text-gray-300 mb-2 block">Enforcement Mechanisms</Label>
                        <div className="flex flex-wrap gap-2">
                          {generatedPolicy.enforcement_mechanisms.map((mechanism, index) => (
                            <Badge key={index} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {mechanism}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedPolicy.control_mappings && generatedPolicy.control_mappings.length > 0 && (
                      <div>
                        <Label className="text-gray-300 mb-2 block">Control Mappings (Appendix A)</Label>
                        <div className="bg-slate-900/50 rounded-lg border border-gray-700 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-800/50">
                              <tr>
                                <th className="text-left p-3 text-gray-300">Requirement</th>
                                <th className="text-left p-3 text-gray-300">SOC 2</th>
                                <th className="text-left p-3 text-gray-300">ISO 27001</th>
                                <th className="text-left p-3 text-gray-300">NIST CSF</th>
                                <th className="text-left p-3 text-gray-300">CIS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedPolicy.control_mappings.map((mapping, index) => (
                                <tr key={index} className="border-t border-gray-700">
                                  <td className="p-3 text-gray-300">{mapping.requirement}</td>
                                  <td className="p-3 text-gray-400">{mapping.soc2 || '-'}</td>
                                  <td className="p-3 text-gray-400">{mapping.iso27001 || '-'}</td>
                                  <td className="p-3 text-gray-400">{mapping.nist || '-'}</td>
                                  <td className="p-3 text-gray-400">{mapping.cis || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {generatedPolicy.audit_evidence_examples && generatedPolicy.audit_evidence_examples.length > 0 && (
                      <div>
                        <Label className="text-gray-300 mb-2 block">Audit Evidence Examples (Appendix B)</Label>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-gray-700">
                          <ul className="space-y-2">
                            {generatedPolicy.audit_evidence_examples.map((evidence, index) => (
                              <li key={index} className="flex items-start text-gray-300">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {generatedPolicy.review_recommendations && (
                      <Alert className="bg-cyan-500/10 border-cyan-500/30">
                        <Info className="w-4 h-4 text-cyan-400" />
                        <AlertDescription className="text-gray-300">
                          <strong className="text-cyan-300">Review Recommendations:</strong> {generatedPolicy.review_recommendations}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-4 pt-4 border-t border-gray-700">
                      <Button 
                        onClick={handleSave}
                        disabled={saving || !policyTitle.trim()}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Save to Policy Library
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setGeneratedPolicy(null);
                          setPolicyTitle('');
                          setActiveTab('basic');
                        }} 
                        className="border-gray-600 text-gray-300"
                      >
                        Generate Different Policy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}