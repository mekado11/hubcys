import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, AlertTriangle, MapPin, Building2 } from 'lucide-react';
import TooltipInfo from '../ui/TooltipInfo';

// Default incident to {} and guard all reads with optional chaining.
export default function NIS2ComplianceSection({ incident: incidentProp, onUpdate, readOnly = false }) {
  const incident = incidentProp || {};

  const handleDateTimeUpdate = (field, value) => {
    if (value) {
      const isoString = new Date(value).toISOString();
      onUpdate && onUpdate(field, isoString);
    } else {
      onUpdate && onUpdate(field, "");
    }
  };

  const formatDateTimeForInput = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const getTimeSinceDetection = (notificationTime) => {
    if (!incident?.detection_timestamp || !notificationTime) return null;
    try {
      const detectionTime = new Date(incident.detection_timestamp);
      const notifyTime = new Date(notificationTime);
      const diffHours = Math.abs(notifyTime - detectionTime) / (1000 * 60 * 60);
      return diffHours.toFixed(1);
    } catch {
      return null;
    }
  };

  const getNotificationStatus = (notificationTime, hoursLimit) => {
    const hours = getTimeSinceDetection(notificationTime);
    if (!hours) return null;
    return parseFloat(hours) <= hoursLimit ? 'On Time' : 'Overdue';
  };

  return (
    <Card className="glass-effect border-yellow-500/20">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          NIS2 Directive Compliance
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Track incident significance and notification obligations under the EU NIS2 Directive
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Significance Assessment */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h4 className="font-semibold text-white">Incident Significance Assessment</h4>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nis2_significance" className="text-gray-300 flex items-center">
              NIS2 Significance Level
              <TooltipInfo text="Assess if this incident meets NIS2 criteria for 'significant impact' requiring notification to authorities." />
            </Label>
            <Select
              value={incident?.nis2_significance ?? "Not Assessed"}
              onValueChange={(value) => onUpdate && onUpdate('nis2_significance', value)}
              disabled={readOnly}
            >
              <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-gray-600">
                <SelectItem value="Not Assessed" className="text-white hover:bg-slate-700 focus:bg-slate-700">Not Assessed</SelectItem>
                <SelectItem value="Not Significant" className="text-white hover:bg-slate-700 focus:bg-slate-700">Not Significant</SelectItem>
                <SelectItem value="Significant" className="text-white hover:bg-slate-700 focus:bg-slate-700">Significant (Requires Notification)</SelectItem>
                <SelectItem value="Not Applicable" className="text-white hover:bg-slate-700 focus:bg-slate-700">Not Applicable (Outside EU)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nis2_affected_services" className="text-gray-300">
              Affected Essential/Important Services
            </Label>
            <Textarea
              id="nis2_affected_services"
              value={incident?.nis2_affected_services || ""}
              onChange={(e) => onUpdate && onUpdate('nis2_affected_services', e.target.value)}
              placeholder="List the essential or important services (as defined by NIS2) that are affected by this incident..."
              className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-20"
              disabled={readOnly}
            />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="nis2_cross_border"
              checked={Boolean(incident?.nis2_cross_border_impact)}
              onCheckedChange={(checked) => onUpdate && onUpdate('nis2_cross_border_impact', Boolean(checked))}
              disabled={readOnly}
              className="data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-500"
            />
            <Label htmlFor="nis2_cross_border" className="text-gray-300 cursor-pointer">
              Cross-border impact (affects multiple EU member states)
            </Label>
          </div>
        </div>

        {/* Notification Timeline */}
        {incident?.nis2_significance === 'Significant' ? (
          <div className="space-y-4 border-t border-gray-700/50 pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <h4 className="font-semibold text-white">NIS2 Notification Timeline</h4>
            </div>

            {/* 24-hour Initial Notification */}
            <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="text-sm font-medium text-yellow-300">Initial Notification (24 Hours)</h5>
                {incident?.nis2_initial_notification_sent_at && (
                  <Badge className={`${
                    getNotificationStatus(incident?.nis2_initial_notification_sent_at, 24) === 'On Time' 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {getNotificationStatus(incident?.nis2_initial_notification_sent_at, 24)} 
                    ({getTimeSinceDetection(incident?.nis2_initial_notification_sent_at)}h after detection)
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300 text-xs">Notification Sent At</Label>
                <Input
                  type="datetime-local"
                  value={formatDateTimeForInput(incident?.nis2_initial_notification_sent_at)}
                  onChange={(e) => handleDateTimeUpdate('nis2_initial_notification_sent_at', e.target.value)}
                  className="bg-slate-700/50 border-gray-600 text-white text-sm"
                  disabled={readOnly}
                />
              </div>
            </div>

            {/* 72-hour Interim Update */}
            <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="text-sm font-medium text-yellow-300">Interim Update (72 Hours)</h5>
                {incident?.nis2_interim_update_sent_at && (
                  <Badge className={`${
                    getNotificationStatus(incident?.nis2_interim_update_sent_at, 72) === 'On Time' 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {getNotificationStatus(incident?.nis2_interim_update_sent_at, 72)} 
                    ({getTimeSinceDetection(incident?.nis2_interim_update_sent_at)}h after detection)
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300 text-xs">Update Sent At</Label>
                <Input
                  type="datetime-local"
                  value={formatDateTimeForInput(incident?.nis2_interim_update_sent_at)}
                  onChange={(e) => handleDateTimeUpdate('nis2_interim_update_sent_at', e.target.value)}
                  className="bg-slate-700/50 border-gray-600 text-white text-sm"
                  disabled={readOnly}
                />
              </div>
            </div>

            {/* Final Report (1 Month) */}
            <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="text-sm font-medium text-yellow-300">Final Report (1 Month)</h5>
                {incident?.nis2_final_report_sent_at && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Submitted
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300 text-xs">Final Report Sent At</Label>
                <Input
                  type="datetime-local"
                  value={formatDateTimeForInput(incident?.nis2_final_report_sent_at)}
                  onChange={(e) => handleDateTimeUpdate('nis2_final_report_sent_at', e.target.value)}
                  className="bg-slate-700/50 border-gray-600 text-white text-sm"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 px-4 bg-slate-800/30 rounded-lg border border-gray-700/50">
             <p className="text-sm text-gray-400">
               {incident?.nis2_significance === 'Not Applicable' 
                 ? 'NIS2 compliance requirements do not apply to this organization.'
                 : 'NIS2 notification timeline is only required for incidents assessed as \'Significant\'.'}
             </p>
          </div>
        )}

        {/* Notified Authorities */}
        <div className="space-y-2">
          <Label htmlFor="nis2_notified_authorities" className="text-gray-300 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Notified Authorities
          </Label>
          <Textarea
            id="nis2_notified_authorities"
            value={incident?.nis2_notified_authorities || ""}
            onChange={(e) => onUpdate && onUpdate('nis2_notified_authorities', e.target.value)}
            placeholder="List CSIRTs, competent authorities, and other regulatory bodies notified (include contact methods and confirmation details)..."
            className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400 h-24"
            disabled={readOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
}