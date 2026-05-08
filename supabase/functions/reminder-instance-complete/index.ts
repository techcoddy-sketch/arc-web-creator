import { corsHeaders, getServiceClient, getUserFromAuthHeader } from '../_shared/snoozeAuth.ts';

interface Body {
  instance_id: string;
  client_event_at?: string;
  device_id?: string;
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
    if (!body.instance_id) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient();
    const now = new Date().toISOString();

    const { data: instance, error: fetchErr } = await supabase
      .from('reminder_instances')
      .select('*')
      .eq('id', body.instance_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr || !instance) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('reminder_instances')
      .update({
        state: 'completed',
        completed_at: now,
        client_event_at: body.client_event_at ?? now,
        device_origin: body.device_id ?? instance.device_origin,
      })
      .eq('id', body.instance_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr) {
      return new Response(JSON.stringify({ error: 'update_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For one-time tasks, mirror completion. Routines: do NOT touch recurrence.
    if (instance.reminder_type === 'task') {
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          end_time: now,
          reminder_active: false,
        })
        .eq('id', instance.reminder_id)
        .eq('user_id', userId);
    }

    await supabase.from('snooze_sync_queue').insert({
      user_id: userId,
      instance_id: body.instance_id,
      action: 'complete',
      payload: {},
      client_event_at: body.client_event_at ?? now,
      processed: true,
      processed_at: now,
    });

    return new Response(JSON.stringify({ ok: true, instance: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('complete fatal', e);
    return new Response(JSON.stringify({ error: 'fatal', message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
