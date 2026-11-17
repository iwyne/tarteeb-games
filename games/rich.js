// مليونير الديرة: لعبة عقارات (على طريقة الألعاب الكلاسيكية) بمدن وأماكن سعودية.
// ٢-٦ لاعبين. ترمي زهرين، تمشي، تشتري، تبني بيوت وفنادق، وتدفع إيجار. اللي يفلس يطلع، والأغنى بالنهاية يفوز.
const SCALE = +process.env.RICH_SCALE || 1;
const TURN_MS = 30000 * SCALE, BOT_MS = 1100 * SCALE, SHOW_MS = 1700 * SCALE;
const START_CASH = 1500, GO_CASH = 200, JAIL = 8, JAIL_FEE = 50;
const { T, G, MULT, GROUP, N } = require('../public/rich-board');
const CARDS = [
  { tx: 'ربحت مسابقة سناب! +١٠٠', f: (r, C) => C.gain(100) },
  { tx: 'مخالفة ساهر 📸 −٥٠', f: (r, C) => C.pay(50) },
  { tx: 'نزل الراتب بدري! روح لانطلاق', f: (r, C) => C.goto(0) },
  { tx: 'روح للتوقيف 🚔 (بدون ما تمر بانطلاق)', f: (r, C) => C.jail() },
  { tx: 'رجعت ٣ خانات', f: (r, C) => C.step(-3) },
  { tx: 'عيدية من الأهل 🎁 +٥٠', f: (r, C) => C.gain(50) },
  { tx: 'صيانة عقاراتك: ٢٥ لكل بيت و١٠٠ لكل فندق', f: (r, C) => C.repairs(25, 100) },
  { tx: 'عزمت الشلة على كبسة 🍗 ادفع ٢٠ لكل لاعب', f: (r, C) => C.payEach(20) },
  { tx: 'رحلة للعلا ✈️', f: (r, C) => C.goto(22) },
  { tx: 'كرت خروج من التوقيف مجاناً 🎫', f: (r, C) => C.jfree() },
  { tx: 'استرداد ضريبة +٧٥', f: (r, C) => C.gain(75) },
  { tx: 'فاتورة جوال −٤٠', f: (r, C) => C.pay(40) },
  { tx: 'كل لاعب يعطيك ١٠ هدية تخرّج 🎓', f: (r, C) => C.collectEach(10) },
  { tx: 'روح لأقرب مطار أو قطار', f: (r, C) => C.nearestT() }
];

module.exports = H => {
  const pl = (r, id) => r.players.find(p => p.id === id);
  const name = (r, id) => { const p = pl(r, id); return p ? p.name : '؟'; };
  const alive = g => g.order.filter(id => !g.out.includes(id));
  const cur = g => g.order[g.ti];
  function rentOf(g, i, roll) {
    const t = T[i], o = g.own[i]; if (o == null || g.mort[i]) return 0;
    if (t.k === 't') { const n = [5, 12, 20, 28].filter(j => g.own[j] === o && !g.mort[j]).length; return 25 * 2 ** (n - 1); }
    if (t.k === 'u') { const n = [10, 23].filter(j => g.own[j] === o).length; return roll * (n === 2 ? 10 : 4); }
    const h = g.houses[i] || 0;
    if (!h && GROUP[t.g].every(j => g.own[j] === o)) return t.base * 2;
    return t.base * MULT[h];
  }
  const fullGroup = (g, id, gr) => GROUP[gr].every(j => g.own[j] === id && !g.mort[j]);
  function canBuild(g, id, i) {
    const t = T[i]; if (t.k !== 'p' || g.own[i] !== id || !fullGroup(g, id, t.g)) return false;
    const h = g.houses[i] || 0; if (h >= 5 || g.cash[id] < t.hc) return false;
    return GROUP[t.g].every(j => (g.houses[j] || 0) >= h); // بناء متساوي
  }
  function canSell(g, id, i) {
    const t = T[i]; if (t.k !== 'p' || g.own[i] !== id) return false;
    const h = g.houses[i] || 0; if (!h) return false;
    return GROUP[t.g].every(j => (g.houses[j] || 0) <= h);
  }
  const canMort = (g, id, i) => g.own[i] === id && !g.mort[i] && (T[i].k !== 'p' || GROUP[T[i].g].every(j => !(g.houses[j] || 0)));
  const canUnmort = (g, id, i) => g.own[i] === id && g.mort[i] && g.cash[id] >= Math.ceil(T[i].pr * .55);
  const worth = (g, id) => g.cash[id] + Object.keys(g.own).filter(i => g.own[i] === id).reduce((a, i) => a + (g.mort[i] ? T[i].pr / 2 : T[i].pr) + (g.houses[i] || 0) * (T[i].hc || 0), 0);

  // دفع مع تسييل تلقائي (نبيع بيوت ثم نرهن) — وإذا ما كفى يفلس
  function charge(r, id, amt, to) {
    const g = r.g;
    if (g.cash[id] < amt) raise(r, id, amt);
    if (g.cash[id] < amt) return bankrupt(r, id, to);
    g.cash[id] -= amt; if (to != null && !g.out.includes(to)) g.cash[to] += amt;
    return true;
  }
  function raise(r, id, amt) {
    const g = r.g; let sold = 0, morts = 0;
    const mine = () => Object.keys(g.own).map(Number).filter(i => g.own[i] === id);
    while (g.cash[id] < amt) { const i = mine().filter(i => canSell(g, id, i)).sort((a, b) => (g.houses[b] || 0) - (g.houses[a] || 0))[0]; if (i == null) break; g.houses[i]--; g.cash[id] += T[i].hc / 2; sold++; }
    while (g.cash[id] < amt) { const i = mine().filter(i => canMort(g, id, i)).sort((a, b) => T[a].pr - T[b].pr)[0]; if (i == null) break; g.mort[i] = true; g.cash[id] += T[i].pr / 2; morts++; }
    if (sold || morts) H.log(r, `${name(r, id)} اضطر ${sold ? `يبيع ${sold} بيت` : ''}${sold && morts ? ' و' : ''}${morts ? `يرهن ${morts} عقار` : ''} عشان يدفع`);
  }
  function bankrupt(r, id, to) {
    const g = r.g;
    const cr = to != null && !g.out.includes(to) ? to : null;
    if (cr != null) g.cash[cr] += Math.max(0, g.cash[id]);
    Object.keys(g.own).forEach(i => { if (g.own[i] !== id) return; g.houses[i] = 0; if (cr != null) g.own[i] = cr; else { delete g.own[i]; delete g.mort[i]; } });
    g.cash[id] = 0; g.out.push(id); g.jail[id] = 0;
    if (g.trade && (g.trade.from === id || g.trade.to === id)) { clearTimeout(g.tradeT); g.trade = null; }
    H.log(r, `💸 ${name(r, id)} أفلس${cr != null ? ` وأملاكه راحت لـ${name(r, cr)}` : ''}`);
    g.ev = { k: 'broke', id, n: ++g.evN };
    if (alive(g).length <= 1) { finish(r); return false; }
    return false;
  }
  function finish(r, why) {
    const g = r.g, L = alive(g).sort((a, b) => worth(g, b) - worth(g, a));
    clearTimeout(g.tradeT); g.trade = null;
    const w = L[0]; r.phase = 'over'; g.sub = 'over';
    const p = pl(r, w); r.winner = p ? p.name : '—'; if (p) H.win(r, [p]);
    g.final = g.order.map(id => ({ id, w: g.out.includes(id) ? 0 : worth(g, id) })).sort((a, b) => b.w - a.w);
    H.log(r, why || `🏆 ${r.winner} صار مليونير الديرة!`); H.setTimer(r, 0, null);
  }
  // ---- الحركة ----
  function moveTo(r, id, to, passGo = true) {
    const g = r.g, from = g.pos[id];
    if (passGo && to < from && to !== JAIL) { g.cash[id] += GO_CASH; H.log(r, `${name(r, id)} مر بانطلاق +${GO_CASH}`); }
    g.pos[id] = to; g.moveN++;
  }
  function sendJail(r, id) { const g = r.g; g.pos[id] = JAIL; g.jail[id] = 3; g.dbl = 0; g.moveN++; g.ev = { k: 'jail', id, n: ++g.evN }; H.log(r, `🚔 ${name(r, id)} انحجز بالتوقيف`); }
  function cardCtx(r, id) {
    const g = r.g;
    return {
      gain: n => { g.cash[id] += n; },
      pay: n => charge(r, id, n, null),
      goto: i => { moveTo(r, id, i); land(r, id, 0, true); },
      jail: () => sendJail(r, id),
      step: n => { g.pos[id] = (g.pos[id] + n + N) % N; g.moveN++; land(r, id, 0, true); },
      repairs: (h, ht) => { let s = 0; Object.keys(g.own).forEach(i => { if (g.own[i] === id) { const n = g.houses[i] || 0; s += n === 5 ? ht : n * h; } }); if (s) charge(r, id, s, null); },
      payEach: n => alive(g).forEach(o => { if (o !== id && !g.out.includes(id)) charge(r, id, n, o); }),
      collectEach: n => alive(g).forEach(o => { if (o !== id) charge(r, o, n, id); }),
      jfree: () => { g.jfree[id] = (g.jfree[id] || 0) + 1; },
      nearestT: () => { const p = g.pos[id], j = [5, 12, 20, 28].find(x => x > p) ?? 5; moveTo(r, id, j); land(r, id, 0, true); }
    };
  }
  // نزل على خانة
  function land(r, id, roll, fromCard) {
    const g = r.g, i = g.pos[id], t = T[i];
    if (t.k === 'tojail') return sendJail(r, id);
    if (t.k === 'x') { H.log(r, `${name(r, id)} دفع ${t.n} ${t.amt}`); return charge(r, id, t.amt, null); }
    if (t.k === 'c') {
      if (fromCard) return;
      if (!g.deck.length) g.deck = H.shuffle(CARDS.map((_, k) => k));
      const k = g.deck.pop(), c = CARDS[k];
      g.card = { tx: c.tx, id, n: ++g.evN }; H.log(r, `🎴 ${name(r, id)}: ${c.tx}`);
      c.f(r, cardCtx(r, id)); return;
    }
    if (t.k === 'p' || t.k === 't' || t.k === 'u') {
      const o = g.own[i];
      if (o == null) { g.offer = i; return; }
      if (o === id || g.mort[i]) return;
      const rent = rentOf(g, i, roll || 7);
      if (rent > 0) { H.log(r, `${name(r, id)} دفع إيجار ${rent} لـ${name(r, o)} (${t.n})`); g.ev = { k: 'rent', id, to: o, amt: rent, n: ++g.evN }; charge(r, id, rent, o); }
    }
  }
  function roll(r) {
    const g = r.g, id = cur(g); if (g.sub !== 'roll') return false;
    const a = 1 + (Math.random() * 6 | 0), b = 1 + (Math.random() * 6 | 0), dbl = a === b;
    g.dice = [a, b]; g.rollN++; g.offer = null; g.card = null;
    if (g.jail[id] > 0) {
      if (dbl) { g.jail[id] = 0; H.log(r, `${name(r, id)} طلع من التوقيف بدبل 🎲`); g.dbl = 0; }
      else {
        g.jail[id]--;
        if (g.jail[id] > 0) { H.log(r, `${name(r, id)} ما جاب دبل، باقي بالتوقيف`); g.sub = 'act'; g.again = false; return afterLand(r); }
        H.log(r, `${name(r, id)} دفع ${JAIL_FEE} وطلع`); if (!charge(r, id, JAIL_FEE, null)) return afterLand(r);
      }
      g.again = false;
    } else {
      g.dbl = dbl ? g.dbl + 1 : 0;
      if (g.dbl >= 3) { H.log(r, `${name(r, id)} جاب ٣ دبل ورا بعض!`); sendJail(r, id); g.sub = 'act'; g.again = false; return afterLand(r); }
      g.again = dbl;
    }
    moveTo(r, id, (g.pos[id] + a + b) % N);
    land(r, id, a + b);
    if (r.phase !== 'play') return true;
    g.sub = g.offer != null && !g.out.includes(id) ? 'buy' : 'act';
    if (g.jail[id] > 0) g.again = false;
    return afterLand(r);
  }
  function afterLand(r) {
    const g = r.g; if (r.phase !== 'play') return true;
    if (g.out.includes(cur(g))) { nextTurn(r); return true; }
    arm(r); return true;
  }
  function endTurn(r) {
    const g = r.g; if (g.sub !== 'act') return false;
    const id = cur(g);
    if (g.again && !g.out.includes(id) && !(g.jail[id] > 0)) { g.sub = 'roll'; g.again = false; H.log(r, `${name(r, id)} جاب دبل، يرمي مرة ثانية 🎲`); arm(r); return true; }
    nextTurn(r); return true;
  }
  function nextTurn(r) {
    const g = r.g; if (r.phase !== 'play') return;
    if (alive(g).length <= 1) return finish(r);
    let k = 0;
    do { g.ti = (g.ti + 1) % g.order.length; if (g.ti === 0) g.round++; k++; } while (g.out.includes(cur(g)) && k < 20);
    if (g.lim && g.round > g.lim) return finish(r, `انتهت ${g.lim} جولة — 🏆 الأغنى يفوز`);
    g.sub = 'roll'; g.dbl = 0; g.again = false; g.offer = null; g.card = null;
    arm(r);
  }
  // مؤقت الدور: البوت يلعب بعد ثانية، والإنسان ياخذ ٣٠ ثانية وبعدين نلعب عنه (بدون شراء)
  function arm(r) {
    const g = r.g, p = pl(r, cur(g)); if (!p) return;
    const ms = p.bot ? (g.sub === 'roll' && g.rollN ? BOT_MS + SHOW_MS : BOT_MS) : g.sub === 'act' && !buildable(g, p.id).length ? SHOW_MS + 1300 : TURN_MS;
    H.setTimer(r, ms, () => auto(r, p.bot));
  }
  const buildable = (g, id) => Object.keys(g.own).map(Number).filter(i => canBuild(g, id, i));
  function auto(r, bot) {
    const g = r.g; if (r.phase !== 'play') return; const id = cur(g);
    if (g.sub === 'roll') {
      if (g.jail[id] > 0 && bot) { if (g.jfree[id]) { useFree(r, id); } else if (g.cash[id] > 400 && g.round < 12) payJail(r, id); }
      return roll(r);
    }
    if (g.sub === 'buy') { if (bot && g.cash[id] - T[g.offer].pr >= 120) buy(r); else skip(r); return; }
    if (g.sub === 'act') {
      if (bot) { botOffer(r, id); let k = 0; while (k++ < 6) { const L = buildable(g, id).filter(i => g.cash[id] - T[i].hc > 250); if (!L.length) break; build(r, id, L.sort((a, b) => (g.houses[a] || 0) - (g.houses[b] || 0))[0]); } Object.keys(g.mort).map(Number).filter(i => g.mort[i] && g.own[i] === id && g.cash[id] - T[i].pr * .55 > 500).forEach(i => unmort(r, id, i)); }
      return endTurn(r);
    }
  }
  function buy(r) {
    const g = r.g, id = cur(g), i = g.offer; if (g.sub !== 'buy' || i == null) return false;
    if (g.cash[id] < T[i].pr) return false;
    g.cash[id] -= T[i].pr; g.own[i] = id; g.offer = null; g.sub = 'act';
    g.ev = { k: 'buy', id, i, n: ++g.evN };
    H.log(r, `🏠 ${name(r, id)} اشترى ${T[i].n} بـ${T[i].pr}`);
    arm(r); return true;
  }
  function skip(r) { const g = r.g; if (g.sub !== 'buy') return false; g.offer = null; g.sub = 'act'; arm(r); return true; }
  function build(r, id, i) { const g = r.g; if (!canBuild(g, id, i)) return false; g.cash[id] -= T[i].hc; g.houses[i] = (g.houses[i] || 0) + 1; H.log(r, `${name(r, id)} بنى ${g.houses[i] === 5 ? 'فندق 🏨' : 'بيت 🏠'} في ${T[i].n}`); g.ev = { k: 'build', id, i, n: ++g.evN }; return true; }
  function sell(r, id, i) { const g = r.g; if (!canSell(g, id, i)) return false; g.houses[i]--; g.cash[id] += T[i].hc / 2; H.log(r, `${name(r, id)} باع بيت في ${T[i].n}`); return true; }
  function mort(r, id, i) { const g = r.g; if (!canMort(g, id, i)) return false; g.mort[i] = true; g.cash[id] += T[i].pr / 2; H.log(r, `${name(r, id)} رهن ${T[i].n}`); return true; }
  function unmort(r, id, i) { const g = r.g; if (!canUnmort(g, id, i)) return false; g.cash[id] -= Math.ceil(T[i].pr * .55); delete g.mort[i]; H.log(r, `${name(r, id)} فك رهن ${T[i].n}`); return true; }
  // ---- عروض الشراء بين اللاعبين ----
  const groupBuilt = (g, i) => T[i].k === 'p' && GROUP[T[i].g].some(j => (g.houses[j] || 0) > 0);
  function offer(r, from, i, amt) {
    const g = r.g, to = g.own[i]; amt = Math.floor(+amt);
    if (g.trade || to == null || to === from || g.out.includes(to) || groupBuilt(g, i) || !(amt >= 1) || amt > g.cash[from]) return false;
    g.trade = { from, to, i, amt, n: ++g.evN };
    H.log(r, `🤝 ${name(r, from)} عرض ${amt} على ${name(r, to)} عشان ${T[i].n}`);
    clearTimeout(g.tradeT);
    const tp = pl(r, to);
    const tn = g.trade.n;
    g.tradeT = setTimeout(() => { if (!H.alive(r) || r.g !== g || !g.trade || g.trade.n !== tn) return; reply(r, to, tp && tp.bot ? botLikes(g, g.trade) : false); H.push(r); }, tp && tp.bot ? 1200 * SCALE : 20000 * SCALE);
    return true;
  }
  function botLikes(g, t) {
    const pr = T[t.i].pr, keepsSet = T[t.i].k === 'p' && GROUP[T[t.i].g].every(j => g.own[j] === t.to);
    return t.amt >= pr * (keepsSet ? 2.6 : 1.5);
  }
  function reply(r, id, yes) {
    const g = r.g, t = g.trade; if (!t || t.to !== id) return false;
    clearTimeout(g.tradeT); g.trade = null;
    if (!yes || g.own[t.i] !== t.to || g.cash[t.from] < t.amt || g.out.includes(t.from)) { H.log(r, `${name(r, t.to)} رفض العرض ❌`); g.ev = { k: 'nodeal', id: t.from, n: ++g.evN }; return true; }
    g.cash[t.from] -= t.amt; g.cash[t.to] += t.amt; g.own[t.i] = t.from;
    H.log(r, `✅ ${name(r, t.to)} باع ${T[t.i].n} لـ${name(r, t.from)} بـ${t.amt}`); g.ev = { k: 'deal', id: t.from, i: t.i, n: ++g.evN };
    return true;
  }
  // البوت يحاول يكمّل مجموعة لو ناقصه عقار واحد
  function botOffer(r, id) {
    const g = r.g; if (g.trade) return;
    g.boff = g.boff || {};
    for (const gr in GROUP) {
      const L = GROUP[gr], mine = L.filter(j => g.own[j] === id), miss = L.filter(j => g.own[j] !== id);
      if (!mine.length || miss.length !== 1) continue;
      const i = miss[0], o = g.own[i]; if (o == null || g.out.includes(o) || groupBuilt(g, i)) continue;
      const k = id + ':' + i; if ((g.boff[k] || 0) >= 2) continue;
      const amt = Math.round(T[i].pr * (1.6 + (g.boff[k] || 0) * .5));
      if (g.cash[id] - amt < 250) continue;
      g.boff[k] = (g.boff[k] || 0) + 1; offer(r, id, i, amt); return;
    }
  }
  function payJail(r, id) { const g = r.g; if (!(g.jail[id] > 0) || g.cash[id] < JAIL_FEE) return false; g.cash[id] -= JAIL_FEE; g.jail[id] = 0; H.log(r, `${name(r, id)} دفع ${JAIL_FEE} وطلع من التوقيف`); return true; }
  function useFree(r, id) { const g = r.g; if (!(g.jail[id] > 0) || !g.jfree[id]) return false; g.jfree[id]--; g.jail[id] = 0; H.log(r, `${name(r, id)} استخدم كرت الخروج 🎫`); return true; }

  return {
    min: 2, max: 6,
    _t: { T, rentOf, canBuild, worth },
    start(r) {
      const lim = [15, 25, 0].includes(+r.opts.mlim) ? +r.opts.mlim : 25;
      const order = H.shuffle(r.players.map(p => p.id));
      r.g = { order, ti: 0, round: 1, lim, sub: 'roll', pos: {}, cash: {}, jail: {}, jfree: {}, own: {}, houses: {}, mort: {}, out: [], dice: [1, 1], rollN: 0, moveN: 0, dbl: 0, again: false, offer: null, card: null, deck: H.shuffle(CARDS.map((_, k) => k)), ev: null, evN: 0, final: null, trade: null, tradeT: null };
      order.forEach(id => { r.g.pos[id] = 0; r.g.cash[id] = START_CASH; r.g.jail[id] = 0; });
      r.winner = null; r.phase = 'play';
      H.log(r, `بدأت مليونير الديرة 💰 — كل واحد معه ${START_CASH}`);
      arm(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return 'quiet';
      const id = p.id, mine = cur(g) === id, i = +m.i;
      if (!g.order.includes(id) || g.out.includes(id)) return 'quiet';
      if (m.t === 'moffer' && !H.rate(p, 'mof', 1500)) return 'quiet';
      let ok = false;
      if (m.t === 'mroll' && mine) ok = roll(r);
      else if (m.t === 'mbuy' && mine) ok = buy(r);
      else if (m.t === 'mskip' && mine) ok = skip(r);
      else if (m.t === 'mend' && mine) ok = endTurn(r);
      else if (m.t === 'mjail' && mine && g.sub === 'roll') ok = m.k === 'card' ? useFree(r, id) : payJail(r, id);
      else if (m.t === 'mbuild' && mine && g.sub !== 'buy') ok = build(r, id, i);
      else if (m.t === 'msell' && mine) ok = sell(r, id, i);
      else if (m.t === 'mmort' && mine) ok = mort(r, id, i);
      else if (m.t === 'munmort' && mine) ok = unmort(r, id, i);
      else if (m.t === 'moffer' && mine) ok = offer(r, id, i, m.amt);
      else if (m.t === 'mreply') ok = reply(r, id, !!m.ok);
      if (!ok) return 'quiet';
      if (m.t === 'mbuild' || m.t === 'msell' || m.t === 'mmort' || m.t === 'munmort') arm(r);
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const id = p.id, me = cur(g) === id && r.phase === 'play';
      return {
        sub: g.sub, turn: cur(g), order: g.order, round: g.round, lim: g.lim, pos: g.pos, cash: g.cash, jail: g.jail, jfree: g.jfree,
        own: g.own, houses: g.houses, mort: g.mort, out: g.out, dice: g.dice, rollN: g.rollN, moveN: g.moveN, offer: g.offer, card: g.card, trade: g.trade, ev: g.ev, again: g.again, final: g.final,
        net: Object.fromEntries(g.order.map(q => [q, g.out.includes(q) ? 0 : worth(g, q)])),
        rents: Object.fromEntries(Object.keys(g.own).map(i => [i, rentOf(g, +i, 7)])),
        can: me ? { build: Object.keys(g.own).map(Number).filter(i => canBuild(g, id, i)), sell: Object.keys(g.own).map(Number).filter(i => canSell(g, id, i)), mort: Object.keys(g.own).map(Number).filter(i => canMort(g, id, i)), unmort: Object.keys(g.own).map(Number).filter(i => canUnmort(g, id, i)) } : null
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play' || g.out.includes(p.id) || !g.order.includes(p.id)) return;
      const wasCur = cur(g) === p.id;
      H.log(r, `${p.name} طلع من اللعبة`);
      bankrupt(r, p.id, null);
      if (r.phase === 'play' && wasCur) nextTurn(r);
    }
  };
};
