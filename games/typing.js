// سبّاق الكتابة: أسرع واحد يكتب النص بدون خطأ ياخذ النقطة. أول واحد يوصل الهدف يفوز.
const TEXTS = require('./typing-texts');
const WAIT_MS = 3000, GO_MS = 25000, BETWEEN_MS = 3000;
const clean = s => String(s || '').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim();
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  function nextRound(r) {
    const g = r.g; g.round++; g.sub = 'wait'; g.last = null;
    let t; do { t = TEXTS[Math.random() * TEXTS.length | 0]; } while (g.used.has(t) && g.used.size < TEXTS.length);
    g.used.add(t); g.text = t;
    H.setTimer(r, WAIT_MS, () => { g.sub = 'go'; g.startAt = Date.now(); H.setTimer(r, GO_MS, () => { g.sub = 'between'; g.last = null; H.log(r, 'ما أحد كتبها في الوقت'); H.setTimer(r, BETWEEN_MS, () => nextRound(r)); }); });
  }
  return {
    min: 2, max: 10,
    start(r) {
      const target = Math.max(3, Math.min(15, +(r.opts.target || 5)));
      r.g = { target, round: 0, sub: 'wait', text: '', startAt: 0, scores: {}, last: null, used: new Set() };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, `أول واحد يوصل ${target} نقاط يفوز`);
      nextRound(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || m.t !== 'type' || g.sub !== 'go') return;
      if (!H.rate(p, 'ty', 250)) return;
      if (clean(m.text) !== clean(g.text)) return;
      const ms = Date.now() - g.startAt;
      g.scores[p.id] = (g.scores[p.id] || 0) + 1; g.sub = 'between'; g.last = { id: p.id, ms };
      H.log(r, `${p.name} كتبها في ${(ms / 1000).toFixed(1)} ثانية`);
      if (g.scores[p.id] >= g.target) { r.phase = 'over'; r.winner = p.name; H.win(r, [p]); H.setTimer(r, 0, null); return; }
      H.setTimer(r, BETWEEN_MS, () => nextRound(r));
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      return { sub: g.sub, text: g.sub === 'wait' ? null : g.text, round: g.round, target: g.target, scores: g.scores, last: g.last };
    },
    leave(r, p) { if (r.g) delete r.g.scores[p.id]; }
  };
};
