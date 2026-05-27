import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useRestrictions } from '@/hooks/useRestrictions';

export function useFollows() {
  const { user } = useAuth();
  const { isBanned, isSuspended } = useRestrictions();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFollowing();
    } else {
      setFollowing(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchFollowing = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    
    if (data) {
      setFollowing(new Set(data.map(f => f.following_id)));
    }
    setLoading(false);
  };

  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user || isBanned || isSuspended) return;
    
    const isFollowing = following.has(targetUserId);
    
    if (isFollowing) {
      setFollowing(prev => { const n = new Set(prev); n.delete(targetUserId); return n; });
      await supabase.from('follows').delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
    } else {
      setFollowing(prev => new Set(prev).add(targetUserId));
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: targetUserId,
      });
    }
  }, [user, following, isBanned, isSuspended]);

  const isFollowing = useCallback((targetUserId: string) => {
    return following.has(targetUserId);
  }, [following]);

  return { following, isFollowing, toggleFollow, loading };
}
