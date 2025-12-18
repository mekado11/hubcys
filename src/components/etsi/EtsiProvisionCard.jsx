import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const provisionTitles = {
    "5.1.1": "No universal default passwords",
    "5.1.2": "Secure password generation",
    "5.1.3": "Best practice crypto for auth",
    "5.1.4": "Easy change of auth value",
    "5.1.5": "Brute-force protection",
    "5.2.1": "Public vulnerability disclosure policy",
    "5.2.2": "Timely action on vulnerabilities",
    "5.2.3": "Continuous vulnerability monitoring",
    "5.3.1": "Software securely updateable",
    "5.3.2": "Secure update mechanism",
    "5.3.3": "Updates simple to apply",
    "5.3.7": "Best practice crypto for updates",
    "5.3.8": "Timely security updates",
    "5.3.10": "Verify update authenticity",
    "5.3.13": "Publish support period",
    "5.3.16": "Recognizable model designation",
    "5.4.1": "Securely store sensitive params",
    "5.4.3": "No hard-coded credentials",
    "5.4.4": "Unique credentials per device",
    "5.5.1": "Best practice crypto for communication",
    "5.5.6": "Encrypt critical params in transit",
    "5.5.7": "Protect confidentiality of critical params",
    "5.6.2": "Minimize unauth information disclosure",
    "5.7.1": "Verify software integrity (secure boot)",
    "5.7.2": "Alert on unauthorized software change",
    "5.8.1": "Confidentiality of personal data in transit",
    "5.8.2": "Confidentiality of sensitive personal data",
    "5.11.1": "Easy user data erasure from device",
    "5.11.2": "Easy user data deletion from services",
    "6.1": "Transparent info on personal data",
    "6.2": "Obtain valid consent for data processing",
    "6.4": "Limit personal data processing",
    "6.5": "Inform user on telemetry data collection"
};

export default function EtsiProvisionCard({ groupTitle, provisions, assessment, onInputChange }) {
    return (
        <AccordionItem value={groupTitle} className="glass-effect border border-slate-700/80 rounded-lg">
            <AccordionTrigger className="p-4 text-white hover:no-underline">
                <span className="text-lg font-semibold">{groupTitle}</span>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
                <div className="space-y-6">
                    {provisions.map(provisionKey => {
                        const complianceField = `provision_${provisionKey.replace(/\./g, '_')}`;
                        const detailField = `${complianceField}_detail`;

                        return (
                            <div key={provisionKey} className="p-4 bg-slate-800/40 rounded-md border border-slate-700">
                                <Label className="text-gray-300 font-medium text-base mb-3 block">
                                    {provisionKey} - {provisionTitles[provisionKey] || "Unknown Provision"}
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <Select
                                            value={assessment[complianceField] || ""}
                                            onValueChange={(value) => onInputChange(complianceField, value)}
                                        >
                                            <SelectTrigger className="bg-slate-700/50 border-gray-600 text-white">
                                                <SelectValue placeholder="Select compliance status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="compliant">Compliant</SelectItem>
                                                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Textarea
                                            placeholder="Implementation details or justification for N/A..."
                                            value={assessment[detailField] || ""}
                                            onChange={(e) => onInputChange(detailField, e.target.value)}
                                            className="bg-slate-700/50 border-gray-600 text-white min-h-[40px] h-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}