import { useMemo } from "react";
import { Sparkles, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIntelligence } from "@/hooks/useIntelligence";
import { cn } from "@/lib/utils";

interface AdaptiveSnoozeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the chosen snooze duration in minutes (or "tonight"/"tomorrow"). */
  onSnooze: (value: number | "tonight" | "tomorrow") => void;
  /** Optional entity context to log alongside the event. */
  entityType?: "task" | "document_reminder" | "routine_step";
  entityId?: string;
  title?: string;
}

const BASE_PRESETS: Array<{ label: string; value: number | "tonight" | "tomorrow" }> = [
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "Tonight", value: "tonight" },
  { label: "Tomorrow", value: "tomorrow" },
];

export function AdaptiveSnoozeSheet({
  open,
  onOpenChange,
  onSnooze,
  entityType,
  entityId,
  title,
}: AdaptiveSnoozeSheetProps) {
  const { prefs, logEvent, enabled } = useIntelligence();

  // Reorder presets so learned top durations appear first.
  const orderedPresets = useMemo(() => {
    if (!enabled || prefs.topSnoozeDurations.length === 0) return BASE_PRESETS;
    const top = new Set(prefs.topSnoozeDurations);
    const matched = BASE_PRESETS.filter(
      (p) => typeof p.value === "number" && top.has(p.value as number),
    ).sort((a, b) => {
      const ai = prefs.topSnoozeDurations.indexOf(a.value as number);
      const bi = prefs.topSnoozeDurations.indexOf(b.value as number);
      return ai - bi;
    });
    const rest = BASE_PRESETS.filter((p) => !matched.includes(p));
    return [...matched, ...rest];
  }, [enabled, prefs.topSnoozeDurations]);

  const suggested = enabled ? prefs.topSnoozeDurations[0] : undefined;

  const handle = (value: number | "tonight" | "tomorrow") => {
    if (typeof value === "number") {
      void logEvent({
        type: "snooze",
        snooze_minutes: value,
        entity_type: entityType,
        entity_id: entityId,
      });
    }
    onSnooze(value);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5" />
            Snooze {title ? `“${title}”` : "reminder"}
          </SheetTitle>
          <SheetDescription>
            {enabled && prefs.sampleSize >= 3
              ? "Personalized to your habits."
              : "Pick how long you'd like to wait."}
          </SheetDescription>
        </SheetHeader>

        {enabled && prefs.fatigueDetected && (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            You've been snoozing or skipping a lot of reminders lately. Consider adjusting
            this reminder's schedule for a better fit.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-5 pb-2">
          {orderedPresets.map((p) => {
            const isSuggested = suggested !== undefined && p.value === suggested;
            return (
              <Button
                key={String(p.value)}
                variant={isSuggested ? "default" : "outline"}
                onClick={() => handle(p.value)}
                className={cn(
                  "h-12 justify-between text-foreground",
                  isSuggested && "ring-1 ring-primary/40",
                )}
              >
                <span>{p.label}</span>
                {isSuggested && (
                  <Badge variant="secondary" className="gap-1 text-[10px] font-normal">
                    <Sparkles className="h-3 w-3" />
                    Suggested
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
