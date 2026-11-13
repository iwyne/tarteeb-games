// القنبلة: اللاعبين بدائرة والقنبلة بالنص، اللي معه القنبلة يكتب كلمة فيها المقطع
const BM = { ev: 0, tickT: null, lastTick: 0, sent: 0, typedFor: null };
const bmFace = id => { const p = S.players.find(x => x.id === id); return p ? (p.av ? esc(p.av) : esc([...p.name][0] || '?')) : '?'; };
const bmName = id => { const p = S.players.find(x => x.id === id); return p ? esc(p.name) : '؟'; };
function bmBuild(body) {
  body.dataset.built = 'bomb';
  body.innerHTML = `<div class="bmw"><div class="bmtop" id="bmTop"></div>
    <div class="bmring" id="bmRing"><div class="bmcore"><div class="bmfuse" id="bmFuse"><i></i></div><div class="bmbomb" id="bmBomb"><b id="bmSyl"></b><i class="spark"></i></div></div></div>
    <form class="bmin" id="bmForm" autocomplete="off"><input id="bmIn" maxlength="24" placeholder="اكتب كلمة…" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn sm">ارسل</button></form>
    <div class="bmlet" id="bmLet"></div><div class="bmlast" id="bmLast"></div></div>`;
  const inp = $('#bmIn');
  inp.oninput = () => { if (!S || !S.g || S.g.turn !== S.me) return; const now = Date.now(); if (now - BM.sent > 90) { BM.sent = now; send({ t: 'btype', v: inp.value }); } else { clearTimeout(BM.st); BM.st = setTimeout(() => send({ t: 'btype', v: inp.value }), 100); } };
  $('#bmForm').onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (v && S.g.turn === S.me) send({ t: 'bword', v }); };
  clearInterval(BM.tickT); BM.tickT = setInterval(bmTick, 120);
}
function bmSeatXY(i, n) {
  const a = -Math.PI / 2 + i / n * Math.PI * 2;
  return [50 + Math.cos(a) * 40, 50 + Math.sin(a) * 39, a];
}
function renderBomb(body) {
  const g = S.g; if (body.dataset.built !== 'bomb') bmBuild(body);
  const over = S.phase === 'over', mine = g.turn === S.me && g.sub === 'play' && !over;
  const ord = g.order, n = ord.length;
  // لو المقعد تغيّر نعيد رسم الدائرة
  const ring = $('#bmRing');
  if (ring.dataset.sig !== ord.join()) {
    ring.dataset.sig = ord.join();
    ring.querySelectorAll('.bmseat').forEach(e => e.remove());
    ord.forEach((id, i) => { const [x, y] = bmSeatXY(i, n), d = document.createElement('div'); d.className = 'bmseat'; d.dataset.id = id; d.style.left = x + '%'; d.style.top = y + '%'; d.innerHTML = `<span class="bmav">${bmFace(id)}</span><b class="nt">${bmName(id)}</b><em class="bmh"></em><span class="bmtyped nt"></span>`; ring.appendChild(d); });
  }
  ord.forEach((id, i) => {
    const P = g.P[id], d = ring.querySelector(`.bmseat[data-id="${id}"]`); if (!d || !P) return;
    d.classList.toggle('dead', P.lives <= 0); d.classList.toggle('on', g.turn === id && !over); d.classList.toggle('me', id === S.me);
    d.querySelector('.bmh').innerHTML = P.lives > 0 ? '❤️'.repeat(P.lives) + '<i>' + '🖤'.repeat(Math.max(0, g.maxL - P.lives)) + '</i>' : '💀';
    if (g.turn !== id) { const t = d.querySelector('.bmtyped'); if (t.textContent && !t.classList.contains('bad')) t.textContent = ''; }
    else if (BM.typedFor !== id + ':' + g.sylN) { BM.typedFor = id + ':' + g.sylN; d.querySelector('.bmtyped').textContent = g.typed || ''; }
  });
  // القنبلة تأشّر على اللي معه الدور
  const k = ord.indexOf(g.turn);
  if (k >= 0) { const [, , a] = bmSeatXY(k, n); $('#bmFuse').style.transform = `rotate(${a}rad)`; $('#bmFuse').hidden = false; } else $('#bmFuse').hidden = true;
  const syl = $('#bmSyl'); if (syl.textContent !== g.syl) { syl.textContent = g.syl || '💣'; syl.classList.remove('in'); void syl.offsetWidth; syl.classList.add('in'); }
  const alive = ord.filter(id => g.P[id].lives > 0).length;
  $('#bmTop').innerHTML = over ? '<b>انتهت!</b>' : g.sub === 'intro' ? '<b>جاهزين؟ القنبلة بتبدأ…</b> <span class="cd2"></span>'
    : mine ? `<b class="bmyou">دورك! اكتب كلمة فيها <span class="bmsyl nt">${esc(g.syl)}</span></b>` : `<span>مع <b>${bmName(g.turn)}</b></span><small>باقي ${alive} · ${{ easy: 'سهل', mid: 'عادي', hard: 'صعب' }[g.diff]}</small>`;
  const inp = $('#bmIn'), form = $('#bmForm');
  form.classList.toggle('on', mine); inp.disabled = !mine;
  // نفضّي الخانة بعد الرسم (renderOther يرجّع قيم الخانات بعد كل رسم)
  if (mine && BM.focusFor !== g.sylN) { BM.focusFor = g.sylN; setTimeout(() => { inp.value = ''; inp.focus(); }, 0); }
  if (!mine) { BM.focusFor = null; setTimeout(() => { if (inp.value && !(S.g && S.g.turn === S.me)) inp.value = ''; }, 0); }
  // حروف المكافأة (لي أنا)
  const me = g.P[S.me];
  $('#bmLet').innerHTML = me && !S.spec ? `<small>كمّل كل الحروف وتاخذ قلب:</small>` + g.bonus.map(c => `<i class="${me.let.includes(c) ? 'on' : ''}">${c}</i>`).join('') : '';
  $('#bmLast').innerHTML = g.last.slice(-5).reverse().map(x => `<span><b class="nt">${esc(x.w)}</b> <small>${bmName(x.id)}</small></span>`).join('');
  // الأحداث
  if (g.ev && g.ev.n !== undefined) {
    const key = g.ev.k + g.ev.n;
    if (BM.evk !== key) {
      const first = BM.evk === undefined; BM.evk = key;
      if (!first) bmEvent(g.ev);
    }
  }
}
function bmEvent(ev) {
  const d = $(`#bmRing .bmseat[data-id="${ev.id}"]`);
  if (ev.k === 'ok') {
    if (d) { d.classList.remove('ok'); void d.offsetWidth; d.classList.add('ok'); const t = d.querySelector('.bmtyped'); t.textContent = ev.w; t.classList.add('good'); setTimeout(() => { t.classList.remove('good'); t.textContent = ''; }, 900); }
    sfx('ding'); if (ev.bonus) { sfx('win'); toast(`${bmName(ev.id)} كمّل الحروف وأخذ قلب! ❤️`); }
  } else if (ev.k === 'boom') {
    const w = $('.bmw'); const fx = document.createElement('div'); fx.className = 'bmboom'; fx.innerHTML = '<i></i><b>💥</b>'; $('#bmRing').appendChild(fx); setTimeout(() => fx.remove(), 1200);
    w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake');
    if (d) { d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit'); }
    sfx('bang'); if (ev.id === S.me) try { navigator.vibrate && navigator.vibrate([80, 40, 160]); } catch {}
  }
}
function net_bomb(m) {
  if (!S || S.game !== 'bomb') return;
  const d = $(`#bmRing .bmseat[data-id="${m.id}"]`); if (!d) return;
  const t = d.querySelector('.bmtyped');
  if (m.k === 'type') { t.classList.remove('bad'); t.textContent = m.v; }
  else if (m.k === 'bad') {
    t.textContent = m.v; t.classList.remove('bad'); void t.offsetWidth; t.classList.add('bad');
    d.classList.remove('no'); void d.offsetWidth; d.classList.add('no');
    if (m.id === S.me) { toast(m.why); sfx('nope'); const i = $('#bmIn'); i.classList.remove('no'); void i.offsetWidth; i.classList.add('no'); i.select(); }
  }
}
// تكتكة القنبلة: تسرع مع الوقت (ما نعرف متى تنفجر بالضبط)
function bmTick() {
  if (!S || S.game !== 'bomb' || S.phase !== 'play' || !S.g || S.g.sub !== 'play') return;
  const heat = Math.min(1, S.g.heat + (Date.now() - S.t0) / 28000), gap = 950 - heat * 650;
  const b = $('#bmBomb'); if (b) b.style.setProperty('--heat', heat.toFixed(2));
  if (Date.now() - BM.lastTick > gap) { BM.lastTick = Date.now(); try { sfx('tick'); } catch {} if (b) { b.classList.remove('tk'); void b.offsetWidth; b.classList.add('tk'); } }
}
