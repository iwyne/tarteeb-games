// التلفون الترتيب: كل واحد يكتب جملة، اللي بعده يرسمها، واللي بعده يوصف الرسمة… وآخر شي تنعرض السلاسل كاملة.
// السلسلة c: بالخطوة s يشتغل عليها اللاعب order[(c + s) % n]. الخطوات الزوجية كتابة والفردية رسم.
const SCALE = +process.env.PHONE_SCALE || 1;
const WRITE_MS = 45000;
const IDEAS = require('./phone-ideas');
const rnd = n => Math.random() * n | 0;
// الرسمة: [[لون، سماكة، x1,y1,x2,y2…], …] من ٠ لـ ١٠٠٠
function cleanDraw(v) {
  if (!Array.isArray(v)) return null;
  const out = []; let pts = 0;
  for (const s of v.slice(0, 400)) {
    if (!Array.isArray(s) || s.length < 4) continue;
    const c = Math.max(0, Math.min(9, s[0] | 0)), w = Math.max(1, Math.min(4, s[1] | 0)), a = [c, w];
    for (let i = 2; i + 1 < s.length && pts < 9000; i += 2, pts++) a.push(Math.max(0, Math.min(1000, s[i] | 0)), Math.max(0, Math.min(1000, s[i + 1] | 0)));
    if (a.length >= 4) out.push(a);
  }
  return out;
}
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  const who = (g, c, s) => g.order[(c + s) % g.n];
  const kind = s => s % 2 ? 'draw' : 'write';
  const myChain = (g, id, s) => { const k = g.order.indexOf(id); return k < 0 ? -1 : ((k - s) % g.n + g.n) % g.n; };
  function stepStart(r) {
    const g = r.g; g.sub = 'play'; g.done = {}; g.draft = {};
    const ms = (kind(g.step) === 'draw' ? g.drawMs : WRITE_MS) * SCALE;
    H.setTimer(r, ms, () => { g.sub = 'grace'; H.setTimer(r, 1500, () => stepEnd(r)); });
  }
  function stepEnd(r) {
    const g = r.g; if (g.sub !== 'grace' && g.sub !== 'play') return;
    for (let c = 0; c < g.n; c++) {
      const id = who(g, c, g.step), it = g.chains[c];
      if (it[g.step]) continue;
      const d = g.draft[id];
      if (kind(g.step) === 'write') it[g.step] = { by: id, k: 'w', v: d && d.trim() ? d.trim() : g.step === 0 ? IDEAS[rnd(IDEAS.length)] : '(ما كتب شي 🤐)', auto: !(d && d.trim()) };
      else it[g.step] = { by: id, k: 'd', v: d || [], auto: !d };
    }
    g.step++;
    if (g.step >= g.steps) { g.sub = 'reveal'; g.rc = 0; g.ri = 0; g.likes = {}; revArm(r); return; }
    stepStart(r);
  }
  function submit(r, p, m) {
    const g = r.g; if (g.sub !== 'play') return;
    const c = myChain(g, p.id, g.step); if (c < 0) return;
    const k = kind(g.step);
    if (k === 'write') {
      const t = String(m.v || '').trim().replace(/\s+/g, ' ').slice(0, 90); if (!t) return;
      g.chains[c][g.step] = { by: p.id, k: 'w', v: t };
    } else {
      const d = cleanDraw(m.v); if (!d) return;
      g.chains[c][g.step] = { by: p.id, k: 'd', v: d };
    }
    g.done[p.id] = 1;
    if (r.players.every(q => g.done[q.id] || !q.online)) { g.sub = 'grace'; H.setTimer(r, 1200, () => stepEnd(r)); }
  }
  function unsubmit(r, p) {
    const g = r.g; if (g.sub !== 'play' || !g.done[p.id]) return;
    const c = myChain(g, p.id, g.step); if (c >= 0) { g.draft[p.id] = g.chains[c][g.step] && g.chains[c][g.step].v; g.chains[c][g.step] = null; }
    delete g.done[p.id];
  }
  function revNext(r) {
    const g = r.g; if (g.sub !== 'reveal') return;
    if (g.ri < g.steps - 1) g.ri++;
    else if (g.rc < g.n - 1) { g.rc++; g.ri = 0; }
    else return end(r);
    revArm(r);
  }
  // العرض يمشي لحاله، والمضيف يقدر يسرّعه
  function revArm(r) {
    const g = r.g, it = g.chains[g.rc][g.ri];
    H.setTimer(r, ((it && it.k === 'd' ? 7000 : 5000) + (g.ri === 0 ? 1500 : 0)) * SCALE, () => revNext(r));
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end';
    // الفائز: أكثر واحد ضحّك الناس (😂 على كتاباته ورسماته)
    const top = Math.max(0, ...r.players.map(p => g.laughs[p.id] || 0));
    const ws = top ? r.players.filter(p => (g.laughs[p.id] || 0) === top) : [];
    r.winner = ws.length ? ws.map(p => p.name).join(' و ') : 'انتهت اللعبة'; r.winTeam = null; if (ws.length) H.win(r, ws); H.setTimer(r, 0, null);
  }
  const brief = it => it && { by: it.by, k: it.k, v: it.k === 'w' ? it.v : null, auto: !!it.auto };
  return {
    min: 3, max: 12,
    start(r) {
      const order = H.shuffle(r.players.map(p => p.id)), n = order.length;
      const ps = [4, 6, 8].includes(r.opts.psteps) ? r.opts.psteps : 0;
      const steps = ps ? Math.min(n, ps) : n;
      r.g = { order, n, steps, step: 0, drawMs: ([60, 90, 120].includes(r.opts.pdraw) ? r.opts.pdraw : 90) * 1000, chains: Array.from({ length: n }, () => Array(steps).fill(null)), done: {}, draft: {}, sub: 'play', rc: 0, ri: 0, likes: {}, laughs: {} };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'اكتب جملة، ارسم، وصف… وشوفوا وش صار بالآخر');
      stepStart(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase === 'lobby') return;
      if (m.t === 'psub') { if (!H.rate(p, 'ps', 300)) return 'quiet'; return submit(r, p, m); }
      if (m.t === 'pundo') return unsubmit(r, p);
      if (m.t === 'pdraft') { // مسودة تنحفظ عشان لو خلص الوقت ناخذها
        if (g.sub !== 'play' || g.done[p.id] || !H.rate(p, 'pd', 250)) return 'quiet';
        g.draft[p.id] = kind(g.step) === 'write' ? String(m.v || '').slice(0, 90) : cleanDraw(m.v);
        return 'quiet';
      }
      if (m.t === 'pget') { // رسمة وحدة على الطلب (عشان الحالة ما تثقل)
        const c = +m.c | 0, s = +m.s | 0, it = g.chains[c] && g.chains[c][s];
        if (!it || it.k !== 'd') return 'quiet';
        const mine = myChain(g, p.id, g.step) === c && s === g.step - 1 && r.phase === 'play' && g.sub === 'play';
        const open = g.sub === 'reveal' ? (c < g.rc || (c === g.rc && s <= g.ri)) : g.sub === 'end';
        if (mine || open || p.spec && (g.sub === 'reveal' || g.sub === 'end')) H.sendTo(p, { t: 'gnet', g: 'phone', k: 'img', c, s, v: it.v });
        return 'quiet';
      }
      if (m.t === 'pnext') { if (r.host === p.id && H.rate(p, 'pn', 500)) revNext(r); return; }
      if (m.t === 'plike') { // 😂 على اللي ينعرض الحين، مرة وحدة لكل شي
        if (g.sub !== 'reveal') return 'quiet';
        const it = g.chains[g.rc][g.ri]; if (!it || it.by === p.id) return 'quiet';
        const key = g.rc + ':' + g.ri; g.likes[key] = g.likes[key] || [];
        if (g.likes[key].includes(p.id)) return 'quiet';
        g.likes[key].push(p.id); g.laughs[it.by] = (g.laughs[it.by] || 0) + 1;
        H.cast(r, { t: 'gnet', g: 'phone', k: 'like', id: p.id });
        return;
      }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const o = { sub: g.sub, step: g.step, steps: g.steps, n: g.n, order: g.order, done: Object.keys(g.done), drawMs: g.drawMs, laughs: g.laughs };
      if (g.sub === 'play' || g.sub === 'grace') {
        const c = myChain(g, p.id, g.step);
        o.kind = kind(g.step);
        if (c >= 0) {
          o.c = c; const prev = g.step ? g.chains[c][g.step - 1] : null;
          o.prev = brief(prev); o.mine = brief(g.chains[c][g.step]);
          o.draft = g.done[p.id] ? null : g.draft[p.id] && kind(g.step) === 'write' ? g.draft[p.id] : null;
        }
      } else if (g.sub === 'reveal') {
        o.rc = g.rc; o.ri = g.ri; o.owner = g.order[g.rc];
        o.items = g.chains[g.rc].slice(0, g.ri + 1).map(brief);
        o.likes = g.likes[g.rc + ':' + g.ri] || [];
      } else if (g.sub === 'end') {
        o.chains = g.chains.map(ch => ch.map(brief));
      }
      return o;
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (r.players.length < 2) return end(r);
      if (g.sub === 'play' && r.players.every(q => g.done[q.id] || !q.online)) { g.sub = 'grace'; H.setTimer(r, 1200, () => stepEnd(r)); }
    }
  };
};
