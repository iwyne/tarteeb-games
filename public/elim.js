// ================= مسابقة الإقصاء — مسرح المسابقة =================
const EL = { n: -1, endT: 0, tm: 0, showN: -1 };
const ELC = ['#e8362d', '#2a5bd7', '#ffc928', '#1fa35c'], ELS = ['▲', '◆', '●', '■'];
const elNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function elBuild(body) {
  body.dataset.built = 'elim';
  body.innerHTML = `<div class="elw"><div class="elstage">
      <div class="eltop"><span class="elpill y" id="elN"></span><b class="elcount" id="elCount"></b><span class="elpill" id="elOut"></span></div>
      <div class="elscreen"><span class="elcat" id="elCat"></span><h2 id="elQ" class="nt"></h2><div class="elbar"><i id="elBar"></i></div><b class="elclock" id="elClock"></b></div>
      <div class="elans" id="elAns">${[0, 1, 2, 3].map(i => `<button type="button" class="elbtn" data-a="${i}" style="--c:${ELC[i]}"><span class="sh">${ELS[i]}</span><b class="nt"></b><em></em></button>`).join('')}</div>
      <div class="elmsg" id="elMsg"></div>
      <div class="elpl" id="elPl"></div>
    </div>${logHtml()}</div>`;
  body.querySelector('#elAns').addEventListener('click', e => {
    const b = e.target.closest('.elbtn'); if (!b || b.disabled) return;
    send({ t: 'ea', a: +b.dataset.a }); sfx('gclick');
    body.querySelectorAll('.elbtn').forEach(x => x.classList.toggle('pick', x === b));
  });
}
addEventListener('keydown', e => {
  if (!S || S.game !== 'elim' || S.phase !== 'play' || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
  const i = { 1: 0, 2: 1, 3: 2, 4: 3, '١': 0, '٢': 1, '٣': 2, '٤': 3 }[e.key]; if (i == null) return;
  const b = document.querySelector(`.elbtn[data-a="${i}"]`); if (b && !b.disabled) b.click();
});
function renderElim(body) {
  if (body.dataset.built !== 'elim' || !$('#elAns')) elBuild(body);
  const g = S.g, over = S.phase === 'over', q = g.q, alive = Object.keys(g.lives).filter(id => g.lives[id] > 0), total = Object.keys(g.lives).length;
  const meIn = g.lives[S.me] > 0 && !S.spec;
  $('#elN').textContent = over ? '🏆 انتهت' : g.n ? `السؤال ${elNum(g.n)}` : 'استعدوا…';
  $('#elCount').textContent = `👥 باقي ${elNum(alive.length)} من ${elNum(total)}`;
  const out = g.res && g.sub === 'show' ? g.res.out.length : 0;
  $('#elOut').textContent = g.sub === 'show' ? (g.res.saved ? '😅 محد طلع' : `💀 طلع ${elNum(out)}`) : g.max > 1 ? `❤️ ${elNum(g.max)} قلوب` : '☠️ غلطة وحدة وتطلع';
  $('#elOut').classList.toggle('r', g.sub === 'show' && out > 0);
  if (q) { $('#elCat').textContent = `${q.cat} · ${'⭐'.repeat(q.d)}`; $('#elQ').textContent = q.text; }
  else { $('#elCat').textContent = 'مسابقة الإقصاء'; $('#elQ').textContent = over ? `👑 ${S.winner || ''}` : 'أول غلطة ممكن تطلعك… ركّز!'; }
  if (over && q) $('#elQ').textContent = `👑 ${S.winner || ''}`;
  // الأزرار
  const show = g.sub === 'show';
  if (EL.n !== g.n) { EL.n = g.n; document.querySelectorAll('.elbtn').forEach(b => b.classList.remove('pick')); if (g.n) sfx('pop'); }
  document.querySelectorAll('.elbtn').forEach((b, i) => {
    b.hidden = !q || over; if (!q) return;
    b.querySelector('b').textContent = q.opts[i];
    b.disabled = !meIn || g.sub !== 'q' || g.mine != null;
    b.classList.toggle('pick', g.mine === i);
    b.classList.toggle('ok', show && g.res.ok === i);
    b.classList.toggle('no', show && g.res.ok !== i);
    b.querySelector('em').textContent = show ? `${elNum(g.res.dist[i])} 👤` : g.mine === i ? 'اخترت ✓' : '';
  });
  // الرسالة
  const msg = $('#elMsg');
  if (show) {
    const mineWrong = g.res.wrong.includes(S.me), mineOut = g.res.out.includes(S.me);
    msg.innerHTML = mineOut ? '💀 طلعت! تقدر تتفرج وتشجع' : g.res.saved ? '😅 كلكم غلطتوا — محد طلع هالمرة' : mineWrong && meIn ? `💔 غلط! باقي لك ${elNum(g.lives[S.me])} ${g.lives[S.me] === 1 ? 'قلب' : 'قلوب'}` : g.res.wrong.includes(S.me) ? '' : meIn ? '✅ صح! كمّل' : (g.res.fast ? `⚡ أسرع واحد: ${esc(pn(g.res.fast))}` : '');
    msg.className = 'elmsg on' + (mineWrong ? ' bad' : '');
    if (EL.showN !== g.n) { EL.showN = g.n; sfx(mineOut ? 'lose' : mineWrong ? 'thud' : meIn ? 'chime' : 'bell'); }
  } else { msg.className = 'elmsg'; msg.innerHTML = g.sub === 'q' && !meIn ? '👀 تتفرج — شجّع اللي باقين' : g.sub === 'q' && g.mine != null ? '⏳ ننتظر الباقين…' : ''; }
  // اللاعبين
  const ids = Object.keys(g.lives), ans = new Set(g.answered || []);
  $('#elPl').innerHTML = ids.map(id => { const p = S.players.find(x => x.id === id), l = g.lives[id], dead = l <= 0, hit = show && g.res.wrong.includes(id) && !g.res.saved;
    return `<div class="elp${dead ? ' dead' : ''}${id === S.me ? ' me' : ''}${hit ? ' hit' : ''}${!dead && g.sub === 'q' && ans.has(id) ? ' ans' : ''}"><span class="pav">${dead ? '💀' : esc((p && (p.av || (p.bot ? '🤖' : [...p.name.trim()][0]))) || '؟')}</span><small>${esc(p ? p.name : '؟')}</small>${g.max > 1 ? `<i>${'❤️'.repeat(Math.max(0, l))}${'🖤'.repeat(Math.max(0, g.max - Math.max(0, l)))}</i>` : ''}</div>`; }).join('');
  // الوقت
  EL.endT = g.sub === 'q' ? performance.now() + g.left : 0;
  if (!EL.tm) EL.tm = setInterval(() => {
    const c = $('#elClock'), bar = $('#elBar'); if (!c) { clearInterval(EL.tm); EL.tm = 0; return; }
    const left = EL.endT ? Math.max(0, EL.endT - performance.now()) : 0;
    c.textContent = EL.endT ? elNum(Math.ceil(left / 1000)) : ''; c.classList.toggle('low', !!EL.endT && left < 5000);
    bar.style.width = (EL.endT ? left / ((S.g && S.g.sec || 15) * 1000) * 100 : 0) + '%';
  }, 150);
}
