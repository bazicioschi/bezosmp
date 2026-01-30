import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface NewsCardProps {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  onDelete: () => void;
}

export function NewsCard({
  id,
  title,
  content,
  imageUrl,
  createdAt,
  userId,
  username,
  avatarUrl,
  onDelete,
}: NewsCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!user || user.id !== userId) return;
    await supabase.from('news').delete().eq('id', id);
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
                onClick={handleDelete} 
                className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* News Badge */}
          <div className="mt-2 mb-2">
            <span className="mc-slot inline-flex items-center px-2 py-0.5 mc-text text-sm text-primary">
              📰 SERVER NEWS
            </span>
          </div>

          <h3 className="mc-text text-xl text-foreground glow-text mb-2">{title}</h3>
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{content}</p>

          {imageUrl && (
            <div className="mt-3 minecraft-card overflow-hidden">
              <img src={imageUrl} alt={title} className="w-full max-h-[400px] object-cover" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}