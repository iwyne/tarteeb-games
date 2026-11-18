// جوابك الترتيب: سؤال «شي…»، الكل يكتب أجوبته بنفس الوقت.
// النقاط = نقاط الجواب لو كان من أشهر ٦ أجوبة + بونص «جوابهم» (٥ عن كل لاعب كتب نفس جوابك)
const QJ = require('./jwb-q'), QF = require('./feud-q');
const SCALE = +process.env.JWB_SCALE || 1;
const SC_MS = 4500, TILE_MS = 1000, REV_BASE = 1600, REV_TAIL = 2600, BONUS = 5;
const rnd = n => Math.random() * n | 0;
const norm = s => String(s || '').toLowerCase().replace(/[ً-ْـٰ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N} ]+/gu, '').replace(/\s+/g, ' ').trim()
  .split(' ').map(w => w.replace(/^(وال|بال|فال|ال)(?=..)/, '')).join(' ');
// جذع خفيف: «لحمة/لحم»، «سمكة/سمك»، «سيارات/سيارة» تعتبر نفس الكلمة
const stem = s => s.split(' ').map(w => w.length > 3 ? w.replace(/(ات|ه)$/, '') : w).join(' ');
// كل الأسئلة بدون تكرار (لو نفس السؤال موجود بالبنكين ناخذ نسخة «جوابك»)
const BANK = (() => { const seen = new Set(), out = []; for (const q of [...QJ, ...QF]) { const k = norm(q.q); if (seen.has(k)) continue; seen.add(k); out.push(q); } return out; })();
const WRONG = ['كرسي', 'بطاطس', 'سيارة', 'قطو', 'نوم', 'شاي', 'ماي', 'جوال', 'فلوس', 'رز', 'كتاب'];

module.exports = H => {
  const BK = require('./botkit')(H, SCALE);
  const byId = (r, id) => r.players.find(p => p.id === id);
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  // يرجع رقم الجواب باللوحة (٠ = الأشهر) أو -1 — نختار أطول صيغة طابقت
  function match(q, text) {
    const t = stem(norm(text)); if (!t) return -1;
    let best = -1, bl = 0;
    for (let i = 0; i < q.a.length; i++) {
      const [ans, , ...alts] = q.a[i];
      for (const k of [ans, ...alts].map(x => stem(norm(x)))) {
        if (!k) continue;
        const ok = k === t ? 1e3 : (k.length >= 3 && (' ' + t + ' ').includes(' ' + k + ' ')) ? k.length : (t.length >= 4 && k.includes(t)) ? t.length : 0;
        if (ok > bl) { bl = ok; best = i; }
      }
    }
    return best;
  }
  const allDone = (r, g) => r.players.every(p => g.done.has(p.id) || (g.ans[p.id] || []).length >= g.n || !p.online);

  function ask(r) {
    const g = r.g; g.k++; g.bt.forEach(clearTimeout); g.bt = [];
    g.q = g.deck[(g.k - 1) % g.deck.length]; g.sub = 'q'; g.ans = {}; g.done = new Set(); g.res = null; g.gain = {};
    g.mult = g.k === g.rounds ? 2 : 1;
    r.players.forEach(p => { g.ans[p.id] = []; });
    H.setTimer(r, g.time * 1000 * SCALE, () => reveal(r));
    // البوتات: تكتب من ١ إلى n أجوبة، أغلبها من اللوحة (الأشهر أكثر)
    // (لو كل اللاعبين الحقيقيين خلصوا، البوتات تخلص على طول)
    BK.clear(r);
    r.players.filter(p => p.bot).forEach(b => {
      const k = 1 + rnd(g.n), times = Array.from({ length: k }, () => 2000 + rnd(Math.max(1500, g.time * 550))).sort((a, c) => a - c);
      times.forEach(ms => BK.botLater(r, b, ms * SCALE, () => {
        let t;
        if (Math.random() < .72) { const w = g.q.a.map(a => a[1]); let x = rnd(w.reduce((s, v) => s + v, 0)), j = 0; while (x >= w[j]) x -= w[j++]; t = g.q.a[j][0]; }
        else t = WRONG[rnd(WRONG.length)];
        add(r, b, t);
      }));
      BK.botLater(r, b, (times[times.length - 1] + 800 + rnd(1500)) * SCALE, () => { if (g.sub === 'q') { g.done.add(b.id); if (allDone(r, g)) H.setTimer(r, 700, () => reveal(r)); } });
    });
  }
  const humansFinished = (r, g) => BK.humansDone(r, p => g.done.has(p.id) || (g.ans[p.id] || []).length >= g.n);
  function add(r, p, text) {
    const g = r.g; if (g.sub !== 'q' || p.spec) return;
    const L = g.ans[p.id] || (g.ans[p.id] = []);
    const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    if (!t || !norm(t)) return;
    if (L.length >= g.n) return p.bot ? null : H.err(p, `كتبت ${g.n} أجوبة خلاص`);
    // نفس الجواب مرتين (أو نفس خانة اللوحة) ما ينحسب
    const bi = match(g.q, t), nk = stem(norm(t));
    if (L.some(a => stem(norm(a)) === nk || (bi >= 0 && match(g.q, a) === bi))) return p.bot ? null : H.err(p, 'كتبت هالجواب قبل');
    L.push(t);
    if (!p.bot && humansFinished(r, g)) BK.hurry(r);
    if (allDone(r, g)) H.setTimer(r, 700, () => reveal(r));
  }
  function reveal(r) {
    const g = r.g; if (g.sub !== 'q') return;
    g.sub = 'rev'; g.bt.forEach(clearTimeout); g.bt = []; g.revAt = Date.now();
    const q = g.q, groups = new Map(); // key → { bi, t, ids:Set }
    const mine = {};
    for (const p of r.players) {
      mine[p.id] = [];
      for (const t of g.ans[p.id] || []) {
        const bi = match(q, t), key = bi >= 0 ? 'b' + bi : 'x' + stem(norm(t));
        if (!groups.has(key)) groups.set(key, { bi, t: bi >= 0 ? q.a[bi][0] : t, ids: new Set() });
        const gr = groups.get(key); if (gr.ids.has(p.id)) continue;
        gr.ids.add(p.id); mine[p.id].push({ t, key });
      }
    }
    for (const p of r.players) {
      let sum = 0;
      mine[p.id] = mine[p.id].map(({ t, key }) => {
        const gr = groups.get(key), others = gr.ids.size - 1;
        const base = gr.bi >= 0 ? q.a[gr.bi][1] : 0, bonus = others * BONUS;
        const pts = (base + bonus) * g.mult; sum += pts;
        return { t, bi: gr.bi, base: base * g.mult, bonus: bonus * g.mult, pts };
      });
      g.gain[p.id] = sum; g.scores[p.id] = (g.scores[p.id] || 0) + sum;
    }
    g.res = {
      board: q.a.map((a, i) => ({ t: a[0], p: a[1] * g.mult, who: groups.has('b' + i) ? [...groups.get('b' + i).ids] : [] })),
      same: [...groups.values()].filter(x => x.bi < 0 && x.ids.size >= 2).map(x => ({ t: x.t, who: [...x.ids] })).slice(0, 6),
      mine
    };
    const revMs = REV_BASE + q.a.length * TILE_MS + (g.res.same.length ? 1400 : 0) + REV_TAIL;
    H.setTimer(r, revMs * SCALE, () => { g.sub = 'sc'; H.setTimer(r, SC_MS * SCALE, () => g.k >= g.rounds ? end(r) : ask(r)); });
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end';
    const top = Math.max(0, ...r.players.map(p => g.scores[p.id] || 0)), ws = r.players.filter(p => (g.scores[p.id] || 0) === top);
    r.winner = ws.map(p => p.name).join(' و ') || 'انتهت اللعبة'; r.winTeam = null; H.win(r, ws); H.setTimer(r, 0, null);
  }
  return {
    min: 2, max: 42,
    start(r) {
      const rounds = [5, 7, 10].includes(r.opts.jrounds) ? r.opts.jrounds : 7;
      r.g = {
        rounds, k: 0, time: [20, 30, 45].includes(r.opts.jtime) ? r.opts.jtime : 30, n: [1, 3, 5].includes(r.opts.jn) ? r.opts.jn : 3,
        deck: H.shuffle([...BANK]).slice(0, rounds), q: null, sub: 'intro', ans: {}, done: new Set(), res: null, scores: {}, gain: {}, mult: 1, bt: [], revAt: 0
      };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'اكتب الأجوبة اللي تتوقع الناس يقولونها');
      H.setTimer(r, 2600 * SCALE, () => ask(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'jans') return add(r, p, m.text);
      if (m.t === 'jdel') { if (g.sub !== 'q') return; const L = g.ans[p.id] || []; const i = +m.i; if (i >= 0 && i < L.length) L.splice(i, 1); g.done.delete(p.id); return; }
      if (m.t === 'jdone') { if (g.sub !== 'q') return; g.done.add(p.id); if (humansFinished(r, g)) BK.hurry(r); if (allDone(r, g)) H.setTimer(r, 700, () => reveal(r)); return; }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const sh = g.sub === 'rev' || g.sub === 'sc' || g.sub === 'end';
      return {
        sub: g.sub, k: g.k, rounds: g.rounds, n: g.n, time: g.time, mult: g.mult, scores: g.scores, gain: sh ? g.gain : null,
        q: g.q ? g.q.q : null, my: (g.ans[p.id] || []).slice(), done: [...g.done],
        prog: Object.fromEntries(r.players.map(q => [q.id, (g.ans[q.id] || []).length])),
        res: sh ? g.res : null, rel: g.sub === 'rev' ? Date.now() - g.revAt : null
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      delete g.ans[p.id]; g.done.delete(p.id);
      if (g.sub === 'q' && r.players.length && allDone(r, g)) H.setTimer(r, 700, () => reveal(r));
    },
    _match: match, _bank: BANK
  };
};
