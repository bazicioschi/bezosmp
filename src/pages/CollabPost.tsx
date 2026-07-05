import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Users, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

interface CollabData {
  id: string;
  subject: string;
  post_text: string | null;
  inviter_id: string;
  invitee_id: string;
  image_urls: string | null;
  video_url: string | null;
  status: string;
  post_id: string | null;
  inviter: { username: string; avatar_url: string | null } | null;
  invitee: { username: string; avatar_url: string | null } | null;
}

export default function CollabPost() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [collab, setCollab] = useState<CollabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user && inviteId) fetchCollab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, inviteId, authLoading]);

  const fetchCollab = async () => {
    if (!user || !inviteId) return;
    const { data, error } = await supabase
      .from('post_collaborations')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (error || !data) {
      toast({ title: 'Not found', description: 'Collaboration invite not found.', variant: 'destructive' });
      navigate('/');
      return;
    }
    if (data.inviter_id !== user.id) {
      toast({ title: 'Unauthorized', description: 'Only the inviter can publish this collab.', variant: 'destructive' });
      navigate('/');
      return;
    }
    if (data.status !== 'accepted') {
      toast({ title: 'Not accepted yet', description: 'Wait for the invitee to accept the invite.', variant: 'destructive' });
      navigate('/inbox');
      return;
    }
    if (data.post_id) {
      toast({ title: 'Already posted', description: 'This collaboration is already live.' });
      navigate('/');
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', [data.inviter_id, data.invitee_id]);
    const pmap = new Map((profiles ?? []).map(p => [p.user_id, p]));

    setCollab({
      ...data,
      inviter: pmap.get(data.inviter_id) ?? null,
      invitee: pmap.get(data.invitee_id) ?? null,
    });
    setLoading(false);
  };

  const imagePreviews: string[] = (() => {
    if (!collab?.image_urls) return [];
    try {
      const parsed = JSON.parse(collab.image_urls);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [collab.image_urls];
    }
  })();

  const handlePublish = async () => {
    if (!user || !collab || publishing) return;
    setPublishing(true);
    try {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id, // inviter posts
          content: collab.post_text ?? collab.subject,
          image_url: imagePreviews.length > 0
            ? (imagePreviews.length === 1 ? imagePreviews[0] : JSON.stringify(imagePreviews))
            : null,
          video_url: collab.video_url,
          co_author_id: collab.invitee_id,
        })
        .select()
        .single();

      if (postError || !post) throw postError ?? new Error('Failed to create post');

      await supabase.from('post_collaborators').insert({ post_id: post.id, user_id: collab.invitee_id });

      await supabase
        .from('post_collaborations')
        .update({ post_id: post.id })
        .eq('id', collab.id);

      await supabase.from('inbox_messages').insert({
        user_id: collab.invitee_id,
        type: 'collab_accepted',
        subject: 'Your collab post is live!',
        body: `The collaboration "${collab.subject}" was just published.`,
        data: { post_id: post.id },
      });

      toast({ title: 'Post published!', description: 'Your collaborative post is now live.' });
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
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!collab) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="minecraft-card minecraft-border p-5 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="font-display text-lg font-bold text-foreground">Publish Collaborative Post</h1>
          </div>

          <div className="bg-primary/10 rounded-lg p-3 mb-4 border border-primary/30">
            <p className="text-sm text-muted-foreground font-display mb-1">Title</p>
            <p className="font-semibold text-foreground">{collab.subject}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[collab.inviter, collab.invitee].map((m, idx) => m && (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <span className="text-muted-foreground text-sm">+</span>}
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-display text-xs">
                    {m.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-display font-medium text-foreground">@{m.username}</span>
                  <span className="text-xs text-muted-foreground">{idx === 0 ? 'inviter (you)' : 'co-author'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="minecraft-card minecraft-border p-5 animate-fade-in">
          <p className="text-sm text-muted-foreground font-display mb-1">Caption</p>
          <p className="whitespace-pre-wrap text-foreground mb-3">{collab.post_text}</p>

          {imagePreviews.length > 0 && (
            <div className={`grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : imagePreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative rounded overflow-hidden aspect-square minecraft-border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {collab.video_url && (
            <div className="relative mt-3 rounded overflow-hidden minecraft-border">
              <video src={collab.video_url} controls className="w-full max-h-96 bg-black" />
            </div>
          )}

          <div className="flex items-center justify-end pt-3 border-t border-border mt-3">
            <Button onClick={handlePublish} disabled={publishing} className="font-display gap-2">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {publishing ? 'Publishing…' : 'Publish Post'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
