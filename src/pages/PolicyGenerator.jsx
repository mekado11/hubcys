import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Policy } from '@/entities/Policy';
import { User } from '@/entities/User';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Loader2, AlertTriangle, Lock, Sparkles, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

export default function PolicyGeneratorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    policy_type: '',
    company_context: '',
    specific_requirements: '',
    framework_alignment: [],
    urgency_reason: ''
  });
  
  // Generated policy content
  const [generatedPolicy, setGeneratedPolicy] = useState(null);
  const [policyTitle, setPolicyTitle] = useState('');

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Pre-fill company context
        setFormData(prev => ({
          ...prev,
          company_context: `Company: ${userData.company_name || 'Not specified'}
Industry: ${userData.company_industry || 'Not specified'}  
Size: ${userData.company_size || 'Not specified'}
Description: ${userData.company_description || 'Not specified'}`
        }));
        
        // Check URL parameters for context
        const params = new URLSearchParams(location.search);
        const policyType = params.get('type');
        const context = params.get('context');
        
        setGeneratedPolicy(null);
        setPolicyTitle('');
        
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      
      const prompt = `You are an expert cybersecurity policy writer. Generate a comprehensive, professional security policy document based on the following requirements:

**POLICY TYPE:** ${formData.policy_type.replace(/_/g, ' ')}

**COMPANY CONTEXT:**
${formData.company_context}

**SPECIFIC REQUIREMENTS:**
${formData.specific_requirements || 'Standard industry best practices'}

**URGENCY/BACKGROUND:**
${formData.urgency_reason || 'Proactive policy development'}

**FRAMEWORK ALIGNMENT:**
${formData.framework_alignment.length > 0 ? formData.framework_alignment.join(', ') : 'Industry best practices'}

**INSTRUCTIONS:**
1. Create a complete, professional policy document
2. Include proper sections: Purpose, Scope, Policy Statement, Procedures, Roles & Responsibilities, Compliance, Review
3. Make it specific to the company context provided
4. Use clear, actionable language
5. Include relevant compliance references
6. Format as a professional document ready for executive approval

**OUTPUT FORMAT:**
Return ONLY a JSON object with this structure:
{
  "title": "Complete policy title",
  "content": "Full policy document content in markdown format",
  "summary": "2-3 sentence executive summary",
  "key_controls": ["control1", "control2", "control3"],
  "compliance_frameworks": ["framework1", "framework2"]
}

Generate a policy that would be ready for immediate implementation and executive approval.`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            summary: { type: "string" },
            key_controls: { type: "array", items: { type: "string" } },
            compliance_frameworks: { type: "array", items: { type: "string" } }
          },
          required: ["title", "content", "summary"]
        }
      });

      setGeneratedPolicy(response);
      setPolicyTitle(response.title);
      
    } catch (error) {
      console.error('Error generating policy:', error);
      const errorMessage = displayError(error, {
        title: "Failed to generate policy",
        general: "Unable to generate the policy. Please try again with different inputs.",
        network: "Connection error while generating policy. Please check your internet connection and try again.",
        validation: "Please check that all fields are filled out correctly.",
        permission: "You don't have permission to generate policies. Please contact your administrator."
      });
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPolicy || !generatedPolicy.content || !generatedPolicy.content.trim()) {
      setError("Please generate a policy before saving.");
      return;
    }

    if (!policyTitle.trim()) {
      setError("Please enter a policy title before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      if (!user || !user.company_id) {
        setError('User company information not available. Please refresh and try again.');
        setSaving(false);
        return;
      }

      const policyData = {
        policy_type: formData.policy_type,
        title: policyTitle,
        content: generatedPolicy.content,
        status: 'Draft',
        version: '1.0',
        framework_alignment: generatedPolicy.compliance_frameworks || [],
        tags: ['AI Generated', formData.policy_type.replace(/_/g, ' ')],
        company_id: user.company_id
      };
      
      await Policy.create(policyData);
      navigate(createPageUrl('PolicyLibrary'));
      
    } catch (error) {
      console.error('Error saving policy:', error);
      const errorMessage = displayError(error, {
        title: "Failed to save policy",
        general: "Unable to save the generated policy. Please check all fields and try again.",
        network: "Connection error while saving policy. Please check your internet connection and try again.",
        validation: "Please check that all required fields are filled out correctly.",
        permission: "You don't have permission to save policies. Please contact your administrator."
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link to={createPageUrl("PolicyLibrary")}>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Policy Library
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold cyber-text-glow mb-2">AI Policy Generator</h1>
            <p className="text-gray-400">Generate comprehensive security policies tailored to your organization</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5"/>
            <p>{error}</p>
          </div>
        )}

        {!generatedPolicy ? (
          <Card className="glass-effect border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                Policy Generator
              </CardTitle>
              <p className="text-gray-400">Provide context below and we'll generate a comprehensive security policy tailored to your organization.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-gray-300">Policy Type *</Label>
                <Select value={formData.policy_type} onValueChange={(value) => handleInputChange('policy_type', value)}>
                  <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Select policy type to generate" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600 text-white">
                    <SelectItem value="Access_Control">Access Control Policy</SelectItem>
                    <SelectItem value="Incident_Response">Incident Response Policy</SelectItem>
                    <SelectItem value="Data_Backup_and_Recovery">Data Backup & Recovery Policy</SelectItem>
                    <SelectItem value="Data_Retention_and_Disposal">Data Retention & Disposal Policy</SelectItem>
                    <SelectItem value="Vendor_Security_Management">Vendor Security Management Policy</SelectItem>
                    <SelectItem value="Acceptable_Use">Acceptable Use Policy</SelectItem>
                    <SelectItem value="Password_Policy">Password Policy</SelectItem>
                    <SelectItem value="Change_Management">Change Management Policy</SelectItem>
                    <SelectItem value="Vulnerability_Management">Vulnerability Management Policy</SelectItem>
                    <SelectItem value="Physical_Security">Physical Security Policy</SelectItem>
                    <SelectItem value="Business_Continuity">Business Continuity Policy</SelectItem>
                    <SelectItem value="Third-Party_Risk_Management">Third-Party Risk Management Policy</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label className="text-gray-300">Why is this policy needed? (Context)</Label>
                <Textarea 
                  value={formData.urgency_reason}
                  onChange={(e) => handleInputChange('urgency_reason', e.target.value)}
                  className="bg-slate-800/50 border-gray-600 text-white h-20"
                  placeholder="e.g., 'Gap identified in security assessment', 'Required for SOC 2 compliance', 'Recent incident highlighted need'..."
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={!formData.policy_type || generating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Policy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Policy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="glass-effect border-green-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-green-400" />
                  Generated Policy: {policyTitle || (generatedPolicy ? generatedPolicy.title : 'No Title')}
                </CardTitle>
                <p className="text-gray-400">{generatedPolicy.summary}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label className="text-gray-300">Policy Title</Label>
                  <Input
                    value={policyTitle}
                    onChange={(e) => setPolicyTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your policy (e.g., Remote Work Security Policy)"
                    className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div className="bg-slate-900/50 p-6 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm prose-invert max-w-none text-gray-300
                                  prose-h1:text-xl prose-h1:font-bold prose-h1:text-cyan-300 prose-h1:mb-3
                                  prose-h2:text-lg prose-h2:font-bold prose-h2:text-purple-300 prose-h2:mt-6 prose-h2:mb-3
                                  prose-p:leading-relaxed">
                    <ReactMarkdown>{generatedPolicy.content}</ReactMarkdown>
                  </div>
                </div>
                
                {generatedPolicy.key_controls && generatedPolicy.key_controls.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-gray-300">Key Controls Addressed:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {generatedPolicy.key_controls.map((control, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                          {control}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-4 mt-6">
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save to Policy Library"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setGeneratedPolicy(null);
                      setPolicyTitle('');
                    }} 
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Generate Different Policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}