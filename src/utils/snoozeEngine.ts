import { addMinutes, format, setHours, setMinutes, addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export type SnoozeUnit = "min" | "hour" | "day" | "week";

export interface SnoozePreset {
  id: string;
  label: string;
  minutes: number;
  isCustom?: boolean;
}

export const UNIT_TO_MIN: Record<SnoozeUnit, number> = {
  min: 1,
  hour: 60,
  day: 60 * 24,
  week: 60 * 24 * 7,
};

export function toMinutes(value: number, unit: SnoozeUnit): number {
  return Math.max(1, Math.floor(value * UNIT_TO_MIN[unit]));
}

/** Compute next trigger time given snooze duration in minutes */
export function computeNextTrigger(minutes: number, from: Date = new Date()): Date {
  return addMinutes(from, minutes);
}

/** Live preview: "Snoozed until 7:42 PM" or "Tomorrow at 9:00 AM" */
export function formatSnoozePreview(minutes: number, timezone?: string): string {
  const target = computeNextTrigger(minutes);
  const today = new Date();
  const sameDay =
    target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear();

  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const time = formatInTimeZone(target, tz, "h:mm a");

  if (sameDay) return `Snoozed until ${time}`;
  const dayLabel = formatInTimeZone(target, tz, "EEE, MMM d");
  return `Snoozed until ${dayLabel}, ${time}`;
}

/** Tonight = 21:00 local. If past 21:00, then +1h from now. */
export function minutesUntilTonight(timezone?: string): number {
  const now = new Date();
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Build "tonight 21:00" in user tz
  const localNowStr = formatInTimeZone(now, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const localNow = new Date(localNowStr);
  let target = setMinutes(setHours(localNow, 21), 0);
  if (target <= localNow) target = addMinutes(localNow, 60);
  return Math.max(1, Math.round((target.getTime() - localNow.getTime()) / 60000));
}

/** Tomorrow morning = next 09:00 local */
export function minutesUntilTomorrowMorning(timezone?: string): number {
  const now = new Date();
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localNowStr = formatInTimeZone(now, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const localNow = new Date(localNowStr);
  const target = setMinutes(setHours(addDays(localNow, 1), 9), 0);
  return Math.max(1, Math.round((target.getTime() - localNow.getTime()) / 60000));
}

const DEFAULT_PRESETS = (tz?: string): SnoozePreset[] => [
  { id: "5m", label: "5 min", minutes: 5 },
  { id: "15m", label: "15 min", minutes: 15 },
  { id: "30m", label: "30 min", minutes: 30 },
  { id: "1h", label: "1 hour", minutes: 60 },
  { id: "tonight", label: "Tonight", minutes: minutesUntilTonight(tz) },
  { id: "morning", label: "Tomorrow AM", minutes: minutesUntilTomorrowMorning(tz) },
];

export interface UsageRow {
  duration_minutes: number;
  used_count: number;
}

/** Merge defaults with user's most-used custom durations (≥2 uses, top 3) */
export function getOrderedPresets(usage: UsageRow[], timezone?: string): SnoozePreset[] {
  const defaults = DEFAULT_PRESETS(timezone);
  const defaultMins = new Set(defaults.map((d) => d.minutes));

  const top = [...usage]
    .filter((u) => u.used_count >= 2 && !defaultMins.has(u.duration_minutes))
    .sort((a, b) => b.used_count - a.used_count)
    .slice(0, 3)
    .map<SnoozePreset>((u) => ({
      id: `c${u.duration_minutes}`,
      label: humanizeMinutes(u.duration_minutes),
      minutes: u.duration_minutes,
      isCustom: true,
    }));

  // Combine, then sort whole list by usage frequency to surface most-used first
  const usageMap = new Map(usage.map((u) => [u.duration_minutes, u.used_count]));
  const combined = [...top, ...defaults];
  combined.sort((a, b) => (usageMap.get(b.minutes) ?? 0) - (usageMap.get(a.minutes) ?? 0));
  return combined.slice(0, 6);
}

export function humanizeMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  if (mins < 60 * 24) {
    const h = mins / 60;
    return Number.isInteger(h) ? `${h} hr` : `${h.toFixed(1)} hr`;
  }
  if (mins < 60 * 24 * 7) {
    const d = Math.round(mins / (60 * 24));
    return `${d} day${d > 1 ? "s" : ""}`;
  }
  const w = Math.round(mins / (60 * 24 * 7));
  return `${w} week${w > 1 ? "s" : ""}`;
}
