import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Trash2, Reply, X, Heart, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useRestrictions } from '@/hooks/useRestrictions';
import { runAutomod } from '@/lib/automod';
import { useAdmin } from '@/hooks/useAdmin';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  is_liked: boolean;
  author_banned: boolean;
}

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}

export function CommentSection({ postId, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const { user } = useAuth();
  const { playClick, playPop, playUnpop } = useSoundEffects();
  const { canComment, isBanned, isSuspended } = useRestrictions();
  const { isAdmin, isModerator, isOwner } = useAdmin();
  const canDeleteAnyComment = isAdmin || isModerator || isOwner;
  // Admins, Moderators, and Owners can still edit comments.
  const canEditAnyComment = isAdmin || isModerator || isOwner;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    // Fetch comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!commentsData) return;

    // Fetch profiles for comment authors
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    // Fetch ban status for comment authors (banned users' comments are replaced with system text)
    const { data: bannedData } = userIds.length
      ? await supabase
          .from('user_restrictions')
          .select('user_id')
          .eq('restriction_type', 'banned')
          .in('user_id', userIds)
      : { data: [] as { user_id: string }[] };
    const bannedSet = new Set((bannedData || []).map(r => r.user_id));

    // Fetch likes for comments if user is logged in
    let userLikes: string[] = [];
    if (user) {
      const { data: likesData } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentsData.map(c => c.id));
      userLikes = likesData?.map(l => l.comment_id) || [];
    }

    // Fetch likes count for each comment
    const commentIds = commentsData.map(c => c.id);
    const { data: likesCountData } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', commentIds);

    const likesCountMap = new Map<string, number>();
    likesCountData?.forEach(like => {
      likesCountMap.set(like.comment_id, (likesCountMap.get(like.comment_id) || 0) + 1);
    });

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    const enrichedComments: Comment[] = commentsData.map(comment => {
      const profile = profilesMap.get(comment.user_id);
      return {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_id: comment.user_id,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        likes_count: likesCountMap.get(comment.id) || 0,
        is_liked: userLikes.includes(comment.id),
        author_banned: bannedSet.has(comment.user_id),
      };
    });

    setComments(enrichedComments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;

    setLoading(true);
    
    // If replying, prepend the @mention
    const commentContent = replyingTo 
      ? `@${replyingTo.username} ${newComment.trim()}`
      : newComment.trim();

    const { error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content: commentContent });

    if (!error) {
      // Run automod on comment content
      const banned = await runAutomod(user.id, commentContent);
      if (banned) {
        // Delete the comment that was just inserted
        await supabase.from('comments').delete().eq('post_id', postId).eq('user_id', user.id).eq('content', commentContent);
        setLoading(false);
        return;
      }
      setNewComment('');
      setReplyingTo(null);
      fetchComments();
      onCommentAdded();
    }
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    playClick();
    await supabase.from('comment_likes').delete().eq('comment_id', commentId);
    await supabase.from('comments').delete().eq('id', commentId);
    setComments(comments.filter(c => c.id !== commentId));
    onCommentDeleted();
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo({ id: comment.id, username: comment.username });
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user || isBanned || isSuspended) return;

    if (isLiked) {
      playUnpop();
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
    } else {
      playPop();
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
    }
    
    // Update local state
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          is_liked: !isLiked,
          likes_count: isLiked ? c.likes_count - 1 : c.likes_count + 1,
        };
      }
      return c;
    }));
  };

  const startEditing = (comment: Comment) => {
    setEditingComment({ id: comment.id, content: comment.content });
  };

  const cancelEditing = () => {
    setEditingComment(null);
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !editingComment.content.trim()) return;

    playClick();
    const { error } = await supabase
      .from('comments')
      .update({ content: editingComment.content.trim() })
      .eq('id', editingComment.id);

    if (!error) {
      setComments(comments.map(c => {
        if (c.id === editingComment.id) {
          return { ...c, content: editingComment.content.trim() };
        }
        return c;
      }));
      setEditingComment(null);
    }
  };

  // Function to render comment content with highlighted mentions
  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="mt-4 pt-4 border-t-2 border-border/50 space-y-4">
      {user && !canComment && (
        <div className="text-center py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="text-destructive mc-text text-sm">⚠️ This account can no longer comment.</p>
          <p className="text-muted-foreground text-xs mt-1">If you believe this is a mistake, please contact support.</p>
        </div>
      )}
      {user && canComment && (
        <div className="space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
              <Reply className="h-4 w-4" />
              <span>Replying to <span className="text-primary font-medium">@{replyingTo.username}</span></span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-auto hover:text-destructive"
                onClick={cancelReply}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
              className="flex-1 bg-secondary/50 border-2 border-border input-glow"
            />
            <Button type="submit" size="icon" disabled={loading || !newComment.trim()} className="minecraft-border">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 transition-all hover:border-primary/30">
            <Avatar className="h-8 w-8 border border-primary/20">
              <AvatarImage src={comment.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-display">
                {comment.username?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-display font-medium text-sm text-foreground">
                    {comment.username}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {user && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-6 w-6 ${comment.is_liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        onClick={() => handleLikeComment(comment.id, comment.is_liked)}
                      >
                        <Heart className={`h-3 w-3 ${comment.is_liked ? 'fill-primary' : ''}`} />
                      </Button>
                      {comment.likes_count > 0 && (
                        <span className="text-xs text-muted-foreground mr-1">{comment.likes_count}</span>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        onClick={() => handleReply(comment)}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {(user?.id === comment.user_id || canEditAnyComment) && !comment.author_banned && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={() => startEditing(comment)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  {(user?.id === comment.user_id || canDeleteAnyComment) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {editingComment?.id === comment.id ? (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={editingComment.content}
                    onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                    className="flex-1 bg-secondary/50 border-2 border-border input-glow text-sm"
                    autoFocus
                  />
                  <Button size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : comment.author_banned ? (
                <p className="text-sm italic text-muted-foreground mt-1">
                  Comment has been deleted due to user ban.
                </p>
              ) : (
                <p className="text-sm text-foreground/90 mt-1">{renderCommentContent(comment.content)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
