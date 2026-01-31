import { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTheme } from '@/hooks/useTheme';

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const { playClick, isEnabled, setEnabled } = useSoundEffects();
  const { theme, toggleTheme, isDark } = useTheme();
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  useEffect(() => {
    setSoundsEnabled(isEnabled());
  }, []);

  const handleSoundsToggle = (checked: boolean) => {
    setSoundsEnabled(checked);
    setEnabled(checked);
    if (checked) {
      playClick();
    }
  };

  const handleThemeToggle = () => {
    playClick();
    toggleTheme();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mc-slot hover:mc-slot-active px-3 h-8"
          onClick={() => playClick()}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0 minecraft-card overflow-hidden" 
        align="end"
      >
        <div className="h-1 bg-primary redstone-glow" />
        <div className="p-3 border-b-2 border-border">
          <h3 className="mc-text text-lg text-foreground glow-text flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            SETTINGS
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="mc-slot h-9 w-9 flex items-center justify-center">
                {soundsEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="mc-text text-sm text-foreground">SOUND EFFECTS</p>
                <p className="text-xs text-muted-foreground">Minecraft-style sounds</p>
              </div>
            </div>
            <Switch 
              checked={soundsEnabled} 
              onCheckedChange={handleSoundsToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="mc-slot h-9 w-9 flex items-center justify-center">
                {isDark ? (
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="mc-text text-sm text-foreground">THEME</p>
                <p className="text-xs text-muted-foreground">
                  {isDark ? 'Red & Black' : 'Red & White'}
                </p>
              </div>
            </div>
            <Switch 
              checked={!isDark} 
              onCheckedChange={handleThemeToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mc-text">
              bezoSMP v1.0
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
