/**
 * Shared cron-secret authentication for scheduled edge functions.
 * Accepts either:
 *   (a) x-cron-secret header matching CRON_SECRET, or
 *   (b) Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 * Either is sufficient since both are server-side secrets.
 */
export function verifyCronSecret(req: Request): { ok: true } | { ok: false; response: Response } {
  const expectedCron = Deno.env.get('CRON_SECRET');
  const providedCron = req.headers.get('x-cron-secret');

  if (expectedCron && providedCron && providedCron === expectedCron) {
    return { ok: true };
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (serviceRoleKey && authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token && token === serviceRoleKey) {
      return { ok: true };
    }
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
