// خمّن المثل: المثل يجي إيموجي برسالة، وتحته خانات بعدد حروف كل كلمة. كل شوي ينكشف حرف.
// كل اللي يحلونه ياخذون نقاط (تقل كل ما انكشف حرف)، والأول ياخذ بونص.
const LIST = require('./emo-list');
const SCALE = +process.env.EMO_SCALE || 1;
const SHOW_MS = 5000, INTRO_MS = 2500;
const norm = s => String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^ء-يa-z0-9]/gi, '');
function lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
module.exports = H => {
  const rnd = n => Math.random() * n | 0;
  const nm = (r, id) => (r.players.find(p => p.id === id) || {}).name || '؟';
  function chat(g, m) { m.n = ++g.cn; g.chat.push(m); if (g.chat.length > 40) g.chat.shift(); }
  function ask(r) {
    const g = r.g; g.k++;
    let c = LIST.map((x, i) => i).filter(i => !g.used.has(i)); if (!c.length) { g.used.clear(); c = LIST.map((x, i) => i); }
    const i = c[rnd(c.length)]; g.used.add(i);
    const [text, emo] = LIST[i];
    const words = text.split(' ').map(w => [...w]);
    g.cur = { text, emo, words, shown: new Set(), slots: words.reduce((a, w, wi) => a.concat(w.map((_, ci) => wi + ':' + ci)), []) };
    g.sub = 'q'; g.at = Date.now(); g.endAt = g.at + g.ms; g.solved = []; g.chat = []; g.cn = 0;
    chat(g, { sys: 1, t: `المثل ${g.k} من ${g.count} 👇`, emo });
    H.setTimer(r, g.ms, () => show(r));
    // كشف الحروف: لين ٤٠٪ من الحروف على طول الوقت
    g.bt.forEach(clearTimeout); g.bt = [];
    const total = g.cur.slots.length, toShow = Math.max(2, Math.round(total * .4)), step = g.ms / (toShow + 1);
    for (let s = 1; s <= toShow; s++) g.bt.push(setTimeout(() => reveal(r), step * s));
    // البوتات
    r.players.filter(p => p.bot).forEach(b => {
      const when = g.ms * (.25 + Math.random() * .9);
      if (when < g.ms - 500) g.bt.push(setTimeout(() => { if (g.sub === 'q' && Math.random() < .75) guess(r, b, g.cur.text); }, when));
      if (Math.random() < .5) g.bt.push(setTimeout(() => { if (g.sub === 'q') guess(r, b, LIST[rnd(LIST.length)][0]); }, g.ms * Math.random() * .6));
    });
  }
  function reveal(r) {
    const g = r.g; if (g.sub !== 'q') return;
    const hid = g.cur.slots.filter(s => !g.cur.shown.has(s)); if (hid.length <= 1) return;
    g.cur.shown.add(hid[rnd(hid.length)]); H.push(r);
  }
  function guess(r, p, w) {
    const g = r.g; if (g.sub !== 'q' || g.solved.includes(p.id)) return;
    const a = norm(w), b = norm(g.cur.text); if (!a) return;
    if (a === b) {
      const pts = Math.max(10, 30 - g.cur.shown.size * 4) + (g.solved.length === 0 ? 5 : 0);
      g.solved.push(p.id); g.scores[p.id] = (g.scores[p.id] || 0) + pts;
      chat(g, { id: p.id, ok: 1, pts });
      if (g.solved.length === 1) H.log(r, `✅ ${p.name} أول واحد حل المثل (+${pts})`);
      const need = r.players.filter(q => !q.spec).length;
      if (g.solved.length >= need) show(r); else H.push(r);
      return;
    }
    if (b.length > 6 && lev(a, b) <= Math.max(2, Math.round(b.length * .12))) { if (!p.bot) H.sendTo(p, { t: 'gnet', g: 'emo', k: 'close' }); return; }
    chat(g, { id: p.id, t: String(w).slice(0, 60) }); H.push(r);
  }
  function show(r) {
    const g = r.g; if (g.sub !== 'q') return;
    g.sub = 'show'; g.bt.forEach(clearTimeout); g.bt = [];
    chat(g, { sys: 1, t: g.solved.length ? `✅ حلّوها: ${g.solved.map(id => nm(r, id)).join('، ')}` : '⏱ خلص الوقت ومحد حلّها' });
    if (!g.solved.length) H.log(r, `⏱ محد حل المثل: «${g.cur.text}»`);
    H.setTimer(r, SHOW_MS * SCALE, () => g.k >= g.count ? end(r) : ask(r));
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
      const count = [5, 8, 12].includes(+r.opts.erounds) ? +r.opts.erounds : 8;
      const sec = [30, 45, 60].includes(+r.opts.emtime) ? +r.opts.emtime : 45;
      r.g = { k: 0, count, sec, ms: sec * 1000 * SCALE, used: new Set(), cur: null, sub: 'intro', scores: {}, solved: [], chat: [], cn: 0, bt: [], endAt: 0 };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.phase = 'play';
      H.log(r, `💬 خمّن المثل: ${count} أمثال`);
      H.setTimer(r, INTRO_MS * SCALE, () => ask(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || m.t !== 'eg' || p.spec || !H.rate(p, 'eg', 500)) return 'quiet';
      guess(r, p, String(m.w || '').slice(0, 80)); return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const c = g.cur, sh = g.sub !== 'q';
      const board = c ? c.words.map((w, wi) => w.map((ch, ci) => sh || g.solved.includes(p.id) || c.shown.has(wi + ':' + ci) ? ch : '')) : null;
      const chatV = g.chat.map(m => m.id ? Object.assign({}, m, { name: nm(r, m.id) }) : m);
      return { sub: g.sub, k: g.k, count: g.count, sec: g.sec, emo: c ? c.emo : null, board, text: sh && c ? c.text : null, chat: chatV, solved: g.solved, mine: g.solved.includes(p.id),
        scores: g.scores, left: g.sub === 'q' ? Math.max(0, g.endAt - Date.now()) : 0, worth: c ? Math.max(10, 30 - c.shown.size * 4) : 30 };
    },
    leave(r) { if (r.phase === 'play' && !r.players.length) end(r); }
  };
};
