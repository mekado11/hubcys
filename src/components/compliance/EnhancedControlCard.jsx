import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Edit, 
  FileText, 
  Users, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import ControlScoreSlider from './ControlScoreSlider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function EnhancedControlCard({ 
  control, 
  actionItems = [], 
  evidenceCount = 0,
  onScoreUpdate,
  onEditControl,
  onViewActionItems,
  onAddActionItem 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);

  const handleScoreChange = async (newScore) => {
    setIsUpdatingScore(true);
    try {
      await onScoreUpdate(control.id, newScore);
    } catch (error) {
      console.error('Error updating control score:', error);
    } finally {
      setIsUpdatingScore(false);
    }
  };

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'Critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const completedActions = actionItems.filter(item => item.status === 'completed').length;
  const totalActions = actionItems.length;
  const actionProgress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  const overdue = actionItems.filter(item => {
    if (!item.due_date || item.status === 'completed') return false;
    const dueDate = new Date(item.due_date);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate < new Date();
  }).length;

  return (
    <Card className="glass-effect border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-cyan-300 text-lg">{control.control_id}</CardTitle>
              <Badge className={`${getCriticalityColor(control.criticality)} border text-xs`}>
                {control.criticality}
              </Badge>
            </div>
            <h3 className="text-white font-medium mb-2">{control.control_name}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{control.control_description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onEditControl(control)}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-300">{control.maturity_score}</div>
            <div className="text-xs text-gray-400">Maturity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-300">{totalActions}</div>
            <div className="text-xs text-gray-400">Actions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-300">{evidenceCount}</div>
            <div className="text-xs text-gray-400">Evidence</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${overdue > 0 ? 'text-red-300' : 'text-gray-300'}`}>
              {overdue}
            </div>
            <div className="text-xs text-gray-400">Overdue</div>
          </div>
        </div>

        {/* Action Progress Bar */}
        {totalActions > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Action Items Progress</span>
              <span className="text-gray-300">{completedActions}/{totalActions} completed</span>
            </div>
            <Progress value={actionProgress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-center text-cyan-400 hover:text-cyan-300">
              {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              {isExpanded ? 'Hide Details' : 'Show Details & Manage'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-6">
            {/* Maturity Score Slider */}
            <div>
              <ControlScoreSlider
                value={control.maturity_score || 0}
                onChange={handleScoreChange}
                disabled={isUpdatingScore}
              />
            </div>

            {/* Control Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Owner:</span>
                  <span className="text-white">{control.owner_email || 'Unassigned'}</span>
                </div>
                {control.last_review_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Last Review:</span>
                    <span className="text-white">{format(new Date(control.last_review_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {control.next_review_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Next Review:</span>
                    <span className="text-white">{format(new Date(control.next_review_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-gray-400">Category:</span>
                  <span className="text-white ml-2">{control.control_category || 'General'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Status:</span>
                  <Badge className="ml-2 bg-slate-600 text-slate-200 text-xs">
                    {control.implementation_status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Notes */}
            {control.notes && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Notes:</h4>
                <p className="text-sm text-gray-400">{control.notes}</p>
              </div>
            )}

            {/* Action Items Summary */}
            {actionItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-purple-300">Related Action Items</h4>
                  <Button size="sm" onClick={() => onViewActionItems(control.id)} className="text-xs">
                    View All ({totalActions})
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {actionItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                      <div className="flex items-center gap-2">
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : item.due_date && new Date(item.due_date) < new Date() ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-white truncate">{item.title}</span>
                      </div>
                      <Badge className="text-xs bg-gray-600 text-gray-200">
                        {item.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <Button size="sm" onClick={() => onAddActionItem(control)} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Action Item
              </Button>
              <Button size="sm" variant="outline" onClick={() => onViewActionItems(control.id)} className="border-gray-600">
                <FileText className="w-4 h-4 mr-2" />
                View Evidence ({evidenceCount})
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}