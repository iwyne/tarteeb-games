// ترتيب ديل: لعبة أوراق مدن سعودية (فكرة مونوبولي ديل). كل دور تسحب ورقتين وتلعب ٣ حركات.
// اللي يكمّل عدد المجموعات المطلوب (٣ افتراضياً) يفوز. أوراق حركة تسرق وتطالب، و«لا شكراً» تلغي.
// إضافات: مدينتك المفضلة، أحداث كل ٥ أدوار، مزاد، تحالفات، متفرجين يصوّتون، ملخص آخر اللعبة.
const SCALE = +process.env.DEAL_SCALE || 1;
const SETS = {
  bisha: { n: 'بيشة', size: 2, rent: [1, 2], v: 1 }, taif: { n: 'الطائف', size: 2, rent: [1, 2], v: 1 },
  hail: { n: 'حائل', size: 3, rent: [1, 2, 4], v: 2 }, qassim: { n: 'القصيم', size: 3, rent: [1, 2, 4], v: 2 },
  hofuf: { n: 'الهفوف', size: 3, rent: [2, 3, 5], v: 2 }, jazan: { n: 'جازان', size: 3, rent: [2, 3, 5], v: 2 },
  durrah: { n: 'الدرّة', size: 3, rent: [2, 4, 6], v: 3 }, tabuk: { n: 'تبوك', size: 3, rent: [2, 4, 6], v: 3 },
  abha: { n: 'أبها', size: 3, rent: [2, 4, 6], v: 3 }, khobar: { n: 'الخبر', size: 3, rent: [2, 4, 7], v: 3 },
  ula: { n: 'العُلا', size: 3, rent: [3, 5, 8], v: 4 }, jeddah: { n: 'جدة', size: 3, rent: [3, 5, 8], v: 4 },
  diriyah: { n: 'الدرعية', size: 2, rent: [3, 6], v: 4 }, riyadh: { n: 'الرياض', size: 2, rent: [4, 8], v: 4 },
  train: { n: 'قطار سار', size: 4, rent: [1, 2, 3, 4], v: 2, nb: 1 }, util: { n: 'الخدمات', size: 2, rent: [1, 2], v: 2, nb: 1 }
};
const ACTS = {
  big: { n: 'الصفقة الكبرى', v: 5, c: 2, opt: 'dxbig' }, take: { n: 'خذها', v: 3, c: 3 }, swap: { n: 'بدّل', v: 3, c: 3 },
  no: { n: 'لا شكراً', v: 4, c: 3 }, debt: { n: 'دَين', v: 3, c: 3 }, eid: { n: 'عيدية', v: 2, c: 3 },
  draw: { n: 'اسحب ورقتين', v: 1, c: 8 }, double: { n: 'دبّل الإيجار', v: 1, c: 2 }, rent: { n: 'إيجار', v: 1, c: 9 },
  house: { n: 'ملحق', v: 3, c: 3, opt: 'dxbld' }, tower: { n: 'برج', v: 4, c: 2, opt: 'dxbld' },
  wasta: { n: 'واسطة', v: 3, c: 2 }, faz: { n: 'فزعة', v: 3, c: 2 }, saher: { n: 'ساهر', v: 3, c: 2 }
};
const MONEY = [[1, 6], [2, 5], [3, 3], [4, 3], [5, 2], [10, 1]];
const EVENTS = ['season', 'rain', 'sale', 'auction', 'zakat', 'gift'];
const EVN = { season: 'موسم', rain: 'مطر', sale: 'تخفيضات', auction: 'مزاد', zakat: 'زكاة', gift: 'عيد' };
const TARGETED = ['big', 'take', 'swap', 'debt', 'saher', 'wasta'];
const HAND_MAX = 7, RESP_MS = 14000, PICK_MS = 15000, AUC_MS = 9000, ALLY_TURNS = 3, FINE = 5;
const num = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

module.exports = H => {
  const rnd = n => Math.random() * n | 0;
  const P = (r, id) => r.players.find(p => p.id === id);
  const nm = (r, id) => (P(r, id) || {}).name || '؟';
  const ms = x => x * SCALE;
  const opt = (r, k, d) => r.opts[k] === undefined ? d : r.opts[k];
  const cval = c => c.k === 'money' ? c.v : c.k === 'act' ? ACTS[c.a].v : c.k === 'land' ? SETS[c.s].v : 0;
  const setOf = c => c.k === 'wild' ? c.as : c.s;

  // ===== الكومة =====
  function deck(r) {
    const d = []; let id = 1;
    for (const [s, o] of Object.entries(SETS)) for (let i = 0; i < o.size; i++) d.push({ id: id++, k: 'land', s });
    for (let i = 0; i < 2; i++) d.push({ id: id++, k: 'wild' });
    for (const [v, c] of MONEY) for (let i = 0; i < c; i++) d.push({ id: id++, k: 'money', v });
    for (const [a, o] of Object.entries(ACTS)) { if (o.opt && opt(r, o.opt, 0)) continue; for (let i = 0; i < o.c; i++) d.push({ id: id++, k: 'act', a }); }
    r.g.nid = id; return H.shuffle(d);
  }
  function drawN(r, pl, n) {
    const g = r.g; let got = 0;
    for (let i = 0; i < n; i++) {
      if (!g.deck.length) { if (!g.disc.length) break; g.deck = H.shuffle(g.disc); g.disc = []; H.log(r, '🔄 الكومة خلصت، خلطنا المرمي'); }
      pl.hand.push(g.deck.pop()); got++;
    }
    return got;
  }
  const S = (r, id) => r.g.st[id];
  const worth = st => st.bank.reduce((a, c) => a + cval(c), 0) + Object.values(st.lands).flat().reduce((a, c) => a + cval(c), 0);
  const bankV = st => st.bank.reduce((a, c) => a + cval(c), 0);
  function complete(st, k) { const L = st.lands[k] || []; return L.length >= SETS[k].size; }
  const fullSets = st => Object.keys(st.lands).filter(k => complete(st, k));
  function rentOf(r, st, k) {
    const L = st.lands[k] || []; if (!L.length) return 0;
    const o = SETS[k]; let v = o.rent[Math.min(L.length, o.size) - 1];
    const full = complete(st, k);
    if (full) { const b = st.bld[k] || {}; if (b.h) v += 3; if (b.t) v += 4; if (st.fav === k) v += 1; }
    const fx = r.g.fx;
    if (fx && fx.key === 'season' && fx.city === k) v *= 2;
    if (fx && fx.key === 'sale') v = Math.max(1, v - 1);
    return v;
  }
  const allied = (r, a, b) => r.g.ally.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const allyOf = (r, id) => { const x = r.g.ally.find(x => x.a === id || x.b === id); return x ? (x.a === id ? x.b : x.a) : null; };

  // ===== الإحصائيات (للملخص والرسم البياني) =====
  function stat(r, id, k, v) { const s = r.g.stats[id] || (r.g.stats[id] = { stole: 0, paid: 0, got: 0, big: 0, nos: 0 }); s[k] += v; }
  function snap(r) { const g = r.g; g.hist.push(Object.fromEntries(g.order.map(id => [id, worth(S(r, id))]))); if (g.hist.length > 80) g.hist.splice(1, 1); }
  function feed(r, o) { const g = r.g; g.fxq = (g.fxq || 0) + 1; H.cast(r, Object.assign({ t: 'gnet', g: 'deal', n: g.fxq }, o)); }

  // ===== الأدوار =====
  function startTurn(r) {
    const g = r.g; if (r.phase !== 'play') return;
    g.turnNo++; const pl = P(r, g.turn); if (!pl) return nextTurn(r);
    g.mv = 3; g.sub = 'turn'; g.dbl = 0; g.allyReq = null;
    const got = drawN(r, pl, pl.hand.length ? 2 : 5);
    feed(r, { k: 'draw', id: pl.id, n: got });
    if (g.fx && g.turnNo > g.fx.until) { g.fx = null; }
    g.ally = g.ally.filter(x => g.turnNo <= x.until);
    if (g.turnNo > 1 && (g.turnNo - 1) % 5 === 0) { event(r); if (g.sub === 'auc') return; }
    turnTimer(r); bots(r);
  }
  function turnTimer(r) { const g = r.g; g.dl = Date.now() + ms(opt(r, 'dtime', 60) * 1000); H.setTimer(r, g.dl - Date.now(), () => { if (g.sub === 'turn') endTurn(r, true); }); }
  function nextTurn(r) {
    const g = r.g; if (r.phase !== 'play') return;
    const i = g.order.indexOf(g.turn); g.turn = g.order[(i + 1) % g.order.length];
    snap(r); startTurn(r); H.push(r);
  }
  function endTurn(r, auto) {
    const g = r.g; const pl = P(r, g.turn); if (!pl) return nextTurn(r);
    if (pl.hand.length > HAND_MAX) {
      if (auto) { discard(r, pl, pl.hand.slice().sort((a, b) => cval(a) - cval(b)).slice(0, pl.hand.length - HAND_MAX).map(c => c.id)); return; }
      g.sub = 'disc'; H.setTimer(r, ms(PICK_MS), () => { if (g.sub === 'disc') endTurn(r, true); }); bots(r); H.push(r); return;
    }
    nextTurn(r);
  }
  function discard(r, pl, ids) {
    const g = r.g; const need = pl.hand.length - HAND_MAX; if (need <= 0) return nextTurn(r);
    const pick = ids.slice(0, need).map(id => pl.hand.find(c => c.id === id)).filter(Boolean);
    if (pick.length < need) return;
    pl.hand = pl.hand.filter(c => !pick.includes(c)); g.disc.push(...pick);
    H.log(r, `🗑️ ${pl.name} رمى ${num(pick.length)} ورق`); nextTurn(r);
  }
  function useMove(r) {
    const g = r.g; g.mv--; if (r.phase !== 'play') return;
    if (win(r)) return;
    if (g.sub === 'turn' && g.mv <= 0) endTurn(r, false);
    else bots(r);
  }
  function win(r) {
    const g = r.g, need = opt(r, 'dsets', 3);
    const w = g.order.find(id => fullSets(S(r, id)).length >= need);
    if (!w) return false;
    r.phase = 'over'; g.sub = 'over'; g.winner = w; snap(r);
    const pl = P(r, w); r.winner = pl.name; H.win(r, [pl]); H.setTimer(r, 0, null);
    g.news = news(r, w);
    H.log(r, `👑 ${pl.name} كمّل ${num(need)} مدن وفاز!`);
    clearBots(r); H.push(r); return true;
  }
  function news(r, w) {
    const g = r.g, st = S(r, w), sets = fullSets(st).map(k => SETS[k].n);
    const s = g.stats[w] || {}; const lines = [];
    if (s.big) lines.push('بصفقة كبرى خطف فيها مجموعة كاملة'); if (s.stole) lines.push(`سرق ${num(s.stole)} أراضي من خصومه`); if (s.got) lines.push(`وجمع ${num(s.got)} مليون من الإيجارات والديون`);
    return { head: `${nm(r, w)} يسيطر على ${sets.join(' و')}!`, body: `في ليلة مثيرة على طاولة ترتيب ديل، ${lines.join('، ') || 'لعبها بهدوء'}، وكمّل مجموعاته قبل الكل بعد ${num(g.turnNo)} دور.` };
  }

  // ===== لعب الأوراق =====
  function take(pl, id) { const i = pl.hand.findIndex(c => c.id === id); return i < 0 ? null : pl.hand.splice(i, 1)[0]; }
  function playLand(r, pl, id, as) {
    const g = r.g, c = pl.hand.find(x => x.id === id); if (!c || (c.k !== 'land' && c.k !== 'wild')) return;
    if (c.k === 'wild') { if (!SETS[as]) return; c.as = as; }
    take(pl, id); const st = S(r, pl.id), k = setOf(c);
    (st.lands[k] || (st.lands[k] = [])).push(c);
    const done = complete(st, k) && st.lands[k].length === SETS[k].size;
    feed(r, { k: 'land', id: pl.id, s: k, done });
    if (done) H.log(r, `🏙️ ${pl.name} كمّل ${SETS[k].n}!`);
    useMove(r);
  }
  function playBank(r, pl, id) {
    const c = pl.hand.find(x => x.id === id); if (!c || (c.k !== 'money' && c.k !== 'act')) return;
    take(pl, id); S(r, pl.id).bank.push(c); feed(r, { k: 'bank', id: pl.id, v: cval(c) }); useMove(r);
  }
  // أرض تنفع تنسرق (مو بمجموعة كاملة)
  function loose(st, cid) { for (const [k, L] of Object.entries(st.lands)) { const c = L.find(x => x.id === cid); if (c) return complete(st, k) ? null : { k, c }; } return null; }
  function moveLand(r, from, to, cid) {
    const a = S(r, from), b = S(r, to);
    for (const [k, L] of Object.entries(a.lands)) { const i = L.findIndex(x => x.id === cid); if (i < 0) continue; const [c] = L.splice(i, 1); if (!L.length) { delete a.lands[k]; if (a.bld[k]) { r.g.disc.push(...Object.values(a.bld[k]).filter(x => x && x.id)); delete a.bld[k]; } } (b.lands[k] || (b.lands[k] = [])).push(c); return c; }
    return null;
  }
  function playAct(r, pl, m) {
    const g = r.g, c = pl.hand.find(x => x.id === +m.id); if (!c || c.k !== 'act') return;
    const a = c.a, me = S(r, pl.id), tg = m.tg && P(r, m.tg) && m.tg !== pl.id && g.order.includes(m.tg) ? m.tg : null, ts = tg && S(r, tg);
    let P0 = null; // الطلب المعلّق
    if (a === 'no' || a === 'double') return;
    if (a === 'draw') { take(pl, c.id); g.disc.push(c); drawN(r, pl, 2); feed(r, { k: 'act', a, id: pl.id }); H.log(r, `🃏 ${pl.name} سحب ورقتين`); return useMove(r); }
    if (a === 'house' || a === 'tower') {
      const k = m.set; if (!SETS[k] || SETS[k].nb || !complete(me, k)) return; const b = me.bld[k] || (me.bld[k] = {});
      if (a === 'house' ? b.h : (!b.h || b.t)) return;
      take(pl, c.id); b[a === 'house' ? 'h' : 't'] = c; feed(r, { k: 'act', a, id: pl.id, s: k }); H.log(r, `🏗️ ${pl.name} حط ${ACTS[a].n} على ${SETS[k].n}`); return useMove(r);
    }
    if (TARGETED.includes(a) && !tg) return;
    if (a === 'take') { const L = loose(ts, +m.their); if (!L) return; P0 = { their: L.c.id }; }
    if (a === 'swap') { const A = loose(me, +m.my), B = loose(ts, +m.their); if (!A || !B) return; P0 = { my: A.c.id, their: B.c.id }; }
    if (a === 'big') { const k = m.set; if (!SETS[k] || !complete(ts, k)) return; P0 = { set: k }; }
    if (a === 'wasta' && !P(r, tg).hand.length) return;
    let amt = 0, tgs = tg ? [tg] : [];
    if (a === 'debt') amt = 5; if (a === 'saher') amt = 3;
    if (a === 'eid') { amt = 2; tgs = g.order.filter(id => id !== pl.id); }
    if (a === 'faz') tgs = g.order.filter(id => id !== pl.id && P(r, id).hand.length);
    if (a === 'rent') {
      const k = m.set; if (!SETS[k] || !(me.lands[k] || []).length) return;
      amt = rentOf(r, me, k); P0 = { set: k };
      if (m.dbl && g.mv >= 2) { const d = pl.hand.find(x => x.k === 'act' && x.a === 'double' && x.id === +m.dbl); if (d) { take(pl, d.id); g.disc.push(d); amt *= 2; g.mv--; P0.dbl = 1; } }
      tgs = g.order.filter(id => id !== pl.id && !allied(r, id, pl.id));
    }
    take(pl, c.id); g.disc.push(c);
    const betray = tgs.filter(id => allied(r, id, pl.id) && a !== 'eid' && a !== 'faz');
    feed(r, { k: 'act', a, id: pl.id, tg, s: P0 && P0.set });
    H.log(r, `🎴 ${pl.name} لعب ${ACTS[a].n}${tg ? ' على ' + nm(r, tg) : ''}${amt ? ` (${num(amt)}م)` : ''}`);
    if (!tgs.length) return useMove(r);
    g.pend = { a, by: pl.id, amt, x: P0 || {}, betray, t: Object.fromEntries(tgs.map(id => [id, { s: 'ask', depth: 0 }])) };
    for (const id of tgs) if (!hasNo(r, id)) advanceT(r, id, 'ok');
    g.sub = 'resp'; respTimer(r); bots(r);
    checkPend(r);
  }
  const hasNo = (r, id) => P(r, id).hand.some(c => c.k === 'act' && c.a === 'no');
  function useNo(r, id) { const pl = P(r, id), c = pl.hand.find(x => x.k === 'act' && x.a === 'no'); if (!c) return false; take(pl, c.id); r.g.disc.push(c); stat(r, id, 'nos', 1); return true; }
  function respTimer(r) { const g = r.g; g.rdl = Date.now() + ms(RESP_MS); H.setTimer(r, ms(RESP_MS), () => { if (g.sub !== 'resp') return; for (const id of Object.keys(g.pend.t)) autoResp(r, id); checkPend(r); }); }
  function autoResp(r, id) {
    const t = r.g.pend.t[id]; if (!t || t.s === 'done') return;
    if (t.s === 'ask' || t.s === 'counter') advanceT(r, id, 'ok');
    if (t.s === 'pay') pay(r, id, autoPick(r, id, r.g.pend.amt));
    if (t.s === 'give') { const pl = P(r, id); give(r, id, pl.hand.length ? pl.hand.slice().sort((a, b) => cval(a) - cval(b))[0].id : 0); }
  }
  // الهدف يرد: ok (يقبل) أو no (لا شكراً). المهاجم يرد على «لا شكراً» بـ no (يكسرها) أو ok (يقبل الإلغاء)
  function advanceT(r, id, ans) {
    const g = r.g, p = g.pend, t = p.t[id]; if (!t) return;
    if (t.s === 'ask') {
      if (ans === 'no' && useNo(r, id)) { t.depth++; feed(r, { k: 'no', id, by: p.by }); H.log(r, `🛡️ ${nm(r, id)}: لا شكراً!`); t.s = hasNo(r, p.by) ? 'counter' : 'done'; if (t.s === 'done') t.cancel = 1; return; }
      if (ans !== 'ok') return;
      apply(r, id); return;
    }
    if (t.s === 'counter') {
      if (ans === 'no' && useNo(r, p.by)) { t.depth++; feed(r, { k: 'no', id: p.by, by: id }); H.log(r, `🛡️ ${nm(r, p.by)} كسر «لا شكراً» بوحدة ثانية!`); t.s = hasNo(r, id) ? 'ask' : 'x'; if (t.s === 'x') { t.s = 'ask'; apply(r, id); } return; }
      if (ans !== 'ok') return;
      t.s = 'done'; t.cancel = 1;
    }
  }
  function apply(r, id) {
    const g = r.g, p = g.pend, t = p.t[id], by = P(r, p.by), me = S(r, p.by), ts = S(r, id);
    if (p.amt) { t.s = 'pay'; if (!bankV(ts) && !Object.keys(ts.lands).length) t.s = 'done'; return; }
    if (p.a === 'faz') { t.s = 'give'; return; }
    t.s = 'done';
    if (p.a === 'take') { const L = loose(ts, p.x.their); if (L) { moveLand(r, id, p.by, L.c.id); stat(r, p.by, 'stole', 1); feed(r, { k: 'steal', from: id, to: p.by, s: L.k, n: 1 }); } }
    if (p.a === 'swap') { const A = loose(me, p.x.my), B = loose(ts, p.x.their); if (A && B) { moveLand(r, p.by, id, A.c.id); moveLand(r, id, p.by, B.c.id); stat(r, p.by, 'stole', 1); feed(r, { k: 'swap', a: p.by, b: id, sa: A.k, sb: B.k }); } }
    if (p.a === 'big') { const k = p.x.set; if (complete(ts, k)) { const L = ts.lands[k].splice(0); delete ts.lands[k]; (me.lands[k] || (me.lands[k] = [])).push(...L); if (ts.bld[k]) { me.bld[k] = ts.bld[k]; delete ts.bld[k]; } stat(r, p.by, 'stole', L.length); stat(r, p.by, 'big', 1); feed(r, { k: 'steal', from: id, to: p.by, s: k, n: L.length, big: 1 }); H.log(r, `👑 ${by.name} خطف ${SETS[k].n} كاملة من ${nm(r, id)}!`); } }
    if (p.a === 'wasta') { const v = P(r, id); if (v.hand.length) { const c = v.hand.splice(rnd(v.hand.length), 1)[0]; by.hand.push(c); feed(r, { k: 'wasta', from: id, to: p.by }); } }
  }
  // اختيار تلقائي للدفع: من البنك الصغير أول، بعدين الأراضي الأرخص (مو المكتملة لو ينفع)
  function autoPick(r, id, amt) {
    const st = S(r, id), out = []; let s = 0;
    const bank = st.bank.slice().sort((a, b) => cval(a) - cval(b));
    // جرّب ورقة وحدة تكفي بأقل قيمة
    const one = bank.find(c => cval(c) >= amt); if (one) return [one.id];
    for (const c of bank.slice().reverse()) { if (s >= amt) break; out.push(c.id); s += cval(c); }
    if (s < amt) {
      const lands = Object.entries(st.lands).flatMap(([k, L]) => L.map(c => ({ c, full: complete(st, k) }))).sort((a, b) => a.full - b.full || cval(a.c) - cval(b.c));
      for (const { c } of lands) { if (s >= amt) break; out.push(c.id); s += cval(c); }
    }
    return out;
  }
  function pay(r, id, ids) {
    const g = r.g, p = g.pend, t = p.t[id]; if (!t || t.s !== 'pay') return;
    const st = S(r, id), all = st.bank.concat(Object.values(st.lands).flat());
    const pick = [...new Set(ids.map(Number))].map(x => all.find(c => c.id === x)).filter(Boolean);
    const total = pick.reduce((a, c) => a + cval(c), 0), avail = all.reduce((a, c) => a + cval(c), 0);
    if (total < Math.min(p.amt, avail)) return; // لازم يغطي المبلغ أو يدفع كل اللي عنده
    const recv = S(r, p.by);
    for (const c of pick) {
      const bi = st.bank.indexOf(c); if (bi >= 0) { st.bank.splice(bi, 1); recv.bank.push(c); continue; }
      moveLand(r, id, p.by, c.id);
    }
    stat(r, id, 'paid', total); stat(r, p.by, 'got', total);
    feed(r, { k: 'pay', from: id, to: p.by, v: total, lands: pick.filter(c => c.k !== 'money' && c.k !== 'act').length });
    t.s = 'done';
  }
  function give(r, id, cid) {
    const g = r.g, p = g.pend, t = p.t[id]; if (!t || t.s !== 'give') return;
    const v = P(r, id); const c = take(v, +cid) || (v.hand.length ? v.hand.splice(0, 1)[0] : null);
    if (c) { P(r, p.by).hand.push(c); feed(r, { k: 'give', from: id, to: p.by }); }
    t.s = 'done';
  }
  function checkPend(r) {
    const g = r.g, p = g.pend; if (!p || g.sub !== 'resp') return;
    if (Object.values(p.t).some(t => t.s !== 'done')) { H.push(r); return; }
    // الخيانة: اللي لعب على حليفه يدفع غرامة وينفك التحالف
    for (const id of p.betray) {
      const t = p.t[id]; if (t.cancel) continue;
      g.ally = g.ally.filter(x => !((x.a === id && x.b === p.by) || (x.a === p.by && x.b === id)));
      g.pend = { a: 'fine', by: id, amt: FINE, x: {}, betray: [], t: { [p.by]: { s: 'pay' } } };
      pay(r, p.by, autoPick(r, p.by, FINE)); feed(r, { k: 'betray', id: p.by, v: id }); H.log(r, `💔 ${nm(r, p.by)} خان حليفه ${nm(r, id)} ودفع غرامة!`);
    }
    g.pend = null; g.sub = 'turn';
    const left = g.dl ? Math.max(ms(8000), g.dl - Date.now()) : ms(30000);
    g.dl = Date.now() + left; H.setTimer(r, left, () => { if (g.sub === 'turn') endTurn(r, true); });
    useMove(r); H.push(r);
  }

  // ===== الأحداث =====
  function event(r) {
    const g = r.g; let key = EVENTS[rnd(EVENTS.length)];
    if (key === g.lastEv) key = EVENTS[(EVENTS.indexOf(key) + 1) % EVENTS.length];
    g.lastEv = key; const ev = { key, n: EVN[key], style: rnd(3), id: g.turnNo };
    const owned = [...new Set(g.order.flatMap(id => Object.keys(S(r, id).lands)))];
    if (key === 'season') { const k = owned.length ? owned[rnd(owned.length)] : Object.keys(SETS)[rnd(14)]; ev.city = k; ev.d = `إيجار ${SETS[k].n} ×٢ لدور كامل`; g.fx = { key, city: k, until: g.turnNo + g.order.length }; }
    if (key === 'sale') { ev.d = 'كل الإيجارات تنقص مليون لدور كامل'; g.fx = { key, until: g.turnNo + g.order.length }; }
    if (key === 'rain') { ev.d = 'الكل يسحب ورقة زيادة'; for (const id of g.order) drawN(r, P(r, id), 1); }
    if (key === 'zakat') {
      const by = g.order.slice().sort((a, b) => bankV(S(r, b)) - bankV(S(r, a))); const rich = by[0], poor = by[by.length - 1];
      ev.d = 'الأغنى يعطي الأفقر ٢ مليون';
      if (rich !== poor && bankV(S(r, rich))) { g.pend = { a: 'zakat', by: poor, amt: 2, x: {}, betray: [], t: { [rich]: { s: 'pay' } } }; pay(r, rich, autoPick(r, rich, 2)); g.pend = null; ev.d = `${nm(r, rich)} عطى ${nm(r, poor)} زكاة ٢ مليون`; }
    }
    if (key === 'gift') { ev.d = 'كل لاعب ياخذ مليون عيدية'; for (const id of g.order) S(r, id).bank.push({ id: g.nid++, k: 'money', v: 1 }); }
    if (key === 'auction') {
      ev.d = 'أرض جوكر بالمزاد! أعلى مزايد ياخذها';
      g.auc = { card: { id: g.nid++, k: 'wild' }, top: null, v: 0, end: Date.now() + ms(AUC_MS), back: g.sub };
      g.sub = 'auc'; H.setTimer(r, ms(AUC_MS), () => aucEnd(r)); bots(r);
    }
    g.ev = ev; feed(r, { k: 'event', ev }); H.log(r, `📰 حدث: ${ev.n} — ${ev.d}`);
  }
  function bid(r, pl, v) {
    const g = r.g, a = g.auc; if (g.sub !== 'auc' || !a) return;
    v = Math.floor(+v); if (!(v > a.v) || v > bankV(S(r, pl.id))) return;
    a.v = v; a.top = pl.id; a.end = Math.max(a.end, Date.now() + ms(4000));
    H.setTimer(r, a.end - Date.now(), () => aucEnd(r)); feed(r, { k: 'bid', id: pl.id, v }); bots(r);
  }
  function aucEnd(r) {
    const g = r.g, a = g.auc; if (g.sub !== 'auc' || !a) return;
    if (a.top) {
      const st = S(r, a.top); let need = a.v; const ids = autoPick(r, a.top, a.v).filter(id => st.bank.some(c => c.id === id));
      for (const id of ids) { const i = st.bank.findIndex(c => c.id === id); if (i >= 0) { need -= cval(st.bank[i]); g.disc.push(st.bank.splice(i, 1)[0]); } }
      P(r, a.top).hand.push(a.card); stat(r, a.top, 'paid', a.v);
      H.log(r, `🔨 ${nm(r, a.top)} فاز بالمزاد بـ ${num(a.v)} مليون`);
    } else H.log(r, '🔨 محد زايد، الأرض رجعت للكومة');
    feed(r, { k: 'aucEnd', id: a.top, v: a.v }); g.auc = null; g.sub = 'turn'; turnTimer(r); bots(r); H.push(r);
  }

  // ===== البوتات =====
  function clearBots(r) { const g = r.g; if (g && g.bt) { g.bt.forEach(clearTimeout); g.bt = []; } }
  function later(r, d, fn) { const g = r.g; g.bt.push(setTimeout(() => { if (r.g === g && r.phase === 'play') { try { fn(); } catch (e) { console.error('deal bot', e); } H.push(r); } }, ms(d))); }
  function bots(r) {
    const g = r.g; clearBots(r); if (r.phase !== 'play') return;
    if (g.sub === 'pick') { for (const id of g.order) { const pl = P(r, id); if (pl.bot && !S(r, id).fav) later(r, 600 + rnd(2500), () => pickFav(r, pl, Object.keys(SETS)[rnd(14)])); } return; }
    if (g.sub === 'auc') { for (const id of g.order) { const pl = P(r, id); if (!pl.bot || g.auc.top === id) continue; const b = bankV(S(r, id)); if (b > g.auc.v + 1 && Math.random() < .55) later(r, 800 + rnd(2600), () => bid(r, pl, g.auc.v + 1 + rnd(2))); } return; }
    if (g.sub === 'resp') {
      for (const [id, t] of Object.entries(g.pend.t)) {
        const who = t.s === 'counter' ? g.pend.by : id, pl = P(r, who); if (!pl || !pl.bot || t.s === 'done') continue;
        later(r, 900 + rnd(1500), () => {
          const t2 = g.pend && g.pend.t[id]; if (!t2) return;
          if (t2.s === 'ask') advanceT(r, id, hasNo(r, id) && (g.pend.amt >= 4 || ['big', 'take', 'swap', 'wasta'].includes(g.pend.a)) ? 'no' : 'ok');
          else if (t2.s === 'counter') advanceT(r, id, Math.random() < .7 ? 'no' : 'ok');
          else if (t2.s === 'pay') pay(r, id, autoPick(r, id, g.pend.amt));
          else if (t2.s === 'give') autoResp(r, id);
          checkPend(r); bots(r);
        });
      }
      return;
    }
    const pl = P(r, g.turn); if (!pl || !pl.bot) return;
    if (g.sub === 'disc') return later(r, 900, () => endTurn(r, true));
    if (g.sub === 'turn') later(r, 1100 + rnd(900), () => botMove(r, pl));
  }
  function botMove(r, pl) {
    const g = r.g; if (g.sub !== 'turn' || g.turn !== pl.id) return;
    const me = S(r, pl.id), H2 = pl.hand, opp = g.order.filter(id => id !== pl.id);
    const act = a => H2.find(c => c.k === 'act' && c.a === a);
    const rich = opp.slice().sort((a, b) => worth(S(r, b)) - worth(S(r, a)));
    const pickT = () => rich.find(id => !allied(r, id, pl.id)) || rich[0];
    // ١) أرض تكمّل مجموعة
    const lands = H2.filter(c => c.k === 'land');
    const best = lands.sort((a, b) => ((me.lands[b.s] || []).length - (me.lands[a.s] || []).length))[0];
    if (best) return playLand(r, pl, best.id);
    const wild = H2.find(c => c.k === 'wild');
    if (wild) { const ks = Object.keys(me.lands).filter(k => !complete(me, k)); return playLand(r, pl, wild.id, ks[0] || Object.keys(SETS)[rnd(14)]); }
    // ٢) صفقة كبرى
    const bg = act('big'); if (bg) for (const id of opp) { const k = fullSets(S(r, id))[0]; if (k) return playAct(r, pl, { id: bg.id, tg: id, set: k }); }
    // ٣) خذها أرض تفيدني
    const tk = act('take'); if (tk) for (const id of opp) { const ts = S(r, id); for (const [k, L] of Object.entries(ts.lands)) if (!complete(ts, k) && (me.lands[k] || Math.random() < .3)) return playAct(r, pl, { id: tk.id, tg: id, their: L[0].id }); }
    // ٤) إيجار على أغلى مدينة
    const rt = act('rent'); if (rt) { const ks = Object.keys(me.lands).sort((a, b) => rentOf(r, me, b) - rentOf(r, me, a)); if (ks.length && rentOf(r, me, ks[0]) >= 2) { const d = act('double'); return playAct(r, pl, { id: rt.id, set: ks[0], dbl: d && g.mv >= 2 ? d.id : 0 }); } }
    // ٥) ديون وعيدية وساهر وواسطة وفزعة
    for (const a of ['debt', 'saher', 'eid', 'wasta', 'faz']) { const c = act(a); if (c) { const tg = pickT(); if (a === 'wasta' && !P(r, tg).hand.length) continue; return playAct(r, pl, { id: c.id, tg }); } }
    const hs = act('house'); if (hs) { const k = fullSets(me).find(k => !SETS[k].nb && !(me.bld[k] || {}).h); if (k) return playAct(r, pl, { id: hs.id, set: k }); }
    const tw = act('tower'); if (tw) { const k = fullSets(me).find(k => (me.bld[k] || {}).h && !(me.bld[k] || {}).t); if (k) return playAct(r, pl, { id: tw.id, set: k }); }
    const dr = act('draw'); if (dr) return playAct(r, pl, { id: dr.id });
    // ٦) فلوس للبنك
    const money = H2.filter(c => c.k === 'money').sort((a, b) => b.v - a.v)[0];
    if (money) return playBank(r, pl, money.id);
    const junk = H2.find(c => c.k === 'act' && !['no', 'double'].includes(c.a) && bankV(me) < 6);
    if (junk) return playBank(r, pl, junk.id);
    endTurn(r, false);
  }

  // ===== البداية: اختيار المدينة المفضلة =====
  function pickFav(r, pl, k) { const g = r.g; if (g.sub !== 'pick' || !SETS[k] || !S(r, pl.id) || S(r, pl.id).fav) return; S(r, pl.id).fav = k; if (g.order.every(id => S(r, id).fav)) begin(r); }
  function begin(r) {
    const g = r.g; if (g.sub !== 'pick') return;
    for (const id of g.order) if (!S(r, id).fav) S(r, id).fav = Object.keys(SETS)[rnd(14)];
    for (const id of g.order) drawN(r, P(r, id), 5);
    g.sub = 'turn'; snap(r); H.log(r, `🎴 بدت ترتيب ديل! أول واحد يكمّل ${num(opt(r, 'dsets', 3))} مدن يفوز`);
    g.turnNo = 0; startTurn(r); H.push(r);
  }

  const pubCard = c => c ? { id: c.id, k: c.k, s: c.s, v: c.v, a: c.a, as: c.as } : null;
  return {
    min: 2, max: 6,
    SETS, ACTS,
    start(r) {
      r.g = { order: H.shuffle(r.players.map(p => p.id)), st: {}, deck: [], disc: [], turn: null, turnNo: 0, mv: 0, sub: 'pick', pend: null, auc: null, fx: null, ev: null, ally: [], allyReq: null, stats: {}, hist: [], votes: {}, bt: [], nid: 1, dl: 0, rdl: 0 };
      r.winner = null; r.phase = 'play';
      for (const p of r.players) { p.hand = []; r.g.st[p.id] = { bank: [], lands: {}, bld: {}, fav: null }; }
      r.g.deck = deck(r); r.g.turn = r.g.order[0];
      H.log(r, '🏙️ اختر مدينتك المفضلة: لما تكمّلها إيجارها يزيد مليون');
      r.g.dl = Date.now() + ms(PICK_MS); H.setTimer(r, ms(PICK_MS), () => begin(r)); bots(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g) return 'quiet';
      if (m.t === 'dst') { if (H.rate(p, 'dst', 1200) && typeof m.s === 'string' && m.s.length < 20) feed(r, { k: 'sticker', id: p.id, s: m.s, spec: !!p.spec }); return 'quiet'; }
      if (m.t === 'dsv') { if (r.phase === 'play' && g.order.includes(m.id) && !g.order.includes(p.id)) { g.votes[p.id] = m.id; H.push(r); } return 'quiet'; }
      if (r.phase !== 'play' || !g.order.includes(p.id) || !H.rate(p, 'dl', 150)) return 'quiet';
      const mine = g.turn === p.id;
      switch (m.t) {
        case 'dfav': pickFav(r, p, m.s); break;
        case 'dland': if (mine && g.sub === 'turn' && g.mv > 0) playLand(r, p, +m.id, m.as); break;
        case 'dbank': if (mine && g.sub === 'turn' && g.mv > 0) playBank(r, p, +m.id); break;
        case 'dact': if (mine && g.sub === 'turn' && g.mv > 0) playAct(r, p, m); break;
        case 'dend': if (mine && g.sub === 'turn') endTurn(r, false); break;
        case 'ddisc': if (mine && g.sub === 'disc' && Array.isArray(m.ids)) discard(r, p, m.ids.map(Number)); break;
        case 'dresp': if (g.sub === 'resp' && g.pend) { const t = g.pend.t[m.id]; if (!t) break; if ((t.s === 'ask' && m.id === p.id) || (t.s === 'counter' && g.pend.by === p.id)) advanceT(r, m.id, m.ans === 'no' ? 'no' : 'ok'); checkPend(r); bots(r); } break;
        case 'dpay': if (g.sub === 'resp' && g.pend && Array.isArray(m.ids)) { pay(r, p.id, m.ids); checkPend(r); } break;
        case 'dgive': if (g.sub === 'resp' && g.pend) { give(r, p.id, m.id); checkPend(r); } break;
        case 'dbid': bid(r, p, m.v); break;
        case 'dally': if (mine && g.sub === 'turn' && m.id !== p.id && g.order.includes(m.id) && !allyOf(r, p.id) && !allyOf(r, m.id) && H.rate(p, 'dally', 4000)) {
          g.allyReq = { from: p.id, to: m.id, at: g.turnNo }; feed(r, { k: 'allyReq', from: p.id, to: m.id });
          const t = P(r, m.id); if (t.bot) { if (Math.random() < .6) { g.ally.push({ a: p.id, b: t.id, until: g.turnNo + ALLY_TURNS * g.order.length }); feed(r, { k: 'ally', a: p.id, b: t.id }); H.log(r, `🤝 ${p.name} و${t.name} تحالفوا`); } else { feed(r, { k: 'allyNo', from: t.id, to: p.id }); H.log(r, `🙅 ${t.name} رفض التحالف`); } g.allyReq = null; }
        } break;
        case 'dallyok': if (g.allyReq && g.allyReq.to === p.id) { if (m.ok && !allyOf(r, p.id) && !allyOf(r, g.allyReq.from)) { g.ally.push({ a: g.allyReq.from, b: p.id, until: g.turnNo + ALLY_TURNS * g.order.length }); feed(r, { k: 'ally', a: g.allyReq.from, b: p.id }); H.log(r, `🤝 ${nm(r, g.allyReq.from)} و${p.name} تحالفوا`); } g.allyReq = null; } break;
        default: return 'quiet';
      }
      return;
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const me = g.order.includes(p.id) ? p : null, pend = g.pend;
      const votes = {}; for (const v of Object.values(g.votes)) votes[v] = (votes[v] || 0) + 1;
      const players = g.order.map(id => { const st = S(r, id), pl = P(r, id); return {
        id, n: pl ? pl.hand.length : 0, bank: st.bank.map(pubCard), bv: bankV(st), lands: Object.fromEntries(Object.entries(st.lands).map(([k, L]) => [k, L.map(pubCard)])),
        bld: Object.fromEntries(Object.entries(st.bld).map(([k, b]) => [k, { h: !!b.h, t: !!b.t }])), fav: g.sub === 'pick' && id !== p.id ? (st.fav ? '?' : null) : st.fav,
        full: fullSets(st), rent: Object.fromEntries(Object.keys(st.lands).map(k => [k, rentOf(r, st, k)])), ally: allyOf(r, id)
      }; });
      return {
        sub: g.sub, turn: g.turn, turnNo: g.turnNo, mv: g.mv, deck: g.deck.length, top: pubCard(g.disc[g.disc.length - 1]), need: opt(r, 'dsets', 3),
        left: g.sub === 'over' ? 0 : g.sub === 'resp' ? Math.max(0, g.rdl - Date.now()) : g.sub === 'auc' && g.auc ? Math.max(0, g.auc.end - Date.now()) : g.dl ? Math.max(0, g.dl - Date.now()) : 0,
        total: g.sub === 'resp' ? RESP_MS * SCALE : g.sub === 'pick' ? PICK_MS * SCALE : g.sub === 'auc' ? AUC_MS * SCALE : opt(r, 'dtime', 60) * 1000 * SCALE,
        players, hand: me ? me.hand.map(pubCard) : null, spec: !me,
        pend: pend ? { a: pend.a, by: pend.by, amt: pend.amt, x: pend.x, t: Object.fromEntries(Object.entries(pend.t).map(([id, t]) => [id, t.s])) } : null,
        auc: g.auc ? { v: g.auc.v, top: g.auc.top } : null, fx: g.fx, ev: g.ev, allyReq: g.allyReq, votes, nvotes: Object.keys(g.votes).length,
        winner: g.winner || null, news: g.news || null, hist: g.sub === 'over' ? g.hist : null, stats: g.sub === 'over' ? g.stats : null
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (!g.order.includes(p.id)) return;
      const st = S(r, p.id); g.disc.push(...(p.hand || []), ...st.bank);
      g.order = g.order.filter(id => id !== p.id);
      if (g.pend) { delete g.pend.t[p.id]; if (g.pend.by === p.id) { g.pend = null; g.sub = 'turn'; } }
      if (g.auc && g.auc.top === p.id) { g.auc.top = null; g.auc.v = 0; }
      if (g.order.length < 2) { const w = P(r, g.order[0]); r.phase = 'over'; g.sub = 'over'; g.winner = w ? w.id : null; if (w) { r.winner = w.name; H.win(r, [w]); g.news = news(r, w.id); } H.setTimer(r, 0, null); clearBots(r); return; }
      if (g.turn === p.id) { g.turn = g.order[g.order.length - 1]; nextTurn(r); }
      else if (g.sub === 'resp') checkPend(r);
    }
  };
};
