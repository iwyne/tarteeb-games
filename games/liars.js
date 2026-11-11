// الكذابين الترتيب: ورقة الطاولة (ملك/ملكة/آص) — تلعب ١–٣ أوراق مقلوبة وتقول إنها منها.
// اللي بعدك يصدّقك ويلعب، أو يقول «كذّاب!». الخاسر يسحب من دولاب القنبلة (٦ خانات، وحدة فيها قنبلة).
const TURN_MS = +process.env.LIARS_TURN_MS || 30000, RESULT_MS = +process.env.LIARS_RESULT_MS || 6500;
const TABLE = ['K', 'Q', 'A'];
module.exports = H => {
  const alive = r => r.players.filter(p => p.alive);
  const byId = (r, id) => r.players.find(p => p.id === id);
  const nextAlive = (r, from) => {
    const n = r.players.length; let i = r.players.indexOf(from);
    for (let k = 1; k <= n; k++) { const q = r.players[(i + k) % n]; if (q.alive) return q; }
    return from;
  };
  const mustCall = (r, p) => {
    const g = r.g; if (!g.last) return false;
    return p.hand.length === 0 || (byId(r, g.last.by) && byId(r, g.last.by).hand.length === 0);
  };
  function deal(r) {
    const g = r.g, ps = alive(r), n = ps.length;
    const per = Math.max(6, Math.ceil(5 * n / 3) + 1);
    let id = 0; const deck = [];
    for (const t of TABLE) for (let i = 0; i < per; i++) deck.push({ id: id++, t });
    deck.push({ id: id++, t: 'J' }, { id: id++, t: 'J' });
    H.shuffle(deck);
    r.players.forEach(p => { p.hand = []; });
    ps.forEach(p => { for (let i = 0; i < 5; i++) p.hand.push(deck.pop()); });
    g.table = TABLE[Math.random() * 3 | 0]; g.last = null; g.pile = 0; g.round++;
  }
  function startTurn(r, p) {
    const g = r.g; g.turn = p.id; g.sub = 'play';
    H.setTimer(r, TURN_MS, () => {
      const a = byId(r, g.turn); if (!a || g.sub !== 'play') return;
      H.log(r, `${a.name} تأخر`);
      if (mustCall(r, a) || (!a.hand.length)) return call(r, a);
      put(r, a, [a.hand[Math.random() * a.hand.length | 0].id]);
    });
  }
  function nextRound(r, starter) {
    const g = r.g; g.result = null;
    if (alive(r).length <= 1) return;
    deal(r);
    startTurn(r, starter.alive ? starter : nextAlive(r, starter));
    H.log(r, `جولة ${g.round}: الورقة المطلوبة ${NAME[g.table]}`);
  }
  const NAME = { K: 'ملك', Q: 'ملكة', A: 'آص', J: 'جوكر' };
  function put(r, p, ids) {
    const g = r.g;
    if (g.sub !== 'play' || g.turn !== p.id || mustCall(r, p)) return;
    ids = [...new Set(ids.map(Number))].slice(0, 3);
    const cards = ids.map(i => p.hand.find(c => c.id === i)).filter(Boolean);
    if (!cards.length || cards.length !== ids.length) return;
    p.hand = p.hand.filter(c => !cards.includes(c));
    g.last = { by: p.id, cards }; g.pile += cards.length;
    H.log(r, `${p.name} لعب ${cards.length} ${cards.length > 2 ? 'أوراق' : cards.length === 2 ? 'ورقتين' : 'ورقة'} وقال: ${NAME[g.table]}`);
    startTurn(r, nextAlive(r, p));
  }
  function call(r, p) {
    const g = r.g;
    if (g.sub !== 'play' || g.turn !== p.id || !g.last) return;
    const liar = byId(r, g.last.by), cards = g.last.cards;
    const truthful = cards.every(c => c.t === g.table || c.t === 'J');
    const loser = truthful ? p : liar;
    loser.pulls++;
    const hit = loser.pulls - 1 === loser.bomb;
    if (hit) loser.alive = false;
    g.result = { caller: p.id, liar: liar ? liar.id : null, cards: cards.map(c => c.t), truthful, loser: loser.id, hit, pulls: loser.pulls, table: g.table };
    g.sub = 'result';
    H.log(r, `${p.name}: كذّاب! — ${truthful ? 'كان صادق' : 'فعلاً كذّاب'}، ${loser.name} ${hit ? 'طلعت له القنبلة 💥 وطلع من اللعبة' : 'نجا'}`);
    const left = alive(r);
    if (left.length <= 1) {
      r.phase = 'over'; r.winner = left[0] ? left[0].name : '—'; if (left[0]) H.win(r, [left[0]]);
      H.setTimer(r, 0, null); return;
    }
    H.setTimer(r, RESULT_MS, () => nextRound(r, loser));
  }
  return {
    min: 2, max: 8,
    start(r) {
      r.players.forEach(p => { p.alive = true; p.pulls = 0; p.bomb = Math.random() * 6 | 0; p.hand = []; });
      r.g = { round: 0, table: 'K', turn: null, sub: 'play', last: null, pile: 0, result: null };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      const first = r.players[Math.random() * r.players.length | 0];
      deal(r); startTurn(r, first);
      H.log(r, `بدأت اللعبة — الورقة المطلوبة ${NAME[r.g.table]}`);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || !p.alive) return;
      if (m.t === 'put') put(r, p, Array.isArray(m.ids) ? m.ids : []);
      else if (m.t === 'call') call(r, p);
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const me = p.spec ? null : p;
      return {
        round: g.round, table: g.table, turn: g.turn, sub: g.sub, pile: g.pile,
        last: g.last ? { by: g.last.by, n: g.last.cards.length } : null,
        result: g.result, pl: r.players.map(q => ({ id: q.id, alive: q.alive, n: q.hand.length, pulls: q.pulls })),
        hand: me ? me.hand : [], must: !!me && g.sub === 'play' && g.turn === me.id && mustCall(r, me),
        alive: !!me && me.alive
      };
    },
    leave(r, p) {
      const g = r.g; if (!g) return;
      p.alive = false;
      const left = alive(r);
      if (left.length <= 1) { r.phase = 'over'; r.winner = left[0] ? left[0].name : '—'; if (left[0]) H.win(r, [left[0]]); H.setTimer(r, 0, null); return; }
      if (g.turn === p.id && g.sub === 'play') {
        if (g.last && g.last.by === p.id) g.last = null;
        // اللي بعده يكمل بنفس الدور
        let nxt = r.players.find(q => q.alive) ; 
        const idx = p._idx; // موقعه قبل الإزالة
        const n = r.players.length;
        nxt = n ? r.players[(idx % n + n) % n] : nxt; while (nxt && !nxt.alive) nxt = r.players[(r.players.indexOf(nxt) + 1) % n];
        startTurn(r, nxt);
      } else if (g.last && g.last.by === p.id) g.last = null;
    }
  };
};
