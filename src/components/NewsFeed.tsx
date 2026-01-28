import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { CreateNews } from './CreateNews';
import { NewsCard } from './NewsCard';

interface NewsItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

export function NewsFeed() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    // Fetch news
    const { data: newsData } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (!newsData) {
      setLoading(false);
      return;
    }

    // Fetch profiles for authors
    const userIds = [...new Set(newsData.map(n => n.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    const enrichedNews: NewsItem[] = newsData.map(item => {
      const profile = profilesMap.get(item.user_id);
      return {
        ...item,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
      };
    });

    setNews(enrichedNews);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('news-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        () => fetchNews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = (newsId: string) => {
    setNews(news.filter(n => n.id !== newsId));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="minecraft-card minecraft-border p-6 animate-pulse">
            <div className="h-6 bg-secondary rounded w-1/3 mb-4" />
            <div className="h-4 bg-secondary rounded w-full mb-2" />
            <div className="h-4 bg-secondary rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreateNews onNewsCreated={fetchNews} />

      {news.length === 0 ? (
        <div className="minecraft-card minecraft-border p-8 text-center">
          <p className="text-muted-foreground">No news yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map(item => (
            <NewsCard
              key={item.id}
              id={item.id}
              title={item.title}
              content={item.content}
              imageUrl={item.image_url}
              createdAt={item.created_at}
              userId={item.user_id}
              username={item.username}
              avatarUrl={item.avatar_url}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
