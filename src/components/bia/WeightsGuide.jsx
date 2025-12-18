import React from "react";
import { HelpCircle, Info } from "lucide-react";

const Row = ({ title, what, how }) => (
  <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
    <div className="flex items-start gap-2">
      <HelpCircle className="h-4 w-4 text-cyan-300 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        {what && <p className="text-xs text-gray-300 mt-1"><span className="font-semibold text-gray-200">What it represents: </span>{what}</p>}
        {how && <p className="text-xs text-cyan-300 mt-1"><span className="font-semibold text-cyan-200">How to set it: </span>{how}</p>}
      </div>
    </div>
  </div>
);

export default function WeightsGuide() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
          <Info className="h-4 w-4 text-cyan-300" />
        </div>
        <div>
          <p className="text-sm text-white font-semibold">How Domain Weights affect your BIA</p>
          <p className="text-xs text-gray-300 mt-1">
            Weights are importance multipliers for each impact area. Your overall impact score is a weighted sum of the domain scores. 
            Ideally the total equals 1.0 (100%). Increase a weight to emphasize that domain; decrease it if it’s less important.
          </p>
        </div>
      </div>

      <Row
        title="Criticality"
        what="How quickly material damage starts after a disruption to your critical process/system."
        how="Higher weight if short outages already hurt (e.g., real‑time trading, continuous manufacturing)."
      />
      <Row
        title="Financial"
        what="Direct monetary loss (lost revenue, penalties, extra incident costs)."
        how="Higher weight for high transaction volume, tight SLAs, or steep penalties."
      />
      <Row
        title="Regulatory/Legal"
        what="Exposure to fines, legal action, or license/certification issues."
        how="Higher weight for heavily regulated industries (e.g., HIPAA, SOX, GDPR)."
      />
      <Row
        title="Operational"
        what="Productivity impact and ability to deliver products/services."
        how="Higher weight for complex, interdependent operations (manufacturing, logistics, utilities)."
      />
      <Row
        title="Customer/Market"
        what="Reputation, customer churn, brand damage, and competitive position."
        how="Higher weight where trust and public perception drive revenue."
      />
      <Row
        title="Data"
        what="Sensitivity and volume of data at risk; the cost/record of disclosure or loss."
        how="Higher weight for PII/PHI/IP or data‑centric businesses."
      />
      <Row
        title="Technology Dependency"
        what="Reliance on specific vendors, legacy/EOL systems, or externally controlled components."
        how="Higher weight with vendor lock‑in, opaque foreign control, or hard‑to‑patch legacy tech."
      />
      <Row
        title="People/Insider"
        what="Human‑factor risk (privileged insiders, human error, external contractors)."
        how="Higher weight with many elevated users or sensitive roles."
      />
      <Row
        title="Facilities/Geo"
        what="Physical site dependence, disaster exposure, single points of physical failure."
        how="Higher weight if operations hinge on a single site or risky geography."
      />
      <Row
        title="Security Posture"
        what="Overall control maturity (MFA, segmentation, DLP, logging) that influences likelihood."
        how="Higher weight if you want posture gaps to strongly influence the overall result."
      />

      <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 p-2 text-xs text-yellow-200">
        Tip: If your total is not 1.0, adjust a couple of weights up or down by small increments until the “Current total” reads 1.0.
      </div>
    </div>
  );
}