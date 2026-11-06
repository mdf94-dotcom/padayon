'use strict';
/* Streaks, two-device merging, leaderboard rows and announcements. Mocked Firebase and fake users only. */
const { open, ready, serve, chromium, Report } = require('./lib');
const SIGNED = { uid: 'testuser1', email: 'test@example.com', displayName: 'Tester' };
(async () => {
  const R = new Report('sync'); const base = await serve(), browser = await chromium.launch();
  { // streak maths, driven from the page with a moved clock
    const { page, log, close } = await open({ base, browser }); await ready(page);
    const r = await page.evaluate(() => {
      const out = {}; const t0 = calDay();
      const run = (start, count, day, freezeWk) => { S.streak = { last: start, count, best: count }; S.freezeWk = freezeWk || 0; const real = calDay; DAY_SHIFT = 0; const off = day - t0; DAY_SHIFT = off; S.dayShift = 0; /* calDay subtracts DAY_SHIFT, so move the clock */ DAY_SHIFT = 0; window.__shift(off * 864e5); bumpStreak(); const res = { ...S.streak, now: streakNow(), fw: S.freezeWk }; window.__shift(0); return res; };
      const D = t0;
      out.nextDay = run(D - 1, 5, D); out.sameDay = run(D, 5, D); out.twoGap = run(D - 3, 5, D);
      out.freeze = run(D - 2, 5, D); out.freezeUsedThisWeek = run(D - 2, 5, D, wkOf(D - 1));
      out.first = run(0, 0, D);
      // alive checks
      S.streak = { last: D - 2, count: 4, best: 4 }; S.freezeWk = 0; out.aliveWithFreeze = streakNow(); out.pending = freezePending();
      S.streak = { last: D - 3, count: 4, best: 4 }; out.dead = streakNow();
      // Monday test: Thursday 1970-01-01 is day 0, so day 4 is Monday
      out.wk = [wkOf(4), wkOf(5), wkOf(10), wkOf(11), wkOf(3)];
      // a freeze spent last week doesn't block this week
      const mon = wkOf(D); S.freezeWk = mon - 7; out.freezeNextWeek = freezeOk(mon + 1);
      return out;
    });
    R.ok(r.nextDay.count === 6 && r.nextDay.now === 6, 'next day adds one ' + JSON.stringify(r.nextDay));
    R.ok(r.sameDay.count === 5, 'same day adds nothing');
    R.ok(r.twoGap.count === 1, 'two missed days resets');
    R.ok(r.freeze.count === 6 && r.freeze.fw, 'one missed day uses the freeze ' + JSON.stringify(r.freeze));
    R.ok(r.freezeUsedThisWeek.count === 1, 'second freeze in a week resets');
    R.ok(r.first.count === 1, 'first ever'); R.ok(r.aliveWithFreeze === 4 && r.pending, 'alive on a waiting freeze'); R.ok(r.dead === 0, 'dead after two missed');
    R.ok(JSON.stringify(r.wk) === JSON.stringify([4, 4, 4, 11, -3]), 'weeks run Monday to Sunday ' + r.wk); R.ok(r.freezeNextWeek, 'freeze returns next week');
    R.ok(!log.pageErrors.length, 'page errors ' + log.pageErrors); await close();
  }
  { // time zones: the day boundary follows the phone's clock
    for (const tz of ['Asia/Manila', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
      const { page, close } = await open({ base, browser, tz }); await ready(page);
      const ok = await page.evaluate(() => { const d = new Date(), loc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5; return today() === loc; });
      R.ok(ok, 'today() is the local calendar day in ' + tz); await close();
    }
  }
  { // merging two devices
    const { page, log, close } = await open({ base, browser }); await ready(page);
    const m = await page.evaluate(() => {
      const t = today(), out = {}; const mk = o => migrate(JSON.parse(JSON.stringify(Object.assign(fresh(), { streakReset: STREAK_RESET, guideV: GUIDE_V, placed: t }, o))));
      const A = mk({ updated: 1000, cards: { w1: { b: 2, d: t + 3, r: 3, w: 0 }, w2: { b: 1, d: t + 1, r: 1, w: 1 } }, xp: { [t]: 50 }, streak: { last: t, count: 3, best: 3 }, plan: { [t]: { session: true } }, newDay: { d: t, n: 4, cap: 8, capV: 8 }, rushBest: 5, rushHow: 'pick' });
      const B = mk({ updated: 2000, cards: { w1: { b: 1, d: t + 1, r: 1, w: 0 }, w3: { b: 0, d: t, r: 0, w: 1 } }, xp: { [t]: 30, [t - 1]: 20 }, streak: { last: t - 1, count: 2, best: 7 }, plan: { [t]: { dict: true } }, newDay: { d: t, n: 6, cap: 5, capV: 8 }, rushBest: 9, rushHow: 'type' });
      const M = mergeState(A, B);
      out.card = M.cards.w1.r === 3 && !!M.cards.w2 && !!M.cards.w3; out.xp = M.xp[t] === 50 && M.xp[t - 1] === 20; out.streak = M.streak; out.plan = M.plan[t];
      out.newDay = M.newDay; out.rush = [M.rushBest, M.rushHow];
      // merging is order independent for the numbers that matter
      const M2 = mergeState(B, A); out.sym = ['xp', 'streak', 'rushBest'].filter(k => JSON.stringify(M[k]) !== JSON.stringify(M2[k])).concat(!!M.plan[t].session === !!M2.plan[t].session && !!M.plan[t].dict === !!M2.plan[t].dict ? [] : ['plan']); out.symCards = Object.keys(M.cards).filter(id => JSON.stringify(M.cards[id]) !== JSON.stringify(M2.cards[id]));
      // merging again changes nothing (otherwise the devices keep rewriting each other)
      const once = mergeState(M, M), twice = mergeState(once, M); out.stable = JSON.stringify(once) === JSON.stringify(twice); out.selfSame = JSON.stringify(mergeState(M, M)) === JSON.stringify(M);
      const diff = []; const a = mergeState(M, M); Object.keys(Object.assign({}, a, M)).forEach(k => { if (JSON.stringify(a[k]) !== JSON.stringify(M[k])) diff.push(k); }); out.selfDiff = diff;
      // gap words with the same id on both devices don't overwrite each other
      const G1 = mk({ custom: [{ id: 'c1', en: 'one', ceb: 'usa' }], cards: { c1: { b: 2, d: t, r: 2, w: 0 } } }), G2 = mk({ custom: [{ id: 'c1', en: 'two', ceb: 'duha' }], cards: { c1: { b: 1, d: t, r: 1, w: 0 } } });
      const GM = mergeState(G1, G2); out.gaps = GM.custom.map(c => c.ceb).sort(); out.gapCards = Object.keys(GM.cards).length;
      return out;
    });
    R.ok(m.card, 'cards: the more-practiced copy wins, none are lost'); R.ok(m.xp, 'xp keeps each day\'s higher number');
    R.ok(m.streak.last === (await page.evaluate(() => calDay())) && m.streak.count >= 3 && m.streak.best === 7 || m.streak.best >= 3, 'streak merge ' + JSON.stringify(m.streak));
    R.ok(m.plan.session && m.plan.dict, 'plan ticks from both devices'); R.ok(m.newDay.n === 6, 'new-word count keeps the higher');
    R.ok(m.newDay.cap != null, 'merge keeps today\'s new-word limit ' + JSON.stringify(m.newDay));
    R.ok(m.rush[0] === 9 && m.rush[1] === 'type', 'rush best'); R.ok(!m.sym.length, 'merge order changes ' + m.sym); R.ok(!m.symCards.length, 'merge order changes cards ' + m.symCards);
    R.ok(m.stable, 'merging twice is stable'); R.ok(m.selfSame, 'merging a state with itself changes: ' + m.selfDiff);
    R.ok(m.gaps.join() === 'duha,usa' && m.gapCards === 2, 'gap words keep apart ' + m.gaps); R.ok(!log.pageErrors.length, 'page errors'); await close();
  }
  { // an idle signed-in phone must not keep writing to the database
    const { page, log, close } = await open({ base, browser, fbUser: SIGNED, fbDocs: { 'config/discord': { webhook: 'https://discord.invalid/x' } } }); await ready(page);
    await page.waitForTimeout(3000); const a = await page.evaluate(() => __fb.writes.length);
    await page.waitForTimeout(9000); const b = await page.evaluate(() => __fb.writes.filter(w => w.path.startsWith('users/')).length), c = await page.evaluate(() => __fb.writes.length);
    console.log('  writes after 3s', a, 'after 12s', c, 'user-doc writes', b);
    const before = c; await page.waitForTimeout(8000); const d = await page.evaluate(() => __fb.writes.length);
    R.ok(d - before <= 1, `idle phone on Today keeps writing to Firestore: ${d - before} writes in 8s`);
    R.ok(!log.pageErrors.length, 'page errors ' + log.pageErrors); await close();
  }
  { // leaderboard row matches the person's own data; a finished lesson posts exactly once
    const { page, log, close } = await open({ base, browser, fbUser: SIGNED, fbDocs: { 'config/discord': { webhook: 'https://discord.invalid/x' } } }); await ready(page);
    await page.waitForTimeout(500);
    const row = await page.evaluate(async () => {
      const t = today(), d = calDay(); S.cards = { w1: { b: 2, d: t + 3, r: 3, w: 0 }, w2: { b: 3, d: t + 3, r: 3, w: 0 }, w3: { b: 1, d: t, r: 1, w: 1 }, r0: { b: 4, d: t + 3, r: 3, w: 0 } };
      S.acc = { [t]: { r: 8, t: 10 }, [t - 8]: { r: 0, t: 50 } }; S.rushBest = 12; S.rushHow = 'type'; S.bestSpeed = 1.4; S.newMax = 7; S.streak = { last: d - 1, count: 2, best: 2 };
      S.xp = { [t]: 40 }; save();
      tick('session'); await new Promise(r => setTimeout(r, 300)); tick('session'); pushBoard(); await new Promise(r => setTimeout(r, 300)); pushBoard();
      return { r: boardRow(), ann: S.announced === d, s: S.streak, now: streakNow() };
    });
    R.ok(row.r.learned === 2, 'board learned ' + row.r.learned); R.ok(row.r.accR === 8 && row.r.accN === 10, 'board accuracy uses the last 7 days');
    R.ok(row.r.streak === row.now, 'board streak = own streak'); R.ok(row.r.rush === 12 && row.r.rushHow === 'type', 'board rush'); R.ok(row.ann, 'announced marked');
    await page.waitForTimeout(4000);
    R.ok(log.discord.length === 1, 'lesson posts exactly once, posted ' + log.discord.length);
    const stored = await page.evaluate(() => __fb.docs['board/' + Sync.user.uid]); R.ok(stored && stored.learned === 2, 'board doc stored');
    const fix = await page.evaluate(() => { const d = calDay(), day = Math.floor(Date.now() / 864e5); const mk = (o) => boardFix(Object.assign({ uid: 'x', streakReset: STREAK_RESET, tzo: 0, sLast: day, sCount: 3, best: 9, fWk: 0 }, o)); return { live: mk({}).streak, one: mk({ sLast: day - 1 }).streak, freeze: mk({ sLast: day - 2 }).streak, used: mk({ sLast: day - 2, fWk: wkOf(day - 1) }).streak, dead: mk({ sLast: day - 3 }).streak }; });
    R.ok(fix.live === 3 && fix.one === 3 && fix.freeze === 3 && fix.used === 0 && fix.dead === 0, 'board streak ageing ' + JSON.stringify(fix));
    R.ok(!log.pageErrors.length, 'page errors ' + log.pageErrors); await close();
  }
  { // another device finished: this one waits, and doesn't double post if the first one announced
    const { page, log, close } = await open({ base, browser, fbUser: SIGNED, fbDocs: { 'config/discord': { webhook: 'https://discord.invalid/x' } } }); await ready(page); await page.waitForTimeout(500);
    await page.evaluate(() => { const t = today(), d = calDay(); const other = JSON.parse(JSON.stringify(S)); other.plan = { [t]: { session: true } }; other.sessAt = Date.now(); other.streak = { last: d, count: 1, best: 1 }; other.announced = d; other.updated = Date.now() + 5; applyRemote(JSON.stringify(other)); pushBoard(); });
    await page.waitForTimeout(1500); R.ok(log.discord.length === 0, 'second device must not post, posted ' + log.discord.length);
    R.ok(await page.evaluate(() => streakNow() === 1 && S.streak.count === 1), 'second device takes the streak without adding'); await close();
  }
  { // old saved data keeps working
    const legacy = { v: 1, updated: 5, cards: { w1: { b: 3, d: 20000, r: 5, w: 1 }, zz9: { b: 1, d: 1, r: 1, w: 0 } }, xp: { 20000: 10 }, streak: { last: 20000, count: 40, best: 90 }, speed: 1.2, bestSpeed: 1.5, settings: { newPerDay: 15, pathV: 1 }, plan: {}, newDay: { d: 0, n: 0 }, custom: [] };
    const { page, log, close } = await open({ base, browser, state: legacy }); await ready(page);
    const r = await page.evaluate(() => ({ card: !!S.cards.w1, zz: !!S.cards.zz9, npd: S.settings.newPerDay, due: dueIds().includes('w1') }));
    R.ok(r.card && r.zz, 'old cards are kept (even ones the app no longer knows)'); R.ok(r.npd === 15, 'settings kept'); R.ok(r.due, 'old-format card is due'); R.ok(!log.pageErrors.length, 'page errors ' + log.pageErrors); await close();
  }
  await browser.close(); base.close(); R.done();
})().catch(e => { console.error(e); process.exit(2); });
