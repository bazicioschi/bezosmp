import { useState, useEffect } from 'react';
import { Users, MessageSquare, Heart, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  users: number;
  posts: number;
  likes: number;
}

export function ServerStats() {
  const [stats, setStats] = useState<Stats>({ users: 0, posts: 0, likes: 0 });
  const [animatedStats, setAnimatedStats] = useState<Stats>({ users: 0, posts: 0, likes: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // Animate numbers
    const duration = 1500;
    const steps = 30;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        users: Math.floor(stats.users * easeOut),
        posts: Math.floor(stats.posts * easeOut),
        likes: Math.floor(stats.likes * easeOut),
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats(stats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  const fetchStats = async () => {
    const [{ count: usersCount }, { count: postsCount }, { count: likesCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      users: usersCount || 0,
      posts: postsCount || 0,
      likes: likesCount || 0,
    });
  };

  const statItems = [
    { icon: Users, label: 'USERS', value: animatedStats.users, color: 'text-primary' },
    { icon: MessageSquare, label: 'POSTS', value: animatedStats.posts, color: 'text-primary' },
    { icon: Heart, label: 'LIKES', value: animatedStats.likes, color: 'text-primary' },
  ];

  return (
    <div className="minecraft-card p-4">
      <div className="h-1 bg-primary redstone-glow mb-4 -mt-4 -mx-4" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="mc-slot h-8 w-8 flex items-center justify-center animate-pulse">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <h3 className="mc-text text-lg text-foreground glow-text">SERVER STATS</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {statItems.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="mc-slot p-3 text-center hover:mc-slot-active transition-all cursor-default">
            <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
            <p className="mc-text text-lg text-foreground glow-text">{value}</p>
            <p className="text-xs text-muted-foreground mc-text">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
