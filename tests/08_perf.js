'use strict';
/* Speed: app start, Today page, session build, and how often the hot helpers get called. */
const { open, ready, serve, chromium, Report } = require('./lib');
const LIMIT = { boot: 4000, home: 150, build: 400, tabs: 300, q: 120 };
(async () => {
  const R = new Report('perf'); const base = await serve(), browser = await chromium.launch();
  const { page, context, close } = await open({ base, browser }); await ready(page);
  await page.evaluate(() => { const t = today(); PATH.flatMap(s => s.ids).slice(0, 1500).forEach((id, i) => { if (card(id)) S.cards[id] = { b: 2 + i % 5, d: t + (i % 30) - 3, r: 3, w: i % 7 === 0 ? 1 : 0 }; }); localSave(); });
  const t = await page.evaluate(() => {
    const out = {}, ms = f => { const a = performance.now(); f(); return Math.round(performance.now() - a); };
    let cards = 0; const c0 = card; card = function (id) { cards++; return c0(id); }; const count = f => { cards = 0; const m = ms(f); return [m, cards]; };
    S.updated++; out.home = count(() => { view = 'home'; render(); }); S.updated++; out.home2 = count(() => { view = 'home'; render(); });
    S.updated++; out.dueIds = count(() => dueIds()); out.pickNew = count(() => pickNew()); S.updated++; out.build = count(() => buildSession());
    out.distract = count(() => { const c = c0(Object.keys(S.cards)[5]); distract(c, 3, 'ceb'); }); out.knownOk = count(() => knownOk('Moadto ko sa balay')); out.gloss = count(() => { for (let i = 0; i < 10; i++) glossOf('zzznotaword' + i); }); out.breakdown = count(() => breakdown('Moadto ko sa merkado ugma'));
    const ids = Object.keys(S.cards); sess = newSess('daily');
    for (const ty of ['mc', 'listen', 'tiles', 'teach', 'dict']) { const id = ids.find(i => i[0] === 'w' && c0(i).audio); Q = [{ id, type: ty }]; qi = 0; view = 'session'; out['q_' + ty] = count(() => VIEWS.session()); stopAudio(); }
    for (const v of ['practice', 'rushhome', 'board', 'me']) { S.updated++; out['tab_' + v] = count(() => { view = v; render(); }); }
    card = c0; view = 'home'; return out;
  });
  console.log('  [ms, card() calls]', JSON.stringify(t));
  R.ok(t.home[0] < LIMIT.home * 3, 'Today page ' + t.home[0] + 'ms'); R.ok(t.build[0] < LIMIT.build, 'session build ' + t.build[0] + 'ms');
  for (const k of Object.keys(t).filter(k => k.startsWith('q_'))) R.ok(t[k][0] < LIMIT.q, k + ' ' + t[k][0] + 'ms'); for (const k of Object.keys(t).filter(k => k.startsWith('tab_'))) R.ok(t[k][0] < LIMIT.tabs, k + ' ' + t[k][0] + 'ms');
  // start with the pack already stored
  const p2 = await context.newPage(); const t0 = Date.now(); await p2.goto(base.url + 'index.html'); await p2.waitForFunction(() => typeof hasPack === 'function' && hasPack()); await p2.waitForSelector('#start, #gnext'); const boot = Date.now() - t0; console.log('  second start', boot, 'ms'); R.ok(boot < LIMIT.boot, 'app start ' + boot + 'ms'); await p2.close();
  await close(); await browser.close(); base.close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
