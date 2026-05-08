import { corsHeaders, getServiceClient, getUserFromAuthHeader } from '../_shared/snoozeAuth.ts';

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

    const { instance_id, client_event_at, device_id } = await req.json();
    if (!instance_id) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient();
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('reminder_instances')
      .update({
        state: 'dismissed',
        client_event_at: client_event_at ?? now,
        device_origin: device_id,
      })
      .eq('id', instance_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: 'update_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, instance: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fatal', message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
