import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, MapPin, Server, Bot, Building2, Shield } from "lucide-react";
import { ipInsight } from "@/functions/ipInsight";

function riskColor(score) {
  if (score === null || score === undefined) return "bg-gray-500/20 text-gray-300";
  if (score >= 8) return "bg-red-500/20 text-red-300";
  if (score >= 6) return "bg-orange-500/20 text-orange-300";
  if (score >= 3) return "bg-yellow-500/20 text-yellow-300";
  return "bg-green-500/20 text-green-300";
}

export default function IpInsightWidget({ defaultIp = "" }) {
  const [ip, setIp] = useState(defaultIp);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  const onLookup = async () => {
    if (!ip.trim()) return;
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const { data } = await ipInsight({ ip: ip.trim() });
      setInfo(data);
    } catch (e) {
      setError(e?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-cyan-300 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          IP Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter IP address (e.g., 8.8.8.8)"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="bg-slate-800/50 border-gray-600 text-white"
          />
          <Button onClick={onLookup} disabled={loading || !ip.trim()} className="bg-gradient-to-r from-cyan-500 to-blue-500">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-300">{error}</div>
        )}

        {info && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <MapPin className="w-4 h-4 text-cyan-300" />
                Location
              </div>
              <div className="text-gray-300 text-sm">
                {info.geo?.city_name || "Unknown"}, {info.geo?.country_name || "Unknown"}
              </div>
              {info.geo?.time_zone && (
                <div className="text-gray-500 text-xs mt-1">TZ: {info.geo.time_zone}</div>
              )}
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <Building2 className="w-4 h-4 text-cyan-300" />
                Organization
              </div>
              <div className="text-gray-300 text-sm">{info.isp_name || "Unknown ISP"}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {info.org_types?.is_gov && <Badge className="bg-purple-500/20 text-purple-300">Gov</Badge>}
                {info.org_types?.is_edu && <Badge className="bg-indigo-500/20 text-indigo-300">Edu</Badge>}
                {info.org_types?.is_business && <Badge className="bg-blue-500/20 text-blue-300">Business</Badge>}
                {info.org_types?.is_consumer && <Badge className="bg-teal-500/20 text-teal-300">Consumer</Badge>}
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <Shield className="w-4 h-4 text-cyan-300" />
                Threat Risk
              </div>
              <Badge className={riskColor(info.threat_risk)}>Score: {info.threat_risk ?? "N/A"}</Badge>
              <div className="flex flex-wrap gap-2 mt-2">
                {info.infra_flags?.is_hosting && <Badge className="bg-amber-500/20 text-amber-300"><Server className="w-3 h-3 mr-1" /> Hosting</Badge>}
                {info.infra_flags?.is_proxy && <Badge className="bg-yellow-500/20 text-yellow-300">Proxy</Badge>}
                {info.infra_flags?.is_crawler && <Badge className="bg-pink-500/20 text-pink-300"><Bot className="w-3 h-3 mr-1" /> Crawler</Badge>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}