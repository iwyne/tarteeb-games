// أصوات اللعبة — مولّدة بالكود (Web Audio) بدون ملفات صوت
const sfx = (() => {
  let ctx, on = true, vol = 1, master = null;
  try { on = localStorage.getItem('tarteeb-mute') !== '1'; const v = parseFloat(localStorage.getItem('tarteeb-vol')); if (v >= 0 && v <= 1) vol = v; } catch {}
  // كل الأصوات تمر من هنا عشان نتحكم بالمستوى
  const out = c => { if (!master) { master = c.createGain(); master.gain.value = vol; master.connect(c.destination); } return master; };
  const ac = () => {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  function tone(f, t0, d, type = 'sine', vol = .18, f2) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(out(c)); o.start(t); o.stop(t + d + .02);
  }
  function noise(t0, d, f, vol = .25) {
    const c = ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const flt = c.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = f; flt.Q.value = .8;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(flt).connect(g).connect(out(c)); s.start(c.currentTime + t0);
  }
  // ضجيج بفلتر متحرك (للصرخة والرعد والهمس)
  function nz(t0, d, o = {}) {
    const c = ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const flt = c.createBiquadFilter(); flt.type = o.type || 'bandpass'; flt.Q.value = o.q || 1;
    const t = c.currentTime + t0; flt.frequency.setValueAtTime(o.f || 1000, t); if (o.f2) flt.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .3, t + (o.a || .01)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(flt).connect(g).connect(out(c)); s.start(t); s.stop(t + d + .05);
  }
  const clip = src => { let a; return () => { try { if (!a) { a = new Audio(src); a.preload = 'auto'; } a.currentTime = 0; a.volume = vol; const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); } catch {} }; };
  const bank = {
    bang: () => { noise(0, .35, 260, .95); tone(90, 0, .35, 'sawtooth', .35, 28); tone(1200, 0, .06, 'square', .12, 200); },
    alarm: () => { for (let i = 0; i < 3; i++) { tone(620, i * .34, .17, 'sawtooth', .1, 880); tone(880, i * .34 + .17, .17, 'sawtooth', .1, 620); } },
    alarm2: () => { tone(440, 0, .22, 'square', .07, 330); tone(440, .26, .22, 'square', .07, 330); },
    kill: () => { noise(0, .18, 3000, .5); tone(500, 0, .2, 'sawtooth', .12, 90); },
    scream: () => { nz(0, 1.5, { f: 2200, f2: 600, q: 4, vol: .7 }); nz(0, 1.2, { f: 900, f2: 300, q: 2, vol: .4 }); tone(980, 0, 1.3, 'sawtooth', .2, 260); tone(1460, 0, .9, 'square', .08, 520); tone(70, 0, .6, 'sine', .5, 30); },
    whisper: () => { for (let i = 0; i < 4; i++) nz(i * .32, .55, { f: 2600 + Math.random() * 2400, q: 7, vol: .14, a: .15 }); },
    thunder: () => { nz(0, 2.4, { type: 'lowpass', f: 600, f2: 60, vol: .8, a: .04 }); nz(0, .3, { f: 2500, vol: .35 }); },
    heart: () => { tone(62, 0, .16, 'sine', .55, 40); tone(56, .22, .2, 'sine', .45, 36); },
    static: () => nz(0, .28, { type: 'highpass', f: 2500, vol: .28 }),
    whoosh: () => nz(0, .7, { f: 300, f2: 2600, q: 2, vol: .35, a: .2 }),
    bell: () => [0, .45, .9].forEach(t => { tone(660, t, 1.1, 'sine', .22); tone(990, t, .8, 'sine', .1); tone(1320, t, .5, 'triangle', .06); }),
    slap: () => { nz(0, .12, { type: 'highpass', f: 1800, vol: .9 }); tone(420, 0, .08, 'square', .2, 200); },
    boing: () => { tone(220, 0, .5, 'sine', .25, 660); tone(330, .05, .45, 'triangle', .12, 900); },
    choke: () => { for (let i = 0; i < 6; i++) tone(140 - i * 8, i * .09, .09, 'sawtooth', .12, 90); nz(0, .5, { type: 'lowpass', f: 400, vol: .2 }); },
    stab: () => { nz(0, .14, { f: 700, q: 2, vol: .7 }); tone(110, 0, .14, 'sine', .4, 60); nz(.05, .2, { type: 'lowpass', f: 900, f2: 200, vol: .3 }); },
    thud: () => { tone(70, 0, .3, 'sine', .6, 35); nz(0, .2, { type: 'lowpass', f: 300, vol: .4 }); },
    smash: () => { nz(0, .5, { type: 'lowpass', f: 900, f2: 60, vol: 1 }); tone(60, 0, .5, 'sine', .7, 25); nz(0, .15, { type: 'highpass', f: 2500, vol: .5 }); },
    zap: () => { tone(80, 0, 1.3, 'sawtooth', .22); tone(123, 0, 1.3, 'square', .1); nz(0, 1.3, { type: 'highpass', f: 3000, vol: .3 }); for (let i = 0; i < 6; i++) tone(1200 + Math.random() * 900, i * .2, .05, 'square', .08); },
    ding: () => { tone(1568, 0, .5, 'triangle', .18); tone(2093, .08, .6, 'triangle', .14); },
    creak: () => { tone(180, 0, .9, 'sawtooth', .05, 260); tone(240, .1, .7, 'sawtooth', .04, 150); nz(0, .9, { f: 900, f2: 1600, q: 9, vol: .12, a: .2 }); },
    step: () => { nz(0, .09, { type: 'lowpass', f: 420, vol: .32 }); tone(85, 0, .07, 'sine', .14, 50); },
    step2: () => { nz(0, .08, { type: 'lowpass', f: 380, vol: .12 }); },
    flick: () => { tone(2400, 0, .02, 'square', .1); tone(1200, .03, .02, 'square', .06); },
    drone: () => { tone(48, 0, 7.5, 'sine', .16, 44); tone(73, .5, 6.5, 'triangle', .035, 69); nz(0, 7.5, { type: 'lowpass', f: 160, vol: .07, a: 2 }); },
    mbox: () => [784, 659, 587, 523, 587, 659, 494].forEach((f, i) => { tone(f * (1 - i * .004), i * .42, .9, 'sine', .07); tone(f * 2, i * .42, .4, 'triangle', .02); }),
    sizzle: () => { nz(0, .9, { type: 'highpass', f: 3500, vol: .4 }); tone(320, 0, .8, 'sawtooth', .12, 60); },
    slam: () => { tone(55, 0, .5, 'sine', .7, 30); nz(0, .35, { type: 'lowpass', f: 700, vol: .7 }); nz(.02, .1, { f: 2400, vol: .25 }); },
    gclick: () => { tone(1700, 0, .03, 'square', .16); tone(900, .05, .04, 'square', .1); },
    unoCall: clip('sounds/uno.mp3'),
    unoWin: clip('sounds/win.mp3'),
    card: () => { noise(0, .09, 2200, .35); tone(180, 0, .08, 'triangle', .12, 90); },
    draw: () => noise(0, .07, 1400, .25),
    turn: () => { tone(660, 0, .14, 'sine', .2); tone(990, .12, .22, 'sine', .2); },
    uno: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .07, .16, 'square', .09)),
    catch: () => tone(220, 0, .35, 'sawtooth', .16, 70),
    penalty: () => tone(300, 0, .25, 'square', .1, 120),
    pop: () => tone(700, 0, .09, 'sine', .15, 1250),
    tick: () => tone(1000, 0, .05, 'square', .06),
    nope: () => tone(150, 0, .1, 'square', .08),
    win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * .11, .22, 'triangle', .2)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * .16, .28, 'triangle', .16))
  };
  const api = name => { if (on && bank[name]) bank[name](); };
  api.on = () => on;
  api.vol = v => { if (v == null) return vol; vol = Math.max(0, Math.min(1, +v)); if (master) master.gain.value = vol; try { localStorage.setItem('tarteeb-vol', vol); } catch {} return vol; };
  api.toggle = () => { on = !on; try { localStorage.setItem('tarteeb-mute', on ? '0' : '1'); } catch {} return on; };
  addEventListener('pointerdown', () => ac(), { once: true, passive: true });
  return api;
})();
