import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Loader2, MessageCircle, ArrowLeft, UserPlus, CalendarDays, Crown, Shield, Pencil, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { PostCard } from '@/components/PostCard';
import { InviteCollabDialog } from '@/components/InviteCollabDialog';
import { useFollows } from '@/hooks/useFollows';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTheme } from '@/hooks/useTheme';
import { parseBioPrivacy } from '@/lib/utils';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  banner_url: string | null;
  created_at: string;
  is_private: boolean;
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
  const [isProfileAdmin, setIsProfileAdmin] = useState(false);
  const [isProfileModerator, setIsProfileModerator] = useState(false);
  const [followsPanel, setFollowsPanel] = useState<'following' | 'followers' | null>(null);
  const [followsUsers, setFollowsUsers] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);
  const [viewerAllowed, setViewerAllowed] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfileAndPosts();
      fetchCounts();
      // Fetch all roles for this user
      supabase.from('user_roles').select('role').eq('user_id', userId)
        .then(({ data }) => {
          const roles = data?.map(r => r.role) || [];
          setIsProfileOwner(roles.includes('owner'));
          setIsProfileAdmin(roles.includes('admin'));
          setIsProfileModerator(roles.includes('moderator'));
        });
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
    let isAllowedToView = true;

    if (profileData) {
      // Parse privacy settings from bio
      const { displayBio, isPrivate, allowedViewerIds } = parseBioPrivacy(profileData.bio);
      setProfile({ ...profileData, bio: displayBio } as Profile);

      const isOwnProfile = user?.id === userId;
      isAllowedToView = isOwnProfile || !isPrivate ||
        (user?.id ? allowedViewerIds.includes(user.id) : false);
      setViewerAllowed(isAllowedToView);
    }

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postsData) {
      const visiblePosts = isAllowedToView ? postsData : [];
      const postsWithCounts = await Promise.all(
        visiblePosts.map(async (post) => {
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

  const openFollowsPanel = async (type: 'following' | 'followers') => {
    setFollowsPanel(type);
    setFollowsLoading(true);
    setFollowsUsers([]);
    if (type === 'following') {
      const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
      if (data && data.length > 0) {
        const ids = data.map(r => r.following_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', ids);
        setFollowsUsers(profiles ?? []);
      }
    } else {
      const { data } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
      if (data && data.length > 0) {
        const ids = data.map(r => r.follower_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', ids);
        setFollowsUsers(profiles ?? []);
      }
    }
    setFollowsLoading(false);
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
  const isPrivate = !viewerAllowed;

  const getProfileBgClass = () => {
    switch (theme) {
      case 'pizza': return 'bg-black text-white';
      case 'cato': return 'bg-white text-black';
      case 'buzzy': return 'bg-yellow-400 text-black';
      case 'bazimazi': return 'bg-white text-black';
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
        <div className="profile-banner relative h-48 bg-secondary/50">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="profile-banner-placeholder w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
          )}

          {/* Avatar */}
          <div className="absolute -bottom-16 left-4">
            <div className="relative inline-flex items-end gap-2">
              <Avatar className={`h-32 w-32 border-4 border-background ${
                isProfileOwner
                  ? 'profile-shiny profile-shiny-border'
                  : isProfileAdmin
                    ? 'profile-glint-admin profile-glint-admin-border'
                    : isProfileModerator
                      ? 'profile-glint-mod profile-glint-mod-border'
                      : ''
              }`}>
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-display text-3xl">
                  {profile.username?.slice(0, 2).toUpperCase() || <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              {/* Role badge next to the avatar */}
              {isProfileOwner && (
                <span className="mb-2 text-xs bg-yellow-900/80 text-yellow-200 px-2 py-0.5 rounded font-bold border border-yellow-500/60 inline-flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <Crown className="h-3 w-3" /> OWNER
                </span>
              )}
              {!isProfileOwner && isProfileAdmin && (
                <span className="mb-2 text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-bold border border-red-500/40 inline-flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <Shield className="h-3 w-3" /> ADMIN
                </span>
              )}
              {!isProfileOwner && !isProfileAdmin && isProfileModerator && (
                <span className="mb-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/40 inline-flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <Shield className="h-3 w-3" /> MOD
                </span>
              )}
            </div>
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
                className="rounded-full border-border gap-1.5 mc-btn"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </Button>
              <InviteCollabDialog inviteeId={userId!} inviteeUsername={profile.username} />
              <Button
                onClick={() => { playPop(); toggleFollow(userId!); fetchCounts(); }}
                variant={isFollowing(userId!) ? "outline" : "default"}
                size="sm"
                className={`rounded-full font-display gap-1.5 ${isFollowing(userId!) ? 'mc-btn' : 'mc-btn-primary'}`}
              >
                <UserPlus className="h-4 w-4" />
                {isFollowing(userId!) ? 'Following' : 'Follow'}
              </Button>
            </>
          )}
          {isOwnProfile && (
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              size="icon"
              className="rounded-full h-9 w-9"
              title="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Profile info */}
        <div className="px-4 pt-12 pb-4">
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            {profile.username}
          </h1>
          
          {profile.bio && !isPrivate && (
            <p className="text-sm text-foreground mt-2">{profile.bio}</p>
          )}

          <div className="flex items-center gap-1 mt-2 text-white">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">Joined {formatDate(profile.created_at)}</span>
          </div>

          <div className="flex gap-4 mt-3">
            <button
              onClick={() => { if (!isPrivate || isOwnProfile) openFollowsPanel('following'); }}
              className={`text-sm text-left ${!isPrivate || isOwnProfile ? 'hover:underline' : 'cursor-default opacity-50'}`}
              disabled={isPrivate && !isOwnProfile}
            >
              <span className="font-bold text-foreground">{followingCount}</span>{' '}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button
              onClick={() => { if (!isPrivate || isOwnProfile) openFollowsPanel('followers'); }}
              className={`text-sm text-left ${!isPrivate || isOwnProfile ? 'hover:underline' : 'cursor-default opacity-50'}`}
              disabled={isPrivate && !isOwnProfile}
            >
              <span className="font-bold text-foreground">{followerCount}</span>{' '}
              <span className="text-muted-foreground">Followers</span>
            </button>
          </div>

          {/* Follows dialog */}
          <Dialog open={followsPanel !== null} onOpenChange={(open) => { if (!open) setFollowsPanel(null); }}>
            <DialogContent className="minecraft-card max-w-sm">
              <DialogHeader>
                <DialogTitle className="mc-text">{followsPanel === 'following' ? 'Following' : 'Followers'}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-80 pr-2">
                {followsLoading && <p className="text-center text-muted-foreground py-6">Loading...</p>}
                {!followsLoading && followsUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-6 text-sm">No users yet.</p>
                )}
                <div className="space-y-2">
                  {followsUsers.map(u => (
                    <button
                      key={u.user_id}
                      onClick={() => { setFollowsPanel(null); navigate(`/user/${u.user_id}`); }}
                      className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs mc-text">{u.username.slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-display text-sm font-medium text-foreground">@{u.username}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs + Posts */}
        {isPrivate ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Lock className="h-10 w-10" />
            <p className="font-bold text-foreground text-lg">This account is private</p>
          </div>
        ) : (
          <>
        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex">
            <button className="flex-1 py-3 text-center border-b-2 border-primary">
              <span className="mc-text text-sm text-foreground">Posts</span>
            </button>
          </div>
        </div>

        {/* Posts */}
        <div className={
          theme === 'buzzy' || theme === 'bazimazi' || theme === 'cato' || theme === 'light'
            ? 'bg-white text-black'
            : theme === 'ghast'
              ? 'bg-gray-300 text-black'
              : ''
        }>
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
        </div>
          </>
        )}
      </main>
    </div>
  );
}
