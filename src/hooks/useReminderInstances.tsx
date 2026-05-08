import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ReminderInstance {
  id: string;
  user_id: string;
  reminder_type: "task" | "routine_step";
  reminder_id: string;
  scheduled_for: string;
  snoozed_until: string | null;
  state: "pending" | "snoozed" | "completed" | "expired" | "dismissed" | "fired";
  snooze_count: number;
  completed_at: string | null;
  fired_at: string | null;
  timezone: string;
  metadata: Record<string, unknown>;
}

const QUEUE_KEY = "remonk.snooze.queue.v1";

interface QueuedAction {
  id: string;
  fn: "reminder-instance-snooze" | "reminder-instance-complete" | "reminder-instance-dismiss";
  body: Record<string, unknown>;
  client_event_at: string;
}

function loadQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveQueue(q: QueuedAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

async function flushQueue() {
  const q = loadQueue();
  if (q.length === 0) return;
  const remaining: QueuedAction[] = [];
  for (const item of q) {
    try {
      const { error } = await supabase.functions.invoke(item.fn, { body: item.body });
      if (error) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  saveQueue(remaining);
}

export function useReminderInstances() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [instances, setInstances] = useState<ReminderInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("reminder_instances")
        .select("*")
        .eq("user_id", user.id)
        .in("state", ["pending", "snoozed", "fired"])
        .order("scheduled_for", { ascending: true })
        .limit(200);
      if (!cancelled) {
        setInstances((data ?? []) as ReminderInstance[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Realtime sync across devices
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`reminder-instances:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reminder_instances", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setInstances((prev) => {
            const next = [...prev];
            if (payload.eventType === "DELETE") {
              return next.filter((i) => i.id !== (payload.old as any).id);
            }
            const row = payload.new as ReminderInstance;
            const idx = next.findIndex((i) => i.id === row.id);
            if (idx >= 0) next[idx] = row;
            else next.push(row);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Flush offline queue when online
  useEffect(() => {
    const onOnline = () => flushQueue();
    window.addEventListener("online", onOnline);
    if (navigator.onLine) flushQueue();
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const callOrQueue = useCallback(
    async (
      fn: QueuedAction["fn"],
      body: Record<string, unknown>
    ): Promise<{ ok: boolean; queued: boolean }> => {
      const client_event_at = new Date().toISOString();
      const payload = { ...body, client_event_at };
      if (!navigator.onLine) {
        const q = loadQueue();
        q.push({ id: crypto.randomUUID(), fn, body: payload, client_event_at });
        saveQueue(q);
        return { ok: true, queued: true };
      }
      try {
        const { error } = await supabase.functions.invoke(fn, { body: payload });
        if (error) {
          const q = loadQueue();
          q.push({ id: crypto.randomUUID(), fn, body: payload, client_event_at });
          saveQueue(q);
          return { ok: false, queued: true };
        }
        return { ok: true, queued: false };
      } catch {
        const q = loadQueue();
        q.push({ id: crypto.randomUUID(), fn, body: payload, client_event_at });
        saveQueue(q);
        return { ok: false, queued: true };
      }
    },
    []
  );

  const snooze = useCallback(
    async (instanceId: string, snoozeMinutes: number, source: string = "manual") => {
      // Optimistic update
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId
            ? {
                ...i,
                state: "snoozed",
                snoozed_until: new Date(Date.now() + snoozeMinutes * 60_000).toISOString(),
                snooze_count: (i.snooze_count ?? 0) + 1,
              }
            : i
        )
      );
      const res = await callOrQueue("reminder-instance-snooze", {
        instance_id: instanceId,
        snooze_minutes: snoozeMinutes,
        source,
      });
      if (res.queued && !navigator.onLine) {
        toast({ title: "Snoozed offline", description: "Will sync when you're back online." });
      }
      return res;
    },
    [callOrQueue, toast]
  );

  const complete = useCallback(
    async (instanceId: string) => {
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId
            ? { ...i, state: "completed", completed_at: new Date().toISOString() }
            : i
        )
      );
      return callOrQueue("reminder-instance-complete", { instance_id: instanceId });
    },
    [callOrQueue]
  );

  const dismiss = useCallback(
    async (instanceId: string) => {
      setInstances((prev) =>
        prev.map((i) => (i.id === instanceId ? { ...i, state: "dismissed" } : i))
      );
      return callOrQueue("reminder-instance-dismiss", { instance_id: instanceId });
    },
    [callOrQueue]
  );

  return { instances, loading, snooze, complete, dismiss };
}
