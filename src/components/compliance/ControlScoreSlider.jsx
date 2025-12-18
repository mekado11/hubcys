import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

const scoreDescriptions = {
  0: { title: "Not Implemented", description: "Control is not implemented at all", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  1: { title: "Planned", description: "Control implementation is planned but not started", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  2: { title: "Partial", description: "Control is partially implemented", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  3: { title: "Implemented", description: "Control is implemented but not regularly reviewed", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  4: { title: "Reviewed", description: "Control is implemented and regularly reviewed", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  5: { title: "Monitored & Improved", description: "Control is continuously monitored and improved", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" }
};

export default function ControlScoreSlider({ value, onChange, disabled = false }) {
  const currentScore = scoreDescriptions[value] || scoreDescriptions[0];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">Maturity Score</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2">
                  <p className="font-semibold">Control Maturity Levels:</p>
                  {Object.entries(scoreDescriptions).map(([score, desc]) => (
                    <div key={score} className="text-xs">
                      <strong>{score}:</strong> {desc.title} - {desc.description}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge className={`${currentScore.color} border`}>
            Level {value}: {currentScore.title}
          </Badge>
        </div>

        <div className="px-2">
          <Slider
            value={[value]}
            onValueChange={(newValue) => onChange(newValue[0])}
            max={5}
            step={1}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {[0,1,2,3,4,5].map(level => (
              <Tooltip key={level}>
                <TooltipTrigger>
                  <span className={value === level ? 'text-cyan-300 font-bold' : ''}>{level}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{scoreDescriptions[level].title}</p>
                  <p className="text-xs">{scoreDescriptions[level].description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-sm text-gray-300">
            <strong>Current Status:</strong> {currentScore.description}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}