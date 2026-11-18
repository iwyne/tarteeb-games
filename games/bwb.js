// بلاد ولد بنت: يطلع حرف، والكل يكتب بكل خانة كلمة تبدأ فيه. اللي يخلص يضغط ستوب.
// المراجعة: الجواب اللي محد كتبه = ١٠، المكرر = ٥، الغلط أو الفاضي = ٠. والكل يقدر يصوت إن الجواب غلط.
const BOT = require('./bwb-words');
const SCALE = +process.env.BWB_SCALE || 1;
const COLS = ['ولد', 'بنت', 'بلاد', 'حيوان', 'نبات', 'جماد'];
const LETTERS = 'ا ب ت ج ح خ د ر ز س ش ص ع ف ق ك ل م ن ه و ي'.split(' ');
const STOP_MS = 5000, REV_MS = 22000, SUM_MS = 5000;
const norm = s => String(s || '').trim().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ');
const key = s => norm(s).replace(/^ال/, '').replace(/\s/g, '');
module.exports = H => {
  const rnd = n => Math.random() * n | 0;
  const okWord = (w, L) => { const n = norm(w); if (n.length < 2) return false; const l = norm(L); return n.startsWith(l) || (n.startsWith('ال') && n.slice(2).startsWith(l)) || (l === 'ا' && n.startsWith('ال')); };
  function newRound(r) {
    const g = r.g; g.k++;
    const pool = LETTERS.filter(x => !g.usedL.includes(x)); const L = pool[rnd(pool.length)]; g.usedL.push(L);
    g.L = L; g.sub = 'write'; g.ans = {}; g.stopBy = null; g.votes = {}; g.at = Date.now(); g.rev = null;
    r.players.forEach(p => { g.ans[p.id] = ['', '', '', '', '', '']; });
    H.log(r, `✏️ الجولة ${g.k}: حرف «${L}»`);
    g.endAt = Date.now() + g.ms;
    H.setTimer(r, g.ms, () => review(r));
    // البوتات
    g.bt.forEach(clearTimeout); g.bt = [];
    r.players.filter(p => p.bot).forEach(b => {
      const lst = BOT[L] || [];
      COLS.forEach((_, c) => {
        if (!lst[c] || Math.random() < .25) return;
        const ws = lst[c].split(' ');
        const t = setTimeout(() => { if (r.g === g && g.sub === 'write' && g.L === L) { g.ans[b.id][c] = ws[rnd(ws.length)]; H.push(r); } }, (6000 + rnd(Math.min(50000, g.ms - 8000))) * SCALE);
        g.bt.push(t);
      });
    });
  }
  function stop(r, p) {
    const g = r.g; if (g.sub !== 'write') return;
    g.sub = 'stopping'; g.stopBy = p.id; g.endAt = Date.now() + STOP_MS * SCALE;
    H.log(r, `✋ ${p.name} ضغط ستوب! باقي ٥ ثواني`);
    H.setTimer(r, STOP_MS * SCALE, () => review(r));
  }
  function score(r) {
    const g = r.g, ids = Object.keys(g.ans), voters = r.players.filter(p => !p.spec && g.ans[p.id]).length;
    const pts = {}, st = {};
    ids.forEach(id => { pts[id] = 0; st[id] = []; });
    COLS.forEach((_, c) => {
      const cnt = {};
      const valid = {};
      ids.forEach(id => {
        const w = g.ans[id][c], v = (g.votes[id + ':' + c] || []).length;
        valid[id] = okWord(w, g.L) && v * 2 < Math.max(2, voters - 1);
        if (valid[id]) { const k = key(w); cnt[k] = (cnt[k] || 0) + 1; }
      });
      ids.forEach(id => {
        const w = g.ans[id][c];
        if (!norm(w)) { st[id][c] = 0; return; }
        if (!valid[id]) { st[id][c] = 3; return; }
        const s = cnt[key(w)] > 1 ? 2 : 1; st[id][c] = s; pts[id] += s === 1 ? 10 : 5;
      });
    });
    return { pts, st };
  }
  function review(r) {
    const g = r.g; if (g.sub !== 'write' && g.sub !== 'stopping') return;
    g.bt.forEach(clearTimeout); g.bt = [];
    g.sub = 'rev'; g.endAt = Date.now() + REV_MS * SCALE;
    // البوتات يصوتون أحياناً على الأجوبة الغلط
    r.players.filter(p => p.bot).forEach(b => Object.keys(g.ans).forEach(id => { if (id === b.id) return; g.ans[id].forEach((w, c) => { if (norm(w) && !okWord(w, g.L) && Math.random() < .7) (g.votes[id + ':' + c] = g.votes[id + ':' + c] || []).push(b.id); }); }));
    H.setTimer(r, REV_MS * SCALE, () => sum(r));
    H.push(r);
  }
  function sum(r) {
    const g = r.g; if (g.sub !== 'rev') return;
    const { pts } = score(r);
    Object.entries(pts).forEach(([id, n]) => { g.scores[id] = (g.scores[id] || 0) + n; });
    g.last = pts; g.sub = 'sum'; g.endAt = Date.now() + SUM_MS * SCALE;
    const best = Object.entries(pts).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] > 0) { const p = r.players.find(q => q.id === best[0]); H.log(r, `⭐ أعلى نقاط بالجولة: ${p ? p.name : '؟'} (+${best[1]})`); }
    H.setTimer(r, SUM_MS * SCALE, () => g.k >= g.count ? end(r) : newRound(r));
    H.push(r);
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'over'; g.bt.forEach(clearTimeout);
    const top = Math.max(0, ...r.players.map(p => g.scores[p.id] || 0)), ws = r.players.filter(p => (g.scores[p.id] || 0) === top && top > 0);
    r.winner = ws.map(p => p.name).join(' و ') || 'محد'; H.win(r, ws); H.setTimer(r, 0, null);
  }
  return {
    min: 1, max: 42,
    start(r) {
      const count = [3, 5, 8].includes(+r.opts.brounds) ? +r.opts.brounds : 5;
      const sec = [60, 90, 120].includes(+r.opts.btime) ? +r.opts.btime : 90;
      r.g = { k: 0, count, sec, ms: sec * 1000 * SCALE, usedL: [], L: '', sub: 'write', ans: {}, votes: {}, scores: {}, stopBy: null, endAt: 0, bt: [], last: null };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.phase = 'play';
      H.log(r, `✏️ بلاد ولد بنت: ${count} جولات`);
      newRound(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || p.spec) return 'quiet';
      if (m.t === 'bw') {
        if (g.sub !== 'write' && g.sub !== 'stopping') return 'quiet';
        const c = +m.c; if (!(c >= 0 && c < 6) || !H.rate(p, 'bw' + c, 80)) return 'quiet';
        if (!g.ans[p.id]) g.ans[p.id] = ['', '', '', '', '', ''];
        const was = !!norm(g.ans[p.id][c]); g.ans[p.id][c] = String(m.v || '').slice(0, 24);
        return was === !!norm(g.ans[p.id][c]) ? 'quiet' : undefined; // نبث بس لما يتغير عدد الخانات المعبّاة
      }
      if (m.t === 'bwstop') {
        const a = g.ans[p.id]; if (!a || !a.every(w => okWord(w, g.L))) { H.err(p, 'عبّ كل الخانات بكلمات تبدأ بالحرف أول'); return 'quiet'; }
        stop(r, p); return;
      }
      if (m.t === 'bwvote') {
        if (g.sub !== 'rev' || m.id === p.id || !g.ans[m.id]) return 'quiet';
        const k = m.id + ':' + (+m.c), v = g.votes[k] = g.votes[k] || [];
        const i = v.indexOf(p.id); if (i >= 0) v.splice(i, 1); else v.push(p.id);
        return;
      }
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const show = g.sub === 'rev' || g.sub === 'sum' || r.phase === 'over';
      const filled = {}; Object.entries(g.ans).forEach(([id, a]) => { filled[id] = a.filter(w => norm(w)).length; });
      const o = { sub: g.sub, k: g.k, count: g.count, L: g.L, cols: COLS, scores: g.scores, stopBy: g.stopBy, filled, sec: g.sec, last: g.last,
        left: Math.max(0, g.endAt - Date.now()), mine: g.ans[p.id] || null };
      if (show) { const s = score(r); o.all = g.ans; o.st = s.st; o.pts = s.pts; o.votes = {}; Object.entries(g.votes).forEach(([k, v]) => { if (v.length) o.votes[k] = { n: v.length, me: v.includes(p.id) }; }); }
      return o;
    },
    leave(r) { if (r.phase === 'play' && !r.players.length) end(r); }
  };
};
