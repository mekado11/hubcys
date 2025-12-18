
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added this import
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  CartesianGrid // Added this import
} from 'recharts';
import { Shield, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CRITICALITY_COLORS = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#F59E0B',
  Low: '#3B82F6',
};

const getMaturityColor = (score) => {
  if (score >= 5) return 'text-cyan-300';
  if (score >= 4) return 'text-green-300';
  if (score >= 3) return 'text-blue-300';
  if (score >= 2) return 'text-yellow-300';
  return 'text-orange-300';
};

export default function ComplianceDashboard({ frameworks = [], controls = [] }) {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState(frameworks[0]?.id || '');

  const { 
    overallMaturity,
    complianceCoverage,
    categoryMaturity,
    criticalityDistribution,
    topPriorityControls
  } = useMemo(() => {
    const relevantControls = controls.filter(c => c.framework_id === selectedFrameworkId);
    if (relevantControls.length === 0) {
      return { 
        overallMaturity: 0, 
        complianceCoverage: 0,
        categoryMaturity: [],
        criticalityDistribution: [],
        topPriorityControls: []
      };
    }

    // Overall Maturity
    const totalScore = relevantControls.reduce((sum, c) => sum + (c.maturity_score || 0), 0);
    const maturity = (totalScore / (relevantControls.length * 5)) * 100;

    // Compliance Coverage (% of controls implemented)
    const implementedControls = relevantControls.filter(c => (c.maturity_score || 0) >= 3).length;
    const coverage = (implementedControls / relevantControls.length) * 100;

    // Maturity by Category
    const byCategory = relevantControls.reduce((acc, c) => {
      const category = c.control_category || 'General';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += (c.maturity_score || 0);
      acc[category].count++;
      return acc;
    }, {});
    
    const catMaturityData = Object.entries(byCategory).map(([name, { total, count }]) => ({
      name,
      maturity: parseFloat(((total / (count * 5)) * 100).toFixed(1)),
    }));

    // Criticality Distribution
    const byCriticality = relevantControls.reduce((acc, c) => {
      const criticality = c.criticality || 'Medium';
      acc[criticality] = (acc[criticality] || 0) + 1;
      return acc;
    }, {});
    
    const critDistData = Object.entries(byCriticality).map(([name, value]) => ({
      name,
      value,
      color: CRITICALITY_COLORS[name] || '#6B7280'
    }));

    // Top Priority Controls (low score, high criticality)
    const sortedControls = [...relevantControls].sort((a, b) => {
      const scoreA = (a.maturity_score || 0);
      const scoreB = (b.maturity_score || 0);
      const critOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const critA = critOrder[a.criticality] || 0;
      const critB = critOrder[b.criticality] || 0;
      if (critA !== critB) return critB - critA;
      return scoreA - scoreB;
    });

    return {
      overallMaturity: Math.round(maturity),
      complianceCoverage: Math.round(coverage),
      categoryMaturity: catMaturityData,
      criticalityDistribution: critDistData,
      topPriorityControls: sortedControls.slice(0, 5)
    };
  }, [controls, selectedFrameworkId]);

  if (frameworks.length === 0) {
    return null; // Don't render if no frameworks are configured
  }

  return (
    <Card className="glass-effect border-purple-500/20 card-entrance stagger-7">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <CardTitle className="text-purple-300 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Compliance Posture Overview
          </CardTitle>
          <Select value={selectedFrameworkId} onValueChange={setSelectedFrameworkId}>
            <SelectTrigger className="w-full sm:w-64 bg-slate-800/50 border-gray-600 text-white">
              <SelectValue placeholder="Select a framework" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              {frameworks.map(fw => (
                <SelectItem key={fw.id} value={fw.id} className="text-white">
                  {fw.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {selectedFrameworkId && controls.filter(c => c.framework_id === selectedFrameworkId).length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Stats & Charts */}
            <div className="space-y-8">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/30 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-300">{overallMaturity}%</p>
                  <p className="text-sm text-gray-400">Overall Maturity</p>
                </div>
                <div className="p-4 bg-slate-800/30 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-300">{complianceCoverage}%</p>
                  <p className="text-sm text-gray-400">Controls Implemented</p>
                </div>
              </div>

              {/* Maturity by Category */}
              <div>
                <h4 className="font-semibold text-white mb-2">Maturity by Category</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryMaturity} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
                      <YAxis type="category" dataKey="name" width={100} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #7C3AED' }} />
                      <Bar dataKey="maturity" fill="#7C3AED" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: Charts & Priority List */}
            <div className="space-y-8">
              {/* Criticality Distribution */}
              <div>
                <h4 className="font-semibold text-white mb-2">Controls by Criticality</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={criticalityDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                        {criticalityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #7C3AED' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Priority Controls */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-white">Top Priority Controls</h4>
                  <Link to={createPageUrl(`ComplianceControls?framework=${selectedFrameworkId}`)}>
                    <Button variant="link" size="sm" className="text-cyan-400">View All</Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {topPriorityControls.map(control => (
                    <div key={control.id} className="p-3 bg-slate-800/50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white text-sm">{control.control_id}</p>
                        <p className="text-xs text-gray-400 truncate">{control.control_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="border" style={{ borderColor: CRITICALITY_COLORS[control.criticality], color: CRITICALITY_COLORS[control.criticality], backgroundColor: `${CRITICALITY_COLORS[control.criticality]}20` }}>
                          {control.criticality}
                        </Badge>
                        <span className={`font-bold text-lg ${getMaturityColor(control.maturity_score || 0)}`}>
                          {control.maturity_score || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ListTodo className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl text-white font-semibold">No controls found for this framework.</h3>
            <p className="mt-2">Select a different framework or add controls to get started.</p>
            <Link to={createPageUrl(`ComplianceControls?framework=${selectedFrameworkId}`)}>
              <Button className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-500">
                Manage Controls
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
