import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import {
  Shield, AlertTriangle, TrendingUp, FileCode, Filter, Download, 
  BarChart3, Package, FileText, Search, Eye, ChevronDown, ChevronUp
} from "lucide-react";

const SEVERITY_COLORS = {
  CRITICAL: "#DC2626",
  HIGH: "#EA580C",
  MEDIUM: "#F59E0B",
  LOW: "#3B82F6",
  INFO: "#6B7280"
};

const severityClass = (s) => {
  const v = String(s || "").toUpperCase();
  if (v === "CRITICAL") return "bg-red-600/20 text-red-300 border-red-600/40";
  if (v === "HIGH") return "bg-orange-600/20 text-orange-300 border-orange-600/40";
  if (v === "MEDIUM") return "bg-yellow-600/20 text-yellow-300 border-yellow-600/40";
  if (v === "LOW") return "bg-blue-600/20 text-blue-300 border-blue-600/40";
  return "bg-gray-600/20 text-gray-300 border-gray-600/40";
};

export default function SastDashboard({ findings = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedFinding, setExpandedFinding] = useState(null);

  // Parse and normalize findings
  const normalizedFindings = useMemo(() => {
    return findings.map((f, idx) => ({
      id: f.case_id || f.id || `finding-${idx}`,
      title: f.title || f.category || "Unknown Issue",
      severity: (f.severity || "INFO").toUpperCase(),
      language: f.language || "unknown",
      filepath: f.filepath || f.file || "",
      cwe: f.cwe || "",
      category: f.category || "",
      rule_id: f.expected_rule_id || f.rule_id || "",
      code: f.code || f.code_snippet || "",
      description: f.description || "",
      recommendation: f.recommendation || ""
    }));
  }, [findings]);

  // Compute statistics
  const stats = useMemo(() => {
    const total = normalizedFindings.length;
    const bySeverity = normalizedFindings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {});
    const byLanguage = normalizedFindings.reduce((acc, f) => {
      acc[f.language] = (acc[f.language] || 0) + 1;
      return acc;
    }, {});
    const byCwe = normalizedFindings.reduce((acc, f) => {
      const cwe = f.cwe || "Unknown";
      acc[cwe] = (acc[cwe] || 0) + 1;
      return acc;
    }, {});
    const byCategory = normalizedFindings.reduce((acc, f) => {
      const cat = f.category || "Other";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return { total, bySeverity, byLanguage, byCwe, byCategory };
  }, [normalizedFindings]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return normalizedFindings.filter((f) => {
      const matchesSearch = !searchTerm || 
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.filepath.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cwe.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === "all" || f.severity === severityFilter.toUpperCase();
      const matchesLanguage = languageFilter === "all" || f.language === languageFilter;
      const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
      return matchesSearch && matchesSeverity && matchesLanguage && matchesCategory;
    });
  }, [normalizedFindings, searchTerm, severityFilter, languageFilter, categoryFilter]);

  // Chart data
  const severityChartData = useMemo(() => 
    Object.entries(stats.bySeverity).map(([name, value]) => ({ name, value, color: SEVERITY_COLORS[name] })),
    [stats.bySeverity]
  );

  const languageChartData = useMemo(() => 
    Object.entries(stats.byLanguage).map(([name, value]) => ({ name, value })),
    [stats.byLanguage]
  );

  const topCweData = useMemo(() => 
    Object.entries(stats.byCwe)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value })),
    [stats.byCwe]
  );

  const exportCSV = () => {
    const headers = ["case_id", "language", "filepath", "cwe", "category", "severity", "expected_rule_id", "code"];
    const rows = filteredFindings.map(f => [
      f.id,
      f.language,
      f.filepath,
      f.cwe,
      f.category,
      f.severity,
      f.rule_id,
      `"${(f.code || "").replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sast_findings_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredFindings, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sast_findings_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (findings.length === 0) {
    return (
      <Alert className="border-cyan-500/30 bg-cyan-500/10">
        <Shield className="w-4 h-4 text-cyan-400" />
        <AlertDescription className="text-cyan-100">
          No SAST findings to display. Upload scan results or run an analysis to generate a dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Findings</div>
              </div>
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-300">{stats.bySeverity.CRITICAL || 0}</div>
                <div className="text-sm text-gray-400">Critical</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-300">{stats.bySeverity.HIGH || 0}</div>
                <div className="text-sm text-gray-400">High</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-300">{stats.bySeverity.MEDIUM || 0}</div>
                <div className="text-sm text-gray-400">Medium</div>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Findings by Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-purple-400" />
              Findings by Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={languageChartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top CWEs */}
      <Card className="glass-effect border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-400" />
            Top 10 CWEs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCweData} layout="vertical">
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
              <Bar dataKey="value" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters & Findings List */}
      <Card className="glass-effect border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              Findings List ({filteredFindings.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="border-gray-600 text-gray-300">
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportJSON} className="border-gray-600 text-gray-300">
                <Download className="w-4 h-4 mr-1" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800/50 border-gray-600 text-white pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {Object.keys(stats.byLanguage).map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(stats.byCategory).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Findings */}
          <div className="space-y-3">
            {filteredFindings.map((finding) => (
              <div key={finding.id} className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={severityClass(finding.severity)}>
                        {finding.severity}
                      </Badge>
                      {finding.language && (
                        <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/40">
                          {finding.language}
                        </Badge>
                      )}
                      {finding.cwe && (
                        <Badge className="bg-slate-700/70 text-gray-200">
                          {finding.cwe}
                        </Badge>
                      )}
                      {finding.rule_id && (
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                          {finding.rule_id}
                        </Badge>
                      )}
                    </div>
                    <div className="text-white font-medium mb-1">{finding.title}</div>
                    {finding.filepath && (
                      <div className="text-sm text-gray-400 mb-2">
                        <FileCode className="w-3 h-3 inline mr-1" />
                        {finding.filepath}
                      </div>
                    )}
                    {finding.description && (
                      <div className="text-sm text-gray-300 mt-2">{finding.description}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
                    className="text-gray-400"
                  >
                    {expandedFinding === finding.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {expandedFinding === finding.id && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                    {finding.code && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Code Snippet:</div>
                        <pre className="bg-slate-950/60 text-slate-100 rounded-md p-3 overflow-x-auto text-xs border border-slate-800">
{finding.code}
                        </pre>
                      </div>
                    )}
                    {finding.recommendation && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Recommendation:</div>
                        <div className="text-sm text-emerald-300">{finding.recommendation}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}