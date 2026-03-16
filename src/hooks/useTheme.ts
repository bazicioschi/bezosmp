import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'bazimazi' | 'cato' | 'pizza' | 'ghast' | 'buzzy' | 'orange' | 'custom';

export interface CustomThemeColors {
  primary: string;
  mode: 'light' | 'dark';
  background?: string;
  text?: string;
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
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
    
    root.classList.remove('light-mode', 'dark-mode', 'bazimazi-mode', 'cato-mode', 'pizza-mode', 'ghast-mode', 'buzzy-mode', 'orange-mode');
    root.style.removeProperty('color');
    
    if (newTheme === 'light') {
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
      const stored = localStorage.getItem('mc-custom-theme');
      const custom: CustomThemeColors = stored ? JSON.parse(stored) : { primary: '#e63946', mode: 'dark' };
      const hsl = hexToHsl(custom.primary);
      const p = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      
      const bgHex = custom.background || (custom.mode === 'dark' ? '#0d0d0d' : '#fafafa');
      const textHex = custom.text || (custom.mode === 'dark' ? '#ededed' : '#1a1a1a');
      const bgHsl = hexToHsl(bgHex);
      const textHsl = hexToHsl(textHex);
      const isDarkBase = bgHsl.l < 50;

      if (isDarkBase) {
        root.classList.add('dark-mode');
      } else {
        root.classList.add('light-mode');
      }

      const bg = `${bgHsl.h} ${bgHsl.s}% ${bgHsl.l}%`;
      const fg = `${textHsl.h} ${textHsl.s}% ${textHsl.l}%`;
      const cardL = isDarkBase ? Math.min(bgHsl.l + 3, 100) : Math.max(bgHsl.l + 2, 0);
      const card = `${bgHsl.h} ${bgHsl.s}% ${cardL}%`;
      const secL = isDarkBase ? Math.min(bgHsl.l + 7, 100) : Math.max(bgHsl.l - 2, 0);
      const sec = `${bgHsl.h} ${bgHsl.s}% ${secL}%`;
      const mutedL = isDarkBase ? Math.min(bgHsl.l + 13, 100) : Math.max(bgHsl.l - 6, 0);
      const muted = `${bgHsl.h} ${Math.max(bgHsl.s - 10, 0)}% ${mutedL}%`;
      const mutedFgL = isDarkBase ? 55 : 45;
      const borderL = isDarkBase ? Math.min(bgHsl.l + 15, 100) : Math.max(bgHsl.l - 10, 0);

      root.style.setProperty('--background', bg);
      root.style.setProperty('--foreground', fg);
      root.style.setProperty('--card', card);
      root.style.setProperty('--card-foreground', fg);
      root.style.setProperty('--popover', card);
      root.style.setProperty('--popover-foreground', fg);
      root.style.setProperty('--primary', p);
      root.style.setProperty('--primary-foreground', isDarkBase ? '0 0% 100%' : '0 0% 100%');
      root.style.setProperty('--secondary', sec);
      root.style.setProperty('--secondary-foreground', fg);
      root.style.setProperty('--muted', muted);
      root.style.setProperty('--muted-foreground', `${textHsl.h} ${Math.max(textHsl.s - 20, 0)}% ${mutedFgL}%`);
      root.style.setProperty('--accent', `${hsl.h} ${Math.min(hsl.s, 72)}% ${isDarkBase ? 45 : 95}%`);
      root.style.setProperty('--accent-foreground', isDarkBase ? '0 0% 100%' : fg);
      root.style.setProperty('--border', `${bgHsl.h} ${Math.max(bgHsl.s - 5, 0)}% ${borderL}%`);
      root.style.setProperty('--input', sec);
      root.style.setProperty('--ring', p);
      root.style.setProperty('--sidebar-background', bg);
      root.style.setProperty('--sidebar-foreground', fg);
      root.style.setProperty('--sidebar-accent', sec);
      root.style.setProperty('--sidebar-accent-foreground', fg);
      root.style.setProperty('--sidebar-border', `${bgHsl.h} ${Math.max(bgHsl.s - 5, 0)}% ${borderL}%`);

      // Force text color on root to override hardcoded CSS theme class colors
      root.style.setProperty('color', `hsl(${fg})`);
    } else {
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

  const setCustomColor = useCallback((primary: string, mode: 'light' | 'dark', background?: string, text?: string) => {
    const custom: CustomThemeColors = { primary, mode, background, text };
    localStorage.setItem('mc-custom-theme', JSON.stringify(custom));
    setThemeState('custom');
    localStorage.setItem('mc-theme', 'custom');
    setTheme('custom');
  }, [setTheme]);

  useEffect(() => {
    setTheme(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    const themes: ThemeMode[] = ['dark', 'light', 'bazimazi', 'cato', 'pizza', 'ghast', 'buzzy', 'orange', 'custom'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    setCustomColor,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isBaziMazi: theme === 'bazimazi',
    isCato: theme === 'cato',
    isPizza: theme === 'pizza',
    isGhast: theme === 'ghast',
    isBuzzy: theme === 'buzzy',
    isOrange: theme === 'orange',
    isCustom: theme === 'custom',
  };
}
