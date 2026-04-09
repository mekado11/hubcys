
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PendingApproval() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Removed 'checking' state as the 'Check Status' button is removed
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed handleCheckStatus function
  // Removed contactAdminEmail function

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      console.log('Starting enhanced logout process from PendingApproval page...');
      
      // Step 1: Clear all local/session storage first
      try {
        sessionStorage.clear();
        localStorage.clear();
        console.log('Cleared all local storage');
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }

      // Step 2: Clear any Base44-specific storage or cookies
      try {
        // Clear any potential Base44 tokens or auth data
        const allCookies = document.cookie.split(';');
        allCookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          // Clear the cookie by setting it to expire in the past
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
        });
        console.log('Cleared cookies');
      } catch (cookieError) {
        console.warn('Error clearing cookies:', cookieError);
      }
      
      // Step 3: Try to logout via SDK with timeout
      const logoutPromise = User.logout();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 8000)
      );
      
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
        console.log('SDK logout successful');
      } catch (sdkError) {
        console.warn('SDK logout failed or timed out:', sdkError);
        // Continue with redirect even if SDK logout fails
      }
      
      // Step 4: Force redirect with additional delay to ensure cleanup
      console.log('Redirecting to landing page...');
      
      // Use replace to avoid back button issues
      window.location.replace(createPageUrl("LandingPage"));
      
      // Fallback redirect in case replace doesn't work
      setTimeout(() => {
        if (window.location.pathname !== createPageUrl("LandingPage")) {
          console.log('Fallback redirect executing...');
          window.location.href = createPageUrl("LandingPage");
        }
      }, 1000);
      
    } catch (error) {
      console.error('Complete logout process failed:', error);
      
      // Emergency fallback - force redirect to root
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (e) {
        console.warn('Emergency storage clear failed:', e);
      }
      
      // Force redirect to landing page as absolute fallback
      window.location.replace(createPageUrl("LandingPage"));
      
      // Ultimate fallback to root
      setTimeout(() => {
        window.location.replace('/');
      }, 2000);
    }
  };

  // Derive a safe display name:
  const getDisplayName = (u) => {
    if (!u) return null;
    const fromFields = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    if (fromFields) return fromFields;

    const fn = u.full_name;
    if (!fn) return null;

    // Heuristic: avoid showing email-like handles as names
    const looksLikeHandle = fn.includes('@') || (!/\s/.test(fn) && /[_\.\d]/.test(fn));
    return looksLikeHandle ? null : fn;
  };
  const displayName = getDisplayName(user);

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

  return (
    <div className="min-h-screen cyber-gradient flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="glass-effect border-yellow-500/30">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-yellow-300">
              Account Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to Hubcys!</h3>
              <p className="text-gray-300 mb-4">
                You've successfully joined <strong className="text-white">{user?.company_name || "your organisation"}</strong>.
                Your company administrator needs to approve your account before you can access the platform.
              </p>
              
              {user && (
                <div className="bg-slate-700/50 rounded-md p-4 text-left">
                  <h4 className="font-medium text-cyan-300 mb-2">Account Details:</h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    {displayName && (
                      <p><span className="font-medium">Name:</span> {displayName}</p>
                    )}
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    <p><span className="font-medium">Sign-up Date:</span> {new Date(user.created_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className="ml-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                        Pending Approval
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-white">What happens next?</h4>
              <div className="grid gap-4 text-left">
                {/* Step 1 */}
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Company Administrator Review</p>
                    <p className="text-gray-400 text-sm">
                      Your company administrator will review your request and approve your access.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Check back shortly</p>
                    <p className="text-gray-400 text-sm">
                      Contact your company administrator to let them know you've signed up. Once they approve you, log back in to access the platform.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Full Access</p>
                    <p className="text-gray-400 text-sm">
                      Start using all Hubcys features to enhance your cybersecurity posture once approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Remove Contact Administrator + Check Status block; keep short note */}
            <div className="border-t border-gray-700/50 pt-6">
              <p className="text-gray-400 text-sm mb-4">
                This process typically takes 1–24 hours. Thank you for your patience.
              </p>
            </div>

            <div className="border-t border-gray-700/50 pt-4">
              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
