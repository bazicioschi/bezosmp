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
  const [myEmojis, setMyEmojis] = useState<Set<string>>(new Set());
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
    setMyEmojis(user ? new Set(data.filter(r => r.user_id === user.id).map(r => r.emoji)) : new Set());
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
            'hover:bg-secondary/50 hover:scale-105'
          )}
        >
          <span className="transition-transform">
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
