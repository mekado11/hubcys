import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Company } from '@/entities/Company';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Mail, LogOut, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AccessDenied() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null); // company state is still fetched but not used in display due to Hubcys contact change
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndCompany();
  }, []);

  const fetchUserAndCompany = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      if (userData.company_id) {
        try {
          const companyData = await Company.get(userData.company_id);
          setCompany(companyData);
        } catch (error) {
          console.error('Error fetching company:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clear all local/session storage first
      try {
        sessionStorage.clear();
        localStorage.clear();
        console.log('Cleared local storage');
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }
      
      // Try to logout via SDK with timeout
      const logoutPromise = User.logout();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );
      
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
        console.log('SDK logout successful');
      } catch (sdkError) {
        console.warn('SDK logout failed or timed out:', sdkError);
        // Continue with redirect even if SDK logout fails
      }
      
      // Force redirect with a slight delay to ensure cleanup
      setTimeout(() => {
        console.log('Redirecting to landing page...');
        window.location.replace(createPageUrl("LandingPage"));
      }, 100);
      
    } catch (error) {
      console.error('Complete logout process failed:', error);
      
      // Emergency fallback - force redirect to root
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (e) {
        console.warn('Emergency storage clear failed:', e);
      }
      
      // Force redirect to root path as absolute fallback
      window.location.replace('/');
    }
  };

  const contactHubcys = () => {
    // Strip CR/LF from user-controlled fields to prevent email header injection
    const sanitise = (s) => String(s || '').replace(/[\r\n]/g, ' ').trim();
    const subject = encodeURIComponent('Account Access Appeal - Hubcys');
    const body = encodeURIComponent(`Hello Hubcys Team,

I believe my Hubcys account status may need review.

User Details:
- Name: ${sanitise(user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Not provided')}
- Email: ${sanitise(user?.email)}
- Company: ${sanitise(user?.company_name || 'Not provided')}
- Decision Date: ${user?.approved_date ? new Date(user.approved_date).toLocaleDateString() : 'Unknown'}
- Current Status: ${sanitise(user?.approval_status || 'Unknown')}
- Reason Provided: ${sanitise(user?.rejection_reason || 'Not specified')}

Please let me know if any additional information is required.

Thank you,
${sanitise(user?.full_name || 'User')}`);
    window.location.href = `mailto:sales@hubcys.com?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const isSuspended = user?.approval_status === 'suspended';
  const titleText = isSuspended ? 'Access Suspended' : 'Access Denied';
  const reasonLabel = isSuspended ? 'Reason for Suspension:' : 'Reason for Denial:';

  return (
    <div className="min-h-screen cyber-gradient flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="glass-effect border-red-500/30">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-400">{titleText}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <p className="text-gray-300 text-lg">
                {isSuspended
                  ? 'Your account has been suspended.'
                  : 'Your account access has been reviewed and unfortunately has been denied.'}
              </p>
              
              {user?.rejection_reason && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                    <span className="font-semibold text-red-300">{reasonLabel}</span>
                  </div>
                  <p className="text-gray-300 text-left">{user.rejection_reason}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-gray-400">
                  If you believe this decision was made in error, please contact Hubcys for further review.
                </p>
                
                {user?.approved_date && (
                  <p className="text-sm text-gray-500">
                    Decision made on: {new Date(user.approved_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                onClick={contactHubcys}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Hubcys
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                Your request was reviewed by the administrator of Hubcys.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}