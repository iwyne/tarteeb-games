// إشارة حمرا خضرا: الكل يركض نحو الإشارة. أخضر = اركض، أصفر = انتبه، أحمر = ثبّت. اللي يتحرك بالأحمر يطلع.
// كل سباق: اللي يوصل خط النهاية ينجا، والباقين يطلعون. السباقات تصعب لين يبقى واحد (أو ٥ سباقات).
const SCALE = +process.env.REDLIGHT_SCALE || 1;
const TICK = 100, LEN = 100, SPEED = 7.2, GRACE = 420, INTRO = 4200 * SCALE, RES = 5200 * SCALE, MAX_RACES = 5;
module.exports = H => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const nm = (r, id) => { const p = r.players.find(q => q.id === id); return p ? p.name : '؟'; };
  const isBot = (r, id) => { const p = r.players.find(q => q.id === id); return !!(p && p.bot); };
  const runners = g => Object.values(g.R).filter(R => R.in);
  // مدة الأخضر والأحمر تقصر مع كل سباق
  function nextLight(r) {
    const g = r.g, now = Date.now(), k = Math.min(g.race - 1, 4);
    // من السباق الثالث أحياناً تقلب حمرا بدون أصفر
    if (g.light === 'g') { if (k >= 2 && Math.random() < .2 + k * .05) { g.light = 'r'; g.redAt = now; g.lightEnd = now + rnd(2200, 3800); } else { g.light = 'y'; g.lightEnd = now + Math.max(380, 750 - k * 90); } }
    else if (g.light === 'y') { g.light = 'r'; g.redAt = now; g.lightEnd = now + rnd(2200, 3800); }
    else { g.light = 'g'; g.lightEnd = now + rnd(Math.max(700, 1800 - k * 260), Math.max(1800, 5000 - k * 700)); }
    g.ev.push({ k: 'light', l: g.light });
  }
  function newRace(r) {
    const g = r.g; g.race++;
    const ids = g.alive.slice();
    g.R = {}; ids.forEach((id, i) => { g.R[id] = { id, i, z: 0, run: false, in: true, dead: false, fin: 0, ai: { at: 0, react: 0, lazy: Math.random() } }; });
    g.order = []; g.sub = 'intro'; g.light = 'r'; g.ev = []; g.res = null;
    H.log(r, `🚦 السباق ${g.race}: ${ids.length} لاعبين — اركض بالأخضر وثبّت بالأحمر`);
    H.setTimer(r, INTRO, () => {
      g.sub = 'race'; const now = Date.now();
      g.light = 'g'; g.lightEnd = now + rnd(2500, 4000); g.rms = Math.round(g.ms * [1, .86, .74, .64, .56][Math.min(4, g.race - 1)]); g.endAt = now + g.rms; g.ev.push({ k: 'light', l: 'g' });
      H.setTimer(r, g.rms, () => endRace(r, 'time'));
      H.push(r);
    });
    H.push(r);
  }
  function kill(r, R, why) {
    const g = r.g; if (R.dead || R.fin) return;
    R.dead = true; R.run = false;
    g.ev.push({ k: 'dead', id: R.id, why });
    if (why === 'red') H.log(r, `💀 ${nm(r, R.id)} تحرّك بالأحمر`);
  }
  function endRace(r, why) {
    const g = r.g; if (g.sub !== 'race') return;
    g.sub = 'res';
    const all = runners(g), late = all.filter(R => !R.dead && !R.fin);
    late.forEach(R => kill(r, R, 'time'));
    const surv = g.order.slice();
    g.res = { surv, late: late.map(R => R.id), dead: all.filter(R => R.dead).map(R => R.id) };
    if (late.length) H.log(r, `⏱ خلص الوقت — ما وصلوا: ${late.map(R => nm(r, R.id)).join('، ')}`);
    H.log(r, surv.length ? `🏁 نجوا: ${surv.map(id => nm(r, id)).join('، ')}` : '💀 محد نجا بهالسباق!');
    let done = false, winners = [];
    if (surv.length <= 1 || g.race >= MAX_RACES) {
      done = true;
      if (surv.length) winners = [surv[0]];
      else { const best = Math.max(0, ...all.map(R => R.z)); winners = all.filter(R => R.z === best && best > 0).map(R => R.id); }
    }
    g.alive = surv;
    H.cast(r, { t: 'gnet', g: 'redlight', k: 'res', res: g.res });
    H.setTimer(r, RES, () => done ? finish(r, winners) : newRace(r));
    H.push(r);
  }
  function finish(r, ids) {
    const g = r.g; clearInterval(g.iv);
    const ws = r.players.filter(p => ids.includes(p.id));
    r.phase = 'over'; g.sub = 'over'; r.winner = ws.map(p => p.name).join(' و ') || 'محد'; H.win(r, ws);
    H.log(r, ws.length ? `👑 ${r.winner} آخر واحد واقف!` : 'محد فاز هالمرة'); H.setTimer(r, 0, null);
  }
  function bot(r, R, now) {
    const g = r.g, ai = R.ai;
    if (g.light === 'g') {
      if (now > ai.at) { R.run = Math.random() > .12 + ai.lazy * .1; ai.at = now + rnd(300, 1200); }
      ai.react = 0;
    } else {
      // ردة الفعل: أغلبهم يوقفون بالوقت، وبعضهم يتأخر
      if (!ai.react) ai.react = now + (Math.random() < .1 + g.race * .03 ? rnd(GRACE + 150, GRACE + 600) : rnd(120, 520));
      if (now > ai.react) R.run = false;
    }
  }
  function tick(r) {
    const g = r.g, now = Date.now(), dt = TICK / 1000;
    if (g.sub === 'race') {
      if (now >= g.lightEnd) nextLight(r);
      for (const R of runners(g)) {
        if (R.dead || R.fin) continue;
        if (isBot(r, R.id)) bot(r, R, now);
        if (!R.run) continue;
        if (g.light === 'r') {
          if (now - g.redAt > GRACE) { kill(r, R, 'red'); continue; }
          continue; // فترة السماح: ما يتقدم بس ما يموت
        }
        R.z = Math.min(LEN, R.z + SPEED * dt * (g.light === 'y' ? .85 : 1));
        if (R.z >= LEN) { R.fin = g.order.length + 1; R.run = false; g.order.push(R.id); g.ev.push({ k: 'fin', id: R.id, n: R.fin }); H.log(r, `🏁 ${nm(r, R.id)} وصل ${R.fin === 1 ? 'الأول' : 'رقم ' + R.fin}`); }
      }
      const left = runners(g).filter(R => !R.dead && !R.fin);
      if (!left.length) { endRace(r, 'all'); return; }
    }
    if (g.R) {
      const P = runners(g).map(R => [R.id, Math.round(R.z * 10) / 10, (R.dead ? 1 : 0) | (R.fin ? 2 : 0) | (R.run ? 4 : 0)]);
      const ev = g.ev.splice(0), key = JSON.stringify([g.sub, g.light, P]);
      if (key !== g._k || ev.length) { g._k = key; H.cast(r, { t: 'gnet', g: 'redlight', k: 'st', sub: g.sub, L: g.light, P, ev, left: g.sub === 'race' ? Math.max(0, g.endAt - now) : 0 }); }
    }
  }
  return {
    min: 1, max: 42,
    start(r) {
      const sec = [45, 60, 90].includes(+r.opts.rtime) ? +r.opts.rtime : 60;
      r.g = { race: 0, alive: H.shuffle(r.players.map(p => p.id)), R: null, order: [], sub: 'intro', light: 'r', lightEnd: 0, redAt: 0, endAt: 0, ms: sec * 1000, sec, ev: [], res: null };
      r.winner = null; r.phase = 'play';
      const g = r.g; clearInterval(g.iv);
      g.iv = setInterval(() => { if (r.g !== g || r.phase !== 'play' || !H.alive(r)) return clearInterval(g.iv); try { tick(r); } catch (e) { console.error('redlight tick', e); } }, TICK);
      newRace(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || m.t !== 'rl') return 'quiet';
      const R = g.R && g.R[p.id]; if (!R || R.dead || R.fin || !H.rate(p, 'rl', 30)) return 'quiet';
      R.run = !!m.on;
      return 'quiet';
    },
    view(r) {
      const g = r.g; if (!g) return null;
      return { sub: g.sub, race: g.race, max: MAX_RACES, light: g.light, sec: g.sec, alive: g.alive, ids: g.R ? Object.keys(g.R) : [], res: g.res,
        rsec: Math.round((g.rms || g.ms) / 1000), left: g.sub === 'race' ? Math.max(0, g.endAt - Date.now()) : 0 };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      g.alive = g.alive.filter(id => id !== p.id);
      if (g.R && g.R[p.id]) { const R = g.R[p.id]; R.in = false; }
      if (!r.players.some(q => q.id !== p.id)) finish(r, []);
    }
  };
};
