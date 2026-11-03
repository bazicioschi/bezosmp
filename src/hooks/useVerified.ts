import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveActiveBadge } from '@/lib/anniversary';

export type BadgeColor =
  | 'default'
  | 'red' | 'blue' | 'green' | 'gold' | 'purple' | 'pink' | 'cyan'
  | 'orange' | 'lime' | 'teal' | 'indigo' | 'rose' | 'amber' | 'emerald'
  | 'sky' | 'fuchsia' | 'violet' | 'slate' | 'white' | 'black'
  | 'magenta' | 'crimson' | 'mint' | 'coral' | 'lavender' | 'neon' | 'bronze'
  | 'rainbow' | 'ladybug' | 'rat' | 'party' | 'winter';

type VerifMap = Map<string, BadgeColor>;

let cache: VerifMap | null = null;
let pending: Promise<VerifMap> | null = null;
const listeners = new Set<(m: VerifMap) => void>();

async function loadVerified(): Promise<VerifMap> {
  if (cache) return cache;
  if (pending) return pending;
  pending = (async () => {
    const [{ data }, { data: badges }, { data: selections }] = await Promise.all([
      supabase.from('user_verifications').select('user_id, badge_color'),
      supabase.from('user_badges').select('user_id, badge_key'),
      supabase.from('user_badge_selections').select('user_id, badge_key, hidden'),
    ]);
    const map: VerifMap = new Map();
    (data || []).forEach((r: any) => {
      map.set(r.user_id, (r.badge_color as BadgeColor) || 'default');
    });
    const collections = new Map<string, BadgeColor[]>();
    (badges ?? []).forEach(row => {
      collections.set(row.user_id, [...(collections.get(row.user_id) ?? []), row.badge_key as BadgeColor]);
    });
    const selected = new Map((selections ?? []).map(row => [row.user_id, row]));
    collections.forEach((owned, userId) => {
      const choice = selected.get(userId);
      const active = resolveActiveBadge(owned, choice?.badge_key as BadgeColor | undefined, map.get(userId), choice?.hidden);
      if (active) map.set(userId, active);
    });
    selected.forEach((choice, userId) => {
      if (choice.hidden) map.delete(userId);
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
