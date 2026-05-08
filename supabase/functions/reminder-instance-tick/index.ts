import { corsHeaders, getServiceClient } from '../_shared/snoozeAuth.ts';

const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

interface InstancePush {
  user_id: string;
  instance_id: string;
  title: string;
  body: string;
  reminder_type: string;
  reminder_id: string;
  scheduled_for: string;
}

async function sendReminderPush(supabase: any, p: InstancePush): Promise<boolean> {
  const appId = Deno.env.get('ONESIGNAL_APP_ID');
  const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  if (!appId || !apiKey) return false;

  const [tokenRes, playerRes] = await Promise.all([
    supabase.from('notification_tokens').select('token').eq('user_id', p.user_id).eq('provider', 'onesignal'),
    supabase.from('onesignal_player_ids').select('player_id').eq('user_id', p.user_id),
  ]);

  const ids = new Set<string>();
  tokenRes.data?.forEach((t: any) => ids.add(t.token));
  playerRes.data?.forEach((r: any) => ids.add(r.player_id));
  if (ids.size === 0) return false;

  const payload = {
    app_id: appId,
    include_player_ids: [...ids],
    headings: { en: p.title },
    contents: { en: p.body },
    android_channel_id: 'reminders',
    priority: 10,
    data: {
      kind: 'reminder',
      instance_id: p.instance_id,
      reminder_type: p.reminder_type,
      reminder_id: p.reminder_id,
      scheduled_for: p.scheduled_for,
    },
    buttons: [
      { id: 'COMPLETE', text: 'Complete' },
      { id: 'SNOOZE', text: 'Snooze' },
    ],
    android_visibility: 1,
    collapse_id: `instance-${p.instance_id}`,
  };

  try {
    const res = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('OneSignal err', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('push exception', e);
    return false;
  }
}

Deno.serve(async (_req) => {
  const supabase = getServiceClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 60_000); // materialize next hour
  const lookback = new Date(now.getTime() - 5 * 60_000); // re-fire missed within 5 min

  // 1. Materialize task instances coming up soon
  const { data: dueTasks } = await supabase
    .from('tasks')
    .select('id,user_id,title,description,start_time,timezone,status,reminder_active')
    .eq('reminder_active', true)
    .neq('status', 'completed')
    .gte('start_time', lookback.toISOString())
    .lte('start_time', horizon.toISOString());

  for (const t of dueTasks ?? []) {
    await supabase
      .from('reminder_instances')
      .upsert(
        {
          user_id: t.user_id,
          reminder_type: 'task',
          reminder_id: t.id,
          scheduled_for: t.start_time,
          state: 'pending',
          timezone: t.timezone ?? 'UTC',
          metadata: { title: t.title, body: t.description ?? '' },
        },
        { onConflict: 'reminder_type,reminder_id,scheduled_for', ignoreDuplicates: true }
      );
  }

  // 2. Fire any pending instances whose effective trigger time has passed
  // Effective trigger = snoozed_until if set, else scheduled_for
  const { data: ready } = await supabase
    .from('reminder_instances')
    .select('*')
    .in('state', ['pending', 'snoozed'])
    .or(
      `and(snoozed_until.is.null,scheduled_for.lte.${now.toISOString()}),and(snoozed_until.not.is.null,snoozed_until.lte.${now.toISOString()})`
    )
    .limit(500);

  let fired = 0;
  for (const inst of ready ?? []) {
    const meta = inst.metadata ?? {};
    const ok = await sendReminderPush(supabase, {
      user_id: inst.user_id,
      instance_id: inst.id,
      title: meta.title ?? 'Reminder',
      body: meta.body ?? "You have a reminder",
      reminder_type: inst.reminder_type,
      reminder_id: inst.reminder_id,
      scheduled_for: inst.scheduled_for,
    });

    await supabase
      .from('reminder_instances')
      .update({
        state: 'fired',
        fired_at: now.toISOString(),
        snoozed_until: null,
      })
      .eq('id', inst.id);

    if (ok) fired += 1;
  }

  // 3. Expire stale instances (over 24h past trigger and never completed)
  const stale = new Date(now.getTime() - 24 * 60 * 60_000).toISOString();
  await supabase
    .from('reminder_instances')
    .update({ state: 'expired' })
    .in('state', ['pending', 'snoozed', 'fired'])
    .lt('scheduled_for', stale);

  return new Response(
    JSON.stringify({ ok: true, materialized: dueTasks?.length ?? 0, fired }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
