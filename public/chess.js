// الشطرنج: لوحة خشب، اختيار بالضغط أو السحب، نقاط للحركات المتاحة، ترقية، ساعات
const CH = { sel: null, flip: false, lastN: -1, drag: null, prom: null, off: 0, tick: 0 };
const CHF = 'abcdefgh';
const chPiece = p => `<img class="chpc" src="chess/${p === p.toUpperCase() ? 'w' : 'b'}${p.toUpperCase()}.svg" alt="" draggable="false">`;
const CHSYM = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘' };
const chSan = s => s.replace(/[KQRBN]/g, c => CHSYM[c]);
function chBoard(fen) { const B = {}; fen.split(' ')[0].split('/').forEach((row, r) => { let f = 0; for (const ch of row) { if (/\d/.test(ch)) f += +ch; else { B[CHF[f] + (8 - r)] = ch; f++; } } }); return B; }
const chBottom = () => { const g = S.g; const me = g.me || 'w'; return CH.flip ? (me === 'w' ? 'b' : 'w') : me; };
function chName(id) { const p = S.players.find(x => x.id === id); return p ? esc(p.name) : '؟'; }
const chFmt = ms => { ms = Math.max(0, ms); const s = Math.ceil(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : ms < 10000 ? (ms / 1000).toFixed(1) : '0:' + String(s).padStart(2, '0'); };
const VALS = { p: 1, n: 3, b: 3, r: 5, q: 9 };
function chBar(color) {
  const g = S.g, id = color === 'w' ? g.w : g.b, caps = g.caps[color] || [], opp = g.caps[color === 'w' ? 'b' : 'w'] || [];
  const diff = caps.reduce((s, c) => s + VALS[c], 0) - opp.reduce((s, c) => s + VALS[c], 0);
  const p = S.players.find(x => x.id === id), bot = p && p.bot;
  return `<div class="chbar${g.turn === color && !g.over ? ' on' : ''}" data-c="${color}"><span class="chav ${color}">${bmFace(id)}</span><b class="nt">${chName(id)}${bot ? ` <small>🤖 ${{ easy: 'سهل', mid: 'متوسط', hard: 'صعب' }[g.lv]}</small>` : ''}</b>
    <span class="chcap">${caps.map(c => `<img src="chess/${color === 'w' ? 'b' : 'w'}${c.toUpperCase()}.svg" alt="">`).join('')}${diff > 0 ? `<i>+${diff}</i>` : ''}</span>${g.tc ? `<span class="chclk" data-c="${color}"></span>` : ''}</div>`;
}
function renderChess(body) {
  const g = S.g, over = S.phase === 'over';
  if (body.dataset.built !== 'chess') {
    body.dataset.built = 'chess'; CH.flip = false; CH.sel = null; CH.lastN = -1;
    body.innerHTML = `<div class="chw"><div class="chmain"><div class="chtop" id="chTop"></div><div class="chbd" id="chBd"></div><div class="chbot" id="chBot"></div></div>
      <div class="chside"><div class="chstat" id="chStat"></div><div class="chbtns" id="chBtns"></div><ol class="chlist" id="chList"></ol></div><div class="chprom" id="chProm" hidden></div></div>`;
    chBind();
    clearInterval(CH.tick); CH.tick = setInterval(chClocks, 100);
  }
  CH.off = g.now - Date.now();
  const bot = chBottom(), top = bot === 'w' ? 'b' : 'w';
  $('#chTop').innerHTML = chBar(top); $('#chBot').innerHTML = chBar(bot);
  // اللوحة
  const B = chBoard(g.fen), bd = $('#chBd');
  const ranks = bot === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8], files = bot === 'w' ? [...CHF] : [...CHF].reverse();
  const kingSq = g.check ? Object.keys(B).find(k => B[k] === (g.turn === 'w' ? 'K' : 'k')) : null;
  const targets = CH.sel ? g.moves.filter(m => m.startsWith(CH.sel)).map(m => m.slice(2, 4)) : [];
  bd.innerHTML = ranks.map((rk, ri) => files.map((f, fi) => {
    const sq = f + rk, dark = (CHF.indexOf(f) + rk) % 2 === 0, p = B[sq];
    const cls = ['chsq', dark ? 'd' : 'l', g.last && (g.last.from === sq || g.last.to === sq) ? 'lm' : '', CH.sel === sq ? 'sel' : '', kingSq === sq ? 'chk' : '', targets.includes(sq) ? (p ? 'tgt cap' : 'tgt') : ''].join(' ');
    return `<div class="${cls}" data-sq="${sq}">${p ? chPiece(p) : ''}${fi === 0 ? `<em class="rk">${rk}</em>` : ''}${ri === 7 ? `<em class="fl">${f}</em>` : ''}</div>`;
  }).join('')).join('');
  // انميشن آخر حركة
  if (g.last && g.last.n !== CH.lastN) {
    const first = CH.lastN === -1; CH.lastN = g.last.n;
    if (!first) {
      const a = bd.querySelector(`[data-sq="${g.last.from}"]`), b = bd.querySelector(`[data-sq="${g.last.to}"]`), img = b && b.querySelector('.chpc');
      if (a && img && !CH.justDropped) { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); img.animate([{ transform: `translate(${ra.left - rb.left}px,${ra.top - rb.top}px)` }, { transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.3,.7,.4,1)' }); }
      CH.justDropped = false;
      try { sfx(g.check ? 'alarm' : g.last.cap ? 'slap' : 'card'); } catch {}
    }
  }
  // الحالة
  const R = { mate: 'كش مات! ♚', stale: 'تعادل: ما فيه حركات (Stalemate)', material: 'تعادل: القطع ما تكفي للمات', repeat: 'تعادل: تكرار ٣ مرات', fifty: 'تعادل: قاعدة الـ ٥٠ حركة', agree: 'تعادل بالاتفاق 🤝', resign: 'استسلم 🏳️', time: 'خلص وقته ⏱️', left: 'طلع من اللعبة' };
  $('#chStat').innerHTML = g.over ? `<b class="chres">${R[g.over.why] || ''}</b><span>${g.over.win ? `فاز ${chName(g.over.win === 'w' ? g.w : g.b)} ${g.over.win === 'w' ? '♔' : '♚'}` : ''}</span>`
    : `<span class="chturn ${g.turn}">${g.turn === 'w' ? '♔ دور الأبيض' : '♚ دور الأسود'}</span>${g.check ? '<b class="chcheck">كش!</b>' : ''}${g.me && g.turn === g.me ? '<small>دورك 👆</small>' : ''}`;
  const opp = g.me === 'w' ? g.b : g.w, oppBot = S.players.find(p => p.id === opp && p.bot);
  $('#chBtns').innerHTML = `<button type="button" class="btn sm" data-a="flip">🔄 اقلب</button>` + (g.me && !g.over ? `${g.drawBy && g.drawBy !== g.me ? '<button type="button" class="btn sm green" data-a="dyes">🤝 أقبل التعادل</button><button type="button" class="btn sm" data-a="dno">لا</button>' : !oppBot ? `<button type="button" class="btn sm" data-a="draw"${g.drawBy === g.me ? ' disabled' : ''}>${g.drawBy === g.me ? 'عرضت تعادل…' : '🤝 تعادل؟'}</button>` : ''}<button type="button" class="btn sm red" data-a="resign">🏳️ استسلام</button>` : '');
  const h = g.hist, L = [];
  for (let i = 0; i < h.length; i += 2) L.push(`<li><b>${i / 2 + 1}.</b><span>${chSan(h[i])}</span><span>${h[i + 1] ? chSan(h[i + 1]) : ''}</span></li>`);
  const list = $('#chList'); list.innerHTML = L.join(''); list.scrollTop = list.scrollHeight; list.scrollLeft = -list.scrollWidth;
  if (over && CH.endN !== CH.lastN + ':' + g.over.why) { CH.endN = CH.lastN + ':' + g.over.why; try { sfx(!g.over.win ? 'card' : g.over.win === g.me ? 'win' : g.me ? 'lose' : 'win'); } catch {} }
  chClocks();
}
function chClocks() {
  if (!S || S.game !== 'chess' || !S.g || !S.g.clk) return;
  const c = S.g.clk, now = Date.now() + CH.off;
  $$('.chclk').forEach(el => { const k = el.dataset.c; let ms = c[k]; if (c.run === k) ms -= now - c.at; el.textContent = chFmt(ms); el.classList.toggle('run', c.run === k); el.classList.toggle('low', ms < 20000); });
}
function chTry(from, to) {
  const g = S.g, opts = g.moves.filter(m => m.startsWith(from + to));
  if (!opts.length) return false;
  if (opts.length > 1 || opts[0].length === 5) { chPromo(from, to); return true; }
  send({ t: 'cmove', from, to }); CH.sel = null; return true;
}
function chPromo(from, to) {
  const el = $('#chProm'), c = S.g.me;
  el.innerHTML = `<div><b>رقّي العسكري إلى:</b>${['q', 'r', 'b', 'n'].map(p => `<button type="button" data-p="${p}"><img src="chess/${c}${p.toUpperCase()}.svg" alt=""></button>`).join('')}</div>`;
  el.hidden = false;
  el.onclick = e => { const b = e.target.closest('[data-p]'); el.hidden = true; if (b) send({ t: 'cmove', from, to, promotion: b.dataset.p }); CH.sel = null; render(); };
}
function chBind() {
  const w = $('.chw');
  w.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'flip') { CH.flip = !CH.flip; render(); }
    else if (a === 'resign') { if (confirm('متأكد تستسلم؟')) send({ t: 'cresign' }); }
    else if (a === 'draw' || a === 'dyes') send({ t: 'cdraw' });
    else if (a === 'dno') send({ t: 'cnodraw' });
  });
  const bd = $('#chBd');
  const sqAt = (x, y) => { const el = document.elementFromPoint(x, y); const s = el && el.closest('.chsq'); return s && bd.contains(s) ? s.dataset.sq : null; };
  bd.addEventListener('pointerdown', e => {
    const s = e.target.closest('.chsq'); if (!s) return;
    const g = S.g, sq = s.dataset.sq, mine = g.moves.some(m => m.startsWith(sq));
    if (CH.sel && CH.sel !== sq && chTry(CH.sel, sq)) return;
    if (!mine) { if (CH.sel) { CH.sel = null; render(); } return; }
    e.preventDefault();
    CH.sel = sq; render();
    const img = bd.querySelector(`[data-sq="${sq}"] .chpc`); if (!img) return;
    const r = img.getBoundingClientRect(), ghost = img.cloneNode(); ghost.className = 'chghost'; ghost.style.width = r.width + 'px'; ghost.style.left = (e.clientX - r.width / 2) + 'px'; ghost.style.top = (e.clientY - r.height / 2) + 'px';
    CH.drag = { sq, ghost, moved: false, x: e.clientX, y: e.clientY, img: bd.querySelector(`[data-sq="${sq}"] .chpc`) };
    bd.setPointerCapture(e.pointerId);
  });
  bd.addEventListener('pointermove', e => {
    const d = CH.drag; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) { d.moved = true; document.body.appendChild(d.ghost); const im = bd.querySelector(`[data-sq="${d.sq}"] .chpc`); if (im) im.style.opacity = .3; }
    if (d.moved) { const w2 = parseFloat(d.ghost.style.width); d.ghost.style.left = (e.clientX - w2 / 2) + 'px'; d.ghost.style.top = (e.clientY - w2 / 2) + 'px'; }
  });
  const up = e => {
    const d = CH.drag; if (!d) return; CH.drag = null;
    if (d.moved) { d.ghost.remove(); const to = sqAt(e.clientX, e.clientY); if (to && to !== d.sq) { CH.justDropped = true; if (!chTry(d.sq, to)) CH.justDropped = false; } render(); }
  };
  bd.addEventListener('pointerup', up); bd.addEventListener('pointercancel', up);
}
