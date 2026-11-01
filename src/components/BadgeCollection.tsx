import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Check, Loader2, PartyPopper, Snowflake } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { refreshVerified, useVerifiedColor, type BadgeColor } from '@/hooks/useVerified';
import { Button } from '@/components/ui/button';

export function BadgeCollection({ userId, canGrant = false }: { userId: string; canGrant?: boolean }) {
  const [owned, setOwned] = useState<BadgeColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const active = useVerifiedColor(userId);
  const { toast } = useToast();
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('user_badges').select('badge_key').eq('user_id', userId);
    if (error) toast({ title: 'Could not load badges', description: error.message, variant: 'destructive' });
    else setOwned((data ?? []).map(row => row.badge_key as BadgeColor));
    setLoading(false);
  }, [userId, toast]);
  useEffect(() => { void load(); }, [load]);

  const chooseOrGrant = async (badge: BadgeColor) => {
    setBusy(true);
    if (canGrant) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setBusy(false); return; }
      const { error } = await supabase.from('user_badges').insert({ user_id: userId, badge_key: badge, granted_by: user.id });
      if (error) toast({ title: 'Could not award badge', description: error.message, variant: 'destructive' });
      else { toast({ title: `${badge === 'winter' ? 'Winter' : 'Party'} badge awarded!` }); await load(); }
    } else {
      const { error } = await supabase.from('user_badge_selections').upsert({ user_id: userId, badge_key: badge });
      if (error) toast({ title: 'Could not change badge', description: error.message, variant: 'destructive' });
      else toast({ title: 'Profile badge updated!' });
    }
    await refreshVerified();
    setBusy(false);
  };

  const choices: BadgeColor[] = canGrant ? ['party', 'winter'] : owned;
  return (
    <section className="space-y-3 py-3 border-t border-border" aria-label={canGrant ? 'Award badges' : 'Profile badge'}>
      <h2 className="mc-text text-sm font-semibold">{canGrant ? 'Award badges' : 'Profile badge'}</h2>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <div className="flex flex-wrap gap-2">
          {choices.map(badge => {
            const awarded = owned.includes(badge);
            const selected = active === badge;
            const Icon = badge === 'party' ? PartyPopper : badge === 'winter' ? Snowflake : BadgeCheck;
            return (
              <Button key={badge} size="sm" variant={!canGrant && selected ? 'default' : 'outline'}
                disabled={busy || (canGrant && awarded)} onClick={() => void chooseOrGrant(badge)}
                aria-pressed={!canGrant ? selected : undefined} className="gap-2">
                <Icon className={`h-4 w-4 ${badge === 'party' ? 'party-badge-icon' : badge === 'winter' ? 'winter-badge-icon' : ''}`} />
                {badge === 'party' ? 'Party · 1 year' : badge === 'winter' ? 'Winter' : badge.charAt(0).toUpperCase() + badge.slice(1)}
                {(canGrant ? awarded : selected) && <Check className="h-3 w-3" />}
              </Button>
            );
          })}
        </div>
      )}
    </section>
  );
}