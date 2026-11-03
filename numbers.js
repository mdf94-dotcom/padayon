'use strict';
/* Numbers & time: say any number from 0 to a billion, native Bisaya or the Spanish-based way, and tell the time.
   The words come from a generator (NUM below) built from the rules in Cebuano grammar references, so every
   number has an answer. Audio is put together from recordings of each part. */

/* ---------- the generator (filled in from the rules spec) ---------- */
/* Rules from Cebuano grammar references (Bunye & Yap, Cebuano Grammar Notes; Wiktionary's full 21-99 forms;
   Wikipedia's Cebuano numerals; DLIFLC Cebuano). Where spellings vary, the most common is used.
   Native: "ug" (and) joins parts and shortens onto the word before it: napulo + ug = napulog, kawhaan + ug = kawhaag.
   Big numbers count up with "ka": duha ka gatos (200), napulo ka libo (10,000), usa ka milyon.
   Spanish-based: used for time, money and big amounts: baynte uno, trayntay singko, dosentos, dos mil. */
const NU = ['', 'usa', 'duha', 'tulo', 'upat', 'lima', 'unom', 'pito', 'walo', 'siyam'];
const NT = { 2: 'kawhaan', 3: 'katloan', 4: "kap-atan", 5: 'kalim-an', 6: 'kan-oman', 7: 'kapitoan', 8: 'kawaloan', 9: 'kasiyaman' };
const SPN = ['siro', 'uno', 'dos', 'tres', 'kwatro', 'singko', 'sais', 'siyete', 'otso', 'nuybe', 'diyes', 'onse', 'dose', 'trese', 'katorse', 'kinse', 'desisais', 'desisiyete', 'desiotso', 'desinuybe', 'baynte'];
const STN = { 3: 'traynta', 4: 'kwarenta', 5: 'singkwenta', 6: 'saysenta', 7: 'setenta', 8: 'otsenta', 9: 'nobenta' };
const SHN = { 1: 'siyento', 2: 'dosentos', 3: 'tresentos', 4: 'kwatrosentos', 5: 'kinyentos', 6: 'saysentos', 7: 'setesentos', 8: 'otsosentos', 9: 'nuybesentos' };
const ugOnto = w => /[aeiou]$/.test(w) ? w + 'g' : /n$/.test(w) ? w.slice(0, -1) + 'g' : w + ' ug';
const nat100 = n => n < 10 ? NU[n] : n === 10 ? 'napulo' : n < 20 ? 'napulog ' + NU[n - 10] : n % 10 ? ugOnto(NT[Math.floor(n / 10)]) + ' ' + NU[n % 10] : NT[n / 10];
const nat1000 = n => { const h = Math.floor(n / 100), r = n % 100; if (!h) return nat100(r); return NU[h] + ' ka gatos' + (r ? ' ug ' + nat100(r) : ''); };
const sp100 = n => n <= 20 ? SPN[n] : n < 30 ? 'baynte ' + SPN[n - 20] : n % 10 ? STN[Math.floor(n / 10)] + 'y ' + SPN[n % 10] : STN[n / 10];
const sp1000 = n => { const h = Math.floor(n / 100), r = n % 100; if (!h) return sp100(r); return r ? SHN[h] + ' ' + sp100(r) : SHN[h]; };
const NUM = {
  ready: true,
  native(n) { if (n === 0) return 'siro'; if (n === 1e9) return 'usa ka bilyon';
    const M = Math.floor(n / 1e6), T = Math.floor(n / 1000) % 1000, R = n % 1000, p = [];
    if (M) p.push(nat1000(M) + ' ka milyon'); if (T) p.push(nat1000(T) + ' ka libo');
    if (R) p.push(p.length && R < 100 ? 'ug ' + nat100(R) : nat1000(R)); return p.join(' '); },
  spanish(n) { if (n === 0) return 'siro'; if (n === 1e9) return 'usa ka bilyon';
    const M = Math.floor(n / 1e6), T = Math.floor(n / 1000) % 1000, R = n % 1000, p = [];
    if (M) p.push(M === 1 ? 'usa ka milyon' : sp1000(M) + ' milyon'); if (T) p.push(T === 1 ? 'mil' : sp1000(T) + ' mil');
    if (R) p.push(sp1000(R)); return p.join(' '); },
  // 12-hour clock time (the drill shows a clock face, so no morning/afternoon part)
  time(h, m) { const hh = h % 12 || 12; let s = hh === 1 ? 'ala una' : 'alas ' + SPN[hh];
    if (m === 30) s += ' y medya'; else if (m >= 1 && m <= 9) s += ' y ' + SPN[m]; else if (m >= 10) s += ' ' + sp100(m); return s; },
  // other ways people say the same time (shown after answering)
  timeAlso(h, m) { const nx = (h % 12) + 1, hn = nx === 1 ? 'ala una' : 'alas ' + SPN[nx], out = [];
    if (m === 30) out.push((h % 12 || 12) === 1 ? 'ala una traynta' : 'alas ' + SPN[h % 12 || 12] + ' traynta');
    if (m >= 40) out.push(hn + ' menos ' + sp100(60 - m)); if (m === 45) out.push('menos kinse para ' + hn);
    return out; },
  parts: s => s.split(/\s+/).filter(Boolean)
};

/* ---------- drill state ---------- */
const NLEVELS = [
  ['1-10', '1–10', 1, 10], ['11-99', '11–99', 11, 99], ['100s', 'Hundreds', 100, 999], ['1000s', 'Thousands', 1000, 99999],
  ['millions', 'Up to a million', 100000, 1000000], ['billion', 'Up to a billion', 1000000, 1000000000], ['time', 'Telling time', 0, 0]
];
const NMODES = [['read', 'Read it', 'Bisaya to digits'], ['hear', 'Hear it', 'Listen, then type the digits'], ['say', 'Say it', 'Build it in Bisaya']];
let NR = null; // the current round
const nset = () => (S.settings.num = Object.assign({ sys: 'native', lvl: '1-10', mode: 'read' }, S.settings.num || {}));
const pickNum = lvl => { const L = NLEVELS.find(x => x[0] === lvl) || NLEVELS[0];
  if (lvl === 'billion') { const r = Math.random(); return r < 0.15 ? 1000000000 : Math.floor(Math.pow(10, 6 + Math.random() * 3)); }
  if (lvl === 'millions') return Math.random() < 0.15 ? 1000000 : Math.floor(Math.pow(10, 5 + Math.random())) ;
  return L[2] + Math.floor(Math.random() * (L[3] - L[2] + 1)); };
const pickTime = () => { const h = 1 + Math.floor(Math.random() * 12), r = Math.random(); const m = r < 0.3 ? 0 : r < 0.5 ? 30 : r < 0.65 ? [15, 45][Math.floor(Math.random() * 2)] : Math.floor(Math.random() * 12) * 5 + (Math.random() < 0.3 ? 1 + Math.floor(Math.random() * 4) : 0); return [h, Math.min(59, m)]; };
const fmtNum = n => n.toLocaleString('en-US');
const fmtTime = (h, m) => h + ':' + String(m).padStart(2, '0');
function clockSvg(h, m) {
  const a = (deg, len, w, c) => { const r = (deg - 90) * Math.PI / 180; return `<line x1="50" y1="50" x2="${50 + Math.cos(r) * len}" y2="${50 + Math.sin(r) * len}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };
  const ticks = Array.from({ length: 12 }, (_, i) => { const r = (i * 30 - 90) * Math.PI / 180; return `<circle cx="${50 + Math.cos(r) * 40}" cy="${50 + Math.sin(r) * 40}" r="${i % 3 ? 1.4 : 2.4}" fill="var(--muted)"/>`; }).join('');
  return `<svg class="nclock" viewBox="0 0 100 100" role="img" aria-label="A clock showing ${fmtTime(h, m)}"><circle cx="50" cy="50" r="46" fill="var(--surface)" stroke="var(--line)" stroke-width="3"/>${ticks}${a((h % 12) * 30 + m * 0.5, 24, 5, 'var(--ink)')}${a(m * 6, 36, 3, 'var(--sea)')}<circle cx="50" cy="50" r="3" fill="var(--sea)"/></svg>`;
}
const numAnswer = q => q.time ? NUM.time(q.h, q.m) : (q.sys === 'spanish' ? NUM.spanish(q.n) : NUM.native(q.n));
// play a number phrase: the whole phrase if it was recorded, otherwise its parts one after another
async function sayNum(s, btn) {
  if (hasVoice(s)) return playSentence(s, btn);
  const r = ++playReq, cx = audioCtx();
  for (const p of NUM.parts(s)) { const u = await voiceUrlA(p).catch(() => null); if (!stillWanted(r, cx)) return; if (!u) continue; await playUrl(u, 1, btn); if (!stillWanted(r, cx)) return; }
}
const digitsOk = (typed, q) => { const d = String(typed).replace(/[^0-9:]/g, ''); return q.time ? d.replace(/^0/, '') === fmtTime(q.h, q.m) || d === String(q.h) + String(q.m).padStart(2, '0') : d === String(q.n); };

/* ---------- the start screen ---------- */
VIEWS.numbers = function () {
  const st = nset(), isTime = st.lvl === 'time';
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(o => `<button class="${o[0] === cur ? 'on' : ''}" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>`;
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Numbers &amp; time</h2></div>
    <section class="panel"><p style="margin:0">Say any number up to a billion, and tell the time. Bisaya uses two sets of numbers: <b>native</b> ones for counting things, and <b>Spanish-based</b> ones for time, money and big amounts. Practice both.</p></section>
    <section class="panel nsetup">
      <div><div class="label">Numbers</div>${isTime ? '<p class="muted small" style="margin:0">Time is always told the Spanish-based way.</p>' : seg('nsys', [['native', 'Native'], ['spanish', 'Spanish-based']], st.sys)}</div>
      <div><div class="label">Level</div>${seg('nlvl', NLEVELS, st.lvl)}</div>
      <div><div class="label">Practice</div>${seg('nmode', NMODES, st.mode)}<p class="muted small" style="margin:6px 0 0">${esc((NMODES.find(m => m[0] === st.mode) || NMODES[0])[2])}</p></div>
      <button class="btn primary block" id="ngo">Start 10 questions</button></section>
    <section class="panel"><div class="label">Try one</div>${(() => { const q = isTime ? (([h, m]) => ({ time: true, h, m }))(pickTime()) : { n: pickNum(st.lvl), sys: st.sys }; const s = numAnswer(q);
      return `<div class="row" style="gap:12px;align-items:center;flex-wrap:wrap">${q.time ? clockSvg(q.h, q.m) : `<b class="nbig">${fmtNum(q.n)}</b>`}<div style="min-width:0;flex:1"><div class="ceb" style="font-size:1.25rem">${esc(s)}</div>${phonHtml(s)}</div><button class="play sm" id="nsay" aria-label="Hear it">${I.play}</button></div>`; })()}</section>`;
  $('#quit').onclick = () => goTab();
  const bind = (id, k) => document.querySelectorAll('#' + id + ' [data-v]').forEach(b => b.onclick = () => { S.settings.num[k] = b.dataset.v; save(); render(); });
  bind('nsys', 'sys'); bind('nlvl', 'lvl'); bind('nmode', 'mode');
  const ex = $('#app .ceb'); $('#nsay').onclick = e => sayNum(ex.textContent, e.currentTarget);
  $('#ngo').onclick = () => startNumRound();
};
function startNumRound() {
  const st = nset(); NR = { st: Object.assign({}, st), i: 0, right: 0, qs: [] };
  for (let k = 0; k < 10; k++) NR.qs.push(st.lvl === 'time' ? (([h, m]) => ({ time: true, h, m }))(pickTime()) : { n: pickNum(st.lvl), sys: st.sys });
  view = 'numround'; render();
}

/* ---------- a round ---------- */
VIEWS.numround = function () {
  if (!NR) return go('numbers');
  if (NR.i >= NR.qs.length) return numDone();
  const q = NR.qs[NR.i], ans = numAnswer(q), mode = NR.st.mode;
  const head = `<div class="sbar"><button class="x" id="quit" aria-label="End">${I.x}</button><div class="prog"><i style="width:${NR.i / NR.qs.length * 100}%"></i></div><span class="muted small tnum">${NR.i + 1} of ${NR.qs.length}</span></div>`;
  let body = '';
  if (mode === 'say') {
    const parts = NUM.parts(ans), extra = numDistractors(q, parts);
    NR.bank = shuffle(parts.concat(extra).map((t, k) => ({ t, k: 'b' + k }))); NR.tray = [];
    body = `<div class="label">Say it in Bisaya</div><div class="nprompt">${q.time ? clockSvg(q.h, q.m) + `<b class="nbig">${fmtTime(q.h, q.m)}</b>` : `<b class="nbig">${fmtNum(q.n)}</b>`}</div>
      <div class="tray" id="tray"></div><div class="bank" id="bank">${NR.bank.map(b => `<button class="tile" data-k="${b.k}">${esc(b.t)}</button>`).join('')}</div>`;
  } else {
    body = `<div class="label">${mode === 'hear' ? 'Type the number you hear' : 'What number is this?'}${q.time ? ' (a time, like 2:30)' : ''}</div>
      ${mode === 'hear' ? `<div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><span class="muted small">Tap to hear it again</span></div>` : `<div class="ceb" style="font-size:1.6rem">${esc(ans)}</div>${phonHtml(ans)}`}
      <input class="field" id="nans" inputmode="${q.time ? 'text' : 'numeric'}" autocomplete="off" placeholder="${q.time ? 'e.g. 2:30' : 'Type the digits'}">`;
  }
  $('#app').innerHTML = `${head}<div class="ex" id="ex">${body}</div><div class="foot" id="foot"><button class="btn primary block" id="chk" disabled>Check</button></div>`;
  $('#quit').onclick = () => { stopAudio(); go('numbers'); };
  const check = ok => numResult(q, ans, ok);
  if (mode === 'say') {
    const draw = () => { $('#tray').innerHTML = NR.tray.map(k => `<button class="tile" data-k="${k}">${esc(NR.bank.find(b => b.k === k).t)}</button>`).join('');
      document.querySelectorAll('#bank .tile').forEach(b => b.classList.toggle('used', NR.tray.includes(b.dataset.k)));
      $('#tray').querySelectorAll('.tile').forEach(b => b.onclick = () => { NR.tray.splice(NR.tray.indexOf(b.dataset.k), 1); draw(); });
      $('#chk').disabled = !NR.tray.length; };
    document.querySelectorAll('#bank .tile').forEach(b => b.onclick = () => { if (!NR.tray.includes(b.dataset.k)) { NR.tray.push(b.dataset.k); draw(); } });
    $('#chk').onclick = () => check(NR.tray.map(k => NR.bank.find(b => b.k === k).t).join(' ') === ans);
  } else {
    const inp = $('#nans'); inp.focus({ preventScroll: true });
    inp.oninput = () => $('#chk').disabled = !inp.value.trim();
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) $('#chk').click(); };
    $('#chk').onclick = () => check(digitsOk(inp.value, q));
    if (mode === 'hear') { $('#pl').onclick = e => sayNum(ans, e.currentTarget); sayNum(ans, $('#pl')); }
  }
};
// wrong tiles that look plausible: neighbouring numbers' parts
function numDistractors(q, parts) {
  const pool = new Set(); for (let k = 0; k < 6; k++) { const alt = q.time ? NUM.time(1 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 12) * 5) : (q.sys === 'spanish' ? NUM.spanish : NUM.native)(Math.max(0, q.n + Math.round((Math.random() - 0.5) * Math.max(10, q.n)))); NUM.parts(alt).forEach(p => pool.add(p)); }
  parts.forEach(p => pool.delete(p)); return shuffle([...pool]).slice(0, Math.min(4, Math.max(2, Math.ceil(parts.length / 2))));
}
function numResult(q, ans, ok) {
  logAnswer(ok); if (ok) { NR.right++; addXP(3); }
  document.querySelectorAll('#ex button, #ex input').forEach(b => b.disabled = true);
  const shown = q.time ? fmtTime(q.h, q.m) : fmtNum(q.n);
  $('#foot').className = 'foot ' + (ok ? 'good' : 'bad');
  $('#foot').innerHTML = `<div class="verdict">${ok ? pick(['Tama!', 'Sakto!', 'Nindot!']) : 'Dili pa.'}</div>
    <div class="ans"><b>${esc(shown)}</b> <span class="muted">=</span> <span>${esc(ans)}</span> <button class="play sm" id="nplay" aria-label="Hear it">${I.play}</button></div>${phonHtml(ans)}
    ${q.time && NUM.timeAlso(q.h, q.m).length ? `<div class="small muted">People also say: ${NUM.timeAlso(q.h, q.m).map(esc).join(' · ')}</div>` : ''}
    <button class="btn primary block" id="cont">Next</button>`;
  $('#nplay').onclick = e => sayNum(ans, e.currentTarget);
  $('#cont').onclick = () => { stopAudio(); NR.i++; render(); }; $('#cont').focus({ preventScroll: true });
  save();
}
function numDone() {
  view = 'summary'; const n = NR.right, all = NR.qs.length;
  $('#app').innerHTML = `<section class="panel summary"><div class="label">Numbers &amp; time</div><h1 style="font-size:2.4rem;color:var(--sea)">${n} of ${all}</h1>
    ${binkoSays(n === all ? 'PERFECT! Binko counted every single one. Try a harder level!' : n >= 7 ? 'Binko binks you are getting really good at this!' : 'Numbers are tricky! Binko says: try the same level again.')}
    <button class="btn primary block" id="again">Go again</button><button class="btn ghost block" id="back">Change level</button></section>`;
  $('#again').onclick = () => startNumRound(); $('#back').onclick = () => go('numbers');
}
