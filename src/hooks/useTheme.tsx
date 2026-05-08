import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyTheme, THEMES, type ThemeId, type ThemeMode } from "@/lib/themes";

export type ThemeModePreference = ThemeMode | "system";

interface ThemeContextValue {
  themeId: ThemeId;
  mode: ThemeMode; // resolved (system → light/dark)
  modePreference: ThemeModePreference;
  setTheme: (id: ThemeId) => void;
  setModePreference: (mode: ThemeModePreference) => void;
  previewTheme: (id: ThemeId | null, mode?: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "remonk:theme:id";
const MODE_KEY = "remonk:theme:mode"; // 'light' | 'dark' | 'system'

function getSystemMode(): ThemeMode {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredThemeId(): ThemeId {
  if (typeof window === "undefined") return "vermilion";
  const v = window.localStorage.getItem(THEME_KEY) as ThemeId | null;
  return v && THEMES[v] ? v : "vermilion";
}

function readStoredMode(): ThemeModePreference {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(MODE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => readStoredThemeId());
  const [modePreference, setModePreferenceState] = useState<ThemeModePreference>(
    () => readStoredMode(),
  );
  const [systemMode, setSystemMode] = useState<ThemeMode>(() => getSystemMode());
  const [preview, setPreview] = useState<{ id: ThemeId; mode?: ThemeMode } | null>(null);

  const resolvedMode: ThemeMode =
    modePreference === "system" ? systemMode : modePreference;

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemMode(e.matches ? "dark" : "light");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // Apply theme whenever resolved values change (or preview is set)
  useEffect(() => {
    const id = preview?.id ?? themeId;
    const mode = preview?.mode ?? resolvedMode;
    applyTheme(id, mode);
  }, [themeId, resolvedMode, preview]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    try {
      window.localStorage.setItem(THEME_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const setModePreference = useCallback((m: ThemeModePreference) => {
    setModePreferenceState(m);
    try {
      window.localStorage.setItem(MODE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const previewTheme = useCallback((id: ThemeId | null, mode?: ThemeMode) => {
    setPreview(id ? { id, mode } : null);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      mode: resolvedMode,
      modePreference,
      setTheme,
      setModePreference,
      previewTheme,
    }),
    [themeId, resolvedMode, modePreference, setTheme, setModePreference, previewTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
