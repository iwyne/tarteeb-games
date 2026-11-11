// برا السالفة: الكل يعرف الفئة والكلمة إلا واحد (برا السالفة). تلميحات ثم تصويت.
const CATS = require('./outside-words');
const { same } = require('./hive');
const CLUE_MS = 30000, VOTE_MS = 60000, GUESS_MS = 30000, ROUNDS = 2;
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  function finish(r, spyWins, why) {
    const g = r.g; g.sub = 'reveal'; r.phase = 'over'; g.spyWins = spyWins;
    r.winner = spyWins ? 'برا السالفة: ' + byId(r, g.spy)?.name : 'اللي داخل السالفة';
    H.log(r, why);
    const spy = byId(r, g.spy);
    H.win(r, spyWins ? (spy ? [spy] : []) : r.players.filter(p => p.id !== g.spy));
    H.setTimer(r, 0, null);
  }
  function startClue(r) {
    const g = r.g; g.sub = 'clue';
    H.setTimer(r, CLUE_MS, () => { clue(r, byId(r, g.order[g.idx]), '—'); });
  }
  function clue(r, p, text) {
    const g = r.g; if (!p || g.sub !== 'clue' || g.order[g.idx] !== p.id) return;
    g.clues.push({ id: p.id, text: String(text).slice(0, 24), round: g.round });
    g.idx++;
    if (g.idx >= g.order.length) { g.idx = 0; g.round++; }
    if (g.round > ROUNDS) return startVote(r);
    startClue(r);
  }
  function startVote(r) {
    const g = r.g; g.sub = 'vote'; g.votes = {};
    H.log(r, 'وقت التصويت — مين برا السالفة؟');
    H.setTimer(r, VOTE_MS, () => tally(r));
  }
  function tally(r) {
    const g = r.g; if (g.sub !== 'vote') return;
    const c = {}; Object.values(g.votes).forEach(t => { c[t] = (c[t] || 0) + 1; });
    const top = Math.max(0, ...Object.values(c)), lead = Object.keys(c).filter(k => c[k] === top);
    g.tally = c; g.accused = lead.length === 1 ? lead[0] : null;
    if (g.accused === g.spy) {
      g.sub = 'guess'; H.log(r, `انكشف ${byId(r, g.spy).name}! عنده فرصة يخمّن الكلمة`);
      H.setTimer(r, GUESS_MS, () => finish(r, false, 'ما خمّن الكلمة في الوقت'));
    } else finish(r, true, g.accused ? `صوّتوا على ${byId(r, g.accused)?.name || '؟'} وكان بريء — برا السالفة نجا!` : 'تعادل بالأصوات — برا السالفة نجا!');
  }
  return {
    min: 3, max: 10,
    start(r) {
      const cats = Object.keys(CATS), cat = cats[Math.random() * cats.length | 0];
      const word = CATS[cat][Math.random() * CATS[cat].length | 0];
      const order = H.shuffle(r.players.map(p => p.id));
      r.g = { cat, word, spy: r.players[Math.random() * r.players.length | 0].id, order, idx: 0, round: 1, clues: [], votes: {}, sub: 'clue', accused: null, tally: null, spyWins: null, guess: null };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, `الفئة: ${cat} — واحد منكم ما يعرف الكلمة!`);
      startClue(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'clue') {
        const t = String(m.text || '').trim().split(/\s+/)[0]; if (!t) return;
        if (t.length > 24) return;
        if (p.id !== g.spy && same(t, g.word)) return H.err(p, 'لا تكتب الكلمة نفسها!');
        clue(r, p, t);
      } else if (m.t === 'vote') {
        if (g.sub !== 'vote' || !byId(r, m.id) || m.id === p.id) return;
        g.votes[p.id] = m.id;
        if (r.players.every(q => g.votes[q.id])) tally(r);
      } else if (m.t === 'guess') {
        if (g.sub !== 'guess' || p.id !== g.spy) return;
        g.guess = String(m.text || '').slice(0, 30);
        finish(r, same(g.guess, g.word), same(g.guess, g.word) ? `خمّن الكلمة صح: ${g.word}` : `خمّن «${g.guess}» والكلمة ${g.word}`);
      }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const spy = !p.spec && p.id === g.spy, over = r.phase === 'over';
      return {
        cat: g.cat, word: over || (!spy && !p.spec) ? g.word : null, role: p.spec ? 'spec' : spy ? 'spy' : 'in',
        sub: g.sub, turn: g.sub === 'clue' ? g.order[g.idx] : null, round: Math.min(g.round, ROUNDS), rounds: ROUNDS, clues: g.clues,
        voted: Object.keys(g.votes), myVote: g.votes[p.id] || null, accused: g.sub === 'vote' ? null : g.accused,
        tally: g.sub === 'vote' ? null : g.tally, votes: g.sub === 'vote' ? null : g.votes, spy: over ? g.spy : null,
        spyWins: g.spyWins, guess: g.guess
      };
    },
    leave(r, p) {
      const g = r.g; if (!g) return;
      if (p.id === g.spy) return finish(r, false, 'برا السالفة هرب!');
      const i = g.order.indexOf(p.id);
      if (i >= 0) { g.order.splice(i, 1); if (i < g.idx) g.idx--; else if (i === g.idx && g.sub === 'clue') { if (g.idx >= g.order.length) { g.idx = 0; g.round++; } if (g.round > ROUNDS) startVote(r); else startClue(r); } }
      delete g.votes[p.id]; Object.keys(g.votes).forEach(k => { if (g.votes[k] === p.id) delete g.votes[k]; });
      if (g.sub === 'vote' && r.players.every(q => g.votes[q.id])) tally(r);
    }
  };
};
