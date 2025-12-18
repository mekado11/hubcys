
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, Info, ChevronDown } from "lucide-react";

function ItemRow({ item }) {
  const topMitre = (item.mitre_with_names || item.mitre || []).slice(0, 2);
  const rationale = Array.isArray(item.rationale) ? item.rationale[0] : (item.rationale || "");
  return (
    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs uppercase bg-slate-700/40 text-slate-200 border-slate-600">
            {String(item.type || "").toUpperCase()}
          </Badge>
          <span className="font-mono text-sm text-white break-all">{item.value}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-700 text-white">{Math.round(item.score ?? 0)}</Badge>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-300">
        {rationale || "—"}
      </div>
      {topMitre?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {topMitre.map((m, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-xs border-purple-500/40 text-slate-200 bg-slate-800/30"
            >
              {typeof m === "string" ? m : `${m.id} · ${m.name}`}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function SeveritySection({ title, severity, items = [], collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);

  const color =
    severity === "high" ? "text-red-300" :
    severity === "medium" ? "text-amber-300" :
    "text-blue-300";

  const Icon =
    severity === "high" ? ShieldAlert :
    severity === "medium" ? AlertTriangle :
    Info;

  return (
    <Card className="glass-effect border-cyan-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg flex items-center gap-2 ${color}`}>
            <Icon className="w-5 h-5" />
            {title} <span className="text-white/70 text-sm">({items.length})</span>
          </CardTitle>
          {collapsible && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-slate-300 hover:text-white transition-colors"
              aria-label={open ? "Collapse section" : "Expand section"}
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${open ? "" : "-rotate-90"}`} />
            </button>
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {items.length ? items.map((it, idx) => <ItemRow key={idx} item={it} />) : (
            <div className="text-gray-400 text-sm">No items</div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
