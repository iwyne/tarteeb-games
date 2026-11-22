// ================= مرسم ترتيب — استوديو رسم مثل بروكريت =================
// اللوحة ١٦٠٠×١٢٠٠ بطبقات (كل طبقة كانفس). الفرش «ختم» يتكرر على طول الخط (رأس الفرشاة + تباعد + ضغط القلم).
// كل ضربة تنرسم أول بـ «مخزن الضربة» وبعدين تنضاف للطبقة بشفافية الفرشاة (مثل بروكريت ما تتراكم داخل نفس الضربة).
// للتسريع: بعد كل تعديل نرسل لقطة صغيرة ٤٨٠×٣٦٠ للسيرفر، ولما تضغط «انتهيت» نرسل الرسمة كاملة.
const AT = {
  W: 1600, H: 1200, on: false, layers: [], cur: 0, bg: '#ffffff', tool: 'brush', bt: { brush: 'ink', eraser: 'round', smudge: 'soft' }, color: '#1d1d1f', hist: [],
  size: { brush: 14, eraser: 40, smudge: 40 }, op: { brush: 1, eraser: 1, smudge: .7 }, stream: {}, sym: 'none', qs: true,
  view: { z: 1, r: 0, x: 0, y: 0 }, undo: [], redo: [], mem: 0, dirty: true, capT: 0, fc: 0, ui: true
};
const AT_BLEND = [['source-over', 'عادي'], ['multiply', 'ضرب'], ['screen', 'شاشة'], ['overlay', 'تراكب'], ['soft-light', 'إضاءة ناعمة'], ['hard-light', 'إضاءة قوية'], ['color-dodge', 'تفتيح لوني'], ['color-burn', 'حرق لوني'], ['darken', 'أغمق'], ['lighten', 'أفتح'], ['difference', 'اختلاف'], ['lighter', 'إضافة'], ['hue', 'الدرجة'], ['saturation', 'التشبع'], ['color', 'اللون'], ['luminosity', 'الإضاءة']];
const AT_CATS = [['sketch', 'رسم'], ['ink', 'حبر'], ['paint', 'تلوين'], ['water', 'مائي'], ['oil', 'زيت'], ['char', 'فحم وطباشير'], ['spray', 'بخاخ'], ['neon', 'نيون']];
// الفرش: tip رأس الفرشاة، sp التباعد، flow قوة الختم، szP/opP تأثير الضغط على الحجم/الشفافية، min أصغر حجم، jit تذبذب الحجم، sc تشتت، rot اتجاه الرأس، st التنعيم، taper تدبيب البداية
const AT_BR = [
  { id: 'hb', c: 'sketch', n: 'رصاص HB', tip: 'pencil', sp: .1, flow: .45, szP: .4, opP: .9, min: .5, rot: 'rand', st: .15, def: 5 },
  { id: '6b', c: 'sketch', n: 'رصاص 6B', tip: 'pencil', sp: .08, flow: .75, szP: .5, opP: .8, min: .4, rot: 'rand', st: .15, def: 12 },
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
  { id: 'wsoft', c: 'water', n: 'مائي ناعم', tip: 'water', sp: .03, flow: .06, szP: .3, opP: .6, min: .6, jit: .15, rot: 'rand', st: .25, def: 90 },
  { id: 'wwet', c: 'water', n: 'مائي مبلول', tip: 'water', sp: .035, flow: .1, szP: .4, opP: .5, min: .5, jit: .25, sc: .08, rot: 'rand', st: .2, def: 70 },
  { id: 'wash', c: 'water', n: 'غسيل', tip: 'soft', sp: .1, flow: .05, szP: .2, opP: .5, min: .7, st: .2, def: 240 },
  { id: 'oil', c: 'oil', n: 'زيت', tip: 'bristle', sp: .035, flow: .9, szP: .3, opP: .3, min: .6, rot: 'dir', st: .3, def: 44 },
  { id: 'acr', c: 'oil', n: 'أكريليك', tip: 'bristle', sp: .05, flow: .7, szP: .35, opP: .4, min: .5, jit: .12, rot: 'dir', st: .25, def: 36 },
  { id: 'coal', c: 'char', n: 'فحم', tip: 'charcoal', sp: .07, flow: .6, szP: .4, opP: .6, min: .5, sc: .12, rot: 'rand', st: .15, def: 28 },
  { id: 'chalk', c: 'char', n: 'طباشير', tip: 'chalk', sp: .08, flow: .85, szP: .3, opP: .5, min: .6, rot: 'rand', st: .15, def: 30 },
  { id: 'pastel', c: 'char', n: 'باستيل', tip: 'chalk', sp: .06, flow: .45, szP: .3, opP: .6, min: .6, jit: .2, rot: 'rand', st: .15, def: 48 },
  { id: 'air', c: 'spray', n: 'بخاخ ناعم', tip: 'spray', dots: 26, sp: .12, flow: .9, szP: .2, opP: .6, min: .6, st: .1, def: 90 },
  { id: 'mist', c: 'spray', n: 'رذاذ', tip: 'spray', dots: 7, big: 1, sp: .2, flow: 1, szP: .2, opP: .4, min: .7, st: .1, def: 130 },
  { id: 'splat', c: 'spray', n: 'بقع', tip: 'hard', sp: .9, flow: .95, szP: .2, opP: .2, jit: .8, sc: 1.4, st: .05, def: 26 },
  { id: 'neon', c: 'neon', n: 'نيون', tip: 'glow', sp: .04, flow: .9, szP: .3, opP: .2, min: .6, st: .5, def: 26 },
  { id: 'light', c: 'neon', n: 'ضوء', tip: 'soft', sp: .07, flow: .22, szP: .3, opP: .6, min: .6, st: .3, def: 120, add: 1 }
];
const AT_PAL = ['#000000', '#3a3a3c', '#8e8e93', '#ffffff', '#1d1d1f', '#e63946', '#ff6b6b', '#f4a261', '#f4d35e', '#ffe8a3', '#2a9d8f', '#52b788', '#1b4332', '#264653', '#3d7bff', '#8ecae6', '#5e3c99', '#b5179e', '#ff66c4', '#8a5a2b', '#c79a5b', '#f1d3b3', '#e0ac69', '#8d5524', '#5a1a12', '#a3231b', '#d9a441', '#6b2f1a', '#2f6b3c', '#c9a23a', '#87ceeb', '#ffd6e0'];
const atBr = id => AT_BR.find(b => b.id === id) || AT_BR[4];
const atHost = () => !!(S && S.players.some(p => p.h && p.id === S.me));
const atCurB = () => AT.bt[AT.tool in AT.bt ? AT.tool : 'brush'];
const atNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const atMk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
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
// ندمج الطبقات بكانفس (ونقدر نبدّل طبقة بنسخة حيّة وقت الرسم)
function atCompose(t, sub, from = 0, to = AT.layers.length, bg = true) {
  const g = t.getContext('2d'); g.save(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  if (bg) { g.fillStyle = AT.bg; g.fillRect(0, 0, AT.W, AT.H); } else g.clearRect(0, 0, AT.W, AT.H);
  const src = l => sub && sub.l === l ? sub.cv : l.cv;
  for (let i = from; i < to; i++) {
    const l = AT.layers[i]; if (l.clip && i > 0) continue; if (!l.vis) { while (i + 1 < to && AT.layers[i + 1].clip) i++; continue; }
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
  atSaveSoon(); atCapSoon(); atUIUndo();
}
function atPatch(l, x, y, w, h) {
  x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y)); w = Math.min(AT.W - x, Math.ceil(w)); h = Math.min(AT.H - y, Math.ceil(h));
  if (w <= 0 || h <= 0) return null; return { x, y, w, h, d: l.g.getImageData(x, y, w, h) };
}
function atPxEntry(l, before) { if (!before) return null; const after = l.g.getImageData(before.x, before.y, before.w, before.h); return { t: 'px', l, b: before, a: after, mem: before.w * before.h * 8 }; }
// صورة للطبقات (للتراجع عن تغيير ترتيبها أو خصائصها)
const atStruct = () => ({ layers: AT.layers.slice(), props: AT.layers.map(l => ({ op: l.op, vis: l.vis, blend: l.blend, clip: l.clip, lock: l.lock, name: l.name })), cur: AT.cur, bg: AT.bg });
function atApplyStruct(s) { AT.layers = s.layers.slice(); s.props.forEach((p, i) => Object.assign(AT.layers[i], p)); AT.cur = atClamp(s.cur, 0, AT.layers.length - 1); AT.bg = s.bg; }
function atStructDo(fn) { const b = atStruct(); fn(); atPush({ t: 'st', b, a: atStruct(), mem: 1000 }); atRecomp(); atLayersUI(); }
function atUndo(redo) {
  const from = redo ? AT.redo : AT.undo, to = redo ? AT.undo : AT.redo; const e = from.pop(); if (!e) return atToast(redo ? 'ما فيه شي ترجعه' : 'ما فيه شي تتراجع عنه');
  if (AT.fl) atFloatCancel(true);
  if (e.t === 'px') e.l.g.putImageData(redo ? e.a : e.b.d, e.b.x, e.b.y);
  else if (e.t === 'st') atApplyStruct(redo ? e.a : e.b);
  else if (e.t === 'combo') (redo ? e.list : e.list.slice().reverse()).forEach(x => { if (x.t === 'px') x.l.g.putImageData(redo ? x.a : x.b.d, x.b.x, x.b.y); else atApplyStruct(redo ? x.a : x.b); });
  to.push(e); atRecomp(); atLayersUI(); atUIUndo(); atSaveSoon(); atCapSoon(); atToast(redo ? 'إعادة' : 'تراجع', 600);
}

// ===== البناء =====
function atBuild(host) {
  AT.on = true; AT.layers = []; AT.undo = []; AT.redo = []; AT.mem = 0; AT.cur = 0; AT.fc = 0; AT.done = false; AT.sel = null; AT.fl = null;
  AT.comp = atMk(AT.W, AT.H); AT.tmp = atMk(AT.W, AT.H); AT.sb = atMk(AT.W, AT.H); AT.live = atMk(AT.W, AT.H); AT.below = atMk(AT.W, AT.H); AT.above = atMk(AT.W, AT.H);
  AT.layers.push(atLayer('طبقة ١')); AT.layers.push(atLayer('طبقة ٢')); AT.cur = 1;
  try { const s = JSON.parse(localStorage.getItem('tart-prefs') || '{}'); if (s.bt) Object.assign(AT.bt, s.bt); if (s.color) AT.color = s.color; if (s.hist) AT.hist = s.hist; if (s.size) Object.assign(AT.size, s.size); if (s.stream) AT.stream = s.stream; } catch {}
  const I = atIcon;
  host.innerHTML = `<div class="atstudio" id="atStudio">
    <canvas id="atCv" class="atcv"></canvas>
    <div class="attop" id="atTop">
      <div class="atgrp">
        <button class="atib" data-a="menu" title="القائمة">${I('menu')}</button>
        <button class="atib" data-a="adjust" title="تعديلات">${I('wand')}</button>
        <button class="atib" data-a="select" title="تحديد">${I('sel')}</button>
        <button class="atib" data-a="transform" title="تحويل">${I('move')}</button>
      </div>
      <div class="atmid" id="atMid"></div>
      <div class="atgrp">
        <button class="atib" data-t="brush" title="فرشاة (B)">${I('brush')}</button>
        <button class="atib" data-t="smudge" title="تلطيخ (S)">${I('smudge')}</button>
        <button class="atib" data-t="eraser" title="ممحاة (E)">${I('erase')}</button>
        <button class="atib" data-t="fill" title="تعبئة (G)">${I('fill')}</button>
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
  atBindUI(); atBindInput(cv); atResize(); atFit(); atRecomp(); atUIColor(); atUITool(); atUIUndo(); atUISliders();
  if (!AT.loop) AT.loop = requestAnimationFrame(atFrame);
  atRestore();
}
// أيقونات خطية بسيطة
function atIcon(k) {
  const P = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', wand: '<path d="M4 20L15 9"/><path d="M14 4v3M18 6l-2 2M20 10h-3M12 6l2 2"/>', sel: '<path d="M7 4c-3 2-4 7-1 10s9 3 11 0-1-9-6-10"/><path d="M9 19l2 2"/>',
    move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
    brush: '<path d="M4 20c2.5 0 4.5-1.2 4.5-4l9-9.5 3 3-9.5 9c-3 0-4.5 1.5-4.5 4"/>', smudge: '<path d="M9 21v-8.5a1.8 1.8 0 013.6 0V11a1.8 1.8 0 013.6 0v1.5a1.8 1.8 0 013.6 0V17a5 5 0 01-5 5h-2a5 5 0 01-3.8-1.8L5 16.5a1.6 1.6 0 012.4-2L9 16"/>',
    erase: '<path d="M4 16.5l8.5-8.5 6 6-5 5H8z"/><path d="M13.5 19.5H21"/>', fill: '<path d="M5 11.5L12 4.5l7 7-7 7z"/><path d="M5 11.5h14"/><path d="M20 15.5s2 2.2 2 3.6a2 2 0 01-4 0c0-1.4 2-3.6 2-3.6z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', play: '<path d="M7 4l13 8-13 8z"/>', down: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${P[k] || ''}</svg>`;
}

// ===== العرض (الكاميرا) =====
function atResize() {
  const cv = AT.cv; if (!cv) return; const d = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect();
  AT.dpr = d; AT.vw = r.width; AT.vh = r.height; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); AT.dirty = true;
}
function atFit() { const m = AT.vw < 700 ? 16 : 70; AT.view = { z: Math.min((AT.vw - m * 2) / AT.W, (AT.vh - m * 2 - 56) / AT.H), r: 0, x: 0, y: 22 }; AT.dirty = true; }
function atToDoc(sx, sy) { const v = AT.view, dx = sx - AT.vw / 2 - v.x, dy = sy - AT.vh / 2 - v.y, c = Math.cos(-v.r), s = Math.sin(-v.r); return [(dx * c - dy * s) / v.z + AT.W / 2, (dx * s + dy * c) / v.z + AT.H / 2]; }
function atToScr(x, y) { const v = AT.view, dx = (x - AT.W / 2) * v.z, dy = (y - AT.H / 2) * v.z, c = Math.cos(v.r), s = Math.sin(v.r); return [dx * c - dy * s + AT.vw / 2 + v.x, dx * s + dy * c + AT.vh / 2 + v.y]; }
function atFrame() {
  AT.loop = 0;
  if (!document.getElementById('atStudio')) { AT.on = false; return; }
  AT.loop = requestAnimationFrame(atFrame);
  if (AT.needComp && !AT.stroke) { atCompose(AT.comp, AT.fl ? { l: AT.fl.l, cv: AT.live } : null); AT.needComp = false; AT.dirty = true; }
  if (!AT.dirty) return; AT.dirty = false;
  const g = AT.vg, v = AT.view, d = AT.dpr;
  g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#2b2c33'; g.fillRect(0, 0, AT.vw, AT.vh);
  g.save(); g.translate(AT.vw / 2 + v.x, AT.vh / 2 + v.y); g.rotate(v.r); g.scale(v.z, v.z); g.translate(-AT.W / 2, -AT.H / 2);
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24; g.fillStyle = '#fff'; g.fillRect(0, 0, AT.W, AT.H); g.shadowBlur = 0;
  g.imageSmoothingEnabled = v.z < 2; g.imageSmoothingQuality = 'high';
  g.drawImage(AT.comp, 0, 0);
  // التحويل: الصورة الطايرة
  if (AT.fl) { const f = AT.fl; g.save(); g.translate(f.x, f.y); g.rotate(f.r); g.scale(f.s * (f.fx ? -1 : 1), f.s * (f.fy ? -1 : 1)); g.globalAlpha = f.l.op; g.drawImage(f.cv, -f.cv.width / 2, -f.cv.height / 2); g.restore(); }
  // التحديد (خط متقطع يمشي)
  if (AT.sel && !AT.fl) { g.save(); g.lineWidth = 1.5 / v.z; g.setLineDash([6 / v.z, 5 / v.z]); g.lineDashOffset = -(performance.now() / 60) % 22 / v.z; g.strokeStyle = '#000'; g.stroke(AT.sel.path); g.strokeStyle = '#fff'; g.lineDashOffset += 5.5 / v.z; g.stroke(AT.sel.path); g.restore(); AT.dirty = true; }
  if (AT.lasso && AT.lasso.pts.length > 1) { g.save(); g.lineWidth = 1.5 / v.z; g.setLineDash([5 / v.z, 4 / v.z]); g.strokeStyle = '#3d7bff'; g.beginPath(); AT.lasso.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (AT.lasso.rect) { const [a, b] = AT.lasso.pts, c = AT.lasso.pts[AT.lasso.pts.length - 1]; g.beginPath(); g.rect(a[0], a[1], c[0] - a[0], c[1] - a[1]); } g.stroke(); g.restore(); }
  // خطوط التناظر
  if (AT.sym !== 'none') { g.save(); g.strokeStyle = 'rgba(61,123,255,.7)'; g.lineWidth = 1.5 / v.z; g.setLineDash([8 / v.z, 6 / v.z]); g.beginPath(); const cx = AT.W / 2, cy = AT.H / 2;
    if (AT.sym === 'v' || AT.sym === 'quad') { g.moveTo(cx, 0); g.lineTo(cx, AT.H); } if (AT.sym === 'h' || AT.sym === 'quad') { g.moveTo(0, cy); g.lineTo(AT.W, cy); }
    if (AT.sym === 'radial') for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 2000, cy + Math.sin(a) * 2000); }
    g.stroke(); g.restore(); }
  g.restore();
  // مقابض التحويل
  if (AT.fl) atFloatHandles(g);
  // دائرة حجم الفرشاة (بالماوس)
  if (AT.hover && !AT.stroke && ['brush', 'eraser', 'smudge'].includes(AT.tool) && !AT.pickMode) { const r = AT.size[AT.tool] * v.z / 2; if (r > 2) { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(AT.hover[0], AT.hover[1], r, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(AT.hover[0], AT.hover[1], r + 1, 0, 7); g.stroke(); } }
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
    const lg = l.g; lg.save(); if (AT.sel) lg.clip(AT.sel.path); lg.globalAlpha = AT.op.smudge * (.35 + .65 * p); lg.globalCompositeOperation = l.lock ? 'source-atop' : 'source-over'; lg.drawImage(pc, 0, 0, s, s, px - s / 2, py - s / 2, s, s); lg.restore();
    box[0] = Math.min(box[0], px - s); box[1] = Math.min(box[1], py - s); box[2] = Math.max(box[2], px + s); box[3] = Math.max(box[3], py + s);
  }
}
function atStrokeStart(x, y, p) {
  const l = atL(); if (!l) return;
  if (!l.vis) { atToast('الطبقة مخفية، شغّلها من الطبقات'); return; }
  const tool = AT.tool, b = atBr(AT.bt[tool] || AT.bt.brush), sz = AT.size[tool] || 20;
  const st = AT.stream[b.id] != null ? AT.stream[b.id] : b.st || 0;
  AT.stroke = { tool, b, sz, col: AT.color, pts: [[x, y]], sm: [x, y], last: [x, y], lp: p, dist: 0, rem: 0, box: [1e9, 1e9, -1e9, -1e9], st, t0: performance.now(), moved: performance.now(), shape: null, dir: 0 };
  if (tool === 'smudge') { AT.snap = AT.snap || atMk(AT.W, AT.H); const sg = AT.snap.getContext('2d'); sg.globalCompositeOperation = 'copy'; sg.drawImage(l.cv, 0, 0); }
  else {
    const sb = AT.sb.getContext('2d'); sb.setTransform(1, 0, 0, 1, 0, 0); sb.globalCompositeOperation = 'source-over'; sb.clearRect(0, 0, AT.W, AT.H);
    // كاش اللي تحت واللي فوق عشان الرسم يكون سريع
    const i = AT.cur, simple = !l.clip && !(AT.layers[i + 1] && AT.layers[i + 1].clip);
    AT.stroke.simple = simple;
    if (simple) { atCompose(AT.below, null, 0, i, true); atCompose(AT.above, null, i + 1, AT.layers.length, false); }
    const lv = AT.live.getContext('2d'); lv.globalCompositeOperation = 'copy'; lv.globalAlpha = 1; lv.drawImage(l.cv, 0, 0); lv.globalCompositeOperation = 'source-over';
  }
  atStrokeTo(x, y, p, true);
}
function atStrokeTo(rx, ry, p, first) {
  const S = AT.stroke; if (!S || S.shape) return;
  S.pts.push([rx, ry]);
  // التنعيم (StreamLine)
  const k = first ? 1 : 1 - S.st * .88; S.sm[0] += (rx - S.sm[0]) * k; S.sm[1] += (ry - S.sm[1]) * k;
  atStrokeSeg(S.sm[0], S.sm[1], p, first);
}
function atStrokeSeg(x, y, p, first) {
  const S = AT.stroke, b = S.b, [lx, ly] = S.last, dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
  if (d > .01) S.dir = Math.atan2(dy, dx);
  const step = Math.max(.6, S.sz * (b.sp || .1) * (b.tip === 'spray' ? 1 : 1));
  const l = atL();
  if (first) { S.rem = step; }
  let t = S.rem; const n0 = S.dist;
  if (first) atOneStamp(x, y, p, x, y);
  else while (t <= d) {
    const f = t / d, px = lx + dx * f, py = ly + dy * f, pp = S.lp + (p - S.lp) * f;
    const tp = b.taper && S.tool !== 'eraser' ? Math.min(1, (n0 + t) / b.taper) : 1;
    atOneStamp(px, py, pp * tp, S.lx || lx, S.ly || ly); S.lx = px; S.ly = py; t += step;
  }
  S.rem = t - d; S.dist += d; S.last = [x, y]; S.lp = p;
  if (S.tool !== 'smudge') atLiveUpdate();
  else { atCompose(AT.comp, null); }
  AT.dirty = true;
}
function atOneStamp(x, y, p, px, py) {
  const S = AT.stroke, b = S.b;
  if (S.tool === 'smudge') return atSmudgeStamp(atL(), b, px, py, x, y, p, S.sz, S.box);
  const g = AT.sb.getContext('2d'); g.globalCompositeOperation = 'source-over';
  atStamp(g, b, x, y, p, S.dir, S.tool === 'eraser' ? '#000000' : S.col, S.sz, S.box);
}
// نحدّث النسخة الحيّة (الطبقة + الضربة) بالمنطقة اللي تغيّرت بس
function atLiveUpdate() {
  const S = AT.stroke, l = atL(), b = S.box; if (b[2] < b[0]) return;
  const x = Math.max(0, b[0] | 0), y = Math.max(0, b[1] | 0), w = Math.min(AT.W, Math.ceil(b[2])) - x, h = Math.min(AT.H, Math.ceil(b[3])) - y; if (w <= 0 || h <= 0) return;
  const lv = AT.live.getContext('2d'); lv.save(); lv.globalCompositeOperation = 'copy'; lv.globalAlpha = 1; lv.drawImage(l.cv, x, y, w, h, x, y, w, h); lv.restore();
  atMergeSb(lv, S, l, x, y, w, h);
  if (S.simple) {
    const g = AT.comp.getContext('2d'); g.save(); g.globalCompositeOperation = 'copy'; g.globalAlpha = 1; g.drawImage(AT.below, x, y, w, h, x, y, w, h);
    g.globalCompositeOperation = l.blend; g.globalAlpha = l.op; g.drawImage(AT.live, x, y, w, h, x, y, w, h);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(AT.above, x, y, w, h, x, y, w, h); g.restore();
  } else atCompose(AT.comp, { l, cv: AT.live });
}
function atMergeSb(g, S, l, x, y, w, h) {
  const b = S.b; g.save(); if (AT.sel) g.clip(AT.sel.path);
  g.globalAlpha = AT.op[S.tool] * (b.glaze || 1);
  g.globalCompositeOperation = S.tool === 'eraser' ? 'destination-out' : l.lock ? 'source-atop' : b.add ? 'lighter' : 'source-over';
  if (w != null) g.drawImage(AT.sb, x, y, w, h, x, y, w, h); else g.drawImage(AT.sb, 0, 0);
  g.restore();
}
function atStrokeEnd() {
  const S = AT.stroke; if (!S) return; clearTimeout(AT.qsT);
  if (!S.shape && S.dist > 0) atStrokeSeg(S.pts[S.pts.length - 1][0], S.pts[S.pts.length - 1][1], S.lp); // آخر نقطة بدون تنعيم
  const l = atL(), b = S.box; AT.stroke = null;
  if (b[2] < b[0]) { atRecomp(); return; }
  const x = b[0] - 2, y = b[1] - 2, w = b[2] - b[0] + 4, h = b[3] - b[1] + 4;
  if (S.tool === 'smudge') {
    const p = { x: Math.max(0, Math.floor(x)), y: Math.max(0, Math.floor(y)) }; p.w = Math.min(AT.W - p.x, Math.ceil(w)); p.h = Math.min(AT.H - p.y, Math.ceil(h));
    if (p.w > 0 && p.h > 0) { p.d = AT.snap.getContext('2d').getImageData(p.x, p.y, p.w, p.h); atPush(atPxEntry(l, p)); }
  } else {
    const before = atPatch(l, x, y, w, h); if (!before) { atRecomp(); return; }
    atMergeSb(l.g, S, l, before.x, before.y, before.w, before.h);
    atPush(atPxEntry(l, before));
    if (S.tool === 'brush') atAddHist(S.col);
  }
  atRecomp(); atThumbSoon();
}
// الشكل السريع (QuickShape): توقف ثانية آخر الخط ويتعدل لخط أو دائرة أو مستطيل
function atQuickShape() {
  const S = AT.stroke; if (!S || S.shape || S.tool === 'smudge' || !AT.qs || S.pts.length < 6) return;
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

// ===== التعبئة والقطّارة =====
function atPick(x, y) {
  x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= AT.W || y >= AT.H) return;
  const d = AT.comp.getContext('2d').getImageData(x, y, 1, 1).data;
  AT.color = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); atUIColor(); atToast('أخذت اللون', 600);
}
function atFill(x, y) {
  x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= AT.W || y >= AT.H) return;
  const l = atL(); if (!l.vis) return atToast('الطبقة مخفية');
  const W = AT.W, H = AT.H, src = AT.comp.getContext('2d').getImageData(0, 0, W, H).data, tol = (AT.fillTol == null ? 22 : AT.fillTol) * 2.55 * 2;
  const i0 = (y * W + x) * 4, r0 = src[i0], g0 = src[i0 + 1], b0 = src[i0 + 2], a0 = src[i0 + 3];
  const m = new Uint8Array(W * H), st = [x, y]; let minX = x, maxX = x, minY = y, maxY = y;
  const same = i => { const k = i * 4; return Math.abs(src[k] - r0) + Math.abs(src[k + 1] - g0) + Math.abs(src[k + 2] - b0) + Math.abs(src[k + 3] - a0) <= tol; };
  while (st.length) {
    const sy = st.pop(), sx = st.pop(); let lx = sx; while (lx > 0 && !m[sy * W + lx - 1] && same(sy * W + lx - 1)) lx--;
    let rx = sx; while (rx < W - 1 && !m[sy * W + rx + 1] && same(sy * W + rx + 1)) rx++;
    for (let i = lx; i <= rx; i++) m[sy * W + i] = 1;
    if (lx < minX) minX = lx; if (rx > maxX) maxX = rx; if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    for (const ny of [sy - 1, sy + 1]) { if (ny < 0 || ny >= H) continue; let i = lx; while (i <= rx) { if (!m[ny * W + i] && same(ny * W + i)) { st.push(i, ny); while (i <= rx && !m[ny * W + i] && same(ny * W + i)) i++; } i++; } }
  }
  // نكبّر القناع بكسل عشان ما يبقى خط أبيض عند الحواف
  const bx = Math.max(0, minX - 2), by = Math.max(0, minY - 2), bw = Math.min(W, maxX + 3) - bx, bh = Math.min(H, maxY + 3) - by;
  const mk = atMk(bw, bh), mg = mk.getContext('2d'), id = mg.createImageData(bw, bh), [cr, cg, cb] = atHex(AT.color);
  for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) { const X = bx + xx, Y = by + yy; let on = m[Y * W + X]; if (!on) on = (X > 0 && m[Y * W + X - 1]) || (X < W - 1 && m[Y * W + X + 1]) || (Y > 0 && m[(Y - 1) * W + X]) || (Y < H - 1 && m[(Y + 1) * W + X]); if (on) { const k = (yy * bw + xx) * 4; id.data[k] = cr; id.data[k + 1] = cg; id.data[k + 2] = cb; id.data[k + 3] = 255; } }
  mg.putImageData(id, 0, 0);
  const before = atPatch(l, bx, by, bw, bh); const g = l.g; g.save(); if (AT.sel) g.clip(AT.sel.path); g.globalAlpha = AT.op.brush; g.globalCompositeOperation = l.lock ? 'source-atop' : 'source-over'; g.drawImage(mk, bx, by); g.restore();
  atPush(atPxEntry(l, before)); atAddHist(AT.color); atRecomp(); atThumbSoon(); try { sfx('pop'); } catch {}
}
const atHex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

// ===== التحديد والتحويل =====
function atSelFinish() {
  const L = AT.lasso; AT.lasso = null; if (!L || L.pts.length < 2) { AT.dirty = true; return; }
  const p = new Path2D(); let pts = L.pts;
  if (L.rect) { const [a] = pts, c = pts[pts.length - 1]; pts = [a, [c[0], a[1]], c, [a[0], c[1]]]; }
  pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath();
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  if (box[2] - box[0] < 3 || box[3] - box[1] < 3) { AT.sel = null; atSelBar(); AT.dirty = true; return; }
  AT.sel = { path: p, box }; atSelBar(); AT.dirty = true;
}
function atSelBar() {
  const bar = document.getElementById('atSelBar'); if (!bar) return;
  if (AT.fl) { bar.hidden = false; bar.innerHTML = `<button data-f="fx">قلب أفقي</button><button data-f="fy">قلب عمودي</button><button data-f="r90">تدوير ٩٠°</button><button data-f="cancel">إلغاء</button><button data-f="ok" class="ok">تم</button>`; return; }
  if (AT.tool === 'select') { bar.hidden = false; bar.innerHTML = `<button data-s="free" class="${AT.selMode !== 'rect' ? 'on' : ''}">حر</button><button data-s="rect" class="${AT.selMode === 'rect' ? 'on' : ''}">مستطيل</button>${AT.sel ? `<button data-s="copy">نسخ لطبقة</button><button data-s="clear">امسح</button><button data-s="tf">حرّك</button><button data-s="none">ألغِ التحديد</button>` : '<span>ارسم حول الجزء اللي تبيه</span>'}<button data-s="done" class="ok">تم</button>`; return; }
  if (AT.sel) { bar.hidden = false; bar.innerHTML = `<span>الرسم داخل التحديد بس</span><button data-s="none">ألغِ التحديد</button>`; return; }
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
  const cv = atMk(bw, bh), g = cv.getContext('2d'); g.save(); if (AT.sel) { g.translate(-bx, -by); g.clip(AT.sel.path); g.drawImage(l.cv, 0, 0); } else g.drawImage(l.cv, bx, by, bw, bh, 0, 0, bw, bh); g.restore();
  const before = l.g.getImageData(0, 0, AT.W, AT.H);
  // نشيلها من الطبقة (بالنسخة الحية) لين ينتهي التحويل
  const lv = AT.live.getContext('2d'); lv.globalCompositeOperation = 'copy'; lv.drawImage(l.cv, 0, 0); lv.globalCompositeOperation = 'destination-out'; lv.save(); if (AT.sel) lv.fill(AT.sel.path); else lv.fillRect(bx, by, bw, bh); lv.restore(); lv.globalCompositeOperation = 'source-over';
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
function atFloatCancel(silent) { if (!AT.fl) return; AT.fl = null; AT.tool = AT.prevTool || 'brush'; atUITool(); atSelBar(); atRecomp(); if (!silent) atToast('ألغيت التحويل'); }
function atFloatGeom() { const f = AT.fl, w = f.cv.width * f.s / 2, h = f.cv.height * f.s / 2, c = Math.cos(f.r), s = Math.sin(f.r); const P = (x, y) => atToScr(f.x + x * c - y * s, f.y + x * s + y * c); return { c: [P(-w, -h), P(w, -h), P(w, h), P(-w, h)], rot: P(0, -h - 40 / AT.view.z), ctr: atToScr(f.x, f.y) }; }
function atFloatHandles(g) {
  const G = atFloatGeom(); g.save(); g.strokeStyle = '#3d7bff'; g.lineWidth = 1.5; g.beginPath(); G.c.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke();
  g.fillStyle = '#fff'; G.c.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.stroke(); });
  g.beginPath(); g.moveTo(...G.rot); g.lineTo((G.c[0][0] + G.c[1][0]) / 2, (G.c[0][1] + G.c[1][1]) / 2); g.stroke(); g.fillStyle = '#3d7bff'; g.beginPath(); g.arc(G.rot[0], G.rot[1], 9, 0, 7); g.fill(); g.restore();
}

// ===== النص =====
function atTextAt(x, y) {
  const pop = document.getElementById('atPop'); AT.popK = 'text'; pop.hidden = false; pop.className = 'atpop attext';
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
  const l = atL(), pop = document.getElementById('atPop'); AT.popK = 'adjust'; pop.hidden = false; pop.className = 'atpop atadjust';
  const src = atMk(AT.W, AT.H); src.getContext('2d').drawImage(l.cv, 0, 0); const V = { b: 0, h: 0, s: 100, l: 100, c: 100 };
  pop.innerHTML = `<b>تعديل «${esc(l.name)}»</b>
    <label>تمويه <input type="range" data-k="b" min="0" max="40" value="0"><em>٠</em></label>
    <label>درجة اللون <input type="range" data-k="h" min="-180" max="180" value="0"><em>٠</em></label>
    <label>التشبع <input type="range" data-k="s" min="0" max="200" value="100"><em>١٠٠٪</em></label>
    <label>السطوع <input type="range" data-k="l" min="0" max="200" value="100"><em>١٠٠٪</em></label>
    <label>التباين <input type="range" data-k="c" min="0" max="200" value="100"><em>١٠٠٪</em></label>
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
    g.restore(); atRecomp();
  };
  pop.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { V[r.dataset.k] = +r.value; r.nextElementSibling.textContent = atNum(r.value) + (r.dataset.k === 'b' ? '' : r.dataset.k === 'h' ? '°' : '٪'); if (!raf) raf = requestAnimationFrame(apply); });
  document.getElementById('atAdjNo').onclick = () => { const g = l.g; g.save(); g.globalCompositeOperation = 'copy'; g.drawImage(src, 0, 0); g.restore(); atRecomp(); atClosePop(); };
  document.getElementById('atAdjOk').onclick = () => { const b = { x: 0, y: 0, w: AT.W, h: AT.H, d: src.getContext('2d').getImageData(0, 0, AT.W, AT.H) }; atPush(atPxEntry(l, b)); atClosePop(); atThumbSoon(); };
}

// ===== الإدخال (قلم، لمس، ماوس) =====
function atBindInput(cv) {
  const P = new Map(); let gest = null, pending = null;
  const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const prs = e => e.pointerType === 'pen' ? (e.pressure || .5) : e.pointerType === 'touch' ? (e.pressure > 0 && e.pressure < 1 ? .5 + e.pressure / 2 : 1) : 1;
  const startGesture = () => {
    if (AT.stroke) { // اللمسة الأولى كانت بداية رسم: نلغيها
      const S = AT.stroke; AT.stroke = null; clearTimeout(AT.qsT); if (S.tool === 'smudge') { const g = atL().g; g.globalCompositeOperation = 'copy'; g.drawImage(AT.snap, 0, 0); g.globalCompositeOperation = 'source-over'; } atRecomp();
    }
    AT.lasso = null;
    const ps = [...P.values()], [a, b] = ps; const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    gest = { n: ps.length, maxN: ps.length, t0: performance.now(), moved: 0, d0: Math.hypot(a.x - b.x, a.y - b.y), a0: Math.atan2(b.y - a.y, b.x - a.x), v0: { ...AT.view }, doc: atToDoc(mx, my), m0: [mx, my] };
  };
  cv.addEventListener('pointerdown', e => {
    if (AT.done) return; try { cv.setPointerCapture(e.pointerId); } catch {} atClosePop(true);
    const [x, y] = pt(e); P.set(e.pointerId, { x, y, type: e.pointerType });
    if (e.pointerType === 'pen') AT.pen = true;
    const touches = [...P.values()].filter(p => p.type === 'touch');
    if (e.pointerType === 'touch' && touches.length >= 2) { if (gest) { gest.n = touches.length; gest.maxN = Math.max(gest.maxN, touches.length); } else startGesture(); return; }
    if (e.pointerType === 'touch' && AT.pen) { pending = null; return; } // فيه قلم: الأصابع للتكبير والتحريك بس
    if (e.button === 1 || (e.button === 0 && AT.space)) { gest = { pan: true, x, y, v0: { ...AT.view } }; return; }
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const [dx, dy] = atToDoc(x, y);
    if (AT.pickMode || e.altKey) { atPick(dx, dy); AT.pickMode = false; atUIDrop(); return; }
    if (AT.tool === 'fill') return atFill(dx, dy);
    if (AT.tool === 'text') return atTextAt(dx, dy);
    if (AT.tool === 'select') { AT.lasso = { pts: [[dx, dy]], rect: AT.selMode === 'rect' }; AT.sel = null; AT.dirty = true; return; }
    if (AT.tool === 'transform' && AT.fl) { atTfDown(x, y); return; }
    if (['brush', 'eraser', 'smudge'].includes(AT.tool)) { atStrokeStart(dx, dy, prs(e)); pending = e.pointerType === 'touch' ? performance.now() : null; }
  });
  cv.addEventListener('pointermove', e => {
    const [x, y] = pt(e); if (e.pointerType === 'mouse') { AT.hover = [x, y]; if (!AT.stroke) AT.dirty = true; }
    const p = P.get(e.pointerId); if (!p) return; p.x = x; p.y = y;
    if (gest) {
      if (gest.pan) { AT.view.x = gest.v0.x + x - gest.x; AT.view.y = gest.v0.y + y - gest.y; AT.dirty = true; return; }
      const ps = [...P.values()].filter(q => q.type === 'touch'); if (ps.length < 2) return; const [a, b] = ps;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = Math.hypot(a.x - b.x, a.y - b.y), an = Math.atan2(b.y - a.y, b.x - a.x);
      gest.moved = Math.max(gest.moved, Math.abs(d - gest.d0), Math.hypot(mx - gest.m0[0], my - gest.m0[1]));
      const v = AT.view; v.z = atClamp(gest.v0.z * d / gest.d0, .05, 30); v.r = gest.v0.r + an - gest.a0;
      // النقطة اللي بين الإصبعين تظل تحتهم
      v.x = 0; v.y = 0; const [sx, sy] = atToScr(...gest.doc); v.x = mx - sx; v.y = my - sy; AT.dirty = true; return;
    }
    if (AT.lasso) { const [dx, dy] = atToDoc(x, y); if (AT.lasso.rect) AT.lasso.pts[1] = [dx, dy]; else AT.lasso.pts.push([dx, dy]); AT.dirty = true; return; }
    if (AT.tf) { atTfMove(x, y); return; }
    if (!AT.stroke) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) { const [cx, cy] = pt(ev); const [dx, dy] = atToDoc(cx, cy); atStrokeTo(dx, dy, prs(ev)); }
    // الشكل السريع: لو وقفت ثابت
    const S = AT.stroke; if (S && !S.shape) { const q = S.pts[S.pts.length - 1]; if (!S.hold || Math.hypot(q[0] - S.hold[0], q[1] - S.hold[1]) * AT.view.z > 4) { S.hold = q; clearTimeout(AT.qsT); AT.qsT = setTimeout(atQuickShape, 650); } }
  });
  const up = e => {
    const p = P.get(e.pointerId); if (!p) return; P.delete(e.pointerId);
    if (gest) {
      if (!gest.pan && P.size === 0) { // نقرة بإصبعين = تراجع، بثلاث = إعادة، بأربع = إخفاء الأدوات
        const quick = performance.now() - gest.t0 < 280 && gest.moved < 14;
        if (quick && gest.maxN === 2) atUndo(); else if (quick && gest.maxN === 3) atUndo(true); else if (quick && gest.maxN >= 4) atToggleUI();
        // نرجع التدوير لصفر لو قريب
        if (Math.abs(AT.view.r % (Math.PI * 2)) < .07) { AT.view.r = 0; AT.dirty = true; }
        gest = null;
      } else if (gest.pan) gest = null;
      return;
    }
    if (AT.lasso) return atSelFinish();
    if (AT.tf) { AT.tf = null; return; }
    if (AT.stroke) atStrokeEnd();
    pending = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { AT.hover = null; AT.dirty = true; });
  cv.addEventListener('wheel', e => { // عجلة الماوس: تكبير عند المؤشر (Shift للتدوير)
    e.preventDefault(); const [x, y] = pt(e), v = AT.view, doc = atToDoc(x, y);
    if (e.shiftKey) v.r += e.deltaY * .002; else v.z = atClamp(v.z * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0015)), .05, 30);
    v.x = 0; v.y = 0; const [sx, sy] = atToScr(...doc); v.x = x - sx; v.y = y - sy; AT.dirty = true;
  }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  if (!AT.keys) {
    AT.keys = true;
    addEventListener('keydown', e => {
      if (!document.getElementById('atStudio') || AT.done || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if (mod && k === 'z') { e.preventDefault(); atUndo(e.shiftKey); }
      else if (mod && k === 'y') { e.preventDefault(); atUndo(true); }
      else if (k === ' ') { AT.space = true; e.preventDefault(); }
      else if (mod) return;
      else if (k === 'b') atSetTool('brush'); else if (k === 'e') atSetTool('eraser'); else if (k === 's') atSetTool('smudge'); else if (k === 'g') atSetTool('fill'); else if (k === 't') atSetTool('text');
      else if (k === '[' || k === ']') { const t = AT.tool in AT.size ? AT.tool : 'brush'; AT.size[t] = atClamp(Math.round(AT.size[t] * (k === ']' ? 1.15 : 1 / 1.15)), 1, 600); atUISliders(); AT.dirty = true; }
      else if (k === '0') atFit(); else if (k === 'tab') { e.preventDefault(); atToggleUI(); }
      else if (k === 'enter' && AT.fl) atFloatCommit(); else if (k === 'escape') { if (AT.fl) atFloatCancel(); else atClosePop(); }
    });
    addEventListener('keyup', e => { if (e.key === ' ') AT.space = false; });
    addEventListener('resize', () => { if (document.getElementById('atStudio')) { atResize(); AT.dirty = true; } });
  }
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
function atUITool() { document.querySelectorAll('#atTop [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === AT.tool)); document.querySelectorAll('#atTop [data-a="select"]').forEach(b => b.classList.toggle('on', AT.tool === 'select')); document.querySelectorAll('#atTop [data-a="transform"]').forEach(b => b.classList.toggle('on', AT.tool === 'transform')); }
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
function atPrefs() { try { localStorage.setItem('tart-prefs', JSON.stringify({ bt: AT.bt, color: AT.color, hist: AT.hist, size: AT.size, stream: AT.stream })); } catch {} }
let AT_TOAST = 0;
function atToast(t, ms = 1400) { const e = document.getElementById('atToast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(AT_TOAST); AT_TOAST = setTimeout(() => e.classList.remove('on'), ms); }
function atToggleUI() { AT.ui = !AT.ui; document.getElementById('atStudio').classList.toggle('noui', !AT.ui); atToast(AT.ui ? 'رجعت الأدوات' : 'وضع اللوحة كاملة (٤ أصابع أو Tab ترجعها)'); }
function atClosePop(soft) { const p = document.getElementById('atPop'); if (!p || p.hidden) return; if (soft && (AT.popK === 'text' || AT.popK === 'adjust')) return; p.hidden = true; AT.popK = null; document.querySelectorAll('#atTop .atib.pop').forEach(b => b.classList.remove('pop')); }
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
    if (b.dataset.s) atSelAct(b.dataset.s);
    if (b.dataset.f) { const f = AT.fl; if (!f) return; const k = b.dataset.f; if (k === 'fx') f.fx = !f.fx; else if (k === 'fy') f.fy = !f.fy; else if (k === 'r90') f.r += Math.PI / 2; else if (k === 'cancel') atFloatCancel(); else if (k === 'ok') atFloatCommit(); AT.dirty = true; }
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
  if (k === 'free' || k === 'rect') { AT.selMode = k; atSelBar(); return; }
  if (k === 'none') { AT.sel = null; atSelBar(); AT.dirty = true; return; }
  if (k === 'done') { atSetTool('brush'); return; }
  if (k === 'tf') { atFloatStart(); return; }
  const l = atL(); if (!AT.sel) return;
  if (k === 'clear') { const [x0, y0, x1, y1] = AT.sel.box, b = atPatch(l, x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2); l.g.save(); l.g.globalCompositeOperation = 'destination-out'; l.g.fill(AT.sel.path); l.g.restore(); atPush(atPxEntry(l, b)); atRecomp(); atThumbSoon(); }
  if (k === 'copy') atStructDo(() => { const n = atLayer('نسخة'); n.g.save(); n.g.clip(AT.sel.path); n.g.drawImage(l.cv, 0, 0); n.g.restore(); AT.layers.splice(AT.cur + 1, 0, n); AT.cur++; atToast('نسخت لطبقة جديدة'); });
}
function atOpenPop(k, btn) {
  const pop = document.getElementById('atPop'); if (AT.popK === k && !pop.hidden) return atClosePop();
  atClosePop(); AT.popK = k; pop.hidden = false; pop.className = 'atpop at' + k; if (btn) btn.classList.add('pop');
  if (k === 'brushes') atBrushUI(pop); else if (k === 'layers') atLayersUI(); else if (k === 'color') atColorUI(pop); else if (k === 'menu') atMenuUI(pop);
}
// مكتبة الفرش
function atBrushUI(pop) {
  const tk = AT.tool in AT.bt ? AT.tool : 'brush', cur = atBr(AT.bt[tk]); AT.bcat = AT.bcat || cur.c;
  pop.innerHTML = `<div class="athd"><b>${tk === 'eraser' ? 'فرشاة الممحاة' : tk === 'smudge' ? 'فرشاة التلطيخ' : 'مكتبة الفرش'}</b><label>تنعيم الخط <input type="range" id="atStr" min="0" max="95" value="${Math.round((AT.stream[cur.id] != null ? AT.stream[cur.id] : cur.st) * 100)}"></label><label class="atchk"><input type="checkbox" id="atQs" ${AT.qs ? 'checked' : ''}> الشكل السريع</label></div>
    <div class="atbl"><div class="atcats">${AT_CATS.map(([c, n]) => `<button data-c="${c}" class="${c === AT.bcat ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="atbrs">${AT_BR.filter(b => b.c === AT.bcat).map(b => `<button data-b="${b.id}" class="${b.id === cur.id ? 'on' : ''}"><canvas width="300" height="70" data-p="${b.id}"></canvas><span>${b.n}</span></button>`).join('')}</div></div>`;
  pop.querySelectorAll('canvas[data-p]').forEach(c => atBrushPreview(c, atBr(c.dataset.p)));
  pop.querySelectorAll('[data-c]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.bcat = b.dataset.c; atBrushUI(pop); });
  pop.querySelectorAll('[data-b]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.bt[tk] = b.dataset.b; if (tk === 'brush') AT.size.brush = atBr(b.dataset.b).def; atPrefs(); atBrushUI(pop); atUISliders(); });
  document.getElementById('atStr').oninput = e => { AT.stream[cur.id] = +e.target.value / 100; atPrefs(); };
  document.getElementById('atQs').onchange = e => { AT.qs = e.target.checked; };
}
function atBrushPreview(c, b) {
  const g = c.getContext('2d'), save = AT.sym; AT.sym = 'none'; g.clearRect(0, 0, c.width, c.height);
  const sz = Math.min(28, b.def * .5 + 6), col = '#f4f1ea'; let lx = 14, ly = 35, rem = 0, dir = 0;
  for (let i = 1; i <= 60; i++) { const x = 14 + i / 60 * 272, y = 35 + Math.sin(i / 60 * Math.PI * 2) * 16, p = Math.sin(i / 60 * Math.PI), dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy); dir = Math.atan2(dy, dx); let t = rem; const step = Math.max(.8, sz * b.sp);
    while (t <= d) { const f = t / d; atStamp(g, b, lx + dx * f, ly + dy * f, p, dir, col, sz, null); t += step; } rem = t - d; lx = x; ly = y; }
  g.globalAlpha = 1; AT.sym = save;
}
// الألوان
function atColorUI(pop) {
  const [r, g, b] = atHex(AT.color), [h, s, v] = atRgb2Hsv(r, g, b); AT.hsv = AT.hsv && atHsv2Hex(...AT.hsv) === AT.color ? AT.hsv : [h, s, v];
  pop.innerHTML = `<div class="athd"><b>الألوان</b><span class="atcur" style="background:${AT.color}"></span><input id="atHex" value="${AT.color.slice(1).toUpperCase()}" maxlength="6" dir="ltr"></div>
    <div class="atsv" id="atSV"><canvas width="240" height="180"></canvas><i></i></div><div class="athue" id="atHue"><i></i></div>
    <small>آخر الألوان</small><div class="atsws">${(AT.hist.length ? AT.hist : ['#1d1d1f']).map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}</div>
    <small>لوحة الألوان</small><div class="atsws">${AT_PAL.map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}</div>`;
  const sv = pop.querySelector('#atSV'), svc = sv.querySelector('canvas'), hue = pop.querySelector('#atHue');
  const draw = () => {
    const [H, S, V] = AT.hsv, g2 = svc.getContext('2d'); g2.fillStyle = atHsv2Hex(H, 1, 1); g2.fillRect(0, 0, 240, 180);
    let gr = g2.createLinearGradient(0, 0, 240, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 240, 180);
    gr = g2.createLinearGradient(0, 0, 0, 180); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, '#000'); g2.fillStyle = gr; g2.fillRect(0, 0, 240, 180);
    sv.querySelector('i').style.left = S * 100 + '%'; sv.querySelector('i').style.top = (1 - V) * 100 + '%'; hue.querySelector('i').style.left = H / 360 * 100 + '%';
    pop.querySelector('.atcur').style.background = AT.color; const hx = document.getElementById('atHex'); if (document.activeElement !== hx) hx.value = AT.color.slice(1).toUpperCase();
  };
  const setHsv = (H, S, V) => { AT.hsv = [H, S, V]; AT.color = atHsv2Hex(H, S, V); atUIColor(); atUIDrop(); draw(); };
  const drag = (el, fn) => { const go = e => { const r = el.getBoundingClientRect(); fn(atClamp((e.clientX - r.left) / r.width, 0, 1), atClamp((e.clientY - r.top) / r.height, 0, 1)); };
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); el.d = 1; go(e); }); el.addEventListener('pointermove', e => el.d && go(e)); el.addEventListener('pointerup', () => { el.d = 0; atAddHist(AT.color); }); };
  drag(sv, (x, y) => setHsv(AT.hsv[0], x, 1 - y)); drag(hue, x => setHsv(x * 360, AT.hsv[1], AT.hsv[2]));
  pop.querySelectorAll('.atsws [data-c]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.color = b.dataset.c; const [r2, g3, b3] = atHex(AT.color); AT.hsv = atRgb2Hsv(r2, g3, b3); atUIColor(); atUIDrop(); draw(); });
  document.getElementById('atHex').oninput = e => { const v = e.target.value.replace(/[^0-9a-f]/gi, ''); if (v.length === 6) { AT.color = '#' + v.toLowerCase(); const [r2, g3, b3] = atHex(AT.color); AT.hsv = atRgb2Hsv(r2, g3, b3); atUIColor(); draw(); } };
  draw();
}
function atRgb2Hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, mx ? d / mx : 0, mx]; }
function atHsv2Hex(h, s, v) { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); }
// الطبقات
function atLayersUI() {
  const pop = document.getElementById('atPop'); if (!pop || AT.popK !== 'layers' || pop.hidden) return;
  const open = AT.lopen;
  pop.innerHTML = `<div class="athd"><b>الطبقات</b><button class="atib sm" id="atLAdd" title="طبقة جديدة">${atIcon('plus')}</button></div>
    <div class="atls">${AT.layers.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => `<div class="atly${i === AT.cur ? ' on' : ''}${l.clip ? ' clip' : ''}" data-i="${i}">
      <canvas width="64" height="48" data-th="${i}"></canvas><span class="atln">${esc(l.name)}<small>${l.blend !== 'source-over' ? AT_BLEND.find(b => b[0] === l.blend)[1] + ' · ' : ''}${atNum(Math.round(l.op * 100))}٪${l.lock ? ' · قفل' : ''}${l.clip ? ' · قص' : ''}</small></span>
      <button class="atv${l.vis ? ' on' : ''}" data-v="${i}" title="إظهار">${atIcon('eye')}</button><button class="atmore" data-m="${i}">${atIcon('dots')}</button></div>
      ${open === l.id ? `<div class="atlo" data-i="${i}">
        <label>الشفافية <input type="range" min="0" max="100" value="${Math.round(l.op * 100)}" data-o="${i}"></label>
        <label>الدمج <select data-bl="${i}">${AT_BLEND.map(([v, n]) => `<option value="${v}"${v === l.blend ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="atrow wrap"><button data-op="clip" class="${l.clip ? 'on' : ''}">قص على اللي تحت</button><button data-op="lock" class="${l.lock ? 'on' : ''}">قفل الشفافية</button><button data-op="dup">تكرار</button><button data-op="merge">دمج تحت</button><button data-op="up">فوق</button><button data-op="down">تحت</button><button data-op="clear">مسح</button><button data-op="ren">اسم</button><button data-op="del" class="bad">حذف</button></div></div>` : ''}`).join('')}</div>
    <div class="atbgrow"><span>الخلفية</span><button id="atBg" style="background:${AT.bg}"></button><small>(تاخذ اللون الحالي)</small></div>`;
  pop.querySelectorAll('canvas[data-th]').forEach(c => { const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 48); g.drawImage(AT.layers[+c.dataset.th].cv, 0, 0, 64, 48); });
  pop.querySelectorAll('.atly').forEach(r => r.onclick = e => { if (e.target.closest('button')) return; e.stopPropagation(); AT.cur = +r.dataset.i; atLayersUI(); });
  pop.querySelectorAll('[data-v]').forEach(b => b.onclick = e => { e.stopPropagation(); const l = AT.layers[+b.dataset.v]; atStructDo(() => { l.vis = !l.vis; }); });
  pop.querySelectorAll('[data-m]').forEach(b => b.onclick = e => { e.stopPropagation(); const l = AT.layers[+b.dataset.m]; AT.cur = +b.dataset.m; AT.lopen = AT.lopen === l.id ? null : l.id; atLayersUI(); });
  pop.querySelectorAll('[data-o]').forEach(r => { let b0 = null; r.oninput = () => { const l = AT.layers[+r.dataset.o]; if (!b0) b0 = atStruct(); l.op = +r.value / 100; atRecomp(); }; r.onchange = () => { if (b0) { atPush({ t: 'st', b: b0, a: atStruct(), mem: 1000 }); b0 = null; atLayersUI(); } }; });
  pop.querySelectorAll('[data-bl]').forEach(s => s.onchange = () => { const l = AT.layers[+s.dataset.bl]; atStructDo(() => { l.blend = s.value; }); });
  pop.querySelectorAll('[data-op]').forEach(b => b.onclick = e => { e.stopPropagation(); atLayerOp(b.dataset.op); });
  document.getElementById('atLAdd').onclick = e => { e.stopPropagation(); if (AT.layers.length >= 12) return atToast('أكثر شي ١٢ طبقة'); atStructDo(() => { AT.layers.splice(AT.cur + 1, 0, atLayer('طبقة ' + atNum(AT.layers.length + 1))); AT.cur++; }); };
  document.getElementById('atBg').onclick = e => { e.stopPropagation(); atStructDo(() => { AT.bg = AT.color; }); };
}
function atLayerOp(op) {
  const i = AT.cur, l = AT.layers[i];
  if (op === 'clip') return atStructDo(() => { l.clip = !l.clip && i > 0; });
  if (op === 'lock') return atStructDo(() => { l.lock = !l.lock; });
  if (op === 'dup') { if (AT.layers.length >= 12) return atToast('أكثر شي ١٢ طبقة'); return atStructDo(() => { const n = atLayer(l.name + ' نسخة'); n.g.drawImage(l.cv, 0, 0); Object.assign(n, { op: l.op, blend: l.blend }); AT.layers.splice(i + 1, 0, n); AT.cur = i + 1; }); }
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
  const host = S && atHost();
  pop.innerHTML = `<div class="athd"><b>القائمة</b></div><div class="atmenu">
    <button data-mm="png">${atIcon('down')} احفظ صورة</button>
    <button data-mm="text">${atIcon('text')} نص</button>
    <div class="atsub">دليل الرسم (تناظر)</div><div class="atrow wrap">${[['none', 'بدون'], ['v', 'عمودي'], ['h', 'أفقي'], ['quad', '٤ جهات'], ['radial', 'دائري ٨']].map(([k, n]) => `<button data-sym="${k}" class="${AT.sym === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="atsub">التعبئة</div><label>الحساسية <input type="range" id="atTol" min="0" max="80" value="${AT.fillTol == null ? 22 : AT.fillTol}"></label>
    <button data-mm="fit">رجّع اللوحة للنص</button>
    <button data-mm="ui">إخفاء الأدوات</button>
    ${host ? '<button data-mm="end" class="bad">إنهاء الرسم للكل وعرض الرسومات</button>' : ''}
    <button data-mm="quit" class="bad">اطلع من اللعبة</button>
    <small class="atkeys">اختصارات: B فرشاة · E ممحاة · S تلطيخ · G تعبئة · T نص · [ ] الحجم · Ctrl+Z تراجع · مسافة+سحب تحريك · 0 ملء الشاشة · Tab إخفاء الأدوات<br>باللمس: إصبعين تكبير وتدوير · نقرة بإصبعين تراجع · بثلاث إعادة · بأربع إخفاء الأدوات</small></div>`;
  pop.querySelectorAll('[data-sym]').forEach(b => b.onclick = e => { e.stopPropagation(); AT.sym = b.dataset.sym; atMenuUI(pop); AT.dirty = true; });
  document.getElementById('atTol').oninput = e => { AT.fillTol = +e.target.value; };
  pop.querySelectorAll('[data-mm]').forEach(b => b.onclick = e => {
    e.stopPropagation(); const k = b.dataset.mm;
    if (k === 'png') { atCompose(AT.comp, null); AT.comp.toBlob(bl => atDownload(bl, 'tarteeb-my-drawing.png'), 'image/png'); }
    else if (k === 'text') { atClosePop(); atSetTool('text'); atToast('المس مكان النص'); }
    else if (k === 'fit') { atFit(); atClosePop(); }
    else if (k === 'ui') { atClosePop(); atToggleUI(); }
    else if (k === 'end') { if (confirm('تنهي الرسم للكل وتبدأ العرض؟')) { send({ t: 'aend' }); atClosePop(); } }
    else if (k === 'quit') { if (confirm('تطلع؟ رسمتك بتروح')) { atClosePop(); document.getElementById('quit2').click(); } }
  });
}
function atDownload(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
let AT_THT = 0; function atThumbSoon() { clearTimeout(AT_THT); AT_THT = setTimeout(() => { if (AT.popK === 'layers') atLayersUI(); }, 300); }

// ===== لقطات التسريع والحفظ =====
function atEnc(cv, q) { // webp ولو ما ينفع (سفاري) jpeg
  return new Promise(ok => cv.toBlob(b => { if (b && b.type === 'image/webp') return ok(b); cv.toBlob(j => ok(j), 'image/jpeg', Math.min(.92, q + .1)); }, 'image/webp', q));
}
const atB64 = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
let AT_CAPT = 0;
function atCapSoon() { AT.capDirty = true; clearTimeout(AT_CAPT); const wait = Math.max(300, 1500 - (Date.now() - AT.capT)); AT_CAPT = setTimeout(atCapture, wait); }
async function atCapture() {
  if (!AT.capDirty || AT.done || !S || !S.g || S.game !== 'art' || S.spec) return;
  if (AT.stroke) return atCapSoon();
  AT.capDirty = false; AT.capT = Date.now();
  atCompose(AT.comp, AT.fl ? { l: AT.fl.l, cv: AT.live } : null);
  const f = AT.frm || (AT.frm = atMk(480, 360)); f.getContext('2d').drawImage(AT.comp, 0, 0, 480, 360);
  const b = await atEnc(f, .7); if (!b) return; send({ t: 'afr', d: await atB64(b) }); AT.fc++;
}
async function atFinish(auto) {
  if (AT.done && !auto) return; if (AT.stroke) atStrokeEnd(); if (AT.fl) atFloatCommit();
  AT.done = true; atWaitUI(); AT.capDirty = true; await atCapture(); AT.done = true;
  atCompose(AT.comp, null);
  let b = await atEnc(AT.comp, .9);
  if (b.size > 700e3) b = await atEnc(AT.comp, .78);
  if (b.size > 720e3) { const t = atMk(1200, 900); t.getContext('2d').drawImage(AT.comp, 0, 0, 1200, 900); b = await atEnc(t, .8); }
  send({ t: 'afin', d: await atB64(b) }); try { sfx('pop'); } catch {}
  atSaveNow();
}
// حفظ تلقائي بالجهاز (لو سويت تحديث للصفحة أو طاح النت ترجع رسمتك)
function atIDB() { return new Promise((ok, no) => { const r = indexedDB.open('tarteeb-art', 1); r.onupgradeneeded = () => r.result.createObjectStore('docs'); r.onsuccess = () => ok(r.result); r.onerror = no; }); }
let AT_SVT = 0; function atSaveSoon() { AT.saveDirty = true; clearTimeout(AT_SVT); AT_SVT = setTimeout(atSaveNow, 8000); }
async function atSaveNow() {
  if (!AT.saveDirty || !S || !S.g || S.game !== 'art') return; AT.saveDirty = false;
  try {
    const layers = await Promise.all(AT.layers.map(l => new Promise(ok => l.cv.toBlob(b => ok({ name: l.name, op: l.op, vis: l.vis, blend: l.blend, clip: l.clip, lock: l.lock, b }), 'image/png'))));
    const db = await atIDB(), tx = db.transaction('docs', 'readwrite'); tx.objectStore('docs').put({ t: Date.now(), layers, bg: AT.bg, cur: AT.cur }, S.code + ':' + S.g.key);
    tx.objectStore('docs').getAllKeys().onsuccess = e => { const ks = e.target.result; if (ks.length > 3) ks.filter(k => k !== S.code + ':' + S.g.key).slice(0, ks.length - 3).forEach(k => tx.objectStore('docs').delete(k)); };
  } catch (e) { console.warn('art save', e); }
}
async function atRestore() {
  try {
    const db = await atIDB(), key = S.code + ':' + S.g.key;
    const v = await new Promise(ok => { const q = db.transaction('docs').objectStore('docs').get(key); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); });
    if (!v || !v.layers || !v.layers.length) return;
    AT.layers = await Promise.all(v.layers.map(async x => { const l = atLayer(x.name); Object.assign(l, { op: x.op, vis: x.vis, blend: x.blend, clip: x.clip, lock: x.lock }); if (x.b) { const im = await createImageBitmap(x.b); l.g.drawImage(im, 0, 0); im.close && im.close(); } return l; }));
    AT.bg = v.bg || '#ffffff'; AT.cur = atClamp(v.cur || 0, 0, AT.layers.length - 1); AT.undo = []; AT.redo = []; atRecomp(); atUIUndo(); atToast('رجّعت رسمتك المحفوظة');
  } catch (e) { console.warn('art restore', e); }
}

// ===== الانتظار بعد «انتهيت» + المتفرجين: شبكة رسومات الكل وهم يرسمون =====
function atWaitUI() {
  const w = document.getElementById('atWait'); if (!w || !S.g) return; const g = S.g;
  if (!AT.done && !S.spec) { w.hidden = true; return; }
  w.hidden = false;
  const ids = S.players.filter(p => !p.bot).map(p => p.id), done = ids.filter(id => g.st[id] && g.st[id].done).length;
  const head = S.spec ? `<b>يرسمون الحين</b><small>${atNum(done)} من ${atNum(ids.length)} خلصوا</small>` : g.sub === 'collect' ? '<b>الأونر أنهى الرسم</b><small>نجمع الرسومات…</small>' : `<b>خلّصت رسمتك</b><small>ننتظر الباقين · ${atNum(done)} من ${atNum(ids.length)} خلصوا</small>`;
  const sig = ids.map(id => id + ':' + (g.st[id] ? g.st[id].c + (g.st[id].done ? 'd' : '') : 0)).join('|') + g.sub + AT.done;
  if (w.dataset.sig === sig) return; w.dataset.sig = sig;
  w.innerHTML = `<div class="atwbox">${head}<div class="atgrid">${ids.map(id => { const p = S.players.find(q => q.id === id), s = g.st[id]; return `<figure><div>${s && s.c ? `<img src="/art/${S.code}/${g.key}/${encodeURIComponent(id)}/last?n=${s.c}" alt="">` : '<i>لسه ما بدأ</i>'}</div><figcaption>${esc(p ? p.name : '')}${s && s.done ? ' <em>خلص</em>' : ''}</figcaption></figure>`; }).join('')}</div>
    ${!S.spec && g.sub === 'draw' ? '<button class="atbtn" id="atBack">رجعت أرسم</button>' : ''}${atHost() && g.sub === 'draw' ? '<button class="atbtn ok" id="atEndAll">اعرض الرسومات الحين</button>' : ''}</div>`;
  const bk = document.getElementById('atBack'); if (bk) bk.onclick = () => { AT.done = false; send({ t: 'aback' }); w.hidden = true; w.dataset.sig = ''; };
  const ea = document.getElementById('atEndAll'); if (ea) ea.onclick = () => { if (confirm('تنهي الرسم للكل وتبدأ العرض؟')) send({ t: 'aend' }); };
}

// ===== العرض: رسمة رسمة مع مقطع التسريع =====
const ATV = { tl: {}, cur: null, raf: 0 };
async function atLoadTl(pid) {
  if (ATV.tl[pid]) return ATV.tl[pid];
  const g = S.g, base = `/art/${S.code}/${g.key}/${encodeURIComponent(pid)}/`;
  const P = (async () => {
    const r = await fetch(base + 'tl'), buf = new Uint8Array(await r.arrayBuffer()), fr = []; let i = 0;
    while (i + 4 <= buf.length) { const n = (buf[i] << 24 | buf[i + 1] << 16 | buf[i + 2] << 8 | buf[i + 3]) >>> 0; i += 4; fr.push(new Blob([buf.subarray(i, i + n)])); i += n; }
    const fin = await (await fetch(base + 'final')).blob();
    return { fr, fin };
  })();
  ATV.tl[pid] = P; return P;
}
function atShowUI(body) {
  const g = S.g, over = S.phase === 'over' || g.sub === 'over', host = atHost();
  if (!body.querySelector('.atshow')) body.innerHTML = '<div class="atshow" id="atShow"></div>';
  const box = document.getElementById('atShow');
  if (over && ATV.view == null) { // الآخر: معرض كل الرسومات
    const sig = 'grid' + g.order.join(); if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    box.innerHTML = `<div class="atvh"><h2>معرض الرسومات</h2><span><button class="atbtn" id="atLeave">اطلع</button>${atHost() && !S.spec ? ' <button class="atbtn ok" id="atLobby">رجوع للوبي</button>' : ''}</span></div><div class="atgal">${g.order.map((id, i) => { const p = S.players.find(q => q.id === id); return `<button data-i="${i}"><img src="/art/${S.code}/${g.key}/${encodeURIComponent(id)}/final" alt=""><span>${esc(p ? p.name : 'لاعب')}</span></button>`; }).join('')}</div>`;
    box.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { ATV.view = +b.dataset.i; box.dataset.sig = ''; atShowUI(body); });
    document.getElementById('atLeave').onclick = () => document.getElementById('leave2b').click();
    const lb = document.getElementById('atLobby'); if (lb) lb.onclick = () => send({ t: 'again' });
    return;
  }
  if (over && !g.order.length) { box.innerHTML = '<h2>محد رسم شي</h2>'; return; }
  const i = over ? ATV.view : g.i, pid = g.order[i], p = S.players.find(q => q.id === pid), sig = 'v' + i + pid + over + host;
  if (box.dataset.sig === sig) return; box.dataset.sig = sig;
  box.innerHTML = `<div class="atvh"><h2>رسمة <span>${esc(p ? p.name : 'لاعب')}</span></h2><small>${atNum(i + 1)} من ${atNum(g.order.length)}</small></div>
    <div class="atstage"><canvas id="atPlay" width="1200" height="900"></canvas><div class="atload" id="atLoad">نجهّز التسريع…</div></div>
    <div class="atctl"><button class="atbtn" id="atRe">${atIcon('play')} أعد التسريع</button><div class="atprog" id="atProg"><i></i></div><small id="atTm"></small></div>
    <div class="atctl"><button class="atbtn" id="atImg">${atIcon('down')} الصورة</button><button class="atbtn" id="atVid">${atIcon('down')} فيديو التسريع</button>
      ${over ? '<button class="atbtn" id="atGrid">كل الرسومات</button>' : ''}
      ${host && !over ? `<span class="atsp"></span><button class="atbtn" id="atPrev"${i ? '' : ' disabled'}>السابقة</button>${i < g.order.length - 1 ? '<button class="atbtn ok" id="atNext">التالية</button>' : '<button class="atbtn ok" id="atEnd">خلصنا</button>'}` : over ? `<span class="atsp"></span><button class="atbtn" id="atPrev"${i ? '' : ' disabled'}>السابقة</button><button class="atbtn" id="atNext"${i < g.order.length - 1 ? '' : ' disabled'}>التالية</button>` : '<span class="atsp"></span><small>الأونر يقلّب الرسومات</small>'}</div>`;
  const go = k => over ? (ATV.view = k, atShowUI(body)) : send({ t: 'ago', i: k });
  const $$ = id => document.getElementById(id);
  if ($$('atPrev')) $$('atPrev').onclick = () => go(i - 1);
  if ($$('atNext')) $$('atNext').onclick = () => go(i + 1);
  if ($$('atEnd')) $$('atEnd').onclick = () => send({ t: 'adone' });
  if ($$('atGrid')) $$('atGrid').onclick = () => { ATV.view = null; box.dataset.sig = ''; atShowUI(body); };
  $$('atImg').onclick = async () => { const d = await atLoadTl(pid); atDownload(d.fin, `tarteeb-drawing-${i + 1}.${d.fin.type.includes('jpeg') ? 'jpg' : d.fin.type.includes('png') ? 'png' : 'webp'}`); };
  $$('atVid').onclick = () => atVideo(pid, p ? p.name : '');
  $$('atRe').onclick = () => atPlay(pid);
  try { sfx('pop'); } catch {}
  atPlay(pid);
}
// تشغيل التسريع: اللقطات ورا بعض (~١٢ ثانية) وبعدين الرسمة كاملة
async function atPlay(pid) {
  cancelAnimationFrame(ATV.raf); const tok = ATV.tok = {};
  const d = await atLoadTl(pid); if (ATV.tok !== tok) return;
  const cv = document.getElementById('atPlay'); if (!cv) return; const g = cv.getContext('2d'), ld = document.getElementById('atLoad'); if (ld) ld.hidden = true;
  const fin = await createImageBitmap(d.fin), n = d.fr.length, dur = Math.min(14000, Math.max(3000, n * 70)), t0 = performance.now(), mins = S.g.mins;
  const bm = new Map(); const get = k => { if (!bm.has(k) && k < n) bm.set(k, createImageBitmap(d.fr[k]).catch(() => null)); return bm.get(k); };
  for (let k = 0; k < Math.min(6, n); k++) get(k);
  let shown = -1;
  const tick = async () => {
    if (ATV.tok !== tok || !document.getElementById('atPlay')) return;
    const t = performance.now() - t0, f = Math.min(1, t / dur), k = Math.min(n - 1, Math.floor(f * n));
    const pr = document.getElementById('atProg'); if (pr) pr.firstChild.style.width = (f * 100) + '%';
    const tm = document.getElementById('atTm'); if (tm) tm.textContent = mins ? `${atNum(mins)} دقيقة ← ${atNum(Math.round(dur / 1000))} ثانية` : '';
    if (n && k !== shown) { const im = await get(k); for (let j = k + 1; j < k + 6; j++) get(j); if (im && ATV.tok === tok) { g.drawImage(im, 0, 0, 1200, 900); shown = k; } }
    if (f < 1 && n) ATV.raf = requestAnimationFrame(tick);
    else { g.globalAlpha = 1; for (let a = 0; a <= 1; a += .1) { g.globalAlpha = a; g.drawImage(fin, 0, 0, 1200, 900); await new Promise(r => setTimeout(r, 25)); } g.globalAlpha = 1; }
  };
  if (!n) g.drawImage(fin, 0, 0, 1200, 900); else tick();
}
// فيديو التسريع (يتسجّل بالمتصفح)
async function atVideo(pid, name) {
  if (!window.MediaRecorder) return toast('جهازك ما يدعم تسجيل الفيديو، نزّل الصورة');
  const btn = document.getElementById('atVid'); if (btn.disabled) return; btn.disabled = true; const lbl = btn.innerHTML;
  try {
    const d = await atLoadTl(pid), cv = atMk(960, 720), g = cv.getContext('2d'), fin = await createImageBitmap(d.fin);
    const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'], mt = types.find(t => MediaRecorder.isTypeSupported(t));
    if (!mt) throw new Error('no type');
    const fps = 30, stream = cv.captureStream(fps), rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 5e6 }), parts = [];
    rec.ondataavailable = e => e.data.size && parts.push(e.data);
    const doneP = new Promise(ok => rec.onstop = ok);
    const mark = () => { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 676, 960, 44); g.fillStyle = '#fff'; g.font = '800 22px Tajawal, sans-serif'; g.textAlign = 'center'; g.fillText(`رسمة ${name} · مرسم ترتيب`, 480, 706); };
    g.fillStyle = '#fff'; g.fillRect(0, 0, 960, 720); rec.start(250);
    const n = d.fr.length, total = Math.min(14, Math.max(3, n * .07)) * fps;
    for (let f = 0; f < total; f++) { const k = Math.min(n - 1, Math.floor(f / total * n)); if (n) { const im = await createImageBitmap(d.fr[k]); g.drawImage(im, 0, 0, 960, 720); im.close && im.close(); } mark(); btn.textContent = `نجهّز الفيديو ${atNum(Math.round(f / total * 100))}٪`; await new Promise(r => setTimeout(r, 1000 / fps)); }
    for (let f = 0; f < fps * 2.5; f++) { g.drawImage(fin, 0, 0, 960, 720); mark(); await new Promise(r => setTimeout(r, 1000 / fps)); }
    rec.stop(); await doneP;
    atDownload(new Blob(parts, { type: mt.split(';')[0] }), `tarteeb-timelapse-${Date.now() % 100000}.${mt.includes('mp4') ? 'mp4' : 'webm'}`);
  } catch (e) { console.warn(e); toast('ما قدرت أسوي الفيديو، نزّل الصورة'); }
  btn.disabled = false; btn.innerHTML = lbl;
}

// ===== من السيرفر =====
function net_art(m) {
  if (m.k === 'collect' && S && S.g && !S.spec && !AT.done && document.getElementById('atStudio')) { atToast('الأونر أنهى الرسم، نرسل رسمتك'); atFinish(true); }
}
function renderArt(body) {
  const g = S.g; if (!g) return;
  if (g.sub === 'draw' || g.sub === 'collect') {
    if (S.spec) { // المتفرج: يشوف الكل وهم يرسمون
      if (!body.querySelector('#atSpec')) body.innerHTML = '<div class="atstudio atspec" id="atSpec"><div class="atwait" id="atWait"></div></div>';
      AT.done = true; atWaitUI(); return;
    }
    if (body.dataset.built !== 'art' || !document.getElementById('atStudio') || AT.key !== g.key) { body.dataset.built = 'art'; AT.key = g.key; atBuild(body); }
    const ids = S.players.filter(p => !p.bot).map(p => p.id), done = ids.filter(id => g.st[id] && g.st[id].done).length;
    const mid = document.getElementById('atMid'); if (mid) mid.innerHTML = `${g.theme ? `<b>${esc(g.theme)}</b>` : '<b>مرسم ترتيب</b>'}<small>${ids.length > 1 ? `${atNum(done)} من ${atNum(ids.length)} خلصوا` : 'ارسم براحتك'}</small>`;
    if (g.st[S.me] && g.st[S.me].done && !AT.done) AT.done = true; // رجع للصفحة بعد ما خلص
    if (g.sub === 'collect' && !AT.done) atFinish(true);
    atWaitUI();
    return;
  }
  // العرض
  AT.on = false; body.dataset.built = 'artshow';
  if (S.phase !== 'over') ATV.view = null;
  atShowUI(body);
}
