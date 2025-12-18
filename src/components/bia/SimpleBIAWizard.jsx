import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, ChevronLeft } from "lucide-react";
import TooltipInfo from "../ui/TooltipInfo";
import AIAssistButton from "./AIAssistButton";
import LiveRiskPreview from "./LiveRiskPreview";

export default function SimpleBIAWizard({ item, onUpdate, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [inputs, setInputs] = useState(item?.inputs || {});

  const totalSteps = advancedMode ? 5 : 4;

  // Memoized update function to prevent creating new function references
  const updateInput = useCallback((field, value) => {
    setInputs(prev => {
      const updated = { ...prev, [field]: value };
      if (onUpdate) {
        // Use setTimeout to debounce parent updates slightly
        setTimeout(() => onUpdate(updated), 0);
      }
      return updated;
    });
  }, [onUpdate]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (onComplete) onComplete(inputs);
    }
  }, [currentStep, totalSteps, inputs, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  }, [currentStep]);

  // Memoize step completion check
  const isStepComplete = useMemo(() => {
    switch (currentStep) {
      case 1:
        return inputs.bia_process_name && inputs.bia_process_name.length > 0;
      case 2:
        return inputs.bia_impact_time_to_hurt && inputs.bia_impact_time_to_hurt.length > 0;
      case 3:
        return inputs.bia_impact_revenue_loss_rate && inputs.bia_impact_contract_exposure;
      case 4:
        return inputs.bia_data_classification && inputs.bia_data_public_notice_required;
      case 5:
        return advancedMode && inputs.bia_exposure_vendor_control && inputs.bia_exposure_legacy_status;
      default:
        return false;
    }
  }, [currentStep, inputs, advancedMode]);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {[...Array(totalSteps)].map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx + 1 === currentStep
                  ? "w-12 bg-cyan-500"
                  : idx + 1 < currentStep
                  ? "w-8 bg-cyan-500/50"
                  : "w-8 bg-slate-700"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-400">Advanced Mode</Label>
          <Switch
            checked={advancedMode}
            onCheckedChange={setAdvancedMode}
            className="data-[state=checked]:bg-cyan-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="glass-effect border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                Step {currentStep} of {totalSteps}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: What is Critical? */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      What critical system or function are we analyzing?
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Think about systems, processes, or services that are essential to your operations.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300 mb-2 flex items-center gap-2">
                        Function or System Name
                        <TooltipInfo text="Examples: Payment Gateway, Manufacturing Line 1, Customer Database, Email Server" />
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Order Processing System"
                          value={inputs.bia_process_name || ""}
                          onChange={(e) => updateInput("bia_process_name", e.target.value)}
                          className="bg-slate-800/50 border-gray-600 text-white flex-1"
                        />
                        <AIAssistButton
                          prompt="Suggest a descriptive name for a critical business function"
                          onResult={(result) => updateInput("bia_process_name", result)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-300 mb-2 flex items-center gap-2">
                          Business Category
                          <TooltipInfo text="Which business domain or function owns this system?" />
                        </Label>
                        <Select
                          value={inputs.bia_process_category || ""}
                          onValueChange={(v) => updateInput("bia_process_category", v)}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-gray-700 text-white">
                            <SelectItem value="Business_Operations">Business Operations</SelectItem>
                            <SelectItem value="IT_Systems">IT Systems</SelectItem>
                            <SelectItem value="Cloud_Services">Cloud Services</SelectItem>
                            <SelectItem value="OT_ICS">OT / ICS / SCADA</SelectItem>
                            <SelectItem value="Third_Party_Vendor">Third-Party / Vendor</SelectItem>
                            <SelectItem value="Customer_Facing">Customer-Facing Services</SelectItem>
                            <SelectItem value="Finance">Finance & Accounting</SelectItem>
                            <SelectItem value="HR">Human Resources</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-300 mb-2 flex items-center gap-2">
                          Technical Type
                          <TooltipInfo text="What type of system is this technically?" />
                        </Label>
                        <Select
                          value={inputs.bia_process_type || ""}
                          onValueChange={(v) => updateInput("bia_process_type", v)}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-gray-700 text-white">
                            <SelectItem value="Server">Server/Infrastructure</SelectItem>
                            <SelectItem value="Database">Database</SelectItem>
                            <SelectItem value="Application">Application/Service</SelectItem>
                            <SelectItem value="Network">Network</SelectItem>
                            <SelectItem value="IAM">Identity/Access Management</SelectItem>
                            <SelectItem value="SCADA">SCADA/ICS</SelectItem>
                            <SelectItem value="SaaS">Cloud/SaaS</SelectItem>
                            <SelectItem value="Endpoint">Endpoint/Workstation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Time to Impact */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      When does downtime start to hurt?
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      At what point does losing this system cause real disruption to operations?
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 flex items-center gap-2">
                      Time to Critical Impact
                      <TooltipInfo text="How long can you survive without this system before serious problems arise?" />
                    </Label>
                    <Select
                      value={inputs.bia_impact_time_to_hurt || ""}
                      onValueChange={(v) => updateInput("bia_impact_time_to_hurt", v)}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                        <SelectValue placeholder="Select timeframe..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-gray-700 text-white">
                        <SelectItem value="immediate">Immediate (minutes)</SelectItem>
                        <SelectItem value="1hour">Within 1 hour</SelectItem>
                        <SelectItem value="4hours">Within 4 hours</SelectItem>
                        <SelectItem value="1day">Within 1 day</SelectItem>
                        <SelectItem value="3days">Within 3 days</SelectItem>
                        <SelectItem value="1week">Within 1 week</SelectItem>
                        <SelectItem value="1month">1 month or more</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Financial Impact */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      What's the financial impact?
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Estimate the revenue loss and contractual exposure if this system fails.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300 mb-2 flex items-center gap-2">
                        Revenue Loss Per Hour
                        <TooltipInfo text="Use your best estimate based on sales data or past outages" />
                      </Label>
                      <Select
                        value={inputs.bia_impact_revenue_loss_rate || ""}
                        onValueChange={(v) => updateInput("bia_impact_revenue_loss_rate", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select revenue impact..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="$0–$5k/hr">$0 – $5k per hour</SelectItem>
                          <SelectItem value="$5k–$25k/hr">$5k – $25k per hour</SelectItem>
                          <SelectItem value="$25k–$100k/hr">$25k – $100k per hour</SelectItem>
                          <SelectItem value="$100k–$500k/hr">$100k – $500k per hour</SelectItem>
                          <SelectItem value="$500k+/hr">$500k+ per hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 flex items-center gap-2">
                        Contract/SLA Exposure
                        <TooltipInfo text="Would losing this system trigger penalties or breach client contracts?" />
                      </Label>
                      <Select
                        value={inputs.bia_impact_contract_exposure || ""}
                        onValueChange={(v) => updateInput("bia_impact_contract_exposure", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select contract risk..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="low">Low (&lt;$50k)</SelectItem>
                          <SelectItem value="moderate">Moderate ($50k-$200k)</SelectItem>
                          <SelectItem value="high">High ($200k-$500k)</SelectItem>
                          <SelectItem value="severe">Severe ($500k+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 flex items-center gap-2">
                        Operational Dependency
                        <TooltipInfo text="What percentage of your operations depend on this system?" />
                      </Label>
                      <Select
                        value={inputs.bia_impact_ops_dependency_share || ""}
                        onValueChange={(v) => updateInput("bia_impact_ops_dependency_share", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select dependency..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="0–10%">0-10% of operations</SelectItem>
                          <SelectItem value="11–25%">11-25% of operations</SelectItem>
                          <SelectItem value="26–50%">26-50% of operations</SelectItem>
                          <SelectItem value="51–75%">51-75% of operations</SelectItem>
                          <SelectItem value="76–100%">76-100% of operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Data & Regulatory Exposure */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Data and regulatory considerations
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Help us understand any compliance or data protection requirements.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300 mb-2 flex items-center gap-2">
                        Data Classification
                        <TooltipInfo text="What type of data does this system handle?" />
                      </Label>
                      <Select
                        value={inputs.bia_data_classification || ""}
                        onValueChange={(v) => updateInput("bia_data_classification", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select data type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="none">No sensitive data</SelectItem>
                          <SelectItem value="internal">Internal business data only</SelectItem>
                          <SelectItem value="pii">Personal data (PII)</SelectItem>
                          <SelectItem value="regulated">Regulated data (HIPAA, PCI, etc.)</SelectItem>
                          <SelectItem value="critical">Highly sensitive/classified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 flex items-center gap-2">
                        Public Notification Required?
                        <TooltipInfo text="Would a breach require public disclosure or customer notification?" />
                      </Label>
                      <Select
                        value={inputs.bia_data_public_notice_required || ""}
                        onValueChange={(v) => updateInput("bia_data_public_notice_required", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select notification requirement..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="none">No</SelectItem>
                          <SelectItem value="internal">Internal only</SelectItem>
                          <SelectItem value="customers">Customer notification</SelectItem>
                          <SelectItem value="regulatory">Regulatory notification</SelectItem>
                          <SelectItem value="public">Public disclosure required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 flex items-center gap-2">
                        Regulatory Exposure
                        <TooltipInfo text="Potential fines or penalties from regulators" />
                      </Label>
                      <Select
                        value={inputs.bia_data_regulatory_exposure || ""}
                        onValueChange={(v) => updateInput("bia_data_regulatory_exposure", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select regulatory risk..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="low">Low (&lt;$100k)</SelectItem>
                          <SelectItem value="moderate">Moderate ($100k-$1M)</SelectItem>
                          <SelectItem value="high">High ($1M-$10M)</SelectItem>
                          <SelectItem value="severe">Severe ($10M+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Advanced Risk Factors (only if advanced mode) */}
              {currentStep === 5 && advancedMode && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Advanced Risk Factors
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Additional factors that influence likelihood of incidents.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300 mb-2">Vendor/Third-Party Control</Label>
                      <Select
                        value={inputs.bia_exposure_vendor_control || ""}
                        onValueChange={(v) => updateInput("bia_exposure_vendor_control", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select vendor risk..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="internal_only">Fully internal</SelectItem>
                          <SelectItem value="trusted_vendor">Trusted vendor</SelectItem>
                          <SelectItem value="multiple_vendors">Multiple vendors</SelectItem>
                          <SelectItem value="high_risk">High-risk vendor</SelectItem>
                          <SelectItem value="unvetted_vendor">Unvetted external control</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2">Legacy/EOL Status</Label>
                      <Select
                        value={inputs.bia_exposure_legacy_status || ""}
                        onValueChange={(v) => updateInput("bia_exposure_legacy_status", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select system age..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="modern">Modern/Supported</SelectItem>
                          <SelectItem value="stable">Stable, minor legacy</SelectItem>
                          <SelectItem value="mixed">Mixed legacy</SelectItem>
                          <SelectItem value="eol_partial">Some EOL components</SelectItem>
                          <SelectItem value="eol_critical">Critical EOL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2">Single Point of Failure</Label>
                      <Select
                        value={inputs.bia_exposure_single_point_of_failure || ""}
                        onValueChange={(v) => updateInput("bia_exposure_single_point_of_failure", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select redundancy..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="full_redundancy">Full redundancy</SelectItem>
                          <SelectItem value="partial_redundancy">Partial redundancy</SelectItem>
                          <SelectItem value="planned_redundancy">Redundancy planned</SelectItem>
                          <SelectItem value="single_point">Single point of failure</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2">External Staff Access</Label>
                      <Select
                        value={inputs.bia_exposure_external_staff_access || ""}
                        onValueChange={(v) => updateInput("bia_exposure_external_staff_access", v)}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select access level..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-gray-700 text-white">
                          <SelectItem value="no_external">No external access</SelectItem>
                          <SelectItem value="monitored">Monitored external access</SelectItem>
                          <SelectItem value="limited">Limited external access</SelectItem>
                          <SelectItem value="extensive">Extensive external access</SelectItem>
                          <SelectItem value="unrestricted">Unrestricted external access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="border-gray-600 text-gray-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!isStepComplete}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {currentStep === totalSteps ? "Complete" : "Next"}
                  {currentStep < totalSteps && <ChevronRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Risk Preview Sidebar */}
        <div className="lg:col-span-1">
          <LiveRiskPreview inputs={inputs} />
        </div>
      </div>
    </div>
  );
}