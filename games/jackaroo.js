// جاكارو: ٤ لاعبين فريقين (الشريك قبالتك). كل لاعب ٤ كرات، يطلعها بالآص/الشايب ويلفّ فيها الطاولة ويدخلها البيت.
// الحلقة ٨٠ خانة (٢٠ لكل لاعب). تقدّم الكرة: -١ بالقاعدة، ٠..٧٩ بالحلقة، ٨٠..٨٣ داخل البيت.
// مدخل البيت من الخانة ٧٨ (نص الأذن)، فالكرة اللي توصلها تدخل البيت على طول.
// الكرة الواقفة على خانة بدايتها (٠) محمية: ما أحد يتخطاها ولا ينزل عليها ولا يبدّلها.
// العشرة: يا تحرّك ١٠، يا تحرق ورقة عشوائية على اللي بعدك ويروح عليه دوره.
const TURN_MS = +process.env.JACK_TURN_MS || 45000;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUITS = ['♠', '♥', '♦', '♣'];
const RN = { A: 'آص', K: 'شايب', Q: 'بنت', J: 'ولد' };
module.exports = H => {
  const cellOf = (s, p) => (s * 20 + p) % 80;
  const home = (g, s) => g.marb[s].every(x => x >= 80);
  const ctl = (g, s) => home(g, s) && !home(g, (s + 2) % 4) ? (s + 2) % 4 : s;
  const occupant = (g, cell, skipS, skipI) => {
    for (let s = 0; s < 4; s++) for (let i = 0; i < 4; i++) {
      const p = g.marb[s][i]; if (p < 0 || p > 79 || (s === skipS && i === skipI)) continue;
      if (cellOf(s, p) === cell) return { s, i };
    }
    return null;
  };
  // كرة محمية على هالخانة؟ (كرة واقفة على خانة بدايتها)
  const guarded = (g, cell, skipS, skipI) => { for (let s = 0; s < 4; s++) if (cell === s * 20) for (let i = 0; i < 4; i++) if (g.marb[s][i] === 0 && !(s === skipS && i === skipI)) return true; return false; };
  const isGuarded = (g, s, i) => g.marb[s][i] === 0;
  // نمشي خطوة خطوة: ترجع التقدّم الجديد أو null لو فيه شي يسدّ الطريق
  function walk(g, s, i, p, n, back) {
    let q = p;
    for (let k = 1; k <= n; k++) {
      if (back) { q--; if (q < 0) return null; }
      else if (q >= 80) { q++; if (q > 83) return null; }
      else q = q >= 78 ? 80 : q + 1; // من نص الأذن يدخل البيت
      if (k === n) break;
      if (q >= 80) { if (g.marb[s].some((x, j) => j !== i && x === q)) return null; } // ما يتخطى كراته بالبيت
      else if (guarded(g, cellOf(s, q), s, i)) return null; // ما يتخطى كرة محمية
    }
    return q;
  }
  // تقدّر الكرة (s,i) توصل التقدّم np؟ ترجع null لو لا، أو {kill}
  function landing(g, s, i, np) {
    if (np == null || np < 0 || np > 83) return null;
    if (np >= 80) { for (let j = 0; j < 4; j++) if (j !== i && g.marb[s][j] === np) return null; return { kill: null }; }
    if (guarded(g, cellOf(s, np), s, i)) return null;
    const o = occupant(g, cellOf(s, np), s, i);
    if (o && o.s === s) return null;
    return { kill: o };
  }
  function newDeck() {
    const d = []; let id = 0;
    for (const s of SUITS) for (const r of RANKS) d.push({ id: id++, r, s });
    return H.shuffle(d);
  }
  function movesFor(g, seat, card) {
    const cs = ctl(g, seat), out = [], r = card.r;
    const fwd = n => g.marb[cs].forEach((p, i) => { if (p < 0) return; const np = walk(g, cs, i, p, n), L = landing(g, cs, i, np); if (L) out.push({ key: `${cs}-${i}|f${n}`, s: cs, i, np, kill: L.kill }); });
    const enter = () => { const i = g.marb[cs].findIndex(p => p < 0); if (i < 0) return; const L = landing(g, cs, i, 0); if (L) out.push({ key: `${cs}-${i}|out`, s: cs, i, np: 0, kill: L.kill }); };
    if (r === 'A') { enter(); fwd(1); fwd(11); }
    else if (r === 'K') { enter(); fwd(13); }
    else if (r === 'Q') fwd(12);
    else if (r === '4') g.marb[cs].forEach((p, i) => { if (p < 4 || p > 79) return; const np = walk(g, cs, i, p, 4, true), L = landing(g, cs, i, np); if (L) out.push({ key: `${cs}-${i}|b4`, s: cs, i, np, kill: L.kill }); });
    else if (r === '5') {
      for (let s2 = 0; s2 < 4; s2++) for (let i = 0; i < 4; i++) {
        const p = g.marb[s2][i]; if (p < 0 || p > 79) continue;
        const np = walk(g, s2, i, p, 5); if (np == null || (s2 !== cs && np > 79)) continue;
        const L = landing(g, s2, i, np); if (L) out.push({ key: `${s2}-${i}|f5`, s: s2, i, np, kill: L.kill });
      }
    } else if (r === 'J') {
      g.marb[cs].forEach((p, i) => {
        if (p < 0 || p > 79 || isGuarded(g, cs, i)) return;
        for (let s2 = 0; s2 < 4; s2++) { if (s2 === cs) continue; g.marb[s2].forEach((q, j) => { if (q > 0 && q <= 79) out.push({ key: `${cs}-${i}|x${s2}-${j}`, s: cs, i, x: [s2, j], np: q, kill: null }); }); }
      });
    } else if (r === '10') {
      fwd(10);
      const nx = burnTarget(g, seat);
      if (nx >= 0) out.push({ key: 'burn', s: -1, i: -1, np: -1, kill: null, burn: nx });
    } else fwd(+r);
    return out;
  }
  // اللي بعدك وعنده أوراق (له تنحرق الورقة)
  function burnTarget(g, seat) {
    if (!g.rp) return -1;
    const s = (seat + 1) % 4;
    return (g.hands[g.rp[s]] || []).length ? s : -1;
  }
  const hasLegal = (g, seat, hand) => hand.some(c => movesFor(g, seat, c).length);
  function apply(r, seat, card, mv) {
    const g = r.g, cs = mv.s;
    if (mv.burn != null) {
      const vic = r.players[mv.burn], h = g.hands[vic.id], k = Math.random() * h.length | 0, c = h.splice(k, 1)[0];
      g.burned = c; g.skip = mv.burn;
      g.last = { who: seat, text: `حرق ورقة على ${vic.name} 🔥` };
      H.log(r, `${r.players[seat].name} حرق ورقة (${c.r}${c.s}) على ${vic.name} وراح عليه دوره`);
      return;
    }
    if (mv.x) {
      const [s2, j] = mv.x, a = g.marb[cs][mv.i], b = g.marb[s2][j];
      const ca = cellOf(cs, a), cb = cellOf(s2, b);
      g.marb[cs][mv.i] = (cb - cs * 20 + 80) % 80; g.marb[s2][j] = (ca - s2 * 20 + 80) % 80;
      g.last = { who: seat, text: `بدّل كرته مع كرة ${r.players[s2].name}` };
    } else {
      if (mv.kill) { g.marb[mv.kill.s][mv.kill.i] = -1; }
      g.marb[mv.s][mv.i] = mv.np;
      const verb = mv.key.endsWith('|out') ? 'طلّع كرة' : mv.key.includes('|b4') ? 'رجّع كرة ٤' : 'حرّك كرة';
      g.last = { who: seat, text: `${verb}${mv.kill ? ' وأكل كرة ' + r.players[mv.kill.s].name : ''}` };
      if (mv.kill) H.log(r, `${r.players[seat].name} أكل كرة ${r.players[mv.kill.s].name}!`);
    }
    g.last.cell = mv.x ? null : { s: mv.s, i: mv.i };
    g.burned = null;
  }
  function winner(g) { for (const t of [0, 1]) if (home(g, t) && home(g, t + 2)) return t; return null; }
  function finish(r, t, why) {
    r.phase = 'over'; r.winTeam = t; r.score[t]++; r.winner = 'فريق ' + ['أ', 'ب'][t];
    H.log(r, why || `${r.winner} دخّل كل الكرات!`); H.win(r, r.players.filter((p, i) => i % 2 === t)); H.setTimer(r, 0, null);
  }
  function deal(r) {
    const g = r.g; if (g.deck.length < 16) g.deck = newDeck();
    r.players.forEach(p => { g.hands[p.id] = g.deck.splice(0, 4); });
    g.dealt++; if (g.dealt > 1) H.log(r, 'وُزّعت أوراق جديدة');
  }
  function nextTurn(r) {
    const g = r.g; g.split = null;
    let s = g.turn;
    for (let k = 0; k < 80; k++) {
      if (r.players.every(p => !g.hands[p.id].length)) deal(r);
      s = (s + 1) % 4;
      const hand = g.hands[r.players[s].id];
      if (!hand.length) continue;
      if (hasLegal(g, s, hand)) { g.turn = s; return H.setTimer(r, TURN_MS, () => auto(r)); }
      H.log(r, `${r.players[s].name} ما عنده حركة، رمى أوراقه`); g.hands[r.players[s].id] = [];
    }
    g.turn = s; H.setTimer(r, TURN_MS, () => auto(r));
  }
  // أفضل حركة (للبوت ولو انتهى وقت اللاعب)
  function pick(r, seat) {
    const g = r.g, hand = g.hands[r.players[seat].id], cs = ctl(g, seat), team = t => t % 2;
    let best = null, bs = -1e9;
    const cards = g.split ? hand.filter(c => c.id === g.split.card) : hand;
    const pool = g.split ? [{ id: g.split.card, r: '7' }] : cards;
    pool.forEach(c => movesFor(g, seat, c).forEach(mv => {
      if (g.split) { const n = +mv.key.split('|f')[1]; if (!(n >= 1 && n <= g.split.left)) return; }
      let sc = Math.random() * 3;
      if (mv.burn != null) { sc += 9 + Math.random() * 10; if (sc > bs) { bs = sc; best = { id: c.id, key: mv.key }; } return; }
      if (mv.kill) sc += team(mv.kill.s) === team(cs) ? -120 : 90;
      if (mv.key.endsWith('|out')) sc += 45;
      if (mv.np >= 80 && !mv.x) sc += 60;
      if (mv.x) sc += g.marb[mv.x[0]][mv.x[1]] > mv.np ? -5 : 15;
      if (mv.s !== cs && team(mv.s) !== team(cs)) sc += 6; else if (mv.s !== cs) sc -= 6; // ٥ تحريك كرة غيرك
      if (mv.key.includes('|b4')) sc -= 10;
      const n = +(mv.key.split('|f')[1] || 0); sc += n * .8;
      if (sc > bs) { bs = sc; best = { id: c.id, key: mv.key }; }
    }));
    return best;
  }
  function doMove(r, p, m) {
    const g = r.g, seat = r.players.indexOf(p);
    if (r.phase !== 'play' || seat !== g.turn) return false;
    const hand = g.hands[p.id];
    const card = g.split ? { id: g.split.card, r: '7' } : hand.find(c => c.id === m.id);
    if (!card) return false;
    const mv = movesFor(g, seat, card).find(x => x.key === m.key); if (!mv) return false;
    let n = 0;
    if (card.r === '7') { n = +mv.key.split('|f')[1]; if (!(n >= 1 && n <= (g.split ? g.split.left : 7))) return false; }
    else if (g.split) return false;
    apply(r, seat, card, mv);
    if (!g.split) { g.hands[p.id] = hand.filter(c => c.id !== card.id); g.discard = card; }
    const w = winner(g); if (w !== null) { finish(r, w); return true; }
    if (card.r === '7') {
      const left = (g.split ? g.split.left : 7) - n;
      g.split = left > 0 ? { card: card.id, left } : null;
      if (g.split) {
        const any = movesFor(g, seat, { id: card.id, r: '7' }).some(x => +x.key.split('|f')[1] <= left);
        if (any) return H.setTimer(r, TURN_MS, () => auto(r)), true;
      }
    }
    if (g.skip != null) { g.turn = g.skip; g.skip = null; }
    nextTurn(r); return true;
  }
  function auto(r) {
    const g = r.g; if (r.phase !== 'play') return;
    const p = r.players[g.turn];
    for (let k = 0; k < 8 && r.phase === 'play' && r.players[g.turn] === p; k++) { const b = pick(r, g.turn); if (!b) break; if (!doMove(r, p, b)) break; if (!g.split) break; }
    if (r.phase === 'play' && r.players[g.turn] === p && !g.split && g.hands[p.id].length && !pick(r, g.turn)) nextTurn(r);
  }
  return {
    _t: { walk, landing, movesFor, guarded },
    min: 4, max: 4,
    bot(r, p) { const b = pick(r, r.players.indexOf(p)); return b; },
    move: doMove,
    start(r) {
      r.players.forEach((p, i) => { p.team = i % 2; });
      r.g = { marb: [0, 1, 2, 3].map(() => [-1, -1, -1, -1]), hands: {}, deck: newDeck(), turn: 3, split: null, last: null, dealt: 0, discard: null, rp: r.players.map(p => p.id), skip: null, burned: null };
      r.winTeam = null; r.winner = null; r.phase = 'play';
      H.log(r, 'بدأت جاكارو — طلّع كراتك بالآص أو الشايب');
      deal(r); nextTurn(r);
    },
    act(r, p, m) {
      if (!r.g || m.t !== 'move') return;
      if (!doMove(r, p, { id: +m.id, key: String(m.key || '') })) H.err(p, 'حركة ما تنفع');
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const seat = r.players.indexOf(p), mine = seat >= 0 && seat === g.turn && r.phase === 'play';
      const hand = seat >= 0 ? g.hands[p.id] || [] : [];
      let legal = [];
      if (mine) {
        const cards = g.split ? [{ id: g.split.card, r: '7' }] : hand;
        cards.forEach(c => movesFor(g, seat, c).forEach(mv => {
          if (g.split && !(+mv.key.split('|f')[1] <= g.split.left)) return;
          legal.push({ c: c.id, k: mv.key, s: mv.s, i: mv.i, np: mv.np, kill: !!mv.kill, x: mv.x || null, burn: mv.burn != null ? mv.burn : null });
        }));
      }
      return {
        seat, turn: g.turn, marb: g.marb, hand, legal, split: g.split, deck: g.deck.length, last: g.last, discard: g.discard, burned: g.burned,
        cnt: r.players.map(q => (g.hands[q.id] || []).length), ctl: seat >= 0 ? ctl(g, seat) : -1,
        home: [0, 1, 2, 3].map(s => g.marb[s].filter(x => x >= 80).length)
      };
    },
    leave(r, p) { if (r.phase === 'play') { const t = 1 - p.team; finish(r, t, `${p.name} طلع، فاز فريق ${['أ', 'ب'][t]}`); } }
  };
};
