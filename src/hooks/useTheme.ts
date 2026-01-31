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
    
    // Apply theme to document
    const root = document.documentElement;
    
    if (newTheme === 'light') {
      // Red and White theme
      root.style.setProperty('--background', '0 0% 95%');
      root.style.setProperty('--foreground', '0 0% 10%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 0% 10%');
      root.style.setProperty('--popover', '0 0% 98%');
      root.style.setProperty('--popover-foreground', '0 0% 10%');
      root.style.setProperty('--secondary', '0 0% 92%');
      root.style.setProperty('--secondary-foreground', '0 0% 15%');
      root.style.setProperty('--muted', '0 0% 88%');
      root.style.setProperty('--muted-foreground', '0 0% 40%');
      root.style.setProperty('--border', '0 0% 80%');
      root.style.setProperty('--input', '0 0% 90%');
      root.style.setProperty('--sidebar-background', '0 0% 98%');
      root.style.setProperty('--sidebar-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-accent', '0 0% 92%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 15%');
      root.style.setProperty('--sidebar-border', '0 0% 85%');
    } else {
      // Red and Black theme (default)
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
