import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BadgeColor =
  | 'default'
  | 'red' | 'blue' | 'green' | 'gold' | 'purple' | 'pink' | 'cyan'
  | 'orange' | 'lime' | 'teal' | 'indigo' | 'rose' | 'amber' | 'emerald'
  | 'sky' | 'fuchsia' | 'violet' | 'slate' | 'white' | 'black'
  | 'magenta' | 'crimson' | 'mint' | 'coral' | 'lavender' | 'neon' | 'bronze'
  | 'rainbow' | 'ladybug';

type VerifMap = Map<string, BadgeColor>;

let cache: VerifMap | null = null;
let pending: Promise<VerifMap> | null = null;
const listeners = new Set<(m: VerifMap) => void>();

async function loadVerified(): Promise<VerifMap> {
  if (cache) return cache;
  if (pending) return pending;
  pending = (async () => {
    const { data } = await supabase.from('user_verifications').select('user_id, badge_color');
    const map: VerifMap = new Map();
    (data || []).forEach((r: any) => {
      map.set(r.user_id, (r.badge_color as BadgeColor) || 'default');
    });
    cache = map;
    pending = null;
    listeners.forEach((l) => l(map));
    return map;
  })();
  return pending;
}

export function refreshVerified() {
  cache = null;
  return loadVerified();
}

export function useVerifiedMap() {
  const [map, setMap] = useState<VerifMap>(cache ?? new Map());
  useEffect(() => {
    loadVerified().then(setMap);
    const l = (m: VerifMap) => setMap(new Map(m));
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return map;
}

export function useVerifiedSet() {
  const map = useVerifiedMap();
  return new Set(map.keys());
}

export function useIsVerified(userId?: string | null) {
  const map = useVerifiedMap();
  return !!userId && map.has(userId);
}

export function useVerifiedColor(userId?: string | null): BadgeColor | null {
  const map = useVerifiedMap();
  if (!userId) return null;
  return map.get(userId) ?? null;
}
