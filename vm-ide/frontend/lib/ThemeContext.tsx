"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export const LIGHT = {
  surface:              "#f9f9ff",
  surfaceContainerLow:  "#f1f3ff",
  surfaceContainer:     "#e9edff",
  surfaceContainerHigh: "#e1e8ff",
  surfaceLowest:        "#ffffff",
  onSurface:            "#19315d",
  onSurfaceVariant:     "#485f8d",
  outlineVariant:       "rgba(155,178,229,0.25)",
  primary:              "#7C3AED",
  primaryContainer:     "#EDE9FE",
  inverseSurface:       "#070e1d",
  termBg:     "#0d1117",
  termHeader: "#161b22",
  termBorder: "rgba(255,255,255,0.06)",
  termText:   "#c9d1d9",
  termMuted:  "rgba(255,255,255,0.35)",
  termGreen:  "#3fb950",
  termBlue:   "#79c0ff",
  termPurple: "#d2a8ff",
  termOrange: "#ffa657",
  termRed:    "#ff7b72",
  termString: "#a5d6ff",
  success:    "#15803d",
};

export const DARK = {
  surface:              "#0d1117",
  surfaceContainerLow:  "#161b22",
  surfaceContainer:     "#1c2433",
  surfaceContainerHigh: "#21293a",
  surfaceLowest:        "#13191f",
  onSurface:            "#c9d1d9",
  onSurfaceVariant:     "#8b949e",
  outlineVariant:       "rgba(48,54,61,0.8)",
  primary:              "#7C3AED",
  primaryContainer:     "#2D1869",
  inverseSurface:       "#f0f6fc",
  termBg:     "#010409",
  termHeader: "#0d1117",
  termBorder: "rgba(255,255,255,0.06)",
  termText:   "#c9d1d9",
  termMuted:  "rgba(255,255,255,0.35)",
  termGreen:  "#3fb950",
  termBlue:   "#79c0ff",
  termPurple: "#d2a8ff",
  termOrange: "#ffa657",
  termRed:    "#ff7b72",
  termString: "#a5d6ff",
  success:    "#3fb950",
};

export type Theme = typeof LIGHT;

interface ThemeCtx {
  D: Theme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  D: LIGHT,
  isDark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;

    const rootTheme = document.documentElement.getAttribute("data-theme");
    if (rootTheme === "dark") return true;
    if (rootTheme === "light") return false;

    const stored = localStorage.getItem("vinexus-theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const stored = localStorage.getItem("vinexus-theme");
    if (stored === "dark") {
      setIsDark(true);
    } else if (stored === "light") {
      setIsDark(false);
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Apply data-theme attribute to <html> so CSS variables in globals.css update
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    // Keep body colors in sync with the chosen theme without animating the shell.
    document.body.style.background = isDark ? "#0d1117" : "#f9f9ff";
    document.body.style.color      = isDark ? "#c9d1d9" : "#19315d";
  }, [isDark]);

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("vinexus-theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ D: isDark ? DARK : LIGHT, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
