import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Link as LinkIcon, CheckCircle2, Shield } from "lucide-react";
import owaspSnippets from "./OwaspCheatSheetSnippets";
import { OWASP_TOP10_2021, getCheatSheetUrlsForOwaspCategory } from "@/components/security/owaspMap";

export default function OwaspKnowledgePanel({ filterIds = [] }) {
  const items = Array.isArray(filterIds) && filterIds.length > 0
    ? OWASP_TOP10_2021.filter(({ id, name }) => {
        const lower = (id + " " + name).toLowerCase();
        return filterIds.some(fid => lower.includes(String(fid).toLowerCase()));
      })
    : OWASP_TOP10_2021;

  return (
    <Card className="glass-effect border-slate-700/50 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-slate-700/50 px-6 py-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-cyan-300 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            OWASP Knowledge Pack
          </CardTitle>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30">Guidance</Badge>
        </div>
        <p className="text-gray-300 mt-2">Curated guidance and direct links to OWASP Cheat Sheets for each OWASP Top 10:2021 category.</p>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(({ id, name }) => {
            const links = getCheatSheetUrlsForOwaspCategory(id);
            const tips = owaspSnippets[id] || [];
            return (
              <div
                key={id}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 shadow-sm hover:shadow-md transition-shadow relative"
              >
                <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-cyan-500/60 to-blue-500/60 rounded-l-xl" />
                <div className="flex items-center justify-between mb-1">
                  <div className="text-white font-semibold">
                    {id.split(':')[0]} • {name}
                  </div>
                  <Badge className="bg-slate-800 text-cyan-300 border-slate-600 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> OWASP
                  </Badge>
                </div>

                {tips.length > 0 && (
                  <ul className="text-sm text-gray-200 space-y-1.5 mt-2">
                    {tips.slice(0, 3).map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mt-0.5 flex-shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {links.slice(0, 3).map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-600 text-xs text-cyan-300 hover:text-cyan-200 hover:bg-slate-800"
                      >
                        <LinkIcon className="w-3 h-3" /> {l.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}