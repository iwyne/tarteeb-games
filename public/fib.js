// صدّقني: واجهة برنامج مسابقات قديم، سؤال بفراغ، كذبات، ثم كشف وحدة وحدة
const FB = { cur: null, sub: '', round: 0 };
const fbQ = q => esc(q || '').replace('____', '<span class="fbblank">______</span>');
const fbName = id => { const p = S.players.find(x => x.id === id); return p ? esc((p.av ? p.av + ' ' : '') + p.name) : '؟'; };
function renderFib(body) {
  const g = S.g, over = S.phase === 'over', me = S.me, spec = S.spec;
  if (body.dataset.built !== 'fib') {
    body.dataset.built = 'fib';
    body.innerHTML = `<div class="fbw"><div class="fbbulbs"></div><div class="fbtop" id="fbTop"></div><div class="fbq" id="fbQ"></div><div class="fbmain" id="fbMain"></div><div class="fbppl" id="fbPpl"></div></div>`;
  }
  $('#fbTop').innerHTML = over ? '<b>النتيجة النهائية</b>' : `<span>الجولة <b>${g.round}</b> من ${g.rounds}</span>${g.x2 ? '<em class="fbx2">النقاط ×٢</em>' : ''}<span class="cd2"></span>`;
  $('#fbQ').innerHTML = g.q ? `<p>${fbQ(g.q)}</p>` : '';
  const main = $('#fbMain');
  const sig = [g.sub, g.round, g.myLie, g.myPick, g.cur, (g.opts || []).length, over].join('|');
  if (main.dataset.sig !== sig) {
    main.dataset.sig = sig;
    if (g.sub === 'write' && !spec) {
      main.innerHTML = `<form id="fbForm" class="fbform"><label>اكتب جواب كذب يقنع الباقين:</label><div class="row"><input id="fbIn" maxlength="40" placeholder="${g.myLie ? 'عدّل كذبتك…' : 'كذبتك…'}" autocomplete="off"><button class="btn green">${g.myLie ? 'عدّل' : 'ارسل'}</button></div>${g.myLie ? `<p class="fbsent">✔ كذبتك: <b class="nt">${esc(g.myLie)}</b></p>` : ''}</form>`;
      $('#fbForm').onsubmit = e => { e.preventDefault(); const v = $('#fbIn').value.trim(); if (v) { send({ t: 'flie', v }); $('#fbIn').value = ''; sfx('pop'); } };
      if (!g.myLie) setTimeout(() => { const i = $('#fbIn'); if (i) i.focus(); }, 30);
    } else if (g.sub === 'write') main.innerHTML = '<p class="muted">اللاعبين يكتبون كذباتهم…</p>';
    else if (g.sub === 'pick' && g.opts) {
      const done = g.myPick != null;
      main.innerHTML = `<p class="fbhint">${spec ? 'وين الجواب الصح؟' : done ? 'اخترت ✔ ننتظر الباقين…' : 'وين الجواب الصح؟ لا تنخدع!'}</p><div class="fbopts">${g.opts.map(o => `<button type="button" class="fbo${o.mine ? ' mine' : ''}${g.myPick === o.i ? ' sel' : ''}" data-i="${o.i}"${o.mine || spec ? ' disabled' : ''}><span class="nt">${esc(o.t)}</span>${o.mine ? '<small>كذبتك</small>' : ''}</button>`).join('')}</div>`;
      main.querySelectorAll('.fbo:not([disabled])').forEach(b => b.onclick = () => { send({ t: 'fpick', i: +b.dataset.i }); sfx('gclick'); });
    } else if ((g.sub === 'reveal' || g.sub === 'score' || over) && g.opts) {
      const o = g.opts.find(x => x.i === g.cur);
      const shown = g.opts.filter(x => x.k != null).sort((a, b) => a.k - b.k);
      main.innerHTML = `<div class="fbopts rev">${g.opts.map(x => {
        const st = x.k == null ? '' : x.truth ? ' truth' : ' lie';
        return `<div class="fbo${st}${x.i === g.cur && g.sub === 'reveal' ? ' cur' : ''}"><span class="nt">${esc(x.t)}</span>${x.k != null ? `<small>${x.truth ? '✅ الصح' : x.house ? '🏠 كذبة البيت' : '🤥 ' + x.by.map(fbName).join(' و ')}</small>${x.who.length ? `<div class="fbwho">${x.who.map(id => `<i title="${fbName(id)}">${bmFace(id)}</i>`).join('')}</div>` : ''}` : ''}</div>`;
      }).join('')}</div>${o && g.sub === 'reveal' ? `<div class="fbstamp ${o.truth ? 'ok' : 'no'}">${o.truth ? 'هذا الصح!' : 'كذبة!'}</div>` : ''}`;
      if (g.sub === 'reveal' && FB.cur !== g.cur + ':' + g.round && o) { FB.cur = g.cur + ':' + g.round; sfx(o.truth ? 'ding' : (o.who || []).length ? 'slap' : 'nope'); }
    }
  }
  // اللاعبين: وش سوّوا + النقاط
  const pc = g.sub === 'write' ? g.wrote : g.sub === 'pick' ? g.picked : [];
  const show = g.sub === 'score' || over;
  const list = [...S.players].sort((a, b) => show ? (g.scores[b.id] || 0) - (g.scores[a.id] || 0) : 0);
  $('#fbPpl').innerHTML = list.map(p => `<div class="fbp${pc.includes(p.id) ? ' done' : ''}${p.id === me ? ' me' : ''}"><span class="bmav">${bmFace(p.id)}</span><b class="nt">${esc(p.name)}</b><i>${(g.scores[p.id] || 0).toLocaleString('en-US')}</i>${show && g.gain && g.gain[p.id] ? `<em>+${g.gain[p.id].toLocaleString('en-US')}</em>` : ''}</div>`).join('');
  if (g.sub !== FB.sub || g.round !== FB.round) {
    if (g.sub === 'pick') sfx('whoosh'); else if (g.sub === 'score') sfx('card'); else if (g.sub === 'write' && FB.round !== g.round) sfx('bell');
    FB.sub = g.sub; FB.round = g.round;
  }
}
