import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('mc-theme');
    return (stored as ThemeMode) || 'dark';
  });

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('mc-theme', newTheme);
    
    const root = document.documentElement;
    
    if (newTheme === 'light') {
      // Red and White theme - clean, modern, non-Minecraft
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
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
    } else {
      // Red and Black theme - Minecraft style
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
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
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };
}
