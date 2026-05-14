import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { THEMES, DEFAULT_THEME, DEFAULT_MODE, type ThemeId, type ThemeMode, type ThemeTokens } from "@/lib/themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "remonk:theme-pref:v1";

interface ThemePref {
  theme: ThemeId;
  mode: ThemeMode;
}

interface ThemeContextValue extends ThemePref {
  resolvedMode: "light" | "dark";
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): ThemePref {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.theme && parsed?.mode && THEMES[parsed.theme as ThemeId]) {
        return { theme: parsed.theme, mode: parsed.mode };
      }
    }
  } catch { /* noop */ }
  return { theme: DEFAULT_THEME, mode: DEFAULT_MODE };
}

function applyTokens(tokens: ThemeTokens, isDark: boolean) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
  root.classList.toggle("dark", isDark);
  root.dataset.theme = root.dataset.theme || "";
}

function getSystemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pref, setPref] = useState<ThemePref>(() => readStored());
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemDark());

  // Listen for OS theme changes when in 'system' mode
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const resolvedMode: "light" | "dark" =
    pref.mode === "system" ? (systemDark ? "dark" : "light") : pref.mode;

  // Apply tokens whenever theme or resolved mode changes
  useEffect(() => {
    const def = THEMES[pref.theme] ?? THEMES[DEFAULT_THEME];
    const tokens = resolvedMode === "dark" ? def.dark : def.light;
    applyTokens(tokens, resolvedMode === "dark");
    document.documentElement.dataset.theme = pref.theme;
  }, [pref.theme, resolvedMode]);

  // Hydrate from Supabase profile once user is available (overrides local
  // only if local was the default — so user-changed settings win until they
  // explicitly switch).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("theme_preference")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled || !data?.theme_preference) return;
        const remote = data.theme_preference as Partial<ThemePref>;
        if (remote?.theme && remote?.mode && THEMES[remote.theme as ThemeId]) {
          const next = { theme: remote.theme as ThemeId, mode: remote.mode as ThemeMode };
          setPref(next);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch (e) {
        console.warn("Theme hydrate skipped:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const persist = useCallback((next: ThemePref) => {
    setPref(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
    if (user) {
      supabase
        .from("profiles")
        .update({ theme_preference: next })
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) console.warn("Theme persist error:", error.message);
        });
    }
  }, [user]);

  const setTheme = useCallback((theme: ThemeId) => {
    persist({ ...pref, theme });
  }, [pref, persist]);

  const setMode = useCallback((mode: ThemeMode) => {
    persist({ ...pref, mode });
  }, [pref, persist]);

  const value = useMemo<ThemeContextValue>(() => ({
    ...pref,
    resolvedMode,
    setTheme,
    setMode,
  }), [pref, resolvedMode, setTheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}