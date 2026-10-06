// Pure functions only (no Deno or network APIs) so they can be unit tested in Node.
// Each mapper turns an API response into rows in the same shape the dashboard's CSV import produces.

export type Row = Record<string, unknown>;

const pad = (n: number): string => String(n).padStart(2, '0');
export const isoDate = (d: Date): string => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return isoDate(dt);
}
export const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
};

/* ---------- Google Search Console (searchAnalytics.query) ---------- */
// Response rows: { keys: [...], clicks, impressions, ctr (0..1), position }
export function gscDaily(rows: Row[] = []): Row[] {
  return rows.map((r) => ({ date: String((r.keys as string[])[0]), clicks: num(r.clicks), impressions: num(r.impressions), ctr: num(r.ctr), position: num(r.position) }))
    .sort((a, b) => (a.date as string).localeCompare(b.date as string));
}
export const gscQueries = (rows: Row[] = []): Row[] => rows.map((r) => ({ query: String((r.keys as string[])[0]), clicks: num(r.clicks), impressions: num(r.impressions), ctr: num(r.ctr), position: num(r.position) }));
export const gscPages = (rows: Row[] = []): Row[] => rows.map((r) => ({ page: String((r.keys as string[])[0]), clicks: num(r.clicks), impressions: num(r.impressions), ctr: num(r.ctr), position: num(r.position) }));

/* ---------- Google Analytics 4 (runReport) ---------- */
// dimensionValues[i].value, metricValues[i].value. Date dimension is YYYYMMDD.
const ga4Date = (s: string): string => (/^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s);
export function ga4Daily(resp: { rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }> }): Row[] {
  // metric order: sessions, totalUsers, engagedSessions, keyEvents
  return (resp.rows ?? []).map((r) => ({
    date: ga4Date(r.dimensionValues[0].value),
    sessions: num(r.metricValues[0]?.value), users: num(r.metricValues[1]?.value),
    engaged: num(r.metricValues[2]?.value), events: num(r.metricValues[3]?.value),
  })).sort((a, b) => (a.date as string).localeCompare(b.date as string));
}
export function ga4Channels(resp: { rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }> }): Row[] {
  return (resp.rows ?? []).map((r) => ({
    channel: r.dimensionValues[0].value || '(not set)',
    sessions: num(r.metricValues[0]?.value), users: num(r.metricValues[1]?.value),
    engaged: num(r.metricValues[2]?.value), events: num(r.metricValues[3]?.value),
  }));
}

/* ---------- Google Business Profile Performance API ---------- */
// Response: { multiDailyMetricTimeSeries: [{ dailyMetricTimeSeries: [{ dailyMetric, timeSeries: { datedValues: [{ date:{year,month,day}, value } ] } }] }] }
export function gbpDaily(resp: { multiDailyMetricTimeSeries?: Array<{ dailyMetricTimeSeries?: Array<{ dailyMetric: string; timeSeries?: { datedValues?: Array<{ date: { year: number; month: number; day: number }; value?: string }> } }> }> }): Row[] {
  const byDate: Record<string, { views: number; calls: number; directions: number; website: number }> = {};
  for (const group of resp.multiDailyMetricTimeSeries ?? []) {
    for (const s of group.dailyMetricTimeSeries ?? []) {
      for (const dv of s.timeSeries?.datedValues ?? []) {
        const d = `${dv.date.year}-${pad(dv.date.month)}-${pad(dv.date.day)}`;
        const o = (byDate[d] ??= { views: 0, calls: 0, directions: 0, website: 0 });
        const v = num(dv.value); // value is omitted when zero
        if (s.dailyMetric === 'CALL_CLICKS') o.calls += v;
        else if (s.dailyMetric === 'BUSINESS_DIRECTION_REQUESTS') o.directions += v;
        else if (s.dailyMetric === 'WEBSITE_CLICKS') o.website += v;
        else if (s.dailyMetric.startsWith('BUSINESS_IMPRESSIONS_')) o.views += v;
      }
    }
  }
  return Object.keys(byDate).sort().map((date) => ({ date, ...byDate[date] }));
}

/* ---------- Google Ads (GAQL searchStream) ---------- */
// searchStream returns an array of batches: [{ results: [{ segments:{date}, metrics:{ costMicros, clicks, impressions, conversions } }] }]
export function gadsDaily(batches: Array<{ results?: Array<{ segments?: { date?: string }; metrics?: Record<string, unknown> }> }>, platform = 'Google Ads'): Row[] {
  const byDate: Record<string, { cost: number; clicks: number; impressions: number; conversions: number }> = {};
  for (const b of Array.isArray(batches) ? batches : [batches]) {
    for (const r of b?.results ?? []) {
      const d = r.segments?.date; if (!d) continue;
      const o = (byDate[d] ??= { cost: 0, clicks: 0, impressions: 0, conversions: 0 });
      o.cost += num(r.metrics?.costMicros) / 1e6; o.clicks += num(r.metrics?.clicks);
      o.impressions += num(r.metrics?.impressions); o.conversions += num(r.metrics?.conversions);
    }
  }
  return Object.keys(byDate).sort().map((date) => ({ date, platform, cost: Math.round(byDate[date].cost * 100) / 100, clicks: byDate[date].clicks, impressions: byDate[date].impressions, conversions: Math.round(byDate[date].conversions * 100) / 100 }));
}

/* ---------- Bing Webmaster Tools ---------- */
// Dates arrive as "/Date(1399014000000-0700)/" (WCF JSON). Apply the offset when present, then read the UTC calendar date.
export function bingDate(s: string): string | null {
  const m = /\/Date\((-?\d+)([+-]\d{4})?\)\//.exec(String(s));
  if (!m) return null;
  let ms = Number(m[1]);
  if (m[2]) { const sign = m[2][0] === '-' ? -1 : 1; ms += sign * (Number(m[2].slice(1, 3)) * 60 + Number(m[2].slice(3, 5))) * 60000; }
  return isoDate(new Date(ms));
}
export function bingDaily(resp: { d?: Array<{ Date: string; Clicks: number; Impressions: number }> }): Row[] {
  return (resp.d ?? []).map((r) => {
    const date = bingDate(r.Date); if (!date) return null;
    const clicks = num(r.Clicks), impressions = num(r.Impressions);
    return { date, clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: null };
  }).filter(Boolean) as Row[];
}
// GetQueryStats / GetPageStats return weekly buckets with no date filter. Keep buckets on or after `since` and aggregate per key.
export function bingAggregate(resp: { d?: Array<{ Date: string; Clicks: number; Impressions: number; AvgImpressionPosition?: number; AvgClickPosition?: number; Query: string }> }, since: string, keyName: 'query' | 'page'): Row[] {
  const acc: Record<string, { clicks: number; imp: number; pw: number; pi: number }> = {};
  for (const r of resp.d ?? []) {
    const date = bingDate(r.Date); if (!date || date < since) continue;
    const a = (acc[r.Query] ??= { clicks: 0, imp: 0, pw: 0, pi: 0 });
    const imp = num(r.Impressions); a.clicks += num(r.Clicks); a.imp += imp;
    const pos = num(r.AvgImpressionPosition) || num(r.AvgClickPosition);
    if (pos && imp) { a.pw += pos * imp; a.pi += imp; }
  }
  return Object.keys(acc).map((k) => {
    const a = acc[k];
    return { [keyName]: k, clicks: a.clicks, impressions: a.imp, ctr: a.imp ? a.clicks / a.imp : 0, position: a.pi ? Math.round((a.pw / a.pi) * 10) / 10 : null };
  }).sort((x, y) => (y.clicks as number) - (x.clicks as number) || (y.impressions as number) - (x.impressions as number));
}

/* ---------- dataset chunks (must match src/js/02-state.js) ---------- */
export function chunkRows(rows: Row[], budget = 80000): Row[][] {
  const out: Row[][] = []; let cur: Row[] = []; let size = 0;
  for (const r of rows) {
    const l = JSON.stringify(r).length + 1;
    if (cur.length && size + l > budget) { out.push(cur); cur = []; size = 0; }
    cur.push(r); size += l;
  }
  if (cur.length) out.push(cur);
  return out;
}
// Pick the newest complete set of chunk docs for one dataset key.
export function assembleChunks(docs: Array<{ i: number; of: number; v: number; rows: Row[] }>): Row[] | null {
  const versions = [...new Set(docs.map((d) => d.v))].sort((a, b) => b - a);
  for (const v of versions) {
    const set = docs.filter((d) => d.v === v); const of = set[0].of; const idx: Record<number, Row[]> = {};
    for (const d of set) idx[d.i] = d.rows;
    let ok = set.length === of; for (let j = 0; j < of && ok; j++) if (!idx[j]) ok = false;
    if (!ok) continue;
    const rows: Row[] = []; for (let j = 0; j < of; j++) rows.push(...idx[j]);
    return rows;
  }
  return null;
}
// Merge by key (later rows win). Used for daily datasets so a short recent pull updates matching days and keeps history.
export function mergeRows(existing: Row[], incoming: Row[], keys: string[]): Row[] {
  const kf = (r: Row) => keys.map((k) => String(r[k] ?? '').toLowerCase()).join('|');
  const m = new Map<string, Row>();
  for (const r of existing) m.set(kf(r), r);
  for (const r of incoming) m.set(kf(r), r);
  const out = [...m.values()];
  if (keys[0] === 'date') out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return out;
}
