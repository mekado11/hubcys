import React, { useState, useEffect, useCallback } from 'react';
import { Subtask } from '@/entities/Subtask';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Loader2, ListTodo } from 'lucide-react';

export default function ActionItemSubtasks({ actionItemId }) {
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchSubtasks = useCallback(async () => {
    if (!actionItemId) return;
    setLoading(true);
    try {
      const relatedSubtasks = await Subtask.filter({ action_item_id: actionItemId });
      setSubtasks(relatedSubtasks.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    } finally {
      setLoading(false);
    }
  }, [actionItemId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !actionItemId) return;

    setIsCreating(true);
    try {
      await Subtask.create({
        action_item_id: actionItemId,
        title: newSubtaskTitle,
        completed: false,
      });
      setNewSubtaskTitle('');
      await fetchSubtasks(); // Re-fetch to get the new subtask
    } catch (error) {
      console.error("Error creating subtask:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleSubtask = async (subtaskId, completed) => {
    try {
      await Subtask.update(subtaskId, { completed: !completed });
      setSubtasks(prev =>
        prev.map(st => (st.id === subtaskId ? { ...st, completed: !completed } : st))
      );
    } catch (error) {
      console.error("Error toggling subtask:", error);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await Subtask.delete(subtaskId);
      setSubtasks(prev => prev.filter(st => st.id !== subtaskId));
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  const completionPercentage = subtasks.length > 0
    ? (subtasks.filter(st => st.completed).length / subtasks.length) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white flex items-center">
            <ListTodo className="w-5 h-5 mr-2 text-cyan-400" />
            Checklist
        </h4>
        <span className="text-sm text-gray-400">{Math.round(completionPercentage)}% Complete</span>
      </div>
      <Progress value={completionPercentage} className="h-2 [&>div]:bg-cyan-400" />
      
      {loading && <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {subtasks.map(subtask => (
          <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700/50 transition-colors">
            <Checkbox
              id={`subtask-${subtask.id}`}
              checked={subtask.completed}
              onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.completed)}
              className="border-gray-500 data-[state=checked]:bg-cyan-500"
            />
            <label
              htmlFor={`subtask-${subtask.id}`}
              className={`flex-grow text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-200'} cursor-pointer`}
            >
              {subtask.title}
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => handleDeleteSubtask(subtask.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreateSubtask} className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
        <Input
          placeholder="Add a new checklist item..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          className="bg-slate-800/50 border-gray-600 text-white"
          disabled={isCreating}
        />
        <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-700" disabled={isCreating}>
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}