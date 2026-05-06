import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import ParticleBackground from "./components/ui/ParticleBackground";
import AppErrorBoundary from "@/components/ui/AppErrorBoundary";
import NetworkStatusOverlay from "@/components/ui/NetworkStatusOverlay";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building,
  CheckCircle,
  ChevronDown,
  FileText,
  Gavel,
  LifeBuoy,
  LogOut,
  Menu,
  Plus,
  Settings,
  Target,
  TrendingUp,
  User as UserIcon,
  X,
  Globe,
  Mic,
  Clipboard,
  Users,
  Shield,
  DollarSign,
  ShieldAlert,
  Bot,
  Zap,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import DisclaimerDialog from "./components/assessment/DisclaimerDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IpInsightWidget from "./components/incident/IpInsightWidget";
import TlsInsightWidget from "./components/incident/TlsInsightWidget";
import TrialBanner from "./components/trial/TrialBanner";
import CookieConsentBanner from "./components/ui/CookieConsentBanner";
import AudioTranscriber from "./components/common/AudioTranscriber";
import NathanChat from "./components/chat/NathanChat";
import { canAccessPage, PUBLIC_PAGES } from "@/components/utils/subscriptionUtils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function NavLink({ to, icon: Icon, children, currentPath }) {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 
        ${isActive
          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-bold shadow-md cyber-glow-sm"
          : "text-gray-400 hover:bg-slate-700/50 hover:text-white font-medium"
        }`}
    >
      <Icon className="w-5 h-5 mr-4" />
      <span>{children}</span>
    </Link>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isUpdatingDisclaimer, setIsUpdatingDisclaimer] = useState(false);
  const [showIpLookup, setShowIpLookup] = useState(false);
  const [showVoiceTool, setShowVoiceTool] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(60);

  const redirectingRef = useRef(false);

  const inactivityTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const mainRef = useRef(null);

  const INACTIVITY_MINUTES = 30;
  const WARNING_SECONDS = 60;

  const clearAllSessionTimers = useCallback(() => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    inactivityTimeoutRef.current = null;
    warningTimeoutRef.current = null;
    countdownIntervalRef.current = null;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);
      setCurrentUser(null);
      clearAllSessionTimers();

      sessionStorage.removeItem('layout_onboarding_redirect');
      sessionStorage.removeItem('onboarding_redirected');
      sessionStorage.removeItem('login_redirected');

      const clearAutosaves = () => {
        try {
          for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const k = sessionStorage.key(i);
            if (k && (k.startsWith('autosave:') || k === 'onboardingTourCompleted')) {
              sessionStorage.removeItem(k);
            }
          }
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('autosave:') || k === 'onboardingTourCompleted')) {
              localStorage.removeItem(k);
            }
          }
        } catch (e) {
          console.warn('Failed clearing autosave entries:', e);
        }
      };
      clearAutosaves();

      await User.logout();
      window.location.replace(createPageUrl("LandingPage"));
    } catch (error) {
      console.error("Error logging out:", error);
      setCurrentUser(null);
      clearAllSessionTimers();
      
      sessionStorage.removeItem('layout_onboarding_redirect');
      sessionStorage.removeItem('onboarding_redirected');
      sessionStorage.removeItem('login_redirected');

      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && (k.startsWith('autosave:') || k === 'onboardingTourCompleted')) {
            sessionStorage.removeItem(k);
          }
        }
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('autosave:') || k === 'onboardingTourCompleted')) {
            localStorage.removeItem(k);
          }
        }
      } catch (e) {
        console.warn('Failed clearing autosave entries on logout error:', e);
      }

      window.location.replace(createPageUrl("LandingPage"));
    }
  }, [clearAllSessionTimers]);

  const showWarning = useCallback(() => {
    setSessionCountdown(WARNING_SECONDS);
    setShowSessionWarning(true);

    countdownIntervalRef.current = setInterval(() => {
      setSessionCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    warningTimeoutRef.current = setTimeout(async () => {
      setShowSessionWarning(false);
      clearAllSessionTimers();
      await handleLogout();
    }, WARNING_SECONDS * 1000);
  }, [setSessionCountdown, setShowSessionWarning, clearAllSessionTimers, handleLogout]);

  const scheduleInactivityTimers = useCallback(() => {
    clearAllSessionTimers();
    const msUntilWarning = INACTIVITY_MINUTES * 60 * 1000 - WARNING_SECONDS * 1000;
    inactivityTimeoutRef.current = setTimeout(showWarning, Math.max(0, msUntilWarning));
  }, [clearAllSessionTimers, showWarning]);

  const resetInactivity = useCallback(() => {
    setShowSessionWarning(false);
    setSessionCountdown(WARNING_SECONDS);
    scheduleInactivityTimers();
  }, [setShowSessionWarning, setSessionCountdown, scheduleInactivityTimers]);

  const handleUserActivity = useCallback(() => {
    if (!currentUser || currentUser.approval_status !== 'approved') return;
    resetInactivity();
  }, [currentUser, resetInactivity]);

  const fetchCurrentUser = useCallback(async () => {
    if (redirectingRef.current) {
      return;
    }
  
    try {
      setLoadError(null);
      
      // Simple fetch without complex retry logic for initial load
      const user = await User.me();

      if (!user.approval_status) {
        try {
          await User.updateMyUserData({ approval_status: 'pending' });
          user.approval_status = 'pending';
          console.log('Set approval_status to pending for new user');
        } catch (error) {
          console.error('Failed to set approval status:', error);
        }
      }

      setCurrentUser(user);
      setIsAuthenticated(true);

      // Super admin bypasses all gates
      if (user.is_super_admin) return;

      if (user.approval_status === 'pending') {
        if (currentPageName !== 'PendingApproval' && 
            currentPageName !== 'LandingPage' && 
            currentPageName !== 'PrivacyPolicy' && 
            currentPageName !== 'TermsOfService' &&
            currentPageName !== 'CompanyOnboarding'
        ) {
          console.log('User approval pending, redirecting to PendingApproval page');
          redirectingRef.current = true;
          setTimeout(() => {
            window.location.href = createPageUrl('PendingApproval');
          }, 100);
          return;
        }
      }

      if (user.approval_status === 'suspended' || user.approval_status === 'rejected') {
        if (currentPageName !== 'AccessDenied' && 
            currentPageName !== 'LandingPage' && 
            currentPageName !== 'PrivacyPolicy' && 
            currentPageName !== 'TermsOfService') {
          console.log('User access suspended/rejected, redirecting to AccessDenied page');
          redirectingRef.current = true;
          setTimeout(() => {
            window.location.href = createPageUrl('AccessDenied');
          }, 100);
          return;
        }
      }

      if (user.approval_status !== 'approved') {
        console.log(`User approval status is ${user.approval_status}, skipping approved-user-specific logic.`);
        return; 
      }

      if (!user.company_onboarding_completed && user.subscription_tier !== 'early_career') {
        if (currentPageName !== 'CompanyOnboarding') {
          redirectingRef.current = true;
          setTimeout(() => {
            window.location.href = createPageUrl('CompanyOnboarding');
          }, 100);
        }
        return;
      }

      if (!user.subscription_tier) {
        console.warn('Approved user missing subscription_tier. An administrator needs to set this.');
      }

      if (currentPageName !== 'LandingPage' && 
          currentPageName !== 'Pricing' && 
          currentPageName !== 'CompanyOnboarding' &&
          currentPageName !== 'TrialExpired' &&
          currentPageName !== 'PendingApproval' &&
          currentPageName !== 'AccessDenied' &&
          currentPageName !== 'PrivacyPolicy' &&
          currentPageName !== 'TermsOfService'
          ) {
        
        const trialStatus = checkTrialStatus(user);
        if (user.subscription_tier === 'free_trial' && trialStatus.expired) {
          console.log('Trial expired, redirecting to TrialExpired page');
          if (location.pathname !== createPageUrl('TrialExpired')) {
            redirectingRef.current = true;
            setTimeout(() => {
              window.location.href = createPageUrl('TrialExpired');
            }, 100);
          }
          return;
        }
      }
      
      sessionStorage.removeItem('layout_onboarding_redirect');
      sessionStorage.removeItem('onboarding_redirected');
      sessionStorage.removeItem('login_redirected');
      
      if (!user.disclaimer_acknowledged) {
        setShowDisclaimer(true);
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      const isNetworkError = errorMessage.includes('Network') || 
                            errorMessage.includes('network') ||
                            errorMessage.includes('fetch') ||
                            errorMessage.includes('Failed to fetch') ||
                            (error.name === 'TypeError' && errorMessage === 'Failed to fetch');
      
      const is401Error = error?.response?.status === 401 || 
                        errorMessage.includes('401') ||
                        errorMessage.includes('Unauthorized');
      
      console.error('Layout: Error loading user data:', errorMessage);
      
      if (isNetworkError) {
        setLoadError({
          type: 'network',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          canRetry: true
        });
      } else if (is401Error) {
        console.log('Layout: User not authenticated (401).');
        setIsAuthenticated(false);
        setCurrentUser(null);
        
        const isPublicPageCheck = PUBLIC_PAGES.includes(currentPageName);
        if (!isPublicPageCheck && !redirectingRef.current) {
          setLoadError({
            type: 'auth',
            message: 'Your session has expired. Please log in again.',
            canRetry: false
          });
        }
      } else {
        setLoadError({
          type: 'error',
          message: `Failed to load: ${errorMessage}`,
          canRetry: true
        });
      }
      
      setCurrentUser(null);
    } finally {
      if (!redirectingRef.current) {
        setLoading(false);
      }
    }
  }, [currentPageName, location.pathname]);

  useEffect(() => {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-8051YVVNDJ';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-8051YVVNDJ');
    `;
    document.head.appendChild(script2);

    return () => {
      if (document.head.contains(script1)) {
        document.head.removeChild(script1);
      }
      if (document.head.contains(script2)) {
        document.head.removeChild(script2);
      }
    };
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.approval_status !== 'approved') {
      clearAllSessionTimers();
      setShowSessionWarning(false);
      return;
    }

    scheduleInactivityTimers();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearAllSessionTimers();
    };
  }, [currentUser, handleUserActivity, scheduleInactivityTimers, clearAllSessionTimers]); 

  // Replace lingering brand mentions on specific pages without rewriting their content
  useEffect(() => {
    if (!mainRef.current) return;
    const pagesNeedingReplace = ['PrivacyPolicy', 'TermsOfService', 'PricingAndFeatures', 'Assessment'];
    if (!pagesNeedingReplace.includes(currentPageName)) return;

    const root = mainRef.current;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const val = node.nodeValue;
      if (val && val.toLowerCase().includes('fortigap')) {
        // Avoid RegExp lastIndex issues by creating a fresh regex per replace
        node.nodeValue = val.replace(/fortigap/gi, 'Hubcys');
      }
    }
  }, [currentPageName]);

  const checkTrialStatus = (user) => {
    if (!user || !user.created_date) return { expired: false, daysRemaining: 28, isPaid: false };
    
    if (user.subscription_tier === 'starter' || 
        user.subscription_tier === 'growth' || 
        user.subscription_tier === 'pro' || 
        user.subscription_tier === 'enterprise' ||
        user.subscription_tier === 'early_career') {
      return { expired: false, daysRemaining: Infinity, isPaid: true };
    }
    
    const trialStartDate = new Date(user.created_date);
    const currentDate = new Date();
    const trialDurationMs = 28 * 24 * 60 * 60 * 1000;
    const trialEndDate = new Date(trialStartDate.getTime() + trialDurationMs);
    
    const msRemaining = trialEndDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
    
    return {
      expired: msRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
      trialEndDate: trialEndDate,
      isPaid: false
    };
  };

  const handleAgreeToDisclaimer = async () => {
    setIsUpdatingDisclaimer(true);
    try {
      await User.updateMyUserData({ disclaimer_acknowledged: true });
      setCurrentUser(prev => ({ ...prev, disclaimer_acknowledged: true }));
      setShowDisclaimer(false);
    } catch (error) {
      console.error("Error acknowledging disclaimer:", error);
      alert("Could not save your acknowledgement. Please try again.");
    } finally {
      setIsUpdatingDisclaimer(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navItems = [
    { href: "Dashboard", icon: BarChart3, label: "Dashboard" },
    { href: "Assessment", icon: Target, label: "Assessment" },
    { href: "BIA", icon: BarChart3, label: "BIA" },
    { href: "ResponseReadiness", icon: Shield, label: "Command Center" },
    { href: "IOCAnalyzer", icon: Bot, label: "IOC Analyzer" },
    { href: "PolicyLibrary", icon: Gavel, label: "Policies" },
    { href: "SecurityTraining", icon: BookOpen, label: "Training" },
    { href: "ActionItems", icon: CheckCircle, label: "Tasks" },
    { href: "Reports", icon: FileText, label: "Reports" },
    { href: "EducationalResources", icon: LifeBuoy, label: "Resources" },
    { href: "Pricing", icon: DollarSign, label: "Pricing" }
  ];

  const adminNavItems = [
    { href: "CompanyManagement", icon: Building, label: "Company" },
    { href: "UserManagement", icon: Users, label: "User Management" },
    { href: "SystemHealth", icon: Activity, label: "System Health" },
    { href: "AdminThreats", icon: ShieldAlert, label: "Threats & Regs" }
  ];

  const groupedNav = [
    {
      id: "overview",
      label: "Overview",
      defaultOpen: true,
      items: [
        { href: "Dashboard", icon: BarChart3, label: "Dashboard" }
      ]
    },
    {
      id: "assessments",
      label: "Security Assessments",
      defaultOpen: true,
      items: [
        { href: "Assessment", icon: Target, label: "Assessments" },
        { href: "BIA", icon: BarChart3, label: "Business Impact (BIA)" },
        { href: "EtsiAssessmentsList", icon: Zap, label: "IoT Assessments (ETSI)" },
        { href: "Reports", icon: FileText, label: "Reports" }
      ]
    },
    {
      id: "incident",
      label: "Threat & Incident Management",
      defaultOpen: true,
      items: [
        { href: "ResponseReadiness", icon: Shield, label: "Command Center" },
        { href: "IOCAnalyzer", icon: Bot, label: "IOC Analyzer" },
        { href: "ActionItems", icon: CheckCircle, label: "Tasks" }
      ]
    },
    {
      id: "grc",
      label: "GRC & Learning",
      defaultOpen: false,
      items: [
        { href: "PolicyLibrary", icon: Gavel, label: "Policy Library" },
        { href: "SecurityTraining", icon: BookOpen, label: "Security Training" },
        { href: "EducationalResources", icon: LifeBuoy, label: "Educational Resources" }
      ]
    }
  ];
  const defaultOpenGroups = groupedNav.filter(g => g.defaultOpen).map(g => g.id);

  const showSidebar = !PUBLIC_PAGES.includes(currentPageName);

  const isPublicPage = PUBLIC_PAGES.includes(currentPageName);
  const isApproved = currentUser?.approval_status === 'approved';
  const isSuperAdmin = !!currentUser?.is_super_admin;
  const canRender = (!loading || loadError) && (
    isPublicPage || isSuperAdmin || (isApproved && canAccessPage(currentUser?.subscription_tier, currentPageName, currentUser))
  );

  // Show loading error with retry option
  if (loadError && !isPublicPage && !redirectingRef.current) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center p-4">
        <Card className="glass-effect border-red-500/30 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-900/20 border-red-500/30">
              <AlertDescription className="text-red-200">
                {loadError.message}
              </AlertDescription>
            </Alert>

            {loadError.type === 'network' && (
              <div className="text-sm text-gray-300 space-y-2">
                <p>This could be due to:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Temporary network connectivity issues</li>
                  <li>Server maintenance</li>
                  <li>Firewall or VPN blocking connections</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {loadError.canRetry && (
                <Button 
                  onClick={() => {
                    setLoadError(null);
                    setLoading(true);
                    fetchCurrentUser();
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Connection
                </Button>
              )}
              
              {loadError.type === 'auth' && (
                <Button 
                  onClick={() => window.location.href = '/Login'}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Log In Again
                </Button>
              )}

              <Button 
                variant="outline"
                onClick={() => window.location.href = createPageUrl('LandingPage')}
                className="w-full border-gray-600 text-gray-300"
              >
                Go to Home Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {currentUser && showDisclaimer && (
        <DisclaimerDialog
          isOpen={true}
          onAgree={handleAgreeToDisclaimer}
          isLoading={isUpdatingDisclaimer}
        />
      )}

      {currentUser && (
        <Dialog open={showSessionWarning} onOpenChange={(open) => { 
          if (!open) resetInactivity(); 
        }}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Are you still there?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-gray-300">
                You’ve been inactive for a while. For your security, you will be signed out in {sessionCountdown}s.
              </p>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={async () => {
                    setShowSessionWarning(false);
                    clearAllSessionTimers();
                    await handleLogout();
                  }}
                >
                  Sign out now
                </Button>
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={resetInactivity}
                >
                  Stay logged in
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {sidebarOpen && showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {showSidebar && (
        <nav className={`fixed left-0 top-0 h-full w-64 glass-effect flex-col p-4 z-50 overflow-y-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 flex' : '-translate-x-full lg:translate-x-0 lg:flex'}`}>
          <button
            onClick={closeSidebar}
            className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <Link to={createPageUrl("LandingPage")} className="flex items-center space-x-3 px-2 mb-10">
            <div className="relative">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686c4c7cddeaa31e94f721d6/3e69b2e7d_Hubcys.png"
                alt="Hubcys Logo"
                className="w-10 h-10 object-contain"
              />
              <div className="absolute -inset-1.5 bg-cyan-500/20 rounded-full blur-md"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold cyber-text-glow">Hubcys</h1>
            </div>
          </Link>

          <div className="flex-grow overflow-y-auto">
            <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full">
              {groupedNav.map((group) => (
                <AccordionItem key={group.id} value={group.id} className="border-b border-slate-700/40">
                  <AccordionTrigger className="text-left text-gray-300 hover:text-white py-2 data-[state=open]:text-white">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 opacity-70 transition-transform duration-200 data-[state=open]:rotate-180" />
                      <span className="font-medium">{group.label}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <div key={item.href} onClick={closeSidebar}>
                          <NavLink
                            to={createPageUrl(item.href)}
                            icon={item.icon}
                            currentPath={location.pathname}
                          >
                            {item.label}
                          </NavLink>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}

              {(currentUser?.company_role === 'admin' || currentUser?.is_super_admin) && (
                <AccordionItem value="admin" className="border-b border-slate-700/40">
                  <AccordionTrigger className="text-left text-gray-300 hover:text-white py-2 data-[state=open]:text-white">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 opacity-70 transition-transform duration-200 data-[state=open]:rotate-180" />
                      <span className="font-medium">Administration</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="space-y-1">
                      {adminNavItems.map((item) => (
                        <div key={item.href} onClick={closeSidebar}>
                          <NavLink
                            to={createPageUrl(item.href)}
                            icon={item.icon}
                            currentPath={location.pathname}
                          >
                            {item.label}
                          </NavLink>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            <div className="mt-2">
              <div onClick={closeSidebar}>
                <NavLink
                  to={createPageUrl("Pricing")}
                  icon={DollarSign}
                  currentPath={location.pathname}
                >
                  Pricing
                </NavLink>
              </div>
            </div>
          </div>

          <div className="my-4 space-y-2">
              <Link to={createPageUrl("Assessment?new=true")} className="block" onClick={closeSidebar}>
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all duration-300">
                      <Plus className="w-4 h-4 mr-2" />
                      New Assessment
                  </Button>
              </Link>
              {currentUser && !currentUser.is_super_admin && currentUser.subscription_tier !== 'enterprise' && (
                <Link to={createPageUrl("Pricing")} className="block" onClick={closeSidebar}>
                  <Button variant="outline" className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all duration-300">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
              )}
          </div>

          {!loading && currentUser && (
            <div className="mt-auto">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start items-center text-left p-3 h-auto">
                     <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mr-3">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{currentUser.full_name || currentUser.email}</p>
                        <Badge variant="secondary" className="capitalize bg-purple-500/20 text-purple-300 border-none px-2 py-0.5 text-xs mt-1">
                          {currentUser.subscription_tier?.replace('_', ' ') || 'User'}
                        </Badge>
                     </div>
                     <Settings className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-800 border-gray-700 text-white" side="top">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onSelect={handleLogout} className="cursor:pointer focus:bg-red-500/20 focus:text-red-300">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </nav>
      )}

      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 border border-cyan-500/30 rounded-lg p-2 print:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="w-5 h-5 text-cyan-400" />
      </button>

      <div className={`flex-1 flex flex-col ${showSidebar ? 'lg:ml-64' : ''} min-h-screen`}>
        <ParticleBackground />
        <AppErrorBoundary>
          {!loading && currentUser && showSidebar && (
            (() => {
              const trialStatus = checkTrialStatus(currentUser);
              
              if (!trialStatus.isPaid && !trialStatus.expired && trialStatus.daysRemaining <= 5) {
                return (
                  <div className="ml-4 mr-4 mt-4">
                    <TrialBanner 
                      daysRemaining={trialStatus.daysRemaining}
                      isWarning={trialStatus.daysRemaining <= 3}
                    />
                  </div>
                );
              }
              return null;
            })()
          )}

          <main ref={mainRef} className={`flex-1 relative z-10 px-4 sm:px-6 lg:px-8 ${showSidebar ? 'pt-16 lg:pt-0' : ''}`}>
            {canRender ? (
              children
            ) : (!loading && isApproved && !isPublicPage) ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-slate-800/60 border border-purple-500/30 rounded-xl p-6 text-center max-w-md">
                  <h3 className="text-xl font-semibold text-white mb-2">Upgrade Required</h3>
                  <p className="text-gray-300 mb-4">
                    Your current plan does not include access to this page.
                  </p>
                  <a href={createPageUrl('Pricing')}>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      View Plans
                    </Button>
                  </a>
                </div>
              </div>
            ) : null}

            {(currentPageName === 'IncidentDetail' || currentPageName === 'TabletopExerciseDetail') && (
              <>
                <button
                  onClick={() => setShowVoiceTool(true)}
                  className="fixed bottom-40 right-6 z-40 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 print:hidden"
                  title="Speech to Text"
                >
                  <Mic className="w-4 h-4" />
                  Voice Notes
                </button>

                <Dialog open={showVoiceTool} onOpenChange={setShowVoiceTool}>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Voice Notes (Speech to Text)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-300">
                        Record or upload audio, transcribe it, then copy and paste into incident notes or fields.
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <AudioTranscriber 
                            onTextReady={(txt) => setVoiceTranscript((prev) => (prev ? prev + "\n" + txt : txt))}
                            defaultLanguage="en-US"
                            maxMinutes={5}
                            showCostNotice={true}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Transcribed Text</label>
                          <textarea
                            value={voiceTranscript}
                            onChange={(e) => setVoiceTranscript(e.target.value)}
                            className="w-full min-h-[160px] rounded-md bg-slate-800 border border-slate-700 p-3 text-white"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              onClick={async () => {
                                await navigator.clipboard.writeText(voiceTranscript || "");
                              }}
                              className="border-cyan-500/30 text-cyan-300"
                            >
                              <Clipboard className="w-4 h-4 mr-2" />
                              Copy to clipboard
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setVoiceTranscript("")}
                              className="text-gray-400"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {currentPageName === 'IncidentDetail' && (
              <>
                <button
                  onClick={() => setShowIpLookup(true)}
                  className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 print:hidden"
                  title="Network Intelligence"
                >
                  <Globe className="w-4 h-4" />
                  Network Intelligence
                </button>

                <Dialog open={showIpLookup} onOpenChange={setShowIpLookup}>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Network Intelligence</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="ip" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="ip">IP Intelligence</TabsTrigger>
                        <TabsTrigger value="tls">TLS Certificate</TabsTrigger>
                      </TabsList>
                      <TabsContent value="ip">
                        <IpInsightWidget />
                      </TabsContent>
                      <TabsContent value="tls">
                        <TlsInsightWidget />
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </main>

          {showSidebar && (
            <footer className="border-t border-cyan-500/20 mt-auto relative z-10 ml-4 mr-4 print:hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="text-center text-gray-400">
                  <p>© {new Date().getFullYear()} Hubcys. Empowering CISOs with intelligent security assessments.</p>
                </div>
              </div>
            </footer>
          )}
        </AppErrorBoundary>
      </div>

      <CookieConsentBanner />
      <NetworkStatusOverlay />
      
      {currentUser && (
        <NathanChat />
      )}
    </div>
  );
}