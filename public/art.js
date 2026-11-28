// ================= مرسم ترتيب — استوديو رسم مثل بروكريت =================
// اللوحة ١٦٠٠×١٢٠٠ بطبقات (كل طبقة كانفس). الفرش «ختم» يتكرر على طول الخط (رأس الفرشاة + تباعد + ضغط القلم).
// كل ضربة تنرسم أول بـ «مخزن الضربة» وبعدين تنضاف للطبقة بشفافية الفرشاة (مثل بروكريت ما تتراكم داخل نفس الضربة).
// للتسريع: بعد كل تعديل نرسل لقطة صغيرة ٤٨٠×٣٦٠ للسيرفر، ولما تضغط «انتهيت» نرسل الرسمة كاملة.
const AT = {
  W: 1600, H: 1200, on: false, layers: [], cur: 0, bg: '#ffffff', tool: 'brush', bt: { brush: 'ink', eraser: 'round', smudge: 'soft' }, color: '#1d1d1f', hist: [],
  size: { brush: 14, eraser: 40, smudge: 40, liq: 160, shape: 8, fx: 70 }, op: { brush: 1, eraser: 1, smudge: .7, grad: 1, liq: .6, shape: 1, fx: .8 }, fxMode: 'blur', shp: 'rect', shpFill: 'fill', shpEq: false, pc: 1, rope: 0, guide: 'none', assist: true, gridSz: 80, stream: {}, sym: 'none', qs: true,
  view: { z: 1, r: 0, x: 0, y: 0 }, undo: [], redo: [], mem: 0, dirty: true, capT: 0, fc: 0, ui: true
};
const atMk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const AT_BLEND = [['source-over', 'عادي'], ['multiply', 'ضرب'], ['screen', 'شاشة'], ['overlay', 'تراكب'], ['soft-light', 'إضاءة ناعمة'], ['hard-light', 'إضاءة قوية'], ['color-dodge', 'تفتيح لوني'], ['color-burn', 'حرق لوني'], ['darken', 'أغمق'], ['lighten', 'أفتح'], ['difference', 'اختلاف'], ['lighter', 'إضافة'], ['hue', 'الدرجة'], ['saturation', 'التشبع'], ['color', 'اللون'], ['luminosity', 'الإضاءة']];
const AT_CATS = [['sketch', 'رسم'], ['ink', 'حبر'], ['paint', 'تلوين'], ['water', 'مائي'], ['oil', 'زيت'], ['char', 'فحم وطباشير'], ['spray', 'بخاخ'], ['neon', 'نيون'], ['nature', 'طبيعة'], ['fx', 'أشكال ومؤثرات']];
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
  { id: 'light', c: 'neon', n: 'ضوء', tip: 'soft', sp: .07, flow: .22, szP: .3, opP: .6, min: .6, st: .3, def: 120, add: 1 },
  { id: 'pen', c: 'ink', n: 'قلم ناعم', tip: 'hard', sp: .03, flow: 1, szP: .35, opP: 0, min: .5, st: .55, def: 5 },
  { id: 'nib', c: 'ink', n: 'ريشة', tip: 'flat', sp: .025, flow: 1, szP: .8, opP: 0, min: .2, rot: 'fixed', ang: .6, st: .5, taper: 30, def: 18 },
  { id: 'colpen', c: 'sketch', n: 'ألوان خشبية', grain: 1, tip: 'pencil', sp: .07, flow: .7, szP: .35, opP: .7, min: .5, rot: 'rand', st: .2, def: 10 },
  { id: 'crayon', c: 'char', n: 'ألوان شمع', grain: 1, tip: 'chalk', sp: .05, flow: .95, szP: .25, opP: .3, min: .7, rot: 'rand', st: .2, def: 22 },
  { id: 'gouache', c: 'paint', n: 'جواش', tip: 'round', sp: .04, flow: .95, szP: .3, opP: .15, min: .6, st: .3, def: 50, grain: 1 },
  { id: 'dry', c: 'oil', n: 'فرشاة ناشفة', grain: 1, tip: 'bristle', sp: .05, flow: .55, szP: .3, opP: .5, min: .5, jit: .1, sc: .03, rot: 'dir', st: .25, def: 60 },
  { id: 'knife', c: 'oil', n: 'سكين ألوان', tip: 'flat', sp: .02, flow: 1, szP: .2, opP: .1, min: .7, rot: 'dir', st: .35, def: 70 },
  { id: 'blend', c: 'paint', n: 'دمج ناعم', tip: 'soft', sp: .05, flow: .07, szP: .2, opP: .7, min: .6, st: .3, def: 90 },
  { id: 'hatch', c: 'sketch', n: 'تظليل خطوط', tip: 'hatch', sp: .45, flow: .55, szP: .3, opP: .6, min: .6, st: .2, def: 40 },
  { id: 'leaf', c: 'nature', n: 'أوراق شجر', tip: 'leaf', sp: .55, flow: 1, szP: .3, opP: 0, min: .6, jit: .45, sc: .7, rot: 'rand', st: .05, def: 40, cj: 0.35 },
  { id: 'grass', c: 'nature', n: 'عشب', tip: 'grass', sp: .3, flow: 1, szP: .3, opP: 0, min: .6, jit: .3, sc: .15, st: .05, def: 60, cj: 0.3 },
  { id: 'cloud', c: 'nature', n: 'غيوم', tip: 'cloud', sp: .18, flow: .5, szP: .3, opP: .5, min: .6, jit: .35, sc: .25, rot: 'rand', st: .1, def: 160 },
  { id: 'fur', c: 'nature', n: 'فرو وشعر', tip: 'fur', sp: .12, flow: .8, szP: .3, opP: .4, min: .6, jit: .2, rot: 'rand', st: .2, def: 50, cj: 0.25 },
  { id: 'stars', c: 'fx', n: 'نجوم', tip: 'star', sp: 1.1, flow: 1, szP: .3, opP: 0, min: .6, jit: .6, sc: 1.1, rot: 'rand', st: .05, def: 26, cj: 0.5 },
  { id: 'sparkle', c: 'fx', n: 'لمعة', tip: 'spark', sp: 1.3, flow: 1, szP: .3, opP: 0, min: .6, jit: .7, sc: .9, rot: 'rand', st: .05, def: 50, add: 1 },
  { id: 'hearts', c: 'fx', n: 'قلوب', tip: 'heart', sp: 1.2, flow: 1, szP: .3, opP: 0, min: .6, jit: .5, sc: 1, rot: 'rand', st: .05, def: 30, cj: 0.4 },
  { id: 'dots', c: 'fx', n: 'نقاط', tip: 'hard', sp: 1.6, flow: 1, szP: .3, opP: 0, min: .6, jit: .3, st: .1, def: 14 },
  { id: 'marker2', c: 'ink', n: 'ماركر عريض', tip: 'round', sp: .03, flow: 1, szP: .1, opP: 0, min: .9, st: .35, def: 30 },
  { id: 'chisel', c: 'ink', n: 'قلم قصب', tip: 'chisel', sp: .02, flow: 1, szP: .4, opP: 0, min: .5, rot: 'fixed', ang: 0, st: .5, def: 30 },
  { id: 'pixel', c: 'fx', n: 'بكسل', tip: 'square', sp: .9, flow: 1, szP: 0, opP: 0, st: 0, def: 12 },
  { id: 'bubbles', c: 'fx', n: 'فقاعات', tip: 'ring', sp: 1.4, flow: .9, szP: .3, opP: 0, min: .6, jit: .7, sc: 1, st: .05, def: 36, cj: 0.3 },
  { id: 'glitter', c: 'fx', n: 'برق', tip: 'spark', sp: 1.5, flow: 1, szP: .2, opP: 0, min: .6, jit: .8, sc: 1.6, rot: 'rand', st: .05, def: 18, add: 1 },
  { id: 'sponge', c: 'paint', n: 'إسفنجة', tip: 'sponge', sp: .35, flow: .7, szP: .3, opP: .4, min: .6, rot: 'rand', jit: .2, st: .1, def: 70, cj: 0.2 },
  { id: 'smoke', c: 'nature', n: 'دخان', tip: 'cloud', sp: .12, flow: .18, szP: .3, opP: .5, min: .6, jit: .3, sc: .2, rot: 'rand', st: .3, def: 140 },
  { id: 'rain', c: 'nature', n: 'مطر', tip: 'rain', sp: .6, flow: .9, szP: .2, opP: .2, min: .7, sc: .6, st: .05, def: 70 },
  { id: 'snow', c: 'nature', n: 'ثلج', tip: 'soft', sp: 1.4, flow: 1, szP: .3, opP: 0, min: .6, jit: .8, sc: 1.4, st: .05, def: 12 },
  { id: 'scales', c: 'nature', n: 'قشور سمك', tip: 'scale', sp: .55, flow: 1, szP: .2, opP: 0, min: .8, st: .2, def: 34, cj: 0.2 },
  { id: 'pencilc', c: 'sketch', n: 'رصاص ناعم', grain: 1, tip: 'pencil', sp: .06, flow: .3, szP: .5, opP: .9, min: .4, rot: 'rand', st: .3, def: 8 },
  { id: 'wink', c: 'water', wet: 1, n: 'حبر مائي', tip: 'round', sp: .03, flow: .35, szP: .6, opP: .5, min: .3, st: .45, taper: 30, def: 20 }
];
// مجموعات ألوان جاهزة: تختار الشي اللي بتلوّنه وتلقى ألوانه
const AT_GRP = [
  ['skin', 'بشرة', ['#fde3cf', '#f8d0b0', '#f1c19a', '#e8b088', '#d99e72', '#c68856', '#b07246', '#8f5a35', '#6e4326', '#4f2f1b', '#f2b8a0', '#d9877a']],
  ['hair', 'شعر', ['#0f0d0c', '#2b1d14', '#3d2817', '#5a3a1f', '#7a4f2a', '#a06a38', '#c8955a', '#e3c088', '#f2dfb0', '#b5502d', '#8c8c8c', '#e8e8e8']],
  ['tree', 'شجر وعشب', ['#0f3d1f', '#1b5e20', '#2e7d32', '#43a047', '#66bb6a', '#8bc34a', '#aed581', '#c5e1a5', '#556b2f', '#6b8e23', '#4e342e', '#795548']],
  ['nature', 'طبيعة', ['#5d4037', '#8d6e63', '#a1887f', '#c2b280', '#e4d5b7', '#7cb342', '#9e9d24', '#cddc39', '#f9a825', '#ef6c00', '#bf360c', '#6d4c41']],
  ['sky', 'سما وبحر', ['#0d1b4c', '#1a3a7a', '#1e5aa8', '#2f80d1', '#4aa3e8', '#7cc4f2', '#b3e0fa', '#e3f4fd', '#006064', '#00838f', '#26a69a', '#80cbc4']],
  ['sunset', 'غروب', ['#2d1b4e', '#5b2a6e', '#8e3a7a', '#c2457a', '#e8606a', '#f4845f', '#f7a35c', '#f9c74f', '#ffe29a', '#ff6f59', '#3a0ca3', '#7209b7']],
  ['desert', 'صحرا ورمل', ['#f3e0b5', '#ead2a0', '#e0c08a', '#d4a96a', '#c8955a', '#b9824a', '#a06b3a', '#7f5230', '#d98e4f', '#e9b872', '#fff3d6', '#8a6a4b']],
  ['flower', 'ورد', ['#ffd1dc', '#ffb3c6', '#ff8fab', '#fb6f92', '#e5383b', '#c9184a', '#ffc8dd', '#cdb4db', '#a2d2ff', '#fff1a8', '#ffd166', '#ffffff']],
  ['pastel', 'باستيل', ['#ffd6e0', '#ffe5b4', '#fff5ba', '#d4f0c0', '#c1f0e8', '#c9e4ff', '#d9d2ff', '#f0d1ff', '#fde2e4', '#e2ece9', '#bee1e6', '#f0efeb']],
  ['neon', 'نيون', ['#ff00e5', '#ff2079', '#ff5e00', '#ffe600', '#39ff14', '#00ffd5', '#00b3ff', '#7a00ff', '#b026ff', '#ff3864', '#2de2e6', '#f6019d']],
  ['gray', 'رمادي', ['#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#e6e6e6', '#f2f2f2', '#ffffff']],
  ['metal', 'ذهبي وفضي', ['#5c4317', '#8a6d1f', '#b8912b', '#d4af37', '#e8c766', '#f5e09b', '#5f6368', '#8e9297', '#b8bcc0', '#dfe2e5', '#b87333', '#e0a96d']]
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
  const N = 256, c = atMk(N, N), g = c.getContext('2d'), h = N / 2; // ٢٥٦ عشان الفرش الكبيرة ما تطلع مبكسلة
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
  else if (kind === 'star') { g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? h * .42 : h - 4; g.lineTo(h + Math.cos(a) * r, h + Math.sin(a) * r); } g.fill(); }
  else if (kind === 'heart') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(h, N * .85); g.bezierCurveTo(N * .02, N * .55, N * .12, N * .08, h, N * .3); g.bezierCurveTo(N * .88, N * .08, N * .98, N * .55, h, N * .85); g.fill(); }
  else if (kind === 'leaf') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(h, 6); g.quadraticCurveTo(N - 18, h, h, N - 6); g.quadraticCurveTo(18, h, h, 6); g.fill(); g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#fff'; g.lineWidth = 5; g.globalAlpha = .55; g.beginPath(); g.moveTo(h, 18); g.lineTo(h, N - 14); for (let i = 1; i < 6; i++) { const y = 18 + i * (N - 40) / 6; g.moveTo(h, y); g.lineTo(h + 34 * (1 - i / 7), y - 22); g.moveTo(h, y); g.lineTo(h - 34 * (1 - i / 7), y - 22); } g.stroke(); }
  else if (kind === 'grass') { g.strokeStyle = '#fff'; g.lineCap = 'round'; for (let i = 0; i < 9; i++) { const x = 30 + Math.random() * (N - 60), hh = N * (.45 + Math.random() * .5), bend = (Math.random() - .5) * 70; g.lineWidth = 3 + Math.random() * 5; g.globalAlpha = .6 + Math.random() * .4; g.beginPath(); g.moveTo(x, N - 4); g.quadraticCurveTo(x + bend * .3, N - hh * .6, x + bend, N - hh); g.stroke(); } }
  else if (kind === 'hatch') { g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; for (let i = -3; i <= 3; i++) { g.globalAlpha = .65 + Math.random() * .35; g.beginPath(); g.moveTo(h + i * 30 - 70, h + 70); g.lineTo(h + i * 30 + 70, h - 70); g.stroke(); } g.globalCompositeOperation = 'destination-in'; rad([[0, 1], [.75, 1], [1, 0]]); }
  else if (kind === 'spark') { const gr = g.createRadialGradient(h, h, 0, h, h, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.12, 'rgba(255,255,255,.9)'); gr.addColorStop(.3, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, N, N); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? h * .1 : h - 2; g.lineTo(h + Math.cos(a) * r, h + Math.sin(a) * r); } g.fill(); }
  else if (kind === 'fur') { g.strokeStyle = '#fff'; g.lineCap = 'round'; for (let i = 0; i < 70; i++) { const a = Math.random() * 6.283, r0 = Math.random() * h * .3, r1 = h * (.55 + Math.random() * .42), cv = (Math.random() - .5) * .4; g.lineWidth = 1 + Math.random() * 2.2; g.globalAlpha = .35 + Math.random() * .55; g.beginPath(); g.moveTo(h + Math.cos(a) * r0, h + Math.sin(a) * r0); g.quadraticCurveTo(h + Math.cos(a + cv) * r1 * .6, h + Math.sin(a + cv) * r1 * .6, h + Math.cos(a) * r1, h + Math.sin(a) * r1); g.stroke(); } }
  else if (kind === 'square') { g.fillStyle = '#fff'; g.fillRect(4, 4, N - 8, N - 8); }
  else if (kind === 'ring') { g.strokeStyle = '#fff'; g.lineWidth = 12; g.beginPath(); g.arc(h, h, h - 10, 0, 7); g.stroke(); g.globalAlpha = .5; g.lineWidth = 6; g.beginPath(); g.arc(h - 30, h - 30, 18, Math.PI, Math.PI * 1.6); g.stroke(); }
  else if (kind === 'sponge') { g.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * h * .9, r = 3 + Math.random() * 11; g.globalAlpha = .4 + Math.random() * .6; g.beginPath(); g.arc(h + Math.cos(a) * d, h + Math.sin(a) * d, r, 0, 7); g.fill(); } }
  else if (kind === 'rain') { g.strokeStyle = '#fff'; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const x = 20 + Math.random() * (N - 40), y = 10 + Math.random() * (N - 90), l = 40 + Math.random() * 50; g.lineWidth = 3 + Math.random() * 3; g.globalAlpha = .5 + Math.random() * .5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * .25, y + l); g.stroke(); } }
  else if (kind === 'scale') { g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(h, h * .55, h * .8, Math.PI * .15, Math.PI * .85); g.stroke(); g.globalAlpha = .35; g.fillStyle = '#fff'; g.beginPath(); g.arc(h, h * .55, h * .72, Math.PI * .15, Math.PI * .85); g.fill(); }
  else if (kind === 'chisel') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(h - 60, h + 10); g.lineTo(h + 50, h - 20); g.lineTo(h + 60, h - 6); g.lineTo(h - 50, h + 24); g.closePath(); g.fill(); }
  else if (kind === 'cloud') { for (let i = 0; i < 9; i++) { const a = Math.random() * 6.283, d = Math.random() * h * .35, r = h * (.3 + Math.random() * .25), x = h + Math.cos(a) * d, y = h + Math.sin(a) * d, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(.6, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, N, N); } }
  else rad([[0, 1], [1, 0]]);
  return AT_TIP[kind] = c;
}
// رأس ملوّن (كاش حسب الرأس واللون)
const AT_CT = new Map();
function atCTip(kind, col) {
  const k = kind + col; let c = AT_CT.get(k); if (c) return c;
  if (AT_CT.size > 60) AT_CT.clear();
  c = atMk(256, 256); const g = c.getContext('2d');
  if (kind === 'glow') { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, '#fff'); gr.addColorStop(.18, '#fff'); gr.addColorStop(.3, col); gr.addColorStop(.6, col + '66'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  else { g.drawImage(atTip(kind), 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 256, 256); }
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
    if (l.adj) { // طبقة تعديل: تفلتر اللي تحتها بدون ما تغيّره، والممحاة عليها تحدد وين يطبّق
      if (l.vis && atHasFilter()) { const a = AT.adjC && AT.adjC.width === AT.W && AT.adjC.height === AT.H ? AT.adjC : (AT.adjC = atMk(AT.W, AT.H)), ag = a.getContext('2d'); ag.save(); ag.globalCompositeOperation = 'copy'; ag.globalAlpha = 1; ag.filter = atAdjF(l.adj); ag.drawImage(t, 0, 0); ag.filter = 'none'; ag.globalCompositeOperation = 'destination-in'; ag.drawImage(src(l), 0, 0); ag.restore(); g.globalAlpha = l.op; g.globalCompositeOperation = 'source-over'; g.drawImage(a, 0, 0); }
      continue; }
    if (l.clip && i > from) continue; if (!l.vis) { while (i + 1 < to && AT.layers[i + 1].clip) i++; continue; }
    const grp = []; for (let j = i + 1; j < to && AT.layers[j].clip; j++) grp.push(AT.layers[j]);
    if (!grp.length) { g.globalAlpha = l.op; g.globalCompositeOperation = l.blend; g.drawImage(src(l), 0, 0); continue; }
    const tg = AT.tmp.getContext('2d'); tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1; tg.clearRect(0, 0, AT.W, AT.H); tg.drawImage(src(l), 0, 0);
    grp.forEach(c => { if (!c.vis) return; tg.globalCompositeOperation = 'source-atop'; tg.globalAlpha = c.op; tg.drawImage(src(c), 0, 0); });
    g.globalAlpha = l.op; g.globalCompositeOperation = l.blend; g.drawImage(AT.tmp, 0, 0);
  }
  g.restore();
}
const AT_ADJ = [['b', 'الإضاءة', 0, 200, 100, '٪'], ['c', 'التباين', 0, 200, 100, '٪'], ['s', 'التشبّع', 0, 300, 100, '٪'], ['h', 'تدوير اللون', -180, 180, 0, '°'], ['w', 'دفء', 0, 100, 0, '٪'], ['g', 'رمادي', 0, 100, 0, '٪'], ['bl', 'تنعيم', 0, 20, 0, '']];
const atAdjF = a => `brightness(${a.b / 100}) contrast(${a.c / 100}) saturate(${a.s / 100}) hue-rotate(${a.h}deg) sepia(${a.w / 100}) grayscale(${a.g / 100})${a.bl ? ` blur(${a.bl}px)` : ''}`;
const atDirect = t => t === 'smudge' || t === 'liq' || t === 'fx'; // أدوات تكتب على الطبقة مباشرة
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
const atStruct = () => ({ layers: AT.layers.slice(), props: AT.layers.map(l => ({ op: l.op, vis: l.vis, blend: l.blend, clip: l.clip, lock: l.lock, name: l.name, mask: l.mask || null, mg: l.mg || null, mEdit: !!l.mEdit, mOn: l.mOn, grp: l.grp || null, adj: l.adj ? Object.assign({}, l.adj) : null })), cur: AT.cur, bg: AT.bg, groups: JSON.parse(JSON.stringify(AT.groups || {})) });
function atApplyStruct(s) { AT.layers = s.layers.slice(); s.props.forEach((p, i) => Object.assign(AT.layers[i], p, { adj: p.adj ? Object.assign({}, p.adj) : null })); AT.cur = atClamp(s.cur, 0, AT.layers.length - 1); AT.bg = s.bg; if (s.groups) AT.groups = JSON.parse(JSON.stringify(s.groups)); }
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
  AT.on = true; AT.ready = false; AT.oneAt = null; AT.curs = {}; AT.groups = {}; AT.layers = []; AT.undo = []; AT.redo = []; AT.mem = 0; AT.cur = 0; AT.fc = 0; AT.done = false; AT.sel = null; AT.fl = null; AT.ref = null;
  try { const s = JSON.parse(localStorage.getItem('tart-prefs') || '{}'); if (s.bt) Object.assign(AT.bt, s.bt); if (s.color) AT.color = s.color; if (s.hist) AT.hist = s.hist; if (s.size) Object.assign(AT.size, s.size); if (s.stream) AT.stream = s.stream; if (s.pc) AT.pc = s.pc; if (s.rope != null) AT.rope = s.rope; if (s.bover) AT.bover = s.bover; if (s.custom) AT.custom = s.custom; if (s.imgPal) AT.imgPal = s.imgPal; if (s.color2) AT.color2 = s.color2; if (s.grpSel) AT.grpSel = s.grpSel; } catch {}
  const I = atIcon;
  host.innerHTML = `<div class="atstudio" id="atStudio">
    <canvas id="atCv" class="atcv"></canvas>
    <div class="attop" id="atTop">
      <div class="atgrp"><button class="atib" data-a="menu" title="القائمة">${I('menu')}</button></div>
      <div class="atmid" id="atMid"></div>
      <div class="atgrp"><button class="atfin" id="atFin">انتهيت</button></div>
    </div>
    <div class="atside" id="atSide">
      <label class="atslw"><span>الحجم</span><div class="atsl" id="atSize" data-k="size"><i></i></div></label>
      <button class="atsq" id="atDrop" title="قطّارة (اضغط وبعدين المس اللوحة)"></button>
      <label class="atslw"><span>الشفافية</span><div class="atsl" id="atOp" data-k="op"><i></i></div></label>
    </div>
    <div class="atdock" id="atDock">
      <button class="atib" data-a="undo" title="تراجع (Ctrl+Z)">${I('undo')}</button>
      <button class="atib atdk" data-a="redo" title="إعادة">${I('redo')}</button>
      <span class="atdsep"></span>
      <button class="atib" data-t="brush" title="فرشاة (B)">${I('brush')}</button>
      <button class="atib" data-t="smudge" title="تلطيخ (S)">${I('smudge')}</button>
      <button class="atib" data-t="eraser" title="ممحاة (E)">${I('erase')}</button>
      <button class="atib" data-t="fill" title="تعبئة (G)">${I('fill')}</button>
      <button class="atib atdk" data-t="grad" title="تدرّج (D)">${I('grad')}</button>
      <button class="atib" data-t="shape" title="أشكال (U)">${I('shape')}</button>
      <button class="atib atdk" data-a="select" title="تحديد">${I('sel')}</button>
      <button class="atib atdk" data-a="transform" title="تحويل (V)">${I('move')}</button>
      <span class="atdsep"></span>
      <button class="atcol" data-a="color" id="atColBtn" title="اللون"></button>
      <span class="atrec" id="atRec"></span>
      <span class="atdsep atdk"></span>
      <button class="atib" data-a="layers" title="الطبقات">${I('layers')}</button>
      <button class="atib atdk" data-a="adjust" title="تعديلات">${I('wand')}</button>
      <button class="atib atdk" data-a="image" title="أضف صورة">${I('img')}</button>
      <button class="atib atdk" data-a="mat" title="مكتبة الخامات: نقوش وخلفيات وإطارات وملصقات">${I('mat')}</button>
      <button class="atib atmo" data-a="more" title="أدوات أكثر">${I('dots')}</button>
    </div>
    <div class="atbub" id="atBub" hidden></div>
    <div class="atpop" id="atPop" hidden></div>
    <div class="atselbar" id="atSelBar" hidden></div>
    <div class="attoast" id="atToast"></div>
    <div class="atwait" id="atWait" hidden></div>
  </div>`;
  const cv = AT.cv = document.getElementById('atCv'); AT.vg = cv.getContext('2d');
  atBindUI(); atBindInput(cv); atResize(); atUIColor(); atUITool(); atUIUndo(); atUISliders();
  if (!AT.loop) AT.loop = requestAnimationFrame(atFrame);
  atRestore().then(ok => { if (S.g.collab) { if (!ok) atInitDoc(1600, 1200, atCollabLayers()); else atCollabFix(); send({ t: 'aneed' }); setTimeout(atMuralLoad, 600); } else if (!ok) { if (S.g.mode === 'pass' || S.g.mode === 'memory') atInitDoc(1600, 1200); else atSizeUI(); } if (S.g.mode === 'memory') setTimeout(atMemShow, 300); if (S.g.mode === 'mono') atToast('لون واحد بس! تقدر تغيّر الشفافية والفرش', 4000); if (S.g.mode === 'oneline') atToast('خط واحد بس بدون ما ترفع، ولو خربت تراجع', 4000); if (S.g.mode === 'blind') atToast('ما راح تشوف رسمتك لين تضغط انتهيت', 4000); });
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
    plus: '<path d="M12 5v14M5 12h14"/>', mat: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="M7.5 13.5l4 6.5h-8z"/><path d="M16.5 13l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z"/>', shape: '<rect x="3.5" y="11" width="9" height="9" rx="1.5"/><circle cx="16" cy="8" r="4.5"/>', text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', play: '<path d="M7 4l13 8-13 8z"/>', down: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'
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
  if (atMode() === 'mono' && S.g.mono && (AT.color !== S.g.mono || AT.color2 !== S.g.mono)) { AT.color = AT.color2 = S.g.mono; atUIColor(); }
  if (!AT.dirty) return; AT.dirty = false; atLiveSoon();
  const g = AT.vg, v = AT.view, d = AT.dpr;
  g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#2b2c33'; g.fillRect(0, 0, AT.vw, AT.vh);
  g.save(); g.translate(AT.vw / 2 + v.x, AT.vh / 2 + v.y); g.rotate(v.r); g.scale(v.f ? -v.z : v.z, v.z); g.translate(-AT.W / 2, -AT.H / 2);
  { const o = 5 / v.z; g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(o, o * 1.6, AT.W, AT.H); } g.fillStyle = '#fff'; g.fillRect(0, 0, AT.W, AT.H); // ظل خفيف بدون blur (الـ blur كل فريم يثقّل)
  g.imageSmoothingEnabled = v.z < 6; // ناعم لين تكبّر واجد (قبل كان من ٢× يطلع مبكسل) g.imageSmoothingQuality = 'high';
  if (!atBlind()) g.drawImage(AT.comp, 0, 0); // الرسم الأعمى: الورقة تبقى بيضا لين تخلص
  // مؤشرات اللاعبين بالرسم الجماعي (مع أسمائهم)
  if (AT.curs) { const now = Date.now(); for (const id in AT.curs) { const c = AT.curs[id]; if (now - c.t > 4000) { delete AT.curs[id]; continue; } const a = Math.min(1, (4000 - (now - c.t)) / 800);
    g.save(); g.globalAlpha = a; g.translate(c.x, c.y); g.scale(1 / v.z * (v.f ? -1 : 1), 1 / v.z); g.rotate(-v.r); g.fillStyle = c.c || '#3d7bff'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 17); g.lineTo(5, 13); g.lineTo(11, 15); g.closePath(); g.fill(); g.stroke();
    g.font = '700 12px system-ui,sans-serif'; const w = g.measureText(c.n).width + 12; g.fillStyle = 'rgba(20,20,28,.85)'; g.beginPath(); g.roundRect(10, 16, w, 20, 8); g.fill(); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.direction = 'rtl'; g.fillText(c.n, 16, 26); g.restore(); } if (Object.keys(AT.curs).length) setTimeout(() => { AT.dirty = true; }, 200); }
  // التحويل: الصورة الطايرة
  if (AT.fl) { const f = AT.fl; g.save(); g.translate(f.x, f.y); g.rotate(f.r); g.scale(f.s * (f.fx ? -1 : 1), f.s * (f.fy ? -1 : 1)); g.globalAlpha = f.l.op; g.drawImage(f.cv, -f.cv.width / 2, -f.cv.height / 2); g.restore(); }
  // التحديد (خط متقطع يمشي)
  if (AT.sel && !AT.fl && AT.selOv) g.drawImage(AT.selOv, 0, 0);
  if (AT.lasso && AT.lasso.pts.length > 1) { g.save(); g.lineWidth = 1.5 / v.z; g.setLineDash([5 / v.z, 4 / v.z]); g.strokeStyle = '#3d7bff'; g.beginPath(); AT.lasso.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (AT.lasso.rect) { const [a, b] = AT.lasso.pts, c = AT.lasso.pts[AT.lasso.pts.length - 1]; g.beginPath(); g.rect(a[0], a[1], c[0] - a[0], c[1] - a[1]); } g.stroke(); g.restore(); }
  // الشبكة والمنظور
  if (AT.guide === 'grid') { g.save(); g.strokeStyle = 'rgba(61,123,255,.28)'; g.lineWidth = 1 / v.z; g.beginPath(); for (let x = AT.gridSz; x < AT.W; x += AT.gridSz) { g.moveTo(x, 0); g.lineTo(x, AT.H); } for (let y = AT.gridSz; y < AT.H; y += AT.gridSz) { g.moveTo(0, y); g.lineTo(AT.W, y); } g.stroke(); g.restore(); }
  if (AT.guide === 'ruler' || AT.guide === 'circle') { const [A, B] = AT.vp || atVpDef(); g.save(); g.lineWidth = 6 / v.z; g.strokeStyle = 'rgba(61,123,255,.22)'; g.beginPath();
    if (AT.guide === 'ruler') { const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1; g.moveTo(A[0] - dx / L * 6000, A[1] - dy / L * 6000); g.lineTo(A[0] + dx / L * 6000, A[1] + dy / L * 6000); } else g.arc(A[0], A[1], Math.hypot(B[0] - A[0], B[1] - A[1]), 0, 7);
    g.stroke(); g.lineWidth = 1.5 / v.z; g.strokeStyle = 'rgba(61,123,255,.85)'; g.stroke(); [A, B].forEach(([x, y]) => { g.fillStyle = '#3d7bff'; g.beginPath(); g.arc(x, y, 9 / v.z, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2 / v.z; g.stroke(); }); g.restore(); }
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
  if (AT.hover && !AT.stroke && ['brush', 'eraser', 'smudge', 'liq', 'fx'].includes(AT.tool) && !AT.pickMode) { const r = AT.size[AT.tool] * v.z / 2; if (r > 2) { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(AT.hover[0], AT.hover[1], r, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(AT.hover[0], AT.hover[1], r + 1, 0, 7); g.stroke(); } }
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
const AT_CJ = new Map();
function atCJ(col, amt) { // نسخة قريبة من اللون (تغيّر لون الفرشاة وهي ترسم)، ٨ نسخ لكل لون عشان الكاش
  const k = col + '|' + amt + '|' + ((Math.random() * 8) | 0); let c = AT_CJ.get(k); if (c) return c; if (AT_CJ.size > 400) AT_CJ.clear();
  const [r, g, b] = atHex(col), [h, sv, v] = atRgb2Hsv(r, g, b); c = atHsv2Hex((h + (Math.random() - .5) * 60 * amt + 360) % 360, atClamp(sv + (Math.random() - .5) * .5 * amt, 0, 1), atClamp(v + (Math.random() - .5) * .5 * amt, 0, 1)); AT_CJ.set(k, c); return c;
}
function atStamp(g, b, x, y, p, dir, col, sz, box) {
  if (b.cj && col.length === 7) col = atCJ(col, b.cj);
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
      g.globalAlpha = Math.min(1, a);
      if (b.tip === 'hard') { g.fillStyle = col; g.beginPath(); g.arc(px, py, s / 2, 0, 6.2832); g.fill(); } // دايرة حقيقية: حادة بأي حجم
      else { const t = atCTip(b.tip, col);
      if (aa) { g.save(); g.translate(px, py); g.rotate(aa); g.drawImage(t, -s / 2, -s / 2, s, s); g.restore(); } else g.drawImage(t, px - s / 2, py - s / 2, s, s); }
    }
    if (box) { const r = s * (b.sc ? 1 + b.sc * 2 : 1) / 2 + 2; box[0] = Math.min(box[0], px - r); box[1] = Math.min(box[1], py - r); box[2] = Math.max(box[2], px + r); box[3] = Math.max(box[3], py + r); }
  }
}
// فرشاة الفلاتر: ترسم نسخة مفلترة من الطبقة (تنعيم، إضاءة، تشبّع...) بس مكان ما تمرّ
const AT_FX = { blur: ['تنعيم', 'blur(5px)'], light: ['إضاءة', 'brightness(1.3)'], dark: ['تغميق', 'brightness(.72)'], sat: ['ألوان أقوى', 'saturate(1.8)'], gray: ['رمادي', 'grayscale(1)'], hue: ['تغيير اللون', 'hue-rotate(45deg)'], warm: ['دافي', 'sepia(.45) saturate(1.3)'], contrast: ['حدة', 'contrast(1.4)'] };
function atFxStamp(l, x, y, p, sz, box) {
  const s = Math.max(4, Math.min(400, sz)) | 0, pc = AT.fxc || (AT.fxc = atMk(400, 400)), pg = pc.getContext('2d');
  for (const [px, py] of atSymPts(x, y)) {
    pg.save(); pg.globalCompositeOperation = 'copy'; pg.globalAlpha = 1; pg.drawImage(AT.fxSrc, px - s / 2, py - s / 2, s, s, 0, 0, s, s); pg.globalCompositeOperation = 'destination-in'; pg.drawImage(atTip('soft'), 0, 0, s, s); pg.restore();
    const lg = l.g; lg.save(); lg.globalAlpha = AT.op.fx * (.3 + .7 * p) * .5; lg.globalCompositeOperation = l.lock ? 'source-atop' : 'source-over'; lg.drawImage(pc, 0, 0, s, s, px - s / 2, py - s / 2, s, s); lg.restore();
    box[0] = Math.min(box[0], px - s); box[1] = Math.min(box[1], py - s); box[2] = Math.max(box[2], px + s); box[3] = Math.max(box[3], py + s);
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
  if (atMode() === 'oneline' && !AT.botBusy) { if (AT.oneAt != null && AT.undo.length >= AT.oneAt) { atToast('خط واحد بس! تراجع لو تبي تعيده'); return; } AT.oneAt = AT.undo.length + 1; }
  if (!L.vis || (L.grp && AT.groups[L.grp] && !AT.groups[L.grp].vis)) { atToast('الطبقة مخفية، شغّلها من الطبقات'); return; }
  const tool = AT.tool, b = tool === 'fx' ? atBr('soft') : tool === 'grad' || tool === 'shape' ? { flow: 1 } : tool === 'liq' ? { sp: .1, flow: 1, st: .25, id: 'liq' } : atBr(AT.bt[tool] || AT.bt.brush), sz = AT.size[tool] || 20;
  const st = AT.stream[b.id] != null ? AT.stream[b.id] : b.st || 0;
  AT.stroke = { tool, b, sz, col: l.isMask ? (tool === 'eraser' ? '#000000' : '#ffffff') : AT.color, pts: [[x, y]], sm: [x, y], rp: [x, y], o: [x, y], last: [x, y], lp: p, dist: 0, rem: 0, box: [1e9, 1e9, -1e9, -1e9], st, t0: performance.now(), moved: performance.now(), shape: null, dir: 0 };
  if (tool === 'fx') { const f = AT.fxSrc && AT.fxSrc.width === AT.W && AT.fxSrc.height === AT.H ? AT.fxSrc : (AT.fxSrc = atMk(AT.W, AT.H)), fg = f.getContext('2d'); fg.save(); fg.clearRect(0, 0, AT.W, AT.H); if (atHasFilter()) fg.filter = AT_FX[AT.fxMode][1]; fg.drawImage(l.cv, 0, 0); fg.restore(); }
  if (atDirect(tool)) { AT.snap = AT.snap && AT.snap.width === AT.W && AT.snap.height === AT.H ? AT.snap : atMk(AT.W, AT.H); const sg = AT.snap.getContext('2d'); sg.globalCompositeOperation = 'copy'; sg.drawImage(l.cv, 0, 0); sg.globalCompositeOperation = 'source-over'; }
  else {
    const sb = AT.sb.getContext('2d'); sb.setTransform(1, 0, 0, 1, 0, 0); sb.globalCompositeOperation = 'source-over'; sb.clearRect(0, 0, AT.W, AT.H);
    // كاش اللي تحت واللي فوق عشان الرسم يكون سريع
    const i = AT.cur, simple = !L.clip && !L.mask && !L.grp && !(AT.layers[i + 1] && AT.layers[i + 1].clip) && !AT.layers.some((x, j) => j > i && x.adj && x.vis);
    AT.stroke.simple = simple;
    if (simple) { atCompose(AT.below, null, 0, i, true); atCompose(AT.above, null, i + 1, AT.layers.length, false); }
    const lv = AT.live.getContext('2d'); lv.globalCompositeOperation = 'copy'; lv.globalAlpha = 1; lv.drawImage(l.cv, 0, 0); lv.globalCompositeOperation = 'source-over';
  }
  if (atCollab() && ['brush', 'eraser'].includes(tool) && !l.isMask) atCollabSend('s', { k: 's', b: Object.assign({}, b, { taper: 0 }), sz, col: AT.stroke.col, tool, sym: AT.sym });
  atStrokeTo(x, y, p, true);
}
function atStrokeTo(rx, ry, p, first) {
  const S = AT.stroke; if (!S || S.shape) return;
  if (S.tool === 'grad' || S.tool === 'shape') { S.pend = [rx, ry]; if (!S.raf) S.raf = requestAnimationFrame(() => { S.raf = 0; if (AT.stroke !== S || !S.pend) return; const [a, b] = S.pend; S.pend = null; S.tool === 'grad' ? atGradTo(a, b) : atShapeTo(a, b); }); return; } // مرة وحدة كل فريم
  // مساعدة الرسم: المنظور والشبكة يثبتون اتجاه الخط
  // المساطر: لو بديت الخط قريب من المسطرة (خط أو دائرة) يمشي عليها بالضبط
  if (AT.guide === 'ruler' || AT.guide === 'circle') { const [A, B] = AT.vp || atVpDef();
    if (first) { const d = AT.guide === 'ruler' ? atSegDist(rx, ry, A, B, true) : Math.abs(Math.hypot(rx - A[0], ry - A[1]) - Math.hypot(B[0] - A[0], B[1] - A[1])); S.onRuler = d * AT.view.z < 44; }
    if (S.onRuler) { if (AT.guide === 'ruler') { const dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy || 1, t = ((rx - A[0]) * dx + (ry - A[1]) * dy) / L2; rx = A[0] + dx * t; ry = A[1] + dy * t; }
      else { const R = Math.hypot(B[0] - A[0], B[1] - A[1]), a = Math.atan2(ry - A[1], rx - A[0]); rx = A[0] + Math.cos(a) * R; ry = A[1] + Math.sin(a) * R; } if (first) { S.sm = [rx, ry]; S.last = [rx, ry]; S.o = [rx, ry]; S.pts = [[rx, ry]]; } } }
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
  if (first) atOneStamp(x, y, p * (b.taper && S.tool !== 'eraser' ? .06 : 1), x, y); // أول الخط رفيع مو نقطة
  else while (t <= d) {
    const f = t / d, px = lx + dx * f, py = ly + dy * f, pp = S.lp + (p - S.lp) * f;
    const tp = b.taper && S.tool !== 'eraser' ? Math.min(1, (n0 + t) / b.taper) : 1; S.fk = b.fade && S.tool === 'brush' ? Math.max(.03, 1 - (n0 + t) / b.fade) : 1; // البداية الرفيعة، والتلاشي (الخط يرق لين يختفي)
    if (S.fk <= .03) { t += step; continue; }
    atOneStamp(px, py, pp * tp * (S.fk < 1 ? .5 + S.fk * .5 : 1), S.lx || lx, S.ly || ly); S.lx = px; S.ly = py; t += step;
  }
  S.rem = t - d; S.dist += d; S.last = [x, y]; S.lp = p;
  const sg = S.seg, B = S.box; B[0] = Math.min(B[0], sg[0]); B[1] = Math.min(B[1], sg[1]); B[2] = Math.max(B[2], sg[2]); B[3] = Math.max(B[3], sg[3]);
  if (more) return; // نقاط المنحنى اللي بالنص: نحدّث الشاشة مرة وحدة بآخرها
  S.seg = null;
  if (sg[2] >= sg[0]) { if (!atDirect(S.tool)) atLiveUpdate(sg); else atRegionComp(sg); }
  AT.dirty = true;
}
function atOneStamp(x, y, p, px, py) {
  const S = AT.stroke, b = S.b;
  const bx = S.seg || S.box;
  if (S.tool === 'smudge') return atSmudgeStamp(atTgt(), b, px, py, x, y, p, S.sz, bx);
  if (S.tool === 'fx') return atFxStamp(atTgt(), x, y, p, S.sz, bx);
  if (S.tool === 'liq') return atLiqDab(atTgt(), px, py, x, y, p, S.sz, bx);
  const g = AT.sb.getContext('2d'); g.globalCompositeOperation = 'source-over';
  atStamp(g, b, x, y, p, S.dir, S.tool === 'eraser' ? '#000000' : S.col, S.sz * (S.fk || 1), bx);
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
  if (S.pend) { const [a, b] = S.pend; S.pend = null; S.tool === 'grad' ? atGradTo(a, b) : atShapeTo(a, b); } if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  if (!S.shape && S.dist > 0 && S.tool !== 'grad' && S.tool !== 'shape') { // نلحق آخر نقطة بمنحنى (التنعيم يخلي القلم متأخر شوي) بدل خط مستقيم
    const L = S.pts[S.pts.length - 1]; for (let i = 0; i < 6 && Math.hypot(S.sm[0] - L[0], S.sm[1] - L[1]) * AT.view.z > 1.5; i++) { S.pts.pop(); atStrokeTo(L[0], L[1], S.lp); }
    if (S.q) { const [p0, p1] = [S.q[1], [S.sm[0], S.sm[1]]], m0 = [(S.q[0][0] + p0[0]) / 2, (S.q[0][1] + p0[1]) / 2]; for (let i = 1; i <= 6; i++) { const t = i / 6, u = 1 - t; atStrokeSeg(u * u * m0[0] + 2 * u * t * p0[0] + t * t * p1[0], u * u * m0[1] + 2 * u * t * p0[1] + t * t * p1[1], S.lp, false, i < 6); } }
    atStrokeSeg(L[0], L[1], S.lp);
  }
  AT.ropeLn = null;
  const l = atTgt(), b = S.box; AT.stroke = null; if (atCollab() && ['brush', 'eraser'].includes(S.tool)) atCollabSend('e');
  if (b[2] < b[0]) { atRecomp(); return; }
  const x = b[0] - 2, y = b[1] - 2, w = b[2] - b[0] + 4, h = b[3] - b[1] + 4;
  if (atDirect(S.tool)) {
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
    if ((S.tool === 'brush' || S.tool === 'grad' || S.tool === 'shape') && !l.isMask) atAddHist(S.col);
  }
  if (S.simple && !l.isMask && !(S.b && S.b.wet) && AT.comp && !AT.anim) { AT.stroke = S; atRegionComp(S.box); AT.stroke = null; AT.dirty = true; } else atRecomp(); atThumbSoon(); // نركّب منطقة الضربة بس (قبل كانت اللوحة كاملة كل ضربة)
}
// التدرّج: من أول نقطة لآخر نقطة (خطي أو دائري) للشفاف أو للون الثاني
function atGradTo(x, y) {
  const S = AT.stroke, [ax, ay] = S.o, g = AT.sb.getContext('2d'); g.clearRect(0, 0, AT.W, AT.H);
  const c1 = S.col, c2 = AT.gradTo === 'c2' ? (AT.color2 || '#ffffff') : S.col + '00';
  const gr = AT.gradMode === 'rad' ? g.createRadialGradient(ax, ay, 0, ax, ay, Math.max(1, Math.hypot(x - ax, y - ay))) : g.createLinearGradient(ax, ay, x, y);
  gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, AT.W, AT.H);
  S.box = [0, 0, AT.W, AT.H]; S.dist = 1; S.gEnd = [x, y]; atLiveUpdate(); AT.dirty = true;
}
// ===== الأشكال: مربع، دائرة، نجمة، قلب... تسحب من زاوية لزاوية =====
const AT_SHP = [['rect', 'مربع'], ['rrect', 'مربع مدوّر'], ['ellipse', 'دائرة'], ['tri', 'مثلث'], ['star', 'نجمة'], ['poly', 'مسدس'], ['diamond', 'معيّن'], ['heart', 'قلب'], ['arrow', 'سهم'], ['line', 'خط']];
function atShapePath(g, k, x0, y0, x1, y1) {
  const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), cx = x + w / 2, cy = y + h / 2; g.beginPath();
  if (k === 'rect') g.rect(x, y, w, h);
  else if (k === 'rrect') { const r = Math.min(w, h) * .22; g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
  else if (k === 'ellipse') g.ellipse(cx, cy, w / 2, h / 2, 0, 0, 6.2832);
  else if (k === 'tri') { g.moveTo(cx, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.closePath(); }
  else if (k === 'diamond') { g.moveTo(cx, y); g.lineTo(x + w, cy); g.lineTo(cx, y + h); g.lineTo(x, cy); g.closePath(); }
  else if (k === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .4 : 1; g.lineTo(cx + Math.cos(a) * w / 2 * r, cy + Math.sin(a) * h / 2 * r * 1.05 + h * .03); } g.closePath(); }
  else if (k === 'poly') { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.lineTo(cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h / 2); } g.closePath(); }
  else if (k === 'heart') { g.moveTo(cx, y + h); g.bezierCurveTo(x - w * .1, y + h * .55, x + w * .05, y - h * .1, cx, y + h * .28); g.bezierCurveTo(x + w * .95, y - h * .1, x + w * 1.1, y + h * .55, cx, y + h); g.closePath(); }
  else if (k === 'arrow') { const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, hw = Math.max(AT.size.shape * 2.6, L * .14), hl = Math.max(AT.size.shape * 3, L * .22);
    g.moveTo(x0, y0); g.lineTo(x1 - ux * hl * .7, y1 - uy * hl * .7); g.moveTo(x1, y1); g.lineTo(x1 - ux * hl - uy * hw, y1 - uy * hl + ux * hw); g.moveTo(x1, y1); g.lineTo(x1 - ux * hl + uy * hw, y1 - uy * hl - ux * hw); }
  else if (k === 'line') { g.moveTo(x0, y0); g.lineTo(x1, y1); }
}
function atShapeTo(x, y) {
  const S = AT.stroke, [ax, ay] = S.o, g = AT.sb.getContext('2d'); g.clearRect(0, 0, AT.W, AT.H);
  let x1 = x, y1 = y; const k = AT.shp, open = k === 'line' || k === 'arrow';
  if (!open && (AT.shpEq || AT.shift)) { const d = Math.max(Math.abs(x - ax), Math.abs(y - ay)); x1 = ax + Math.sign(x - ax || 1) * d; y1 = ay + Math.sign(y - ay || 1) * d; }
  const lw = Math.max(1, AT.size.shape); g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = lw; atShapePath(g, k, ax, ay, x1, y1);
  const mode = open ? 'line' : AT.shpFill;
  if (mode === 'fill' || mode === 'both') { g.fillStyle = mode === 'both' ? (AT.color2 || '#ffffff') : S.col; g.fill(); }
  if (mode === 'line' || mode === 'both') { g.strokeStyle = S.col; g.stroke(); }
  g.restore();
  S.box = [Math.min(ax, x1) - lw * 4 - 4, Math.min(ay, y1) - lw * 4 - 4, Math.max(ax, x1) + lw * 4 + 4, Math.max(ay, y1) + lw * 4 + 4]; S.dist = 1; atLiveUpdate(); AT.dirty = true;
}
// اتجاه مساعدة الرسم: أقرب خط (للنقطة المتلاشية أو أفقي/عمودي)
function atAssistDir(o, dx, dy) {
  const L = Math.hypot(dx, dy), u = [dx / L, dy / L], c = [[1, 0], [0, 1]];
  if (AT.guide !== 'grid') (AT.vp || atVpDef()).slice(0, AT.guide === 'persp1' ? 1 : 2).forEach(([vx, vy]) => { const ex = vx - o[0], ey = vy - o[1], el = Math.hypot(ex, ey) || 1; c.push([ex / el, ey / el]); });
  if (AT.guide === 'persp1') c.splice(0, 0); // نقطة وحدة: أفقي وعمودي وللنقطة
  let best = c[0], bd = -1; c.forEach(v => { const d = Math.abs(v[0] * u[0] + v[1] * u[1]); if (d > bd) { bd = d; best = v; } });
  return best;
}
const atSegDist = (x, y, A, B, inf) => { const dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy || 1; let t = ((x - A[0]) * dx + (y - A[1]) * dy) / L2; if (!inf) t = atClamp(t, 0, 1); return Math.hypot(x - A[0] - dx * t, y - A[1] - dy * t); };
const atVpDef = () => (AT.vp = AT.guide === 'ruler' ? [[AT.W * .2, AT.H * .5], [AT.W * .8, AT.H * .5]] : AT.guide === 'circle' ? [[AT.W / 2, AT.H / 2], [AT.W / 2 + Math.min(AT.W, AT.H) * .3, AT.H / 2]] : AT.guide === 'persp1' ? [[AT.W / 2, AT.H * .42]] : [[-AT.W * .15, AT.H * .42], [AT.W * 1.15, AT.H * .42]]);
// الشكل السريع (QuickShape): توقف ثانية آخر الخط ويتعدل لخط أو دائرة أو مستطيل
function atQuickShape() {
  const S = AT.stroke; if (!S || S.shape || atDirect(S.tool) || S.tool === 'grad' || S.tool === 'shape' || S.lock || !AT.qs || S.pts.length < 6) return;
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
  const f = atFlood(x, y, AT.comp, AT.fillTol == null ? 30 : AT.fillTol), { W, H } = f, grow = AT.fillGrow == null ? 2 : AT.fillGrow;
  const bx = Math.max(0, f.bx - grow - 1), by = Math.max(0, f.by - grow - 1), bw = Math.min(W, f.bx + f.bw + grow + 1) - bx, bh = Math.min(H, f.by + f.bh + grow + 1) - by;
  let m = new Uint8Array(bw * bh); for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) m[yy * bw + xx] = f.m[(by + yy) * W + bx + xx];
  // نسد الفراغات الصغيرة اللي جوّا المنطقة (حبيبات الفرشاة والنقاط البيضا) — اللي ما توصل لطرف المنطقة ومساحتها صغيرة
  if (AT.fillHoles !== false) { const N = bw * bh, seen = new Uint8Array(N), q = new Int32Array(N), small = Math.max(40, (f.bw * f.bh) / 2500);
    for (let i0 = 0; i0 < N; i0++) { if (m[i0] || seen[i0]) continue; let qh = 0, qt = 0, edge = false; q[qt++] = i0; seen[i0] = 1;
      while (qh < qt) { const i = q[qh++], xx = i % bw; if (xx === 0 || i < bw || xx === bw - 1 || i >= N - bw) edge = true;
        if (xx > 0 && !seen[i - 1] && !m[i - 1]) { seen[i - 1] = 1; q[qt++] = i - 1; } if (xx < bw - 1 && !seen[i + 1] && !m[i + 1]) { seen[i + 1] = 1; q[qt++] = i + 1; }
        if (i >= bw && !seen[i - bw] && !m[i - bw]) { seen[i - bw] = 1; q[qt++] = i - bw; } if (i < N - bw && !seen[i + bw] && !m[i + bw]) { seen[i + bw] = 1; q[qt++] = i + bw; } }
      if (!edge && qt <= small) for (let k = 0; k < qt; k++) m[q[k]] = 1; } }
  // نكبّر المنطقة شوي عشان تدخل تحت حواف الخطوط وما يبقى خط أبيض
  let n2 = new Uint8Array(bw * bh); for (let k = 0; k < grow; k++) { n2.set(m); for (let yy = 0; yy < bh; yy++) { const r = yy * bw; for (let xx = 0; xx < bw; xx++) { const i = r + xx; if (m[i]) continue; if ((xx > 0 && m[i - 1]) || (xx < bw - 1 && m[i + 1]) || (yy > 0 && m[i - bw]) || (yy < bh - 1 && m[i + bw])) n2[i] = 1; } } const t = m; m = n2; n2 = t; }
  const mk = atMk(bw, bh), mg = mk.getContext('2d'), id = mg.createImageData(bw, bh), [cr, cg, cb] = atHex(l.isMask ? '#ffffff' : AT.color);
  for (let i = 0; i < bw * bh; i++) if (m[i]) { const k = i * 4; id.data[k] = cr; id.data[k + 1] = cg; id.data[k + 2] = cb; id.data[k + 3] = 255; }
  mg.putImageData(id, 0, 0);
  if (AT.sel) { mg.globalCompositeOperation = 'destination-in'; mg.drawImage(AT.sel.mask, bx, by, bw, bh, 0, 0, bw, bh); }
  const before = atPatch(l, bx, by, bw, bh); const g = l.g; g.save(); g.globalAlpha = 1; g.globalCompositeOperation = l.lock ? 'source-atop' : 'source-over'; if (atHasFilter()) g.filter = 'blur(0.7px)'; g.drawImage(mk, bx, by); if (atHasFilter()) { g.filter = 'none'; g.drawImage(mk, bx, by); } g.restore(); // نعّمنا الحواف (بدون ما يبان مدرّج لما تكبّر)
  atPush(atPxEntry(l, before)); atAddHist(AT.color); atRecomp(); atThumbSoon(); atCapSoon(); atSaveSoon(); try { sfx('pop'); } catch {}
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
  if (AT.tool === 'fx') { bar.hidden = false; bar.innerHTML = `${Object.entries(AT_FX).map(([k, [n]]) => `<button data-fxm="${k}" class="${AT.fxMode === k ? 'on' : ''}">${n}</button>`).join('')}<button data-fxm="done" class="ok">تم</button>`; return; }
  if (AT.tool === 'liq') { const m = AT.liqMode || 'push'; bar.hidden = false; bar.innerHTML = `${[['push', 'دفع'], ['twirl', 'لف'], ['pinch', 'شد للداخل'], ['expand', 'تكبير']].map(([k, n]) => `<button data-lq="${k}" class="${m === k ? 'on' : ''}">${n}</button>`).join('')}<span>الحجم والقوة من الشريط الجانبي</span><button data-lq="done" class="ok">تم</button>`; return; }
  if (AT.tool === 'vp') { bar.hidden = false; bar.innerHTML = `<span>اسحب النقاط الزرقا للمكان اللي تبيه</span><button data-vp="ok" class="ok">تم</button>`; return; }
  if (AT.tool === 'shape') { bar.hidden = false; bar.innerHTML = `${AT_SHP.map(([k, t]) => `<button data-shp="${k}" class="${AT.shp === k ? 'on' : ''}">${t}</button>`).join('')}<i class="atsep"></i>${[['fill', 'تعبئة'], ['line', 'حدود'], ['both', 'الاثنين']].map(([k, t]) => `<button data-shf="${k}" class="${AT.shpFill === k ? 'on' : ''}">${t}</button>`).join('')}<button data-shq="1" class="${AT.shpEq ? 'on' : ''}">متساوي</button>`; return; }
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
    <button class="atbtn" id="atLiq">تسييل (Liquify)</button> <button class="atbtn" id="atFxB">فرشاة الفلاتر</button>
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
  document.getElementById('atFxB').onclick = () => { document.getElementById('atAdjNo').click(); atSetTool('fx'); atToast('لوّن مكان ما تبي الفلتر: تنعيم، إضاءة، ألوان...'); };
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
  if (atDirect(S.tool)) { const g = atTgt().g; g.save(); g.globalCompositeOperation = 'copy'; g.drawImage(AT.snap, 0, 0); g.restore(); }
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
    if (ATB.refine) { atBotRefineAt(dx, dy); return; } // زيد تفاصيل هنا
    if (AT.botBusy) return atToast('الرسام الآلي يرسم الحين، تحكم فيه من الشريط فوق');
    if (AT.tool === 'fill') { if (atMode() === 'oneline') return atToast('التعبئة مقفلة بهالطريقة'); return atFill(dx, dy); }
    if (AT.tool === 'text') return atTextAt(dx, dy);
    if (AT.tool === 'select') { if (AT.selMode === 'wand') return atWand(dx, dy); AT.lasso = { pts: [[dx, dy]], rect: AT.selMode === 'rect' }; if ((AT.selOp || 'new') === 'new') AT.sel = null; AT.dirty = true; return; }
    if (AT.tool === 'transform' && AT.fl) { atTfDown(x, y); return; }
    if (['brush', 'eraser', 'smudge', 'grad', 'liq', 'shape', 'fx'].includes(AT.tool)) {
      atStrokeStart(dx, dy, prs(e));
      // ضغط مطوّل بدون حركة = قطّارة
      clearTimeout(lpT); if (AT.tool !== 'grad' && AT.tool !== 'liq' && AT.tool !== 'shape' && AT.tool !== 'fx') lpT = setTimeout(() => { const S = AT.stroke; if (!S || S.dist * AT.view.z > 6 || S.shape) return; atCancelStroke(); AT.loupe = { s: [x, y], c: atSample(dx, dy) }; AT.dirty = true; try { navigator.vibrate && navigator.vibrate(15); } catch {} }, 480);
    }
  });
  cv.addEventListener('pointermove', e => {
    const [x, y] = pt(e); if (e.pointerType === 'mouse') { AT.hover = [x, y]; if (!AT.stroke) AT.dirty = true; }
    if (atCollab() && Date.now() - (AT.curT || 0) > 110) { AT.curT = Date.now(); const [cx, cy] = atToDoc(x, y); if (cx > -50 && cy > -50 && cx < AT.W + 50 && cy < AT.H + 50) send({ t: 'acur', x: cx, y: cy, c: AT.color }); }
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
    if (S && !S.shape && S.tool !== 'grad' && S.tool !== 'liq' && S.tool !== 'shape') { const q = S.pts[S.pts.length - 1]; if (!S.hold || Math.hypot(q[0] - S.hold[0], q[1] - S.hold[1]) * AT.view.z > 4) { S.hold = q; clearTimeout(AT.qsT); AT.qsT = setTimeout(atQuickShape, 650); } }
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
    addEventListener('keydown', e => { AT.shift = e.shiftKey; }); addEventListener('keyup', e => { AT.shift = e.shiftKey; });
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
      else if (k === 'b') atSetTool('brush'); else if (k === 'e') atSetTool('eraser'); else if (k === 's') atSetTool('smudge'); else if (k === 'g') atSetTool('fill'); else if (k === 'u') atSetTool('shape'); else if (k === 't') atSetTool('text'); else if (k === 'd') atSetTool('grad'); else if (k === 'l') atSetTool('select'); else if (k === 'v') { if (AT.fl) atFloatCommit(); else atFloatStart(); }
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
  atInsertCanvas(cv, 'صورة', .9);
}
function atInsertCanvas(cv, name, fit) { // يحط الصورة كطبقة جديدة عايمة تقدر تحركها وتكبرها
  if (AT.layers.length >= AT.maxL) return atToast('وصلت حد الطبقات'); if (AT.fl) atFloatCommit(); const w = cv.width, h = cv.height;
  atStructDo(() => { AT.layers.splice(AT.cur + 1, 0, atLayer(name)); AT.cur++; });
  const l = atL(), lv = AT.live.getContext('2d'); lv.clearRect(0, 0, AT.W, AT.H);
  AT.fl = { l, cv, x: AT.W / 2, y: AT.H / 2, r: 0, s: Math.min(1, AT.W * fit / w, AT.H * fit / h), fx: false, fy: false, before: l.g.getImageData(0, 0, AT.W, AT.H), isNew: true };
  AT.prevTool = AT.tool === 'transform' ? 'brush' : AT.tool; AT.tool = 'transform'; atUITool(); atSelBar(); atRecomp(); atToast(name === 'صورة' ? 'حرّك الصورة وكبّرها، وبعدين «تم»' : 'حرّكها وكبّرها، وبعدين «تم»');
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
  if (t === 'fill') atToast('المس المكان اللي تبي تعبّيه'); if (t === 'shape') atToast('اسحب من زاوية لزاوية، والحجم يتحكم بسماكة الحدود');
}
function atUITool() { const c = AT.cv; if (c) c.style.cursor = AT.tool === 'transform' ? 'move' : AT.tool === 'vp' ? 'grab' : 'crosshair'; document.querySelectorAll('#atStudio [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === AT.tool)); document.querySelectorAll('#atStudio [data-a="select"]').forEach(b => b.classList.toggle('on', AT.tool === 'select')); document.querySelectorAll('#atStudio [data-a="transform"]').forEach(b => b.classList.toggle('on', AT.tool === 'transform')); }
function atUIColor() { const b = document.getElementById('atColBtn'); if (b) b.style.background = AT.color;
  const r = document.getElementById('atRec'); if (r) { const h = (AT.hist || []).filter(c => c !== AT.color).slice(0, 5); const sig = h.join(); if (r.dataset.sig !== sig) { r.dataset.sig = sig; r.innerHTML = h.map(c => `<button class="atrc" data-c="${c}" style="background:${c}" title="${c}"></button>`).join(''); r.querySelectorAll('[data-c]').forEach(x => x.onclick = e => { e.stopPropagation(); AT.color = x.dataset.c; atAddHist(AT.color); atUIColor(); if (['eraser', 'smudge', 'liq'].includes(AT.tool)) atSetTool('brush'); }); } } }
function atUIDrop() { const b = document.getElementById('atDrop'); if (b) { b.classList.toggle('on', !!AT.pickMode); b.style.background = AT.color; } }
function atUIUndo() { const u = document.querySelector('#atDock [data-a="undo"]'), r = document.querySelector('#atDock [data-a="redo"]'); if (u) u.disabled = !AT.undo.length; if (r) r.disabled = !AT.redo.length; }
function atUISliders() {
  const t = AT.tool in AT.size ? AT.tool : 'brush';
  const s = document.querySelector('#atSize i'), o = document.querySelector('#atOp i');
  if (s) s.style.width = (Math.log(AT.size[t]) / Math.log(600) * 100) + '%'; if (o) o.style.width = (AT.op[t] * 100) + '%';
  atUIDrop();
}
function atAddHist(c) { AT.hist = [c, ...AT.hist.filter(x => x !== c)].slice(0, 12); atPrefs(); atUIColor(); }
function atPrefs() { try { localStorage.setItem('tart-prefs', JSON.stringify({ bt: AT.bt, color: AT.color, color2: AT.color2, hist: AT.hist, size: AT.size, stream: AT.stream, pc: AT.pc, rope: AT.rope, bover: AT.bover, custom: AT.custom, imgPal: AT.imgPal, grpSel: AT.grpSel })); } catch {} }
let AT_TOAST = 0;
function atToast(t, ms = 1400) { const e = document.getElementById('atToast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(AT_TOAST); AT_TOAST = setTimeout(() => e.classList.remove('on'), ms); }
function atToggleUI() { AT.ui = !AT.ui; document.getElementById('atStudio').classList.toggle('noui', !AT.ui); atToast(AT.ui ? 'رجعت الأدوات' : 'وضع اللوحة كاملة (٤ أصابع أو Tab ترجعها)'); }
function atClosePop(soft) { const p = document.getElementById('atPop'); if (!p || p.hidden) return; if (soft && (AT.popK === 'text' || AT.popK === 'adjust')) return; p.hidden = true; AT.popK = null; document.body.classList.remove('atpopen'); document.querySelectorAll('#atStudio .atib.pop').forEach(b => b.classList.remove('pop')); }
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
    else if (a === 'color' && atMode() === 'mono') atToast('لون واحد بس بهالجولة');
    else if (a === 'layers' || a === 'color' || a === 'menu') atOpenPop(a, b); else if (a === 'more') atOpenPop('xtools', b); else if (a === 'mat') atOpenPop('mat', b);
    else if (a === 'adjust') { atClosePop(); atAdjust(); }
    else if (a === 'select') { atClosePop(); atSetTool('select'); }
    else if (a === 'transform') { atClosePop(); if (AT.fl) atFloatCommit(); else atFloatStart(); }
    else if (a === 'image') { atClosePop(); atPickFile(atInsertImage); }
    if (b.dataset.s) atSelAct(b.dataset.s);
    if (b.dataset.g) { const k = b.dataset.g; if (k === 'lin' || k === 'rad') AT.gradMode = k; else if (k === 'tr' || k === 'c2') AT.gradTo = k; else if (k === 'set2') { AT.color2 = AT.color; atToast('صار اللون الثاني'); } atSelBar(); }
    if (b.dataset.vp) { atSetTool('brush'); }
    if (b.dataset.shp) { AT.shp = b.dataset.shp; atSelBar(); } if (b.dataset.shf) { AT.shpFill = b.dataset.shf; atSelBar(); } if (b.dataset.shq) { AT.shpEq = !AT.shpEq; atSelBar(); }
    if (b.dataset.fxm) { if (b.dataset.fxm === 'done') atSetTool('brush'); else { AT.fxMode = b.dataset.fxm; atSelBar(); } }
    if (b.dataset.lq) { if (b.dataset.lq === 'done') atSetTool('brush'); else { AT.liqMode = b.dataset.lq; atSelBar(); } }
    if (b.dataset.f) { const f = AT.fl; if (!f) return; const k = b.dataset.f; if (k === 'fx') f.fx = !f.fx; else if (k === 'fy') f.fy = !f.fy; else if (k === 'r90') f.r += Math.PI / 2; else if (k === 'fit') { f.r = 0; f.x = AT.W / 2; f.y = AT.H / 2; f.s = Math.max(AT.W / f.cv.width, AT.H / f.cv.height); } else if (k === 'cancel') atFloatCancel(); else if (k === 'ok') atFloatCommit(); AT.dirty = true; }
  });
  document.getElementById('atDrop').onclick = () => { AT.pickMode = !AT.pickMode; atUIDrop(); if (AT.pickMode) atToast('المس اللوحة عشان تاخذ اللون'); };
  // سلايدر الحجم والشفافية (اسحب فوق/تحت)
  document.querySelectorAll('#atSide .atsl').forEach(el => {
    const set = e => { const r = el.getBoundingClientRect(), f = atClamp((r.right - e.clientX) / r.width, 0, 1), t = AT.tool in AT.size ? AT.tool : 'brush';
      if (el.dataset.k === 'size') AT.size[t] = Math.max(1, Math.round(Math.pow(600, f))); else AT.op[t] = Math.max(.02, Math.round(f * 100) / 100);
      atUISliders(); const bub = document.getElementById('atBub'); bub.hidden = false; const sz = el.dataset.k === 'size' ? AT.size[t] : 0;
      bub.innerHTML = el.dataset.k === 'size' ? `<i style="width:${Math.min(120, sz * AT.view.z)}px;height:${Math.min(120, sz * AT.view.z)}px;background:${AT.color}"></i><span>${atNum(sz)} بكسل</span>` : `<i style="width:60px;height:60px;background:${AT.color};opacity:${AT.op[t]}"></i><span>${atNum(Math.round(AT.op[t] * 100))}٪</span>`; };
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); el.dragging = true; set(e); });
    el.addEventListener('pointermove', e => el.dragging && set(e));
    const end = () => { el.dragging = false; document.getElementById('atBub').hidden = true; atPrefs(); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  });
  document.getElementById('atFin').onclick = () => { if (atMode() === 'pass' && S.g.pr != null && S.g.pr + 1 < S.g.prn) return atToast('الرسمة تنتقل للي بعدك لما يخلص وقت الدور'); atFinish(); };
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
  if (k === 'brushes') atBrushUI(pop); else if (k === 'layers') atLayersUI(); else if (k === 'color') atColorUI(pop); else if (k === 'menu') atMenuUI(pop); else if (k === 'xtools') atMoreUI(pop); else if (k === 'abot') atBotUI(pop); else if (k === 'mat') atMatUI(pop);
}
// الجوال: الأدوات اللي ما تكفيها الشريط
function atMoreUI(pop) {
  const I = atIcon, it = (k, t, ic) => `<button data-${k.startsWith('t:') ? 't' : 'a'}="${k.slice(2)}"><span>${I(ic)}</span>${t}</button>`;
  pop.innerHTML = `<div class="athd"><b>أدوات أكثر</b></div><div class="atmoreg">${it('a:redo', 'إعادة', 'redo')}${it('t:grad', 'تدرّج', 'grad')}${it('a:select', 'تحديد', 'sel')}${it('a:transform', 'تحويل', 'move')}${it('a:adjust', 'تعديلات', 'wand')}${it('a:image', 'صورة', 'img')}${it('a:mat', 'مكتبة الخامات', 'mat')}</div>`;
}
// ===== مكتبة الخامات: نقوش، خلفيات، إطارات، ملصقات (كلها مرسومة بالكود، تاخذ اللون الحالي) =====
const atStar = (g, cx, cy, R, r, n) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.closePath(); };
const atHeart = (g, cx, cy, s) => { g.beginPath(); g.moveTo(cx, cy + s * .35); g.bezierCurveTo(cx - s * .9, cy - s * .25, cx - s * .45, cy - s * .85, cx, cy - s * .38); g.bezierCurveTo(cx + s * .45, cy - s * .85, cx + s * .9, cy - s * .25, cx, cy + s * .35); g.closePath(); };
const atRnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const AT_MAT = {
  pat: ['نقوش', [ // تتكرر على الطبقة كاملة
    ['dots', 'نقاط', (g, w, h, c, k) => { g.fillStyle = c; const s = 34 * k; for (let y = 0, r = 0; y < h + s; y += s, r++) for (let x = r % 2 ? s / 2 : 0; x < w + s; x += s) { g.beginPath(); g.arc(x, y, s * .18, 0, 7); g.fill(); } }],
    ['stripes', 'خطوط', (g, w, h, c, k) => { g.strokeStyle = c; g.lineWidth = 12 * k; const s = 40 * k; for (let x = -h; x < w + h; x += s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); } }],
    ['checker', 'شطرنج', (g, w, h, c, k) => { g.fillStyle = c; const s = 40 * k; for (let y = 0; y < h; y += s) for (let x = (y / s) % 2 ? s : 0; x < w; x += s * 2) g.fillRect(x, y, s, s); }],
    ['grid', 'شبكة', (g, w, h, c, k) => { g.strokeStyle = c; g.lineWidth = 2 * k; const s = 36 * k; g.beginPath(); for (let x = 0; x <= w; x += s) { g.moveTo(x, 0); g.lineTo(x, h); } for (let y = 0; y <= h; y += s) { g.moveTo(0, y); g.lineTo(w, y); } g.stroke(); }],
    ['hatch', 'تظليل', (g, w, h, c, k) => { g.strokeStyle = c; g.lineWidth = 1.6 * k; const s = 10 * k; g.beginPath(); for (let x = -h; x < w + h; x += s) { g.moveTo(x, 0); g.lineTo(x + h, h); g.moveTo(x + h, 0); g.lineTo(x, h); } g.stroke(); }],
    ['waves', 'أمواج', (g, w, h, c, k) => { g.strokeStyle = c; g.lineWidth = 4 * k; const s = 30 * k; for (let y = 0; y < h + s; y += s) { g.beginPath(); for (let x = 0; x <= w; x += 4) g.lineTo(x, y + Math.sin(x / (18 * k)) * 7 * k); g.stroke(); } }],
    ['hex', 'خلايا', (g, w, h, c, k) => { g.strokeStyle = c; g.lineWidth = 2.5 * k; const r = 22 * k, dx = r * Math.sqrt(3); for (let y = 0, row = 0; y < h + r * 2; y += r * 1.5, row++) for (let x = row % 2 ? dx / 2 : 0; x < w + dx; x += dx) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.stroke(); } }],
    ['bricks', 'طوب', (g, w, h, c, k) => { g.strokeStyle = c; g.lineWidth = 3 * k; const bw = 70 * k, bh = 30 * k; for (let y = 0, r = 0; y < h; y += bh, r++) for (let x = r % 2 ? -bw / 2 : 0; x < w; x += bw) g.strokeRect(x, y, bw, bh); }],
    ['scales', 'حراشف', (g, w, h, c, k) => { g.strokeStyle = c; g.lineWidth = 2.5 * k; const r = 20 * k; for (let y = 0, row = 0; y < h + r; y += r, row++) for (let x = row % 2 ? r : 0; x < w + r * 2; x += r * 2) { g.beginPath(); g.arc(x, y, r, 0, Math.PI); g.stroke(); } }],
    ['starsP', 'نجوم', (g, w, h, c, k) => { g.fillStyle = c; const s = 60 * k; for (let y = 0, r = 0; y < h + s; y += s, r++) for (let x = r % 2 ? s / 2 : 0; x < w + s; x += s) { atStar(g, x, y, s * .2, s * .08, 5); g.fill(); } }],
    ['heartsP', 'قلوب', (g, w, h, c, k) => { g.fillStyle = c; const s = 56 * k; for (let y = 0, r = 0; y < h + s; y += s, r++) for (let x = r % 2 ? s / 2 : 0; x < w + s; x += s) { atHeart(g, x, y, s * .32); g.fill(); } }],
    ['noise', 'حبيبات', (g, w, h, c, k) => { g.fillStyle = c; const R = atRnd(7), n = w * h / (60 * k * k); for (let i = 0; i < n; i++) { g.globalAlpha = .2 + R() * .6; g.fillRect(R() * w, R() * h, 2 * k, 2 * k); } g.globalAlpha = 1; }],
  ]],
  bg: ['خلفيات', [
    ['sky', 'سما', (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#4a90d9'); q.addColorStop(1, '#cfe8ff'); g.fillStyle = q; g.fillRect(0, 0, w, h); }],
    ['sunset', 'غروب', (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#2b1055'); q.addColorStop(.5, '#d6456b'); q.addColorStop(1, '#ffb86b'); g.fillStyle = q; g.fillRect(0, 0, w, h); }],
    ['night', 'ليل ونجوم', (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#070b1f'); q.addColorStop(1, '#1d2b5a'); g.fillStyle = q; g.fillRect(0, 0, w, h); const R = atRnd(3); g.fillStyle = '#fff'; for (let i = 0; i < w * h / 2500; i++) { g.globalAlpha = .3 + R() * .7; g.beginPath(); g.arc(R() * w, R() * h * .8, R() * 1.6 + .3, 0, 7); g.fill(); } g.globalAlpha = 1; }],
    ['sea', 'بحر', (g, w, h) => { let q = g.createLinearGradient(0, 0, 0, h * .55); q.addColorStop(0, '#87c5f0'); q.addColorStop(1, '#e8f6ff'); g.fillStyle = q; g.fillRect(0, 0, w, h * .55); q = g.createLinearGradient(0, h * .55, 0, h); q.addColorStop(0, '#1f7fb5'); q.addColorStop(1, '#0b3a5c'); g.fillStyle = q; g.fillRect(0, h * .55, w, h); }],
    ['field', 'أرض وعشب', (g, w, h) => { let q = g.createLinearGradient(0, 0, 0, h * .6); q.addColorStop(0, '#7ec3ee'); q.addColorStop(1, '#e3f4ff'); g.fillStyle = q; g.fillRect(0, 0, w, h); g.fillStyle = '#6aa84f'; g.beginPath(); g.moveTo(0, h * .62); for (let x = 0; x <= w; x += w / 40) g.lineTo(x, h * .6 + Math.sin(x / w * 7) * h * .03); g.lineTo(w, h); g.lineTo(0, h); g.fill(); q = g.createLinearGradient(0, h * .6, 0, h); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(1, 'rgba(30,70,20,.45)'); g.fillStyle = q; g.fillRect(0, h * .58, w, h); }],
    ['desert', 'صحرا', (g, w, h) => { let q = g.createLinearGradient(0, 0, 0, h * .6); q.addColorStop(0, '#f6c27a'); q.addColorStop(1, '#fde7c4'); g.fillStyle = q; g.fillRect(0, 0, w, h); [['#e0a35c', .62], ['#c98a45', .74], ['#b07436', .86]].forEach(([c, y], i) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += w / 60) g.lineTo(x, h * y + Math.sin(x / w * (4 + i * 2) + i) * h * .04); g.lineTo(w, h); g.fill(); }); }],
    ['paper', 'ورق', (g, w, h) => { g.fillStyle = '#f7f1e3'; g.fillRect(0, 0, w, h); const R = atRnd(11); for (let i = 0; i < w * h / 90; i++) { g.fillStyle = R() < .5 ? 'rgba(120,100,70,.05)' : 'rgba(255,255,255,.12)'; g.fillRect(R() * w, R() * h, 2, 2); } }],
    ['bokeh', 'إضاءات', (g, w, h) => { g.fillStyle = '#141428'; g.fillRect(0, 0, w, h); const R = atRnd(5), cs = ['#ff7eb6', '#7eb6ff', '#ffd27e', '#b07eff']; for (let i = 0; i < 40; i++) { const x = R() * w, y = R() * h, r = (R() * .06 + .02) * Math.max(w, h), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, cs[i % 4] + '88'); q.addColorStop(1, cs[i % 4] + '00'); g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }],
    ['wash', 'ألوان مائية', (g, w, h, c) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); const R = atRnd(9); for (let i = 0; i < 26; i++) { const x = R() * w, y = R() * h, r = (R() * .25 + .12) * Math.max(w, h), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, c + '30'); q.addColorStop(1, c + '00'); g.fillStyle = q; g.fillRect(0, 0, w, h); } }],
  ]],
  frame: ['إطارات', [
    ['simple', 'بسيط', (g, w, h, c) => { const t = Math.min(w, h) * .035; g.strokeStyle = c; g.lineWidth = t; g.strokeRect(t * 1.2, t * 1.2, w - t * 2.4, h - t * 2.4); }],
    ['double', 'مزدوج', (g, w, h, c) => { const t = Math.min(w, h) * .02; g.strokeStyle = c; g.lineWidth = t; g.strokeRect(t * 2, t * 2, w - t * 4, h - t * 4); g.lineWidth = t * .4; g.strokeRect(t * 4, t * 4, w - t * 8, h - t * 8); }],
    ['round', 'زوايا دائرية', (g, w, h, c) => { const t = Math.min(w, h) * .03, r = Math.min(w, h) * .08; g.strokeStyle = c; g.lineWidth = t; g.beginPath(); g.roundRect(t, t, w - t * 2, h - t * 2, r); g.stroke(); }],
    ['polaroid', 'بولارويد', (g, w, h) => { const t = Math.min(w, h) * .05; g.fillStyle = '#fbfaf6'; g.beginPath(); g.rect(0, 0, w, h); g.rect(t, t, w - t * 2, h - t * 4.2); g.fill('evenodd'); }],
    ['corners', 'زوايا', (g, w, h, c) => { const t = Math.min(w, h) * .02, L = Math.min(w, h) * .14, m = t * 2; g.strokeStyle = c; g.lineWidth = t; g.lineCap = 'round'; g.beginPath(); [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, a, b]) => { g.moveTo(x + a * L, y); g.lineTo(x, y); g.lineTo(x, y + b * L); }); g.stroke(); }],
    ['film', 'فيلم', (g, w, h) => { const t = Math.min(w, h) * .07; g.fillStyle = '#111'; g.fillRect(0, 0, w, t); g.fillRect(0, h - t, w, t); g.fillStyle = '#eee'; const s = t * .9; for (let x = s * .4; x < w; x += s) { g.fillRect(x, t * .3, s * .5, t * .4); g.fillRect(x, h - t * .7, s * .5, t * .4); } }],
    ['vignette', 'ظل الأطراف', (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.hypot(w, h) / 2); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.65)'); g.fillStyle = q; g.fillRect(0, 0, w, h); }],
    ['dotted', 'منقّط', (g, w, h, c) => { const t = Math.min(w, h) * .015, m = t * 3; g.fillStyle = c; const per = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / (t * 3)); for (let i = 0; i <= n; i++) { g.beginPath(); g.arc(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, t, 0, 7); g.fill(); } }; per(m, m, w - m, m); per(w - m, m, w - m, h - m); per(w - m, h - m, m, h - m); per(m, h - m, m, m); }],
  ]],
  st: ['ملصقات', [ // تنحط عايمة تحرّكها وتكبّرها
    ['star', 'نجمة', (g, w, h, c) => { atStar(g, w / 2, h / 2, w * .44, w * .19, 5); }],
    ['heart', 'قلب', (g, w, h) => { atHeart(g, w / 2, h * .55, w * .5); }],
    ['spark', 'لمعة', (g, w, h) => { atStar(g, w / 2, h / 2, w * .46, w * .08, 4); }],
    ['cloud', 'غيمة', (g, w, h) => { g.beginPath(); [[.3, .58, .2], [.5, .45, .26], [.7, .58, .2], [.5, .65, .2]].forEach(([x, y, r]) => { g.moveTo(w * x + w * r, h * y); g.arc(w * x, h * y, w * r, 0, 7); }); }],
    ['sun', 'شمس', (g, w, h) => { g.beginPath(); g.arc(w / 2, h / 2, w * .22, 0, 7); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = w / 2 + Math.cos(a) * w * .3, y = h / 2 + Math.sin(a) * w * .3; g.moveTo(x + w * .05, y); g.arc(x, y, w * .05, 0, 7); } }],
    ['moon', 'هلال', (g, w, h) => { g.beginPath(); g.arc(w / 2, h / 2, w * .4, Math.PI * .3, Math.PI * 1.7); g.arc(w * .62, h * .44, w * .3, Math.PI * 1.55, Math.PI * .4, true); g.closePath(); }],
    ['bubble', 'فقاعة كلام', (g, w, h) => { g.beginPath(); g.ellipse(w / 2, h * .42, w * .44, h * .3, 0, 0, 7); g.moveTo(w * .3, h * .62); g.lineTo(w * .2, h * .9); g.lineTo(w * .48, h * .7); }],
    ['arrow', 'سهم', (g, w, h) => { g.beginPath(); g.moveTo(w * .08, h * .4); g.lineTo(w * .58, h * .4); g.lineTo(w * .58, h * .2); g.lineTo(w * .94, h * .5); g.lineTo(w * .58, h * .8); g.lineTo(w * .58, h * .6); g.lineTo(w * .08, h * .6); g.closePath(); }],
    ['bolt', 'برق', (g, w, h) => { g.beginPath(); g.moveTo(w * .6, h * .04); g.lineTo(w * .2, h * .56); g.lineTo(w * .46, h * .56); g.lineTo(w * .36, h * .96); g.lineTo(w * .8, h * .4); g.lineTo(w * .54, h * .4); g.closePath(); }],
    ['flower', 'وردة', (g, w, h) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, x = w / 2 + Math.cos(a) * w * .22, y = h / 2 + Math.sin(a) * w * .22; g.moveTo(x + w * .17, y); g.arc(x, y, w * .17, 0, 7); } }],
    ['leaf', 'ورقة', (g, w, h) => { g.beginPath(); g.moveTo(w * .1, h * .9); g.quadraticCurveTo(w * .05, h * .1, w * .9, h * .1); g.quadraticCurveTo(w * .9, h * .9, w * .1, h * .9); }],
    ['badge', 'شارة', (g, w, h) => { atStar(g, w / 2, h / 2, w * .46, w * .38, 14); }],
  ]],
};
function atMatDraw(cat, id, w, h, k) { // يرسم الخامة على كانفس
  const it = AT_MAT[cat][1].find(x => x[0] === id), cv = atMk(w, h), g = cv.getContext('2d'), c = AT.color.length === 7 ? AT.color : '#222222';
  if (cat !== 'st') { it[2](g, w, h, c, k); return cv; }
  it[2](g, w, h, c); g.fillStyle = c; g.fill('nonzero'); g.lineJoin = 'round'; g.lineWidth = w * .035; g.strokeStyle = '#fff'; g.stroke(); return cv;
}
function atMatUI(pop) {
  const cat = AT.matCat || 'pat';
  pop.innerHTML = `<div class="athd"><b>مكتبة الخامات</b><small>تاخذ اللون الحالي</small></div><div class="atrow wrap atmtab">${Object.entries(AT_MAT).map(([k, [n]]) => `<button data-mc="${k}" class="${k === cat ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="atmatg">${AT_MAT[cat][1].map(([id, n]) => `<button data-mt="${id}"><canvas width="84" height="64" data-mp="${id}"></canvas><span>${n}</span></button>`).join('')}</div>`;
  pop.querySelectorAll('canvas[data-mp]').forEach(c => { const g = c.getContext('2d'); g.fillStyle = cat === 'st' || cat === 'pat' || cat === 'frame' ? '#fff' : '#000'; g.fillRect(0, 0, 84, 64); const k = cat === 'st' ? 56 : 0, cv = cat === 'st' ? atMatDraw(cat, c.dataset.mp, 56, 56) : atMatDraw(cat, c.dataset.mp, 84, 64, .35); g.drawImage(cv, k ? 14 : 0, k ? 4 : 0); });
  pop.querySelectorAll('[data-mc]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.matCat = b.dataset.mc; atMatUI(pop); });
  pop.querySelectorAll('[data-mt]').forEach(b => b.onclick = e => { e.stopPropagation(); if (atNoCollab()) return; const id = b.dataset.mt, names = AT_MAT[cat][1].find(x => x[0] === id)[1]; atClosePop();
    if (cat === 'st') return atInsertCanvas(atMatDraw('st', id, 600, 600), names, .35);
    if (AT.layers.length >= AT.maxL) return atToast('وصلت حد الطبقات'); if (AT.fl) atFloatCommit();
    const k = Math.max(AT.W, AT.H) / 1000, cv = atMatDraw(cat, id, AT.W, AT.H, k);
    atStructDo(() => { const n = atLayer(names); n.g.drawImage(cv, 0, 0); if (cat === 'bg') { let j = 0; AT.layers.splice(j, 0, n); AT.cur = j; } else { AT.layers.splice(AT.cur + 1, 0, n); AT.cur++; } });
    atToast(cat === 'bg' ? 'انحطت الخلفية تحت كل الطبقات' : cat === 'pat' ? 'النقش بطبقة لحاله، تقدر تقصه على اللي تحت من خيارات الطبقة' : 'انحط الإطار بطبقة لحاله'); });
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
const AT_BPROPS = [['cj', 'تغيّر اللون وهي ترسم', 0, 1, .01], ['fade', 'التلاشي (طول الخط)', 0, 2000, 10], ['min', 'أصغر حجم بالضغط', 0, 1, .01], ['sp', 'التباعد', .01, 1.5, .01], ['flow', 'قوة اللون', .02, 1, .01], ['szP', 'الضغط على الحجم', 0, 1, .01], ['opP', 'الضغط على الشفافية', 0, 1, .01], ['jit', 'تذبذب الحجم', 0, 1, .01], ['sc', 'التشتت', 0, 2, .01], ['taper', 'تدبيب البداية', 0, 150, 1], ['st', 'التنعيم', 0, .95, .01], ['glaze', 'شفافية الضربة', .05, 1, .01]];
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
    <small>مجموعات جاهزة</small><div class="atgrps">${AT_GRP.map(([k, t]) => `<button data-grp="${k}" class="${(AT.grpSel || 'skin') === k ? 'on' : ''}">${t}</button>`).join('')}</div>
    <div class="atsws atgsw">${(AT_GRP.find(x => x[0] === (AT.grpSel || 'skin')) || AT_GRP[0])[2].map(c => `<button data-c="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
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
  pop.querySelectorAll('[data-grp]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.grpSel = b.dataset.grp; atPrefs(); atColorUI(pop); });
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
      <canvas width="64" height="48" data-th="${i}" class="${l.mask && !l.mEdit && i === AT.cur ? 'sel' : ''}"></canvas>${l.mask ? `<canvas width="48" height="36" data-mk="${i}" class="atmk${l.mEdit ? ' sel' : ''}" title="القناع (اضغط عشان تعدّله)"></canvas>` : ''}<span class="atln">${esc(l.name)}<small>${l.adj ? 'تعديل · ' : ''}${l.blend !== 'source-over' ? AT_BLEND.find(b => b[0] === l.blend)[1] + ' · ' : ''}${atNum(Math.round(l.op * 100))}٪${l.lock ? ' · قفل' : ''}${l.clip ? ' · قص' : ''}${l.mask ? (l.mEdit ? ' · تعدّل القناع' : ' · قناع') : ''}</small></span>
      <button class="atv${l.vis ? ' on' : ''}" data-v="${i}" title="إظهار">${atIcon('eye')}</button><button class="atmore" data-m="${i}">${atIcon('dots')}</button></div>
      ${open === l.id ? `<div class="atlo" data-i="${i}">
        ${l.adj ? `<div class="atsub">طبقة تعديل (تغيّر اللي تحتها، امسح عليها عشان تشيل التأثير من مكان)</div>${AT_ADJ.map(([k, n, a, b, d, u]) => `<label>${n} <input type="range" min="${a}" max="${b}" value="${l.adj[k] == null ? d : l.adj[k]}" data-adj="${k}" data-ai="${i}"><output>${atNum(l.adj[k] == null ? d : l.adj[k])}${u}</output></label>`).join('')}${atHasFilter() ? '' : '<small>متصفحك ما يدعم طبقات التعديل، جرب كروم</small>'}` : ''}
        <label>الشفافية <input type="range" min="0" max="100" value="${Math.round(l.op * 100)}" data-o="${i}"></label>
        <label>الدمج <select data-bl="${i}">${AT_BLEND.map(([v, n]) => `<option value="${v}"${v === l.blend ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="atrow wrap"><button data-op="clip" class="${l.clip ? 'on' : ''}">قص على اللي تحت</button><button data-op="lock" class="${l.lock ? 'on' : ''}">قفل الشفافية</button>
          ${l.mask ? `<button data-op="mtoggle" class="${l.mOn === false ? '' : 'on'}">القناع شغّال</button><button data-op="mapply">طبّق القناع</button><button data-op="mdel">احذف القناع</button>` : '<button data-op="madd">أضف قناع</button>'}
          ${l.grp ? '<button data-op="gout">طلّعها من المجموعة</button>' : '<button data-op="group">جمّعها مع اللي تحت</button>'}
          <button data-op="dup">تكرار</button><button data-op="merge">دمج تحت</button><button data-op="up">فوق</button><button data-op="down">تحت</button><button data-op="clear">مسح</button><button data-op="ren">اسم</button><button data-op="del" class="bad">حذف</button></div></div>` : ''}`;
  });
  pop.innerHTML = `<div class="athd"><b>الطبقات</b><small>${atNum(AT.layers.length)} من ${atNum(AT.maxL)}</small><button class="atbtn sm" id="atLAdj" title="طبقة تعديل">تعديل</button><button class="atib sm" id="atLAdd" title="طبقة جديدة">${atIcon('plus')}</button></div>
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
  pop.querySelectorAll('[data-adj]').forEach(r => { let b0 = null; r.oninput = () => { const l = AT.layers[+r.dataset.ai], k = r.dataset.adj; if (!b0) b0 = atStruct(); l.adj[k] = +r.value; const u = AT_ADJ.find(x => x[0] === k)[5]; r.nextElementSibling.textContent = atNum(r.value) + u; atRecomp(); }; r.onchange = () => { if (b0) { atPush({ t: 'st', b: b0, a: atStruct(), mem: 1000 }); b0 = null; } }; });
  document.getElementById('atLAdj').onclick = e => { e.stopPropagation(); if (atNoCollab()) return; if (AT.layers.length >= AT.maxL) return atToast(`أكثر شي ${atNum(AT.maxL)} طبقة بهالمقاس`); atStructDo(() => { const n = atLayer('تعديل ' + atNum(AT.layers.length + 1)); n.g.fillStyle = '#fff'; n.g.fillRect(0, 0, AT.W, AT.H); n.adj = { b: 100, c: 100, s: 100, h: 0, w: 0, g: 0, bl: 0 }; n.grp = atL() ? atL().grp : null; AT.layers.splice(AT.cur + 1, 0, n); AT.cur++; AT.lopen = n.id; }); };
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
    <div class="atsub">دليل الرسم</div><div class="atrow wrap">${[['none', 'بدون'], ['ruler', 'مسطرة'], ['circle', 'مسطرة دائرة'], ['grid', 'شبكة'], ['persp1', 'منظور نقطة'], ['persp2', 'منظور نقطتين']].map(([k, n]) => `<button data-gd="${k}" class="${G === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    ${G === 'ruler' || G === 'circle' ? '<div class="atrow wrap"><button data-mm="vp">حرّك المسطرة</button><span>ابدأ الخط قريب منها ويمشي عليها</span></div>' : G !== 'none' ? `<div class="atrow wrap"><button data-mm="assist" class="${AT.assist ? 'on' : ''}">مساعدة الرسم (الخط يمشي على الدليل)</button>${G === 'grid' ? `<label>حجم المربع <input type="range" id="atGs" min="20" max="300" value="${AT.gridSz}"></label>` : '<button data-mm="vp">عدّل نقاط المنظور</button>'}</div>` : ''}
    <div class="atsub">العرض</div><div class="atrow wrap"><button data-mm="flip" class="${AT.view.f ? 'on' : ''}">اقلب العرض (مرآة)</button><button data-mm="fit">رجّع اللوحة للنص</button><button data-mm="ui">إخفاء الأدوات</button><button data-mm="stream">وضع البث</button>${S && S.ab ? '<button data-mm="abot">الرسام الآلي</button>' : ''}<button data-mm="gal">المعرض الدائم</button></div>
    <div class="atsub">التعبئة</div><label>الحساسية <input type="range" id="atTol" min="0" max="80" value="${AT.fillTol == null ? 30 : AT.fillTol}"></label><label>تدخل تحت الخط <input type="range" id="atGrow" min="0" max="6" value="${AT.fillGrow == null ? 2 : AT.fillGrow}"></label>
    <div class="atsub">التحريك والمشروع</div><div class="atrow wrap"><button data-mm="anim" class="${AT.anim && AT.anim.on ? 'on' : ''}">وضع التحريك (إطارات)</button><button data-mm="psave">احفظ المشروع</button><button data-mm="popen">افتح مشروع</button></div>
    <div class="atsub">تصدير</div><div class="atrow wrap"><button data-mm="png">PNG</button><button data-mm="jpg">JPG</button><button data-mm="psd">PSD بالطبقات</button><button data-mm="mytl">فيديو تسريع رسمتي</button></div>
    ${host ? '<button data-mm="end" class="bad">إنهاء الرسم للكل وعرض الرسومات</button>' : ''}
    <button data-mm="quit" class="bad">اطلع من اللعبة</button>
    <small class="atkeys">اختصارات: B فرشاة · E ممحاة · S تلطيخ · G تعبئة · D تدرّج · L تحديد · V تحويل · T نص · I قطّارة · H مرآة · [ ] الحجم · Ctrl+Z تراجع · Ctrl+A تحديد الكل · Ctrl+D إلغاء التحديد · Ctrl+V لصق صورة · مسافة+سحب تحريك · 0 ملء الشاشة · Tab إخفاء الأدوات<br>باللمس: إصبعين تكبير وتدوير · نقرة بإصبعين تراجع · بثلاث إعادة · بأربع إخفاء الأدوات · ضغط مطوّل قطّارة</small></div>`;
  pop.querySelectorAll('[data-sym]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.sym = b.dataset.sym; atMenuUI(pop); AT.dirty = true; });
  pop.querySelectorAll('[data-gd]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.guide = b.dataset.gd; if (AT.guide.startsWith('persp') || AT.guide === 'ruler' || AT.guide === 'circle') atVpDef(); atMenuUI(pop); AT.dirty = true; });
  document.getElementById('atTol').oninput = e => { AT.fillTol = +e.target.value; };
  document.getElementById('atGrow').oninput = e => { AT.fillGrow = +e.target.value; };
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
    else if (k === 'abot' && S.ab) { atClosePop(); atOpenPop('abot'); }
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
  AT.layers.forEach((l, li) => { if (l.adj) return; // طبقات التعديل ما تنحفظ بالـ PSD (فوتوشوب يحتاج صيغة ثانية)
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
  let info = [be(recs.length, 2), ...recs.flat(), ...chData.flat()].map(x => x instanceof Uint8Array ? x : new Uint8Array(x)); let infoLen = flat(info); if (infoLen % 4) { info.push(new Uint8Array(4 - infoLen % 4)); infoLen = flat(info); }
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
  const doc = { v: 1, W: AT.W, H: AT.H, bg: AT.bg, groups: AT.groups || {}, cur: AT.cur, layers: AT.layers.map(l => ({ name: l.name, op: l.op, vis: l.vis, blend: l.blend, clip: l.clip, lock: l.lock, grp: l.grp || null, mOn: l.mOn, adj: l.adj || null, png: u(l.cv), mask: l.mask ? u(l.mask) : null })) };
  atDownload(new Blob([JSON.stringify(doc)], { type: 'application/json' }), 'tarteeb-project.tarteeb'); atToast('حفظت المشروع بجهازك');
}
function atOpenProject() {
  if (atNoCollab()) return;
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.tarteeb,application/json';
  i.onchange = async () => { const f = i.files[0]; if (!f) return; if (!confirm('تفتح المشروع؟ الرسمة الحالية بتروح')) return;
    try { const doc = JSON.parse(await f.text()); AT.W = doc.W; AT.H = doc.H; AT.groups = doc.groups || {}; AT.bg = doc.bg || '#ffffff'; AT.cur = doc.cur || 0;
      const load = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
      const ls = []; for (const x of doc.layers) { const l = atLayer(x.name); Object.assign(l, { op: x.op, vis: x.vis, blend: x.blend, clip: x.clip, lock: x.lock, grp: x.grp, mOn: x.mOn, adj: x.adj || null }); const im = await load(x.png); if (im) l.g.drawImage(im, 0, 0); if (x.mask) { atAddMask(l); l.mEdit = false; l.mg.clearRect(0, 0, AT.W, AT.H); const mi = await load(x.mask); if (mi) l.mg.drawImage(mi, 0, 0); } ls.push(l); }
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
function atCapSoon() { AT.capDirty = true; if (AT_CAPT) return; const wait = Math.max(300, 1500 - (Date.now() - AT.capT)); AT_CAPT = setTimeout(() => { AT_CAPT = 0; atCapture(); }, wait); } // ما نأجّله كل ضربة (كان لو ترسم بسرعة ما تنحفظ لقطات)
async function atCapture() {
  if (!AT.capDirty || AT.done || !AT.ready || !S || !S.g || S.game !== 'art' || S.spec) return;
  if (AT.stroke) return atCapSoon();
  AT.capDirty = false; AT.capT = Date.now();
  if (AT.anim || AT.needComp || AT.fl) { if (AT.anim) AT.anim.clean = true; atCompose(AT.comp, AT.fl ? { l: AT.fl.l, cv: AT.live } : null); if (AT.anim) AT.anim.clean = false; AT.needComp = true; }
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
    const layers = await Promise.all(AT.layers.map(async l => { const b = await new Promise(ok => l.cv.toBlob(ok, 'image/png')), m = l.mask ? await new Promise(ok => l.mask.toBlob(ok, 'image/png')) : null; return { name: l.name, op: l.op, vis: l.vis, blend: l.blend, clip: l.clip, lock: l.lock, grp: l.grp || null, mOn: l.mOn, owner: l.owner || null, adj: l.adj || null, b, m }; }));
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
    const ls = await Promise.all(v.layers.map(async x => { const l = atLayer(x.name); Object.assign(l, { op: x.op, vis: x.vis, blend: x.blend, clip: x.clip, lock: x.lock, grp: x.grp || null, mOn: x.mOn, owner: x.owner || null, adj: x.adj || null }); if (x.b) { const im = await createImageBitmap(x.b); l.g.drawImage(im, 0, 0); im.close && im.close(); } if (x.m) { atAddMask(l); l.mEdit = false; l.mg.clearRect(0, 0, AT.W, AT.H); const im = await createImageBitmap(x.m); l.mg.drawImage(im, 0, 0); } return l; }));
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
  const who = g.who && g.who[pid] && g.who[pid].length > 1 ? `<small>بدأها ${esc(g.who[pid][0])} · كمّلوها: ${g.who[pid].slice(1).map(esc).join('، ')}</small>` : '';
  box.innerHTML = `<div class="atvh"><h2>رسمة <span>${esc(p ? p.name : 'لاعب')}</span></h2><small>${atNum(i + 1)} من ${atNum(g.order.length)}</small>${who}</div>
    <div class="atstage"><canvas id="atPlay" width="1200" height="900"></canvas><div class="atload" id="atLoad">نجهّز التسريع…</div>${g.mode === 'memory' ? '<div class="atmref"><small>الصورة الأصلية</small><canvas id="atMRef" width="240" height="180"></canvas></div>' : ''}</div>
    <div class="atctl"><button class="atbtn" id="atRe">${atIcon('play')} أعد التسريع</button><div class="atprog" id="atProg"><i></i></div><small id="atTm"></small></div>
    <div class="atctl"><button class="atbtn" id="atImg">${atIcon('down')} الصورة</button><button class="atbtn" id="atVid">${atIcon('down')} فيديو التسريع</button>
      ${over ? '<button class="atbtn" id="atGrid">كل الرسومات</button>' : ''}${host && !S.spec ? `<button class="atbtn atgalt${inGal ? ' on' : ''}" id="atGalT">${inGal ? 'بالمعرض الدائم ✓' : '+ للمعرض الدائم'}</button>` : ''}
      ${host && !over ? `<span class="atsp"></span><button class="atbtn" id="atPrev"${i ? '' : ' disabled'}>السابقة</button>${i < g.order.length - 1 ? '<button class="atbtn ok" id="atNext">التالية</button>' : `<button class="atbtn ok" id="atEnd">${g.order.length > 1 ? 'للتصويت' : 'خلصنا'}</button>`}` : over ? `<span class="atsp"></span><button class="atbtn" id="atPrev"${i ? '' : ' disabled'}>السابقة</button><button class="atbtn" id="atNext"${i < g.order.length - 1 ? '' : ' disabled'}>التالية</button>` : '<span class="atsp"></span><small>الأونر يقلّب الرسومات</small>'}</div>`;
  { const mr = document.getElementById('atMRef'); if (mr) mr.getContext('2d').drawImage(atMemRef(g.seed, 800, 600), 0, 0, 240, 180); }
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
  if (m.k === 'cur' && AT.ready) { (AT.curs || (AT.curs = {}))[m.from] = { x: m.x, y: m.y, n: m.n, c: m.c, t: Date.now() }; AT.dirty = true; }
  if (m.k === 'preq' && S && S.g && !S.spec && AT.ready) atPassUp();
  if (m.k === 'pass' && S && S.g && !S.spec) atPassRecv(m);
}
// ===== طرق اللعب =====
const atMode = () => (S && S.g && S.game === 'art' && S.g.mode) || '';
const atBlind = () => atMode() === 'blind' && !AT.done && !!document.getElementById('atStudio');
// أكمل الرسمة: نرفع رسمتي، وبعدين نستلم رسمة اللي قبلي ونكمّلها
async function atPassUp() { if (AT.stroke) atStrokeEnd(); if (AT.fl) atFloatCommit(); atCompose(AT.comp, null); let b = await atEnc(AT.comp, .9); if (b.size > 2.1e6) b = await atEnc(AT.comp, .75); send({ t: 'afin', d: await atB64(b), pass: 1 }); atToast('الرسمة بتنتقل للي بعدك…', 3000); }
function atPassRecv(m) {
  const im = new Image(); im.crossOrigin = 'anonymous';
  im.onload = () => { const l = atLayer('رسمة ' + (m.n || '')); l.g.drawImage(im, 0, 0, AT.W, AT.H); const l2 = atLayer('إضافتي'); AT.layers = [l, l2]; AT.cur = 1; AT.groups = {}; AT.undo = []; AT.redo = []; AT.mem = 0; AT.sel = null; atUIUndo(); atRecomp(); atLayersUI(); AT.capDirty = true; atCapSoon(); atSaveSoon();
    atToast(`جتك رسمة ${m.n || ''}، كمّلها${m.last ? ' (آخر دور)' : ''}`, 4000); try { sfx('pop'); } catch {} };
  im.onerror = () => atToast('ما قدرنا نجيب الرسمة اللي جتك');
  im.src = `/art/${S.code}/${S.g.key}/${encodeURIComponent(m.ch)}/final?k=${S.g.vk || ''}&t=${Date.now()}`;
}
// الحفظ: صورة تحفظها وترسمها (عشر ثواني)، تنولد من رقم الجولة عشان الكل يشوف نفس الصورة
function atMemRef(seed, w, h) {
  const R = atRnd(seed % 2147483646 + 1), c = atMk(w, h), g = c.getContext('2d'), pal = ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#8e44ad', '#3d7bff', '#ff6fa3'];
  const bgs = ['#fdf6e3', '#e8f4fd', '#fdeef4', '#eefbea', '#fff7e0']; g.fillStyle = bgs[Math.floor(R() * bgs.length)]; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, h * (.62 + R() * .15), w, h);
  const st = AT_MAT.st[1], n = 3 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) { const it = st[Math.floor(R() * st.length)], sz = Math.min(w, h) * (.18 + R() * .2), x = sz / 2 + R() * (w - sz), y = sz / 2 + R() * (h - sz), t = atMk(Math.round(sz), Math.round(sz)), tg = t.getContext('2d');
    it[2](tg, sz, sz); tg.fillStyle = pal[Math.floor(R() * pal.length)]; tg.fill('nonzero'); tg.lineJoin = 'round'; tg.lineWidth = sz * .04; tg.strokeStyle = '#222'; tg.stroke();
    g.save(); g.translate(x, y); g.rotate((R() - .5) * .8); g.drawImage(t, -sz / 2, -sz / 2); g.restore(); }
  return c;
}
function atMemShow() {
  const st = document.getElementById('atStudio'); if (!st || document.getElementById('atMem')) return; const k = 'mem:' + S.g.key; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1');
  const o = document.createElement('div'); o.id = 'atMem'; o.className = 'atmem'; o.innerHTML = '<b>احفظها! بعد <span>١٠</span> ثواني تختفي وترسمها من ذاكرتك</b>'; const c = atMemRef(S.g.seed, 800, 600); o.appendChild(c); st.appendChild(o);
  let n = 10; const tm = setInterval(() => { n--; const sp = o.querySelector('span'); if (sp) sp.textContent = atNum(n); if (n <= 0) { clearInterval(tm); o.remove(); atToast('يلا ارسمها!'); } }, 1000);
}
// الجدارية: الأونر يحط آخر نسخة كأساس بطبقته، وتوصل للكل مع لقطة الطبقة
function atMuralLoad() {
  if (atMode() !== 'mural' || !S.g.mural || !atHost() || AT.muralKey === S.g.key) return; const i = atMine(); if (i < 0) return; AT.muralKey = S.g.key;
  const l = AT.layers[i]; if (l.g.getImageData(0, 0, AT.W, AT.H).data.some((v, k) => k % 4 === 3 && v)) return; // فيها رسم (رجع للصفحة)
  const im = new Image(); im.onload = () => { l.g.drawImage(im, 0, 0, AT.W, AT.H); atRecomp(); atCollabSnap(); atToast('هذي الجدارية من آخر مرة، كمّلوا عليها'); }; im.src = `/mural/${S.g.mural}.img`;
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
    const mid = document.getElementById('atMid'); if (mid) mid.innerHTML = `${g.theme ? `<b>${esc(g.theme)}</b>` : `<b>${g.collab ? 'رسم جماعي' : 'مرسم ترتيب'}</b>`}<small>${g.dl ? `<span id="atClock">${atTimeLeft()}</span> · ` : ''}${g.pr != null ? `الدور ${atNum(g.pr + 1)} من ${atNum(g.prn)}` : ids.length > 1 ? `${atNum(done)} من ${atNum(ids.length)} خلصوا` : 'ارسم براحتك'}${g.wc ? ` · ${atNum(g.wc)} يتابعونك` : ''}</small>`;
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

// ===== الرسام الآلي (علي وبشرى بس، يطلع لهم من القائمة) =====
// تختار صورة ويرسمها كأنك أنت: تخطيط بالرصاص، بعدين ألوان كبيرة، بعدين تفاصيل، بفرش المرسم نفسها وضغط متغيّر،
// وموزّعة على الوقت اللي تختاره عشان التسريع يطلع طبيعي.
const ATB = { on: false, img: null, style: 'copy', mins: 5, prog: 0, det: 2, cover: false, paused: false, mul: 1, hand: true, frames: [] };
const AT_BSTY = [['copy', 'نسخ الصورة'], ['paint', 'لوحة زيت'], ['pastel', 'باستيل'], ['color', 'ألوان وحبر'], ['anime', 'أنمي'], ['water', 'ألوان مائية'], ['sketch', 'رصاص'], ['charcoal', 'فحم'], ['comic', 'كوميكس'], ['pixel', 'بكسل آرت'], ['dots', 'نقاط']];
function atBotUI(pop) {
  pop.innerHTML = `<div class="athd"><b>الرسام الآلي</b></div><div class="atmenu">
    <div class="atsub">الصورة</div><div class="atrow wrap"><button data-bb="pick">${atIcon('img')} اختر صورة</button>${ATB.img ? `<img class="atbprev" src="${ATB.prev}" alt="">` : '<small>صورة شخص أو أي شي</small>'}</div>
    <div class="atsub">الأسلوب</div><div class="atrow wrap">${AT_BSTY.map(([k, t]) => `<button data-bs="${k}" class="${ATB.style === k ? 'on' : ''}">${t}</button>`).join('')}</div>
    <div class="atsub">التفاصيل</div><div class="atrow wrap">${[[1, 'بسيط'], [2, 'متوسط'], [3, 'دقيق']].map(([k, t]) => `<button data-bd="${k}" class="${ATB.det === k ? 'on' : ''}">${t}</button>`).join('')}<button data-bc="1" class="${ATB.cover ? 'on' : ''}">يملأ اللوحة</button></div>
    <div class="atsub">المدة</div><div class="atrow wrap">${[2, 3, 5, 10, 20, 40].map(n => `<button data-bm="${n}" class="${ATB.mins === n ? 'on' : ''}">${atNum(n)} د</button>`).join('')}</div>
    <div class="atrow wrap"><button data-bh="1" class="${ATB.hand ? 'on' : ''}">اليد والألوان تبين</button></div>
    <div class="atrow wrap">${ATB.on ? '<small>يرسم الحين، تحكم فيه من الشريط فوق</small>' : `<button data-bb="go" class="on"${ATB.img ? '' : ' disabled'}>ابدأ الرسم</button>`}</div>
    <small>${atCollab() ? 'بالرسم الجماعي يرسم بطبقتك بس، وداخل التحديد لو حددت مكان' : 'يرسم على طبقات جديدة (خلفية، شكل، تفاصيل…) وتقدر تعدّل عليها بعدين'}</small></div>`;
  pop.querySelectorAll('[data-bs]').forEach(b => b.onclick = e => { e.stopPropagation(); ATB.style = b.dataset.bs; atBotUI(pop); });
  pop.querySelectorAll('[data-bm]').forEach(b => b.onclick = e => { e.stopPropagation(); ATB.mins = +b.dataset.bm; atBotUI(pop); });
  pop.querySelectorAll('[data-bd]').forEach(b => b.onclick = e => { e.stopPropagation(); ATB.det = +b.dataset.bd; atBotUI(pop); });
  pop.querySelectorAll('[data-bc]').forEach(b => b.onclick = e => { e.stopPropagation(); ATB.cover = !ATB.cover; atBotUI(pop); });
  pop.querySelectorAll('[data-bh]').forEach(b => b.onclick = e => { e.stopPropagation(); ATB.hand = !ATB.hand; atBotUI(pop); });
  pop.querySelectorAll('[data-bb]').forEach(b => b.onclick = e => { e.stopPropagation(); const k = b.dataset.bb;
    if (k === 'pick') atPickFile(async f => { try { ATB.img = await createImageBitmap(f); const c = atMk(160, Math.round(160 * ATB.img.height / ATB.img.width)); c.getContext('2d').drawImage(ATB.img, 0, 0, c.width, c.height); ATB.prev = c.toDataURL(); } catch { atToast('ما قدرنا نفتح الصورة'); } atBotUI(pop); });
    else if (k === 'go') { atClosePop(); atBotRun(); } });
}
// ===== التحليل بالخلفية (artbot.js كـ Worker)، ولو ما ضبط نحسبه بالصفحة =====
let ATB_LIB = null;
const atBotSrc = () => 'artbot.js' + (window.GV && GV['artbot.js'] ? '?v=' + GV['artbot.js'] : '');
const atBotLib = () => ATB_LIB || (ATB_LIB = new Promise((ok, no) => { if (window.ATBOT) return ok(); const s = document.createElement('script'); s.src = atBotSrc(); s.onload = ok; s.onerror = () => { ATB_LIB = null; no(new Error('artbot')); }; document.head.appendChild(s); }));
async function atBotCall(k, cfg, imgs) {
  await atBotLib();
  try {
    if (typeof Worker === 'undefined') throw 0;
    const w = AT.botW || (AT.botW = new Worker(atBotSrc())), id = Math.random();
    return await new Promise((ok, no) => { const tm = setTimeout(() => no(new Error('timeout')), 120000);
      const on = e => { if (e.data.id !== id) return; clearTimeout(tm); w.removeEventListener('message', on); e.data.ok ? ok(e.data.r) : no(new Error(e.data.err)); };
      w.addEventListener('message', on); w.onerror = er => { clearTimeout(tm); no(er); }; w.postMessage({ k, id, cfg, imgs }); });
  } catch (e) { if (AT.botW && e && e.message === 'timeout') { AT.botW.terminate(); AT.botW = null; } console.warn('bot worker → main', e); await new Promise(r => setTimeout(r, 30)); return k === 'refine' ? ATBOT.refine(cfg, imgs) : ATBOT.plan(cfg, imgs); }
}
const atBotPix = (src, sx, sy, sw, sh, w, h) => { const c = atMk(w, h), g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(src, sx, sy, sw, sh, 0, 0, w, h); return { w, h, data: g.getImageData(0, 0, w, h).data }; };
function atBotBox() { // وين تنحط الصورة: اللوحة كاملة، أو التحديد بالرسم الجماعي
  const tb = atCollab() && AT.sel ? AT.sel.box : [0, 0, AT.W, AT.H], TW = tb[2] - tb[0], TH = tb[3] - tb[1], im = ATB.img;
  const s0 = ATB.cover ? Math.max(TW / im.width, TH / im.height) : Math.min(TW / im.width, TH / im.height) * .96, iw = im.width * s0, ih = im.height * s0;
  return [tb[0] + (TW - iw) / 2, tb[1] + (TH - ih) / 2, iw, ih];
}
// ===== الشريط فوق، اليد، ولوحة الألوان =====
function atBotBar() {
  const st = document.getElementById('atStudio'); if (!st) return; let b = document.getElementById('atBotBar');
  if (!b) { b = document.createElement('div'); b.id = 'atBotBar'; b.className = 'atbotbar'; st.appendChild(b); }
  const vid = !ATB.on && ATB.frames.length > 8, left = ATB.on && ATB.T ? Math.max(0, Math.round((ATB.T - (ATB.vt || 0)) / ATB.mul / 1000)) : 0;
  b.innerHTML = `<div class="atbbt"><b>${ATB.on ? (ATB.refine ? 'المس المكان اللي تبيه يزيد تفاصيله' : ATB.paused ? 'استراحة' : 'الرسام يرسم') : 'خلص الرسم'}</b><small>${ATB.on ? `${atNum(Math.round(ATB.prog * 100))}٪${left ? ' · باقي ' + atNum(Math.floor(left / 60)) + ':' + atNum(String(left % 60).padStart(2, '0')) : ''}` : ''}</small></div>
    <div class="atprog"><i style="width:${Math.round((ATB.on ? ATB.prog : 1) * 100)}%"></i></div>
    <div class="atbbr">${ATB.on ? `<button data-bk="pause">${ATB.paused ? 'كمّل' : 'استراحة'}</button><span class="atbsp">${[.5, 1, 2, 4].map(m => `<button data-bk="mul" data-m="${m}" class="${ATB.mul === m ? 'on' : ''}">×${m === .5 ? '½' : atNum(m)}</button>`).join('')}</span><button data-bk="refine" class="${ATB.refine ? 'on' : ''}">زيد تفاصيل هنا</button><button data-bk="stop" class="red">وقّف</button>`
      : `${vid ? '<button data-bk="video" class="on">نزّل فيديو التسريع</button>' : ''}<button data-bk="refine" class="${ATB.refine ? 'on' : ''}">زيد تفاصيل هنا</button><button data-bk="close">سكّر</button>`}</div>`;
  b.querySelectorAll('[data-bk]').forEach(x => x.onclick = e => { e.stopPropagation(); const k = x.dataset.bk;
    if (k === 'pause') ATB.paused = !ATB.paused; else if (k === 'mul') ATB.mul = +x.dataset.m; else if (k === 'stop') { ATB.on = false; ATB.paused = false; }
    else if (k === 'refine') { ATB.refine = !ATB.refine; if (ATB.refine) atToast('المس المكان باللوحة'); } else if (k === 'video') return atBotVideo(x); else if (k === 'close') { ATB.refine = false; b.remove(); atBotHandHide(); return; }
    atBotBar(); });
}
function atBotHandEls() {
  const wrap = AT.cv && AT.cv.parentElement; if (!wrap) return null; let h = document.getElementById('atBotHand'), p = document.getElementById('atBotPal');
  if (!h) { h = document.createElement('div'); h.id = 'atBotHand'; h.className = 'atbhand'; // يد ماسكة قلم (الرأس عند ٠،٠)
    h.innerHTML = `<svg viewBox="0 0 120 120" width="120" height="120"><g transform="translate(6 114)"><path d="M0 0 L10 -14 L56 -62 L64 -54 L18 -8 Z" fill="#3b3f4a"/><path d="M0 0 L10 -14 L14 -10 Z" fill="var(--bc,#222)"/><path d="M56 -62 L64 -70 L72 -62 L64 -54 Z" fill="#e8b4b8"/>
      <path d="M30 -44 C38 -58 56 -66 70 -62 C86 -58 104 -66 110 -54 C116 -42 104 -26 88 -22 C72 -18 60 -10 46 -14 C36 -17 26 -30 30 -44 Z" fill="#f2c9a5" stroke="#c99470" stroke-width="2"/>
      <path d="M34 -40 C40 -36 48 -36 54 -40" fill="none" stroke="#c99470" stroke-width="2" stroke-linecap="round"/><path d="M60 -30 C70 -28 80 -30 88 -36" fill="none" stroke="#c99470" stroke-width="2" stroke-linecap="round"/></g></svg>`;
    wrap.appendChild(h); }
  if (!p) { p = document.createElement('div'); p.id = 'atBotPal'; p.className = 'atbpal'; wrap.appendChild(p); }
  return { h, p, wrap };
}
function atBotHandHide() { ['atBotHand', 'atBotPal'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); }); }
function atBotHandSet(sx, sy, down) { const E = ATB.hand && atBotHandEls(); if (!E) return; ATB.hs = [sx, sy]; const o = AT.cv.getBoundingClientRect(), w = E.wrap.getBoundingClientRect();
  E.h.style.transform = `translate(${sx + o.left - w.left - 6}px, ${sy + o.top - w.top - 114 + (down ? 0 : -10)}px)`; E.h.style.setProperty('--bc', AT.color); E.h.classList.toggle('up', !down); }
const atBotDocHand = (x, y, down) => { const [sx, sy] = atToScr(x, y); atBotHandSet(sx, sy, down); };
async function atBotTween(target, ms) { // تتحرك اليد بنعومة لمكان (نحسب الهدف كل إطار عشان لو تحرّك العرض)
  if (!ATB.hand || !ATB.hs) { const t = target(); atBotHandSet(t[0], t[1], false); return new Promise(r => setTimeout(r, ms)); }
  const [x0, y0] = ATB.hs, t0 = performance.now(); return new Promise(res => { const f = () => { const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms)), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2, t = target();
    atBotHandSet(x0 + (t[0] - x0) * e, y0 + (t[1] - y0) * e - Math.sin(k * Math.PI) * 18, false); if (k < 1 && ATB.on) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
}
const atBotSame = (a, b) => { if (!a || !b) return false; if (a === b) return true; const x = atHex(a), y = atHex(b); return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]) < 40; }; // ألوان قريبة = نفس اللون باللوحة
function atBotPalAdd(col) { // لوحة ألوان صغيرة تحت: كل لون جديد ينحط فيها واليد تروح له
  const E = ATB.hand && atBotHandEls(); if (!E) return null; let sw = [...E.p.children].find(c => atBotSame(c.dataset.c, col));
  if (!sw) { sw = document.createElement('i'); sw.dataset.c = col; sw.style.background = col; E.p.prepend(sw); while (E.p.children.length > 10) E.p.lastChild.remove(); }
  const r = sw.getBoundingClientRect(), o = AT.cv.getBoundingClientRect(); return () => [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top];
}
// ===== فيديو التسريع =====
function atBotSnap(final) {
  if (!AT.comp || AT.stroke) return; const k = 720 / Math.max(AT.W, AT.H), c = atMk(Math.round(AT.W * k / 2) * 2, Math.round(AT.H * k / 2) * 2), g = c.getContext('2d');
  g.fillStyle = AT.bg; g.fillRect(0, 0, c.width, c.height); g.drawImage(AT.comp, 0, 0, c.width, c.height);
  c.toBlob(b => { if (b) { ATB.frames.push(b); if (ATB.frames.length > 400) ATB.frames = ATB.frames.filter((_, i) => i % 2 === 0 || i === ATB.frames.length - 1); } }, 'image/jpeg', .82);
}
async function atBotVideo(btn) {
  if (typeof MediaRecorder === 'undefined') return atToast('متصفحك ما يقدر يسوي فيديو، جرب كروم');
  const fr = ATB.frames.slice(); if (fr.length < 2) return; const first = await createImageBitmap(fr[0]), c = atMk(first.width, first.height), g = c.getContext('2d');
  const mime = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)); if (!mime) return atToast('متصفحك ما يقدر يسوي فيديو');
  btn.disabled = true; btn.textContent = 'نجهّز الفيديو…';
  const stream = c.captureStream(30), rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 }), parts = []; rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
  const done = new Promise(r => rec.onstop = r); rec.start(250);
  const draw = bm => { g.drawImage(bm, 0, 0, c.width, c.height); g.font = `700 ${Math.round(c.height / 28)}px Tajawal, system-ui`; g.fillStyle = 'rgba(0,0,0,.35)'; g.textAlign = 'left'; g.fillText('ترتيب', c.width * .03 + 1, c.height * .96 + 1); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('ترتيب', c.width * .03, c.height * .96); };
  const per = Math.max(33, Math.min(120, 9000 / fr.length)); // الفيديو تقريباً ٩ ثواني
  for (let i = 0; i < fr.length; i++) { const bm = i ? await createImageBitmap(fr[i]) : first; draw(bm); bm.close && bm.close(); await new Promise(r => setTimeout(r, per)); }
  await new Promise(r => setTimeout(r, 2000)); rec.stop(); await done;
  const blob = new Blob(parts, { type: mime.split(';')[0] }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tarteeb-painter.' + (mime.includes('mp4') ? 'mp4' : 'webm'); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  btn.disabled = false; btn.textContent = 'نزّل فيديو التسريع';
}
// ===== زيد تفاصيل هنا: نقارن الصورة باللي مرسوم بهالمكان ونرسم الفرق =====
async function atBotRefineAt(x, y) {
  ATB.refine = false; atBotBar(); if (!ATB.img || !ATB.box) return atToast('ارسم بالرسام أول');
  const [ox, oy, iw, ih] = ATB.box, R = Math.max(90, Math.max(iw, ih) * .12), rx = atClamp(x - R, Math.max(0, ox), Math.min(AT.W, ox + iw)), ry = atClamp(y - R, Math.max(0, oy), Math.min(AT.H, oy + ih)), rx1 = atClamp(x + R, Math.max(0, ox), Math.min(AT.W, ox + iw)), ry1 = atClamp(y + R, Math.max(0, oy), Math.min(AT.H, oy + ih));
  if (rx1 - rx < 20 || ry1 - ry < 20) return atToast('المس داخل الصورة');
  const rw = rx1 - rx, rh = ry1 - ry, k = 200 / Math.max(rw, rh), w = Math.max(8, Math.round(rw * k)), h = Math.max(8, Math.round(rh * k)), im = ATB.img, sx = im.width / iw, sy = im.height / ih;
  if (!AT.stroke) atCompose(AT.comp, null);
  const imgs = { t: atBotPix(im, (rx - ox) * sx, (ry - oy) * sy, rw * sx, rh * sy, w, h), cur: atBotPix(AT.comp, rx, ry, rw, rh, w, h) };
  atToast('يزيد تفاصيل هنا…', 1500);
  const r = await atBotCall('refine', { box: [rx, ry, rw, rh], det: ATB.det, layer: ATB.detL || 0 }, imgs);
  if (!r.acts.length) return atToast('هالمكان قريب من الصورة');
  if (ATB.on && ATB.add) ATB.add(r.acts); else atBotRun({ acts: r.acts, layers: null });
}
// ===== التشغيل: اليد تمشي نقطة نقطة، تشيل القلم وتختار لون، والوقت يتوزع على المدة =====
async function atBotRun(pre) {
  if (ATB.on || !AT.ready) return; if (!pre && !ATB.img) return;
  const collab = atCollab(); if (collab && atMine() < 0) return atToast('ما لقينا طبقتك');
  let plan;
  if (pre) plan = { acts: pre.acts, layers: null };
  else {
    ATB.box = atBotBox(); const cfg = { style: ATB.style, det: ATB.det, mins: ATB.mins, cover: ATB.cover, W: AT.W, H: AT.H, box: ATB.box, bgc: atHex(AT.bg.length === 7 ? AT.bg : '#ffffff') };
    atToast('يحلل الصورة…', 2500); ATB.analysing = true;
    try { await atBotLib(); const [ox, oy, iw, ih] = ATB.box, im = ATB.img, imgs = {};
      for (const nd of ATBOT.needs(cfg)) imgs[nd.k] = atBotPix(im, 0, 0, im.width, im.height, nd.wh[0], nd.wh[1]);
      plan = await atBotCall('plan', cfg, imgs);
    } catch (e) { console.warn(e); ATB.analysing = false; return atToast('ما قدرنا نحلل الصورة'); }
    ATB.analysing = false; if (!document.getElementById('atStudio') || AT.done) return;
  }
  // الطبقات: كل مرحلة بطبقة (بالجماعي: طبقتك بس، ولو ما فيه مكان: طبقة وحدة)
  let li;
  if (collab) li = [atMine()];
  else if (plan.layers) { let names = plan.layers.slice().reverse().filter((n, i, a) => true).reverse(); if (AT.layers.length + names.length > AT.maxL) names = AT.layers.length + 1 <= AT.maxL ? ['الرسام'] : null;
    if (!names) return atToast('الطبقات مليانة، احذف وحدة أول');
    const at0 = AT.layers.length; atStructDo(() => { names.forEach(n => AT.layers.push(atLayer(n))); }); li = names.map((_, i) => at0 + i);
    ATB.detL = Math.min(2, li.length - 1); ATB.li = li; }
  else li = ATB.li && ATB.li.every(i => AT.layers[i]) ? ATB.li : [AT.cur];
  const Lof = s => li[Math.min(s.L || 0, li.length - 1)];
  if (!pre) { ATB.frames = []; }
  // نقص على حدود الصورة (ونحترم التحديد بالجماعي)
  let selKeep = AT.sel;
  if (!collab && plan.clip && ATB.box) { const [cx, cy, cw, ch] = ATB.box, m = atMk(AT.W, AT.H); m.getContext('2d').fillRect(cx, cy, cw, ch); AT.selOv = null; AT.sel = { mask: m, box: [Math.max(0, Math.floor(cx - 3)), Math.max(0, Math.floor(cy - 3)), Math.min(AT.W, Math.ceil(cx + cw + 4)), Math.min(AT.H, Math.ceil(cy + ch + 4))] }; }
  const keep = { tool: AT.tool, color: AT.color, bt: Object.assign({}, AT.bt), size: Object.assign({}, AT.size), op: Object.assign({}, AT.op), sym: AT.sym, stream: Object.assign({}, AT.stream), cur: AT.cur };
  const pxB = atBr('pixel'), pxSp = pxB.sp; pxB.sp = .25; // البكسل: نخلي الختم متقارب عشان ما يطلع فراغ بآخر الصف
  const acts = plan.acts; ATB.on = true; ATB.paused = false; ATB.refine = false; ATB.prog = 0; ATB.n = 0; AT.sym = 'none'; AT.botBusy = true; const u0 = AT.undo.length;
  const len = a => { let s = 0; for (let k = 1; k < a.pts.length; k++) s += Math.hypot(a.pts[k][0] - a.pts[k - 1][0], a.pts[k][1] - a.pts[k - 1][1]); return s * (a.slow || 1); };
  const lens = acts.map(a => a.pause ? 0 : len(a)); let totalLen = lens.reduce((a, b) => a + b, 0) || 1, strokesLeft = acts.filter(a => !a.pause).length, pausesLeft = acts.reduce((t, a) => t + (a.pause || 0), 0);
  const changes = acts.reduce((n, a, i) => n + (i && !a.pause && !atBotSame(a.col, acts[i - 1].col) ? 1 : 0), 0), strokesN = strokesLeft;
  const T = pre ? Math.max(15000, strokesN * 120) : ATB.mins * 60000; ATB.T = T;
  const lift = Math.min(160, T * .22 / Math.max(1, strokesN)), pick = Math.min(900, T * .08 / Math.max(1, changes)), drawT = Math.max(T * .5, T - lift * strokesN - pick * changes - pausesLeft), speed0 = totalLen / drawT; let speed = speed0;
  // ساعة «افتراضية»: السرعة (×٢، ×٤) والاستراحة تأثر عليها
  let last = performance.now(); ATB.vt = 0; const tick = () => { const n = performance.now(); if (!ATB.paused) ATB.vt += (n - last) * ATB.mul; last = n; return ATB.vt; };
  const wait = async ms => { const end = tick() + ms; while (ATB.on && tick() < end) await new Promise(r => setTimeout(r, Math.min(60, Math.max(5, (end - ATB.vt) / ATB.mul)))); };
  const frame = () => new Promise(r => requestAnimationFrame(r)); let done = 0, lastCol = null, yT = 0, lastSnap = 0, barT = 0;
  ATB.add = more => { const at = ATB.i + 1; acts.splice(at, 0, { pause: 500 }, ...more); const ls = more.map(len); lens.splice(at, 0, 0, ...ls); totalLen += ls.reduce((a, b) => a + b, 0); strokesLeft += more.length; atToast('بيزيد التفاصيل بعد هالضربة'); };
  atBotBar(); if (ATB.hand) { const s0 = acts.find(a => !a.pause); if (s0) atBotDocHand(s0.pts[0][0], s0.pts[0][1] - 40, false); }
  if (!pre) atBotSnap();
  for (let i = 0; i < acts.length && ATB.on && document.getElementById('atStudio') && !AT.done; i++) {
    ATB.i = i; const s = acts[i];
    while (ATB.paused && ATB.on) { await new Promise(r => setTimeout(r, 200)); tick(); }
    if (Date.now() - barT > 1000) { barT = Date.now(); atBotBar(); }
    { const left = T - tick() - pausesLeft - lift * strokesLeft, remLen = totalLen - done; speed = Math.max(speed0, remLen / Math.max(4000, left)); }
    if (s.pause) { pausesLeft -= s.pause; if (tick() < T * .9) await wait(s.pause * (.7 + Math.random() * .6)); continue; }
    strokesLeft--;
    if (s.thin) { const late = tick() - T * (done / totalLen); if (tick() > T * 1.2 || (late > T * .04 && Math.random() < Math.min(.8, late / (T * .15)))) { done += lens[i]; continue; } } // متأخرين (جهاز بطيء): نخفف التفاصيل على قد التأخير
    const rush = tick() > T * (done / totalLen) * .9 + 2500;
    // يختار اللون: اليد تروح للوحة الألوان وترجع
    if (s.tool !== 'smudge' && s.tool !== 'eraser' && !atBotSame(s.col, lastCol)) { AT.color = s.col; atUIColor(); const pal = atBotPalAdd(s.col);
      if (lastCol && !rush) { if (pal && ATB.hand && pick / ATB.mul >= 90) { await atBotTween(pal, pick * .45 / ATB.mul); await wait(pick * .15); } else await wait(pick * (.6 + Math.random() * .8)); }
      lastCol = s.col; atAddHist(s.col); }
    // يرفع القلم ويروح لبداية الضربة الجاية
    if (ATB.hand) { const tw = Math.min(500, lift * (.6 + Math.random() * .8)) / ATB.mul; if (!rush && tw >= 45) await atBotTween(() => atToScr(s.pts[0][0], s.pts[0][1]), tw); else { atBotDocHand(s.pts[0][0], s.pts[0][1], false); if (!rush && tw > 4) await wait(tw * ATB.mul); } } // يرفع القلم ويروح للضربة الجاية
    if (!s.tool) { AT.color = s.col; }
    const tool = s.tool || 'brush'; AT.cur = Lof(s); AT.tool = tool; AT.bt[tool] = s.b; AT.size[tool] = Math.max(1, s.sz); AT.op[tool] = s.op != null ? s.op : tool === 'smudge' ? .6 : 1; AT.color = s.tool ? AT.color : s.col; AT.stream[s.b] = s.px ? 0 : .35;
    const sl = s.slow || 1, tot = Math.max(1, s.pts.length - 1), pk = .65 + Math.random() * .3; let kk = 0; const P = () => s.flat ? .9 + Math.random() * .1 : atClamp(pk * Math.sin(Math.min(1, (kk + .3) / tot) * Math.PI) * (.92 + Math.random() * .16) + .12, .12, 1);
    atStrokeStart(s.pts[0][0], s.pts[0][1], s.flat ? .9 : .15); if (!AT.stroke) continue;
    let k = 1, tLast = performance.now(), carry = 0;
    while (k < s.pts.length && ATB.on) {
      if (ATB.paused) { await new Promise(r => setTimeout(r, 200)); tick(); tLast = performance.now(); continue; }
      if (!rush || performance.now() - yT > 14) { await frame(); yT = performance.now(); } const now = performance.now(), dt = Math.min(250, now - tLast); tLast = now; carry += rush ? 1e9 : dt * ATB.mul * speed / sl * (.75 + Math.random() * .5);
      kk = k; while (k < s.pts.length && carry > 0) { const [ax, ay] = s.pts[k - 1], [bx, by] = s.pts[k], d = Math.hypot(bx - ax, by - ay) || 1, n = Math.max(1, Math.ceil(d / 6));
        if (!s.sub) s.sub = 0; const take = Math.min(n - s.sub, Math.max(1, Math.floor(carry / (d / n))));
        for (let q = 1; q <= take; q++) { const f = (s.sub + q) / n; atStrokeTo(ax + (bx - ax) * f, ay + (by - ay) * f, P()); }
        s.sub += take; carry -= take * d / n; if (s.sub >= n) { s.sub = 0; k++; } }
      if (ATB.hand) { const p = s.pts[Math.min(k, s.pts.length - 1)], q = s.pts[Math.max(0, k - 1)], f = s.sub ? s.sub / Math.max(1, Math.ceil(Math.hypot(p[0] - q[0], p[1] - q[1]) / 6)) : 0; atBotDocHand(q[0] + (p[0] - q[0]) * f, q[1] + (p[1] - q[1]) * f, true); }
      ATB.prog = Math.min(.99, (done + (k / s.pts.length) * lens[i]) / totalLen); }
    atStrokeEnd(); done += lens[i]; ATB.n++;
    if (!pre && Math.random() < .005 && s.ph && s.ph[0] === 'p' && AT.undo.length > u0 + 1) { await wait(500 + Math.random() * 600); atUndo(); await wait(400); i--; done -= lens[i + 1]; strokesLeft++; continue; } // أحياناً يتراجع ويعيدها
    if (Date.now() - lastSnap > Math.max(250, T / ATB.mul / 240)) { lastSnap = Date.now(); atBotSnap(); }
    if (!rush && !ATB.hand) await wait(lift * (.4 + Math.random() * 1.2));
  }
  if (AT.stroke) atStrokeEnd(); AT.sel = selKeep; pxB.sp = pxSp;
  Object.assign(AT, { tool: keep.tool, color: keep.color, sym: keep.sym, cur: AT.layers[keep.cur] ? (collab ? keep.cur : AT.cur) : AT.cur }); AT.bt = keep.bt; AT.size = keep.size; AT.op = keep.op; AT.stream = keep.stream;
  AT.undo.length = Math.min(AT.undo.length, u0); AT.redo = []; AT.mem = AT.undo.reduce((m, x) => m + (x.mem || 0), 0); atUIUndo();
  const fin = ATB.on; ATB.on = false; ATB.add = null; AT.botBusy = false; atBotSnap(true); setTimeout(() => atBotSnap(true), 400);
  if (ATB.hand) await atBotTween(() => { const r = AT.cv.getBoundingClientRect(); return [r.width - 70, r.height - 40]; }, 600);
  atUITool(); atUIColor(); atUISliders(); atLayersUI(); atCapSoon(); atSaveSoon(); atBotBar(); atToast(fin ? 'خلص الرسم' : 'وقّفنا الرسام');
}
