// أعلام ودول: سؤال سريع بأربع خيارات، وكل ما جاوبت أسرع تاخذ نقاط أكثر
const D = require('./flags-data');
const SCALE = +process.env.FLAGS_SCALE || 1;
const Q_MS = 12000, SHOW_MS = 3500;
const rnd = n => Math.random() * n | 0;
const norm = s => String(s).replace(/[أإآ]/g, 'ا').replace(/^ال/, '');
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  function makeQ(g) {
    const pool = D.filter(d => (g.diff === 'all' || d.t) && !g.used.has(d.c));
    const kinds = g.mode === 'cap' ? ['cap'] : g.mode === 'flags' ? ['f2n', 'n2f'] : ['f2n', 'n2f', 'cap'];
    let kind, d;
    for (let k = 0; k < 30; k++) {
      kind = kinds[rnd(kinds.length)]; d = pool[rnd(pool.length)];
      if (kind !== 'cap' || (d.cap && norm(d.cap) !== norm(d.n))) break;
    }
    g.used.add(d.c);
    // الخيارات الغلط من نفس المنطقة أغلب الوقت (عشان تكون صعبة شوي)
    // أعلام شبه متطابقة ما تجي مع بعض
    const SAME = { id: 'mc', mc: 'id', td: 'ro', ro: 'td', ie: 'ci', ci: 'ie', nl: 'lu', lu: 'nl', au: 'nz', nz: 'au', sn: 'ml', ml: 'sn', ve: 'ec', ec: 'co', co: 'ec' };
    const all = D.filter(x => x.c !== d.c && x.c !== SAME[d.c] && (kind !== 'cap' || x.cap));
    const near = H.shuffle(all.filter(x => x.r === d.r)), far = H.shuffle(all.filter(x => x.r !== d.r));
    const wrong = [...near.slice(0, 2 + rnd(2)), ...far].slice(0, 3);
    const opts = H.shuffle([d, ...wrong]);
    return { kind, c: d.c, n: d.n, opts: opts.map((x, i) => ({ i, c: x.c, n: x.n, cap: x.cap })), ok: opts.indexOf(d) };
  }
  function ask(r) {
    const g = r.g; g.k++; g.bt.forEach(clearTimeout); g.bt = [];
    g.q = makeQ(g); g.sub = 'q'; g.ans = {}; g.at = Date.now(); g.gain = {};
    g.next = null;
    H.setTimer(r, Q_MS * SCALE, () => show(r));
    r.players.filter(p => p.bot).forEach(b => later(r, (1800 + rnd(8000)) * SCALE, () => {
      const acc = g.diff === 'all' ? .5 : .68;
      answer(r, b, Math.random() < acc ? g.q.ok : (g.q.ok + 1 + rnd(3)) % 4);
    }));
  }
  function answer(r, p, i) {
    const g = r.g; if (g.sub !== 'q' || p.spec || g.ans[p.id] || !(i >= 0 && i < 4)) return;
    g.ans[p.id] = { i, t: Date.now() - g.at };
    if (r.players.every(q => g.ans[q.id] || !q.online)) H.setTimer(r, 600, () => show(r));
  }
  function show(r) {
    const g = r.g; if (g.sub !== 'q') return;
    g.sub = 'show'; g.bt.forEach(clearTimeout); g.bt = [];
    for (const [id, a] of Object.entries(g.ans)) {
      if (!byId(r, id)) continue;
      if (a.i === g.q.ok) {
        g.streak[id] = (g.streak[id] || 0) + 1;
        const pts = 500 + Math.round(500 * Math.max(0, 1 - a.t / (Q_MS * SCALE))) + (g.streak[id] >= 3 ? 100 : 0);
        g.scores[id] = (g.scores[id] || 0) + pts; g.gain[id] = pts;
      } else g.streak[id] = 0;
    }
    r.players.forEach(p => { if (!g.ans[p.id]) g.streak[p.id] = 0; });
    H.setTimer(r, SHOW_MS * SCALE, () => g.k >= g.count ? end(r) : ask(r));
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end';
    const top = Math.max(0, ...r.players.map(p => g.scores[p.id] || 0)), ws = r.players.filter(p => (g.scores[p.id] || 0) === top);
    r.winner = ws.map(p => p.name).join(' و ') || 'انتهت اللعبة'; r.winTeam = null; H.win(r, ws); H.setTimer(r, 0, null);
  }
  return {
    min: 1, max: 12,
    start(r) {
      const count = [10, 15, 20].includes(r.opts.fcount) ? r.opts.fcount : 10;
      r.g = { count, k: 0, mode: ['flags', 'cap', 'mix'].includes(r.opts.fmode) ? r.opts.fmode : 'flags', diff: r.opts.fdiff === 'all' ? 'all' : 'easy', used: new Set(), scores: {}, streak: {}, gain: {}, ans: {}, q: null, sub: 'intro', bt: [], at: 0 };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'جاوب أسرع تاخذ نقاط أكثر');
      H.setTimer(r, 2500 * SCALE, () => ask(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'fans') return answer(r, p, +m.i);
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const q = g.q, sh = g.sub === 'show' || g.sub === 'end';
      return {
        sub: g.sub, k: g.k, count: g.count, mode: g.mode, scores: g.scores, streak: g.streak, gain: sh ? g.gain : null,
        q: q && { kind: q.kind, c: q.kind === 'n2f' ? null : q.c, n: q.kind === 'f2n' ? null : q.n, opts: q.opts.map(o => q.kind === 'n2f' ? { i: o.i, c: o.c } : q.kind === 'cap' ? { i: o.i, t: o.cap } : { i: o.i, t: o.n }) },
        ans: Object.keys(g.ans), my: g.ans[p.id] ? g.ans[p.id].i : null,
        ok: sh && q ? q.ok : null, name: sh && q ? q.n : null, picks: sh ? Object.fromEntries(Object.entries(g.ans).map(([id, a]) => [id, a.i])) : null
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      delete g.ans[p.id];
      if (g.sub === 'q' && r.players.length && r.players.every(q => g.ans[q.id] || !q.online)) H.setTimer(r, 600, () => show(r));
    }
  };
};
