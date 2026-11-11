'use strict';
/* ---------- more kinds of questions ----------
   1. What do you say back?   a line from a conversation is said to you; pick (later: say) the reply
   2. Hear the difference     one clip, two look-alike sentences (ko/ka, mo-/ni-): which did you hear?
   3. Fill the gap            a real sentence with the word missing; type it, no choices
   4. Tell me about you       questions about your own life, answered in Bisaya (Practice)
   5. Record and compare      record yourself, then play it next to the real one (on Say it and Shadowing)
   6. Retell it faster        4-3-2: retell a story in 60, then 45, then 30 seconds (Practice)
   7. Picture                 a picture, no English: which Bisaya word is it? */

/* 1. replies: every conversation line that answers the line before it (a different speaker) */
const REPLY_OF = {};
DIALOGS.forEach((d, i) => d.lines.forEach((l, j) => { if (j > 0 && d.lines[j - 1][0] !== l[0]) REPLY_OF['d' + i + '_' + j] = { said: d.lines[j - 1], who: d.lines[j - 1][0] === 'a' ? d.a : d.b || 'They' }; }));
function replyChoices(c) {
  const mine = norm(c.ceb), seen = new Set([mine]), out = [];
  const pool = shuffle(Object.keys(REPLY_OF).filter(id => id !== c.id && card(id))).map(card);
  // replies you've already learned first, then any other replies from the conversations
  pool.sort((a, b) => (S.cards[b.id] ? 1 : 0) - (S.cards[a.id] ? 1 : 0));
  for (const d of pool) { const k = norm(d.ceb); if (seen.has(k) || sameMeaning(c.en, d.en)) continue; seen.add(k); out.push(d.ceb); if (out.length >= 3) break; }
  return out;
}

/* 2. hear the difference: the card and one look-alike (one small change), when both have a voice clip */
function pairFor(c) {
  if (!c || c.kind === 'r' || tokens(c.ceb).length > 6) return null;
  if (!c.audio && !hasVoice(c.ceb)) return null;
  const v = swapVariants(c).sort().find(x => hasVoice(x)); return v || null;
}

/* 3. fill the gap: the card's word inside one of its example sentences */
function clozeFor(c) {
  if (!c || !['w', 'm', 'g', 'p'].includes(c.kind) || tokens(firstAlt(c.ceb)).length !== 1) return null;
  const ex = knownExample(c); if (!ex) return null;
  const w = lowTok(firstAlt(c.ceb)), toks = tokens(ex[0]);
  let i = toks.findIndex(t => lowTok(t) === w); if (i < 0) i = toks.findIndex(t => { const l = lowTok(t); return l.length > w.length && l.includes(w) && w.length >= 3; });
  if (i < 0 || toks.length < 3) return null;
  const tok = toks[i].replace(/[.,!?…]+$/, ''), punct = (toks[i].match(/[.,!?…]+$/) || [''])[0];
  return { sent: toks.map((t, j) => j === i ? '___' + punct : t).join(' '), ans: tok, en: ex[1], full: ex[0], form: lowTok(tok) !== w };
}

Object.assign(EX, {
  reply(c, item) {
    const r = REPLY_OF[c.id]; if (!r) return EX.build(c, item);
    const wrong = replyChoices(c); if (wrong.length < 2) return EX.build(c, item);
    $('#ex').innerHTML = `<div class="label">What do you say back?</div><div class="small muted">${esc(r.who)} says:</div>
      <div class="row" style="gap:10px;align-items:center"><div class="ceb">${esc(r.said[1])}</div><button class="play sm" id="pl" aria-label="Play">${I.play}</button></div>
      <div class="small muted">${esc(r.said[2])}</div><div class="prompt" style="font-size:1rem;margin-top:6px">Your reply:</div><div class="opts"></div>`;
    const opts = shuffle([c.ceb, ...wrong].map((t, i) => ({ id: i ? 'x' + i : 'ok', t, ceb: 1 })));
    ruleChoice(c, item, opts, 'ok', { ceb: r.said[1], en: r.said[2] }, `<b>${esc(c.ceb)}</b> · ${esc(c.en)}${c.note ? '<br>' + esc(c.note) : ''}`);
  },
  replysay(c, item) {   // once you know the reply: say it out loud, then compare
    const r = REPLY_OF[c.id]; if (!r) return EX.speak(c, item);
    EX.speak(Object.assign({}, c, { ask: `${r.who} says “${r.said[1]}” (${r.said[2]}). Say your reply: ${c.en}` }), item);
  },
  hear2(c, item) {
    const v = pairFor(c); if (!v) return EX.listen(c, item);
    const target = Math.random() < 0.5 ? c.ceb : v, isCard = target === c.ceb;
    $('#ex').innerHTML = `<div class="label">Hear the difference</div><div class="prompt">Which one did you hear?</div>
      <div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><span class="muted small">Listen closely: only one small part is different.</span></div><div class="opts"></div>`;
    const opts = shuffle([target, isCard ? v : c.ceb].map((t, i) => ({ id: i ? 'x' : 'ok', t, ceb: 1 })));
    const other = isCard ? v : c.ceb;
    ruleChoice(isCard ? c : Object.assign({}, c, { audio: false }), item, opts, 'ok', { ceb: target, en: isCard ? c.en : (glossOf(lowTok(diffWord(target, other))) || '') },
      `You heard <b>${esc(target)}</b>. The other one was <b>${esc(other)}</b>${isCard ? '' : ` (${esc(c.en)})`}. The difference: <b>${esc(diffWord(target, other))}</b> vs <b>${esc(diffWord(other, target))}</b>.`);
    // the card's own native recording when it's the card, the computer voice for the look-alike
    if (isCard && c.audio) { const b = $('#pl'); b.onclick = e => play(c.id, 1, e.currentTarget); }
  },
  cloze(c, item) {
    const q = clozeFor(c); if (!q) return EX.type(c, item);
    $('#ex').innerHTML = `<div class="label">Fill the gap</div><div class="ceb fillq">${esc(q.sent).replace('___', '<span class="blank" data-ans="' + esc(q.ans) + '">&nbsp;</span>')}</div>
      <div class="prompt" style="font-weight:500">${esc(q.en)}</div>${q.form ? `<p class="small muted" style="margin:0">Hint: a form of <b>${esc(firstAlt(c.ceb))}</b> (${esc(c.en)})</p>` : ''}
      <input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the missing word">`;
    foot(`<button class="btn primary block" id="chk" disabled>Check</button><button class="btn ghost block" id="idk">I don't know</button>`);
    const inp = $('#ans'); inp.focus(); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) $('#chk').click(); };
    const extra = `<b>${esc(q.full)}</b> · ${esc(q.en)}`;
    $('#chk').onclick = () => { const g = norm(inp.value), t = norm(q.ans), ok = g === t || (t.length >= 6 && lev(g, t) <= 1);
      inp.disabled = true; inp.classList.add(ok ? 'right' : 'wrong'); result(Object.assign({}, c, { ceb: q.full, en: q.en, audio: false }), item, ok, extra); };
    $('#idk').onclick = () => { inp.disabled = true; inp.classList.add('wrong'); result(Object.assign({}, c, { ceb: q.full, en: q.en, audio: false }), item, false, "That's okay. " + extra); };
  },
  pic(c, item) {
    const f = picFile(c); if (!f) return EX.mc(c, item);
    const known = S.cards[c.id] && S.cards[c.id].b >= 2, twins = picTwins(c);
    if (known && !twins.some(id => S.cards[id]) && Math.random() < 0.5) {   // know it well: type it
      $('#ex').innerHTML = `<div class="label">What's this in Bisaya?</div><div class="picq">${picImg(f, 'big')}</div><input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type in Bisaya">`;
      foot(`<button class="btn primary block" id="chk" disabled>Check</button><button class="btn ghost block" id="idk">I don't know</button>`);
      const inp = $('#ans'); inp.focus(); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
      inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) $('#chk').click(); };
      $('#chk').onclick = () => typedCheck(c, item, inp, 0.12, false); wireIdk(c, item, inp); return;
    }
    const tw = new Set(twins), twA = new Set(twins.map(id => lowTok(firstAlt(card(id).ceb)))), f0 = f; const d = distract(c, 8, 'ceb').filter(x => !tw.has(x.id) && picFile(x) !== f0 && !twA.has(lowTok(firstAlt(x.ceb)))).slice(0, 3); if (d.length < 2) return EX.mc(c, item);
    $('#ex').innerHTML = `<div class="label">What's this in Bisaya?</div><div class="picq">${picImg(f, 'big')}</div><div class="opts"></div>`;
    choiceEx(c, item, shuffle([c, ...d]), 'ceb', 'cebopt');
  }
});
// the meaning of the one word that differs between two look-alike sentences
function diffWord(a, b) { const x = tokens(a), y = tokens(b); const i = x.findIndex((t, j) => lowTok(t) !== lowTok(y[j] || '')); return i < 0 ? a : x[i].replace(/[.,!?…]+$/, ''); }

/* which new kinds a card can get, by how well you know it (exType in app.js mixes these in) */
// A picture question only when the picture can point to one answer: no "I / you / he" words
// (a picture of someone hungry can't tell gutom ko from gutom ka). Choices never share the picture; typing only when
// no card you've learned shares it.
const PIC_PRON = new Set('ko ako ka ikaw siya kami mi kita ta mo kamo sila nako akong ako imo nimo imong niya iyang namo amo among nato ato atong ninyo inyo inyong nila ila ilang ka? nimo'.split(' '));
const picOk = c => { const f = picFile(c); if (!f) return false; const toks = tokens(firstAlt(c.ceb)).map(lowTok); return toks.length <= 2 && !toks.some(t => PIC_PRON.has(t)); };
// other cards with the same picture but a different answer (they can't be told apart by the picture)
const picTwins = c => { const f = picFile(c), a = lowTok(firstAlt(c.ceb)); return Object.keys(PIC).filter(id => id !== c.id && PIC[id] === f && card(id) && lowTok(firstAlt(card(id).ceb)) !== a); };
function extraTypes(id, b) {
  const c = card(id); if (!c || c.kind === 'r') return [];
  const out = [];
  if (c.kind === 'd' && REPLY_OF[id]) out.push(b >= 2 ? 'replysay' : 'reply');
  if (b >= 1 && pairFor(c)) out.push('hear2');
  if (b >= 2 && clozeFor(c)) out.push('cloze');
  if (b >= 1 && picOk(c)) out.push('pic');
  return out;
}

/* 5. record and compare: your voice next to the real one */
const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
function recorderHtml() { return canRecord() ? `<div class="recrow"><button class="btn ghost sm" id="recgo">🎙️ Record yourself</button><button class="btn ghost sm" id="recme" hidden>▶ Play mine</button><button class="btn ghost sm" id="recref" hidden>▶ Play the real one</button><span class="small muted" id="recst"></span></div>` : ''; }
let REC = null, REC_MINE = null;
// moving on (next question, another screen) ends a recording and stops your own playback
function stopRecorder() { try { if (REC && REC.state === 'recording') REC.stop(); } catch (e) { } if (REC_MINE) { REC_MINE.pause(); REC_MINE = null; } }
function wireRecorder(text, c) {
  const go = $('#recgo'); if (!go) return;
  const st = $('#recst'), me = $('#recme'), ref = $('#recref'); let url = null;
  const real = btn => { if (c && c.audio) play(c.id, 1, btn); else playSentence(text, btn); };
  ref.onclick = e => real(e.currentTarget);
  me.onclick = () => { if (url) { if (REC_MINE) REC_MINE.pause(); const a = REC_MINE = new Audio(url); a.play().catch(() => { }); } };
  go.onclick = async () => {
    if (REC && REC.state === 'recording') { REC.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const chunks = [];
      REC = new MediaRecorder(stream); REC.ondataavailable = e => chunks.push(e.data);
      REC.onstop = () => { if (typeof Music !== 'undefined') Music.hold(false); stream.getTracks().forEach(t => t.stop()); if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(new Blob(chunks, { type: REC.mimeType || 'audio/webm' }));
        go.textContent = '🎙️ Record again'; me.hidden = false; ref.hidden = false; st.textContent = 'Now play yours, then the real one.'; };
      if (typeof Music !== 'undefined') Music.hold(true); REC.start(); go.textContent = '⏹ Stop'; st.textContent = 'Recording… say it now'; setTimeout(() => { if (REC && REC.state === 'recording') REC.stop(); }, 8000);
    } catch (e) { st.textContent = 'The microphone is off. Allow it in your browser to record.'; }
  };
}

/* 4. tell me about you: questions about your life, a model answer to compare with after */
const ABOUT = [
  ['Unsa imong ngalan?', "What's your name?", 'Ako si Ana.', "I'm Ana."],
  ['Asa ka nagpuyo?', 'Where do you live?', 'Nagpuyo ko sa Virginia.', 'I live in Virginia.'],
  ['Taga-asa ka?', 'Where are you from?', 'Taga-Maryland ko.', "I'm from Maryland."],
  ['Pila na imong edad?', 'How old are you now?', 'Baynte singko na ko.', "I'm 25 now."],
  ['Unsa imong trabaho?', 'What do you do for work?', 'Nagtrabaho ko sa ospital.', 'I work at a hospital.'],
  ['Pila imong igsoon?', 'How many siblings do you have?', 'Duha akong igsoon.', 'I have two siblings.'],
  ['Naa kay iro?', 'Do you have a dog?', 'Wala koy iro, pero ganahan ko og iro.', "I don't have a dog, but I like dogs."],
  ['Unsa imong paboritong pagkaon?', "What's your favorite food?", 'Ganahan kaayo ko og adobo.', 'I really like adobo.'],
  ['Unsa imong gibuhat ganiha?', 'What did you do earlier?', 'Nagtrabaho ko ganiha.', 'I worked earlier.'],
  ['Unsa imong buhaton ugma?', 'What will you do tomorrow?', 'Motan-aw ko og sine ugma.', "I'll watch a movie tomorrow."],
  ['Gutom ka?', 'Are you hungry?', 'Oo, gutom na ko.', "Yes, I'm hungry now."],
  ['Kapoy ka karon?', 'Are you tired right now?', 'Dili, okay ra ko.', "No, I'm okay."],
  ['Unsa imong ganahan buhaton?', 'What do you like to do?', 'Ganahan ko magluto.', 'I like to cook.'],
  ['Kinsa imong kauban sa balay?', 'Who do you live with?', 'Akong asawa.', 'My spouse.'],
  ['Kumusta imong adlaw?', 'How was your day?', 'Maayo man, salamat.', 'It was good, thanks.'],
  ['Asa ka gusto moadto?', 'Where do you want to go?', 'Gusto ko moadto sa Cebu.', 'I want to go to Cebu.']
];
let AB = null;
VIEWS.aboutme = function () {
  if (!AB) AB = { list: shuffle(ABOUT.map((_, i) => i)).slice(0, 5), i: 0, done: false };
  if (AB.i >= AB.list.length) { $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Tell me about you</h2></div><section class="panel">${binkoSays('Ayos! Five answers about your own life. Talking about yourself is the Bisaya you\'ll use most.')}<button class="btn primary block" id="again">Five more</button></section>`;
    $('#quit').onclick = () => { AB = null; go('practice'); }; $('#again').onclick = () => { AB = null; render(); }; return; }
  const q = ABOUT[AB.list[AB.i]];
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Tell me about you</h2><span class="muted small tnum">${AB.i + 1} of ${AB.list.length}</span></div>
    <div class="ex" id="ex"><div class="label">Answer in Bisaya, about your own life</div><div class="row" style="gap:10px;align-items:center"><div class="ceb">${esc(q[0])}</div><button class="play sm" id="pl" aria-label="Play">${I.play}</button></div>
      <div class="small muted">${esc(q[1])}</div><textarea class="field" id="ans" rows="2" autocapitalize="sentences" spellcheck="false" placeholder="Type your answer in Bisaya"></textarea><div id="rev"></div></div><div class="foot" id="foot"></div>`;
  $('#quit').onclick = () => { AB = null; go('practice'); };
  $('#pl').onclick = e => playSentence(q[0], e.currentTarget); playSentence(q[0], $('#pl'));
  foot(`<button class="btn primary block" id="chk" disabled>Done</button><button class="btn ghost block" id="idk">Show me an example</button>`);
  const inp = $('#ans'); inp.focus(); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
  const reveal = mine => {
    // Bisaya enough: most words (not counting names) are Bisaya words the app knows
    const ws = (mine || '').split(/\s+/).map((w, i) => ({ w: w.replace(/^[^\p{L}']+|[^\p{L}'-]+$/gu, ''), i })).filter(x => x.w && !(x.i > 0 && /^\p{Lu}/u.test(x.w)));
    const bis = ws.length > 0 && !ws.some(x => EN_WORDS.has(x.w.toLowerCase())) && ws.filter(x => glossOf(x.w.toLowerCase()) || cardForTok(x.w.toLowerCase())).length / ws.length >= 0.5;
    $('#rev').innerHTML = `<div class="panel note" style="margin-top:10px"><div class="label">One way to answer</div><div class="ceb" style="font-size:1.2rem">${esc(q[2])}</div><div class="small muted">${esc(q[3])}</div>
      ${mine ? `<div class="small" style="margin-top:6px">${bis ? '✅ That reads as Bisaya.' : '🤔 Most of that doesn\'t look like Bisaya words yet. Try using the example as a pattern.'} Change the details to fit your own life.</div>` : ''}</div>`;
    inp.disabled = true; if (mine) { logAnswer(!!bis); if (bis) addXP(4); }   // just looking at an example isn't a wrong answer
    foot(`<div class="small muted" style="text-align:center">Tap any Bisaya word to see what it means.</div><button class="btn primary block" id="cont">Next</button>`); $('#cont').onclick = () => { AB.i++; render(); };
    if (typeof tappableWords === 'function') { document.querySelectorAll('#rev .ceb').forEach(twWrap); }
  };
  $('#chk').onclick = () => reveal(inp.value.trim()); $('#idk').onclick = () => reveal('');
};

/* 6. retell it faster (4-3-2): the same story out loud in 60, then 45, then 30 seconds */
let RT = null;
function retellSources() {
  const out = [];
  if (typeof STORIES !== 'undefined') STORIES.forEach((s, i) => { if (!storyMissing(s).length) out.push({ title: s.emoji + ' ' + s.title, lines: s.lines.map(l => [l[0], l[1]]) }); });
  const k = knownWords(); DIALOGS.forEach(d => { if (!dlgTokens(d).filter(t => !k.has(t)).length) out.push({ title: '💬 ' + d.title, lines: d.lines.map(l => [l[1], l[2]]) }); });
  return out;
}
VIEWS.retell = function () {
  const src = retellSources();
  if (!RT) RT = { pick: null, round: 0, t: 0 };
  const head = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Retell it faster</h2></div>`;
  if (RT.pick == null) {
    $('#app').innerHTML = `${head}<section class="panel">${binkoSays('Pick something you know. You\'ll tell it out loud three times: in 60 seconds, then 45, then 30. Saying the same thing faster each time makes the words come out quicker (the 4-3-2 method).')}
      ${src.length ? src.slice(0, 12).map((x, i) => `<button class="prac" data-rt="${i}"><span class="pt"><b>${esc(x.title)}</b><span class="small muted">${x.lines.length} lines</span></span><span class="chev">${TI.chev}</span></button>`).join('') : '<p class="muted">Finish a few conversations first, then come back.</p>'}</section>`;
    $('#quit').onclick = () => { RT = null; go('practice'); };
    document.querySelectorAll('[data-rt]').forEach(b => b.onclick = () => { RT.pick = +b.dataset.rt; RT.src = src[RT.pick]; RT.round = 0; render(); }); return;
  }
  const secs = [60, 45, 30][RT.round], x = RT.src;
  if (RT.round >= 3) { $('#app').innerHTML = `${head}<section class="panel">${binkoSays('Three times, faster each time. Nindot! Notice how the third one came out smoother.')}<button class="btn primary block" id="again">Pick another</button></section>`;
    $('#quit').onclick = () => { RT = null; go('practice'); }; $('#again').onclick = () => { RT = null; render(); }; return; }
  $('#app').innerHTML = `${head}<div class="ex"><div class="label">Round ${RT.round + 1} of 3 · ${secs} seconds</div><b>${esc(x.title)}</b>
    <details ${RT.round ? '' : 'open'}><summary class="small">The story (read it once, then tell it without looking)</summary><div class="small" style="margin-top:6px">${x.lines.map(l => `<div><b>${esc(l[0])}</b> <span class="muted">${esc(l[1])}</span></div>`).join('')}</div></details>
    <div class="timer"><i id="tb"></i></div><div class="ceb tnum" id="left" style="text-align:center">${secs}</div>${recorderHtml()}</div><div class="foot" id="foot"></div>`;
  $('#quit').onclick = () => { clearInterval(timerH); RT = null; go('practice'); };
  wireRecorder(x.lines.map(l => l[0]).join(' '), null);
  foot(`<button class="btn primary block" id="go">Start the ${secs}-second round</button>`);
  $('#go').onclick = () => { const det = document.querySelector('.ex details'); if (det) det.open = false; const t0 = Date.now();
    foot(`<div class="small muted" style="text-align:center">Tell it out loud now, in Bisaya. No English!</div><button class="btn ghost block" id="early">I finished early</button>`);
    const end = () => { clearInterval(timerH); RT.round++; if (RT.round === 3) { addXP(10); save(); } render(); }; $('#early').onclick = end;   // XP once, when the third round ends
    timerH = setInterval(() => { const f = 1 - (Date.now() - t0) / (secs * 1000); const tb = $('#tb'), lf = $('#left'); if (!tb) return clearInterval(timerH); tb.style.width = Math.max(0, f * 100) + '%'; lf.textContent = Math.max(0, Math.ceil(f * secs)); if (f <= 0) end(); }, 200); };
};
