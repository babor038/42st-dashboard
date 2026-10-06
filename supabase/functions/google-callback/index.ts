// GET /functions/v1/google-callback  (called by the browser after Google's consent screen; verify_jwt = false)
import { admin, encrypt, env, idTokenEmail, verifyState } from '../_shared/lib.ts';

const back = (query: string): Response => new Response(null, { status: 302, headers: { Location: `${env('APP_URL')}${env('APP_URL').includes('?') ? '&' : '?'}${query}` } });

Deno.serve(async (req) => {
  try {
    const u = new URL(req.url);
    if (u.searchParams.get('error')) return back(`connect_error=${encodeURIComponent(u.searchParams.get('error')!)}`);
    const code = u.searchParams.get('code'); const state = u.searchParams.get('state');
    if (!code || !state) return back('connect_error=missing_code');
    const s = await verifyState(state); // org, clientId, product, uid, exp
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), redirect_uri: `${env('SUPABASE_URL')}/functions/v1/google-callback`, grant_type: 'authorization_code' }),
    });
    const j = await r.json();
    if (!r.ok) return back(`connect_error=${encodeURIComponent(j.error_description || j.error || 'token_exchange_failed')}`);
    if (!j.refresh_token) return back('connect_error=no_refresh_token');
    const { data: conn, error } = await admin().from('connections').upsert(
      { org_id: s.org, client_id: s.clientId, provider: s.product, account_label: idTokenEmail(j.id_token), status: 'connected', last_error: null, created_by: s.uid },
      { onConflict: 'org_id,client_id,provider' }).select('id').single();
    if (error) throw error;
    const { error: e2 } = await admin().from('connection_secrets').upsert({ connection_id: (conn as any).id, secret_enc: await encrypt({ refresh_token: j.refresh_token }), updated_at: new Date().toISOString() });
    if (e2) throw e2;
    return back(`connected=${encodeURIComponent(s.product)}`);
  } catch (e) {
    return back(`connect_error=${encodeURIComponent((e as any)?.message ?? 'unexpected_error')}`);
  }
});
