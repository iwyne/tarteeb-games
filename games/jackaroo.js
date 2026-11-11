// جاكارو: ٤ لاعبين فريقين (الشريك قبالتك). كل لاعب ٤ كرات، يطلعها بالآص/الشايب ويلفّ فيها الطاولة ويدخلها البيت.
// الحلقة ٨٠ خانة (٢٠ لكل لاعب). تقدّم الكرة: -١ بالقاعدة، ٠..٧٩ بالحلقة، ٨٠..٨٣ داخل البيت.
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
  // تقدّر الكرة (s,i) توصل التقدّم np؟ ترجع null لو لا، أو {kill}
  function landing(g, s, i, np) {
    if (np < 0 || np > 83) return null;
    if (np >= 80) { for (let j = 0; j < 4; j++) if (j !== i && g.marb[s][j] === np) return null; return { kill: null }; }
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
    const fwd = n => g.marb[cs].forEach((p, i) => { if (p < 0) return; const L = landing(g, cs, i, p + n); if (L) out.push({ key: `${cs}-${i}|f${n}`, s: cs, i, np: p + n, kill: L.kill }); });
    const enter = () => { const i = g.marb[cs].findIndex(p => p < 0); if (i < 0) return; const L = landing(g, cs, i, 0); if (L) out.push({ key: `${cs}-${i}|out`, s: cs, i, np: 0, kill: L.kill }); };
    if (r === 'A') { enter(); fwd(1); fwd(11); }
    else if (r === 'K') { enter(); fwd(13); }
    else if (r === 'Q') fwd(12);
    else if (r === '4') g.marb[cs].forEach((p, i) => { if (p < 4 || p > 79) return; const L = landing(g, cs, i, p - 4); if (L) out.push({ key: `${cs}-${i}|b4`, s: cs, i, np: p - 4, kill: L.kill }); });
    else if (r === '5') {
      for (let s2 = 0; s2 < 4; s2++) for (let i = 0; i < 4; i++) {
        const p = g.marb[s2][i]; if (p < 0 || p > 79) continue;
        const np = p + 5; if (s2 !== cs && np > 79) continue;
        const L = landing(g, s2, i, np); if (L) out.push({ key: `${s2}-${i}|f5`, s: s2, i, np, kill: L.kill });
      }
    } else if (r === 'J') {
      g.marb[cs].forEach((p, i) => {
        if (p < 0 || p > 79) return;
        for (let s2 = 0; s2 < 4; s2++) { if (s2 === cs) continue; g.marb[s2].forEach((q, j) => { if (q >= 0 && q <= 79) out.push({ key: `${cs}-${i}|x${s2}-${j}`, s: cs, i, x: [s2, j], np: q, kill: null }); }); }
      });
    } else fwd(r === '10' ? 10 : +r);
    return out;
  }
  const hasLegal = (g, seat, hand) => hand.some(c => movesFor(g, seat, c).length);
  function apply(r, seat, card, mv) {
    const g = r.g, cs = mv.s;
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
    nextTurn(r); return true;
  }
  function auto(r) {
    const g = r.g; if (r.phase !== 'play') return;
    const p = r.players[g.turn];
    for (let k = 0; k < 8 && r.phase === 'play' && r.players[g.turn] === p; k++) { const b = pick(r, g.turn); if (!b) break; if (!doMove(r, p, b)) break; if (!g.split) break; }
    if (r.phase === 'play' && r.players[g.turn] === p && !g.split && g.hands[p.id].length && !pick(r, g.turn)) nextTurn(r);
  }
  return {
    min: 4, max: 4,
    bot(r, p) { const b = pick(r, r.players.indexOf(p)); return b; },
    move: doMove,
    start(r) {
      r.players.forEach((p, i) => { p.team = i % 2; });
      r.g = { marb: [0, 1, 2, 3].map(() => [-1, -1, -1, -1]), hands: {}, deck: newDeck(), turn: 3, split: null, last: null, dealt: 0, discard: null };
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
          legal.push({ c: c.id, k: mv.key, s: mv.s, i: mv.i, np: mv.np, kill: !!mv.kill, x: mv.x || null });
        }));
      }
      return {
        seat, turn: g.turn, marb: g.marb, hand, legal, split: g.split, deck: g.deck.length, last: g.last, discard: g.discard,
        cnt: r.players.map(q => (g.hands[q.id] || []).length), ctl: seat >= 0 ? ctl(g, seat) : -1,
        home: [0, 1, 2, 3].map(s => g.marb[s].filter(x => x >= 80).length)
      };
    },
    leave(r, p) { if (r.phase === 'play') { const t = 1 - p.team; finish(r, t, `${p.name} طلع، فاز فريق ${['أ', 'ب'][t]}`); } }
  };
};
