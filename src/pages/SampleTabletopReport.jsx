
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Gamepad2,
  Users,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowLeft, // Added import for new button
  Printer // Added import for new button
} from 'lucide-react';
// Assuming Link is from react-router-dom or a similar routing library
// If react-router-dom is not in use, this would need to be replaced with a standard <a> tag or window.location.href
import { Link } from 'react-router-dom'; 
import { createPageUrl } from '@/utils'; 

export default function SampleTabletopReport() {
  // Hardcoded sample tabletop exercise data
  const sampleExercise = {
    exercise_name: 'Supply Chain Ransomware Crisis - CloudSecure Scenario',
    exercise_description: 'A comprehensive tabletop exercise simulating a sophisticated ransomware attack targeting cloud infrastructure and supply chain dependencies. The scenario tests incident response capabilities, stakeholder communication, and business continuity procedures.',
    company_name: 'TechFlow Solutions',
    company_size: 'Medium_51-500',
    industry_sector: 'Technology',
    status: 'Completed',
    scheduled_date: '2024-01-22T14:00:00Z',
    duration_minutes: 120,
    facilitator_email: 'dr.sarah.wilson@securityconsulting.com',
    
    // Exercise execution data
    participants_count: 12,
    scenarios_tested: 3,
    action_items_generated: 18,
    
    // Detailed findings
    strengths_identified: [
      'Strong technical response capabilities and system knowledge',
      'Effective internal communication protocols during crisis',
      'Quick decision-making for containment actions',
      'Good understanding of business impact and priorities',
      'Well-defined roles and responsibilities within IT team'
    ],
    
    gaps_identified: [
      'Delayed external communication to customers and partners',
      'Insufficient supply chain coordination protocols',
      'Unclear legal and regulatory notification procedures',
      'Limited backup verification and recovery testing',
      'Inadequate crisis communication with media and stakeholders'
    ],
    
    lessons_learned: 'The exercise revealed strong technical capabilities but highlighted the need for improved external stakeholder communication and supply chain coordination. Participants demonstrated excellent problem-solving skills but struggled with regulatory notification timelines and customer communication protocols.',
    
    action_items: [
      'Develop external communication templates for major incidents',
      'Create supply chain emergency contact procedures',
      'Implement quarterly backup restoration testing',
      'Establish legal notification workflow with defined timelines',
      'Conduct media relations training for leadership team',
      'Create customer communication portal for incident updates'
    ],
    
    exercise_objectives: [
      'Test incident response procedures for ransomware attacks',
      'Evaluate supply chain communication protocols',
      'Assess business continuity and recovery capabilities',
      'Review regulatory notification procedures',
      'Practice crisis communication and stakeholder management'
    ],
    
    scenarios: [
      {
        name: 'Initial Detection',
        description: 'Ransomware detected on primary file servers with encryption spreading to connected systems',
        key_decisions: 'Immediate system isolation, activation of incident response team, initial impact assessment'
      },
      {
        name: 'Supply Chain Impact',
        description: 'Discovery that ransomware may have spread to key supplier systems through shared access',
        key_decisions: 'Supplier notification, joint response coordination, customer impact assessment'
      },
      {
        name: 'Recovery and Communication',
        description: 'Recovery efforts underway with need for customer and regulatory communications',
        key_decisions: 'Public communication strategy, regulatory notifications, recovery timeline communication'
      }
    ],
    
    maturity_scores: {
      'Technical Response': 4.2,
      'Communication': 2.8,
      'Business Continuity': 3.5,
      'Supply Chain Coordination': 2.3,
      'Regulatory Compliance': 3.0
    }
  };

  // Adjusted for light background
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'In_Progress': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Planning': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Adjusted for light background
  const getScoreColor = (score) => {
    if (score >= 4) return 'text-green-700';
    if (score >= 3) return 'text-yellow-700';
    return 'text-red-700';
  };

  const formatDate = (date) => format(new Date(date), 'MMM d, yyyy - h:mm a');

  return (
    // Changed root background from dark to light
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          /* Ensure text colors are readable on white background during print */
          .text-gray-900, .text-gray-700, .text-gray-600,
          .text-purple-700, .text-purple-600,
          .text-blue-700, .text-blue-600,
          .text-green-700, .text-green-600,
          .text-orange-700, .text-orange-600,
          .text-red-700, .text-red-600,
          .text-cyan-700, .text-cyan-600 {
            color: #000 !important; /* Force black text for print */
          }
          /* Ensure card backgrounds are white during print */
          .bg-white, .bg-gray-100, .bg-purple-50 {
            background-color: white !important;
          }
          .border-gray-200 {
            border-color: #ddd !important; /* Lighter border for print */
          }
          .bg-green-100, .bg-blue-100, .bg-yellow-100, .bg-gray-100,
          .bg-purple-100, .bg-orange-100 {
            background-color: white !important; /* Ensure badge backgrounds are white */
          }
          .bg-gradient-to-r {
            background: none !important; /* Remove gradients */
          }
        }
      `}</style>

      {/* Header with Back Button - Replaced original header */}
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
        {/* Sample Report Notice - Adjusted for light background */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <Gamepad2 className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-800 mb-1">Sample Report</h3>
              <p className="text-purple-700 text-sm">
                This report demonstrates the comprehensive tabletop exercise analysis and recommendations provided by Hubcys's 
                crisis simulation platform. All data shown is fictional and for demonstration purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Main Report Header - Adjusted for light background */}
        <div className="bg-gray-100 rounded-lg p-8 mb-8 border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Tabletop Exercise After-Action Report</h2>
            <h3 className="text-2xl text-purple-700 font-semibold">{sampleExercise.company_name}</h3>
            <p className="text-gray-600 mt-2">Generated on {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Exercise Overview - Adjusted for light background */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700">
              <Gamepad2 className="w-6 h-6 mr-3" />
              Exercise Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Exercise Name</h4>
                  <p className="text-gray-700">{sampleExercise.exercise_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Status</h4>
                  <Badge className={getStatusColor(sampleExercise.status)}>
                    {sampleExercise.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Industry</h4>
                  <p className="text-gray-700">{sampleExercise.industry_sector}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Company Size</h4>
                  <p className="text-gray-700">{sampleExercise.company_size.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Exercise Date</h4>
                  <p className="text-gray-700">{formatDate(sampleExercise.scheduled_date)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Duration</h4>
                  <p className="text-gray-700">{sampleExercise.duration_minutes} minutes</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Facilitator</h4>
                  <p className="text-gray-700">{sampleExercise.facilitator_email}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Participants</h4>
                  <p className="text-gray-700">{sampleExercise.participants_count} team members</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Exercise Description</h4>
              <p className="text-gray-700 leading-relaxed">{sampleExercise.exercise_description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics - Adjusted for light background */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-700 mb-1">Participants</h3>
              <p className="text-2xl font-bold text-gray-900">{sampleExercise.participants_count}</p>
              <p className="text-xs text-gray-600">Cross-functional team</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 text-center">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-700 mb-1">Scenarios</h3>
              <p className="text-2xl font-bold text-gray-900">{sampleExercise.scenarios_tested}</p>
              <p className="text-xs text-gray-600">Progressive complexity</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-700 mb-1">Action Items</h3>
              <p className="text-2xl font-bold text-gray-900">{sampleExercise.action_items_generated}</p>
              <p className="text-xs text-gray-600">Improvement opportunities</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-700 mb-1">Duration</h3>
              <p className="text-2xl font-bold text-gray-900">{sampleExercise.duration_minutes}m</p>
              <p className="text-xs text-gray-600">Exercise length</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Scores - Adjusted for light background */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="text-cyan-700">Performance Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(sampleExercise.maturity_scores).map(([category, score]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">{category}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 rounded-full" 
                        style={{ width: `${(score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`font-bold ${getScoreColor(score)}`}>{score}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Findings - Adjusted for light background */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Strengths Identified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {sampleExercise.strengths_identified.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {sampleExercise.gaps_identified.map((gap, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm">{gap}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Action Items - Adjusted for light background */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <Target className="w-5 h-5 mr-2" />
              Recommended Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {sampleExercise.action_items.map((item, index) => (
                <div key={index} className="flex items-start p-3 bg-gray-100 rounded-lg">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-orange-700 text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lessons Learned - Adjusted for light background */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <TrendingUp className="w-5 h-5 mr-2" />
              Key Lessons Learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{sampleExercise.lessons_learned}</p>
          </CardContent>
        </Card>

        {/* Features Highlight - Adjusted for light background */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-cyan-700 text-center">Hubcys Tabletop Exercise Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Gamepad2 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-purple-700 mb-2">Scenario Builder</h4>
                <p className="text-sm text-gray-600">AI-powered realistic crisis scenarios</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-700 mb-2">Real-time Tracking</h4>
                <p className="text-sm text-gray-600">Live participant response monitoring</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-700 mb-2">Performance Analysis</h4>
                <p className="text-sm text-gray-600">Detailed team effectiveness metrics</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-orange-700 mb-2">Action Planning</h4>
                <p className="text-sm text-gray-600">Automated improvement recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
