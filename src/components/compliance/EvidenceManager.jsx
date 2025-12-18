import React, { useState, useEffect } from 'react';
import { Evidence } from '@/entities/Evidence';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Trash2, 
  Edit, 
  Calendar, 
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { UploadFile } from '@/integrations/Core';

export default function EvidenceManager({ controlId, controlName }) {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formState, setFormState] = useState({
    evidence_name: '',
    evidence_type: 'Document',
    description: '',
    collection_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    status: 'Current',
    file_url: '',
    automated_source: ''
  });

  useEffect(() => {
    loadData();
  }, [controlId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const evidenceData = await Evidence.filter({ control_id: controlId });
      setEvidences(evidenceData);
    } catch (error) {
      console.error('Error loading evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await UploadFile({ file });
      setFormState(prev => ({ ...prev, file_url: data.file_url }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEvidence = async () => {
    try {
      const dataToSave = {
        ...formState,
        control_id: controlId,
        collected_by: currentUser.email
      };

      if (editingEvidence) {
        await Evidence.update(editingEvidence.id, dataToSave);
      } else {
        await Evidence.create(dataToSave);
      }
      
      setShowDialog(false);
      setEditingEvidence(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving evidence:', error);
      alert('Error saving evidence. Please try again.');
    }
  };

  const handleDeleteEvidence = async (id) => {
    try {
      await Evidence.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting evidence:', error);
      alert('Error deleting evidence. Please try again.');
    }
  };

  const resetForm = () => {
    setFormState({
      evidence_name: '',
      evidence_type: 'Document',
      description: '',
      collection_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      status: 'Current',
      file_url: '',
      automated_source: ''
    });
  };

  const openEditDialog = (evidence) => {
    setEditingEvidence(evidence);
    setFormState({
      evidence_name: evidence.evidence_name || '',
      evidence_type: evidence.evidence_type || 'Document',
      description: evidence.description || '',
      collection_date: evidence.collection_date || new Date().toISOString().split('T')[0],
      expiration_date: evidence.expiration_date || '',
      status: evidence.status || 'Current',
      file_url: evidence.file_url || '',
      automated_source: evidence.automated_source || ''
    });
    setShowDialog(true);
  };

  const openNewDialog = () => {
    setEditingEvidence(null);
    resetForm();
    setShowDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Current': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Approved': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Under Review': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Expired': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Needs Update': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Current': return <CheckCircle className="w-4 h-4" />;
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Under Review': return <Clock className="w-4 h-4" />;
      case 'Expired': return <AlertTriangle className="w-4 h-4" />;
      case 'Needs Update': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Document': return <FileText className="w-4 h-4" />;
      case 'Screenshot': return <FileText className="w-4 h-4" />;
      case 'Configuration': return <FileText className="w-4 h-4" />;
      case 'Policy': return <FileText className="w-4 h-4" />;
      case 'Procedure': return <FileText className="w-4 h-4" />;
      case 'Report': return <FileText className="w-4 h-4" />;
      case 'Certificate': return <FileText className="w-4 h-4" />;
      case 'Audit_Log': return <FileText className="w-4 h-4" />;
      case 'Code_Review': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-cyan-300">Evidence Collection</h3>
          <p className="text-sm text-gray-400">Manage evidence for: {controlName}</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={openNewDialog}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Evidence
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-effect border-cyan-500/20 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEvidence ? 'Edit' : 'Add'} Evidence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Evidence Name</label>
                  <Input
                    value={formState.evidence_name}
                    onChange={(e) => handleFormChange('evidence_name', e.target.value)}
                    placeholder="e.g., Access Control Policy v2.1"
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Evidence Type</label>
                  <Select value={formState.evidence_type} onValueChange={(value) => handleFormChange('evidence_type', value)}>
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600">
                      <SelectItem value="Document" className="text-white">Document</SelectItem>
                      <SelectItem value="Screenshot" className="text-white">Screenshot</SelectItem>
                      <SelectItem value="Configuration" className="text-white">Configuration</SelectItem>
                      <SelectItem value="Policy" className="text-white">Policy</SelectItem>
                      <SelectItem value="Procedure" className="text-white">Procedure</SelectItem>
                      <SelectItem value="Report" className="text-white">Report</SelectItem>
                      <SelectItem value="Certificate" className="text-white">Certificate</SelectItem>
                      <SelectItem value="Audit_Log" className="text-white">Audit Log</SelectItem>
                      <SelectItem value="Code_Review" className="text-white">Code Review</SelectItem>
                      <SelectItem value="Other" className="text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Description</label>
                <Textarea
                  value={formState.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe what this evidence demonstrates"
                  className="bg-slate-800/50 border-gray-600 text-white h-24"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Upload File</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                  {uploading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>}
                </div>
                {formState.file_url && (
                  <div className="mt-2 text-sm text-green-400">
                    ✓ File uploaded successfully
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Collection Date</label>
                  <Input
                    type="date"
                    value={formState.collection_date}
                    onChange={(e) => handleFormChange('collection_date', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Expiration Date (Optional)</label>
                  <Input
                    type="date"
                    value={formState.expiration_date}
                    onChange={(e) => handleFormChange('expiration_date', e.target.value)}
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Status</label>
                  <Select value={formState.status} onValueChange={(value) => handleFormChange('status', value)}>
                    <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-gray-600">
                      <SelectItem value="Current" className="text-white">Current</SelectItem>
                      <SelectItem value="Expired" className="text-white">Expired</SelectItem>
                      <SelectItem value="Needs Update" className="text-white">Needs Update</SelectItem>
                      <SelectItem value="Under Review" className="text-white">Under Review</SelectItem>
                      <SelectItem value="Approved" className="text-white">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-300">Automated Source (Optional)</label>
                  <Input
                    value={formState.automated_source}
                    onChange={(e) => handleFormChange('automated_source', e.target.value)}
                    placeholder="e.g., AWS Config, Okta"
                    className="bg-slate-800/50 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} className="border-gray-600 text-gray-300">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEvidence} 
                disabled={!formState.evidence_name || !formState.evidence_type}
                className="bg-gradient-to-r from-cyan-500 to-purple-500"
              >
                {editingEvidence ? 'Update' : 'Create'} Evidence
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Evidence List */}
      <div className="space-y-3">
        {evidences.length === 0 ? (
          <Card className="glass-effect border-gray-500/20">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Evidence Added</h3>
              <p className="text-gray-500 mb-4">
                Start building your compliance evidence collection for this control.
              </p>
              <Button 
                onClick={openNewDialog}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Evidence
              </Button>
            </CardContent>
          </Card>
        ) : (
          evidences.map((evidence) => (
            <Card key={evidence.id} className="glass-effect border-gray-700/50 hover:border-cyan-500/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getTypeIcon(evidence.evidence_type)}
                      <h4 className="font-semibold text-white">{evidence.evidence_name}</h4>
                      <Badge className={`${getStatusColor(evidence.status)} border flex items-center`}>
                        {getStatusIcon(evidence.status)}
                        <span className="ml-1">{evidence.status}</span>
                      </Badge>
                      <Badge variant="outline" className="text-cyan-300 border-cyan-500/30">
                        {evidence.evidence_type}
                      </Badge>
                    </div>
                    
                    {evidence.description && (
                      <p className="text-gray-400 mb-3">{evidence.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Collected: {format(new Date(evidence.collection_date), 'MMM d, yyyy')}
                      </div>
                      {evidence.expiration_date && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Expires: {format(new Date(evidence.expiration_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {evidence.collected_by && (
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          {evidence.collected_by}
                        </div>
                      )}
                      {evidence.automated_source && (
                        <div className="text-purple-400">
                          Auto: {evidence.automated_source}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {evidence.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(evidence.file_url, '_blank')}
                        className="text-gray-400 hover:text-cyan-400"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(evidence)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-effect border-red-500/30 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Evidence?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            This will permanently delete "{evidence.evidence_name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-700 border-slate-600 hover:bg-slate-600">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteEvidence(evidence.id)} 
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}