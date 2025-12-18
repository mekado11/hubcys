import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncidentNote } from "@/entities/IncidentNote";
import { format } from "date-fns";
import { MessageSquare, Brain, User as UserIcon, Send, Loader2, MessageCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import CommentThread from '../collaboration/CommentThread';

export default function IncidentNotesManager({ incidentId, notes, currentUser, onNoteAdded }) {
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      await IncidentNote.create({
        incident_id: incidentId,
        note_type: "General",
        content: newNote,
        author_email: currentUser.email,
        author_name: currentUser.full_name || currentUser.email
      });
      setNewNote("");
      onNoteAdded(); // Callback to refresh notes in parent
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note. Please try again.");
    } finally {
      setAddingNote(false);
    }
  };

  const getNoteAuthorIcon = (authorName) => {
    if (authorName === "Automated Summary") {
      return <Brain className="w-5 h-5 text-purple-400" />;
    }
    return <UserIcon className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <Card className="glass-effect border-gray-500/20">
      <CardHeader>
        <CardTitle className="text-gray-300 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Incident Notes &amp; Collaboration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            {/* Add Note Form */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-gray-700/50">
              <h4 className="text-lg font-semibold text-white mb-2">Add a Note</h4>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add an update, observation, or action taken..."
                className="bg-slate-900/70 border-gray-600 text-white h-24 mb-3"
              />
              <div className="flex justify-end">
                <Button onClick={handleAddNote} disabled={addingNote}>
                  {addingNote ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Add Note</>
                  )}
                </Button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {notes && notes.length > 0 ? (
                notes.map(note => (
                  <div key={note.id} className={`p-4 rounded-lg border ${note.author_name === 'Automated Summary' ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-800/30 border-gray-700/50'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getNoteAuthorIcon(note.author_name)}
                        <div>
                          <p className="font-semibold text-white">{note.author_name}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(note.created_date), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize bg-slate-700 text-gray-300 border-none">
                        {note.note_type}
                      </Badge>
                    </div>
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-300 [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-6 [&_p]:my-2">
                      <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2" />
                  <p>No notes have been added to this incident yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <CommentThread
              entityType="incident"
              entityId={incidentId}
              currentUser={currentUser}
              onCommentAdded={onNoteAdded}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}