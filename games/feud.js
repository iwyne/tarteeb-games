// العائلة الترتيب: فريقين يخمّنون أشهر الأجوبة على سؤال.
// مواجهة (واحد من كل فريق) ← الفريق اللي يكسب يجاوب بالدور ← ٣ أخطاء = الفريق الثاني يقدر يسرق النقاط بجواب واحد.
const QS = require('./feud-q');
const SCALE = +process.env.FEUD_SCALE || 1;
const FACE_MS = 15000, TURN_MS = 20000, STEAL_MS = 20000, END_MS = 6000;
const rnd = n => Math.random() * n | 0;
const norm = s => String(s || '').toLowerCase().replace(/[ً-ْـٰ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N} ]+/gu, '').trim()
  .split(/\s+/).map(w => w.replace(/^(وال|بال|فال|ال)(?=..)/, '')).join(' ');
const WRONG = ['ما أدري', 'كرسي', 'بطاطس', 'سيارة', 'قطو', 'جوال', 'نوم', 'شاي'];
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  // يرجع رقم الجواب (٠ = الأشهر) أو -1
  function match(q, text) {
    const t = norm(text); if (!t) return -1;
    let best = -1, bl = 0; // نختار أطول صيغة طابقت (عشان «سبانش لاتيه» ما تروح لـ«لاتيه»)
    for (let i = 0; i < q.a.length; i++) {
      const [ans, , ...alts] = q.a[i];
      for (const k of [ans, ...alts].map(norm)) {
        if (!k) continue;
        const ok = k === t ? 1e3 : (k.length >= 3 && (' ' + t + ' ').includes(' ' + k + ' ')) ? k.length : (t.length >= 4 && k.includes(t)) ? t.length : 0;
        if (ok > bl) { bl = ok; best = i; }
      }
    }
    return best;
  }
  const team = (g, t) => g.T[t].filter(Boolean);
  function curAnswerer(r) { const g = r.g; const ids = g.T[g.ctrl]; return ids.length ? ids[g.ti[g.ctrl] % ids.length] : null; }
  function newRound(r) {
    const g = r.g; g.round++; g.bt.forEach(clearTimeout); g.bt = [];
    g.q = g.deck[g.round - 1]; g.rev = g.q.a.map(() => false); g.strikes = 0; g.pool = 0; g.ctrl = null; g.log = []; g.face = {}; g.stealBy = null; g.win = null;
    g.mult = g.round === g.rounds ? 2 : 1;
    g.faceIds = [0, 1].map(t => g.T[t][g.fi[t] % g.T[t].length]); g.fi[0]++; g.fi[1]++;
    g.sub = 'face';
    H.setTimer(r, FACE_MS * SCALE, () => faceEnd(r));
    g.faceIds.forEach(id => { const b = byId(r, id); if (b && b.bot) later(r, (2500 + rnd(5000)) * SCALE, () => submit(r, b, botGuess(g))); });
  }
  function botGuess(g) {
    if (Math.random() < .6) { const open = g.q.a.map((a, i) => i).filter(i => !g.rev[i]); if (open.length) return g.q.a[open[Math.min(open.length - 1, rnd(3))]][0]; }
    return WRONG[rnd(WRONG.length)];
  }
  function reveal(g, i) { if (g.rev[i]) return false; g.rev[i] = true; g.pool += g.q.a[i][1]; return true; }
  function say(g, id, text, res) { g.log.push({ id, t: String(text).slice(0, 40), res }); if (g.log.length > 8) g.log.shift(); g.ev = { id, res, n: (g.ev ? g.ev.n : 0) + 1 }; }
  function faceEnd(r) {
    const g = r.g; if (g.sub !== 'face') return;
    const f = g.faceIds.map(id => g.face[id]);
    let win;
    const rk = f.map(x => x && x.i >= 0 ? x.i : 99);
    if (rk[0] !== rk[1]) win = rk[0] < rk[1] ? 0 : 1;
    else if (f[0] && f[1]) win = f[0].at <= f[1].at ? 0 : 1; // نفس الشي: الأسرع
    else win = f[0] ? 0 : f[1] ? 1 : rnd(2);
    g.ctrl = win; g.sub = 'play';
    // اللي فاز بالمواجهة يبدأ، وبعده باقي فريقه بالدور
    const fid = g.faceIds[win], k = g.T[win].indexOf(fid); g.ti[win] = k >= 0 ? k + 1 : g.ti[win];
    if (g.rev.every(Boolean)) return roundWin(r, g.ctrl);
    turn(r);
  }
  function turn(r) {
    const g = r.g; g.who = curAnswerer(r); g.turnN++;
    H.setTimer(r, TURN_MS * SCALE, () => { say(g, g.who, '⏰', 'x'); strike(r); });
    const b = byId(r, g.who), n = g.turnN;
    if (b && b.bot) later(r, (3000 + rnd(4000)) * SCALE, () => { if (g.turnN === n && g.sub === 'play') submit(r, b, botGuess(g)); });
  }
  function strike(r) {
    const g = r.g; g.strikes++;
    if (g.strikes >= 3) {
      g.sub = 'steal'; g.stealBy = 1 - g.ctrl; g.who = null;
      H.setTimer(r, STEAL_MS * SCALE, () => { say(g, null, '⏰', 'x'); roundWin(r, g.ctrl); });
      const bots = team(g, g.stealBy).map(id => byId(r, id)).filter(p => p && p.bot);
      if (bots.length) later(r, (7000 + rnd(5000)) * SCALE, () => { if (g.sub === 'steal') submit(r, bots[0], botGuess(g)); });
      return;
    }
    g.ti[g.ctrl]++; turn(r);
  }
  function submit(r, p, text) {
    const g = r.g; const t = String(text || '').trim().slice(0, 40); if (!t) return;
    const myT = g.T[0].includes(p.id) ? 0 : g.T[1].includes(p.id) ? 1 : -1; if (myT < 0) return;
    if (g.sub === 'face') {
      if (!g.faceIds.includes(p.id) || g.face[p.id]) return;
      const i = match(g.q, t); g.face[p.id] = { i, at: Date.now() };
      if (i >= 0) reveal(g, i);
      say(g, p.id, t, i >= 0 ? i : 'x');
      if (i === 0 || g.faceIds.every(id => g.face[id] || !byId(r, id))) H.setTimer(r, 1200, () => faceEnd(r));
      return;
    }
    if (g.sub === 'play') {
      if (p.id !== g.who) return;
      const i = match(g.q, t);
      if (i >= 0 && !g.rev[i]) { reveal(g, i); say(g, p.id, t, i); if (g.rev.every(Boolean)) return roundWin(r, g.ctrl); g.ti[g.ctrl]++; turn(r); }
      else { say(g, p.id, t, i >= 0 ? 'dup' : 'x'); strike(r); }
      return;
    }
    if (g.sub === 'steal') {
      if (myT !== g.stealBy) return;
      const i = match(g.q, t);
      if (i >= 0 && !g.rev[i]) { reveal(g, i); say(g, p.id, t, i); roundWin(r, g.stealBy, true); }
      else { say(g, p.id, t, 'x'); roundWin(r, g.ctrl); }
    }
  }
  function roundWin(r, t, stole) {
    const g = r.g; if (g.sub === 'end' || g.sub === 'roundEnd') return;
    const pts = g.pool * g.mult;
    g.ts[t] += pts; g.win = { t, pts, stole: !!stole };
    g.sub = 'roundEnd'; g.bt.forEach(clearTimeout); g.bt = [];
    H.setTimer(r, END_MS * SCALE, () => g.round >= g.rounds ? end(r) : newRound(r));
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end';
    const [a, b] = g.ts;
    if (a === b) { r.winner = 'تعادل'; r.winTeam = null; }
    else { const w = a > b ? 0 : 1; r.winTeam = w; r.score[w]++; r.winner = 'فريق ' + ['أ', 'ب'][w]; H.win(r, r.players.filter(p => p.team === w)); }
    H.setTimer(r, 0, null);
  }
  return {
    min: 2, max: 12,
    start(r) {
      r.players.forEach((p, i) => { p.team = i % 2; });
      const rounds = [4, 6].includes(r.opts.drounds) ? r.opts.drounds : 4;
      r.g = { T: [0, 1].map(t => r.players.filter(p => p.team === t).map(p => p.id)), deck: H.shuffle(QS.slice()).slice(0, rounds), rounds, round: 0, ts: [0, 0], fi: [0, 0], ti: [0, 0], q: null, rev: [], strikes: 0, pool: 0, ctrl: null, sub: 'face', face: {}, faceIds: [], who: null, log: [], bt: [], mult: 1, turnN: 0, ev: null, win: null };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'خمّنوا أشهر الأجوبة!');
      newRound(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'dans') { if (!H.rate(p, 'da', 500)) return 'quiet'; return submit(r, p, m.v); }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const all = g.sub === 'roundEnd' || g.sub === 'end';
      return {
        sub: g.sub, round: g.round, rounds: g.rounds, q: g.q && g.q.q, mult: g.mult, ts: g.ts, T: g.T, ctrl: g.ctrl, strikes: g.strikes, pool: g.pool, who: g.who, faceIds: g.faceIds,
        faced: Object.keys(g.face), stealBy: g.stealBy, log: g.log, ev: g.ev, win: g.win,
        board: g.q ? g.q.a.map((a, i) => g.rev[i] || all ? { t: a[0], p: a[1], open: g.rev[i] } : null) : [], n: g.q ? g.q.a.length : 0
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      [0, 1].forEach(t => { g.T[t] = g.T[t].filter(id => id !== p.id); });
      if (!g.T[0].length || !g.T[1].length) { const w = g.T[0].length ? 0 : 1; g.ts[w] += 1; return end(r); }
      if (g.sub === 'play' && g.who === p.id) turn(r);
      if (g.sub === 'face' && g.faceIds.includes(p.id)) H.setTimer(r, 800, () => faceEnd(r));
    },
    _match: match
  };
};
