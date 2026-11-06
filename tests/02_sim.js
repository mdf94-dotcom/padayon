'use strict';
/* A simulated learner over many days. Usage: node 02_sim.js [days] */
const { open, ready, serve, chromium, Report } = require('./lib');
const DAYS = +process.argv[2] || 35;
const profile = (name, cfg) => ({ name, cfg });
const PROFILES = [profile('steady', { miss: 0.15, npd: 8, skip: 0 }), profile('struggling', { miss: 0.45, npd: 8, skip: 0 }), profile('keen', { miss: 0.1, npd: 15, skip: 0 }), profile('on and off', { miss: 0.2, npd: 8, skip: 0.3 })];
(async () => {
  const R = new Report('sim'); const base = await serve(), browser = await chromium.launch();
  for (const { name, cfg } of PROFILES) {
    const { page, log, close } = await open({ base, browser }); await ready(page);
    const out = await page.evaluate(async ({ DAYS, cfg }) => {
      const issues = [], daily = []; S.settings.newPerDay = cfg.npd; S.settings.music = false; let seedD = 0;
      const rnd = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
      window.__ended = 0; const known0 = () => new Set(Object.keys(S.cards));
      for (let day = 0; day < DAYS; day++) {
        window.__jump(1);
        if (rnd() < cfg.skip) continue;
        const t = today(), rulesBefore = Object.keys(S.rules || {}).filter(id => S.rules[id].d === t).length, cardsBefore = new Set(Object.keys(S.cards));
        startSession(); const len0 = Q.length; const taught = new Set(cardsBefore); const newOrder = []; let answered = 0, guard = 0, rulesTaught = 0;
        const firstReviewTypes = {};
        while (view === 'session' && qi < Q.length && guard++ < 600) {
          const item = Q[qi], c = card(item.id);
          if (!c) { issues.push(['no card', item]); next(); continue; }
          if (HIDE.has(item.id)) issues.push(['hidden asked', item.id]);
          if (item.type === 'teach' || item.type === 'rteach') { if (!cardsBefore.has(item.id)) newOrder.push(item.id); taught.add(item.id); if (item.type === 'rteach') rulesTaught++; }
          else if (item.type !== 'shadow' && !taught.has(item.id)) issues.push(['asked before taught', item.id, item.type, day]);
          if (item.type === 'shadow' && !taught.has(item.id)) issues.push(['shadow before taught', item.id, day]);
          // choices on screen are all things that have been taught
          const bad = [...document.querySelectorAll('#ex .opt')].filter(o => /undefined|null/.test(o.textContent)); if (bad.length) issues.push(['bad option', item.id, item.type]);
          if (/undefined/.test(document.querySelector('#ex')?.textContent || '')) issues.push(['undefined on screen', item.id, item.type, day]);
          if (document.querySelector('#cont') && (item.type === 'teach' || item.type === 'rteach' || item.type === 'shadow')) { document.querySelector('#cont').click(); }
          else { const ok = rnd() > cfg.miss; answered++; const cc = c.kind === 'r' ? { id: c.id, kind: 'r', ceb: c.ceb, en: c.en, audio: false } : c; result(cc, item, ok); next(); }
          await 0;
        }
        if (guard >= 600) issues.push(['session never ended', day, Q.length]);
        if (view === 'session') issues.push(['stuck in session', day]);
        const ruleN = Object.keys(S.rules || {}).filter(id => S.rules[id].d === t).length;
        if (ruleN > 2) issues.push(['more than two rules', day, ruleN]);
        const realNew = [...new Set(newOrder)].filter(id => id[0] !== 'r');
        if (realNew.length > cfg.npd) issues.push(['too many new', day, realNew.length]);
        // grammar first: while building blocks and grammar remain, ordinary words don't come ahead of them unless they unlock an example
        const gfLeft = [...F_ORDER, ...GRAM_ORDER].filter(id => card(id) && !cardsBefore.has(id)).length;
        const gf = realNew.filter(id => /^[fg]/.test(id)).length, other = realNew.length - gf;
        daily.push({ day, q: len0, end: Q.length, ans: answered, nw: realNew.length, gf, other, gfLeft, rules: rulesTaught, due: dueIds().length, streak: streakNow(), learned: learnedCount(), stage: pathState().cur + 1 });
        // extra review after finishing brings nothing new
        if (day % 10 === 3) { const b4 = Object.keys(S.cards).length; const rb4 = Object.keys(S.rules || {}).length; view = 'home'; planDay(); startSession(); const nt = Q.filter(x => x.type === 'teach' || x.type === 'rteach'); if (nt.length) issues.push(['Review again has new material', day, nt.map(x => x.id).slice(0, 6), nt.length]); view = 'home'; clearInterval(timerH); stopAudio(); }
        view = 'home'; clearInterval(timerH);
        if (day % 7 === 0) { try { render(); } catch (e) { issues.push(['home crash', String(e)]); } }
      }
      return { issues, daily };
    }, { DAYS, cfg });
    const d = out.daily, max = Math.max(...d.map(x => x.q)), avg = Math.round(d.reduce((s, x) => s + x.q, 0) / d.length);
    console.log(`  ${name}: ${d.length} days, questions avg ${avg} max ${max} (ended up to ${Math.max(...d.map(x => x.end))}), new avg ${(d.reduce((s, x) => s + x.nw, 0) / d.length).toFixed(1)}, rules ${d.reduce((s, x) => s + x.rules, 0)}, learned ${d[d.length - 1].learned}, stage ${d[d.length - 1].stage}, streak ${d[d.length - 1].streak}, due left ${d[d.length - 1].due}`);
    console.log('   ', d.filter((_, i) => i % 7 === 0).map(x => `d${x.day}:q${x.q}/n${x.nw}(gf${x.gf})/r${x.rules}/due${x.due}`).join(' '));
    const kinds = {}; out.issues.forEach(i => kinds[i[0]] = (kinds[i[0]] || 0) + 1); console.log('    issues', JSON.stringify(kinds));
    Object.entries(kinds).forEach(([k, n]) => R.ok(false, `${name}: ${k} x${n}: ` + JSON.stringify(out.issues.find(i => i[0] === k))));
    R.ok(max <= 100, `${name}: session of ${max} questions is too long`);
    R.ok(!log.pageErrors.length, `${name}: page errors ` + log.pageErrors.slice(0, 3)); R.ok(!log.console.length, `${name}: console errors ` + log.console.slice(0, 3));
    if (cfg.skip === 0) R.ok(d[d.length - 1].streak === d.length, `${name}: streak ${d[d.length - 1].streak} after ${d.length} straight days`);
    if (name === 'steady') { const f = d.slice(0, 5); R.ok(f.every(x => x.gf >= x.other || !x.gfLeft), 'steady: grammar comes first in week one ' + JSON.stringify(f.map(x => [x.gf, x.other]))); }
    await close();
  }
  await browser.close(); base.close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
