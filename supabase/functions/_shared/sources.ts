// One pull function per provider. Each returns datasets in the dashboard's own row format.
// Endpoints and fields were checked against the official docs in October 2026; see supabase/README.md for what is still unverified.
import { HttpError } from './lib.ts';
import { addDays, bingAggregate, bingDaily, ga4Channels, ga4Daily, gadsDaily, gbpDaily, gscDaily, gscPages, gscQueries, type Row } from './mappers.ts';

export type Pulled = { key: string; rows: Row[]; mode: 'merge' | 'replace' };
export type Ctx = { info: Record<string, any>; token?: string; apiKey?: string; days: number; today: string };

export const MERGE_KEYS: Record<string, string[]> = {
  gsc_daily: ['date'], bing_daily: ['date'], ga4_daily: ['date'], gbp_daily: ['date'], ads_daily: ['date', 'platform'],
};

async function call(url: string, init: RequestInit, what: string): Promise<any> {
  const r = await fetch(url, init);
  const text = await r.text();
  let j: any = {}; try { j = text ? JSON.parse(text) : {}; } catch { /* non-JSON error body */ }
  if (!r.ok) {
    const msg = j?.error?.message || j?.error_description || j?.Message || text.slice(0, 200) || `HTTP ${r.status}`;
    throw new HttpError(r.status, `${what}: ${msg}`, r.status === 401 ? 'needs_reconnect' : 'error');
  }
  return j;
}
const bearer = (t: string, extra: Record<string, string> = {}) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...extra });
const digits = (s: unknown) => String(s ?? '').replace(/\D/g, '');

/* ---------- Google Search Console ---------- */
export async function pullGsc(c: Ctx): Promise<Pulled[]> {
  const site = String(c.info.gsc ?? '').trim();
  if (!site) throw new HttpError(400, 'Add the Search Console property on Client info first (for example sc-domain:example.com).');
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const end = addDays(c.today, -2); // Search Console data lags by a couple of days
  const start = addDays(end, -(c.days - 1)), qStart = addDays(end, -27);
  const q = (body: Record<string, unknown>) => call(url, { method: 'POST', headers: bearer(c.token!), body: JSON.stringify(body) }, 'Search Console');
  const [daily, queries, pages] = await Promise.all([
    q({ startDate: start, endDate: end, dimensions: ['date'], rowLimit: 25000 }),
    q({ startDate: qStart, endDate: end, dimensions: ['query'], rowLimit: 5000 }),
    q({ startDate: qStart, endDate: end, dimensions: ['page'], rowLimit: 2000 }),
  ]);
  return [
    { key: 'gsc_daily', rows: gscDaily(daily.rows), mode: 'merge' },
    { key: 'gsc_queries', rows: gscQueries(queries.rows), mode: 'replace' },
    { key: 'gsc_pages', rows: gscPages(pages.rows), mode: 'replace' },
  ];
}

/* ---------- Google Analytics 4 ---------- */
async function ga4Report(c: Ctx, body: Record<string, unknown>): Promise<any> {
  const prop = digits(c.info.ga4Property);
  if (!prop) throw new HttpError(400, 'Add the GA4 property ID on Client info first.');
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`;
  const withMetric = (last: string) => ({ ...body, metrics: ['sessions', 'totalUsers', 'engagedSessions', last].map((name) => ({ name })) });
  try { return await call(url, { method: 'POST', headers: bearer(c.token!), body: JSON.stringify(withMetric('keyEvents')) }, 'Analytics'); }
  catch (e) {
    // Older properties or API versions may only know the previous name for key events.
    if (e instanceof HttpError && e.status === 400 && /keyEvents/i.test(e.message)) return call(url, { method: 'POST', headers: bearer(c.token!), body: JSON.stringify(withMetric('conversions')) }, 'Analytics');
    throw e;
  }
}
export async function pullGa4(c: Ctx): Promise<Pulled[]> {
  const end = addDays(c.today, -1), start = addDays(end, -(c.days - 1)), cStart = addDays(end, -27);
  const [daily, channels] = await Promise.all([
    ga4Report(c, { dateRanges: [{ startDate: start, endDate: end }], dimensions: [{ name: 'date' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: '10000' }),
    ga4Report(c, { dateRanges: [{ startDate: cStart, endDate: end }], dimensions: [{ name: 'sessionDefaultChannelGroup' }], limit: '100' }),
  ]);
  return [{ key: 'ga4_daily', rows: ga4Daily(daily), mode: 'merge' }, { key: 'ga4_channels', rows: ga4Channels(channels), mode: 'replace' }];
}

/* ---------- Google Business Profile Performance ---------- */
export async function pullGbp(c: Ctx): Promise<Pulled[]> {
  const loc = digits(c.info.gbpLocationId);
  if (!loc) throw new HttpError(400, 'Add the Business Profile location ID on Client info first, or use Find my locations.');
  const end = addDays(c.today, -3), start = addDays(end, -(c.days - 1));
  const p = new URLSearchParams();
  for (const m of ['CALL_CLICKS', 'WEBSITE_CLICKS', 'BUSINESS_DIRECTION_REQUESTS', 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS', 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH', 'BUSINESS_IMPRESSIONS_MOBILE_MAPS', 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH']) p.append('dailyMetrics', m);
  const [sy, sm, sd] = start.split('-').map(Number), [ey, em, ed] = end.split('-').map(Number);
  p.set('daily_range.start_date.year', String(sy)); p.set('daily_range.start_date.month', String(sm)); p.set('daily_range.start_date.day', String(sd));
  p.set('daily_range.end_date.year', String(ey)); p.set('daily_range.end_date.month', String(em)); p.set('daily_range.end_date.day', String(ed));
  const j = await call(`https://businessprofileperformance.googleapis.com/v1/locations/${loc}:fetchMultiDailyMetricsTimeSeries?${p}`, { headers: bearer(c.token!) }, 'Business Profile');
  return [{ key: 'gbp_daily', rows: gbpDaily(j), mode: 'merge' }];
}

/* ---------- Google Ads ---------- */
export async function pullGads(c: Ctx): Promise<Pulled[]> {
  const cust = digits(c.info.googleAds);
  if (!cust) throw new HttpError(400, 'Add the Google Ads customer ID on Client info first.');
  const version = Deno.env.get('GOOGLE_ADS_API_VERSION') || 'v25'; // confirm the current version in the Google Ads API release notes
  const end = addDays(c.today, -1), start = addDays(end, -(c.days - 1));
  const gaql = `SELECT segments.date, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM customer WHERE segments.date BETWEEN '${start}' AND '${end}'`;
  const headers: Record<string, string> = bearer(c.token!);
  const mgr = digits(c.info.googleAdsManager); if (mgr) headers['login-customer-id'] = mgr;
  const legacyToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN'); if (legacyToken) headers['developer-token'] = legacyToken; // optional and ignored since 9 Sept 2026
  const j = await call(`https://googleads.googleapis.com/${version}/customers/${cust}/googleAds:searchStream`, { method: 'POST', headers, body: JSON.stringify({ query: gaql }) }, 'Google Ads');
  return [{ key: 'ads_daily', rows: gadsDaily(j, 'Google Ads'), mode: 'merge' }];
}

/* ---------- Bing Webmaster Tools (API key) ---------- */
const BING = 'https://ssl.bing.com/webmaster/api.svc/json';
export async function pullBing(c: Ctx): Promise<Pulled[]> {
  const site = String(c.info.bwt ?? '').trim();
  if (!site) throw new HttpError(400, 'Add the Bing Webmaster Tools site URL on Client info first.');
  const get = (m: string) => call(`${BING}/${m}?siteUrl=${encodeURIComponent(site)}&apikey=${encodeURIComponent(c.apiKey!)}`, {}, 'Bing Webmaster');
  const since = addDays(c.today, -34); // query and page stats come in weekly buckets, so include the whole weeks that touch the last 28 days
  const [daily, queries, pages] = await Promise.all([get('GetRankAndTrafficStats'), get('GetQueryStats'), get('GetPageStats')]);
  return [
    { key: 'bing_daily', rows: bingDaily(daily), mode: 'merge' },
    { key: 'bing_queries', rows: bingAggregate(queries, since, 'query').slice(0, 5000), mode: 'replace' },
    { key: 'bing_pages', rows: bingAggregate(pages, since, 'page').slice(0, 2000), mode: 'replace' },
  ];
}

export const PULLERS: Record<string, (c: Ctx) => Promise<Pulled[]>> = { gsc: pullGsc, ga4: pullGa4, gbp: pullGbp, gads: pullGads, bing: pullBing };

/* ---------- discovery: let the user pick IDs instead of typing them ---------- */
export async function discover(provider: string, token: string): Promise<Array<{ value: string; label: string }>> {
  const h = bearer(token);
  if (provider === 'gsc') {
    const j = await call('https://www.googleapis.com/webmasters/v3/sites', { headers: h }, 'Search Console');
    return (j.siteEntry ?? []).map((s: any) => ({ value: s.siteUrl, label: `${s.siteUrl} (${s.permissionLevel})` }));
  }
  if (provider === 'ga4') {
    const j = await call('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200', { headers: h }, 'Analytics');
    const out: Array<{ value: string; label: string }> = [];
    for (const a of j.accountSummaries ?? []) for (const p of a.propertySummaries ?? []) out.push({ value: String(p.property).replace('properties/', ''), label: `${p.displayName} (${a.displayName})` });
    return out;
  }
  if (provider === 'gbp') {
    const acc = await call('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', { headers: h }, 'Business Profile');
    const out: Array<{ value: string; label: string }> = [];
    for (const a of (acc.accounts ?? []).slice(0, 10)) {
      const locs = await call(`https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations?readMask=name,title&pageSize=100`, { headers: h }, 'Business Profile');
      for (const l of locs.locations ?? []) out.push({ value: String(l.name).replace('locations/', ''), label: `${l.title} (${a.accountName ?? a.name})` });
    }
    return out;
  }
  if (provider === 'gads') {
    const version = Deno.env.get('GOOGLE_ADS_API_VERSION') || 'v25';
    const j = await call(`https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`, { headers: h }, 'Google Ads');
    return (j.resourceNames ?? []).map((n: string) => ({ value: n.replace('customers/', ''), label: `Customer ${n.replace('customers/', '')}` }));
  }
  return [];
}
