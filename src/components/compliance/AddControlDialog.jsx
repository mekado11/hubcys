import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ComplianceControl } from '@/entities/ComplianceControl';
import { Loader2, Plus, Edit } from 'lucide-react';

export default function AddControlDialog({ 
  isOpen, 
  onOpenChange, 
  frameworkId, 
  onSave,
  existingControl 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!existingControl;

  const getInitialState = () => ({
    control_id: '',
    control_name: '',
    control_description: '',
    control_category: '',
    criticality: 'Medium',
    maturity_score: 0,
    implementation_status: 'Not Started',
    owner_email: '',
    notes: ''
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (isOpen) {
      if (existingControl) {
        setFormData({ ...getInitialState(), ...existingControl });
      } else {
        setFormData(getInitialState());
      }
    }
  }, [isOpen, existingControl]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.control_id || !formData.control_name) return;
    if (!isEditMode && !frameworkId) return;

    setIsLoading(true);
    try {
      if (isEditMode) {
        await ComplianceControl.update(existingControl.id, formData);
      } else {
        await ComplianceControl.create({
          framework_id: frameworkId,
          ...formData
        });
      }
      if (onSave) onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving control:', error);
      alert('Failed to save control. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 flex items-center">
            {isEditMode ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {isEditMode ? 'Edit Control' : 'Add New Control'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="control_id" className="text-gray-300">Control ID *</Label>
              <Input
                id="control_id"
                value={formData.control_id}
                onChange={(e) => handleInputChange('control_id', e.target.value)}
                placeholder="e.g., A.5.1.1, CC6.1, AC-2"
                className="bg-slate-800 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="control_category" className="text-gray-300">Category</Label>
              <Input
                id="control_category"
                value={formData.control_category}
                onChange={(e) => handleInputChange('control_category', e.target.value)}
                placeholder="e.g., Access Control, Encryption"
                className="bg-slate-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="control_name" className="text-gray-300">Control Name *</Label>
            <Input
              id="control_name"
              value={formData.control_name}
              onChange={(e) => handleInputChange('control_name', e.target.value)}
              placeholder="e.g., User Access Management, Data Encryption"
              className="bg-slate-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="control_description" className="text-gray-300">Description</Label>
            <Textarea
              id="control_description"
              value={formData.control_description}
              onChange={(e) => handleInputChange('control_description', e.target.value)}
              placeholder="Detailed description of what this control requires..."
              className="bg-slate-800 border-gray-600 text-white placeholder-gray-400 h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="criticality" className="text-gray-300">Criticality</Label>
              <Select 
                value={formData.criticality} 
                onValueChange={(value) => handleInputChange('criticality', value)}
              >
                <SelectTrigger className="bg-slate-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  <SelectItem value="Low" className="text-white">Low</SelectItem>
                  <SelectItem value="Medium" className="text-white">Medium</SelectItem>
                  <SelectItem value="High" className="text-white">High</SelectItem>
                  <SelectItem value="Critical" className="text-white">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maturity_score" className="text-gray-300">Initial Maturity Score</Label>
              <Select 
                value={formData.maturity_score.toString()} 
                onValueChange={(value) => handleInputChange('maturity_score', parseInt(value))}
              >
                <SelectTrigger className="bg-slate-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  <SelectItem value="0" className="text-white">0 - Not Implemented</SelectItem>
                  <SelectItem value="1" className="text-white">1 - Planned</SelectItem>
                  <SelectItem value="2" className="text-white">2 - Partial</SelectItem>
                  <SelectItem value="3" className="text-white">3 - Implemented</SelectItem>
                  <SelectItem value="4" className="text-white">4 - Reviewed</SelectItem>
                  <SelectItem value="5" className="text-white">5 - Monitored & Improved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="implementation_status" className="text-gray-300">Status</Label>
              <Select 
                value={formData.implementation_status} 
                onValueChange={(value) => handleInputChange('implementation_status', value)}
              >
                <SelectTrigger className="bg-slate-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  <SelectItem value="Not Started" className="text-white">Not Started</SelectItem>
                  <SelectItem value="In Progress" className="text-white">In Progress</SelectItem>
                  <SelectItem value="Implemented" className="text-white">Implemented</SelectItem>
                  <SelectItem value="Needs Improvement" className="text-white">Needs Improvement</SelectItem>
                  <SelectItem value="Not Applicable" className="text-white">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_email" className="text-gray-300">Owner Email</Label>
            <Input
              id="owner_email"
              type="email"
              value={formData.owner_email}
              onChange={(e) => handleInputChange('owner_email', e.target.value)}
              placeholder="e.g., john.doe@company.com"
              className="bg-slate-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-300">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or comments..."
              className="bg-slate-800 border-gray-600 text-white placeholder-gray-400 h-20"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.control_id || !formData.control_name}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {isEditMode ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isEditMode ? 'Save Changes' : 'Create Control'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}