// البيت المسكون — واجهة ثري دي (Three.js من مجلد vendor، ينحمل بس لما تفتح اللعبة).
// منظور العين: الناجي معه كشاف وبطارية، والشبح يشوف بالظلام بلون أحمر ويمسك ويصرخ.
// الجوال: نص الشاشة اليسار جويستك، واليمين تسحب عشان تلف. الكمبيوتر: WASD + الماوس (اضغط عشان يثبت المؤشر).
const HCOL = ['#e8362d', '#2a5bd7', '#1f9d55', '#ffc928', '#ff8a1f', '#8a4fd6', '#ff6fae', '#19c3d6', '#8a5a2b', '#9be22d'];
const HR = { WALK: 4.2, RUN: 6.6, GSPEED: 4.7, USE: 1.8, CATCH: 1.6, EYE: 1.62, GEYE: 1.95, SCREAM: 13 };
const HU = { T: null, loading: false, built: false, me: null, oth: {}, keys: {}, view: {}, move: { f: 0, s: 0 }, joy: null, look: null, yaw: 0, pitch: 0, fl: true, run: false, stam: 100, tired: false, sent: 0, last: '', bob: 0, stepT: 0, near: 99, bat: 100, dark: 0, stun: 0, scr: 0, burn: 0, act: null, ward: {}, fx: [], nextScare: 0, beat: 0, droneAt: 0, follow: 0, mapOn: false };
const hg = () => S && S.game === 'haunt' && S.g;
const hname = id => (S.players.find(p => p.id === id) || {}).name || '؟';
const hcol = id => { const g = hg(); return HCOL[g && g.col[id] != null ? g.col[id] : 0]; };
const isMob = () => matchMedia('(pointer:coarse)').matches;
const angD = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

// ---------- الشبكة ----------
function hauntNet(m) {
  if (m.t === 'hsnap') {
    HU.me = { x: m.x, z: m.z }; HU.yaw = m.yaw; HU.lastX = m.x; HU.lastZ = m.z; return;
  }
  if (m.t === 'hpos') {
    const seen = {};
    m.a.forEach(([id, x, z, yaw, f]) => {
      if (S && id === S.me) { if (!HU.me) HU.me = { x, z }; HU.myF = f; return; }
      seen[id] = 1;
      const o = HU.oth[id];
      if (!o || Math.hypot(o.x - x, o.z - z) > 6) HU.oth[id] = Object.assign(o || {}, { x, z, tx: x, tz: z, yaw, ty: yaw, f, ph: 0, seenAt: performance.now() });
      else Object.assign(o, { tx: x, tz: z, ty: yaw, f });
      if ((f & 2) && !(o && o.f & 2) && !hg().me?.ghost) { if (!HU.lastSeenGhost || performance.now() - HU.lastSeenGhost > 6000) { sfx('whoosh'); hShake(.25); } HU.lastSeenGhost = performance.now(); }
    });
    Object.keys(HU.oth).forEach(id => { if (!seen[id]) { const o = HU.oth[id]; if (o.mesh) o.mesh.visible = false; o.gone = true; } else HU.oth[id].gone = false; });
    if (m.near != null) { HU.near = m.near; HU.bat = m.bat; HU.dark = m.dark; HU.darkAt = performance.now(); }
    if (m.stun != null) { HU.stun = m.stun; HU.scr = m.scr; HU.burn = m.burn; HU.ghAt = performance.now(); }
    return;
  }
  if (m.t !== 'hev') return;
  const g = hg(); if (!g) return;
  const me = g.me, mine = id => id === S.me;
  if (m.ev === 'caught') { hJump(m.by); }
  else if (m.ev === 'got') { hPop(`مسكت ${hname(m.id)}! 👻`, 'red'); sfx('scream'); }
  else if (m.ev === 'lost') { hPop(`👻 الشبح مسك ${hname(m.id)}`, 'red'); if (HU.me && Math.hypot(HU.me.x - m.x, HU.me.z - m.z) < 16) sfx('scream'); else sfx('whisper'); }
  else if (m.ev === 'key') { sfx('ding'); hPop(mine(m.id) ? '🔑 لقيت مفتاح!' : `🔑 ${hname(m.id)} لقى مفتاح`, 'yel'); }
  else if (m.ev === 'door') { sfx('bell'); setTimeout(() => sfx('thunder'), 600); hPop(me && me.ghost ? '🚪 الباب انفتح! لا تخليهم يهربون' : '🚪 الباب الأمامي انفتح! اهربوا للمدخل', 'green', 4500); }
  else if (m.ev === 'esc') { sfx(mine(m.id) ? 'win' : 'pop'); hPop(mine(m.id) ? '🚪 هربت من البيت!' : `🚪 ${hname(m.id)} هرب!`, 'green'); }
  else if (m.ev === 'bat') { sfx('pop'); hPop('🔋 شحنت الكشاف', 'green'); }
  else if (m.ev === 'empty') { hPop('الدولاب فاضي…'); }
  else if (m.ev === 'open' || m.ev === 'close') { hWard(m.f, m.ev === 'open'); if (HU.me) { const o = HMAP.FURN[m.f]; if (Math.hypot(o.c[0] - HU.me.x, o.c[1] - HU.me.z) < 14) sfx('creak'); } }
  else if (m.ev === 'burn') {
    if (mine(m.id)) { hPop('🔥 انحرقت بالكشاف! تجمّدت', 'red'); sfx('sizzle'); hFlash('#ff3b1f'); }
    else { sfx('sizzle'); if (mine(m.by)) hPop('🔦 حرقت الشبح! اهرب الحين', 'green'); else if (!me || !me.ghost) hPop(`🔦 ${hname(m.by)} حرق الشبح`, 'green'); }
  }
  else if (m.ev === 'scream') {
    const d = HU.me ? Math.hypot(HU.me.x - m.x, HU.me.z - m.z) : 99;
    if (mine(m.id)) { sfx('scream'); hShake(.6); }
    else if (d < HR.SCREAM) { sfx('scream'); hShake(1); hFlash('#000'); }
    else sfx('whisper');
  }
}

// ---------- أدوات صغيرة للواجهة ----------
function hPop(text, kind = '', ms = 3000) { const w = $('#hW'); if (!w) return; const d = document.createElement('div'); d.className = 'hpop ' + kind; d.textContent = text; w.appendChild(d); setTimeout(() => d.remove(), ms); }
function hFlash(col) { const w = $('#hW'); if (!w) return; const d = document.createElement('div'); d.className = 'hflash'; d.style.background = col; w.appendChild(d); setTimeout(() => d.remove(), 700); }
function hShake(k) { HU.shake = Math.max(HU.shake || 0, k); }

// ---------- القوام (كلها مرسومة بالكود) ----------
function cvs(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function tex(c, rx = 1, ry = 1) { const T = HU.T, t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function grime(x, w, h, n, a = .25) { for (let i = 0; i < n; i++) { const r = 4 + Math.random() * 40; const g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(10,8,5,${a * Math.random()})`); g.addColorStop(1, 'rgba(10,8,5,0)'); x.save(); x.translate(Math.random() * w, Math.random() * h); x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2); x.restore(); } }
const TEX = {
  wall: () => cvs(256, 384, (x, w, h) => {
    x.fillStyle = '#3c4a3a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 32) { x.fillStyle = i % 64 ? '#354333' : '#425140'; x.fillRect(i, 0, 16, h); }
    x.fillStyle = 'rgba(190,170,110,.18)';
    for (let yy = 20; yy < h * .62; yy += 46) for (let xx = (yy / 46 % 2) * 32; xx < w + 32; xx += 64) { x.beginPath(); x.ellipse(xx, yy, 9, 15, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(xx - 14, yy); x.quadraticCurveTo(xx, yy - 30, xx + 14, yy); x.quadraticCurveTo(xx, yy + 30, xx - 14, yy); x.strokeStyle = 'rgba(190,170,110,.14)'; x.lineWidth = 2; x.stroke(); }
    const wy = h * .64; x.fillStyle = '#3a2618'; x.fillRect(0, wy, w, h - wy);
    for (let i = 0; i < w; i += 64) { x.strokeStyle = '#24170e'; x.lineWidth = 4; x.strokeRect(i + 8, wy + 14, 48, h - wy - 30); }
    x.fillStyle = '#2a1b11'; x.fillRect(0, wy - 6, w, 10); x.fillRect(0, h - 10, w, 10);
    grime(x, w, h, 60, .35);
    x.strokeStyle = 'rgba(15,10,6,.5)'; x.lineWidth = 1.5; for (let i = 0; i < 6; i++) { x.beginPath(); let px = Math.random() * w, py = Math.random() * h * .6; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += Math.random() * 14 - 7; py += Math.random() * 18; x.lineTo(px, py); } x.stroke(); }
  }),
  wood: () => cvs(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = ['#4a3020', '#432b1c', '#523624', '#3e281a'][i % 4]; x.fillRect(0, i * 32, w, 32); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, i * 32, w, 2); const off = (i * 97) % w; x.fillRect(off, i * 32, 2, 32); for (let k = 0; k < 10; k++) { x.fillStyle = 'rgba(20,10,4,.18)'; x.fillRect(Math.random() * w, i * 32 + 4 + Math.random() * 24, 30 + Math.random() * 60, 1.5); } } grime(x, w, h, 30, .3); }),
  hall: () => cvs(256, 256, (x, w, h) => { x.fillStyle = '#3e281a'; x.fillRect(0, 0, w, h); x.fillStyle = '#5a1e1e'; x.fillRect(w * .18, 0, w * .64, h); x.strokeStyle = '#c9a24a55'; x.lineWidth = 4; x.strokeRect(w * .22, -4, w * .56, h + 8); for (let y = 0; y < h; y += 32) { x.fillStyle = '#c9a24a30'; x.beginPath(); x.moveTo(w / 2, y); x.lineTo(w / 2 + 16, y + 16); x.lineTo(w / 2, y + 32); x.lineTo(w / 2 - 16, y + 16); x.fill(); } grime(x, w, h, 40, .35); }),
  carpet: () => cvs(256, 256, (x, w, h) => { x.fillStyle = '#4a1a22'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7a5a2a66'; x.lineWidth = 3; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(i * 64 + 32, j * 64 + 32, 18, 0, 7); x.stroke(); x.beginPath(); x.moveTo(i * 64 + 32, j * 64); x.lineTo(i * 64 + 64, j * 64 + 32); x.lineTo(i * 64 + 32, j * 64 + 64); x.lineTo(i * 64, j * 64 + 32); x.closePath(); x.stroke(); } grime(x, w, h, 40, .4); }),
  kids: () => cvs(256, 256, (x, w, h) => { x.fillStyle = '#3d3a48'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) { x.fillStyle = '#48445a'; x.fillRect(i * 32, j * 32, 32, 32); } grime(x, w, h, 40, .4); }),
  tile: () => cvs(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#bdb6a6' : '#2b2b2e'; x.fillRect(i * 32, j * 32, 32, 32); } x.strokeStyle = '#1a1a1a'; x.lineWidth = 2; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.moveTo(0, i * 32); x.lineTo(w, i * 32); x.stroke(); } grime(x, w, h, 70, .5); }),
  marble: () => cvs(256, 256, (x, w, h) => { x.fillStyle = '#8e8a82'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(40,36,30,.35)'; for (let i = 0; i < 14; i++) { x.lineWidth = Math.random() * 2 + .5; x.beginPath(); let px = Math.random() * w, py = 0; x.moveTo(px, py); while (py < h) { px += Math.random() * 30 - 15; py += 20; x.lineTo(px, py); } x.stroke(); } x.strokeStyle = '#3d3a35'; x.lineWidth = 3; x.strokeRect(0, 0, 128, 128); x.strokeRect(128, 128, 128, 128); x.strokeRect(128, 0, 128, 128); x.strokeRect(0, 128, 128, 128); grime(x, w, h, 50, .45); }),
  stone: () => cvs(256, 256, (x, w, h) => { x.fillStyle = '#2e2c2a'; x.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = 0; i < 5; i++) { x.fillStyle = `hsl(30,6%,${18 + Math.random() * 10}%)`; x.fillRect(i * 56 + (j % 2) * 28 - 20, j * 32 + 2, 52, 28); } grime(x, w, h, 50, .5); }),
  ceil: () => cvs(128, 128, (x, w, h) => { x.fillStyle = '#5a554c'; x.fillRect(0, 0, w, h); grime(x, w, h, 30, .5); x.strokeStyle = 'rgba(0,0,0,.3)'; x.strokeRect(0, 0, w, h); }),
  plank: () => cvs(128, 64, (x, w, h) => { x.fillStyle = '#5b3d25'; x.fillRect(0, 0, w, h); for (let k = 0; k < 12; k++) { x.fillStyle = 'rgba(20,10,4,.25)'; x.fillRect(Math.random() * w, Math.random() * h, 40, 1.5); } x.fillStyle = '#222'; x.beginPath(); x.arc(8, h / 2, 3, 0, 7); x.arc(w - 8, h / 2, 3, 0, 7); x.fill(); }),
  fabric: (c) => cvs(64, 64, (x, w, h) => { x.fillStyle = c; x.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * .15})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } })
};

// ---------- بناء البيت ----------
function hMat(o) { return new HU.T.MeshLambertMaterial(o); }
function box(w, h, d, mat, x, y, z, parent, ry = 0) { const T = HU.T, m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = HU.shadows; parent.add(m); return m; }
function cyl(rt, rb, h, mat, x, y, z, parent, seg = 10) { const T = HU.T, m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = HU.shadows; parent.add(m); return m; }
// الاتجاه اللي ورا الأثاث (الجدار): نرجع زاوية الوجه
function buildFurn(o, M) {
  const T = HU.T, Tt = HMAP.T, g = new T.Group();
  const yaw = o.face, alongX = Math.abs(Math.sin(yaw)) < .5; // الوجه شمال/جنوب = العرض على محور x
  const W = (alongX ? o.w : o.h) * Tt, D = (alongX ? o.h : o.w) * Tt; // العرض والعمق بإطار الأثاث نفسه
  g.position.set((o.x + o.w / 2) * Tt, 0, (o.y + o.h / 2) * Tt); g.rotation.y = yaw;
  const back = -D / 2; // ورا = -z بالإطار المحلي بعد التدوير؟ الوجه للأمام = -z، فالجدار = +z
  const B = D / 2;
  switch (o.k) {
    case 'bed': {
      box(W - .2, .45, D - .1, M.wood, 0, .25, 0, g); box(W - .35, .22, D - .4, M.sheet, 0, .58, -.1, g);
      box(W - .3, .12, D * .55, M.red, 0, .7, -D * .18, g); box(W * .32, .14, .45, M.sheet, -W * .22, .72, B - .5, g); box(W * .32, .14, .45, M.sheet, W * .22, .72, B - .5, g);
      box(W - .1, 1.3, .12, M.dark, 0, .75, B - .1, g); break;
    }
    case 'ward': {
      const w = W * .9, d = D * .6, z = B - d / 2 - .05;
      box(w, 2.5, d, M.dark, 0, 1.25, z, g); box(w + .12, .14, d + .1, M.wood, 0, 2.55, z, g);
      const fz = z - d / 2 - .02;
      const L = new T.Group(); L.position.set(-w / 2 + .04, 0, fz); g.add(L); box(w / 2 - .06, 2.2, .05, M.wood, w / 4 - .03, 1.25, 0, L); box(.05, .18, .06, M.brass, w / 2 - .16, 1.25, -.05, L);
      const R = new T.Group(); R.position.set(w / 2 - .04, 0, fz); g.add(R); box(w / 2 - .06, 2.2, .05, M.wood, -w / 4 + .03, 1.25, 0, R); box(.05, .18, .06, M.brass, -w / 2 + .16, 1.25, -.05, R);
      HU.ward[o.i] = { L, R, t: 0, open: 0 }; break;
    }
    case 'shelf': {
      const d = .7, z = B - d / 2 - .05;
      box(W - .1, 2.6, d, M.dark, 0, 1.3, z, g);
      const cols = [0x6b2a22, 0x2c4a3a, 0x6d5a2a, 0x2a3557, 0x4a2a4a, 0x7a6a4a], bm = cols.map(c => hMat({ color: c }));
      for (let s = 0; s < 5; s++) { const y = .25 + s * .5; box(W - .2, .04, d - .05, M.wood, 0, y - .02, z - .02, g); let x = -W / 2 + .15; while (x < W / 2 - .2) { const bw = .05 + Math.random() * .06, bh = .26 + Math.random() * .16; if (Math.random() < .9) box(bw, bh, .22, bm[Math.random() * bm.length | 0], x + bw / 2, y + bh / 2, z - d / 2 + .16, g); x += bw + .01; } }
      break;
    }
    case 'table': case 'desk': {
      const w = W - .3, d = D - .3;
      box(w, .08, d, M.wood, 0, .78, 0, g);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(.08, .76, .08, M.dark, a * (w / 2 - .1), .38, b * (d / 2 - .1), g));
      if (o.k === 'desk') { box(.3, .03, .22, M.paper, -.2, .83, 0, g); cyl(.02, .02, .4, M.brass, w / 2 - .3, 1, .1, g); const sh = cyl(.06, .14, .14, M.lamp, w / 2 - .3, 1.2, .1, g); HU.flick.push(sh); }
      else for (let i = 0; i < Math.max(1, Math.round(w / 1.4)); i++) { const cx = -w / 2 + (i + .5) * w / Math.max(1, Math.round(w / 1.4)); cyl(.03, .03, .22 + Math.random() * .1, M.wax, cx, .93, 0, g, 6); }
      break;
    }
    case 'dresser': { const d = .55, z = B - d / 2 - .05; box(W * .85, 1, d, M.wood, 0, .5, z, g); for (let i = 0; i < 3; i++) { box(W * .8, .26, .02, M.dark, 0, .2 + i * .3, z - d / 2 - .01, g); box(.12, .03, .03, M.brass, 0, .2 + i * .3, z - d / 2 - .03, g); } break; }
    case 'mirror': { box(.9, 2.1, .1, M.wood, 0, 1.1, B - .3, g); box(.72, 1.85, .02, M.glass, 0, 1.12, B - .36, g); break; }
    case 'arm': { box(.9, .4, .85, M.red, 0, .35, 0, g); box(.9, .8, .2, M.red, 0, .8, .35, g); box(.15, .3, .85, M.red, -.4, .65, 0, g); box(.15, .3, .85, M.red, .4, .65, 0, g); g.rotation.y += .6; break; }
    case 'sofa': { const d = .95, z = B - d / 2 - .1; box(W - .3, .42, d, M.red, 0, .3, z, g); box(W - .3, .65, .22, M.red, 0, .8, z + d / 2 - .11, g); box(.2, .35, d, M.red, -W / 2 + .25, .62, z, g); box(.2, .35, d, M.red, W / 2 - .25, .62, z, g); break; }
    case 'crib': { box(W * .55, .1, D * .8, M.sheet, 0, .55, 0, g); for (let i = 0; i < 9; i++) { cyl(.02, .02, .55, M.paint, -W * .27, .8, -D * .4 + i * D * .1, g, 5); cyl(.02, .02, .55, M.paint, W * .27, .8, -D * .4 + i * D * .1, g, 5); } box(W * .58, .05, .05, M.paint, 0, 1.08, -D * .4, g); box(W * .58, .05, .05, M.paint, 0, 1.08, D * .4, g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(.06, 1.1, .06, M.paint, a * W * .27, .55, b * D * .4, g)); const doll = new T.Group(); doll.position.set(0, .62, .2); g.add(doll); const dh = new T.Mesh(new T.SphereGeometry(.09, 10, 8), M.sheet); dh.position.y = .16; doll.add(dh); box(.14, .16, .08, M.red, 0, .05, 0, doll); break; }
    case 'box': box(1, .6, .7, M.paint, 0, .3, 0, g); box(1.05, .08, .75, M.wood, 0, .62, 0, g); break;
    case 'horse': { const h = new T.Group(); g.add(h); box(.9, .25, .3, M.paint, 0, .62, 0, h); box(.25, .45, .2, M.paint, .4, .92, 0, h); box(.3, .2, .2, M.paint, .58, 1.1, 0, h); [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, b]) => box(.06, .45, .06, M.paint, a * .3, .35, b * .1, h)); const rk = new T.Mesh(new T.TorusGeometry(.9, .03, 6, 20, 1.2), M.wood); rk.rotation.z = Math.PI + .97; rk.position.y = 1.0; h.add(rk); HU.rock.push(h); g.rotation.y += .4; break; }
    case 'tub': { box(W - .3, .7, D * .55, M.porc, 0, .45, B - D * .3, g); box(W - .5, .1, D * .4, M.water, 0, .76, B - D * .3, g); break; }
    case 'sink': { cyl(.12, .16, .8, M.porc, 0, .4, B - .4, g); box(.6, .15, .45, M.porc, 0, .85, B - .4, g); box(.5, .8, .04, M.glass, 0, 1.6, B - .06, g); break; }
    case 'clock': { const z = B - .3; box(.6, 2.3, .45, M.dark, 0, 1.15, z, g); const face = new T.Mesh(new T.CircleGeometry(.2, 20), M.paper); face.position.set(0, 1.85, z - .23); face.rotation.y = Math.PI; g.add(face); const pen = new T.Group(); pen.position.set(0, 1.55, z - .2); g.add(pen); box(.02, .7, .02, M.brass, 0, -.35, 0, pen); const bob = cyl(.08, .08, .02, M.brass, 0, -.72, 0, pen, 14); bob.rotation.x = Math.PI / 2; HU.pend.push(pen); HU.clocks.push([(o.x + .5) * Tt, (o.y + .5) * Tt]); break; }
    case 'piano': { box(W - .3, 1.1, .7, M.black, 0, .6, B - .45, g); box(W - .4, .05, .3, M.porc, 0, .75, B - .9, g); for (let i = 0; i < 12; i++) box(.03, .04, .18, M.black, -W / 2 + .4 + i * (W - .8) / 12, .8, B - .85, g); break; }
    case 'fire': {
      const z = B - .35; box(W - .2, 1.3, .7, M.stone, 0, .65, z, g); box(W - .1, .12, .8, M.dark, 0, 1.36, z, g); box(W * .55, .8, .4, M.black, 0, .45, z - .2, g);
      const fl = new T.Group(); fl.position.set(0, .15, z - .25); g.add(fl);
      for (let i = 0; i < 5; i++) { const p = new T.Mesh(new T.ConeGeometry(.09 + Math.random() * .06, .35 + Math.random() * .3, 6), M.flame); p.position.set(-.3 + i * .15, .2, Math.random() * .1); fl.add(p); }
      HU.fires.push({ g: fl, pos: new T.Vector3() }); break;
    }
    case 'counter': { box(W - .1, .9, .75, M.paint, 0, .45, B - .45, g); box(W - .05, .06, .8, M.marble, 0, .93, B - .45, g); break; }
    case 'fridge': { box(1, 1.9, .8, M.porc, 0, .95, B - .5, g); box(.05, .5, .06, M.brass, -.38, 1.3, B - .93, g); break; }
    case 'stairs': {
      for (let i = 0; i < 8; i++) box(W - .2, .25, D / 8, M.wood, 0, .125 + i * .25 + (i ? 0 : 0), -D / 2 + (i + .5) * D / 8, g).scale.y = (i + 1);
      g.children.forEach((m, i) => { m.position.y = (i + 1) * .125; });
      const pl = hMat({ map: tex(TEX.plank()) }); box(W, .2, .04, pl, 0, 1, -D / 2 - .1, g, 0).rotation.z = .3; box(W, .2, .04, pl, 0, 1.2, -D / 2 - .1, g).rotation.z = -.25; break;
    }
    case 'crate': { for (let i = 0; i < D / 1.1; i++) { box(.95, .9, .95, M.crate, (Math.random() - .5) * .2, .45, -D / 2 + .55 + i * 1.05, g, Math.random() * .3); if (Math.random() < .6) box(.8, .7, .8, M.crate, 0, 1.25, -D / 2 + .55 + i * 1.05, g, Math.random()); } break; }
  }
  return g;
}
function hBuild() {
  const T = HU.T, Mp = HMAP, Tt = Mp.T;
  const scene = HU.scene = new T.Scene();
  scene.background = new T.Color(0x020203);
  scene.fog = new T.FogExp2(0x020203, .1);
  HU.flick = []; HU.rock = []; HU.pend = []; HU.clocks = []; HU.fires = []; HU.ward = {};
  const M = HU.M = {
    wood: hMat({ map: tex(TEX.wood(), .5, .5) }), dark: hMat({ color: 0x2b1c12 }), sheet: hMat({ color: 0x9a948a }), red: hMat({ map: tex(TEX.fabric('#5a1820')) }),
    brass: hMat({ color: 0xb08a3a, emissive: 0x2a1c00 }), paper: hMat({ color: 0xd8cdb0 }), lamp: hMat({ color: 0xffd27a, emissive: 0xffaa33, emissiveIntensity: .9 }),
    wax: hMat({ color: 0xe8dcc0, emissive: 0x332a1a }), glass: hMat({ color: 0x1a2228, emissive: 0x05080a }), paint: hMat({ color: 0x7c766a }), porc: hMat({ color: 0xc9c2b4 }),
    water: hMat({ color: 0x3a2a20 }), black: hMat({ color: 0x111111 }), stone: hMat({ map: tex(TEX.stone(), .5, .5) }), marble: hMat({ map: tex(TEX.marble(), .3, .3) }),
    flame: new T.MeshBasicMaterial({ color: 0xff8a22, transparent: true, opacity: .85, blending: T.AdditiveBlending, depthWrite: false }), crate: hMat({ map: tex(TEX.plank()) })
  };
  // الأرضيات
  const FT = { wood: TEX.wood(), hall: TEX.hall(), carpet: TEX.carpet(), kids: TEX.kids(), tile: TEX.tile(), marble: TEX.marble(), stone: TEX.stone() };
  Mp.ROOMS.forEach(r => {
    const t = tex(FT[r.f], r.f === 'hall' ? (r.w > 1 ? r.w : 1) : r.w * .5, r.f === 'hall' ? r.h : r.h * .5);
    if (r.f === 'hall') { t.rotation = Math.PI / 2; t.repeat.set(1, r.w); }
    const m = new T.Mesh(new T.PlaneGeometry(r.w * Tt, r.h * Tt), hMat({ map: t }));
    m.rotation.x = -Math.PI / 2; m.position.set((r.x + r.w / 2) * Tt, 0, (r.y + r.h / 2) * Tt); m.receiveShadow = HU.shadows; scene.add(m);
  });
  const dm = hMat({ map: tex(FT.wood, .5, .5) });
  Mp.DOORS.concat(Mp.EXIT).forEach(([x, y]) => { const m = new T.Mesh(new T.PlaneGeometry(Tt, Tt), dm); m.rotation.x = -Math.PI / 2; m.position.set((x + .5) * Tt, .002, (y + .5) * Tt); scene.add(m); });
  const ce = new T.Mesh(new T.PlaneGeometry(Mp.W * Tt, Mp.H * Tt), hMat({ map: tex(TEX.ceil(), Mp.W, Mp.H) })); ce.rotation.x = Math.PI / 2; ce.position.set(Mp.W * Tt / 2, 3, Mp.H * Tt / 2); scene.add(ce);
  // الجدران: بس اللي جنب أرض (InstancedMesh)
  const wl = []; for (let y = 0; y < Mp.H; y++) for (let x = 0; x < Mp.W; x++) if (Mp.at(x, y) === 0 && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a, b]) => Mp.at(x + a, y + b) && Mp.at(x + a, y + b) !== 0)) wl.push([x, y]);
  const wm = new T.InstancedMesh(new T.BoxGeometry(Tt, 3, Tt), hMat({ map: tex(TEX.wall()) }), wl.length);
  const mx = new T.Matrix4(); wl.forEach(([x, y], i) => { mx.makeTranslation((x + .5) * Tt, 1.5, (y + .5) * Tt); wm.setMatrixAt(i, mx); });
  wm.castShadow = wm.receiveShadow = HU.shadows; scene.add(wm);
  // الأبواب الداخلية: عتبة فوق + باب مفتوح على جنب
  const trim = M.dark, dpan = hMat({ map: tex(TEX.plank()), color: 0x8a6a50 });
  Mp.DOORS.forEach(([x, y], i) => {
    const ns = Mp.at(x, y - 1) === 0 && Mp.at(x, y + 1) === 0; // جدران شمال وجنوب = الممر شرق-غرب
    const cx = (x + .5) * Tt, cz = (y + .5) * Tt;
    box(ns ? Tt : 1.9, .6, ns ? 1.9 : Tt, trim, cx, 2.7, cz, scene);
    if (ns) { box(.1, 2.4, .12, trim, cx - Tt / 2 + .05, 1.2, cz - .6, scene); box(.1, 2.4, .12, trim, cx - Tt / 2 + .05, 1.2, cz + .6, scene); }
    else { box(.12, 2.4, .1, trim, cx - .6, 1.2, cz - Tt / 2 + .05, scene); box(.12, 2.4, .1, trim, cx + .6, 1.2, cz - Tt / 2 + .05, scene); }
    const hinge = new T.Group(); scene.add(hinge);
    const open = 1.35 + Math.sin(i * 7.1) * .3;
    if (ns) { hinge.position.set(cx - Tt / 2 + .1, 0, cz - .55); box(.05, 2.3, 1.1, dpan, 0, 1.15, .55, hinge); hinge.rotation.y = -open; }
    else { hinge.position.set(cx - .55, 0, cz - Tt / 2 + .1); box(1.1, 2.3, .05, dpan, .55, 1.15, 0, hinge); hinge.rotation.y = open; }
    HU.doors = HU.doors || []; HU.doors.push({ h: hinge, base: hinge.rotation.y, ph: Math.random() * 9 });
  });
  // الباب الأمامي (ضلفتين)
  const ex = Mp.EXIT, ez = ex[0][1] * Tt + .15, ecx = (ex[0][0] + 1) * Tt;
  const em = hMat({ map: tex(TEX.plank()), color: 0x6a4a35 });
  const eL = new T.Group(); eL.position.set(ecx - Tt, 0, ez); scene.add(eL); box(Tt - .05, 2.7, .12, em, Tt / 2, 1.35, 0, eL); box(.08, .25, .08, M.brass, Tt - .25, 1.2, -.1, eL);
  const eR = new T.Group(); eR.position.set(ecx + Tt, 0, ez); scene.add(eR); box(Tt - .05, 2.7, .12, em, -Tt / 2, 1.35, 0, eR); box(.08, .25, .08, M.brass, -Tt + .25, 1.2, -.1, eR);
  box(Tt * 2 + .3, .3, .3, M.dark, ecx, 2.85, ez, scene);
  const lockM = hMat({ color: 0x8a1a1a, emissive: 0x330000 }); HU.locks = [];
  for (let i = 0; i < 5; i++) { const l = box(.16, .2, .08, lockM, ecx - .5 + i * .25, 1.5 + (i % 2) * .25, ez - .1, scene); HU.locks.push(l); }
  HU.exitDoor = { L: eL, R: eR, t: 0 };
  const night = new T.Mesh(new T.PlaneGeometry(10, 6), new T.MeshBasicMaterial({ color: 0x1c2a40 })); night.position.set(ecx, 2, (ex[0][1] + 1) * Tt + 1.5); night.rotation.y = Math.PI; scene.add(night);
  HU.moon = new T.PointLight(0x8fb4ff, 0, 18, 1.4); HU.moon.position.set(ecx, 2.2, (ex[0][1] + .7) * Tt); scene.add(HU.moon);
  // الأثاث
  Mp.FURN.forEach(o => scene.add(buildFurn(o, M)));
  // الإضاءة: محيط خفيف جداً + نار الدفايات + ثريا الصالة
  HU.amb = new T.AmbientLight(0x404a66, .35); scene.add(HU.amb);
  HU.hemi = new T.HemisphereLight(0x3a4466, 0x0a0806, .15); scene.add(HU.hemi);
  HU.fires.forEach((f, i) => { const l = new T.PointLight(0xff7a2a, 6, 8, 1.6); f.g.getWorldPosition(f.pos); scene.updateMatrixWorld(); f.g.getWorldPosition(f.pos); l.position.copy(f.pos).add(new T.Vector3(0, .5, 0)); scene.add(l); f.l = l; });
  HU.chand = new T.PointLight(0xffc27a, 3, 9, 1.6); HU.chand.position.set(15 * Tt, 2.6, 10.5 * Tt); scene.add(HU.chand);
  const ch = new T.Group(); ch.position.copy(HU.chand.position); scene.add(ch); cyl(.01, .01, .5, M.black, 0, .2, 0, ch, 4); const ring = new T.Mesh(new T.TorusGeometry(.4, .03, 6, 18), M.brass); ring.rotation.x = Math.PI / 2; ch.add(ring); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cyl(.025, .025, .14, M.wax, Math.cos(a) * .4, .08, Math.sin(a) * .4, ch, 5); } HU.chandG = ch;
  // كشافي (يمشي مع الكاميرا)
  const cam = HU.cam = new T.PerspectiveCamera(72, 1, .05, 70); cam.rotation.order = 'YXZ'; scene.add(cam);
  const sp = HU.spot = new T.SpotLight(0xfff1d6, 30, 24, .5, .55, 1.7); sp.position.set(.18, -.2, 0); cam.add(sp); sp.target.position.set(.1, -.3, -5); cam.add(sp.target);
  if (HU.shadows) { sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.camera.near = .3; sp.shadow.camera.far = 24; sp.shadow.bias = -.002; }
  HU.glow = new T.PointLight(0xfff1d6, 0, 3, 2); cam.add(HU.glow); // ضو خفيف حواليك
  // كشافات الثانين: ٢ أضواء جاهزة (عشان ما يعاد بناء الشيدر)
  HU.pool = [0, 1].map(() => { const l = new T.SpotLight(0xfff1d6, 0, 20, .5, .6, 1.7); scene.add(l); scene.add(l.target); return l; });
  // يد الشبح (لو أنت الشبح)
  const claws = HU.claws = new T.Group(); cam.add(claws);
  const cm = hMat({ color: 0xd8dde6, emissive: 0x3a4250, transparent: true, opacity: .9 });
  [-1, 1].forEach(s => { const a = new T.Group(); a.position.set(s * .32, -.42, -.55); claws.add(a); cyl(.035, .05, .5, cm, 0, 0, 0, a, 6).rotation.x = Math.PI / 2 - .3; for (let k = 0; k < 4; k++) { const f = cyl(.008, .015, .16, cm, (k - 1.5) * .025, .05, -.27, a, 4); f.rotation.x = Math.PI / 2 + .5; } a.userData.s = s; });
  claws.visible = false;
  // المفاتيح والبطاريات (نبنيها وقت اللعب)
  HU.keyGeo = (() => { const g = new T.Group(); const gm = hMat({ color: 0xffcf4a, emissive: 0x7a5200, emissiveIntensity: .9 }); const ring = new T.Mesh(new T.TorusGeometry(.09, .025, 8, 16), gm); ring.position.y = .14; g.add(ring); cyl(.018, .018, .28, gm, 0, -.05, 0, g, 6); box(.06, .03, .02, gm, .04, -.15, 0, g); box(.045, .03, .02, gm, .03, -.08, 0, g); return g; })();
  HU.batGeo = (() => { const g = new T.Group(); cyl(.05, .05, .2, hMat({ color: 0x1f9d55, emissive: 0x063a1c, emissiveIntensity: .9 }), 0, 0, 0, g, 10); cyl(.02, .02, .03, M.brass, 0, .115, 0, g, 8); return g; })();
  HU.items = new T.Group(); scene.add(HU.items);
  HU.built = true;
}

// ---------- الشخصيات ----------
function hNameTag(text, col) {
  const T = HU.T, c = cvs(256, 64, (x, w, h) => { x.font = '700 30px Tajawal, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 7; x.strokeStyle = '#16130f'; x.strokeText(text, w / 2, h / 2); x.fillStyle = col; x.fillText(text, w / 2, h / 2); });
  const s = new T.Sprite(new T.SpriteMaterial({ map: tex(c), depthWrite: false, transparent: true })); s.scale.set(1.1, .28, 1); return s;
}
function survivorMesh(col, name) {
  const T = HU.T, g = new T.Group(), body = hMat({ color: col }), skin = hMat({ color: 0xd9b48c }), ink = hMat({ color: 0x16130f });
  const legs = [-1, 1].map(s => { const l = new T.Group(); l.position.set(s * .11, .78, 0); g.add(l); cyl(.075, .07, .7, hMat({ color: 0x2b2b33 }), 0, -.38, 0, l, 8); return l; });
  const torso = new T.Mesh(new T.CapsuleGeometry(.24, .45, 4, 10), body); torso.position.y = 1.15; g.add(torso);
  const head = new T.Mesh(new T.SphereGeometry(.17, 14, 10), skin); head.position.y = 1.62; g.add(head);
  [-1, 1].forEach(s => { const e = new T.Mesh(new T.SphereGeometry(.025, 6, 6), ink); e.position.set(s * .06, 1.65, -.155); g.add(e); });
  const hair = new T.Mesh(new T.SphereGeometry(.175, 12, 8, 0, Math.PI * 2, 0, 1.3), hMat({ color: 0x2a1a10 })); hair.position.y = 1.64; hair.rotation.x = .25; g.add(hair);
  const arm = new T.Group(); arm.position.set(.26, 1.32, -.05); g.add(arm); cyl(.05, .05, .5, body, 0, -.05, -.2, arm, 6).rotation.x = Math.PI / 2 - .35;
  const fl = cyl(.04, .05, .2, hMat({ color: 0x333333 }), .02, -.12, -.45, arm, 8); fl.rotation.x = Math.PI / 2;
  const lens = new T.Mesh(new T.CircleGeometry(.04, 10), new T.MeshBasicMaterial({ color: 0xfff1c8 })); lens.position.set(.02, -.12, -.56); lens.rotation.y = Math.PI; arm.add(lens);
  const cone = new T.Mesh(new T.ConeGeometry(1.3, 7, 20, 1, true), new T.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: .028, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  cone.rotation.x = -Math.PI / 2; cone.position.set(.02, -.2, -4.0); arm.add(cone);
  const tag = hNameTag(name, col); tag.position.y = 2.1; g.add(tag);
  g.userData = { legs, cone, lens, arm };
  return g;
}
function ghostMesh() {
  const T = HU.T, g = new T.Group();
  const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new T.Vector2(.08 + Math.sin(t * Math.PI * .92) * .38 + t * t * .3, 2.35 - t * 2.15)); }
  const robeM = hMat({ color: 0xd9dee8, emissive: 0x3a4258, transparent: true, opacity: .82, side: T.DoubleSide });
  const robe = new T.Mesh(new T.LatheGeometry(pts, 18), robeM); g.add(robe);
  const pos = robe.geometry.attributes.position, base = Float32Array.from(pos.array);
  const head = new T.Mesh(new T.SphereGeometry(.24, 16, 12), robeM); head.scale.set(1, 1.35, 1); head.position.y = 2.25; g.add(head);
  const hole = new T.MeshBasicMaterial({ color: 0x000000 });
  [-1, 1].forEach(s => { const e = new T.Mesh(new T.SphereGeometry(.065, 10, 8), hole); e.scale.set(1, 1.5, .5); e.position.set(s * .09, 2.3, -.2); g.add(e); });
  const mouth = new T.Mesh(new T.SphereGeometry(.07, 10, 8), hole); mouth.scale.set(.8, 2.2, .5); mouth.position.set(0, 2.07, -.2); g.add(mouth);
  const arms = [-1, 1].map(s => { const a = new T.Group(); a.position.set(s * .32, 1.8, -.05); g.add(a); const m = cyl(.035, .06, 1.1, robeM, 0, -.1, -.5, a, 6); m.rotation.x = Math.PI / 2 - .25; for (let k = 0; k < 4; k++) { const f = cyl(.008, .016, .22, robeM, (k - 1.5) * .03, .05, -1.1, a, 4); f.rotation.x = Math.PI / 2 + .3; } return a; });
  const eyes = new T.PointLight(0xff2222, 0, 3, 2); eyes.position.set(0, 2.3, -.4); g.add(eyes);
  g.userData = { robe, base, pos, arms, robeM, eyes };
  return g;
}

// ---------- الواجهة ----------
function hauntBuildUI(body) {
  body.dataset.built = 'haunt';
  body.innerHTML = `<div class="hauntw" id="hW">
    <div id="hCvBox" class="hcvbox"></div>
    <div id="hVig" class="hvig"></div>
    <div id="hWardV" class="hwardv" hidden></div>
    <div class="hcross" id="hCross"></div>
    <div class="hprompt" id="hPrompt" hidden></div>
    <div class="htop">
      <div class="hkeys" id="hKeys"></div>
      <div class="htime" id="hTime">⏳</div>
    </div>
    <div class="hrole" id="hRole"></div>
    <button type="button" class="sbtn hmapb" id="hMapB" title="الخريطة (M)">🗺️<b>الخريطة</b></button>
    <div class="hbars" id="hBars"><div class="hbar bat"><span>🔦</span><i id="hBat"></i></div><div class="hbar sta"><span>🏃</span><i id="hSta"></i></div></div>
    <div class="hbtns" id="hBtns">
      <button type="button" class="sbtn big yel" id="hUseB">✋<b>استخدم</b></button>
      <button type="button" class="sbtn" id="hFlB">🔦<b>الكشاف</b></button>
      <button type="button" class="sbtn" id="hRunB">🏃<b>اركض</b></button>
      <button type="button" class="sbtn red" id="hScrB">😱<b>اصرخ</b><i></i></button>
      <button type="button" class="skillbig hcatch" id="hCatchB"><span>👻</span><b>امسك</b><i></i></button>
      <button type="button" class="sbtn" id="hFolB">👁<b>تابع</b></button>
    </div>
    <div id="hJoy" class="sjoy" hidden><i></i></div>
    <div id="hMapBox" class="smapbox" hidden><canvas id="hMapCv"></canvas><small>اضغط بأي مكان عشان تسكّر</small></div>
    <div id="hLoad" class="hfull hload">جاري فتح باب البيت…</div>
    <div id="hIntro" class="hfull hintro" hidden></div>
    <div id="hJump" class="hjump" hidden></div>
    <div id="hLock" class="hlock" hidden>اضغط على الشاشة عشان تلف بالماوس 🖱️</div>
  </div>`;
  const w = $('#hW');
  // اللمس: يسار = جويستك، يمين = لف
  w.addEventListener('pointerdown', e => {
    if (e.target.closest('button,.smapbox') || !hg()) return;
    if (e.pointerType === 'mouse') { if (!document.pointerLockElement && HU.r) { try { HU.r.domElement.requestPointerLock(); } catch {} } else if (hg().me && hg().me.ghost) hCatch(); return; }
    const rc = w.getBoundingClientRect();
    if (e.clientX - rc.left < rc.width * .42 && !HU.joy) { HU.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; hJoyDraw(); }
    else if (!HU.look) HU.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  w.addEventListener('pointermove', e => {
    const j = HU.joy;
    if (j && j.id === e.pointerId) { let dx = e.clientX - j.ox, dy = e.clientY - j.oy; const d = Math.hypot(dx, dy); if (d > 60) { dx *= 60 / d; dy *= 60 / d; } j.dx = dx; j.dy = dy; hJoyDraw(); }
    const l = HU.look;
    if (l && l.id === e.pointerId) { hTurn((e.clientX - l.x) * .006, (e.clientY - l.y) * .005); l.x = e.clientX; l.y = e.clientY; }
  });
  const up = e => { if (HU.joy && HU.joy.id === e.pointerId) { HU.joy = null; hJoyDraw(); } if (HU.look && HU.look.id === e.pointerId) HU.look = null; };
  w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
  $('#hUseB').onclick = hUse;
  $('#hFlB').onclick = hToggleFl;
  const rb = $('#hRunB'); rb.onpointerdown = e => { e.preventDefault(); HU.runBtn = !HU.runBtn; rb.classList.toggle('on', HU.runBtn); };
  $('#hScrB').onclick = () => send({ t: 'scream' });
  $('#hCatchB').onclick = hCatch;
  $('#hFolB').onclick = () => { HU.follow++; };
  $('#hMapB').onclick = () => hMapToggle();
  $('#hMapBox').onclick = () => hMapToggle(false);
}
function hJoyDraw() { const j = HU.joy, el = $('#hJoy'); if (!el) return; el.hidden = !j; if (!j) return; const w = $('#hW').getBoundingClientRect(); el.style.left = (j.ox - w.left) + 'px'; el.style.top = (j.oy - w.top) + 'px'; el.firstChild.style.transform = `translate(${j.dx}px,${j.dy}px)`; }
function hTurn(dx, dy) { HU.yaw -= dx; HU.pitch = Math.max(-1.25, Math.min(1.2, HU.pitch - dy)); }
function hToggleFl() { const g = hg(); if (!g || !g.me || g.me.ghost) return; HU.fl = !HU.fl; sfx('flick'); }
function hUse() { if (HU.act && HU.act.k !== 'catch') send({ t: 'use' }); }
function hCatch() { if (HU.act && HU.act.k === 'catch') send({ t: 'catch', id: HU.act.id }); else if (HU.act && HU.act.k === 'ward') send({ t: 'use' }); }
function hMapToggle(v) { HU.mapOn = v === undefined ? !HU.mapOn : v; const b = $('#hMapBox'); if (b) b.hidden = !HU.mapOn; if (HU.mapOn) hDrawMap(); }
document.addEventListener('mousemove', e => { if (hg() && HU.r && document.pointerLockElement === HU.r.domElement) hTurn(e.movementX * .0024, e.movementY * .0022); });
document.addEventListener('pointerlockchange', () => { const l = $('#hLock'); if (l) l.hidden = !!document.pointerLockElement || isMob() || !hg() || S.phase !== 'play'; });
addEventListener('keydown', e => {
  if (!hg() || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
  const k = e.key.toLowerCase(); HU.keys = HU.keys || {};
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'ص', 'ش', 'س', 'ي', 'shift'].includes(k)) { HU.keys[k] = 1; e.preventDefault(); }
  if (e.repeat) return;
  if (k === 'e' || k === ' ' || k === 'ث') { e.preventDefault(); const g = hg(); if (g.me && g.me.ghost && HU.act && HU.act.k === 'catch') hCatch(); else hUse(); }
  if (k === 'f' || k === 'ب') hToggleFl();
  if (k === 'q' || k === 'ض') send({ t: 'scream' });
  if (k === 'm' || k === 'ة') hMapToggle();
  if (k === 'tab') { e.preventDefault(); HU.follow++; }
});
addEventListener('keyup', e => { if (HU.keys) delete HU.keys[e.key.toLowerCase()]; });
addEventListener('blur', () => { HU.keys = {}; });

function renderHaunt(body) {
  if (body.dataset.built !== 'haunt' || !$('#hW')) { hauntBuildUI(body); HU.gameKey = null; }
  if (!HU.T) {
    if (!HU.loading) { HU.loading = true; import('./vendor/three.module.min.js').then(T => { HU.T = T; HU.loading = false; if (hg()) renderHaunt($('#g2body')); }).catch(() => { HU.loading = false; const l = $('#hLoad'); if (l) l.textContent = 'ما قدرنا نحمّل الثري دي 😢 حدّث الصفحة'; }); }
    return;
  }
  if (!HU.r) {
    HU.shadows = !isMob();
    const r = HU.r = new HU.T.WebGLRenderer({ antialias: !isMob(), powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, isMob() ? 1.25 : 1.5));
    r.shadowMap.enabled = HU.shadows; r.shadowMap.type = HU.T.PCFSoftShadowMap;
    r.toneMapping = HU.T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.domElement.className = 'hcv';
  }
  if (!HU.built) hBuild();
  const box = $('#hCvBox'); if (HU.r.domElement.parentNode !== box) box.appendChild(HU.r.domElement);
  $('#hLoad').hidden = true;
  const g = S.g, me = g.me;
  // لعبة جديدة؟ نصفّر كل شي
  const gk = S.code + ':' + g.id;
  if (HU.gameKey !== gk) {
    HU.gameKey = gk;
    Object.values(HU.oth).forEach(o => o.mesh && HU.scene.remove(o.mesh)); HU.oth = {};
    HU.items.clear(); HU.keys = {}; HU.itemMap = {}; HU.stam = 100; HU.fl = true; HU.jumped = false; HU.nextScare = performance.now() + 20000 + Math.random() * 20000;
    HU.exitDoor.t = 0; Object.values(HU.ward).forEach(w => { w.open = 0; });
    HU.yaw = me && me.ghost ? Math.PI / 2 : 0; HU.pitch = 0; HU.follow = 0;
    if (!me) HU.me = { x: HMAP.spawn[0], z: HMAP.spawn[1] };
  }
  // المفاتيح والبطاريات
  const want = {}; g.keys.forEach(([id, x, z]) => { want['k' + id] = [x, z, 'k']; }); g.bats.forEach(([id, x, z]) => { want['b' + id] = [x, z, 'b']; });
  Object.keys(HU.itemMap).forEach(k => { if (!want[k]) { HU.items.remove(HU.itemMap[k]); delete HU.itemMap[k]; } });
  Object.entries(want).forEach(([k, [x, z, t]]) => { if (HU.itemMap[k]) return; const m = (t === 'k' ? HU.keyGeo : HU.batGeo).clone(); m.position.set(x, .9, z); m.userData.ph = Math.random() * 6; m.userData.kind = t; HU.items.add(m); HU.itemMap[k] = m; });
  HU.locks.forEach((l, i) => { l.visible = i < g.need - g.have && !g.open; });
  // الواجهة
  const ghost = me && me.ghost, alive = me && me.alive && !me.escaped;
  $('#hW').classList.toggle('ghostv', !!ghost);
  $('#hW').classList.toggle('spirit', !alive && !ghost);
  $('#hKeys').innerHTML = [...Array(g.need)].map((_, i) => `<i class="${i < g.have ? 'on' : ''}">🔑</i>`).join('') + (g.open ? '<b class="hopen">الباب مفتوح!</b>' : '');
  HU.wakeIn = g.wakeIn; HU.wakeAt = performance.now();
  $('#hRole').textContent = !me ? 'تتفرّج 👁' : ghost ? 'أنت الشبح 👻' : me.escaped ? 'هربت 🚪 تتفرّج' : me.caught ? 'مسكك الشبح — صرت روح 👁' : me.hidden != null ? 'مختبي بالدولاب 🤫' : 'ناجي 🔦';
  $('#hBars').hidden = !(alive && !ghost);
  $('#hFlB').hidden = $('#hRunB').hidden = !(alive && !ghost);
  $('#hUseB').hidden = !alive || ghost;
  $('#hScrB').hidden = $('#hCatchB').hidden = !ghost;
  $('#hFolB').hidden = !!(alive || ghost);
  $('#hWardV').hidden = !(me && me.hidden != null);
  // البداية: تعريف الدور
  const intro = $('#hIntro'); intro.hidden = g.sub !== 'intro';
  if (!intro.hidden && intro.dataset.k !== gk) {
    intro.dataset.k = gk;
    const G = g.ghosts.map(hname).join(' و ');
    intro.innerHTML = !me ? `<h2>البيت المسكون 🏚️</h2><p>تتفرّج على اللعبة</p>` : ghost
      ? `<div class="hbig">👻</div><h2>أنت الشبح</h2><p>امسك الناجين قبل لا يلقون ${g.need} مفاتيح ويهربون من الباب الأمامي.</p><ul><li>تشوف بالظلام، واللي كشافه شغال يبان لك من بعيد</li><li>الكشاف لو انوجّه عليك من قريب <b>يحرقك ويجمّدك</b>، جيهم من وراهم</li><li>😱 الصرخة تطفّي كشافات اللي حولك</li><li>افتح الدواليب، يمكن أحد مختبي فيها</li></ul>${g.nG > 1 ? `<p>شريكك: <b>${esc(g.ghosts.filter(i => i !== S.me).map(hname).join(''))}</b></p>` : ''}`
      : `<div class="hbig">🔦</div><h2>أنت من الناجين</h2><p>دوّروا <b>${g.need} مفاتيح</b> بغرف البيت عشان ينفتح الباب الأمامي، واهربوا منه.</p><ul><li>الشبح: <b>${esc(G)}</b>. وجّه الكشاف عليه من قريب عشان تحرقه</li><li>الكشاف ياكل بطارية، دوّر بطاريات 🔋</li><li>اختبي بالدواليب ✋ لو قرّب</li><li>دقات القلب = الشبح قريب منك</li></ul>`;
    sfx(ghost ? 'scream' : 'thunder');
  }
  if (S.phase === 'over' && !HU.overDone) { HU.overDone = true; try { document.exitPointerLock(); } catch {} }
  if (S.phase !== 'over') HU.overDone = false;
  const lk = $('#hLock'); lk.hidden = !!document.pointerLockElement || isMob() || S.phase !== 'play';
  if (!HU.loop) { HU.loop = true; HU.lt = performance.now(); requestAnimationFrame(hFrame); }
}

// ---------- الحلقة ----------
function hFrame(t) {
  const g = hg();
  if (!g || S.phase === 'lobby' || !$('#hCvBox') || !HU.built) { HU.loop = false; try { if (document.pointerLockElement) document.exitPointerLock(); } catch {} return; }
  requestAnimationFrame(hFrame);
  const dt = Math.min(.05, (t - HU.lt) / 1000); HU.lt = t;
  const T = HU.T, Mp = HMAP, me = g.me, cam = HU.cam;
  const ghost = !!(me && me.ghost), alive = !!(me && me.alive && !me.escaped), hidden = me && me.hidden != null;
  const box = $('#hCvBox'), W = box.clientWidth, H = box.clientHeight;
  if (W && H && (HU.w !== W || HU.h !== H)) { HU.w = W; HU.h = H; HU.r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); }
  const playing = g.sub === 'play' && S.phase === 'play';
  // الحركة
  let mx = 0, mz = 0, running = false;
  if (HU.me && playing && !HU.mapOn && !hidden) {
    const K = HU.keys || {};
    let f = 0, s = 0;
    if (K.w || K.arrowup || K['ص']) f++; if (K.s || K.arrowdown || K['س']) f--;
    if (K.d || K['ي']) s++; if (K.a || K['ش']) s--;
    if (K.arrowleft) HU.yaw += dt * 2.4; if (K.arrowright) HU.yaw -= dt * 2.4;
    if (HU.joy && Math.hypot(HU.joy.dx, HU.joy.dy) > 8) { s = HU.joy.dx / 60; f = -HU.joy.dy / 60; }
    const l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
    const spirit = !alive && !ghost;
    const stunned = ghost && HU.stun - (performance.now() - (HU.ghAt || 0)) > 0;
    running = !ghost && alive && (K.shift || HU.runBtn) && l > .2 && !HU.tired;
    const sp = spirit ? 7 : ghost ? HR.GSPEED : running ? HR.RUN : HR.WALK;
    if (l > .05 && !stunned) {
      const sy = Math.sin(HU.yaw), cy = Math.cos(HU.yaw);
      mx = (-sy * f + cy * s) * sp * dt; mz = (-cy * f - sy * s) * sp * dt;
      const p = HU.me, eo = g.open && !ghost;
      if (Mp.walk(p.x + mx, p.z, spirit, eo)) p.x += mx; if (Mp.walk(p.x, p.z + mz, spirit, eo)) p.z += mz;
      HU.bob += dt * (running ? 13 : 9) * Math.min(1, l);
      if (!spirit) { HU.stepT -= dt; if (HU.stepT <= 0) { HU.stepT = running ? .3 : .48; if (!ghost) sfx('step'); } }
    }
    if (running) { HU.stam = Math.max(0, HU.stam - dt * 24); if (!HU.stam) { HU.tired = true; HU.runBtn = false; const rb = $('#hRunB'); if (rb) rb.classList.remove('on'); } }
    else { HU.stam = Math.min(100, HU.stam + dt * 15); if (HU.tired && HU.stam > 30) HU.tired = false; }
    const flOn = HU.fl && HU.bat > 0;
    const key = [HU.me.x.toFixed(2), HU.me.z.toFixed(2), HU.yaw.toFixed(2), flOn].join();
    if (me && key !== HU.last && t - HU.sent > 66) { HU.sent = t; HU.last = key; send({ t: 'mv', x: Math.round(HU.me.x * 100) / 100, z: Math.round(HU.me.z * 100) / 100, yaw: Math.round(HU.yaw * 100) / 100, fl: flOn }); }
  }
  // الكاميرا
  let ex = 0, ez = 0, ey = HR.EYE;
  const spirit = me && !alive && !ghost || !me;
  if (spirit) {
    // الروح: تمشي بحرية، أو تتابع لاعب (زر تابع)
    const alivePs = Object.entries(HU.oth).filter(([id, o]) => !o.gone && !(o.f & 16) && !(o.f & 2));
    if (HU.follow % (alivePs.length + 1) && alivePs.length) { const o = alivePs[(HU.follow % (alivePs.length + 1)) - 1][1]; HU.me = HU.me || { x: o.x, z: o.z }; HU.me.x += (o.x + Math.sin(o.yaw) * 2.6 - HU.me.x) * Math.min(1, dt * 5); HU.me.z += (o.z + Math.cos(o.yaw) * 2.6 - HU.me.z) * Math.min(1, dt * 5); HU.yaw += angD(o.yaw, HU.yaw) * Math.min(1, dt * 4); ey = 2.3; }
  }
  if (HU.me) { ex = HU.me.x; ez = HU.me.z; }
  if (hidden) { const o = Mp.FURN[me.hidden]; ex = o.c[0] + (o.front[0] - o.c[0]) * .3; ez = o.c[1] + (o.front[1] - o.c[1]) * .3; ey = 1.55; }
  if (ghost) ey = HR.GEYE;
  const bob = Math.sin(HU.bob) * (running ? .07 : .04);
  let shk = 0; if (HU.shake) { HU.shake = Math.max(0, HU.shake - dt * 1.6); shk = HU.shake * .12; }
  cam.position.set(ex + (Math.random() - .5) * shk, ey + bob + (ghost ? Math.sin(t / 700) * .06 : 0), ez + (Math.random() - .5) * shk);
  cam.rotation.y = HU.yaw + (Math.random() - .5) * shk * .5; cam.rotation.x = HU.pitch;
  // الإضاءة حسب الدور
  const darkLeft = (HU.dark || 0) - (performance.now() - (HU.darkAt || 0));
  const near = alive && !ghost ? HU.near : 99;
  let flk = 1; if (near < 7) flk = Math.random() < (7 - near) / 14 ? Math.random() * .3 : 1;
  const flOn = alive && !ghost && HU.fl && HU.bat > 0 && darkLeft <= 0 && !hidden;
  HU.spot.intensity = flOn ? 30 * flk * (HU.bat < 15 ? .45 + Math.random() * .2 : 1) : 0;
  HU.glow.intensity = flOn ? .5 * flk : 0;
  HU.claws.visible = ghost;
  if (ghost) { HU.claws.scale.x = Math.min(1, cam.aspect / 1.3); HU.claws.children.forEach((a, i) => { a.rotation.x = Math.sin(t / 300 + i) * .08 + (HU.act && HU.act.k === 'catch' ? -.25 : 0); }); }
  HU.amb.color.set(ghost ? 0xc04a4a : spirit ? 0x5a6a90 : 0x40466a); HU.amb.intensity = ghost ? 3.2 : spirit ? 1.6 : .06;
  HU.hemi.intensity = ghost ? 1.2 : spirit ? .7 : .03;
  HU.scene.fog.color.set(ghost ? 0x1a0303 : 0x020203); HU.scene.fog.density = ghost ? .055 : spirit ? .04 : .13;
  HU.scene.background.set(ghost ? 0x1a0303 : 0x020203);
  // النار والثريا والأبواب والساعات
  HU.fires.forEach((f, i) => { f.l.intensity = 5 + Math.sin(t / 90 + i) * 1.2 + Math.random() * 1.6; f.g.children.forEach((p, k) => { p.scale.y = .8 + Math.sin(t / 70 + k * 2) * .25 + Math.random() * .1; }); });
  HU.chand.intensity = HU.chandOff > t ? 0 : 2.6 + Math.sin(t / 200) * .3; HU.chandG.rotation.z = Math.sin(t / 1300) * .05;
  HU.pend.forEach((p, i) => { p.rotation.z = Math.sin(t / 318 + i) * .35; });
  HU.rock.forEach((h, i) => { h.rotation.z = Math.sin(t / 900 + i) * .12; });
  HU.doors.forEach(d => { d.h.rotation.y = d.base + Math.sin(t / 2100 + d.ph) * .05; });
  HU.flick.forEach((m, i) => { m.material.emissiveIntensity = Math.random() < .03 ? .1 : .9; });
  Object.values(HU.ward).forEach(w => { w.t += (w.open - w.t) * Math.min(1, dt * 7); w.L.rotation.y = -w.t * 1.6; w.R.rotation.y = w.t * 1.6; if (w.open && w.closeAt && t > w.closeAt) { w.open = 0; w.closeAt = 0; } });
  const ed = HU.exitDoor; ed.t += ((g.open ? 1 : 0) - ed.t) * Math.min(1, dt * 1.5); ed.L.rotation.y = ed.t * 1.7; ed.R.rotation.y = -ed.t * 1.7; HU.moon.intensity = ed.t * 9;
  // المفاتيح تلف
  HU.items.children.forEach(m => { m.rotation.y = t / 600 + m.userData.ph; m.position.y = .9 + Math.sin(t / 500 + m.userData.ph) * .06; });
  // اللاعبين الثانين
  let pool = 0; const lit = [];
  Object.entries(HU.oth).forEach(([id, o]) => {
    if (o.gone) return;
    const isG = !!(o.f & 2), dead = !!(o.f & 16);
    if (!o.mesh || o.isG !== isG) { if (o.mesh) HU.scene.remove(o.mesh); o.mesh = isG ? ghostMesh() : survivorMesh(hcol(id), hname(id)); o.isG = isG; HU.scene.add(o.mesh); }
    const k = Math.min(1, dt * 12); const dx = o.tx - o.x, dz = o.tz - o.z; o.x += dx * k; o.z += dz * k; o.yaw += angD(o.ty, o.yaw) * k;
    const sp = Math.hypot(dx, dz); o.ph = sp > .02 ? o.ph + dt * 10 : o.ph * .9;
    const m = o.mesh; m.visible = !(o.f & 8);
    m.position.set(o.x, 0, o.z); m.rotation.y = o.yaw;
    if (isG) {
      const u = m.userData, stun = o.f & 4;
      m.position.y = .15 + Math.sin(t / 420) * .1 + (stun ? (Math.random() - .5) * .08 : 0);
      u.robeM.opacity = stun ? .5 + Math.random() * .4 : (o.f & 32 ? .9 : .55 + Math.sin(t / 130) * .12 + (Math.random() < .04 ? -.4 : 0));
      u.robeM.emissive.set(stun ? 0xaa2a10 : 0x3a4258);
      u.eyes.intensity = ghost ? 0 : 1.5;
      const pa = u.pos.array, b = u.base; for (let i = 0; i < pa.length; i += 3) { const y = b[i + 1]; if (y < 1) { const a = Math.atan2(b[i + 2], b[i]); const w = (1 - y) * .09 * Math.sin(t / 180 + a * 5 + y * 4); pa[i] = b[i] * (1 + w); pa[i + 2] = b[i + 2] * (1 + w); } } u.pos.needsUpdate = true;
      u.arms.forEach((a, i) => { a.rotation.x = -.15 + Math.sin(t / 380 + i * 2) * .12; });
    } else {
      const u = m.userData;
      u.legs.forEach((l, i) => { l.rotation.x = Math.sin(o.ph + i * Math.PI) * .5; });
      const on = !!(o.f & 1) && !dead; u.cone.visible = on; u.lens.material.color.set(on ? 0xfff1c8 : 0x333333);
      if (on) lit.push(o);
      m.traverse(c => { if (c.material && 'opacity' in c.material && c !== u.cone) { c.material.transparent = dead; c.material.opacity = dead ? .35 : 1; } });
    }
  });
  // أقرب ٢ كشافات تاخذ ضو حقيقي
  lit.sort((a, b) => Math.hypot(a.x - ex, a.z - ez) - Math.hypot(b.x - ex, b.z - ez));
  HU.pool.forEach((l, i) => { const o = lit[i]; if (!o) { l.intensity = 0; return; } l.intensity = 26; l.position.set(o.x - Math.sin(o.yaw) * .4 + Math.cos(o.yaw) * .25, 1.25, o.z - Math.cos(o.yaw) * .4 - Math.sin(o.yaw) * .25); l.target.position.set(o.x - Math.sin(o.yaw) * 6, .6, o.z - Math.cos(o.yaw) * 6); });
  // وش أقدر أسوي؟
  hAct(g, me, ex, ez);
  // المؤثرات: دقات القلب، الحواف الحمرا، الفجعات العشوائية
  if (alive && !ghost && playing) {
    if (near < 11 && t > HU.beat) { sfx('heart'); HU.beat = t + 300 + near * 110; }
    const vg = $('#hVig'); if (vg) vg.style.opacity = near < 11 ? Math.min(1, (11 - near) / 8) : 0;
    if (t > HU.nextScare) { HU.nextScare = t + 28000 + Math.random() * 30000; hScare(t); }
  } else { const vg = $('#hVig'); if (vg) vg.style.opacity = 0; }
  if (playing && t > HU.droneAt) { HU.droneAt = t + 7600; sfx('drone'); }
  if (playing && HU.me) HU.clocks.forEach(([x, z]) => { if (Math.hypot(x - ex, z - ez) < 5 && (t / 1000 | 0) !== HU.tock) { HU.tock = t / 1000 | 0; sfx('tick'); } });
  if (HU.fake) { const f = HU.fake; if (t > f.until) { HU.scene.remove(f.m); HU.fake = null; } else { f.m.userData.robeM.opacity = .4 + Math.random() * .3; } }
  if (t - (HU.hud || 0) > 150) { HU.hud = t; hHud(g, me, darkLeft); }
  if (HU.mapOn && t - (HU.mapT || 0) > 200) { HU.mapT = t; hDrawMap(); }
  if (!window.__noRender) HU.r.render(HU.scene, cam);
}
function hAct(g, me, x, z) {
  let a = null;
  if (me && g.sub === 'play' && S.phase === 'play') {
    const Mp = HMAP, d = (px, pz) => Math.hypot(px - x, pz - z);
    if (me.ghost) {
      const T = Object.entries(HU.oth).filter(([id, o]) => !o.gone && !(o.f & 2) && !(o.f & 16) && !(o.f & 8) && d(o.x, o.z) <= HR.CATCH + .1 && Mp.see(x, z, o.x, o.z)).sort((a, b) => d(a[1].x, a[1].z) - d(b[1].x, b[1].z))[0];
      if (T) a = { k: 'catch', id: T[0], t: `امسك ${hname(T[0])}!` };
      else { const o = Mp.FURN.find(o => o.hide && d(o.front[0], o.front[1]) <= HR.USE + .2); if (o) a = { k: 'ward', t: 'افتح الدولاب' }; }
    } else if (me.alive && !me.escaped) {
      if (me.hidden != null) a = { k: 'out', t: 'اطلع من الدولاب' };
      else {
        const k = g.keys.find(([, kx, kz]) => d(kx, kz) <= HR.USE - .1), b = g.bats.find(([, bx, bz]) => d(bx, bz) <= HR.USE - .1);
        if (k) a = { k: 'key', t: 'التقط المفتاح 🔑' };
        else if (b) a = { k: 'bat', t: 'خذ البطارية 🔋' };
        else { const o = Mp.FURN.find(o => o.hide && d(o.front[0], o.front[1]) <= HR.USE + .2); if (o) a = { k: 'ward', t: 'اختبي بالدولاب 🤫' }; }
      }
    }
  }
  const was = HU.act && HU.act.t; HU.act = a;
  if ((a && a.t) !== was) {
    const p = $('#hPrompt'); if (p) { p.hidden = !a; if (a) p.textContent = (isMob() ? '' : (me && me.ghost && a.k === 'catch' ? 'كليك / E: ' : 'E: ')) + a.t; }
  }
}
function hHud(g, me, darkLeft) {
  const tm = $('#hTime'); if (!tm) return;
  const left = g.sub === 'play' ? Math.max(0, g.endIn - (Date.now() - S.t0)) : g.endIn;
  const s = Math.ceil(left / 1000); tm.textContent = `⏳ ${s / 60 | 0}:${String(s % 60).padStart(2, '0')}`; tm.classList.toggle('low', s <= 45 && g.sub === 'play');
  const wk = Math.ceil(((HU.wakeIn || 0) - (performance.now() - HU.wakeAt)) / 1000), rl = $('#hRole');
  if (g.sub === 'play' && wk > 0) { rl.textContent = me && me.ghost ? `تصحى بعد ${wk}… 👻` : `الشبح يصحى بعد ${wk}… تفرّقوا!`; rl.classList.add('wake'); HU.waking = true; }
  else if (HU.waking) { HU.waking = false; rl.classList.remove('wake'); renderHaunt($('#g2body')); if (g.sub === 'play') { sfx('scream'); hPop(me && me.ghost ? '👻 صحيت! روح امسكهم' : '👻 الشبح صحى…', 'red'); } }
  const bat = $('#hBat'), sta = $('#hSta');
  if (bat) { bat.style.width = Math.max(0, HU.bat) + '%'; bat.parentNode.classList.toggle('low', HU.bat < 20); bat.parentNode.classList.toggle('off', !HU.fl || darkLeft > 0); }
  if (sta) { sta.style.width = HU.stam + '%'; sta.parentNode.classList.toggle('low', HU.tired); }
  const ub = $('#hUseB'); if (ub) { ub.disabled = !HU.act; ub.classList.toggle('on', !!HU.act); ub.querySelector('b').textContent = HU.act ? ({ key: 'التقط', bat: 'بطارية', ward: 'اختبي', out: 'اطلع' }[HU.act.k] || 'استخدم') : 'استخدم'; }
  const fb = $('#hFlB'); if (fb) fb.classList.toggle('off', !HU.fl);
  if (me && me.ghost) {
    const now = performance.now() - (HU.ghAt || 0), stun = HU.stun - now, scr = HU.scr - now;
    const cb = $('#hCatchB'); cb.disabled = !(HU.act && (HU.act.k === 'catch' || HU.act.k === 'ward')) || stun > 0; cb.classList.toggle('on', !!(HU.act && HU.act.k === 'catch'));
    cb.querySelector('b').textContent = HU.act && HU.act.k === 'ward' ? 'افتح' : 'امسك';
    cb.querySelector('i').textContent = stun > 0 ? Math.ceil(stun / 1000) : '';
    const sb = $('#hScrB'); sb.disabled = scr > 0 || stun > 0; sb.querySelector('i').textContent = scr > 0 ? Math.ceil(scr / 1000) : '';
    $('#hW').classList.toggle('stunned', stun > 0);
  }
}
// الفجعات العشوائية للناجين (بالمتصفح بس، ما تأثر على اللعب)
function hScare(t) {
  const k = Math.random();
  if (k < .3 && HU.near > 14 && HU.me) {
    // ظل يعدّي بآخر الممر
    const T = HU.T; let best = null;
    for (let i = 0; i < 20; i++) { const a = HU.yaw + (Math.random() - .5) * .9, d = 7 + Math.random() * 6, x = HU.me.x - Math.sin(a) * d, z = HU.me.z - Math.cos(a) * d; if (HMAP.walk(x, z) && HMAP.see(HU.me.x, HU.me.z, x, z)) { best = [x, z]; break; } }
    if (best) { const m = ghostMesh(); m.position.set(best[0], .1, best[1]); m.rotation.y = HU.yaw + Math.PI / 2; m.userData.eyes.intensity = 2; HU.scene.add(m); HU.fake = { m, until: t + 450 }; setTimeout(() => sfx('whoosh'), 120); return; }
  }
  const opts = [() => sfx('whisper'), () => { sfx('slam'); hShake(.3); }, () => { HU.chandOff = t + 1600; sfx('static'); }, () => sfx('mbox'), () => { sfx('thunder'); hFlash('rgba(200,220,255,.35)'); }, () => { for (let i = 0; i < 4; i++) setTimeout(() => sfx('step2'), i * 420); }];
  opts[Math.random() * opts.length | 0]();
}
function hWard(i, open) { const w = HU.ward[i]; if (!w) return; w.open = 1; w.closeAt = performance.now() + (open ? 1400 : 500); }
// الفجعة لما يمسكك الشبح: وجه الشبح يهجم + مقطع الفجعة (من مقاطع المندس) + صرخة
function hJump(byCol) {
  const box = $('#hJump'); if (!box) return;
  HU.jumped = true;
  try { document.exitPointerLock(); } catch {}
  box.innerHTML = '';
  box.className = 'hjump';
  const v = typeof pickScare === 'function' ? pickScare() : null;
  if (v) { box.classList.add('vid'); playScare(box, v); }
  else { box.innerHTML = `<svg viewBox="0 0 200 260" class="hface"><path d="M100 6C40 6 18 70 22 130c4 60 30 120 78 124 48-4 74-64 78-124C182 70 160 6 100 6Z" fill="#dfe4ec"/><ellipse cx="68" cy="108" rx="22" ry="34" fill="#000"/><ellipse cx="132" cy="108" rx="22" ry="34" fill="#000"/><circle cx="70" cy="112" r="4" fill="#ff2a2a"/><circle cx="130" cy="112" r="4" fill="#ff2a2a"/><ellipse cx="100" cy="196" rx="26" ry="46" fill="#000"/></svg>`; sfx('scream'); }
  box.hidden = false; hShake(1.5);
  setTimeout(() => { box.hidden = true; box.innerHTML = ''; hPop('مسكك الشبح 👻 صرت روح، تقدر تتفرّج وتتابع', 'red', 4500); }, v ? 1900 : 1500);
}
function hDrawMap() {
  const cv = $('#hMapCv'); if (!cv) return;
  const Mp = HMAP, s = Math.min((innerWidth - 40) / Mp.W, (innerHeight - 120) / Mp.H, 26);
  cv.width = Mp.W * s * 2; cv.height = Mp.H * s * 2; cv.style.width = Mp.W * s + 'px'; cv.style.height = Mp.H * s + 'px';
  const x = cv.getContext('2d'); x.scale(2, 2);
  x.fillStyle = '#16130f'; x.fillRect(0, 0, Mp.W * s, Mp.H * s);
  for (let y = 0; y < Mp.H; y++) for (let i = 0; i < Mp.W; i++) { const c = Mp.at(i, y); if (!c) continue; x.fillStyle = c === 4 ? '#1f9d55' : c === 1 ? '#e9e2d2' : c === 3 ? '#8a7a66' : '#b8ad98'; x.fillRect(i * s, y * s, s + .5, s + .5); }
  Mp.FURN.filter(o => o.hide).forEach(o => { x.fillStyle = '#5a3a24'; x.fillRect(o.x * s + 2, o.y * s + 2, s - 4, s - 4); });
  x.font = `700 ${Math.max(9, s * .42)}px Tajawal, sans-serif`; x.textAlign = 'center'; x.fillStyle = '#16130f';
  Mp.ROOMS.forEach(r => { if (r.h > 1) x.fillText(r.n, (r.x + r.w / 2) * s, (r.y + r.h / 2) * s); });
  x.fillStyle = '#1f9d55'; x.fillText('🚪 الخروج', (Mp.EXIT[0][0] + 1) * s, (Mp.EXIT[0][1] - .2) * s);
  if (HU.me) { const px = HU.me.x / Mp.T * s, pz = HU.me.z / Mp.T * s; x.save(); x.translate(px, pz); x.rotate(-HU.yaw); x.fillStyle = hg() && hg().me && hg().me.ghost ? '#e8362d' : '#ffc928'; x.strokeStyle = '#16130f'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -s * .45); x.lineTo(s * .3, s * .3); x.lineTo(-s * .3, s * .3); x.closePath(); x.fill(); x.stroke(); x.restore(); }
}
function hauntOverHtml(g) {
  const row = id => { const st = g.ghosts.includes(id) ? '👻 الشبح' : g.esc.includes(id) ? '🚪 هرب' : g.caught.includes(id) ? '💀 انمسك' : '🏚️ علق بالبيت'; return `<span class="hres" style="--c:${HCOL[g.col[id] || 0]}">${esc(hname(id))} <b>${st}</b></span>`; };
  return `<div class="hresw"><p>${esc(g.why || '')}</p>${Object.keys(g.col).map(row).join('')}</div>`;
}
