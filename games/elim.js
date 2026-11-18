// مسابقة الإقصاء: أسئلة بأربع خيارات، اللي يغلط (أو ما يجاوب) يخسر قلب، وآخر واحد يبقى يفوز.
const Q = require('./elim-q');
const SCALE = +process.env.ELIM_SCALE || 1;
const SHOW_MS = 4200, INTRO_MS = 3500, MAXQ = 40;
module.exports = H => {
  const rnd = n => Math.random() * n | 0;
  const alive = g => Object.keys(g.lives).filter(id => g.lives[id] > 0);
  function pickQ(g) {
    // الصعوبة تزيد مع الأسئلة
    const d = g.n < 5 ? 1 : g.n < 11 ? 2 : 3;
    let c = Q.map((q, i) => i).filter(i => !g.used.has(i) && Q[i][0] === d);
    if (!c.length) c = Q.map((q, i) => i).filter(i => !g.used.has(i));
    if (!c.length) { g.used.clear(); c = Q.map((q, i) => i); }
    const i = c[rnd(c.length)]; g.used.add(i); return Q[i];
  }
  function ask(r) {
    const g = r.g; g.n++;
    const q = pickQ(g), opts = H.shuffle([q[3], q[4], q[5], q[6]]);
    g.q = { cat: q[1], text: q[2], opts, ok: opts.indexOf(q[3]), d: q[0] };
    g.ans = {}; g.at = Date.now(); g.sub = 'q'; g.res = null; g.endAt = g.at + g.ms;
    H.setTimer(r, g.ms, () => reveal(r));
    g.bt.forEach(clearTimeout); g.bt = [];
    r.players.filter(p => p.bot && g.lives[p.id] > 0).forEach(b => {
      const t = setTimeout(() => {
        if (r.g !== g || g.sub !== 'q') return;
        const right = Math.random() < .88 - g.q.d * .12;
        g.ans[b.id] = { a: right ? g.q.ok : (g.q.ok + 1 + rnd(3)) % 4, ms: Date.now() - g.at };
        if (Object.keys(g.ans).length >= alive(g).length) reveal(r); else H.push(r);
      }, (1500 + rnd(g.ms - 2500)) * SCALE);
      g.bt.push(t);
    });
  }
  function reveal(r) {
    const g = r.g; if (g.sub !== 'q') return;
    g.sub = 'show'; g.bt.forEach(clearTimeout); g.bt = [];
    const al = alive(g), wrong = al.filter(id => !g.ans[id] || g.ans[id].a !== g.q.ok);
    // لو كل الباقين غلطوا، محد يخسر (عشان ما تخلص بدون فايز)
    const saved = wrong.length === al.length && al.length > 1;
    const out = [];
    if (!saved) wrong.forEach(id => { g.lives[id]--; if (g.lives[id] <= 0) { out.push(id); g.outAt[id] = g.n; } });
    const fast = al.filter(id => g.ans[id] && g.ans[id].a === g.q.ok).sort((a, b) => g.ans[a].ms - g.ans[b].ms)[0];
    g.res = { ok: g.q.ok, wrong, out, saved, fast: fast || null, dist: [0, 1, 2, 3].map(i => al.filter(id => g.ans[id] && g.ans[id].a === i).length) };
    if (out.length) H.log(r, `💀 طلعوا: ${out.map(id => (r.players.find(p => p.id === id) || {}).name || '؟').join('، ')}`);
    if (saved) H.log(r, '😅 كلكم غلطتوا… محد طلع هالمرة');
    const left = alive(g);
    H.setTimer(r, SHOW_MS * SCALE, () => (left.length <= 1 || g.n >= MAXQ) ? end(r) : ask(r));
    H.push(r);
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'over'; g.bt.forEach(clearTimeout);
    let ids = alive(g);
    if (!ids.length) { const last = Math.max(...Object.values(g.outAt)); ids = Object.keys(g.outAt).filter(id => g.outAt[id] === last); }
    if (ids.length > 1) { const top = Math.max(...ids.map(id => g.lives[id])); ids = ids.filter(id => g.lives[id] === top); }
    const ws = r.players.filter(p => ids.includes(p.id));
    r.winner = ws.map(p => p.name).join(' و ') || 'محد'; H.win(r, ws); H.setTimer(r, 0, null);
    H.log(r, `👑 ${r.winner} آخر واحد باقي!`);
  }
  return {
    min: 1, max: 42,
    start(r) {
      const lives = [1, 2, 3].includes(+r.opts.elives) ? +r.opts.elives : 1;
      const sec = [10, 15, 20].includes(+r.opts.etime) ? +r.opts.etime : 15;
      r.g = { n: 0, lives: {}, max: lives, outAt: {}, used: new Set(), q: null, ans: {}, sub: 'intro', ms: sec * 1000 * SCALE, sec, endAt: 0, bt: [], res: null };
      r.players.forEach(p => { r.g.lives[p.id] = lives; });
      r.winner = null; r.phase = 'play';
      H.log(r, `🎤 مسابقة الإقصاء: ${lives === 1 ? 'غلطة وحدة وتطلع' : lives + ' قلوب لكل لاعب'}`);
      H.setTimer(r, INTRO_MS * SCALE, () => ask(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || m.t !== 'ea' || g.sub !== 'q') return 'quiet';
      if (!(g.lives[p.id] > 0) || g.ans[p.id] || !(m.a >= 0 && m.a < 4)) return 'quiet';
      g.ans[p.id] = { a: +m.a, ms: Date.now() - g.at };
      if (Object.keys(g.ans).length >= alive(g).length) { reveal(r); return 'quiet'; }
      return;
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const q = g.q;
      return { sub: g.sub, n: g.n, sec: g.sec, max: g.max, lives: g.lives, left: g.sub === 'q' ? Math.max(0, g.endAt - Date.now()) : 0,
        q: q ? { cat: q.cat, text: q.text, opts: q.opts, d: q.d } : null, mine: g.ans[p.id] ? g.ans[p.id].a : null, answered: Object.keys(g.ans), res: g.res };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      delete g.lives[p.id];
      if (alive(g).length <= 1 && g.sub !== 'intro') end(r);
    }
  };
};
