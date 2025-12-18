import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RecentActionItems({ actionItems, error }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-300 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-300 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (error) {
    return (
      <Card className="glass-effect border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Recent Action Items
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Unable to load action items</p>
            <p className="text-gray-500 text-sm">This is normal for new applications</p>
            <Link to={createPageUrl("ActionItems")} className="mt-4 inline-block">
              <Button className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Create First Action Item
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentItems = actionItems.slice(0, 5);

  return (
    <Card className="glass-effect border-green-500/20 card-entrance stagger-3">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Recent Action Items
          </div>
          <Link to={createPageUrl("ActionItems")}>
            <Button variant="ghost" size="sm" className="text-green-300 hover:bg-green-500/20">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentItems.length > 0 ? (
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div key={item.id} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(item.status)}
                      <h4 className="font-medium text-white text-sm">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(item.priority)} variant="outline">
                        {item.priority}
                      </Badge>
                      <Badge className="bg-slate-600/50 text-gray-300 border-slate-500/50" variant="outline">
                        {item.category?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                {item.due_date && (
                  <div className="text-xs text-gray-400 mt-2">
                    Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No action items yet</p>
            <Link to={createPageUrl("ActionItems")}>
              <Button className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Action Item
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}