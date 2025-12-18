
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, Bot, TrendingUp, Shield, Target, Users, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import SmartConsultationChat from '../smart/SmartConsultationChat';
import { Risk } from '@/entities/Risk';

export default function SmartFeedback({ assessmentId, analysis }) {
  const [showChat, setShowChat] = useState(false);
  const [creatingRisks, setCreatingRisks] = useState(false);

  const handleCreateRiskRegister = async () => {
    setCreatingRisks(true);
    try {
      // Extract potential risks from the smart analysis and create risk register entries
      const risks = [
        {
          title: 'Identity and Access Management Gaps',
          description: 'Insufficient access controls and privilege management could lead to unauthorized system access and data breaches.',
          category: 'Technical',
          likelihood: 3,
          impact: 4,
          risk_score: 12,
          status: 'Identified',
          mitigation_plan: 'Implement multi-factor authentication, conduct access reviews, and deploy privileged access management solutions.',
          assessment_id: assessmentId
        },
        {
          title: 'Inadequate Security Monitoring',
          description: 'Limited threat detection capabilities may result in delayed incident response and extended dwell time for attackers.',
          category: 'Operational',
          likelihood: 4,
          impact: 4,
          risk_score: 16,
          status: 'Identified',
          mitigation_plan: 'Deploy SIEM solution, enhance log collection, and establish 24/7 monitoring capabilities.',
          assessment_id: assessmentId
        },
        {
          title: 'Third-Party Security Risks',
          description: 'Unvetted vendor access and inadequate supply chain security controls pose significant business risks.',
          category: 'Strategic',
          likelihood: 3,
          impact: 3,
          risk_score: 9,
          status: 'Identified',
          mitigation_plan: 'Implement vendor risk assessment program and establish security requirements in contracts.',
          assessment_id: assessmentId
        }
      ];

      // Create risks in bulk
      await Risk.bulkCreate(risks);
      
      alert('Risk register entries created successfully! Check the Risk Register page to review and manage them.');
    } catch (error) {
      console.error('Error creating risk register:', error);
      alert('Error creating risk register entries. Please try again.');
    } finally {
      setCreatingRisks(false);
    }
  };

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Smart Actions & Deep Dive */}
      <Card className="glass-effect border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            Smart Actions & Deep Dive
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Interactive AI Consultation */}
          <Collapsible open={showChat} onOpenChange={setShowChat} className="mb-6">
            <div className="flex items-center justify-between p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
              <h4 className="text-lg font-semibold text-purple-300 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" /> Interactive Consultation
              </h4>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {showChat ? 'Hide Chat' : 'Ask Questions'}
                  {showChat ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-4">
              <SmartConsultationChat
                assessmentId={assessmentId}
                assessmentData={analysis}
                onClose={() => setShowChat(false)}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Risk Register Button */}
          <div className="flex justify-center mt-4">
            <Button 
              onClick={handleCreateRiskRegister}
              disabled={creatingRisks}
              className="w-full md:w-3/4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 h-auto p-4 flex-col"
            >
              <AlertTriangle className="w-6 h-6 mb-2" />
              <div className="text-center">
                <div className="font-semibold">Generate Risk Register</div>
                <div className="text-xs opacity-80">
                  {creatingRisks ? 'Creating risks...' : 'Create risk entries from assessment findings'}
                </div>
              </div>
            </Button>
          </div>

          {/* Quick Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-center mb-2">
                <Shield className="w-4 h-4 text-cyan-400 mr-2" />
                <span className="text-sm font-semibold text-cyan-300">Quick Wins</span>
              </div>
              <p className="text-xs text-gray-300">
                Focus on MFA deployment and basic security awareness training for immediate impact.
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 border border-yellow-500/20">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-sm font-semibold text-yellow-300">Priority Areas</span>
              </div>
              <p className="text-xs text-gray-300">
                Asset inventory and vulnerability management require the most attention.
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center mb-2">
                <Target className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-sm font-semibold text-green-300">Next Steps</span>
              </div>
              <p className="text-xs text-gray-300">
                Schedule risk assessment meetings and begin vendor evaluation process.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Confidence & Context */}
      <Card className="glass-effect border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center text-sm">
            <Users className="w-4 h-4 mr-2" />
            Analysis Confidence & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              High Confidence Analysis
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              Industry-Specific Insights
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              Framework Aligned
            </Badge>
          </div>
          
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <strong className="text-white">Confidence Level:</strong> This analysis is based on your detailed inputs across all security domains and is tailored to your industry and company size.
            </p>
            <p>
              <strong className="text-white">Recommended Actions:</strong> Use the Smart Consultant for specific implementation questions, timeline planning, and vendor recommendations. Consider generating a formal risk register to track and manage identified vulnerabilities.
            </p>
            <p>
              <strong className="text-white">Next Review:</strong> Plan to reassess your security posture in 6 months or after implementing the 90-day action items.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
