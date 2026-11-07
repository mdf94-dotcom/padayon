'use strict';
/* Plays every game all the way through with real clicks: Padayon Rush, Province Rush, Language Rush (picking and typing),
   map practice, Numbers, Conversations, Stories and Real Bisaya. Checks the right answer is always there, bests are saved, and nothing errors. */
const { open, ready, serve, chromium, Report } = require('./lib');
const RIGHT_RUNS = 25;
(async () => {
  const R = new Report('games'); const base = await serve(), browser = await chromium.launch();
  for (const how of ['pick', 'type']) {
    const { page, log, close } = await open({ base, browser }); await ready(page);
    await page.evaluate(how => { S.settings.rushInput = how; S.settings.music = false; save(); window.__ended = 5; }, how);
    // Padayon Rush: RIGHT_RUNS right answers, then a wrong one
    await page.evaluate(() => { view = 'rushhome'; render(); }); await page.click('#rushplay');
    let streak = 0, bad = [];
    for (let k = 0; k < RIGHT_RUNS + 1; k++) {
      await page.waitForFunction(how => view !== 'rush' || (how === 'type' ? !!document.querySelector('#tans:not([disabled])') : !!document.querySelector('.opt:not([disabled])') && !document.querySelector('.opt.right, .opt.wrong')), how, { timeout: 8000 });
      if (await page.evaluate(() => view !== 'rush')) { bad.push('run ended early at ' + k); break; }
      const info = await page.evaluate(() => { const id = [...RU.seen].pop(), c = card(id), opts = [...document.querySelectorAll('.opt')].map(o => o.textContent); return { id, en: c.en, ceb: c.ceb, opts, n: RU.n, has: opts.filter(t => t === optText(c, 'en')).length }; });
      const wantRight = k < RIGHT_RUNS;
      if (how === "pick" && info.has !== 1) bad.push(`right answer shown ${info.has} times for ${info.ceb}: ${JSON.stringify(info.opts)}`);
      await page.evaluate(({ how, wantRight }) => { const id = [...RU.seen].pop(), c = card(id);
        if (how === 'pick') { const opts = [...document.querySelectorAll('.opt:not([disabled])')]; const right = opts.findIndex(o => o.textContent === optText(c, 'en')); if (right < 0) { window.__gbad = (window.__gbad || []).concat([[c.ceb, optText(c, 'en'), opts.map(o => o.textContent)]]); (opts[0] || {}).click?.(); return; } opts[wantRight ? right : (right + 1) % opts.length].click(); }
        else { const i = document.querySelector('#tans'); i.value = wantRight ? (firstAlt(c.en).replace(/\s*\(.*?\)\s*/g, ' ').split(/[;,]/)[0].trim() || firstAlt(c.en).replace(/[()]/g, '').split(/[:;,]/)[0].trim()) : 'zzzz qqq'; document.querySelector('#tform').requestSubmit(); } }, { how, wantRight });
      await page.waitForTimeout(wantRight ? 30 : 900);
      const gb = await page.evaluate(() => { const g = window.__gbad; window.__gbad = null; return g; }); if (gb) { bad.push('right answer not among choices: ' + JSON.stringify(gb)); break; }
      if (wantRight) { const n = await page.evaluate(() => RU.n); if (n !== info.n + 1) bad.push(`right answer for "${info.ceb}" (${info.en}) not counted (typed: ${how === 'type'})`); else streak++; }
    }
    await page.waitForFunction(() => view === 'summary', null, { timeout: 5000 }).catch(() => bad.push('no summary after a miss'));
    const sum = await page.evaluate(() => ({ best: S.rushBest, how: S.rushHow, txt: document.querySelector('#app').textContent.slice(0, 60) }));
    R.ok(!bad.length, `Rush (${how}): ` + JSON.stringify(bad.slice(0, 4))); R.ok(sum.best === streak && sum.how === how, `Rush (${how}) best saved ${JSON.stringify(sum)} after ${streak}`);
    await page.click('#again'); await page.waitForTimeout(200); R.ok(await page.evaluate(() => view === 'rush'), 'Rush: Go again starts a run');
    await page.click('#quit'); await page.waitForTimeout(100); R.ok(await page.evaluate(() => view === 'summary'), 'Rush: quitting shows the summary');
    { // typed meanings: the whole meaning as shown, one part of it, or a bracket-only meaning all count; a wrong word doesn't
    const m = await page.evaluate(() => [meaningOk('rock or stone', 'rock or stone'), meaningOk('stone', 'rock or stone'), meaningOk('plural', '(plural: more than one)'), !meaningOk('dog', '(plural: more than one)'), !meaningOk('cat', 'rock or stone')]);
    R.ok(m.every(Boolean), 'typed meaning matching ' + m); }
  if (how === 'pick') { // confirm before grading: in the rule drill, story quiz and placement, a tap only selects (and can change); Check grades it
    const r = await page.evaluate(() => { const out = {}; const t = today(); PATH.flatMap(s => s.ids).slice(0, 1200).forEach(id => { if (card(id) && id[0] !== 'r') S.cards[id] = { b: 3, d: t + 10, r: 4, w: 0 }; });
      S.rules = {}; BD = null; startBuild(); if (BD && BD.phase === 'teach') { BD.phase = 'drill'; render(); }
      const grab = () => [...document.querySelectorAll('#app .opt')];
      let o = grab(); if (!o.length) return { none: view };
      o[0].click(); out.drillGradedOnTap = o.some(x => x.classList.contains('right') || x.classList.contains('wrong'));
      o[1].click(); out.drillMoved = o[1].classList.contains('sel') && !o[0].classList.contains('sel');
      document.querySelector('#chk').click(); out.drillGraded = o.some(x => x.classList.contains('right')) && !!document.querySelector('#cont');
      view = 'home'; return out; });
    R.ok(r.drillGradedOnTap === false && r.drillMoved && r.drillGraded, 'rule drill: tap selects, Check grades ' + JSON.stringify(r));
  }
  // the map games
    for (const mode of ['prov', 'lang']) {
      await page.evaluate(() => { view = 'rushhome'; render(); }); await page.click('#geo' + mode); await page.waitForFunction(() => view === 'geogame', null, { timeout: 15000 });
      let n = 0, gbad = [];
      for (let k = 0; k < RIGHT_RUNS + 1; k++) {
        await page.waitForFunction(() => view !== 'geogame' || (GG && !GG.done), null, { timeout: 8000 }).catch(() => gbad.push('stuck after ' + k));
        if (await page.evaluate(() => view !== 'geogame')) { gbad.push('ended early at ' + k); break; }
        const st = await page.evaluate(() => ({ right: GG.right, opts: GG.opts, n: GG.n }));
        if (how === 'pick' && st.opts.filter(o => o === st.right).length !== 1) gbad.push('right answer missing/twice ' + st.right);
        if (how === 'pick' && new Set(st.opts).size !== st.opts.length) gbad.push('same choice twice ' + st.opts);
        const wantRight = k < RIGHT_RUNS;
        await page.evaluate(({ how, wantRight }) => { if (how === 'pick') { const b = [...document.querySelectorAll('.geo-opts .opt')]; const r = GG.opts.indexOf(GG.right); b[wantRight ? r : (r + 1) % b.length].click(); } else { const i = document.querySelector('#tans'); i.value = wantRight ? GG.right : 'Zzzzz'; document.querySelector('#tform').requestSubmit(); } }, { how, wantRight });
        await page.waitForTimeout(wantRight ? 950 : 1200);
        if (wantRight) { const m = await page.evaluate(() => GG.n); if (m === st.n + 1) n++; else gbad.push('right not counted: ' + st.right); }
      }
      await page.waitForFunction(() => view === 'summary', null, { timeout: 6000 }).catch(() => gbad.push('no summary'));
      const best = await page.evaluate(mode => (S.geoBest || {})[mode], mode);
      R.ok(!gbad.length, `${mode} Rush (${how}): ` + JSON.stringify(gbad.slice(0, 4))); R.ok(best === n, `${mode} Rush (${how}) best ${best} after ${n} right`);
    }
    // map practice: misses don't end it
    await page.evaluate(() => { view = 'rushhome'; render(); }); await page.click('#geoprovp'); await page.waitForFunction(() => view === 'geogame');
    for (let k = 0; k < 4; k++) { await page.evaluate(how => { if (how === 'pick') document.querySelector('.geo-opts .opt').click(); else { document.querySelector('#tans').value = 'zzz'; document.querySelector('#tform').requestSubmit(); } }, how); await page.waitForSelector('#cont'); await page.click('#cont'); }
    R.ok(await page.evaluate(() => view === 'geogame' && GG.practice), 'map practice keeps going after misses');
    await page.click('#quit'); R.ok(await page.evaluate(() => view === 'rushhome'), 'map practice closes to Games');
    R.ok(!log.pageErrors.length, `games (${how}): page errors ` + JSON.stringify(log.pageErrors.slice(0, 3))); R.ok(!log.console.length, `games (${how}): console errors ` + JSON.stringify(log.console.slice(0, 3)));
    await close();
  }
  { // Numbers, Conversations, Stories, Real Bisaya all the way through
    const { page, log, close } = await open({ base, browser }); await ready(page);
    await page.evaluate(() => { const t = today(); PATH.flatMap(s => s.ids).slice(0, 1200).forEach(id => { if (card(id) && id[0] !== 'r') S.cards[id] = { b: 3, d: t + 10, r: 4, w: 0 }; }); S.settings.music = false; save(); window.__ended = 5; });
    // numbers: a full round of 10
    await page.evaluate(() => { view = 'numbers'; render(); });
    const nb = await page.evaluate(() => [...document.querySelectorAll('#app button')].map(b => b.id || b.textContent.trim().slice(0, 20)));
    const startBtn = nb.find(x => /^(numgo|go|start)/i.test(x)) || null;
    const nr = await page.evaluate(async () => { const out = { steps: 0, errs: [] }; const btn = [...document.querySelectorAll('#app button')].find(b => /start|go|play/i.test(b.id + b.textContent)); if (!btn) return { none: [...document.querySelectorAll('#app button')].map(b => b.id + ':' + b.textContent.trim().slice(0, 20)) }; btn.click(); await new Promise(r => setTimeout(r, 50));
      for (let k = 0; k < 40 && view === 'numround'; k++) { out.steps++; const opt = document.querySelector('#app .opt:not([disabled])'), inp = document.querySelector('#app input:not([disabled])'); if (opt) { opt.click(); const c = document.querySelector('#chk:not([disabled])'); if (c) c.click(); } else if (inp) { inp.value = '5'; inp.dispatchEvent(new Event('input')); (document.querySelector('#chk') || document.querySelector('#tgo') || {}).click?.(); if (inp.form) inp.form.requestSubmit(); } else { const any = document.querySelector('#app .btn.primary:not([disabled])'); if (any) any.click(); else { out.errs.push('nothing to press'); break; } } await new Promise(r => setTimeout(r, 40)); const c2 = document.querySelector('#cont'); if (c2) c2.click(); await new Promise(r => setTimeout(r, 30)); }
      out.end = view; out.i = NR && NR.i; return out; });
    R.ok(nr.end && nr.end !== 'numround' && !nr.errs?.length, 'Numbers: a round of 10 finishes ' + JSON.stringify(nr));
    // Conversations, every Story, Real Bisaya: keep pressing whatever moves you on, until the screen is left; "stuck" = nothing to press
    const walkThrough = (enter, stay) => page.evaluate(async ({ enter, stay }) => { eval(enter); await new Promise(r => setTimeout(r, 40)); const re = new RegExp(stay);
      for (let k = 0; k < 250; k++) { if (!re.test(view)) return 'finished:' + view; const inp = document.querySelector('#app input.field:not([disabled]), #app #rep:not([disabled])'); if (inp && !inp.value) { inp.value = 'Salamat'; inp.dispatchEvent(new Event('input')); }
        const b = ['#nx', '#cont', '#fin', '#sh', '#chk:not([disabled])', '#tgo:not([disabled])', '.opt:not([disabled]):not(.sel)', '#bank .tile:not(.used)', '#show', '[data-q="2"]', '[data-q="1"]', '#again'].map(q => document.querySelector(q)).find(Boolean);
        if (!b) return 'stuck:' + view + ':' + document.querySelector('#app').textContent.replace(/\s+/g, ' ').slice(0, 90); if (b.id === 'again') return 'finished:' + view; b.click(); await new Promise(r => setTimeout(r, 20)); }
      return 'loop:' + view; }, { enter, stay });
    const cv = []; for (let k = 0; k < 6; k++) cv.push(await walkThrough("view = 'convos'; render();", '^convos?$'));
    console.log('  conversations', JSON.stringify(cv.map(x => x.slice(0, 40)))); R.ok(cv.every(x => x.startsWith('finished')), 'Conversations: ' + JSON.stringify(cv.filter(x => !x.startsWith('finished'))));
    const nStories = await page.evaluate(() => { view = 'stories'; render(); return document.querySelectorAll('[data-story]').length; }), st = [];
    for (let i = 0; i < nStories; i++) st.push(await walkThrough(`view = 'stories'; render(); document.querySelectorAll('[data-story]')[${i}].click();`, '^story$'));
    console.log('  stories', nStories, JSON.stringify(st.map(x => x.slice(0, 30)))); R.ok(st.every(x => x.startsWith('finished')), 'Stories: ' + JSON.stringify(st.filter(x => !x.startsWith('finished'))));
    const rl = []; for (let k = 0; k < 6; k++) rl.push(await walkThrough("view = 'real'; render();", '^real$'));
    console.log('  real', JSON.stringify(rl.map(x => x.slice(0, 60)))); R.ok(rl.every(x => x.startsWith('finished')), 'Real Bisaya: ' + JSON.stringify(rl.filter(x => !x.startsWith('finished'))));
    R.ok(!log.pageErrors.length, 'page errors ' + JSON.stringify(log.pageErrors.slice(0, 3))); R.ok(!log.console.length, 'console errors ' + JSON.stringify(log.console.slice(0, 3)));
    await close();
  }
  await browser.close(); base.close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
