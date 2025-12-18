import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, AlertTriangle, Shield, Users, ChevronUp, ChevronDown, Briefcase, ShieldAlert, Scale, Globe, CircleCheck, Search, Calendar as CalendarIcon, Loader2, Save, Building } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import InlineControlManager from "./InlineControlManager";
import AddFrameworkDialog from "./AddFrameworkDialog";
import TooltipInfo from '../ui/TooltipInfo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import PCISpecificFields from './PCISpecificFields';
import AudioTranscriber from "../common/AudioTranscriber";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { toast } from "sonner";
import { surfaceExposureRecon } from "@/functions/surfaceExposureRecon";

// Helper component for a simple loading spinner
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center space-x-2 text-white">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    <span>{message}</span>
  </div>
);

// SurfaceExposureRecon Component
const SurfaceExposureRecon = ({ domain, onResultsUpdate }) => {
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scannedDomain, setScannedDomain] = useState(null);

  const handleScan = useCallback(async () => {
    if (!domain) {
      setScanError("Please enter a company website to scan.");
      setScanResults(null);
      return;
    }

    const normalizeDomain = (value) => {
      try {
        const url = new URL(value.includes("://") ? value : `https://${value}`);
        return (url.hostname || "").replace(/^www\./i, "");
      } catch {
        return String(value).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
      }
    };

    const sanitized = normalizeDomain(domain);
    if (!sanitized) {
      setScanError("Invalid domain format. Please provide a valid website address (e.g., example.com).");
      setScanResults(null);
      return;
    }

    setScanLoading(true);
    setScanError(null);
    setScanResults(null);
    setScannedDomain(null);

    try {
      console.log('[components/assessment/CompanyInfoForm.js] Surface exposure scan for:', sanitized);
      const response = await surfaceExposureRecon({ domain: sanitized });

      if (response?.status === 200) {
        const results = response.data;
        setScanResults(results);
        setScannedDomain(sanitized);
        onResultsUpdate(results);
      } else {
        const msg = response?.data?.error || 'Surface exposure scan failed';
        setScanError(msg);
      }
    } catch (err) {
      console.error("[components/assessment/CompanyInfoForm.js] Surface exposure scan failed:", err?.response || err);
      const serverMsg = err?.response?.data?.error || err?.message || "Failed to perform scan. Please try again later.";
      setScanError(serverMsg);
    } finally {
      setScanLoading(false);
    }
  }, [domain, onResultsUpdate]);

  const totalCves = (scanResults?.cve_correlations?.critical?.length || 0) +
                     (scanResults?.cve_correlations?.high?.length || 0) +
                     (scanResults?.cve_correlations?.medium?.length || 0);

  return (
    <Card className="glass-effect border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-purple-300 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          External Attack Surface Reconnaissance
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Scan your public-facing attack surface using Shodan intelligence and correlate with known CVEs.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Button
            onClick={handleScan}
            disabled={scanLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-2 rounded-md transition-all duration-200"
          >
            {scanLoading ? (
              <LoadingSpinner message="Scanning..." />
            ) : (
              <span className="flex items-center justify-center">
                <Search className="w-5 h-5 mr-2" /> Scan External Attack Surface for {domain}
              </span>
            )}
          </Button>

          {scanError && (
            <div className="flex items-center space-x-2 text-red-400 mt-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{scanError}</span>
            </div>
          )}

          {scanResults && (
            <div className="mt-4 p-4 bg-slate-800/70 rounded-lg border border-purple-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
                <CircleCheck className="w-5 h-5 mr-2 text-green-400" /> Scan Results for {scannedDomain}
              </h4>
              <p className="text-sm text-gray-300 mb-4">Found {scanResults.total_exposures} external exposures for analysis.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-white mb-2">Overall Risk Score:</p>
                  <div className={`p-2 rounded-md font-bold text-center ${
                    scanResults.risk_score > 70 ? 'bg-red-900/50 text-red-300 border border-red-700' :
                    scanResults.risk_score > 50 ? 'bg-orange-900/50 text-orange-300 border border-orange-700' :
                    'bg-green-900/50 text-green-300 border border-green-700'
                  }`}>
                    {scanResults.risk_score}/100
                  </div>
                </div>

                <div>
                  <p className="font-medium text-white mb-2">Exposed Assets:</p>
                  {scanResults.exposed_assets && scanResults.exposed_assets.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-300 space-y-1 max-h-20 overflow-y-auto">
                      {scanResults.exposed_assets.slice(0, 3).map((asset, index) => (
                        <li key={index}>{asset.ip}:{asset.port} ({asset.service})</li>
                      ))}
                      {scanResults.exposed_assets.length > 3 && (
                        <li className="text-gray-400">...and {scanResults.exposed_assets.length - 3} more</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No significant exposed assets found.</p>
                  )}
                </div>

                <div>
                  <p className="font-medium text-white mb-2">Technology Stack:</p>
                  {scanResults.tech_stack && scanResults.tech_stack.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-300 space-y-1 max-h-20 overflow-y-auto">
                      {scanResults.tech_stack.slice(0, 3).map((tech, index) => (
                        <li key={index}>{tech}</li>
                      ))}
                      {scanResults.tech_stack.length > 3 && (
                        <li className="text-gray-400">...and {scanResults.tech_stack.length - 3} more</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No prominent technologies identified.</p>
                  )}
                </div>

                <div>
                  <p className="font-medium text-white mb-2">Correlated CVEs ({totalCves}):</p>
                  {totalCves > 0 ? (
                    <div className="space-y-2">
                      {scanResults.cve_correlations?.critical?.length > 0 && (
                        <div className="text-red-300">
                          <span className="font-semibold">Critical:</span> {scanResults.cve_correlations.critical.length}
                        </div>
                      )}
                      {scanResults.cve_correlations?.high?.length > 0 && (
                        <div className="text-orange-300">
                          <span className="font-semibold">High:</span> {scanResults.cve_correlations.high.length}
                        </div>
                      )}
                      {scanResults.cve_correlations?.medium?.length > 0 && (
                        <div className="text-yellow-300">
                          <span className="font-semibold">Medium:</span> {scanResults.cve_correlations.medium.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400">No immediate CVE correlations found.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


export default function CompanyInfoForm({
  data,
  onUpdate,
  onNext,
  managedFrameworks,
  loadingFrameworks,
  onFrameworkCreated,
  onSave,
  saving,
  currentUser
}) {
  const [showControlsSection, setShowControlsSection] = useState(false);
  const [showPrivacyLaws, setShowPrivacyLaws] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Ref to track previous 'saving' prop value
  const prevSavingRef = useRef(saving);

  // Wrapped onUpdate to mark changes as unsaved
  const handleUpdate = useCallback((key, value) => {
    onUpdate(key, value);
    setHasUnsavedChanges(true);
  }, [onUpdate]);

  // Wrapped appendOrReplace to use handleUpdate
  const appendOrReplace = useCallback((field, text) => {
    const current = data[field] || "";
    const newVal = current.trim() === "" ? text : `${current}\n${text}`;
    handleUpdate(field, newVal);
  }, [data, handleUpdate]);

  // Wrapped handlePrivacyLawChange to use handleUpdate
  const handlePrivacyLawChange = useCallback((lawValue, checked) => {
    const currentLaws = data.applicable_privacy_laws || [];
    let updatedLaws;

    if (checked) {
      updatedLaws = [...new Set([...currentLaws, lawValue])];
    } else {
      updatedLaws = currentLaws.filter(law => law !== lawValue);
    }
    handleUpdate('applicable_privacy_laws', updatedLaws);
  }, [data.applicable_privacy_laws, handleUpdate]);

  // Auto-populate company data when currentUser becomes available
  useEffect(() => {
    if (currentUser && !data.company_name && currentUser.company_name) {
      console.log('Auto-populating company data from currentUser prop');
      onUpdate('company_name', currentUser.company_name);
    }
    if (currentUser && !data.company_id && currentUser.company_id) {
      onUpdate('company_id', currentUser.company_id);
    }
  }, [currentUser, data.company_name, data.company_id, onUpdate]);

  // Effect to handle page refresh warning
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges && !saving) {
        event.preventDefault();
        event.returnValue = '';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, saving]);

  // Effect to reset hasUnsavedChanges when save operation completes
  useEffect(() => {
    if (prevSavingRef.current && !saving && hasUnsavedChanges) {
      setHasUnsavedChanges(false);
    }
    prevSavingRef.current = saving;
  }, [saving, hasUnsavedChanges]);


  const industries = [
    { value: "Healthcare", label: "Healthcare & Life Sciences" },
    { value: "Financial_Services", label: "Financial Services & Banking" },
    { value: "Technology", label: "Technology & Software" },
    { value: "Manufacturing", label: "Manufacturing & Industrial" },
    { value: "Retail", label: "Retail & E-commerce" },
    { value: "Education", label: "Education & Research" },
    { value: "Government", label: "Government & Public Sector" },
    { value: "Energy", label: "Energy & Utilities" },
    { value: "Legal", label: "Legal & Professional Services" },
    { value: "UK_Transport", label: "UK Transport (CNI)" },
    { value: "UK_Water", label: "UK Water (CNI)" },
    { value: "UK_Digital_Infrastructure", label: "UK Digital Infrastructure (CNI)" },
    { value: "Other", label: "Other" }
  ];

  const companySizes = [
    { value: "Small_1-50", label: "Small (1-50 employees)" },
    { value: "Medium_51-500", label: "Medium (51-500 employees)" },
    { value: "Large_501-2000", label: "Large (501-2,000 employees)" },
    { value: "Enterprise_2000+", label: "Enterprise (2,000+ employees)" }
  ];

  const privacyLaws = [
    { value: "UK_GDPR", label: "UK GDPR (United Kingdom)", description: "United Kingdom General Data Protection Regulation" },
    { value: "CCPA_CPRA", label: "California Consumer Privacy Act (CCPA) / California Privacy Rights Act (CPRA)", description: "California residents' data privacy rights" },
    { value: "VCDPA", label: "Virginia Consumer Data Protection Act (VCDPA)", description: "Virginia residents' data privacy rights" },
    { value: "CPA", label: "Colorado Privacy Act (CPA)", description: "Colorado residents' data privacy rights" },
    { value: "UCPA", label: "Utah Consumer Privacy Act (UCPA)", description: "Utah residents' data privacy rights" },
    { value: "CTDPA", label: "Connecticut Data Privacy Act (CTDPA)", description: "Connecticut residents' data privacy rights" },
    { value: "NY_SHIELD", label: "New York SHIELD Act", description: "NY data breach notification and security requirements" },
    { value: "BIPA", label: "Illinois Biometric Information Privacy Act (BIPA)", description: "Illinois biometric data protection requirements" },
    { value: "ICDPA", label: "Iowa Consumer Data Protection Act (ICDPA)", description: "Iowa residents' data privacy rights" },
    { value: "INCDPA", label: "Indiana Consumer Data Protection Act (INCDPA)", description: "Indiana residents' data privacy rights" },
    { value: "TIPA", label: "Tennessee Information Protection Act (TIPA)", description: "Tennessee residents' data privacy rights" },
    { value: "MCDPA", label: "Montana Consumer Data Privacy Act (MCDPA)", description: "Montana residents' data privacy rights" },
    { value: "DPDPA", label: "Delaware Personal Data Privacy Act (DPDPA)", description: "Delaware residents' data privacy rights" },
    { value: "NJCDPA", label: "New Jersey Consumer Data Privacy Act (NJCDPA)", description: "New Jersey residents' data privacy rights" }
  ];

  const isValid = useCallback(() => {
    return (
      !!data.company_name &&
      !!data.company_id &&
      !!data.company_website &&
      !!data.framework &&
      !!data.industry_sector &&
      !!data.company_size &&
      !!data.company_description &&
      !!data.security_compliance_goals &&
      !!data.previous_gap_analysis_details &&
      !!data.current_biggest_risks &&
      !!data.business_critical_systems &&
      !!data.ciso_perspective
    );
  }, [data]);

  const handleNext = async () => {
    onNext();
  };

  // Check if PCI DSS is selected
  const isPCISelected = data.framework && managedFrameworks.find(f => f.id === data.framework)?.framework_type === 'PCI_DSS';

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="glass-effect border-cyan-500/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <Building className="w-6 h-6" />
              Company Information
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Provide basic information about your organization to begin the assessment
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName" className="text-white font-medium">
                    Company Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={data.company_name || ""}
                    onChange={(e) => handleUpdate('company_name', e.target.value)}
                    placeholder="Enter company name"
                    className="bg-slate-800/50 border-gray-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="companyWebsite" className="text-white font-medium">
                    Company Website <span className="text-red-400">*</span>
                    <TooltipInfo text="Primary website/domain used for external security reconnaissance and attack surface analysis." />
                  </Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={data.company_website || ""}
                    onChange={(e) => handleUpdate('company_website', e.target.value)}
                    placeholder="https://example.com"
                    className="bg-slate-800/50 border-gray-600 text-white"
                    required
                  />
                  {!data.company_website && (
                    <p className="text-red-400 text-sm mt-1">
                      Please enter your company website. This is required for external attack surface reconnaissance and security analysis.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Compliance Framework */}
            <div>
              <Label htmlFor="framework" className="text-white font-medium">
                Compliance Framework *
              </Label>
              <div className="flex gap-2">
                <Select
                  value={data.framework || ""}
                  onValueChange={(value) => handleUpdate('framework', value)}
                  disabled={loadingFrameworks}
                >
                  <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white flex-1">
                    <SelectValue placeholder={loadingFrameworks ? "Loading frameworks..." : "Choose a framework..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600">
                    {!loadingFrameworks && managedFrameworks.length > 0 ? (
                      managedFrameworks.map(fw => (
                        <SelectItem key={fw.id} value={fw.id} className="text-white">
                          {fw.name} ({fw.framework_type.replace(/_/g, ' ')})
                        </SelectItem>
                      ))
                    ) : (
                      !loadingFrameworks && <div className="p-4 text-center text-gray-400 text-sm">No frameworks configured. Click + to add one.</div>
                    )}
                  </SelectContent>
                </Select>
                <AddFrameworkDialog onFrameworkCreated={onFrameworkCreated} />
              </div>
              {!data.framework && (
                <p className="text-red-400 text-sm mt-1">
                  Select or create a compliance framework. Click + to add if none exists.
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Completion Date (Optional)
                <TooltipInfo text="The desired completion date for this assessment. This is for planning purposes." />
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-slate-800/50 border-gray-600 text-white hover:bg-slate-700"
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-white" />
                    {data.target_completion_date
                      ? format(new Date(data.target_completion_date), 'PPP')
                      : 'Select target date'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-gray-600">
                  <Calendar
                    mode="single"
                    selected={data.target_completion_date ? new Date(data.target_completion_date) : undefined}
                    onSelect={(date) => handleUpdate('target_completion_date', date)}
                    disabled={(date) => date < new Date()}
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Company Description */}
            <div>
              <Label htmlFor="company_description" className="text-gray-300 text-sm font-medium">
                Company Description <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="company_description"
                value={data.company_description || ""}
                onChange={(e) => handleUpdate('company_description', e.target.value)}
                className="bg-slate-800/50 border-gray-600 text-white min-h-[120px]"
                placeholder="Describe what your company does, primary business focus, key services or products..."
                required
              />
              <div className="mt-2">
                <AudioTranscriber
                  title="Dictate Company Description"
                  onTextReady={(txt) => appendOrReplace('company_description', txt)}
                  maxMinutes={5}
                  showCostNotice
                />
              </div>
            </div>

            {/* Industry Sector */}
            <div>
              <Label htmlFor="industry_sector" className="text-gray-300 text-sm font-medium">
                Industry Sector <span className="text-red-400">*</span>
              </Label>
              <Select
                value={data.industry_sector || ""}
                onValueChange={(value) => handleUpdate('industry_sector', value)}
                required
              >
                <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  {industries.map(industry => (
                    <SelectItem key={industry.value} value={industry.value} className="text-white">{industry.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Size */}
            <div>
              <Label htmlFor="company_size" className="text-gray-300 text-sm font-medium">
                Company Size <span className="text-red-400">*</span>
              </Label>
              <Select
                value={data.company_size || ""}
                onValueChange={(value) => handleUpdate('company_size', value)}
                required
              >
                <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  {companySizes.map(size => (
                    <SelectItem key={size.value} value={size.value} className="text-white">{size.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Combined Privacy Laws Section */}
            <div className="pt-6 border-t border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Scale className="w-5 h-5 mr-2 text-amber-300" />
                  <h3 className="text-lg font-semibold text-amber-300">Applicable Privacy Laws</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrivacyLaws(!showPrivacyLaws)}
                  className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 px-3 py-2 rounded-md border border-amber-500/30"
                >
                  {showPrivacyLaws ? 'Hide Laws' : 'Configure Privacy Laws'}
                  {showPrivacyLaws ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Select any privacy laws that apply to your organization. This helps tailor compliance recommendations to your specific regulatory requirements. For a snapshot of each law, navigate to the Resources page.
              </p>
              {showPrivacyLaws && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {privacyLaws.map((law) => (
                      <div key={law.value} className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg border border-gray-600/50 hover:border-amber-500/40 hover:bg-slate-600/50 transition-all duration-200 cursor-pointer">
                        <Checkbox
                          id={law.value}
                          checked={(data.applicable_privacy_laws || []).includes(law.value)}
                          onCheckedChange={(checked) => handlePrivacyLawChange(law.value, checked)}
                          className="mt-1 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-500 border-2 border-gray-400"
                        />
                        <div className="flex-1">
                          <Label htmlFor={law.value} className="font-medium text-white cursor-pointer text-sm">
                            {law.label}
                          </Label>
                          <p className="text-xs text-gray-300 mt-1">{law.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(data.applicable_privacy_laws || []).length > 0 && (
                    <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                      <p className="text-sm text-amber-200">
                        <strong>Selected:</strong> {(data.applicable_privacy_laws || []).length} privacy law(s) will be considered in your assessment and recommendations.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NIS2 Directive Alignment Section */}
            <div className="pt-6 border-t border-gray-700/50">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <div className="flex justify-between items-center cursor-pointer group">
                    <h3 className="text-lg font-semibold text-yellow-300 flex items-center">
                      <ShieldAlert className="w-5 h-5 mr-2" />
                      NIS2 Directive Alignment (For the EU)
                    </h3>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-yellow-300 group-[[data-state=open]]:rotate-180 transition-transform duration-200" />
                  </div>
                </CollapsibleTrigger>
                <p className="text-gray-400 text-sm mb-4">Provide details on these key areas to better align your assessment with the EU's NIS2 Directive requirements for essential and important entities.</p>
                <CollapsibleContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nis2_supply_chain_security" className="flex items-center text-gray-300 text-sm font-medium">
                      Supply Chain & Third-Party Security
                      <TooltipInfo text="Describe how your organization assesses and manages cybersecurity risks related to your direct suppliers and service providers, including their access to your data and networks." />
                    </Label>
                    <Textarea
                      id="nis2_supply_chain_security"
                      value={data.nis2_supply_chain_security || ""}
                      onChange={(e) => handleUpdate('nis2_supply_chain_security', e.target.value)}
                      placeholder="e.g., 'We perform risk assessments for all new vendors, including security questionnaires. Critical vendors are reviewed annually. We have security clauses in our contracts...'"
                      className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nis2_business_continuity" className="flex items-center text-gray-300 text-sm font-medium">
                      Business Continuity & Crisis Management
                      <TooltipInfo text="Describe your plans for backup management, disaster recovery, and crisis management. How do you ensure essential services can continue during and after an incident?" />
                    </Label>
                    <Textarea
                      id="nis2_business_continuity"
                      value={data.nis2_business_continuity || ""}
                      onChange={(e) => handleUpdate('nis2_business_continuity', e.target.value)}
                      placeholder="e.g., 'We have a formal BCP/DR plan, tested annually. Backups are performed daily, stored off-site, and restore tests are done quarterly. Crisis management team is defined...'"
                      className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nis2_vulnerability_handling" className="flex items-center text-gray-300 text-sm font-medium">
                      Vulnerability Handling & Disclosure
                      <TooltipInfo text="Outline your policies and procedures for identifying, evaluating, and remediating vulnerabilities. Do you have a vulnerability disclosure policy (VDP)?" />
                    </Label>
                    <Textarea
                      id="nis2_vulnerability_handling"
                      value={data.nis2_vulnerability_handling || ""}
                      onChange={(e) => handleUpdate('nis2_vulnerability_handling', e.target.value)}
                      placeholder="e.g., 'We use Tenable for monthly vulnerability scans. Critical vulnerabilities are patched within 14 days. We have a private bug bounty program...'"
                      className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nis2_use_of_crypto" className="flex items-center text-gray-300 text-sm font-medium">
                      Use of Cryptography & Encryption
                      <TooltipInfo text="Describe your policies regarding the use of cryptography and encryption for data at rest and data in transit." />
                    </Label>
                    <Textarea
                      id="nis2_use_of_crypto"
                      value={data.nis2_use_of_crypto || ""}
                      onChange={(e) => handleUpdate('nis2_use_of_crypto', e.target.value)}
                      placeholder="e.g., 'All data in transit is encrypted using TLS 1.2+. Data at rest in our cloud environments (databases, object storage) is encrypted using AES-256. We maintain a formal cryptography policy...'"
                      className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nis2_essential_services" className="flex items-center text-gray-300 text-sm font-medium">
                      Essential/Important Services Identification
                      <TooltipInfo text="Identify which of your services would be classified as 'essential' or 'important' under NIS2. Consider services whose disruption would significantly impact economic or societal activities." />
                    </Label>
                    <Textarea
                      id="nis2_essential_services"
                      value={data.nis2_essential_services || ""}
                      onChange={(e) => handleUpdate('nis2_essential_services', e.target.value)}
                      placeholder="e.g., 'Our primary SaaS platform serves 50,000+ users in healthcare sector across EU. Service disruption would impact patient care delivery. We also process payment data for essential services...'"
                      className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nis2_governance_framework" className="flex items-center text-gray-300 text-sm font-medium">
                      Cybersecurity Governance Framework
                      <TooltipInfo text="Describe your organization's cybersecurity governance structure, including board oversight, risk management integration, and decision-making processes." />
                    </Label>
                    <Textarea
                      id="nis2_governance_framework"
                      value={data.nis2_governance_framework || ""}
                      onChange={(e) => handleUpdate('nis2_governance_framework', e.target.value)}
                      placeholder="e.g., 'Board receives quarterly cybersecurity briefings. CISO reports directly to CEO. Risk committee includes cybersecurity as standing agenda item. Annual security budget approval process...'"
                      className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nis2_human_resources_security" className="flex items-center text-gray-300 text-sm font-medium">
                      Human Resources Security & Training
                      <TooltipInfo text="Detail your approaches to cybersecurity awareness training, background checks for security-sensitive roles, and ongoing security education programs." />
                    </Label>
                    <Textarea
                      id="nis2_human_resources_security"
                      value={data.nis2_human_resources_security || ""}
                      onChange={(e) => handleUpdate('nis2_human_resources_security', e.target.value)}
                      placeholder="e.g., 'All staff complete mandatory annual security awareness training. Privileged users receive additional training quarterly. Background checks for all system admin roles. Monthly phishing simulations...'"
                      className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 h-24"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Collapsible Control Management Section */}
            {data.framework && (
              <div className="pt-6 border-t border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-300" />
                    <h3 className="text-lg font-semibold text-purple-300">Framework Controls (Optional)</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowControlsSection(!showControlsSection)}
                    className="text-purple-300 hover:text-purple-200"
                  >
                    {showControlsSection ? 'Hide Controls' : 'Manage Controls'}
                    {showControlsSection ? (
                      <ChevronUp className="w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  You can manage specific compliance controls for your framework here, or skip this and proceed with your assessment.
                </p>
                {showControlsSection && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <InlineControlManager frameworkId={data.framework} />
                  </div>
                )}
              </div>
            )}

            {/* Surface Exposure Recon Integration */}
            {data.company_website && (
              <div className="pt-6 border-t border-gray-700/50">
                <SurfaceExposureRecon
                  domain={data.company_website}
                  onResultsUpdate={(results) => {
                    handleUpdate('external_attack_surface', JSON.stringify({
                      exposed_assets: results.exposed_assets,
                      tech_stack: results.tech_stack,
                      total_exposures: results.total_exposures
                    }));
                    handleUpdate('external_cve_threats', JSON.stringify(results.cve_correlations));
                    handleUpdate('surface_exposure_score', results.risk_score || 0);
                  }}
                />
              </div>
            )}

            <div className="pt-6 border-t border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Company Profile
              </h3>
            </div>

            {/* Strategic Context Fields */}
            <div className="pt-6 border-t border-gray-700/50">
              <h3 className="text-lg font-semibold text-red-500 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Strategic Security Context
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="security_compliance_goals" className="flex items-center text-gray-300 text-sm font-medium">
                    Strategic Context & Objectives <span className="text-red-400">*</span>
                    <TooltipInfo text="What are you trying to achieve with this assessment? (e.g., 'Prepare for SOC 2 Type 1 audit,' 'Identify top 5 security gaps,' 'Improve overall security maturity by 20%')." />
                  </Label>
                  <Textarea
                    id="security_compliance_goals"
                    value={data.security_compliance_goals || ""}
                    onChange={(e) => handleUpdate('security_compliance_goals', e.target.value)}
                    placeholder="What are your organization's specific security and compliance goals? Are you preparing for an audit, seeking certification, or addressing regulatory requirements?"
                    className="bg-slate-800/50 border-gray-600 text-white h-24 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    required
                  />
                  <div className="mt-2">
                    <AudioTranscriber
                      title="Dictate Objectives"
                      onTextReady={(txt) => appendOrReplace('security_compliance_goals', txt)}
                      compact
                      maxMinutes={5}
                      showCostNotice
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previous_gap_analysis_details" className="text-gray-300 text-sm font-medium">
                    Previous Security Assessments & Outstanding Issues <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="previous_gap_analysis_details"
                    value={data.previous_gap_analysis_details || ""}
                    onChange={(e) => handleUpdate('previous_gap_analysis_details', e.target.value)}
                    placeholder="Have you conducted previous security assessments or gap analyses? What were the key findings and what issues remain unresolved?"
                    className="bg-slate-800/50 border-gray-600 text-white h-24 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    required
                  />
                  <div className="mt-2">
                    <AudioTranscriber
                      title="Dictate Previous Assessments"
                      onTextReady={(txt) => appendOrReplace('previous_gap_analysis_details', txt)}
                      compact
                      maxMinutes={5}
                      showCostNotice
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_biggest_risks" className="flex items-center text-gray-300 text-sm font-medium">
                    Current Top Security Concerns & Threat Landscape <span className="text-red-400">*</span>
                    <TooltipInfo text="What known security risks keep you up at night? (e.g., 'Ransomware attack,' 'Data breach via a third-party vendor,' 'Insider threat from a privileged user')." />
                  </Label>
                  <Textarea
                    id="current_biggest_risks"
                    value={data.current_biggest_risks || ""}
                    onChange={(e) => handleUpdate('current_biggest_risks', e.target.value)}
                    placeholder="What are the biggest security risks and concerns your organization is currently facing? Include any recent incidents or emerging threats."
                    className="bg-slate-800/50 border-gray-600 text-white h-24 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    required
                  />
                  <div className="mt-2">
                    <AudioTranscriber
                      title="Dictate Risks"
                      onTextReady={(txt) => appendOrReplace('current_biggest_risks', txt)}
                      compact
                      maxMinutes={5}
                      showCostNotice
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_critical_systems" className="text-gray-300 text-sm font-medium">
                    Business-Critical Systems & Data at Risk <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="business_critical_systems"
                    value={data.business_critical_systems || ""}
                    onChange={(e) => handleUpdate('business_critical_systems', e.target.value)}
                    placeholder="What are your most critical systems, applications, and data assets? What would be the business impact if these were compromised?"
                    className="bg-slate-800/50 border-gray-600 text-white h-24 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    required
                  />
                  <div className="mt-2">
                    <AudioTranscriber
                      title="Dictate Critical Systems"
                      onTextReady={(txt) => appendOrReplace('business_critical_systems', txt)}
                      compact
                      maxMinutes={5}
                      showCostNotice
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciso_perspective" className="flex items-center font-bold text-orange-500 text-sm font-medium">
                    CISO Perspective & Leadership Context <span className="text-red-400">*</span>
                    <TooltipInfo text="What are the key messages or takeaways you need for executive leadership from this assessment? (e.g., 'We need a 15% budget increase for security tooling,' 'Our incident response plan is outdated and needs immediate attention')." />
                  </Label>
                  <Textarea
                    id="ciso_perspective"
                    value={data.ciso_perspective || ""}
                    onChange={(e) => handleUpdate('ciso_perspective', e.target.value)}
                    placeholder="What key messages or insights do you need to communicate to executive leadership? What are the business drivers behind this assessment?"
                    className="bg-slate-800/50 border-gray-600 text-white h-24 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    required
                  />
                  <div className="mt-2">
                    <AudioTranscriber
                      title="Dictate CISO Perspective"
                      onTextReady={(txt) => appendOrReplace('ciso_perspective', txt)}
                      compact
                      maxMinutes={5}
                      showCostNotice
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700/50">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Compliance Management & Evidence Collection</h3>
              <div className="space-y-2">
                <Label htmlFor="compliance_tooling_details" className="text-gray-300 text-sm font-medium">
                  How do you currently track compliance obligations and manage evidence collection? Include tools, processes, and challenges.
                </Label>
                <Textarea
                  id="compliance_tooling_details"
                  value={data.compliance_tooling_details || ""}
                  onChange={(e) => handleUpdate('compliance_tooling_details', e.target.value)}
                  placeholder="Examples: 'We use Vanta for SOC 2 continuous monitoring and evidence automation. Manual evidence collection for ISO 27001. Quarterly compliance reviews with legal team. Main challenge is keeping policies updated and ensuring consistent implementation across teams.'"
                  className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 h-28"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                <span className="text-red-400">*</span> Required fields
              </div>
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
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 px-8 py-3 text-lg"
                >
                  Continue to Operational Security
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditional PCI DSS specific fields */}
        {isPCISelected && (
          <PCISpecificFields data={data} onUpdate={handleUpdate} />
        )}
      </div>
    </TooltipProvider>
  );
}