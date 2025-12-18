import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, Network, Database } from 'lucide-react';

export default function PCISpecificFields({ data, onUpdate }) {
  const handleChange = (field, value) => {
    onUpdate(field, value);
  };

  return (
    <Card className="glass-effect border-green-500/20 mt-6">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          PCI DSS Specific Assessment
          <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
            Payment Card Industry
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cardholder Data Environment Scope */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Database className="w-4 h-4 inline mr-1" />
            Cardholder Data Environment (CDE) Scope & Systems
          </label>
          <Textarea
            value={data.pci_cde_scope || ''}
            onChange={(e) => handleChange('pci_cde_scope', e.target.value)}
            placeholder="Describe all systems, networks, and components that store, process, or transmit cardholder data. Include system names, IP ranges, applications, databases, and any connected systems. Be specific about boundaries and segmentation."
            className="bg-slate-800/50 border-gray-600 text-gray-300 min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            PCI DSS Req 1.1.3 - Document all cardholder data flows
          </p>
        </div>

        {/* Network Segmentation */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Network className="w-4 h-4 inline mr-1" />
            Network Segmentation & Access Controls
          </label>
          <Textarea
            value={data.pci_network_segmentation || ''}
            onChange={(e) => handleChange('pci_network_segmentation', e.target.value)}
            placeholder="Detail your network segmentation strategy. How is the CDE isolated from other networks? Describe firewalls, VLANs, access control lists, and any network security controls. Include details about remote access controls and wireless security."
            className="bg-slate-800/50 border-gray-600 text-gray-300 min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            PCI DSS Req 1 & 2 - Build and maintain secure networks and systems
          </p>
        </div>

        {/* Data Protection Measures */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Shield className="w-4 h-4 inline mr-1" />
            Cardholder Data Protection & Encryption
          </label>
          <Textarea
            value={data.pci_data_protection || ''}
            onChange={(e) => handleChange('pci_data_protection', e.target.value)}
            placeholder="Describe how cardholder data is protected at rest and in transit. Include encryption methods, key management processes, data masking/truncation practices, secure deletion procedures, and any tokenization systems in use."
            className="bg-slate-800/50 border-gray-600 text-gray-300 min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            PCI DSS Req 3 & 4 - Protect stored cardholder data & encrypt transmission
          </p>
        </div>

        {/* Vulnerability Management */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Vulnerability Management & Testing Procedures
          </label>
          <Textarea
            value={data.pci_vulnerability_management || ''}
            onChange={(e) => handleChange('pci_vulnerability_management', e.target.value)}
            placeholder="Detail your vulnerability management program. Include information about quarterly external vulnerability scans (ASV), internal scanning procedures, penetration testing schedule, patch management processes, and any security testing tools in use."
            className="bg-slate-800/50 border-gray-600 text-gray-300 min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            PCI DSS Req 11 - Regularly test security systems and processes
          </p>
        </div>

        {/* Access Control & Authentication */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Access Control & Multi-Factor Authentication
          </label>
          <Textarea
            value={data.pci_access_control || ''}
            onChange={(e) => handleChange('pci_access_control', e.target.value)}
            placeholder="Describe access control measures for the CDE. Include user provisioning/de-provisioning processes, role-based access controls, multi-factor authentication implementation, privileged account management, and physical access controls to cardholder data."
            className="bg-slate-800/50 border-gray-600 text-gray-300 min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            PCI DSS Req 7, 8 & 9 - Restrict access, assign unique IDs, restrict physical access
          </p>
        </div>

        {/* Monitoring & Logging */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Security Monitoring & Log Management
          </label>
          <Textarea
            value={data.pci_monitoring_logging || ''}
            onChange={(e) => handleChange('pci_monitoring_logging', e.target.value)}
            placeholder="Detail your security monitoring and logging capabilities. Include log aggregation systems, file integrity monitoring (FIM), security event correlation, log retention policies, and procedures for reviewing logs and responding to alerts."
            className="bg-slate-800/50 border-gray-600 text-gray-300 min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            PCI DSS Req 10 - Track and monitor all access to network resources
          </p>
        </div>

        {/* Compliance Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              PCI DSS Compliance Level
            </label>
            <Select
              value={data.pci_compliance_level || ''}
              onValueChange={(value) => handleChange('pci_compliance_level', value)}
            >
              <SelectTrigger className="bg-slate-800/50 border-gray-600 text-gray-300">
                <SelectValue placeholder="Select compliance level" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-gray-600">
                <SelectItem value="level_1" className="text-white">Level 1 (6M+ transactions annually)</SelectItem>
                <SelectItem value="level_2" className="text-white">Level 2 (1M-6M transactions annually)</SelectItem>
                <SelectItem value="level_3" className="text-white">Level 3 (20K-1M e-commerce annually)</SelectItem>
                <SelectItem value="level_4" className="text-white">Level 4 (Less than 20K e-commerce annually)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last PCI Assessment Date
            </label>
            <Input
              type="date"
              value={data.pci_last_assessment_date || ''}
              onChange={(e) => handleChange('pci_last_assessment_date', e.target.value)}
              className="bg-slate-800/50 border-gray-600 text-gray-300"
            />
          </div>
        </div>

        {/* Current Gaps/Challenges */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current PCI DSS Gaps or Challenges
          </label>
          <Textarea
            value={data.pci_current_gaps || ''}
            onChange={(e) => handleChange('pci_current_gaps', e.target.value)}
            placeholder="Describe any known gaps in your current PCI DSS compliance, areas of concern, or specific challenges you're facing. Include any findings from previous assessments, QSA recommendations, or internal audit results."
            className="bg-slate-800/50 border-gray-600 text-gray-300 min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}