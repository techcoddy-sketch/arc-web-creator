/**
 * Shared cron-secret authentication for scheduled edge functions.
 * Accepts either:
 *   1. x-cron-secret header matching CRON_SECRET env var, OR
 *   2. Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *      (allows pg_cron jobs that already authenticate via service_role)
 */
export function verifyCronSecret(req: Request): { ok: true } | { ok: false; response: Response } {
  const expectedCron = Deno.env.get('CRON_SECRET');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const provided = req.headers.get('x-cron-secret');
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization');

  // Path 1: x-cron-secret header
  if (expectedCron && provided && provided === expectedCron) {
    return { ok: true };
  }

  // Path 2: service-role bearer token
  if (serviceRole && auth) {
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token === serviceRole) {
      return { ok: true };
    }
  }

  if (!expectedCron && !serviceRole) {
    console.error('Neither CRON_SECRET nor SUPABASE_SERVICE_ROLE_KEY is configured');
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Server misconfigured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  console.error('Unauthorized cron invocation: missing/invalid x-cron-secret and no valid service-role bearer');
  return {
    ok: false,
    response: new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    ),
  };
}
