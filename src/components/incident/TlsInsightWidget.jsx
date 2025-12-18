import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Fingerprint } from "lucide-react";
import { tlsInsight } from "@/functions/tlsInsight";

function ExpiryBadge({ days }) {
  if (days === null || days === undefined) return <Badge className="bg-gray-500/20 text-gray-300">Unknown</Badge>;
  if (days < 0) return <Badge className="bg-red-500/20 text-red-300">Expired</Badge>;
  if (days <= 30) return <Badge className="bg-orange-500/20 text-orange-300">Expiring Soon ({days}d)</Badge>;
  return <Badge className="bg-green-500/20 text-green-300">Valid ({days}d)</Badge>;
}

export default function TlsInsightWidget({ defaultHost = "" }) {
  const [host, setHost] = useState(defaultHost);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  const onLookup = async () => {
    if (!host.trim()) return;
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const { data } = await tlsInsight({ host: host.trim() });
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
          <Lock className="w-5 h-5 mr-2" />
          TLS Certificate & Fingerprint
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter hostname (e.g., example.com)"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="bg-slate-800/50 border-gray-600 text-white"
          />
          <Button onClick={onLookup} disabled={loading || !host.trim()} className="bg-gradient-to-r from-cyan-500 to-blue-500">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
          </Button>
        </div>

        {error && <div className="text-sm text-red-300">{error}</div>}

        {info && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400">Host</div>
                <div className="text-white">{info.host}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400">Issuer</div>
                <div className="text-white">{info.issuer || 'Unknown'}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400">Subject/CN</div>
                <div className="text-white">{info.common_name || info.subject || 'Unknown'}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400">Signature Algorithm</div>
                <div className="text-white">{info.signature_algorithm || 'Unknown'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400">Valid From</div>
                <div className="text-white">{info.valid_from ? new Date(info.valid_from).toLocaleString() : 'Unknown'}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400">Valid To</div>
                <div className="text-white">{info.valid_to ? new Date(info.valid_to).toLocaleString() : 'Unknown'}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400">Status</div>
                <div className="text-white"><ExpiryBadge days={info.days_to_expiry} /></div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-gray-400 mb-1">Subject Alt Names</div>
              <div className="text-gray-300 text-sm">{Array.isArray(info.san) ? info.san.join(', ') : (info.san || '—')}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400 flex items-center gap-2"><Fingerprint className="w-3 h-3" /> SHA-256</div>
                <div className="text-gray-300 text-xs break-all">{info.fingerprint_sha256 || 'Unknown'}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400 flex items-center gap-2"><Fingerprint className="w-3 h-3" /> SHA-1</div>
                <div className="text-gray-300 text-xs break-all">{info.fingerprint_sha1 || 'Unknown'}</div>
              </div>
            </div>

            {info.protocol && (
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-xs text-gray-400">Protocol</div>
                <div className="text-white">{info.protocol}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}