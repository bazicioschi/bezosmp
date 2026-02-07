import { TrendingUp, Hash } from 'lucide-react';

const trendingTopics = [
  { tag: 'NewSeason', posts: 142 },
  { tag: 'BuildBattle', posts: 89 },
  { tag: 'PVPTournament', posts: 67 },
  { tag: 'RedstoneBuilds', posts: 54 },
  { tag: 'ServerUpdates', posts: 38 },
];

export function TrendingSection() {
  return (
    <div className="minecraft-card p-4">
      <div className="h-1 bg-primary redstone-glow mb-4 -mt-4 -mx-4" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="mc-slot h-8 w-8 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <h3 className="mc-text text-lg text-foreground glow-text">TRENDING</h3>
      </div>

      <div className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <div 
            key={topic.tag}
            className="flex items-center justify-between group cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-1.5 rounded transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="mc-slot w-6 h-6 flex items-center justify-center mc-text text-xs text-primary">
                {index + 1}
              </span>
              <div>
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3 text-primary" />
                  <span className="mc-text text-sm text-foreground group-hover:text-primary transition-colors">
                    {topic.tag}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
