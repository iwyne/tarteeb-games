// ================= خمّن الرياكشن — ستايل تيك توك =================
// السؤال: الصورة بدون كلام (أو المقطع واقف)، والجواب: الصورة الأصلية بكلامها أو المقطع يشتغل بصوته.
const RXG = { id: '', phase: '', endT: 0, tm: 0, muted: false, gainK: '' };
const rxNum = n => String(n);
function rxBuild(body) {
  body.dataset.built = 'rxg';
  body.innerHTML = `<div class="rxw"><div class="rxcard">
      <div class="rxframe" id="rxFrame">
        <div class="rxmedia" id="rxMedia"></div>
        <div class="rxtop"><div class="rxbar"><i id="rxBar"></i></div><div class="rxhead"><b>خمّن الرياكشن</b><span id="rxK"></span></div></div>
        <div class="rxside"><div class="rxbub"><b id="rxGot">٠</b><small>جابوها</small></div><div class="rxbub"><b id="rxPl">٠</b><small>لاعبين</small></div><div class="rxbub t"><b id="rxClock">--</b><small>ثانية</small></div></div>
        <button class="rxsnd" id="rxSnd" hidden>🔊 شغّل الصوت</button>
        <div class="rxcap" id="rxCap"></div>
      </div>
      <div class="rxctl" id="rxCtl"></div>
    </div><aside class="rxscores"><h4>الترتيب</h4><ol id="rxScores"></ol></aside>${logHtml()}</div>`;
  $('#rxSnd').onclick = () => { const v = $('#rxMedia video.fg'); if (v) { v.muted = false; RXG.muted = false; v.play().catch(() => {}); } $('#rxSnd').hidden = true; };
}
window.net_rxg = m => {
  if (!S || S.game !== 'rxg') return;
  const f = $('#rxForm'); if (!f) return;
  const t = $('#rxTip'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
  if (t) { t.textContent = m.k === 'close' ? 'قريب مرة! تأكد من الكتابة' : 'لا، مو هذا'; t.className = 'rxtip ' + (m.k === 'close' ? 'hot' : 'no'); }
  sfx(m.k === 'close' ? 'pop' : 'gclick');
};
// الوسائط: خلفية مغبّشة + الصورة/المقطع بالنص (أي مقاس يتوسّط)
function rxSetMedia(kind, src, opt = {}) {
  const box = $('#rxMedia'), key = kind + '|' + src + '|' + (opt.play ? 1 : 0);
  if (box.dataset.k === key) return; box.dataset.k = key;
  $('#rxSnd').hidden = true;
  if (kind === 'img') {
    box.innerHTML = `<img class="bgm" src="${esc(src)}" alt=""><img class="fg${opt.flash ? ' flash' : ''}" src="${esc(src)}" alt="">`;
    return;
  }
  // مقطع: يا واقف على أول لقطة (السؤال)، يا يشتغل بصوته (الجواب)
  box.innerHTML = `<video class="bgm" muted playsinline preload="auto"></video><video class="fg${opt.flash ? ' flash' : ''}" playsinline preload="auto"></video>`;
  const [bg, v] = box.querySelectorAll('video'), s = +opt.s || 0, e = opt.e != null ? +opt.e : null;
  [bg, v].forEach(x => { x.src = src + (s ? `#t=${s}` : ''); });
  if (!opt.play) { v.muted = true; [bg, v].forEach(x => { x.addEventListener('loadeddata', () => { try { x.currentTime = s; } catch {} x.pause(); }, { once: true }); }); return; }
  bg.muted = true; v.muted = RXG.muted;
  const go = () => { try { v.currentTime = s; bg.currentTime = s; } catch {} bg.play().catch(() => {});
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); $('#rxSnd').hidden = false; }); };
  v.addEventListener('loadeddata', go, { once: true });
  v.addEventListener('timeupdate', () => { if (e != null && v.currentTime >= e) { v.pause(); bg.pause(); } });
  v.addEventListener('ended', () => bg.pause());
}
function renderRxg(body) {
  if (body.dataset.built !== 'rxg' || !$('#rxFrame')) rxBuild(body);
  document.body.classList.add('rxon');
  const g = S.g, over = S.phase === 'over', it = g.item, rv = g.reveal, sh = !!rv;
  $('#rxK').textContent = g.k ? `${rxNum(g.k)} / ${rxNum(g.count)}` : '';
  $('#rxPl').textContent = rxNum(S.players.length);
  $('#rxGot').textContent = rxNum(sh ? Object.keys(g.gain || {}).length : (g.done || []).length);
  $('#rxGot').nextElementSibling.textContent = sh ? 'جابوها' : 'جاوبوا';
  // الوسائط
  if (!it) { $('#rxMedia').innerHTML = `<div class="rxwait"><b>استعدوا…</b><small>${g.mode === 'type' ? 'اكتبوا الكلام اللي كان على الرياكشن' : 'اختاروا الكلام الصح من ٤'}</small></div>`; $('#rxMedia').dataset.k = ''; }
  else if (sh) rxSetMedia(rv.type, rv.f, { play: rv.type === 'vid', s: rv.s, e: rv.e, flash: true });
  else if (it.type === 'vid' && !/\.jpg$/.test(it.q)) rxSetMedia('vid', it.q, { s: it.s });
  else rxSetMedia('img', it.q);
  if (RXG.id !== (it && it.id) || RXG.phase !== g.sub) {
    if (it && RXG.id !== it.id) sfx('pop');
    if (sh && RXG.phase === 'q') sfx(g.my && g.my.ok ? 'win' : 'chime', { gain: g.my && g.my.ok ? 1 : .5 });
    RXG.id = it && it.id; RXG.phase = g.sub;
  }
  // الكابشن تحت (مثل تيك توك)
  const mine = g.gain && g.gain[S.me];
  $('#rxCap').innerHTML = !it ? '' : sh
    ? `<small>الجواب</small><b class="ans">${esc(rv.n)}</b>${mine ? `<em class="ok">+${rxNum(mine)}</em>` : `<em class="no">${g.my ? 'غلط' : 'ما جاوبت'}</em>`}`
    : `<b>${esc(it.hint || (it.type === 'vid' ? 'وش قال بالمقطع؟' : 'وش الكلام اللي كان عليها؟'))}</b><small>${g.first ? `⚡ ${esc(g.first)} أول واحد عرفها` : 'أسرع واحد ياخذ نقاط أكثر'}</small>`;
  // التحكم: ٤ خيارات أو كتابة
  const ctl = $('#rxCtl'), ck = [g.sub, g.k, g.mode, JSON.stringify(g.my), sh ? JSON.stringify(g.picks) : '', over, S.spec].join('|');
  if (ctl.dataset.k !== ck) {
    ctl.dataset.k = ck;
    if (over) ctl.innerHTML = `<div class="rxend">الفايز: <b>${esc(S.winner || '')}</b></div>`;
    else if (!it || g.sub === 'intro') ctl.innerHTML = '';
    else if (g.mode === 'pick') {
      const cnt = {}; if (g.picks) Object.values(g.picks).forEach(i => { cnt[i] = (cnt[i] || 0) + 1; });
      ctl.innerHTML = `<div class="rxopts">${(g.opts || []).map((o, i) => {
        const cls = sh ? (i === rv.ok ? 'ok' : g.my && g.my.i === i ? 'bad' : 'dim') : g.my ? (g.my.i === i ? 'sel' : 'dim') : '';
        return `<button data-i="${i}" class="${cls}"${sh || g.my || S.spec ? ' disabled' : ''}>${esc(o)}${sh && cnt[i] ? `<small>${rxNum(cnt[i])}</small>` : ''}</button>`;
      }).join('')}</div>`;
      ctl.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { send({ t: 'xa', i: +b.dataset.i }); sfx('gclick'); });
    } else {
      const done = g.my && g.my.ok;
      ctl.innerHTML = sh ? '' : `<form class="rxform" id="rxForm" autocomplete="off"><input id="rxIn" type="text" maxlength="80" placeholder="${done ? 'جبتها! انتظر الباقين' : 'اكتب تخمينك…'}" spellcheck="false"${done || S.spec ? ' disabled' : ''}><button type="submit"${done || S.spec ? ' disabled' : ''}>أرسل</button></form><div class="rxtip" id="rxTip">${g.tries ? '' : 'الكتابة ما تحتاج تكون حرف بحرف'}</div>`;
      const f = $('#rxForm');
      if (f) { f.onsubmit = e => { e.preventDefault(); const i = $('#rxIn'), v = i.value.trim(); if (!v) return; send({ t: 'xg', w: v }); i.value = ''; }; if (!done && !S.spec && !matchMedia('(pointer:coarse)').matches) setTimeout(() => { const i = $('#rxIn'); i && i.focus(); }, 50); }
    }
  }
  // الترتيب والأسماء
  const ps = [...S.players].sort((a, c) => (g.scores[c.id] || 0) - (g.scores[a.id] || 0)), oks = new Set(g.okIds || []), dn = new Set(g.done || []);
  $('#rxScores').innerHTML = ps.map((p, i) => `<li class="${p.id === S.me ? 'me' : ''}${oks.has(p.id) ? ' ok' : dn.has(p.id) ? ' dn' : ''}"><b>${rxNum(i + 1)}</b><span class="nm">${esc(p.name)}</span>${sh && g.gain && g.gain[p.id] ? `<i>+${rxNum(g.gain[p.id])}</i>` : ''}<em>${rxNum(g.scores[p.id] || 0)}</em></li>`).join('');
  // الوقت
  RXG.endT = g.sub === 'q' ? performance.now() + g.left : 0; RXG.tot = (g.sec || 20) * 1000;
  if (!RXG.tm) RXG.tm = setInterval(() => {
    const c = $('#rxClock'); if (!c) { clearInterval(RXG.tm); RXG.tm = 0; document.body.classList.remove('rxon'); return; }
    const left = RXG.endT ? Math.max(0, RXG.endT - performance.now()) : 0;
    c.textContent = RXG.endT ? rxNum(Math.ceil(left / 1000)) : '--'; c.parentNode.classList.toggle('low', !!RXG.endT && left < 5000);
    $('#rxBar').style.width = RXG.endT ? (100 * left / RXG.tot).toFixed(1) + '%' : '0%';
  }, 200);
}
