import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

interface Profile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, bio')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Profile updated!' });
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="minecraft-card glow-border p-6 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-20 w-20 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-display text-2xl">
                {profile?.username?.slice(0, 2).toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Your Profile</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile?.username || ''}
                onChange={(e) => setProfile(p => p ? { ...p, username: e.target.value } : null)}
                className="bg-secondary/50 border-border input-glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                type="url"
                value={profile?.avatar_url || ''}
                onChange={(e) => setProfile(p => p ? { ...p, avatar_url: e.target.value } : null)}
                placeholder="https://example.com/avatar.png"
                className="bg-secondary/50 border-border input-glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile?.bio || ''}
                onChange={(e) => setProfile(p => p ? { ...p, bio: e.target.value } : null)}
                placeholder="Tell us about yourself..."
                className="bg-secondary/50 border-border resize-none input-glow"
                rows={4}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
