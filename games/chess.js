// شطرنج: القواعد من chess.js (games/vendor)، والبوت من games/chess-ai.js داخل worker_thread.
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
  const side = (g, id) => g.w === id ? 'w' : g.b === id ? 'b' : null;
  function clockTick(r) {
    const g = r.g; if (!g.tc || g.over) return;
    const now = Date.now(), t = g.c.turn();
    g.clk[t] -= now - g.clkAt; g.clkAt = now;
    H.setTimer(r, Math.max(50, g.clk[t]), () => { const g2 = r.g; g2.clk[t] -= Date.now() - g2.clkAt; g2.clkAt = Date.now(); if (g2.clk[t] <= 0) { g2.clk[t] = 0; finish(r, t === 'w' ? 'b' : 'w', 'time'); } else clockTick(r); });
  }
  function finish(r, win, why) {
    const g = r.g; if (g.over) return;
    g.over = { win, why }; r.phase = 'over'; H.setTimer(r, 0, null);
    if (win) { const w = byId(r, win === 'w' ? g.w : g.b); r.winner = w ? w.name : (win === 'w' ? 'الأبيض' : 'الأسود'); if (w) H.win(r, [w]); }
    else r.winner = 'تعادل';
    r.winTeam = null;
  }
  function afterMove(r) {
    const g = r.g, c = g.c;
    if (c.isCheckmate()) return finish(r, c.turn() === 'w' ? 'b' : 'w', 'mate');
    if (c.isStalemate()) return finish(r, null, 'stale');
    if (c.isInsufficientMaterial()) return finish(r, null, 'material');
    if (c.isThreefoldRepetition()) return finish(r, null, 'repeat');
    if (c.isDraw()) return finish(r, null, 'fifty');
    if (g.tc) { const mover = c.turn() === 'w' ? 'b' : 'w'; g.clk[mover] += g.tc[1]; }
    g.clkAt = Date.now(); clockTick(r);
    botMove(r);
  }
  function play(r, p, m) {
    const g = r.g; if (g.over) return;
    const s = side(g, p.id); if (!s || g.c.turn() !== s) return;
    let mv; try { mv = g.c.move({ from: String(m.from), to: String(m.to), promotion: m.promotion ? String(m.promotion)[0] : undefined }); } catch { mv = null; }
    if (!mv) { H.err(p, 'حركة مو قانونية'); return; }
    if (g.tc) { g.clk[s] -= Date.now() - g.clkAt; }
    g.last = { from: mv.from, to: mv.to, san: mv.san, cap: !!mv.captured, n: (g.last ? g.last.n : 0) + 1 };
    if (mv.captured) g.caps[s].push(mv.captured);
    g.drawBy = null;
    afterMove(r);
  }
  function botMove(r) {
    const g = r.g; if (g.over) return;
    const id = g.c.turn() === 'w' ? g.w : g.b, b = byId(r, id); if (!b || !b.bot) return;
    const fen = g.c.fen(), n = g.c.history().length, t0 = Date.now();
    think(fen, LV[g.lv] || LV.mid).then(mv => {
      setTimeout(() => {
        if (!H.alive(r) || r.g !== g || g.over || g.c.fen() !== fen) return;
        if (!mv) { const all = g.c.moves({ verbose: true }); mv = all[Math.random() * all.length | 0]; }
        play(r, b, mv); H.push(r);
      }, Math.max(0, 650 - (Date.now() - t0)));
    });
  }
  return {
    min: 2, max: 2,
    start(r) {
      const ids = r.players.map(p => p.id);
      let [w, b] = r.opts.ccolor === 'host' ? ids : H.shuffle(ids.slice());
      const tc = TC[r.opts.ctime] || null;
      r.g = { c: new Chess(), w, b, tc, clk: tc ? { w: tc[0], b: tc[0] } : null, clkAt: Date.now(), last: null, caps: { w: [], b: [] }, drawBy: null, over: null, lv: LV[r.opts.clevel] ? r.opts.clevel : 'mid' };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'الأبيض يبدأ');
      if (tc) clockTick(r); else H.setTimer(r, 0, null);
      botMove(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || g.over) return;
      const s = side(g, p.id); if (!s) return;
      if (m.t === 'cmove') { if (!H.rate(p, 'cm', 150)) return 'quiet'; return play(r, p, m); }
      if (m.t === 'cresign') return finish(r, s === 'w' ? 'b' : 'w', 'resign');
      if (m.t === 'cdraw') {
        const opp = byId(r, s === 'w' ? g.b : g.w);
        if (opp && opp.bot) { H.err(p, 'البوت ما يقبل تعادل 😏'); return; }
        if (g.drawBy && g.drawBy !== s) return finish(r, null, 'agree');
        g.drawBy = s; return;
      }
      if (m.t === 'cnodraw') { if (g.drawBy && g.drawBy !== s) g.drawBy = null; return; }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const c = g.c, s = side(g, p.id), my = !g.over && s && c.turn() === s;
      const clk = g.clk && { w: g.clk.w, b: g.clk.b, run: g.over ? null : c.turn(), at: g.clkAt };
      return {
        fen: c.fen(), turn: c.turn(), me: s, w: g.w, b: g.b, check: c.inCheck(), last: g.last, hist: c.history(), caps: g.caps, drawBy: g.drawBy, over: g.over, lv: g.lv, tc: !!g.tc, clk, now: Date.now(),
        moves: my ? c.moves({ verbose: true }).map(m => m.from + m.to + (m.promotion || '')) : []
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play' || g.over) return;
      const s = side(g, p.id); if (s) finish(r, s === 'w' ? 'b' : 'w', 'left');
    }
  };
};
