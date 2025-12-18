import React, { useState, useEffect, useRef } from 'react';
import { Comment } from '@/entities/Comment';
import { User } from '@/entities/User';
import { Notification } from '@/entities/Notification';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Reply, Edit2, Trash2, User as UserIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function CommentThread({ 
  entityType, 
  entityId, 
  currentUser, 
  onCommentAdded 
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [companyUsers, setCompanyUsers] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadComments();
    loadCompanyUsers();
  }, [entityId]);

  const loadComments = async () => {
    if (!entityId || !currentUser?.company_id) return;
    
    setLoading(true);
    try {
      const filter = {
        company_id: currentUser.company_id,
        [`${entityType}_id`]: entityId
      };
      const fetchedComments = await Comment.filter(filter, '-created_date');
      setComments(fetchedComments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyUsers = async () => {
    if (!currentUser?.company_id) return;
    try {
      const users = await User.filter({ company_id: currentUser.company_id });
      setCompanyUsers(users || []);
    } catch (error) {
      console.error('Error loading company users:', error);
    }
  };

  const detectMentions = (text) => {
    const regex = /@(\w+)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  const findMentionedUsers = (text) => {
    const mentions = detectMentions(text);
    const mentionedEmails = [];
    
    mentions.forEach(mention => {
      const user = companyUsers.find(u => 
        u.full_name?.toLowerCase().includes(mention.toLowerCase()) ||
        u.email?.toLowerCase().startsWith(mention.toLowerCase())
      );
      if (user) mentionedEmails.push(user.email);
    });
    
    return mentionedEmails;
  };

  const handleTextChange = (value) => {
    setNewComment(value);
    
    // Detect @ mentions
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1 && lastAtSymbol === cursorPos - 1) {
      setShowMentions(true);
      setMentionQuery('');
      setMentionSuggestions(companyUsers);
    } else if (lastAtSymbol !== -1 && cursorPos > lastAtSymbol) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1);
      if (!query.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(query);
        const filtered = companyUsers.filter(u =>
          u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase())
        );
        setMentionSuggestions(filtered);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = newComment.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    const before = newComment.substring(0, lastAtSymbol);
    const after = newComment.substring(cursorPos);
    const mention = `@${user.full_name || user.email}`;
    
    setNewComment(before + mention + ' ' + after);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const createNotifications = async (comment, mentionedEmails) => {
    if (!mentionedEmails || mentionedEmails.length === 0) return;
    
    try {
      const notificationPromises = mentionedEmails.map(email => {
        if (email === currentUser.email) return Promise.resolve();
        
        return Notification.create({
          company_id: currentUser.company_id,
          recipient_email: email,
          sender_email: currentUser.email,
          sender_name: currentUser.full_name || currentUser.email,
          notification_type: 'mention',
          title: `${currentUser.full_name || currentUser.email} mentioned you`,
          message: comment.content.substring(0, 100),
          related_entity_type: entityType,
          related_entity_id: entityId,
          link_url: window.location.pathname + window.location.search
        });
      });
      
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const mentionedEmails = findMentionedUsers(newComment);
      
      const commentData = {
        [`${entityType}_id`]: entityId,
        content: newComment,
        author_email: currentUser.email,
        author_name: currentUser.full_name || currentUser.email,
        company_id: currentUser.company_id,
        mentioned_users: mentionedEmails,
        parent_comment_id: replyingTo?.id || null
      };
      
      const createdComment = await Comment.create(commentData);
      
      await createNotifications(createdComment, mentionedEmails);
      
      setNewComment('');
      setReplyingTo(null);
      loadComments();
      if (onCommentAdded) onCommentAdded();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const mentionedEmails = findMentionedUsers(newComment);
      
      await Comment.update(editingComment.id, {
        content: newComment,
        mentioned_users: mentionedEmails,
        edited: true,
        edited_at: new Date().toISOString()
      });
      
      await createNotifications({ content: newComment }, mentionedEmails);
      
      setNewComment('');
      setEditingComment(null);
      loadComments();
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await Comment.delete(commentId);
      loadComments();
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const startReply = (comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.author_name} `);
    textareaRef.current?.focus();
  };

  const startEdit = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.content);
    textareaRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setReplyingTo(null);
    setNewComment('');
  };

  const renderComment = (comment, isReply = false) => {
    const replies = comments.filter(c => c.parent_comment_id === comment.id);
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mb-4'}`}>
        <Card className="glass-effect border-gray-600/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-white">{comment.author_name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {format(new Date(comment.created_date), 'MMM d, yyyy h:mm a')}
                  </span>
                  {comment.edited && (
                    <Badge variant="outline" className="ml-2 text-xs border-gray-600 text-gray-400">
                      edited
                    </Badge>
                  )}
                </div>
                
                {comment.author_email === currentUser.email && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(comment)}
                      className="h-7 px-2 text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="h-7 px-2 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{comment.content}</ReactMarkdown>
              </div>
              
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startReply(comment)}
                  className="h-7 px-2 text-gray-400 hover:text-cyan-400"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        {replies.length > 0 && (
          <div className="mt-3">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Reply className="w-5 h-5 text-cyan-400" />
        Comments ({comments.length})
      </h3>
      
      {/* New Comment / Edit Form */}
      <Card className="glass-effect border-cyan-500/30 p-4">
        {replyingTo && (
          <div className="mb-3 p-2 bg-cyan-500/10 rounded border border-cyan-500/30">
            <p className="text-xs text-cyan-300">Replying to {replyingTo.author_name}</p>
          </div>
        )}
        {editingComment && (
          <div className="mb-3 p-2 bg-orange-500/10 rounded border border-orange-500/30">
            <p className="text-xs text-orange-300">Editing comment</p>
          </div>
        )}
        
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Add a comment... (use @name to mention someone)"
            className="bg-slate-800/50 border-gray-600 text-white min-h-[80px]"
          />
          
          {showMentions && mentionSuggestions.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-slate-800 border-cyan-500/30">
              {mentionSuggestions.slice(0, 5).map(user => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className="w-full px-3 py-2 text-left hover:bg-cyan-500/10 transition-colors flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-sm text-white">{user.full_name || user.email}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </button>
              ))}
            </Card>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-400">
            Tip: Use @ to mention team members
          </p>
          <div className="flex gap-2">
            {(replyingTo || editingComment) && (
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={editingComment ? handleUpdateComment : handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {editingComment ? 'Update' : 'Post'}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Comments List */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Reply className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          topLevelComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}