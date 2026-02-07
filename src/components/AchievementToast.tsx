import { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';

interface AchievementToastProps {
  title: string;
  description: string;
  icon?: string;
  onClose?: () => void;
  autoClose?: boolean;
}

export function AchievementToast({ 
  title, 
  description, 
  icon = '🏆',
  onClose,
  autoClose = true 
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { playNotification } = useSoundEffects();

  useEffect(() => {
    // Enter animation
    setTimeout(() => setIsVisible(true), 50);
    playNotification();

    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <div
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        isVisible && !isLeaving ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
    >
      <div className="minecraft-card minecraft-card-shine p-4 min-w-[300px] max-w-[400px]">
        <div className="h-1 bg-primary redstone-glow mb-3 -mt-4 -mx-4 animate-pulse" />
        
        <div className="flex items-start gap-3">
          <div className="mc-slot h-12 w-12 flex items-center justify-center text-2xl animate-bounce shrink-0">
            {icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="mc-text text-xs text-primary">ACHIEVEMENT UNLOCKED!</span>
            </div>
            <h4 className="mc-text text-lg text-foreground glow-text mt-1">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for showing achievements
export function useAchievement() {
  const [achievement, setAchievement] = useState<{
    title: string;
    description: string;
    icon?: string;
  } | null>(null);

  const showAchievement = (title: string, description: string, icon?: string) => {
    setAchievement({ title, description, icon });
  };

  const hideAchievement = () => {
    setAchievement(null);
  };

  return { achievement, showAchievement, hideAchievement };
}
