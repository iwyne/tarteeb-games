// كلمة السر: فريقين، قائد لكل فريق يشوف ألوان الكلمات ويعطي تلميح، والباقي يخمّنون
const WORDS = require('./words');
module.exports = H => {
  const other = t => 1 - t;
  const spyOf = (r, t) => r.players.find(p => p.id === r.g.spy[t]);
  const team = (r, t) => r.players.filter(p => p.team === t);
  const canGuess = (r, p) => {
    const g = r.g; if (g.sub !== 'guess' || p.team !== g.turn) return false;
    return p.id !== g.spy[g.turn] || team(r, g.turn).length === 1;
  };
  function finish(r, wt, why) {
    r.phase = 'over'; r.g.done = true; r.winTeam = wt; r.score[wt]++;
    r.winner = 'فريق ' + ['أ', 'ب'][wt];
    H.log(r, why); H.win(r, team(r, wt));
  }
  function endTurn(r) { const g = r.g; g.turn = other(g.turn); g.sub = 'clue'; g.clue = null; g.left = 0; }
  return {
    min: 4, max: 10,
    start(r) {
      const pool = r.opts.words && r.opts.words.length >= 25 ? r.opts.words : WORDS;
      const words = H.shuffle(pool.slice()).slice(0, 25);
      const first = Math.random() < .5 ? 0 : 1;
      const kinds = [].concat(Array(9).fill(first), Array(8).fill(other(first)), Array(7).fill(-1), [-2]); // -1 محايد، -2 قاتلة
      H.shuffle(kinds);
      r.players.forEach((p, i) => { p.team = i % 2; });
      r.g = {
        cards: words.map((w, i) => ({ w, k: kinds[i], open: false })),
        turn: first, sub: 'clue', clue: null, left: 0,
        remain: [kinds.filter(k => k === 0).length, kinds.filter(k => k === 1).length],
        spy: [0, 1].map(t => r.players.find(p => p.team === t).id), hist: []
      };
      r.winTeam = null; r.winner = null; r.phase = 'play';
      H.log(r, `بدأت اللعبة — يبدأ فريق ${['أ', 'ب'][first]}`);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'clue') {
        if (g.sub !== 'clue' || p.id !== g.spy[g.turn]) return;
        const word = String(m.word || '').trim().split(/\s+/)[0].slice(0, 20);
        const n = Math.max(0, Math.min(9, +m.n | 0));
        if (!word) return;
        if (g.cards.some(c => !c.open && c.w === word)) return H.err(p, 'التلميح ما ينفع يكون كلمة من الطاولة');
        g.clue = { word, n }; g.left = n + 1; g.sub = 'guess';
        g.hist.push({ t: g.turn, word, n }); if (g.hist.length > 12) g.hist.shift();
        H.log(r, `قائد فريق ${['أ', 'ب'][g.turn]}: «${word}» ${n}`);
      } else if (m.t === 'guess') {
        if (!canGuess(r, p)) return;
        const c = g.cards[m.i | 0]; if (!c || c.open) return;
        c.open = true; g.last = c.w;
        const me = g.turn;
        if (c.k === -2) return finish(r, other(me), `${p.name} اختار الكلمة القاتلة! فاز فريق ${['أ', 'ب'][other(me)]}`);
        if (c.k >= 0) g.remain[c.k]--;
        if (g.remain[0] === 0) return finish(r, 0, 'فريق أ كشف كل كلماته');
        if (g.remain[1] === 0) return finish(r, 1, 'فريق ب كشف كل كلماته');
        g.left--;
        if (c.k !== me || g.left <= 0) { H.log(r, `${p.name} اختار «${c.w}»` + (c.k === me ? '' : c.k === -1 ? ' — محايدة' : ' — كلمة الخصم')); endTurn(r); }
        else H.log(r, `${p.name} اختار «${c.w}» — صح!`);
      } else if (m.t === 'end') {
        if (!canGuess(r, p)) return;
        H.log(r, `${p.name} أنهى الدور`); endTurn(r);
      }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const seeAll = r.phase === 'over' || p.id === g.spy[0] || p.id === g.spy[1];
      return {
        cards: g.cards.map(c => ({ w: c.w, open: c.open, k: c.open || seeAll ? c.k : null })),
        turn: g.turn, sub: g.sub, clue: g.clue, left: g.left, remain: g.remain, spy: g.spy, hist: g.hist,
        role: p.spec ? 'spec' : p.id === g.spy[p.team] ? 'spy' : 'op', can: !p.spec && canGuess(r, p), last: g.last || null
      };
    },
    leave(r, p) {
      const g = r.g; if (!g) return;
      for (const t of [0, 1]) {
        const tm = team(r, t);
        if (!tm.length) return finish(r, other(t), `فريق ${['أ', 'ب'][t]} ما بقى فيه أحد`);
        if (g.spy[t] === p.id) { g.spy[t] = tm[0].id; H.log(r, `${tm[0].name} صار قائد فريق ${['أ', 'ب'][t]}`); }
      }
    }
  };
};
