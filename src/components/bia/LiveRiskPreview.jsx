import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle } from "lucide-react";

function LiveRiskPreview({ inputs }) {
  // Memoized calculation to prevent unnecessary recalculations
  const preview = useMemo(() => {
    if (!inputs || Object.keys(inputs).length < 3) {
      return {
        ale: 0,
        aleFormatted: "—",
        riskLevel: "Incomplete",
        color: "text-gray-400",
        bgColor: "bg-gray-500/10"
      };
    }

    // Rough estimate based on revenue loss and time to hurt
    const revenueLossMap = {
      '$0–$5k/hr': 2500,
      '$5k–$25k/hr': 15000,
      '$25k–$100k/hr': 62500,
      '$100k–$500k/hr': 300000,
      '$500k+/hr': 750000
    };

    const timeToHurtMultiplier = {
      'immediate': 1.5,
      '1hour': 1.4,
      '4hours': 1.2,
      '1day': 1.0,
      '3days': 0.8,
      '1week': 0.6,
      '1month': 0.4
    };

    const hourlyLoss = revenueLossMap[inputs.bia_impact_revenue_loss_rate] || 10000;
    const timeMultiplier = timeToHurtMultiplier[inputs.bia_impact_time_to_hurt] || 1.0;
    
    // Calculate estimated ALE with stable rounding
    const estimatedALE = Math.round(hourlyLoss * 8760 * 0.05 * timeMultiplier);

    let riskLevel = "Low";
    let color = "text-green-400";
    let bgColor = "bg-green-500/10";

    if (estimatedALE > 1000000) {
      riskLevel = "Critical";
      color = "text-red-400";
      bgColor = "bg-red-500/10";
    } else if (estimatedALE > 500000) {
      riskLevel = "High";
      color = "text-orange-400";
      bgColor = "bg-orange-500/10";
    } else if (estimatedALE > 100000) {
      riskLevel = "Medium";
      color = "text-yellow-400";
      bgColor = "bg-yellow-500/10";
    }

    // Format ALE consistently
    const aleFormatted = estimatedALE > 0 
      ? `$${(estimatedALE / 1000).toFixed(0)}k` 
      : "—";

    return { ale: estimatedALE, aleFormatted, riskLevel, color, bgColor };
  }, [inputs]);

  return (
    <Card className="glass-effect border-cyan-500/20 bg-slate-800/30 sticky top-4">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Live Risk Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg ${preview.bgColor} border border-current/20 transition-colors duration-300`}>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Estimated ALE</div>
            <div className={`text-2xl font-bold ${preview.color} transition-colors duration-300`}>
              {preview.aleFormatted}
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg ${preview.bgColor} border border-current/20 transition-colors duration-300`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${preview.color}`} />
            <span className="text-sm text-gray-300">Risk Level</span>
          </div>
          <span className={`text-sm font-semibold ${preview.color} transition-colors duration-300`}>
            {preview.riskLevel}
          </span>
        </div>

        {preview.riskLevel === "Incomplete" && (
          <div className="text-xs text-gray-500 italic text-center p-2">
            Complete more fields to see risk estimate
          </div>
        )}

        {preview.ale > 0 && (
          <div className="text-xs text-gray-400 space-y-1 p-3 bg-slate-800/50 rounded-lg">
            <p>💡 This is a preliminary estimate based on:</p>
            <ul className="ml-4 space-y-0.5">
              <li>• Revenue loss rate</li>
              <li>• Time to critical impact</li>
              <li>• Operational dependencies</li>
            </ul>
            <p className="mt-2">Full FAIR analysis will provide more precise metrics.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(LiveRiskPreview, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if inputs actually changed
  return JSON.stringify(prevProps.inputs) === JSON.stringify(nextProps.inputs);
});