import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function TooltipInfo({ text, title = "More info", children }) {
  const [open, setOpen] = React.useState(false);

  return (
    <span className="inline-flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={title}
            className="ml-2 text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-cyan-500/50 text-white">
                  Click for details
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="bg-slate-900 border-slate-700 text-white max-w-sm rounded-lg shadow-lg z-[70]"
          align="start"
        >
          <div className="space-y-2 text-sm leading-relaxed">
            {children || text}
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}