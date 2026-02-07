"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { themes, getTheme, DEFAULT_THEME, type Theme } from "@/lib/themes";

const STORAGE_KEY = "intervu-theme";

interface ThemeContextValue {
  theme: string;
  setTheme: (name: string) => void;
  currentTheme: Theme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  currentTheme: getTheme(DEFAULT_THEME),
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyThemeToRoot(themeName: string) {
  const theme = getTheme(themeName);
  const isDark = document.documentElement.classList.contains("dark");
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  document.documentElement.style.setProperty("--brand", colors.brand);
  document.documentElement.style.setProperty("--brand-foreground", colors["brand-foreground"]);
  document.documentElement.style.setProperty("--brand-muted", colors["brand-muted"]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = stored && themes[stored] ? stored : DEFAULT_THEME;
    setThemeState(initial);
    applyThemeToRoot(initial);
    setMounted(true);

    // Watch for dark mode changes to re-apply theme colors
    const observer = new MutationObserver(() => {
      const current = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
      applyThemeToRoot(current);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const setTheme = useCallback((name: string) => {
    if (!themes[name]) return;
    setThemeState(name);
    localStorage.setItem(STORAGE_KEY, name);
    applyThemeToRoot(name);
  }, []);

  const currentTheme = getTheme(theme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
