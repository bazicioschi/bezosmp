import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const BANNED_FLAG_KEY = 'bezosmp_banned_info';

export interface BannedInfo {
  reason: string;
  expires_at: string | null; // ISO; null = permanent
  by_owner?: boolean;
}

async function checkBanForUser(userId: string): Promise<BannedInfo | null> {
  try {
    const [{ data: rows }, { data: profile }] = await Promise.all([
      supabase
        .from('user_restrictions')
        .select('restriction_type, expires_at, reason, created_by')
        .eq('user_id', userId)
        .eq('restriction_type', 'banned'),
      supabase
        .from('profiles')
        .select('automod_banned_until')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const now = Date.now();
    const active = (rows ?? []).filter(
      (r: any) => !r.expires_at || new Date(r.expires_at).getTime() > now
    );

    if (active.length) {
      // Determine if any active ban was issued by an owner -> permanent
      const creators = active.map((r: any) => r.created_by).filter(Boolean);
      let byOwner = false;
      if (creators.length) {
        const { data: ownerRows } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'owner')
          .in('user_id', creators);
        byOwner = !!ownerRows?.length;
      }
      // Pick the longest expiry (or null=permanent)
      const sorted = [...active].sort((a: any, b: any) => {
        if (!a.expires_at) return -1;
        if (!b.expires_at) return 1;
        return new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime();
      });
      const top: any = sorted[0];
      return {
        reason: top.reason || 'Your account has been banned by a moderator.',
        expires_at: byOwner ? null : top.expires_at,
        by_owner: byOwner,
      };
    }

    if (profile?.automod_banned_until && new Date(profile.automod_banned_until).getTime() > now) {
      return {
        reason: 'Your account was auto-banned by BezosMP AutoMod for inappropriate language.',
        expires_at: profile.automod_banned_until,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSession = (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
    if (session?.user) {
      // Defer the ban check so we don't block auth state listener
      setTimeout(async () => {
        const ban = await checkBanForUser(session.user.id);
        if (ban) {
          sessionStorage.setItem(BANNED_FLAG_KEY, JSON.stringify(ban));
          await supabase.auth.signOut();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }, 0);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => handleSession(session)
    );
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
