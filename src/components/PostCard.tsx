import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Share, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { CommentSection } from './CommentSection';
import { useSoundEffects } from '@/hooks/useSoundEffects';
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
  const { playClick, playPop, playUnpop } = useSoundEffects();
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (isLiked) {
      playUnpop();
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id);
    } else {
      playPop();
      await supabase.from('likes').insert({ post_id: id, user_id: user.id });
    }
    onLikeToggle();
  };

  const handleDelete = async () => {
    if (!user || user.id !== userId) return;
    playClick();
    await supabase.from('posts').delete().eq('id', id);
    onDelete();
  };

  const handleProfileClick = () => {
    navigate(`/user/${userId}`);
  };

  return (
    <article className="px-4 py-3 border-b-2 border-border hover:bg-secondary/20 transition-colors">
      <div className="flex gap-3">
        {/* Minecraft-style avatar */}
        <div 
          className="mc-slot h-11 w-11 p-0.5 cursor-pointer hover:mc-slot-active transition-all shrink-0"
          onClick={handleProfileClick}
        >
          <Avatar className="h-full w-full rounded-none">
            <AvatarImage src={avatarUrl || undefined} className="object-cover" style={{ imageRendering: 'pixelated' }} />
            <AvatarFallback className="bg-secondary text-primary mc-text text-lg rounded-none">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors mc-text text-lg"
              onClick={handleProfileClick}
            >
              {username}
            </span>
            <span className="text-muted-foreground text-sm">@{username.toLowerCase()}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: false })}
            </span>
            {user?.id === userId && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="mt-2 text-foreground whitespace-pre-wrap break-words leading-relaxed">{content}</p>

          {imageUrl && (
            <div className="mt-3 minecraft-card overflow-hidden">
              <img src={imageUrl} alt="Post image" className="w-full max-h-[400px] object-cover" />
            </div>
          )}

          {/* Action Buttons - Minecraft Style */}
          <div className="flex items-center gap-1 mt-3 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); playClick(); setShowComments(!showComments); }}
              className="gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-3"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="mc-text text-sm">{localCommentsCount || ''}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              disabled={!user}
              className={`gap-1.5 h-8 px-3 ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
            >
              <Heart 
                className={`h-4 w-4 transition-all ${isLiked ? 'fill-primary mc-heart' : ''} ${isAnimating ? 'animate-like-pop' : ''}`} 
              />
              <span className={`mc-text text-sm ${isAnimating ? 'animate-like-pop' : ''}`}>{likesCount || ''}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => playClick()}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-3"
            >
              <Bookmark className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => playClick()}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-3"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>

          {showComments && (
            <div onClick={(e) => e.stopPropagation()} className="mt-3 pt-3 border-t border-border">
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