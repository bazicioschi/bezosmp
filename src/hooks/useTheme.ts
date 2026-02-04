import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'bazimazi' | 'cato' | 'pizza';

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
    root.classList.remove('light-mode', 'dark-mode', 'bazimazi-mode', 'cato-mode', 'pizza-mode');
    
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
      // Pizza theme - Black background, green accents, white text
      root.classList.add('pizza-mode');
      root.style.setProperty('--background', '0 0% 5%');
      root.style.setProperty('--foreground', '0 0% 100%');
      root.style.setProperty('--card', '0 0% 8%');
      root.style.setProperty('--card-foreground', '0 0% 100%');
      root.style.setProperty('--popover', '0 0% 10%');
      root.style.setProperty('--popover-foreground', '0 0% 100%');
      root.style.setProperty('--primary', '142 70% 45%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 12%');
      root.style.setProperty('--secondary-foreground', '0 0% 100%');
      root.style.setProperty('--muted', '0 0% 18%');
      root.style.setProperty('--muted-foreground', '0 0% 60%');
      root.style.setProperty('--accent', '142 70% 40%');
      root.style.setProperty('--accent-foreground', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 20%');
      root.style.setProperty('--input', '0 0% 15%');
      root.style.setProperty('--ring', '142 70% 45%');
      root.style.setProperty('--sidebar-background', '0 0% 5%');
      root.style.setProperty('--sidebar-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-accent', '0 0% 12%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-border', '0 0% 20%');
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

  // Apply theme on mount
  useEffect(() => {
    setTheme(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    const themes: ThemeMode[] = ['dark', 'light', 'bazimazi', 'cato', 'pizza'];
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
  };
}
