// واجهة لعبة المندس: رسم السفينة على كانفس (جدران، أثاث، ظلام خارج نظرك)، الحركة (أسهم/WASD أو جويستك)،
// المهام (١٠ ألعاب صغيرة)، الكاميرات، الدكتور، الاجتماعات والتصويت، وكل الأنميشنات
const SCOL = ['#e8362d', '#2a5bd7', '#1f9d55', '#ffc928', '#ff8a1f', '#8a4fd6', '#ff6fae', '#19c3d6', '#8a5a2b', '#f4efe6', '#9be22d', '#6b7280'];
const SR = { USE: 110, KILL: 130, REPORT: 170, BTN: SUSMAP.btnR + 90, VENT: 90, CAM: 120, SHIELD: 170, SPEED: 190, VIS: 560, IMP: 700, DARK: 210 };
const SMIN = { wires: 1500, swipe: 700, nums: 2000, hold: 2000, wait: 4500, slider: 1000, simon: 3000, tap: 1500, code: 1800, temp: 1200 };
const STASK = Object.fromEntries(SUSMAP.tasks.map(t => [t.id, t]));
const SU = { me: null, oth: {}, bodies: [], keys: {}, joy: null, sent: 0, lastX: 0, lastY: 0, task: null, map: false, cams: false, fixing: 0, act: {}, stars: [], hud: 0, fx: [], seenBodies: new Set(), splashKey: null };
for (let i = 0; i < 140; i++) SU.stars.push([Math.random(), Math.random(), Math.random() < .2 ? 2.2 : 1.2, Math.random()]);

const sg = () => S && S.game === 'sus' && S.g;
const scol = id => { const g = sg(); return g && g.col[id] != null ? g.col[id] : 0; };
const sname = id => (S.players.find(p => p.id === id) || {}).name || '؟';
const sleft = ms => Math.max(0, ms - (Date.now() - S.t0));
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
const shade = (h, k) => { const n = parseInt(h.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };

// ---------- الشخصية (كرة بعيون وأنتينا — شخصية خاصة بالموقع) ----------
function guySvg(c, dead) {
  const f = SCOL[c] || SCOL[0];
  return `<svg viewBox="0 0 60 64" class="sguy${dead ? ' dead' : ''}"><path d="M30 13V5" stroke="#16130f" stroke-width="3"/><circle cx="30" cy="5" r="4" fill="${f}" stroke="#16130f" stroke-width="2.5"/>
  <ellipse cx="21" cy="57" rx="7" ry="4" fill="${f}" stroke="#16130f" stroke-width="3"/><ellipse cx="39" cy="57" rx="7" ry="4" fill="${f}" stroke="#16130f" stroke-width="3"/>
  <circle cx="30" cy="35" r="21" fill="${f}" stroke="#16130f" stroke-width="4"/><path d="M15 32a15 15 0 0 1 9-12" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none" stroke-linecap="round"/>
  ${dead ? '<path d="M20 29l6 6m0-6l-6 6M34 29l6 6m0-6l-6 6" stroke="#16130f" stroke-width="3" stroke-linecap="round"/>' : '<ellipse cx="24" cy="32" rx="5" ry="6.5" fill="#fff" stroke="#16130f" stroke-width="2.5"/><ellipse cx="37" cy="32" rx="5" ry="6.5" fill="#fff" stroke="#16130f" stroke-width="2.5"/><circle cx="25" cy="33" r="2.6" fill="#16130f"/><circle cx="38" cy="33" r="2.6" fill="#16130f"/>'}</svg>`;
}
function drawGuy(ctx, x, y, c, dir, phase, ghost, t) {
  const f = SCOL[c] || SCOL[0], bob = ghost ? Math.sin(t / 300) * 4 : phase ? Math.abs(Math.sin(phase)) * 3.5 : 0;
  ctx.save(); ctx.translate(x, y - bob); ctx.scale(1.15, 1.15);
  if (ghost) ctx.globalAlpha = .5;
  ctx.lineWidth = 4; ctx.strokeStyle = '#16130f'; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(22,19,15,.22)'; ctx.beginPath(); ctx.ellipse(0, 24 + bob, 20, 6, 0, 0, 7); ctx.fill();
  if (!ghost) {
    const s = phase ? Math.sin(phase) * 5 : 0;
    ctx.fillStyle = f;
    ctx.beginPath(); ctx.ellipse(-9 + s, 20, 7, 4.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(9 - s, 20, 7, 4.5, 0, 0, 7); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(dir * 3 + (phase ? Math.sin(phase * .5) * 2 : 0), -31); ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(dir * 3, -33, 4.5, 0, 7); ctx.fillStyle = f; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath();
  if (ghost) { ctx.moveTo(-21, 0); ctx.arc(0, 0, 21, Math.PI, 0); ctx.lineTo(21, 18); for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(15 - i * 10.5, 26 + (i % 2) * -8, 10.5 - i * 10.5, 18); ctx.closePath(); }
  else ctx.arc(0, 0, 21, 0, 7);
  ctx.fillStyle = f; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(dir * -4, -3, 13, Math.PI * 1.05, Math.PI * 1.45); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
  ctx.strokeStyle = '#16130f'; ctx.lineWidth = 2.5;
  const blink = (t / 1000 + c * .37) % 4 < .12;
  [-6, 7].forEach(ex => { ctx.beginPath(); ctx.ellipse(ex + dir * 3, -3, 5, blink ? 1 : 6.5, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); if (!blink) { ctx.beginPath(); ctx.arc(ex + dir * 5, -2, 2.6, 0, 7); ctx.fillStyle = '#16130f'; ctx.fill(); } });
  ctx.restore();
}
function drawBody(ctx, x, y, c) {
  const f = SCOL[c] || SCOL[0];
  ctx.save(); ctx.translate(x, y + 6); ctx.rotate(-.25); ctx.scale(1.15, 1.15);
  ctx.lineWidth = 4; ctx.strokeStyle = '#16130f';
  ctx.fillStyle = 'rgba(160,20,20,.4)'; ctx.beginPath(); ctx.ellipse(8, 12, 34, 10, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 4, 25, 13, 0, 0, 7); ctx.fillStyle = f; ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  [-9, 5].forEach(ex => { ctx.beginPath(); ctx.moveTo(ex - 4, -3); ctx.lineTo(ex + 4, 5); ctx.moveTo(ex + 4, -3); ctx.lineTo(ex - 4, 5); ctx.stroke(); });
  ctx.restore();
}

// ---------- الشبكة ----------
const nearVent = (x, y) => SUSMAP.vents.flat().some(v => Math.hypot(v.x - x, v.y - y) < 60);
function puff(x, y, col = '#9aa0ab', n = 10) { const t = performance.now(); for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, s = 40 + Math.random() * 70; SU.fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, t0: t, life: 600 + Math.random() * 300, r: 6 + Math.random() * 8, col }); } }
function susNet(m) {
  if (m.t === 'snap') {
    if (SU.me && m.ev === 'vent') { puff(SU.me.x, SU.me.y); puff(m.x, m.y); sfx('draw'); }
    if (m.ev === 'kill') { killFlash(); }
    SU.me = { x: m.x, y: m.y, dir: SU.me ? SU.me.dir : 1, ph: 0 }; SU.lastX = m.x; SU.lastY = m.y; return;
  }
  if (m.t === 'sus') {
    if (m.ev === 'killed') { SU.killedFx = Date.now(); SU.killer = m.by; closeTask(); closeCams(); sfx('bang'); renderSusOverlays(); }
    else if (m.ev === 'blocked') { sPop('🛡️ عليه درع! ما قدرت تقتله', 'red'); sfx('nope'); }
    else if (m.ev === 'saved') { sPop(m.id === S.me ? '🛡️ أحد حاول يقتلك… والدرع حماك!' : `🩺 درعك أنقذ ${sname(m.id)}!`, 'green'); sfx('win'); }
    else if (m.ev === 'shielded') { sPop('🛡️ الدكتور عطاك درع لين الاجتماع الجاي', 'blue'); sfx('pop'); }
    return;
  }
  if (m.t !== 'pos') return;
  const seen = {};
  m.a.forEach(([id, x, y, gh]) => {
    seen[id] = 1;
    if (S && id === S.me) { if (!SU.me) SU.me = { x, y, dir: 1, ph: 0 }; return; }
    const o = SU.oth[id];
    if (!o || Math.hypot(o.x - x, o.y - y) > 260) {
      if (o && sg() && sg().sub === 'play') { if (nearVent(o.x, o.y)) puff(o.x, o.y); if (nearVent(x, y)) puff(x, y); }
      SU.oth[id] = { x, y, tx: x, ty: y, dir: o ? o.dir : 1, ph: 0, gh };
    } else { o.tx = x; o.ty = y; o.gh = gh; }
  });
  Object.keys(SU.oth).forEach(id => { if (!seen[id]) delete SU.oth[id]; });
  m.b.forEach(([id, x, y]) => { if (!SU.seenBodies.has(id)) { SU.seenBodies.add(id); puff(x, y, '#c0392b', 14); } });
  SU.bodies = m.b;
}
function killFlash() { const w = $('#susW'); if (!w) return; const d = document.createElement('div'); d.className = 'sslash'; w.appendChild(d); setTimeout(() => d.remove(), 700); sfx('kill'); }
function sPop(text, kind = '') { const w = $('#susW'); if (!w) return; const d = document.createElement('div'); d.className = 'spop ' + kind; d.textContent = text; w.appendChild(d); setTimeout(() => d.remove(), 3200); }

// ---------- رسم الخريطة ----------
let PAT = null;
function patterns(ctx) {
  if (PAT) return PAT;
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return ctx.createPattern(c, 'repeat'); };
  PAT = {
    tile: mk(80, 80, x => { x.fillStyle = 'rgba(22,19,15,.07)'; x.fillRect(0, 0, 80, 3); x.fillRect(0, 0, 3, 80); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(3, 3, 74, 2); }),
    grate: mk(40, 40, x => { x.fillStyle = '#cfc9bd'; x.fillRect(0, 0, 40, 40); x.strokeStyle = 'rgba(22,19,15,.18)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 10); x.lineTo(40, 10); x.moveTo(0, 30); x.lineTo(40, 30); x.stroke(); x.fillStyle = 'rgba(22,19,15,.12)'; x.fillRect(18, 0, 4, 40); })
  };
  return PAT;
}
// الجدران الفوقية (عمق ثلاثي الأبعاد): أجزاء الحافة العلوية اللي فوقها فضاء
const WALLS = (() => {
  const M = SUSMAP, out = [];
  M.rooms.concat(M.halls).forEach(q => {
    let s = null;
    for (let x = q.x; x <= q.x + q.w; x += 10) {
      const wall = !M.area(x + 5, q.y - 8) && x + 10 <= q.x + q.w + 0.1;
      if (wall && s === null) s = x;
      if ((!wall || x + 10 > q.x + q.w) && s !== null) { out.push({ x: s, y: q.y, w: (wall ? x + 10 : x) - s, f: q.f || '#cfc9bd' }); s = null; }
    }
  });
  return out;
})();
function shipPath(ctx, grow) { ctx.beginPath(); SUSMAP.rooms.concat(SUSMAP.halls).forEach(q => ctx.rect(q.x - grow, q.y - grow, q.w + grow * 2, q.h + grow * 2)); }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function mark(ctx, x, y, col, ch, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#16130f'; ctx.font = '400 24px Lalezar, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, 2); ctx.restore(); }

function drawObs(ctx, o, t) {
  const ink = '#16130f';
  ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = ink;
  const shadow = () => { ctx.fillStyle = 'rgba(22,19,15,.22)'; if (o.t === 'c') { ctx.beginPath(); ctx.arc(o.x + 7, o.y + 9, o.r, 0, 7); ctx.fill(); } else { rrect(ctx, o.x + 7, o.y + 9, o.w, o.h, 10); ctx.fill(); } };
  shadow();
  const disc = (r, f) => { ctx.fillStyle = f; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.fill(); ctx.stroke(); };
  const box = (f, r = 10) => { ctx.fillStyle = f; rrect(ctx, o.x, o.y, o.w, o.h, r); ctx.fill(); ctx.stroke(); };
  switch (o.k) {
    case 'button': disc(o.r, '#cfd6e0'); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(o.x - 18, o.y - 20, 22, 0, 7); ctx.fill(); ctx.fillStyle = '#9aa3b2'; ctx.beginPath(); ctx.arc(o.x, o.y, 34, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8362d'; ctx.beginPath(); ctx.arc(o.x, o.y - 4 + Math.sin(t / 400) * 1.5, 22, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(o.x - 7, o.y - 11, 6, 0, 7); ctx.fill(); break;
    case 'table': disc(o.r, '#d8dee6'); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(o.x - 14, o.y - 16, 18, 0, 7); ctx.fill(); ctx.fillStyle = '#ffc928'; ctx.beginPath(); ctx.arc(o.x + 12, o.y + 8, 9, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); break;
    case 'engine': box('#b9c0cc', 30); ctx.fillStyle = '#8d94a3'; [0.25, 0.5, 0.75].forEach(k => ctx.fillRect(o.x + o.w * k - 4, o.y + 10, 8, o.h - 20)); { const fl = 18 + Math.sin(t / 70) * 8; ctx.fillStyle = 'rgba(255,140,40,.85)'; ctx.beginPath(); ctx.moveTo(o.x + o.w, o.y + 40); ctx.lineTo(o.x + o.w + fl, o.y + o.h / 2); ctx.lineTo(o.x + o.w, o.y + o.h - 40); ctx.fill(); } break;
    case 'box': box('#c9b48f', 8); break;
    case 'bed': box('#ffffff', 14); ctx.fillStyle = '#d3ecee'; rrect(ctx, o.x + 10, o.y + 12, 46, o.h - 24, 10); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#7cc9cf'; ctx.fillRect(o.x + 70, o.y + 8, o.w - 80, o.h - 16); break;
    case 'scan': ctx.fillStyle = `rgba(80,200,230,${.35 + .25 * Math.sin(t / 250)})`; ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 10, 0, 7); ctx.fill(); disc(o.r, '#bfe9f2'); ctx.strokeStyle = 'rgba(22,19,15,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * .55, 0, 7); ctx.stroke(); break;
    case 'gun': disc(o.r, '#9aa0ab'); ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(Math.sin(t / 1200) * .6 - .4); ctx.fillStyle = '#5b6170'; rrect(ctx, 0, -14, o.r + 50, 28, 8); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#5b6170'; ctx.beginPath(); ctx.arc(o.x, o.y, 30, 0, 7); ctx.fill(); ctx.stroke(); break;
    case 'core': { const p = .5 + .5 * Math.sin(t / 300); ctx.fillStyle = `rgba(90,230,170,${.25 + .25 * p})`; ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 22 + p * 8, 0, 7); ctx.fill(); disc(o.r, '#9be7c4'); ctx.fillStyle = `rgba(40,190,130,${.5 + .4 * p})`; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * .6, 0, 7); ctx.fill(); ctx.stroke(); } break;
    case 'desk': box('#3a3961', 8); ctx.fillStyle = '#7ee0a8'; for (let i = 0; i < 3; i++) { const w = (o.w - 40) / 3; ctx.globalAlpha = .7 + .3 * Math.sin(t / 300 + i); ctx.fillRect(o.x + 10 + i * (w + 10), o.y + 12, w, o.h - 24); } ctx.globalAlpha = 1; break;
    case 'admin': box('#c7c0a8', 14); ctx.fillStyle = `rgba(90,200,255,${.4 + .2 * Math.sin(t / 300)})`; rrect(ctx, o.x + 18, o.y + 14, o.w - 36, o.h - 28, 8); ctx.fill(); break;
    case 'plant': disc(o.r, '#b78656'); ctx.fillStyle = '#3fae5a'; for (let i = 0; i < 5; i++) { const a = i * 1.26 + t / 2000; ctx.beginPath(); ctx.ellipse(o.x + Math.cos(a) * 16, o.y + Math.sin(a) * 16 - 6, 16, 9, a, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); } break;
    case 'console': box('#5b6170', 10); for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#e8362d', '#ffc928', '#7ee0a8'][(i + (t / 400 | 0)) % 3]; ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + 30 + i * 38, 9, 0, 7); ctx.fill(); } break;
    case 'seat': disc(o.r, '#8a5a2b'); ctx.fillStyle = '#a8743f'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * .6, 0, 7); ctx.fill(); break;
    case 'gen': box('#c9cdb6', 8); ctx.fillStyle = '#ffc928'; ctx.font = '400 40px Lalezar'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚡', o.x + o.w / 2, o.y + o.h / 2); break;
    case 'crate': box('#d9a86c', 6); ctx.strokeStyle = 'rgba(22,19,15,.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x + 8, o.y + 8); ctx.lineTo(o.x + o.w - 8, o.y + o.h - 8); ctx.moveTo(o.x + o.w - 8, o.y + 8); ctx.lineTo(o.x + 8, o.y + o.h - 8); ctx.stroke(); break;
    case 'dish': disc(o.r, '#c9b8ee'); ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(t / 900); ctx.strokeStyle = 'rgba(22,19,15,.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-o.r * .7, 0); ctx.lineTo(o.r * .7, 0); ctx.moveTo(0, -o.r * .7); ctx.lineTo(0, o.r * .7); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x, o.y, 16, 0, 7); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.stroke(); break;
    default: if (o.t === 'c') disc(o.r, '#ccc'); else box('#ccc');
  }
  ctx.restore();
}

// يرسم السفينة من منظور كاميرا (cx,cy,sc). who: مين نرسم من اللاعبين/الجثث
function drawWorld(ctx, W, H, cx, cy, sc, t, who) {
  const M = SUSMAP, g = S.g, me = g.me, P = patterns(ctx);
  ctx.fillStyle = '#15122b'; ctx.fillRect(0, 0, W, H);
  SU.stars.forEach(([x, y, s, z]) => { const px = ((x * 1600 - cx * sc * .15 * z) % 1600 + 1600) % 1600 / 1600 * W, py = ((y * 1000 - cy * sc * .15 * z) % 1000 + 1000) % 1000 / 1000 * H; ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(t / 900 + x * 40)); ctx.fillStyle = '#f3ead8'; ctx.fillRect(px, py, s, s); });
  ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  const vx0 = cx - W / 2 / sc - 200, vx1 = cx + W / 2 / sc + 200, vy0 = cy - H / 2 / sc - 200, vy1 = cy + H / 2 / sc + 200;
  const inView = (x, y, w = 0, h = 0) => x + w > vx0 && x < vx1 && y + h > vy0 && y < vy1;
  // ظل السفينة والجدران
  ctx.save(); ctx.translate(16, 18); shipPath(ctx, 14); ctx.fillStyle = '#0b0918'; ctx.fill(); ctx.restore();
  shipPath(ctx, 14); ctx.fillStyle = '#16130f'; ctx.fill();
  // الأرضيات
  M.halls.forEach(q => { ctx.fillStyle = P.grate; ctx.fillRect(q.x, q.y, q.w, q.h); });
  M.rooms.forEach(q => { if (!inView(q.x, q.y, q.w, q.h)) return; ctx.fillStyle = q.f; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.fillStyle = P.tile; ctx.fillRect(q.x, q.y, q.w, q.h); });
  // وجه الجدار الفوقي
  WALLS.forEach(w => { if (!inView(w.x, w.y, w.w, 50)) return; ctx.fillStyle = shade(w.f.startsWith('#') ? w.f : '#cfc9bd', .62); ctx.fillRect(w.x, w.y, w.w, 46); ctx.fillStyle = shade(w.f.startsWith('#') ? w.f : '#cfc9bd', .5); ctx.fillRect(w.x, w.y + 40, w.w, 6); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(w.x, w.y + 6, w.w, 4); });
  // أسماء الغرف
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '400 46px Lalezar, Tajawal, sans-serif'; ctx.fillStyle = 'rgba(22,19,15,.22)';
  M.rooms.forEach(q => { if (inView(q.x, q.y, q.w, q.h)) ctx.fillText(q.name, q.x + q.w / 2, q.y + 58); });
  // الفتحات
  M.vents.flat().forEach(v => { if (!inView(v.x - 40, v.y - 30, 80, 60)) return; ctx.fillStyle = '#9aa0ab'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 4; rrect(ctx, v.x - 32, v.y - 20, 64, 40, 8); ctx.fill(); ctx.stroke(); ctx.lineWidth = 3.5; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(v.x - 21, v.y + i * 9); ctx.lineTo(v.x + 21, v.y + i * 9); } ctx.stroke(); });
  // لوحات المهام
  M.tasks.forEach(tk => { if (!inView(tk.x - 30, tk.y - 30, 60, 60)) return; ctx.fillStyle = '#5b6170'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 4; rrect(ctx, tk.x - 22, tk.y - 17, 44, 34, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7ee0a8'; ctx.fillRect(tk.x - 14, tk.y - 10, 28, 12); });
  // شاشة الكاميرات
  { const [x, y] = M.camSpot; ctx.fillStyle = 'rgba(126,224,168,.25)'; ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fill(); }
  // الكاميرات (تولّع أحمر لما أحد يتفرّج)
  M.cams.forEach(c => { if (!inView(c.x - 30, c.y - 70, 60, 60)) return; ctx.fillStyle = '#5b6170'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 4; rrect(ctx, c.x - 20, c.y - 62, 40, 24, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = g.camsOn && Math.floor(t / 400) % 2 ? '#ff3b2f' : '#3b372f'; ctx.beginPath(); ctx.arc(c.x + 10, c.y - 50, 5, 0, 7); ctx.fill(); });
  // مكان التصليح وقت التخريب
  if (g.sabo) {
    const pts = g.sabo.k === 'lights' ? [M.fix.lights] : M.fix.reactor, on = Math.floor(t / 300) % 2;
    pts.forEach((p, i) => { ctx.fillStyle = '#5b6170'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 4; rrect(ctx, p[0] - 26, p[1] - 20, 52, 40, 7); ctx.fill(); ctx.stroke(); const held = g.sabo.k === 'reactor' && (i ? g.sabo.b : g.sabo.a); ctx.fillStyle = held ? '#7ee0a8' : on ? '#e8362d' : '#7a1d18'; ctx.beginPath(); ctx.arc(p[0], p[1], 10, 0, 7); ctx.fill(); });
  }
  // علامات مهامي
  if (me && !me.imp) me.tasks.forEach(x => { if (x.done) return; const tk = STASK[x.id]; mark(ctx, tk.x, tk.y - 52 + Math.sin(t / 220) * 6, '#ffc928', '!'); });
  // الجثث
  SU.bodies.forEach(([id, x, y]) => { if (who(x, y)) drawBody(ctx, x, y, scol(id)); });
  // الأثاث واللاعبين بالترتيب (اللي تحت يغطي اللي فوقه)
  const list = M.obs.filter(o => inView(o.t === 'c' ? o.x - o.r : o.x, o.t === 'c' ? o.y - o.r : o.y, o.t === 'c' ? o.r * 2 : o.w, o.t === 'c' ? o.r * 2 : o.h)).map(o => ({ o, y: o.t === 'c' ? o.y : o.y + o.h * .55 }));
  Object.entries(SU.oth).forEach(([id, o]) => { if (who(o.x, o.y, o.gh)) list.push({ p: { id, ...o }, y: o.y }); });
  if (SU.me && me && who(SU.me.x, SU.me.y, !me.alive, true)) list.push({ p: { id: S.me, x: SU.me.x, y: SU.me.y, dir: SU.me.dir, ph: SU.me.ph, gh: !me.alive }, y: SU.me.y });
  list.sort((a, b) => a.y - b.y).forEach(it => {
    if (it.o) return drawObs(ctx, it.o, t);
    const o = it.p;
    // الدرع: يشوفه الدكتور واللي عليه الدرع
    if (me && ((o.id === S.me && me.shield) || me.shieldOn === o.id)) { ctx.save(); ctx.strokeStyle = 'rgba(80,200,255,.9)'; ctx.fillStyle = 'rgba(80,200,255,.18)'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t / 30; ctx.beginPath(); ctx.arc(o.x, o.y - 4, 44, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
    drawGuy(ctx, o.x, o.y, scol(o.id), o.dir || 1, o.ph, o.gh, t);
    const imp = me && me.imp && g.imps.includes(o.id);
    ctx.font = '700 18px Tajawal, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.lineWidth = 5; ctx.strokeStyle = '#16130f'; ctx.globalAlpha = o.gh ? .6 : 1;
    const nm = sname(o.id); ctx.strokeText(nm, o.x, o.y - 50); ctx.fillStyle = imp ? '#ff6b5e' : '#fff'; ctx.fillText(nm, o.x, o.y - 50); ctx.globalAlpha = 1;
  });
  // جزيئات
  const now = performance.now();
  SU.fx = SU.fx.filter(f => now - f.t0 < f.life);
  SU.fx.forEach(f => { const k = (now - f.t0) / f.life, dt = (now - f.t0) / 1000; ctx.globalAlpha = 1 - k; ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(f.x + f.vx * dt, f.y + f.vy * dt + 40 * dt * dt, f.r * (1 - k * .5), 0, 7); ctx.fill(); });
  ctx.globalAlpha = 1;
  ctx.restore();
}

// مضلّع الرؤية: أشعة من مكاني لين تصدم جدار
function visPoly(x, y, rad) {
  const pts = [], N = 300;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
    let d = 0;
    while (d < rad) { const nd = d + 10; if (!SUSMAP.open(x + dx * nd, y + dy * nd)) { d = nd + 16; break; } d = nd; }
    d = Math.min(d, rad);
    pts.push([x + dx * d, y + dy * d]);
  }
  return pts;
}

// ---------- البناء ----------
function susBuild(body) {
  body.dataset.built = 'sus';
  SU.me = null; SU.oth = {}; SU.bodies = []; SU.task = null; SU.map = false; SU.cams = false; SU.fx = []; SU.seenBodies = new Set();
  body.innerHTML = `<div class="susw" id="susW">
    <canvas id="sCv"></canvas>
    <div id="sVig" class="svig"></div>
    <div class="shud">
      <div class="sprog"><span>مهام الطاقم</span><div class="sbarO"><i id="sProgI"></i></div></div>
      <details class="stasks" id="sTaskBox" open><summary id="sTaskSum">مهامك</summary><div id="sTasks"></div></details>
    </div>
    <button type="button" class="sbtn smap" id="sMapB" title="الخريطة (M)">🗺️<b>الخريطة</b></button>
    <div id="sBanner" class="sbanner" hidden></div>
    <button type="button" class="skillbig" id="sKillB" title="اقتل (Q)"><span>🔪</span><b>اقتل</b><i></i></button>
    <div class="sbtns">
      <button type="button" class="sbtn big yel" id="sUseB" title="استخدم (E / مسافة)">✋<b>استخدم</b></button>
      <button type="button" class="sbtn red" id="sRepB" title="بلّغ (R)">📢<b>بلّغ</b></button>
      <button type="button" class="sbtn imp" id="sVentB" title="فتحة (V)">🕳️<b>فتحة</b></button>
      <button type="button" class="sbtn imp" id="sSaboB" title="تخريب">⚡<b>تخريب</b><i></i></button>
      <button type="button" class="sbtn doc" id="sShieldB" title="درع (F)">🛡️<b>درع</b></button>
    </div>
    <div id="sSaboMenu" class="ssabomenu" hidden><button type="button" data-k="lights">💡 طفّ الكهرباء</button><button type="button" data-k="reactor">☢️ فجّر المفاعل</button></div>
    <div id="sJoy" class="sjoy" hidden><i></i></div>
    <div id="sMapBox" class="smapbox" hidden><canvas id="sMapCv"></canvas><small>اضغط بأي مكان عشان تسكّر</small></div>
    <div id="sCams" class="scams" hidden><div class="scamhead"><b>📹 الكاميرات</b><button type="button" class="sx" id="sCamX">✕</button></div><div class="scamgrid">${SUSMAP.cams.map((c, i) => `<div class="scam"><canvas data-i="${i}"></canvas><span>${c.n}</span><em>● REC</em></div>`).join('')}</div></div>
    <div id="sTaskM" class="stask" hidden></div>
    <div id="sIntro" class="sfull" hidden></div>
    <div id="sSplash" class="ssplash" hidden></div>
    <div id="sMeet" class="smeet" hidden></div>
    <div id="sEject" class="sfull seject" hidden></div>
    <div id="sKilled" class="sfull skilled" hidden></div>
  </div>`;
  const cv = $('#sCv');
  cv.addEventListener('pointerdown', e => { if (SU.task || !sg()) return; cv.setPointerCapture(e.pointerId); SU.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; drawJoy(); });
  cv.addEventListener('pointermove', e => { const j = SU.joy; if (!j || j.id !== e.pointerId) return; let dx = e.clientX - j.ox, dy = e.clientY - j.oy; const d = Math.hypot(dx, dy); if (d > 60) { dx *= 60 / d; dy *= 60 / d; } j.dx = dx; j.dy = dy; drawJoy(); });
  const up = e => { if (SU.joy && SU.joy.id === e.pointerId) { SU.joy = null; drawJoy(); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  $('#sMapB').onclick = () => toggleMap();
  $('#sMapBox').onclick = () => toggleMap(false);
  $('#sUseB').onclick = susUse;
  $('#sRepB').onclick = () => SU.act.body && send({ t: 'report', id: SU.act.body });
  $('#sKillB').onclick = () => SU.act.kill && send({ t: 'kill', id: SU.act.kill });
  $('#sVentB').onclick = () => SU.act.vent && send({ t: 'vent' });
  $('#sShieldB').onclick = () => SU.act.shield && send({ t: 'shield', id: SU.act.shield });
  $('#sSaboB').onclick = () => { if (SU.act.sabo) $('#sSaboMenu').hidden = !$('#sSaboMenu').hidden; };
  $$('#sSaboMenu button').forEach(b => b.onclick = () => { send({ t: 'sabo', k: b.dataset.k }); $('#sSaboMenu').hidden = true; });
  $('#sCamX').onclick = closeCams;
  if (innerWidth < 640) $('#sTaskBox').open = false;
  if (!SU.loop) { SU.loop = true; SU.lt = performance.now(); requestAnimationFrame(susFrame); }
}
function toggleMap(v) { SU.map = v === undefined ? !SU.map : v; const mb = $('#sMapBox'); if (mb) mb.hidden = !SU.map; }
function closeCams() { if (SU.cams) { SU.cams = false; send({ t: 'cams', on: false }); } const c = $('#sCams'); if (c) c.hidden = true; }
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
  if (k === 'f' || k === 'ب') SU.act.shield && send({ t: 'shield', id: SU.act.shield });
  if (k === 'm' || k === 'ة') toggleMap();
  if (k === 'escape') { closeTask(); closeCams(); toggleMap(false); }
});
addEventListener('keyup', e => { delete SU.keys[e.key.toLowerCase()]; });
addEventListener('blur', () => { SU.keys = {}; });

function susUse() {
  const a = SU.act;
  if (a.task) return openTask(a.task);
  if (a.cams) { SU.cams = true; send({ t: 'cams', on: true }); $('#sCams').hidden = false; sfx('pop'); return; }
  if (a.button) return send({ t: 'button' });
  if (a.fix) { send({ t: 'fix' }); if (a.fix === 'reactor') { clearInterval(SU.fixing); SU.fixing = setInterval(() => { if (!SU.act.fix || !sg() || !sg().sabo) { clearInterval(SU.fixing); SU.fixing = 0; return; } send({ t: 'fix' }); }, 350); } }
}

// ---------- الحلقة ----------
function susFrame(t) {
  if (!sg() || S.phase === 'lobby' || !$('#sCv')) { SU.loop = false; clearInterval(SU.fixing); SU.fixing = 0; return; }
  requestAnimationFrame(susFrame);
  const dt = Math.min(.05, (t - SU.lt) / 1000); SU.lt = t;
  const g = S.g, me = g.me, M = SUSMAP;
  if (SU.me && me && g.sub === 'play' && S.phase === 'play' && !SU.task && !SU.map && !SU.cams) {
    let vx = 0, vy = 0; const K = SU.keys;
    if (K.arrowleft || K.a || K['ش']) vx--; if (K.arrowright || K.d || K['ي']) vx++;
    if (K.arrowup || K.w || K['ص']) vy--; if (K.arrowdown || K.s || K['س']) vy++;
    if (SU.joy && Math.hypot(SU.joy.dx, SU.joy.dy) > 8) { vx = SU.joy.dx / 60; vy = SU.joy.dy / 60; }
    const l = Math.hypot(vx, vy);
    if (l > 0) {
      if (l > 1) { vx /= l; vy /= l; }
      const free = !me.alive, p = SU.me, nx = p.x + vx * SR.SPEED * dt, ny = p.y + vy * SR.SPEED * dt;
      if (M.walk(nx, p.y, free)) p.x = nx; if (M.walk(p.x, ny, free)) p.y = ny;
      if (vx) p.dir = vx > 0 ? 1 : -1; p.ph += dt * 13;
    } else SU.me.ph = 0;
    if ((SU.me.x !== SU.lastX || SU.me.y !== SU.lastY) && t - SU.sent > 66) { SU.sent = t; SU.lastX = SU.me.x; SU.lastY = SU.me.y; send({ t: 'mv', x: Math.round(SU.me.x * 10) / 10, y: Math.round(SU.me.y * 10) / 10 }); }
  }
  Object.values(SU.oth).forEach(o => { const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy); const k = Math.min(1, dt * 12); o.x += dx * k; o.y += dy * k; if (Math.abs(dx) > .5) o.dir = dx > 0 ? 1 : -1; o.ph = d > 1 ? o.ph + dt * 13 : 0; });
  susDraw(t);
  if (SU.cams) drawCams(t);
  if (SU.map) susMap(t);
  if (t - SU.hud > 150) { SU.hud = t; susHud(); }
}

function susDraw(t) {
  const cv = $('#sCv'), g = S.g, M = SUSMAP; if (!cv) return;
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const me = g.me, follow = SU.me && me, alive = follow && me.alive && S.phase === 'play';
  let sc, cx, cy;
  if (follow) { sc = Math.max(.55, Math.min(1.2, Math.sqrt(W * H) / 900)); cx = SU.me.x; cy = SU.me.y; }
  else { sc = Math.min(W / M.W, H / M.H) * .96; cx = M.W / 2; cy = M.H / 2; }
  const rad = !alive ? 0 : me.imp ? SR.IMP : g.sabo && g.sabo.k === 'lights' ? SR.DARK : SR.VIS;
  const who = (x, y, gh, self) => self || !alive || (!gh && Math.hypot(x - SU.me.x, y - SU.me.y) <= rad && M.see(SU.me.x, SU.me.y, x, y));
  drawWorld(ctx, W, H, cx, cy, sc, t, who);
  // الظلام: كل شي برا نظرك (الغرف الثانية) يصير مظلم
  if (alive) {
    if (!SU.fog) SU.fog = document.createElement('canvas');
    const F = SU.fog; if (F.width !== cv.width || F.height !== cv.height) { F.width = cv.width; F.height = cv.height; }
    const f = F.getContext('2d'); f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, W, H); f.fillStyle = 'rgba(8,6,18,.9)'; f.fillRect(0, 0, W, H);
    f.globalCompositeOperation = 'destination-out';
    const poly = visPoly(SU.me.x, SU.me.y, rad), toS = (x, y) => [W / 2 + (x - cx) * sc, H / 2 + (y - cy) * sc];
    const gr = f.createRadialGradient(W / 2, H / 2, rad * sc * .7, W / 2, H / 2, rad * sc);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    f.fillStyle = gr; f.beginPath(); poly.forEach(([x, y], i) => { const [a, b] = toS(x, y); i ? f.lineTo(a, b) : f.moveTo(a, b); }); f.closePath(); f.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(F, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // أسهم على طرف الشاشة للمهام والتخريب
  if (follow && g.sub === 'play') {
    const tg = [];
    if (me && !me.imp) me.tasks.forEach(x => { if (!x.done) tg.push([STASK[x.id].x, STASK[x.id].y, '#ffc928']); });
    if (g.sabo) (g.sabo.k === 'lights' ? [M.fix.lights] : M.fix.reactor).forEach(p => tg.push([p[0], p[1], '#e8362d']));
    tg.forEach(([x, y, col]) => {
      const sx = W / 2 + (x - cx) * sc, sy = H / 2 + (y - cy) * sc;
      if (sx > 20 && sx < W - 20 && sy > 20 && sy < H - 20) return;
      const a = Math.atan2(sy - H / 2, sx - W / 2), m = 30, k = Math.min((W / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (H / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
      ctx.save(); ctx.translate(W / 2 + Math.cos(a) * k, H / 2 + Math.sin(a) * k); ctx.rotate(a);
      ctx.fillStyle = col; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    });
  }
}
function drawCams(t) {
  $$('#sCams canvas').forEach(cv => {
    const i = +cv.dataset.i, c = SUSMAP.cams[i], dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sc = Math.min(W, H) / (SUSMAP.camR * 1.6);
    drawWorld(ctx, W, H, c.x, c.y - 30, sc, t, (x, y, gh) => !gh && Math.hypot(x - c.x, y - c.y) <= SUSMAP.camR && SUSMAP.see(c.x, c.y, x, y));
    ctx.fillStyle = 'rgba(126,224,168,.07)'; for (let y = (t / 20) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 2);
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.65)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  });
}
function susMap(t) {
  const cv = $('#sMapCv'), g = S.g, M = SUSMAP; if (!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const rot = H > W * 1.15, sc = (rot ? Math.min(H / M.W, W / M.H) : Math.min(W / M.W, H / M.H)) * .95;
  ctx.save(); ctx.translate(W / 2, H / 2); if (rot) ctx.rotate(Math.PI / 2); ctx.scale(sc, sc); ctx.translate(-M.W / 2, -M.H / 2);
  const label = (s, x, y) => { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(-Math.PI / 2); ctx.fillText(s, 0, 0); ctx.restore(); };
  shipPath(ctx, 16); ctx.fillStyle = '#16130f'; ctx.fill(); shipPath(ctx, 0); ctx.fillStyle = '#cfc9bd'; ctx.fill();
  M.rooms.forEach(q => { ctx.fillStyle = q.f; ctx.fillRect(q.x, q.y, q.w, q.h); });
  ctx.fillStyle = '#16130f'; ctx.font = '400 ' + (rot ? 90 : 72) + 'px Lalezar, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  M.rooms.forEach(q => label(q.name, q.x + q.w / 2, q.y + q.h / 2));
  if (g.me && !g.me.imp) g.me.tasks.forEach(x => { if (!x.done) { const tk = STASK[x.id]; ctx.fillStyle = '#ffc928'; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(tk.x, tk.y, 40, 0, 7); ctx.fill(); ctx.stroke(); } });
  if (g.sabo && Math.floor(t / 300) % 2) (g.sabo.k === 'lights' ? [M.fix.lights] : M.fix.reactor).forEach(p => { ctx.fillStyle = '#e8362d'; ctx.beginPath(); ctx.arc(p[0], p[1], 56, 0, 7); ctx.fill(); });
  if (SU.me) { const r = 46 + Math.sin(t / 200) * 8; ctx.fillStyle = SCOL[g.me ? g.me.c : 0]; ctx.strokeStyle = '#16130f'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(SU.me.x, SU.me.y, r, 0, 7); ctx.fill(); ctx.stroke(); }
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
      if (!a.task && near(M.camSpot[0], M.camSpot[1], SR.CAM)) a.cams = 1;
      if (!a.task && near(M.button[0], M.button[1], SR.BTN) && me.btn > 0 && !g.sabo && sleft(g.btnIn) <= 0) a.button = 1;
      if (g.sabo) { if (g.sabo.k === 'lights' ? near(M.fix.lights[0], M.fix.lights[1], SR.USE) : M.fix.reactor.some(f => near(f[0], f[1], SR.USE))) a.fix = g.sabo.k; }
      const bd = SU.bodies.find(([, x, y]) => near(x, y, SR.REPORT) && M.see(p.x, p.y, x, y)); if (bd) a.body = bd[0];
      const others = Object.entries(SU.oth).filter(([, o]) => !o.gh).sort((x, y) => Math.hypot(x[1].x - p.x, x[1].y - p.y) - Math.hypot(y[1].x - p.x, y[1].y - p.y));
      if (me.imp) {
        if (sleft(me.killIn) <= 0) { const v = others.find(([id, o]) => !g.imps.includes(id) && near(o.x, o.y, SR.KILL)); if (v) a.kill = v[0]; }
        if (M.vents.flat().some(v => near(v.x, v.y, SR.VENT))) a.vent = 1;
        if (!g.sabo && sleft(g.saboIn) <= 0) a.sabo = 1;
      }
      if (me.role === 'doc' && !me.docUsed) { const v = others.find(([, o]) => near(o.x, o.y, SR.SHIELD)); if (v) a.shield = v[0]; }
    }
  }
  const imp = me && me.imp && me.alive, doc = me && me.role === 'doc' && me.alive;
  $$('#susW .sbtn.imp').forEach(b => b.hidden = !imp);
  $('#sKillB').hidden = !imp; $('#sShieldB').hidden = !doc;
  $('#sRepB').hidden = !(me && me.alive);
  const useB = $('#sUseB'), canUse = !!(a.task || a.button || a.fix || a.cams);
  useB.disabled = !canUse;
  useB.querySelector('b').textContent = a.task ? 'سوّ المهمة' : a.cams ? 'الكاميرات' : a.button ? 'اجتماع طارئ' : a.fix ? (a.fix === 'reactor' && SU.fixing ? 'ماسك…' : 'صلّح') : 'استخدم';
  useB.classList.toggle('on', canUse);
  $('#sRepB').disabled = !a.body; $('#sRepB').classList.toggle('on', !!a.body);
  $('#sKillB').disabled = !a.kill; $('#sKillB').classList.toggle('on', !!a.kill);
  $('#sVentB').disabled = !a.vent; $('#sSaboB').disabled = !a.sabo;
  $('#sShieldB').disabled = !a.shield; $('#sShieldB').classList.toggle('on', !!a.shield);
  if (doc) $('#sShieldB b').textContent = me.docUsed ? 'استخدمته' : 'درع';
  if (imp) {
    const kl = Math.ceil(sleft(me.killIn) / 1000), sl = Math.ceil(sleft(g.saboIn) / 1000);
    $('#sKillB i').textContent = kl > 0 && play ? kl : ''; $('#sSaboB i').textContent = sl > 0 && play && !g.sabo ? sl : '';
  }
  if (!a.sabo) $('#sSaboMenu').hidden = true;
  if (SU.cams && (!a.cams || !play)) closeCams();
  const bn = $('#sBanner'), vig = $('#sVig');
  vig.className = 'svig' + (g.sabo && play ? ' on' : '');
  if (g.sabo && play) {
    bn.hidden = false; bn.className = 'sbanner ' + g.sabo.k;
    bn.textContent = g.sabo.k === 'lights' ? '💡 الكهرباء طافية! روحوا صلّحوها بغرفة الكهرباء' : `☢️ المفاعل بينفجر بعد ${Math.ceil(sleft(g.sabo.left) / 1000)} — لازم اثنين يمسكون اللوحتين بالمفاعل مع بعض`;
  } else if (me && !me.alive && play) { bn.hidden = false; bn.className = 'sbanner ghost'; bn.textContent = me.imp ? '👻 أنت ميت — تفرّج على الباقين' : '👻 أنت ميت — كمّل مهامك عشان يفوز الطاقم'; }
  else if (doc && play && !me.docUsed) { bn.hidden = false; bn.className = 'sbanner docb'; bn.textContent = '🩺 قرّب من أحد واضغط «درع» — يحميه من القتل لين الاجتماع الجاي'; }
  else bn.hidden = true;
}

// ---------- تحديث الحالة ----------
function renderSus(body) {
  if (body.dataset.built !== 'sus' || !$('#sCv')) susBuild(body);
  if (!SU.loop) { SU.loop = true; SU.lt = performance.now(); requestAnimationFrame(susFrame); }
  const g = S.g, me = g.me;
  const pr = g.prog[1] ? Math.round(g.prog[0] / g.prog[1] * 100) : 0;
  $('#sProgI').style.width = pr + '%';
  const room = id => esc(SUSMAP.roomAt(STASK[id].x, STASK[id].y));
  if (me && me.imp) { $('#sTaskSum').textContent = '😈 أنت المندس'; $('#sTasks').innerHTML = `<p class="sfake">اقتل الطاقم وخرّب بدون ما تنكشف.${g.imps.length > 1 ? ' شركاك: <b>' + esc(g.imps.filter(i => i !== S.me).map(sname).join('، ')) + '</b>' : ''}</p><p class="sfake muted">مهام وهمية للتمويه:</p>` + me.tasks.map(x => `<div class="st fake">${esc(STASK[x.id].name)} <small>(${room(x.id)})</small></div>`).join(''); }
  else if (me) { const d = me.tasks.filter(x => x.done).length; $('#sTaskSum').textContent = `${me.role === 'doc' ? '🩺 ' : ''}مهامك ${d}/${me.tasks.length}`; $('#sTasks').innerHTML = me.tasks.map(x => `<div class="st${x.done ? ' done' : ''}">${x.done ? '✔' : '•'} ${esc(STASK[x.id].name)} <small>(${room(x.id)})</small></div>`).join(''); }
  else { $('#sTaskSum').textContent = 'تتفرّج 👁'; $('#sTasks').innerHTML = ''; }
  if (g.sub !== 'play') { closeTask(); closeCams(); }
  if (me && SU.task && me.tasks.find(x => x.id === SU.task.id && x.done)) closeTask();
  renderSusOverlays();
  susFx();
  susHud();
}

function renderSusOverlays() {
  const g = sg(); if (!g || !$('#sIntro')) return;
  const me = g.me, over = S.phase === 'over';
  // البداية: 🤫 وبعدين الدور مع صف اللاعبين
  const intro = $('#sIntro'); intro.hidden = g.sub !== 'intro';
  const ik = JSON.stringify([g.col, me && me.role]);
  if (!intro.hidden && intro.dataset.k !== ik) {
    intro.dataset.k = ik;
    const imp = me && me.imp, doc = me && me.role === 'doc';
    const team = imp ? g.imps : S.players.filter(p => g.col[p.id] != null).map(p => p.id);
    const line = [...team].sort((a, b) => (a === S.me ? -1 : b === S.me ? 1 : 0));
    const ord = []; line.forEach((id, i) => { i % 2 ? ord.push(id) : ord.unshift(id); });
    intro.innerHTML = `<div class="shush">🤫</div><div class="sintro ${imp ? 'imp' : doc ? 'doc' : 'crew'}">
      <h2>${!me ? 'تتفرّج 👁' : imp ? 'مندس' : doc ? 'دكتور 🩺' : 'طاقم'}</h2>
      <p>${!me ? '' : imp ? (g.imps.length > 1 ? 'أنت وشركاك المندسين — اقتلوا بدون ما ينكشفون' : 'أنت المندس — اقتلهم واحد واحد بدون ما يشوفك أحد') : doc ? 'أنت من الطاقم، وتقدر تعطي درع لشخص واحد كل جولة' : `بينكم ${g.nImp === 1 ? 'مندس واحد' : g.nImp === 2 ? 'مندسين اثنين' : '٣ مندسين'}… خلّص مهامك وانتبه`}</p>
      <div class="sline">${ord.map((id, i) => `<div class="sl${id === S.me ? ' me' : ''}" style="animation-delay:${1.3 + Math.abs(i - (ord.length - 1) / 2) * .12}s">${guySvg(g.col[id])}<b>${esc(sname(id))}</b></div>`).join('')}</div></div>`;
    sfx('alarm');
  }
  if (intro.hidden) intro.dataset.k = '';
  // انقتلت
  const kd = $('#sKilled'), kOn = SU.killedFx && Date.now() - SU.killedFx < 2800;
  kd.hidden = !kOn;
  if (kOn && kd.dataset.k !== String(SU.killedFx)) { kd.dataset.k = String(SU.killedFx); kd.innerHTML = `<div class="skill"><div class="kk">${guySvg(SU.killer)}</div><span class="knife">🔪</span><div class="kv">${guySvg(me ? me.c : 0, true)}</div></div><h2>انقتلت!</h2><p>تقدر تكمّل مهامك كشبح 👻</p>`; setTimeout(renderSusOverlays, 2900); }
  // الاجتماع: أول ثانيتين شاشة الإنذار وبعدين التصويت
  const inMeet = g.sub === 'meet' && g.meet;
  const sp = $('#sSplash'), splashOn = inMeet && g.meet.sub === 'talk' && sleft(2200 - g.meet.ago) > 0;
  sp.hidden = !splashOn;
  if (splashOn && sp.dataset.k !== g.meet.by + g.round) {
    sp.dataset.k = g.meet.by + g.round;
    sp.innerHTML = g.meet.body ? `<div class="spbox body"><div class="spicon">${guySvg(scol(g.meet.body), true)}</div><h2>جثة!</h2><p>${esc(sname(g.meet.by))} بلّغ</p></div>` : `<div class="spbox"><div class="spicon">🚨</div><h2>اجتماع طارئ!</h2><p>${esc(sname(g.meet.by))} ضغط الزر</p></div>`;
    setTimeout(renderSusOverlays, Math.max(50, sleft(2200 - g.meet.ago) + 30));
  }
  const mt = $('#sMeet'); mt.hidden = !inMeet || splashOn;
  if (!mt.hidden) drawMeet(mt);
  else { SU.pick = null; mt.dataset.k = ''; }
  // الطرد
  const ej = $('#sEject'); ej.hidden = !(g.sub === 'eject' && g.eject) || over;
  if (!ej.hidden && ej.dataset.k !== g.eject.text + g.round) {
    ej.dataset.k = g.eject.text + g.round; const e = g.eject;
    ej.innerHTML = `${e.id ? `<div class="sfloat">${guySvg(scol(e.id))}</div>` : ''}<h2 class="stype"></h2><p class="sleft">${e.id ? `باقي ${e.left} ${e.left === 1 ? 'مندس' : 'مندسين'}` : ''}</p>`;
    const h = ej.querySelector('.stype'), chars = [...e.text]; let i = 0;
    clearInterval(SU.typeIv); SU.typeIv = setInterval(() => { h.textContent = chars.slice(0, ++i).join(''); if (i % 3 === 0) sfx('tick'); if (i >= chars.length) clearInterval(SU.typeIv); }, 55);
  }
}
function drawMeet(el) {
  const g = S.g, m = g.meet, me = g.me, canVote = me && me.alive && m.sub === 'vote' && !m.mine && S.phase === 'play';
  const secs = Math.ceil(sleft(S.left) / 1000), reveal = m.sub === 'reveal';
  const key = [m.sub, m.voted.length, m.mine, SU.pick, me && me.alive, g.dead.length].join('|');
  if (el.dataset.k === key) { const c = el.querySelector('.scd'); if (c) c.textContent = secs; return; }
  const first = !el.dataset.k; el.dataset.k = key;
  const head = m.body ? `💀 ${esc(sname(m.by))} لقى جثة ${esc(sname(m.body))}` : `🚨 ${esc(sname(m.by))} سوّى اجتماع طارئ`;
  const tally = m.tally || {}, maxV = Math.max(0, ...Object.entries(tally).filter(([k]) => k !== 'skip').map(([, v]) => v.length));
  const dots = (arr, base) => (arr || []).map((w, i) => `<span class="vdot" style="background:${SCOL[scol(w)]};animation-delay:${base + i * .22}s"></span>`).join('');
  let n = 0;
  const ppl = S.players.filter(p => g.col[p.id] != null).map((p, i) => {
    const dead = g.dead.includes(p.id), voted = m.voted.includes(p.id), imp = me && me.imp && g.imps.includes(p.id);
    const tv = tally[p.id] || [], top = reveal && tv.length && tv.length === maxV;
    const base = reveal ? (n += 0) : 0; if (reveal) n += tv.length * .22;
    return `<button type="button" class="svote${dead ? ' dead' : ''}${SU.pick === p.id ? ' pick' : ''}${m.mine === p.id ? ' mine' : ''}${top ? ' vtop' : ''}${first ? ' in' : ''}" style="--d:${i * .05}s" data-id="${p.id}"${!canVote || dead ? ' disabled' : ''}>${guySvg(g.col[p.id], dead)}<div class="vinfo"><b class="${imp ? 'simp' : ''}">${esc(p.name)}${p.id === S.me ? ' (أنت)' : ''}</b>${reveal ? `<div class="vdots">${dots(tv, base)}</div>` : ''}</div>${voted && !reveal ? '<i class="vok">✔ صوّت</i>' : ''}${p.id === m.by ? '<em>📢</em>' : ''}${m.mine === p.id ? '<u class="stamp">صوتي</u>' : ''}</button>`;
  }).join('');
  const skipDots = reveal ? `<div class="sskip"><b>تخطّي:</b> <span class="vdots">${dots(tally.skip, n)}</span></div>` : '';
  el.innerHTML = `<div class="smeetbox${first ? ' in' : ''}"><h2>${head}</h2><p class="stimer">${reveal ? 'نكشف الأصوات…' : m.sub === 'talk' ? `نقاش… التصويت يبدأ بعد <b class="scd">${secs}</b>` : `صوّتوا! باقي <b class="scd">${secs}</b>`}</p>
    <div class="svotes">${ppl}</div>${skipDots}
    <div class="smeetfoot">${canVote ? `<button type="button" class="btn sm" id="sSkip">تخطّي ⏭</button>${SU.pick ? `<button type="button" class="btn sm red pulse" id="sConfirm">أطرد ${esc(sname(SU.pick))}؟ ✔</button>` : ''}` : reveal ? '' : m.mine ? `<span>صوّت على: <b>${m.mine === 'skip' ? 'تخطّي' : esc(sname(m.mine))}</b></span>` : me && !me.alive ? '<span>الأموات ما يصوّتون 👻</span>' : m.sub === 'talk' ? '<span>تناقشوا بالشات 💬 أو بالديسكورد</span>' : ''}</div></div>`;
  el.querySelectorAll('.svote').forEach(b => b.onclick = () => { if (!canVote) return; SU.pick = SU.pick === b.dataset.id ? null : b.dataset.id; sfx('tick'); drawMeet(el); });
  const sk = el.querySelector('#sSkip'); if (sk) sk.onclick = () => { SU.pick = null; send({ t: 'vote', v: 'skip' }); };
  const cf = el.querySelector('#sConfirm'); if (cf) cf.onclick = () => { const v = SU.pick; SU.pick = null; send({ t: 'vote', v }); };
  if (reveal && !SU.revealSnd) { SU.revealSnd = 1; const total = Object.values(tally).reduce((a, v) => a + v.length, 0); for (let i = 0; i < total; i++) setTimeout(() => sfx('card'), i * 220); }
  if (!reveal) SU.revealSnd = 0;
}
setInterval(() => { const g = sg(); if (g && g.sub === 'meet') { const c = $('#sMeet .scd'); if (c) c.textContent = Math.ceil(sleft(S.left) / 1000); } if (g && g.sabo && g.sabo.k === 'reactor' && S.phase === 'play' && g.sub === 'play' && (!SU.alarmT || Date.now() - SU.alarmT > 1000)) { SU.alarmT = Date.now(); sfx('alarm2'); } }, 250);

function susFx() {
  const p = prevS, s = S; if (!p || p.game !== 'sus' || !p.g || !s.g) return;
  const g = s.g, pg = p.g;
  if (g.sub !== 'play' && pg.sub === 'play') { toggleMap(false); $('#sSaboMenu').hidden = true; }
  if (g.sub === 'meet' && pg.sub !== 'meet') { sfx('alarm'); closeTask(); SU.oth = {}; SU.bodies = []; SU.fx = []; }
  if (g.meet && pg.meet && g.meet.sub === 'vote' && pg.meet.sub === 'talk') sfx('turn');
  if (g.meet && pg.meet && g.meet.voted.length > pg.meet.voted.length && g.meet.sub === 'vote') sfx('card');
  if (g.sub === 'eject' && pg.sub !== 'eject') sfx(g.eject && g.eject.id ? 'catch' : 'nope');
  if (g.sabo && !pg.sabo) { sfx('alarm2'); }
  if (!g.sabo && pg.sabo && g.sub === 'play') sfx('pop');
  if (g.me && pg.me && g.me.tasks.filter(x => x.done).length > pg.me.tasks.filter(x => x.done).length) { sfx('win'); if (SU.me) { puff(SU.me.x, SU.me.y - 30, '#ffc928', 16); } const b = $('#sProgI'); if (b) b.animate([{ filter: 'brightness(1.8)' }, { filter: 'brightness(1)' }], 900); }
  if (s.phase === 'over' && p.phase === 'play') { const won = g.me && (g.win === 'imp') === !!g.me.imp; setTimeout(() => { sfx(won ? 'unoWin' : 'lose'); if (won && typeof confetti === 'function') confetti(); }, 300); }
}
// لوحة النهاية: صف الفايزين
function susOverHtml(g) {
  const win = S.players.filter(p => g.col[p.id] != null && (g.win === 'imp') === g.imps.includes(p.id));
  return `<div class="sendline">${win.map((p, i) => `<div style="animation-delay:${.2 + i * .12}s">${guySvg(g.col[p.id], g.dead.includes(p.id))}<b>${esc(p.name)}${g.doc === p.id ? ' 🩺' : ''}</b></div>`).join('')}</div><div>${esc(g.why || '')}</div>`;
}

// ---------- المهام (١٠ ألعاب صغيرة) ----------
function closeTask() { SU.task = null; const m = $('#sTaskM'); if (m) { m.hidden = true; m.innerHTML = ''; } clearInterval(SU.taskIv); clearTimeout(SU.taskTo); }
function openTask(id) {
  const tk = STASK[id]; if (!tk || SU.task) return;
  SU.task = { id, t0: Date.now() }; send({ t: 'tstart', id });
  const el = $('#sTaskM'); el.hidden = false;
  el.innerHTML = `<div class="staskbox"><button type="button" class="sx" id="sTX">✕</button><h3>${esc(tk.name)}</h3><div id="sTB" class="stb ${tk.kind}"></div></div>`;
  $('#sTX').onclick = closeTask;
  const B = $('#sTB'), done = () => {
    if (B.dataset.done) return; B.dataset.done = 1;
    const wait = Math.max(0, SMIN[tk.kind] + 200 - (Date.now() - SU.task.t0));
    B.insertAdjacentHTML('beforeend', '<div class="sok">✔</div>'); sfx('uno');
    setTimeout(() => { if (!SU.task || SU.task.id !== id) return; send({ t: 'tdone', id }); setTimeout(closeTask, 500); }, wait);
  };
  const shake = () => B.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], 220);
  const K = tk.kind;
  if (K === 'wires') {
    const C = ['#e8362d', '#2a5bd7', '#ffc928', '#ff6fae'], L = shuffle2([0, 1, 2, 3]), R = shuffle2([0, 1, 2, 3]); let sel = null; const ok = new Set();
    B.innerHTML = `<svg viewBox="0 0 300 220" id="sWv"></svg><div class="wcol l">${L.map(i => `<button type="button" data-c="${i}" style="background:${C[i]}"></button>`).join('')}</div><div class="wcol r">${R.map(i => `<button type="button" data-c="${i}" style="background:${C[i]}"></button>`).join('')}</div><p class="muted">اضغط سلك من اليمين وبعدين نفس اللون باليسار</p>`;
    const draw = () => { $('#sWv').innerHTML = [...ok].map(i => `<line class="wl" x1="285" y1="${L.indexOf(i) * 55 + 27}" x2="15" y2="${R.indexOf(i) * 55 + 27}" stroke="${C[i]}" stroke-width="12" stroke-linecap="round"/>`).join(''); };
    B.querySelectorAll('.wcol.l button').forEach(b => b.onclick = () => { if (ok.has(+b.dataset.c)) return; sel = +b.dataset.c; B.querySelectorAll('.wcol.l button').forEach(x => x.classList.toggle('on', x === b)); });
    B.querySelectorAll('.wcol.r button').forEach(b => b.onclick = () => { if (sel === null) return; if (+b.dataset.c === sel) { ok.add(sel); sfx('pop'); b.classList.add('ok'); B.querySelector(`.wcol.l button[data-c="${sel}"]`).classList.add('ok'); draw(); if (ok.size === 4) done(); } else { sfx('nope'); shake(); } sel = null; B.querySelectorAll('.wcol.l button').forEach(x => x.classList.remove('on')); });
  } else if (K === 'nums') {
    let n = 1; const nums = shuffle2([1, 2, 3, 4, 5, 6, 7, 8]);
    B.innerHTML = `<div class="ngrid">${nums.map(x => `<button type="button" data-n="${x}">${x}</button>`).join('')}</div><p class="muted">اضغط الأرقام بالترتيب من ١ لين ٨</p>`;
    B.querySelectorAll('.ngrid button').forEach(b => b.onclick = () => { if (+b.dataset.n === n) { b.classList.add('ok'); sfx('tick'); if (++n > 8) done(); } else { n = 1; sfx('nope'); shake(); B.querySelectorAll('.ngrid button').forEach(x => x.classList.remove('ok')); } });
  } else if (K === 'swipe') {
    B.innerHTML = `<div class="strack"><div class="scard" id="sCard">💳</div></div><p class="muted">اسحب البطاقة لآخر الشريط</p>`;
    const card = $('#sCard'), tr = card.parentElement; let st = null;
    card.onpointerdown = e => { card.setPointerCapture(e.pointerId); st = { x: e.clientX, w: tr.clientWidth - card.offsetWidth - 8 }; };
    card.onpointermove = e => { if (!st) return; const d = Math.max(0, Math.min(st.w, st.x - e.clientX)); card.style.transform = `translateX(${-d}px)`; if (d >= st.w - 2) { st = null; card.onpointermove = null; card.onpointerdown = null; tr.classList.add('ok'); done(); } };
    card.onpointerup = () => { if (st) { st = null; card.style.transition = 'transform .25s'; card.style.transform = ''; setTimeout(() => { card.style.transition = ''; }, 260); shake(); } };
  } else if (K === 'hold') {
    let v = 0, down = false;
    B.innerHTML = `<div class="sgauge"><i id="sGI"></i><s></s></div><button type="button" class="btn yellow shold" id="sHold">اضغط مطوّل</button>`;
    const hb = $('#sHold'); hb.onpointerdown = e => { down = true; hb.setPointerCapture(e.pointerId); hb.classList.add('dn'); }; hb.onpointerup = hb.onpointercancel = () => { down = false; hb.classList.remove('dn'); };
    SU.taskIv = setInterval(() => { if (!down) return; v = Math.min(100, v + 4); $('#sGI').style.height = v + '%'; if (v >= 100) { clearInterval(SU.taskIv); done(); } }, 100);
  } else if (K === 'wait') {
    let v = 0;
    B.innerHTML = `<div class="swait"><i id="sWI"></i></div><div class="swaitt" id="sWT">جاهز</div><button type="button" class="btn green" id="sGo">ابدأ</button><p class="muted">لا تطلع من النافذة لين يخلص</p>`;
    $('#sGo').onclick = () => { $('#sGo').disabled = true; SU.taskIv = setInterval(() => { v = Math.min(100, v + 2); $('#sWI').style.width = v + '%'; $('#sWT').textContent = v + '%'; if (v >= 100) { clearInterval(SU.taskIv); done(); } }, 100); };
  } else if (K === 'slider') {
    const z = 15 + Math.random() * 55;
    B.innerHTML = `<div class="sslide"><div class="zone" style="left:${z}%"></div><div class="knob" id="sKn"></div></div><p class="muted">حط المؤشر بالمنطقة الخضراء واتركه</p>`;
    const kn = $('#sKn'), tr = kn.parentElement; let st = null, pos = 0;
    kn.onpointerdown = e => { kn.setPointerCapture(e.pointerId); st = { x: e.clientX, p: pos, w: tr.clientWidth - kn.offsetWidth }; };
    kn.onpointermove = e => { if (!st) return; pos = Math.max(0, Math.min(100, st.p + (e.clientX - st.x) / st.w * 100)); kn.style.left = `calc(${pos}% - ${pos / 100 * kn.offsetWidth}px)`; };
    kn.onpointerup = () => { if (!st) return; st = null; const c = pos; if (c >= z - 1 && c <= z + 14) { tr.classList.add('ok'); done(); } else { sfx('nope'); shake(); } };
  } else if (K === 'simon') {
    const seq = Array.from({ length: 4 }, () => Math.random() * 9 | 0); let inp = [], busy = true;
    B.innerHTML = `<div class="ssimon">${[...Array(9).keys()].map(i => `<button type="button" data-i="${i}"></button>`).join('')}</div><p class="muted" id="sSm">احفظ الترتيب…</p>`;
    const bs = [...B.querySelectorAll('.ssimon button')];
    const play = () => { busy = true; inp = []; $('#sSm').textContent = 'احفظ الترتيب…'; seq.forEach((i, k) => { SU.taskTo = setTimeout(() => { bs[i].classList.add('lit'); sfx('tick'); setTimeout(() => bs[i].classList.remove('lit'), 380); if (k === seq.length - 1) setTimeout(() => { busy = false; $('#sSm').textContent = 'عيده بنفس الترتيب'; }, 450); }, 600 + k * 520); }); };
    bs.forEach(b => b.onclick = () => { if (busy) return; const i = +b.dataset.i; b.classList.add('lit'); setTimeout(() => b.classList.remove('lit'), 180); inp.push(i); if (seq[inp.length - 1] !== i) { sfx('nope'); shake(); play(); } else if (inp.length === seq.length) { busy = true; done(); } else sfx('pop'); });
    play();
  } else if (K === 'tap') {
    const em = /نيازك/.test(tk.name) ? '☄️' : /فلتر/.test(tk.name) ? '🍂' : /صناديق/.test(tk.name) ? '📦' : '🦠';
    let left = 7;
    B.innerHTML = `<div class="stap">${[...Array(7)].map((_, i) => `<button type="button" style="left:${8 + Math.random() * 74}%;top:${8 + Math.random() * 70}%;animation-delay:${-Math.random() * 3}s">${em}</button>`).join('')}</div><p class="muted">اضغطها كلها</p>`;
    B.querySelectorAll('.stap button').forEach(b => b.onclick = () => { if (b.classList.contains('gone')) return; b.classList.add('gone'); sfx('pop'); if (--left === 0) done(); });
  } else if (K === 'code') {
    const code = String(10000 + Math.random() * 90000 | 0); let cur = '';
    B.innerHTML = `<div class="scodeN">الرمز: <b>${code}</b></div><div class="scodeS" id="sCS">_____</div><div class="skeys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔'].map(k => `<button type="button" data-k="${k}">${k}</button>`).join('')}</div>`;
    const show = () => { $('#sCS').textContent = cur.padEnd(5, '_'); };
    B.querySelectorAll('.skeys button').forEach(b => b.onclick = () => { const k = b.dataset.k; sfx('tick'); if (k === '⌫') cur = cur.slice(0, -1); else if (k === '✔') { if (cur === code) return done(); sfx('nope'); shake(); cur = ''; } else if (cur.length < 5) cur += k; show(); if (cur === code) done(); });
  } else if (K === 'temp') {
    let cur = 20 + Math.random() * 60 | 0, tg; do { tg = 20 + Math.random() * 60 | 0; } while (Math.abs(tg - cur) < 8);
    B.innerHTML = `<div class="stemp"><div><small>المطلوب</small><b>${tg}°</b></div><div class="now"><small>الحين</small><b id="sTv">${cur}°</b></div></div><div class="stbtns"><button type="button" class="btn" id="sTd">▼</button><button type="button" class="btn" id="sTu">▲</button></div><p class="muted">اضغط مطوّل يتغيّر أسرع</p>`;
    const step = d => { cur += d; $('#sTv').textContent = cur + '°'; $('#sTv').parentElement.classList.toggle('ok', cur === tg); if (cur === tg) { clearInterval(SU.taskIv); done(); } };
    [['#sTd', -1], ['#sTu', 1]].forEach(([s, d]) => { const b = $(s); b.onpointerdown = () => { step(d); sfx('tick'); clearInterval(SU.taskIv); let n = 0; SU.taskIv = setInterval(() => { if (++n > 3) step(d); }, 110); }; b.onpointerup = b.onpointerleave = () => clearInterval(SU.taskIv); });
  }
}
function shuffle2(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
