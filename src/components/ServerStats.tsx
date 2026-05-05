import { useState, useEffect } from 'react';
import { Users, MessageSquare, Heart, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Stats { users: number; posts: number; likes: number; }

type Panel = 'users' | 'posts' | 'likes' | null;

interface UserRow { user_id: string; username: string; avatar_url: string | null; created_at: string; }
interface PostRow { id: string; content: string; created_at: string; author: string; author_avatar: string | null; author_id: string; likes: number; }

export function ServerStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ users: 0, posts: 0, likes: 0 });
  const [animatedStats, setAnimatedStats] = useState<Stats>({ users: 0, posts: 0, likes: 0 });
  const [panel, setPanel] = useState<Panel>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('stats-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, fetchStats)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, fetchStats)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, fetchStats)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'likes' }, fetchStats)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const easeOut = 1 - Math.pow(1 - step / steps, 3);
      setAnimatedStats({
        users: Math.floor(stats.users * easeOut),
        posts: Math.floor(stats.posts * easeOut),
        likes: Math.floor(stats.likes * easeOut),
      });
      if (step >= steps) { clearInterval(timer); setAnimatedStats(stats); }
    }, interval);
    return () => clearInterval(timer);
  }, [stats]);

  const fetchStats = async () => {
    const [{ count: usersCount }, { count: postsCount }, { count: likesCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
    ]);
    setStats({ users: usersCount || 0, posts: postsCount || 0, likes: likesCount || 0 });
  };

  const openPanel = async (p: Panel) => {
    setPanel(p);
    setLoading(true);

    if (p === 'users') {
      const { data } = await supabase.from('profiles').select('user_id, username, avatar_url, created_at').order('created_at', { ascending: false });
      setUsers((data ?? []) as UserRow[]);
    }

    if (p === 'posts' || p === 'likes') {
      // Fetch posts with author profiles
      const { data: postsData } = await supabase.from('posts').select('id, content, created_at, user_id').order('created_at', { ascending: false }).limit(100);
      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(p => p.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', authorIds);
        const profMap: Record<string, { username: string; avatar_url: string | null }> = {};
        profiles?.forEach(pr => { profMap[pr.user_id] = pr; });

        // Count actual likes per post from likes table
        const { data: likesData } = await supabase.from('likes').select('post_id').in('post_id', postsData.map(p => p.id));
        const likeMap: Record<string, number> = {};
        likesData?.forEach(l => { likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1; });

        const rows: PostRow[] = postsData.map(p => ({
          id: p.id,
          content: p.content,
          created_at: p.created_at,
          author: profMap[p.user_id]?.username ?? 'Unknown',
          author_avatar: profMap[p.user_id]?.avatar_url ?? null,
          author_id: p.user_id,
          likes: likeMap[p.id] || 0,
        }));

        if (p === 'likes') {
          rows.sort((a, b) => b.likes - a.likes);
        }
        setPosts(rows);
      } else {
        setPosts([]);
      }
    }

    setLoading(false);
  };

  const statItems = [
    { icon: Users, label: 'USERS', value: animatedStats.users, panel: 'users' as Panel },
    { icon: MessageSquare, label: 'POSTS', value: animatedStats.posts, panel: 'posts' as Panel },
    { icon: Heart, label: 'LIKES', value: animatedStats.likes, panel: 'likes' as Panel },
  ];

  const panelTitle = panel === 'users' ? 'All Members' : panel === 'posts' ? 'Post Wiki' : 'Most Liked Posts';

  return (
    <>
      <div className="minecraft-card p-4">
        <div className="h-1 bg-primary redstone-glow mb-4 -mt-4 -mx-4" />
        <div className="flex items-center gap-2 mb-4">
          <div className="mc-slot h-8 w-8 flex items-center justify-center animate-pulse">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h3 className="mc-text text-lg text-foreground glow-text">BEZO STATS</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {statItems.map(({ icon: Icon, label, value, panel: p }) => (
            <button
              key={label}
              onClick={() => openPanel(p)}
              className="mc-slot p-3 text-center hover:mc-slot-active transition-all cursor-pointer w-full"
            >
              <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="mc-text text-lg text-foreground glow-text">{value}</p>
              <p className="text-xs text-muted-foreground mc-text">{label}</p>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={panel !== null} onOpenChange={(open) => { if (!open) setPanel(null); }}>
        <DialogContent className="minecraft-card minecraft-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="mc-text text-xl glow-text">{panelTitle}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            {loading && <p className="text-center text-muted-foreground mc-text py-8">Loading...</p>}

            {/* USERS panel */}
            {!loading && panel === 'users' && (
              <div className="space-y-2">
                {users.length === 0 && <p className="text-muted-foreground mc-text text-sm text-center py-4">No members yet.</p>}
                {users.map((u, i) => (
                  <button
                    key={u.user_id}
                    onClick={() => { setPanel(null); navigate(`/user/${u.user_id}`); }}
                    className="mc-slot hover:mc-slot-active w-full flex items-center gap-3 p-2.5 transition-all text-left"
                  >
                    <span className="text-xs text-muted-foreground mc-text w-5 text-right shrink-0">#{i + 1}</span>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={u.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs mc-text">{u.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="mc-text text-sm text-foreground truncate">{u.username}</p>
                      <p className="text-xs text-muted-foreground">Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* POSTS panel */}
            {!loading && panel === 'posts' && (
              <div className="space-y-2">
                {posts.length === 0 && <p className="text-muted-foreground mc-text text-sm text-center py-4">No posts yet.</p>}
                {posts.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => { setPanel(null); navigate(`/user/${p.author_id}`); }}
                    className="mc-slot hover:mc-slot-active w-full flex items-start gap-3 p-2.5 transition-all text-left"
                  >
                    <span className="text-xs text-muted-foreground mc-text w-5 text-right shrink-0 mt-1">#{i + 1}</span>
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <AvatarImage src={p.author_avatar || undefined} style={{ imageRendering: 'pixelated' }} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs mc-text">{p.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="mc-text text-xs text-primary">{p.author}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2 leading-snug mt-0.5">{p.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">❤️ {p.likes} likes</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* LIKES panel */}
            {!loading && panel === 'likes' && (
              <div className="space-y-2">
                {posts.length === 0 && <p className="text-muted-foreground mc-text text-sm text-center py-4">No liked posts yet.</p>}
                {posts.filter(p => p.likes > 0).map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => { setPanel(null); navigate(`/user/${p.author_id}`); }}
                    className="mc-slot hover:mc-slot-active w-full flex items-start gap-3 p-2.5 transition-all text-left"
                  >
                    <span className={`text-sm mc-text w-5 text-right shrink-0 mt-1 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      #{i + 1}
                    </span>
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <AvatarImage src={p.author_avatar || undefined} style={{ imageRendering: 'pixelated' }} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs mc-text">{p.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="mc-text text-xs text-primary">{p.author}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2 leading-snug mt-0.5">{p.content}</p>
                      <p className="text-xs text-primary mc-text mt-1 font-bold">❤️ {p.likes} likes</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
