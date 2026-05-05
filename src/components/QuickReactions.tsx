import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

const REACTIONS = [
  { emoji: '⚔️', label: 'sword' },
  { emoji: '💎', label: 'diamond' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '💀', label: 'skull' },
  { emoji: '🎮', label: 'controller' },
];

interface QuickReactionsProps {
  postId: string;
  compact?: boolean;
  emojis?: string[];
}

export function QuickReactions({ postId, compact = false, emojis }: QuickReactionsProps) {
  const { playPop } = useSoundEffects();
  const { user } = useAuth();
  const [myEmojis, setMyEmojis] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reactorProfiles, setReactorProfiles] = useState<Record<string, { user_id: string; username: string; avatar_url: string | null }[]>>({});

  const list = (emojis ? REACTIONS.filter(r => emojis.includes(r.emoji)) : REACTIONS);

  const load = async () => {
    const { data } = await supabase
      .from('post_reactions')
      .select('emoji, user_id')
      .eq('post_id', postId);
    if (!data) return;
    const c: Record<string, number> = {};
    for (const row of data) c[row.emoji] = (c[row.emoji] || 0) + 1;
    setCounts(c);
    setMyEmojis(user ? new Set(data.filter(r => r.user_id === user.id).map(r => r.emoji)) : new Set());

    // Fetch profiles for tooltip avatars
    const uniqueIds = [...new Set(data.map(r => r.user_id))];
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', uniqueIds);
      if (profiles) {
        const profileMap: Record<string, typeof profiles[0]> = {};
        profiles.forEach(p => { profileMap[p.user_id] = p; });
        const rp: Record<string, typeof profiles> = {};
        for (const row of data) {
          if (!rp[row.emoji]) rp[row.emoji] = [];
          const prof = profileMap[row.user_id];
          if (prof && !rp[row.emoji].find(x => x.user_id === row.user_id)) rp[row.emoji].push(prof);
        }
        setReactorProfiles(rp);
      }
    } else {
      setReactorProfiles({});
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`reactions-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user?.id]);

  const handle = async (emoji: string) => {
    if (!user) return;
    playPop();
    const has = myEmojis.has(emoji);
    if (has) {
      setMyEmojis(prev => { const n = new Set(prev); n.delete(emoji); return n; });
      setCounts(p => ({ ...p, [emoji]: Math.max(0, (p[emoji] || 1) - 1) }));
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);
    } else {
      setMyEmojis(prev => new Set(prev).add(emoji));
      setCounts(p => ({ ...p, [emoji]: (p[emoji] || 0) + 1 }));
      await supabase
        .from('post_reactions')
        .insert({ post_id: postId, user_id: user.id, emoji });
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {list.map(({ emoji, label }) => {
          const reactors = reactorProfiles[emoji] || [];
          return (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handle(emoji); }}
                  disabled={!user}
                  className={cn(
                    compact ? 'h-7 px-1.5' : 'h-7 px-2',
                    'text-base transition-all',
                    myEmojis.has(emoji) ? 'bg-primary/10' : 'hover:bg-secondary/50 hover:scale-105'
                  )}
                >
                  <span className="transition-transform">{emoji}</span>
                  {counts[emoji] > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground mc-text">{counts[emoji]}</span>
                  )}
                </Button>
              </TooltipTrigger>
              {reactors.length > 0 && (
                <TooltipContent side="top" className="minecraft-card p-2">
                  <div className="space-y-1.5">
                    {reactors.slice(0, 8).map(r => (
                      <div key={r.user_id} className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={r.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
                          <AvatarFallback className="text-[8px] bg-primary/20 text-primary">{r.username.slice(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs mc-text">{r.username}</span>
                      </div>
                    ))}
                    {reactors.length > 8 && <p className="text-xs text-muted-foreground mc-text">+{reactors.length - 8} more</p>}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
