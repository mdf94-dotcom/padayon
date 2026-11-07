'use strict';
/* Every exercise type in the real session screen: right answers, wrong answers, typed boxes, "I don't know", misses coming back, choices. */
const { open, ready, serve, chromium, Report } = require('./lib');
(async () => {
  const R = new Report('grading'); const base = await serve(), browser = await chromium.launch();
  const { page, log, close } = await open({ base, browser }); await ready(page);
  // a learner with enough cards known for every kind of question
  await page.evaluate(() => { const t = today(); PATH[0].ids.concat(PATH[1].ids).slice(0, 400).forEach(id => { if (card(id) && id[0] !== 'r') S.cards[id] = { b: 3, d: t + 10, r: 4, w: 0 }; }); S.rules = S.rules || {}; RULES.slice(0, 6).forEach((r, i) => { S.rules[r.id] = { ok: 1, d: t - 3 }; S.cards['r' + i] = { b: 3, d: t + 10, r: 3, w: 0 }; }); localSave(); });
  const run = (id, type, how, extra) => page.evaluate(async ({ id, type, how, extra }) => {
    Q = [Object.assign({ id, type }, extra || {}), { id: 'g0', type: 'mc' }, { id: 'g1', type: 'mc' }, { id: 'g2', type: 'mc' }, { id: 'g3', type: 'mc' }, { id: 'g4', type: 'mc' }, { id: 'g5', type: 'mc' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session();
    const c = card(id), it = Q[0], before = JSON.stringify(S.cards[id] || null), out = { kind: type };
    const clickOpt = right => { const opts = [...document.querySelectorAll('.opt')]; const pick = opts.find(o => { const t = o.textContent; return right ? o.dataset.good === '1' : true; }); return opts; };
    const inp = document.querySelector('#ans');
    if (how === 'idk') document.querySelector('#idk').click();
    else if (inp) { inp.value = how.typed; inp.dispatchEvent(new Event('input')); out.chkOn = !document.querySelector('#chk').disabled; document.querySelector('#chk').click(); out.box = inp.classList.contains('right') ? 'right' : inp.classList.contains('wrong') ? 'wrong' : 'none'; }
    out.foot = document.querySelector('#foot').className; out.verdict = (document.querySelector('.verdict') || {}).textContent; out.len = Q.length; out.retryAt = Q.findIndex((x, i) => i > 0 && x.id === id); out.saved = JSON.stringify(S.cards[id] || null) !== before; out.rendered = !!document.querySelector('#ex').children.length;
    return out;
  }, { id, type, how, extra });
  const word = await page.evaluate(() => Object.keys(S.cards).find(id => id[0] === 'w' && card(id).audio && tokens(card(id).ceb).length === 1 && card(id).ceb.length > 5));
  const ceb = await page.evaluate(id => firstAlt(card(id).ceb), word);
  for (const [type, tol] of [['type', 'Tama'], ['dict', 'Tama']]) {
    let x = await run(word, type, { typed: ceb }); R.ok(x.box === 'right' && /good/.test(x.foot), `${type} exact is green ${JSON.stringify(x)}`); R.ok(x.retryAt < 0, type + ' right answer does not come back');
    x = await run(word, type, { typed: 'zzzzzzzzzzzz' }); R.ok(x.box === 'wrong' && /bad/.test(x.foot), `${type} wrong is red`); R.ok(x.retryAt === 4, `${type} miss comes back after 3 questions, at ${x.retryAt}`);
    x = await run(word, type, 'idk'); R.ok(/bad/.test(x.foot) && x.retryAt === 4, `${type} I don't know counts as a miss and returns`);
    x = await run(word, type, { typed: ceb.slice(0, -1) + (ceb.endsWith('q') ? 'x' : 'q') }); R.ok(x.box === 'right', `${type} one-letter typo in a long word is accepted`);
  }
  // minimal pairs: a different little word is a real mistake, not a typo
  const pairs = await page.evaluate(() => { const mk = (ceb) => ({ id: 'w1', kind: 'w', ceb, en: 'x', audio: false }); const test = (ceb, typed, frac = 0.12) => { const inp = document.createElement('input'); inp.value = typed; let got; const r0 = result; const fake = { id: 'w1', type: 'type' }; document.body.appendChild(inp); try { sess = newSess('other'); sess.graded.add('w1'); document.querySelector('#foot') || 0; typedCheck(mk(ceb), fake, inp, frac, false); got = inp.classList.contains('right'); } finally { inp.remove(); } return got; }; return { kokA: test('Moadto ko', 'Moadto ka'), koka: test('ko', 'ka'), nani: test('na', 'ni'), ako: test('ako', 'ato'), naawala: test('naa', 'nah'), tense: test('Mokaon ko sa balay', 'Nikaon ko sa balay'), sakasi: test('Asa ka moadto', 'Asa ko moadto'), typoLong: test('Moadto ko sa merkado', 'Moadto ko sa merkadoo'), ug: test('Kaon ug isda', 'Kaon og isda'), okTypo: test('Salamat kaayo', 'Salamat kaayu'), noPunct: test('Kumusta ka?', 'kumusta ka') }; });
  R.ok(!pairs.kokA, 'Moadto ka must not pass for Moadto ko'); R.ok(!pairs.koka, 'ka must not pass for ko'); R.ok(!pairs.nani, 'ni must not pass for na'); R.ok(!pairs.ako, 'ato must not pass for ako'); R.ok(!pairs.sakasi, 'Asa ko must not pass for Asa ka');
  R.ok(pairs.typoLong, 'a typo in a long word still passes'); R.ok(pairs.ug, 'ug/og both count'); R.ok(pairs.okTypo, 'kaayu for kaayo is a typo'); R.ok(pairs.noPunct, 'capitals and punctuation ignored');
  // choices: mc, listen, build, tiles, teach, speak, rule types and mix questions all render and grade from a real click
  const choice = (id, type, pickRight, extra) => page.evaluate(async ({ id, type, pickRight, extra }) => {
    Q = [Object.assign({ id, type }, extra || {}), { id: 'g0', type: 'teach' }, { id: 'g1', type: 'teach' }, { id: 'g2', type: 'teach' }, { id: 'g3', type: 'teach' }, { id: 'g4', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session();
    const c = card(id), opts = [...document.querySelectorAll('#ex .opt')], out = { n: opts.length, texts: opts.map(o => o.textContent) };
    if (!opts.length) return Object.assign(out, { html: document.querySelector('#ex').textContent.slice(0, 80) });
    const orig = HTMLElement.prototype.click; out.picked = null;
    // find the right button by trying its Check handler in a scratch copy is not possible, so read what the Check marks: click first, peek, redo
    opts[0].click(); document.querySelector('#chk').click(); const rightIdx = opts.findIndex(o => o.classList.contains('right')); out.rights = opts.filter(o => o.classList.contains('right')).length; out.firstOk = /good/.test(document.querySelector('#foot').className); out.matches = out.firstOk === (rightIdx === 0); out.after = opts.every(o => o.disabled || (o.classList.contains('done') && !o.onclick));   // after answering, choices are locked (Bisaya ones stay tappable for word pages)
    return out;
  }, { id, type, pickRight, extra });
  for (const t of ['mc', 'listen']) { for (let i = 0; i < 12; i++) { const x = await choice(word, t); R.ok(x.n >= 3 && x.rights === 1 && x.matches && x.after, `${t} has one right choice and grades it ${JSON.stringify(x)}`); } }
  // tiles and build, by clicking tiles
  const tiles = (id, type, right) => page.evaluate(({ id, type, right }) => { Q = [{ id, type }, { id: 'g0', type: 'teach' }, { id: 'g1', type: 'teach' }, { id: 'g2', type: 'teach' }, { id: 'g3', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); const label = document.querySelector('#ex .prompt'); const c = card(id); const toks = tokens(c.ceb).map(t => t.replace(/[.,!?…]/g, '')); const bank = () => [...document.querySelectorAll('#bank .tile:not(.used)')];
    if (right) toks.forEach(t => { const b = bank().find(x => x.textContent === t); if (b) b.click(); }); else { const b = bank()[0]; b.click(); }
    const chk = document.querySelector('#chk'); chk.click(); return { foot: document.querySelector('#foot').className, retry: Q.findIndex((x, i) => i > 0 && x.id === id), bankDup: new Set([...document.querySelectorAll('#bank .tile')].map(t => t.dataset.k)).size }; }, { id, type, right });
  const phrase = await page.evaluate(() => Object.keys(S.cards).find(id => id[0] === 'p' && card(id).audio && tokens(card(id).ceb).length >= 3));
  let t = await tiles(phrase, 'tiles', true); R.ok(/good/.test(t.foot), 'tiles right ' + JSON.stringify(t)); t = await tiles(phrase, 'tiles', false); R.ok(/bad/.test(t.foot) && t.retry === 4, 'tiles wrong returns');
  const dl = await page.evaluate(() => Object.keys(S.cards).find(id => id[0] === 'd' && tokens(card(id).ceb).length >= 3));
  t = await tiles(dl, 'build', true); R.ok(/good/.test(t.foot), 'build right ' + JSON.stringify(t)); t = await tiles(dl, 'build', false); R.ok(/bad/.test(t.foot), 'build wrong');
  // teach
  const tc = await page.evaluate(() => { const id = PATH[3].ids.find(i => i[0] === 'w' && card(i) && !S.cards[i]); Q = [{ id, type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); return { made: !!S.cards[id], fresh: S.cards[id].fresh, btn: document.querySelector('#cont').textContent, ceb: document.querySelector('.ceb').textContent === card(id).ceb, foot: document.querySelector('#foot').className }; });
  R.ok(tc.made && tc.fresh && tc.ceb && /Got it/.test(tc.btn), 'teach ' + JSON.stringify(tc));
  // speak: self grade buttons
  const sp = await page.evaluate(() => { const out = []; const id = Object.keys(S.cards).find(i => i[0] === 'w'); for (const q of [2, 1, 0]) { Q = [{ id, type: 'speak' }, { id: 'g0', type: 'teach' }, { id: 'g1', type: 'teach' }, { id: 'g2', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); document.querySelector('#show').click(); document.querySelector(`[data-q="${q}"]`).click(); out.push(document.querySelector('#foot').className); } clearInterval(timerH); return out; });
  R.ok(/good/.test(sp[0]) && /good/.test(sp[1]) && /bad/.test(sp[2]), 'speak grades ' + sp);
  // rules: rq, rid, rfix
  for (const ty of ['rq', 'rid', 'rfix']) for (let i = 0; i < 10; i++) { const x = await choice('r' + (i % 6), ty); R.ok(!x.n || (x.n >= 2 && x.rights === 1 && x.matches), `${ty} ${JSON.stringify(x)}`); }
  // mix questions: every box, many times: exactly one right, no repeats
  const mix = await page.evaluate(() => { const out = { bad: [], n: 0 }; const id = Object.keys(S.cards).find(i => i[0] === 'w'); MIXUPS.forEach((m, mx) => { for (let k = 0; k < 12; k++) { const q = mixQuestion(m, 0); out.n++; const key = q.kind === 'fill' ? q.ans : q.right, rights = q.opts.filter(o => norm(o) === norm(key)); if (rights.length !== 1) out.bad.push([mx, 'dup right', q.right, q.opts]); if (new Set(q.opts.map(norm)).size !== q.opts.length) out.bad.push([mx, 'dup opts', q.opts]); if (q.opts.length < 2) out.bad.push([mx, 'too few', q.opts]); if ((q.also || []).filter(a => norm(a) !== norm(q.right)).some(a => q.opts.map(norm).includes(norm(a)))) out.bad.push([mx, 'second right', q.opts, q.also]); if (!q.right) out.bad.push([mx, 'no right']); } }); return out; });
  console.log('  mix questions', mix.n); R.ok(!mix.bad.length, 'mix questions: ' + JSON.stringify(mix.bad.slice(0, 5)));
  const mq = await page.evaluate(() => { const id = Object.keys(S.cards).find(i => i[0] === 'w'), out = []; MIXUPS.slice(0, 20).forEach((m, mx) => { Q = [{ id, type: 'mixq', mx, q: Object.assign(mixQuestion(m, 0), { mode: 'type' }) }, { id: 'g0', type: 'teach' }, { id: 'g1', type: 'teach' }, { id: 'g2', type: 'teach' }, { id: 'g3', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); const i = document.querySelector('#ans'); i.value = Q[0].q.kind === 'fill' ? Q[0].q.ans : Q[0].q.right; i.dispatchEvent(new Event('input')); document.querySelector('#chk').click(); if (!i.classList.contains('right') || !/good/.test(document.querySelector('#foot').className)) out.push(mx); }); return out; });
  R.ok(!mq.length, 'mix question typed right is wrong: ' + mq);
  // after answering, Bisaya words on screen open their word page (tiles, choices, the blank, the answer)
  const tap = await page.evaluate(() => { const id = Object.keys(S.cards).find(i => i[0] === 'w'), m = MIXUPS.findIndex(x => x.fill); const out = {};
    Q = [{ id, type: 'mixq', mx: m, q: Object.assign(mixQuestion(MIXUPS[m], 0), { kind: 'fill', sent: MIXUPS[m].fill[0][0], ans: MIXUPS[m].fill[0][1], right: MIXUPS[m].fill[0][0].replace('___', MIXUPS[m].fill[0][1]), en: MIXUPS[m].fill[0][3], wopts: MIXUPS[m].fill[0][2], opts: MIXUPS[m].fill[0][2], mode: 'pick' }) }, { id: 'g0', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session();
    out.before = document.querySelectorAll('.tw').length; document.querySelector('#ex .opt').click(); document.querySelector('#chk').click();
    out.after = document.querySelectorAll('.tw').length; out.blank = (document.querySelector('.fillq .blank') || {}).textContent; document.querySelector('#foot .tw').click(); out.sheet = !!document.querySelector('#wsheet'); const w = document.querySelector('#wsheet'); if (w) w.remove(); return out; });
  R.ok(tap.before === 0 && tap.after > 2 && tap.sheet && tap.blank && tap.blank !== '?', 'words become tappable after answering ' + JSON.stringify(tap));
  // a miss returns at most 3 times, then is left for tomorrow; only the first answer moves the schedule
  const rt = await page.evaluate(() => { const id = Object.keys(S.cards).find(i => i[0] === 'w' && card(i).audio), c0 = JSON.stringify(S.cards[id]); Q = [{ id, type: 'mc' }, ...Array.from({ length: 30 }, (_, i) => ({ id: 'g' + i, type: 'teach' }))]; qi = 0; sess = newSess('daily'); let back = 0, seen = []; view = 'session'; VIEWS.session(); const c = card(id); for (let k = 0; k < 8; k++) { if (qi >= Q.length) break; const item = Q[qi]; if (item.id === id) { seen.push(qi); const before = JSON.stringify(S.cards[id]); result(c, item, false); if (k > 0 && JSON.stringify(S.cards[id]) !== before) back = -99; const nx = Q.findIndex((x, i) => i > qi && x.id === id); if (nx < 0) break; qi = nx; } } return { seen, back, last: document.querySelector('#foot').textContent.includes('tomorrow') }; });
  R.ok(rt.seen.length === 4, 'a miss is asked 1 + 3 more times, was ' + rt.seen); R.ok(rt.seen.every((p, i) => !i || p - rt.seen[i - 1] === 4), 'each comes after 3 others ' + rt.seen); R.ok(rt.back === 0, 'retries do not move the schedule'); R.ok(rt.last, 'then it says tomorrow');
  // distractors across many cards: never two right answers or same-meaning choices
  const dd = await page.evaluate(() => { const out = { n: 0, self: [], mutual: [], enDup: [] }; const ids = shuffle(Object.keys(S.cards).filter(i => i[0] !== 'r')).slice(0, 300); ids.forEach(id => { const c = card(id); for (const f of ['ceb', 'en']) { const d = distract(c, 3, f); out.n++; if (d.some(x => x.id !== c.id && x.en && sameMeaning(c.en, x.en))) out.self.push([id, f]); if (f === 'en') { for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) if (sameMeaning(d[i].en, d[j].en)) out.mutual.push([id, d[i].en, d[j].en]); } if (f === 'ceb') { const also = [c.ceb, ...(c.also || [])].flatMap(alts); if (d.some(x => alts(x.ceb).some(a => also.includes(a)))) out.enDup.push([id, c.ceb, d.map(x => x.ceb)]); } } }); return out; });
  console.log('  choice sets', dd.n); R.ok(!dd.self.length, 'choice means the same as the answer ' + JSON.stringify(dd.self.slice(0, 4))); R.ok(!dd.mutual.length, `two wrong choices mean the same (${dd.mutual.length}): ` + JSON.stringify(dd.mutual.slice(0, 5))); R.ok(!dd.enDup.length, `a Bisaya choice is also a right answer (${dd.enDup.length}): ` + JSON.stringify(dd.enDup.slice(0, 5)));
  // a card reviewed after being taught in an abandoned session stops being "fresh"
  const fr = await page.evaluate(() => { const t = today(), id = 'w900'; S.cards[id] = { b: 0, d: t, r: 0, w: 0, fresh: 1 }; sess = newSess('daily'); Q = [{ id, type: 'mc' }]; qi = 0; view = 'session'; VIEWS.session(); result(card(id), Q[0], true); return !!S.cards[id].fresh; });
  R.ok(!fr, 'a graded card keeps the "fresh" mark');
  // placement: a last round of 4 questions can be passed, and a double tap counts once
  const pl = await page.evaluate(async () => { const keep = S.cards; S.cards = {}; initPlacement(); PL.qs = PL.ids.slice(0, 4); PL.need = 4; PL.qi = 0; PL.right = 0; PL.range = [0, 30]; view = 'place'; S.placed = today(); VIEWS.place(); const c0 = PL.qs[0]; const btn = [...document.querySelectorAll('.opt')]; btn[0].click(); btn[0].click(); document.querySelector('#pldk').click(); const once = PL.right <= 1 && [1, 4].includes(PL.qi); for (let i = 1; i < 4; i++) { PL.right++; PL.qi++; } PL.right = 4; VIEWS.place(); const passed = PL.marked > 0; S.cards = keep; view = 'home'; return { once, passed }; });
  R.ok(pl.once, 'placement double tap counted ' + pl.once); R.ok(pl.passed, 'placement short round passes');
  // going back to a rule screen doesn't use up the day's rules
  const rr = await page.evaluate(() => { S.rules = {}; S.ruleDay = 0; S.ruleCnt = 0; const id = 'r0'; delete S.cards[id]; Q = [{ id, type: 'rteach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); VIEWS.session(); VIEWS.session(); return rulesToday(); });
  R.ok(rr === 1, 'reopening a rule screen counts as ' + rr + ' rules');
  await page.evaluate(() => { clearInterval(timerH); view = 'home'; }); R.ok(!log.pageErrors.length, 'page errors ' + log.pageErrors); R.ok(!log.console.length, 'console errors ' + log.console.slice(0, 3));
  await close(); await browser.close(); base.close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
