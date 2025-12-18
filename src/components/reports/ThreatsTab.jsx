import React, { useEffect, useMemo, useState } from "react";
import { ThreatAdvisory } from "@/entities/ThreatAdvisory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Flame, ShieldAlert, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function ThreatsTab({ assessment }) {
  const [advisories, setAdvisories] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await ThreatAdvisory.list("-published_date", 50);
        setAdvisories(list || []);
      } catch (e) {
        console.error("ThreatsTab load error:", e);
      }
    })();
  }, []);

  const correlated = useMemo(() => {
    if (!assessment || !advisories?.length) return [];

    const textFields = [
      "details_identity","details_asset_management","details_infra_security","details_app_security",
      "details_third_party_risk","details_incident_response","details_governance_risk","details_data_protection",
      "details_security_training","details_cloud_security","current_biggest_risks","previous_gap_analysis_details"
    ];
    const haystack = textFields.map((k) => (assessment[k] || "").toLowerCase()).join(" ");
    const industry = (assessment.industry_sector || "").toLowerCase();

    const scoreAdvisory = (adv) => {
      let score = 0;
      (adv.tags || []).forEach((t) => { if (haystack.includes(String(t).toLowerCase())) score += 2; });
      (adv.affected_sectors || []).forEach((s) => { if (industry && industry.includes(String(s).toLowerCase())) score += 1; });
      if ((adv.regions || []).includes("UK") || (adv.regions || []).includes("EU")) score += 1;
      if (adv.severity === "Critical") score += 3;
      if (adv.severity === "High") score += 2;
      return score;
    };

    return advisories
      .map((a) => ({ adv: a, score: scoreAdvisory(a) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [assessment, advisories]);

  if (!assessment) {
    return (
      <Card className="glass-effect border-slate-700/50">
        <CardHeader><CardTitle className="text-white">Threat-linked gaps</CardTitle></CardHeader>
        <CardContent className="text-gray-300">Select an assessment to view correlated EU/UK threats.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-300 flex items-center">
            <Flame className="w-5 h-5 mr-2" />
            Live EU/UK threat context for your gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          {correlated.length === 0 ? (
            <p className="text-gray-300">No strong matches right now. Continue improving controls to reduce exposure.</p>
          ) : (
            <div className="space-y-3">
              {correlated.map(({ adv }, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{adv.title}</h3>
                        <Badge className="bg-slate-700/60 text-gray-300 border-slate-600">{adv.source}</Badge>
                        <Badge className={adv.severity === "Critical" ? "bg-red-500/20 text-red-300" : adv.severity === "High" ? "bg-orange-500/20 text-orange-300" : "bg-yellow-500/20 text-yellow-300"}>
                          {adv.severity}
                        </Badge>
                      </div>
                      <p className="text-gray-300 mt-1">{adv.summary}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(adv.tags || []).map((t, i) => (
                          <Badge key={i} className="bg-slate-700/50 text-gray-300 border-slate-600">#{t}</Badge>
                        ))}
                        {(adv.cves || []).slice(0,3).map((cve, i) => (
                          <Badge key={i} className="bg-slate-800/50 text-cyan-300 border-cyan-500/30">{cve}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right text-gray-400">
                      <div className="inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {adv.published_date ? format(parseISO(adv.published_date), "MMM d, yyyy") : ""}
                      </div>
                      {adv.references?.[0] && (
                        <a href={adv.references[0]} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 mt-2">
                          Source <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <div className="flex items-center text-yellow-300 gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-sm">Tip: Address MFA, patching and vendor risk to reduce exposure to current UK/EU campaigns.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}