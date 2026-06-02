import { useState, useEffect } from 'react';
import { Shield, Ban, UserX, MessageSquareOff, PenOff, Loader2, Crown, ShieldCheck, RefreshCw, Clock, BadgeCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type BadgeColor =
  | 'default'
  | 'red' | 'blue' | 'green' | 'gold' | 'purple' | 'pink' | 'cyan'
  | 'orange' | 'lime' | 'teal' | 'indigo' | 'rose' | 'amber' | 'emerald'
  | 'sky' | 'fuchsia' | 'violet' | 'slate' | 'white' | 'black' | 'rainbow';

interface UserWithRestrictions {
  user_id: string;
  username: string;
  restrictions: string[];
  suspendedUntil: string | null;
  roles: string[];
  verified: boolean;
  badgeColor: BadgeColor | null;
}

const BADGE_COLORS: { value: BadgeColor; label: string; swatch: string }[] = [
  { value: 'default', label: 'Default (theme)', swatch: 'bg-primary' },
  { value: 'red',     label: 'Red',     swatch: 'bg-red-500' },
  { value: 'orange',  label: 'Orange',  swatch: 'bg-orange-500' },
  { value: 'amber',   label: 'Amber',   swatch: 'bg-amber-500' },
  { value: 'gold',    label: 'Gold',    swatch: 'bg-yellow-400' },
  { value: 'lime',    label: 'Lime',    swatch: 'bg-lime-400' },
  { value: 'green',   label: 'Green',   swatch: 'bg-green-500' },
  { value: 'emerald', label: 'Emerald', swatch: 'bg-emerald-500' },
  { value: 'teal',    label: 'Teal',    swatch: 'bg-teal-400' },
  { value: 'cyan',    label: 'Cyan',    swatch: 'bg-cyan-400' },
  { value: 'sky',     label: 'Sky',     swatch: 'bg-sky-400' },
  { value: 'blue',    label: 'Blue',    swatch: 'bg-blue-500' },
  { value: 'indigo',  label: 'Indigo',  swatch: 'bg-indigo-500' },
  { value: 'violet',  label: 'Violet',  swatch: 'bg-violet-500' },
  { value: 'purple',  label: 'Purple',  swatch: 'bg-purple-500' },
  { value: 'fuchsia', label: 'Fuchsia', swatch: 'bg-fuchsia-500' },
  { value: 'pink',    label: 'Pink',    swatch: 'bg-pink-500' },
  { value: 'rose',    label: 'Rose',    swatch: 'bg-rose-500' },
  { value: 'slate',   label: 'Slate',   swatch: 'bg-slate-400' },
  { value: 'white',   label: 'White',   swatch: 'bg-white' },
  { value: 'black',   label: 'Black',   swatch: 'bg-black' },
  { value: 'rainbow', label: 'Rainbow', swatch: 'bg-gradient-to-r from-red-500 via-yellow-400 to-purple-500' },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const { isAdmin, isOwner, canModerate, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserWithRestrictions[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myUsername, setMyUsername] = useState<string>('');

  const isBazicioschi = myUsername.toLowerCase() === 'bazicioschi' && isOwner;

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setMyUsername(data?.username || ''));
  }, [user]);

  useEffect(() => {
    if (!adminLoading && !canModerate) {
      navigate('/');
    }
  }, [canModerate, adminLoading]);

  const refreshFeed = async () => {
    setRefreshing(true);
    const channel = supabase.channel('admin-feed-control');
    await channel.subscribe();
    await channel.send({ type: 'broadcast', event: 'feed_refresh', payload: {} });
    supabase.removeChannel(channel);
    toast({ title: 'Feed refreshed', description: 'All clients will reload the post feed.' });
    setRefreshing(false);
  };

  const searchUsers = async () => {
    if (!search.trim()) return;
    setLoading(true);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username')
      .ilike('username', `%${search.trim()}%`)
      .limit(20);

    if (profiles) {
      const userIds = profiles.map(p => p.user_id);

      const [{ data: restrictions }, { data: roles }, { data: verifications }] = await Promise.all([
        supabase.from('user_restrictions').select('user_id, restriction_type, expires_at').in('user_id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('user_verifications').select('user_id, badge_color').in('user_id', userIds),
      ]);

      const now = new Date().toISOString();
      const restrictionsMap = new Map<string, string[]>();
      const suspendedUntilMap = new Map<string, string | null>();
      restrictions?.forEach((r: any) => {
        if (r.expires_at && r.expires_at <= now) return; // skip expired
        const existing = restrictionsMap.get(r.user_id) || [];
        existing.push(r.restriction_type);
        restrictionsMap.set(r.user_id, existing);
        if (r.restriction_type === 'suspended') {
          suspendedUntilMap.set(r.user_id, r.expires_at ?? null);
        }
      });

      const rolesMap = new Map<string, string[]>();
      roles?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const verifiedMap = new Map<string, BadgeColor>();
      (verifications || []).forEach((v: any) => {
        verifiedMap.set(v.user_id, (v.badge_color as BadgeColor) || 'default');
      });

      setUsers(profiles.map(p => ({
        user_id: p.user_id,
        username: p.username,
        restrictions: restrictionsMap.get(p.user_id) || [],
        suspendedUntil: suspendedUntilMap.get(p.user_id) ?? null,
        roles: rolesMap.get(p.user_id) || [],
        verified: verifiedMap.has(p.user_id),
        badgeColor: verifiedMap.get(p.user_id) ?? null,
      })));
    }
    setLoading(false);
  };

  const toggleRole = async (userId: string, role: 'admin' | 'moderator') => {
    if (!user) return;
    // Only Bazicioschi (the server owner) can grant or remove roles
    if (!isBazicioschi) {
      toast({ title: 'Access denied', description: 'Only Bazicioschi can manage roles.', variant: 'destructive' });
      return;
    }
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;

    if (targetUser.roles.includes(role)) {
      if (
        role === 'admin' &&
        targetUser.username.toLowerCase() === 'bazicioschi' &&
        user.id === userId
      ) {
        toast({
          title: 'Action blocked',
          description: 'Bazicioschi cannot remove his own admin role.',
          variant: 'destructive',
        });
        return;
      }
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
      toast({ title: 'Role removed', description: `Removed ${role} from @${targetUser.username}` });
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role });
      toast({ title: 'Role granted', description: `Granted ${role} to @${targetUser.username}` });
    }
    searchUsers();
  };

  const toggleVerified = async (userId: string) => {
    if (!user) return;
    if (!isBazicioschi) {
      toast({ title: 'Access denied', description: 'Only Bazicioschi can verify users.', variant: 'destructive' });
      return;
    }
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;

    if (targetUser.verified) {
      await supabase.from('user_verifications').delete().eq('user_id', userId);
      toast({ title: 'Verification removed', description: `@${targetUser.username} is no longer verified` });
    } else {
      await supabase.from('user_verifications').insert({ user_id: userId, granted_by: user.id, badge_color: 'default' } as any);
      toast({ title: 'User verified', description: `@${targetUser.username} is now verified` });
    }
    const { refreshVerified } = await import('@/hooks/useVerified');
    refreshVerified();
    searchUsers();
  };

  const setBadgeColor = async (userId: string, color: BadgeColor) => {
    if (!user || !isBazicioschi) return;
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser || !targetUser.verified) return;
    await (supabase.from('user_verifications') as any).update({ badge_color: color }).eq('user_id', userId);
    toast({ title: 'Badge color updated', description: `@${targetUser.username}: ${color}` });
    const { refreshVerified } = await import('@/hooks/useVerified');
    refreshVerified();
    searchUsers();
  };

  const toggleRestriction = async (userId: string, type: string) => {
    if (!user) return;
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;

    // Owners cannot be banned
    if (type === 'banned' && targetUser.roles.includes('owner')) {
      toast({ title: 'Action blocked', description: 'The server owner cannot be banned.', variant: 'destructive' });
      return;
    }

    if (targetUser.restrictions.includes(type)) {
      await supabase.from('user_restrictions').delete().eq('user_id', userId).eq('restriction_type', type);
      toast({ title: 'Restriction removed', description: `Removed ${type} from @${targetUser.username}` });
    } else {
      await supabase.from('user_restrictions').insert({ user_id: userId, restriction_type: type, created_by: user.id });
      toast({ title: 'Restriction added', description: `Added ${type} to @${targetUser.username}` });
    }
    searchUsers();
  };

  const suspendUser = async (userId: string, days: number | null) => {
    if (!user) return;
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;

    // Remove existing suspension first
    await supabase.from('user_restrictions').delete().eq('user_id', userId).eq('restriction_type', 'suspended');

    if (days !== null) {
      const expires_at = days === -1 ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('user_restrictions').insert({
        user_id: userId,
        restriction_type: 'suspended',
        created_by: user.id,
        expires_at,
        reason: days === -1 ? 'Permanent suspension' : `Suspended for ${days} days`,
      });
      toast({
        title: 'User suspended',
        description: `@${targetUser.username} suspended ${days === -1 ? 'permanently' : `for ${days} days`}`,
      });
    } else {
      toast({ title: 'User unsuspended', description: `@${targetUser.username} is no longer suspended` });
    }
    searchUsers();
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background mc-bedrock flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canModerate) return null;

  return (
    <div className="min-h-screen bg-background mc-bedrock">
      <Header />
      <main className="max-w-2xl mx-auto p-4 relative z-10">
        <div className="minecraft-card p-6 mb-6">
          <h1 className="mc-text text-2xl text-primary glow-text mb-2 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            ADMIN PANEL
          </h1>
          <p className="text-muted-foreground text-sm">Manage user roles and restrictions.</p>
          <div className="mt-4">
            <Button onClick={refreshFeed} disabled={refreshing} className="gap-2">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Feed
            </Button>
          </div>
        </div>

        {/* Search users */}
        <div className="minecraft-card p-4 mb-6">
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username..."
              className="bg-secondary/50 border-2 border-border"
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={loading} className="mc-btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </div>

        {/* Users list */}
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.user_id} className="minecraft-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground mc-text text-lg">@{u.username}</span>
                  {u.roles.includes('admin') && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">ADMIN</span>
                  )}
                  {u.roles.includes('moderator') && (
                    <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded font-bold">MOD</span>
                  )}
                  {u.verified && (
                    <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                  )}
                </div>
                {u.restrictions.filter(r => r !== 'suspended').length > 0 && (
                  <span className="text-xs text-destructive">{u.restrictions.filter(r => r !== 'suspended').length} restriction(s)</span>
                )}
              </div>

              {/* Role management — only visible to Bazicioschi */}
              {isBazicioschi && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1.5 font-semibold uppercase">Roles</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={u.roles.includes('admin') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleRole(u.user_id, 'admin')}
                    className="gap-1"
                  >
                    <Crown className="h-3 w-3" />
                    Admin
                  </Button>
                  <Button
                    variant={u.roles.includes('moderator') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleRole(u.user_id, 'moderator')}
                    className="gap-1"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Moderator
                  </Button>
                  <Button
                    variant={u.verified ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleVerified(u.user_id)}
                    className="gap-1"
                  >
                    <BadgeCheck className="h-3 w-3" />
                    {u.verified ? 'Verified' : 'Verify'}
                  </Button>
                </div>

                {/* Badge color picker — only shown when verified */}
                {u.verified && (
                  <div className="mt-2">
                    <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase">Badge color</p>
                    <div className="flex flex-wrap gap-1.5">
                      {BADGE_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.label}
                          onClick={() => setBadgeColor(u.user_id, c.value)}
                          className={cn(
                            'w-6 h-6 rounded-full border-2 transition-all',
                            c.swatch,
                            (u.badgeColor ?? 'default') === c.value
                              ? 'border-foreground scale-110 ring-2 ring-foreground/40'
                              : 'border-border opacity-80 hover:opacity-100'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Restrictions */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-semibold uppercase">Restrictions</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={u.restrictions.includes('no_posting') ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => toggleRestriction(u.user_id, 'no_posting')}
                    className="gap-1"
                  >
                    <PenOff className="h-3 w-3" />
                    No Posting
                  </Button>
                  <Button
                    variant={u.restrictions.includes('no_commenting') ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => toggleRestriction(u.user_id, 'no_commenting')}
                    className="gap-1"
                  >
                    <MessageSquareOff className="h-3 w-3" />
                    No Comments
                  </Button>
                  <Button
                    variant={u.restrictions.includes('no_messaging') ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => toggleRestriction(u.user_id, 'no_messaging')}
                    className="gap-1"
                  >
                    <UserX className="h-3 w-3" />
                    No Messages
                  </Button>
                  <Button
                    variant={u.restrictions.includes('banned') ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => toggleRestriction(u.user_id, 'banned')}
                    className="gap-1"
                    disabled={u.roles.includes('owner')}
                    title={u.roles.includes('owner') ? 'Cannot ban the server owner' : undefined}
                  >
                    <Ban className="h-3 w-3" />
                    Ban
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
