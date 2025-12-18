
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Policy } from '@/entities/Policy';
import { User } from '@/entities/User';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { Save, ArrowLeft, Loader2, AlertTriangle, Lock, Sparkles, Copy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvokeLLM } from '@/integrations/Core';
import { POLICY_TEMPLATES } from '@/components/policies/PolicyTemplates';

const displayError = (error, options) => {
  let message = options.general || "An unexpected error occurred.";
  if (error instanceof Error) {
    if (error.message.includes('permission')) {
      message = options.permission || message;
    } else if (error.message.includes('network')) {
      message = options.network || message;
    } else if (error.message.includes('required') || error.message.includes('validation')) {
      message = options.validation || message;
    } else {
      message = error.message;
    }
  } else if (typeof error === 'string') {
      message = error;
  }
  console.error("Detailed error:", error);
  return `${options.title || "Error"}: ${message}`;
};

const initialPolicyState = {
  policy_type: '',
  title: '',
  content: '',
  status: 'Draft',
  version: '1.0',
  approved_by: '',
  approved_date: null,
  framework_alignment: [],
  last_reviewed_date: null,
  next_review_date: null,
  tags: [],
  // company_id will be set dynamically based on currentUser
};

export default function PolicyEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const [policy, setPolicy] = useState(initialPolicyState);
  const [policyId, setPolicyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState('edit');
  const [hasChanges, setHasChanges] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isReviewDatePickerOpen, setIsReviewDatePickerOutlined] = useState(false);
  const [showLitePolicyGenerator, setShowLitePolicyGenerator] = useState(false);
  const [generatingLitePolicy, setGeneratingLitePolicy] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await User.me();
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (id) {
          setPolicyId(id);
          const existingPolicy = await Policy.get(id);
          setPolicy({
            ...existingPolicy,
            approved_date: existingPolicy.approved_date ? new Date(existingPolicy.approved_date) : null,
            next_review_date: existingPolicy.next_review_date ? new Date(existingPolicy.next_review_date) : null,
          });
        } else {
          // Initialize with company_id for new policies
          setPolicy({
            ...initialPolicyState,
            company_id: user.company_id
          });
        }
        setHasChanges(false);
      } catch (e) {
        setIsAuthenticated(false);
        setError('You must be logged in to manage policies.');
        console.error("Initialization error:", e);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [location.search]);

  const handleInputChange = (field, value) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const generateLitePolicy = async (policyType, companyContext = {}) => {
    setGeneratingLitePolicy(true);
    try {
      // First check if we have a hardcoded template
      if (POLICY_TEMPLATES[policyType]) {
        const template = POLICY_TEMPLATES[policyType];
        const companyName = companyContext.name || currentUser?.company_name || '[INSERT ORGANIZATION NAME]';
        const generatedContent = template.content(companyName);
        
        return generatedContent;
      }

      // If no template exists, fall back to LLM generation
      const policyTypeName = policyType.replace(/_/g, ' ');
      
      const getPolicySpecificStructure = (type) => {
        switch (type) {
          case 'Incident_Response':
            return `
## 3. POLICY REQUIREMENTS & CONTROLS

### 3.1 Incident Detection and Reporting
- Incident identification and classification procedures
- Reporting mechanisms and contact information
- Initial response and containment measures

### 3.2 Incident Response Team and Roles
- Incident response team structure and responsibilities
- Escalation procedures and communication protocols
- External communication and notification requirements

### 3.3 Incident Investigation and Analysis
- Evidence collection and preservation procedures
- Forensic analysis and root cause identification
- Documentation and reporting requirements`;

          case 'Data_Backup_and_Recovery':
            return `
## 3. POLICY REQUIREMENTS & CONTROLS

### 3.1 Backup Requirements and Procedures
- Data backup frequency and retention requirements
- Backup verification and testing procedures
- Backup storage and security controls

### 3.2 Recovery Procedures and Testing
- Recovery time objectives (RTO) and recovery point objectives (RPO)
- Disaster recovery testing and validation
- Business continuity planning integration`;

          case 'Password_Policy':
            return `
## 3. POLICY REQUIREMENTS & CONTROLS

### 3.1 Password Complexity Requirements
- Minimum length, character types, and complexity rules for passwords
- Prohibition of common or easily guessable passwords

### 3.2 Password History and Re-use
- Requirements for unique new passwords (e.g., cannot reuse last X passwords)

### 3.3 Password Storage and Transmission
- Requirements for secure storage of passwords (e.g., hashing)
- Prohibition of clear-text password transmission

### 3.4 Multi-Factor Authentication (MFA)
- Mandatory MFA for critical systems and remote access
- Guidelines for MFA implementation and usage

### 3.5 Account Lockout and Brute Force Protection
- Policies for locking accounts after multiple failed login attempts
- Measures to prevent brute-force attacks`;

          default:
            return `
## 3. POLICY REQUIREMENTS & CONTROLS
**Note:** The following sections should be customized based on the specific requirements of ${policyTypeName} policy:

### 3.1 Core Requirements
- Primary requirements specific to ${policyTypeName}
- Regulatory and compliance obligations
- Risk mitigation strategies

### 3.2 Implementation Controls
- Technical controls and safeguards
- Administrative controls and procedures
- Physical security considerations (if applicable)`;
        }
      };

      const prompt = `Create a comprehensive, standards-based ${policyTypeName} policy template that aligns with industry best practices and major compliance frameworks.

**Company Context:**
- Organization: ${companyContext.name || '[YOUR ORGANIZATION NAME]'}
- Industry: ${companyContext.industry || '[YOUR INDUSTRY SECTOR]'}
- Size: ${companyContext.size || '[YOUR COMPANY SIZE]'}

**Policy Type Focus:**
This must be a specific ${policyTypeName} policy, not a generic security policy. Every section must be tailored to ${policyTypeName} requirements and use cases.

**Standards Alignment Requirements:**
This policy must integrate principles and requirements from:
- **NIST Cybersecurity Framework:** Incorporate relevant functions (Identify, Protect, Detect, Respond, Recover)
- **SOC 2 Trust Services Criteria:** Address Security, Availability, Processing Integrity, Confidentiality, and Privacy as applicable
- **ISO 27001/27002:** Align with relevant Annex A controls and risk management principles

**Policy Structure Requirements:**

## 1. INTRODUCTION
- Clear policy statement specific to ${policyTypeName}
- Purpose and business justification for ${policyTypeName} policy
- Scope of application (what systems, data, personnel are covered)
- Key definitions and terminology specific to ${policyTypeName}

## 2. PRINCIPLES & OBJECTIVES
- High-level principles governing ${policyTypeName}
- Specific objectives this ${policyTypeName} policy aims to achieve
- Alignment with organizational risk appetite
- Compliance and regulatory considerations for ${policyTypeName}

${getPolicySpecificStructure(policyType)}

## 4. ROLES & RESPONSIBILITIES
- Executive leadership accountability for ${policyTypeName}
- IT/Security team responsibilities specific to ${policyTypeName}
- Department/business unit obligations
- Individual employee duties related to ${policyTypeName}
- Third-party vendor requirements (if applicable to ${policyTypeName})

## 5. IMPLEMENTATION & COMPLIANCE
- Step-by-step implementation guidance for ${policyTypeName}
- Timeline and milestones specific to ${policyTypeName}
- Required documentation and evidence collection
- Training and awareness requirements for ${policyTypeName}
- Compliance measurement and metrics

## 6. VIOLATIONS & ENFORCEMENT
- Types of ${policyTypeName} policy violations
- Disciplinary actions and consequences
- Investigation procedures for ${policyTypeName} violations
- Reporting mechanisms for violations
- Corrective action processes

## 7. POLICY REVIEW & MAINTENANCE
- Review frequency and triggers for ${policyTypeName} policy
- Approval process for changes to ${policyTypeName} policy
- Version control and change documentation
- Communication of policy updates
- Continuous improvement mechanisms

## 8. EXCEPTIONS & WAIVERS
- Exception request process for ${policyTypeName} requirements
- Risk assessment requirements for exceptions
- Approval authority levels for ${policyTypeName} exceptions
- Temporary vs. permanent exceptions
- Monitoring and review of active exceptions

## 9. REFERENCES & RELATED DOCUMENTS
- Related organizational policies that complement this ${policyTypeName} policy
- Applicable laws and regulations relevant to ${policyTypeName}
- Industry standards and frameworks
- External resources and guidance for ${policyTypeName}

**Content Requirements:**
- Target length: 1,500-2,500 words for comprehensive coverage
- Use specific technical language and terminology related to ${policyTypeName}
- Include concrete examples and scenarios relevant to ${policyTypeName}
- Provide detailed procedural steps for ${policyTypeName} implementation
- Reference specific control mechanisms and technologies used in ${policyTypeName}
- Address common risks and threats related to ${policyTypeName}

**Customization Placeholders:**
Use clear placeholders for organization-specific details:
- [YOUR ORGANIZATION NAME]
- [SPECIFIC SYSTEM/APPLICATION NAMES]
- [DEPARTMENT/ROLE RESPONSIBLE]
- [YOUR SECURITY TEAM CONTACT]
- [APPLICABLE REGULATORY REQUIREMENTS]
- [YOUR ORGANIZATION'S RISK TOLERANCE]
- [SPECIFIC TOOLS/TECHNOLOGIES IN USE]
- [YOUR INCIDENT RESPONSE TEAM]
- [RELEVANT THIRD-PARTY VENDORS]

**Critical Instruction:**
This policy must be immediately recognizable as a ${policyTypeName} policy by anyone reading it. It should contain specific ${policyTypeName} terminology, procedures, and requirements throughout. Do not generate generic security policy language - every paragraph should be tailored to ${policyTypeName}.

Generate a professional, detailed ${policyTypeName} policy that serves as a robust starting point while clearly indicating areas requiring organizational customization.`;

      const response = await InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      return response;
    } catch (error) {
      console.error("Error generating comprehensive policy:", error);
      throw error;
    } finally {
      setGeneratingLitePolicy(false);
    }
  };

  const handleGenerateLitePolicy = async () => {
    if (!policy.policy_type) {
      alert("Please select a policy type first.");
      return;
    }

    try {
      const companyContext = {
        industry: currentUser?.company_industry,
        size: currentUser?.company_size,
        name: currentUser?.company_name
      };

      const generatedContent = await generateLitePolicy(policy.policy_type, companyContext);
      
      setPolicy(prev => ({
        ...prev,
        content: generatedContent,
        title: prev.title || `${prev.policy_type.replace(/_/g, ' ')} Policy`,
        framework_alignment: ['NIST_CSF', 'SOC2', 'ISO_27001'],
        company_id: currentUser?.company_id // Ensure company_id is set
      }));
      
      setHasChanges(true);
      setShowLitePolicyGenerator(false);
    } catch (error) {
      console.error("Error generating comprehensive policy:", error);
      alert("Failed to generate policy template. Please try again.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!policy.title || !policy.policy_type || !policy.content) {
        throw new Error('Title, Policy Type, and Content are required.');
      }
      
      const isEditing = !!policyId;
      let savedPolicy;

      const policyDataToSave = {
        ...policy,
        company_id: policy.company_id || currentUser?.company_id, // Ensure company_id is included
        approved_date: policy.approved_date ? policy.approved_date.toISOString() : null,
        next_review_date: policy.next_review_date ? policy.next_review_date.toISOString() : null,
      };

      if (isEditing) {
        savedPolicy = await Policy.update(policyId, policyDataToSave);
      } else {
        savedPolicy = await Policy.create(policyDataToSave);
      }
      
      setHasChanges(false);
      navigate(createPageUrl('PolicyLibrary'));
    } catch (e) {
      console.error("Error saving policy:", e);
      const errorMessage = displayError(e, {
        title: "Failed to save policy",
        general: "Unable to save the policy. Please check all required fields and try again.",
        network: "Connection error while saving policy. Please check your internet connection and try again.",
        validation: "Please check that all fields are filled out correctly.",
        permission: "You don't have permission to save this policy. Please contact your administrator."
      });
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
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
               <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                   Log In
               </Button>
           </div>
       </div>
   );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => navigate(createPageUrl('PolicyLibrary'))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <h1 className="text-3xl font-bold cyber-text-glow">{policyId ? 'Edit Policy' : 'Create New Policy'}</h1>
          <div className="flex gap-2">
            {!policyId && (
              <Button 
                onClick={() => setShowLitePolicyGenerator(true)}
                variant="outline"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Policy Template
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !hasChanges} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Policy'}
            </Button>
          </div>
        </div>
        
        {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg flex items-center gap-3 mb-6">
                <AlertTriangle className="w-5 h-5"/>
                <p>{error}</p>
            </div>
        )}

        {/* Policy Generation Modal */}
        <Dialog open={showLitePolicyGenerator} onOpenChange={setShowLitePolicyGenerator}>
          <DialogContent className="bg-slate-900 border-purple-500/30 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-purple-300 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Comprehensive Policy Template
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Create a standards-based policy template aligned with NIST, SOC 2, and ISO 27001/2 frameworks.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-300 mb-2">Important: Template Customization Required</h4>
                    <div className="text-sm text-amber-200 space-y-2">
                      <p>This generator creates a <strong>comprehensive policy template</strong> with:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Standards-based requirements (NIST, SOC 2, ISO 27001/2)</li>
                        <li>Detailed sections covering all policy aspects</li>
                        <li>Professional language and industry best practices</li>
                        <li>Clear placeholders for your specific details</li>
                      </ul>
                      <p className="mt-3 font-medium">⚠️ You MUST customize this template to fit your organization's specific needs, environment, and requirements.</p>
                      <p className="text-amber-100">💡 <strong>Recommended:</strong> Copy the generated content to a Word document for easier editing and formatting.</p>
                    </div>
                  </div>
                </div>
              </div>

              {policy.policy_type ? (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Policy Details</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><strong>Type:</strong> {policy.policy_type.replace(/_/g, ' ')} Policy</p>
                    <p><strong>Company:</strong> {currentUser?.company_name || '[Your Organization]'}</p>
                    <p><strong>Industry:</strong> {currentUser?.company_industry || '[Your Industry]'}</p>
                    <p><strong>Standards:</strong> NIST CSF, SOC 2, ISO 27001/2</p>
                    <p><strong>Expected Length:</strong> 1,500-2,500 words</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-red-400 text-sm">Please select a Policy Type in the "Policy Details" section (to the right) before generating a template.</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLitePolicyGenerator(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateLitePolicy}
                disabled={generatingLitePolicy || !policy.policy_type}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
              >
                {generatingLitePolicy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Template...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Comprehensive Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Editor Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Editor */}
          <div className="lg:col-span-2">
            <Card className="glass-effect border-gray-700/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white font-bold">Policy Content</CardTitle>
                <div className="flex gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(prev => prev === 'edit' ? 'view' : 'edit')}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                      {viewMode === 'edit' ? 'Preview Markdown' : 'Edit Markdown'}
                  </Button>
                  {policy.content && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(policy.content);
                        alert('Policy content copied to clipboard! You can now paste it into a Word document for easier customization.');
                      }}
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy to Clipboard
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'edit' ? (
                  <Textarea
                    value={policy.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Enter policy content here. You can use Markdown (e.g., # Heading, **bold**, *italic*, - list item, `code`). 

TIP: Click 'Generate Policy Template' above to create a comprehensive, standards-based template, then customize it to meet your specific needs."
                    className="bg-slate-800/50 border-gray-600 text-white min-h-[60vh] placeholder-gray-400"
                  />
                ) : (
                  <div className="bg-slate-900/50 p-6 rounded-lg border border-gray-700 min-h-[60vh] overflow-y-auto">
                    <div className="prose prose-invert max-w-none text-gray-300
                                    prose-h1:text-2xl prose-h1:font-bold prose-h1:text-cyan-300 prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-cyan-500/30
                                    prose-h2:text-xl prose-h2:font-bold prose-h2:text-purple-300 prose-h2:mt-8 prose-h2:mb-4
                                    prose-h3:text-lg prose-h3:font-bold prose-h3:text-white prose-h3:mt-6 prose-h3:mb-3
                                    prose-h4:font-bold prose-h4:text-gray-200 prose-h4:mt-4 prose-h4:mb-2
                                    prose-p:my-4 prose-p:leading-relaxed
                                    prose-ul:my-4 prose-ul:list-disc prose-ul:pl-5 prose-li:my-2
                                    prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-5
                                    prose-a:text-blue-400 hover:prose-a:text-blue-300
                                    prose-blockquote:border-l-4 prose-blockquote:border-gray-500 prose-blockquote:pl-4 prose-blockquote:italic
                                    prose-code:bg-slate-700 prose-code:rounded prose-code:px-1 prose-code:py-0.5
                                    prose-strong:text-amber-300
                                    prose-em:italic
                                    prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-gray-600
                                    prose-th:bg-slate-700 prose-th:p-2 prose-th:border prose-th:border-gray-600
                                    prose-td:p-2 prose-td:border prose-td:border-gray-600
                                    prose-hr:border-t-2 prose-hr:my-8 prose-hr:border-slate-700">
                      <ReactMarkdown>{policy.content || 'No content to display. Switch to edit mode to add content.'}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Metadata */}
          <div>
            <Card className="glass-effect border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white font-bold">Policy Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Policy Title */}
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-200 mb-2 block">
                    Policy Title <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={policy.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter policy title (e.g., Access Control Policy v2.0)"
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="policy_type" className="text-gray-300">Policy Type <span className="text-red-400">*</span></Label>
                  <Select value={policy.policy_type} onValueChange={(value) => handleInputChange('policy_type', value)}>
                    <SelectTrigger id="policy_type" className="bg-slate-800/50 border-gray-600 text-white data-[placeholder]:text-gray-400">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600 text-white">
                      <SelectItem value="Access_Control">Access Control</SelectItem>
                      <SelectItem value="Incident_Response">Incident Response</SelectItem>
                      <SelectItem value="Data_Backup_and_Recovery">Data Backup & Recovery</SelectItem>
                      <SelectItem value="Data_Retention_and_Disposal">Data Retention & Disposal</SelectItem>
                      <SelectItem value="Vendor_Security_Management">Vendor Security</SelectItem>
                      <SelectItem value="Acceptable_Use">Acceptable Use</SelectItem>
                      <SelectItem value="Password_Policy">Password Policy</SelectItem>
                      <SelectItem value="Change_Management">Change Management</SelectItem>
                      <SelectItem value="Vulnerability_Management">Vulnerability Management</SelectItem>
                      <SelectItem value="Physical_Security">Physical Security</SelectItem>
                      <SelectItem value="Business_Continuity">Business Continuity</SelectItem>
                      <SelectItem value="BYOD">BYOD (Bring Your Own Device)</SelectItem>
                      <SelectItem value="Third-Party_Risk_Management">Third-Party Risk Management</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status" className="text-gray-300">Status</Label>
                  <Select value={policy.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger id="status" className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600 text-white">
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="In_Review">In Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="version" className="text-gray-300">Version</Label>
                  <Input id="version" value={policy.version} onChange={(e) => handleInputChange('version', e.target.value)} className="bg-slate-800/50 border-gray-600 text-white" />
                </div>

                {/* Approval Date with auto-closing calendar */}
                <div>
                  <Label className="text-sm font-medium text-gray-200 mb-2 block">
                    Approval Date
                  </Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-white" />
                        {policy.approved_date 
                          ? format(policy.approved_date, 'PPP')
                          : 'Select approval date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600">
                      <Calendar
                        mode="single"
                        selected={policy.approved_date || undefined}
                        onSelect={(date) => {
                          handleInputChange('approved_date', date);
                          setIsDatePickerOpen(false);
                        }}
                        initialFocus
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Next Review Date with auto-closing calendar */}
                <div>
                  <Label className="text-sm font-medium text-gray-200 mb-2 block">
                    Next Review Date
                  </Label>
                  <Popover open={isReviewDatePickerOpen} onOpenChange={setIsReviewDatePickerOutlined}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-white" />
                        {policy.next_review_date 
                          ? format(policy.next_review_date, 'PPP')
                          : 'Select next review date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600">
                      <Calendar
                        mode="single"
                        selected={policy.next_review_date || undefined}
                        onSelect={(date) => {
                          handleInputChange('next_review_date', date);
                          setIsReviewDatePickerOutlined(false);
                        }}
                        initialFocus
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
