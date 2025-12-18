
import React, { useState, useEffect, useMemo } from "react";
import { Policy } from "@/entities/Policy";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Gavel, Search, Loader2, ShieldAlert, X, Edit, Eye, Trash2 } from "lucide-react";
import { CachedEntityManager } from '@/components/utils/networkUtils';
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

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

export default function PolicyLibrary() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await CachedEntityManager.get(User, 'me', [], 'policy_library_user');
      if (!user || !user.company_id) {
        throw new Error("User or company information is missing. Please complete company onboarding.");
      }
      
      const companyFilter = { company_id: user.company_id };
      
      const companyPolicies = await CachedEntityManager.get(
        Policy, 
        'filter', 
        [companyFilter, "-updated_date"], 
        `policies_for_${user.company_id}`
      );
      
      setPolicies(companyPolicies || []);
    } catch (err) {
      console.error("Error fetching policies:", err);
      setError(err.message || "An unexpected error occurred while fetching policies.");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    try {
      await Policy.delete(policyId);
      const user = await CachedEntityManager.get(User, 'me', [], 'policy_library_user');
      if (user && user.company_id) {
        CachedEntityManager.clearCache(`policies_for_${user.company_id}`);
      } else {
        console.warn("Could not determine company_id for cache invalidation after policy deletion.");
      }
      await fetchPolicies();
    } catch (err) {
      console.error("Error deleting policy:", err);
      setError("Failed to delete policy. Please try again.");
    }
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter(policy => {
      const searchTermLower = searchQuery.toLowerCase();
      const matchesSearch = policy.title.toLowerCase().includes(searchTermLower) || 
                            policy.policy_type.toLowerCase().includes(searchTermLower);
      const matchesStatus = statusFilter === 'all' || policy.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [policies, searchQuery, statusFilter]);

  const handleCreatePolicy = () => {
    navigate(createPageUrl("PolicyEditor", { new: "true" }));
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'in_review':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 bg-red-900/20 rounded-lg">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-lg font-medium text-white">Error Loading Policies</h3>
          <p className="mt-1 text-sm text-red-300">{error}</p>
        </div>
      );
    }

    if (policies.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg">
          <Gavel className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-lg font-medium text-white">No Policies Found</h3>
          <p className="mt-1 text-sm text-gray-400">
            Click "Create New Policy" above to get started with your first security policy.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="glass-effect border-slate-600/50 hover:border-purple-500/30 transition-all duration-200 overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl text-white mb-2">{policy.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {policy.policy_type?.replace(/_/g, ' ') || 'General'}
                    </Badge>
                    <Badge className={getStatusColor(policy.status)}>
                      {policy.status}
                    </Badge>
                    <Badge variant="outline" className="border-slate-500 text-slate-300">
                      v{policy.version || '1.0'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Created</p>
                  <p className="text-white">
                    {policy.created_date ? format(new Date(policy.created_date), 'PPP') : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Last Reviewed</p>
                  <p className="text-white">
                    {policy.last_reviewed_date ? format(new Date(policy.last_reviewed_date), 'PPP') : 'Not reviewed'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Next Review</p>
                  <p className="text-white">
                    {policy.next_review_date ? format(new Date(policy.next_review_date), 'PPP') : 'Not scheduled'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-400">
                  {policy.approved_date && (
                    <span>Approved {format(new Date(policy.approved_date), 'PPP')}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 justify-end w-full sm:w-auto pr-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(createPageUrl(`PolicyEditor?id=${policy.id}`))}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 px-3 shrink-0"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(createPageUrl(`PolicyEditor?id=${policy.id}&view=true`))}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 px-3 shrink-0"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-300 hover:bg-red-800 h-8 px-3 shrink-0"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-effect border-red-500/30 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-300">Delete policy?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          This will permanently remove “{policy.title}”. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-700 border-slate-600 hover:bg-slate-600">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeletePolicy(policy.id)}
                        >
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 card-entrance">
          <div>
            <h1 className="text-4xl font-bold cyber-text-glow mb-2">Policy Library</h1>
            <p className="text-lg text-gray-300">
              Manage, review, and create your organization's security policies.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button onClick={handleCreatePolicy} className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600">
              <Plus className="w-5 h-5 mr-2" />
              Create New Policy
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="glass-effect border-purple-500/30 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-gray-300 mb-2 block">Search Policies</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, type, or content..."
                    className="pl-10 pr-10 bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-slate-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600 text-white">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Policy Grid */}
        {renderContent()}
      </div>
    </div>
  );
}
