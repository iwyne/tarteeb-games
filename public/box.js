// ================= حلبة ترتيب (ملاكمة) =================
const BX = { f: [], sub: '', last: {}, keys: {}, built: false, endT: 0 };
const BXCOL = ['#2a5bd7', '#e8362d']; // زاوية زرقا وزاوية حمرا
const bxName = id => { const p = S.players.find(q => q.id === id); return p ? p.name : '؟'; };
const bxNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const bxMe = () => BX.f.find(F => F.id === S.me);
// رسم الملاكم (يطالع يمين، والثاني نقلبه)
function bxBoxer(side, col, face) {
  return `<div class="bxb s${side}" id="bxB${side}" style="--bc:${col}"><div class="bxfx"></div>
    <svg viewBox="0 0 200 260" class="bxsvg"><ellipse cx="96" cy="250" rx="62" ry="9" class="bxsh"/>
      <g class="bxbody">
        <path d="M70 248 L78 178 L92 178 L90 248Z M104 248 L104 178 L118 178 L124 248Z" class="bxleg"/>
        <path d="M66 182 h64 l-6 -40 h-52z" fill="var(--bc)" stroke="#16130f" stroke-width="5" stroke-linejoin="round"/>
        <rect x="70" y="150" width="56" height="10" fill="#fffaf0" stroke="#16130f" stroke-width="4"/>
        <path d="M74 150 q-6 -48 24 -58 q30 10 24 58z" class="bxskin"/>
        <g class="bxarmB"><path d="M84 104 q-14 26 6 40" class="bxarm"/><circle cx="96" cy="146" r="17" class="bxglove"/></g>
        <g class="bxhead"><circle cx="98" cy="70" r="30" class="bxskin"/><path d="M68 64 q30 -34 60 0 v-10 q-30 -30 -60 0z" fill="var(--bc)" stroke="#16130f" stroke-width="4"/><text x="98" y="82" class="bxface">${face}</text></g>
        <g class="bxarmF"><path d="M112 104 q20 18 34 6" class="bxarm"/><circle cx="150" cy="104" r="19" class="bxglove"/></g>
      </g>
      <g class="bxstars"><text x="70" y="30">⭐</text><text x="118" y="22">💫</text><text x="96" y="12">⭐</text></g>
    </svg></div>`;
}
function bxBuild(body) {
  body.dataset.built = 'box'; BX.last = {};
  body.innerHTML = `<div class="bxw">
    <div class="bxhud"><div class="bxp p0"><b id="bxN0"></b><div class="bxhp"><i id="bxH0"></i></div><div class="bxst"><i id="bxS0"></i></div></div>
      <div class="bxmid"><span id="bxRound"></span><b id="bxTime">--</b></div>
      <div class="bxp p1"><b id="bxN1"></b><div class="bxhp"><i id="bxH1"></i></div><div class="bxst"><i id="bxS1"></i></div></div></div>
    <div class="bxring" id="bxRing"><div class="bxlights"></div><div class="bxrope r1"></div><div class="bxrope r2"></div><div class="bxrope r3"></div><div class="bxpost a"></div><div class="bxpost b"></div><div class="bxmat"></div>
      <div class="bxstage" id="bxStage"></div><div class="bxpop" id="bxPop"></div><div class="bxcard" id="bxCard" hidden></div></div>
    <div class="bxctl" id="bxCtl"></div>
    <div class="bxq" id="bxQ"></div>${logHtml()}
  </div>`;
  const ctl = $('#bxCtl');
  const fire = (a, d) => { send({ t: 'bx', a, d }); };
  ctl.addEventListener('pointerdown', e => { const b = e.target.closest('[data-a]'); if (!b) return; e.preventDefault(); b.classList.add('on'); fire(b.dataset.a, +b.dataset.d || 1); if (b.dataset.a === 'block') b.setPointerCapture(e.pointerId); });
  const up = e => { const b = e.target.closest('[data-a]'); if (!b) return; b.classList.remove('on'); if (b.dataset.a === 'block') fire('unblock'); };
  ctl.addEventListener('pointerup', up); ctl.addEventListener('pointercancel', up); ctl.addEventListener('pointerleave', up, true);
}
addEventListener('keydown', e => {
  if (!S || S.game !== 'boxing' || S.phase !== 'play' || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '') || e.repeat) return;
  const k = e.key.toLowerCase(), map = { j: 'jab', 'ت': 'jab', k: 'hook', 'ن': 'hook', l: 'upper', 'م': 'upper', arrowleft: 'dodge', a: 'dodge', 'ش': 'dodge', arrowright: 'dodge', d: 'dodge', 'ي': 'dodge', arrowdown: 'block', s: 'block', 'س': 'block', ' ': 'block' };
  const a = map[k]; if (!a || !bxMe()) return; e.preventDefault();
  if (a === 'block') { if (BX.keys.block) return; BX.keys.block = 1; }
  send({ t: 'bx', a, d: ['arrowleft', 'a', 'ش'].includes(k) ? -1 : 1 });
});
addEventListener('keyup', e => {
  if (!S || S.game !== 'boxing') return; const k = e.key.toLowerCase();
  if (['arrowdown', 's', 'س', ' '].includes(k) && BX.keys.block) { BX.keys.block = 0; send({ t: 'bx', a: 'unblock' }); }
});

window.net_boxing = m => {
  if (!S || S.game !== 'boxing' || !S.g) return;
  if (m.k === 'st') {
    BX.sub = m.sub;
    BX.f = m.f.map(([id, hp, st, a, kind, side]) => ({ id, hp, st, a, kind, side }));
    bxDraw();
    (m.ev || []).forEach(bxEvent);
  } else if (m.k === 'end') {
    const me = m.w === S.me; sfx('bell'); if (m.ko) setTimeout(() => sfx('thud'), 200);
    bxPopText(m.ko ? 'K.O! 💥' : '⏱ النقاط', 'ko', 50);
    if (me) setTimeout(() => sfx('win'), 700);
  }
};
// ترتيب الحلبة: أنا يسار لو ألعب، وإلا البطل يسار
function bxOrder() { const f = BX.f.slice(); if (f.length === 2 && f[1].id === S.me) f.reverse(); return f; }
function bxDraw() {
  const st = $('#bxStage'); if (!st) return;
  const f = bxOrder(), g = S.g;
  const key = f.map(F => F.id).join(',');
  if (st.dataset.k !== key) {
    st.dataset.k = key;
    st.innerHTML = f.map((F, i) => { const p = S.players.find(q => q.id === F.id); return bxBoxer(i, BXCOL[i], esc(p ? (p.av || [...p.name][0] || '?') : '?')); }).join('');
    BX.last = {};
  }
  f.forEach((F, i) => {
    const el = $('#bxB' + i); if (!el) return;
    const cls = `bxb s${i} a-${F.a}${F.kind ? ' k-' + F.kind : ''}${F.side ? (F.side > 0 ? ' dr' : ' dl') : ''}`;
    if (el.className.replace(/ hit| punch/g, '') !== cls) el.className = cls + (el.classList.contains('hit') ? ' hit' : '') + (el.classList.contains('punch') ? ' punch' : '');
    if (BX.last[F.id] !== F.a && F.a === 'wind' && F.kind !== 'jab') sfx('whoosh');
    BX.last[F.id] = F.a;
    $('#bxN' + i).textContent = bxName(F.id) + (F.id === S.me ? ' (أنت)' : '');
    const hp = $('#bxH' + i); hp.style.width = F.hp + '%'; hp.className = F.hp < 30 ? 'low' : F.hp < 60 ? 'mid' : '';
    $('#bxS' + i).style.width = F.st + '%';
    $('#bxS' + i).classList.toggle('low', F.st < 35);
  });
  // أزرار التحكم (للي بالحلبة بس)
  const me = bxMe(), ctl = $('#bxCtl'), fighting = me && BX.sub === 'fight' && S.phase === 'play';
  const ck = fighting ? 'f' : me ? 'w' : 's';
  if (ctl.dataset.k !== ck) {
    ctl.dataset.k = ck;
    ctl.innerHTML = fighting ? `<button type="button" class="bxk dodge" data-a="dodge" data-d="-1">↩️<small>مراوغة</small></button>
      <button type="button" class="bxk block" data-a="block">🛡<small>دفاع (اضغط مطوّل)</small></button>
      <button type="button" class="bxk jab" data-a="jab"${me.st < 7 ? ' disabled' : ''}>👊<small>جاب</small></button>
      <button type="button" class="bxk hook" data-a="hook"${me.st < 18 ? ' disabled' : ''}>💥<small>خطاف</small></button>
      <button type="button" class="bxk upper" data-a="upper"${me.st < 35 ? ' disabled' : ''}>🚀<small>أبركت</small></button>
      <p class="bxkeys">${isMob() ? 'اضرب لما خصمك يحضّر ضربته = كاونتر 🔥' : 'J جاب · K خطاف · L أبركت · S/مسافة دفاع · A/D مراوغة — اضرب وهو يحضّر = كاونتر 🔥'}</p>`
      : me ? '<p class="bxwait">استعد… 🥊</p>' : `<p class="bxwait">تتفرّج 👀 — شجّع بالإيموجي!</p>`;
  }
  // نحدّث التفعيل بس (بدون ما نعيد بناء الأزرار — عشان الدفاع المطوّل ما ينقطع)
  if (fighting) [['jab', 7], ['hook', 18], ['upper', 35]].forEach(([k, n]) => { const b = ctl.querySelector('.bxk.' + k); if (b) b.disabled = me.st < n; });
}
function bxEvent(e) {
  const f = bxOrder(), ia = f.findIndex(F => F.id === e.by), io = f.findIndex(F => F.id === e.to);
  const A = $('#bxB' + ia), O = $('#bxB' + io); if (!A || !O) return;
  A.classList.remove('punch'); void A.offsetWidth; A.classList.add('punch'); setTimeout(() => A.classList.remove('punch'), 260);
  const x = io === 0 ? 30 : 70;
  if (e.k === 'miss') { bxPopText('فاتت! 💨', 'miss', x); sfx('whoosh'); return; }
  O.classList.remove('hit'); void O.offsetWidth; O.classList.add('hit'); setTimeout(() => O.classList.remove('hit'), 300);
  if (e.tag === 'block') { bxPopText(`🛡 صدّ −${bxNum(e.dmg)}`, 'blk', x); sfx('gclick'); return; }
  const word = e.tag === 'counter' ? 'كاونتر! 🔥' : e.kind === 'upper' ? 'BOOM!' : e.kind === 'hook' ? 'POW!' : 'باف!';
  bxPopText(`${word} −${bxNum(e.dmg)}${e.combo >= 3 ? ` <small>كومبو ×${bxNum(e.combo)}</small>` : ''}`, e.tag === 'counter' ? 'ctr' : e.kind, x);
  sfx(e.kind === 'jab' ? 'slap' : 'catch');
  if (e.kind !== 'jab' || e.tag === 'counter') { const r = $('#bxRing'); r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); }
}
function bxPopText(html, cls, x) {
  const p = $('#bxPop'); if (!p) return;
  const el = document.createElement('b'); el.className = 'bxpt ' + (cls || ''); el.innerHTML = html; el.style.left = x + '%';
  el.style.setProperty('--rot', (Math.random() * 16 - 8) + 'deg'); p.appendChild(el); setTimeout(() => el.remove(), 1100);
}
function renderBox(body) {
  if (body.dataset.built !== 'box' || !$('#bxStage')) bxBuild(body);
  const g = S.g, over = S.phase === 'over';
  if (g.f && !BX.f.length) BX.f = g.f.map(F => ({ ...F, a: 'idle' }));
  if (g.f && BX.f.map(F => F.id).join() !== g.f.map(F => F.id).join()) BX.f = g.f.map(F => ({ ...F, a: 'idle' }));
  BX.sub = g.sub;
  bxDraw();
  $('#bxRound').textContent = `النزال ${bxNum(g.matchN || 1)} · البطل يحتاج ${bxNum(g.target)}`;
  BX.endT = g.sub === 'fight' ? performance.now() + g.left : 0;
  if (!BX.timer) BX.timer = setInterval(() => { const t = $('#bxTime'); if (!t) { clearInterval(BX.timer); BX.timer = 0; return; } t.textContent = BX.endT ? bxNum(Math.max(0, Math.ceil((BX.endT - performance.now()) / 1000))) : '--'; }, 250);
  // بطاقة النزال
  const card = $('#bxCard');
  if (g.sub === 'intro' && g.f && !over) {
    const f = bxOrder(), k = 'i' + g.matchN;
    if (card.dataset.k !== k) {
      card.dataset.k = k;
      card.innerHTML = `<small>النزال ${bxNum(g.matchN)}</small><div class="bxvs"><span style="--c:${BXCOL[0]}">${esc(bxName(f[0].id))}${f[0].id === g.champ && g.matchN > 1 ? ' 👑' : ''}</span><em>VS</em><span style="--c:${BXCOL[1]}">${esc(bxName(f[1].id))}${f[1].id === g.champ && g.matchN > 1 ? ' 👑' : ''}</span></div><p>${f.some(F => F.id === S.me) ? 'أنت بالحلبة! استعد 🥊' : 'اختر مين تشجّع 📣'}</p>`;
      sfx('bell');
    }
    card.hidden = false;
  } else if (over) {
    card.dataset.k = 'over'; card.innerHTML = `<small>🏆 بطل الحلبة</small><div class="bxvs"><span style="--c:#f2b705">${esc(S.winner || '')}</span></div>`; card.hidden = false;
  } else card.hidden = true;
  // الطابور والانتصارات
  const order = [g.champ, ...(g.f || []).map(F => F.id).filter(id => id !== g.champ), ...(g.queue || [])].filter((v, i, a) => v && a.indexOf(v) === i);
  $('#bxQ').innerHTML = `<h4>🏆 الترتيب</h4><div>${order.map(id => `<span class="${id === S.me ? 'me' : ''}${(g.f || []).some(F => F.id === id) ? ' in' : ''}">${esc(bxName(id))} ${'🏅'.repeat(g.wins[id] || 0)}${'⚪'.repeat(Math.max(0, g.target - (g.wins[id] || 0)))}</span>`).join('')}</div>`;
}
