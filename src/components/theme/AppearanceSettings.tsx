import { Check, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { PALETTES, ThemeMode } from "@/lib/themePalettes";
import { useThemePreference } from "@/components/theme/ThemePreferenceProvider";

const MODES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function AppearanceSettings() {
  const { palette, mode, setPalette, setMode, previewPalette } = useThemePreference();

  const resolvedDark =
    mode === "dark" ||
    (mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="space-y-6 p-4">
      {/* Mode selector */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Appearance mode</p>
          <p className="text-xs text-muted-foreground">
            Light, Dark, or follow your device.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 p-1 bg-muted/60 rounded-2xl">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl smooth text-xs font-medium",
                  active
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={active}
                aria-label={`Use ${label.toLowerCase()} mode`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette selector */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Accent palette</p>
          <p className="text-xs text-muted-foreground">
            Hover to preview, tap to apply. Status colors stay consistent.
          </p>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          onMouseLeave={() => previewPalette(null)}
        >
          {PALETTES.map((p) => {
            const active = palette === p.id;
            const swatch = resolvedDark ? p.swatch.dark : p.swatch.light;
            const [bg, surface, primary, accent] = swatch;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(p.id)}
                onMouseEnter={() => previewPalette(p.id)}
                onFocus={() => previewPalette(p.id)}
                onBlur={() => previewPalette(null)}
                className={cn(
                  "group relative text-left rounded-2xl border smooth overflow-hidden",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-foreground/20"
                )}
                aria-pressed={active}
                aria-label={`Apply ${p.name} palette`}
              >
                {/* Mini preview surface */}
                <div
                  className="relative h-20 px-3 py-2.5 flex flex-col justify-between"
                  style={{ background: bg }}
                >
                  <div
                    className="h-3 w-12 rounded-full"
                    style={{ background: surface, border: "1px solid rgba(0,0,0,0.06)" }}
                  />
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-5 w-5 rounded-full ring-1 ring-black/5"
                      style={{ background: primary }}
                    />
                    <span
                      className="h-5 w-5 rounded-full ring-1 ring-black/5"
                      style={{ background: accent }}
                    />
                    <span
                      className="h-2.5 flex-1 rounded-full"
                      style={{ background: surface, border: "1px solid rgba(0,0,0,0.06)" }}
                    />
                  </div>
                  {active && (
                    <span
                      className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="px-3 py-2 bg-card">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {p.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview strip */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Live preview
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(var(--valid-bg))] text-[hsl(var(--valid))]">
            Valid
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(var(--expiring-bg))] text-[hsl(var(--expiring))]">
            Expiring soon
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(var(--expired-bg))] text-[hsl(var(--expired))]">
            Expired
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
          >
            Primary action
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground bg-background"
          >
            Secondary
          </button>
          <span className="ml-auto text-xs text-muted-foreground">
            Heading & body type stay legible across themes.
          </span>
        </div>
      </div>
    </div>
  );
}
