// خلية الحروف: لوحة سداسيات ٥×٥. الأحمر يربط من فوق لتحت، والأزرق من اليمين لليسار.
// تختار خلية، يجاوب فريقك على سؤال جوابه يبدأ بالحرف، لو غلط الخصم يسرقها.
const QS = require('./questions');
const N = 5;
const norm = s => String(s || '').toLowerCase()
  .replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^ء-يa-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().replace(/^ال/, '').replace(/ ال/g, ' ');
const full = s => String(s || '').toLowerCase()
  .replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^\u0621-\u064Aa-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const same = (a, b) => { const x = full(a), y = full(b); return x === y || norm(x) === norm(y); };
const LETTERS = [...new Set(QS.map(q => norm(q.l)))];
const NB = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, -1]]; // جيران سداسي في لوحة معينية

function connected(cells, t) { // الفريق ٠: صف ٠ → صف ٤، الفريق ١: عمود ٠ → عمود ٤
  const seen = new Set(), st = [];
  for (let i = 0; i < N; i++) { const [r, c] = t === 0 ? [0, i] : [i, 0]; if (cells[r * N + c].o === t) { st.push([r, c]); seen.add(r * N + c); } }
  while (st.length) {
    const [r, c] = st.pop();
    if (t === 0 ? r === N - 1 : c === N - 1) return true;
    for (const [dr, dc] of NB) {
      const a = r + dr, b = c + dc, k = a * N + b;
      if (a < 0 || b < 0 || a >= N || b >= N || seen.has(k) || cells[k].o !== t) continue;
      seen.add(k); st.push([a, b]);
    }
  }
  return false;
}

module.exports = H => {
  const team = (r, t) => r.players.filter(p => p.team === t);
  const TIMES = { pick: 45000, answer: 30000, steal: 30000 };
  function setSub(r, sub) {
    const g = r.g; g.sub = sub;
    H.setTimer(r, TIMES[sub], () => timeout(r));
  }
  function pickQuestion(r, letter) {
    const g = r.g;
    let pool = QS.filter(q => norm(q.l) === letter && !g.used.has(q));
    if (!pool.length) { QS.filter(q => norm(q.l) === letter).forEach(q => g.used.delete(q)); pool = QS.filter(q => norm(q.l) === letter); }
    const q = pool[Math.random() * pool.length | 0]; g.used.add(q); return q;
  }
  function resolve(r, winnerTeam) { // winnerTeam: الفريق اللي كسب الخلية أو null
    const g = r.g, cell = g.cells[g.cell], q = g.q;
    if (winnerTeam !== null) cell.o = winnerTeam;
    H.log(r, winnerTeam === null ? `ما أحد جاوب — الجواب: ${q.a[0]}` : `فريق ${['أ', 'ب'][winnerTeam]} أخذ حرف ${cell.l}`);
    g.result = { cell: g.cell, ok: winnerTeam, ans: q.a[0] };
    if (winnerTeam !== null && connected(g.cells, winnerTeam)) {
      r.phase = 'over'; r.winTeam = winnerTeam; r.score[winnerTeam]++; r.winner = 'فريق ' + ['أ', 'ب'][winnerTeam];
      H.log(r, `${r.winner} وصّل الخلية!`); H.win(r, team(r, winnerTeam));
      return;
    }
    g.turn = 1 - g.picker; g.q = null; g.cell = null; setSub(r, 'pick');
  }
  function timeout(r) {
    const g = r.g; if (!g || r.phase !== 'play') return;
    if (g.sub === 'pick') {
      const free = g.cells.map((c, i) => c.o === null ? i : -1).filter(i => i >= 0);
      if (free.length) pick(r, free[Math.random() * free.length | 0]);
    } else if (g.sub === 'answer') { H.log(r, 'انتهى الوقت'); setSub(r, 'steal'); }
    else resolve(r, null);
  }
  function pick(r, i) {
    const g = r.g, c = g.cells[i]; if (!c || c.o !== null) return;
    g.cell = i; g.picker = g.turn; g.q = pickQuestion(r, norm(c.l)); g.result = null; setSub(r, 'answer');
  }
  return {
    min: 2, max: 10,
    start(r) {
      r.players.forEach((p, i) => { p.team = i % 2; });
      const letters = H.shuffle(LETTERS.slice()).slice(0, N * N);
      r.g = { cells: letters.map(l => ({ l, o: null })), turn: Math.random() < .5 ? 0 : 1, sub: 'pick', cell: null, q: null, picker: 0, used: new Set(), result: null };
      r.winTeam = null; r.winner = null; r.phase = 'play';
      H.log(r, `بدأت اللعبة — يبدأ فريق ${['أ', 'ب'][r.g.turn]}`);
      setSub(r, 'pick');
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'pick') {
        if (g.sub !== 'pick' || p.team !== g.turn) return;
        pick(r, m.i | 0);
      } else if (m.t === 'answer') {
        const want = g.sub === 'answer' ? g.turn : g.sub === 'steal' ? 1 - g.picker : -1;
        if (p.team !== want || !H.rate(p, 'a', 600)) return;
        const t = norm(m.text); if (!t) return;
        const ok = g.q.a.some(a => same(a, m.text));
        if (ok) resolve(r, p.team);
        else if (g.sub === 'answer') { H.log(r, `${p.name}: «${String(m.text).slice(0, 24)}» غلط — الخصم يسرقها`); setSub(r, 'steal'); }
        else { H.log(r, `${p.name}: «${String(m.text).slice(0, 24)}» غلط`); resolve(r, null); }
      }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      return {
        cells: g.cells, turn: g.turn, sub: g.sub, cell: g.cell, picker: g.picker,
        q: g.q ? { q: g.q.q, l: g.q.l } : null, result: g.result,
        answering: g.sub === 'answer' ? g.turn : g.sub === 'steal' ? 1 - g.picker : null
      };
    },
    leave(r) {
      for (const t of [0, 1]) if (!team(r, t).length) {
        r.phase = 'over'; r.winTeam = 1 - t; r.score[1 - t]++; r.winner = 'فريق ' + ['أ', 'ب'][1 - t];
        H.log(r, `فريق ${['أ', 'ب'][t]} ما بقى فيه أحد`); H.win(r, team(r, 1 - t)); return;
      }
    }
  };
};
module.exports.norm = norm; module.exports.full = full; module.exports.same = same;
