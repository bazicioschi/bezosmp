import { useState, useRef } from 'react';
import { Users, X, Loader2, ImagePlus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface InviteCollabDialogProps {
  inviteeId: string;
  inviteeUsername: string;
}

const MAX_IMAGES = 10;

export function InviteCollabDialog({ inviteeId, inviteeUsername }: InviteCollabDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const resetDialog = () => {
    setSubject('');
    setPostText('');
    setImageUrls([]);
    setImagePreviews([]);
    setVideoUrl(null);
    setVideoPreview(null);
  };

  const hasMedia = imageUrls.length > 0 || !!videoUrl;

  const handleInvite = async () => {
    if (!user || !subject.trim() || !postText.trim()) return;
    if (!hasMedia) {
      toast({ title: 'Media required', description: 'Add at least one image or a video for the collab post.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) throw new Error('Profile not found');

      const imagesField = imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;

      const { data: collab, error: collabError } = await supabase
        .from('post_collaborations')
        .insert({
          inviter_id: user.id,
          invitee_id: inviteeId,
          subject: subject.trim(),
          post_text: postText.trim(),
          status: 'pending',
          image_urls: imagesField,
          video_url: videoUrl,
        })
        .select()
        .single();

      if (collabError || !collab) throw collabError ?? new Error('Failed to create invite');

      const { error: msgError } = await supabase.from('inbox_messages').insert({
        user_id: inviteeId,
        type: 'collab_invite',
        subject: `${myProfile.username} has invited you to collaborate on a post`,
        body: `Title: "${subject.trim()}"`,
        data: {
          collab_id: collab.id,
          inviter_id: user.id,
          inviter_username: myProfile.username,
          subject: subject.trim(),
        },
      });
      if (msgError) throw msgError;

      toast({ title: 'Invitation sent!', description: `Sent to @${inviteeUsername}` });
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Invite @{inviteeUsername}</DialogTitle>
          <DialogDescription>
            Co-author a post together. You write the title, caption and add media — they just accept and it goes live on your account with them credited.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="collab-subject" className="font-display text-sm">Title</Label>
            <Input
              id="collab-subject"
              placeholder="Give the collab a title"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="minecraft-border"
            />
            <p className="text-xs text-muted-foreground">{subject.length}/200</p>
          </div>

          {/* Caption / post text */}
          <div className="space-y-1">
            <Label htmlFor="collab-text" className="font-display text-sm">Post caption</Label>
            <Textarea
              id="collab-text"
              placeholder="Write the caption for the post…"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              maxLength={2000}
              className="minecraft-border min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">{postText.length}/2000</p>
          </div>

          {/* Media */}
          <div className="space-y-2">
            <Label className="font-display text-sm">Media (required)</Label>

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
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleInvite} disabled={!subject.trim() || !postText.trim() || loading || uploading || !hasMedia} className="font-display gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {loading ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
