import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Clock } from 'lucide-react';

export default function AudioTranscriber({ 
  title = "Voice Input", 
  onTextReady, 
  compact = false,
  maxMinutes = 5,
  showCostNotice = false,
  defaultLanguage = "en-US"
}) {
  // Temporarily disabled - show coming soon message
  return (
    <Card className="bg-slate-800/30 border-purple-500/30">
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-center justify-center space-x-3 text-center">
          <div className="flex items-center space-x-2 text-purple-300">
            <Mic className="w-5 h-5" />
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-purple-300 text-sm">{title} - Coming Soon</h4>
            <p className="text-gray-400 text-xs mt-1">
              Interactive voice transcription feature is currently in development and will be available soon.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}