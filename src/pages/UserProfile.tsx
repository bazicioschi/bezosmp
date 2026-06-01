import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Loader2, MessageCircle, ArrowLeft, UserPlus, CalendarDays, Crown, Shield, Pencil, Lock, Link2 } from 'lucide-react';
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
import { useAdmin } from '@/hooks/useAdmin';
import { parseBioPrivacy, type SocialLink } from '@/lib/utils';
import { VerifiedBadge } from '@/components/VerifiedBadge';

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

function SocialIcon({ platform }: { platform: string }) {
  const cls = 'h-3.5 w-3.5 fill-current shrink-0';
  switch (platform) {
    case 'youtube': return <svg className={cls} viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
    case 'tiktok': return <svg className={cls} viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>;
    case 'instagram': return <svg className={cls} viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
    case 'twitter': return <svg className={cls} viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
    case 'twitch': return <svg className={cls} viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>;
    case 'github': return <svg className={cls} viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>;
    case 'discord': return <svg className={cls} viewBox="0 0 24 24"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026 13.83 13.83 0 001.226-1.963.074.074 0 00-.041-.104 13.175 13.175 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/></svg>;
    case 'reddit': return <svg className={cls} viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>;
    default: return <Link2 className="h-3.5 w-3.5 shrink-0" />;
  }
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollows();
  const { playPop } = useSoundEffects();
  const { theme } = useTheme();
  const { canModerate } = useAdmin();
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
  const [linkedAccounts, setLinkedAccounts] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<Date | null>(null);

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
      // Check suspension status via security-definer RPC (bypasses RLS)
      supabase.rpc('is_user_suspended', { target_user_id: userId }).then(({ data: suspended }) => {
        setIsSuspended(!!suspended);
        if (suspended) {
          supabase.rpc('get_suspension_expiry', { target_user_id: userId }).then(({ data: expiry }) => {
            setSuspendedUntil(expiry ? new Date(expiry) : null);
          });
        }
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
      const { displayBio, isPrivate, allowedViewerIds, linkedAccountIds, socialLinks: socialLinks_parsed } = parseBioPrivacy(profileData.bio);
      setProfile({ ...profileData, bio: displayBio } as Profile);

      const isOwnProfile = user?.id === userId;
      isAllowedToView = isOwnProfile || !isPrivate ||
        (user?.id ? allowedViewerIds.includes(user.id) : false);
      setViewerAllowed(isAllowedToView);

      // Load linked accounts — only show if BOTH users link each other (mutual)
      if (linkedAccountIds.length > 0) {
        const { data: linked } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url, bio')
          .in('user_id', linkedAccountIds);
        const mutualLinks = (linked ?? []).filter(lp => {
          const { linkedAccountIds: theirLinks } = parseBioPrivacy(lp.bio);
          return theirLinks.includes(userId!);
        }).map(lp => ({ user_id: lp.user_id, username: lp.username, avatar_url: lp.avatar_url }));
        setLinkedAccounts(mutualLinks);
      } else {
        setLinkedAccounts([]);
      }
      setSocialLinks(socialLinks_parsed);
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
          <h1 className={`font-display text-xl font-bold flex items-center gap-2 ${theme === 'bazimazi' ? 'text-black' : 'text-white'}`}>
            {profile.username}
            <VerifiedBadge userId={profile.user_id} className="[&>svg]:h-5 [&>svg]:w-5" />
          </h1>
          
          {profile.bio && !isPrivate && (
            <p className={`text-sm mt-2 ${theme === 'bazimazi' ? 'text-black' : 'text-foreground'}`}>{profile.bio}</p>
          )}

          <div className={`flex items-center gap-1 mt-2 ${theme === 'bazimazi' ? 'text-black' : 'text-white'}`}>
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">Joined {formatDate(profile.created_at)}</span>
          </div>

          {/* Suspension banners */}
          {isSuspended && isOwnProfile && (
            <div className="mt-3 rounded-lg border-2 border-orange-500/60 bg-orange-500/10 p-3">
              <p className="text-orange-400 font-bold text-sm">⚠ Your account is suspended</p>
              <p className="text-orange-300 text-xs mt-0.5">
                {suspendedUntil
                  ? `Until ${suspendedUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Permanently suspended'}
              </p>
              <p className="text-muted-foreground text-xs mt-1">You cannot post, comment, or chat while suspended.</p>
            </div>
          )}
          {isSuspended && !isOwnProfile && canModerate && (
            <div className="mt-3 rounded-lg border-2 border-orange-500/40 bg-orange-500/10 p-2">
              <p className="text-orange-400 font-bold text-xs">⚠ This account is currently suspended</p>
            </div>
          )}

          {/* Linked accounts */}
          {linkedAccounts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                <span className="text-xs">Connections:</span>
              </div>
              {linkedAccounts.map(a => (
                <button
                  key={a.user_id}
                  onClick={() => navigate(`/user/${a.user_id}`)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/60 hover:bg-secondary transition-colors"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={a.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
                    <AvatarFallback className="text-[8px]">{a.username.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground">@{a.username}</span>
                </button>
              ))}
            </div>
          )}

          {/* Social media links */}
          {socialLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={/^https?:\/\//i.test(s.url) ? s.url : `https://${s.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/50 transition-colors text-xs text-foreground capitalize"
                >
                  <SocialIcon platform={s.platform} />
                  {s.platform === 'other' ? s.url.replace(/^https?:\/\//, '').split('/')[0] : s.platform}
                </a>
              ))}
            </div>
          )}

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
        ) : isSuspended && !isOwnProfile && !canModerate ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Shield className="h-10 w-10 text-orange-400" />
            <p className="font-bold text-foreground text-lg">Account Suspended</p>
            <p className="text-sm text-center max-w-xs">
              This account has been suspended and is not accessible.
            </p>
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
