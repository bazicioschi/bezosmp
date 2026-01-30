import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Share, BarChart2, Bookmark } from 'lucide-react';
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
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async () => {
    if (!user) return;

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

  const handleProfileClick = () => {
    navigate(`/user/${userId}`);
  };

  return (
    <article className="px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer">
      <div className="flex gap-3">
        <Avatar 
          className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
        >
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-secondary text-muted-foreground font-display text-sm">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span 
              className="font-semibold text-foreground cursor-pointer hover:underline text-[15px]"
              onClick={handleProfileClick}
            >
              {username}
            </span>
            <span className="text-muted-foreground text-[15px]">@{username.toLowerCase()}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-[15px] hover:underline">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: false })}
            </span>
            {user?.id === userId && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="mt-1 text-[15px] text-foreground whitespace-pre-wrap break-words leading-normal">{content}</p>

          {imageUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border">
              <img src={imageUrl} alt="Post image" className="w-full max-h-[510px] object-cover" />
            </div>
          )}

          {/* Action Buttons - X.com Style */}
          <div className="flex items-center justify-between mt-3 max-w-md -ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
              className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-3 h-8"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              <span className="text-[13px]">{localCommentsCount || ''}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-3 h-8"
            >
              <BarChart2 className="h-[18px] w-[18px]" />
              <span className="text-[13px]">{Math.floor(Math.random() * 1000)}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              disabled={!user}
              className={`gap-2 rounded-full px-3 h-8 ${isLiked ? 'text-pink-500 hover:bg-pink-500/10' : 'text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10'}`}
            >
              <Heart 
                className={`h-[18px] w-[18px] transition-all ${isLiked ? 'fill-pink-500' : ''} ${isAnimating ? 'animate-like-pop' : ''}`} 
              />
              <span className={`text-[13px] ${isAnimating ? 'animate-like-pop' : ''}`}>{likesCount || ''}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-3 h-8"
            >
              <Bookmark className="h-[18px] w-[18px]" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-3 h-8"
            >
              <Share className="h-[18px] w-[18px]" />
            </Button>
          </div>

          {showComments && (
            <div onClick={(e) => e.stopPropagation()}>
              <CommentSection 
                postId={id} 
                onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
                onCommentDeleted={() => setLocalCommentsCount(prev => Math.max(0, prev - 1))}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}