import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';

const TIPS = [
  "💡 Use #hashtags to join conversations!",
  "⚔️ Challenge others to PVP tournaments!",
  "🏆 Post your builds to get featured!",
  "🎮 Add friends to play together!",
  "💎 Share your rarest finds!",
];

export function WelcomeBanner() {
  const { user } = useAuth();
  const { playClick } = useSoundEffects();
  const [isVisible, setIsVisible] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem('welcome-banner-dismissed');
    if (dismissed) setIsVisible(false);
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setUsername(data.username);
        });
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    playClick();
    setIsVisible(false);
    localStorage.setItem('welcome-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="minecraft-card p-4 mb-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="mc-slot h-10 w-10 flex items-center justify-center animate-bounce">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="mc-text text-lg text-foreground glow-text">
              {user ? `WELCOME BACK, ${(username || 'PLAYER').toUpperCase()}!` : 'WELCOME TO BEZOSMP!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 transition-opacity duration-300">
              {TIPS[currentTip]}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tip indicators */}
      <div className="flex justify-center gap-1 mt-3">
        {TIPS.map((_, index) => (
          <div
            key={index}
            className={`h-1 w-6 rounded-full transition-colors ${
              index === currentTip ? 'bg-primary' : 'bg-secondary'
            }`}
          />
        ))}
      </div>
    </div>
  );
}