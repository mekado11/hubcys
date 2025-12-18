import React from 'react';
import { Loader2, Sparkles, Brain, Zap } from 'lucide-react';

export default function GeneratingAnimation({ message = "Generating...", subMessage = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500"></div>
        </div>
        
        {/* Inner counter-rotating ring */}
        <div className="absolute inset-2 animate-spin-reverse">
          <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-cyan-500 border-l-blue-500"></div>
        </div>
        
        {/* Center icon */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse"></div>
          <Sparkles className="w-10 h-10 text-white animate-pulse relative z-10" />
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-3">
        <h3 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
          <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
          {message}
        </h3>
        
        {subMessage && (
          <p className="text-gray-400 text-sm max-w-md mx-auto">{subMessage}</p>
        )}
        
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500">
          <div className="flex items-center gap-2 animate-pulse">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Analyzing context</span>
          </div>
          <div className="flex items-center gap-2 animate-pulse" style={{animationDelay: '0.2s'}}>
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Generating insights</span>
          </div>
          <div className="flex items-center gap-2 animate-pulse" style={{animationDelay: '0.4s'}}>
            <Brain className="w-4 h-4 text-pink-400" />
            <span>Applying expertise</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 2s linear infinite;
        }
      `}</style>
    </div>
  );
}