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

// NIST SP 800-53 Rev 5 — all 20 control families (NIST.SP.800-53r5 Update 1, Dec 2022)
export const NIST_800_53_CONTROL_FAMILIES = [
  { id: "AC", name: "Access Control",                                        controls: 25 },
  { id: "AT", name: "Awareness and Training",                                controls: 6  },
  { id: "AU", name: "Audit and Accountability",                              controls: 16 },
  { id: "CA", name: "Assessment, Authorization, and Monitoring",             controls: 9  },
  { id: "CM", name: "Configuration Management",                              controls: 14 },
  { id: "CP", name: "Contingency Planning",                                  controls: 13 },
  { id: "IA", name: "Identification and Authentication",                     controls: 13 },
  { id: "IR", name: "Incident Response",                                     controls: 10 },
  { id: "MA", name: "Maintenance",                                           controls: 6  },
  { id: "MP", name: "Media Protection",                                      controls: 8  },
  { id: "PE", name: "Physical and Environmental Protection",                 controls: 23 },
  { id: "PL", name: "Planning",                                              controls: 11 },
  { id: "PM", name: "Program Management",                                    controls: 32 },
  { id: "PS", name: "Personnel Security",                                    controls: 9  },
  { id: "PT", name: "Personally Identifiable Information Processing and Transparency", controls: 8 },
  { id: "RA", name: "Risk Assessment",                                       controls: 10 },
  { id: "SA", name: "System and Services Acquisition",                       controls: 23 },
  { id: "SC", name: "System and Communications Protection",                  controls: 51 },
  { id: "SI", name: "System and Information Integrity",                      controls: 23 },
  { id: "SR", name: "Supply Chain Risk Management",                          controls: 12 },
];

const FRAMEWORK_OPTIONS = [
  { value: "NIST_CSF",          label: "NIST Cybersecurity Framework (CSF) 2.0", description: "Risk-based cybersecurity framework — updated Feb 2024" },
  { value: "NIST_800_53_REV5",  label: "NIST SP 800-53 Rev 5",                  description: "1,189 security & privacy controls across 20 families (Update 1, Dec 2022)" },
  { value: "NIST_800_53A_REV5", label: "NIST SP 800-53A Rev 5 — Assessment Procedures", description: "Assessing security & privacy controls per NIST SP 800-53 Rev 5 (Dec 2022)", highlighted: true },
  { value: "ISO_27001",         label: "ISO/IEC 27001:2022",                     description: "Information security management systems" },
  { value: "ISO_27002",         label: "ISO/IEC 27002:2022",                     description: "Information security controls — 93 controls across 4 themes" },
  { value: "CIS_Controls",      label: "CIS Critical Security Controls v8.1",    description: "18 prioritised cybersecurity best practices" },
  { value: "SOC2",              label: "SOC 2 Type II",                          description: "Service organization controls — Trust Services Criteria" },
  { value: "COBIT",             label: "COBIT 2019",                             description: "Governance and management framework for enterprise IT" },
  { value: "FEDRAMP",           label: "FedRAMP Rev 5 (2024)",                  description: "Federal risk and authorization management program — aligned to NIST 800-53 Rev 5" },
  { value: "CMMC",              label: "CMMC 2.0 Level 2/3",                    description: "Cybersecurity maturity model certification for DoD contractors" },
  { value: "SOX_ITGC",         label: "SOX IT General Controls",                description: "IT controls for financial reporting" },
  { value: "IEC_62443",        label: "IEC 62443",                              description: "Industrial automation and control systems (OT/ICS) security" },
  { value: "HIPAA",            label: "HIPAA Security Rule",                    description: "Healthcare information security — Administrative, Physical & Technical Safeguards" },
  { value: "PCI_DSS",          label: "PCI DSS v4.0.1",                        description: "Payment card industry data security standard — 12 requirements" },
  { value: "GDPR",             label: "GDPR / UK GDPR",                        description: "EU & UK General Data Protection Regulation" },
  { value: "NIS2",             label: "NIS2 Directive (EU 2022/2555)",          description: "EU network & information systems security — Essential/Important entities" },
  { value: "DORA",             label: "DORA (EU 2022/2554)",                   description: "Digital Operational Resilience Act — EU financial sector" },
  { value: "TISAX",            label: "TISAX AL2/AL3",                         description: "Trusted Information Security Assessment Exchange — automotive sector" },
  { value: "NCSC_CYBER_ESSENTIALS", label: "Cyber Essentials / CE Plus (UK)", description: "NCSC-backed certification — 5 technical controls" },
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
              placeholder="e.g., Q4 2026 NIST 800-53A Assessment"
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

          {/* NIST 800-53A control families reference panel */}
          {(formData.framework_type === 'NIST_800_53A_REV5' || formData.framework_type === 'NIST_800_53_REV5') && (
            <div className="bg-slate-800/60 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-purple-300 font-semibold mb-2">
                NIST SP 800-53 Rev 5 (Update 1, Dec 2022) — 20 Control Families · 1,189 controls
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 max-h-40 overflow-y-auto pr-1">
                {NIST_800_53_CONTROL_FAMILIES.map(f => (
                  <div key={f.id} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                    <span className="font-mono text-cyan-400 w-6 shrink-0">{f.id}</span>
                    <span className="truncate">{f.name}</span>
                    <span className="text-gray-500 ml-auto shrink-0">{f.controls}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                Source: NIST SP 800-53A Rev 5 · csrc.nist.gov/pubs/sp/800/53a/r5/final
              </p>
            </div>
          )}

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