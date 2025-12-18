import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchCisaKev } from "@/functions/fetchCisaKev";
import { Newspaper, ExternalLink, RefreshCw, AlertTriangle, Calendar } from "lucide-react";

export default function CisaFeed() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchCisaKev();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load CISA KEV feed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((it) =>
      (it.cve_id || "").toLowerCase().includes(q) ||
      (it.vulnerability_name || "").toLowerCase().includes(q) ||
      (it.vendor_product || "").toLowerCase().includes(q) ||
      (it.short_description || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const itemsToShow = expanded ? filtered : filtered.slice(0, 5);

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-cyan-300 flex items-center text-base md:text-[17px]">
            <Newspaper className="w-4 h-4 mr-2" />
            CISA Known Exploited Vulnerabilities
          </CardTitle>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="border-slate-600 text-gray-300 text-[10px]">
              Total: {items.length}
            </Badge>
            <a
              href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="h-8 px-2 border-gray-600 text-gray-300 hover:bg-gray-800 text-xs">
                View on CISA <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <Button onClick={load} variant="outline" className="h-8 px-2 border-gray-600 text-gray-300 hover:bg-gray-800 text-xs">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by CVE, product, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-800/50 border-gray-600 text-white h-8 text-xs"
          />
          <div className="text-[11px] text-gray-400">
            Showing {itemsToShow.length} of {filtered.length}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-gray-300 text-sm">Loading latest advisories...</div>
        ) : error ? (
          <div className="flex items-center text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-400 text-sm">No advisories match your search.</div>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {itemsToShow.map((it, idx) => (
              <li key={`${it.cve_id || "no-cve"}-${idx}`} className="py-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        className="text-white font-medium hover:underline text-[13px] md:text-sm"
                        href={it.cve_id ? `https://nvd.nist.gov/vuln/detail/${it.cve_id}` : "https://www.cisa.gov/known-exploited-vulnerabilities-catalog"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {it.cve_id || "CVE"}
                      </a>
                      {it.vulnerability_name && (
                        <span className="text-gray-300 text-[12px]">{it.vulnerability_name}</span>
                      )}
                    </div>
                    {it.vendor_product && (
                      <div className="text-[11px] text-gray-400 mt-1">
                        Vendor/Product: {it.vendor_product}
                      </div>
                    )}
                    {it.short_description && (
                      <div className="text-[11px] text-gray-400 mt-1">
                        {it.short_description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {it.date_added && (
                        <Badge className="bg-slate-700/70 text-gray-200 text-[10px] px-2 py-0.5">
                          <Calendar className="w-3 h-3 mr-1" />
                          Added: {it.date_added}
                        </Badge>
                      )}
                      {it.due_date && (
                        <Badge className="bg-slate-700/70 text-gray-200 text-[10px] px-2 py-0.5">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {it.due_date}
                        </Badge>
                      )}
                      {it.required_action && (
                        <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5">
                          {it.required_action}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      className="text-cyan-300 hover:text-cyan-200 text-xs flex items-center"
                      href={it.cve_id ? `https://nvd.nist.gov/vuln/detail/${it.cve_id}` : "https://www.cisa.gov/known-exploited-vulnerabilities-catalog"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Details <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {filtered.length > 5 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="w-full text-cyan-300 hover:bg-slate-800 hover:text-white text-sm"
            >
              {expanded ? "Show less" : `See more (${filtered.length - 5} more)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}