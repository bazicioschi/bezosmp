import { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Sun, Moon, Bug, Rat, Pizza, Ghost, Flower, Sparkles, Sword, Pickaxe, Shield, BookOpen, Gem, Citrus } from 'lucide-react';
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
  const { theme, setTheme, isDark, isLight, isBaziMazi, isCato, isPizza, isGhast, isBuzzy, isOrange } = useTheme();
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
    if (isOrange) return <Citrus className="h-4 w-4 text-primary" />;
    return <Sun className="h-4 w-4 text-primary" />;
  };

  const getThemeName = () => {
    if (isDark) return 'Red & Black (Minecraft)';
    if (isBaziMazi) return 'BaziMazi (Ladybug)';
    if (isCato) return 'Cato (Rat)';
    if (isPizza) return 'Pizza (Green)';
    if (isGhast) return 'Ghast (Minecraft)';
    if (isBuzzy) return 'Buzzy (Bee)';
    if (isOrange) return 'Orange (Citrus)';
    return 'Red & White (Clean)';
  };

const enchantGlyphs = 'ᔑʖᓵ↸ᒷ⎓⊣⍑╎⋮ꖌꖎᒲリ𝙹ᑑ∷ᓭℸ⚍⊬∴';

const enchantItems = [
  { id: 'sword', icon: Sword, label: 'Sword' },
  { id: 'pickaxe', icon: Pickaxe, label: 'Pick' },
  { id: 'shield', icon: Shield, label: 'Shield' },
  { id: 'book', icon: BookOpen, label: 'Book' },
];

const enchantOptions: Record<string, string[]> = {
  sword: ['Sharpness V', 'Fire Aspect II', 'Looting III'],
  pickaxe: ['Fortune III', 'Efficiency V', 'Silk Touch'],
  shield: ['Unbreaking III', 'Mending', 'Thorns III'],
  book: ['Mending', 'Infinity', 'Protection IV'],
};

function SettingsEnchantTable({ onThemeChange }: { onThemeChange: (t: ThemeMode) => void }) {
  const [item, setItem] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ text: string; cost: number }[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  // Map enchantment slots to themes
  const slotThemes: Record<string, ThemeMode[]> = {
    sword: ['dark', 'ghast', 'pizza'],
    pickaxe: ['light', 'bazimazi', 'cato'],
    shield: ['buzzy', 'dark', 'ghast'],
    book: ['bazimazi', 'pizza', 'buzzy'],
  };

  const generateSlots = (itemId: string) => {
    setItem(itemId);
    setIsRolling(true);
    setSlots([]);

    let count = 0;
    const interval = setInterval(() => {
      setSlots(
        [1, 2, 3].map(() => ({
          text: Array.from({ length: 12 }, () =>
            enchantGlyphs[Math.floor(Math.random() * enchantGlyphs.length)]
          ).join(''),
          cost: Math.floor(Math.random() * 28) + 2,
        }))
      );
      count++;
      if (count > 6) {
        clearInterval(interval);
        const opts = enchantOptions[itemId];
        setSlots(
          opts.map((name, i) => ({
            text: name,
            cost: (i + 1) * 10,
          }))
        );
        setIsRolling(false);
      }
    }, 100);
  };

  const handleSlotClick = (index: number) => {
    if (isRolling || !item) return;
    const themes = slotThemes[item];
    if (themes && themes[index]) {
      onThemeChange(themes[index]);
    }
  };

  return (
    <div className="pt-3 border-t border-border space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="mc-text text-sm text-foreground">ENCHANT</p>
      </div>

      {/* Item row */}
      <div className="flex gap-1.5">
        {enchantItems.map((ei) => {
          const Icon = ei.icon;
          return (
            <button
              key={ei.id}
              onClick={() => generateSlots(ei.id)}
              disabled={isRolling}
              className={`mc-slot flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-all ${
                item === ei.id ? 'ring-1 ring-primary bg-primary/10' : 'hover:bg-secondary/50'
              }`}
            >
              <Icon className={`h-4 w-4 ${item === ei.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`mc-text text-[9px] ${item === ei.id ? 'text-primary' : 'text-muted-foreground/70'}`}>
                {ei.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Enchantment slots - Minecraft style */}
      {slots.length > 0 && (
        <div className="space-y-1">
          {slots.map((slot, i) => (
            <button
              key={i}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded border transition-all ${
                isRolling
                  ? 'border-border bg-secondary/20'
                  : i === 2
                    ? 'border-primary/50 bg-primary/10 hover:bg-primary/20'
                    : 'border-border bg-secondary/30 hover:bg-secondary/50'
              }`}
              disabled={isRolling}
              onClick={() => handleSlotClick(i)}
            >
              <div className="flex items-center gap-2">
                <span className={`mc-text text-[10px] ${i === 2 ? 'text-primary' : 'text-chart-4'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={`text-xs ${isRolling ? 'font-mono tracking-widest text-primary/60 animate-pulse' : 'mc-text text-foreground/80'}`}>
                  {slot.text}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Gem className={`h-3 w-3 ${i === 2 ? 'text-primary' : 'text-chart-4'}`} />
                <span className={`mc-text text-xs ${i === 2 ? 'text-primary' : 'text-chart-4'}`}>
                  {slot.cost}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!item && (
        <p className="text-[10px] text-muted-foreground/50 mc-text text-center py-1">
          Select an item to enchant
        </p>
      )}
    </div>
  );
}

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
              
              <button
                onClick={() => handleThemeChange('orange')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isOrange 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Citrus className="h-4 w-4" />
                <span className="text-xs mc-text">Orange</span>
              </button>
            </div>
          </div>

          {/* Enchantment Table Mini */}
          <SettingsEnchantTable onThemeChange={handleThemeChange} />

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mc-text">
              bezoSMP 1.24
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
