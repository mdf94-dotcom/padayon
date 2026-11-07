// Before/after check for session structure: run as node tests/09_retention_shape.js [repo folder]. Reports session length,
// how many spaced recalls each new word gets on the day it's taught, and look-alike words taught the same day.
// before/after: simulated learners for 30 days; how long sessions are and how new words get practiced on the day they're taught
const path = require('path'); const lib = require('./lib.js'); process.argv[2] = process.argv[2] || path.resolve(__dirname, '..');
const { open, ready, serve, chromium } = lib;
(async () => {
  const base = await serve(path.resolve(process.argv[2])), browser = await chromium.launch(); const res = {};
  for (const [name, miss, npd] of [['steady', 0.15, 8], ['struggling', 0.4, 8], ['keen', 0.1, 15]]) {
    const { page, close } = await open({ base, browser }); await ready(page);
    res[name] = await page.evaluate(async ({ miss, npd }) => {
      S.settings.newPerDay = npd; S.settings.music = false; let s = 777; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      const lens = [], spaced = [], lags = [], once = [], clash = []; let recalls = 0, newN = 0;
      for (let day = 0; day < 30; day++) { window.__jump(1); startSession(); const pos = {}, hits = {}, taughtToday = [];
        let g = 0, n = 0;
        while (view === 'session' && qi < Q.length && g++ < 700) { const it = Q[qi], c = card(it.id);
          if (it.type === 'teach') { if (!hits[it.id]) { pos[it.id] = n; hits[it.id] = []; taughtToday.push(it.id); } document.querySelector('#cont') ? document.querySelector('#cont').click() : next(); n++; await 0; continue; }
          if (it.type === 'rteach' || it.type === 'shadow') { document.querySelector('#cont') ? document.querySelector('#cont').click() : next(); n++; await 0; continue; }
          const ok = rnd() > miss; if (hits[it.id]) hits[it.id].push(n - (hits[it.id].length ? hits[it.id][hits[it.id].length - 1] : pos[it.id]));
          const cc = c.kind === 'r' ? { id: c.id, kind: 'r', ceb: c.ceb, en: c.en, audio: false } : c; result(cc, it, ok); next(); n++; await 0; }
        lens.push(n);
        taughtToday.filter(id => id[0] !== 'r').forEach(id => { newN++; const h = hits[id] || []; recalls += h.length; lags.push(...h); spaced.push(h.filter(l => l >= 4).length); once.push(h.length <= 1 ? 1 : 0); });
        // look-alike words (same "Don't mix up" group) both new on the same day
        const ws = taughtToday.map(card).filter(c => c && c.mix); let k = 0; ws.forEach((a, i) => ws.slice(i + 1).forEach(b => { if (a.mix.some(m => (m.w || []).length && b.mix.includes(m))) k++; })); clash.push(k);
      }
      const avg = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 0;
      return { session_avg: avg(lens), session_max: Math.max(...lens), new_words: newN, recalls_per_new_word: +(recalls / newN).toFixed(2), spaced_recalls_per_new_word: avg(spaced), avg_gap_between_recalls: avg(lags), pct_new_words_recalled_only_once: Math.round(100 * avg(once)), lookalike_pairs_new_same_day: clash.reduce((a, b) => a + b, 0), rules: Object.keys(S.rules || {}).length };
    }, { miss, npd });
    await close();
  }
  console.log(JSON.stringify(res, null, 1)); await browser.close(); base.close();
})();
