import { corsHeaders, getServiceClient, getUserFromAuthHeader } from '../_shared/snoozeAuth.ts';

interface Body {
  instance_id: string;
  snooze_minutes: number;
  client_event_at?: string;
  device_id?: string;
  source?: 'manual' | 'ai' | 'voice' | 'location' | 'notification';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await getUserFromAuthHeader(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    if (!body.instance_id || !body.snooze_minutes || body.snooze_minutes <= 0) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cap snooze at 8 weeks
    const minutes = Math.min(body.snooze_minutes, 60 * 24 * 7 * 8);
    const supabase = getServiceClient();

    // Idempotency: if the same client_event_at was already applied, return current
    const { data: existing } = await supabase
      .from('reminder_instances')
      .select('*')
      .eq('id', body.instance_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (
      body.client_event_at &&
      existing.client_event_at &&
      new Date(body.client_event_at).getTime() <= new Date(existing.client_event_at).getTime() &&
      existing.state === 'snoozed'
    ) {
      return new Response(
        JSON.stringify({ ok: true, instance: existing, idempotent: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const snoozedUntil = new Date(Date.now() + minutes * 60_000).toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from('reminder_instances')
      .update({
        snoozed_until: snoozedUntil,
        state: 'snoozed',
        snooze_count: (existing.snooze_count ?? 0) + 1,
        device_origin: body.device_id ?? existing.device_origin,
        client_event_at: body.client_event_at ?? new Date().toISOString(),
        metadata: { ...(existing.metadata ?? {}), last_snooze_source: body.source ?? 'manual' },
      })
      .eq('id', body.instance_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr) {
      console.error('snooze update error', updateErr);
      return new Response(JSON.stringify({ error: 'update_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Intelligence: bump usage counter
    const { data: usageRow } = await supabase
      .from('snooze_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('duration_minutes', minutes)
      .maybeSingle();

    if (usageRow) {
      await supabase
        .from('snooze_usage')
        .update({
          used_count: (usageRow.used_count ?? 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', usageRow.id);
    } else {
      await supabase.from('snooze_usage').insert({
        user_id: userId,
        duration_minutes: minutes,
        used_count: 1,
        last_used_at: new Date().toISOString(),
      });
    }

    // Audit
    await supabase.from('snooze_sync_queue').insert({
      user_id: userId,
      instance_id: body.instance_id,
      action: 'snooze',
      payload: { snooze_minutes: minutes, source: body.source ?? 'manual' },
      client_event_at: body.client_event_at ?? new Date().toISOString(),
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ ok: true, instance: updated, snoozed_until: snoozedUntil }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('snooze fatal', e);
    return new Response(JSON.stringify({ error: 'fatal', message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
