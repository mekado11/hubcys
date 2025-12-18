import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, AlertTriangle, Target } from "lucide-react";

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
  const n = Math.abs(amount);
  if (n >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toFixed(0)}`;
};

export default function FAIRMetricsDisplay({ fairMetrics }) {
  if (!fairMetrics) return null;

  const getRiskColor = (count, type) => {
    if (type === 'critical' && count > 0) return 'text-red-400';
    if (type === 'high' && count > 0) return 'text-orange-400';
    if (type === 'medium' && count > 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="glass-effect border-cyan-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total ALE</span>
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(fairMetrics.total_ale || 0)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Annualized Loss Expectancy</p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Avg LEF</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(fairMetrics.avg_lef || 0).toFixed(2)}x
          </div>
          <p className="text-xs text-gray-400 mt-1">Loss Event Frequency / Year</p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-orange-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Highest SLE</span>
            <Target className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-lg font-bold text-white truncate">
            {fairMetrics.highest_sle_scenario || 'None'}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {formatCurrency(fairMetrics.highest_sle_value || 0)}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Risk Distribution</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge className={`${getRiskColor(fairMetrics.risk_distribution?.critical, 'critical')} bg-red-500/20 border-red-500/30`}>
              {fairMetrics.risk_distribution?.critical || 0} Critical
            </Badge>
            <Badge className={`${getRiskColor(fairMetrics.risk_distribution?.high, 'high')} bg-orange-500/20 border-orange-500/30`}>
              {fairMetrics.risk_distribution?.high || 0} High
            </Badge>
            <Badge className={`${getRiskColor(fairMetrics.risk_distribution?.medium, 'medium')} bg-yellow-500/20 border-yellow-500/30`}>
              {fairMetrics.risk_distribution?.medium || 0} Medium
            </Badge>
            <Badge className={`${getRiskColor(fairMetrics.risk_distribution?.low, 'low')} bg-green-500/20 border-green-500/30`}>
              {fairMetrics.risk_distribution?.low || 0} Low
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}