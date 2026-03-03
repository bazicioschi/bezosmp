const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
  category: string;
}

async function fetchRSSFeed(url: string, source: string, category: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const text = await response.text();

    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/)?.[1] || itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const mediaContent = itemXml.match(/<media:content[^>]*url="([^"]*)"/) || itemXml.match(/<enclosure[^>]*url="([^"]*)"/);
      const imageUrl = mediaContent?.[1] || null;

      if (title) {
        items.push({
          title: title.replace(/<[^>]*>/g, '').trim(),
          description: description.replace(/<[^>]*>/g, '').substring(0, 200).trim(),
          url: link.trim(),
          source,
          publishedAt: pubDate,
          imageUrl,
          category,
        });
      }
    }

    return items.slice(0, 10);
  } catch (e) {
    console.error(`Error fetching ${source}:`, e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const feeds = [
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NY Times', category: 'World' },
      { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC News', category: 'World' },
      { url: 'https://rss.cnn.com/rss/edition_world.rss', source: 'CNN', category: 'World' },
      { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC Tech', category: 'Technology' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', source: 'NY Times Tech', category: 'Technology' },
      { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', category: 'Sports' },
    ];

    const results = await Promise.all(
      feeds.map(f => fetchRSSFeed(f.url, f.source, f.category))
    );

    const allNews = results.flat().sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime() || 0;
      const dateB = new Date(b.publishedAt).getTime() || 0;
      return dateB - dateA;
    });

    return new Response(
      JSON.stringify({ success: true, data: allNews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch news' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
