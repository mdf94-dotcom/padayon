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
/* ---------- study the map ---------- */
let GS = { by: 'region', sel: null, q: '' };
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
    <section class="panel geo-info">${sel ? `<b style="font-size:1.2rem">${esc(sel.n)}</b><div class="small muted">${esc(sel.r)}</div>
      ${L ? `<div><span class="langdot" style="background:${langColor(L.main)}"></span><b>${esc(L.main)}</b>${L.unsure ? ' <span class="tag soft">mixed</span>' : ''}${L.also && L.also.length ? ` <span class="muted small">· also ${esc(L.also.join(', '))}</span>` : ''}</div>${L.note ? `<div class="small">${esc(L.note)}</div>` : ''}` : ''}` : '<span class="muted">Tap a province on the map.</span>'}</section>
    <input class="field" id="geoq" placeholder="Find a province" value="${esc(GS.q)}">
    ${Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length).map(k => { const ps = groups[k].filter(p => !q || p.n.toLowerCase().includes(q)); if (!ps.length) return '';
      return `<section class="panel"><div class="row spread"><b><span class="langdot" style="background:${GS.by === 'lang' ? langColor(k) : regColor(k)}"></span>${esc(k)}</b><span class="muted small">${ps.length}</span></div>
        <div class="geo-list">${ps.sort((a, b) => a.n.localeCompare(b.n)).map(p => `<button class="geo-chip ${p.n === GS.sel ? 'on' : ''}" data-pick="${esc(p.n)}">${esc(p.n)}${GS.by === 'region' && langOf(p.n) ? ` <span class="muted">· ${esc(langOf(p.n).main)}</span>` : ''}</button>`).join('')}</div></section>`; }).join('')}`;
  $('#quit').onclick = () => goTab();
  document.querySelectorAll('[data-by]').forEach(b => b.onclick = () => { GS.by = b.dataset.by; render(); });
  document.querySelectorAll('.geo-p.tap').forEach(p => p.onclick = () => { GS.sel = p.dataset.n; render(); window.scrollTo(0, 0); });
  document.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { GS.sel = b.dataset.pick; render(); window.scrollTo(0, 0); });
  const qi = $('#geoq'); qi.oninput = () => { GS.q = qi.value; const pos = qi.selectionStart; render(); const n = $('#geoq'); n.focus(); n.setSelectionRange(pos, pos); };
};
/* ---------- the games ---------- */
let GG = null;
async function startGeo(mode, practice) {
  await loadGeo(); if (!GEO) return toast('The map did not load. Check your connection.');
  GG = { mode, practice: !!practice, n: 0, miss: 0, seen: new Set(), last: null };
  geoNext(); go('geogame');
}
function geoNext() {
  // Language Rush skips provinces where the top language is close or disputed
  const all = GEO.p.filter(p => GG.mode === 'prov' || (langOf(p.n) && !langOf(p.n).unsure));
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
  const secs = GG.practice ? 0 : Math.max(4, 10 - Math.floor(GG.n / 5) * 0.5);
  $('#app').innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="End">${I.x}</button><h2 style="flex:1">${title}</h2><span class="speedchip tnum">${GG.practice ? 'Practice' : GG.n}</span></div>
    <div class="ex geo-ex">${secs ? '<div class="timer"><i id="tb"></i></div>' : ''}<div class="geo-wrap game">${mapSvg({ hi: t.n, zoom: true })}</div>
    <div class="prompt" style="font-size:1.1rem">${GG.mode === 'prov' ? 'Which province is lit up?' : `Which language do most people speak in <b>${esc(t.n)}</b>?`}</div>
    <div class="opts geo-opts">${GG.opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>
    ${GG.practice ? '<p class="muted small" style="margin:0">Practice: take your time, misses are fine.</p>' : `<p class="muted small" style="margin:0">${secs}s each. One miss or running out of time ends the run. Best: ${best}.</p>`}</div><div class="foot" id="foot" hidden></div>`;
  $('#quit').onclick = () => { clearInterval(timerH); GG.practice ? go('rushhome') : geoOver(null); };
  const btns = [...document.querySelectorAll('.geo-opts .opt')];
  const t0 = Date.now(); clearInterval(timerH);
  if (secs) timerH = setInterval(() => { const f = 1 - (Date.now() - t0) / (secs * 1000), tb = $('#tb'); if (tb) tb.style.width = Math.max(0, f * 100) + '%'; if (f <= 0) answer(-1); }, 100);
  const answer = i => {
    if (GG.done) return; GG.done = true; clearInterval(timerH); const ok = i >= 0 && GG.opts[i] === GG.right;
    btns.forEach((x, j) => { x.disabled = true; if (GG.opts[j] === GG.right) x.classList.add('right'); else if (j === i) x.classList.add('wrong'); });
    const info = `<b>${esc(t.n)}</b> <span class="muted">· ${esc(t.r)}</span>${L ? `<div class="small">Mostly <b>${esc(L.main)}</b>${L.also && L.also.length ? `, also ${esc(L.also.join(', '))}` : ''}. ${esc(L.note || '')}</div>` : ''}`;
    if (ok) GG.n++; else GG.miss++;
    const f = $('#foot'); f.hidden = false; f.className = 'foot ' + (ok ? 'good' : 'bad');
    if (GG.practice) {
      f.innerHTML = `<div class="verdict">${ok ? pick(['Tama!', 'Sakto!', 'Nindot!']) : 'Dili pa.'}</div><div class="ans">${info}</div><button class="btn primary block" id="cont">Next</button>`;
      $('#cont').onclick = () => { geoNext(); render(); }; $('#cont').focus({ preventScroll: true });
    } else if (ok) { setTimeout(() => { if (view === 'geogame') { geoNext(); render(); } }, 550); }
    else setTimeout(() => geoOver(t, i < 0), 900);
  };
  btns.forEach((b, i) => b.onclick = () => answer(i));
};
function geoOver(t, timeUp) {
  const n = GG.n, prev = (S.geoBest || {})[GG.mode] || 0, isBest = n > prev; S.geoBest = Object.assign({}, S.geoBest || {}); if (isBest) S.geoBest[GG.mode] = n; save(); view = 'summary';
  const L = t && langOf(t.n), name = GG.mode === 'prov' ? 'Province Rush' : 'Language Rush';
  $('#app').innerHTML = `<section class="panel summary"><div class="label">${name}</div><h1 style="font-size:2.4rem;color:var(--sea)">${n}</h1><p class="muted">${isBest ? 'New personal best!' : 'Best: ' + prev}</p>
    ${t ? `<div class="panel"><div class="small muted">${timeUp ? 'Time ran out. The answer was' : 'The answer was'}</div><b>${esc(GG.right)}</b>${GG.mode === 'lang' ? ` <span class="muted">in ${esc(t.n)}</span>` : ` <span class="muted">· ${esc(t.r)}</span>`}${L && L.note ? `<div class="small">${esc(L.note)}</div>` : ''}</div>` : ''}
    ${binkoSays(isBest ? 'NEW RECORD! Binko is drawing your name on his map in gold!' : n >= 15 ? 'Binko binks you could be a tour guide!' : 'Study the map a little, then try again. Binko believes in you!')}
    <button class="btn primary block" id="again">Go again</button><button class="btn ghost block" id="study">Study the map</button><button class="btn ghost block" id="home2">Back to games</button></section>`;
  $('#again').onclick = () => startGeo(GG.mode, false); $('#study').onclick = () => go('geo'); $('#home2').onclick = () => go('rushhome');
}
