// Smoke tests: builds are loaded in jsdom against (1) the local adapter and (2) a fake claude.ai db.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name, fn) => Promise.resolve().then(fn).then(() => console.log('  ok   ' + name), (e) => { failures++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)); });

function boot({ claude, storage } = {}) {
  const errors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.test/',
    beforeParse(w) {
      w.console.error = (...a) => errors.push(a.map(String).join(' '));
      w.addEventListener('error', (e) => errors.push('ERR ' + e.message));
      w.scrollTo = () => {};
      if (storage) for (const k in storage) w.localStorage.setItem(k, storage[k]);
      if (claude) w.claude = claude(w);
    },
  });
  return { dom, w: dom.window, d: dom.window.document, errors };
}
const click = (d, sel) => { const el = d.querySelector(sel); assert.ok(el, 'missing ' + sel); el.click(); };
const nav = (d, v) => click(d, `[data-act="nav"][data-v="${v}"]`);

function fakeDb() {
  const store = new Map(), ls = [];
  const parent = (p) => p.slice(0, p.lastIndexOf('/'));
  const snapDoc = (p) => { const v = store.get(p); return { id: p.split('/').pop(), exists: v !== undefined, data: () => (v === undefined ? undefined : Object.freeze(JSON.parse(JSON.stringify(v)))), metadata: { fromCache: false, hasPendingWrites: false } }; };
  const snapCol = (c) => { const docs = [...store.keys()].filter((p) => parent(p) === c).sort().map(snapDoc); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
  const fire = (p) => setTimeout(() => ls.slice().forEach((l) => { if (l.k === 'd' && l.p === p) l.n(snapDoc(p)); if (l.k === 'c' && l.p === parent(p)) l.n(snapCol(l.p)); }), 3);
  const doc = (p) => ({ id: p.split('/').pop(), path: p,
    get: async () => snapDoc(p),
    set: async (x) => { await sleep(2); if (JSON.stringify(x).length > 262144) throw { code: 'invalid_argument', message: 'too big' }; store.set(p, JSON.parse(JSON.stringify(x))); fire(p); },
    delete: async () => { store.delete(p); fire(p); },
    onSnapshot: (n) => { const l = { k: 'd', p, n }; ls.push(l); setTimeout(() => n(snapDoc(p)), 3); return () => ls.splice(ls.indexOf(l), 1); } });
  const db = { doc, collection: (p) => ({ path: p, get: async () => snapCol(p), onSnapshot: (n) => { const l = { k: 'c', p, n }; ls.push(l); setTimeout(() => n(snapCol(p)), 3); return () => ls.splice(ls.indexOf(l), 1); }, doc: (id) => doc(p + '/' + id) }) };
  return { db, store };
}
const claudeFor = (db) => () => ({ use: async (n) => (n === 'db' ? db : n === 'user' ? { id: async () => 'u_test', can: async () => true } : n === 'downloads' ? { save: async () => ({ status: 'saved' }) } : null) });

const CSV = {
  gscQ: 'Top queries,Clicks,Impressions,CTR,Position\nemergency plumber maryville tn,12,400,3%,6.2\nplumber maryville tn,5,900,0.5%,11.4',
};

console.log('Local adapter');
{
  const { w, d, errors } = boot();
  await sleep(60);
  await check('boots to the welcome screen with no errors', () => { assert.match(d.getElementById('view').textContent, /Add your first client/); assert.deepEqual(errors, []); });
  await check('the Forty-Second Street logo is in the sidebar by default', () => {
    const img = d.querySelector('#brand img.logo'); assert.ok(img, 'logo missing'); assert.ok(img.src.startsWith('data:image/png;base64,'), 'not the default png');
  });
  await check('sample client loads and every view renders', async () => {
    click(d, '[data-act="sample"]'); await sleep(250);
    for (const v of ['overview', 'clientinfo', 'search', 'tracking', 'traffic', 'localpaid', 'ai', 'technical', 'connections', 'data']) { nav(d, v); await sleep(20); assert.ok(d.getElementById('view').innerHTML.length > 300, v + ' empty'); }
    assert.deepEqual(errors, []);
  });
  await check('live connections explain themselves in demo mode', async () => {
    nav(d, 'connections'); await sleep(20);
    assert.match(d.getElementById('view').textContent, /Live connections need the cloud backend/);
    assert.equal(d.querySelectorAll('[data-act="conn-google"]').length, 0);
  });
  await check('tracking shows keywords, areas, services with matched stats', async () => {
    nav(d, 'tracking'); await sleep(20);
    const t = d.getElementById('view').textContent;
    assert.match(t, /The 10 keywords we are tracking/); assert.match(t, /The 10 service areas we are tracking/); assert.match(t, /Main services and current ranking/);
    assert.ok(d.querySelectorAll('#tb_kw tbody tr').length === 10, 'kw rows');
    assert.ok(d.querySelectorAll('#tb_ar tbody tr').length === 10, 'area rows');
    assert.ok(d.querySelectorAll('#tb_sv tbody tr').length === 6, 'service rows');
  });
  await check('bulk add keywords and log a rank', async () => {
    d.getElementById('bulk_keywords').value = 'new keyword one | /page-one/ | a note\nnew keyword two';
    click(d, '[data-act="tr-bulk"][data-kind="keywords"]'); await sleep(40);
    assert.equal(d.querySelectorAll('#tb_kw tbody tr').length, 12);
    d.getElementById('rk_item').value = 'new keyword one'; d.getElementById('rk_pos').value = '7';
    click(d, '[data-act="rank-add"]'); await sleep(60);
    assert.match(d.getElementById('view').textContent, /Rank history/);
  });
  await check('client info saves, including competitors', async () => {
    nav(d, 'clientinfo'); await sleep(20);
    d.querySelector('[data-info="phone"]').value = '(555) 010-9999';
    d.querySelector('[data-comp="n0"]').value = 'Test Rival';
    click(d, '[data-act="save-info"]'); await sleep(40);
    assert.equal(d.querySelector('[data-info="phone"]').value, '(555) 010-9999');
    assert.equal(d.querySelector('[data-comp="n0"]').value, 'Test Rival');
  });
  await check('CSV import for queries works and feeds tracking', async () => {
    nav(d, 'data'); await sleep(20);
    click(d, '[data-act="paste"][data-k="gsc_queries"]');
    d.getElementById('ptext').value = CSV.gscQ; d.querySelector('[data-dlg="1"]').click(); await sleep(60);
    nav(d, 'tracking'); await sleep(20);
    assert.match(d.getElementById('tb_kw').textContent, /6\.2/);
  });
  await check('data survives a reload (local adapter)', async () => {
    await sleep(60);
    const saved = { fs42_docs_v2: w.localStorage.getItem('fs42_docs_v2') };
    assert.ok(saved.fs42_docs_v2.length > 1000);
    const b = boot({ storage: saved }); await sleep(250);
    assert.match(b.d.querySelector('#top .sub').textContent, /Sample client/);
    nav(b.d, 'tracking'); await sleep(30);
    assert.equal(b.d.querySelectorAll('#tb_kw tbody tr').length, 12);
    assert.deepEqual(b.errors, []);
  });
  await check('logo can be set and shows in the sidebar', async () => {
    const svg = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>').toString('base64');
    nav(d, 'data'); await sleep(10);
    const f = new w.File(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'], 'logo.svg', { type: 'image/svg+xml' });
    click(d, '[data-act="logo-up"]');
    const input = d.getElementById('file'); Object.defineProperty(input, 'files', { value: [f], configurable: true });
    input.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(80);
    assert.ok(d.querySelector('#brand img.logo'), 'logo img'); assert.ok(d.querySelector('#brand img.logo').src.startsWith('data:image/svg+xml'));
  });
}

console.log('claude.ai db adapter (fake db, frozen snapshots, latency)');
{
  const fake = fakeDb();
  const a = boot({ claude: claudeFor(fake.db) });
  await sleep(80);
  await check('connects and shows cloud status', () => { assert.match(a.d.getElementById('syncStat').textContent, /Saved to cloud/); });
  await check('sample client is written as client doc plus chunked datasets', async () => {
    click(a.d, '[data-act="sample"]'); await sleep(900);
    const paths = [...fake.store.keys()];
    assert.ok(paths.some((p) => /^clients\/[^/]+$/.test(p)), 'client doc');
    assert.ok(paths.some((p) => /\/data\/gsc_daily-0$/.test(p)), 'gsc chunk');
    assert.ok(paths.some((p) => /\/data\/rank_log-0$/.test(p)), 'rank chunk');
    for (const [p, v] of fake.store) assert.ok(JSON.stringify(v).length < 262144, p + ' too large');
    assert.deepEqual(a.errors, []);
  });
  await check('a fresh page load reads everything back from the db', async () => {
    const b = boot({ claude: claudeFor(fake.db) }); await sleep(500);
    assert.match(b.d.querySelector('#top .sub').textContent, /Sample client/);
    nav(b.d, 'tracking'); await sleep(40);
    assert.equal(b.d.querySelectorAll('#tb_kw tbody tr').length, 10);
    nav(b.d, 'overview'); await sleep(40);
    assert.ok(b.d.querySelectorAll('.kpi').length > 5);
    assert.deepEqual(b.errors, []);
  });
  await check('big datasets split into several chunks and reassemble', async () => {
    const rows = ['Top queries,Clicks,Impressions,CTR,Position'];
    for (let i = 0; i < 2500; i++) rows.push(`keyword number ${i} with some extra words to add size,${i % 9},${100 + i},1%,${5 + (i % 20)}`);
    nav(a.d, 'data'); await sleep(20);
    click(a.d, '[data-act="paste"][data-k="gsc_queries"]');
    a.d.getElementById('ptext').value = rows.join('\n'); a.d.querySelector('[data-dlg="1"]').click(); await sleep(900);
    const chunks = [...fake.store.keys()].filter((p) => /gsc_queries-\d+$/.test(p));
    assert.ok(chunks.length >= 2, 'expected multiple chunks, got ' + chunks.length);
    const b = boot({ claude: claudeFor(fake.db) }); await sleep(500);
    nav(b.d, 'data'); await sleep(30);
    assert.match(b.d.getElementById('view').textContent, /2,500 rows/);
    assert.deepEqual(b.errors, []);
  });
  await check('shrinking a dataset deletes stale chunks', async () => {
    click(a.d, '[data-act="paste"][data-k="gsc_queries"]');
    a.d.querySelector('[data-merge="gsc_queries"]').checked = false; a.d.querySelector('[data-merge="gsc_queries"]').dispatchEvent(new a.w.Event('change', { bubbles: true }));
    a.d.getElementById('ptext').value = CSV.gscQ; a.d.querySelector('[data-dlg="1"]').click(); await sleep(900);
    const chunks = [...fake.store.keys()].filter((p) => /gsc_queries-\d+$/.test(p));
    assert.equal(chunks.length, 1);
  });
  await check('deleting a client removes its documents', async () => {
    click(a.d, '[data-act="delclient"]'); a.d.querySelector('[data-dlg="1"]').click(); await sleep(900);
    assert.equal([...fake.store.keys()].filter((p) => p.startsWith('clients/')).length, 0);
  });
}


console.log('Live connections UI (mock supabase adapter and edge functions)');
{
  const fake = fakeDb();
  const calls = [];
  let connRows = [{ provider: 'gsc', account_label: 'team@example.com', status: 'connected', last_sync_at: '2026-10-05T10:00:00Z', last_error: null }, { provider: 'gads', account_label: 'team@example.com', status: 'needs_reconnect', last_sync_at: null, last_error: 'Google rejected the stored sign-in.' }];
  const sb = {
    init: async () => ({ db: fake.db, uid: 'u1' }),
    api: {
      connections: async () => connRows,
      invoke: async (name, body) => {
        calls.push([name, body]);
        if (name === 'connect' && body.action === 'google-start') return { url: 'about:blank#oauth' };
        if (name === 'connect' && body.action === 'discover') return { options: [{ value: 'sc-domain:found.example', label: 'sc-domain:found.example (owner)' }] };
        if (name === 'sync') return { synced: [{ clientId: body.clientId, results: [{ provider: 'gsc', ok: true, rows: 10 }, { provider: 'gads', ok: false, error: 'x' }] }] };
        return { ok: true };
      },
    },
  };
  const html2 = html.replace('window.FS42_CONFIG = {};', "window.FS42_CONFIG = {supabaseUrl:'https://x.supabase.co',supabaseAnonKey:'k'};").replace('window.FS42Adapters.supabase={', 'window.FS42Adapters.supabase=window.__fakeSb||{');
  const errors = [];
  const dom = new JSDOM(html2, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.test/?connected=gsc',
    beforeParse(w) { w.__fakeSb = sb; w.console.error = (...a) => errors.push(a.join(' ')); w.scrollTo = () => {}; } });
  const w = dom.window, d = w.document;
  await sleep(300);
  await check('returning from Google opens Live connections with a message', () => {
    assert.match(d.querySelector('#top h1').textContent, /Live connections/);
    assert.ok(!w.location.search, 'query string should be cleared');
  });
  await check('create a client, then see five source cards with statuses', async () => {
    nav(d, 'data'); await sleep(30);
    click(d, '[data-act="newclient"]'); d.getElementById('askv').value = 'Test client'; d.querySelector('[data-dlg="1"]').click(); await sleep(250);
    nav(d, 'connections'); await sleep(120);
    const t = d.getElementById('view').textContent;
    for (const n of ['Google Search Console', 'Google Analytics 4', 'Google Business Profile', 'Google Ads', 'Bing Webmaster Tools']) assert.match(t, new RegExp(n));
    assert.match(t, /Connected/); assert.match(t, /Needs reconnecting/); assert.match(t, /Google rejected the stored sign-in/);
  });
  await check('Connect Google asks the backend for a signed OAuth link', async () => {
    click(d, '[data-act="conn-google"][data-p="ga4"]'); await sleep(40);
    const c = calls.find((x) => x[1].action === 'google-start'); assert.ok(c); assert.equal(c[1].product, 'ga4'); assert.ok(c[1].clientId);
  });
  await check('Sync now sends the chosen history length', async () => {
    const sel = d.getElementById('connDays'); sel.value = '28'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    click(d, '[data-act="conn-sync"][data-p="gsc"]'); await sleep(40);
    const c = calls.filter((x) => x[0] === 'sync').pop(); assert.equal(JSON.stringify(c[1].providers), '["gsc"]'); assert.equal(c[1].days, 28);
  });
  await check('Find mine fills the identifier on Client info', async () => {
    click(d, '[data-act="conn-find"][data-p="gsc"]'); await sleep(40);
    d.querySelector('[data-dlg="1"]').click(); await sleep(60);
    nav(d, 'clientinfo'); await sleep(20);
    assert.equal(d.querySelector('[data-info="gsc"]').value, 'sc-domain:found.example');
  });
  await check('deleting a client disconnects its sources first', async () => {
    nav(d, 'data'); await sleep(20);
    click(d, '[data-act="delclient"]'); d.querySelector('[data-dlg="1"]').click(); await sleep(400);
    assert.ok(calls.some((x) => x[1].action === 'disconnect-all'));
  });
  await check('no script errors', () => assert.deepEqual(errors.filter((e) => !/Not implemented: navigation/.test(e)), []));
}

console.log(failures ? `\n${failures} test(s) failed` : '\nAll tests passed');
process.exit(failures ? 1 : 0);
