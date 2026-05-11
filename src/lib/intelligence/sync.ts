/**
 * Intelligence Layer — periodic aggregate sync to Supabase.
 * Only learned aggregates are sent; raw events stay local.
 */
import { supabase } from "@/integrations/supabase/client";
import type { LearnedPreferences } from "./analyzer";

const SYNC_KEY = "intelligence_last_sync";
const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

export async function syncLearnedPreferences(
  userId: string,
  prefs: LearnedPreferences,
  force = false,
): Promise<void> {
  try {
    if (!force) {
      const last = Number(localStorage.getItem(SYNC_KEY) ?? "0");
      if (Date.now() - last < MIN_INTERVAL_MS) return;
    }
    const { error } = await supabase
      .from("learned_preferences")
      .upsert(
        { user_id: userId, data: prefs as any, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) {
      console.warn("[intelligence] sync error", error);
      return;
    }
    localStorage.setItem(SYNC_KEY, String(Date.now()));
  } catch (e) {
    console.warn("[intelligence] sync failed", e);
  }
}

export async function fetchRemotePreferences(userId: string): Promise<LearnedPreferences | null> {
  try {
    const { data, error } = await supabase
      .from("learned_preferences")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data.data as unknown as LearnedPreferences;
  } catch {
    return null;
  }
}

export function clearSyncTimestamp() {
  try {
    localStorage.removeItem(SYNC_KEY);
  } catch {}
}
