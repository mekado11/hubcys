
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function ContextualSidebar({ currentStep }) {
  // This component is now only shown on step 1 and is static.
  if (currentStep !== 1) {
    return null;
  }

  return (
    <div className="luxury-sidebar-container h-full flex flex-col">
      <Card className="luxury-sidebar glass-effect border-purple-500/30 flex-grow flex flex-col overflow-hidden">
        <div className="luxury-bg-pattern"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-purple-300 flex items-center luxury-title">
            <div className="luxury-icon-wrapper">
              <Info className="w-5 h-5 floating-icon" />
            </div>
            <span className="luxury-gradient-text">Hubcys Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 relative z-10 flex-grow overflow-y-auto custom-scrollbar">
          <div className="luxury-content-block">
            <h4 className="font-semibold text-white mb-3 luxury-subtitle">Why This Information Matters</h4>
            <p className="text-sm text-gray-300 leading-relaxed luxury-description">
              Providing details about your company's industry, size, and business focus allows our AI to generate a highly tailored and relevant gap analysis. This context is crucial for identifying industry-specific risks (e.g., HIPAA for Healthcare, PCI DSS for Retail) and recommending appropriate, realistic security controls.
            </p>
          </div>
        </CardContent>
      </Card>

      <style>{`
        .luxury-sidebar-container {
          height: 100%;
          position: relative;
        }

        .luxury-sidebar {
          position: relative;
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .luxury-sidebar:hover {
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(139, 92, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .luxury-bg-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.02) 0%, transparent 50%);
          animation: luxury-pattern-float 20s ease-in-out infinite;
        }

        @keyframes luxury-pattern-float {
          0%, 100% { 
            background-position: 0% 0%, 100% 0%, 50% 100%; 
          }
          50% { 
            background-position: 100% 100%, 0% 100%, 0% 0%; 
          }
        }

        .luxury-title {
          position: relative;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .luxury-gradient-text {
          background: linear-gradient(135deg, #8B5CF6, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: luxury-gradient-shift 3s ease-in-out infinite alternate;
        }

        @keyframes luxury-gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .luxury-icon-wrapper {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          animation: luxury-icon-pulse 2s ease-in-out infinite alternate;
        }

        @keyframes luxury-icon-pulse {
          0% { 
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            transform: scale(1);
          }
          100% { 
            box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3);
            transform: scale(1.05);
          }
        }

        .luxury-content-block {
          padding: 1rem;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(75, 85, 99, 0.3);
          transition: all 0.3s ease;
        }

        .luxury-content-block:hover {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(139, 92, 246, 0.2);
        }

        .luxury-subtitle {
          color: #E5E7EB;
          font-size: 0.95rem;
          letter-spacing: 0.025em;
        }

        .luxury-description {
          color: #D1D5DB;
          line-height: 1.6;
          font-size: 0.875rem;
        }

        .floating-icon {
          animation: luxury-float 3s ease-in-out infinite;
        }

        @keyframes luxury-float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-3px) rotate(2deg); 
          }
        }

        /* Custom scrollbar for luxury feel */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); /* Darker background */
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(139, 92, 246, 0.6); /* Purple thumb */
          border-radius: 10px;
          border: 2px solid rgba(15, 23, 42, 0.5); /* Border to match track */
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(139, 92, 246, 0.8); /* Lighter on hover */
        }
      `}</style>
    </div>
  );
}
