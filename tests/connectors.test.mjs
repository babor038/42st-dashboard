// Unit tests for the connector mappers. Fixtures follow the response shapes in the official API docs
// (verified October 2026), so these prove the transformations, not live API behaviour.
import assert from 'node:assert/strict';
import * as m from '../supabase/functions/_shared/mappers.ts';

let failed = 0;
const t = (name, fn) => { try { fn(); console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); } };
console.log('Connector mappers');

t('gsc daily/query/page rows', () => {
  const rows = [{ keys: ['2026-09-02'], clicks: 5, impressions: 100, ctr: 0.05, position: 7.25 }, { keys: ['2026-09-01'], clicks: 3, impressions: 80, ctr: 0.0375, position: 8 }];
  const d = m.gscDaily(rows); assert.equal(d[0].date, '2026-09-01'); assert.equal(d[1].clicks, 5);
  assert.deepEqual(m.gscQueries([{ keys: ['plumber'], clicks: 1, impressions: 2, ctr: .5, position: 3 }])[0], { query: 'plumber', clicks: 1, impressions: 2, ctr: .5, position: 3 });
  assert.equal(m.gscPages([{ keys: ['https://x.com/a'], clicks: 1, impressions: 2, ctr: .5, position: 3 }])[0].page, 'https://x.com/a');
});
t('ga4 daily converts YYYYMMDD and maps the four metrics', () => {
  const r = { rows: [{ dimensionValues: [{ value: '20260902' }], metricValues: [{ value: '120' }, { value: '90' }, { value: '70' }, { value: '6' }] }] };
  assert.deepEqual(m.ga4Daily(r)[0], { date: '2026-09-02', sessions: 120, users: 90, engaged: 70, events: 6 });
  assert.equal(m.ga4Channels({ rows: [{ dimensionValues: [{ value: 'Organic Search' }], metricValues: [{ value: '5' }, { value: '4' }, { value: '3' }, { value: '2' }] }] })[0].channel, 'Organic Search');
});
t('gbp sums impression metrics and handles omitted zero values', () => {
  const dv = (d, v) => ({ date: { year: 2026, month: 9, day: d }, ...(v === undefined ? {} : { value: v }) });
  const resp = { multiDailyMetricTimeSeries: [{ dailyMetricTimeSeries: [
    { dailyMetric: 'CALL_CLICKS', timeSeries: { datedValues: [dv(1, '4'), dv(2)] } },
    { dailyMetric: 'WEBSITE_CLICKS', timeSeries: { datedValues: [dv(1, '7')] } },
    { dailyMetric: 'BUSINESS_DIRECTION_REQUESTS', timeSeries: { datedValues: [dv(1, '2')] } },
    { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_MAPS', timeSeries: { datedValues: [dv(1, '30')] } },
    { dailyMetric: 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH', timeSeries: { datedValues: [dv(1, '10')] } }] }] };
  const rows = m.gbpDaily(resp);
  assert.deepEqual(rows[0], { date: '2026-09-01', views: 40, calls: 4, directions: 2, website: 7 });
  assert.equal(rows[1].calls, 0);
});
t('google ads converts cost micros and merges batches', () => {
  const batches = [{ results: [{ segments: { date: '2026-09-01' }, metrics: { costMicros: '12500000', clicks: '10', impressions: '200', conversions: 2.5 } }] }, { results: [{ segments: { date: '2026-09-01' }, metrics: { costMicros: '2500000', clicks: '1', impressions: '20', conversions: 0 } }] }];
  assert.deepEqual(m.gadsDaily(batches)[0], { date: '2026-09-01', platform: 'Google Ads', cost: 15, clicks: 11, impressions: 220, conversions: 2.5 });
});
t('bing dates: with and without offset', () => {
  assert.equal(m.bingDate('/Date(1399014000000-0700)/'), '2014-05-02');
  assert.equal(m.bingDate('/Date(1399100400000)/'), '2014-05-03');
  assert.equal(m.bingDate('nonsense'), null);
});
t('bing daily and weekly aggregation', () => {
  const daily = m.bingDaily({ d: [{ Date: '/Date(1399014000000-0700)/', Clicks: 1, Impressions: 30 }] });
  assert.deepEqual(daily[0], { date: '2014-05-02', clicks: 1, impressions: 30, ctr: 1 / 30, position: null });
  const resp = { d: [
    { Date: '/Date(1399100400000)/', Clicks: 2, Impressions: 20, AvgImpressionPosition: 10, AvgClickPosition: 0, Query: 'a' },
    { Date: '/Date(1399705200000)/', Clicks: 3, Impressions: 80, AvgImpressionPosition: 5, AvgClickPosition: 0, Query: 'a' },
    { Date: '/Date(1300000000000)/', Clicks: 99, Impressions: 99, AvgImpressionPosition: 1, Query: 'old' }] };
  const q = m.bingAggregate(resp, '2014-05-01', 'query');
  assert.equal(q.length, 1); assert.equal(q[0].clicks, 5); assert.equal(q[0].impressions, 100); assert.equal(q[0].position, 6);
});
t('chunk then assemble round trip; incomplete newest set falls back', () => {
  const rows = Array.from({ length: 3000 }, (_, i) => ({ query: 'keyword ' + i + ' padding padding padding', clicks: i }));
  const chunks = m.chunkRows(rows); assert.ok(chunks.length > 1);
  const docs = chunks.map((rs, i) => ({ i, of: chunks.length, v: 100, rows: rs }));
  assert.equal(m.assembleChunks(docs).length, 3000);
  const withPartialNew = [...docs, { i: 0, of: 5, v: 200, rows: [] }];
  assert.equal(m.assembleChunks(withPartialNew).length, 3000);
  assert.equal(m.assembleChunks([]), null);
});
t('mergeRows updates matching days and keeps history', () => {
  const out = m.mergeRows([{ date: '2026-09-01', clicks: 1 }, { date: '2026-09-02', clicks: 2 }], [{ date: '2026-09-02', clicks: 9 }, { date: '2026-09-03', clicks: 3 }], ['date']);
  assert.deepEqual(out.map((r) => r.clicks), [1, 9, 3]);
});
t('addDays crosses month boundaries', () => { assert.equal(m.addDays('2026-09-01', -1), '2026-08-31'); assert.equal(m.addDays('2026-12-31', 1), '2027-01-01'); });
console.log(failed ? `\n${failed} failed` : '\nAll connector tests passed');
process.exit(failed ? 1 : 0);
