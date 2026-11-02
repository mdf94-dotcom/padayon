'use strict';
/* Background music, made live in the browser (no recordings, nothing to download).
   'calm': a soft marimba-and-pad loop for lessons and practice.
   'rush': an upbeat loop for Padayon Rush that speeds up as your run gets longer.
   It ducks to almost nothing whenever a Bisaya clip or the phone's voice is speaking, so it never covers a word. */
const Music = (() => {
  let echoIn = null, ctx = null, master = null, duckG = null, mode = 'off', timer = null, step = 0, nextT = 0, bpm = 80, want = 'off', ducked = false;
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  // chord roots and shapes (MIDI numbers)
  const CALM = [[60, [0, 4, 7]], [57, [0, 3, 7]], [53, [0, 4, 7]], [55, [0, 4, 7]]];          // C  Am F  G
  const RUSH = [[57, [0, 3, 7]], [53, [0, 4, 7]], [60, [0, 4, 7]], [55, [0, 4, 7]]];          // Am F  C  G
  const PENTA = [0, 2, 4, 7, 9];
  let rushLevel = 0, melLast = 2;
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); duckG = ctx.createGain(); master.gain.value = 0; duckG.gain.value = 1;
    const comp = ctx.createDynamicsCompressor(); master.connect(duckG); duckG.connect(comp); comp.connect(ctx.destination);
    // a soft echo, for Penn's music box
    echoIn = ctx.createGain(); const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(); dl.delayTime.value = 0.36; fb.gain.value = 0.42; wet.gain.value = 0.55;
    echoIn.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
    return true;
  }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, freq, t, a, peak, d, cut, opt) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq;
    if (opt && opt.glide) { o.frequency.setValueAtTime(freq * opt.glide, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.06); }
    if (opt && opt.detune) o.detune.value = opt.detune;
    if (opt && opt.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = opt.vib; lg.gain.value = freq * 0.03; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + a + d + 0.05); }
    let out = g; if (cut) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; g.connect(f); out = f; }
    o.connect(g); out.connect(master); if (opt && opt.echo) out.connect(echoIn); env(g, t, a, peak, d); o.start(t); o.stop(t + a + d + 0.05);
  }
  function lownoise(t, peak, d, lp) {
    const n = ctx.createBufferSource(), len = Math.floor(ctx.sampleRate * d), b = ctx.createBuffer(1, len, ctx.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; const g = ctx.createGain();
    n.connect(f); f.connect(g); g.connect(master); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + d * 0.45); g.gain.linearRampToValueAtTime(0.0001, t + d); n.start(t); n.stop(t + d + 0.02);
  }
  function tom(t, f0, peak) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + 0.25); o.connect(g); g.connect(master); env(g, t, 0.004, peak, 0.3); o.start(t); o.stop(t + 0.35); }
  const pluck = (f, t, peak, d) => { tone('sawtooth', f, t, 0.002, peak, d || 0.22, 1800); tone('triangle', f * 2, t, 0.002, peak * 0.4, (d || 0.22) * 0.6); };
  /* Today-page themes, one per Lucky Clover. Each has a tempo, a chord loop (MIDI root + shape) and a step pattern. */
  const STY = {
    // Binko: a wind-up toy music box with chiptune bloops
    binko: { bpm: 104, vol: 0.13, ch: [[60, [0, 4, 7]], [65, [0, 4, 7]], [67, [0, 4, 7]], [60, [0, 4, 7]]], step(s, t, r, sh) {
      if (s % 4 === 0) tone('sine', NOTE(r - 24), t, 0.005, 0.14, 0.25);
      if (s % 2 === 0) tone('square', NOTE(r + 12 + sh[[0, 1, 2, 1, 2, 1, 0, 2][s / 2]]), t, 0.003, 0.03, 0.1, 3000);
      if (s === 6 || s === 14) tone('sine', NOTE(r + 31), t, 0.002, 0.05, 0.12, 0, { glide: 0.5 });
      if (s === 12 && Math.random() < 0.5) tone('triangle', NOTE(r + 36), t, 0.002, 0.04, 0.3); } },
    // Captain Triton: a slow, smoky sea shanty on a wheezing squeezebox, with the sea swelling underneath
    triton: { bpm: 80, vol: 0.15, ch: [[62, [0, 3, 7]], [60, [0, 4, 7]], [58, [0, 4, 7]], [57, [0, 4, 7]]], step(s, t, r, sh) {
      if (s === 0) { sh.forEach(i => tone('sawtooth', NOTE(r + i - 12), t, 0.25, 0.022, 60 / this.bpm * 3.2, 900, { detune: 7 })); tone('sine', NOTE(r - 24), t, 0.01, 0.13, 0.9); lownoise(t, 0.035, 60 / this.bpm * 4, 500); }
      if (s === 8) tone('sine', NOTE(r - 17), t, 0.01, 0.1, 0.7);
      if ([0, 6, 8, 12].includes(s) && Math.random() < 0.7) tone('triangle', NOTE(r + 12 + [0, 3, 5, 7, 10][Math.floor(Math.random() * 5)]), t, 0.03, 0.05, 0.5, 2200, { vib: 5 }); } },
    // Ollie: flamenco fire. Phrygian guitar, palmas, and the crackle of embers
    ollie: { bpm: 112, vol: 0.14, ch: [[57, [0, 3, 7]], [55, [0, 4, 7]], [53, [0, 4, 7]], [52, [0, 4, 8]]], step(s, t, r, sh) {
      if ([0, 3, 6, 10, 12].includes(s)) sh.forEach((i, k) => pluck(NOTE(r + i - 12 + (k ? 12 : 0)), t + k * 0.012, 0.035));
      if ([3, 6, 10, 14].includes(s)) noise(t, 0.08, 0.05, 2500);
      if (s % 4 === 2 && Math.random() < 0.6) pluck(NOTE(r + [0, 1, 3, 5, 7][Math.floor(Math.random() * 5)] + 12), t, 0.04, 0.18);
      if (Math.random() < 0.18) noise(t + Math.random() * 0.1, 0.03, 0.012, 4000); } },
    // Big Green: heavy, slow footsteps, deep drums and a warm low marimba
    green: { bpm: 68, vol: 0.17, ch: [[45, [0, 3, 7]], [43, [0, 4, 7]], [41, [0, 4, 7]], [43, [0, 4, 7]]], step(s, t, r, sh) {
      if (s === 0 || s === 8) tom(t, 90, 0.35); if (s === 11) tom(t, 120, 0.18); if (s === 4 || s === 12) tom(t, 70, 0.25);
      if (s === 0) tone('sine', NOTE(r - 12), t, 0.02, 0.18, 1.6);
      if (s % 4 === 2 && Math.random() < 0.6) marimba(NOTE(r + 24 + [0, 3, 5, 7, 10][Math.floor(Math.random() * 5)]), t, 0.08); } },
    // Penn: a lonely music box in the dark, every note echoing back
    penn: { bpm: 64, vol: 0.14, ch: [[57, [0, 3, 7]], [53, [0, 4, 7]], [56, [0, 3, 6]], [52, [0, 4, 7]]], step(s, t, r, sh) {
      if (s === 0) tone('sine', NOTE(r - 24), t, 0.8, 0.06, 60 / this.bpm * 3.8);
      if (s % 4 === 0 || (s % 2 === 0 && Math.random() < 0.3)) { const n = r + 24 + sh[Math.floor(Math.random() * 3)]; tone('sine', NOTE(n), t, 0.003, 0.06, 0.6, 0, { echo: 1 }); tone('sine', NOTE(n) * 3, t, 0.002, 0.012, 0.15, 0, { echo: 1 }); } } },
    // Quickare: a hill-country hoedown, banjo rolls over a boom-chick
    quickare: { bpm: 132, vol: 0.13, ch: [[55, [0, 4, 7]], [55, [0, 4, 7]], [60, [0, 4, 7]], [62, [0, 4, 7]]], step(s, t, r, sh) {
      if (s % 8 === 0) tone('triangle', NOTE(r - 24), t, 0.005, 0.2, 0.25); if (s % 8 === 4) tone('triangle', NOTE(r - 17), t, 0.005, 0.16, 0.22);
      if (s % 4 === 2) sh.forEach(i => tone('square', NOTE(r + i), t, 0.002, 0.012, 0.08, 1800));
      tone('triangle', NOTE(r + 12 + [0, 7, 12, 4, 7, 12, 0, 7][s % 8] - (s % 8 === 3 ? 0 : 0)), t, 0.001, 0.035, 0.12, 0, { glide: s % 8 === 0 ? 0.94 : 0 || undefined }); } },
    // Cat: a hoppy pizzicato tune that skips every fourth note, like running on three legs, with the odd little bleat
    cat: { bpm: 118, vol: 0.13, ch: [[65, [0, 4, 7]], [70, [0, 4, 7]], [72, [0, 4, 7]], [65, [0, 4, 7]]], step(s, t, r, sh) {
      if (s % 2 === 0 && (s / 2) % 4 !== 3) tone('sine', NOTE(r + sh[(s / 2) % 3] + (s >= 8 ? 12 : 0)), t, 0.002, 0.08, 0.12, 0, { glide: 1.06 });
      if (s % 8 === 0) tone('triangle', NOTE(r - 12), t, 0.004, 0.12, 0.2);
      if (s === 14 && Math.random() < 0.3) tone('sawtooth', NOTE(r + 7), t, 0.02, 0.025, 0.35, 1400, { vib: 11 }); } }
  };
  function marimba(freq, t, peak) { tone('sine', freq, t, 0.005, peak, 0.55); tone('sine', freq * 4, t, 0.003, peak * 0.18, 0.09); }
  function noise(t, peak, d, hp) {
    const n = ctx.createBufferSource(), len = Math.floor(ctx.sampleRate * d), b = ctx.createBuffer(1, len, ctx.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ctx.createGain();
    n.connect(f); f.connect(g); g.connect(master); env(g, t, 0.002, peak, d); n.start(t); n.stop(t + d + 0.02);
  }
  function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); o.connect(g); g.connect(master); env(g, t, 0.003, 0.5, 0.16); o.start(t); o.stop(t + 0.2); }
  // one 16th-note step
  function play(t) {
    const s16 = step % 16, bar = Math.floor(step / 16) % 4;
    if (mode === 'calm') {
      const [root, sh] = CALM[bar];
      if (s16 === 0) sh.forEach(i => tone('triangle', NOTE(root + i - 12), t, 0.4, 0.035, 60 / bpm * 3.6, 1200));   // soft pad
      if (s16 === 0 || s16 === 8) tone('sine', NOTE(root - 24), t, 0.01, 0.12, 60 / bpm * 1.6);                         // bass
      if (s16 % 2 === 0 && Math.random() < (s16 % 4 === 0 ? 0.75 : 0.35)) {                                              // marimba melody
        melLast = Math.max(0, Math.min(9, melLast + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
        const oct = melLast >= 5 ? 12 : 0, n = 72 + PENTA[melLast % 5] + oct;
        marimba(NOTE(n), t, 0.09);
      }
    } else if (STY[mode]) {
      const [root, sh] = STY[mode].ch[bar]; STY[mode].step(s16, t, root, sh);
    } else if (mode === 'rush') {
      const [root, sh] = RUSH[bar];
      if (s16 % 4 === 0) kick(t);
      if (s16 % 2 === 1) noise(t, 0.05, 0.035, 7000);
      if (s16 === 4 || s16 === 12) noise(t, 0.12, 0.09, 1800);                                                            // snare-ish clap
      if (s16 % 2 === 0) tone('sawtooth', NOTE(root - 24 + (s16 % 4 === 2 ? 12 : 0)), t, 0.005, 0.09, 0.12, 700);         // driving bass
      const arp = [0, 1, 2, 1][s16 % 4], n = root + sh[arp] + 12 + (rushLevel >= 3 && s16 >= 8 ? 12 : 0);
      tone('square', NOTE(n), t, 0.004, 0.035 + Math.min(0.02, rushLevel * 0.004), 0.09, 2600);                            // arpeggio
    }
  }
  function tick() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.12) { play(nextT); nextT += 60 / bpm / 4; step++; }
  }
  function apply() {
    if (want === mode) return;
    if (!init()) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    if (want === 'off') { master.gain.linearRampToValueAtTime(0, t + 0.4); setTimeout(() => { if (want === 'off') { clearInterval(timer); timer = null; mode = 'off'; } }, 450); return; }
    mode = want; bpm = mode === 'rush' ? 124 + rushLevel * 4 : STY[mode] ? STY[mode].bpm : 78; step = 0; nextT = t + 0.05;
    master.gain.linearRampToValueAtTime(mode === 'rush' ? 0.22 : STY[mode] ? STY[mode].vol : 0.16, t + 0.8);
    if (!timer) timer = setInterval(tick, 25);
  }
  function enabled() { try { return S.settings.music !== false; } catch (e) { return true; } }
  return {
    set(m) { want = enabled() ? m : 'off'; if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); if (ctx || want !== 'off') apply(); },
    level(n) { const lv = Math.min(6, Math.floor(n / 5)); if (lv !== rushLevel) { rushLevel = lv; if (mode === 'rush') bpm = 124 + rushLevel * 4; } },
    resetLevel() { rushLevel = 0; },
    duck(on) { if (!ctx || on === ducked) return; ducked = on; const t = ctx.currentTime; duckG.gain.cancelScheduledValues(t); duckG.gain.setValueAtTime(duckG.gain.value, t); duckG.gain.linearRampToValueAtTime(on ? 0.06 : 1, t + (on ? 0.08 : 0.5)); },
    unlock() { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); }
  };
})();
// browsers only allow sound after a tap, so wake the music on the first one
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { Music.unlock(); if (typeof view !== 'undefined' && typeof musicFor === 'function') Music.set(musicFor()); }, { capture: true }));
