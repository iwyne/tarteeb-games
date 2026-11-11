// رسم وخمّن: كل لاعب يرسم كلمة والباقي يخمّنون، النقاط بالسرعة
const WORDS = require('./draw-words');
const { same } = require('./hive');
const CHOOSE_MS = 12000, DRAW_MS = 80000, REVEAL_MS = 5000;
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  const drawer = r => byId(r, r.g.order[r.g.turn]);
  function hintOf(g) {
    const w = [...g.word];
    return w.map((ch, i) => ch === ' ' ? '  ' : g.shown.has(i) ? ch : '_').join(' ');
  }
  function startTurn(r) {
    const g = r.g; clearTimeout(g.hintT);
    g.sub = 'choose'; g.guessed = []; g.guesses = []; g.strokes = []; g.n = 0; g.ver++; g.word = null; g.shown = new Set();
    g.choices = H.shuffle(WORDS.slice()).slice(0, 3);
    H.setTimer(r, CHOOSE_MS, () => pickWord(r, g.choices[0]));
  }
  function pickWord(r, w) {
    const g = r.g; if (g.sub !== 'choose' || !g.choices.includes(w)) return;
    g.word = w; g.sub = 'draw'; g.choices = null;
    const idx = [...w].map((c, i) => c === ' ' ? -1 : i).filter(i => i >= 0); g.order2 = H.shuffle(idx);
    g.hintT = setTimeout(() => reveal1(r, g), DRAW_MS * .4);
    H.setTimer(r, DRAW_MS, () => endTurn(r, 'انتهى الوقت'));
  }
  function reveal1(r, g) {
    if (r.g !== g || g.sub !== 'draw') return;
    if (g.shown.size < Math.min(2, g.order2.length - 1)) g.shown.add(g.order2[g.shown.size]);
    if (g.shown.size < 2) g.hintT = setTimeout(() => reveal1(r, g), DRAW_MS * .25);
    H.push(r);
  }
  function endTurn(r, why) {
    const g = r.g; if (g.sub !== 'draw') return; clearTimeout(g.hintT);
    g.sub = 'reveal'; H.log(r, g.word ? `${why} — الكلمة: ${g.word}` : why);
    H.setTimer(r, REVEAL_MS, () => next(r));
  }
  function next(r) {
    const g = r.g; g.turn++;
    while (g.turn < g.order.length && !byId(r, g.order[g.turn])) g.turn++;
    if (g.turn >= g.order.length) {
      r.phase = 'over'; clearTimeout(g.hintT);
      const top = Math.max(...Object.values(g.scores)), winners = r.players.filter(p => (g.scores[p.id] || 0) === top);
      r.winner = winners.map(p => p.name).join(' و '); r.winTeam = null; H.win(r, winners); H.setTimer(r, 0, null); return;
    }
    startTurn(r);
  }
  return {
    min: 2, max: 10,
    start(r) {
      const cycles = r.players.length <= 4 ? 2 : 1;
      let order = []; for (let c = 0; c < cycles; c++) order = order.concat(H.shuffle(r.players.map(p => p.id)));
      r.g = { order, turn: 0, sub: 'choose', scores: {}, guessed: [], guesses: [], strokes: [], n: 0, ver: 0, word: null, shown: new Set(), choices: null, hintT: null };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'كل لاعب يرسم ويخمّنون — الأسرع يجمع نقاط أكثر');
      startTurn(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      const d = drawer(r), isD = d && d.id === p.id;
      if (m.t === 'pickword') { if (isD) pickWord(r, String(m.word)); return; }
      if (m.t === 'stroke') {
        if (!isD || g.sub !== 'draw' || !Array.isArray(m.pts) || m.pts.length > 60) return 'quiet';
        const pts = m.pts.slice(0, 60).map(q => [Math.max(0, Math.min(1000, +q[0] | 0)), Math.max(0, Math.min(1000, +q[1] | 0))]);
        const id = +m.id | 0; let s = g.strokes.find(x => x.id === id);
        if (!s) { if (g.strokes.length >= 500) return 'quiet'; s = { id, c: Math.max(0, Math.min(9, +m.c | 0)), w: Math.max(1, Math.min(4, +m.w | 0)), pts: [] }; g.strokes.push(s); }
        if (s.pts.length > 3000) return 'quiet';
        s.pts.push(...pts); g.n++;
        H.cast(r, { t: 'stroke', id, c: s.c, w: s.w, pts }, p);
        return 'quiet';
      }
      if (m.t === 'clear' || m.t === 'undo') {
        if (!isD || g.sub !== 'draw') return;
        if (m.t === 'clear') g.strokes = []; else g.strokes.pop();
        g.ver++; g.n = g.strokes.length; return;
      }
      if (m.t === 'sync') { H.sendTo(p, { t: 'strokes', ver: g.ver, list: g.strokes, n: g.n }); return 'quiet'; }
      if (m.t === 'guess') {
        if (g.sub !== 'draw' || isD || p.spec || g.guessed.includes(p.id)) return;
        if (!H.rate(p, 'gs', 400)) return;
        const text = String(m.text || '').trim().slice(0, 30); if (!text) return;
        if (same(text, g.word)) {
          const left = Math.max(0, r.deadline - Date.now()) / DRAW_MS, pts = 40 + Math.round(120 * left);
          g.scores[p.id] += pts; g.scores[d.id] = (g.scores[d.id] || 0) + 25; g.guessed.push(p.id);
          H.log(r, `${p.name} خمّن الكلمة! +${pts}`);
          if (g.guessed.length >= r.players.length - 1) endTurn(r, 'الكل خمّن');
        } else { g.guesses.push({ id: p.id, text }); if (g.guesses.length > 12) g.guesses.shift(); }
      }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const d = drawer(r), isD = !!d && d.id === p.id, show = isD || g.sub === 'reveal' || r.phase === 'over';
      return {
        sub: g.sub, drawer: d ? d.id : null, turn: Math.min(g.turn + 1, g.order.length), turns: g.order.length, scores: g.scores,
        word: show ? g.word : null, choices: isD && g.sub === 'choose' ? g.choices : null,
        hint: g.word ? hintOf(g) : '', len: g.word ? [...g.word].length : 0, guessed: g.guessed, guesses: g.guesses, ver: g.ver, n: g.n,
        done: g.guessed.includes(p.id)
      };
    },
    leave(r, p) {
      const g = r.g; if (!g) return;
      delete g.scores[p.id];
      const d = drawer(r);
      if (d && d.id === p.id && r.phase === 'play' && (g.sub === 'draw' || g.sub === 'choose')) { g.sub = 'draw'; endTurn(r, `${p.name} طلع`); }
    }
  };
};
