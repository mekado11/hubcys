
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  ArrowLeft,
  Save,
  Trash2,
  Calendar as CalendarIcon,
  FileText,
  Activity,
  Loader2
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ActionItemSubtasks from './ActionItemSubtasks';
import CommentThread from '../collaboration/CommentThread';
import EditingWarning from '../collaboration/EditingWarning';
import RoleGate, { canEditEntity } from '../collaboration/RoleGate';

export default function ActionItemDetail({ actionItem, onBack, onSave, onDelete }) {
  const [item, setItem] = useState({ ...actionItem });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userList, user] = await Promise.all([
          User.list(),
          User.me()
        ]);
        setUsers(userList);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleChange = (field, value) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(item);
    } catch (error) {
      console.error("Error saving action item:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'blocked': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'not_started':
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low':
      default:
        return 'text-blue-400';
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  const canEdit = canEditEntity(currentUser, 'action_items', item);

  return (
    <div className="space-y-6">
      {/* Editing Warning */}
      <EditingWarning
        entityType="action_item"
        entityId={item.id}
        currentUser={currentUser}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <div className="flex items-center gap-4">
          <RoleGate user={currentUser} permission="edit:action_items">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={isSaving || !canEdit}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </RoleGate>
          <RoleGate user={currentUser} permission="edit:action_items">
            <Button onClick={() => onDelete(item.id)} variant="destructive" disabled={!canEdit}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Item
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Properties */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-effect border-cyan-500/20">
            <CardHeader>
              <Input
                value={item.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="text-2xl font-bold bg-transparent border-0 border-b-2 border-cyan-500/30 focus:border-cyan-500 focus:ring-0 rounded-none p-2 text-white"
                placeholder="Action Item Title"
                disabled={!canEdit}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={item.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Add a detailed description..."
                className="min-h-[120px] bg-slate-800/50 border-gray-600 text-gray-300"
                disabled={!canEdit}
              />

              <div className="flex items-center gap-2">
                 {item.assessment_id && (
                  <Link to={createPageUrl(`Reports?highlight=${item.assessment_id}`)}>
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 transition-colors">
                      <FileText className="w-3 h-3 mr-1.5"/>
                      Linked to Assessment
                    </Badge>
                  </Link>
                )}
                {item.incident_id && (
                  <Link to={createPageUrl(`IncidentDetail?id=${item.incident_id}`)}>
                     <Badge variant="outline" className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10 transition-colors">
                      <Activity className="w-3 h-3 mr-1.5"/>
                      Linked to Incident
                    </Badge>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-purple-500/20">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Status</label>
                <Select value={item.status} onValueChange={(value) => handleChange('status', value)} disabled={!canEdit}>
                  <SelectTrigger className={`w-full ${getStatusColor(item.status)} border`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600 text-white">
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Priority</label>
                <Select value={item.priority} onValueChange={(value) => handleChange('priority', value)} disabled={!canEdit}>
                  <SelectTrigger className={`w-full bg-slate-800/50 border-gray-600 text-white`}>
                    <span className={getPriorityColor(item.priority)}>{item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600 text-white">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Assignee</label>
                <Select value={item.assigned_to || ''} onValueChange={(value) => handleChange('assigned_to', value)} disabled={!canEdit}>
                  <SelectTrigger className="w-full bg-slate-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600 text-white">
                    <SelectItem value={null}>Unassigned</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Due Date */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-slate-800/50 border-gray-600 hover:bg-slate-700/50 text-white" disabled={!canEdit}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {item.due_date ? format(new Date(item.due_date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-gray-600">
                    <Calendar
                      mode="single"
                      selected={item.due_date ? new Date(item.due_date) : null}
                      onSelect={(date) => handleChange('due_date', date?.toISOString().split('T')[0])}
                      initialFocus
                      className="text-white"
                      disabled={!canEdit}
                    />
                  </PopoverContent>
                </Popover>
              </div>

               {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Category</label>
                <Select value={item.category} onValueChange={(value) => handleChange('category', value)} disabled={!canEdit}>
                  <SelectTrigger className="w-full bg-slate-800/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600 text-white">
                    <SelectItem value="30_day">30 Day</SelectItem>
                    <SelectItem value="60_day">60 Day</SelectItem>
                    <SelectItem value="90_day">90 Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Responsible Team */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Responsible Team</label>
                <Input
                  value={item.responsible_team || ''}
                  onChange={(e) => handleChange('responsible_team', e.target.value)}
                  placeholder="e.g., Engineering, IT"
                  className="bg-slate-800/50 border-gray-600 text-white"
                  disabled={!canEdit}
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Collaboration (Sub-tasks & Comments) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-effect border-gray-700/50">
            <CardContent className="p-6">
              <ActionItemSubtasks actionItemId={item.id} canEdit={canEdit} />
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-gray-700/50">
            <CardContent className="p-6">
              <CommentThread
                entityType="action_item"
                entityId={item.id}
                currentUser={currentUser}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
