import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Globe, ExternalLink, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
  category: string;
}

const CATEGORIES = ['All', 'Hot News', 'World', 'Technology', 'Sports', 'MC Bedrock', 'MC Java'];

export function InternationalNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('fetch-international-news');
        if (fnError) throw fnError;
        if (data?.success) {
          setNews(data.data);
        } else {
          throw new Error(data?.error || 'Failed to fetch news');
        }
      } catch (e: any) {
        console.error('Error fetching international news:', e);
        setError(e.message || 'Could not load news');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const filtered = activeCategory === 'All' ? news : news.filter(n => n.category === activeCategory);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="minecraft-card minecraft-border p-4 animate-pulse">
            <div className="h-5 bg-secondary rounded w-2/3 mb-3" />
            <div className="h-3 bg-secondary rounded w-full mb-2" />
            <div className="h-3 bg-secondary rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="minecraft-card minecraft-border p-6 text-center">
          <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground mc-text">Could not load international news</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Category Filter - Settings toggle style */}
      <div className="minecraft-card minecraft-border p-3 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="mc-slot h-7 w-7 flex items-center justify-center">
            <Filter className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="mc-text text-sm text-foreground">FILTER</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center justify-between px-2.5 py-2 rounded border transition-all ${
                activeCategory === cat
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border bg-secondary/20 hover:bg-secondary/40'
              }`}
            >
              <span className={`mc-text text-[10px] ${activeCategory === cat ? 'text-primary' : 'text-muted-foreground'}`}>
                {cat.toUpperCase()}
              </span>
              <div className={`h-2 w-2 rounded-full ${activeCategory === cat ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      {filtered.length === 0 ? (
        <div className="minecraft-card minecraft-border p-6 text-center">
          <p className="text-muted-foreground mc-text">No news in this category</p>
        </div>
      ) : (
        filtered.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block minecraft-card minecraft-border p-4 hover:bg-secondary/30 transition-colors group"
          >
            <div className="flex gap-3">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-20 h-20 object-cover rounded shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="mc-text text-sm text-foreground leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="mc-text text-primary/70">{item.source}</span>
                  <span className="mc-slot px-1.5 py-0.5 text-[9px]">{item.category}</span>
                  {item.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                    </span>
                  )}
                  <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </a>
        ))
      )}
    </div>
  );
}
