import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function BIAMethodologyGuide() {
  return (
    <div className="space-y-6 text-gray-300">
      <Card className="glass-effect border-cyan-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-cyan-300 mb-4">FAIR Methodology Overview</h3>
          <p className="mb-4">
            The Factor Analysis of Information Risk (FAIR) model is the industry standard for quantifying cybersecurity risk in financial terms. 
            FortiGAP's BIA engine implements FAIR to provide accurate, data-driven risk analysis.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-purple-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-purple-300 mb-4">Core FAIR Components</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">1. Loss Event Frequency (LEF)</h4>
              <p className="text-sm">
                How often a loss event is expected to occur per year. Calculated based on:
              </p>
              <ul className="list-disc list-inside text-sm ml-4 mt-2 space-y-1">
                <li>Control effectiveness from your assessment</li>
                <li>External threat exposure score</li>
                <li>System-specific risk factors (legacy status, vendor control, etc.)</li>
                <li>Industry breach frequency benchmarks</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">2. Single Loss Expectancy (SLE)</h4>
              <p className="text-sm">
                The expected financial impact of a single loss event. Includes:
              </p>
              <ul className="list-disc list-inside text-sm ml-4 mt-2 space-y-1">
                <li>Revenue loss from downtime</li>
                <li>Data breach costs (per-record costs × records affected)</li>
                <li>Regulatory fines and penalties</li>
                <li>Incident response and recovery costs</li>
                <li>Reputational damage multiplier</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">3. Annualized Loss Expectancy (ALE)</h4>
              <p className="text-sm">
                The total expected loss per year, calculated as: <strong className="text-cyan-300">ALE = LEF × SLE</strong>
              </p>
              <p className="text-sm mt-2">
                This metric provides a clear financial figure for prioritizing cybersecurity investments and justifying budgets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-orange-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-orange-300 mb-4">Real-World Breach Intelligence</h3>
          <p className="mb-3">
            FortiGAP enhances FAIR calculations with real-world breach case studies from major incidents including:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mb-3">
            <li>Target (2013) - 40M cards, $162M settlement</li>
            <li>Equifax (2017) - 147M records, $700M settlement</li>
            <li>Colonial Pipeline (2021) - $4.4M ransom, 6-day shutdown</li>
            <li>Change Healthcare (2024) - Healthcare disruption, ongoing impact</li>
            <li>SolarWinds (2020) - Supply chain compromise</li>
            <li>MGM Resorts (2023) - $100M ransomware impact</li>
          </ul>
          <p className="text-sm">
            These cases are automatically matched to your assets based on industry sector, attack type, and system characteristics 
            to provide realistic impact estimates.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-green-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-green-300 mb-4">RTO/RPO Recommendations</h3>
          <p className="mb-3">
            Recovery Time Objective (RTO) and Recovery Point Objective (RPO) are automatically calculated based on:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong>Impact Severity:</strong> Higher impact = tighter recovery targets</li>
            <li><strong>Time to Hurt:</strong> Systems critical within hours need aggressive RTOs</li>
            <li><strong>Operational Dependency:</strong> Higher dependency = lower tolerance for data loss</li>
            <li><strong>Data Classification:</strong> Regulated data requires stricter RPOs</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="glass-effect border-blue-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-blue-300 mb-4">Why This Matters</h3>
          <p className="mb-3">
            Traditional BIA approaches rely on subjective ratings (High/Medium/Low). FAIR-based BIA provides:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong>Quantified Risk:</strong> Dollar amounts executives and boards understand</li>
            <li><strong>Prioritization:</strong> Clear ROI for security investments</li>
            <li><strong>Comparability:</strong> Benchmark against industry standards</li>
            <li><strong>Justification:</strong> Data-backed arguments for compliance and insurance</li>
            <li><strong>Scenario Planning:</strong> Model different attack scenarios and mitigation strategies</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}