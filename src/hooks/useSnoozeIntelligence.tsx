import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getOrderedPresets, type SnoozePreset, type UsageRow } from "@/utils/snoozeEngine";

export function useSnoozeIntelligence(timezone?: string) {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("snooze_usage")
        .select("duration_minutes,used_count")
        .eq("user_id", user.id)
        .order("used_count", { ascending: false })
        .limit(20);
      if (!cancelled) setUsage((data ?? []) as UsageRow[]);
    })();

    const channel = supabase
      .channel(`snooze-usage:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "snooze_usage", filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from("snooze_usage")
            .select("duration_minutes,used_count")
            .eq("user_id", user.id)
            .order("used_count", { ascending: false })
            .limit(20);
          setUsage((data ?? []) as UsageRow[]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const presets: SnoozePreset[] = getOrderedPresets(usage, timezone);
  return { presets, usage };
}
