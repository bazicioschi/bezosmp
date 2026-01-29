import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { PostCard } from '@/components/PostCard';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfileAndPosts();
    }
  }, [userId, user]);

  const fetchProfileAndPosts = async () => {
    if (!userId) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch posts with likes and comments count
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postsData) {
      const postsWithCounts = await Promise.all(
        postsData.map(async (post) => {
          const [likesRes, commentsRes, likedRes] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
            user
              ? supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...post,
            likes_count: likesRes.count || 0,
            comments_count: commentsRes.count || 0,
            is_liked: !!likedRes.data,
          };
        })
      );
      setPosts(postsWithCounts);
    }

    setLoading(false);
  };

  const handleStartChat = () => {
    if (userId && user) {
      navigate(`/messages/${userId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 font-display"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          BACK
        </Button>

        {/* Profile Header */}
        <div className="minecraft-card minecraft-border minecraft-grass-top glow-border p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/30 minecraft-border">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-display text-3xl">
                {profile.username?.slice(0, 2).toUpperCase() || <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-3xl font-bold text-foreground glow-text mb-2">
                {profile.username}
              </h1>
              
              {profile.bio && (
                <p className="text-muted-foreground mb-4 max-w-md">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-4">
                <div className="minecraft-card px-4 py-2 text-center">
                  <span className="font-display text-2xl font-bold text-primary">{posts.length}</span>
                  <span className="block text-xs text-muted-foreground uppercase tracking-wider">Posts</span>
                </div>
              </div>

              {!isOwnProfile && user && (
                <Button
                  onClick={handleStartChat}
                  className="minecraft-border font-display"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  SEND MESSAGE
                </Button>
              )}

              {isOwnProfile && (
                <Button
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  className="minecraft-border font-display"
                >
                  EDIT PROFILE
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Posts by {profile.username}
        </h2>

        {posts.length === 0 ? (
          <div className="minecraft-card minecraft-border p-8 text-center">
            <p className="text-muted-foreground font-display">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                content={post.content}
                imageUrl={post.image_url}
                createdAt={post.created_at}
                userId={post.user_id}
                username={profile.username}
                avatarUrl={profile.avatar_url}
                likesCount={post.likes_count}
                commentsCount={post.comments_count}
                isLiked={post.is_liked}
                onLikeToggle={fetchProfileAndPosts}
                onDelete={fetchProfileAndPosts}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
