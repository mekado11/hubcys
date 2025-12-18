import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PolicyCard({ policy, onDelete, className = '' }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'In_Review': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Draft': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Archived': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'In_Review': return <Clock className="w-4 h-4" />;
      case 'Draft': return <FileText className="w-4 h-4" />;
      case 'Archived': return <Archive className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatPolicyType = (type) => {
    return type?.replace(/_/g, ' ') || 'Other';
  };

  return (
    <Card className={`glass-effect border-gray-500/20 hover:border-purple-500/50 transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-white text-lg mb-2 truncate">{policy.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={`border text-xs ${getStatusColor(policy.status)}`}>
                {getStatusIcon(policy.status)}
                <span className="ml-1">{policy.status?.replace('_', ' ')}</span>
              </Badge>
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {formatPolicyType(policy.policy_type)}
              </Badge>
              <Badge variant="outline" className="text-xs border-purple-600 text-purple-300">
                v{policy.version || '1.0'}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-gray-600">
              <DropdownMenuItem asChild className="text-white hover:bg-slate-700 cursor-pointer">
                <Link to={createPageUrl(`PolicyEditor?id=${policy.id}`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Policy
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={() => onDelete(policy.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {policy.next_review_date && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Next Review:</span>
              </div>
              <span className="text-orange-300">
                {format(new Date(policy.next_review_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700/50">
            <span>Created by {policy.created_by}</span>
            {policy.updated_date && (
              <span>Updated {format(new Date(policy.updated_date), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}