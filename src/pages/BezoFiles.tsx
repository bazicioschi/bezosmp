import { useState, useEffect } from 'react';
import { FolderOpen, Loader2, User, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PostCard } from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface ArchivedPost {
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

interface UserGroup {
  user_id: string;
  username: string;
  avatar_url: string | null;
  posts: ArchivedPost[];
}

export default function BezoFiles() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchArchivedPosts = async () => {
    setLoading(true);

    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !postsData) {
      setLoading(false);
      return;
    }

    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id, user_id');

    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id');

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    const enriched: ArchivedPost[] = postsData.map(post => {
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

    // Group posts by user, preserving order of first appearance
    const groupMap = new Map<string, UserGroup>();
    for (const post of enriched) {
      if (!groupMap.has(post.user_id)) {
        groupMap.set(post.user_id, {
          user_id: post.user_id,
          username: post.username,
          avatar_url: post.avatar_url,
          posts: [],
        });
      }
      groupMap.get(post.user_id)!.posts.push(post);
    }
    // Sort groups by the most recent post in each group
    const sorted = Array.from(groupMap.values()).sort(
      (a, b) => new Date(b.posts[0].created_at).getTime() - new Date(a.posts[0].created_at).getTime()
    );

    setGroups(sorted);
    setLoading(false);
  };

  useEffect(() => {
    fetchArchivedPosts();

    // Keep archive in sync with new posts / likes
    const channel = supabase
      .channel('bezo-files-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchArchivedPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchArchivedPosts)
      .subscribe();

    // Also listen for admin feed refreshes so archive re-syncs
    const adminChannel = supabase
      .channel('bezo-files-admin')
      .on('broadcast', { event: 'feed_refresh' }, () => fetchArchivedPosts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(adminChannel);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background mc-bedrock">
      <Header />
      <main className="max-w-2xl mx-auto p-4 relative z-10">
        <div className="minecraft-card p-6 mb-6">
          <h1 className="mc-text text-2xl text-primary glow-text mb-1 flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            BEZOSMP FILES
          </h1>
          <p className="text-muted-foreground text-sm">
            All posts are automatically archived here. Feed refreshes by admins do not delete this archive.
          </p>
        </div>

        {/* User selector */}
        {!loading && groups.length > 0 && (
          <div className="minecraft-card p-4 mb-6">
            <p className="mc-text text-xs text-muted-foreground mb-3 uppercase">Filter by user</p>
            <div className="flex flex-wrap gap-2">
              {groups.map(group => (
                <button
                  key={group.user_id}
                  onClick={() => setSelectedUserId(prev => prev === group.user_id ? null : group.user_id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    selectedUserId === group.user_id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-secondary/50 text-foreground'
                  }`}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={group.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                      {group.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="mc-text">{group.username}</span>
                  <span className="text-xs opacity-60">({group.posts.length})</span>
                </button>
              ))}
              {selectedUserId && (
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={() => setSelectedUserId(null)}>
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="minecraft-card p-8 text-center">
            <p className="text-muted-foreground">No posts archived yet.</p>
          </div>
        ) : !selectedUserId ? (
          <div className="minecraft-card p-8 text-center">
            <p className="text-muted-foreground">Select a user above to view their posts.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.filter(g => g.user_id === selectedUserId).map(group => (
              <div key={group.user_id} className="minecraft-card overflow-hidden">
                {/* User header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/30">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={group.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                      {group.username?.slice(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="mc-text text-sm font-bold text-foreground">@{group.username}</p>
                    <p className="text-xs text-muted-foreground">{group.posts.length} post{group.posts.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {/* Posts for this user */}
                <div>
                  {group.posts.map(post => (
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
                      onLikeToggle={fetchArchivedPosts}
                      onDelete={fetchArchivedPosts}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
