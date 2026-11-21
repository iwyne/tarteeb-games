// بينقو: لكل لاعب ورقة ٥×٥ (ب ١-١٥، ي ١٦-٣٠، ن ٣١-٤٥ والنص مجاني، ق ٤٦-٦٠، و ٦١-٧٥).
// الأرقام تطلع كل كم ثانية، وكل واحد يعلّم أرقامه. أول واحد يكمّل المطلوب (خط/خطين/الورقة كاملة) ويضغط «بينقو!» يفوز.
// اللي يضغط بينقو غلط ينتظر ١٠ ثواني ما يقدر يضغط.
const SCALE = +process.env.BINGO_SCALE || 1;
const FREEZE = 10000;
const LET = ['ب', 'ي', 'ن', 'ق', 'و'];
const num = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const colOf = n => Math.floor((n - 1) / 15);
module.exports = H => {
  const ms = x => x * SCALE, rnd = n => Math.random() * n | 0;
  const P = (r, id) => r.players.find(p => p.id === id);
  const fx = (r, o) => H.cast(r, Object.assign({ t: 'gnet', g: 'bingo' }, o));
  function card() {
    const cols = [0, 1, 2, 3, 4].map(c => H.shuffle(Array.from({ length: 15 }, (_, i) => c * 15 + i + 1)).slice(0, 5));
    const out = []; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) out.push(x === 2 && y === 2 ? 0 : cols[x][y]);
    return out; // صف صف، x = العمود
  }
  const LINES = (() => { const L = []; for (let i = 0; i < 5; i++) { L.push([0, 1, 2, 3, 4].map(k => i * 5 + k)); L.push([0, 1, 2, 3, 4].map(k => k * 5 + i)); } L.push([0, 6, 12, 18, 24]); L.push([4, 8, 12, 16, 20]); return L; })();
  // كم خط كامل، وكم ناقص لأقرب هدف
  function status(r, id, useCalled) {
    const g = r.g, c = g.cards[id], mk = useCalled ? new Set(g.called) : g.marks[id];
    const on = i => c[i] === 0 || mk.has(c[i]);
    const need = g.goal;
    if (need === 'full') { const miss = c.filter((_, i) => !on(i)).length; return { done: miss === 0, miss }; }
    const want = need === 'two' ? 2 : 1, miss = LINES.map(l => l.filter(i => !on(i)).length).sort((a, b) => a - b);
    const done = miss.filter(x => x === 0).length >= want;
    return { done, miss: want === 2 ? miss[0] + miss[1] : miss[0] };
  }
  function call(r) {
    const g = r.g; if (r.phase !== 'play') return;
    if (!g.bag.length) { r.phase = 'over'; g.sub = 'over'; r.winner = 'محد'; H.log(r, 'خلصت الأرقام ومحد قال بينقو!'); H.setTimer(r, 0, null); return H.push(r); }
    const n = g.bag.pop(); g.called.push(n); g.last = n; g.next = Date.now() + ms(g.speed);
    for (const p of r.players) if (g.cards[p.id] && (g.auto || p.bot) && g.cards[p.id].includes(n)) { if (p.bot) setTimeout(() => { if (r.g === g) { g.marks[p.id].add(n); botClaim(r, p); } }, ms(600 + rnd(1800))); else g.marks[p.id].add(n); }
    fx(r, { k: 'call', n, l: LET[colOf(n)] });
    H.setTimer(r, ms(g.speed), () => call(r)); H.push(r);
  }
  function botClaim(r, p) { const g = r.g; if (r.phase === 'play' && status(r, p.id).done) setTimeout(() => { if (r.g === g) claim(r, p); }, ms(700 + rnd(2200))); }
  function claim(r, p) {
    const g = r.g; if (r.phase !== 'play' || !g.cards[p.id]) return;
    if ((g.frozen[p.id] || 0) > Date.now()) return;
    if (status(r, p.id).done) {
      r.phase = 'over'; g.sub = 'over'; g.winner = p.id; r.winner = p.name; H.win(r, [p]); H.setTimer(r, 0, null);
      fx(r, { k: 'win', id: p.id }); H.log(r, `🎉 ${p.name}: بينقو! فاز بعد ${num(g.called.length)} رقم`); return H.push(r);
    }
    g.frozen[p.id] = Date.now() + ms(FREEZE); g.fails[p.id] = (g.fails[p.id] || 0) + 1;
    fx(r, { k: 'bad', id: p.id }); H.log(r, `❌ ${p.name} قال بينقو وهو غلطان! ينتظر ١٠ ثواني`); H.push(r);
  }
  return {
    min: 1, max: 42,
    start(r) {
      const speed = [3, 5, 7].includes(+r.opts.bspeed) ? +r.opts.bspeed * 1000 : 5000;
      const goal = ['line', 'two', 'full'].includes(r.opts.bgoal) ? r.opts.bgoal : 'line';
      r.g = { cards: {}, marks: {}, frozen: {}, fails: {}, called: [], bag: H.shuffle(Array.from({ length: 75 }, (_, i) => i + 1)), last: 0, next: 0, speed, goal, auto: !!r.opts.bauto, sub: 'play', winner: null };
      for (const p of r.players) { r.g.cards[p.id] = card(); r.g.marks[p.id] = new Set(); }
      r.winner = null; r.phase = 'play';
      H.log(r, `🎱 بينقو! ${goal === 'full' ? 'كمّل الورقة كاملة' : goal === 'two' ? 'كمّل خطين' : 'كمّل خط'} واضغط «بينقو!»`);
      r.g.next = Date.now() + ms(3000); H.setTimer(r, ms(3000), () => call(r)); H.push(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || !g.cards[p.id]) return 'quiet';
      if (m.t === 'bmark') { const n = +m.n; if (!H.rate(p, 'bm', 60) || !g.cards[p.id].includes(n) || !g.called.includes(n)) return 'quiet'; g.marks[p.id].has(n) ? g.marks[p.id].delete(n) : g.marks[p.id].add(n); return 'quiet'; }
      if (m.t === 'bclaim') { if (H.rate(p, 'bc', 500)) claim(r, p); return 'quiet'; }
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const near = {}; for (const id of Object.keys(g.cards)) near[id] = status(r, id, true).miss;
      return { card: g.cards[p.id] || null, marks: g.marks[p.id] ? [...g.marks[p.id]] : [], called: g.called, last: g.last, left: Math.max(0, g.next - Date.now()), speed: g.speed, goal: g.goal, auto: g.auto, near, frozen: Math.max(0, (g.frozen[p.id] || 0) - Date.now()), winner: g.winner, wcard: g.winner ? g.cards[g.winner] : null, skin: r.opts.bskin || 'diw' };
    },
    leave(r) { if (r.phase === 'play' && !r.players.filter(p => !p.bot).length) { r.phase = 'over'; H.setTimer(r, 0, null); } }
  };
};
