
import React, { useEffect, useState, useMemo } from "react";
import { User } from "@/entities/User";
import { Assessment } from "@/entities/Assessment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { TrendingUp, Shield, AlertTriangle, FileText, Target, Loader2, Info } from "lucide-react";

export default function BoardRiskDashboard() {
  const [user, setUser] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await User.me();
        setUser(u);
        const list = await Assessment.filter({ company_id: u.company_id, status: "completed" }, "-created_date", 1);
        setAssessment(list && list.length ? list[0] : null);
      } catch (e) {
        console.error("Board dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    if (!assessment) return null;

    // Heuristics from maturity + BIA fields if available
    const m = (k) => Number(assessment[k] || 0);
    const avgSecurity = Math.round(assessment.overall_score || 0);

    // Ransomware likelihood: lower incident_response/data_protection/cloud_security increases likelihood
    const controlAvg = Math.round(((m("maturity_incident_response") + m("maturity_data_protection") + m("maturity_security_training")) / 3) * 20); // 0-100
    const ransomwareLikelihood = Math.max(0, 100 - controlAvg);

    // Regulatory exposure: if framework selected but many domains <3, set high; else moderate
    const weakDomains = [
      m("maturity_governance_risk"),
      m("maturity_third_party_risk"),
      m("maturity_incident_response"),
      m("maturity_data_protection")
    ].filter((v) => v < 3).length;
    const regulatoryExposure = weakDomains >= 2 ? "High" : weakDomains === 1 ? "Medium" : "Low";

    // Business impact (approx): prefer BIA if present
    const impact = assessment.bia_financials ? "Based on BIA data" : "Estimated";
    const estimatedImpactGBP = assessment.bia_financials ? "See BIA report" : (user?.company_size?.includes("Small") ? "£200k–£500k" : user?.company_size?.includes("Medium") ? "£500k–£1.5M" : "£1.5M+");

    return { avgSecurity, ransomwareLikelihood, regulatoryExposure, impact, estimatedImpactGBP };
  }, [assessment, user]);

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading board dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Board Risk Overview</h1>
          <p className="text-gray-300">Executive summary of cyber risk, exposure and potential business impact.</p>
        </div>

        {!assessment ? (
          <Card className="glass-effect border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white">No completed assessment yet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-gray-300">Complete your first assessment to populate the board dashboard.</p>
              <a href={createPageUrl("Assessment")}>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">Start Assessment</Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="rounded-lg border border-cyan-500/20 bg-slate-800/40 p-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-300" />
              <p className="text-sm text-gray-300">
                Displaying insights from your latest completed assessment
                {assessment.company_name ? ` for ${assessment.company_name}` : ""} — completed{" "}
                {new Date(assessment.updated_date || assessment.created_date).toLocaleDateString()}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-effect border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300 flex items-center"><TrendingUp className="w-5 h-5 mr-2" />Overall Security Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{metrics.avgSecurity}%</div>
                  <p className="text-gray-400 mt-2">Across 10 security domains</p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-300 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" />Ransomware Likelihood</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{metrics.ransomwareLikelihood}%</div>
                  <p className="text-gray-400 mt-2">Based on incident response, data protection and training maturity</p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-yellow-300 flex items-center"><Shield className="w-5 h-5 mr-2" />Regulatory Exposure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{metrics.regulatoryExposure}</div>
                  <p className="text-gray-400 mt-2">Focus on governance, third-party risk and incident reporting</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-effect border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center"><FileText className="w-5 h-5 mr-2" />Business Impact</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="text-gray-300">Impact basis: <span className="text-white font-medium">{metrics.impact}</span></p>
                  <p className="text-gray-300">Estimated one-incident loss: <span className="text-white font-medium">{metrics.estimatedImpactGBP}</span></p>
                </div>
                <div className="flex gap-2">
                  <a href={createPageUrl("Reports")}>
                    <Button variant="outline" className="border-gray-600 text-gray-300">View Report</Button>
                  </a>
                  <a href={createPageUrl("ActionItems")}>
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600">View Action Items</Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="text-right">
              <a href={createPageUrl("Assessment")}>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Target className="w-4 h-4 mr-2" /> Improve Score
                </Button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
