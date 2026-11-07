'use strict';
/* The newer kinds of questions (questions.js): reply, replysay, hear2, cloze, pic, Tell me about you, Retell it faster, Record and compare.
   Right and wrong answers, what a miss comes back as, which clip plays, and side effects (XP, accuracy, microphone). */
const { open, ready, Report } = require('./lib');
(async () => {
  const R = new Report('newq'); const { page, log, close } = await open(); await ready(page);
  await page.evaluate(() => { const t = today(); PATH.flatMap(s => s.ids).slice(0, 900).forEach(id => { if (card(id) && id[0] !== 'r') S.cards[id] = { b: 3, d: t + 10, r: 4, w: 0 }; }); localSave(); });
  // find a card for each kind
  const ids = await page.evaluate(() => { const k = Object.keys(S.cards), f = fn => k.find(id => { try { return fn(id); } catch (e) { return false; } });
    return { reply: f(id => id[0] === 'd' && REPLY_OF[id] && replyChoices(card(id)).length >= 2), hear2: f(id => pairFor(card(id))), hear2a: f(id => card(id).audio && pairFor(card(id))), cloze: f(id => clozeFor(card(id))), pic: f(id => picFile(card(id)) && distract(card(id), 3, 'ceb').length >= 2) }; });
  console.log('  cards', JSON.stringify(ids));
  const run = (id, type, pickRight) => page.evaluate(async ({ id, type, pickRight }) => {
    Q = [{ id, type }, ...Array.from({ length: 8 }, (_, i) => ({ id: 'g' + i, type: 'teach' }))]; qi = 0; sess = newSess('daily'); view = 'session'; __plays.length = 0; VIEWS.session(); await new Promise(r => setTimeout(r, 20));
    const out = { plays: __plays.map(p => p.src) }; const opts = [...document.querySelectorAll('#ex .opt')]; out.n = opts.length; out.texts = opts.map(o => o.textContent);
    const inp = document.querySelector('#ans');
    if (opts.length) { // find the right one by trying it on a copy is impossible: click, check, read the marks
      opts[0].click(); document.querySelector('#chk').click(); out.rights = opts.filter(o => o.classList.contains('right')).length; out.firstOk = /good/.test(document.querySelector('#foot').className); out.agree = out.firstOk === opts[0].classList.contains('right');
    } else if (inp) { const q = type === 'cloze' ? clozeFor(card(id)).ans : firstAlt(card(id).ceb); inp.value = pickRight ? q : 'zzzz'; inp.dispatchEvent(new Event('input')); document.querySelector('#chk').click(); out.box = inp.classList.contains('right') ? 'right' : 'wrong'; out.ok = /good/.test(document.querySelector('#foot').className); }
    else if (document.querySelector('#show')) { document.querySelector('#show').click(); document.querySelector('[data-q="0"]').click(); out.ok = false; }
    out.label = (document.querySelector('#ex .label') || {}).textContent;
    // the retry, if any: it must render as a real question for this card
    const ri = Q.findIndex((x, i) => i > 0 && x.id === id); out.retryType = ri > 0 ? Q[ri].type : null;
    if (ri > 0) { qi = ri; let err = null; try { VIEWS.session(); } catch (e) { err = e.message; } out.retryErr = err; out.retryView = view; out.retryLabel = (document.querySelector('#ex .label') || {}).textContent; out.retryRendered = !!document.querySelector('#ex .opts .opt, #ex #ans, #bank .tile'); }
    clearInterval(timerH); stopAudio(); return out; }, { id, type, pickRight });
  for (const type of ['reply', 'replysay', 'hear2', 'cloze', 'pic']) {
    const id = type === 'replysay' ? ids.reply : ids[type]; if (!id) { R.ok(false, 'no card found for ' + type); continue; }
    for (let k = 0; k < 8; k++) {
      const x = await run(id, type, k % 2 === 0);
      if (x.n) R.ok(x.rights === 1 && x.agree, `${type} ${id}: one right choice, graded as marked ${JSON.stringify(x.texts)}`);
      if (x.retryType) R.ok(!x.retryErr && x.retryView === 'session' && x.retryRendered, `${type} ${id}: a miss comes back as "${x.retryType}" and ${x.retryErr ? 'crashes: ' + x.retryErr : x.retryView !== 'session' ? 'drops you on ' + x.retryView : 'shows ' + x.retryLabel}`);
      if (type === 'cloze' && k % 2 === 0) R.ok(x.box === 'right' && x.ok, 'cloze right answer is green ' + JSON.stringify(x));
      if (type === 'cloze' && k % 2 === 1) R.ok(x.box === 'wrong' && !x.ok, 'cloze wrong is red');
    }
  }
  // Hear the difference: the clip played must be the computer voice for whichever line is the answer, and replay must play the same thing
  const h = await page.evaluate(async ids => { const out = []; for (const id of [ids.hear2, ids.hear2a].filter(Boolean)) for (let k = 0; k < 10; k++) {
      Q = [{ id, type: 'hear2' }, { id: 'g0', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; __plays.length = 0; VIEWS.session(); await new Promise(r => setTimeout(r, 40));
      const auto = __plays.map(p => p.src); __plays.length = 0; document.querySelector('#pl').click(); await new Promise(r => setTimeout(r, 40)); const replay = __plays.map(p => p.src);
      // which option is right
      const opts = [...document.querySelectorAll('#ex .opt')]; opts[0].click(); document.querySelector('#chk').click(); const right = opts.find(o => o.classList.contains('right')).textContent;
      out.push({ id, auto: auto[0], replay: replay[0], want: vurls[vkey(right)] || (voiceUrl ? voiceUrl(right) : null), native: clipUrl(id), same: auto[0] === replay[0] }); stopAudio(); }
    return out; }, ids);
  const hb = h.filter(x => !x.same); R.ok(!hb.length, `Hear the difference: replay plays a different clip than the first play in ${hb.length}/${h.length} tries (the native recording gives the answer away)`);
  // Tell me about you: "Show me an example" isn't a wrong answer, and doesn't move accuracy
  const ab = await page.evaluate(() => { const t = today(); S.acc = {}; AB = null; view = 'aboutme'; render(); document.querySelector('#idk').click(); const after = JSON.stringify(S.acc[t] || null); document.querySelector('#cont').click(); return after; });
  R.ok(ab === 'null' || ab === JSON.stringify({ r: 0, t: 0 }), 'Tell me about you: "Show me an example" is counted as a wrong answer in accuracy ' + ab);
  // Retell it faster: finishing gives XP once, not every time the screen redraws
  const rt = await page.evaluate(() => { const t = today(); RT = null; view = 'retell'; render(); const b = document.querySelector('[data-rt]'); if (!b) return 'none'; b.click(); for (let i = 0; i < 3; i++) { document.querySelector('#go').click(); document.querySelector('#early').click(); } const x0 = S.xp[t] || 0; render(); render(); render(); const x1 = S.xp[t] || 0; clearInterval(timerH); RT = null; view = 'home'; return x1 - x0; });
  R.ok(rt === 0, 'Retell it faster: XP added again on every redraw of the end screen (+' + rt + ' for 3 redraws)');
  // the new Practice screens open from Practice and close cleanly, with sound stopped
  for (const v of ['aboutme', 'retell']) { const r = await page.evaluate(async v => { view = v; render(); await new Promise(r => setTimeout(r, 30)); document.querySelector('#quit').click(); return { view, paused: player.paused }; }, v); R.ok(r.view === 'practice', v + ' closes to Practice ' + JSON.stringify(r)); }
  // Record and compare: moving on stops the microphone and your own playback
  const rec = await page.evaluate(async () => { const tracks = []; let mine = 0, minePaused = 0;
    navigator.mediaDevices = navigator.mediaDevices || {}; navigator.mediaDevices.getUserMedia = async () => ({ getTracks: () => [{ stop() { tracks.push('stopped'); } }] });
    window.MediaRecorder = class { constructor() { this.state = 'inactive'; this.mimeType = 'audio/webm'; } start() { this.state = 'recording'; } stop() { this.state = 'inactive'; this.ondataavailable && this.ondataavailable({ data: new Blob(['x']) }); this.onstop && this.onstop(); } };
    const id = Object.keys(S.cards).find(i => i[0] === 'w' && card(i).audio); Q = [{ id, type: 'speak' }, { id: 'g0', type: 'teach' }, { id: 'g1', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); document.querySelector('#show').click();
    document.querySelector('#recgo').click(); await new Promise(r => setTimeout(r, 20)); const recording = REC && REC.state === 'recording';
    document.querySelector('[data-q="2"]').click(); document.querySelector('#cont').click(); await new Promise(r => setTimeout(r, 20)); clearInterval(timerH);
    return { recording, stillRecording: REC && REC.state === 'recording', micStopped: tracks.length > 0 }; });
  R.ok(rec.recording, 'recorder starts'); R.ok(!rec.stillRecording && rec.micStopped, 'Record and compare: the microphone keeps recording after you move on ' + JSON.stringify(rec));
  // a simulated week with the new kinds mixed in: nothing crashes, nothing falls back to Today
  const sim = await page.evaluate(async () => { const bad = [], seen = {}; for (let d = 0; d < 10; d++) { window.__jump(1); startSession(); let g = 0; while (view === 'session' && qi < Q.length && g++ < 300) { const it = Q[qi]; seen[it.type] = (seen[it.type] || 0) + 1; const c = card(it.id); if (document.querySelector('#cont') && ['teach', 'rteach', 'shadow'].includes(it.type)) { document.querySelector('#cont').click(); continue; } const opts = [...document.querySelectorAll('#ex .opt')]; if (opts.length && document.querySelector('#chk')) { opts[Math.floor(Math.random() * opts.length)].click(); document.querySelector('#chk').click(); } else if (document.querySelector('#ans')) { const i = document.querySelector('#ans'); i.value = Math.random() < 0.5 ? 'zzz' : firstAlt(c.ceb); i.dispatchEvent(new Event('input')); document.querySelector('#chk').click(); } else if (document.querySelector('#show')) { document.querySelector('#show').click(); document.querySelector('[data-q="1"]').click(); } else if (document.querySelector('#bank .tile')) { document.querySelector('#bank .tile').click(); document.querySelector('#chk').click(); } else { bad.push(['no way to answer', it.type, it.id]); break; } const qBefore = qi; if (document.querySelector('#cont')) document.querySelector('#cont').click(); if (view !== 'session' && qBefore < Q.length - 1) bad.push(['session ended early', it.type, it.id, qBefore, Q.length]); await 0; } clearInterval(timerH); stopAudio(); view = 'home'; } return { bad, seen }; });
  console.log('  types seen', JSON.stringify(sim.seen)); R.ok(!sim.bad.length, 'session with the new kinds: ' + JSON.stringify(sim.bad.slice(0, 4)));
  R.ok(!log.pageErrors.length, 'page errors ' + JSON.stringify(log.pageErrors.slice(0, 3))); R.ok(!log.console.length, 'console errors ' + JSON.stringify(log.console.slice(0, 3)));
  await close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
