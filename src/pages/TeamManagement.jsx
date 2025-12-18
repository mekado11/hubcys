import React, { useState, useEffect } from 'react';
import { Team } from '@/entities/Team';
import { TeamMember } from '@/entities/TeamMember';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Users, Edit, Trash2, Loader2, Lock } from 'lucide-react';
import SubscriptionGate from '../components/ui/SubscriptionGate';
import { SUBSCRIPTION_TIERS, canAccessTeamManagement } from '../components/utils/subscriptionUtils';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setIsAuthenticated(true);
      setCurrentUser(user);
      
      // Check if user can access team management
      if (!canAccessTeamManagement(user.subscription_tier)) {
        setLoading(false);
        return;
      }
      
      const teamsData = await Team.list();
      const membersData = await TeamMember.list();
      setTeams(teamsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading team data:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeam = async () => {
    try {
      if (!currentUser?.company_id) {
        alert("Company information not found. Cannot create/update team.");
        return;
      }

      const teamData = {
        name: teamName.trim(),
        description: teamDescription.trim(),
        company_name: currentUser.company_name,
        team_lead_email: currentUser.email,
      };
      
      if (editingTeam) {
        await Team.update(editingTeam.id, teamData);
      } else {
        await Team.create(teamData);
      }
      
      setShowDialog(false);
      setEditingTeam(null);
      setTeamName('');
      setTeamDescription('');
      loadData();
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Unable to save team. Please try again.');
    }
  };
  
  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description);
    setShowDialog(true);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team and all its members?')) {
      return;
    }
    
    try {
      // Delete team members first
      const teamMembers = members.filter(m => m.team_id === teamId);
      for (const member of teamMembers) {
        await TeamMember.delete(member.id);
      }
      // Then delete the team
      await Team.delete(teamId);
      loadData();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Unable to delete team. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center cyber-gradient">
        <Loader2 className="animate-spin h-12 w-12 text-cyan-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-4">
        <div className="text-center bg-slate-900/50 p-8 rounded-lg border border-red-500/30 max-w-md">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">You must be logged in to manage teams.</p>
          <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGate
      currentTier={currentUser?.subscription_tier || 'free_trial'}
      requiredTier={SUBSCRIPTION_TIERS.GROWTH}
      featureName="Team Management"
      description="This feature requires a Growth plan or higher. Upgrade your plan to create teams, assign roles, and manage user permissions."
    >
      <div className="min-h-screen cyber-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold cyber-text-glow flex items-center">
                <Users className="w-8 h-8 mr-3" />
                Team Management
              </h1>
              <p className="text-gray-400">Organize users into teams and manage access.</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingTeam(null); setTeamName(''); setTeamDescription(''); setShowDialog(true); }} className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 cyber-glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-cyan-500/20 text-white">
                <DialogHeader>
                  <DialogTitle className="text-cyan-300">{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="bg-slate-800/50 border-gray-600"
                  />
                  <Input
                    placeholder="Team Description"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    className="bg-slate-800/50 border-gray-600"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveTeam} className="bg-gradient-to-r from-cyan-500 to-purple-500">
                    {editingTeam ? 'Save Changes' : 'Create Team'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="glass-effect border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-purple-300">{team.name}</CardTitle>
                      <p className="text-sm text-gray-400">{team.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => handleEditTeam(team)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400" onClick={() => handleDeleteTeam(team.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-gray-300 mb-2">Members ({members.filter(m => m.team_id === team.id).length})</h4>
                  <div className="space-y-2">
                    {members.filter(m => m.team_id === team.id).map(member => (
                      <div key={member.id} className="flex items-center justify-between text-sm p-2 bg-slate-800/50 rounded-md">
                        <span className="text-gray-300">{member.user_email}</span>
                        <span className="capitalize text-xs text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-full">{member.role}</span>
                      </div>
                    ))}
                    {members.filter(m => m.team_id === team.id).length === 0 && (
                      <p className="text-xs text-center text-gray-500 py-2">No members in this team yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {teams.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No teams yet</h3>
                <p className="text-gray-400 mb-4">Create your first team to get started with team management.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SubscriptionGate>
  );
}