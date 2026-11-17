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
  rich: { s: 'coin', t: 'مليونير الديرة', html: () => `<div class="bills">${['💵', '💰', '🏠', '💵', '🏨', '💰', '💵'].map((e, i) => `<i style="left:${8 + i * 13}%;top:${20 + (i % 3) * 18}%;animation-delay:${i * .12}s">${e}</i>`).join('')}</div><i class="rd2">🎲</i>` },
  cars: { s: 'whoosh', t: 'مطاردة', html: () => `<i class="rd"></i><i class="kc run">🚗</i><i class="kc cop">🚓</i><i class="sr r"></i><i class="sr b"></i>` },
  baloot: { s: 'card', t: 'بلوت', html: () => `<i class="b1">A♥</i><i class="b2">J♠</i><i class="b3">9♦</i>` },
  jwb: { s: 'pop', t: 'جوابك الترتيب', html: () => `<i class="jb1">🍚 دجاج؟</i><i class="jb2">لحم! 🥩</i><i class="jb3">🤝 +٥</i>` },
  feud: { s: 'ding', t: 'العائلة الترتيب', html: () => `<div class="bd">${[0, 1, 2, 3, 4, 5].map(i => `<i style="--k:${i}"><b>${i + 1}</b></i>`).join('')}</div><em class="xx">✖</em>` },
  flags: { s: 'whoosh', t: 'أعلام ودول', html: () => `<div class="gl">🌍</div>${['sa', 'br', 'jp', 'eg', 'ca', 'it'].map((c, i) => `<img class="fg" src="flags/${c}.svg" style="--k:${i}" alt="">`).join('')}` },
  mimic: { s: 'boing', t: 'الأصوات الترتيب', html: () => `<div class="mic">🎙️</div>${[0, 1, 2, 3, 4, 5, 6].map(i => `<i class="bar" style="--k:${i}"></i>`).join('')}${['😱', '😂', '🤯'].map((e, i) => `<em class="fx" style="--k:${i}">${e}</em>`).join('')}` },
  chess: { s: 'card', t: 'شطرنج', html: () => `<div class="bd">${Array.from({ length: 64 }, (_, i) => `<i class="${((i >> 3) + i) % 2 ? 'd' : 'l'}" style="--k:${(i >> 3) + (i & 7)}"></i>`).join('')}</div><img class="kg w" src="chess/wK.svg" alt=""><img class="kg b" src="chess/bK.svg" alt=""><em class="mt">كش مات</em>` }
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
  try { sfx(d.s); if (g === 'liars') setTimeout(() => sfx('bang'), 900); if (g === 'uno' || g === 'flip') setTimeout(() => sfx('uno'), 1000); if (g === 'bomb') { [300, 650, 950, 1200, 1400].forEach(t => setTimeout(() => sfx('tick'), t)); setTimeout(() => sfx('bang'), 1550); } if (g === 'phone') setTimeout(() => sfx('bell'), 700); if (g === 'chess') setTimeout(() => sfx('slap'), 1300); if (g === 'auction') { setTimeout(() => sfx('slam'), 1300); } if (g === 'feud') { setTimeout(() => sfx('penalty'), 1400); } } catch {}
}
// اللوبي ياخذ ستايل لعبته
function gtSync() {
  const g = S && S.phase === 'lobby' ? S.game : '';
  if (document.body.dataset.gt !== g) { if (g) document.body.dataset.gt = g; else delete document.body.dataset.gt; }
  const key = g ? S.code + ':' + g : '';
  if (key && key !== GT.cur) {
    GT.cur = key;
    // الانميشن يطلع بعد ما تسوي الغرفة (أو تدخلها، أو المضيف يغيّر اللعبة) — مو لما تضغط على اللعبة
    gtIntro(g);
  }
  if (!g) GT.cur = '';
}
(() => {
  const r0 = render; render = function () { r0.apply(this, arguments); try { gtSync(); } catch (e) { console.warn(e); } };
  // أصوات بداية الجولة: خلط وتوزيع ورق، أو صفّارة/جرس للألعاب الثانية
  const SND = { k: '', hand: -1 };
  const r1 = render; render = function () {
    r1.apply(this, arguments);
    try {
      if (!S || !S.g || S.phase !== 'play') { if (!S || S.phase === 'lobby') SND.k = ''; return; }
      const k = S.code + ':' + S.game;
      if (k !== SND.k) {
        SND.k = k; SND.hand = -1;
        if (['uno', 'flip'].includes(S.game)) sfx.dealRound(7);
        else if (S.game === 'liars') sfx.dealRound(5);
        else if (['cars', 'sus', 'haunt', 'typing', 'bomb', 'flags', 'feud'].includes(S.game)) sfx('whistle');
        else if (S.game !== 'baloot' && S.game !== 'jackaroo') sfx('bell');
      }
      // البلوت والجاكارو: كل توزيعة جديدة لها صوت
      if (S.game === 'baloot' && S.g.handN !== SND.hand) { if (S.g.sub === 'bid') { SND.hand = S.g.handN; sfx.dealRound(5); } }
      if (S.game === 'jackaroo' && S.g.hand) { const n = S.g.hand.length; if (n > SND.hand && SND.hand !== -2) sfx.dealRound(n); SND.hand = n; }
    } catch (e) { console.warn(e); }
  };
})();
