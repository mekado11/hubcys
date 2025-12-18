import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { ComplianceFramework } from "@/entities/ComplianceFramework";
import { User } from "@/entities/User";
import { toast } from "sonner";

const FRAMEWORK_OPTIONS = [
  { value: "NIST_CSF", label: "NIST Cybersecurity Framework (CSF)", description: "Risk-based cybersecurity framework" },
  { value: "NIST_800_53_REV5", label: "NIST 800-53 Rev 5", description: "Security and privacy controls for information systems" },
  { value: "NIST_800_53A_REV5", label: "NIST 800-53A Rev 5 (Latest)", description: "Assessment procedures for security and privacy controls - Updated 2024", highlighted: true },
  { value: "ISO_27001", label: "ISO/IEC 27001:2022", description: "Information security management systems" },
  { value: "ISO_27002", label: "ISO/IEC 27002:2022", description: "Information security controls" },
  { value: "CIS_Controls", label: "CIS Critical Security Controls v8", description: "Prioritized cybersecurity best practices" },
  { value: "SOC2", label: "SOC 2 Type II", description: "Service organization controls for security and privacy" },
  { value: "COBIT", label: "COBIT 2019", description: "Governance and management framework for enterprise IT" },
  { value: "FEDRAMP", label: "FedRAMP", description: "Federal risk and authorization management program" },
  { value: "CMMC", label: "CMMC 2.0", description: "Cybersecurity maturity model certification" },
  { value: "SOX_ITGC", label: "SOX IT General Controls", description: "IT controls for financial reporting" },
  { value: "IEC_62443", label: "IEC 62443", description: "Industrial automation and control systems security" },
  { value: "HIPAA", label: "HIPAA Security Rule", description: "Healthcare information security standards" },
  { value: "PCI_DSS", label: "PCI DSS v4.0", description: "Payment card industry data security standard" },
  { value: "GDPR", label: "GDPR", description: "EU General Data Protection Regulation" },
  { value: "TISAX", label: "TISAX", description: "Trusted Information Security Assessment Exchange" },
  { value: "NCSC_CYBER_ESSENTIALS", label: "NCSC Cyber Essentials (UK)", description: "UK government-backed cybersecurity certification" }
];

export default function AddFrameworkDialog({ onFrameworkCreated }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    framework_type: "",
    description: "",
    target_completion_date: ""
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.framework_type) {
      toast.error("Please provide a name and select a framework type");
      return;
    }

    setCreating(true);
    try {
      const user = await User.me();
      
      const newFramework = await ComplianceFramework.create({
        company_id: user.company_id,
        name: formData.name,
        framework_type: formData.framework_type,
        description: formData.description,
        status: "Not Started",
        target_completion_date: formData.target_completion_date || null
      });

      toast.success(`Framework "${formData.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: "",
        framework_type: "",
        description: "",
        target_completion_date: ""
      });
      
      setOpen(false);
      
      if (onFrameworkCreated) {
        onFrameworkCreated(newFramework);
      }
    } catch (error) {
      console.error("Error creating framework:", error);
      toast.error("Failed to create framework. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
          <Plus className="w-4 h-4 mr-2" />
          Add Framework
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Compliance Framework</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new compliance framework to track your organization's compliance journey.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="framework-name" className="text-white">
              Framework Name *
            </Label>
            <Input
              id="framework-name"
              placeholder="e.g., Q1 2025 SOC 2 Assessment"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="framework-type" className="text-white">
              Framework Type *
            </Label>
            <Select
              value={formData.framework_type}
              onValueChange={(value) => setFormData({ ...formData, framework_type: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select a framework..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-[400px]">
                {FRAMEWORK_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value} 
                    className={`text-white ${option.highlighted ? 'bg-purple-900/30' : ''}`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        {option.highlighted && (
                          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="framework-description" className="text-white">
              Description (Optional)
            </Label>
            <Textarea
              id="framework-description"
              placeholder="Additional context about this compliance initiative..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="target-date" className="text-white">
              Target Completion Date (Optional)
            </Label>
            <Input
              id="target-date"
              type="date"
              value={formData.target_completion_date}
              onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={creating}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Framework
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}