// برا السالفة: الكل يعرف الفئة والكلمة إلا واحد (برا السالفة). تلميحات ثم تصويت.
const CATS = require('./outside-words');
const { same } = require('./hive');
const VOTE_MS = 60000, GUESS_MS = 30000;
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
  const ASK_MS = 25000, QA_MS = 45000;
  function startAsk(r) {
    const g = r.g; g.sub = 'ask'; g.target = null;
    H.setTimer(r, ASK_MS, () => { const o = choices(r); if (o.length) ask(r, byId(r, g.asker), o[Math.random() * o.length | 0]); });
  }
  const choices = r => { const g = r.g, all = r.players.map(p => p.id).filter(id => id !== g.asker), o = all.filter(id => id !== g.prev); return o.length ? o : all; };
  function ask(r, p, tid) {
    const g = r.g; if (!p || g.sub !== 'ask' || g.asker !== p.id) return;
    if (!choices(r).includes(tid)) return;
    g.target = tid; g.sub = 'qa'; g.hist.push({ from: p.id, to: tid });
    H.setTimer(r, QA_MS, () => next(r));
  }
  function next(r) {
    const g = r.g; if (g.sub !== 'qa') return;
    g.count++;
    if (g.count >= g.total) return startVote(r);
    g.prev = g.asker; g.asker = g.target; startAsk(r);
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
      g.sub = 'guess'; g.target = null; H.log(r, `انكشف ${byId(r, g.spy).name}! عنده فرصة يخمّن الكلمة`);
      H.setTimer(r, GUESS_MS, () => finish(r, false, 'ما خمّن الكلمة في الوقت'));
    } else finish(r, true, g.accused ? `صوّتوا على ${byId(r, g.accused)?.name || '؟'} وكان بريء — برا السالفة نجا!` : 'تعادل بالأصوات — برا السالفة نجا!');
  }
  return {
    min: 3, max: 10,
    start(r) {
      const cats = Object.keys(CATS), cat = cats[Math.random() * cats.length | 0];
      const word = CATS[cat][Math.random() * CATS[cat].length | 0];
      const order = H.shuffle(r.players.map(p => p.id));
      r.g = { cat, word, spy: r.players[Math.random() * r.players.length | 0].id, order, asker: order[0], prev: null, target: null, hist: [], count: 0, total: r.players.length * 2, opts: H.shuffle([word, ...H.shuffle(CATS[cat].filter(w => w !== word)).slice(0, 7)]), votes: {}, sub: 'ask', accused: null, tally: null, spyWins: null, guess: null };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, `الفئة: ${cat} — واحد منكم ما يعرف الكلمة!`);
      startAsk(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'ask') ask(r, p, m.id);
      else if (m.t === 'done') { if (g.sub === 'qa' && p.id === g.target) next(r); }
      else if (m.t === 'tovote') { if (r.host === p.id && (g.sub === 'ask' || g.sub === 'qa')) startVote(r); }
      else if (m.t === 'vote') {
        if (g.sub !== 'vote' || !byId(r, m.id) || m.id === p.id) return;
        g.votes[p.id] = m.id;
        if (r.players.every(q => g.votes[q.id])) tally(r);
      } else if (m.t === 'guess') {
        if (g.sub !== 'guess' || p.id !== g.spy || !g.opts.includes(String(m.text))) return;
        g.guess = String(m.text || '').slice(0, 30);
        finish(r, same(g.guess, g.word), same(g.guess, g.word) ? `خمّن الكلمة صح: ${g.word}` : `خمّن «${g.guess}» والكلمة ${g.word}`);
      }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const spy = !p.spec && p.id === g.spy, over = r.phase === 'over';
      return {
        cat: g.cat, word: over || (!spy && !p.spec) ? g.word : null, role: p.spec ? 'spec' : spy ? 'spy' : 'in',
        sub: g.sub, asker: g.asker, target: g.target, prev: g.prev, hist: g.hist.slice(-8), count: g.count, total: g.total, canAsk: g.sub === 'ask' && g.asker === p.id ? choices(r) : null, opts: g.sub === 'guess' && spy ? g.opts : null,
        voted: Object.keys(g.votes), myVote: g.votes[p.id] || null, accused: g.sub === 'vote' ? null : g.accused,
        tally: g.sub === 'vote' ? null : g.tally, votes: g.sub === 'vote' ? null : g.votes, spy: over ? g.spy : null,
        spyWins: g.spyWins, guess: g.guess
      };
    },
    leave(r, p) {
      const g = r.g; if (!g) return;
      if (p.id === g.spy) return finish(r, false, 'برا السالفة هرب!');
      const i = g.order.indexOf(p.id); if (i >= 0) g.order.splice(i, 1);
      if (g.sub === 'ask' || g.sub === 'qa') {
        if (g.asker === p.id || (g.sub === 'qa' && g.target === p.id)) {
          const rest = r.players.filter(q => q.id !== p.id).map(q => q.id);
          if (g.prev === p.id) g.prev = null;
          g.asker = rest.find(id => id !== g.prev) || rest[0]; g.sub = 'ask'; g.target = null; startAsk(r);
        }
        if (g.prev === p.id) g.prev = null;
      }
      delete g.votes[p.id]; Object.keys(g.votes).forEach(k => { if (g.votes[k] === p.id) delete g.votes[k]; });
      if (g.sub === 'vote' && r.players.every(q => g.votes[q.id])) tally(r);
    }
  };
};
