// الأصوات الترتيب: يطلع صوت، والكل يقلّده بالمايك بنفس الوقت، والتقييم على الإيقاع واللحن.
// بعدين عجلة الحظ، وتنعاد كل التسجيلات وحدة وحدة.
// الأصوات في public/mimic/sounds.json (pack: basic = أصوات البداية، react = رياكشنات علي).
const fs = require('fs'), path = require('path');
const SCALE = +process.env.MIMIC_SCALE || 1;
const rnd = n => Math.random() * n | 0;
const WHEEL = [['x2', 3], ['plus', 3], ['fart', 2], ['none', 2]];
function sounds() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'mimic', 'sounds.json'), 'utf8')); } catch { return []; }
}
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  function round(r) {
    const g = r.g; g.round++;
    g.snd = g.deck[(g.round - 1) % g.deck.length]; g.takes = {}; g.wheel = null; g.pi = -1; g.got = {};
    g.sub = 'listen';
    H.setTimer(r, (g.snd.dur * 1000 + 3200) * SCALE, () => {
      // ٣-٢-١ ثم التسجيل بطول الصوت + شوي، ومهلة للرفع
      g.sub = 'rec'; g.recAt = Date.now();
      H.setTimer(r, (3000 + g.snd.dur * 1000 + 900) * SCALE + 6000, () => wheel(r));
    });
  }
  function take(r, p, m) {
    const g = r.g; if (g.sub !== 'rec' || p.spec || g.takes[p.id]) return;
    const a = typeof m.a === 'string' && m.a.length < 400000 ? m.a : '';
    const s = Math.max(0, Math.min(100, Math.round(+m.s || 0)));
    g.takes[p.id] = { a, mime: String(m.mime || '').slice(0, 40), s };
    if (r.players.every(q => g.takes[q.id] || !q.online)) H.setTimer(r, 600, () => wheel(r));
  }
  function wheel(r) {
    const g = r.g; if (g.sub !== 'rec') return;
    // اللي ما سلّم ياخذ صفر
    r.players.forEach(p => { if (!g.takes[p.id]) g.takes[p.id] = { a: '', mime: '', s: 0, none: 1 }; });
    const cands = r.players.filter(p => !g.takes[p.id].none);
    const tot = WHEEL.reduce((s, w) => s + w[1], 0); let x = rnd(tot), eff = 'none';
    for (const [e, w] of WHEEL) { if (x < w) { eff = e; break; } x -= w; }
    const who = cands.length ? cands[rnd(cands.length)].id : null;
    g.wheel = { id: who, eff: who ? eff : 'none', spin: rnd(1e6) };
    g.sub = 'wheel';
    H.setTimer(r, 4800 * SCALE, () => play(r));
  }
  function pts(g, id) {
    const t = g.takes[id]; if (!t) return 0;
    let s = t.s;
    if (g.wheel && g.wheel.id === id) { if (g.wheel.eff === 'x2') s *= 2; else if (g.wheel.eff === 'plus') s += 25; else if (g.wheel.eff === 'fart') s = 0; }
    return s;
  }
  function play(r) {
    const g = r.g; g.sub = 'play';
    g.order = H.shuffle(r.players.map(p => p.id).filter(id => g.takes[id]));
    // نرسل التسجيلات لكل الناس مرة وحدة
    H.cast(r, { t: 'gnet', g: 'mimic', k: 'takes', round: g.round, list: g.order.map(id => ({ id, a: g.takes[id].a, mime: g.takes[id].mime })) });
    g.pi = -1; nextTake(r);
  }
  function nextTake(r) {
    const g = r.g; g.pi++;
    if (g.pi >= g.order.length) {
      g.order.forEach(id => { g.scores[id] = (g.scores[id] || 0) + pts(g, id); g.got[id] = pts(g, id); });
      g.sub = 'score';
      H.setTimer(r, 5000 * SCALE, () => g.round >= g.rounds ? end(r) : round(r));
      return;
    }
    const t = g.takes[g.order[g.pi]];
    H.setTimer(r, ((t.none ? 1.2 : g.snd.dur + .6) * 1000 + 2400) * SCALE, () => nextTake(r));
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end';
    const top = Math.max(0, ...r.players.map(p => g.scores[p.id] || 0)), ws = r.players.filter(p => (g.scores[p.id] || 0) === top);
    r.winner = ws.map(p => p.name).join(' و ') || 'انتهت اللعبة'; r.winTeam = null; H.win(r, ws); H.setTimer(r, 0, null);
  }
  return {
    min: 1, max: 8,
    start(r) {
      const all = sounds(), pack = r.opts.mpack || 'all';
      let pool = all.filter(s => pack === 'all' || s.pack === pack); if (!pool.length) pool = all;
      if (process.env.MIMIC_ONLY) pool = all.filter(s => s.id === process.env.MIMIC_ONLY); // للاختبار
      const rounds = [5, 8, 10].includes(r.opts.mrounds) ? r.opts.mrounds : 5;
      r.g = { deck: H.shuffle(pool.slice()), rounds, round: 0, scores: {}, takes: {}, got: {}, sub: 'listen', snd: null, wheel: null, order: [], pi: -1, recAt: 0 };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      if (!pool.length) { H.log(r, 'ما فيه أصوات'); return end(r); }
      H.log(r, 'اسمع الصوت… وقلّده!');
      round(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'mtake') { if (!H.rate(p, 'mt', 500)) return 'quiet'; return take(r, p, m); }
      if (m.t === 'mget') { // اللي دخل متأخر أو انقطع
        if (g.sub === 'play' || g.sub === 'score') H.sendTo(p, { t: 'gnet', g: 'mimic', k: 'takes', round: g.round, list: g.order.map(id => ({ id, a: g.takes[id].a, mime: g.takes[id].mime })) });
        return 'quiet';
      }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const after = g.sub === 'play' || g.sub === 'score' || g.sub === 'end';
      return {
        sub: g.sub, round: g.round, rounds: g.rounds, snd: g.snd, scores: g.scores, got: g.sub === 'score' || g.sub === 'end' ? g.got : null,
        done: Object.keys(g.takes).filter(id => !g.takes[id].none || after), mine: g.takes[p.id] ? g.takes[p.id].s : null,
        wheel: g.sub === 'rec' || g.sub === 'listen' ? null : g.wheel, order: after ? g.order : [], pi: g.pi,
        tk: after ? Object.fromEntries(g.order.slice(0, g.sub === 'play' ? g.pi + 1 : g.order.length).map(id => [id, { s: g.takes[id].s, p: pts(g, id), none: !!g.takes[id].none }])) : null
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (g.sub === 'rec' && r.players.length && r.players.every(q => g.takes[q.id] || !q.online)) H.setTimer(r, 600, () => wheel(r));
    }
  };
};
