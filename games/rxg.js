// خمّن الرياكشن: يطلع رياكشن بدون كلامه (الصورة ممسوح منها الكلام، والمقطع واقف على أول لقطة)،
// والكل يختار من ٤ أو يكتب الجملة. بعد ما يجاوبون تنكشف الصورة الأصلية بكلامها أو يشتغل المقطع بصوته.
// المصدر: رياكشنات الفريق (games/rxg-pack.json + public/rxg/) + اللي انقبلت من صفحة الرفع /rx.
const PACK = require('./rxg-pack.json');
const SCALE = +process.env.RXG_SCALE || 1;
const INTRO_MS = 2500;
const rnd = n => Math.random() * n | 0;
const norm = s => String(s || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^ء-يa-z0-9]/gi, '').toLowerCase();
function lev(a, b) { const m = a.length, n = b.length; if (!m || !n) return m || n; let prev = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; }
// يقارن التخمين بالجواب وصيغه: 2 = صح، 1 = قريب، 0 = غلط
function judge(w, it) {
  const a = norm(w); if (!a) return 0; let best = 0;
  for (const c of [it.n, ...(it.a || [])]) {
    const b = norm(c); if (!b) continue; const d = lev(a, b);
    if (a === b || (b.length >= 4 && d <= Math.max(1, Math.round(b.length * .18)))) return 2;
    if (b.length >= 4 && d <= Math.round(b.length * .4)) best = 1;
  }
  return best;
}
const VEXT = ['mp4', 'webm', 'mov'];
function pool(H) {
  const seeds = PACK.map(x => ({ id: x.id, n: x.n, a: x.a || [], hint: x.hint || '', type: x.type, w: x.w, h2: x.h, q: `/rxg/${x.id}q.jpg`, f: x.type === 'vid' ? `/rxg/${x.id}.mp4` : `/rxg/${x.id}.jpg`, s: 0, e: null, d: x.d || 0 }));
  let up = []; try { up = (H.rxList ? H.rxList() : []).map(x => ({ id: 'u' + x.id, n: x.n, a: x.a || [], hint: '', type: VEXT.includes(x.ext) ? 'vid' : 'img', q: `/rx/${x.id}.${x.ext}`, f: `/rx/${x.id}.${x.ext}`, s: x.s || 0, e: x.e || null, d: x.d || 0, up: 1 })); } catch {}
  return seeds.concat(up);
}
module.exports = H => {
  const nm = (r, id) => (r.players.find(p => p.id === id) || {}).name || '؟';
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  function ask(r) {
    const g = r.g; g.k++; g.bt.forEach(clearTimeout); g.bt = [];
    const it = g.deck[(g.k - 1) % g.deck.length];
    // الخيارات: الصح + ٣ أجوبة من رياكشنات ثانية
    const others = H.shuffle(g.all.filter(x => x.id !== it.id && norm(x.n) !== norm(it.n))).slice(0, 3).map(x => x.n);
    const opts = H.shuffle([it.n, ...others]);
    g.cur = { it, opts, ok: opts.indexOf(it.n) };
    g.sub = 'q'; g.at = Date.now(); g.endAt = g.at + g.ms; g.ans = {}; g.gain = {}; g.first = null; g.tries = {}; g.plan = {};
    H.setTimer(r, g.ms, () => show(r));
    // البوتات
    g.plan = {};
    r.players.filter(p => p.bot).forEach(b => {
      const ms = g.ms * (.2 + Math.random() * .7), smart = Math.random() < .6;
      g.plan[b.id] = () => { delete g.plan[b.id]; if (g.sub !== 'q') return; if (g.mode === 'pick') answer(r, b, smart ? g.cur.ok : (g.cur.ok + 1 + rnd(Math.max(1, opts.length - 1))) % opts.length); else if (smart) guess(r, b, it.n); else g.ans[b.id] = { ok: false, none: 1 }; };
      later(r, ms, () => g.plan[b.id] && g.plan[b.id]());
    });
  }
  function score(r, p) {
    const g = r.g, t = Date.now() - g.at;
    const pts = 500 + Math.round(500 * Math.max(0, 1 - t / g.ms)) + (g.first ? 0 : 100);
    if (!g.first) { g.first = p.id; H.log(r, `⚡ ${p.name} أول واحد عرفه`); }
    g.scores[p.id] = (g.scores[p.id] || 0) + pts; g.gain[p.id] = pts;
  }
  // خلصوا الكل؟ لو الحقيقيين خلصوا، البوتات تجاوب على طول
  function allDone(r) {
    const g = r.g, hum = r.players.filter(q => !q.bot && !q.spec && q.online);
    if (!hum.every(q => g.ans[q.id])) return false;
    Object.values(g.plan || {}).forEach(f => f()); return true;
  }
  function answer(r, p, i) {
    const g = r.g; if (g.sub !== 'q' || p.spec || g.ans[p.id] || !(i >= 0 && i < g.cur.opts.length)) return;
    const ok = i === g.cur.ok; g.ans[p.id] = { i, ok };
    if (ok) score(r, p);
    if (allDone(r)) H.setTimer(r, 700, () => show(r)); else H.push(r);
  }
  function guess(r, p, w) {
    const g = r.g; if (g.sub !== 'q' || p.spec || g.ans[p.id]) return;
    const j = judge(w, g.cur.it);
    if (j === 2) { g.ans[p.id] = { ok: true, w: String(w).slice(0, 60) }; score(r, p); if (allDone(r)) H.setTimer(r, 700, () => show(r)); else H.push(r); return; }
    g.tries[p.id] = (g.tries[p.id] || 0) + 1;
    if (!p.bot) H.sendTo(p, { t: 'gnet', g: 'rxg', k: j === 1 ? 'close' : 'no' });
  }
  function show(r) {
    const g = r.g; if (g.sub !== 'q') return;
    g.sub = 'show'; g.bt.forEach(clearTimeout); g.bt = [];
    if (!Object.values(g.ans).some(a => a.ok)) H.log(r, `محد عرفه: «${g.cur.it.n}»`);
    const it = g.cur.it; let ms = 5000;
    if (it.type === 'vid') { const len = it.e != null ? it.e - it.s : it.d; ms = Math.min(22000, Math.max(5000, (len || 6) * 1000 + 2200)); }
    H.setTimer(r, ms * SCALE, () => g.k >= g.count ? end(r) : ask(r));
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end'; g.bt.forEach(clearTimeout);
    const top = Math.max(0, ...r.players.map(p => g.scores[p.id] || 0)), ws = r.players.filter(p => (g.scores[p.id] || 0) === top && top > 0);
    r.winner = ws.map(p => p.name).join(' و ') || 'محد'; r.winTeam = null; H.win(r, ws); H.setTimer(r, 0, null);
  }
  return {
    min: 1, max: 42,
    judge, // للاختبار
    start(r) {
      let all = pool(H);
      if (process.env.RXG_ONLY) all = all.filter(x => process.env.RXG_ONLY.split(',').includes(x.id)); // للاختبار
      const count = Math.min([5, 10, 15].includes(+r.opts.xrounds) ? +r.opts.xrounds : 10, all.length);
      const sec = [15, 20, 30].includes(+r.opts.xtime) ? +r.opts.xtime : 20;
      const mode = r.opts.xmode === 'type' ? 'type' : 'pick';
      r.g = { all, deck: H.shuffle(all.slice()), count, sec, ms: sec * 1000 * SCALE, mode, k: 0, sub: 'intro', cur: null, ans: {}, gain: {}, scores: {}, tries: {}, first: null, bt: [], at: 0, endAt: 0 };
      r.players.forEach(p => { r.g.scores[p.id] = 0; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      if (!all.length) { H.log(r, 'ما فيه رياكشنات'); return end(r); }
      H.log(r, `🎬 خمّن الرياكشن: ${count} رياكشنات`);
      H.setTimer(r, INTRO_MS * SCALE, () => ask(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'xa' && g.mode === 'pick') return answer(r, p, +m.i);
      if (m.t === 'xg' && g.mode === 'type') { if (!H.rate(p, 'xg', 400)) return 'quiet'; guess(r, p, String(m.w || '').slice(0, 80)); return 'quiet'; }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const c = g.cur, it = c && c.it, sh = g.sub === 'show' || g.sub === 'end';
      return {
        sub: g.sub, k: g.k, count: g.count, sec: g.sec, mode: g.mode, scores: g.scores, left: g.sub === 'q' ? Math.max(0, g.endAt - Date.now()) : 0,
        // السؤال: الصورة بدون كلام، أو المقطع واقف
        item: it && { id: it.id, type: it.type, q: it.q, s: it.s, e: it.e, w: it.w, h: it.h2, hint: it.hint || '' },
        opts: c && g.mode === 'pick' ? c.opts : null,
        done: Object.keys(g.ans), okIds: Object.keys(g.ans).filter(id => g.ans[id].ok && (sh || id === p.id || (g.ans[p.id] && g.ans[p.id].ok))),
        my: g.ans[p.id] ? { i: g.ans[p.id].i, ok: g.ans[p.id].ok } : null, tries: g.tries[p.id] || 0,
        first: g.first ? nm(r, g.first) : null,
        reveal: sh && it ? { n: it.n, f: it.f, type: it.type, s: it.s, e: it.e, ok: c.ok } : null,
        gain: sh ? g.gain : null, picks: sh && g.mode === 'pick' ? Object.fromEntries(Object.entries(g.ans).map(([id, a]) => [id, a.i])) : null
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (!r.players.length) return end(r);
      if (g.sub === 'q' && allDone(r)) H.setTimer(r, 700, () => show(r));
    }
  };
};
