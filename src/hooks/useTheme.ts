import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'bazimazi' | 'cato' | 'pizza' | 'ghast' | 'buzzy' | 'orange' | 'custom';

export interface CustomThemeColors {
  primary: string; // hex color
  mode: 'light' | 'dark'; // base mode
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('mc-theme');
    return (stored as ThemeMode) || 'dark';
  });

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('mc-theme', newTheme);
    
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('light-mode', 'dark-mode', 'bazimazi-mode', 'cato-mode', 'pizza-mode', 'ghast-mode', 'buzzy-mode', 'orange-mode');
    
    if (newTheme === 'light') {
      // Red and White theme - clean, modern, non-Minecraft
      root.classList.add('light-mode');
      root.style.setProperty('--background', '0 0% 98%');
      root.style.setProperty('--foreground', '0 72% 45%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 72% 40%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '0 72% 40%');
      root.style.setProperty('--primary', '0 72% 51%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 96%');
      root.style.setProperty('--secondary-foreground', '0 72% 40%');
      root.style.setProperty('--muted', '0 0% 92%');
      root.style.setProperty('--muted-foreground', '0 30% 50%');
      root.style.setProperty('--accent', '0 72% 95%');
      root.style.setProperty('--accent-foreground', '0 72% 40%');
      root.style.setProperty('--border', '0 20% 88%');
      root.style.setProperty('--input', '0 0% 95%');
      root.style.setProperty('--ring', '0 72% 51%');
      root.style.setProperty('--sidebar-background', '0 0% 100%');
      root.style.setProperty('--sidebar-foreground', '0 72% 40%');
      root.style.setProperty('--sidebar-accent', '0 72% 96%');
      root.style.setProperty('--sidebar-accent-foreground', '0 72% 40%');
      root.style.setProperty('--sidebar-border', '0 20% 90%');
    } else if (newTheme === 'bazimazi') {
      // BaziMazi theme - Ladybug pattern, playful, cute
      root.classList.add('bazimazi-mode');
      root.style.setProperty('--background', '0 0% 98%');
      root.style.setProperty('--foreground', '0 0% 15%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 0% 20%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '0 0% 20%');
      root.style.setProperty('--primary', '0 72% 51%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 85% 97%');
      root.style.setProperty('--secondary-foreground', '0 72% 40%');
      root.style.setProperty('--muted', '0 0% 92%');
      root.style.setProperty('--muted-foreground', '0 0% 45%');
      root.style.setProperty('--accent', '0 72% 95%');
      root.style.setProperty('--accent-foreground', '0 72% 40%');
      root.style.setProperty('--border', '0 30% 85%');
      root.style.setProperty('--input', '0 0% 95%');
      root.style.setProperty('--ring', '0 72% 51%');
      root.style.setProperty('--sidebar-background', '0 0% 100%');
      root.style.setProperty('--sidebar-foreground', '0 0% 20%');
      root.style.setProperty('--sidebar-accent', '0 72% 96%');
      root.style.setProperty('--sidebar-accent-foreground', '0 72% 40%');
      root.style.setProperty('--sidebar-border', '0 30% 90%');
    } else if (newTheme === 'cato') {
      // Cato theme - Rat pattern, black accents instead of red
      root.classList.add('cato-mode');
      root.style.setProperty('--background', '0 0% 98%');
      root.style.setProperty('--foreground', '0 0% 10%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 0% 15%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '0 0% 15%');
      root.style.setProperty('--primary', '0 0% 10%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 96%');
      root.style.setProperty('--secondary-foreground', '0 0% 20%');
      root.style.setProperty('--muted', '0 0% 92%');
      root.style.setProperty('--muted-foreground', '0 0% 45%');
      root.style.setProperty('--accent', '0 0% 90%');
      root.style.setProperty('--accent-foreground', '0 0% 15%');
      root.style.setProperty('--border', '0 0% 80%');
      root.style.setProperty('--input', '0 0% 95%');
      root.style.setProperty('--ring', '0 0% 20%');
      root.style.setProperty('--sidebar-background', '0 0% 100%');
      root.style.setProperty('--sidebar-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-accent', '0 0% 95%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-border', '0 0% 85%');
    } else if (newTheme === 'pizza') {
      // Pizza theme - Black background, olive green accents, white text
      root.classList.add('pizza-mode');
      root.style.setProperty('--background', '0 0% 5%');
      root.style.setProperty('--foreground', '0 0% 100%');
      root.style.setProperty('--card', '0 0% 8%');
      root.style.setProperty('--card-foreground', '0 0% 100%');
      root.style.setProperty('--popover', '0 0% 10%');
      root.style.setProperty('--popover-foreground', '0 0% 100%');
      root.style.setProperty('--primary', '75 45% 40%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 12%');
      root.style.setProperty('--secondary-foreground', '0 0% 100%');
      root.style.setProperty('--muted', '0 0% 18%');
      root.style.setProperty('--muted-foreground', '0 0% 60%');
      root.style.setProperty('--accent', '75 45% 35%');
      root.style.setProperty('--accent-foreground', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 20%');
      root.style.setProperty('--input', '0 0% 15%');
      root.style.setProperty('--ring', '75 45% 40%');
      root.style.setProperty('--sidebar-background', '0 0% 5%');
      root.style.setProperty('--sidebar-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-accent', '0 0% 12%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-border', '0 0% 20%');
    } else if (newTheme === 'ghast') {
      // Ghast theme - Minecraft ghostly white with dark accents, pixelated
      root.classList.add('ghast-mode');
      root.style.setProperty('--background', '0 0% 92%');
      root.style.setProperty('--foreground', '0 0% 10%');
      root.style.setProperty('--card', '0 0% 98%');
      root.style.setProperty('--card-foreground', '0 0% 10%');
      root.style.setProperty('--popover', '0 0% 98%');
      root.style.setProperty('--popover-foreground', '0 0% 10%');
      root.style.setProperty('--primary', '0 0% 15%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 88%');
      root.style.setProperty('--secondary-foreground', '0 0% 15%');
      root.style.setProperty('--muted', '0 0% 82%');
      root.style.setProperty('--muted-foreground', '0 0% 40%');
      root.style.setProperty('--accent', '0 0% 85%');
      root.style.setProperty('--accent-foreground', '0 0% 10%');
      root.style.setProperty('--border', '0 0% 75%');
      root.style.setProperty('--input', '0 0% 95%');
      root.style.setProperty('--ring', '0 0% 20%');
      root.style.setProperty('--sidebar-background', '0 0% 95%');
      root.style.setProperty('--sidebar-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-accent', '0 0% 88%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-border', '0 0% 75%');
    } else if (newTheme === 'buzzy') {
      // Buzzy theme - Bee-themed yellow and black
      root.classList.add('buzzy-mode');
      root.style.setProperty('--background', '45 80% 95%');
      root.style.setProperty('--foreground', '0 0% 10%');
      root.style.setProperty('--card', '45 70% 98%');
      root.style.setProperty('--card-foreground', '0 0% 10%');
      root.style.setProperty('--popover', '45 70% 98%');
      root.style.setProperty('--popover-foreground', '0 0% 10%');
      root.style.setProperty('--primary', '45 100% 50%');
      root.style.setProperty('--primary-foreground', '0 0% 5%');
      root.style.setProperty('--secondary', '45 50% 90%');
      root.style.setProperty('--secondary-foreground', '0 0% 15%');
      root.style.setProperty('--muted', '45 30% 88%');
      root.style.setProperty('--muted-foreground', '0 0% 40%');
      root.style.setProperty('--accent', '45 80% 85%');
      root.style.setProperty('--accent-foreground', '0 0% 10%');
      root.style.setProperty('--border', '45 40% 75%');
      root.style.setProperty('--input', '45 50% 92%');
      root.style.setProperty('--ring', '45 100% 50%');
      root.style.setProperty('--sidebar-background', '45 70% 96%');
      root.style.setProperty('--sidebar-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-accent', '45 50% 90%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-border', '45 40% 80%');
    } else if (newTheme === 'orange') {
      // Orange theme - warm peach/orange with green accents
      root.classList.add('orange-mode');
      root.style.setProperty('--background', '25 80% 95%');
      root.style.setProperty('--foreground', '0 0% 10%');
      root.style.setProperty('--card', '25 60% 98%');
      root.style.setProperty('--card-foreground', '0 0% 10%');
      root.style.setProperty('--popover', '25 60% 98%');
      root.style.setProperty('--popover-foreground', '0 0% 10%');
      root.style.setProperty('--primary', '30 90% 55%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '25 50% 90%');
      root.style.setProperty('--secondary-foreground', '0 0% 15%');
      root.style.setProperty('--muted', '25 30% 88%');
      root.style.setProperty('--muted-foreground', '0 0% 40%');
      root.style.setProperty('--accent', '30 80% 85%');
      root.style.setProperty('--accent-foreground', '0 0% 10%');
      root.style.setProperty('--border', '25 40% 78%');
      root.style.setProperty('--input', '25 50% 92%');
      root.style.setProperty('--ring', '30 90% 55%');
      root.style.setProperty('--sidebar-background', '25 60% 96%');
      root.style.setProperty('--sidebar-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-accent', '25 50% 90%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-border', '25 40% 80%');
    } else if (newTheme === 'custom') {
      root.classList.add('dark-mode');
      const stored = localStorage.getItem('mc-custom-theme');
      const custom: CustomThemeColors = stored ? JSON.parse(stored) : { primary: '#e63946', mode: 'dark' };
      const hsl = hexToHsl(custom.primary);
      const p = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      const isDarkBase = custom.mode === 'dark';
      
      if (isDarkBase) {
        root.classList.remove('light-mode');
        root.classList.add('dark-mode');
        root.style.setProperty('--background', '0 0% 5%');
        root.style.setProperty('--foreground', '0 0% 93%');
        root.style.setProperty('--card', '0 0% 8%');
        root.style.setProperty('--card-foreground', '0 0% 93%');
        root.style.setProperty('--popover', '0 0% 10%');
        root.style.setProperty('--popover-foreground', '0 0% 93%');
        root.style.setProperty('--secondary', '0 0% 12%');
        root.style.setProperty('--secondary-foreground', '0 0% 93%');
        root.style.setProperty('--muted', '0 0% 18%');
        root.style.setProperty('--muted-foreground', '0 0% 55%');
        root.style.setProperty('--border', '0 0% 20%');
        root.style.setProperty('--input', '0 0% 15%');
        root.style.setProperty('--sidebar-background', '0 0% 5%');
        root.style.setProperty('--sidebar-foreground', '0 0% 90%');
        root.style.setProperty('--sidebar-accent', '0 0% 12%');
        root.style.setProperty('--sidebar-accent-foreground', '0 0% 93%');
        root.style.setProperty('--sidebar-border', '0 0% 20%');
      } else {
        root.classList.remove('dark-mode');
        root.classList.add('light-mode');
        root.style.setProperty('--background', '0 0% 98%');
        root.style.setProperty('--foreground', `${hsl.h} ${Math.min(hsl.s, 72)}% 40%`);
        root.style.setProperty('--card', '0 0% 100%');
        root.style.setProperty('--card-foreground', `${hsl.h} ${Math.min(hsl.s, 72)}% 40%`);
        root.style.setProperty('--popover', '0 0% 100%');
        root.style.setProperty('--popover-foreground', `${hsl.h} ${Math.min(hsl.s, 72)}% 40%`);
        root.style.setProperty('--secondary', '0 0% 96%');
        root.style.setProperty('--secondary-foreground', `${hsl.h} ${Math.min(hsl.s, 72)}% 40%`);
        root.style.setProperty('--muted', '0 0% 92%');
        root.style.setProperty('--muted-foreground', `${hsl.h} 30% 50%`);
        root.style.setProperty('--border', `${hsl.h} 20% 88%`);
        root.style.setProperty('--input', '0 0% 95%');
        root.style.setProperty('--sidebar-background', '0 0% 100%');
        root.style.setProperty('--sidebar-foreground', `${hsl.h} ${Math.min(hsl.s, 72)}% 40%`);
        root.style.setProperty('--sidebar-accent', `${hsl.h} ${Math.min(hsl.s, 72)}% 96%`);
        root.style.setProperty('--sidebar-accent-foreground', `${hsl.h} ${Math.min(hsl.s, 72)}% 40%`);
        root.style.setProperty('--sidebar-border', `${hsl.h} 20% 90%`);
      }
      root.style.setProperty('--primary', p);
      root.style.setProperty('--primary-foreground', isDarkBase ? '0 0% 100%' : '0 0% 100%');
      root.style.setProperty('--accent', `${hsl.h} ${Math.min(hsl.s, 72)}% ${isDarkBase ? '45' : '95'}%`);
      root.style.setProperty('--accent-foreground', isDarkBase ? '0 0% 100%' : `${hsl.h} ${Math.min(hsl.s, 72)}% 40%`);
      root.style.setProperty('--ring', p);
    } else {
      // Red and Black theme - Minecraft style
      root.classList.add('dark-mode');
      root.style.setProperty('--background', '0 0% 5%');
      root.style.setProperty('--foreground', '0 0% 93%');
      root.style.setProperty('--card', '0 0% 8%');
      root.style.setProperty('--card-foreground', '0 0% 93%');
      root.style.setProperty('--popover', '0 0% 10%');
      root.style.setProperty('--popover-foreground', '0 0% 93%');
      root.style.setProperty('--primary', '0 72% 51%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 12%');
      root.style.setProperty('--secondary-foreground', '0 0% 93%');
      root.style.setProperty('--muted', '0 0% 18%');
      root.style.setProperty('--muted-foreground', '0 0% 55%');
      root.style.setProperty('--accent', '0 72% 45%');
      root.style.setProperty('--accent-foreground', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 20%');
      root.style.setProperty('--input', '0 0% 15%');
      root.style.setProperty('--ring', '0 72% 51%');
      root.style.setProperty('--sidebar-background', '0 0% 5%');
      root.style.setProperty('--sidebar-foreground', '0 0% 90%');
      root.style.setProperty('--sidebar-accent', '0 0% 12%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 93%');
      root.style.setProperty('--sidebar-border', '0 0% 20%');
    }
  }, []);

  const setCustomColor = useCallback((primary: string, mode: 'light' | 'dark') => {
    const custom: CustomThemeColors = { primary, mode };
    localStorage.setItem('mc-custom-theme', JSON.stringify(custom));
    setThemeState('custom');
    localStorage.setItem('mc-theme', 'custom');
    setTheme('custom');
  }, [setTheme]);

  // Apply theme on mount
  useEffect(() => {
    setTheme(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    const themes: ThemeMode[] = ['dark', 'light', 'bazimazi', 'cato', 'pizza', 'ghast', 'buzzy', 'orange'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isBaziMazi: theme === 'bazimazi',
    isCato: theme === 'cato',
    isPizza: theme === 'pizza',
    isGhast: theme === 'ghast',
    isBuzzy: theme === 'buzzy',
    isOrange: theme === 'orange',
  };
}
