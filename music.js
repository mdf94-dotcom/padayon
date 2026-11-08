'use strict';
/* Background music, made live in the browser (no recordings, nothing to download).
   'calm': a soft marimba-and-pad loop for lessons and practice.
   'rush': an upbeat loop for Padayon Rush that speeds up as your run gets longer.
   It ducks to almost nothing whenever a Bisaya clip or the phone's voice is speaking, so it never covers a word. */
const Music = (() => {
  let echoIn = null, sfxG = null, ctx = null, master = null, duckG = null, mode = 'off', timer = null, step = 0, nextT = 0, bpm = 80, want = 'off', ducked = false;
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
    sfxG = ctx.createGain(); sfxG.gain.value = 1; sfxG.connect(comp);   // sound effects: their own volume, never ducked
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
    // Quickare: a hill-country hoedown, banjo rolls over a boom-chick
    quickare: { bpm: 132, vol: 0.13, ch: [[55, [0, 4, 7]], [55, [0, 4, 7]], [60, [0, 4, 7]], [62, [0, 4, 7]]], step(s, t, r, sh) {
      if (s % 8 === 0) tone('triangle', NOTE(r - 24), t, 0.005, 0.2, 0.25); if (s % 8 === 4) tone('triangle', NOTE(r - 17), t, 0.005, 0.16, 0.22);
      if (s % 4 === 2) sh.forEach(i => tone('square', NOTE(r + i), t, 0.002, 0.012, 0.08, 1800));
      tone('triangle', NOTE(r + 12 + [0, 7, 12, 4, 7, 12, 0, 7][s % 8] - (s % 8 === 3 ? 0 : 0)), t, 0.001, 0.035, 0.12, 0, { glide: s % 8 === 0 ? 0.94 : 0 || undefined }); } },
    /* ---- activity tracks (each activity rotates through its own set; see TRACKS below) ---- */
    // Kulintang Morning: soft gong-chimes over a warm pad
    kulintang: { bpm: 84, vol: 0.14, ch: [[62, [0, 2, 7]], [60, [0, 4, 7]], [57, [0, 3, 7]], [60, [0, 2, 7]]], step(s, t, r, sh) {
      if (s === 0) { sh.forEach(i => tone('triangle', NOTE(r + i - 12), t, 0.5, 0.03, 60 / this.bpm * 3.6, 1100)); tone('sine', NOTE(r - 24), t, 0.02, 0.11, 1.2); }
      if (s % 2 === 0 && Math.random() < (s % 4 === 0 ? 0.7 : 0.3)) gong(NOTE(r + 12 + [0, 2, 4, 7, 9][Math.floor(Math.random() * 5)]), t, 0.05);
      if (s === 8 && Math.random() < 0.5) gong(NOTE(r - 12), t, 0.06, 1.4); } },
    // Rondalla Stroll: plucked guitar and bandurria, a gentle three-beat harana sway
    rondalla: { bpm: 90, vol: 0.13, meter: 12, ch: [[60, [0, 4, 7]], [65, [0, 4, 7]], [67, [0, 4, 7]], [60, [0, 4, 7]]], step(s, t, r, sh) {
      if (s === 0) tone('sine', NOTE(r - 24), t, 0.01, 0.13, 0.9);
      if (s === 4 || s === 8) sh.forEach((i, k) => pluck(NOTE(r + i - 12), t + k * 0.015, 0.022, 0.3));
      if (s % 2 === 0 && Math.random() < 0.55) pluck(NOTE(r + 12 + [0, 2, 4, 5, 7, 9][Math.floor(Math.random() * 6)]), t, 0.03, 0.35); } },
    // Bamboo Breeze: hollow bamboo marimba and a light shaker
    bamboo: { bpm: 78, vol: 0.15, ch: [[57, [0, 3, 7]], [60, [0, 4, 7]], [55, [0, 4, 7]], [57, [0, 3, 7]]], step(s, t, r, sh) {
      if (s === 0 || s === 10) tone('sine', NOTE(r - 24), t, 0.01, 0.12, 0.8);
      if ([0, 3, 6, 8, 11, 14].includes(s) && Math.random() < 0.8) bambooHit(NOTE(r + 12 + sh[Math.floor(Math.random() * 3)] + (Math.random() < 0.3 ? 12 : 0)), t, 0.07);
      if (s % 2 === 1) noise(t, 0.018, 0.03, 6000); } },
    // Lo-fi Jeepney: a soft, lazy beat with muted keys
    lofi: { bpm: 72, vol: 0.15, ch: [[60, [0, 4, 7, 11]], [57, [0, 3, 7, 10]], [62, [0, 3, 7, 10]], [55, [0, 4, 7, 10]]], step(s, t, r, sh) {
      if (s === 0 || s === 10) kick(t, 0.28); if (s === 4 || s === 12) noise(t, 0.06, 0.12, 1500); if (s % 2 === 0) noise(t, 0.015, 0.03, 7000);
      if (s === 0 || s === 7) sh.forEach(i => tone('sine', NOTE(r + i), t + 0.01, 0.01, 0.025, 0.6, 1400)); } },
    // Rain on Nipa: rain on a thatched roof, a pad and a few marimba drops
    rain: { bpm: 70, vol: 0.14, ch: [[64, [0, 3, 7]], [60, [0, 4, 7]], [62, [0, 3, 7]], [59, [0, 3, 7]]], step(s, t, r, sh) {
      if (s === 0) { lownoise(t, 0.03, 60 / this.bpm * 4, 2500); sh.forEach(i => tone('triangle', NOTE(r + i - 12), t, 0.8, 0.025, 60 / this.bpm * 3.5, 900)); }
      if (Math.random() < 0.12) marimba(NOTE(r + 12 + [0, 3, 5, 7, 10][Math.floor(Math.random() * 5)]), t, 0.06); } },
    // Harana Night: a slow guitar ballad under the window
    harana: { bpm: 66, vol: 0.14, meter: 12, ch: [[57, [0, 3, 7]], [62, [0, 3, 7]], [64, [0, 4, 7]], [57, [0, 3, 7]]], step(s, t, r, sh) {
      if (s === 0) tone('sine', NOTE(r - 24), t, 0.01, 0.12, 1.2);
      if (s % 2 === 0) pluck(NOTE(r + sh[(s / 2) % 3] - (s ? 0 : 12)), t, 0.026, 0.5);
      if (s === 6 && Math.random() < 0.6) pluck(NOTE(r + 12 + [0, 2, 3, 5, 7][Math.floor(Math.random() * 5)]), t, 0.03, 0.6); } },
    // Abaca Loom: a steady repeating weave for grammar
    loom: { bpm: 88, vol: 0.13, ch: [[60, [0, 4, 7]], [62, [0, 3, 7]], [64, [0, 3, 7]], [62, [0, 3, 7]]], step(s, t, r, sh) {
      if (s % 4 === 0) tone('sine', NOTE(r - 24), t, 0.01, 0.1, 0.4);
      tone('triangle', NOTE(r + 12 + [0, 7, 4, 7][s % 4] + (s >= 8 ? 2 : 0)), t, 0.003, 0.028, 0.14, 2400); } },
    // Music Box Study: a slow music box with an echo
    musicbox: { bpm: 76, vol: 0.12, ch: [[67, [0, 4, 7]], [64, [0, 3, 7]], [65, [0, 4, 7]], [62, [0, 3, 7]]], step(s, t, r, sh) {
      if (s === 0) tone('sine', NOTE(r - 24), t, 0.02, 0.09, 1.4);
      if (s % 2 === 0 && Math.random() < 0.7) tone('sine', NOTE(r + 12 + [0, 4, 7, 12, 7, 4, 2, 0][s / 2]), t, 0.002, 0.05, 0.6, 0, { echo: 1 }); } },
    // Lola's Tale: storybook music box over low strings
    lolatale: { bpm: 72, vol: 0.13, ch: [[62, [0, 3, 7]], [58, [0, 4, 7]], [60, [0, 4, 7]], [57, [0, 4, 7]]], step(s, t, r, sh) {
      if (s === 0) sh.forEach(i => tone('sawtooth', NOTE(r + i - 12), t, 0.6, 0.012, 60 / this.bpm * 3.6, 700, { detune: 5 }));
      if (s % 4 === 0 && Math.random() < 0.8) tone('sine', NOTE(r + 24 + [0, 3, 7, 10, 12][Math.floor(Math.random() * 5)]), t, 0.002, 0.04, 0.7, 0, { echo: 1 }); } },
    // Island Dusk: slow bamboo and the waves
    dusk: { bpm: 64, vol: 0.14, ch: [[55, [0, 4, 7]], [53, [0, 4, 7]], [57, [0, 3, 7]], [52, [0, 3, 7]]], step(s, t, r, sh) {
      if (s === 0) { lownoise(t, 0.04, 60 / this.bpm * 4, 450); tone('sine', NOTE(r - 24), t, 0.05, 0.1, 1.6); }
      if ([0, 6, 10].includes(s) && Math.random() < 0.7) bambooHit(NOTE(r + 12 + sh[Math.floor(Math.random() * 3)]), t, 0.06); } },
    // Market Count: bouncy plucks for numbers
    market: { bpm: 100, vol: 0.13, ch: [[60, [0, 4, 7]], [65, [0, 4, 7]], [67, [0, 4, 7]], [60, [0, 4, 7]]], step(s, t, r, sh) {
      if (s % 4 === 0) tone('triangle', NOTE(r - 24 + (s % 8 ? 7 : 0)), t, 0.005, 0.15, 0.2);
      if (s % 4 === 2) sh.forEach(i => pluck(NOTE(r + i), t, 0.012, 0.1));
      if (s % 2 === 0 && Math.random() < 0.5) pluck(NOTE(r + 12 + [0, 2, 4, 7, 9][Math.floor(Math.random() * 5)]), t, 0.03, 0.15); } },
    // Tinikling Steps: bamboo poles clapping in three
    tinikling: { bpm: 108, vol: 0.14, meter: 12, ch: [[57, [0, 3, 7]], [60, [0, 4, 7]], [55, [0, 4, 7]], [57, [0, 3, 7]]], step(s, t, r, sh) {
      if (s % 4 === 0) { bambooHit(220, t, 0.09); if (s === 0) tone('sine', NOTE(r - 24), t, 0.01, 0.12, 0.4); }
      if (s % 4 === 2 && s !== 10) noise(t, 0.05, 0.04, 2500);
      if (s % 2 === 0 && Math.random() < 0.45) marimba(NOTE(r + 12 + sh[Math.floor(Math.random() * 3)]), t, 0.06); } },
    // Fiesta Rush: brassy stabs and drums (speeds up as your run grows)
    fiesta: { bpm: 132, vol: 0.2, rush: 1, ch: [[60, [0, 4, 7]], [65, [0, 4, 7]], [67, [0, 4, 7]], [65, [0, 4, 7]]], step(s, t, r, sh) {
      if (s % 4 === 0) kick(t); if (s === 4 || s === 12) noise(t, 0.12, 0.09, 1800); if (s % 2 === 1) noise(t, 0.04, 0.03, 7000);
      if (s % 2 === 0) tone('sawtooth', NOTE(r - 24 + (s % 4 === 2 ? 12 : 0)), t, 0.005, 0.08, 0.12, 700);
      if (s === 2 || s === 6 || s === 10) sh.forEach(i => tone('sawtooth', NOTE(r + i), t, 0.01, 0.025, 0.12, 2000)); } },
    // Sinulog Drums: a festival drum groove
    sinulog: { bpm: 128, vol: 0.2, rush: 1, ch: [[57, [0, 3, 7]], [57, [0, 3, 7]], [55, [0, 4, 7]], [53, [0, 4, 7]]], step(s, t, r, sh) {
      if ([0, 3, 6, 8, 11, 14].includes(s)) tom(t, [110, 90, 130][s % 3], 0.3); if (s % 4 === 0) kick(t); if (s % 2 === 1) noise(t, 0.05, 0.03, 5000);
      if (s === 0) tone('sawtooth', NOTE(r - 12), t, 0.02, 0.05, 0.5, 900);
      if (s % 4 === 2 && Math.random() < 0.6) gong(NOTE(r + 12 + sh[Math.floor(Math.random() * 3)]), t, 0.05, 0.5); } },
  };
  // a gong-chime (kulintang): a bright strike with slightly out-of-tune overtones that ring
  function gong(freq, t, peak, d) { d = d || 0.9; tone('sine', freq, t, 0.004, peak, d); tone('sine', freq * 2.76, t, 0.003, peak * 0.25, d * 0.4); tone('sine', freq * 5.4, t, 0.002, peak * 0.1, d * 0.2); }
  // bamboo: hollow and short
  function bambooHit(freq, t, peak) { tone('triangle', freq, t, 0.002, peak, 0.18, 2200); tone('sine', freq * 3.01, t, 0.001, peak * 0.2, 0.05); }
  function marimba(freq, t, peak) { tone('sine', freq, t, 0.005, peak, 0.55); tone('sine', freq * 4, t, 0.003, peak * 0.18, 0.09); }
  function noise(t, peak, d, hp) {
    const n = ctx.createBufferSource(), len = Math.floor(ctx.sampleRate * d), b = ctx.createBuffer(1, len, ctx.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ctx.createGain();
    n.connect(f); f.connect(g); g.connect(master); env(g, t, 0.002, peak, d); n.start(t); n.stop(t + d + 0.02);
  }
  function kick(t, pk) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); o.connect(g); g.connect(master); env(g, t, 0.003, pk || 0.5, 0.16); o.start(t); o.stop(t + 0.2); }
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
      const M = STY[mode].meter || 16, sm = step % M, bm = Math.floor(step / M) % 4;   // three-beat tracks use 12 steps a bar
      const [root, sh] = STY[mode].ch[bm]; STY[mode].step(sm, t, root, sh);
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
  let fading = false;
  // music volume setting (0..1, default 0.4) scales every track; 0.4 is a little under the old fixed level
  const mvol = () => { try { const v = S.settings.musicVol; return (v == null ? 0.4 : v) * 2; } catch (e) { return 0.8; } };
  const target = m => (m === 'rush' ? 0.22 : STY[m] ? STY[m].vol : 0.16) * mvol() * (held ? 0 : 1);
  const baseBpm = m => m === 'rush' ? 124 + rushLevel * 4 : STY[m] ? STY[m].bpm + (STY[m].rush ? rushLevel * 4 : 0) : 78;
  let held = false, swapT = null;
  function apply() {
    if (want === mode && !(fading && want !== 'off')) return;
    if (!init()) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    clearTimeout(swapT);
    if (want === 'off') { fading = true; master.gain.linearRampToValueAtTime(0, t + 0.6); swapT = setTimeout(() => { if (want === 'off') { clearInterval(timer); timer = null; mode = 'off'; } fading = false; }, 650); return; }
    if (fading && want === mode) { fading = false; master.gain.linearRampToValueAtTime(target(mode), t + 0.5); if (!timer) timer = setInterval(tick, 25); return; }
    fading = false;
    const start = () => { mode = want; bpm = baseBpm(mode); step = 0; nextT = ctx.currentTime + 0.05; const t2 = ctx.currentTime;
      master.gain.cancelScheduledValues(t2); master.gain.setValueAtTime(master.gain.value, t2); master.gain.linearRampToValueAtTime(target(mode), t2 + 1.5); if (!timer) timer = setInterval(tick, 25); };
    // one track to another: fade the old one out first, then bring the new one in
    if (mode !== 'off' && timer) { master.gain.linearRampToValueAtTime(0, t + 1.2); swapT = setTimeout(() => { if (want !== 'off') start(); }, 1250); } else start();
  }
  /* which track plays: each activity has its own set, played in turn so the same one never plays twice in a row.
     In the daily session the track changes every few minutes. */
  const TRACKS = { daily: ['kulintang', 'rondalla', 'bamboo', 'calm'], practice: ['lofi', 'rain', 'harana'], grammar: ['loom', 'musicbox'], stories: ['lolatale', 'dusk'], numbers: ['market', 'tinikling'], rush: ['rush', 'fiesta', 'sinulog'] };
  const DAILY_SWAP_MS = 150000;
  let group = null, gTrack = null, gSince = 0;
  const lastOf = g => { try { return localStorage.getItem('padayon-track-' + g); } catch (e) { return null; } };
  function nextTrack(g, after) { const list = TRACKS[g], i = list.indexOf(after); const tr = list[(i + 1 + list.length) % list.length]; try { localStorage.setItem('padayon-track-' + g, tr); } catch (e) { } return tr; }
  function resolve(m) {
    if (!TRACKS[m]) return m;
    if (group !== m || !gTrack) { group = m; gTrack = nextTrack(m, lastOf(m)); gSince = Date.now(); }
    else if (m === 'daily' && Date.now() - gSince > DAILY_SWAP_MS) { gTrack = nextTrack(m, gTrack); gSince = Date.now(); }
    return gTrack;
  }
  function enabled() { try { return S.settings.music !== false; } catch (e) { return true; } }
  return {
    set(m) { if (!TRACKS[m] && m !== 'off' && m !== 'pause') group = null; const r = m === 'pause' ? 'off' : resolve(m); want = enabled() ? r : 'off'; if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); if (ctx || want !== 'off') apply(); },
    level(n) { const lv = Math.min(6, Math.floor(n / 5)); if (lv !== rushLevel) { rushLevel = lv; if (mode === 'rush' || (STY[mode] && STY[mode].rush)) bpm = baseBpm(mode); } },
    resetLevel() { rushLevel = 0; },
    endGroup() { group = null; gTrack = null; },   // the next session or game starts on the next track in its set
    // the mic is recording: music silent until it stops
    hold(on) { held = !!on; if (!ctx || mode === 'off') return; const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(target(mode), t + 0.3); },
    volume() { if (ctx && mode !== 'off') { const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(target(mode), t + 0.2); } },
    track() { return mode; },
    ctx() { return init() ? ctx : null; }, sfxBus() { return init() ? sfxG : null; },
    duck(on) { if (!ctx || on === ducked) return; ducked = on; const t = ctx.currentTime; duckG.gain.cancelScheduledValues(t); duckG.gain.setValueAtTime(duckG.gain.value, t); duckG.gain.linearRampToValueAtTime(on ? 0.06 : 1, t + (on ? 0.08 : 0.5)); },
    unlock() { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    pause(h) { if (!ctx) return; if (h) { clearInterval(timer); timer = null; ctx.suspend().catch(() => {}); } else if (mode !== 'off') { ctx.resume().catch(() => {}); nextT = ctx.currentTime + 0.05; if (!timer) timer = setInterval(tick, 25); } }
  };
})();
// browsers only allow sound after a tap, so wake the music on the first one
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { Music.unlock(); if (typeof view !== 'undefined' && typeof musicFor === 'function') Music.set(musicFor()); }, { capture: true }));
document.addEventListener('visibilitychange', () => Music.pause(document.hidden));

/* ---------- sound effects and vibration ----------
   Short, soft sounds made in the app (nothing to download). They use their own volume and are never ducked.
   Right answers rise one note for every few in a row; streaks of 3, 5, 10 (then every 5) get bigger sounds. */
const Sfx = (() => {
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  const on = () => { try { return S.settings.sfx !== false; } catch (e) { return true; } };
  const vol = () => { try { const v = S.settings.sfxVol; return (v == null ? 0.4 : v) * 2; } catch (e) { return 0.8; } };
  function blip(type, freq, t, a, peak, d, cut, glide) {
    const ctx = Music.ctx(), bus = Music.sfxBus(); if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq * (glide || 1), t); if (glide) o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    let out = g; if (cut) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; g.connect(f); out = f; }
    o.connect(g); out.connect(bus); const pk = peak * vol();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pk), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); o.start(t); o.stop(t + a + d + 0.05);
  }
  function hiss(t, peak, d, hp) {
    const ctx = Music.ctx(), bus = Music.sfxBus(); if (!ctx) return;
    const n = ctx.createBufferSource(), len = Math.floor(ctx.sampleRate * d), b = ctx.createBuffer(1, len, ctx.sampleRate), x = b.getChannelData(0); for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ctx.createGain(); n.connect(f); f.connect(g); g.connect(bus);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak * vol(), t + d * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + d); n.start(t); n.stop(t + d + 0.02);
  }
  const mar = (n, t, pk, d) => { blip('sine', NOTE(n), t, 0.004, pk, d || 0.35); blip('sine', NOTE(n) * 4, t, 0.002, pk * 0.15, 0.06); };
  const gong = (n, t, pk, d) => { blip('sine', NOTE(n), t, 0.004, pk, d || 1.2); blip('sine', NOTE(n) * 2.76, t, 0.003, pk * 0.25, (d || 1.2) * 0.4); blip('sine', NOTE(n) * 5.4, t, 0.002, pk * 0.1, 0.2); };
  const now = () => { const c = Music.ctx(); if (c && c.state === 'suspended') c.resume().catch(() => { }); return c ? c.currentTime + 0.02 : 0; };
  const buzz = p => { try { if (S.settings.vibe !== false && navigator.vibrate) navigator.vibrate(p); } catch (e) { } };
  const go = f => { if (!on()) return; try { const t = now(); if (Music.ctx()) f(t); } catch (e) { } };
  return {
    right(run) {   // run = how many right in a row, including this one
      buzz(15); go(t => { const up = Math.min(7, Math.floor(((run || 1) - 1) / 2)), sc = [0, 2, 4, 7, 9, 12, 14, 16][up];
        mar(72 + sc, t, 0.09, 0.3); mar(76 + sc, t + 0.07, 0.08, 0.4);
        if (run === 3) { mar(84 + sc, t + 0.16, 0.05, 0.5); hiss(t + 0.12, 0.02, 0.25, 7000); }
        else if (run === 5) { buzz([20, 40, 20, 40, 20]); [79, 81, 84].forEach((n, i) => gong(n, t + 0.18 + i * 0.09, 0.05, 0.6)); }
        else if (run >= 10 && run % 5 === 0) { buzz(120); gong(55, t + 0.15, 0.09, 1.8); [79, 81, 84, 88].forEach((n, i) => gong(n, t + 0.25 + i * 0.08, 0.05, 0.7)); } });
    },
    wrong() { buzz([30, 60, 30]); go(t => { blip('triangle', 196, t, 0.004, 0.09, 0.18, 900, 1.25); blip('triangle', 147, t + 0.09, 0.004, 0.07, 0.22, 800); }); },
    tick(hurry) { go(t => blip('triangle', hurry ? 1320 : 990, t, 0.001, 0.07, 0.05, 4000)); },
    countdown() { go(t => { [0, 0.28, 0.56].forEach(d => blip('triangle', 990, t + d, 0.001, 0.07, 0.05, 4000)); mar(84, t + 0.84, 0.1, 0.5); mar(88, t + 0.84, 0.08, 0.5); }); },
    done() { go(t => { [60, 64, 67, 72].forEach((n, i) => { blip('sawtooth', NOTE(n), t + i * 0.035, 0.002, 0.03, 0.5, 2200); blip('triangle', NOTE(n + 12), t + i * 0.035, 0.002, 0.02, 0.4); }); gong(48, t + 0.25, 0.1, 2); mar(84, t + 0.3, 0.06, 0.8); }); },
    rule() { go(t => { hiss(t, 0.05, 0.22, 2500); blip('sine', NOTE(88), t + 0.18, 0.003, 0.07, 1.1); blip('sine', NOTE(88) * 2.4, t + 0.18, 0.003, 0.02, 0.5); }); },
    streakKept() { buzz(80); go(t => { for (let i = 0; i < 6; i++) blip('sine', NOTE(84 + [0, 4, 7, 12, 16, 19][i]), t + i * 0.05 + Math.random() * 0.02, 0.002, 0.04, 0.25); hiss(t, 0.03, 0.4, 6000); mar(79, t + 0.35, 0.08, 0.7); }); },
    stage() { go(t => { [72, 74, 79, 84].forEach((n, i) => gong(n, t + i * 0.16, 0.07, 0.9)); gong(48, t + 0.7, 0.1, 2.4); }); }
  };
})();
// iPhone's silent switch already mutes music and sound effects (they're web audio); Bisaya words still play when you tap a speaker.
