'use strict';
/* ---------- Map games ----------
   A grey map of the Philippines (81+1 provinces and Metro Manila, from faeldon/philippines-json-maps, MIT, based on
   PSA/NAMRIA boundaries). One province lights up: name it, or name the language mostly spoken there.
   "Study the map" lets you explore first; practice rounds don't end on a miss and don't count for the leaderboard. */
let GEO = null, GEOI = {};
async function loadGeo() {
  if (GEO) return GEO;
  try { const r = await fetch('map.json?v=1'); GEO = await r.json(); GEO.p.forEach(p => { GEOI[p.n] = p; p.bb = pathBox(p.d); }); } catch (e) { GEO = null; }
  return GEO;
}
function pathBox(d) { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); } return [x0, y0, x1, y1]; }
const langOf = n => (typeof GEO_LANG !== 'undefined' && GEO_LANG[n]) || null;
// a colour per language for the study map
const LANG_COLORS = ['#34b8a3', '#e8c547', '#e98aa6', '#7cc3ea', '#d0875a', '#93d99a', '#b59cf0', '#f29e6b', '#5fd0bd', '#c9d36b', '#ef8fa5', '#8fb3ff', '#e0b0ff', '#ffd27f', '#9ee6d0', '#f7a8c8', '#a0c4ff', '#ffb38a', '#c1e1a6', '#d6a2e8'];
let LANG_COL = null;
function langColor(l) { if (!LANG_COL) { LANG_COL = {}; const counts = {}; Object.values(GEO_LANG).forEach(x => counts[x.main] = (counts[x.main] || 0) + 1); Object.keys(counts).sort((a, b) => counts[b] - counts[a]).forEach((k, i) => LANG_COL[k] = LANG_COLORS[i % LANG_COLORS.length]); } return LANG_COL[l] || '#4a5a5c'; }
const REG_COLORS = {};
function regColor(r) { if (!REG_COLORS[r]) { const keys = [...new Set(GEO.p.map(p => p.r))]; keys.forEach((k, i) => REG_COLORS[k] = LANG_COLORS[i % LANG_COLORS.length]); } return REG_COLORS[r]; }
// the map as SVG. hi = province to light up; zoom = frame the view around it; fill = colour per province
function mapSvg({ hi, zoom, fill, tap, sel }) {
  let vb = `0 0 ${GEO.w} ${GEO.h}`, ring = '';
  if (hi && GEOI[hi]) {
    const [x0, y0, x1, y1] = GEOI[hi].bb, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (zoom) { const s = Math.max(560, (x1 - x0) * 2.6, (y1 - y0) * 2.1); vb = `${Math.round(cx - s / 2)} ${Math.round(cy - s * 0.6)} ${Math.round(s)} ${Math.round(s * 1.2)}`; }
    if (x1 - x0 < 34 && y1 - y0 < 34) ring = `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${zoom ? 26 : 34}" class="geo-ring"/>`;
  }
  return `<svg class="geo-map" viewBox="${vb}" role="img" aria-label="Map of the Philippines">
    <path d="${GEO.x}" class="geo-x"/>
    ${GEO.p.map(p => `<path d="${p.d}" data-n="${esc(p.n)}" class="geo-p ${p.n === hi ? 'hi' : ''} ${p.n === sel ? 'sel' : ''} ${tap ? 'tap' : ''}" ${fill ? `style="fill:${fill(p)}"` : ''}><title>${tap ? esc(p.n) : ''}</title></path>`).join('')}
    ${ring}</svg>`;
}
// Spanish-style spellings (Quezon, Cavite, Davao) respelled the way people say them, for the sounds-like line
const GEO_SAY = {"ilocos norte": "ilokos norte", "ilocos sur": "ilokos sur", "la union": "la unyon", "misamis occidental": "misamis oksidental", "misamis oriental": "misamis oryental", "davao del norte": "dabaw del norte", "davao del sur": "dabaw del sur", "davao oriental": "dabaw oryental", "davao de oro": "dabaw de oro", "davao occidental": "dabaw oksidental", "cotabato": "kotabato", "south cotabato": "sawt kotabato", "benguet": "bengget", "ifugao": "ifugaw", "mountain province": "mawntin prabins", "apayao": "apayaw", "surigao del norte": "surigaw del norte", "surigao del sur": "surigaw del sur", "dinagat islands": "dinagat aylands", "marinduque": "marinduke", "occidental mindoro": "oksidental mindoro", "oriental mindoro": "oryental mindoro", "negros occidental": "negros oksidental", "negros oriental": "negros oryental", "siquijor": "sikihor", "maguindanao del norte": "magindanaw del norte", "maguindanao del sur": "magindanaw del sur", "cagayan": "kagayan", "nueva vizcaya": "nweba biskaya", "quirino": "kirino", "bulacan": "bulakan", "nueva ecija": "nweba esiha", "zambales": "sambales", "aurora": "awrora", "cavite": "kabite", "quezon": "keson", "rizal": "risal", "camarines norte": "kamarines norte", "camarines sur": "kamarines sur", "catanduanes": "katandwanes", "antique": "antike", "capiz": "kapis", "iloilo": "ilo-ilo", "guimaras": "gimaras", "cebu": "sebu", "eastern samar": "istern samar", "northern samar": "nortern samar", "southern leyte": "sawtern leyte", "bantoanon": "bantwanon", "blaan": "bla-an", "butuanon": "butwanon", "cebuano": "sebwano", "chavacano": "tsabakano", "cuyonon": "kuyonon", "ibaloi": "ibaloy", "ilocano": "ilokano", "kankanaey": "kankana-ey", "maguindanaon": "magindanawon", "maranao": "maranaw", "masbateño": "masbatenyo", "surigaonon": "surigawnon", "t'boli": "tboli", "tausug": "tawsug", "rinconada bikol": "rinkonada bikol", "bicol": "bikol", "camiguin": "kamigin", "lanao del norte": "lanaw del norte", "lanao del sur": "lanaw del sur", "tarlac": "tarlak"};
const geoSay = s => { const k = String(s).toLowerCase().replace(/\s*\(.*?\)/g, '').trim(); return GEO_SAY[k] || k; };
// say a place or language name out loud, and show how it sounds
const sayIt = (s, btn) => Promise.race([voiceUrlA(s).then(u => u ? playUrl(u, 1, btn) : null).catch(() => null), new Promise(r => setTimeout(r, 3500))]);
const sayBtn2 = s => hasVoice(s) ? `<button class="play sm" data-say="${esc(s)}" aria-label="Hear it">${I.play}</button>` : '';
const mixNote = L => L ? (L.unsure && L.also && L.also.length ? `Mixed: ${L.main} is the most spoken, with ${L.also.join(' and ')} close behind.` : L.also && L.also.length ? `Also spoken: ${L.also.join(', ')}.` : '') : '';
function wireSay() { document.querySelectorAll('[data-say]').forEach(b => b.onclick = e => { e.stopPropagation(); sayIt(b.dataset.say, b); }); }
/* ---------- study the map ---------- */
let GS = { by: 'region', sel: null, q: '' };
const geoList = (groups, q) => Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length).map(k => { const ps = groups[k].filter(p => !q || p.n.toLowerCase().includes(q)); if (!ps.length) return '';
      return `<section class="panel"><div class="row spread"><b><span class="langdot" style="background:${GS.by === 'lang' ? langColor(k) : regColor(k)}"></span>${esc(k)}</b><span class="muted small">${ps.length}</span></div>
        <div class="geo-list">${ps.sort((a, b) => a.n.localeCompare(b.n)).map(p => `<button class="geo-chip ${p.n === GS.sel ? 'on' : ''}" data-pick="${esc(p.n)}">${esc(p.n)}${GS.by === 'region' && langOf(p.n) ? ` <span class="muted">· ${esc(langOf(p.n).main)}</span>` : ''}</button>`).join('')}</div></section>`; }).join('');
VIEWS.geo = async function () {
  if (!GEO) { $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Study the map</h2></div><p class="muted">Loading the map…</p>`; $('#quit').onclick = () => goTab(); await loadGeo(); if (view === 'geo') render(); return; }
  const sel = GS.sel && GEOI[GS.sel], L = sel && langOf(sel.n);
  const fill = GS.by === 'lang' ? p => langColor((langOf(p.n) || {}).main) : p => regColor(p.r);
  const groups = {}; GEO.p.forEach(p => { const k = GS.by === 'lang' ? ((langOf(p.n) || {}).main || '?') : p.r; (groups[k] = groups[k] || []).push(p); });
  const q = GS.q.trim().toLowerCase();
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Back">${I.x}</button><h2 style="flex:1">Study the map</h2></div>
    <div class="seg" id="geoby"><button class="${GS.by === 'region' ? 'on' : ''}" data-by="region">By region</button><button class="${GS.by === 'lang' ? 'on' : ''}" data-by="lang">By language</button></div>
    <p class="muted small" style="margin:0">Tap any province to see its name, region and main language.</p>
    <div class="geo-wrap">${mapSvg({ fill, tap: true, sel: GS.sel })}</div>
    <section class="panel geo-info">${sel ? `<div class="row" style="gap:8px;align-items:center"><b style="font-size:1.2rem">${esc(sel.n)}</b>${sayBtn2(sel.n)}</div>${phonHtml(geoSay(sel.n))}<div class="small muted">${esc(sel.r)}</div>
      ${L ? `<div class="row" style="gap:8px;align-items:center"><span><span class="langdot" style="background:${langColor(L.main)}"></span><b>${esc(L.main)}</b></span>${sayBtn2(L.main)}</div>${phonHtml(geoSay(L.main))}${mixNote(L) ? `<div class="small">${esc(mixNote(L))}</div>` : ''}${L.note ? `<div class="small muted">${esc(L.note)}</div>` : ''}` : ''}` : '<span class="muted">Tap a province on the map.</span>'}</section>
    <input class="field" id="geoq" placeholder="Find a province" value="${esc(GS.q)}">
    <div id="geolist">${geoList(groups, q)}</div>`;
  $('#quit').onclick = () => goTab();
  document.querySelectorAll('[data-by]').forEach(b => b.onclick = () => { GS.by = b.dataset.by; render(); });
  document.querySelectorAll('.geo-p.tap').forEach(p => p.onclick = () => { GS.sel = p.dataset.n; render(); window.scrollTo(0, 0); sayIt(GS.sel); });
  const wirePicks = () => document.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { GS.sel = b.dataset.pick; render(); window.scrollTo(0, 0); sayIt(GS.sel); });
  wirePicks();
  wireSay();
  // search keeps your place on the page instead of jumping to the top on every letter
  // search only redraws the list below the box: the map, your place on the page and the box itself stay put
  const qi = $('#geoq'); qi.oninput = () => { GS.q = qi.value; $('#geolist').innerHTML = geoList(groups, GS.q.trim().toLowerCase()); wirePicks(); };
};
/* ---------- the games ---------- */
// other names people use, accepted when typing
const GEO_ALIAS = { 'Metro Manila': ['NCR', 'Manila', 'National Capital Region'], 'Davao de Oro': ['Compostela Valley'], 'Cotabato': ['North Cotabato'], 'Mountain Province': ['Mt Province'],
  'Cebuano (Bisaya)': ['Binisaya', 'Sugbuanon', 'Visayan'], 'Ilocano': ['Ilokano', 'Iloko', 'Iloco'], 'Bikol': ['Bicol', 'Bikolano', 'Bicolano'], 'Kinaray-a': ['Karay-a', 'Kinaraya'],
  'Tagalog': ['Filipino'], 'Masbateño': ['Masbatenyo'], 'Waray': ['Waray-Waray', 'Winaray'], 'Tausug': ['Bahasa Sug'], 'Sama': ['Sinama', 'Bajau', 'Badjao'], 'Kapampangan': ['Pampango'],
  'Pangasinan': ['Pangasinense'], 'Maguindanaon': ['Maguindanao'], 'Hiligaynon (Ilonggo)': ['Ilongo'] };
const nameAlts = s => [s, ...(s.match(/\(([^)]+)\)/) ? [s.replace(/\s*\(.*?\)/, ''), s.match(/\(([^)]+)\)/)[1]] : []), ...(GEO_ALIAS[s] || [])];
const allLangs = () => [...new Set(Object.values(GEO_LANG).map(x => x.main))];
let GG = null;
async function startGeo(mode, practice) {
  await loadGeo(); if (!GEO) return toast('The map did not load. Check your connection.');
  GG = { mode, practice: !!practice, n: 0, miss: 0, seen: new Set(), last: null, how: rushTyped() ? 'type' : 'pick' };
  geoNext(); go('geogame');
}
function geoNext() {
  const all = GEO.p.filter(p => GG.mode === 'prov' || langOf(p.n));
  let pool = all.filter(p => !GG.seen.has(p.n)); if (!pool.length) { GG.seen.clear(); pool = all; }
  const t = pick(pool); GG.seen.add(t.n); GG.cur = t; GG.done = false;
  if (GG.mode === 'prov') {
    // harder as you go: neighbours from the same region show up as choices
    const same = shuffle(all.filter(p => p.r === t.r && p.n !== t.n)), other = shuffle(all.filter(p => p.r !== t.r));
    const k = GG.n < 5 ? 0 : GG.n < 15 ? 1 : 3, wrong = same.slice(0, k).concat(other).slice(0, 3);
    GG.opts = shuffle([t.n, ...wrong.map(p => p.n)]); GG.right = t.n;
  } else {
    const L = langOf(t.n), avoid = new Set([L.main, ...(L.also || [])]);
    const langs = [...new Set(Object.values(GEO_LANG).map(x => x.main))].filter(l => !avoid.has(l));
    // later on, the wrong choices come from nearby provinces' languages
    const near = [...new Set(all.filter(p => p.r === t.r).map(p => (langOf(p.n) || {}).main))].filter(l => l && !avoid.has(l));
    const wrong = (GG.n >= 8 ? shuffle(near) : []).concat(shuffle(langs)); const opts = [...new Set(wrong)].slice(0, 3);
    GG.opts = shuffle([L.main, ...opts]); GG.right = L.main;
  }
}
VIEWS.geogame = function () {
  const t = GG.cur, best = (S.geoBest || {})[GG.mode] || 0, L = langOf(t.n);
  const title = GG.mode === 'prov' ? 'Province Rush' : 'Language Rush';
  // like Padayon Rush: a timer that gets shorter every 5 right (not in practice)
  const typed = GG.how === 'type', secs = GG.practice ? 0 : typed ? Math.max(8, 18 - Math.floor(GG.n / 5) * 0.5) : Math.max(4, 10 - Math.floor(GG.n / 5) * 0.5);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="End">${I.x}</button><h2 style="flex:1">${title}</h2><span class="speedchip tnum">${GG.practice ? 'Practice' : GG.n}</span></div>
    <div class="ex geo-ex">${secs ? '<div class="timer"><i id="tb"></i></div>' : ''}<div class="geo-wrap game">${mapSvg({ hi: t.n, zoom: true })}</div>
    <div class="prompt" style="font-size:1.1rem">${GG.mode === 'prov' ? 'Which province is lit up?' : `Which language do most people speak in <b>${esc(t.n)}</b>? ${sayBtn2(t.n)}`}</div>${GG.mode === 'lang' ? phonHtml(geoSay(t.n)) : ''}
    ${typed ? typeBox(GG.mode === 'prov' ? 'Type the province' : 'Type the language') : `<div class="opts geo-opts">${GG.opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>`}
    ${GG.practice ? `<p class="muted small" style="margin:0">Practice${typed ? ', typing' : ''}: take your time, misses are fine.</p>` : `<p class="muted small" style="margin:0">${typed ? 'Typing, small typos are fine. ' : ''}${secs}s each. One miss or running out of time ends the run. Best: ${best}${best ? ' (' + HOW((S.geoHow || {})[GG.mode]) + ')' : ''}.</p>`}</div><div class="foot" id="foot" hidden></div>`;
  $('#quit').onclick = () => { clearInterval(timerH); GG.practice ? go('rushhome') : geoOver(null); };
  wireSay(); if (GG.mode === 'lang') sayIt(t.n);
  const btns = [...document.querySelectorAll('.geo-opts .opt')];
  const t0 = Date.now(); clearInterval(timerH);
  if (secs) timerH = setInterval(() => { const f = 1 - (Date.now() - t0) / (secs * 1000), tb = $('#tb'); if (tb) tb.style.width = Math.max(0, f * 100) + '%'; if (f <= 0) answer(-1, null); }, 100);
  const answer = (i, text) => {
    if (GG.done) return; GG.done = true; clearInterval(timerH);
    const others = GG.mode === 'prov' ? GEO.p.map(p => p.n) : allLangs();
    const ok = typed ? text != null && nameOk(text, nameAlts(GG.right), others) : i >= 0 && GG.opts[i] === GG.right;
    btns.forEach((x, j) => { x.disabled = true; if (GG.opts[j] === GG.right) x.classList.add('right'); else if (j === i) x.classList.add('wrong'); });
    if (typed) { const ti = $('#tans'); if (ti) { ti.disabled = true; ti.classList.add(ok ? 'right' : 'wrong'); } const tg = $('#tgo'); if (tg) tg.disabled = true; }
    const youTyped = typed && !ok && text ? `<div class="small">You typed <b>${esc(text)}</b>. The answer: <b>${esc(GG.right)}</b></div>` : '';
    GG.typedText = typed && !ok ? text : null;
    const said = GG.mode === 'prov' ? t.n : L.main;
    const info = `<b>${esc(t.n)}</b> <span class="muted">· ${esc(t.r)}</span>${GG.mode === 'prov' ? phonHtml(geoSay(t.n)) : ''}${L ? `<div class="small">Mostly <b>${esc(L.main)}</b>${GG.mode === 'lang' ? phonHtml(geoSay(L.main)) : ''}${mixNote(L) ? ' ' + esc(mixNote(L)) : ''} ${esc(L.note || '')}</div>` : ''}`;
    const voice = sayIt(said);
    if (ok) GG.n++; else GG.miss++;
    const f = $('#foot'); f.hidden = false; f.className = 'foot ' + (ok ? 'good' : 'bad');
    if (GG.practice) {
      f.innerHTML = `<div class="verdict">${ok ? pick(['Tama!', 'Sakto!', 'Nindot!']) : 'Dili pa.'}</div><div class="ans">${youTyped}${info}</div><button class="btn primary block" id="cont">Next</button>`;
      $('#cont').onclick = () => { geoNext(); render(); }; $('#cont').focus({ preventScroll: true });
    } else if (ok) {
      // show the answer and let the name play, then straight on to the next one
      f.innerHTML = `<div class="verdict">${pick(['Tama!', 'Sakto!', 'Nindot!'])}</div><div class="ans">${info}</div>`;
      Promise.all([voice, new Promise(r => setTimeout(r, 700))]).then(() => setTimeout(() => { if (view === 'geogame' && GG.done) { geoNext(); render(); } }, 150));
    }
    else Promise.all([voice, new Promise(r => setTimeout(r, 900))]).then(() => geoOver(t, typed ? text == null : i < 0));
  };
  btns.forEach((b, i) => b.onclick = () => answer(i));
  if (typed) wireType(x => answer(-1, x));
};
function geoOver(t, timeUp) {
  const n = GG.n, prev = (S.geoBest || {})[GG.mode] || 0; S.geoBest = Object.assign({}, S.geoBest || {}); S.geoHow = Object.assign({}, S.geoHow || {});
  const r = bestWith(prev, S.geoHow[GG.mode], n, GG.how), isBest = r.isBest; S.geoBest[GG.mode] = r.best; S.geoHow[GG.mode] = r.how; save(); view = 'summary';
  const L = t && langOf(t.n), name = GG.mode === 'prov' ? 'Province Rush' : 'Language Rush';
  $('#app').innerHTML = `<section class="panel summary"><div class="label">${name}</div><h1 style="font-size:2.4rem;color:var(--sea)">${n}</h1><p class="muted">${HOW(GG.how)} · ${isBest ? 'New personal best!' : 'Best: ' + prev + ' (' + HOW(S.geoHow[GG.mode]) + ')'}</p>
    ${t ? `<div class="panel">${GG.typedText ? `<div class="small">You typed <b>${esc(GG.typedText)}</b>.</div>` : ''}<div class="small muted">${timeUp ? 'Time ran out. The answer was' : 'The answer was'}</div><b>${esc(GG.right)}</b> ${sayBtn2(GG.right)}${phonHtml(geoSay(GG.right))}${GG.mode === 'lang' ? ` <span class="muted">in ${esc(t.n)}</span>` : ` <span class="muted">· ${esc(t.r)}</span>`}${L && L.note ? `<div class="small">${esc(L.note)}</div>` : ''}</div>` : ''}
    ${binkoSays(isBest ? 'NEW RECORD! Binko is drawing your name on his map in gold!' : n >= 15 ? 'Binko binks you could be a tour guide!' : 'Study the map a little, then try again. Binko believes in you!')}
    <button class="btn primary block" id="again">Go again</button><button class="btn ghost block" id="study">Study the map</button><button class="btn ghost block" id="home2">Back to games</button></section>`;
  wireSay();
  $('#again').onclick = () => startGeo(GG.mode, false); $('#study').onclick = () => go('geo'); $('#home2').onclick = () => go('rushhome');
}
