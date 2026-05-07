
import React, { useEffect, useMemo, useState } from "react";
import { User } from "@/entities/User";
import { Company } from "@/entities/Company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Ban, ShieldOff, Loader2, Search, ArrowLeft, Copy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast"; // Added toast import
// Added RoleGate import

export default function UserManagement() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [copiedCode, setCopiedCode] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [reasonTarget, setReasonTarget] = useState(null); // { user, action: 'reject' | 'suspend' }

  const TIER_OPTIONS = ["free_trial", "starter", "growth", "enterprise"];
  const COMPANY_ROLE_OPTIONS = ["member", "admin"]; // Renamed for clarity, used for company_role
  const APP_ROLE_OPTIONS = ["member", "security_analyst", "security_manager", "executive", "auditor", "admin"]; // New roles for app_role

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const me = await User.me();
        setCurrentUser(me);

        if (me.is_super_admin) {
          // Super admin sees all users
          const list = await User.list("-created_date", 500);
          setUsers(list || []);
        } else if (me.company_role === "admin" && me.company_id) {
          // Company admin sees only their org's users
          const list = await User.filter({ company_id: me.company_id }, "-created_date", 200);
          setUsers(list || []);
        } else {
          setUsers([]);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byTab = users.filter(u => {
      if (tab === "pending") return u.approval_status === "pending";
      if (tab === "approved") return u.approval_status === "approved";
      if (tab === "rejected") return u.approval_status === "rejected";
      if (tab === "suspended") return u.approval_status === "suspended";
      if (tab === "banned") return u.approval_status === "banned";
      return true;
    });
    if (!q) return byTab;
    return byTab.filter(u => {
      const full = [
        u.email,
        u.full_name,
        u.first_name,
        u.last_name,
        u.company_name,
        u.role,
        u.approval_status,
        u.subscription_tier,
        u.company_role,
        u.app_role, // Included app_role in search
        u.approved_by,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return full.includes(q);
    });
  }, [users, search, tab]);

  const statusBadge = (status) => {
    const map = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-300 border-green-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30",
      suspended: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      banned: "bg-red-900/40 text-red-200 border-red-700/60",
    };
    return <Badge className={map[status] || "bg-slate-700 text-slate-200 border-slate-600"}>{status}</Badge>;
  };

  const refresh = async () => {
    try {
      if (currentUser?.is_super_admin) {
        const list = await User.list("-created_date", 500);
        setUsers(list || []);
      } else if (currentUser?.company_id) {
        const list = await User.filter({ company_id: currentUser.company_id }, "-created_date", 200);
        setUsers(list || []);
      }
    } catch (err) {
      console.error('refresh failed:', err.message);
    }
  };

  const patchUser = (id, fields) =>
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...fields } : u));

  const doUpdateStatus = async (targetUser, newStatus, reason = null) => {
    setUpdatingId(targetUser.id);
    try {
      const payload = {
        approval_status: newStatus,
        approved_by: currentUser.email,
        approved_date: new Date().toISOString(),
        rejection_reason: reason || null,
      };
      await User.update(targetUser.id, payload);
      patchUser(targetUser.id, payload);
      toast.success(`User status updated to ${newStatus}.`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status.');
    } finally {
      setUpdatingId("");
    }
  };

  const handleTierChange = async (targetUser, newTier) => {
    if (!newTier || (targetUser.subscription_tier || "").toLowerCase() === newTier.toLowerCase()) return;
    setUpdatingId(targetUser.id);

    try {
      await User.update(targetUser.id, { subscription_tier: newTier });
      patchUser(targetUser.id, { subscription_tier: newTier });
      toast.success(`Subscription tier updated to ${newTier}.`);

      // Best-effort: also update the company doc (non-blocking)
      if (targetUser.company_id) {
        Company.update(targetUser.company_id, { subscription_tier: newTier }).catch(err => {
          console.warn('Company tier update failed (non-fatal):', err.message);
        });
      }
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      toast.error(`Failed to update tier: ${error.message}`);
    } finally {
      setUpdatingId("");
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (!newRole || (targetUser.company_role || "").toLowerCase() === newRole.toLowerCase()) return;
    setUpdatingId(targetUser.id);
    try {
      await User.update(targetUser.id, { company_role: newRole });
      patchUser(targetUser.id, { company_role: newRole });
      toast.success('Company role updated.');
    } catch (error) {
      console.error('Error updating user company role:', error);
      toast.error('Failed to update company role.');
    } finally {
      setUpdatingId("");
    }
  };

  const handleAppRoleChange = async (targetUser, newAppRole) => {
    if (!newAppRole || (targetUser.app_role || "").toLowerCase() === newAppRole.toLowerCase()) return;
    setUpdatingId(targetUser.id);
    try {
      await User.update(targetUser.id, { app_role: newAppRole });
      patchUser(targetUser.id, { app_role: newAppRole });
      toast.success('App role updated.');
    } catch (error) {
      console.error('Error updating user app role:', error);
      toast.error('Failed to update app role.');
    } finally {
      setUpdatingId("");
    }
  };

  const confirmReject = (user) => {
    setReasonTarget({ user, action: "reject" });
    setReasonText("");
    setReasonDialogOpen(true);
  };

  const confirmSuspend = (user) => {
    setReasonTarget({ user, action: "suspend" });
    setReasonText("");
    setReasonDialogOpen(true);
  };

  const confirmBan = (user) => {
    setReasonTarget({ user, action: "ban" });
    setReasonText("");
    setReasonDialogOpen(true);
  };

  const handleReasonConfirm = async () => {
    if (!reasonTarget) return;
    const { user, action } = reasonTarget;
    setReasonDialogOpen(false);
    const newStatus = action === "reject" ? "rejected" : action === "ban" ? "banned" : "suspended";
    await doUpdateStatus(user, newStatus, reasonText?.trim() || null);
    setReasonTarget(null);
    setReasonText("");
  };

  const ActionButtons = ({ u }) => {
    const isSelf = currentUser && u.id === currentUser.id;
    const disabled = updatingId === u.id || isSelf;

    return (
      <div className="flex gap-2">
        {/* Approve */}
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          disabled={disabled || u.approval_status === "approved"}
          onClick={() => doUpdateStatus(u, "approved")}
        >
          {updatingId === u.id && u.approval_status !== "approved" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
          Approve
        </Button>

        {/* Reject (with reason) */}
        <Button
          size="sm"
          variant="outline"
          className="border-red-500/40 text-red-300 hover:bg-red-500/10"
          disabled={disabled || u.approval_status === "rejected"}
          onClick={() => confirmReject(u)}
        >
          {updatingId === u.id && u.approval_status !== "rejected" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
          Reject
        </Button>

        {/* Suspend (with reason) */}
        <Button
          size="sm"
          variant="outline"
          className="border-orange-500/40 text-orange-300 hover:bg-orange-500/10"
          disabled={disabled || u.approval_status === "suspended"}
          onClick={() => confirmSuspend(u)}
        >
          {updatingId === u.id && u.approval_status !== "suspended" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4 mr-1" />}
          Suspend
        </Button>

        {/* Ban (permanent) */}
        <Button
          size="sm"
          variant="outline"
          className="border-red-700/50 text-red-400 hover:bg-red-700/20"
          disabled={disabled || u.approval_status === "banned"}
          onClick={() => confirmBan(u)}
        >
          {updatingId === u.id && u.approval_status === "banned" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4 mr-1" />}
          Ban
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading users…</p>
        </div>
      </div>
    );
  }

  if (!currentUser || (!currentUser.is_super_admin && currentUser.company_role !== "admin")) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <Card className="glass-effect border-red-500/30 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-300">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            Only company administrators and platform super admins can manage users.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold cyber-text-glow">User Management</h1>
            <p className="text-gray-400">
              {currentUser?.is_super_admin ? "All organisations — super admin view" : `${currentUser?.company_name || "Your organisation"} — members only`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or company"
                className="pl-9 bg-slate-800/50 border-gray-600 text-white w-64"
              />
            </div>
          </div>
        </div>

        {/* Invite code banner for company admins */}
        {currentUser?.company_role === "admin" && !currentUser?.is_super_admin && currentUser?.company_access_code && (
          <div className="flex items-center justify-between bg-slate-800/60 border border-cyan-500/20 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Organisation Invite Code</p>
                <p className="text-white font-mono font-bold tracking-widest text-lg">{currentUser.company_access_code}</p>
              </div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(currentUser.company_access_code); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }}
              className="flex items-center gap-1.5 text-sm text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedCode ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4 bg-slate-800/50">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
            <TabsTrigger value="banned">Banned</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <Card className="glass-effect border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-300">Users</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">No users found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-slate-700">
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Company</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Tier</th>
                          <th className="py-2 pr-4">Company Role</th>
                          <th className="py-2 pr-4">App Role</th> {/* New: App Role column */}
                          <th className="py-2 pr-4">Approved By</th>
                          <th className="py-2 pr-4">Created</th>
                          <th className="py-2 pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const isSelf = currentUser && u.id === currentUser.id;
                          const rowUpdating = updatingId === u.id;

                          return (
                            <tr key={u.id} className="border-b border-slate-800/60">
                              <td className="py-3 pr-4 text-white">
                                {u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                              </td>
                              <td className="py-3 pr-4 text-gray-300">{u.email}</td>
                              <td className="py-3 pr-4 text-gray-300">{u.company_name || "—"}</td>
                              <td className="py-3 pr-4">{statusBadge(u.approval_status || "pending")}</td>

                              {/* Tier editor */}
                              <td className="py-3 pr-4">
                                <Select
                                  value={(u.subscription_tier || "").toLowerCase() || "free_trial"}
                                  onValueChange={(v) => handleTierChange(u, v)}
                                  disabled={rowUpdating}
                                >
                                  <SelectTrigger className="w-36 bg-slate-800/50 border-gray-600 text-white h-8">
                                    <SelectValue placeholder="Tier" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                    {TIER_OPTIONS.map((t) => (
                                      <SelectItem key={t} value={t} className="capitalize">
                                        {t.replace("_", " ")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>

                              {/* Company role editor (disabled for self to avoid lockout) */}
                              <td className="py-3 pr-4">
                                <Select
                                  value={(u.company_role || "member").toLowerCase()}
                                  onValueChange={(v) => handleRoleChange(u, v)}
                                  disabled={rowUpdating || isSelf}
                                >
                                  <SelectTrigger className="w-36 bg-slate-800/50 border-gray-600 text-white h-8">
                                    <SelectValue placeholder="Role" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                    {COMPANY_ROLE_OPTIONS.map((r) => (
                                      <SelectItem key={r} value={r} className="capitalize">
                                        {r}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>

                              {/* New: App Role editor */}
                              <td className="py-3 pr-4">
                                <Select
                                  value={(u.app_role || "member").toLowerCase()}
                                  onValueChange={(v) => handleAppRoleChange(u, v)}
                                  disabled={rowUpdating || isSelf} // Disabled for self to avoid potential lockout
                                >
                                  <SelectTrigger className="w-40 bg-slate-800/50 border-gray-600 text-white h-8">
                                    <SelectValue placeholder="App Role" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                    {APP_ROLE_OPTIONS.map((r) => (
                                      <SelectItem key={r} value={r} className="capitalize">
                                        {r.replace(/_/g, " ")} {/* Replace underscores for display */}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>

                              {/* Approved By display */}
                              <td className="py-3 pr-4 text-gray-300">
                                {u.approved_by || "—"}
                              </td>

                              <td className="py-3 pr-4 text-gray-400">
                                {u.created_date ? new Date(u.created_date).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-3 pr-4">
                                <ActionButtons u={u} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {reasonTarget?.action === "reject" ? "Reject user" : reasonTarget?.action === "ban" ? "Permanently ban user" : "Suspend user"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Please provide a short reason (optional) to record alongside this decision.
            </p>
            <textarea
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full rounded-md bg-slate-800 border border-slate-700 p-3 text-white"
              placeholder="Reason (optional)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setReasonDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleReasonConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
