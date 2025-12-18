import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, AlertCircle } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';

export default function ScoreComparisonCard({ selectedAssessmentId, assessments }) {
  const { baseline, comparison, hasComparison } = useMemo(() => {
    if (!selectedAssessmentId || assessments.length === 0) {
      return { baseline: null, comparison: null, hasComparison: false };
    }

    const selectedIndex = assessments.findIndex(a => a.id === selectedAssessmentId);
    if (selectedIndex === -1) {
      return { baseline: null, comparison: null, hasComparison: false };
    }

    const comparison = assessments[selectedIndex];
    const baseline = assessments[selectedIndex + 1] || null; // Previous assessment

    return {
      baseline,
      comparison,
      hasComparison: baseline !== null
    };
  }, [selectedAssessmentId, assessments]);

  const getMaturityColor = (level) => {
    switch (level) {
      case 'Expert': return 'text-cyan-300';
      case 'Advanced': return 'text-green-300';
      case 'Intermediate': return 'text-yellow-300';
      case 'Developing': return 'text-orange-300';
      default: return 'text-red-300';
    }
  };

  if (!comparison) {
    return (
      <Card className="glass-effect border-cyan-500/20 h-full">
        <CardHeader>
          <CardTitle className="text-cyan-300">Overall Score Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No assessment selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasComparison) {
    return (
      <Card className="glass-effect border-cyan-500/20 h-full">
        <CardHeader>
          <CardTitle className="text-cyan-300">Overall Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-4xl font-bold text-white mb-2">
              <AnimatedCounter value={comparison.overall_score} suffix="%" />
            </p>
            <p className={`text-lg font-semibold ${getMaturityColor(comparison.maturity_level)} mb-4`}>
              {comparison.maturity_level}
            </p>
            <p className="text-sm text-gray-400">
              This is your first completed assessment. Future assessments will show comparison data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreDiff = comparison.overall_score - baseline.overall_score;
  const DiffIcon = scoreDiff > 0 ? ArrowUp : scoreDiff < 0 ? ArrowDown : Minus;
  const diffColor = scoreDiff > 0 ? 'text-green-400' : scoreDiff < 0 ? 'text-red-400' : 'text-gray-400';

  return (
    <Card className="glass-effect border-cyan-500/20 h-full">
      <CardHeader>
        <CardTitle className="text-cyan-300">Overall Score Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400">Previous Score</p>
            <p className="text-4xl font-bold text-white">
              <AnimatedCounter value={baseline.overall_score} suffix="%" />
            </p>
            <p className={`text-lg font-semibold ${getMaturityColor(baseline.maturity_level)}`}>
              {baseline.maturity_level}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Current Score</p>
            <p className="text-4xl font-bold text-white">
              <AnimatedCounter value={comparison.overall_score} suffix="%" />
            </p>
            <p className={`text-lg font-semibold ${getMaturityColor(comparison.maturity_level)}`}>
              {comparison.maturity_level}
            </p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-center">
          <p className="text-lg font-semibold text-white">Change:</p>
          <div className={`flex items-center ml-2 ${diffColor}`}>
            <DiffIcon className="w-5 h-5" />
            <p className="text-2xl font-bold ml-1">
              <AnimatedCounter value={Math.abs(scoreDiff)} suffix="%" />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}