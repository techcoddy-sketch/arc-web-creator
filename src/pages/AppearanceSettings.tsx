import { ArrowLeft, Check, Monitor, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { SafeAreaContainer } from "@/components/layout/SafeAreaContainer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { THEME_LIST, type ThemeMode } from "@/lib/themes";
import { cn } from "@/lib/utils";

const modeOptions: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

export default function AppearanceSettings() {
  const { theme, mode, resolvedMode, setTheme, setMode } = useTheme();

  return (
    <SafeAreaContainer>
      <div className="min-h-screen flex flex-col w-full bg-background pb-24">
        <header className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl border-b border-border/60">
          <div className="flex items-center gap-3 px-4 h-14">
            <Link to="/profile" aria-label="Back to profile">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">Appearance</h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 w-full max-w-full overflow-x-hidden space-y-8">
          {/* Mode */}
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Mode</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Currently {resolvedMode === "dark" ? "dark" : "light"}
                {mode === "system" ? " (matching your system)" : ""}.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-muted/60 border border-border/60">
              {modeOptions.map(({ id, label, Icon }) => {
                const active = mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-medium transition-all",
                      active
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Themes */}
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Theme</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tap a theme to apply it instantly. Your choice syncs across devices.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {THEME_LIST.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "group relative text-left rounded-2xl p-3 border transition-all duration-200 ease-out",
                      "hover:-translate-y-0.5 hover:shadow-card-hover",
                      active
                        ? "border-primary ring-2 ring-primary/30 shadow-card-hover"
                        : "border-border/60 shadow-card"
                    )}
                    style={{ background: t.swatch.surface }}
                    aria-pressed={active}
                  >
                    {/* Preview swatch */}
                    <div
                      className="relative h-20 rounded-xl overflow-hidden border border-black/5"
                      style={{ background: t.swatch.bg }}
                    >
                      <div
                        className="absolute left-2 right-2 bottom-2 h-2.5 rounded-full"
                        style={{ background: t.swatch.primary }}
                      />
                      <div
                        className="absolute left-2 top-2 h-3 w-3 rounded-full"
                        style={{ background: t.swatch.accent }}
                      />
                      <div
                        className="absolute right-2 top-2 h-3 w-8 rounded-full opacity-70"
                        style={{ background: t.swatch.surface }}
                      />
                      {active && (
                        <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{t.name}</span>
                        {active && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <p className="text-[11px] text-muted-foreground text-center pt-2">
            More personalization options coming soon — custom accents, scheduled themes, and more.
          </p>
        </main>

        <BottomNavigation />
      </div>
    </SafeAreaContainer>
  );
}