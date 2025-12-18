import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ChevronDown, ChevronUp, Building2, Cpu } from "lucide-react";

export default function BIACard({ item, index, onEdit, onDelete, onExpand, isExpanded }) {
  const inputs = item?.inputs || {};
  
  // Calculate a simple risk level based on inputs
  const getRiskLevel = () => {
    if (!inputs.bia_impact_time_to_hurt || !inputs.bia_impact_revenue_loss_rate) {
      return { label: "Incomplete", color: "bg-gray-500/20 text-gray-300" };
    }
    
    const urgency = inputs.bia_impact_time_to_hurt === "immediate" || inputs.bia_impact_time_to_hurt === "1hour";
    const highRevenue = inputs.bia_impact_revenue_loss_rate?.includes("$100k") || inputs.bia_impact_revenue_loss_rate?.includes("$500k");
    
    if (urgency && highRevenue) {
      return { label: "Critical", color: "bg-red-500/20 text-red-300" };
    } else if (urgency || highRevenue) {
      return { label: "High", color: "bg-orange-500/20 text-orange-300" };
    } else {
      return { label: "Medium", color: "bg-yellow-500/20 text-yellow-300" };
    }
  };

  const riskLevel = getRiskLevel();

  const categoryDisplay = inputs.bia_process_category?.replace(/_/g, ' ') || "Not specified";
  const typeDisplay = inputs.bia_process_type || "Not specified";

  return (
    <Card className="glass-effect border-slate-700 hover:border-cyan-500/30 transition-all">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-300 font-bold text-sm">{index + 1}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">{inputs.bia_process_name || `Critical Function ${index + 1}`}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Building2 className="w-3 h-3" />
                  <span>{categoryDisplay}</span>
                </div>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Cpu className="w-3 h-3" />
                  <span>{typeDisplay}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={riskLevel.color}>
              {riskLevel.label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
              className="text-gray-400 hover:text-cyan-300"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(index)}
              className="text-gray-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onExpand(index)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-4 pt-0 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {inputs.bia_impact_time_to_hurt && (
              <div>
                <span className="text-gray-400">Time to Impact:</span>
                <span className="text-white ml-2">{inputs.bia_impact_time_to_hurt}</span>
              </div>
            )}
            {inputs.bia_impact_revenue_loss_rate && (
              <div>
                <span className="text-gray-400">Revenue Loss:</span>
                <span className="text-white ml-2">{inputs.bia_impact_revenue_loss_rate}</span>
              </div>
            )}
            {inputs.bia_impact_contract_exposure && (
              <div>
                <span className="text-gray-400">Contract Risk:</span>
                <span className="text-white ml-2">{inputs.bia_impact_contract_exposure}</span>
              </div>
            )}
            {inputs.bia_data_classification && (
              <div>
                <span className="text-gray-400">Data Type:</span>
                <span className="text-white ml-2">{inputs.bia_data_classification}</span>
              </div>
            )}
            {inputs.bia_impact_ops_dependency_share && (
              <div>
                <span className="text-gray-400">Ops Dependency:</span>
                <span className="text-white ml-2">{inputs.bia_impact_ops_dependency_share}</span>
              </div>
            )}
            {inputs.bia_data_regulatory_exposure && (
              <div>
                <span className="text-gray-400">Regulatory Risk:</span>
                <span className="text-white ml-2">{inputs.bia_data_regulatory_exposure}</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}