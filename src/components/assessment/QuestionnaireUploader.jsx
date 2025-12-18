import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { UploadFile } from "@/integrations/Core";
import { ExtractDataFromUploadedFile } from "@/integrations/Core";

export default function QuestionnaireUploader({ onDataExtracted, currentData }) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const assessmentSchema = {
    type: "object",
    properties: {
      company_description: { type: "string" },
      industry_sector: { type: "string" },
      company_size: { type: "string" },
      applicable_us_privacy_laws: { 
        type: "array", 
        items: { type: "string" }
      },
      security_compliance_goals: { type: "string" },
      previous_gap_analysis_details: { type: "string" },
      current_biggest_risks: { type: "string" },
      business_critical_systems: { type: "string" },
      ciso_perspective: { type: "string" },
      compliance_tooling_details: { type: "string" },
      
      // NIS2 fields
      nis2_supply_chain_security: { type: "string" },
      nis2_business_continuity: { type: "string" },
      nis2_vulnerability_handling: { type: "string" },
      nis2_use_of_crypto: { type: "string" },
      nis2_essential_services: { type: "string" },
      nis2_governance_framework: { type: "string" },
      nis2_human_resources_security: { type: "string" },
      
      // Operational Security
      ops_local_admin_privileges: { type: "string" },
      ops_software_installation_control: { type: "string" },
      ops_byod_security_controls: { type: "string" },
      ops_remote_access_method: { type: "string" },
      ops_unsanctioned_cloud_apps: { type: "string" },
      ops_personal_cloud_storage: { type: "string" },
      ops_patch_management_cadence: { type: "string" },
      ops_mobile_device_management: { type: "string" },
      ops_data_classification_system: { type: "string" },
      ops_network_access_control: { type: "string" },
      ops_offboarding_data_management: { type: "string" },
      ops_endpoint_edr_coverage: { type: "string" },
      ops_centralized_logging_siem: { type: "string" },
      ops_vulnerability_scanning_frequency: { type: "string" },
      ops_data_loss_prevention: { type: "string" },
      ops_security_baseline_enforcement: { type: "string" },
      
      // Maturity ratings
      maturity_identity: { type: "number", minimum: 0, maximum: 5 },
      maturity_asset_management: { type: "number", minimum: 0, maximum: 5 },
      maturity_infra_security: { type: "number", minimum: 0, maximum: 5 },
      maturity_app_security: { type: "number", minimum: 0, maximum: 5 },
      maturity_third_party_risk: { type: "number", minimum: 0, maximum: 5 },
      maturity_incident_response: { type: "number", minimum: 0, maximum: 5 },
      maturity_governance_risk: { type: "number", minimum: 0, maximum: 5 },
      maturity_data_protection: { type: "number", minimum: 0, maximum: 5 },
      maturity_security_training: { type: "number", minimum: 0, maximum: 5 },
      maturity_cloud_security: { type: "number", minimum: 0, maximum: 5 },
      maturity_business_continuity: { type: "number", minimum: 0, maximum: 5 },
      
      // Maturity details
      details_identity: { type: "string" },
      details_asset_management: { type: "string" },
      details_infra_security: { type: "string" },
      details_app_security: { type: "string" },
      details_third_party_risk: { type: "string" },
      details_incident_response: { type: "string" },
      details_governance_risk: { type: "string" },
      details_data_protection: { type: "string" },
      details_security_training: { type: "string" },
      details_cloud_security: { type: "string" },
      details_business_continuity: { type: "string" }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setShowDialog(true);
    setError(null);
    setUploading(true);
    setProgress('Uploading PDF...');

    try {
      // Step 1: Upload the file
      const uploadResult = await UploadFile({ file });
      const fileUrl = uploadResult.file_url;
      
      setUploading(false);
      setExtracting(true);
      setProgress('Analyzing document and extracting answers... This may take 30-60 seconds.');

      // Step 2: Extract data from the uploaded PDF
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: assessmentSchema
      });

      if (extractResult.status === 'error') {
        throw new Error(extractResult.details || 'Failed to extract data from PDF');
      }

      const extracted = extractResult.output;
      setExtractedData(extracted);
      setProgress('Extraction complete! Review the data below.');
      setExtracting(false);

    } catch (err) {
      console.error('Error processing PDF:', err);
      setError(err.message || 'Failed to process PDF. Please try again.');
      setUploading(false);
      setExtracting(false);
      setProgress('');
    }
  };

  const handleApplyData = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      setShowDialog(false);
      setExtractedData(null);
      setProgress('');
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setExtractedData(null);
    setError(null);
    setProgress('');
    setUploading(false);
    setExtracting(false);
  };

  return (
    <>
      <Card className="glass-effect border-purple-500/30 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center text-lg">
            <Upload className="w-5 h-5 mr-2" />
            Upload Filled Questionnaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 text-sm mb-4">
            Already filled out the questionnaire PDF? Upload it here and we'll automatically extract your answers and pre-fill the assessment form.
          </p>
          <label htmlFor="pdf-upload">
            <Button 
              type="button"
              variant="outline" 
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 w-full"
              onClick={() => document.getElementById('pdf-upload').click()}
            >
              <FileText className="w-4 h-4 mr-2" />
              Choose PDF File
            </Button>
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-cyan-300 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Processing Questionnaire
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress indicator */}
            {(uploading || extracting) && (
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <div className="flex-1">
                  <p className="text-white font-medium">{progress}</p>
                  {extracting && (
                    <p className="text-gray-400 text-sm mt-1">
                      Our AI is reading through your responses and mapping them to the assessment fields...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-medium">Error</p>
                  <p className="text-red-200 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success and data preview */}
            {extractedData && !uploading && !extracting && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-green-300 font-medium">Data Extracted Successfully!</p>
                    <p className="text-gray-300 text-sm mt-1">
                      Found {Object.keys(extractedData).length} fields. Review below and click "Apply to Assessment" to pre-fill your form.
                    </p>
                  </div>
                </div>

                {/* Preview of extracted data */}
                <div className="bg-slate-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h4 className="text-white font-semibold mb-3">Extracted Data Preview:</h4>
                  <div className="space-y-2">
                    {Object.entries(extractedData).slice(0, 10).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-cyan-400 font-medium">{key}:</span>
                        <span className="text-gray-300 ml-2">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 100)}
                          {String(value).length > 100 ? '...' : ''}
                        </span>
                      </div>
                    ))}
                    {Object.keys(extractedData).length > 10 && (
                      <p className="text-gray-400 text-sm italic mt-2">
                        ... and {Object.keys(extractedData).length - 10} more fields
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyData}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply to Assessment
                  </Button>
                </div>
              </div>
            )}

            {/* Loading state without data yet */}
            {!extractedData && !error && (uploading || extracting) && (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    {uploading ? 'Uploading your PDF...' : 'Extracting data from PDF...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}