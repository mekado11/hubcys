import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Settings, CheckCircle, Loader2 } from 'lucide-react';
import { InvokeLLM } from '@/integrations/Core';
import { toast } from 'sonner';
import { POLICY_TEMPLATES } from './PolicyTemplates';

export default function PolicyGenerator({ 
  policyType, 
  frameworks = [], 
  companyName = "[COMPANY NAME]", 
  onPolicyGenerated,
  initialCustomizations = {}
}) {
  const [customizations, setCustomizations] = useState({
    includeTemplateText: true,
    includeFrameworkMappings: true,
    includeImplementationGuidance: true,
    specificRequirements: '',
    ...initialCustomizations
  });
  
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePolicy = useCallback(async () => {
    setIsGenerating(true);
    try {
      let generatedContent;
      let policyTitle;
      let frameworksToAlign = customizations.includeFrameworkMappings ? frameworks : [];

      // Check for hardcoded template first - NO EXCEPTIONS
      if (POLICY_TEMPLATES[policyType]) {
        const template = POLICY_TEMPLATES[policyType];
        generatedContent = template.content(companyName);
        policyTitle = template.title;
        
        console.log(`Using hardcoded template for ${policyType}`);
        
        onPolicyGenerated({
          title: policyTitle,
          content: generatedContent,
          policy_type: policyType,
          framework_alignment: template.frameworks,
          company_id: companyName
        });

        toast.success(`${policyTitle} generated successfully using template!`);
      } else {
        // Fallback to LLM ONLY for policy types without hardcoded templates
        console.log(`No template found for ${policyType}, using LLM fallback`);
        
        const prompt = `Generate a comprehensive ${policyType.replace(/_/g, ' ')} policy for ${companyName}. 
        
        Framework alignment: ${frameworksToAlign.join(', ')}
        
        Customizations: ${JSON.stringify(customizations)}
        
        The policy should be detailed, actionable, and include specific controls and procedures.`;

        const response = await InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              sections: { 
                type: "array", 
                items: { type: "string" } 
              }
            }
          }
        });

        if (!response.title || !response.content) {
          throw new Error('Invalid response format or empty response from LLM.');
        }
        
        generatedContent = response.content;
        policyTitle = response.title;

        onPolicyGenerated({
          title: policyTitle,
          content: generatedContent,
          policy_type: policyType,
          framework_alignment: frameworks,
          company_id: companyName
        });

        toast.success(`${policyType.replace(/_/g, ' ')} Policy generated successfully using AI!`);
      }

    } catch (error) {
      console.error('Error generating policy:', error);
      toast.error('Failed to generate policy. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [policyType, frameworks, companyName, customizations, onPolicyGenerated]);

  // Get template info if available
  const templateInfo = POLICY_TEMPLATES[policyType];
  const hasTemplate = !!templateInfo;

  return (
    <div className="space-y-6">
      {/* Template Status Indicator */}
      <Card className="glass-effect border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-300 flex items-center">
            {hasTemplate ? <CheckCircle className="w-5 h-5 mr-2 text-green-400" /> : <FileText className="w-5 h-5 mr-2" />}
            Policy Generation Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasTemplate ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Professional Template Available
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  {templateInfo.priority.toUpperCase()} Priority
                </Badge>
              </div>
              <p className="text-gray-300">
                This policy type has a professionally crafted template that aligns with industry best practices and compliance frameworks.
              </p>
              <div className="flex flex-wrap gap-2">
                {templateInfo.frameworks.map(framework => (
                  <Badge key={framework} variant="outline" className="border-slate-500 text-slate-300">
                    {framework.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                AI-Generated Policy
              </Badge>
              <p className="text-gray-300">
                This policy will be generated using AI based on your specifications and selected frameworks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customization Options - Only show for LLM-generated policies */}
      {!hasTemplate && (
        <Card className="glass-effect border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Customization Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTemplateText"
                  checked={customizations.includeTemplateText}
                  onCheckedChange={(checked) => 
                    setCustomizations(prev => ({ ...prev, includeTemplateText: checked }))
                  }
                />
                <Label htmlFor="includeTemplateText" className="text-gray-300">
                  Include template text placeholders
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFrameworkMappings"
                  checked={customizations.includeFrameworkMappings}
                  onCheckedChange={(checked) => 
                    setCustomizations(prev => ({ ...prev, includeFrameworkMappings: checked }))
                  }
                />
                <Label htmlFor="includeFrameworkMappings" className="text-gray-300">
                  Include framework mappings
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeImplementationGuidance"
                  checked={customizations.includeImplementationGuidance}
                  onCheckedChange={(checked) => 
                    setCustomizations(prev => ({ ...prev, includeImplementationGuidance: checked }))
                  }
                />
                <Label htmlFor="includeImplementationGuidance" className="text-gray-300">
                  Include implementation guidance
                </Label>
              </div>
            </div>
            <div>
              <Label htmlFor="specificRequirements" className="text-gray-300 mb-2 block">
                Specific Requirements (Optional)
              </Label>
              <Textarea
                id="specificRequirements"
                value={customizations.specificRequirements}
                onChange={(e) => 
                  setCustomizations(prev => ({ ...prev, specificRequirements: e.target.value }))
                }
                placeholder="Enter any specific requirements or industry considerations..."
                className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Button */}
      <div className="flex justify-center">
        <Button
          onClick={generatePolicy}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 px-8 py-3 text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Policy...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {hasTemplate ? 'Generate from Template' : 'Generate with AI'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}