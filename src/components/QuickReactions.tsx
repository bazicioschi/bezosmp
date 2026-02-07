import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';

const REACTIONS = [
  { emoji: '⚔️', label: 'sword' },
  { emoji: '💎', label: 'diamond' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '💀', label: 'skull' },
  { emoji: '🎮', label: 'controller' },
];

interface QuickReactionsProps {
  postId: string;
  onReact?: (emoji: string) => void;
}

export function QuickReactions({ postId, onReact }: QuickReactionsProps) {
  const { playPop } = useSoundEffects();
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  const handleReaction = (emoji: string) => {
    playPop();
    
    if (selectedReaction === emoji) {
      setSelectedReaction(null);
      setReactionCounts(prev => ({
        ...prev,
        [emoji]: Math.max(0, (prev[emoji] || 0) - 1)
      }));
    } else {
      if (selectedReaction) {
        setReactionCounts(prev => ({
          ...prev,
          [selectedReaction]: Math.max(0, (prev[selectedReaction] || 0) - 1)
        }));
      }
      setSelectedReaction(emoji);
      setReactionCounts(prev => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1
      }));
    }
    
    onReact?.(emoji);
  };

  return (
    <div className="flex items-center gap-1">
      {REACTIONS.map(({ emoji, label }) => (
        <Button
          key={label}
          variant="ghost"
          size="sm"
          onClick={() => handleReaction(emoji)}
          className={cn(
            "h-7 px-2 text-base transition-all",
            selectedReaction === emoji 
              ? "bg-primary/20 scale-110" 
              : "hover:bg-secondary/50 hover:scale-105"
          )}
        >
          <span className={cn(
            "transition-transform",
            selectedReaction === emoji && "animate-bounce"
          )}>
            {emoji}
          </span>
          {reactionCounts[emoji] > 0 && (
            <span className="ml-1 text-xs text-muted-foreground mc-text">
              {reactionCounts[emoji]}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
