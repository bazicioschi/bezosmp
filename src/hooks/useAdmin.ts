import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const canModerate = isAdmin || isModerator || isOwner;

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsModerator(false);
      setIsOwner(false);
      setLoading(false);
      return;
    }

    const checkRoles = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roles = data?.map(r => r.role) || [];
      setIsAdmin(roles.includes('admin'));
      setIsModerator(roles.includes('moderator'));
      setIsOwner(roles.includes('owner'));
      setLoading(false);
    };

    checkRoles();
  }, [user]);

  return { isAdmin, isModerator, isOwner, canModerate, loading };
}
