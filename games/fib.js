// صدّقني: سؤال غريب، الكل يكتب جواب كذب يقنع، وبعدين تدوّرون الجواب الصح بين الأجوبة.
// تاخذ نقاط لو لقيت الصح، ونقاط على كل واحد ينخدع بكذبتك.
const QS = require('./fib-q');
const SCALE = +process.env.FIB_SCALE || 1;
const WRITE_MS = 50000, PICK_MS = 25000;
const norm = s => String(s || '').toLowerCase().replace(/[ً-ْـٰ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\p{L}\p{N}]+/gu, '').replace(/^ال/, '').replace(/^(و|ف|ب)ال/, '');
const rnd = n => Math.random() * n | 0;
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  const isTruth = (q, s) => { const n = norm(s); return !!n && [q.a, ...(q.alt || [])].some(x => norm(x) === n); };
  function ask(r) {
    const g = r.g; g.round++; g.bt.forEach(clearTimeout); g.bt = [];
    g.q = g.deck[g.round - 1]; g.sub = 'write'; g.lies = {}; g.picks = {}; g.opts = null; g.rev = -1;
    H.setTimer(r, WRITE_MS * SCALE, () => toPick(r));
    r.players.filter(p => p.bot).forEach(b => later(r, (5000 + rnd(20000)) * SCALE, () => {
      const used = new Set(Object.values(g.lies).map(norm));
      const pool = g.q.l.filter(x => !used.has(norm(x)));
      const fake = pool.length ? pool[rnd(pool.length)] : BOTLIE[rnd(BOTLIE.length)];
      lie(r, b, fake);
    }));
  }
  const BOTLIE = ['ما أدري والله', 'الجن', 'جدتي', 'سيارة جيب', 'الكبسة', 'البطاريق'];
  function lie(r, p, text) {
    const g = r.g; if (g.sub !== 'write' || p.spec) return;
    const t = String(text || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!t) return;
    if (isTruth(g.q, t)) { H.err(p, 'هذا الجواب الصح نفسه 😅 اكتب كذبة!'); return; }
    g.lies[p.id] = t;
    if (r.players.every(q => g.lies[q.id] || !q.online)) { H.setTimer(r, 1200 * SCALE, () => toPick(r)); }
  }
  function toPick(r) {
    const g = r.g; if (g.sub !== 'write') return;
    g.sub = 'pick'; g.bt.forEach(clearTimeout); g.bt = [];
    // نجمع الكذبات المتشابهة بخيار واحد
    const opts = [], byN = {};
    for (const [id, t] of Object.entries(g.lies)) { const n = norm(t); if (byN[n]) byN[n].by.push(id); else { byN[n] = { t, by: [id] }; opts.push(byN[n]); } }
    const need = Math.max(4, Math.min(8, r.players.length + 1));
    for (const h of H.shuffle(g.q.l.slice())) { if (opts.length + 1 >= need) break; if (!byN[norm(h)]) { byN[norm(h)] = { t: h, by: [], house: 1 }; opts.push(byN[norm(h)]); } }
    opts.push({ t: g.q.a, by: [], truth: 1 });
    g.opts = H.shuffle(opts).map((o, i) => Object.assign(o, { i }));
    H.setTimer(r, PICK_MS * SCALE, () => toReveal(r));
    r.players.filter(p => p.bot).forEach(b => later(r, (3000 + rnd(14000)) * SCALE, () => {
      const ok = g.opts.filter(o => !o.by.includes(b.id));
      const tr = ok.find(o => o.truth);
      pick(r, b, (Math.random() < .4 ? tr : ok[rnd(ok.length)]).i);
    }));
  }
  function pick(r, p, i) {
    const g = r.g; if (g.sub !== 'pick' || p.spec) return;
    const o = g.opts[i]; if (!o || o.by.includes(p.id)) return;
    g.picks[p.id] = i;
    if (r.players.every(q => g.picks[q.id] != null || !q.online)) H.setTimer(r, 900 * SCALE, () => toReveal(r));
  }
  function toReveal(r) {
    const g = r.g; if (g.sub !== 'pick') return;
    g.sub = 'reveal'; g.bt.forEach(clearTimeout); g.bt = [];
    const mult = g.round === g.rounds ? 2 : 1;
    g.gain = {};
    const add = (id, n) => { if (!byId(r, id)) return; g.scores[id] = (g.scores[id] || 0) + n; g.gain[id] = (g.gain[id] || 0) + n; };
    for (const [pid, i] of Object.entries(g.picks)) {
      const o = g.opts[i]; if (!o) continue;
      if (o.truth) add(pid, 1000 * mult);
      else o.by.forEach(a => add(a, 500 * mult));
    }
    // نكشف الكذبات اللي أحد اختارها وحدة وحدة، وآخر شي الصح
    const picked = new Set(Object.values(g.picks));
    g.seq = g.opts.filter(o => !o.truth && picked.has(o.i)).map(o => o.i).concat(g.opts.find(o => o.truth).i);
    g.rev = 0;
    const step = () => {
      if (g.rev < g.seq.length - 1) { g.rev++; H.setTimer(r, 3200 * SCALE, step); }
      else { g.sub = 'score'; H.setTimer(r, 5500 * SCALE, () => g.round >= g.rounds ? end(r) : ask(r)); }
    };
    H.setTimer(r, 3200 * SCALE, step);
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end';
    const top = Math.max(0, ...r.players.map(p => g.scores[p.id] || 0)), ws = r.players.filter(p => (g.scores[p.id] || 0) === top);
    r.winner = ws.map(p => p.name).join(' و ') || 'انتهت اللعبة'; r.winTeam = null; H.win(r, ws); H.setTimer(r, 0, null);
  }
  return {
    min: 3, max: 10,
    start(r) {
      const rounds = [5, 7, 10].includes(r.opts.frounds) ? r.opts.frounds : 7;
      const deck = H.shuffle(QS.slice()).slice(0, rounds);
      r.g = { deck, rounds, round: 0, scores: {}, sub: 'write', q: null, lies: {}, picks: {}, opts: null, rev: -1, seq: [], gain: {}, bt: [] };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'اكتب كذبة تقنع، ودوّر الجواب الصح');
      ask(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'flie') { if (!H.rate(p, 'fl', 400)) return 'quiet'; return lie(r, p, m.v); }
      if (m.t === 'fpick') return pick(r, p, +m.i);
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const show = g.sub === 'reveal' || g.sub === 'score' || g.sub === 'end';
      const opts = g.opts && g.opts.map(o => {
        const x = { i: o.i, t: o.t, mine: o.by.includes(p.id) };
        if (show) { const k = g.seq.indexOf(o.i); if (k >= 0 && k <= g.rev) Object.assign(x, { by: o.by, house: !!o.house, truth: !!o.truth, who: Object.keys(g.picks).filter(id => g.picks[id] === o.i), k }); }
        return x;
      });
      return {
        sub: g.sub, round: g.round, rounds: g.rounds, q: g.q && g.q.q, scores: g.scores, gain: show ? g.gain : null,
        wrote: Object.keys(g.lies), picked: Object.keys(g.picks), myLie: g.lies[p.id] || '', myPick: g.picks[p.id] != null ? g.picks[p.id] : null,
        opts, cur: show && g.seq.length ? g.seq[Math.max(0, g.rev)] : null, answer: g.sub === 'score' || g.sub === 'end' ? g.q.a : null, x2: g.round === g.rounds
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      delete g.lies[p.id]; delete g.picks[p.id]; delete g.scores[p.id];
      if (r.players.length < 2) end(r);
    },
    _norm: norm, _isTruth: isTruth
  };
};
