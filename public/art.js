// ================= مرسم ترتيب — استوديو رسم مثل بروكريت =================
// اللوحة ١٦٠٠×١٢٠٠ بطبقات (كل طبقة كانفس). الفرش «ختم» يتكرر على طول الخط (رأس الفرشاة + تباعد + ضغط القلم).
// كل ضربة تنرسم أول بـ «مخزن الضربة» وبعدين تنضاف للطبقة بشفافية الفرشاة (مثل بروكريت ما تتراكم داخل نفس الضربة).
// للتسريع: بعد كل تعديل نرسل لقطة صغيرة ٤٨٠×٣٦٠ للسيرفر، ولما تضغط «انتهيت» نرسل الرسمة كاملة.
const AT = {
  W: 1600, H: 1200, on: false, layers: [], cur: 0, bg: '#ffffff', tool: 'brush', bt: { brush: 'ink', eraser: 'round', smudge: 'soft' }, color: '#1d1d1f', hist: [],
  size: { brush: 14, eraser: 40, smudge: 40, liq: 160 }, op: { brush: 1, eraser: 1, smudge: .7, grad: 1, liq: .6 }, pc: 1, rope: 0, guide: 'none', assist: true, gridSz: 80, stream: {}, sym: 'none', qs: true,
  view: { z: 1, r: 0, x: 0, y: 0 }, undo: [], redo: [], mem: 0, dirty: true, capT: 0, fc: 0, ui: true
};
const atMk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const AT_BLEND = [['source-over', 'عادي'], ['multiply', 'ضرب'], ['screen', 'شاشة'], ['overlay', 'تراكب'], ['soft-light', 'إضاءة ناعمة'], ['hard-light', 'إضاءة قوية'], ['color-dodge', 'تفتيح لوني'], ['color-burn', 'حرق لوني'], ['darken', 'أغمق'], ['lighten', 'أفتح'], ['difference', 'اختلاف'], ['lighter', 'إضافة'], ['hue', 'الدرجة'], ['saturation', 'التشبع'], ['color', 'اللون'], ['luminosity', 'الإضاءة']];
const AT_CATS = [['sketch', 'رسم'], ['ink', 'حبر'], ['paint', 'تلوين'], ['water', 'مائي'], ['oil', 'زيت'], ['char', 'فحم وطباشير'], ['spray', 'بخاخ'], ['neon', 'نيون']];
// الفرش: tip رأس الفرشاة، sp التباعد، flow قوة الختم، szP/opP تأثير الضغط على الحجم/الشفافية، min أصغر حجم، jit تذبذب الحجم، sc تشتت، rot اتجاه الرأس، st التنعيم، taper تدبيب البداية
const AT_BR = [
  { id: 'hb', c: 'sketch', n: 'رصاص HB', grain: 1, tip: 'pencil', sp: .1, flow: .45, szP: .4, opP: .9, min: .5, rot: 'rand', st: .15, def: 5 },
  { id: '6b', c: 'sketch', n: 'رصاص 6B', grain: 1, tip: 'pencil', sp: .08, flow: .75, szP: .5, opP: .8, min: .4, rot: 'rand', st: .15, def: 12 },
  { id: 'sk', c: 'sketch', n: 'قلم تخطيط', tip: 'hard', sp: .06, flow: 1, szP: .6, opP: .2, min: .3, st: .35, def: 6 },
  { id: 'tech', c: 'sketch', n: 'قلم فني', tip: 'hard', sp: .05, flow: 1, szP: 0, opP: 0, st: .5, def: 4 },
  { id: 'ink', c: 'ink', n: 'حبر ستوديو', tip: 'hard', sp: .04, flow: 1, szP: .9, opP: 0, min: .12, st: .6, taper: 40, def: 14 },
  { id: 'gel', c: 'ink', n: 'حبر جاف', tip: 'round', sp: .05, flow: .95, szP: .5, opP: .2, min: .4, st: .45, def: 9 },
  { id: 'cal', c: 'ink', n: 'خط عربي', tip: 'flat', sp: .03, flow: 1, szP: .5, opP: 0, min: .4, rot: 'fixed', ang: -.8, st: .5, def: 26 },
  { id: 'brushpen', c: 'ink', n: 'فرشاة حبر', tip: 'round', sp: .04, flow: 1, szP: 1, opP: .1, min: .05, st: .55, taper: 60, def: 30 },
  { id: 'soft', c: 'paint', n: 'فرشاة ناعمة', tip: 'soft', sp: .08, flow: .14, szP: .2, opP: .7, min: .6, st: .2, def: 140 },
  { id: 'round', c: 'paint', n: 'فرشاة مستديرة', tip: 'round', sp: .06, flow: .85, szP: .35, opP: .3, min: .5, st: .3, def: 40 },
  { id: 'marker', c: 'paint', n: 'ماركر', tip: 'round', sp: .05, flow: 1, szP: .15, opP: 0, min: .8, st: .3, def: 24, glaze: .6 },
  { id: 'flat', c: 'paint', n: 'فرشاة مسطحة', tip: 'flat', sp: .04, flow: .9, szP: .3, opP: .3, min: .6, rot: 'dir', st: .3, def: 44 },
  { id: 'wsoft', c: 'water', wet: 1, n: 'مائي ناعم', tip: 'water', sp: .03, flow: .06, szP: .3, opP: .6, min: .6, jit: .15, rot: 'rand', st: .25, def: 90 },
  { id: 'wwet', c: 'water', wet: 1, n: 'مائي مبلول', tip: 'water', sp: .035, flow: .1, szP: .4, opP: .5, min: .5, jit: .25, sc: .08, rot: 'rand', st: .2, def: 70 },
  { id: 'wash', c: 'water', wet: 1, n: 'غسيل', tip: 'soft', sp: .1, flow: .05, szP: .2, opP: .5, min: .7, st: .2, def: 240 },
  { id: 'oil', c: 'oil', n: 'زيت', tip: 'bristle', sp: .035, flow: .9, szP: .3, opP: .3, min: .6, rot: 'dir', st: .3, def: 44 },
  { id: 'acr', c: 'oil', n: 'أكريليك', tip: 'bristle', sp: .05, flow: .7, szP: .35, opP: .4, min: .5, jit: .12, rot: 'dir', st: .25, def: 36 },
  { id: 'coal', c: 'char', n: 'فحم', grain: 1, tip: 'charcoal', sp: .07, flow: .6, szP: .4, opP: .6, min: .5, sc: .12, rot: 'rand', st: .15, def: 28 },
  { id: 'chalk', c: 'char', n: 'طباشير', grain: 1, tip: 'chalk', sp: .08, flow: .85, szP: .3, opP: .5, min: .6, rot: 'rand', st: .15, def: 30 },
  { id: 'pastel', c: 'char', n: 'باستيل', grain: 1, tip: 'chalk', sp: .06, flow: .45, szP: .3, opP: .6, min: .6, jit: .2, rot: 'rand', st: .15, def: 48 },
  { id: 'air', c: 'spray', n: 'بخاخ ناعم', tip: 'spray', dots: 26, sp: .12, flow: .9, szP: .2, opP: .6, min: .6, st: .1, def: 90 },
  { id: 'mist', c: 'spray', n: 'رذاذ', tip: 'spray', dots: 7, big: 1, sp: .2, flow: 1, szP: .2, opP: .4, min: .7, st: .1, def: 130 },
  { id: 'splat', c: 'spray', n: 'بقع', tip: 'hard', sp: .9, flow: .95, szP: .2, opP: .2, jit: .8, sc: 1.4, st: .05, def: 26 },
  { id: 'neon', c: 'neon', n: 'نيون', tip: 'glow', sp: .04, flow: .9, szP: .3, opP: .2, min: .6, st: .5, def: 26 },
  { id: 'light', c: 'neon', n: 'ضوء', tip: 'soft', sp: .07, flow: .22, szP: .3, opP: .6, min: .6, st: .3, def: 120, add: 1 }
];
const AT_PAL = ['#000000', '#3a3a3c', '#8e8e93', '#ffffff', '#1d1d1f', '#e63946', '#ff6b6b', '#f4a261', '#f4d35e', '#ffe8a3', '#2a9d8f', '#52b788', '#1b4332', '#264653', '#3d7bff', '#8ecae6', '#5e3c99', '#b5179e', '#ff66c4', '#8a5a2b', '#c79a5b', '#f1d3b3', '#e0ac69', '#8d5524', '#5a1a12', '#a3231b', '#d9a441', '#6b2f1a', '#2f6b3c', '#c9a23a', '#87ceeb', '#ffd6e0'];
const atBr = id => { const b = (AT.custom || []).find(x => x.id === id) || AT_BR.find(x => x.id === id) || AT_BR[4]; return AT.bover && AT.bover[b.id] ? Object.assign({}, b, AT.bover[b.id]) : b; };
const atHasFilter = (() => { let v; return () => v != null ? v : (v = (() => { try { const t = atMk(2, 2).getContext('2d'); t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; } catch { return false; } })()); })();
// حبيبات الورق (ثابتة على اللوحة مثل بروكريت)
function atGrain(g) {
  if (!AT.grainCv) { const N = 256, c = atMk(N, N), x = c.getContext('2d'), id = x.createImageData(N, N); const v = new Float32Array(N * N).map(() => Math.random());
    for (let i = 0; i < N * N; i++) { const a = v[i] * .5 + (v[(i + 1) % (N * N)] + v[(i + N) % (N * N)]) * .25; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = 70 + a * 185; }
    x.putImageData(id, 0, 0); AT.grainCv = c; }
  return g.createPattern(AT.grainCv, 'repeat');
}
const atHost = () => !!(S && S.players.some(p => p.h && p.id === S.me));
const atCurB = () => AT.bt[AT.tool in AT.bt ? AT.tool : 'brush'];
const atNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const atClamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ===== رؤوس الفرش (أقنعة بيضاء ١٢٨) =====
const AT_TIP = {};
function atTip(kind) {
  if (AT_TIP[kind]) return AT_TIP[kind];
  const N = 128, c = atMk(N, N), g = c.getContext('2d'), h = N / 2;
  const rad = (stops) => { const gr = g.createRadialGradient(h, h, 0, h, h, h); stops.forEach(([o, a]) => gr.addColorStop(o, `rgba(255,255,255,${a})`)); g.fillStyle = gr; g.fillRect(0, 0, N, N); };
  const noise = (dens, r0, fall) => { const id = g.createImageData(N, N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = Math.hypot(x - h, y - h) / h; if (d > 1) continue; const k = (y * N + x) * 4; const a = Math.random() < dens ? (1 - Math.pow(d, fall)) * (r0 + Math.random() * (1 - r0)) : 0; id.data[k] = id.data[k + 1] = id.data[k + 2] = 255; id.data[k + 3] = a * 255; } g.putImageData(id, 0, 0); };
  if (kind === 'hard') { g.fillStyle = '#fff'; g.beginPath(); g.arc(h, h, h - 1, 0, 7); g.fill(); }
  else if (kind === 'round') rad([[0, 1], [.82, 1], [1, 0]]);
  else if (kind === 'soft' || kind === 'glow') rad([[0, 1], [.35, .55], [.7, .15], [1, 0]]);
  else if (kind === 'pencil') noise(.55, .3, 3);
  else if (kind === 'charcoal') { noise(.45, .2, 1.5); g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, rr = h * (.7 + Math.random() * .3); g.lineTo(h + Math.cos(a) * rr, h + Math.sin(a) * rr); } g.fill(); }
  else if (kind === 'chalk') noise(.38, .5, 6);
  else if (kind === 'water') { rad([[0, .55], [.7, .6], [.9, .45], [1, 0]]); g.globalCompositeOperation = 'destination-in'; const id = g.getImageData(0, 0, N, N); for (let k = 3; k < id.data.length; k += 4) id.data[k] *= .75 + Math.random() * .25; g.putImageData(id, 0, 0); }
  else if (kind === 'flat') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(h, h, h - 2, h * .22, 0, 0, 7); g.fill(); }
  else if (kind === 'bristle') { g.fillStyle = '#fff'; for (let i = 0; i < 26; i++) { const y = 8 + Math.random() * (N - 16), w = 3 + Math.random() * 5; g.globalAlpha = .5 + Math.random() * .5; g.beginPath(); g.ellipse(h + (Math.random() - .5) * 18, y, w * 1.6, w * .6, 0, 0, 7); g.fill(); } }
  else rad([[0, 1], [1, 0]]);
  return AT_TIP[kind] = c;
}
// رأس ملوّن (كاش حسب الرأس واللون)
const AT_CT = new Map();
function atCTip(kind, col) {
  const k = kind + col; let c = AT_CT.get(k); if (c) return c;
  if (AT_CT.size > 60) AT_CT.clear();
  c = atMk(128, 128); const g = c.getContext('2d');
  if (kind === 'glow') { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#fff'); gr.addColorStop(.18, '#fff'); gr.addColorStop(.3, col); gr.addColorStop(.6, col + '66'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  else { g.drawImage(atTip(kind), 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 128, 128); }
  AT_CT.set(k, c); return c;
}

// ===== الطبقات =====
function atLayer(name) { const cv = atMk(AT.W, AT.H); return { id: Math.random().toString(36).slice(2, 8), name, cv, g: cv.getContext('2d', { willReadFrequently: false }), op: 1, vis: true, blend: 'source-over', clip: false, lock: false }; }
const atL = () => AT.layers[AT.cur];
// اللي نرسم عليه: الطبقة نفسها، أو قناعها لو تعدّل القناع
function atTgt() { const l = atL(); if (!l) return null; if (l.mEdit && l.mask) return { g: l.mg, cv: l.mask, lock: false, vis: l.vis, isMask: true, l }; return l; }
function atAddMask(l) { l.mask = atMk(AT.W, AT.H); l.mg = l.mask.getContext('2d'); l.mg.fillStyle = '#fff'; l.mg.fillRect(0, 0, AT.W, AT.H); l.mEdit = true; }
// ندمج الطبقات بكانفس (ونقدر نبدّل طبقة بنسخة حيّة وقت الرسم)
function atCompose(t, sub, from = 0, to = AT.layers.length, bg = true, inGrp = false) {
  const g = t.getContext('2d'); g.save(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  if (bg) { g.fillStyle = AT.bg; g.fillRect(0, 0, AT.W, AT.H); } else g.clearRect(0, 0, AT.W, AT.H);
  // وضع التحريك: كل طبقة إطار، نعرض الإطار الحالي والإطارات اللي جنبه شفافة (البصل)
  if (AT.anim && AT.anim.on && from === 0 && to === AT.layers.length && !inGrp && bg) {
    const cur = AT.anim.play != null ? AT.anim.play : AT.cur, fr = i => { const l = AT.layers[i]; return sub && sub.l === l && !sub.mask ? sub.cv : l.cv; };
    if (!AT.anim.clean && AT.anim.play == null && AT.anim.onion) for (let k = AT.anim.onion; k >= 1; k--) [[cur - k, '#e63946'], [cur + k, '#2a9d8f']].forEach(([i, c]) => { if (i < 0 || i >= AT.layers.length) return; const m = AT.tmp4.getContext('2d'); m.save(); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.clearRect(0, 0, AT.W, AT.H); m.drawImage(fr(i), 0, 0); m.globalCompositeOperation = 'source-atop'; m.globalAlpha = .5; m.fillStyle = c; m.fillRect(0, 0, AT.W, AT.H); m.restore(); g.globalAlpha = .28 / k; g.drawImage(AT.tmp4, 0, 0); });
    g.globalAlpha = 1; g.drawImage(fr(cur), 0, 0); g.restore(); return;
  }
  // مصدر الطبقة: (النسخة الحية وقت الرسم) × القناع لو فيه
  const src = l => {
    const base = sub && sub.l === l && !sub.mask ? sub.cv : l.cv, mk = l.mask && l.mOn !== false ? (sub && sub.l === l && sub.mask ? sub.cv : l.mask) : null;
    if (!mk) return base; const m = AT.tmp4.getContext('2d'); m.save(); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.clearRect(0, 0, AT.W, AT.H); m.drawImage(base, 0, 0); m.globalCompositeOperation = 'destination-in'; m.drawImage(mk, 0, 0); m.restore(); return AT.tmp4;
  };
  for (let i = from; i < to; i++) {
    const l = AT.layers[i];
    if (!inGrp && l.grp && AT.groups[l.grp]) { // مجموعة: ندمج طبقاتها لحالها وبعدين نحطها بشفافيتها
      let j = i; while (j < to && AT.layers[j].grp === l.grp) j++;
      const G = AT.groups[l.grp]; if (G.vis) { const gc = AT.tmp5; atCompose(gc, sub, i, j, false, true); g.globalAlpha = G.op; g.globalCompositeOperation = 'source-over'; g.drawImage(gc, 0, 0); }
      i = j - 1; continue;
    }
    if (l.clip && i > from) continue; if (!l.vis) { while (i + 1 < to && AT.layers[i + 1].clip) i++; continue; }
    const grp = []; for (let j = i + 1; j < to && AT.layers[j].clip; j++) grp.push(AT.layers[j]);
    if (!grp.length) { g.globalAlpha = l.op; g.globalCompositeOperation = l.blend; g.drawImage(src(l), 0, 0); continue; }
    const tg = AT.tmp.getContext('2d'); tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1; tg.clearRect(0, 0, AT.W, AT.H); tg.drawImage(src(l), 0, 0);
    grp.forEach(c => { if (!c.vis) return; tg.globalCompositeOperation = 'source-atop'; tg.globalAlpha = c.op; tg.drawImage(src(c), 0, 0); });
    g.globalAlpha = l.op; g.globalCompositeOperation = l.blend; g.drawImage(AT.tmp, 0, 0);
  }
  g.restore();
}
function atRecomp() { AT.dirty = true; AT.needComp = true; }

// ===== التراجع =====
const AT_MEMMAX = matchMedia('(pointer:coarse)').matches ? 90e6 : 260e6;
function atPush(e) {
  AT.undo.push(e); AT.redo = []; AT.mem += e.mem || 0;
  while (AT.mem > AT_MEMMAX && AT.undo.length > 1) { const x = AT.undo.shift(); AT.mem -= x.mem || 0; }
  atSaveSoon(); atCapSoon(); atUIUndo(); atCollabSnap();
}
function atPatch(l, x, y, w, h) {
  x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y)); w = Math.min(AT.W - x, Math.ceil(w)); h = Math.min(AT.H - y, Math.ceil(h));
  if (w <= 0 || h <= 0) return null; return { x, y, w, h, d: l.g.getImageData(x, y, w, h) };
}
function atPxEntry(l, before) { if (!before) return null; const after = l.g.getImageData(before.x, before.y, before.w, before.h); return { t: 'px', l, b: before, a: after, mem: before.w * before.h * 8 }; }
// صورة للطبقات (للتراجع عن تغيير ترتيبها أو خصائصها)
const atStruct = () => ({ layers: AT.layers.slice(), props: AT.layers.map(l => ({ op: l.op, vis: l.vis, blend: l.blend, clip: l.clip, lock: l.lock, name: l.name, mask: l.mask || null, mg: l.mg || null, mEdit: !!l.mEdit, mOn: l.mOn, grp: l.grp || null })), cur: AT.cur, bg: AT.bg, groups: JSON.parse(JSON.stringify(AT.groups || {})) });
function atApplyStruct(s) { AT.layers = s.layers.slice(); s.props.forEach((p, i) => Object.assign(AT.layers[i], p)); AT.cur = atClamp(s.cur, 0, AT.layers.length - 1); AT.bg = s.bg; if (s.groups) AT.groups = JSON.parse(JSON.stringify(s.groups)); }
function atStructDo(fn) { const b = atStruct(); fn(); atPush({ t: 'st', b, a: atStruct(), mem: 1000 }); atRecomp(); atLayersUI(); }
function atUndo(redo) {
  const from = redo ? AT.redo : AT.undo, to = redo ? AT.undo : AT.redo; const e = from.pop(); if (!e) return atToast(redo ? 'ما فيه شي ترجعه' : 'ما فيه شي تتراجع عنه');
  if (AT.fl) atFloatCancel(true);
  if (e.t === 'px') e.l.g.putImageData(redo ? e.a : e.b.d, e.b.x, e.b.y);
  else if (e.t === 'st') atApplyStruct(redo ? e.a : e.b);
  else if (e.t === 'combo') (redo ? e.list : e.list.slice().reverse()).forEach(x => { if (x.t === 'px') x.l.g.putImageData(redo ? x.a : x.b.d, x.b.x, x.b.y); else atApplyStruct(redo ? x.a : x.b); });
  to.push(e); atRecomp(); atLayersUI(); atUIUndo(); atSaveSoon(); atCapSoon(); atCollabSnap(); atToast(redo ? 'إعادة' : 'تراجع', 600);
}

// ===== البناء =====
function atBuild(host) {
  AT.on = true; AT.ready = false; AT.groups = {}; AT.layers = []; AT.undo = []; AT.redo = []; AT.mem = 0; AT.cur = 0; AT.fc = 0; AT.done = false; AT.sel = null; AT.fl = null; AT.ref = null;
  try { const s = JSON.parse(localStorage.getItem('tart-prefs') || '{}'); if (s.bt) Object.assign(AT.bt, s.bt); if (s.color) AT.color = s.color; if (s.hist) AT.hist = s.hist; if (s.size) Object.assign(AT.size, s.size); if (s.stream) AT.stream = s.stream; if (s.pc) AT.pc = s.pc; if (s.rope != null) AT.rope = s.rope; if (s.bover) AT.bover = s.bover; if (s.custom) AT.custom = s.custom; if (s.imgPal) AT.imgPal = s.imgPal; if (s.color2) AT.color2 = s.color2; } catch {}
  const I = atIcon;
  host.innerHTML = `<div class="atstudio" id="atStudio">
    <canvas id="atCv" class="atcv"></canvas>
    <div class="attop" id="atTop">
      <div class="atgrp">
        <button class="atib" data-a="menu" title="القائمة">${I('menu')}</button>
        <button class="atib" data-a="adjust" title="تعديلات">${I('wand')}</button>
        <button class="atib" data-a="select" title="تحديد">${I('sel')}</button>
        <button class="atib" data-a="transform" title="تحويل (V)">${I('move')}</button>
        <button class="atib" data-a="image" title="أضف صورة">${I('img')}</button>
      </div>
      <div class="atmid" id="atMid"></div>
      <div class="atgrp">
        <button class="atib" data-t="brush" title="فرشاة (B)">${I('brush')}</button>
        <button class="atib" data-t="smudge" title="تلطيخ (S)">${I('smudge')}</button>
        <button class="atib" data-t="eraser" title="ممحاة (E)">${I('erase')}</button>
        <button class="atib" data-t="fill" title="تعبئة (G)">${I('fill')}</button>
        <button class="atib" data-t="grad" title="تدرّج (D)">${I('grad')}</button>
        <button class="atib" data-a="layers" title="الطبقات">${I('layers')}</button>
        <button class="atcol" data-a="color" id="atColBtn" title="اللون"></button>
      </div>
    </div>
    <div class="atside" id="atSide">
      <div class="atsl" id="atSize" data-k="size"><i></i></div>
      <button class="atsq" id="atDrop" title="قطّارة (اضغط وبعدين المس اللوحة)"></button>
      <div class="atsl" id="atOp" data-k="op"><i></i></div>
      <button class="atib sm" data-a="undo" title="تراجع">${I('undo')}</button>
      <button class="atib sm" data-a="redo" title="إعادة">${I('redo')}</button>
    </div>
    <div class="atbub" id="atBub" hidden></div>
    <div class="atpop" id="atPop" hidden></div>
    <div class="atselbar" id="atSelBar" hidden></div>
    <div class="atdone"><button class="atfin" id="atFin">انتهيت</button></div>
    <div class="attoast" id="atToast"></div>
    <div class="atwait" id="atWait" hidden></div>
  </div>`;
  const cv = AT.cv = document.getElementById('atCv'); AT.vg = cv.getContext('2d');
  atBindUI(); atBindInput(cv); atResize(); atUIColor(); atUITool(); atUIUndo(); atUISliders();
  if (!AT.loop) AT.loop = requestAnimationFrame(atFrame);
  atRestore().then(ok => { if (S.g.collab) { if (!ok) atInitDoc(1600, 1200, atCollabLayers()); else atCollabFix(); send({ t: 'aneed' }); } else if (!ok) atSizeUI(); });
}
// ===== الرسم الجماعي: كل لاعب له طبقة، نرسل ضرباتنا لايف ولقطة طبقتنا بعد كل تعديل =====
const atCollab = () => !!(S && S.g && S.g.collab && !S.spec);
const atNoCollab = () => { if (atCollab()) { atToast('بالرسم الجماعي كل واحد له طبقة وحدة'); return true; } return false; };
const atMine = () => AT.layers.findIndex(l => l.owner === S.me);
function atCollabLayers() { const ids = S.players.filter(p => !p.bot).map(p => p.id); return ids.map(id => { const p = S.players.find(q => q.id === id), l = atLayer(p ? p.name : 'لاعب'); l.owner = id; return l; }); }
function atCollabFix() { // بعد الرجوع: نتأكد كل لاعب له طبقة ونختار طبقتي
  S.players.filter(p => !p.bot).forEach(p => { if (!AT.layers.some(l => l.owner === p.id)) { const l = atLayer(p.name); l.owner = p.id; AT.layers.push(l); } });
  AT.cur = Math.max(0, atMine()); atRecomp();
}
const AT_RS = {}; // ضربات الباقين
function atCollabRecv(m) {
  if (!AT.ready || !S.g || !S.g.collab) return;
  let l = AT.layers.find(x => x.owner === m.from); if (!l) { if (AT.layers.length >= 30) return; l = atLayer(m.n || 'لاعب'); l.owner = m.from; AT.layers.push(l); }
  if (m.k === 'lyr') { const im = new Image(); im.onload = () => { l.g.save(); l.g.globalCompositeOperation = 'copy'; l.g.drawImage(im, 0, 0, AT.W, AT.H); l.g.restore(); delete AT_RS[m.from]; atRecomp(); atThumbSoon(); }; im.src = m.d; return; }
  const d = m.d || {};
  if (d.k === 's') AT_RS[m.from] = { b: d.b, sz: d.sz, col: d.col, tool: d.tool, last: null, rem: 0, lp: 1, sym: d.sym };
  const R = AT_RS[m.from]; if (!R) return;
  if (d.k === 'p') { const g = l.g, save = AT.sym; AT.sym = R.sym || 'none'; g.save(); g.globalCompositeOperation = R.tool === 'eraser' ? 'destination-out' : 'source-over';
    for (const [x, y, p] of d.pts) { if (!R.last) { R.last = [x, y]; atStamp(g, R.b, x, y, p, 0, R.col, R.sz, null); continue; }
      const [lx, ly] = R.last, dx = x - lx, dy = y - ly, dd = Math.hypot(dx, dy), step = Math.max(.6, R.sz * (R.b.sp || .1)), dir = Math.atan2(dy, dx); let t = R.rem || step;
      while (t <= dd) { const f = t / dd; atStamp(g, R.b, lx + dx * f, ly + dy * f, R.lp + (p - R.lp) * f, dir, R.col, R.sz, null); t += step; } R.rem = t - dd; R.last = [x, y]; R.lp = p; }
    g.restore(); AT.sym = save; atRecomp(); }
  if (d.k === 'e') delete AT_RS[m.from];
}
let AT_CQ = [], AT_CQT = 0, AT_LYT = 0;
function atCollabSend(k, x) { if (!S.g || !S.g.collab || S.spec) return;
  if (k === 'p') { AT_CQ.push(x); if (!AT_CQT) AT_CQT = setTimeout(() => { AT_CQT = 0; if (AT_CQ.length) send({ t: 'ast', d: { k: 'p', pts: AT_CQ.splice(0) } }); }, 45); return; }
  if (k === 'e') { clearTimeout(AT_CQT); AT_CQT = 0; if (AT_CQ.length) send({ t: 'ast', d: { k: 'p', pts: AT_CQ.splice(0) } }); send({ t: 'ast', d: { k: 'e' } }); return; }
  send({ t: 'ast', d: x });
}
function atCollabSnap() { if (!S.g || !S.g.collab || S.spec || !AT.ready) return; clearTimeout(AT_LYT); AT_LYT = setTimeout(async () => { const i = atMine(); if (i < 0) return; const b = await new Promise(ok => AT.layers[i].cv.toBlob(x => x && x.type === 'image/webp' ? ok(x) : AT.layers[i].cv.toBlob(ok, 'image/png'), 'image/webp', .92)); send({ t: 'alyr', d: await atB64(b) }); }, 900); }
// ===== البث: الرسام يرسل صورة لايف للي يتابعونه، والتشجيع يطلع عنده =====
let AT_LVT = 0;
function atLiveSoon() { if (!S.g || !(S.g.wc > 0) || S.spec || AT.done) return; if (AT_LVT) return; AT_LVT = setTimeout(async () => { AT_LVT = 0; if (!AT.ready) return; const k = 960 / Math.max(AT.W, AT.H), c = AT.lvc && AT.lvc.width === Math.round(AT.W * k) ? AT.lvc : (AT.lvc = atMk(Math.round(AT.W * k), Math.round(AT.H * k))); c.getContext('2d').drawImage(AT.comp, 0, 0, c.width, c.height); const b = await atEnc(c, .8); if (b && b.size < 330e3) send({ t: 'alv', d: await atB64(b) }); }, 650); }
function atCheerShow(m) {
  const host = document.getElementById('atStudio') || document.getElementById('atSpec'); if (!host) return;
  const d = document.createElement('div'); d.className = 'atcheer'; d.style.left = (20 + Math.random() * 60) + '%';
  d.innerHTML = (typeof rcChar === 'function' ? rcChar(['hmd', 'abu', 'umm', 'jad'][Math.random() * 4 | 0], m.e, 64) : '') + `<small>${esc(m.from)}</small>`;
  host.appendChild(d); setTimeout(() => d.remove(), 2600); try { sfx('pop'); } catch {}
}
// مقاس اللوحة (أول ما تبدأ)
const AT_SIZES = [['عرضي', 1600, 1200], ['مربع', 1600, 1600], ['طولي (جوال)', 1200, 1800], ['شاشة عريضة', 1920, 1080], ['A4 طولي', 1654, 2339], ['دقة عالية', 2560, 1920]];
function atSizeUI() {
  const w = document.getElementById('atWait'), mob = matchMedia('(pointer:coarse)').matches && innerHeight > innerWidth; w.hidden = false; w.dataset.sig = ''; AT.sizing = true;
  let sel = mob ? 2 : 0;
  const draw = () => { w.innerHTML = `<div class="atwbox atsizes"><b>مقاس اللوحة</b><small>تقدر تكبّر وتصغّر وتدوّر بعدين، المقاس يحدد الدقة</small>
    <div class="atszs">${AT_SIZES.map(([n, a, b], i) => `<button data-z="${i}" class="${i === sel ? 'on' : ''}"><i style="aspect-ratio:${a}/${b}"></i><b>${n}</b><small dir="ltr">${a}×${b}</small></button>`).join('')}</div>
    <div class="atcustom">مقاس خاص <input id="atCW" type="number" min="300" max="3000" value="${AT_SIZES[sel][1]}" dir="ltr"> × <input id="atCH" type="number" min="300" max="3000" value="${AT_SIZES[sel][2]}" dir="ltr"></div>
    <button class="atbtn ok" id="atGo">ابدأ الرسم</button></div>`;
    w.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { sel = +b.dataset.z; draw(); });
    document.getElementById('atGo').onclick = () => { const W = atClamp(+document.getElementById('atCW').value || 1600, 300, 3000), H = atClamp(+document.getElementById('atCH').value || 1200, 300, 3000); w.hidden = true; AT.sizing = false; atInitDoc(W, H); };
  };
  draw();
}
function atInitDoc(W, H, layers) {
  AT.W = W; AT.H = H;
  ['comp', 'tmp', 'tmp2', 'tmp4', 'tmp5', 'sb', 'live', 'below', 'above'].forEach(k => AT[k] = atMk(W, H)); AT.groups = AT.groups || {}; AT.snap = null; AT.frm = null;
  const budget = matchMedia('(pointer:coarse)').matches ? 260e6 : 700e6; AT.maxL = atClamp(Math.floor(budget / (W * H * 4)) - 8, 4, 30);
  AT.layers = layers || [atLayer('طبقة ١'), atLayer('طبقة ٢')]; AT.cur = atClamp(AT.cur || 1, 0, AT.layers.length - 1);
  AT.ready = true; atFit(); atRecomp(); atUIUndo(); atCapSoon();
}
// أيقونات خطية بسيطة
function atIcon(k) {
  const P = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', wand: '<path d="M4 20L15 9"/><path d="M14 4v3M18 6l-2 2M20 10h-3M12 6l2 2"/>', sel: '<path d="M7 4c-3 2-4 7-1 10s9 3 11 0-1-9-6-10"/><path d="M9 19l2 2"/>',
    move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
    brush: '<path d="M4 20c2.5 0 4.5-1.2 4.5-4l9-9.5 3 3-9.5 9c-3 0-4.5 1.5-4.5 4"/>', smudge: '<path d="M9 21v-8.5a1.8 1.8 0 013.6 0V11a1.8 1.8 0 013.6 0v1.5a1.8 1.8 0 013.6 0V17a5 5 0 01-5 5h-2a5 5 0 01-3.8-1.8L5 16.5a1.6 1.6 0 012.4-2L9 16"/>',
    erase: '<path d="M4 16.5l8.5-8.5 6 6-5 5H8z"/><path d="M13.5 19.5H21"/>', fill: '<path d="M5 11.5L12 4.5l7 7-7 7z"/><path d="M5 11.5h14"/><path d="M20 15.5s2 2.2 2 3.6a2 2 0 01-4 0c0-1.4 2-3.6 2-3.6z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>',
    drop: '<path d="M14 4l6 6-2 2-6-6z"/><path d="M12 6l-8 8v4h4l8-8"/>', grad: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 14l10-10M8 20l12-12M14 20l6-6"/>', img: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', play: '<path d="M7 4l13 8-13 8z"/>', down: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${P[k] || ''}</svg>`;
}

// ===== العرض (الكاميرا) =====
function atResize() {
  const cv = AT.cv; if (!cv) return; const d = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect();
  AT.dpr = d; AT.vw = r.width; AT.vh = r.height; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); AT.dirty = true;
}
function atFit() { const m = AT.vw < 700 ? 16 : 70; AT.view = { f: AT.view && AT.view.f, z: Math.min((AT.vw - m * 2) / AT.W, (AT.vh - m * 2 - 56) / AT.H), r: 0, x: 0, y: 22 }; AT.dirty = true; }
function atToDoc(sx, sy) { const v = AT.view, dx = sx - AT.vw / 2 - v.x, dy = sy - AT.vh / 2 - v.y, c = Math.cos(-v.r), s = Math.sin(-v.r); const x = (dx * c - dy * s) / v.z; return [(v.f ? -x : x) + AT.W / 2, (dx * s + dy * c) / v.z + AT.H / 2]; }
function atToScr(x, y) { const v = AT.view, dx = (x - AT.W / 2) * v.z * (v.f ? -1 : 1), dy = (y - AT.H / 2) * v.z, c = Math.cos(v.r), s = Math.sin(v.r); return [dx * c - dy * s + AT.vw / 2 + v.x, dx * s + dy * c + AT.vh / 2 + v.y]; }
function atFrame() {
  AT.loop = 0;
  if (!document.getElementById('atStudio')) { AT.on = false; return; }
  AT.loop = requestAnimationFrame(atFrame);
  if (!AT.ready) { if (AT.vg) { AT.vg.setTransform(1, 0, 0, 1, 0, 0); AT.vg.fillStyle = '#2b2c33'; AT.vg.fillRect(0, 0, AT.cv.width, AT.cv.height); } return; }
  if (AT.needComp && !AT.stroke) { atCompose(AT.comp, AT.fl ? { l: AT.fl.l, cv: AT.live } : null); AT.needComp = false; AT.dirty = true; }
  if (!AT.dirty) return; AT.dirty = false; atLiveSoon();
  const g = AT.vg, v = AT.view, d = AT.dpr;
  g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#2b2c33'; g.fillRect(0, 0, AT.vw, AT.vh);
  g.save(); g.translate(AT.vw / 2 + v.x, AT.vh / 2 + v.y); g.rotate(v.r); g.scale(v.f ? -v.z : v.z, v.z); g.translate(-AT.W / 2, -AT.H / 2);
  { const o = 5 / v.z; g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(o, o * 1.6, AT.W, AT.H); } g.fillStyle = '#fff'; g.fillRect(0, 0, AT.W, AT.H); // ظل خفيف بدون blur (الـ blur كل فريم يثقّل)
  g.imageSmoothingEnabled = v.z < 2; g.imageSmoothingQuality = 'high';
  g.drawImage(AT.comp, 0, 0);
  // التحويل: الصورة الطايرة
  if (AT.fl) { const f = AT.fl; g.save(); g.translate(f.x, f.y); g.rotate(f.r); g.scale(f.s * (f.fx ? -1 : 1), f.s * (f.fy ? -1 : 1)); g.globalAlpha = f.l.op; g.drawImage(f.cv, -f.cv.width / 2, -f.cv.height / 2); g.restore(); }
  // التحديد (خط متقطع يمشي)
  if (AT.sel && !AT.fl && AT.selOv) g.drawImage(AT.selOv, 0, 0);
  if (AT.lasso && AT.lasso.pts.length > 1) { g.save(); g.lineWidth = 1.5 / v.z; g.setLineDash([5 / v.z, 4 / v.z]); g.strokeStyle = '#3d7bff'; g.beginPath(); AT.lasso.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (AT.lasso.rect) { const [a, b] = AT.lasso.pts, c = AT.lasso.pts[AT.lasso.pts.length - 1]; g.beginPath(); g.rect(a[0], a[1], c[0] - a[0], c[1] - a[1]); } g.stroke(); g.restore(); }
  // الشبكة والمنظور
  if (AT.guide === 'grid') { g.save(); g.strokeStyle = 'rgba(61,123,255,.28)'; g.lineWidth = 1 / v.z; g.beginPath(); for (let x = AT.gridSz; x < AT.W; x += AT.gridSz) { g.moveTo(x, 0); g.lineTo(x, AT.H); } for (let y = AT.gridSz; y < AT.H; y += AT.gridSz) { g.moveTo(0, y); g.lineTo(AT.W, y); } g.stroke(); g.restore(); }
  if (AT.guide === 'persp1' || AT.guide === 'persp2') {
    const vps = (AT.vp || atVpDef()).slice(0, AT.guide === 'persp1' ? 1 : 2); g.save(); g.lineWidth = 1 / v.z; g.strokeStyle = 'rgba(61,123,255,.3)'; g.beginPath();
    vps.forEach(([vx, vy]) => { for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; g.moveTo(vx, vy); g.lineTo(vx + Math.cos(a) * 6000, vy + Math.sin(a) * 6000); } });
    g.stroke(); g.strokeStyle = 'rgba(230,57,70,.6)'; g.lineWidth = 2 / v.z; g.beginPath(); g.moveTo(-6000, vps[0][1]); g.lineTo(6000, vps[vps.length - 1][1]); g.stroke();
    vps.forEach(([vx, vy]) => { g.fillStyle = '#3d7bff'; g.beginPath(); g.arc(vx, vy, 9 / v.z, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2 / v.z; g.stroke(); });
    g.restore();
  }
  if (AT.ropeLn) { g.save(); g.strokeStyle = 'rgba(61,123,255,.8)'; g.lineWidth = 1.5 / v.z; g.setLineDash([4 / v.z, 3 / v.z]); g.beginPath(); g.moveTo(...AT.ropeLn[0]); g.lineTo(...AT.ropeLn[1]); g.stroke(); g.restore(); }
  // خطوط التناظر
  if (AT.sym !== 'none') { g.save(); g.strokeStyle = 'rgba(61,123,255,.7)'; g.lineWidth = 1.5 / v.z; g.setLineDash([8 / v.z, 6 / v.z]); g.beginPath(); const cx = AT.W / 2, cy = AT.H / 2;
    if (AT.sym === 'v' || AT.sym === 'quad') { g.moveTo(cx, 0); g.lineTo(cx, AT.H); } if (AT.sym === 'h' || AT.sym === 'quad') { g.moveTo(0, cy); g.lineTo(AT.W, cy); }
    if (AT.sym === 'radial') for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 2000, cy + Math.sin(a) * 2000); }
    g.stroke(); g.restore(); }
  g.restore();
  // مقابض التحويل
  if (AT.fl) atFloatHandles(g);
  // عدسة القطّارة (ضغط مطوّل)
  if (AT.loupe) { const [x, y] = AT.loupe.s, ly = y - 90; g.save(); g.lineWidth = 16; g.strokeStyle = AT.loupe.c; g.beginPath(); g.arc(x, ly, 40, 0, Math.PI); g.stroke(); g.strokeStyle = AT.color; g.beginPath(); g.arc(x, ly, 40, Math.PI, Math.PI * 2); g.stroke(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.beginPath(); g.arc(x, ly, 49, 0, 7); g.stroke(); g.beginPath(); g.arc(x, ly, 31, 0, 7); g.stroke(); g.restore(); }
  // دائرة حجم الفرشاة (بالماوس)
  if (AT.hover && !AT.stroke && ['brush', 'eraser', 'smudge', 'liq'].includes(AT.tool) && !AT.pickMode) { const r = AT.size[AT.tool] * v.z / 2; if (r > 2) { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(AT.hover[0], AT.hover[1], r, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(AT.hover[0], AT.hover[1], r + 1, 0, 7); g.stroke(); } }
}

// ===== الرسم (محرك الختم) =====
function atSymPts(x, y) {
  const cx = AT.W / 2, cy = AT.H / 2, s = AT.sym, o = [[x, y, 0, 1]];
  if (s === 'v' || s === 'quad') o.push([2 * cx - x, y, 0, -1]);
  if (s === 'h' || s === 'quad') o.push([x, 2 * cy - y, 0, -1]);
  if (s === 'quad') o.push([2 * cx - x, 2 * cy - y, Math.PI, 1]);
  if (s === 'radial') for (let i = 1; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), dx = x - cx, dy = y - cy; o.push([cx + dx * c - dy * sn, cy + dx * sn + dy * c, a, 1]); }
  return o;
}
function atStamp(g, b, x, y, p, dir, col, sz, box) {
  const prs = b.szP ? 1 - b.szP + b.szP * ((b.min || 0) + (1 - (b.min || 0)) * p) : 1;
  let s = sz * prs * (b.jit ? 1 + (Math.random() - .5) * 2 * b.jit : 1); if (s < .4) s = .4;
  const a = b.flow * (b.opP ? 1 - b.opP + b.opP * p : 1);
  if (b.sc) { x += (Math.random() - .5) * 2 * b.sc * sz; y += (Math.random() - .5) * 2 * b.sc * sz; }
  const ang = b.rot === 'rand' ? Math.random() * 6.283 : b.rot === 'dir' ? dir : b.rot === 'fixed' ? b.ang : 0;
  for (const [px, py, ra, mir] of atSymPts(x, y)) {
    const aa = (b.rot === 'dir' || b.rot === 'fixed') ? (mir < 0 ? -ang : ang) + ra : ang;
    if (b.tip === 'spray') {
      g.fillStyle = col; g.globalAlpha = Math.min(1, a); const n = Math.max(2, Math.round(b.dots * (s / 60 + .4)));
      for (let i = 0; i < n; i++) { const r = Math.sqrt(Math.random()) * s / 2, t = Math.random() * 6.283, d = (b.big ? 1.2 + Math.random() * 3.2 : .6 + Math.random() * 1.1) * Math.max(.6, s / 90); g.beginPath(); g.arc(px + Math.cos(t) * r, py + Math.sin(t) * r, d, 0, 7); g.fill(); }
    } else {
      g.globalAlpha = Math.min(1, a); const t = atCTip(b.tip, col);
      if (aa) { g.save(); g.translate(px, py); g.rotate(aa); g.drawImage(t, -s / 2, -s / 2, s, s); g.restore(); } else g.drawImage(t, px - s / 2, py - s / 2, s, s);
    }
    if (box) { const r = s * (b.sc ? 1 + b.sc * 2 : 1) / 2 + 2; box[0] = Math.min(box[0], px - r); box[1] = Math.min(box[1], py - r); box[2] = Math.max(box[2], px + r); box[3] = Math.max(box[3], py + r); }
  }
}
// التلطيخ: ناخذ قطعة من مكان الختم اللي قبل ونحطها بالمكان الجديد (بشكل رأس الفرشاة)
function atSmudgeStamp(l, b, x0, y0, x, y, p, sz, box) {
  const s = Math.max(4, Math.min(260, sz * (1 - .5 * (b.szP || 0) + .5 * (b.szP || 0) * p))) | 0, pc = AT.smc || (AT.smc = atMk(260, 260)), pg = pc.getContext('2d');
  for (const [[px, py], [qx, qy]] of atSymPts(x, y).map((q, i) => [q, atSymPts(x0, y0)[i]])) {
    pg.globalCompositeOperation = 'copy'; pg.globalAlpha = 1; pg.drawImage(l.cv, qx - s / 2, qy - s / 2, s, s, 0, 0, s, s);
    pg.globalCompositeOperation = 'destination-in'; pg.drawImage(atTip(b.tip === 'spray' ? 'soft' : b.tip), 0, 0, s, s);
    const lg = l.g; lg.save(); lg.globalAlpha = AT.op.smudge * (.35 + .65 * p); lg.globalCompositeOperation = l.lock ? 'source-atop' : 'source-over'; lg.drawImage(pc, 0, 0, s, s, px - s / 2, py - s / 2, s, s); lg.restore();
    box[0] = Math.min(box[0], px - s); box[1] = Math.min(box[1], py - s); box[2] = Math.max(box[2], px + s); box[3] = Math.max(box[3], py + s);
  }
}
function atStrokeStart(x, y, p) {
  const L = atL(), l = atTgt(); if (!l) return;
  if (!L.vis || (L.grp && AT.groups[L.grp] && !AT.groups[L.grp].vis)) { atToast('الطبقة مخفية، شغّلها من الطبقات'); return; }
  const tool = AT.tool, b = tool === 'grad' ? { flow: 1 } : tool === 'liq' ? { sp: .1, flow: 1, st: .25, id: 'liq' } : atBr(AT.bt[tool] || AT.bt.brush), sz = AT.size[tool] || 20;
  const st = AT.stream[b.id] != null ? AT.stream[b.id] : b.st || 0;
  AT.stroke = { tool, b, sz, col: l.isMask ? (tool === 'eraser' ? '#000000' : '#ffffff') : AT.color, pts: [[x, y]], sm: [x, y], rp: [x, y], o: [x, y], last: [x, y], lp: p, dist: 0, rem: 0, box: [1e9, 1e9, -1e9, -1e9], st, t0: performance.now(), moved: performance.now(), shape: null, dir: 0 };
  if (tool === 'smudge' || tool === 'liq') { AT.snap = AT.snap && AT.snap.width === AT.W && AT.snap.height === AT.H ? AT.snap : atMk(AT.W, AT.H); const sg = AT.snap.getContext('2d'); sg.globalCompositeOperation = 'copy'; sg.drawImage(l.cv, 0, 0); sg.globalCompositeOperation = 'source-over'; }
  else {
    const sb = AT.sb.getContext('2d'); sb.setTransform(1, 0, 0, 1, 0, 0); sb.globalCompositeOperation = 'source-over'; sb.clearRect(0, 0, AT.W, AT.H);
    // كاش اللي تحت واللي فوق عشان الرسم يكون سريع
    const i = AT.cur, simple = !L.clip && !L.mask && !L.grp && !(AT.layers[i + 1] && AT.layers[i + 1].clip);
    AT.stroke.simple = simple;
    if (simple) { atCompose(AT.below, null, 0, i, true); atCompose(AT.above, null, i + 1, AT.layers.length, false); }
    const lv = AT.live.getContext('2d'); lv.globalCompositeOperation = 'copy'; lv.globalAlpha = 1; lv.drawImage(l.cv, 0, 0); lv.globalCompositeOperation = 'source-over';
  }
  if (atCollab() && ['brush', 'eraser'].includes(tool) && !l.isMask) atCollabSend('s', { k: 's', b: Object.assign({}, b, { taper: 0 }), sz, col: AT.stroke.col, tool, sym: AT.sym });
  atStrokeTo(x, y, p, true);
}
function atStrokeTo(rx, ry, p, first) {
  const S = AT.stroke; if (!S || S.shape) return;
  if (S.tool === 'grad') return atGradTo(rx, ry);
  // مساعدة الرسم: المنظور والشبكة يثبتون اتجاه الخط
  if (!first && AT.assist && (AT.guide === 'persp1' || AT.guide === 'persp2' || AT.guide === 'grid')) {
    if (!S.lock) { const dx = rx - S.o[0], dy = ry - S.o[1]; if (Math.hypot(dx, dy) * AT.view.z < 14) return; S.lock = atAssistDir(S.o, dx, dy); }
    const [ox, oy] = S.o, [ux, uy] = S.lock, t = (rx - ox) * ux + (ry - oy) * uy; rx = ox + ux * t; ry = oy + uy * t;
  }
  // حبل التثبيت (Lazy): النقطة ما تتحرك إلا لما تشد الحبل
  if (AT.rope > 0 && !first) { const R = AT.rope / AT.view.z, dx = rx - S.rp[0], dy = ry - S.rp[1], d = Math.hypot(dx, dy); AT.ropeLn = [[rx, ry], S.rp]; if (d <= R) { AT.dirty = true; return; } S.rp = [S.rp[0] + dx * (d - R) / d, S.rp[1] + dy * (d - R) / d]; rx = S.rp[0]; ry = S.rp[1]; }
  S.pts.push([rx, ry]);
  // التنعيم (StreamLine)
  const k = first ? 1 : 1 - S.st * .88; S.sm[0] += (rx - S.sm[0]) * k; S.sm[1] += (ry - S.sm[1]) * k;
  // منحنى ناعم بين النقاط (بدل خطوط مستقيمة تطلع زوايا لما تحرك بسرعة): بيزيه من نص النقطتين للنص الجاي
  const c = [S.sm[0], S.sm[1]];
  if (first || !S.q) { S.q = [c, c]; S.qp = p; return atStrokeSeg(c[0], c[1], p, first); }
  const [p0, p1] = S.q, m0 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], m1 = [(p1[0] + c[0]) / 2, (p1[1] + c[1]) / 2];
  const len = Math.hypot(p1[0] - m0[0], p1[1] - m0[1]) + Math.hypot(m1[0] - p1[0], m1[1] - p1[1]), n = Math.max(1, Math.min(24, Math.ceil(len * AT.view.z / 3)));
  for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; atStrokeSeg(u * u * m0[0] + 2 * u * t * p1[0] + t * t * m1[0], u * u * m0[1] + 2 * u * t * p1[1] + t * t * m1[1], S.qp + (p - S.qp) * t, false, i < n); }
  S.q = [p1, c]; S.qp = p;
}
function atStrokeSeg(x, y, p, first, more) {
  if (atCollab() && AT.stroke && ['brush', 'eraser'].includes(AT.stroke.tool)) atCollabSend('p', [Math.round(x * 10) / 10, Math.round(y * 10) / 10, Math.round(p * 100) / 100]);
  const S = AT.stroke, b = S.b, [lx, ly] = S.last, dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
  if (d > .01) S.dir = Math.atan2(dy, dx);
  const step = Math.max(.6, S.sz * (b.sp || .1) * (b.tip === 'spray' ? 1 : 1));
  const l = atL();
  if (first) { S.rem = step; }
  let t = S.rem; const n0 = S.dist;
  if (!S.seg) S.seg = [1e9, 1e9, -1e9, -1e9]; // المنطقة اللي تغيّرت من آخر تحديث بس (مو الضربة كلها)
  if (first) atOneStamp(x, y, p, x, y);
  else while (t <= d) {
    const f = t / d, px = lx + dx * f, py = ly + dy * f, pp = S.lp + (p - S.lp) * f;
    const tp = b.taper && S.tool !== 'eraser' ? Math.min(1, (n0 + t) / b.taper) : 1;
    atOneStamp(px, py, pp * tp, S.lx || lx, S.ly || ly); S.lx = px; S.ly = py; t += step;
  }
  S.rem = t - d; S.dist += d; S.last = [x, y]; S.lp = p;
  const sg = S.seg, B = S.box; B[0] = Math.min(B[0], sg[0]); B[1] = Math.min(B[1], sg[1]); B[2] = Math.max(B[2], sg[2]); B[3] = Math.max(B[3], sg[3]);
  if (more) return; // نقاط المنحنى اللي بالنص: نحدّث الشاشة مرة وحدة بآخرها
  S.seg = null;
  if (sg[2] >= sg[0]) { if (S.tool !== 'smudge' && S.tool !== 'liq') atLiveUpdate(sg); else atRegionComp(sg); }
  AT.dirty = true;
}
function atOneStamp(x, y, p, px, py) {
  const S = AT.stroke, b = S.b;
  const bx = S.seg || S.box;
  if (S.tool === 'smudge') return atSmudgeStamp(atTgt(), b, px, py, x, y, p, S.sz, bx);
  if (S.tool === 'liq') return atLiqDab(atTgt(), px, py, x, y, p, S.sz, bx);
  const g = AT.sb.getContext('2d'); g.globalCompositeOperation = 'source-over';
  atStamp(g, b, x, y, p, S.dir, S.tool === 'eraser' ? '#000000' : S.col, S.sz, bx);
}
// نحدّث النسخة الحيّة (الطبقة + الضربة) بالمنطقة اللي تغيّرت بس
function atLiveUpdate(bb) {
  const S = AT.stroke, t = atTgt(), l = atL(), b = bb || S.box; if (b[2] < b[0]) return;
  const x = Math.max(0, (b[0] - 3) | 0), y = Math.max(0, (b[1] - 3) | 0), w = Math.min(AT.W, Math.ceil(b[2] + 3)) - x, h = Math.min(AT.H, Math.ceil(b[3] + 3)) - y; if (w <= 0 || h <= 0) return;
  const lv = AT.live.getContext('2d'); lv.save(); lv.globalCompositeOperation = 'source-over'; lv.globalAlpha = 1; lv.clearRect(x, y, w, h); lv.drawImage(t.cv, x, y, w, h, x, y, w, h); lv.restore();
  atMergeSb(lv, S, t, x, y, w, h);
  if (S.simple) {
    const g = AT.comp.getContext('2d'); g.save(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(x, y, w, h); g.drawImage(AT.below, x, y, w, h, x, y, w, h);
    g.globalCompositeOperation = l.blend; g.globalAlpha = l.op; g.drawImage(AT.live, x, y, w, h, x, y, w, h);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(AT.above, x, y, w, h, x, y, w, h); g.restore();
  } else atCompose(AT.comp, { l, cv: AT.live, mask: !!t.isMask });
}
// اللطخ والتسييل يغيّرون الطبقة نفسها: نعيد تركيب المنطقة المتغيرة بس لو نقدر
function atRegionComp(b) {
  const S = AT.stroke, l = atL(), t = atTgt();
  if (!S || !S.simple || t.isMask) return atCompose(AT.comp, null);
  const x = Math.max(0, (b[0] - 3) | 0), y = Math.max(0, (b[1] - 3) | 0), w = Math.min(AT.W, Math.ceil(b[2] + 3)) - x, h = Math.min(AT.H, Math.ceil(b[3] + 3)) - y; if (w <= 0 || h <= 0) return;
  const g = AT.comp.getContext('2d'); g.save(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(x, y, w, h); g.drawImage(AT.below, x, y, w, h, x, y, w, h);
  g.globalCompositeOperation = l.blend; g.globalAlpha = l.op; g.drawImage(l.cv, x, y, w, h, x, y, w, h);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(AT.above, x, y, w, h, x, y, w, h); g.restore();
}
// نجهز الضربة قبل ما تنضاف: حبيبات الورق، حواف المائي، وحدود التحديد
function atPrep(S, x, y, w, h, fin) {
  const b = S.b, t = AT.tmp2.getContext('2d'); t.save(); t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1; t.clearRect(x, y, w, h); t.drawImage(AT.sb, x, y, w, h, x, y, w, h);
  if (b.grain && S.tool === 'brush') { t.globalCompositeOperation = 'destination-in'; t.fillStyle = atGrain(t); t.fillRect(x, y, w, h); }
  if (fin && b.wet && S.tool === 'brush' && atHasFilter()) { // حواف المائي: الوسط أفتح والأطراف أغمق
    const bl = (AT.tmp3 && AT.tmp3.width === AT.W && AT.tmp3.height === AT.H) ? AT.tmp3 : (AT.tmp3 = atMk(AT.W, AT.H)), bg = bl.getContext('2d');
    bg.save(); bg.clearRect(x, y, w, h); bg.filter = 'blur(7px)'; bg.drawImage(AT.sb, x, y, w, h, x, y, w, h); bg.restore();
    t.globalCompositeOperation = 'destination-out'; t.globalAlpha = .42; t.drawImage(bl, x, y, w, h, x, y, w, h); t.globalAlpha = 1;
  }
  if (AT.sel) { t.globalCompositeOperation = 'destination-in'; t.drawImage(AT.sel.mask, x, y, w, h, x, y, w, h); }
  t.restore(); return AT.tmp2;
}
function atMergeSb(g, S, l, x, y, w, h, fin) {
  const b = S.b; if (w == null) { x = 0; y = 0; w = AT.W; h = AT.H; }
  const src = atPrep(S, x, y, w, h, fin);
  g.save(); g.globalAlpha = AT.op[S.tool] * (b.glaze || 1);
  g.globalCompositeOperation = S.tool === 'eraser' ? 'destination-out' : l.lock ? 'source-atop' : b.add ? 'lighter' : 'source-over';
  g.drawImage(src, x, y, w, h, x, y, w, h); g.restore();
}
function atStrokeEnd() {
  const S = AT.stroke; if (!S) return; clearTimeout(AT.qsT);
  if (!S.shape && S.dist > 0 && S.tool !== 'grad') { // نلحق آخر نقطة بمنحنى (التنعيم يخلي القلم متأخر شوي) بدل خط مستقيم
    const L = S.pts[S.pts.length - 1]; for (let i = 0; i < 6 && Math.hypot(S.sm[0] - L[0], S.sm[1] - L[1]) * AT.view.z > 1.5; i++) { S.pts.pop(); atStrokeTo(L[0], L[1], S.lp); }
    if (S.q) { const [p0, p1] = [S.q[1], [S.sm[0], S.sm[1]]], m0 = [(S.q[0][0] + p0[0]) / 2, (S.q[0][1] + p0[1]) / 2]; for (let i = 1; i <= 6; i++) { const t = i / 6, u = 1 - t; atStrokeSeg(u * u * m0[0] + 2 * u * t * p0[0] + t * t * p1[0], u * u * m0[1] + 2 * u * t * p0[1] + t * t * p1[1], S.lp, false, i < 6); } }
    atStrokeSeg(L[0], L[1], S.lp);
  }
  AT.ropeLn = null;
  const l = atTgt(), b = S.box; AT.stroke = null; if (atCollab() && ['brush', 'eraser'].includes(S.tool)) atCollabSend('e');
  if (b[2] < b[0]) { atRecomp(); return; }
  const x = b[0] - 2, y = b[1] - 2, w = b[2] - b[0] + 4, h = b[3] - b[1] + 4;
  if (S.tool === 'smudge' || S.tool === 'liq') {
    const p = { x: Math.max(0, Math.floor(x)), y: Math.max(0, Math.floor(y)) }; p.w = Math.min(AT.W - p.x, Math.ceil(w)); p.h = Math.min(AT.H - p.y, Math.ceil(h));
    if (AT.sel) { // برا التحديد يرجع مثل ما كان
      const t = AT.tmp2.getContext('2d'); t.save(); t.clearRect(0, 0, AT.W, AT.H); t.drawImage(l.cv, 0, 0); t.globalCompositeOperation = 'destination-in'; t.drawImage(AT.sel.mask, 0, 0); t.restore();
      l.g.save(); l.g.globalCompositeOperation = 'copy'; l.g.drawImage(AT.snap, 0, 0); l.g.globalCompositeOperation = 'destination-out'; l.g.drawImage(AT.sel.mask, 0, 0); l.g.globalCompositeOperation = 'source-over'; l.g.drawImage(AT.tmp2, 0, 0); l.g.restore();
    }
    if (p.w > 0 && p.h > 0) { p.d = AT.snap.getContext('2d').getImageData(p.x, p.y, p.w, p.h); atPush(atPxEntry(l, p)); }
  } else {
    const before = atPatch(l, x, y, w, h); if (!before) { atRecomp(); return; }
    atMergeSb(l.g, S, l, before.x, before.y, before.w, before.h, true);
    atPush(atPxEntry(l, before));
    if ((S.tool === 'brush' || S.tool === 'grad') && !l.isMask) atAddHist(S.col);
  }
  atRecomp(); atThumbSoon();
}
// التدرّج: من أول نقطة لآخر نقطة (خطي أو دائري) للشفاف أو للون الثاني
function atGradTo(x, y) {
  const S = AT.stroke, [ax, ay] = S.o, g = AT.sb.getContext('2d'); g.clearRect(0, 0, AT.W, AT.H);
  const c1 = S.col, c2 = AT.gradTo === 'c2' ? (AT.color2 || '#ffffff') : S.col + '00';
  const gr = AT.gradMode === 'rad' ? g.createRadialGradient(ax, ay, 0, ax, ay, Math.max(1, Math.hypot(x - ax, y - ay))) : g.createLinearGradient(ax, ay, x, y);
  gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, AT.W, AT.H);
  S.box = [0, 0, AT.W, AT.H]; S.dist = 1; S.gEnd = [x, y]; atLiveUpdate(); AT.dirty = true;
}
// اتجاه مساعدة الرسم: أقرب خط (للنقطة المتلاشية أو أفقي/عمودي)
function atAssistDir(o, dx, dy) {
  const L = Math.hypot(dx, dy), u = [dx / L, dy / L], c = [[1, 0], [0, 1]];
  if (AT.guide !== 'grid') (AT.vp || atVpDef()).slice(0, AT.guide === 'persp1' ? 1 : 2).forEach(([vx, vy]) => { const ex = vx - o[0], ey = vy - o[1], el = Math.hypot(ex, ey) || 1; c.push([ex / el, ey / el]); });
  if (AT.guide === 'persp1') c.splice(0, 0); // نقطة وحدة: أفقي وعمودي وللنقطة
  let best = c[0], bd = -1; c.forEach(v => { const d = Math.abs(v[0] * u[0] + v[1] * u[1]); if (d > bd) { bd = d; best = v; } });
  return best;
}
const atVpDef = () => (AT.vp = AT.guide === 'persp1' ? [[AT.W / 2, AT.H * .42]] : [[-AT.W * .15, AT.H * .42], [AT.W * 1.15, AT.H * .42]]);
// الشكل السريع (QuickShape): توقف ثانية آخر الخط ويتعدل لخط أو دائرة أو مستطيل
function atQuickShape() {
  const S = AT.stroke; if (!S || S.shape || S.tool === 'smudge' || S.tool === 'liq' || S.tool === 'grad' || S.lock || !AT.qs || S.pts.length < 6) return;
  const P = S.pts, a = P[0], z = P[P.length - 1], L = Math.hypot(z[0] - a[0], z[1] - a[1]);
  let len = 0, minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9; for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  P.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
  if (len < 20) return;
  let shape = null;
  if (L > len * .9) shape = { t: 'line', a, z };
  else if (L < len * .2) {
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, rx = (maxX - minX) / 2, ry = (maxY - minY) / 2;
    let eE = 0, eR = 0; P.forEach(([x, y]) => { const ang = Math.atan2((y - cy) / ry, (x - cx) / rx); eE += Math.hypot(x - (cx + rx * Math.cos(ang)), y - (cy + ry * Math.sin(ang))); eR += Math.min(Math.abs(x - minX), Math.abs(x - maxX), Math.abs(y - minY), Math.abs(y - maxY)); });
    if (eR < eE * .7) shape = { t: 'rect', x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    else { const circ = Math.abs(rx - ry) / Math.max(rx, ry) < .18, r = (rx + ry) / 2; shape = { t: 'ell', cx, cy, rx: circ ? r : rx, ry: circ ? r : ry }; }
  }
  if (!shape) return;
  // نعيد الضربة كشكل مضبوط
  S.shape = shape; const sb = AT.sb.getContext('2d'); sb.clearRect(0, 0, AT.W, AT.H); // نخلي حدود الضربة القديمة عشان ننظفها
  const pts = []; const N = shape.t === 'line' ? 2 : 0;
  if (shape.t === 'line') pts.push(shape.a, shape.z);
  else if (shape.t === 'rect') { const { x, y, w, h } = shape; pts.push([x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]); }
  else for (let i = 0; i <= 96; i++) { const t = i / 96 * Math.PI * 2; pts.push([shape.cx + shape.rx * Math.cos(t), shape.cy + shape.ry * Math.sin(t)]); }
  S.last = pts[0]; S.rem = 0; S.dist = 1000; S.lx = null; S.ly = null; S.lp = .8;
  const bt = S.b.taper; S.b = Object.assign({}, S.b, { taper: 0 });
  for (let i = 1; i < pts.length; i++) atStrokeSeg(pts[i][0], pts[i][1], .8);
  S.b.taper = bt; void N;
  atToast(shape.t === 'line' ? 'خط مستقيم' : shape.t === 'rect' ? 'مستطيل' : 'دائرة', 700); try { sfx('gclick'); } catch {}
}

// التسييل: دفع، لف، شد للداخل، تكبير — نعيد رسم البكسلات حول الفرشاة من مكان ثاني
function atLiqDab(l, x0, y0, x, y, p, sz, box) {
  const R = Math.max(6, Math.min(220, sz / 2)) | 0, cx = Math.round(x), cy = Math.round(y), bx = cx - R, by = cy - R, D = R * 2;
  const sx0 = Math.max(0, bx), sy0 = Math.max(0, by), sw = Math.min(AT.W, bx + D) - sx0, sh = Math.min(AT.H, by + D) - sy0; if (sw <= 0 || sh <= 0) return;
  const src = l.g.getImageData(sx0, sy0, sw, sh), sd = src.data, out = new ImageData(new Uint8ClampedArray(sd), sw, sh), od = out.data;
  const st = AT.op.liq * (.4 + .6 * p), mode = AT.liqMode || 'push', mx = x - x0, my = y - y0;
  const samp = (fx, fy, k) => { fx -= sx0; fy -= sy0; if (fx < 0 || fy < 0 || fx > sw - 1.001 || fy > sh - 1.001) { fx = atClamp(fx, 0, sw - 1.001); fy = atClamp(fy, 0, sh - 1.001); } const ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy, i = (iy * sw + ix) * 4;
    for (let c = 0; c < 4; c++) od[k + c] = sd[i + c] * (1 - ax) * (1 - ay) + sd[i + 4 + c] * ax * (1 - ay) + sd[i + sw * 4 + c] * (1 - ax) * ay + sd[i + sw * 4 + 4 + c] * ax * ay; };
  for (let yy = 0; yy < sh; yy++) for (let xx = 0; xx < sw; xx++) {
    const X = sx0 + xx, Y = sy0 + yy, dx = X - cx, dy = Y - cy, d2 = dx * dx + dy * dy; if (d2 >= R * R) continue;
    const f = Math.pow(1 - d2 / (R * R), 2) * st, k = (yy * sw + xx) * 4;
    if (mode === 'push') samp(X - mx * f * 1.1, Y - my * f * 1.1, k);
    else if (mode === 'twirl') { const a = f * .22, c = Math.cos(a), s = Math.sin(a); samp(cx + dx * c - dy * s, cy + dx * s + dy * c, k); }
    else if (mode === 'pinch') samp(cx + dx * (1 + f * .12), cy + dy * (1 + f * .12), k);
    else samp(cx + dx * (1 - f * .12), cy + dy * (1 - f * .12), k);
  }
  l.g.putImageData(out, sx0, sy0);
  box[0] = Math.min(box[0], sx0); box[1] = Math.min(box[1], sy0); box[2] = Math.max(box[2], sx0 + sw); box[3] = Math.max(box[3], sy0 + sh);
}
// ===== التعبئة والقطّارة =====
function atPick(x, y) {
  x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= AT.W || y >= AT.H) return;
  const d = AT.comp.getContext('2d').getImageData(x, y, 1, 1).data;
  AT.color = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); atUIColor(); atToast('أخذت اللون', 600);
}
// تعبئة: نلقى المنطقة من الرسمة الظاهرة ونعبّيها بالطبقة الحالية
function atFlood(x, y, srcCv, tolPct) {
  const W = AT.W, H = AT.H, src = srcCv.getContext('2d').getImageData(0, 0, W, H).data, tol = tolPct * 2.55 * 2;
  const i0 = (y * W + x) * 4, r0 = src[i0], g0 = src[i0 + 1], b0 = src[i0 + 2], a0 = src[i0 + 3];
  const m = new Uint8Array(W * H), st = [x, y]; let minX = x, maxX = x, minY = y, maxY = y;
  const same = i => { const k = i * 4; return Math.abs(src[k] - r0) + Math.abs(src[k + 1] - g0) + Math.abs(src[k + 2] - b0) + Math.abs(src[k + 3] - a0) <= tol; };
  while (st.length) {
    const sy = st.pop(), sx = st.pop(); if (m[sy * W + sx]) continue; let lx = sx; while (lx > 0 && !m[sy * W + lx - 1] && same(sy * W + lx - 1)) lx--;
    let rx = sx; while (rx < W - 1 && !m[sy * W + rx + 1] && same(sy * W + rx + 1)) rx++;
    for (let i = lx; i <= rx; i++) m[sy * W + i] = 1;
    if (lx < minX) minX = lx; if (rx > maxX) maxX = rx; if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    for (const ny of [sy - 1, sy + 1]) { if (ny < 0 || ny >= H) continue; let i = lx; while (i <= rx) { if (!m[ny * W + i] && same(ny * W + i)) { st.push(i, ny); while (i <= rx && !m[ny * W + i] && same(ny * W + i)) i++; } i++; } }
  }
  const bx = Math.max(0, minX - 2), by = Math.max(0, minY - 2), bw = Math.min(W, maxX + 3) - bx, bh = Math.min(H, maxY + 3) - by;
  return { m, W, H, bx, by, bw, bh };
}
function atFill(x, y) {
  x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= AT.W || y >= AT.H) return;
  const l = atTgt(); if (!l.vis) return atToast('الطبقة مخفية');
  const { m, W, H, bx, by, bw, bh } = atFlood(x, y, AT.comp, AT.fillTol == null ? 22 : AT.fillTol);
  // نكبّر القناع بكسل عشان ما يبقى خط أبيض عند الحواف
  const mk = atMk(bw, bh), mg = mk.getContext('2d'), id = mg.createImageData(bw, bh), [cr, cg, cb] = atHex(l.isMask ? '#ffffff' : AT.color);
  for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) { const X = bx + xx, Y = by + yy; let on = m[Y * W + X]; if (!on) on = (X > 0 && m[Y * W + X - 1]) || (X < W - 1 && m[Y * W + X + 1]) || (Y > 0 && m[(Y - 1) * W + X]) || (Y < H - 1 && m[(Y + 1) * W + X]); if (on) { const k = (yy * bw + xx) * 4; id.data[k] = cr; id.data[k + 1] = cg; id.data[k + 2] = cb; id.data[k + 3] = 255; } }
  mg.putImageData(id, 0, 0);
  if (AT.sel) { mg.globalCompositeOperation = 'destination-in'; mg.drawImage(AT.sel.mask, bx, by, bw, bh, 0, 0, bw, bh); }
  const before = atPatch(l, bx, by, bw, bh); const g = l.g; g.save(); g.globalAlpha = AT.op.brush; g.globalCompositeOperation = l.lock ? 'source-atop' : 'source-over'; g.drawImage(mk, bx, by); g.restore();
  atPush(atPxEntry(l, before)); atAddHist(AT.color); atRecomp(); atThumbSoon(); try { sfx('pop'); } catch {}
}
const atHex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

// ===== التحديد والتحويل =====
// التحديد = قناع بحجم اللوحة (الشفافية = المحدد). حر، مستطيل، عصا سحرية، وإضافة/طرح
function atSelFinish() {
  const L = AT.lasso; AT.lasso = null; if (!L || L.pts.length < 2) { AT.dirty = true; return; }
  let pts = L.pts; if (L.rect) { const [a] = pts, c = pts[pts.length - 1]; pts = [a, [c[0], a[1]], c, [a[0], c[1]]]; }
  const m = atMk(AT.W, AT.H), g = m.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
  atSelApply(m, AT.selOp || 'new');
}
function atSelApply(m, mode) {
  const W = AT.W, H = AT.H; let mk = m;
  if (AT.sel && mode !== 'new') { mk = AT.sel.mask; const g = mk.getContext('2d'); g.save(); g.globalCompositeOperation = mode === 'sub' ? 'destination-out' : 'source-over'; g.drawImage(m, 0, 0); g.restore(); }
  const d = mk.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { AT.sel = null; atSelBar(); AT.dirty = true; return; }
  AT.sel = { mask: mk, box: [Math.max(0, x0 - 3), Math.max(0, y0 - 3), Math.min(W, x1 + 4), Math.min(H, y1 + 4)] };
  // الطبقة اللي تبين اللي برا التحديد (خطوط زرقا)
  const ov = AT.selOv && AT.selOv.width === W && AT.selOv.height === H ? AT.selOv : (AT.selOv = atMk(W, H)), og = ov.getContext('2d');
  if (!AT.stripe) { AT.stripe = atMk(16, 16); const sg = AT.stripe.getContext('2d'); sg.strokeStyle = 'rgba(61,123,255,.38)'; sg.lineWidth = 3; sg.beginPath(); sg.moveTo(-4, 20); sg.lineTo(20, -4); sg.moveTo(-4, 4); sg.lineTo(4, -4); sg.moveTo(12, 20); sg.lineTo(20, 12); sg.stroke(); }
  og.save(); og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, W, H); og.fillStyle = 'rgba(20,24,40,.18)'; og.fillRect(0, 0, W, H); og.fillStyle = og.createPattern(AT.stripe, 'repeat'); og.fillRect(0, 0, W, H); og.globalCompositeOperation = 'destination-out'; og.drawImage(mk, 0, 0); og.restore();
  atSelBar(); AT.dirty = true;
}
// العصا السحرية: تحدد المنطقة اللي لونها قريب من اللي لمسته
function atWand(x, y) {
  x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= AT.W || y >= AT.H) return;
  const r = atFlood(x, y, AT.comp, AT.wandTol == null ? 25 : AT.wandTol); if (!r) return;
  const { m, W, bx, by, bw, bh } = r, mk = atMk(AT.W, AT.H), g = mk.getContext('2d'), id = g.createImageData(bw, bh);
  for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) if (m[(by + yy) * W + bx + xx]) id.data[(yy * bw + xx) * 4 + 3] = 255;
  g.putImageData(id, bx, by); atSelApply(mk, AT.selOp || 'new'); try { sfx('gclick'); } catch {}
}
function atSelInvert() { const m = atMk(AT.W, AT.H), g = m.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, AT.W, AT.H); if (AT.sel) { g.globalCompositeOperation = 'destination-out'; g.drawImage(AT.sel.mask, 0, 0); } atSelApply(m, 'new'); }
function atSelAll() { const m = atMk(AT.W, AT.H), g = m.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, AT.W, AT.H); atSelApply(m, 'new'); }
function atSelFeather(px) { if (!AT.sel) return; const m = atMk(AT.W, AT.H), g = m.getContext('2d'); if (atHasFilter()) { g.filter = `blur(${px}px)`; g.drawImage(AT.sel.mask, 0, 0); } else { const k = Math.max(2, px / 2), t = atMk(Math.ceil(AT.W / k), Math.ceil(AT.H / k)); t.getContext('2d').drawImage(AT.sel.mask, 0, 0, t.width, t.height); g.drawImage(t, 0, 0, AT.W, AT.H); } atSelApply(m, 'new'); }
function atSelBar() {
  const bar = document.getElementById('atSelBar'); if (!bar) return;
  if (AT.fl) { bar.hidden = false; bar.innerHTML = `<button data-f="fx">قلب أفقي</button><button data-f="fy">قلب عمودي</button><button data-f="r90">تدوير ٩٠°</button><button data-f="fit">ملء اللوحة</button><button data-f="cancel">إلغاء</button><button data-f="ok" class="ok">تم</button>`; return; }
  if (AT.tool === 'select') {
    const m = AT.selMode || 'free', o = AT.selOp || 'new';
    bar.hidden = false; bar.innerHTML = `<button data-s="free" class="${m === 'free' ? 'on' : ''}">حر</button><button data-s="rect" class="${m === 'rect' ? 'on' : ''}">مستطيل</button><button data-s="wand" class="${m === 'wand' ? 'on' : ''}">عصا سحرية</button><i class="atsep"></i>
      <button data-s="op:new" class="${o === 'new' ? 'on' : ''}">جديد</button><button data-s="op:add" class="${o === 'add' ? 'on' : ''}">إضافة</button><button data-s="op:sub" class="${o === 'sub' ? 'on' : ''}">طرح</button>
      ${m === 'wand' ? `<label class="attol">الحساسية <input type="range" id="atWT" min="0" max="100" value="${AT.wandTol == null ? 25 : AT.wandTol}"></label>` : ''}<i class="atsep"></i>
      <button data-s="all">الكل</button>${AT.sel ? `<button data-s="inv">عكس</button><button data-s="feather">تنعيم الحواف</button><button data-s="copy">نسخ لطبقة</button><button data-s="clear">امسح</button><button data-s="tf">حرّك</button><button data-s="none">ألغِ التحديد</button>` : ''}<button data-s="done" class="ok">تم</button>`;
    const wt = document.getElementById('atWT'); if (wt) wt.oninput = e => { AT.wandTol = +e.target.value; };
    return;
  }
  if (AT.tool === 'liq') { const m = AT.liqMode || 'push'; bar.hidden = false; bar.innerHTML = `${[['push', 'دفع'], ['twirl', 'لف'], ['pinch', 'شد للداخل'], ['expand', 'تكبير']].map(([k, n]) => `<button data-lq="${k}" class="${m === k ? 'on' : ''}">${n}</button>`).join('')}<span>الحجم والقوة من الشريط الجانبي</span><button data-lq="done" class="ok">تم</button>`; return; }
  if (AT.tool === 'vp') { bar.hidden = false; bar.innerHTML = `<span>اسحب النقاط الزرقا للمكان اللي تبيه</span><button data-vp="ok" class="ok">تم</button>`; return; }
  if (AT.tool === 'grad') { bar.hidden = false; bar.innerHTML = `<button data-g="lin" class="${AT.gradMode !== 'rad' ? 'on' : ''}">خطي</button><button data-g="rad" class="${AT.gradMode === 'rad' ? 'on' : ''}">دائري</button><i class="atsep"></i><button data-g="tr" class="${AT.gradTo !== 'c2' ? 'on' : ''}">للشفاف</button><button data-g="c2" class="${AT.gradTo === 'c2' ? 'on' : ''}">للون الثاني <i class="atsw" style="background:${AT.color2 || '#ffffff'}"></i></button><button data-g="set2">خلّ اللون الحالي ثاني</button><span>اسحب على اللوحة</span>`; return; }
  if (AT.sel) { bar.hidden = false; bar.innerHTML = `<span>الرسم داخل التحديد بس</span><button data-s="inv">عكس</button><button data-s="none">ألغِ التحديد</button>`; return; }
  bar.hidden = true;
}
function atFloatStart() {
  const l = atL(); if (!l.vis) return atToast('الطبقة مخفية');
  let bx, by, bw, bh;
  if (AT.sel) { [bx, by] = AT.sel.box; bw = AT.sel.box[2] - bx; bh = AT.sel.box[3] - by; }
  else { // حدود اللي مرسوم بالطبقة
    const d = l.g.getImageData(0, 0, AT.W, AT.H).data; let x0 = AT.W, y0 = AT.H, x1 = -1, y1 = -1;
    for (let y = 0; y < AT.H; y += 2) for (let x = 0; x < AT.W; x += 2) if (d[(y * AT.W + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return atToast('الطبقة فاضية');
    bx = x0 - 2; by = y0 - 2; bw = x1 - x0 + 5; bh = y1 - y0 + 5;
  }
  bx = Math.max(0, Math.floor(bx)); by = Math.max(0, Math.floor(by)); bw = Math.min(AT.W - bx, Math.ceil(bw)); bh = Math.min(AT.H - by, Math.ceil(bh)); if (bw < 2 || bh < 2) return;
  const cv = atMk(bw, bh), g = cv.getContext('2d'); g.drawImage(l.cv, bx, by, bw, bh, 0, 0, bw, bh); if (AT.sel) { g.globalCompositeOperation = 'destination-in'; g.drawImage(AT.sel.mask, bx, by, bw, bh, 0, 0, bw, bh); g.globalCompositeOperation = 'source-over'; }
  const before = l.g.getImageData(0, 0, AT.W, AT.H);
  // نشيلها من الطبقة (بالنسخة الحية) لين ينتهي التحويل
  const lv = AT.live.getContext('2d'); lv.globalCompositeOperation = 'copy'; lv.drawImage(l.cv, 0, 0); lv.globalCompositeOperation = 'destination-out'; if (AT.sel) lv.drawImage(AT.sel.mask, 0, 0); else lv.fillRect(bx, by, bw, bh); lv.globalCompositeOperation = 'source-over';
  AT.fl = { l, cv, x: bx + bw / 2, y: by + bh / 2, r: 0, s: 1, fx: false, fy: false, before, x0: bx + bw / 2, y0: by + bh / 2 };
  AT.prevTool = AT.tool; AT.tool = 'transform'; atUITool(); atSelBar(); atRecomp();
}
function atFloatCommit() {
  const f = AT.fl; if (!f) return; const l = f.l, g = l.g;
  g.globalCompositeOperation = 'copy'; g.drawImage(AT.live, 0, 0); g.globalCompositeOperation = 'source-over';
  g.save(); g.translate(f.x, f.y); g.rotate(f.r); g.scale(f.s * (f.fx ? -1 : 1), f.s * (f.fy ? -1 : 1)); g.drawImage(f.cv, -f.cv.width / 2, -f.cv.height / 2); g.restore();
  atPush({ t: 'px', l, b: { x: 0, y: 0, w: AT.W, h: AT.H, d: f.before }, a: g.getImageData(0, 0, AT.W, AT.H), mem: AT.W * AT.H * 8 });
  AT.fl = null; AT.sel = null; AT.tool = AT.prevTool === 'select' ? 'brush' : (AT.prevTool || 'brush'); atUITool(); atSelBar(); atRecomp(); atThumbSoon();
}
function atFloatCancel(silent) { if (!AT.fl) return; const nw = AT.fl.isNew; AT.fl = null; if (nw && !silent) { const e = AT.undo.pop(); if (e && e.t === 'st') atApplyStruct(e.b); atLayersUI(); atUIUndo(); } AT.tool = AT.prevTool || 'brush'; atUITool(); atSelBar(); atRecomp(); if (!silent) atToast('ألغيت التحويل'); }
function atFloatGeom() { const f = AT.fl, w = f.cv.width * f.s / 2, h = f.cv.height * f.s / 2, c = Math.cos(f.r), s = Math.sin(f.r); const P = (x, y) => atToScr(f.x + x * c - y * s, f.y + x * s + y * c); return { c: [P(-w, -h), P(w, -h), P(w, h), P(-w, h)], rot: P(0, -h - 40 / AT.view.z), ctr: atToScr(f.x, f.y) }; }
function atFloatHandles(g) {
  const G = atFloatGeom(); g.save(); g.strokeStyle = '#3d7bff'; g.lineWidth = 1.5; g.beginPath(); G.c.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke();
  g.fillStyle = '#fff'; G.c.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.stroke(); });
  g.beginPath(); g.moveTo(...G.rot); g.lineTo((G.c[0][0] + G.c[1][0]) / 2, (G.c[0][1] + G.c[1][1]) / 2); g.stroke(); g.fillStyle = '#3d7bff'; g.beginPath(); g.arc(G.rot[0], G.rot[1], 9, 0, 7); g.fill(); g.restore();
}

// ===== النص =====
function atTextAt(x, y) {
  if (atNoCollab()) return;
  const pop = document.getElementById('atPop'); AT.popK = 'text'; pop.hidden = false; pop.className = 'atpop attext'; document.body.classList.add('atpopen');
  pop.innerHTML = `<b>نص جديد</b><textarea id="atTxt" rows="3" placeholder="اكتب هنا"></textarea>
    <label>الحجم <input type="range" id="atTxS" min="16" max="300" value="${AT.txs || 72}"></label>
    <label>الخط <select id="atTxF"><option value="Lalezar">لاله زار</option><option value="Tajawal">تجوال</option><option value="serif">كلاسيكي</option><option value="monospace">آلة كاتبة</option></select></label>
    <div class="atrow"><button class="atbtn" id="atTxNo">إلغاء</button><button class="atbtn ok" id="atTxOk">أضف</button></div>`;
  setTimeout(() => document.getElementById('atTxt').focus(), 50);
  document.getElementById('atTxNo').onclick = atClosePop;
  document.getElementById('atTxOk').onclick = () => {
    const t = document.getElementById('atTxt').value.trim(); if (!t) return atClosePop();
    const s = AT.txs = +document.getElementById('atTxS').value, f = document.getElementById('atTxF').value;
    atStructDo(() => { const l = atLayer('نص'); AT.layers.splice(AT.cur + 1, 0, l); AT.cur++; const g = l.g; g.fillStyle = AT.color; g.font = `${f === 'Tajawal' ? 800 : 400} ${s}px ${f === 'serif' || f === 'monospace' ? f : `'${f}', sans-serif`}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; t.split('\n').forEach((ln, i, a) => g.fillText(ln, x, y + (i - (a.length - 1) / 2) * s * 1.2)); });
    atClosePop(); atThumbSoon(); AT.tool = 'brush'; atUITool();
  };
}

// ===== تعديلات (تمويه، ألوان) =====
function atAdjust() {
  const l = atL(), pop = document.getElementById('atPop'); AT.popK = 'adjust'; pop.hidden = false; pop.className = 'atpop atadjust'; document.body.classList.add('atpopen');
  const src = atMk(AT.W, AT.H); src.getContext('2d').drawImage(l.cv, 0, 0); const V = { b: 0, h: 0, s: 100, l: 100, c: 100, m: 0, ma: 0, sh: 0, n: 0, px: 1, inv: 0, gm: 100, gmOn: 0, cv: [[0, 0], [1, 1]] };
  pop.innerHTML = `<b>تعديل «${esc(l.name)}»</b>
    <label>تمويه <input type="range" data-k="b" min="0" max="40" value="0"><em>٠</em></label>
    <label>درجة اللون <input type="range" data-k="h" min="-180" max="180" value="0"><em>٠</em></label>
    <label>التشبع <input type="range" data-k="s" min="0" max="200" value="100"><em>١٠٠٪</em></label>
    <label>السطوع <input type="range" data-k="l" min="0" max="200" value="100"><em>١٠٠٪</em></label>
    <label>التباين <input type="range" data-k="c" min="0" max="200" value="100"><em>١٠٠٪</em></label>
    <label>ضبابية حركة <input type="range" data-k="m" min="0" max="80" value="0"><em>٠</em></label>
    <label>اتجاهها <input type="range" data-k="ma" min="0" max="180" value="0"><em>٠°</em></label>
    <label>حدّة <input type="range" data-k="sh" min="0" max="100" value="0"><em>٠٪</em></label>
    <label>تشويش <input type="range" data-k="n" min="0" max="100" value="0"><em>٠٪</em></label>
    <label>بكسلة <input type="range" data-k="px" min="1" max="60" value="1"><em>١</em></label>
    <label class="atchk"><input type="checkbox" id="atInv"> عكس الألوان</label>
    <div class="atsub">المنحنى (اسحب النقاط، اضغط تضيف نقطة)</div><canvas id="atCurve" width="240" height="160" class="atcurve"></canvas>
    <label class="atchk"><input type="checkbox" id="atGm"> خريطة تدرّج (الغامق ← اللون الثاني، الفاتح ← اللون الحالي)</label><label>قوتها <input type="range" data-k="gm" min="0" max="100" value="100"><em>١٠٠٪</em></label>
    <button class="atbtn" id="atLiq">تسييل (Liquify)</button>
    <div class="atrow"><button class="atbtn" id="atAdjNo">إلغاء</button><button class="atbtn ok" id="atAdjOk">طبّق</button></div>`;
  const hasF = 'filter' in l.g && (() => { const t = atMk(2, 2).getContext('2d'); t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; })();
  let raf = 0;
  const apply = () => {
    raf = 0; const g = l.g; g.save(); g.globalCompositeOperation = 'copy';
    if (hasF) { g.filter = `blur(${V.b}px) hue-rotate(${V.h}deg) saturate(${V.s}%) brightness(${V.l}%) contrast(${V.c}%)`; g.drawImage(src, 0, 0); g.filter = 'none'; }
    else { // بدون فلاتر (سفاري القديم): تمويه بالتصغير والتكبير، والألوان بالبكسل
      if (V.b) { const k = Math.max(1, V.b / 2), t = atMk(Math.ceil(AT.W / k), Math.ceil(AT.H / k)); t.getContext('2d').drawImage(src, 0, 0, t.width, t.height); g.imageSmoothingQuality = 'high'; g.drawImage(t, 0, 0, AT.W, AT.H); } else g.drawImage(src, 0, 0);
      if (V.h || V.s !== 100 || V.l !== 100 || V.c !== 100) { const id = g.getImageData(0, 0, AT.W, AT.H), d = id.data, s = V.s / 100, br = V.l / 100, c = V.c / 100, A = V.h * Math.PI / 180, ca = Math.cos(A), sa = Math.sin(A);
        const m = [.213 + ca * .787 - sa * .213, .715 - ca * .715 - sa * .715, .072 - ca * .072 + sa * .928, .213 - ca * .213 + sa * .143, .715 + ca * .285 + sa * .140, .072 - ca * .072 - sa * .283, .213 - ca * .213 - sa * .787, .715 - ca * .715 + sa * .715, .072 + ca * .928 + sa * .072];
        for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; let r = d[i], gg = d[i + 1], b = d[i + 2]; [r, gg, b] = [r * m[0] + gg * m[1] + b * m[2], r * m[3] + gg * m[4] + b * m[5], r * m[6] + gg * m[7] + b * m[8]]; const L = .299 * r + .587 * gg + .114 * b; r = L + (r - L) * s; gg = L + (gg - L) * s; b = L + (b - L) * s; r = ((r * br) - 128) * c + 128; gg = ((gg * br) - 128) * c + 128; b = ((b * br) - 128) * c + 128; d[i] = r; d[i + 1] = gg; d[i + 2] = b; }
        g.putImageData(id, 0, 0); }
    }
    g.restore();
    atAdjExtra(l, V); atAdjTone(l, V); atRecomp();
  };
  pop.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { V[r.dataset.k] = +r.value; const k = r.dataset.k; r.nextElementSibling.textContent = atNum(r.value) + (k === 'b' || k === 'm' || k === 'px' ? '' : k === 'h' || k === 'ma' ? '°' : '٪'); if (!raf) raf = requestAnimationFrame(apply); });
  document.getElementById('atInv').onchange = e => { V.inv = e.target.checked; if (!raf) raf = requestAnimationFrame(apply); };
  document.getElementById('atGm').onchange = e => { V.gmOn = e.target.checked; if (!raf) raf = requestAnimationFrame(apply); };
  document.getElementById('atLiq').onclick = () => { document.getElementById('atAdjNo').click(); atSetTool('liq'); atToast('اسحب على الرسمة: دفع، لف، شد، تكبير'); };
  // محرر المنحنى
  const cc = document.getElementById('atCurve'), cg = cc.getContext('2d'); let drag = -1;
  const drawC = () => { cg.clearRect(0, 0, 240, 160); cg.strokeStyle = '#45464f'; cg.lineWidth = 1; for (let i = 1; i < 4; i++) { cg.beginPath(); cg.moveTo(i * 60, 0); cg.lineTo(i * 60, 160); cg.moveTo(0, i * 40); cg.lineTo(240, i * 40); cg.stroke(); }
    const lut = atLut(V.cv); cg.strokeStyle = '#fff'; cg.lineWidth = 2; cg.beginPath(); for (let x = 0; x < 256; x += 2) { const X = x / 255 * 240, Y = 160 - lut[x] / 255 * 160; x ? cg.lineTo(X, Y) : cg.moveTo(X, Y); } cg.stroke();
    V.cv.forEach(([x, y]) => { cg.fillStyle = '#3d7bff'; cg.beginPath(); cg.arc(x * 240, 160 - y * 160, 6, 0, 7); cg.fill(); }); };
  const cpos = e => { const r = cc.getBoundingClientRect(); return [atClamp((e.clientX - r.left) / r.width, 0, 1), atClamp(1 - (e.clientY - r.top) / r.height, 0, 1)]; };
  cc.addEventListener('pointerdown', e => { cc.setPointerCapture(e.pointerId); const [x, y] = cpos(e); drag = V.cv.findIndex(([px, py]) => Math.hypot(px - x, (py - y) * .66) < .06); if (drag < 0) { V.cv.push([x, y]); V.cv.sort((a, b) => a[0] - b[0]); drag = V.cv.findIndex(p => p[0] === x); } drawC(); if (!raf) raf = requestAnimationFrame(apply); });
  cc.addEventListener('pointermove', e => { if (drag < 0) return; const [x, y] = cpos(e); const ends = drag === 0 || drag === V.cv.length - 1; V.cv[drag] = [ends ? V.cv[drag][0] : atClamp(x, V.cv[drag - 1][0] + .01, V.cv[drag + 1][0] - .01), y]; drawC(); if (!raf) raf = requestAnimationFrame(apply); });
  cc.addEventListener('pointerup', () => { drag = -1; });
  cc.addEventListener('dblclick', e => { const [x, y] = cpos(e); const k = V.cv.findIndex(([px, py]) => Math.hypot(px - x, py - y) < .06); if (k > 0 && k < V.cv.length - 1) { V.cv.splice(k, 1); drawC(); if (!raf) raf = requestAnimationFrame(apply); } });
  drawC();
  document.getElementById('atAdjNo').onclick = () => { const g = l.g; g.save(); g.globalCompositeOperation = 'copy'; g.drawImage(src, 0, 0); g.restore(); atRecomp(); atClosePop(); };
  document.getElementById('atAdjOk').onclick = () => { const b = { x: 0, y: 0, w: AT.W, h: AT.H, d: src.getContext('2d').getImageData(0, 0, AT.W, AT.H) }; atPush(atPxEntry(l, b)); atClosePop(); atThumbSoon(); };
}

// تعديلات زيادة: ضبابية حركة، بكسلة، حدّة، تشويش، عكس
function atAdjExtra(l, V) {
  const g = l.g, W = AT.W, H = AT.H;
  if (V.m > 0) { const t = AT.tmp.getContext('2d'); t.save(); t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1; t.clearRect(0, 0, W, H); t.drawImage(l.cv, 0, 0); t.restore();
    const n = Math.min(24, Math.max(4, V.m | 0)), a = V.ma * Math.PI / 180; g.save(); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 / n;
    for (let i = 0; i < n; i++) { const o = (i / (n - 1) - .5) * V.m; g.drawImage(AT.tmp, Math.cos(a) * o, Math.sin(a) * o); } g.restore(); }
  if (V.px > 1) { const k = V.px, t = atMk(Math.ceil(W / k), Math.ceil(H / k)), tg = t.getContext('2d'); tg.drawImage(l.cv, 0, 0, t.width, t.height); g.save(); g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = false; g.drawImage(t, 0, 0, t.width * k, t.height * k); g.restore(); }
  if (V.sh > 0 || V.n > 0 || V.inv) {
    const id = g.getImageData(0, 0, W, H), d = id.data, amt = V.sh / 100 * 1.5, nz = V.n * 1.2;
    if (amt) { const o = new Uint8ClampedArray(d); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = (y * W + x) * 4; if (!o[i + 3]) continue; for (let c = 0; c < 3; c++) { const v = o[i + c] * 5 - o[i + c - 4] - o[i + c + 4] - o[i + c - W * 4] - o[i + c + W * 4]; d[i + c] = o[i + c] + (v - o[i + c]) * amt; } } }
    if (nz || V.inv) for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; if (nz) { const r = (Math.random() - .5) * nz; d[i] += r; d[i + 1] += r; d[i + 2] += r; } if (V.inv) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } }
    g.putImageData(id, 0, 0);
  }
}
// المنحنى وخريطة التدرّج
function atLut(pts) { const L = new Uint8ClampedArray(256); for (let x = 0; x < 256; x++) { const f = x / 255; let k = 0; while (k < pts.length - 2 && pts[k + 1][0] < f) k++; const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], t = x1 > x0 ? (f - x0) / (x1 - x0) : 0, s = t * t * (3 - 2 * t); L[x] = (y0 + (y1 - y0) * (t * .5 + s * .5)) * 255; } return L; }
function atAdjTone(l, V) {
  const curve = V.cv.length > 2 || V.cv[0][1] !== 0 || V.cv[1][1] !== 1; if (!curve && !V.gmOn) return;
  const g = l.g, id = g.getImageData(0, 0, AT.W, AT.H), d = id.data, L = atLut(V.cv), c1 = atHex(AT.color2 || '#1d1d1f'), c2 = atHex(AT.color), k = V.gm / 100;
  for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; if (curve) { d[i] = L[d[i]]; d[i + 1] = L[d[i + 1]]; d[i + 2] = L[d[i + 2]]; }
    if (V.gmOn) { const t = (.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]) / 255; for (let c = 0; c < 3; c++) d[i + c] = d[i + c] * (1 - k) + (c1[c] + (c2[c] - c1[c]) * t) * k; } }
  g.putImageData(id, 0, 0);
}
// ===== الإدخال (قلم، لمس، ماوس) =====
function atCancelStroke() {
  const S = AT.stroke; if (!S) return; AT.stroke = null; clearTimeout(AT.qsT); AT.ropeLn = null;
  if (S.tool === 'smudge' || S.tool === 'liq') { const g = atTgt().g; g.save(); g.globalCompositeOperation = 'copy'; g.drawImage(AT.snap, 0, 0); g.restore(); }
  atRecomp();
}
function atSample(x, y) { x = atClamp(x | 0, 0, AT.W - 1); y = atClamp(y | 0, 0, AT.H - 1); const d = AT.comp.getContext('2d').getImageData(x, y, 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); }
function atBindInput(cv) {
  const P = new Map(); let gest = null, lpT = 0;
  const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  // منحنى الضغط: أقل من ١ = أخف، أكثر = أثقل
  const prs = e => { let p = e.pointerType === 'pen' ? (e.pressure || .5) : e.pointerType === 'touch' ? (e.pressure > 0 && e.pressure < 1 ? .5 + e.pressure / 2 : 1) : 1; if (e.pointerType === 'pen' && AT.pc !== 1) p = Math.pow(p, AT.pc); return p; };
  const startGesture = () => {
    atCancelStroke(); clearTimeout(lpT); AT.loupe = null; AT.lasso = null;
    const ps = [...P.values()], [a, b] = ps; const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    gest = { n: ps.length, maxN: ps.length, t0: performance.now(), moved: 0, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), v0: { ...AT.view }, doc: atToDoc(mx, my), m0: [mx, my] };
  };
  cv.addEventListener('pointerdown', e => {
    if (AT.done || !AT.ready) return; try { cv.setPointerCapture(e.pointerId); } catch {} atClosePop(true);
    const [x, y] = pt(e); P.set(e.pointerId, { x, y, type: e.pointerType });
    if (e.pointerType === 'pen') AT.pen = true;
    const touches = [...P.values()].filter(p => p.type === 'touch');
    if (e.pointerType === 'touch' && touches.length >= 2) { if (gest) { gest.n = touches.length; gest.maxN = Math.max(gest.maxN, touches.length); } else startGesture(); return; }
    if (e.pointerType === 'touch' && AT.pen) return; // فيه قلم: الأصابع للتكبير والتحريك بس
    if (e.button === 1 || (e.button === 0 && AT.space)) { gest = { pan: true, x, y, v0: { ...AT.view } }; return; }
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const [dx, dy] = atToDoc(x, y);
    if (AT.pickMode || e.altKey) { AT.color = atSample(dx, dy); atUIColor(); atToast('أخذت اللون', 600); AT.pickMode = false; atUIDrop(); return; }
    if (AT.tool === 'vp') { const vps = AT.vp || atVpDef(); let k = -1, bd = 30; vps.forEach(([vx, vy], i) => { const [sx, sy] = atToScr(vx, vy), d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; k = i; } }); if (k >= 0) AT.vpDrag = k; return; }
    if (AT.tool === 'fill') return atFill(dx, dy);
    if (AT.tool === 'text') return atTextAt(dx, dy);
    if (AT.tool === 'select') { if (AT.selMode === 'wand') return atWand(dx, dy); AT.lasso = { pts: [[dx, dy]], rect: AT.selMode === 'rect' }; if ((AT.selOp || 'new') === 'new') AT.sel = null; AT.dirty = true; return; }
    if (AT.tool === 'transform' && AT.fl) { atTfDown(x, y); return; }
    if (['brush', 'eraser', 'smudge', 'grad', 'liq'].includes(AT.tool)) {
      atStrokeStart(dx, dy, prs(e));
      // ضغط مطوّل بدون حركة = قطّارة
      clearTimeout(lpT); if (AT.tool !== 'grad' && AT.tool !== 'liq') lpT = setTimeout(() => { const S = AT.stroke; if (!S || S.dist * AT.view.z > 6 || S.shape) return; atCancelStroke(); AT.loupe = { s: [x, y], c: atSample(dx, dy) }; AT.dirty = true; try { navigator.vibrate && navigator.vibrate(15); } catch {} }, 480);
    }
  });
  cv.addEventListener('pointermove', e => {
    const [x, y] = pt(e); if (e.pointerType === 'mouse') { AT.hover = [x, y]; if (!AT.stroke) AT.dirty = true; }
    const p = P.get(e.pointerId); if (!p) return; p.x = x; p.y = y;
    if (gest) {
      if (gest.pan) { AT.view.x = gest.v0.x + x - gest.x; AT.view.y = gest.v0.y + y - gest.y; AT.dirty = true; return; }
      const ps = [...P.values()].filter(q => q.type === 'touch'); if (ps.length < 2) return; const [a, b] = ps;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = Math.hypot(a.x - b.x, a.y - b.y), an = Math.atan2(b.y - a.y, b.x - a.x);
      gest.moved = Math.max(gest.moved, Math.abs(d - gest.d0), Math.hypot(mx - gest.m0[0], my - gest.m0[1]));
      const v = AT.view; v.z = atClamp(gest.v0.z * d / gest.d0, .03, 40); v.r = gest.v0.r + an - gest.a0;
      v.x = 0; v.y = 0; const [sx, sy] = atToScr(...gest.doc); v.x = mx - sx; v.y = my - sy; AT.dirty = true; return;
    }
    if (AT.loupe) { const [dx, dy] = atToDoc(x, y); AT.loupe = { s: [x, y], c: atSample(dx, dy) }; AT.dirty = true; return; }
    if (AT.vpDrag != null) { const [dx, dy] = atToDoc(x, y); AT.vp[AT.vpDrag] = [dx, dy]; if (AT.guide === 'persp2') AT.vp[1 - AT.vpDrag][1] = dy; AT.dirty = true; return; }
    if (AT.lasso) { const [dx, dy] = atToDoc(x, y); if (AT.lasso.rect) AT.lasso.pts[1] = [dx, dy]; else AT.lasso.pts.push([dx, dy]); AT.dirty = true; return; }
    if (AT.tf) { atTfMove(x, y); return; }
    if (!AT.stroke) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) { const [cx, cy] = pt(ev); const [dx, dy] = atToDoc(cx, cy); atStrokeTo(dx, dy, prs(ev)); }
    const S = AT.stroke; if (S && S.dist * AT.view.z > 6) clearTimeout(lpT);
    // الشكل السريع: لو وقفت ثابت
    if (S && !S.shape && S.tool !== 'grad' && S.tool !== 'liq') { const q = S.pts[S.pts.length - 1]; if (!S.hold || Math.hypot(q[0] - S.hold[0], q[1] - S.hold[1]) * AT.view.z > 4) { S.hold = q; clearTimeout(AT.qsT); AT.qsT = setTimeout(atQuickShape, 650); } }
  });
  const up = e => {
    const p = P.get(e.pointerId); if (!p) return; P.delete(e.pointerId); clearTimeout(lpT);
    if (gest) {
      if (!gest.pan && P.size === 0) { // نقرة بإصبعين = تراجع، بثلاث = إعادة، بأربع = إخفاء الأدوات
        const quick = performance.now() - gest.t0 < 280 && gest.moved < 14;
        if (quick && gest.maxN === 2) atUndo(); else if (quick && gest.maxN === 3) atUndo(true); else if (quick && gest.maxN >= 4) atToggleUI();
        if (Math.abs(AT.view.r % (Math.PI * 2)) < .07) { AT.view.r = 0; AT.dirty = true; }
        gest = null;
      } else if (gest.pan) gest = null;
      return;
    }
    if (AT.loupe) { AT.color = AT.loupe.c; AT.loupe = null; atUIColor(); atUIDrop(); atAddHist(AT.color); AT.dirty = true; return; }
    if (AT.vpDrag != null) { AT.vpDrag = null; return; }
    if (AT.lasso) return atSelFinish();
    if (AT.tf) { AT.tf = null; return; }
    if (AT.stroke) atStrokeEnd();
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { AT.hover = null; AT.dirty = true; });
  cv.addEventListener('wheel', e => { // عجلة الماوس: تكبير عند المؤشر (Shift للتدوير)
    e.preventDefault(); const [x, y] = pt(e), v = AT.view, doc = atToDoc(x, y);
    if (e.shiftKey) v.r += e.deltaY * .002; else v.z = atClamp(v.z * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0015)), .03, 40);
    v.x = 0; v.y = 0; const [sx, sy] = atToScr(...doc); v.x = x - sx; v.y = y - sy; AT.dirty = true;
  }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  // سحب صورة للوحة
  const st = document.getElementById('atStudio');
  st.addEventListener('dragover', e => { e.preventDefault(); });
  st.addEventListener('drop', e => { e.preventDefault(); const f = [...(e.dataTransfer.files || [])].find(f => f.type.startsWith('image/')); if (f) atInsertImage(f); });
  if (!AT.keys) {
    AT.keys = true;
    addEventListener('paste', e => { if (!document.getElementById('atStudio') || AT.done) return; const it = [...(e.clipboardData && e.clipboardData.items || [])].find(i => i.type.startsWith('image/')); if (it) { e.preventDefault(); atInsertImage(it.getAsFile()); } });
    addEventListener('keydown', e => {
      if (!document.getElementById('atStudio') || AT.done || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if (mod && k === 'z') { e.preventDefault(); atUndo(e.shiftKey); }
      else if (mod && k === 'y') { e.preventDefault(); atUndo(true); }
      else if (mod && k === 'a') { e.preventDefault(); atSelAll(); }
      else if (mod && k === 'd') { e.preventDefault(); AT.sel = null; atSelBar(); AT.dirty = true; }
      else if (mod && k === 'i' && e.shiftKey) { e.preventDefault(); atSelInvert(); }
      else if (k === ' ') { AT.space = true; e.preventDefault(); }
      else if (mod) return;
      else if (k === 'b') atSetTool('brush'); else if (k === 'e') atSetTool('eraser'); else if (k === 's') atSetTool('smudge'); else if (k === 'g') atSetTool('fill'); else if (k === 't') atSetTool('text'); else if (k === 'd') atSetTool('grad'); else if (k === 'l') atSetTool('select'); else if (k === 'v') { if (AT.fl) atFloatCommit(); else atFloatStart(); }
      else if (k === 'i') { AT.pickMode = true; atUIDrop(); }
      else if (k === 'h') { AT.view.f = !AT.view.f; AT.dirty = true; atToast(AT.view.f ? 'العرض مقلوب (مرآة)' : 'العرض طبيعي'); }
      else if (k === '[' || k === ']') { const t = AT.tool in AT.size ? AT.tool : 'brush'; AT.size[t] = atClamp(Math.round(AT.size[t] * (k === ']' ? 1.15 : 1 / 1.15)), 1, 600); atUISliders(); AT.dirty = true; }
      else if (k === '0') atFit(); else if (k === 'tab') { e.preventDefault(); atToggleUI(); }
      else if (k === 'enter' && AT.fl) atFloatCommit(); else if (k === 'escape') { if (AT.fl) atFloatCancel(); else atClosePop(); }
    });
    addEventListener('keyup', e => { if (e.key === ' ') AT.space = false; });
    addEventListener('resize', () => { if (document.getElementById('atStudio')) { atResize(); AT.dirty = true; } });
  }
}
// ===== الصور: صورة بطبقة جديدة، وصورة مرجع =====
async function atInsertImage(file) {
  if (!AT.ready || !file || atNoCollab()) return; if (AT.layers.length >= AT.maxL) return atToast('وصلت حد الطبقات');
  let im; try { im = await createImageBitmap(file); } catch { return atToast('ما قدرت أفتح الصورة'); }
  if (AT.fl) atFloatCommit();
  const k0 = Math.min(1, 3000 / Math.max(im.width, im.height)), w = Math.max(1, Math.round(im.width * k0)), h = Math.max(1, Math.round(im.height * k0)), cv = atMk(w, h); cv.getContext('2d').drawImage(im, 0, 0, w, h); im.close && im.close();
  atStructDo(() => { AT.layers.splice(AT.cur + 1, 0, atLayer('صورة')); AT.cur++; });
  const l = atL(), lv = AT.live.getContext('2d'); lv.clearRect(0, 0, AT.W, AT.H);
  AT.fl = { l, cv, x: AT.W / 2, y: AT.H / 2, r: 0, s: Math.min(1, AT.W * .9 / w, AT.H * .9 / h), fx: false, fy: false, before: l.g.getImageData(0, 0, AT.W, AT.H), isNew: true };
  AT.prevTool = AT.tool === 'transform' ? 'brush' : AT.tool; AT.tool = 'transform'; atUITool(); atSelBar(); atRecomp(); atToast('حرّك الصورة وكبّرها، وبعدين «تم»');
}
function atPickFile(cb) { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => i.files[0] && cb(i.files[0]); i.click(); }
function atRefOpen(file) {
  let r = document.getElementById('atRef'); const url = URL.createObjectURL(file);
  if (!r) {
    r = document.createElement('div'); r.id = 'atRef'; r.className = 'atref';
    r.innerHTML = `<div class="atrefh"><b>مرجع</b><input type="range" min="20" max="100" value="100" title="الشفافية"><button title="قطّارة من الصورة">${atIcon('drop')}</button><button class="x" title="سكّر">✕</button></div><div class="atrefb"><img alt=""></div>`;
    document.getElementById('atStudio').appendChild(r);
    const h = r.querySelector('.atrefh'); let d = null;
    h.addEventListener('pointerdown', e => { if (e.target.closest('button,input')) return; d = [e.clientX - r.offsetLeft, e.clientY - r.offsetTop]; h.setPointerCapture(e.pointerId); });
    h.addEventListener('pointermove', e => { if (d) { r.style.left = (e.clientX - d[0]) + 'px'; r.style.top = (e.clientY - d[1]) + 'px'; } });
    h.addEventListener('pointerup', () => { d = null; });
    r.querySelector('input').oninput = e => { r.querySelector('img').style.opacity = e.target.value / 100; };
    r.querySelector('.x').onclick = () => r.remove();
    r.querySelector('.atrefh button:not(.x)').onclick = () => { AT.refPick = !AT.refPick; r.classList.toggle('pick', AT.refPick); if (AT.refPick) atToast('المس الصورة عشان تاخذ لونها'); };
    r.querySelector('img').addEventListener('pointerdown', e => { if (!AT.refPick && !AT.pickMode) return; const im = e.target, rc = im.getBoundingClientRect(), k = Math.min(rc.width / im.naturalWidth, rc.height / im.naturalHeight), ox = (rc.width - im.naturalWidth * k) / 2, oy = (rc.height - im.naturalHeight * k) / 2;
      const x = (e.clientX - rc.left - ox) / k, y = (e.clientY - rc.top - oy) / k; if (x < 0 || y < 0 || x >= im.naturalWidth || y >= im.naturalHeight) return;
      const c = atMk(1, 1), g = c.getContext('2d'); g.drawImage(im, x, y, 1, 1, 0, 0, 1, 1); const d2 = g.getImageData(0, 0, 1, 1).data; AT.color = '#' + [d2[0], d2[1], d2[2]].map(v => v.toString(16).padStart(2, '0')).join(''); atUIColor(); atUIDrop(); atAddHist(AT.color); AT.refPick = false; AT.pickMode = false; r.classList.remove('pick'); atToast('أخذت اللون من المرجع', 700); });
  }
  r.querySelector('img').src = url;
}
// سحب مقابض التحويل
function atTfDown(x, y) {
  const G = atFloatGeom(), f = AT.fl, near = (p, r = 16) => Math.hypot(p[0] - x, p[1] - y) < r;
  if (near(G.rot, 18)) AT.tf = { k: 'rot', a0: Math.atan2(y - G.ctr[1], x - G.ctr[0]), r0: f.r };
  else if (G.c.some(c => near(c, 18))) AT.tf = { k: 'scale', d0: Math.hypot(x - G.ctr[0], y - G.ctr[1]), s0: f.s };
  else { const [dx, dy] = atToDoc(x, y); AT.tf = { k: 'move', dx: dx - f.x, dy: dy - f.y }; }
}
function atTfMove(x, y) {
  const f = AT.fl, t = AT.tf, G = atFloatGeom(); if (!f || !t) return;
  if (t.k === 'move') { const [dx, dy] = atToDoc(x, y); f.x = dx - t.dx; f.y = dy - t.dy; }
  else if (t.k === 'rot') f.r = t.r0 + Math.atan2(y - G.ctr[1], x - G.ctr[0]) - t.a0;
  else f.s = atClamp(t.s0 * Math.hypot(x - G.ctr[0], y - G.ctr[1]) / t.d0, .05, 20);
  AT.dirty = true;
}

// ===== الواجهة =====
function atSetTool(t) {
  if (AT.fl && t !== 'transform') atFloatCommit();
  if (t === 'select' && AT.tool === 'select') t = 'brush';
  AT.tool = t; AT.pickMode = false; atUITool(); atUISliders(); atSelBar(); AT.dirty = true;
  if (t === 'fill') atToast('المس المكان اللي تبي تعبّيه');
}
function atUITool() { const c = AT.cv; if (c) c.style.cursor = AT.tool === 'transform' ? 'move' : AT.tool === 'vp' ? 'grab' : 'crosshair'; document.querySelectorAll('#atTop [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === AT.tool)); document.querySelectorAll('#atTop [data-a="select"]').forEach(b => b.classList.toggle('on', AT.tool === 'select')); document.querySelectorAll('#atTop [data-a="transform"]').forEach(b => b.classList.toggle('on', AT.tool === 'transform')); }
function atUIColor() { const b = document.getElementById('atColBtn'); if (b) b.style.background = AT.color; }
function atUIDrop() { const b = document.getElementById('atDrop'); if (b) { b.classList.toggle('on', !!AT.pickMode); b.style.background = AT.color; } }
function atUIUndo() { const u = document.querySelector('#atSide [data-a="undo"]'), r = document.querySelector('#atSide [data-a="redo"]'); if (u) u.disabled = !AT.undo.length; if (r) r.disabled = !AT.redo.length; }
function atUISliders() {
  const t = AT.tool in AT.size ? AT.tool : 'brush';
  const s = document.querySelector('#atSize i'), o = document.querySelector('#atOp i');
  if (s) s.style.height = (Math.log(AT.size[t]) / Math.log(600) * 100) + '%'; if (o) o.style.height = (AT.op[t] * 100) + '%';
  atUIDrop();
}
function atAddHist(c) { AT.hist = [c, ...AT.hist.filter(x => x !== c)].slice(0, 12); atPrefs(); }
function atPrefs() { try { localStorage.setItem('tart-prefs', JSON.stringify({ bt: AT.bt, color: AT.color, color2: AT.color2, hist: AT.hist, size: AT.size, stream: AT.stream, pc: AT.pc, rope: AT.rope, bover: AT.bover, custom: AT.custom, imgPal: AT.imgPal })); } catch {} }
let AT_TOAST = 0;
function atToast(t, ms = 1400) { const e = document.getElementById('atToast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(AT_TOAST); AT_TOAST = setTimeout(() => e.classList.remove('on'), ms); }
function atToggleUI() { AT.ui = !AT.ui; document.getElementById('atStudio').classList.toggle('noui', !AT.ui); atToast(AT.ui ? 'رجعت الأدوات' : 'وضع اللوحة كاملة (٤ أصابع أو Tab ترجعها)'); }
function atClosePop(soft) { const p = document.getElementById('atPop'); if (!p || p.hidden) return; if (soft && (AT.popK === 'text' || AT.popK === 'adjust')) return; p.hidden = true; AT.popK = null; document.body.classList.remove('atpopen'); document.querySelectorAll('#atTop .atib.pop').forEach(b => b.classList.remove('pop')); }
function atBindUI() {
  const st = document.getElementById('atStudio');
  st.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.t) { // ضغطة على الأداة المختارة تفتح مكتبة الفرش
      const t = b.dataset.t, was = AT.popK, same = AT.tool === t; atClosePop(); atSetTool(t);
      if (same && ['brush', 'eraser', 'smudge'].includes(t) && was !== 'brushes') atOpenPop('brushes', b);
      return;
    }
    const a = b.dataset.a;
    if (a === 'undo') atUndo(); else if (a === 'redo') atUndo(true);
    else if (a === 'layers' || a === 'color' || a === 'menu') atOpenPop(a, b);
    else if (a === 'adjust') { atClosePop(); atAdjust(); }
    else if (a === 'select') { atClosePop(); atSetTool('select'); }
    else if (a === 'transform') { atClosePop(); if (AT.fl) atFloatCommit(); else atFloatStart(); }
    else if (a === 'image') { atClosePop(); atPickFile(atInsertImage); }
    if (b.dataset.s) atSelAct(b.dataset.s);
    if (b.dataset.g) { const k = b.dataset.g; if (k === 'lin' || k === 'rad') AT.gradMode = k; else if (k === 'tr' || k === 'c2') AT.gradTo = k; else if (k === 'set2') { AT.color2 = AT.color; atToast('صار اللون الثاني'); } atSelBar(); }
    if (b.dataset.vp) { atSetTool('brush'); }
    if (b.dataset.lq) { if (b.dataset.lq === 'done') atSetTool('brush'); else { AT.liqMode = b.dataset.lq; atSelBar(); } }
    if (b.dataset.f) { const f = AT.fl; if (!f) return; const k = b.dataset.f; if (k === 'fx') f.fx = !f.fx; else if (k === 'fy') f.fy = !f.fy; else if (k === 'r90') f.r += Math.PI / 2; else if (k === 'fit') { f.r = 0; f.x = AT.W / 2; f.y = AT.H / 2; f.s = Math.max(AT.W / f.cv.width, AT.H / f.cv.height); } else if (k === 'cancel') atFloatCancel(); else if (k === 'ok') atFloatCommit(); AT.dirty = true; }
  });
  document.getElementById('atDrop').onclick = () => { AT.pickMode = !AT.pickMode; atUIDrop(); if (AT.pickMode) atToast('المس اللوحة عشان تاخذ اللون'); };
  // سلايدر الحجم والشفافية (اسحب فوق/تحت)
  document.querySelectorAll('#atSide .atsl').forEach(el => {
    const set = e => { const r = el.getBoundingClientRect(), f = atClamp(1 - (e.clientY - r.top) / r.height, 0, 1), t = AT.tool in AT.size ? AT.tool : 'brush';
      if (el.dataset.k === 'size') AT.size[t] = Math.max(1, Math.round(Math.pow(600, f))); else AT.op[t] = Math.max(.02, Math.round(f * 100) / 100);
      atUISliders(); const bub = document.getElementById('atBub'); bub.hidden = false; const sz = el.dataset.k === 'size' ? AT.size[t] : 0;
      bub.innerHTML = el.dataset.k === 'size' ? `<i style="width:${Math.min(120, sz * AT.view.z)}px;height:${Math.min(120, sz * AT.view.z)}px;background:${AT.color}"></i><span>${atNum(sz)} بكسل</span>` : `<i style="width:60px;height:60px;background:${AT.color};opacity:${AT.op[t]}"></i><span>${atNum(Math.round(AT.op[t] * 100))}٪</span>`; };
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); el.dragging = true; set(e); });
    el.addEventListener('pointermove', e => el.dragging && set(e));
    const end = () => { el.dragging = false; document.getElementById('atBub').hidden = true; atPrefs(); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  });
  document.getElementById('atFin').onclick = () => atFinish();
}
function atSelAct(k) {
  if (k === 'free' || k === 'rect' || k === 'wand') { AT.selMode = k; atSelBar(); return; }
  if (k.startsWith('op:')) { AT.selOp = k.slice(3); atSelBar(); return; }
  if (k === 'none') { AT.sel = null; atSelBar(); AT.dirty = true; return; }
  if (k === 'done') { atSetTool('brush'); return; }
  if (k === 'all') return atSelAll(); if (k === 'inv') return atSelInvert();
  if (k === 'feather') { const v = prompt('تنعيم الحواف (بكسل)', '8'); if (v) atSelFeather(atClamp(+v || 8, 1, 100)); return; }
  if (k === 'tf') { atFloatStart(); return; }
  const l = atL(); if (!AT.sel) return;
  if (k === 'clear') { const [x0, y0, x1, y1] = AT.sel.box, b = atPatch(l, x0, y0, x1 - x0, y1 - y0); l.g.save(); l.g.globalCompositeOperation = 'destination-out'; l.g.drawImage(AT.sel.mask, 0, 0); l.g.restore(); atPush(atPxEntry(l, b)); atRecomp(); atThumbSoon(); }
  if (k === 'copy') { if (atNoCollab()) return; if (AT.layers.length >= AT.maxL) return atToast('وصلت حد الطبقات'); atStructDo(() => { const n = atLayer('نسخة'); n.g.drawImage(l.cv, 0, 0); n.g.globalCompositeOperation = 'destination-in'; n.g.drawImage(AT.sel.mask, 0, 0); n.g.globalCompositeOperation = 'source-over'; AT.layers.splice(AT.cur + 1, 0, n); AT.cur++; atToast('نسخت لطبقة جديدة'); }); }
}
function atOpenPop(k, btn) {
  const pop = document.getElementById('atPop'); if (AT.popK === k && !pop.hidden) return atClosePop();
  atClosePop(); AT.popK = k; pop.hidden = false; pop.className = 'atpop at' + k; document.body.classList.add('atpopen'); if (btn) btn.classList.add('pop');
  if (k === 'brushes') atBrushUI(pop); else if (k === 'layers') atLayersUI(); else if (k === 'color') atColorUI(pop); else if (k === 'menu') atMenuUI(pop);
}
// مكتبة الفرش
function atBrushUI(pop) {
  const tk = AT.tool in AT.bt ? AT.tool : 'brush', cur = atBr(AT.bt[tk]); AT.bcat = AT.bcat || cur.c;
  const cats = AT_CATS.concat((AT.custom || []).length ? [['mine', 'فرشي']] : []), list = (AT.custom || []).concat(AT_BR).filter(b => b.c === AT.bcat);
  pop.innerHTML = `<div class="athd"><b>${tk === 'eraser' ? 'فرشاة الممحاة' : tk === 'smudge' ? 'فرشاة التلطيخ' : 'مكتبة الفرش'}</b><button class="atbtn sm" id="atBEd">عدّل الفرشاة</button></div>
    <div class="athd atsets"><label>تنعيم الخط <input type="range" id="atStr" min="0" max="95" value="${Math.round((AT.stream[cur.id] != null ? AT.stream[cur.id] : cur.st || 0) * 100)}"></label>
      <label>حبل التثبيت <input type="range" id="atRope" min="0" max="80" value="${AT.rope || 0}"></label>
      <label>حساسية الضغط <input type="range" id="atPc" min="35" max="250" value="${Math.round((AT.pc || 1) * 100)}"></label>
      <label class="atchk"><input type="checkbox" id="atQs" ${AT.qs ? 'checked' : ''}> الشكل السريع</label></div>
    <div class="atbl"><div class="atcats">${cats.map(([c, n]) => `<button data-c="${c}" class="${c === AT.bcat ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="atbrs">${list.map(b => `<button data-b="${b.id}" class="${b.id === cur.id ? 'on' : ''}"><canvas width="300" height="70" data-p="${b.id}"></canvas><span>${esc(b.n)}${AT.bover && AT.bover[b.id] ? ' <em>معدّلة</em>' : ''}</span></button>`).join('')}</div></div>`;
  pop.querySelectorAll('canvas[data-p]').forEach(c => atBrushPreview(c, atBr(c.dataset.p)));
  pop.querySelectorAll('[data-c]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.bcat = b.dataset.c; atBrushUI(pop); });
  pop.querySelectorAll('[data-b]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.bt[tk] = b.dataset.b; if (tk === 'brush') AT.size.brush = atBr(b.dataset.b).def; atPrefs(); atBrushUI(pop); atUISliders(); });
  document.getElementById('atStr').oninput = e => { AT.stream[cur.id] = +e.target.value / 100; atPrefs(); };
  document.getElementById('atRope').oninput = e => { AT.rope = +e.target.value; atPrefs(); };
  document.getElementById('atPc').oninput = e => { AT.pc = +e.target.value / 100; atPrefs(); };
  document.getElementById('atQs').onchange = e => { AT.qs = e.target.checked; };
  document.getElementById('atBEd').onclick = e => { e.stopPropagation(); atBrushEditor(pop, tk); };
}
// محرر الفرشاة: تعدّل خصائصها وتشوف النتيجة، وتحفظها كفرشاة جديدة
const AT_BPROPS = [['min', 'أصغر حجم بالضغط', 0, 1, .01], ['sp', 'التباعد', .01, 1.5, .01], ['flow', 'قوة اللون', .02, 1, .01], ['szP', 'الضغط على الحجم', 0, 1, .01], ['opP', 'الضغط على الشفافية', 0, 1, .01], ['jit', 'تذبذب الحجم', 0, 1, .01], ['sc', 'التشتت', 0, 2, .01], ['taper', 'تدبيب البداية', 0, 150, 1], ['st', 'التنعيم', 0, .95, .01], ['glaze', 'شفافية الضربة', .05, 1, .01]];
function atBrushEditor(pop, tk) {
  const base = atBr(AT.bt[tk]), b = Object.assign({}, base);
  const draw = () => {
    pop.innerHTML = `<div class="athd"><button class="atbtn sm" id="atBBack">رجوع</button><b>تعديل «${esc(b.n)}»</b></div><div class="atbed"><canvas id="atBPv" width="600" height="140"></canvas>
      <label>الرأس <select id="atBTip">${[['hard', 'دائري حاد'], ['round', 'دائري'], ['soft', 'ناعم'], ['pencil', 'رصاص'], ['charcoal', 'فحم'], ['chalk', 'طباشير'], ['water', 'مائي'], ['flat', 'مسطّح'], ['bristle', 'شعيرات'], ['spray', 'بخاخ'], ['glow', 'نيون']].map(([v, n]) => `<option value="${v}"${v === b.tip ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>الدوران <select id="atBRot">${[['', 'ثابت'], ['rand', 'عشوائي'], ['dir', 'مع اتجاه الخط'], ['fixed', 'زاوية ثابتة']].map(([v, n]) => `<option value="${v}"${(b.rot || '') === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      ${AT_BPROPS.map(([k, n, a, z, st]) => `<label>${n} <input type="range" data-k="${k}" min="${a}" max="${z}" step="${st}" value="${b[k] != null ? b[k] : k === 'glaze' ? 1 : 0}"></label>`).join('')}
      <label class="atchk"><input type="checkbox" id="atBGr" ${b.grain ? 'checked' : ''}> حبيبات الورق</label><label class="atchk"><input type="checkbox" id="atBWet" ${b.wet ? 'checked' : ''}> حواف مائية</label>
      <div class="atrow wrap"><button id="atBSave">طبّق عليها</button><button id="atBNew">احفظها فرشاة جديدة</button>${AT.bover && AT.bover[base.id] ? '<button id="atBReset">رجّع الأصلية</button>' : ''}${base.c === 'mine' ? '<button id="atBDel" class="bad">احذفها</button>' : ''}</div></div>`;
    const pv = () => { const c = document.getElementById('atBPv'); if (c) atBrushPreview(c, b, true); }; pv();
    pop.querySelectorAll('.atbed input[type=range]').forEach(r => r.oninput = () => { b[r.dataset.k] = +r.value; pv(); });
    document.getElementById('atBTip').onchange = e => { b.tip = e.target.value; if (b.tip === 'spray' && !b.dots) b.dots = 20; pv(); };
    document.getElementById('atBRot').onchange = e => { b.rot = e.target.value || undefined; if (b.rot === 'fixed' && b.ang == null) b.ang = -.8; pv(); };
    document.getElementById('atBGr').onchange = e => { b.grain = e.target.checked ? 1 : 0; };
    document.getElementById('atBWet').onchange = e => { b.wet = e.target.checked ? 1 : 0; };
    document.getElementById('atBBack').onclick = ev => { ev.stopPropagation(); atBrushUI(pop); };
    document.getElementById('atBSave').onclick = ev => { ev.stopPropagation(); if (base.c === 'mine') { const i = AT.custom.findIndex(x => x.id === base.id); AT.custom[i] = b; } else { const o = {}; ['tip', 'rot', 'ang', 'grain', 'wet', 'dots', ...AT_BPROPS.map(x => x[0])].forEach(k => { if (b[k] !== base[k]) o[k] = b[k]; }); (AT.bover = AT.bover || {})[base.id] = o; } atPrefs(); atToast('تم تعديل الفرشاة'); atBrushUI(pop); };
    document.getElementById('atBNew').onclick = ev => { ev.stopPropagation(); const n = prompt('اسم الفرشاة', b.n + ' (لي)'); if (!n) return; const nb = Object.assign({}, b, { id: 'my' + Date.now().toString(36), c: 'mine', n: n.slice(0, 24) }); (AT.custom = AT.custom || []).unshift(nb); AT.bt[tk] = nb.id; AT.bcat = 'mine'; atPrefs(); atBrushUI(pop); };
    const rs = document.getElementById('atBReset'); if (rs) rs.onclick = ev => { ev.stopPropagation(); delete AT.bover[base.id]; atPrefs(); atBrushUI(pop); };
    const dl = document.getElementById('atBDel'); if (dl) dl.onclick = ev => { ev.stopPropagation(); AT.custom = AT.custom.filter(x => x.id !== base.id); AT.bt[tk] = 'ink'; AT.bcat = 'ink'; atPrefs(); atBrushUI(pop); };
  };
  draw();
}
function atBrushPreview(c, b, big) {
  const g = c.getContext('2d'), save = AT.sym; AT.sym = 'none'; g.clearRect(0, 0, c.width, c.height);
  const W = c.width, H = c.height, sz = big ? Math.min(60, b.def * .8 + 8) : Math.min(28, b.def * .5 + 6), col = big ? '#1d1d1f' : '#f4f1ea';
  if (big) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }
  const t = atMk(W, H), tg = t.getContext('2d'); let lx = 14, ly = H / 2, rem = 0, dir = 0;
  for (let i = 1; i <= 80; i++) { const x = 14 + i / 80 * (W - 28), y = H / 2 + Math.sin(i / 80 * Math.PI * 2) * H * .23, p = Math.sin(i / 80 * Math.PI), dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy); dir = Math.atan2(dy, dx); let tt = rem; const step = Math.max(.8, sz * (b.sp || .1));
    while (tt <= d) { const f = tt / d, tp = b.taper ? Math.min(1, (i / 80 * (W - 28)) / b.taper) : 1; atStamp(tg, b, lx + dx * f, ly + dy * f, p * tp, dir, col, sz, null); tt += step; } rem = tt - d; lx = x; ly = y; }
  if (b.grain) { tg.globalCompositeOperation = 'destination-in'; tg.globalAlpha = 1; tg.fillStyle = atGrain(tg); tg.fillRect(0, 0, W, H); }
  g.globalAlpha = b.glaze || 1; g.drawImage(t, 0, 0); g.globalAlpha = 1; AT.sym = save;
}
// الألوان
function atColorUI(pop) {
  const [r, g, b] = atHex(AT.color), [h, s, v] = atRgb2Hsv(r, g, b); AT.hsv = AT.hsv && atHsv2Hex(...AT.hsv) === AT.color ? AT.hsv : [h, s, v];
  pop.innerHTML = `<div class="athd"><b>الألوان</b><span class="atcur" style="background:${AT.color}"></span><input id="atHex" value="${AT.color.slice(1).toUpperCase()}" maxlength="6" dir="ltr"></div>
    <div class="atsv" id="atSV"><canvas width="240" height="180"></canvas><i></i></div><div class="athue" id="atHue"><i></i></div>
    <small>ألوان متناسقة</small><div class="atharm" id="atHarm"></div>
    <small>آخر الألوان</small><div class="atsws">${(AT.hist.length ? AT.hist : ['#1d1d1f']).map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}</div>
    <small>لوحة الألوان</small><div class="atsws">${AT_PAL.map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}</div>
    <small>ألوان من صورة <button class="atbtn sm" id="atImgPal">اختر صورة</button></small><div class="atsws">${(AT.imgPal || []).map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}</div>
    <small>اللون الثاني (للتدرّج وخريطة التدرّج) <button class="atbtn sm" id="atSet2">خلّ الحالي ثاني</button> <i class="atsw" style="background:${AT.color2 || '#1d1d1f'}"></i></small>`;
  const sv = pop.querySelector('#atSV'), svc = sv.querySelector('canvas'), hue = pop.querySelector('#atHue');
  const draw = () => {
    const [H, S, V] = AT.hsv, g2 = svc.getContext('2d'); g2.fillStyle = atHsv2Hex(H, 1, 1); g2.fillRect(0, 0, 240, 180);
    let gr = g2.createLinearGradient(0, 0, 240, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 240, 180);
    gr = g2.createLinearGradient(0, 0, 0, 180); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, '#000'); g2.fillStyle = gr; g2.fillRect(0, 0, 240, 180);
    sv.querySelector('i').style.left = S * 100 + '%'; sv.querySelector('i').style.top = (1 - V) * 100 + '%'; hue.querySelector('i').style.left = H / 360 * 100 + '%';
    pop.querySelector('.atcur').style.background = AT.color; const hx = document.getElementById('atHex'); if (document.activeElement !== hx) hx.value = AT.color.slice(1).toUpperCase();
    // الألوان المتناسقة: المكمّل، الثلاثي، المتقارب، المنقسم
    const [h0, s0, v0] = AT.hsv, harm = [['مكمّل', [180]], ['ثلاثي', [120, 240]], ['متقارب', [-30, 30]], ['منقسم', [150, 210]]];
    document.getElementById('atHarm').innerHTML = harm.map(([n, ds]) => `<div><span>${n}</span>${[0, ...ds].map(d => { const c = atHsv2Hex((h0 + d + 360) % 360, s0, v0); return `<button data-c="${c}" style="background:${c}"></button>`; }).join('')}</div>`).join('');
    document.querySelectorAll('#atHarm [data-c]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.color = b.dataset.c; const [r2, g3, b3] = atHex(AT.color); AT.hsv = atRgb2Hsv(r2, g3, b3); atUIColor(); atUIDrop(); draw(); });
  };
  const setHsv = (H, S, V) => { AT.hsv = [H, S, V]; AT.color = atHsv2Hex(H, S, V); atUIColor(); atUIDrop(); draw(); };
  const drag = (el, fn) => { const go = e => { const r = el.getBoundingClientRect(); fn(atClamp((e.clientX - r.left) / r.width, 0, 1), atClamp((e.clientY - r.top) / r.height, 0, 1)); };
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); el.d = 1; go(e); }); el.addEventListener('pointermove', e => el.d && go(e)); el.addEventListener('pointerup', () => { el.d = 0; atAddHist(AT.color); }); };
  drag(sv, (x, y) => setHsv(AT.hsv[0], x, 1 - y)); drag(hue, x => setHsv(x * 360, AT.hsv[1], AT.hsv[2]));
  pop.querySelectorAll('.atsws [data-c]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.color = b.dataset.c; const [r2, g3, b3] = atHex(AT.color); AT.hsv = atRgb2Hsv(r2, g3, b3); atUIColor(); atUIDrop(); draw(); });
  document.getElementById('atImgPal').onclick = e => { e.stopPropagation(); atPickFile(async f => { AT.imgPal = await atPaletteFrom(f); atPrefs(); atColorUI(pop); }); };
  document.getElementById('atSet2').onclick = e => { e.stopPropagation(); AT.color2 = AT.color; atPrefs(); atColorUI(pop); };
  document.getElementById('atHex').oninput = e => { const v = e.target.value.replace(/[^0-9a-f]/gi, ''); if (v.length === 6) { AT.color = '#' + v.toLowerCase(); const [r2, g3, b3] = atHex(AT.color); AT.hsv = atRgb2Hsv(r2, g3, b3); atUIColor(); draw(); } };
  draw();
}
// نطلع ١٢ لون من صورة (k-means)
async function atPaletteFrom(file) {
  const im = await createImageBitmap(file), c = atMk(64, 64), g = c.getContext('2d'); g.drawImage(im, 0, 0, 64, 64); const d = g.getImageData(0, 0, 64, 64).data, px = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) px.push([d[i], d[i + 1], d[i + 2]]);
  let cen = Array.from({ length: 12 }, (_, i) => px[Math.floor(i / 12 * px.length)] || [0, 0, 0]);
  for (let it = 0; it < 8; it++) { const sum = cen.map(() => [0, 0, 0, 0]); px.forEach(p => { let bk = 0, bd = 1e9; cen.forEach((q, k) => { const dd = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (dd < bd) { bd = dd; bk = k; } }); const s = sum[bk]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; }); cen = cen.map((q, k) => sum[k][3] ? sum[k].slice(0, 3).map(v => v / sum[k][3]) : q); }
  return [...new Set(cen.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2])).map(q => '#' + q.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')))];
}
function atRgb2Hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, mx ? d / mx : 0, mx]; }
function atHsv2Hex(h, s, v) { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); }
// الطبقات
function atLayersUI() {
  const pop = document.getElementById('atPop'); if (!pop || AT.popK !== 'layers' || pop.hidden) return;
  const open = AT.lopen, G = AT.groups || {}; let lastG = null, rows = '';
  const list = AT.layers.map((l, i) => ({ l, i })).reverse();
  list.forEach(({ l, i }) => {
    if (l.grp && G[l.grp] && l.grp !== lastG) { const g = G[l.grp]; rows += `<div class="atgrph" data-g="${l.grp}"><button class="atgo" data-gt="${l.grp}">${g.open === false ? '▸' : '▾'}</button><span class="atln">${esc(g.name)}<small>مجموعة · ${atNum(Math.round(g.op * 100))}٪</small></span><button class="atv${g.vis ? ' on' : ''}" data-gv="${l.grp}">${atIcon('eye')}</button><button class="atmore" data-gm="${l.grp}">${atIcon('dots')}</button></div>
      ${AT.gopen === l.grp ? `<div class="atlo"><label>شفافية المجموعة <input type="range" min="0" max="100" value="${Math.round(g.op * 100)}" data-go="${l.grp}"></label><div class="atrow wrap"><button data-gop="ren">اسم</button><button data-gop="ungroup">فك المجموعة</button></div></div>` : ''}`; }
    lastG = l.grp || null;
    if (l.grp && G[l.grp] && G[l.grp].open === false) return;
    rows += `<div class="atly${i === AT.cur ? ' on' : ''}${l.clip ? ' clip' : ''}${l.grp ? ' ing' : ''}" data-i="${i}">
      <canvas width="64" height="48" data-th="${i}" class="${l.mask && !l.mEdit && i === AT.cur ? 'sel' : ''}"></canvas>${l.mask ? `<canvas width="48" height="36" data-mk="${i}" class="atmk${l.mEdit ? ' sel' : ''}" title="القناع (اضغط عشان تعدّله)"></canvas>` : ''}<span class="atln">${esc(l.name)}<small>${l.blend !== 'source-over' ? AT_BLEND.find(b => b[0] === l.blend)[1] + ' · ' : ''}${atNum(Math.round(l.op * 100))}٪${l.lock ? ' · قفل' : ''}${l.clip ? ' · قص' : ''}${l.mask ? (l.mEdit ? ' · تعدّل القناع' : ' · قناع') : ''}</small></span>
      <button class="atv${l.vis ? ' on' : ''}" data-v="${i}" title="إظهار">${atIcon('eye')}</button><button class="atmore" data-m="${i}">${atIcon('dots')}</button></div>
      ${open === l.id ? `<div class="atlo" data-i="${i}">
        <label>الشفافية <input type="range" min="0" max="100" value="${Math.round(l.op * 100)}" data-o="${i}"></label>
        <label>الدمج <select data-bl="${i}">${AT_BLEND.map(([v, n]) => `<option value="${v}"${v === l.blend ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="atrow wrap"><button data-op="clip" class="${l.clip ? 'on' : ''}">قص على اللي تحت</button><button data-op="lock" class="${l.lock ? 'on' : ''}">قفل الشفافية</button>
          ${l.mask ? `<button data-op="mtoggle" class="${l.mOn === false ? '' : 'on'}">القناع شغّال</button><button data-op="mapply">طبّق القناع</button><button data-op="mdel">احذف القناع</button>` : '<button data-op="madd">أضف قناع</button>'}
          ${l.grp ? '<button data-op="gout">طلّعها من المجموعة</button>' : '<button data-op="group">جمّعها مع اللي تحت</button>'}
          <button data-op="dup">تكرار</button><button data-op="merge">دمج تحت</button><button data-op="up">فوق</button><button data-op="down">تحت</button><button data-op="clear">مسح</button><button data-op="ren">اسم</button><button data-op="del" class="bad">حذف</button></div></div>` : ''}`;
  });
  pop.innerHTML = `<div class="athd"><b>الطبقات</b><small>${atNum(AT.layers.length)} من ${atNum(AT.maxL)}</small><button class="atib sm" id="atLAdd" title="طبقة جديدة">${atIcon('plus')}</button></div>
    <div class="atls">${rows}</div><div class="atbgrow"><span>الخلفية</span><button id="atBg" style="background:${AT.bg}"></button><small>(تاخذ اللون الحالي)</small></div>`;
  pop.querySelectorAll('canvas[data-th]').forEach(c => { const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 48); g.drawImage(AT.layers[+c.dataset.th].cv, 0, 0, 64, 48); });
  pop.querySelectorAll('canvas[data-mk]').forEach(c => { const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 48, 36); g.drawImage(AT.layers[+c.dataset.mk].mask, 0, 0, 48, 36); c.onclick = e => { e.stopPropagation(); const l = AT.layers[+c.dataset.mk]; AT.cur = +c.dataset.mk; l.mEdit = !l.mEdit; atToast(l.mEdit ? 'تعدّل القناع: الأبيض يبيّن والممحاة تخفي' : 'رجعت ترسم على الطبقة'); atLayersUI(); }; });
  pop.querySelectorAll('.atly').forEach(r => r.onclick = e => { if (e.target.closest('button,canvas[data-mk]')) return; e.stopPropagation(); if (atCollab() && AT.layers[+r.dataset.i].owner !== S.me) return atToast('هذي طبقة لاعب ثاني'); AT.cur = +r.dataset.i; const l = atL(); if (l.mask && l.mEdit) l.mEdit = false; atLayersUI(); });
  pop.querySelectorAll('[data-v]').forEach(b => b.onclick = e => { e.stopPropagation(); const l = AT.layers[+b.dataset.v]; atStructDo(() => { l.vis = !l.vis; }); });
  pop.querySelectorAll('[data-m]').forEach(b => b.onclick = e => { e.stopPropagation(); const l = AT.layers[+b.dataset.m]; AT.cur = +b.dataset.m; AT.lopen = AT.lopen === l.id ? null : l.id; atLayersUI(); });
  pop.querySelectorAll('[data-o]').forEach(r => { let b0 = null; r.oninput = () => { const l = AT.layers[+r.dataset.o]; if (!b0) b0 = atStruct(); l.op = +r.value / 100; atRecomp(); }; r.onchange = () => { if (b0) { atPush({ t: 'st', b: b0, a: atStruct(), mem: 1000 }); b0 = null; atLayersUI(); } }; });
  pop.querySelectorAll('[data-bl]').forEach(s => s.onchange = () => { const l = AT.layers[+s.dataset.bl]; atStructDo(() => { l.blend = s.value; }); });
  pop.querySelectorAll('[data-op]').forEach(b => b.onclick = e => { e.stopPropagation(); atLayerOp(b.dataset.op); });
  pop.querySelectorAll('[data-gt]').forEach(b => b.onclick = e => { e.stopPropagation(); const g = AT.groups[b.dataset.gt]; g.open = g.open === false; atLayersUI(); });
  pop.querySelectorAll('[data-gv]').forEach(b => b.onclick = e => { e.stopPropagation(); const k = b.dataset.gv; atStructDo(() => { AT.groups[k].vis = !AT.groups[k].vis; }); });
  pop.querySelectorAll('[data-gm]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.gopen = AT.gopen === b.dataset.gm ? null : b.dataset.gm; atLayersUI(); });
  pop.querySelectorAll('[data-go]').forEach(r => { let b0 = null; r.oninput = () => { if (!b0) b0 = atStruct(); AT.groups[r.dataset.go].op = +r.value / 100; atRecomp(); }; r.onchange = () => { if (b0) { atPush({ t: 'st', b: b0, a: atStruct(), mem: 1000 }); b0 = null; } }; });
  pop.querySelectorAll('[data-gop]').forEach(b => b.onclick = e => { e.stopPropagation(); const k = AT.gopen; if (!k) return;
    if (b.dataset.gop === 'ren') { const n = prompt('اسم المجموعة', AT.groups[k].name); if (n) atStructDo(() => { AT.groups[k].name = n.slice(0, 20); }); }
    else atStructDo(() => { AT.layers.forEach(l => { if (l.grp === k) l.grp = null; }); delete AT.groups[k]; AT.gopen = null; }); });
  document.getElementById('atLAdd').onclick = e => { e.stopPropagation(); if (atNoCollab()) return; if (AT.layers.length >= AT.maxL) return atToast(`أكثر شي ${atNum(AT.maxL)} طبقة بهالمقاس`); atStructDo(() => { const n = atLayer('طبقة ' + atNum(AT.layers.length + 1)); n.grp = atL() ? atL().grp : null; AT.layers.splice(AT.cur + 1, 0, n); AT.cur++; }); };
  document.getElementById('atBg').onclick = e => { e.stopPropagation(); atStructDo(() => { AT.bg = AT.color; }); };
}
function atLayerOp(op) {
  const i = AT.cur, l = AT.layers[i];
  if (atCollab() && !['lock', 'clear'].includes(op)) return atNoCollab();
  if (op === 'madd') return atStructDo(() => atAddMask(l));
  if (op === 'mdel') return atStructDo(() => { l.mask = null; l.mg = null; l.mEdit = false; });
  if (op === 'mtoggle') return atStructDo(() => { l.mOn = l.mOn === false; });
  if (op === 'mapply') { const before = atPatch(l, 0, 0, AT.W, AT.H), b0 = atStruct(); l.g.save(); l.g.globalCompositeOperation = 'destination-in'; l.g.drawImage(l.mask, 0, 0); l.g.restore(); const px = atPxEntry(l, before); l.mask = null; l.mg = null; l.mEdit = false; atPush({ t: 'combo', list: [px, { t: 'st', b: b0, a: atStruct() }], mem: px.mem }); atRecomp(); atLayersUI(); return; }
  if (op === 'group') { if (i === 0) return atToast('ما فيه طبقة تحتها'); return atStructDo(() => { const d = AT.layers[i - 1], k = d.grp || ('g' + Date.now().toString(36)); if (!AT.groups[k]) AT.groups[k] = { name: 'مجموعة ' + atNum(Object.keys(AT.groups).length + 1), vis: true, op: 1, open: true }; d.grp = k; l.grp = k; }); }
  if (op === 'gout') return atStructDo(() => { l.grp = null; });
  if (op === 'clip') return atStructDo(() => { l.clip = !l.clip && i > 0; });
  if (op === 'lock') return atStructDo(() => { l.lock = !l.lock; });
  if (op === 'dup') { if (AT.layers.length >= AT.maxL) return atToast(`أكثر شي ${atNum(AT.maxL)} طبقة`); return atStructDo(() => { const n = atLayer(l.name + ' نسخة'); n.g.drawImage(l.cv, 0, 0); Object.assign(n, { op: l.op, blend: l.blend }); AT.layers.splice(i + 1, 0, n); AT.cur = i + 1; }); }
  if (op === 'up' && i < AT.layers.length - 1) return atStructDo(() => { AT.layers.splice(i, 1); AT.layers.splice(i + 1, 0, l); AT.cur = i + 1; });
  if (op === 'down' && i > 0) return atStructDo(() => { AT.layers.splice(i, 1); AT.layers.splice(i - 1, 0, l); AT.cur = i - 1; });
  if (op === 'del') { if (AT.layers.length <= 1) return atToast('لازم تبقى طبقة وحدة'); AT.lopen = null; return atStructDo(() => { AT.layers.splice(i, 1); AT.cur = Math.max(0, i - 1); }); }
  if (op === 'clear') { const b = atPatch(l, 0, 0, AT.W, AT.H); l.g.clearRect(0, 0, AT.W, AT.H); atPush(atPxEntry(l, b)); atRecomp(); atLayersUI(); return; }
  if (op === 'ren') { const n = prompt('اسم الطبقة', l.name); if (n) atStructDo(() => { l.name = n.slice(0, 20); }); return; }
  if (op === 'merge' && i > 0) { // ندمجها بالطبقة اللي تحتها (بنمط الدمج والشفافية)
    const d = AT.layers[i - 1], before = atPatch(d, 0, 0, AT.W, AT.H), b0 = atStruct();
    d.g.save(); d.g.globalAlpha = l.op; d.g.globalCompositeOperation = l.clip ? 'source-atop' : l.blend; d.g.drawImage(l.cv, 0, 0); d.g.restore();
    const px = atPxEntry(d, before); AT.layers.splice(i, 1); AT.cur = i - 1; AT.lopen = null;
    atPush({ t: 'combo', list: [px, { t: 'st', b: b0, a: atStruct() }], mem: px.mem }); atRecomp(); atLayersUI(); return;
  }
}
// القائمة
function atMenuUI(pop) {
  const host = S && atHost(), G = AT.guide;
  pop.innerHTML = `<div class="athd"><b>القائمة</b></div><div class="atmenu">
    <div class="atsub">صورة</div><div class="atrow wrap"><button data-mm="img">${atIcon('img')} أضف صورة</button><button data-mm="ref">صورة مرجع</button><button data-mm="text">${atIcon('text')} نص</button></div>
    <div class="atsub">التناظر</div><div class="atrow wrap">${[['none', 'بدون'], ['v', 'عمودي'], ['h', 'أفقي'], ['quad', '٤ جهات'], ['radial', 'دائري ٨']].map(([k, n]) => `<button data-sym="${k}" class="${AT.sym === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="atsub">دليل الرسم</div><div class="atrow wrap">${[['none', 'بدون'], ['grid', 'شبكة'], ['persp1', 'منظور نقطة'], ['persp2', 'منظور نقطتين']].map(([k, n]) => `<button data-gd="${k}" class="${G === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    ${G !== 'none' ? `<div class="atrow wrap"><button data-mm="assist" class="${AT.assist ? 'on' : ''}">مساعدة الرسم (الخط يمشي على الدليل)</button>${G === 'grid' ? `<label>حجم المربع <input type="range" id="atGs" min="20" max="300" value="${AT.gridSz}"></label>` : '<button data-mm="vp">عدّل نقاط المنظور</button>'}</div>` : ''}
    <div class="atsub">العرض</div><div class="atrow wrap"><button data-mm="flip" class="${AT.view.f ? 'on' : ''}">اقلب العرض (مرآة)</button><button data-mm="fit">رجّع اللوحة للنص</button><button data-mm="ui">إخفاء الأدوات</button><button data-mm="stream">وضع البث</button><button data-mm="gal">المعرض الدائم</button></div>
    <div class="atsub">التعبئة</div><label>الحساسية <input type="range" id="atTol" min="0" max="80" value="${AT.fillTol == null ? 22 : AT.fillTol}"></label>
    <div class="atsub">التحريك والمشروع</div><div class="atrow wrap"><button data-mm="anim" class="${AT.anim && AT.anim.on ? 'on' : ''}">وضع التحريك (إطارات)</button><button data-mm="psave">احفظ المشروع</button><button data-mm="popen">افتح مشروع</button></div>
    <div class="atsub">تصدير</div><div class="atrow wrap"><button data-mm="png">PNG</button><button data-mm="jpg">JPG</button><button data-mm="psd">PSD بالطبقات</button><button data-mm="mytl">فيديو تسريع رسمتي</button></div>
    ${host ? '<button data-mm="end" class="bad">إنهاء الرسم للكل وعرض الرسومات</button>' : ''}
    <button data-mm="quit" class="bad">اطلع من اللعبة</button>
    <small class="atkeys">اختصارات: B فرشاة · E ممحاة · S تلطيخ · G تعبئة · D تدرّج · L تحديد · V تحويل · T نص · I قطّارة · H مرآة · [ ] الحجم · Ctrl+Z تراجع · Ctrl+A تحديد الكل · Ctrl+D إلغاء التحديد · Ctrl+V لصق صورة · مسافة+سحب تحريك · 0 ملء الشاشة · Tab إخفاء الأدوات<br>باللمس: إصبعين تكبير وتدوير · نقرة بإصبعين تراجع · بثلاث إعادة · بأربع إخفاء الأدوات · ضغط مطوّل قطّارة</small></div>`;
  pop.querySelectorAll('[data-sym]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.sym = b.dataset.sym; atMenuUI(pop); AT.dirty = true; });
  pop.querySelectorAll('[data-gd]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.guide = b.dataset.gd; if (AT.guide.startsWith('persp')) atVpDef(); atMenuUI(pop); AT.dirty = true; });
  document.getElementById('atTol').oninput = e => { AT.fillTol = +e.target.value; };
  const gs = document.getElementById('atGs'); if (gs) gs.oninput = e => { AT.gridSz = +e.target.value; AT.dirty = true; };
  pop.querySelectorAll('[data-mm]').forEach(b => b.onclick = async e => {
    e.stopPropagation(); const k = b.dataset.mm;
    if (k === 'png' || k === 'jpg') { atCompose(AT.comp, null); AT.comp.toBlob(bl => atDownload(bl, 'tarteeb-drawing.' + k), k === 'png' ? 'image/png' : 'image/jpeg', .95); }
    else if (k === 'psd') { atToast('نجهّز ملف PSD…', 3000); setTimeout(() => atDownload(atPSD(), 'tarteeb-drawing.psd'), 30); }
    else if (k === 'mytl') { atClosePop(); AT.capDirty = true; await atCapture(); delete ATV.tl[S.g.key + ':' + S.me]; atToast('نجهّز الفيديو…', 2500); atVideo(S.me, S.players.find(p => p.id === S.me).name, true); }
    else if (k === 'img') { atClosePop(); atPickFile(atInsertImage); }
    else if (k === 'anim') { atClosePop(); atAnimToggle(); }
    else if (k === 'psave') { atClosePop(); atSaveProject(); }
    else if (k === 'popen') { atClosePop(); atOpenProject(); }
    else if (k === 'ref') { atClosePop(); atPickFile(atRefOpen); }
    else if (k === 'text') { atClosePop(); atSetTool('text'); atToast('المس مكان النص'); }
    else if (k === 'assist') { AT.assist = !AT.assist; atMenuUI(pop); }
    else if (k === 'vp') { atClosePop(); atSetTool('vp'); }
    else if (k === 'flip') { AT.view.f = !AT.view.f; AT.dirty = true; atMenuUI(pop); }
    else if (k === 'fit') { atFit(); atClosePop(); }
    else if (k === 'ui') { atClosePop(); atToggleUI(); }
    else if (k === 'stream') { atClosePop(); atStreamToggle(); }
    else if (k === 'gal') { atClosePop(); window.open('/gallery.html', '_blank'); }
    else if (k === 'end') { if (confirm('تنهي الرسم للكل وتبدأ العرض؟')) { send({ t: 'aend' }); atClosePop(); } }
    else if (k === 'quit') { if (confirm('تطلع؟ رسمتك بتروح')) { atClosePop(); document.getElementById('quit2').click(); } }
  });
}
// ===== ملف PSD بالطبقات (يفتح بفوتوشوب وبروكريت) =====
function atPSD() {
  const W = AT.W, H = AT.H, parts = [], u8 = a => parts.push(a instanceof Uint8Array ? a : new Uint8Array(a));
  const be = (n, b) => { const a = new Uint8Array(b); for (let i = b - 1; i >= 0; i--) { a[i] = n & 255; n = Math.floor(n / 256); } return a; };
  const str = t => new Uint8Array([...t].map(c => c.charCodeAt(0)));
  // PackBits لكل سطر
  const pack = (row) => { const out = []; let i = 0; const n = row.length; while (i < n) { let j = i; while (j + 1 < n && row[j + 1] === row[i] && j - i < 127) j++; if (j > i) { out.push(257 - (j - i + 1) & 255, row[i]); i = j + 1; continue; } let k = i; while (k + 1 < n && row[k + 1] !== row[k] && k - i < 127) k++; if (k + 1 < n && row[k + 1] === row[k]) k--; if (k < i) k = i; out.push(k - i, ...row.subarray(i, k + 1)); i = k + 1; } return out; };
  const chan = (data, w, h, c) => { const rows = [], lens = []; const row = new Uint8Array(w); for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) row[x] = data[(y * w + x) * 4 + c]; const p = pack(row); rows.push(p); lens.push(p.length); } return { rows, lens }; };
  const BK = { 'source-over': 'norm', multiply: 'mul ', screen: 'scrn', overlay: 'over', 'soft-light': 'sLit', 'hard-light': 'hLit', 'color-dodge': 'div ', 'color-burn': 'idiv', darken: 'dark', lighten: 'lite', difference: 'diff', lighter: 'lddg', hue: 'hue ', saturation: 'sat ', color: 'colr', luminosity: 'lum ' };
  const recs = [], chData = [];
  AT.layers.forEach((l, li) => {
    const pc = l.mask && l.mOn !== false ? (() => { const t = atMk(W, H), tg = t.getContext('2d'); tg.drawImage(l.cv, 0, 0); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(l.mask, 0, 0); return t; })() : l.cv, pg = pc.getContext('2d'), gop = l.grp && AT.groups[l.grp] ? AT.groups[l.grp].op * (AT.groups[l.grp].vis ? 1 : 0) : 1;
    const d = pg.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, sub = pg.getImageData(x0, y0, w, h).data;
    const chans = [3, 0, 1, 2].map(c => chan(sub, w, h, c)), ids = [-1, 0, 1, 2];
    const lenOf = c => 2 + c.lens.length * 2 + c.lens.reduce((a, b) => a + b, 0);
    const name = 'Layer ' + (li + 1), pn = name.length + 1, pad = (4 - (pn % 4)) % 4;
    const uni = [...l.name], ul = 4 + uni.length * 2, upad = ul % 4 ? 4 - ul % 4 : 0;
    const extra = [be(0, 4), be(0, 4), [name.length], str(name), new Uint8Array(pad), str('8BIM'), str('luni'), be(ul + upad, 4), be(uni.length, 4), ...uni.map(c => be(c.charCodeAt(0), 2)), new Uint8Array(upad)];
    const exLen = extra.reduce((a, b) => a + b.length, 0);
    recs.push([be(y0, 4), be(x0, 4), be(y1 + 1, 4), be(x1 + 1, 4), be(4, 2), ...chans.flatMap((c, i) => [be(ids[i] & 0xffff, 2), be(lenOf(c), 4)]), str('8BIM'), str(BK[l.blend] || 'norm'), [Math.round(l.op * gop * 255)], [l.clip ? 1 : 0], [l.vis ? 8 : 10], [0], be(exLen, 4), ...extra]);
    chData.push(chans.flatMap(c => [be(1, 2), ...c.lens.map(n => be(n, 2)), new Uint8Array(c.rows.flat())]));
  });
  const flat = a => a.reduce((s, x) => s + (x.length), 0);
  let info = [be(AT.layers.length, 2), ...recs.flat(), ...chData.flat()].map(x => x instanceof Uint8Array ? x : new Uint8Array(x)); let infoLen = flat(info); if (infoLen % 4) { info.push(new Uint8Array(4 - infoLen % 4)); infoLen = flat(info); }
  u8(str('8BPS')); u8(be(1, 2)); u8(new Uint8Array(6)); u8(be(3, 2)); u8(be(H, 4)); u8(be(W, 4)); u8(be(8, 2)); u8(be(3, 2));
  u8(be(0, 4)); u8(be(0, 4));
  u8(be(infoLen + 4 + 4, 4)); u8(be(infoLen, 4)); info.forEach(u8); u8(be(0, 4));
  // الصورة المدموجة
  atCompose(AT.comp, null); const md = AT.comp.getContext('2d').getImageData(0, 0, W, H).data, mc = [0, 1, 2].map(c => chan(md, W, H, c));
  u8(be(1, 2)); mc.forEach(c => c.lens.forEach(n => u8(be(n, 2)))); mc.forEach(c => u8(new Uint8Array(c.rows.flat())));
  return new Blob(parts, { type: 'image/vnd.adobe.photoshop' });
}
function atDownload(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
let AT_THT = 0; function atThumbSoon() { clearTimeout(AT_THT); AT_THT = setTimeout(() => { if (AT.anim && AT.anim.on) atAnimUI(); if (AT.popK === 'layers') atLayersUI(); }, 300); }

// ===== التحريك: كل طبقة إطار، بصل، تشغيل، وتصدير GIF وفيديو =====
function atAnimToggle() {
  if (atNoCollab()) return;
  AT.anim = AT.anim || { on: false, fps: 8, onion: 1 }; AT.anim.on = !AT.anim.on; AT.anim.play = null;
  if (AT.anim.on && AT.layers.length < 2) atStructDo(() => { AT.layers.push(atLayer('إطار ٢')); });
  atAnimUI(); atRecomp(); atToast(AT.anim.on ? 'وضع التحريك: كل طبقة إطار' : 'رجعت للرسم العادي');
}
function atAnimUI() {
  let el = document.getElementById('atAnim'); const A = AT.anim;
  if (!A || !A.on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'atAnim'; el.className = 'atanim'; document.getElementById('atStudio').appendChild(el); }
  el.innerHTML = `<div class="atanb"><button data-an="play">${A.play != null ? 'وقف' : 'شغّل'}</button><label>السرعة <input type="range" id="atFps" min="1" max="24" value="${A.fps}"> ${atNum(A.fps)}</label><label>البصل <input type="range" id="atOn" min="0" max="3" value="${A.onion}"></label>
    <button data-an="add">+ إطار</button><button data-an="dup">كرّر الإطار</button><button data-an="gif">GIF</button><button data-an="vid">فيديو</button><button data-an="off">طلّع</button></div>
    <div class="atfrs">${AT.layers.map((l, i) => `<button data-fr="${i}" class="${i === (A.play != null ? A.play : AT.cur) ? 'on' : ''}"><canvas width="80" height="${Math.round(80 * AT.H / AT.W)}" data-ft="${i}"></canvas><small>${atNum(i + 1)}</small></button>`).join('')}</div>`;
  el.querySelectorAll('canvas[data-ft]').forEach(c => { const g = c.getContext('2d'); g.fillStyle = AT.bg; g.fillRect(0, 0, c.width, c.height); g.drawImage(AT.layers[+c.dataset.ft].cv, 0, 0, c.width, c.height); });
  el.querySelectorAll('[data-fr]').forEach(b => b.onclick = () => { AT.cur = +b.dataset.fr; atAnimUI(); atRecomp(); });
  document.getElementById('atFps').oninput = e => { A.fps = +e.target.value; };
  document.getElementById('atOn').oninput = e => { A.onion = +e.target.value; atRecomp(); };
  el.querySelectorAll('[data-an]').forEach(b => b.onclick = () => { const k = b.dataset.an;
    if (k === 'off') return atAnimToggle();
    if (k === 'play') { if (A.play != null) { A.play = null; clearInterval(A.t); } else { A.play = AT.cur; A.t = setInterval(() => { if (!AT.anim || A.play == null) return clearInterval(A.t); A.play = (A.play + 1) % AT.layers.length; atRecomp(); el.querySelectorAll('[data-fr]').forEach((x, i) => x.classList.toggle('on', i === A.play)); }, 1000 / A.fps); } b.textContent = A.play != null ? 'وقف' : 'شغّل'; atRecomp(); return; }
    if (k === 'add' || k === 'dup') { if (AT.layers.length >= AT.maxL) return atToast('وصلت حد الإطارات'); atStructDo(() => { const n = atLayer('إطار ' + atNum(AT.layers.length + 1)); if (k === 'dup') n.g.drawImage(atL().cv, 0, 0); AT.layers.splice(AT.cur + 1, 0, n); AT.cur++; }); atAnimUI(); return; }
    if (k === 'gif') { atToast('نجهّز GIF…', 3000); setTimeout(() => atDownload(atGIF(), 'tarteeb-animation.gif'), 30); return; }
    if (k === 'vid') atAnimVideo();
  });
}
function atAnimFrames(max) { const k = Math.min(1, max / Math.max(AT.W, AT.H)), w = Math.round(AT.W * k), h = Math.round(AT.H * k); return AT.layers.map(l => { const c = atMk(w, h), g = c.getContext('2d'); g.fillStyle = AT.bg; g.fillRect(0, 0, w, h); g.drawImage(l.cv, 0, 0, w, h); return c; }); }
async function atAnimVideo() {
  if (!window.MediaRecorder) return atToast('جهازك ما يدعم تسجيل الفيديو');
  const fr = atAnimFrames(1080), cv = atMk(fr[0].width - fr[0].width % 2, fr[0].height - fr[0].height % 2), g = cv.getContext('2d');
  const mt = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)); if (!mt) return atToast('ما قدرت أسوي فيديو');
  const rec = new MediaRecorder(cv.captureStream(30), { mimeType: mt, videoBitsPerSecond: 6e6 }), parts = []; rec.ondataavailable = e => e.data.size && parts.push(e.data); const done = new Promise(ok => rec.onstop = ok);
  rec.start(250); const loops = Math.max(1, Math.ceil(6 * AT.anim.fps / fr.length));
  for (let L = 0; L < loops; L++) for (const f of fr) { g.drawImage(f, 0, 0); atToast(`نسجّل الفيديو ${atNum(L + 1)}/${atNum(loops)}`, 800); await new Promise(r => setTimeout(r, 1000 / AT.anim.fps)); }
  rec.stop(); await done; atDownload(new Blob(parts, { type: mt.split(';')[0] }), `tarteeb-animation.${mt.includes('mp4') ? 'mp4' : 'webm'}`);
}
// كاتب GIF بسيط (لوحة ألوان ثابتة ٢٥٢ لون + LZW)
function atGIF() {
  const fr = atAnimFrames(512), w = fr[0].width, h = fr[0].height, out = [], B = (...a) => a.forEach(x => out.push(x & 255)), W16 = n => B(n, n >> 8);
  const pal = []; for (let r = 0; r < 6; r++) for (let g = 0; g < 7; g++) for (let b = 0; b < 6; b++) pal.push([r * 51, Math.round(g * 42.5), b * 51]); while (pal.length < 256) pal.push([0, 0, 0]);
  [...'GIF89a'].forEach(c => B(c.charCodeAt(0))); W16(w); W16(h); B(0xf7, 0, 0); pal.forEach(c => B(...c));
  B(0x21, 0xff, 11); [...'NETSCAPE2.0'].forEach(c => B(c.charCodeAt(0))); B(3, 1, 0, 0, 0);
  const delay = Math.round(100 / AT.anim.fps);
  fr.forEach(c => {
    const d = c.getContext('2d').getImageData(0, 0, w, h).data, idx = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) { const x = p % w, y = (p / w) | 0, t = ((x & 1) * 2 + (y & 1) * 3) % 4 / 4 - .375; idx[p] = Math.round(atClamp(d[i] / 51 + t, 0, 5)) * 42 + Math.round(atClamp(d[i + 1] / 42.5 + t, 0, 6)) * 6 + Math.round(atClamp(d[i + 2] / 51 + t, 0, 5)); }
    B(0x21, 0xf9, 4, 0); W16(delay); B(0, 0); B(0x2c); W16(0); W16(0); W16(w); W16(h); B(0); B(8);
    // LZW
    const bytes = []; let cur = 0, nb = 0; const put = (code, size) => { cur |= code << nb; nb += size; while (nb >= 8) { bytes.push(cur & 255); cur >>= 8; nb -= 8; } };
    let dict = new Map(), size = 9, next = 258; put(256, size); let prefix = idx[0];
    for (let i = 1; i < idx.length; i++) { const k = idx[i], key = prefix * 256 + k; const v = dict.get(key); if (v !== undefined) { prefix = v; continue; } put(prefix, size); if (next < 4096) { dict.set(key, next++); if (next > (1 << size) && size < 12) size++; } else { put(256, size); dict = new Map(); size = 9; next = 258; } prefix = k; }
    put(prefix, size); put(257, size); if (nb) bytes.push(cur & 255);
    for (let i = 0; i < bytes.length; i += 255) { const n = Math.min(255, bytes.length - i); B(n); for (let j = 0; j < n; j++) out.push(bytes[i + j]); } B(0);
  });
  B(0x3b); return new Blob([new Uint8Array(out)], { type: 'image/gif' });
}
// ===== حفظ المشروع وفتحه (تكمل رسمتك بعدين) =====
async function atSaveProject() {
  const u = cv => cv.toDataURL('image/png');
  const doc = { v: 1, W: AT.W, H: AT.H, bg: AT.bg, groups: AT.groups || {}, cur: AT.cur, layers: AT.layers.map(l => ({ name: l.name, op: l.op, vis: l.vis, blend: l.blend, clip: l.clip, lock: l.lock, grp: l.grp || null, mOn: l.mOn, png: u(l.cv), mask: l.mask ? u(l.mask) : null })) };
  atDownload(new Blob([JSON.stringify(doc)], { type: 'application/json' }), 'tarteeb-project.tarteeb'); atToast('حفظت المشروع بجهازك');
}
function atOpenProject() {
  if (atNoCollab()) return;
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.tarteeb,application/json';
  i.onchange = async () => { const f = i.files[0]; if (!f) return; if (!confirm('تفتح المشروع؟ الرسمة الحالية بتروح')) return;
    try { const doc = JSON.parse(await f.text()); AT.W = doc.W; AT.H = doc.H; AT.groups = doc.groups || {}; AT.bg = doc.bg || '#ffffff'; AT.cur = doc.cur || 0;
      const load = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
      const ls = []; for (const x of doc.layers) { const l = atLayer(x.name); Object.assign(l, { op: x.op, vis: x.vis, blend: x.blend, clip: x.clip, lock: x.lock, grp: x.grp, mOn: x.mOn }); const im = await load(x.png); if (im) l.g.drawImage(im, 0, 0); if (x.mask) { atAddMask(l); l.mEdit = false; l.mg.clearRect(0, 0, AT.W, AT.H); const mi = await load(x.mask); if (mi) l.mg.drawImage(mi, 0, 0); } ls.push(l); }
      atInitDoc(AT.W, AT.H, ls); AT.undo = []; AT.redo = []; AT.mem = 0; atUIUndo(); atSaveSoon(); atToast('فتحت المشروع');
    } catch (e) { console.warn(e); atToast('الملف مو مشروع مرسم'); } };
  i.click();
}
// ===== لقطات التسريع والحفظ =====
function atEnc(cv, q) { // webp ولو ما ينفع (سفاري) jpeg
  return new Promise(ok => cv.toBlob(b => { if (b && b.type === 'image/webp') return ok(b); cv.toBlob(j => ok(j), 'image/jpeg', Math.min(.92, q + .1)); }, 'image/webp', q));
}
const atB64 = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
let AT_CAPT = 0;
function atCapSoon() { AT.capDirty = true; clearTimeout(AT_CAPT); const wait = Math.max(300, 1500 - (Date.now() - AT.capT)); AT_CAPT = setTimeout(atCapture, wait); }
async function atCapture() {
  if (!AT.capDirty || AT.done || !AT.ready || !S || !S.g || S.game !== 'art' || S.spec) return;
  if (AT.stroke) return atCapSoon();
  AT.capDirty = false; AT.capT = Date.now();
  if (AT.anim) AT.anim.clean = true; atCompose(AT.comp, AT.fl ? { l: AT.fl.l, cv: AT.live } : null); if (AT.anim) AT.anim.clean = false; AT.needComp = true;
  const k = 480 / Math.max(AT.W, AT.H), f = AT.frm || (AT.frm = atMk(Math.round(AT.W * k), Math.round(AT.H * k))); f.getContext('2d').drawImage(AT.comp, 0, 0, f.width, f.height);
  const b = await atEnc(f, .7); if (!b) return; send({ t: 'afr', d: await atB64(b) }); AT.fc++;
}
async function atFinish(auto) {
  if ((AT.done && !auto) || !AT.ready) return; if (AT.stroke) atStrokeEnd(); if (AT.fl) atFloatCommit();
  AT.done = true; atWaitUI(); AT.capDirty = true; await atCapture(); AT.done = true;
  if (AT.anim) { AT.anim.clean = true; AT.anim.play = null; } atCompose(AT.comp, null); if (AT.anim) AT.anim.clean = false;
  let b = await atEnc(AT.comp, .92); const LIM = 2.1e6;
  if (b.size > LIM) b = await atEnc(AT.comp, .8);
  for (let k = .8; b.size > LIM && k > .3; k -= .15) { const t = atMk(Math.round(AT.W * k), Math.round(AT.H * k)); t.getContext('2d').drawImage(AT.comp, 0, 0, t.width, t.height); b = await atEnc(t, .82); }
  send({ t: 'afin', d: await atB64(b) }); try { sfx('pop'); } catch {}
  atSaveNow();
}
// حفظ تلقائي بالجهاز (لو سويت تحديث للصفحة أو طاح النت ترجع رسمتك)
function atIDB() { return new Promise((ok, no) => { const r = indexedDB.open('tarteeb-art', 1); r.onupgradeneeded = () => r.result.createObjectStore('docs'); r.onsuccess = () => ok(r.result); r.onerror = no; }); }
let AT_SVT = 0; function atSaveSoon() { AT.saveDirty = true; clearTimeout(AT_SVT); AT_SVT = setTimeout(atSaveNow, 8000); }
async function atSaveNow() {
  if (!AT.saveDirty || !AT.ready || !S || !S.g || S.game !== 'art') return; AT.saveDirty = false;
  try {
    const layers = await Promise.all(AT.layers.map(async l => { const b = await new Promise(ok => l.cv.toBlob(ok, 'image/png')), m = l.mask ? await new Promise(ok => l.mask.toBlob(ok, 'image/png')) : null; return { name: l.name, op: l.op, vis: l.vis, blend: l.blend, clip: l.clip, lock: l.lock, grp: l.grp || null, mOn: l.mOn, owner: l.owner || null, b, m }; }));
    const db = await atIDB(), tx = db.transaction('docs', 'readwrite'); tx.objectStore('docs').put({ t: Date.now(), W: AT.W, H: AT.H, layers, bg: AT.bg, cur: AT.cur, groups: AT.groups || {} }, S.code + ':' + S.g.key);
    tx.objectStore('docs').getAllKeys().onsuccess = e => { const ks = e.target.result; if (ks.length > 3) ks.filter(k => k !== S.code + ':' + S.g.key).slice(0, ks.length - 3).forEach(k => tx.objectStore('docs').delete(k)); };
  } catch (e) { console.warn('art save', e); }
}
async function atRestore() {
  try {
    const db = await atIDB(), key = S.code + ':' + S.g.key;
    const v = await new Promise(ok => { const q = db.transaction('docs').objectStore('docs').get(key); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); });
    if (!v || !v.layers || !v.layers.length) return false;
    AT.W = v.W || 1600; AT.H = v.H || 1200; AT.cur = v.cur || 0;
    AT.groups = v.groups || {};
    const ls = await Promise.all(v.layers.map(async x => { const l = atLayer(x.name); Object.assign(l, { op: x.op, vis: x.vis, blend: x.blend, clip: x.clip, lock: x.lock, grp: x.grp || null, mOn: x.mOn, owner: x.owner || null }); if (x.b) { const im = await createImageBitmap(x.b); l.g.drawImage(im, 0, 0); im.close && im.close(); } if (x.m) { atAddMask(l); l.mEdit = false; l.mg.clearRect(0, 0, AT.W, AT.H); const im = await createImageBitmap(x.m); l.mg.drawImage(im, 0, 0); } return l; }));
    AT.bg = v.bg || '#ffffff'; atInitDoc(AT.W, AT.H, ls); AT.undo = []; AT.redo = []; atUIUndo(); atToast('رجّعت رسمتك المحفوظة'); return true;
  } catch (e) { console.warn('art restore', e); return false; }
}
// ===== الانتظار بعد «انتهيت» + المتفرجين: شبكة رسومات الكل وهم يرسمون =====
function atWaitUI() {
  const w = document.getElementById('atWait'); if (!w || !S.g || AT.sizing) return; const g = S.g;
  if (!AT.done && !S.spec) { w.hidden = true; return; }
  w.hidden = false;
  const ids = S.players.filter(p => !p.bot).map(p => p.id), done = ids.filter(id => g.st[id] && g.st[id].done).length;
  const head = S.spec ? `<b>يرسمون الحين</b>${g.dl ? `<small>الوقت: <span id="atClock">${atTimeLeft()}</span></small>` : ''}<small>${atNum(done)} من ${atNum(ids.length)} خلصوا</small>` : g.sub === 'collect' ? '<b>الأونر أنهى الرسم</b><small>نجمع الرسومات…</small>' : `<b>خلّصت رسمتك</b><small>ننتظر الباقين · ${atNum(done)} من ${atNum(ids.length)} خلصوا</small>`;
  const sig = ids.map(id => id + ':' + (g.st[id] ? g.st[id].c + (g.st[id].done ? 'd' : '') : 0)).join('|') + g.sub + AT.done;
  if (w.dataset.sig === sig) return; w.dataset.sig = sig;
  const see = id => atHost() || id === S.me; // الأونر بس يشوف رسمات الكل وهم يرسمون
  w.innerHTML = `<div class="atwbox">${head}<div class="atgrid">${ids.map(id => { const p = S.players.find(q => q.id === id), s = g.st[id]; return `<figure><div>${!see(id) ? `<i class="athid">${s && s.done ? 'خلّص رسمته' : s && s.c ? 'يرسم…' : 'لسه ما بدأ'}<small>تنعرض لما ينتهي الرسم</small></i>` : s && s.c ? `<img src="/art/${S.code}/${g.key}/${encodeURIComponent(id)}/last?k=${S.g.vk || ''}&n=${s.c}" alt="">` : '<i>لسه ما بدأ</i>'}</div><figcaption>${esc(p ? p.name : '')}${s && s.done ? ' <em>خلص</em>' : ''}${id !== S.me && !(s && s.done) && atHost() ? ` <button class="atbtn sm" data-w="${id}">تابع لايف</button>` : ''}</figcaption></figure>`; }).join('')}</div>
    ${!S.spec && g.sub === 'draw' ? '<button class="atbtn" id="atBack">رجعت أرسم</button>' : ''}${atHost() && g.sub === 'draw' ? '<button class="atbtn ok" id="atEndAll">اعرض الرسومات الحين</button>' : ''}</div>`;
  w.querySelectorAll('[data-w]').forEach(b => b.onclick = () => atWatch(b.dataset.w));
  const bk = document.getElementById('atBack'); if (bk) bk.onclick = () => { AT.done = false; send({ t: 'aback' }); w.hidden = true; w.dataset.sig = ''; };
  const ea = document.getElementById('atEndAll'); if (ea) ea.onclick = () => { if (confirm('تنهي الرسم للكل وتبدأ العرض؟')) send({ t: 'aend' }); };
}

// ===== العرض: رسمة رسمة مع مقطع التسريع =====
const ATV = { tl: {}, cur: null, raf: 0 };
async function atLoadTl(pid) {
  const g = S.g, ck = g.key + ':' + pid; if (ATV.tl[ck]) return ATV.tl[ck]; // الكاش لكل جولة (قبل كان باللاعب بس فترجع رسمات الجولة اللي قبل)
  const base = `/art/${S.code}/${g.key}/${encodeURIComponent(pid)}/`;
  const P = (async () => {
    const q = '?k=' + (g.vk || ''), r = await fetch(base + 'tl' + q), buf = new Uint8Array(await r.arrayBuffer()), fr = []; let i = 0;
    while (i + 4 <= buf.length) { const n = (buf[i] << 24 | buf[i + 1] << 16 | buf[i + 2] << 8 | buf[i + 3]) >>> 0; i += 4; fr.push(new Blob([buf.subarray(i, i + n)])); i += n; }
    const fin = await (await fetch(base + 'final' + q)).blob();
    return { fr, fin };
  })();
  ATV.tl[ck] = P; P.catch(() => { delete ATV.tl[ck]; }); return P;
}
function atShowUI(body) {
  const g = S.g, over = S.phase === 'over' || g.sub === 'over', host = atHost();
  if (!body.querySelector('.atshow')) body.innerHTML = '<div class="atshow" id="atShow"></div>';
  const box = document.getElementById('atShow');
  if (g.sub === 'vote') { // التصويت على أحلى رسمة
    const sig = 'vote' + g.my + g.nv + g.nvt + g.canVote + atHost(); if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    const jn = g.jmode === 'judges' ? 'الحكام بس يصوّتون' : g.jmode === 'mix' ? 'صوت الحكم بثلاثة أصوات' : '';
    box.innerHTML = `<div class="atvh"><h2>${g.canVote ? 'صوّت لأحلى رسمة' : 'التصويت شغّال'}</h2><small>${atNum(g.nv)} من ${atNum(g.nvt)} صوّتوا${jn ? ` · ${jn}` : ''}</small></div><div class="atgal atvote">${g.order.map(id => { const p = S.players.find(q => q.id === id), mine = id === S.me; return `<button data-v="${id}" class="${g.my === id ? 'on' : ''}"${mine || !g.canVote ? ' disabled' : ''}><img src="/art/${S.code}/${g.key}/${encodeURIComponent(id)}/final?k=${S.g.vk || ''}" alt=""><span>${esc(p ? p.name : 'لاعب')}${mine ? ' (رسمتك)' : g.my === id ? ' ✓' : ''}</span></button>`; }).join('')}</div>
      ${atHost() && !S.spec ? '<div class="atctl"><span class="atsp"></span><button class="atbtn ok" id="atVEnd">اعلن النتيجة</button></div>' : ''}`;
    box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { send({ t: 'avote', id: b.dataset.v }); try { sfx('gclick'); } catch {} });
    const ve = document.getElementById('atVEnd'); if (ve) ve.onclick = () => send({ t: 'avend' });
    return;
  }
  if (over && ATV.view == null && ATV.revOn) { if (document.getElementById('atRevSkip')) return; ATV.rev = null; } // الصفحة انبنت من جديد وقت الكشف: نعيده
  if (over && ATV.view == null && g.tally && g.order.length > 1 && ATV.rev !== g.key) return atReveal(body, box); // كشف المراكز
  if (over && ATV.view == null) { // الآخر: معرض كل الرسومات
    const sig = 'grid' + g.order.join() + (g.best || []).join() + (g.gal || []).join(); if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    const gs = new Set(g.gal || []), gh = host && !S.spec;
    const best = g.best || [], T = g.tally || {};
    box.innerHTML = `${best.length ? `<div class="atwin">${atIcon('crown')}<b>${esc(S.winner || '')}</b><small>أحلى رسمة بتصويتكم</small></div>` : ''}<div class="atvh"><h2>معرض الرسومات</h2><span><a class="atbtn" href="/gallery.html" target="_blank">المعرض الدائم</a> <button class="atbtn" id="atLeave">اطلع</button>${atHost() && !S.spec ? ' <button class="atbtn ok" id="atLobby">رجوع للوبي</button>' : ''}</span></div><div class="atgal">${g.order.map((id, i) => { const p = S.players.find(q => q.id === id); return `<button data-i="${i}" class="${best.includes(id) ? 'best' : ''}">${best.includes(id) ? '<i class="atcrown">أحلى رسمة</i>' : ''}<img src="/art/${S.code}/${g.key}/${encodeURIComponent(id)}/final?k=${S.g.vk || ''}" alt=""><span>${esc(p ? p.name : 'لاعب')}${g.tally ? ` — ${atNum(T[id] || 0)} صوت` : ''}</span>${gh ? `<em class="atgalt${gs.has(id) ? ' on' : ''}" data-g="${id}">${gs.has(id) ? 'بالمعرض ✓' : '+ للمعرض'}</em>` : ''}</button>`; }).join('')}</div>
      ${gh ? `<p class="atgalh">اختر الرسمات اللي تبيها تنحفظ بالمعرض الدائم (${atNum(gs.size)} مختارة). اللي ما تختارها ما تنحفظ.</p>` : ''}`;
    box.querySelectorAll('[data-i]').forEach(b => b.onclick = e => { const t = e.target.closest('[data-g]'); if (t) { e.stopPropagation(); return send({ t: 'agal', id: t.dataset.g, on: !gs.has(t.dataset.g) }); } ATV.view = +b.dataset.i; box.dataset.sig = ''; atShowUI(body); });
    document.getElementById('atLeave').onclick = () => document.getElementById('leave2b').click();
    const lb = document.getElementById('atLobby'); if (lb) lb.onclick = () => send({ t: 'again' });
    return;
  }
  if (over && !g.order.length) { box.innerHTML = '<h2>محد رسم شي</h2>'; return; }
  const i = over ? ATV.view : g.i, pid = g.order[i], p = g.collab ? { name: 'الرسم الجماعي' } : S.players.find(q => q.id === pid), inGal = (g.gal || []).includes(pid), sig = 'v' + i + pid + over + host;
  if (box.dataset.sig === sig) { const t = document.getElementById('atGalT'); if (t) { t.classList.toggle('on', inGal); t.textContent = inGal ? 'بالمعرض الدائم ✓' : '+ للمعرض الدائم'; } return; } // بس زر المعرض يتحدّث، التسريع يكمل
  box.dataset.sig = sig;
  box.innerHTML = `<div class="atvh"><h2>رسمة <span>${esc(p ? p.name : 'لاعب')}</span></h2><small>${atNum(i + 1)} من ${atNum(g.order.length)}</small></div>
    <div class="atstage"><canvas id="atPlay" width="1200" height="900"></canvas><div class="atload" id="atLoad">نجهّز التسريع…</div></div>
    <div class="atctl"><button class="atbtn" id="atRe">${atIcon('play')} أعد التسريع</button><div class="atprog" id="atProg"><i></i></div><small id="atTm"></small></div>
    <div class="atctl"><button class="atbtn" id="atImg">${atIcon('down')} الصورة</button><button class="atbtn" id="atVid">${atIcon('down')} فيديو التسريع</button>
      ${over ? '<button class="atbtn" id="atGrid">كل الرسومات</button>' : ''}${host && !S.spec ? `<button class="atbtn atgalt${inGal ? ' on' : ''}" id="atGalT">${inGal ? 'بالمعرض الدائم ✓' : '+ للمعرض الدائم'}</button>` : ''}
      ${host && !over ? `<span class="atsp"></span><button class="atbtn" id="atPrev"${i ? '' : ' disabled'}>السابقة</button>${i < g.order.length - 1 ? '<button class="atbtn ok" id="atNext">التالية</button>' : `<button class="atbtn ok" id="atEnd">${g.order.length > 1 ? 'للتصويت' : 'خلصنا'}</button>`}` : over ? `<span class="atsp"></span><button class="atbtn" id="atPrev"${i ? '' : ' disabled'}>السابقة</button><button class="atbtn" id="atNext"${i < g.order.length - 1 ? '' : ' disabled'}>التالية</button>` : '<span class="atsp"></span><small>الأونر يقلّب الرسومات</small>'}</div>`;
  const go = k => over ? (ATV.view = k, atShowUI(body)) : send({ t: 'ago', i: k });
  const $$ = id => document.getElementById(id);
  if ($$('atPrev')) $$('atPrev').onclick = () => go(i - 1);
  if ($$('atNext')) $$('atNext').onclick = () => go(i + 1);
  if ($$('atEnd')) $$('atEnd').onclick = () => send({ t: 'adone' });
  if ($$('atGalT')) $$('atGalT').onclick = () => send({ t: 'agal', id: pid, on: !(S.g.gal || []).includes(pid) });
  if ($$('atGrid')) $$('atGrid').onclick = () => { ATV.view = null; box.dataset.sig = ''; atShowUI(body); };
  $$('atImg').onclick = async () => { const d = await atLoadTl(pid); atDownload(d.fin, `tarteeb-drawing-${i + 1}.${d.fin.type.includes('jpeg') ? 'jpg' : d.fin.type.includes('png') ? 'png' : 'webp'}`); };
  $$('atVid').onclick = () => atVideo(pid, p ? p.name : '');
  $$('atRe').onclick = () => atPlay(pid);
  try { sfx('pop'); } catch {}
  atPlay(pid);
}
// كشف النتيجة: الثالث، بعدين الثاني، بعدين الأول
function atReveal(body, box) {
  const g = S.g, tok = ATV.revTok = {}; ATV.rev = g.key; ATV.revOn = true; box.dataset.sig = 'rev';
  const T = g.tally, rank = g.order.slice().sort((a, b) => (T[b] || 0) - (T[a] || 0)).slice(0, 3), names = ['الأول', 'الثاني', 'الثالث'];
  box.innerHTML = `<div class="atrev"><h2>النتيجة</h2><div class="atpod">${rank.map((id, k) => { const p = S.players.find(q => q.id === id); return `<div class="atpd p${k + 1}" data-k="${k}"><div class="atpdi"><img src="/art/${S.code}/${g.key}/${encodeURIComponent(id)}/final?k=${S.g.vk || ''}" alt=""></div><b>${(g.best || []).includes(id) && k ? 'الأول' : names[k]}</b><span>${esc(p ? p.name : 'لاعب')}</span><small>${atNum(T[id] || 0)} صوت</small></div>`; }).join('')}</div><button class="atbtn" id="atRevSkip">تخطي</button></div>`;
  const steps = [...box.querySelectorAll('.atpd')].reverse(); let n = 0, tm;
  const done = () => { clearTimeout(tm); if (ATV.revTok !== tok) return; ATV.revOn = false; box.dataset.sig = ''; atShowUI(body); };
  const nx = () => { if (ATV.revTok !== tok || !document.getElementById('atRevSkip')) return; if (n < steps.length) { steps[n].classList.add('in'); try { sfx(n === steps.length - 1 ? 'win' : 'pop'); } catch {} n++; tm = setTimeout(nx, n === steps.length ? 3500 : 1800); } else done(); };
  document.getElementById('atRevSkip').onclick = done; tm = setTimeout(nx, 700);
}
// تشغيل التسريع: اللقطات ورا بعض (~١٢ ثانية) وبعدين الرسمة كاملة
async function atPlay(pid) {
  cancelAnimationFrame(ATV.raf); const tok = ATV.tok = {};
  const d = await atLoadTl(pid); if (ATV.tok !== tok) return;
  const cv = document.getElementById('atPlay'); if (!cv) return; const g = cv.getContext('2d'), ld = document.getElementById('atLoad'); if (ld) ld.hidden = true;
  const fin = await createImageBitmap(d.fin), k0 = 1200 / Math.max(fin.width, fin.height); cv.width = Math.round(fin.width * k0); cv.height = Math.round(fin.height * k0); const CW = cv.width, CH = cv.height;
  const n = d.fr.length, dur = Math.min(14000, Math.max(3000, n * 70)), t0 = performance.now(), mins = S.g.mins;
  const bm = new Map(); const get = k => { if (!bm.has(k) && k < n) bm.set(k, createImageBitmap(d.fr[k]).catch(() => null)); return bm.get(k); };
  for (let k = 0; k < Math.min(6, n); k++) get(k);
  let shown = -1;
  const tick = async () => {
    if (ATV.tok !== tok || !document.getElementById('atPlay')) return;
    const t = performance.now() - t0, f = Math.min(1, t / dur), k = Math.min(n - 1, Math.floor(f * n));
    const pr = document.getElementById('atProg'); if (pr) pr.firstChild.style.width = (f * 100) + '%';
    const tm = document.getElementById('atTm'); if (tm) tm.textContent = mins ? `${atNum(mins)} دقيقة ← ${atNum(Math.round(dur / 1000))} ثانية` : '';
    if (n && k !== shown) { const im = await get(k); for (let j = k + 1; j < k + 6; j++) get(j); if (im && ATV.tok === tok) { g.drawImage(im, 0, 0, CW, CH); shown = k; } }
    if (f < 1 && n) ATV.raf = requestAnimationFrame(tick);
    else { g.globalAlpha = 1; for (let a = 0; a <= 1; a += .1) { g.globalAlpha = a; g.drawImage(fin, 0, 0, CW, CH); await new Promise(r => setTimeout(r, 25)); } g.globalAlpha = 1; }
  };
  if (!n) g.drawImage(fin, 0, 0, CW, CH); else tick();
}
// فيديو التسريع (يتسجّل بالمتصفح)
async function atVideo(pid, name) {
  if (!window.MediaRecorder) return toast('جهازك ما يدعم تسجيل الفيديو، نزّل الصورة');
  const btn = document.getElementById('atVid') || { disabled: false, set textContent(t) { atToast(t, 1500); } }; if (btn.disabled || AT.vidBusy) return; btn.disabled = true; AT.vidBusy = true; const lbl = btn.innerHTML;
  try {
    const d = await atLoadTl(pid), fin = await createImageBitmap(d.fin), kk = 960 / Math.max(fin.width, fin.height), VW = Math.round(fin.width * kk / 2) * 2, VH = Math.round(fin.height * kk / 2) * 2, cv = atMk(VW, VH), g = cv.getContext('2d');
    const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'], mt = types.find(t => MediaRecorder.isTypeSupported(t));
    if (!mt) throw new Error('no type');
    const fps = 30, stream = cv.captureStream(fps), rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 5e6 }), parts = [];
    rec.ondataavailable = e => e.data.size && parts.push(e.data);
    const doneP = new Promise(ok => rec.onstop = ok);
    const mark = () => { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, VH - 44, VW, 44); g.fillStyle = '#fff'; g.font = '800 22px Tajawal, sans-serif'; g.textAlign = 'center'; g.fillText(`رسمة ${name} · مرسم ترتيب`, VW / 2, VH - 14); };
    g.fillStyle = '#fff'; g.fillRect(0, 0, VW, VH); rec.start(250);
    const n = d.fr.length, total = Math.min(14, Math.max(3, n * .07)) * fps;
    for (let f = 0; f < total; f++) { const k = Math.min(n - 1, Math.floor(f / total * n)); if (n) { const im = await createImageBitmap(d.fr[k]); g.drawImage(im, 0, 0, VW, VH); im.close && im.close(); } mark(); btn.textContent = `نجهّز الفيديو ${atNum(Math.round(f / total * 100))}٪`; await new Promise(r => setTimeout(r, 1000 / fps)); }
    for (let f = 0; f < fps * 2.5; f++) { g.drawImage(fin, 0, 0, VW, VH); mark(); await new Promise(r => setTimeout(r, 1000 / fps)); }
    rec.stop(); await doneP;
    atDownload(new Blob(parts, { type: mt.split(';')[0] }), `tarteeb-timelapse-${Date.now() % 100000}.${mt.includes('mp4') ? 'mp4' : 'webm'}`);
  } catch (e) { console.warn(e); toast('ما قدرت أسوي الفيديو، نزّل الصورة'); }
  btn.disabled = false; AT.vidBusy = false; if (lbl != null) btn.innerHTML = lbl;
}

// ===== من السيرفر =====
function net_art(m) {
  if (m.k === 'collect' && S && S.g && !S.spec && !AT.done && document.getElementById('atStudio')) { atToast('خلص الرسم، نرسل رسمتك'); atFinish(true); }
  if (m.k === 'st' || m.k === 'lyr') atCollabRecv(m);
  if (m.k === 'lv') { const im = document.getElementById('atLvImg'); if (im && ATS.watch === m.from) im.src = m.d; }
  if (m.k === 'cheer') atCheerShow(m);
}
// ===== المتفرج: شبكة الرسامين، ومتابعة رسام لايف (بث) مع تشجيع =====
const ATS = { watch: null };
function atWatch(id) {
  ATS.watch = id; send({ t: 'awatch', id }); let o = document.getElementById('atLv');
  if (!id) { if (o) o.remove(); return; }
  const p = S.players.find(q => q.id === id), g = S.g;
  if (!o) { o = document.createElement('div'); o.id = 'atLv'; o.className = 'atlv'; (document.getElementById('atStudio') || document.getElementById('atSpec') || document.body).appendChild(o); }
  o.innerHTML = `<div class="atlvh"><span class="lvdot"></span><b>${esc(p ? p.name : '')}</b><small>يرسم الحين</small><button class="atbtn sm" id="atLvX">سكّر</button></div>
    <div class="atlvb"><img id="atLvImg" src="/art/${S.code}/${g.key}/${encodeURIComponent(id)}/last?k=${S.g.vk || ''}&t=${Date.now()}" alt=""></div>
    <div class="atlvc">${['clap', 'fire', 'laugh', 'love', 'wow'].map(e => `<button data-ch="${e}">${typeof rcChar === 'function' ? rcChar('hmd', e, 34) : e}</button>`).join('')}<small>شجّعه</small></div>`;
  document.getElementById('atLvX').onclick = () => atWatch(null);
  o.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => send({ t: 'acheer', id, e: b.dataset.ch }));
}
// المتفرج بالرسم الجماعي: يشوف اللوحة كاملة لايف
function atSpecCollab(body) {
  if (!body.querySelector('#atSpecC')) { body.innerHTML = '<div class="atstudio atspec" id="atSpec"><div class="atspecc"><b>الرسم الجماعي — لايف</b><canvas id="atSpecC"></canvas></div></div>'; AT.ready = false; }
  if (!AT.ready || AT.key !== S.g.key) { AT.key = S.g.key; AT.groups = {}; AT.anim = null; AT.sel = null; AT.cur = 0; AT.done = true; atInitDoc(1600, 1200, atCollabLayers()); send({ t: 'aneed' });
    clearInterval(ATS.sv); ATS.sv = setInterval(() => { const c = document.getElementById('atSpecC'); if (!c) return clearInterval(ATS.sv); if (AT.needComp) { atCompose(AT.comp, null); AT.needComp = false; c.width = 1200; c.height = 900; c.getContext('2d').drawImage(AT.comp, 0, 0, 1200, 900); } }, 250); }
}
// وقت المسابقة
function atTimeLeft() { const g = S.g; if (!g || !g.dl) return ''; const ms = Math.max(0, g.dl - Date.now() + (S.t0 ? 0 : 0)), m = Math.floor(ms / 60000), sec = Math.floor(ms / 1000) % 60; return `${atNum(m)}:${atNum(String(sec).padStart(2, '0'))}`; }
setInterval(() => { if (!S || S.game !== 'art' || !S.g || !S.g.dl || !(S.g.sub === 'draw')) return; const t = atTimeLeft(), el = document.getElementById('atClock'); if (el) el.textContent = t; const ms = S.g.dl - Date.now(); if (ms < 60000 && ms > 58500) atToast('باقي دقيقة!', 2500); }, 1000);
// وضع البث للرسام: الأدوات تختفي ويطلع اسمك والموضوع
function atStreamToggle() {
  const st = document.getElementById('atStudio'); if (!st) return; const on = !st.classList.contains('atstream'); st.classList.toggle('atstream', on);
  let b = document.getElementById('atStrB'); if (on) { if (!b) { b = document.createElement('div'); b.id = 'atStrB'; b.className = 'atstrb'; st.appendChild(b); } const me = S.players.find(p => p.id === S.me); b.innerHTML = `<span class="lvdot"></span><b>${esc(me ? me.name : '')}</b><small>${esc(S.g.theme || 'مرسم ترتيب')}</small><button class="atbtn sm" id="atStrX">رجّع الأدوات</button>`; document.getElementById('atStrX').onclick = atStreamToggle; } else if (b) b.remove();
}
function renderArt(body) {
  const g = S.g; if (!g) return;
  if (g.sub === 'draw' || g.sub === 'collect') {
    if (S.spec) { // المتفرج: يشوف الكل وهم يرسمون، ويقدر يتابع واحد لايف
      if (!body.querySelector('#atSpec')) body.innerHTML = '<div class="atstudio atspec" id="atSpec"><div class="atwait" id="atWait"></div></div>';
      AT.done = true; atWaitUI(); return;
    }
    if (body.dataset.built !== 'art' || !document.getElementById('atStudio') || AT.key !== g.key) { body.dataset.built = 'art'; AT.key = g.key; AT.anim = null; atBuild(body); }
    const ids = S.players.filter(p => !p.bot).map(p => p.id), done = ids.filter(id => g.st[id] && g.st[id].done).length;
    const mid = document.getElementById('atMid'); if (mid) mid.innerHTML = `${g.theme ? `<b>${esc(g.theme)}</b>` : `<b>${g.collab ? 'رسم جماعي' : 'مرسم ترتيب'}</b>`}<small>${g.dl ? `<span id="atClock">${atTimeLeft()}</span> · ` : ''}${ids.length > 1 ? `${atNum(done)} من ${atNum(ids.length)} خلصوا` : 'ارسم براحتك'}${g.wc ? ` · ${atNum(g.wc)} يتابعونك` : ''}</small>`;
    if (g.st[S.me] && g.st[S.me].done && !AT.done) AT.done = true; // رجع للصفحة بعد ما خلص
    if (g.sub === 'collect' && !AT.done) atFinish(true);
    if (g.collab && AT.ready) atCollabFix();
    atWaitUI();
    return;
  }
  // العرض
  AT.on = false; body.dataset.built = 'artshow'; if (ATS.watch) atWatch(null);
  if (S.phase !== 'over') ATV.view = null;
  atShowUI(body);
}
