import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Loader2, 
  Brain, 
  Shield, 
  CheckCircle,
  FileText,
  List,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { enrichIncidentData } from '@/functions/enrichIncidentData';
import { suggestIncidentClassification } from '@/functions/suggestIncidentClassification';
import { generateIncidentActionItems } from '@/functions/generateIncidentActionItems';
import { suggestIncidentPlaybook } from '@/functions/suggestIncidentPlaybook';

export default function AIEnrichmentPanel({ incident, onUpdate, canEdit }) {
  const [enriching, setEnriching] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [generatingItems, setGeneratingItems] = useState(false);
  const [suggestingPlaybook, setSuggestingPlaybook] = useState(false);

  const handleEnrichData = async () => {
    setEnriching(true);
    try {
      const response = await enrichIncidentData({ incidentId: incident.id });
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast.success('Incident enriched with threat intelligence!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error enriching incident:', error);
      toast.error(`Failed to enrich incident: ${error.message}`);
    } finally {
      setEnriching(false);
    }
  };

  const handleSuggestClassification = async () => {
    setClassifying(true);
    try {
      const response = await suggestIncidentClassification({ incidentId: incident.id });
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast.success('AI classification suggested!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error suggesting classification:', error);
      toast.error(`Failed to suggest classification: ${error.message}`);
    } finally {
      setClassifying(false);
    }
  };

  const handleGenerateActionItems = async () => {
    setGeneratingItems(true);
    try {
      const response = await generateIncidentActionItems({ incidentId: incident.id });
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(`Generated ${response.count} action items!`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error generating action items:', error);
      toast.error(`Failed to generate action items: ${error.message}`);
    } finally {
      setGeneratingItems(false);
    }
  };

  const handleSuggestPlaybook = async () => {
    setSuggestingPlaybook(true);
    try {
      const response = await suggestIncidentPlaybook({ incidentId: incident.id });
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast.success('Playbook and remediation steps suggested!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error suggesting playbook:', error);
      toast.error(`Failed to suggest playbook: ${error.message}`);
    } finally {
      setSuggestingPlaybook(false);
    }
  };

  const hasEnrichment = incident.enriched_threat_intelligence || incident.ai_enrichment_timestamp;
  const hasClassification = incident.ai_suggested_priority || incident.ai_suggested_category;
  const hasPlaybook = incident.ai_suggested_playbooks || incident.ai_suggested_remediation;

  return (
    <Card className="glass-effect border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI-Powered Incident Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Enrich with Threat Intel */}
          <div className="bg-slate-800/40 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <Brain className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Threat Intelligence</h4>
                <p className="text-xs text-gray-400">
                  Enrich with real-time threat intel, CVEs, and attack patterns
                </p>
              </div>
            </div>
            <Button
              onClick={handleEnrichData}
              disabled={!canEdit || enriching}
              size="sm"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {enriching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  {hasEnrichment ? 'Re-enrich Data' : 'Enrich Data'}
                </>
              )}
            </Button>
            {hasEnrichment && (
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Last enriched: {new Date(incident.ai_enrichment_timestamp).toLocaleString()}
              </div>
            )}
          </div>

          {/* Suggest Classification */}
          <div className="bg-slate-800/40 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <Shield className="w-5 h-5 text-orange-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Smart Classification</h4>
                <p className="text-xs text-gray-400">
                  AI-suggested severity and category based on context
                </p>
              </div>
            </div>
            <Button
              onClick={handleSuggestClassification}
              disabled={!canEdit || classifying}
              size="sm"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {classifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {hasClassification ? 'Re-classify' : 'Suggest Classification'}
                </>
              )}
            </Button>
            {hasClassification && (
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Classification available
              </div>
            )}
          </div>

          {/* Generate Action Items */}
          <div className="bg-slate-800/40 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <List className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Auto Action Items</h4>
                <p className="text-xs text-gray-400">
                  Generate remediation tasks automatically
                </p>
              </div>
            </div>
            <Button
              onClick={handleGenerateActionItems}
              disabled={!canEdit || generatingItems}
              size="sm"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {generatingItems ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <List className="w-4 h-4 mr-2" />
                  Generate Action Items
                </>
              )}
            </Button>
          </div>

          {/* Suggest Playbook */}
          <div className="bg-slate-800/40 border border-pink-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <FileText className="w-5 h-5 text-pink-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Response Playbook</h4>
                <p className="text-xs text-gray-400">
                  Get tactical remediation steps and playbooks
                </p>
              </div>
            </div>
            <Button
              onClick={handleSuggestPlaybook}
              disabled={!canEdit || suggestingPlaybook}
              size="sm"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {suggestingPlaybook ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suggesting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {hasPlaybook ? 'Refresh Playbook' : 'Suggest Playbook'}
                </>
              )}
            </Button>
            {hasPlaybook && (
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Playbook available
              </div>
            )}
          </div>
        </div>

        {/* AI Classification Suggestions */}
        {hasClassification && (
          <Alert className="bg-orange-900/20 border-orange-500/30">
            <Shield className="w-5 h-5 text-orange-400" />
            <AlertDescription className="text-orange-200">
              <div className="font-semibold mb-2">AI-Suggested Classification:</div>
              <div className="flex gap-3 mb-2">
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  Priority: {incident.ai_suggested_priority}
                </Badge>
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  Category: {incident.ai_suggested_category}
                </Badge>
              </div>
              <div className="text-sm text-gray-300">
                {incident.ai_classification_rationale}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Enriched Threat Intelligence Display */}
        {hasEnrichment && (
          <div className="bg-slate-800/40 border border-cyan-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Enriched Threat Intelligence
            </h4>
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{incident.enriched_threat_intelligence}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Playbook and Remediation Display */}
        {hasPlaybook && (
          <div className="bg-slate-800/40 border border-pink-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-pink-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Response Playbook & Remediation
            </h4>
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{incident.ai_suggested_remediation}</ReactMarkdown>
            </div>
          </div>
        )}

        {!hasEnrichment && !hasClassification && !hasPlaybook && (
          <Alert className="bg-purple-900/20 border-purple-500/30">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <AlertDescription className="text-purple-200">
              Use the AI-powered tools above to automatically enrich this incident with threat intelligence, 
              get classification suggestions, generate action items, and receive tactical remediation guidance.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}