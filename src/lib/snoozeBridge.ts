import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mirrors the Supabase auth session into Capacitor Preferences so the native
 * snooze dialog (which runs without launching the JS app) can authenticate
 * its calls to the snooze edge function.
 */
const NS = "remonk.auth";

async function writeSession() {
  if (!Capacitor.isNativePlatform()) return;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const url = (import.meta as any).env?.VITE_SUPABASE_URL ?? "";
  const anon = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

  await Promise.all([
    Preferences.set({ key: `${NS}.access_token`, value: session?.access_token ?? "" }),
    Preferences.set({ key: `${NS}.refresh_token`, value: session?.refresh_token ?? "" }),
    Preferences.set({ key: `${NS}.user_id`, value: session?.user?.id ?? "" }),
    Preferences.set({ key: `${NS}.supabase_url`, value: url }),
    Preferences.set({ key: `${NS}.anon_key`, value: anon }),
  ]);
}

let started = false;
export function initSnoozeBridge() {
  if (started) return;
  started = true;
  writeSession();
  supabase.auth.onAuthStateChange(() => {
    writeSession();
  });
}
