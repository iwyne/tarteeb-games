// العائلة الترتيب: لوحة برنامج مسابقات، أجوبة تنقلب، وإكسات
const FD = { ev: null, round: 0, sub: '', open: '' };
const fdTeam = (g, id) => g.T[0].includes(id) ? 0 : g.T[1].includes(id) ? 1 : -1;
function renderFeud(body) {
  const g = S.g, over = S.phase === 'over', me = S.me, myT = fdTeam(g, me);
  if (body.dataset.built !== 'feud') {
    body.dataset.built = 'feud';
    body.innerHTML = `<div class="fdw"><div class="fdscore" id="fdScore"></div><div class="fdq" id="fdQ"></div><div class="fdboard" id="fdBoard"></div><div class="fdstat" id="fdStat"></div>
      <form class="fdform" id="fdForm" autocomplete="off"><input id="fdIn" maxlength="40" placeholder="جوابك…" autocomplete="off"><button class="btn green">جاوب</button></form>
      <div class="fdlog" id="fdLog"></div><div class="fdteams" id="fdTeams"></div><div class="fdx" id="fdX"></div></div>`;
    $('#fdForm').onsubmit = e => { e.preventDefault(); const v = $('#fdIn').value.trim(); if (v) { send({ t: 'dans', v }); setTimeout(() => { $('#fdIn').value = ''; }, 0); } };
  }
  $('#fdScore').innerHTML = [0, 1].map(t => `<div class="fdts t${t}${g.ctrl === t && g.sub === 'play' ? ' on' : ''}"><small>فريق ${TN[t]}</small><b>${g.ts[t]}</b></div>`).join(`<div class="fdmid"><small>الجولة ${g.round} من ${g.rounds}</small>${g.mult > 1 ? '<em>النقاط ×٢</em>' : ''}<b class="fdpool">${g.pool}</b><span class="cd2"></span></div>`);
  $('#fdQ').textContent = g.q || '';
  // اللوحة: الخانات تنقلب لما ينكشف الجواب
  const bd = $('#fdBoard'), sig = g.round + ':' + g.n;
  if (bd.dataset.sig !== sig) { bd.dataset.sig = sig; bd.innerHTML = Array.from({ length: g.n }, (_, i) => `<div class="fdslot" data-i="${i}"><div class="fdin"><div class="fdf"><b>${i + 1}</b></div><div class="fdb"><span class="nt"></span><i></i></div></div></div>`).join(''); FD.open = ''; }
  g.board.forEach((x, i) => {
    const el = bd.querySelector(`.fdslot[data-i="${i}"]`); if (!el || !x) return;
    if (!el.classList.contains('open')) { el.querySelector('.fdb span').textContent = x.t; el.querySelector('.fdb i').textContent = x.p; el.classList.add('open'); el.classList.toggle('late', !x.open); if (x.open) try { sfx('ding'); } catch {} }
  });
  // الحالة
  const nm = id => { const p = S.players.find(x => x.id === id); return p ? esc(p.name) : '؟'; };
  let st = '', can = false;
  if (over) st = '<b>انتهت اللعبة</b>';
  else if (g.sub === 'face') { st = `⚡ مواجهة: <b>${nm(g.faceIds[0])}</b> ضد <b>${nm(g.faceIds[1])}</b> — أعلى جواب ياخذ الدور`; can = g.faceIds.includes(me) && !g.faced.includes(me); }
  else if (g.sub === 'play') { st = `دور <b>${nm(g.who)}</b> من فريق ${TN[g.ctrl]} <span class="fdstrk">${'❌'.repeat(g.strikes)}${'<i>✖</i>'.repeat(3 - g.strikes)}</span>`; can = g.who === me; }
  else if (g.sub === 'steal') { st = `🦹 فريق ${TN[g.stealBy]} يقدر يسرق النقاط بجواب واحد! تشاوروا…`; can = myT === g.stealBy; }
  else if (g.sub === 'roundEnd' && g.win) st = `<b class="fdwin t${g.win.t}">فريق ${TN[g.win.t]} ${g.win.stole ? 'سرق' : 'أخذ'} ${g.win.pts} نقطة${g.win.stole ? ' 🦹' : ''}</b>`;
  $('#fdStat').innerHTML = st;
  const form = $('#fdForm'); form.hidden = !can || S.spec;
  if (can && FD.focus !== g.sub + g.round + g.who + g.strikes) { FD.focus = g.sub + g.round + g.who + g.strikes; setTimeout(() => { const i = $('#fdIn'); if (i) i.focus(); }, 30); }
  $('#fdLog').innerHTML = g.log.slice(-5).map(l => `<span class="${l.res === 'x' || l.res === 'dup' ? 'no' : 'ok'}">${l.id ? nm(l.id) + ': ' : ''}<b class="nt">${esc(l.t)}</b>${l.res === 'dup' ? ' (انقالت)' : ''}</span>`).join('');
  $('#fdTeams').innerHTML = [0, 1].map(t => `<div class="fdtm t${t}"><b>فريق ${TN[t]}</b>${g.T[t].map(id => `<span class="${id === g.who || (g.sub === 'face' && g.faceIds.includes(id)) ? 'on' : ''}${id === me ? ' me' : ''}">${bmFace(id)} ${nm(id)}</span>`).join('')}</div>`).join('');
  // إكس كبير لما أحد يغلط
  if (g.ev && FD.ev !== g.ev.n) {
    const first = FD.ev === null; FD.ev = g.ev.n;
    if (!first && (g.ev.res === 'x' || g.ev.res === 'dup')) { const x = $('#fdX'); x.innerHTML = '<b>✖</b>'; x.classList.remove('on'); void x.offsetWidth; x.classList.add('on'); try { sfx('penalty'); } catch {} }
  }
  if (g.sub !== FD.sub || g.round !== FD.round) { if (g.sub === 'roundEnd' && g.win) sfx(g.win.t === myT ? 'win' : 'lose'); else if (g.sub === 'face') sfx('bell'); else if (g.sub === 'steal') sfx('alarm'); FD.sub = g.sub; FD.round = g.round; }
}
