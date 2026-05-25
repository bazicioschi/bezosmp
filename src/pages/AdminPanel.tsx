import { useState, useEffect } from 'react';
import { Shield, Ban, UserX, MessageSquareOff, PenOff, Loader2, Crown, ShieldCheck, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserWithRestrictions {
  user_id: string;
  username: string;
  restrictions: string[];
  roles: string[];
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserWithRestrictions[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading]);

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

      const [{ data: restrictions }, { data: roles }] = await Promise.all([
        supabase.from('user_restrictions').select('user_id, restriction_type').in('user_id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
      ]);

      const restrictionsMap = new Map<string, string[]>();
      restrictions?.forEach(r => {
        const existing = restrictionsMap.get(r.user_id) || [];
        existing.push(r.restriction_type);
        restrictionsMap.set(r.user_id, existing);
      });

      const rolesMap = new Map<string, string[]>();
      roles?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      setUsers(profiles.map(p => ({
        user_id: p.user_id,
        username: p.username,
        restrictions: restrictionsMap.get(p.user_id) || [],
        roles: rolesMap.get(p.user_id) || [],
      })));
    }
    setLoading(false);
  };

  const toggleRole = async (userId: string, role: 'admin' | 'moderator') => {
    if (!user) return;
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

  const toggleRestriction = async (userId: string, type: string) => {
    if (!user) return;
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;

    if (targetUser.restrictions.includes(type)) {
      await supabase.from('user_restrictions').delete().eq('user_id', userId).eq('restriction_type', type);
      toast({ title: 'Restriction removed', description: `Removed ${type} from @${targetUser.username}` });
    } else {
      await supabase.from('user_restrictions').insert({ user_id: userId, restriction_type: type, created_by: user.id });
      toast({ title: 'Restriction added', description: `Added ${type} to @${targetUser.username}` });
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

  if (!isAdmin) return null;

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
                </div>
                {u.restrictions.length > 0 && (
                  <span className="text-xs text-destructive">{u.restrictions.length} restriction(s)</span>
                )}
              </div>

              {/* Role management */}
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
                </div>
              </div>

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
