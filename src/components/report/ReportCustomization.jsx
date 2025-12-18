
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Lock } from 'lucide-react';

export default function ReportCustomization({
  onCustomizationChange,
  canCustomizeBranding = false,
  canFullCustomization = false,
  currentTier = 'free_trial'
}) {
  const [customizations, setCustomizations] = useState({
    includeExecutiveSummary: true,
    companyLogo: '',
    primaryColor: '#60A5FA', // Default primary color
    includeMaturityBreakdown: true,
    includeActionItems: true,
    includeComplianceMapping: true,
    includeRecommendations: true,
    includeFortigapBranding: true,
  });

  useEffect(() => {
    onCustomizationChange(customizations);
  }, [customizations, onCustomizationChange]);

  const updateCustomization = (field, value) => {
    setCustomizations(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="glass-effect border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Report Customization
          {!canCustomizeBranding && <Lock className="w-4 h-4 ml-2 text-gray-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {canCustomizeBranding ? (
          <>
            {/* Executive Summary Toggle */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={customizations.includeExecutiveSummary}
                  onChange={(e) => updateCustomization('includeExecutiveSummary', e.target.checked)}
                  className="rounded"
                />
                <span className="text-white">Include Executive Summary</span>
              </label>
            </div>

            {/* Company Branding */}
            <div className={`space-y-4 ${!canFullCustomization ? 'opacity-60' : ''}`}>
              <h3 className="text-white font-medium flex items-center">
                Company Branding
                {!canFullCustomization && <Lock className="w-3 h-3 ml-2 text-gray-500" />}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="block text-sm text-gray-300 mb-1">Company Logo URL</Label>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={customizations.companyLogo}
                    onChange={(e) => updateCustomization('companyLogo', e.target.value)}
                    disabled={!canFullCustomization}
                    className="bg-slate-800/50 border-gray-600 text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <Label className="block text-sm text-gray-300 mb-1">Primary Brand Color</Label>
                  <Input
                    type="color"
                    value={customizations.primaryColor}
                    onChange={(e) => updateCustomization('primaryColor', e.target.value)}
                    disabled={!canFullCustomization}
                    className="bg-slate-800/50 border-gray-600 h-10 w-20 disabled:opacity-50"
                  />
                </div>
              </div>
              {!canFullCustomization && (
                <p className="text-xs text-yellow-400">
                  Full branding customization available with Enterprise plan
                </p>
              )}
            </div>

            {/* Report Sections */}
            <div className="space-y-4">
              <h3 className="text-white font-medium">Report Sections</h3>
              <div className="space-y-2">
                {[
                  { key: 'includeMaturityBreakdown', label: 'Maturity Breakdown by Domain' },
                  { key: 'includeActionItems', label: 'Prioritized Action Items' },
                  { key: 'includeComplianceMapping', label: 'Compliance Framework Mapping' },
                  { key: 'includeRecommendations', label: 'AI-Generated Recommendations', restricted: !canFullCustomization }
                ].map(section => (
                  <label key={section.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={customizations[section.key]}
                      onChange={(e) => updateCustomization(section.key, e.target.checked)}
                      disabled={section.restricted}
                      className="rounded"
                    />
                    <span className={`${section.restricted ? 'text-gray-500' : 'text-white'}`}>
                      {section.label}
                      {section.restricted && <Lock className="w-3 h-3 inline ml-1" />}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer Options */}
            <div className="space-y-4">
              <h3 className="text-white font-medium">Report Footer</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={customizations.includeFortigapBranding}
                    onChange={(e) => updateCustomization('includeFortigapBranding', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-white">Include "Powered by Fortigap" footer</span>
                </label>
              </div>
            </div>
          </>
        ) : (
          /* Subscription Gate for Report Customization */
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-purple-300 mb-2">
              Report Customization - Premium Feature
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Customize your security reports with branding, section control, and styling options.
            </p>
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-2">Available with Growth plan:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Custom company branding</li>
                <li>• Section visibility controls</li>
                <li>• Professional styling options</li>
                <li>• Remove Fortigap branding</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500">
              Current Plan: <span className="text-cyan-300 capitalize">{currentTier}</span> |
              Required: <span className="text-purple-300">Growth</span> or higher
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
