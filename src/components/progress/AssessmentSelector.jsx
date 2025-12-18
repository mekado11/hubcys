import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCommit } from 'lucide-react';
import { format } from 'date-fns';

export default function AssessmentSelector({ assessments, selectedId, onSelectionChange, loading }) {
  
  const renderOption = (assessment) => (
    <SelectItem key={assessment.id} value={assessment.id} className="text-white hover:bg-slate-700">
      {assessment.company_name} - {format(new Date(assessment.created_date), 'MMM d, yyyy')} 
      ({assessment.overall_score}% - {assessment.maturity_level})
    </SelectItem>
  );

  const selectedAssessment = assessments.find(a => a.id === selectedId);

  return (
    <Card className="glass-effect border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center">
          <GitCommit className="w-5 h-5 mr-2" />
          Select Assessment to View
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Choose an assessment to view detailed progress information and comparisons.
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full max-w-md mx-auto">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Assessment</label>
          <Select 
            value={selectedId || ''} 
            onValueChange={onSelectionChange}
            disabled={loading || assessments.length === 0}
          >
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
              <SelectValue placeholder={
                loading ? "Loading assessments..." :
                assessments.length === 0 ? "No assessments available" :
                "Choose an assessment..."
              } />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              {assessments.map(renderOption)}
            </SelectContent>
          </Select>
          
          {selectedAssessment && (
            <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
              <div className="text-sm text-gray-300">
                <p><span className="font-medium">Company:</span> {selectedAssessment.company_name}</p>
                <p><span className="font-medium">Date:</span> {format(new Date(selectedAssessment.created_date), 'PPP')}</p>
                <p><span className="font-medium">Score:</span> {selectedAssessment.overall_score}% ({selectedAssessment.maturity_level})</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}