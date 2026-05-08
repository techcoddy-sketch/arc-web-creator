// Remonk Theme System
// Each theme defines a cohesive set of HSL CSS variables that map to the
// design tokens declared in src/index.css. Themes adapt the design language
// rather than replace it — typography, spacing, radii, and status semantics
// remain consistent across every theme.

export type ThemeMode = "light" | "dark";
export type ThemeId =
  | "vermilion"
  | "midnight"
  | "forest"
  | "ocean"
  | "sand"
  | "lavender"
  | "graphite";

export interface ThemePalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  primaryLight: string;
  primarySoft: string;
  primaryDark: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  // Status — kept semantic across themes
  expired: string;
  expiredForeground: string;
  expiredBg: string;
  expiring: string;
  expiringForeground: string;
  expiringBg: string;
  valid: string;
  validForeground: string;
  validBg: string;
  // Sidebar (mirrors surfaces)
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  // Swatch shown in picker (HSL strings)
  swatch: { primary: string; surface: string; accent: string };
  light: ThemePalette;
  dark: ThemePalette;
}

// Shared, premium status palette (light + dark variants). Themes can override
// but defaults preserve recognizable success/warning/error semantics.
const STATUS_LIGHT = {
  expired: "4 55% 50%",
  expiredForeground: "0 0% 100%",
  expiredBg: "6 60% 96%",
  expiring: "38 70% 48%",
  expiringForeground: "0 0% 100%",
  expiringBg: "42 75% 95%",
  valid: "145 40% 38%",
  validForeground: "0 0% 100%",
  validBg: "145 35% 95%",
};

const STATUS_DARK = {
  expired: "0 60% 55%",
  expiredForeground: "0 0% 100%",
  expiredBg: "0 35% 18%",
  expiring: "35 70% 52%",
  expiringForeground: "0 0% 100%",
  expiringBg: "35 35% 18%",
  valid: "145 50% 45%",
  validForeground: "0 0% 100%",
  validBg: "145 30% 16%",
};

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  vermilion: {
    id: "vermilion",
    name: "Vermilion",
    description: "Signature warm minimal — the Remonk default.",
    swatch: { primary: "10 78% 53%", surface: "40 25% 97%", accent: "10 78% 53%" },
    light: {
      background: "40 25% 97%",
      foreground: "220 15% 12%",
      card: "40 30% 99%",
      cardForeground: "220 15% 12%",
      popover: "0 0% 100%",
      popoverForeground: "220 15% 12%",
      primary: "10 78% 53%",
      primaryForeground: "0 0% 100%",
      primaryLight: "10 80% 62%",
      primarySoft: "10 80% 96%",
      primaryDark: "10 78% 44%",
      secondary: "40 20% 94%",
      secondaryForeground: "220 15% 25%",
      muted: "40 15% 93%",
      mutedForeground: "220 10% 42%",
      accent: "10 78% 53%",
      accentForeground: "0 0% 100%",
      border: "35 15% 88%",
      input: "35 15% 90%",
      ring: "10 78% 53%",
      ...STATUS_LIGHT,
      sidebarBackground: "40 30% 99%",
      sidebarForeground: "220 15% 12%",
      sidebarPrimary: "10 78% 53%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "40 20% 94%",
      sidebarAccentForeground: "220 15% 25%",
      sidebarBorder: "35 15% 88%",
      sidebarRing: "10 78% 53%",
    },
    dark: {
      background: "220 20% 10%",
      foreground: "210 20% 92%",
      card: "220 18% 14%",
      cardForeground: "210 20% 92%",
      popover: "220 18% 14%",
      popoverForeground: "210 20% 92%",
      primary: "10 78% 55%",
      primaryForeground: "0 0% 100%",
      primaryLight: "10 80% 64%",
      primarySoft: "10 40% 20%",
      primaryDark: "10 78% 44%",
      secondary: "220 18% 18%",
      secondaryForeground: "210 20% 88%",
      muted: "220 15% 18%",
      mutedForeground: "220 10% 60%",
      accent: "10 78% 55%",
      accentForeground: "0 0% 100%",
      border: "220 15% 22%",
      input: "220 15% 20%",
      ring: "10 78% 55%",
      ...STATUS_DARK,
      sidebarBackground: "220 22% 12%",
      sidebarForeground: "210 20% 90%",
      sidebarPrimary: "10 78% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "210 30% 20%",
      sidebarAccentForeground: "210 40% 75%",
      sidebarBorder: "220 15% 20%",
      sidebarRing: "10 78% 55%",
    },
  },

  midnight: {
    id: "midnight",
    name: "Midnight",
    description: "Deep indigo focus mode for late-night productivity.",
    swatch: { primary: "230 70% 62%", surface: "230 25% 12%", accent: "260 60% 65%" },
    light: {
      background: "225 30% 97%",
      foreground: "230 25% 14%",
      card: "0 0% 100%",
      cardForeground: "230 25% 14%",
      popover: "0 0% 100%",
      popoverForeground: "230 25% 14%",
      primary: "230 70% 55%",
      primaryForeground: "0 0% 100%",
      primaryLight: "230 70% 65%",
      primarySoft: "230 70% 96%",
      primaryDark: "230 70% 45%",
      secondary: "225 25% 94%",
      secondaryForeground: "230 25% 25%",
      muted: "225 20% 93%",
      mutedForeground: "230 12% 45%",
      accent: "260 60% 60%",
      accentForeground: "0 0% 100%",
      border: "225 18% 88%",
      input: "225 18% 90%",
      ring: "230 70% 55%",
      ...STATUS_LIGHT,
      sidebarBackground: "0 0% 100%",
      sidebarForeground: "230 25% 14%",
      sidebarPrimary: "230 70% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "225 25% 94%",
      sidebarAccentForeground: "230 25% 25%",
      sidebarBorder: "225 18% 88%",
      sidebarRing: "230 70% 55%",
    },
    dark: {
      background: "230 28% 9%",
      foreground: "225 25% 92%",
      card: "230 25% 13%",
      cardForeground: "225 25% 92%",
      popover: "230 25% 13%",
      popoverForeground: "225 25% 92%",
      primary: "230 75% 65%",
      primaryForeground: "230 25% 10%",
      primaryLight: "230 75% 72%",
      primarySoft: "230 40% 22%",
      primaryDark: "230 75% 55%",
      secondary: "230 22% 18%",
      secondaryForeground: "225 25% 88%",
      muted: "230 20% 18%",
      mutedForeground: "230 10% 62%",
      accent: "260 65% 68%",
      accentForeground: "0 0% 100%",
      border: "230 20% 22%",
      input: "230 20% 20%",
      ring: "230 75% 65%",
      ...STATUS_DARK,
      sidebarBackground: "230 28% 11%",
      sidebarForeground: "225 25% 90%",
      sidebarPrimary: "230 75% 65%",
      sidebarPrimaryForeground: "230 25% 10%",
      sidebarAccent: "230 22% 20%",
      sidebarAccentForeground: "225 25% 80%",
      sidebarBorder: "230 20% 20%",
      sidebarRing: "230 75% 65%",
    },
  },

  forest: {
    id: "forest",
    name: "Forest",
    description: "Calm sage green, grounded and natural.",
    swatch: { primary: "155 38% 38%", surface: "100 20% 97%", accent: "165 35% 45%" },
    light: {
      background: "100 20% 97%",
      foreground: "150 20% 12%",
      card: "100 25% 99%",
      cardForeground: "150 20% 12%",
      popover: "0 0% 100%",
      popoverForeground: "150 20% 12%",
      primary: "155 38% 38%",
      primaryForeground: "0 0% 100%",
      primaryLight: "155 38% 48%",
      primarySoft: "155 35% 94%",
      primaryDark: "155 38% 30%",
      secondary: "100 18% 93%",
      secondaryForeground: "150 20% 25%",
      muted: "100 15% 92%",
      mutedForeground: "150 10% 42%",
      accent: "165 35% 42%",
      accentForeground: "0 0% 100%",
      border: "100 15% 87%",
      input: "100 15% 89%",
      ring: "155 38% 38%",
      ...STATUS_LIGHT,
      sidebarBackground: "100 25% 99%",
      sidebarForeground: "150 20% 12%",
      sidebarPrimary: "155 38% 38%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "100 18% 93%",
      sidebarAccentForeground: "150 20% 25%",
      sidebarBorder: "100 15% 87%",
      sidebarRing: "155 38% 38%",
    },
    dark: {
      background: "150 20% 9%",
      foreground: "120 15% 92%",
      card: "150 18% 13%",
      cardForeground: "120 15% 92%",
      popover: "150 18% 13%",
      popoverForeground: "120 15% 92%",
      primary: "155 45% 50%",
      primaryForeground: "150 20% 9%",
      primaryLight: "155 45% 60%",
      primarySoft: "155 30% 20%",
      primaryDark: "155 45% 40%",
      secondary: "150 15% 18%",
      secondaryForeground: "120 15% 88%",
      muted: "150 12% 18%",
      mutedForeground: "120 8% 60%",
      accent: "165 45% 50%",
      accentForeground: "150 20% 9%",
      border: "150 12% 22%",
      input: "150 12% 20%",
      ring: "155 45% 50%",
      ...STATUS_DARK,
      sidebarBackground: "150 22% 11%",
      sidebarForeground: "120 15% 90%",
      sidebarPrimary: "155 45% 50%",
      sidebarPrimaryForeground: "150 20% 9%",
      sidebarAccent: "150 15% 20%",
      sidebarAccentForeground: "120 15% 80%",
      sidebarBorder: "150 12% 20%",
      sidebarRing: "155 45% 50%",
    },
  },

  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Crisp coastal blue — clean and focused.",
    swatch: { primary: "205 75% 45%", surface: "200 30% 97%", accent: "190 60% 45%" },
    light: {
      background: "200 30% 97%",
      foreground: "210 25% 14%",
      card: "200 35% 99%",
      cardForeground: "210 25% 14%",
      popover: "0 0% 100%",
      popoverForeground: "210 25% 14%",
      primary: "205 75% 45%",
      primaryForeground: "0 0% 100%",
      primaryLight: "205 75% 55%",
      primarySoft: "205 70% 95%",
      primaryDark: "205 75% 36%",
      secondary: "200 25% 93%",
      secondaryForeground: "210 25% 25%",
      muted: "200 20% 92%",
      mutedForeground: "210 12% 42%",
      accent: "190 60% 42%",
      accentForeground: "0 0% 100%",
      border: "200 18% 87%",
      input: "200 18% 89%",
      ring: "205 75% 45%",
      ...STATUS_LIGHT,
      sidebarBackground: "200 35% 99%",
      sidebarForeground: "210 25% 14%",
      sidebarPrimary: "205 75% 45%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "200 25% 93%",
      sidebarAccentForeground: "210 25% 25%",
      sidebarBorder: "200 18% 87%",
      sidebarRing: "205 75% 45%",
    },
    dark: {
      background: "210 30% 9%",
      foreground: "200 20% 92%",
      card: "210 28% 13%",
      cardForeground: "200 20% 92%",
      popover: "210 28% 13%",
      popoverForeground: "200 20% 92%",
      primary: "205 80% 58%",
      primaryForeground: "210 30% 9%",
      primaryLight: "205 80% 68%",
      primarySoft: "205 40% 22%",
      primaryDark: "205 80% 48%",
      secondary: "210 22% 18%",
      secondaryForeground: "200 20% 88%",
      muted: "210 20% 18%",
      mutedForeground: "200 10% 60%",
      accent: "190 65% 55%",
      accentForeground: "210 30% 9%",
      border: "210 18% 22%",
      input: "210 18% 20%",
      ring: "205 80% 58%",
      ...STATUS_DARK,
      sidebarBackground: "210 30% 11%",
      sidebarForeground: "200 20% 90%",
      sidebarPrimary: "205 80% 58%",
      sidebarPrimaryForeground: "210 30% 9%",
      sidebarAccent: "210 22% 20%",
      sidebarAccentForeground: "200 20% 80%",
      sidebarBorder: "210 18% 20%",
      sidebarRing: "205 80% 58%",
    },
  },

  sand: {
    id: "sand",
    name: "Sand",
    description: "Warm beige and bronze — editorial and refined.",
    swatch: { primary: "28 55% 45%", surface: "38 35% 96%", accent: "20 50% 50%" },
    light: {
      background: "38 35% 96%",
      foreground: "28 25% 14%",
      card: "38 40% 98%",
      cardForeground: "28 25% 14%",
      popover: "0 0% 100%",
      popoverForeground: "28 25% 14%",
      primary: "28 55% 45%",
      primaryForeground: "0 0% 100%",
      primaryLight: "28 55% 55%",
      primarySoft: "28 50% 94%",
      primaryDark: "28 55% 36%",
      secondary: "38 25% 92%",
      secondaryForeground: "28 25% 25%",
      muted: "38 20% 91%",
      mutedForeground: "28 12% 42%",
      accent: "20 50% 48%",
      accentForeground: "0 0% 100%",
      border: "38 18% 86%",
      input: "38 18% 88%",
      ring: "28 55% 45%",
      ...STATUS_LIGHT,
      sidebarBackground: "38 40% 98%",
      sidebarForeground: "28 25% 14%",
      sidebarPrimary: "28 55% 45%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "38 25% 92%",
      sidebarAccentForeground: "28 25% 25%",
      sidebarBorder: "38 18% 86%",
      sidebarRing: "28 55% 45%",
    },
    dark: {
      background: "28 18% 10%",
      foreground: "38 20% 92%",
      card: "28 16% 14%",
      cardForeground: "38 20% 92%",
      popover: "28 16% 14%",
      popoverForeground: "38 20% 92%",
      primary: "28 65% 58%",
      primaryForeground: "28 18% 10%",
      primaryLight: "28 65% 68%",
      primarySoft: "28 35% 22%",
      primaryDark: "28 65% 48%",
      secondary: "28 14% 18%",
      secondaryForeground: "38 20% 88%",
      muted: "28 12% 18%",
      mutedForeground: "38 10% 60%",
      accent: "20 55% 58%",
      accentForeground: "28 18% 10%",
      border: "28 12% 22%",
      input: "28 12% 20%",
      ring: "28 65% 58%",
      ...STATUS_DARK,
      sidebarBackground: "28 18% 12%",
      sidebarForeground: "38 20% 90%",
      sidebarPrimary: "28 65% 58%",
      sidebarPrimaryForeground: "28 18% 10%",
      sidebarAccent: "28 14% 20%",
      sidebarAccentForeground: "38 20% 80%",
      sidebarBorder: "28 12% 20%",
      sidebarRing: "28 65% 58%",
    },
  },

  lavender: {
    id: "lavender",
    name: "Lavender",
    description: "Soft violet — calm, creative, restorative.",
    swatch: { primary: "265 50% 55%", surface: "270 30% 97%", accent: "290 45% 55%" },
    light: {
      background: "270 30% 97%",
      foreground: "265 25% 14%",
      card: "270 35% 99%",
      cardForeground: "265 25% 14%",
      popover: "0 0% 100%",
      popoverForeground: "265 25% 14%",
      primary: "265 50% 55%",
      primaryForeground: "0 0% 100%",
      primaryLight: "265 55% 65%",
      primarySoft: "265 50% 95%",
      primaryDark: "265 50% 45%",
      secondary: "270 22% 93%",
      secondaryForeground: "265 25% 25%",
      muted: "270 18% 92%",
      mutedForeground: "265 10% 45%",
      accent: "290 45% 55%",
      accentForeground: "0 0% 100%",
      border: "270 18% 88%",
      input: "270 18% 90%",
      ring: "265 50% 55%",
      ...STATUS_LIGHT,
      sidebarBackground: "270 35% 99%",
      sidebarForeground: "265 25% 14%",
      sidebarPrimary: "265 50% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "270 22% 93%",
      sidebarAccentForeground: "265 25% 25%",
      sidebarBorder: "270 18% 88%",
      sidebarRing: "265 50% 55%",
    },
    dark: {
      background: "265 25% 10%",
      foreground: "270 20% 92%",
      card: "265 22% 14%",
      cardForeground: "270 20% 92%",
      popover: "265 22% 14%",
      popoverForeground: "270 20% 92%",
      primary: "265 65% 68%",
      primaryForeground: "265 25% 10%",
      primaryLight: "265 65% 76%",
      primarySoft: "265 35% 22%",
      primaryDark: "265 65% 58%",
      secondary: "265 18% 18%",
      secondaryForeground: "270 20% 88%",
      muted: "265 16% 18%",
      mutedForeground: "270 10% 62%",
      accent: "290 55% 68%",
      accentForeground: "265 25% 10%",
      border: "265 16% 22%",
      input: "265 16% 20%",
      ring: "265 65% 68%",
      ...STATUS_DARK,
      sidebarBackground: "265 25% 12%",
      sidebarForeground: "270 20% 90%",
      sidebarPrimary: "265 65% 68%",
      sidebarPrimaryForeground: "265 25% 10%",
      sidebarAccent: "265 18% 20%",
      sidebarAccentForeground: "270 20% 80%",
      sidebarBorder: "265 16% 20%",
      sidebarRing: "265 65% 68%",
    },
  },

  graphite: {
    id: "graphite",
    name: "Graphite",
    description: "Pure neutral monochrome — Linear-style precision.",
    swatch: { primary: "220 12% 22%", surface: "220 10% 97%", accent: "220 12% 30%" },
    light: {
      background: "220 12% 97%",
      foreground: "220 18% 12%",
      card: "0 0% 100%",
      cardForeground: "220 18% 12%",
      popover: "0 0% 100%",
      popoverForeground: "220 18% 12%",
      primary: "220 18% 22%",
      primaryForeground: "0 0% 100%",
      primaryLight: "220 14% 35%",
      primarySoft: "220 12% 93%",
      primaryDark: "220 20% 14%",
      secondary: "220 10% 93%",
      secondaryForeground: "220 18% 22%",
      muted: "220 10% 92%",
      mutedForeground: "220 8% 42%",
      accent: "220 14% 30%",
      accentForeground: "0 0% 100%",
      border: "220 10% 87%",
      input: "220 10% 89%",
      ring: "220 18% 22%",
      ...STATUS_LIGHT,
      sidebarBackground: "0 0% 100%",
      sidebarForeground: "220 18% 12%",
      sidebarPrimary: "220 18% 22%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "220 10% 93%",
      sidebarAccentForeground: "220 18% 22%",
      sidebarBorder: "220 10% 87%",
      sidebarRing: "220 18% 22%",
    },
    dark: {
      background: "220 14% 8%",
      foreground: "220 12% 92%",
      card: "220 12% 12%",
      cardForeground: "220 12% 92%",
      popover: "220 12% 12%",
      popoverForeground: "220 12% 92%",
      primary: "220 10% 88%",
      primaryForeground: "220 18% 12%",
      primaryLight: "220 10% 95%",
      primarySoft: "220 12% 20%",
      primaryDark: "220 10% 78%",
      secondary: "220 12% 16%",
      secondaryForeground: "220 12% 88%",
      muted: "220 10% 16%",
      mutedForeground: "220 8% 62%",
      accent: "220 12% 78%",
      accentForeground: "220 18% 12%",
      border: "220 10% 22%",
      input: "220 10% 20%",
      ring: "220 10% 88%",
      ...STATUS_DARK,
      sidebarBackground: "220 14% 10%",
      sidebarForeground: "220 12% 90%",
      sidebarPrimary: "220 10% 88%",
      sidebarPrimaryForeground: "220 18% 12%",
      sidebarAccent: "220 12% 18%",
      sidebarAccentForeground: "220 12% 80%",
      sidebarBorder: "220 10% 20%",
      sidebarRing: "220 10% 88%",
    },
  },
};

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);

// CSS variable mapping — keys here MUST match variable names in src/index.css
const VAR_MAP: Record<keyof ThemePalette, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  primaryLight: "--primary-light",
  primarySoft: "--primary-soft",
  primaryDark: "--primary-dark",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  expired: "--expired",
  expiredForeground: "--expired-foreground",
  expiredBg: "--expired-bg",
  expiring: "--expiring",
  expiringForeground: "--expiring-foreground",
  expiringBg: "--expiring-bg",
  valid: "--valid",
  validForeground: "--valid-foreground",
  validBg: "--valid-bg",
  sidebarBackground: "--sidebar-background",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};

export function applyTheme(themeId: ThemeId, mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const theme = THEMES[themeId] ?? THEMES.vermilion;
  const palette = mode === "dark" ? theme.dark : theme.light;
  const root = document.documentElement;

  for (const [key, varName] of Object.entries(VAR_MAP) as [
    keyof ThemePalette,
    string,
  ][]) {
    root.style.setProperty(varName, palette[key]);
  }

  root.classList.toggle("dark", mode === "dark");
  root.dataset.theme = themeId;
  root.dataset.themeMode = mode;
}
