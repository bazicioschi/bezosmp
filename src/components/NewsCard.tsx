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

  const handleDelete = async () => {
    if (!user || user.id !== userId) return;
    await supabase.from('news').delete().eq('id', id);
    onDelete();
  };

  return (
    <article className="minecraft-card minecraft-border card-hover overflow-hidden">
      {imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-display text-xl font-bold text-foreground glow-text">{title}</h3>
          {user?.id === userId && (
            <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-foreground/90 whitespace-pre-wrap mb-4">{content}</p>

        <div className="flex items-center gap-3 pt-3 border-t border-border/50">
          <Avatar className="h-8 w-8 border border-primary/20">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-display">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <span className="font-display text-sm font-medium text-foreground">{username}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
