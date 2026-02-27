import { useState, useEffect } from 'react';
import { Shield, Ban, UserX, MessageSquareOff, PenOff, Loader2, Trash2 } from 'lucide-react';
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
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserWithRestrictions[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading]);

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
      const { data: restrictions } = await supabase
        .from('user_restrictions')
        .select('user_id, restriction_type')
        .in('user_id', userIds);

      const restrictionsMap = new Map<string, string[]>();
      restrictions?.forEach(r => {
        const existing = restrictionsMap.get(r.user_id) || [];
        existing.push(r.restriction_type);
        restrictionsMap.set(r.user_id, existing);
      });

      setUsers(profiles.map(p => ({
        user_id: p.user_id,
        username: p.username,
        restrictions: restrictionsMap.get(p.user_id) || [],
      })));
    }
    setLoading(false);
  };

  const toggleRestriction = async (userId: string, type: string) => {
    if (!user) return;

    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;

    if (targetUser.restrictions.includes(type)) {
      // Remove restriction
      await supabase
        .from('user_restrictions')
        .delete()
        .eq('user_id', userId)
        .eq('restriction_type', type);

      toast({ title: `Restriction removed`, description: `Removed ${type} from @${targetUser.username}` });
    } else {
      // Add restriction
      await supabase
        .from('user_restrictions')
        .insert({
          user_id: userId,
          restriction_type: type,
          created_by: user.id,
        });

      toast({ title: `Restriction added`, description: `Added ${type} to @${targetUser.username}` });
    }

    // Refresh
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
          <p className="text-muted-foreground text-sm">Manage user restrictions and roles.</p>
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
                <span className="font-semibold text-foreground mc-text text-lg">@{u.username}</span>
                {u.restrictions.length > 0 && (
                  <span className="text-xs text-destructive">{u.restrictions.length} restriction(s)</span>
                )}
              </div>
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
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
