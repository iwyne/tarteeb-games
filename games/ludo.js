// لودو: ٢-٤ لاعبين، لكل واحد ٤ قطع. الستة تطلّع من البيت، ولو طلعت ستة ترمي مرة ثانية قبل ما تتحرك وتتجمّع الأرقام (٦ و٤ مثلاً) وتحرّك بكل رقم (وثلاث ستات ورا بعض يضيع الدور).
// تاكل قطعة الخصم لو وقفت عليها (إلا بأماكن الأمان: بدايات الألوان والنجوم) وتاخذ رمية زيادة. أول واحد يدخّل قطعه الأربع يفوز.
// التقدّم لكل قطعة: -1 بالبيت، 0..50 على المسار، 51..55 الممر الملوّن، 56 وصلت.
const SCALE = +process.env.LUDO_SCALE || 1;
const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];
const num = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
module.exports = H => {
  const ms = x => x * SCALE, rnd = n => Math.random() * n | 0;
  const P = (r, id) => r.players.find(p => p.id === id);
  const abs = (c, p) => (p + 13 * c) % 52;
  const fx = (r, o) => H.cast(r, Object.assign({ t: 'gnet', g: 'ludo' }, o));
  const tsec = r => (r.opts.ltime || 20) * 1000;
  function moves(r, id, d) {
    const g = r.g, out = [];
    g.pcs[id].forEach((p, i) => { if (p === -1 ? d === 6 : p >= 0 && p + d <= 56) out.push(i); });
    return out;
  }
  // الحركات الممكنة لكل رقم من الأرقام اللي طلعت: [{k: رقم بالقائمة, i: القطعة}]
  const options = (r, id) => { const out = []; r.g.dice.forEach((d, k) => moves(r, id, d).forEach(i => out.push({ k, i }))); return out; };
  function startTurn(r) {
    const g = r.g; if (r.phase !== 'play') return;
    g.sub = 'roll'; g.die = 0; g.dice = []; g.can = []; g.opts = []; g.bonus = false; g.dl = Date.now() + ms(tsec(r));
    H.setTimer(r, ms(tsec(r)), () => { roll(r, P(r, g.turn)); });
    bot(r); H.push(r);
  }
  function next(r, again) {
    const g = r.g;
    if (!again) { const i = g.order.indexOf(g.turn); g.turn = g.order[(i + 1) % g.order.length]; }
    startTurn(r);
  }
  // الرمي: الستة تعطيك رمية ثانية قبل ما تتحرك (وتتجمّع الأرقام)، وثلاث ستات ورا بعض يضيع الدور
  function roll(r, p, f) {
    const g = r.g; if (!p || g.sub !== 'roll' || g.turn !== p.id) return;
    f = p.boss && f >= 1 && f <= 6 ? f | 0 : 0; if (f) (r.noPts = r.noPts || new Set()).add(p.id); // رقم مختار: ما ياخذ نقاط سيرفر على هالجولة
    // لو ما عندك ولا قطعة برا البيت: الستة تطلع أكثر (٣٥٪)، ولو ما طلعت ٣ أدوار ورا بعض تطلع غصب
    const stuck = !g.dice.length && g.pcs[p.id].every(x => x === -1 || x === 56); g.miss = g.miss || {};
    const d = f || (stuck ? (g.miss[p.id] >= 3 || Math.random() < .35 ? 6 : 1 + rnd(5)) : 1 + rnd(6));
    if (stuck) g.miss[p.id] = d === 6 ? 0 : (g.miss[p.id] || 0) + 1;
    g.die = d; g.rolls++; g.dice.push(d);
    fx(r, { k: 'roll', id: p.id, d });
    if (g.dice.length >= 3 && g.dice.slice(-3).every(x => x === 6)) { H.log(r, `🎲 ${p.name} طلعت له ثلاث ستات وضاع دوره`); g.dice = []; g.sub = 'wait'; H.push(r); return H.setTimer(r, ms(1400), () => next(r)); }
    if (d === 6) { g.dl = Date.now() + ms(tsec(r)); H.push(r); H.setTimer(r, ms(tsec(r)), () => roll(r, p)); return bot(r); }
    toMove(r, p);
  }
  function toMove(r, p) {
    const g = r.g; g.opts = options(r, p.id); g.can = [...new Set(g.opts.map(o => o.i))];
    if (!g.opts.length) { g.dice = []; g.sub = 'wait'; H.push(r); return H.setTimer(r, ms(1300), () => next(r, g.bonus)); }
    g.sub = 'move'; g.dl = Date.now() + ms(tsec(r));
    // خيار واحد بس (أو كل الخيارات نفس الشي): يتحرك لحاله
    const sig = new Set(g.opts.map(o => g.pcs[p.id][o.i] + ':' + g.dice[o.k]));
    if (sig.size === 1) { H.push(r); return H.setTimer(r, ms(900), () => move(r, p, g.opts[0].i, g.opts[0].k)); }
    H.setTimer(r, ms(tsec(r)), () => move(r, p, g.opts[0].i, g.opts[0].k));
    bot(r); H.push(r);
  }
  function move(r, p, i, k) {
    const g = r.g; if (!p || g.sub !== 'move' || g.turn !== p.id) return;
    if (!(k >= 0 && k < g.dice.length)) { const o = g.opts.find(o => o.i === i); if (!o) return; k = o.k; } // ما حدد الرقم: أول رقم يمشي
    if (!g.opts.some(o => o.i === i && o.k === k)) return;
    const d = g.dice[k], c = g.seat[p.id], from = g.pcs[p.id][i], to = from === -1 ? 0 : from + d;
    g.dice.splice(k, 1); g.die = d;
    g.pcs[p.id][i] = to; g.sub = 'wait';
    let hit = null;
    if (to <= 50) {
      const a = abs(c, to);
      if (!SAFE.includes(a)) for (const id of g.order) { if (id === p.id) continue; const oc = g.seat[id]; g.pcs[id].forEach((q, j) => { if (q >= 0 && q <= 50 && abs(oc, q) === a) { g.pcs[id][j] = -1; hit = { id, j }; g.stats[p.id].kills++; } }); }
    }
    if (hit) { g.bonus = true; H.log(r, `💥 ${p.name} أكل قطعة ${P(r, hit.id) ? P(r, hit.id).name : ''}!`); }
    if (to === 56) { g.bonus = true; H.log(r, `🏠 ${p.name} دخّل قطعة (${num(g.pcs[p.id].filter(x => x === 56).length)}/٤)`); }
    fx(r, { k: 'move', id: p.id, i, from, to, hit });
    if (g.pcs[p.id].every(x => x === 56)) return win(r, p);
    H.push(r);
    const steps = from === -1 ? 1 : d;
    // باقي أرقام؟ كمّل فيها، وإلا الدور للي بعده (أو رمية زيادة لو أكلت أو وصّلت)
    H.setTimer(r, ms(260 * steps + (hit ? 700 : 300)), () => g.dice.length ? toMove(r, p) : next(r, g.bonus));
  }
  function win(r, p) {
    const g = r.g; r.phase = 'over'; g.sub = 'over'; g.winner = p.id; r.winner = p.name; H.win(r, [p]); H.setTimer(r, 0, null);
    H.log(r, `👑 ${p.name} دخّل قطعه الأربع وفاز!`); H.push(r);
  }
  // ===== البوت =====
  function bot(r) {
    const g = r.g, p = P(r, g.turn); if (!p || !p.bot) return;
    if (g.sub === 'roll') return void setTimeout(() => { if (r.g === g && g.sub === 'roll' && g.turn === p.id) roll(r, p); }, ms(900 + rnd(700)));
    if (g.sub === 'move') setTimeout(() => {
      if (r.g !== g || g.sub !== 'move' || g.turn !== p.id) return;
      const c = g.seat[p.id], score = ({ i, k }) => {
        const from = g.pcs[p.id][i], to = from === -1 ? 0 : from + g.dice[k]; let s = 0;
        if (to === 56) s += 50; if (from === -1) s += 30;
        if (to <= 50) { const a = abs(c, to); for (const id of g.order) if (id !== p.id) g.pcs[id].forEach(q => { if (q >= 0 && q <= 50 && abs(g.seat[id], q) === a && !SAFE.includes(a)) s += 60; }); if (SAFE.includes(a)) s += 10; }
        if (to > 50) s += 15; return s + to / 10;
      };
      const best = g.opts.slice().sort((a, b) => score(b) - score(a))[0]; move(r, p, best.i, best.k);
    }, ms(800 + rnd(600)));
  }
  return {
    min: 2, max: 4,
    start(r) {
      const ids = H.shuffle(r.players.map(p => p.id)), seat = {};
      const cols = ids.length === 2 ? [0, 2] : ids.length === 3 ? [0, 1, 2] : [0, 1, 2, 3];
      ids.forEach((id, i) => { seat[id] = cols[i]; });
      r.g = { order: ids.slice().sort((a, b) => seat[a] - seat[b]), seat, pcs: {}, stats: {}, turn: null, sub: 'roll', die: 0, dice: [], opts: [], bonus: false, can: [], rolls: 0, dl: 0 };
      for (const id of ids) { r.g.pcs[id] = [-1, -1, -1, -1]; r.g.stats[id] = { kills: 0 }; }
      r.g.turn = r.g.order[0]; r.winner = null; r.phase = 'play';
      H.log(r, '🎲 بدت لودو! الستة تطلّع من البيت'); startTurn(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || !H.rate(p, 'lu', 200)) return 'quiet';
      if (m.t === 'lroll') roll(r, p, +m.f); else if (m.t === 'lmove') move(r, p, +m.i, m.k === undefined ? -1 : +m.k);
      return 'quiet';
    },
    view(r) {
      const g = r.g; if (!g) return null;
      return { sub: g.sub, turn: g.turn, die: g.die, dice: g.dice, opts: g.opts, can: g.can, seat: g.seat, pcs: g.pcs, order: g.order, winner: g.winner || null, stats: g.stats, left: g.dl ? Math.max(0, g.dl - Date.now()) : 0, total: ms(tsec(r)) };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play' || !g.order.includes(p.id)) return;
      g.order = g.order.filter(id => id !== p.id);
      if (g.order.length < 2) { const w = P(r, g.order[0]); if (w) return win(r, w); r.phase = 'over'; return; }
      if (g.turn === p.id) { g.turn = g.order[0]; startTurn(r); } else H.push(r);
    }
  };
};
