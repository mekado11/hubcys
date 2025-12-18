import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, AlertCircle } from 'lucide-react';
import { ActionItem } from '@/entities/ActionItem';

export default function RemediationSummary({ selectedAssessmentId }) {
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedAssessmentId) {
      setActionItems([]);
      return;
    }

    const fetchActionItems = async () => {
      setLoading(true);
      try {
        const items = await ActionItem.filter({ 
          assessment_id: selectedAssessmentId, 
          status: 'completed' 
        });
        setActionItems(items || []);
      } catch (error) {
        console.error("Failed to fetch action items:", error);
        setActionItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActionItems();
  }, [selectedAssessmentId]);

  if (!selectedAssessmentId) {
    return (
      <Card className="glass-effect border-orange-500/20 h-full">
        <CardHeader>
          <CardTitle className="text-orange-300 flex items-center">
            <ListChecks className="w-5 h-5 mr-2" />
            Remediation Activity
          </CardTitle>
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

  const actionsByCategory = actionItems.reduce((acc, action) => {
    const category = action.category?.replace('_', ' ') || 'Other';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category]++;
    return acc;
  }, {});

  return (
    <Card className="glass-effect border-orange-500/20 h-full">
      <CardHeader>
        <CardTitle className="text-orange-300 flex items-center">
          <ListChecks className="w-5 h-5 mr-2" />
          Remediation Activity
        </CardTitle>
        <p className="text-sm text-gray-400">
          Action items completed for this assessment.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
            <p className="text-gray-400 mt-2 text-sm">Loading action items...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-white">{actionItems.length}</p>
              <p className="text-gray-300">Total Action Items Completed</p>
            </div>

            {actionItems.length > 0 ? (
              <div className="space-y-2 text-sm">
                {Object.entries(actionsByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center p-2 bg-slate-800/50 rounded-md">
                    <span className="capitalize text-gray-300">{category} Actions</span>
                    <span className="font-semibold text-white bg-orange-500/20 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                <p className="text-sm">No completed action items found for this assessment.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}