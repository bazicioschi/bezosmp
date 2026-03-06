import { useState } from 'react';
import { Header } from '@/components/Header';
import { ServerInfo } from '@/components/ServerInfo';
import { Feed } from '@/components/Feed';
import { NewsFeed } from '@/components/NewsFeed';
import { InternationalNews } from '@/components/InternationalNews';
import { MinecraftParticles } from '@/components/MinecraftParticles';
import { TrendingSection } from '@/components/TrendingSection';
import { WelcomeBanner } from '@/components/WelcomeBanner';
import { BackToTop } from '@/components/BackToTop';
import { WhoToFollow } from '@/components/WhoToFollow';
import { ServerStats } from '@/components/ServerStats';
import { DailyChallenge } from '@/components/DailyChallenge';
import { EnchantmentWidget } from '@/components/EnchantmentWidget';
import { Footer } from '@/components/Footer';
import { Weather } from '@/components/Weather';

type TabType = 'feed' | 'news' | 'international' | 'weather';

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  return (
    <div className="min-h-screen bg-background mc-bedrock">
      <MinecraftParticles />
      <Header />
      
      {/* Main Content */}
      <main className="max-w-[1300px] mx-auto flex relative z-10">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-[280px] shrink-0 p-4">
          <div className="sticky top-20 space-y-4">
            <ServerInfo />
            <TrendingSection />
            <ServerStats />
          </div>
        </aside>

        {/* Main Feed */}
        <div className="flex-1 border-x-2 border-border min-h-screen max-w-[600px]">
          {/* Tab Navigation - Minecraft Style */}
          <div className="sticky top-14 z-40 bg-card/95 backdrop-blur-sm border-b-2 border-border">
            <div className="flex">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-3 text-center transition-colors relative ${
                  activeTab === 'feed' 
                    ? 'bg-secondary/50' 
                    : 'hover:bg-secondary/30'
                }`}
              >
                <span className="mc-text text-lg tracking-wider">
                  {activeTab === 'feed' ? '> FOR YOU <' : 'FOR YOU'}
                </span>
                {activeTab === 'feed' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary redstone-glow" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`flex-1 py-3 text-center transition-colors relative ${
                  activeTab === 'news' 
                    ? 'bg-secondary/50' 
                    : 'hover:bg-secondary/30'
                }`}
              >
                <span className="mc-text text-lg tracking-wider">
                  {activeTab === 'news' ? '> BZ NEWS <' : 'BZ NEWS'}
                </span>
                {activeTab === 'news' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary redstone-glow" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('international')}
                className={`flex-1 py-3 text-center transition-colors relative ${
                  activeTab === 'international' 
                    ? 'bg-secondary/50' 
                    : 'hover:bg-secondary/30'
                }`}
              >
                <span className="mc-text text-sm tracking-wider">
                  {activeTab === 'international' ? '> WORLD NEWS <' : 'WORLD NEWS'}
                </span>
                {activeTab === 'international' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary redstone-glow" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('weather')}
                className={`flex-1 py-3 text-center transition-colors relative ${
                  activeTab === 'weather' 
                    ? 'bg-secondary/50' 
                    : 'hover:bg-secondary/30'
                }`}
              >
                <span className="mc-text text-sm tracking-wider">
                  {activeTab === 'weather' ? '> WEATHER <' : 'WEATHER'}
                </span>
                {activeTab === 'weather' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary redstone-glow" />
                )}
              </button>
            </div>
          </div>

          {/* Welcome Banner */}
          <div className="p-4 pb-0">
            <WelcomeBanner />
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'feed' && <Feed />}
            {activeTab === 'news' && <NewsFeed />}
            {activeTab === 'international' && <InternationalNews />}
            {activeTab === 'weather' && <Weather />}
          </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-[350px] shrink-0 p-4">
          <div className="sticky top-20 space-y-4">
            {/* About Card */}
            <div className="minecraft-card minecraft-card-shine p-4">
              <h3 className="mc-text text-xl text-primary mb-2 glow-text">ABOUT BEZOSMP</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A friendly Minecraft Bedrock survival server. Join us for building, exploring, and making new friends!
              </p>
              <div className="mt-3 flex gap-2">
                <div className="mc-slot px-2 py-1 text-xs text-center">
                  <span className="text-primary mc-text">⚔️ PVP</span>
                </div>
                <div className="mc-slot px-2 py-1 text-xs text-center">
                  <span className="text-primary mc-text">🏠 SMP</span>
                </div>
                <div className="mc-slot px-2 py-1 text-xs text-center">
                  <span className="text-primary mc-text">⛏️ BUILD</span>
                </div>
              </div>
            </div>

            {/* Who to Follow */}
            <WhoToFollow />

            {/* Daily Challenge */}
            <DailyChallenge />

            {/* Enchantment Widget */}
            <EnchantmentWidget />

            {/* Daily Tip */}
            <div className="minecraft-card p-4">
              <h3 className="mc-text text-lg text-primary mb-2 glow-text">💡 DAILY TIP</h3>
              <p className="text-sm text-muted-foreground">
                Hold shift while crafting to craft the maximum amount instantly!
              </p>
            </div>
          </div>
        </aside>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
