import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface OnboardingPreferences {
  theme?: "light" | "dark" | "system";
  defaultSnoozeMinutes?: number;
  notificationsRequested?: boolean;
}

export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCompleted(true); // not logged in → don't show overlay
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setCompleted(Boolean(data?.onboarding_completed));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const finish = useCallback(
    async (prefs: OnboardingPreferences = {}) => {
      if (!user) return;
      setCompleted(true);
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_preferences: prefs as any,
        })
        .eq("user_id", user.id);
    },
    [user]
  );

  return { showOnboarding: completed === false, loading, finish };
}
