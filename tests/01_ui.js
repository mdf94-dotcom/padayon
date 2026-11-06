'use strict';
/* Clicks through the app with real clicks at phone and desktop size and records errors and layout problems. Screenshots go to tests/shots. */
const fs = require('fs'), path = require('path');
const { open, serve, chromium, Report } = require('./lib');
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const LAYOUT = () => {
  const W = innerWidth, H = innerHeight, out = [], vis = el => { if (el.closest('details:not([open])')) return false; const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0; };
  if (document.documentElement.scrollWidth > W + 1) out.push(`page scrolls sideways by ${document.documentElement.scrollWidth - W}px`);
  const name = el => (el.id ? '#' + el.id : '') + '.' + String(el.className || '').split(' ')[0] + ' "' + (el.textContent || '').trim().slice(0, 24) + '"';
  document.querySelectorAll('#app button, #app input, #app a, #app .opt, #app .tile').forEach(el => { if (!vis(el)) return; const r = el.getBoundingClientRect(); if (r.right > W + 1 || r.left < -1) out.push('off the side: ' + name(el)); if (r.width < 24 || r.height < 24) out.push('tiny tap target: ' + name(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`); });
  // text cut off
  document.querySelectorAll('#app button, #app .opt, #app h1, #app h2, #app b, #app .ceb, #app .prompt, #app .tile, #app .verdict').forEach(el => { if (!vis(el)) return; const s = getComputedStyle(el); if ((s.overflowX === 'hidden' || s.overflow === 'hidden' || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) out.push('text cut off: ' + name(el)); });
  // mute button over something you can tap
  const m = document.querySelector('#mutebtn'); if (m && vis(m)) { const a = m.getBoundingClientRect(); document.querySelectorAll('#app button, #app input').forEach(el => { if (!vis(el)) return; const b = el.getBoundingClientRect(); if (a.left < b.right - 2 && a.right > b.left + 2 && a.top < b.bottom - 2 && a.bottom > b.top + 2) out.push('mute button covers ' + name(el)); }); }
  // overlaps between sibling tappables
  const tap = [...document.querySelectorAll('#app .opt, #app .btn, #app .tile')].filter(vis); for (let i = 0; i < tap.length; i++) for (let j = i + 1; j < tap.length; j++) { if (tap[i].contains(tap[j]) || tap[j].contains(tap[i])) continue; const a = tap[i].getBoundingClientRect(), b = tap[j].getBoundingClientRect(); if (a.left < b.right - 2 && a.right > b.left + 2 && a.top < b.bottom - 2 && a.bottom > b.top + 2) out.push('overlap: ' + name(tap[i]) + ' / ' + name(tap[j])); }
  // the main action must be reachable: on screen or scrollable to
  const main = document.querySelector('#chk, #cont, #nx, #gnext, #start'); if (main && vis(main)) { main.scrollIntoView({ block: 'nearest' }); const r = main.getBoundingClientRect(); if (r.bottom > H + 1 || r.top < 0) out.push('main button out of reach: ' + name(main)); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (t && !main.contains(t) && !t.contains(main) && document.documentElement.scrollHeight <= H) out.push('main button covered by ' + name(t)); }
  return [...new Set(out)];
};
async function walk(page, label, log, R) {
  const seen = {}; let n = 0;
  const check = async (step, shot) => { const l = await page.evaluate(LAYOUT); l.forEach(p => { const k = p.replace(/"[^"]*"/, '""'); (seen[k] = seen[k] || []).push(step); }); if (shot) await page.screenshot({ path: path.join(SHOTS, `${label}-${String(n++).padStart(2, '0')}-${step}.png`) }); };
  const click = async sel => { await page.click(sel, { timeout: 6000 }); await page.waitForTimeout(40); };
  // first-run tutorial
  await page.waitForSelector('#gnext'); let guard = 0;
  while (await page.locator('#gnext').count() && guard++ < 20) { await check('guide' + guard, guard === 2 || guard === 8); await click('#gnext'); }
  // placement test: first round right is too hard to arrange, so click through it
  guard = 0; while (await page.locator('#pldk').count() && guard++ < 10) { await check('placement', guard === 1); await click('#pldk'); await page.waitForTimeout(300); }
  await check('placement-end', true); if (await page.locator('#pldone').count()) await click('#pldone');
  await page.waitForSelector('#start'); await check('home', true);
  // a full daily session
  await click('#start'); await page.waitForFunction(() => view === 'session', null, { timeout: 8000 });
  guard = 0; let wrongEvery = 0;
  while (await page.evaluate(() => view === 'session') && guard++ < 150) {
    const type = await page.evaluate(() => Q[qi].type); await check('q-' + type, guard % 9 === 1);
    wrongEvery++; const right = wrongEvery % 3 !== 0;
    if (await page.locator('#ans').count()) { const v = await page.evaluate(([r]) => r ? firstAlt(card(Q[qi].id).ceb) : 'zzzz', [right]); await page.fill('#ans', v); await click('#chk'); }
    else if (await page.locator('#ex .opt').count()) { const opts = page.locator('#ex .opt'); await opts.nth(0).click(); await click('#chk'); }
    else if (await page.locator('#bank .tile').count()) { await page.locator('#bank .tile').nth(0).click(); await click('#chk'); }
    else if (await page.locator('#show').count()) { await click('#show'); await page.locator('[data-q]').nth(right ? 0 : 2).click(); }
    await page.waitForTimeout(20); await check('answered-' + type, guard === 3 || guard === 4);
    await page.locator('#cont').click({ timeout: 6000 }); await page.waitForTimeout(20);
  }
  R.ok(guard < 150, label + ': session ended'); await check('summary', true);
  R.ok(await page.evaluate(() => view === 'summary' && !!planDay().session), label + ': session ticked');
  await page.evaluate(() => { view = 'home'; render(); }); await check('home-after', true);
  // give the learner enough words to open every practice mode
  await page.evaluate(() => { const t = today(); PATH.flatMap(s => s.ids).slice(0, 700).forEach(id => { if (card(id) && !S.cards[id]) S.cards[id] = { b: 3, d: t + 5, r: 3, w: 0 }; }); S.rules = S.rules || {}; RULES.forEach((r, i) => { S.rules[r.id] = { ok: 1, d: t - 3 }; S.cards['r' + i] = { b: 3, d: t + 5, r: 3, w: 0 }; }); save(); });
  const tab = async k => { await page.evaluate(k => { view = k; render(); }, k); await page.waitForTimeout(40); };
  for (const k of ['practice', 'rushhome', 'board', 'me', 'home']) { await tab(k); await check('tab-' + k, true); }
  // speed
  await tab('speed'); await check('speed', true); await click('#go'); await page.waitForTimeout(150); await check('speed-q', true);
  await page.locator('.opt').first().click(); await page.waitForTimeout(40); await check('speed-a', true); await click('#cont'); await page.waitForTimeout(120); await click('#quit'); await page.waitForTimeout(80); await check('speed-end', true);
  // dictation
  await tab('practice'); await click('#dictgo'); await page.waitForTimeout(80); await check('dict', true); await page.fill('#ans', 'zzz'); await click('#chk'); await check('dict-a'); await click('#cont'); await page.click('#quit'); await page.waitForTimeout(60); await check('dict-end');
  // shadowing
  await tab('shadow'); await page.waitForTimeout(60); await check('shadow', true); if (await page.locator('[data-u]').count()) { await page.locator('[data-u]').first().click(); await page.waitForTimeout(150); await check('shadow-run', true); await click('#quit'); }
  await tab('home');
  // conversations
  await tab('convos'); await page.waitForTimeout(80); await check('convo', true); for (let i = 0; i < 40 && await page.locator('#nx').count(); i++) await click('#nx'); await check('convo-part', true); await tab('home');
  // stories
  await tab('stories'); await check('stories', true); if (await page.locator('[data-story]').count()) { await page.locator('[data-story]').first().click(); await page.waitForTimeout(40); await check('story', true); for (let i = 0; i < 40 && await page.locator('#nx').count(); i++) { await click('#nx'); if (await page.evaluate(() => ST && ST.phase === 'quiz')) break; } await check('story-quiz', true); }
  await tab('rules'); await check('rules'); await tab('real'); await check('real', true); await tab('gaps'); await check('gaps', true);
  // numbers
  await tab('numbers'); await page.waitForTimeout(80); await check('numbers', true); const nb = page.locator('#app button:not(.x)'); if (await nb.count()) { await nb.first().click(); await page.waitForTimeout(100); await check('numbers-q', true); }
  // build
  await page.evaluate(() => startBuild()); await page.waitForTimeout(60); await check('build', true); await tab('home');
  // games
  await tab('rushhome'); await click('#rushplay'); await page.waitForTimeout(150); await check('rush-q', true); await page.locator('.opt').first().click(); await page.waitForTimeout(900); await check('rush-a', true); await page.evaluate(() => { clearInterval(timerH); view = 'home'; render(); });
  await tab('rushhome'); await click('#geoprovp'); await page.waitForTimeout(500); await check('geo-prov', true); await page.evaluate(() => { clearInterval(timerH); view = 'home'; render(); });
  await tab('rushhome'); await click('#geostudy'); await page.waitForTimeout(500); await check('geo-study', true); await page.evaluate(() => { view = 'home'; render(); });
  Object.entries(seen).forEach(([k, s]) => R.note(`${label}: ${k}  [${[...new Set(s)].slice(0, 5).join(', ')}]`));
  R.ok(!log.pageErrors.length, `${label}: page errors ` + JSON.stringify(log.pageErrors.slice(0, 5))); R.ok(!log.console.length, `${label}: console errors ` + JSON.stringify(log.console.slice(0, 5)));
}
(async () => {
  const R = new Report('ui'); const base = await serve(), browser = await chromium.launch();
  for (const [label, viewport] of [['phone', { width: 390, height: 844 }], ['small', { width: 320, height: 568 }], ['desktop', { width: 1280, height: 800 }]].filter(x => !process.argv[2] || x[0] === process.argv[2])) {
    const s = await open({ base, browser, viewport }); try { await walk(s.page, label, s.log, R); } catch (e) { R.ok(false, label + ': walk stopped: ' + String(e.message).replace(/\s+/g,' ').slice(0,420) + ' at view ' + await s.page.evaluate(() => view + ' ' + (Q[qi] || {}).type).catch(() => '?')); await s.page.screenshot({ path: path.join(SHOTS, label + '-stopped.png') }); } await s.close();
  }
  await browser.close(); base.close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
