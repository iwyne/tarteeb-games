// ================= خمّن المثل — محادثة جوال =================
const EM = { k: -1, last: 0, endT: 0, tm: 0 };
const emNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function emBuild(body) {
  body.dataset.built = 'emo';
  body.innerHTML = `<div class="emw"><div class="emphone">
      <div class="emhead"><span class="emav">💬</span><div><b>قروب الأمثال</b><small id="emSub"></small></div><span class="emclock" id="emClock">--</span></div>
      <div class="emchat" id="emChat"></div>
      <div class="emboard" id="emBoard"></div>
      <form class="eminput" id="emForm" autocomplete="off"><input id="emIn" type="text" maxlength="80" placeholder="اكتب المثل…" spellcheck="false"><button type="submit" aria-label="أرسل">➤</button></form>
    </div><aside class="emside"><h4>🏆 النقاط</h4><ol id="emScores"></ol><p class="emworth" id="emWorth"></p></aside>${logHtml()}</div>`;
  $('#emForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#emIn'), v = i.value.trim(); if (!v || !S.g || S.g.sub !== 'q' || S.g.mine) return; send({ t: 'eg', w: v }); i.value = ''; sfx('gclick'); });
}
window.net_emo = m => { if (m.k === 'close' && S && S.game === 'emo') { const c = $('#emChat'); if (!c) return; const el = document.createElement('div'); el.className = 'emmsg sys hot'; el.textContent = '🔥 قريب مرة! تأكد من الكتابة'; c.appendChild(el); c.scrollTop = c.scrollHeight; sfx('pop'); setTimeout(() => el.remove(), 3500); } };
function emMsg(m) {
  if (m.sys) return `<div class="emmsg sys">${m.emo ? `<div class="emq"><small>المضيف 🤖</small><b>${esc(m.emo)}</b><em>مثل شعبي</em></div>` : esc(m.t)}</div>`;
  const me = m.id === S.me;
  if (m.ok) return `<div class="emmsg ok${me ? ' me' : ''}">✅ <b>${esc(m.name)}</b> ${me ? 'حلّيتها!' : 'حلّها!'} <small>+${emNum(m.pts)}</small></div>`;
  return `<div class="emmsg${me ? ' me' : ''}">${me ? '' : `<small>${esc(m.name)}</small>`}<span class="nt">${esc(m.t)}</span> <i>❌</i></div>`;
}
function renderEmo(body) {
  if (body.dataset.built !== 'emo' || !$('#emChat')) emBuild(body);
  const g = S.g, over = S.phase === 'over';
  $('#emSub').textContent = over ? 'انتهت اللعبة' : g.k ? `المثل ${emNum(g.k)} من ${emNum(g.count)} · ${emNum(S.players.length)} أعضاء` : 'استعدوا…';
  // المحادثة
  const ch = $('#emChat');
  if (EM.k !== g.k) { EM.k = g.k; EM.last = 0; ch.innerHTML = ''; if (g.k) sfx('pop'); }
  const fresh = (g.chat || []).filter(m => m.n > EM.last);
  if (fresh.length) {
    const atEnd = ch.scrollHeight - ch.scrollTop - ch.clientHeight < 60;
    ch.insertAdjacentHTML('beforeend', fresh.map(emMsg).join('')); EM.last = fresh[fresh.length - 1].n;
    if (atEnd || fresh.some(m => m.id === S.me || m.emo)) ch.scrollTop = ch.scrollHeight;
    fresh.forEach(m => { if (m.ok) sfx(m.id === S.me ? 'win' : 'chime', { gain: m.id === S.me ? 1 : .5 }); });
  }
  if (over && !ch.querySelector('.final')) ch.insertAdjacentHTML('beforeend', `<div class="emmsg sys final">🏆 الفايز: <b>${esc(S.winner || '')}</b></div>`);
  // الخانات
  const b = $('#emBoard');
  b.innerHTML = g.board ? `<div class="emwords">${g.board.map(w => `<span class="emw1">${w.map(c => `<i class="${c ? 'on' : ''}">${esc(c)}</i>`).join('')}</span>`).join('')}</div><small>${g.board.map(w => emNum(w.length)).join(' - ')} حروف</small>` : '';
  b.classList.toggle('done', g.sub === 'show' || !!g.mine);
  const inp = $('#emIn'); inp.disabled = S.spec || g.sub !== 'q' || g.mine || over;
  inp.placeholder = g.mine ? '✅ حلّيتها! انتظر الباقين' : g.sub === 'q' ? 'اكتب المثل…' : '…';
  // النقاط
  const ps = [...S.players].sort((a, c) => (g.scores[c.id] || 0) - (g.scores[a.id] || 0));
  $('#emScores').innerHTML = ps.map((p, i) => `<li class="${p.id === S.me ? 'me' : ''}${(g.solved || []).includes(p.id) ? ' ok' : ''}"><b>${emNum(i + 1)}</b><span class="nm">${esc(p.name)}</span>${(g.solved || []).includes(p.id) ? '✅' : ''}<em>${emNum(g.scores[p.id] || 0)}</em></li>`).join('');
  $('#emWorth').textContent = g.sub === 'q' && !g.mine ? `💰 لو حليتها الحين: ${emNum(g.worth)} نقطة` : '';
  EM.endT = g.sub === 'q' ? performance.now() + g.left : 0;
  if (!EM.tm) EM.tm = setInterval(() => {
    const c = $('#emClock'); if (!c) { clearInterval(EM.tm); EM.tm = 0; return; }
    const left = EM.endT ? Math.max(0, EM.endT - performance.now()) : 0;
    c.textContent = EM.endT ? `⏱ ${emNum(Math.ceil(left / 1000))}` : '--'; c.classList.toggle('low', !!EM.endT && left < 8000);
  }, 250);
}
