export type PaletteId =
  | "vermilion"
  | "indigo"
  | "emerald"
  | "slate"
  | "rose"
  | "amber"
  | "teal";

export type ThemeMode = "light" | "dark" | "system";

export interface PalettePreset {
  id: PaletteId;
  name: string;
  description: string;
  /** Swatch shown in picker — [bg, surface, primary, accent] HSL strings */
  swatch: { light: [string, string, string, string]; dark: [string, string, string, string] };
}

export const PALETTES: PalettePreset[] = [
  {
    id: "vermilion",
    name: "Vermilion",
    description: "Warm signature accent. The Remonk default.",
    swatch: {
      light: ["hsl(40 25% 97%)", "hsl(40 30% 99%)", "hsl(10 78% 53%)", "hsl(10 80% 62%)"],
      dark: ["hsl(220 20% 10%)", "hsl(220 18% 14%)", "hsl(10 78% 55%)", "hsl(10 80% 64%)"],
    },
  },
  {
    id: "indigo",
    name: "Indigo",
    description: "Calm, focused. Great for deep work.",
    swatch: {
      light: ["hsl(40 25% 97%)", "hsl(40 30% 99%)", "hsl(238 70% 58%)", "hsl(238 75% 68%)"],
      dark: ["hsl(220 20% 10%)", "hsl(220 18% 14%)", "hsl(238 75% 65%)", "hsl(238 80% 72%)"],
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Fresh and productive.",
    swatch: {
      light: ["hsl(40 25% 97%)", "hsl(40 30% 99%)", "hsl(158 64% 38%)", "hsl(158 60% 48%)"],
      dark: ["hsl(220 20% 10%)", "hsl(220 18% 14%)", "hsl(158 60% 48%)", "hsl(158 65% 56%)"],
    },
  },
  {
    id: "teal",
    name: "Teal",
    description: "Quiet, clinical clarity.",
    swatch: {
      light: ["hsl(40 25% 97%)", "hsl(40 30% 99%)", "hsl(178 65% 36%)", "hsl(178 60% 46%)"],
      dark: ["hsl(220 20% 10%)", "hsl(220 18% 14%)", "hsl(178 60% 46%)", "hsl(178 65% 56%)"],
    },
  },
  {
    id: "rose",
    name: "Rose",
    description: "Warm, gentle, personal.",
    swatch: {
      light: ["hsl(40 25% 97%)", "hsl(40 30% 99%)", "hsl(346 70% 52%)", "hsl(346 75% 64%)"],
      dark: ["hsl(220 20% 10%)", "hsl(220 18% 14%)", "hsl(346 75% 60%)", "hsl(346 80% 68%)"],
    },
  },
  {
    id: "amber",
    name: "Amber",
    description: "Golden, optimistic energy.",
    swatch: {
      light: ["hsl(40 25% 97%)", "hsl(40 30% 99%)", "hsl(32 85% 48%)", "hsl(32 90% 58%)"],
      dark: ["hsl(220 20% 10%)", "hsl(220 18% 14%)", "hsl(32 85% 56%)", "hsl(32 90% 64%)"],
    },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Editorial neutral. Maximum restraint.",
    swatch: {
      light: ["hsl(40 25% 97%)", "hsl(40 30% 99%)", "hsl(220 25% 28%)", "hsl(220 20% 42%)"],
      dark: ["hsl(220 20% 10%)", "hsl(220 18% 14%)", "hsl(220 20% 75%)", "hsl(220 20% 82%)"],
    },
  },
];

export const DEFAULT_PALETTE: PaletteId = "vermilion";
export const DEFAULT_MODE: ThemeMode = "system";
