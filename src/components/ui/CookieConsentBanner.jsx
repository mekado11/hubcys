import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has already given consent
    const hasConsented = localStorage.getItem('cookieConsent');
    if (!hasConsented) {
      // Small delay to avoid flash during page load
      setTimeout(() => {
        setIsVisible(true);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
  };

  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 print:hidden">
      <Card className="max-w-6xl mx-auto bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 shadow-2xl">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon and content */}
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-2">We use cookies to enhance your experience</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Hubcys uses essential cookies to ensure the platform works properly and analytics cookies to help us improve our services. 
                  Your data is processed securely and never shared with third parties.
                </p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  <Link 
                    to={createPageUrl('PrivacyPolicy')} 
                    className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                  >
                    Privacy Policy <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link 
                    to={createPageUrl('TermsOfService')} 
                    className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                  >
                    Terms of Service <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleDecline}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-xs"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}