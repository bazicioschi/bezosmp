import { useState } from 'react';
import { Trophy, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSoundEffects } from '@/hooks/useSoundEffects';

const CHALLENGES = [
  { id: 1, task: 'Like 3 posts', target: 3, xp: 10 },
  { id: 2, task: 'Comment on a post', target: 1, xp: 15 },
  { id: 3, task: 'Share your build', target: 1, xp: 25 },
];

export function DailyChallenge() {
  const { playPop, playClick } = useSoundEffects();
  const [progress, setProgress] = useState<Record<number, number>>({
    1: 2,
    2: 0,
    3: 0,
  });

  const handleClaim = (id: number, xp: number) => {
    playPop();
    // Would integrate with actual XP system
  };

  return (
    <div className="minecraft-card p-4 minecraft-card-shine">
      <div className="h-1 bg-primary redstone-glow mb-4 -mt-4 -mx-4" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="mc-slot h-8 w-8 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-primary animate-bounce" />
        </div>
        <div>
          <h3 className="mc-text text-lg text-foreground glow-text">DAILY CHALLENGES</h3>
          <p className="text-xs text-muted-foreground">Resets in 14h 32m</p>
        </div>
      </div>

      <div className="space-y-3">
        {CHALLENGES.map((challenge) => {
          const currentProgress = progress[challenge.id] || 0;
          const isComplete = currentProgress >= challenge.target;
          const percentage = Math.min((currentProgress / challenge.target) * 100, 100);

          return (
            <div 
              key={challenge.id} 
              className={`p-3 rounded-lg border-2 transition-all ${
                isComplete 
                  ? 'border-primary/50 bg-primary/10' 
                  : 'border-border bg-secondary/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Star className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${isComplete ? 'text-primary line-through' : 'text-foreground'}`}>
                    {challenge.task}
                  </span>
                </div>
                <span className="mc-text text-xs text-primary">+{challenge.xp} XP</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground mc-text">
                  {currentProgress}/{challenge.target}
                </span>
              </div>

              {isComplete && (
                <Button
                  size="sm"
                  onClick={() => handleClaim(challenge.id, challenge.xp)}
                  className="w-full mt-2 mc-btn-primary h-7"
                >
                  <span className="mc-text text-xs">CLAIM REWARD</span>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
