// الكراسي الموسيقية (المجلس): طراحات أقل من اللاعبين بوحدة. الطقاقة تشتغل والكل يدور،
// ولما توقف كل واحد يضغط على طرّاحة فاضية. اللي ما يلقى يطلع. اللي يضغط قبل ما توقف يتعاقب.
const SCALE = +process.env.CHAIRS_SCALE || 1;
const GRAB_MS = 6000, RES_MS = 3800, INTRO_MS = 3000, STUN_MS = 1300;
module.exports = H => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const nm = (r, id) => (r.players.find(p => p.id === id) || {}).name || '؟';
  function round(r) {
    const g = r.g; g.k++;
    g.n = Math.max(1, g.alive.length - 1); g.seats = Array(g.n).fill(null); g.stun = {}; g.early = [];
    g.sub = 'music'; const ms = rnd(Math.max(3500, 9000 - g.k * 600), Math.max(7000, 15000 - g.k * 700)) * SCALE;
    g.res = null; g.bt.forEach(clearTimeout); g.bt = [];
    H.setTimer(r, ms, () => stop(r));
    // بوتات متسرعة أحياناً
    r.players.filter(p => p.bot && g.alive.includes(p.id)).forEach(b => { if (Math.random() < .08) g.bt.push(setTimeout(() => claim(r, b, Math.random() * g.n | 0), ms * Math.random())); });
    H.push(r);
  }
  function stop(r) {
    const g = r.g; if (g.sub !== 'music') return;
    g.sub = 'grab'; g.stopAt = Date.now();
    H.cast(r, { t: 'gnet', g: 'chairs', k: 'stop' });
    H.setTimer(r, GRAB_MS * SCALE, () => resolve(r));
    r.players.filter(p => p.bot && g.alive.includes(p.id)).forEach(b => g.bt.push(setTimeout(() => {
      if (g.sub !== 'grab') return; const free = g.seats.map((s, i) => s ? -1 : i).filter(i => i >= 0); if (free.length) claim(r, b, free[Math.random() * free.length | 0]);
    }, rnd(380, 1600) * SCALE)));
    H.push(r);
  }
  function claim(r, p, i) {
    const g = r.g; if (!g.alive.includes(p.id) || !(i >= 0 && i < g.n)) return;
    if (g.sub === 'music') { if (!g.stun[p.id]) { g.stun[p.id] = 1; g.early.push(p.id); H.log(r, `😅 ${p.name} قعد قبل ما توقف الطقاقة!`); H.push(r); } return; }
    if (g.sub !== 'grab' || g.seats.includes(p.id)) return;
    if (g.stun[p.id] && Date.now() - g.stopAt < STUN_MS) return;
    if (g.seats[i]) return;
    g.seats[i] = p.id;
    if (g.seats.every(Boolean)) resolve(r); else H.push(r);
  }
  function resolve(r) {
    const g = r.g; if (g.sub !== 'grab') return;
    g.bt.forEach(clearTimeout); g.bt = [];
    const out = g.alive.filter(id => !g.seats.includes(id));
    g.alive = g.alive.filter(id => !out.includes(id));
    g.res = { out }; g.sub = 'res';
    if (out.length) H.log(r, `💀 ما لقى مكان: ${out.map(id => nm(r, id)).join('، ')}`);
    H.setTimer(r, RES_MS * SCALE, () => g.alive.length <= 1 ? end(r, out) : round(r));
    H.push(r);
  }
  function end(r, lastOut) {
    const g = r.g; r.phase = 'over'; g.sub = 'over'; g.bt.forEach(clearTimeout);
    const ids = g.alive.length ? g.alive : lastOut || [];
    const ws = r.players.filter(p => ids.includes(p.id));
    r.winner = ws.map(p => p.name).join(' و ') || 'محد'; H.win(r, ws); H.setTimer(r, 0, null);
    H.log(r, `👑 ${r.winner} آخر واحد قاعد!`);
  }
  return {
    min: 2, max: 42,
    start(r) {
      r.g = { k: 0, alive: H.shuffle(r.players.map(p => p.id)), n: 0, seats: [], stun: {}, early: [], sub: 'intro', bt: [], res: null, stopAt: 0 };
      r.winner = null; r.phase = 'play';
      H.log(r, '🎵 الكراسي الموسيقية: لما توقف الطقاقة اقعد على أقرب طرّاحة!');
      H.setTimer(r, INTRO_MS * SCALE, () => round(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || m.t !== 'cs' || !H.rate(p, 'cs', 120)) return 'quiet';
      claim(r, p, +m.i); return 'quiet';
    },
    view(r) {
      const g = r.g; if (!g) return null;
      return { sub: g.sub, k: g.k, n: g.n, seats: g.seats, alive: g.alive, stun: Object.keys(g.stun), res: g.res, all: r.players.map(p => p.id) };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      g.alive = g.alive.filter(id => id !== p.id);
      if (g.alive.length <= 1) end(r, []);
    }
  };
};
