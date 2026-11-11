// أصوات اللعبة — مولّدة بالكود (Web Audio) بدون ملفات صوت
const sfx = (() => {
  let ctx, on = true;
  try { on = localStorage.getItem('tarteeb-mute') !== '1'; } catch {}
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
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02);
  }
  function noise(t0, d, f, vol = .25) {
    const c = ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const flt = c.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = f; flt.Q.value = .8;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(flt).connect(g).connect(c.destination); s.start(c.currentTime + t0);
  }
  const clip = src => { let a; return () => { try { if (!a) { a = new Audio(src); a.preload = 'auto'; } a.currentTime = 0; const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); } catch {} }; };
  const bank = {
    bang: () => { noise(0, .35, 260, .95); tone(90, 0, .35, 'sawtooth', .35, 28); tone(1200, 0, .06, 'square', .12, 200); },
    alarm: () => { for (let i = 0; i < 3; i++) { tone(620, i * .34, .17, 'sawtooth', .1, 880); tone(880, i * .34 + .17, .17, 'sawtooth', .1, 620); } },
    alarm2: () => { tone(440, 0, .22, 'square', .07, 330); tone(440, .26, .22, 'square', .07, 330); },
    kill: () => { noise(0, .18, 3000, .5); tone(500, 0, .2, 'sawtooth', .12, 90); },
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
  api.toggle = () => { on = !on; try { localStorage.setItem('tarteeb-mute', on ? '0' : '1'); } catch {} return on; };
  addEventListener('pointerdown', () => ac(), { once: true, passive: true });
  return api;
})();
