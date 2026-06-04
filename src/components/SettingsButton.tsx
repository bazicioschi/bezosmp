import { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Sun, Moon, Bug, Rat, Pizza, Ghost, Flower, Palette, User, Bell } from 'lucide-react';
import { useNotificationPrefs, NOTIF_CATEGORY_LABELS, type NotifCategory } from '@/hooks/useNotificationPrefs';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const { playClick } = useSoundEffects();
  const { theme, setTheme, setCustomColor, isDark, isLight, isBaziMazi, isCato, isPizza, isGhast, isBuzzy, isCustom } = useTheme();
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const { isEnabled, setEnabled } = useSoundEffects();
  const { prefs: notifPrefs, setPref: setNotifPref } = useNotificationPrefs();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColorState] = useState(() => {
    const stored = localStorage.getItem('mc-custom-theme');
    return stored ? JSON.parse(stored).primary : '#e63946';
  });
  const [customBgColor, setCustomBgColor] = useState(() => {
    const stored = localStorage.getItem('mc-custom-theme');
    return stored ? JSON.parse(stored).background || '#0d0d0d' : '#0d0d0d';
  });
  const [customTextColor, setCustomTextColor] = useState(() => {
    const stored = localStorage.getItem('mc-custom-theme');
    return stored ? JSON.parse(stored).text || '#ededed' : '#ededed';
  });
  const [customMode, setCustomMode] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('mc-custom-theme');
    return stored ? JSON.parse(stored).mode : 'dark';
  });

  useEffect(() => {
    setSoundsEnabled(isEnabled());
    if (user) {
      supabase.from('profiles').select('avatar_url, username').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setAvatarUrl(data.avatar_url);
            setUsername(data.username);
          }
        });
    }
  }, [user]);

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
    if (isCustom) return <Palette className="h-4 w-4 text-primary" />;
    if (isDark) return <Moon className="h-4 w-4 text-primary" />;
    if (isBaziMazi) return <Bug className="h-4 w-4 text-primary" />;
    if (isCato) return <Rat className="h-4 w-4 text-primary" />;
    if (isPizza) return <Pizza className="h-4 w-4 text-primary" />;
    if (isGhast) return <Ghost className="h-4 w-4 text-primary" />;
    if (isBuzzy) return <Flower className="h-4 w-4 text-primary" />;
    return <Sun className="h-4 w-4 text-primary" />;
  };

  const getThemeName = () => {
    if (isCustom) return 'Custom Color';
    if (isDark) return 'Red & Black (Minecraft)';
    if (isBaziMazi) return 'BaziMazi (Ladybug)';
    if (isCato) return 'Rat';
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
        className="w-80 p-0 minecraft-card overflow-hidden max-h-[80vh] overflow-y-auto" 
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

          {/* Notification Preferences */}
          <div className="space-y-2 border-t-2 border-border pt-3">
            <div className="flex items-center gap-3">
              <div className="mc-slot h-9 w-9 flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="mc-text text-sm text-foreground">NOTIFICATIONS</p>
                <p className="text-xs text-muted-foreground">Pick what alerts you</p>
              </div>
            </div>
            <div className="space-y-1.5 pl-1">
              {(Object.keys(NOTIF_CATEGORY_LABELS) as NotifCategory[]).map((cat) => (
                <div key={cat} className="flex items-center justify-between gap-2 py-1">
                  <span className="text-xs text-foreground">{NOTIF_CATEGORY_LABELS[cat]}</span>
                  <Switch
                    checked={notifPrefs[cat]}
                    onCheckedChange={(v) => { setNotifPref(cat, v); playClick(); }}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </div>
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
                  isDark ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span className="text-xs mc-text">Dark</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('ghast')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isGhast ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Ghost className="h-4 w-4" />
                <span className="text-xs mc-text">Ghast</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isLight ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span className="text-xs mc-text">Clean</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('bazimazi')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isBaziMazi ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Bug className="h-4 w-4" />
                <span className="text-xs mc-text">Bazi</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('cato')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isCato ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Rat className="h-4 w-4" />
                <span className="text-xs mc-text">Rat</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('pizza')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isPizza ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Pizza className="h-4 w-4" />
                <span className="text-xs mc-text">Pizza</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('buzzy')}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isBuzzy ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Flower className="h-4 w-4" />
                <span className="text-xs mc-text">Buzzy</span>
              </button>
              
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  isCustom ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Palette className="h-4 w-4" />
                <span className="text-xs mc-text">Custom</span>
              </button>
            </div>

            {/* Custom Color Picker */}
            {showColorPicker && (
              <div className="ml-12 space-y-3 p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {username?.slice(0, 2).toUpperCase() || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <Palette className="h-4 w-4 text-primary" />
                  <p className="mc-text text-xs text-foreground">CUSTOM THEME</p>
                </div>
                
                {/* Accent Color */}
                <div>
                  <p className="text-[10px] text-muted-foreground mc-text mb-1">ACCENT COLOR</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColorState(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-2 border-border bg-transparent"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">{customColor.toUpperCase()}</p>
                      <div className="h-3 rounded-full" style={{ backgroundColor: customColor }} />
                    </div>
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <p className="text-[10px] text-muted-foreground mc-text mb-1">BACKGROUND COLOR</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-2 border-border bg-transparent"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">{customBgColor.toUpperCase()}</p>
                      <div className="h-3 rounded-full" style={{ backgroundColor: customBgColor }} />
                    </div>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <p className="text-[10px] text-muted-foreground mc-text mb-1">TEXT COLOR</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customTextColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-2 border-border bg-transparent"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">{customTextColor.toUpperCase()}</p>
                      <div className="h-3 rounded-full" style={{ backgroundColor: customTextColor }} />
                    </div>
                  </div>
                </div>

                {/* Quick preset colors */}
                <div>
                  <p className="text-[10px] text-muted-foreground mc-text mb-1">QUICK PRESETS</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#264653', '#6a0572', '#ff006e', '#00b4d8', '#80b918'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setCustomColorState(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                          customColor === color ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    playClick();
                    setCustomColor(customColor, customMode, customBgColor, customTextColor);
                    setShowColorPicker(false);
                  }}
                  className="w-full py-1.5 rounded border border-primary bg-primary/20 hover:bg-primary/30 text-foreground mc-text text-xs transition-all"
                >
                  APPLY COLOR
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mc-text">
              bezoSMP 2.7
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}