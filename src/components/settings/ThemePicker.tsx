import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { THEME_LIST } from "@/lib/themes";
import { useTheme, type ThemeModePreference } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: { value: ThemeModePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemePicker() {
  const { themeId, modePreference, setTheme, setModePreference, previewTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <p className="text-sm text-muted-foreground">
          Personalize Remonk while keeping the interface calm and readable.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode toggle */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = modePreference === value;
              return (
                <Button
                  key={value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className={cn(
                    "h-auto py-3 flex-col gap-1.5 smooth text-foreground hover:text-foreground",
                    active && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                  )}
                  onClick={() => setModePreference(value)}
                >
                  <Icon className="h-4 w-4 text-foreground" />
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Theme grid */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Theme</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEME_LIST.map((t) => {
              const active = themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  onMouseEnter={() => previewTheme(t.id)}
                  onMouseLeave={() => previewTheme(null)}
                  onFocus={() => previewTheme(t.id)}
                  onBlur={() => previewTheme(null)}
                  className={cn(
                    "group relative text-left rounded-xl border bg-card p-3 smooth",
                    "hover:shadow-card-hover hover:-translate-y-0.5",
                    active
                      ? "border-primary ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border",
                  )}
                  aria-pressed={active}
                  aria-label={`Apply ${t.name} theme`}
                >
                  <div
                    className="h-14 w-full rounded-lg overflow-hidden border border-border/60 flex"
                    style={{ background: `hsl(${t.swatch.surface})` }}
                  >
                    <div
                      className="flex-1"
                      style={{ background: `hsl(${t.swatch.surface})` }}
                    />
                    <div
                      className="w-1/3"
                      style={{ background: `hsl(${t.swatch.primary})` }}
                    />
                    <div
                      className="w-1/4"
                      style={{ background: `hsl(${t.swatch.accent})` }}
                    />
                  </div>
                  <div className="mt-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                        {t.description}
                      </p>
                    </div>
                    {active && (
                      <span className="shrink-0 rounded-full bg-primary text-primary-foreground p-1">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Hover a theme to preview. Click to apply — your choice is saved on this device.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
