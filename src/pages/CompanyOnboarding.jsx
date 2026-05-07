import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Company } from "@/entities/Company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building, Plus, LogIn, AlertCircle, Copy, Check, Users, ShieldCheck } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function CompanyOnboarding() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState(null); // 'create' | 'join' | 'success'
  const [createdCompany, setCreatedCompany] = useState(null); // { name, access_code }
  const [copied, setCopied] = useState(false);

  // Create company state
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyDescription, setNewCompanyDescription] = useState("");
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("Technology");
  const [newCompanySize, setNewCompanySize] = useState("Small_1-50");

  // Join company state
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // If user has already completed onboarding, redirect to dashboard
      if (user.company_onboarding_completed) {
        window.location.href = createPageUrl("Dashboard");
        return;
      }
    } catch (err) {
      // Enhanced error handling for 401
      const is401Error = err?.response?.status === 401 || 
                        err?.message?.includes('401') ||
                        err?.message?.includes('Unauthorized');
      
      if (is401Error) {
        console.log('User not authenticated on CompanyOnboarding page. Redirecting to login.');
        // Redirect to login with return URL
        await User.loginWithRedirect(window.location.origin + createPageUrl("CompanyOnboarding"));
        return;
      }
      
      console.error("Error loading user:", err);
      setError("Failed to load user information. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const ensureUniqueAccessCode = async () => {
    // Try up to 5 times to avoid extremely rare collisions
    for (let i = 0; i < 5; i++) {
      const candidate = generateAccessCode();
      const existing = await Company.filter({ access_code: candidate });
      if (!existing || existing.length === 0) return candidate;
    }
    // Fallback: include timestamp suffix for uniqueness
    return (generateAccessCode().slice(0, 6) + Date.now().toString().slice(-2)).toUpperCase();
  };

  const sanitize = (s) => (typeof s === "string" ? s.replace(/<script[^>]*>.*?<\/script>/gi, "").trim() : s);

  const extractEmailDomain = (email) => {
    if (!email || typeof email !== 'string') return null;
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : null;
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Ensure uniqueness of access code
      const uniqueCode = await ensureUniqueAccessCode();

      // Create the company
      const company = await Company.create({
        name: sanitize(newCompanyName),
        access_code: uniqueCode,
        admin_user_email: currentUser.email,
        description: sanitize(newCompanyDescription),
        industry: newCompanyIndustry,
        size: newCompanySize,
        status: "active"
      });

      // Update user with company info and set as admin
      await User.updateMyUserData({
        company_id: company.id,
        company_name: sanitize(newCompanyName),
        company_access_code: uniqueCode,
        company_description: sanitize(newCompanyDescription),
        company_industry: newCompanyIndustry,
        company_size: newCompanySize,
        company_onboarding_completed: true,
        company_role: "admin",
        approval_status: "approved"
      });

      setCreatedCompany({ name: sanitize(newCompanyName), access_code: uniqueCode });
      setMode("success");
    } catch (err) {
      console.error("Error creating company:", err);
      setError("Failed to create company. Please try again.");
      setSubmitting(false);
    }
  };

  const handleJoinCompany = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Find company by access code
      const companies = await Company.filter({ access_code: accessCode.toUpperCase() });

      if (!companies || companies.length === 0) {
        setError("Invalid access code. Please check and try again.");
        setSubmitting(false);
        return;
      }

      if (companies.length > 1) {
        setError("Multiple companies matched this access code. Please contact support.");
        setSubmitting(false);
        return;
      }

      const company = companies[0];

      // NEW: Domain validation logic
      const userDomain = extractEmailDomain(currentUser.email);
      const adminDomain = extractEmailDomain(company.admin_user_email);

      if (!userDomain || !adminDomain) {
        setError("Unable to verify email domains. Please contact support.");
        setSubmitting(false);
        return;
      }

      if (userDomain !== adminDomain) {
        setError(
          `Email domain mismatch. Your email domain (@${userDomain}) does not match the company's registered domain (@${adminDomain}). Only users with @${adminDomain} email addresses can join this company.`
        );
        setSubmitting(false);
        return;
      }

      // Domain matches - proceed with joining
      await User.updateMyUserData({
        company_id: company.id,
        company_name: company.name,
        company_access_code: company.access_code,
        company_description: company.description,
        company_industry: company.industry,
        company_size: company.size,
        company_onboarding_completed: true,
        company_role: "member",
        approval_status: "pending" // New users joining need approval
      });

      // Redirect to pending approval page
      window.location.href = createPageUrl("PendingApproval");
    } catch (err) {
      console.error("Error joining company:", err);
      setError("Failed to join company. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center p-6">
        <Card className="glass-effect border-slate-700/50 max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-300 text-center">
              Welcome to Hubcys!
            </CardTitle>
            <p className="text-gray-400 text-center mt-2">
              To get started, please choose how you'd like to proceed:
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setMode("create")}
              className="w-full h-24 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-lg"
            >
              <Plus className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-bold">Create New Company</div>
                <div className="text-sm opacity-90">Set up a new organization account</div>
              </div>
            </Button>

            <Button
              onClick={() => setMode("join")}
              variant="outline"
              className="w-full h-24 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-lg"
            >
              <LogIn className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-bold">Join Existing Company</div>
                <div className="text-sm opacity-90">Use an access code to join your team</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center p-6">
        <Card className="glass-effect border-slate-700/50 max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-300 flex items-center">
              <Building className="w-6 h-6 mr-2" />
              Create Your Company
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Set up your organization's Hubcys account. You will be the administrator.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-300">Company Name *</Label>
                <Input
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Acme Corporation"
                  required
                  className="bg-slate-800/50 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Description</Label>
                <Input
                  value={newCompanyDescription}
                  onChange={(e) => setNewCompanyDescription(e.target.value)}
                  placeholder="Brief description of your company"
                  className="bg-slate-800/50 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Industry</Label>
                <select
                  value={newCompanyIndustry}
                  onChange={(e) => setNewCompanyIndustry(e.target.value)}
                  className="w-full bg-slate-800/50 border border-gray-600 text-white rounded-md p-2"
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial_Services">Financial Services</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Education">Education</option>
                  <option value="Government">Government</option>
                  <option value="Energy">Energy</option>
                  <option value="Legal">Legal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label className="text-gray-300">Company Size</Label>
                <select
                  value={newCompanySize}
                  onChange={(e) => setNewCompanySize(e.target.value)}
                  className="w-full bg-slate-800/50 border border-gray-600 text-white rounded-md p-2"
                >
                  <option value="Small_1-50">Small (1-50)</option>
                  <option value="Medium_51-500">Medium (51-500)</option>
                  <option value="Large_501-2000">Large (501-2,000)</option>
                  <option value="Enterprise_2000+">Enterprise (2,000+)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode(null)}
                  className="flex-1 border-gray-600"
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !newCompanyName}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Company"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(createdCompany?.access_code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === "success" && createdCompany) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center p-6">
        <Card className="glass-effect border-emerald-500/30 max-w-lg w-full">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl text-emerald-300">Company Created!</CardTitle>
            <p className="text-gray-400 mt-1 text-sm">
              <span className="font-semibold text-white">{createdCompany.name}</span> is ready. You are the administrator.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invite Code Box */}
            <div className="bg-slate-800/60 border border-cyan-500/30 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <p className="text-sm text-cyan-300 font-medium">Your Organisation Invite Code</p>
              </div>
              <p className="text-xs text-gray-400 mb-3">Share this code with team members so they can join your organisation</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold text-white tracking-widest bg-slate-700/60 px-6 py-3 rounded-lg border border-slate-600">
                  {createdCompany.access_code}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span> Send this code to colleagues who need access</p>
              <p className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span> New members will appear as "Pending" in User Management until you approve them</p>
              <p className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span> You can find this code again in User Management → Invite Code</p>
            </div>

            <Button
              onClick={() => window.location.href = createPageUrl("Dashboard")}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              Go to Dashboard →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center p-6">
        <Card className="glass-effect border-slate-700/50 max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-300 flex items-center">
              <LogIn className="w-6 h-6 mr-2" />
              Join Your Company
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Enter the access code provided by your company administrator. Your role will be assigned by the admin after you join.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinCompany} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-300">Access Code *</Label>
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  required
                  maxLength={8}
                  className="bg-slate-800/50 border-gray-600 text-white uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The access code is case-insensitive and should be 8 characters long.
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-blue-300 text-sm">
                  <p className="font-semibold mb-1">Email Domain Verification</p>
                  <p>
                    Your email domain must match your company's registered domain. 
                    For example, if your company was registered with @company.com, 
                    you must use an @company.com email address to join.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode(null)}
                  className="flex-1 border-gray-600"
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !accessCode}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Company"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}