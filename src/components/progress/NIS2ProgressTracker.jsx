import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Assessment } from '@/entities/Assessment';
import { 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Target,
  Users,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function NIS2ProgressTracker({ selectedAssessmentId }) {
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nis2Progress, setNis2Progress] = useState(null);

  useEffect(() => {
    if (selectedAssessmentId) {
      fetchNIS2Progress();
    }
  }, [selectedAssessmentId]);

  const fetchNIS2Progress = async () => {
    try {
      setLoading(true);
      const assessments = await Assessment.list('-created_date');
      const nis2Assessments = assessments.filter(assessment => 
        assessment.nis2_supply_chain_security || 
        assessment.nis2_business_continuity || 
        assessment.nis2_vulnerability_handling || 
        assessment.nis2_use_of_crypto
      );

      setAssessmentHistory(nis2Assessments);
      if (nis2Assessments.length > 0) {
        calculateProgress(nis2Assessments);
      }
    } catch (error) {
      console.error('Error fetching NIS2 progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (assessments) => {
    const latest = assessments[0];
    const previous = assessments[1];

    const nis2Criteria = [
      { key: 'nis2_supply_chain_security', name: 'Supply Chain Security', icon: Users },
      { key: 'nis2_business_continuity', name: 'Business Continuity', icon: Shield },
      { key: 'nis2_vulnerability_handling', name: 'Vulnerability Management', icon: Target },
      { key: 'nis2_use_of_crypto', name: 'Cryptography Usage', icon: CheckCircle2 },
      { key: 'nis2_essential_services', name: 'Essential Services ID', icon: Building2 },
      { key: 'nis2_governance_framework', name: 'Governance Framework', icon: TrendingUp },
      { key: 'nis2_human_resources_security', name: 'HR Security', icon: Users }
    ];

    const currentProgress = nis2Criteria.map(criterion => {
      const currentValue = latest[criterion.key];
      const previousValue = previous ? previous[criterion.key] : '';
      
      const currentComplete = currentValue && currentValue.trim().length > 50;
      const previousComplete = previousValue && previousValue.trim().length > 50;
      
      let status = 'incomplete';
      if (currentComplete) status = 'complete';
      else if (currentValue && currentValue.trim().length > 0) status = 'partial';

      let trend = 'stable';
      if (!previousComplete && currentComplete) trend = 'improved';
      else if (previousComplete && !currentComplete) trend = 'declined';
      else if (previousValue && currentValue && currentValue.length > previousValue.length) trend = 'improved';

      return {
        ...criterion,
        status,
        trend,
        completionLevel: currentComplete ? 100 : (currentValue ? Math.min((currentValue.length / 50) * 100, 90) : 0)
      };
    });

    const overallScore = Math.round(
      currentProgress.reduce((sum, item) => sum + (item.status === 'complete' ? 100 : item.completionLevel), 0) / nis2Criteria.length
    );

    let readinessLevel = 'Not Ready';
    if (overallScore >= 85) readinessLevel = 'Full Compliance';
    else if (overallScore >= 60) readinessLevel = 'Substantial Compliance';
    else if (overallScore >= 35) readinessLevel = 'Basic Preparation';

    setNis2Progress({
      overallScore,
      readinessLevel,
      criteria: currentProgress,
      latestAssessment: latest,
      hasImproved: previous && overallScore > calculatePreviousScore(previous, nis2Criteria)
    });
  };

  const calculatePreviousScore = (assessment, criteria) => {
    const scores = criteria.map(criterion => {
      const value = assessment[criterion.key];
      return value && value.trim().length > 50 ? 100 : (value ? Math.min((value.length / 50) * 100, 90) : 0);
    });
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / criteria.length);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'partial': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improved': return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'declined': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect border-yellow-500/20">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </CardContent>
      </Card>
    );
  }

  if (!nis2Progress) {
    return (
      <Card className="glass-effect border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-300 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            NIS2 Compliance Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No NIS2-specific assessment data found</p>
          <Link to={createPageUrl("Assessment?new=true")}>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              Start NIS2 Assessment
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-yellow-500/20">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            NIS2 Compliance Progress
          </div>
          {nis2Progress.hasImproved && (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              Improved
            </Badge>
          )}
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Track your progress toward NIS2 Directive compliance requirements
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-white">Overall NIS2 Readiness</h4>
            <Badge className={
              nis2Progress.readinessLevel === 'Full Compliance' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
              nis2Progress.readinessLevel === 'Substantial Compliance' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
              nis2Progress.readinessLevel === 'Basic Preparation' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
              'bg-red-500/20 text-red-300 border-red-500/30'
            }>
              {nis2Progress.readinessLevel}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={nis2Progress.overallScore} className="flex-1" />
            <span className="text-xl font-bold text-white min-w-[3rem]">
              {nis2Progress.overallScore}%
            </span>
          </div>
        </div>

        {/* Detailed Criteria Progress */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-300">Compliance Criteria</h4>
          <div className="space-y-2">
            {nis2Progress.criteria.map((criterion, index) => {
              const IconComponent = criterion.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-300">{criterion.name}</span>
                        {getTrendIcon(criterion.trend)}
                      </div>
                      <Progress value={criterion.completionLevel} className="w-32 mt-1" />
                    </div>
                  </div>
                  <Badge className={getStatusColor(criterion.status)} variant="outline">
                    {criterion.status === 'complete' ? 'Complete' : 
                     criterion.status === 'partial' ? 'Partial' : 'Not Started'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assessment History */}
        {assessmentHistory.length > 1 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-300">Recent Assessments</h4>
            <div className="space-y-2">
              {assessmentHistory.slice(0, 3).map((assessment, index) => (
                <div key={assessment.id} className="flex items-center justify-between text-sm p-2 bg-slate-800/10 rounded">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">{format(new Date(assessment.created_date), 'MMM d, yyyy')}</span>
                    {index === 0 && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Latest</Badge>}
                  </div>
                  <span className="text-gray-400">{assessment.company_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}