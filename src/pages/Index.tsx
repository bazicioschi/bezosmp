import { useState } from 'react';
import { Header } from '@/components/Header';
import { ServerInfo } from '@/components/ServerInfo';
import { Feed } from '@/components/Feed';
import { NewsFeed } from '@/components/NewsFeed';

type TabType = 'feed' | 'news';

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content - X.com Layout */}
      <main className="max-w-[1300px] mx-auto flex">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:block w-[275px] shrink-0 p-4">
          <div className="sticky top-20">
            <ServerInfo />
          </div>
        </aside>

        {/* Main Feed */}
        <div className="flex-1 border-x border-border min-h-screen max-w-[600px]">
          {/* Tab Navigation - X.com Style */}
          <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-4 text-center font-medium transition-colors relative hover:bg-secondary/50 ${
                  activeTab === 'feed' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span className="font-display text-sm tracking-wide">For you</span>
                {activeTab === 'feed' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`flex-1 py-4 text-center font-medium transition-colors relative hover:bg-secondary/50 ${
                  activeTab === 'news' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span className="font-display text-sm tracking-wide">News</span>
                {activeTab === 'news' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'feed' && <Feed />}
            {activeTab === 'news' && <NewsFeed />}
          </div>
        </div>

        {/* Right Sidebar - Desktop */}
        <aside className="hidden xl:block w-[350px] shrink-0 p-4">
          <div className="sticky top-20 space-y-4">
            {/* About Card */}
            <div className="bg-secondary/30 rounded-2xl p-4">
              <h3 className="font-display font-bold text-foreground mb-2 text-lg">About bezoSMP</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A friendly Minecraft Bedrock survival server. Join us for building, exploring, and making new friends!
              </p>
            </div>

            {/* Mobile Server Info */}
            <div className="lg:hidden">
              <ServerInfo />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}