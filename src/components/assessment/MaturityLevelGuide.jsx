import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckCircle, AlertCircle, Clock, Star } from 'lucide-react';

export default function MaturityLevelGuide({ category, currentLevel, allLevels }) {
  const getLevelIcon = (level) => {
    switch (level) {
      case 0: return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 1: return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 2: return <Clock className="w-4 h-4 text-yellow-400" />;
      case 3: return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 4: return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 5: return <Star className="w-4 h-4 text-cyan-400" />;
      default: return <HelpCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level, isCurrent) => {
    if (isCurrent) {
        switch (level) {
            case 0: return 'bg-red-900/50 text-red-300 border-red-500/50';
            case 1: return 'bg-orange-900/50 text-orange-300 border-orange-500/50';
            case 2: return 'bg-yellow-900/50 text-yellow-300 border-yellow-500/50';
            case 3: return 'bg-blue-900/50 text-blue-300 border-blue-500/50';
            case 4: return 'bg-green-900/50 text-green-300 border-green-500/50';
            case 5: return 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50';
            default: return 'bg-gray-900/50 text-gray-300 border-gray-500/50';
        }
    }
    return 'bg-slate-800/30 border-gray-700/50 text-gray-400 hover:bg-slate-800/60';
  };

  return (
    <Card className="glass-effect border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center text-sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          Maturity Level Guide for {category.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allLevels && allLevels.map((levelData) => {
            const isCurrent = levelData.level === currentLevel;
            return (
              <div
                key={levelData.level}
                className={`p-3 rounded-lg border transition-all duration-200 ${getLevelColor(levelData.level, isCurrent)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(levelData.level)}
                    <span className="font-medium text-white">Level {levelData.level}: {levelData.title}</span>
                  </div>
                  {isCurrent && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm opacity-90 break-words pl-6">
                  {levelData.description}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
}