import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

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
    setMyEmoji(user ? (data.find(r => r.user_id === user.id)?.emoji ?? null) : null);
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
    if (myEmoji === emoji) {
      setMyEmoji(null);
      setCounts(p => ({ ...p, [emoji]: Math.max(0, (p[emoji] || 1) - 1) }));
      await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      const prev = myEmoji;
      setMyEmoji(emoji);
      setCounts(p => {
        const next = { ...p, [emoji]: (p[emoji] || 0) + 1 };
        if (prev) next[prev] = Math.max(0, (next[prev] || 1) - 1);
        return next;
      });
      await supabase
        .from('post_reactions')
        .upsert({ post_id: postId, user_id: user.id, emoji }, { onConflict: 'post_id,user_id' });
    }
  };

  return (
    <div className="flex items-center gap-1">
      {list.map(({ emoji, label }) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); handle(emoji); }}
          disabled={!user}
          className={cn(
            compact ? 'h-7 px-1.5' : 'h-7 px-2',
            'text-base transition-all',
            myEmoji === emoji ? 'bg-primary/20 scale-110' : 'hover:bg-secondary/50 hover:scale-105'
          )}
        >
          <span className={cn('transition-transform', myEmoji === emoji && 'animate-bounce')}>
            {emoji}
          </span>
          {counts[emoji] > 0 && (
            <span className="ml-1 text-xs text-muted-foreground mc-text">{counts[emoji]}</span>
          )}
        </Button>
      ))}
    </div>
  );
}
