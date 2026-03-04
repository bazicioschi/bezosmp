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
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
    });
    if (!response.ok) return [];
    const text = await response.text();

    const items: NewsItem[] = [];
    
    // Try RSS <item> format
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] || itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const description = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const mediaContent = itemXml.match(/<media:content[^>]*url="([^"]*)"/) || itemXml.match(/<enclosure[^>]*url="([^"]*)"/) || itemXml.match(/<img[^>]*src="([^"]*)"/);
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

    // Try Atom <entry> format if no items found
    if (items.length === 0) {
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      while ((match = entryRegex.exec(text)) !== null) {
        const entryXml = match[1];
        const title = entryXml.match(/<title[^>]*>(.*?)<\/title>/)?.[1] || '';
        const description = entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] || entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || '';
        const link = entryXml.match(/<link[^>]*href="([^"]*)"/)?.[1] || '';
        const pubDate = entryXml.match(/<published>(.*?)<\/published>/)?.[1] || entryXml.match(/<updated>(.*?)<\/updated>/)?.[1] || '';

        if (title) {
          items.push({
            title: title.replace(/<[^>]*>/g, '').trim(),
            description: description.replace(/<[^>]*>/g, '').substring(0, 200).trim(),
            url: link.trim(),
            source,
            publishedAt: pubDate,
            imageUrl: null,
            category,
          });
        }
      }
    }

    return items.slice(0, 10);
  } catch (e) {
    console.error(`Error fetching ${source}:`, e);
    return [];
  }
}

function getMinecraftFallbackNews(): NewsItem[] {
  return [
    { title: 'Minecraft Java Edition - Latest Snapshot Available', description: 'Check out the latest snapshot with new features, bug fixes, and experimental gameplay changes for Java Edition.', url: 'https://www.minecraft.net/en-us/article/minecraft-snapshot', source: 'Minecraft.net', publishedAt: new Date().toISOString(), imageUrl: null, category: 'MC Java' },
    { title: 'Minecraft Bedrock Edition - Latest Update', description: 'New update brings exciting features, improvements, and bug fixes to Bedrock Edition across all platforms.', url: 'https://www.minecraft.net/en-us/article/minecraft-bedrock-update', source: 'Minecraft.net', publishedAt: new Date().toISOString(), imageUrl: null, category: 'MC Bedrock' },
    { title: 'Minecraft Java - New Mob Behaviors & Biomes', description: 'Discover the latest additions to Java Edition including new mob AI behaviors and expanded biome generation.', url: 'https://www.minecraft.net/en-us', source: 'Minecraft.net', publishedAt: new Date().toISOString(), imageUrl: null, category: 'MC Java' },
    { title: 'Minecraft Bedrock - Cross-Platform Updates', description: 'Latest cross-platform improvements ensure smoother gameplay across console, mobile, and Windows editions.', url: 'https://www.minecraft.net/en-us', source: 'Minecraft.net', publishedAt: new Date().toISOString(), imageUrl: null, category: 'MC Bedrock' },
    { title: 'Minecraft Java - Redstone & Technical Changes', description: 'Technical players will love the new redstone mechanics and command block improvements in the latest Java update.', url: 'https://www.minecraft.net/en-us', source: 'Minecraft.net', publishedAt: new Date().toISOString(), imageUrl: null, category: 'MC Java' },
    { title: 'Minecraft Bedrock - Marketplace Highlights', description: 'Explore the newest community creations available on the Minecraft Marketplace for Bedrock Edition.', url: 'https://www.minecraft.net/en-us/marketplace', source: 'Minecraft.net', publishedAt: new Date().toISOString(), imageUrl: null, category: 'MC Bedrock' },
  ];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const feeds = [
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NY Times', category: 'World' },
      { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC News', category: 'World' },
      { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC Tech', category: 'Technology' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', source: 'NY Times Tech', category: 'Technology' },
      { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', category: 'Sports' },
      // Hot News - trending/breaking
      { url: 'https://feeds.bbci.co.uk/news/rss.xml', source: 'BBC Top', category: 'Hot News' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'NY Times Top', category: 'Hot News' },
      // Minecraft news
      { url: 'https://www.minecraft.net/en-us/feeds/community-content/rss', source: 'Minecraft.net', category: 'MC Bedrock' },
      { url: 'https://www.minecraft.net/en-us/feeds/community-content/rss', source: 'Minecraft.net', category: 'MC Java' },
      { url: 'https://blog.minecraft.net/en-us/feed/', source: 'Minecraft Blog', category: 'MC Java' },
      { url: 'https://feedback.minecraft.net/hc/en-us/community/posts.rss', source: 'Minecraft Feedback', category: 'MC Bedrock' },
    ];

    const results = await Promise.all(
      feeds.map(f => fetchRSSFeed(f.url, f.source, f.category))
    );

    let allNews = results.flat();
    
    // Add fallback Minecraft news if none were fetched
    const hasMCNews = allNews.some(n => n.category === 'MC Java' || n.category === 'MC Bedrock');
    if (!hasMCNews) {
      allNews = [...allNews, ...getMinecraftFallbackNews()];
    }
    
    allNews.sort((a, b) => {
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
