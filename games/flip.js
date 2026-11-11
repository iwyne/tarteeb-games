// أونو فليب: ورق بوجهين (فاتح / غامق). ورقة «فليب» تقلب كل اللعبة للوجه الثاني.
const SIDES = { L: ['red', 'yellow', 'green', 'blue'], D: ['pink', 'teal', 'orange', 'purple'] };
const AR = { red: 'أحمر', yellow: 'أصفر', green: 'أخضر', blue: 'أزرق', pink: 'وردي', teal: 'تركوازي', orange: 'برتقالي', purple: 'بنفسجي' };
const PTS = { draw1: 10, draw5: 20, reverse: 20, skip: 20, skipall: 30, flip: 20, wild: 40, wd2: 50, wdc: 60 };
const NAME = { draw1: '+١', draw5: '+٥', reverse: 'عكس', skip: 'منع', skipall: 'منع الكل', flip: 'فليب', wild: 'ملوّن', wd2: '+٢ ملوّن', wdc: 'ملوّن سحب لون' };
const TURN_MS = +process.env.FLIP_TURN_MS || 25000, CHAL_MS = 15000;
const pts = f => /^\d$/.test(f.v) ? +f.v : PTS[f.v] || 0;
const mod = (a, n) => ((a % n) + n) % n;

module.exports = H => {
  function build() {
    const L = [], D = [];
    for (const [side, arr] of [['L', L], ['D', D]]) {
      for (const c of SIDES[side]) {
        for (let i = 0; i < 2; i++) {
          for (let n = 1; n <= 9; n++) arr.push({ c, v: String(n) });
          arr.push({ c, v: side === 'L' ? 'draw1' : 'draw5' }, { c, v: 'reverse' }, { c, v: side === 'L' ? 'skip' : 'skipall' }, { c, v: 'flip' });
        }
      }
      for (let i = 0; i < 4; i++) arr.push({ c: 'wild', v: 'wild' }, { c: 'wild', v: side === 'L' ? 'wd2' : 'wdc' });
    }
    // الفليب يقابل فليب، والملوّن يقابل ملوّن، والباقي عشوائي
    const part = (arr, f) => H.shuffle(arr.filter(f)), cards = [];
    for (const [fa, fb] of [[x => x.v === 'flip', x => x.v === 'flip'], [x => x.c === 'wild', x => x.c === 'wild'], [x => x.v !== 'flip' && x.c !== 'wild', x => x.v !== 'flip' && x.c !== 'wild']]) {
      const a = part(L, fa), b = part(D, fb);
      a.forEach((f, i) => cards.push({ L: f, D: b[i] }));
    }
    cards.forEach((c, i) => { c.id = i; });
    return H.shuffle(cards);
  }
  const byId = (r, id) => r.players.find(p => p.id === id);
  const cur = r => r.players[r.g.turn];
  const face = (g, c) => c[g.side];
  const top = g => g.disc[g.disc.length - 1];

  function playable(g, p, c) {
    const f = face(g, c), t = face(g, top(g));
    if (f.c === 'wild') {
      if (f.v === 'wild') return true;
      return !p.hand.some(x => face(g, x).c === g.color); // +٢ / سحب لون: بس لو ما عندك لون الطاولة
    }
    return f.c === g.color || f.v === t.v;
  }
  function drawCards(r, p, n) {
    const g = r.g;
    for (let i = 0; i < n; i++) {
      if (!g.deck.length) { const t = g.disc.pop(); g.deck = H.shuffle(g.disc); g.disc = [t]; }
      if (!g.deck.length) break;
      p.hand.push(g.deck.pop());
    }
    if (p.hand.length > 1) g.called[p.id] = false;
  }
  function drawUntil(r, p, color) {
    const g = r.g; let k = 0;
    for (let guard = 0; guard < 200; guard++) {
      const before = p.hand.length; drawCards(r, p, 1);
      if (p.hand.length === before) break; k++;
      if (face(g, p.hand[p.hand.length - 1]).c === color) break;
    }
    return k;
  }
  function advance(r, steps) {
    const g = r.g, n = r.players.length;
    g.turn = mod(g.turn + g.dir * steps, n); g.sub = 'play'; g.chal = null;
    H.setTimer(r, TURN_MS, () => timeoutDraw(r));
  }
  function timeoutDraw(r) { const g = r.g; if (!g || r.phase !== 'play') return; if (g.sub === 'chal') return resolve(r, false); draw(r, cur(r)); }
  function nextP(r, steps = 1) { const g = r.g; return r.players[mod(g.turn + g.dir * steps, r.players.length)]; }

  function finish(r, p) {
    const g = r.g; r.phase = 'over'; r.winner = p.name; g.points = {};
    let tot = 0; r.players.forEach(q => { const s = q.hand.reduce((a, c) => a + pts(face(g, c)), 0); g.points[q.id] = s; tot += s; });
    g.total = tot; g.winId = p.id;
    H.log(r, `${p.name} خلّص أوراقه!`); H.win(r, [p]); H.setTimer(r, 0, null);
  }

  function play(r, p, id, color) {
    const g = r.g; if (r.phase !== 'play' || g.sub !== 'play' || cur(r) !== p) return;
    const card = p.hand.find(c => c.id === id); if (!card || !playable(g, p, card)) return;
    const f = face(g, card);
    if (f.c === 'wild' && !SIDES[g.side].includes(color)) return;
    const prevColor = g.color, hadColor = f.c === 'wild' && f.v !== 'wild' && p.hand.some(x => x !== card && face(g, x).c === prevColor);
    p.hand.splice(p.hand.indexOf(card), 1); g.disc.push(card); g.catchable = null;
    g.color = f.c === 'wild' ? color : f.c;
    H.log(r, `${p.name} لعب ${NAME[f.v] || f.v} ${f.c === 'wild' ? '(اختار ' + AR[color] + ')' : AR[f.c]}`);
    const next = nextP(r);
    if (f.v === 'wd2' || f.v === 'wdc') {
      if (!p.hand.length) { penalty(r, p, next, f.v, color, false); return finish(r, p); }
      g.sub = 'chal'; g.chal = { by: p.id, victim: next.id, kind: f.v, color, guilty: hadColor };
      H.log(r, `${next.name}: تقبل أو تتحدّى؟`); H.setTimer(r, CHAL_MS, () => resolve(r, false)); return;
    }
    let steps = 1;
    if (f.v === 'reverse') { g.dir *= -1; steps = r.players.length === 2 ? 2 : 1; }
    else if (f.v === 'skip') { steps = 2; H.log(r, `${next.name} انمنع`); }
    else if (f.v === 'skipall') { steps = 0; H.log(r, 'الكل انمنع — تلعب مرة ثانية'); }
    else if (f.v === 'draw1' || f.v === 'draw5') { const k = f.v === 'draw1' ? 1 : 5; drawCards(r, next, k); steps = 2; H.log(r, `${next.name} سحب ${k} وانمنع`); }
    else if (f.v === 'flip') {
      g.side = g.side === 'L' ? 'D' : 'L'; g.color = face(g, card).c; g.flips++;
      H.log(r, g.side === 'D' ? '🔄 انقلبت اللعبة للوجه الغامق!' : '🔄 رجعت اللعبة للوجه الفاتح!');
    }
    if (!p.hand.length) return finish(r, p);
    if (p.hand.length === 1 && !g.called[p.id]) g.catchable = p.id;
    advance(r, steps);
  }
  function penalty(r, p, victim, kind, color, skip) {
    if (kind === 'wd2') { drawCards(r, victim, 2); return 2; }
    return drawUntil(r, victim, color);
  }
  function resolve(r, challenge) {
    const g = r.g; if (g.sub !== 'chal' || !g.chal) return;
    const c = g.chal, off = byId(r, c.by), vic = byId(r, c.victim);
    if (!off || !vic) return advance(r, 1);
    const turnAt = g.turn;
    if (!challenge) {
      const k = penalty(r, off, vic, c.kind, c.color); H.log(r, `${vic.name} سحب ${k} وانمنع`);
      if (off.hand.length === 1 && !g.called[off.id]) g.catchable = off.id;
      return advance(r, 2);
    }
    if (c.guilty) {
      const k = penalty(r, vic, off, c.kind, c.color);
      H.log(r, `التحدّي نجح! ${off.name} كان عنده اللون وسحب ${k}`);
      return advance(r, 1);
    }
    const k = penalty(r, off, vic, c.kind, c.color) + 2; drawCards(r, vic, 2);
    H.log(r, `التحدّي فشل! ${vic.name} سحب ${k} وانمنع`);
    advance(r, 2);
  }
  function draw(r, p) {
    const g = r.g; if (r.phase !== 'play' || g.sub !== 'play' || cur(r) !== p) return;
    g.catchable = null; drawCards(r, p, 1); H.log(r, `${p.name} سحب ورقة`);
    advance(r, 1); // قاعدتنا: الورقة المسحوبة ما تنلعب
  }

  return {
    min: 2, max: 8,
    start(r) {
      const g = r.g = { deck: build(), disc: [], side: 'L', color: null, dir: 1, turn: 0, sub: 'play', chal: null, called: {}, catchable: null, flips: 0, points: null, total: 0, winId: null };
      r.players.forEach(p => { p.hand = []; });
      for (let i = 0; i < 7; i++) r.players.forEach(p => p.hand.push(g.deck.pop()));
      let c; for (let guard = 0; guard < 300; guard++) { c = g.deck.pop(); if (/^\d$/.test(c.L.v)) break; g.deck.unshift(c); }
      g.disc.push(c); g.color = c.L.c; g.turn = Math.random() * r.players.length | 0;
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'بدأت اللعبة — الوجه الفاتح');
      H.setTimer(r, TURN_MS, () => timeoutDraw(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'play') play(r, p, +m.id, m.color);
      else if (m.t === 'draw') draw(r, p);
      else if (m.t === 'chal') { if (g.sub === 'chal' && g.chal && g.chal.victim === p.id) resolve(r, !!m.yes); }
      else if (m.t === 'uno') {
        if (p.hand.length > 2 || p.spec) return;
        g.called[p.id] = true; if (g.catchable === p.id) g.catchable = null; H.log(r, `${p.name}: أونو!`);
      } else if (m.t === 'catch') {
        const v = g.catchable && byId(r, g.catchable); if (!v || v === p) return;
        g.catchable = null; drawCards(r, v, 2); H.log(r, `${p.name} مسك ${v.name} ما قال أونو، وسحب ٢`);
      }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const mine = !p.spec && r.phase === 'play' && g.sub === 'play' && cur(r) === p;
      const t = top(g), tf = face(g, t);
      const hand = (p.hand || []).map(c => { const f = face(g, c); return { id: c.id, c: f.c, v: f.v, ok: mine && playable(g, p, c) }; });
      hand.sort((a, b) => (a.c > b.c ? 1 : a.c < b.c ? -1 : a.v > b.v ? 1 : -1));
      const over = r.phase === 'over';
      return {
        side: g.side, color: g.color, top: { id: t.id, c: tf.c, v: tf.v }, dir: g.dir, deckN: g.deck.length,
        turn: r.players[g.turn] ? r.players[g.turn].id : null, sub: g.sub, hand,
        chal: g.chal ? { by: g.chal.by, victim: g.chal.victim, kind: g.chal.kind, color: g.chal.color } : null,
        canUno: !p.spec && r.phase === 'play' && (p.hand || []).length <= 2 && !g.called[p.id],
        catchable: g.catchable && g.catchable !== p.id ? g.catchable : null,
        called: g.called, points: over ? g.points : null, total: over ? g.total : 0, winId: g.winId, flips: g.flips
      };
    },
    leave(r, p) {
      const g = r.g; if (!g) return;
      g.deck.unshift(...(p.hand || [])); p.hand = []; delete g.called[p.id];
      if (g.catchable === p.id) g.catchable = null;
      const i = p._idx, n = r.players.length;
      if (i < g.turn) g.turn--;
      else if (i === g.turn) { g.turn = g.dir === -1 ? mod(g.turn - 1, n) : mod(g.turn, n); g.sub = 'play'; g.chal = null; H.setTimer(r, TURN_MS, () => timeoutDraw(r)); }
      else if (g.chal && (g.chal.victim === p.id || g.chal.by === p.id)) { g.sub = 'play'; g.chal = null; H.setTimer(r, TURN_MS, () => timeoutDraw(r)); }
      g.turn = mod(g.turn, n);
    },
    playable, face, SIDES
  };
};
