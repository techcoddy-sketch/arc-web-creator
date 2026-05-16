import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_MODE,
  DEFAULT_PALETTE,
  PaletteId,
  PALETTES,
  ThemeMode,
} from "@/lib/themePalettes";

interface ThemePreferenceCtx {
  palette: PaletteId;
  mode: ThemeMode;
  setPalette: (p: PaletteId) => void;
  setMode: (m: ThemeMode) => void;
  /** Apply a preview without persisting; pass null to revert. */
  previewPalette: (p: PaletteId | null) => void;
}

const Ctx = createContext<ThemePreferenceCtx | null>(null);
const STORAGE_KEY = "remonk.theme.preference";

function readLocal(): { palette: PaletteId; mode: ThemeMode } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const palette = (PALETTES.find((p) => p.id === parsed.theme)?.id ??
        DEFAULT_PALETTE) as PaletteId;
      const mode = (["light", "dark", "system"].includes(parsed.mode)
        ? parsed.mode
        : DEFAULT_MODE) as ThemeMode;
      return { palette, mode };
    }
  } catch {
    /* ignore */
  }
  return { palette: DEFAULT_PALETTE, mode: DEFAULT_MODE };
}

function applyPalette(palette: PaletteId) {
  const root = document.documentElement;
  if (palette === "vermilion") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", palette);
  }
}

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  const isDark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
}

function flashTransition() {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  window.setTimeout(() => root.classList.remove("theme-transition"), 320);
}

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const initial = readLocal();
  const [palette, setPaletteState] = useState<PaletteId>(initial.palette);
  const [mode, setModeState] = useState<ThemeMode>(initial.mode);
  const previewRef = useRef<PaletteId | null>(null);
  const hydratedRef = useRef(false);

  // Apply on mount + whenever the resolved values change
  useEffect(() => {
    applyPalette(previewRef.current ?? palette);
  }, [palette]);

  useEffect(() => {
    applyMode(mode);
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyMode("system");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [mode]);

  // Hydrate from profiles.theme_preference once user is known
  useEffect(() => {
    if (!user || hydratedRef.current) return;
    hydratedRef.current = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("user_id", user.id)
        .maybeSingle();
      const pref = (data?.theme_preference ?? null) as
        | { mode?: ThemeMode; theme?: PaletteId }
        | null;
      if (!pref) return;
      const nextPalette =
        (PALETTES.find((p) => p.id === pref.theme)?.id as PaletteId) ?? DEFAULT_PALETTE;
      const nextMode = (
        ["light", "dark", "system"].includes(pref.mode || "") ? pref.mode : DEFAULT_MODE
      ) as ThemeMode;
      setPaletteState(nextPalette);
      setModeState(nextMode);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme: nextPalette, mode: nextMode })
      );
    })();
  }, [user]);

  const persist = useCallback(
    async (next: { palette: PaletteId; mode: ThemeMode }) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme: next.palette, mode: next.mode })
      );
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ theme_preference: { theme: next.palette, mode: next.mode } })
        .eq("user_id", user.id);
    },
    [user]
  );

  const setPalette = useCallback(
    (p: PaletteId) => {
      previewRef.current = null;
      flashTransition();
      setPaletteState(p);
      persist({ palette: p, mode });
    },
    [mode, persist]
  );

  const setMode = useCallback(
    (m: ThemeMode) => {
      flashTransition();
      setModeState(m);
      persist({ palette, mode: m });
    },
    [palette, persist]
  );

  const previewPalette = useCallback(
    (p: PaletteId | null) => {
      previewRef.current = p;
      flashTransition();
      applyPalette(p ?? palette);
    },
    [palette]
  );

  return (
    <Ctx.Provider value={{ palette, mode, setPalette, setMode, previewPalette }}>
      {children}
    </Ctx.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThemePreference must be used inside ThemePreferenceProvider");
  return ctx;
}
