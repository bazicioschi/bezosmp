import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/Header';
import { PostCard } from '@/components/PostCard';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  co_author_id: string | null;
  co_author_username: string | null;
  co_author_avatar_url: string | null;
}

export default function SavedPosts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const fetchSaved = async () => {
    if (!user) return;
    setLoading(true);
    const { data: saved } = await supabase
      .from('saved_posts')
      .select('post_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const postIds = (saved ?? []).map(s => s.post_id);
    if (postIds.length === 0) { setPosts([]); setLoading(false); return; }

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds);

    const authorIds = [...new Set((postsData ?? []).map(p => p.user_id))];
    const coAuthorIds = (postsData ?? []).map(p => p.co_author_id).filter(Boolean) as string[];
    const allIds = [...new Set([...authorIds, ...coAuthorIds])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', allIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

    const { data: likes } = await supabase
      .from('likes')
      .select('post_id, user_id')
      .in('post_id', postIds);
    const { data: comments } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    const enriched: Post[] = (postsData ?? []).map((p: any) => {
      const prof = profileMap.get(p.user_id);
      const co = p.co_author_id ? profileMap.get(p.co_author_id) : null;
      const pLikes = likes?.filter(l => l.post_id === p.id) ?? [];
      const pComments = comments?.filter(c => c.post_id === p.id) ?? [];
      return {
        id: p.id,
        content: p.content,
        image_url: p.image_url,
        video_url: p.video_url,
        created_at: p.created_at,
        user_id: p.user_id,
        username: prof?.username || 'Unknown',
        avatar_url: prof?.avatar_url || null,
        likes_count: pLikes.length,
        comments_count: pComments.length,
        user_liked: !!pLikes.find(l => l.user_id === user.id),
        co_author_id: p.co_author_id ?? null,
        co_author_username: co?.username ?? null,
        co_author_avatar_url: co?.avatar_url ?? null,
      };
    });

    // Preserve saved order
    enriched.sort((a, b) => postIds.indexOf(a.id) - postIds.indexOf(b.id));
    setPosts(enriched);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchSaved(); }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="mc-text text-2xl">Saved Posts</h1>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="minecraft-card p-8 text-center">
            <p className="mc-text text-muted-foreground">No saved posts yet. Tap the bookmark on any post to save it here.</p>
          </div>
        ) : (
          <div className="minecraft-card">
            {posts.map(p => (
              <PostCard
                key={p.id}
                id={p.id}
                content={p.content}
                imageUrl={p.image_url}
                videoUrl={p.video_url}
                createdAt={p.created_at}
                userId={p.user_id}
                username={p.username}
                avatarUrl={p.avatar_url}
                likesCount={p.likes_count}
                commentsCount={p.comments_count}
                isLiked={p.user_liked}
                onLikeToggle={fetchSaved}
                onDelete={fetchSaved}
                onEdit={fetchSaved}
                coAuthorId={p.co_author_id}
                coAuthorUsername={p.co_author_username}
                coAuthorAvatarUrl={p.co_author_avatar_url}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
