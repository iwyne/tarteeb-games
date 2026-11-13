// أعلام ودول: سؤال سريع بأربع خيارات (أسماء أو أعلام)
const FL = { k: 0, sub: '' };
const flImg = (c, cls = '') => `<img class="flimg ${cls}" src="flags/${c}.svg" alt="" draggable="false">`;
function renderFlags(body) {
  const g = S.g, over = S.phase === 'over', q = g.q, sh = g.sub === 'show';
  if (body.dataset.built !== 'flags') {
    body.dataset.built = 'flags';
    body.innerHTML = `<div class="flw"><div class="fltop" id="flTop"></div><div class="flbar"><i id="flBar"></i></div><div class="flq" id="flQ"></div><div class="flopts" id="flOpts"></div><div class="flppl" id="flPpl"></div></div>`;
    body.querySelector('.flw').addEventListener('click', e => { const b = e.target.closest('.flo'); if (b && !b.disabled && S.g.sub === 'q' && S.g.my == null) { send({ t: 'fans', i: +b.dataset.i }); b.classList.add('sel'); sfx('gclick'); } });
  }
  const st = g.streak[S.me] || 0;
  $('#flTop').innerHTML = over ? '<b>النتيجة</b>' : g.sub === 'intro' ? '<b>استعد… 🌍</b>' : `<span>سؤال <b>${g.k}</b> من ${g.count}</span>${st >= 2 ? `<em class="flstreak">🔥 ${st}</em>` : ''}<span class="flme">${(g.scores[S.me] || 0).toLocaleString('en-US')}</span>`;
  const sig = [g.k, g.sub, over].join('|');
  if ($('#flQ').dataset.sig !== sig) {
    $('#flQ').dataset.sig = sig;
    // شريط الوقت ينقص من الوقت الباقي
    const bar = $('#flBar'); bar.style.transition = 'none'; bar.style.width = g.sub === 'q' ? '100%' : '0';
    if (g.sub === 'q') { const left = Math.max(0, S.left - (Date.now() - S.t0)); void bar.offsetWidth; bar.style.width = (left / 120) + '%'; requestAnimationFrame(() => { bar.style.transition = `width ${left}ms linear`; bar.style.width = '0'; }); }
    if (!q || over) { $('#flQ').innerHTML = over ? '' : '<div class="flglobe">🌍</div>'; $('#flOpts').innerHTML = ''; }
    else {
      $('#flQ').innerHTML = q.kind === 'f2n' ? `<div class="flbig">${flImg(q.c)}</div><b>وش هذي الدولة؟</b>`
        : q.kind === 'cap' ? `<div class="flsm">${flImg(q.c)}</div><b>وش عاصمة <span class="nt">${esc(q.n)}</span>؟</b>`
        : `<b class="fln">وين علم <span class="nt">${esc(q.n)}</span>؟</b>`;
      $('#flOpts').className = 'flopts' + (q.kind === 'n2f' ? ' pics' : '');
      $('#flOpts').innerHTML = q.opts.map(o => `<button type="button" class="flo" data-i="${o.i}">${o.c ? flImg(o.c) : `<span class="nt">${esc(o.t)}</span>`}<div class="flwho"></div></button>`).join('');
    }
  }
  // حالة الخيارات
  if (q && !over) {
    $$('#flOpts .flo').forEach(b => {
      const i = +b.dataset.i;
      b.disabled = S.spec || g.my != null || g.sub !== 'q';
      b.classList.toggle('sel', g.my === i);
      b.classList.toggle('ok', sh && g.ok === i); b.classList.toggle('bad', sh && g.my === i && g.ok !== i);
      const who = sh && g.picks ? Object.keys(g.picks).filter(id => g.picks[id] === i) : [];
      b.querySelector('.flwho').innerHTML = who.map(id => `<i>${bmFace(id)}</i>`).join('');
    });
  }
  // اللاعبين
  const list = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0));
  $('#flPpl').innerHTML = list.map(p => `<div class="flp${g.ans.includes(p.id) && g.sub === 'q' ? ' done' : ''}${p.id === S.me ? ' me' : ''}"><span class="bmav">${bmFace(p.id)}</span><b class="nt">${esc(p.name)}</b><i>${(g.scores[p.id] || 0).toLocaleString('en-US')}</i>${sh && g.gain && g.gain[p.id] ? `<em>+${g.gain[p.id]}</em>` : ''}${(g.streak[p.id] || 0) >= 3 ? '<small>🔥</small>' : ''}</div>`).join('');
  if (g.sub !== FL.sub || g.k !== FL.k) {
    if (g.sub === 'q') sfx('pop');
    else if (sh) sfx(g.my == null ? 'nope' : g.my === g.ok ? 'ding' : 'nope');
    FL.sub = g.sub; FL.k = g.k;
  }
}
