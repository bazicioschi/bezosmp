import { useState } from 'react';
import { MessageSquare, Newspaper } from 'lucide-react';
import { Header } from '@/components/Header';
import { ServerInfo } from '@/components/ServerInfo';
import { Feed } from '@/components/Feed';
import { NewsFeed } from '@/components/NewsFeed';
import { Button } from '@/components/ui/button';

type TabType = 'feed' | 'news';

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-4 glow-text tracking-wide">
              bezo<span className="text-gradient">SMP</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Join our Minecraft Bedrock community. Share updates, connect with players, and be part of the adventure.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feed */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'feed' ? 'default' : 'outline'}
                className={`minecraft-border font-display ${activeTab === 'feed' ? 'glow-border' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                FEED
              </Button>
              <Button
                variant={activeTab === 'news' ? 'default' : 'outline'}
                className={`minecraft-border font-display ${activeTab === 'news' ? 'glow-border' : ''}`}
                onClick={() => setActiveTab('news')}
              >
                <Newspaper className="h-4 w-4 mr-2" />
                NEWS
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'feed' && (
              <>
                <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Community Feed
                </h2>
                <Feed />
              </>
            )}

            {activeTab === 'news' && (
              <>
                <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Server News
                </h2>
                <NewsFeed />
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="order-1 lg:order-2 space-y-6">
            <ServerInfo />
            
            <div className="minecraft-card minecraft-border p-6">
              <h3 className="font-display font-semibold text-foreground mb-3">About</h3>
              <p className="text-sm text-muted-foreground">
                bezoSMP is a friendly Minecraft Bedrock survival server. Join us for building, exploring, and making new friends!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 bezoSMP. Built with ❤️ for the Minecraft community.</p>
        </div>
      </footer>
    </div>
  );
}
