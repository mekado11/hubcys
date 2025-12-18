import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Assessment } from "@/entities/Assessment";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Loader2, ChevronRight, Edit, Trash2, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { createPageUrl } from '@/utils';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MyAssessmentsList({ 
  limit,
  statusFilter,
  onSelectAssessment,
  selectedAssessmentId,
  headerComponent,
  emptyStateComponent,
  cardClassName = "glass-effect border-cyan-500/30",
  onAssessmentDeleted
}) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const me = await User.me();
      
      // Build filter based on statusFilter prop
      const filter = { company_id: me.company_id };
      if (statusFilter && statusFilter !== 'all') {
        filter.status = statusFilter;
      }
      
      const rows = await Assessment.filter(filter, "-updated_date", limit);
      setAssessments(rows || []);
    } catch (e) {
      console.error("MyAssessmentsList: load error", e);
      setAssessments([]);
      toast.error("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, [statusFilter, limit]);

  const handleDeleteClick = (assessment, e) => {
    e.stopPropagation();
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assessmentToDelete) return;
    
    setDeleting(true);
    try {
      await Assessment.delete(assessmentToDelete.id);
      toast.success(`Assessment "${assessmentToDelete.company_name || 'Assessment'}" deleted successfully`);
      
      // Remove from local state
      setAssessments(prev => prev.filter(a => a.id !== assessmentToDelete.id));
      
      // Notify parent component if callback provided
      if (onAssessmentDeleted) {
        onAssessmentDeleted(assessmentToDelete.id);
      }
      
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    } catch (error) {
      console.error("Error deleting assessment:", error);
      toast.error("Failed to delete assessment. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAssessmentToDelete(null);
  };

  const StatusBadge = ({ status }) => {
    if (status === "completed") {
      return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Completed</Badge>;
    }
    if (status === "draft") {
      return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Draft</Badge>;
    }
    if (status === "archived") {
      return <Badge className="bg-slate-600/30 text-slate-300 border-slate-500/30">Archived</Badge>;
    }
    return <Badge className="bg-slate-600/30 text-slate-300 border-slate-500/30">{status || "Unknown"}</Badge>;
  };

  return (
    <>
      <Card className={cardClassName}>
        {headerComponent || (
          <CardHeader>
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-3 text-cyan-300" />
              <CardTitle className="text-xl font-bold text-cyan-300">Your Assessments</CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : assessments.length === 0 ? (
            emptyStateComponent || (
              <div className="text-center py-16">
                <p className="text-gray-400">No assessments found. Start a new one to see it here.</p>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-cyan-300">Assessment Name</TableHead>
                    <TableHead className="text-cyan-300">Status</TableHead>
                    <TableHead className="text-cyan-300">Last Updated</TableHead>
                    <TableHead className="text-cyan-300">Score</TableHead>
                    <TableHead className="text-cyan-300">Maturity Level</TableHead>
                    <TableHead className="text-right text-cyan-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map(a => {
                    const lastUpdated = a.updated_date || a.created_date;
                    let formattedDate = "";
                    try {
                      formattedDate = lastUpdated ? format(parseISO(lastUpdated), "PP p") : "";
                    } catch {
                      formattedDate = lastUpdated ? new Date(lastUpdated).toLocaleString() : "";
                    }

                    const isSelected = onSelectAssessment && selectedAssessmentId === a.id;

                    return (
                      <TableRow
                        key={a.id}
                        className={`transition-colors duration-200 ${
                          isSelected 
                            ? 'bg-cyan-500/10 hover:bg-cyan-500/15' 
                            : 'hover:bg-slate-800/50'
                        } ${onSelectAssessment ? 'cursor-pointer' : ''}`}
                        onClick={() => onSelectAssessment && onSelectAssessment(a)}
                      >
                        <TableCell className="font-medium text-white max-w-[200px] truncate">
                          {a.company_name || "Assessment"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            {formattedDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          {typeof a.overall_score === "number" && (
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {a.overall_score}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {a.maturity_level && (
                            <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {a.maturity_level}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(createPageUrl("Assessment") + `?id=${a.id}`);
                              }}
                              title="Edit Assessment"
                              className="text-gray-400 hover:text-cyan-400"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteClick(a, e)}
                              title="Delete Assessment"
                              className="text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(createPageUrl("ProfessionalReportView") + `?id=${a.id}`);
                              }}
                              title="View Report"
                              className="text-gray-400 hover:text-cyan-400"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-5 h-5" />
              Delete Assessment
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete this assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {assessmentToDelete && (
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Assessment:</span>
                <span className="text-white font-medium">{assessmentToDelete.company_name || "Assessment"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <StatusBadge status={assessmentToDelete.status} />
              </div>
              {assessmentToDelete.overall_score != null && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Score:</span>
                  <span className="text-white">{assessmentToDelete.overall_score}%</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleting}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Assessment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}