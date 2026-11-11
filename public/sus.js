// واجهة لعبة المندس: رسم السفينة على كانفس، الحركة (أسهم/WASD أو جويستك باللمس)، المهام، الاجتماعات والتصويت
const SCOL = ['#e8362d', '#2a5bd7', '#1f9d55', '#ffc928', '#ff8a1f', '#8a4fd6', '#ff6fae', '#19c3d6', '#8a5a2b', '#f4efe6'];
const SCN = ['أحمر', 'أزرق', 'أخضر', 'أصفر', 'برتقالي', 'بنفسجي', 'وردي', 'سماوي', 'بني', 'أبيض'];
const SR = { USE: 95, KILL: 100, REPORT: 140, BTN: 120, VENT: 80, SPEED: 230, VIS: 340, IMP: 440, DARK: 125 };
const SMIN = { wires: 1500, swipe: 700, nums: 2000, hold: 2000, wait: 4500 };
const STASK = Object.fromEntries(SUSMAP.tasks.map(t => [t.id, t]));
const ROOMTINT = { eng: '#f6dcc4', med: '#d9eef0', caf: '#f3ead8', lab: '#e2e3f7', rea: '#f7d6d1', sec: '#e4e9dc', o2: '#d8f0dd', nav: '#dbe6f7', ele: '#f7efc8', sto: '#ece2d2', shd: '#e6dcf3' };
const SU = { built: false, me: null, oth: {}, bodies: [], keys: {}, joy: null, sent: 0, lastX: 0, lastY: 0, task: null, map: false, fixing: 0, act: {}, stars: [], hud: 0, killedFx: 0 };
for (let i = 0; i < 90; i++) SU.stars.push([Math.random(), Math.random(), Math.random() < .2 ? 2 : 1]);

const sg = () => S && S.game === 'sus' && S.g;
const smeAlive = () => { const g = sg(); return g && g.me && g.me.alive; };
const scol = id => { const g = sg(); return g && g.col[id] != null ? g.col[id] : 0; };
const sname = id => (S.players.find(p => p.id === id) || {}).name || '؟';
const sleft = ms => Math.max(0, ms - (Date.now() - S.t0));

// شخصية الموقع (كرة بعيون وأنتينا) — مو شخصيات اللعبة الأصلية
function guySvg(c, dead) {
  const f = SCOL[c] || SCOL[0];
  return `<svg viewBox="0 0 60 64" class="sguy${dead ? ' dead' : ''}"><path d="M30 13V5" stroke="#16130f" stroke-width="3"/><circle cx="30" cy="5" r="4" fill="${f}" stroke="#16130f" stroke-width="2.5"/>
  <ellipse cx="21" cy="57" rx="7" ry="4" fill="${f}" stroke="#16130f" stroke-width="3"/><ellipse cx="39" cy="57" rx="7" ry="4" fill="${f}" stroke="#16130f" stroke-width="3"/>
  <circle cx="30" cy="35" r="21" fill="${f}" stroke="#16130f" stroke-width="4"/><path d="M15 32a15 15 0 0 1 9-12" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none" stroke-linecap="round"/>
  ${dead ? '<path d="M20 29l6 6m0-6l-6 6M34 29l6 6m0-6l-6 6" stroke="#16130f" stroke-width="3" stroke-linecap="round"/>' : '<ellipse cx="24" cy="32" rx="5" ry="6.5" fill="#fff" stroke="#16130f" stroke-width="2.5"/><ellipse cx="37" cy="32" rx="5" ry="6.5" fill="#fff" stroke="#16130f" stroke-width="2.5"/><circle cx="25" cy="33" r="2.6" fill="#16130f"/><circle cx="38" cy="33" r="2.6" fill="#16130f"/>'}</svg>`;
}

function drawGuy(x, y, c, dir, phase, ghost, ctx) {
  const f = SCOL[c] || SCOL[0], bob = phase ? Math.abs(Math.sin(phase)) * 3 : 0;
  ctx.save(); ctx.translate(x, y - bob);
  if (ghost) ctx.globalAlpha = .5;
  ctx.lineWidth = 4; ctx.strokeStyle = '#16130f'; ctx.lineJoin = 'round';
  // ظل
  ctx.fillStyle = 'rgba(22,19,15,.2)'; ctx.beginPath(); ctx.ellipse(0, 24 + bob, 20, 6, 0, 0, 7); ctx.fill();
  if (!ghost) {
    const s = phase ? Math.sin(phase) * 5 : 0;
    ctx.fillStyle = f;
    ctx.beginPath(); ctx.ellipse(-9 + s, 20, 7, 4.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(9 - s, 20, 7, 4.5, 0, 0, 7); ctx.fill(); ctx.stroke();
  }
  // أنتينا
  ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(dir * 3, -31); ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(dir * 3, -33, 4.5, 0, 7); ctx.fillStyle = f; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
  // الجسم
  ctx.lineWidth = 4; ctx.beginPath();
  if (ghost) { ctx.moveTo(-21, 0); ctx.arc(0, 0, 21, Math.PI, 0); ctx.lineTo(21, 18); for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(15 - i * 10.5, 26 + (i % 2) * -8, 10.5 - i * 10.5, 18); ctx.closePath(); }
  else ctx.arc(0, 0, 21, 0, 7);
  ctx.fillStyle = f; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(dir * -4, -3, 13, Math.PI * 1.05, Math.PI * 1.45); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
  // العيون تطالع باتجاه المشي
  ctx.strokeStyle = '#16130f'; ctx.lineWidth = 2.5;
  [-6, 7].forEach(ex => { ctx.beginPath(); ctx.ellipse(ex + dir * 3, -3, 5, 6.5, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(ex + dir * 5, -2, 2.6, 0, 7); ctx.fillStyle = '#16130f'; ctx.fill(); });
  ctx.restore();
}
function drawBody(x, y, c, ctx) {
  const f = SCOL[c] || SCOL[0];
  ctx.save(); ctx.translate(x, y + 6); ctx.rotate(-.25);
  ctx.lineWidth = 4; ctx.strokeStyle = '#16130f';
  ctx.fillStyle = 'rgba(160,20,20,.35)'; ctx.beginPath(); ctx.ellipse(6, 12, 30, 9, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 4, 24, 13, 0, 0, 7); ctx.fillStyle = f; ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  [[-9, 1], [5, 1]].forEach(([ex, ey]) => { ctx.beginPath(); ctx.moveTo(ex - 4, ey - 4); ctx.lineTo(ex + 4, ey + 4); ctx.moveTo(ex + 4, ey - 4); ctx.lineTo(ex - 4, ey + 4); ctx.stroke(); });
  ctx.restore();
}

// ---------- الشبكة ----------
function susNet(m) {
  if (m.t === 'snap') { SU.me = { x: m.x, y: m.y, dir: SU.me ? SU.me.dir : 1, ph: 0 }; SU.lastX = m.x; SU.lastY = m.y; return; }
  if (m.t === 'sus') { if (m.ev === 'killed') { SU.killedFx = Date.now(); SU.killer = m.by; closeTask(); sfx('bang'); renderSusOverlays(); } return; }
  if (m.t !== 'pos') return;
  const seen = {};
  m.a.forEach(([id, x, y, gh]) => {
    seen[id] = 1;
    if (S && id === S.me) { if (!SU.me) SU.me = { x, y, dir: 1, ph: 0 }; return; }
    const o = SU.oth[id];
    if (!o || Math.hypot(o.x - x, o.y - y) > 260) SU.oth[id] = { x, y, tx: x, ty: y, dir: o ? o.dir : 1, ph: 0, gh };
    else { o.tx = x; o.ty = y; o.gh = gh; }
  });
  Object.keys(SU.oth).forEach(id => { if (!seen[id]) delete SU.oth[id]; });
  SU.bodies = m.b;
}

// ---------- البناء ----------
function susBuild(body) {
  body.dataset.built = 'sus';
  SU.me = null; SU.oth = {}; SU.bodies = []; SU.task = null; SU.map = false;
  body.innerHTML = `<div class="susw" id="susW">
    <canvas id="sCv"></canvas>
    <div class="shud">
      <div class="sprog"><span>مهام الطاقم</span><div class="sbarO"><i id="sProgI"></i></div></div>
      <details class="stasks" id="sTaskBox" open><summary id="sTaskSum">مهامك</summary><div id="sTasks"></div></details>
    </div>
    <div id="sBanner" class="sbanner" hidden></div>
    <div class="sbtns">
      <button type="button" class="sbtn" id="sMapB" title="الخريطة (M)">🗺️<b>الخريطة</b></button>
      <button type="button" class="sbtn imp" id="sSaboB" title="تخريب">⚡<b>تخريب</b><i></i></button>
      <button type="button" class="sbtn imp" id="sVentB" title="فتحة (V)">🕳️<b>فتحة</b></button>
      <button type="button" class="sbtn imp red" id="sKillB" title="اقتل (Q)">🔪<b>اقتل</b><i></i></button>
      <button type="button" class="sbtn red" id="sRepB" title="بلّغ (R)">📢<b>بلّغ</b></button>
      <button type="button" class="sbtn yel" id="sUseB" title="استخدم (E / مسافة)">✋<b>استخدم</b></button>
    </div>
    <div id="sSaboMenu" class="ssabomenu" hidden><button type="button" data-k="lights">💡 طفّ الكهرباء</button><button type="button" data-k="reactor">☢️ فجّر المفاعل</button></div>
    <div id="sJoy" class="sjoy" hidden><i></i></div>
    <div id="sMapBox" class="smapbox" hidden><canvas id="sMapCv"></canvas><small>اضغط بأي مكان عشان تسكّر</small></div>
    <div id="sTaskM" class="stask" hidden></div>
    <div id="sIntro" class="sfull" hidden></div>
    <div id="sMeet" class="smeet" hidden></div>
    <div id="sEject" class="sfull seject" hidden></div>
    <div id="sKilled" class="sfull skilled" hidden></div>
  </div>`;
  const cv = $('#sCv');
  // جويستك باللمس/الماوس
  cv.addEventListener('pointerdown', e => { if (SU.task || !sg()) return; cv.setPointerCapture(e.pointerId); SU.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; drawJoy(); });
  cv.addEventListener('pointermove', e => { const j = SU.joy; if (!j || j.id !== e.pointerId) return; let dx = e.clientX - j.ox, dy = e.clientY - j.oy; const d = Math.hypot(dx, dy); if (d > 60) { dx *= 60 / d; dy *= 60 / d; } j.dx = dx; j.dy = dy; drawJoy(); });
  const up = e => { if (SU.joy && SU.joy.id === e.pointerId) { SU.joy = null; drawJoy(); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  $('#sMapB').onclick = () => { SU.map = !SU.map; $('#sMapBox').hidden = !SU.map; };
  $('#sMapBox').onclick = () => { SU.map = false; $('#sMapBox').hidden = true; };
  $('#sUseB').onclick = susUse;
  $('#sRepB').onclick = () => SU.act.body && send({ t: 'report', id: SU.act.body });
  $('#sKillB').onclick = () => SU.act.kill && send({ t: 'kill', id: SU.act.kill });
  $('#sVentB').onclick = () => SU.act.vent && send({ t: 'vent' });
  $('#sSaboB').onclick = () => { if (SU.act.sabo) $('#sSaboMenu').hidden = !$('#sSaboMenu').hidden; };
  $$('#sSaboMenu button').forEach(b => b.onclick = () => { send({ t: 'sabo', k: b.dataset.k }); $('#sSaboMenu').hidden = true; });
  if (innerWidth < 640) $('#sTaskBox').open = false;
  if (!SU.loop) { SU.loop = true; SU.lt = performance.now(); requestAnimationFrame(susFrame); }
}
function drawJoy() {
  const j = SU.joy, el = $('#sJoy'); if (!el) return;
  el.hidden = !j; if (!j) return;
  const w = $('#susW').getBoundingClientRect();
  el.style.left = (j.ox - w.left) + 'px'; el.style.top = (j.oy - w.top) + 'px';
  el.firstChild.style.transform = `translate(${j.dx}px,${j.dy}px)`;
}
addEventListener('keydown', e => {
  if (!sg() || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'ص', 'ش', 'س', 'ي'].includes(k)) { SU.keys[k] = 1; e.preventDefault(); }
  if (e.repeat) return;
  if (k === 'e' || k === ' ' || k === 'ث') { e.preventDefault(); susUse(); }
  if (k === 'r' || k === 'ق') SU.act.body && send({ t: 'report', id: SU.act.body });
  if (k === 'q' || k === 'ض') SU.act.kill && send({ t: 'kill', id: SU.act.kill });
  if (k === 'v' || k === 'ر') SU.act.vent && send({ t: 'vent' });
  if (k === 'm' || k === 'ة') { SU.map = !SU.map; const mb = $('#sMapBox'); if (mb) mb.hidden = !SU.map; }
  if (k === 'escape') closeTask();
});
addEventListener('keyup', e => { delete SU.keys[e.key.toLowerCase()]; });
addEventListener('blur', () => { SU.keys = {}; });

function susUse() {
  const a = SU.act;
  if (a.task) return openTask(a.task);
  if (a.button) return send({ t: 'button' });
  if (a.fix) { send({ t: 'fix' }); if (a.fix === 'reactor') { clearInterval(SU.fixing); SU.fixing = setInterval(() => { if (!SU.act.fix || !sg() || !sg().sabo) { clearInterval(SU.fixing); SU.fixing = 0; return; } send({ t: 'fix' }); }, 350); } }
}

// ---------- الحلقة: حركة + رسم ----------
function susFrame(t) {
  if (!sg() || S.phase === 'lobby' || !$('#sCv')) { SU.loop = false; clearInterval(SU.fixing); SU.fixing = 0; return; }
  requestAnimationFrame(susFrame);
  const dt = Math.min(.05, (t - SU.lt) / 1000); SU.lt = t;
  const g = S.g, me = g.me, M = SUSMAP;
  // حركتي
  if (SU.me && me && g.sub === 'play' && S.phase === 'play' && !SU.task && !SU.map) {
    let vx = 0, vy = 0; const K = SU.keys;
    if (K.arrowleft || K.a || K['ش']) vx--; if (K.arrowright || K.d || K['ي']) vx++;
    if (K.arrowup || K.w || K['ص']) vy--; if (K.arrowdown || K.s || K['س']) vy++;
    if (SU.joy && Math.hypot(SU.joy.dx, SU.joy.dy) > 8) { vx = SU.joy.dx / 60; vy = SU.joy.dy / 60; }
    const l = Math.hypot(vx, vy);
    if (l > 0) {
      if (l > 1) { vx /= l; vy /= l; }
      const free = !me.alive, p = SU.me, nx = p.x + vx * SR.SPEED * dt, ny = p.y + vy * SR.SPEED * dt;
      if (M.walk(nx, p.y, free)) p.x = nx; if (M.walk(p.x, ny, free)) p.y = ny;
      if (vx) p.dir = vx > 0 ? 1 : -1; p.ph += dt * 14;
    } else SU.me.ph = 0;
    if ((SU.me.x !== SU.lastX || SU.me.y !== SU.lastY) && t - SU.sent > 66) { SU.sent = t; SU.lastX = SU.me.x; SU.lastY = SU.me.y; send({ t: 'mv', x: Math.round(SU.me.x * 10) / 10, y: Math.round(SU.me.y * 10) / 10 }); }
  }
  // الباقين ينزلقون لمكانهم
  Object.values(SU.oth).forEach(o => { const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy); const k = Math.min(1, dt * 12); o.x += dx * k; o.y += dy * k; if (Math.abs(dx) > .5) o.dir = dx > 0 ? 1 : -1; o.ph = d > 1 ? o.ph + dt * 14 : 0; });
  susDraw(t);
  if (t - SU.hud > 150) { SU.hud = t; susHud(); }
}

function shipPath(ctx, grow) {
  ctx.beginPath();
  SUSMAP.rooms.concat(SUSMAP.halls).forEach(q => ctx.rect(q.x - grow, q.y - grow, q.w + grow * 2, q.h + grow * 2));
}
function susDraw(t) {
  const cv = $('#sCv'), g = S.g, M = SUSMAP; if (!cv) return;
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // الفضاء
  ctx.fillStyle = '#1a1630'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f3ead8'; SU.stars.forEach(([x, y, s]) => { const tw = .4 + .6 * Math.abs(Math.sin(t / 900 + x * 40)); ctx.globalAlpha = tw; ctx.fillRect(x * W, y * H, s, s); }); ctx.globalAlpha = 1;
  const me = g.me, follow = SU.me && me;
  let sc, cx, cy;
  if (follow) { sc = Math.max(.62, Math.min(1.3, Math.min(W, H) / 540)); cx = SU.me.x; cy = SU.me.y; }
  else { sc = Math.min(W / M.W, H / M.H) * .96; cx = M.W / 2; cy = M.H / 2; }
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  // السفينة: ظل، إطار حبر، أرضية
  ctx.save(); ctx.translate(12, 12); shipPath(ctx, 8); ctx.fillStyle = '#0d0b18'; ctx.fill(); ctx.restore();
  shipPath(ctx, 8); ctx.fillStyle = '#16130f'; ctx.fill();
  shipPath(ctx, 0); ctx.fillStyle = '#efe4cc'; ctx.fill();
  ctx.save(); shipPath(ctx, 0); ctx.clip();
  M.rooms.forEach(q => { ctx.fillStyle = ROOMTINT[q.id] || '#f3ead8'; ctx.fillRect(q.x, q.y, q.w, q.h); });
  ctx.strokeStyle = 'rgba(22,19,15,.07)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 0; x < M.W; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, M.H); }
  for (let y = 0; y < M.H; y += 50) { ctx.moveTo(0, y); ctx.lineTo(M.W, y); }
  ctx.stroke();
  susDecor(ctx, t);
  ctx.restore();
  // أسماء الغرف
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '400 30px Lalezar, Tajawal, sans-serif'; ctx.fillStyle = 'rgba(22,19,15,.3)';
  M.rooms.forEach(q => ctx.fillText(q.name, q.x + q.w / 2, q.y + 12));
  // الفتحات
  M.vents.flat().forEach(v => { ctx.fillStyle = '#9aa0ab'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 3.5; rrect(ctx, v.x - 24, v.y - 15, 48, 30, 6); ctx.fill(); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(v.x - 15, v.y + i * 7); ctx.lineTo(v.x + 15, v.y + i * 7); } ctx.stroke(); });
  // لوحات المهام
  M.tasks.forEach(tk => { ctx.fillStyle = '#5b6170'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 3.5; rrect(ctx, tk.x - 17, tk.y - 13, 34, 26, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7ee0a8'; ctx.fillRect(tk.x - 10, tk.y - 7, 20, 9); });
  // علامات مهامي
  if (me && !me.imp) me.tasks.forEach(x => { if (x.done) return; const tk = STASK[x.id], b = Math.sin(t / 220) * 5; mark(ctx, tk.x, tk.y - 40 + b, '#ffc928', '!'); });
  // التخريب
  if (g.sabo) {
    const pts = g.sabo.k === 'lights' ? [M.fix.lights] : M.fix.reactor, on = Math.floor(t / 300) % 2;
    pts.forEach((p, i) => { ctx.fillStyle = '#5b6170'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 3.5; rrect(ctx, p[0] - 20, p[1] - 16, 40, 32, 5); ctx.fill(); ctx.stroke(); const held = g.sabo.k === 'reactor' && (i ? g.sabo.b : g.sabo.a); ctx.fillStyle = held ? '#7ee0a8' : on ? '#e8362d' : '#7a1d18'; ctx.beginPath(); ctx.arc(p[0], p[1], 8, 0, 7); ctx.fill(); mark(ctx, p[0], p[1] - 44 + Math.sin(t / 160) * 4, '#e8362d', '⚠'); });
  }
  // الجثث
  SU.bodies.forEach(([id, x, y]) => drawBody(x, y, scol(id), ctx));
  // اللاعبين (اللي تحت يترسم آخر)
  const list = Object.entries(SU.oth).map(([id, o]) => ({ id, ...o }));
  if (SU.me && me) list.push({ id: S.me, x: SU.me.x, y: SU.me.y, dir: SU.me.dir, ph: SU.me.ph, gh: !me.alive });
  list.sort((a, b) => a.y - b.y).forEach(o => {
    drawGuy(o.x, o.y, scol(o.id), o.dir || 1, o.ph, o.gh, ctx);
    const imp = g.imps.includes(o.id) && me && me.imp;
    ctx.font = '700 15px Tajawal, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.lineWidth = 4; ctx.strokeStyle = '#16130f'; ctx.globalAlpha = o.gh ? .6 : 1;
    const nm = sname(o.id); ctx.strokeText(nm, o.x, o.y - 40); ctx.fillStyle = imp ? '#ff6b5e' : '#fff'; ctx.fillText(nm, o.x, o.y - 40); ctx.globalAlpha = 1;
  });
  ctx.restore();
  // الضباب: ما تشوف إلا اللي حولك
  if (follow && me.alive && S.phase === 'play') {
    const vis = (me.imp ? SR.IMP : g.sabo && g.sabo.k === 'lights' ? SR.DARK : SR.VIS) * sc;
    const gr = ctx.createRadialGradient(W / 2, H / 2, vis * .72, W / 2, H / 2, vis);
    gr.addColorStop(0, 'rgba(10,8,20,0)'); gr.addColorStop(1, 'rgba(10,8,20,.93)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  if (SU.map) susMap(t);
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function mark(ctx, x, y, col, ch) { ctx.fillStyle = col; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#16130f'; ctx.font = '400 19px Lalezar, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, x, y + 1); }
function susDecor(ctx, t) {
  const M = SUSMAP, ink = '#16130f';
  const box = (x, y, w, h, f, r = 6) => { ctx.fillStyle = f; ctx.strokeStyle = ink; ctx.lineWidth = 4; rrect(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke(); };
  const disc = (x, y, r, f) => { ctx.fillStyle = f; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); };
  // الكافتيريا: طاولات وزر الطوارئ
  [[960, 160], [1220, 400], [960, 400]].forEach(([x, y]) => disc(x, y, 34, '#cfd8e3'));
  disc(M.button[0], M.button[1], 46, '#cfd8e3'); disc(M.button[0], M.button[1], 17, '#e8362d');
  // العيادة: سريرين
  box(520, 200, 70, 40, '#fff'); box(520, 280, 70, 40, '#fff');
  // المحركات
  [[110, 270], [270, 330]].forEach(([x, y]) => { box(x - 10, y - 30, 90, 60, '#b9c0cc', 14); ctx.fillStyle = `rgba(255,${120 + Math.sin(t / 120) * 40 | 0},40,.8)`; ctx.fillRect(x - 22, y - 16, 12, 32); });
  // المفاعل: القلب
  disc(230, 720, 52, '#9be7c4'); ctx.fillStyle = `rgba(90,220,160,${.35 + .25 * Math.sin(t / 300)})`; ctx.beginPath(); ctx.arc(230, 720, 36, 0, 7); ctx.fill();
  // القيادة: شبّاك
  ctx.fillStyle = '#2b2a52'; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(2110, 600); ctx.quadraticCurveTo(2150, 680, 2110, 760); ctx.lineTo(2125, 760); ctx.quadraticCurveTo(2165, 680, 2125, 600); ctx.closePath(); ctx.fill(); ctx.stroke();
  box(1940, 640, 60, 60, '#b9c0cc');
  // المخزن: صناديق
  [[1010, 960, 70], [1090, 960, 60], [1150, 1100, 80], [990, 1080, 55]].forEach(([x, y, s]) => { box(x, y, s, s, '#d9a86c', 4); ctx.strokeStyle = 'rgba(22,19,15,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + s - 4, y + s - 4); ctx.stroke(); });
  // الكهرباء والمراقبة
  [[600, 970], [650, 970]].forEach(([x, y]) => box(x, y, 36, 46, '#c9cdb6', 4));
  box(560, 620, 120, 34, '#2b2a52', 4); ctx.fillStyle = '#7ee0a8'; [575, 615, 655].forEach(x => ctx.fillRect(x - 8, 628, 26, 18));
  // المختبر والدروع والأوكسجين
  box(1480, 230, 150, 50, '#fff', 8);
  disc(1600, 1080, 44, '#c9b8ee'); disc(1600, 1080, 16, '#fff');
  [[1520, 690], [1560, 690]].forEach(([x, y]) => { disc(x, y, 15, '#7cc68a'); });
}
function susMap(t) {
  const cv = $('#sMapCv'), g = S.g, M = SUSMAP; if (!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  // على الجوال (طولي) نلف الخريطة عشان تكبر
  const rot = H > W * 1.15, sc = (rot ? Math.min(H / M.W, W / M.H) : Math.min(W / M.W, H / M.H)) * .95;
  ctx.save(); ctx.translate(W / 2, H / 2); if (rot) ctx.rotate(Math.PI / 2); ctx.scale(sc, sc); ctx.translate(-M.W / 2, -M.H / 2);
  const label = (s, x, y) => { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(-Math.PI / 2); ctx.fillText(s, 0, 0); ctx.restore(); };
  shipPath(ctx, 10); ctx.fillStyle = '#16130f'; ctx.fill(); shipPath(ctx, 0); ctx.fillStyle = '#efe4cc'; ctx.fill();
  M.rooms.forEach(q => { ctx.fillStyle = ROOMTINT[q.id]; ctx.fillRect(q.x, q.y, q.w, q.h); });
  ctx.fillStyle = '#16130f'; ctx.font = '400 ' + (rot ? 60 : 46) + 'px Lalezar, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  M.rooms.forEach(q => label(q.name, q.x + q.w / 2, q.y + q.h / 2));
  if (g.me && !g.me.imp) g.me.tasks.forEach(x => { if (!x.done) { const tk = STASK[x.id]; ctx.fillStyle = '#ffc928'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(tk.x, tk.y, 26, 0, 7); ctx.fill(); ctx.stroke(); } });
  if (g.sabo && Math.floor(t / 300) % 2) (g.sabo.k === 'lights' ? [M.fix.lights] : M.fix.reactor).forEach(p => { ctx.fillStyle = '#e8362d'; ctx.beginPath(); ctx.arc(p[0], p[1], 34, 0, 7); ctx.fill(); });
  if (SU.me) { ctx.fillStyle = SCOL[g.me ? g.me.c : 0]; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(SU.me.x, SU.me.y, 30, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

// ---------- الأزرار حسب القرب ----------
function susHud() {
  const g = sg(); if (!g || !$('#sUseB')) return;
  const me = g.me, M = SUSMAP, play = g.sub === 'play' && S.phase === 'play', p = SU.me;
  const a = SU.act = {};
  if (play && me && p) {
    const near = (x, y, r) => Math.hypot(p.x - x, p.y - y) <= r;
    if (!me.imp) { const tk = me.tasks.find(x => !x.done && near(STASK[x.id].x, STASK[x.id].y, SR.USE)); if (tk) a.task = tk.id; }
    if (me.alive) {
      if (!a.task && near(M.button[0], M.button[1], SR.BTN) && me.btn > 0 && !g.sabo && sleft(g.btnIn) <= 0) a.button = 1;
      if (g.sabo) { if (g.sabo.k === 'lights' ? near(M.fix.lights[0], M.fix.lights[1], SR.USE) : M.fix.reactor.some(f => near(f[0], f[1], SR.USE))) a.fix = g.sabo.k; }
      const bd = SU.bodies.find(([, x, y]) => near(x, y, SR.REPORT)); if (bd) a.body = bd[0];
      if (me.imp) {
        if (sleft(me.killIn) <= 0) { const v = Object.entries(SU.oth).filter(([id, o]) => !o.gh && !g.imps.includes(id) && near(o.x, o.y, SR.KILL)).sort((x, y) => Math.hypot(x[1].x - p.x, x[1].y - p.y) - Math.hypot(y[1].x - p.x, y[1].y - p.y))[0]; if (v) a.kill = v[0]; }
        if (M.vents.flat().some(v => near(v.x, v.y, SR.VENT))) a.vent = 1;
        if (!g.sabo && sleft(g.saboIn) <= 0) a.sabo = 1;
      }
    }
  }
  const imp = me && me.imp && me.alive;
  $$('#susW .sbtn.imp').forEach(b => b.hidden = !imp);
  $('#sRepB').hidden = !(me && me.alive);
  const useB = $('#sUseB'); useB.disabled = !(a.task || a.button || a.fix);
  useB.querySelector('b').textContent = a.task ? 'سوّ المهمة' : a.button ? 'اجتماع طارئ' : a.fix ? (a.fix === 'reactor' && SU.fixing ? 'ماسك…' : 'صلّح') : 'استخدم';
  $('#sRepB').disabled = !a.body; $('#sKillB').disabled = !a.kill; $('#sVentB').disabled = !a.vent; $('#sSaboB').disabled = !a.sabo;
  if (imp) {
    const kl = Math.ceil(sleft(me.killIn) / 1000), sl = Math.ceil(sleft(g.saboIn) / 1000);
    $('#sKillB i').textContent = kl > 0 && play ? kl : ''; $('#sSaboB i').textContent = sl > 0 && play && !g.sabo ? sl : '';
  }
  if (!a.sabo) $('#sSaboMenu').hidden = true;
  // شريط التخريب
  const bn = $('#sBanner');
  if (g.sabo && play) {
    bn.hidden = false; bn.className = 'sbanner ' + g.sabo.k;
    bn.textContent = g.sabo.k === 'lights' ? '💡 الكهرباء طافية! روحوا صلّحوها بغرفة الكهرباء' : `☢️ المفاعل بينفجر بعد ${Math.ceil(sleft(g.sabo.left) / 1000)} — لازم اثنين يمسكون اللوحتين بالمفاعل مع بعض`;
  } else if (me && !me.alive && play) { bn.hidden = false; bn.className = 'sbanner ghost'; bn.textContent = me.imp ? '👻 أنت ميت — تفرّج على الباقين' : '👻 أنت ميت — كمّل مهامك عشان يفوز الطاقم'; }
  else bn.hidden = true;
}

// ---------- تحديث الحالة ----------
function renderSus(body) {
  if (body.dataset.built !== 'sus' || !$('#sCv')) susBuild(body);
  if (!SU.loop) { SU.loop = true; SU.lt = performance.now(); requestAnimationFrame(susFrame); }
  const g = S.g, me = g.me;
  const pr = g.prog[1] ? Math.round(g.prog[0] / g.prog[1] * 100) : 0;
  $('#sProgI').style.width = pr + '%';
  if (me && me.imp) { $('#sTaskSum').textContent = '😈 أنت المندس'; $('#sTasks').innerHTML = `<p class="sfake">اقتل الطاقم وخرّب بدون ما تنكشف.${g.imps.length > 1 ? ' شريكك: <b>' + esc(g.imps.filter(i => i !== S.me).map(sname).join('، ')) + '</b>' : ''}</p><p class="sfake muted">مهام وهمية للتمويه:</p>` + me.tasks.map(x => `<div class="st fake">${esc(STASK[x.id].name)} <small>(${esc(SUSMAP.roomAt(STASK[x.id].x, STASK[x.id].y))})</small></div>`).join(''); }
  else if (me) { const d = me.tasks.filter(x => x.done).length; $('#sTaskSum').textContent = `مهامك ${d}/${me.tasks.length}`; $('#sTasks').innerHTML = me.tasks.map(x => `<div class="st${x.done ? ' done' : ''}">${x.done ? '✔' : '•'} ${esc(STASK[x.id].name)} <small>(${esc(SUSMAP.roomAt(STASK[x.id].x, STASK[x.id].y))})</small></div>`).join(''); }
  else { $('#sTaskSum').textContent = 'تتفرّج 👁'; $('#sTasks').innerHTML = ''; }
  if (g.sub !== 'play' || (me && !me.alive && SU.task && false)) closeTask();
  if (me && me.tasks.find(x => SU.task && x.id === SU.task.id && x.done)) closeTask();
  renderSusOverlays();
  susFx();
  susHud();
}

function renderSusOverlays() {
  const g = sg(); if (!g || !$('#sIntro')) return;
  const me = g.me, over = S.phase === 'over';
  // البداية
  const intro = $('#sIntro'); intro.hidden = g.sub !== 'intro';
  if (!intro.hidden && intro.dataset.k !== 'on') {
    intro.dataset.k = 'on';
    const imp = me && me.imp, mates = g.imps.filter(i => i !== S.me);
    intro.innerHTML = `<div class="sintro ${imp ? 'imp' : 'crew'}">${guySvg(me ? me.c : 0)}<h2>${!me ? 'تتفرّج 👁' : imp ? 'أنت المندس 😈' : 'أنت من الطاقم 🧑‍🚀'}</h2><p>${imp ? (mates.length ? 'شريكك: <b>' + esc(mates.map(sname).join('، ')) + '</b>' : 'اقتلهم واحد واحد بدون ما يشوفك أحد') : `بينكم ${g.nImp > 1 ? 'مندسين اثنين' : 'مندس واحد'}… خلّص مهامك وانتبه`}</p></div>`;
  }
  if (intro.hidden) intro.dataset.k = '';
  // انقتلت
  const kd = $('#sKilled'), kOn = SU.killedFx && Date.now() - SU.killedFx < 2600;
  kd.hidden = !kOn;
  if (kOn && kd.dataset.k !== String(SU.killedFx)) { kd.dataset.k = String(SU.killedFx); kd.innerHTML = `<div class="skill">${guySvg(SU.killer)}<span>🔪</span>${guySvg(me ? me.c : 0, true)}</div><h2>انقتلت!</h2><p>تقدر تكمّل مهامك كشبح 👻</p>`; setTimeout(renderSusOverlays, 2700); }
  // الاجتماع
  const mt = $('#sMeet'); mt.hidden = !(g.sub === 'meet' && g.meet);
  if (!mt.hidden) drawMeet(mt);
  else SU.pick = null;
  // الطرد
  const ej = $('#sEject'); ej.hidden = !(g.sub === 'eject' && g.eject) || over;
  if (!ej.hidden && ej.dataset.k !== g.eject.text + g.eject.id) {
    ej.dataset.k = g.eject.text + g.eject.id; const e = g.eject;
    const tally = Object.entries(e.tally).map(([v, ws]) => `<div><b>${v === 'skip' ? 'تخطّي' : esc(sname(v))}</b>: ${ws.map(w => `<span class="sdot" style="background:${SCOL[scol(w)]}"></span>`).join('')}</div>`).join('');
    ej.innerHTML = `${e.id ? `<div class="sfloat">${guySvg(scol(e.id))}</div>` : ''}<h2>${esc(e.text)}</h2>${e.id ? `<p>باقي ${e.left} ${e.left === 1 ? 'مندس' : 'مندسين'}</p>` : ''}<div class="stally">${tally || '<div>محد صوّت</div>'}</div>`;
  }
}
function drawMeet(el) {
  const g = S.g, m = g.meet, me = g.me, canVote = me && me.alive && m.sub === 'vote' && !m.mine && S.phase === 'play';
  const secs = Math.ceil(sleft(S.left) / 1000);
  const head = m.body ? `💀 ${esc(sname(m.by))} لقى جثة ${esc(sname(m.body))}` : `🚨 ${esc(sname(m.by))} سوّى اجتماع طارئ`;
  const ppl = S.players.filter(p => g.col[p.id] != null).map(p => {
    const dead = g.dead.includes(p.id), voted = m.voted.includes(p.id), imp = me && me.imp && g.imps.includes(p.id);
    return `<button type="button" class="svote${dead ? ' dead' : ''}${SU.pick === p.id ? ' pick' : ''}${m.mine === p.id ? ' mine' : ''}" data-id="${p.id}"${!canVote || dead ? ' disabled' : ''}>${guySvg(g.col[p.id], dead)}<b class="${imp ? 'simp' : ''}">${esc(p.name)}${p.id === S.me ? ' (أنت)' : ''}</b>${voted ? '<i>✔ صوّت</i>' : ''}${p.id === m.by ? '<em>📢</em>' : ''}</button>`;
  }).join('');
  el.innerHTML = `<div class="smeetbox"><h2>${head}</h2><p class="stimer">${m.sub === 'talk' ? `نقاش… التصويت يبدأ بعد <b class="scd">${secs}</b>` : `صوّتوا! باقي <b class="scd">${secs}</b>`}</p>
    <div class="svotes">${ppl}</div>
    <div class="smeetfoot">${canVote ? `<button type="button" class="btn sm" id="sSkip">تخطّي ⏭</button>${SU.pick ? `<button type="button" class="btn sm red" id="sConfirm">أطرد ${esc(sname(SU.pick))}؟ ✔</button>` : ''}` : m.mine ? `<span>صوّت على: <b>${m.mine === 'skip' ? 'تخطّي' : esc(sname(m.mine))}</b></span>` : me && !me.alive ? '<span>الأموات ما يصوّتون 👻</span>' : m.sub === 'talk' ? '<span>تناقشوا بالشات 💬 أو بالديسكورد</span>' : ''}</div></div>`;
  el.querySelectorAll('.svote').forEach(b => b.onclick = () => { if (!canVote) return; SU.pick = SU.pick === b.dataset.id ? null : b.dataset.id; drawMeet(el); });
  const sk = el.querySelector('#sSkip'); if (sk) sk.onclick = () => { SU.pick = null; send({ t: 'vote', v: 'skip' }); };
  const cf = el.querySelector('#sConfirm'); if (cf) cf.onclick = () => { const v = SU.pick; SU.pick = null; send({ t: 'vote', v }); };
}
setInterval(() => { const g = sg(); if (g && g.sub === 'meet') { const c = $('#sMeet .scd'); if (c) c.textContent = Math.ceil(sleft(S.left) / 1000); } if (g && g.sabo && g.sabo.k === 'reactor' && Date.now() % 1000 < 260) { if (!SU.alarmT || Date.now() - SU.alarmT > 900) { SU.alarmT = Date.now(); if (S.phase === 'play' && g.sub === 'play') sfx('alarm2'); } } }, 250);

function susFx() {
  const p = prevS, s = S; if (!p || p.game !== 'sus' || !p.g || !s.g) return;
  const g = s.g, pg = p.g;
  if (g.sub === 'intro' && pg.sub !== 'intro') sfx('alarm');
  if (g.sub !== 'play' && pg.sub === 'play') { SU.map = false; const mb = $('#sMapBox'); if (mb) mb.hidden = true; $('#sSaboMenu').hidden = true; }
  if (g.sub === 'meet' && pg.sub !== 'meet') { sfx('alarm'); closeTask(); SU.oth = {}; SU.bodies = []; }
  if (g.meet && pg.meet && g.meet.sub === 'vote' && pg.meet.sub === 'talk') sfx('turn');
  if (g.meet && pg.meet && g.meet.voted.length > pg.meet.voted.length) sfx('card');
  if (g.sub === 'eject' && pg.sub !== 'eject') sfx(g.eject && g.eject.id ? 'catch' : 'nope');
  if (g.sabo && !pg.sabo) sfx('alarm2');
  if (!g.sabo && pg.sabo && g.sub === 'play') sfx('pop');
  if (g.me && pg.me && g.me.imp && g.me.killIn > pg.me.killIn + 5000 && g.sub === 'play' && pg.sub === 'play') sfx('kill');
  if (g.prog[0] > pg.prog[0] && g.me && pg.me && g.me.tasks.filter(x => x.done).length > pg.me.tasks.filter(x => x.done).length) sfx('win');
  if (s.phase === 'over' && p.phase === 'play') setTimeout(() => sfx(g.me && (g.win === 'imp') === !!g.me.imp ? 'unoWin' : 'lose'), 300);
}

// ---------- المهام (ألعاب صغيرة) ----------
function closeTask() { SU.task = null; const m = $('#sTaskM'); if (m) { m.hidden = true; m.innerHTML = ''; } clearInterval(SU.taskIv); }
function openTask(id) {
  const tk = STASK[id]; if (!tk || SU.task) return;
  SU.task = { id, t0: Date.now() }; send({ t: 'tstart', id });
  const el = $('#sTaskM'); el.hidden = false;
  el.innerHTML = `<div class="staskbox"><button type="button" class="sx" id="sTX">✕</button><h3>${esc(tk.name)}</h3><div id="sTB" class="stb ${tk.kind}"></div></div>`;
  $('#sTX').onclick = closeTask;
  const B = $('#sTB'), done = () => {
    const wait = Math.max(0, SMIN[tk.kind] + 200 - (Date.now() - SU.task.t0));
    B.insertAdjacentHTML('beforeend', '<div class="sok">✔</div>');
    setTimeout(() => { if (!SU.task || SU.task.id !== id) return; send({ t: 'tdone', id }); setTimeout(closeTask, 450); }, wait);
  };
  if (tk.kind === 'wires') {
    const C = ['#e8362d', '#2a5bd7', '#ffc928', '#ff6fae'], L = shuffle2([0, 1, 2, 3]), R = shuffle2([0, 1, 2, 3]); let sel = null; const ok = new Set();
    B.innerHTML = `<svg viewBox="0 0 300 220" id="sWv"></svg><div class="wcol l">${L.map(i => `<button type="button" data-c="${i}" style="background:${C[i]}"></button>`).join('')}</div><div class="wcol r">${R.map(i => `<button type="button" data-c="${i}" style="background:${C[i]}"></button>`).join('')}</div><p class="muted">اضغط سلك من اليمين وبعدين نفس اللون باليسار</p>`;
    const draw = () => { $('#sWv').innerHTML = [...ok].map(i => `<line x1="285" y1="${L.indexOf(i) * 55 + 27}" x2="15" y2="${R.indexOf(i) * 55 + 27}" stroke="${C[i]}" stroke-width="12" stroke-linecap="round"/>`).join(''); };
    B.querySelectorAll('.wcol.l button').forEach(b => b.onclick = () => { if (ok.has(+b.dataset.c)) return; sel = +b.dataset.c; B.querySelectorAll('.wcol.l button').forEach(x => x.classList.toggle('on', x === b)); });
    B.querySelectorAll('.wcol.r button').forEach(b => b.onclick = () => { if (sel === null) return; if (+b.dataset.c === sel) { ok.add(sel); sfx('pop'); b.classList.add('ok'); B.querySelector(`.wcol.l button[data-c="${sel}"]`).classList.add('ok'); draw(); if (ok.size === 4) done(); } else sfx('nope'); sel = null; B.querySelectorAll('.wcol.l button').forEach(x => x.classList.remove('on')); });
  } else if (tk.kind === 'nums') {
    let n = 1; const nums = shuffle2([1, 2, 3, 4, 5, 6, 7, 8]);
    B.innerHTML = `<div class="ngrid">${nums.map(x => `<button type="button" data-n="${x}">${x}</button>`).join('')}</div><p class="muted">اضغط الأرقام بالترتيب من ١ لين ٨</p>`;
    B.querySelectorAll('.ngrid button').forEach(b => b.onclick = () => { if (+b.dataset.n === n) { b.classList.add('ok'); sfx('tick'); if (++n > 8) done(); } else { n = 1; sfx('nope'); B.querySelectorAll('.ngrid button').forEach(x => x.classList.remove('ok')); } });
  } else if (tk.kind === 'swipe') {
    B.innerHTML = `<div class="strack"><div class="scard" id="sCard">💳</div></div><p class="muted">اسحب البطاقة لآخر الشريط</p>`;
    const card = $('#sCard'), tr = card.parentElement; let st = null;
    card.onpointerdown = e => { card.setPointerCapture(e.pointerId); st = { x: e.clientX, w: tr.clientWidth - card.offsetWidth - 8 }; };
    card.onpointermove = e => { if (!st) return; const d = Math.max(0, Math.min(st.w, st.x - e.clientX)); card.style.transform = `translateX(${-d}px)`; if (d >= st.w - 2) { st = null; card.onpointermove = null; card.onpointerdown = null; done(); } };
    card.onpointerup = () => { if (st) { st = null; card.style.transform = ''; } };
  } else if (tk.kind === 'hold') {
    let v = 0, down = false;
    B.innerHTML = `<div class="sgauge"><i id="sGI"></i></div><button type="button" class="btn yellow shold" id="sHold">اضغط مطوّل</button>`;
    const hb = $('#sHold'); hb.onpointerdown = e => { down = true; hb.setPointerCapture(e.pointerId); }; hb.onpointerup = hb.onpointercancel = () => { down = false; };
    SU.taskIv = setInterval(() => { if (!down) return; v = Math.min(100, v + 4); $('#sGI').style.height = v + '%'; if (v >= 100) { clearInterval(SU.taskIv); done(); } }, 100);
  } else if (tk.kind === 'wait') {
    let v = 0;
    B.innerHTML = `<div class="swait"><i id="sWI"></i></div><button type="button" class="btn green" id="sGo">ابدأ</button><p class="muted">لا تطلع من النافذة لين يخلص</p>`;
    $('#sGo').onclick = () => { $('#sGo').disabled = true; SU.taskIv = setInterval(() => { v = Math.min(100, v + 2); $('#sWI').style.width = v + '%'; if (v >= 100) { clearInterval(SU.taskIv); done(); } }, 100); };
  }
}
function shuffle2(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
