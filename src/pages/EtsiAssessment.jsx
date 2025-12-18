
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EtsiAssessment } from "@/entities/EtsiAssessment";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { createPageUrl } from "@/utils";
import EtsiProvisionCard from "../components/etsi/EtsiProvisionCard";
import EtsiAssessmentHeader from "../components/etsi/EtsiAssessmentHeader";
import { Accordion } from "@/components/ui/accordion";

// Renamed for clarity and to avoid conflict in scope.
const EtsiAssessmentService = EtsiAssessment;

const PROVISION_GROUPS = {
  "5.1 No universal default passwords": ["5.1.1", "5.1.2", "5.1.3", "5.1.4", "5.1.5"],
  "5.2 Implement a means to manage reports of vulnerabilities": ["5.2.1", "5.2.2", "5.2.3"],
  "5.3 Keep software updated": ["5.3.1", "5.3.2", "5.3.3", "5.3.7", "5.3.8", "5.3.10", "5.3.13", "5.3.16"],
  "5.4 Securely store sensitive security parameters": ["5.4.1", "5.4.3", "5.4.4"],
  "5.5 Communicate securely": ["5.5.1", "5.5.6", "5.5.7"],
  "5.6 Minimize exposed attack surfaces": ["5.6.2"],
  "5.7 Ensure software integrity": ["5.7.1", "5.7.2"],
  "5.8 Ensure that personal data is secure": ["5.8.1", "5.8.2"],
  "5.11 Make it easy for users to delete user data": ["5.11.1", "5.11.2"],
  "6 Data protection provisions for consumer IoT": ["6.1", "6.2", "6.4", "6.5"]
};

export default function EtsiAssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [openSections, setOpenSections] = useState(["5.1 No universal default passwords"]);

  const getAssessmentId = () => {
    const params = new URLSearchParams(location.search);
    return params.get("id");
  };

  const loadAssessment = useCallback(async (id) => {
    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);
      
      let data;
      if (id) {
        data = await EtsiAssessmentService.get(id);
      } else {
        // Create a new draft as an instance of EtsiAssessmentClass
        // This ensures the assessment state always holds an EtsiAssessmentClass object,
        // even for new assessments, providing consistent behavior with loaded assessments.
        data = {
          company_id: user.company_id,
          status: 'draft'
        };
      }
      setAssessment(data);
    } catch (error) {
      console.error("Error loading assessment:", error);
      toast.error("Failed to load assessment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const assessmentId = getAssessmentId();
    loadAssessment(assessmentId);
  }, [location.search, loadAssessment]);

  const handleInputChange = (field, value) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let savedAssessment;
      if (assessment.id) {
        savedAssessment = await EtsiAssessmentService.update(assessment.id, assessment);
        toast.success("Assessment updated successfully!");
      } else {
        savedAssessment = await EtsiAssessmentService.create(assessment);
        toast.success("Assessment created successfully!");
        // Navigate to the edit URL to have the ID in the query params
        navigate(createPageUrl("EtsiAssessment", { id: savedAssessment.id }));
      }
      setAssessment(savedAssessment);
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error("Failed to save assessment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white">
        Assessment could not be loaded.
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <EtsiAssessmentHeader
          assessment={assessment}
          onSave={handleSave}
          saving={saving}
          onInputChange={handleInputChange}
        />

        <Card className="glass-effect border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl text-white">ETSI EN 303 645 Provisions</CardTitle>
            <CardDescription className="text-gray-400">
              Assess the product against each baseline requirement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion 
              type="multiple" 
              value={openSections} 
              onValueChange={setOpenSections}
              className="w-full space-y-4"
            >
              {Object.entries(PROVISION_GROUPS).map(([groupTitle, provisions]) => (
                <EtsiProvisionCard
                  key={groupTitle}
                  groupTitle={groupTitle}
                  provisions={provisions}
                  assessment={assessment}
                  onInputChange={handleInputChange}
                />
              ))}
            </Accordion>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => navigate(createPageUrl("Assessment"))} className="border-gray-600 text-gray-300">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assessments
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-cyan-500 to-blue-500">
                {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Save className="w-4 h-4 mr-2" />
                )}
                {assessment.id ? 'Save Changes' : 'Save Draft'}
            </Button>
        </div>
      </div>
    </div>
  );
}
