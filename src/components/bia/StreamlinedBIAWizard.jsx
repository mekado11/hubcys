import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

export default function StreamlinedBIAWizard({ initialData, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'Critical Function',
    type: initialData?.type || 'Application',
    
    // Impact & Tolerance
    rto_hours: initialData?.rto_hours || 24,
    rpo_hours: initialData?.rpo_hours || 4,
    mtd_hours: initialData?.mtd_hours || 72,
    
    // Impact Scores (1-5)
    financial_impact: initialData?.financial_impact || 3,
    operational_impact: initialData?.operational_impact || 3,
    reputational_impact: initialData?.reputational_impact || 3,
    compliance_impact: initialData?.compliance_impact || 3,
    
    // Advanced (optional)
    revenue_loss_per_hour: initialData?.revenue_loss_per_hour || 0,
    recovery_cost: initialData?.recovery_cost || 0,
    
    ...initialData
  });

  const updateField = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(data);
  };

  const impactLabels = {
    1: 'Minimal',
    2: 'Low',
    3: 'Medium',
    4: 'High',
    5: 'Critical'
  };

  return (
    <Card className="glass-effect border-cyan-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>BIA Wizard - Step {step} of 3</span>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full ${
                  s === step ? 'bg-cyan-500' : s < step ? 'bg-green-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Step 1: Scope */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Define Scope</h3>
            
            <div>
              <Label>Function/Asset Name</Label>
              <Input
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Payment Processing System"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={data.category} onValueChange={(v) => updateField('category', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical Function">Critical Function</SelectItem>
                  <SelectItem value="Support Function">Support Function</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Data Asset">Data Asset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={data.type} onValueChange={(v) => updateField('type', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Application">Application</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Process">Process</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Data">Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Impact & Tolerance */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Impact & Recovery Tolerance</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>RTO (Recovery Time Objective)</Label>
                <Input
                  type="number"
                  value={data.rto_hours}
                  onChange={(e) => updateField('rto_hours', Number(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Hours to restore</p>
              </div>

              <div>
                <Label>RPO (Recovery Point Objective)</Label>
                <Input
                  type="number"
                  value={data.rpo_hours}
                  onChange={(e) => updateField('rpo_hours', Number(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Max data loss (hours)</p>
              </div>

              <div>
                <Label>MTD (Maximum Tolerable Downtime)</Label>
                <Input
                  type="number"
                  value={data.mtd_hours}
                  onChange={(e) => updateField('mtd_hours', Number(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Absolute maximum (hours)</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="font-semibold text-white">Impact Assessment (1-5 scale)</h4>
              
              <div>
                <Label>Financial Impact: {impactLabels[data.financial_impact]}</Label>
                <Slider
                  value={[data.financial_impact]}
                  onValueChange={([v]) => updateField('financial_impact', v)}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Operational Impact: {impactLabels[data.operational_impact]}</Label>
                <Slider
                  value={[data.operational_impact]}
                  onValueChange={([v]) => updateField('operational_impact', v)}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Reputational Impact: {impactLabels[data.reputational_impact]}</Label>
                <Slider
                  value={[data.reputational_impact]}
                  onValueChange={([v]) => updateField('reputational_impact', v)}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Compliance/Legal Impact: {impactLabels[data.compliance_impact]}</Label>
                <Slider
                  value={[data.compliance_impact]}
                  onValueChange={([v]) => updateField('compliance_impact', v)}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Advanced Options */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Review & Complete</h3>
            
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Function:</span>
                <span className="text-white font-medium">{data.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-white">{data.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RTO:</span>
                <span className="text-white">{data.rto_hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RPO:</span>
                <span className="text-white">{data.rpo_hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">MTD:</span>
                <span className="text-white">{data.mtd_hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Impact:</span>
                <span className="text-white">
                  {impactLabels[Math.round((data.financial_impact + data.operational_impact + data.reputational_impact + data.compliance_impact) / 4)]}
                </span>
              </div>
            </div>

            <details className="bg-slate-800/30 rounded-lg p-4">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                Advanced Options (Optional)
              </summary>
              <div className="mt-4 space-y-3">
                <div>
                  <Label>Revenue Loss per Hour ($)</Label>
                  <Input
                    type="number"
                    value={data.revenue_loss_per_hour}
                    onChange={(e) => updateField('revenue_loss_per_hour', Number(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label>Estimated Recovery Cost ($)</Label>
                  <Input
                    type="number"
                    value={data.recovery_cost}
                    onChange={(e) => updateField('recovery_cost', Number(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            onClick={step === 1 ? onCancel : handleBack}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 && !data.name}
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}