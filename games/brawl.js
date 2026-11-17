// ساحة القتال: لعبة قتال ٢D (على طريقة ألعاب القتال الكلاسيكية) بشخصيات أصلية وقدرات.
// اختيار شخصية → شاشة VS → جولات (أول واحد يفوز بجولتين) → الفايز يبقى ويجيه المتحدي اللي بعده.
// كل شي يتحسب بالسيرفر (tick ٥٠ms): المسافة، المدى، الصد، الكاونتر، المقذوفات، الكومبو، عدّاد السوبر.
const FZ = require('../public/brawl-chars');
const SCALE = +process.env.BRAWL_SCALE || 1;
const TICK = 50, ROUND_MS = 60000 * SCALE, SEL_MS = 15000 * SCALE, VS_MS = 3200 * SCALE, RIN_MS = 2200 * SCALE, RKO_MS = 2800 * SCALE, MKO_MS = 4200 * SCALE;
const { W, HALF, GAP, BASE } = FZ;
module.exports = H => {
  const nm = (r, id) => { const p = r.players.find(q => q.id === id); return p ? p.name : '؟'; };
  const isBot = (r, id) => { const p = r.players.find(q => q.id === id); return !!(p && p.bot); };
  const CH = F => FZ.byId[F.ch];
  function mkF(id, ch, left) {
    const c = FZ.byId[ch];
    return { id, ch, x: left ? 300 : 700, face: left ? 1 : -1, hp: c.hp, max: c.hp, meter: 0, st: 'idle', mv: null, until: 0, d: 0, block: false, cd: { s1: 0, s2: 0 }, shield: 0, inv: 0, combo: 0, comboAt: 0, seq: null, dash: null, ai: { next: 0, want: 0 } };
  }
  // ---- تدفق المباريات ----
  function newMatch(r) {
    const g = r.g; if (r.phase !== 'play') return;
    if (!g.champ) g.champ = g.queue.shift();
    const ch = g.queue.shift(); if (ch == null) return finish(r);
    g.pair = [g.champ, ch]; g.picks = {}; g.f = null; g.proj = []; g.matchN++; g.rwins = { [g.champ]: 0, [ch]: 0 }; g.round = 0;
    g.stage = FZ.STAGES[Math.random() * FZ.STAGES.length | 0].id;
    g.sub = 'select'; g.selEnd = Date.now() + SEL_MS;
    H.log(r, `⚔️ المباراة ${g.matchN}: ${nm(r, g.champ)} ضد ${nm(r, ch)} — اختاروا شخصياتكم`);
    g.pair.forEach(id => { if (isBot(r, id)) setTimeout(() => { if (r.g === g && g.sub === 'select' && !g.picks[id]) pick(r, id, FZ.C[Math.random() * FZ.C.length | 0].id); H.push(r); }, (900 + Math.random() * 1800) * SCALE); });
    H.setTimer(r, SEL_MS, () => { g.pair.forEach(id => { if (!g.picks[id]) g.picks[id] = FZ.C[Math.random() * FZ.C.length | 0].id; }); toVs(r); });
  }
  function pick(r, id, ch) {
    const g = r.g; if (g.sub !== 'select' || !g.pair.includes(id) || g.picks[id] || !FZ.byId[ch]) return false;
    g.picks[id] = ch; H.log(r, `${nm(r, id)} اختار ${FZ.byId[ch].n}`);
    if (g.pair.every(x => g.picks[x])) H.setTimer(r, 700, () => toVs(r));
    return true;
  }
  function toVs(r) { const g = r.g; if (g.sub !== 'select') return; g.sub = 'vs'; H.setTimer(r, VS_MS, () => newRound(r)); }
  function newRound(r) {
    const g = r.g; g.round++;
    g.f = [mkF(g.pair[0], g.picks[g.pair[0]], true), mkF(g.pair[1], g.picks[g.pair[1]], false)];
    if (g.keepMeter) g.f.forEach(F => { F.meter = g.keepMeter[F.id] || 0; });
    g.proj = []; g.sub = 'rin'; g.rko = null;
    H.setTimer(r, RIN_MS, () => { g.sub = 'fight'; g.endAt = Date.now() + ROUND_MS; H.setTimer(r, ROUND_MS, () => endRound(r, null)); });
  }
  function endRound(r, winner) {
    const g = r.g; if (g.sub !== 'fight') return;
    const [a, b] = g.f;
    let w = winner; if (!w) w = a.hp / a.max === b.hp / b.max ? (Math.random() < .5 ? a : b) : a.hp / a.max > b.hp / b.max ? a : b;
    const l = w === a ? b : a;
    g.rwins[w.id]++; g.sub = 'rko'; g.rko = { w: w.id, ko: !!winner, perfect: w.hp === w.max };
    w.st = 'win'; if (winner) l.st = 'ko';
    g.keepMeter = { [a.id]: a.meter, [b.id]: b.meter };
    H.cast(r, { t: 'gnet', g: 'brawl', k: 'rko', w: w.id, ko: !!winner, perfect: g.rko.perfect });
    const done = g.rwins[w.id] >= 2;
    H.setTimer(r, done ? MKO_MS : RKO_MS, () => {
      if (!done) return newRound(r);
      g.wins[w.id] = (g.wins[w.id] || 0) + 1; g.keepMeter = null;
      H.log(r, `🏆 ${nm(r, w.id)} (${FZ.byId[w.ch].n}) فاز بالمباراة`);
      g.champ = w.id; g.queue.push(l.id);
      if (g.wins[w.id] >= g.target) finish(r); else newMatch(r);
    });
    H.push(r);
  }
  function finish(r) {
    const g = r.g; clearInterval(g.iv);
    const top = Math.max(0, ...Object.values(g.wins)), ws = r.players.filter(p => (g.wins[p.id] || 0) === top && top > 0);
    r.phase = 'over'; r.winner = ws.map(p => p.name).join(' و ') || '—'; H.win(r, ws); g.sub = 'over';
    H.log(r, `👑 ${r.winner} بطل الساحة!`); H.setTimer(r, 0, null);
  }
  // ---- القتال ----
  const busy = F => !['idle', 'walk', 'block'].includes(F.st);
  const other = (g, F) => g.f[0] === F ? g.f[1] : g.f[0];
  const dist = (A, D) => Math.abs(A.x - D.x) - GAP + 40; // المسافة الفعلية بين الجسمين
  function ev(g, o) { o.n = ++g.evN; g.ev.push(o); }
  function startAtk(r, A, k) {
    const g = r.g, now = Date.now(); if (g.sub !== 'fight' || busy(A)) return false;
    const c = CH(A);
    if (k === 'p' || k === 'k') { const M = BASE[k]; A.st = 'wind'; A.mv = k; A.until = now + M.wind; A.M = M; return true; }
    if (k === 's1' || k === 's2') {
      if (now < A.cd[k]) return false;
      const S = c[k]; A.cd[k] = now + S.cd; A.mv = k; A.M = S;
      if (S.ty === 'shield') { A.shield = now + S.dur; A.st = 'rec'; A.until = now + 150; ev(g, { k: 'fx', id: A.id, fx: 'shield' }); return true; }
      if (S.ty === 'counter') { A.st = 'stance'; A.until = now + S.dur; return true; }
      A.st = 'wind'; A.until = now + S.wind; return true;
    }
    if (k === 'sup') {
      if (A.meter < 100) return false;
      A.meter = 0; A.mv = 'sup'; A.M = c.sup; A.st = 'wind'; A.until = now + 450;
      ev(g, { k: 'super', id: A.id, n2: c.sup.n }); return true;
    }
    return false;
  }
  // ضربة على الخصم
  function hit(r, A, D, dmg, o = {}) {
    const g = r.g, now = Date.now(); if (g.sub !== 'fight' || D.st === 'ko') return 'none';
    if (D.inv > now) { ev(g, { k: 'miss', by: A.id }); return 'miss'; }
    if (D.st === 'stance' && !o.grab) { // وقفة صد مضاد
      const S = CH(D)[D.mv]; D.st = 'rec'; D.until = now + 250;
      if (CH(D).id === 'bandar') { D.x = Math.max(HALF, Math.min(W - HALF, A.x - A.face * GAP)); }
      A.st = 'hit'; A.until = now + 520; A.seq = null; A.dash = null;
      A.hp = Math.max(0, A.hp - S.dmg * CH(D).pow / CH(A).def);
      ev(g, { k: 'hit', by: D.id, to: A.id, dmg: Math.round(S.dmg), tag: 'counter' });
      gain(D, S.dmg * 1.2); gain(A, S.dmg * .8);
      if (A.hp <= 0) { A.st = 'ko'; endRound(r, D); }
      return 'countered';
    }
    if (D.shield > now && !o.grab) { D.shield = 0; ev(g, { k: 'fx', id: D.id, fx: 'shieldbreak' }); return 'shield'; }
    const blocked = D.st === 'block' && !o.unblock;
    let dm = dmg * CH(A).pow / CH(D).def, kb = o.kb || 30;
    if (blocked) { dm *= o.chip || .15; kb *= .4; }
    else { D.st = 'hit'; D.until = now + (o.stun || 300); D.seq = null; D.dash = null; }
    D.hp = Math.max(0, D.hp - dm);
    // ارتداد للخلف
    const dir = Math.sign(D.x - A.x) || A.face;
    D.x = Math.max(HALF, Math.min(W - HALF, D.x + dir * kb));
    if (!blocked) { A.combo = now - A.comboAt < 900 ? A.combo + 1 : 1; A.comboAt = now; }
    gain(A, dm * 1.3); gain(D, dm * .9);
    ev(g, { k: 'hit', by: A.id, to: D.id, dmg: Math.max(1, Math.round(dm)), tag: blocked ? 'block' : o.tag || A.mv, combo: blocked ? 0 : A.combo, big: !blocked && dm >= 12 });
    if (D.hp <= 0) { D.st = 'ko'; endRound(r, A); }
    return blocked ? 'blocked' : 'hit';
  }
  const gain = (F, n) => { F.meter = Math.min(100, F.meter + n); };
  function release(r, A, D, now) { // بداية الضربة الفعلية بعد التحضير
    const g = r.g, M = A.M, ty = M.ty;
    A.st = 'rec'; A.until = now + (M.rec || 260);
    if (A.mv === 'p' || A.mv === 'k' || ty === 'poke') { if (dist(A, D) <= M.range) hit(r, A, D, M.dmg, { kb: M.kb, stun: M.stun }); else ev(g, { k: 'whiff', by: A.id }); return; }
    if (ty === 'proj' || ty === 'beam') { g.proj.push({ own: A.id, x: A.x + A.face * 50, dir: A.face, sp: M.speed, dmg: M.dmg, fx: M.fx || 'beam', big: ty === 'beam', life: now + 2600 }); A.until = now + 220; return; }
    if (ty === 'dash') { A.st = 'dash'; A.dash = { end: now + 260, v: A.face * M.dist / .26, done: false }; return; }
    if (ty === 'grab') { if (dist(A, D) <= M.range) hit(r, A, D, M.dmg, { kb: M.kb, stun: M.stun, grab: true, unblock: true, tag: 'grab' }); else { A.until = now + 450; ev(g, { k: 'whiff', by: A.id }); } return; }
    if (ty === 'tele') { const side = Math.sign(A.x - D.x) || 1, nx = D.x - side * GAP; A.x = Math.max(HALF, Math.min(W - HALF, nx === A.x ? D.x + side * GAP : nx)); A.inv = now + 300; A.st = 'idle'; ev(g, { k: 'fx', id: A.id, fx: 'tele' }); return; }
    if (ty === 'stomp' || ty === 'quake') { ev(g, { k: 'fx', id: A.id, fx: 'quake' }); if (dist(A, D) <= M.range) hit(r, A, D, M.dmg, { kb: ty === 'quake' ? 200 : M.kb, stun: ty === 'quake' ? 900 : M.stun, unblock: true, tag: ty }); A.until = now + 380; return; }
    if (ty === 'spin') { A.seq = { left: M.hits, next: now, gap: 130, dmg: M.dmg, range: M.range, kb: M.kb, stun: M.stun, tag: 'spin' }; A.st = 'seq'; return; }
    if (ty === 'rush') {
      if (M.tele) { const side = Math.sign(A.x - D.x) || 1; A.x = Math.max(HALF, Math.min(W - HALF, D.x - side * GAP)); ev(g, { k: 'fx', id: A.id, fx: 'tele' }); }
      if (dist(A, D) > M.dist && !M.tele) { A.st = 'dash'; A.dash = { end: now + 330, v: A.face * M.dist / .33, rush: true }; return; }
      A.seq = { left: M.hits, next: now, gap: 105, dmg: M.dmg / M.hits, range: 999, kb: 14, stun: 260, tag: 'sup', last: 160 }; A.st = 'seq'; return;
    }
    if (ty === 'heal') { A.hp = Math.min(A.max, A.hp + M.heal); ev(g, { k: 'fx', id: A.id, fx: 'heal' }); if (dist(A, D) <= M.range) hit(r, A, D, M.dmg, { kb: 120, stun: 600, tag: 'sup' }); A.until = now + 400; return; }
  }
  function tick(r) {
    const g = r.g, now = Date.now(), dt = TICK / 1000;
    if (g.sub === 'fight' && g.f) {
      const [a, b] = g.f;
      for (const [A, D] of [[a, b], [b, a]]) {
        if (g.sub !== 'fight') break;
        A.face = Math.sign(D.x - A.x) || A.face;
        if (A.st === 'wind' && now >= A.until) release(r, A, D, now);
        else if (A.st === 'dash') {
          A.x = Math.max(HALF, Math.min(W - HALF, A.x + A.dash.v * dt));
          if (dist(A, D) <= 60) {
            const dsh = A.dash; A.dash = null;
            if (dsh.rush) { A.seq = { left: A.M.hits, next: now, gap: 105, dmg: A.M.dmg / A.M.hits, range: 999, kb: 14, stun: 260, tag: 'sup', last: 160 }; A.st = 'seq'; }
            else { A.st = 'rec'; A.until = now + 300; hit(r, A, D, A.M.dmg, { kb: A.M.kb, stun: A.M.stun, tag: 'dash' }); }
          } else if (now >= A.dash.end) { A.dash = null; A.st = 'rec'; A.until = now + 380; ev(g, { k: 'whiff', by: A.id }); }
        } else if (A.st === 'seq' && A.seq && now >= A.seq.next) {
          const s = A.seq; s.left--; s.next = now + s.gap;
          if (dist(A, D) <= s.range) hit(r, A, D, s.dmg, { kb: s.left === 0 ? (s.last || s.kb) : s.kb, stun: s.left === 0 ? 700 : s.stun + 150, tag: s.tag, chip: .3 });
          if (A.st === 'seq' && s.left <= 0) { A.seq = null; A.st = 'rec'; A.until = now + 300; }
        } else if (['rec', 'hit', 'stance'].includes(A.st) && now >= A.until) A.st = 'idle';
        if (g.sub !== 'fight') break;
        // المشي والصد
        if (!busy(A)) {
          if (A.block) A.st = 'block';
          else if (A.d) { const back = A.d !== A.face; A.x += A.d * CH(A).spd * (back ? .78 : 1) * dt; A.st = 'walk'; }
          else A.st = 'idle';
        }
        if (isBot(r, A.id)) bot(r, A, D, now);
      }
      // ما يدخلون ببعض وما يطلعون من الساحة
      for (const F of g.f) F.x = Math.max(HALF, Math.min(W - HALF, F.x));
      const gap = Math.abs(a.x - b.x);
      if (gap < GAP) { const mid = (a.x + b.x) / 2, s = Math.sign(a.x - b.x) || -1; a.x = mid + s * GAP / 2; b.x = mid - s * GAP / 2; for (const F of g.f) F.x = Math.max(HALF, Math.min(W - HALF, F.x)); if (Math.abs(a.x - b.x) < GAP) { if (a.x <= HALF + 1 || b.x >= W - HALF - 1) { a.x = Math.min(a.x, b.x) === a.x ? HALF : W - HALF; } } }
      // المقذوفات
      for (const p of g.proj) {
        p.x += p.dir * p.sp * dt;
        const T = g.f.find(F => F.id !== p.own), A = g.f.find(F => F.id === p.own);
        if (!p.dead && T && Math.abs(p.x - T.x) < (p.big ? 70 : 46)) { p.dead = true; hit(r, A, T, p.dmg, { kb: p.big ? 160 : 60, stun: p.big ? 800 : 420, chip: p.big ? .3 : .15, tag: p.big ? 'sup' : 'proj' }); }
      }
      // مقذوفين متعاكسين يلغون بعض
      for (const p of g.proj) for (const q of g.proj) if (p !== q && !p.dead && !q.dead && p.own !== q.own && Math.abs(p.x - q.x) < 40) { if (p.big && !q.big) q.dead = true; else if (q.big && !p.big) p.dead = true; else { p.dead = q.dead = true; } ev(g, { k: 'fx', fx: 'clash', x: (p.x + q.x) / 2 }); }
      g.proj = g.proj.filter(p => !p.dead && p.x > -60 && p.x < W + 60 && now < p.life);
    }
    if (g.f) {
      const f = g.f.map(F => [F.id, Math.round(F.x), Math.round(F.hp * 10) / 10, Math.round(F.meter), F.st, F.mv, F.face, (F.shield > now ? 1 : 0) | (F.inv > now ? 2 : 0), Math.max(0, Math.ceil((F.cd.s1 - now) / 100)), Math.max(0, Math.ceil((F.cd.s2 - now) / 100))]);
      const pr = g.proj.map(p => [Math.round(p.x), p.dir, p.fx, p.big ? 1 : 0]);
      const evs = g.ev.splice(0), key = JSON.stringify([g.sub, f, pr]);
      if (key !== g._last || evs.length) { g._last = key; H.cast(r, { t: 'gnet', g: 'brawl', k: 'st', sub: g.sub, f, pr, ev: evs }); }
    }
  }
  // ---- البوت ----
  function bot(r, A, D, now) {
    const ai = A.ai, c = CH(A); if (now < ai.next) return;
    ai.next = now + 140 + Math.random() * 170;
    const d = dist(A, D), ranged = c.id === 'sultana' || c.id === 'bandar', toward = Math.sign(D.x - A.x);
    // صد أو صد مضاد لو الخصم يحضّر
    if (D.st === 'wind' && d < 260 && !busy(A) && Math.random() < .5) {
      if ((c.s1.ty === 'counter' || c.s2.ty === 'counter') && Math.random() < .5) { const k = c.s1.ty === 'counter' ? 's1' : 's2'; if (startAtk(r, A, k)) return; }
      A.block = true; A.d = 0; return;
    }
    A.block = false;
    if (busy(A)) return;
    // سوبر
    if (A.meter >= 100) {
      const S = c.sup;
      if (S.ty === 'beam' || (S.ty === 'heal' && (A.hp < A.max * .6 || d < S.range)) || (S.ty === 'quake' && d <= S.range) || (S.ty === 'rush' && d <= S.dist)) { startAtk(r, A, 'sup'); return; }
    }
    const want = ranged ? 360 : c.id === 'azzam' ? 50 : 72;
    for (const k of ['s1', 's2']) {
      const S = c[k]; if (now < A.cd[k] || Math.random() < .5) continue;
      if ((S.ty === 'proj' && d > 180) || ((S.ty === 'grab' || S.ty === 'spin') && d <= S.range) || (S.ty === 'dash' && d < 220 && d > 60) || (S.ty === 'stomp' && d <= S.range && Math.random() < .5) || (S.ty === 'poke' && d <= S.range && d > 120) || (S.ty === 'tele' && d > 200) || (S.ty === 'shield' && d > 150)) { if (startAtk(r, A, k)) { A.d = 0; return; } }
    }
    if (d <= BASE.k.range && Math.random() < .7) { A.d = 0; startAtk(r, A, d <= BASE.p.range && Math.random() < .55 ? 'p' : 'k'); return; }
    if (ranged && d < want - 80) A.d = -toward;
    else if (d > want) A.d = toward;
    else A.d = Math.random() < .3 ? -toward : 0;
  }
  return {
    min: 2, max: 8,
    start(r) {
      const target = [1, 2, 3].includes(+r.opts.fwins) ? +r.opts.fwins : 2;
      r.g = { queue: H.shuffle(r.players.map(p => p.id)), champ: null, pair: null, picks: {}, f: null, proj: [], wins: {}, rwins: {}, round: 0, matchN: 0, target, sub: 'select', ev: [], evN: 0, stage: 'souq', endAt: 0, selEnd: 0, rko: null, keepMeter: null };
      r.winner = null; r.phase = 'play';
      H.log(r, `🔥 فتحت ساحة القتال — أول واحد يفوز بـ${target} ${target === 1 ? 'مباراة' : 'مباريات'} هو البطل`);
      const g = r.g; clearInterval(g.iv);
      g.iv = setInterval(() => { if (r.g !== g || r.phase !== 'play' || !H.alive(r)) return clearInterval(g.iv); try { tick(r); } catch (e) { console.error('brawl tick', e); } }, TICK);
      newMatch(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return 'quiet';
      if (m.t === 'fpick') { if (pick(r, p.id, String(m.ch))) return; return 'quiet'; }
      if (m.t !== 'fz' || !g.f || g.sub !== 'fight') return 'quiet';
      const F = g.f.find(x => x.id === p.id); if (!F || !H.rate(p, 'fz', 40)) return 'quiet';
      if (m.a === 'move') F.d = [-1, 0, 1].includes(+m.d) ? +m.d : 0;
      else if (m.a === 'block') { F.block = !!m.on; if (F.block) F.d = 0; }
      else startAtk(r, F, String(m.a));
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      return { sub: g.sub, pair: g.pair, picks: g.picks, queue: g.queue, champ: g.champ, wins: g.wins, target: g.target, matchN: g.matchN, round: g.round, rwins: g.rwins, stage: g.stage, rko: g.rko,
        f: g.f ? g.f.map(F => ({ id: F.id, ch: F.ch, hp: F.hp, max: F.max })) : null,
        left: g.sub === 'fight' ? Math.max(0, g.endAt - Date.now()) : g.sub === 'select' ? Math.max(0, g.selEnd - Date.now()) : 0 };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      g.queue = g.queue.filter(id => id !== p.id);
      if (g.pair && g.pair.includes(p.id)) {
        const o = g.pair.find(id => id !== p.id);
        if (g.sub === 'fight' && g.f) { const L = g.f.find(F => F.id === p.id), O = g.f.find(F => F.id === o); L.hp = 0; g.rwins[o] = 1; endRound(r, O); }
        else { g.champ = o; g.wins[o] = g.wins[o] || 0; if (r.players.filter(q => q.id !== p.id).length >= 2) newMatch(r); }
      } else if (g.champ === p.id) g.champ = null;
      if (r.players.filter(q => q.id !== p.id).length < 2) finish(r);
    }
  };
};
