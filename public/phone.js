// التلفون الترتيب: كتابة ← رسم ← وصف… والعرض بالآخر
const PH = { img: {}, req: {}, mine: [], key: '', sentAt: 0, dT: null, color: 0, w: 1, laughKey: '', revKey: '' };
const PHW = 1000, PHH = 750;
function phPaint(cv, strokes) {
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, PHW, PHH);
  (strokes || []).forEach(s => phStroke(ctx, s));
}
function phStroke(ctx, s, from = 2) {
  ctx.strokeStyle = ctx.fillStyle = s[0] === 7 ? '#fffdf6' : DCOL[s[0]] || DCOL[0]; ctx.lineWidth = DW[s[1] - 1] || 8; ctx.lineCap = ctx.lineJoin = 'round';
  if (s.length <= 4) { ctx.beginPath(); ctx.arc(s[2], s[3], ctx.lineWidth / 2, 0, 7); ctx.fill(); return; }
  ctx.beginPath(); ctx.moveTo(s[Math.max(2, from - 2)], s[Math.max(3, from - 1)]);
  for (let i = Math.max(4, from); i + 1 < s.length; i += 2) ctx.lineTo(s[i], s[i + 1]);
  ctx.stroke();
}
// الرسومات تنطلب من السيرفر وحدة وحدة
function phNeed(c, s) {
  const k = c + ':' + s; if (PH.img[k]) return PH.img[k];
  if (!PH.req[k] || Date.now() - PH.req[k] > 2500) { PH.req[k] = Date.now(); send({ t: 'pget', c, s }); }
  return null;
}
function net_phone(m) {
  if (!S || S.game !== 'phone') return;
  if (m.k === 'img') { const k = m.c + ':' + m.s; PH.img[k] = m.v; $$(`canvas[data-img="${k}"]`).forEach(cv => phPaint(cv, m.v)); }
  else if (m.k === 'like') { const b = $('#phLaughFx'); if (b) { const e = document.createElement('i'); e.textContent = '😂'; e.style.left = (10 + Math.random() * 80) + '%'; b.appendChild(e); setTimeout(() => e.remove(), 1600); } try { sfx('boing'); } catch {} }
}
function phTools() {
  return DCOL.map((c, i) => `<button type="button" class="dcol${PH.color === i ? ' on' : ''}" data-c="${i}" style="background:${c}" title="${i === 7 ? 'ممحاة' : 'لون'}">${i === 7 ? '⌫' : ''}</button>`).join('') +
    DW.map((w, i) => `<button type="button" class="dwd${PH.w === i ? ' on' : ''}" data-w="${i}"><i style="width:${6 + i * 5}px;height:${6 + i * 5}px"></i></button>`).join('') +
    '<button type="button" class="btn sm" data-a="undo">تراجع</button><button type="button" class="btn sm" data-a="clear">امسح</button>';
}
function phEditor(el, locked) {
  el.innerHTML = `<div class="phcv"><canvas id="phCv" width="${PHW}" height="${PHH}"></canvas></div><div class="dtools phtools" id="phTools"${locked ? ' hidden' : ''}>${phTools()}</div>`;
  const cv = $('#phCv'), ctx = cv.getContext('2d'); phPaint(cv, PH.mine);
  cv.classList.toggle('mine', !locked);
  if (locked) return;
  let cur = null;
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * PHW), Math.round((e.clientY - r.top) / r.height * PHH)]; };
  cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const p = pt(e); cur = [PH.color, PH.w + 1, p[0], p[1]]; PH.mine.push(cur); phStroke(ctx, cur); };
  cv.onpointermove = e => { if (!cur) return; const p = pt(e), L = cur.length; if (Math.abs(p[0] - cur[L - 2]) + Math.abs(p[1] - cur[L - 1]) < 4) return; cur.push(p[0], p[1]); phStroke(ctx, cur, cur.length - 2); };
  const up = () => { if (!cur) return; cur = null; phDraft(); };
  cv.onpointerup = up; cv.onpointercancel = up;
  $('#phTools').onclick = e => {
    const b = e.target.closest('[data-c],[data-w],[data-a]'); if (!b) return;
    if (b.dataset.c) PH.color = +b.dataset.c; if (b.dataset.w) PH.w = +b.dataset.w;
    if (b.dataset.a === 'undo') { PH.mine.pop(); phPaint(cv, PH.mine); phDraft(); }
    if (b.dataset.a === 'clear') { PH.mine = []; phPaint(cv, PH.mine); phDraft(); }
    $('#phTools').innerHTML = phTools();
  };
}
function phDraft() { clearTimeout(PH.dT); PH.dT = setTimeout(() => send({ t: 'pdraft', v: PH.mine }), 400); }
const phName = id => { const p = S.players.find(x => x.id === id); return p ? esc(p.name) : '؟'; };
function renderPhone(body) {
  const g = S.g, over = S.phase === 'over', host = S.players.find(p => p.h), amHost = host && host.id === S.me && !S.spec;
  if (body.dataset.built !== 'phone') { body.dataset.built = 'phone'; body.innerHTML = `<div class="phw"><div class="phtop" id="phTop"></div><div class="phmain" id="phMain"></div><div class="phppl" id="phPpl"></div><div class="phlaughfx" id="phLaughFx"></div></div>`; }
  const main = $('#phMain');
  if (g.sub === 'play' || g.sub === 'grace') {
    const done = !!g.mine, step = g.step, k = g.kind;
    $('#phTop').innerHTML = `<span class="phstep">الخطوة <b>${step + 1}</b> من ${g.steps}</span><b class="phtask">${S.spec ? 'اللاعبين يشتغلون…' : k === 'draw' ? '✏️ ارسم' : step === 0 ? '✍️ اكتب جملة' : '🔍 وش هذي الرسمة؟'}</b><span class="cd2"></span>`;
    const key = [step, g.c, done, S.spec].join('|');
    if (PH.key !== key) {
      const fresh = PH.key.split('|')[0] !== String(step);
      PH.key = key;
      if (S.spec) main.innerHTML = '<div class="phwait">☎️ الخط مشغول… اللاعبين يكتبون ويرسمون</div>';
      else if (k === 'draw') {
        if (fresh) PH.mine = [];
        if (done && g.mine) { /* نخلي اللي رسمه */ }
        main.innerHTML = `<div class="phprompt"><small>ارسم هذي:</small><b class="nt">${esc(g.prev ? g.prev.v : '')}</b></div><div id="phEd"></div><div class="phact">${done ? '<span class="phok">✔ سلّمت رسمتك</span><button type="button" class="btn sm" id="phUndo">عدّل</button>' : '<button type="button" class="btn green" id="phSend">خلصت ✔</button>'}</div>`;
        phEditor($('#phEd'), done);
        if (!done) $('#phSend').onclick = () => { send({ t: 'psub', v: PH.mine }); sfx('pop'); };
        else $('#phUndo').onclick = () => send({ t: 'pundo' });
      } else {
        const img = step > 0 ? phNeed(g.c, step - 1) : null;
        main.innerHTML = (step > 0 ? `<div class="phcv view"><canvas width="${PHW}" height="${PHH}" data-img="${g.c}:${step - 1}"></canvas></div>` : '<div class="phphone">☎️<small>اكتب جملة غريبة… واللي بعدك لازم يرسمها!</small></div>') +
          `<form class="phform" id="phForm"><div class="row"><input id="phIn" maxlength="90" autocomplete="off" placeholder="${step === 0 ? 'مثلاً: ' + esc(PHIDEA[Math.random() * PHIDEA.length | 0]) : 'اكتب وش تشوف…'}"${done ? ' disabled' : ''}>${step === 0 && !done ? '<button type="button" class="btn sm" id="phDice" title="فكرة عشوائية">🎲</button>' : ''}<button class="btn green"${done ? ' hidden' : ''}>ارسل</button></div>${done ? `<p class="phok">✔ <span class="nt">${esc(g.mine.v || '')}</span> <button type="button" class="btn sm" id="phUndo">عدّل</button></p>` : ''}</form>`;
        if (img) phPaint(main.querySelector('canvas'), img);
        const inp = $('#phIn');
        if (done) $('#phUndo').onclick = () => send({ t: 'pundo' });
        else {
          if (g.draft && !inp.value) inp.value = g.draft;
          inp.oninput = () => { clearTimeout(PH.dT); PH.dT = setTimeout(() => send({ t: 'pdraft', v: inp.value }), 500); };
          $('#phForm').onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (v) { send({ t: 'psub', v }); sfx('pop'); } };
          const dice = $('#phDice'); if (dice) dice.onclick = () => { inp.value = PHIDEA[Math.random() * PHIDEA.length | 0]; inp.oninput(); inp.focus(); };
          setTimeout(() => inp.focus(), 30);
        }
      }
    }
    // لو الرسمة اللي قبل ما وصلت للحين
    if (k === 'write' && step > 0 && g.c != null) { const img = phNeed(g.c, step - 1); const cv = main.querySelector('canvas[data-img]'); if (img && cv && !cv.dataset.done) { cv.dataset.done = 1; phPaint(cv, img); } }
    $('#phPpl').innerHTML = g.order.map(id => `<span class="pchip${g.done.includes(id) ? ' ok' : ''}">${g.done.includes(id) ? '✔ ' : '✏️ '}${phName(id)}</span>`).join('');
  } else if (g.sub === 'reveal') {
    PH.key = '';
    $('#phTop').innerHTML = `<span class="phstep">السلسلة ${g.rc + 1} من ${g.n}</span><b class="phtask">📞 سلسلة ${phName(g.owner)}</b>${amHost ? '<button type="button" class="btn sm" id="phNext">التالي ⏭</button>' : '<span class="cd2"></span>'}`;
    if (amHost) $('#phNext').onclick = () => send({ t: 'pnext' });
    const rk = g.rc + ':' + g.ri;
    if (PH.revKey.split(':')[0] !== String(g.rc)) main.innerHTML = '<div class="phalbum" id="phAlbum"></div>';
    const al = $('#phAlbum') || (main.innerHTML = '<div class="phalbum" id="phAlbum"></div>', $('#phAlbum'));
    g.items.forEach((it, s) => {
      if (al.querySelector(`[data-s="${s}"]`)) return;
      const d = document.createElement('div'); d.className = 'phitem ' + (it.k === 'w' ? 'tx' : 'dr'); d.dataset.s = s;
      d.innerHTML = `<small>${phName(it.by)} ${it.k === 'w' ? (s === 0 ? 'كتب:' : 'شاف:') : 'رسم:'}</small>` + (it.k === 'w' ? `<p class="nt">${esc(it.v)}</p>` : `<div class="phcv view"><canvas width="${PHW}" height="${PHH}" data-img="${g.rc}:${s}"></canvas></div>`);
      al.appendChild(d);
      if (it.k === 'd') { const img = phNeed(g.rc, s); if (img) phPaint(d.querySelector('canvas'), img); }
      if (PH.revKey) sfx(it.k === 'w' ? 'pop' : 'whoosh');
      setTimeout(() => d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
    });
    PH.revKey = rk;
    const cur = g.items[g.ri], liked = g.likes.includes(S.me), mineItem = cur && cur.by === S.me;
    $('#phPpl').innerHTML = S.spec ? '' : `<button type="button" class="btn phlaugh${liked ? ' on' : ''}" id="phLaugh"${liked || mineItem ? ' disabled' : ''}>😂 ${g.likes.length || ''}</button><small class="muted">اضحك على اللي ينعرض الحين — أكثر واحد يضحّك الناس يفوز</small>`;
    const lb = $('#phLaugh'); if (lb) lb.onclick = () => send({ t: 'plike' });
  } else if (g.sub === 'end' || over) {
    PH.key = ''; PH.revKey = '';
    $('#phTop').innerHTML = '<b class="phtask">📒 ألبوم المكالمات</b>';
    if (!main.querySelector('.phbook')) {
      PH.book = PH.book || 0;
      main.innerHTML = `<div class="phbook"><div class="chips" id="phTabs">${g.order.map((id, c) => `<button type="button" class="gsw" data-c="${c}">${phName(id)}</button>`).join('')}</div><div class="phalbum" id="phAlbum"></div></div>`;
      $$('#phTabs .gsw').forEach(b => b.onclick = () => { PH.book = +b.dataset.c; phBook(); });
      phBook();
    }
    $('#phPpl').innerHTML = [...S.players].sort((a, b) => (g.laughs[b.id] || 0) - (g.laughs[a.id] || 0)).map(p => `<span class="pchip">${phName(p.id)} <i>😂 ${g.laughs[p.id] || 0}</i></span>`).join('');
  }
}
function phBook() {
  const g = S.g, c = PH.book, al = $('#phAlbum'); if (!g.chains || !al) return;
  $$('#phTabs .gsw').forEach(b => b.classList.toggle('on', +b.dataset.c === c));
  al.innerHTML = g.chains[c].map((it, s) => it ? `<div class="phitem ${it.k === 'w' ? 'tx' : 'dr'}"><small>${phName(it.by)}</small>${it.k === 'w' ? `<p class="nt">${esc(it.v)}</p>` : `<div class="phcv view"><canvas width="${PHW}" height="${PHH}" data-img="${c}:${s}"></canvas></div>`}</div>` : '').join('');
  al.querySelectorAll('canvas[data-img]').forEach(cv => { const [cc, s] = cv.dataset.img.split(':').map(Number), img = phNeed(cc, s); if (img) phPaint(cv, img); });
}
const PHIDEA = ['قطو يسوق جيب في الطعوس', 'جمل لابس نظارة شمسية', 'بطريق يشرب قهوة بالدلة', 'شايب يلعب بلايستيشن ويعصّب', 'صقر يطقطق على جواله', 'كبسة طايرة في السما', 'ديناصور يعزم الربع على مندي', 'رجل ثلج يذوب في الرياض', 'سمكة تدرس في الجامعة', 'شبح خايف من الظلام', 'روبوت يصب شاهي', 'خروف يتمرن بالنادي', 'زرافة راسها عالق بالسقف', 'شاورما عملاقة تلاحق الناس', 'بقرة تنط على ترامبولين', 'حلزون في سباق سيارات'];
