// ================= حيوان جماد (اسم، جماد، حيوان، بلاد، نبات) — سبورة =================
const BW = { k: -1, t: {}, endT: 0, tm: 0 };
const BWEMO = ['🙂', '📦', '🐾', '🌍', '🌿'];
const bwNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const bwNorm = s => String(s || '').trim().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const bwOk = (w, L) => { const n = bwNorm(w), l = bwNorm(L); return n.length >= 2 && (n.startsWith(l) || (n.startsWith('ال') && n.slice(2).startsWith(l)) || (l === 'ا' && n.startsWith('ال'))); };
function bwBuild(body) {
  body.dataset.built = 'bwb';
  body.innerHTML = `<div class="bww"><div class="bwboard" id="bwBoard">
      <div class="bwhead"><b class="bwL" id="bwL">؟</b><div class="bwttl"><h3 id="bwTitle"></h3><small id="bwSub"></small></div><span class="bwclock" id="bwClock">--</span></div>
      <div class="bwbody" id="bwBody"></div>
    </div><div class="bwside"><h4>🏆 النقاط</h4><ol id="bwScores"></ol></div>${logHtml()}</div>`;
  body.querySelector('.bww').addEventListener('click', e => {
    const v = e.target.closest('[data-vote]'); if (v) { const [id, c] = v.dataset.vote.split(':'); send({ t: 'bwvote', id, c: +c }); sfx('gclick'); return; }
    if (e.target.closest('#bwStop')) { send({ t: 'bwstop' }); }
  });
}
function bwSend(c, v) { clearTimeout(BW.t[c]); BW.t[c] = setTimeout(() => send({ t: 'bw', c, v }), 300); }
function bwWrite(g) {
  const box = $('#bwBody');
  if (box.dataset.k !== 'w' + g.k) {
    box.dataset.k = 'w' + g.k;
    const mine = g.mine || g.cols.map(() => '');
    const h = g.hist || [], tot = h.reduce((a, r) => a + r.p, 0);
    const tag = st => st === 1 ? '<small class="s1">١٠</small>' : st === 2 ? '<small class="s2">٥</small>' : '';
    box.innerHTML = `<div class="bwtbl bwpaper"><table class="nt-cells"><thead><tr><th>حرف</th>${g.cols.map(c => `<th>${esc(c)}</th>`).join('')}<th>مجموع</th></tr></thead><tbody>
      ${h.map(r => `<tr><th class="bwlt">${esc(r.L)}</th>${r.a.map((w, i) => `<td class="st${r.s[i]}"><span class="nt">${w ? esc(w) : '—'}</span>${tag(r.s[i])}</td>`).join('')}<td class="tot">${bwNum(r.p)}</td></tr>`).join('')}
      <tr class="bwnow"><th class="bwlt">${esc(g.L)}</th>${g.cols.map((c, i) => `<td class="bwin"><input type="text" id="bwI${i}" data-c="${i}" maxlength="24" autocomplete="off" spellcheck="false" aria-label="${esc(c)}" value="${esc(mine[i] || '')}"><i class="bwok"></i></td>`).join('')}<td class="tot">…</td></tr>
      ${h.length ? `<tr class="bwsum"><th colspan="${g.cols.length + 1}">المجموع الكلي</th><td class="tot">${bwNum(tot)}</td></tr>` : ''}</tbody></table></div>
      <div class="bwfoot"><div class="bwprog" id="bwProg"></div><button type="button" class="bwstop" id="bwStop">ستوب</button></div>`;
    box.querySelectorAll('input').forEach(inp => {
      const upd = () => { inp.parentNode.classList.toggle('ok', bwOk(inp.value, g.L)); inp.parentNode.classList.toggle('bad', !!inp.value.trim() && !bwOk(inp.value, g.L)); bwStopState(); };
      inp.addEventListener('input', () => { upd(); bwSend(+inp.dataset.c, inp.value); });
      inp.addEventListener('blur', () => { clearTimeout(BW.t[inp.dataset.c]); send({ t: 'bw', c: +inp.dataset.c, v: inp.value }); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const n = box.querySelector(`input[data-c="${+inp.dataset.c + 1}"]`); if (n) n.focus(); else if (!$('#bwStop').disabled) $('#bwStop').click(); } });
      upd();
    });
    if (!matchMedia('(pointer:coarse)').matches) setTimeout(() => { const f = box.querySelector('input'); if (f) f.focus(); }, 200);
  }
  box.querySelectorAll('input').forEach(i => { i.disabled = S.spec || S.phase !== 'play'; });
  bwStopState();
  // تقدّم الباقين
  const ps = S.players.filter(p => g.filled[p.id] != null && p.id !== S.me);
  $('#bwProg').innerHTML = ps.map(p => `<span class="${g.filled[p.id] >= g.cols.length ? 'done' : ''}"><b>${esc((p.av || [...p.name.trim()][0] || '؟'))}</b>${esc(p.name)} ${g.filled[p.id] >= g.cols.length ? '✅' : bwNum(g.filled[p.id]) + '/' + bwNum(g.cols.length)}</span>`).join('');
}
function bwStopState() {
  const b = $('#bwStop'), g = S.g; if (!b || !g) return;
  const all = [...document.querySelectorAll('#bwBody input')].every(i => bwOk(i.value, g.L));
  b.disabled = !all || g.sub !== 'write' || S.spec;
  b.title = all ? '' : 'عبّ كل الخانات أول';
}
function bwReview(g) {
  const box = $('#bwBody'); box.dataset.k = 'r' + g.k;
  const ids = S.players.map(p => p.id).filter(id => g.all && g.all[id]);
  const cell = (id, c) => {
    const w = g.all[id][c], s = g.st[id][c], vk = id + ':' + c, v = g.votes[vk], kn = g.kn && g.kn[id] ? g.kn[id][c] : true;
    const tag = s === 1 ? '<small class="s1">+١٠</small>' : s === 2 ? '<small class="s2">+٥</small>' : s === 3 ? '<small class="s3">✗</small>' : s === 4 ? '<small class="s4">؟</small>' : '';
    const canVote = g.sub === 'rev' && id !== S.me && w && !S.spec && s !== 3 || (g.sub === 'rev' && id !== S.me && !S.spec && v && v.me);
    const tip = kn ? 'اضغط لو الجواب غلط' : 'مو بالقاموس — اضغط لو هي صح عشان تنقبل';
    return `<td class="st${s}${v && v.me ? ' voted' : ''}${kn ? '' : ' unk'}"${canVote ? ` data-vote="${vk}" title="${tip}"` : ''}><span class="nt">${w ? esc(w) : '—'}</span>${tag}${v ? `<em>${kn ? '👎' : '👍'}${bwNum(v.n)}</em>` : ''}</td>`;
  };
  box.innerHTML = `<div class="bwtbl"><table class="nt-cells"><thead><tr><th>حرف «${esc(g.L)}»</th>${g.cols.map((c, i) => `<th>${esc(c)}</th>`).join('')}<th>المجموع</th></tr></thead>
    <tbody>${ids.map(id => `<tr class="${id === S.me ? 'me' : ''}"><th>${esc(pn(id))}${g.stopBy === id ? ' ✋' : ''}</th>${g.cols.map((_, c) => cell(id, c)).join('')}<td class="tot">${bwNum(g.pts[id] || 0)}</td></tr>`).join('')}</tbody></table></div>
    <p class="bwnote">${g.sub === 'rev' ? '+١٠ صح · +٥ مكرر · ✗ غلط · ؟ مو بالقاموس — شايف جواب غلط؟ اضغط عليه وينلغي لو صوّت أغلب اللاعبين. والكلمة اللي عليها ؟ ما تنحسب إلا لو أغلب الباقين ضغطوا إنها صح' : '⭐ انضافت النقاط — الجولة الجاية بعد شوي'}</p>`;
}
function bwSheet(g) {
  const h = g.hist || []; if (!h.length) return '';
  const cell = (w, st) => `<td class="st${st}"><span class="nt">${w ? esc(w) : '—'}</span></td>`;
  return `<div class="bwsheet"><h4>ورقتك</h4><div class="bwtbl"><table class="nt-cells"><thead><tr><th>حرف</th>${g.cols.map(c => `<th>${esc(c)}</th>`).join('')}<th>مجموع</th></tr></thead><tbody>${h.map(r => `<tr><th class="bwlt">${esc(r.L)}</th>${r.a.map((w, i) => cell(w, r.s[i])).join('')}<td class="tot">${bwNum(r.p)}</td></tr>`).join('')}<tr class="me"><th colspan="${g.cols.length + 1}">المجموع الكلي</th><td class="tot">${bwNum(h.reduce((a, r) => a + r.p, 0))}</td></tr></tbody></table></div></div>`;
}
function renderBwb(body) {
  if (body.dataset.built !== 'bwb' || !$('#bwBody')) bwBuild(body);
  const g = S.g, over = S.phase === 'over';
  $('#bwL').textContent = g.L || '؟';
  if (BW.k !== g.k) { BW.k = g.k; const L = $('#bwL'); L.classList.remove('pop'); void L.offsetWidth; L.classList.add('pop'); sfx('whistle'); }
  $('#bwTitle').textContent = over ? '🏆 انتهت اللعبة' : g.sub === 'write' ? `حرف «${g.L}»` : g.sub === 'stopping' ? `✋ ${pn(g.stopBy)} ضغط ستوب!` : `النتائج — الجولة ${bwNum(g.k)}`;
  $('#bwSub').textContent = over ? (S.winner || '') : g.sub === 'write' ? `الجولة ${bwNum(g.k)} من ${bwNum(g.count)} · اكتب كلمة تبدأ بـ «${g.L}» بكل خانة` : g.sub === 'stopping' ? 'باقي ثواني وتنقفل الخانات — كمّل بسرعة!' : `الجولة ${bwNum(g.k)} من ${bwNum(g.count)}`;
  $('#bwBoard').classList.toggle('stopping', g.sub === 'stopping');
  if (g.sub === 'write' || g.sub === 'stopping') bwWrite(g); else if (g.all) bwReview(g);
  let sh = $('#bwSheet'); if (!sh) { sh = document.createElement('div'); sh.id = 'bwSheet'; $('#bwBoard').appendChild(sh); }
  const hk = (g.hist || []).length + g.sub; if (sh.dataset.k !== hk) { sh.dataset.k = hk; sh.innerHTML = ['rev', 'write', 'stopping'].includes(g.sub) ? '' : bwSheet(g); }
  if (g.sub === 'stopping' && BW.stopK !== g.k) { BW.stopK = g.k; sfx('bell'); }
  // النقاط
  const ps = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0));
  $('#bwScores').innerHTML = ps.map((p, i) => `<li class="${p.id === S.me ? 'me' : ''}"><b>${bwNum(i + 1)}</b><span class="nm">${esc(p.name)}</span>${g.last && g.last[p.id] ? `<small>+${bwNum(g.last[p.id])}</small>` : ''}<em>${bwNum(g.scores[p.id] || 0)}</em></li>`).join('');
  BW.endT = over ? 0 : performance.now() + (g.left || 0);
  if (!BW.tm) BW.tm = setInterval(() => {
    const c = $('#bwClock'); if (!c) { clearInterval(BW.tm); BW.tm = 0; return; }
    const left = BW.endT ? Math.max(0, BW.endT - performance.now()) : 0, s = Math.ceil(left / 1000);
    c.textContent = BW.endT ? `${bwNum(Math.floor(s / 60))}:${bwNum(String(s % 60).padStart(2, '0'))}` : '--'; c.classList.toggle('low', !!BW.endT && left < 10000);
  }, 250);
}
