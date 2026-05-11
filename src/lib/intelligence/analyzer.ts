/**
 * Intelligence Layer — derive learned preferences from raw events.
 * Pure functions, cheap to run on-device.
 */
import type { BehaviorEvent } from "./store";

export interface LearnedPreferences {
  /** Top snooze durations in minutes, ordered by frequency. */
  topSnoozeDurations: number[];
  /** Hour-of-day buckets where the user is most responsive (completes tasks). */
  activeHours: number[];
  /** True if the user is showing reminder fatigue lately. */
  fatigueDetected: boolean;
  /** Total events analyzed. */
  sampleSize: number;
  /** When this snapshot was computed. */
  computedAt: string;
}

const DEFAULT_SNOOZES = [15, 60];

export function emptyPreferences(): LearnedPreferences {
  return {
    topSnoozeDurations: DEFAULT_SNOOZES,
    activeHours: [],
    fatigueDetected: false,
    sampleSize: 0,
    computedAt: new Date().toISOString(),
  };
}

/** Group similar snooze durations into buckets (e.g. 27 and 30 -> 30). */
function bucketSnooze(min: number): number {
  if (min <= 5) return 5;
  if (min <= 10) return 10;
  if (min <= 20) return 15;
  if (min <= 45) return 30;
  if (min <= 75) return 60;
  if (min <= 150) return 120;
  if (min <= 360) return 240;
  return Math.round(min / 60) * 60;
}

export function analyze(events: BehaviorEvent[]): LearnedPreferences {
  if (events.length === 0) return emptyPreferences();

  // ---- Snooze durations ----
  const snoozeCounts = new Map<number, number>();
  for (const e of events) {
    if (e.type === "snooze" && typeof e.snooze_minutes === "number") {
      const b = bucketSnooze(e.snooze_minutes);
      snoozeCounts.set(b, (snoozeCounts.get(b) ?? 0) + 1);
    }
  }
  const topSnoozeDurations = [...snoozeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([m]) => m);

  // ---- Active hours (when completes happen) ----
  const hourCounts = new Array(24).fill(0);
  let completes = 0;
  for (const e of events) {
    if (e.type === "complete") {
      hourCounts[e.hour] = (hourCounts[e.hour] ?? 0) + 1;
      completes++;
    }
  }
  const avg = completes / 24;
  const activeHours = hourCounts
    .map((c, h) => ({ c, h }))
    .filter((x) => x.c > avg && x.c >= 2)
    .sort((a, b) => b.c - a.c)
    .slice(0, 6)
    .map((x) => x.h)
    .sort((a, b) => a - b);

  // ---- Fatigue: in last 7 days, ignores >> completes ----
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let recentIgnore = 0;
  let recentComplete = 0;
  let recentSnooze = 0;
  for (const e of events) {
    if (new Date(e.ts).getTime() < cutoff) continue;
    if (e.type === "ignore") recentIgnore++;
    else if (e.type === "complete") recentComplete++;
    else if (e.type === "snooze") recentSnooze++;
  }
  const totalRecent = recentIgnore + recentComplete + recentSnooze;
  const fatigueDetected =
    totalRecent >= 10 && (recentIgnore + recentSnooze) / totalRecent > 0.6;

  return {
    topSnoozeDurations: topSnoozeDurations.length ? topSnoozeDurations : DEFAULT_SNOOZES,
    activeHours,
    fatigueDetected,
    sampleSize: events.length,
    computedAt: new Date().toISOString(),
  };
}
