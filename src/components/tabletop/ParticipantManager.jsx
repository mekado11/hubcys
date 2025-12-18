
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
// Keep Textarea if it might be used elsewhere or planned
// Keep Switch if it might be used elsewhere or planned
import { Plus, Users, Trash2 } from 'lucide-react'; // Added Trash2, removed X and Edit3

// Keep Select components if they might be used elsewhere or planned
// Keep Separator if it might be used elsewhere or planned

const functionalRoleOptions = [
  'Incident Commander',
  'Technical Lead',
  'Communications Lead',
  'Legal/Compliance',
  'HR Representative',
  'IT/Security',
  'Business Continuity',
  'External Relations',
  'Executive Sponsor'
];

export default function ParticipantManager({ participants = [], onChange, currentUser }) {
  const [localParticipants, setLocalParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState({
    participant_name: '',
    participant_email: '',
    role_title: '',
    functional_roles: [],
    systems_owned: '',
    contact_methods: ''
  });

  // Initialize local participants from props
  useEffect(() => {
    console.log("ParticipantManager: Received participants:", participants);
    if (Array.isArray(participants)) {
      setLocalParticipants(participants);
    } else {
      // If participants is a string (JSON), parse it
      try {
        const parsed = typeof participants === 'string' ? JSON.parse(participants) : [];
        setLocalParticipants(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Error parsing participants:", error);
        setLocalParticipants([]);
      }
    }
  }, [participants]);

  const handleAddParticipant = () => {
    console.log("ParticipantManager: Adding participant:", newParticipant);
    
    if (!newParticipant.participant_name.trim() || !newParticipant.participant_email.trim()) {
      alert('Please fill in both name and email fields.');
      return;
    }

    const participantToAdd = {
      ...newParticipant,
      id: Date.now().toString(), // Simple ID generation
      participation_status: 'Invited'
    };

    const updatedParticipants = [...localParticipants, participantToAdd];
    console.log("ParticipantManager: Updated participants list:", updatedParticipants);
    
    setLocalParticipants(updatedParticipants);
    onChange(updatedParticipants); // Notify parent component
    
    // Reset form
    setNewParticipant({
      participant_name: '',
      participant_email: '',
      role_title: '',
      functional_roles: [],
      systems_owned: '',
      contact_methods: ''
    });
  };

  const handleRemoveParticipant = (index) => {
    const updatedParticipants = localParticipants.filter((_, i) => i !== index);
    console.log("ParticipantManager: Removing participant, updated list:", updatedParticipants);
    setLocalParticipants(updatedParticipants);
    onChange(updatedParticipants);
  };

  return (
    <Card className="glass-effect border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Exercise Participants</CardTitle>
        <CardDescription className="text-gray-400">
          Add team members who will participate in this tabletop exercise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Participants List */}
        {localParticipants.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Current Participants ({localParticipants.length})
            </h4>
            <div className="space-y-3">
              {localParticipants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {participant.participant_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{participant.participant_name}</p>
                        <p className="text-gray-400 text-sm">{participant.participant_email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {participant.functional_roles?.map((role, roleIndex) => (
                        <Badge key={roleIndex} variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                          {role}
                        </Badge>
                      ))}
                      {participant.role_title && (
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                          {participant.role_title}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveParticipant(index)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Participant Form */}
        <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Add New Participant</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="participant_name" className="text-gray-300">Full Name *</Label>
              <Input
                id="participant_name"
                value={newParticipant.participant_name}
                onChange={(e) => setNewParticipant(prev => ({...prev, participant_name: e.target.value}))}
                placeholder="Enter participant's full name"
                className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="participant_email" className="text-gray-300">Email Address *</Label>
              <Input
                id="participant_email"
                type="email"
                value={newParticipant.participant_email}
                onChange={(e) => setNewParticipant(prev => ({...prev, participant_email: e.target.value}))}
                placeholder="Enter email address"
                className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="role_title" className="text-gray-300">Job Title</Label>
              <Input
                id="role_title"
                value={newParticipant.role_title}
                onChange={(e) => setNewParticipant(prev => ({...prev, role_title: e.target.value}))}
                placeholder="e.g., CISO, IT Manager"
                className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="systems_owned" className="text-gray-300">Systems/Processes Owned</Label>
              <Input
                id="systems_owned"
                value={newParticipant.systems_owned}
                onChange={(e) => setNewParticipant(prev => ({...prev, systems_owned: e.target.value}))}
                placeholder="e.g., Network Infrastructure"
                className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Functional Roles - Multi-select */}
          <div>
            <Label className="text-gray-300">Exercise Roles</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {functionalRoleOptions.map((role) => (
                <Button
                  key={role}
                  type="button"
                  variant={newParticipant.functional_roles.includes(role) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const updatedRoles = newParticipant.functional_roles.includes(role)
                      ? newParticipant.functional_roles.filter(r => r !== role)
                      : [...newParticipant.functional_roles, role];
                    setNewParticipant(prev => ({...prev, functional_roles: updatedRoles}));
                  }}
                  className={`text-xs ${
                    newParticipant.functional_roles.includes(role)
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAddParticipant}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
            disabled={!newParticipant.participant_name.trim() || !newParticipant.participant_email.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Participant
          </Button>
        </div>

        {localParticipants.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p>No participants added yet</p>
            <p className="text-sm">Add at least one participant to continue with the exercise</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
