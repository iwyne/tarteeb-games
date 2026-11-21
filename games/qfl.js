// ترتيب قفل (سكرو): كل لاعب قدامه ٤ أوراق مقلوبة ويشوف ثنتين بس أول الجولة. الهدف أقل مجموع.
// دورك: تسحب من الكومة أو تاخذ المكشوفة وتبدّل، أو ترمي. نفس رقم المكشوفة ترميها بأي وقت (والغلط عقوبة).
// «قفّل!» = الباقين لفة وحدة وبعدها تنكشف الأوراق. اللي قفّل ومو الأقل تتضاعف نقاطه. بعد كل الجولات الأقل يفوز.
const SCALE = +process.env.QFL_SCALE || 1;
const PEEK_MS = 6000, REV_MS = 9000, PICK_MS = 15000, SEE_MS = 4000;
const POW = { 7: 'own', 8: 'own', 9: 'spy', 10: 'spy', swap: 'swap', eye: 'eye', mix: 'mix', ss: 'ss', take: 'take', any: 'any' };
const ANYK = ['own', 'spy', 'swap', 'eye', 'mix', 'ss', 'take'];
const num = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
module.exports = H => {
  const ms = x => x * SCALE, rnd = n => Math.random() * n | 0;
  const P = (r, id) => r.players.find(p => p.id === id);
  const nm = (r, id) => (P(r, id) || {}).name || '؟';
  const opt = (r, k, d) => r.opts[k] || d;
  const val = c => typeof c.v === 'number' ? c.v : 10;
  const SPN = { swap: 'بدّل', eye: 'عين', mix: 'زي بعض', ss: 'شوف وبدّل', take: 'خذ بس', any: 'على كيفك' };
  const cname = c => SPN[c.v] || num(c.v);
  const same = (a, b) => a && b && a.v === b.v;
  function deck(g) {
    const d = [], add = (v, n) => { for (let i = 0; i < n; i++) d.push({ id: g.nid++, v }); };
    add(-1, 2); for (let v = 1; v <= 10; v++) add(v, 4); add(20, 2); add(25, 2); add('swap', 3); add('eye', 2); add('mix', 2); add('ss', 2); add('take', 2); add('any', 2);
    return H.shuffle(d);
  }
  function draw1(r) { const g = r.g; if (!g.deck.length) { const top = g.disc.pop(); g.deck = H.shuffle(g.disc); g.disc = top ? [top] : []; } return g.deck.pop(); }
  const fx = (r, o) => H.cast(r, Object.assign({ t: 'gnet', g: 'qfl' }, o));
  const seeTo = (r, id, o) => { const p = P(r, id); if (p && !p.bot) H.sendTo(p, Object.assign({ t: 'gnet', g: 'qfl', k: 'see' }, o)); };
  // ذاكرة البوت: يعرف أي ورقة شافها (id → قيمة)
  const mem = (r, id) => r.g.mem[id] || (r.g.mem[id] = {});
  function reveal(r, viewer, owner, sid) {
    const c = r.g.hands[owner].find(x => x.id === sid); if (!c) return;
    mem(r, viewer)[c.id] = c.v; seeTo(r, viewer, { owner, sid, v: c.v });
  }
  // ===== الجولات =====
  function round(r) {
    const g = r.g; g.rnd++; g.deck = deck(g); g.disc = []; g.mem = {}; g.called = null; g.left = null; g.drawn = null; g.pend = null; g.res = null;
    for (const id of g.order) { g.hands[id] = [draw1(r), draw1(r), draw1(r), draw1(r)]; }
    g.disc.push(draw1(r));
    g.sub = 'peek'; g.dl = Date.now() + ms(PEEK_MS);
    for (const id of g.order) for (const c of g.hands[id].slice(2)) { mem(r, id)[c.id] = c.v; }
    for (const id of g.order) seeTo(r, id, { owner: id, sids: g.hands[id].slice(2).map(c => c.id), vs: g.hands[id].slice(2).map(c => c.v), ms: ms(PEEK_MS) });
    H.log(r, `🃏 الجولة ${num(g.rnd)}: احفظ ورقتينك!`);
    H.setTimer(r, ms(PEEK_MS), () => { g.sub = 'turn'; g.turn = g.order[(g.rnd - 1) % g.order.length]; g.turns = 0; startTurn(r); });
    bots(r); H.push(r);
  }
  function startTurn(r) {
    const g = r.g; if (r.phase !== 'play') return;
    if (g.called && g.left !== null && g.left <= 0) return endRound(r);
    g.sub = 'turn'; g.drawn = null; g.pend = null; g.turns++;
    g.dl = Date.now() + ms(opt(r, 'qtime', 30) * 1000);
    H.setTimer(r, g.dl - Date.now(), () => timeout(r));
    bots(r); H.push(r);
  }
  function next(r) {
    const g = r.g; if (g.called) g.left--;
    const i = g.order.indexOf(g.turn); g.turn = g.order[(i + 1) % g.order.length];
    if (g.called && g.turn === g.called) g.left = 0;
    startTurn(r);
  }
  function timeout(r) {
    const g = r.g; if (g.sub === 'turn') { if (!g.drawn) { g.drawn = draw1(r); g.from = 'deck'; } return throwDrawn(r, P(r, g.turn), false); }
    if (g.sub === 'pick') { g.pend = null; next(r); }
  }
  // ===== حركات الدور =====
  function drawDeck(r, p) { const g = r.g; if (g.sub !== 'turn' || g.drawn) return; g.drawn = draw1(r); g.from = 'deck'; mem(r, p.id)[g.drawn.id] = g.drawn.v; fx(r, { k: 'draw', id: p.id }); H.push(r); bots(r); }
  function takeDisc(r, p) { const g = r.g; if (g.sub !== 'turn' || g.drawn || !g.disc.length) return; g.drawn = g.disc.pop(); g.from = 'disc'; mem(r, p.id)[g.drawn.id] = g.drawn.v; fx(r, { k: 'take', id: p.id, v: g.drawn.v }); H.push(r); bots(r); }
  function swapIn(r, p, sid) {
    const g = r.g, h = g.hands[p.id], i = h.findIndex(c => c.id === sid); if (g.sub !== 'turn' || !g.drawn || i < 0) return;
    const old = h[i]; h[i] = g.drawn; g.drawn = null; g.disc.push(old);
    for (const id of g.order) delete mem(r, id)[old.id];
    fx(r, { k: 'swapin', id: p.id, sid: h[i].id, old: old.id, v: old.v }); H.log(r, `🔁 ${p.name} بدّل ورقة ورمى ${cname(old)}`);
    next(r);
  }
  function throwDrawn(r, p, use) {
    const g = r.g; if (g.sub !== 'turn' || !g.drawn) return;
    const c = g.drawn; if (g.from === 'disc') { use = false; }
    g.drawn = null; g.disc.push(c); fx(r, { k: 'throw', id: p.id, v: c.v });
    const pw = use && POW[c.v];
    if (!pw) { H.log(r, `🗑️ ${p.name} رمى ${cname(c)}`); return next(r); }
    // القدرات: تحتاج اختيار ورقة
    if (pw === 'mix' && !g.hands[p.id].length) { return next(r); }
    g.sub = 'pick'; g.pend = { k: pw, by: p.id, picks: [], mode: null, wait: false }; H.log(r, `✨ ${p.name} استخدم ${cname(c)}`);
    fx(r, { k: 'power', id: p.id, p: pw });
    H.setTimer(r, ms(PICK_MS), () => timeout(r)); bots(r); H.push(r);
  }
  function pick(r, p, owner, sid) {
    const g = r.g, pd = g.pend; if (g.sub !== 'pick' || !pd || pd.by !== p.id || !g.hands[owner]) return;
    const c = g.hands[owner].find(x => x.id === sid); if (!c) return;
    const mine = owner === p.id;
    if (pd.k === 'own') { if (!mine) return; reveal(r, p.id, owner, sid); fx(r, { k: 'look', id: p.id, owner, sid }); return finish(r); }
    if (pd.k === 'spy') { if (mine) return; reveal(r, p.id, owner, sid); fx(r, { k: 'look', id: p.id, owner, sid }); return finish(r); }
    if (pd.k === 'eye') {
      if (!pd.mode || pd.picks.some(x => x[1] === sid)) return;
      if (pd.mode === 'own' ? !mine : (mine || pd.picks.some(x => x[0] === owner))) return;
      pd.picks.push([owner, sid]); reveal(r, p.id, owner, sid); fx(r, { k: 'look', id: p.id, owner, sid });
      const need = pd.mode === 'own' ? Math.min(2, g.hands[p.id].length) : g.order.filter(id => id !== p.id && g.hands[id].length).length;
      if (pd.picks.length >= need) return finish(r); return H.push(r);
    }
    if (pd.k === 'take') { if (mine) return; const c2 = draw1(r); if (c2) g.hands[owner].push(c2); fx(r, { k: 'take2', id: p.id, owner }); H.log(r, `📥 ${p.name} خلّى ${nm(r, owner)} ياخذ ورقة زيادة`); return finish(r); }
    if (pd.k === 'ss') {
      if (pd.wait) return;
      if (!pd.picks.length) { if (!mine) return; pd.picks.push([owner, sid]); reveal(r, p.id, owner, sid); return H.push(r); }
      if (mine) return; pd.picks.push([owner, sid]); reveal(r, p.id, owner, sid); fx(r, { k: 'look', id: p.id, owner, sid }); pd.wait = true; return H.push(r);
    }
    if (pd.k === 'mix') { if (!mine) return; const i = g.hands[owner].indexOf(c); g.hands[owner].splice(i, 1); g.disc.push(c); fx(r, { k: 'drop', id: p.id, sid, v: c.v }); H.log(r, `🧹 ${p.name} تخلّص من ${cname(c)}`); return finish(r); }
    if (pd.k === 'swap') {
      if (!pd.picks.length) { if (!mine) return; pd.picks.push([owner, sid]); return H.push(r); }
      if (mine) return; const [o1, s1] = pd.picks[0], h1 = g.hands[o1], h2 = g.hands[owner], i1 = h1.findIndex(x => x.id === s1), i2 = h2.indexOf(c); if (i1 < 0) return finish(r);
      [h1[i1], h2[i2]] = [h2[i2], h1[i1]];
      for (const id of g.order) { delete mem(r, id)[h1[i1].id]; delete mem(r, id)[h2[i2].id]; }
      fx(r, { k: 'swapc', id: p.id, a: [o1, h1[i1].id], b: [owner, h2[i2].id] }); H.log(r, `🔀 ${p.name} بدّل ورقة مع ${nm(r, owner)}`); return finish(r);
    }
  }
  function doSwap(r, p, a, b) {
    const g = r.g, h1 = g.hands[a[0]], h2 = g.hands[b[0]], i1 = h1 ? h1.findIndex(x => x.id === a[1]) : -1, i2 = h2 ? h2.findIndex(x => x.id === b[1]) : -1; if (i1 < 0 || i2 < 0) return;
    [h1[i1], h2[i2]] = [h2[i2], h1[i1]];
    for (const id of g.order) if (id !== p.id) { delete mem(r, id)[h1[i1].id]; delete mem(r, id)[h2[i2].id]; }
    fx(r, { k: 'swapc', id: p.id, a: [a[0], h1[i1].id], b: [b[0], h2[i2].id] }); H.log(r, `🔀 ${p.name} بدّل ورقة مع ${nm(r, b[0])}`);
  }
  function setMode(r, p, m) {
    const g = r.g, pd = g.pend; if (g.sub !== 'pick' || !pd || pd.by !== p.id) return;
    if (pd.k === 'any' && ANYK.includes(m.k)) { pd.k = m.k; fx(r, { k: 'power', id: p.id, p: m.k }); bots(r); return H.push(r); }
    if (pd.k === 'eye' && !pd.mode && ['own', 'opp'].includes(m.m)) { pd.mode = m.m; bots(r); return H.push(r); }
    if (pd.k === 'ss' && pd.wait) { if (m.ok) doSwap(r, p, pd.picks[0], pd.picks[1]); return finish(r); }
  }
  function finish(r) { const g = r.g; g.pend = null; H.push(r); setTimeout(() => { if (r.g === g && g.sub === 'pick') next(r); }, ms(700)); }
  // رمي نفس الرقم بأي وقت (حتى مو بدورك)
  function match(r, p, owner, sid) {
    const g = r.g; if (!['turn', 'pick'].includes(g.sub) || !g.hands[p.id] || !g.disc.length || g.called === p.id && false) return;
    const top = g.disc[g.disc.length - 1], h = g.hands[owner] || [], i = h.findIndex(c => c.id === sid); if (i < 0 || owner !== p.id) return;
    const c = h[i];
    if (same(c, top)) {
      h.splice(i, 1); g.disc.push(c); for (const id of g.order) delete mem(r, id)[c.id];
      fx(r, { k: 'match', id: p.id, sid, v: c.v }); H.log(r, `⚡ ${p.name} رمى ${cname(c)} مع المكشوفة!`);
    } else {
      const pen = draw1(r); h.push(pen); mem(r, p.id)[c.id] = c.v;
      fx(r, { k: 'bad', id: p.id, sid, v: c.v }); H.log(r, `❌ ${p.name} رمى غلط (${cname(c)}) وأخذ ورقة عقوبة`);
    }
    H.push(r);
  }
  function call(r, p) {
    const g = r.g; if (g.sub !== 'turn' || g.drawn || g.called || g.turns <= g.order.length) return;
    g.called = p.id; g.left = g.order.length - 1; fx(r, { k: 'call', id: p.id }); H.log(r, `🔒 ${p.name}: قفّل!`);
    if (g.left <= 0) return endRound(r);
    const i = g.order.indexOf(g.turn); g.turn = g.order[(i + 1) % g.order.length]; startTurn(r);
  }
  function endRound(r) {
    const g = r.g; g.sub = 'rev';
    const sums = Object.fromEntries(g.order.map(id => [id, g.hands[id].reduce((a, c) => a + val(c), 0)]));
    const low = Math.min(...Object.values(sums)), pts = {};
    for (const id of g.order) pts[id] = sums[id];
    if (g.called && sums[g.called] !== undefined) { if (sums[g.called] <= low) pts[g.called] = 0; else pts[g.called] = sums[g.called] * 2; }
    for (const id of g.order) g.tot[id] = (g.tot[id] || 0) + pts[id];
    g.res = { sums, pts, hands: Object.fromEntries(g.order.map(id => [id, g.hands[id].map(c => ({ id: c.id, v: c.v }))])), called: g.called, ok: g.called ? sums[g.called] <= low : null };
    fx(r, { k: 'rev' }); H.log(r, g.called ? (g.res.ok ? `🔒 ${nm(r, g.called)} قفّل وطلع الأقل!` : `💥 ${nm(r, g.called)} قفّل وطلع مو الأقل، نقاطه دبل!`) : '🃏 انتهت الجولة');
    H.setTimer(r, ms(REV_MS), () => g.rnd >= opt(r, 'qrounds', 5) ? end(r) : round(r));
    clearBots(r); H.push(r);
  }
  function end(r) {
    const g = r.g; r.phase = 'over'; g.sub = 'over';
    const best = Math.min(...g.order.map(id => g.tot[id]));
    const ws = r.players.filter(p => g.order.includes(p.id) && g.tot[p.id] === best);
    r.winner = ws.map(p => p.name).join(' و '); H.win(r, ws); H.setTimer(r, 0, null);
    H.log(r, `👑 ${r.winner} فاز بأقل نقاط (${num(best)})`); H.push(r);
  }
  // ===== البوتات =====
  function clearBots(r) { const g = r.g; if (g && g.bt) { g.bt.forEach(clearTimeout); g.bt = []; } }
  function later(r, d, fn) { const g = r.g; g.bt.push(setTimeout(() => { if (r.g === g && r.phase === 'play') { try { fn(); } catch (e) { console.error('qfl bot', e); } } }, ms(d))); }
  function guess(r, id) { const m = mem(r, id); return r.g.hands[id].map(c => c.id in m ? val({ v: m[c.id] }) : null); }
  function bots(r) {
    const g = r.g; clearBots(r);
    // رمي نفس الرقم: أي بوت يعرف ورقة تطابق المكشوفة
    const top = g.disc[g.disc.length - 1];
    if (top && ['turn', 'pick'].includes(g.sub)) for (const id of g.order) { const p = P(r, id); if (!p || !p.bot) continue; const m = mem(r, id); const c = g.hands[id].find(x => m[x.id] === top.v); if (c && Math.random() < .7) later(r, 1200 + rnd(2500), () => { const t2 = g.disc[g.disc.length - 1]; if (t2 && t2.id === top.id) match(r, p, id, c.id); }); }
    const p = P(r, g.turn); if (!p || !p.bot) return;
    if (g.sub === 'turn' && !g.drawn) return later(r, 1300 + rnd(900), () => {
      if (g.sub !== 'turn' || g.turn !== p.id || g.drawn) return;
      const gs = guess(r, p.id), known = gs.filter(x => x !== null), sum = known.reduce((a, b) => a + b, 0);
      if (known.length === gs.length && sum <= 5 + rnd(4) && g.turns > g.order.length && !g.called) return call(r, p);
      const t = g.disc[g.disc.length - 1], worst = Math.max(...gs.map(x => x === null ? 6 : x));
      if (t && typeof t.v === 'number' && t.v < Math.min(4, worst)) return takeDisc(r, p);
      drawDeck(r, p);
    });
    if (g.sub === 'turn' && g.drawn) return later(r, 1100 + rnd(900), () => {
      if (g.sub !== 'turn' || g.turn !== p.id || !g.drawn) return;
      const gs = guess(r, p.id), d = g.drawn, dv = val(d);
      let wi = -1, wv = -99; gs.forEach((x, i) => { const v = x === null ? 6.5 : x; if (v > wv) { wv = v; wi = i; } });
      if (g.from === 'disc' || (typeof d.v === 'number' && dv < wv)) return swapIn(r, p, g.hands[p.id][wi].id);
      throwDrawn(r, p, !!POW[d.v]);
    });
    if (g.sub === 'pick' && g.pend) return later(r, 1000 + rnd(800), () => {
      const pd = g.pend; if (!pd || pd.by !== p.id) return;
      const m = mem(r, p.id), mine = g.hands[p.id], opp = g.order.filter(id => id !== p.id && g.hands[id].length);
      const unknown = mine.filter(c => !(c.id in m));
      if (pd.k === 'own') return pick(r, p, p.id, (unknown[0] || mine[0]).id);
      if (pd.k === 'mix') { const worst = mine.slice().sort((a, b) => (m[b.id] !== undefined ? val({ v: m[b.id] }) : 6) - (m[a.id] !== undefined ? val({ v: m[a.id] }) : 6))[0]; return pick(r, p, p.id, worst.id); }
      if (!opp.length) return finish(r);
      const o = opp[rnd(opp.length)], oc = g.hands[o][rnd(g.hands[o].length)];
      if (pd.k === 'spy') return pick(r, p, o, oc.id);
      if (pd.k === 'any') { setMode(r, p, { k: unknown.length ? 'own' : ['spy', 'take', 'swap'][rnd(3)] }); return; }
      if (pd.k === 'eye') {
        if (!pd.mode) return setMode(r, p, { m: unknown.length >= 2 ? 'own' : 'opp' });
        if (pd.mode === 'own') { for (const c of (unknown.length ? unknown : mine).slice(0, 2)) if (g.pend) pick(r, p, p.id, c.id); if (g.pend && g.pend.k === 'eye') finish(r); return; }
        for (const id of opp) if (g.pend) pick(r, p, id, g.hands[id][rnd(g.hands[id].length)].id); return;
      }
      if (pd.k === 'take') return pick(r, p, o, oc.id);
      if (pd.k === 'ss') {
        if (!pd.wait) { const gs = guess(r, p.id); let wi = 0, wv = -99; gs.forEach((x, i) => { const v = x === null ? 6 : x; if (v > wv) { wv = v; wi = i; } }); if (!pd.picks.length) pick(r, p, p.id, mine[wi].id); if (g.pend && !g.pend.wait) pick(r, p, o, oc.id); }
        const q = g.pend; if (!q || !q.wait) return; const mv = m[q.picks[0][1]], tv = m[q.picks[1][1]];
        return setMode(r, p, { ok: mv !== undefined && tv !== undefined && val({ v: tv }) < val({ v: mv }) });
      }
      if (pd.k === 'swap') { const gs = guess(r, p.id); let wi = 0, wv = -99; gs.forEach((x, i) => { const v = x === null ? 6 : x; if (v > wv) { wv = v; wi = i; } }); if (wv < 6) return finish(r); pick(r, p, p.id, mine[wi].id); if (g.pend) pick(r, p, o, oc.id); }
    });
  }
  return {
    min: 2, max: 6,
    start(r) {
      r.g = { order: H.shuffle(r.players.map(p => p.id)), hands: {}, deck: [], disc: [], rnd: 0, tot: {}, mem: {}, bt: [], nid: 1, sub: 'peek', turn: null, turns: 0 };
      for (const id of r.g.order) r.g.tot[id] = 0;
      r.winner = null; r.phase = 'play'; H.log(r, '🔒 ترتيب قفل: أقل مجموع يفوز. احفظ أوراقك!'); round(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || !g.order.includes(p.id) || !H.rate(p, 'qf', 150)) return 'quiet';
      const mine = g.turn === p.id;
      if (m.t === 'qmatch') { match(r, p, p.id, +m.sid); return 'quiet'; }
      if (!mine) return 'quiet';
      if (m.t === 'qdraw') drawDeck(r, p); else if (m.t === 'qtake') takeDisc(r, p); else if (m.t === 'qswap') swapIn(r, p, +m.sid);
      else if (m.t === 'qthrow') throwDrawn(r, p, !!m.use); else if (m.t === 'qpick') pick(r, p, m.owner, +m.sid); else if (m.t === 'qcall') call(r, p);
      else if (m.t === 'qskip' && g.sub === 'pick') { g.pend = null; next(r); }
      else if (m.t === 'qmode') setMode(r, p, m);
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null; const me = g.order.includes(p.id);
      return {
        sub: g.sub, rnd: g.rnd, rounds: opt(r, 'qrounds', 5), turn: g.turn, order: g.order, tot: g.tot, called: g.called, deck: g.deck.length,
        top: g.disc.length ? g.disc[g.disc.length - 1] : null, ndisc: g.disc.length,
        hands: Object.fromEntries(g.order.map(id => [id, g.hands[id].map(c => c.id)])),
        drawn: me && g.turn === p.id && g.drawn ? { c: g.drawn, from: g.from } : g.drawn ? { from: g.from } : null,
        pend: g.pend ? { k: g.pend.k, by: g.pend.by, picks: g.pend.picks, mode: g.pend.mode, wait: g.pend.wait } : null, res: g.res,
        left: g.dl ? Math.max(0, g.dl - Date.now()) : 0, canCall: g.sub === 'turn' && !g.drawn && !g.called && g.turns > g.order.length, spec: !me
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play' || !g.order.includes(p.id)) return;
      g.order = g.order.filter(id => id !== p.id); delete g.hands[p.id];
      if (g.order.length < 2) return end(r);
      if (g.called === p.id) g.called = null;
      if (g.turn === p.id) { g.turn = g.order[0]; startTurn(r); } else H.push(r);
    }
  };
};
