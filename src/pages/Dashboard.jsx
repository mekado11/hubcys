import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Assessment } from "@/entities/Assessment";
import { ActionItem } from "@/entities/ActionItem";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Target, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  Loader2,
  RefreshCw,
  AlertTriangle,
  FileText,
  Activity,
  Users
} from "lucide-react";
import OnboardingTour from "../components/ui/OnboardingTour";
import CisaKevFeed from "@/components/dashboard/CisaKevFeed";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [recentActionItems, setRecentActionItems] = useState([]);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalAssessments: 0,
    completedAssessments: 0,
    pendingActionItems: 0,
    averageScore: 0
  });

  const checkTrialStatus = useCallback((user) => {
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
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);
      setIsAuthenticated(true);

      const hasShownTour = sessionStorage.getItem('onboardingTourCompleted');
      if (!hasShownTour && !user.onboarding_completed) {
        setShowOnboardingTour(true);
      }

      // Two queries instead of four: reuse the full result set for both the
      // recent lists and the aggregate stats.
      const [allAssessments, allActionItems] = await Promise.all([
        Assessment.filter({ company_id: user.company_id }, '-created_date', 500).catch(() => []),
        ActionItem.filter({ company_id: user.company_id }, '-created_date', 500).catch(() => []),
      ]);

      setAssessments(allAssessments.slice(0, 5));
      setRecentActionItems(allActionItems.slice(0, 5));

      const completedAssessments = allAssessments.filter(a => a.status === 'completed');
      const pendingActionItems = allActionItems.filter(a => a.status !== 'completed');
      const avgScore = completedAssessments.length > 0
        ? completedAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completedAssessments.length
        : 0;

      setDashboardStats({
        totalAssessments: allAssessments.length,
        completedAssessments: completedAssessments.length,
        pendingActionItems: pendingActionItems.length,
        averageScore: Math.round(avgScore),
      });
    } catch (error) {
      console.error('Dashboard: Error loading user data:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleTourComplete = async () => {
    try {
      setShowOnboardingTour(false);
      sessionStorage.setItem('onboardingTourCompleted', 'true');
      
      if (currentUser) {
        await User.updateMyUserData({ onboarding_completed: true });
      }
    } catch (error) {
      console.error('Error completing tour:', error);
      alert('Unable to save onboarding completion. The tour will show again on next visit.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard...</h2>
          <p className="text-gray-400">Setting up your security workspace</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-red-500/30 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You must be logged in to view the dashboard. If you've just logged in, there might be an issue loading your data.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-cyan-500 to-purple-500">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button onClick={() => User.loginWithRedirect(window.location.href)} variant="outline" className="hover:bg-gray-800">
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      {/* Onboarding Tour */}
      {showOnboardingTour && (
        <OnboardingTour 
          isOpen={showOnboardingTour}
          onClose={handleTourComplete}
          onComplete={handleTourComplete}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 card-entrance">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold cyber-text-glow mb-2 sm:mb-4">
            Welcome to {currentUser?.company_name ? 
              `${currentUser.company_name}'s` : 'your organization\'s'
            } cybersecurity command center
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300">
            Monitor your security posture, track assessments, and manage action items from your central dashboard.
          </p>
        </div>

        {/* Welcome Card */}
        <div className="mb-6 sm:mb-8 card-entrance stagger-1">
          <Card className="glass-effect border-cyan-500/30">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-cyan-300 flex items-center text-lg sm:text-xl">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Getting Started with Hubcys
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Your security assessment platform is ready. Start by conducting your first security assessment 
                to establish a baseline and generate actionable improvements.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={createPageUrl("Assessment?new=true&tab=pci-scoping")} className="flex-1 sm:flex-none">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    <Target className="w-4 h-4 mr-2" />
                    Start Security Assessment
                  </Button>
                </Link>
                <Link to={createPageUrl("ActionItems")} className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    View Action Items
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="card-entrance stagger-2">
            <Card className="glass-effect border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Assessments</CardTitle>
                <Target className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{dashboardStats.totalAssessments}</div>
                <p className="text-xs text-gray-400">Created so far</p>
              </CardContent>
            </Card>
          </div>

          <div className="card-entrance stagger-3">
            <Card className="glass-effect border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Pending Actions</CardTitle>
                <CheckCircle className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{dashboardStats.pendingActionItems}</div>
                <p className="text-xs text-gray-400">Items to address</p>
              </CardContent>
            </Card>
          </div>

          <div className="card-entrance stagger-4">
            <Card className="glass-effect border-red-500/20 hover:border-red-500/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Incidents</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">—</div>
                <p className="text-xs text-gray-400">Track security incidents</p>
              </CardContent>
            </Card>
          </div>

          <div className="card-entrance stagger-5">
            <Card className="glass-effect border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Avg. Security Score</CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{dashboardStats.averageScore}</div>
                <p className="text-xs text-gray-400">Across completed assessments</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card-entrance stagger-6">
            <Card className="glass-effect border-purple-500/20 hover:border-purple-500/40 transition-colors group cursor-pointer">
              <Link to={createPageUrl("Assessment?new=true&tab=pci-scoping")}>
                <CardHeader>
                  <CardTitle className="text-purple-300 flex items-center group-hover:text-purple-200 transition-colors">
                    <Target className="w-5 h-5 mr-3" />
                    Security Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4">
                    Evaluate your organization's security posture across 10+ domains including identity, 
                    infrastructure, and governance.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      30-45 minutes
                    </Badge>
                    <div className="text-purple-400 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          <div className="card-entrance stagger-7">
            <Card className="glass-effect border-green-500/20 hover:border-green-500/40 transition-colors group cursor-pointer">
              <Link to={createPageUrl("ActionItems")}>
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center group-hover:text-green-200 transition-colors">
                    <CheckCircle className="w-5 h-5 mr-3" />
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4">
                    Track and manage security improvements with prioritized action items 
                    generated from your assessments.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Task Management
                    </Badge>
                    <div className="text-green-400 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          <div className="card-entrance stagger-8">
            <Card className="glass-effect border-red-500/20 hover:border-red-500/40 transition-colors group cursor-pointer">
              <Link to={createPageUrl("ResponseReadiness")}>
                <CardHeader>
                  <CardTitle className="text-red-300 flex items-center group-hover:text-red-200 transition-colors">
                    <Activity className="w-5 h-5 mr-3" />
                    Command Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4">
                    Manage security incidents and conduct tabletop exercises to improve 
                    your incident response capabilities.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                      Incident Response
                    </Badge>
                    <div className="text-red-400 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="card-entrance stagger-9">
          <Card className="glass-effect border-gray-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-3" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white text-sm">Security Assessments</h4>
                    <p className="text-gray-400 text-xs">Comprehensive security posture evaluations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white text-sm">Compliance Reports</h4>
                    <p className="text-gray-400 text-xs">Generate professional compliance reports</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white text-sm">Team Collaboration</h4>
                    <p className="text-gray-400 text-xs">Assign tasks and track progress</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CISA KEV Feed */}
        <div className="mt-6">
          <h2 className="text-white text-xl font-semibold mb-3">Security News & Advisories</h2>
          <CisaKevFeed />
        </div>
      </div>
    </div>
  );
}