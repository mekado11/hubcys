
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
  Download,
  Edit,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Policy } from '@/entities/Policy';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { POLICY_TEMPLATES, FRAMEWORK_MAPPINGS } from './PolicyTemplates';

export default function PolicyLibrary() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  const fetchCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedPolicies = await Policy.list('-updated_date');
      setPolicies(fetchedPolicies);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
    fetchCurrentUser();
  }, [fetchPolicies]);

  const createPolicyFromTemplate = async (templateKey) => {
    try {
      const template = POLICY_TEMPLATES[templateKey];
      if (!template) return;

      const companyName = currentUser?.company_name || '[COMPANY NAME]';
      const policyContent = template.content(companyName);

      const newPolicy = await Policy.create({
        company_id: currentUser.company_id,
        policy_type: templateKey,
        title: template.title,
        content: policyContent,
        status: 'Draft',
        framework_alignment: template.frameworks,
        version: '1.0'
      });

      toast.success(`${template.title} created from template`);
      fetchPolicies();
      
      // Navigate to editor
      window.location.href = createPageUrl(`PolicyEditor?id=${newPolicy.id}`);
    } catch (error) {
      console.error('Error creating policy from template:', error);
      toast.error('Failed to create policy');
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = !searchTerm || 
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.policy_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      policy.policy_type === selectedCategory;
    
    const matchesStatus = selectedStatus === 'all' || 
      policy.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'In_Review': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'Archived': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Policy Library</h1>
          <p className="text-gray-400">
            Manage your organization's security policies with professional templates and framework alignment.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl('PolicyGenerator')}>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Policy
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-effect border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Policies</p>
                <p className="text-2xl font-bold text-white">{policies.length}</p>
              </div>
              <FileText className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-white">
                  {policies.filter(p => p.status === 'Approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Review</p>
                <p className="text-2xl font-bold text-white">
                  {policies.filter(p => p.status === 'In_Review').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Needs Attention</p>
                <p className="text-2xl font-bold text-white">
                  {policies.filter(p => p.status === 'Draft').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="policies" className="text-white">My Policies</TabsTrigger>
          <TabsTrigger value="templates" className="text-white">Professional Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          {/* Filters */}
          <Card className="glass-effect border-slate-600/30">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search policies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-gray-600 rounded-md text-white"
                >
                  <option value="all">All Categories</option>
                  {Object.keys(POLICY_TEMPLATES).map(key => (
                    <option key={key} value={key}>{POLICY_TEMPLATES[key].title}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-gray-600 rounded-md text-white"
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="In_Review">In Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Policy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id} className="glass-effect border-slate-600/30 hover:border-cyan-500/50 transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-white line-clamp-2">
                      {policy.title}
                    </CardTitle>
                    <Badge className={getPriorityColor(POLICY_TEMPLATES[policy.policy_type]?.priority || 'medium')}>
                      {POLICY_TEMPLATES[policy.policy_type]?.priority || 'medium'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(policy.status)}>
                      {policy.status}
                    </Badge>
                    <Badge variant="outline" className="text-gray-300 border-gray-600">
                      v{policy.version}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Framework Alignment:</p>
                      <div className="flex flex-wrap gap-1">
                        {(policy.framework_alignment || []).map((framework) => (
                          <Badge key={framework} variant="secondary" className="text-xs bg-blue-500/20 text-blue-300">
                            {FRAMEWORK_MAPPINGS[framework]?.name || framework}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(policy.updated_date).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link to={createPageUrl(`PolicyEditor?id=${policy.id}`)} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Export/download functionality
                          const blob = new Blob([policy.content], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${policy.title.replace(/[^a-z0-9]/gi, '_')}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPolicies.length === 0 && (
            <Card className="glass-effect border-slate-600/30">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Policies Found</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm ? 'No policies match your search criteria.' : 'Get started by creating your first policy from our professional templates.'}
                </p>
                <Link to={createPageUrl('PolicyGenerator')}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Policy
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="glass-effect border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-300 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Professional Policy Templates
              </CardTitle>
              <p className="text-gray-400">
                Industry-standard policy templates with built-in framework alignment and best practices.
              </p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(POLICY_TEMPLATES).map(([key, template]) => (
              <Card key={key} className="glass-effect border-purple-500/30 hover:border-purple-400/50 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{template.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(template.priority)}>
                      {template.priority}
                    </Badge>
                    <Badge variant="outline" className="text-purple-300 border-purple-500/30">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Framework Alignment:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.frameworks.map((framework) => (
                          <Badge key={framework} variant="secondary" className="text-xs bg-blue-500/20 text-blue-300">
                            {FRAMEWORK_MAPPINGS[framework]?.name || framework}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => createPolicyFromTemplate(key)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create from Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
