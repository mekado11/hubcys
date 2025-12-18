import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

export default function OrgUnitList({ units = [], onEdit, onDelete }) {
  if (!units.length) {
    return (
      <div className="text-gray-400 text-sm">
        No units yet. Use “New Unit” to add Engineering, IT/Desktop, DevOps, or Cyber and define responsibilities.
      </div>
    );
  }

  const byTypeOrder = { Engineering: 1, DevOps: 2, IT_Desktop: 3, Cybersecurity: 4, Other: 9 };
  const sorted = [...units].sort((a, b) => {
    const aOrder = a.order_index ?? 999;
    const bOrder = b.order_index ?? 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const t = (byTypeOrder[a.unit_type] || 99) - (byTypeOrder[b.unit_type] || 99);
    if (t !== 0) return t;
    return (a.name || "").localeCompare(b.name || "");
  });

  const parentName = (u) => {
    const p = units.find((x) => x.id === u.parent_unit_id);
    return p ? p.name : "—";
    };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Reports To</th>
            <th className="py-2 pr-4">Responsibilities</th>
            <th className="py-2 pr-4 w-28">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((u) => (
            <tr key={u.id} className="border-t border-slate-700/40">
              <td className="py-2 pr-4 text-white">{u.name}</td>
              <td className="py-2 pr-4">
                <Badge className="bg-slate-700/60 text-gray-200 border-none">{u.unit_type.replace('_','/')}</Badge>
              </td>
              <td className="py-2 pr-4 text-gray-300">{parentName(u)}</td>
              <td className="py-2 pr-4">
                <div className="flex flex-wrap gap-1">
                  {(u.responsibilities || []).slice(0, 4).map((r, i) => (
                    <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-cyan-400/20">{r}</Badge>
                  ))}
                  {(u.responsibilities || []).length > 4 && (
                    <Badge className="bg-slate-700/60 text-gray-300 border-none">+{u.responsibilities.length - 4}</Badge>
                  )}
                </div>
              </td>
              <td className="py-2 pr-4">
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="text-gray-300" onClick={() => onEdit(u)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-300" onClick={() => onDelete(u)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}