'use strict';
/* Offline and updates: works with no network after the first load, and a new version replaces the old one cleanly. */
const fs = require('fs'), os = require('os'), path = require('path');
const { serve, chromium, Report, ROOT } = require('./lib');
(async () => {
  const R = new Report('pwa'); const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const shell = eval(sw.match(/const SHELL = (\[[\s\S]*?\]);/)[1]); shell.filter(f => f !== './').forEach(f => R.ok(fs.existsSync(path.join(ROOT, f)), 'service worker lists a missing file: ' + f));
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); [...html.matchAll(/<script src="([^"h][^"]*)"/g)].map(m => m[1]).forEach(f => R.ok(shell.includes(f), 'script not cached for offline: ' + f));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pad-')); fs.readdirSync(ROOT).forEach(f => { if (['.git', 'tests', 'home', 'test'].includes(f)) return; fs.symlinkSync(path.join(ROOT, f), path.join(root, f)); });
  fs.rmSync(path.join(root, 'sw.js')); fs.writeFileSync(path.join(root, 'sw.js'), sw); fs.rmSync(path.join(root, 'app.js')); fs.writeFileSync(path.join(root, 'app.js'), fs.readFileSync(path.join(ROOT, 'app.js')));
  const base = await serve(root), browser = await chromium.launch(), ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const errs = []; const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message));
  await ctx.route(/gstatic\.com|discord/i, r => r.abort());
  await page.goto(base.url + 'index.html'); await page.waitForFunction(() => hasPack());
  await page.evaluate(() => navigator.serviceWorker.register('sw.js')); await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForTimeout(800);
  const v0 = sw.match(/padayon-v\d+/)[0]; R.ok((await page.evaluate(() => caches.keys())).includes(v0), 'cache made ' + v0);
  await page.reload(); await page.waitForFunction(() => hasPack()); await page.waitForTimeout(500);
  await page.evaluate(() => { S.guideV = GUIDE_V; S.placed = today(); S.settings.music = false; localSave(); });
  await ctx.setOffline(true); await page.reload(); const ok = await page.waitForFunction(() => typeof hasPack === 'function' && hasPack(), null, { timeout: 15000 }).then(() => true, () => false); R.ok(ok, 'app opens offline');
  if (ok) { await page.waitForSelector('#start'); await page.evaluate(() => { startSession(); }); R.ok(await page.evaluate(() => view === 'session' && Q.length > 0), 'a session runs offline'); const voice = await page.evaluate(async () => { await new Promise(r => setTimeout(r, 300)); return !!VIDX; }); R.ok(voice, 'computer voice index available offline');
    R.ok(await page.evaluate(() => { const b = document.body.innerText; return !/undefined/.test(b); }), 'no undefined offline'); }
  R.ok(!errs.length, 'page errors offline ' + errs.slice(0, 3)); errs.length = 0; await ctx.setOffline(false);
  // new version
  const v1 = 'padayon-v999999'; fs.writeFileSync(path.join(root, 'sw.js'), sw.replace(v0, v1)); fs.writeFileSync(path.join(root, 'app.js'), fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') + '\nwindow.__NEW_BUILD = 1;\n');
  await page.reload(); await page.waitForFunction(() => hasPack()); await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); }); await page.waitForTimeout(1500);
  const keys = await page.evaluate(() => caches.keys()); R.ok(keys.includes(v1) && !keys.includes(v0), 'old cache removed on update ' + keys);
  await page.reload(); await page.waitForFunction(() => hasPack()); R.ok(await page.evaluate(() => window.__NEW_BUILD === 1), 'new code runs after the update');
  R.ok(await page.evaluate(() => S.guideV === GUIDE_V), 'progress survives the update'); R.ok(!errs.length, 'page errors after update ' + errs.slice(0, 3));
  await ctx.setOffline(true); await page.reload(); R.ok(await page.waitForFunction(() => typeof hasPack === 'function' && hasPack() && window.__NEW_BUILD === 1, null, { timeout: 15000 }).then(() => true, () => false), 'new version works offline');
  await browser.close(); base.close(); fs.rmSync(root, { recursive: true, force: true }); R.done();
})().catch(e => { console.error(e); process.exit(2); });
