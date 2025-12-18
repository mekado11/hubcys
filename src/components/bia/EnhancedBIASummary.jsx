import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, Clock, TrendingUp, Shield, Building2, Cpu } from "lucide-react";
import BreachCaseCard from "./BreachCaseCard";

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
  const n = Math.abs(amount);
  if (n >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toFixed(0)}`;
};

export default function EnhancedBIASummary({ item }) {
  const result = item?.result;
  const inputs = item?.inputs || {};
  
  if (!result) {
    return (
      <Card className="glass-effect border-slate-700">
        <CardContent className="p-6 text-center text-gray-400">
          No results available for this item yet. Complete the wizard to generate FAIR analysis.
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (score) => {
    if (score >= 20) return "text-red-400";
    if (score >= 15) return "text-orange-400";
    if (score >= 10) return "text-yellow-400";
    return "text-green-400";
  };

  const categoryDisplay = inputs.bia_process_category?.replace(/_/g, ' ') || "Not specified";
  const typeDisplay = inputs.bia_process_type || "Not specified";

  return (
    <div className="space-y-4">
      <Card className="glass-effect border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-cyan-300 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {inputs.bia_process_name || "Critical Function"} - FAIR Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Building2 className="w-3 h-3 mr-1" />
                {categoryDisplay}
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Cpu className="w-3 h-3 mr-1" />
                {typeDisplay}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">Risk Score</span>
              </div>
              <p className={`text-2xl font-bold ${getRiskColor(result.riskScore)}`}>
                {result.riskScore?.toFixed(1) || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">out of 25</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">ALE</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(result.ale || result.annualizedLoss || 0)}
              </p>
              <p className="text-xs text-gray-500">Annual Loss Expectancy</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">RTO</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {result.rtoHours || 'N/A'}<span className="text-sm text-gray-400">h</span>
              </p>
              <p className="text-xs text-gray-500">Recovery Time Objective</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">LEF</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {result.lef?.toFixed(2) || 'N/A'}<span className="text-sm text-gray-400">x/yr</span>
              </p>
              <p className="text-xs text-gray-500">Loss Event Frequency</p>
            </div>
          </div>

          {/* Top Risk Drivers */}
          {result.topDrivers && result.topDrivers.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3">Top Risk Drivers</h4>
              <div className="space-y-2">
                {result.topDrivers.slice(0, 3).map((driver, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-800/30 rounded p-2">
                    <Badge className="bg-orange-500/20 text-orange-300 mt-0.5">
                      #{idx + 1}
                    </Badge>
                    <p className="text-sm text-gray-300">{driver}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relevant Breach Cases */}
          {result.relevantBreachCases && result.relevantBreachCases.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3">Similar Real-World Breaches</h4>
              <div className="space-y-3">
                {result.relevantBreachCases.slice(0, 2).map((breach, idx) => (
                  <BreachCaseCard key={idx} breach={breach} />
                ))}
              </div>
            </div>
          )}

          {/* Financial Breakdown */}
          {result.sle && (
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Financial Impact Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Single Loss Expectancy (SLE):</span>
                  <span className="text-white ml-2 font-semibold">{formatCurrency(result.sle)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Loss Event Frequency (LEF):</span>
                  <span className="text-white ml-2 font-semibold">{result.lef?.toFixed(2)}x per year</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-600">
                  <span className="text-gray-400">Annualized Loss Expectancy (ALE):</span>
                  <span className="text-cyan-300 ml-2 font-bold text-lg">{formatCurrency(result.ale || result.annualizedLoss)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}