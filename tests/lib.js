'use strict';
/* Shared test harness: serves the repo locally, opens it in headless Chromium, and cuts off the outside world.
   Firebase is replaced by tests/mock-firebase.js (in memory, fake users only). Anything else that tries to leave
   localhost is blocked and recorded, so a test can never touch a real account or post to Discord. */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.bin': 'application/octet-stream' };
function serve(root = ROOT, port = 0) {
  return new Promise(res => { const s = http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p);
    if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'content-length': b.length }); r.end(b); });
  }); s.listen(port, '127.0.0.1', () => res({ server: s, url: `http://127.0.0.1:${s.address().port}/`, close: () => s.close() })); });
}
const MOCK = fs.readFileSync(path.join(__dirname, 'mock-firebase.js'), 'utf8');
// Date with a movable clock: window.__setDay(n) jumps n days ahead; the audio element is replaced by a recorder
const CLOCK = `(() => { const R = Date; let off = 0; try { off = +sessionStorage.getItem('__off') || 0; } catch (e) { }
  class D extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } }
  window.Date = D; window.__shift = ms => { off = ms; try { sessionStorage.setItem('__off', ms); } catch (e) { } }; window.__jump = days => window.__shift(off + days * 864e5); })();`;
const AUDIO = `(() => { window.__plays = []; window.__ended = 15;
  class A { constructor() { this.src = ''; this.playbackRate = 1; this.currentTime = 0; this.paused = true; this.L = {}; }
    addEventListener(k, f) { (this.L[k] = this.L[k] || []).push(f); }
    fire(k) { (this.L[k] || []).forEach(f => f()); if (this['on' + k]) this['on' + k](); }
    play() { this.paused = false; window.__plays.push({ src: this.src, at: performance.now(), rate: this.playbackRate }); clearTimeout(this.t); this.t = setTimeout(() => { this.paused = true; this.fire('ended'); }, window.__ended); return Promise.resolve(); }
    pause() { clearTimeout(this.t); if (!this.paused) { this.paused = true; this.fire('pause'); } } }
  window.Audio = A; })();`;
async function open(opts = {}) {
  const base = opts.base || await serve();
  const browser = opts.browser || await chromium.launch();
  const context = await browser.newContext(Object.assign({ viewport: opts.viewport || { width: 390, height: 844 }, timezoneId: opts.tz || 'America/New_York', serviceWorkers: opts.sw ? 'allow' : 'block' }, opts.context || {}));
  const log = { pageErrors: [], console: [], blocked: [], discord: [] };
  await context.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(base.url)) return r.continue();
    if (/gstatic\.com\/firebasejs/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: u.includes('firebase-app-compat') ? MOCK : '' });
    if (/discord/i.test(u)) { log.discord.push(r.request().method()); return r.fulfill({ status: 204, body: '' }); }
    log.blocked.push(u.replace(/\?.*/, '')); return r.abort();
  });
  await context.addInitScript(CLOCK);
  if (opts.audio !== false) await context.addInitScript(AUDIO);
  if (opts.fbUser) await context.addInitScript(`window.__fbUser = ${JSON.stringify(opts.fbUser)};`);
  if (opts.fbDocs) await context.addInitScript(`window.__fbDocs = ${JSON.stringify(opts.fbDocs)};`);
  if (opts.state) await context.addInitScript(`if (!localStorage.getItem('padayon-app-v1')) localStorage.setItem('padayon-app-v1', ${JSON.stringify(JSON.stringify(opts.state))});`);
  if (opts.initScript) await context.addInitScript(opts.initScript);
  const page = await context.newPage();
  page.on('pageerror', e => log.pageErrors.push(String(e.message || e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) log.console.push(m.text().slice(0, 300)); });
  await page.goto(base.url + (opts.path || 'index.html'));
  await page.waitForFunction(() => typeof hasPack === 'function' && hasPack(), null, { timeout: 60000 });
  await page.waitForFunction(() => typeof VIDX !== 'undefined' && VIDX, null, { timeout: 60000 }).catch(() => { });
  const close = async () => { await context.close(); if (!opts.browser) await browser.close(); if (!opts.base) base.close(); };
  return { page, context, browser, base, log, close };
}
// a learner past the tutorial and placement test
const READY = 'S.guideV = GUIDE_V; S.placed = S.placed || today() || 1; localSave();';
async function ready(page) { await page.evaluate(`${READY} view = 'home'; render();`); }
class Report {
  constructor(name) { this.name = name; this.fails = []; this.notes = []; this.n = 0; }
  ok(cond, msg) { this.n++; if (!cond) { this.fails.push(msg); console.log('  FAIL ' + msg); } return cond; }
  note(msg) { this.notes.push(msg); console.log('  note ' + msg); }
  done() { console.log(`${this.name}: ${this.n - this.fails.length}/${this.n} passed, ${this.notes.length} notes`); process.exitCode = this.fails.length ? 1 : 0; }
}
module.exports = { serve, open, ready, READY, Report, ROOT, chromium };
