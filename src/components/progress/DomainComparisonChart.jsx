import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function DomainComparisonChart({ selectedAssessmentId, assessments }) {
  const { chartData, hasComparison, selectedAssessment } = useMemo(() => {
    if (!selectedAssessmentId || assessments.length === 0) {
      return { chartData: [], hasComparison: false, selectedAssessment: null };
    }

    const selectedIndex = assessments.findIndex(a => a.id === selectedAssessmentId);
    if (selectedIndex === -1) {
      return { chartData: [], hasComparison: false, selectedAssessment: null };
    }

    const comparison = assessments[selectedIndex];
    const baseline = assessments[selectedIndex + 1] || null;

    const domains = [
      { key: 'maturity_identity', name: 'Identity' },
      { key: 'maturity_asset_management', name: 'Asset Mgmt' },
      { key: 'maturity_infra_security', name: 'Infra Security' },
      { key: 'maturity_app_security', name: 'App Security' },
      { key: 'maturity_third_party_risk', name: 'Supply Chain' },
      { key: 'maturity_incident_response', name: 'Incident Response' },
      { key: 'maturity_governance_risk', name: 'Governance' }
    ];

    let chartData;
    if (baseline) {
      chartData = domains.map(domain => ({
        name: domain.name,
        Previous: baseline[domain.key] || 0,
        Current: comparison[domain.key] || 0,
      }));
    } else {
      chartData = domains.map(domain => ({
        name: domain.name,
        Current: comparison[domain.key] || 0,
      }));
    }

    return {
      chartData,
      hasComparison: baseline !== null,
      selectedAssessment: comparison
    };
  }, [selectedAssessmentId, assessments]);

  if (!selectedAssessment) {
    return (
      <Card className="glass-effect border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Domain Maturity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No assessment selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          {hasComparison ? 'Domain Maturity Comparison' : 'Domain Maturity Levels'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" domain={[0, 5]} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #10B981',
                  borderRadius: '8px'
                }}
                cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
              />
              {hasComparison && <Legend wrapperStyle={{ fontSize: '14px' }} />}
              {hasComparison && (
                <Bar dataKey="Previous" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              )}
              <Bar dataKey="Current" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}