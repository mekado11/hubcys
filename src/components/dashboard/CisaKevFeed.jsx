
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bug, ExternalLink, ShieldAlert, CalendarClock, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // New import
import { format, parseISO } from 'date-fns';
import { fetchCisaKev } from "@/functions/fetchCisaKev";

export default function CisaKevFeed() {
  const [kevData, setKevData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState(""); // NEW: search term

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Platform v2 functions return an axios-like response
        const { data } = await fetchCisaKev();
        setKevData(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('CISA KEV fetch failed:', e);
        setError('Failed to load CISA KEV data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // NEW: filter by query (cve, name, vendor/product, description)
  const filtered = kevData.filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (it.cve_id || "").toLowerCase().includes(q) ||
      (it.vulnerability_name || "").toLowerCase().includes(q) ||
      (it.vendor_product || "").toLowerCase().includes(q) ||
      (it.short_description || "").toLowerCase().includes(q)
    );
  });

  const itemsToDisplay = expanded ? filtered : filtered.slice(0, 5);
  const showingCount = itemsToDisplay.length;
  const totalCount = filtered.length;

  if (loading) {
    return (
      <Card className="glass-effect border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-purple-300 text-base md:text-[17px] font-semibold flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2" />
            CISA Known Exploited Vulnerabilities
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          <span className="ml-2 text-gray-400 text-sm">Loading latest advisories...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-effect border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-300 text-base md:text-[17px] font-semibold flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2" />
            CISA Known Exploited Vulnerabilities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-red-300 text-sm">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-purple-500/20">
      <CardHeader className="flex flex-col gap-2 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-300 text-base md:text-[17px] font-semibold tracking-tight flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2" />
            CISA Known Exploited Vulnerabilities
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-purple-500/30 text-purple-200 text-[10px]">
              Total: {kevData.length}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://www.cisa.gov/known-exploited-vulnerabilities-catalog', '_blank')}
              className="h-8 px-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" /> Catalog
            </Button>
          </div>
        </div>

        {/* NEW: compact search input */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search CVE, vendor, product…"
              className="pl-7 h-8 bg-slate-800/50 border-slate-700 text-xs text-white placeholder:text-gray-400"
            />
          </div>
          <div className="text-[11px] text-gray-400 whitespace-nowrap">
            Showing {showingCount} of {totalCount}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-3">
          {itemsToDisplay.length > 0 ? itemsToDisplay.map((kev, idx) => {
            const link = kev.cve_id ? `https://nvd.nist.gov/vuln/detail/${kev.cve_id}` : undefined;
            return (
              <div
                key={`${kev.cve_id || 'no-cve'}-${idx}`}
                className="flex flex-col sm:flex-row items-start sm:items-center p-2.5 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-purple-400/50 transition-colors"
              >
                <div className="flex-1 mb-1 sm:mb-0">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-100 font-medium hover:text-purple-300 transition-colors flex items-start text-[13px] md:text-sm"
                  >
                    <Bug className="w-3.5 h-3.5 mr-2 flex-shrink-0 mt-[2px]" />
                    <span className="leading-snug">
                      {kev.vulnerability_name || 'Vulnerability'}{kev.cve_id ? ` (${kev.cve_id})` : ''}
                    </span>
                  </a>
                  <p className="text-gray-400 text-[11px] mt-1">
                    Vendor/Product: {kev.vendor_product || '—'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-[10px]">
                  {kev.date_added && (
                    <Badge variant="outline" className="border-slate-600 text-gray-300 flex items-center px-2 py-0.5">
                      <List className="w-3 h-3 mr-1" /> Added: {format(parseISO(kev.date_added), 'MMM d, yyyy')}
                    </Badge>
                  )}
                  {kev.due_date && (
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 flex items-center px-2 py-0.5">
                      <CalendarClock className="w-3 h-3 mr-1" /> Due: {format(parseISO(kev.due_date), 'MMM d, yyyy')}
                    </Badge>
                  )}
                </div>
              </div>
            );
          }) : (
            <p className="text-gray-400 text-sm text-center py-4">No KEV entries found.</p>
          )}
        </div>

        {/* NEW: See more / Show less */}
        {totalCount > 5 && (
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 text-purple-300 hover:bg-slate-800 hover:text-white text-sm"
          >
            {expanded ? 'Show less' : `See more (${totalCount - 5} more)`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
