// البيت المسكون (ثري دي): واحد أو اثنين أشباح، والباقين ناجين معهم كشافات.
// الناجين يدورون المفاتيح بالبيت، ولما يكتملون ينفتح الباب الأمامي ويهربون منه.
// الشبح أسرع من المشي، بس الكشاف لو انوجّه عليه من قريب يحرقه ويجمّده ثواني. والناجي يقدر يختبي بالدواليب.
// الحركة مباشرة: المتصفح يرسل مكانه والسيرفر يتحقق (السرعة + الجدران)، ويوزّع الأماكن ١٠ مرات بالثانية حسب اللي يشوفه كل واحد.
const M = require('../public/haunt-map');
const WALK = 4.2, RUN = 6.6, GSPEED = 4.7, CATCH_R = 1.6, USE_R = 1.8;
const BEAM_R = 10, BEAM_ANG = 0.3, STUN = 2600, BURN_CD = 9000;
const SCREAM_R = 13, SCREAM_CD = 24000, DARK_MS = 4000, CHECK_CD = 2000;
const GHOST_SEE = 7, LIGHT_SEE = 18, SURV_SEE = 5.5, BEAM_SEE = 15;
const BAT_DRAIN = 100 / 85, BAT_PICK = 55, INTRO = 6500, WAKE = 10000;
const rnd = n => Math.random() * n | 0;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const yawTo = (dx, dz) => Math.atan2(-dx, -dz);
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };
const sees = (a, b) => M.see(a.x, a.z, b.x, b.z);
const r2 = v => Math.round(v * 100) / 100;

module.exports = H => {
  const plist = g => Object.values(g.P);
  const human = (r, id) => { const q = r.players.find(x => x.id === id); return q && !q.bot ? q : null; };
  const tell = (r, id, o) => { const q = human(r, id); if (q) H.sendTo(q, o); };
  const name = (r, id) => (r.players.find(q => q.id === id) || {}).name || '؟';
  const inside = P => !P.ghost && P.alive && !P.escaped;
  const snap = (r, P) => tell(r, P.id, { t: 'hsnap', x: P.x, z: P.z, yaw: P.yaw });
  const lightOn = (P, now) => P.fl && P.bat > 0 && now > P.darkTill && P.hidden == null && inside(P);
  const inBeam = (S, G) => { const d = dist(S, G); if (d > BEAM_R || d < .2) return false; return angDiff(S.yaw, yawTo(G.x - S.x, G.z - S.z)) < BEAM_ANG + Math.atan2(.45, d) && sees(S, G); };

  function finish(r, why) {
    const g = r.g; if (r.phase !== 'play') return;
    const surv = plist(g).filter(P => !P.ghost), esc = surv.filter(P => P.escaped).length;
    g.win = surv.length && esc >= Math.ceil(surv.length / 2) ? 'surv' : 'ghost';
    g.why = why; g.sub = 'end';
    r.phase = 'over'; r.winner = g.win === 'surv' ? 'الناجين' : 'الشبح';
    H.win(r, r.players.filter(q => g.P[q.id] && !!g.P[q.id].ghost === (g.win === 'ghost')));
    H.log(r, why); H.setTimer(r, 0, null); clearInterval(g.iv);
  }
  function checkEnd(r) {
    const g = r.g; if (r.phase !== 'play') return true;
    const ps = plist(g);
    if (!ps.some(P => P.ghost)) { finish(r, 'الشبح طلع من اللعبة'); return true; }
    const surv = ps.filter(P => !P.ghost);
    if (!surv.length) { finish(r, 'ما بقى ناجين'); return true; }
    if (!surv.some(inside)) {
      const esc = surv.filter(P => P.escaped).length;
      finish(r, esc ? `هرب ${esc} من ${surv.length}` : 'الشبح مسك الكل 👻'); return true;
    }
    return false;
  }

  function caught(r, G, P, how) {
    const g = r.g;
    P.alive = false; P.caught = true; P.hidden = null; P.fl = false;
    g.caughtN++;
    H.log(r, `👻 ${name(r, G.id)} مسك ${name(r, P.id)}${how === 'ward' ? ' وهو مختبي' : ''}`);
    tell(r, P.id, { t: 'hev', ev: 'caught', by: G.c });
    tell(r, G.id, { t: 'hev', ev: 'got', id: P.id });
    plist(g).forEach(Q => { if (Q !== P && Q !== G) tell(r, Q.id, { t: 'hev', ev: 'lost', id: P.id, x: r2(P.x), z: r2(P.z) }); });
    snap(r, P);
    checkEnd(r);
  }
  function escape(r, P) {
    P.escaped = true; P.fl = false;
    H.log(r, `🚪 ${name(r, P.id)} هرب من البيت!`);
    H.cast(r, { t: 'hev', ev: 'esc', id: P.id });
    checkEnd(r);
  }

  function use(r, P, now) {
    const g = r.g;
    if (P.ghost) {
      if (now < P.stun || now - P.checkAt < CHECK_CD) return false;
      const o = M.FURN.find(o => o.hide && Math.hypot(P.x - o.front[0], P.z - o.front[1]) <= USE_R + .3);
      if (!o) return false;
      P.checkAt = now;
      const T = plist(g).find(Q => Q.hidden === o.i);
      H.cast(r, { t: 'hev', ev: 'open', f: o.i });
      if (T) caught(r, P, T, 'ward'); else tell(r, P.id, { t: 'hev', ev: 'empty' });
      return true;
    }
    if (!inside(P)) return false;
    if (P.hidden != null) {
      const o = M.FURN[P.hidden]; P.hidden = null; P.x = o.front[0]; P.z = o.front[1]; P.yaw = o.yaw; P.lastMv = now;
      snap(r, P); H.cast(r, { t: 'hev', ev: 'open', f: o.i }); return true;
    }
    const k = g.keys.find(k => !k.got && Math.hypot(P.x - k.x, P.z - k.z) <= USE_R);
    if (k) {
      k.got = P.id; g.have++;
      H.log(r, `🔑 ${name(r, P.id)} لقى مفتاح (${g.have}/${g.need})`);
      H.cast(r, { t: 'hev', ev: 'key', id: P.id, k: k.id });
      if (g.have >= g.need && !g.open) { g.open = true; H.log(r, '🚪 الباب الأمامي انفتح! اهربوا!'); H.cast(r, { t: 'hev', ev: 'door' }); }
      return true;
    }
    const b = g.bats.find(b => !b.got && Math.hypot(P.x - b.x, P.z - b.z) <= USE_R);
    if (b) { b.got = P.id; P.bat = Math.min(100, P.bat + BAT_PICK); tell(r, P.id, { t: 'hev', ev: 'bat' }); return true; }
    const o = M.FURN.find(o => o.hide && Math.hypot(P.x - o.front[0], P.z - o.front[1]) <= USE_R + .3 && !plist(g).some(Q => Q.hidden === o.i));
    if (o) { P.hidden = o.i; P.x = o.c[0]; P.z = o.c[1]; P.yaw = o.yaw; snap(r, P); H.cast(r, { t: 'hev', ev: 'close', f: o.i }); return true; }
    return false;
  }
  function scream(r, P, now) {
    const g = r.g;
    if (!P.ghost || now < P.stun || now < P.screamAt || now < g.wakeAt) return false;
    P.screamAt = now + SCREAM_CD; P.reveal = now + 1500;
    plist(g).forEach(Q => { if (inside(Q) && dist(Q, P) <= SCREAM_R) Q.darkTill = now + DARK_MS; });
    H.cast(r, { t: 'hev', ev: 'scream', id: P.id, x: r2(P.x), z: r2(P.z) });
    return true;
  }

  // ---------- البوتات ----------
  function follow(P, dt, speed) {
    const b = P.bot; let step = speed * dt;
    while (step > 0 && b.path && b.path.length) {
      const [tx, tz] = b.path[0], d = Math.hypot(tx - P.x, tz - P.z);
      if (d > .05) P.yaw = b.face != null ? b.face : yawTo(tx - P.x, tz - P.z);
      if (d <= step) { P.x = tx; P.z = tz; step -= d; b.path.shift(); }
      else { P.x += (tx - P.x) / d * step; P.z += (tz - P.z) / d * step; step = 0; }
    }
    return !b.path || !b.path.length;
  }
  function goTo(r, P, x, z, now) {
    const b = P.bot;
    if (b.goal && Math.hypot(b.goal[0] - x, b.goal[1] - z) < .5 && b.path && b.path.length && now - b.pathAt < 1500) return;
    b.goal = [x, z]; b.pathAt = now; b.path = M.path(P.x, P.z, x, z, r.g.open && !P.ghost) || [];
  }
  const randFloor = () => { const [x, y] = M.floors[rnd(M.floors.length)]; return M.center(x, y); };
  function botSurv(r, P, dt, now) {
    const g = r.g, b = P.bot;
    if (P.hidden != null) { if (now > b.hideTill) { use(r, P, now); b.path = []; } return; }
    const gh = plist(g).filter(G => G.ghost && (dist(G, P) < 5 || (dist(G, P) < 10 && sees(G, P)))).sort((a, c) => dist(a, P) - dist(c, P))[0];
    if (!gh && b.wait > now) return;
    b.face = null; P.fl = P.bat > 0;
    b.stam = Math.min(100, (b.stam ?? 100) + dt * 15);
    const run = () => { if (b.stam > 5 && !b.tired) { b.stam -= dt * 39; if (b.stam <= 5) b.tired = true; return RUN * .92; } if (b.stam > 30) b.tired = false; return WALK; };
    if (gh) {
      if (b.hideFor) {
        const o = b.hideFor;
        if (follow(P, dt, run()) || Math.hypot(P.x - o.front[0], P.z - o.front[1]) < USE_R) { b.hideFor = null; if (use(r, P, now)) { b.hideTill = now + 4000 + rnd(6000); H.push(r); } }
        return;
      }
      if (b.flee && now < b.fleeTill) { if (follow(P, dt, run())) b.fleeTill = 0; return; }
      if (lightOn(P, now) && now > gh.stun && now > gh.burnCd && sees(P, gh) && Math.random() < (b.brave || .5)) { P.yaw = yawTo(gh.x - P.x, gh.z - P.z); b.wait = now + 250; b.fleeTill = 0; return; }
      const o = M.FURN.find(o => o.hide && Math.hypot(P.x - o.front[0], P.z - o.front[1]) < 4 && Math.hypot(gh.x - o.front[0], gh.z - o.front[1]) > dist(gh, P) && !plist(g).some(Q => Q.hidden === o.i));
      if (o && Math.random() < .4) { b.hideFor = o; b.goal = null; goTo(r, P, o.front[0], o.front[1], now); follow(P, dt, run()); return; }
      // نهرب لمكان بعيد بشرط أول المسار يبعدنا عن الشبح
      const d0 = dist(gh, P); let best = null;
      for (let i = 0; i < 14; i++) {
        const c = randFloor(), pa = M.path(P.x, P.z, c[0], c[1], g.open); if (!pa || pa.length < 2) continue;
        const s = pa[Math.min(2, pa.length - 1)], away = Math.hypot(s[0] - gh.x, s[1] - gh.z);
        if (away <= d0) continue;
        const score = Math.hypot(c[0] - gh.x, c[1] - gh.z) + away * 2;
        if (!best || score > best.s) best = { s: score, pa, c };
      }
      if (best) { b.path = best.pa; b.goal = best.c; b.pathAt = now; }
      b.flee = true; b.fleeTill = now + 2200; follow(P, dt, run()); return;
    }
    b.flee = false; b.hideFor = null;
    if (b.hideFor) {
      const o = b.hideFor;
      if (follow(P, dt, RUN * .9) || Math.hypot(P.x - o.front[0], P.z - o.front[1]) < USE_R) { b.hideFor = null; if (use(r, P, now)) { b.hideTill = now + 4000 + rnd(6000); H.push(r); } }
      return;
    }
    if (g.open) { goTo(r, P, M.exitPt[0], M.exitPt[1], now); follow(P, dt, RUN * .85); return; }
    if (P.bat < 25) {
      const bt = g.bats.filter(x => !x.got).sort((a, c) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(c.x - P.x, c.z - P.z))[0];
      if (bt && Math.hypot(bt.x - P.x, bt.z - P.z) < 16) { goTo(r, P, bt.x, bt.z, now); if (follow(P, dt, WALK) || Math.hypot(bt.x - P.x, bt.z - P.z) < USE_R) { use(r, P, now); H.push(r); } return; }
    }
    // البوت يدوّر: يروح لمفتاح لو شافه أو يمشي لغرفة عشوائية
    const k = g.keys.filter(k => !k.got && (k.seen || (Math.hypot(k.x - P.x, k.z - P.z) < 6 && sees(P, k)))).sort((a, c) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(c.x - P.x, c.z - P.z))[0];
    if (k) { k.seen = 1; goTo(r, P, k.x, k.z, now); if (follow(P, dt, WALK) || Math.hypot(k.x - P.x, k.z - P.z) < USE_R) { if (use(r, P, now)) H.push(r); b.goal = null; } return; }
    if (!b.path || !b.path.length) { const c = randFloor(); goTo(r, P, c[0], c[1], now); b.wait = now + rnd(900); }
    follow(P, dt, WALK);
  }
  function botGhost(r, P, dt, now) {
    const g = r.g, b = P.bot;
    if (now < P.stun || b.wait > now || now < g.wakeAt) return;
    b.face = null;
    const vis = plist(g).filter(Q => inside(Q) && Q.hidden == null && ((dist(Q, P) < GHOST_SEE || (lightOn(Q, now) && dist(Q, P) < LIGHT_SEE)) && sees(P, Q))).sort((a, c) => dist(a, P) - dist(c, P));
    const T = vis[0];
    if (T) {
      b.last = [T.x, T.z];
      if (dist(T, P) <= CATCH_R) { caught(r, P, T); b.wait = now + 2500; b.path = []; H.push(r); return; }
      if (now > P.screamAt && dist(T, P) < 10 && Math.random() < .02) { scream(r, P, now); H.push(r); }
      if (dist(T, P) < 4 && M.clear(P.x, P.z, T.x, T.z)) b.path = [[T.x, T.z]]; else goTo(r, P, T.x, T.z, now);
      follow(P, dt, GSPEED * .93); return;
    }
    if (b.last) { goTo(r, P, b.last[0], b.last[1], now); if (follow(P, dt, GSPEED * .9)) b.last = null; return; }
    const o = M.FURN.find(o => o.hide && Math.hypot(P.x - o.front[0], P.z - o.front[1]) < USE_R && o.i !== b.lastChk);
    if (o && Math.random() < .3) { b.lastChk = o.i; if (use(r, P, now)) H.push(r); b.wait = now + 700; return; }
    if (o) b.lastChk = o.i;
    if (!b.path || !b.path.length) {
      const ks = g.keys.filter(k => !k.got), c = ks.length && Math.random() < .35 ? (k => [k.x, k.z])(ks[rnd(ks.length)]) : randFloor();
      goTo(r, P, c[0], c[1], now); b.wait = now + rnd(1200);
    }
    follow(P, dt, GSPEED * .75);
  }

  // ---------- النبضة ----------
  function tick(r) {
    const g = r.g, now = Date.now(), dt = Math.min(.25, (now - g.lastTick) / 1000); g.lastTick = now;
    const ps = plist(g);
    if (g.sub === 'play') {
      if (now > g.endAt) { finish(r, 'خلص الوقت… البيت أكلهم 👻'); return H.push(r); }
      ps.forEach(P => { if (lightOn(P, now)) { P.bat = Math.max(0, P.bat - BAT_DRAIN * dt); if (!P.bat) P.fl = false; } });
      // الكشاف يحرق الشبح
      ps.filter(G => G.ghost && now > G.stun && now > G.burnCd).forEach(G => {
        const S = ps.find(S => lightOn(S, now) && inBeam(S, G));
        if (S) { G.stun = now + STUN; G.burnCd = now + STUN + BURN_CD; G.reveal = now + STUN; if (G.bot) G.bot.path = []; H.cast(r, { t: 'hev', ev: 'burn', id: G.id, by: S.id }); H.log(r, `🔦 ${name(r, S.id)} حرق الشبح بالكشاف!`); H.push(r); }
      });
      ps.forEach(P => {
        if (!P.bot || r.phase !== 'play') return;
        if (P.ghost) botGhost(r, P, dt, now); else if (inside(P)) botSurv(r, P, dt, now);
        if (inside(P) && g.open && M.at(...M.tileOf(P.x, P.z)) === 4) { escape(r, P); H.push(r); }
      });
      if (r.phase !== 'play') return;
    }
    r.players.concat(r.specs).forEach(q => {
      if (!q.online || q.bot) return;
      const V = g.P[q.id], all = !V || (!V.ghost && !inside(V));
      const a = [];
      ps.forEach(P => {
        if (P.escaped && !all) return;
        let show;
        if (P.id === q.id || all) show = true;
        else if (!P.ghost && !P.alive) show = false;
        else if (V.ghost) show = P.ghost || (P.hidden == null && sees(V, P) && (dist(V, P) < GHOST_SEE || (lightOn(P, now) && dist(V, P) < LIGHT_SEE)));
        else if (P.ghost) show = sees(V, P) && (dist(V, P) < SURV_SEE || ((now < P.reveal) && dist(V, P) < 40) || (lightOn(V, now) && dist(V, P) < BEAM_SEE && angDiff(V.yaw, yawTo(P.x - V.x, P.z - V.z)) < .55));
        else show = P.hidden == null;
        if (!show) return;
        const f = (lightOn(P, now) ? 1 : 0) | (P.ghost ? 2 : 0) | (now < P.stun ? 4 : 0) | (P.hidden != null ? 8 : 0) | (!P.alive || P.escaped ? 16 : 0) | (now < P.reveal ? 32 : 0);
        a.push([P.id, r2(P.x), r2(P.z), r2(P.yaw), f]);
      });
      const o = { t: 'hpos', a };
      if (V && !V.ghost && inside(V)) {
        const near = Math.min(99, ...ps.filter(G => G.ghost).map(G => dist(G, V)));
        o.near = Math.round(near * 2) / 2; o.bat = Math.round(V.bat); o.dark = Math.max(0, V.darkTill - now);
      }
      if (V && V.ghost) { o.stun = Math.max(0, V.stun - now); o.scr = Math.max(0, V.screamAt - now); o.burn = Math.max(0, V.burnCd - now); }
      const s = JSON.stringify(o);
      if (s !== q._pos) { q._pos = s; H.sendTo(q, o); }
    });
  }

  return {
    min: 2, max: 10,
    start(r) {
      const n = r.players.length, ids = H.shuffle(r.players.map(q => q.id));
      const nG = n >= 7 ? 2 : 1, cols = H.shuffle([...Array(10).keys()]);
      const surv = n - nG, need = Math.min(5, surv + 2);
      const now = Date.now();
      const g = r.g = { id: Math.random().toString(36).slice(2, 8), sub: 'intro', P: {}, keys: [], bats: [], need, have: 0, open: false, nG, caughtN: 0, win: null, why: '', lastTick: now };
      g.dur = Math.min(8 * 60000, 4 * 60000 + surv * 30000);
      // المفاتيح بغرف مختلفة (غير المدخل والممرات)، والبطاريات عشوائي
      const rooms = H.shuffle(M.ROOMS.map((q, i) => i).filter(i => !['المدخل', 'الممر العلوي', 'الممر السفلي'].includes(M.ROOMS[i].n)));
      rooms.slice(0, need).forEach((ri, i) => {
        const fl = M.floors.filter(([x, y]) => M.ROOMS[ri] === M.ROOMS[M.roomIdx(...M.center(x, y))]);
        const [x, y] = fl[rnd(fl.length)], c = M.center(x, y);
        g.keys.push({ id: i, x: c[0], z: c[1], got: null });
      });
      const used = new Set(g.keys.map(k => k.x + ',' + k.z));
      for (let i = 0; g.bats.length < 6 && i < 200; i++) { const c = randFloor(); if (used.has(c[0] + ',' + c[1]) || Math.hypot(c[0] - M.spawn[0], c[1] - M.spawn[1]) < 6) continue; used.add(c[0] + ',' + c[1]); g.bats.push({ id: g.bats.length, x: c[0], z: c[1], got: null }); }
      r.players.forEach((q, i) => {
        const ghost = ids.indexOf(q.id) < nG;
        const P = g.P[q.id] = { id: q.id, c: cols[i], ghost, alive: true, caught: false, escaped: false, hidden: null, x: 0, z: 0, yaw: 0, fl: !ghost, bat: 100, darkTill: 0, stun: 0, burnCd: 0, reveal: 0, screamAt: now + INTRO + 15000, checkAt: 0, lastMv: now,
          bot: q.bot ? { path: [], goal: null, wait: 0, brave: .35 + Math.random() * .4 } : null };
        if (ghost) { const k = ids.indexOf(q.id); P.x = M.ghostSpawn[0] - k * 1.2; P.z = M.ghostSpawn[1]; P.yaw = Math.PI / 2; }
        else { const k = i % 8, a = k / 8 * Math.PI * 2; P.x = M.spawn[0] + Math.cos(a) * 1.4; P.z = M.spawn[1] + Math.sin(a) * 1.4; P.yaw = 0; }
      });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      r.players.forEach(q => { q._pos = null; });
      plist(g).forEach(P => snap(r, P));
      H.log(r, nG > 1 ? 'فيه شبحين بالبيت 👻👻' : 'فيه شبح بالبيت 👻');
      H.setTimer(r, INTRO, () => { g.sub = 'play'; g.endAt = Date.now() + g.dur; g.wakeAt = Date.now() + WAKE; g.lastTick = Date.now(); plist(g).forEach(P => { P.lastMv = Date.now(); }); });
      clearInterval(g.iv);
      g.iv = setInterval(() => { if (r.g !== g || r.phase !== 'play' || !H.alive(r)) return clearInterval(g.iv); tick(r); }, 100);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return 'quiet';
      const P = g.P[p.id]; if (!P) return 'quiet';
      const now = Date.now();
      if (m.t === 'mv') {
        if (g.sub !== 'play') return 'quiet';
        if (isFinite(+m.yaw)) P.yaw = +m.yaw;
        if (!P.ghost) P.fl = !!m.fl;
        if (P.hidden != null) return 'quiet';
        const x = +m.x, z = +m.z; if (!isFinite(x) || !isFinite(z)) return 'quiet';
        const free = !P.ghost && !inside(P);
        const dt = Math.min(400, Math.max(0, now - P.lastMv)), sp = free ? 9 : P.ghost ? GSPEED : RUN, max = sp * dt / 1000 * 1.4 + .6;
        if ((P.ghost && (now < P.stun || now < g.wakeAt)) || Math.hypot(x - P.x, z - P.z) > max || !M.walk(x, z, free, g.open && !P.ghost)) { P.lastMv = now; snap(r, P); return 'quiet'; }
        P.x = x; P.z = z; P.lastMv = now;
        if (inside(P) && g.open && M.at(...M.tileOf(x, z)) === 4) { escape(r, P); return; }
        return 'quiet';
      }
      if (g.sub !== 'play') return 'quiet';
      if (m.t === 'use') return use(r, P, now) ? undefined : 'quiet';
      if (m.t === 'scream') return scream(r, P, now) ? undefined : 'quiet';
      if (m.t === 'catch') {
        const T = g.P[m.id];
        if (!P.ghost || now < P.stun || now < g.wakeAt || !T || !inside(T) || T.hidden != null || dist(P, T) > CATCH_R || !sees(P, T)) return 'quiet';
        caught(r, P, T); return;
      }
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const now = Date.now(), P = g.P[p.id];
      const ps = plist(g);
      return {
        id: g.id, sub: g.sub, need: g.need, have: g.have, open: g.open, nG: g.nG,
        wakeIn: g.sub === 'play' ? Math.max(0, g.wakeAt - now) : WAKE,
        endIn: g.sub === 'play' ? Math.max(0, g.endAt - now) : g.dur,
        me: P ? { c: P.c, ghost: P.ghost, alive: P.alive, caught: P.caught, escaped: P.escaped, hidden: P.hidden } : null,
        col: Object.fromEntries(ps.map(x => [x.id, x.c])),
        ghosts: ps.filter(x => x.ghost).map(x => x.id),
        caught: ps.filter(x => x.caught).map(x => x.id), esc: ps.filter(x => x.escaped).map(x => x.id),
        keys: g.keys.filter(k => !k.got).map(k => [k.id, k.x, k.z]),
        bats: g.bats.filter(b => !b.got).map(b => [b.id, b.x, b.z]),
        win: g.win, why: g.why
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || !g.P[p.id]) return;
      if (g.P[p.id].ghost) H.log(r, `${p.name} (الشبح) طلع`);
      delete g.P[p.id];
      checkEnd(r);
    }
  };
};
