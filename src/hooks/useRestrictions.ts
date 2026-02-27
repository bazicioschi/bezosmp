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
        .select('restriction_type')
        .eq('user_id', userId);

      setRestrictions(data?.map(r => r.restriction_type) || []);
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
