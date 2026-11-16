// بلوت: ٤ لاعبين فريقين (الشريك قبالك). ٣٢ ورقة (٧ إلى الإكة).
// الشراء: جولة أولى (حكم بنوع الورقة المكشوفة / صن / بس) وجولة ثانية (حكم بنوع ثاني / صن / بس).
// الصن ما فيه حكم. الحكم: الولد ثم التسعة أقوى أوراق الحكم.
// النقاط: صن = ٢٦ للصكة، حكم = ١٦. المشاريع: سرا، خمسين، مية، أربعمية، بلوت. اللعب لين ١٥٢.
const SCALE = +process.env.BALOOT_SCALE || 1;
const TURN_MS = 30000, BID_MS = 20000, RES_MS = 7000;
const RANKS = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'], SUITS = ['♠', '♥', '♣', '♦'];
const SUNV = { A: 11, 10: 10, K: 4, Q: 3, J: 2, 9: 0, 8: 0, 7: 0 };
const TRV = { J: 20, 9: 14, A: 11, 10: 10, K: 4, Q: 3, 8: 0, 7: 0 };
const SUNO = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A'];   // قوة الصن (الأخير أقوى)
const TRO = ['7', '8', 'Q', 'K', '10', 'A', '9', 'J'];    // قوة الحكم
const SEQ = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];    // ترتيب السرا
const TARGET = 152;
const rnd = n => Math.random() * n | 0;
const SN = { '♠': 'سبيت', '♥': 'هاص', '♣': 'شريا', '♦': 'ديمن' };
const RN = { A: 'إكة', K: 'شايب', Q: 'بنت', J: 'ولد' };
const cardName = c => `${RN[c.r] || c.r} ${c.s}`;

module.exports = H => {
  const team = s => s % 2;
  const pts = (g, c) => g.mode === 'hokm' && c.s === g.trump ? TRV[c.r] : SUNV[c.r];
  const power = (g, c, led) => g.mode === 'hokm' && c.s === g.trump ? 100 + TRO.indexOf(c.r) : c.s === led ? SUNO.indexOf(c.r) : -1;
  function trickWinner(g, trick) {
    const led = trick[0].c.s; let best = trick[0];
    for (const t of trick) if (power(g, t.c, led) > power(g, best.c, led)) best = t;
    return best.s;
  }
  function legal(g, seat) {
    const hand = g.hands[seat], tr = g.trick;
    if (!tr.length) return hand.slice();
    const led = tr[0].c.s, same = hand.filter(c => c.s === led);
    if (g.mode === 'sun') return same.length ? same : hand.slice();
    const bestTrump = Math.max(-1, ...tr.filter(t => t.c.s === g.trump).map(t => TRO.indexOf(t.c.r)));
    const over = cs => cs.filter(c => c.s === g.trump && TRO.indexOf(c.r) > bestTrump);
    if (same.length) {
      if (led === g.trump) { const o = over(same); return o.length ? o : same; }
      return same;
    }
    const trumps = hand.filter(c => c.s === g.trump);
    if (!trumps.length) return hand.slice();
    const w = trickWinner(g, tr);
    if (team(w) === team(seat)) return hand.slice(); // الشريك ماسك، مو لازم تقطع
    const o = over(trumps);
    if (o.length) return o;
    return bestTrump < 0 ? trumps : hand.slice();
  }
  function newDeck() { const d = []; let id = 0; for (const s of SUITS) for (const r of RANKS) d.push({ id: id++, r, s }); return H.shuffle(d); }
  const sortHand = (g, h) => h.sort((a, b) => SUITS.indexOf(a.s) - SUITS.indexOf(b.s) || (g.mode === 'hokm' && a.s === g.trump ? TRO.indexOf(b.r) - TRO.indexOf(a.r) : SUNO.indexOf(b.r) - SUNO.indexOf(a.r)));
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }

  // ---------- المشاريع ----------
  function projects(g, hand) {
    const out = [], used = new Set();
    for (const r of ['A', 'K', 'Q', 'J', '10']) {
      const four = hand.filter(c => c.r === r);
      if (four.length === 4) {
        if (r === 'A' && g.mode === 'hokm') out.push({ t: 'مية', raw: 100, hi: 8 });
        else if (r === 'A') out.push({ t: 'أربعمية', raw: 200, hi: 9 });
        else out.push({ t: 'مية', raw: 100, hi: SEQ.indexOf(r) });
        four.forEach(c => used.add(c.id));
      }
    }
    for (const s of SUITS) {
      const idx = hand.filter(c => c.s === s && !used.has(c.id)).map(c => SEQ.indexOf(c.r)).sort((a, b) => a - b);
      let run = [];
      const flush = () => {
        if (run.length >= 5) out.push({ t: 'مية', raw: 100, hi: run[run.length - 1] });
        else if (run.length === 4) out.push({ t: 'خمسين', raw: 50, hi: run[3] });
        else if (run.length === 3) out.push({ t: 'سرا', raw: 20, hi: run[2] });
      };
      for (const i of idx) { if (run.length && i === run[run.length - 1] + 1) run.push(i); else { flush(); run = [i]; } }
      flush();
    }
    return out;
  }
  const gameVal = (g, raw) => g.mode === 'sun' ? raw * 2 / 10 : raw / 10;

  // ---------- مراحل الصكة ----------
  function newHand(r) {
    const g = r.g; g.bt.forEach(clearTimeout); g.bt = [];
    g.dealer = (g.dealer + 1) % 4; g.handN++;
    const d = newDeck(); g.hands = [0, 1, 2, 3].map(() => d.splice(0, 5)); g.up = d.shift(); g.deck = d;
    g.mode = null; g.trump = null; g.buyer = null; g.trick = []; g.last = null; g.won = [0, 0]; g.raw = [0, 0];
    g.bid = { round: 1, turn: (g.dealer + 1) % 4, hokmBy: null, hokmSuit: null, said: {} };
    g.proj = null; g.res = null; g.sub = 'bid'; g.turn = g.bid.turn;
    g.hands.forEach(h => sortHand(g, h));
    H.log(r, `صكة جديدة — الورقة المكشوفة: ${cardName(g.up)}`);
    askBid(r);
  }
  function askBid(r) {
    const g = r.g, s = g.bid.turn, p = r.players[s];
    g.turn = s;
    H.setTimer(r, BID_MS * SCALE, () => bid(r, s, { k: 'pass' }));
    if (p && p.bot) later(r, (900 + rnd(900)) * SCALE, () => bid(r, s, botBid(g, s)));
  }
  function bid(r, s, m) {
    const g = r.g; if (g.sub !== 'bid' || g.bid.turn !== s) return false;
    const B = g.bid, name = r.players[s] ? r.players[s].name : '';
    if (m.k === 'sun') { B.said[s] = 'صن'; H.log(r, `${name}: صن ☀️`); return buy(r, s, 'sun', null); }
    if (m.k === 'hokm') {
      if (B.hokmBy !== null) return false;
      const suit = B.round === 1 ? g.up.s : m.suit;
      if (!SUITS.includes(suit) || (B.round === 2 && suit === g.up.s)) return false;
      B.hokmBy = s; B.hokmSuit = suit; B.said[s] = `حكم ${suit}`; H.log(r, `${name}: حكم ${suit}`);
    } else if (m.k === 'pass') { B.said[s] = B.hokmBy !== null ? 'ولا' : 'بس'; }
    else return false;
    B.turn = (s + 1) % 4;
    if (B.hokmBy !== null && B.turn === B.hokmBy) return buy(r, B.hokmBy, 'hokm', B.hokmSuit);
    if (B.hokmBy === null && B.turn === (g.dealer + 1) % 4) {
      if (B.round === 1) { B.round = 2; B.said = {}; H.log(r, 'محد اشترى… الجولة الثانية'); }
      else { H.log(r, 'محد اشترى — نعيد التوزيع'); H.setTimer(r, 1200 * SCALE, () => newHand(r)); g.sub = 'redeal'; return true; }
    }
    askBid(r); return true;
  }
  function buy(r, s, mode, trump) {
    const g = r.g; g.mode = mode; g.trump = trump; g.buyer = s; g.sub = 'play';
    g.hands[s].push(g.up);
    [0, 1, 2, 3].forEach(i => { g.hands[i].push(...g.deck.splice(0, i === s ? 2 : 3)); sortHand(g, g.hands[i]); });
    g.up = null;
    // المشاريع: نطلعها تلقائي ونقارن أعلى مشروع لكل فريق
    const P = [0, 1, 2, 3].map(i => projects(g, g.hands[i]));
    const best = [0, 1].map(t => { let b = null; [0, 1, 2, 3].filter(i => team(i) === t).forEach(i => P[i].forEach(x => { if (!b || x.raw > b.raw || (x.raw === b.raw && x.hi > b.hi)) b = { ...x, s: i }; })); return b; });
    let wt = null;
    if (best[0] && best[1]) {
      if (best[0].raw !== best[1].raw) wt = best[0].raw > best[1].raw ? 0 : 1;
      else if (best[0].hi !== best[1].hi) wt = best[0].hi > best[1].hi ? 0 : 1;
      else { const order = [1, 2, 3, 4].map(k => (g.dealer + k) % 4); wt = team(order.find(i => i === best[0].s || i === best[1].s)); }
    } else if (best[0]) wt = 0; else if (best[1]) wt = 1;
    const bloot = mode === 'hokm' ? [0, 1, 2, 3].find(i => g.hands[i].some(c => c.s === trump && c.r === 'K') && g.hands[i].some(c => c.s === trump && c.r === 'Q')) : undefined;
    g.proj = { list: P.map((l, i) => wt === team(i) ? l : []), win: wt, raw: [0, 1].map(t => wt === t ? [0, 1, 2, 3].filter(i => team(i) === t).reduce((a, i) => a + P[i].reduce((x, y) => x + y.raw, 0), 0) : 0), bloot: bloot === undefined ? null : bloot };
    const name = r.players[s] ? r.players[s].name : '';
    H.log(r, `${name} اشترى ${mode === 'sun' ? 'صن ☀️' : 'حكم ' + trump}`);
    const pl = g.proj.list.map((l, i) => l.length ? `${r.players[i].name}: ${l.map(x => x.t).join(' + ')}` : '').filter(Boolean);
    if (pl.length) H.log(r, '📜 مشاريع — ' + pl.join(' · '));
    g.turn = (g.dealer + 1) % 4;
    askPlay(r);
    return true;
  }
  function askPlay(r) {
    const g = r.g, s = g.turn, p = r.players[s];
    H.setTimer(r, TURN_MS * SCALE, () => { const L = legal(g, s); play(r, s, L.sort((a, b) => pts(g, a) - pts(g, b))[0].id); });
    if (p && p.bot) later(r, (700 + rnd(700)) * SCALE, () => play(r, s, botPlay(g, s)));
  }
  function play(r, s, id) {
    const g = r.g; if (g.sub !== 'play' || g.turn !== s || g.trick.length >= 4) return false;
    const L = legal(g, s), c = L.find(x => x.id === id); if (!c) return false;
    g.hands[s] = g.hands[s].filter(x => x.id !== id);
    g.trick.push({ s, c });
    if (g.trick.length < 4) { g.turn = (s + 1) % 4; askPlay(r); return true; }
    // خلصت الأكلة
    const w = trickWinner(g, g.trick), t = team(w);
    g.raw[t] += g.trick.reduce((a, x) => a + pts(g, x.c), 0); g.won[t]++;
    const done = g.hands.every(h => !h.length);
    if (done) g.raw[t] += 10; // الأرض
    g.last = { cards: g.trick.slice(), w }; g.turn = w; g.sub = 'collect';
    H.setTimer(r, 1300 * SCALE, () => { g.trick = []; if (done) score(r); else { g.sub = 'play'; askPlay(r); } });
    return true;
  }
  function score(r) {
    const g = r.g, bt = team(g.buyer), ot = 1 - bt, full = g.mode === 'sun' ? 26 : 16;
    const gp = [0, 0];
    if (g.mode === 'sun') { gp[bt] = Math.round(g.raw[bt] * 2 / 10); gp[ot] = full - gp[bt]; }
    else { gp[bt] = Math.floor((g.raw[bt] + 4) / 10); gp[ot] = full - gp[bt]; }
    const pj = [0, 1].map(t => gameVal(g, g.proj.raw[t]));
    const bl = [0, 0]; if (g.proj.bloot !== null) bl[team(g.proj.bloot)] = 2;
    const kab = g.won[0] === 8 ? 0 : g.won[1] === 8 ? 1 : null;
    let add = [0, 0], fail = false;
    if (kab !== null) { add[kab] = (g.mode === 'sun' ? 44 : 25) + pj[kab] + bl[kab]; add[1 - kab] = bl[1 - kab]; }
    else {
      const tb = gp[bt] + pj[bt] + bl[bt], to = gp[ot] + pj[ot] + bl[ot];
      if (tb <= to) { fail = true; add[ot] = full + pj[0] + pj[1] + bl[ot]; add[bt] = bl[bt]; }
      else { add[bt] = tb; add[ot] = to; }
    }
    g.total[0] += add[0]; g.total[1] += add[1];
    g.res = { mode: g.mode, trump: g.trump, buyer: g.buyer, raw: g.raw.slice(), gp, pj, bl, add, fail, kab };
    g.sub = 'res';
    H.log(r, fail ? `خسرانة! 💥 الفريق المشتري ما جاب النص` : kab !== null ? `كبوت! 🔥` : `لنا ${add[0]} — لهم ${add[1]}`);
    const top = Math.max(...g.total);
    if (top >= TARGET && g.total[0] !== g.total[1]) {
      const wt = g.total[0] > g.total[1] ? 0 : 1;
      return H.setTimer(r, 3500 * SCALE, () => finish(r, wt));
    }
    H.setTimer(r, RES_MS * SCALE, () => newHand(r));
  }
  function finish(r, t, why) {
    const g = r.g; if (g) { g.bt.forEach(clearTimeout); g.sub = 'end'; }
    r.phase = 'over'; r.winTeam = t; r.score[t]++; r.winner = 'فريق ' + ['أ', 'ب'][t];
    H.log(r, why || `${r.winner} فاز بالبلوت! 🏆`); H.win(r, r.players.filter((p, i) => i % 2 === t)); H.setTimer(r, 0, null);
  }

  // ---------- البوتات ----------
  function botBid(g, s) {
    const h = g.hands[s], B = g.bid;
    const aces = h.filter(c => c.r === 'A').length, tens = h.filter(c => c.r === '10' && h.some(x => x.s === c.s && x.r === 'A')).length;
    const sunScore = aces * 2 + tens + (g.up.r === 'A' ? 1.5 : 0);
    const hokmScore = suit => {
      const cs = h.filter(c => c.s === suit).concat(B.round === 1 && suit === g.up.s ? [g.up] : []);
      let v = cs.length; cs.forEach(c => { if (c.r === 'J') v += 3; if (c.r === '9') v += 2; if (c.r === 'A') v += 1; });
      return { v, n: cs.length };
    };
    if (sunScore >= 6) return { k: 'sun' };
    if (B.hokmBy !== null) return { k: 'pass' };
    if (B.round === 1) { const x = hokmScore(g.up.s); if (x.v >= 7 && x.n >= 3) return { k: 'hokm' }; }
    else {
      let best = null; SUITS.filter(su => su !== g.up.s).forEach(su => { const x = hokmScore(su); if (x.n >= 3 && x.v >= 7 && (!best || x.v > best.v)) best = { ...x, su }; });
      if (best) return { k: 'hokm', suit: best.su };
      if (sunScore >= 4) return { k: 'sun' };
    }
    return { k: 'pass' };
  }
  function botPlay(g, s) {
    const L = legal(g, s), tr = g.trick;
    const isTrump = c => g.mode === 'hokm' && c.s === g.trump;
    const cheap = cs => cs.slice().sort((a, b) => pts(g, a) - pts(g, b) || power(g, a, a.s) - power(g, b, b.s))[0];
    if (!tr.length) {
      const masters = L.filter(c => !isTrump(c) && c.r === 'A');
      if (g.mode === 'hokm' && team(s) === team(g.buyer)) { const j = L.find(c => isTrump(c) && c.r === 'J'); if (j) return j.id; }
      if (masters.length) return masters[0].id;
      return cheap(L.filter(c => !isTrump(c)).length ? L.filter(c => !isTrump(c)) : L).id;
    }
    const led = tr[0].c.s, w = trickWinner(g, tr);
    const winning = L.filter(c => { const t2 = tr.concat({ s, c }); return trickWinner(g, t2) === s; });
    if (team(w) === team(s)) {
      // الشريك ماسك: نغذّيه نقاط (بدون ما نضيع الحكم القوي)
      const feed = L.filter(c => !isTrump(c)).sort((a, b) => pts(g, b) - pts(g, a));
      const last = tr.length === 3;
      if (feed.length && (last || power(g, tr.find(x => x.s === w).c, led) >= (g.mode === 'hokm' && tr.find(x => x.s === w).c.s === g.trump ? 105 : 6))) return feed[0].id;
      return cheap(L).id;
    }
    if (winning.length) {
      const trickPts = tr.reduce((a, x) => a + pts(g, x.c), 0);
      const pick = winning.slice().sort((a, b) => power(g, a, led) - power(g, b, led))[0];
      if (!isTrump(pick) || trickPts >= 10 || tr.length === 3) return pick.id;
    }
    return cheap(L).id;
  }

  return {
    min: 4, max: 4,
    start(r) {
      r.players.forEach((p, i) => { p.team = i % 2; });
      r.g = { dealer: rnd(4), handN: 0, hands: [[], [], [], []], deck: [], up: null, mode: null, trump: null, buyer: null, trick: [], last: null, won: [0, 0], raw: [0, 0], total: [0, 0], bid: null, proj: null, res: null, sub: 'deal', turn: 0, bt: [] };
      r.winTeam = null; r.winner = null; r.phase = 'play';
      H.log(r, 'بدأ البلوت — اللي يوصل ١٥٢ أول يفوز');
      newHand(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      const s = r.players.indexOf(p); if (s < 0) return;
      if (m.t === 'bbid') { if (!bid(r, s, { k: String(m.k), suit: m.suit })) H.err(p, 'مو دورك'); return; }
      if (m.t === 'bplay') { if (!play(r, s, +m.id)) H.err(p, 'ما تقدر تلعب هالورقة'); return; }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const seat = r.players.indexOf(p), mine = seat >= 0 && g.turn === seat;
      const B = g.bid;
      return {
        seat, sub: g.sub, turn: g.turn, dealer: g.dealer, handN: g.handN, mode: g.mode, trump: g.trump, buyer: g.buyer,
        hand: seat >= 0 ? g.hands[seat] : [], legal: mine && g.sub === 'play' ? legal(g, seat).map(c => c.id) : [],
        cnt: g.hands.map(h => h.length), up: g.up, trick: g.trick, last: g.last, won: g.won, total: g.total, target: TARGET,
        bid: g.sub === 'bid' && B ? { round: B.round, turn: B.turn, hokmBy: B.hokmBy, said: B.said, upS: g.up && g.up.s } : null,
        proj: g.proj && g.sub !== 'bid' ? { list: g.proj.list.map(l => l.map(x => x.t)), bloot: g.proj.bloot } : null,
        res: g.res && (g.sub === 'res' || g.sub === 'end') ? g.res : null
      };
    },
    leave(r, p) { if (r.phase === 'play' && r.g) { const t = 1 - p.team; finish(r, t, `${p.name} طلع، فاز فريق ${['أ', 'ب'][t]}`); } },
    _t: { legal, trickWinner, projects }
  };
};
