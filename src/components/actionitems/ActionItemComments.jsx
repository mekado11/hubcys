import React, { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/entities/Comment';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActionItemComments({ actionItemId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!actionItemId) return;
    setLoading(true);
    try {
      const relatedComments = await Comment.filter({ action_item_id: actionItemId });
      setComments(relatedComments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [actionItemId]);

  useEffect(() => {
    const loadUserAndComments = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        await fetchComments();
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUserAndComments();
  }, [fetchComments]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !actionItemId) return;
    
    setIsPosting(true);
    try {
      await Comment.create({
        action_item_id: actionItemId,
        content: newComment,
        author_email: currentUser.email,
        author_name: currentUser.full_name || currentUser.email,
      });
      setNewComment('');
      await fetchComments(); // Re-fetch to display the new comment
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-white flex items-center">
        <MessageSquare className="w-5 h-5 mr-2 text-purple-400"/>
        Discussion
      </h4>
      
      <form onSubmit={handlePostComment} className="space-y-3">
        <Textarea
          placeholder="Add a comment... (Markdown supported)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="bg-slate-800/50 border-gray-600 text-white min-h-[80px]"
          disabled={isPosting}
        />
        <div className="flex justify-end">
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isPosting || !newComment.trim()}>
            {isPosting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Post Comment
          </Button>
        </div>
      </form>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {loading && <Loader2 className="w-6 h-6 animate-spin text-purple-400" />}
        {comments.map(comment => (
          <div key={comment.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-purple-300">
              {comment.author_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-white text-sm">{comment.author_name}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                </p>
              </div>
              <p className="text-sm text-gray-300 mt-1 prose prose-invert max-w-none prose-sm">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}