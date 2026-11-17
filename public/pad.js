// ===== يد التحكم (Gamepad) =====
// بالألعاب اللي فيها مشي (المندس، البيت المسكون، مطاردة): العصا اليسار تمشي، والأزرار تسوي الأكشن.
// بباقي الموقع: الأسهم/العصا تتنقّل بين الأزرار، A يضغط، B يرجع.
(() => {
  const PAD = window.PAD = { on: false, lx: 0, ly: 0, rx: 0, ry: 0, mode: null };
  const DZ = .2, dz = v => Math.abs(v) < DZ ? 0 : (v - Math.sign(v) * DZ) / (1 - DZ);
  let prev = [], cur = null, curC = null, navAt = 0, navDir = null, navN = 0, raf = 0, hinted = false;
  // أزرار كل لعبة (ترقيم الـ standard gamepad): 0=A 1=B 2=X 3=Y 4=LB 5=RB 6=LT 7=RT 8=Select 9=Start 10=L3
  const KEYS = {
    sus: { 0: 'e', 2: 'q', 3: 'r', 4: 'v', 5: 'f', 8: 'm', 9: 'm' },
    haunt: { 0: 'e', 2: 'q', 3: 'f', 4: 'c', 5: 'r', 8: 'm', 9: 'm' },
    cars: { 0: ' ', 2: ' ', 7: ' ' },
    boxing: { 0: 'j', 2: 'k', 3: 'l', 4: 'a', 5: 'd', 14: 'a', 15: 'd' }
  };
  const HOLD = { haunt: { 6: 'Shift', 7: 'Shift', 10: 'Shift' }, boxing: { 1: 's', 6: 's', 7: 's' } };
  const key = (k, up) => dispatchEvent(new KeyboardEvent(up ? 'keyup' : 'keydown', { key: k, bubbles: true }));
  function gameMode() {
    if (typeof S === 'undefined' || !S || S.phase !== 'play' || !S.g || (S.g.sub !== 'play' && S.g.sub !== 'fight')) return null;
    if (S.game === 'sus' && typeof SU !== 'undefined' && !SU.task && !SU.map && !SU.cams) return 'sus';
    if (S.game === 'haunt' && typeof HU !== 'undefined' && !HU.mapOn) return 'haunt';
    if (S.game === 'cars') return 'cars';
    if (S.game === 'boxing' && typeof BX !== 'undefined' && BX.f.some(F => F.id === S.me)) return 'boxing';
    return null;
  }
  // ---- التنقّل بالواجهة ----
  const SEL = 'button,a[href],input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"]),[data-game],.jgh,.jm.go,.jm.tg';
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return null; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0 || cs.pointerEvents === 'none') return null; return r; };
  function cands() {
    const set = new Set(document.querySelectorAll(SEL));
    // عناصر تنضغط بس ما لها وسم معروف (div فيه onclick): نكشفها من شكل الماوس
    document.querySelectorAll('body *').forEach(el => { if (set.has(el) || el.closest('svg') && el.tagName !== 'g') return; if (getComputedStyle(el).cursor === 'pointer' && !(el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer')) set.add(el); });
    const out = [];
    set.forEach(el => {
      if (el.disabled || el.closest('[hidden],[inert]')) return;
      const r = vis(el); if (!r) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx >= 0 && cy >= 0 && cx <= innerWidth && cy <= innerHeight) { const h = document.elementFromPoint(cx, cy); if (h && !(el.contains(h) || h.contains(el) || h.closest('label') === el.closest('label') && h.closest('label'))) return; }
      out.push({ el, r, cx, cy });
    });
    return out;
  }
  function mark(el) {
    if (cur && cur !== el) cur.classList.remove('padf');
    cur = el; if (!el) return;
    el.classList.add('padf');
    if (el.focus && /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName)) { try { el.focus({ preventScroll: true }); } catch {} }
    const r = el.getBoundingClientRect(); curC = [r.left + r.width / 2, r.top + r.height / 2];
    if (r.top < 60 || r.bottom > innerHeight - 20) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function nav(dx, dy) {
    const L = cands(); if (!L.length) return;
    if (!cur || !document.contains(cur) || !vis(cur)) {
      const from = curC || [innerWidth / 2, 0];
      if (!curC) { const top = L.filter(c => c.cy > 0 && c.cy < innerHeight).sort((a, b) => a.cy - b.cy || b.cx - a.cx)[0] || L[0]; return mark(top.el); }
      let b = null, bs = 1e9; L.forEach(c => { const d = Math.hypot(c.cx - from[0], c.cy - from[1]); if (d < bs) { bs = d; b = c; } }); return mark(b.el);
    }
    const r = cur.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    let best = null, bs = 1e9;
    L.forEach(c => {
      if (c.el === cur || cur.contains(c.el) || c.el.contains(cur)) return;
      // نقيس من أطراف المستطيل عشان الأزرار الطويلة ما تلخبط الاتجاه
      const px = dx ? (dx > 0 ? c.r.left - r.right : r.left - c.r.right) : 0, py = dy ? (dy > 0 ? c.r.top - r.bottom : r.top - c.r.bottom) : 0;
      const main = dx ? (c.cx - ox) * dx : (c.cy - oy) * dy; if (main <= 2) return;
      const gap = Math.max(0, dx ? px : py), ortho = dx ? Math.abs(c.cy - oy) : Math.abs(c.cx - ox);
      const overlap = dx ? (c.r.bottom > r.top && c.r.top < r.bottom) : (c.r.right > r.left && c.r.left < r.right);
      const sc = gap + ortho * (overlap ? .3 : 2.2) + main * .15;
      if (sc < bs) { bs = sc; best = c; }
    });
    if (best) mark(best.el); else if (dy) scrollBy({ top: dy * innerHeight * .5, behavior: 'smooth' });
  }
  function press(el) {
    if (!el) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !/^(checkbox|radio|range|button|submit)$/.test(el.type)) { el.focus(); return; }
    if (el instanceof HTMLElement) el.click(); else el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (typeof sfx === 'function') sfx('pop');
  }
  // ---- الحلقة ----
  function pick() { const L = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; return L.find(g => g.mapping === 'standard') || L[0] || null; }
  function frame(t) {
    raf = 0;
    const gp = pick();
    if (!gp) { PAD.on = false; PAD.lx = PAD.ly = PAD.rx = PAD.ry = 0; return; }
    raf = requestAnimationFrame(frame);
    PAD.on = true;
    const B = gp.buttons.map(b => b.pressed || b.value > .5), ax = gp.axes;
    const dl = B[14] ? -1 : B[15] ? 1 : 0, du = B[12] ? -1 : B[13] ? 1 : 0;
    PAD.lx = Math.max(-1, Math.min(1, dz(ax[0] || 0) + dl)); PAD.ly = Math.max(-1, Math.min(1, dz(ax[1] || 0) + du));
    PAD.rx = dz(ax[2] || 0); PAD.ry = dz(ax[3] || 0);
    const down = i => B[i] && !prev[i], up = i => !B[i] && prev[i];
    const mode = gameMode();
    if (mode !== PAD.mode) { if (PAD.mode && HOLD[PAD.mode]) Object.values(HOLD[PAD.mode]).forEach(k => key(k, true)); PAD.mode = mode; if (mode && cur) { cur.classList.remove('padf'); cur = null; } }
    if (mode) {
      const K = KEYS[mode] || {}, Hd = HOLD[mode] || {};
      for (const i in K) if (down(+i)) key(K[i]);
      for (const i in K) if (up(+i)) key(K[i], true);
      for (const i in Hd) { if (down(+i)) key(Hd[i]); if (up(+i)) key(Hd[i], true); }
      if (down(1)) key('Escape');
    } else {
      // اتجاه واحد: أول ضغطة فوراً، وبعدها تكرار لو ماسك
      const sx = Math.abs(PAD.lx) > .55 ? Math.sign(PAD.lx) : 0, sy = Math.abs(PAD.ly) > .55 ? Math.sign(PAD.ly) : 0;
      const d = sy ? [0, sy] : sx ? [sx, 0] : null, dk = d && d.join();
      if (!d) { navDir = null; navN = 0; }
      else if (dk !== navDir || t >= navAt) { nav(d[0], d[1]); navAt = t + (dk !== navDir ? 380 : 140); navDir = dk; navN++; }
      if (down(0)) press(cur && document.contains(cur) ? cur : null) || (!cur && nav(0, 1));
      if (down(1)) key('Escape');
      if (Math.abs(PAD.ry) > .1) scrollBy(0, PAD.ry * 22);
      if (down(4) || down(5)) scrollBy({ top: (down(5) ? 1 : -1) * innerHeight * .7, behavior: 'smooth' });
    }
    prev = B;
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('gamepadconnected', e => {
    start();
    if (!hinted && typeof toast === 'function') { hinted = true; toast('🎮 يد التحكم شغّالة — A يضغط، B يرجع'); }
  });
  addEventListener('gamepaddisconnected', () => { if (!pick() && cur) { cur.classList.remove('padf'); cur = null; } });
  // بعض المتصفحات ما ترسل connected إلا بعد أول ضغطة، فنشيك كل شوي
  setInterval(() => { if (!raf && pick()) start(); }, 1500);
  // لو رجع المستخدم للماوس أو اللمس نخفي الإطار
  addEventListener('pointerdown', () => { if (cur) { cur.classList.remove('padf'); cur = null; curC = null; } }, true);
})();
