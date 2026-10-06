// POST /functions/v1/connect
// Actions: google-start, bing-save, discover, disconnect, disconnect-all
import { admin, authUser, authorizeClient, cors, decrypt, encrypt, env, getClientInfo, GOOGLE_SCOPES, googleAccessToken, HttpError, json, signState } from '../_shared/lib.ts';
import { discover } from '../_shared/sources.ts';

const PROVIDERS = ['gsc', 'ga4', 'gbp', 'gads', 'bing'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const user = await authUser(req);
    const action = String(body.action ?? '');
    const clientId = String(body.clientId ?? '');
    if (!clientId) throw new HttpError(400, 'clientId is required.');
    const { org } = await authorizeClient(user.id, clientId);

    if (action === 'google-start') {
      const product = String(body.product ?? '');
      if (!GOOGLE_SCOPES[product]) throw new HttpError(400, 'Unknown Google product.');
      const state = await signState({ org, clientId, product, uid: user.id, exp: Date.now() + 10 * 60 * 1000 });
      const p = new URLSearchParams({
        client_id: env('GOOGLE_CLIENT_ID'),
        redirect_uri: `${env('SUPABASE_URL')}/functions/v1/google-callback`,
        response_type: 'code',
        scope: `openid email ${GOOGLE_SCOPES[product]}`,
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'false',
        state,
      });
      return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${p}` });
    }

    if (action === 'bing-save') {
      const apiKey = String(body.apiKey ?? '').trim();
      if (!apiKey) throw new HttpError(400, 'Paste the Bing Webmaster API key first.');
      // Check the key works before saving it, if the site is already on the client profile.
      const site = String((await getClientInfo(org, clientId)).bwt ?? '').trim();
      if (site) {
        const r = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/GetRankAndTrafficStats?siteUrl=${encodeURIComponent(site)}&apikey=${encodeURIComponent(apiKey)}`);
        if (!r.ok) throw new HttpError(400, 'Bing rejected that key for this site. Check the key and the site URL on Client info.');
      }
      const { data: conn, error } = await admin().from('connections').upsert({ org_id: org, client_id: clientId, provider: 'bing', account_label: site || 'API key', status: 'connected', last_error: null, created_by: user.id }, { onConflict: 'org_id,client_id,provider' }).select('id').single();
      if (error) throw error;
      const { error: e2 } = await admin().from('connection_secrets').upsert({ connection_id: (conn as any).id, secret_enc: await encrypt({ api_key: apiKey }), updated_at: new Date().toISOString() });
      if (e2) throw e2;
      return json({ ok: true });
    }

    if (action === 'discover') {
      const provider = String(body.provider ?? '');
      if (!GOOGLE_SCOPES[provider]) throw new HttpError(400, 'Discovery is available for Google products only.');
      const { data: conn } = await admin().from('connections').select('id').eq('org_id', org).eq('client_id', clientId).eq('provider', provider).maybeSingle();
      if (!conn) throw new HttpError(400, 'Connect this product first.');
      const { data: sec } = await admin().from('connection_secrets').select('secret_enc').eq('connection_id', (conn as any).id).maybeSingle();
      const { refresh_token } = await decrypt((sec as any).secret_enc);
      const token = await googleAccessToken(refresh_token);
      return json({ options: await discover(provider, token) });
    }

    if (action === 'disconnect' || action === 'disconnect-all') {
      const list = action === 'disconnect-all' ? PROVIDERS : [String(body.provider ?? '')];
      for (const provider of list) {
        if (!PROVIDERS.includes(provider)) continue;
        const { data: conn } = await admin().from('connections').select('id').eq('org_id', org).eq('client_id', clientId).eq('provider', provider).maybeSingle();
        if (!conn) continue;
        if (provider !== 'bing') { // best effort: revoke the Google grant
          try {
            const { data: sec } = await admin().from('connection_secrets').select('secret_enc').eq('connection_id', (conn as any).id).maybeSingle();
            const { refresh_token } = await decrypt((sec as any).secret_enc);
            await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh_token)}`, { method: 'POST' });
          } catch { /* already revoked or unreadable */ }
        }
        await admin().from('connections').delete().eq('id', (conn as any).id); // secrets cascade
      }
      return json({ ok: true });
    }

    throw new HttpError(400, 'Unknown action.');
  } catch (e) {
    const err = e as any;
    return json({ error: err?.message ?? 'Unexpected error', code: err?.code ?? 'error' }, err instanceof HttpError ? err.status : 500);
  }
});
