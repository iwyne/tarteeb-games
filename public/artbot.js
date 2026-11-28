// الرسام الآلي: التحليل والتخطيط (حساب الضربات) — ملف واحد يشتغل كـ Worker (بالخلفية عشان الصفحة ما تعلّق)
// أو بالصفحة نفسها لو المتصفح ما يدعم. كل شي هنا حسابات على مصفوفات، بدون canvas.
// المدخل: cfg {style, det, mins, W, H, bg, box:[x,y,w,h] مكان الصورة باللوحة, cover} + imgs {key: {w,h,data}}
// المخرج: { acts:[{pts,b,sz,col,L,ph,op,tool,slow,flat,thin}|{pause}], layers:[أسماء], clip }
(function (root) {
  'use strict';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const hex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  const RES = { base: [260, 320, 380], copy: [360, 520, 720], pixel: [40, 64, 96] };

  // أي مقاسات يحتاجها كل أسلوب (الصفحة ترسم الصورة بهالمقاسات وترسلها)
  function needs(cfg) {
    const [, , iw, ih] = cfg.box, d = (cfg.det || 2) - 1, M = Math.max(iw, ih), out = [];
    const sz = R => { const A = Math.min(1, R / M); return [Math.max(8, Math.round(iw * A)), Math.max(8, Math.round(ih * A))]; };
    out.push({ k: 'a', wh: sz(RES.base[d]) });
    if (['copy', 'paint', 'pastel', 'dots'].includes(cfg.style)) out.push({ k: 'c', wh: sz(RES.copy[d]) });
    if (cfg.style === 'pixel') { const [w, h] = sz(RES.pixel[d]); out.push({ k: 'p', wh: [w, h], smooth: true }); }
    return out;
  }

  // ===== أدوات الصور =====
  function boxBlur(src, w, h, r, ch) { // تغبيش سريع (٣ مرات صندوق ≈ غاوسي)، ch قنوات
    if (r < .5) return src.slice ? src.slice() : Float32Array.from(src);
    let a = Float32Array.from(src), b = new Float32Array(a.length); const R = Math.max(1, Math.round(r * .9));
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < h; y++) for (let c = 0; c < ch; c++) { let s = 0; const row = y * w; for (let x = -R; x <= R; x++) s += a[(row + clamp(x, 0, w - 1)) * ch + c];
        for (let x = 0; x < w; x++) { b[(row + x) * ch + c] = s / (2 * R + 1); s += a[(row + clamp(x + R + 1, 0, w - 1)) * ch + c] - a[(row + clamp(x - R, 0, w - 1)) * ch + c]; } }
      for (let x = 0; x < w; x++) for (let c = 0; c < ch; c++) { let s = 0; for (let y = -R; y <= R; y++) s += b[(clamp(y, 0, h - 1) * w + x) * ch + c];
        for (let y = 0; y < h; y++) { a[(y * w + x) * ch + c] = s / (2 * R + 1); s += b[(clamp(y + R + 1, 0, h - 1) * w + x) * ch + c] - b[(clamp(y - R, 0, h - 1) * w + x) * ch + c]; } }
    }
    return a;
  }
  function rgbOf(img) { const n = img.w * img.h, o = new Float32Array(n * 3), d = img.data; for (let i = 0; i < n; i++) { o[i * 3] = d[i * 4]; o[i * 3 + 1] = d[i * 4 + 1]; o[i * 3 + 2] = d[i * 4 + 2]; } return o; }
  function lumOf(rgb, n) { const L = new Float32Array(n); for (let i = 0; i < n; i++) L[i] = (rgb[i * 3] * .3 + rgb[i * 3 + 1] * .59 + rgb[i * 3 + 2] * .11) / 255; return L; }
  function sobel(L, w, h) { const n = w * h, gx = new Float32Array(n), gy = new Float32Array(n), mag = new Float32Array(n);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x;
      gx[i] = (L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1]) - (L[i - w - 1] + 2 * L[i - 1] + L[i + w - 1]);
      gy[i] = (L[i + w - 1] + 2 * L[i + w] + L[i + w + 1]) - (L[i - w - 1] + 2 * L[i - w] + L[i - w + 1]); mag[i] = Math.hypot(gx[i], gy[i]); }
    return { gx, gy, mag };
  }

  // ===== التحليل: الحواف، اتجاه الخطوط، أهمية كل مكان، والبشرة والسما والشعر =====
  function analyse(img) {
    const w = img.w, h = img.h, n = w * h, rgb = rgbOf(img), rgb1 = boxBlur(rgb, w, h, 1, 3), rgb4 = boxBlur(rgb, w, h, 4, 3);
    const L = lumOf(rgb1, n), Lb = lumOf(rgb4, n), { gx, gy, mag } = sobel(L, w, h);
    // اتجاه الخطوط (structure tensor) عشان الضربات تمشي مع الشكل
    let jxx = new Float32Array(n), jyy = new Float32Array(n), jxy = new Float32Array(n);
    for (let i = 0; i < n; i++) { jxx[i] = gx[i] * gx[i]; jyy[i] = gy[i] * gy[i]; jxy[i] = gx[i] * gy[i]; }
    const sr = Math.max(2, Math.round(Math.max(w, h) / 70)); jxx = boxBlur(jxx, w, h, sr, 1); jyy = boxBlur(jyy, w, h, sr, 1); jxy = boxBlur(jxy, w, h, sr, 1);
    const ang = new Float32Array(n), coh = new Float32Array(n);
    for (let i = 0; i < n; i++) { ang[i] = .5 * Math.atan2(2 * jxy[i], jxx[i] - jyy[i]) + Math.PI / 2; const t = jxx[i] + jyy[i]; coh[i] = t > 1e-6 ? Math.hypot(jxx[i] - jyy[i], 2 * jxy[i]) / t : 0; }
    // البشرة (YCbCr)
    const skin = new Uint8Array(n); let sx0 = w, sy0 = h, sx1 = 0, sy1 = 0, sk = 0;
    for (let i = 0; i < n; i++) { const r = rgb4[i * 3], g = rgb4[i * 3 + 1], b = rgb4[i * 3 + 2], Y = .299 * r + .587 * g + .114 * b, cb = 128 - .1687 * r - .3313 * g + .5 * b, cr = 128 + .5 * r - .4187 * g - .0813 * b;
      if (Y > 55 && cr > 136 && cr < 178 && cb > 82 && cb < 130 && r > g) { skin[i] = 1; sk++; const x = i % w, y = (i / w) | 0; if (x < sx0) sx0 = x; if (x > sx1) sx1 = x; if (y < sy0) sy0 = y; if (y > sy1) sy1 = y; } }
    if (sk < n * .01) { skin.fill(0); sk = 0; }
    // السما: من الحافة الفوق، مناطق ناعمة وفاتحة أو زرقا متصلة ببعض
    const sky = new Uint8Array(n), smooth = boxBlur(mag, w, h, 2, 1), q = [];
    const skyOk = i => { const r = rgb4[i * 3], g = rgb4[i * 3 + 1], b = rgb4[i * 3 + 2]; return smooth[i] < .06 && !skin[i] && ((b > r + 8 && b > g - 10 && Lb[i] > .3) || (Lb[i] > .78 && Math.max(r, g, b) - Math.min(r, g, b) < 40)); };
    for (let x = 0; x < w; x++) if (skyOk(x)) { sky[x] = 1; q.push(x); }
    while (q.length) { const i = q.pop(), x = i % w, y = (i / w) | 0; for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !sky[j] && skyOk(j) && Math.abs(Lb[j] - Lb[i]) < .05) { sky[j] = 1; q.push(j); } }
    let skyN = 0; for (let i = 0; i < n; i++) skyN += sky[i]; if (skyN < n * .03) sky.fill(0);
    // الشعر: غامق وفيه خطوط، فوق/حول البشرة
    const hair = new Uint8Array(n), smag = boxBlur(mag, w, h, 2, 1);
    if (sk) { const ex = (sx1 - sx0) * .45, ey = (sy1 - sy0) * .5; for (let y = Math.max(0, sy0 - ey) | 0; y < Math.min(h, sy1); y++) for (let x = Math.max(0, sx0 - ex) | 0; x < Math.min(w, sx1 + ex); x++) { const i = y * w + x; if (!skin[i] && !sky[i] && L[i] < .45 && smag[i] > .08 && coh[i] > .25) hair[i] = 1; } }
    // الأهمية: كثافة الحواف + البشرة (الوجه) + الوسط شوي
    let sal = new Float32Array(n), mx = 0; const em = boxBlur(mag, w, h, Math.max(2, Math.round(Math.max(w, h) / 40)), 1); for (let i = 0; i < n; i++) if (em[i] > mx) mx = em[i];
    let fs = new Float32Array(n); for (let i = 0; i < n; i++) fs[i] = skin[i]; fs = boxBlur(fs, w, h, Math.max(2, Math.round(Math.max(w, h) / 30)), 1);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, cx = (x / w - .5) * 2, cy = (y / h - .45) * 2;
      sal[i] = (em[i] / (mx || 1)) * .55 + Math.min(1, fs[i] * 1.6) * .3 + Math.exp(-(cx * cx + cy * cy) * 1.2) * .15 - (sky[i] ? .3 : 0); }
    sal = boxBlur(sal, w, h, 2, 1); let smx = 0, smn = 9; for (let i = 0; i < n; i++) { if (sal[i] > smx) smx = sal[i]; if (sal[i] < smn) smn = sal[i]; }
    for (let i = 0; i < n; i++) sal[i] = clamp((sal[i] - smn) / ((smx - smn) || 1), 0, 1);
    return { w, h, n, rgb, rgb1, rgb4, L, Lb, gx, gy, mag, ang, coh, skin, sky, hair, sal };
  }

  // ===== أدوات الضربات =====
  function mkTools(cfg, w, h) {
    const [bx, by, bw, bh] = cfg.box, toD = (x, y) => [bx + (x + .5) * bw / w, by + (y + .5) * bh / h], kD = bw / w; // من بكسل التحليل لبكسل اللوحة
    const jit = () => (Math.random() - .5) * .8, at = (x, y) => clamp(y | 0, 0, h - 1) * w + clamp(x | 0, 0, w - 1);
    // الأقرب فالأقرب (مثل اليد ما تقفز)
    const nn = list => { if (list.length < 2) return list; const out = [list.shift()]; while (list.length) { const lp = out[out.length - 1].pts, e = lp[lp.length - 1]; let bi = 0, bd = 1e18, fl = false;
        for (let k = 0; k < list.length; k++) { const p = list[k].pts, d1 = (p[0][0] - e[0]) ** 2 + (p[0][1] - e[1]) ** 2, d2 = (p[p.length - 1][0] - e[0]) ** 2 + (p[p.length - 1][1] - e[1]) ** 2;
          if (d1 < bd) { bd = d1; bi = k; fl = false; } if (d2 < bd && !list[k].keep) { bd = d2; bi = k; fl = true; } }
        const c = list.splice(bi, 1)[0]; if (fl) c.pts.reverse(); out.push(c); } return out; };
    // تعبئة منطقة (mask) بضربات رايح جاي باتجاه معيّن
    const fillMask = (mask, angle, sp, maxRun) => { const ux = Math.cos(angle), uy = Math.sin(angle), vx = -uy, vy = ux, R = Math.hypot(w, h), segs = [];
      for (let t = -R; t <= R; t += sp * (.85 + Math.random() * .3)) { let run = null; for (let u = -R; u <= R; u += 1) { const x = w / 2 + vx * t + ux * u, y = h / 2 + vy * t + uy * u, inside = x >= 0 && y >= 0 && x < w && y < h && mask[at(x, y)];
          if (inside && !run) run = [[x, y]]; else if (inside) run[1] = [x, y]; else if (run) { if (run[1]) segs.push({ a: run[0], b: run[1] }); run = null; } } if (run && run[1]) segs.push({ a: run[0], b: run[1] }); }
      const strokes = []; let cur = null, flip = false;
      for (const sg of segs) { const a = flip ? sg.b : sg.a, b = flip ? sg.a : sg.b;
        if (cur && Math.hypot(a[0] - cur[cur.length - 1][0], a[1] - cur[cur.length - 1][1]) < sp * 2.6 && cur.length < (maxRun || 40)) { cur.push(a, b); flip = !flip; } else { if (cur) strokes.push(cur); cur = [sg.a, sg.b]; flip = true; } }
      if (cur) strokes.push(cur); return strokes; };
    const domAngle = (A, mask) => { let sx = 0, sy = 0; for (let i = 0; i < A.n; i += 2) if (mask[i]) { const a = A.ang[i] * 2, c = A.coh[i] + .05; sx += Math.cos(a) * c; sy += Math.sin(a) * c; } return Math.atan2(sy, sx) / 2; };
    // تتبع الخطوط على قناع حواف (مع اتجاه الحافة)
    const trace = (edge, A, minLen, maxN, seed) => { const used = new Uint8Array(A.n), lines = [];
      for (let y = 1; y < h - 1; y += 1) for (let x = 1; x < w - 1; x += 1) { const i0 = y * w + x; if (!edge[i0] || used[i0] || (seed && !seed[i0])) continue; let line = [[x, y]]; used[i0] = 1;
        for (const dir of [1, -1]) { let cx = x, cy = y, px = null, py = null; const out = [];
          for (let k = 0; k < 400; k++) { let best = -1, bs = -1e9; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { if (!xx && !yy) continue; const nx = cx + xx, ny = cy + yy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = ny * w + nx; if (!edge[j] || used[j]) continue;
              let s = Math.min(1, A.mag[j] * 2) * .4; if (px != null) { const dx = cx - px, dy = cy - py; s += (dx * xx + dy * yy) / Math.hypot(xx, yy) / (Math.hypot(dx, dy) || 1); } else { const a = A.ang[i0]; s += (Math.cos(a) * xx + Math.sin(a) * yy) * dir / Math.hypot(xx, yy); } if (s > bs) { bs = s; best = j; } }
            if (best < 0) break; used[best] = 1; px = cx; py = cy; cx = best % w; cy = (best / w) | 0; out.push([cx, cy]);
            for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const j = at(cx + xx, cy + yy); if (A.mag[j] < A.mag[best] * 1.05) used[j] = 1; } }
          line = dir === 1 ? line.concat(out) : out.reverse().concat(line); }
        if (line.length >= minLen) lines.push(line); if (lines.length >= maxN) return lines; }
      return lines; };
    // تنعيم وتبسيط الخط (عشان يطلع ناعم مو مسنن)
    const smoothLine = (pts, it) => { let p = pts; for (let k = 0; k < (it || 2); k++) p = p.map((q, i) => i === 0 || i === p.length - 1 ? q : [(p[i - 1][0] + q[0] * 2 + p[i + 1][0]) / 4, (p[i - 1][1] + q[1] * 2 + p[i + 1][1]) / 4]); const o = [p[0]]; for (let i = 1; i < p.length; i++) { const l = o[o.length - 1]; if (Math.hypot(p[i][0] - l[0], p[i][1] - l[1]) > 1.2 || i === p.length - 1) o.push(p[i]); } return o; };
    const kmeans = (rgb, n, K, iters, wts) => { // البداية: ألوان متباعدة (عشان ما يدمج الشعر مع القميص مثلاً)
      const smp = []; for (let t = 0; t < 2500; t++) smp.push(Math.floor(Math.random() * n)); const cols = [], dmin = new Float64Array(smp.length).fill(1e12); let cur = smp[0];
      for (let k = 0; k < K; k++) { cols.push([rgb[cur * 3], rgb[cur * 3 + 1], rgb[cur * 3 + 2]]); let bi = 0, bd = -1; smp.forEach((i, j) => { const c = cols[k], d = (rgb[i * 3] - c[0]) ** 2 + (rgb[i * 3 + 1] - c[1]) ** 2 + (rgb[i * 3 + 2] - c[2]) ** 2; if (d < dmin[j]) dmin[j] = d; const sc = dmin[j] * (wts ? wts[i] : 1); if (sc > bd) { bd = sc; bi = i; } }); cur = bi; }
      const lab = new Uint8Array(n);
      for (let it = 0; it < iters; it++) { const sm = cols.map(() => [0, 0, 0, 0]); for (let i = 0; i < n; i++) { let bk = 0, bd = 1e12; for (let k = 0; k < K; k++) { const c = cols[k], d = (rgb[i * 3] - c[0]) ** 2 + (rgb[i * 3 + 1] - c[1]) ** 2 + (rgb[i * 3 + 2] - c[2]) ** 2; if (d < bd) { bd = d; bk = k; } } lab[i] = bk; const q = sm[bk], wt = wts ? wts[i] : 1; q[0] += rgb[i * 3] * wt; q[1] += rgb[i * 3 + 1] * wt; q[2] += rgb[i * 3 + 2] * wt; q[3] += wt; }
        sm.forEach((q, k) => { if (q[3]) cols[k] = [q[0] / q[3], q[1] / q[3], q[2] / q[3]]; }); }
      return { cols, lab }; };
    const modeFilter = (lab, K, it) => { let a = lab; for (let t = 0; t < it; t++) { const b = new Uint8Array(a.length), cnt = new Uint16Array(K); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { cnt.fill(0); let bk = a[y * w + x], bc = 0; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const v = a[at(x + xx, y + yy)]; if (++cnt[v] > bc) { bc = cnt[v]; bk = v; } } b[y * w + x] = bc >= 4 ? bk : a[y * w + x]; } a = b; } return a; };
    const boundary = lab => { const e = new Uint8Array(w * h); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (lab[i] !== lab[i + 1] || lab[i] !== lab[i + w]) e[i] = 1; } return e; };
    // ترقيق الحواف (non-maximum suppression): نخلي بس أعلى نقطة بعرض الحافة عشان الخط يطلع واحد ناعم
    const thin = (edge, A) => { const o = new Uint8Array(A.n); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!edge[i]) continue; const m = A.mag[i]; if (m <= 0) continue;
        const dx = A.gx[i] / m, dy = A.gy[i] / m, a = A.mag[at(x + dx, y + dy)], b = A.mag[at(x - dx, y - dy)]; if (m >= a && m >= b) o[i] = 1; } return o; };
    // حواف مثل Canny: نقاط قوية تبدأ منها الخطوط، وتكمّل على الضعيفة المتصلة فيها (عشان الخط ما يتقطع)
    const canny = (A, frac, salMin) => { const srt = Array.from(A.mag).sort((a, b) => b - a), hi = Math.max(.05, srt[Math.floor(A.n * frac)] || .3), lo = hi * .45, weak = new Uint8Array(A.n);
      for (let i = 0; i < A.n; i++) if (A.mag[i] >= lo && A.sal[i] >= (salMin || 0)) weak[i] = 1; const e = thin(weak, A), seed = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) if (e[i] && A.mag[i] >= hi) seed[i] = 1; return { e, seed }; };
    const D = (pts, j) => pts.map(([x, y]) => toD(x + (j ? jit() : 0), y + (j ? jit() : 0)));
    return { toD, kD, jit, at, nn, fillMask, domAngle, trace, smoothLine, kmeans, modeFilter, boundary, D, thin, canny };
  }

  // ===== رسم تقريبي بالـ JS (عشان نعرف وين باقي فرق بدون canvas) =====
  function rasterStroke(buf, w, h, pts, r, col) {
    const r2 = r * r; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const X0 = Math.max(0, Math.floor(x0 - r)), Y0 = Math.max(0, Math.floor(y0 - r)), X1 = Math.min(w - 1, Math.ceil(x1 + r)), Y1 = Math.min(h - 1, Math.ceil(y1 + r));
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) { let ok = false;
      for (let k = 0; k < pts.length && !ok; k++) { const a = pts[k], b = pts[Math.min(k + 1, pts.length - 1)], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy; let t = L2 ? ((x - a[0]) * dx + (y - a[1]) * dy) / L2 : 0; t = clamp(t, 0, 1); const ex = x - a[0] - dx * t, ey = y - a[1] - dy * t; if (ex * ex + ey * ey <= r2) ok = true; }
      if (ok) { const i = (y * w + x) * 3; buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; } }
  }

  // ===== ضربات «نسخ» (Hertzmann): فرشاة كبيرة لصغيرة، والصغيرة بس وين فيه تفاصيل أو فرق =====
  // opt: {brushes(pi, region)->id, T, minSal, budget, layerOf(pi, i), maxLen, sizeK, bg}
  function hertzmann(img, A, T, opt) {
    const w = img.w, h = img.h, n = w * h, rgb = rgbOf(img), bgc = opt.bg || [255, 255, 255];
    const cur = opt.cur || (() => { const c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = bgc[0]; c[i * 3 + 1] = bgc[1]; c[i * 3 + 2] = bgc[2]; } return c; })();
    // نطابق خرائط التحليل (مقاس ثاني) مع هالمقاس
    const map = (arr, x, y) => arr[clamp(Math.floor(y * A.h / h), 0, A.h - 1) * A.w + clamp(Math.floor(x * A.w / w), 0, A.w - 1)];
    const R0 = opt.r0 || Math.max(w, h) / 22, radii = (opt.radii || [R0, R0 / 2, R0 / 4, R0 / 8, R0 / 14]).filter(r => r >= .9);
    let budget = opt.budget; const acts = [];
    radii.forEach((r, pi) => {
      const ref = boxBlur(rgb, w, h, Math.max(.5, r * .5), 3), L = lumOf(ref, n), last = pi === radii.length - 1;
      const at = (x, y) => clamp(Math.round(y), 0, h - 1) * w + clamp(Math.round(x), 0, w - 1);
      const dif = i => Math.hypot(ref[i * 3] - cur[i * 3], ref[i * 3 + 1] - cur[i * 3 + 1], ref[i * 3 + 2] - cur[i * 3 + 2]);
      const grad = (x, y) => { const i = at(x, y), xi = i % w, yi = (i / w) | 0; if (xi < 1 || yi < 1 || xi >= w - 1 || yi >= h - 1) return [0, 0]; return [(L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1]) - (L[i - w - 1] + 2 * L[i - 1] + L[i + w - 1]), (L[i + w - 1] + 2 * L[i + w] + L[i + w + 1]) - (L[i - w - 1] + 2 * L[i - w] + L[i - w + 1])]; };
      const step = Math.max(1, r), cand = [];
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
        const sal = map(A.sal, x, y); if (pi >= 2 && sal < (opt.minSal || 0) * (pi - 1)) continue; // التفاصيل الصغيرة بس بالأماكن المهمة
        let sum = 0, c = 0, bi = -1, bd = -1; const x1 = Math.min(w, x + step), y1 = Math.min(h, y + step);
        for (let yy = y | 0; yy < y1; yy++) for (let xx = x | 0; xx < x1; xx++) { const i = yy * w + xx, d = dif(i); sum += d; c++; if (d > bd) { bd = d; bi = i; } }
        const thr = pi === 0 && !opt.cur ? 4 : T * (1.15 - sal * .3); // المكان المهم يبي فرق أقل شوي
        if (c && sum / c > thr) cand.push({ i: bi, e: sum / c * (.5 + sal) }); }
      const allow = Math.max(30, Math.floor(budget / (radii.length - pi))); cand.sort((a, b) => b.e - a.e); const pick = cand.slice(0, allow); budget -= pick.length;
      const strokes = [];
      for (const c of pick) { let x = c.i % w, y = (c.i / w) | 0; const i0 = c.i, col = [ref[i0 * 3], ref[i0 * 3 + 1], ref[i0 * 3 + 2]], reg = map(A.sky, x, y) ? 'sky' : map(A.hair, x, y) ? 'hair' : map(A.skin, x, y) ? 'skin' : '';
        const maxLen = reg === 'hair' && pi >= 1 ? 14 : reg === 'sky' ? 10 : (opt.maxLen || [4, 8, 8, 6, 6, 5])[pi] || 6; const pts = [[x, y]]; let ldx = 0, ldy = 0;
        for (let k = 1; k < maxLen; k++) { const [gx, gy] = grad(x, y), gm = Math.hypot(gx, gy); let dx, dy;
          if (gm >= .03 && reg !== 'sky') { dx = -gy / gm; dy = gx / gm; } else if (k === 1) { const a = reg === 'sky' ? (Math.random() - .5) * .3 : map(A.ang, x, y); dx = Math.cos(a); dy = Math.sin(a); } else { dx = ldx; dy = ldy; }
          if (ldx * dx + ldy * dy < 0) { dx = -dx; dy = -dy; } dx = .7 * dx + .3 * ldx; dy = .7 * dy + .3 * ldy; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
          const nx = x + dx * r, ny = y + dy * r; if (nx < 0 || ny < 0 || nx >= w || ny >= h) break; const j = at(nx, ny);
          const dRef = Math.hypot(ref[j * 3] - col[0], ref[j * 3 + 1] - col[1], ref[j * 3 + 2] - col[2]), dCur = Math.hypot(ref[j * 3] - cur[j * 3], ref[j * 3 + 1] - cur[j * 3 + 1], ref[j * 3 + 2] - cur[j * 3 + 2]);
          if (k > 1 && dRef > dCur) break; x = nx; y = ny; ldx = dx; ldy = dy; pts.push([x, y]); }
        if (pts.length === 1) { const [gx, gy] = grad(pts[0][0], pts[0][1]), a = Math.atan2(gy, gx) + Math.PI / 2; pts.push([pts[0][0] + Math.cos(a) * r * .6, pts[0][1] + Math.sin(a) * r * .6]); }
        strokes.push({ pts, col, reg, sal: map(A.sal, pts[0][0], pts[0][1]), q: (col[0] >> 5) * 64 + (col[1] >> 5) * 8 + (col[2] >> 5) }); }
      // نجمع الألوان القريبة، والأقرب فالأقرب
      const groups = new Map(); strokes.forEach(o => { if (!groups.has(o.q)) groups.set(o.q, []); groups.get(o.q).push(o); });
      for (const g of [...groups.values()].sort((a, b) => b.length - a.length)) { let lastP = null; const left = g.slice();
        while (left.length) { let bi = 0; if (lastP) { let bd = 1e18; for (let k = 0; k < left.length; k++) { const p = left[k].pts[0], d = (p[0] - lastP[0]) ** 2 + (p[1] - lastP[1]) ** 2; if (d < bd) { bd = d; bi = k; } } }
          const o = left.splice(bi, 1)[0]; lastP = o.pts[o.pts.length - 1];
          rasterStroke(cur, w, h, o.pts, r, o.col);
          const b = opt.brush(pi, o.reg, last), szK = o.reg === 'sky' ? 1.3 : o.reg === 'hair' && pi >= 2 ? 1.3 : 1;
          acts.push({ pts: o.pts.map(([x, y]) => [x + (Math.random() - .5) * .3, y + (Math.random() - .5) * .3]), b, r: r * 2.1 * szK * (opt.sizeK || 1), col: hex(...o.col.map(v => v + (Math.random() - .5) * 6)), L: opt.layerOf(pi, o, last), ph: 'p' + pi, flat: 1, thin: pi >= 2 && o.sal < .55, slow: pi === 0 ? .7 : 1, w, h }); } } // تفاصيل الأماكن المهمة (الوجه) ما نشيلها حتى لو الجهاز بطيء
      if (!last) acts.push({ pause: 900 + Math.random() * 900 });
    });
    return { acts, cur };
  }
  // نحوّل ضربات من مقاس تحليل للوحة
  const toDoc = (cfg, acts) => { const [bx, by, bw, bh] = cfg.box; return acts.map(a => { if (a.pause) return a; const kx = bw / a.w, ky = bh / a.h; const o = Object.assign({}, a, { pts: a.pts.map(([x, y]) => [bx + (x + .5) * kx, by + (y + .5) * ky]), sz: Math.max(1.5, a.r * kx) }); delete o.w; delete o.h; delete o.r; return o; }); };

  // ===== اللمسات الأخيرة: لمعة، ظل، تحديد خفيف للحواف المهمة =====
  function finalPass(A, T, layer, cfg, strength) {
    const out = [], { w, h } = A, base = Math.max(cfg.box[2], cfg.box[3]);
    // لمعة: أفتح النقاط بالأماكن المهمة (عيون، انعكاسات)
    const hi = []; for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) { const i = y * w + x; if (A.sal[i] < .45 || A.L[i] < .82 || A.L[i] - A.Lb[i] < .1) continue; let mx = true; for (let k of [i - 1, i + 1, i - w, i + w]) if (A.L[k] > A.L[i]) mx = false; if (mx) hi.push({ pts: [[x, y], [x + .5, y + .3]], s: A.L[i] - A.Lb[i] }); }
    hi.sort((a, b) => b.s - a.s); T.nn(hi.slice(0, 40)).forEach(o => out.push({ pts: T.D(o.pts), b: 'round', sz: Math.max(2.5, base / 320), col: '#fffdf6', L: layer, ph: 'hi', slow: 2, op: .9 }));
    // ظل خفيف: الأماكن الغامقة بالأماكن المهمة (نظلل فوقها شفاف)
    const sh = []; for (let y = 3; y < h - 3; y += 3) for (let x = 3; x < w - 3; x += 3) { const i = y * w + x; if (A.sal[i] > .35 && A.Lb[i] < .32 && A.L[i] < .35) { const c = [A.rgb4[i * 3] * .55, A.rgb4[i * 3 + 1] * .5, A.rgb4[i * 3 + 2] * .6]; sh.push({ pts: [[x - 1.5, y], [x + 1.5, y + .5]], col: hex(...c) }); } }
    T.nn(sh.sort(() => Math.random() - .5).slice(0, 50)).forEach(o => out.push({ pts: T.D(o.pts, 1), b: 'soft', sz: base / 30, col: o.col, L: layer, ph: 'sh', op: .22 * strength, slow: .6, thin: 1 }));
    // تحديد الحواف القوية بالأماكن المهمة
    const srt = Array.from(A.mag).sort((a, b) => b - a), thr = srt[Math.floor(A.n * .025)] || 1, edge = new Uint8Array(A.n);
    for (let i = 0; i < A.n; i++) if (A.mag[i] >= thr && A.sal[i] > .5) edge[i] = 1;
    T.nn(T.trace(T.thin(edge, A), A, 5, 120).map(l => ({ pts: T.smoothLine(l) }))).forEach(o => { const m = o.pts[(o.pts.length / 2) | 0], i = T.at(m[0], m[1]); out.push({ pts: T.D(o.pts), b: 'pen', sz: Math.max(1.5, base / 700), col: hex(A.rgb4[i * 3] * .35, A.rgb4[i * 3 + 1] * .32, A.rgb4[i * 3 + 2] * .35), L: layer, ph: 'ed', op: .55 * strength, slow: 1.4 }); });
    return out;
  }
  // تخطيط بالرصاص (خطوط الحواف)
  function sketchLines(A, T, frac, maxN) {
    const c = T.canny(A, frac, .18); // نتجاهل الخلفية الفاضية
    return T.nn(T.trace(c.e, A, 6, maxN, c.seed).map(l => ({ pts: T.smoothLine(l, 1) })).sort((a, b) => a.pts[0][1] - b.pts[0][1]));
  }
  // مناطق ألوان نظيفة (للأنمي والكوميكس والألوان المائية)
  function flatRegions(A, T, K, blurR, satK) {
    let src = boxBlur(A.rgb, A.w, A.h, blurR, 3);
    if (satK) for (let i = 0; i < A.n; i++) { const r = src[i * 3], g = src[i * 3 + 1], b = src[i * 3 + 2], m = (r + g + b) / 3; src[i * 3] = clamp(m + (r - m) * satK, 0, 255); src[i * 3 + 1] = clamp(m + (g - m) * satK, 0, 255); src[i * 3 + 2] = clamp(m + (b - m) * satK, 0, 255); }
    const wts = new Float32Array(A.n); for (let i = 0; i < A.n; i++) wts[i] = .5 + A.sal[i]; // الأماكن المهمة تاخذ ألوان أدق
    const km = T.kmeans(src, A.n, K, 9, wts); km.lab = T.modeFilter(km.lab, K, 6); km.src = src;
    km.area = km.cols.map((_, k) => { let s = 0; for (let i = 0; i < A.n; i++) s += km.lab[i] === k; return s; }); return km;
  }

  // ===== الأساليب =====
  const STYLES = {};
  // نسخ الصورة (واقعي)
  STYLES.copy = (cfg, imgs) => {
    const A = analyse(imgs.a), C = imgs.c, T = mkTools(cfg, A.w, A.h), budget = Math.round(cfg.mins * 60000 / 72);
    const layers = ['الخلفية', 'الشكل', 'التفاصيل', 'لمسات أخيرة'];
    const hz = hertzmann(C, A, 26, { budget: budget * .9, bg: cfg.bgc, minSal: .12, brush: (pi, reg) => reg === 'hair' && pi >= 2 ? 'fur' : 'round',
      layerOf: pi => pi === 0 ? 0 : pi <= 2 ? 1 : 2 }); // الطبقة حسب المرحلة بس (الأصغر دايم فوق الأكبر)
    let acts = toDoc(cfg, hz.acts);
    // دمج البشرة بالتلطيخ (قبل التفاصيل الصغيرة) عشان تطلع ناعمة
    const blend = [], Tc = mkTools(cfg, A.w, A.h);
    for (let y = 2; y < A.h - 2; y += 4) for (let x = 2; x < A.w - 2; x += 4) { const i = y * A.w + x; if (!A.skin[i] || A.mag[i] > .25) continue; const a = A.ang[i], l = 3; blend.push({ pts: [[x - Math.cos(a) * l, y - Math.sin(a) * l], [x + Math.cos(a) * l, y + Math.sin(a) * l]] }); }
    const bl = Tc.nn(blend.sort(() => Math.random() - .5).slice(0, 90)).map(o => ({ pts: Tc.D(o.pts, 1), tool: 'smudge', b: 'soft', sz: Math.max(cfg.box[2], cfg.box[3]) / 55, col: '#000000', L: 1, ph: 'bl', op: .35, slow: .8, flat: 1 }));
    void bl; // جربنا التلطيخ على البشرة وخرّب الملامح، فشلناه
    acts.push({ pause: 1200 }, ...finalPass(A, T, 3, cfg, 1).filter(a => a.ph !== 'ed'));
    return { acts, layers, clip: !cfg.cover };
  };
  // لوحة زيت / باستيل: تخطيط خفيف + نفس فكرة النسخ بفرش زيت أو باستيل (ضربات أوضح)
  const painterly = (kind) => (cfg, imgs) => {
    const A = analyse(imgs.a), T = mkTools(cfg, A.w, A.h), base = Math.max(cfg.box[2], cfg.box[3]), budget = Math.round(cfg.mins * 60000 / (kind === 'paint' ? 85 : 125));
    const acts = [], layers = ['تخطيط', 'الخلفية', 'الألوان', 'التفاصيل', 'لمسات أخيرة'];
    sketchLines(A, T, .09, 220).forEach(o => acts.push({ pts: T.D(o.pts, 1), b: 'hb', sz: Math.max(3, base / 460), col: '#8a8580', L: 0, ph: 'sk', op: .8 }));
    acts.push({ pause: 1600 });
    const oil = kind === 'paint';
    const hz = hertzmann(imgs.c, A, oil ? 32 : 30, { budget: budget * .85, bg: cfg.bgc, minSal: .15, maxLen: oil ? [5, 9, 9, 7, 6] : [8, 12, 12, 10, 8], sizeK: oil ? 1.15 : 1,
      brush: (pi, reg) => oil ? (reg === 'hair' && pi >= 2 ? 'fur' : pi === 0 ? 'gouache' : pi === 1 ? 'oil' : 'round') : (pi <= 1 ? 'pastel' : 'colpen'),
      layerOf: pi => pi === 0 ? 1 : pi <= 2 ? 2 : 3 });
    acts.push(...toDoc(cfg, hz.acts), { pause: 1200 }, ...finalPass(A, T, 4, cfg, oil ? 1 : .7));
    return { acts, layers, clip: !cfg.cover };
  };
  STYLES.paint = painterly('paint'); STYLES.pastel = painterly('pastel');

  // نقاط (Pointillism): نقط ملونة من كبير لصغير، الصغيرة بالأماكن المهمة، والألوان تتغير شوي
  STYLES.dots = (cfg, imgs) => {
    const A = analyse(imgs.a), T = mkTools(cfg, A.w, A.h), C = imgs.c, w = C.w, h = C.h, rgb = boxBlur(rgbOf(C), w, h, 1.5, 3), base = Math.max(cfg.box[2], cfg.box[3]);
    const acts = [], budget = Math.round(cfg.mins * 60000 / 48), R0 = Math.max(w, h) / 40, radii = [R0, R0 * .6, R0 * .38, R0 * .25].filter(r => r >= 1); let left = budget;
    const sh = c => { const v = (Math.random() - .5) * 34, t = (Math.random() - .5) * 18; return [c[0] + v + t, c[1] + v, c[2] + v - t]; };
    radii.forEach((r, pi) => { const dots = [];
      for (let y = r * .5; y < h; y += r * .9) for (let x = r * .5 + (Math.random() - .5) * r; x < w; x += r * .9) { const ax = x + (Math.random() - .5) * r * .6, ay = y + (Math.random() - .5) * r * .6, i = clamp(ay | 0, 0, h - 1) * w + clamp(ax | 0, 0, w - 1), s = A.sal[clamp(Math.floor(ay * A.h / h), 0, A.h - 1) * A.w + clamp(Math.floor(ax * A.w / w), 0, A.w - 1)];
        if (pi >= 1 && s < pi * .22) continue; const c = sh([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]); dots.push({ pts: [[ax, ay], [ax + .25, ay + .15]], col: c, q: (clamp(c[0], 0, 255) >> 5) * 64 + (clamp(c[1], 0, 255) >> 5) * 8 + (clamp(c[2], 0, 255) >> 5) }); }
      const take = Math.min(dots.length, Math.floor(left / (radii.length - pi))); left -= take; const pick = dots.sort(() => Math.random() - .5).slice(0, take);
      const g = new Map(); pick.forEach(o => { if (!g.has(o.q)) g.set(o.q, []); g.get(o.q).push(o); });
      [...g.values()].forEach(list => T.nn(list.map(o => ({ pts: o.pts, col: o.col }))).forEach(o => acts.push({ pts: o.pts, col: hex(...o.col), b: 'round', r: r * 1.5, L: pi === 0 ? 0 : 1, ph: 'd' + pi, flat: 1, thin: pi >= 1, slow: .5, w, h })));
      acts.push({ pause: 800 }); });
    return { acts: toDoc(cfg, acts).concat(finalPass(A, T, 2, cfg, .6)), layers: ['النقط الكبيرة', 'النقط الصغيرة', 'لمسات أخيرة'], clip: !cfg.cover };
  };

  // أنمي: مناطق ألوان نظيفة + ظل واحد حاد + نور + خط نظيف
  STYLES.anime = (cfg, imgs) => {
    const A = analyse(imgs.a), T = mkTools(cfg, A.w, A.h), base = Math.max(cfg.box[2], cfg.box[3]), acts = [], d = cfg.det || 2;
    sketchLines(A, T, .08, 200).forEach(o => acts.push({ pts: T.D(o.pts, 1), b: 'hb', sz: Math.max(3, base / 480), col: '#a8a2a0', L: 0, ph: 'sk', op: .7 }));
    acts.push({ pause: 1400 });
    const km = flatRegions(A, T, 5 + d * 2, 2, 1.15), order = km.cols.map((_, k) => k).filter(k => km.area[k] > A.n * .002).sort((a, b) => km.area[b] - km.area[a]);
    for (const k of order) { const m = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) m[i] = km.lab[i] === k; const c = km.cols[k], sp = Math.max(2, Math.min(7, Math.sqrt(km.area[k]) / 10));
      T.nn(T.fillMask(m, T.domAngle(A, m), sp).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).forEach(o => acts.push({ pts: o.pts, b: 'round', sz: sp * T.kD * 2.6, col: hex(...c), L: 1, ph: 'c' + k, flat: 1 }));
      // الظل: الجزء الغامق من نفس المنطقة، بلون أغمق ومائل للبنفسجي
      const s = new Uint8Array(A.n); let mean = 0, cnt = 0; for (let i = 0; i < A.n; i++) if (m[i]) { mean += A.Lb[i]; cnt++; } mean /= cnt || 1; let sc = 0;
      for (let i = 0; i < A.n; i++) if (m[i] && A.Lb[i] < mean - .06) { s[i] = 1; sc++; }
      if (sc > A.n * .002) { const sm = T.modeFilter(s, 2, 2); T.nn(T.fillMask(sm, T.domAngle(A, sm) + .6, Math.max(2, sp * .8)).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).forEach(o => acts.push({ pts: o.pts, b: 'round', sz: sp * T.kD * 2.2, col: hex(c[0] * .72, c[1] * .66, c[2] * .8), L: 2, ph: 's' + k, flat: 1 })); }
      if (Math.random() < .3) acts.push({ pause: 500 + Math.random() * 600 }); }
    // نور
    const hl = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) if (A.L[i] > .78 && A.L[i] - A.Lb[i] > .06 && A.sal[i] > .3) hl[i] = 1;
    void hl;
    // الخط: حدود المناطق + الحواف القوية، ناعمة وواضحة
    const ed = T.boundary(km.lab), cn = T.canny(A, .06, .1); for (let i = 0; i < A.n; i++) if (cn.e[i]) ed[i] = 1;
    acts.push({ pause: 1000 });
    T.nn(T.trace(ed, A, 8, 400).map(l => ({ pts: T.smoothLine(l, 3) }))).forEach(o => acts.push({ pts: T.D(o.pts), b: 'ink', sz: Math.max(3, base / 240), col: '#1d1a1f', L: 3, ph: 'ln', slow: 1.3 }));
    acts.push(...finalPass(A, T, 4, cfg, .5).filter(a => a.ph === 'hi'));
    return { acts, layers: ['تخطيط', 'الألوان', 'الظل والنور', 'الخطوط', 'لمعة'], clip: false };
  };
  // ألوان وحبر: مناطق ألوان (ماركر) + حبر
  STYLES.color = (cfg, imgs) => {
    const A = analyse(imgs.a), T = mkTools(cfg, A.w, A.h), base = Math.max(cfg.box[2], cfg.box[3]), acts = [], d = cfg.det || 2;
    const sk = sketchLines(A, T, .1, 300); sk.forEach(o => acts.push({ pts: T.D(o.pts, 1), b: 'hb', sz: Math.max(3, base / 480), col: '#8a8a8a', L: 0, ph: 'sk', op: .8 })); acts.push({ pause: 1500 });
    const km = flatRegions(A, T, [8, 14, 22][d - 1], 1, 0), order = km.cols.map((_, k) => k).filter(k => km.area[k] > A.n * .002).sort((a, b) => km.area[b] - km.area[a]);
    for (const k of order) { const m = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) m[i] = km.lab[i] === k; const sp = Math.max(2.2, Math.min(9, Math.sqrt(km.area[k]) / 9));
      T.nn(T.fillMask(m, T.domAngle(A, m), sp).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).forEach(o => acts.push({ pts: o.pts, b: 'round', sz: sp * T.kD * 2.5, col: hex(...km.cols[k]), L: 1, ph: 'c' + k, flat: 1 })); }
    acts.push({ pause: 1200 }); sk.forEach(o => acts.push({ pts: o.pts.map(p => T.toD(p[0], p[1])), b: 'ink', sz: Math.max(3, base / 320), col: '#1c1a18', L: 2, ph: 'ln', slow: 1.3 }));
    acts.push(...finalPass(A, T, 3, cfg, .6).filter(a => a.ph !== 'ed'));
    return { acts, layers: ['تخطيط', 'الألوان', 'الحبر', 'لمسات أخيرة'], clip: false };
  };
  // ألوان مائية: من الفاتح للغامق، حواف مبلولة، والأبيض يبقى ورق
  STYLES.water = (cfg, imgs) => {
    const A = analyse(imgs.a), T = mkTools(cfg, A.w, A.h), base = Math.max(cfg.box[2], cfg.box[3]), acts = [], d = cfg.det || 2;
    sketchLines(A, T, .07, 160).forEach(o => acts.push({ pts: T.D(o.pts, 1), b: 'hb', sz: Math.max(2.5, base / 520), col: '#b0aaa0', L: 0, ph: 'sk', op: .6 })); acts.push({ pause: 1500 });
    const km = flatRegions(A, T, [6, 9, 12][d - 1], 3, 1.05), lum = c => (c[0] * .3 + c[1] * .59 + c[2] * .11) / 255;
    const order = km.cols.map((_, k) => k).filter(k => km.area[k] > A.n * .003 && lum(km.cols[k]) < .93).sort((a, b) => lum(km.cols[b]) - lum(km.cols[a])); // الفاتح أول
    const bnd = T.boundary(km.lab);
    for (const k of order) { const m = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) m[i] = km.lab[i] === k; const c = km.cols[k], sp = Math.max(3, Math.min(11, Math.sqrt(km.area[k]) / 8));
      T.nn(T.fillMask(m, T.domAngle(A, m), sp, 24).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).forEach(o => acts.push({ pts: o.pts, b: 'wsoft', sz: sp * T.kD * 3.4, col: hex(...c), L: 1, ph: 'w' + k }));
      // الحافة المبلولة: لون أغمق شوي على حدود المنطقة
      const e = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) if (m[i] && bnd[i]) e[i] = 1;
      T.nn(T.trace(e, A, 6, 40).map(l => ({ pts: T.smoothLine(l, 2) }))).forEach(o => acts.push({ pts: T.D(o.pts, 1), b: 'wwet', sz: Math.max(4, base / 160), col: hex(c[0] * .8, c[1] * .78, c[2] * .82), L: 2, ph: 'we' + k, op: .45, slow: .8 }));
      acts.push({ pause: 900 + Math.random() * 900 }); } // يستنى ينشف
    // طبقة ثانية للظل
    const s = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) if (A.Lb[i] < .35) s[i] = 1;
    T.nn(T.fillMask(T.modeFilter(s, 2, 2), .7, 4, 20).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).forEach(o => { const m = o.pts[0], i = T.at((m[0] - cfg.box[0]) / T.kD, (m[1] - cfg.box[1]) / T.kD); acts.push({ pts: o.pts, b: 'wsoft', sz: 4 * T.kD * 3, col: hex(A.rgb4[i * 3] * .6, A.rgb4[i * 3 + 1] * .58, A.rgb4[i * 3 + 2] * .65), L: 2, ph: 'ws', op: .7 }); });
    sketchLines(A, T, .04, 120).forEach(o => acts.push({ pts: T.D(o.pts), b: 'wink', sz: Math.max(2, base / 600), col: '#3b3530', L: 3, ph: 'ln', slow: 1.3, op: .8 }));
    return { acts, layers: ['تخطيط', 'الغسلات', 'الطبقة الثانية', 'خطوط'], clip: false };
  };
  // رصاص: تخطيط ثم تظليل بخطوط مع اتجاه الشكل
  STYLES.sketch = (cfg, imgs) => {
    const A = analyse(imgs.a), T = mkTools(cfg, A.w, A.h), base = Math.max(cfg.box[2], cfg.box[3]), acts = [], d = cfg.det || 2;
    const sk = sketchLines(A, T, .1, 320); sk.forEach(o => acts.push({ pts: T.D(o.pts, 1), b: 'hb', sz: Math.max(3, base / 380), col: '#2a2a2a', L: 0, ph: 'sk' })); acts.push({ pause: 1500 });
    const lv = [.62, .45, .3, .18].slice(0, 2 + d);
    lv.forEach((t, k) => { const m = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) m[i] = A.Lb[i] < t - (1 - A.sal[i]) * .18 && !A.sky[i];
      const ang = k % 2 ? -.8 : T.domAngle(A, m) + .4; T.nn(T.fillMask(T.modeFilter(m, 2, 1), ang, 2.6 + k * .2, 30).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).forEach(o => acts.push({ pts: o.pts, b: 'hb', sz: base / (k > 1 ? 220 : 260), col: k > 1 ? '#1e1e1e' : '#3a3a3a', L: 1, ph: 'h' + k, op: .75, thin: k > 1 ? 1 : 0 }));
      acts.push({ pause: 700 }); });
    sk.filter((_, i) => i % 2 === 0).forEach(o => acts.push({ pts: o.pts.map(p => T.toD(p[0], p[1])), b: '6b', sz: Math.max(3, base / 320), col: '#141414', L: 2, ph: 'ln' }));
    return { acts, layers: ['تخطيط', 'تظليل', 'خطوط غامقة'], clip: false };
  };
  // فحم: كتل غامقة، تلطيخ بالإصبع، تحديد قوي، ونرفع النور بالممحاة
  STYLES.charcoal = (cfg, imgs) => {
    const A = analyse(imgs.a), T = mkTools(cfg, A.w, A.h), base = Math.max(cfg.box[2], cfg.box[3]), acts = [], d = cfg.det || 2;
    sketchLines(A, T, .07, 160).forEach(o => acts.push({ pts: T.D(o.pts, 1), b: 'coal', sz: Math.max(4, base / 300), col: '#3a3633', L: 0, ph: 'sk', op: .6 })); acts.push({ pause: 1300 });
    [.55, .38, .22].forEach((t, k) => { const m = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) m[i] = A.Lb[i] < t - (1 - A.sal[i]) * .15;
      T.nn(T.fillMask(T.modeFilter(m, 2, 2), T.domAngle(A, m) + k * .5, 3.5 - k * .5, 26).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).forEach(o => acts.push({ pts: o.pts, b: 'coal', sz: base / (120 + k * 40), col: '#1a1816', L: 0, ph: 'm' + k, op: .55 + k * .15 })); acts.push({ pause: 700 }); });
    // تلطيخ مع اتجاه الشكل
    const bl = []; for (let y = 3; y < A.h - 3; y += 5) for (let x = 3; x < A.w - 3; x += 5) { const i = y * A.w + x; if (A.Lb[i] > .7 || A.mag[i] > .4) continue; const a = A.ang[i]; bl.push({ pts: [[x - Math.cos(a) * 4, y - Math.sin(a) * 4], [x + Math.cos(a) * 4, y + Math.sin(a) * 4]] }); }
    T.nn(bl.sort(() => Math.random() - .5).slice(0, 220)).forEach(o => acts.push({ pts: T.D(o.pts, 1), tool: 'smudge', b: 'soft', sz: base / 26, col: '#000000', L: 0, ph: 'bl', op: .6, slow: .7, flat: 1, thin: 1 }));
    acts.push({ pause: 900 });
    // نرفع النور بالممحاة
    const hl = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) if (A.Lb[i] > .72) hl[i] = 1;
    T.nn(T.fillMask(T.modeFilter(hl, 2, 2), -.5, 4, 16).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).slice(0, 160).forEach(o => acts.push({ pts: o.pts, tool: 'eraser', b: 'soft', sz: base / 70, col: '#000000', L: 0, ph: 'er', op: .5 }));
    sketchLines(A, T, .03 + d * .01, 160).forEach(o => acts.push({ pts: T.D(o.pts), b: 'coal', sz: Math.max(4, base / 220), col: '#0e0d0c', L: 1, ph: 'ln', slow: 1.2 }));
    return { acts, layers: ['الفحم', 'التحديد'], clip: false };
  };
  // كوميكس: ألوان مسطحة مشبعة + حبر عريض + تظليل خطوط (ومتقاطع بالغامق)
  STYLES.comic = (cfg, imgs) => {
    const A = analyse(imgs.a), T = mkTools(cfg, A.w, A.h), base = Math.max(cfg.box[2], cfg.box[3]), acts = [], d = cfg.det || 2;
    sketchLines(A, T, .07, 180).forEach(o => acts.push({ pts: T.D(o.pts, 1), b: 'sk', sz: Math.max(3, base / 520), col: '#6fa8dc', L: 0, ph: 'sk', op: .6 })); acts.push({ pause: 1300 });
    const km = flatRegions(A, T, 4 + d * 2, 2.5, 1.35), order = km.cols.map((_, k) => k).filter(k => km.area[k] > A.n * .002).sort((a, b) => km.area[b] - km.area[a]);
    for (const k of order) { const m = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) m[i] = km.lab[i] === k; const sp = Math.max(2.4, Math.min(8, Math.sqrt(km.area[k]) / 10)), c = km.cols[k];
      T.nn(T.fillMask(m, 0, sp).filter(p => p.length > 1).map(p => ({ pts: T.D(p, 1) }))).forEach(o => acts.push({ pts: o.pts, b: 'round', sz: sp * T.kD * 2.6, col: hex(...c), L: 1, ph: 'c' + k, flat: 1 })); }
    acts.push({ pause: 1000 });
    // تظليل: خطوط مائلة بالظل، ومتقاطعة بالأغمق
    [[.42, .8], [.26, -.8]].forEach(([t, ang], k) => { const m = new Uint8Array(A.n); for (let i = 0; i < A.n; i++) m[i] = A.Lb[i] < t && !A.sky[i];
      T.nn(T.fillMask(T.modeFilter(m, 2, 2), ang, 3.2, 1).map(p => p.slice(0, 2)).filter(p => p.length > 1).map(p => ({ pts: T.D(p) }))).forEach(o => acts.push({ pts: o.pts, b: 'pen', sz: Math.max(2, base / 520), col: '#141214', L: 2, ph: 'x' + k, slow: .5, op: .9, thin: k })); });
    const ed = T.boundary(km.lab), cn = T.canny(A, .06, .1); for (let i = 0; i < A.n; i++) if (cn.e[i]) ed[i] = 1;
    T.nn(T.trace(ed, A, 6, 500).map(l => ({ pts: T.smoothLine(l, 2) }))).forEach(o => acts.push({ pts: T.D(o.pts), b: 'brushpen', sz: Math.max(4, base / 190), col: '#0c0b0d', L: 3, ph: 'ln', slow: 1.2 }));
    return { acts, layers: ['تخطيط أزرق', 'الألوان', 'التظليل', 'الحبر'], clip: false };
  };
  // بكسل آرت: الصورة على شبكة مربعات بألوان قليلة، صف صف
  STYLES.pixel = (cfg, imgs) => {
    const P = imgs.p, w = P.w, h = P.h, n = w * h, rgb = rgbOf(P), d = cfg.det || 2, [bx, by, bw, bh] = cfg.box, cw = bw / w, ch = bh / h;
    const T = mkTools(cfg, w, h), km = T.kmeans(rgb, n, [10, 16, 24][d - 1], 10), acts = [];
    const order = km.cols.map((_, k) => k).sort((a, b) => { const l = c => c[0] * .3 + c[1] * .59 + c[2] * .11; return l(km.cols[b]) - l(km.cols[a]); });
    for (const k of order) { const runs = [];
      for (let y = 0; y < h; y++) { let x0 = -1; for (let x = 0; x <= w; x++) { const on = x < w && km.lab[y * w + x] === k; if (on && x0 < 0) x0 = x; if (!on && x0 >= 0) { runs.push({ pts: [[bx + (x0 + .3) * cw, by + (y + .5) * ch], [bx + (x - .3) * cw + .01, by + (y + .5) * ch]], keep: 1 }); /* نمد شوي عشان ما يبقى فراغ بين المربعات */ x0 = -1; } } }
      if (!runs.length) continue; const c = km.cols[k];
      runs.forEach(o => acts.push({ pts: o.pts, b: 'pixel', sz: Math.max(cw, ch) * 1.2, col: hex(...c), L: 0, ph: 'px' + k, flat: 1, slow: .6, px: 1 })); acts.push({ pause: 400 }); }
    return { acts, layers: ['بكسل'], clip: false, pixel: [cw, ch] };
  };

  // ===== زيد تفاصيل هنا: ضربات صغيرة بمنطقة وحدة (نقارن الصورة باللي مرسوم الحين) =====
  function refine(cfg, imgs) {
    const tgt = imgs.t, cur = imgs.cur, w = tgt.w, h = tgt.h, A = analyse(tgt), c = rgbOf(cur);
    const hz = hertzmann(tgt, A, 16, { cur: c, budget: Math.round(140 * (cfg.det || 2)), radii: [Math.max(w, h) / 24, Math.max(w, h) / 48, Math.max(w, h) / 90], minSal: 0,
      brush: () => 'round', layerOf: () => cfg.layer || 0 });
    return { acts: toDoc(cfg, hz.acts.filter(a => !a.pause)) };
  }

  function plan(cfg, imgs) { const f = STYLES[cfg.style] || STYLES.copy, r = f(cfg, imgs); r.acts = r.acts.filter(a => a.pause || (a.pts && a.pts.length > 1 && a.pts.every(p => isFinite(p[0]) && isFinite(p[1])))); return r; }
  const API = { needs, plan, refine, styles: Object.keys(STYLES) };
  root.ATBOT = API;
  // كـ Worker: نستقبل الطلب ونرد بالخطة
  if (typeof window === 'undefined' && typeof self !== 'undefined' && typeof importScripts === 'function') {
    self.onmessage = e => { const m = e.data; try { const r = m.k === 'refine' ? refine(m.cfg, m.imgs) : plan(m.cfg, m.imgs); self.postMessage({ id: m.id, ok: true, r }); } catch (err) { self.postMessage({ id: m.id, ok: false, err: String(err && err.stack || err) }); } };
  }
})(typeof self !== 'undefined' ? self : this);
