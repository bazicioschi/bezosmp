import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useRestrictions(targetUserId?: string) {
  const { user } = useAuth();
  const userId = targetUserId || user?.id;
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRestrictions([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('user_restrictions')
        .select('restriction_type, expires_at')
        .eq('user_id', userId);

      const now = new Date();
      const active = (data ?? []).filter(r => !r.expires_at || new Date(r.expires_at) > now);
      setRestrictions(active.map(r => r.restriction_type));
      setLoading(false);
    };

    fetch();
  }, [userId]);

  const canPost = !restrictions.includes('no_posting') && !restrictions.includes('banned');
  const canComment = !restrictions.includes('no_commenting') && !restrictions.includes('banned');
  const canMessage = !restrictions.includes('no_messaging') && !restrictions.includes('banned');
  const isBanned = restrictions.includes('banned');

  return { restrictions, canPost, canComment, canMessage, isBanned, loading };
}
