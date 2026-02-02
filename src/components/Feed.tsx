import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';

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
}

export function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    // Fetch posts
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError || !postsData) {
      setLoading(false);
      return;
    }

    // Fetch profiles for all post authors
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    // Fetch likes counts
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id, user_id');

    // Fetch comments counts
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id');

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
    
    const enrichedPosts: Post[] = postsData.map(post => {
      const profile = profilesMap.get(post.user_id);
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
        user_liked: user ? postLikes.some(l => l.user_id === user.id) : false,
      };
    });

    setPosts(enrichedPosts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
        posts.map((post) => (
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
          />
        ))
      )}
    </div>
  );
}
