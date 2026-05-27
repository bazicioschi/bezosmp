import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';
import { parseBioPrivacy } from '@/lib/utils';

const PAGE_SIZE = 10;

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
}

interface FeedProps {
  refreshTrigger?: number;
}

export function Feed({ refreshTrigger }: FeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreFnRef = useRef<() => Promise<void>>();

  const enrichPosts = async (postsData: any[]) => {
    if (!postsData.length) return [];
    const authorIds = [...new Set(postsData.map(p => p.user_id))];
    const coAuthorIds = postsData.map(p => p.co_author_id).filter(Boolean) as string[];
    const allUserIds = [...new Set([...authorIds, ...coAuthorIds])];

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url, bio')
      .in('user_id', allUserIds);

    const postIds = postsData.map(p => p.id);
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id, user_id')
      .in('post_id', postIds);

    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    // Build privacy map from bio encoding (no DB table needed)
    const privacyMap = new Map<string, { isPrivate: boolean; allowedViewerIds: string[] }>();
    for (const p of (profilesData || [])) {
      const { isPrivate, allowedViewerIds } = parseBioPrivacy(p.bio);
      if (isPrivate) privacyMap.set(p.user_id, { isPrivate, allowedViewerIds });
    }

    // Build map: owner_user_id is_private
    const profilesMap2 = new Map((profilesData || []).map(p => [p.user_id, p]));

    // Filter out posts the current user isn't allowed to see
    const currentUserId = user?.id;
    const visiblePosts = postsData.filter(post => {
      if (post.user_id === currentUserId) return true;
      const priv = privacyMap.get(post.user_id);
      if (!priv) return true; // public account
      // Private: check if current user is in allowed list
      return currentUserId ? priv.allowedViewerIds.includes(currentUserId) : false;
    });

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    return visiblePosts.map(post => {
      const profile = profilesMap.get(post.user_id);
      const coAuthorProfile = post.co_author_id ? profilesMap.get(post.co_author_id) : null;
      const postLikes = likesData?.filter(l => l.post_id === post.id) || [];
      const postComments = commentsData?.filter(c => c.post_id === post.id) || [];
      return {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        video_url: post.video_url,
        created_at: post.created_at,
        user_id: post.user_id,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        likes_count: postLikes.length,
        comments_count: postComments.length,
        user_liked: user ? postLikes.some((l: any) => l.user_id === user.id) : false,
        co_author_id: post.co_author_id || null,
        co_author_username: coAuthorProfile?.username || null,
        co_author_avatar_url: coAuthorProfile?.avatar_url || null,
      };
    });
  };

  // Initial load / full refresh (page 0)
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    pageRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (error || !postsData) { setLoading(false); return; }

    const enriched = await enrichPosts(postsData.filter((p: any) => p.blocked !== true));
    setPosts(enriched);
    const more = postsData.length === PAGE_SIZE;
    hasMoreRef.current = more;
    setHasMore(more);
    setLoading(false);
  }, [user]);

  // Load next page and append
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && postsData) {
      const enriched = await enrichPosts(postsData.filter((p: any) => p.blocked !== true));
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = enriched.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
      const more = postsData.length === PAGE_SIZE;
      hasMoreRef.current = more;
      setHasMore(more);
      pageRef.current = nextPage;
    }
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [user]);

  // Keep ref always pointing to latest loadMore (avoids stale closures in scroll handler)
  useEffect(() => { loadMoreFnRef.current = loadMore; }, [loadMore]);

  // Scroll-based infinite scroll — fires reliably on every scroll near bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const threshold = document.documentElement.scrollHeight - 300;
      if (scrolled >= threshold) loadMoreFnRef.current?.();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchPosts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Listen for admin-triggered feed refreshes
  useEffect(() => {
    const adminChannel = supabase
      .channel('admin-feed-control')
      .on('broadcast', { event: 'feed_refresh' }, () => { fetchPosts(); })
      .subscribe();
    return () => { supabase.removeChannel(adminChannel); };
  }, []);

  // Re-fetch when parent passes a new refreshTrigger value
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) fetchPosts();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreatePost onPostCreated={fetchPosts} />

      {posts.length === 0 ? (
        <div className="minecraft-card p-8 text-center">
          <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              content={post.content}
              imageUrl={post.image_url}
              videoUrl={post.video_url}
              createdAt={post.created_at}
              userId={post.user_id}
              username={post.username}
              avatarUrl={post.avatar_url}
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              isLiked={post.user_liked}
              onLikeToggle={fetchPosts}
              onDelete={fetchPosts}
              onEdit={fetchPosts}
            />
          ))}

          {/* Sentinel for IntersectionObserver */}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {!hasMore && !loadingMore && (
              <p className="text-xs text-muted-foreground mc-text">You're all caught up!</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}