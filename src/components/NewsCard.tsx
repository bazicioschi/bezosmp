import { useNavigate } from 'react-router-dom';
import { Trash2, MoreHorizontal } from 'lucide-react';
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
    <article className="px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors">
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
            <span className="text-muted-foreground text-[15px]">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: false })}
            </span>
            <div className="ml-auto flex items-center">
              {user?.id === userId && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleDelete} 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* News Badge */}
          <div className="mt-1 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
              📰 News
            </span>
          </div>

          <h3 className="font-display font-bold text-foreground text-lg mb-1">{title}</h3>
          <p className="text-[15px] text-foreground/90 whitespace-pre-wrap leading-normal">{content}</p>

          {imageUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border">
              <img src={imageUrl} alt={title} className="w-full max-h-[510px] object-cover" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}