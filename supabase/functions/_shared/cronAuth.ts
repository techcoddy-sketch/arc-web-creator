/**
 * Shared cron-secret authentication for scheduled edge functions.
 * All cron-triggered functions (verify_jwt = false) MUST validate
 * the x-cron-secret header against the CRON_SECRET env var to
 * prevent unauthenticated public invocation.
 */
export function verifyCronSecret(req: Request): { ok: true } | { ok: false; response: Response } {
  const expected = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret');

  if (!expected) {
    console.error('CRON_SECRET env var is not configured');
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Server misconfigured: CRON_SECRET not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  if (!provided || provided !== expected) {
    console.error('Unauthorized cron invocation: missing or invalid x-cron-secret');
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { ok: true };
}