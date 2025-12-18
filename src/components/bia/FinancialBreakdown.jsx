import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancialBreakdown({ inputs = {}, financials = {} }) {
  const row = (label, value) => (
    <div className="flex justify-between text-sm py-1 border-b border-slate-700/40 last:border-0">
      <div className="text-gray-400">{label}</div>
      <div className="text-white font-medium">{value}</div>
    </div>
  );

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Financial Breakdown</CardTitle>
        <p className="text-gray-400">Downtime loss, SLE/ALE, penalties, and total expected loss.</p>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-gray-300 mb-2">Inputs</div>
          {row('Revenue loss/hour', `$${Number(inputs.fin_revenue_loss_per_hour||0).toLocaleString()}`)}
          {row('Expected downtime (h)', Number(inputs.fin_expected_downtime_hours||0))}
          {row('Ops extra cost/day', `$${Number(inputs.fin_extra_ops_cost_per_day||0).toLocaleString()}`)}
          {row('SLA penalties/day', `$${Number(inputs.fin_sla_penalties_per_day||0).toLocaleString()}`)}
          {row('Records at risk', Number(inputs.data_records_count||0).toLocaleString())}
          {row('Cost per record', `$${Number(inputs.data_cost_per_record||0).toLocaleString()}`)}
          {row('ARO downtime (yr)', Number(inputs.aro_downtime||0))}
          {row('ARO breach (yr)', Number(inputs.aro_breach||0))}
          {row('Regulatory fines', `$${Number(inputs.regulatory_fines_estimate||0).toLocaleString()}`)}
        </div>
        <div>
          <div className="text-gray-300 mb-2">Computed</div>
          {row('Downtime Loss/incident', `$${Number(financials.downtimeLoss||0).toLocaleString()}`)}
          {row('SLE (Data breach)', `$${Number(financials.sleData||0).toLocaleString()}`)}
          {row('ALE (Downtime)', `$${Number(financials.aleDowntime||0).toLocaleString()}`)}
          {row('ALE (Data)', `$${Number(financials.aleData||0).toLocaleString()}`)}
          {row('Regulatory Fines', `$${Number(financials.regulatoryFines||0).toLocaleString()}`)}
          {row('Total Expected Loss', `$${Number(financials.totalExpectedLoss||0).toLocaleString()}`)}
        </div>
      </CardContent>
    </Card>
  );
}