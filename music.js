'use strict';
/* Background music, made live in the browser (no recordings, nothing to download).
   'calm': a soft marimba-and-pad loop for lessons and practice.
   'rush': an upbeat loop for Padayon Rush that speeds up as your run gets longer.
   It ducks to almost nothing whenever a Bisaya clip or the phone's voice is speaking, so it never covers a word. */
const Music = (() => {
  let ctx = null, master = null, duckG = null, mode = 'off', timer = null, step = 0, nextT = 0, bpm = 80, want = 'off', ducked = false;
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
    return true;
  }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, freq, t, a, peak, d, cut) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq;
    let out = g; if (cut) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; g.connect(f); out = f; }
    o.connect(g); out.connect(master); env(g, t, a, peak, d); o.start(t); o.stop(t + a + d + 0.05);
  }
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
    mode = want; bpm = mode === 'rush' ? 124 + rushLevel * 4 : 78; step = 0; nextT = t + 0.05;
    master.gain.linearRampToValueAtTime(mode === 'rush' ? 0.22 : 0.16, t + 0.8);
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
