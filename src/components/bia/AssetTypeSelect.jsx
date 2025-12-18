import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2 } from "lucide-react";

export default function AssetTypeSelect({ types = [], value, onChange, onManage, suggested }) {
  const activeTypes = (types || []).filter(t => t.active !== false).sort((a,b)=> (a.order_index??999)-(b.order_index??999));
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">Type</div>
        <div className="flex items-center gap-2">
          {suggested && !value && (
            <button className="text-xs text-cyan-300 hover:underline" onClick={()=>onChange(suggested)}>
              Use suggested: {suggested}
            </button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onManage} className="h-7 px-2 border-gray-600 text-gray-300">
            <Settings2 className="w-3.5 h-3.5 mr-1" /> Manage
          </Button>
        </div>
      </div>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white mt-1">
          <SelectValue placeholder="Select type..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-gray-600">
          {activeTypes.map(t => (
            <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
          ))}
          {activeTypes.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">No active types — click Manage to add</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}