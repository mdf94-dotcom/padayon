'use strict';
/* Content integrity across every card: blank text, hidden cards, word-by-word meanings, examples, duplicates, typing the shown answer. */
const { open, ready, Report } = require('./lib');
(async () => {
  const R = new Report('content'); const { page, log, close } = await open(); await ready(page);
  const x = await page.evaluate(() => {
    const allIds = [...P.map((_, i) => 'p' + i), ...W.map((_, i) => 'w' + i), ...MEGA.map((_, i) => 'm' + i), ...EXTRA.map((_, i) => 'e' + i), ...G.map((_, i) => 'g' + i), ...F.map((_, i) => 'f' + i), ...D_ORDER, ...RULES.map((_, i) => 'r' + i), ...VARIANTS.map((_, i) => 'v' + i)];
    const cards = allIds.map(id => [id, card(id)]).filter(x => x[1]), out = { total: allIds.length, live: cards.length };
    const bad = s => s == null || !String(s).trim() || /undefined|null|NaN|\[object/.test(String(s));
    out.blank = cards.filter(([, c]) => bad(c.ceb) || bad(c.en)).map(([id, c]) => [id, c.ceb, c.en]);
    out.hiddenLive = [...HIDE].filter(id => card(id));
    out.pathHidden = PATH.flatMap(s => s.ids).filter(id => HIDE.has(id));
    const pathIds = PATH.flatMap(s => s.ids); out.pathDup = pathIds.filter((id, i) => pathIds.indexOf(id) !== i);
    out.unplaced = allIds.filter(id => id[0] !== 'r' && card(id) && !pathIds.includes(id));
    // word by word: every token needs a meaning
    const noGloss = new Map(); cards.filter(([id]) => id[0] !== 'r').forEach(([id, c]) => { const t = tokens(c.ceb).filter(t => /[a-z0-9]/i.test(t)); if (t.length >= 2) t.forEach(w => { if (!glossOf(w)) { const k = lowTok(w); noGloss.set(k, (noGloss.get(k) || []).concat(id)); } }); });
    out.noGloss = [...noGloss.entries()].map(([w, ids]) => [w, ids.length, ids[0]]).sort((a, b) => b[1] - a[1]);
    // same Bisaya and same English on two cards
    const seen = new Map(); out.dups = []; cards.filter(([id]) => id[0] !== 'r').forEach(([id, c]) => { const k = norm(firstAlt(c.ceb)) + '|' + norm(firstAlt(c.en)); if (seen.has(k)) out.dups.push([seen.get(k), id, firstAlt(c.ceb), firstAlt(c.en)]); else seen.set(k, id); });
    // the displayed answer, typed as shown, must count as exactly right
    out.typeFail = cards.filter(([id]) => id[0] !== 'r').filter(([, c]) => { const g = norm(firstAlt(c.ceb)); return ![c.ceb, ...(c.also || [])].flatMap(alts).includes(g); }).map(([id, c]) => [id, c.ceb]);
    out.gluedWords = cards.filter(([id]) => id[0] !== 'r').filter(([, c]) => /[a-z][,.][a-z]/i.test(firstAlt(c.ceb)) && !/\b[A-Z]\.[A-Z]\./.test(c.ceb)).map(([id, c]) => [id, c.ceb]);
    // recordings: what a card plays vs what it shows
    const rec = id => { const c = card(id); return c && IDX[id] && (id[0] === 'p' ? P[+id.slice(1)][0] : W[+id.slice(1)][0]); };
    out.recordingDiffers = Object.keys(IDX).filter(id => { const c = card(id), r = rec(id); return c && !RECORDING_OFF.has(id) && norm(firstAlt(c.ceb)) !== norm(firstAlt(r)) && !RECORDING_OFF.has(id); }).map(id => [id, rec(id), card(id).ceb, card(id).audio]);
    out.noSound = cards.filter(([id, c]) => id[0] !== 'r' && !c.audio && !hasVoice(c.ceb)).map(([id, c]) => [id, firstAlt(c.ceb)]);
    out.exNoSound = Object.entries(typeof EXAMPLES !== 'undefined' ? EXAMPLES : {}).filter(([, e]) => e && e[0] && !hasVoice(e[0]) && !nativeUrl(e[0])).map(([id, e]) => [id, e[0]]);
    out.exBad = Object.entries(EXAMPLES).filter(([id, e]) => !e || !e[0] || !e[1] || bad(e[0]) || bad(e[1])).map(([id]) => id);
    out.exNoWord = Object.entries(EXAMPLES).filter(([id, e]) => { const c = card(id); if (!c || !e[0]) return false; const own = tokens(firstAlt(c.ceb)).map(lowTok), ex = tokens(e[0]).map(lowTok); return !own.some(t => ex.includes(t) || knownTok(t, new Set(ex))); }).map(([id, e]) => [id, firstAlt(card(id).ceb), e[0]]);
    out.storyEmpty = STORIES.flatMap((s, i) => s.lines.filter(l => bad(l[0]) || bad(l[1])).map(() => i));
    out.storyQ = STORIES.flatMap((s, i) => s.q.filter(q => new Set(q.a.map(norm)).size !== q.a.length).map(q => [i, q.q]));
    out.ruleQ = RULES.flatMap(r => r.quiz.filter(q => new Set(q.a.map(norm)).size !== q.a.length).map(q => [r.id, q.q]));
    out.patDecoyEqual = allPatternSentences().filter(s => s.decoys.some(d => norm(d) === norm(s.ceb))).length;
    out.mixups = MIXUPS.flatMap((m, i) => { const n = []; if (!m.title || !m.rule) n.push('no title'); if (!(m.ok || []).length) n.push('no ok'); return n.map(t => [i, t]); });
    const fx = (name, obj, fn) => Object.keys(obj).filter(id => !fn(id)).map(id => name + ':' + id);
    out.orphanFixes = [...fx('EN_FIX', EN_FIX, id => card0(id) !== undefined && card0(id) !== null || HIDE.has(id)), ...fx('CEB_FIX', CEB_FIX, id => card0(id) || HIDE.has(id)), ...fx('EXAMPLES', EXAMPLES, id => card0(id) || HIDE.has(id)), ...fx('PIC', PIC, id => card0(id) || HIDE.has(id)), ...fx('GNOTES', GNOTES, id => card0(id) || HIDE.has(id))];
    out.noteUndefined = cards.filter(([, c]) => /undefined/.test(String(c.note || ''))).map(([id]) => id);
    out.counts = { hide: HIDE.size, variants: VARIANTS.length, examples: Object.keys(EXAMPLES).length };
    return out;
  });
  const show = (k, n = 12) => console.log(`  ${k}: ${x[k].length}`, JSON.stringify(x[k].slice(0, n)));
  console.log('  cards', x.total, 'live', x.live, JSON.stringify(x.counts));
  R.ok(!x.gluedWords.filter(g => g[0] !== 'm1740').length, 'words glued together by a comma: ' + JSON.stringify(x.gluedWords)); R.ok(!x.blank.length, 'cards with blank/undefined text: ' + JSON.stringify(x.blank.slice(0, 10)));
  R.ok(!x.hiddenLive.length, 'hidden cards still live');
  R.ok(!x.pathDup.length, 'duplicate ids on the path: ' + x.pathDup.slice(0, 8));
  R.ok(!x.unplaced.length, 'cards not on the path: ' + x.unplaced.slice(0, 8));
  R.ok(!x.typeFail.length, 'typing the shown answer fails: ' + JSON.stringify(x.typeFail.slice(0, 10)));
  R.ok(!x.exBad.length, 'broken examples: ' + x.exBad.slice(0, 10));
  R.ok(!x.storyEmpty.length, 'story lines blank'); R.ok(!x.storyQ.length, 'story quiz with duplicate answers'); R.ok(!x.ruleQ.length, 'rule quiz with duplicate answers: ' + JSON.stringify(x.ruleQ));
  R.ok(!x.patDecoyEqual, 'pattern decoys equal to the answer'); R.ok(!x.noteUndefined.length, 'notes containing undefined');
  ['gluedWords', 'noGloss', 'dups', 'recordingDiffers', 'noSound', 'exNoSound', 'exNoWord', 'pathHidden', 'orphanFixes', 'mixups'].forEach(k => show(k));
  require('fs').writeFileSync(require('path').join(__dirname, 'content-report.json'), JSON.stringify(x, null, 1));
  R.ok(!log.pageErrors.length, 'page errors: ' + log.pageErrors);
  await close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
