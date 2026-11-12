// القصر المسكون (ثري دي): شبح (أو اثنين) ضد ناجين، بقصر من ٤ طوابق.
// المراحل: ١) الفيوزات الثلاث لصندوق الكهرباء بالقبو ٢) المفاتيح: مكتب الجد ← الغرفة الكبيرة ← العلّية
// ٣) أربع قطع ملعونة للمذبح بالعلّية + طقس (بعد ما ترجع الكهرباء) ٤) الباب الأمامي ينفتح وتهربون.
// اللي يمسكه الشبح أول مرة ينحبس بالقفص في القبو وربعه يقدرون يطلّعونه، والمرة الثانية يموت.
// الحركة مباشرة: المتصفح يرسل مكانه والسيرفر يتحقق (السرعة + الجدران + الأثاث + الدرج).
const M = require('../public/haunt-map');
try { M.setSizes(require('../public/haunt/props/props.json')); } catch (e) { console.warn('haunt props', e.message); }
const WALK = 3.4, RUN = 5.8, GSPEED = 4.6, CATCH_R = 1.6, USE_R = 1.9;
const BEAM_R = 10, BEAM_ANG = .3, STUN = 2600, BURN_CD = 9000;
const SCREAM_R = 13, SCREAM_CD = 25000, DARK_MS = 4000, CHECK_CD = 2000, MIRROR_CD = 30000;
const BAT_DRAIN = 100 / 240, BAT_PICK = 60, INTRO = 6500, WAKE = +process.env.HAUNT_WAKE || 20000;
const SELF_FREE = 75000;
const HOLD = { fuse: 3000, relic: 2500, ritual: 12000, rescue: 3000, unlock: 1200 };
const LOCKS = { study: 'مكتب الجد', master: 'الغرفة الكبيرة', attic: 'العلّية' };
const RELICS = ['دمية مكسورة', 'صورة العائلة', 'الشمعة السودا', 'كتاب الطقوس'];
const rnd = n => Math.random() * n | 0;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const yawTo = (dx, dz) => Math.atan2(-dx, -dz);
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };
const r2 = v => Math.round(v * 100) / 100;
const FUSEBOX = M.PROPS.find(p => p.fuse), ALTAR = M.PROPS.find(p => p.altar), CAGE = M.PROPS.find(p => p.cage);
const MIRRORS = M.PROPS.filter(p => p.mirror), WARDS = M.PROPS.filter(p => p.hide);
// قدّام الدولاب / المراية
const front = p => { const a = -(p.r || 0) * Math.PI / 2, d = (p.d || .6) / 2 + .7; return { lv: p.lv, x: p.x + Math.sin(a) * d, z: p.z + Math.cos(a) * d }; };
WARDS.forEach(p => { p.f = front(p); }); MIRRORS.forEach(p => { p.f = front(p); });

module.exports = H => {
  const plist = g => Object.values(g.P);
  const human = (r, id) => { const q = r.players.find(x => x.id === id); return q && !q.bot ? q : null; };
  const tell = (r, id, o) => { const q = human(r, id); if (q) H.sendTo(q, o); };
  const name = (r, id) => (r.players.find(q => q.id === id) || {}).name || '؟';
  const free = P => !P.ghost && P.alive && !P.escaped && !P.trapped;
  const ALL = new Set(Object.keys(LOCKS));
  const opt = (g, P) => P && P.ghost ? { open: ALL, exitOpen: false } : { open: g.open, exitOpen: g.exitOpen };
  const sees = (g, a, b) => a.lv === b.lv && M.see(a.lv, a.x, a.z, b.x, b.z, opt(g));
  const snap = (r, P) => tell(r, P.id, { t: 'hsnap', x: P.x, z: P.z, yaw: P.yaw, lv: P.lv });
  const lightOn = (P, now) => P.fl && P.bat > 0 && now > P.darkTill && P.hidden == null && free(P);
  const inBeam = (g, S, G) => { const d = dist(S, G); if (S.lv !== G.lv || d > BEAM_R || d < .2) return false; return angDiff(S.yaw, yawTo(G.x - S.x, G.z - S.z)) < BEAM_ANG + Math.atan2(.45, d) && sees(g, S, G); };
  const near = (a, lv, x, z, rr) => a.lv === lv && Math.hypot(a.x - x, a.z - z) <= rr;
  const gspeed = g => GSPEED * (g.ritualDone ? .85 : g.power ? 1.06 : 1);

  function objective(g) {
    if (g.exitOpen) return { k: 'escape', t: 'اهربوا من الباب الأمامي!' };
    if (g.ritual) return { k: 'ritual', t: 'الطقس شغّال… احموا اللي عند المذبح' };
    if (!g.power) return { k: 'fuse', t: `رجّعوا الكهرباء: دوّروا الفيوزات (${g.fuseIn + g.team.fuse}/3) وركّبوها بصندوق الكهرباء في القبو`, n: g.fuseIn, of: 3 };
    if (g.relicsIn < 4) return { k: 'relics', t: `حطّوا القطع الملعونة على المذبح بالعلّية (${g.relicsIn + g.team.relics}/4)`, n: g.relicsIn, of: 4 };
    return { k: 'ritual0', t: 'كل القطع على المذبح… ابدأوا الطقس بالعلّية' };
  }
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
    if (!surv.some(P => free(P) || P.trapped)) {
      const esc = surv.filter(P => P.escaped).length;
      finish(r, esc ? `هرب ${esc} من ${surv.length}` : 'الشبح مسك الكل 👻'); return true;
    }
    return false;
  }
  function caught(r, G, P, how) {
    const g = r.g, now = Date.now();
    P.hidden = null; P.fl = false; P.hold = null; G.hold = null;
    H.cast(r, { t: 'hev', ev: 'caught', id: P.id, by: G.id, x: r2(P.x), z: r2(P.z), lv: P.lv, how: how || '' });
    if (P.strikes >= 1) { P.alive = false; H.log(r, `💀 ${name(r, G.id)} قتل ${name(r, P.id)}`); }
    else {
      P.strikes = 1; P.trapped = true; P.trapAt = now;
      const a = Math.random() * 6.28; P.lv = CAGE.lv; P.x = CAGE.x + Math.cos(a) * .4; P.z = CAGE.z + Math.sin(a) * .4;
      H.log(r, `👻 ${name(r, G.id)} مسك ${name(r, P.id)} وحبسه بالقفص في القبو`);
    }
    if (g.ritual && g.ritual.by === P.id) { g.ritual = null; H.log(r, '🕯️ الطقس انقطع!'); }
    snap(r, P); G.catchAt = now; checkEnd(r);
  }
  function escape(r, P) { P.escaped = true; P.fl = false; P.hold = null; H.log(r, `🚪 ${name(r, P.id)} هرب من القصر!`); H.cast(r, { t: 'hev', ev: 'esc', id: P.id }); checkEnd(r); }

  // ---------- الاستخدام (E) ----------
  function use(r, P, now) {
    const g = r.g;
    if (P.ghost) {
      if (now < P.stun || now < g.wakeAt) return false;
      const w = WARDS.find(o => near(P, o.f.lv, o.f.x, o.f.z, USE_R + .4));
      if (w && now - P.checkAt > CHECK_CD) {
        P.checkAt = now; const T = plist(g).find(Q => Q.hidden === w.i);
        H.cast(r, { t: 'hev', ev: 'ward', f: w.i });
        if (T) caught(r, P, T, 'ward'); else tell(r, P.id, { t: 'hev', ev: 'empty' });
        return true;
      }
      const m = MIRRORS.find(o => near(P, o.f.lv, o.f.x, o.f.z, USE_R + .4));
      if (m && now > P.mirrorAt) {
        const others = MIRRORS.filter(o => o !== m), to = others[rnd(others.length)];
        P.mirrorAt = now + MIRROR_CD; H.cast(r, { t: 'hev', ev: 'mirror', a: m.i, b: to.i, id: P.id });
        P.lv = to.f.lv; P.x = to.f.x; P.z = to.f.z; P.yaw = yawTo(to.f.x - to.x, to.f.z - to.z); P.lastMv = now; snap(r, P); return true;
      }
      return false;
    }
    if (!free(P)) return false;
    if (P.hidden != null) { const w = M.PROPS[P.hidden]; P.hidden = null; P.lv = w.f.lv; P.x = w.f.x; P.z = w.f.z; P.lastMv = now; snap(r, P); H.cast(r, { t: 'hev', ev: 'ward', f: w.i }); return true; }
    // التقاط
    const it = g.items.find(i => !i.got && near(P, i.lv, i.x, i.z, USE_R));
    if (it) {
      it.got = P.id;
      if (it.k === 'bat') { P.bat = Math.min(100, P.bat + BAT_PICK); tell(r, P.id, { t: 'hev', ev: 'bat' }); return true; }
      if (P.bot) P.bot.carry = (P.bot.carry || 0) + 1;
      if (it.k === 'fuse') g.team.fuse++;
      if (it.k === 'key') g.team.keys.push(it.sub);
      if (it.k === 'relic') g.team.relics++;
      H.cast(r, { t: 'hev', ev: 'pick', id: P.id, k: it.k, sub: it.sub });
      H.log(r, `${name(r, P.id)} لقى ${it.k === 'fuse' ? 'فيوز ⚡' : it.k === 'key' ? 'مفتاح ' + LOCKS[it.sub] + ' 🔑' : RELICS[it.sub] + ' 🕯️'}`);
      return true;
    }
    // باب مقفل
    const d = M.DOORS.find(d => d.lock && !g.open.has(d.lock) && near(P, d.lv, (d.x + .5) * M.T, (d.y + .5) * M.T, 2.4));
    if (d) { if (g.team.keys.includes(d.lock)) { P.hold = { k: 'unlock', t0: now, lock: d.lock, lv: P.lv, x: P.x, z: P.z }; return true; } tell(r, P.id, { t: 'hev', ev: 'locked', lock: d.lock }); return false; }
    // صندوق الكهرباء
    if (!g.power && near(P, FUSEBOX.lv, FUSEBOX.x, FUSEBOX.z + .3, 2.2)) { if (g.team.fuse > 0) { P.hold = { k: 'fuse', t0: now, lv: P.lv, x: P.x, z: P.z }; return true; } tell(r, P.id, { t: 'hev', ev: 'need', what: 'fuse' }); return false; }
    // المذبح
    if (near(P, ALTAR.lv, ALTAR.x, ALTAR.z, 2.6)) {
      if (g.team.relics > 0) { P.hold = { k: 'relic', t0: now, lv: P.lv, x: P.x, z: P.z }; return true; }
      if (g.relicsIn >= 4 && !g.ritualDone && !g.ritual) {
        if (!g.power) { tell(r, P.id, { t: 'hev', ev: 'need', what: 'power' }); return false; }
        P.hold = { k: 'ritual', t0: now, lv: P.lv, x: P.x, z: P.z }; g.ritual = { by: P.id, t0: now }; H.cast(r, { t: 'hev', ev: 'ritual', id: P.id }); H.log(r, `🕯️ ${name(r, P.id)} بدأ الطقس…`); return true;
      }
      tell(r, P.id, { t: 'hev', ev: 'need', what: 'relic' }); return false;
    }
    // القفص: نطلّع المحبوسين
    if (plist(g).some(Q => Q.trapped) && near(P, CAGE.lv, CAGE.x, CAGE.z, 2.4)) { P.hold = { k: 'rescue', t0: now, lv: P.lv, x: P.x, z: P.z }; return true; }
    // دولاب
    const w = WARDS.find(o => near(P, o.f.lv, o.f.x, o.f.z, USE_R + .3) && !plist(g).some(Q => Q.hidden === o.i));
    if (w) { P.hidden = w.i; P.lv = w.lv; P.x = w.x; P.z = w.z; P.yaw = -(w.r || 0) * Math.PI / 2 + Math.PI; P.hold = null; snap(r, P); H.cast(r, { t: 'hev', ev: 'ward', f: w.i }); return true; }
    return false;
  }
  function holdDone(r, P, now) {
    const g = r.g, h = P.hold; P.hold = null;
    if (P.bot) P.bot.carry = 0;
    if (h.k === 'unlock') { g.open.add(h.lock); H.cast(r, { t: 'hev', ev: 'unlock', lock: h.lock, id: P.id }); H.log(r, `🔓 ${name(r, P.id)} فتح ${LOCKS[h.lock]}`); }
    else if (h.k === 'fuse') {
      g.fuseIn += g.team.fuse; g.team.fuse = 0; H.cast(r, { t: 'hev', ev: 'fuse', n: g.fuseIn });
      if (g.fuseIn >= 3) { g.power = true; H.cast(r, { t: 'hev', ev: 'power' }); H.log(r, '⚡ الكهرباء رجعت!… والشبح عصّب'); }
    }
    else if (h.k === 'relic') { g.relicsIn += g.team.relics; g.team.relics = 0; H.cast(r, { t: 'hev', ev: 'relic', n: g.relicsIn }); H.log(r, `🕯️ صار على المذبح ${g.relicsIn}/4`); }
    else if (h.k === 'ritual') { g.ritual = null; g.ritualDone = true; g.exitOpen = true; H.cast(r, { t: 'hev', ev: 'ritualDone' }); H.log(r, '🔥 الطقس خلص! الشبح ضعف والباب الأمامي انفتح… اهربوا'); }
    else if (h.k === 'rescue') { plist(g).filter(Q => Q.trapped).forEach(Q => { Q.trapped = false; Q.lastMv = now; Q.x = CAGE.x + 1.3; Q.z = CAGE.z; snap(r, Q); tell(r, Q.id, { t: 'hev', ev: 'freed', by: P.id }); }); H.cast(r, { t: 'hev', ev: 'rescue', id: P.id }); H.log(r, `🗝️ ${name(r, P.id)} طلّع المحبوسين من القفص`); }
    H.push(r);
  }
  function scream(r, P, now) {
    const g = r.g;
    if (!P.ghost || now < P.stun || now < P.screamAt || now < g.wakeAt) return false;
    P.screamAt = now + SCREAM_CD; P.reveal = now + 1500;
    plist(g).forEach(Q => { if (free(Q) && Q.lv === P.lv && dist(Q, P) <= SCREAM_R) Q.darkTill = now + DARK_MS; });
    H.cast(r, { t: 'hev', ev: 'scream', id: P.id, x: r2(P.x), z: r2(P.z), lv: P.lv });
    return true;
  }

  // ---------- البوتات ----------
  function follow(r, P, dt, speed) {
    const b = P.bot; let step = speed * dt;
    while (step > 0 && b.path && b.path.length) {
      const [l, tx, tz] = b.path[0], d = Math.hypot(tx - P.x, tz - P.z);
      if (d > .05) P.yaw = b.face != null ? b.face : yawTo(tx - P.x, tz - P.z);
      if (d <= step) { P.x = tx; P.z = tz; P.lv = l; step -= d; b.path.shift(); }
      else { P.x += (tx - P.x) / d * step; P.z += (tz - P.z) / d * step; P.lv = M.levelAfter(P.lv, P.x, P.z); step = 0; }
    }
    if (!P.ghost && free(P) && r.g.exitOpen && M.at(P.lv, Math.floor(P.x / M.T), Math.floor(P.z / M.T)) === 6) escape(r, P);
    return !b.path || !b.path.length;
  }
  function goTo(r, P, lv, x, z, now) {
    const b = P.bot;
    if (b.goal && b.goal[0] === lv && Math.hypot(b.goal[1] - x, b.goal[2] - z) < .5 && b.path && b.path.length && now - b.pathAt < 2000) return true;
    b.goal = [lv, x, z]; b.pathAt = now; b.path = M.path(P.lv, P.x, P.z, lv, x, z, opt(r.g, P)) || [];
    return b.path.length > 0;
  }
  const randFloor = () => { const [l, x, y] = M.floors[rnd(M.floors.length)]; const [cx, cz] = M.center(x, y); return [l, cx, cz]; };
  function botSurv(r, P, dt, now) {
    const g = r.g, b = P.bot;
    if (P.trapped || !free(P) && P.hidden == null) return;
    if (P.hidden != null) { if (now > b.hideTill) { use(r, P, now); b.path = []; } return; }
    if (P.hold) return;
    b.stam = Math.min(100, (b.stam ?? 100) + dt * 14);
    const run = () => { if (b.stam > 5 && !b.tired) { b.stam -= dt * 35; if (b.stam <= 5) b.tired = true; return RUN * .9; } if (b.stam > 30) b.tired = false; return WALK; };
    const gh = plist(g).filter(G => G.ghost && G.lv === P.lv && now > g.wakeAt && (dist(G, P) < 9 || (dist(G, P) < 13 && sees(g, G, P)))).sort((a, c) => dist(a, P) - dist(c, P))[0];
    if (!gh && b.wait > now) return;
    b.face = null; if (now > (b.flAt || 0)) { b.flAt = now + 4000 + rnd(6000); b.fl = Math.random() < .55; } P.fl = P.bat > 0 && (b.fl || !!gh);
    if (gh) {
      if (b.flee && now < b.fleeTill) { if (follow(r, P, dt, run())) b.fleeTill = 0; return; }
      if (lightOn(P, now) && now > gh.stun && now > gh.burnCd && sees(g, P, gh) && Math.random() < (b.brave || .5)) { P.yaw = yawTo(gh.x - P.x, gh.z - P.z); b.wait = now + 250; return; }
      const w = WARDS.find(o => near(P, o.f.lv, o.f.x, o.f.z, 4) && Math.hypot(gh.x - o.f.x, gh.z - o.f.z) > dist(gh, P) && !plist(g).some(Q => Q.hidden === o.i));
      if (w && Math.random() < .35) { if (goTo(r, P, w.f.lv, w.f.x, w.f.z, now)) { b.hideFor = w; b.flee = true; b.fleeTill = now + 3000; return; } }
      const d0 = dist(gh, P); let best = null;
      for (let i = 0; i < 12; i++) {
        const c = randFloor(), pa = M.path(P.lv, P.x, P.z, c[0], c[1], c[2], opt(g)); if (!pa || pa.length < 2) continue;
        const s = pa[Math.min(2, pa.length - 1)], away = s[0] !== gh.lv ? 99 : Math.hypot(s[1] - gh.x, s[2] - gh.z);
        if (away <= d0) continue;
        const score = (c[0] !== gh.lv ? 30 : Math.hypot(c[1] - gh.x, c[2] - gh.z)) + away * 2;
        if (!best || score > best.s) best = { s: score, pa, c };
      }
      if (best) { b.path = best.pa; b.goal = best.c; b.pathAt = now; }
      b.flee = true; b.fleeTill = now + 2200; follow(r, P, dt, run()); return;
    }
    if (b.hideFor) { const w = b.hideFor; if (follow(r, P, dt, run()) || near(P, w.f.lv, w.f.x, w.f.z, USE_R)) { b.hideFor = null; if (use(r, P, now)) { b.hideTill = now + 4000 + rnd(6000); H.push(r); } } return; }
    b.flee = false;
    // الهدف الحالي
    let tgt = null;
    const trapped = plist(g).some(Q => Q.trapped);
    if (g.exitOpen) tgt = { lv: M.exitPt[0], x: M.exitPt[1], z: M.exitPt[2], k: 'exit' };
    else if (trapped && (b.k % 2 === 0 || plist(g).filter(free).length <= 2)) tgt = { lv: CAGE.lv, x: CAGE.x + 1.3, z: CAGE.z, k: 'use', r: 2.2 };
    else if (g.team.fuse > 0 && !g.power && (b.carry || g.team.fuse + g.fuseIn >= 3 && b.k % 3 === 0)) tgt = { lv: FUSEBOX.lv, x: FUSEBOX.x, z: FUSEBOX.z + 1.1, k: 'use', r: 2 };
    else if (g.team.relics > 0 && g.open.has('attic') && (b.carry || b.k % 3 === 1)) tgt = { lv: ALTAR.lv, x: ALTAR.x, z: ALTAR.z + 1.6, k: 'use', r: 2.4 };
    else if (g.relicsIn >= 4 && g.power && !g.ritualDone && !g.ritual) tgt = { lv: ALTAR.lv, x: ALTAR.x, z: ALTAR.z + 1.6, k: 'use', r: 2.4 };
    else {
      const lock = Object.keys(LOCKS).find(l => g.team.keys.includes(l) && !g.open.has(l));
      if (lock) {
        const d = M.DOORS.find(d => d.lock === lock), [dx, dz] = M.center(d.x, d.y);
        const side = [[0, 2], [0, -2], [2, 0], [-2, 0]].map(([a, c]) => [dx + a, dz + c]).find(([x, z]) => M.walk(d.lv, x, z, opt(g)) && M.path(P.lv, P.x, P.z, d.lv, x, z, opt(g)));
        if (side) tgt = { lv: d.lv, x: side[0], z: side[1], k: 'use', r: 1.2 };
      }
    }
    if (!tgt) {
      const it = g.items.filter(i => !i.got && (i.k !== 'bat' || P.bat < 40) && (i.seen || (i.lv === P.lv && Math.hypot(i.x - P.x, i.z - P.z) < 10 && sees(g, P, i)))).map(i => ({ i, p: M.path(P.lv, P.x, P.z, i.lv, i.x, i.z, opt(g)) })).filter(o => o.p).sort((a, c) => a.p.length - c.p.length)[0];
      if (it) { it.i.seen = 1; tgt = { lv: it.i.lv, x: it.i.x, z: it.i.z, k: 'use', r: 1.6 }; }
    }
    if (tgt) {
      const ok = goTo(r, P, tgt.lv, tgt.x, tgt.z, now);
      if (!ok && !near(P, tgt.lv, tgt.x, tgt.z, tgt.r || 1)) { b.wait = now + 800; return; }
      if (follow(r, P, dt, tgt.k === 'exit' ? run() : WALK) || near(P, tgt.lv, tgt.x, tgt.z, tgt.r || 1)) { if (tgt.k === 'use') { use(r, P, now); b.wait = now + 400; H.push(r); } b.path = []; }
      return;
    }
    // استكشاف: الغرف اللي ما زارها (الأقرب أول)
    if (!b.path || !b.path.length || !b.explore) {
      b.visited = b.visited || new Set();
      const here = M.roomOf(P.lv, P.x, P.z); if (here) b.visited.add(here.i);
      let cand = M.ROOMS.filter(rm => !b.visited.has(rm.i) && !rm.hall);
      if (!cand.length) { b.visited.clear(); cand = M.ROOMS.filter(rm => !rm.hall); }
      cand = H.shuffle(cand).slice(0, 6).map(rm => { const fl = M.floors.filter(([l, x, y]) => l === rm.lv && x >= rm.x && x < rm.x + rm.w && y >= rm.y && y < rm.y + rm.h); if (!fl.length) return null; const [l, x, y] = fl[rnd(fl.length)], [cx, cz] = M.center(x, y), pa = M.path(P.lv, P.x, P.z, l, cx, cz, opt(g)); return pa ? { rm, pa, c: [l, cx, cz] } : null; }).filter(Boolean).sort((a, c) => a.pa.length - c.pa.length);
      if (cand[0]) { b.path = cand[0].pa; b.goal = cand[0].c; b.pathAt = now; b.explore = cand[0].rm.i; }
      else { const c = randFloor(); goTo(r, P, c[0], c[1], c[2], now); b.wait = now + rnd(700); }
    }
    const here = M.roomOf(P.lv, P.x, P.z);
    if (here) { (b.visited = b.visited || new Set()).add(here.i); g.items.forEach(i => { if (!i.got && i.lv === P.lv && M.roomOf(i.lv, i.x, i.z) === here) i.seen = 1; }); }
    if (follow(r, P, dt, WALK)) b.explore = null;
  }
  function botGhost(r, P, dt, now) {
    const g = r.g, b = P.bot;
    if (now < P.stun || b.wait > now || now < g.wakeAt) return;
    b.face = null;
    const vis = plist(g).filter(Q => free(Q) && Q.hidden == null && Q.lv === P.lv && !(b.ign && b.ign.id === Q.id && now < b.ign.till) && (dist(Q, P) < (g.power ? 8 : 5) || (lightOn(Q, now) && dist(Q, P) < 10)) && sees(g, P, Q)).sort((a, c) => dist(a, P) - dist(c, P));
    const T = vis[0];
    if (T) {
      // البوت يمل لو طارد نفس الشخص كثير (عشان البوتات تقدر تكمّل المهمات)
      if (!b.chase || b.chase.id !== T.id) b.chase = { id: T.id, t0: now };
      if (now - b.chase.t0 > 9000) { b.ign = { id: T.id, till: now + 14000 }; b.chase = null; b.last = null; b.path = []; b.wait = now + 1500; return; }
      b.last = [T.lv, T.x, T.z];
      if (dist(T, P) <= CATCH_R) { caught(r, P, T); b.wait = now + 6000; b.path = []; H.push(r); return; }
      if (now > P.screamAt && dist(T, P) < 9 && Math.random() < .02) { scream(r, P, now); H.push(r); }
      if (dist(T, P) < 4 && M.see(P.lv, P.x, P.z, T.x, T.z, opt(g))) b.path = [[T.lv, T.x, T.z]]; else goTo(r, P, T.lv, T.x, T.z, now);
      follow(r, P, dt, gspeed(g) * .72); return;
    }
    if (b.last) { goTo(r, P, ...b.last, now); if (follow(r, P, dt, gspeed(g) * .9)) b.last = null; return; }
    const w = WARDS.find(o => near(P, o.f.lv, o.f.x, o.f.z, USE_R) && o.i !== b.lastChk);
    if (w) { b.lastChk = w.i; if (Math.random() < .35) { if (use(r, P, now)) H.push(r); b.wait = now + 700; return; } }
    if (!b.path || !b.path.length) {
      // يدوريات: الأماكن المهمة أو عشوائي، وأحياناً يحرس القفص
      const spots = [[FUSEBOX.lv, FUSEBOX.x, FUSEBOX.z + 1.2], [ALTAR.lv, ALTAR.x, ALTAR.z + 1.6], ...g.items.filter(i => !i.got && i.k !== 'bat').map(i => [i.lv, i.x, i.z])];
      const c = Math.random() < .45 ? spots[rnd(spots.length)] : randFloor();
      goTo(r, P, c[0], c[1], c[2], now); b.wait = now + rnd(1500);
    }
    follow(r, P, dt, gspeed(g) * .6);
  }

  // ---------- النبضة ----------
  function tick(r) {
    const g = r.g, now = Date.now(), dt = Math.min(.25, (now - g.lastTick) / 1000); g.lastTick = now;
    const ps = plist(g);
    if (g.sub === 'play') {
      if (now > g.endAt) { finish(r, 'خلص الوقت… القصر أكلهم 👻'); return H.push(r); }
      ps.forEach(P => { if (lightOn(P, now)) { P.bat = Math.max(0, P.bat - BAT_DRAIN * dt); if (!P.bat) P.fl = false; } });
      // المحبوس يفك نفسه بعد فترة
      ps.forEach(P => { if (P.trapped && now - P.trapAt > SELF_FREE) { P.trapped = false; P.lastMv = now; P.x = CAGE.x + 1.3; P.z = CAGE.z; snap(r, P); tell(r, P.id, { t: 'hev', ev: 'freed', by: P.id }); H.log(r, `🔓 ${name(r, P.id)} كسر القفص وطلع`); H.push(r); } });
      // الإمساك المستمر (فيوز، مذبح، إنقاذ…): لازم يبقى بمكانه
      ps.forEach(P => {
        if (!P.hold) return;
        if (!free(P) || Math.hypot(P.x - P.hold.x, P.z - P.hold.z) > .8 || P.lv !== P.hold.lv) { if (P.hold.k === 'ritual' && g.ritual && g.ritual.by === P.id) { g.ritual = null; H.cast(r, { t: 'hev', ev: 'ritualStop' }); } P.hold = null; H.push(r); return; }
        if (now - P.hold.t0 >= HOLD[P.hold.k]) holdDone(r, P, now);
      });
      // الكشاف يحرق الشبح
      ps.filter(G => G.ghost && now > G.stun && now > G.burnCd && now > g.wakeAt).forEach(G => {
        const S = ps.find(S => lightOn(S, now) && inBeam(g, S, G));
        if (S) { const st = g.ritualDone ? STUN * 1.5 : STUN; G.stun = now + st; G.burnCd = now + st + BURN_CD; G.reveal = now + st; G.hold = null; if (G.bot) G.bot.path = []; H.cast(r, { t: 'hev', ev: 'burn', id: G.id, by: S.id }); H.log(r, `🔦 ${name(r, S.id)} حرق الشبح بالكشاف!`); H.push(r); }
      });
      ps.forEach(P => { if (!P.bot || r.phase !== 'play') return; if (P.ghost) botGhost(r, P, dt, now); else botSurv(r, P, dt, now); });
      if (r.phase !== 'play') return;
      if (now - (g.pushAt || 0) > 1000) { g.pushAt = now; H.push(r); } // الوقت والإمساك
    }
    r.players.concat(r.specs).forEach(q => {
      if (!q.online || q.bot) return;
      const V = g.P[q.id], all = !V || (!V.ghost && (!V.alive || V.escaped));
      const a = [];
      ps.forEach(P => {
        if (P.escaped && !all) return;
        let show;
        if (P.id === q.id || all) show = true;
        else if (!P.ghost && !P.alive) show = false;
        else if (V.ghost) show = P.ghost || (P.hidden == null && (P.trapped || (P.lv === V.lv && sees(g, V, P) && (dist(V, P) < (g.power ? 14 : 8) || (lightOn(P, now) && dist(V, P) < 16)))));
        else if (P.ghost) show = P.lv === V.lv && sees(g, V, P) && (dist(V, P) < (g.power ? 12 : 6) || ((now < P.reveal) && dist(V, P) < 40) || (lightOn(V, now) && dist(V, P) < 15 && angDiff(V.yaw, yawTo(P.x - V.x, P.z - V.z)) < .55));
        else show = P.hidden == null;
        if (!show) return;
        const f = (lightOn(P, now) ? 1 : 0) | (P.ghost ? 2 : 0) | (now < P.stun ? 4 : 0) | (P.hidden != null ? 8 : 0) | (!P.alive || P.escaped ? 16 : 0) | (now < P.reveal ? 32 : 0) | (P.trapped ? 64 : 0) | (P.hold ? 128 : 0);
        a.push([P.id, r2(P.x), r2(P.z), r2(P.yaw), f, P.lv]);
      });
      const o = { t: 'hpos', a };
      if (V && !V.ghost && free(V)) {
        const nr = Math.min(99, ...ps.filter(G => G.ghost && G.lv === V.lv).map(G => dist(G, V)));
        o.near = Math.round(nr * 2) / 2; o.bat = Math.round(V.bat); o.dark = Math.max(0, V.darkTill - now);
      }
      if (V && V.ghost) { o.stun = Math.max(0, V.stun - now); o.scr = Math.max(0, V.screamAt - now); o.mir = Math.max(0, V.mirrorAt - now); }
      if (V && V.hold) o.hold = [V.hold.k, now - V.hold.t0, HOLD[V.hold.k]];
      const s = JSON.stringify(o);
      if (s !== q._pos) { q._pos = s; H.sendTo(q, o); }
    });
  }

  function spawnItems(g) {
    const used = new Set();
    const roomsBy = f => M.ROOMS.filter(f);
    const pick = (rm, k, sub) => {
      const fl = M.floors.filter(([l, x, y]) => { const [cx, cz] = M.center(x, y), rr = M.roomOf(l, cx, cz); return rr === rm && !used.has(l + ':' + x + ':' + y); });
      if (!fl.length) return;
      const [l, x, y] = fl[rnd(fl.length)], [cx, cz] = M.center(x, y); used.add(l + ':' + x + ':' + y);
      g.items.push({ id: g.items.length, k, sub, lv: l, x: cx + (Math.random() - .5) * .4, z: cz + (Math.random() - .5) * .4, got: null });
    };
    const lockedRoom = rm => (rm.lv === 1 && rm.k === 'study') || (rm.lv === 2 && rm.k === 'master') || (rm.lv === 2 && rm.k === 'toys') || rm.lv === 3;
    const open = roomsBy(rm => !rm.hall && !lockedRoom(rm) && rm.k !== 'cage' && rm.k !== 'boiler');
    const sh = H.shuffle(open.slice());
    pick(sh[0], 'fuse'); pick(sh[1], 'fuse'); pick(sh[2], 'fuse');
    pick(sh[3], 'key', 'study');
    const study = M.ROOMS.find(rm => rm.k === 'study'), master = M.ROOMS.find(rm => rm.k === 'master'), wine = M.ROOMS.find(rm => rm.k === 'wine');
    pick(study, 'key', 'master'); pick(master, 'key', 'attic');
    pick(master, 'relic', 0); pick(study, 'relic', 1); pick(wine, 'relic', 2); pick(sh[4], 'relic', 3);
    for (let i = 0; i < 14; i++) pick(sh[5 + i % (sh.length - 5)], 'bat');
  }

  return {
    min: 2, max: 10,
    start(r) {
      const n = r.players.length, ids = H.shuffle(r.players.map(q => q.id));
      const nG = n >= 7 ? 2 : 1, cols = H.shuffle([...Array(10).keys()]);
      const now = Date.now(), surv = n - nG;
      const g = r.g = { id: Math.random().toString(36).slice(2, 8), sub: 'intro', P: {}, items: [], team: { fuse: 0, keys: [], relics: 0 }, fuseIn: 0, power: false, open: new Set(), relicsIn: 0, ritual: null, ritualDone: false, exitOpen: false, nG, win: null, why: '', lastTick: now };
      g.dur = +process.env.HAUNT_MS || Math.min(40, 26 + surv * 2) * 60000;
      spawnItems(g);
      r.players.forEach((q, i) => {
        const ghost = ids.indexOf(q.id) < nG;
        const P = g.P[q.id] = { id: q.id, c: cols[i], ghost, alive: true, trapped: false, strikes: 0, escaped: false, hidden: null, lv: 1, x: 0, z: 0, yaw: 0, fl: !ghost, bat: 100, darkTill: 0, stun: 0, burnCd: 0, reveal: 0, screamAt: now + INTRO + WAKE + 10000, mirrorAt: 0, checkAt: 0, catchAt: 0, hold: null, lastMv: now,
          bot: q.bot ? { path: [], goal: null, wait: 0, brave: .35 + Math.random() * .4, k: i } : null };
        if (ghost) { const k = ids.indexOf(q.id); [P.lv, P.x, P.z] = [M.ghostSpawn[0], M.ghostSpawn[1] - k * 1.2, M.ghostSpawn[2]]; P.yaw = 0; }
        else { const k = i % 8, a = k / 8 * Math.PI * 2; P.lv = M.spawn[0]; P.x = M.spawn[1] + Math.cos(a) * 1.3; P.z = M.spawn[2] + Math.sin(a) * 1.3; P.yaw = 0; }
      });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      r.players.forEach(q => { q._pos = null; });
      plist(g).forEach(P => snap(r, P));
      H.log(r, nG > 1 ? 'فيه شبحين بالقصر 👻👻' : 'فيه شبح بالقصر 👻');
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
        if (P.hidden != null || P.trapped) return 'quiet';
        const x = +m.x, z = +m.z, ml = +m.lv; if (!isFinite(x) || !isFinite(z)) return 'quiet';
        const spirit = !P.ghost && (!P.alive || P.escaped);
        const dt = Math.min(500, Math.max(0, now - P.lastMv)), sp = spirit ? 9 : P.ghost ? gspeed(g) : RUN, max = sp * dt / 1000 * 1.6 + 1;
        let lv = spirit ? (ml >= 0 && ml < M.LV ? ml : P.lv) : M.levelAfter(P.lv, x, z);
        const ok = !(P.ghost && (now < P.stun || now < g.wakeAt)) && Math.hypot(x - P.x, z - P.z) <= max && M.walk(lv, x, z, spirit ? { free: 1 } : opt(g, P));
        if (!ok) { P.lastMv = now; if (Math.hypot(x - P.x, z - P.z) > .4 || lv !== P.lv) snap(r, P); return 'quiet'; }
        P.x = x; P.z = z; P.lv = lv; P.lastMv = now;
        if (free(P) && g.exitOpen && M.at(lv, Math.floor(x / M.T), Math.floor(z / M.T)) === 6) { escape(r, P); return; }
        return 'quiet';
      }
      if (g.sub !== 'play') return 'quiet';
      if (m.t === 'use') return use(r, P, now) ? undefined : 'quiet';
      if (m.t === 'stop') { if (P.hold) { if (P.hold.k === 'ritual' && g.ritual) { g.ritual = null; H.cast(r, { t: 'hev', ev: 'ritualStop' }); } P.hold = null; return; } return 'quiet'; }
      if (m.t === 'scream') return scream(r, P, now) ? undefined : 'quiet';
      if (m.t === 'catch') {
        const T = g.P[m.id];
        if (!P.ghost || now < P.stun || now < g.wakeAt || now - P.catchAt < 1500 || !T || !free(T) || T.hidden != null || T.lv !== P.lv || dist(P, T) > CATCH_R || !sees(g, P, T)) return 'quiet';
        caught(r, P, T); return;
      }
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const now = Date.now(), P = g.P[p.id], ps = plist(g);
      return {
        id: g.id, sub: g.sub, nG: g.nG,
        wakeIn: g.sub === 'play' ? Math.max(0, g.wakeAt - now) : WAKE,
        endIn: g.sub === 'play' ? Math.max(0, g.endAt - now) : g.dur,
        me: P ? { c: P.c, ghost: P.ghost, alive: P.alive, trapped: P.trapped, strikes: P.strikes, escaped: P.escaped, hidden: P.hidden } : null,
        col: Object.fromEntries(ps.map(x => [x.id, x.c])),
        ghosts: ps.filter(x => x.ghost).map(x => x.id),
        trapped: ps.filter(x => x.trapped).map(x => [x.id, Math.max(0, SELF_FREE - (now - x.trapAt))]), dead: ps.filter(x => !x.ghost && !x.alive).map(x => x.id), esc: ps.filter(x => x.escaped).map(x => x.id),
        items: g.items.filter(i => !i.got).map(i => [i.id, i.k, i.sub ?? null, i.lv, r2(i.x), r2(i.z)]),
        team: g.team, fuseIn: g.fuseIn, power: g.power, open: [...g.open], relicsIn: g.relicsIn, ritual: g.ritual ? { by: g.ritual.by, left: Math.max(0, HOLD.ritual - (now - g.ritual.t0)) } : null, ritualDone: g.ritualDone, exitOpen: g.exitOpen,
        obj: objective(g), win: g.win, why: g.why
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || !g.P[p.id]) return;
      if (g.P[p.id].ghost) H.log(r, `${p.name} (الشبح) طلع`);
      if (g.ritual && g.ritual.by === p.id) g.ritual = null;
      delete g.P[p.id];
      checkEnd(r);
    }
  };
};
