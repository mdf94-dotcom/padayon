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
function setPack(h, pbuf, wbuf) {
  P = h.P; W = h.W; UNITS = h.UNITS; IDX = h.IDX; SPR.p = pbuf; SPR.w = wbuf;
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
function fresh() { return { v: 1, updated: 0, cards: {}, xp: {}, streak: { last: 0, count: 0, best: 0 }, speed: 1.0, bestSpeed: 1.0, settings: { newPerDay: 8, newP: 4, newW: 4, newG: 2, newF: 3, newD: 2, newM: 3, learner: 'all', goal: 60 }, focus: null, custom: [], plan: {}, newDay: { d: 0, n: 0 }, nextC: 1, mistakes: {}, tips: {} }; }
function migrate(s) { const f = fresh(); s = Object.assign(f, s || {}); s.settings = Object.assign(fresh().settings, s.settings || {}); s.streak = Object.assign(fresh().streak, s.streak || {}); s.mistakes = s.mistakes || {}; s.tips = s.tips || {}; if (s.planResetV !== 2) { s.planResetV = 2; s.plan = {}; }
  if (!s.settings.pathV) { s.settings.pathV = 1; s.settings.newPerDay = 8; }
  if (s.settings.learner !== 'all') { s.settings.learner = 'all'; s.settings.newF = Math.max(3, s.settings.newF || 0); } return s; }
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
  out.convoDone = {}; [a.convoDone || {}, b.convoDone || {}].forEach(x => Object.keys(x).forEach(k => out.convoDone[k] = Math.max(out.convoDone[k] || 0, x[k])));
  out.realDone = {}; [a.realDone || {}, b.realDone || {}].forEach(x => Object.keys(x).forEach(k => out.realDone[k] = Math.max(out.realDone[k] || 0, x[k])));
  out.updated = Math.max(a.updated || 0, b.updated || 0);
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
function addXP(n) { const t = today(); S.xp[t] = (S.xp[t] || 0) + n; }
function bumpStreak() { const t = today(); const s = S.streak; if (s.last === t) return; s.count = s.last === t - 1 ? s.count + 1 : 1; s.last = t; s.best = Math.max(s.best, s.count); }
function streakNow() { const s = S.streak, t = today(); return (s.last === t || s.last === t - 1) ? s.count : 0; }
function planDay() { const t = today(); if (!S.plan[t]) S.plan = { [t]: {} }; return S.plan[t]; }
/* Today's plan is every activity, in order. The hero ring fills as they tick, and finishing one offers the next. */
function planItems() {
  return [
    { k: 'session', name: 'Daily session', d: 'Reviews, new words, and building blocks.', run: () => startSession() },
    pickDialog() || planDay().convo ? { k: 'convo', name: "Today's conversation", d: 'New words first, then read it and say your part out loud.', run: () => go('convos') } : (() => { const n = nextConvo(); return { k: 'convo', locked: true, name: "Today's conversation", d: `Locked for now, so it counts as done. "${n.d.title}" opens after you learn ${n.left.length} more word${n.left.length === 1 ? '' : 's'} in your daily sessions.` }; })(),
    buildLock() ? { k: 'build', locked: true, name: 'Build sentences', d: 'Locked for now, so it counts as done. ' + buildLock() } : { k: 'build', name: 'Build sentences', d: 'Make your own sentences from words you know, using the sentence rules.', run: () => startBuild() },
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
    username: '🔧✨ Binko-SR157 ✨🔧', avatar_url: new URL('icon-512.png?v=face', location.href).href,
    embeds: [{ color: [0x34b8a3, 0xf2a7c3, 0xf0e278, 0x6cc4ee, 0xc9824a][Math.floor(Math.random() * 5)],
      author: { name: '🌈🤖 BINKO-SR157 · Lucky Clover Field Log 🍀⚙️', icon_url: new URL('img/binko-face.webp?v=2', location.href).href },
      footer: { text: '💛 Adventurer & Creator Binko · Bink bink! 🩵' }, description: `${lines[Math.floor(Math.random() * lines.length)]} **${who}** finished today's Bisaya lesson!\n🔥 Streak: **${n} day${n === 1 ? '' : 's'}**${n >= 7 && n % 7 === 0 ? ' · a whole week! SUPER DUPER!' : ''}` }]
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
  if (k === 'd') { const [di, li] = id.slice(1).split('_').map(Number), d = DIALOGS[di], l = d && d.lines[li]; return l && { id, kind: 'd', ceb: l[1], en: l[2], note: l[3] || '', audio: false, convo: d.title }; }
  if (k === 'm') return MEGA[n] && { id, kind: 'm', ceb: MEGA[n][0], en: MEGA[n][1], audio: false };
  if (k === 'e') return EXTRA[n] && { id, kind: 'p', ceb: EXTRA[n][0], en: EXTRA[n][1], note: EXTRA[n][2], audio: false };
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
function newAllowance() { const t = today(); if (S.newDay.d !== t) S.newDay = { d: t, n: 0 }; return Math.max(0, (S.settings.newPerDay || 8) - S.newDay.n); }
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
    const add = (ids, front) => { ids = ids.filter(id => !used.has(id)); ids.forEach(id => used.add(id)); if (ids.length) lists.push({ ids, front }); };
    // [start, span] within the stage: building blocks and set phrases open it, frequency words start a little later,
    // conversation lines come once some of their words are in
    add(st.f.flatMap(i => (F_UNITS[i] || { ids: [] }).ids), [0, 0.6]);
    add(st.p.flatMap(i => (UNITS[i] || { ids: [] }).ids).concat(st.e.map(i => 'e' + i)), [0, 0.85]);
    add(st.g.flatMap(i => (GRAM_UNITS[i] || { ids: [] }).ids), [0.05, 0.8]);
    add(st.m[0] === '*' ? M_ORDER.slice() : st.m.flatMap(mUnit).flatMap(u => u.ids), [0.04, 0.96]);
    add(st.d.flatMap(i => (DIALOGS[i] ? DIALOGS[i].lines.map((_, j) => 'd' + i + '_' + j) : [])), [0.3, 0.7]);
    add(W.slice(st.w[0], st.w[1]).map((_, j) => 'w' + (st.w[0] + j)), [0.12, 0.88]);
    // spread each source evenly through the stage
    const keyed = lists.flatMap(l => l.ids.map((id, i) => [l.front[0] + ((i + 0.5) / l.ids.length) * l.front[1], id]));
    keyed.sort((x, y) => x[0] - y[0]);
    return Object.assign({}, st, { ids: keyed.map(x => x[1]) });
  });
  // anything not placed yet goes into the last stage, so nothing is ever left out
  const rest = [...F_ORDER, ...GRAM_ORDER, ...D_ORDER, ...PHRASE_ORDER, ...E_ORDER, ...W.map((_, i) => 'w' + i), ...M_ORDER].filter(id => !used.has(id));
  PATH[PATH.length - 1].ids.push(...rest);
}
buildPath();
const stageStats = st => { const ids = st.ids.filter(id => card(id)); const l = learned(ids), sn = seen(ids); return { total: ids.length, learned: l, seen: sn, frac: ids.length ? l / ids.length : 1 }; };
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
      return `<div class="stage-row ${st8}"><div class="stage-dot">${i < cur ? I.check : i + 1}</div><div style="min-width:0;flex:1"><div class="row spread" style="gap:6px"><b>${esc(st.ceb)} · ${esc(st.name)}</b><span class="muted small">${esc(st.level)}</span></div>
        <div class="bar" style="margin:6px 0 4px"><i style="width:${y.frac * 100}%"></i></div>
        <div class="muted small">${y.learned} of ${y.total} learned · ${i < cur ? 'done' : i === cur ? (tl[i] ? 'expected around ' + dateIn(tl[i]) : '') : 'opens around ' + dateIn(tl[i - 1] || 0)}</div></div></div>`; }).join('')}</div>
    <p class="muted small" style="margin:0">Dates assume you finish the daily session every day. A stage opens once ${Math.round(PATH_GATE * 100)}% of the one before it is learned, so you never move on before you've got it.</p></section>`;
}
function pickNew() {
  let left = newAllowance(); const out = [];
  const take = (order, max) => { let n = Math.min(max, left); for (const id of order) { if (n <= 0) break; if (!S.cards[id] && !out.includes(id) && card(id)) { out.push(id); n--; left--; } } };
  take(S.custom.map(c => c.id), 3);
  // a unit the learner chose to focus on comes first, as long as its stage is open
  const { cur } = pathState(), open = PATH.slice(0, cur + 1).flatMap(st => st.ids), openSet = new Set(open);
  if (S.focus) { const map = { f: F_UNITS, g: GRAM_UNITS, u: UNITS, k: WORD_UNITS, m: M_UNITS }, u = (map[S.focus[0]] || [])[+S.focus.slice(1)]; if (u) take(u.ids.filter(id => openSet.has(id)), left); }
  take(open, left);
  return out;
}
function exType(id, isNew) {
  const c = card(id), b = isNew ? 0 : (S.cards[id] ? S.cards[id].b : 0);
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
  q.forEach(x => { if (x.type === 'say' || x.type === 'pron') x.type = 'speak'; });
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
  player.pause(); if (player.src !== u) player.src = u; try { player.currentTime = 0; } catch (e) { } player.playbackRate = rate || 1; player.preservesPitch = true;
  if (btn) btn.classList.add('playing');
  await new Promise(res => { player.onended = res; player.onerror = res; player.onpause = res; player.play().then(() => { player.playbackRate = rate || 1; }).catch(res); });
  if (btn && tok === playToken) btn.classList.remove('playing');
}
const play = (id, rate, btn) => playUrl(clipUrl(id), rate, btn);
function stopAudio() { playToken++; player.pause(); }

function weakList(n = 6) { return Object.entries(S.mistakes || {}).sort((a, b) => b[1].n - a[1].n).slice(0, n); }
/* ---------- views ---------- */
let view = 'home';
const VIEWS = {};
function render() { stopAudio(); clearInterval(timerH); (VIEWS[view] || VIEWS.home)(); window.scrollTo(0, 0); }
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
  const items = planItems(), nextUp = planNext(), doneN = items.filter(i => isDone(i, plan)).length;
  const weak = weakList(5);
  $('#app').innerHTML = `
  <div class="top"><div class="brand"><h1>Padayon</h1><span class="muted small">Bisaya with the Lucky Clovers</span></div>
    <div class="stats"><span class="stat tnum" title="Day streak"><span class="flame">${I.flame}</span>${streakNow()}</span><span class="stat tnum" title="Listening speed"><span class="flame">${I.bolt}</span>${S.speed.toFixed(1)}×</span></div></div>
  ${!hasPack() ? `<section class="banner"><b>Finish setting up</b>
    ${!hasPack() ? (packState === 'loading' ? `<div class="small">Downloading 225 phrases and 1,002 words with native recordings… <b id="packpct">${packPct}%</b> (about 10 MB, one time only)</div>` : `<div class="small">${packState === 'error' ? "The phrases and recordings didn't download. Check your connection and try again." : 'Phrases and recordings are not loaded yet.'}</div><button class="btn primary" id="packretry">Download phrases and recordings</button>`) : ''}
</section>` : ''}
  <section class="hero">
    <div class="hero-guide">${binkoSays(BINKO_NEXT[nextUp ? nextUp.k : 'done'], true)}</div>
    <div><div class="label" style="color:inherit;opacity:.8">Karon nga adlaw · Today</div><h2>${nextUp ? 'Next up: ' + esc(nextUp.name) : 'All done today. Padayon!'}</h2>
      <p>${nextUp ? esc(nextUp.k === 'session' ? due + ' review' + (due === 1 ? '' : 's') + ' due · ' + nw + ' new · about ' + Math.max(5, Math.round((Math.min(due, 16) + nw * 2 + 2) * 0.6)) + ' min' : nextUp.d) : xp + ' XP today. Come back tomorrow, or do another session.'}</p></div>
    <div class="ringwrap plandone">${ringSvg(doneN, items.length)}<span class="ringtxt tnum">${doneN}<small>of ${items.length}</small></span></div>
    <div class="hero-actions">${nextUp ? (nextUp.manual ? `<button class="btn" id="start">I did it</button>` : `<button class="btn" id="start">Start ${esc(nextUp.name.toLowerCase())}</button>`) : `<button class="btn" id="start">Do another session</button>`}</div>
  </section>
  <section class="panel"><div class="row spread"><h2>Today's plan</h2><span class="muted small tnum">${doneN} of ${items.length}</span></div>
    <div class="bar" style="grid-column:auto"><i style="width:${doneN / items.length * 100}%"></i></div>
    <div>${items.map(it => `<div class="check"><button class="box ${isDone(it, plan) ? 'on' : ''}" data-plan="${it.k}" ${it.manual ? '' : 'disabled title="Ticks itself when you finish"'} aria-label="${esc(it.name)}">${isDone(it, plan) ? I.check : ''}</button><div style="flex:1;min-width:0"><b>${esc(it.name)}${it.locked ? ' 🔒' : ''}</b><span class="muted small">${esc(it.d)}</span></div>${!isDone(it, plan) && !it.manual ? `<button class="btn sm ghost" data-run="${it.k}">Go</button>` : ''}</div>`).join('')}</div></section>
  ${pathPanel()}
  <section class="drills">
    <button class="drill" data-go="speed"><span class="label">Listening</span><span class="big tnum">${S.speed.toFixed(1)}×</span><b>Speed round</b><span class="muted small">Clips get faster as you get them right.</span></button>
    <button class="drill" id="dictgo"><span class="label">Fast speech</span><span class="big">Dictation</span><b>Type what you hear</b><span class="muted small">Catch every little word.</span></button>
    <button class="drill" data-go="shadow"><span class="label">Fluency</span><span class="big">Shadow</span><b>Speak along</b><span class="muted small">Hands-free. Repeat with the speaker.</span></button>
    <button class="drill" data-go="convos"><span class="label">Chaining</span><span class="big">Istorya</span><b>Today's conversation</b><span class="muted small">Picked to match what you know. Play your part out loud.</span></button>
    <button class="drill" id="buildgo"><span class="label">Grammar</span><span class="big">Himo</span><b>Build sentences</b><span class="muted small">Your own sentences from words you know.</span></button>
    <button class="drill" data-go="rules"><span class="label">Grammar</span><span class="big">${RULES.length}</span><b>Sentence rules</b><span class="muted small">Where ko goes, dili vs wala, mo- vs ni-, and more.</span></button>
    <button class="drill" data-go="real"><span class="label">Real life</span><span class="big">Tinuod</span><b>Real Bisaya</b><span class="muted small">Tweets and show clips, once you know the words.</span></button>
    <button class="drill" data-go="gaps"><span class="label">Your words</span><span class="big tnum">${S.custom.length}</span><b>Gap words</b><span class="muted small">English you keep reaching for.</span></button>
  </section>
  ${weak.length ? `<section class="panel"><h2>Your weak spots</h2><div>${weak.map(([k, v]) => `<div class="weak"><span class="n tnum">${v.n}×</span><div style="min-width:0"><b>${esc(k)}</b><div class="small muted">${esc(v.fix)}</div></div></div>`).join('')}</div></section>` : ''}
  <section class="panel"><details><summary><b>Browse every unit</b> <span class="muted small">· jump ahead with Focus</span></summary><div style="display:grid;gap:12px;margin-top:10px">
  <div class="panel"><div class="row spread"><h2>Foundations</h2><span class="muted small tnum">${learned(F_ORDER)} of ${F.length} learned</span></div>
    <p class="muted small" style="margin:0">How words fit together: who, whose, have, like, questions, and when. Each block comes with sentences you build yourself.</p>
    <div>${F_UNITS.map((u, i) => unitRow(u, 'f' + i)).join('')}</div></div>
  <div class="panel"><div class="row spread"><h2>How Bisaya really works</h2><span class="muted small tnum">${learned(GRAM_ORDER)} of ${G.length} learned</span></div>
    <p class="muted small" style="margin:0">Shortcuts, little words, and verb endings that make fast speech hard to follow.</p>
    <div>${GRAM_UNITS.map((u, i) => unitRow(u, 'g' + i)).join('')}</div></div>
  ${hasPack() ? `<div class="panel"><div class="row spread"><h2>Phrases</h2><span class="muted small tnum">${learned(PHRASE_ORDER)} of ${PHRASE_ORDER.length} learned</span></div>
    <p class="muted small" style="margin:0">Tap Focus to pull a unit's phrases to the front.</p><div>${UNITS.map((u, i) => unitRow(u, 'u' + i)).join('')}</div></div>
  <div class="panel"><details><summary>Common words <span class="muted small tnum">· ${learned(W.map((_, i) => 'w' + i))} of ${W.length} learned</span></summary>
    <div style="margin-top:8px">${WORD_UNITS.map((u, i) => unitRow(u, 'k' + i)).join('')}</div></details></div>
  <div class="panel"><details><summary>Mega-deck topics <span class="muted small tnum">· ${learned(M_ORDER)} of ${M_ORDER.length} learned</span></summary>
    <p class="muted small" style="margin:8px 0 0">From the Cebuano Mega-Deck: Peace Corps phrases, everyday sayings, numbers, family, food, body, home and more. Tap Focus to study a topic first.</p>
    <div style="margin-top:8px">${M_UNITS.map((u, i) => unitRow(u, 'm' + i)).join('')}</div></details></div>` : ''}
  </div></details></section>
  <section class="panel"><div class="row spread"><h2>Sync across devices</h2><button class="btn sm ${Sync.user ? 'ghost' : 'primary'} syncbtn" id="synchome">${Sync.user ? 'Sign out' : 'Sign in with Google'}</button></div>
    <p class="small syncline" style="margin:0">${syncLine()}</p><p class="muted small" style="margin:0">Sign in with the same Google account on your phone and PC and your progress follows you.</p></section>
  <section class="panel"><div class="row spread"><h2>Settings</h2><button class="btn sm ghost" data-go="settings">Open</button></div>
    <p class="muted small" style="margin:0">Your name, cards per day, sync, and backups.</p></section>`;
  $('#start').onclick = () => { if (!nextUp) return startSession(); if (nextUp.manual) { tick(nextUp.k); return render(); } nextUp.run(); };
  document.querySelectorAll('[data-run]').forEach(b => b.onclick = () => planItems().find(i => i.k === b.dataset.run).run());
  $('#dictgo').onclick = startDictation; $('#buildgo').onclick = startBuild;
  $('#synchome').onclick = () => Sync.user ? signOutSync() : signIn();
  if ($('#packretry')) $('#packretry').onclick = autoPack;
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  document.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => { const p = planDay(); p[b.dataset.plan] = !p[b.dataset.plan]; save(); render(); });
  document.querySelectorAll('[data-focus]').forEach(b => b.onclick = () => { S.focus = S.focus === b.dataset.focus ? null : b.dataset.focus; save(); render(); toast(S.focus ? 'New cards will come from this unit first' : 'Back to the normal order'); });
};
VIEWS.settings = function () {
  const st = S.settings;
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Settings</h2></div>
  <section class="panel"><h2>Your name</h2>
    <p class="small" style="margin:0">Binko uses this when he announces your finished lessons in the family Discord.</p>
    <div class="keybox"><input class="field" id="myname" placeholder="${esc(displayName())}" value="${esc(S.settings.name || '')}"><button class="btn primary" id="savename">Save</button></div></section>
  <section class="panel"><h2>Daily cards</h2>
    ${[['newPerDay', 'New cards per day', [5, 8, 10, 15]], ['goal', 'Daily XP goal', [30, 60, 100, 150]]].map(([f, l, opts]) => `<div><div class="label">${l}</div><div class="seg" data-set="${f}">${opts.map(n => `<button class="${st[f] === n ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div></div>`).join('')}
    <p class="muted small" style="margin:0">8 a day is about 15 to 20 minutes with reviews. More moves you along the path faster but makes reviews pile up.</p></section>
  <section class="panel"><h2>Content pack</h2><p class="small" style="margin:0">${hasPack() ? `Loaded: ${P.length} phrases and ${W.length} words with recordings.` : 'Not loaded yet.'}</p><div class="row"><button class="btn ${hasPack() ? 'ghost' : 'primary'}" id="pack3">${hasPack() ? 'Download again' : 'Download now'}</button><button class="btn ghost" id="pack2">Load from a file</button></div></section>
  <section class="panel"><h2>Sync across devices</h2>
    <p class="small syncline" style="margin:0">${syncLine()}</p>
    <div class="row"><button class="btn ${Sync.user ? 'ghost' : 'primary'} syncbtn" id="syncset">${Sync.user ? 'Sign out' : 'Sign in with Google'}</button></div>
</section>
  <section class="panel"><h2>Backup file</h2>
    <p class="small" style="margin:0">A manual copy of your progress, if you ever want one.</p>
    <div class="row"><button class="btn" id="exp">Save backup file</button><button class="btn ghost" id="imp">Load backup</button></div></section>
`;
  $('#quit').onclick = () => go('home');
  $('#syncset').onclick = () => Sync.user ? signOutSync() : signIn();
  $('#savename').onclick = () => { S.settings.name = $('#myname').value.trim(); save(); toast('Saved'); };
  document.querySelectorAll('[data-set]').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => { S.settings[g.dataset.set] = +b.dataset.v; save(); render(); }));
  $('#pack2').onclick = importPack; $('#pack3').onclick = () => { go('home'); autoPack(); };
  $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'padayon-progress-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); };
  $('#imp').onclick = () => { const fi = $('#filein'); fi.accept = '.json,application/json'; fi.value = ''; fi.onchange = async () => { try { const s = JSON.parse(await fi.files[0].text()); if (s.v !== 1) throw 0; S = migrate(s); save(); toast('Progress loaded'); go('home'); } catch (e) { toast('That is not a Padayon backup file.'); } }; fi.click(); };
};

/* ---------- session engine ---------- */
let Q = [], qi = 0, sess = null, timerH = null;
const newSess = mode => ({ xp: 0, right: 0, total: 0, graded: new Set(), requeued: new Set(), newIds: new Set(), mode, peak: S.speed });
function startSession() { Q = buildSession(); qi = 0; sess = newSess('daily'); go('session'); }
/* The Daily Practice home calls this to start today's session; it does nothing until the content pack is loaded. */
window.startFromHome = () => { try { if (P && P.length && view !== 'session') startSession(); } catch (e) { } };
function startDictation() {
  if (!hasPack()) return toast('Load the content pack first. Dictation uses its recordings.');
  if (drillLock('dict')) { view = 'locked'; return lockedScreen('Dictation', 'dict'); }
  Q = shuffle(heardIds()).slice(0, 12).map(id => ({ id, type: 'dict' })); qi = 0; sess = newSess('dict'); go('session');
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
  if (q === 0 && !sess.requeued.has(c.id)) { sess.requeued.add(c.id); Q.push({ id: c.id, type: c.kind === 'f' || c.kind === 'd' ? 'build' : c.audio ? pick(['listen', 'mc']) : 'mc' }); }
  save();
  const f = $('#foot'); f.className = 'foot ' + (q > 0 ? 'good' : 'bad');
  f.innerHTML = `<div class="row spread"><div style="min-width:0;flex:1"><div class="verdict">${q === 2 ? 'Tama!' : q === 1 ? 'Sakto ra. Almost there.' : 'Dili pa. Not yet.'}</div>
  <div class="ans"><span>${esc(c.ceb)}</span> <span class="muted" style="font-weight:400">· ${esc(c.en)}</span></div>${extra ? `<div class="small">${extra}</div>` : ''}${c.note && q < 2 ? `<div class="small muted">${esc(c.note)}</div>` : ''}${q < 2 && tipFor(c) ? `<div class="small"><b>Trick:</b> ${esc(tipFor(c).trick)}</div>` : ''}${q < 2 && ruleFor(c.ceb) ? `<div class="small"><b>Rule ${ruleFor(c.ceb).n}:</b> ${esc(ruleFor(c.ceb).short)}</div>` : ''}</div>
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
const taughtIds = () => Object.keys(S.cards).filter(id => card(id));
function distract(c, n, field) {
  // only cards this person has already been taught, so every option is something they've seen
  const pool = taughtIds();
  const ranked = pool.filter(id => id !== c.id).map(card).filter(Boolean).map(d => [simScore(c, d) + (d.kind === c.kind ? 3 : 0), d]).sort((x, y) => y[0] - x[0]);
  const out = [], used = new Set([norm(c[field])]);
  const ok = d => { const v = norm(d[field]); if (!v || used.has(v) || sameMeaning(c.en, d.en)) return false; used.add(v); return true; };
  // minimal-change fakes only make sense when the options are in Bisaya
  const kw = knownWords();
  if (field === 'ceb') for (const v of swapVariants(c).filter(v => tokens(v).every(t => kw.has(lowTok(t)))).slice(0, n >= 3 ? 2 : 1)) { const d = { id: 'x' + out.length, ceb: v, en: '' }; if (ok(d)) out.push(d); }
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
  const hits = P.map((x, i) => [x, i]).filter(([x, i]) => 'p' + i !== c.id && S.cards['p' + i] && tokens(x[0]).length > 1 && tokens(x[0]).map(lowTok).includes(t)).slice(0, 2);
  return hits.length ? `<div><div class="label">You'll hear it in</div>${hits.map(([x]) => `<div class="small"><b>${esc(x[0])}</b> <span class="muted">· ${esc(x[1])}</span></div>`).join('')}</div>` : '';
}
const tipFor = c => c.trick ? { trick: c.trick } : (S.tips || {})[c.id] || null;
function tipHtml(t, c) {
  if (!t) return '';
  return `<div class="panel tip"><div class="label">Binko's memory trick</div><div>${esc(t.trick || '')}</div>${t.english ? `<div class="small"><b>English link:</b> ${esc(t.english)}</div>` : ''}${t.when && !(c && c.note) ? `<div class="small"><b>When to use it:</b> ${esc(t.when)}</div>` : ''}${t.example ? `<div class="small"><b>${esc(t.example)}</b> <span class="muted">· ${esc(t.example_en || '')}</span></div>` : ''}</div>`;
}
function wireTip(c, slot, auto) {
  const el = $(slot); if (!el) return;
  const have = tipFor(c);
  if (have) { el.innerHTML = tipHtml(have, c); return; }

}

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
const EX = {
  teach(c, item) {
    sess.newIds.add(c.id);
    if (!S.cards[c.id]) { S.cards[c.id] = { b: 0, d: today() + 1, r: 0, w: 0 }; const t = today(); if (S.newDay.d !== t) S.newDay = { d: t, n: 0 }; S.newDay.n++; save(); }
    $('#ex').innerHTML = `<div class="label">${c.kind === 'c' ? 'One of your gap words' : c.kind === 'g' ? 'How Bisaya really works' : c.kind === 'f' ? 'Building block' : c.kind === 'd' ? 'Line from a conversation: ' + esc(c.convo) : 'New ' + (c.kind === 'w' ? 'word' : 'phrase')}</div>
      <div class="ceb">${esc(c.ceb)}</div><div class="prompt" style="font-weight:500">${esc(c.en)}</div>
      ${breakdown(c.ceb)}
      ${c.note ? `<div class="panel note">${castImg('binko', 'peek')}<div class="label">Binko explains · ${c.kind === 'p' || c.kind === 'w' ? 'when to use it' : 'how it fits together'}</div>${esc(c.note)}</div>` : ''}
      ${ruleChip(c.ceb)}
      ${c.combos ? `<div><div class="label">Swap in other words</div>${c.combos.map(x => `<div class="small"><b>${esc(x[0])}</b> <span class="muted">· ${esc(x[1])}</span></div>`).join('')}</div>` : ''}
      ${usedIn(c)}
      <div id="tipslot"></div>
      ${c.ex ? `<div class="panel"><b>${esc(c.ex)}</b><span class="muted small">${esc(c.exEn || '')}</span></div>` : ''}
      ${c.audio ? `<div class="playrow"><button class="play" id="pl" aria-label="Play">${I.play}</button><button class="play sm slow" id="pls" aria-label="Play slower">${I.slow}</button><span class="muted small">Say it out loud with the recording.</span></div>` : `<p class="muted small">Say it out loud twice.</p>`}`;
    if (c.audio) wirePlay(c, 1);
    wireTip(c, '#tipslot');
    sess.xp += 2; addXP(2);
    foot(`<button class="btn primary block" id="cont">Got it</button>`); $('#cont').onclick = next;
  },
  listen(c, item) { const d = distract(c, 3, 'en'); if (d.length < 2) return EX.dict(c, item); $('#ex').innerHTML = `<h2>What did you hear?</h2>${playBlock(S.speed)}<div class="opts"></div>`; wirePlay(c, S.speed); choiceEx(c, item, shuffle([c, ...d]), 'en'); },
  mc(c, item) { const d = distract(c, 3, 'ceb'); if (d.length < 2) return c.kind === 'f' || c.kind === 'd' ? EX.build(c, item) : EX.type(c, item); $('#ex').innerHTML = `<div class="label">How do you say</div><div class="prompt">${esc(c.en)}</div><div class="opts"></div>`; choiceEx(c, item, shuffle([c, ...d]), 'ceb', 'cebopt'); },
  build(c, item) {
    const combo = c.combos ? pick([[c.ceb, c.en]].concat(c.combos)) : [c.ceb, c.en];
    const cc = Object.assign({}, c, { ceb: combo[0], en: combo[1] });
    const ans = tokens(cc.ceb).map(t => t.replace(/[.,!?…]/g, '')), low = ans.map(a => a.toLowerCase());
    const kw = knownWords(), known = t => kw.has(lowTok(t)) || (c.combos || []).some(x => tokens(x[0]).map(lowTok).includes(lowTok(t)));
    const swaps = [...new Set(swapVariants(cc).flatMap(v => tokens(v).map(t => t.replace(/[.,!?…]/g, ''))))].filter(t => !low.includes(t.toLowerCase()) && known(t));
    const others = (c.combos || []).map(x => x[0]).concat(taughtIds().filter(id => id !== c.id).map(id => card(id).ceb)).flatMap(x => tokens(x).map(t => t.replace(/[.,!?…]/g, ''))).filter(t => !low.includes(t.toLowerCase()) && known(t));
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
    $('#ex').innerHTML = `<div class="label">Say it out loud in Bisaya</div><div class="prompt">${esc(c.en)}</div><div class="timer"><i id="tb"></i></div><p class="muted small" style="margin:0">${secs} seconds. The whole thing, no English. Then compare with the answer.</p><div id="rev"></div>`;
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
function finishSession() { stopAudio(); const full = qi >= Q.length; if (full && sess.mode === 'daily') { tick('session'); try{ if (window.parent !== window) window.parent.postMessage({practice:'done', app:'bisaya'}, location.origin); }catch(e){} } if (full && sess.mode === 'dict') tick('dict'); if (sess.mode === 'daily' && !full) bumpStreak(); save(); go('summary'); }
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
const heardIds = () => Object.keys(S.cards).filter(id => IDX[id] && card(id));
const DRILL_MIN = { speed: 8, dict: 6, shadow: 3 };
function drillLock(k) {
  const have = k === 'shadow' ? heardIds().filter(id => id[0] === 'p').length : heardIds().length, need = DRILL_MIN[k];
  return have >= need ? null : { need: need - have, what: k === 'shadow' ? 'phrase' : 'card' };
}
function lockedScreen(title, k) {
  const L = drillLock(k);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">${esc(title)}</h2></div>
    ${binkoSays(`${esc(title)} is still locked! Binko only uses things you've already learned. Learn ${L.need} more ${L.what}${L.need === 1 ? '' : 's'} with a recording in your daily session and it opens up.`)}`;
  $('#quit').onclick = () => go('home');
}
function startSpeed() {
  if (drillLock('speed')) return lockedScreen('Speed round', 'speed');
  let pool = shuffle(heardIds()).slice(0, 20);
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
/* One conversation a day, picked to fit what the learner already knows. Flow: new words → read and listen → your turn. */
function knownWords() {
  const k = new Set();
  Object.keys(S.cards).forEach(id => { const c = card(id); if (c) tokens(c.ceb).forEach(t => k.add(lowTok(t))); });
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
    $('#quit').onclick = () => go('home'); return;
  }
  DL = { d: p.d, idx: p.i, m: p.unknown.length ? 'learn' : 'read', i: 0, show: {}, right: 0, unknown: p.unknown };
  view = 'convo'; render();
};
const lineSay = () => { };
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
    $('#app').innerHTML = `${head}<div class="ex">${binkoSays('Today\'s conversation: <b>' + esc(d.title) + '</b>. First, the words you haven\'t met yet. Binko binks you\'ll be fine!')}
      <div class="panel"><div class="label">New words in this conversation</div>${DL.unknown.map(t => `<div class="gap"><span class="c">${esc(t)}</span><span class="small muted">${esc(glossOf(t) || 'see it in the conversation')}</span></div>`).join('')}</div></div><div class="foot" id="foot"></div>`;
    foot(`<button class="btn primary block" id="nx">Start the conversation</button>`);
    $('#nx').onclick = () => { DL.m = 'read'; DL.i = 0; render(); };
  } else if (DL.m === 'read') {
    $('#app').innerHTML = `${head}<div class="ex"><div class="label">${esc(d.title)}</div><div class="chat">${d.lines.slice(0, DL.i + 1).map((l, j) => bubble(d, l, j, { note: true })).join('')}</div></div><div class="foot" id="foot"></div>`;
    foot(DL.i < n - 1 ? `<button class="btn primary block" id="nx">Next line</button>` : `<button class="btn primary block" id="nx">Your turn: say your lines</button>`);
    $('#nx').onclick = () => { if (DL.i < n - 1) { DL.i++; render(); lineSay(d.lines[DL.i][1]); } else { DL = Object.assign(DL, { m: 'part', i: 0, show: {}, right: 0, spoke: 0 }); render(); } };
    if (DL.i === 0 && !DL.spoke) { DL.spoke = 1; lineSay(d.lines[0][1]); }
  } else if (DL.m === 'part') {
    if (DL.i >= n) { $('#app').innerHTML = `${head}<section class="panel summary"><div class="label">Conversation done</div><h1 style="font-size:2rem;color:var(--sea)">Maayo kaayo!</h1><p class="muted">${DL.right} of ${d.lines.filter(l => l[0] === 'b').length} of your lines said right.</p><button class="btn primary block" id="fin">Continue</button></section>`; $('#fin').onclick = done; $('#quit').onclick = () => go('home'); return; }
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
  $('#quit').onclick = () => go('home');
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
  return `<div class="panel rulechip"><div class="label">How it's built · rule ${r.n}</div><b>${esc(r.title)}</b><div class="small">${esc(r.short)}</div><button class="linkbtn" data-rule="${r.id}">See the rule</button></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-rule]'); if (!b) return; ruleOpen = b.dataset.rule; ruleBack = view; go('rules'); });
let ruleOpen = null, ruleBack = 'home';
VIEWS.rules = function () {
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Sentence rules</h2></div>
    ${binkoSays('Binko took a Bisaya sentence apart like an engine! These are the parts. Learn the rules once, and every word you know can go into a sentence of your own.')}
    ${RULES.map(r => `<details class="panel rule" id="r-${r.id}" ${ruleOpen === r.id ? 'open' : ''}><summary><b>${r.n}. ${esc(r.title)}</b><div class="small muted">${esc(r.short)}</div></summary>
      <p class="small">${esc(r.body)}</p>
      ${r.ex.map(x => `<div class="small" style="margin:4px 0"><b>${esc(x[0])}</b> <span class="muted">· ${esc(x[1])}</span><div class="muted" style="font-size:.85em">${esc(x[2])}</div></div>`).join('')}</details>`).join('')}
    <button class="btn primary block" id="tryb">Practice: build sentences</button>`;
  $('#quit').onclick = () => { const b = ruleBack; ruleOpen = null; ruleBack = 'home'; go(b === 'rules' ? 'home' : b); };
  $('#tryb').onclick = startBuild;
  if (ruleOpen) { const el = $('#r-' + ruleOpen); if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 30); }
};

/* ---------- build sentences: real sentences from the learner's own words ---------- */
function buildPool() {
  const kw = knownWords(), has = w => kw.has(w.toLowerCase());
  const verbs = VERBS.filter(v => has(v[0]) || has(v[1]) || has(v[2]) || has('nag' + v[0]));
  const states = STATES.filter(x => has(x[0]));
  const prons = PRONS.filter(p => has(p[0]));
  const out = [];
  PATTERNS.forEach(pt => {
    if (!pt.need.every(has)) return;
    const ps = prons.filter(p => !pt.pron || pt.pron.includes(p[0])); if (!ps.length) return;
    (pt.uses === 'v' ? verbs : states).forEach(w => ps.forEach(p => out.push({ pt, w, p })));
  });
  return { out, verbs, states, prons };
}
function buildLock() {
  const { out, verbs, states, prons } = buildPool();
  const kinds = new Set(out.map(x => x.pt.id)).size;
  if (out.length >= 4 && kinds >= 2) return null;
  const miss = [!prons.length && 'ko (I)', !verbs.length && !states.length && 'an action word like kaon or a feeling like gutom'].filter(Boolean);
  return `Opens once you've learned ${miss.length ? miss.join(' and ') : 'a few more words to build with'} in your daily sessions.`;
}
let BD = null;
function startBuild() {
  const L = buildLock();
  if (L) { view = 'locked'; $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Build sentences</h2></div>${binkoSays('Build sentences is still locked! Binko only builds with parts you already have. ' + esc(L))}<button class="btn ghost block" data-rule="first">Read the sentence rules meanwhile</button>`; $('#quit').onclick = () => go('home'); return; }
  const { out } = buildPool();
  // spread across patterns so one session touches several rules
  const byPt = {}; shuffle(out).forEach(x => (byPt[x.pt.id] = byPt[x.pt.id] || []).push(x));
  const qs = []; let round = 0;
  while (qs.length < 8 && round < 8) { Object.values(byPt).forEach(l => { if (qs.length < 8 && l[round]) qs.push(l[round]); }); round++; }
  BD = { qs: shuffle(qs), i: 0, right: 0, mode: 'tiles' }; sess = newSess('build'); go('build');
}
VIEWS.build = function () {
  const head = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><div class="prog"><i style="width:${BD.i / (BD.qs.length + 1) * 100}%"></i></div><span class="muted small">Build</span></div>`;
  if (BD.i >= BD.qs.length) return buildOwn(head);
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
    if (ok) { BD.right++; addXP(6); }
    const f = $('#foot'); f.className = 'foot ' + (ok ? 'good' : 'bad');
    f.innerHTML = `<div class="verdict">${ok ? 'Tama!' : 'Dili pa. Not yet.'}</div><div class="ans"><span>${esc(want)}</span> <span class="muted" style="font-weight:400">· ${esc(en)}</span></div>
      ${ok ? '' : `<div class="small">You built "${esc(got)}"</div>`}<div class="small"><b>Rule ${r.n}, ${esc(r.title)}:</b> ${esc(r.short)}</div>
      <button class="btn primary block" id="cont">Continue</button>`;
    $('#cont').onclick = () => { BD.i++; render(); };
  };
  $('#quit').onclick = () => go('home');
};
// the last step: the learner makes a sentence of their own and checks it against the pattern
function buildOwn(head) {
  const { verbs, states, prons } = buildPool();
  const p = prons.find(x => x[0] === 'ko') || prons[0];
  const kw = knownWords(), has = w => kw.has(w);
  const opts = [verbs.length && has('dili') && { pat: `Dili ${p[0]} mo___`, tip: 'Something you won\'t do. Remember: ' + p[0] + ' goes right after dili.', re: new RegExp(`^dili ${p[0]} mo\\S+`), words: verbs.map(v => v[1]) },
    verbs.length && has('gusto') && { pat: `Gusto ${p[0]} mo___`, tip: 'Something you want to do.', re: new RegExp(`^gusto ${p[0]} mo\\S+`), words: verbs.map(v => v[1]) },
    verbs.length && { pat: `Ni___ ${p[0]}`, tip: 'Something you did today.', re: new RegExp(`^(ni|mi)\\S+ ${p[0]}\\b`), words: verbs.map(v => v[2]) },
    states.length && { pat: `___ ${p[0]}`, tip: 'How you feel right now.', re: new RegExp(`^\\S+ ${p[0]}$`), words: states.map(x => x[0]) }].filter(Boolean);
  const o = opts[Math.floor(Math.random() * opts.length)];
  $('#app').innerHTML = `${head}<div class="ex">${binkoSays('Your turn to be the creator! Make your own sentence. Any word you know can go in the blank.')}
    <div class="panel"><div class="label">Pattern</div><div class="ceb">${esc(o.pat)}</div><div class="small">${esc(o.tip)}</div>
    <div class="small muted" style="margin-top:6px">Words you know that fit: ${o.words.slice(0, 12).map(esc).join(', ')}</div></div>
    <input class="field" id="own" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your sentence in Bisaya"><div id="res"></div></div><div class="foot" id="foot"></div>`;
  foot(`<button class="btn primary block" id="chk" disabled>Check my sentence</button>`);
  const inp = $('#own'); inp.oninput = () => $('#chk').disabled = !inp.value.trim();
  const finish = () => { tick('build'); addXP(10); save(); view = 'done'; sectionDone('Sentences built', BD.right + ' of ' + BD.qs.length + ' right, plus one of your own'); };
  const check = () => {
    const v = norm(inp.value), okShape = o.re.test(v), fill = o.words.some(w => v.split(' ').includes(w));
    $('#res').innerHTML = okShape ? `<div class="panel good-note"><b>${fill ? 'Tama! That follows the pattern.' : 'The order is right.'}</b>${fill ? '' : '<div class="small">Check the action word is one you know: ' + esc(o.words.slice(0, 6).join(', ')) + '…</div>'}<div class="small muted">Say it out loud twice.</div></div>`
      : `<div class="panel"><b>Close. Check the order.</b><div class="small">The pattern is <b>${esc(o.pat)}</b>. ${esc(RULE.ko.short)}</div></div>`;
    foot(`<button class="btn primary block" id="fin">${okShape ? 'Done' : 'Finish anyway'}</button>${okShape ? '' : '<button class="btn ghost block" id="again">Try again</button>'}`);
    $('#fin').onclick = finish; if ($('#again')) $('#again').onclick = () => { inp.focus(); foot(`<button class="btn primary block" id="chk">Check my sentence</button>`); $('#chk').onclick = check; };
  };
  $('#chk').onclick = check;
  $('#quit').onclick = () => go('home');
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
  const kw = knownWords(), { stats, cur } = pathState();
  const tw = REAL_TWEETS.map((t, i) => { const left = tweetWords(t).filter(w => !knowsWord(kw, w)); return { key: realKey('t', i), kind: 't', i, t, left, open: !left.length }; });
  const cl = REAL_CLIPS.map((c, i) => ({ key: realKey('c', i), kind: 'c', i, c, open: cur > c.stage || (cur === c.stage && stats[c.stage].frac >= 0.5) }));
  return tw.concat(cl);
}
function realToday() {
  const p = planDay(), items = realItems();
  if (p.realKey) { const it = items.find(x => x.key === p.realKey); if (it && it.open) return it; }
  const done = S.realDone || {}, open = items.filter(x => x.open);
  if (!open.length) return null;
  // least-done first; alternate tweets and clips day to day
  const pref = today() % 2 ? 'c' : 't';
  open.sort((a, b) => (done[a.key] || 0) - (done[b.key] || 0) || (a.kind === pref ? -1 : 0) - (b.kind === pref ? -1 : 0) || a.i - b.i);
  p.realKey = open[0].key; return open[0];
}
function realLockHint() {
  const items = realItems(), tw = items.filter(x => x.kind === 't').sort((a, b) => a.left.length - b.left.length)[0];
  return tw ? `A post from ${tw.t[1]} opens after you learn ${tw.left.length} more word${tw.left.length === 1 ? '' : 's'} (${tw.left.slice(0, 4).join(', ')}${tw.left.length > 4 ? '…' : ''}).` : '';
}
function realLockItem() {
  const it = realToday();
  return it ? { k: 'real', name: 'Real Bisaya', d: it.kind === 't' ? `A real post by ${it.t[1]}. Translate it, then reply in Bisaya.` : `A clip from ${it.c.show}. Watch, catch the gist, then answer in Bisaya.`, run: () => go('real') }
    : { k: 'real', locked: true, name: 'Real Bisaya', d: 'Locked for now, so it counts as done. ' + realLockHint() };
}
let RB = null, twLoaded = false;
function loadTwitter() { if (twLoaded) { window.twttr && twttr.widgets && twttr.widgets.load(); return; } twLoaded = true; const s = document.createElement('script'); s.src = 'https://platform.twitter.com/widgets.js'; s.async = true; document.head.appendChild(s); }
VIEWS.real = function () {
  const it = RB && RB.it ? RB.it : realToday();
  const top = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Real Bisaya</h2></div>`;
  if (!it) { $('#app').innerHTML = `${top}${binkoSays('Real Bisaya is still locked! Binko only shows you real posts once you know every word in them. ' + esc(realLockHint()) + ' Keep doing your daily sessions!')}`; $('#quit').onclick = () => go('home'); return; }
  if (!RB || RB.it !== it) RB = { it, step: 'see' };
  const done = () => { tick('real'); S.realDone = S.realDone || {}; S.realDone[it.key] = (S.realDone[it.key] || 0) + 1; addXP(12); save(); const was = it; RB = null; view = 'done'; sectionDone('Real Bisaya done', '+12 XP · ' + esc(was.kind === 't' ? 'post by ' + was.t[1] : was.c.show)); };
  const respond = (prompt, ex) => {
    $('#step').innerHTML = `<div class="panel"><div class="label">Now answer in Bisaya</div><div class="prompt">${esc(prompt)}</div><input class="field" id="rep" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type or say it out loud"><div id="exr"></div></div>`;
    foot(`<button class="btn primary block" id="sh">Show an example</button>`);
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
    foot(`<button class="btn primary block" id="chk">Check</button>`);
    $('#chk').onclick = () => {
      $('#key').innerHTML = `<div class="corr">${esc(t[3])}</div>${breakdown(t[2].replace(/["“”]/g, ''))}${notes ? `<div class="small"><b>Shortcuts in this post:</b> ${notes}</div>` : ''}${ruleChip(t[2].replace(/["“”]/g, ''))}`;
      foot(`<div class="grades"><button class="btn" data-g="1">I got the gist</button><button class="btn" data-g="0">I missed it</button></div>`);
      document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => respond(t[5], t[6]));
    };
  } else {
    const c = it.c;
    $('#app').innerHTML = `${top}<div class="ex"><div class="label">${esc(c.show)}</div>
      <div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${c.yt}?start=${c.from}&end=${c.to}&rel=0&playsinline=1&modestbranding=1&cc_load_policy=0" title="${esc(c.show)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
      <p class="muted small" style="margin:0">Sound on, subtitles off. It stops by itself after ${c.to - c.from} seconds. Replay it as often as you like.</p><div id="step"></div></div><div class="foot" id="foot"></div>`;
    const opts = shuffle(c.a.map((x, j) => ({ x, ok: j === 0 })));
    $('#step').innerHTML = `<div class="panel"><div class="label">${esc(c.q)}</div><div class="opts">${opts.map((o, j) => `<button class="opt" data-o="${j}">${esc(o.x)}</button>`).join('')}</div><div id="key"></div></div>`;
    foot('<div class="small muted">Pick an answer after you watch.</div>');
    document.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      const j = +b.dataset.o; document.querySelectorAll('[data-o]').forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add('right'); else if (k === j) x.classList.add('wrong'); });
      $('#key').innerHTML = `<div class="label" style="margin-top:8px">What they said (the show's subtitles)</div>${c.en.map(l => `<div class="small">${esc(l)}</div>`).join('')}`;
      foot(`<button class="btn primary block" id="nx">Next: answer in Bisaya</button>`); $('#nx').onclick = () => respond(c.say, c.ex);
    });
  }
  $('#quit').onclick = () => { RB = null; go('home'); };
};

/* ---------- shadowing ---------- */
let SH = null;
VIEWS.shadow = function () {
  if (!hasPack()) { toast('Load the content pack first. Shadowing uses its recordings.'); return go('home'); }
  if (drillLock('shadow')) return lockedScreen('Shadowing', 'shadow');
  const mine = UNITS.map(u => Object.assign({}, u, { ids: u.ids.filter(id => S.cards[id]) })).filter(u => u.ids.length);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Shadowing</h2></div>
  <section class="panel"><p style="margin:0">Each phrase plays three times: once to listen, then twice to speak along, the last at ${Math.max(1.1, S.speed).toFixed(1)}×. Hands-free, so it works with headphones on a walk.</p></section>
  <section class="panel"><p class="muted small" style="margin:0">Only phrases you've already learned.</p>${mine.map((u, i) => `<div class="unit"><div class="nm"><b>${esc(u.ceb)}</b> <span class="muted small">${esc(u.name)} · ${u.ids.length}</span></div><button class="btn sm primary" data-u="${i}">Start</button></div>`).join('')}</section>`;
  $('#quit').onclick = () => go('home');
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
  $('#quit').onclick = () => go('home');
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (b.dataset.armed) { S.custom = S.custom.filter(x => x.id !== b.dataset.del); delete S.cards[b.dataset.del]; save(); render(); } else { b.dataset.armed = 1; b.textContent = 'Tap to confirm'; } });
  $('#gadd').onclick = async () => {
    const en = $('#gen').value.trim(), ceb = $('#gceb').value.trim(); if (!en) return;
    if (ceb) { addGap(en, ceb) ? render() : ($('#gmsg').textContent = 'Already on your list.'); return; }
    $('#gmsg').textContent = 'Add the Bisaya too.';
  };
};

/* ---------- boot ---------- */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (view !== 'session' && view !== 'speedrun') return;
  if (/^[1-4]$/.test(e.key)) { const b = document.querySelectorAll('.opt')[+e.key - 1]; if (b && !b.disabled) b.click(); }
  if (e.key === 'Enter') { const b = $('#chk:not([disabled])') || $('#cont'); if (b && document.activeElement !== b) { e.preventDefault(); b.click(); } }
  if (e.key === ' ' && $('#pl') && !$('#pl').disabled) { e.preventDefault(); $('#pl').click(); }
});
initSync();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
render();
loadStoredPack().then(ok => { if (ok) { if (view === 'home') render(); } else autoPack(); });
