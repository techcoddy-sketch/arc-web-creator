// Theme token registry. Each theme defines a set of HSL CSS variables for
// both light and dark modes. The ThemeProvider applies these to :root.
// Status colors (valid / expiring / expired) stay semantically consistent
// across all themes — only the hue is gently tuned per theme.

export type ThemeMode = "light" | "dark" | "system";
export type ThemeId =
  | "vermilion"
  | "graphite"
  | "indigo"
  | "forest"
  | "sunset"
  | "plum";

export type ThemeTokens = Record<string, string>;

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  // Swatches used for previews (hex or hsl strings)
  swatch: { bg: string; surface: string; primary: string; accent: string };
  light: ThemeTokens;
  dark: ThemeTokens;
}

// Shared status palette per mode — kept identical across themes so meaning
// never shifts. Individual themes may override these if intentional.
const STATUS_LIGHT: ThemeTokens = {
  "--expired": "4 55% 50%",
  "--expired-foreground": "0 0% 100%",
  "--expired-bg": "6 60% 96%",
  "--expiring": "38 70% 48%",
  "--expiring-foreground": "0 0% 100%",
  "--expiring-bg": "42 75% 95%",
  "--valid": "145 40% 38%",
  "--valid-foreground": "0 0% 100%",
  "--valid-bg": "145 35% 95%",
  "--warning": "35 75% 50%",
  "--warning-foreground": "0 0% 100%",
  "--destructive": "0 65% 55%",
  "--destructive-foreground": "0 0% 100%",
};

const STATUS_DARK: ThemeTokens = {
  "--expired": "0 60% 55%",
  "--expired-foreground": "0 0% 100%",
  "--expired-bg": "0 35% 18%",
  "--expiring": "35 70% 52%",
  "--expiring-foreground": "0 0% 100%",
  "--expiring-bg": "35 35% 18%",
  "--valid": "145 50% 45%",
  "--valid-foreground": "0 0% 100%",
  "--valid-bg": "145 30% 16%",
  "--warning": "35 75% 55%",
  "--warning-foreground": "0 0% 100%",
  "--destructive": "0 65% 55%",
  "--destructive-foreground": "0 0% 100%",
};

// Helper to build a full token set from a small palette config so each
// theme stays declarative and easy to add to.
function buildLight(p: {
  bg: string;
  fg: string;
  card: string;
  primary: string;
  primaryFg: string;
  primaryLight: string;
  primarySoft: string;
  primaryDark: string;
  secondary: string;
  secondaryFg: string;
  muted: string;
  mutedFg: string;
  border: string;
}): ThemeTokens {
  return {
    "--background": p.bg,
    "--foreground": p.fg,
    "--card": p.card,
    "--card-foreground": p.fg,
    "--popover": p.card,
    "--popover-foreground": p.fg,
    "--primary": p.primary,
    "--primary-foreground": p.primaryFg,
    "--primary-light": p.primaryLight,
    "--primary-soft": p.primarySoft,
    "--primary-dark": p.primaryDark,
    "--secondary": p.secondary,
    "--secondary-foreground": p.secondaryFg,
    "--muted": p.muted,
    "--muted-foreground": p.mutedFg,
    "--accent": p.primary,
    "--accent-foreground": p.primaryFg,
    "--border": p.border,
    "--input": p.border,
    "--ring": p.primary,
    "--sidebar-background": p.card,
    "--sidebar-foreground": p.fg,
    "--sidebar-primary": p.primary,
    "--sidebar-primary-foreground": p.primaryFg,
    "--sidebar-accent": p.secondary,
    "--sidebar-accent-foreground": p.secondaryFg,
    "--sidebar-border": p.border,
    "--sidebar-ring": p.primary,
    ...STATUS_LIGHT,
  };
}

function buildDark(p: {
  bg: string;
  fg: string;
  card: string;
  primary: string;
  primaryFg: string;
  primaryLight: string;
  primarySoft: string;
  primaryDark: string;
  secondary: string;
  secondaryFg: string;
  muted: string;
  mutedFg: string;
  border: string;
}): ThemeTokens {
  return {
    ...buildLight(p),
    ...STATUS_DARK,
  };
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  vermilion: {
    id: "vermilion",
    name: "Vermilion",
    description: "The signature Remonk look — warm off-white with vermilion accents.",
    swatch: { bg: "hsl(40 25% 97%)", surface: "hsl(40 30% 99%)", primary: "hsl(10 78% 53%)", accent: "hsl(10 80% 62%)" },
    light: buildLight({
      bg: "40 25% 97%", fg: "220 15% 12%", card: "40 30% 99%",
      primary: "10 78% 53%", primaryFg: "0 0% 100%",
      primaryLight: "10 80% 62%", primarySoft: "10 80% 96%", primaryDark: "10 78% 44%",
      secondary: "40 20% 94%", secondaryFg: "220 15% 25%",
      muted: "40 15% 93%", mutedFg: "220 10% 42%",
      border: "35 15% 88%",
    }),
    dark: buildDark({
      bg: "220 20% 10%", fg: "210 20% 92%", card: "220 18% 14%",
      primary: "10 78% 55%", primaryFg: "0 0% 100%",
      primaryLight: "10 80% 64%", primarySoft: "10 40% 20%", primaryDark: "10 78% 44%",
      secondary: "220 18% 18%", secondaryFg: "210 20% 88%",
      muted: "220 15% 18%", mutedFg: "215 15% 65%",
      border: "220 15% 22%",
    }),
  },
  graphite: {
    id: "graphite",
    name: "Graphite",
    description: "Neutral monochrome for distraction-free productivity.",
    swatch: { bg: "hsl(220 12% 96%)", surface: "hsl(0 0% 100%)", primary: "hsl(220 15% 25%)", accent: "hsl(220 12% 45%)" },
    light: buildLight({
      bg: "220 12% 96%", fg: "220 18% 12%", card: "0 0% 100%",
      primary: "220 15% 25%", primaryFg: "0 0% 100%",
      primaryLight: "220 12% 45%", primarySoft: "220 15% 94%", primaryDark: "220 18% 18%",
      secondary: "220 12% 92%", secondaryFg: "220 15% 22%",
      muted: "220 10% 92%", mutedFg: "220 8% 42%",
      border: "220 12% 86%",
    }),
    dark: buildDark({
      bg: "220 14% 9%", fg: "210 15% 92%", card: "220 14% 13%",
      primary: "210 12% 80%", primaryFg: "220 18% 12%",
      primaryLight: "210 10% 88%", primarySoft: "220 12% 22%", primaryDark: "210 12% 70%",
      secondary: "220 14% 16%", secondaryFg: "210 15% 88%",
      muted: "220 12% 17%", mutedFg: "215 10% 62%",
      border: "220 12% 22%",
    }),
  },
  indigo: {
    id: "indigo",
    name: "Indigo",
    description: "Calm, focused indigo — quiet confidence.",
    swatch: { bg: "hsl(225 30% 97%)", surface: "hsl(0 0% 100%)", primary: "hsl(232 60% 52%)", accent: "hsl(232 70% 65%)" },
    light: buildLight({
      bg: "225 30% 97%", fg: "230 25% 14%", card: "0 0% 100%",
      primary: "232 60% 52%", primaryFg: "0 0% 100%",
      primaryLight: "232 70% 65%", primarySoft: "232 65% 95%", primaryDark: "232 60% 42%",
      secondary: "225 25% 93%", secondaryFg: "230 25% 22%",
      muted: "225 20% 93%", mutedFg: "230 12% 42%",
      border: "225 20% 88%",
    }),
    dark: buildDark({
      bg: "232 25% 10%", fg: "225 20% 92%", card: "232 22% 14%",
      primary: "232 70% 65%", primaryFg: "232 25% 10%",
      primaryLight: "232 75% 72%", primarySoft: "232 40% 22%", primaryDark: "232 65% 55%",
      secondary: "232 22% 18%", secondaryFg: "225 18% 88%",
      muted: "232 18% 18%", mutedFg: "225 15% 65%",
      border: "232 18% 24%",
    }),
  },
  forest: {
    id: "forest",
    name: "Forest",
    description: "Grounded, restorative greens.",
    swatch: { bg: "hsl(80 18% 96%)", surface: "hsl(80 25% 99%)", primary: "hsl(150 35% 32%)", accent: "hsl(150 40% 45%)" },
    light: buildLight({
      bg: "80 18% 96%", fg: "150 25% 12%", card: "80 25% 99%",
      primary: "150 35% 32%", primaryFg: "0 0% 100%",
      primaryLight: "150 40% 45%", primarySoft: "150 40% 94%", primaryDark: "150 35% 24%",
      secondary: "80 15% 92%", secondaryFg: "150 25% 22%",
      muted: "80 12% 92%", mutedFg: "150 10% 38%",
      border: "80 12% 86%",
    }),
    dark: buildDark({
      bg: "150 18% 9%", fg: "140 15% 92%", card: "150 18% 13%",
      primary: "150 45% 50%", primaryFg: "150 25% 8%",
      primaryLight: "150 50% 60%", primarySoft: "150 35% 18%", primaryDark: "150 45% 40%",
      secondary: "150 16% 17%", secondaryFg: "140 15% 88%",
      muted: "150 14% 17%", mutedFg: "140 12% 62%",
      border: "150 14% 22%",
    }),
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    description: "Soft peach and coral — warm and inviting.",
    swatch: { bg: "hsl(28 50% 97%)", surface: "hsl(30 60% 99%)", primary: "hsl(18 75% 55%)", accent: "hsl(348 70% 62%)" },
    light: buildLight({
      bg: "28 50% 97%", fg: "20 25% 14%", card: "30 60% 99%",
      primary: "18 75% 55%", primaryFg: "0 0% 100%",
      primaryLight: "18 80% 65%", primarySoft: "18 80% 95%", primaryDark: "18 75% 45%",
      secondary: "28 35% 93%", secondaryFg: "20 25% 22%",
      muted: "28 25% 93%", mutedFg: "20 12% 42%",
      border: "28 25% 88%",
    }),
    dark: buildDark({
      bg: "20 22% 10%", fg: "30 22% 92%", card: "20 22% 14%",
      primary: "18 80% 62%", primaryFg: "20 25% 10%",
      primaryLight: "18 85% 70%", primarySoft: "18 50% 22%", primaryDark: "18 75% 50%",
      secondary: "20 20% 18%", secondaryFg: "30 22% 88%",
      muted: "20 16% 18%", mutedFg: "30 14% 65%",
      border: "20 16% 24%",
    }),
  },
  plum: {
    id: "plum",
    name: "Plum",
    description: "Refined muted purple — elegant and restrained.",
    swatch: { bg: "hsl(290 18% 97%)", surface: "hsl(290 25% 99%)", primary: "hsl(280 35% 45%)", accent: "hsl(280 45% 60%)" },
    light: buildLight({
      bg: "290 18% 97%", fg: "280 22% 14%", card: "290 25% 99%",
      primary: "280 35% 45%", primaryFg: "0 0% 100%",
      primaryLight: "280 45% 60%", primarySoft: "280 40% 95%", primaryDark: "280 35% 35%",
      secondary: "290 15% 93%", secondaryFg: "280 22% 22%",
      muted: "290 12% 93%", mutedFg: "280 10% 42%",
      border: "290 12% 88%",
    }),
    dark: buildDark({
      bg: "280 18% 10%", fg: "290 18% 92%", card: "280 18% 14%",
      primary: "280 50% 65%", primaryFg: "280 25% 10%",
      primaryLight: "280 55% 72%", primarySoft: "280 35% 22%", primaryDark: "280 45% 55%",
      secondary: "280 16% 18%", secondaryFg: "290 18% 88%",
      muted: "280 14% 18%", mutedFg: "290 12% 65%",
      border: "280 14% 24%",
    }),
  },
};

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);

export const DEFAULT_THEME: ThemeId = "vermilion";
export const DEFAULT_MODE: ThemeMode = "system";