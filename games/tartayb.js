// تراتيب: حروف ملخبطة، ترتبها وتطلع الكلمة. أسرع واحد يحلها ياخذ نقطة.
const W = require('./tartayb-words');
const SCALE = +process.env.TARTAYB_SCALE || 1;
const SHOW_MS = 3800;
const rnd = n => Math.random() * n | 0;
// نوحّد الكتابة عشان المقارنة (همزات، تاء مربوطة، ى)
const norm = s => String(s || '').replace(/[ً-ْـ\s]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
const POOL = [];
for (const [hint, list] of W) for (const w of list.split(/\s+/)) if (w.length >= 3 && w.length <= 9) POOL.push({ w, hint });
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  function scramble(w) {
    const a = [...w];
    for (let k = 0; k < 20; k++) { const s = H.shuffle([...a]); if (norm(s.join('')) !== norm(w)) return s; }
    return a.reverse();
  }
  function pick(g) {
    let c = POOL.filter(x => !g.used.has(x.w) && x.w.length >= g.minL && x.w.length <= g.maxL);
    if (!c.length) { g.used.clear(); c = POOL; }
    const x = c[rnd(c.length)]; g.used.add(x.w); return x;
  }
  function ask(r) {
    const g = r.g; g.k++; g.bt.forEach(clearTimeout); g.bt = [];
    // تكبر الكلمات شوي مع الجولات
    g.minL = g.k <= 3 ? 3 : 4; g.maxL = g.k <= 3 ? 5 : g.k <= 7 ? 6 : 8;
    const x = pick(g);
    g.cur = { w: x.w, hint: x.hint, tiles: scramble(x.w) };
    g.sub = 'q'; g.at = Date.now(); g.win = null; g.tries = {};
    H.setTimer(r, g.ms, () => show(r, null));
    // البوتات: كل واحد يحاول يحلها بوقت عشوائي (الكلمة الأطول تاخذ وقت أكثر)
    r.players.filter(p => p.bot).forEach(b => {
      if (Math.random() < .35) return;
      const ms = (2600 + x.w.length * 900 + rnd(9000)) * SCALE;
      if (ms < g.ms) later(r, ms, () => guess(r, b, x.w));
    });
  }
  function guess(r, p, w) {
    const g = r.g; if (g.sub !== 'q' || p.spec) return;
    if (norm(w) !== norm(g.cur.w) || norm(w).length !== norm(g.cur.w).length) {
      g.tries[p.id] = (g.tries[p.id] || 0) + 1;
      if (!p.bot) H.sendTo(p, { t: 'gnet', g: 'tartayb', k: 'no' });
      return;
    }
    const ms = Date.now() - g.at;
    g.scores[p.id] = (g.scores[p.id] || 0) + 1;
    g.win = { id: p.id, ms };
    if (!g.best || ms < g.best.ms) g.best = { id: p.id, ms, w: g.cur.w };
    H.log(r, `⚡ ${p.name} رتّبها «${g.cur.w}» بـ ${(ms / 1000).toFixed(1)} ث`);
    show(r, p.id);
  }
  function show(r, winId) {
    const g = r.g; if (g.sub !== 'q') return;
    g.sub = 'show'; g.bt.forEach(clearTimeout); g.bt = [];
    if (!winId) H.log(r, `⏱ محد حلّها — الكلمة كانت «${g.cur.w}»`);
    g.last = { w: g.cur.w, id: winId, ms: g.win ? g.win.ms : null };
    const top = Math.max(0, ...Object.values(g.scores));
    H.setTimer(r, SHOW_MS * SCALE, () => (g.k >= g.count || (g.target && top >= g.target)) ? end(r) : ask(r));
    H.push(r);
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end'; g.bt.forEach(clearTimeout);
    const top = Math.max(0, ...r.players.map(p => g.scores[p.id] || 0)), ws = r.players.filter(p => (g.scores[p.id] || 0) === top && top > 0);
    r.winner = ws.map(p => p.name).join(' و ') || 'محد فاز'; r.winTeam = null; H.win(r, ws); H.setTimer(r, 0, null);
  }
  return {
    min: 1, max: 42,
    start(r) {
      const count = [5, 10, 15].includes(+r.opts.trounds) ? +r.opts.trounds : 10;
      const sec = [20, 30, 45].includes(+r.opts.ttime) ? +r.opts.ttime : 30;
      r.g = { count, k: 0, ms: sec * 1000 * SCALE, sec, used: new Set(), scores: {}, tries: {}, cur: null, sub: 'intro', bt: [], at: 0, win: null, last: null, best: null, minL: 3, maxL: 5 };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, `🔤 تراتيب: ${count} جولات — رتّب الحروف وأسرع واحد ياخذ النقطة`);
      H.setTimer(r, 2500 * SCALE, () => ask(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return 'quiet';
      if (m.t === 'tw') { if (!H.rate(p, 'tw', 250)) return 'quiet'; guess(r, p, String(m.w || '').slice(0, 20)); return g.sub === 'q' ? 'quiet' : undefined; }
      return 'quiet';
    },
    view(r) {
      const g = r.g; if (!g) return null;
      const c = g.cur, sh = g.sub !== 'q';
      return { sub: g.sub, k: g.k, count: g.count, sec: g.sec, scores: g.scores, tiles: c ? c.tiles : null, hint: c ? c.hint : null, len: c ? [...c.w].length : 0,
        word: sh && c ? c.w : null, win: sh ? g.win : null, last: g.last, best: g.best, left: g.sub === 'q' ? Math.max(0, g.ms - (Date.now() - g.at)) : 0 };
    },
    leave(r) { if (r.phase === 'play' && r.players.length < 1) end(r); }
  };
};
