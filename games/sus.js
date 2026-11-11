// المندس: طاقم سفينة يسوّون مهامهم، وبينهم مندس (أو اثنين) يقتلون ويخرّبون.
// الطاقم يفوز لو خلّصوا المهام أو طلّعوا المندسين بالتصويت، والمندسين يفوزون لو صار عددهم = الطاقم أو انفجر المفاعل.
// الحركة مباشرة: المتصفح يرسل مكانه والسيرفر يتحقق منه، والسيرفر يوزّع الأماكن ١٠ مرات بالثانية (كل واحد يشوف اللي قريب منه بس).
const M = require('../public/sus-map');
const SPEED = 230, KILL_R = 100, REPORT_R = 140, USE_R = 95, BTN_R = 120, VENT_R = 80;
const VIS = { crew: 340, imp: 440, dark: 125 };
const KILL_CD = 25000, FIRST_CD = 12000, SABO_CD = 30000, REACT_MS = 45000, BTN_CD = 15000;
const INTRO = 4500, TALK = 20000, VOTE = 35000, EJECT = 6500, TASKS_EACH = 5;
const MIN_T = { wires: 1500, swipe: 700, nums: 2000, hold: 2000, wait: 4500 };
const TASK = Object.fromEntries(M.tasks.map(t => [t.id, t]));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = n => Math.random() * n | 0;

module.exports = H => {
  const name = (r, id) => (r.players.find(q => q.id === id) || {}).name || '؟';
  const plist = g => Object.values(g.P);
  const snap = (r, id) => { const q = r.players.find(x => x.id === id), P = r.g.P[id]; if (q && !q.bot) H.sendTo(q, { t: 'snap', x: P.x, y: P.y }); };

  function spawnAll(r) {
    const g = r.g, ids = Object.keys(g.P), n = ids.length;
    ids.forEach((id, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2, P = g.P[id];
      P.x = M.button[0] + Math.cos(a) * 115; P.y = M.button[1] + Math.sin(a) * 105 + 20; P.lastMv = Date.now(); P.cur = null;
      if (P.bot) { P.bot.path = []; P.bot.wait = 0; P.bot.goal = null; P.bot.task = null; }
      snap(r, id);
    });
  }

  function finish(r, side, why) {
    const g = r.g; if (r.phase !== 'play') return;
    g.winSide = side; g.why = why; g.sub = 'end';
    r.phase = 'over'; r.winner = side === 'crew' ? 'الطاقم' : 'المندسين';
    H.win(r, r.players.filter(q => g.P[q.id] && !!g.P[q.id].imp === (side === 'imp')));
    H.log(r, why); H.setTimer(r, 0, null);
    clearInterval(g.iv);
  }
  function progress(g) { let d = 0, t = 0; plist(g).forEach(P => { if (!P.imp) P.tasks.forEach(x => { t++; if (x.done) d++; }); }); return [d, t]; }
  function checkWin(r) {
    const g = r.g; if (r.phase !== 'play') return true;
    const imp = plist(g).filter(P => P.imp && P.alive).length, crew = plist(g).filter(P => !P.imp && P.alive).length;
    if (!imp) { finish(r, 'crew', 'انطردوا كل المندسين!'); return true; }
    if (imp >= crew) { finish(r, 'imp', 'المندسين صاروا بعدد الطاقم'); return true; }
    const [d, t] = progress(g);
    if (t && d >= t) { finish(r, 'crew', 'الطاقم خلّصوا كل المهام!'); return true; }
    return false;
  }

  function meeting(r, byId, bodyId) {
    const g = r.g;
    g.sub = 'meet'; g.sabo = null;
    plist(g).forEach(P => { if (!P.alive) P.known = true; });
    g.bodies = [];
    g.meet = { by: byId, body: bodyId || null, sub: 'talk', votes: {}, n: (g.meet ? g.meet.n : 0) + 1 };
    spawnAll(r);
    H.log(r, bodyId ? `${name(r, byId)} بلّغ عن جثة ${name(r, bodyId)}` : `${name(r, byId)} سوّى اجتماع طارئ`);
    const mt = g.meet;
    H.setTimer(r, TALK, () => { if (g.meet !== mt) return; mt.sub = 'vote'; botVotes(r); H.setTimer(r, VOTE, () => endVote(r)); });
  }

  function endVote(r) {
    const g = r.g, mt = g.meet; if (!mt || g.sub !== 'meet') return;
    const cnt = {}; let skip = 0;
    Object.values(mt.votes).forEach(v => { if (v === 'skip') skip++; else cnt[v] = (cnt[v] || 0) + 1; });
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    let out = null;
    if (top.length && top[0][1] > skip && !(top[1] && top[1][1] === top[0][1])) out = top[0][0];
    const tally = {}; Object.entries(mt.votes).forEach(([who, v]) => { (tally[v] = tally[v] || []).push(who); });
    let text;
    if (out && g.P[out]) {
      const P = g.P[out]; P.alive = false; P.known = true;
      const left = plist(g).filter(x => x.imp && x.alive).length;
      text = `${name(r, out)} انطرد من السفينة… ${P.imp ? 'وكان المندس 😈' : 'وما كان المندس 😇'}`;
      g.eject = { id: out, imp: P.imp, text, left, tally };
    } else {
      text = top.length && top[1] && top[1][1] === top[0][1] && top[0][1] > skip ? 'تعادل… محد انطرد' : 'تخطّيتوا… محد انطرد';
      g.eject = { id: null, imp: false, text, left: plist(g).filter(x => x.imp && x.alive).length, tally };
    }
    H.log(r, text);
    g.sub = 'eject';
    H.setTimer(r, EJECT, () => {
      if (checkWin(r)) return;
      const now = Date.now();
      g.sub = 'play'; g.meet = null; g.eject = null;
      g.btnAt = now + BTN_CD; g.saboAt = Math.max(g.saboAt, now + 15000);
      plist(g).forEach(P => { if (P.imp) P.killAt = now + KILL_CD; P.lastMv = now; });
    });
  }

  function vote(r, id, v) {
    const g = r.g, mt = g.meet, P = g.P[id];
    if (!mt || mt.sub !== 'vote' || !P || !P.alive || mt.votes[id]) return false;
    if (v !== 'skip' && !(g.P[v] && g.P[v].alive)) return false;
    mt.votes[id] = v;
    if (plist(g).filter(x => x.alive).every(x => mt.votes[x.id])) { H.setTimer(r, 1200, () => endVote(r)); }
    return true;
  }

  function kill(r, P, T) {
    const g = r.g, now = Date.now();
    T.alive = false; T.cur = null;
    g.bodies.push({ id: T.id, x: T.x, y: T.y });
    P.x = T.x; P.y = T.y; P.killAt = now + KILL_CD; snap(r, P.id);
    const vq = r.players.find(q => q.id === T.id);
    if (vq && !vq.bot) H.sendTo(vq, { t: 'sus', ev: 'killed', by: P.c });
    // البوتات اللي شافت القتل تتذكر القاتل
    plist(g).forEach(B => { if (B.bot && B.alive && !B.imp && dist(B, P) < VIS.crew) B.bot.sus = P.id; });
    checkWin(r);
  }

  function fixPress(r, P) {
    const g = r.g, s = g.sabo, now = Date.now(); if (!s || !P.alive) return false;
    if (s.k === 'lights') {
      if (Math.hypot(P.x - M.fix.lights[0], P.y - M.fix.lights[1]) > USE_R) return false;
      g.sabo = null; H.log(r, 'رجعت الكهرباء 💡'); return true;
    }
    const i = M.fix.reactor.findIndex(f => Math.hypot(P.x - f[0], P.y - f[1]) <= USE_R); if (i < 0) return false;
    s[i ? 'b' : 'a'] = now;
    if (now - s.a < 1200 && now - s.b < 1200) { g.sabo = null; H.log(r, 'انصلح المفاعل ✅'); return true; }
    return false;
  }

  // ---------- البوتات ----------
  const nodeOf = (x, y) => { const q = M.rooms.find(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h); return q ? q.id : null; };
  const segOk = (a, b, free) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12); for (let i = 0; i <= n; i++) if (!M.walk(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n, free)) return false; return true; };
  const ADJ = {}; M.links.forEach(([a, b]) => { (ADJ[a] = ADJ[a] || []).push(b); (ADJ[b] = ADJ[b] || []).push(a); });
  function route(P, tx, ty) {
    const free = !P.alive, here = [P.x, P.y], goal = [tx, ty];
    if (segOk(here, goal, free)) return [goal];
    const start = Object.keys(M.nodes).filter(k => segOk(here, M.nodes[k], free)).sort((a, b) => Math.hypot(M.nodes[a][0] - P.x, M.nodes[a][1] - P.y) - Math.hypot(M.nodes[b][0] - P.x, M.nodes[b][1] - P.y))[0];
    const end = nodeOf(tx, ty) || Object.keys(M.nodes).sort((a, b) => Math.hypot(M.nodes[a][0] - tx, M.nodes[a][1] - ty) - Math.hypot(M.nodes[b][0] - tx, M.nodes[b][1] - ty))[0];
    if (!start) return [goal];
    const prev = { [start]: null }, q = [start];
    while (q.length) { const c = q.shift(); if (c === end) break; (ADJ[c] || []).forEach(n => { if (!(n in prev)) { prev[n] = c; q.push(n); } }); }
    const path = []; let c = end; while (c) { path.unshift(M.nodes[c].slice()); c = prev[c]; }
    path.push(goal); return path;
  }
  function goTo(P, x, y) { const b = P.bot; if (b.goal && b.goal[0] === x && b.goal[1] === y && b.path.length) return; b.goal = [x, y]; b.path = route(P, x, y); }
  function walkBot(P, dt) {
    const b = P.bot; let step = SPEED * 0.85 * dt;
    while (step > 0 && b.path.length) {
      const [tx, ty] = b.path[0], d = Math.hypot(tx - P.x, ty - P.y);
      if (d <= step) { P.x = tx; P.y = ty; step -= d; b.path.shift(); }
      else { P.x += (tx - P.x) / d * step; P.y += (ty - P.y) / d * step; step = 0; }
    }
    return !b.path.length;
  }
  function botStep(r, P, dt, now) {
    const g = r.g, b = P.bot;
    if (b.wait > now) return;
    if (P.imp && !P.alive) return;
    // تخريب: الطاقم الحي يروح يصلّح
    if (g.sabo && P.alive && !P.imp) {
      const spot = g.sabo.k === 'lights' ? M.fix.lights : M.fix.reactor[b.k % 2];
      goTo(P, spot[0], spot[1]);
      if (walkBot(P, dt) && Math.hypot(P.x - spot[0], P.y - spot[1]) < USE_R && rate(P, 400)) { if (fixPress(r, P)) H.push(r); }
      return;
    }
    if (P.alive && g.bodies.length) {
      const bd = g.bodies.find(x => dist(x, P) < REPORT_R);
      if (bd && !(P.imp && Math.random() < .85)) { meeting(r, P.id, bd.id); H.push(r); return; }
    }
    if (P.imp && P.alive) {
      if (now >= P.killAt) {
        const near = plist(g).filter(x => x.alive && x !== P && dist(x, P) < VIS.crew);
        const vic = near.filter(x => !x.imp && dist(x, P) < KILL_R);
        if (vic.length === 1 && near.length === 1 && Math.random() < .25) { kill(r, P, vic[0]); b.path = []; b.goal = null; H.push(r); return; }
        // يلاحق اللي ماشي لحاله
        const lone = near.filter(x => !x.imp);
        if (lone.length === 1 && near.length === 1 && segOk([P.x, P.y], [lone[0].x, lone[0].y])) { b.path = [[lone[0].x, lone[0].y]]; b.goal = null; walkBot(P, dt); return; }
      }
      if (!g.sabo && now >= g.saboAt && Math.random() < .003) { g.sabo = { k: Math.random() < .5 ? 'lights' : 'reactor', end: now + REACT_MS, a: 0, b: 0 }; g.saboAt = now + SABO_CD; H.push(r); }
      if (!b.path.length) { const ks = Object.keys(M.nodes), k = ks[rnd(ks.length)]; goTo(P, M.nodes[k][0] + rnd(40) - 20, M.nodes[k][1] + rnd(40) - 20); b.wait = now + 400 + rnd(1800); }
      walkBot(P, dt); return;
    }
    // مهام الطاقم (حتى الشبح يكمّل مهامه)
    if (P.imp) return;
    if (b.task) {
      const t = TASK[b.task];
      if (walkBot(P, dt)) {
        if (!P.cur) { P.cur = { id: t.id, t0: now }; b.wait = now + MIN_T[t.kind] + 600 + rnd(1500); return; }
        const x = P.tasks.find(x => x.id === t.id); if (x) x.done = true; P.cur = null; b.task = null;
        checkWin(r); H.push(r);
      }
      return;
    }
    const left = P.tasks.filter(x => !x.done);
    if (left.length) { const t = TASK[left[rnd(left.length)].id]; b.task = t.id; b.goal = null; goTo(P, t.x, t.y); return; }
    if (!b.path.length) { const ks = Object.keys(M.nodes), k = ks[rnd(ks.length)]; goTo(P, M.nodes[k][0], M.nodes[k][1]); b.wait = now + 1000 + rnd(3000); }
    walkBot(P, dt);
  }
  const rate = (P, ms) => { const n = Date.now(); if (P._fx && n - P._fx < ms) return false; P._fx = n; return true; };
  function botVotes(r) {
    const g = r.g, mt = g.meet;
    plist(g).filter(P => P.bot && P.alive).forEach(P => setTimeout(() => {
      if (g.meet !== mt || mt.sub !== 'vote' || r.g !== g || r.phase !== 'play') return;
      const alive = plist(g).filter(x => x.alive && x !== P);
      let v = 'skip';
      if (P.imp) { const c = alive.filter(x => !x.imp); if (c.length && Math.random() < .5) v = c[rnd(c.length)].id; }
      else if (P.bot.sus && g.P[P.bot.sus] && g.P[P.bot.sus].alive) v = P.bot.sus;
      else if (Math.random() < .3 && alive.length) v = alive[rnd(alive.length)].id;
      if (vote(r, P.id, v)) H.push(r);
    }, 2500 + rnd(9000)));
  }

  // ---------- النبضة: حركة البوتات + توزيع الأماكن ----------
  function tick(r) {
    const g = r.g;
    const now = Date.now(), dt = Math.min(.25, (now - g.lastTick) / 1000); g.lastTick = now;
    if (g.sub === 'play') {
      if (g.sabo && g.sabo.k === 'reactor' && now > g.sabo.end) { finish(r, 'imp', 'انفجر المفاعل 💥'); return H.push(r); }
      plist(g).forEach(P => { if (P.bot && r.phase === 'play' && g.sub === 'play') botStep(r, P, dt, now); });
      if (r.phase !== 'play') return;
    }
    const lights = g.sabo && g.sabo.k === 'lights';
    r.players.concat(r.specs).forEach(q => {
      if (!q.online || q.bot) return;
      const V = g.P[q.id], all = !V || !V.alive;
      const rad = all ? 1e9 : (V.imp ? VIS.imp : lights ? VIS.dark : VIS.crew) + 40;
      const a = [], b = [];
      plist(g).forEach(P => {
        if (!P.alive && !all) return;
        if (P.id === q.id || all || Math.hypot(P.x - V.x, P.y - V.y) <= rad) a.push([P.id, P.x | 0, P.y | 0, P.alive ? 0 : 1]);
      });
      g.bodies.forEach(B => { if (all || Math.hypot(B.x - V.x, B.y - V.y) <= rad) b.push([B.id, B.x | 0, B.y | 0]); });
      const s = JSON.stringify({ t: 'pos', a, b });
      if (s !== q._pos) { q._pos = s; H.sendTo(q, JSON.parse(s)); }
    });
  }

  return {
    min: 4, max: 10,
    start(r) {
      const ids = H.shuffle(r.players.map(q => q.id));
      const nImp = r.players.length >= 7 ? 2 : 1, cols = H.shuffle([...Array(10).keys()]);
      const g = r.g = { sub: 'intro', P: {}, bodies: [], sabo: null, meet: null, eject: null, winSide: null, why: '', nImp, lastTick: Date.now() };
      const now = Date.now();
      r.players.forEach((q, i) => {
        const imp = ids.indexOf(q.id) < nImp;
        const tasks = H.shuffle(M.tasks.map(t => t.id)).slice(0, TASKS_EACH).map(id => ({ id, done: false }));
        g.P[q.id] = { id: q.id, c: cols[i], imp, alive: true, known: false, x: 0, y: 0, lastMv: now, killAt: now + INTRO + FIRST_CD, btn: 1, tasks, cur: null, bot: q.bot ? { path: [], goal: null, wait: 0, task: null, k: i, sus: null } : null };
      });
      g.btnAt = now + INTRO + BTN_CD; g.saboAt = now + INTRO + 20000;
      r.winner = null; r.winTeam = null; r.phase = 'play';
      r.players.forEach(q => { q._pos = null; });
      spawnAll(r);
      H.log(r, nImp > 1 ? 'بينكم مندسين اثنين 👀' : 'بينكم مندس واحد 👀');
      H.setTimer(r, INTRO, () => { g.sub = 'play'; g.lastTick = Date.now(); plist(g).forEach(P => { P.lastMv = Date.now(); }); });
      clearInterval(g.iv);
      g.iv = setInterval(() => { if (r.g !== g || r.phase !== 'play' || !H.alive(r)) return clearInterval(g.iv); tick(r); }, 100);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return 'quiet';
      const P = g.P[p.id]; if (!P) return 'quiet';
      const now = Date.now();
      if (m.t === 'mv') {
        if (g.sub !== 'play') return 'quiet';
        const x = +m.x, y = +m.y; if (!isFinite(x) || !isFinite(y)) return 'quiet';
        const dt = Math.min(400, Math.max(0, now - P.lastMv)), max = SPEED * dt / 1000 * 1.35 + 25;
        if (Math.hypot(x - P.x, y - P.y) > max || !M.walk(x, y, !P.alive)) { P.lastMv = now; H.sendTo(p, { t: 'snap', x: P.x, y: P.y }); return 'quiet'; }
        P.x = x; P.y = y; P.lastMv = now;
        if (P.cur && Math.hypot(x - TASK[P.cur.id].x, y - TASK[P.cur.id].y) > USE_R + 20) P.cur = null;
        return 'quiet';
      }
      if (m.t === 'vote') return vote(r, p.id, String(m.v)) ? undefined : 'quiet';
      if (g.sub !== 'play') return 'quiet';
      if (m.t === 'kill') {
        const T = g.P[m.id];
        if (!P.imp || !P.alive || now < P.killAt || !T || !T.alive || T.imp || dist(P, T) > KILL_R) return 'quiet';
        kill(r, P, T); return;
      }
      if (m.t === 'report') {
        if (!P.alive) return 'quiet';
        const bd = g.bodies.find(x => x.id === m.id && dist(x, P) <= REPORT_R); if (!bd) return 'quiet';
        meeting(r, p.id, bd.id); return;
      }
      if (m.t === 'button') {
        if (!P.alive || P.btn < 1 || now < g.btnAt || g.sabo || Math.hypot(P.x - M.button[0], P.y - M.button[1]) > BTN_R) return 'quiet';
        P.btn--; meeting(r, p.id, null); return;
      }
      if (m.t === 'tstart') {
        const t = TASK[m.id], x = P.tasks.find(x => x.id === m.id);
        if (P.imp || !t || !x || x.done || Math.hypot(P.x - t.x, P.y - t.y) > USE_R + 10) return 'quiet';
        P.cur = { id: t.id, t0: now }; return 'quiet';
      }
      if (m.t === 'tdone') {
        const t = TASK[m.id], x = P.tasks.find(x => x.id === m.id);
        if (P.imp || !t || !x || x.done || !P.cur || P.cur.id !== t.id || now - P.cur.t0 < MIN_T[t.kind]) return 'quiet';
        x.done = true; P.cur = null; checkWin(r); return;
      }
      if (m.t === 'vent') {
        if (!P.imp || !P.alive) return 'quiet';
        for (const grp of M.vents) {
          const i = grp.findIndex(v => dist(v, P) <= VENT_R);
          if (i >= 0) { const v = grp[(i + 1) % grp.length]; P.x = v.x; P.y = v.y; P.lastMv = now; snap(r, p.id); return 'quiet'; }
        }
        return 'quiet';
      }
      if (m.t === 'sabo') {
        if (!P.imp || !P.alive || g.sabo || now < g.saboAt || !['lights', 'reactor'].includes(m.k)) return 'quiet';
        g.sabo = { k: m.k, end: now + REACT_MS, a: 0, b: 0 }; g.saboAt = now + SABO_CD; return;
      }
      if (m.t === 'fix') return fixPress(r, P) ? undefined : 'quiet';
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const now = Date.now(), P = g.P[p.id], over = r.phase === 'over', all = over || !P || !P.alive;
      const imps = plist(g).filter(x => x.imp).map(x => x.id);
      return {
        sub: g.sub, nImp: g.nImp,
        me: P ? { c: P.c, imp: P.imp, alive: P.alive, tasks: P.tasks, btn: P.btn, killIn: Math.max(0, P.killAt - now), cur: P.cur ? P.cur.id : null } : null,
        col: Object.fromEntries(plist(g).map(x => [x.id, x.c])),
        dead: plist(g).filter(x => !x.alive && (all || x.known)).map(x => x.id),
        imps: over || (P && P.imp) ? imps : [],
        prog: progress(g),
        sabo: g.sabo ? { k: g.sabo.k, left: g.sabo.k === 'reactor' ? Math.max(0, g.sabo.end - now) : 0, a: now - g.sabo.a < 1200, b: now - g.sabo.b < 1200 } : null,
        saboIn: P && P.imp ? Math.max(0, g.saboAt - now) : 0, btnIn: Math.max(0, g.btnAt - now),
        meet: g.meet ? { by: g.meet.by, body: g.meet.body, sub: g.meet.sub, voted: Object.keys(g.meet.votes), mine: g.meet.votes[p.id] || null } : null,
        eject: g.eject, win: g.winSide, why: g.why
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || !g.P[p.id]) return;
      const P = g.P[p.id];
      if (g.meet) { delete g.meet.votes[p.id]; Object.keys(g.meet.votes).forEach(k => { if (g.meet.votes[k] === p.id) g.meet.votes[k] = 'skip'; }); }
      delete g.P[p.id]; g.bodies = g.bodies.filter(b => b.id !== p.id);
      if (P.imp) H.log(r, `${p.name} طلع… وكان مندس`);
      if (!checkWin(r) && g.meet && g.meet.sub === 'vote' && plist(g).filter(x => x.alive).every(x => g.meet.votes[x.id])) H.setTimer(r, 1200, () => endVote(r));
    }
  };
};
