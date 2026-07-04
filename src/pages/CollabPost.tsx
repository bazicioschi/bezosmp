import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Users, ImagePlus, Video, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { MentionInput } from '@/components/MentionInput';

interface CollabMember {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: 'inviter' | 'invitee';
  status: string;
}

interface CollabSession {
  session_id: string;
  subject: string;
  inviter_id: string;
  members: CollabMember[];
}

const MAX_IMAGES = 10;

export default function CollabPost() {
  // The URL param may be a session_id (new) or a single invite id (old, backward compat)
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<CollabSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user && inviteId) {
      fetchCollabSession();
    }
  }, [user, inviteId, authLoading]);

  const fetchCollabSession = async () => {
    if (!user || !inviteId) return;

    // Load the user's own invite by ID
    const { data: myInvite, error } = await supabase
      .from('post_collaborations')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (error || !myInvite) {
      toast({ title: 'Not found', description: 'Collaboration invite not found.', variant: 'destructive' });
      navigate('/');
      return;
    }

    if (myInvite.invitee_id !== user.id) {
      toast({ title: 'Unauthorized', description: 'This invite is not for you.', variant: 'destructive' });
      navigate('/');
      return;
    }

    if (myInvite.status !== 'accepted') {
      toast({ title: 'Invalid invite', description: 'You have not accepted this invite yet.', variant: 'destructive' });
      navigate('/');
      return;
    }

    const inviterId = myInvite.inviter_id;
    const subject = myInvite.subject;

    // Load sibling invites: same inviter + same subject (the group)
    const { data: siblings } = await supabase
      .from('post_collaborations')
      .select('*')
      .eq('inviter_id', inviterId)
      .eq('subject', subject);

    const rows = siblings ?? [myInvite];

    // Gather all user IDs to fetch profiles for
    const allUserIds = [inviterId, ...rows.map(r => r.invitee_id)];
    const uniqueIds = [...new Set(allUserIds)];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', uniqueIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    const inviterProfile = profileMap.get(inviterId);
    const members: CollabMember[] = [
      {
        user_id: inviterId,
        username: inviterProfile?.username || 'Unknown',
        avatar_url: inviterProfile?.avatar_url || null,
        role: 'inviter',
        status: 'inviter',
      },
      ...rows.map(r => {
        const p = profileMap.get(r.invitee_id);
        return {
          user_id: r.invitee_id,
          username: p?.username || 'Unknown',
          avatar_url: p?.avatar_url || null,
          role: 'invitee' as const,
          status: r.status,
        };
      }),
    ];

    // Preload media provided by the inviter
    const inviteAny = myInvite as any;
    if (inviteAny.image_urls) {
      try {
        const parsed = JSON.parse(inviteAny.image_urls);
        if (Array.isArray(parsed)) {
          setImageUrls(parsed);
          setImagePreviews(parsed);
        } else if (typeof parsed === 'string') {
          setImageUrls([parsed]);
          setImagePreviews([parsed]);
        }
      } catch {
        setImageUrls([inviteAny.image_urls]);
        setImagePreviews([inviteAny.image_urls]);
      }
    }
    if (inviteAny.video_url) {
      setVideoUrl(inviteAny.video_url);
      setVideoPreview(inviteAny.video_url);
    }

    setSession({ session_id: inviteId, subject, inviter_id: inviterId, members });
    setLoading(false);
  };

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
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);

      const { error } = await supabase.storage.from('post-images').upload(fileName, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
        setImageUrls(prev => [...prev, urlData.publicUrl]);
      }
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/3gpp2'];
    if (!file.type.startsWith('video/') && !allowed.includes(file.type)) {
      toast({ title: 'Unsupported format', description: 'Please upload a valid video file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Video must be under 5GB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const blobUrl = URL.createObjectURL(file);
    setVideoPreview(blobUrl);
    const { error } = await supabase.storage.from('post-videos').upload(fileName, file, { contentType: file.type });
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setVideoPreview(null);
    } else {
      const { data } = supabase.storage.from('post-videos').getPublicUrl(fileName);
      setVideoUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const removeVideo = () => {
    setVideoUrl(null);
    setVideoPreview(null);
  };

  const handlePublish = async () => {
    if (!user || !session || !content.trim() || publishing) return;
    setPublishing(true);

    try {
      // Reversed flow: the INVITEE writes the content and publishes the post
      // under their own account, with the inviter credited as co-author.
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          image_url: imageUrls.length > 0
            ? (imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls))
            : null,
          video_url: videoUrl,
          co_author_id: session.inviter_id,
        })
        .select()
        .single();

      if (postError || !post) throw postError ?? new Error('Failed to create post');

      // Credit everyone else in the session (inviter + other invitees) as collaborators
      const otherMembers = session.members.filter(
        m => m.user_id !== user.id && (m.role === 'inviter' || m.status === 'accepted' || m.role === 'invitee')
      );
      if (otherMembers.length > 0) {
        await supabase.from('post_collaborators').insert(
          otherMembers.map(m => ({ post_id: post.id, user_id: m.user_id }))
        );
      }

      // Mark all sibling invites as having a post (group by inviter + subject)
      await supabase
        .from('post_collaborations')
        .update({ post_id: post.id })
        .eq('inviter_id', session.inviter_id)
        .eq('subject', session.subject);

      // Notify the inviter that the collab post went live
      await supabase.from('inbox_messages').insert({
        user_id: session.inviter_id,
        type: 'collab_accepted',
        subject: 'Your collab post is live!',
        body: `Your collaboration "${session.subject}" was published by a collaborator.`,
        data: { post_id: post.id },
      });

      toast({ title: 'Post published!', description: 'Your collaborative post is now live under your account.' });
      navigate('/');
    } catch {
      toast({ title: 'Error', description: 'Failed to publish post. Please try again.', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
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
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Collab header card */}
        <div className="minecraft-card minecraft-border p-5 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="font-display text-lg font-bold text-foreground">Collaborative Post</h1>
          </div>

          <div className="bg-primary/10 rounded-lg p-3 mb-4 border border-primary/30">
            <p className="text-sm text-muted-foreground font-display mb-1">Proposed subject</p>
            <p className="font-semibold text-foreground">{session?.subject}</p>
          </div>

          {/* All co-authors */}
          <div className="flex flex-wrap items-center gap-3">
            {session?.members.map((member, idx) => (
              <div key={member.user_id} className="flex items-center gap-2">
                {idx > 0 && <span className="text-muted-foreground text-sm">+</span>}
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-display text-xs">
                    {member.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-display font-medium text-foreground">@{member.username}</span>
                  {member.role === 'inviter' && (
                    <span className="text-xs text-muted-foreground">inviter</span>
                  )}
                  {member.role === 'invitee' && member.status !== 'accepted' && (
                    <span className="text-xs text-muted-foreground capitalize">{member.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post editor */}
        <div className="minecraft-card minecraft-border p-5 animate-fade-in">
          <MentionInput
            value={content}
            onChange={setContent}
            placeholder={`Write about "${session?.subject}"… Use @username to mention`}
            className="min-h-[160px] bg-transparent border-0 resize-none text-base placeholder:text-muted-foreground focus-visible:ring-0 p-0 w-full"
          />

          {/* Media provided by the inviter (read-only) */}
          {imagePreviews.length > 0 && (
            <div className={`mt-3 grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : imagePreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative rounded overflow-hidden aspect-square minecraft-border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {videoPreview && (
            <div className="relative mt-3 rounded overflow-hidden minecraft-border">
              <video src={videoPreview} controls className="w-full max-h-96 bg-black" />
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Media was provided by the inviter. Just write your caption and publish.
          </p>

          <div className="flex items-center justify-end pt-3 border-t border-border mt-3">
            <Button
              onClick={handlePublish}
              disabled={!content.trim() || publishing || uploading}
              className="font-display gap-2"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
