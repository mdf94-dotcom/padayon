'use strict';
/* My journey: path map, word web and then-and-now render at phone and desktop size, words open their page,
   word families only join real builds on a word (kaon -> mokaon), and daily snapshots merge across devices. */
const { open, ready, serve, chromium, Report } = require('./lib');
(async () => {
  const R = new Report('journey'); const base = await serve(), browser = await chromium.launch();
  for (const [w, h, tag] of [[390, 844, 'phone'], [320, 568, 'small'], [1280, 800, 'desktop']]) {
    const { page, close, log } = await open({ base, browser, viewport: { width: w, height: h } }); await ready(page);
    const r = await page.evaluate(async () => { const t = today(); S.started = t - 20; S.rules = S.rules || {};
      PATH[0].ids.concat(PATH[1].ids.slice(0, 120)).forEach((id, i) => { if (card(id) && id[0] !== 'r') S.cards[id] = { b: 1 + (i % 6), d: t + 3, r: 3, w: i % 9 === 0 ? 2 : 0 }; });
      RULES.slice(0, 4).forEach(r => S.rules[r.id] = { ok: 1, d: t - 3 }); for (let d = 0; d < 15; d++) S.xp[t - d] = 30 + d; save();
      const out = {}; const wait = ms => new Promise(r => setTimeout(r, ms));
      for (const k of ['map', 'web', 'then']) { JTAB = k; go('journey'); await wait(k === 'web' ? 400 : 150);
        out[k] = { und: /undefined|NaN/.test(document.querySelector('#jbody').textContent), wide: document.documentElement.scrollWidth > innerWidth + 1 };
        if (k === 'map') { const b = document.querySelector('#jbinko'); out.map.binko = !!b && /translate\(\d/.test(b.getAttribute('transform') || ''); out.map.stops = document.querySelectorAll('.jstop').length; }
        if (k === 'web') { out.web.nodes = document.querySelectorAll('.jn').length; document.querySelector('.jn').dispatchEvent(new MouseEvent('click', { bubbles: true })); out.web.sheet = !!document.querySelector('#wsheet'); const ws = document.querySelector('#wsheet'); if (ws) ws.remove();
          const d = webData(); out.web.badFam = d.links.filter(l => l.k === 'fam').map(l => [d.nodes[l.a].w, d.nodes[l.b].w]).filter(([a, b]) => !b.includes(a)).slice(0, 5); }
        if (k === 'then') { out.then.rows = document.querySelectorAll('.jthen .jtn:not(.head)').length; out.then.words = +document.querySelector('.jt1').textContent; } }
      const a = { hist: { 10: { w: 5, r: 1 } } }, b = { hist: { 10: { w: 9, r: 1 }, 11: { w: 12, r: 2 } } }; const m = mergeState(Object.assign(JSON.parse(JSON.stringify(S)), a), Object.assign(JSON.parse(JSON.stringify(S)), b, { wipedAt: S.wipedAt }));
      out.mergeHist = m.hist && m.hist[10] && m.hist[10].w === 9 && m.hist[11] && m.hist[11].w === 12; return out; });
    R.ok(!r.map.und && !r.web.und && !r.then.und, tag + ' nothing undefined on screen'); R.ok(!r.map.wide && !r.web.wide && !r.then.wide, tag + ' no sideways scroll');
    R.ok(r.map.binko && r.map.stops === 5, tag + ' map has 5 stops and Binko on the road ' + JSON.stringify(r.map));
    R.ok(r.web.nodes > 5 && r.web.sheet, tag + ' word web draws and a word opens its page ' + JSON.stringify(r.web.nodes));
    R.ok(!r.web.badFam.length, tag + ' families are real builds on a word ' + JSON.stringify(r.web.badFam));
    R.ok(r.then.rows === 5 && r.then.words > 0, tag + ' then and now ' + JSON.stringify(r.then)); R.ok(r.mergeHist, 'snapshots merge across devices');
    R.ok(!log.pageErrors.length, tag + ' page errors: ' + log.pageErrors.join('; ')); await close();
  }
  await browser.close(); base.close(); R.done();
})();
