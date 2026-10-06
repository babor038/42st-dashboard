// Shared helpers for the edge functions (Deno runtime).
// Status: written against documented APIs, not yet run against live Google or Bing accounts.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { assembleChunks, chunkRows, type Row } from './mappers.ts';

export const env = (k: string, required = true): string => {
  const v = Deno.env.get(k) ?? '';
  if (!v && required) throw new HttpError(500, `Missing server setting ${k}. See supabase/README.md.`);
  return v;
};

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = 'error') { super(message); this.status = status; this.code = code; }
}

export const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Service-role client: bypasses row level security, so every caller must be authorised in code first.
let _admin: ReturnType<typeof createClient> | null = null;
// Supabase is moving from the legacy service_role key to sb_secret keys; accept either name.
// SUPABASE_SECRET_KEYS may hold a JSON object of named keys or a single key (format not yet confirmed against a live project).
function serviceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? '';
  try { const o = JSON.parse(raw); const v = typeof o === 'string' ? o : Object.values(o)[0]; if (typeof v === 'string' && v) return v; } catch { /* plain string */ }
  if (raw) return raw;
  throw new HttpError(500, 'No Supabase secret key is available to this function.');
}
export const admin = () => (_admin ??= createClient(env('SUPABASE_URL'), serviceKey(), { auth: { persistSession: false } }));

/* ---------- encryption for stored tokens (AES-GCM, 256 bit key in TOKEN_ENC_KEY, base64) ---------- */
async function aesKey(): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(env('TOKEN_ENC_KEY')), (c) => c.charCodeAt(0));
  if (raw.length !== 32) throw new HttpError(500, 'TOKEN_ENC_KEY must be 32 random bytes, base64 encoded.');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
const b64 = (u: Uint8Array): string => btoa(String.fromCharCode(...u));
const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export async function encrypt(obj: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(), new TextEncoder().encode(JSON.stringify(obj))));
  const out = new Uint8Array(iv.length + ct.length); out.set(iv); out.set(ct, iv.length);
  return b64(out);
}
export async function decrypt<T = any>(s: string): Promise<T> {
  const buf = unb64(s);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, await aesKey(), buf.slice(12));
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ---------- signed OAuth state ---------- */
const b64url = (u: Uint8Array): string => b64(u).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string): Uint8Array => unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(env('STATE_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signState(payload: Record<string, unknown>): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(body)));
  return `${body}.${b64url(sig)}`;
}
export async function verifyState(state: string): Promise<Record<string, any>> {
  const [body, sig] = state.split('.');
  if (!body || !sig) throw new HttpError(400, 'Invalid state');
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(), unb64url(sig), new TextEncoder().encode(body));
  if (!ok) throw new HttpError(400, 'Invalid state');
  const p = JSON.parse(new TextDecoder().decode(unb64url(body)));
  if (!p.exp || Date.now() > p.exp) throw new HttpError(400, 'This sign-in link expired. Start the connection again.');
  return p;
}

/* ---------- auth and tenancy ---------- */
export async function authUser(req: Request): Promise<{ id: string; email?: string }> {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) throw new HttpError(401, 'Sign in required.');
  const { data, error } = await admin().auth.getUser(jwt);
  if (error || !data.user) throw new HttpError(401, 'Sign in required.');
  return { id: data.user.id, email: data.user.email };
}
// Returns the caller's organization if they may change data for the given client.
export async function authorizeClient(userId: string, clientId: string): Promise<{ org: string; role: string }> {
  const { data: mem } = await admin().from('members').select('org_id, role').eq('user_id', userId).limit(1);
  const m = (mem as any[] | null)?.[0];
  if (!m) throw new HttpError(403, 'You are not a member of an organization.');
  if (!['owner', 'admin', 'member'].includes(m.role)) throw new HttpError(403, 'Your role is read-only.');
  const { data: doc } = await admin().from('documents').select('path').eq('org_id', m.org_id).eq('path', `clients/${clientId}`).maybeSingle();
  if (!doc) throw new HttpError(404, 'Client not found in your organization.');
  return { org: m.org_id, role: m.role };
}

/* ---------- dashboard documents ---------- */
export async function getClientInfo(org: string, clientId: string): Promise<Record<string, any>> {
  const { data } = await admin().from('documents').select('data').eq('org_id', org).eq('path', `clients/${clientId}`).maybeSingle();
  return ((data as any)?.data?.info ?? {}) as Record<string, any>;
}
export async function readDataset(org: string, clientId: string, key: string): Promise<{ rows: Row[]; count: number }> {
  const parent = `clients/${clientId}/data`;
  const { data } = await admin().from('documents').select('data').eq('org_id', org).eq('parent', parent);
  const docs = ((data as any[]) ?? []).map((d) => d.data).filter((d) => d && d.key === key);
  return { rows: assembleChunks(docs) ?? [], count: docs.length ? Math.max(...docs.map((d) => d.i + 1)) : 0 };
}
export async function writeDataset(org: string, clientId: string, key: string, rows: Row[], userId?: string): Promise<void> {
  const parent = `clients/${clientId}/data`;
  const { count: oldCount } = await readDataset(org, clientId, key);
  const chunks = chunkRows(rows), v = Date.now();
  const recs = chunks.map((ch, i) => ({ org_id: org, path: `${parent}/${key}-${i}`, parent, data: { key, i, of: chunks.length, v, rows: ch }, updated_by: userId ?? null, updated_at: new Date().toISOString() }));
  if (recs.length) {
    const { error } = await admin().from('documents').upsert(recs, { onConflict: 'org_id,path' });
    if (error) throw error;
  }
  const stale: string[] = []; for (let j = chunks.length; j < oldCount; j++) stale.push(`${parent}/${key}-${j}`);
  if (stale.length) await admin().from('documents').delete().eq('org_id', org).in('path', stale);
}

/* ---------- Google OAuth ---------- */
export const GOOGLE_SCOPES: Record<string, string> = {
  gsc: 'https://www.googleapis.com/auth/webmasters.readonly',
  ga4: 'https://www.googleapis.com/auth/analytics.readonly',
  gbp: 'https://www.googleapis.com/auth/business.manage',
  gads: 'https://www.googleapis.com/auth/adwords',
};
export async function googleAccessToken(refreshToken: string): Promise<string> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  const j = await r.json();
  if (!r.ok) throw new HttpError(401, j.error_description || j.error || 'Google rejected the stored sign-in.', j.error === 'invalid_grant' ? 'needs_reconnect' : 'error');
  return j.access_token as string;
}
export function idTokenEmail(idToken?: string): string {
  try { return JSON.parse(new TextDecoder().decode(unb64url(idToken!.split('.')[1]))).email ?? ''; } catch { return ''; }
}
