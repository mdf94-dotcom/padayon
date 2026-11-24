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
    ruleChoice(c, item, opts, 'ok', { ceb: r.said[1], en: r.said[2], res: { ceb: c.ceb, en: c.en } }, `${esc(r.who)} said <b>${esc(r.said[1])}</b> (${esc(r.said[2])}). That's your reply to it.${c.note ? '<br>' + esc(c.note) : ''}`);
  },
  replysay(c, item) {   // once you know the reply: say it out loud, then compare
    const r = REPLY_OF[c.id]; if (!r) return EX.speak(c, item);
    EX.speak(Object.assign({}, c, { replyTo: r.said[1], ask: `${r.who} says “${r.said[1]}” (${r.said[2]}). Say your reply: ${c.en}` }), item);
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
  // no picture questions (Mykha: the pictures were more confusing than helpful)
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
// questions whose words you already know come first (a question full of new words isn't about you yet)
function aboutPick(n) { const kw = knownWords(), miss = i => [ABOUT[i][0], ABOUT[i][2]].flatMap(s => tokens(s).map(lowTok)).filter(t => t && !kw.has(t) && !kw.has(rootOf(t))).length;
  return shuffle(ABOUT.map((_, i) => i)).sort((a, b) => miss(a) - miss(b)).slice(0, n); }
VIEWS.aboutme = function () {
  if (!AB) AB = { list: aboutPick(5), i: 0, done: false };
  if (AB.i >= AB.list.length && SEG) { const n = AB.list.length; AB = null; return segBack(`Ayos! ${n} answers about your own life. Back to your session.`); }
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
      ${mine ? `<div class="small" style="margin-top:6px">${bis ? '✅ That reads as Bisaya.' : '🤔 Most of that doesn\'t look like Bisaya words yet. Try using the example as a pattern.'} Change the details to fit your own life.</div>${freeNotes(mine, true)}` : ''}${mixTipFor(q[2])}</div>`;
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
  const secs = (RT.seg ? [40, 30, 20] : [60, 45, 30])[RT.round], x = RT.src;
  if (RT.round >= 3 && SEG) { RT = null; return segBack('Three times, faster each time. Nindot! Back to your session.'); }
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

/* ---------- "Don't mix up" boards: complete the table, drag into the box, draw lines ----------
   Built from each group's table (or its examples), so every group gets them. One of the daily session's
   mix-up questions is a board. Tap works everywhere (tap a word, then its spot); dragging works too. */
function mixBoardData(m) {
  const out = { grid: null, pairs: [] };
  if (m.table) {
    const doc = new DOMParser().parseFromString(m.table, 'text/html'), trs = [...doc.querySelectorAll('tr')];
    const head = [...(trs[0] || { children: [] }).children].map(x => x.textContent.trim()), rows = trs.slice(1).map(tr => [...tr.children].map(x => x.textContent.trim()));
    if (rows.length >= 3 && rows.every(r => r.length === head.length)) {
      out.grid = { head, rows };
      const cols = head.map((_, i) => i).filter(i => i > 0), c = cols[Math.floor(Math.random() * cols.length)];
      const clean = s => s.split(' / ')[0].replace(/\s*\(.*?\)/g, '').trim();
      const seen = new Set(); rows.forEach(r => { const v = clean(r[c]); if (!v || seen.has(norm(v))) return; seen.add(norm(v)); out.pairs.push([r[0] + (head.length > 2 && head[c] ? ' · ' + head[c] : ''), v]); });
    }
  }
  if (out.pairs.length < 3) { const seen = new Set(); out.pairs = (m.ok || []).filter(([a, b]) => { const k = norm(b); if (seen.has(k) || /[_=]/.test(a)) return false; seen.add(k); return true; }).map(([a, b]) => [b, a.replace(/[.!]$/, '')]); }
  out.pairs = shuffle(out.pairs).slice(0, 5);
  return out;
}
const mixBoardOk = m => { try { return mixBoardData(m).pairs.length >= 3; } catch (e) { return false; } };
let MG = null;   // the board on screen (tests use MG.solve)
EX.mixgrid = function (c, item) {
  const vb = item.vb, m = vb ? { title: vb.title, trick: vb.trick || '', rule: '' } : MIXUPS[item.mx]; if (!m) { qi++; return VIEWS.session(); }
  if (!item.board) {   // decide once, so going back to it shows the same board
    let d;
    if (vb) {   // vocabulary: pairs are [meaning, Bisaya, card]; a two-column table is Bisaya | meaning
      const flipT = Math.random() < 0.5;
      d = { pairs: vb.pairs.map(p => [p[0], p[1]]), ids: vb.pairs.map(p => p[2]), grid: vb.grid || { head: ['Bisaya', 'Meaning'], rows: vb.pairs.map(p => [p[1], p[0]]) }, col: vb.grid ? null : (flipT ? 0 : 1) };
    } else d = mixBoardData(m);
    const modes = ['lines', 'drag'].concat(d.grid && (d.grid.head.length > 2 || vb) ? ['table'] : []);
    item.board = { mode: item.mode || modes[Math.floor(Math.random() * modes.length)], d, flip: Math.random() < 0.3 };
    if (item.board.mode === 'table' && vb) { const g = d.grid; item.board.blanks = vb.kind === 'opp' ? g.rows.map((r, i) => i + ':' + (Math.random() < 0.5 ? 1 : 2)) : g.rows.map((r, i) => i + ':' + d.col); item.board.vcol = 1; }
    else if (item.board.mode === 'table') { const g = d.grid, cells = []; g.rows.forEach((r, i) => r.forEach((v, j) => { if (j > 0 && v && v.length < 26) cells.push([i, j]); })); item.board.blanks = shuffle(cells).slice(0, Math.min(6, Math.max(3, Math.floor(cells.length / 3)))).map(([i, j]) => i + ':' + j); }
  }
  const B = item.board, d = B.d, st = (S.mixStat || {})[m.title] || {};
  const cc = { id: c.id, kind: 'x', ceb: m.title, en: '', note: '', audio: false, board: 1 };
  const gradeWords = okBy => { if (!vb) return; Object.entries(okBy).forEach(([id, ok]) => { if (!id || sess.graded.has(id)) return; sess.graded.add(id); if (!sess.newIds.has(id)) grade(id, ok ? 2 : 0, 'board'); if (!ok && !sess.requeued.has(id)) { sess.requeued.add(id); Q.push({ id, type: exType(id) }); } }); sess.requeued.add(c.id); };
  const done = (ok, right, total, fixes) => { const extra = `<b>${right} of ${total} right.</b>${fixes && fixes.length ? `<br>${fixes.join('<br>')}` : ''}<br>${m.trick ? m.trick : esc(m.rule)}${vb ? (ok ? '' : '<br><span class="muted">The ones you missed come back later in this session.</span>') : `<br><span class="muted">This one: ${(((S.mixStat || {})[m.title] || {}).row || 0) + (ok ? 1 : 0)} of 3 right in a row on different days.</span>`}`; result(cc, item, ok, extra); };
  if (!document.getElementById('mgcss')) document.head.insertAdjacentHTML('beforeend', `<style id="mgcss">
    .mg-bank{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.mg-chip{padding:8px 12px;border-radius:12px;background:var(--card2,#24313a);border:2px solid rgba(255,255,255,.12);font-weight:700;touch-action:none;user-select:none;cursor:grab}
    .mg-chip.sel{border-color:var(--accent,#3bc1a8);transform:translateY(-2px)}.mg-chip.used{visibility:hidden}.mg-slot{display:inline-block;min-width:76px;min-height:34px;padding:6px 10px;border-radius:10px;border:2px dashed rgba(255,255,255,.25);font-weight:700;vertical-align:middle}
    .mg-slot.full{border-style:solid;border-color:rgba(255,255,255,.35)}.mg-slot.hot{border-color:var(--accent,#3bc1a8)}.mg-slot.ok{border-color:#3bc17a;background:rgba(59,193,122,.15)}.mg-slot.bad{border-color:#e46b7a;background:rgba(228,107,122,.15)}
    .mg-rows{display:flex;flex-direction:column;gap:8px}.mg-row{display:flex;align-items:center;gap:10px;justify-content:space-between}.mg-row .def{flex:1;font-size:.92rem}.mg-fix{display:block;font-size:.8rem;color:#3bc17a;font-weight:700}
    .mg-lines{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px 44px;margin-top:8px}.mg-item{position:relative;padding:10px 12px;border-radius:12px;border:2px solid rgba(255,255,255,.14);background:var(--card2,#1d2830);font-size:.9rem;touch-action:none;user-select:none;cursor:pointer;min-height:44px;display:flex;align-items:center}
    .mg-item.r{font-weight:700}.mg-item.sel{border-color:var(--accent,#3bc1a8)}.mg-item.ok{border-color:#3bc17a}.mg-item.bad{border-color:#e46b7a}.mg-svg{position:absolute;inset:0;pointer-events:none;overflow:visible}
    .mg-tab{width:100%;border-collapse:collapse;font-size:.82rem}.mg-tab td,.mg-tab th{padding:4px 3px;text-align:left;border-top:1px solid rgba(255,255,255,.08)}.mg-tab .mg-slot{min-width:52px;min-height:28px;padding:3px 6px;font-size:.82rem}</style>`);

  /* ----- draw lines ----- */
  if (B.mode === 'lines') {
    const L = d.pairs.map((p, i) => ({ i, t: B.flip ? p[1] : p[0] })), R = shuffle(d.pairs.map((p, i) => ({ i, t: B.flip ? p[0] : p[1] })));
    $('#ex').innerHTML = `<div class="label">${vb ? 'Your words' : "Don't mix up"} · ${esc(m.title)}</div><div class="prompt" style="font-size:1rem">Draw a line from each one to its match</div><p class="muted small" style="margin:0">Drag from one box to the other, or tap one and then the other. Tap a box again to undo its line.</p>
      <div class="mg-lines" id="mgl">${L.map((x, k) => `<div class="mg-item${B.flip ? ' r' : ''}" data-side="L" data-i="${x.i}" style="grid-column:1;grid-row:${k + 1}">${esc(x.t)}</div>`).join('')}${R.map((x, k) => `<div class="mg-item${B.flip ? '' : ' r'}" data-side="R" data-i="${x.i}" style="grid-column:2;grid-row:${k + 1}">${esc(x.t)}</div>`).join('')}<svg class="mg-svg" id="mgsvg"></svg></div>`;
    foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
    const box = $('#mgl'), svg = $('#mgsvg'), links = {}, el = (s, i) => box.querySelector(`.mg-item[data-side="${s}"][data-i="${i}"]`); let sel = null, ghost = null, graded = null;
    const pt = (e, side) => { const a = box.getBoundingClientRect(), b = e.getBoundingClientRect(); return [side === 'L' ? b.right - a.left : b.left - a.left, b.top - a.top + b.height / 2]; };
    const draw = () => { svg.innerHTML = Object.entries(links).map(([l, r]) => { const [x1, y1] = pt(el('L', l), 'L'), [x2, y2] = pt(el('R', r), 'R'); const col = graded ? (graded[l] ? '#3bc17a' : '#e46b7a') : 'var(--accent,#3bc1a8)'; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3" stroke-linecap="round"/><circle cx="${x1}" cy="${y1}" r="5" fill="${col}"/><circle cx="${x2}" cy="${y2}" r="5" fill="${col}"/>`; }).join('') + (ghost || '');
      $('#chk').disabled = Object.keys(links).length < L.length || !!graded; };
    const link = (a, b) => { const l = a.dataset.side === 'L' ? a : b, r = a.dataset.side === 'L' ? b : a; if (l.dataset.side === r.dataset.side) return; Object.keys(links).forEach(k => { if (links[k] === r.dataset.i) delete links[k]; }); links[l.dataset.i] = r.dataset.i; draw(); };
    const unlink = it => { if (it.dataset.side === 'L') delete links[it.dataset.i]; else Object.keys(links).forEach(k => { if (links[k] === it.dataset.i) delete links[k]; }); draw(); };
    const linked = it => it.dataset.side === 'L' ? links[it.dataset.i] != null : Object.values(links).includes(it.dataset.i);
    let down = null;
    box.querySelectorAll('.mg-item').forEach(it => {
      it.onpointerdown = e => { if (graded) return; down = { it, x: e.clientX, y: e.clientY, moved: false }; try { it.setPointerCapture(e.pointerId); } catch (x) { } };
      it.onpointermove = e => { if (!down || down.it !== it) return; if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true; if (!down.moved) return;
        const a = box.getBoundingClientRect(), [x1, y1] = pt(it, it.dataset.side); ghost = `<line x1="${x1}" y1="${y1}" x2="${e.clientX - a.left}" y2="${e.clientY - a.top}" stroke="var(--accent,#3bc1a8)" stroke-width="3" stroke-dasharray="6 5"/>`; draw(); };
      it.onpointerup = e => { if (!down || down.it !== it) return; const was = down; down = null; ghost = null;
        if (was.moved) { const t = document.elementFromPoint(e.clientX, e.clientY), tgt = t && t.closest('.mg-item'); if (tgt && tgt !== it && tgt.dataset.side !== it.dataset.side) { box.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); sel = null; link(it, tgt); } else draw(); return; }
        if (sel && sel !== it && sel.dataset.side !== it.dataset.side) { sel.classList.remove('sel'); link(sel, it); sel = null; return; }
        if (sel === it) { it.classList.remove('sel'); sel = null; return; }
        if (linked(it) && !sel) { unlink(it); return; }
        if (sel) sel.classList.remove('sel'); sel = it; it.classList.add('sel'); };
    });
    addEventListener('resize', draw, { once: true }); setTimeout(draw, 50);
    $('#chk').onclick = () => { graded = {}; let n = 0; L.forEach(x => { graded[x.i] = links[x.i] === String(x.i); if (graded[x.i]) n++; el('L', x.i).classList.add(graded[x.i] ? 'ok' : 'bad'); }); draw();
      const miss = L.filter(x => !graded[x.i]).map(x => `${esc(B.flip ? d.pairs[x.i][1] : d.pairs[x.i][0])} → <b>${esc(B.flip ? d.pairs[x.i][0] : d.pairs[x.i][1])}</b>`);
      if (vb) { const by = {}; L.forEach(x => { const id = d.ids[x.i]; by[id] = (by[id] !== false) && graded[x.i]; }); gradeWords(by); }
      done(n === L.length, n, L.length, miss.map(x => '❌ ' + x)); };
    MG = { solve: () => { L.forEach(x => links[x.i] = String(x.i)); draw(); $('#chk').click(); } };
    return;
  }

  /* ----- slots: drag into the box beside its meaning, or complete the table ----- */
  let slots = [];   // [{ key, ans }]
  let body = '';
  if (B.mode === 'table') {
    const g = d.grid, blanks = new Set(B.blanks);
    body = `<div class="prompt" style="font-size:1rem">Complete the table</div><p class="muted small" style="margin:0">Drag each word into its spot, or tap a word and then the spot.</p><div style="overflow-x:auto;margin-top:8px"><table class="mg-tab"><tr>${g.head.map(h => `<th class="muted">${esc(h)}</th>`).join('')}</tr>${g.rows.map((r, i) => `<tr>${r.map((v, j) => { const k = i + ':' + j; if (blanks.has(k)) { slots.push({ key: k, ans: v }); return `<td><span class="mg-slot" data-k="${k}"></span></td>`; } return `<td${j || vb ? '' : ' class="muted"'}${vb && j === 0 && !B.vcol ? '' : ''}>${vb && ((vb.grid && (j === 1 || j === 2)) || (!vb.grid && j === 0)) ? '<b>' + esc(v) + '</b>' : esc(v)}</td>`; }).join('')}</tr>`).join('')}</table></div>`;
  } else {
    const rows = d.pairs.map((p, i) => ({ k: String(i), def: B.flip ? p[1] : p[0], ans: B.flip ? p[0] : p[1] }));
    slots = rows.map(r => ({ key: r.k, ans: r.ans }));
    body = `<div class="prompt" style="font-size:1rem">Drag each one into the box beside its match</div><p class="muted small" style="margin:0">Or tap one, then tap its box.</p><div class="mg-rows" style="margin-top:10px">${rows.map(r => `<div class="mg-row"><span class="def${B.flip ? ' ' : ''}" style="${B.flip ? 'font-weight:700' : ''}">${esc(r.def)}</span><span class="mg-slot" data-k="${r.k}"></span></div>`).join('')}</div>`;
  }
  const slotLabel = k => { if (B.mode === 'table') { const [i, j] = k.split(':').map(Number); return vb ? d.grid.rows[i].filter((_, x) => x !== j).join(' · ') : d.grid.rows[i][0] + ' · ' + d.grid.head[j]; } const p = d.pairs[+k]; return B.flip ? p[1] : p[0]; };
  const chips = shuffle(slots.map((s, i) => ({ id: 'c' + i, v: s.ans })));
  $('#ex').innerHTML = `<div class="label">${vb ? 'Your words' : "Don't mix up"} · ${esc(m.title)}</div>${body}<div class="mg-bank" id="mgb">${chips.map(x => `<span class="mg-chip" data-c="${x.id}">${esc(x.v)}</span>`).join('')}</div>`;
  foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
  const put = {}, chipEl = id => $(`.mg-chip[data-c="${id}"]`), slotEl = k => $(`.mg-slot[data-k="${k}"]`); let sel = null, graded = false;
  const refresh = () => { document.querySelectorAll('.mg-slot').forEach(s => { const cid = put[s.dataset.k]; s.textContent = cid ? chips.find(x => x.id === cid).v : ''; s.classList.toggle('full', !!cid); });
    document.querySelectorAll('.mg-chip').forEach(ch => ch.classList.toggle('used', Object.values(put).includes(ch.dataset.c))); $('#chk').disabled = Object.keys(put).length < slots.length || graded; };
  const place = (cid, k) => { Object.keys(put).forEach(x => { if (put[x] === cid) delete put[x]; }); put[k] = cid; refresh(); };
  document.querySelectorAll('.mg-slot').forEach(s => s.onclick = () => { if (graded) return; if (sel) { place(sel, s.dataset.k); chipEl(sel).classList.remove('sel'); sel = null; } else if (put[s.dataset.k]) { delete put[s.dataset.k]; refresh(); } });
  document.querySelectorAll('.mg-chip').forEach(ch => {
    let dr = null;
    ch.onpointerdown = e => { if (graded) return; dr = { x: e.clientX, y: e.clientY, moved: false, ghost: null }; try { ch.setPointerCapture(e.pointerId); } catch (x) { } };
    ch.onpointermove = e => { if (!dr) return; if (!dr.moved && Math.hypot(e.clientX - dr.x, e.clientY - dr.y) > 8) { dr.moved = true; dr.ghost = ch.cloneNode(true); Object.assign(dr.ghost.style, { position: 'fixed', zIndex: 99, pointerEvents: 'none', opacity: .9, margin: 0 }); document.body.appendChild(dr.ghost); }
      if (!dr.moved) return; dr.ghost.style.left = (e.clientX - 30) + 'px'; dr.ghost.style.top = (e.clientY - 20) + 'px';
      document.querySelectorAll('.mg-slot.hot').forEach(x => x.classList.remove('hot')); const t = document.elementFromPoint(e.clientX, e.clientY), s = t && t.closest('.mg-slot'); if (s) s.classList.add('hot'); };
    ch.onpointerup = e => { if (!dr) return; const was = dr; dr = null; if (was.ghost) was.ghost.remove(); document.querySelectorAll('.mg-slot.hot').forEach(x => x.classList.remove('hot'));
      if (was.moved) { const t = document.elementFromPoint(e.clientX, e.clientY), s = t && t.closest('.mg-slot'); if (s) place(ch.dataset.c, s.dataset.k); return; }
      if (sel === ch.dataset.c) { ch.classList.remove('sel'); sel = null; return; } document.querySelectorAll('.mg-chip.sel').forEach(x => x.classList.remove('sel')); sel = ch.dataset.c; ch.classList.add('sel'); };
  });
  $('#chk').onclick = () => { graded = true; let n = 0;
    const fixes = []; slots.forEach(s => { const got = chips.find(x => x.id === put[s.key]).v, ok = norm(got) === norm(s.ans), el = slotEl(s.key); el.classList.add(ok ? 'ok' : 'bad'); if (ok) n++; else { fixes.push(`❌ ${esc(slotLabel(s.key))}: <s>${esc(got)}</s> → <b>${esc(s.ans)}</b>`); } });
    if (vb) { const by = {}; slots.forEach(s => { const row = B.mode === 'table' ? +s.key.split(':')[0] : +s.key, got = chips.find(x => x.id === put[s.key]).v, ok = norm(got) === norm(s.ans);
      const ids = vb.kind === 'opp' ? [vb.opp[row].ia, vb.opp[row].ib] : [d.ids[row]]; ids.forEach(id => { by[id] = (by[id] !== false) && ok; }); }); gradeWords(by); }
    refresh(); slots.forEach(s => { const el = slotEl(s.key); if (el.classList.contains('bad')) el.insertAdjacentHTML('beforeend', `<span class="mg-fix">${esc(s.ans)}</span>`); }); done(n === slots.length, n, slots.length, fixes); };
  MG = { solve: () => { slots.forEach(s => { const ch = chips.find(x => x.v === s.ans && !Object.values(put).includes(x.id)); put[s.key] = ch.id; }); refresh(); $('#chk').click(); } };
};

/* ---------- vocabulary boards: the same table / drag / lines questions for all your words ----------
   Each session turns a handful of your due reviews into one board, grouped so they belong together (a verb and
   its forms, opposites, or a topic like family or food), and one board of today's new words near the end.
   Every word on a board is graded on its own; any you miss comes back as a regular question. */
const VB_TOPICS = [
  ['Family', /\b(mother|father|mom|dad|mama|papa|sister|brother|sibling|grand\w*|aunt|uncle|cousin|son|daughter|wife|husband|spouse|family|baby|parents?|relatives?|in-law)\b/],
  ['Body', /\b(head|hands?|foot|feet|eyes?|ears?|nose|mouth|teeth|tooth|hair|stomach|belly|legs?|arms?|face|fingers?|knees?|neck|shoulders?|skin|body|back)\b/],
  ['Food and eating', /\b(rice|food|eat|eats|eating|ate|eaten|fish|chicken|pork|meat|fruit|banana|mango|bread|eggs?|coffee|soup|vegetables?|sweet|salty|sugar|delicious|tasty|hungry|full|drink|drinks|drinking|drank|cook|cooks|cooking|cooked|breakfast|lunch|dinner|snack)\b/],
  ['Time', /\b(today|tomorrow|yesterday|morning|noon|afternoon|evening|night|tonight|week|month|year|now|later|early|late|hours?|minutes?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|always|sometimes|never)\b/],
  ['Weather', /\b(rain|rains|raining|rainy|sun|sunny|hot|cold|wind|windy|cloud|cloudy|storm|weather|typhoon|heat)\b/],
  ['Feelings', /\b(happy|sad|angry|mad|tired|scared|afraid|shy|ashamed|bored|excited|love|miss|worried|lonely|feel|feels|feeling|sick|hurt|glad|jealous)\b/],
  ['Places', /\b(house|home|school|church|market|store|shop|city|town|room|kitchen|street|road|beach|sea|mountain|hospital|office|yard|bathroom|province)\b/],
  ['Animals', /\b(dog|cat|bird|pig|cow|carabao|goat|horse|mosquito|ants?|animals?|rooster|lizard|rat|mouse)\b/],
  ['Colors', /\b(red|blue|green|yellow|white|black|colou?rs?|brown|pink|orange|purple)\b/],
  ['Numbers', /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|fifty|hundred|thousand|numbers?|first|second|third|half)\b/],
  ['Going and doing', /^(to )?(go|goes|going|went|gone|come|comes|coming|came|walk|walks|walking|walked|run|runs|running|ran|leave|leaving|left|arrive|arrived|arriving|return|returned|sit|sitting|sat|stand|standing|stood|sleep|sleeping|slept|wake up|woke up|swim|swimming|swam|ride|riding|rode|play|playing|played|work|working|worked|study|studying|studied|bathe|bathing|take a bath)\b/]];
// opposites, both sides standard Cebuano
const VB_OPP = [['dako', 'gamay', 'big', 'small'], ['init', 'bugnaw', 'hot', 'cold'], ['taas', 'mubo', 'tall / long', 'short'], ['bag-o', 'daan', 'new', 'old (thing)'], ['sayo', 'ulahi', 'early', 'late'], ['puti', 'itom', 'white', 'black'],
  ['tambok', 'niwang', 'fat', 'thin'], ['paspas', 'hinay', 'fast', 'slow'], ['layo', 'duol', 'far', 'near'], ['lisod', 'sayon', 'hard', 'easy'], ['adlaw', 'gabii', 'day', 'night'], ['sulod', 'gawas', 'inside', 'outside'],
  ['bug-at', 'gaan', 'heavy', 'light'], ['limpyo', 'hugaw', 'clean', 'dirty'], ['basa', 'uga', 'wet', 'dry'], ['daghan', 'gamay', 'many / a lot', 'few / a little'], ['nindot', 'bati', 'nice', 'ugly / bad'], ['tigulang', 'bata', 'old (person)', 'young'],
  ['abli', 'sira', 'open', 'closed'], ['lalaki', 'babaye', 'man / male', 'woman / female'], ['oo', 'dili', 'yes', 'no'], ['naa', 'wala', 'there is', 'there isn\'t']];
const VB_PRE = /^(mo|ni|mi|nag|mag|naka|maka|nang|mang|gi|pag)-?/;
const vbEn = c => { const e = String(c.en).split(/;|\s\/\s/)[0].trim(), bare = e.replace(/\s*\([^)]*\)?/g, '').trim(); return bare.length >= 2 ? bare : e; };
const vbKnown = id => { const k = S.cards[id]; return k && !k.fresh && (k.b || 0) >= 1; };
// the groups a word belongs to
function vbGroups(pool) {
  const fam = {}, top = {}, opp = [];
  pool.forEach(id => { const c = card(id); if (!c || !/^[wpm]/.test(id) || tokens(c.ceb).length > 2) return;
    const w = lowTok(firstAlt(c.ceb));
    if (tokens(c.ceb).length === 1) { const root = w.replace(VB_PRE, ''); if (root.length >= 3 && (root === w || VB_PRE.test(w))) (fam[root] = fam[root] || []).push(id); }
    const e = vbEn(c).replace(/\s*\([^)]*\)/g, '').toLowerCase(); const t = VB_TOPICS.find(([, re]) => re.test(e)); if (t) (top[t[0]] = top[t[0]] || []).push(id); });
  VB_OPP.forEach(([a, b, ea, eb]) => { const ia = cardForTok(a), ib = cardForTok(b); if (ia && ib && pool.includes(ia) && pool.includes(ib)) opp.push({ a, b, ea, eb, ia, ib }); });
  return { fam: Object.entries(fam).filter(([r, ids]) => ids.length >= 3), top: Object.entries(top).filter(([t, ids]) => ids.length >= 4), opp };
}
// turn a set of cards into board pairs [meaning, bisaya, id], dropping repeats so every match has one answer
function vbPairs(ids, n) {
  const seenE = new Set(), seenC = new Set(), out = [];
  shuffle(ids.slice()).forEach(id => { const c = card(id); if (!c || out.length >= n) return; const e = vbEn(c), b = firstAlt(c.ceb).replace(/[.!]$/, ''); if (!e || e.length > 40 || seenE.has(norm(e)) || seenC.has(norm(b))) return; seenE.add(norm(e)); seenC.add(norm(b)); out.push([e, b, id]); });
  return out;
}
function vocabBoards(q, nw) {
  const known = Object.keys(S.cards).filter(vbKnown), out = [];
  const reviewIdx = q.map((x, i) => ({ x, i })).filter(({ x }) => !x.recap && !x.retry && ['mc', 'listen', 'type', 'tiles', 'speak', 'dict', 'build'].includes(x.type) && /^[wpm]/.test(x.id) && vbKnown(x.id));
  const dueSet = new Set(reviewIdx.map(r => r.x.id));
  if (known.length >= 12 && dueSet.size >= 3) {
    const g = vbGroups(known); let pick = null;
    const withDue = ids => ids.filter(id => dueSet.has(id)).length;
    // a verb and its forms > opposites > a topic > just your due words
    const fams = shuffle(g.fam.filter(([, ids]) => withDue(ids) >= 1));
    if (fams.length && Math.random() < 0.5) { const [root, ids] = fams[0]; const p = vbPairs(ids, 5); if (p.length >= 3) pick = { title: 'One root, different forms · ' + root, kind: 'family', pairs: p, trick: 'Same root, different start: <b>mo-</b> will, <b>ni- / mi-</b> did, <b>nag-</b> doing (or did, ongoing), <b>maka- / naka-</b> can / managed to, <b>gi-</b> done to it.' }; }
    const opps = g.opp.filter(o => dueSet.has(o.ia) || dueSet.has(o.ib));
    if (!pick && opps.length >= 2 && Math.random() < 0.5) { const os = shuffle(g.opp.slice()).sort((x, y) => (dueSet.has(y.ia) || dueSet.has(y.ib)) - (dueSet.has(x.ia) || dueSet.has(x.ib))).slice(0, 4);
      pick = { title: 'Opposites', kind: 'opp', opp: os, pairs: os.map(o => [o.ea + ' ↔ ' + o.eb, o.a + ' · ' + o.b, o.ia]), grid: { head: ['means', 'word', 'opposite', 'means'], rows: os.map(o => [o.ea, o.a, o.b, o.eb]) }, ids: os.flatMap(o => [o.ia, o.ib]), trick: 'Learn them in pairs: when you know one side, you\'ve nearly got the other.' }; }
    const tops = shuffle(g.top.filter(([, ids]) => withDue(ids) >= 1));
    if (!pick && tops.length) { const [t, ids] = tops[0]; const due = ids.filter(id => dueSet.has(id)), rest = shuffle(ids.filter(id => !dueSet.has(id))); const p = vbPairs(due.concat(rest), 5); if (p.length >= 4) pick = { title: t, kind: 'topic', pairs: p }; }
    if (!pick) { const p = vbPairs([...dueSet], 5); if (p.length >= 3) pick = { title: 'Due today', kind: 'review', pairs: p }; }
    if (pick) {
      const ids = pick.ids || pick.pairs.map(p => p[2]);
      // the due ones on the board come out of the session's single questions, so the session stays the same length
      const drop = reviewIdx.filter(r => ids.includes(r.x.id)), at = drop.length ? drop[0].i : Math.floor(q.length * 0.3);
      drop.slice().reverse().forEach(r => q.splice(r.i, 1));
      q.splice(Math.min(at, q.length), 0, { id: ids[0], type: 'mixgrid', vb: pick });
      out.push(pick);
    }
  }
  // today's new words, together, near the end (it stands in for a few of the one-at-a-time recaps)
  const fresh = (nw || []).filter(id => /^[wpm]/.test(id) && card(id));
  if (fresh.length >= 4) { const p = vbPairs(fresh, 5); if (p.length >= 4) {
    const ids = p.map(x => x[2]); let cut = 0; for (let i = q.length - 1; i >= 0 && cut < 3; i--) if (q[i].recap && ids.includes(q[i].id)) { q.splice(i, 1); cut++; }
    q.splice(Math.max(0, q.length - 2), 0, { id: ids[0], type: 'mixgrid', vb: { title: "Today's new words", kind: 'new', pairs: p } }); } }
  return out;
}
