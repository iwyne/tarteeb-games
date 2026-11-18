// ================= مطاردة (سيارات) =================
const CA = { me: null, oth: {}, keys: {}, joy: null, sent: 0, loop: false, lt: 0, spawnK: -1, skid: [], fx: [], shake: 0, bg: null, boostUntil: 0, boostAt: 0, freezeEnd: 0, endAt: 0, cam: null, snapAll: true, big: 0, lastSec: -1 };
const cg = () => S && S.game === 'cars' && S.g;
const KCOL = ['#e8362d', '#2a5bd7', '#ffc928', '#1fa35c', '#ff7a1a', '#9b59d0', '#19b5c9', '#ef6fae', '#f3ead8', '#5b5f6b', '#c81c1c', '#557fe6', '#649c16', '#ed82df', '#2db7a0', '#d8a263', '#3e238e', '#90e28c', '#d41152', '#4bb2f0', '#98a50d', '#da7af4', '#39ac72', '#ce816d', '#2c3485', '#aedb93', '#c81c8f', '#55e1e6', '#9c7a16', '#b282ed', '#2db744', '#d86372', '#23508e', '#c9e28c', '#d311d4', '#4bf0bf', '#a54c0d', '#897af4', '#4cac39', '#ce6d9a', '#2c6f85', '#dbd893'];
const KROOF = ['#efe0bf', '#c8553d', '#2f8f83', '#f2b134', '#7d6aa8'];
const kName = id => { const p = S.players.find(q => q.id === id); return p ? p.name : '؟'; };
const kNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

window.net_cars = m => {
  const g = cg(); if (!g) return;
  if (m.k === 'pos') {
    m.p.forEach(([id, x, y, a, f, v]) => {
      if (id === S.me && CA.me && !S.spec) { CA.srv = [x, y]; return; }
      let o = CA.oth[id];
      if (!o || CA.snapAll) o = CA.oth[id] = { x, y, a: a / 100 };
      o.tx = x; o.ty = y; o.ta = a / 100; o.f = f; o.v = v;
    });
    CA.snapAll = false;
  } else if (m.k === 'snap') {
    if (CA.me) { CA.me.x = m.x; CA.me.y = m.y; CA.me.a = m.a; CA.me.v = 0; }
  } else if (m.k === 'catch') {
    const v = m.who === S.me && CA.me ? CA.me : CA.oth[m.who];
    if (v) for (let i = 0; i < 18; i++) CA.fx.push({ x: v.x, y: v.y, vx: (Math.random() - .5) * 420, vy: (Math.random() - .5) * 420, t: 0, life: .6 + Math.random() * .4, c: i % 3 ? '#ffc928' : '#e8362d' });
    if (v) CA.fx.push({ ring: 1, x: v.x, y: v.y, t: 0, life: .5 });
    sfx('catch');
    if (m.who === S.me) { CA.shake = 1; kBig('💥 انصدت! صرت صياد 🚨', 'bad'); setTimeout(() => sfx('siren'), 300); }
    else if (m.by === S.me) { CA.shake = .4; kBig('صدته! +١٥ 🎯', 'good'); }
  }
};

function kBig(t, k) { const el = $('#kBig'); if (!el) return; el.textContent = t; el.className = 'kbig ' + (k || ''); el.hidden = false; clearTimeout(CA.big); CA.big = setTimeout(() => { el.hidden = true; }, 1800); }

function carsBuild(body) {
  body.dataset.built = 'cars';
  CA.me = null; CA.oth = {}; CA.skid = []; CA.fx = []; CA.spawnK = -1; CA.snapAll = true; CA.bg = null; CA.cam = null;
  body.innerHTML = `<div class="carw" id="carW">
    <canvas id="kCv"></canvas>
    <div class="ktop"><span class="kchip" id="kRound"></span><span class="kchip ktime" id="kTime">--</span><span class="kchip krole" id="kRole"></span><span class="kchip kpts" id="kPts"></span></div>
    <ol class="kboard" id="kBoard"></ol>
    <div class="kfeed" id="kFeed"></div>
    <canvas class="kmini" id="kMini" width="176" height="112"></canvas>
    <button type="button" class="kboost" id="kBoost" title="نيترو (مسافة)">⚡<b>نيترو</b><i></i></button>
    <div id="kJoy" class="sjoy" hidden><i></i></div>
    <div id="kIntro" class="kfull" hidden></div>
    <div id="kRes" class="kfull" hidden></div>
    <div id="kBig" class="kbig" hidden></div>
    <p class="khelp" id="kHelp">${isMob() ? 'اسحب بإصبعك عشان تسوق' : 'الأسهم أو WASD للسواقة · مسافة نيترو'}</p>
  </div>`;
  const cv = $('#kCv');
  cv.addEventListener('pointerdown', e => { if (!cg()) return; cv.setPointerCapture(e.pointerId); CA.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; kJoyDraw(); const h = $('#kHelp'); if (h) h.hidden = true; });
  cv.addEventListener('pointermove', e => { const j = CA.joy; if (!j || j.id !== e.pointerId) return; let dx = e.clientX - j.ox, dy = e.clientY - j.oy; const d = Math.hypot(dx, dy); if (d > 60) { dx *= 60 / d; dy *= 60 / d; } j.dx = dx; j.dy = dy; kJoyDraw(); });
  const up = e => { if (CA.joy && CA.joy.id === e.pointerId) { CA.joy = null; kJoyDraw(); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  $('#kBoost').addEventListener('pointerdown', e => { e.preventDefault(); kBoost(); });
}
function kJoyDraw() {
  const j = CA.joy, el = $('#kJoy'); if (!el) return; el.hidden = !j; if (!j) return;
  const w = $('#carW').getBoundingClientRect(); el.style.left = (j.ox - w.left) + 'px'; el.style.top = (j.oy - w.top) + 'px';
  el.firstChild.style.transform = `translate(${j.dx}px,${j.dy}px)`;
}
function kBoost() {
  const g = cg(); if (!g || g.sub !== 'play' || !CA.me || S.spec || S.phase !== 'play') return;
  const now = performance.now(); if (now < CA.boostAt + CARMAP.BOOST_CD || now < CA.freezeEnd) return;
  CA.boostAt = now; CA.boostUntil = now + CARMAP.BOOST_MS; send({ t: 'boost' }); sfx('whoosh');
}
addEventListener('keydown', e => {
  if (!cg() || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'ص', 'ش', 'س', 'ي'].includes(k)) { CA.keys[k] = 1; e.preventDefault(); }
  if (k === ' ' || k === 'shift') { e.preventDefault(); if (!e.repeat) kBoost(); }
});
addEventListener('keyup', e => { delete CA.keys[e.key.toLowerCase()]; });
addEventListener('blur', () => { CA.keys = {}; });

// خلفية المدينة: نرسمها مرة وحدة بصورة جاهزة
function kBackground() {
  const M = CARMAP, q = isMob() ? .6 : 1, c = document.createElement('canvas');
  c.width = M.W * q; c.height = M.H * q; const x = c.getContext('2d'); x.scale(q, q);
  x.fillStyle = '#3a3c43'; x.fillRect(0, 0, M.W, M.H);
  // حبيبات الإسفلت
  x.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 2600; i++) x.fillRect(Math.random() * M.W, Math.random() * M.H, 3, 3);
  // خطوط الشوارع
  x.strokeStyle = 'rgba(243,234,216,.55)'; x.lineWidth = 5; x.setLineDash([30, 26]);
  [[0, 70, M.W, 70], [0, 700, M.W, 700], [0, 1330, M.W, 1330], [70, 0, 70, M.H], [610, 0, 610, M.H], [1590, 0, 1590, M.H], [2130, 0, 2130, M.H], [1100, 0, 1100, 560], [1100, 840, 1100, M.H]].forEach(([a, b, c2, d]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); });
  x.setLineDash([]);
  // ممرات مشاة عند التقاطعات
  x.fillStyle = 'rgba(243,234,216,.45)';
  [[610, 575], [610, 825], [1590, 575], [1590, 825]].forEach(([cx, cy]) => { for (let i = -3; i <= 3; i++) x.fillRect(cx - 80 + (i + 3) * 24, cy - 9, 12, 18); });
  // الرصيف حول البلوكات
  const blocks = M.B.map(b => b.slice(0, 4)).concat(M.PARKS);
  x.fillStyle = '#9b968c'; blocks.forEach(([bx, by, bw, bh]) => { x.beginPath(); x.roundRect(bx - 14, by - 14, bw + 28, bh + 28, 18); x.fill(); });
  x.fillStyle = '#b8b2a5'; blocks.forEach(([bx, by, bw, bh]) => { x.beginPath(); x.roundRect(bx - 8, by - 8, bw + 16, bh + 16, 12); x.fill(); });
  // الحدايق
  M.PARKS.forEach(([bx, by, bw, bh]) => {
    x.fillStyle = '#4c9a52'; x.beginPath(); x.roundRect(bx, by, bw, bh, 10); x.fill();
    x.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < bw; i += 36) x.fillRect(bx + i, by, 18, bh);
    x.strokeStyle = '#e7d7a8'; x.lineWidth = 14; x.beginPath(); x.moveTo(bx + 20, by + bh / 2); x.bezierCurveTo(bx + bw * .4, by + 20, bx + bw * .6, by + bh - 20, bx + bw - 20, by + bh / 2); x.stroke();
  });
  // المباني: ظل وسطح وتفاصيل
  M.B.forEach(([bx, by, bw, bh, k], i) => {
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.roundRect(bx + 12, by + 14, bw, bh, 10); x.fill();
    x.fillStyle = KROOF[k]; x.strokeStyle = '#16130f'; x.lineWidth = 5; x.beginPath(); x.roundRect(bx, by, bw, bh, 10); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 3; x.beginPath(); x.roundRect(bx + 14, by + 14, bw - 28, bh - 28, 6); x.stroke();
    // مكيفات وخزانات على السطح
    x.fillStyle = 'rgba(255,255,255,.55)'; x.strokeStyle = '#16130f'; x.lineWidth = 2.5;
    for (let j = 0; j < 3; j++) { const ax = bx + 28 + ((i * 53 + j * 71) % Math.max(20, bw - 80)), ay = by + 28 + ((i * 37 + j * 59) % Math.max(20, bh - 80)); x.beginPath(); x.roundRect(ax, ay, 30, 22, 4); x.fill(); x.stroke(); }
    if (i === 3) { x.fillStyle = '#16130f'; x.beginPath(); x.arc(bx + bw / 2, by + bh / 2, 46, 0, 7); x.fill(); x.strokeStyle = '#ffc928'; x.lineWidth = 6; x.beginPath(); x.arc(bx + bw / 2, by + bh / 2, 38, 0, 7); x.stroke(); x.fillStyle = '#ffc928'; x.font = '900 48px Tajawal,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('H', bx + bw / 2, by + bh / 2 + 3); }
  });
  // الدوّار
  const [rx, ry, rr] = M.ROUND;
  x.fillStyle = '#b8b2a5'; x.beginPath(); x.arc(rx, ry, rr + 10, 0, 7); x.fill();
  x.fillStyle = '#4c9a52'; x.strokeStyle = '#16130f'; x.lineWidth = 4; x.beginPath(); x.arc(rx, ry, rr - 2, 0, 7); x.fill(); x.stroke();
  x.fillStyle = '#e8362d'; x.beginPath(); x.arc(rx, ry, 30, 0, 7); x.fill(); x.stroke();
  x.fillStyle = '#fffaf0'; x.font = '900 26px Lalezar,Tajawal,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ت', rx, ry + 2);
  // النخل
  M.TREES.forEach(([tx, ty]) => kPalm(x, tx, ty, 30));
  // السور
  x.strokeStyle = '#16130f'; x.lineWidth = 12; x.strokeRect(6, 6, M.W - 12, M.H - 12);
  x.strokeStyle = '#ffc928'; x.lineWidth = 6; x.setLineDash([40, 40]); x.strokeRect(6, 6, M.W - 12, M.H - 12); x.setLineDash([]);
  return { c, q };
}
function kPalm(x, cx, cy, r) {
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.arc(cx + 8, cy + 10, r, 0, 7); x.fill();
  x.fillStyle = '#1f6e3a'; x.strokeStyle = '#16130f'; x.lineWidth = 3;
  x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, rr = i % 2 ? r * .45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#7a4a22'; x.beginPath(); x.arc(cx, cy, r * .22, 0, 7); x.fill();
}

function kCar(x, cx, cy, a, col, o) {
  x.save(); x.translate(cx, cy); x.rotate(a);
  const t = o.t;
  if (o.hunter) {
    // إنارة الشرطة على الأرض
    const blue = Math.floor(t * 6) % 2;
    const gr = x.createRadialGradient(0, 0, 4, 0, 0, 90); gr.addColorStop(0, blue ? 'rgba(60,120,255,.45)' : 'rgba(255,50,40,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(0, 0, 90, 0, 7); x.fill();
  }
  if (o.boost) {
    for (let i = 0; i < 2; i++) { const fl = 18 + Math.random() * 22; x.fillStyle = i ? '#ffc928' : '#ff6a1a'; x.beginPath(); x.moveTo(-24, -7 + i * 4); x.lineTo(-24 - fl * (i ? .6 : 1), -1 + i * 1); x.lineTo(-24, 7 - i * 4); x.fill(); }
  }
  x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.roundRect(-22, -11, 50, 28, 8); x.fill();
  // العجلات
  x.fillStyle = '#16130f'; [[-16, -15], [10, -15], [-16, 11], [10, 11]].forEach(([wx, wy]) => { x.beginPath(); x.roundRect(wx, wy, 12, 5, 2); x.fill(); });
  x.fillStyle = col; x.strokeStyle = '#16130f'; x.lineWidth = 3;
  x.beginPath(); x.roundRect(-25, -13, 50, 26, 8); x.fill(); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.roundRect(-22, -11, 44, 6, 3); x.fill();
  // الكابينة والزجاج
  x.fillStyle = '#1d2330'; x.beginPath(); x.roundRect(-9, -10, 20, 20, 5); x.fill();
  x.fillStyle = 'rgba(160,200,255,.55)'; x.beginPath(); x.roundRect(6, -8, 5, 16, 2); x.fill();
  // أنوار
  x.fillStyle = '#fff6c2'; x.fillRect(21, -10, 4, 5); x.fillRect(21, 5, 4, 5);
  x.fillStyle = '#ff3b30'; x.fillRect(-25, -10, 3, 5); x.fillRect(-25, 5, 3, 5);
  if (o.hunter) { const blue = Math.floor(t * 6) % 2; x.fillStyle = blue ? '#e8362d' : '#4d8bff'; x.fillRect(-4, -10, 6, 10); x.fillStyle = blue ? '#4d8bff' : '#e8362d'; x.fillRect(-4, 0, 6, 10); x.strokeStyle = '#16130f'; x.lineWidth = 2; x.strokeRect(-4, -10, 6, 20); }
  x.restore();
}

function renderCars(body) {
  if (body.dataset.built !== 'cars' || !$('#kCv')) carsBuild(body);
  const g = S.g, over = S.phase === 'over', now = performance.now();
  if (g.me && g.spawnK !== CA.spawnK) { CA.spawnK = g.spawnK; CA.me = { x: g.me.x, y: g.me.y, a: g.me.a, v: 0 }; CA.snapAll = true; CA.skid = []; CA.boostAt = -1e9; CA.boostUntil = 0; CA.cam = null; }
  if (!g.me) CA.me = null;
  CA.freezeEnd = g.me && g.me.freeze ? now + g.me.freeze : 0;
  CA.endAt = g.sub === 'play' ? now + g.left : 0;
  if (!CA.loop) { CA.loop = true; CA.lt = performance.now(); requestAnimationFrame(kFrame); }
  const me = g.me, hunter = me && me.role === 'h';
  $('#kRound').textContent = `الجولة ${kNum(g.round)}/${kNum(g.rounds)}`;
  const rl = $('#kRole'); rl.textContent = !me ? 'تتفرّج 👁' : hunter ? '🚨 صيّاد' : '🏃 هارب'; rl.className = 'kchip krole ' + (!me ? '' : hunter ? 'h' : 'r');
  $('#kPts').textContent = me && g.cars[S.me] ? `${kNum(g.cars[S.me].pts)} نقطة` : '';
  const L = Object.entries(g.cars).sort((a, b) => b[1].pts - a[1].pts);
  $('#kBoard').innerHTML = L.slice(0, 6).map(([id, c], i) => `<li class="${id === S.me ? 'me' : ''}${c.role === 'h' ? ' h' : ''}"><i style="background:${KCOL[c.c]}"></i><span>${esc(kName(id))}</span><b>${kNum(c.pts)}</b>${c.role === 'h' ? '🚨' : ''}</li>`).join('');
  $('#kFeed').innerHTML = (g.feed || []).slice(-3).map(([a, b]) => `<div>🚨 <b>${esc(kName(a))}</b> صاد <b>${esc(kName(b))}</b></div>`).join('');
  // شاشة البداية
  const intro = $('#kIntro'); intro.hidden = !(g.sub === 'intro' && !over);
  if (!intro.hidden && intro.dataset.k !== String(g.round)) {
    intro.dataset.k = String(g.round);
    const hs = L.filter(([, c]) => c.role === 'h').map(([id]) => id);
    intro.innerHTML = `<div class="kcard ${hunter ? 'h' : 'r'}"><small>الجولة ${kNum(g.round)} من ${kNum(g.rounds)}</small><h2>${!me ? '👁 تتفرّج' : hunter ? '🚨 أنت الصياد!' : '🏃 اهرب!'}</h2><p>${!me ? '' : hunter ? 'اصدم الهاربين قبل ما يخلص الوقت. كل صيدة +١٥ واللي تصيده ينضم لك.' : 'لا يصدمك الصياد! كل ثانية تعيشها نقطة، ولو نجيت للنهاية +٢٠.'}</p><div class="khs">${hs.map(id => `<span style="--c:${KCOL[g.cars[id].c]}">🚨 ${esc(kName(id))}</span>`).join('')}</div></div>`;
    sfx(hunter ? 'siren' : 'whistle');
  }
  // النتيجة
  const res = $('#kRes'), showRes = (g.sub === 'res' && g.res) || over;
  res.hidden = !showRes;
  if (showRes) {
    const k = (over ? 'over' : 'r' + g.round) + JSON.stringify(g.res && g.res.rp);
    if (res.dataset.k !== k) {
      res.dataset.k = k;
      const surv = new Set(g.res ? g.res.surv : []);
      res.innerHTML = `<div class="kcard res"><h2>${over ? `🏆 ${esc(S.winner || '')}` : `نهاية الجولة ${kNum(g.round)}`}</h2>${!over && g.res ? `<p>${g.res.surv.length ? 'نجا ' + g.res.surv.map(id => esc(kName(id))).join('، ') + ' 🏁' : 'الصيادين صادوا الكل! 🚨'}</p>` : ''}
        <table class="ktbl"><tr><th></th><th>هالجولة</th><th>المجموع</th></tr>${L.map(([id, c], i) => `<tr class="${id === S.me ? 'me' : ''}"><td><i style="background:${KCOL[c.c]}"></i>${i === 0 ? '👑 ' : ''}${esc(kName(id))}${surv.has(id) ? ' 🏁' : ''}</td><td>+${kNum(c.rp)}</td><td><b>${kNum(c.pts)}</b></td></tr>`).join('')}</table>
        ${over ? '' : `<small>${g.round < g.rounds ? 'الجولة الجاية بعد شوي…' : 'النتيجة النهائية بعد شوي…'}</small>`}</div>`;
      if (over) sfx('win');
    }
  }
  $('#kBoost').hidden = !me || over;
}

function kFrame(t) {
  const g = cg();
  if (!g || S.phase === 'lobby' || !$('#kCv')) { CA.loop = false; return; }
  requestAnimationFrame(kFrame);
  const dt = Math.min(.05, (t - CA.lt) / 1000); CA.lt = t;
  const M = CARMAP, me = CA.me, gm = g.me, playing = g.sub === 'play' && S.phase === 'play';
  // السواقة
  if (me && gm && playing && !S.spec) {
    let ix = 0, iy = 0; const K = CA.keys;
    if (K.arrowleft || K.a || K['ش']) ix--; if (K.arrowright || K.d || K['ي']) ix++;
    if (K.arrowup || K.w || K['ص']) iy--; if (K.arrowdown || K.s || K['س']) iy++;
    if (CA.joy && Math.hypot(CA.joy.dx, CA.joy.dy) > 8) { ix = CA.joy.dx / 60; iy = CA.joy.dy / 60; }
    if (window.PAD && PAD.mode === 'cars' && (PAD.lx || PAD.ly)) { ix = PAD.lx; iy = PAD.ly; }
    const frozen = t < CA.freezeEnd;
    if (frozen) { me.v = 0; if (Math.hypot(ix, iy) > .2) me.a += Math.atan2(Math.sin(Math.atan2(iy, ix) - me.a), Math.cos(Math.atan2(iy, ix) - me.a)) * Math.min(1, dt * 6); }
    else {
      const a0 = me.a;
      const bump = M.step(me, ix, iy, dt, { hunter: gm.role === 'h', boost: t < CA.boostUntil });
      if (bump && me.v > 120) CA.shake = Math.max(CA.shake, .25);
      const turn = Math.abs(Math.atan2(Math.sin(me.a - a0), Math.cos(me.a - a0))) / dt;
      if (me.v > 180 && turn > 2.2) kSkid(me);
    }
    // تصحيح ناعم لو السيرفر شايفنا بمكان بعيد
    if (CA.srv && Math.hypot(CA.srv[0] - me.x, CA.srv[1] - me.y) > 260) { me.x = CA.srv[0]; me.y = CA.srv[1]; }
    if (!frozen && t - CA.sent > 66) { CA.sent = t; send({ t: 'mv', x: Math.round(me.x * 10) / 10, y: Math.round(me.y * 10) / 10, a: Math.round(me.a * 1000) / 1000, v: me.v | 0 }); }
  }
  // باقي السيارات: تنزلق بنعومة لمكانها
  const k = 1 - Math.exp(-dt * 12);
  for (const id in CA.oth) {
    const o = CA.oth[id]; if (o.tx == null) continue;
    o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k;
    const da = Math.atan2(Math.sin(o.ta - o.a), Math.cos(o.ta - o.a)); o.a += da * k;
    if (o.v > 180 && Math.abs(da) > .25) kSkid(o);
  }
  kDraw(t / 1000, dt);
  // الوقت والنيترو
  const sec = CA.endAt ? Math.max(0, Math.ceil((CA.endAt - t) / 1000)) : -1;
  if (sec !== CA.lastSec) { CA.lastSec = sec; const el = $('#kTime'); if (el) { el.textContent = sec < 0 ? '⏱' : `⏱ ${kNum(sec)}`; el.classList.toggle('low', sec >= 0 && sec <= 10); } if (sec > 0 && sec <= 5) sfx('tick'); }
  const bb = $('#kBoost'); if (bb) { const left = Math.max(0, CA.boostAt + M.BOOST_CD - t); bb.classList.toggle('cd', left > 0); bb.lastChild.style.height = (left / M.BOOST_CD * 100) + '%'; }
}
function kSkid(o) {
  const s = Math.sin(o.a), c = Math.cos(o.a);
  CA.skid.push([o.x - c * 16 - s * 11, o.y - s * 16 + c * 11, o.x - c * 16 + s * 11, o.y - s * 16 - c * 11, 1]);
  if (CA.skid.length > 260) CA.skid.shift();
}

function kDraw(t, dt) {
  const cv = $('#kCv'), box = $('#carW'), M = CARMAP, g = S.g;
  const dpr = Math.min(2, devicePixelRatio || 1) * (isMob() ? .85 : 1), W = box.clientWidth, H = box.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const x = cv.getContext('2d');
  if (!CA.bg) CA.bg = kBackground();
  // الكاميرا: تتبعك، أو تتبع الأول لو تتفرّج
  let fx = M.W / 2, fy = M.H / 2;
  const focus = CA.me || (() => { const L = Object.entries(g.cars).sort((a, b) => b[1].pts - a[1].pts); const o = L.length && CA.oth[L[0][0]]; return o; })();
  if (focus) { fx = focus.x; fy = focus.y; }
  const sc = Math.max(.42, Math.min(1.25, Math.min(W, H) / (W < 600 ? 620 : 700))) * (CA.me ? 1 : .8);
  const lead = CA.me ? Math.min(140, CA.me.v * .35) : 0;
  const want = [fx + (CA.me ? Math.cos(CA.me.a) * lead : 0), fy + (CA.me ? Math.sin(CA.me.a) * lead : 0)];
  if (!CA.cam) CA.cam = want.slice();
  const ck = 1 - Math.exp(-dt * 5); CA.cam[0] += (want[0] - CA.cam[0]) * ck; CA.cam[1] += (want[1] - CA.cam[1]) * ck;
  const vw = W / sc, vh = H / sc;
  let cx = CA.cam[0], cy = CA.cam[1];
  cx = vw >= M.W ? M.W / 2 : Math.max(vw / 2 - 40, Math.min(M.W - vw / 2 + 40, cx));
  cy = vh >= M.H ? M.H / 2 : Math.max(vh / 2 - 40, Math.min(M.H - vh / 2 + 40, cy));
  if (CA.shake > 0) { cx += (Math.random() - .5) * 18 * CA.shake; cy += (Math.random() - .5) * 18 * CA.shake; CA.shake = Math.max(0, CA.shake - dt * 2.5); }
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.fillStyle = '#1b1c20'; x.fillRect(0, 0, W, H);
  x.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * (W / 2 - cx * sc), dpr * (H / 2 - cy * sc));
  x.drawImage(CA.bg.c, 0, 0, M.W, M.H);
  // آثار الكفرات
  x.strokeStyle = 'rgba(15,15,18,.45)'; x.lineWidth = 4; x.lineCap = 'round';
  CA.skid.forEach(s => { s[4] -= dt * .12; });
  CA.skid = CA.skid.filter(s => s[4] > 0);
  CA.skid.forEach(s => { x.globalAlpha = Math.max(0, s[4]); x.beginPath(); x.arc(s[0], s[1], 2.5, 0, 7); x.arc(s[2], s[3], 2.5, 0, 7); x.fillStyle = 'rgba(15,15,18,.5)'; x.fill(); });
  x.globalAlpha = 1;
  // السيارات
  const cars = [];
  for (const id in g.cars) {
    const c = g.cars[id], o = id === S.me && CA.me ? CA.me : CA.oth[id]; if (!o) continue;
    cars.push({ id, o, c, boost: id === S.me ? performance.now() < CA.boostUntil : !!(o.f & 1) });
  }
  cars.sort((a, b) => (a.c.role === 'h') - (b.c.role === 'h'));
  cars.forEach(({ id, o, c, boost }) => {
    if (id === S.me) { x.strokeStyle = '#ffc928'; x.lineWidth = 4; x.setLineDash([8, 6]); x.beginPath(); x.arc(o.x, o.y, 34, 0, 7); x.stroke(); x.setLineDash([]); }
    const frozen = c.role === 'h' && id === S.me && performance.now() < CA.freezeEnd;
    kCar(x, o.x, o.y, o.a, KCOL[c.c], { t, hunter: c.role === 'h', boost });
    if (frozen) { x.fillStyle = 'rgba(22,19,15,.75)'; x.beginPath(); x.roundRect(o.x - 40, o.y + 24, 80, 24, 12); x.fill(); x.fillStyle = '#ffc928'; x.font = '800 15px Tajawal,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(`انتظر ${kNum(Math.ceil((CA.freezeEnd - performance.now()) / 1000))}`, o.x, o.y + 37); }
  });
  // الأسماء فوق السيارات (ما تلف معها)
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 15px Tajawal,sans-serif';
  cars.forEach(({ id, o, c }) => {
    const n = (c.role === 'h' ? '🚨 ' : '') + kName(id), w = x.measureText(n).width + 16;
    x.fillStyle = c.role === 'h' ? 'rgba(232,54,45,.92)' : 'rgba(22,19,15,.78)'; x.beginPath(); x.roundRect(o.x - w / 2, o.y - 50, w, 22, 11); x.fill();
    x.fillStyle = '#fffaf0'; x.fillText(n, o.x, o.y - 38);
  });
  // مؤثرات الصيد
  CA.fx = CA.fx.filter(f => (f.t += dt) < f.life);
  CA.fx.forEach(f => {
    const p = f.t / f.life;
    if (f.ring) { x.strokeStyle = `rgba(255,201,40,${1 - p})`; x.lineWidth = 8 * (1 - p) + 2; x.beginPath(); x.arc(f.x, f.y, 20 + p * 110, 0, 7); x.stroke(); return; }
    x.fillStyle = f.c; x.globalAlpha = 1 - p; x.beginPath(); x.arc(f.x + f.vx * f.t, f.y + f.vy * f.t, 6 * (1 - p) + 2, 0, 7); x.fill(); x.globalAlpha = 1;
  });
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  // أسهم على طرف الشاشة: وين الصيادين (لو هارب) أو أقرب هارب (لو صياد)
  const meC = CA.me && g.cars[S.me];
  if (meC && S.phase === 'play') {
    const tg = cars.filter(q => q.id !== S.me && (meC.role === 'h' ? q.c.role === 'r' : q.c.role === 'h'));
    let L = tg.map(q => ({ q, d: Math.hypot(q.o.x - CA.me.x, q.o.y - CA.me.y) })).sort((a, b) => a.d - b.d);
    if (meC.role === 'h') L = L.slice(0, 1);
    L.forEach(({ q, d }) => {
      const sx = W / 2 + (q.o.x - cx) * sc, sy = H / 2 + (q.o.y - cy) * sc;
      if (sx > 30 && sx < W - 30 && sy > 30 && sy < H - 30) return;
      if (meC.role === 'r' && d > 1100) return;
      const a = Math.atan2(sy - H / 2, sx - W / 2), m = 34;
      const ex = Math.max(m, Math.min(W - m, W / 2 + Math.cos(a) * W)), ey = Math.max(m + 40, Math.min(H - m, H / 2 + Math.sin(a) * H));
      x.save(); x.translate(ex, ey); x.rotate(a);
      x.fillStyle = meC.role === 'h' ? '#ffc928' : '#e8362d'; x.strokeStyle = '#16130f'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(16, 0); x.lineTo(-10, -12); x.lineTo(-5, 0); x.lineTo(-10, 12); x.closePath(); x.fill(); x.stroke();
      x.restore();
      x.fillStyle = '#fffaf0'; x.font = '800 12px Tajawal,sans-serif'; x.textAlign = 'center'; x.fillText(`${kNum(Math.round(d / 10))}م`, ex - Math.cos(a) * 26, ey - Math.sin(a) * 26);
    });
  }
  kMini(cars);
}
function kMini(cars) {
  const c = $('#kMini'); if (!c) return; const x = c.getContext('2d'), M = CARMAP, s = c.width / M.W;
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = 'rgba(22,19,15,.78)'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = 'rgba(243,234,216,.28)'; M.B.forEach(([bx, by, bw, bh]) => x.fillRect(bx * s, by * s, bw * s, bh * s));
  x.fillStyle = 'rgba(76,154,82,.6)'; M.PARKS.forEach(([bx, by, bw, bh]) => x.fillRect(bx * s, by * s, bw * s, bh * s));
  cars.forEach(({ id, o, c: cc }) => { x.fillStyle = cc.role === 'h' ? '#e8362d' : id === S.me ? '#ffc928' : '#fffaf0'; x.beginPath(); x.arc(o.x * s, o.y * s, id === S.me ? 5 : 3.5, 0, 7); x.fill(); if (id === S.me) { x.strokeStyle = '#16130f'; x.lineWidth = 1.5; x.stroke(); } });
}
