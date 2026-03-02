import { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Sun, Moon, Bug, Rat, Pizza, Ghost, Flower } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTheme, ThemeMode } from '@/hooks/useTheme';

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const { playClick, isEnabled, setEnabled } = useSoundEffects();
  const { theme, setTheme, isDark, isLight, isBaziMazi, isCato, isPizza, isGhast, isBuzzy } = useTheme();
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

  const handleThemeChange = (newTheme: ThemeMode) => {
    playClick();
    setTheme(newTheme);
  };

  const getThemeIcon = () => {
    if (isDark) return <Moon className="h-4 w-4 text-primary" />;
    if (isBaziMazi) return <Bug className="h-4 w-4 text-primary" />;
    if (isCato) return <Rat className="h-4 w-4 text-primary" />;
    if (isPizza) return <Pizza className="h-4 w-4 text-primary" />;
    if (isGhast) return <Ghost className="h-4 w-4 text-primary" />;
    if (isBuzzy) return <Flower className="h-4 w-4 text-primary" />;
    return <Sun className="h-4 w-4 text-primary" />;
  };

  const getThemeName = () => {
    if (isDark) return 'Red & Black (Minecraft)';
    if (isBaziMazi) return 'BaziMazi (Ladybug)';
    if (isCato) return 'Cato (Rat)';
    if (isPizza) return 'Pizza (Green)';
    if (isGhast) return 'Ghast (Minecraft)';
    if (isBuzzy) return 'Buzzy (Bee)';
    return 'Red & White (Clean)';
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
        className="w-80 p-0 minecraft-card overflow-hidden" 
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

          {/* Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="mc-slot h-9 w-9 flex items-center justify-center">
                {getThemeIcon()}
              </div>
              <div>
                <p className="mc-text text-sm text-foreground">THEME</p>
                <p className="text-xs text-muted-foreground">{getThemeName()}</p>
              </div>
            </div>
            
            {/* Theme Options */}
            <div className="grid grid-cols-3 gap-2 pl-12">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isDark 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span className="text-xs mc-text">MC</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('ghast')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isGhast 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Ghost className="h-4 w-4" />
                <span className="text-xs mc-text">Ghast</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isLight 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span className="text-xs mc-text">Clean</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('bazimazi')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isBaziMazi 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Bug className="h-4 w-4" />
                <span className="text-xs mc-text">Bazi</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('cato')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isCato 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Rat className="h-4 w-4" />
                <span className="text-xs mc-text">Cato</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('pizza')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isPizza 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Pizza className="h-4 w-4" />
                <span className="text-xs mc-text">Pizza</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('buzzy')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isBuzzy 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Flower className="h-4 w-4" />
                <span className="text-xs mc-text">Buzzy</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mc-text">
              bezoSMP 1.16
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
