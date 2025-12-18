import React from 'react';
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function MaturityRadarChart({ data }) {
  const categories = [
    { key: 'maturity_identity', naKey: 'maturity_identity_na', name: 'Identity', fullName: 'Identity & Access Management' },
    { key: 'maturity_asset_management', naKey: 'maturity_asset_management_na', name: 'Assets', fullName: 'Asset Management' },
    { key: 'maturity_infra_security', naKey: 'maturity_infra_security_na', name: 'Infrastructure', fullName: 'Infrastructure Security' },
    { key: 'maturity_app_security', naKey: 'maturity_app_security_na', name: 'Applications', fullName: 'Application Security' },
    { key: 'maturity_third_party_risk', naKey: 'maturity_third_party_risk_na', name: 'Third-Party', fullName: 'Third-Party Risk' },
    { key: 'maturity_incident_response', naKey: 'maturity_incident_response_na', name: 'Incident Response', fullName: 'Incident Response' },
    { key: 'maturity_governance_risk', naKey: 'maturity_governance_risk_na', name: 'Governance', fullName: 'Governance & Risk' },
    { key: 'maturity_data_protection', naKey: 'maturity_data_protection_na', name: 'Data Protection', fullName: 'Data Protection' },
    { key: 'maturity_security_training', naKey: 'maturity_security_training_na', name: 'Training', fullName: 'Security Training' },
    { key: 'maturity_cloud_security', naKey: 'maturity_cloud_security_na', name: 'Cloud', fullName: 'Cloud Security' }
  ];

  // Filter out categories marked as Not Applicable
  const applicableCategories = categories.filter(category => {
    return !data[category.naKey]; // Only include if not marked as N/A
  });

  // Create chart data only from applicable categories
  const chartData = applicableCategories.map(category => ({
    subject: category.name,
    score: data[category.key] || 0,
    fullName: category.fullName
  }));

  // If no applicable categories, show a message
  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-sm">No applicable domains to display</p>
          <p className="text-xs mt-1">All domains marked as N/A</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            className="text-xs"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fontSize: 10, fill: '#6B7280' }}
            tickCount={6}
          />
          <Radar
            name="Maturity Score"
            dataKey="score"
            stroke="#06B6D4"
            fill="#06B6D4"
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
      
      {/* Legend showing applicable vs total categories */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          Showing {chartData.length} applicable domain{chartData.length !== 1 ? 's' : ''} 
          {applicableCategories.length < categories.length && 
            ` (${categories.length - applicableCategories.length} marked N/A)`
          }
        </p>
      </div>
    </div>
  );
}