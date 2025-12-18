
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Assessment } from "@/entities/Assessment";
import { ActionItem } from "@/entities/ActionItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  Shield, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Mail,
  ArrowRight,
  Database
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function TrialExpired() {
  const [user, setUser] = useState(null);
  const [dataSummary, setDataSummary] = useState({
    assessments: 0,
    actionItems: 0,
    loading: true
  });

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      // Fetch data summary to show user what they have
      const [assessments, actionItems] = await Promise.all([
        Assessment.filter({ company_id: userData.company_id }),
        ActionItem.filter({ company_id: userData.company_id })
      ]);

      setDataSummary({
        assessments: assessments.length,
        actionItems: actionItems.length,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setDataSummary(prev => ({ ...prev, loading: false }));
    }
  };

  const getTrialEndDate = () => {
    if (!user?.company_id) return null;
    // Assuming trial started when company was created
    // We'll need to fetch company data, but for now use a placeholder
    const trialStart = new Date(user.created_date);
    const trialEnd = new Date(trialStart.getTime() + 28 * 24 * 60 * 60 * 1000); // Changed from 14 to 28 days
    return trialEnd;
  };

  const trialEndDate = getTrialEndDate();

  return (
    <div className="min-h-screen cyber-gradient flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Main Trial Expired Message */}
        <Card className="glass-effect border-yellow-500/30 text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-yellow-300 mb-2">
              Trial Period Completed
            </CardTitle>
            <p className="text-gray-300 text-lg">
              Your 28-day free trial for <span className="text-cyan-300 font-semibold">{user?.company_name || 'your organization'}</span> has ended.
            </p>
            {trialEndDate && (
              <Badge className="mx-auto mt-3 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                <Calendar className="w-4 h-4 mr-2" />
                Trial ended on {trialEndDate.toLocaleDateString()}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-green-300 mb-2">
                <Database className="w-5 h-5" />
                <h3 className="font-semibold">Your Data is Safe & Secure</h3>
              </div>
              <p className="text-green-200 text-sm">
                All your assessments, action items, policies, and other data remain intact and secure. 
                Nothing has been deleted or lost during the trial expiration.
              </p>
            </div>

            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-cyan-300 mb-3 flex items-center justify-center">
                <Shield className="w-5 h-5 mr-2" />
                What You've Accomplished During Your Trial
              </h3>
              {dataSummary.loading ? (
                <div className="text-gray-400">Loading your data summary...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <FileText className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{dataSummary.assessments}</div>
                    <div className="text-sm text-gray-300">Security Assessments</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{dataSummary.actionItems}</div>
                    <div className="text-sm text-gray-300">Action Items Created</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-white">Ready to Continue Your Security Journey?</h3>
              <p className="text-gray-300 text-sm">
                To regain full access to Hubcys and continue improving your organization's security posture, 
                please subscribe to one of our plans.
              </p>
              
              {/* Contact Sales Button (since Stripe is disabled) */}
              <div className="flex flex-col space-y-3">
                <Button 
                  asChild
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-3"
                >
                  <Link to={createPageUrl('Pricing')}>
                    <ArrowRight className="w-5 h-5 mr-2" />
                    View Pricing Plans
                  </Link>
                </Button>
                
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => window.location.href = 'mailto:sales@hubcys.com?subject=Subscription Inquiry&body=Hello, I would like to discuss subscription options for my organization.'}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Sales Team
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700/50">
              <p className="text-xs text-gray-500">
                Questions about your subscription or need help? Contact us at{' '}
                <a href="mailto:support@hubcys.com" className="text-cyan-400 hover:text-cyan-300">
                  support@hubcys.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
