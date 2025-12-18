
import React, { useState, useEffect } from "react";
import { ActionItem } from "@/entities/ActionItem";
import { Assessment } from "@/entities/Assessment";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  User as UserIcon,
  Loader2,
  Lock,
  Target,
  Play,
  CheckCircle2,
  XCircle,
  Trash2,
  MoreVertical,
  Eye,
  Users,
  FileText,
  Activity,
  Gavel // Added Gavel icon for policies
} from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ActionItemDetail from "../components/actionitems/ActionItemDetail";
import { NetworkManager, CachedEntityManager } from '@/components/utils/networkUtils'; // Added CachedEntityManager
import { toast } from "sonner"; // New import for toast notifications

// Simple XSS sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Basic HTML entity encoding to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export default function ActionItemsPage() { // Renamed from ActionItems in outline to match file
  const [actionItems, setActionItems] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: ''
  });

  // New state variables for network resilience
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Kept for existing logic, now derived from currentUser

  const loadData = async (isRetry = false) => { // Renamed from loadPageData as per outline
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    } else {
      setRetryCount(0);
    }

    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      // Load user with caching
      const userData = await CachedEntityManager.get(User, 'me', [], 'actionitems_current_user');
      setCurrentUser(userData);
      setIsAuthenticated(!!userData); // Update isAuthenticated based on userData existence

      if (!userData || !userData.company_id) {
        setLoading(false);
        if (userData && !userData.company_id) {
          // SECURITY FIX: Show generic error message to user
          setError("Your account setup is incomplete. Please contact support.");
          console.error("User account missing company_id:", userData);
        }
        return;
      }
      
      const companyFilter = { company_id: userData.company_id };

      // CRITICAL FIX: Changed from .list() to .filter() to enforce company segregation
      // SECURITY FIX: Using explicit company filtering for better practice
      const itemsData = await CachedEntityManager.get(ActionItem, 'filter', [companyFilter, "-created_date", 50], 'actionitems_list');
      setActionItems(itemsData || []);

      // CRITICAL FIX: Changed from .list() to .filter() to enforce company segregation
      const assessmentsData = await CachedEntityManager.get(Assessment, 'filter', [companyFilter, "-created_date", 20], 'actionitems_assessments');
      setAssessments(assessmentsData || []);

    } catch (err) {
      console.error("Error loading action items:", err);
      // SECURITY FIX: Show generic error to user, log details for developers
      setError("Unable to load your data. Please try again or contact support if the issue persists.");
      setActionItems([]);
      setAssessments([]);
      setCurrentUser(null);
      setIsAuthenticated(false); // Not authenticated if there's an error loading user
    } finally {
      setLoading(false);
    }
  };

  // Helper function to refresh action items list
  const fetchActionItems = async () => {
    // Clear the specific cache for action items to force a re-fetch
    CachedEntityManager.clearCache('actionitems_list');
    // Re-run the main data loading function, which will now fetch fresh action items
    // (and assessments and user data, as per loadData's original scope)
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetry = () => {
    // Clear relevant cache entries before retrying
    CachedEntityManager.clearCache('actionitems_current_user');
    CachedEntityManager.clearCache('actionitems_list');
    CachedEntityManager.clearCache('actionitems_assessments');
    loadData(true);
  };

  // New handleSave function for creating/updating action items
  const handleSave = async (item) => {
    try {
      // SECURITY FIX: Sanitize user inputs before saving
      const sanitizedItem = {
        ...item,
        title: sanitizeInput(item.title),
        description: sanitizeInput(item.description),
        notes: sanitizeInput(item.notes),
        responsible_team: sanitizeInput(item.responsible_team)
      };

      if (sanitizedItem.id) {
        await NetworkManager.retryWithBackoff(() => ActionItem.update(sanitizedItem.id, sanitizedItem));
        toast.success("Action item updated successfully!");
      } else {
        await NetworkManager.retryWithBackoff(() => ActionItem.create(sanitizedItem));
        toast.success("Action item created successfully!");
      }
      setSelectedItem(null); // Go back to list view
      fetchActionItems(); // Refresh the list
    } catch (error) {
      console.error("Error saving action item:", error);
      // SECURITY FIX: Generic error message for user
      toast.error("Unable to save changes. Please try again.");
    }
  };

  // Modified handleStatusUpdate to include toast and refresh
  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      const item = actionItems.find(i => i.id === itemId);
      const updateData = {
        ...item,
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null
      };

      await NetworkManager.retryWithBackoff(() => ActionItem.update(itemId, updateData));
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}!`);
      fetchActionItems(); // Refresh the list
    } catch (error) {
      console.error("Error updating action item status:", error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  // Modified handleDeleteItem to include confirm, toast, and refresh
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this action item? This action cannot be undone.")) {
      return;
    }

    try {
      await NetworkManager.retryWithBackoff(() => ActionItem.delete(itemId));
      toast.success("Action item deleted successfully!");
      setSelectedItem(null);
      fetchActionItems(); // Refresh the list
    } catch (error) {
      // If the error is a 404 (Not Found), it means the item is already gone.
      if (error.response && error.response.status === 404) {
         console.warn(`Attempted to delete an item (ID: ${itemId}) that was not found. Updating UI.`);
         toast.warn("Action item was already deleted or not found."); // Inform user
         setSelectedItem(null); // Deselect if already gone
         fetchActionItems(); // Refresh to reflect correct state
      } else {
        // For any other type of error (e.g., network, permissions), log it and show error.
        console.error("An unexpected error occurred while deleting the action item:", error);
        toast.error("Failed to delete action item. Please try again.");
      }
    }
  };

  // Modified handleClearAll for consistency with new fetchActionItems pattern
  const handleClearAll = async () => {
    try {
      // Delete all action items for the current user
      const deletePromises = actionItems.map(item =>
        NetworkManager.retryWithBackoff(() => ActionItem.delete(item.id))
      );
      await Promise.all(deletePromises);
      toast.success("All action items cleared successfully!");
      setSelectedItem(null);
      fetchActionItems(); // Refresh list
    } catch (error) {
      console.error("Error clearing all action items:", error);
      toast.error("Failed to clear all action items. Please try again.");
    }
  };

  // Modified handleClearCompleted for consistency with new fetchActionItems pattern
  const handleClearCompleted = async () => {
    try {
      const completedItems = actionItems.filter(item => item.status === 'completed');
      const deletePromises = completedItems.map(item =>
        NetworkManager.retryWithBackoff(() => ActionItem.delete(item.id))
      );
      await Promise.all(deletePromises);
      toast.success("Completed action items cleared successfully!");
      setSelectedItem(null);
      fetchActionItems(); // Refresh list
    } catch (error) {
      console.error("Error clearing completed action items:", error);
      toast.error("Failed to clear completed action items. Please try again.");
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'blocked': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'not_started': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-300/30';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-300/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'blocked': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredItems = actionItems.filter(item => {
    const statusMatch = filters.status === 'all' || item.status === filters.status;
    const priorityMatch = filters.priority === 'all' || item.priority === filters.priority;
    const categoryMatch = filters.category === 'all' || item.category === filters.category;
    const searchMatch = filters.search === '' ||
      item.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.description?.toLowerCase().includes(filters.search.toLowerCase());

    return statusMatch && priorityMatch && categoryMatch && searchMatch;
  });

  const getStats = () => {
    return {
      total: actionItems.length,
      completed: actionItems.filter(i => i.status === 'completed').length,
      inProgress: actionItems.filter(i => i.status === 'in_progress').length,
      pending: actionItems.filter(i => i.status === 'not_started').length,
      overdue: actionItems.filter(i => {
        if (!i.due_date || i.status === 'completed') return false;
        const dueDate = new Date(i.due_date);
        dueDate.setHours(23, 59, 59, 999); // Set to end of day for accurate comparison
        return dueDate < new Date();
      }).length
    };
  };

  const stats = getStats();

  const ActionItemCard = ({ item, handleItemClick, handleStatusUpdate, handleDeleteItem, getPriorityColor, getStatusColor, companyId }) => {
    const [assignedUserName, setAssignedUserName] = useState("");

    useEffect(() => {
      const loadAssignedUserName = async () => {
        if (item.assigned_to) {
          try {
            // SECURITY FIX: Use explicit company filtering instead of User.list()
            if (companyId) {
              const companyUsers = await NetworkManager.retryWithBackoff(() =>
                User.filter({ company_id: companyId })
              );
              const assignedUser = companyUsers.find(u => u.email === item.assigned_to);
              if (assignedUser) {
                setAssignedUserName(assignedUser.full_name || assignedUser.email);
              } else {
                setAssignedUserName(item.assigned_to); // Fallback to email if user not found within company
              }
            } else {
              setAssignedUserName(item.assigned_to); // Fallback if no companyId provided (should be handled by parent loadData error)
            }
          } catch (error) {
            console.error("Error fetching assigned user:", error);
            // SECURITY FIX: Generic fallback, no sensitive error details
            setAssignedUserName(item.assigned_to); // Fallback to email on error
          }
        } else {
          setAssignedUserName(""); // Clear if no assigned_to
        }
      };
      loadAssignedUserName();
    }, [item.assigned_to, companyId]);

    return (
      <Card className="glass-effect border-gray-500/20 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
        onClick={() => handleItemClick(item)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* SECURITY NOTE: React automatically escapes these strings, preventing XSS */}
              <CardTitle className="text-white text-lg mb-2 truncate">{item.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={`border text-xs ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </Badge>
                <Badge className={`border text-xs ${getStatusColor(item.status)}`}>
                  {item.status?.replace('_', ' ')}
                </Badge>
                {item.category && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    {item.category.replace('_', '-')}
                  </Badge>
                )}
                {/* Source indicators */}
                {item.incident_id && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 border text-xs">
                    From Incident
                  </Badge>
                )}
                {item.assessment_id && (
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 border text-xs">
                    From Assessment
                  </Badge>
                )}
                {item.policy_id && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 border text-xs">
                    From Policy
                  </Badge>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-gray-600">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  className="text-white hover:bg-slate-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(item.id, 'completed');
                  }}
                  className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                  disabled={item.status === 'completed'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id);
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {item.description && (
            /* SECURITY NOTE: React automatically escapes item.description, preventing XSS */
            <p className="text-gray-300 text-sm mb-4 line-clamp-3">{item.description}</p>
          )}

          <div className="space-y-3">
            {/* Assignment Info - Made more prominent */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-400">
                <UserIcon className="w-4 h-4 mr-2" />
                <span>Assigned to:</span>
              </div>
              <div className="text-right">
                {assignedUserName ? (
                  <div>
                    <p className="text-white font-medium text-sm">{assignedUserName}</p>
                    {assignedUserName !== item.assigned_to && item.assigned_to && (
                      <p className="text-xs text-gray-500">{item.assigned_to}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Unassigned</p>
                )}
              </div>
            </div>

            {item.responsible_team && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Team:</span>
                </div>
                <span className="text-cyan-300 text-sm">{item.responsible_team}</span>
              </div>
            )}

            {item.due_date && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Due:</span>
                </div>
                <span className="text-orange-300 text-sm">
                  {format(new Date(item.due_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700/50">
              {(item.assessment_id || item.incident_id || item.policy_id) && (
                <div className="flex items-center gap-4">
                  {item.assessment_id && (
                      <Link to={createPageUrl(`Reports?highlight=${item.assessment_id}`)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors">
                          <FileText className="w-3 h-3" />
                          From Assessment
                      </Link>
                  )}
                  {item.incident_id && (
                      <Link to={createPageUrl(`IncidentDetail?id=${item.incident_id}`)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors">
                          <Activity className="w-3 h-3" />
                          From Incident
                      </Link>
                  )}
                  {item.policy_id && (
                      <Link to={createPageUrl(`PolicyEditor?id=${item.policy_id}`)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:text-purple-300 transition-colors">
                          <Gavel className="w-3 h-3" />
                          From Policy
                      </Link>
                  )}
                </div>
              )}
              <div className="flex-grow"></div>
              {item.created_date && (
                <span className="text-right">Created {format(new Date(item.created_date), 'MMM d, yyyy')}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center cyber-gradient">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading action items...</p>
        </div>
      </div>
    );
  }

  // Display error message if loading failed
  // SECURITY FIX: Generic error display
  if (error) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-red-500/30 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Unable to Load Data</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button
            onClick={handleRetry}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Retry ({retryCount})
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-red-500/30 max-w-md">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">You must be logged in to view action items.</p>
          <Button
            onClick={() => User.loginWithRedirect(window.location.href)}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // Show detail view if an item is selected
  if (selectedItem) {
    return (
      <div className="min-h-screen cyber-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ActionItemDetail
            actionItem={selectedItem}
            onBack={handleBackToList}
            onSave={handleSave} // Changed from onUpdate to onSave
            onDelete={handleDeleteItem}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - mobile optimized */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold cyber-text-glow mb-2">Action Items</h1>
            <p className="text-gray-400 text-sm sm:text-base">Track and manage your security improvement tasks</p>
          </div>

          {/* Clear Actions - mobile optimized */}
          {actionItems.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-orange-600 text-orange-300 hover:bg-orange-800">
                    Clear Completed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-effect border-orange-500/30 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-orange-300">⚠️ Clear Completed Items?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will permanently delete all <strong>{actionItems.filter(item => item.status === 'completed').length} completed</strong> action items.
                      <br /><br />
                      <span className="text-orange-300 font-semibold">This action cannot be undone.</span>
                      <br /><br />
                      Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 border-slate-600 hover:bg-slate-600">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCompleted} className="bg-orange-600 hover:bg-orange-700">
                      Yes, Clear Completed
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-red-600 text-red-300 hover:bg-red-800">
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-effect border-red-500/30 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-300">⚠️ Clear All Action Items?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will permanently delete <strong>ALL {actionItems.length} action items</strong> including completed, in-progress, and pending tasks.
                      <br /><br />
                      <span className="text-red-300 font-semibold">This action cannot be undone.</span>
                      <br /><br />
                      Are you absolutely sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 border-slate-600 hover:bg-slate-600">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
                      Yes, Delete All Items
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Stats Cards - mobile optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <Card className="glass-effect border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-cyan-300">{stats.total}</p>
                </div>
                <Target className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-300">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-blue-300">{stats.inProgress}</p>
                </div>
                <Play className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-gray-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-300">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-300">{stats.overdue}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - mobile optimized */}
        <Card className="glass-effect border-purple-500/20 mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
              <Input
                placeholder="Search action items..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="bg-slate-800/50 border-gray-600 text-white placeholder-gray-400"
              />

              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  <SelectItem value="not_started" className="text-white">Not Started</SelectItem>
                  <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                  <SelectItem value="completed" className="text-white">Completed</SelectItem>
                  <SelectItem value="blocked" className="text-white">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  <SelectItem value="all" className="text-white">All Priority</SelectItem>
                  <SelectItem value="critical" className="text-white">Critical</SelectItem>
                  <SelectItem value="high" className="text-white">High</SelectItem>
                  <SelectItem value="medium" className="text-white">Medium</SelectItem>
                  <SelectItem value="low" className="text-white">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  <SelectItem value="all" className="text-white">All Categories</SelectItem>
                  <SelectItem value="30_day" className="text-white">30 Day</SelectItem>
                  <SelectItem value="60_day" className="text-white">60 Day</SelectItem>
                  <SelectItem value="90_day" className="text-white">90 Day</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setFilters({ status: 'all', priority: 'all', category: 'all', search: '' })}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Items List - mobile optimized */}
        <div className="space-y-3 sm:space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="glass-effect border-gray-500/20">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Action Items Found</h3>
                <p className="text-gray-500 mb-6">
                  {actionItems.length === 0
                    ? "Complete an assessment to generate action items."
                    : "Try adjusting your filters or search terms."
                  }
                </p>
                {actionItems.length === 0 && (
                  <Link to={createPageUrl("Assessment?new=true")}>
                    <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Assessment
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                handleItemClick={handleItemClick}
                handleStatusUpdate={handleStatusUpdate}
                handleDeleteItem={handleDeleteItem}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                companyId={currentUser?.company_id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
