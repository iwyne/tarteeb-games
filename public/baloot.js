// بلوت (واجهة)
const BL = { sig: '', tsig: '', hsig: '' };
const BL_RED = s => s === '♥' || s === '♦';
const BL_SN = { '♠': 'سبيت', '♥': 'هاص', '♣': 'شريا', '♦': 'ديمن' };
const blCard = (c, cls = '') => `<span class="blc ${BL_RED(c.s) ? 'red' : ''} ${cls}" data-id="${c.id}"><b>${c.r}</b><i>${c.s}</i><em>${c.s}</em><u>${c.r}<br>${c.s}</u></span>`;
function renderBaloot(body) {
  const g = S.g, over = S.phase === 'over', me = g.seat >= 0 ? g.seat : 0;
  const P = S.players, rel = s => (s - me + 4) % 4, nm = s => P[s] ? P[s].name : '';
  const myT = me % 2;
  if (body.dataset.built !== 'baloot') {
    body.dataset.built = 'baloot'; BL.sig = BL.tsig = BL.hsig = '';
    body.innerHTML = `<div class="blw">
      <div class="bltop"><div class="blsc"><span class="us">لنا <b id="blUs">0</b></span><span class="them">لهم <b id="blThem">0</b></span><small id="blTgt"></small></div><div id="blCon" class="blcon"></div></div>
      <div class="bltbl" id="blTbl">
        <div class="blseat s1" id="blS1"></div><div class="blseat s2" id="blS2"></div><div class="blseat s3" id="blS3"></div>
        <div class="blmid" id="blMid"></div>
        <div class="blme" id="blS0"></div>
        <div class="blbid" id="blBid"></div>
        <div class="blbar"><i id="blBar"></i></div>
      </div>
      <div class="blhand" id="blHand"></div>
      <div class="blres" id="blRes" hidden></div>
    </div>`;
    body.querySelector('.blw').addEventListener('click', e => {
      const c = e.target.closest('#blHand .blc.ok'); if (c) { send({ t: 'bplay', id: +c.dataset.id }); sfx('card'); return; }
      const b = e.target.closest('[data-bk]'); if (b) { send({ t: 'bbid', k: b.dataset.bk, suit: b.dataset.su }); sfx('gclick'); }
    });
  }
  const T = g.total || [0, 0];
  $('#blUs').textContent = T[myT]; $('#blThem').textContent = T[1 - myT]; $('#blTgt').textContent = `الهدف ${g.target}`;
  $('#blCon').innerHTML = g.mode ? `<span class="${g.mode}">${g.mode === 'sun' ? '☀️ صن' : `حكم <i class="${BL_RED(g.trump) ? 'red' : ''}">${g.trump}</i>`}</span><small>${esc(nm(g.buyer))} ${g.buyer % 2 === myT ? '(لنا)' : '(لهم)'}</small>` : g.sub === 'bid' ? `<span>الشراء — الجولة ${g.bid ? g.bid.round : 1}</span>` : '';
  // المقاعد
  for (let s = 0; s < 4; s++) {
    const r = rel(s), el = $('#blS' + r); if (!el) continue;
    const p = P[s]; if (!p) { el.innerHTML = ''; continue; }
    const said = g.bid && g.bid.said[s] ? `<span class="blsaid">${esc(g.bid.said[s])}</span>` : '';
    const pr = g.proj && g.proj.list[s] && g.proj.list[s].length ? `<span class="blproj">📜 ${g.proj.list[s].join(' + ')}</span>` : '';
    const bl = g.proj && g.proj.bloot === s ? '<span class="blproj">👑 بلوت</span>' : '';
    const backs = r === 0 ? '' : `<span class="blbacks">${'<i></i>'.repeat(Math.min(8, g.cnt[s] || 0))}</span>`;
    el.className = `${r === 0 ? 'blme' : 'blseat'} s${r}${g.turn === s && !over && (g.sub === 'play' || g.sub === 'bid') ? ' blturn' : ''} t${s % 2 === myT ? 'us' : 'them'}`;
    el.innerHTML = `${backs}<span class="bmav">${bmFace(p.id)}</span><b class="nt">${esc(p.name)}</b>${g.dealer === s ? '<em class="bldl">موزّع</em>' : ''}${g.buyer === s ? '<em class="blby">مشتري</em>' : ''}${said}${pr}${bl}`;
  }
  // المنتصف: الورقة المكشوفة أو الأكلة
  const mid = $('#blMid'), tr = g.sub === 'collect' && g.last ? g.last.cards : g.trick;
  const tsig = g.sub + '|' + (g.up ? g.up.id : '') + '|' + tr.map(x => x.c.id).join(',') + '|' + (g.last ? g.last.w : '');
  if (BL.tsig !== tsig) {
    BL.tsig = tsig;
    if (g.sub === 'bid' && g.up) mid.innerHTML = `<div class="blup">${blCard(g.up, 'big')}<small>الورقة المكشوفة</small></div>`;
    else mid.innerHTML = tr.map(x => `<div class="blt p${rel(x.s)}${g.sub === 'collect' && g.last && g.last.w === x.s ? ' win' : ''}">${blCard(x.c)}</div>`).join('') +
      (g.sub === 'collect' && g.last ? `<div class="blwin">${esc(nm(g.last.w))} أكل 🍽️</div>` : '');
    if (tr.length) sfx('card');
  }
  // شريط الوقت
  const bar = $('#blBar'), bsig = g.turn + '|' + g.sub + '|' + tr.length + '|' + g.handN;
  if (bar.dataset.k !== bsig) { bar.dataset.k = bsig; bar.style.transition = 'none'; const left = Math.max(0, S.left - (Date.now() - S.t0)), tot = g.sub === 'bid' ? 20000 : 30000; bar.style.width = (g.sub === 'play' || g.sub === 'bid') ? Math.min(100, left / tot * 100) + '%' : '0'; void bar.offsetWidth; if (g.sub === 'play' || g.sub === 'bid') { bar.style.transition = `width ${left}ms linear`; bar.style.width = '0'; } }
  // الشراء
  const bidBox = $('#blBid'), myBid = g.sub === 'bid' && g.bid && g.bid.turn === g.seat && !S.spec;
  const bsg = myBid + '|' + (g.bid ? g.bid.round + '|' + g.bid.hokmBy : '');
  if (BL.sig !== bsg) {
    BL.sig = bsg;
    if (!myBid) bidBox.innerHTML = g.sub === 'bid' && g.bid ? `<p class="blwait">${esc(nm(g.bid.turn))} يقرّر…</p>` : '';
    else {
      const B = g.bid, up = B.upS, btn = (k, t, su, cls = '') => `<button type="button" class="btn ${cls}" data-bk="${k}"${su ? ` data-su="${su}"` : ''}>${t}</button>`;
      let h = '<p>دورك تشتري؟</p><div class="blbtns">';
      h += btn('sun', '☀️ صن', '', 'yellow');
      if (B.hokmBy === null) {
        if (B.round === 1) h += btn('hokm', `حكم <i class="${BL_RED(up) ? 'red' : ''}">${up}</i>`, up, 'green');
        else ['♠', '♥', '♣', '♦'].filter(x => x !== up).forEach(su => { h += btn('hokm', `حكم <i class="${BL_RED(su) ? 'red' : ''}">${su}</i>`, su, 'green'); });
      }
      h += btn('pass', B.hokmBy !== null ? 'ولا' : 'بس', '', 'dark') + '</div>';
      bidBox.innerHTML = h;
      sfx('pop');
    }
  }
  // يدي
  const hand = g.hand || [], ok = new Set(g.legal || []);
  const hsig = hand.map(c => c.id).join(',') + '|' + [...ok].join(',');
  if (BL.hsig !== hsig) {
    BL.hsig = hsig; const n = hand.length;
    $('#blHand').innerHTML = hand.map((c, i) => blCard(c, (ok.has(c.id) ? 'ok' : ok.size ? 'no' : '') + `" style="--i:${i - (n - 1) / 2}`)).join('');
  }
  $('#blHand').classList.toggle('myturn', ok.size > 0);
  // النتيجة
  const res = $('#blRes'), R = g.res;
  res.hidden = !R;
  if (R) {
    const t = x => x === myT ? 'لنا' : 'لهم', row = (lbl, a) => `<tr><td>${lbl}</td><td>${a[myT]}</td><td>${a[1 - myT]}</td></tr>`;
    res.innerHTML = `<div class="blrc"><h3>${R.kab !== null ? 'كبوت! 🔥' : R.fail ? 'خسرانة 💥' : 'نهاية الصكة'}</h3>
      <p>${R.mode === 'sun' ? '☀️ صن' : 'حكم ' + R.trump} — اشتراه ${esc(nm(R.buyer))} (${t(R.buyer % 2)})</p>
      <table><tr><th></th><th>لنا</th><th>لهم</th></tr>${row('الأكل', R.raw)}${row('النقاط', R.gp)}${row('المشاريع', R.pj)}${R.bl[0] || R.bl[1] ? row('بلوت', R.bl) : ''}<tr class="sum"><td>تنحسب</td><td>+${R.add[myT]}</td><td>+${R.add[1 - myT]}</td></tr><tr class="tot"><td>المجموع</td><td>${T[myT]}</td><td>${T[1 - myT]}</td></tr></table>
      ${over ? `<h4>${S.winTeam === myT ? 'فزتوا! 🏆' : 'خسرتوا 😅'}</h4>` : '<small>الصكة الجاية بعد شوي…</small>'}</div>`;
  }
}
