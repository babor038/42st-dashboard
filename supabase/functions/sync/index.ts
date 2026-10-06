// POST /functions/v1/sync   (verify_jwt = false; this function authorises the caller itself)
// Body: { clientId, providers?: string[], days?: number }   for a signed-in user
//       { all: true, days?: number }  with header x-cron-secret for the scheduler
import { admin, authUser, authorizeClient, cors, decrypt, env, getClientInfo, googleAccessToken, HttpError, json, readDataset, writeDataset } from '../_shared/lib.ts';
import { isoDate, mergeRows } from '../_shared/mappers.ts';
import { MERGE_KEYS, PULLERS } from '../_shared/sources.ts';

type Target = { org: string; clientId: string; userId?: string };

async function syncOne(t: Target, providers: string[] | null, days: number, today: string) {
  const info = await getClientInfo(t.org, t.clientId);
  const { data: conns } = await admin().from('connections').select('id, provider').eq('org_id', t.org).eq('client_id', t.clientId);
  const results: Array<{ provider: string; ok: boolean; rows?: number; error?: string; code?: string }> = [];
  for (const c of (conns as any[]) ?? []) {
    if (providers && !providers.includes(c.provider)) continue;
    try {
      const { data: sec } = await admin().from('connection_secrets').select('secret_enc').eq('connection_id', c.id).maybeSingle();
      if (!sec) throw new HttpError(400, 'Stored credentials are missing. Reconnect this source.', 'needs_reconnect');
      const secret = await decrypt((sec as any).secret_enc);
      const ctx = { info, days, today, token: c.provider === 'bing' ? undefined : await googleAccessToken(secret.refresh_token), apiKey: secret.api_key as string | undefined };
      const pulled = await PULLERS[c.provider](ctx);
      let total = 0;
      for (const p of pulled) {
        const rows = p.mode === 'merge' ? mergeRows((await readDataset(t.org, t.clientId, p.key)).rows, p.rows, MERGE_KEYS[p.key]) : p.rows;
        await writeDataset(t.org, t.clientId, p.key, rows, t.userId);
        total += p.rows.length;
      }
      await admin().from('connections').update({ status: 'connected', last_sync_at: new Date().toISOString(), last_error: null }).eq('id', c.id);
      results.push({ provider: c.provider, ok: true, rows: total });
    } catch (e) {
      const err = e as any; const needs = err?.code === 'needs_reconnect';
      await admin().from('connections').update({ status: needs ? 'needs_reconnect' : 'error', last_error: String(err?.message ?? err).slice(0, 500) }).eq('id', c.id);
      results.push({ provider: c.provider, ok: false, error: String(err?.message ?? err), code: err?.code });
    }
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const days = Math.min(Math.max(Number(body.days) || 28, 1), 365);
    const providers: string[] | null = Array.isArray(body.providers) && body.providers.length ? body.providers.map(String) : null;
    const today = isoDate(new Date());
    const secret = req.headers.get('x-cron-secret');

    let targets: Target[] = [];
    if (secret) {
      if (secret !== env('CRON_SECRET')) throw new HttpError(401, 'Bad scheduler secret.');
      const { data } = await admin().from('connections').select('org_id, client_id');
      const seen = new Set<string>();
      for (const r of (data as any[]) ?? []) { const k = `${r.org_id}|${r.client_id}`; if (!seen.has(k)) { seen.add(k); targets.push({ org: r.org_id, clientId: r.client_id }); } }
    } else {
      const user = await authUser(req);
      const clientId = String(body.clientId ?? '');
      if (!clientId) throw new HttpError(400, 'clientId is required.');
      const { org } = await authorizeClient(user.id, clientId);
      targets = [{ org, clientId, userId: user.id }];
    }

    const out = [];
    for (const t of targets) out.push({ clientId: t.clientId, results: await syncOne(t, providers, days, today) });
    return json({ synced: out });
  } catch (e) {
    const err = e as any;
    return json({ error: err?.message ?? 'Unexpected error', code: err?.code ?? 'error' }, err instanceof HttpError ? err.status : 500);
  }
});
