// مطاردة: سيارات بمدينة. الصياد (🚨) يصدم الهاربين، واللي ينصاد يصير صياد معه (عدوى).
// الهارب ياخذ نقطة كل ثانية يعيشها و٢٠ لو نجا للنهاية، والصياد ياخذ ١٥ عن كل صيدة. أكثر نقاط بعد الجولات يفوز.
const M = require('../public/cars-map');
const SCALE = +process.env.CARS_SCALE || 1;
const INTRO = 3500 * SCALE, PLAY_DEF = 75000, RES = 6000 * SCALE, FREEZE = 3000 * SCALE, NEWH_FREEZE = 1200;
const CATCH_D = M.CR * 2 + 6, TICK = 100;
const CATCH_PTS = 15, SURVIVE_PTS = 20;
module.exports = H => {
  const plist = g => Object.values(g.C);
  const rnd = n => Math.random() * n | 0;
  function placeAll(r) {
    const g = r.g, hs = H.shuffle(M.SPAWN_H.slice()), rs = H.shuffle(M.SPAWN_R.slice());
    let hi = 0, ri = 0;
    plist(g).forEach(C => {
      const [x, y] = C.role === 'h' ? hs[hi++ % hs.length] : rs[ri++ % rs.length];
      C.x = x + (C.role === 'h' ? 0 : rnd(20) - 10); C.y = y; C.v = 0;
      C.a = Math.atan2(700 - y, 1100 - x) + (C.role === 'h' ? Math.PI : 0);
      M.unstick(C); C.lastMv = Date.now(); C.boostUntil = 0; C.boostAt = 0;
    });
  }
  function newRound(r) {
    const g = r.g; g.round++;
    const ids = Object.keys(g.C), n = ids.length, nh = Math.max(1, Math.min(3, Math.round(n / 5)));
    // الصياد يتغير كل جولة: اللي صاد أقل مرات يصير صياد
    const order = H.shuffle(ids).sort((a, b) => g.C[a].hTimes - g.C[b].hTimes);
    plist(g).forEach(C => { C.role = 'r'; C.caught = false; C.by = null; C.rp = 0; C.freeze = 0; });
    order.slice(0, nh).forEach(id => { const C = g.C[id]; C.role = 'h'; C.hTimes++; });
    placeAll(r);
    g.sub = 'intro'; g.feed = []; g.res = null; g.spawnK = g.round;
    H.log(r, `الجولة ${g.round}: الصياد ${order.slice(0, nh).map(id => name(r, id)).join(' و ')} 🚨`);
    H.setTimer(r, INTRO, () => {
      g.sub = 'play'; const now = Date.now();
      plist(g).forEach(C => { C.lastMv = now; if (C.role === 'h') C.freeze = now + FREEZE; });
      g.endAt = now + g.playMs; g.secAt = now + 1000;
      H.setTimer(r, g.playMs, () => endRound(r));
    });
  }
  const name = (r, id) => { const p = r.players.find(q => q.id === id); return p ? p.name : '؟'; };
  function endRound(r) {
    const g = r.g; if (g.sub !== 'play') return;
    g.sub = 'res';
    const surv = plist(g).filter(C => C.role === 'r');
    surv.forEach(C => { C.pts += SURVIVE_PTS; C.rp += SURVIVE_PTS; });
    g.res = { surv: surv.map(C => C.id), rp: Object.fromEntries(plist(g).map(C => [C.id, C.rp])) };
    H.log(r, surv.length ? `نجا: ${surv.map(C => name(r, C.id)).join('، ')} 🏁` : 'الصيادين صادوا الكل! 🚨');
    if (g.round >= g.rounds) {
      H.setTimer(r, RES, () => finish(r));
    } else H.setTimer(r, RES, () => newRound(r));
  }
  function finish(r) {
    const g = r.g; clearInterval(g.iv);
    const L = plist(g).sort((a, b) => b.pts - a.pts), top = L.length ? L[0].pts : 0;
    const winners = r.players.filter(p => g.C[p.id] && g.C[p.id].pts === top);
    r.phase = 'over'; r.winner = winners.map(p => p.name).join(' و ') || '—';
    H.win(r, winners); H.log(r, `🏆 ${r.winner} فاز بـ${top} نقطة`); H.setTimer(r, 0, null);
  }
  function catchCar(r, h, v) {
    const g = r.g;
    v.role = 'h'; v.caught = true; v.by = h.id; v.freeze = Date.now() + NEWH_FREEZE;
    h.pts += CATCH_PTS; h.rp += CATCH_PTS; h.catches = (h.catches || 0) + 1;
    g.feed.push([h.id, v.id]); if (g.feed.length > 6) g.feed.shift();
    H.cast(r, { t: 'gnet', g: 'cars', k: 'catch', by: h.id, who: v.id });
    if (!plist(g).some(C => C.role === 'r')) endRound(r);
    H.push(r);
  }
  // ---- البوتات ----
  function botInput(g, C, now) {
    const b = C.bot, others = plist(g).filter(o => o !== C);
    let tx = 0, ty = 0, near = 1e9;
    if (C.role === 'h') {
      // يلاحق أقرب هارب ويتوقّع وين بيروح
      let T = null; others.forEach(o => { if (o.role !== 'r') return; const d = Math.hypot(o.x - C.x, o.y - C.y); if (d < near) { near = d; T = o; } });
      if (T) { const lead = Math.min(.6, near / 600); tx = T.x + Math.cos(T.a) * T.v * lead - C.x; ty = T.y + Math.sin(T.a) * T.v * lead - C.y; }
    } else {
      others.forEach(o => { if (o.role !== 'h') return; const dx = C.x - o.x, dy = C.y - o.y, d = Math.hypot(dx, dy) || 1; near = Math.min(near, d); if (d < 700) { tx += dx / d * (700 - d); ty += dy / d * (700 - d); } });
      // لو ما فيه خطر: يتمشّى لنقطة عشوائية
      if (!tx && !ty) { if (!b.wp || Math.hypot(b.wp[0] - C.x, b.wp[1] - C.y) < 80 || now > b.wpAt) { b.wp = M.SPAWN_R[rnd(M.SPAWN_R.length)]; b.wpAt = now + 8000; } tx = b.wp[0] - C.x; ty = b.wp[1] - C.y; }
      // يبعد عن الزوايا عشان ما يتحاصر
      tx += (M.W / 2 - C.x) * .25; ty += (M.H / 2 - C.y) * .25;
    }
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    // يختار أفضل اتجاه من ١٦ حسب الهدف والمسافة الفاضية
    let best = 0, bs = -1e9;
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a), f = M.free(C.x, C.y, a, 240);
      let s = dx * tx + dy * ty - (240 - f) / 240 * 1.6 + Math.cos(a - C.a) * .25 + (b.noise || 0) * Math.sin(a * 3);
      if (s > bs) { bs = s; best = a; }
    }
    if (now > (b.nAt || 0)) { b.noise = (Math.random() - .5) * .3; b.nAt = now + 1500; }
    const wantBoost = C.role === 'h' ? near < 260 : near < 230;
    if (wantBoost && now > C.boostAt + M.BOOST_CD && Math.random() < (g.diff === 'hard' ? .6 : .3)) { C.boostAt = now; C.boostUntil = now + M.BOOST_MS; }
    // الصياد البوت أبطأ شوي عشان الناس تلحق تهرب
    const sl = C.role === 'h' ? .93 : .97;
    return [Math.cos(best) * sl, Math.sin(best) * sl];
  }
  function tick(r) {
    const g = r.g, now = Date.now();
    if (g.sub === 'play') {
      const dt = TICK / 1000;
      plist(g).forEach(C => {
        if (!C.bot) return;
        if (C.freeze > now) { C.v = 0; return; }
        const [ix, iy] = botInput(g, C, now);
        for (let k = 0; k < 2; k++) M.step(C, ix, iy, dt / 2, { hunter: C.role === 'h', boost: C.boostUntil > now });
      });
      // الصيد
      const hs = plist(g).filter(C => C.role === 'h' && C.freeze <= now);
      for (const h of hs) for (const v of plist(g)) {
        if (v.role !== 'r' || r.phase !== 'play' || g.sub !== 'play') continue;
        if (Math.hypot(h.x - v.x, h.y - v.y) < CATCH_D) catchCar(r, h, v);
      }
      if (g.sub === 'play' && now >= g.secAt) { g.secAt += 1000; plist(g).forEach(C => { if (C.role === 'r') { C.pts++; C.rp++; } }); g.ptsDirty = true; if ((g.secN = (g.secN || 0) + 1) % 5 === 0) H.push(r); }
    }
    const p = plist(g).map(C => [C.id, C.x | 0, C.y | 0, Math.round(C.a * 100), (C.boostUntil > now ? 1 : 0) | (C.role === 'h' ? 2 : 0), C.v | 0]);
    const s = JSON.stringify(p);
    if (s !== g._last) { g._last = s; H.cast(r, { t: 'gnet', g: 'cars', k: 'pos', p }); }
  }
  return {
    min: 2, max: 42,
    start(r) {
      const rounds = [1, 3, 5].includes(+r.opts.krounds) ? +r.opts.krounds : 3;
      const playMs = ([60, 75, 90].includes(+r.opts.ktime) ? +r.opts.ktime : 75) * 1000 * SCALE;
      const g = r.g = { C: {}, round: 0, rounds, playMs, sub: 'intro', feed: [], res: null, endAt: 0, diff: 'mid' };
      const cols = H.shuffle([...Array(10).keys()]);
      r.players.forEach((q, i) => { g.C[q.id] = { id: q.id, c: i < 10 ? cols[i] : i, x: 0, y: 0, a: 0, v: 0, role: 'r', caught: false, pts: 0, rp: 0, hTimes: 0, freeze: 0, boostUntil: 0, boostAt: 0, lastMv: Date.now(), bot: q.bot ? { wp: null } : null }; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      newRound(r);
      clearInterval(g.iv);
      g.iv = setInterval(() => { if (r.g !== g || r.phase !== 'play' || !H.alive(r)) return clearInterval(g.iv); try { tick(r); } catch (e) { console.error('cars tick', e); } }, TICK);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return 'quiet';
      const C = g.C[p.id]; if (!C) return 'quiet';
      const now = Date.now();
      if (m.t === 'mv') {
        if (g.sub !== 'play' || !H.rate(p, 'cmv', 30)) return 'quiet';
        const x = +m.x, y = +m.y, a = +m.a;
        if (!isFinite(x) || !isFinite(y) || !isFinite(a)) return 'quiet';
        const dt = Math.min(500, Math.max(16, now - C.lastMv)), boost = C.boostUntil + 300 > now;
        const max = M.MAX * M.HUNT * (boost ? M.BOOST : 1) * dt / 1000 * 1.4 + 30;
        if (C.freeze > now + 150 || Math.hypot(x - C.x, y - C.y) > max || M.hits(x, y, M.CR - 3)) { C.lastMv = now; H.sendTo(p, { t: 'gnet', g: 'cars', k: 'snap', x: C.x, y: C.y, a: C.a }); return 'quiet'; }
        C.x = x; C.y = y; C.a = Math.atan2(Math.sin(a), Math.cos(a)); C.v = Math.min(800, Math.max(0, +m.v || 0)); C.lastMv = now;
        return 'quiet';
      }
      if (m.t === 'boost') {
        if (g.sub !== 'play' || now < C.boostAt + M.BOOST_CD - 150) return 'quiet';
        C.boostAt = now; C.boostUntil = now + M.BOOST_MS;
        return 'quiet';
      }
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const me = g.C[p.id], now = Date.now();
      return {
        sub: g.sub, round: g.round, rounds: g.rounds, spawnK: g.spawnK,
        me: me ? { x: me.x, y: me.y, a: me.a, role: me.role, caught: me.caught, by: me.by, freeze: Math.max(0, me.freeze - now), boostCd: Math.max(0, me.boostAt + M.BOOST_CD - now) } : null,
        cars: Object.fromEntries(plist(g).map(C => [C.id, { c: C.c, role: C.role, caught: C.caught, pts: C.pts, rp: C.rp, catches: C.catches || 0 }])),
        feed: g.feed, res: g.res, left: g.sub === 'play' ? Math.max(0, g.endAt - now) : 0
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      delete g.C[p.id];
      const L = plist(g);
      if (L.length < 2) { if (L.length) { const w = r.players.find(q => q.id === L[0].id); if (w) { r.phase = 'over'; r.winner = w.name; H.win(r, [w]); H.log(r, `${w.name} فاز لأن الباقين طلعوا`); clearInterval(g.iv); H.setTimer(r, 0, null); } } return; }
      if (g.sub === 'play' && !L.some(C => C.role === 'h')) { const C = L[rnd(L.length)]; C.role = 'h'; C.freeze = Date.now() + 1500; H.log(r, `${name(r, C.id)} صار الصياد 🚨`); }
      if (g.sub === 'play' && !L.some(C => C.role === 'r')) endRound(r);
    }
  };
};
