
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Clock,
  Shield,
  Users,
  Activity,
  CheckCircle,
  Target,
  FileText,
  ArrowLeft, // Added for back button
  Printer // Added for print button
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SampleIncidentReport() {
  // Hardcoded sample incident data
  const sampleIncident = {
    incident_id: 'INC-2024-007',
    title: 'Sophisticated Phishing Campaign Targeting Executive Team',
    description: 'A coordinated spear-phishing campaign targeting C-level executives with personalized emails containing malicious attachments. The attack bypassed initial email security controls and resulted in credential compromise of two executive accounts.',
    status: 'Closed',
    priority: 'High',
    category: 'Phishing',
    detection_timestamp: '2024-01-15T09:23:00Z',
    detection_source: 'Microsoft Defender for Office 365 Alert',
    reporter_name: 'Sarah Johnson',
    reporter_email: 'sarah.johnson@techflow.com',
    affected_systems: 'Exchange Online, Azure AD, Executive workstations (2), SharePoint Online',
    affected_users: 'CEO, CFO, and their immediate assistants (4 users total)',
    business_impact: 'Potential access to sensitive financial data and strategic documents. Temporary suspension of email access for affected accounts during investigation.',
    containment_actions: 'Immediately disabled compromised accounts, forced password resets, implemented conditional access policies, isolated affected workstations, and blocked malicious sender domains.',
    containment_timestamp: '2024-01-15T11:45:00Z',
    containment_effective: true,
    stakeholders_notified: 'CISO, Legal team, HR leadership, Board of Directors, IT Security team',
    root_cause: 'Sophisticated social engineering combined with zero-day email evasion techniques. Attackers used publicly available information from LinkedIn and company website to craft highly convincing personalized emails.',
    eradication_actions: 'Removed malicious emails from all mailboxes, updated email security rules, deployed additional endpoint detection rules, conducted forensic analysis of affected systems, and implemented enhanced email authentication.',
    eradication_timestamp: '2024-01-16T14:30:00Z',
    tools_used: 'Microsoft Defender ATP, CrowdStrike Falcon, Splunk SIEM, MailTrace Pro, Azure AD logs',
    iocs_identified: 'Malicious domains: exec-update[.]net, secure-board[.]org; IP addresses: 192.168.1.100, 10.0.0.50; File hashes: SHA256: abc123..., MD5: def456...',
    patches_applied: 'Updated email security policies, deployed new Defender ATP rules, enhanced MFA requirements for executive accounts',
    systems_restored: 'All affected systems restored to normal operation with enhanced monitoring',
    recovery_timestamp: '2024-01-17T16:00:00Z',
    verification_steps: 'Full system scans, email flow testing, user access verification, security control validation',
    monitoring_enabled: 'Enhanced logging for executive accounts, additional email security monitoring, behavioral analytics for privileged users',
    return_to_service: '2024-01-17T18:00:00Z',
    lessons_learned: 'Need for enhanced executive security awareness training, implementation of email banner warnings for external emails, regular phishing simulation exercises, and improved incident communication procedures.',
    action_items_generated: '1) Implement weekly security briefings for executives, 2) Deploy advanced email security solution, 3) Conduct tabletop exercise focused on executive targeting, 4) Review and update incident response playbooks',
    assigned_to: 'mike.chen@techflow.com',
    closed_timestamp: '2024-01-20T10:00:00Z',
    mttr_minutes: 4320, // 72 hours
    mttd_minutes: 180,  // 3 hours
    cost_estimate: 75000
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Closed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Contained': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Eradicated': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date) => format(new Date(date), 'MMM d, yyyy - h:mm a');

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {/* Header with Back Button and Print Button */}
      <div className="bg-white border-b border-gray-200 p-4 no-print">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to={createPageUrl('LandingPage')}>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Sample Report Notice */}
        <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-700 mb-1">Sample Report</h3>
              <p className="text-orange-600 text-sm">
                This report demonstrates the comprehensive incident documentation and analysis provided by Hubcys&apos;s 
                AI-powered incident response platform. All data shown is fictional and for demonstration purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Main Report Header */}
        <div className="bg-gray-100 border-gray-200 rounded-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Incident Response Report</h2>
            <h3 className="text-2xl text-orange-700 font-semibold">TechFlow Solutions</h3>
            <p className="text-gray-600 mt-2">Generated on {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Incident Overview */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertTriangle className="w-6 h-6 mr-3" />
              Incident Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Incident ID</h4>
                  <p className="text-gray-700">{sampleIncident.incident_id}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Status</h4>
                  <Badge className={getStatusColor(sampleIncident.status)}>
                    {sampleIncident.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Priority</h4>
                  <Badge className={getPriorityColor(sampleIncident.priority)}>
                    {sampleIncident.priority} Priority
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Category</h4>
                  <p className="text-gray-700">{sampleIncident.category}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Detection Time</h4>
                  <p className="text-gray-700">{formatDate(sampleIncident.detection_timestamp)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Resolution Time</h4>
                  <p className="text-gray-700">{Math.round(sampleIncident.mttr_minutes / 60)} hours</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Assigned To</h4>
                  <p className="text-gray-700">{sampleIncident.assigned_to}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Estimated Cost</h4>
                  <p className="text-gray-700">${sampleIncident.cost_estimate.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
              <p className="text-gray-700 leading-relaxed">{sampleIncident.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-800 mb-1">MTTD</h3>
              <p className="text-2xl font-bold text-gray-900">{Math.round(sampleIncident.mttd_minutes / 60)}h</p>
              <p className="text-xs text-gray-600">Mean Time to Detection</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 text-center">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800 mb-1">MTTR</h3>
              <p className="text-2xl font-bold text-gray-900">{Math.round(sampleIncident.mttr_minutes / 60)}h</p>
              <p className="text-xs text-gray-600">Mean Time to Recovery</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-800 mb-1">Affected</h3>
              <p className="text-2xl font-bold text-gray-900">4</p>
              <p className="text-xs text-gray-600">Users impacted</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-800 mb-1">Systems</h3>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-xs text-gray-600">Systems affected</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Impact Assessment */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-red-700">Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Affected Systems</h4>
                <p className="text-gray-700 text-sm">{sampleIncident.affected_systems}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Affected Users</h4>
                <p className="text-gray-700 text-sm">{sampleIncident.affected_users}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Business Impact</h4>
                <p className="text-gray-700 text-sm">{sampleIncident.business_impact}</p>
              </div>
            </CardContent>
          </Card>

          {/* Response Timeline */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-blue-700">Response Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Detection</p>
                    <p className="text-gray-600 text-xs">{formatDate(sampleIncident.detection_timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Containment</p>
                    <p className="text-gray-600 text-xs">{formatDate(sampleIncident.containment_timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Eradication</p>
                    <p className="text-gray-600 text-xs">{formatDate(sampleIncident.eradication_timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Recovery</p>
                    <p className="text-gray-600 text-xs">{formatDate(sampleIncident.recovery_timestamp)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lessons Learned */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <Target className="w-5 h-5 mr-2" />
              Lessons Learned & Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Key Lessons</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{sampleIncident.lessons_learned}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Action Items</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{sampleIncident.action_items_generated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Highlight */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-cyan-700 text-center">What&apos;s Included in Hubcys Incident Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-orange-800 mb-2">Complete Timeline</h4>
                <p className="text-sm text-gray-600">Full incident lifecycle documentation</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-red-800 mb-2">NIS2 Compliance</h4>
                <p className="text-sm text-gray-600">EU regulatory reporting support</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-800 mb-2">Lessons Learned</h4>
                <p className="text-sm text-gray-600">Improvement recommendations</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-800 mb-2">Action Items</h4>
                <p className="text-sm text-gray-600">Follow-up tasks and remediation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
