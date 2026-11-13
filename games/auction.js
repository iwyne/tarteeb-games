// المزاد: أغراض قيمتها الحقيقية مخفية، وتتزايدون عليها بفلوس وهمية.
// كل غرض يوصل «خبر سري» عن قيمته لواحد أو اثنين بس. بالآخر: فلوسك + قيمة أغراضك = ثروتك.
const SCALE = +process.env.AUCTION_SCALE || 1;
const START = 15000, FIRST_MS = 14000, BID_MS = 8000, SOLD_MS = 5000, SHOW_MS = 3000;
const rnd = n => Math.random() * n | 0;
const ITEMS = [
  ['دلّة نحاس قديمة', '☕', 1800, .5, 'يقولون عمرها أكثر من ٧٠ سنة'], ['كابريس موديل ٩٠', '🚗', 9000, .5, 'ماشية ٣٠٠ ألف كيلو بس نظيفة'],
  ['شماغ لبسه لاعب مشهور', '🧣', 3500, .8, 'معه صورة… بس الصورة مغبّشة'], ['نوكيا ٣٣١٠ بكرتونه', '📱', 1200, .6, 'ما انفتح من الكرتون'],
  ['لوحة لفنان مجهول', '🖼️', 2500, 1.2, 'يمكن تحفة… ويمكن رسمة ولد الجيران'], ['سجادة إيرانية يدوية', '🧶', 4000, .5, 'شغل يدوي ٣ سنين'],
  ['ساعة جيب ذهبية', '⌚', 5000, .6, 'واقفة على الساعة ٤ وربع'], ['صقر شاهين', '🦅', 8000, .4, 'صيّاد من الدرجة الأولى'],
  ['كاسيت طرب أصلي', '📼', 600, .7, 'تسجيل حفلة قديمة'], ['خاتم بفص أحمر', '💍', 3000, 1.1, 'ياقوت؟ ولا زجاج؟'],
  ['جزمة رياضية إصدار محدود', '👟', 2200, .6, 'مقاس ٤٧ بس'], ['بلايستيشن ١ شغّال', '🎮', 700, .6, 'مع يدّتين ولعبة وحدة'],
  ['مبخرة فضة', '🪔', 1500, .5, 'عليها ختم صايغ معروف'], ['ناقة أصيلة', '🐪', 12000, .5, 'أمها فازت بمزاين'],
  ['كرسي حلاق قديم', '💈', 900, .6, 'يدور ويطلع وينزل'], ['مخطوطة قديمة', '📜', 6000, 1.2, 'محد قدر يقراها'],
  ['تمثال صغير فرعوني', '🗿', 2000, 1.3, 'البايع حلف إنه أصلي'], ['جيتار موقّع', '🎸', 3500, .7, 'التوقيع باهت شوي'],
  ['دباب قديم', '🏍️', 6000, .6, 'يبي له تشييك بسيط'], ['عملة ذهبية', '🪙', 4500, .5, 'لقوها في بيت طين'],
  ['قارورة دهن عود', '🧴', 2800, .6, 'كمبودي معتّق'], ['تلفزيون أبيض وأسود', '📺', 400, .7, 'يجيب قناة وحدة'],
  ['كاميرا فيلم قديمة', '📷', 1300, .6, 'فيها فيلم ما انطبع'], ['سيف مزخرف', '🗡️', 5500, .6, 'مقبضه فضة'],
  ['بشت مطرّز', '🧥', 2600, .5, 'زري ذهبي'], ['لوحة سيارة مميزة', '🔢', 15000, .6, 'ثلاث حروف ورقم واحد'],
  ['ميدالية رياضية', '🏅', 1700, .9, 'مكتوب عليها سنة ١٩٨٤'], ['آلة كاتبة', '⌨️', 800, .6, 'الحروف عربية'],
  ['شنطة جلد فاخرة', '👜', 3800, .7, 'ماركة؟ مدري'], ['تيلسكوب', '🔭', 1600, .5, 'تشوف فيه القمر قريب']
];
const MYST = [['صندوق مقفل', '🧰', 'محد يدري وش فيه'], ['شنطة سفر ضايعة', '🧳', 'من مزاد مفقودات المطار'], ['كيس ثقيل', '🎒', 'يخشخش إذا هزّيته']];
const r50 = v => Math.max(50, Math.round(v / 50) * 50);
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  function makeDeck(n) {
    const items = H.shuffle(ITEMS.slice()).slice(0, n - Math.min(2, Math.floor(n / 4))).map(([name, e, v, s, h]) => ({ name, e, h, v: r50(v * (1 + (Math.random() * 2 - 1) * s * .6)) }));
    const boxes = H.shuffle(MYST.slice()).slice(0, n - items.length).map(([name, e, h]) => {
      const x = Math.random(), v = x < .55 ? 50 + rnd(750) : x < .88 ? 1000 + rnd(4000) : 9000 + rnd(16000);
      return { name, e, h, v: r50(v), box: 1 };
    });
    return H.shuffle([...items, ...boxes]);
  }
  function next(r) {
    const g = r.g; g.k++; g.bt.forEach(clearTimeout); g.bt = [];
    g.it = g.deck[g.k - 1]; g.price = 0; g.top = null; g.bids = []; g.sub = 'show';
    // خبر سري لواحد أو اثنين: القيمة بين رقمين
    const ids = H.shuffle(r.players.map(p => p.id)).slice(0, r.players.length >= 6 ? 2 : 1);
    const lo = r50(g.it.v * (.75 + Math.random() * .1)), hi = r50(g.it.v * (1.15 + Math.random() * .15));
    g.tips = Object.fromEntries(ids.map(id => [id, [lo, hi]]));
    H.setTimer(r, SHOW_MS * SCALE, () => { g.sub = 'bid'; H.setTimer(r, FIRST_MS * SCALE, () => sold(r)); botsThink(r); });
  }
  function bid(r, p, add) {
    const g = r.g; if (g.sub !== 'bid' || p.spec) return;
    if (![100, 500, 1000, 5000].includes(add)) return;
    if (g.top === p.id) return;
    const amt = g.price + add, P = g.P[p.id]; if (!P || amt > P.cash) { H.err(p, 'فلوسك ما تكفي 💸'); return; }
    g.price = amt; g.top = p.id; g.bids.push({ id: p.id, a: amt }); if (g.bids.length > 6) g.bids.shift();
    g.bidN++;
    H.setTimer(r, BID_MS * SCALE, () => sold(r));
    botsThink(r);
  }
  function sold(r) {
    const g = r.g; if (g.sub !== 'bid') return;
    g.sub = 'sold'; g.bt.forEach(clearTimeout); g.bt = [];
    if (g.top) { const P = g.P[g.top]; P.cash -= g.price; P.items.push({ name: g.it.name, e: g.it.e, paid: g.price, v: g.it.v }); }
    g.hist.push({ name: g.it.name, e: g.it.e, v: g.it.v, by: g.top, paid: g.top ? g.price : 0 });
    H.setTimer(r, SOLD_MS * SCALE, () => g.k >= g.count ? end(r) : next(r));
  }
  const worth = P => P.cash + P.items.reduce((s, x) => s + x.v, 0);
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'end';
    const top = Math.max(...r.players.map(p => g.P[p.id] ? worth(g.P[p.id]) : 0)), ws = r.players.filter(p => g.P[p.id] && worth(g.P[p.id]) === top);
    r.winner = ws.map(p => p.name).join(' و ') || 'انتهت اللعبة'; r.winTeam = null; H.win(r, ws); H.setTimer(r, 0, null);
  }
  // البوتات: كل بوت له تقدير (أدق لو جاه الخبر السري) ويزايد لين يوصل قريب منه
  function botsThink(r) {
    const g = r.g, n = g.bidN;
    r.players.filter(p => p.bot && p.id !== g.top).forEach(b => {
      const P = g.P[b.id]; if (!P) return;
      if (P.est == null || P.estK !== g.k) { P.estK = g.k; const t = g.tips[b.id]; P.est = t ? (t[0] + t[1]) / 2 * (.85 + Math.random() * .2) : g.it.v * (g.it.box ? .3 + Math.random() * .9 : .6 + Math.random() * .7); }
      const add = g.price < 2000 ? (Math.random() < .6 ? 100 : 500) : Math.random() < .5 ? 500 : 1000;
      if (g.price + add > Math.min(P.est * .92, P.cash) || Math.random() < .3) return;
      later(r, (1200 + rnd(4500)) * SCALE, () => { if (g.bidN === n && g.sub === 'bid') bid(r, b, add); });
    });
  }
  return {
    min: 2, max: 10,
    start(r) {
      const count = [6, 8, 10].includes(r.opts.aitems) ? r.opts.aitems : 8;
      r.g = { count, k: 0, deck: makeDeck(count), P: {}, it: null, price: 0, top: null, bids: [], bidN: 0, sub: 'intro', tips: {}, hist: [], bt: [] };
      r.players.forEach(p => { r.g.P[p.id] = { cash: START, items: [] }; });
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'زايد بذكاء… القيمة الحقيقية مخفية');
      H.setTimer(r, 2500 * SCALE, () => next(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'abid') { if (!H.rate(p, 'ab', 250)) return 'quiet'; return bid(r, p, +m.a); }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const open = g.sub === 'sold' || g.sub === 'end';
      const P = {}; for (const [id, x] of Object.entries(g.P)) P[id] = { cash: x.cash, n: x.items.length, items: open || id === p.id || r.phase === 'over' ? x.items : x.items.map(i => ({ name: i.name, e: i.e, paid: i.paid })), worth: r.phase === 'over' ? worth(x) : null };
      return {
        sub: g.sub, k: g.k, count: g.count, start: START, P, price: g.price, top: g.top, bids: g.bids, bidN: g.bidN,
        it: g.it && { name: g.it.name, e: g.it.e, h: g.it.h, box: !!g.it.box, v: open ? g.it.v : null },
        tip: g.tips[p.id] || null, tipped: Object.keys(g.tips).length, hist: open || r.phase === 'over' ? g.hist : g.hist.map(h => ({ name: h.name, e: h.e, by: h.by, paid: h.paid, v: h.v }))
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      delete g.P[p.id];
      if (g.top === p.id && g.sub === 'bid') { const prev = g.bids.filter(b => b.id !== p.id && g.P[b.id]).pop(); g.top = prev ? prev.id : null; g.price = prev ? prev.a : 0; }
      if (r.players.length < 2) end(r);
    }
  };
};
