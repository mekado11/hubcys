import React, { useState, useEffect } from 'react';
import { ComplianceControl } from '@/entities/ComplianceControl';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, List, Edit, Trash2 } from 'lucide-react';
import AddControlDialog from '../compliance/AddControlDialog';
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
} from "@/components/ui/alert-dialog";

const ControlListItem = ({ control, onEdit, onDelete }) => (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-gray-700/50">
        <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{control.control_id}: {control.control_name}</p>
            <p className="text-sm text-gray-400 capitalize">{control.criticality} Criticality</p>
        </div>
        <div className="ml-4 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(control)} className="text-gray-400 hover:text-white">
                <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-effect border-red-500/30 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-300">Delete Control?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to delete this control: "{control.control_id} - {control.control_name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 border-slate-600 hover:bg-slate-600">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(control.id)} className="bg-red-600 hover:bg-red-700">
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
);


export default function InlineControlManager({ frameworkId }) {
    const [controls, setControls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingControl, setEditingControl] = useState(null);

    useEffect(() => {
        if (frameworkId) {
            fetchControls();
        }
    }, [frameworkId]);

    const fetchControls = async () => {
        setLoading(true);
        try {
            const controlsData = await ComplianceControl.filter({ framework_id: frameworkId }, "-created_date");
            setControls(controlsData || []);
        } catch (error) {
            console.error("Failed to fetch controls:", error);
            setControls([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (control) => {
        setEditingControl(control);
        setShowAddDialog(true);
    };

    const handleDelete = async (controlId) => {
        try {
            await ComplianceControl.delete(controlId);
            fetchControls();
        } catch (error) {
            console.error("Failed to delete control:", error);
            alert("Could not delete control. Please try again.");
        }
    };
    
    const handleDialogClose = () => {
        setEditingControl(null);
        setShowAddDialog(false);
    };


    if (loading) {
        return <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-cyan-400" /></div>;
    }

    return (
        <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg">
            <div className="flex justify-end">
                <Button onClick={() => { setEditingControl(null); setShowAddDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Control
                </Button>
            </div>

            {controls.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {controls.map(control => (
                        <ControlListItem key={control.id} control={control} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <List className="w-10 h-10 mx-auto mb-2" />
                    <p>No controls have been added for this framework yet.</p>
                </div>
            )}
            
            <AddControlDialog
                isOpen={showAddDialog}
                onOpenChange={handleDialogClose}
                frameworkId={frameworkId}
                onSave={fetchControls}
                existingControl={editingControl}
            />
        </div>
    );
}