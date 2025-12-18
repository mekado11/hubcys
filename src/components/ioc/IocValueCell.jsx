import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Expand } from "lucide-react";

export default function IocValueCell({ value, type }) {
  const v = typeof value === "string" ? value : (value != null ? String(value) : "");
  const [expanded, setExpanded] = React.useState(false);

  const isLong = v.length > 36;

  const middleTruncate = (str, head = 16, tail = 16) => {
    if (!str) return "—";
    if (str.length <= head + tail + 1) return str;
    return `${str.slice(0, head)}…${str.slice(-tail)}`;
  };

  const display = expanded ? v : (isLong ? middleTruncate(v) : (v || "—"));

  return (
    <div className="flex items-start gap-2 max-w-[520px]">
      <code
        className={`font-mono text-xs text-gray-200 leading-5 max-w-[420px] ${
          expanded
            ? "whitespace-pre-wrap break-words"
            : "whitespace-nowrap overflow-hidden text-ellipsis"
        }`}
        title={v}
      >
        {display}
      </code>
      <div className="flex-shrink-0 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-white"
          onClick={() => navigator.clipboard.writeText(v)}
          title="Copy value"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        {isLong && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={() => setExpanded((s) => !s)}
            title={expanded ? "Collapse" : "Expand"}
          >
            <Expand className={`w-3.5 h-3.5 ${expanded ? "rotate-180" : ""}`} />
          </Button>
        )}
      </div>
    </div>
  );
}