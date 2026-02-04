import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const initializeTheme = () => {
      // 1. Check localStorage first
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeState(savedTheme);
        return savedTheme;
      }

      // 2. Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme: Theme = systemPrefersDark ? 'dark' : 'light';
      setThemeState(systemTheme);
      localStorage.setItem('theme', systemTheme);
      return systemTheme;
    };

    const initialTheme = initializeTheme();
    applyThemeToDocument(initialTheme);
  }, []);

  // Apply theme to document root
  const applyThemeToDocument = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Set theme function
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyThemeToDocument(newTheme);
  };

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if no saved preference exists
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        const systemTheme: Theme = e.matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;