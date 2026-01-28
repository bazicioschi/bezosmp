import { useState } from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  onLikeToggle: () => void;
  onDelete: () => void;
}

export function PostCard({
  id,
  content,
  imageUrl,
  createdAt,
  userId,
  username,
  avatarUrl,
  likesCount,
  commentsCount,
  isLiked,
  onLikeToggle,
  onDelete,
}: PostCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);

    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: user.id });
    }
    onLikeToggle();
  };

  const handleDelete = async () => {
    if (!user || user.id !== userId) return;
    await supabase.from('posts').delete().eq('id', id);
    onDelete();
  };

  return (
    <article className="minecraft-card minecraft-border card-hover p-4 md:p-6">
      <div className="flex gap-3 md:gap-4">
        <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-primary/30">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-display">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-display font-semibold text-foreground">{username}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            </div>
            {user?.id === userId && (
              <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="mt-2 text-foreground whitespace-pre-wrap break-words">{content}</p>

          {imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border-2 border-border">
              <img src={imageUrl} alt="Post image" className="w-full max-h-96 object-cover" />
            </div>
          )}

          <div className="flex items-center gap-4 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={!user}
              className={`gap-2 transition-all duration-200 ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Heart 
                className={`h-4 w-4 transition-all duration-200 ${isLiked ? 'fill-primary' : ''} ${isAnimating ? 'animate-like-pop' : ''}`} 
              />
              <span className={isAnimating ? 'animate-like-pop' : ''}>{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-2 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{localCommentsCount}</span>
            </Button>
          </div>

          {showComments && (
            <CommentSection 
              postId={id} 
              onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
              onCommentDeleted={() => setLocalCommentsCount(prev => Math.max(0, prev - 1))}
            />
          )}
        </div>
      </div>
    </article>
  );
}
