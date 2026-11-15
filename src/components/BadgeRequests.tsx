import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { refreshVerified } from '@/hooks/useVerified';

type Request = Tables<'badge_requests'>;
type Requester = { username: string; avatar_url: string | null };

export function BadgeRequests({ userId, review = false }: { userId: string; review?: boolean }) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Requester>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasDefault, setHasDefault] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('badge_requests').select('*').order('created_at', { ascending: review });
    if (review) query = query.eq('status', 'pending');
    else query = query.eq('user_id', userId).limit(1);
    const { data, error } = await query;
    if (error) toast({ title: 'Could not load requests', description: error.message, variant: 'destructive' });
    else {
      setRequests(data ?? []);
      if (review && data?.length) {
        const { data: people } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', data.map(r => r.user_id));
        setProfiles(Object.fromEntries((people ?? []).map(p => [p.user_id, p])));
      }
    }
    if (!review) {
      const { data: badge } = await supabase.from('user_badges').select('badge_key').eq('user_id', userId).eq('badge_key', 'default').maybeSingle();
      setHasDefault(!!badge);
    }
    setLoading(false);
  }, [userId, review, toast]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('submit_badge_request');
    if (error) toast({ title: 'Could not request verification', description: error.message, variant: 'destructive' });
    else toast({ title: data.status === 'pending' ? 'Verification requested' : 'Request rejected', description: data.reason ?? 'Awaiting Bazicioschi’s approval.' });
    await load();
    setBusy(false);
  };

  const decide = async (id: string, approve: boolean) => {
    setBusy(true);
    const { data, error } = await supabase.rpc('review_badge_request', { request_id: id, approve });
    if (error) toast({ title: 'Could not review request', description: error.message, variant: 'destructive' });
    else {
      toast({ title: data.status === 'approved' ? 'Default verification awarded' : 'Request rejected', description: data.reason ?? undefined });
      await refreshVerified();
    }
    await load();
    setBusy(false);
  };

  return (
    <section className="border-t border-border py-4 space-y-3" aria-label={review ? 'Pending verification requests' : 'Request verification'}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="mc-text font-semibold flex items-center gap-2"><BadgeCheck className="h-4 w-4" />{review ? `Pending verification requests (${requests.length})` : 'Request verification'}</h2>
        <Button size="icon" variant="ghost" title="Refresh requests" aria-label="Refresh requests" disabled={busy || loading} onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : review ? (
        requests.length === 0 ? <p className="text-sm text-muted-foreground">No pending requests.</p> : <ul className="divide-y divide-border">
          {requests.map(r => <li key={r.id} className="py-3 flex flex-wrap items-center gap-3">
            <Avatar><AvatarImage src={profiles[r.user_id]?.avatar_url ?? undefined} /><AvatarFallback>{profiles[r.user_id]?.username.slice(0, 2) ?? '?'}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0 break-words"><a href={`/user/${r.user_id}`} className="text-primary font-medium">@{profiles[r.user_id]?.username ?? 'User'}</a><p className="text-sm text-muted-foreground">Default verification · {r.follower_count.toLocaleString()} followers</p></div>
            <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => void decide(r.id, true)} className="gap-1"><Check className="h-4 w-4" />Approve</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void decide(r.id, false)} className="gap-1"><X className="h-4 w-4" />Reject</Button></div>
          </li>)}
        </ul>
      ) : <>
        {requests[0] && <div className="text-sm"><p className="capitalize font-medium">{requests[0].status} · {requests[0].follower_count.toLocaleString()} followers</p>{requests[0].reason && <p className="text-muted-foreground">{requests[0].reason}</p>}</div>}
        <Button variant="outline" className="gap-2" disabled={busy || hasDefault || requests[0]?.status === 'pending'} onClick={() => void submit()}><BadgeCheck className="h-4 w-4" />{hasDefault ? 'Default verification owned' : requests[0]?.status === 'pending' ? 'Awaiting approval' : 'Request default verification'}</Button>
      </>}
    </section>
  );
}