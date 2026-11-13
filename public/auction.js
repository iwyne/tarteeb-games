// المزاد: كتالوج دار مزادات قديمة، مطرقة، وخبر سري
const AU = { k: 0, sub: '', bidN: 0 };
const auM = n => Number(n || 0).toLocaleString('en-US');
function renderAuction(body) {
  const g = S.g, over = S.phase === 'over', me = g.P[S.me];
  if (body.dataset.built !== 'auction') {
    body.dataset.built = 'auction';
    body.innerHTML = `<div class="auw"><div class="autop" id="auTop"></div><div class="aumain"><div class="aucard" id="auCard"></div><div class="aubid" id="auBid"></div></div><div class="auppl" id="auPpl"></div></div>`;
    body.querySelector('.auw').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) { send({ t: 'abid', a: +b.dataset.a }); } });
  }
  body.querySelector('.auw').classList.toggle('done', over);
  $('#auTop').innerHTML = over ? '<b>انتهى المزاد</b>' : `<span>القطعة <b>${g.k || 0}</b> من ${g.count}</span>${me ? `<span class="aucash">💰 ${auM(me.cash)}</span>` : ''}`;
  const card = $('#auCard'), it = g.it;
  const sig = [g.k, g.sub, !!g.tip, over].join('|');
  if (card.dataset.sig !== sig) {
    card.dataset.sig = sig;
    if (over || g.sub === 'end') {
      const rows = [...S.players].filter(p => g.P[p.id]).sort((a, b) => (g.P[b.id].worth || 0) - (g.P[a.id].worth || 0));
      card.innerHTML = `<h3 class="auh">الثروة النهائية</h3><ol class="aurank">${rows.map(p => { const P = g.P[p.id]; return `<li><b>${bmFace(p.id)} ${esc(p.name)}</b><span>💰 ${auM(P.cash)} + 📦 ${auM(P.items.reduce((s, x) => s + x.v, 0))}</span><em>${auM(P.worth)}</em></li>`; }).join('')}</ol>`;
    } else if (!it) card.innerHTML = '<div class="aulot"><span class="auemo">🔨</span><h3>المزاد بيبدأ…</h3></div>';
    else {
      card.innerHTML = `<div class="aulot${g.sub === 'show' ? ' in' : ''}"><small class="aunum">قطعة رقم ${g.k}</small><span class="auemo">${it.e}</span><h3 class="nt">${esc(it.name)}</h3>${it.box ? '<em class="aubox">❓ صندوق غامض</em>' : ''}<p class="auhint">«${esc(it.h)}»</p>
        ${g.tip ? `<div class="autip">🤫 خبير همس لك: قيمتها الحقيقية بين <b>${auM(g.tip[0])}</b> و <b>${auM(g.tip[1])}</b></div>` : g.tipped ? `<small class="auwho">🤫 فيه ${g.tipped > 1 ? 'اثنين يعرفون' : 'واحد يعرف'} القيمة… مين؟</small>` : ''}</div>`;
    }
  }
  // المزايدة
  const bidEl = $('#auBid');
  if (over || !it) { bidEl.innerHTML = ''; }
  else if (g.sub === 'sold') {
    const by = g.top && S.players.find(p => p.id === g.top), diff = it.v - g.price;
    bidEl.innerHTML = `<div class="ausold"><div class="gavel slam">🔨</div><b class="austamp">${g.top ? 'بيع!' : 'محد شراه'}</b>${g.top ? `<p>لـ <b>${by ? esc(by.name) : '؟'}</b> بـ ${auM(g.price)}</p>` : ''}<p class="auval">القيمة الحقيقية: <b>${auM(it.v)}</b></p>${g.top ? `<p class="${diff >= 0 ? 'win' : 'loss'}">${diff >= 0 ? '🤑 ربح +' + auM(diff) : '😭 خسارة ' + auM(-diff)}</p>` : ''}</div>`;
  } else {
    const mine = g.top === S.me, can = a => !S.spec && me && !mine && g.sub === 'bid' && g.price + a <= me.cash;
    const top = g.top && S.players.find(p => p.id === g.top);
    bidEl.innerHTML = `<div class="auprice"><small>السعر الحالي</small><b class="${AU.bidN !== g.bidN ? 'bump' : ''}">${g.price ? auM(g.price) : '—'}</b><span>${top ? `${bmFace(top.id)} ${esc(top.name)}${mine ? ' (أنت)' : ''}` : g.sub === 'show' ? '…' : 'محد زايد للحين'}</span></div>
      <div class="aucall" id="auCall"></div>
      <div class="aubtns">${[100, 500, 1000, 5000].map(a => `<button type="button" class="btn aub" data-a="${a}"${can(a) ? '' : ' disabled'}>+${auM(a)}</button>`).join('')}</div>
      <div class="aufeed">${g.bids.slice().reverse().map(b => `<span>${bmFace(b.id)} ${auM(b.a)}</span>`).join('')}</div>`;
  }
  // اللاعبين
  $('#auPpl').innerHTML = [...S.players].filter(p => g.P[p.id]).map(p => { const P = g.P[p.id]; return `<div class="aup${p.id === g.top && g.sub === 'bid' ? ' top' : ''}${p.id === S.me ? ' me' : ''}"><span class="bmav">${bmFace(p.id)}</span><b class="nt">${esc(p.name)}</b><i>💰 ${auM(P.cash)}</i><small>${P.items.map(x => x.e).join('') || '—'}</small></div>`; }).join('');
  // أصوات
  if (g.bidN !== AU.bidN) { if (AU.bidN && g.sub === 'bid') sfx('gclick'); AU.bidN = g.bidN; }
  if (g.sub !== AU.sub || g.k !== AU.k) { if (g.sub === 'sold') { sfx('slam'); setTimeout(() => sfx(g.top && it && it.v >= g.price ? 'win' : 'nope'), 700); } else if (g.sub === 'show') sfx('bell'); AU.sub = g.sub; AU.k = g.k; }
  auCall();
}
// «دوّك مرة… مرتين… بيع!» من الوقت الباقي
function auCall() {
  const el = $('#auCall'); if (!el || !S || S.game !== 'auction' || !S.g || S.g.sub !== 'bid') return;
  const left = Math.max(0, S.left - (Date.now() - S.t0)) / 1000;
  const t = left > 5 ? '' : left > 2.6 ? 'دوّك مرة…' : left > .3 ? 'دوّك مرتين…' : '';
  if (el.textContent !== t) { el.textContent = t; if (t) { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); try { sfx('tick'); } catch {} } }
}
setInterval(auCall, 200);
