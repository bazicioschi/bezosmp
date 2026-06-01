import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Module-level cache so we don't refetch the whole set per component.
let cache: Set<string> | null = null;
let pending: Promise<Set<string>> | null = null;
const listeners = new Set<(s: Set<string>) => void>();

async function loadVerified(): Promise<Set<string>> {
  if (cache) return cache;
  if (pending) return pending;
  pending = (async () => {
    const { data } = await supabase.from('user_verifications').select('user_id');
    const set = new Set<string>((data || []).map((r: any) => r.user_id));
    cache = set;
    pending = null;
    listeners.forEach((l) => l(set));
    return set;
  })();
  return pending;
}

export function refreshVerified() {
  cache = null;
  return loadVerified();
}

export function useVerifiedSet() {
  const [set, setSet] = useState<Set<string>>(cache ?? new Set());
  useEffect(() => {
    loadVerified().then(setSet);
    const l = (s: Set<string>) => setSet(new Set(s));
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return set;
}

export function useIsVerified(userId?: string | null) {
  const set = useVerifiedSet();
  return !!userId && set.has(userId);
}
