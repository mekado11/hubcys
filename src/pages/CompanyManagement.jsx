
import React, { useEffect, useState, useCallback } from "react";
import { User } from "@/entities/User";
import { Company } from "@/entities/Company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Building, Loader2, Lock, Save, RefreshCw } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function CompanyManagement() { // Renamed from CompanyManagementPage
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [companyData, setCompanyData] = useState(null); // This now holds the 'currentCompany' data and form input values
  const [companyMissing, setCompanyMissing] = useState(false);

  const [saving, setSaving] = useState(false); // Renamed from isSaving
  const [saveSuccess, setSaveSuccess] = useState(false);

  // isAdmin status should be derived from the actual company data, not just form data.
  // This ensures permissions are based on saved state.
  const isAdmin = currentUser?.company_role === "admin" && currentUser?.email === companyData?.admin_user_email;

  // New combined helper function to fetch all initial data (and re-fetch after updates)
  const fetchCompanyDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);
    setCompanyMissing(false); // Reset on initial load

    try {
      // 1) Get current user (handle 401)
      let user;
      try {
        user = await User.me();
      } catch (e) {
        // 401 or unauthenticated - auto redirect to login with return URL
        setAuthError(true);
        // Avoid loops: slight delay to allow UI render and prevent synchronous re-entry
        setTimeout(() => {
          User.loginWithRedirect(window.location.href);
        }, 100);
        setLoading(false);
        return;
      }
      setCurrentUser(user);

      // 2) Load company by reconciliation (avoiding direct Company.get call)
      // This is the core logic from the original loadOrReconcileCompany
      try {
        setCompanyMissing(false);
        setError(null);

        console.log('Attempting reconciliation by admin email first:', user.email);
        const mine = await Company.filter({ admin_user_email: user.email }, "-created_date", 1);
        if (mine && mine.length > 0) {
          const comp = mine[0];
          console.log('Found company during reconciliation:', comp.name, 'ID:', comp.id);

          // Check if this is the same company the user thinks they have
          if (comp.id === user.company_id) {
            console.log('Company IDs match - user data is correct');
            setCompanyData(comp); // Update companyData directly
          } else {
            console.log('Company IDs do not match. User company_id:', user.company_id, 'Found company ID:', comp.id);

            // Link user to the correct company
            await User.updateMyUserData({
              company_id: comp.id,
              company_name: comp.name,
              company_access_code: comp.access_code,
              company_description: comp.description || null,
              company_industry: comp.industry || null,
              company_size: comp.size || null,
              company_onboarding_completed: true,
              company_role: "admin"
            });

            setCurrentUser((prev) => prev ? ({
              ...prev,
              company_id: comp.id,
              company_name: comp.name,
              company_access_code: comp.access_code,
              company_description: comp.description || null,
              company_industry: comp.industry || null,
              company_size: comp.size || null,
              company_onboarding_completed: true,
              company_role: "admin"
            }) : prev);

            setCompanyData(comp); // Update companyData directly
            setCompanyMissing(false);
          }
        } else {
          console.log('No company found with admin_user_email:', user.email);
          // No company found by admin email - company is truly missing
          setCompanyMissing(true);
          setError("We couldn't find a company where you are listed as the administrator. The company record appears to be missing from the database.");
        }
      } catch (reconcileError) {
        console.error('Reconciliation by admin email failed:', reconcileError);
        setCompanyMissing(true);
        setError("Unable to locate your company. The company record may be missing.");
      }

    } catch (e) {
      setError(e?.message || "Failed to load company data.");
      setCompanyMissing(true); // If initial load throws error, assume missing
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array as user is fetched internally

  useEffect(() => {
    fetchCompanyDetails();
  }, [fetchCompanyDetails]); // Call fetchCompanyDetails on component mount

  const handleRecreateCompany = async () => {
    if (!currentUser) {
      alert('Current user data is not available.');
      return;
    }

    const confirmMessage = `This will recreate your company record using cached data from your user profile.\n\nCompany Name: ${currentUser.company_name || 'Unknown'}\nAccess Code: ${currentUser.company_access_code || 'Will generate new'}\nIndustry: ${currentUser.company_industry || 'Not specified'}\nSize: ${currentUser.company_size || 'Not specified'}\n\nProceed with company recreation?`;

    if (!confirm(confirmMessage)) return;

    try {
      setSaving(true);
      setError(null);

      // Generate access code if not available
      const accessCode = currentUser.company_access_code || generateAccessCode();

      // Create new company with current user's cached data
      const newCompany = await Company.create({
        name: currentUser.company_name || `${currentUser.email.split('@')[0]}'s Company`,
        access_code: accessCode,
        admin_user_email: currentUser.email,
        description: currentUser.company_description || '',
        industry: currentUser.company_industry || 'Other',
        size: currentUser.company_size || 'Small_1-50',
        subscription_tier: 'free_trial',
        status: 'active'
      });

      console.log('Company recreated:', newCompany);

      // Update current user to point to the new company
      await User.updateMyUserData({
        company_id: newCompany.id,
        company_name: newCompany.name,
        company_access_code: newCompany.access_code,
        company_description: newCompany.description,
        company_industry: newCompany.industry,
        company_size: newCompany.size,
        company_onboarding_completed: true,
        company_role: "admin"
      });

      // Update local state
      setCurrentUser(prev => ({
        ...prev,
        company_id: newCompany.id,
        company_name: newCompany.name,
        company_access_code: newCompany.access_code,
        company_description: newCompany.description,
        company_industry: newCompany.industry,
        company_size: newCompany.size
      }));

      setCompanyData(newCompany); // Update companyData with the newly created company
      setCompanyMissing(false);
      setError(null);

      alert(`Company "${newCompany.name}" recreated successfully!\nAccess Code: ${newCompany.access_code}\n\nYour account has been updated and linked to the new company record.`);

    } catch (error) {
      console.error('Error recreating company:', error);
      setError(`Failed to recreate company: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper to generate a simple access code
  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Handler for form field changes, updates companyData state
  const handleInputChange = (field, value) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => { // Renamed from handleSave
    if (!companyData?.id) { // Use 'companyData' for current company ID
      setError('No company selected to save.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // Validate required fields
      if (!companyData.name?.trim()) {
        throw new Error('Company name is required');
      }
      if (!companyData.industry) {
        throw new Error('Industry is required');
      }
      if (!companyData.size) {
        throw new Error('Company size is required');
      }

      // Update company information
      await Company.update(companyData.id, { // Use 'companyData.id' from the actual company object
        name: companyData.name.trim(),
        description: companyData.description?.trim() || null,
        industry: companyData.industry,
        size: companyData.size,
        // Only include subscription_tier and status if they exist in companyData.
        // They are disabled inputs, so their values come from the initial load.
        ...(companyData.subscription_tier && { subscription_tier: companyData.subscription_tier }),
        ...(companyData.status && { status: companyData.status })
      });

      // Update user's cached company info
      // This will ensure current user object in state is updated
      await User.updateMyUserData({
        company_name: companyData.name.trim(),
        company_description: companyData.description?.trim() || null,
        company_industry: companyData.industry,
        company_size: companyData.size
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      // Refresh company data from backend to ensure UI is in sync after save
      await fetchCompanyDetails();

    } catch (err) {
      console.error('Error updating company:', err);
      setError(err.message || 'Failed to update company information');
    } finally {
      setSaving(false);
    }
  };

  // 401 / not authenticated
  if (authError) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-red-500/30 max-w-md">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Please log in</h1>
          <p className="text-gray-400 mb-6">You must be logged in to view your company settings.</p>
          <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading company...</p>
        </div>
      </div>
    );
  }

  // Error state, now also handles companyMissing
  if (error) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-red-500/30 max-w-2xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Company Management Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>

          {companyMissing && currentUser && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h3 className="text-blue-300 font-medium mb-2">Data Recovery Available</h3>
              <p className="text-blue-200 text-sm mb-3">
                We can recreate your company record using the cached data from your user profile:
              </p>
              <div className="text-left text-sm text-gray-300 mb-4">
                <p><strong>Company Name:</strong> {currentUser.company_name || 'Not cached (will default)'}</p>
                <p><strong>Access Code:</strong> {currentUser.company_access_code || 'Will generate new'}</p>
                <p><strong>Industry:</strong> {currentUser.company_industry || 'Not specified (will default)'}</p>
                <p><strong>Size:</strong> {currentUser.company_size || 'Not specified (will default)'}</p>
                <p className="text-xs text-gray-400 mt-2">Note: This will create a new company record and link your account to it. Old data will not be recovered.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} variant="outline" className="border-gray-600 text-gray-300 hover:bg-slate-800">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Loading
            </Button>

            {companyMissing && currentUser && (
              <Button
                onClick={handleRecreateCompany}
                disabled={saving}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Recreate Company Record
              </Button>
            )}

            <Button
              onClick={() => (window.location.href = createPageUrl("CompanyOnboarding"))}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              Go to Company Onboarding
            </Button>

            <Button
              onClick={() => (window.location.href = createPageUrl("Dashboard"))}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-slate-800"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If companyData is still null here but no error message, it's an unexpected state.
  if (!companyData) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-yellow-500/30 max-w-md">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Company not found</h1>
          <p className="text-gray-400 mb-6">We couldn't locate your company record. Please complete onboarding.</p>
          <Link to={createPageUrl("CompanyOnboarding")}>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              Go to Onboarding
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center gap-4">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold cyber-text-glow mb-2 flex items-center gap-3">
              <Building className="w-6 h-6 text-cyan-400" /> {/* Using Building icon */}
              Company Management
              {currentUser?.company_role && (
                <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-300 border-none">
                  {currentUser.company_role}
                </Badge>
              )}
            </h1>
            <p className="text-gray-400">
              {isAdmin ? "Manage your organization profile and settings." : "Your organization details (read-only)."}
            </p>
          </div>
        </div>

        {/* Company Information */}
        <Card className="glass-effect border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-300">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={companyData.name || ""} // Bind to companyData
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isAdmin}
                className="bg-slate-800/50 border-gray-600 text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={companyData.description || ""} // Bind to companyData
                onChange={(e) => handleInputChange("description", e.target.value)}
                disabled={!isAdmin}
                className="bg-slate-800/50 border-gray-600 text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={companyData.industry || ""} // Bind to companyData
                onChange={(e) => handleInputChange("industry", e.target.value)}
                disabled={!isAdmin}
                className="bg-slate-800/50 border-gray-600 text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="size">Company Size</Label>
              <Input
                id="size"
                value={companyData.size || ""} // Bind to companyData
                onChange={(e) => handleInputChange("size", e.target.value)}
                disabled={!isAdmin}
                className="bg-slate-800/50 border-gray-600 text-white"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="subscription_tier" className="text-white">Subscription Tier</Label>
                <Input
                  id="subscription_tier"
                  value={companyData.subscription_tier || "free_trial"}
                  className="bg-slate-800/50 border-gray-600 text-white"
                  disabled={true}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Subscription tier is managed by administrators in User Management
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-white">Status</Label>
                <Input
                  id="status"
                  value={companyData.status || "active"}
                  className="bg-slate-800/50 border-gray-600 text-white"
                  disabled={true}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Status is managed by system administrators
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                onClick={fetchCompanyDetails} // Refresh Data button
                className="border-gray-600 text-gray-300 hover:bg-slate-800"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Refresh Data
              </Button>
              {isAdmin && (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveChanges} // Call handleSaveChanges
                    disabled={saving}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                  {saveSuccess && <span className="text-green-300 self-center">Saved!</span>}
                </div>
              )}
            </div>
            {!isAdmin && (
              <div className="text-sm text-gray-400">
                Note: You have read-only access. Contact your company administrator to make changes.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin-only confidential details */}
        {isAdmin && (
          <Card className="glass-effect border-purple-500/20 mt-8">
            <CardHeader>
              <CardTitle className="text-purple-300">Admin Details</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Admin Email</Label>
                <Input value={companyData.admin_user_email || ""} disabled className="bg-slate-800/50 border-gray-600 text-white" /> {/* Bind to companyData */}
              </div>
              <div className="grid gap-2">
                <Label>Access Code</Label>
                <div className="flex gap-2">
                  <Input value={companyData.access_code || ""} disabled className="bg-slate-800/50 border-gray-600 text-white" /> {/* Bind to companyData */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(companyData.access_code || "");
                    }}
                    className="border-purple-400/40 text-purple-200"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
