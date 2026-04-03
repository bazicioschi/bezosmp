import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, Loader2, Camera, ImagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Profile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  banner_url: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) fetchProfile();
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, bio, banner_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!error && data) setProfile(data);
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile(p => p ? { ...p, avatar_url: publicUrl } : null);
      toast({ title: 'Avatar uploaded!' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' });
      return;
    }
    setUploadingBanner(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/banner_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile(p => p ? { ...p, banner_url: publicUrl } : null);
      toast({ title: 'Banner uploaded!' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingBanner(false);
    }
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
        banner_url: profile.banner_url,
      })
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
      <main className="max-w-2xl mx-auto">
        {/* Banner */}
        <div className="relative h-48 bg-secondary/50 group">
          {profile?.banner_url ? (
            <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
          )}
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploadingBanner ? (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-white">
                <ImagePlus className="h-8 w-8" />
                <span className="mc-text text-xs">CHANGE BANNER</span>
              </div>
            )}
          </button>
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />

          {/* Avatar overlapping banner */}
          <div className="absolute -bottom-16 left-4">
            <div className="relative group/avatar">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-display text-3xl">
                  {profile?.username?.slice(0, 2).toUpperCase() || <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="pt-20 px-4 pb-8 bg-white rounded-lg">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground">{profile?.username}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="mc-text text-sm">USERNAME</Label>
              <Input
                id="username"
                value={profile?.username || ''}
                onChange={(e) => setProfile(p => p ? { ...p, username: e.target.value } : null)}
                className="bg-secondary/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="mc-text text-sm">BIO</Label>
              <Textarea
                id="bio"
                value={profile?.bio || ''}
                onChange={(e) => setProfile(p => p ? { ...p, bio: e.target.value } : null)}
                placeholder="Tell us about yourself..."
                className="bg-secondary/50 border-border resize-none"
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

            {/* Delete Account */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10" size="lg">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="minecraft-card">
                <DialogHeader>
                  <DialogTitle className="mc-text text-destructive">DELETE ACCOUNT</DialogTitle>
                  <DialogDescription>
                    This action is permanent. All your posts, comments, and data will be deleted. Enter your password to confirm.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="delete-password" className="mc-text text-sm">PASSWORD</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => { setDeleteDialogOpen(false); setDeletePassword(''); }}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleting || !deletePassword}
                    onClick={async () => {
                      if (!user || !deletePassword) return;
                      setDeleting(true);
                      // Verify password by re-authenticating
                      const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: user.email!,
                        password: deletePassword,
                      });
                      if (signInError) {
                        toast({ title: 'Wrong password', description: 'Please enter the correct password.', variant: 'destructive' });
                        setDeleting(false);
                        return;
                      }
                      // Delete user data
                      await supabase.from('posts').delete().eq('user_id', user.id);
                      await supabase.from('comments').delete().eq('user_id', user.id);
                      await supabase.from('likes').delete().eq('user_id', user.id);
                      await supabase.from('follows').delete().eq('follower_id', user.id);
                      await supabase.from('follows').delete().eq('following_id', user.id);
                      await supabase.from('profiles').delete().eq('user_id', user.id);
                      await supabase.auth.signOut();
                      toast({ title: 'Account deleted', description: 'Your account has been removed.' });
                      navigate('/login');
                      setDeleting(false);
                    }}
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Delete Forever
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
}
