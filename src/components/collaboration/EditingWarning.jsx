import React, { useState, useEffect } from 'react';
import { EditingSession } from '@/entities/EditingSession';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EditingWarning({ 
  entityType, 
  entityId, 
  currentUser,
  section = null 
}) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [mySession, setMySession] = useState(null);

  useEffect(() => {
    if (!entityId || !currentUser) return;

    const startSession = async () => {
      try {
        // Clean up old sessions (older than 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const oldSessions = await EditingSession.filter({
          company_id: currentUser.company_id,
          entity_type: entityType,
          entity_id: entityId,
          last_heartbeat: { $lt: twoMinutesAgo }
        });
        
        for (const oldSession of oldSessions) {
          await EditingSession.delete(oldSession.id);
        }

        // Create or update my session
        const existingSessions = await EditingSession.filter({
          company_id: currentUser.company_id,
          entity_type: entityType,
          entity_id: entityId,
          user_email: currentUser.email
        });

        if (existingSessions.length > 0) {
          const updated = await EditingSession.update(existingSessions[0].id, {
            last_heartbeat: new Date().toISOString(),
            section: section
          });
          setMySession(updated);
        } else {
          const created = await EditingSession.create({
            company_id: currentUser.company_id,
            entity_type: entityType,
            entity_id: entityId,
            user_email: currentUser.email,
            user_name: currentUser.full_name || currentUser.email,
            last_heartbeat: new Date().toISOString(),
            section: section
          });
          setMySession(created);
        }

        checkActiveSessions();
      } catch (error) {
        console.error('Error managing editing session:', error);
      }
    };

    const checkActiveSessions = async () => {
      try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const sessions = await EditingSession.filter({
          company_id: currentUser.company_id,
          entity_type: entityType,
          entity_id: entityId,
          last_heartbeat: { $gte: oneMinuteAgo },
          user_email: { $ne: currentUser.email }
        });
        setActiveSessions(sessions);
      } catch (error) {
        console.error('Error checking active sessions:', error);
      }
    };

    startSession();
    const heartbeatInterval = setInterval(startSession, 30000); // Update every 30 seconds
    const checkInterval = setInterval(checkActiveSessions, 15000); // Check every 15 seconds

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(checkInterval);
      
      // Clean up session on unmount
      if (mySession) {
        EditingSession.delete(mySession.id).catch(console.error);
      }
    };
  }, [entityId, entityType, currentUser, section]);

  if (activeSessions.length === 0) {
    return null;
  }

  return (
    <Alert className="bg-yellow-900/20 border-yellow-500/30 mb-4">
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-yellow-500 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-yellow-200">
            <div className="font-semibold mb-2">Other users are viewing or editing this {entityType}:</div>
            <div className="flex flex-wrap gap-2">
              {activeSessions.map(session => (
                <Badge 
                  key={session.id} 
                  variant="outline" 
                  className="bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {session.user_name}
                  {session.section && ` • ${session.section}`}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-yellow-300/70 mt-2">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Save frequently to avoid conflicts. If multiple people save at the same time, the last save will win.
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}