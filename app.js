'use strict';
/* Padayon: daily Bisaya practice, guided by Binko-SR157.
   Deck content (phrases, words, recordings) is imported from a local content pack and kept in IndexedDB.
   Grammar cards below are built in. */

/* ---------- built-in grammar cards: [Bisaya, English, explanation, unit] ---------- */
const G = [
  ['Unsay imong ngalan?', "What's your name?", 'Unsay = unsa + ang. In fast speech "unsa ang" almost always shrinks to "unsay".', 0],
  ['Way problema', 'No problem', "Way = wala'y (wala + ay), \"there is no…\". You'll hear way, wa'y and wala'y.", 0],
  ['Naay tawo sa gawas', 'There is someone outside', 'Naay = naa + ay, "there is / there are".', 0],
  ['Di ko ganahan', "I don't like it", 'Di = dili. Native speakers drop the "li" most of the time.', 0],
  ['Unsa ni?', 'What is this?', 'Ni = kini (this, near me). Na = kana (that, near you). To = kadto (that, far away or in the past).', 0],
  ['Kinsa na?', 'Who is that?', 'Na here is kana, "that (near you)". It sounds the same as na "already", so context decides.', 0],
  ['Asa ka ron?', 'Where are you now?', 'Ron = karon (now). Very common in fast speech and texts.', 0],
  ['Nya na lang', 'Later, then', 'Nya = unya (later / then). "Na lang" softens it.', 0],
  ['Kanang… unsa gani to?', 'Um… what was that again?', "Kanang and kuan are fillers, like \"um\" or \"like\". A study of Cebu radio talk found fillers were the most common particles. Gani = \"again / that's right\".", 0],
  ['Kuan, ugma na lang ta', "Um, let's just do it tomorrow", 'Kuan = "um / whatchamacallit". It tells you the speaker is thinking, not saying a new word.', 0],
  ['Kaon na ta', "Let's eat now", 'Na = already / now. It moves the action into the present.', 1],
  ['Wala pa ko kakaon', "I haven't eaten yet", 'Pa = still / yet. Wala pa = not yet.', 1],
  ['Gamay ra', 'Just a little', 'Ra = only / just, often for small amounts or how easy something is (kadiyot ra = just a moment).', 1],
  ['Sige lang', "It's fine, go ahead", 'Lang = just. Softens a request or reassures.', 1],
  ['Okay ra man ko', "I'm fine, really", 'Man softens a statement or gives a reason, like "anyway" or "after all". Often left untranslated.', 1],
  ['Lami gyud!', 'Really delicious!', 'Gyud (also jud) = really / truly. Adds emphasis.', 1],
  ['Ikaw diay!', "Oh, it's you!", 'Diay = "oh, so it turns out". Marks surprise or something you just learned.', 1],
  ['Tinuod ba?', 'Is it true?', 'Ba turns a sentence into a yes/no question.', 1],
  ['Init baya', "It's hot, you know", 'Baya = "mind you / you know". Warns or reminds.', 1],
  ['Mao lagi!', "Exactly! That's what I said!", 'Lagi = indeed / of course. Strong agreement.', 1],
  ['Asa kaha siya?', 'I wonder where he is', 'Kaha = "I wonder / maybe". Makes a question softer or open.', 1],
  ['Ako sad', 'Me too', 'Sad (also pud, sab) = also / too.', 1],
  ['Unta dili moulan', "Hopefully it won't rain", 'Unta = hopefully / I wish.', 1],
  ['Mao bitaw', "That's right", 'Bitaw = right / true. Agrees with what was just said.', 1],
  ['Mokaon ko', 'I will eat', 'mo- = will (future or intention). The doer is the focus.', 2],
  ['Nikaon ko', 'I ate', 'ni- (also mi-) = did, completed. Same root: swap mo- for ni-.', 2],
  ['Nagkaon ko', 'I am eating / I was eating', 'nag- (also naga-) = ongoing action.', 2],
  ['Gikaon nako ang mangga', 'I ate the mango', 'gi- = completed, with the thing as the focus. Note nako (by me) instead of ko.', 2],
  ['Kan-on nako ang mangga', 'I will eat the mango', '-on = future, with the thing as the focus. kaon + -on = kan-on.', 2],
  ['Moadto ko sa merkado', 'I will go to the market', 'mo- + adto. "Asa ka moadto?" uses the same form.', 2],
  ['Niadto ko sa merkado gahapon', 'I went to the market yesterday', 'ni- + adto = niadto.', 2],
  ['Magluto ko karong gabii', "I'll cook tonight", 'mag- = will, often for planned or longer activities.', 2],
  ['Nagluto si Mama', 'Mom is cooking', 'nag- = ongoing. "Nagluto si Mama ganina" = Mom was cooking earlier.', 2],
  ['Ayaw kabalaka', "Don't worry", 'Ayaw + verb = "don\'t…". Kabalaka comes from balaka (worry).', 2]
];
const GRAM_UNITS = [
  { ceb: 'Paspas nga sulti', name: 'Fast-speech shortcuts', ids: [] },
  { ceb: 'Mga partikulo', name: 'Little words: na, pa, gyud, diay…', ids: [] },
  { ceb: 'Berbo', name: 'Verb tenses: mo-, ni-, nag-, gi-', ids: [] }
];
G.forEach((g, i) => GRAM_UNITS[g[3]].ids.push('g' + i));
const GRAM_ORDER = GRAM_UNITS.flatMap(u => u.ids);

/* deck content, filled from the content pack */
let P = [], W = [], UNITS = [], IDX = {}, PHRASE_ORDER = [], WORD_UNITS = [];
const UNIT_OF = {};
G.forEach((g, i) => UNIT_OF['g' + i] = 'g' + g[3]); F.forEach((f, i) => UNIT_OF['f' + i] = 'f' + f.u);
const M_UNITS = MEGA_UNITS.map(([name, idx]) => ({ ceb: name, name: idx.length + ' cards', ids: idx.map(i => 'm' + i) }));
const M_ORDER = M_UNITS.flatMap(u => u.ids); M_UNITS.forEach((u, i) => u.ids.forEach(id => UNIT_OF[id] = 'm' + i));
const D_ORDER = DIALOGS.flatMap((d, i) => d.lines.map((_, j) => 'd' + i + '_' + j)); D_ORDER.forEach(id => UNIT_OF[id] = 'd' + id.slice(1).split('_')[0]);
const SPR = { p: null, w: null };
let PACK_HV = 0;
function setPack(h, pbuf, wbuf) {
  P = h.P; W = h.W; UNITS = h.UNITS; IDX = h.IDX; SPR.p = pbuf; SPR.w = wbuf; PACK_HV = h.v || 1; NATIVE_FOR = null; CARD_MEMO.clear(); GLOSS_MEMO.clear(); TOK_MEMO.clear(); TWINS = null; VOCAB_WORDS = null;
  if (typeof urls !== 'undefined') Object.keys(urls).forEach(k => { try { URL.revokeObjectURL(urls[k]); } catch (e) { } delete urls[k]; });
  PHRASE_ORDER = UNITS.flatMap(u => u.ids);
  try { buildPath(); } catch (e) { }
  UNITS.forEach((u, i) => u.ids.forEach(id => UNIT_OF[id] = 'u' + i));
  WORD_UNITS = [];
  for (let i = 0; i < W.length; i += 25) {
    const ids = []; for (let j = i; j < Math.min(i + 25, W.length); j++) ids.push('w' + j);
    WORD_UNITS.push({ ceb: 'Pulong ' + (i / 25 + 1), name: 'Words ' + (i + 1) + '–' + Math.min(i + 25, W.length), ids });
    ids.forEach(id => UNIT_OF[id] = 'k' + i);
  }
}
const hasPack = () => P.length > 0;

/* ---------- icons ---------- */
const I = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  slow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16h14a4 4 0 0 0 4-4v0a3 3 0 0 0-3-3h-1"/><path d="M5 16a6 6 0 0 1 12 0"/><circle cx="19" cy="9" r=".5" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.8 2-4.6 0 1.8 1 3 2 3 0-3.4 1-6.4 1-8.4z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'
};

/* ---------- utils ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// DAY_SHIFT: days the learner chose to jump ahead ("Start the next day" after finishing everything)
let DAY_SHIFT = 0;
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5) + DAY_SHIFT;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => el.hidden = true, 3000); }
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
const norm = s => s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[’‘`]/g, "'").replace(/[.,!?¿¡"“”…]/g, ' ').replace(/\bug\b/g, 'og').replace(/\s+/g, ' ').trim();
const alts = ceb => String(ceb).replace(/\s*\([^)]*\)/g, '').split(/\s*\/\s*/).map(norm).filter(Boolean);   // notes in brackets come off first: a slash inside them isn't a second answer
// the first way of saying it: notes in brackets come off first (a slash inside them isn't a second option), then the first of any options split by / or ·
const firstAlt = ceb => String(ceb).replace(/\s*\([^)]*\)/g, '').split(/\s*[\/·]\s*/)[0].trim();
/* ---------- "sounds like": an English-friendly respelling, split into syllables ----------
   Bisaya is spelled the way it sounds, so this is built from the spelling. The stressed syllable is in capitals where known. */
const PH_V = { a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo' };
const PH_DI = { ay: 'ai', aw: 'ow', oy: 'oy', uy: 'ooy', iw: 'ew', ey: 'ay', ew: 'ew' };
function phonWord(w) {
  w = w.toLowerCase().replace(/[^a-zñ'-]/g, ''); if (!w) return '';
  // letters into units: 'ng' is one sound
  const u = []; for (let i = 0; i < w.length; i++) { if (w[i] === 'n' && w[i + 1] === 'g') { u.push('ng'); i++; } else u.push(w[i]); }
  const isV = x => 'aeiou'.includes(x);
  const syl = []; let cur = '';
  for (let i = 0; i < u.length; i++) {
    const x = u[i];
    if (x === '-' || x === "'") { if (cur) syl.push(cur); cur = ''; continue; }
    if (isV(x)) {
      if (/[aeiou]/.test(cur)) { syl.push(cur); cur = ''; } // two vowels in a row: new syllable (a small catch in the throat)
      cur += x;
      // y / w right after a vowel, not followed by a vowel: glide closes the syllable
      if ((u[i + 1] === 'y' || u[i + 1] === 'w') && !isV(u[i + 2] || '')) { cur += u[i + 1]; i++; }
    } else {
      // a consonant goes with the next vowel; if two consonants meet, the first closes this syllable
      if (/[aeiou]/.test(cur) && isV(u[i + 1] || '')) { syl.push(cur); cur = x; }
      else if (/[aeiou]/.test(cur) && !isV(u[i + 1] || '') && u[i + 1] && u[i + 1] !== '-' && u[i + 1] !== "'") { cur += x; syl.push(cur); cur = ''; }
      else cur += x;
    }
  }
  if (cur) { if (!/[aeiou]/.test(cur) && syl.length) syl[syl.length - 1] += cur; else syl.push(cur); }
  const conv = t => t.replace(/[aeiou]/g, v => PH_V[v]);
  return syl.map(s => { const m = s.match(/^(.*?)(ay|aw|oy|uy|iw|ey|ew)([^aeiou]*)$/); return m ? conv(m[1]) + PH_DI[m[2]] + m[3] : conv(s); }).join('·');
}
// the stressed syllable in capitals, when we know it and the syllables line up
let STRESS = null;
function stressWord(w, ph) {
  if (!STRESS) { STRESS = new Map(); if (typeof STRESS_RAW === 'string') STRESS_RAW.split('|').forEach(e => { const [k, i, n] = e.split(':'); STRESS.set(k, [+i, +n]); }); }
  const st = STRESS.get(w.toLowerCase().replace(/[^a-zñ'-]/g, '')); if (!st || !ph) return ph;
  const sy = ph.split('·'); if (sy.length !== st[1] || sy.length < 2) return ph;
  sy[st[0]] = sy[st[0]].toUpperCase(); return sy.join('·');
}
const phon = s => firstAlt(String(s)).split(/\s+/).map(w => stressWord(w, phonWord(w))).filter(Boolean).join('  ');
const phonHtml = (s, label = true) => `<div class="phon" title="CAPITALS = say that part stronger">${label ? '<span>sounds like</span> ' : ''}${esc(phon(s))}</div>`;

const tokens = ceb => firstAlt(ceb).split(/\s+/).map(t => t.replace(/[.,!?…]/g, '')).filter(Boolean);
function b64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }

/* ---------- IndexedDB for the content pack ---------- */
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('padayon', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbGet(k) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('kv').objectStore('kv').get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); }
async function idbSet(k, v) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }
function parsePack(buf) {
  const dv = new DataView(buf);
  if (String.fromCharCode(...new Uint8Array(buf, 0, 4)) !== 'PDYN') throw new Error('That file is not a Padayon content pack.');
  const hl = dv.getUint32(4, true);
  const h = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, hl)));
  const start = 8 + hl;
  return { h, p: buf.slice(start, start + h.plen), w: buf.slice(start + h.plen, start + h.plen + h.wlen) };
}
async function loadStoredPack() { try { const buf = await idbGet('pack'); if (buf) { const x = parsePack(buf); setPack(x.h, x.p, x.w); return true; } } catch (e) { } return false; }
let packState = 'idle', packPct = 0;
async function autoPack() {
  packState = 'loading'; if (view === 'home') render();
  try {
    const r = await fetch('pack.bin', { cache: 'no-store' }); if (!r.ok) throw new Error(r.status);
    const total = +r.headers.get('content-length') || 9770000; const reader = r.body.getReader(); const parts = []; let got = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; const p = Math.min(99, Math.round(got / total * 100)); if (p !== packPct) { packPct = p; const el = $('#packpct'); if (el) el.textContent = p + '%'; } }
    const buf = new Uint8Array(got); let o = 0; parts.forEach(x => { buf.set(x, o); o += x.length; });
    const x = parsePack(buf.buffer); await idbSet('pack', buf.buffer); setPack(x.h, x.p, x.w); packState = 'done';
  } catch (e) { packState = 'error'; }
  if (view === 'home') render();
}
function importPack() {
  const fi = $('#filein'); fi.accept = '.bin,application/octet-stream'; fi.value = '';
  fi.onchange = async () => {
    const f = fi.files[0]; if (!f) return;
    try { const buf = await f.arrayBuffer(); const x = parsePack(buf); await idbSet('pack', buf); setPack(x.h, x.p, x.w); toast(`Loaded ${P.length} phrases and ${W.length} words`); render(); }
    catch (e) { toast(e.message || 'Could not read that file.'); }
  };
  fi.click();
}

/* ---------- state ---------- */
const LS = 'padayon-app-v1';
function fresh() { return { v: 1, planResetV: 2, updated: 0, cards: {}, xp: {}, streak: { last: 0, count: 0, best: 0 }, speed: 1.0, bestSpeed: 1.0, settings: { newPerDay: 8, newP: 4, newW: 4, newG: 2, newF: 3, newD: 2, newM: 3, learner: 'all', goal: 60 }, focus: null, custom: [], plan: {}, newDay: { d: 0, n: 0 }, nextC: 1, mistakes: {}, tips: {} }; }
function migrate(s) { const f = fresh(); s = Object.assign(f, s || {}); s.settings = Object.assign(fresh().settings, s.settings || {}); s.streak = Object.assign(fresh().streak, s.streak || {}); s.mistakes = s.mistakes || {}; s.rules = s.rules || {}; s.tips = s.tips || {}; if (s.planResetV !== 2) { s.planResetV = 2; s.plan = {}; }
  if (!s.started) { const days = Object.keys(s.xp || {}).map(Number).filter(Boolean); s.started = days.length ? Math.min(...days) : (s.streak && s.streak.last) || 0; }
  if (!s.settings.pathV) { s.settings.pathV = 1; s.settings.newPerDay = 8; }
  if (s.settings.learner !== 'all') { s.settings.learner = 'all'; s.settings.newF = Math.max(3, s.settings.newF || 0); } return s; }
let S = (() => { try { const r = JSON.parse(localStorage.getItem(LS)); if (r && r.v === 1) return migrate(r); } catch (e) { } return fresh(); })();
DAY_SHIFT = S.dayShift || 0;
function fixFuture(st) { const rt = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); if (st.streak.last > rt) { const over = st.streak.last - rt; st.streak.count = Math.max(1, st.streak.count - over); st.streak.last = rt; st.streak.best = Math.max(st.streak.count, (st.streak.best || 0) - over); } if ((st.announced || 0) > rt) st.announced = rt; }
fixFuture(S);
/* Streak reset: bump STREAK_RESET to start everyone's streak over at 1 (current and best). Carried through sync so an
   older device can't bring the old streak back, and the leaderboard shows 1 for anyone who hasn't opened the app since. */
const STREAK_RESET = 4;
/* Full leaderboard reset on Nov 2, 2026 (day 20759): streaks start that day. Finishing that day's session makes it 1.
   The game bests, accuracy, most-in-a-day and speed records start over too. Words learned is real progress and stays. */
const STREAK_BASE = 20759;
// people who finished on reset day before their phone got the update: already announced by hand, shown as 1 until their app reports in
const DONE_ON_RESET = { NB6NEkBWqkQ0mfggPTAot5fPbJ43: 20759 };
// lessons whose announcement was posted by hand (the app had missed it): the device marks it as sent, so no double post
const ANNOUNCED_BY_HAND = { TwqMaj3HTVfYKQunUpY0neBuNHh1: 20759 };
function resetStreak(st) {
  if ((st.streakReset || 0) >= STREAK_RESET) return;
  const rt = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5), done = !!(st.plan && Object.keys(st.plan).some(k => +k >= rt && st.plan[k].session));
  st.streak = done ? { count: 1, last: rt, best: 1 } : { count: 0, last: 0, best: 0 };
  st.rushBest = 0; st.rushHow = 'pick'; st.geoBest = {}; st.geoHow = {}; st.bestSpeed = 1;
  // today's answers and new words are kept. They're filed under the app's day, which runs ahead of the calendar for
  // anyone who started the next day early, so "today" is the real day plus that shift.
  const td = rt + (st.dayShift || 0);
  st.newMax = st.newDay && st.newDay.d >= td ? st.newDay.n || 0 : 0;
  st.acc = Object.fromEntries(Object.entries(st.acc || {}).filter(([k]) => +k >= td));
  st.freezeWk = 0; st.freezeDay = 0;
  // anyone who already finished today gets announced again with the new count
  // (who was already announced by hand is handled later in pushBoard, once sign-in is known)
  if (done) { st.announced = 0; st.reannounce = 1; }
  st.streakReset = STREAK_RESET;
}
resetStreak(S);
/* Streaks started on the reset day, so no streak can be longer than the days since then (finishing the reset day = 1).
   An older copy of the app on another device can't push a bigger number back: anything impossible gets trimmed here,
   on every load and every sync. */
function capStreak(st) {
  if (!st || !st.streak) return st; const s = st.streak, rt = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
  const maxNow = Math.max(0, (s.last || 0) - STREAK_BASE + 1);
  // today's plan is keyed by the real day plus any "start the next day early" shift; an older shifted plan
  // still sitting in the list was finished on an earlier day and must not count for today
  const doneToday = !!((st.plan && st.plan[rt + (st.dayShift || 0)] && st.plan[rt + (st.dayShift || 0)].session) || (st.credit && st.credit[rt]) || st.announced === rt);
  if (s.count > maxNow) s.count = maxNow;
  // on the reset day itself a streak of 1 means today's session is done
  if (s.last === rt && rt === STREAK_BASE && !doneToday) { s.count = 0; s.last = 0; }
  const maxEver = Math.max(0, rt - STREAK_BASE + (doneToday ? 1 : 0));
  if (doneToday && (s.last || 0) < rt) { s.count = s.last === rt - 1 ? (s.count || 0) + 1 : 1; s.last = rt; }
  s.best = Math.max(s.count, Math.min(s.best || 0, maxEver)); return st;
}
capStreak(S);
function fixNewMax(st) { if ((st.streakReset || 0) < STREAK_RESET) return; let m = st.newMax || 0; if (st.newReal && st.newReal.d >= STREAK_BASE) m = Math.max(m, st.newReal.n || 0); if (st.newDay && st.newDay.d >= STREAK_BASE + (st.dayShift || 0)) m = Math.max(m, st.newDay.n || 0); st.newMax = m; }
fixNewMax(S);
function localSave() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { } }
// Start over: words, rules, streak, XP and stats go back to zero on every device. Your name and settings stay.
function wipeProgress() {
  const now = Date.now(), keep = { settings: S.settings, guideV: S.guideV, dayShift: S.dayShift, redoDone: S.redoDone };
  S = migrate(Object.assign(fresh(), keep, { wipedAt: now, streakReset: now, started: today() }));
  S.settings = Object.assign(S.settings, keep.settings, { pathV: keep.settings.pathV || 1 });
  clearResume(); MIX_MEMO.clear(); save();
}
function save() { S.updated = Date.now(); DAY_SHIFT = S.dayShift || 0; localSave(); schedulePush(); if (typeof pushBoard === 'function') pushBoard(); }

/* ---------- sync across devices (Firebase: Google sign-in + one Firestore doc per person) ---------- */
const FB_CFG = { apiKey: 'AIzaSyAMedDtDrSRJbULhA5Kwz30ZyYwPKj0rc4', authDomain: 'padayon-sync.firebaseapp.com', projectId: 'padayon-sync', storageBucket: 'padayon-sync.firebasestorage.app', messagingSenderId: '1192476989', appId: '1:1192476989:web:257d2aaafd933e6ab38554' };
const Sync = { user: null, state: 'off', last: 0, timer: null, unsub: null, err: '' };
const userDoc = () => firebase.firestore().collection('users').doc(Sync.user.uid);
function mergeState(a, b) {
  a = migrate(JSON.parse(JSON.stringify(a))); b = migrate(JSON.parse(JSON.stringify(b)));
  // "Reset all my progress" (or loading a backup) on any device replaces everything from before it, on every device
  if ((a.wipedAt || 0) !== (b.wipedAt || 0)) return (a.wipedAt || 0) > (b.wipedAt || 0) ? a : b;
  // gap words: keep a's ids; give b's entries a's id when the English matches, or a fresh id when only the id collides
  const aByEn = {}, aIds = new Set(); a.custom.forEach(c => { aByEn[norm(c.en)] = c.id; aIds.add(c.id); });
  let maxC = Math.max(0, ...a.custom.concat(b.custom).map(c => +c.id.slice(1) || 0));
  const bCustom = [], bCards = {};
  Object.keys(b.cards).forEach(id => { if (id[0] !== 'c') bCards[id] = b.cards[id]; });
  b.custom.forEach(c => {
    const same = aByEn[norm(c.en)];
    const nid = same || (aIds.has(c.id) ? 'c' + (++maxC) : c.id);
    if (!same) { bCustom.push(Object.assign({}, c, { id: nid })); aIds.add(nid); aByEn[norm(c.en)] = nid; }
    if (b.cards[c.id]) bCards[nid] = b.cards[c.id];
  });
  b.cards = bCards;
  const newer = (b.updated || 0) > (a.updated || 0) ? b : a, out = migrate(JSON.parse(JSON.stringify(newer)));
  out.custom = a.custom.concat(bCustom); out.nextC = Math.max(a.nextC, b.nextC, maxC + 1);
  out.cards = {};
  new Set(Object.keys(a.cards).concat(Object.keys(b.cards))).forEach(id => {
    const x = a.cards[id], y = b.cards[id];
    out.cards[id] = !x ? y : !y ? x : ((y.r + y.w) > (x.r + x.w) || ((y.r + y.w) === (x.r + x.w) && y.d > x.d)) ? y : x;
  });
  out.xp = {}; new Set(Object.keys(a.xp).concat(Object.keys(b.xp))).forEach(d => out.xp[d] = Math.max(a.xp[d] || 0, b.xp[d] || 0));
  if ((a.streakReset || 0) !== (b.streakReset || 0)) { const w = (a.streakReset || 0) > (b.streakReset || 0) ? a : b; out.streakReset = w.streakReset; out.streak = { ...w.streak }; }
  else { const sa = a.streak, sb = b.streak; out.streak = (sb.last > sa.last || (sb.last === sa.last && sb.count > sa.count)) ? { ...sb } : { ...sa }; out.streak.best = Math.max(sa.best, sb.best); }
  out.bestSpeed = Math.max(a.bestSpeed, b.bestSpeed);
  out.plan = {}; [a.plan, b.plan].forEach(p => Object.keys(p).forEach(d => { out.plan[d] = Object.assign(out.plan[d] || {}, p[d]); Object.keys(p[d]).forEach(k => { if (p[d][k]) out.plan[d][k] = p[d][k]; }); }));
  const t = today(), ds = Math.max(a.dayShift || 0, b.dayShift || 0), keepDays = new Set([t, calDay() + ds]); Object.keys(out.plan).forEach(d => { if (!keepDays.has(+d)) delete out.plan[d]; });
  // same day: keep the higher count and the day's new-word limit, so a sync doesn't re-decide it halfway through the day
  out.newDay = a.newDay.d === b.newDay.d ? Object.assign({}, b.newDay, a.newDay, { n: Math.max(a.newDay.n, b.newDay.n) }) : (a.newDay.d > b.newDay.d ? a.newDay : b.newDay);
  out.mistakes = {}; new Set(Object.keys(a.mistakes).concat(Object.keys(b.mistakes))).forEach(k => { const x = a.mistakes[k], y = b.mistakes[k]; out.mistakes[k] = !x ? y : !y ? x : { n: Math.max(x.n, y.n), fix: (newer === b ? y.fix : x.fix) || x.fix || y.fix, last: Math.max(x.last || 0, y.last || 0) }; });
  out.tips = Object.assign({}, a.tips, b.tips);
  out.hist = {}; [a.hist || {}, b.hist || {}].forEach(h => Object.keys(h).forEach(d => { const o = out.hist[d], v = h[d]; if (!o || v.w > o.w) out.hist[d] = v; }));
  out.announced = Math.max(a.announced || 0, b.announced || 0);
  out.credit = Object.assign({}, a.credit || {}, b.credit || {}); out.sessAt = Math.max(a.sessAt || 0, b.sessAt || 0);
  out.redoAt = Math.max(a.redoAt || 0, b.redoAt || 0); out.redoDone = Object.assign({}, a.redoDone || {}, b.redoDone || {});
  out.dayShift = Math.max(a.dayShift || 0, b.dayShift || 0);
  out.convoDone = {}; [a.convoDone || {}, b.convoDone || {}].forEach(x => Object.keys(x).forEach(k => out.convoDone[k] = Math.max(out.convoDone[k] || 0, x[k])));
  out.started = Math.min(...[a.started, b.started].filter(Boolean).concat([out.started || Infinity])) || 0; if (!isFinite(out.started)) out.started = 0;
  out.rules = Object.assign({}, b.rules || {}, a.rules || {}); out.ruleDay = Math.max(a.ruleDay || 0, b.ruleDay || 0); out.ruleCnt = (a.ruleDay || 0) === (b.ruleDay || 0) ? Math.max(a.ruleCnt || 1, b.ruleCnt || 1) : ((a.ruleDay || 0) > (b.ruleDay || 0) ? a.ruleCnt : b.ruleCnt);
  out.acc = Object.assign({}, b.acc || {}, a.acc || {}); [a.acc || {}, b.acc || {}].forEach(x => Object.keys(x).forEach(k => { const o = out.acc[k], v = x[k]; if (!o || v.t > o.t) out.acc[k] = v; }));
  { const r = bestWith(a.rushBest || 0, a.rushHow, b.rushBest || 0, b.rushHow || 'pick'); out.rushBest = r.best; out.rushHow = r.how; } out.newMax = Math.max(a.newMax || 0, b.newMax || 0);
  { const ga = a.geoBest || {}, gb = b.geoBest || {}, ha = a.geoHow || {}, hb = b.geoHow || {}; out.geoBest = {}; out.geoHow = {};
    ['prov', 'lang'].forEach(k => { const r = bestWith(ga[k] || 0, ha[k], gb[k] || 0, hb[k] || 'pick'); out.geoBest[k] = r.best; out.geoHow[k] = r.how; }); }
  if ((a.streakReset || 0) !== (b.streakReset || 0)) { const w = (a.streakReset || 0) > (b.streakReset || 0) ? a : b;
    ['rushBest', 'rushHow', 'geoBest', 'geoHow', 'newMax', 'bestSpeed', 'acc', 'freezeWk', 'freezeDay'].forEach(k => out[k] = w[k]); out.announced = w.announced || 0; out.reannounce = w.reannounce || 0;
    // the copy from before the reset may hold answers and new words from the reset day itself (a lesson finished on
    // another phone before it updated): those count, so they aren't thrown away with the old records
    const l = w === a ? b : a, from = STREAK_BASE + (l.dayShift || 0); out.acc = Object.assign({}, out.acc || {});
    Object.entries(l.acc || {}).forEach(([k, v]) => { if (+k >= from && (!out.acc[k] || v.t > out.acc[k].t)) out.acc[k] = v; });
    if (l.newDay && l.newDay.d >= from) out.newMax = Math.max(out.newMax || 0, l.newDay.n || 0);
    if (l.newReal && l.newReal.d >= STREAK_BASE) out.newMax = Math.max(out.newMax || 0, l.newReal.n || 0); }
  // another device finished today's session: count it
  { const td = calDay() + (out.dayShift || 0); if (out.plan[td] && out.plan[td].session && (out.streakReset || 0) >= STREAK_RESET && out.streak.last < calDay()) { const c = calDay(); out.streak.count = out.streak.last === c - 1 ? out.streak.count + 1 : 1; out.streak.last = c; out.streak.best = Math.max(out.streak.best || 0, out.streak.count); } }
  if ((a.streakReset || 0) === (b.streakReset || 0)) { out.freezeWk = Math.max(a.freezeWk || 0, b.freezeWk || 0); out.freezeDay = Math.max(a.freezeDay || 0, b.freezeDay || 0); }
  out.pod = (a.pod && b.pod) ? (a.pod.d >= b.pod.d ? a.pod : b.pod) : (a.pod || b.pod);
  out.flags = Object.assign({}, b.flags || {}, a.flags || {}); out.storyDone = Object.assign({}, b.storyDone || {}, a.storyDone || {}); out.placed = Math.max(a.placed || 0, b.placed || 0);
  out.realDone = {}; [a.realDone || {}, b.realDone || {}].forEach(x => Object.keys(x).forEach(k => out.realDone[k] = Math.max(out.realDone[k] || 0, x[k])));
  // a day that was opened again: a finished session from before the do-over doesn't count, and new words start fresh
  if (out.redoAt && (out.sessAt || 0) < out.redoAt) { const td = calDay() + (out.dayShift || 0); if (out.plan[td]) delete out.plan[td].session; }
  if (out.redoAt) { const nd = [a.newDay, b.newDay].find(x => x && x.redo === out.redoAt); if (nd && nd.d === out.newDay.d) out.newDay = Object.assign({}, nd, { n: Math.max(nd.n, (out.newDay.redo === out.redoAt ? out.newDay.n : 0)) }); }
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  capStreak(out); fixNewMax(out);
  return out;
}
function schedulePush() { if (!Sync.user) return; clearTimeout(Sync.timer); Sync.timer = setTimeout(pushNow, 2000); }
async function pushNow() {
  if (!Sync.user) return;
  try { await userDoc().set({ s: JSON.stringify(S), updated: S.updated || Date.now() }, { merge: true }); /* merge keeps Word Hoard and chess progress in the same doc */ Sync.state = 'on'; Sync.last = Date.now(); Sync.err = ''; }
  catch (e) { Sync.state = 'error'; Sync.err = e.message || String(e); }
  refreshSyncUI();
}
function applyRemote(json) {
  let remote; try { remote = JSON.parse(json); } catch (e) { return; }
  const merged = mergeState(S, remote), changed = JSON.stringify(merged) !== JSON.stringify(S);
  fixFuture(merged); resetStreak(merged); const changed2 = JSON.stringify(merged) !== JSON.stringify(S);
  if (changed || changed2) { S = merged; DAY_SHIFT = S.dayShift || 0; localSave(); if (view === 'home' || view === 'settings') render(); }
  if (JSON.stringify(merged) !== json) schedulePush();
}
function initSync() {
  if (!window.firebase || !firebase.initializeApp) return;
  try { firebase.initializeApp(FB_CFG); } catch (e) { return; }
  firebase.auth().getRedirectResult().catch(e => { Sync.err = e.message; });
  firebase.auth().onAuthStateChanged(async u => {
    if (Sync.unsub) { Sync.unsub(); Sync.unsub = null; }
    Sync.user = u;
    if (!u) { Sync.state = 'off'; refreshSyncUI(); return; }
    Sync.state = 'syncing'; refreshSyncUI();
    try {
      const snap = await userDoc().get();
      if (snap.exists) applyRemote(snap.data().s); else await pushNow();
      Sync.state = 'on'; Sync.last = Date.now();
      try { pushBoard(); } catch (e) { } // refresh the scoreboard row and post any missed lesson announcement
      Sync.unsub = userDoc().onSnapshot(sn => { if (!sn.exists || sn.metadata.hasPendingWrites) return; applyRemote(sn.data().s); Sync.last = Date.now(); refreshSyncUI(); });
    } catch (e) { Sync.state = 'error'; Sync.err = e.message || String(e); }
    refreshSyncUI();
  });
}
async function signIn() {
  if (!window.firebase || !firebase.auth) return toast('Sync could not load. Check your connection and reopen the app.');
  const prov = new firebase.auth.GoogleAuthProvider(); prov.setCustomParameters({ prompt: 'select_account' });
  try { await firebase.auth().signInWithPopup(prov); }
  catch (e) {
    if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) { try { await firebase.auth().signInWithRedirect(prov); } catch (e2) { toast(e2.message); } }
    else if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') toast('Sign-in failed: ' + (e.message || e.code));
  }
}
async function signOutSync() { clearResume(); clearTimeout(Sync.timer); if (Sync.user) await pushNow(); await firebase.auth().signOut(); toast('Signed out. Progress stays on this device.'); }
function syncLine() {
  if (!window.firebase) return 'Sync is unavailable right now (offline?).';
  if (!Sync.user) return 'Not signed in. Progress is saved on this device only.';
  const who = esc(Sync.user.email || Sync.user.displayName || 'your Google account');
  if (Sync.state === 'syncing') return `Signed in as ${who}. Syncing…`;
  if (Sync.state === 'error') return `Signed in as ${who}. Last sync failed: ${esc(Sync.err)}`;
  return `Signed in as ${who}. Progress syncs automatically.`;
}
function refreshSyncUI() { document.querySelectorAll('.syncline').forEach(el => el.innerHTML = syncLine()); document.querySelectorAll('.syncbtn').forEach(el => { el.textContent = Sync.user ? 'Sign out' : 'Sign in with Google'; }); const b = $('#syncbanner'); if (b) b.hidden = !!Sync.user || !window.firebase; }
function addXP(n) { const t = today(); S.xp[t] = (S.xp[t] || 0) + n; if (!S.started || S.started > t) S.started = t; }
// streaks and Discord posts count real calendar days only, so starting the next day early doesn't add to either
const calDay = () => today() - DAY_SHIFT;
/* Streak freeze: miss one day and the streak survives, once a week (Monday to Sunday). It's used automatically. */
const wkOf = t => { const dow = (t + 4) % 7; return t - ((dow + 6) % 7); };
const freezeOk = t => (S.freezeWk || 0) !== wkOf(t - 1);
function bumpStreak() {
  const t = calDay(); const s = S.streak; if (s.last === t) return;
  if (s.last === t - 1) s.count++;
  else if (s.last === t - 2 && s.count > 0 && freezeOk(t)) { s.count++; S.freezeWk = wkOf(t - 1); S.freezeDay = t - 1; setTimeout(() => toast('🧊 Streak freeze! Binko covered the day you missed. Next one is ready next week.'), 600); }
  else s.count = 1;
  s.last = t; s.best = Math.max(s.best, s.count);
}
function streakNow() { const s = S.streak, t = calDay(); return (s.last === t || s.last === t - 1 || (s.last === t - 2 && freezeOk(t))) ? s.count : 0; }
// the streak is only alive because a freeze is waiting: finish today to use it
const freezePending = () => { const s = S.streak, t = calDay(); return s.last === t - 2 && s.count > 0 && freezeOk(t); };
function planDay() { const t = today(); if (!S.plan[t]) S.plan = { [t]: {} }; return S.plan[t]; }
/* Today's plan is every activity, in order. The hero ring fills as they tick, and finishing one offers the next. */
const WIDE = window.matchMedia ? matchMedia('(min-width:960px)') : { matches: true };
try { WIDE.addEventListener('change', () => { if (view === 'home') render(); }); } catch (e) { }
function planItems() {
  return [
    { k: 'session', name: 'Daily session', d: 'Reviews, new words, and building blocks.', run: () => startSession() },
    pickDialog() || planDay().convo ? { k: 'convo', name: "Today's conversation", d: 'New words first, then read it and say your part out loud.', run: () => go('convos') } : (() => { const n = nextConvo(); return { k: 'convo', locked: true, name: "Today's conversation", d: `Locked for now, so it counts as done. "${n.d.title}" opens after you learn ${n.left.length} more word${n.left.length === 1 ? '' : 's'} in your daily sessions.` }; })(),
    buildLock() ? { k: 'build', locked: true, name: 'Build sentences', d: 'Locked for now, so it counts as done. ' + buildLock() } : { k: 'build', name: 'Build sentences', d: buildDesc(), run: () => startBuild() },
    realLockItem(),
    { k: 'speed', name: 'Speed round', d: 'Fast listening that speeds up as you get it right.', run: () => go('speed') },
    { k: 'dict', name: 'Dictation', d: 'Type what you hear, every little word.', run: () => startDictation() },
    { k: 'shadow', name: 'Shadowing', d: 'Speak along with one unit. Hands-free.', run: () => go('shadow') },
    { k: 'talk', name: 'Talk out loud', d: 'A call or chat with family in Bisaya. Tick it when done.', manual: true }
  ].filter(Boolean).map(lockDrill);
}
const lockDrill = it => { if (!it || !DRILL_MIN[it.k]) return it; const L = drillLock(it.k); return L && !planDay()[it.k] ? Object.assign({}, it, { locked: true, d: `Locked for now, so it counts as done. Opens after you learn ${L.need} more ${L.what}${L.need === 1 ? '' : 's'} with a recording.` }) : it; };
const planNext = () => { const p = planDay(); return planItems().find(i => !p[i.k] && !i.locked) || null; };
const isDone = (it, p) => !!(p[it.k] || it.locked);
let sessHere = 0; // the day this device finished the session (it posts right away; others wait so they don't double post)
function tick(k) { const p = planDay(); if (!p[k]) { p[k] = true; if (k === 'session') { S.sessAt = Date.now(); sessHere = calDay(); bumpStreak(); announceLesson(); } save(); } }
/* ---------- Discord: Binko posts in #🔥streaks when someone finishes the daily lesson ----------
   The webhook link lives in Firestore (config/discord, field "webhook"), readable only by signed-in users,
   so it never sits in this public code. */
const capName = s => { s = String(s || '').trim(); return s ? s[0].toUpperCase() + s.slice(1) : s; };
// names fixed by account, so they stay the same everywhere no matter what the Google account or name setting says
const NAME_BY_UID = { NB6NEkBWqkQ0mfggPTAot5fPbJ43: 'Mykha' };
// a do-over of one day's lesson, asked for by that person (by account id prefix): the day's session opens again with
// today's new-word rules. The streak and the Discord post for that day stay as they are.
const REDO_DAY_BY_UID = { '3YRz8p': 20761 };
function redoCheck() {
  if (!Sync.user) return; const k = Object.keys(REDO_DAY_BY_UID).find(p => Sync.user.uid.startsWith(p)); if (!k) return;
  const d = REDO_DAY_BY_UID[k]; if (calDay() !== d || (S.redoDone || {})[d]) return;
  S.redoDone = Object.assign({}, S.redoDone || {}, { [d]: 1 }); S.redoAt = Date.now();
  const p = planDay(); delete p.session; clearResume(); S.newDay = { d: today(), n: 0, redo: S.redoAt };
  save(); if (view === 'home') render(); toast('Your lesson for today is open again. Padayon!');
}
const displayName = () => (typeof Sync !== 'undefined' && Sync.user && NAME_BY_UID[Sync.user.uid]) || capName((S.settings.name || (Sync.user && Sync.user.displayName) || '').trim().split(/\s+/)[0]) || 'Someone';
const rowName = r => NAME_BY_UID[r.uid] || capName(r.name) || 'Someone';
let hookCache = null;
async function discordHook() {
  if (hookCache !== null) return hookCache;
  if (!Sync.user || !window.firebase) return '';
  try { const d = await firebase.firestore().collection('config').doc('discord').get(); hookCache = (d.exists && d.data().webhook) || ''; } catch (e) { return ''; }
  return hookCache;
}
// app update notes go to #padayon-app, never the streaks channel: its own webhook, field "updates" in the same doc
async function updatesHook() {
  if (!Sync.user || !window.firebase) return '';
  try { const d = await firebase.firestore().collection('config').doc('discord').get(); return (d.exists && d.data().updates) || ''; } catch (e) { return ''; }
}
let announcing = false;
async function announceLesson() {
  const t = calDay(); if (S.announced === t || announcing) return;
  announcing = true;
  try {
  const url = await discordHook(); if (!url || S.announced === t) return;
  const n = streakNow(), who = displayName();
  const lines = ['BINKO REPORTING!', 'Log entry from Binko!', 'Binko binks this is worth announcing!', 'Ding ding ding! Binko has news!'];
  const fd = new FormData();
  fd.append('payload_json', JSON.stringify({
    username: '🔧✨ Binko-SR157 ✨🔧', avatar_url: new URL('icon-512.png?v=full', location.href).href,
    embeds: [{ color: [0x34b8a3, 0xf2a7c3, 0xf0e278, 0x6cc4ee, 0xc9824a][Math.floor(Math.random() * 5)],
      author: { name: '🌈🤖 BINKO-SR157 · Lucky Clover Field Log 🍀⚙️', icon_url: new URL('img/binko-face.webp?v=2', location.href).href },
      footer: { text: '💛 Adventurer & Creator Binko · Bink bink! 🩵' }, description: `${lines[Math.floor(Math.random() * lines.length)]} **${who}** finished today's Bisaya lesson!\n🔥 Streak: **${n} day${n === 1 ? '' : 's'}**${n >= 7 && n % 7 === 0 ? ' · a whole week! SUPER DUPER!' : ''}` }]
  }));
  await fetch(url, { method: 'POST', body: fd, mode: 'no-cors' });
  S.announced = t; save();
  } catch (e) { } finally { announcing = false; }
}
function nextBtnHtml(id = 'nextup') {
  const n = planNext();
  return n ? (n.manual ? `<div class="small muted">Next on today's plan: <b>${esc(n.name)}</b>. ${esc(n.d)}</div><button class="btn primary block" id="${id}">Back to today's plan</button>`
    : `<button class="btn primary block" id="${id}">Next: ${esc(n.name)}</button>`)
    : `<div class="small"><b>Everything on today's plan is done.</b> Padayon!</div><button class="btn primary block" id="${id}">Back home</button>`;
}
function wireNext(id = 'nextup') { const b = $('#' + id); if (!b) return; b.onclick = () => { const n = planNext(); if (n && !n.manual) n.run(); else goTab(); }; }
function sectionDone(label, line) {
  stopAudio();
  $('#app').innerHTML = `<section class="panel summary"><div class="label">${esc(label)}</div><h1 style="font-size:2rem;color:var(--sea)">Maayo kaayo!</h1>${line ? `<p class="muted">${line}</p>` : ''}
    ${cameoHtml('done')}${binkoSays(planNext() ? BINKO_NEXT[planNext().k] : BINKO_NEXT.done)}
    ${nextBtnHtml()}<button class="btn ghost block" id="home2">Home</button></section>`;
  wireNext(); $('#home2').onclick = () => goTab();
}

/* ---------- cards & SRS ---------- */
// little words get Binko's explanation and an example sentence (WORD_NOTE in fixes.js)
function wn(c) { const x = WORD_NOTE[String(c.ceb).toLowerCase().replace(/[.!?]/g, '').trim()]; if (x && !c.note) { c.note = x.note; c.ex = c.ex || x.ex; c.exEn = c.exEn || x.exEn; } return c; }
// cards don't change while the app runs (only your own gap words can), so each is worked out once
const CARD_MEMO = new Map();
function card(id) {
  if (CARD_MEMO.has(id)) return CARD_MEMO.get(id);
  const c = cardBuild(id); if (id[0] !== 'c') CARD_MEMO.set(id, c); return c;
}
function cardBuild(id) {
  const c = card0(id); if (!c) return c;
  // one way to say it per card; the others are their own cards (VARIANTS) and are still accepted when typed
  const sp = SPLIT[id];
  if (!MIX_MEMO.has(id)) MIX_MEMO.set(id, mixupsFor(c)); c.mix = MIX_MEMO.get(id);
  if (GNOTES[id]) c.note = GNOTES[id];   // little and confusing words: what it is, what it isn't, two examples
  // a word with several meanings: this card teaches the first one; the others are their own cards (s0, s1, ...)
  if (typeof SENSES !== 'undefined') { const sid = SENSES[id] ? id : SENSE_SAME[id]; if (sid && SENSES[sid]) { c.en = SENSES[sid][0].en; c.baseNote = c.note || ''; c.sense = [sid, 0]; c.note = senseNote(sid, 0) + (c.note ? ' ' + c.note : ''); } }
  if (sp) { c.ceb = sp.p; if (sp.en) c.en = sp.en; c.also = sp.also; if (id[0] === 'p') c.audio = false;
    const others = (VAR_OF[id] || []).map(v => VARIANTS[+v.slice(1)][1]);
    c.note = [GNOTES[id] ? '' : sp.n, c.note].filter(Boolean).join(' ');
    if (others.length) c.note += ' (' + others.map(o => '"' + o + '"').join(', ') + (others.length > 1 ? ' each have' : ' has') + ' its own card.)'; }
  return c;
}
const MIX_MEMO = new Map();
// the "Don't mix up" boxes that fit a card: by the whole word, by a word inside a phrase, or by grammar unit
function mixupsFor(c) {
  if (typeof MIXUPS === 'undefined' || !c || c.kind === 'r') return null;
  const whole = String(c.ceb).toLowerCase().replace(/[.!?,]/g, '').trim(), toks = tokens(String(c.ceb)).map(lowTok);
  const gu = c.kind === 'g' && G[+c.id.slice(1)] ? G[+c.id.slice(1)][3] : null;
  return MIXUPS.filter(m => (m.w || []).includes(whole) || (m.t || []).some(t => toks.includes(t)) || (m.g != null && m.g === gu)).slice(0, 2);
}
/* Easily confused words are learned apart and contrasted later. Learning look-alikes together causes more mix-ups
   (Tinkham 1993; Erten & Tekin 2008; Nakata & Suzuki 2019: more within-set errors, and spacing reduces them), so:
   no two words from the same "Don't mix up" group are new on the same day, and the box and its questions only show
   once you know at least one other word from the group. */
const mixWordIds = m => [...new Set((m.w || []).map(cardForTok).filter(Boolean))];
const mixKnown = (m, but) => mixWordIds(m).filter(id => id !== but && S.cards[id] && !S.cards[id].fresh && (S.cards[id].b || 0) >= 1).length;
// two meanings of the same word are never both new on the same day: the second waits until the first has been practiced
function senseClash(id, also) { if (typeof SENSE_LIST === 'undefined') return false; const c = card(id); if (!c || !c.sense) return false; const src = c.sense[0];
  if (id !== src && !S.cards[src]) return true;   // the main meaning comes first
  return [src, ...(SENSE_OF[src] || [])].some(x => x !== id && (also.includes(x) || (S.cards[x] && S.cards[x].fresh))); }
function mixClash(id, also) { const c = card(id); if (!c || !c.mix) return false;
  return c.mix.some(m => (m.w || []).length && mixWordIds(m).some(x => x !== id && (also.includes(x) || (S.cards[x] && S.cards[x].fresh)))); }
// a rule written as sentences becomes a bulleted list, one word per line with the word in bold ("niya = by him/her …")
function ruleList(text) {
  const parts = String(text).split(/(?<=[.!?])\s+(?=[A-Za-zÀ-ÿ'/(])/).map(x => x.trim()).filter(Boolean);
  if (parts.length < 2) return `<div>${esc(text)}</div>`;
  return `<ul class="rulel">${parts.map(x => { const m = x.match(/^([^=]{1,40}?)\s*=\s*(.+)$/); return `<li>${m ? `<b>${esc(m[1])}</b> = ${esc(m[2])}` : esc(x)}</li>`; }).join('')}</ul>`;
}
function mixHtml(c, teaching) {
  if (!c || !c.mix || !c.mix.length) return '';
  const ms = teaching ? c.mix.filter(m => !(m.w || []).length || mixKnown(m, c.id) >= 1) : c.mix; if (!ms.length) return '';
  return ms.map(m => `<div class="panel mix"><div class="label">Don't mix up · ${esc(m.title)}</div>${ruleList(m.rule)}
    <ul class="mixl">${m.ok.map(([a, b]) => `<li>✅ <b>${esc(a)}</b> <span class="muted">${esc(b)}</span></li>`).join('')}${(m.no || []).map(([a, b]) => `<li>❌ <s>${esc(a)}</s> → ✅ <b>${esc(b)}</b></li>`).join('')}</ul></div>`).join('');
}
// one question from a "Don't mix up" box: fix a common mistake, or tell apart the words in the box
const mixClean = x => String(x).replace(/\s*\([^)]*\)/g, '').trim();
function mixQuestion(m, level) {
  const fixes = (m.no || []).filter(([a, b]) => !/=/.test(a + b)).map(([a, b]) => ({ kind: 'fix', wrong: mixClean(a), right: mixClean(b), ctx: ((a.match(/\(for "([^"]*)"\)/) || [])[1]) || '' }));
  const says = m.ok.filter(([a]) => !/[_=]/.test(a)).map(([a, b]) => ({ kind: 'say', right: a, en: b }));
  const sayOk = says.filter(x => says.some(y => norm(y.en) !== norm(x.en)));
  const fills = (m.fill || []).map(([sent, ans, opts, en]) => ({ kind: 'fill', sent, ans, right: sent.replace('___', ans), en, wopts: opts }));
  // fill-in-the-blank about half the time when the group has them; otherwise fix a mistake or tell the words apart
  const pool = fills.length && Math.random() < 0.55 ? fills : fixes.length && (!sayOk.length || Math.random() < 0.5) ? fixes : sayOk.length ? sayOk : fills.length ? fills : fixes;
  const q = Object.assign({}, pick(pool));
  if (q.kind === 'fill') { q.mode = level >= 2 && Math.random() < 0.5 ? 'type' : 'pick'; q.opts = [q.ans, ...q.wopts.filter(o => norm(o) !== norm(q.ans))]; return q; }
  q.mode = level >= 2 && Math.random() < 0.6 ? 'type' : 'pick';
  if (q.kind === 'fix') { q.opts = [q.right, q.wrong]; if (!q.en) { const o = m.ok.find(([a]) => norm(a) === norm(q.right)); if (o) q.en = o[1]; } }
  else { q.also = says.filter(y => norm(y.en) === norm(q.en)).map(y => y.right); q.opts = [q.right, ...shuffle(says.filter(y => norm(y.en) !== norm(q.en)).map(y => y.right)).slice(0, 3)]; const bad = (m.no || []).find(([, b]) => norm(mixClean(b)) === norm(q.right)); if (bad && !/=/.test(bad[0])) { q.wrong = mixClean(bad[0]); if (!q.opts.some(o => norm(o) === norm(q.wrong))) q.opts.splice(1, 0, q.wrong); q.opts = q.opts.slice(0, 4); } }
  return q;
}
// up to three of these in a daily session, from words you already practice: ones you've missed first
function mixItems(skip) {
  const seenT = new Map();
  Object.keys(S.cards).filter(id => !skip.has(id) && !S.cards[id].fresh && card(id)).forEach(id => { const c = card(id), k = S.cards[id];
    (c.mix || []).filter(m => !(m.w || []).length ? (k.b || 0) >= 1 : mixKnown(m) >= 2).forEach(m => { const i = MIXUPS.indexOf(m), sc = (k.w || 0) * 2 - (k.b || 0) + Math.random() * 2; if (!seenT.has(i) || seenT.get(i).sc < sc) seenT.set(i, { id, sc }); }); });
  return [...seenT.entries()].sort((a, b) => b[1].sc - a[1].sc).slice(0, 3).map(([i, x]) => ({ id: x.id, type: 'mixq', mx: i }));
}
// examples for each meaning (examples.js loads after fixes.js)
if (typeof SENSES !== 'undefined' && typeof EXAMPLES !== 'undefined') { Object.keys(SENSES).forEach(id => { EXAMPLES[id] = SENSES[id][0].ex[0]; }); SENSE_LIST.forEach(([src, k], i) => { EXAMPLES['s' + i] = SENSES[src][k].ex[0]; }); }
// the note on every meaning card: how to spot this meaning, the other meanings of the same word, and two examples
function senseNote(src, k) {
  const ss = SENSES[src], me = ss[k], w = firstAlt((SPLIT[src] && SPLIT[src].p) || (card0(src) || {}).ceb || '');
  const others = ss.filter((_, j) => j !== k).map(x => x.en).join(' · ');
  return `${me.tip ? me.tip + '. ' : ''}One word, ${ss.length} meanings: "${w}" also means ${others} (each has its own card). ${me.ex.map(e => e[0] + ' — ' + e[1]).join(' · ')}`.replace(/\.\. /g, '. ');
}
// the "one word, several meanings" panel: every meaning as a chip (this one highlighted), how to spot it, two examples
function senseHtml(c) {
  if (!c || !c.sense || typeof SENSES === 'undefined') return '';
  const [src, k] = c.sense, ss = SENSES[src];
  return `<div class="panel sensep" data-src="${esc(src)}" data-k="${k}" data-w="${esc(firstAlt(c.ceb))}"><div class="label">One word, ${ss.length} meanings</div>
    <div class="senses">${ss.map((x, j) => `<button type="button" class="${j === k ? 'on' : ''}" data-sj="${j}" aria-pressed="${j === k}">${j === k ? '👉 ' : ''}${esc(x.en)}</button>`).join('')}</div>
    <div class="sbody">${senseBody(src, k, k, firstAlt(c.ceb))}</div></div>`;
}
// one meaning's part of the panel: this card's meaning, or (tapped) one of the others, which comes later as its own card
function senseBody(src, j, k, w) {
  const me = SENSES[src][j];
  return `<div style="margin-top:6px"></div>
    ${me.tip ? `<div><b>How to spot it:</b> ${esc(me.tip)}</div>` : ''}
    <div class="sx">${me.ex.map(e => `<div class="sxr"><div><b>${esc(e[0])}</b><div class="small muted">${esc(e[1])}</div></div>${hasVoice(e[0]) ? `<button class="play sm" data-vs="${esc(e[0])}" aria-label="Play example">${I.play}</button>` : ''}</div>`).join('')}</div>`;
}
// tapping a meaning chip swaps the panel to that meaning (works wherever the panel is shown)
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.sensep [data-sj]'); if (!b) return;
  const p = b.closest('.sensep'), j = +b.dataset.sj, k = +p.dataset.k;
  // the meaning you're looking at is filled in; the others (this card's own one too, still marked 👉) go plain
  p.querySelectorAll('[data-sj]').forEach(x => { const on = +x.dataset.sj === j; x.classList.toggle('on', on); x.classList.remove('sel'); x.setAttribute('aria-pressed', on); });
  p.querySelector('.sbody').innerHTML = senseBody(p.dataset.src, j, k, p.dataset.w);
  p.querySelectorAll('.sbody [data-vs]').forEach(x => x.onclick = () => playSentence(x.dataset.vs, x));
});
function card0(id) {
  const k = id[0], n = +id.slice(1);
  if (HIDE.has(id)) return null;
  if (k === 's') { const sp = typeof SENSE_LIST !== 'undefined' && SENSE_LIST[n], src = sp && card(sp[0]); if (!src || !SENSES[sp[0]] || !SENSES[sp[0]][sp[1]]) return null;
    const me = SENSES[sp[0]][sp[1]]; return { id, kind: src.kind === 'p' ? 'p' : 'w', ceb: src.ceb, en: me.en, note: senseNote(sp[0], sp[1]), baseNote: '', also: src.also, audio: !!src.audio, rec: sp[0], sense: [sp[0], sp[1]] }; }   // same word as its source card, so its recording fits
  if (k === 'v') { const v = VARIANTS[n], src = v && card0(v[0]); return v && src && { id, kind: 'p', ceb: v[1], en: v[2] || (SPLIT[v[0]] && SPLIT[v[0]].en) || src.en, note: v[3], also: v[4], audio: false, alt: v[0] }; }
  if (k === 'r') { const r = RULES[n]; return r && { id, kind: 'r', ceb: r.title, en: r.short, audio: false, rule: r }; }
  if (k === 'p') return P[n] && { id, kind: 'p', ceb: CEB_FIX[id] || P[n][0], en: EN_FIX[id] || P[n][1], note: NOTES[id], trick: TRICKS[id], audio: true };
  if (k === 'w') return W[n] && wn({ id, kind: 'w', ceb: CEB_FIX[id] || W[n][0], en: EN_FIX[id] || W[n][1], note: NOTES[id], trick: TRICKS[id], audio: !RECORDING_OFF.has(id) });
  if (k === 'g') return G[n] && { id, kind: 'g', ceb: G[n][0], en: EN_FIX[id] || G[n][1], note: G[n][2], audio: false };
  if (k === 'd') { const [di, li] = id.slice(1).split('_').map(Number), d = DIALOGS[di], l = d && d.lines[li]; return l && { id, kind: 'd', ceb: l[1], en: l[2], note: l[3] || '', audio: false, convo: d.title }; }
  if (k === 'm') return MEGA[n] && wn({ id, kind: 'm', ceb: CEB_FIX[id] || MEGA[n][0], en: EN_FIX[id] || MEGA[n][1], audio: false });
  if (k === 'e') return EXTRA[n] && { id, kind: 'p', ceb: EXTRA[n][0], en: EN_FIX[id] || EXTRA[n][1], note: EXTRA[n][2], audio: false };
  if (k === 'f') return F[n] && { id, kind: 'f', ceb: F[n].ceb, en: EN_FIX[id] || F[n].en, note: F[n].note, trick: F[n].trick, combos: F[n].combos, audio: false };
  const c = (S.custom || []).find(x => x.id === id);
  return c && { id, kind: 'c', ceb: c.ceb, en: c.en, ex: c.ex, exEn: c.exEn, audio: false };
}
const IV = [0, 1, 2, 4, 7, 14, 30, 60];
/* ---------- memory model: FSRS-6 (the scheduler Anki uses), with its published default weights ----------
   Each card keeps how stable its memory is (s, in days) and how hard it is for you (df, 1-10). The next review is set
   for when you'd still remember it 90% of the time: hard words come back sooner, easy ones wait longer.
   Recognising a word (picking it from choices) counts for less than producing it (typing, saying, building), and a
   miss brings the word back the next day with its memory weakened. b (0-7) is kept as the card's level for the rest
   of the app (which exercises it gets, whether it counts as learned). */
const FW = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542];
const F_DECAY = -FW[20], F_FACTOR = Math.exp(Math.log(0.9) / F_DECAY) - 1, RETAIN = 0.9;
const fClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const fRecall = (days, st) => Math.pow(1 + F_FACTOR * days / st, F_DECAY);
const fInterval = st => Math.max(1, Math.round(st / F_FACTOR * (Math.pow(RETAIN, 1 / F_DECAY) - 1)));
const fInitD = g => FW[4] - Math.exp((g - 1) * FW[5]) + 1;
const levelOf = st => st < 1 ? 0 : st < 2 ? 1 : st < 4 ? 2 : st < 7 ? 3 : st < 14 ? 4 : st < 30 ? 5 : st < 60 ? 6 : 7;
// cards from before this model: estimate their memory from the old level and how they've done
function memOf(c) {
  if (c.s == null) { c.s = Math.max(0.3, IV[c.b] || 0.4); const tot = (c.r || 0) + (c.w || 0); c.df = fClamp(5 + 4 * ((c.w || 0) / (tot + 1)) - (c.b || 0) * 0.3, 1, 10); c.lr = Math.min(today(), (c.d || today()) - Math.max(1, IV[c.b] || 1)); }
  return c;
}
const recallNow = c => { memOf(c); return fRecall(Math.max(0, today() - c.lr), c.s); };
const RECOG = new Set(['mc', 'listen', 'tiles', 'rq', 'rid', 'reply', 'hear2', 'pic']);   // picking from choices
function fsrsStep(c, g, t, first) {
  if (first) { c.s = FW[g - 1]; c.df = fClamp(fInitD(g), 1, 10); c.lr = t; return; }
  memOf(c); const el = Math.max(0, t - c.lr), r = fRecall(el, c.s), d = c.df, st = c.s;
  if (el === 0) { const sinc = Math.pow(st, -FW[19]) * Math.exp(FW[17] * (g - 3 + FW[18])); c.s = st * (g >= 2 ? Math.max(sinc, 1) : sinc); }
  else if (g === 1) { const f = FW[11] * Math.pow(d, -FW[12]) * (Math.pow(st + 1, FW[13]) - 1) * Math.exp((1 - r) * FW[14]); c.s = Math.min(f, st / Math.exp(FW[17] * FW[18])); }
  else c.s = st * (1 + Math.exp(FW[8]) * (11 - d) * Math.pow(st, -FW[9]) * (Math.exp((1 - r) * FW[10]) - 1) * (g === 2 ? FW[15] : 1) * (g === 4 ? FW[16] : 1));
  c.s = fClamp(c.s, 0.001, 36500);
  const dd = -FW[6] * (g - 3), nd = d + dd * (10 - d) / 9; c.df = fClamp(FW[7] * fInitD(4) + (1 - FW[7]) * nd, 1, 10); c.lr = t;
}
function grade(id, q, type) {
  const t = today(); const c = S.cards[id] || (S.cards[id] = { b: 0, d: t, r: 0, w: 0 });
  const g = q === 0 ? 1 : q === 1 ? 2 : RECOG.has(type) ? 2 : 3;   // again / hard / good; picking from choices is 'hard' credit
  const first = c.s == null && !c.r && !c.w;
  if (q > 0) c.r++; else { c.w++; c.wd = t; }
  fsrsStep(c, g, t, first); delete c.fresh;
  c.b = levelOf(c.s); c.d = t + (q === 0 ? 1 : fInterval(c.s));
}
const learned = ids => ids.filter(id => S.cards[id] && S.cards[id].b >= 2).length;
const seen = ids => ids.filter(id => S.cards[id]).length;
const needsWork = () => { const t = today(); return dueIds().filter(id => { const c = S.cards[id]; return c.w > 0 && (c.wd ? c.wd >= t - 7 : c.b <= 1); }); };
// due cards, the ones you're most likely to have forgotten first (so a short session saves the most)
function dueIds() { const t = today(); const ids = Object.keys(S.cards).filter(id => S.cards[id].d <= t && card(id)); const rc = {}; ids.forEach(id => rc[id] = recallNow(S.cards[id])); return ids.sort((a, b) => rc[a] - rc[b]); }
/* New words per day: the setting is the most you'll get, not a promise. When reviews pile up or recent answers are
   shaky, fewer new words come in, so the old ones get practiced before they're forgotten. Reviews that would have
   been crowded out get the room instead. */
function newPlan() {
  const pref = S.settings.newPerDay || 8; if (window.__noThrottle) return { n: pref, why: '' };
  const backlog = dueIds().filter(id => id[0] !== 'r').length, a = acc7();
  let n = pref, why = '';
  if (backlog > 20) { n = Math.round(pref * Math.max(0, 1 - (backlog - 20) / 40)); why = 'backlog'; }
  if (a.n >= 20 && a.pct < 75) { const m = a.pct < 60 ? Math.min(2, pref) : Math.round(pref / 2); if (m < n) { n = m; why = 'accuracy'; } }
  return { n: Math.max(0, Math.min(pref, n)), why, backlog, pct: a.n >= 20 ? a.pct : null, pref };
}
function newAllowance() { const t = today(); if (S.newDay.d !== t) S.newDay = { d: t, n: 0 }; if (S.newDay.cap == null || S.newDay.capV !== S.settings.newPerDay) { S.newDay.cap = newPlan().n; S.newDay.capV = S.settings.newPerDay; } return Math.max(0, S.newDay.cap - S.newDay.n); }
// how many reviews fit in today's session: the usual 16, plus two for each new word held back (up to 40)
const reviewRoom = () => { const pref = S.settings.newPerDay || 8, cap = S.newDay && S.newDay.d === today() && S.newDay.cap != null ? S.newDay.cap : pref; return Math.min(40, 16 + 2 * Math.max(0, pref - cap)); };
/* ---------- the learning path ---------- */
let PATH = [];
function buildPath() {
  const used = new Set();
  const mUnit = sel => { // 'Name', 'Name 3', 'Name 1-10'
    const m = sel.match(/^(.*?)(?: (\d+)(?:-(\d+))?)?$/), base = m[1], a = m[2] ? +m[2] : null, b = m[3] ? +m[3] : a;
    return M_UNITS.filter(u => { if (u.ceb === base) return a === null || a === 1; const mm = u.ceb.match(/^(.*) (\d+)$/); return mm && mm[1] === base && (a === null || (+mm[2] >= a && +mm[2] <= b)); });
  };
  PATH = STAGES.map(st => {
    const lists = [];
    const add = (ids, front) => { ids = ids.flatMap(id => [id, ...(typeof SENSE_OF !== 'undefined' && SENSE_OF[id] || []), ...(VAR_OF[id] || [])]).filter(id => !used.has(id)); ids.forEach(id => used.add(id)); if (ids.length) lists.push({ ids, front }); };
    // [start, span] within the stage: building blocks and set phrases open it, frequency words start a little later,
    // conversation lines come once some of their words are in
    add(st.f.flatMap(i => (F_UNITS[i] || { ids: [] }).ids), [0, 0.6]);
    add(st.p.flatMap(i => (UNITS[i] || { ids: [] }).ids).concat(st.e.map(i => 'e' + i)), [0, 0.85]);
    add(st.g.flatMap(i => (GRAM_UNITS[i] || { ids: [] }).ids), [0.05, 0.8]);
    if (st.x) add(st.x.filter(id => card(id)), [0.1, 0.8]); // single cards pulled into this stage on purpose (e.g. numbers)
    add(st.m[0] === '*' ? M_ORDER.slice() : st.m.flatMap(mUnit).flatMap(u => u.ids), [0.04, 0.96]);
    add(st.d.flatMap(i => (DIALOGS[i] ? DIALOGS[i].lines.map((_, j) => 'd' + i + '_' + j) : [])), [0.3, 0.7]);
    add(W.slice(st.w[0], st.w[1]).map((_, j) => 'w' + (st.w[0] + j)), [0.12, 0.88]);
    // spread each source evenly through the stage
    const keyed = lists.flatMap(l => l.ids.map((id, i) => [l.front[0] + ((i + 0.5) / l.ids.length) * l.front[1], id]));
    keyed.sort((x, y) => x[0] - y[0]);
    return Object.assign({}, st, { ids: keyed.map(x => x[1]) });
  });
  // anything not placed yet goes into the last stage, so nothing is ever left out
  const rest = [...F_ORDER, ...GRAM_ORDER, ...D_ORDER, ...PHRASE_ORDER, ...E_ORDER, ...W.map((_, i) => 'w' + i), ...M_ORDER, ...VARIANTS.map((_, i) => 'v' + i), ...(typeof SENSE_LIST !== 'undefined' ? SENSE_LIST.map((_, i) => 's' + i) : [])].filter(id => !used.has(id));
  PATH[PATH.length - 1].ids.push(...rest);
}
buildPath();
const stageStats = st => { const ids = st.ids.filter(id => card(id) && (S.cards[id] || !twinTaken(id))); const l = learned(ids), sn = seen(ids); return { total: ids.length, learned: l, seen: sn, frac: ids.length ? l / ids.length : 1 }; };
function pathState() {
  const stats = PATH.map(stageStats);
  let cur = stats.findIndex(x => x.frac < PATH_GATE); if (cur < 0) cur = PATH.length - 1;
  return { stats, cur };
}
function pathTimeline() {
  const { stats, cur } = pathState(), per = S.settings.newPerDay || 8, out = []; let days = 0;
  stats.forEach((x, i) => { if (i < cur) { out.push(null); return; } days += Math.ceil((x.total - x.seen) / per) + PATH_LAG_DAYS; out.push(days); });
  return out;
}
const dateIn = d => { const t = new Date(Date.now() + d * 864e5); return t.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); };
function pathPanel() {
  const { stats, cur } = pathState(), tl = pathTimeline(), per = S.settings.newPerDay || 8, x = stats[cur];
  const gated = x.seen >= x.total && x.frac < PATH_GATE;
  return `<section class="panel"><div class="row spread"><h2>Your path</h2><span class="muted small">${per} new cards a day</span></div>
    ${binkoSays(gated ? `You've met every card in <b>${esc(PATH[cur].name)}</b>! Now we polish them. Stage ${cur + 2} opens when ${Math.round(PATH_GATE * 100)}% are learned (${Math.ceil(PATH_GATE * x.total) - x.learned} to go). Just reviews until then!`
      : `Stage ${cur + 1}: <b>${esc(PATH[cur].name)}</b>. ${esc(PATH[cur].can)}`)}
    <div>${PATH.map((st, i) => { const y = stats[i], st8 = i < cur ? 'done' : i === cur ? 'now' : 'later';
      return `<div class="stage-row ${st8}"><div class="stage-dot">${i < cur ? I.check : i + 1}</div><div style="min-width:0;flex:1"><div class="row spread" style="gap:6px"><b>${typeof PIC_X !== 'undefined' ? picImg(PIC_X.stage[i], 'in') : ''} ${esc(st.ceb)} · ${esc(st.name)}</b><span class="muted small">${esc(st.level)}</span></div>
        <div class="bar" style="margin:6px 0 4px"><i style="width:${y.frac * 100}%"></i></div>
        <div class="muted small">${y.learned} of ${y.total} learned · ${i < cur ? 'done' : i === cur ? (tl[i] ? 'expected around ' + dateIn(tl[i]) : '') : 'opens around ' + dateIn(tl[i - 1] || 0)}</div></div></div>`; }).join('')}</div>
    <p class="muted small" style="margin:0">Dates assume you finish the daily session every day. A stage opens once ${Math.round(PATH_GATE * 100)}% of the one before it is learned, so you never move on before you've got it.</p></section>`;
}
/* ---------- every new card comes with an example made only of words you already know ----------
   The example pool is every sentence in the app (phrases, Mega-deck sentences, conversation lines, grammar examples,
   sentences built from the grammar patterns). A word only opens once one of those sentences uses it with words you've
   met. If a word on the path has no example yet, Binko first teaches the one or two missing words it needs. */
let EXPOOL = null;
function exPool() {
  if (EXPOOL) return EXPOOL;
  const out = [], seen = new Set(), add = (ceb, en) => { ceb = firstAlt(String(ceb || '')).trim(); const toks = tokens(ceb).map(lowTok).filter(Boolean); if (toks.length < 2 || toks.length > 9 || /→|_/.test(ceb)) return; const k = toks.join(' '); if (seen.has(k)) return; seen.add(k); out.push({ ceb, en: firstAlt(String(en || '')), toks, key: ' ' + k + ' ' }); };
  allPatternSentences().forEach(x => add(x.ceb, x.en));
  const ids = [...(hasPack() ? P.map((_, i) => 'p' + i) : []), ...M_ORDER, ...GRAM_ORDER, ...F_ORDER, ...D_ORDER];
  ids.forEach(id => { const c = card(id); if (c) add(c.ceb, c.en); });
  RULES.forEach(r => r.steps.forEach(st => st[1].forEach(x => add(x[0], x[1]))));
  Object.values(WORD_NOTE).forEach(x => add(x.ex, x.exEn));
  if (typeof EXAMPLES !== 'undefined') Object.values(EXAMPLES).forEach(x => add(x[0], x[1]));
  const idx = new Map(); out.forEach(e => new Set(e.toks).forEach(t => { if (!idx.has(t)) idx.set(t, []); idx.get(t).push(e); }));
  return (EXPOOL = { all: out, idx });
}
const needsExample = c => c && !['d', 'c', 'r'].includes(c.kind) && tokens(firstAlt(c.ceb)).length === 1;
// a word counts as known if you know it, or its root with an action/describing front or ending (mokaon -> kaon), or ko/ka/siya + y (koy)
const AFF_RE = /^(nag|mag|naka|maka|mo|mu|ni|mi|gi|na|ma|pag|ka)-?/, SUF_RE = /(on|an|a|i|hon|han|ha)$/;
const rootOf = t => { const r = t.replace(AFF_RE, ''); return r.length >= 3 ? r : t; };
const ROOTS = new WeakMap();
function knownTok(t, known) {
  if (!t || known.has(t)) return true; if (/y$/.test(t) && known.has(t.slice(0, -1))) return true;
  // any form of a root you know counts (mokaon known -> nikaon, gikaon, kaon)
  let rs = ROOTS.get(known); if (!rs || rs.n !== known.size) { rs = { n: known.size, s: new Set() }; known.forEach(w => { rs.s.add(rootOf(w)); rs.s.add(rootOf(w).replace(SUF_RE, '')); }); ROOTS.set(known, rs); }
  const r = rootOf(t); return rs.s.has(r) || (r.replace(SUF_RE, '').length >= 3 && rs.s.has(r.replace(SUF_RE, '')));
}
// sentences that use this card, with how many words in them aren't known yet (not counting the card's own words)
function exCandidates(c, known) {
  const own = tokens(firstAlt(c.ceb)).map(lowTok).filter(Boolean); if (!own.length) return [];
  const key = ' ' + own.join(' ') + ' ', ownSet = new Set(own);
  const mine = typeof EXAMPLES !== 'undefined' && EXAMPLES[c.id] && EXAMPLES[c.id][0] ? [{ ceb: EXAMPLES[c.id][0], en: EXAMPLES[c.id][1], toks: tokens(EXAMPLES[c.id][0]).map(lowTok).filter(Boolean), key: '' }] : [];
  return mine.concat((exPool().idx.get(own[own.length - 1]) || []).filter(e => e.key.includes(key) && e.toks.length > own.length))
    .map(e => ({ e, miss: [...new Set(e.toks.filter(t => !ownSet.has(t) && !knownTok(t, known)))] }));
}
function exFor(c, known) {
  const mine = typeof EXAMPLES !== 'undefined' && EXAMPLES[c.id], own = new Set(tokens(firstAlt(c.ceb)).map(lowTok));
  if (mine && mine[0] && tokens(mine[0]).map(lowTok).every(t => own.has(t) || knownTok(t, known))) return { ceb: mine[0], en: mine[1] };
  const ok = exCandidates(c, known).filter(x => !x.miss.length).map(x => x.e); if (!ok.length) return null;
  // 3 to 6 words reads best
  ok.sort((x, y) => Math.abs(x.toks.length - 4) - Math.abs(y.toks.length - 4)); return ok[0];
}
// the card that teaches a single word, preferring short cards on the path
let WORDCARD = null;
function cardForWord(w) {
  if (!WORDCARD) { WORDCARD = new Map(); const ids = [...PATH.flatMap(s => s.ids)]; ids.forEach(id => { const c = card(id); if (!c || tokens(firstAlt(c.ceb)).length !== 1) return; const t = lowTok(firstAlt(c.ceb)); if (t && !WORDCARD.has(t)) WORDCARD.set(t, id); }); }
  return WORDCARD.get(w) || null;
}
function prereqPlan(c, known, budget, depth, taken) {
  if (budget < 0) return null;
  const cands = exCandidates(c, known).filter(x => x.miss.length <= 2).sort((a, b) => a.miss.length - b.miss.length || Math.abs(a.e.toks.length - 4) - Math.abs(b.e.toks.length - 4)).slice(0, 12);
  for (const x of cands) {
    const plan = [], k2 = new Set(known); let ok = true;
    const add = p => { plan.push(p); tokens(firstAlt(card(p).ceb)).forEach(t => k2.add(lowTok(t))); };
    for (const w of x.miss) {
      if (knownTok(w, k2)) continue;
      const p = cardForWord(w); if (!p || S.cards[p] || taken.includes(p) || plan.includes(p)) { ok = false; break; }
      const pc = card(p);
      if (!needsExample(pc) || exFor(pc, k2)) { add(p); continue; }
      if (depth <= 0) { ok = false; break; }
      const sub = prereqPlan(pc, k2, budget - plan.length - 1, depth - 1, taken.concat(plan)); if (!sub) { ok = false; break; }
      sub.forEach(add); add(p);
    }
    if (ok && plan.length <= budget) return plan;
  }
  return null;
}
/* The same word with the same meaning can sit on two cards (a phrase and a word list, say). Once one is taught the other
   is left out of new cards and of stage progress. Anyone who already has both keeps both. */
let TWINS = null;
const twinKey = c => norm(firstAlt(c.ceb)) + '|' + norm(firstAlt(c.en));
function twinTaken(id, also) {
  if (!/^[pwmevs]/.test(id)) return false;
  if (!TWINS) { TWINS = new Map(); PATH.forEach(st => st.ids.forEach(x => { const c = card(x); if (c) { const k = twinKey(c); if (!TWINS.has(k)) TWINS.set(k, []); TWINS.get(k).push(x); } })); }
  const c = card(id); return !!c && (TWINS.get(twinKey(c)) || []).some(x => x !== id && (S.cards[x] || (also && also.includes(x))));
}
function pickNew() {
  let left = newAllowance(); const out = [];
  const known = new Set(knownWords());
  const learn = id => { out.push(id); left--; tokens(firstAlt(card(id).ceb)).forEach(t => known.add(lowTok(t))); };
  const ready = c => !needsExample(c) || !!exFor(c, known);
  const take = (order, max) => { let n = Math.min(max, left); const blocked = [];
    for (const id of order) { if (n <= 0) break; if (S.cards[id] || out.includes(id) || twinTaken(id, out) || mixClash(id, out) || senseClash(id, out)) continue; const c = card(id); if (!c) continue;
      if (ready(c)) { learn(id); n--; } else if (blocked.length < 40) blocked.push(id); }
    // unblock: teach the few missing words an example needs (and theirs, two levels down), then the word itself
    for (const id of blocked) {
      if (n <= 0 || left <= 0) break; const c = card(id); if (ready(c)) { learn(id); n--; continue; }
      const plan = prereqPlan(c, known, Math.min(n, left) - 1, 2, out); if (!plan) continue;
      plan.forEach(p => learn(p)); n -= plan.length; if (ready(c) && n > 0) { learn(id); n--; }
    } };
  take(S.custom.map(c => c.id), 3);
  // a unit the learner chose to focus on comes first, as long as its stage is open
  const { cur } = pathState(), open = PATH.slice(0, cur + 1).flatMap(st => st.ids), openSet = new Set(open);
  if (S.focus) { const map = { f: F_UNITS, g: GRAM_UNITS, u: UNITS, k: WORD_UNITS, m: M_UNITS }, u = (map[S.focus[0]] || [])[+S.focus.slice(1)]; if (u) take(u.ids.filter(id => openSet.has(id)), left); }
  // one word a day that brings the nearest of Binko's stories closer to opening
  if (left > 0 && typeof STORIES !== 'undefined') { const near = STORIES.map(storyMissing).filter(m => m.length && m.length <= 3).sort((x, y) => x.length - y.length)[0];
    if (near) for (const w of near) { const id = cardForWord(w); if (id && !S.cards[id] && !out.includes(id) && ready(card(id))) { learn(id); break; } } }
  /* Sentence rules first. The building blocks (who, whose, have, want, asking, when, describing) and the grammar cards
     (little words, verb tenses) come before any other new words, from wherever they sit on the path, and then the words
     the next grammar rules need for their practice sentences. Ordinary vocabulary only fills what's left. */
  if (left > 0) take([...F_ORDER, ...GRAM_ORDER], left);
  if (left > 0) { const need = RULES.filter(r => !ruleLearned(r.id)).flatMap(r => r.quiz.flatMap(q => q.w)).filter(w => !known.has(w));
    take([...new Set(need)].map(cardForWord).filter(Boolean), left); }
  take(open, left);
  // still room: words from later on the path that already have an example
  if (left > 0) take(PATH.slice(cur + 1).flatMap(st => st.ids).filter(id => { const c = card(id); return c && needsExample(c); }), left);
  return out;
}
// about a third of the time, a card that can take one of the newer kinds of question gets it instead (questions.js)
function exType(id, isNew) {
  const t = exType0(id, isNew); if (isNew || typeof extraTypes !== 'function') return t;
  const x = extraTypes(id, S.cards[id] ? S.cards[id].b || 0 : 0); return x.length && Math.random() < 0.35 ? pick(x) : t;
}
function exType0(id, isNew) {
  const c = card(id), b = isNew ? 0 : (S.cards[id] ? S.cards[id].b : 0);
  if (c.kind === 'r') return b <= 0 ? 'rq' : b === 1 ? pick(['rid', 'rq', 'rid']) : pick(['rid', 'rfix', 'rq']);
  const n = tokens(c.ceb).length, multi = n >= 2 && n <= 9;
  if (c.kind === 'd') return isNew || b < 1 ? 'build' : pick(['build', 'mc', 'type']);
  if (c.kind === 'f') return isNew || b < 1 ? 'build' : b < 2 ? pick(['build', 'mc']) : pick(['build', 'type', 'speak']);
  if (!c.audio) return isNew || b < 1 ? 'mc' : b < 2 ? pick(['mc', 'type']) : pick(['speak', 'type']);
  if (isNew || b <= 0) return pick(['listen', 'mc']);
  if (b === 1) return pick(multi ? ['listen', 'tiles', 'mc', 'dict'] : ['listen', 'mc', 'type']);
  if (b === 2) return pick(multi ? ['tiles', 'dict', 'listen', 'speak'] : ['type', 'listen', 'dict', 'speak']);
  return pick(multi ? ['dict', 'tiles', 'type', 'listen', 'speak', 'speak'] : ['type', 'dict', 'listen', 'speak']);
}
function buildSession() {
  ensureRuleCards();
  const extraRound = !!planDay().session;   // "Review what you know" after the day's session: nothing new
  const nwk = new Set(needsWork()), due = [...nwk, ...dueIds().filter(id => !nwk.has(id))], q = due.filter(id => id[0] !== 'r').slice(0, (newAllowance(), reviewRoom())).concat(due.filter(id => id[0] === 'r').slice(0, 3)).map(id => ({ id, type: exType(id) }));
  shuffle(q); q.sort((x, y) => (nwk.has(y.id) ? 1 : 0) - (nwk.has(x.id) ? 1 : 0));
  const nw = extraRound ? [] : pickNew(); let lastPos = 0;
  for (const id of nw) {
    // new cards stay in the order they were picked, so the words an example needs are always taught first
    const pos = Math.max(lastPos, Math.min(q.length, lastPos + Math.floor(Math.random() * 3))); lastPos = pos + 1;
    q.splice(pos, 0, { id, type: 'teach' });
    // first recall 4 to 6 questions after it's taught: soon enough to succeed, late enough to take some effort
    // (Pyc & Rawson 2009; Karpicke & Bauernschmidt 2011: spacing between recalls, not their pattern, drives retention)
    q.splice(Math.min(q.length, pos + 4 + Math.floor(Math.random() * 3)), 0, { id, type: exType(id, true) });
  }
  // new grammar rules, taught inside the session, then two quick questions on each
  // a new rule only when the earlier ones are holding: if a rule you've learned keeps tripping you up, it gets practiced instead
  // up to two new rules (one early, one around the middle), each taught then asked twice
  const nr = extraRound || [...nwk].some(id => id[0] === 'r') ? null : nextRule(), nr2 = nr && nextRule(nr);
  [nr, nr2].forEach((r, k) => { if (!r || S.cards[ruleCardId(r)]) return; const id = ruleCardId(r), pos = Math.min(q.length, (k ? Math.floor(q.length / 2) : 3) + Math.floor(Math.random() * 3));
    q.splice(pos, 0, { id, type: 'rteach' }); q.splice(Math.min(q.length, pos + 2), 0, { id, type: 'rq' }); q.splice(Math.min(q.length, pos + 6), 0, { id, type: 'rq' }); });
  const sh = [...new Set(shuffle(Object.keys(S.cards).filter(id => id[0] === 'p' && card(id)).concat(nw.filter(id => id[0] === 'p'))))].slice(0, 2);
  sh.forEach((id, i) => { const taught = q.findIndex(x => x.id === id && x.type === 'teach'); q.splice(Math.max(Math.floor(q.length * (0.45 + i * 0.4)), taught + 2), 0, { id, type: 'shadow' }); });
  if (q.filter(x => x.type !== 'shadow').length < 4) shuffle(Object.keys(S.cards).filter(card)).slice(0, 10).forEach(id => q.push({ id, type: exType(id) }));
  if (!q.length) GRAM_ORDER.slice(0, 4).forEach(id => q.push({ id, type: 'teach' }, { id, type: 'mc' }));
  // "Don't mix up" questions on words you already know, in the second half
  if (typeof MIXUPS !== 'undefined') mixItems(new Set(nw)).forEach(x => q.splice(Math.floor(q.length * (0.5 + Math.random() * 0.4)), 0, x));
  // one more try at today's new words near the end, after other questions in between: recalling a word again
  // after a gap fixes it much better than seeing it twice in a row (successive relearning)
  // every new word, not just the first ten (Karpicke & Roediger 2008: words recalled once and dropped are forgotten
  // far faster than words recalled again later in the session)
  if (nw.length) shuffle(nw.filter(id => id[0] !== 'r').slice(0, 15)).forEach(id => q.push({ id, type: exType(id, true), recap: 1 }));
  q.forEach(x => { if (x.type === 'say' || x.type === 'pron') x.type = 'speak'; });
  return q;
}

/* ---------- audio playback ---------- */
const urls = {}; const player = new Audio(); player.preservesPitch = true;
let playToken = 0;
/* Every request to play something gets a number. A clip that is still downloading when you've moved on (or asked for
   something else) is dropped instead of playing late over the next word. */
let playReq = 0;
const audioCtx = () => view + ':' + (typeof qi !== 'undefined' ? qi : '') + ':' + (typeof NR !== 'undefined' && NR ? NR.i : '');
const stillWanted = (r, cx) => r === playReq && cx === audioCtx();
/* ---------- computer voice: cards with no native recording ----------
   voice/ holds clips made with Meta's MMS Cebuano voice (facebook/mms-tts-ceb, CC BY-NC 4.0), keyed by the cleaned-up Bisaya text. */
const vkey = s => firstAlt(String(s)).toLowerCase().replace(/[’‘`]/g, "'").replace(/[.,!?¿¡"“”…:;]/g, ' ').replace(/\s+/g, ' ').trim();
const VOICE_V = 20; let VIDX = null; const SHARD = {}, shardLoading = {}; const vurls = {};
/* The computer voice comes in pieces: a small index, then one piece per stage. You only download the pieces for
   where you are on the path (plus the next one); the rest arrive when a sentence from them is first played. */
async function loadVoice() {
  try { const ix = await idbGet('vidx'); if (ix && ix.v === VOICE_V) VIDX = ix; } catch (e) { }
  if (!VIDX) { try { const r = await fetch('voice/index.json?v=' + VOICE_V, { cache: 'no-store' }); if (r.ok) { VIDX = await r.json(); try { await idbSet('vidx', VIDX); } catch (e) { } } } catch (e) { } }
  if (!VIDX) return;
  try { await idbSet('voice', null); } catch (e) { }   // the old all-in-one pack: free the space
  const cur = pathState().cur; [...new Set([0, cur, Math.min(VIDX.n - 1, cur + 1)])].forEach(loadShard);
  if (view === 'home') render();
}
function loadShard(n) {
  if (SHARD[n]) return Promise.resolve(); if (shardLoading[n]) return shardLoading[n];
  return (shardLoading[n] = (async () => {
    // each piece has its own version, so an update only re-downloads the pieces that changed
    const sv = (VIDX && VIDX.sv && VIDX.sv[n]) || VOICE_V;
    let b = null; try { b = await idbGet('vs' + n + '_' + sv); } catch (e) { }
    if (!b) { const r = await fetch('voice/s' + n + '.bin?v=' + sv); if (!r.ok) throw new Error('voice piece'); b = await r.arrayBuffer(); try { await idbSet('vs' + n + '_' + sv, b); } catch (e) { } }
    SHARD[n] = b;
  })().catch(() => { }).finally(() => { delete shardLoading[n]; }));
}
const hasVoice = s => !!(VIDX && VIDX.k[vkey(s)]);
function voiceUrl(s) { const k = vkey(s), ix = VIDX && VIDX.k[k]; if (!ix) return null; if (vurls[k]) return vurls[k]; const b = SHARD[ix[0]]; if (!b) { loadShard(ix[0]); return null; } return (vurls[k] = URL.createObjectURL(new Blob([b.slice(ix[1], ix[1] + ix[2])], { type: 'audio/mpeg' }))); }
async function voiceUrlA(s) { const ix = VIDX && VIDX.k[vkey(s)]; if (!ix) return null; if (!SHARD[ix[0]]) await loadShard(ix[0]); return voiceUrl(s); }
// last resort for the learner's own gap words: the device voice (usually Filipino, not Cebuano)
['play', 'playing'].forEach(ev => player.addEventListener(ev, () => typeof Music !== 'undefined' && Music.duck(true)));
['pause', 'ended', 'error'].forEach(ev => player.addEventListener(ev, () => typeof Music !== 'undefined' && Music.duck(false)));
function sayFallback(text) { try { if (typeof Music !== 'undefined') { Music.duck(true); setTimeout(() => Music.duck(false), 2500); } const v = speechSynthesis.getVoices().find(x => /^(ceb|fil|tl)/i.test(x.lang)); const u = new SpeechSynthesisUtterance(text); if (v) u.voice = v; u.lang = v ? v.lang : 'fil-PH'; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
const canHear = c => !!c && (c.audio || hasVoice(c.ceb) || c.kind === 'c');
const voiceNote = c => c.audio ? 'Say it out loud with the recording.' : hasVoice(c.ceb) ? 'Computer voice, not a native speaker. Say it out loud with it.' : "Your phone's voice, so it may sound Tagalog. Say it out loud.";
// cards whose wording was corrected to a different form than the native speaker recorded: use the voice for the corrected words
const RECORDING_OFF = new Set(['w225', 'w879']);   // makililimos → mangililimos, permerong → primero nga
// a sentence or word that a native speaker recorded on its own (one way of saying it, spelled the same) plays that
// recording instead of the computer voice, wherever it shows up
let NATIVE_FOR = null;
function nativeUrl(s) {
  if (!NATIVE_FOR) { if (!P.length) return null; NATIVE_FOR = {};
    [...P.map((_, i) => 'p' + i), ...W.map((_, i) => 'w' + i)].forEach(id => { const c = card(id); if (!c || !c.audio || !IDX[id] || RECORDING_OFF.has(id) || HIDE.has(id) || /[\/·(]/.test(c.ceb) || CEB_FIX[id]) return; const k = vkey(c.ceb); if (k && !NATIVE_FOR[k]) NATIVE_FOR[k] = id; }); }
  const id = NATIVE_FOR[vkey(s)]; return id ? clipUrl(id) : null;
}
function clipUrl(id) {
  if (urls[id]) return urls[id];
  // a card split into one way of saying it can't use a recording that says both ways (audio is off for those)
  const c = card(id), rid = (c && c.rec) || id, buf = SPR[rid[0]], ix = !RECORDING_OFF.has(rid) && c && c.audio && IDX[rid]; if (!buf || !ix) return c ? voiceUrl(c.ceb) : null;
  return (urls[id] = URL.createObjectURL(new Blob([buf.slice(ix[0], ix[0] + ix[1])], { type: 'audio/mpeg' })));
}
async function playUrl(u, rate, btn) {
  if (!u) return;
  const tok = ++playToken;
  document.querySelectorAll('.playing').forEach(b => b.classList.remove('playing'));
  player.pause(); if (player.src !== u) player.src = u; try { player.currentTime = 0; } catch (e) { } player.playbackRate = rate || 1; player.preservesPitch = true;
  if (btn) btn.classList.add('playing');
  await new Promise(res => { player.onended = res; player.onerror = res; player.onpause = res; player.play().then(() => { player.playbackRate = rate || 1; }).catch(res); });
  if (btn && tok === playToken) btn.classList.remove('playing');
}
const play = async (id, rate, btn) => { const r = ++playReq, cx = audioCtx(); let u = clipUrl(id); const c = card(id); if (!u && c && hasVoice(c.ceb)) { u = await voiceUrlA(c.ceb); if (!stillWanted(r, cx)) return; } if (u) return playUrl(u, rate, btn); if (c) sayFallback(firstAlt(c.ceb)); };
function stopAudio() { playToken++; playReq++; player.pause(); try { speechSynthesis.cancel(); } catch (e) { } }

function weakList(n = 6) { return Object.entries(S.mistakes || {}).sort((a, b) => b[1].n - a[1].n).slice(0, n); }
/* ---------- keyboard: 1-9 picks an answer, Enter presses the main button ---------- */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea';
  const vis = el => el && !el.disabled && el.offsetParent !== null;
  // Space replays the clip, S plays it slowly
  if (!typing && (e.key === ' ' || e.key === 's' || e.key === 'S')) { const b = (e.key === ' ' ? ['#pl', '#fplay', '#pl2'] : ['#pls']).map(s => document.querySelector(s)).find(vis); if (b) { e.preventDefault(); b.click(); return; } }
  if (!typing && /^[1-9]$/.test(e.key)) { const opts = [...document.querySelectorAll('.opt, [data-o]')].filter(vis); const b = opts[+e.key - 1]; if (b) { e.preventDefault(); b.click(); } return; }
  if (e.key === 'Enter' && !e.shiftKey && !(typing && tag === 'textarea' && e.target.id !== 'tr') && !(typing && e.target.id === 'ans')) {
    if (typing && !['own', 'rep', 'tr', 'gen', 'gceb', 'myname'].includes(e.target.id)) return;
    if (typing && ['gen', 'gceb', 'myname'].includes(e.target.id)) return;
    const b = ['#cont', '#chk', '#nx', '#fin', '#sh', '#show', '#nextup', '#start', '#rushplay', '#again'].map(s => document.querySelector(s)).find(vis);
    if (b) { e.preventDefault(); b.click(); }
  }
});
/* ---------- pictures (Twemoji, matched to each card by meaning; see pics.js) ---------- */
const picFile = c => c && typeof PIC !== 'undefined' ? PIC[c.id] : null;
const picImg = (f, cls) => f ? `<img class="epic ${cls || ''}" src="img/e/${f}.svg" alt="" aria-hidden="true" loading="lazy">` : '';
const dlgPic = i => typeof PIC_X !== 'undefined' ? picImg(PIC_X.dlg[i], 'in') : '';
const rulePic = (r, cls) => typeof PIC_X !== 'undefined' ? picImg(PIC_X.rule[r.id], cls || 'in') : '';
/* ---------- views ---------- */
let view = 'home';
const VIEWS = {};
// background music: upbeat in Rush, calm in lessons and practice, off on menus and whenever you're speaking
// which music plays: each activity has its own set of tracks (music.js). Listening questions and the mic get silence.
const QUIET_TYPES = new Set(['speak', 'shadow', 'pron', 'say', 'replysay', 'listen', 'tiles', 'dict', 'hear2']);
function musicFor() {
  if (view === 'rush' || (view === 'geogame' && GG && !GG.practice)) return 'rush';
  if (view === 'session') { const it = Q[qi]; if (it && QUIET_TYPES.has(it.type)) return 'off'; return sess && sess.mode === 'daily' ? 'daily' : sess && ['speed', 'dict'].includes(sess.mode) ? 'off' : 'practice'; }
  if (view === 'build') return 'grammar';
  if (TAB_VIEWS.has(view) && HOME_SPK) return HOME_SPK.who;
  if (view === 'story' || view === 'stories') return 'stories';
  if (view === 'numbers' || view === 'numround') return 'numbers';
  if (['speedrun', 'retell'].includes(view)) return 'off';
  return ['real', 'geo', 'geogame', 'aboutme'].includes(view) ? 'practice' : 'off';
}
function render() { if (typeof GUIDE_V !== 'undefined' && (S.guideV || 0) < GUIDE_V && view !== 'guide') { guideAt = 0; guideBack = 'home'; view = 'guide'; } else if (typeof GUIDE_V !== 'undefined' && !S.placed && hasPack() && view !== 'place' && view !== 'guide') { initPlacement(); view = 'place'; } stopAudio(); clearInterval(timerH); const a = $('#app'); a.className = 'app ' + (TAB_VIEWS.has(view) ? 'tabbed' : 'lesson'); try { const ret = (VIEWS[view] || VIEWS.home)(); if (ret && ret.catch) ret.catch(e => renderCrash(e)); clearHealed(); } catch (e) {
    // a lesson or game screen redrawn after its lesson ended has nothing to show: go back to Today quietly
    if (!TAB_VIEWS.has(view)) { try { console.warn('left ' + view + ':', e.message); view = 'home'; a.className = 'app tabbed'; VIEWS.home(); } catch (e2) { renderCrash(e2); } }
    else renderCrash(e); } window.scrollTo(0, 0); if (typeof Music !== 'undefined') try { Music.set(musicFor()); } catch (e) { } try { muteBtn(); a11y(); } catch (e) { } }
// screen readers: on/off buttons say which is chosen, and text boxes get a name from their hint text
function a11y() { const r = $('#app'); r.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false'));
  r.querySelectorAll('input:not([aria-label]),textarea:not([aria-label])').forEach(i => { if (i.placeholder) i.setAttribute('aria-label', i.placeholder); }); }
/* A small speaker button pinned to the top-right corner of every screen: one tap mutes or unmutes the music. */
const MUTE_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const MUTE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function muteBtn() {
  let b = $('#mutebtn');
  if (!b) { b = document.createElement('button'); b.id = 'mutebtn'; b.type = 'button'; document.body.appendChild(b);
    b.onclick = () => { S.settings.music = S.settings.music === false; save(); if (typeof Music !== 'undefined') Music.set(musicFor()); muteBtn(); if (view === 'me') render(); toast(S.settings.music ? 'Music on' : 'Music off'); }; }
  const on = S.settings.music !== false; b.innerHTML = on ? MUTE_ON : MUTE_OFF; b.classList.toggle('off', !on);
  b.setAttribute('aria-label', on ? 'Mute music' : 'Turn music on'); b.title = on ? 'Mute music' : 'Turn music on';
  b.hidden = view === 'guide';
}
/* If a page fails to draw (usually a half-finished app update: a mix of old and new files), show the tabs and a
   reload button instead of a blank screen, and quietly fetch a clean copy of the app once. */
function clearHealed() { try { if (performance.now() > 60000 && /[?&]healed=/.test(location.search)) history.replaceState(null, '', location.pathname + location.search.replace(/[?&]healed=\d+/, '').replace(/^&/, '?')); } catch (x) { } }
function renderCrash(e) {
  try { console.error(e); } catch (x) { }
  const tries = +((location.search.match(/[?&]healed=(\d+)/) || [])[1] || 0), online = navigator.onLine !== false;
  if (tries < 1 && online) {
    const go2 = () => { const u = new URL(location.href); u.searchParams.set('healed', String(tries + 1)); location.replace(u.href); };
    if ('caches' in window) caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))).then(() => navigator.serviceWorker && navigator.serviceWorker.getRegistrations()).then(rs => Promise.all((rs || []).map(r => r.update()))).catch(() => { }).finally(go2); else go2();
  }
  const body = `<section class="panel"><h2>${online ? 'Updating Padayon…' : 'Something didn’t load'}</h2><p class="muted">Part of the app didn't load. ${tries < 1 && online ? 'Getting a fresh copy now.' : online ? 'Tap reload to try again.' : 'You look offline. Reconnect, then tap reload.'}</p><button class="btn primary" id="crashre">Reload</button></section>`;
  try { shell(TAB_VIEWS.has(view) ? view : 'home', body); } catch (x) { $('#app').innerHTML = body; }
  const b = $('#crashre'); if (b) b.onclick = () => location.reload();
}
let BINKO_N = (() => { try { const n = (+localStorage.getItem('padayon-binko') || 0) + 1; localStorage.setItem('padayon-binko', n); return n; } catch (e) { return Math.floor(Math.random() * 20); } })();
function go(v) { if (typeof stopRecorder === 'function') stopRecorder(); if (v === 'home' && view !== 'home') { if (HOME_SPK) HOME_SPK = nextFactTeller(); BINKO_N++; try { localStorage.setItem('padayon-binko', BINKO_N); } catch (e) { } } view = v; render(); }
function ringSvg(v, goal) { const r = 36, c = 2 * Math.PI * r, f = Math.min(1, v / goal); return `<svg class="ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="8"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 42 42)"/></svg>`; }
function unitRow(u, key) {
  const live = u.ids.filter(id => card(id)), n = live.length, l = learned(live), s = seen(live);   // hidden cards don't count, so a unit can reach 100%
  return `<div class="unit ${S.focus === key ? 'focus' : ''}"><div class="nm"><b>${esc(u.ceb)}</b> <span class="muted small">${esc(u.name)}</span></div>
  <button class="btn sm ghost" data-focus="${key}">${S.focus === key ? 'Focused' : 'Focus'}</button>
  <div class="bar" title="${l} learned, ${s} started of ${n}"><i style="width:${n ? (l / n) * 100 : 0}%"></i></div></div>`;
}
function sinceHtml() {
  if (!S.started) return `<div class="since">Your first day starts with today's session.</div>`;
  const d = new Date(S.started * 864e5 + new Date().getTimezoneOffset() * 60000 + 12 * 36e5);
  const days = today() - S.started + 1, active = Object.keys(S.xp).filter(k => S.xp[k] > 0).length, st = streakNow();
  return `<div class="since"><span>Padayon since <b>${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</b></span><span><b class="tnum">${days}</b> day${days === 1 ? '' : 's'} in · <b class="tnum">${active}</b> practiced</span>${st ? `<span>${I.flame.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"')} <b class="tnum">${st}</b>-day streak</span>` : ''}</div>`;
}
/* ---------- tabs: Today, Practice, Progress, Me. A bottom bar on phones, a left sidebar on wide screens ---------- */
const TI = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  rushhome: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 2.5h11v6.5a5.5 5.5 0 0 1-11 0z"/><path d="M17.5 4.8h2.7v2.1a3.6 3.6 0 0 1-3.4 3.6M6.5 4.8H3.8v2.1a3.6 3.6 0 0 0 3.4 3.6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path fill="currentColor" d="M10.3 13.6h3.4v3.9h-3.4z"/><rect x="6.5" y="17.3" width="11" height="4.2" rx="1.4" fill="currentColor"/></svg>',
  board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V14h5v7M9.5 21V9h5v12M16 21v-9h5v9"/><path d="M12 3.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 5.3l2-.3z" fill="currentColor" stroke-width="1"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
};
const TABS = [['home', 'Today'], ['practice', 'Practice'], ['rushhome', 'Games'], ['board', 'Ranks'], ['me', 'Me']];
const TAB_VIEWS = new Set(TABS.map(t => t[0]));
let lastTab = 'home';
const goTab = () => go(lastTab);
function shell(tab, html) {
  lastTab = tab;
  $('#app').innerHTML = `<nav class="tabs" aria-label="Tabs"><div class="tabs-brand">Padayon</div>
    ${TABS.map(([k, l]) => `<button class="tab ${k === tab ? 'on' : ''}" data-tab="${k}" ${k === tab ? 'aria-current="page"' : ''}>${TI[k]}<span>${l}</span>${k === 'rushhome' && S.rushBest ? `<span class="tbadge tnum" aria-label="Best ${S.rushBest}">${S.rushBest}</span>` : ''}</button>`).join('')}
    <div class="tabs-me">${Sync.user ? `<img src="icon-192.png?v=full" alt=""><span><b>${esc(displayName())}</b><span class="small" style="color:var(--good)">Synced</span></span>` : ''}</div></nav>
    <div class="tabmain">${html}</div>`;
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
}
const streakChip = () => `<span class="stat tnum" title="Day streak"><span class="flame">${I.flame}</span>${streakNow()} day${streakNow() === 1 ? '' : 's'}</span>`;
function statTrio() {
  const a = acc7();
  return `<section class="trio"><div class="st"><b class="tnum" style="color:var(--copper)">${streakNow()}</b><span>day streak · best ${S.streak.best || 0}</span></div>
    <div class="st"><b class="tnum" style="color:var(--sea)">${learnedCount()}</b><span>words learned</span></div>
    <div class="st"><b class="tnum" style="color:var(--good)">${a.n ? a.pct + '%' : '–'}</b><span>${a.n ? 'right, last 7 days' : 'accuracy shows after a few answers'}</span></div></section>`;
}
function stageMini() {
  const { stats, cur } = pathState(), x = stats[cur], tl = pathTimeline();
  return `<section class="panel"><div class="row spread"><h2>Stage ${cur + 1} · ${esc(PATH[cur].name)}</h2><button class="linkbtn" id="jmapgo" onclick="JMAP_JUMP=1;go('practice')">Path map</button></div>
    <div class="bar"><i style="width:${x.frac * 100}%"></i></div><div class="muted small">${x.learned} of ${x.total} learned${tl[cur] ? ' · done around ' + dateIn(tl[cur]) : ''}</div></section>`;
}
function sinceShort() {
  if (!S.started) return 'Your first day starts today';
  const d = new Date(S.started * 864e5 + new Date().getTimezoneOffset() * 60000 + 12 * 36e5);
  return `Day ${today() - S.started + 1} · since ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
/* Phrase of the day: one line you already know, to actually say to someone in the family today */
function podPick() {
  const t = calDay(), ok = id => { const c = card(id); if (!c) return false; const n = tokens(firstAlt(c.ceb)).length; return n >= 2 && n <= 7; };
  let pool = Object.keys(S.cards).filter(id => /^[pd]/.test(id) && S.cards[id].b >= 1 && ok(id)).sort();
  if (pool.length < 3) pool = PATH[0].ids.filter(id => /^[p]/.test(id) && ok(id)).slice(0, 20);
  return pool.length ? card(pool[(t * 7919) % pool.length]) : null;
}
const POD_TIPS = ['Say it to someone in the family today: in person, on a call, or in the group chat.', 'Bonus points if you say it to Lola or Lolo. Binko predicts a big smile!', 'Drop it in the family chat and see who answers in Bisaya.', 'Say it at dinner. Binko dares you!', 'Use it on a call today. Even a 10-second call counts.'];
function podHtml() {
  const c = podPick(); if (!c) return ''; const done = S.pod && S.pod.d === calDay();
  return `<section class="panel pod"><div class="row spread"><div class="label">Phrase of the day</div>${done ? '<span class="tag soft">✓ Said it</span>' : ''}</div>
    <div class="row" style="gap:10px;align-items:center">${picImg(picFile(c), 'md')}<div style="min-width:0"><div class="ceb" style="font-size:1.5rem">${esc(firstAlt(c.ceb))}</div><div>${esc(firstAlt(c.en))}</div>${phonHtml(c.ceb)}</div></div>
    <p class="small muted" style="margin:0">${esc(POD_TIPS[calDay() % POD_TIPS.length])}</p>
    <div class="row">${canHear(c) ? `<button class="btn ghost" id="podplay" data-id="${c.id}">${I.play} Hear it</button>` : ''}${done ? '' : '<button class="btn primary" id="podsaid">I said it!</button>'}</div></section>`;
}
function wirePod() {
  if ($('#podplay')) $('#podplay').onclick = e => play(e.currentTarget.dataset.id, 1, e.currentTarget);
  if ($('#podsaid')) $('#podsaid').onclick = () => { S.pod = { d: calDay() }; save(); toast(pick(['Maayo kaayo! Binko is proud of you!', 'Nindot! That counts as real Bisaya!', 'BINKO REPORTING: phrase delivered!'])); render(); };
}
let showDone = false;
// Binko opens every visit to the app with the day's plan and what needs work from last time
const cardLabel = id => { const c = card(id); return !c ? '' : c.kind === 'r' ? `the "${c.ceb}" rule` : firstAlt(c.ceb); };
function binkoPlan() {
  const h = new Date().getHours(), hi = h < 12 ? 'Maayong buntag' : h < 18 ? 'Maayong hapon' : 'Maayong gabii';
  const nm = displayName(), name = nm === 'Someone' ? '' : ', ' + esc(nm);
  const plan = planDay(), nx = planNext(), due = dueIds().length, nw = Math.min(newAllowance(), pickNew().length), nr = nextRule();
  const weak = needsWork().filter(id => card(id)).slice(0, 3).map(id => `<b>${esc(cardLabel(id))}</b>`);
  const list = x => x.length < 2 ? x.join('') : x.slice(0, -1).join(', ') + ' and ' + x[x.length - 1];
  let s = 'Binko here!';
  const rs = loadResume(); if (rs) return [s + ` You stopped at question <b>${rs.qi + 1} of ${rs.Q.length}</b> last time. Binko saved your spot, so tap Continue and we'll pick right back up!`, `${hi}${name}!`];
  if (!plan.session) {
    const parts = []; const dueN = Math.min(due, reviewRoom()); if (dueN) parts.push(`<b>${dueN}</b> review${dueN === 1 ? '' : 's'}`); if (nw) parts.push(`<b>${nw}</b> new word${nw === 1 ? '' : 's'}`);
    s += parts.length ? ` Today's session has ${list(parts)}` : ' Today\'s session is ready'; s += nr && !S.cards[ruleCardId(nr)] ? `, plus a new grammar rule: <b>${esc(nr.title)}</b>.` : '.';
    const np = newPlan(), pref = S.settings.newPerDay || 8, cap = S.newDay.cap != null ? S.newDay.cap : np.n;
    if (cap < pref && np.why === 'backlog') s += ` You picked ${pref} new words a day, but <b>${due}</b> old ones are waiting, so Binko is giving you ${cap ? cap + ' new today' : 'no new ones today'} and more room for reviews. Words you don't practice slip away!`;
    else if (cap < pref && np.why === 'accuracy') s += ` Recent answers were ${np.pct}% right, so Binko is holding new words to ${cap} today until the old ones feel solid.`;
    else if (nw) s += ' Ooh, new words! Binko can\'t wait to find out what they mean with you!';
    if (weak.length) s += ` Last time, ${list(weak)} gave you trouble, so Binko put ${weak.length === 1 ? 'it' : 'them'} first today. Watch closely!`;
    else if (Object.keys(S.cards).length) s += ' Nothing tripped you up last time. SUPER DUPER!';
    else s += ' This is your very first lesson. Binko is SO excited!';
  } else s += nx ? ` Today's session is done! Next up: <b>${esc(nx.name)}</b>.` : ' You finished everything today! Binko is doing a happy little spin.';
  return [s, `${hi}${name}!`];
}
let HOME_SPK = null;
VIEWS.home = function () {
  if (!HOME_SPK) HOME_SPK = { who: 'binko' };
  const t = today(), xp = S.xp[t] || 0, due = dueIds().length, nw = Math.min(newAllowance(), pickNew().length), plan = planDay();
  const items = planItems(), nextUp = planNext(), doneN = items.filter(i => isDone(i, plan)).length;
  const resumeAt = (!nextUp || nextUp.k === 'session') ? loadResume() : null;
  const open = items.filter(i => !isDone(i, plan)), done = items.filter(i => isDone(i, plan));
  const mins = Math.max(5, Math.round((Math.min(due, reviewRoom()) + nw * 2 + 2) * 0.6));
  const SHORT = { session: 'Reviews and new words', convo: 'Read it, then say your part', speed: 'Listening at ' + S.speed.toFixed(1) + '×', dict: 'Type what you hear', shadow: 'Speak along with one unit', talk: 'Call or chat with family, then tick it' };
  const shortOf = it => it.locked ? 'Opens soon' : it.k === 'build' ? (nextRule() ? 'New rule: ' + nextRule().title : 'Make your own sentences') : it.k === 'real' ? (it.d || '').split('.')[0] : SHORT[it.k] || it.d;
  const row = it => { const d = isDone(it, plan), nx = nextUp && it.k === nextUp.k;
    return `<div class="prow ${d ? 'done' : ''}"><button class="box ${d ? 'on' : ''}" data-plan="${it.k}" ${it.manual ? '' : 'disabled title="Ticks itself when you finish"'} aria-label="${esc(it.name)}">${d ? I.check : ''}</button>
      <button class="prow-main" ${!d && !it.manual && !it.locked ? `data-run="${it.k}"` : 'disabled'}><b>${esc(it.name)}${it.locked ? ' 🔒' : ''}</b><span class="muted small">${esc(nx ? 'Up next' : shortOf(it))}</span></button>
      ${nx ? '<span class="tag">Next</span>' : !d && !it.manual && !it.locked ? `<span class="chev">${TI.chev}</span>` : ''}</div>`; };
  shell('home', `
  <div class="top"><h1 class="brand-sm">Padayon</h1><div class="stats">${streakChip()}</div></div>
  ${!hasPack() ? `<section class="banner"><b>Finish setting up</b>
    ${packState === 'loading' ? `<div class="small">Downloading 225 phrases and 1,002 words with native recordings… <b id="packpct">${packPct}%</b> (about 10 MB, one time only)</div>` : `<div class="small">${packState === 'error' ? "The phrases and recordings didn't download. Check your connection and try again." : 'Phrases and recordings are not loaded yet.'}</div><button class="btn primary" id="packretry">Download phrases and recordings</button>`}
  </section>` : ''}
  <div class="today-grid"><div class="today-main">
  <section class="hero h-${HOME_SPK.who}">
    <div class="hero-guide">${HOME_SPK.who === 'binko' ? (p => cloverSays('binko', p[0], true, p[1]))(binkoPlan()) : cloverSays(HOME_SPK.who, HOME_SPK.html, true, HOME_SPK.kick)}</div>
    <div class="hero-text"><div class="label">Karon nga adlaw · Today</div><h2>${nextUp ? esc(nextUp.name) : 'All done today. Padayon!'}</h2>
      <p>${resumeAt ? `Picking up where you left off · question ${resumeAt.qi + 1} of ${resumeAt.Q.length}` : nextUp ? esc(nextUp.k === 'session' ? `About ${mins} minutes · ${Math.min(due, reviewRoom())} review${Math.min(due, reviewRoom()) === 1 ? '' : 's'}, ${nw} new` : nextUp.d) : 'Come back tomorrow, or do another session.'}</p></div>
    <div class="hero-actions"><button class="btn" id="start">${resumeAt ? 'Continue' : nextUp ? (nextUp.manual ? 'I did it' : 'Start') : 'Do another session'}<kbd>Enter</kbd></button></div>
    <div class="hero-foot"><span>${sinceShort()}</span><span>${freezePending() ? `🧊 Freeze ready: finish today to keep your ${S.streak.count}-day streak` : freezeOk(calDay() + 1) ? '🧊 Streak freeze ready' : `Best streak ${S.streak.best || 0}`}</span></div>
  </section>
  ${false ? `<section class="banner"><b>Already know some Bisaya?</b><div class="small">Take the 5-minute placement check and skip the words you already know.</div><div class="row"><button class="btn primary" id="placego2">Take the check</button><button class="btn ghost" id="placeno">No thanks</button></div></section>` : ''}
  ${podHtml()}
  <section class="panel plan"><div class="row spread"><h2>Today's plan</h2><span class="muted small tnum">${doneN} of ${items.length} done</span></div>
    <div class="bar"><i style="width:${doneN / items.length * 100}%"></i></div>
    <div class="plist">${open.map(row).join('')}${showDone ? done.map(row).join('') : ''}</div>
    ${done.length ? `<button class="donebar" id="showdone">${I.check}<span>Done: ${esc(done.map(i => i.name.replace("Today's ", '')).join(', '))}</span><b>${showDone ? 'Hide' : 'Show'}</b></button>` : ''}
  </section>${typeof webHtml === 'function' ? webHtml() : ''}</div>
  <div class="today-side">${WIDE.matches ? statTrio() + stageMini() + boardPanel() : ''}</div></div>`);
  if (typeof wireWeb === 'function') wireWeb();
  $('#start').onclick = () => { if (resumeAt) return binkoBump(startSession); if (!nextUp) return planDay().session ? go('again') : binkoBump(startSession); if (nextUp.manual) { tick(nextUp.k); return render(); } binkoBump(() => nextUp.run()); };
  startSpecials();
  document.querySelectorAll('[data-run]').forEach(b => b.onclick = () => planItems().find(i => i.k === b.dataset.run).run());
  if ($('#showdone')) $('#showdone').onclick = () => { showDone = !showDone; render(); };
  wirePod();
  if ($('#placego2')) { $('#placego2').onclick = startPlacement; $('#placeno').onclick = () => { S.placed = 1; save(); render(); }; }
  wireBoard(); loadBoard();
  if ($('#packretry')) $('#packretry').onclick = autoPack;
  document.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => { const p = planDay(); p[b.dataset.plan] = !p[b.dataset.plan]; save(); render(); });
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
};
function practiceRow(o) {
  return `<button class="prac" ${o.id ? `id="${o.id}"` : ''} ${o.go ? `data-go="${o.go}"` : ''}><span class="pic" style="color:${o.c}">${o.icon}</span>
    <span class="pt"><span class="small muted">${o.sub}</span><b>${o.name}</b></span>${o.badge ? `<span class="tag ${o.hot ? 'hot' : 'soft'}">${o.badge}</span>` : `<span class="chev">${TI.chev}</span>`}</button>`;
}
const PI = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  bolt: I.bolt, pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4a8 8 0 1 1 16-4z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  blocks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="6" rx="1.5"/><rect x="14" y="4" width="7" height="6" rx="1.5"/><rect x="7" y="14" width="10" height="6" rx="1.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>',
  redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2 6"/><path d="M20 4v7h-7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
};
VIEWS.practice = function () {
  const lk = k => DRILL_MIN[k] && drillLock(k) ? 'Opens soon' : '';
  const ruleN = RULES.filter(r => ruleLearned(r.id)).length, realOpen = realItems().filter(x => x.open).length, plan = planDay();
  const g = (name, color, rows) => `<section class="pgroup"><h2 class="glabel" style="color:${color}">${name}</h2><div class="plist2">${rows.map(practiceRow).join('')}</div></section>`;
  shell('practice', `<div class="ptitle"><h1>Practice</h1><p class="muted">Extra practice, any time. Today's plan lives on the Today tab.</p></div>
  <div class="pgrid">
  ${g('Listen', 'var(--sky)', [
    { go: 'speed', icon: PI.bolt, c: 'var(--sky)', sub: 'Paspas', name: 'Speed round', badge: lk('speed') || S.speed.toFixed(1) + '×' },
    { id: 'dictgo', icon: PI.pen, c: 'var(--sky)', sub: 'Isulat · type what you hear', name: 'Dictation', badge: lk('dict') }])}
  ${g('Speak', 'var(--pink)', [
    { go: 'shadow', icon: I.mic, c: 'var(--pink)', sub: 'Sundog · speak along', name: 'Shadowing', badge: lk('shadow') },
    { go: 'convos', icon: PI.chat, c: 'var(--pink)', sub: 'Istorya · play your part', name: 'Conversations' },
    { go: 'aboutme', icon: PI.pen, c: 'var(--pink)', sub: 'Answer questions about your own life', name: 'Tell me about you' },
    { go: 'retell', icon: PI.clock, c: 'var(--pink)', sub: '4-3-2 · say it in 60, 45, then 30 seconds', name: 'Retell it faster' },
    { id: 'talkgo', icon: PI.phone, c: 'var(--pink)', sub: 'Estorya · call or chat with family', name: 'Talk out loud', badge: plan.talk ? 'Done today' : 'Tick it' }])}
  ${g('Build &amp; read', 'var(--good)', [
    { id: 'buildgo', icon: PI.blocks, c: 'var(--good)', sub: 'Gramatika · learn a rule, then use it', name: 'Grammar', badge: ruleN + ' of ' + RULES.length },
    { go: 'rules', icon: PI.book, c: 'var(--good)', sub: 'Every rule, in plain words', name: 'Rule book' },
    { go: 'real', icon: PI.video, c: 'var(--good)', sub: 'Tinuod · posts, clips, songs', name: 'Real Bisaya', badge: realOpen + ' open' },
    { go: 'stories', icon: PI.book, c: 'var(--good)', sub: 'Sugilanon · short, silly family stories', name: "Binko's stories", badge: storyOpenN() + ' open' }])}
  ${typeof NUM !== 'undefined' && NUM.ready ? g('Numbers', 'var(--mango)', [
    { go: 'numbers', icon: PI.clock || PI.bolt, c: 'var(--mango)', sub: 'Numero ug oras · any number up to a billion', name: 'Numbers &amp; time' }]) : ''}
  ${g('Your words', 'var(--copper)', [
    { id: 'againgo', icon: PI.redo, c: 'var(--copper)', sub: 'A quick round, or start tomorrow', name: 'Another session' },
    { go: 'gaps', icon: PI.plus, c: 'var(--copper)', sub: 'English you keep reaching for', name: 'Gap words', badge: S.custom.length ? String(S.custom.length) : '' }])}
  ${typeof mapHtml === 'function' ? mapHtml() : ''}
  </div>`);
  if (typeof wireMap === 'function') wireMap();
  $('#dictgo').onclick = startDictation;
  $('#buildgo').onclick = () => buildLock() ? go('rules') : startBuild();
  $('#againgo').onclick = () => planDay().session ? go('again') : startSession();
  $('#talkgo').onclick = () => { const p = planDay(); p.talk = !p.talk; save(); toast(p.talk ? 'Ticked for today. Maayo!' : 'Unticked'); render(); };
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
};
/* Padayon Rush has its own tab: your best, the family's best runs, and a big Play button */
/* The Games tab: Padayon Rush, the two map games, and Study the map */
VIEWS.rushhome = function () {
  const me = Sync.user && Sync.user.uid, gb = S.geoBest || {};
  const top = (f, unit) => { if (!Sync.user || !BOARD) return ''; const rows = BOARD.filter(r => (r[f] || 0) > 0).sort((a, b) => b[f] - a[f]).slice(0, 3); return rows.length ? `<ol class="blist mini">${rows.map((r, i) => `<li class="${r.uid === me ? 'me' : ''}"><span class="rk">${['🥇', '🥈', '🥉'][i]}</span><b>${esc(rowName(r))}</b><span class="muted small">${r[f]} ${unit} · ${HOW(r[f + 'How'])}</span></li>`).join('')}</ol>` : '<p class="muted small" style="margin:0">Nobody has a score yet. Be the first!</p>'; };
  const gh = S.geoHow || {}, howOf = { rush: S.rushHow, geoP: gh.prov, geoL: gh.lang };
  const card = (id, emoji, name, desc, best, f, extra) => `<section class="game-card"><div class="row" style="gap:12px;align-items:center"><span class="game-emo">${emoji}</span><div style="flex:1;min-width:0"><b class="game-name">${name}</b><div class="small muted">${desc}</div></div><div class="game-best"><span class="label">Best</span><b class="tnum">${best}</b>${best ? `<span class="howtag">${HOW(howOf[f]) === 'typed' ? 'typed' : 'choice'}</span>` : ''}</div></div>
    <div class="row">${extra || ''}<button class="btn primary" id="${id}">Play</button></div><div class="small muted" style="margin-top:2px">Family best</div>${top(f, 'in a row')}</section>`;
  shell('rushhome', `<div class="ptitle"><h1>Games</h1><p class="muted">Every word in the app, and every province in the Philippines. One miss ends a run.</p></div>
  <section class="panel inpanel">${inputToggle()}<p class="muted small" style="margin:0">${rushTyped() ? 'Typing: write each answer yourself. You get more time, small typos are fine.' : 'Multiple choice: pick from four answers.'} Works for all three games. Scores note which one you used.</p></section>
  <div class="games-grid">
  ${card('rushplay', '🏆', 'Padayon Rush', 'Hear a word, pick its meaning. Easy to hard, faster and faster.', S.rushBest || 0, 'rush')}
  ${card('geoprov', '🗺️', 'Province Rush', 'A province lights up on the map. Name it! Faster and faster.', gb.prov || 0, 'geoP', '<button class="btn ghost" id="geoprovp">Practice</button>')}
  ${card('geolang', '🗣️', 'Language Rush', 'A province lights up. What do most people speak there? Faster and faster.', gb.lang || 0, 'geoL', '<button class="btn ghost" id="geolangp">Practice</button>')}
  <section class="game-card study"><div class="row" style="gap:12px;align-items:center"><span class="game-emo">📍</span><div style="flex:1"><b class="game-name">Study the map</b><div class="small muted">Explore every province, its region and its language before you play. Practice rounds don't end on a miss and don't count for the leaderboard.</div></div></div><button class="btn ghost block" id="geostudy">Open the map</button></section>
  </div>`);
  wireToggle();
  $('#rushplay').onclick = startRush;
  $('#geoprov').onclick = () => startGeo('prov'); $('#geoprovp').onclick = () => startGeo('prov', true);
  $('#geolang').onclick = () => startGeo('lang'); $('#geolangp').onclick = () => startGeo('lang', true);
  $('#geostudy').onclick = () => go('geo');
  loadGeo();
  if (Sync.user && !BOARD && !boardErr) loadBoard().then(() => { if (view === 'rushhome' && (BOARD || boardErr)) render(); });
};
function progressHtml() {
  const weak = weakList(5);
  return `<div class="ptitle"><h1>Me</h1><p class="muted">${S.started ? 'Padayon since ' + new Date(S.started * 864e5 + new Date().getTimezoneOffset() * 60000 + 12 * 36e5).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + (today() - S.started + 1) + ' days in' : 'Your first day starts with today\'s session.'}</p></div>
  <div class="prog-grid"><div class="prog-main">${statTrio()}<section class="panel jentry"><div class="row spread"><h2>🌱 Then and now</h2><button class="btn primary sm" data-jgo="then">Open</button></div><p class="small muted" style="margin:0">Day 1 next to today: words, rules, sentences you could say. Your word web is on <b>Today</b> and your path map on <b>Practice</b>.</p></section>${pathPanel()}</div><div class="prog-side">
  ${weak.length ? `<section class="panel"><h2>Your weak spots</h2><div>${weak.map(([k, v]) => `<div class="weak"><span class="n tnum">${v.n}×</span><div style="min-width:0"><b>${esc(k)}</b><div class="small muted">${esc(v.fix)}</div></div></div>`).join('')}</div></section>` : ''}
  <section class="panel"><details><summary><b>Browse every unit</b> <span class="muted small">· jump ahead with Focus</span></summary><div style="display:grid;gap:12px;margin-top:10px">
  <div class="panel"><div class="row spread"><h2>Foundations</h2><span class="muted small tnum">${learned(F_ORDER)} of ${F.length} learned</span></div>
    <p class="muted small" style="margin:0">How words fit together: who, whose, have, like, questions, and when. Each block comes with sentences you build yourself.</p>
    <div>${F_UNITS.map((u, i) => unitRow(u, 'f' + i)).join('')}</div></div>
  <div class="panel"><div class="row spread"><h2>How Bisaya really works</h2><span class="muted small tnum">${learned(GRAM_ORDER)} of ${G.length} learned</span></div>
    <p class="muted small" style="margin:0">Shortcuts, little words, and verb endings that make fast speech hard to follow.</p>
    <div>${GRAM_UNITS.map((u, i) => unitRow(u, 'g' + i)).join('')}</div></div>
  ${hasPack() ? `<div class="panel"><div class="row spread"><h2>Phrases</h2><span class="muted small tnum">${learned(PHRASE_ORDER.filter(id => card(id)))} of ${PHRASE_ORDER.filter(id => card(id)).length} learned</span></div>
    <p class="muted small" style="margin:0">Tap Focus to pull a unit's phrases to the front.</p><div>${UNITS.map((u, i) => unitRow(u, 'u' + i)).join('')}</div></div>
  <div class="panel"><details><summary>Common words <span class="muted small tnum">· ${(x => learned(x) + ' of ' + x.length)(W.map((_, i) => 'w' + i).filter(id => card(id)))} learned</span></summary>
    <div style="margin-top:8px">${WORD_UNITS.map((u, i) => unitRow(u, 'k' + i)).join('')}</div></details></div>
  <div class="panel"><details><summary>Mega-deck topics <span class="muted small tnum">· ${(x => learned(x) + ' of ' + x.length)(M_ORDER.filter(id => card(id)))} learned</span></summary>
    <p class="muted small" style="margin:8px 0 0">From the Cebuano Mega-Deck: Peace Corps phrases, everyday sayings, numbers, family, food, body, home and more. Tap Focus to study a topic first.</p>
    <div style="margin-top:8px">${M_UNITS.map((u, i) => unitRow(u, 'm' + i)).join('')}</div></details></div>` : ''}
  </div></details></section></div></div>`;
}
function wireProgress() { document.querySelectorAll('[data-jgo]').forEach(b => b.onclick = () => go('journey')); document.querySelectorAll('[data-focus]').forEach(b => b.onclick = () => { S.focus = S.focus === b.dataset.focus ? null : b.dataset.focus; save(); render(); toast(S.focus ? 'New cards will come from this unit first' : 'Back to the normal order'); }); }
VIEWS.progress = function () { go('me'); };
VIEWS.board = function () {
  shell('board', `<div class="ptitle"><h1>Leaderboard</h1><p class="muted">How the family is doing. Scroll for every ranking.</p></div><div class="board-wrap">${boardBoxes()}</div>`);
  wireBoard(); loadBoard();
};
VIEWS.settings = function () { go('me'); };
VIEWS.me = function () {
  const st = S.settings;
  shell('me', `${progressHtml()}
  <h2 class="glabel" style="color:var(--muted);margin-top:8px">Account and settings</h2>
  <div class="me-grid">
  <section class="panel acct"><img src="icon-192.png?v=full" alt=""><div style="flex:1;min-width:0"><b style="font-size:1.1rem">${esc(displayName())}</b><div class="small syncline">${syncLine()}</div></div>
    <button class="btn sm ${Sync.user ? 'ghost' : 'primary'} syncbtn" id="syncset">${Sync.user ? 'Sign out' : 'Sign in with Google'}</button></section>
  <section class="panel"><h2>Your name</h2>
    <p class="small muted" style="margin:0">Binko uses this when he announces your finished lessons in the family Discord, and on the leaderboard.</p>
    <div class="keybox"><input class="field" id="myname" placeholder="${esc(displayName())}" value="${esc(S.settings.name || '')}"><button class="btn primary" id="savename">Save</button></div></section>
  <section class="panel"><h2>Daily cards</h2>
    ${[['newPerDay', 'New cards per day', [5, 8, 10, 15]]].map(([f, l, opts]) => `<div><div class="label">${l}</div><div class="seg" data-set="${f}">${opts.map(n => `<button class="${st[f] === n ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div></div>`).join('')}
    <div><div class="label">Background music</div><div class="seg" id="musicseg"><button class="${S.settings.music !== false ? 'on' : ''}" data-m="1">On</button><button class="${S.settings.music === false ? 'on' : ''}" data-m="0">Off</button></div></div>
    <div><div class="label">Music volume</div><input type="range" min="0" max="100" step="5" class="vol" id="mvol" value="${Math.round((S.settings.musicVol == null ? 0.4 : S.settings.musicVol) * 100)}" aria-label="Music volume"></div>
    <div><div class="label">Sound effects</div><div class="seg" id="sfxseg"><button class="${S.settings.sfx !== false ? 'on' : ''}" data-m="1">On</button><button class="${S.settings.sfx === false ? 'on' : ''}" data-m="0">Off</button></div></div>
    <div><div class="label">Sound effects volume</div><input type="range" min="0" max="100" step="5" class="vol" id="svol" value="${Math.round((S.settings.sfxVol == null ? 0.4 : S.settings.sfxVol) * 100)}" aria-label="Sound effects volume"></div>
    <div><div class="label">Vibration</div><div class="seg" id="vibseg"><button class="${S.settings.vibe !== false ? 'on' : ''}" data-m="1">On</button><button class="${S.settings.vibe === false ? 'on' : ''}" data-m="0">Off</button></div><p class="small muted" style="margin:4px 0 0">Android phones only; iPhones don't let websites vibrate.</p></div>
    <p class="muted small" style="margin:0">${minsText(st.newPerDay || 8)} This is the most you'll get: when old words pile up or answers get shaky, Binko gives fewer new ones until you catch up.</p><p class="muted small" style="margin:0">🎵 ${IPHONE_MUSIC}</p></section>
  <section class="panel"><h2>Your data</h2>
    <p class="small muted" style="margin:0">${hasPack() ? `Word pack loaded: ${P.length} phrases and ${W.length} words with recordings.` : 'Word pack not loaded yet.'}</p>
    <div class="row"><button class="btn" id="exp">Save a backup</button><button class="btn ghost" id="imp">Restore a backup</button></div>
    <div class="row"><button class="btn ghost" id="pack3">${hasPack() ? 'Reload word pack' : 'Download word pack'}</button><button class="btn ghost" id="pack2">Load pack from a file</button></div></section>
  ${flagsHtml()}
  <section class="panel"><h2>Already know some Bisaya?</h2><p class="small muted" style="margin:0">A quick placement check marks the words you already know as learned, so you skip ahead. About 5 minutes.</p><div class="row"><button class="btn ghost" id="placego">Take the placement check</button></div></section>
  <section class="panel"><h2>How Padayon works</h2><p class="small muted" style="margin:0">A quick tour of every part of the app.</p><div class="row"><button class="btn ghost" id="guidego">Show the guide</button></div></section>
  <section class="panel"><h2>Start over</h2><p class="small muted" style="margin:0">Erase all your progress: words, grammar rules, streak, XP and stats, on every device you're signed in on. Your name and settings stay. Tip: tap <b>Save a backup</b> above first, so you can load it back if you change your mind.</p>
    <div id="wipebox"><button class="btn ghost" id="wipego" style="color:var(--bad);border-color:var(--bad)">Reset all my progress</button></div></section>
  <section class="panel"><h2>About</h2><p class="small muted" style="margin:0">Made for the Balay Ta family. Computer voice: Meta MMS Cebuano (CC BY-NC 4.0). Pictures: Twemoji (CC BY 4.0). Music and sound effects: made by the app itself (Kulintang Morning, Rondalla Stroll, Bamboo Breeze, Marimba Pad, Lo-fi Jeepney, Rain on Nipa, Harana Night, Abaca Loom, Music Box Study, Lola's Tale, Island Dusk, Market Count, Tinikling Steps, Rush, Fiesta Rush, Sinulog Drums).</p></section>
  </div>`);
  wireProgress();
  document.querySelectorAll('#sfxseg button').forEach(b => b.onclick = () => { S.settings.sfx = b.dataset.m === '1'; save(); render(); if (S.settings.sfx && typeof Sfx !== 'undefined') Sfx.right(1); });
  document.querySelectorAll('#vibseg button').forEach(b => b.onclick = () => { S.settings.vibe = b.dataset.m === '1'; save(); render(); try { if (S.settings.vibe && navigator.vibrate) navigator.vibrate(30); } catch (e) { } });
  const mv = $('#mvol'); if (mv) mv.onchange = () => { S.settings.musicVol = +mv.value / 100; save(); if (typeof Music !== 'undefined') Music.volume(); };
  const sv = $('#svol'); if (sv) sv.onchange = () => { S.settings.sfxVol = +sv.value / 100; save(); if (typeof Sfx !== 'undefined') Sfx.right(1); };
  document.querySelectorAll('#musicseg button').forEach(b => b.onclick = () => { S.settings.music = b.dataset.m === '1'; save(); render(); toast(S.settings.music ? 'Music on. On iPhone, turn off silent mode to hear it.' : 'Music off'); });
  $('#guidego').onclick = () => openGuide('me');
  $('#wipego').onclick = () => { $('#wipebox').innerHTML = `<p class="small" style="margin:0 0 6px"><b>This can't be undone</b> (unless you saved a backup). Type <b>RESET</b> to confirm.</p><div class="keybox"><input class="field" id="wipetxt" autocomplete="off" autocapitalize="characters" placeholder="RESET"><button class="btn primary" id="wipeok" disabled style="background:var(--bad);border-color:var(--bad)">Erase</button></div><button class="btn ghost sm" id="wipeno" style="margin-top:6px">Cancel</button>`;
    const t = $('#wipetxt'); t.focus(); t.oninput = () => $('#wipeok').disabled = t.value.trim().toUpperCase() !== 'RESET';
    $('#wipeno').onclick = () => render(); $('#wipeok').onclick = () => { wipeProgress(); toast('Your progress was reset. Padayon from the start!'); go('home'); }; };
  $('#placego').onclick = startPlacement;
  if (FLAGS_ALL === null && Sync.user && !window.__flagsTried) (window.__flagsTried = 1, loadFlags()).then(r => { if (r && view === 'me') render(); });
  $('#syncset').onclick = () => Sync.user ? signOutSync() : signIn();
  $('#savename').onclick = () => { S.settings.name = $('#myname').value.trim(); save(); toast('Saved'); };
  document.querySelectorAll('[data-set]').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => { S.settings[g.dataset.set] = +b.dataset.v; save(); render(); }));
  $('#pack2').onclick = importPack; $('#pack3').onclick = () => { go('home'); autoPack(); };
  $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'padayon-progress-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); };
  $('#imp').onclick = () => { const fi = $('#filein'); fi.accept = '.json,application/json'; fi.value = ''; fi.onchange = async () => { try { const s = JSON.parse(await fi.files[0].text()); if (s.v !== 1) throw 0; S = migrate(s); S.wipedAt = Date.now(); clearResume(); save(); toast('Progress loaded'); go('home'); } catch (e) { toast('That is not a Padayon backup file.'); } }; fi.click(); };
};
/* ---------- Binko's stories ----------
   Short silly family stories, told by Binko a line at a time, each opening once you know every Bisaya word in it.
   Names and English loanwords (SM, pizza) don't count as words to learn. */
let VOCAB_ALL = null;
function storyMissing(s) {
  if (!VOCAB_ALL) { VOCAB_ALL = new Set(); PATH.flatMap(st => st.ids).forEach(id => { const c = card(id); if (c) tokens(c.ceb).forEach(t => VOCAB_ALL.add(lowTok(t))); }); }
  const kw = knownWords(), names = new Set(['lola', 'lolo', 'tita', 'tito', 'ate', 'kuya', 'mama', 'papa', 'binko', 'inday', 'dong', 'oi', 'uy', 'oy']), miss = new Set();
  s.lines.forEach(l => tokens(l[0]).forEach(t => { const w = lowTok(t); if (!w || names.has(w) || knownTok(w, kw)) return; if (!VOCAB_ALL.has(w) && !VOCAB_ALL.has(rootOf(w))) return; miss.add(w); }));
  return [...miss];
}
const storyOpenN = () => STORIES.filter(s => !storyMissing(s).length).length;
VIEWS.stories = function () {
  const rows = STORIES.map((s, i) => ({ s, i, miss: storyMissing(s), done: (S.storyDone || {})[i] }));
  const open = rows.filter(r => !r.miss.length), next = rows.filter(r => r.miss.length).sort((x, y) => x.miss.length - y.miss.length)[0];
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Binko's stories</h2></div>
    ${binkoSays(open.length ? 'Gather round! Binko has stories, and every word in them is one you know. Pick one!' : 'Binko is still polishing his stories. The first one opens soon!')}
    <div class="plist2">${open.map(r => `<button class="prac" data-story="${r.i}"><span class="pic" style="font-size:1.4rem">${r.s.emoji}</span><span class="pt"><span class="small muted">${r.done ? '✓ Read · ' : ''}Story ${r.i + 1}</span><b>${esc(r.s.title)}</b></span><span class="chev">${TI.chev}</span></button>`).join('')}</div>
    ${next ? `<section class="panel"><b>Next up: ${next.s.emoji} ${esc(next.s.title)}</b><div class="small muted">Opens after you learn ${next.miss.length} more word${next.miss.length === 1 ? '' : 's'}${next.miss.length <= 4 ? ': ' + esc(next.miss.join(', ')) : ''}. Keep doing your daily sessions!</div></section>` : ''}`;
  $('#quit').onclick = () => goTab();
  document.querySelectorAll('[data-story]').forEach(b => b.onclick = () => { ST = { i: +b.dataset.story, at: 0, en: {}, phase: 'read', qi: 0, right: 0 }; go('story'); });
};
let ST = null;
/* Choices you confirm: a tap only selects (it can be changed), Check grades it. Timed games (Rush, Speed, the map games) stay one tap.
   mount puts the Check button somewhere other than the foot; hint is shown above it. */
function pickThenCheck(sel, onGrade, hint, mount) {
  const btns = [...document.querySelectorAll(sel)]; let pick = null;
  const html = `${hint ? `<div class="small muted">${hint}</div>` : ''}<button class="btn primary block" id="chk" disabled>Check</button>`;
  if (mount) mount(html); else foot(html);
  btns.forEach(b => b.onclick = () => { if (b.disabled) return; btns.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); pick = b; $('#chk').disabled = false; });
  $('#chk').onclick = () => { if (!pick) return; $('#chk').disabled = true; btns.forEach(x => { x.disabled = true; x.classList.remove('sel'); }); onGrade(pick); };
  return btns;
}
VIEWS.story = function () {
  const s = STORIES[ST.i];
  const head = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">${s.emoji} ${esc(s.title)}</h2></div>`;
  const who = l => l[2] === 'n' ? 'Binko tells it' : l[2];
  if (ST.phase === 'read') {
    const shown = s.lines.slice(0, ST.at), last = ST.at >= s.lines.length;
    $('#app').innerHTML = `${head}<div class="ex">${binkoSays(esc(s.intro))}
      <div class="chat">${shown.map((l, j) => `<div class="msg ${l[2] === 'n' ? 'them' : 'me'}"><div class="small" style="opacity:.75">${esc(who(l))}</div><div style="font-weight:700">${esc(l[0])}</div>${ST.en[j] ? `<div class="tr">${esc(l[1])}</div>` : `<button class="linkbtn" data-en="${j}" ${l[2] === 'n' ? '' : 'style="color:inherit"'}>English</button>`} ${hasVoice(l[0]) ? `<button class="play sm" data-vs="${esc(l[0])}" aria-label="Play">${I.play}</button>` : ''}</div>`).join('')}</div>
      ${last ? binkoSays(esc(s.outro)) : ''}</div>
      <div class="foot"><button class="btn primary block" id="nx">${!ST.at ? 'Start the story' : last ? 'Quiz time!' : 'Next line'}</button></div>`;
    document.querySelectorAll('[data-en]').forEach(b => b.onclick = () => { ST.en[+b.dataset.en] = 1; render(); });
    document.querySelectorAll('[data-vs]').forEach(b => b.onclick = () => playSentence(b.dataset.vs, b));
    $('#nx').onclick = () => { if (last) { ST.phase = 'quiz'; return render(); } ST.at++; render(); const l = s.lines[ST.at - 1]; if (l) playSentence(l[0]); const m = document.querySelectorAll('.chat .msg'); if (m.length) m[m.length - 1].scrollIntoView({ block: 'nearest' }); };
  } else if (ST.phase === 'quiz' && ST.qi < s.q.length) {
    const q = s.q[ST.qi], opts = shuffle(q.a.map((t, i) => ({ t, ok: i === 0 })));
    $('#app').innerHTML = `${head}<div class="ex"><div class="label">Question ${ST.qi + 1} of ${s.q.length}</div><div class="prompt">${esc(q.q)}</div><div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.t)}</button>`).join('')}</div></div><div class="foot" id="foot"></div>`;
    pickThenCheck('.opt', b => {
      const o = opts[+b.dataset.i]; logAnswer(o.ok); if (o.ok) ST.right++;
      document.querySelectorAll('.opt').forEach((x, i) => { x.disabled = true; if (opts[i].ok) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
      foot(`<button class="btn primary block" id="cont">${ST.qi + 1 < s.q.length ? 'Next question' : 'Finish'}</button>`); $('#cont').onclick = () => { ST.qi++; render(); };
    });
  } else {
    S.storyDone = S.storyDone || {}; S.storyDone[ST.i] = 1; save();
    $('#app').innerHTML = `${head}<div class="ex">${binkoSays(ST.right === s.q.length ? `PERFECT! ${ST.right} of ${s.q.length}! Binko binks you understood every single word!` : `${ST.right} of ${s.q.length}! Binko is proud. Read it again any time!`, true)}</div><div class="foot"><button class="btn primary block" id="nx">More stories</button></div>`;
    $('#nx').onclick = () => go('stories');
  }
  $('#quit').onclick = () => go('stories');
};
/* ---------- "Sounds wrong?" ----------
   Anyone can flag a card. It's kept with their progress and shared with the family list (Firestore "flags",
   when the database allows it), so a native speaker can fix meanings, spellings, audio and examples. */
const FLAG_WHY = [['meaning', 'The meaning is wrong'], ['bisaya', 'The Bisaya is wrong or misspelled'], ['audio', "The audio doesn't match"], ['example', 'The example sounds wrong'], ['other', 'Something else']];
function flagBtn(id) { return id && id[0] !== 'r' ? `<button class="linkbtn flagbtn" data-flag="${id}">⚑ Sounds wrong?</button>` : ''; }
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-flag]'); if (!b) return;
  const id = b.dataset.flag, c = card(id); if (!c) return;
  const box = document.createElement('div'); box.className = 'panel flagbox';
  box.innerHTML = `<b>What's wrong with “${esc(firstAlt(c.ceb))}”?</b>${FLAG_WHY.map(([k, l]) => `<label class="flagopt"><input type="radio" name="fw" value="${k}"> ${l}</label>`).join('')}
    <input class="field" id="flagnote" placeholder="What should it be? (optional)"><div class="row"><button class="btn primary" id="flagsend">Send to the family list</button><button class="btn ghost" id="flagx">Cancel</button></div>`;
  b.replaceWith(box);
  box.querySelector('#flagx').onclick = () => box.replaceWith(b);
  box.querySelector('#flagsend').onclick = async () => {
    const why = (box.querySelector('input[name=fw]:checked') || {}).value || 'other', note = box.querySelector('#flagnote').value.trim().slice(0, 300);
    S.flags = S.flags || {}; S.flags[id] = { why, note, d: today() }; save();
    box.innerHTML = '<span class="small">Thanks! Binko wrote it down. ⚑</span>';
    try { if (Sync.user && window.firebase) await firebase.firestore().collection('flags').add({ id, ceb: firstAlt(c.ceb), en: firstAlt(c.en), why, note, by: displayName(), uid: Sync.user.uid, at: Date.now() }); } catch (err) { }
  };
}, true);
let FLAGS_ALL = null;
async function loadFlags() { try { if (!Sync.user || !window.firebase) return null; const q = await firebase.firestore().collection('flags').orderBy('at', 'desc').limit(200).get(); FLAGS_ALL = q.docs.map(d => d.data()); } catch (e) { FLAGS_ALL = null; } return FLAGS_ALL; }
function flagsHtml() {
  const mine = Object.entries(S.flags || {}).sort((x, y) => y[1].d - x[1].d);
  const fam = FLAGS_ALL && FLAGS_ALL.length ? FLAGS_ALL : null;
  const rows = fam ? fam.map(f => [f.id, f.why, f.note, f.by]) : mine.map(([id, f]) => [id, f.why, f.note, '']);
  if (!rows.length) return '';
  const label = k => (FLAG_WHY.find(x => x[0] === k) || [, k])[1];
  return `<section class="panel"><h2>Flagged cards</h2><p class="small muted" style="margin:0">${fam ? 'Everyone in the family' : 'Cards you flagged'}. Fixes go in the next update.</p>
    <div>${rows.slice(0, 40).map(([id, why, note, by]) => { const c = card(id); return c ? `<div class="weak"><span class="n">⚑</span><div style="min-width:0"><b>${esc(firstAlt(c.ceb))}</b> <span class="muted small">· ${esc(firstAlt(c.en))}</span><div class="small muted">${esc(label(why))}${note ? ': “' + esc(note) + '”' : ''}${by ? ' · ' + esc(by) : ''}</div></div></div>` : ''; }).join('')}</div></section>`;
}
/* ---------- placement check: test out of words you already know ----------
   Rounds walk up the path in growing steps. Each round asks 6 meanings from that stretch; 5 right marks the
   whole stretch (and everything before it) as known, so heritage speakers skip what they already have. */
const PLACE_CUTS = [0, 30, 80, 150, 260, 420, 650, 950, 1350, 1900, 2600, 3400, 99999];
let PL = null;
function startPlacement() { initPlacement(); go('place'); }
function initPlacement() {
  const ids = PATH.flatMap(s => s.ids).filter(id => { const c = card(id); return c && !['r', 'c'].includes(c.kind) && firstAlt(c.en); });
  PL = { ids, k: 0, qs: [], qi: 0, right: 0, marked: 0, done: false };
  plRound();
}
function plRound() {
  const lo = PLACE_CUTS[PL.k], hi = Math.min(PL.ids.length, PLACE_CUTS[PL.k + 1]);
  if (lo >= PL.ids.length) { PL.done = true; return; }
  const range = PL.ids.slice(lo, hi);
  PL.qs = shuffle(range.filter(id => !S.cards[id] || S.cards[id].b < 2)).slice(0, 6); PL.qi = 0; PL.right = 0; PL.range = [lo, hi]; PL.need = Math.min(5, PL.qs.length);
  if (PL.qs.length < 3) { plPass(); }
}
function plPass() {
  // everything up to the end of this stretch counts as known
  PL.ids.slice(0, PL.range[1]).forEach(id => { if (!S.cards[id] || S.cards[id].b < 2) { S.cards[id] = { b: 2, d: today() + 3 + Math.floor(Math.random() * 12), r: 2, w: 0 }; PL.marked++; } });
  S.placed = today(); save(); PL.k++; plRound();
}
VIEWS.place = function () {
  const head = `<div class="sbar">${S.placed ? `<button class="x" id="quit" aria-label="Stop">${I.x}</button>` : '<span style="width:44px"></span>'}<div class="prog"><i style="width:${Math.min(100, PL.k / (PLACE_CUTS.length - 1) * 100)}%"></i></div><span class="muted small tnum">Round ${PL.k + 1}</span></div>`;
  if (PL.done || PL.qi >= PL.qs.length && PL.right < PL.need) {
    if (!S.placed) { S.placed = today(); save(); }
    const st = pathState().cur;
    $('#app').innerHTML = `${head}<div class="ex">${binkoSays(PL.marked ? `BINKO REPORTING! You already know <b>${PL.marked}</b> words and phrases, so Binko marked them as learned. You're starting in <b>Stage ${st + 1}: ${esc(PATH[st].name)}</b>. They'll still come back now and then as quick reviews.` : "Binko binks we'll start from the beginning. That's great, every word will be new and fun!", true)}</div><div class="foot"><button class="btn primary block" id="pldone">Done</button></div>`;
    $('#pldone').onclick = () => go('home'); if ($('#quit')) $('#quit').onclick = () => go('home'); return;
  }
  if (PL.qi >= PL.qs.length) { plPass(); return render(); }
  const c = card(PL.qs[PL.qi]), pool = PL.ids.slice(Math.max(0, PL.range[0] - 40), PL.range[1] + 40).filter(id => id !== c.id).map(card).filter(Boolean);
  const opts = [c]; for (const d of shuffle(pool)) { if (opts.length >= 4) break; if (!opts.some(o => norm(o.en) === norm(d.en) || sameMeaning(o.en, d.en))) opts.push(d); }
  const o = shuffle(opts);
  $('#app').innerHTML = `${head}<div class="ex"><div class="label">Placement check · question ${PL.qi + 1} of ${PL.qs.length}</div><div class="ceb">${esc(firstAlt(c.ceb))}</div>
    ${canHear(c) ? `<div class="playrow"><button class="play sm" id="pl" aria-label="Play">${I.play}</button><span class="muted small">What does it mean?</span></div>` : '<div class="muted small">What does it mean?</div>'}
    <div class="opts">${o.map((x, i) => `<button class="opt" data-i="${i}">${esc(optText(x, 'en'))}</button>`).join('')}</div>
    <button class="btn ghost block" id="pldk">I don't know this one</button></div>`;
  if ($('#pl')) { $('#pl').onclick = e => play(c.id, 1, e.currentTarget); play(c.id, 1, $('#pl')); }
  let answered = false;   // a double tap counts once
  const answer = ok => { if (answered) return; answered = true; document.querySelectorAll('.opt, #pldk, #chk').forEach(x => x.disabled = true); if (ok) PL.right++; PL.qi++;
    // stop early once the round can't be passed, or once it's already passed
    if (PL.qi - PL.right > PL.qs.length - PL.need) { PL.qi = PL.qs.length; }
    else if (PL.right >= PL.need) { PL.qi = PL.qs.length; }
    setTimeout(render, 250); };
  pickThenCheck('.opt', b => { const ok = o[+b.dataset.i].id === c.id; b.classList.add(ok ? 'right' : 'wrong'); showOptMeanings([...document.querySelectorAll('.opt')], o, 'en'); answer(ok); }, '', h => $('#pldk').insertAdjacentHTML('beforebegin', h));
  $('#pldk').onclick = () => answer(false);
  if ($('#quit')) $('#quit').onclick = () => { if (PL.marked) toast(PL.marked + ' words marked as known'); go('home'); };
};
// how long a day takes with N new words (new words plus the reviews they bring back)
const MINS = { 5: 10, 8: 15, 10: 20, 15: 30 };
const minsText = n => `${n} new words a day is about ${MINS[n] || Math.round(n * 2)} minutes a day, with reviews.`;
const IPHONE_MUSIC = 'On iPhone, music only plays when your phone is not on silent (ring switch or Action button set to ring). The Bisaya audio always plays.';
/* ---------- the guide: shown once to everyone after a big update (bump GUIDE_V), and any time from Me ----------
   Keep it up to date: every new feature gets a point on the page for the tab where it lives. */
const GUIDE_V = 4;
/* The guide: short, visual pages. Each page has a picture, a few short points, and shows where to find it. */
const GUIDE = [
  { t: 'Welcome to Padayon!', art: '👋', pts: [['🗣️', 'Learn the Bisaya your family speaks'], ['⏱️', 'About 15 minutes a day'], ['<img src="icon-192.png?v=full" alt="" class="gface">', 'Binko, our BIG robot friend, helps along the way']] },
  { t: 'Your day', tab: 'home', art: '☀️', pts: [['▶️', '<b>Start</b> your daily session'], ['✅', 'Tick off today\'s plan'], ['🔥', 'Keep your streak. One missed day a week is free 🧊'], ['💬', 'Say the <b>phrase of the day</b> to someone'], ['🤖', 'Binko greets you with today\'s plan and what needs work'], ['⏸️', 'Leave a lesson any time. Continue picks up right where you stopped'], ['🍀', 'Come back to Today and a Lucky Clover shares a fun fact, a legend or a famous Filipino quote, with their own music']] },
  { t: 'New words', tab: 'home', art: '🍌', pts: [['🖼️', 'A picture and a "sounds like" guide'], ['🔊', 'Tap to hear it'], ['📝', 'Examples only use words you already know'], ['🆕', 'New kinds of questions: reply to what someone says, hear the difference, fill the gap, name the picture'], ['🔀', 'A word with several meanings (like <b>naa</b>) gets one card per meaning, learned on different days. Tap a meaning to compare it'], ['🔁', 'Miss one? It comes back six questions later, until you get it right'], ['🧠', 'Each word comes back right before you\'d forget it. Hard ones sooner, easy ones later'], ['👆', 'Tap any word in <b>Word by word</b> to see what it means'], ['🔤', 'After you answer, every choice shows what it means'], ['🚩', 'Audio sounds off? Tap <b>Sounds wrong?</b> to flag it']] },
  { t: 'Grammar', tab: 'home', art: '🧩', pts: [['📘', 'Grammar first: rules and sentence patterns come before new vocabulary, up to two rules a day'], ['📈', 'Questions get harder each time'], ['✅', '<b>Don\'t mix up</b> boxes: easy-to-confuse words side by side, with ✅ right and ❌ wrong examples. Look-alike words are learned on different days, then once you know two of them they come back as questions: fill in the blank, or pick or type the right one'], ['🤔', 'Miss one? See exactly why']] },
  { t: 'Practice', tab: 'practice', art: '🎧', pts: [['⚡', 'Speed round and dictation'], ['🎤', 'Shadowing and conversations'], ['📖', 'Binko\'s stories and Real Bisaya'], ['🔢', '<b>Numbers &amp; time:</b> say any number up to a billion, and tell the time']] },
  { t: 'Games', tab: 'rushhome', art: '🏆', pts: [['🏆', '<b>Rush:</b> words from easy to hard, one miss ends it'], ['🗺️', '<b>Province and Language Rush:</b> on a map of the Philippines. Hear every name and see how it sounds'], ['📍', 'Study the map first, no pressure'], ['⌨️', '<b>Multiple choice or typing</b>, your pick. Switch any time at the top of Games']], input: true },
  { t: 'Ranks', tab: 'board', art: '📊', pts: [['📊', 'See how the family is doing'], ['🎯', 'Streaks, accuracy, words, games'], ['⌨️', 'Game scores say if they were typed or multiple choice'], ['🔑', 'Sign in on <b>Me</b> to join']] },
  { t: 'Your settings', tab: 'me', art: '⚙️', pts: [['🃏', 'How many new words a day (the most you\'ll get: fewer when reviews pile up)'], ['🎵', 'Music changes with what you\'re doing (lessons, practice, grammar, stories, numbers, games) and switches tracks during your daily session. Set music, sound effects and vibration in Settings, or tap the speaker in the top corner'], ['🗺️', 'Your <b>word web</b> is on Today, your <b>path map</b> on Practice, and <b>Then and now</b> on Me'], ['💾', 'Save a backup, or <b>Start over</b> to reset all your progress on every device']], set: true },
  { t: 'One last thing', art: '🎯', pts: [['✏️', 'A quick check of what you already know'], ['⏭️', 'Words you know get skipped'], ['🤷', 'Not sure? Tap "I don\'t know". That\'s fine!']] }
];
let guideAt = 0, guideBack = 'home';
function openGuide(back) { guideAt = 0; guideBack = back || 'home'; go('guide'); }
const tabPreview = on => `<div class="gtabs">${TABS.map(([k, l]) => `<span class="gtab ${k === on ? 'on' : ''}" data-k="${k}">${TI[k]}<span>${l}</span></span>`).join('')}</div>`;
VIEWS.guide = function () {
  const g = GUIDE[guideAt], last = guideAt === GUIDE.length - 1, per = S.settings.newPerDay || 8, must = (S.guideV || 0) < GUIDE_V;
  $('#app').innerHTML = `<div class="sbar">${must ? '<span style="width:44px"></span>' : `<button class="x" id="quit" aria-label="Close">${I.x}</button>`}<div class="gdots">${GUIDE.map((_, i) => `<i class="${i === guideAt ? 'on' : i < guideAt ? 'done' : ''}"></i>`).join('')}</div>${must ? '<span style="width:44px"></span>' : '<button class="linkbtn" id="gskip">Skip</button>'}</div>
    <div class="ex gpage">
      <div class="gart">${g.art}</div>
      <h1 class="gtitle">${g.t}</h1>
      <ul class="gpts">${g.pts.map(([e, t]) => `<li><span class="gemo">${e}</span><span>${t}</span></li>`).join('')}</ul>
      ${g.set ? `<div class="gset"><div class="label">New words per day</div><div class="seg" id="gseg">${[5, 8, 10, 15].map(n => `<button class="${per === n ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div>
        <div class="label" style="margin-top:12px">Background music</div><div class="seg" id="gmusic"><button class="${S.settings.music !== false ? 'on' : ''}" data-m="1">On</button><button class="${S.settings.music === false ? 'on' : ''}" data-m="0">Off</button></div>
        <p class="small" style="margin:8px 0 0">${minsText(per)}</p><p class="muted small" style="margin:6px 0 0">🎵 ${IPHONE_MUSIC}</p><p class="muted small" style="margin:6px 0 0">You can change both later in Me.</p></div>` : ''}
      ${g.input ? `<div class="gset"><div class="label">Answer games by</div><div class="seg" id="gin"><button class="${rushTyped() ? '' : 'on'}" data-in="pick">Multiple choice</button><button class="${rushTyped() ? 'on' : ''}" data-in="type">Typing</button></div><p class="muted small" style="margin:8px 0 0">Typing gives you more time. Small typos are fine.</p></div>` : ''}
      ${g.tab ? `<div class="gwhere"><div class="label">Find it here</div>${tabPreview(g.tab)}</div>` : ''}
    </div>
    <div class="foot"><div class="row" style="gap:10px">${guideAt ? '<button class="btn ghost" id="gprev">Back</button>' : ''}<button class="btn primary block" id="gnext" style="flex:1">${last ? (S.placed ? "Let's go!" : 'Start the check') : guideAt ? 'Next' : "Let's start"}</button></div></div>`;
  const done = () => { S.guideV = GUIDE_V; save(); if (!S.placed) return startPlacement(); go(guideBack); };
  if ($('#quit')) $('#quit').onclick = () => { S.guideV = GUIDE_V; save(); go(guideBack); };
  if ($('#gskip')) $('#gskip').onclick = () => { S.guideV = GUIDE_V; save(); go(guideBack); };
  $('#gnext').onclick = () => { if (last) return done(); guideAt++; render(); };
  if ($('#gprev')) $('#gprev').onclick = () => { guideAt--; render(); };
  if ($('#gmusic')) $('#gmusic').querySelectorAll('button').forEach(b => b.onclick = () => { S.settings.music = b.dataset.m === '1'; save(); render(); });
  if ($('#gin')) $('#gin').querySelectorAll('button').forEach(b => b.onclick = () => { S.settings.rushInput = b.dataset.in; save(); render(); });
  if ($('#gseg')) $('#gseg').querySelectorAll('button').forEach(b => b.onclick = () => { S.settings.newPerDay = +b.dataset.v; save(); render(); });
  $('#gnext').focus({ preventScroll: true });
};
VIEWS.again = function () {
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Another session?</h2></div>
    ${binkoSays("You finished today's daily session! Want to keep the engine running? Binko can start TOMORROW'S plan right now, or you can review what you already know.", true)}
    <div class="panel"><b>Start the next day</b><div class="small">Your checklist resets for a new day, with new cards and reviews. Your streak and the #streaks post still count once per real day, so this doesn't add to them.</div><button class="btn primary block" id="nextday" style="margin-top:8px">Start the next day</button></div>
    <div class="panel"><b>Review what you know</b><div class="small">A quick round of cards you've already learned. No new cards, your checklist stays as it is, and nothing is announced.</div><button class="btn ghost block" id="extra" style="margin-top:8px">Review again</button></div>`;
  $('#quit').onclick = () => goTab();
  $('#extra').onclick = () => startSession();
  $('#nextday').onclick = () => { S.dayShift = (S.dayShift || 0) + 1; DAY_SHIFT = S.dayShift; save(); toast('Day ' + (today() - (S.started || today()) + 1) + ' started. Padayon!'); startSession(); };
};

/* ---------- session engine ---------- */
let Q = [], qi = 0, sess = null, timerH = null;
const newSess = mode => ({ xp: 0, right: 0, total: 0, graded: new Set(), requeued: new Set(), newIds: new Set(), mode, peak: S.speed });
/* An unfinished daily session is saved after every question, so leaving (the X button, switching apps, closing the
   app) and coming back later picks up on the same question instead of building a new lesson. It lasts for the day. */
const RESUME_K = 'padayon-resume';
function saveResume(at) { if (at == null) at = qi; if (!sess || sess.mode !== 'daily' || at >= Q.length || planDay().session) return;
  try { localStorage.setItem(RESUME_K, JSON.stringify({ d: today(), qi: at, Q, sess: Object.assign({}, sess, { graded: [...sess.graded], requeued: [...sess.requeued], newIds: [...sess.newIds] }) })); } catch (e) { } }
function loadResume() { try { if (planDay().session) { clearResume(); return null; } const r = JSON.parse(localStorage.getItem(RESUME_K)); if (r && r.d === today() && Array.isArray(r.Q) && r.qi < r.Q.length) return r; } catch (e) { } return null; }
function clearResume() { try { localStorage.removeItem(RESUME_K); } catch (e) { } }
function startSession() {
  if (!hasPack()) { toast('Still loading your words. One moment!'); return; }
  const r = loadResume();
  if (r) { Q = r.Q; qi = r.qi; sess = Object.assign(newSess('daily'), r.sess, { graded: new Set(r.sess.graded), requeued: new Set(r.sess.requeued), newIds: new Set(r.sess.newIds) }); return go('session'); }
  Q = buildSession(); qi = 0; sess = newSess('daily'); go('session'); }
/* The Daily Practice home calls this to start today's session; it does nothing until the content pack is loaded. */
window.startFromHome = () => { try { if (P && P.length && view !== 'session') startSession(); } catch (e) { } };
function startDictation() {
  if (!hasPack()) return toast('Load the content pack first. Dictation uses its recordings.');
  if (drillLock('dict')) { view = 'locked'; return lockedScreen('Dictation', 'dict'); }
  Q = shuffle(heardIds()).slice(0, 12).map(id => ({ id, type: 'dict' })); qi = 0; sess = newSess('dict'); go('session');
}
VIEWS.session = function () {
  if (qi >= Q.length) return finishSession();
  saveResume();
  const item = Q[qi], c = card(item.id);
  if (!c || ((item.type === 'pron' || item.type === 'dict' || item.type === 'listen' || item.type === 'tiles' || item.type === 'shadow') && !c.audio)) { qi++; return VIEWS.session(); }
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="End session">${I.x}</button><div class="prog"><i style="width:${(qi / Q.length) * 100}%"></i></div><span class="muted small tnum qcount">${qi + 1} of ${Q.length}</span><span class="speedchip">${S.speed.toFixed(1)}×</span></div>
  <div class="ex" id="ex"></div><div class="foot" id="foot"></div>`;
  $('#quit').onclick = () => { if (sess.mode === 'daily') { stopAudio(); saveResume(); go('home'); if (qi > 0 && loadResume()) toast('Saved your place. Tap Continue on Today to pick up where you left off.'); return; } if (qi > 0 && sess.total > 0) finishSession(); else goTab(); };
  if (typeof Music !== 'undefined') Music.set(musicFor());
  EX[item.type](c, item);
  // a picture on questions that already show the English (never on ones that ask for the meaning)
  if (['mc', 'type', 'speak', 'say'].includes(item.type) && picFile(c)) { const pr = $('#ex .prompt'); if (pr && !$('#ex .epic')) pr.insertAdjacentHTML('beforebegin', picImg(picFile(c), 'md')); }
};
function foot(html) { $('#foot').className = 'foot'; $('#foot').innerHTML = html; }
function next() { stopAudio(); if (typeof stopRecorder === 'function') stopRecorder(); qi++; try { VIEWS.session(); } catch (e) { console.warn('session step failed:', e.message); view = 'home'; render(); return; } window.scrollTo(0, 0); }
function result(c, item, ok, extra) {
  const q = ok === true ? 2 : ok === false ? 0 : ok;
  if (!sess.graded.has(c.id) && item.type !== 'teach' && item.type !== 'shadow') {
    sess.graded.add(c.id);
    if (!sess.newIds.has(c.id)) grade(c.id, q, item.type);
    else if (!S.cards[c.id]) grade(c.id, q, item.type);
    else { const k = S.cards[c.id]; if (k.s == null || k.fresh) { delete k.fresh; delete k.s; delete k.lr; } grade(c.id, q, item.type); if (q === 0) k.d = today(); else k.b = Math.max(k.b, 1); }
  }
  logAnswer(q > 0); sess.total++; if (q > 0) { sess.right++; const g = q === 2 ? 10 : 6; sess.xp += g; addXP(g); }
  // the party drops in now and then: a streak, a comeback, or a rough patch
  const prevWrong = sess.wrongRun || 0; sess.run = q > 0 ? (sess.run || 0) + 1 : 0; sess.wrongRun = q > 0 ? 0 : prevWrong + 1;
  const gap = sess.total - (sess.lastCameo || -9) >= 4;
  const cameoKind = !gap ? null : q > 0 && sess.run > 0 && sess.run % 3 === 0 ? 'streak' : q > 0 && prevWrong >= 1 && Math.random() < 0.4 ? 'comeback' : q === 0 && sess.wrongRun === 2 ? 'rough' : null;
  if (cameoKind) sess.lastCameo = sess.total;
  /* A miss comes back later in the same session, six questions on, until you get it right (up to 3 more tries;
     after that it's left for tomorrow so one stubborn word doesn't take over the session). The retry is the easier
     kind (picking instead of typing), and a word you only met today is shown to you again first.
     Only the first answer moves the word's schedule. */
  let retryNote = '';
  if (q === 0 && sess.mode === 'daily') {
    sess.miss = sess.miss || {}; const n = sess.miss[c.id] = (sess.miss[c.id] || 0) + 1; sess.requeued.add(c.id);
    if (n <= 3) {
      const easy = item.type === 'mixq' ? { id: c.id, type: 'mixq', mx: item.mx, easy: 1 } : { id: c.id, type: c.kind === 'r' ? 'rq' : c.kind === 'f' || c.kind === 'd' ? 'build' : c.audio ? pick(['listen', 'mc']) : 'mc' };
      const add = [n >= 2 && item.type !== 'mixq' && c.kind !== 'r' && sess.newIds.has(c.id) ? { id: c.id, type: 'teach', again: 1 } : null, Object.assign(easy, { retry: n })].filter(Boolean);
      // 6 questions later: in Pyc & Rawson (2009) a gap of 6 items beat back-to-back, and longer gaps beat 6, so it
      // comes back after real forgetting has started but while it can still be recalled in the same session
      Q.splice(Math.min(Q.length, qi + 1 + MISS_GAP), 0, ...add);
      retryNote = '<div class="small muted" style="margin-top:4px">🔁 This one comes back in a few questions.</div>';
    } else retryNote = '<div class="small muted" style="margin-top:4px">We\'ll come back to this one tomorrow.</div>';
  } else if (q === 0 && !sess.requeued.has(c.id)) { sess.requeued.add(c.id); Q.push(item.type === 'mixq' ? { id: c.id, type: 'mixq', mx: item.mx } : { id: c.id, type: c.kind === 'r' ? 'rq' : c.kind === 'f' || c.kind === 'd' ? 'build' : c.audio ? pick(['listen', 'mc']) : 'mc' }); }
  save();
  // a swapped-in version of the card (build exercises) or a rule sentence plays its own sentence, not the card's recording
  const base = c.kind === 'r' ? null : card(c.id), sentenceOnly = c.kind === 'r' || (base && norm(firstAlt(base.ceb)) !== norm(firstAlt(c.ceb)));
  if (sentenceOnly) c = Object.assign({}, c, { audio: false });
  const f = $('#foot'); f.className = 'foot ' + (q > 0 ? 'good' : 'bad');
  const bxKind = q > 0 && sess.run >= 3 ? 'streak' : q > 0 ? 'right' : 'wrong';
  f.innerHTML = `<div class="row spread" style="gap:12px;align-items:flex-start"><div class="bx ${bxKind}"><img src="icon-192.png?v=full" alt="Binko">${bxKind === 'streak' ? `<span class="run">${sess.run}🔥</span>` : ''}</div><div style="min-width:0;flex:1"><div class="verdict">${q === 2 ? 'Tama!' : q === 1 ? 'Sakto ra. Almost there.' : 'Dili pa. Not yet.'}</div>
  <div class="ans">${c.kind !== 'r' ? picImg(picFile(c), 'in') : ''}<span>${esc(c.ceb)}</span> <span class="muted" style="font-weight:400">· ${esc(c.en)}</span></div>${phonHtml(c.ceb)}${extra ? `<div class="small">${extra}</div>` : ''}${retryNote}${c.note && q < 2 ? `<div class="small muted">${esc(c.note)}</div>` : ''}${q < 2 && tipFor(c) ? `<div class="small"><b>Trick:</b> ${esc(tipFor(c).trick)}</div>` : ''}${q < 2 && c.kind !== 'r' && ruleFor(c.ceb) && ruleLearned(ruleFor(c.ceb).id) ? `<div class="small"><b>Rule ${ruleFor(c.ceb).n}:</b> ${esc(ruleFor(c.ceb).short)}</div>` : ''}</div>
  ${canHear(c) ? `<button class="play sm" id="fplay" aria-label="Play">${I.play}</button>` : ''}</div>
  ${cameoKind ? cameoHtml(cameoKind) : ''}<button class="btn primary block" id="cont">Continue</button>${c.kind !== 'r' && !sentenceOnly ? `<div style="text-align:center">${flagBtn(c.id)}</div>` : ''}`;
  if (canHear(c)) { const hear = btn => sentenceOnly ? playSentence(c.ceb, btn) : play(c.id, 1, btn); $('#fplay').onclick = e => hear(e.currentTarget); if (!['listen', 'tiles', 'dict', 'pron', 'say', 'rid'].includes(item.type)) hear(); }
  $('#cont').onclick = next; $('#cont').focus({ preventScroll: true });
  tappableWords();
}
/* After you answer, every Bisaya word on screen opens its word page (meaning, example, "Don't mix up" box):
   the tiles, the Bisaya choices, the sentence shown in the question, and the answer in the feedback. */
function twWrap(el) {
  [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).forEach(n => {
    const span = document.createElement('span');
    span.innerHTML = n.textContent.split(/(\s+)/).map(p => { const w = p.replace(/^[^\p{L}']+|[^\p{L}'-]+$/gu, ''); return w && /\p{L}/u.test(w) ? `<span class="tw" data-tok="${esc(w)}" role="button" tabindex="0">${esc(p)}</span>` : esc(p); }).join('');
    n.replaceWith(span);
  });
  // words inside highlights (the wavy "this part differs" mark, bold) are words too
  [...el.children].filter(x => /^(MARK|B|I|EM|STRONG|S)$/.test(x.tagName) && !x.closest('.tw') && !x.querySelector('.tw')).forEach(twWrap);
}
// a choice counts as Bisaya when most of its words are Bisaya cards and none is a common English word
const EN_WORDS = new Set("i i'm i've it's you you're your he she we they it is are was were am be been the a an to of in on at for with and or not don't didn't will would can do did does have has had my me this that what where who when why how there here words word".split(' '));
const looksBisaya = txt => { const ws = String(txt).split(/\s+/).map(w => w.replace(/^[^\p{L}']+|[^\p{L}'-]+$/gu, '').toLowerCase()).filter(w => /\p{L}/u.test(w));
  return ws.length > 0 && !ws.some(w => EN_WORDS.has(w)) && ws.filter(w => cardForTok(w)).length / ws.length >= 0.5; };
const MISS_GAP = 6;
function tappableWords() {
  const app = $('#app'), f = $('#foot'); if (!app) return;
  // only once the question on screen has been answered: before that, a tap on a choice must pick it
  const answered = (f && /\b(good|bad)\b/.test(f.className)) || app.querySelector('.opt.right, .opt.wrong, [data-o].right, [data-o].wrong, [data-w].right, .field.right, .field.wrong');
  if (!answered) return;
  app.querySelectorAll('.tile').forEach(t => { if (t.classList.contains('look')) return; t.onclick = e => { e.stopPropagation(); wordSheet(t.textContent.trim().replace(/[.,!?…"“”]/g, '')); }; t.classList.add('look'); });
  app.querySelectorAll('.blank[data-ans]').forEach(b => { b.textContent = b.dataset.ans; b.classList.add('tw'); b.dataset.tok = b.dataset.ans; });
  // answer choices: Bisaya ones (marked, or that read as Bisaya) stay tappable once the question is answered
  app.querySelectorAll('.opt, [data-o], [data-w]').forEach(b => { if (!b.disabled && !b.classList.contains('right') && !b.classList.contains('wrong')) return;
    if (b.classList.contains('done') || (b.classList.contains('opt') && !b.classList.contains('cebopt') && !b.dataset.o && !b.dataset.w) || !looksBisaya([...b.childNodes].filter(n => !(n.classList && n.classList.contains('otr'))).map(n => n.textContent).join(' '))) return;
    b.disabled = false; b.onclick = null; b.classList.add('done'); twWrap(b); });
  app.querySelectorAll('.opt .otr').forEach(el => { const b = el.closest('.opt'); if (!el.querySelector('.tw') && looksBisaya(el.textContent)) { if (b) { b.disabled = false; b.onclick = null; b.classList.add('done'); } twWrap(el); } });
  app.querySelectorAll('.ceb, .chat .msg > div[style*="font-weight:700"]').forEach(el => { if (!el.closest('#wsheet') && !el.querySelector('.tw')) twWrap(el); });
  if (f) f.querySelectorAll('.ans > span:not(.muted), .ans > b').forEach(el => { if (!el.querySelector('.tw') && looksBisaya(el.textContent)) twWrap(el); });
  if (f && app.querySelector('.tw, .tile.look') && !f.querySelector('.twhint')) { const h = document.createElement('div'); h.className = 'twhint small muted'; h.textContent = 'Tap any Bisaya word to see what it means.'; const c = f.querySelector('#cont, #nx, button.btn.primary'); if (c) c.before(h); else f.appendChild(h); }
}
// every kind of question (lessons, practice, stories, songs, rush, numbers, rules): once it's answered, its Bisaya words open their word page
let twTimer = 0;
new MutationObserver(ms => { if (ms.some(m => m.target.classList && (m.target.classList.contains('right') || m.target.classList.contains('wrong') || (m.target.id === 'foot' && /good|bad/.test(m.target.className))))) { clearTimeout(twTimer); twTimer = setTimeout(tappableWords, 30); } })
  .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
document.addEventListener('keydown', e => { const t = e.target.closest && e.target.closest('.tw[data-tok]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); wordSheet(t.dataset.tok); } }, true);
/* ---------- answer choices that can't be guessed by elimination ----------
   Wrong answers come from the same topic, share words or shape with the answer, and include
   minimal-change versions (ko→ka, naa→wala, mo-→ni-, udto→hapon) so you have to know it, not spot the odd one out. */
const confOf = {}; CONF.forEach(g => g.forEach(id => confOf[id] = g));
const swapOf = {}; SWAPS.forEach(g => g.forEach(w => (swapOf[w] = swapOf[w] || new Set()) && g.forEach(x => x !== w && swapOf[w].add(x))));
const lowTok = t => t.toLowerCase().replace(/[.,!?…¿¡]/g, '');
const tokSet = ceb => new Set(tokens(ceb).map(lowTok));
const enWords = en => en.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
const isQ = s => /\?\s*$/.test(s.split('/')[0].trim());
function sameMeaning(a, b) {
  const x = new Set(enWords(a)), y = enWords(b); if (!x.size || !y.length) return false;
  const inter = y.filter(w => x.has(w)).length; if (inter / Math.max(x.size, y.length) >= 0.8) return true;
  // one meaning inside the other ("older woman" vs "older woman or sister"), or any one sense the same: too close to tell apart
  if (inter === Math.min(x.size, new Set(y).size) && inter >= 1) return true;
  const parts = s => String(s).toLowerCase().replace(/\([^)]*\)/g, '').split(/[;\/]| or /).map(p => enWords(p).sort().join(' ')).filter(Boolean);
  const pa = parts(a), pb = new Set(parts(b)); return pa.some(p => pb.has(p));
}
function simScore(c, d) {
  const a = tokSet(c.ceb), b = tokSet(d.ceb); let sc = 0;
  b.forEach(t => { if (a.has(t)) sc += 3; });
  const fa = lowTok(tokens(c.ceb)[0] || ''), fb = lowTok(tokens(d.ceb)[0] || '');
  if (fa && fa === fb) sc += 2; else if (fa.slice(0, 2) === fb.slice(0, 2)) sc += 1;
  if (UNIT_OF[c.id] && UNIT_OF[c.id] === UNIT_OF[d.id]) sc += 4;
  if (confOf[c.id] && confOf[c.id].includes(d.id)) sc += 8;
  const ea = enWords(c.en), eb = enWords(d.en);
  if (ea[0] && ea[0] === eb[0]) sc += 1.5;
  if (isQ(c.en) === isQ(d.en)) sc += 1.5; else sc -= 2;
  const suf = w => (w.match(/(ing|ed|ly|er|s)$/) || [''])[0], la = ea[ea.length - 1] || '', lb = eb[eb.length - 1] || '';
  if (ea.length === 1 && eb.length === 1 && suf(la) === suf(lb)) sc += 1.5;
  if (ea[0] === 'to' && eb[0] === 'to') sc += 1.5;
  sc -= Math.abs(a.size - b.size) * 0.9 + Math.abs(ea.length - eb.length) * 0.4;
  return sc + Math.random() * 1.5;
}
function swapVariants(c) {
  const toks = tokens(c.ceb), out = new Set(), real = new Set([c.ceb, ...(c.also || [])].flatMap(alts));
  toks.forEach((t, i) => {
    const lw = lowTok(t), cand = [];
    if (swapOf[lw]) swapOf[lw].forEach(x => cand.push(x));
    if (lw.length >= 5) SWAP_PREFIX.forEach(g => g.forEach(pre => { if (lw.startsWith(pre)) g.forEach(o => o !== pre && cand.push(o + lw.slice(pre.length))); }));
    cand.forEach(x => {
      const rep = t[0] === t[0].toUpperCase() && t[0] !== t[0].toLowerCase() ? x[0].toUpperCase() + x.slice(1) : x;
      const v = toks.map((y, j) => j === i ? rep + (y.match(/[.,!?…]+$/) || [''])[0] : y).join(' ') + (/\?\s*$/.test(firstAlt(c.ceb)) && !/\?$/.test(toks[toks.length - 1]) ? '?' : '');
      if (!real.has(norm(v))) out.add(v);
    });
  });
  return shuffle([...out]);
}
const taughtIds = () => Object.keys(S.cards).filter(id => id[0] !== 'r' && card(id));
function distract(c, n, field) {
  // only cards this person has already been taught, so every option is something they've seen
  const pool = taughtIds();
  const ranked = pool.filter(id => id !== c.id).map(card).filter(Boolean).map(d => [simScore(c, d) + (d.kind === c.kind ? 3 : 0), d]).sort((x, y) => y[0] - x[0]);
  const out = [], used = new Set([norm(c[field])]), answers = new Set([c.ceb, ...(c.also || [])].flatMap(alts));
  const sameWord = norm(firstAlt(c.ceb));
  const ok = (d, loose) => { const v = norm(d[field]); if (!v || used.has(v) || sameMeaning(c.en, d.en)) return false;
    if (d.ceb && norm(firstAlt(d.ceb)) === sameWord) return false;                                   // another meaning of the same word
    if (field === 'ceb' && alts(d.ceb).some(a => answers.has(a))) return false;                    // another way to say the answer is also right
    if (!loose && d.en && out.some(o => o.en && sameMeaning(o.en, d.en))) return false;            // two wrong choices shouldn't mean the same thing
    used.add(v); return true; };
  // minimal-change fakes only make sense when the options are in Bisaya
  const kw = knownWords();
  if (field === 'ceb') for (const v of swapVariants(c).filter(v => tokens(v).every(t => kw.has(lowTok(t)))).slice(0, n >= 3 ? 2 : 1)) { const d = { id: 'x' + out.length, ceb: v, en: '' }; if (ok(d)) out.push(d); }
  const top = ranked.slice(0, Math.max(8, n * 3)); shuffle(top);
  for (const [, d] of top.sort((x, y) => y[0] - x[0] + (Math.random() - 0.5) * 3)) { if (out.length >= n) break; if (ok(d)) out.push(d); }
  for (const [, d] of ranked) { if (out.length >= n) break; if (ok(d)) out.push(d); }
  for (const [, d] of ranked) { if (out.length >= n) break; if (ok(d, true)) out.push(d); }   // very early on there may be nothing better
  return out;
}
// show every option in the same style so punctuation and capitals don't give the answer away
// after answering, every option shows what it means (the other side of the card), right or wrong
// after answering, every option shows what it means (the other side of the card), right or wrong. For Bisaya choices
// that are near-copies of the answer, the words that differ are highlighted, with what they mean.
function wordDiff(a, b) { // which tokens of a aren't matched in b (longest common run)
  const A = a.map(t => lowTok(t)), B = b.map(t => lowTok(t)), L = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const mark = new Array(A.length).fill(true); let i = 0, j = 0;
  while (i < A.length && j < B.length) { if (A[i] === B[j]) { mark[i] = false; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return mark;
}
function showOptMeanings(btns, opts, field) {
  const ri = btns.findIndex(b => b.classList.contains('right')), right = ri >= 0 ? opts[ri] : null;
  const rTok = right && field === 'ceb' ? firstAlt(optText(right, 'ceb')).split(/\s+/) : null;   // compare with the answer's first way of saying it
  btns.forEach((b, i) => { const o = opts[i]; if (!o || b.querySelector('.otr')) return;
    let other = optText(o, field === 'en' ? 'ceb' : 'en');
    if (rTok && i !== ri) { const full = optText(o, 'ceb'), mine = (full.includes('/') ? null : full.split(/\s+/)) || firstAlt(full).split(/\s+/), m = wordDiff(mine, rTok), theirs = wordDiff(rTok, mine);
      const diff = mine.filter((_, k) => m[k]), was = rTok.filter((_, k) => theirs[k]);
      // only for real near-copies: most words shared with the answer, one to three swapped
      if (diff.length && diff.length <= 3 && mine.length > 1 && mine.length - diff.length >= Math.max(1, Math.ceil(mine.length / 2))) {
        [...b.childNodes].forEach(n => { if (n.nodeType === 3) n.remove(); });
        b.insertAdjacentHTML('afterbegin', mine.map((t, k) => m[k] ? `<mark class="dif">${esc(t)}</mark>` : esc(t)).join(' ') + (full.includes('/') ? esc(full.slice(firstAlt(full).length)) : ''));
        if (!other) { const g = t => { const x = glossOf(t); return x ? `${esc(lowTok(t))} = ${esc(String(x).split(' · ')[0])}` : esc(lowTok(t)); };
          other = null; b.insertAdjacentHTML('beforeend', `<span class="otr">${diff.map(g).join(', ')}${was.length ? ` · the answer has ${was.map(g).join(', ')}` : ''}</span>`); }
      } }
    if (other) b.insertAdjacentHTML('beforeend', `<span class="otr">${esc(other)}</span>`); });
}
const optText = (o, field) => { let t = String(o[field] || '').trim().replace(/[.!]+$/, ''); return t ? t[0].toUpperCase() + t.slice(1) : t; };

/* ---------- examples only use words you've already met ----------
   An example sentence shows only if every other word in it was taught before. If the stored example has a new word,
   Binko looks for another sentence with this word built only from words you know; if there isn't one yet, no example. */
function knownOk(s, extra) { const kw = knownWords(); return tokens(s).every(t => { const w = lowTok(t); return !w || knownTok(w, kw) || (extra && extra.has(w)); }); }
function knownExample(c) {
  const own = new Set(tokens(c.ceb).map(lowTok));
  if (c.ex && knownOk(c.ex, own)) return [c.ex, c.exEn || ''];
  if (!needsExample(c)) return null;
  const e = exFor(c, knownWords()); return e ? [e.ceb, e.en] : null;
}
/* ---------- word by word, memory tricks, where a word shows up ---------- */
const GLOSS_MEMO = new Map(), TOK_MEMO = new Map();
function glossOf(tok) { const t = lowTok(tok); if (!GLOSS_MEMO.has(t)) GLOSS_MEMO.set(t, glossFind(t)); return GLOSS_MEMO.get(t); }
function glossFind(t) {
  if (!t) return null;
  if (GLOSS[t]) return GLOSS[t];
  const w = W.findIndex((x, i) => !HIDE.has('w' + i) && norm(cebOf('w' + i)) === t); if (w >= 0) return EN_FIX['w' + w] || W[w][1];
  const p = P.findIndex((x, i) => { const c = cebOf('p' + i); return c && tokens(c).length === 1 && alts(c).includes(t); }); if (p >= 0) return EN_FIX['p' + p] || P[p][1];
  const m = (typeof MEGA !== 'undefined' ? MEGA : []).findIndex((x, i) => { const c = cebOf('m' + i); return c && tokens(c).length === 1 && alts(c).map(norm).includes(t); }); if (m >= 0) return card('m' + m).en;
  const e = (typeof EXTRA !== 'undefined' ? EXTRA : []).findIndex((x, i) => { const c = cebOf('e' + i); return c && tokens(c).length === 1 && alts(c).map(norm).includes(t); }); if (e >= 0) return card('e' + e).en;
  if (typeof GLOSS_MORE !== 'undefined' && GLOSS_MORE[t]) return GLOSS_MORE[t];
  // a prefix is only explained when the word left after it is one we know (Kamatis isn't ka- + matis)
  for (const [re, txt] of AFFIX) if (re.test(t) && t.length > 5) { const root = t.replace(re, ''); const ri = W.findIndex((x, i) => norm(cebOf('w' + i)) === root); if (ri >= 0) return txt + ' · ' + root + ' = ' + (EN_FIX['w' + ri] || W[ri][1]); }
  return null;
}
function breakdown(ceb) {
  const toks = tokens(ceb).filter(t => /[a-z0-9]/i.test(t)); if (toks.length < 2) return '';   // emoticons like :) aren't words
  return `<div><div class="label">Word by word <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:400">· tap a word to see it</span></div><div class="wbw">${toks.map(t => { const g = glossOf(t), w = t.replace(/[.,!?…]/g, ''); return `<button type="button" class="wb" data-tok="${esc(w)}" aria-label="${esc(w)}: ${esc(g || 'see this word')}"><b>${esc(w)}</b><i>${esc(g || '·')}</i></button>`; }).join('')}</div></div>`;
}
/* Tapping a word in "Word by word" opens its vocabulary card in a sheet over the lesson, so you keep your place. */
const cebOf = id => { const c = card(id); return c ? c.ceb : ''; };
function cardForTok(tok) { const t = lowTok(tok); if (!TOK_MEMO.has(t)) TOK_MEMO.set(t, cardTokFind(t)); return TOK_MEMO.get(t); }
function cardTokFind(t) {
  if (!t) return null;
  // match on each card's corrected wording (some source rows had English and Bisaya swapped, fixed in fixes.js)
  const w = W.findIndex((x, i) => !HIDE.has('w' + i) && norm(cebOf('w' + i)) === t); if (w >= 0) return 'w' + w;
  const one = id => { const c = cebOf(id); return c && tokens(c).length === 1 ? alts(c).map(norm) : []; };
  const p = P.findIndex((x, i) => one('p' + i).includes(t)); if (p >= 0) return 'p' + p;
  const m = (typeof MEGA !== 'undefined' ? MEGA : []).findIndex((x, i) => one('m' + i).includes(t)); if (m >= 0) return 'm' + m;
  const e = (typeof EXTRA !== 'undefined' ? EXTRA : []).findIndex((x, i) => one('e' + i).includes(t)); if (e >= 0) return 'e' + e;
  for (const [re] of AFFIX) if (re.test(t) && t.length > 5) { const root = t.replace(re, ''), ri = W.findIndex((x, i) => norm(cebOf('w' + i)) === root); if (ri >= 0) return 'w' + ri; }
  return null;
}
function wordSheet(tok) {
  const id = cardForTok(tok), c = id && card(id), g = glossOf(tok), st = id && S.cards[id];
  const stageOf = id && PATH.findIndex(s => s.ids.includes(id));
  const status = !c ? '' : st && st.b >= 2 ? "You've learned this one." : st ? "You've met this one. Keep practicing it." : stageOf >= 0 ? `Coming up in Stage ${stageOf + 1}: ${esc(PATH[stageOf].name)}.` : '';
  const derived = c && lowTok(tok) !== norm(firstAlt(c.ceb));
  const ex = c && knownExample(c);
  const html = `<div class="wsheet-bg" id="wsbg"></div><section class="wsheet" role="dialog" aria-modal="true" aria-label="${esc(tok)}">
    <button class="x" id="wsx" aria-label="Close">${I.x}</button>
    <div class="teachhead"><div class="th-text"><div class="label">${c ? (c.kind === 'w' ? 'Word' : 'Phrase') : 'Word'}</div><div class="ceb">${esc(tok)}</div>${phonHtml(tok)}</div>${c ? picImg(picFile(c), 'big') : ''}</div>
    <div class="prompt" style="font-weight:500">${esc(derived ? (g || c.en) : c ? c.en : (g || 'No meaning saved for this word yet.'))}</div>
    ${derived ? `<div class="small muted">Built from <b>${esc(firstAlt(c.ceb))}</b> · ${esc(firstAlt(c.en))}</div>` : ''}
    <div class="row" style="gap:10px;align-items:center"><button class="play sm" id="wsplay" aria-label="Hear it">${I.play}</button><span class="muted small">${status}</span></div>
    ${ex ? `<div class="panel"><div class="label">Example</div><b>${esc(ex[0])}</b><div class="muted small">${esc(ex[1])}</div></div>` : ''}
    ${c && c.sense ? senseHtml(c) : ''}${c && (c.sense ? c.baseNote : c.note) ? `<div class="panel note"><div class="label">Binko explains</div>${esc(c.sense ? c.baseNote : c.note)}</div>` : ''}${mixHtml(c)}</section>`;
  const box = document.createElement('div'); box.id = 'wsheet'; box.innerHTML = html; document.body.appendChild(box); box.querySelectorAll('[data-vs]').forEach(b => b.onclick = () => playSentence(b.dataset.vs, b));
  const close = () => { box.remove(); document.removeEventListener('keydown', onKey, true); };
  const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  $('#wsbg').onclick = close; $('#wsx').onclick = close;
  $('#wsplay').onclick = e => { if (c && !derived && c.audio) play(c.id, 1, e.currentTarget); else if (hasVoice(tok)) playSentence(tok, e.currentTarget); else if (c) play(c.id, 1, e.currentTarget); else sayFallback(lowTok(tok)); };
  $('#wsx').focus({ preventScroll: true });
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.wb[data-tok], .tw[data-tok]'); if (b) { e.preventDefault(); wordSheet(b.dataset.tok); } });
function usedIn(c) {
  if (c.kind !== 'w' && !(c.kind === 'p' && tokens(c.ceb).length === 1)) return '';
  const t = norm(firstAlt(c.ceb)); if (!t) return '';
  const hits = P.map((x, i) => [x, i]).filter(([x, i]) => 'p' + i !== c.id && S.cards['p' + i] && tokens(cebOf('p' + i)).length > 1 && tokens(cebOf('p' + i)).map(lowTok).includes(t)).slice(0, 2);
  return hits.length ? `<div><div class="label">You'll hear it in</div>${hits.map(([x, i]) => { const pc = card('p' + i); return `<div class="small"><b>${esc(pc.ceb)}</b> <span class="muted">· ${esc(pc.en)}</span></div>`; }).join('')}</div>` : '';
}
const tipFor = c => c.trick ? { trick: c.trick } : (S.tips || {})[c.id] || null;
function tipHtml(t, c) {
  if (!t) return '';
  return `<div class="panel tip"><div class="label">Binko's memory trick</div><div>${esc(t.trick || '')}</div>${t.english ? `<div class="small"><b>English link:</b> ${esc(t.english)}</div>` : ''}${t.when && !(c && c.note) ? `<div class="small"><b>When to use it:</b> ${esc(t.when)}</div>` : ''}${t.example && knownOk(t.example, c ? new Set(tokens(c.ceb).map(lowTok)) : null) ? `<div class="small"><b>${esc(t.example)}</b> <span class="muted">· ${esc(t.example_en || '')}</span></div>` : ''}</div>`;
}
function wireTip(c, slot, auto) {
  const el = $(slot); if (!el) return;
  const have = tipFor(c);
  if (have) { el.innerHTML = tipHtml(have, c); return; }

}

const playBlock = rate => `<div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><button class="play sm slow" id="pls" aria-label="Play slower">${I.slow}</button><span class="muted small">Playing at ${rate.toFixed(1)}×.<br>Turtle plays it at 0.8×.</span></div>`;
function wirePlay(c, rate) { $('#pl').onclick = e => play(c.id, rate, e.currentTarget); $('#pls').onclick = e => play(c.id, 0.8, e.currentTarget); play(c.id, rate, $('#pl')); }
/* ---------- why the answer you picked is wrong ----------
   The wrong choices are built to trip you up (look-alikes, ko/ka, mo-/ni-), so a miss shows what your pick means
   and which word makes the difference. */
// which "no" to use: dili, wala or ayaw
const NEG_WHY = { dili: '<b>Dili</b> fits here: it\'s about now or later, or describing something (not / won\'t / no).', wala: '<b>Wala</b> fits here: it\'s about something that didn\'t happen, or not having something (didn\'t / don\'t have / none).', ayaw: '<b>Ayaw</b> fits here: you\'re telling someone not to do something (don\'t!).' };
const NEG_WHEN = '<ul class="rulel"><li>Telling someone not to? <b>ayaw</b></li><li>Didn\'t happen, or don\'t have it? <b>wala</b></li><li>Anything else (isn\'t, won\'t, no)? <b>dili</b></li></ul>';
function diffNote(right, picked) {
  const a = tokens(firstAlt(right)).map(t => t.replace(/[.,!?…]/g, '')), b = tokens(firstAlt(picked)).map(t => t.replace(/[.,!?…]/g, ''));
  const la = a.map(lowTok), lb = b.map(lowTok);
  if (la.length === lb.length && la.join(' ') !== lb.join(' ') && [...la].sort().join(' ') === [...lb].sort().join(' ')) return 'Same words, different order. Little words like ko, ka and ta ride right after the first word.';
  const shared = la.filter(t => lb.includes(t)).length; if (shared < Math.max(1, Math.ceil(Math.max(la.length, lb.length) / 2))) return '';
  if (la.length !== lb.length) { const extra = lb.filter(t => !la.includes(t)), miss = la.filter(t => !lb.includes(t)); const g = t => glossOf(t) ? ` (${esc(glossOf(t))})` : '';
    return [miss.length ? 'Missing: ' + miss.map(t => `<b>${esc(t)}</b>${g(t)}`).join(', ') : '', extra.length ? 'Extra: ' + extra.map(t => `<b>${esc(t)}</b>${g(t)}`).join(', ') : ''].filter(Boolean).join('. '); }
  const pairs = []; la.forEach((t, i) => { if (t !== lb[i]) pairs.push([a[i], b[i]]); });
  if (!pairs.length || pairs.length > 2) return '';
  // the three ways to say "no": explain which one fits and why, not just two glosses
  if (pairs.length === 1) { const neg = w => ({ dili: 'dili', di: 'dili', wala: 'wala', wa: 'wala', ayaw: 'ayaw' })[lowTok(w)]; const r = neg(pairs[0][0]), w = neg(pairs[0][1]);
    if (r && w && r !== w) return NEG_WHY[r] + ' ' + NEG_WHEN; }
  // only explain a swap when both sides have a real meaning (not just "na- = became")
  if (pairs.some(([x, y]) => !glossOf(x) || !glossOf(y) || /^[a-z]+- =/.test(glossOf(x)) || /^[a-z]+- =/.test(glossOf(y)))) return '';
  return pairs.map(([x, y]) => `<b>${esc(y)}</b> = ${esc(glossOf(y) || '?')}, but <b>${esc(x)}</b> = ${esc(glossOf(x) || '?')}`).join('. ');
}
const endDot = s => { s = String(s).trim().replace(/\.+$/, ''); return /[?!]$/.test(s) ? s : s + '.'; };
function wrongWhy(c, o, field) {
  if (!o || o.id === c.id) return '';
  const d = diffNote(c.ceb, o.ceb || '');
  const strip = s => String(s).trim().replace(/[.!]+$/, '');
  if (field === 'en') return `You picked “${esc(strip(firstAlt(o.en)))}”. That would be <b>${esc(strip(firstAlt(o.ceb)))}</b>.${d ? ' ' + endDot(d) : ''}`.replace(/([?!])(<\/b>|”)\./g, '$1$2');
  return `You picked <b>${esc(strip(firstAlt(o.ceb)))}</b>${o.en ? `, which means “${esc(strip(firstAlt(o.en)))}”` : ''}.${d ? ' ' + endDot(d) : ''}`.replace(/([?!])(<\/b>|”)\./g, '$1$2');
}
function choiceEx(c, item, opts, field, cls) {
  let sel = null;
  $('#ex').querySelector('.opts').innerHTML = opts.map((o, i) => `<button class="opt ${cls || ''}" data-i="${i}">${esc(optText(o, field))}</button>`).join('');
  foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
  const btns = [...document.querySelectorAll('.opt')];
  btns.forEach(b => b.onclick = () => { btns.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.i; $('#chk').disabled = false; });
  $('#chk').onclick = () => { const ok = opts[sel].id === c.id; btns.forEach((b, i) => { b.disabled = true; if (opts[i].id === c.id) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); }); showOptMeanings(btns, opts, field); result(c, item, ok, ok ? '' : wrongWhy(c, opts[sel], field)); };
}
// "I don't know": show the answer, count it as a miss so the word comes back soon (no guessing needed)
function wireIdk(c, item, inp) { const b = $('#idk'); if (b) b.onclick = () => { inp.disabled = true; inp.classList.add('wrong'); result(c, item, false, "That's okay. Here's the answer, and it'll come back again soon."); }; }
/* A small typo is forgiven, a different word isn't: ko/ka, na/ni, ako/ato, mo-/ni- change the meaning, and telling them apart is the whole point. */
let VOCAB_WORDS = null;
function typoOk(g, tgt, tol) {
  if (g === tgt) return true; if (lev(g, tgt) > tol) return false;
  if (!VOCAB_WORDS) { VOCAB_WORDS = new Set(); PATH.forEach(st => st.ids.forEach(id => { const c = card(id); if (c && c.kind !== 'r') tokens(c.ceb).forEach(t => { const w = norm(t); if (w && !w.includes(' ')) VOCAB_WORDS.add(w); }); })); }
  const gw = g.split(' '), tw = tgt.split(' '); if (gw.length !== tw.length) return gw.join('') === tw.join('');   // only spacing differs
  return gw.every((w, i) => { const t = tw[i]; if (w === t) return true;
    if (Math.min(w.length, t.length) <= 3) return false;                                  // little words have to be exact
    if ((swapOf[t] && swapOf[t].has(w)) || SWAP_PREFIX.some(s => s.some(p => t.startsWith(p) && s.some(o => o !== p && w === o + t.slice(p.length))))) return false;   // a look-alike the lessons warn about
    return !VOCAB_WORDS.has(w); });                                                       // another real word isn't a typo
}
function typedCheck(c, item, inp, tolFrac, dictMode) {
  const g = norm(inp.value); inp.disabled = true;
  let best = 99, tgt = '';
  for (const a of [c.ceb, ...(c.also || [])].flatMap(alts)) { const d = lev(g, a); if (d < best) { best = d; tgt = a; } }
  const tol = Math.max(1, Math.floor(tgt.length * tolFrac));
  const missed = tgt.split(' ').filter(w => !g.split(' ').includes(w));
  const said = esc(inp.value.trim());
  // the box itself shows the verdict: green when it counts as right (small typos included), red when it doesn't
  const pass = typoOk(g, tgt, tol);
  inp.classList.remove('right', 'wrong'); inp.classList.add(pass ? 'right' : 'wrong');
  if (best === 0) return result(c, item, true);
  if (dictMode) return result(c, item, pass ? 1 : false, missed.length ? 'Missed or misheard: <b>' + esc(missed.join(', ')) + '</b>' : 'You wrote "' + said + '"');
  return result(c, item, pass, pass ? 'Watch the spelling: you wrote "' + said + '"' : 'You wrote "' + said + '"');
}
// Prompt that asks for the Bisaya: drop any (bracketed example) that contains the answer word.
const askEn = (c, t) => { t = String(t == null ? c.en : t); const fold = x => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); const ws = fold(String(c.ceb || '')).match(/[a-z'-]{2,}/g) || []; if (!ws.length) return t; const re = new RegExp("(^|[^A-Za-zÀ-ɏ'-])(" + ws.map(w => w.replace(/[-']/g, '\\$&')).join('|') + ")(?=$|[^A-Za-zÀ-ɏ'-])", 'gi'); const out = t.replace(/\s*\(([^()]*)\)/g, (m, inner) => { const f = fold(inner); if (!re.test(f)) { re.lastIndex = 0; return m; } re.lastIndex = 0; let b = inner.replace(re, '$1___'); re.lastIndex = 0; if (b === inner) b = f.replace(re, '$1___'); re.lastIndex = 0; return /[:=]/.test(b) && /[a-z]{2,}/.test(b.replace(/___/g, '')) ? ' (' + b + ')' : ''; }).trim(); return out || t; };
const EX = {
  teach(c, item) {
    sess.newIds.add(c.id);
    if (!S.cards[c.id]) { S.cards[c.id] = { b: 0, d: today() + 1, r: 0, w: 0, fresh: 1 }; const t = today(); if (S.newDay.d !== t) S.newDay = { d: t, n: 0 }; S.newDay.n++; const rd = calDay(); if (!S.newReal || S.newReal.d !== rd) S.newReal = { d: rd, n: 0 }; S.newReal.n++; S.newMax = Math.max(S.newMax || 0, S.newReal.n); save(); }
    $('#ex').innerHTML = `<div class="teachhead"><div class="th-text"><div class="label">${c.kind === 'c' ? 'One of your gap words' : c.kind === 'g' ? 'How Bisaya really works' : c.kind === 'f' ? 'Building block' : c.kind === 'd' ? 'Line from a conversation: ' + esc(c.convo) : 'New ' + (c.kind === 'w' ? 'word' : 'phrase')}</div>
      <div class="ceb">${esc(c.ceb)}</div>${phonHtml(c.ceb)}</div>${picImg(picFile(c), 'big')}</div><div class="prompt" style="font-weight:500">${esc(c.en)}</div>
      ${breakdown(c.ceb)}
      ${c.sense ? senseHtml(c) : ''}${(c.sense ? c.baseNote : c.note) ? `<div class="panel note">${castImg('binko', 'peek')}<div class="label">Binko explains · ${c.kind === 'p' || c.kind === 'w' ? 'when to use it' : 'how it fits together'}</div>${esc(c.sense ? c.baseNote : c.note)}</div>` : ''}${mixHtml(c, item && item.type === 'teach')}
      ${ruleChip(c.ceb)}
      ${(c.combos || []).some(x => knownOk(x[0], new Set(tokens(c.ceb).map(lowTok)))) ? `<div><div class="label">Swap in other words</div>${c.combos.filter(x => knownOk(x[0], new Set(tokens(c.ceb).map(lowTok)))).map(x => `<div class="small"><b>${esc(x[0])}</b> <span class="muted">· ${esc(x[1])}</span></div>`).join('')}</div>` : ''}
      ${usedIn(c)}
      <div id="tipslot"></div>
      ${(x => x ? `<div class="panel"><div class="label">Example</div><div class="row" style="gap:8px;align-items:center"><b>${esc(x[0])}</b>${hasVoice(x[0]) ? `<button class="play sm" data-vs="${esc(x[0])}" aria-label="Play example">${I.play}</button>` : ''}</div><span class="muted small">${esc(x[1])}</span></div>` : '')(c.sense ? null : knownExample(c))}
      ${canHear(c) ? `<div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><button class="play sm slow" id="pls" aria-label="Play slower">${I.slow}</button><span class="muted small">${voiceNote(c)}</span></div>` : `<p class="muted small">Say it out loud twice.</p>`}${flagBtn(c.id)}`;
    if (canHear(c)) wirePlay(c, 1);
    document.querySelectorAll('#ex [data-vs]').forEach(b => b.onclick = () => playSentence(b.dataset.vs, b));
    wireTip(c, '#tipslot');
    sess.taughtXP = sess.taughtXP || []; if (!sess.taughtXP.includes(c.id)) { sess.taughtXP.push(c.id); sess.xp += 2; addXP(2); }
    foot(`<button class="btn primary block" id="cont">Got it</button>`); $('#cont').onclick = next;
  },
  listen(c, item) { const d = distract(c, 3, 'en'); if (d.length < 2) return EX.dict(c, item); $('#ex').innerHTML = `<h2>What did you hear?</h2>${playBlock(S.speed)}<div class="opts"></div>`; wirePlay(c, S.speed); choiceEx(c, item, shuffle([c, ...d]), 'en'); },
  mc(c, item) { const d = distract(c, 3, 'ceb'); if (d.length < 2) return c.kind === 'f' || c.kind === 'd' ? EX.build(c, item) : EX.type(c, item); $('#ex').innerHTML = `<div class="label">How do you say</div><div class="prompt">${esc(askEn(c))}</div><div class="opts"></div>`; choiceEx(c, item, shuffle([c, ...d]), 'ceb', 'cebopt'); },
  build(c, item) {
    const combo = c.combos ? pick([[c.ceb, c.en]].concat(c.combos)) : [c.ceb, c.en];
    const cc = Object.assign({}, c, { ceb: combo[0], en: combo[1] });
    const ans = tokens(cc.ceb).map(t => t.replace(/[.,!?…]/g, '')), low = ans.map(a => a.toLowerCase());
    const kw = knownWords(), known = t => kw.has(lowTok(t)) || (c.combos || []).some(x => tokens(x[0]).map(lowTok).includes(lowTok(t)));
    const swaps = [...new Set(swapVariants(cc).flatMap(v => tokens(v).map(t => t.replace(/[.,!?…]/g, ''))))].filter(t => !low.includes(t.toLowerCase()) && known(t));
    const others = (c.combos || []).map(x => x[0]).concat(taughtIds().filter(id => id !== c.id).map(id => card(id).ceb)).flatMap(x => tokens(x).map(t => t.replace(/[.,!?…]/g, ''))).filter(t => !low.includes(t.toLowerCase()) && known(t));
    const extra = [...new Set(shuffle(swaps).slice(0, 2).concat(shuffle(others)))].slice(0, Math.max(3, Math.ceil(ans.length * 0.8)));
    const bank = shuffle(ans.map((t, i) => ({ t, k: 'a' + i })).concat(extra.map((t, i) => ({ t, k: 'x' + i })))); const chosen = [];
    $('#ex').innerHTML = `<div class="label">Build it in Bisaya</div><div class="prompt">${esc(askEn(cc))}</div><div class="tray" id="tray"></div><div class="bank" id="bank">${bank.map(b => `<button class="tile" data-k="${b.k}">${esc(b.t)}</button>`).join('')}</div><p class="muted small" style="margin:0">Some tiles are look-alikes. Watch ko / ka, koy / kay, mo- / ni-.</p>`;
    foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
    const draw = () => {
      $('#tray').innerHTML = chosen.map(k => `<button class="tile" data-k="${k}">${esc(bank.find(b => b.k === k).t)}</button>`).join('');
      document.querySelectorAll('#bank .tile').forEach(b => b.classList.toggle('used', chosen.includes(b.dataset.k)));
      $('#tray').querySelectorAll('.tile').forEach(b => b.onclick = () => { chosen.splice(chosen.indexOf(b.dataset.k), 1); draw(); });
      $('#chk').disabled = !chosen.length;
    };
    document.querySelectorAll('#bank .tile').forEach(b => b.onclick = () => { if (!chosen.includes(b.dataset.k)) { chosen.push(b.dataset.k); draw(); } });
    $('#chk').onclick = () => { const got = chosen.map(k => bank.find(b => b.k === k).t).join(' '); result(cc, item, norm(got) === norm(ans.join(' ')), norm(got) === norm(ans.join(' ')) ? '' : 'You built "' + esc(got) + '"'); };
  },
  tiles(c, item) {
    const ans = tokens(c.ceb), low = ans.map(a => a.toLowerCase());
    const kw = knownWords(), known = t => kw.has(lowTok(t));
    const swapT = [...new Set(swapVariants(c).flatMap(v => tokens(v)))].filter(t => !low.includes(t.toLowerCase()) && known(t));
    const extra = [...new Set(shuffle(swapT).slice(0, 2).concat(shuffle(taughtIds().filter(id => id !== c.id)).flatMap(id => tokens(card(id).ceb)).filter(t => !low.includes(t.toLowerCase()) && known(t))))].slice(0, Math.min(4, Math.max(2, Math.ceil(ans.length / 2))));
    const bank = shuffle(ans.map((t, i) => ({ t, k: 'a' + i })).concat(extra.map((t, i) => ({ t, k: 'x' + i })))); const chosen = [];
    $('#ex').innerHTML = `<h2>Tap what you hear</h2>${playBlock(S.speed)}<div class="tray" id="tray"></div><div class="bank" id="bank">${bank.map(b => `<button class="tile" data-k="${b.k}">${esc(b.t)}</button>`).join('')}</div>`;
    wirePlay(c, S.speed); foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
    const draw = () => {
      $('#tray').innerHTML = chosen.map(k => `<button class="tile" data-k="${k}">${esc(bank.find(b => b.k === k).t)}</button>`).join('');
      document.querySelectorAll('#bank .tile').forEach(b => b.classList.toggle('used', chosen.includes(b.dataset.k)));
      $('#tray').querySelectorAll('.tile').forEach(b => b.onclick = () => { chosen.splice(chosen.indexOf(b.dataset.k), 1); draw(); });
      $('#chk').disabled = !chosen.length;
    };
    document.querySelectorAll('#bank .tile').forEach(b => b.onclick = () => { if (!chosen.includes(b.dataset.k)) { chosen.push(b.dataset.k); draw(); } });
    $('#chk').onclick = () => result(c, item, norm(chosen.map(k => bank.find(b => b.k === k).t).join(' ')) === norm(ans.join(' ')));
  },
  mixq(c, item) { // a "Don't mix up" question: pick the right one, or type it
    const m = MIXUPS[item.mx]; if (!m) { qi++; return VIEWS.session(); }
    const q = item.q || (item.q = Object.assign(mixQuestion(m, (S.cards[c.id] || {}).b || 0), item.easy ? { mode: 'pick' } : {}));
    const cc = { id: c.id, kind: 'x', ceb: q.right, en: q.en || q.ctx || 'the right way to say it', note: '', audio: false };
    const extra = `<b>Don't mix up · ${esc(m.title)}.</b> ${esc(m.rule)}${q.wrong ? `<br>❌ <s>${esc(q.wrong)}</s> → ✅ <b>${esc(q.right)}</b>` : ''}`;
    const head = `<div class="label">Don't mix up · ${esc(m.title)}</div>`;
    const ask = q.kind === 'fix' ? (q.ctx || q.en ? `<div class="prompt">Meaning: ${esc(q.ctx || q.en)}</div>` : '') : `<div class="prompt">${esc(q.en)}</div>`;
    const blank = q.kind === 'fill' ? `<div class="prompt" style="font-size:1rem">Fill in the blank</div><div class="ceb fillq">${esc(q.sent).replace('___', '<span class="blank" data-ans="' + esc(q.ans) + '">' + (q.mode === 'pick' ? '?' : '&nbsp;') + '</span>')}</div><div class="prompt" style="font-weight:500">${esc(q.en)}</div>` : '';
    if (q.mode === 'pick' && q.kind === 'fill') {
      $('#ex').innerHTML = `${head}${blank}<div class="opts"></div>`;
      const opts = shuffle(q.opts.map((t, i) => ({ id: i ? 'x' + i : 'ok', t, ceb: 1 })));
      return ruleChoice(cc, item, opts, 'ok', { ceb: q.right, en: cc.en }, extra);
    }
    if (q.mode === 'pick') {
      $('#ex').innerHTML = `${head}<div class="prompt" style="font-size:1rem">${q.kind === 'fix' ? 'Which one is right?' : 'How do you say'}</div>${ask}<div class="opts"></div>`;
      const opts = shuffle(q.opts.map((t, i) => ({ id: i ? 'x' + i : 'ok', t, ceb: 1 })));
      return ruleChoice(cc, item, opts, 'ok', { ceb: q.right, en: cc.en }, extra);
    }
    $('#ex').innerHTML = `${head}${q.kind === 'fill' ? blank : q.kind === 'fix' ? `<div class="prompt" style="font-size:1rem">This is wrong. Write it the right way:</div><div class="ceb" style="text-decoration:line-through;text-decoration-color:var(--bad);text-decoration-thickness:2px">${esc(q.wrong)}</div>${ask}` : `<div class="prompt" style="font-size:1rem">Write it in Bisaya</div>${ask}`}<input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${q.kind === 'fill' ? 'Type the missing word' : 'Type in Bisaya'}">`;
    foot(`<button class="btn primary block" id="chk" disabled>Check</button><button class="btn ghost block" id="idk">I don't know</button>`);
    const inp = $('#ans'); inp.focus(); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) $('#chk').click(); };
    $('#chk').onclick = () => { const g = norm(inp.value), t = [q.kind === 'fill' ? q.ans : q.right, ...(q.also || [])].map(norm).sort((a, b) => lev(g, a) - lev(g, b))[0], d = lev(g, t), ok = (q.kind === 'fill' ? g === t || (t.length >= 6 && lev(g, t) <= 1 && !(q.wopts || []).some(o => norm(o) === g)) : typoOk(g, t, Math.max(1, Math.floor(t.length * 0.08)))) && (!q.wrong || g !== norm(q.wrong));
      inp.disabled = true; inp.classList.add(ok ? 'right' : 'wrong'); result(cc, item, ok, (d && ok ? 'Watch the spelling. ' : '') + extra); };
    $('#idk').onclick = () => { inp.disabled = true; inp.classList.add('wrong'); result(cc, item, false, "That's okay. " + extra); };
  },
  type(c, item) {
    $('#ex').innerHTML = `<div class="label">Write it in Bisaya</div><div class="prompt">${esc(askEn(c))}</div><input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type in Bisaya"><p class="muted small" style="margin:0">Small typos are fine, but little words like ko / ka have to be exact. "ug" and "og" both count.</p>`;
    foot(`<button class="btn primary block" id="chk" disabled>Check</button><button class="btn ghost block" id="idk">I don't know</button>`);
    const inp = $('#ans'); inp.focus(); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) $('#chk').click(); };
    $('#chk').onclick = () => typedCheck(c, item, inp, 0.12, false); wireIdk(c, item, inp);
  },
  dict(c, item) {
    $('#ex').innerHTML = `<h2>Type what you hear</h2>${playBlock(S.speed)}<input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the Bisaya you hear"><p class="muted small" style="margin:0">Replay as often as you need. Catch every little word: ko, na, pa, man, sa.</p>`;
    wirePlay(c, S.speed); foot(`<button class="btn primary block" id="chk" disabled>Check</button><button class="btn ghost block" id="idk">I don't know</button>`);
    const inp = $('#ans'); inp.focus(); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) $('#chk').click(); };
    $('#chk').onclick = () => typedCheck(c, item, inp, 0.15, true); wireIdk(c, item, inp);
  },
  speak(c, item) {
    const secs = Math.round(Math.min(10, 3 + tokens(c.ceb).length * 0.8));
    $('#ex').innerHTML = `<div class="label">Say it out loud in Bisaya</div><div class="prompt">${esc(askEn(c, c.ask || c.en))}</div><div class="timer"><i id="tb"></i></div><p class="muted small" style="margin:0">${secs} seconds. The whole thing, no English. Then compare with the answer.</p><div id="rev"></div>`;
    foot(`<button class="btn primary block" id="show">Show answer</button>`);
    const t0 = Date.now();
    const reveal = () => {
      clearInterval(timerH);
      $('#rev').innerHTML = `<div class="ceb">${esc(c.ceb)}</div>${c.audio ? `<div class="playrow" style="margin-top:12px"><button class="play sm" id="pl2" aria-label="Play">${I.play}</button><span class="muted small">Compare with the native recording.</span></div>` : ''}`;
      if (c.audio) { $('#pl2').onclick = e => play(c.id, 1, e.currentTarget); play(c.id, 1, $('#pl2')); }
      if (typeof recorderHtml === 'function') { $('#rev').insertAdjacentHTML('beforeend', recorderHtml()); wireRecorder(c.ceb, c); }
      foot(`<div class="label">How did it go?</div><div class="grades"><button class="btn" data-q="2">Said it smoothly</button><button class="btn" data-q="1">Got there, but slowly or with small mistakes</button><button class="btn" data-q="0">Blanked or used English</button></div>`);
      document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => result(c, item, +b.dataset.q));
    };
    timerH = setInterval(() => { const f = 1 - (Date.now() - t0) / (secs * 1000); const tb = $('#tb'); if (!tb) return clearInterval(timerH); tb.style.width = Math.max(0, f * 100) + '%'; if (f <= 0) reveal(); }, 100);
    $('#show').onclick = reveal;
  },
  async shadow(c, item) {
    const rates = [1, 1, Math.max(1.1, S.speed)];
    $('#ex').innerHTML = `<div class="label">Shadowing</div><div class="ceb">${esc(c.ceb)}</div><div class="muted">${esc(c.en)}</div>
      <div class="stage">${['Listen', 'Speak along', 'Speak along, ' + rates[2].toFixed(1) + '×'].map((n, i) => `<span id="st${i}">${n}</span>`).join('')}</div>
      <p class="muted small" style="margin:0">Say it at the same time as the speaker, copying the rhythm and melody.</p>${typeof recorderHtml === 'function' ? recorderHtml() : ''}`;
    if (typeof wireRecorder === 'function') wireRecorder(c.ceb, c);
    foot(`<button class="btn primary block" id="cont">Continue</button>`);
    $('#cont').onclick = () => { sess.xp += 5; addXP(5); save(); next(); };
    const tok = qi;
    for (let i = 0; i < 3; i++) {
      if (qi !== tok || view !== 'session') return;
      document.querySelectorAll('.stage span').forEach((s, j) => s.className = j < i ? 'done' : j === i ? 'on' : '');
      await play(c.id, rates[i]); await sleep(700);
    }
    if (qi === tok) document.querySelectorAll('.stage span').forEach(s => s.className = 'done');
  }
};
function finishSounds(full) {
  if (typeof Sfx === 'undefined' || !full) return; Sfx.done(); if (typeof Music !== 'undefined') Music.endGroup();
  if (sess.mode === 'daily' && S.sfxStreakDay !== today()) { S.sfxStreakDay = today(); setTimeout(() => Sfx.streakKept(), 1300); }
  try { const cur = pathState().cur; if (S.stageSeen == null) S.stageSeen = cur; else if (cur > S.stageSeen) { S.stageSeen = cur; setTimeout(() => Sfx.stage(), 2400); } } catch (e) { }
}
function finishSession() { stopAudio(); const full = qi >= Q.length; finishSounds(full); ANS_RUN = 0; if (full && sess.mode === 'daily') clearResume(); if (full && sess.mode === 'daily') { tick('session'); try{ if (window.parent !== window) window.parent.postMessage({practice:'done', app:'bisaya'}, location.origin); }catch(e){} } if (full && sess.mode === 'dict') tick('dict'); save(); go('summary'); }
VIEWS.summary = function () {
  if (typeof journeySnap === 'function') journeySnap();
  const acc = sess.total ? Math.round(sess.right / sess.total * 100) : 0;
  $('#app').innerHTML = `<section class="panel summary"><div class="label">${sess.mode === 'speed' ? 'Speed round done' : sess.mode === 'dict' ? 'Dictation done' : 'Session done'}</div>
    <h1 style="font-size:2rem;color:var(--sea)">Maayo kaayo!</h1>
    <div class="sumgrid"><div><b class="tnum">${sess.mode === 'daily' ? sess.newIds.size : sess.total}</b><span class="small muted">${sess.mode === 'daily' ? 'new' : 'answered'}</span></div><div><b class="tnum">${acc}%</b><span class="small muted">correct</span></div>
    <div><b class="tnum">${sess.mode === 'speed' ? sess.peak.toFixed(1) + '×' : streakNow()}</b><span class="small muted">${sess.mode === 'speed' ? 'top speed' : 'day streak'}</span></div></div>
    ${sess.mode === 'speed' ? `<p class="muted">Your listening speed is now <b>${S.speed.toFixed(1)}×</b>.</p>` : `<p class="muted">${sess.graded.size} cards practiced.</p>`}
    ${cameoHtml('done')}${binkoSays(planNext() ? BINKO_NEXT[planNext().k] : BINKO_NEXT.done)}
    ${nextBtnHtml()}<button class="btn ghost block" id="home">Home</button></section>`;
  wireNext(); $('#home').onclick = () => goTab();
};

/* ---------- speed round ---------- */
VIEWS.speed = function () {
  if (!hasPack()) { toast('Load the content pack first. The speed round uses its recordings.'); return goTab(); }
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Speed round</h2></div>
  <section class="panel"><p style="margin:0">20 clips. Each plays once at your speed, then you get 7 seconds to answer. Two right in a row speeds it up by 0.1×. A miss slows it down.</p>
    <div class="row"><span class="label">Starting speed</span><span class="speedchip">${S.speed.toFixed(1)}×</span><span class="muted small">Best ${S.bestSpeed.toFixed(1)}×</span></div>
    <button class="btn primary block" id="go">Start</button></section>
  <section class="panel"><b>Padayon Rush</b><p class="small" style="margin:0">Endless mode with every recorded word in the app, not just the ones you&rsquo;ve learned, starting easy and getting harder. Keep going until you miss. Best: ${S.rushBest || 0}.</p><button class="btn ghost block" id="rush">Play Rush</button></section>`;
  $('#quit').onclick = () => goTab(); $('#go').onclick = startSpeed; $('#rush').onclick = startRush;
};
let SP = null;
const heardIds = () => Object.keys(S.cards).filter(id => { if (!IDX[id]) return false; const c = card(id); return c && c.audio; });
const DRILL_MIN = { speed: 8, dict: 6, shadow: 3 };
function drillLock(k) {
  const have = k === 'shadow' ? heardIds().filter(id => id[0] === 'p').length : heardIds().length, need = DRILL_MIN[k];
  return have >= need ? null : { need: need - have, what: k === 'shadow' ? 'phrase' : 'card' };
}
function lockedScreen(title, k) {
  const L = drillLock(k);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">${esc(title)}</h2></div>
    ${binkoSays(`${esc(title)} is still locked! Binko only uses things you've already learned. Learn ${L.need} more ${L.what}${L.need === 1 ? '' : 's'} with a recording in your daily session and it opens up.`)}`;
  $('#quit').onclick = () => goTab();
}
function startSpeed() {
  if (drillLock('speed')) return lockedScreen('Speed round', 'speed');
  let pool = shuffle(heardIds()).slice(0, 20);
  SP = { list: pool, i: 0, rate: S.speed, run: 0 }; sess = newSess('speed'); speedQ();
}
function endSpeed() { S.speed = Math.max(1, Math.round(SP.rate * 10) / 10); S.bestSpeed = Math.max(S.bestSpeed, sess.peak); if (sess.total >= SP.list.length) tick('speed'); save(); view = 'summary'; VIEWS.summary(); }
async function speedQ() {
  if (SP.i >= SP.list.length) return endSpeed();
  view = 'speedrun';
  const c = card(SP.list[SP.i]), opts = shuffle([c, ...distract(c, 3, 'en')]);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="End">${I.x}</button><div class="prog"><i style="width:${SP.i / SP.list.length * 100}%"></i></div><span class="speedchip">${SP.rate.toFixed(1)}×</span></div>
   <div class="ex"><h2>Listen once</h2><div class="playrow"><button class="play playing" id="pl" aria-label="Playing" disabled>${I.play}</button><span class="muted small" id="st">Playing…</span></div>
   <div class="timer"><i id="tb"></i></div><div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}" disabled>${esc(optText(o, 'en'))}</button>`).join('')}</div></div><div class="foot" id="foot" hidden></div>`;
  $('#quit').onclick = () => { clearInterval(timerH); stopAudio(); if (sess.total) endSpeed(); else goTab(); };
  const myI = SP.i;
  await play(c.id, SP.rate, $('#pl'));
  if (view !== 'speedrun' || SP.i !== myI) return;
  $('#st').textContent = 'Pick the meaning';
  const btns = [...document.querySelectorAll('.opt')]; btns.forEach(b => b.disabled = false);
  const t0 = Date.now(); let done = false;
  const finish = sel => {
    if (done) return; done = true; clearInterval(timerH);
    const ok = sel != null && opts[sel].id === c.id; logAnswer(ok);
    btns.forEach((b, i) => { b.disabled = true; if (opts[i].id === c.id) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); }); showOptMeanings(btns, opts, 'en');
    sess.total++;
    const spCameo = ok && (sess.right + 1) % 5 === 0;
    if (ok) { sess.right++; sess.xp += 5; addXP(5); SP.run++; if (SP.run >= 2) { SP.rate = Math.min(2, Math.round((SP.rate + 0.1) * 10) / 10); SP.run = 0; sess.peak = Math.max(sess.peak, SP.rate); } }
    else { SP.run = 0; SP.rate = Math.max(0.8, Math.round((SP.rate - 0.1) * 10) / 10); }
    const f = $('#foot'); f.hidden = false; f.className = 'foot ' + (ok ? 'good' : 'bad');
    f.innerHTML = `<div class="row spread"><div style="min-width:0;flex:1"><div class="verdict">${ok ? 'Tama!' : sel == null ? "Time's up" : 'Dili pa.'}</div><div class="ans">${esc(c.ceb)} <span class="muted" style="font-weight:400">· ${esc(c.en)}</span></div>${!ok && sel != null ? `<div class="small">${wrongWhy(c, opts[sel], 'en')}</div>` : ''}</div><button class="play sm" id="fplay" aria-label="Replay at normal speed">${I.play}</button></div>${spCameo ? cameoHtml('streak') : ''}<button class="btn primary block" id="cont">Next</button>`;
    $('#fplay').onclick = e => play(c.id, 1, e.currentTarget); $('#cont').onclick = () => { SP.i++; speedQ(); }; $('#cont').focus({ preventScroll: true });
  };
  btns.forEach((b, i) => b.onclick = () => finish(i));
  timerH = setInterval(() => { const f = 1 - (Date.now() - t0) / 7000; const tb = $('#tb'); if (tb) tb.style.width = Math.max(0, f * 100) + '%'; if (f <= 0) finish(null); }, 100);
}


/* ---------- conversations: chain lines into a real exchange ---------- */
let DL = null;
/* One conversation a day, picked to fit what the learner already knows. Flow: new words → read and listen → your turn. */
function knownWords() {
  const k = new Set();
  Object.keys(S.cards).forEach(id => { const c = card(id); if (c && c.kind !== 'r') tokens(c.ceb).forEach(t => k.add(lowTok(t))); });
  return k;
}
const dlgTokens = d => [...new Set(d.lines.flatMap(l => tokens(l[1]).map(lowTok)))].filter(t => t && !/^\d/.test(t));
function nextConvo() { const k = knownWords(); return DIALOGS.map(d => ({ d, left: dlgTokens(d).filter(t => !k.has(t)) })).sort((x, y) => x.left.length - y.left.length)[0]; }
function pickDialog() {
  const k = knownWords(), done = S.convoDone || {};
  // only conversations whose every word has been taught
  const scored = DIALOGS.map((d, i) => ({ i, d, unknown: dlgTokens(d).filter(t => !k.has(t)), times: done[i] || 0 })).filter(x => !x.unknown.length);
  if (!scored.length) return null;
  // fewest unfamiliar words first; among ties, the one practiced least; the starter dialogs win ties so beginners start easy
  scored.sort((x, y) => (x.unknown.length + x.times * 3) - (y.unknown.length + y.times * 3) || x.i - y.i);
  return scored[0];
}
VIEWS.convos = function () {
  const p = pickDialog();
  if (!p) {
    const near = nextConvo();
    $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Conversations</h2></div>
      ${binkoSays('No conversation is unlocked yet! Binko is still building it. <b>' + esc(near.d.title) + '</b> opens once you\'ve learned ' + near.left.length + ' more word' + (near.left.length === 1 ? '' : 's') + '. Keep doing your daily sessions!')}`;
    $('#quit').onclick = () => goTab(); return;
  }
  DL = { d: p.d, idx: p.i, m: p.unknown.length ? 'learn' : 'read', i: 0, show: {}, right: 0, unknown: p.unknown };
  view = 'convo'; render();
};
const lineSay = async (t, btn) => { const r = ++playReq, cx = audioCtx(); const u = nativeUrl(t) || await voiceUrlA(t); if (u && stillWanted(r, cx)) playUrl(u, 1, btn); };
function bubble(d, l, j, opts = {}) {
  const me = l[0] === 'b', showEn = opts.en || DL.show[j];
  return `<div class="msg ${me ? 'me' : 'them'}"><div class="small" style="opacity:.75">${esc(me ? d.b : d.a)}</div><div style="font-weight:700">${esc(l[1])}</div>
    ${showEn ? `<div class="tr" ${me ? 'style="color:inherit;opacity:.85"' : ''}>${esc(l[2])}</div>` : `<button class="linkbtn" data-en="${j}" ${me ? 'style="color:inherit"' : ''}>English</button>`}
    ${opts.note && l[3] ? `<div class="tr" ${me ? 'style="color:inherit;opacity:.85"' : ''}><i>${esc(l[3])}</i></div>` : ''}
</div>`;
}
function wireBubbles(d) {
  document.querySelectorAll('[data-en]').forEach(b => b.onclick = () => { DL.show[+b.dataset.en] = true; render(); });
  document.querySelectorAll('[data-say]').forEach(b => b.onclick = () => lineSay(d.lines[+b.dataset.say][1], b));
}
VIEWS.convo = function () {
  const d = DL.d, n = d.lines.length;
  const head = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><div class="prog"><i style="width:${(DL.m === 'order' ? DL.order.length : DL.i) / n * 100}%"></i></div><span class="muted small">${esc(d.ceb)}</span></div>`;
  const done = () => { const xp = DL.m === 'part' ? 4 * DL.right + 6 : 10; addXP(xp); if (DL.m === 'part' || DL.m === 'order') { tick('convo'); S.convoDone = S.convoDone || {}; S.convoDone[DL.idx] = (S.convoDone[DL.idx] || 0) + 1; } save(); view = 'done'; sectionDone('Conversation done', '+' + xp + ' XP · ' + esc(d.title)); };
  if (DL.m === 'learn') {
    $('#app').innerHTML = `${head}<div class="ex">${binkoSays('Today\'s conversation: ' + dlgPic(DL.idx) + ' <b>' + esc(d.title) + '</b>. First, the words you haven\'t met yet. Binko binks you\'ll be fine!')}
      <div class="panel"><div class="label">New words in this conversation</div>${DL.unknown.map(t => `<div class="gap"><span class="c">${esc(t)}</span><span class="small muted">${esc(glossOf(t) || 'see it in the conversation')}</span>${phonHtml(t, false)}</div>`).join('')}</div></div><div class="foot" id="foot"></div>`;
    foot(`<button class="btn primary block" id="nx">Start the conversation</button>`);
    $('#nx').onclick = () => { DL.m = 'read'; DL.i = 0; render(); };
  } else if (DL.m === 'read') {
    $('#app').innerHTML = `${head}<div class="ex"><div class="label">${dlgPic(DL.idx)} ${esc(d.title)}</div><div class="chat">${d.lines.slice(0, DL.i + 1).map((l, j) => bubble(d, l, j, { note: true })).join('')}</div></div><div class="foot" id="foot"></div>`;
    foot(DL.i < n - 1 ? `<button class="btn primary block" id="nx">Next line</button>` : `<button class="btn primary block" id="nx">Your turn: say your lines</button>`);
    $('#nx').onclick = () => { if (DL.i < n - 1) { DL.i++; render(); lineSay(d.lines[DL.i][1]); } else { DL = Object.assign(DL, { m: 'part', i: 0, show: {}, right: 0, spoke: 0 }); render(); } };
    if (DL.i === 0 && !DL.spoke) { DL.spoke = 1; lineSay(d.lines[0][1]); }
  } else if (DL.m === 'part') {
    if (DL.i >= n) { $('#app').innerHTML = `${head}<section class="panel summary"><div class="label">Conversation done</div><h1 style="font-size:2rem;color:var(--sea)">Maayo kaayo!</h1><p class="muted">${DL.right} of ${d.lines.filter(l => l[0] === 'b').length} of your lines said right.</p><button class="btn primary block" id="fin">Continue</button></section>`; $('#fin').onclick = done; $('#quit').onclick = () => goTab(); return; }
    const l = d.lines[DL.i], mine = l[0] === 'b';
    $('#app').innerHTML = `${head}<div class="ex"><div class="chat">${d.lines.slice(0, DL.i).map((x, j) => bubble(d, x, j)).join('')}${mine ? '' : bubble(d, l, DL.i)}</div>
      ${mine ? `<div class="panel"><div class="label">Your turn. Say it in Bisaya</div><div class="prompt">${esc(l[2])}</div>${l[3] ? `<div class="small muted">Hint: ${esc(l[3])}</div>` : ''}<div id="micw"></div><div id="res"></div></div>` : ''}</div><div class="foot" id="foot"></div>`;
    wireBubbles(d);
    const adv = () => { DL.i++; render(); };
    if (!mine) { foot(`<button class="btn primary block" id="nx">Next</button>`); $('#nx').onclick = adv; if (DL.spoke !== 'p' + DL.i) { DL.spoke = 'p' + DL.i; lineSay(l[1]); } }
    else {
      foot(`<button class="btn primary block" id="show">Show the line</button>`);
      $('#show').onclick = () => { $('#res').innerHTML = `<div class="corr">${esc(l[1])}</div>`; foot(`<div class="grades"><button class="btn" data-q="1">I said it</button><button class="btn" data-q="0">I blanked or used English</button></div>`); document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { if (+b.dataset.q) DL.right++; adv(); }); };
    }
  } else {
    const left = DL.pool.filter(j => !DL.order.includes(j)), full = DL.order.length === n;
    $('#app').innerHTML = `${head}<div class="ex"><div class="label">Tap the lines in the order they're said</div><div class="chat">${DL.order.map(j => bubble(d, d.lines[j], j, { en: DL.checked })).join('')}</div>
      ${full ? '' : `<div class="opts">${left.map(j => `<button class="opt cebopt" data-o="${j}">${esc(d.lines[j][1])}</button>`).join('')}</div>`}</div><div class="foot" id="foot"></div>`;
    wireBubbles(d);
    document.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { DL.order.push(+b.dataset.o); render(); });
    if (!full) { foot(`<button class="btn ghost block" id="undo" ${DL.order.length ? '' : 'disabled'}>Undo last</button>`); $('#undo').onclick = () => { DL.order.pop(); render(); }; }
    else {
      const ok = DL.order.every((j, k) => j === k); DL.checked = true;
      const f = $('#foot'); f.className = 'foot ' + (ok ? 'good' : 'bad');
      f.innerHTML = `<div class="verdict">${ok ? 'Tama! That flows.' : 'Not quite.'}</div>${ok ? '' : `<div class="small">The real order:</div><ol class="small" style="margin:0;padding-left:20px">${d.lines.map(l => `<li><b>${esc(l[1])}</b> <span class="muted">· ${esc(l[2])}</span></li>`).join('')}</ol>`}
        <div class="row"><button class="btn primary" id="fin">${ok ? 'Done' : 'Back'}</button>${ok ? '' : '<button class="btn ghost" id="again">Try again</button>'}</div>`;
      $('#fin').onclick = ok ? done : () => go('convos');
      if ($('#again')) $('#again').onclick = () => { DL.order = []; DL.checked = false; DL.pool = shuffle(DL.pool); render(); };
    }
  }
  $('#quit').onclick = () => goTab();
};

/* ---------- sentence rules: which rule a sentence shows, and the guide ---------- */
const QWORDS = new Set(['asa', 'unsa', 'unsay', 'kinsa', 'kanus-a', 'ngano', 'nganong', 'pila', 'tagpila', 'hain']);
const SHORTP = new Set(['ko', 'ka', 'ta', 'mi', 'mo']);
function ruleFor(ceb) {
  const t = tokens(ceb || '').map(lowTok); if (t.length < 2) return null;
  const f = t[0];
  if (['dili', 'di', 'wala', 'wa', 'ayaw'].includes(f)) return RULE.neg;
  if (QWORDS.has(f)) return RULE.ask;
  if (['gusto', 'ganahan', 'kinahanglan'].includes(f) && t.some(x => /^mo\w{2,}/.test(x))) return RULE.want;
  if (t.some(x => /^(koy|kay|siyay|naay|way|walay|adunay)$/.test(x))) return RULE.have;
  if (/^gi\w{3,}/.test(f) && t.some(x => ['nako', 'nimo', 'niya', 'nato', 'namo', 'nila'].includes(x))) return RULE.nako;
  if (t.slice(1, 3).some(x => ['na', 'pa', 'ra', 'gyud', 'jud', 'kaayo', 'lang'].includes(x)) && t.some((x, i) => i > 1 && SHORTP.has(x))) return RULE.little;
  if (/^(mo|ni|mi|nag|mag)\w{3,}/.test(f)) return RULE.time;
  if (t.includes('kaayo') || t.includes('nga')) return RULE.desc;
  if (SHORTP.has(t[1])) return RULE.ko;
  if (t.some(x => ['sa', 'og', 'si', 'ang'].includes(x))) return RULE.mark;
  return null;
}
function ruleChip(ceb) {
  const r = ruleFor(ceb); if (!r) return '';
  if (!ruleLearned(r.id)) return `<div class="panel rulechip"><div class="label">How it's built</div><div class="small">This uses <b>${esc(r.title.toLowerCase())}</b>. Binko will teach you that rule step by step in Build sentences.</div></div>`;
  return `<div class="panel rulechip"><div class="label">How it's built · rule ${r.n}</div><b>${esc(r.title)}</b><div class="small">${esc(r.short)}</div><button class="linkbtn" data-rule="${r.id}">See the rule</button></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-rule]'); if (!b) return; ruleOpen = b.dataset.rule; ruleBack = view; go('rules'); });
let ruleOpen = null, ruleBack = 'home';
VIEWS.rules = function () {
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Sentence rules</h2></div>
    ${binkoSays('Binko took a Bisaya sentence apart like an engine! You learn one part at a time in Build sentences: Binko explains it, you drill it, then you build with it. Rules you\'ve passed are open here to look back at.')}
    ${RULES.map(r => { const ok = ruleLearned(r.id); return `<details class="panel rule ${ok ? '' : 'later'}" id="r-${r.id}" ${ruleOpen === r.id ? 'open' : ''}><summary><b>${rulePic(r)} ${r.n}. ${esc(r.title)}${ok ? ' ✓' : ''}</b><div class="small muted">${ok ? esc(r.short) : 'Not learned yet. It comes up in Build sentences.'}</div></summary>
      ${r.steps.map(st => `<p class="small" style="margin:8px 0 4px">${esc(st[0])}</p>${st[1].map(x => `<div class="small" style="margin:2px 0 2px 10px"><b>${esc(x[0])}</b> <span class="muted">· ${esc(x[1])}</span><div class="muted" style="font-size:.85em">${esc(x[2])}</div></div>`).join('')}`).join('')}</details>`; }).join('')}
    <button class="btn primary block" id="tryb">Build sentences</button>`;
  $('#quit').onclick = () => { const b = ruleBack; ruleOpen = null; ruleBack = 'home'; go(b === 'rules' ? 'home' : b); };
  $('#tryb').onclick = startBuild;
  if (ruleOpen) { const el = $('#r-' + ruleOpen); if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 30); }
};
/* ---------- rule lessons: explain, drill, then build ---------- */
const ruleLearned = id => !!(S.rules && S.rules[id] && S.rules[id].ok);
function knownRoots() { const kw = knownWords(), r = new Set(kw); kw.forEach(t => { if (t.length > 4) r.add(t.replace(RE_AFFIX, '')); }); return r; }
const ruleQuiz = (r, roots) => r.quiz.filter(q => q.w.every(w => roots.has(w)));
// grammar rules come as soon as you know the words to practice them: up to two new ones a day
const RULES_PER_DAY = 2;
const rulesToday = () => S.ruleDay === today() ? (S.ruleCnt || 1) : 0;
function noteRuleLearned() { S.ruleCnt = rulesToday() + 1; S.ruleDay = today(); if (typeof Sfx !== 'undefined') Sfx.rule(); }
function nextRule(skip) {
  if (rulesToday() + (skip ? 1 : 0) >= RULES_PER_DAY) return null;
  const roots = knownRoots();
  return RULES.find(r => !ruleLearned(r.id) && (!skip || r.id !== skip.id) && ruleQuiz(r, roots).length >= Math.min(3, r.quiz.length)) || null;
}
/* ---------- grammar rules inside the daily session ----------
   A new rule shows up in the daily session like a new word: Binko explains it, then it comes back on a schedule.
   Questions get harder as you get them right: pick the right sentence -> which rule is this (with English)
   -> which rule is this (Bisaya only) and what's wrong with this sentence. */
const RULE_IX = {}; RULES.forEach((r, i) => RULE_IX[r.id] = i);
const ruleCardId = r => 'r' + RULE_IX[r.id];
function ensureRuleCards() { Object.keys(S.rules || {}).forEach(id => { if (S.rules[id].ok && RULE_IX[id] != null && !S.cards['r' + RULE_IX[id]]) S.cards['r' + RULE_IX[id]] = { b: 1, d: today(), r: 1, w: 0 }; }); }
// every rule a sentence shows (not just the main one), so a "which rule" question never has two right answers
function ruleHits(ceb) {
  const t = tokens(ceb || '').map(lowTok), out = new Set(); if (!t.length) return out;
  const f = t[0];
  if (['dili', 'di', 'wala', 'wa', 'ayaw'].includes(f) || t.includes('dili') || t.includes('wala')) out.add('neg');
  if (QWORDS.has(f) || t.includes('ba')) out.add('ask');
  if (t.some(x => ['gusto', 'ganahan', 'kinahanglan'].includes(x))) out.add('want');
  if (t.some(x => /^(koy|kay|siyay|naay|way|walay|adunay|tay|miy|silay|moy)$/.test(x))) out.add('have');
  if (t.some(x => /^gi\w{3,}/.test(x) || ['nako', 'nimo', 'niya', 'nato', 'namo', 'nila', 'ako', 'imo'].includes(x))) out.add('nako');
  if (t.some(x => ['na', 'pa', 'ra', 'gyud', 'jud', 'kaayo', 'lang', 'man', 'sad', 'pud'].includes(x))) out.add('little');
  if (t.some(x => /^(mo|ni|mi|nag|mag|maka|naka)\w{2,}/.test(x))) out.add('time');
  if (t.includes('kaayo') || t.includes('nga')) out.add('desc');
  if (t.some(x => SHORTP.has(x))) out.add('ko');
  if (t.some(x => ['sa', 'og', 'si', 'ang', 'ug'].includes(x))) out.add('mark');
  if (t.length >= 2 && !QWORDS.has(f) && !['dili', 'di', 'wala', 'wa', 'ayaw', 'gusto', 'ganahan', 'kinahanglan', 'naa', 'adunay'].includes(f)) out.add('first');
  return out;
}
// sentences that show a rule: built from words you know, the rule's own examples, and cards you've learned
function ruleSentences(r, knownOnly) {
  const out = [], kw = knownWords(), known = s => tokens(s).every(t => kw.has(lowTok(t)));
  allPatternSentences().filter(x => x.pt.rule === r.id).forEach(x => out.push([x.ceb, x.en]));
  r.steps.forEach(st => st[1].forEach(x => { if (tokens(x[0]).length >= 2 && !/→/.test(x[0])) out.push([x[0], x[1]]); }));
  r.quiz.forEach(q => out.push([q.a[0], qText(q.q)]));
  Object.keys(S.cards).forEach(id => { if (id[0] === 'r' || S.cards[id].b < 1) return; const c = card(id); if (c && ruleFor(c.ceb) === r) out.push([firstAlt(c.ceb), firstAlt(c.en)]); });
  const seen = new Set(); return out.filter(x => { const k = norm(x[0]); if (seen.has(k)) return false; seen.add(k); return !knownOnly || known(x[0]); });
}
function ruleOpts(r, ceb) {
  const hits = ruleHits(ceb); hits.add(r.id);
  const others = RULES.filter(x => !hits.has(x.id)), mine = shuffle(others.filter(x => ruleLearned(x.id))), rest = shuffle(others.filter(x => !ruleLearned(x.id)));
  return shuffle([r, ...mine.concat(rest).slice(0, 3)]);
}
const playSentence = async (s, btn) => { const r = ++playReq, cx = audioCtx(); const u = nativeUrl(s) || await voiceUrlA(s); if (u && stillWanted(r, cx)) return playUrl(u, 1, btn); };
const sayBtn = s => hasVoice(s) ? `<div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><span class="muted small">Computer voice</span></div>` : '';
function ruleChoice(c, item, opts, rightId, shown, extra) {
  let sel = null;
  $('#ex').querySelector('.opts').innerHTML = opts.map((o, i) => `<button class="opt ${o.ceb ? 'cebopt' : ''}" data-i="${i}">${esc(o.t)}</button>`).join('');
  if ($('#pl')) { $('#pl').onclick = e => playSentence(shown.ceb, e.currentTarget); playSentence(shown.ceb, $('#pl')); }
  foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
  const btns = [...document.querySelectorAll('.opt')];
  btns.forEach(b => b.onclick = () => { btns.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.i; $('#chk').disabled = false; });
  $('#chk').onclick = () => {
    const ok = opts[sel].id === rightId;
    btns.forEach((b, i) => { b.disabled = true; if (opts[i].id === rightId) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); });
    let why = '';
    if (!ok) { const p = opts[sel], pr = RULE[p.id];
      why = pr ? `You picked <b>${esc(pr.title)}</b>. That rule is about: ${esc(pr.short)}<br>` : `You picked <b>${esc(p.t)}</b>.${diffNote(shown.ceb, p.t) ? ' ' + diffNote(shown.ceb, p.t) + '.' : ''}<br>`; }
    // keep the card's own kind: a missed word comes back as a word question, not as a grammar-rule question (which would crash)
    result({ id: c.id, kind: c.kind || 'r', ceb: shown.ceb, en: shown.en, audio: false }, item, ok, why + extra);
  };
}
// a rule step's examples, keeping only sentences made of words you've met (plus the rule's own little words)
function ruleStepEx(r, st) {
  const ruleWords = new Set(st[1].flatMap(x => tokens(x[0]).map(lowTok)).filter(w => w.length <= 5 || /^(mo|ni|nag|gi)/.test(w) === false));
  const ok = st[1].filter(x => /→/.test(x[0]) || tokens(x[0]).length <= 1 || knownOk(x[0], new Set(tokens(x[0]).map(lowTok).filter(w => w.length <= 4))));
  if (ok.length) return ok;
  const gen = allPatternSentences(true).filter(x => x.pt.rule === r.id); return gen.length ? [[gen[0].ceb, gen[0].en, '']] : st[1].filter(x => tokens(x[0]).length <= 1);
}
const ruleHard = c => ((S.cards[c.id] || {}).b || 0) >= 2;
const qText = q => { const m = String(q).match(/["“]([^"”]+)["”]/); return m ? m[1] : String(q).replace(/^how do you say\s*/i, '').replace(/\?$/, ''); };
Object.assign(EX, {
  rteach(c, item) {
    const r = c.rule; sess.newIds.add(c.id);
    if (!S.cards[c.id]) S.cards[c.id] = { b: 0, d: today() + 1, r: 0, w: 0 };
    S.rules = S.rules || {}; if (!ruleLearned(r.id)) { S.rules[r.id] = { ok: 1, d: today() }; noteRuleLearned(); } save();   // coming back to this screen doesn't count as another new rule
    $('#ex').innerHTML = `${rulePic(r, 'big')}<div class="label">New grammar rule · ${r.n} of ${RULES.length}</div><div class="ceb" style="font-size:1.7rem">${esc(r.title)}</div>
      <div class="prompt" style="font-weight:500;font-size:1.05rem">${esc(r.short)}</div>
      ${r.steps.map(st => `<div class="panel"><div>${esc(st[0])}</div>${ruleStepEx(r, st).map(x => `<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><b style="color:var(--sea)">${esc(x[0])}</b>${hasVoice(x[0]) ? `<button class="play sm" data-vs="${esc(x[0])}" aria-label="Play">${I.play}</button>` : ''}<span class="muted small">${esc(x[1])}${x[2] ? ' · ' + esc(x[2]) : ''}</span></div>`).join('')}</div>`).join('')}
      ${binkoSays('This rule will come back in your sessions. Each time you get it right, Binko makes the questions a little harder!')}`;
    document.querySelectorAll('[data-vs]').forEach(b => b.onclick = () => playSentence(b.dataset.vs, b));
    foot(`<button class="btn primary block" id="cont">Got it</button>`); $('#cont').onclick = next;
  },
  rq(c, item) { // pick the sentence that follows the rule
    const r = c.rule, hard = ruleHard(c), roots = knownRoots(); let qs = ruleQuiz(r, roots);
    const gen = allPatternSentences(true).filter(x => x.pt.rule === r.id && x.decoys.length >= 2);
    if (!qs.length && !gen.length) { qi++; return VIEWS.session(); }
    const useGen = gen.length && (!qs.length || Math.random() < (hard ? 0.6 : 0.3));
    const q = useGen ? (g => ({ q: g.en, a: [g.ceb, ...g.decoys.slice(0, 2)], why: r.short }))(pick(gen)) : pick(qs);
    const opts = shuffle(q.a.map((a, i) => ({ id: i ? 'x' + i : 'ok', t: a, ceb: 1 })));
    $('#ex').innerHTML = `<div class="label">${hard ? 'Pick the right one' : 'Rule ' + r.n + ' · ' + esc(r.title)}</div><div class="prompt">How do you say “${esc(qText(q.q))}”?</div><div class="opts"></div>`;
    ruleChoice(c, item, opts, 'ok', { ceb: q.a[0], en: qText(q.q) }, `<b>Rule ${r.n}:</b> ${esc(q.why)}`);
  },
  rid(c, item) { // which rule is this?
    const r = c.rule, hard = ruleHard(c), ss = ruleSentences(r, true);
    const s = ss.length ? pick(ss) : null; if (!s) { qi++; return VIEWS.session(); }
    const opts = ruleOpts(r, s[0]); if (opts.length < 3) return EX.rq(c, item);
    $('#ex').innerHTML = `<div class="label">Which rule is this sentence using?</div><div class="ceb">${esc(s[0])}</div>${sayBtn(s[0])}${hard ? '' : `<div class="prompt" style="font-weight:500">${esc(s[1])}</div>`}<div class="opts"></div>`;
    ruleChoice(c, item, opts.map(x => ({ id: x.id, t: x.title })), r.id, { ceb: s[0], en: s[1] }, `<b>Rule ${r.n}: ${esc(r.title)}.</b> ${esc(r.short)}`);
  },
  rfix(c, item) { // a sentence that breaks the rule: which rule fixes it?
    const r = c.rule, q = pick(ruleQuiz(r, knownRoots()).filter(x => x.a.length > 1)); if (!q) return EX.rid(c, item);
    const bad = pick(q.a.slice(1)), opts = ruleOpts(r, q.a[0]); if (opts.length < 3) return EX.rq(c, item);
    $('#ex').innerHTML = `<div class="label">Something's off</div><div class="prompt">This is supposed to mean “${esc(qText(q.q))}”:</div><div class="ceb" style="text-decoration:line-through;text-decoration-color:var(--bad);text-decoration-thickness:2px">${esc(bad)}</div><div class="prompt" style="font-size:1rem">Which rule fixes it?</div><div class="opts"></div>`;
    ruleChoice(c, item, opts.map(x => ({ id: x.id, t: x.title })), r.id, { ceb: q.a[0], en: qText(q.q) }, `<b>Rule ${r.n}:</b> ${esc(q.why)}`);
  }
});
function ruleWaitHint() {
  const roots = knownRoots(), r = RULES.find(x => !ruleLearned(x.id)); if (!r) return '';
  const miss = [...new Set(r.quiz.flatMap(q => q.w))].filter(w => !roots.has(w)).slice(0, 4);
  return `Rule ${r.n}, "${r.title}", opens after you learn ${miss.join(', ')} in your daily sessions.`;
}
// the words a pattern fills in, and whether you know them
const patItems = pt => ({ v: VERBS, s: STATES, n: NOUNS, pl: PLACES, gi: GI, adj: ADJN })[pt.uses] || [];
function itemKnown(pt, w, has) {
  if (pt.uses === 'v') return has(w[0]) || has(w[1]) || has(w[2]) || has('nag' + w[0]);
  if (pt.uses === 'gi') return (has(w[0][0]) || has(w[0][0].slice(2))) && has(w[1][0]);
  if (pt.uses === 'adj') return has(w[0][0]) && has(w[1][0]);
  return has(w[0]);
}
function buildPool() {
  const kw = knownWords(), has = w => kw.has(String(w).toLowerCase());
  const verbs = VERBS.filter(v => itemKnown({ uses: 'v' }, v, has));
  const states = STATES.filter(x => has(x[0]));
  const prons = PRONS.filter(p => has(p[0]));
  const out = [];
  PATTERNS.forEach(pt => {
    if (!pt.need.every(has) || !pt.rules.every(ruleLearned)) return;
    const ps = (pt.uses === 'adj' ? PRONS.slice(0, 1) : prons).filter(p => !pt.pron || pt.pron.includes(p[0])); if (!ps.length) return;
    patItems(pt).filter(w => itemKnown(pt, w, has)).forEach(w => ps.forEach(p => out.push({ pt, w, p })));
  });
  return { out, verbs, states, prons };
}
/* Every sentence the patterns can make, with wrong versions that break the rule or change the meaning.
   Used for grammar questions in the daily session, and voiced by the computer voice ahead of time. */
let PAT_CACHE = null;
const capTok = (toks, q) => { const t = toks.map((x, i) => i === 0 ? cap(x) : (/^[A-Z]/.test(x) && !['Cebu', 'Manila'].includes(x) ? x.toLowerCase() : x)); return t.join(' ').replace(/\?\s*$/, '') + (q ? '?' : ''); };
function patWrong(pt, p, w, toks) {
  const q = /\?$/.test(toks[toks.length - 1]), bare = toks.map(t => t.replace(/\?$/, '')), out = [];
  const front = () => { const i = bare.findIndex((t, j) => j > 0 && t.toLowerCase() === p[0]); if (i > 0) out.push(capTok([bare[i], ...bare.filter((_, j) => j !== i)], q)); };
  const swapAt = (i, to) => { if (i >= 0) { const t = bare.slice(); t[i] = to; out.push(capTok(t, q)); } };
  const tense = () => { const i = bare.findIndex(t => /^(mo|ni)/i.test(t) && t.length > 4); if (i >= 0) swapAt(i, /^mo/i.test(bare[i]) ? bare[i].replace(/^mo/i, 'ni') : bare[i].replace(/^ni/i, 'mo')); };
  switch (pt.id) {
    case 'will': case 'did': case 'now': case 'want': case 'like': case 'where': case 'goto': case 'went': front(); tense(); break;
    case 'wont': front(); swapAt(0, 'wala'); break;
    case 'didnt': front(); swapAt(0, 'dili'); break;
    case 'state': front(); out.push(capTok([bare[0], 'kaayo', ...bare.slice(1)], q)); break;
    case 'very': front(); out.push(capTok(bare.filter(t => t !== 'kaayo'), q)); break;
    case 'notstate': front(); out.push(capTok([bare[0], bare[2], bare[1]], q)); break;
    case 'askstate': out.push(capTok(['ka', bare[0], 'ba'], true)); swapAt(1, 'ko'); break;
    case 'have': swapAt(1, p[0]); out.push(capTok([p[0] + 'y', 'naa', bare[2]], q)); swapAt(0, 'wala'); break;
    case 'nohave': swapAt(0, 'naa'); out.push(capTok([p[0] + 'y', 'wala', bare[2]], q)); break;
    case 'gi': { out.push(capTok([bare[1], bare[0], ...bare.slice(2)], q)); const other = Object.values(NAKO).find(x => x !== bare[1]); swapAt(1, other); break; }
    case 'descnga': { out.push(capTok([bare[0], bare[2]], q)); const o = ADJ.find(a => a[2] === w[0][2] && a[0] !== w[0][0]); if (o) swapAt(0, o[0]); break; }
    case 'descvery': out.push(capTok(['kaayo', bare[0], ...bare.slice(2)], q)); out.push(capTok(bare.filter(t => t !== 'kaayo'), q)); break;
  }
  const right = norm(capTok(bare, q)); return [...new Set(out)].filter(x => norm(x) !== right);
}
function allPatternSentences(knownOnly) {
  if (!PAT_CACHE) {
    PAT_CACHE = [];
    PATTERNS.forEach(pt => {
      const ps = (pt.uses === 'adj' ? PRONS.slice(0, 1) : PRONS).filter(p => !pt.pron || pt.pron.includes(p[0]));
      patItems(pt).forEach(w => ps.forEach(p => { const [toks, en] = pt.make(p, w); const q = /\?$/.test(toks[toks.length - 1]);
        PAT_CACHE.push({ pt, w, p, toks, ceb: capTok(toks.map(t => t.replace(/\?$/, '')), q), en, decoys: patWrong(pt, p, w, toks) }); }));
    });
  }
  if (!knownOnly) return PAT_CACHE;
  const kw = knownWords(); return PAT_CACHE.filter(x => x.toks.every(t => kw.has(lowTok(t))) && x.pt.need.every(n => kw.has(n)));
}
function buildLock() {
  if (nextRule()) return null;
  if (buildPool().out.length >= 3) return null;
  if (rulesToday() >= RULES_PER_DAY) return 'You learned two new rules today. Sentence practice with them opens once you know a few more words to build with. More rules come tomorrow.';
  return 'Opens soon. ' + ruleWaitHint();
}
function buildDesc() { const nr = nextRule(); return nr ? `New rule today: "${nr.title}". Binko explains it, you drill it, then you build sentences with it.` : 'Build your own sentences with the rules you know.'; }
let BD = null;
function pickSentences(n, favor) {
  const { out } = buildPool();
  const byPt = {}; shuffle(out).forEach(x => (byPt[x.pt.id] = byPt[x.pt.id] || []).push(x));
  const lists = Object.values(byPt).sort((a, b) => (b[0].pt.rules.includes(favor) ? 1 : 0) - (a[0].pt.rules.includes(favor) ? 1 : 0));
  const qs = []; let round = 0;
  while (qs.length < n && round < n) { lists.forEach(l => { if (qs.length < n && l[round]) qs.push(l[round]); }); round++; }
  return shuffle(qs);
}
function startBuild() {
  const L = buildLock();
  if (L) { view = 'locked'; $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Build sentences</h2></div>${binkoSays('Build sentences is still locked! Binko only builds with parts you already have. ' + esc(L))}`; $('#quit').onclick = () => goTab(); return; }
  const nr = nextRule(), roots = knownRoots();
  // a new rule: explain it, then drill it. No new rule: a quick review drill of rules already learned.
  const learned = RULES.filter(r => ruleLearned(r.id));
  const quiz = nr ? shuffle(ruleQuiz(nr, roots)).slice(0, 5) : shuffle(learned.flatMap(r => ruleQuiz(r, roots).map(q => Object.assign({ r }, q)))).slice(0, 3);
  BD = { nr, phase: nr ? 'teach' : (quiz.length ? 'drill' : 'tiles'), step: 0, quiz, qi: 0, qRight: 0, qs: [], i: 0, right: 0 };
  if (!nr) BD.qs = pickSentences(7);
  sess = newSess('build'); go('build');
}
function buildHead() {
  const total = (BD.nr ? BD.nr.steps.length : 0) + BD.quiz.length + Math.max(BD.qs.length, 6) + 1;
  const done = (BD.phase === 'teach' ? BD.step : (BD.nr ? BD.nr.steps.length : 0) + (BD.phase === 'drill' ? BD.qi : BD.quiz.length + BD.i));
  return `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><div class="prog"><i style="width:${Math.min(100, done / total * 100)}%"></i></div><span class="muted small">${BD.phase === 'teach' ? 'New rule' : BD.phase === 'drill' ? 'Drill' : 'Build'}</span></div>`;
}
VIEWS.build = function () {
  const head = buildHead();
  if (BD.phase === 'teach') {
    const r = BD.nr, st = r.steps[BD.step];
    $('#app').innerHTML = `${head}<div class="ex"><div class="label">New rule ${r.n} · ${esc(r.title)}</div>
      ${BD.step === 0 ? binkoSays('New part for the engine! Binko will show you how it works, one step at a time.') : ''}
      <div class="panel"><div style="font-size:1.05rem">${esc(st[0])}</div>
      ${st[1].map(x => `<div style="margin-top:10px"><div class="row" style="gap:8px;align-items:center"><div class="ceb" style="font-size:1.4rem">${esc(x[0])}</div>${hasVoice(x[0]) ? `<button class="play sm" data-vs="${esc(x[0])}" aria-label="Play">${I.play}</button>` : ''}</div>${/→/.test(x[0]) ? '' : phonHtml(x[0])}<div>${esc(x[1])}</div><div class="small muted">${esc(x[2])}</div></div>`).join('')}</div>
      <p class="muted small" style="margin:0">Step ${BD.step + 1} of ${r.steps.length}. Say the examples out loud.</p></div><div class="foot" id="foot"></div>`;
    foot(`<button class="btn primary block" id="nx">${BD.step < r.steps.length - 1 ? 'Next' : 'Drill it'}</button>`);
    $('#nx').onclick = () => { if (BD.step < r.steps.length - 1) BD.step++; else BD.phase = 'drill'; render(); };
    document.querySelectorAll('[data-vs]').forEach(b => b.onclick = () => playSentence(b.dataset.vs, b));
  } else if (BD.phase === 'drill') {
    if (BD.qi >= BD.quiz.length) return drillDone(head);
    const q = BD.quiz[BD.qi], r = q.r || BD.nr, opts = shuffle(q.a.map((x, j) => ({ x, ok: j === 0 })));
    $('#app').innerHTML = `${head}<div class="ex"><div class="label">${BD.nr ? 'Drill' : 'Quick review'} · rule ${r.n}, ${esc(r.title)}</div><div class="prompt">${esc(q.q)}</div><div class="opts">${opts.map((o, j) => `<button class="opt cebopt" data-o="${j}">${esc(o.x)}</button>`).join('')}</div></div><div class="foot" id="foot"></div>`;
    pickThenCheck('[data-o]', b => {
      const j = +b.dataset.o, ok = opts[j].ok; logAnswer(ok); if (ok) { BD.qRight++; addXP(4); }
      document.querySelectorAll('[data-o]').forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add('right'); else if (k === j) x.classList.add('wrong'); });
      const f = $('#foot'); f.className = 'foot ' + (ok ? 'good' : 'bad');
      f.innerHTML = `<div class="verdict">${ok ? 'Tama!' : 'Dili pa.'}</div><div class="small">${esc(q.why)}</div><button class="btn primary block" id="cont">Continue</button>`;
      $('#cont').onclick = () => { BD.qi++; render(); };
    }, 'Pick the one that sounds right, then Check.');
  } else {
    if (BD.i >= BD.qs.length) return buildOwn(head);
    return buildTiles(head);
  }
  $('#quit').onclick = () => goTab();
};
function drillDone(head) {
  const n = BD.quiz.length, pass = BD.qRight >= Math.ceil(n * 0.75);
  if (BD.nr) {
    if (pass) { S.rules = S.rules || {}; S.rules[BD.nr.id] = { ok: 1, d: today() }; noteRuleLearned(); ensureRuleCards(); save(); }
    BD.qs = pickSentences(6, BD.nr.id);
  }
  const msg = !BD.nr ? `Review done: ${BD.qRight} of ${n}. Now let's build!`
    : pass ? `Rule ${BD.nr.n} unlocked! ${BD.qRight} of ${n} right. ${BD.qs.length ? 'Now build real sentences with it.' : 'Sentences with it open once you know a few more words.'}`
    : `${BD.qRight} of ${n}. Close! Binko will go over this rule with you again tomorrow. ${BD.qs.length ? 'Now some practice with the rules you already know.' : ''}`;
  $('#app').innerHTML = `${head}<div class="ex">${binkoSays(esc(msg), true)}${BD.nr ? `<div class="panel"><b>${esc(BD.nr.title)}</b><div class="small">${esc(BD.nr.short)}</div></div>` : ''}</div><div class="foot" id="foot"></div>`;
  foot(`<button class="btn primary block" id="nx">${BD.qs.length ? 'Build sentences' : 'Finish'}</button>`);
  $('#nx').onclick = () => { BD.phase = 'tiles'; if (!BD.qs.length) return finishBuild(); render(); };
  $('#quit').onclick = () => goTab();
}
function finishBuild() { tick('build'); addXP(10); save(); view = 'done'; sectionDone('Build sentences', BD.nr && ruleLearned(BD.nr.id) ? 'New rule learned: ' + esc(BD.nr.title) : BD.right + ' of ' + BD.qs.length + ' sentences right'); }
function buildTiles(head) {
  const q = BD.qs[BD.i], [toks, en] = q.pt.make(q.p, q.w), r = RULE[q.pt.rule];
  const ans = toks.map(t => t.replace(/[?]/g, '')), decoys = q.pt.decoy(q.p, q.w).filter(d => !ans.map(a => a.toLowerCase()).includes(d.toLowerCase()));
  const kw = knownWords(); const extra = decoys.filter(d => kw.has(d.toLowerCase())).slice(0, 2);
  const bank = shuffle(ans.map((t, i) => ({ t: i ? t : t.toLowerCase(), k: 'a' + i })).concat(extra.map((t, i) => ({ t, k: 'x' + i })))), chosen = [];
  $('#app').innerHTML = `${head}<div class="ex"><div class="label">Build it in Bisaya</div><div class="prompt">${esc(en)}${/\?$/.test(toks[toks.length - 1]) ? '' : ''}</div>
    <div class="small muted">Rule ${r.n}: ${esc(r.short)}</div><div class="tray" id="tray"></div><div class="bank" id="bank">${bank.map(b => `<button class="tile" data-k="${b.k}">${esc(b.t)}</button>`).join('')}</div></div><div class="foot" id="foot"></div>`;
  foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
  const draw = () => {
    $('#tray').innerHTML = chosen.map(k => `<button class="tile" data-k="${k}">${esc(bank.find(b => b.k === k).t)}</button>`).join('');
    document.querySelectorAll('#bank .tile').forEach(b => b.classList.toggle('used', chosen.includes(b.dataset.k)));
    $('#tray').querySelectorAll('.tile').forEach(b => b.onclick = () => { chosen.splice(chosen.indexOf(b.dataset.k), 1); draw(); });
    $('#chk').disabled = !chosen.length;
  };
  document.querySelectorAll('#bank .tile').forEach(b => b.onclick = () => { if (!chosen.includes(b.dataset.k)) { chosen.push(b.dataset.k); draw(); } });
  $('#chk').onclick = () => {
    const got = chosen.map(k => bank.find(b => b.k === k).t).join(' '), want = cap(toks.join(' ')), ok = norm(got) === norm(want);
    logAnswer(ok); if (ok) { BD.right++; addXP(6); }
    const f = $('#foot'); f.className = 'foot ' + (ok ? 'good' : 'bad');
    f.innerHTML = `<div class="verdict">${ok ? 'Tama!' : 'Dili pa. Not yet.'}</div><div class="ans"><span>${esc(want)}</span> <span class="muted" style="font-weight:400">· ${esc(en)}</span></div>
      ${ok ? '' : `<div class="small">You built "${esc(got)}"</div>`}<div class="small"><b>Rule ${r.n}, ${esc(r.title)}:</b> ${esc(r.short)}</div>
      <button class="btn primary block" id="cont">Continue</button>`;
    $('#cont').onclick = () => { BD.i++; render(); };
  };
  $('#quit').onclick = () => goTab();
}
// the last step: the learner makes a sentence of their own and checks it against the pattern
function buildOwn(head) {
  const { verbs, states, prons } = buildPool();
  const p = prons.find(x => x[0] === 'ko') || prons[0];
  const kw = knownWords(), has = w => kw.has(w);
  const opts = [verbs.length && has('dili') && ruleLearned('neg') && { pat: `Dili ${p[0]} mo___`, tip: 'Something you won\'t do. Remember: ' + p[0] + ' goes right after dili.', re: new RegExp(`^dili ${p[0]} mo\\S+`), words: verbs.map(v => v[1]) },
    verbs.length && has('gusto') && ruleLearned('want') && { pat: `Gusto ${p[0]} mo___`, tip: 'Something you want to do.', re: new RegExp(`^gusto ${p[0]} mo\\S+`), words: verbs.map(v => v[1]) },
    verbs.length && ruleLearned('time') && { pat: `Ni___ ${p[0]}`, tip: 'Something you did today.', re: new RegExp(`^(ni|mi)\\S+ ${p[0]}\\b`), words: verbs.map(v => v[2]) },
    states.length && ruleLearned('first') && { pat: `___ ${p[0]}`, tip: 'How you feel right now.', re: new RegExp(`^\\S+ ${p[0]}$`), words: states.map(x => x[0]) }].filter(Boolean);
  const o = opts[Math.floor(Math.random() * opts.length)]; if (!o) return finishBuild();
  $('#app').innerHTML = `${head}<div class="ex">${binkoSays('Your turn to be the creator! Make your own sentence. Any word you know can go in the blank.')}
    <div class="panel"><div class="label">Pattern</div><div class="ceb">${esc(o.pat)}</div><div class="small">${esc(o.tip)}</div>
    <div class="small muted" style="margin-top:6px">Words you know that fit: ${o.words.slice(0, 12).map(esc).join(', ')}</div></div>
    <input class="field" id="own" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your sentence in Bisaya"><div id="res"></div></div><div class="foot" id="foot"></div>`;
  foot(`<button class="btn primary block" id="chk" disabled>Check my sentence</button>`);
  const inp = $('#own'); inp.focus(); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
  const finish = finishBuild;
  const check = () => {
    const v = norm(inp.value), okShape = o.re.test(v), fill = o.words.some(w => v.split(' ').includes(w));
    inp.classList.remove('right', 'wrong'); inp.classList.add(okShape ? 'right' : 'wrong');
    $('#res').innerHTML = okShape ? `<div class="panel good-note"><b>${fill ? 'Tama! That follows the pattern.' : 'The order is right.'}</b>${fill ? '' : '<div class="small">Check the action word is one you know: ' + esc(o.words.slice(0, 6).join(', ')) + '…</div>'}<div class="small muted">Say it out loud twice.</div></div>`
      : `<div class="panel"><b>Close. Check the order.</b><div class="small">The pattern is <b>${esc(o.pat)}</b>. ${esc(RULE.ko.short)}</div></div>`;
    foot(`<button class="btn primary block" id="fin">${okShape ? 'Done' : 'Finish anyway'}</button>${okShape ? '' : '<button class="btn ghost block" id="again">Try again</button>'}`);
    $('#fin').onclick = finish; if ($('#again')) $('#again').onclick = () => { inp.focus(); foot(`<button class="btn primary block" id="chk">Check my sentence</button>`); $('#chk').onclick = check; };
  };
  $('#chk').onclick = check;
  $('#quit').onclick = () => goTab();
}

/* ---------- Real Bisaya: tweets and show clips ---------- */
const realKey = (kind, i) => kind + i;
const tweetWords = t => {
  const out = [];
  t[2].replace(/["“”/]|\.\.\./g, ' ').split(/\s+/).forEach(raw => {
    const w = raw.replace(/[.,!?…¿¡:;()]/g, '').toLowerCase(); if (!w || REAL_SKIP.has(w) || !/[a-z]/.test(w)) return;
    (t[4][w] ? t[4][w].split(' ') : [w]).forEach(x => out.push(x));
  });
  return [...new Set(out)];
};
const RE_AFFIX = /^(nag|mag|mo|ni|mi|gi|na|pag|ka|ma|mu|ga|naka|maka)-?/;
const knowsWord = (kw, w) => kw.has(w) || (w.length > 4 && kw.has(w.replace(RE_AFFIX, '')));
function realItems() {
  if (typeof REAL_TWEETS === 'undefined') return [];
  const kw = knownWords(), { stats, cur } = pathState();
  const tw = REAL_TWEETS.map((t, i) => { const left = tweetWords(t).filter(w => !knowsWord(kw, w)); return { key: realKey('t', i), kind: 't', i, t, left, open: !left.length }; });
  const cl = REAL_CLIPS.map((c, i) => ({ key: realKey('c', i), kind: 'c', i, c, open: cur > c.stage || (cur === c.stage && stats[c.stage].frac >= 0.5) }));
  const sg = REAL_SONGS.map((g, i) => { const left = g.words.filter(w => !knowsWord(kw, w)); return { key: realKey('s', i), kind: 's', i, g, left, open: !left.length && g.decoys.every(w => knowsWord(kw, w)) }; });
  return tw.concat(cl, sg);
}
function realToday() {
  const p = planDay(), items = realItems();
  if (p.realKey) { const it = items.find(x => x.key === p.realKey); if (it && it.open) return it; }
  const done = S.realDone || {}, open = items.filter(x => x.open);
  if (!open.length) return null;
  // least-done first; alternate tweets and clips day to day
  const pref = ['t', 'c', 's'][today() % 3];
  open.sort((a, b) => (done[a.key] || 0) - (done[b.key] || 0) || (a.kind === pref ? -1 : 0) - (b.kind === pref ? -1 : 0) || a.i - b.i);
  p.realKey = open[0].key; return open[0];
}
function realLockHint() {
  const items = realItems(), tw = items.filter(x => x.kind === 't').sort((a, b) => a.left.length - b.left.length)[0];
  return tw ? `A post from ${tw.t[1]} opens after you learn ${tw.left.length} more word${tw.left.length === 1 ? '' : 's'} (${tw.left.slice(0, 4).join(', ')}${tw.left.length > 4 ? '…' : ''}).` : '';
}
function realLockItem() {
  const it = realToday();
  return it ? { k: 'real', name: 'Real Bisaya', d: it.kind === 't' ? `A real post by ${it.t[1]}. Translate it, then reply in Bisaya.` : it.kind === 's' ? `A bit of "${it.g.song}" by ${it.g.artist}. Catch the words you know, then the meaning.` : `A clip from ${it.c.show}. Watch, catch the gist, then answer in Bisaya.`, run: () => go('real') }
    : { k: 'real', locked: true, name: 'Real Bisaya', d: 'Locked for now, so it counts as done. ' + realLockHint() };
}
let RB = null, twLoaded = false;
function loadTwitter() { if (twLoaded) { window.twttr && twttr.widgets && twttr.widgets.load(); return; } twLoaded = true; const s = document.createElement('script'); s.src = 'https://platform.twitter.com/widgets.js'; s.async = true; document.head.appendChild(s); }
VIEWS.real = function () {
  const it = RB && RB.it ? RB.it : realToday();
  const top = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Real Bisaya</h2></div>`;
  if (!it) { $('#app').innerHTML = `${top}${binkoSays('Real Bisaya is still locked! Binko only shows you real posts once you know every word in them. ' + esc(realLockHint()) + ' Keep doing your daily sessions!')}`; $('#quit').onclick = () => goTab(); return; }
  if (!RB || RB.it !== it) RB = { it, step: 'see' };
  const done = () => { tick('real'); S.realDone = S.realDone || {}; S.realDone[it.key] = (S.realDone[it.key] || 0) + 1; addXP(12); save(); const was = it; RB = null; view = 'done'; sectionDone('Real Bisaya done', '+12 XP · ' + esc(was.kind === 't' ? 'post by ' + was.t[1] : was.kind === 's' ? '"' + was.g.song + '" by ' + was.g.artist : was.c.show)); };
  const respond = (prompt, ex) => {
    $('#step').innerHTML = `<div class="panel"><div class="label">Now answer in Bisaya</div><div class="prompt">${esc(prompt)}</div><input class="field" id="rep" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type or say it out loud"><div id="exr"></div></div>`;
    foot(`<button class="btn primary block" id="sh">Show an example</button>`); $('#rep').focus();
    $('#sh').onclick = () => { $('#exr').innerHTML = `<div class="corr">${esc(ex)}</div>${ruleChip(ex)}`; foot(`<button class="btn primary block" id="fin">Done</button>`); $('#fin').onclick = done; };
  };
  if (it.kind === 't') {
    const t = it.t, url = 'https://twitter.com' + t[0];
    const notes = Object.entries(t[4]).filter(([k, v]) => k !== v).map(([k, v]) => `<b>${esc(k)}</b> = ${esc(v)}`).join(' · ');
    $('#app').innerHTML = `${top}<div class="ex"><div class="label">A real post · every Bisaya word in it is one you've learned</div>
      <blockquote class="twitter-tweet" data-theme="dark" data-dnt="true" data-conversation="none"><p lang="ceb">${esc(t[2])}</p>&mdash; ${esc(t[1])} <a href="${url}">${esc(url)}</a></blockquote>
      <div id="step"></div></div><div class="foot" id="foot"></div>`;
    loadTwitter();
    $('#step').innerHTML = `<div class="panel"><div class="label">Translate it</div><textarea class="field" id="tr" rows="2" placeholder="What does it say in English?"></textarea><div id="key"></div></div>`;
    foot(`<button class="btn primary block" id="chk">Check</button>`); $('#tr').focus();
    $('#chk').onclick = () => {
      $('#key').innerHTML = `<div class="corr">${esc(t[3])}</div>${breakdown(t[2].replace(/["“”]/g, ''))}${notes ? `<div class="small"><b>Shortcuts in this post:</b> ${notes}</div>` : ''}${ruleChip(t[2].replace(/["“”]/g, ''))}`;
      foot(`<div class="grades"><button class="btn" data-g="1">I got the gist</button><button class="btn" data-g="0">I missed it</button></div>`);
      document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => respond(t[5], t[6]));
    };
  } else if (it.kind === 's') {
    const g = it.g, list = shuffle(g.words.concat(g.decoys)), picked = new Set();
    $('#app').innerHTML = `${top}<div class="ex"><div class="label">Song · ${esc(g.song)} · ${esc(g.artist)}</div>
      <div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${g.yt}?start=${g.from}&end=${g.to}&rel=0&playsinline=1&modestbranding=1&cc_load_policy=0" title="${esc(g.song)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
      <p class="muted small" style="margin:0">Sound on. It stops by itself after ${g.to - g.from} seconds. Replay it as often as you like.</p><div id="step"></div></div><div class="foot" id="foot"></div>`;
    const words = () => {
      $('#step').innerHTML = `<div class="panel"><div class="label">Tap every word you hear sung</div><div class="bank">${list.map(w => `<button class="tile" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div><div id="key"></div></div>`;
      document.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { const w = b.dataset.w; picked.has(w) ? picked.delete(w) : picked.add(w); b.classList.toggle('sel', picked.has(w)); });
      foot(`<button class="btn primary block" id="chk">Check</button>`);
      $('#chk').onclick = () => {
        const real = new Set(g.words); let hit = 0;
        document.querySelectorAll('[data-w]').forEach(b => { const w = b.dataset.w; b.disabled = true; if (real.has(w)) { b.classList.add('right'); if (picked.has(w)) hit++; } else if (picked.has(w)) b.classList.add('wrong'); });
        const wrong = [...picked].filter(w => !real.has(w)).length;
        $('#key').innerHTML = `<div class="small" style="margin-top:8px"><b>${hit} of ${g.words.length}</b> sung words caught${wrong ? `, ${wrong} decoy${wrong === 1 ? '' : 's'} picked` : ''}. Green ones are in the song.</div><div class="small muted">${g.words.map(w => `<b>${esc(w)}</b> = ${esc(glossOf(w) || '')}`).join(' · ')}</div>`;
        foot(`<button class="btn primary block" id="nx">Next: what does it mean?</button>`); $('#nx').onclick = meaning;
      };
    };
    const meaning = () => {
      const opts = shuffle(g.a.map((x, j) => ({ x, ok: j === 0 })));
      $('#step').innerHTML = `<div class="panel"><div class="label">${esc(g.q)}</div><div class="opts">${opts.map((o, j) => `<button class="opt" data-o="${j}">${esc(o.x)}</button>`).join('')}</div></div>`;
      pickThenCheck('[data-o]', b => { const j = +b.dataset.o; logAnswer(!!opts[j].ok); document.querySelectorAll('[data-o]').forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add('right'); else if (k === j) x.classList.add('wrong'); }); foot(`<button class="btn primary block" id="nx">Next: answer in Bisaya</button>`); $('#nx').onclick = () => respond(g.say, g.ex); }, 'Use the words you caught.');
    };
    words();
  } else {
    const c = it.c;
    $('#app').innerHTML = `${top}<div class="ex"><div class="label">${esc(c.show)}</div>
      <div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${c.yt}?start=${c.from}&end=${c.to}&rel=0&playsinline=1&modestbranding=1&cc_load_policy=0" title="${esc(c.show)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
      <p class="muted small" style="margin:0">Sound on, subtitles off. It stops by itself after ${c.to - c.from} seconds. Replay it as often as you like.</p><div id="step"></div></div><div class="foot" id="foot"></div>`;
    const opts = shuffle(c.a.map((x, j) => ({ x, ok: j === 0 })));
    $('#step').innerHTML = `<div class="panel"><div class="label">${esc(c.q)}</div><div class="opts">${opts.map((o, j) => `<button class="opt" data-o="${j}">${esc(o.x)}</button>`).join('')}</div><div id="key"></div></div>`;
    pickThenCheck('[data-o]', b => {
      const j = +b.dataset.o; logAnswer(!!opts[j].ok); document.querySelectorAll('[data-o]').forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add('right'); else if (k === j) x.classList.add('wrong'); });
      $('#key').innerHTML = `<div class="label" style="margin-top:8px">What they said (the show's subtitles)</div>${c.en.map(l => `<div class="small">${esc(l)}</div>`).join('')}`;
      foot(`<button class="btn primary block" id="nx">Next: answer in Bisaya</button>`); $('#nx').onclick = () => respond(c.say, c.ex);
    }, 'Pick an answer after you watch.');
  }
  $('#quit').onclick = () => { RB = null; goTab(); };
};

/* ---------- accuracy log, leaderboard, and Padayon Rush (endless listening game) ---------- */
// timed games: a tick for each of the last 3 seconds, higher as time runs out
function hurryTick(left, last) { const k = Math.ceil(left); if (k <= 3 && k >= 1 && k < last && typeof Sfx !== 'undefined') Sfx.tick(k === 1); return Math.min(last, k); }
let ANS_RUN = 0;   // right answers in a row (any screen); the right-answer chime rises with it
function logAnswer(ok) { ANS_RUN = ok ? ANS_RUN + 1 : 0; if (typeof Sfx !== 'undefined') ok ? Sfx.right(ANS_RUN) : Sfx.wrong(); const t = today(); S.acc = S.acc || {}; const a = S.acc[t] || (S.acc[t] = { r: 0, t: 0 }); a.t++; if (ok) a.r++; Object.keys(S.acc).forEach(k => { if (+k < t - 30) delete S.acc[k]; }); }
function acc7() { const t = today(); let r = 0, n = 0; Object.entries(S.acc || {}).forEach(([k, v]) => { if (+k > t - 7) { r += v.r; n += v.t; } }); return { r, n, pct: n ? Math.round(r / n * 100) : 0 }; }
const weekStart = () => { const t = today(), dow = (t + 4) % 7; return t - ((dow + 6) % 7); }; // Monday
const xpWeek = () => { const w = weekStart(); return Object.entries(S.xp).reduce((s, [k, v]) => s + (+k >= w ? v : 0), 0); };
const learnedCount = () => Object.keys(S.cards).filter(id => id[0] !== 'r' && id[0] !== 's' && S.cards[id].b >= 2 && card(id)).length;
// each signed-in person's public scoreboard row: board/{uid}. Nothing else of their progress is shared.
function boardRow() { const a = acc7(); return { name: displayName(), streakReset: STREAK_RESET, streak: streakNow(), best: S.streak.best || 0, sLast: S.streak.last || 0, sCount: S.streak.count || 0, fWk: S.freezeWk || 0, tzo: new Date().getTimezoneOffset(), accR: a.r, accN: a.n, learned: learnedCount(), xpWeek: xpWeek(), week: weekStart(), speed: S.bestSpeed || 1, rush: S.rushBest || 0, rushHow: S.rushHow || 'pick', newMax: S.newMax || 0, geoP: (S.geoBest || {}).prov || 0, geoL: (S.geoBest || {}).lang || 0, geoPHow: (S.geoHow || {}).prov || 'pick', geoLHow: (S.geoHow || {}).lang || 'pick', updated: Date.now() }; }
let boardTimer = null;
function pushBoard() {
  if (!Sync.user || !window.firebase) return; const uid = Sync.user.uid, t = calDay(); if (typeof redoCheck === 'function') redoCheck();
  if (ANNOUNCED_BY_HAND[uid] === t && S.announced !== t) { S.announced = t; S.reannounce = 0; }
  // a session finished before the app could record it: credit that day once, for good (it carries through sync)
  const cd = DONE_ON_RESET[uid];
  if (cd && !(S.credit && S.credit[cd])) { S.credit = Object.assign({}, S.credit || {}, { [cd]: 1 }); const st = S.streak;
    if ((st.last || 0) < cd) S.streak = { count: st.last === cd - 1 ? (st.count || 0) + 1 : 1, last: cd, best: Math.max(1, st.best || 0) };
    else if (st.last === cd + 1 && st.count === 1) { st.count = 2; st.best = Math.max(2, st.best || 0); }
    if (t === cd) S.announced = t; S.reannounce = 0; localSave(); schedulePush(); }
  if (NAME_BY_UID[uid] && S.settings.name !== NAME_BY_UID[uid]) S.settings.name = NAME_BY_UID[uid];
  // catch up a missed post. If another device finished the session it posts itself, so wait a bit before stepping in.
  if (planDay().session && S.announced !== t) { const wait = sessHere === t ? 0 : 90000 - (Date.now() - (S.sessAt || 0));
    if (wait <= 0) { S.reannounce = 0; announceLesson(); } else { clearTimeout(catchTimer); catchTimer = setTimeout(pushBoard, wait + 500); } }
  clearTimeout(boardTimer); boardTimer = setTimeout(() => { const row = boardRow(); firebase.firestore().collection('board').doc(uid).set(row).catch(() => { }); if (BOARD) { const i = BOARD.findIndex(r => r.uid === uid), mine = boardFix(Object.assign({ uid }, row)); if (i >= 0) BOARD[i] = mine; else BOARD.push(mine); } }, 3000); }
let catchTimer = null;
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { try { const was = streakNow(); capStreak(S); pushBoard(); if (view === 'home' && streakNow() !== was) render(); } catch (e) { } } });
// a row's streak as of right now: worked out from the day it was last extended, in that person's own time zone
function boardFix(r) {
  const cap = n => Math.min(n || 0, Math.max(0, calDay() - STREAK_BASE + 1));
  if ((r.streakReset || 0) < STREAK_RESET) return Object.assign(r, { streak: DONE_ON_RESET[r.uid] && calDay() - DONE_ON_RESET[r.uid] <= 1 ? 1 : 0, best: DONE_ON_RESET[r.uid] ? 1 : 0, accR: 0, accN: 0, newMax: 0, speed: 1, rush: 0, geoP: 0, geoL: 0 });
  if (r.sLast != null) {
    let last = r.sLast, count = r.sCount; const cd = DONE_ON_RESET[r.uid];
    if (cd && last < cd) { count = last === cd - 1 ? count + 1 : 1; last = cd; }
    const day = Math.floor((Date.now() - (r.tzo || 0) * 60000) / 864e5);
    const alive = last >= day - 1 || (last === day - 2 && count > 0 && (r.fWk || 0) !== wkOf(day - 1));
    r.streak = alive ? count : 0;
  } else {
    const cd = DONE_ON_RESET[r.uid]; if (cd && calDay() - cd <= 1 && (r.streak || 0) < 1) r.streak = 1;
    if (r.updated && Date.now() - r.updated > 2.5 * 864e5) r.streak = 0;
  }
  r.streak = cap(r.streak); r.best = Math.max(r.streak, cap(r.best)); return r;
}
let BOARD = null, boardAt = 0, boardTab = 'streak', boardErr = '';
async function loadBoard() {
  if (!Sync.user || !window.firebase || Date.now() - boardAt < 60000) return;
  boardAt = Date.now();
  try { const q = await firebase.firestore().collection('board').get(); BOARD = q.docs.map(d => boardFix(Object.assign({ uid: d.id }, d.data()))); boardErr = ''; }
  catch (e) { boardErr = 'The leaderboard needs a Firebase rule update first.'; }
  if (view === 'board') return render(); if (view === 'home') { const el = $('#board'); if (el) el.outerHTML = boardPanel(); wireBoard(); }
}
const BOARD_TABS = [
  ['streak', 'Streak', r => r.streak, r => r.streak + ' day' + (r.streak === 1 ? '' : 's') + (r.best > r.streak ? ` · best ${r.best}` : '')],
  ['best', 'Best streak', r => r.best, r => r.best + ' day' + (r.best === 1 ? '' : 's')],
  ['acc', 'Accuracy', r => r.accN >= 30 ? r.accR / r.accN : -1, r => r.accN >= 30 ? Math.round(r.accR / r.accN * 100) + '% · ' + r.accN + ' answers' : 'needs 30 answers in 7 days'],
  ['learned', 'Words', r => r.learned, r => r.learned + ' learned · all time'],
  ['newMax', 'Most in one day', r => r.newMax || 0, r => (r.newMax || 0) + ' new words'],
  ['speed', 'Speed', r => r.speed, r => (+r.speed).toFixed(1) + '×'],
  ['rush', 'Rush', r => r.rush, r => r.rush + ' in a row' + (r.rush ? ' · ' + HOW(r.rushHow) : '')],
  ['geoP', 'Province Rush', r => r.geoP || 0, r => (r.geoP || 0) + ' in a row' + (r.geoP ? ' · ' + HOW(r.geoPHow) : '')],
  ['geoL', 'Language Rush', r => r.geoL || 0, r => (r.geoL || 0) + ' in a row' + (r.geoL ? ' · ' + HOW(r.geoLHow) : '')]
];
function boardPanel() {
  const head = `<section class="panel" id="board"><div class="row spread"><h2>Leaderboard</h2><span class="muted small">This week · family</span></div>`;
  if (!Sync.user) return head + `<p class="muted small" style="margin:0">Sign in with Google on the Me tab to join the leaderboard.</p></section>`;
  if (boardErr) return head + `<p class="muted small" style="margin:0">${esc(boardErr)}</p></section>`;
  if (!BOARD) return head + `<p class="muted small" style="margin:0">Loading…</p></section>`;
  const tab = BOARD_TABS.find(t => t[0] === boardTab) || BOARD_TABS[0];
  const rows = BOARD.slice().sort((a, b) => tab[2](b) - tab[2](a));
  const me = Sync.user.uid;
  return head + `<div class="btabs">${BOARD_TABS.map(t => `<button class="btab ${t[0] === boardTab ? 'on' : ''}" data-btab="${t[0]}">${t[1]}</button>`).join('')}</div>
    <ol class="blist">${rows.map((r, i) => `<li class="${r.uid === me ? 'me' : ''}"><span class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</span><b>${esc(rowName(r))}</b><span class="muted small">${esc(tab[3](r))}</span></li>`).join('')}</ol></section>`;
}
// the Ranks tab: every ranking in its own box, one under the other
const BOARD_DESC = { streak: 'Days in a row with a finished daily session.', best: 'The longest streak ever.', acc: 'Every answer in the last 7 days, right and wrong: lessons, grammar, practice drills, Rush, Real Bisaya and stories.', learned: 'Words and phrases learned so far.', newMax: 'Most new words learned in a single day.', speed: 'Fastest listening speed reached.', rush: 'Longest Padayon Rush run.', geoP: 'Longest Province Rush run.', geoL: 'Longest Language Rush run.' };
const BOARD_ICON = { streak: '🔥', best: '🏅', acc: '🎯', learned: '📚', newMax: '🚀', speed: '⚡', rush: '🏆', geoP: '🗺️', geoL: '🗣️' };
function boardBoxes() {
  if (!Sync.user) return `<section class="panel"><p class="muted small" style="margin:0">Sign in with Google on the Me tab to join the leaderboard.</p></section>`;
  if (boardErr) return `<section class="panel"><p class="muted small" style="margin:0">${esc(boardErr)}</p></section>`;
  if (!BOARD) return `<section class="panel"><p class="muted small" style="margin:0">Loading…</p></section>`;
  const me = Sync.user.uid;
  return BOARD_TABS.map(tab => { const rows = BOARD.slice().sort((a, b) => tab[2](b) - tab[2](a));
    return `<section class="panel rankbox"><h2>${BOARD_ICON[tab[0]] || ''} ${esc(tab[1])}</h2><p class="muted small" style="margin:0">${BOARD_DESC[tab[0]] || ''}</p><ol class="blist">${rows.map((r, i) => `<li class="${r.uid === me ? 'me' : ''}"><span class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</span><b>${esc(rowName(r))}</b><span class="muted small">${esc(tab[3](r))}</span></li>`).join('')}</ol></section>`; }).join('');
}
function wireBoard() { document.querySelectorAll('[data-btab]').forEach(b => b.onclick = () => { boardTab = b.dataset.btab; const el = $('#board'); if (el) el.outerHTML = boardPanel(); wireBoard(); }); }

/* Rush games can be answered by multiple choice or by typing. Each best score remembers which one was used,
   and the leaderboard shows it as a note next to the score. */
const rushTyped = () => S.settings.rushInput === 'type';
const HOW = h => h === 'type' ? 'typed' : 'multiple choice';
// a new score beats the old one if it's higher; a tie made by typing replaces one made by multiple choice
function bestWith(old, oldHow, n, how) { if (n > old || (n === old && n > 0 && how === 'type' && oldHow !== 'type')) return { best: n, how, isBest: n > old }; return { best: old, how: oldHow || 'pick', isBest: false }; }
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fwords = s => fold(s).replace(/['’]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
const EN_STOP = new Set(['to', 'a', 'an', 'the', 'is', 'are', 'be', 'am', 'it', 'some', 'something', 'someone']);
const enAlts = en => String(en).replace(/\(\s*also:\s*([^)]*)\)/gi, ';$1;').replace(/\([^)]*\)/g, ' ').replace(/\balso:/gi, ';').split(/[;,\/]|\bor\b/).map(s => s.trim()).filter(Boolean);
let EN_VOCAB = null;
const enVocab = () => EN_VOCAB || (EN_VOCAB = new Set(Object.keys(IDX).map(card).filter(Boolean).flatMap(c => fwords(String(c.en).replace(/\([^)]*\)/g, ' ')))));
const wordNear = (a, b) => { if (a === b) return true;
  if (Math.min(a.length, b.length) >= 3 && a.replace(/(es|s)$/, '') === b.replace(/(es|s)$/, '') && a.replace(/(es|s)$/, '').length >= 3) return true;
  if (enVocab().has(a)) return false; // a different real word, not a typo
  return (a.length >= 4 && b.length > 4 && lev(a, b) <= 1) || (a.length > 6 && b.length > 6 && lev(a, b) <= 2); };
// typed English meaning: any one of the meanings counts, small typos and missing "to"/"the" are fine
function meaningOk(typed, en) {
  const t = fwords(typed); if (!t.length) return false;
  // a meaning that's only a note in brackets ("(plural: more than one)"): each part of the note counts
  const inner = String(en).replace(/\([^)]*\)/g, '').trim() ? [] : String(en).replace(/[()]/g, '').split(/[:;,]/).map(x => x.trim()).filter(Boolean);
  return [en, ...enAlts(en), ...inner].some(alt => {   // the whole meaning as shown ("rock or stone") counts too, not just each part
    const a = fwords(alt); if (!a.length) return false;
    const whole = a.join(' '); if (t.join(' ') === whole || (t.some(w => !enVocab().has(w)) && lev(t.join(' '), whole) <= Math.floor(whole.length * 0.15))) return true;
    const ac = a.filter(w => !EN_STOP.has(w)), tc = t.filter(w => !EN_STOP.has(w));
    const A = ac.length ? ac : a, T = ac.length ? tc : t; if (!T.length) return false;
    const hit = A.filter(w => T.some(x => wordNear(x, w))).length, extra = T.filter(x => !A.some(w => wordNear(x, w))).length;
    const neg = w => /^(not|no|never|dont|doesnt|didnt|isnt|arent|wasnt|cant|wont|nobody|nothing)$/.test(w);
    if (t.some(neg) !== a.some(neg)) return false;
    return hit === A.length && extra === 0;
  });
}
// typed place or language name: small typos are fine, but typing a different real name is wrong
const NAME_DROP = new Set(['del', 'de', 'la', 'province', 'islands', 'island', 'of', 'mt']);
const nameKey = s => fwords(s).filter(w => !NAME_DROP.has(w)).join(' ');
function nameOk(typed, alts, others) {
  const k = nameKey(typed); if (!k) return false;
  if ((others || []).some(o => nameKey(o) === k) && !alts.some(x => nameKey(x) === k)) return false;
  return alts.some(x => { const n = nameKey(x); return n === k || lev(n, k) <= (n.length <= 5 ? 0 : n.length <= 9 ? 1 : 2); });
}
const typeBox = (ph) => `<form class="typerow" id="tform" autocomplete="off"><input class="field" id="tans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="${esc(ph)}"><button class="btn primary" id="tgo" type="submit">Go</button></form>`;
function wireType(onAnswer) { const f = $('#tform'), i = $('#tans'); if (!f) return; f.onsubmit = e => { e.preventDefault(); if (i.value.trim()) onAnswer(i.value.trim()); }; setTimeout(() => i.focus({ preventScroll: true }), 30); }
const inputToggle = () => `<div class="row inrow"><span class="label" style="margin:0">Answer by</span><div class="seg" id="inseg"><button class="${rushTyped() ? '' : 'on'}" data-in="pick">Multiple choice</button><button class="${rushTyped() ? 'on' : ''}" data-in="type">Typing</button></div></div>`;
function wireToggle() { document.querySelectorAll('#inseg [data-in]').forEach(b => b.onclick = () => { S.settings.rushInput = b.dataset.in; save(); render(); }); }

/* Padayon Rush: every recorded word and phrase, not just learned ones. Hear it, pick the meaning, keep going until a miss.
   The time to answer shrinks as the run gets longer. */
let RU = null;
/* Rush goes from easiest to hardest: each word gets a difficulty from where it sits on the learning path
   (common, early words first) blended with how long it is to hear and parse. Question n draws from a small
   window that slides up the sorted list, reaching the hardest words around 80 in a row. */
function rushPool() {
  const ids = Object.keys(IDX).filter(id => card(id)); if (!ids.length) return ids;
  const pos = {}; PATH.flatMap(st => st.ids).forEach((id, i) => { if (!(id in pos)) pos[id] = i; });
  const byPath = ids.slice().sort((a, b) => (pos[a] ?? 1e9) - (pos[b] ?? 1e9)), pr = {}; byPath.forEach((id, i) => pr[id] = i / ids.length);
  const len = id => { const t = card(id).ceb; return t.length + t.split(/\s+/).length * 4; };
  const byLen = ids.slice().sort((a, b) => len(a) - len(b)), lr = {}; byLen.forEach((id, i) => lr[id] = i / ids.length);
  return ids.map(id => [0.6 * pr[id] + 0.4 * lr[id], id]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
}
function rushPick() {
  const L = RU.pool.length, at = Math.floor((L - 1) * Math.min(1, RU.n / 80));
  const lo = Math.max(0, at - 15), hi = Math.min(L, at + 25); let id;
  for (let k = 0; k < 30; k++) { id = RU.pool[lo + Math.floor(Math.random() * (hi - lo))]; if (!RU.seen.has(id)) break; }
  return id;
}
function rushOptions(c, pool) {
  const out = [c], used = new Set([norm(c.en)]);
  const near = shuffle(pool.slice()).slice(0, 60).map(card).filter(Boolean).map(d => [simScore(c, d) + (d.kind === c.kind ? 3 : 0) + Math.random() * 2, d]).sort((a, b) => b[0] - a[0]);
  for (const [, d] of near) { if (out.length >= 4) break; const v = norm(d.en); if (!v || used.has(v) || out.some(o => sameMeaning(o.en, d.en))) continue; used.add(v); out.push(d); }
  return shuffle(out);
}
function startRush() { ANS_RUN = 0; if (typeof Sfx !== 'undefined') Sfx.countdown(); if (typeof Music !== 'undefined') Music.resetLevel(); if (!hasPack()) { toast('Load the content pack first.'); return goTab(); } RU = { pool: rushPool(), n: 0, seen: new Set(), how: rushTyped() ? 'type' : 'pick' }; sess = newSess('rush'); view = 'rush'; rushQ(); }
async function rushQ() {
  if ((S.guideV || 0) < GUIDE_V) return go('guide');
  if (typeof Music !== 'undefined') { Music.level(RU.n); Music.set('rush'); }
  const id = rushPick(); RU.seen.add(id);
  const typed = RU.how === 'type', c = card(id), opts = typed ? [] : rushOptions(c, RU.pool), secs = typed ? Math.max(7, 15 - Math.floor(RU.n / 5) * 0.5) : Math.max(3, 8 - Math.floor(RU.n / 5) * 0.5);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="End">${I.x}</button><h2 style="flex:1">Padayon Rush</h2><span class="speedchip tnum">${RU.n}</span></div>
    <div class="ex"><div class="playrow"><button class="play playing" id="pl" aria-label="Play">${I.play}</button><span class="muted small" id="st">Listen…</span></div>
    <div class="timer"><i id="tb"></i></div>${typed ? '<div id="tslot"></div>' : `<div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}" disabled>${esc(optText(o, 'en'))}</button>`).join('')}</div>`}
    <p class="muted small" style="margin:0">${typed ? 'Typing: write the meaning in English. Any one meaning counts, small typos are fine.' : 'Every recorded word in the app, learned or not, easiest first and getting harder.'} One miss ends the run. Best: ${S.rushBest || 0}${S.rushBest ? ' (' + HOW(S.rushHow) + ')' : ''}.</p></div><div class="foot" id="foot" hidden></div>`;
  $('#quit').onclick = () => { clearInterval(timerH); stopAudio(); rushOver(null, c); };
  const myN = RU.n; await play(c.id, 1, $('#pl')); if (view !== 'rush' || RU.n !== myN) return;
  $('#pl').onclick = e => play(c.id, 1, e.currentTarget);
  $('#st').textContent = (typed ? 'Type the meaning (' : 'Pick the meaning (') + secs + 's)';
  const btns = [...document.querySelectorAll('.opt')]; btns.forEach(b => b.disabled = false);
  const t0 = Date.now(); let done = false;
  const finish = (sel, text) => {
    if (done) return; done = true; clearInterval(timerH);
    const ok = typed ? text != null && meaningOk(text, c.en) : sel != null && opts[sel].id === c.id; logAnswer(ok);
    btns.forEach((b, i) => { b.disabled = true; if (opts[i].id === c.id) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); }); if (!typed) showOptMeanings(btns, opts, 'en');
    if (typed) { const i = $('#tans'); if (i) { i.disabled = true; i.classList.add(ok ? 'right' : 'wrong'); } const g = $('#tgo'); if (g) g.disabled = true;
      if (ok) $('#tslot').insertAdjacentHTML('beforeend', `<div class="small muted" style="margin-top:6px">${esc(c.en)}</div>`); }
    const miss = typed ? text == null : sel == null;
    if (ok) { RU.n++; addXP(2); setTimeout(() => { if (view === 'rush') rushQ(); }, typed ? 700 : 450); } else { const run = RU; setTimeout(() => { if (view === 'rush' && RU === run) rushOver(miss ? 'time' : 'miss', c, miss || typed ? null : opts[sel], typed ? text : null); }, 700); }
  };
  btns.forEach((b, i) => b.onclick = () => finish(i));
  if (typed) { $('#tslot').innerHTML = typeBox('Type the meaning in English'); wireType(t => finish(null, t)); }
  let lastTick = 99; timerH = setInterval(() => { const f = 1 - (Date.now() - t0) / (secs * 1000); const tb = $('#tb'); if (tb) tb.style.width = Math.max(0, f * 100) + '%'; lastTick = hurryTick(f * secs, lastTick); if (f <= 0) finish(null, null); }, 100);
}
function rushOver(why, c, picked, typedText) {
  const n = RU ? RU.n : 0, best = S.rushBest || 0, how = RU ? RU.how : 'pick', r = bestWith(best, S.rushHow, n, how), isBest = r.isBest; S.rushBest = r.best; S.rushHow = r.how; save(); view = 'summary';
  $('#app').innerHTML = `<section class="panel summary"><div class="label">Padayon Rush</div><h1 style="font-size:2.4rem;color:var(--sea)">${n}</h1><p class="muted">${HOW(how)} · ${isBest ? 'New personal best!' : 'Best: ' + best + ' (' + HOW(S.rushHow) + ')'}</p>
    ${c && why ? `<div class="panel"><div class="small muted">${why === 'time' ? "Time ran out on" : 'The answer was'}</div><b>${esc(c.ceb)}</b> <span class="muted">· ${esc(c.en)}</span>${phonHtml(c.ceb)}${typedText ? `<div class="small" style="margin-top:6px">You typed <b>${esc(typedText)}</b>.</div>` : ''}${picked ? `<div class="small" style="margin-top:6px">${wrongWhy(c, picked, 'en')}</div>` : ''}</div>` : ''}
    ${binkoSays(isBest ? 'NEW RECORD! Binko is writing this one in the journal in BIG letters!' : n >= 10 ? 'Binko binks that was a great run!' : 'Loose bolt! Shake it off and go again.')}
    <button class="btn primary block" id="again">Go again</button><button class="btn ghost block" id="home2">Home</button></section>`;
  $('#again').onclick = startRush; $('#home2').onclick = () => goTab();
}
/* ---------- shadowing ---------- */
let SH = null;
VIEWS.shadow = function () {
  if (!hasPack()) { toast('Load the content pack first. Shadowing uses its recordings.'); return goTab(); }
  if (drillLock('shadow')) return lockedScreen('Shadowing', 'shadow');
  const mine = UNITS.map(u => Object.assign({}, u, { ids: u.ids.filter(id => S.cards[id] && card(id)) })).filter(u => u.ids.length);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Shadowing</h2></div>
  <section class="panel"><p style="margin:0">Each phrase plays three times: once to listen, then twice to speak along, the last at ${Math.max(1.1, S.speed).toFixed(1)}×. Hands-free, so it works with headphones on a walk.</p></section>
  <section class="panel"><p class="muted small" style="margin:0">Only phrases you've already learned.</p>${mine.map((u, i) => `<div class="unit"><div class="nm"><b>${esc(u.ceb)}</b> <span class="muted small">${esc(u.name)} · ${u.ids.length}</span></div><button class="btn sm primary" data-u="${i}">Start</button></div>`).join('')}</section>`;
  $('#quit').onclick = () => goTab();
  document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => runShadow(mine[+b.dataset.u]));
};
function runShadow(u) {
  view = 'shadowrun'; SH = { u, i: 0, paused: false, tok: 0, showEn: true };
  const rates = () => [1, 1, Math.max(1.1, S.speed)];
  const draw = () => {
    const c = card(u.ids[SH.i]);
    $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Stop">${I.x}</button><div class="prog"><i style="width:${SH.i / u.ids.length * 100}%"></i></div><span class="speedchip tnum">${SH.i + 1}/${u.ids.length}</span></div>
     <div class="ex"><div class="label">${esc(u.ceb)} · ${esc(u.name)}</div><div class="ceb">${esc(c.ceb)}</div><div class="muted" ${SH.showEn ? '' : 'hidden'}>${esc(c.en)}</div>
     <div class="stage"><span>Listen</span><span>Speak along</span><span>Faster</span></div>
     <div class="row"><button class="btn" id="pause">${SH.paused ? 'Resume' : 'Pause'}</button><button class="btn" id="skip">Next phrase</button><button class="btn ghost" id="hide">${SH.showEn ? 'Hide' : 'Show'} English</button></div></div>`;
    $('#quit').onclick = () => { SH.tok = 0; stopAudio(); goTab(); };
    $('#pause').onclick = () => { SH.paused = !SH.paused; if (SH.paused) { SH.tok = 0; stopAudio(); draw(); } else loop(); };
    $('#skip').onclick = () => { SH.tok = 0; stopAudio(); SH.i++; SH.paused = false; loop(); };
    $('#hide').onclick = () => { SH.showEn = !SH.showEn; draw(); };
  };
  const loop = async () => {
    const my = SH.tok = Date.now() + Math.random();
    while (SH.i < u.ids.length) {
      draw(); const id = u.ids[SH.i];
      for (let p = 0; p < 3; p++) {
        if (SH.tok !== my) return;
        document.querySelectorAll('.stage span').forEach((s, j) => s.className = j < p ? 'done' : j === p ? 'on' : '');
        await play(id, rates()[p]); if (SH.tok !== my) return; await sleep(600);
      }
      addXP(2); save(); SH.i++;
    }
    if (SH.tok === my) { tick('shadow'); view = 'done'; sectionDone('Shadowing done', esc(u.ceb) + ' · ' + u.ids.length + ' phrases spoken along.'); }
  };
  loop();
}

/* ---------- gap words ---------- */
function addGap(en, ceb, ex, exEn, quiet) {
  if (!en || !ceb) return false;
  if (S.custom.some(x => norm(x.en) === norm(en) || norm(x.ceb) === norm(ceb))) return false;
  S.custom.push({ id: 'c' + (S.nextC++), en, ceb, ex: ex || '', exEn: exEn || '', added: today() }); save();
  if (!quiet) toast('Added to Gap words'); return true;
}
VIEWS.gaps = function () {
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Gap words</h2></div>
  <section class="panel"><p style="margin:0">Every time you reach for an English word mid-sentence, it belongs here. Add them here and they become flashcards. They become flashcards you practice out loud.</p>
  <label class="label" for="gen">The word or phrase you said in English</label><input class="field" id="gen" placeholder="e.g. appointment, I'm running late">
  <label class="label" for="gceb">How to say it in Bisaya (ask family if you're not sure)</label><input class="field" id="gceb" placeholder="e.g. tigum">
  <div class="row"><button class="btn primary" id="gadd">Add</button><span class="muted small" id="gmsg"></span></div></section>
  <section class="panel"><div class="row spread"><h2>Your list</h2><span class="muted small tnum">${S.custom.length}</span></div>
  <div>${S.custom.length ? S.custom.slice().reverse().map(x => `<div class="gap"><div style="min-width:0"><span class="c">${esc(x.ceb)}</span> <span class="muted">· ${esc(x.en)}</span>${x.ex ? `<div class="small">${esc(x.ex)} <span class="muted">${esc(x.exEn)}</span></div>` : ''}</div><button class="btn sm ghost" data-del="${x.id}">Remove</button></div>`).join('') : '<p class="muted" style="margin:0">Nothing yet.</p>'}</div></section>`;
  $('#quit').onclick = () => goTab();
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (b.dataset.armed) { S.custom = S.custom.filter(x => x.id !== b.dataset.del); delete S.cards[b.dataset.del]; save(); render(); } else { b.dataset.armed = 1; b.textContent = 'Tap to confirm'; } });
  $('#gadd').onclick = async () => {
    const en = $('#gen').value.trim(), ceb = $('#gceb').value.trim(); if (!en) return;
    if (ceb) { addGap(en, ceb) ? render() : ($('#gmsg').textContent = 'Already on your list.'); return; }
    $('#gmsg').textContent = 'Add the Bisaya too.';
  };
};

/* ---------- boot ---------- */
document.addEventListener('keydown', e => {
  if (e.defaultPrevented) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (view !== 'session' && view !== 'speedrun') return;
  if (/^[1-4]$/.test(e.key)) { const b = document.querySelectorAll('.opt')[+e.key - 1]; if (b && !b.disabled) b.click(); }
  if (e.key === 'Enter') { const b = $('#chk:not([disabled])') || $('#cont'); if (b && document.activeElement !== b) { e.preventDefault(); b.click(); } }
  if (e.key === ' ' && $('#pl') && !$('#pl').disabled) { e.preventDefault(); $('#pl').click(); }
});
initSync();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
if ((S.guideV || 0) < GUIDE_V) { guideAt = 0; guideBack = 'home'; view = 'guide'; }
render();
// pack 2: the native recordings cleaned up (background hiss lowered, empty time at the start and end cut).
// Someone with the older pack gets the new one quietly in the background; the old one keeps working until then.
const PACK_V = 2;
async function refreshPack() { try { const r = await fetch('pack.bin?v=' + PACK_V, { cache: 'no-store' }); if (!r.ok) return; const buf = await r.arrayBuffer(); const x = parsePack(buf); if ((x.h.v || 1) < PACK_V) return; await idbSet('pack', buf); setPack(x.h, x.p, x.w); } catch (e) { } }
loadStoredPack().then(ok => { if (ok) { if (view === 'home') render(); if (PACK_HV < PACK_V) refreshPack(); } else autoPack(); }); loadVoice();

/* Picking the day's new words is the slowest thing the Today page does, and it asks more than once per draw.
   Remember the answer until anything about progress changes (every save bumps S.updated) or the day turns over. */
{ const _pickNew = pickNew; let memo = null;
  pickNew = function () { const k = S.updated + '|' + today() + '|' + PATH.length + '|' + Object.keys(IDX || {}).length + '|' + Object.keys(S.cards).length + '|' + (S.settings.newPerDay || 8) + '|' + (S.focus ? JSON.stringify(S.focus) : '');
    if (!memo || memo.k !== k) memo = { k, v: _pickNew.apply(this, arguments) }; return memo.v.slice(); }; }

/* The same idea for two more things the Today and Practice pages ask for many times per draw: the list of today's
   plan items, and the set of words you know. Both are remembered until progress changes. */
const progressKey = () => S.updated + '|' + today() + '|' + PATH.length + '|' + Object.keys(IDX || {}).length + '|' + Object.keys(S.cards).length;
{ const _planItems = planItems; let memo = null;
  planItems = function () { const k = progressKey() + '|' + JSON.stringify(planDay()); if (!memo || memo.k !== k) memo = { k, v: _planItems() }; return memo.v.slice(); }; }
{ const _knownWords = knownWords; let memo = null;
  knownWords = function () { const k = progressKey(); if (!memo || memo.k !== k) memo = { k, v: _knownWords() }; return new Set(memo.v); }; }

/* After any answer is graded, the saved place moves to the next question, so leaving from the answer screen
   (or closing the app there) never shows or grades the same question twice. */
{ const _result = result; result = function () { const r = _result.apply(this, arguments); try { if (sess && sess.mode === 'daily') saveResume(qi + 1); } catch (e) { } return r; }; }
