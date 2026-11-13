// ستايل خاص لكل لعبة: انميشن دخول لما تضغط على اللعبة، ولوبي وإعدادات بألوانها وخطوطها.
// اللوبي ياخذ الثيم من body[data-gt]، والانميشن طبقة فوق الصفحة تختفي لحالها (أو بضغطة).
const GTI = {
  uno: { s: 'card', t: 'أونو', html: () => ['r', 'y', 'g', 'b'].map((c, i) => `<i class="c ${c}" style="--k:${i}"><b>${['7', '+2', '⇄', '⊘'][i]}</b></i>`).join('') + '<em class="burst">UNO!</em>' },
  flip: { s: 'whoosh', t: 'أونو فليب', html: () => '<div class="fc"><i class="l"><b>7</b></i><i class="d"><b>+5</b></i></div>' },
  codes: { s: 'card', t: 'كلمة السر', html: () => `<div class="grid">${'rbnrbkbrn'.split('').map((c, i) => `<i class="cc ${c}" style="--k:${i}"></i>`).join('')}</div><em class="stamp">سرّي للغاية</em>` },
  hive: { s: 'pop', t: 'خلية الحروف', html: () => `<div class="hx">${'أبتثجحخدذ'.split('').map((c, i) => `<i style="--k:${i}">${c}</i>`).join('')}</div>` },
  liars: { s: 'gclick', t: 'الكذابين الترتيب', html: () => `<div class="cyl">${[0, 1, 2, 3, 4, 5].map(i => `<i style="--k:${i}"></i>`).join('')}</div>${['K', 'Q', 'A'].map((c, i) => `<b class="pc" style="--k:${i}">${c}</b>`).join('')}` },
  outside: { s: 'drone', t: 'برا السالفة', html: () => `<div class="crowd">${[0, 1, 2, 3, 4].map(i => `<i style="--k:${i}">${i === 3 ? '<em>؟</em>' : ''}</i>`).join('')}</div><div class="spot"></div>` },
  typing: { s: 'tick', t: 'سبّاق الكتابة', html: () => `<div class="flag"></div><div class="tw"><span>سبّاق الكتابة</span><i class="caret"></i></div>` },
  jackaroo: { s: 'card', t: 'جاكارو', html: () => `<svg class="trk" viewBox="0 0 200 200"><circle cx="100" cy="100" r="78"/></svg>${['#e8362d', '#2a5bd7', '#1fa35c', '#ffc928'].map((c, i) => `<i class="mb" style="--c:${c};--k:${i}"></i>`).join('')}` },
  draw: { s: 'pop', t: 'رسم وخمّن', html: () => `<svg class="dw" viewBox="0 0 200 160"><path d="M30 130V70l50-40 50 40v60z"/><path d="M68 130v-32h24v32"/><circle cx="160" cy="36" r="16"/><path d="M10 140c40-10 140-10 180 0"/></svg><i class="pen"></i>` },
  sus: { s: 'whoosh', t: 'المندس', html: () => `<div class="warp">${Array.from({ length: 26 }, (_, i) => `<i style="--a:${i * 360 / 26}deg;--k:${i % 7}"></i>`).join('')}</div><div class="crew"><i class="v"></i></div><em class="knife"></em>` },
  haunt: { s: 'thunder', t: 'البيت المسكون', html: () => `<svg class="hs" viewBox="0 0 200 140"><path d="M20 140V80L60 50V30h14v12l26-20 80 58v60z"/><rect x="88" y="96" width="24" height="44" class="dr"/><rect x="40" y="90" width="14" height="14" class="wn"/><rect x="140" y="88" width="14" height="14" class="wn"/></svg>${[0, 1, 2].map(i => `<i class="bat" style="--k:${i}">🦇</i>`).join('')}` },
  mafia: { s: 'bang', t: 'المافيا', html: () => `<svg class="sky" viewBox="0 0 300 100" preserveAspectRatio="none"><path d="M0 100V60h20V40h18v30h14V30h22v40h16V50h20v50zM130 100V45h16V30h20v70zM180 100V55h24V35h18v65zM230 100V60h20V42h26v58z"/></svg><svg class="hat" viewBox="0 0 100 60"><path d="M4 50h92l-12-9H16z"/><path d="M22 41c0-22 10-34 28-34s28 12 28 34z"/><path d="M23 36h54" class="band"/></svg>` },
  phone: { s: 'bell', t: 'التلفون الترتيب', html: () => `<svg class="ph" viewBox="0 0 160 120"><path d="M14 44c0-20 30-32 66-32s66 12 66 32l-22 8-8-18c-24-8-48-8-72 0l-8 18z" class="hs"/><path d="M40 60h80l14 50H26z" class="bd"/><circle cx="80" cy="84" r="20" class="dial"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${80 + 13 * Math.cos(i / 8 * 6.28)}" cy="${84 + 13 * Math.sin(i / 8 * 6.28)}" r="3.2" class="hole"/>`).join('')}</svg>${[0, 1, 2].map(i => `<i class="wave" style="--k:${i}"></i>`).join('')}<svg class="cord" viewBox="0 0 300 40" preserveAspectRatio="none"><path d="M0 20q10-18 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0"/></svg>` },
  fib: { s: 'ding', t: 'صدّقني', html: () => `<div class="bulbs">${Array.from({ length: 14 }, (_, i) => `<i style="--k:${i}"></i>`).join('')}</div><div class="pg"><svg viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M0 30h30l8-18 8 34 8-26 6 14h20l6-24 10 44 8-30 6 10h20l8-14 8 22 6-8h28"/></svg></div><em class="lie">كذّاب؟</em>` },
  bomb: { s: 'tick', t: 'القنبلة', html: () => `<div class="hz"></div><div class="bm"><i class="cap"></i><i class="fz"></i><i class="sp"></i><i class="sh"></i></div><div class="kb"></div>` },
  auction: { s: 'bell', t: 'المزاد', html: () => `<div class="pod"></div><div class="lot">🏺<small>قطعة رقم ١</small></div><div class="gv">🔨</div><em class="sold">بيع!</em>` },
  feud: { s: 'ding', t: 'العائلة الترتيب', html: () => `<div class="bd">${[0, 1, 2, 3, 4, 5].map(i => `<i style="--k:${i}"><b>${i + 1}</b></i>`).join('')}</div><em class="xx">✖</em>` },
  flags: { s: 'whoosh', t: 'أعلام ودول', html: () => `<div class="gl">🌍</div>${['sa', 'br', 'jp', 'eg', 'ca', 'it'].map((c, i) => `<img class="fg" src="flags/${c}.svg" style="--k:${i}" alt="">`).join('')}` }
};
const GT = { last: '', lastAt: 0, cur: '' };
function gtIntro(g) {
  const d = GTI[g]; if (!d) return;
  GT.last = g; GT.lastAt = Date.now();
  let o = $('#gtIntro'); if (o) o.remove();
  o = document.createElement('div'); o.id = 'gtIntro'; o.className = 'gti gti-' + g;
  o.innerHTML = `<div class="gtstage">${d.html()}</div><h2 class="gtt">${d.t}</h2><small class="gtskip">اضغط عشان تكمّل</small>`;
  document.body.appendChild(o);
  const kill = () => { if (!o.isConnected) return; o.classList.add('out'); setTimeout(() => o.remove(), 420); };
  o.onclick = kill; setTimeout(kill, matchMedia('(prefers-reduced-motion: reduce)').matches ? 700 : 2300);
  try { sfx(d.s); if (g === 'liars') setTimeout(() => sfx('bang'), 900); if (g === 'uno' || g === 'flip') setTimeout(() => sfx('uno'), 1000); if (g === 'bomb') { [300, 650, 950, 1200, 1400].forEach(t => setTimeout(() => sfx('tick'), t)); setTimeout(() => sfx('bang'), 1550); } if (g === 'phone') setTimeout(() => sfx('bell'), 700); if (g === 'auction') { setTimeout(() => sfx('slam'), 1300); } if (g === 'feud') { setTimeout(() => sfx('penalty'), 1400); } } catch {}
}
// اللوبي ياخذ ستايل لعبته
function gtSync() {
  const g = S && S.phase === 'lobby' ? S.game : '';
  if (document.body.dataset.gt !== g) { if (g) document.body.dataset.gt = g; else delete document.body.dataset.gt; }
  const key = g ? S.code + ':' + g : '';
  if (key && key !== GT.cur) {
    GT.cur = key;
    // لو توه شاف انميشنها من الصفحة الرئيسية ما نعيده
    if (!(GT.last === g && Date.now() - GT.lastAt < 12000)) gtIntro(g);
  }
  if (!g) GT.cur = '';
}
(() => {
  const r0 = render; render = function () { r0.apply(this, arguments); try { gtSync(); } catch (e) { console.warn(e); } };
  const p0 = pickGame; pickGame = function (g) { p0(g); gtIntro(g); };
})();
