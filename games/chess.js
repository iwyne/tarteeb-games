// شطرنج: القواعد من chess.js (games/vendor)، والبوت من games/chess-ai.js داخل worker_thread.
// أكثر من طاولة: كل اثنين قدام بعض (لين ٤ طاولات). اللاعب الفردي يتفرج. اللعبة تخلص لما كل الطاولات تخلص.
const { Chess } = require('./vendor/chess.js');
const path = require('path');
const { Worker } = require('worker_threads');
const TC = { none: null, '3+2': [180000, 2000], '5': [300000, 0], '10': [600000, 0] };
const LV = { easy: { depth: 2, ms: 400, noise: 120 }, mid: { depth: 3, ms: 900, noise: 25 }, hard: { depth: 5, ms: 1800 } };
let WK = null, wkId = 0; const wkWait = {};
function think(fen, opts) {
  if (!WK) {
    WK = new Worker(path.join(__dirname, 'chess-ai.js'));
    WK.on('message', ({ id, move }) => { const f = wkWait[id]; delete wkWait[id]; if (f) f(move); });
    WK.on('error', () => { for (const k in wkWait) { wkWait[k](null); delete wkWait[k]; } WK = null; });
    WK.unref();
  }
  return new Promise(res => { const id = ++wkId; wkWait[id] = res; WK.postMessage({ id, fen, opts }); });
}
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  const seat = (g, id) => { for (const t of g.T) { if (t.w === id) return [t, 'w']; if (t.b === id) return [t, 'b']; } return [null, null]; };
  const live = (r, g) => H.alive(r) && r.g === g && r.phase === 'play';
  function clockTick(r, t) {
    clearTimeout(t.tm); if (!t.tc || t.over) return;
    const g = r.g, now = Date.now(), s = t.c.turn();
    t.clk[s] -= now - t.clkAt; t.clkAt = now;
    t.tm = setTimeout(() => {
      if (!live(r, g) || t.over) return;
      t.clk[s] -= Date.now() - t.clkAt; t.clkAt = Date.now();
      if (t.clk[s] <= 0) { t.clk[s] = 0; finish(r, t, s === 'w' ? 'b' : 'w', 'time'); } else clockTick(r, t);
      H.push(r);
    }, Math.max(50, t.clk[s]));
  }
  function finish(r, t, win, why) {
    if (t.over) return;
    t.over = { win, why }; clearTimeout(t.tm);
    const g = r.g;
    if (g.T.every(x => x.over)) {
      r.phase = 'over'; H.setTimer(r, 0, null); r.winTeam = null;
      const ws = g.T.map(x => x.over.win ? byId(r, x.over.win === 'w' ? x.w : x.b) : null).filter(Boolean);
      r.winner = ws.length ? ws.map(p => p.name).join(' و ') : 'تعادل';
      if (ws.length) H.win(r, ws);
    }
  }
  function afterMove(r, t) {
    const c = t.c;
    if (c.isCheckmate()) return finish(r, t, c.turn() === 'w' ? 'b' : 'w', 'mate');
    if (c.isStalemate()) return finish(r, t, null, 'stale');
    if (c.isInsufficientMaterial()) return finish(r, t, null, 'material');
    if (c.isThreefoldRepetition()) return finish(r, t, null, 'repeat');
    if (c.isDraw()) return finish(r, t, null, 'fifty');
    if (t.tc) { const mover = c.turn() === 'w' ? 'b' : 'w'; t.clk[mover] += t.tc[1]; }
    t.clkAt = Date.now(); clockTick(r, t);
    botMove(r, t);
  }
  function play(r, t, s, id, m) {
    if (t.over || t.c.turn() !== s) return 'turn';
    let mv; try { mv = t.c.move({ from: String(m.from), to: String(m.to), promotion: m.promotion ? String(m.promotion)[0] : undefined }); } catch { mv = null; }
    if (!mv) return 'bad';
    if (t.tc) t.clk[s] -= Date.now() - t.clkAt;
    t.last = { from: mv.from, to: mv.to, san: mv.san, cap: !!mv.captured, n: (t.last ? t.last.n : 0) + 1 };
    if (mv.captured) t.caps[s].push(mv.captured);
    t.drawBy = null;
    afterMove(r, t);
  }
  function botMove(r, t) {
    const g = r.g; if (t.over) return;
    const s = t.c.turn(), b = byId(r, s === 'w' ? t.w : t.b); if (!b || !b.bot) return;
    const fen = t.c.fen(), t0 = Date.now();
    think(fen, LV[g.lv] || LV.mid).then(mv => {
      setTimeout(() => {
        if (!live(r, g) || t.over || t.c.fen() !== fen) return;
        if (!mv) { const all = t.c.moves({ verbose: true }); mv = all[Math.random() * all.length | 0]; }
        play(r, t, s, b.id, mv); H.push(r);
      }, Math.max(0, 650 - (Date.now() - t0)));
    });
  }
  return {
    min: 2, max: 8,
    start(r) {
      const ids = r.players.map(p => p.id), host = ids[0];
      let order = H.shuffle(ids.slice());
      // المضيف أبيض بالطاولة الأولى لو اختار كذا
      if (r.opts.ccolor === 'host') order = [host, ...order.filter(x => x !== host)];
      const tc = TC[r.opts.ctime] || null, T = [];
      for (let i = 0; i + 1 < order.length; i += 2) {
        const pair = r.opts.ccolor === 'host' && i === 0 ? [order[0], order[1]] : H.shuffle([order[i], order[i + 1]]);
        T.push({ i: T.length, c: new Chess(), w: pair[0], b: pair[1], tc, clk: tc ? { w: tc[0], b: tc[0] } : null, clkAt: Date.now(), last: null, caps: { w: [], b: [] }, drawBy: null, over: null, tm: null });
      }
      const out = order.length % 2 ? order[order.length - 1] : null;
      r.g = { T, out, lv: LV[r.opts.clevel] ? r.opts.clevel : 'mid' };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, T.length > 1 ? `${T.length} طاولات… بالتوفيق!` : 'الأبيض يبدأ');
      H.setTimer(r, 0, null);
      T.forEach(t => { clockTick(r, t); botMove(r, t); });
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      const [t, s] = seat(g, p.id); if (!t || t.over) return;
      if (m.t === 'cmove') {
        if (!H.rate(p, 'cm', 150)) return 'quiet';
        const e = play(r, t, s, p.id, m); if (e === 'bad') H.err(p, 'حركة مو قانونية'); return;
      }
      if (m.t === 'cresign') return finish(r, t, s === 'w' ? 'b' : 'w', 'resign');
      if (m.t === 'cdraw') {
        const opp = byId(r, s === 'w' ? t.b : t.w);
        if (opp && opp.bot) { H.err(p, 'البوت ما يقبل تعادل 😏'); return; }
        if (t.drawBy && t.drawBy !== s) return finish(r, t, null, 'agree');
        t.drawBy = s; return;
      }
      if (m.t === 'cnodraw') { if (t.drawBy && t.drawBy !== s) t.drawBy = null; return; }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const [mt, ms] = seat(g, p.id);
      return {
        lv: g.lv, out: g.out, now: Date.now(), my: mt ? mt.i : -1, me: ms,
        T: g.T.map(t => ({
          i: t.i, fen: t.c.fen(), turn: t.c.turn(), w: t.w, b: t.b, check: t.c.inCheck(), last: t.last, hist: t.c.history(), caps: t.caps, drawBy: t.drawBy, over: t.over, tc: !!t.tc,
          clk: t.clk && { w: t.clk.w, b: t.clk.b, run: t.over ? null : t.c.turn(), at: t.clkAt },
          moves: t === mt && !t.over && t.c.turn() === ms ? t.c.moves({ verbose: true }).map(m => m.from + m.to + (m.promotion || '')) : []
        }))
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      const [t, s] = seat(g, p.id); if (t && !t.over) finish(r, t, s === 'w' ? 'b' : 'w', 'left');
    }
  };
};
