import { useState } from "react";
import { Sparkles, RotateCcw, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIntelligence } from "@/hooks/useIntelligence";
import { cn } from "@/lib/utils";

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  if (m % 60 === 0) return `${m / 60} hr`;
  return `${Math.round((m / 60) * 10) / 10} hr`;
}

function formatHour(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh} ${ampm}`;
}

/**
 * Profile section: user-facing controls for the adaptive intelligence layer.
 * - Toggle on/off
 * - Show what has been learned (snooze prefs, active hours, fatigue)
 * - Reset learned data
 */
export function PersonalizationSection() {
  const { enabled, setEnabled, prefs, reset } = useIntelligence();
  const [open, setOpen] = useState(false);

  const hasData = prefs.sampleSize > 0;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left border-b border-border/50 last:border-0"
      >
        <div className="flex items-center justify-between p-4 hover:bg-accent/5 smooth cursor-pointer group">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <div>
              <span className="text-foreground font-medium block">Personalization</span>
              <span className="text-xs text-muted-foreground">
                Adaptive reminders that learn from you
              </span>
            </div>
          </div>
          <ChevronRight
            className={cn(
              "h-5 w-5 text-muted-foreground smooth",
              open ? "rotate-90" : "group-hover:translate-x-1",
            )}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4 animate-fade-in">
          {/* Master toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-3">
            <div className="pr-3">
              <p className="text-sm font-medium text-foreground">Adaptive intelligence</p>
              <p className="text-xs text-muted-foreground">
                Quietly learns your snooze and timing patterns to make reminders feel more natural.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* What we've learned */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What Remonk has learned
            </p>

            {!enabled ? (
              <p className="text-sm text-muted-foreground">
                Personalization is off. Turn it on to let Remonk gently adapt to your habits.
              </p>
            ) : !hasData ? (
              <p className="text-sm text-muted-foreground">
                Nothing yet — keep using reminders and Remonk will start adapting after a few interactions.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Preferred snooze durations</p>
                  <div className="flex flex-wrap gap-2">
                    {prefs.topSnoozeDurations.map((m, i) => (
                      <span
                        key={m}
                        className={cn(
                          "px-2 py-1 rounded-md text-xs",
                          i === 0
                            ? "bg-primary/15 text-foreground font-medium"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {formatMinutes(m)}
                      </span>
                    ))}
                  </div>
                </div>

                {prefs.activeHours.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">You're most responsive at</p>
                    <div className="flex flex-wrap gap-2">
                      {prefs.activeHours.map((h) => (
                        <span
                          key={h}
                          className="px-2 py-1 rounded-md text-xs bg-muted text-foreground"
                        >
                          {formatHour(h)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {prefs.fatigueDetected && (
                  <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                    A lot of recent reminders have been snoozed or skipped. Consider adjusting their schedules.
                  </p>
                )}

                <p className="text-[10px] text-muted-foreground">
                  Based on {prefs.sampleSize} on-device interactions. Raw activity stays on this device; only summaries sync.
                </p>
              </div>
            )}
          </div>

          {/* Reset */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-foreground">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset learned behavior
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset learned behavior?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears everything Remonk has learned about your habits. Personalization will restart from scratch.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => reset()}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
