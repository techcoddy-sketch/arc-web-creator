import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  clearAllEvents,
  getAllEvents,
  isIntelligenceEnabled,
  logEvent as logEventInternal,
  setIntelligenceEnabled as persistEnabled,
  type BehaviorEvent,
} from "@/lib/intelligence/store";
import { analyze, emptyPreferences, type LearnedPreferences } from "@/lib/intelligence/analyzer";
import {
  clearSyncTimestamp,
  fetchRemotePreferences,
  syncLearnedPreferences,
} from "@/lib/intelligence/sync";

/**
 * Adaptive intelligence layer hook.
 * - Reads/writes a feature flag in localStorage
 * - Recomputes learned preferences from local events
 * - Periodically syncs aggregates to Supabase (cross-device learning)
 */
export function useIntelligence() {
  const { user } = useAuth();
  const [enabled, setEnabledState] = useState(true);
  const [prefs, setPrefs] = useState<LearnedPreferences>(emptyPreferences());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const on = await isIntelligenceEnabled();
    setEnabledState(on);
    if (!on) {
      setPrefs(emptyPreferences());
      setLoading(false);
      return;
    }
    const events = await getAllEvents();
    let local = analyze(events);
    // Hydrate from remote if local is empty (new device)
    if (local.sampleSize === 0 && user) {
      const remote = await fetchRemotePreferences(user.id);
      if (remote) local = remote;
    }
    setPrefs(local);
    setLoading(false);
    if (user && local.sampleSize > 0) {
      void syncLearnedPreferences(user.id, local);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logEvent = useCallback(async (evt: Omit<BehaviorEvent, "ts" | "hour">) => {
    await logEventInternal(evt);
    // Lightweight refresh; actual recompute is cheap.
    if (Math.random() < 0.2) void refresh();
  }, [refresh]);

  const setEnabled = useCallback((v: boolean) => {
    persistEnabled(v);
    setEnabledState(v);
    if (!v) setPrefs(emptyPreferences());
    else void refresh();
  }, [refresh]);

  const reset = useCallback(async () => {
    await clearAllEvents();
    clearSyncTimestamp();
    setPrefs(emptyPreferences());
    if (user) {
      await syncLearnedPreferences(user.id, emptyPreferences(), true);
    }
  }, [user]);

  return { enabled, setEnabled, prefs, loading, logEvent, reset, refresh };
}
