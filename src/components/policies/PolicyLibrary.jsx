import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  FileText,
  Edit,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Policy } from '@/entities/Policy';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { POLICY_TEMPLATES, FRAMEWORK_MAPPINGS } from './PolicyTemplates';
import PolicyExportButton from './PolicyExportButton';

const STATUS_COLORS = {
  Approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  In_Review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  Archived: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const PRIORITY_COLORS = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const CATEGORY_ICONS = {
  'Identity & Access': '🔐',
  'Security Operations': '🛡️',
  'Data Protection': '💾',
  'Data Governance': '📋',
  'Third-Party Risk': '🤝',
  'User Governance': '👥',
  'IT Operations': '⚙️',
  'Physical & Environmental': '🏢',
  'Resilience': '♻️',
  'Endpoint Security': '💻',
};

export default function PolicyLibrary() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [creatingTemplate, setCreatingTemplate] = useState(null);

  useEffect(() => {
    fetchPolicies();
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setPolicies(await Policy.list('-updated_date'));
    } catch {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  const createFromTemplate = async (templateKey) => {
    const template = POLICY_TEMPLATES[templateKey];
    if (!template || creatingTemplate) return;
    setCreatingTemplate(templateKey);
    try {
      const companyName = currentUser?.company_name || '[COMPANY NAME]';
      const newPolicy = await Policy.create({
        company_id: currentUser.company_id,
        policy_type: templateKey,
        title: template.title,
        content: template.content(companyName),
        status: 'Draft',
        framework_alignment: template.frameworks,
        version: '1.0',
      });
      toast.success(`${template.title} created`);
      window.location.href = createPageUrl(`PolicyEditor?id=${newPolicy.id}`);
    } catch {
      toast.error('Failed to create policy');
    } finally {
      setCreatingTemplate(null);
    }
  };

  const filtered = policies.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.policy_type.toLowerCase().includes(q);
    const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: policies.length,
    approved: policies.filter(p => p.status === 'Approved').length,
    review: policies.filter(p => p.status === 'In_Review').length,
    draft: policies.filter(p => p.status === 'Draft').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            Policy Library
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage security policies with professional templates and framework alignment.
          </p>
        </div>
        <Link to={createPageUrl('PolicyGenerator')}>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            AI Policy Generator
          </Button>
        </Link>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-cyan-400', border: 'border-cyan-500/20' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-400', border: 'border-emerald-500/20' },
          { label: 'In Review', value: stats.review, icon: Clock, color: 'text-amber-400', border: 'border-amber-500/20' },
          { label: 'Draft', value: stats.draft, icon: AlertTriangle, color: 'text-slate-400', border: 'border-slate-500/20' },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <Card key={label} className={`glass-effect ${border} bg-slate-800/40`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
              <Icon className={`w-7 h-7 ${color} opacity-80`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="policies" className="space-y-5">
        <TabsList className="bg-slate-800/60 border border-slate-700">
          <TabsTrigger value="policies" className="data-[state=active]:bg-slate-700 text-white">
            My Policies {policies.length > 0 && <span className="ml-1.5 text-xs bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded-full">{policies.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-slate-700 text-white">
            Templates <span className="ml-1.5 text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full">{Object.keys(POLICY_TEMPLATES).length}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── My Policies Tab ── */}
        <TabsContent value="policies" className="space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search policies…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-600 text-white h-9"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Draft', 'In_Review', 'Approved', 'Archived'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedStatus === s
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-gray-400 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Policy Cards */}
          {filtered.length === 0 ? (
            <Card className="glass-effect border-slate-600/30">
              <CardContent className="p-12 text-center">
                <FileText className="w-14 h-14 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchTerm ? 'No matching policies' : 'No policies yet'}
                </h3>
                <p className="text-gray-400 text-sm mb-5">
                  {searchTerm ? 'Try adjusting your search.' : 'Create your first policy from our professional templates below.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(policy => {
                const tpl = POLICY_TEMPLATES[policy.policy_type];
                return (
                  <Card key={policy.id} className="glass-effect border-slate-600/20 hover:border-cyan-500/30 transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-slate-700/60 flex items-center justify-center text-lg shrink-0">
                          {CATEGORY_ICONS[tpl?.category] || '📄'}
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white truncate">{policy.title}</span>
                            <Badge className={`${STATUS_COLORS[policy.status] || STATUS_COLORS.Draft} text-xs`}>
                              {policy.status?.replace('_', ' ')}
                            </Badge>
                            {tpl?.priority && (
                              <Badge className={`${PRIORITY_COLORS[tpl.priority]} text-xs`}>
                                {tpl.priority}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">v{policy.version}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(policy.framework_alignment || []).slice(0, 4).map(f => (
                              <span key={f} className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded">
                                {FRAMEWORK_MAPPINGS[f]?.name || f}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="hidden md:block text-xs text-gray-500 shrink-0">
                          {new Date(policy.updated_date).toLocaleDateString()}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          <Link to={createPageUrl(`PolicyEditor?id=${policy.id}`)}>
                            <Button variant="outline" size="sm" className="border-slate-600 text-gray-300 hover:bg-slate-700 gap-1.5">
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                          </Link>
                          <PolicyExportButton
                            policy={policy}
                            companyName={currentUser?.company_name}
                            size="sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Templates Tab ── */}
        <TabsContent value="templates" className="space-y-5">
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-start gap-3">
            <Layers className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Professional Policy Templates</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Aligned to NIST SP 800-53 Rev 5, SOC 2 Type II, and ISO 27001:2022. Auto-filled with your organisation name. Click to create and customise.
              </p>
            </div>
          </div>

          {/* Group by category */}
          {Object.entries(
            Object.entries(POLICY_TEMPLATES).reduce((acc, [key, tpl]) => {
              const cat = tpl.category || 'Other';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push([key, tpl]);
              return acc;
            }, {})
          ).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span>{CATEGORY_ICONS[category] || '📄'}</span>
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(([key, template]) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/40 hover:bg-slate-800/80 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-white text-sm">{template.title}</span>
                        <Badge className={`${PRIORITY_COLORS[template.priority]} text-xs`}>
                          {template.priority}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.frameworks.map(f => (
                          <span key={f} className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded">
                            {FRAMEWORK_MAPPINGS[f]?.name || f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => createFromTemplate(key)}
                      disabled={!!creatingTemplate}
                      className="shrink-0 bg-purple-600/80 hover:bg-purple-600 text-white border-0 gap-1"
                    >
                      {creatingTemplate === key ? (
                        <div className="w-3.5 h-3.5 border border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Use
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}