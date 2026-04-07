import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Loader2, MessageCircle, ArrowLeft, UserPlus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { PostCard } from '@/components/PostCard';
import { useFollows } from '@/hooks/useFollows';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTheme } from '@/hooks/useTheme';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  banner_url: string | null;
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
  const { isFollowing, toggleFollow } = useFollows();
  const { playPop } = useSoundEffects();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isProfileOwner, setIsProfileOwner] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfileAndPosts();
      fetchCounts();
      // Check if this user is an owner
      supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'owner').maybeSingle()
        .then(({ data }) => setIsProfileOwner(!!data));
    }
  }, [userId, user]);

  const fetchCounts = async () => {
    if (!userId) return;
    const [followers, following] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
    ]);
    setFollowerCount(followers.count || 0);
    setFollowingCount(following.count || 0);
  };

  const fetchProfileAndPosts = async () => {
    if (!userId) return;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (profileData) setProfile(profileData as Profile);

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
    if (userId && user) navigate(`/messages/${userId}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

  const getProfileBgClass = () => {
    switch (theme) {
      case 'pizza': return 'bg-black text-white';
      case 'cato': return 'bg-white text-black';
      case 'buzzy': return 'bg-yellow-400 text-black';
      case 'bazimazi': return 'bg-red-600 text-white';
      case 'ghast': return 'bg-gray-300 text-black';
      case 'dark': return 'bg-black text-white';
      default: return 'bg-background text-foreground';
    }
  };

  return (
    <div className={`min-h-screen ${getProfileBgClass()}`}>
      <Header />
      
      <main className="max-w-2xl mx-auto">
        {/* Back button */}
        <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground leading-tight">{profile.username}</h2>
            <p className="text-xs text-muted-foreground">{posts.length} posts</p>
          </div>
        </div>

        {/* Banner */}
        <div className="relative h-48 bg-secondary/50">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
          )}

          {/* Avatar */}
          <div className="absolute -bottom-16 left-4">
            <Avatar className={`h-32 w-32 border-4 border-background ${isProfileOwner ? 'profile-shiny profile-shiny-border' : ''}`}>
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-display text-3xl">
                {profile.username?.slice(0, 2).toUpperCase() || <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 px-4 pt-3">
          {!isOwnProfile && user && (
            <>
              <Button
                onClick={handleStartChat}
                variant="outline"
                size="sm"
                className="rounded-full border-border"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => { playPop(); toggleFollow(userId!); fetchCounts(); }}
                variant={isFollowing(userId!) ? "outline" : "default"}
                size="sm"
                className="rounded-full font-display"
              >
                {isFollowing(userId!) ? 'Following' : 'Follow'}
              </Button>
            </>
          )}
          {isOwnProfile && (
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              size="sm"
              className="rounded-full font-display"
            >
              Edit profile
            </Button>
          )}
        </div>

        {/* Profile info */}
        <div className="px-4 pt-12 pb-4">
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            {profile.username}
            {isProfileOwner && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-bold border border-yellow-500/30">👑 OWNER</span>}
          </h1>
          
          {profile.bio && (
            <p className="text-sm text-foreground mt-2">{profile.bio}</p>
          )}

          <div className="flex items-center gap-1 mt-2 text-white">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">Joined {formatDate(profile.created_at)}</span>
          </div>

          <div className="flex gap-4 mt-3">
            <span className="text-sm">
              <span className="font-bold text-foreground">{followingCount}</span>{' '}
              <span className="text-muted-foreground">Following</span>
            </span>
            <span className="text-sm">
              <span className="font-bold text-foreground">{followerCount}</span>{' '}
              <span className="text-muted-foreground">Followers</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex">
            <button className="flex-1 py-3 text-center border-b-2 border-primary">
              <span className="mc-text text-sm text-foreground">Posts</span>
            </button>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        ) : (
          <div>
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
