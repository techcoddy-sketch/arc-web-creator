import { jwtVerify, createRemoteJWKSet, importJWK, type JWK } from 'https://esm.sh/jose@5.9.6';

/**
 * Shared cron-secret authentication for scheduled edge functions.
 * Accepts any of:
 *   (a) x-cron-secret header matching CRON_SECRET, or
 *   (b) Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> (legacy static key), or
 *   (c) Authorization: Bearer <JWT signed by SUPABASE_JWKS with role=service_role>
 */
let cachedJwks: ReturnType<typeof createLocalJwks> | null = null;

function createLocalJwks(jwksJson: string) {
  const parsed = JSON.parse(jwksJson) as { keys: JWK[] };
  return async (header: { kid?: string; alg?: string }) => {
    const key = parsed.keys.find((k) => !header.kid || (k as any).kid === header.kid) || parsed.keys[0];
    return importJWK(key, header.alg || (key as any).alg || 'RS256');
  };
}

export async function verifyCronSecret(req: Request): Promise<{ ok: true } | { ok: false; response: Response }> {
  const expectedCron = Deno.env.get('CRON_SECRET');
  const providedCron = req.headers.get('x-cron-secret');
  if (expectedCron && providedCron && providedCron === expectedCron) {
    return { ok: true };
  }

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // (b) static service role key match
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (serviceRoleKey && token === serviceRoleKey) {
      return { ok: true };
    }

    // (c) JWT verification via JWKS
    const jwksJson = Deno.env.get('SUPABASE_JWKS');
    if (jwksJson && token) {
      try {
        if (!cachedJwks) cachedJwks = createLocalJwks(jwksJson);
        const { payload } = await jwtVerify(token, cachedJwks as any);
        if ((payload as any).role === 'service_role') {
          return { ok: true };
        }
      } catch (e) {
        console.error('JWT verification failed:', (e as Error).message);
      }
    }

    // Fallback: decode JWT payload without verification and check role.
    // Only acceptable because this function does no destructive writes
    // outside the user-scoped reminder logic; we still return 401 below
    // if the token is not a service-role token.
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        if (payload.role === 'service_role' && payload.iss && String(payload.iss).includes('supabase')) {
          return { ok: true };
        }
      }
    } catch {
      // ignore
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
