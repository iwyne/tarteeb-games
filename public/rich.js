// ================= مليونير الديرة =================
const RI = { built: false, shownPos: {}, moveN: -1, rollN: -1, evN: -1, cardN: -1, tradeN: -1, rolling: 0, detail: null, timers: [] };
const RCOL = ['#e8362d', '#2a5bd7', '#1fa35c', '#f2b705', '#9b59d0', '#ff7a1a'];
const RICON = { go: '🏁', jail: '🚔', rest: '☕', tojail: '👮', c: '🎴', x: '💸' };
const rNum = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',').replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]).replace(/,/g, '٬');
const rName = id => { const p = S.players.find(q => q.id === id); return p ? p.name : '؟'; };
const rCol = (g, id) => RCOL[g.order.indexOf(id) % RCOL.length];
// مكان الخانة بالشبكة ٩×٩ (من اليسار لليمين)
function rCell(i) {
  if (i === 0) return [9, 9]; if (i < 8) return [9, 9 - i]; if (i === 8) return [9, 1];
  if (i < 16) return [9 - (i - 8), 1]; if (i === 16) return [1, 1]; if (i < 24) return [1, 1 + (i - 16)];
  if (i === 24) return [1, 9]; return [1 + (i - 24), 9];
}
const rSide = i => i % 8 === 0 ? 'corner' : i < 8 ? 'b' : i < 16 ? 'l' : i < 24 ? 't' : 'r';
function rCenter(i) { // مركز الخانة بالنسبة المئوية
  const [row, col] = rCell(i), f = c => { const st = c === 1 ? 0 : 1.4 + (c - 2), w = c === 1 || c === 9 ? 1.4 : 1; return (st + w / 2) / 9.8 * 100; };
  return [f(col), f(row)];
}
function rTileIcon(t) { if (t.k === 't') return t.n.includes('مطار') ? '✈️' : t.n.includes('مترو') ? '🚇' : '🚆'; if (t.k === 'u') return t.n.includes('مياه') ? '💧' : '⚡'; return RICON[t.k] || ''; }

function rBuild(body) {
  const B = RICHB;
  body.dataset.built = 'rich';
  RI.shownPos = {}; RI.moveN = -1; RI.rollN = -1; RI.evN = -1; RI.cardN = -1; RI.tradeN = -1; RI.detail = null;
  const tiles = B.T.map((t, i) => {
    const [row, col] = rCell(i), side = rSide(i);
    const band = t.k === 'p' ? `<i class="rband" style="background:${B.G[t.g]}"></i>` : '';
    const ic = rTileIcon(t);
    return `<button type="button" class="rt ${side} k-${t.k}" data-i="${i}" style="grid-row:${row};grid-column:${col}">${band}${ic ? `<em>${ic}</em>` : ''}<b>${esc(t.n)}</b>${t.pr ? `<small class="rpr">${rNum(t.pr)}</small>` : t.amt ? `<small class="rpr">−${rNum(t.amt)}</small>` : ''}<span class="rown"></span><span class="rhs"></span></button>`;
  }).join('');
  body.innerHTML = `<div class="rw">
    <div class="rbox"><div class="rboard" dir="ltr">${tiles}
      <div class="rmid" dir="rtl"><div class="rlogo">مليونير<br><span>الديرة</span></div>
        <div class="rdice"><i class="rd" id="rD1"></i><i class="rd" id="rD2"></i></div>
        <div class="rstat" id="rStat"></div><div class="racts" id="rActs"></div>
        <div class="rcard" id="rCard" hidden></div></div>
      <div class="rtoks" id="rToks"></div></div></div>
    <aside class="rside"><div class="rround" id="rRound"></div><div class="rplayers" id="rPlayers"></div>
      <h4>أملاكي</h4><div class="rmine" id="rMine"></div>${logHtml()}</aside>
    <div class="rpop" id="rPop" hidden></div><div class="rpop" id="rTrade" hidden></div><div class="rpop" id="rOver" hidden></div>
  </div>`;
  body.querySelectorAll('.rt').forEach(b => b.onclick = () => { RI.detail = +b.dataset.i; rDetail(); sfx('pop'); });
  RI.built = true;
}
function rDice(a, b) {
  const face = n => [[], [5], [1, 9], [1, 5, 9], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]][n].map(k => `<b style="grid-area:p${k}"></b>`).join('');
  $('#rD1').innerHTML = face(a); $('#rD2').innerHTML = face(b);
}
function renderRich(body) {
  if (body.dataset.built !== 'rich' || !$('#rToks')) rBuild(body);
  const g = S.g, B = RICHB, me = S.me, over = S.phase === 'over', mine = g.turn === me && !over && !S.spec;
  // ---- الخانات: المالك والبيوت والرهن ----
  body.querySelectorAll('.rt').forEach(el => {
    const i = +el.dataset.i, o = g.own[i], h = g.houses[i] || 0;
    el.style.setProperty('--oc', o != null ? rCol(g, o) : 'transparent');
    el.classList.toggle('owned', o != null); el.classList.toggle('mort', !!g.mort[i]); el.classList.toggle('offer', g.offer === i && g.sub === 'buy');
    el.querySelector('.rhs').textContent = h === 5 ? '🏨' : '🏠'.repeat(h);
  });
  // ---- القطع ----
  const toks = $('#rToks');
  g.order.forEach((id, k) => {
    let t = toks.querySelector(`[data-id="${id}"]`);
    if (!t) { t = document.createElement('i'); t.className = 'rtok'; t.dataset.id = id; const p = S.players.find(q => q.id === id); t.textContent = p ? (p.av || [...p.name][0] || '?') : '?'; t.style.background = rCol(g, id); toks.appendChild(t); }
    t.classList.toggle('out', g.out.includes(id)); t.classList.toggle('cur', g.turn === id && !over);
    t.title = rName(id);
  });
  if (g.moveN !== RI.moveN) { const first = RI.moveN < 0; RI.moveN = g.moveN; rAnimMoves(g, first); }
  // ---- الزهر ----
  if (g.rollN !== RI.rollN) {
    const first = RI.rollN < 0; RI.rollN = g.rollN;
    if (first || !g.rollN) rDice(g.dice[0], g.dice[1]);
    else { const box = $('.rdice'); box.classList.add('roll'); let k = 0; clearInterval(RI.rolling); RI.rolling = setInterval(() => { rDice(1 + Math.random() * 6 | 0, 1 + Math.random() * 6 | 0); if (++k > 7) { clearInterval(RI.rolling); rDice(g.dice[0], g.dice[1]); box.classList.remove('roll'); } }, 70); [0, .12, .26].forEach(t => sfx('marble', { at: t, gain: .9 })); }
  }
  $('.rdice').classList.toggle('dbl', g.dice[0] === g.dice[1] && g.rollN > 0);
  // ---- كرت الحظ ----
  const cd = $('#rCard');
  if (g.card && g.card.n !== RI.cardN) {
    RI.cardN = g.card.n; cd.innerHTML = `<small>🎴 حظ ${esc(rName(g.card.id))}</small><p>${esc(g.card.tx)}</p>`; cd.hidden = false; cd.classList.remove('in'); void cd.offsetWidth; cd.classList.add('in'); sfx('fan');
    clearTimeout(RI.cardT); RI.cardT = setTimeout(() => { cd.hidden = true; }, 3800);
  }
  // ---- أحداث: إيجار، شراء، توقيف، إفلاس ----
  if (g.ev && g.ev.n !== RI.evN) {
    const first = RI.evN < 0; RI.evN = g.ev.n; const e = g.ev;
    if (!first) {
      if (e.k === 'rent') { rFloat(e.id, '−' + rNum(e.amt), 'neg'); rFloat(e.to, '+' + rNum(e.amt), 'pos'); sfx('coin'); }
      else if (e.k === 'buy' || e.k === 'deal') { sfx('coin'); rFlash(e.i); }
      else if (e.k === 'build') { sfx('gclick'); rFlash(e.i); }
      else if (e.k === 'jail') sfx('siren');
      else if (e.k === 'broke') sfx('lose');
      else if (e.k === 'nodeal' && e.id === me) toast('رفض عرضك ❌');
    }
  }
  // ---- الوسط: الحالة والأزرار ----
  const cur = g.turn, inJail = g.jail[cur] > 0;
  let st = '';
  if (over) st = `🏆 ${esc(S.winner || '')}`;
  else if (mine) st = g.sub === 'roll' ? (inJail ? '🚔 أنت بالتوقيف' : 'دورك! 🎲') : g.sub === 'buy' ? 'تشتريها؟' : g.again ? 'جبت دبل! 🎲' : 'تقدر تبني أو تخلّص دورك';
  else st = `دور <b style="color:${rCol(g, cur)}">${esc(rName(cur))}</b>${inJail ? ' 🚔' : ''}`;
  $('#rStat').innerHTML = st;
  let acts = '';
  if (mine && g.sub === 'roll') {
    acts = `<button type="button" class="btn rbig" data-a="mroll">🎲 ارمِ الزهر</button>`;
    if (inJail) acts += `<button type="button" class="btn rsm" data-a="mjail" data-k="pay"${g.cash[me] < 50 ? ' disabled' : ''}>ادفع ٥٠ واطلع</button>${g.jfree[me] ? `<button type="button" class="btn rsm" data-a="mjail" data-k="card">🎫 استخدم الكرت</button>` : ''}`;
  } else if (mine && g.sub === 'buy') {
    const t = B.T[g.offer];
    acts = `<div class="roffer"><i style="background:${t.k === 'p' ? B.G[t.g] : '#16130f'}"></i><b>${rTileIcon(t)} ${esc(t.n)}</b><span>${rNum(t.pr)}</span></div><button type="button" class="btn rbig" data-a="mbuy"${g.cash[me] < t.pr ? ' disabled' : ''}>اشترِ 💰</button><button type="button" class="btn rsm ghost" data-a="mskip">لا، كمّل</button>`;
  } else if (mine && g.sub === 'act') {
    acts = `<button type="button" class="btn rbig" data-a="mend">${g.again ? '🎲 ارمِ مرة ثانية' : 'خلّص دورك ➡'}</button>`;
    if (g.can && g.can.build.length) acts += `<small class="rhint">تقدر تبني في ${rNum(g.can.build.length)} عقار — من «أملاكي» 👉</small>`;
  }
  const ab = $('#rActs'); if (ab.dataset.k !== acts) { ab.dataset.k = acts; ab.innerHTML = acts; ab.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { send({ t: b.dataset.a, k: b.dataset.k }); sfx('pop'); }); }
  if (mine && g.sub === 'roll' && RI.turnSnd !== g.rollN + ':' + cur) { RI.turnSnd = g.rollN + ':' + cur; sfx('turn'); }
  // ---- اللاعبين ----
  $('#rRound').textContent = `الجولة ${rNum(g.round)}${g.lim ? ` من ${rNum(g.lim)}` : ''}`;
  $('#rPlayers').innerHTML = g.order.map(id => {
    const n = Object.keys(g.own).filter(i => g.own[i] === id).length;
    return `<div class="rp${g.turn === id && !over ? ' cur' : ''}${g.out.includes(id) ? ' out' : ''}${id === me ? ' me' : ''}" data-id="${id}" style="--c:${rCol(g, id)}"><i>${esc((S.players.find(q => q.id === id) || {}).av || [...rName(id)][0] || '?')}</i><span><b>${esc(rName(id))}${g.jail[id] > 0 ? ' 🚔' : ''}${g.jfree[id] ? ' 🎫' : ''}</b><small>${g.out.includes(id) ? 'أفلس 💸' : `🏠 ${rNum(n)} · الثروة ${rNum(g.net[id])}`}</small></span><em>${g.out.includes(id) ? '—' : rNum(g.cash[id])}</em></div>`;
  }).join('');
  // ---- أملاكي ----
  const myT = Object.keys(g.own).map(Number).filter(i => g.own[i] === me).sort((a, b) => a - b);
  $('#rMine').innerHTML = myT.length ? myT.map(i => { const t = B.T[i], h = g.houses[i] || 0, can = g.can || {}; return `<button type="button" class="rmc${g.mort[i] ? ' mort' : ''}${(can.build || []).includes(i) ? ' canb' : ''}" data-i="${i}" style="--gc:${t.k === 'p' ? B.G[t.g] : '#16130f'}">${rTileIcon(t)} ${esc(t.n)}${h ? ` <em>${h === 5 ? '🏨' : '🏠' + rNum(h)}</em>` : ''}${g.mort[i] ? ' <em>مرهون</em>' : ''}</button>`; }).join('') : '<p class="rnone">لسا ما عندك عقار</p>';
  $('#rMine').querySelectorAll('.rmc').forEach(b => b.onclick = () => { RI.detail = +b.dataset.i; rDetail(); });
  if (RI.detail != null) rDetail();
  // ---- عرض شراء موجّه لي ----
  const tr = $('#rTrade');
  if (g.trade && g.trade.to === me && !S.spec) {
    if (RI.tradeN !== g.trade.n) {
      RI.tradeN = g.trade.n; const t = B.T[g.trade.i];
      tr.innerHTML = `<div class="rpb"><h3>🤝 عرض شراء</h3><p><b>${esc(rName(g.trade.from))}</b> يبي يشتري <b>${esc(t.n)}</b> منك بـ<b>${rNum(g.trade.amt)}</b></p><small>سعرها الأصلي ${rNum(t.pr)}</small><div class="rpa"><button type="button" class="btn" data-y="1">✅ أبيع</button><button type="button" class="btn ghost" data-y="0">❌ لا</button></div></div>`;
      tr.querySelectorAll('[data-y]').forEach(b => b.onclick = () => { send({ t: 'mreply', ok: b.dataset.y === '1' }); tr.hidden = true; });
      sfx('ding');
    }
    tr.hidden = false;
  } else tr.hidden = true;
  // ---- النهاية ----
  const ov = $('#rOver');
  if (over && g.final) {
    if (!ov.dataset.done) { ov.dataset.done = '1'; sfx('win'); }
    ov.innerHTML = `<div class="rpb"><h3>🏆 ${esc(S.winner || '')}</h3><p>صار مليونير الديرة!</p><ol class="rfin">${g.final.map(f => `<li style="--c:${rCol(g, f.id)}"><b>${esc(rName(f.id))}</b><span>${f.w ? rNum(f.w) : 'أفلس'}</span></li>`).join('')}</ol><button type="button" class="btn ghost" id="rOverX">شوف اللوح</button></div>`;
    ov.hidden = !!RI.overClosed; $('#rOverX').onclick = () => { RI.overClosed = true; ov.hidden = true; };
  } else { ov.hidden = true; delete ov.dataset.done; RI.overClosed = false; }
}
// القطع تمشي خانة خانة
function rAnimMoves(g, first) {
  RI.timers.forEach(clearTimeout); RI.timers = [];
  const toks = $('#rToks');
  g.order.forEach((id, k) => {
    const t = toks.querySelector(`[data-id="${id}"]`); if (!t) return;
    const to = g.pos[id], from = RI.shownPos[id];
    const place = i => { const [x, y] = rCenter(i), sameN = g.order.filter(o => g.pos[o] === i && !g.out.includes(o)), idx = Math.max(0, sameN.indexOf(id)); const dx = (idx % 3 - 1) * 2.6, dy = (Math.floor(idx / 3) - .3) * 2.6; t.style.left = (x + dx) + '%'; t.style.top = (y + dy) + '%'; };
    if (first || from == null || from === to) { place(to); RI.shownPos[id] = to; return; }
    const steps = (to - from + 32) % 32;
    if (steps > 0 && steps <= 12) {
      for (let s = 1; s <= steps; s++) RI.timers.push(setTimeout(() => { place((from + s) % 32); sfx('marble', { gain: .5 }); if (s === steps) t.classList.add('land'), setTimeout(() => t.classList.remove('land'), 400); }, s * 150));
    } else { t.classList.add('jump'); place(to); setTimeout(() => t.classList.remove('jump'), 600); }
    RI.shownPos[id] = to;
  });
}
function rFloat(id, txt, cls) {
  const t = $(`#rToks [data-id="${id}"]`); if (!t) return;
  const f = document.createElement('b'); f.className = 'rfloat ' + cls; f.textContent = txt; f.style.left = t.style.left; f.style.top = t.style.top; $('#rToks').appendChild(f); setTimeout(() => f.remove(), 1600);
}
function rFlash(i) { const el = $(`.rt[data-i="${i}"]`); if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
// نافذة تفاصيل الخانة
function rDetail() {
  const pop = $('#rPop'), i = RI.detail, g = S.g; if (!pop || i == null || !g) return;
  if (document.activeElement && document.activeElement.id === 'rAmt' && !pop.hidden) return; // لا نمسح الرقم وهو يكتب
  const B = RICHB, t = B.T[i], o = g.own[i], h = g.houses[i] || 0, me = S.me, mineTurn = g.turn === me && S.phase === 'play' && !S.spec, can = g.can || {};
  let rows = '';
  if (t.k === 'p') rows = `<table class="rtbl"><tr><td>الإيجار</td><td>${rNum(t.base)}</td></tr><tr><td>المجموعة كاملة</td><td>${rNum(t.base * 2)}</td></tr>${[1, 2, 3, 4].map(n => `<tr${h === n ? ' class="on"' : ''}><td>${'🏠'.repeat(n)}</td><td>${rNum(t.base * B.MULT[n])}</td></tr>`).join('')}<tr${h === 5 ? ' class="on"' : ''}><td>🏨 فندق</td><td>${rNum(t.base * B.MULT[5])}</td></tr><tr><td>سعر البيت</td><td>${rNum(t.hc)}</td></tr></table>`;
  else if (t.k === 't') rows = `<p>الإيجار ٢٥، ويتضاعف مع كل محطة/مطار تملكه (٢٥ · ٥٠ · ١٠٠ · ٢٠٠)</p>`;
  else if (t.k === 'u') rows = `<p>الإيجار = مجموع الزهر × ٤ (أو × ١٠ لو تملك الكهرباء والمياه)</p>`;
  else rows = `<p>${{ go: 'كل ما تمر من هنا تاخذ ٢٠٠ 💰', jail: 'لو انحجزت: ادفع ٥٠، أو ارمِ دبل، أو استخدم كرت الخروج. لو جيت زيارة عادي ما يصير شي.', rest: 'استراحة، ما يصير شي ☕', tojail: 'تروح للتوقيف على طول 🚔', c: 'تسحب كرت حظ — ممكن يكون حلو وممكن لا 😅', x: `تدفع ${rNum(t.amt || 0)} للبنك` }[t.k] || ''}</p>`;
  let acts = '';
  if (mineTurn && o === me && g.sub !== 'buy') {
    if ((can.build || []).includes(i)) acts += `<button type="button" class="btn" data-a="mbuild">🏠 ابنِ (${rNum(t.hc)})</button>`;
    if ((can.sell || []).includes(i)) acts += `<button type="button" class="btn ghost" data-a="msell">بع بيت (+${rNum(t.hc / 2)})</button>`;
    if ((can.mort || []).includes(i)) acts += `<button type="button" class="btn ghost" data-a="mmort">ارهنها (+${rNum(t.pr / 2)})</button>`;
    if ((can.unmort || []).includes(i)) acts += `<button type="button" class="btn ghost" data-a="munmort">فك الرهن (−${rNum(Math.ceil(t.pr * .55))})</button>`;
    if (t.k === 'p' && !(can.build || []).includes(i) && h < 5 && !acts.includes('mbuild')) acts += `<small class="rhint">تبني لما تملك المجموعة كاملة (وبالتساوي)</small>`;
  } else if (mineTurn && o != null && o !== me && !g.out.includes(o) && !g.trade && g.sub !== 'buy' && !(t.k === 'p' && B.GROUP[t.g].some(j => (g.houses[j] || 0) > 0))) {
    acts = `<div class="rofr"><input id="rAmt" type="number" inputmode="numeric" min="1" max="${g.cash[me]}" value="${Math.min(g.cash[me], Math.round(t.pr * 1.5))}"><button type="button" class="btn" id="rOfr">🤝 اعرض عليه</button></div>`;
  }
  pop.innerHTML = `<div class="rpb rdet"><button type="button" class="rx" aria-label="سكّر">✕</button><div class="rdh" style="--gc:${t.k === 'p' ? B.G[t.g] : '#16130f'}"><em>${rTileIcon(t)}</em><h3>${esc(t.n)}</h3>${t.pr ? `<span>${rNum(t.pr)}</span>` : ''}</div>
    ${o != null ? `<p class="rownr">المالك: <b style="color:${rCol(g, o)}">${esc(rName(o))}</b>${g.mort[i] ? ' · مرهونة (ما تجيب إيجار)' : ` · الإيجار الحين ${rNum(g.rents[i] || 0)}`}</p>` : t.pr ? '<p class="rownr">للبيع 🏷</p>' : ''}${rows}<div class="rpa">${acts}</div></div>`;
  pop.hidden = false;
  pop.querySelector('.rx').onclick = () => { RI.detail = null; pop.hidden = true; };
  pop.onclick = e => { if (e.target === pop) { RI.detail = null; pop.hidden = true; } };
  pop.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { send({ t: b.dataset.a, i }); sfx('pop'); });
  const of = $('#rOfr'); if (of) of.onclick = () => { const v = +$('#rAmt').value; if (!(v >= 1)) return; send({ t: 'moffer', i, amt: v }); RI.detail = null; pop.hidden = true; toast('أرسلت العرض 🤝'); };
}
