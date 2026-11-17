// فريق ترتيب: لوحات طويلة مايلة، ولما تضغط على أحد يطلع من لوحته لنص الشاشة بحركة نابض (spring)
// ويرجع لمكانه بنفس الحركة. بدون مكتبات: الحركة محسوبة من معادلة النابض ومشغّلة بـ WAAPI.
(() => {
  const TEAM = [
    { n: 'بشرى', img: 'team/m1.webp', c: '#ff4fa3' },
    { n: 'مازن', img: 'team/m2.webp', c: '#e8362d' },
    { n: 'أفراح', img: 'team/m3.webp', c: '#a66bff' },
    { n: 'سلمان', img: 'team/m4.webp', c: '#ff8a1f' },
    { n: 'ايزن', img: 'team/m5.webp', c: '#19c3d6' },
    { n: 'حميد', img: 'team/m6.webp', c: '#2a5bd7' },
    { n: 'علي', img: 'team/m7.webp', c: '#055323' },
    { n: 'هدهد', img: 'team/m8.webp', c: '#420000' },
    { n: 'لافي', img: 'team/m9.webp', c: '#ff8fc0' }
  ];
  const SKEW = -8, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.getElementById('ttTeam'); if (!root) return;
  const pad = i => String(i + 1).padStart(2, '0');
  const face = (m, cls = '') => m.img ? `<img class="tt-img ${cls}" src="${m.img}" alt="${m.n}" loading="lazy" decoding="async" draggable="false">` : `<span class="tt-ph ${cls}"><b>${m.n[0]}</b><small>الصورة قريباً</small></span>`;
  root.innerHTML = `<div class="tt-head"><span class="tt-tag">TRTB TEAM</span><h2>فريق ترتيب</h2><p>الناس اللي ورا كل لعبة هنا. اضغط على أي واحد 👆</p></div>
    <div class="tt-stage">${TEAM.map((m, i) => `<button type="button" class="tt-card" data-i="${i}" style="--c:${m.c};--k:${i}" aria-label="${m.n}">
      <span class="tt-in">${face(m)}</span><i class="tt-shine"></i><span class="tt-name"><b>${m.n}</b></span></button>`).join('')}</div>`;
  const stage = root.querySelector('.tt-stage');

  // ---- النابض: نحسب منحنى الحركة من معادلة (كتلة + نابض + احتكاك) ----
  function springCurve(k = 210, c = 20, m = 1) {
    const out = [], dt = 1 / 120; let x = 1, v = 0, t = 0;
    while (t < 2.5) { const a = (-k * x - c * v) / m; v += a * dt; x += v * dt; t += dt; out.push(1 - x); if (t > .3 && Math.abs(x) < .0008 && Math.abs(v) < .01) break; }
    return { p: out, ms: out.length * dt * 1000 };
  }
  const SP = springCurve(), SPB = springCurve(260, 26);
  const lerp = (a, b, p) => a + (b - a) * p;
  function frames(from, to, sp, n = 48) {
    const f = [];
    for (let j = 0; j <= n; j++) {
      const idx = Math.min(sp.p.length - 1, Math.round(j / n * (sp.p.length - 1))), p = sp.p[idx];
      f.push({ offset: j / n, left: lerp(from.x, to.x, p) + 'px', top: lerp(from.y, to.y, p) + 'px', width: lerp(from.w, to.w, p) + 'px', height: lerp(from.h, to.h, p) + 'px', transform: `skewX(${lerp(from.s, to.s, p)}deg)`, borderRadius: lerp(from.r, to.r, p) + 'px' });
    }
    return f;
  }
  // مقاس الشخصية بالنص: كبيرة مرة مع الحفاظ على نسبة الصورة
  function target() {
    const vw = innerWidth, vh = innerHeight, ar = .585;
    let h = Math.min(vh * .72, 720), w = h * ar;
    if (w > vw * .78) { w = vw * .78; h = w / ar; }
    return { x: (vw - w) / 2, y: Math.max(16, (vh - h) / 2 - 34), w, h, s: 0, r: 22 };
  }
  const rectOf = card => { const b = card.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, s: SKEW, r: 10 }; };

  let ov = null, busy = false, cur = -1;
  function open(i) {
    if (busy || ov) return; busy = true; cur = i;
    const m = TEAM[i], card = stage.querySelector(`.tt-card[data-i="${i}"]`), from = rectOf(card), to = target();
    ov = document.createElement('div'); ov.className = 'tt-ov'; ov.style.setProperty('--c', m.c);
    ov.innerHTML = `<div class="tt-back"><i class="tt-glow"></i><i class="tt-rays"></i><b class="tt-big" aria-hidden="true">${m.n}</b></div>
      <div class="tt-fly" style="--c:${m.c}"><div class="tt-tilt"><span class="tt-in">${face(m, 'big')}</span><i class="tt-glare"></i></div></div>
      <div class="tt-cap"><em>TRTB TEAM</em><h3><span>${m.n}</span></h3></div>
      <button type="button" class="tt-x" aria-label="سكّر">✕</button>`;
    document.body.appendChild(ov);
    const fly = ov.querySelector('.tt-fly');
    Object.assign(fly.style, { left: to.x + 'px', top: to.y + 'px', width: to.w + 'px', height: to.h + 'px' });
    card.classList.add('tt-gone');
    document.documentElement.classList.add('tt-lock');
    requestAnimationFrame(() => ov.classList.add('on'));
    const cap = ov.querySelector('.tt-cap'); cap.style.top = (to.y + to.h + 14) + 'px';
    try { sfx('whoosh'); } catch {}
    const a = reduce ? null : fly.animate(frames(from, to, SP), { duration: SP.ms, easing: 'linear', fill: 'both' });
    const done = () => { busy = false; ov && ov.classList.add('ready'); };
    a ? a.finished.then(done) : done();
    ov.addEventListener('click', e => { if (e.target.closest('.tt-tilt') && !e.target.closest('.tt-x')) return; close(); });
    ov.querySelector('.tt-x').focus({ preventScroll: true });
    // ميلان خفيف مع الماوس + لمعة
    const tilt = ov.querySelector('.tt-tilt');
    ov.addEventListener('pointermove', e => {
      if (!ov || !ov.classList.contains('ready') || e.pointerType !== 'mouse') return;
      const b = fly.getBoundingClientRect(), dx = (e.clientX - (b.left + b.width / 2)) / innerWidth, dy = (e.clientY - (b.top + b.height / 2)) / innerHeight;
      tilt.style.transform = `rotateY(${dx * 14}deg) rotateX(${-dy * 14}deg)`;
      tilt.style.setProperty('--gx', (50 + dx * 120) + '%'); tilt.style.setProperty('--gy', (40 + dy * 120) + '%');
    });
  }
  function close() {
    if (!ov || busy) return; busy = true;
    const o = ov, fly = o.querySelector('.tt-fly'), card = stage.querySelector(`.tt-card[data-i="${cur}"]`);
    const b = fly.getBoundingClientRect(), from = { x: b.left, y: b.top, w: b.width, h: b.height, s: 0, r: 22 }, to = rectOf(card);
    o.querySelector('.tt-tilt').style.transform = '';
    fly.getAnimations().forEach(a => a.cancel());
    Object.assign(fly.style, { left: to.x + 'px', top: to.y + 'px', width: to.w + 'px', height: to.h + 'px', transform: `skewX(${SKEW}deg)`, borderRadius: '10px' });
    o.classList.remove('on', 'ready'); o.classList.add('off');
    const a = reduce ? null : fly.animate(frames(from, to, SPB), { duration: SPB.ms, easing: 'linear', fill: 'both' });
    const done = () => { card.classList.remove('tt-gone'); card.classList.add('tt-back-in'); setTimeout(() => card.classList.remove('tt-back-in'), 500); o.remove(); ov = null; busy = false; document.documentElement.classList.remove('tt-lock'); card.focus({ preventScroll: true }); };
    a ? a.finished.then(done) : done();
  }
  stage.addEventListener('click', e => { const c = e.target.closest('.tt-card'); if (c) open(+c.dataset.i); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && ov) close(); });
  addEventListener('resize', () => { if (ov && !busy) { const t = target(), f = ov.querySelector('.tt-fly'); f.getAnimations().forEach(a => a.cancel()); Object.assign(f.style, { left: t.x + 'px', top: t.y + 'px', width: t.w + 'px', height: t.h + 'px', transform: 'none', borderRadius: '22px' }); ov.querySelector('.tt-cap').style.top = (t.y + t.h + 14) + 'px'; } });
})();
