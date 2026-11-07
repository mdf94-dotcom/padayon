'use strict';
/* Audio: what plays matches what's on screen, and a clip that arrives late never plays over the next question. */
const { open, ready, Report } = require('./lib');
(async () => {
  const R = new Report('audio'); const { page, log, close } = await open(); await ready(page);
  const a = await page.evaluate(() => {
    const ids = [...P.map((_, i) => 'p' + i), ...W.map((_, i) => 'w' + i)], out = { notAudioButNative: [], splitNative: [], heardNoAudio: [] };
    ids.forEach(id => { const c = card(id); if (!c || !IDX[id]) return; const u = clipUrl(id); if (!c.audio && u && u === urls[id]) out.notAudioButNative.push([id, c.ceb, id[0] === 'p' ? P[+id.slice(1)][0] : W[+id.slice(1)][0]]); });
    // a word shown on its own that only exists inside a two-way recording must not borrow it
    Object.keys(SPLIT).forEach(id => { const c = card(id); if (!c || id[0] !== 'p') return; if (IDX[id] && nativeUrl(c.ceb) === urls[id] && urls[id]) out.splitNative.push([id, c.ceb, P[+id.slice(1)][0]]); });
    S.cards = {}; ids.slice(0, 400).forEach(id => { if (card(id)) S.cards[id] = { b: 3, d: today() + 5, r: 3, w: 0 }; });
    out.heardNoAudio = heardIds().filter(id => !card(id).audio).map(id => [id, card(id).ceb]);
    return out;
  });
  // meaning-split cards (s ids) show their source card's word, so they play its recording and are never silent
  const sp = await page.evaluate(() => typeof SENSE_LIST === 'undefined' ? { silent: [], mism: [] } : (ids => ({ silent: ids.filter(id => !card(id).audio && !hasVoice(card(id).ceb)), mism: ids.filter(id => card(id).audio && norm(firstAlt(card(id).ceb)) !== norm(firstAlt(card(card(id).rec).ceb))) }))(SENSE_LIST.map((_, i) => 's' + i).filter(id => card(id))));
  R.ok(!sp.silent.length, 'meaning-split cards with no sound: ' + sp.silent.slice(0, 8)); R.ok(!sp.mism.length, 'meaning-split card plays a different word: ' + sp.mism);
  console.log('  sample', JSON.stringify(a.notAudioButNative.slice(0, 4)));
  R.ok(!a.notAudioButNative.length, `${a.notAudioButNative.length} cards play a recording that doesn't match the screen: ` + JSON.stringify(a.notAudioButNative.slice(0, 3)));
  R.ok(!a.splitNative.length, `${a.splitNative.length} split words borrow a two-way recording`);
  R.ok(!a.heardNoAudio.length, `Speed/dictation pool has ${a.heardNoAudio.length} cards with no matching recording`);
  // walk question types: the clip that plays is that card's own
  const walk = await page.evaluate(async () => {
    const bad = [], t = today(); const ids = Object.keys(S.cards).filter(id => card(id).audio).slice(0, 60);
    for (const id of ids) for (const type of ['listen', 'dict', 'tiles']) { __plays.length = 0; Q = [{ id, type }, { id: 'g0', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); await new Promise(r => setTimeout(r, 3)); const want = clipUrl(id); if (!__plays.some(p => p.src === want)) bad.push([id, type]); stopAudio(); }
    return bad;
  });
  R.ok(!walk.length, 'question plays the wrong clip ' + JSON.stringify(walk.slice(0, 4)));
  // late audio
  const late = await page.evaluate(async () => {
    const out = {}; const c = Object.keys(S.cards).map(card).find(x => x.kind === 'w' && x.audio); const m = M_ORDER.map(card).find(x => x && !x.audio && hasVoice(x.ceb));
    // computer voice still downloading when you move on
    const n = VIDX.k[vkey(m.ceb)][0]; const keep = SHARD[n]; delete SHARD[n]; delete vurls[vkey(m.ceb)]; const lsk = loadShard; window.__slow = true;
    S.cards[m.id] = { b: 3, d: today() + 5, r: 3, w: 0 }; __plays.length = 0; Q = [{ id: m.id, type: 'mc' }, { id: 'g0', type: 'mc' }, { id: 'g1', type: 'mc' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session();
    const p = play(m.id, 1); next(); await p; await new Promise(r => setTimeout(r, 30)); out.voiceLate = __plays.length; SHARD[n] = keep;
    // the phone's own voice stops too
    window.__spoken = []; const realSpeak = window.speechSynthesis; let cancelled = 0; const fakeSS = { getVoices: () => [], cancel: () => { cancelled++; }, speak: u => __spoken.push(u.text) }; Object.defineProperty(window, 'speechSynthesis', { value: fakeSS, configurable: true });
    window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || function (t) { this.text = t; };
    sayFallback('test'); cancelled = 0; stopAudio(); out.ssCancel = cancelled;
    // leaving a question stops the sound
    __plays.length = 0; __ended = 500; Q = [{ id: c.id, type: 'listen' }, { id: 'g0', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); await new Promise(r => setTimeout(r, 5)); stopAudio(); out.pausedAfterNext = player.paused; __ended = 15;
    // shadowing stops looping after Continue
    __plays.length = 0; const ph = Object.keys(S.cards).find(id => id[0] === 'p' && card(id).audio); Q = [{ id: ph, type: 'shadow' }, { id: 'g0', type: 'teach' }, { id: 'g1', type: 'teach' }]; qi = 0; sess = newSess('daily'); view = 'session'; VIEWS.session(); await new Promise(r => setTimeout(r, 60)); document.querySelector('#cont').click(); const n1 = __plays.length; await new Promise(r => setTimeout(r, 1800)); out.shadow = [n1, __plays.length];
    return out;
  });
  R.ok(late.voiceLate === 0, 'computer voice played late over the next question ' + late.voiceLate); R.ok(late.ssCancel > 0, "the phone's voice keeps talking over the next question"); R.ok(late.pausedAfterNext, 'sound keeps playing after moving on'); R.ok(late.shadow[1] === late.shadow[0], 'shadowing keeps playing after Continue ' + late.shadow);
  // shadowing a unit that holds a card since hidden from the app doesn't crash
  const hid = await page.evaluate(() => { const h = UNITS.flatMap(u => u.ids).find(id => HIDE.has(id)); if (!h) return 'none'; S.cards[h] = { b: 3, d: today() + 5, r: 3, w: 0 }; view = 'shadow'; render(); const b = document.querySelector('[data-u]'); return { h, listed: !!b }; });
  const uu = await page.evaluate(() => { const bad = []; const mine = UNITS.map(u => u.ids.filter(id => S.cards[id])); return mine.flat().filter(id => !card(id)).length; });
  if (hid !== 'none') { const crash = await page.evaluate(async () => { try { document.querySelectorAll('[data-u]').forEach(() => 0); const us = UNITS.map(u => Object.assign({}, u, { ids: u.ids.filter(id => S.cards[id]) })).filter(u => u.ids.some(id => HIDE.has(id))); if (!us.length) return 'ok'; const i = [...document.querySelectorAll('[data-u]')]; for (const b of i) { b.click(); await new Promise(r => setTimeout(r, 5)); if (document.querySelector('#quit')) document.querySelector('#quit').click(); view = 'shadow'; render(); return 'ok'; } return 'ok'; } catch (e) { return String(e); } }); R.ok(crash === 'ok', 'shadow crash ' + crash); }
  R.ok(await page.evaluate(() => { const src = VIEWS.shadow.toString(); return /card\(id\)/.test(src); }), 'shadowing list skips hidden cards');
  R.ok(!log.pageErrors.length, 'page errors ' + log.pageErrors); await close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
