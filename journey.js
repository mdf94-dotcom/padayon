'use strict';
/* ---------- My journey: how far you've come ----------
   Three views of the same progress:
   1. Path map: the five stages as stops along a road, Binko where you are, stories and grammar rules as landmarks
   2. Word web: every word you know, linked to its word family (same root: kaon, mokaon, gikaon) and to its look-alikes
   3. Then and now: day 1 next to today, a growth chart, and words you used to miss that you now know */
let JTAB = (() => { try { return localStorage.getItem('padayon-jtab') || 'map'; } catch (e) { return 'map'; } })();

// one snapshot a day (words, rules, sentences), so "then and now" can draw a growth line from here on
function journeySnap() {
  try { const t = today(); S.hist = S.hist || {}; const h = { w: learnedCount(), r: Object.keys(S.rules || {}).length };
    if (!S.hist[t] || S.hist[t].w !== h.w || S.hist[t].r !== h.r) S.hist[t] = h; } catch (e) { }
}

VIEWS.journey = function () {
  journeySnap();
  const tabs = [['map', '🗺️ Path map'], ['web', '🕸️ Word web'], ['then', '🌱 Then and now']];
  shell('me', `<div class="ptitle"><button class="linkbtn" id="jback">‹ Me</button><h1>My journey</h1><p class="muted">How far your Bisaya has come.</p></div>
    <div class="seg jtabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === JTAB}" class="${k === JTAB ? 'on' : ''}" data-j="${k}">${l}</button>`).join('')}</div>
    <div id="jbody">${JTAB === 'web' ? webHtml() : JTAB === 'then' ? thenHtml() : mapHtml()}</div>`);
  $('#jback').onclick = () => go('me');
  document.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { JTAB = b.dataset.j; try { localStorage.setItem('padayon-jtab', JTAB); } catch (e) { } render(); });
  if (JTAB === 'map') wireMap(); else if (JTAB === 'web') wireWeb(); else wireThen();
};

/* ---------- 1. path map ---------- */
const STAGE_ART = ['🌱', '🏠', '🛺', '💬', '🦅'];
function mapHtml() {
  const { stats, cur } = pathState(), tl = pathTimeline(), n = PATH.length, H = 150 + n * 170;
  // the road zigzags down the page; stops alternate left and right
  const pts = PATH.map((_, i) => [i % 2 ? 250 : 110, 90 + i * 170]);
  let d = `M ${pts[0][0]} 20 L ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < n; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` C ${x0} ${y0 + 95}, ${x1} ${y1 - 95}, ${x1} ${y1}`; }
  d += ` L ${pts[n - 1][0]} ${H - 20}`;
  const stops = PATH.map((st, i) => { const y = stats[i], [x, yy] = pts[i], state = i < cur ? 'done' : i === cur ? 'now' : 'later', side = i % 2 ? 'left' : 'right';
    const pct = Math.round(y.frac * 100);
    return `<g class="jstop ${state}" transform="translate(${x} ${yy})"><circle r="34" class="jisle"></circle><circle r="34" class="jring" style="stroke-dasharray:${(2 * Math.PI * 34 * y.frac).toFixed(1)} 999"></circle>
      <text class="jart" text-anchor="middle" dy="10">${STAGE_ART[i] || '⭐'}</text></g>
      <foreignObject x="${side === 'right' ? x + 44 : x - 214}" y="${yy - 40}" width="170" height="90"><div xmlns="http://www.w3.org/1999/xhtml" class="jlabel ${side} ${state}">
        <b>${i + 1}. ${esc(st.ceb || st.name)}</b><span>${esc(st.name)} · ${esc(st.level || '')}</span>
        <span class="tnum">${i < cur ? '✓ done' : `${pct}% learned`}${i >= cur && tl[i] ? ' · ' + dateIn(tl[i]) : ''}</span></div></foreignObject>`; }).join('');
  // landmarks: stories (🔓 open / 🔒 not yet) beside the stage they belong to, grammar rules along the first two stages
  const sto = (typeof STORIES !== 'undefined' ? STORIES : []).map((s, i) => ({ s, i, open: !storyMissing(s).length }));
  const stg = s => Math.min(n - 1, Math.max(0, (s.tier || 1) - 1));
  const marks = [];
  sto.forEach((x, k) => { const i = stg(x.s), [px, py] = pts[i], same = sto.filter(y => stg(y.s) === i), j = same.indexOf(x);
    marks.push(`<text class="jmark ${x.open ? 'on' : ''}" x="${px - (same.length - 1) * 11 + j * 22}" y="${py + 64}" text-anchor="middle"><title>${esc(x.s.title)}${x.open ? ' (open)' : ' (not yet)'}</title>${x.open ? x.s.emoji : '🔒'}</text>`); });
  RULES.forEach((r, k) => { const i = Math.min(1, Math.floor(k / Math.ceil(RULES.length / 2))), [px, py] = pts[i], on = ruleLearned(r.id), j = k % Math.ceil(RULES.length / 2);
    marks.push(`<text class="jmark rule ${on ? 'on' : ''}" x="${px + (i % 2 ? 1 : -1) * (48 + (j % 3) * 18)}" y="${py - 40 + Math.floor(j / 3) * 22}" text-anchor="middle"><title>Rule ${r.n}: ${esc(r.title)}${on ? ' (learned)' : ''}</title>📘</text>`); });
  const openN = sto.filter(x => x.open).length, rulesN = RULES.filter(r => ruleLearned(r.id)).length;
  return `<section class="panel"><div class="row spread"><h2>Your road</h2><span class="muted small">Stage ${cur + 1} of ${n}</span></div>
    ${binkoSays(`You're on stop ${cur + 1}, <b>${esc(PATH[cur].name)}</b>. ${esc(PATH[cur].can || '')}`)}
    <div class="jmapwrap"><svg class="jmap" viewBox="0 0 360 ${H}" role="img" aria-label="Your learning path: stage ${cur + 1} of ${n}">
      <path d="${d}" class="jroad"></path><path d="${d}" class="jroad-done" id="jdone"></path>${marks.join('')}${stops}
      <g id="jbinko" class="jbinko"><circle r="17"></circle><image href="icon-192.png?v=full" x="-15" y="-15" width="30" height="30"></image></g></svg></div>
    <div class="jlegend small muted"><span>📘 grammar rule learned (${rulesN} of ${RULES.length})</span><span>🔒 story not open yet, picture = open (${openN} of ${sto.length})</span><span>Faded 📘 = rule still to come</span><span>The ring fills as you learn each stage</span></div></section>`;
}
function wireMap() {
  const { stats, cur } = pathState(), road = $('#jdone'), b = $('#jbinko'); if (!road || !b) return;
  // Binko stands as far along the road as you are: past the finished stops, part way to the next one
  const L = road.getTotalLength(), n = PATH.length, seg = L / (n + 0.4), at = Math.min(L, seg * (0.2 + cur + Math.min(1, stats[cur].frac / PATH_GATE) * 0.98));
  road.style.strokeDasharray = `${at} ${L}`; const p = road.getPointAtLength(at); b.setAttribute('transform', `translate(${p.x} ${p.y})`);
  setTimeout(() => { const s = document.querySelector('.jstop.now'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
}

/* ---------- 2. word web ---------- */
let WEB = null, WEB_FILTER = 'fam';   // families first: the clearest picture; 'All words' shows everything
function webData() {
  // words you know (single words, at least practiced once), their word families (shared root) and look-alike groups
  const ids = Object.keys(S.cards).filter(id => /^[wmgpv]/.test(id) && S.cards[id].b >= 1 && card(id) && tokens(firstAlt(card(id).ceb)).length === 1);
  const nodes = [], byWord = new Map();
  ids.forEach(id => { const c = card(id), w = norm(firstAlt(c.ceb)); if (!w || byWord.has(w)) return; byWord.set(w, nodes.length); nodes.push({ id, w, label: firstAlt(c.ceb).replace(/[.!?]/g, ''), en: firstAlt(c.en), b: S.cards[id].b, known: 1 }); });
  // a few words you don't know yet from the same families, shown faint as "next"
  // a word family: a word you know plus forms built on it with a front (mo-, ni-, gi-, nag-, ka-, pag-...) and/or an
  // ending (-on, -an, -a, -i, -hon, -han). Only exact builds on a real word count, so manong and ninong don't match.
  const PRE = /^(nag|mag|naka|maka|nang|mang|mo|mu|ni|mi|gi|na|ma|pag|pang|ka|ika|ki|i)-?/, SUF = /-?(on|an|a|i|hon|han|ha|non|nan)$/;
  const baseOf = w => { const cands = [w.replace(PRE, ''), w.replace(SUF, ''), w.replace(PRE, '').replace(SUF, '')].filter(x => x !== w && x.length >= 4); return cands; };
  const fam = new Map();   // base word index -> its family members
  const join = (bi, i) => { if (!fam.has(bi)) fam.set(bi, new Set()); fam.get(bi).add(i); };
  nodes.forEach((x, i) => { for (const b of baseOf(x.w)) { const bi = byWord.get(b); if (bi != null && bi !== i) { join(bi, i); break; } } });
  // a few forms you haven't learned yet, built on words you know, shown faint as "next"
  let ghosts = 0;
  for (const id of PATH.flatMap(st => st.ids)) { if (ghosts >= 30) break; if (S.cards[id]) continue; const c = card(id); if (!c || tokens(firstAlt(c.ceb)).length !== 1) continue;
    const w = norm(firstAlt(c.ceb)); if (byWord.has(w)) continue; const b = baseOf(w).find(x => byWord.has(x) && nodes[byWord.get(x)].known); if (!b) continue;
    byWord.set(w, nodes.length); join(byWord.get(b), nodes.length); nodes.push({ id, w, label: firstAlt(c.ceb).replace(/[.!?]/g, ''), en: firstAlt(c.en), b: 0, known: 0 }); ghosts++; }
  const links = [];
  fam.forEach((set, bi) => set.forEach(i => links.push({ a: bi, b: i, k: 'fam' })));
  (typeof MIXUPS !== 'undefined' ? MIXUPS : []).forEach(m => { const ix = (m.w || []).map(w => byWord.get(norm(w))).filter(i => i != null && nodes[i].known); for (let i = 1; i < ix.length; i++) links.push({ a: ix[i - 1], b: ix[i], k: 'mix' }); });
  return { nodes, links };
}
function layoutWeb(data, W0, H0) {
  // a small force layout: linked words pull together, all words push apart, everything drifts to the middle
  const N = data.nodes.length, P = data.nodes.map((_, i) => { const a = i * 2.39996, r = 12 * Math.sqrt(i + 1); return { x: W0 / 2 + r * Math.cos(a), y: H0 / 2 + r * Math.sin(a), vx: 0, vy: 0 }; });
  const iters = N > 250 ? 120 : 220;
  for (let it = 0; it < iters; it++) {
    const cool = 1 - it / iters;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d2 = dx * dx + dy * dy + 0.01; if (d2 > 9000) continue; const f = 140 / d2, fx = dx * f, fy = dy * f; P[i].vx -= fx; P[i].vy -= fy; P[j].vx += fx; P[j].vy += fy; }
    data.links.forEach(l => { const p = P[l.a], q = P[l.b], dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1, want = l.k === 'mix' ? 55 : 38, f = (d - want) * 0.04; p.vx += dx / d * f; p.vy += dy / d * f; q.vx -= dx / d * f; q.vy -= dy / d * f; });
    P.forEach(p => { p.vx += (W0 / 2 - p.x) * 0.006; p.vy += (H0 / 2 - p.y) * 0.006; p.x += p.vx * cool; p.y += p.vy * cool; p.vx *= 0.55; p.vy *= 0.55; });
  }
  const xs = P.map(p => p.x), ys = P.map(p => p.y), pad = 30, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  return { P, box: [minX, minY, Math.max(...xs) + pad - minX, Math.max(...ys) + pad - minY] };
}
function webHtml() {
  const data = webData(), known = data.nodes.filter(x => x.known).length;
  if (known < 3) return `<section class="panel">${binkoSays('Your word web starts growing after your first few lessons. Learn a few words and come back!')}</section>`;
  const fam = data.links.filter(l => l.k === 'fam').length, mix = data.links.filter(l => l.k === 'mix').length;
  return `<section class="panel"><div class="row spread"><h2>Your word web</h2><span class="muted small tnum">${known} words</span></div>
    <p class="small muted" style="margin:0">Every dot is a word you know. Words from the same family (one root: <b>kaon</b>, <b>mokaon</b>, <b>gikaon</b>) are joined by a line; look-alikes you shouldn't mix up are joined by a dashed orange line. Faint dots are family members you haven't learned yet. Tap any word to see it.</p>
    <div class="seg jfilter" style="margin:8px 0">${[['fam', `Word families (${fam})`], ['mix', `Look-alikes (${mix})`], ['all', `All ${known} words`]].map(([k, l]) => `<button class="${WEB_FILTER === k ? 'on' : ''}" data-wf="${k}">${l}</button>`).join('')}</div>
    <div class="jwebwrap" id="jwebwrap"><div class="muted small" style="padding:20px;text-align:center">Drawing your web…</div></div>
    <div class="row" style="gap:6px;margin-top:6px"><button class="btn ghost sm" id="jzin" aria-label="Zoom in">＋</button><button class="btn ghost sm" id="jzout" aria-label="Zoom out">－</button><span class="small muted">Drag to move · darker dots = words you know better</span></div></section>`;
}
function wireWeb() {
  document.querySelectorAll('[data-wf]').forEach(b => b.onclick = () => { WEB_FILTER = b.dataset.wf; render(); });
  const wrap = $('#jwebwrap'); if (!wrap) return;
  setTimeout(() => {
    const all = webData(); let keep = null;
    if (WEB_FILTER !== 'all') { const linked = new Set(); all.links.filter(l => l.k === WEB_FILTER).forEach(l => { linked.add(l.a); linked.add(l.b); }); keep = linked; }
    const idx = all.nodes.map((_, i) => i).filter(i => !keep || keep.has(i)), remap = new Map(idx.map((i, k) => [i, k]));
    const data = { nodes: idx.map(i => all.nodes[i]), links: all.links.filter(l => remap.has(l.a) && remap.has(l.b) && (WEB_FILTER === 'all' || l.k === WEB_FILTER)).map(l => ({ a: remap.get(l.a), b: remap.get(l.b), k: l.k })) };
    if (!data.nodes.length) { wrap.innerHTML = `<div class="muted small" style="padding:20px;text-align:center">${WEB_FILTER === 'mix' ? 'Look-alike pairs show up once you know two words from the same group.' : 'Word families show up as you learn words that share a root.'}</div>`; return; }
    const { P, box } = layoutWeb(data, 600, 600), shade = b => b >= 5 ? 'var(--sea)' : b >= 3 ? 'color-mix(in srgb, var(--sea) 70%, var(--chip))' : b >= 1 ? 'color-mix(in srgb, var(--sea) 40%, var(--chip))' : 'transparent';
    // many words: start zoomed in on the middle so names are readable; zoom out or drag to see the rest
    // open at a readable size (about one unit per screen pixel), centred; zoom out or drag to see the rest
    const [bx, by, bw, bh] = box, view = Math.min(bw, Math.max(300, wrap.clientWidth * 1.15)), vh = view * 1.2;
    WEB = { box: [bx + (bw - view) / 2, by + (bh - Math.min(bh, vh)) / 2, view, Math.min(bh, vh)] }; box.splice(0, 4, ...WEB.box);
    wrap.innerHTML = `<svg class="jweb" id="jweb" viewBox="${box.join(' ')}" role="img" aria-label="Word web of ${data.nodes.length} words">
      ${data.links.map(l => `<line x1="${P[l.a].x.toFixed(1)}" y1="${P[l.a].y.toFixed(1)}" x2="${P[l.b].x.toFixed(1)}" y2="${P[l.b].y.toFixed(1)}" class="jl ${l.k}"></line>`).join('')}
      ${data.nodes.map((x, i) => `<g class="jn ${x.known ? '' : 'ghost'}" data-tok="${esc(x.w)}" transform="translate(${P[i].x.toFixed(1)} ${P[i].y.toFixed(1)})" role="button" tabindex="0"><title>${esc(x.label)} · ${esc(x.en)}${x.known ? '' : ' (not learned yet)'}</title><circle r="${x.known ? 8 : 6}" style="fill:${shade(x.b)}"></circle><text y="-12" text-anchor="middle">${esc(x.label)}</text></g>`).join('')}</svg>`;
    wrap.querySelectorAll('.jn').forEach(g => { g.onclick = () => wordSheet(g.dataset.tok); g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wordSheet(g.dataset.tok); } }; });
    const zoom = f => { const s = $('#jweb'); if (!s) return; const [x, y, w, h] = WEB.box, nw = w / f, nh = h / f; WEB.box = [x + (w - nw) / 2, y + (h - nh) / 2, nw, nh]; s.setAttribute('viewBox', WEB.box.join(' ')); };
    $('#jzin').onclick = () => zoom(1.4); $('#jzout').onclick = () => zoom(1 / 1.4);
    // drag to move around when zoomed in
    const s = $('#jweb'); let drag = null;
    s.addEventListener('pointerdown', e => { if (e.target.closest('.jn')) return; drag = { x: e.clientX, y: e.clientY, box: WEB.box.slice() }; s.setPointerCapture(e.pointerId); });
    s.addEventListener('pointermove', e => { if (!drag) return; const k = WEB.box[2] / s.clientWidth; WEB.box = [drag.box[0] - (e.clientX - drag.x) * k, drag.box[1] - (e.clientY - drag.y) * k, drag.box[2], drag.box[3]]; s.setAttribute('viewBox', WEB.box.join(' ')); });
    s.addEventListener('pointerup', () => drag = null); s.addEventListener('pointercancel', () => drag = null);
  }, 20);
}

/* ---------- 3. then and now ---------- */
function sentencesYouCanSay() {
  // every Bisaya sentence in the app (phrases, examples, conversation lines, practice patterns) whose words you all know
  const kw = knownWords(), seenS = new Set(); let n = 0;
  const ok = s => tokens(s).every(t => { const w = lowTok(t); return !w || /^\d/.test(w) || knownTok(w, kw); });
  const add = s => { const k = norm(firstAlt(s)); if (!k || seenS.has(k) || tokens(k).length < 2) return; seenS.add(k); if (ok(firstAlt(s))) n++; };
  PATH.forEach(st => st.ids.forEach(id => { const c = card(id); if (c && c.kind !== 'r') add(c.ceb); }));
  try { allPatternSentences(false).forEach(x => add(x.ceb)); } catch (e) { }
  try { DIALOGS.forEach(d => d.lines.forEach(l => add(l[1]))); } catch (e) { }
  return n;
}
function thenHtml() {
  const days = Object.keys(S.xp || {}).filter(k => S.xp[k] > 0).length, words = learnedCount(), rules = RULES.filter(r => ruleLearned(r.id)).length;
  const say = sentencesYouCanSay(), stories = typeof storyOpenN === 'function' ? storyOpenN() : 0, convos = (() => { try { const k = knownWords(); return DIALOGS.filter(d => !dlgTokens(d).filter(t => !k.has(t)).length).length; } catch (e) { return 0; } })();
  const start = S.started ? new Date(S.started * 864e5 + new Date().getTimezoneOffset() * 60000 + 12 * 36e5).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Day 1';
  const row = (icon, label, now) => `<div class="jtn"><span class="jti">${icon}</span><span class="jtl">${label}</span><span class="jt0 tnum">0</span><span class="jtar">→</span><b class="jt1 tnum">${now}</b></div>`;
  // words you used to get wrong and now know well
  const fixed = Object.keys(S.cards).filter(id => S.cards[id].w >= 1 && S.cards[id].b >= 3 && card(id) && id[0] !== 'r').sort((a, b) => S.cards[b].w - S.cards[a].w).slice(0, 8).map(card);
  // growth line from the daily snapshots (and the XP you earned each day before snapshots started)
  const hist = Object.entries(S.hist || {}).map(([d, h]) => [+d, h.w]).sort((a, b) => a[0] - b[0]);
  const xp = Object.entries(S.xp || {}).map(([d, v]) => [+d, v]).sort((a, b) => a[0] - b[0]).slice(-60);
  return `<section class="panel"><div class="row spread"><h2>${esc(start)} → today</h2><span class="muted small">${days} day${days === 1 ? '' : 's'} practiced</span></div>
    <div class="jthen"><div class="jtn head small muted"><span></span><span></span><span>then</span><span></span><span>now</span></div>
      ${row('🍌', 'Words you know', words)}${row('📘', 'Grammar rules', rules)}${row('💬', 'Sentences you could say', say)}${row('📖', 'Binko stories open', stories)}${row('🗣️', 'Conversations you can follow', convos)}</div>
    ${binkoSays(say ? `On day 1 you couldn't say a single Bisaya sentence. Now there are <b>${say}</b> sentences in this app you know every word of.` : 'Every word you learn adds to the sentences you can say. Keep going!')}</section>
  ${xp.length >= 2 ? `<section class="panel"><h2>Your practice, day by day</h2>${barChart(xp)}<div class="small muted">XP each day you practiced (last ${xp.length} days)</div></section>` : ''}
  ${hist.length >= 2 ? `<section class="panel"><h2>Words learned over time</h2>${lineChart(hist)}<div class="small muted">Counted each day from ${new Date(hist[0][0] * 864e5 + 12 * 36e5).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div></section>` : ''}
  ${fixed.length ? `<section class="panel"><h2>You used to miss these</h2><p class="small muted" style="margin:0">Words you got wrong before and know well now. Tap one to see it.</p>
    <div class="wbw" style="margin-top:8px">${fixed.map(c => `<button class="wb" data-tok="${esc(firstAlt(c.ceb).replace(/[.!?]/g, ''))}"><b>${esc(firstAlt(c.ceb))}</b><i>${esc(firstAlt(c.en))} · missed ${S.cards[c.id].w}×</i></button>`).join('')}</div></section>` : ''}`;
}
function barChart(pts) {
  const W0 = 320, H0 = 90, max = Math.max(...pts.map(p => p[1]), 1), bw = W0 / pts.length;
  return `<svg class="jchart" viewBox="0 0 ${W0} ${H0 + 14}" role="img" aria-label="XP per day">${pts.map(([d, v], i) => `<rect x="${(i * bw + 1).toFixed(1)}" y="${(H0 - v / max * H0).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${(v / max * H0).toFixed(1)}" rx="2"><title>${v} XP</title></rect>`).join('')}<line x1="0" y1="${H0}" x2="${W0}" y2="${H0}" class="jaxis"></line></svg>`;
}
function lineChart(pts) {
  const W0 = 320, H0 = 90, d0 = pts[0][0], d1 = pts[pts.length - 1][0] || d0 + 1, max = Math.max(...pts.map(p => p[1]), 1);
  const xy = pts.map(([d, v]) => [((d - d0) / Math.max(1, d1 - d0)) * (W0 - 10) + 5, H0 - v / max * (H0 - 10)]);
  return `<svg class="jchart" viewBox="0 0 ${W0} ${H0 + 14}" role="img" aria-label="Words learned over time"><polyline points="${xy.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" class="jline"></polyline>${xy.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5"><title>${pts[i][1]} words</title></circle>`).join('')}<text x="${W0 - 4}" y="12" text-anchor="end" class="jlab">${max}</text><line x1="0" y1="${H0}" x2="${W0}" y2="${H0}" class="jaxis"></line></svg>`;
}
function wireThen() { }
