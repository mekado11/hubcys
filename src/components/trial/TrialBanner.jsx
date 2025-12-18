import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TrialBanner({ daysRemaining, isWarning = false }) {
  if (daysRemaining < 0) return null; // Trial already expired

  const isUrgent = daysRemaining <= 3;
  
  return (
    <Card className={`mb-4 border-2 ${
      isUrgent 
        ? 'bg-red-900/20 border-red-500/50' 
        : 'bg-yellow-900/20 border-yellow-500/50'
    } print:hidden`}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            isUrgent 
              ? 'bg-red-500/20' 
              : 'bg-yellow-500/20'
          }`}>
            {isUrgent ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <Calendar className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          <div>
            <h4 className={`font-semibold ${
              isUrgent ? 'text-red-300' : 'text-yellow-300'
            }`}>
              {isUrgent ? 'Trial Ending Soon!' : 'Free Trial Active'}
            </h4>
            <p className="text-gray-300 text-sm">
              {daysRemaining === 0 
                ? 'Your trial expires today' 
                : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in your free trial`
              }
            </p>
          </div>
        </div>
        <Button
          asChild
          className={`${
            isUrgent
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
          } text-white`}
        >
          <Link to={createPageUrl('Pricing')}>
            <Crown className="w-4 h-4 mr-2" />
            {isUrgent ? 'Upgrade Now' : 'View Plans'}
          </Link>
        </Button>
      </div>
    </Card>
  );
}