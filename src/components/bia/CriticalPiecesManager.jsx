import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, Copy, Trash2 } from "lucide-react";

export default function CriticalPiecesManager({
  items,
  selectedIndex,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
  onReorder
}) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <div className="rounded-xl border border-purple-500/30 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-slate-300">Manage up to 5 critical pieces</div>
        <Button size="sm" onClick={onAdd} disabled={items.length >= 5} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="critical-pieces">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {items.map((it, idx) => {
                const complete = Boolean(
                  it.inputs &&
                  it.inputs.bia_impact_time_to_hurt &&
                  it.inputs.bia_impact_revenue_loss_rate &&
                  it.inputs.bia_impact_contract_exposure &&
                  it.inputs.bia_impact_ops_dependency_share &&
                  it.inputs.bia_data_classification &&
                  it.inputs.bia_data_public_notice_required &&
                  it.inputs.bia_data_regulatory_exposure &&
                  it.inputs.bia_exposure_vendor_control &&
                  it.inputs.bia_exposure_legacy_status &&
                  it.inputs.bia_exposure_single_point_of_failure &&
                  it.inputs.bia_exposure_external_staff_access &&
                  (it.inputs.bia_process_name || "")
                );
                return (
                  <Draggable key={it.id} draggableId={it.id} index={idx}>
                    {(pp) => (
                      <div
                        ref={pp.innerRef}
                        {...pp.draggableProps}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                          idx === selectedIndex
                            ? "border-cyan-400 bg-cyan-500/10"
                            : "border-slate-700 bg-slate-800/40 hover:border-slate-500"
                        }`}
                        onClick={() => onSelect(idx)}
                      >
                        <div {...pp.dragHandleProps} className="text-slate-400 hover:text-slate-200 cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <Input
                          value={it.name || ""}
                          onChange={(e) => {
                            // bubble change by selecting and letting parent handle rename
                            onSelect(idx);
                            // small trick: emit a custom event up using a property on onReorder for rename is overkill; instead parent will update name via state setter
                            // recommendation: parent updates name when selectedIndex changes and field edited; here keep display only.
                          }}
                          readOnly
                          className="bg-slate-900/40 border-slate-600 text-white h-8"
                        />
                        <Badge variant="outline" className="text-xs border-slate-600">
                          {it.type || "Type"}
                        </Badge>
                        <Badge className={complete ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"} variant="secondary">
                          {complete ? "Complete" : "Incomplete"}
                        </Badge>
                        <div className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => onDuplicate(idx)} className="text-slate-300 hover:text-white">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemove(idx)}
                            disabled={items.length <= 1}
                            className="text-red-300 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}