// جوابك الترتيب: الكل يكتب أجوبته بنفس الوقت، وبعدين تنكشف أشهر ٦ أجوبة
const JW = { sig: '', sub: '', k: 0 };
const JW_BASE = 1600, JW_TILE = 1000;
const jwNum = n => (+n || 0).toLocaleString('en-US');
function renderJwb(body) {
  const g = S.g, over = S.phase === 'over', sh = g.sub === 'rev' || g.sub === 'sc' || over;
  if (body.dataset.built !== 'jwb') {
    body.dataset.built = 'jwb'; JW.sig = '';
    body.innerHTML = `<div class="jww">
      <div class="jwtop" id="jwTop"></div>
      <div class="jwbar"><i id="jwBar"></i></div>
      <div class="jwq" id="jwQ"></div>
      <div class="jwmain" id="jwMain"></div>
      <div class="jwppl" id="jwPpl"></div>
    </div>`;
    body.querySelector('.jww').addEventListener('click', e => {
      const d = e.target.closest('[data-del]'); if (d) { send({ t: 'jdel', i: +d.dataset.del }); sfx('gclick'); return; }
      if (e.target.closest('#jwDone')) { send({ t: 'jdone' }); sfx('gclick'); }
    });
    body.querySelector('.jww').addEventListener('submit', e => {
      e.preventDefault(); const inp = $('#jwIn'); const v = inp.value.trim(); if (!v) return;
      send({ t: 'jans', text: v }); sfx('pop'); setTimeout(() => { inp.value = ''; inp.focus(); }, 0);
    });
  }
  // الشريط العلوي
  const me = g.scores[S.me] || 0;
  $('#jwTop').innerHTML = over ? '<b>النتيجة النهائية 🏆</b>'
    : g.sub === 'intro' ? '<b>جاهزين؟ 🗣️</b>'
    : `<span>الجولة <b>${g.k}</b> من ${g.rounds}</span>${g.mult > 1 ? '<em class="jwx2">آخر جولة ✖️2</em>' : ''}<span class="jwme">⭐ ${jwNum(me)}</span>`;
  const sig = [g.k, g.sub, over].join('|');
  if (JW.sig !== sig) {
    JW.sig = sig;
    // شريط الوقت
    const bar = $('#jwBar'); bar.style.transition = 'none'; bar.style.width = g.sub === 'q' ? '100%' : '0';
    if (g.sub === 'q') { const left = Math.max(0, S.left - (Date.now() - S.t0)); const tot = g.time * 1000; void bar.offsetWidth; bar.style.width = (left / tot * 100) + '%'; requestAnimationFrame(() => { bar.style.transition = `width ${left}ms linear`; bar.style.width = '0'; }); }
    // السؤال
    $('#jwQ').innerHTML = over ? '' : g.q ? `<div class="jwbub"><small>${g.sub === 'q' ? `اكتب لين ${g.n} أجوبة تتوقع الناس يقولونها` : 'أشهر الأجوبة'}</small><b class="nt">${esc(g.q)}</b></div>` : '<div class="jwbig">🗣️</div>';
    jwMain(g, over);
  } else if (g.sub === 'q') jwMine(g);
  // اللاعبين
  const list = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0));
  $('#jwPpl').innerHTML = list.map(p => {
    const n = g.prog[p.id] || 0, done = g.done.includes(p.id) || n >= g.n;
    const dots = g.sub === 'q' ? `<span class="jwdots">${Array.from({ length: g.n }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>` : '';
    const gain = sh && g.gain && g.gain[p.id] ? `<em class="jwgain">+${jwNum(g.gain[p.id])}</em>` : '';
    return `<div class="jwp${p.id === S.me ? ' me' : ''}${g.sub === 'q' && done ? ' done' : ''}"><span class="bmav">${bmFace(p.id)}</span><b class="nt">${esc(p.name)}</b>${dots}<i>${jwNum(g.scores[p.id] || 0)}</i>${gain}</div>`;
  }).join('');
  if (g.sub !== JW.sub || g.k !== JW.k) {
    if (g.sub === 'q') sfx('pop');
    else if (g.sub === 'rev') sfx('whoosh');
    JW.sub = g.sub; JW.k = g.k;
  }
}
function jwMine(g) {
  const box = $('#jwMine'); if (!box) return;
  const L = g.my || [];
  const sig = L.join('|') + '|' + g.done.includes(S.me);
  if (box.dataset.sig === sig) return; box.dataset.sig = sig;
  const slots = Array.from({ length: g.n }, (_, i) => L[i] != null
    ? `<span class="jwchip"><b class="nt">${esc(L[i])}</b>${S.spec ? '' : `<button type="button" data-del="${i}" aria-label="احذف">✕</button>`}</span>`
    : `<span class="jwchip empty">${i + 1}</span>`).join('');
  box.innerHTML = slots;
  const full = L.length >= g.n, done = g.done.includes(S.me) || full;
  const inp = $('#jwIn'), btn = $('#jwSend'), dn = $('#jwDone');
  if (inp) { inp.disabled = full || S.spec; inp.placeholder = full ? 'كتبت كل أجوبتك ✓' : 'اكتب جوابك…'; }
  if (btn) btn.disabled = full || S.spec;
  if (dn) { dn.hidden = S.spec || !L.length; dn.disabled = done; dn.textContent = done ? 'ننتظر الباقين…' : 'خلصت ✓'; }
}
function jwMain(g, over) {
  const m = $('#jwMain');
  if (over) {
    const rows = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0));
    m.innerHTML = `<ol class="jwfinal">${rows.map((p, i) => `<li class="${p.id === S.me ? 'me' : ''}"><span class="jwrank">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="bmav">${bmFace(p.id)}</span><b class="nt">${esc(p.name)}</b><i>${jwNum(g.scores[p.id] || 0)}</i></li>`).join('')}</ol>`;
    return;
  }
  if (g.sub === 'intro') { m.innerHTML = '<p class="jwhint">كل جولة سؤال… اكتب الأجوبة اللي تتوقع أغلب الناس يقولونها.<br>وكل لاعب كتب نفس جوابك يعطيك <b>+٥</b> 🤝</p>'; return; }
  if (g.sub === 'q') {
    m.innerHTML = S.spec ? '<p class="jwhint">اللاعبين يكتبون أجوبتهم… 👀</p>' : `<form class="jwform" autocomplete="off"><input id="jwIn" maxlength="30" enterkeyhint="send" placeholder="اكتب جوابك…"><button type="submit" id="jwSend" class="btn">أرسل</button></form>
      <div class="jwmine" id="jwMine"></div><button type="button" id="jwDone" class="btn sm jwdone" hidden>خلصت ✓</button>`;
    jwMine(g);
    const inp = $('#jwIn'); if (inp && !matchMedia('(pointer:coarse)').matches) setTimeout(() => inp.focus(), 50);
    return;
  }
  if (!g.res) { m.innerHTML = ''; return; }
  // اللوحة: تنكشف من السادس للأول
  const el = Math.max(0, (g.rel || 0) + (Date.now() - S.t0)), R = g.res, n = R.board.length;
  const tile = (b, i) => {
    const delay = g.sub === 'rev' ? Math.max(0, JW_BASE + (n - 1 - i) * JW_TILE - el) : 0;
    const mine = b.who.includes(S.me);
    return `<div class="jwt${mine ? ' mine' : ''}${b.who.length ? '' : ' none'}" style="--d:${delay}ms"><div class="jwtin">
      <div class="jwtf"><span>${i + 1}</span></div>
      <div class="jwtb"><span class="jwn">${i + 1}</span><b class="nt">${esc(b.t)}</b><span class="jwwho">${b.who.map(id => `<i title="">${bmFace(id)}</i>`).join('')}</span><em>${b.p}</em></div>
    </div></div>`;
  };
  const sameDelay = g.sub === 'rev' ? Math.max(0, JW_BASE + n * JW_TILE - el) : 0;
  const myR = R.mine[S.me] || [];
  const sum = myR.reduce((s, x) => s + x.pts, 0);
  m.innerHTML = `<div class="jwboard">${R.board.map(tile).join('')}</div>
    ${R.same.length ? `<div class="jwsame" style="--d:${sameDelay}ms"><h4>🤝 جوابهم! (+٥ عن كل واحد اتفق معك)</h4>${R.same.map(s => `<span class="jwsm"><b class="nt">${esc(s.t)}</b>${s.who.map(id => `<i>${bmFace(id)}</i>`).join('')}</span>`).join('')}</div>` : ''}
    ${S.spec ? '' : `<div class="jwmyres" style="--d:${sameDelay + 400}ms"><h4>أجوبتك</h4>${myR.length ? myR.map(x => `<span class="jwr ${x.bi >= 0 ? 'hit' : x.bonus ? 'same' : 'miss'}"><b class="nt">${esc(x.t)}</b><em>${x.pts ? '+' + x.pts : '0'}</em></span>`).join('') : '<span class="jwr miss"><b>ما كتبت شي 😶</b></span>'}<strong>${sum ? '+' + jwNum(sum) : '0'} نقطة</strong></div>`}`;
  if (g.sub === 'rev') R.board.forEach((b, i) => { const d = Math.max(0, JW_BASE + (n - 1 - i) * JW_TILE - el); setTimeout(() => { if (JW.sig.startsWith(g.k + '|rev')) sfx(b.who.includes(S.me) ? 'ding' : b.who.length ? 'card' : 'flick'); }, d + 150); });
}
