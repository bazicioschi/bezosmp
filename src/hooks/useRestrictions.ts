import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useRestrictions(targetUserId?: string) {
  const { user } = useAuth();
  const userId = targetUserId || user?.id;
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [suspendedUntil, setSuspendedUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRestrictions([]);
      setSuspendedUntil(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const [{ data: restrictionRows }, { data: profile }] = await Promise.all([
        supabase
          .from('user_restrictions')
          .select('restriction_type, expires_at')
          .eq('user_id', userId),
        supabase
          .from('profiles')
          .select('automod_banned_until')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const now = new Date().toISOString();
      const active = (restrictionRows ?? []).filter(r => !r.expires_at || r.expires_at > now);

      // Check server-side automod ban stored in profile
      if (profile?.automod_banned_until && profile.automod_banned_until > now) {
        if (!active.find(r => r.restriction_type === 'banned')) {
          active.push({ restriction_type: 'banned', expires_at: profile.automod_banned_until });
        }
      }

      // Also check localStorage as instant local fallback
      const localBanRaw = localStorage.getItem(`automod_ban_${userId}`);
      if (localBanRaw) {
        try {
          const localBan = JSON.parse(localBanRaw);
          if (localBan.expires_at && localBan.expires_at > now) {
            if (!active.find(r => r.restriction_type === 'banned')) {
              active.push({ restriction_type: 'banned', expires_at: localBan.expires_at });
            }
          } else {
            localStorage.removeItem(`automod_ban_${userId}`);
          }
        } catch {
          localStorage.removeItem(`automod_ban_${userId}`);
        }
      }

      setRestrictions(active.map(r => r.restriction_type));

      const suspRow = active.find(r => r.restriction_type === 'suspended');
      setSuspendedUntil(suspRow?.expires_at ? new Date(suspRow.expires_at) : suspRow ? null : null);
      setLoading(false);
    };

    fetch();
  }, [userId]);

  const isSuspended = restrictions.includes('suspended');
  const canPost = !restrictions.includes('no_posting') && !restrictions.includes('banned') && !isSuspended;
  const canComment = !restrictions.includes('no_commenting') && !restrictions.includes('banned') && !isSuspended;
  const canMessage = !restrictions.includes('no_messaging') && !restrictions.includes('banned') && !isSuspended;
  const isBanned = restrictions.includes('banned');

  return { restrictions, canPost, canComment, canMessage, isBanned, isSuspended, suspendedUntil, loading };
}
