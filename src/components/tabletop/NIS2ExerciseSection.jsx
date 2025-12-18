import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle, Globe, Users } from 'lucide-react';
import TooltipInfo from '../ui/TooltipInfo';

export default function NIS2ExerciseSection({ exercise, onUpdate, readOnly = false }) {
  return (
    <Card className="glass-effect border-yellow-500/20">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          NIS2 Directive Focus
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Configure this tabletop exercise to test NIS2 compliance capabilities
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Essential Services */}
        <div className="space-y-2">
          <Label htmlFor="nis2_essential_services" className="text-gray-300 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Essential/Important Services Scope
            <TooltipInfo text="Define which essential or important services (under NIS2) will be simulated as affected in this exercise." />
          </Label>
          <Textarea
            id="nis2_essential_services"
            value={exercise.nis2_essential_services || ""}
            onChange={(e) => onUpdate('nis2_essential_services', e.target.value)}
            placeholder="e.g., 'Digital service delivery platform (essential service under NIS2)', 'Customer data processing systems', 'Payment processing infrastructure'..."
            className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-24"
            disabled={readOnly}
          />
        </div>

        {/* Notification Procedures */}
        <div className="space-y-2">
          <Label htmlFor="nis2_notification_procedures" className="text-gray-300 flex items-center">
            <Users className="w-4 h-4 mr-1" />
            Current NIS2 Notification Procedures
            <TooltipInfo text="Document your organization's current procedures for NIS2 incident notification. This will be tested during the exercise." />
          </Label>
          <Textarea
            id="nis2_notification_procedures"
            value={exercise.nis2_notification_procedures || ""}
            onChange={(e) => onUpdate('nis2_notification_procedures', e.target.value)}
            placeholder="e.g., 'CISO assesses significance within 2 hours. If significant, legal team contacts national CSIRT within 24 hours using secure portal. Interim update prepared by security team and sent within 72 hours...'..."
            className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-32"
            disabled={readOnly}
          />
        </div>

        {/* Cross-border Considerations */}
        <div className="space-y-2">
          <Label htmlFor="nis2_cross_border_considerations" className="text-gray-300 flex items-center">
            <Globe className="w-4 h-4 mr-1" />
            Cross-Border Impact Considerations
            <TooltipInfo text="How does your organization assess and handle incidents that may have cross-border impact across EU member states?" />
          </Label>
          <Textarea
            id="nis2_cross_border_considerations"
            value={exercise.nis2_cross_border_considerations || ""}
            onChange={(e) => onUpdate('nis2_cross_border_considerations', e.target.value)}
            placeholder="e.g., 'We serve customers in Germany, France, and Netherlands. Legal team has contact details for relevant CSIRTs. Cross-border assessment checklist exists but hasn't been tested...'..."
            className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-24"
            disabled={readOnly}
          />
        </div>

        {/* Supply Chain Dependencies */}
        <div className="space-y-2">
          <Label htmlFor="nis2_supply_chain_dependencies" className="text-gray-300">
            Key Supply Chain Dependencies to Test
          </Label>
          <Textarea
            id="nis2_supply_chain_dependencies"
            value={exercise.nis2_supply_chain_dependencies || ""}
            onChange={(e) => onUpdate('nis2_supply_chain_dependencies', e.target.value)}
            placeholder="e.g., 'AWS (primary cloud provider), Okta (identity), Salesforce (CRM), Stripe (payments). Exercise should test communication with these vendors during an incident...'..."
            className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-24"
            disabled={readOnly}
          />
        </div>

        {/* Exercise Results (only show if exercise is completed) */}
        {exercise.status === 'Completed' && (
          <div className="border-t border-gray-700/50 pt-6 space-y-4">
            <h4 className="font-semibold text-yellow-300 flex items-center">
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 mr-2">
                Exercise Results
              </Badge>
              NIS2 Compliance Assessment
            </h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nis2_notification_simulation" className="text-gray-300 text-sm">
                  Notification Procedures Performance
                </Label>
                <Textarea
                  id="nis2_notification_simulation"
                  value={exercise.nis2_notification_simulation || ""}
                  onChange={(e) => onUpdate('nis2_notification_simulation', e.target.value)}
                  placeholder="How effectively did participants simulate the NIS2 notification procedures?..."
                  className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-20"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nis2_cross_border_simulation" className="text-gray-300 text-sm">
                  Cross-Border Impact Assessment
                </Label>
                <Textarea
                  id="nis2_cross_border_simulation"
                  value={exercise.nis2_cross_border_simulation || ""}
                  onChange={(e) => onUpdate('nis2_cross_border_simulation', e.target.value)}
                  placeholder="How well did the team assess and handle cross-border implications?..."
                  className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-20"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nis2_supply_chain_response" className="text-gray-300 text-sm">
                  Supply Chain Response
                </Label>
                <Textarea
                  id="nis2_supply_chain_response"
                  value={exercise.nis2_supply_chain_response || ""}
                  onChange={(e) => onUpdate('nis2_supply_chain_response', e.target.value)}
                  placeholder="How effectively did the team manage supply chain aspects during the exercise?..."
                  className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-20"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nis2_compliance_gaps" className="text-gray-300 text-sm">
                  Identified NIS2 Compliance Gaps
                </Label>
                <Textarea
                  id="nis2_compliance_gaps"
                  value={exercise.nis2_compliance_gaps || ""}
                  onChange={(e) => onUpdate('nis2_compliance_gaps', e.target.value)}
                  placeholder="What specific gaps were identified related to NIS2 compliance requirements?..."
                  className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-24"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}