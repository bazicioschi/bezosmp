import { useState, useRef } from 'react';
import { Users, X, Search, Loader2, ImagePlus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MAX_INVITEES = 9; // 9 invitees + 1 inviter = 10 total

interface Invitee {
  user_id: string;
  username: string;
}

interface InviteCollabDialogProps {
  inviteeId: string;
  inviteeUsername: string;
}

export function InviteCollabDialog({ inviteeId, inviteeUsername }: InviteCollabDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitees, setInvitees] = useState<Invitee[]>([{ user_id: inviteeId, username: inviteeUsername }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Invitee[]>([]);
  const [searching, setSearching] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  const MAX_IMAGES = 10;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    const remaining = MAX_IMAGES - imageUrls.length;
    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} must be under 5MB`, variant: 'destructive' });
        continue;
      }
      setUploading(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
      const { error } = await supabase.storage.from('post-images').upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
        setImageUrls(prev => [...prev, data.publicUrl]);
      }
      setUploading(false);
    }
  };

  const removeImage = (i: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('video/')) return;
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Video must be under 5GB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    setVideoPreview(URL.createObjectURL(file));
    const { error } = await supabase.storage.from('post-videos').upload(fileName, file, { contentType: file.type });
    if (!error) {
      const { data } = supabase.storage.from('post-videos').getPublicUrl(fileName);
      setVideoUrl(data.publicUrl);
    } else {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setVideoPreview(null);
    }
    setUploading(false);
  };

  const removeVideo = () => { setVideoUrl(null); setVideoPreview(null); };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // Strip leading @ for searching
    const term = query.trim().replace(/^@+/, '');
    if (!term) { setSearchResults([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      const excluded = [user?.id ?? '', ...invitees.map(i => i.user_id)];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username')
        .ilike('username', `${term}%`)
        .not('user_id', 'in', `(${excluded.join(',')})`)
        .limit(5);
      setSearchResults(data ?? []);
      setSearching(false);
    }, 250);
  };

  // When user types a space or comma after @username, try to resolve and add it
  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (invitees.length >= MAX_INVITEES) return;
    const trigger = e.key === ' ' || e.key === ',' || e.key === 'Enter';
    if (!trigger) return;
    const term = searchQuery.trim().replace(/^@+/, '');
    if (!term) return;
    e.preventDefault();
    // Exact-match lookup
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username')
      .ilike('username', term)
      .limit(1);
    const found = data?.[0];
    if (found && !invitees.some(i => i.user_id === found.user_id) && found.user_id !== user?.id) {
      addInvitee(found);
    } else if (searchResults[0]) {
      addInvitee(searchResults[0]);
    } else if (found && invitees.some(i => i.user_id === found.user_id)) {
      toast({ title: 'Already added', description: `@${found.username} is already a collaborator.`, variant: 'destructive' });
    } else if (found && found.user_id === user?.id) {
      toast({ title: "That's you", description: "You can't invite yourself.", variant: 'destructive' });
    } else {
      toast({ title: 'User not found', description: `No account matches @${term}.`, variant: 'destructive' });
    }
  };

  const addInvitee = (invitee: Invitee) => {
    if (invitees.length >= MAX_INVITEES) return;
    setInvitees(prev => [...prev, invitee]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeInvitee = (userId: string) => {
    if (userId === inviteeId) return; // cannot remove the preselected person
    setInvitees(prev => prev.filter(i => i.user_id !== userId));
  };

  const resetDialog = () => {
    setSubject('');
    setInvitees([{ user_id: inviteeId, username: inviteeUsername }]);
    setSearchQuery('');
    setSearchResults([]);
    setImageUrls([]);
    setImagePreviews([]);
    setVideoUrl(null);
    setVideoPreview(null);
  };

  const hasMedia = imageUrls.length > 0 || !!videoUrl;

  const handleInvite = async () => {
    if (!user || !subject.trim() || invitees.length === 0) return;
    if (!hasMedia) {
      toast({ title: 'Media required', description: 'Add at least one image or a video for the collab post.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    try {
      // Fetch current user's username for the message
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) throw new Error('Profile not found');

      const imagesField = imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;

      // Insert one invite row per invitee (no session_id column needed)
      const inviteRows = invitees.map(inv => ({
        inviter_id: user.id,
        invitee_id: inv.user_id,
        subject: subject.trim(),
        status: 'pending',
        image_urls: imagesField,
        video_url: videoUrl,
      }));

      const { data: collabs, error: collabError } = await supabase
        .from('post_collaborations')
        .insert(inviteRows)
        .select();

      if (collabError || !collabs) throw collabError ?? new Error('Failed to create invites');

      // Send inbox message to every invitee
      // Include all collab IDs so CollabPost can group them
      const allCollabIds = collabs.map(c => c.id);
      const collaboratorNote = invitees.length > 1
        ? ` · ${invitees.length} collaborators invited`
        : '';
      const messages = invitees.map((inv, idx) => ({
        user_id: inv.user_id,
        type: 'collab_invite',
        subject: `${myProfile.username} has invited you to collaborate on a post`,
        body: `Proposed subject: "${subject.trim()}"${collaboratorNote}`,
        data: {
          collab_id: collabs[idx].id,
          all_collab_ids: allCollabIds,
          inviter_id: user.id,
          inviter_username: myProfile.username,
          subject: subject.trim(),
        },
      }));

      const { error: msgError } = await supabase.from('inbox_messages').insert(messages);
      if (msgError) throw msgError;

      const names = invitees.map(i => `@${i.username}`).join(', ');
      toast({ title: 'Invitation sent!', description: `Sent to: ${names}` });
      setOpen(false);
      resetDialog();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send invitation. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === inviteeId) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full font-display gap-1">
          <Users className="h-4 w-4" />
          Collaborate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Invite to Collaborate</DialogTitle>
          <DialogDescription>
            Co-author a post with up to {MAX_INVITEES} people (including yourself that's 5 total).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Collaborators chips */}
          <div className="space-y-2">
            <Label className="font-display text-sm">
              Collaborators ({invitees.length}/{MAX_INVITEES})
            </Label>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {invitees.map(inv => (
                <span
                  key={inv.user_id}
                  className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs font-display"
                >
                  @{inv.username}
                  {inv.user_id !== inviteeId && (
                    <button
                      type="button"
                      onClick={() => removeInvitee(inv.user_id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {/* User search to add more */}
            {invitees.length < MAX_INVITEES && (
              <div className="relative">
                <div className="flex items-center gap-2 border minecraft-border rounded-md px-3 py-2">
                  {searching ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="@username — press space to add another"
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md overflow-hidden">
                    {searchResults.map(r => (
                      <button
                        key={r.user_id}
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm text-left"
                        onClick={() => addInvitee(r)}
                      >
                        <span className="font-medium">@{r.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <Label htmlFor="collab-subject" className="font-display text-sm">
              Post subject
            </Label>
            <Input
              id="collab-subject"
              placeholder="Add subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="minecraft-border"
              onKeyDown={(e) => { if (e.key === 'Enter' && subject.trim()) handleInvite(); }}
            />
            <p className="text-xs text-muted-foreground">{subject.length}/200</p>
          </div>

          {/* Media (inviter provides) */}
          <div className="space-y-2">
            <Label className="font-display text-sm">Media (required)</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              You add the image(s) or video. The invitee writes the caption and publishes.
            </p>

            {imagePreviews.length > 0 && (
              <div className={`grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : imagePreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative rounded overflow-hidden aspect-square minecraft-border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <Button type="button" variant="secondary" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {videoPreview && (
              <div className="relative rounded overflow-hidden minecraft-border">
                <video src={videoPreview} controls className="w-full max-h-64 bg-black" />
                <Button type="button" variant="secondary" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={removeVideo}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || imageUrls.length >= MAX_IMAGES || !!videoUrl} className="gap-1.5">
                <ImagePlus className="h-4 w-4" /> Add image
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => videoInputRef.current?.click()} disabled={uploading || !!videoUrl || imageUrls.length > 0} className="gap-1.5">
                <Video className="h-4 w-4" /> Add video
              </Button>
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!subject.trim() || loading || uploading || !hasMedia} className="font-display gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {loading ? 'Sending…' : `Send Invite${invitees.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
