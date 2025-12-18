import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AddTaskModal({ open, onOpenChange, initialItem, onConfirm, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "30_day",
    due_date: "",
    assigned_to: "",
  });

  useEffect(() => {
    if (initialItem && open) {
      setFormData({
        title: initialItem.title || "",
        description: initialItem.description || "",
        priority: initialItem.priority || "medium",
        category: initialItem.category || "30_day",
        due_date: "",
        assigned_to: "",
      });
    }
  }, [initialItem, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onConfirm(formData);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        category: "30_day",
        due_date: "",
        assigned_to: "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Task to Action Items</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title..."
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description..."
              className="bg-slate-700 border-slate-600 text-white h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30_day">30-day</SelectItem>
                  <SelectItem value="60_day">60-day</SelectItem>
                  <SelectItem value="90_day">90-day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="assigned_to">Assign To (Email)</Label>
            <Input
              id="assigned_to"
              type="email"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="assignee@company.com"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                "Add Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}