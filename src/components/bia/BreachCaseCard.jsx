import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, DollarSign, Clock } from "lucide-react";

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
  const n = Math.abs(amount);
  if (n >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toFixed(0)}`;
};

export default function BreachCaseCard({ breach }) {
  if (!breach) return null;

  const attackTypeColors = {
    Ransomware: "bg-red-500/20 text-red-300",
    Data_Breach: "bg-orange-500/20 text-orange-300",
    Phishing: "bg-yellow-500/20 text-yellow-300",
    Supply_Chain: "bg-purple-500/20 text-purple-300",
    default: "bg-gray-500/20 text-gray-300"
  };

  const colorClass = attackTypeColors[breach.attack_type] || attackTypeColors.default;

  return (
    <Card className="glass-effect border-slate-700 hover:border-purple-500/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-white font-semibold">{breach.company_name}</h4>
            {breach.industry_sector && (
              <p className="text-xs text-gray-400">{breach.industry_sector.replace(/_/g, ' ')}</p>
            )}
          </div>
          <Badge className={colorClass}>
            {breach.attack_type?.replace(/_/g, ' ') || 'Breach'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          {breach.breach_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300">{new Date(breach.breach_date).getFullYear()}</span>
            </div>
          )}
          {breach.estimated_financial_impact && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300">{formatCurrency(breach.estimated_financial_impact)}</span>
            </div>
          )}
          {breach.downtime_hours && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300">{breach.downtime_hours}h downtime</span>
            </div>
          )}
          {breach.records_compromised && (
            <div className="text-gray-300">
              {(breach.records_compromised / 1_000_000).toFixed(1)}M records
            </div>
          )}
        </div>

        {breach.primary_cause && (
          <div className="bg-slate-800/50 rounded p-2 mb-3">
            <p className="text-xs text-gray-400 mb-1">Root Cause:</p>
            <p className="text-xs text-gray-200">{breach.primary_cause}</p>
          </div>
        )}

        {breach.summary && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{breach.summary}</p>
        )}

        {breach.reference_url && (
          <a
            href={breach.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Learn more</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}