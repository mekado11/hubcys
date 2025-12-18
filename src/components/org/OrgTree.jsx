import React from "react";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Users, Shield, ServerCog, Wrench } from "lucide-react";

function buildTree(units = []) {
  const map = new Map();
  units.forEach((u) => map.set(u.id, { ...u, children: [] }));
  const roots = [];
  map.forEach((node) => {
    if (node.parent_unit_id && map.has(node.parent_unit_id)) {
      map.get(node.parent_unit_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  // Sort children consistently
  const sorter = (a, b) => {
    const aOrder = a.order_index ?? 999, bOrder = b.order_index ?? 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.name || "").localeCompare(b.name || "");
  };
  const sortDeep = (nodes) => {
    nodes.sort(sorter);
    nodes.forEach((n) => sortDeep(n.children));
  };
  sortDeep(roots);
  return roots;
}

const typeIcon = (type) => {
  switch (type) {
    case "Engineering": return <Users className="w-4 h-4 text-cyan-300" />;
    case "DevOps": return <ServerCog className="w-4 h-4 text-emerald-300" />;
    case "IT_Desktop": return <Wrench className="w-4 h-4 text-yellow-300" />;
    case "Cybersecurity": return <Shield className="w-4 h-4 text-purple-300" />;
    default: return <GitBranch className="w-4 h-4 text-gray-300" />;
  }
};

function Node({ node, depth = 0 }) {
  return (
    <div className="relative pl-4">
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 border-l border-slate-700/60" />
      )}
      <div className="relative mb-2">
        {depth > 0 && (
          <div className="absolute -left-4 top-3 w-4 border-t border-slate-700/60" />
        )}
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2">
            {typeIcon(node.unit_type)}
            <span className="text-white font-medium">{node.name}</span>
            <Badge className="bg-slate-700/60 text-gray-300 border-none">{node.unit_type.replace('_','/')}</Badge>
            {typeof node.headcount === "number" && (
              <Badge className="bg-slate-700/60 text-gray-300 border-none">HC: {node.headcount}</Badge>
            )}
          </div>
          {node.description && (
            <div className="text-gray-400 text-xs mt-1">{node.description}</div>
          )}
          {(node.responsibilities || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {node.responsibilities.slice(0, 6).map((r, i) => (
                <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-cyan-400/20">{r}</Badge>
              ))}
              {node.responsibilities.length > 6 && (
                <Badge className="bg-slate-700/60 text-gray-300 border-none">+{node.responsibilities.length - 6}</Badge>
              )}
            </div>
          )}
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="ml-6">
          {node.children.map((c) => (
            <Node key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgTree({ units = [] }) {
  const roots = React.useMemo(() => buildTree(units), [units]);

  if (units.length === 0) {
    return <div className="text-gray-400 text-sm">No units defined yet.</div>;
  }

  return (
    <div className="space-y-3">
      {roots.map((r) => (
        <Node key={r.id} node={r} depth={0} />
      ))}
    </div>
  );
}