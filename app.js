'use strict';
/* Padayon: daily Bisaya practice with a Gemini-powered speaking tutor.
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
const SPR = { p: null, w: null };
function setPack(h, pbuf, wbuf) {
  P = h.P; W = h.W; UNITS = h.UNITS; IDX = h.IDX; SPR.p = pbuf; SPR.w = wbuf;
  PHRASE_ORDER = UNITS.flatMap(u => u.ids);
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
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => el.hidden = true, 3000); }
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
const norm = s => s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[’‘`]/g, "'").replace(/[.,!?¿¡"“”…]/g, ' ').replace(/\bug\b/g, 'og').replace(/\s+/g, ' ').trim();
const alts = ceb => ceb.split(/\s*\/\s*/).map(norm).filter(Boolean);
const firstAlt = ceb => ceb.split(/\s*\/\s*/)[0].replace(/\s*\([^)]*\)/g, '').trim();
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
    const total = +r.headers.get('content-length') || 10114753; const reader = r.body.getReader(); const parts = []; let got = 0;
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
function fresh() { return { v: 1, updated: 0, cards: {}, xp: {}, streak: { last: 0, count: 0, best: 0 }, speed: 1.0, bestSpeed: 1.0, settings: { newP: 4, newW: 4, newG: 2, newF: 3, learner: 'all', goal: 60, voice: 'Kore', model: 'gemini-3.8-flash', tts: 'gemini-3.8-flash-tts', ttsOn: true }, focus: null, custom: [], plan: {}, newDay: { d: 0, n: 0 }, nextC: 1, mistakes: {}, tips: {} }; }
function migrate(s) { const f = fresh(); s = Object.assign(f, s || {}); s.settings = Object.assign(fresh().settings, s.settings || {}); s.streak = Object.assign(fresh().streak, s.streak || {}); s.mistakes = s.mistakes || {}; s.tips = s.tips || {}; if (s.settings.learner !== 'all') { s.settings.learner = 'all'; s.settings.newF = Math.max(3, s.settings.newF || 0); } return s; }
let S = (() => { try { const r = JSON.parse(localStorage.getItem(LS)); if (r && r.v === 1) return migrate(r); } catch (e) { } return fresh(); })();
function localSave() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { } }
function save() { S.updated = Date.now(); localSave(); schedulePush(); }

/* ---------- sync across devices (Firebase: Google sign-in + one Firestore doc per person) ---------- */
const FB_CFG = { apiKey: 'AIzaSyAMedDtDrSRJbULhA5Kwz30ZyYwPKj0rc4', authDomain: 'padayon-sync.firebaseapp.com', projectId: 'padayon-sync', storageBucket: 'padayon-sync.firebasestorage.app', messagingSenderId: '1192476989', appId: '1:1192476989:web:257d2aaafd933e6ab38554' };
const Sync = { user: null, state: 'off', last: 0, timer: null, unsub: null, err: '' };
const userDoc = () => firebase.firestore().collection('users').doc(Sync.user.uid);
function mergeState(a, b) {
  a = migrate(JSON.parse(JSON.stringify(a))); b = migrate(JSON.parse(JSON.stringify(b)));
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
  const sa = a.streak, sb = b.streak; out.streak = (sb.last > sa.last || (sb.last === sa.last && sb.count > sa.count)) ? { ...sb } : { ...sa }; out.streak.best = Math.max(sa.best, sb.best);
  out.bestSpeed = Math.max(a.bestSpeed, b.bestSpeed);
  out.plan = {}; [a.plan, b.plan].forEach(p => Object.keys(p).forEach(d => { out.plan[d] = Object.assign(out.plan[d] || {}, p[d]); Object.keys(p[d]).forEach(k => { if (p[d][k]) out.plan[d][k] = p[d][k]; }); }));
  const t = today(); Object.keys(out.plan).forEach(d => { if (+d !== t) delete out.plan[d]; });
  out.newDay = a.newDay.d === b.newDay.d ? { d: a.newDay.d, n: Math.max(a.newDay.n, b.newDay.n) } : (a.newDay.d > b.newDay.d ? a.newDay : b.newDay);
  out.mistakes = {}; new Set(Object.keys(a.mistakes).concat(Object.keys(b.mistakes))).forEach(k => { const x = a.mistakes[k], y = b.mistakes[k]; out.mistakes[k] = !x ? y : !y ? x : { n: Math.max(x.n, y.n), fix: (newer === b ? y.fix : x.fix) || x.fix || y.fix, last: Math.max(x.last || 0, y.last || 0) }; });
  out.tips = Object.assign({}, a.tips, b.tips);
  out.announced = Math.max(a.announced || 0, b.announced || 0);
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  return out;
}
function schedulePush() { if (!Sync.user) return; clearTimeout(Sync.timer); Sync.timer = setTimeout(pushNow, 2000); }
async function pushNow() {
  if (!Sync.user) return;
  try { await userDoc().set({ s: JSON.stringify(S), updated: S.updated || Date.now() }); Sync.state = 'on'; Sync.last = Date.now(); Sync.err = ''; }
  catch (e) { Sync.state = 'error'; Sync.err = e.message || String(e); }
  refreshSyncUI();
}
function applyRemote(json) {
  let remote; try { remote = JSON.parse(json); } catch (e) { return; }
  const merged = mergeState(S, remote), changed = JSON.stringify(merged) !== JSON.stringify(S);
  if (changed) { S = merged; localSave(); if (view === 'home' || view === 'settings') render(); }
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
async function signOutSync() { clearTimeout(Sync.timer); if (Sync.user) await pushNow(); await firebase.auth().signOut(); toast('Signed out. Progress stays on this device.'); }
function syncLine() {
  if (!window.firebase) return 'Sync is unavailable right now (offline?).';
  if (!Sync.user) return 'Not signed in. Progress is saved on this device only.';
  const who = esc(Sync.user.email || Sync.user.displayName || 'your Google account');
  if (Sync.state === 'syncing') return `Signed in as ${who}. Syncing…`;
  if (Sync.state === 'error') return `Signed in as ${who}. Last sync failed: ${esc(Sync.err)}`;
  return `Signed in as ${who}. Progress syncs automatically.`;
}
function refreshSyncUI() { document.querySelectorAll('.syncline').forEach(el => el.innerHTML = syncLine()); document.querySelectorAll('.syncbtn').forEach(el => { el.textContent = Sync.user ? 'Sign out' : 'Sign in with Google'; }); const b = $('#syncbanner'); if (b) b.hidden = !!Sync.user || !window.firebase; }
const KEYK = 'padayon-gemini-key';
const getKey = () => { try { return localStorage.getItem(KEYK) || ''; } catch (e) { return ''; } };
const hasAI = () => !!getKey();
function addXP(n) { const t = today(); S.xp[t] = (S.xp[t] || 0) + n; }
function bumpStreak() { const t = today(); const s = S.streak; if (s.last === t) return; s.count = s.last === t - 1 ? s.count + 1 : 1; s.last = t; s.best = Math.max(s.best, s.count); }
function streakNow() { const s = S.streak, t = today(); return (s.last === t || s.last === t - 1) ? s.count : 0; }
function planDay() { const t = today(); if (!S.plan[t]) S.plan = { [t]: {} }; return S.plan[t]; }
/* Today's plan is every activity, in order. The hero ring fills as they tick, and finishing one offers the next. */
function planItems() {
  const ai = hasAI();
  return [
    { k: 'session', name: 'Daily session', d: 'Reviews, new words, and building blocks.', run: () => startSession() },
    { k: 'convo', name: 'One conversation', d: 'Read it, then play your part out loud.', run: () => go('convos') },
    { k: 'speed', name: 'Speed round', d: 'Fast listening that speeds up as you get it right.', run: () => go('speed') },
    { k: 'dict', name: 'Dictation', d: 'Type what you hear, every little word.', run: () => startDictation() },
    { k: 'shadow', name: 'Shadowing', d: 'Speak along with one unit. Hands-free.', run: () => go('shadow') },
    ai ? { k: 'pron', name: 'Pronunciation', d: 'Repeat 10 phrases and get scored.', run: () => { PR = null; go('pron'); } } : null,
    ai ? { k: 'talk', name: 'Talk with the Tutor', d: '5 turns out loud.', run: () => go('tutor') } : { k: 'talk', name: 'Talk out loud', d: 'A call with family in Bisaya. Tick it when done.', manual: true },
    { k: 'input', name: '10 minutes of real Bisaya', d: "A vlog, radio, or teleserye. Follow the gist. Tick it when done.", manual: true }
  ].filter(Boolean);
}
const planNext = () => { const p = planDay(); return planItems().find(i => !p[i.k]) || null; };
function tick(k) { const p = planDay(); if (!p[k]) { p[k] = true; if (k === 'session') { bumpStreak(); announceLesson(); } save(); } }
/* ---------- Discord: Binko posts in #🔥streaks when someone finishes the daily lesson ----------
   The webhook link lives in Firestore (config/discord, field "webhook"), readable only by signed-in users,
   so it never sits in this public code. */
const displayName = () => (S.settings.name || (Sync.user && Sync.user.displayName) || '').trim().split(/\s+/)[0] || 'Someone';
let hookCache = null;
async function discordHook() {
  if (hookCache !== null) return hookCache;
  if (!Sync.user || !window.firebase) return '';
  try { const d = await firebase.firestore().collection('config').doc('discord').get(); hookCache = (d.exists && d.data().webhook) || ''; } catch (e) { hookCache = ''; }
  return hookCache;
}
async function announceLesson() {
  const t = today(); if (S.announced === t) return;
  const url = await discordHook(); if (!url) return;
  S.announced = t; save();
  const n = streakNow(), who = displayName();
  const lines = ['BINKO REPORTING!', 'Log entry from Binko!', 'Binko binks this is worth announcing!', 'Ding ding ding! Binko has news!'];
  const fd = new FormData();
  fd.append('payload_json', JSON.stringify({
    username: 'Binko-SR157', avatar_url: new URL('icon-512.png', location.href).href,
    embeds: [{ color: 0x34b8a3, description: `${lines[Math.floor(Math.random() * lines.length)]} **${who}** finished today's Bisaya lesson!\n🔥 Streak: **${n} day${n === 1 ? '' : 's'}**${n >= 7 && n % 7 === 0 ? ' · a whole week! SUPER DUPER!' : ''}` }]
  }));
  try { await fetch(url, { method: 'POST', body: fd, mode: 'no-cors' }); } catch (e) { }
}
function nextBtnHtml(id = 'nextup') {
  const n = planNext();
  return n ? (n.manual ? `<div class="small muted">Next on today's plan: <b>${esc(n.name)}</b>. ${esc(n.d)}</div><button class="btn primary block" id="${id}">Back to today's plan</button>`
    : `<button class="btn primary block" id="${id}">Next: ${esc(n.name)}</button>`)
    : `<div class="small"><b>Everything on today's plan is done.</b> Padayon!</div><button class="btn primary block" id="${id}">Back home</button>`;
}
function wireNext(id = 'nextup') { const b = $('#' + id); if (!b) return; b.onclick = () => { const n = planNext(); if (n && !n.manual) n.run(); else go('home'); }; }
function sectionDone(label, line) {
  stopAudio();
  $('#app').innerHTML = `<section class="panel summary"><div class="label">${esc(label)}</div><h1 style="font-size:2rem;color:var(--sea)">Maayo kaayo!</h1>${line ? `<p class="muted">${line}</p>` : ''}
    ${cameoHtml('done')}${binkoSays(planNext() ? BINKO_NEXT[planNext().k] : BINKO_NEXT.done)}
    ${nextBtnHtml()}<button class="btn ghost block" id="home2">Home</button></section>`;
  wireNext(); $('#home2').onclick = () => go('home');
}

/* ---------- cards & SRS ---------- */
function card(id) {
  const k = id[0], n = +id.slice(1);
  if (k === 'p') return P[n] && { id, kind: 'p', ceb: P[n][0], en: P[n][1], note: NOTES[id], trick: TRICKS[id], audio: true };
  if (k === 'w') return W[n] && { id, kind: 'w', ceb: W[n][0], en: W[n][1], note: NOTES[id], trick: TRICKS[id], audio: true };
  if (k === 'g') return G[n] && { id, kind: 'g', ceb: G[n][0], en: G[n][1], note: G[n][2], audio: false };
  if (k === 'f') return F[n] && { id, kind: 'f', ceb: F[n].ceb, en: F[n].en, note: F[n].note, trick: F[n].trick, combos: F[n].combos, audio: false };
  const c = (S.custom || []).find(x => x.id === id);
  return c && { id, kind: 'c', ceb: c.ceb, en: c.en, ex: c.ex, exEn: c.exEn, audio: false };
}
const IV = [0, 1, 2, 4, 7, 14, 30, 60];
function grade(id, q) {
  const t = today(); const c = S.cards[id] || (S.cards[id] = { b: 0, d: t, r: 0, w: 0 });
  if (q === 2) { c.b = Math.min(c.b + 1, 7); c.r++; } else if (q === 1) { c.r++; } else { c.b = Math.max(0, c.b - 2); c.w++; }
  c.d = t + (q === 0 ? 1 : Math.max(1, IV[c.b]));
}
const learned = ids => ids.filter(id => S.cards[id] && S.cards[id].b >= 2).length;
const seen = ids => ids.filter(id => S.cards[id]).length;
function dueIds() { const t = today(); return Object.keys(S.cards).filter(id => S.cards[id].d <= t && card(id)).sort((a, b) => S.cards[a].d - S.cards[b].d); }
function newAllowance() { const t = today(); if (S.newDay.d !== t) S.newDay = { d: t, n: 0 }; return Math.max(0, S.settings.newP + S.settings.newW + S.settings.newG + (S.settings.newF || 0) - S.newDay.n); }
function pickNew() {
  let left = newAllowance(); const out = [];
  const take = (order, max) => { let n = Math.min(max, left); for (const id of order) { if (n <= 0) break; if (!S.cards[id] && !out.includes(id) && card(id)) { out.push(id); n--; left--; } } };
  const focused = (pre, units, order) => (S.focus && S.focus[0] === pre && units[+S.focus.slice(1)]) ? units[+S.focus.slice(1)].ids.concat(order) : order;
  take(S.custom.map(c => c.id), 3);
  take(focused('f', F_UNITS, F_ORDER), S.settings.newF || 0);
  take(focused('g', GRAM_UNITS, GRAM_ORDER), S.settings.newG);
  take(focused('u', UNITS, PHRASE_ORDER), S.settings.newP);
  take(focused('k', WORD_UNITS, W.map((_, i) => 'w' + i)), S.settings.newW);
  return out;
}
function exType(id, isNew) {
  const c = card(id), b = isNew ? 0 : (S.cards[id] ? S.cards[id].b : 0);
  const n = tokens(c.ceb).length, multi = n >= 2 && n <= 9, ai = hasAI();
  if (c.kind === 'f') return isNew || b < 1 ? 'build' : b < 2 ? pick(['build', 'mc']) : pick(ai ? ['say', 'build', 'type'] : ['build', 'type', 'speak']);
  if (!c.audio) return isNew || b < 1 ? 'mc' : b < 2 ? pick(['mc', 'type']) : pick(ai ? ['say', 'say', 'type'] : ['speak', 'type']);
  if (isNew || b <= 0) return pick(['listen', 'mc']);
  if (b === 1) return pick(multi ? ['listen', 'tiles', 'mc', 'dict'].concat(ai ? ['pron'] : []) : ['listen', 'mc', 'type']);
  if (b === 2) return pick(multi ? ['tiles', 'dict', 'listen'].concat(ai ? ['say', 'pron'] : ['speak']) : ['type', 'listen', 'dict', ai ? 'say' : 'speak']);
  return pick(multi ? ['dict', 'tiles', 'type', 'listen'].concat(ai ? ['say', 'say', 'pron'] : ['speak', 'speak']) : ['type', 'dict', 'listen', ai ? 'say' : 'speak']);
}
function buildSession() {
  const q = dueIds().slice(0, 16).map(id => ({ id, type: exType(id) }));
  shuffle(q);
  const nw = pickNew();
  for (const id of nw) {
    const pos = Math.floor(Math.random() * (Math.min(q.length, 8) + 1));
    q.splice(pos, 0, { id, type: 'teach' });
    q.splice(Math.min(q.length, pos + 2 + Math.floor(Math.random() * 3)), 0, { id, type: exType(id, true) });
  }
  const sh = [...new Set(shuffle(Object.keys(S.cards).filter(id => id[0] === 'p' && card(id)).concat(nw.filter(id => id[0] === 'p'))))].slice(0, 2);
  sh.forEach((id, i) => q.splice(Math.floor(q.length * (0.45 + i * 0.4)), 0, { id, type: 'shadow' }));
  if (q.filter(x => x.type !== 'shadow').length < 4) shuffle(Object.keys(S.cards).filter(card)).slice(0, 10).forEach(id => q.push({ id, type: exType(id) }));
  if (!q.length) GRAM_ORDER.slice(0, 4).forEach(id => q.push({ id, type: 'teach' }, { id, type: 'mc' }));
  // keep AI-graded items to about five per session so it stays quick
  let ai = 0; q.forEach(x => { if (x.type === 'say' || x.type === 'pron') { ai++; if (ai > 5) x.type = card(x.id).audio ? 'listen' : 'type'; } });
  return q;
}

/* ---------- audio playback ---------- */
const urls = {}; const player = new Audio(); player.preservesPitch = true;
let playToken = 0;
function clipUrl(id) {
  if (urls[id]) return urls[id];
  const buf = SPR[id[0]]; const ix = IDX[id]; if (!buf || !ix) return null;
  return (urls[id] = URL.createObjectURL(new Blob([buf.slice(ix[0], ix[0] + ix[1])], { type: 'audio/mpeg' })));
}
async function playUrl(u, rate, btn) {
  if (!u) return;
  const tok = ++playToken;
  document.querySelectorAll('.playing').forEach(b => b.classList.remove('playing'));
  player.pause(); player.src = u; player.playbackRate = rate || 1; player.preservesPitch = true;
  if (btn) btn.classList.add('playing');
  await new Promise(res => { player.onended = res; player.onerror = res; player.onpause = res; player.play().then(() => { player.playbackRate = rate || 1; }).catch(res); });
  if (btn && tok === playToken) btn.classList.remove('playing');
}
const play = (id, rate, btn) => playUrl(clipUrl(id), rate, btn);
function stopAudio() { playToken++; player.pause(); }

/* ---------- microphone recorder (16 kHz mono WAV) ---------- */
const Rec = {
  on: false,
  async start(onLevel) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)(); await this.ctx.resume();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1); this.chunks = []; this.rate = this.ctx.sampleRate;
    this.node.onaudioprocess = e => { const d = e.inputBuffer.getChannelData(0); this.chunks.push(new Float32Array(d)); if (onLevel) { let s = 0; for (let i = 0; i < d.length; i += 8) s += d[i] * d[i]; onLevel(Math.min(1, Math.sqrt(s / (d.length / 8)) * 6)); } };
    src.connect(this.node); this.node.connect(this.ctx.destination); this.on = true; this.t0 = Date.now();
  },
  async stop() {
    if (!this.on) return null; this.on = false;
    try { this.node.disconnect(); } catch (e) { }
    this.stream.getTracks().forEach(t => t.stop()); await this.ctx.close();
    let len = 0; this.chunks.forEach(c => len += c.length);
    const all = new Float32Array(len); let o = 0; this.chunks.forEach(c => { all.set(c, o); o += c.length; });
    const ratio = this.rate / 16000, outLen = Math.floor(all.length / ratio), out = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) { const a = Math.floor(i * ratio), b2 = Math.min(all.length, Math.floor((i + 1) * ratio)); let s = 0; for (let j = a; j < b2; j++) s += all[j]; const v = s / Math.max(1, b2 - a); out[i] = Math.max(-1, Math.min(1, v)) * 0x7fff; }
    const buf = new ArrayBuffer(44 + out.length * 2), dv = new DataView(buf);
    const ws = (p, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(p + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); dv.setUint32(4, 36 + out.length * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, out.length * 2, true);
    new Int16Array(buf, 44).set(out);
    return { buf, url: URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })), dur: out.length / 16000 };
  },
  cancel() { if (this.on) { this.on = false; try { this.node.disconnect(); this.stream.getTracks().forEach(t => t.stop()); this.ctx.close(); } catch (e) { } } }
};
/* A mic button: tap to start, tap to stop (auto-stops at maxSec). Calls done(rec). */
function micWidget(el, done, maxSec = 25) {
  el.innerHTML = `<div class="microw"><button class="mic" id="micb" aria-label="Start recording">${I.mic}</button><div style="flex:1;min-width:0"><div class="lvl"><i id="lvl"></i></div><div class="small muted" id="micst" style="margin-top:6px">Tap the mic, speak, tap again to stop. Space bar works too.</div></div></div>`;
  const btn = $('#micb'); let timer = null, busy = false;
  const stop = async () => {
    clearTimeout(timer); btn.classList.remove('rec'); btn.innerHTML = I.mic; btn.classList.add('busy'); busy = true;
    const r = await Rec.stop(); $('#lvl').style.width = '0';
    if (!r || r.dur < 0.4) { $('#micst').textContent = 'That was too short. Try again.'; btn.classList.remove('busy'); busy = false; return; }
    $('#micst').textContent = 'Listening to you…';
    await done(r);
    if (btn.isConnected) { btn.classList.remove('busy'); busy = false; const st = $('#micst'); if (st && st.textContent === 'Listening to you…') st.textContent = 'Tap the mic to try again.'; }
  };
  btn.onclick = async () => {
    if (busy) return;
    if (Rec.on) return stop();
    stopAudio();
    try {
      await Rec.start(l => { const lv = $('#lvl'); if (lv) lv.style.width = (l * 100) + '%'; });
      btn.classList.add('rec'); btn.innerHTML = I.stop; btn.setAttribute('aria-label', 'Stop recording'); $('#micst').textContent = 'Recording… tap to stop';
      timer = setTimeout(stop, maxSec * 1000);
    } catch (e) { $('#micst').textContent = 'Microphone blocked. Allow mic access for this site in your browser settings, then try again.'; }
  };
  micWidget.current = btn;
}

/* ---------- Gemini ---------- */
const GEM = 'https://generativelanguage.googleapis.com/v1beta/';
async function gemJSON(parts, system) {
  const key = getKey(); if (!key) throw { code: 'nokey' };
  const body = { contents: [{ role: 'user', parts }], generationConfig: { response_mime_type: 'application/json', temperature: 0.4 } };
  if (system) body.system_instruction = { parts: [{ text: system }] };
  const r = await fetch(GEM + 'models/' + encodeURIComponent(S.settings.model) + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: r.status, message: (j.error && j.error.message) || ('HTTP ' + r.status) };
  const txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('');
  try { return JSON.parse(txt.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch (e) { throw { code: 'badjson', message: 'The tutor gave an unreadable answer. Try again.' }; }
}
function gemErr(e) {
  if (e && e.code === 'nokey') return 'Add your Gemini API key in Settings first.';
  if (e && (e.code === 429)) return 'Gemini rate limit hit. Wait a minute and try again.';
  if (e && (e.code === 400 || e.code === 403)) return 'Gemini refused the request: ' + (e.message || '') + ' Check your key and model in Settings.';
  if (e && e.code === 404) return 'Model not found. Check the model name in Settings.';
  return (e && e.message) || 'Could not reach Gemini. Check your connection.';
}
const ttsCache = {};
async function tts(text) {
  if (!S.settings.ttsOn || !hasAI() || !text) return null;
  if (ttsCache[text]) return ttsCache[text];
  const key = getKey();
  const style = 'Native Cebuano (Bisaya) speaker from Cebu, warm and conversational, relaxed natural pace';
  try {
    const r = await fetch(GEM + 'interactions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ model: S.settings.tts, input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style }] }] }], response_format: { type: 'audio' }, generation_config: { speech_config: [{ voice: S.settings.voice }] } }) });
    if (r.ok) {
      const j = await r.json(); let data = null, mime = 'audio/wav';
      (j.steps || []).forEach(s => (s.content || []).forEach(c => { if (c.type === 'audio' && c.data) { data = c.data; mime = c.mime_type || mime; } }));
      if (!data && j.output_audio) data = j.output_audio.data;
      if (data) return (ttsCache[text] = URL.createObjectURL(new Blob([unb64(data)], { type: mime.includes('l16') ? 'audio/wav' : mime })));
    }
  } catch (e) { }
  try { // fallback: generateContent speech output (raw 24 kHz PCM)
    const r = await fetch(GEM + 'models/' + encodeURIComponent(S.settings.tts) + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: S.settings.voice } } } } }) });
    if (!r.ok) return null;
    const j = await r.json(); const part = ((((j.candidates || [])[0] || {}).content || {}).parts || []).find(p => p.inlineData || p.inline_data);
    if (!part) return null; const id = part.inlineData || part.inline_data; const pcm = unb64(id.data);
    if ((id.mimeType || id.mime_type || '').includes('wav')) return (ttsCache[text] = URL.createObjectURL(new Blob([pcm], { type: 'audio/wav' })));
    const h = new ArrayBuffer(44), dv = new DataView(h); const ws = (p, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(p + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 24000, true); dv.setUint32(28, 48000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, pcm.length, true);
    return (ttsCache[text] = URL.createObjectURL(new Blob([h, pcm], { type: 'audio/wav' })));
  } catch (e) { return null; }
}
const isNewLearner = () => true;
const learnerText = () => 'The learner is an English-speaking adult learning Cebuano (Bisaya) to talk with family. They may be a heritage speaker who understands some Bisaya but loses track of fast speech and falls back on English, or a beginner. Keep explanations simple, tie Bisaya to English where you can, and be encouraging but honest.';
function weakList(n = 6) { return Object.entries(S.mistakes).sort((a, b) => b[1].n - a[1].n).slice(0, n); }
function mistakeRules() {
  const labels = Object.keys(S.mistakes);
  return `"mistakes": a list of the learner's real errors in this answer as {"label": short reusable name for the error type, "fix": one-line fix with a Bisaya example}. [] if none.${labels.length ? ' If an error matches one of these existing labels, reuse that exact label: ' + JSON.stringify(labels.slice(0, 30)) + '.' : ''}`;
}
function absorb(r) {
  (r.english_words || []).forEach(x => x && x.en && x.ceb && addGap(x.en, x.ceb, '', '', true));
  (r.mistakes || []).forEach(m => { if (!m || !m.label) return; const k = String(m.label).slice(0, 80); const e = S.mistakes[k] || (S.mistakes[k] = { n: 0, fix: '' }); e.n++; e.fix = m.fix || e.fix; e.last = today(); });
  save();
}
const nativePart = id => { const ix = IDX[id], buf = SPR[id && id[0]]; return ix && buf ? { inline_data: { mime_type: 'audio/mp3', data: b64(buf.slice(ix[0], ix[0] + ix[1])) } } : null; };
const recPart = rec => ({ inline_data: { mime_type: 'audio/wav', data: b64(rec.buf) } });

async function gradeSay(c, rec) {
  const parts = [{ text: `${learnerText()}\nThe learner was asked to SAY this in Bisaya: "${c.en}". One correct answer is "${c.ceb}"; other natural wordings are equally correct.\nTheir recording follows.` }, recPart(rec)];
  const np = c.audio ? nativePart(c.id) : null;
  if (np) parts.push({ text: 'Native speaker recording of the reference answer, for comparing pronunciation:' }, np);
  parts.push({ text: `Return JSON only:
{"heard": "exactly what the learner said, word for word, including any English",
 "verdict": "correct" | "close" | "wrong",
 "score": 0-100 for meaning and grammar,
 "pronunciation": 0-100,
 "pron_notes": ["up to 3 short notes on specific sounds, stress or rhythm, e.g. which syllable to stress or a glottal stop they dropped"],
 "corrected": "the most natural way a Cebuano in Cebu would say it",
 "english_words": [{"en": "English word they used", "ceb": "Bisaya equivalent"}],
 ${mistakeRules()},
 "feedback": "1-2 short plain-English sentences: what worked, then the single most useful fix"}
"correct" = all Bisaya (loanwords Cebuanos really use are fine), meaning right, no real grammar slip. "close" = meaning right but one English word, a wrong affix or tense, or a missing particle. "wrong" = meaning off, mostly English, silent, or unintelligible.` });
  return gemJSON(parts);
}
async function gradePron(c, rec) {
  const parts = [{ text: `${learnerText()}\nThe learner is practicing pronunciation by repeating this Bisaya phrase: "${c.ceb}" ("${c.en}").\nNative speaker recording:` }, nativePart(c.id), { text: 'Their attempt:' }, recPart(rec), { text: `Compare their attempt with the native recording. Focus on sounds Cebuano learners get wrong: the vowels (Cebuano vowels are short and pure; i/e and u/o are close), stress placement, glottal stops (including in words like "bata" vs "bata'" and between vowels), the "ng" sound at the start of words, tapped r, and keeping an even, quick rhythm instead of English-style vowel reduction. Be specific and honest; don't praise what wasn't good.
Return JSON only: {"heard": "what the learner said, word for word", "same_words": true or false, "score": 0-100, "pron_notes": ["up to 3 specific notes, each naming the word and what to change"], "tip": "one sentence on what to focus on next time"}` }];
  return gemJSON(parts);
}

/* ---------- views ---------- */
let view = 'home';
const VIEWS = {};
function render() { stopAudio(); Rec.cancel(); clearInterval(timerH); (VIEWS[view] || VIEWS.home)(); window.scrollTo(0, 0); }
function go(v) { view = v; render(); }
function ringSvg(v, goal) { const r = 36, c = 2 * Math.PI * r, f = Math.min(1, v / goal); return `<svg class="ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="8"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 42 42)"/></svg>`; }
function unitRow(u, key) {
  const n = u.ids.length, l = learned(u.ids), s = seen(u.ids);
  return `<div class="unit ${S.focus === key ? 'focus' : ''}"><div class="nm"><b>${esc(u.ceb)}</b> <span class="muted small">${esc(u.name)}</span></div>
  <button class="btn sm ghost" data-focus="${key}">${S.focus === key ? 'Focused' : 'Focus'}</button>
  <div class="bar" title="${l} learned, ${s} started of ${n}"><i style="width:${(l / n) * 100}%"></i></div></div>`;
}
VIEWS.home = function () {
  const t = today(), xp = S.xp[t] || 0, goal = S.settings.goal, due = dueIds().length, nw = Math.min(newAllowance(), pickNew().length), plan = planDay();
  const items = planItems(), nextUp = planNext(), doneN = items.filter(i => plan[i.k]).length;
  const weak = weakList(5);
  $('#app').innerHTML = `
  <div class="top"><div class="brand"><h1>Padayon</h1><span class="muted small">Bisaya with the Lucky Clovers</span></div>
    <div class="stats"><span class="stat tnum" title="Day streak"><span class="flame">${I.flame}</span>${streakNow()}</span><span class="stat tnum" title="Listening speed"><span class="flame">${I.bolt}</span>${S.speed.toFixed(1)}×</span></div></div>
  ${!hasPack() || !hasAI() ? `<section class="banner"><b>Finish setting up</b>
    ${!hasPack() ? (packState === 'loading' ? `<div class="small">Downloading 225 phrases and 1,002 words with native recordings… <b id="packpct">${packPct}%</b> (about 10 MB, one time only)</div>` : `<div class="small">${packState === 'error' ? "The phrases and recordings didn't download. Check your connection and try again." : 'Phrases and recordings are not loaded yet.'}</div><button class="btn primary" id="packretry">Download phrases and recordings</button>`) : ''}
    ${!hasAI() ? `<div class="small">Add a free Gemini API key so the Tutor can hear and grade you.</div><button class="btn ${hasPack() ? 'primary' : ''}" data-go="settings">Add Gemini key</button>` : ''}</section>` : ''}
  <section class="hero">
    <div class="hero-guide">${binkoSays(BINKO_NEXT[nextUp ? nextUp.k : 'done'], true)}</div>
    <div><div class="label" style="color:inherit;opacity:.8">Karon nga adlaw · Today</div><h2>${nextUp ? 'Next up: ' + esc(nextUp.name) : 'All done today. Padayon!'}</h2>
      <p>${nextUp ? esc(nextUp.k === 'session' ? due + ' review' + (due === 1 ? '' : 's') + ' due · ' + nw + ' new · about ' + Math.max(5, Math.round((Math.min(due, 16) + nw * 2 + 2) * 0.6)) + ' min' : nextUp.d) : xp + ' XP today. Come back tomorrow, or do another session.'}</p></div>
    <div class="ringwrap plandone">${ringSvg(doneN, items.length)}<span class="ringtxt tnum">${doneN}<small>of ${items.length}</small></span></div>
    <div class="hero-actions">${nextUp ? (nextUp.manual ? `<button class="btn" id="start">I did it</button>` : `<button class="btn" id="start">Start ${esc(nextUp.name.toLowerCase())}</button>`) : `<button class="btn" id="start">Do another session</button>`}</div>
  </section>
  <section class="drills">
    <button class="drill" data-go="tutor"><span class="label">Speaking</span><span class="big">Tutor</span><b>Talk out loud</b><span class="muted small">A voice conversation in Bisaya that corrects you as you go.</span></button>
    <button class="drill" data-go="pron"><span class="label">Pronunciation</span><span class="big">Sulti</span><b>Repeat and get scored</b><span class="muted small">Copy a native speaker, see what to fix.</span></button>
    <button class="drill" data-go="speed"><span class="label">Listening</span><span class="big tnum">${S.speed.toFixed(1)}×</span><b>Speed round</b><span class="muted small">Clips get faster as you get them right.</span></button>
    <button class="drill" id="dictgo"><span class="label">Fast speech</span><span class="big">Dictation</span><b>Type what you hear</b><span class="muted small">Catch every little word.</span></button>
    <button class="drill" data-go="shadow"><span class="label">Fluency</span><span class="big">Shadow</span><b>Speak along</b><span class="muted small">Hands-free. Repeat with the speaker.</span></button>
    <button class="drill" data-go="convos"><span class="label">Chaining</span><span class="big">Istorya</span><b>Conversations</b><span class="muted small">Real exchanges. Play your part out loud.</span></button>
    <button class="drill" data-go="gaps"><span class="label">Your words</span><span class="big tnum">${S.custom.length}</span><b>Gap words</b><span class="muted small">English you keep reaching for.</span></button>
  </section>
  <section class="panel"><div class="row spread"><h2>Your weak spots</h2>${weak.length ? '<button class="btn sm primary" id="weakgo">Practice with Tutor</button>' : ''}</div>
    ${weak.length ? `<div>${weak.map(([k, v]) => `<div class="weak"><span class="n tnum">${v.n}×</span><div style="min-width:0"><b>${esc(k)}</b><div class="small muted">${esc(v.fix)}</div></div></div>`).join('')}</div>` : '<p class="muted small" style="margin:0">Mistakes the Tutor catches in your speaking collect here. The Tutor then steers conversations toward them.</p>'}</section>
  <section class="panel"><div class="row spread"><h2>Today's plan</h2><span class="muted small tnum">${doneN} of ${items.length}</span></div>
    <div class="bar" style="grid-column:auto"><i style="width:${doneN / items.length * 100}%"></i></div>
    <div>${items.map(it => `<div class="check"><button class="box ${plan[it.k] ? 'on' : ''}" data-plan="${it.k}" ${it.manual ? '' : 'disabled title="Ticks itself when you finish"'} aria-label="${esc(it.name)}">${plan[it.k] ? I.check : ''}</button><div style="flex:1;min-width:0"><b>${esc(it.name)}</b><span class="muted small">${esc(it.d)}</span></div>${!plan[it.k] && !it.manual ? `<button class="btn sm ghost" data-run="${it.k}">Go</button>` : ''}</div>`).join('')}</div></section>
  <section class="panel"><div class="row spread"><h2>Foundations</h2><span class="muted small tnum">${learned(F_ORDER)} of ${F.length} learned</span></div>
    <p class="muted small" style="margin:0">How words fit together: who, whose, have, like, questions, and when. Each block comes with sentences you build yourself.</p>
    <div>${F_UNITS.map((u, i) => unitRow(u, 'f' + i)).join('')}</div></section>
  <section class="panel"><div class="row spread"><h2>How Bisaya really works</h2><span class="muted small tnum">${learned(GRAM_ORDER)} of ${G.length} learned</span></div>
    <p class="muted small" style="margin:0">Shortcuts, little words, and verb endings that make fast speech hard to follow.</p>
    <div>${GRAM_UNITS.map((u, i) => unitRow(u, 'g' + i)).join('')}</div></section>
  ${hasPack() ? `<section class="panel"><div class="row spread"><h2>Phrases</h2><span class="muted small tnum">${learned(PHRASE_ORDER)} of ${PHRASE_ORDER.length} learned</span></div>
    <p class="muted small" style="margin:0">Tap Focus to pull a unit's phrases to the front.</p><div>${UNITS.map((u, i) => unitRow(u, 'u' + i)).join('')}</div></section>
  <section class="panel"><details><summary>Common words <span class="muted small tnum">· ${learned(W.map((_, i) => 'w' + i))} of ${W.length} learned</span></summary>
    <div style="margin-top:8px">${WORD_UNITS.map((u, i) => unitRow(u, 'k' + i)).join('')}</div></details></section>` : ''}
  <section class="panel"><div class="row spread"><h2>Sync across devices</h2><button class="btn sm ${Sync.user ? 'ghost' : 'primary'} syncbtn" id="synchome">${Sync.user ? 'Sign out' : 'Sign in with Google'}</button></div>
    <p class="small syncline" style="margin:0">${syncLine()}</p><p class="muted small" style="margin:0">Sign in with the same Google account on your phone and PC and your progress follows you.</p></section>
  <section class="panel"><div class="row spread"><h2>Settings</h2><button class="btn sm ghost" data-go="settings">Open</button></div>
    <p class="muted small" style="margin:0">Gemini key, tutor voice, cards per day, and moving your progress between devices.</p></section>`;
  $('#start').onclick = () => { if (!nextUp) return startSession(); if (nextUp.manual) { tick(nextUp.k); return render(); } nextUp.run(); };
  document.querySelectorAll('[data-run]').forEach(b => b.onclick = () => planItems().find(i => i.k === b.dataset.run).run());
  $('#dictgo').onclick = startDictation;
  $('#synchome').onclick = () => Sync.user ? signOutSync() : signIn();
  if ($('#packretry')) $('#packretry').onclick = autoPack;
  if ($('#weakgo')) $('#weakgo').onclick = () => { TU = null; tutorStart('Practice my weak spots'); };
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  document.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => { const p = planDay(); p[b.dataset.plan] = !p[b.dataset.plan]; save(); render(); });
  document.querySelectorAll('[data-focus]').forEach(b => b.onclick = () => { S.focus = S.focus === b.dataset.focus ? null : b.dataset.focus; save(); render(); toast(S.focus ? 'New cards will come from this unit first' : 'Back to the normal order'); });
};
VIEWS.settings = function () {
  const k = getKey(), st = S.settings;
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Settings</h2></div>
  <section class="panel"><h2>Gemini API key</h2>
    <p class="small" style="margin:0">The Tutor uses Google's Gemini to hear you. Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>, then paste it here. It stays on this device only.</p>
    <div class="keybox"><input class="field" id="key" type="password" autocomplete="off" placeholder="Paste your key" value="${esc(k)}"><button class="btn primary" id="savekey">Save</button></div>
    <div class="row"><button class="btn sm ghost" id="testkey" ${k ? '' : 'disabled'}>Test it</button><span class="small muted" id="keymsg">${k ? 'Key saved.' : 'No key yet.'}</span></div>
    <p class="muted small" style="margin:0">On Google's free tier, Google may use what you send to improve its products. Turning on billing in AI Studio stops that.</p></section>
  <section class="panel"><h2>Tutor voice</h2>
    <div class="seg" id="voices">${['Kore', 'Aoede', 'Puck', 'Charon', 'Zephyr', 'Fenrir'].map(v => `<button class="${st.voice === v ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</div>
    <label class="row small"><input type="checkbox" id="ttson" ${st.ttsOn ? 'checked' : ''}> Read Tutor replies out loud</label>
    <button class="btn sm ghost" id="trytts" ${k ? '' : 'disabled'}>Hear a sample</button></section>
  <section class="panel"><h2>Your name</h2>
    <p class="small" style="margin:0">Binko uses this when he announces your finished lessons in the family Discord.</p>
    <div class="keybox"><input class="field" id="myname" placeholder="${esc(displayName())}" value="${esc(S.settings.name || '')}"><button class="btn primary" id="savename">Save</button></div></section>
  <section class="panel"><h2>Daily cards</h2>
    ${[['newF', 'New building blocks per day', [0, 1, 2, 3, 4]], ['newP', 'New phrases per day', [0, 2, 4, 6, 8]], ['newW', 'New words per day', [0, 2, 4, 6, 10]], ['newG', 'New grammar cards per day', [0, 1, 2, 3]], ['goal', 'Daily XP goal', [30, 60, 100, 150]]].map(([f, l, opts]) => `<div><div class="label">${l}</div><div class="seg" data-set="${f}">${opts.map(n => `<button class="${st[f] === n ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div></div>`).join('')}</section>
  <section class="panel"><h2>Content pack</h2><p class="small" style="margin:0">${hasPack() ? `Loaded: ${P.length} phrases and ${W.length} words with recordings.` : 'Not loaded yet.'}</p><div class="row"><button class="btn ${hasPack() ? 'ghost' : 'primary'}" id="pack3">${hasPack() ? 'Download again' : 'Download now'}</button><button class="btn ghost" id="pack2">Load from a file</button></div></section>
  <section class="panel"><h2>Sync across devices</h2>
    <p class="small syncline" style="margin:0">${syncLine()}</p>
    <div class="row"><button class="btn ${Sync.user ? 'ghost' : 'primary'} syncbtn" id="syncset">${Sync.user ? 'Sign out' : 'Sign in with Google'}</button></div>
    <p class="muted small" style="margin:0">Your Gemini key never syncs. Add it on each device.</p></section>
  <section class="panel"><h2>Backup file</h2>
    <p class="small" style="margin:0">A manual copy of your progress, if you ever want one.</p>
    <div class="row"><button class="btn" id="exp">Save backup file</button><button class="btn ghost" id="imp">Load backup</button></div></section>
  <section class="panel"><details><summary>Advanced: model names</summary>
    <div style="display:grid;gap:8px;margin-top:10px"><label class="label" for="mdl">Listening and grading model</label><input class="field" id="mdl" value="${esc(st.model)}">
    <label class="label" for="tmdl">Voice model</label><input class="field" id="tmdl" value="${esc(st.tts)}">
    <button class="btn sm" id="savem">Save model names</button><p class="muted small" style="margin:0">Only change these if Google renames its models.</p></div></details></section>`;
  $('#quit').onclick = () => go('home');
  $('#syncset').onclick = () => Sync.user ? signOutSync() : signIn();
  $('#savekey').onclick = () => { try { localStorage.setItem(KEYK, $('#key').value.trim()); } catch (e) { } render(); toast('Key saved'); };
  $('#testkey').onclick = async () => { $('#keymsg').textContent = 'Testing…'; try { const r = await gemJSON([{ text: 'Reply with JSON {"ok": true, "ceb": "Maayong adlaw"}' }]); $('#keymsg').textContent = r && r.ok ? 'Works. Gemini is connected.' : 'Connected, but the reply looked odd.'; } catch (e) { $('#keymsg').textContent = gemErr(e); } };
  document.querySelectorAll('#voices button').forEach(b => b.onclick = () => { S.settings.voice = b.dataset.v; Object.keys(ttsCache).forEach(k2 => delete ttsCache[k2]); save(); render(); });
  $('#ttson').onchange = e => { S.settings.ttsOn = e.target.checked; save(); };
  $('#savename').onclick = () => { S.settings.name = $('#myname').value.trim(); save(); toast('Saved'); };
  $('#trytts').onclick = async e => { const b = e.currentTarget; b.textContent = 'Loading…'; const u = await tts('Maayong buntag! Kumusta ka karon? Unsa imong gikaon ganina?'); b.textContent = 'Hear a sample'; if (u) playUrl(u, 1); else toast('No audio came back. Check the voice model name.'); };
  document.querySelectorAll('[data-set]').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => { S.settings[g.dataset.set] = +b.dataset.v; save(); render(); }));
  $('#pack2').onclick = importPack; $('#pack3').onclick = () => { go('home'); autoPack(); };
  $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'padayon-progress-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); };
  $('#imp').onclick = () => { const fi = $('#filein'); fi.accept = '.json,application/json'; fi.value = ''; fi.onchange = async () => { try { const s = JSON.parse(await fi.files[0].text()); if (s.v !== 1) throw 0; S = migrate(s); save(); toast('Progress loaded'); go('home'); } catch (e) { toast('That is not a Padayon backup file.'); } }; fi.click(); };
  $('#savem').onclick = () => { S.settings.model = $('#mdl').value.trim() || fresh().settings.model; S.settings.tts = $('#tmdl').value.trim() || fresh().settings.tts; save(); toast('Saved'); };
};

/* ---------- session engine ---------- */
let Q = [], qi = 0, sess = null, timerH = null;
const newSess = mode => ({ xp: 0, right: 0, total: 0, graded: new Set(), requeued: new Set(), newIds: new Set(), mode, peak: S.speed });
function startSession() { Q = buildSession(); qi = 0; sess = newSess('daily'); go('session'); }
function startDictation() {
  if (!hasPack()) return toast('Load the content pack first. Dictation uses its recordings.');
  let pool = Object.keys(S.cards).filter(id => IDX[id]);
  if (pool.length < 10) pool = [...new Set(pool.concat(PHRASE_ORDER.slice(0, 30)))];
  Q = shuffle(pool).slice(0, 12).map(id => ({ id, type: 'dict' })); qi = 0; sess = newSess('dict'); go('session');
}
VIEWS.session = function () {
  if (qi >= Q.length) return finishSession();
  const item = Q[qi], c = card(item.id);
  if (!c || ((item.type === 'pron' || item.type === 'dict' || item.type === 'listen' || item.type === 'tiles' || item.type === 'shadow') && !c.audio)) { qi++; return VIEWS.session(); }
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="End session">${I.x}</button><div class="prog"><i style="width:${(qi / Q.length) * 100}%"></i></div><span class="speedchip">${S.speed.toFixed(1)}×</span></div>
  <div class="ex" id="ex"></div><div class="foot" id="foot"></div>`;
  $('#quit').onclick = () => { if (qi > 0 && sess.total > 0) finishSession(); else go('home'); };
  EX[item.type](c, item);
};
function foot(html) { $('#foot').className = 'foot'; $('#foot').innerHTML = html; }
function next() { stopAudio(); qi++; VIEWS.session(); window.scrollTo(0, 0); }
function result(c, item, ok, extra) {
  const q = ok === true ? 2 : ok === false ? 0 : ok;
  if (!sess.graded.has(c.id) && item.type !== 'teach' && item.type !== 'shadow') {
    sess.graded.add(c.id);
    if (!sess.newIds.has(c.id)) grade(c.id, q);
    else if (q === 0) S.cards[c.id].d = today();
    else { S.cards[c.id].b = Math.max(S.cards[c.id].b, 1); S.cards[c.id].r++; }
  }
  sess.total++; if (q > 0) { sess.right++; const g = q === 2 ? 10 : 6; sess.xp += g; addXP(g); }
  // the party drops in now and then: a streak, a comeback, or a rough patch
  const prevWrong = sess.wrongRun || 0; sess.run = q > 0 ? (sess.run || 0) + 1 : 0; sess.wrongRun = q > 0 ? 0 : prevWrong + 1;
  const gap = sess.total - (sess.lastCameo || -9) >= 4;
  const cameoKind = !gap ? null : q > 0 && sess.run > 0 && sess.run % 3 === 0 ? 'streak' : q > 0 && prevWrong >= 1 && Math.random() < 0.4 ? 'comeback' : q === 0 && sess.wrongRun === 2 ? 'rough' : null;
  if (cameoKind) sess.lastCameo = sess.total;
  if (q === 0 && !sess.requeued.has(c.id)) { sess.requeued.add(c.id); Q.push({ id: c.id, type: c.kind === 'f' ? 'build' : c.audio ? pick(['listen', 'mc']) : 'mc' }); }
  save();
  const f = $('#foot'); f.className = 'foot ' + (q > 0 ? 'good' : 'bad');
  f.innerHTML = `<div class="row spread"><div style="min-width:0;flex:1"><div class="verdict">${q === 2 ? 'Tama!' : q === 1 ? 'Sakto ra. Almost there.' : 'Dili pa. Not yet.'}</div>
  <div class="ans"><span>${esc(c.ceb)}</span> <span class="muted" style="font-weight:400">· ${esc(c.en)}</span></div>${extra ? `<div class="small">${extra}</div>` : ''}${c.note && q < 2 ? `<div class="small muted">${esc(c.note)}</div>` : ''}${q < 2 && tipFor(c) ? `<div class="small"><b>Trick:</b> ${esc(tipFor(c).trick)}</div>` : ''}</div>
  ${c.audio ? `<button class="play sm" id="fplay" aria-label="Play">${I.play}</button>` : ''}</div>
  ${cameoKind ? cameoHtml(cameoKind) : ''}<button class="btn primary block" id="cont">Continue</button>`;
  if (c.audio) { $('#fplay').onclick = e => play(c.id, 1, e.currentTarget); if (!['listen', 'tiles', 'dict', 'pron', 'say'].includes(item.type)) play(c.id, 1); }
  $('#cont').onclick = next; $('#cont').focus({ preventScroll: true });
}
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
  const inter = y.filter(w => x.has(w)).length; return inter / Math.max(x.size, y.length) >= 0.8;
}
function simScore(c, d) {
  const a = tokSet(c.ceb), b = tokSet(d.ceb); let sc = 0;
  b.forEach(t => { if (a.has(t)) sc += 3; });
  const fa = lowTok(tokens(c.ceb)[0] || ''), fb = lowTok(tokens(d.ceb)[0] || '');
  if (fa && fa === fb) sc += 2; else if (fa.slice(0, 2) === fb.slice(0, 2)) sc += 1;
  if (UNIT_OF[c.id] && UNIT_OF[c.id] === UNIT_OF[d.id]) sc += 2.5;
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
  const toks = tokens(c.ceb), out = new Set(), real = new Set(alts(c.ceb));
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
function distract(c, n, field) {
  const pool = c.kind === 'w' ? W.map((_, i) => 'w' + i).concat(PHRASE_ORDER.filter(id => tokens(P[+id.slice(1)][0]).length === 1))
    : c.kind === 'p' ? PHRASE_ORDER : c.kind === 'g' ? GRAM_ORDER.concat(F_ORDER) : c.kind === 'f' ? F_ORDER.concat(GRAM_ORDER) : GRAM_ORDER.concat(PHRASE_ORDER, S.custom.map(x => x.id));
  const ranked = pool.filter(id => id !== c.id).map(card).filter(Boolean).map(d => [simScore(c, d), d]).sort((x, y) => y[0] - x[0]);
  const out = [], used = new Set([norm(c[field])]);
  const ok = d => { const v = norm(d[field]); if (!v || used.has(v) || sameMeaning(c.en, d.en)) return false; used.add(v); return true; };
  // minimal-change fakes only make sense when the options are in Bisaya
  if (field === 'ceb') for (const v of swapVariants(c).slice(0, n >= 3 ? 2 : 1)) { const d = { id: 'x' + out.length, ceb: v, en: '' }; if (ok(d)) out.push(d); }
  const top = ranked.slice(0, Math.max(8, n * 3)); shuffle(top);
  for (const [, d] of top.sort((x, y) => y[0] - x[0] + (Math.random() - 0.5) * 3)) { if (out.length >= n) break; if (ok(d)) out.push(d); }
  for (const [, d] of ranked) { if (out.length >= n) break; if (ok(d)) out.push(d); }
  return out;
}
// show every option in the same style so punctuation and capitals don't give the answer away
const optText = (o, field) => { let t = String(o[field] || '').trim().replace(/[.!]+$/, ''); return t ? t[0].toUpperCase() + t.slice(1) : t; };

/* ---------- word by word, memory tricks, where a word shows up ---------- */
function glossOf(tok) {
  const t = lowTok(tok); if (!t) return null;
  if (GLOSS[t]) return GLOSS[t];
  const w = W.findIndex(x => norm(x[0]) === t); if (w >= 0) return W[w][1];
  const p = P.findIndex(x => tokens(x[0]).length === 1 && alts(x[0]).includes(t)); if (p >= 0) return P[p][1];
  for (const [re, txt] of AFFIX) if (re.test(t) && t.length > 5) { const root = t.replace(re, ''); const rw = W.find(x => norm(x[0]) === root); return txt + (rw ? ' · ' + root + ' = ' + rw[1] : ''); }
  return null;
}
function breakdown(ceb) {
  const toks = tokens(ceb); if (toks.length < 2) return '';
  return `<div><div class="label">Word by word</div><div class="wbw">${toks.map(t => { const g = glossOf(t); return `<span class="wb"><b>${esc(t.replace(/[.,!?…]/g, ''))}</b><i>${esc(g || '·')}</i></span>`; }).join('')}</div></div>`;
}
function usedIn(c) {
  if (c.kind !== 'w' && !(c.kind === 'p' && tokens(c.ceb).length === 1)) return '';
  const t = norm(firstAlt(c.ceb)); if (!t) return '';
  const hits = P.map((x, i) => [x, i]).filter(([x, i]) => 'p' + i !== c.id && tokens(x[0]).length > 1 && tokens(x[0]).map(lowTok).includes(t)).slice(0, 2);
  return hits.length ? `<div><div class="label">You'll hear it in</div>${hits.map(([x]) => `<div class="small"><b>${esc(x[0])}</b> <span class="muted">· ${esc(x[1])}</span></div>`).join('')}</div>` : '';
}
const tipFor = c => c.trick ? { trick: c.trick } : (S.tips || {})[c.id] || null;
function tipHtml(t, c) {
  if (!t) return '';
  return `<div class="panel tip"><div class="label">Binko's memory trick</div><div>${esc(t.trick || '')}</div>${t.english ? `<div class="small"><b>English link:</b> ${esc(t.english)}</div>` : ''}${t.when && !(c && c.note) ? `<div class="small"><b>When to use it:</b> ${esc(t.when)}</div>` : ''}${t.example ? `<div class="small"><b>${esc(t.example)}</b> <span class="muted">· ${esc(t.example_en || '')}</span></div>` : ''}</div>`;
}
async function fetchTip(c) {
  const r = await gemJSON([{ text: `${learnerText()}
Make a memory aid for this Bisaya (Cebuano) item: "${c.ceb}" = "${c.en}".
Return JSON only: {"trick": "one short, vivid memory trick that links the SOUND of the Bisaya to an English word or image (1-2 sentences)",
"english": "a real English, Spanish or Tagalog connection if one exists (cognate or loanword), else \\"\\"",
"when": "when Cebuanos actually use it vs. similar words, in one sentence",
"example": "one short everyday Bisaya sentence that uses it, as people in Cebu talk", "example_en": "its English"}` }]);
  if (r && r.trick) { S.tips[c.id] = { trick: String(r.trick), english: String(r.english || ''), when: String(r.when || ''), example: String(r.example || ''), example_en: String(r.example_en || '') }; save(); }
  return S.tips[c.id];
}
function wireTip(c, slot, auto) {
  const el = $(slot); if (!el) return;
  const have = tipFor(c);
  if (have) { el.innerHTML = tipHtml(have, c); return; }
  if (!hasAI()) return;
  const runIt = async () => { el.innerHTML = '<p class="muted small" style="margin:0">Making a memory trick…</p>'; try { el.innerHTML = tipHtml(await fetchTip(c), c); } catch (e) { el.innerHTML = `<p class="muted small" style="margin:0">${esc(gemErr(e))}</p>`; } };
  if (auto) runIt(); else { el.innerHTML = '<button class="linkbtn" id="tipbtn">Show a memory trick</button>'; $('#tipbtn').onclick = runIt; }
}
function sayBtn(c) { return !c.audio && hasAI() && S.settings.ttsOn ? `<button class="miniplay" id="ttsb">${I.play} Hear it</button>` : ''; }
function wireSay(c, text) { const b = $('#ttsb'); if (b) b.onclick = async () => { b.disabled = true; const u = await tts(text || firstAlt(c.ceb)); b.disabled = false; if (u) playUrl(u, 1); else toast('No audio came back.'); }; }

const playBlock = rate => `<div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><button class="play sm slow" id="pls" aria-label="Play slower">${I.slow}</button><span class="muted small">Playing at ${rate.toFixed(1)}×.<br>Turtle plays it at 0.8×.</span></div>`;
function wirePlay(c, rate) { $('#pl').onclick = e => play(c.id, rate, e.currentTarget); $('#pls').onclick = e => play(c.id, 0.8, e.currentTarget); play(c.id, rate, $('#pl')); }
function choiceEx(c, item, opts, field, cls) {
  let sel = null;
  $('#ex').querySelector('.opts').innerHTML = opts.map((o, i) => `<button class="opt ${cls || ''}" data-i="${i}">${esc(optText(o, field))}</button>`).join('');
  foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
  const btns = [...document.querySelectorAll('.opt')];
  btns.forEach(b => b.onclick = () => { btns.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.i; $('#chk').disabled = false; });
  $('#chk').onclick = () => { const ok = opts[sel].id === c.id; btns.forEach((b, i) => { b.disabled = true; if (opts[i].id === c.id) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); }); result(c, item, ok); };
}
function typedCheck(c, item, inp, tolFrac, dictMode) {
  const g = norm(inp.value); inp.disabled = true;
  let best = 99, tgt = '';
  for (const a of alts(c.ceb)) { const d = lev(g, a); if (d < best) { best = d; tgt = a; } }
  const tol = Math.max(1, Math.floor(tgt.length * tolFrac));
  const missed = tgt.split(' ').filter(w => !g.split(' ').includes(w));
  const said = esc(inp.value.trim());
  if (best === 0) return result(c, item, true);
  if (dictMode) return result(c, item, best <= tol ? 1 : false, missed.length ? 'Missed or misheard: <b>' + esc(missed.join(', ')) + '</b>' : 'You wrote "' + said + '"');
  return result(c, item, best <= tol ? true : false, best <= tol ? 'Watch the spelling: you wrote "' + said + '"' : 'You wrote "' + said + '"');
}
function aiFeedback(r, rec, c) {
  const sc = Math.max(0, Math.min(100, +(r.score) || 0));
  const col = (r.verdict || (sc >= 80 ? 'correct' : sc >= 55 ? 'close' : 'wrong')) === 'correct' ? 'var(--good)' : (r.verdict === 'close' || (sc >= 55 && sc < 80)) ? 'var(--mango)' : 'var(--bad)';
  return `<div class="panel grade">
    <div class="row"><span class="score tnum" style="color:${col}">${sc}</span><div style="min-width:0;flex:1">${r.pronunciation != null ? `<div class="small">Pronunciation <b class="tnum">${Math.round(+r.pronunciation || 0)}</b></div>` : ''}${r.feedback || r.tip ? `<div class="small">${esc(r.feedback || r.tip)}</div>` : ''}</div></div>
    ${r.heard ? `<div class="heard"><span class="label">Heard</span><br><b>${esc(r.heard)}</b></div>` : ''}
    ${r.corrected ? `<div><div class="label">A Cebuano would say</div><div class="corr">${esc(r.corrected)}</div></div>` : ''}
    ${r.pron_notes && r.pron_notes.length ? `<div><div class="label">Sounds to work on</div><ul class="notes small">${r.pron_notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
    ${r.english_words && r.english_words.length ? `<div class="small"><b>English you used:</b> ${r.english_words.map(x => esc(x.en) + ' → <b>' + esc(x.ceb) + '</b>').join(' · ')} <span class="muted">(added to Gap words)</span></div>` : ''}
    <div class="row"><button class="miniplay" id="mine">${I.play} You</button>${c && c.audio ? `<button class="miniplay" id="nat">${I.play} Native</button>` : ''}</div></div>`;
}
function wireCompare(rec, c) { if ($('#mine')) $('#mine').onclick = () => playUrl(rec.url, 1); if ($('#nat')) $('#nat').onclick = () => play(c.id, 1); }
const EX = {
  teach(c, item) {
    sess.newIds.add(c.id);
    if (!S.cards[c.id]) { S.cards[c.id] = { b: 0, d: today() + 1, r: 0, w: 0 }; const t = today(); if (S.newDay.d !== t) S.newDay = { d: t, n: 0 }; S.newDay.n++; save(); }
    $('#ex').innerHTML = `<div class="label">${c.kind === 'c' ? 'One of your gap words' : c.kind === 'g' ? 'How Bisaya really works' : c.kind === 'f' ? 'Building block' : 'New ' + (c.kind === 'w' ? 'word' : 'phrase')}</div>
      <div class="ceb">${esc(c.ceb)}</div><div class="prompt" style="font-weight:500">${esc(c.en)}</div>
      ${breakdown(c.ceb)}
      ${c.note ? `<div class="panel note">${castImg('binko', 'peek')}<div class="label">Binko explains · ${c.kind === 'p' || c.kind === 'w' ? 'when to use it' : 'how it fits together'}</div>${esc(c.note)}</div>` : ''}
      ${c.combos ? `<div><div class="label">Swap in other words</div>${c.combos.map(x => `<div class="small"><b>${esc(x[0])}</b> <span class="muted">· ${esc(x[1])}</span></div>`).join('')}</div>` : ''}
      ${usedIn(c)}
      <div id="tipslot"></div>
      ${c.ex ? `<div class="panel"><b>${esc(c.ex)}</b><span class="muted small">${esc(c.exEn || '')}</span></div>` : ''}
      ${c.audio ? `<div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><button class="play sm slow" id="pls" aria-label="Play slower">${I.slow}</button><span class="muted small">Say it out loud with the recording.</span></div>` : `<div class="row">${sayBtn(c)}<span class="muted small">Say it out loud twice.</span></div>`}`;
    if (c.audio) wirePlay(c, 1); else wireSay(c);
    wireTip(c, '#tipslot', isNewLearner());
    sess.xp += 2; addXP(2);
    foot(`<button class="btn primary block" id="cont">Got it</button>`); $('#cont').onclick = next;
  },
  listen(c, item) { $('#ex').innerHTML = `<h2>What did you hear?</h2>${playBlock(S.speed)}<div class="opts"></div>`; wirePlay(c, S.speed); choiceEx(c, item, shuffle([c, ...distract(c, 3, 'en')]), 'en'); },
  mc(c, item) { $('#ex').innerHTML = `<div class="label">How do you say</div><div class="prompt">${esc(c.en)}</div><div class="opts"></div>`; choiceEx(c, item, shuffle([c, ...distract(c, 3, 'ceb')]), 'ceb', 'cebopt'); },
  build(c, item) {
    const combo = c.combos ? pick([[c.ceb, c.en]].concat(c.combos)) : [c.ceb, c.en];
    const cc = Object.assign({}, c, { ceb: combo[0], en: combo[1] });
    const ans = tokens(cc.ceb).map(t => t.replace(/[.,!?…]/g, '')), low = ans.map(a => a.toLowerCase());
    const swaps = [...new Set(swapVariants(cc).flatMap(v => tokens(v).map(t => t.replace(/[.,!?…]/g, ''))))].filter(t => !low.includes(t.toLowerCase()));
    const others = (c.combos || []).concat(F.flatMap(f => f.combos)).flatMap(x => tokens(x[0]).map(t => t.replace(/[.,!?…]/g, ''))).filter(t => !low.includes(t.toLowerCase()));
    const extra = [...new Set(shuffle(swaps).slice(0, 2).concat(shuffle(others)))].slice(0, Math.max(3, Math.ceil(ans.length * 0.8)));
    const bank = shuffle(ans.map((t, i) => ({ t, k: 'a' + i })).concat(extra.map((t, i) => ({ t, k: 'x' + i })))); const chosen = [];
    $('#ex').innerHTML = `<div class="label">Build it in Bisaya</div><div class="prompt">${esc(cc.en)}</div><div class="tray" id="tray"></div><div class="bank" id="bank">${bank.map(b => `<button class="tile" data-k="${b.k}">${esc(b.t)}</button>`).join('')}</div><p class="muted small" style="margin:0">Some tiles are look-alikes. Watch ko / ka, koy / kay, mo- / ni-.</p>`;
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
    const swapT = [...new Set(swapVariants(c).flatMap(v => tokens(v)))].filter(t => !low.includes(t.toLowerCase()));
    const extra = [...new Set(shuffle(swapT).slice(0, 2).concat(shuffle(PHRASE_ORDER.filter(id => id !== c.id)).flatMap(id => tokens(P[+id.slice(1)][0])).filter(t => !low.includes(t.toLowerCase()))))].slice(0, Math.min(4, Math.max(2, Math.ceil(ans.length / 2))));
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
  type(c, item) {
    $('#ex').innerHTML = `<div class="label">Write it in Bisaya</div><div class="prompt">${esc(c.en)}</div><input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type in Bisaya"><p class="muted small" style="margin:0">Small typos are fine. "ug" and "og" both count.</p>`;
    foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
    const inp = $('#ans'); inp.focus(); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) $('#chk').click(); };
    $('#chk').onclick = () => typedCheck(c, item, inp, 0.12, false);
  },
  dict(c, item) {
    $('#ex').innerHTML = `<h2>Type what you hear</h2>${playBlock(S.speed)}<input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the Bisaya you hear"><p class="muted small" style="margin:0">Replay as often as you need. Catch every little word: ko, na, pa, man, sa.</p>`;
    wirePlay(c, S.speed); foot(`<button class="btn primary block" id="chk" disabled>Check</button>`);
    const inp = $('#ans'); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) $('#chk').click(); };
    $('#chk').onclick = () => typedCheck(c, item, inp, 0.15, true);
  },
  speak(c, item) {
    const secs = Math.round(Math.min(10, 3 + tokens(c.ceb).length * 0.8));
    $('#ex').innerHTML = `<div class="label">Say it out loud in Bisaya</div><div class="prompt">${esc(c.en)}</div><div class="timer"><i id="tb"></i></div><p class="muted small" style="margin:0">${secs} seconds. The whole thing, no English. Add a Gemini key in Settings to get graded automatically.</p><div id="rev"></div>`;
    foot(`<button class="btn primary block" id="show">Show answer</button>`);
    const t0 = Date.now();
    const reveal = () => {
      clearInterval(timerH);
      $('#rev').innerHTML = `<div class="ceb">${esc(c.ceb)}</div>${c.audio ? `<div class="playrow" style="margin-top:12px"><button class="play sm" id="pl2" aria-label="Play">${I.play}</button><span class="muted small">Compare with the native recording.</span></div>` : ''}`;
      if (c.audio) { $('#pl2').onclick = e => play(c.id, 1, e.currentTarget); play(c.id, 1, $('#pl2')); }
      foot(`<div class="label">How did it go?</div><div class="grades"><button class="btn" data-q="2">Said it smoothly</button><button class="btn" data-q="1">Got there, but slowly or with small mistakes</button><button class="btn" data-q="0">Blanked or used English</button></div>`);
      document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => result(c, item, +b.dataset.q));
    };
    timerH = setInterval(() => { const f = 1 - (Date.now() - t0) / (secs * 1000); $('#tb').style.width = Math.max(0, f * 100) + '%'; if (f <= 0) reveal(); }, 100);
    $('#show').onclick = reveal;
  },
  say(c, item) {
    if (!hasAI()) return EX.speak(c, item);
    $('#ex').innerHTML = `<div class="label">Say it out loud in Bisaya</div><div class="prompt">${esc(c.en)}</div><div id="micw"></div><div id="res"></div>`;
    foot(`<button class="btn ghost block" id="skip">I don't know it yet</button>`);
    $('#skip').onclick = () => { Rec.cancel(); result(c, item, false); };
    micWidget($('#micw'), async rec => {
      try {
        const r = await gradeSay(c, rec); absorb(r);
        $('#res').innerHTML = aiFeedback(r, rec, c); wireCompare(rec, c);
        result(c, item, r.verdict === 'correct' ? 2 : r.verdict === 'close' ? 1 : 0, '');
      } catch (e) { $('#micst').textContent = gemErr(e); }
    });
  },
  pron(c, item) {
    if (!hasAI()) return EX.shadow(c, item);
    $('#ex').innerHTML = `<div class="label">Repeat after the speaker</div><div class="ceb">${esc(c.ceb)}</div><div class="muted">${esc(c.en)}</div>
      <div class="playrow"><button class="play sm" id="pl" aria-label="Play">${I.play}</button><button class="play sm slow" id="pls" aria-label="Play slower">${I.slow}</button><span class="muted small">Listen, then record yourself saying it the same way.</span></div><div id="micw"></div><div id="res"></div>`;
    wirePlay(c, 1);
    foot(`<button class="btn ghost block" id="skip">Skip</button>`); $('#skip').onclick = () => { Rec.cancel(); next(); };
    micWidget($('#micw'), async rec => {
      try {
        const r = await gradePron(c, rec);
        $('#res').innerHTML = aiFeedback(r, rec, c); wireCompare(rec, c);
        const sc = +r.score || 0; result(c, item, r.same_words === false ? 0 : sc >= 80 ? 2 : sc >= 55 ? 1 : 0, '');
      } catch (e) { $('#micst').textContent = gemErr(e); }
    });
  },
  async shadow(c, item) {
    const rates = [1, 1, Math.max(1.1, S.speed)];
    $('#ex').innerHTML = `<div class="label">Shadowing</div><div class="ceb">${esc(c.ceb)}</div><div class="muted">${esc(c.en)}</div>
      <div class="stage">${['Listen', 'Speak along', 'Speak along, ' + rates[2].toFixed(1) + '×'].map((n, i) => `<span id="st${i}">${n}</span>`).join('')}</div>
      <p class="muted small" style="margin:0">Say it at the same time as the speaker, copying the rhythm and melody.</p>`;
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
function finishSession() { stopAudio(); const full = qi >= Q.length; if (full && sess.mode === 'daily') tick('session'); if (full && sess.mode === 'dict') tick('dict'); if (sess.mode === 'daily' && !full) bumpStreak(); save(); go('summary'); }
VIEWS.summary = function () {
  const acc = sess.total ? Math.round(sess.right / sess.total * 100) : 0;
  $('#app').innerHTML = `<section class="panel summary"><div class="label">${sess.mode === 'speed' ? 'Speed round done' : sess.mode === 'dict' ? 'Dictation done' : 'Session done'}</div>
    <h1 style="font-size:2rem;color:var(--sea)">Maayo kaayo!</h1>
    <div class="sumgrid"><div><b class="tnum">${sess.xp}</b><span class="small muted">XP</span></div><div><b class="tnum">${acc}%</b><span class="small muted">correct</span></div>
    <div><b class="tnum">${sess.mode === 'speed' ? sess.peak.toFixed(1) + '×' : streakNow()}</b><span class="small muted">${sess.mode === 'speed' ? 'top speed' : 'day streak'}</span></div></div>
    ${sess.mode === 'speed' ? `<p class="muted">Your listening speed is now <b>${S.speed.toFixed(1)}×</b>.</p>` : `<p class="muted">${sess.newIds.size} new · ${sess.graded.size} practiced.</p>`}
    ${cameoHtml('done')}${binkoSays(planNext() ? BINKO_NEXT[planNext().k] : BINKO_NEXT.done)}
    ${nextBtnHtml()}<button class="btn ghost block" id="home">Home</button></section>`;
  wireNext(); $('#home').onclick = () => go('home');
};

/* ---------- speed round ---------- */
VIEWS.speed = function () {
  if (!hasPack()) { toast('Load the content pack first. The speed round uses its recordings.'); return go('home'); }
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Speed round</h2></div>
  <section class="panel"><p style="margin:0">20 clips. Each plays once at your speed, then you get 7 seconds to answer. Two right in a row speeds it up by 0.1×. A miss slows it down.</p>
    <div class="row"><span class="label">Starting speed</span><span class="speedchip">${S.speed.toFixed(1)}×</span><span class="muted small">Best ${S.bestSpeed.toFixed(1)}×</span></div>
    <button class="btn primary block" id="go">Start</button></section>`;
  $('#quit').onclick = () => go('home'); $('#go').onclick = startSpeed;
};
let SP = null;
function startSpeed() {
  let pool = Object.keys(S.cards).filter(id => IDX[id]);
  if (pool.length < 12) pool = [...new Set(pool.concat(PHRASE_ORDER.slice(0, 30)))];
  pool = shuffle(pool).slice(0, 20); while (pool.length < 20) pool.push(pick(PHRASE_ORDER));
  SP = { list: pool, i: 0, rate: S.speed, run: 0 }; sess = newSess('speed'); speedQ();
}
function endSpeed() { S.speed = Math.max(1, Math.round(SP.rate * 10) / 10); S.bestSpeed = Math.max(S.bestSpeed, sess.peak); if (SP.i >= SP.list.length - 1) tick('speed'); save(); view = 'summary'; VIEWS.summary(); }
async function speedQ() {
  if (SP.i >= SP.list.length) return endSpeed();
  view = 'speedrun';
  const c = card(SP.list[SP.i]), opts = shuffle([c, ...distract(c, 3, 'en')]);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="End">${I.x}</button><div class="prog"><i style="width:${SP.i / SP.list.length * 100}%"></i></div><span class="speedchip">${SP.rate.toFixed(1)}×</span></div>
   <div class="ex"><h2>Listen once</h2><div class="playrow"><button class="play playing" id="pl" aria-label="Playing" disabled>${I.play}</button><span class="muted small" id="st">Playing…</span></div>
   <div class="timer"><i id="tb"></i></div><div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}" disabled>${esc(optText(o, 'en'))}</button>`).join('')}</div></div><div class="foot" id="foot" hidden></div>`;
  $('#quit').onclick = () => { clearInterval(timerH); stopAudio(); if (sess.total) endSpeed(); else go('home'); };
  const myI = SP.i;
  await play(c.id, SP.rate, $('#pl'));
  if (view !== 'speedrun' || SP.i !== myI) return;
  $('#st').textContent = 'Pick the meaning';
  const btns = [...document.querySelectorAll('.opt')]; btns.forEach(b => b.disabled = false);
  const t0 = Date.now(); let done = false;
  const finish = sel => {
    if (done) return; done = true; clearInterval(timerH);
    const ok = sel != null && opts[sel].id === c.id;
    btns.forEach((b, i) => { b.disabled = true; if (opts[i].id === c.id) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); });
    sess.total++;
    const spCameo = ok && (sess.right + 1) % 5 === 0;
    if (ok) { sess.right++; sess.xp += 5; addXP(5); SP.run++; if (SP.run >= 2) { SP.rate = Math.min(2, Math.round((SP.rate + 0.1) * 10) / 10); SP.run = 0; sess.peak = Math.max(sess.peak, SP.rate); } }
    else { SP.run = 0; SP.rate = Math.max(0.8, Math.round((SP.rate - 0.1) * 10) / 10); }
    const f = $('#foot'); f.hidden = false; f.className = 'foot ' + (ok ? 'good' : 'bad');
    f.innerHTML = `<div class="row spread"><div style="min-width:0;flex:1"><div class="verdict">${ok ? 'Tama!' : sel == null ? "Time's up" : 'Dili pa.'}</div><div class="ans">${esc(c.ceb)} <span class="muted" style="font-weight:400">· ${esc(c.en)}</span></div></div><button class="play sm" id="fplay" aria-label="Replay at normal speed">${I.play}</button></div>${spCameo ? cameoHtml('streak') : ''}<button class="btn primary block" id="cont">Next</button>`;
    $('#fplay').onclick = e => play(c.id, 1, e.currentTarget); $('#cont').onclick = () => { SP.i++; speedQ(); }; $('#cont').focus({ preventScroll: true });
  };
  btns.forEach((b, i) => b.onclick = () => finish(i));
  timerH = setInterval(() => { const f = 1 - (Date.now() - t0) / 7000; const tb = $('#tb'); if (tb) tb.style.width = Math.max(0, f * 100) + '%'; if (f <= 0) finish(null); }, 100);
}


/* ---------- conversations: chain lines into a real exchange ---------- */
let DL = null;
VIEWS.convos = function () {
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Conversations</h2></div>
  <section class="panel"><p style="margin:0">Short, everyday exchanges. Read and listen first, then play your part out loud, then put the lines back in order. Each line has a note on how it connects to the last one.</p></section>
  <section class="panel">${DIALOGS.map((d, i) => `<div class="unit"><div class="nm"><b>${esc(d.ceb)}</b> <span class="muted small">${esc(d.title)} · ${d.lines.length} lines</span></div><span></span>
    <div class="row" style="grid-column:1/-1"><button class="btn sm primary" data-d="${i}" data-m="read">Read and listen</button><button class="btn sm" data-d="${i}" data-m="part">Play your part</button><button class="btn sm ghost" data-d="${i}" data-m="order">Put in order</button>${hasAI() ? `<button class="btn sm ghost" data-d="${i}" data-m="tutor">Role-play with Tutor</button>` : ''}</div></div>`).join('')}</section>`;
  $('#quit').onclick = () => go('home');
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
    const d = DIALOGS[+b.dataset.d], m = b.dataset.m;
    if (m === 'tutor') { TU = null; return tutorStart(`Role-play "${d.title}". You are the ${d.a.toLowerCase()}, the learner is themselves. Use lines like: ${d.lines.filter(l => l[0] === 'a').map(l => l[1]).join(' / ')}`); }
    DL = { d, m, i: 0, show: {}, right: 0, order: [], pool: m === 'order' ? shuffle(d.lines.map((_, j) => j)) : [] };
    view = 'convo'; render();
  });
};
const lineSay = async (txt, btn) => { if (!hasAI() || !S.settings.ttsOn) return; if (btn) btn.classList.add('playing'); const u = await tts(txt); if (btn) btn.classList.remove('playing'); if (u && view === 'convo') await playUrl(u, 1); };
function bubble(d, l, j, opts = {}) {
  const me = l[0] === 'b', showEn = opts.en || DL.show[j];
  return `<div class="msg ${me ? 'me' : 'them'}"><div class="small" style="opacity:.75">${esc(me ? d.b : d.a)}</div><div style="font-weight:700">${esc(l[1])}</div>
    ${showEn ? `<div class="tr" ${me ? 'style="color:inherit;opacity:.85"' : ''}>${esc(l[2])}</div>` : `<button class="linkbtn" data-en="${j}" ${me ? 'style="color:inherit"' : ''}>English</button>`}
    ${opts.note && l[3] ? `<div class="tr" ${me ? 'style="color:inherit;opacity:.85"' : ''}><i>${esc(l[3])}</i></div>` : ''}
    ${hasAI() && S.settings.ttsOn ? `<button class="miniplay" data-say="${j}" style="margin-top:6px">${I.play}</button>` : ''}</div>`;
}
function wireBubbles(d) {
  document.querySelectorAll('[data-en]').forEach(b => b.onclick = () => { DL.show[+b.dataset.en] = true; render(); });
  document.querySelectorAll('[data-say]').forEach(b => b.onclick = () => lineSay(d.lines[+b.dataset.say][1], b));
}
VIEWS.convo = function () {
  const d = DL.d, n = d.lines.length;
  const head = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><div class="prog"><i style="width:${(DL.m === 'order' ? DL.order.length : DL.i) / n * 100}%"></i></div><span class="muted small">${esc(d.ceb)}</span></div>`;
  const done = () => { const xp = DL.m === 'part' ? 4 * DL.right + 6 : 10; addXP(xp); if (DL.m === 'part' || DL.m === 'order') tick('convo'); save(); view = 'done'; sectionDone('Conversation done', '+' + xp + ' XP · ' + esc(d.title)); };
  if (DL.m === 'read') {
    $('#app').innerHTML = `${head}<div class="ex"><div class="label">${esc(d.title)}</div><div class="chat">${d.lines.slice(0, DL.i + 1).map((l, j) => bubble(d, l, j, { note: true })).join('')}</div></div><div class="foot" id="foot"></div>`;
    foot(DL.i < n - 1 ? `<button class="btn primary block" id="nx">Next line</button>` : `<button class="btn primary block" id="nx">Done. Now play your part</button>`);
    $('#nx').onclick = () => { if (DL.i < n - 1) { DL.i++; render(); lineSay(d.lines[DL.i][1]); } else { DL = { d, m: 'part', i: 0, show: {}, right: 0 }; render(); } };
    if (DL.i === 0 && !DL.spoke) { DL.spoke = 1; lineSay(d.lines[0][1]); }
  } else if (DL.m === 'part') {
    if (DL.i >= n) { $('#app').innerHTML = `${head}<section class="panel summary"><div class="label">Conversation done</div><h1 style="font-size:2rem;color:var(--sea)">Maayo kaayo!</h1><p class="muted">${DL.right} of ${d.lines.filter(l => l[0] === 'b').length} of your lines said right.</p><button class="btn primary block" id="fin">Continue</button></section>`; $('#fin').onclick = done; $('#quit').onclick = () => go('convos'); return; }
    const l = d.lines[DL.i], mine = l[0] === 'b';
    $('#app').innerHTML = `${head}<div class="ex"><div class="chat">${d.lines.slice(0, DL.i).map((x, j) => bubble(d, x, j)).join('')}${mine ? '' : bubble(d, l, DL.i)}</div>
      ${mine ? `<div class="panel"><div class="label">Your turn. Say it in Bisaya</div><div class="prompt">${esc(l[2])}</div>${l[3] ? `<div class="small muted">Hint: ${esc(l[3])}</div>` : ''}<div id="micw"></div><div id="res"></div></div>` : ''}</div><div class="foot" id="foot"></div>`;
    wireBubbles(d);
    const adv = () => { DL.i++; render(); };
    if (!mine) { foot(`<button class="btn primary block" id="nx">Next</button>`); $('#nx').onclick = adv; if (DL.spoke !== 'p' + DL.i) { DL.spoke = 'p' + DL.i; lineSay(l[1]); } }
    else if (hasAI()) {
      foot(`<button class="btn ghost block" id="skip">Show me the line</button>`);
      $('#skip').onclick = () => { Rec.cancel(); $('#res').innerHTML = `<div class="corr">${esc(l[1])}</div>`; foot(`<button class="btn primary block" id="nx">Next</button>`); $('#nx').onclick = adv; lineSay(l[1]); };
      micWidget($('#micw'), async rec => {
        try {
          const r = await gradeSay({ id: 'dl', ceb: l[1], en: l[2], audio: false }, rec); absorb(r);
          $('#res').innerHTML = aiFeedback(r, rec, null) + `<div class="small">The line: <b>${esc(l[1])}</b></div>`; wireCompare(rec, { audio: false });
          if (r.verdict !== 'wrong') DL.right++;
          foot(`<button class="btn primary block" id="nx">Next</button>`); $('#nx').onclick = adv;
        } catch (e) { $('#micst').textContent = gemErr(e); }
      });
    } else {
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
  $('#quit').onclick = () => go('convos');
};

/* ---------- shadowing ---------- */
let SH = null;
VIEWS.shadow = function () {
  if (!hasPack()) { toast('Load the content pack first. Shadowing uses its recordings.'); return go('home'); }
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Shadowing</h2></div>
  <section class="panel"><p style="margin:0">Each phrase plays three times: once to listen, then twice to speak along, the last at ${Math.max(1.1, S.speed).toFixed(1)}×. Hands-free, so it works with headphones on a walk.</p></section>
  <section class="panel">${UNITS.map((u, i) => `<div class="unit"><div class="nm"><b>${esc(u.ceb)}</b> <span class="muted small">${esc(u.name)} · ${u.ids.length}</span></div><button class="btn sm primary" data-u="${i}">Start</button></div>`).join('')}</section>`;
  $('#quit').onclick = () => go('home');
  document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => runShadow(UNITS[+b.dataset.u]));
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
    $('#quit').onclick = () => { SH.tok = 0; stopAudio(); go('home'); };
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

/* ---------- pronunciation drill ---------- */
let PR = null;
VIEWS.pron = function () {
  if (!hasPack()) { toast('Load the content pack first. Pronunciation uses its recordings.'); return go('home'); }
  if (!hasAI()) { toast('Add your Gemini key in Settings to get scored.'); return go('settings'); }
  if (!PR) { let pool = Object.keys(S.cards).filter(id => id[0] === 'p'); if (pool.length < 8) pool = pool.concat(PHRASE_ORDER.slice(0, 30)); PR = { list: shuffle([...new Set(pool)]).slice(0, 10), i: 0, scores: [] }; }
  if (PR.i >= PR.list.length) {
    const avg = PR.scores.length ? Math.round(PR.scores.reduce((a, b) => a + b, 0) / PR.scores.length) : 0;
    $('#app').innerHTML = `<section class="panel summary"><div class="label">Pronunciation done</div><h1 style="font-size:2rem;color:var(--sea)">Maayo!</h1><div class="sumgrid"><div><b class="tnum">${avg}</b><span class="small muted">average</span></div><div><b class="tnum">${PR.scores.length}</b><span class="small muted">phrases</span></div><div><b class="tnum">${Math.max(0, ...PR.scores)}</b><span class="small muted">best</span></div></div>${(PR.scores.length && tick('pron'), cameoHtml('done') + binkoSays(planNext() ? BINKO_NEXT[planNext().k] : BINKO_NEXT.done) + nextBtnHtml())}<button class="btn ghost block" id="home">Home</button></section>`;
    PR = null; wireNext(); $('#home').onclick = () => go('home'); return;
  }
  const c = card(PR.list[PR.i]);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><div class="prog"><i style="width:${PR.i / PR.list.length * 100}%"></i></div><span class="speedchip tnum">${PR.i + 1}/${PR.list.length}</span></div>
  <div class="ex"><div class="label">Listen, then say it the same way</div><div class="ceb">${esc(c.ceb)}</div><div class="muted">${esc(c.en)}</div>
  <div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><button class="play sm slow" id="pls" aria-label="Play slower">${I.slow}</button></div>
  <div id="micw"></div><div id="res"></div></div><div class="foot"><button class="btn primary block" id="nx">Next phrase</button></div>`;
  $('#quit').onclick = () => { PR = null; go('home'); };
  wirePlay(c, 1);
  $('#nx').onclick = () => { PR.i++; render(); };
  micWidget($('#micw'), async rec => {
    try { const r = await gradePron(c, rec); PR.scores.push(Math.round(+r.score || 0)); addXP(4); save(); $('#res').innerHTML = aiFeedback(r, rec, c); wireCompare(rec, c); $('#micst').textContent = 'Try again any time to improve the score.'; }
    catch (e) { $('#micst').textContent = gemErr(e); }
  });
};

/* ---------- voice tutor ---------- */
const TOPICS = ['Your day so far', 'What you ate today', 'Family news', 'Weekend plans', 'Your work', 'Family and where they come from', 'Shopping at the palengke', 'Practice my weak spots'];
let TU = null;
function tutorStart(topic) { TU = { topic, msgs: [], busy: false, turns: 0 }; view = 'tutor'; render(); tutorTurn(null); }
function tutorSystem() {
  const weak = weakList(6), gaps = S.custom.slice(-10);
  return `${learnerText()}
You are the learner's Bisaya conversation tutor: a friendly native Cebuano speaker from Cebu. You are talking OUT LOUD; they hear your reply as audio.
Topic: ${TU.topic}.
${weak.length ? 'Their recurring mistakes (steer the conversation so they have to use these correctly): ' + weak.map(([k, v]) => k + ' (fix: ' + v.fix + ')').join('; ') + '.' : ''}
${gaps.length ? 'Words they keep saying in English (ask questions that make them use the Bisaya): ' + gaps.map(g => g.en + ' = ' + g.ceb).join(', ') + '.' : ''}
Rules for your reply: only everyday Cebuano as people in Cebu really talk (loanwords Cebuanos really use are fine); 1 to 3 short sentences at low-intermediate level; always end with one question they must answer; react to what they actually said.`;
}
async function tutorTurn(rec) {
  TU.busy = true; drawTutor();
  const hist = TU.msgs.map(m => (m.role === 'me' ? 'Learner: ' + (m.heard || '') : 'Tutor: ' + m.text)).join('\n');
  const parts = rec
    ? [{ text: (hist ? 'Conversation so far:\n' + hist + '\n\n' : '') + "The learner's new spoken turn is this recording:" }, recPart(rec), { text: `Return JSON only:
{"heard": "exactly what the learner said, word for word, including any English",
 "reply": "your spoken reply in Bisaya",
 "reply_en": "English translation of your reply",
 "fixed": "how a Cebuano would naturally say what they meant, all in Bisaya; \\"\\" if they already said it naturally",
 "english_words": [{"en": "English word they used", "ceb": "Bisaya equivalent"}],
 ${mistakeRules()},
 "pron_note": "one short note on a sound they mispronounced, or \\"\\""}` }]
    : [{ text: 'Open the conversation with a short greeting and one question about the topic. Return JSON only: {"reply": "...", "reply_en": "..."}' }];
  try {
    const r = await gemJSON(parts, tutorSystem());
    if (rec) {
      absorb(r);
      TU.msgs.push({ role: 'me', heard: r.heard || '(could not make it out)', url: rec.url, fixed: r.fixed || '', swaps: r.english_words || [], mistakes: r.mistakes || [], pron: r.pron_note || '' });
      TU.turns++; addXP(5);
      if (TU.turns >= 5 && !planDay().talk) { tick('talk'); TU.justDone = true; }
      save();
    }
    const m = { role: 'tutor', text: r.reply || '…', en: r.reply_en || '', showEn: false, url: null };
    TU.msgs.push(m); TU.busy = false; drawTutor();
    const u = await tts(m.text); if (u) { m.url = u; drawTutor(); if (view === 'tutor') playUrl(u, 1); }
  } catch (e) { TU.busy = false; drawTutor(); toast(gemErr(e)); }
}
VIEWS.tutor = function () {
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Tutor</h2>${TU ? '<button class="btn sm ghost" id="newt">New topic</button>' : ''}</div><div id="tbody"></div>`;
  $('#quit').onclick = () => { Rec.cancel(); go('home'); };
  if ($('#newt')) $('#newt').onclick = () => { TU = null; render(); };
  if (!hasAI()) { $('#tbody').innerHTML = `<section class="panel"><p style="margin:0">The Tutor needs a Gemini API key so it can hear you.</p><button class="btn primary" data-go="settings">Add key</button></section>`; document.querySelector('[data-go]').onclick = () => go('settings'); return; }
  if (!TU) {
    $('#tbody').innerHTML = `<section class="panel"><p style="margin:0">A spoken conversation in Bisaya. Tap the mic, answer out loud, tap again. The Tutor replies by voice, shows what it heard, gives you the natural way to say it, and remembers the mistakes you repeat.</p>
      <p class="muted small" style="margin:0">Use headphones so the Tutor's voice doesn't feed back into your mic. Its Bisaya and its grading are good but not a native speaker's, so check anything odd with family.</p></section>
      <section class="panel"><div class="label">Pick a topic</div><div class="chips">${TOPICS.map(t => `<button class="chip" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></section>`;
    document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => tutorStart(b.dataset.t));
    return;
  }
  drawTutor();
};
function drawTutor() {
  const body = $('#tbody'); if (!body || view !== 'tutor') return;
  body.innerHTML = `${TU.justDone ? `<section class="banner" style="margin-bottom:10px"><b>Talk ticked for today.</b> Keep going, or move on.${nextBtnHtml('tnext')}</section>` : ''}<div class="small muted" style="margin-bottom:8px">Topic: ${esc(TU.topic)} · ${TU.turns} turn${TU.turns === 1 ? '' : 's'}</div>
  <div class="chat">${TU.msgs.map((m, i) => m.role === 'me'
    ? `<div class="msg me"><span class="small" style="opacity:.8">You said</span><br>${esc(m.heard)}${m.url ? `<br><button class="linkbtn" style="color:inherit" data-mine="${i}">Play yours</button>` : ''}</div>
       ${m.fixed ? `<div class="fix"><b>More natural:</b> ${esc(m.fixed)}</div>` : ''}
       ${m.swaps.length ? `<div class="fix">${m.swaps.map(s => `<b>${esc(s.en)}</b> → ${esc(s.ceb)}`).join(' · ')}<br><span class="muted">Added to Gap words</span></div>` : ''}
       ${m.mistakes.length ? `<div class="fix">${m.mistakes.map(x => `<b>${esc(x.label)}</b>: ${esc(x.fix)}`).join('<br>')}</div>` : ''}
       ${m.pron ? `<div class="fix"><b>Sound:</b> ${esc(m.pron)}</div>` : ''}`
    : `<div class="msg them">${esc(m.text)}<div class="tr" ${m.showEn ? '' : 'hidden'}>${esc(m.en)}</div>
       <div class="row" style="margin-top:6px;gap:12px">${m.url ? `<button class="linkbtn" data-say="${i}">Play</button><button class="linkbtn" data-slow="${i}">Slower</button>` : ''}<button class="linkbtn" data-en="${i}">${m.showEn ? 'Hide' : 'Show'} English</button></div></div>`).join('')}
    ${TU.busy ? '<div class="msg them muted">Naminaw… (listening)</div>' : ''}</div>
  <div class="foot" style="margin-top:12px"><div id="micw"></div></div>`;
  body.querySelectorAll('[data-en]').forEach(b => b.onclick = () => { const m = TU.msgs[+b.dataset.en]; m.showEn = !m.showEn; drawTutor(); });
  body.querySelectorAll('[data-say]').forEach(b => b.onclick = () => playUrl(TU.msgs[+b.dataset.say].url, 1));
  body.querySelectorAll('[data-slow]').forEach(b => b.onclick = () => playUrl(TU.msgs[+b.dataset.slow].url, 0.8));
  body.querySelectorAll('[data-mine]').forEach(b => b.onclick = () => playUrl(TU.msgs[+b.dataset.mine].url, 1));
  wireNext('tnext');
  if (!TU.busy) micWidget($('#micw'), async rec => { await tutorTurn(rec); }, 40);
  else $('#micw').innerHTML = '<div class="small muted">Waiting for the Tutor…</div>';
  const last = body.querySelector('.chat > :last-child'); if (last && TU.msgs.length > 1) last.scrollIntoView({ block: 'nearest' });
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
  <section class="panel"><p style="margin:0">Every time you reach for an English word mid-sentence, it belongs here. Words the Tutor catches are added automatically. They become flashcards you practice out loud.</p>
  <label class="label" for="gen">The word or phrase you said in English</label><input class="field" id="gen" placeholder="e.g. appointment, I'm running late">
  <label class="label" for="gceb">Bisaya (leave blank to ask Gemini)</label><input class="field" id="gceb" placeholder="Optional">
  <div class="row"><button class="btn primary" id="gadd">Add</button><span class="muted small" id="gmsg"></span></div></section>
  <section class="panel"><div class="row spread"><h2>Your list</h2><span class="muted small tnum">${S.custom.length}</span></div>
  <div>${S.custom.length ? S.custom.slice().reverse().map(x => `<div class="gap"><div style="min-width:0"><span class="c">${esc(x.ceb)}</span> <span class="muted">· ${esc(x.en)}</span>${x.ex ? `<div class="small">${esc(x.ex)} <span class="muted">${esc(x.exEn)}</span></div>` : ''}</div><button class="btn sm ghost" data-del="${x.id}">Remove</button></div>`).join('') : '<p class="muted" style="margin:0">Nothing yet.</p>'}</div></section>`;
  $('#quit').onclick = () => go('home');
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (b.dataset.armed) { S.custom = S.custom.filter(x => x.id !== b.dataset.del); delete S.cards[b.dataset.del]; save(); render(); } else { b.dataset.armed = 1; b.textContent = 'Tap to confirm'; } });
  $('#gadd').onclick = async () => {
    const en = $('#gen').value.trim(), ceb = $('#gceb').value.trim(); if (!en) return;
    if (ceb) { addGap(en, ceb) ? render() : ($('#gmsg').textContent = 'Already on your list.'); return; }
    if (!hasAI()) { $('#gmsg').textContent = 'Type the Bisaya yourself, or add a Gemini key in Settings.'; return; }
    $('#gadd').disabled = true; $('#gmsg').textContent = 'Looking it up…';
    try {
      const r = await gemJSON([{ text: `${learnerText()}\nThe learner keeps saying "${en}" in English when speaking Bisaya. Give what Cebuanos in Cebu would naturally say instead (a common loanword is fine if that's what people really say) and one short everyday example. JSON only: {"ceb": "...", "example": "...", "example_en": "..."}` }]);
      if (addGap(en, r.ceb, r.example, r.example_en)) render(); else { $('#gmsg').textContent = 'Already on your list.'; $('#gadd').disabled = false; }
    } catch (e) { $('#gmsg').textContent = gemErr(e); $('#gadd').disabled = false; }
  };
};

/* ---------- boot ---------- */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === ' ' && micWidget.current && micWidget.current.isConnected) { e.preventDefault(); micWidget.current.click(); return; }
  if (view !== 'session' && view !== 'speedrun') return;
  if (/^[1-4]$/.test(e.key)) { const b = document.querySelectorAll('.opt')[+e.key - 1]; if (b && !b.disabled) b.click(); }
  if (e.key === 'Enter') { const b = $('#chk:not([disabled])') || $('#cont'); if (b && document.activeElement !== b) { e.preventDefault(); b.click(); } }
  if (e.key === ' ' && $('#pl') && !$('#pl').disabled) { e.preventDefault(); $('#pl').click(); }
});
initSync();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
render();
loadStoredPack().then(ok => { if (ok) { if (view === 'home') render(); } else autoPack(); });
