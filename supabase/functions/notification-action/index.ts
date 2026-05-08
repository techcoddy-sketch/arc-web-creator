import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsOptions, createJsonResponse, createErrorResponse } from '../_shared/cors.ts';

type EntityType = 'task' | 'document_reminder' | 'routine_step';
type ActionType = 'complete' | 'snooze';

interface ActionBody {
  entity_type: EntityType;
  entity_id: string;
  action: ActionType;
  /** Required when action === 'snooze'. Allowed: 15, 60, 'tonight', 'tomorrow' or any positive int. */
  snooze?: number | 'tonight' | 'tomorrow';
}

const SNOOZE_PRESETS = new Set(['tonight', 'tomorrow']);

function computeSnoozeUntil(snooze: ActionBody['snooze'], timezone: string): Date {
  const now = new Date();
  if (typeof snooze === 'number' && snooze > 0) {
    return new Date(now.getTime() + snooze * 60_000);
  }
  // For 'tonight' / 'tomorrow' compute in user's timezone using Intl
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, p.value])
  );
  const y = +parts.year, m = +parts.month, d = +parts.day;

  // Build a Date that, when interpreted in `timezone`, equals target wall-clock.
  // Approximation: build ISO with no zone, interpret as UTC, then offset-correct
  // using the difference between now-in-zone and now-in-utc.
  const targetWall = snooze === 'tonight'
    ? { hh: 20, mm: 0 }
    : { hh: 9, mm: 0 };

  // Naive UTC date for the target wall time
  const naiveTarget = new Date(Date.UTC(
    y, m - 1, snooze === 'tomorrow' ? d + 1 : d,
    targetWall.hh, targetWall.mm, 0
  ));

  // Compute timezone offset at "now" for the given zone
  const nowZoneStr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(now);
  // Parse "MM/DD/YYYY, HH:mm:ss"
  const [datePart, timePart] = nowZoneStr.split(', ');
  const [mo, da, ye] = datePart.split('/').map(Number);
  const [hh, mi, se] = timePart.split(':').map(Number);
  const zoneAsUtc = Date.UTC(ye, mo - 1, da, hh, mi, se);
  const offsetMs = zoneAsUtc - now.getTime(); // zone is ahead of UTC by this much

  return new Date(naiveTarget.getTime() - offsetMs);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsOptions();

  try {
    // Auth: require user JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return createErrorResponse('Unauthorized', 401);
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) return createErrorResponse('Unauthorized', 401);
    const userId = userData.user.id;

    const body = (await req.json()) as ActionBody;
    if (!body?.entity_type || !body?.entity_id || !body?.action) {
      return createErrorResponse('Missing entity_type, entity_id, or action', 400);
    }
    if (body.action === 'snooze') {
      const valid =
        (typeof body.snooze === 'number' && body.snooze > 0 && body.snooze <= 60 * 24 * 7) ||
        (typeof body.snooze === 'string' && SNOOZE_PRESETS.has(body.snooze));
      if (!valid) return createErrorResponse('Invalid snooze value', 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch user timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('user_id', userId)
      .maybeSingle();
    const timezone = profile?.timezone || 'UTC';

    if (body.entity_type === 'task') {
      // Verify ownership
      const { data: task } = await supabase
        .from('tasks').select('id, user_id, start_time, status').eq('id', body.entity_id).maybeSingle();
      if (!task || task.user_id !== userId) return createErrorResponse('Not found', 404);

      if (body.action === 'complete') {
        const nowIso = new Date().toISOString();
        await supabase.from('tasks').update({
          status: 'completed',
          end_time: nowIso,
          reminder_active: false,
        }).eq('id', task.id);
        return createJsonResponse({ success: true, action: 'complete' });
      }
      // snooze: shift start_time forward, reset start_notified
      const until = computeSnoozeUntil(body.snooze!, timezone);
      await supabase.from('tasks').update({
        start_time: until.toISOString(),
        start_notified: false,
        last_reminder_sent_at: null,
        reminder_active: true,
      }).eq('id', task.id);
      return createJsonResponse({ success: true, action: 'snooze', next: until.toISOString() });
    }

    if (body.entity_type === 'document_reminder') {
      const { data: rem } = await supabase
        .from('reminders').select('id, user_id, document_id, reminder_date').eq('id', body.entity_id).maybeSingle();
      if (!rem || rem.user_id !== userId) return createErrorResponse('Not found', 404);

      if (body.action === 'complete') {
        await supabase.from('reminders').update({ is_sent: true }).eq('id', rem.id);
        return createJsonResponse({ success: true, action: 'complete' });
      }
      const until = computeSnoozeUntil(body.snooze!, timezone);
      // Bump reminder_date forward (date only)
      const newDate = until.toISOString().slice(0, 10);
      await supabase.from('reminders').update({
        reminder_date: newDate,
        is_sent: false,
      }).eq('id', rem.id);
      return createJsonResponse({ success: true, action: 'snooze', next: newDate });
    }

    if (body.entity_type === 'routine_step') {
      // entity_id is slot id
      const { data: slot } = await supabase
        .from('routine_task_slots')
        .select('id, time, task_id, routine_tasks!inner(routine_id, routines!inner(user_id))')
        .eq('id', body.entity_id).maybeSingle();
      // deno-lint-ignore no-explicit-any
      const ownerId = (slot as any)?.routine_tasks?.routines?.user_id;
      if (!slot || ownerId !== userId) return createErrorResponse('Not found', 404);

      if (body.action === 'complete') {
        // Mark today's notification as completed via log
        const today = new Date().toISOString().slice(0, 10);
        await supabase.from('routine_notification_log').insert({
          notification_key: `${userId}_${slot.id}_${today}_completed`,
          user_id: userId,
          // deno-lint-ignore no-explicit-any
          routine_id: (slot as any).routine_tasks.routine_id,
          step_id: slot.id,
          notification_type: 'completed',
        });
        return createJsonResponse({ success: true, action: 'complete' });
      }
      // snooze a routine step: shift slot.time forward by snooze minutes (today only is hard;
      // simplest is to push slot.time within the same day)
      const until = computeSnoozeUntil(body.snooze!, timezone);
      const hh = until.getUTCHours().toString().padStart(2, '0');
      const mm = until.getUTCMinutes().toString().padStart(2, '0');
      await supabase.from('routine_task_slots').update({ time: `${hh}:${mm}:00` }).eq('id', slot.id);
      return createJsonResponse({ success: true, action: 'snooze', next: `${hh}:${mm}` });
    }

    return createErrorResponse('Unknown entity_type', 400);
  } catch (e) {
    console.error('notification-action error', e);
    return createErrorResponse(e as Error);
  }
});
