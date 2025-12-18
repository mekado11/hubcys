
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TooltipInfo from "@/components/ui/TooltipInfo";

export default function BIAQuestionBank({ currentStep, data, onUpdate }) {
  // helper to normalize any pasted/en-dash values back to hyphen
  const dashify = (s) => (typeof s === "string" ? s.replace(/\u2013|\u2014/g, "-") : s);

  const Step1 = () => (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-cyan-300">Business Impact</CardTitle>
        <p className="text-gray-400 text-sm">Plain language bands for time, money, and dependency.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-gray-300 flex items-center">
            When does this hurt the business if it's down?
            <TooltipInfo
              text={`Pick the earliest point where real business damage starts (not just a warning).
This maps to recovery targets:
• Immediate (≤1h) → RTO ≈ 1h, RPO ≈ 30m
• 1–4h → RTO ≈ 4h, RPO ≈ 2h
• 4–24h → RTO ≈ 24h, RPO ≈ 8h
• 1–3d → RTO ≈ 72h, RPO ≈ 24h
Use the strictest tier that would trigger lost sales, missed SLAs, or reputational impact.`}
            />
          </Label>
          <Select value={data.bia_impact_time_to_hurt || ""} onValueChange={(v) => onUpdate("bia_impact_time_to_hurt", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select window..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="Immediate (<1h)">Immediate (≤1h)</SelectItem>
              <SelectItem value="1-4h">1–4h</SelectItem>
              <SelectItem value="4-24h">4–24h</SelectItem>
              <SelectItem value="1-3d">1–3d</SelectItem>
              <SelectItem value=">3d">&gt;3d</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 flex items-center">
            Revenue loss rate
            <TooltipInfo
              text={`Approximate $ lost per hour if this is down.
Quick ways to estimate:
• If tied to sales: revenue per hour × dependency share
• If internal ops: labor cost/hr of affected teams × productivity loss
Bands:
• None/Unknown
• <$10k/hr
• $10–$50k/hr
• $50–$250k/hr
• $250k–$1M/hr
• >$1M/hr`}
            />
          </Label>
          <Select value={data.bia_impact_revenue_loss_rate || ""} onValueChange={(v) => onUpdate("bia_impact_revenue_loss_rate", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select band..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="None/Unknown">None/Unknown</SelectItem>
              <SelectItem value="<$10k/hr">&lt;$10k/hr</SelectItem>
              <SelectItem value="$10-$50k/hr">$10–$50k/hr</SelectItem>
              <SelectItem value="$50-$250k/hr">$50–$250k/hr</SelectItem>
              <SelectItem value="$250k-$1M/hr">$250k–$1M/hr</SelectItem>
              <SelectItem value=">$1M/hr">&gt;$1M/hr</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 flex items-center">
            Contract/SLA exposure if down?
            <TooltipInfo
              text={`What contractual or regulatory consequences apply?
• None: internal-only inconvenience
• Minor credits possible: informal commitments/KPIs
• Customer credits: standard credit table applies
• Formal SLA penalties: explicit penalties per outage
• Regulator/market disclosure: legal/regulatory reporting risk`}
            />
          </Label>
          <Select value={data.bia_impact_contract_exposure || ""} onValueChange={(v) => onUpdate("bia_impact_contract_exposure", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select exposure..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Minor internal KPIs">Minor internal KPIs</SelectItem>
              <SelectItem value="Customer credits">Customer credits</SelectItem>
              <SelectItem value="Formal SLA penalties">Formal SLA penalties</SelectItem>
              <SelectItem value="Regulator/market disclosure">Regulator/market disclosure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 flex items-center">
            Share of operations that depends on this system?
            <TooltipInfo
              text={`How much of total output relies on this process/system?
This drives dependency weighting for Asset Value (AV).
Guidance:
• 0–20%: niche or low-volume dependency
• 21–40%: important, but parallel alternatives exist
• 41–60%: major gate for many workflows
• 61–80%: near-universal dependency
• 81–100%: hard single point of failure`}
            />
          </Label>
          <Select
            value={dashify(data.bia_impact_ops_dependency_share || "")}
            onValueChange={(v) => onUpdate("bia_impact_ops_dependency_share", dashify(v))}
          >
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select range..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              {/* Use hyphen in values; show en-dash in labels */}
              <SelectItem value="0-20%">0–20%</SelectItem>
              <SelectItem value="21-40%">21–40%</SelectItem>
              <SelectItem value="41-60%">41–60%</SelectItem>
              <SelectItem value="61-80%">61–80%</SelectItem>
              <SelectItem value="81-100%">81–100%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const Step2 = () => (
    <Card className="glass-effect border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-purple-300">Data & Compliance</CardTitle>
        <p className="text-gray-400 text-sm">Sensitivity and disclosure duties.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-gray-300 flex items-center">
            Data classification handled
            <TooltipInfo
              text={`Categorize the most sensitive data classification handled by this system or process.
This determines the impact of a data breach.
• Public: Data freely available to anyone.
• Internal: Data for internal use only, not public.
• Confidential: Data requiring restricted access, breach could harm the organization.
• Sensitive IP: Trade secrets, core algorithms, unpatented inventions.
• Regulated (PII/PHI/Financial): Data protected by laws like GDPR, HIPAA, PCI DSS.`}
            />
          </Label>
          <Select value={data.bia_data_classification || ""} onValueChange={(v) => onUpdate("bia_data_classification", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select class..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="Public">Public</SelectItem>
              <SelectItem value="Internal">Internal</SelectItem>
              <SelectItem value="Confidential">Confidential</SelectItem>
              <SelectItem value="Sensitive IP">Sensitive IP</SelectItem>
              <SelectItem value="Regulated (PII/PHI/Financial)">Regulated (PII/PHI/Financial)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 flex items-center">
            Would an incident require public or customer notice?
            <TooltipInfo
              text={`Immediate or material disclosure obligations significantly raise impact.
Consider legal, regulatory, and contractual requirements for notifying affected parties.
• No: No notification required beyond internal teams.
• Only if >24h or material: Notification depends on duration or severity of impact.
• Yes (immediate): Notification required regardless of duration or severity, often legally mandated.`}
            />
          </Label>
          <Select value={data.bia_data_public_notice_required || ""} onValueChange={(v) => onUpdate("bia_data_public_notice_required", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select option..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Only if >24h or material">Only if &gt;24h or material</SelectItem>
              <SelectItem value="Yes (immediate)">Yes (immediate)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 flex items-center">
            Regulatory exposure
            <TooltipInfo
              text={`The scope of oversight affecting this process/system. This determines the legal and compliance penalties for incidents.
• None: No specific external regulatory requirements.
• Contractual only: Obligations arise from contracts (e.g., with customers or partners).
• National regulator: Subject to specific national laws/bodies (e.g., local financial regulators).
• Multi-jurisdiction (GDPR/SEC/SOX/DORA/NIS2): Subject to international or multiple national regulations, implying broader compliance and higher penalties.`}
            />
          </Label>
          <Select value={data.bia_data_regulatory_exposure || ""} onValueChange={(v) => onUpdate("bia_data_regulatory_exposure", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select scope..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Contractual only">Contractual only</SelectItem>
              <SelectItem value="National regulator">National regulator</SelectItem>
              <SelectItem value="Multi-jurisdiction (GDPR/SEC/SOX/DORA/NIS2)">Multi‑jurisdiction (GDPR/SEC/SOX/DORA/NIS2)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const Step3 = () => (
    <Card className="glass-effect border-green-500/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-green-300">Exposure (Likelihood)</CardTitle>
        <p className="text-gray-400 text-sm">Tech/ops drivers for incident likelihood.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-gray-300 flex items-center">
            Vendor/foreign control of core components
            <TooltipInfo
              text={`External control over critical components introduces external dependencies and potential single points of failure, increasing likelihood of incidents.
• None: All core components are internally developed and controlled.
• Some third-party: Utilizes some external services or components, but core is internal.
• Full external control: Core functionality relies entirely on external vendors or foreign entities, increasing supply chain risk.`}
            />
          </Label>
          <Select value={data.bia_exposure_vendor_control || ""} onValueChange={(v) => onUpdate("bia_exposure_vendor_control", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select level..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Some third-party">Some third-party</SelectItem>
              <SelectItem value="Full external control">Full external control</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 flex items-center">
            Legacy/unpatched status
            <TooltipInfo
              text={`Mixed legacy or End-of-Life (EOL) core systems typically have unpatched vulnerabilities, higher failure rates, and limited support, significantly raising incident likelihood.
• Supported & patched: Systems are current, actively maintained, and receive security updates.
• Mixed legacy: Combination of modern and older systems, some of which may be out of vendor support.
• EOL core system: Critical systems that have reached end-of-life, are unsupported, and pose significant security and operational risks.`}
            />
          </Label>
          <Select value={data.bia_exposure_legacy_status || ""} onValueChange={(v) => onUpdate("bia_exposure_legacy_status", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select status..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="Supported & patched">Supported & patched</SelectItem>
              <SelectItem value="Mixed legacy">Mixed legacy</SelectItem>
              <SelectItem value="EOL core system">EOL core system</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 flex items-center">
            Single point of failure (no failover)
            <TooltipInfo
              text={`The absence of redundancy or unknown failover capabilities means a single component failure will lead to a system outage, dramatically increasing the likelihood of business impact.
• No: System has robust redundancy and failover mechanisms.
• Unknown: Redundancy status is not documented or tested.
• Yes: A single component failure will cause a complete system outage, without automatic recovery.`}
            />
          </Label>
          <Select value={data.bia_exposure_single_point_of_failure || ""} onValueChange={(v) => onUpdate("bia_exposure_single_point_of_failure", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select option..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
              <SelectItem value="Yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 flex items-center">
            Embedded external staff with elevated access
            <TooltipInfo
              text={`Privileged non-employees without strong oversight represent a higher risk of accidental or malicious actions due to less direct control and potential for insider threats.
• None: All staff with elevated access are full-time employees under direct control.
• Few with oversight: Limited external personnel with elevated access, subject to strict monitoring and controls.
• Many/critical without oversight: Numerous external personnel, especially in critical roles, operating with elevated access and insufficient supervision.`}
            />
          </Label>
          <Select value={data.bia_exposure_external_staff_access || ""} onValueChange={(v) => onUpdate("bia_exposure_external_staff_access", v)}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-2"><SelectValue placeholder="Select level..." /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Few with oversight">Few with oversight</SelectItem>
              <SelectItem value="Many/critical without oversight">Many/critical without oversight</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      {currentStep === 1 && <Step1 />}
      {currentStep === 2 && <Step2 />}
      {currentStep === 3 && <Step3 />}
    </div>
  );
}
