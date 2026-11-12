// القصر المسكون — واجهة ثري دي (Three.js من vendor، ينحمل بس لما تفتح اللعبة).
// القصر ٤ طوابق مبني من خريطة haunt-map.js: أرضيات وجدران وسقوف بخامات Poly Haven، درج حقيقي،
// أبواب تنفتح لما تقرّب، نوافذ يدخل منها البرق، أثاث حقيقي، وأصوات رعب حقيقية (ثلاثية الأبعاد).
const HCOL = ['#e8362d', '#2a5bd7', '#1f9d55', '#ffc928', '#ff8a1f', '#8a4fd6', '#ff6fae', '#19c3d6', '#8a5a2b', '#9be22d'];
const HR = { WALK: 3.4, RUN: 5.8, GSPEED: 4.6, USE: 1.9, CATCH: 1.6, EYE: 1.62, GEYE: 1.9, SCREAM: 13 };
const HU = { T: null, loading: false, built: false, me: null, lv: 1, oth: {}, keys: {}, joy: null, look: null, yaw: 0, pitch: 0, fl: true, stam: 100, tired: false, sent: 0, last: '', bob: 0, stepT: 0, near: 99, bat: 100, dark: 0, stun: 0, scr: 0, mir: 0, act: null, ward: {}, nextScare: 0, beat: 0, follow: 0, mapOn: false, mapLv: -1, vx: 0, vz: 0, camY: 1.6 };
const hg = () => S && S.game === 'haunt' && S.g;
const hname = id => (S.players.find(p => p.id === id) || {}).name || '؟';
const hcol = id => { const g = hg(); return HCOL[g && g.col[id] != null ? g.col[id] : 0]; };
const isMob = () => matchMedia('(pointer:coarse)').matches;
const angD = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const LOCKN = { study: 'مكتب الجد', master: 'الغرفة الكبيرة', attic: 'العلّية' };
const RELICN = ['دمية مكسورة', 'صورة العائلة', 'الشمعة السودا', 'كتاب الطقوس'];
const LVN = ['القبو', 'الأرضي', 'العلوي', 'العلّية'];
const hset = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem('tarteeb-hset')) || {}; } catch {} return Object.assign({ sens: 1, q: isMob() ? 0 : 1 }, s); })();
const hsave = () => { try { localStorage.setItem('tarteeb-hset', JSON.stringify(hset)); } catch {} };
const pick = a => a[Math.random() * a.length | 0];

// ---------- الأصوات الحقيقية (ملفات mp3 في haunt/snd) ----------
const HSND = { buf: {}, loading: {}, amb: [] };
const hsOn = () => !sfx.muted && (typeof sfx.on !== 'function' || sfx.on());
function hsLoad(n) {
  if (HSND.buf[n]) return Promise.resolve(HSND.buf[n]);
  if (HSND.loading[n] || !HU.T) return HSND.loading[n] || Promise.resolve(null);
  return HSND.loading[n] = new Promise(ok => new HU.T.AudioLoader().load('haunt/snd/' + n + '.mp3?v=1', b => { HSND.buf[n] = b; ok(b); }, undefined, () => ok(null)));
}
// صوت عادي، أو ثلاثي الأبعاد لو عطيته مكان
function snd(n, vol = 1, pos, ref = 4) {
  if (!hsOn() || !HU.listener) return;
  const go = b => {
    if (!b || !HU.scene) return; const T = HU.T;
    const a = pos ? new T.PositionalAudio(HU.listener) : new T.Audio(HU.listener);
    a.setBuffer(b); a.setVolume(vol);
    if (pos) { a.setRefDistance(ref); a.setRolloffFactor(1.6); const o = new T.Object3D(); o.position.copy(pos); o.add(a); HU.scene.add(o); a.onEnded = () => { HU.scene.remove(o); try { a.disconnect(); } catch {} }; }
    try { a.play(); } catch {}
  };
  hsLoad(n).then(go);
}
function hsAmb(on) {
  if (!HU.listener) return;
  if (!on || !hsOn()) { HSND.amb.forEach(a => { try { a.stop(); } catch {} }); HSND.amb = []; HSND.ambOn = false; return; }
  if (HSND.ambOn) return; HSND.ambOn = true;
  [['amb_main', .4], ['amb_2', .22]].forEach(([n, v]) => hsLoad(n).then(b => { if (!b || !HSND.ambOn) return; const a = new HU.T.Audio(HU.listener); a.setBuffer(b); a.setLoop(true); a.setVolume(v); a.play(); HSND.amb.push(a); }));
}

// ---------- الشبكة ----------
function hauntNet(m) {
  if (m.t === 'hsnap') { HU.me = { x: m.x, z: m.z }; if (m.lv != null) HU.lv = m.lv; HU.yaw = m.yaw; HU.vx = HU.vz = 0; return; }
  if (m.t === 'hpos') {
    const seen = {}, g = hg();
    m.a.forEach(([id, x, z, yaw, f, lv]) => {
      if (S && id === S.me) { if (!HU.me) { HU.me = { x, z }; HU.lv = lv; } HU.myF = f; return; }
      seen[id] = 1;
      const o = HU.oth[id], wasGone = !o || o.gone;
      if (!o || Math.hypot(o.x - x, o.z - z) > 6 || o.lv !== lv) HU.oth[id] = Object.assign(o || {}, { x, z, tx: x, tz: z, yaw, ty: yaw, f, lv });
      else Object.assign(o, { tx: x, tz: z, ty: yaw, f, lv });
      // أول ما يبان لك الشبح: ضربة صوت
      if ((f & 2) && wasGone && g && g.me && !g.me.ghost && g.sub === 'play') { const n = performance.now(); if (!HU.lastSeenGhost || n - HU.lastSeenGhost > 8000) { snd(pick(['hit_0', 'hit_3', 'hit_6', 'hit_8']), .9); hShake(.25); } HU.lastSeenGhost = n; }
    });
    Object.keys(HU.oth).forEach(id => { const o = HU.oth[id]; if (!seen[id]) { if (o.dieUntil > performance.now()) return; if (o.mesh) o.mesh.visible = false; o.gone = true; } else o.gone = false; });
    if (m.near != null) { HU.near = m.near; HU.bat = m.bat; HU.dark = m.dark || 0; HU.darkAt = performance.now(); } else HU.near = 99;
    if (m.stun != null) { HU.stun = m.stun; HU.scr = m.scr; HU.mir = m.mir; HU.ghAt = performance.now(); }
    HU.hold = m.hold || null; HU.holdAt = performance.now();
    return;
  }
  if (m.t !== 'hev') return;
  const g = hg(); if (!g) return;
  const me = g.me, mine = id => id === S.me, v3 = (lv, x, z) => HU.T ? new HU.T.Vector3(x, HMAP.baseY(lv) + 1.4, z) : null;
  if (m.ev === 'caught') {
    const o = HU.oth[m.id];
    if (o && o.mesh && o.mesh.userData.ch) { o.dieUntil = performance.now() + 3000; o.gone = false; o.mesh.visible = true; o.mesh.userData.ch.play('Death01', .1); }
    if (mine(m.id)) hJump();
    else if (mine(m.by)) { hPop(`مسكت ${hname(m.id)}! 👻`, 'red'); snd(pick(['laugh_0', 'laugh_1', 'laugh_2']), .9); snd('crack_' + (Math.random() * 4 | 0), .8); }
    else { hPop(`👻 الشبح مسك ${hname(m.id)}`, 'red'); snd('scream_' + (Math.random() * 5 | 0), 1, v3(m.lv, m.x, m.z), 6); }
  }
  else if (m.ev === 'esc') { snd(mine(m.id) ? 'achieve' : 'gate', .8); hPop(mine(m.id) ? '🚪 هربت من القصر!' : `🚪 ${hname(m.id)} هرب!`, 'green'); }
  else if (m.ev === 'bat') { sfx('pop'); hPop('🔋 شحنت الكشاف', 'green'); }
  else if (m.ev === 'empty') hPop('الدولاب فاضي…');
  else if (m.ev === 'ward') { hWard(m.f); sfx('creak'); }
  else if (m.ev === 'pick') {
    const what = m.k === 'fuse' ? 'فيوز ⚡' : m.k === 'key' ? 'مفتاح ' + LOCKN[m.sub] + ' 🔑' : m.k === 'relic' ? RELICN[m.sub] + ' 🕯️' : 'بطارية 🔋';
    if (m.k !== 'bat') { snd('achieve', .55); hPop(mine(m.id) ? 'لقيت ' + what : `${hname(m.id)} لقى ${what}`, 'yel'); }
  }
  else if (m.ev === 'unlock') { sfx('gclick'); snd('gate', .5); hPop(`🔓 انفتح ${LOCKN[m.lock]}`, 'green'); }
  else if (m.ev === 'locked') { sfx('nope'); hPop(`🔒 مقفل… تحتاج مفتاح ${LOCKN[m.lock]}`); }
  else if (m.ev === 'need') { sfx('nope'); hPop(m.what === 'fuse' ? 'تحتاج فيوزات ⚡ دوّرها بالقصر' : m.what === 'power' ? 'لازم ترجع الكهرباء أول ⚡' : 'تحتاج القطع الملعونة 🕯️'); }
  else if (m.ev === 'fuse') { snd('hit_4', .6); hPop(`⚡ ركّبتوا ${m.n}/3 فيوزات`, 'yel'); }
  else if (m.ev === 'power') { HU.powerAt = performance.now(); snd('machine', .6); setTimeout(() => snd(pick(['growl_2', 'growl_5']), 1), 1500); hPop(me && me.ghost ? '⚡ رجعت الكهرباء… الحين أنت أسرع' : '⚡ الكهرباء رجعت! الحين دوّروا المفاتيح', 'yel', 4500); hFlash('rgba(255,220,150,.4)'); }
  else if (m.ev === 'relic') { snd('fx_1', .7); hPop(`🕯️ صار على المذبح ${m.n}/4`, 'yel'); }
  else if (m.ev === 'ritual') { snd('amb_belly', .8); hPop(mine(m.id) ? '🕯️ بدأت الطقس… لا تتحرك!' : `🕯️ ${hname(m.id)} بدأ الطقس بالعلّية`, 'yel', 4000); }
  else if (m.ev === 'ritualStop') hPop('🕯️ الطقس انقطع!', 'red');
  else if (m.ev === 'ritualDone') { snd('scream_2', 1); setTimeout(() => snd('gate', 1), 800); hFlash('#fff'); hShake(1.2); hPop(me && me.ghost ? '🔥 الطقس خلص… ضعفت! لا تخليهم يهربون' : '🔥 الطقس خلص! الباب الأمامي انفتح… اهربوا!', 'green', 5000); }
  else if (m.ev === 'rescue') { sfx('gclick'); hPop(`🗝️ ${hname(m.id)} طلّع المحبوسين`, 'green'); }
  else if (m.ev === 'freed') { if (mine(m.id)) hPop(m.by === S.me ? '🔓 كسرت القفص! اهرب' : `🗝️ ${hname(m.by)} طلّعك من القفص!`, 'green'); }
  else if (m.ev === 'mirror') { const p = HMAP.PROPS[m.b]; if (p) snd('fx_2', .8, v3(p.lv, p.x, p.z), 5); if (mine(m.id)) hFlash('#300'); }
  else if (m.ev === 'burn') {
    if (mine(m.id)) { hPop('🔥 انحرقت بالكشاف! تجمّدت', 'red'); snd('growl_6', 1); hFlash('#ff3b1f'); }
    else { snd(pick(['growl_1', 'growl_3']), .9); if (mine(m.by)) hPop('🔦 حرقت الشبح! اهرب الحين', 'green'); else if (!me || !me.ghost) hPop(`🔦 ${hname(m.by)} حرق الشبح`, 'green'); }
  }
  else if (m.ev === 'scream') {
    const d = HU.me && HU.lv === m.lv ? Math.hypot(HU.me.x - m.x, HU.me.z - m.z) : 99;
    if (mine(m.id)) { snd('growl_4', 1); hShake(.6); }
    else if (d < HR.SCREAM) { snd('growl_4', 1); snd('hit_9', .8); hShake(1); hFlash('#000'); }
    else snd('moan_' + (Math.random() * 5 | 0), .5);
  }
}

// ---------- أدوات صغيرة للواجهة ----------
function hPop(text, kind = '', ms = 3000) { const w = $('#hW'); if (!w) return; const d = document.createElement('div'); d.className = 'hpop ' + kind; d.textContent = text; w.appendChild(d); setTimeout(() => d.remove(), ms); }
function hFlash(col) { const w = $('#hW'); if (!w) return; const d = document.createElement('div'); d.className = 'hflash'; d.style.background = col; w.appendChild(d); setTimeout(() => d.remove(), 700); }
function hShake(k) { HU.shake = Math.max(HU.shake || 0, k); }

// ---------- خامات مرسومة بالكود (للأشياء الصغيرة والبيت من برا) ----------
function cvs(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function tex(c, rx = 1, ry = 1) { const T = HU.T, t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function grime(x, w, h, n, a = .25) { for (let i = 0; i < n; i++) { const r = 4 + Math.random() * 40; const g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(10,8,5,${a * Math.random()})`); g.addColorStop(1, 'rgba(10,8,5,0)'); x.save(); x.translate(Math.random() * w, Math.random() * h); x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2); x.restore(); } }
const TEX = {
  stone: () => cvs(256, 256, (x, w, h) => { x.fillStyle = '#2e2c2a'; x.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = 0; i < 5; i++) { x.fillStyle = `hsl(30,6%,${18 + Math.random() * 10}%)`; x.fillRect(i * 56 + (j % 2) * 28 - 20, j * 32 + 2, 52, 28); } grime(x, w, h, 50, .5); })
};
function hMat(o) { return new HU.T.MeshLambertMaterial(o); }
function box(w, h, d, mat, x, y, z, parent, ry = 0) { const T = HU.T, m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = !!HU.shadows; parent.add(m); return m; }
function cyl(rt, rb, h, mat, x, y, z, parent, seg = 10) { const T = HU.T, m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = !!HU.shadows; parent.add(m); return m; }

// ---------- تحميل القصر (خامات + موديلات) ----------
function hLoadWorld(prog) {
  if (HU.worldP) return HU.worldP;
  return HU.worldP = (async () => {
    const T = HU.T, Mp = HMAP;
    const meta = HU.meta = await fetch('haunt/props/props.json?v=1').then(r => r.json());
    Mp.setSizes(meta);
    HU.BGU = await import('./vendor/BufferGeometryUtils.js');
    const use = new Set(['dark_paneled_wood', 'ceiling_interior', 'stair_planks', 'wood_cabinet_worn_long', 'worn_planks', 'old_stone_wall', 'withered_grass']);
    Mp.ROOMS.forEach(r => { use.add(r.f); use.add(r.wall); });
    const models = [...new Set(Mp.PROPS.map(p => p.m).concat('large_castle_door'))].filter(m => meta[m]);
    let done = 0; const total = models.length + use.size * (hset.q ? 2 : 1); const tick = () => prog && prog(++done / total);
    HU.texs = {};
    const tl = new T.TextureLoader();
    const lt = (n, nor) => new Promise(ok => tl.load(`haunt/tex/${n}_${nor ? 'nor' : 'diff'}.webp?v=1`, t => { t.wrapS = t.wrapT = T.RepeatWrapping; if (!nor) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; tick(); ok(t); }, undefined, () => { tick(); ok(null); }));
    await Promise.all([...use].map(async n => { HU.texs[n] = { d: await lt(n), n: hset.q ? await lt(n, 1) : null }; }));
    HU.models = {};
    const lam = new Map();
    await Promise.all(models.map(m => HU.HC.loadGLB('haunt/props/' + m + '.glb?v=1').then(g => {
      // الجوال: نحوّل المواد لـ Lambert (أخف بكثير)
      if (!hset.q) g.scene.traverse(c => { if (c.isMesh && c.material && c.material.isMeshStandardMaterial) { const o = c.material; if (!lam.has(o)) lam.set(o, new T.MeshLambertMaterial({ map: o.map, color: o.color, transparent: o.transparent, alphaTest: o.alphaTest, side: o.side })); c.material = lam.get(o); } });
      HU.models[m] = g.scene; tick();
    }).catch(() => tick())));
    return true;
  })();
}
// مادة لكل خامة
const MATS = {};
function wmat(n, opt = {}) {
  const k = n + JSON.stringify(opt); if (MATS[k]) return MATS[k];
  const T = HU.T, t = HU.texs[n] || {};
  const o = { map: t.d || null, color: opt.color || 0xffffff, side: T.DoubleSide };
  return MATS[k] = hset.q ? new T.MeshStandardMaterial(Object.assign(o, { normalMap: t.n || null, roughness: .9, metalness: 0 })) : new T.MeshLambertMaterial(o);
}
// نجمع المربعات بهندسة وحدة لكل خامة (أسرع بكثير من آلاف المجسمات)
function GB() { return { p: [], n: [], u: [] }; }
function quad(b, a, c, d, e, nrm, uv) { b.p.push(...a, ...c, ...d, ...a, ...d, ...e); for (let i = 0; i < 6; i++) b.n.push(...nrm); const [u0, v0, u1, v1] = uv; b.u.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1); }
function gbMesh(b, mat, parent) { if (!b.p.length) return; const T = HU.T, g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(b.u, 2)); const m = new T.Mesh(g, mat); m.receiveShadow = true; m.castShadow = !!HU.shadows; m.userData.keep = 1; parent.add(m); return m; }
const US = 2.4; // كل خامة تغطي ٢.٤ متر
const isDoorC = c => c === 2 || c === 3 || c === 6;

function hBuild() {
  const T = HU.T, Mp = HMAP, Tt = Mp.T, CE = Mp.CEIL;
  const scene = HU.scene = new T.Scene();
  scene.background = new T.Color(0x020203);
  scene.fog = new T.FogExp2(0x020203, .09);
  HU.lvG = [...Array(Mp.LV)].map(() => { const g = new T.Group(); scene.add(g); return g; });
  HU.doors = []; HU.windows = []; HU.lamps = []; HU.ward = {}; HU.rats = [];
  const B = {}; const gb = (lv, k) => (B[lv + '|' + k] = B[lv + '|' + k] || GB());
  const isExt = (lv, x, y, dx, dy) => { let i = x + dx, j = y + dy; while (i >= 0 && j >= 0 && i < Mp.W && j < Mp.H) { if (Mp.at(lv, i, j) !== 0) return false; i += dx; j += dy; } return true; };
  const WAIN = new Set(['decrepit_wallpaper', 'peeling_painted_wall', 'patterned_plaster_wall', 'worn_cracked_plaster']);
  // ---- الأرضيات والسقوف والجدران ----
  for (let lv = 0; lv < Mp.LV; lv++) {
    const y0 = Mp.baseY(lv);
    for (let y = 0; y < Mp.H; y++) for (let x = 0; x < Mp.W; x++) {
      const c = Mp.at(lv, x, y); if (!c) continue;
      const X0 = x * Tt, X1 = X0 + Tt, Z0 = y * Tt, Z1 = Z0 + Tt;
      let rm = Mp.roomOf(lv, X0 + 1, Z0 + 1);
      if (!rm) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { rm = Mp.roomOf(lv, X0 + 1 + dx * Tt, Z0 + 1 + dy * Tt); if (rm) break; }
      const fl = rm ? rm.f : 'old_wooden_floor_02', wl = rm ? rm.wall : 'damaged_plaster';
      const uvF = [X0 / US, Z0 / US, X1 / US, Z1 / US];
      if (c !== 4 && c !== 5) quad(gb(lv, fl), [X0, y0, Z1], [X1, y0, Z1], [X1, y0, Z0], [X0, y0, Z0], [0, 1, 0], uvF);
      if (c !== 4 && !(Mp.at(lv + 1, x, y) === 5)) quad(gb(lv, lv === 3 ? 'worn_planks' : 'ceiling_interior'), [X0, y0 + CE, Z0], [X1, y0 + CE, Z0], [X1, y0 + CE, Z1], [X0, y0 + CE, Z1], [0, -1, 0], uvF);
      const wallTop = c === 4 ? Mp.FLOOR_H : CE;
      for (const [dx, dy, nx, nz] of [[0, -1, 0, 1], [0, 1, 0, -1], [-1, 0, 1, 0], [1, 0, -1, 0]]) {
        const nc = Mp.at(lv, x + dx, y + dy);
        if (nc !== 0) {
          // عتبة فوق فتحة الباب (من جهة الغرفة)
          if (!isDoorC(c) && isDoorC(nc)) {
            const top = nc === 6 ? 3.1 : 2.45, ex = dx > 0 ? X1 : X0, ez = dy > 0 ? Z1 : Z0;
            const pa = dy ? [X0, y0 + top, ez] : [ex, y0 + top, Z1], pb = dy ? [X1, y0 + top, ez] : [ex, y0 + top, Z0], pc = dy ? [X1, y0 + CE, ez] : [ex, y0 + CE, Z0], pd = dy ? [X0, y0 + CE, ez] : [ex, y0 + CE, Z1];
            const q = (nx > 0 || nz > 0) ? [pa, pb, pc, pd] : [pb, pa, pd, pc];
            quad(gb(lv, wl), ...q, [nx, 0, nz], [0, top / US, Tt / US, CE / US]);
          }
          continue;
        }
        if (c === 6 && dy === 1) continue; // الباب الأمامي يطل على برا
        const wx = dx > 0 ? X1 : X0, wz = dy > 0 ? Z1 : Z0;
        const seg = (h0, h1, tn) => {
          const a = dy ? [X1, y0 + h0, wz] : [wx, y0 + h0, Z1], b = dy ? [X0, y0 + h0, wz] : [wx, y0 + h0, Z0], cc = dy ? [X0, y0 + h1, wz] : [wx, y0 + h1, Z0], d = dy ? [X1, y0 + h1, wz] : [wx, y0 + h1, Z1];
          const flip = dy ? dy > 0 : dx < 0;
          const q = flip ? [a, b, cc, d] : [b, a, d, cc];
          const u0 = (dy ? X0 : Z0) / US;
          quad(gb(lv, tn), ...q, [nx, 0, nz], [u0, h0 / US, u0 + Tt / US, h1 / US]);
        };
        if (isDoorC(c)) seg(0, wallTop, 'dark_paneled_wood');
        else if (WAIN.has(wl) && lv > 0) { seg(0, 1.05, 'dark_paneled_wood'); seg(1.05, wallTop, wl); }
        else seg(0, wallTop, wl);
        if (lv > 0 && c === 1 && isExt(lv, x, y, dx, dy) && (x * 7 + y * 3) % 3 === 0) HU.windows.push({ lv, x: dy ? X0 + Tt / 2 : wx, z: dy ? wz : Z0 + Tt / 2, nx, nz });
      }
    }
  }
  Object.entries(B).forEach(([k, b]) => { const [lv, n] = k.split('|'); gbMesh(b, wmat(n), HU.lvG[+lv]); });
  // ---- الدرج: درجات + درابزين، وفوق: حافة الفتحة ودرابزين حولها ----
  const railM = hMat({ color: 0x2a1c12 }), slabM = wmat('ceiling_interior'), stM = wmat('stair_planks');
  Mp.STAIRS.forEach(s => {
    const lv = s.lo, y0 = Mp.baseY(lv), up = Mp.baseY(lv + 1), g = HU.lvG[lv], gu = HU.lvG[lv + 1];
    const xa = s.x0 * Tt, xb = (s.x1 + 1) * Tt, zt = s.y0 * Tt, zb = (s.y1 + 1) * Tt, n = 16, L = zb - zt;
    for (let i = 0; i < n; i++) { const h = (i + 1) / n * Mp.FLOOR_H, z = zb - (i + .5) * L / n; box(xb - xa - .04, h, L / n + .01, stM, (xa + xb) / 2, y0 + h / 2, z, g); }
    [[xa + .08, s.x0 - 1], [xb - .08, s.x1 + 1]].forEach(([x, side]) => {
      if (Mp.at(lv, side, s.y1) === 0) return; // جنبه جدار، ما يحتاج درابزين
      for (let i = 0; i <= 8; i++) { const z = zb - i * L / 8, h = i / 8 * Mp.FLOOR_H; cyl(.03, .03, 1, railM, x, y0 + h + .5, z, g, 5); }
      const rail = box(.08, .06, Math.hypot(L, Mp.FLOOR_H), railM, x, y0 + Mp.FLOOR_H / 2 + 1, (zt + zb) / 2, g); rail.rotation.x = Math.atan2(Mp.FLOOR_H, L);
    });
    for (let x = s.x0; x <= s.x1; x++) for (let y = s.y0; y <= s.y1; y++) for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nc = Mp.at(lv + 1, x + dx, y + dy); if (nc === 5 || nc === 0) continue;
      if (dy === -1 && y === s.y0) continue; // من هنا تطلع
      const ex = dx ? (dx > 0 ? (x + 1) * Tt : x * Tt) : (x + .5) * Tt, ez = dy ? (dy > 0 ? (y + 1) * Tt : y * Tt) : (y + .5) * Tt;
      box(dx ? .1 : Tt, .4, dx ? Tt : .1, slabM, ex, up - .2, ez, gu);
      box(dx ? .08 : Tt, .07, dx ? Tt : .08, railM, ex, up + 1, ez, gu);
      for (let k = 0; k < 4; k++) cyl(.025, .025, 1, railM, dx ? ex : x * Tt + (k + .5) * Tt / 4, up + .5, dy ? ez : y * Tt + (k + .5) * Tt / 4, gu, 5);
    }
  });
  // ---- الأبواب: ضلفتين تنفتح لما أحد يقرّب ----
  const doorM = wmat('wood_cabinet_worn_long', { color: 0x9a7a62 }), knobM = hMat({ color: 0xb08a3a, emissive: 0x1a1000 }), chainM = hMat({ color: 0x55504a, emissive: 0x080808 });
  Mp.DOORS.forEach(d => {
    const lv = d.lv, y0 = Mp.baseY(lv), ns = Mp.at(lv, d.x - 1, d.y) === 0 && Mp.at(lv, d.x + 1, d.y) === 0; // ns: الجدار يمين ويسار والممشى شمال/جنوب
    const cx = (d.x + .5) * Tt, cz = (d.y + .5) * Tt, g = HU.lvG[lv], leaves = [];
    [-1, 1].forEach(sd => {
      const h = new T.Group(); g.add(h);
      if (ns) { h.position.set(cx + sd * .98, y0, cz); box(.96, 2.4, .07, doorM, -sd * .48, 1.2, 0, h); box(.05, .05, .12, knobM, -sd * .86, 1.1, 0, h); }
      else { h.position.set(cx, y0, cz + sd * .98); box(.07, 2.4, .96, doorM, 0, 1.2, -sd * .48, h); box(.12, .05, .05, knobM, 0, 1.1, -sd * .86, h); }
      h.userData.sd = sd; h.userData.dyn = 1; leaves.push(h);
    });
    if (ns) { box(.12, 2.5, .22, railM, cx - 1, y0 + 1.25, cz, g); box(.12, 2.5, .22, railM, cx + 1, y0 + 1.25, cz, g); box(2.1, .12, .22, railM, cx, y0 + 2.48, cz, g); }
    else { box(.22, 2.5, .12, railM, cx, y0 + 1.25, cz - 1, g); box(.22, 2.5, .12, railM, cx, y0 + 1.25, cz + 1, g); box(.22, .12, 2.1, railM, cx, y0 + 2.48, cz, g); }
    let lock = null;
    if (d.lock) {
      lock = new T.Group(); lock.userData.dyn = 1; g.add(lock); lock.position.set(cx, y0 + 1.15, cz); if (!ns) lock.rotation.y = Math.PI / 2;
      for (const s of [-1, 1]) { box(1.9, .05, .05, chainM, 0, 0, s * .07, lock).rotation.z = .5; box(1.9, .05, .05, chainM, 0, 0, s * .07, lock).rotation.z = -.5; box(.22, .26, .1, knobM, 0, -.05, s * .12, lock); }
    }
    HU.doors.push({ d, ns, cx, cz, lv, leaves, t: 0, open: 0, lock });
  });
  // ---- الباب الأمامي الكبير + برا ----
  const [elv, ex0, ey] = Mp.EXIT[0], ecx = (ex0 + 1) * Tt, ecz = (ey + 1) * Tt - .3, eg = HU.lvG[elv], ey0 = Mp.baseY(elv);
  HU.exitDoor = { leaves: [], t: 0 };
  [-1, 1].forEach(sd => {
    const h = new T.Group(); h.position.set(ecx + sd * 2, ey0, ecz); eg.add(h);
    const src = HU.models.large_castle_door;
    if (src) { const leaf = src.clone(true); const mm = HU.meta.large_castle_door; leaf.position.set(-sd * 1 - (mm.min[0] + mm.max[0]) / 2 * (sd > 0 ? -1 : 1), -mm.min[1], 0); if (sd > 0) leaf.scale.x = -1; h.add(leaf); }
    else box(1.95, 3, .15, doorM, -sd * 1, 1.5, 0, h);
    h.userData.sd = sd; h.userData.dyn = 1; HU.exitDoor.leaves.push(h);
  });
  const chains = new T.Group(); chains.userData.dyn = 1; chains.position.set(ecx, ey0 + 1.4, ecz - .25); eg.add(chains); HU.exitDoor.chains = chains;
  for (let i = 0; i < 4; i++) box(3.6, .06, .06, chainM, 0, (i - 1.5) * .35, 0, chains).rotation.z = (i % 2 ? .25 : -.25);
  const runeM = new T.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: .8, side: T.DoubleSide }); HU.exitDoor.rune = runeM;
  const rune = new T.Mesh(new T.RingGeometry(.35, .45, 6), runeM); rune.position.set(0, .3, -.06); chains.add(rune);
  const grass = wmat('withered_grass'); const gr = new T.Mesh(new T.PlaneGeometry(24, 14), grass); gr.rotation.x = -Math.PI / 2; gr.position.set(ecx, ey0 - .02, (ey + 1) * Tt + 7); eg.add(gr);
  if (gr.material.map) { gr.material = gr.material.clone(); gr.material.map = gr.material.map.clone(); gr.material.map.repeat.set(10, 6); gr.material.map.needsUpdate = true; }
  const night = new T.Mesh(new T.PlaneGeometry(40, 16), new T.MeshBasicMaterial({ color: 0x0c1526, fog: false })); night.position.set(ecx, ey0 + 4, (ey + 1) * Tt + 14); night.rotation.y = Math.PI; eg.add(night);
  HU.moon = new T.PointLight(0x8fb4ff, 0, 24, 1.3); HU.moon.position.set(ecx, ey0 + 3, (ey + 1) * Tt + 2); eg.add(HU.moon);
  // ---- النوافذ ----
  const winGlass = HU.winGlass = new T.MeshBasicMaterial({ color: 0x0a1220, transparent: true, opacity: .92 });
  const frameM = hMat({ color: 0x1a1210 });
  HU.windows.forEach(w => {
    const o = new T.Group(); HU.lvG[w.lv].add(o);
    o.position.set(w.x + w.nx * .02, Mp.baseY(w.lv) + 1.75, w.z + w.nz * .02); o.rotation.y = Math.atan2(w.nx, w.nz);
    o.add(new T.Mesh(new T.PlaneGeometry(1.1, 1.6), winGlass));
    [[1.3, .1, 0, .85], [1.3, .1, 0, -.85], [.1, 1.8, -.6, 0], [.1, 1.8, .6, 0], [.06, 1.6, 0, 0], [1.1, .06, 0, .1]].forEach(([w2, h2, x, y]) => box(w2, h2, .08, frameM, x, y, .02, o));
    box(1.45, .08, .2, frameM, 0, -.92, .08, o);
  });
  HU.bolt = new T.DirectionalLight(0xbfd4ff, 0); HU.bolt.position.set(-30, 30, 40); scene.add(HU.bolt);
  // ---- الأثاث ----
  const lampOn = HU.lampOn = new T.MeshBasicMaterial({ color: 0xffd08a }), lampOff = HU.lampOff = hMat({ color: 0x2a2620 });
  Mp.PROPS.forEach(p => {
    const y0 = Mp.baseY(p.lv), o = new T.Group(); HU.lvG[p.lv].add(o);
    o.position.set(p.x, y0 + (p.ceil ? CE : (p.y || 0)), p.z); o.rotation.y = -(p.r || 0) * Math.PI / 2;
    const src = HU.models[p.m], mm = HU.meta[p.m];
    if (src && mm) {
      const m = src.clone(true), s = p.s || 1; m.scale.setScalar(s);
      m.position.set(-(mm.min[0] + mm.max[0]) / 2 * s, -(p.ceil ? mm.max[1] : mm.min[1]) * s, -(mm.min[2] + mm.max[2]) / 2 * s);
      if (!p.wall && !p.ceil) m.traverse(c => { if (c.isMesh) { c.castShadow = !!HU.shadows; c.receiveShadow = true; } });
      o.add(m);
    } else buildBuiltin(p, o);
    if (p.lamp) {
      const bulb = new T.Mesh(new T.SphereGeometry(p.lamp === 2 ? .09 : .06, 8, 6), lampOff);
      bulb.position.set(0, p.ceil ? -.55 : .2, p.wall ? .14 : 0); bulb.userData.dyn = 1; o.add(bulb);
      const wp = new T.Vector3(); o.updateMatrixWorld(true); bulb.getWorldPosition(wp);
      HU.lamps.push({ p, bulb, big: p.lamp === 2, pos: wp });
    }
    if (p.hide || p.rat) o.userData.dyn = 1;
    if (p.hide) HU.ward[p.i] = { o, t: 0, open: 0, x0: o.position.x };
    if (p.rat) HU.rats.push({ o, lv: p.lv, x: p.x, z: p.z, tx: p.x, tz: p.z, wait: 0 });
    if (p.mirror) { const gl = new T.Mesh(new T.PlaneGeometry(.38, .62), new T.MeshBasicMaterial({ color: 0x0a0d12 })); gl.position.set(0, (p.h || 1) / 2, .03); o.add(gl); }
  });
  // ---- الإضاءة ----
  HU.amb = new T.AmbientLight(0x223044, .05); scene.add(HU.amb);
  HU.hemi = new T.HemisphereLight(0x3a4466, 0x0a0806, .03); scene.add(HU.hemi);
  HU.pool = [0, 1, 2, 3].map(() => { const l = new T.PointLight(0xffb46a, 0, 11, 1.7); scene.add(l); return l; });
  HU.candle = new T.PointLight(0xff9a40, 0, 6, 1.8); scene.add(HU.candle); // شمعة المكتبة (دايم شغالة)
  const ol = Mp.PROPS.find(p => p.m === 'vintage_oil_lamp'); if (ol) { HU.candle.position.set(ol.x, Mp.baseY(ol.lv) + (ol.y || 0) + .5, ol.z); HU.candle.userData.lv = ol.lv; }
  const cam = HU.cam = new T.PerspectiveCamera(72, 1, .05, 70); cam.rotation.order = 'YXZ'; scene.add(cam);
  HU.listener = new T.AudioListener(); cam.add(HU.listener);
  const sp = HU.spot = new T.SpotLight(0xfff1d6, 70, 30, .62, .45, 1.4); sp.position.set(.18, -.2, 0); cam.add(sp); sp.target.position.set(.1, -.3, -5); cam.add(sp.target);
  if (HU.shadows) { sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.camera.near = .2; sp.shadow.camera.far = 26; sp.shadow.bias = -.0015; sp.shadow.normalBias = .02; }
  HU.glow = new T.PointLight(0xfff1d6, 0, 3.5, 2); cam.add(HU.glow);
  HU.oPool = [0, 1].map(() => { const l = new T.SpotLight(0xfff1d6, 0, 20, .5, .6, 1.6); scene.add(l); scene.add(l.target); return l; });
  // يد الشبح
  const claws = HU.claws = new T.Group(); cam.add(claws);
  const cm = hMat({ color: 0xd8dde6, emissive: 0x3a4250, transparent: true, opacity: .9 });
  [-1, 1].forEach(s => { const a = new T.Group(); a.position.set(s * .32, -.42, -.55); claws.add(a); cyl(.035, .05, .5, cm, 0, 0, 0, a, 6).rotation.x = Math.PI / 2 - .3; for (let k = 0; k < 4; k++) cyl(.008, .015, .16, cm, (k - 1.5) * .025, .05, -.27, a, 4).rotation.x = Math.PI / 2 + .5; });
  claws.visible = false;
  HU.items = new T.Group(); scene.add(HU.items); HU.itemMap = {};
  HU.lvG.forEach(hMerge);
  HU.built = true;
}

// ندمج الأشياء الثابتة بكل طابق (حسب المادة ومربعات ١٦ متر) عشان نقلل الرسم من آلاف لعشرات
function hMerge(root) {
  const T = HU.T, BGU = HU.BGU, CELL = 16, bins = new Map(), kill = [];
  if (!BGU) return;
  root.updateMatrixWorld(true);
  const keyOf = m => m.map ? m.uuid : [m.type, m.color && m.color.getHex(), m.emissive ? m.emissive.getHex() : 0, m.opacity, m.transparent, m.side, m.blending].join();
  const conv = (geo, mw) => {
    const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv, n = P.count, g = new T.BufferGeometry();
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { pos[i * 3] = P.getX(i); pos[i * 3 + 1] = P.getY(i); pos[i * 3 + 2] = P.getZ(i); if (N) { nor[i * 3] = N.getX(i); nor[i * 3 + 1] = N.getY(i); nor[i * 3 + 2] = N.getZ(i); } if (U) { uv[i * 2] = U.getX(i); uv[i * 2 + 1] = U.getY(i); } }
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const idx = new Uint32Array(geo.index ? geo.index.count : n); for (let i = 0; i < idx.length; i++) idx[i] = geo.index ? geo.index.getX(i) : i; g.setIndex(new T.BufferAttribute(idx, 1));
    if (!N) g.computeVertexNormals();
    g.applyMatrix4(mw); if (mw.determinant() < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 2]; idx[i + 2] = t; } }
    return g;
  };
  const walk = o => {
    if (o.userData.dyn || o.userData.keep) return;
    if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && o.geometry && o.geometry.attributes.position && !Array.isArray(o.material)) {
      const g = conv(o.geometry, o.matrixWorld); g.computeBoundingSphere();
      const c = g.boundingSphere.center, k = keyOf(o.material) + '|' + o.castShadow + '|' + Math.floor(c.x / CELL) + ',' + Math.floor(c.z / CELL);
      if (!bins.has(k)) bins.set(k, { mat: o.material, cast: o.castShadow, list: [] });
      bins.get(k).list.push(g); kill.push(o);
    }
    o.children.forEach(walk);
  };
  root.children.forEach(walk);
  kill.forEach(o => o.parent.remove(o));
  bins.forEach(b => { const g = b.list.length > 1 ? BGU.mergeGeometries(b.list, false) : b.list[0]; if (!g) return; const m = new T.Mesh(g, b.mat); m.castShadow = b.cast; m.receiveShadow = true; m.userData.keep = 1; root.add(m); });
}
// القطع اللي نبنيها بالكود
function buildBuiltin(p, o) {
  const T = HU.T, wood = wmat('wood_cabinet_worn_long', { color: 0x8a6a52 }), dark = hMat({ color: 0x1e1612 }), metal = hMat({ color: 0x55585e }), brass = hMat({ color: 0xb08a3a, emissive: 0x1a1000 });
  if (p.m === 'steel_box') {
    box(.8, 1, .25, metal, 0, 1.3, 0, o); box(.76, .96, .03, hMat({ color: 0x3d4046 }), 0, 1.3, .14, o);
    HU.fuseLeds = [0, 1, 2].map(i => { const m = new T.Mesh(new T.SphereGeometry(.04, 8, 6), new T.MeshBasicMaterial({ color: 0x550000 })); m.position.set(-.22 + i * .22, 1.62, .17); m.userData.dyn = 1; o.add(m); return m; });
    [0, 1, 2].forEach(i => box(.12, .26, .06, dark, -.22 + i * .22, 1.25, .16, o));
    cyl(.03, .03, 3, metal, .3, 1.5, -.05, o, 6);
    // ورقة تحذير
    const warn = new T.Mesh(new T.PlaneGeometry(.3, .2), new T.MeshLambertMaterial({ map: tex(cvs(128, 84, (x, w, h) => { x.fillStyle = '#d8cc9a'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.font = '700 30px Tajawal, sans-serif'; x.textAlign = 'center'; x.fillText('⚡ ٣ فيوزات', w / 2, 50); grime(x, w, h, 8, .4); })) }));
    warn.position.set(0, .6, .14); o.add(warn);
  } else if (p.m === 'wine_rack') {
    const g1 = hMat({ color: 0x1a2a1a }), g2 = hMat({ color: 0x2a0a0a });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) if (Math.random() < .8) cyl(.04, .04, .4, Math.random() < .5 ? g1 : g2, -1.2 + c * .3, .3 + r * .45, 0, o, 6).rotation.x = Math.PI / 2;
    box(2.8, .06, .5, wood, 0, .08, 0, o); box(2.8, .06, .5, wood, 0, 2.05, 0, o); box(.06, 2, .5, wood, -1.38, 1.05, 0, o); box(.06, 2, .5, wood, 1.38, 1.05, 0, o);
  } else if (p.m === 'piano') {
    const blk = hMat({ color: 0x0c0a09 });
    box(1.6, 1.25, .6, blk, 0, .62, -.05, o); box(1.5, .05, .28, hMat({ color: 0xd8d2c0 }), 0, .78, .32, o); box(1.6, .08, .4, blk, 0, .82, .3, o);
    for (let i = 0; i < 14; i++) box(.03, .04, .14, hMat({ color: 0x111111 }), -.7 + i * .108, .82, .3, o);
  } else if (p.m === 'altar') {
    const st = wmat('old_stone_wall'); box(2, .9, 1.2, st, 0, .45, 0, o); box(2.2, .12, 1.35, st, 0, .96, 0, o);
    HU.altarSlots = [0, 1, 2, 3].map(i => { const g = new T.Group(); g.userData.dyn = 1; g.position.set(-.75 + i * .5, 1.02, 0); g.visible = false; o.add(g); relicMesh(i, g); return g; });
    HU.altarFlames = [];
    [-.95, .95].forEach(x => { cyl(.04, .05, .5, hMat({ color: 0x111111 }), x, 1.27, .5, o, 6); const f = new T.Mesh(new T.ConeGeometry(.035, .12, 6), new T.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: .9 })); f.position.set(x, 1.58, .5); f.userData.dyn = 1; o.add(f); HU.altarFlames.push(f); });
    const circ = new T.Mesh(new T.RingGeometry(1.6, 1.68, 40), new T.MeshBasicMaterial({ color: 0x8a1010, transparent: true, opacity: .7, side: T.DoubleSide })); circ.rotation.x = -Math.PI / 2; circ.position.y = .01; circ.userData.dyn = 1; o.add(circ); HU.altarCirc = circ;
    HU.altarL = new T.PointLight(0xff5020, 0, 7, 1.6); HU.altarL.position.set(0, 1.8, .4); o.add(HU.altarL);
  } else if (p.m === 'cage') {
    const bars = hMat({ color: 0x3a3632 });
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; cyl(.025, .025, 2.4, bars, Math.cos(a) * .95, 1.2, Math.sin(a) * .95, o, 5); }
    [2.4, .05].forEach(y => { const ring = new T.Mesh(new T.TorusGeometry(.95, .04, 6, 24), bars); ring.rotation.x = Math.PI / 2; ring.position.y = y; o.add(ring); });
    cyl(.03, .03, 1.2, bars, 0, 3, 0, o, 5);
  } else if (p.m === 'sconce') {
    box(.12, .2, .04, brass, 0, 0, .02, o); cyl(.015, .015, .2, brass, 0, .05, .1, o, 5).rotation.x = Math.PI / 2;
    const shade = new T.Mesh(new T.ConeGeometry(.09, .14, 10, 1, true), hMat({ color: 0xd8c8a0, side: T.DoubleSide })); shade.position.set(0, .24, .14); o.add(shade);
  } else if (p.m === 'woodentable_02') {
    box(1.4, .07, .9, wood, 0, .78, 0, o); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(.07, .76, .07, wood, a * .62, .38, b * .38, o));
  }
}
function relicMesh(i, g) {
  const T = HU.T;
  if (i === 0) { box(.12, .16, .08, hMat({ color: 0x6a2a2a }), 0, .08, 0, g); const h = new T.Mesh(new T.SphereGeometry(.07, 10, 8), hMat({ color: 0x8a6a6a })); h.position.y = .21; g.add(h); [-1, 1].forEach(s => { const e = new T.Mesh(new T.SphereGeometry(.015, 6, 4), new T.MeshBasicMaterial({ color: 0x000000 })); e.position.set(s * .025, .22, .06); g.add(e); }); }
  else if (i === 1) { box(.22, .28, .02, hMat({ color: 0x3a2a1a }), 0, .14, 0, g); box(.17, .22, .01, hMat({ color: 0x9a948a, emissive: 0x111111 }), 0, .14, .012, g); }
  else if (i === 2) { cyl(.04, .045, .26, hMat({ color: 0x0a0a0a }), 0, .13, 0, g, 8); const f = new T.Mesh(new T.ConeGeometry(.02, .07, 6), new T.MeshBasicMaterial({ color: 0x9a40ff })); f.position.y = .3; g.add(f); }
  else { box(.22, .06, .28, hMat({ color: 0x4a0e0e }), 0, .03, 0, g); box(.2, .04, .26, hMat({ color: 0xd8cdb0 }), .01, .03, 0, g); }
}
function itemMesh(k, sub) {
  const T = HU.T, g = new T.Group();
  if (k === 'fuse') { const gl = new T.Mesh(new T.CylinderGeometry(.05, .05, .2, 10), new T.MeshLambertMaterial({ color: 0xffe08a, emissive: 0x6a4a00, transparent: true, opacity: .85 })); gl.rotation.z = Math.PI / 2; g.add(gl); [-1, 1].forEach(s => { cyl(.055, .055, .04, hMat({ color: 0xb87333 }), s * .11, 0, 0, g, 10).rotation.z = Math.PI / 2; }); }
  else if (k === 'key') { const col = { study: 0xffcf4a, master: 0xcfd4dc, attic: 0xb0503a }[sub] || 0xffcf4a, gm = hMat({ color: col, emissive: col, emissiveIntensity: .25 }); const ring = new T.Mesh(new T.TorusGeometry(.06, .018, 8, 16), gm); ring.position.y = .1; g.add(ring); cyl(.013, .013, .2, gm, 0, -.04, 0, g, 6); box(.045, .022, .015, gm, .028, -.12, 0, g); box(.035, .022, .015, gm, .022, -.07, 0, g); g.scale.setScalar(1.4); }
  else if (k === 'relic') relicMesh(sub, g);
  else { cyl(.04, .04, .16, hMat({ color: 0x1f9d55, emissive: 0x063a1c }), 0, 0, 0, g, 10); cyl(.015, .015, .03, hMat({ color: 0xb08a3a }), 0, .095, 0, g, 8); }
  HU.glintT = HU.glintT || tex(cvs(64, 64, (x, w, h) => { const r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,240,200,.9)'); r.addColorStop(.25, 'rgba(255,220,150,.25)'); r.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h); }));
  const gl = new T.Sprite(new T.SpriteMaterial({ map: HU.glintT, depthWrite: false, transparent: true, blending: T.AdditiveBlending }));
  gl.scale.set(.55, .55, 1); g.add(gl); g.userData.glint = gl;
  return g;
}

// ---------- الشخصيات ----------
function hNameTag(text, col) {
  const T = HU.T, c = cvs(256, 64, (x, w, h) => { x.font = '700 30px Tajawal, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 7; x.strokeStyle = '#16130f'; x.strokeText(text, w / 2, h / 2); x.fillStyle = col; x.fillText(text, w / 2, h / 2); });
  const s = new T.Sprite(new T.SpriteMaterial({ map: tex(c), depthWrite: false, transparent: true })); s.scale.set(1.1, .28, 1); return s;
}
function charObj(id, isG) {
  const T = HU.T, g = new T.Group(), p = S.players.find(q => q.id === id);
  const ch = HU.HC.makeChar(isG ? null : (p && p.lk) || HU.HC.DEFAULT_LOOK, isG);
  ch.root.rotation.y = Math.PI; g.add(ch.root);
  if (isG) {
    ch.root.scale.set(.95, 1.14, .95);
    ch.root.traverse(c => { if (c.material) { c.material.transparent = true; c.material.opacity = .85; } });
    const eyes = new T.PointLight(0xff2222, 1.5, 3, 2); eyes.position.set(0, 2.05, -.35); g.add(eyes); g.userData.eyes = eyes;
  } else {
    ch.root.scale.setScalar(.92);
    const hand = ch.bones.hand_r;
    if (hand) { const fl = new T.Group(); hand.add(fl); cyl(.03, .04, .2, hMat({ color: 0x2a2a2a }), 0, .1, .03, fl, 8); const lens = new T.Mesh(new T.CircleGeometry(.035, 10), new T.MeshBasicMaterial({ color: 0xfff1c8 })); lens.position.set(0, .205, .03); lens.rotation.x = -Math.PI / 2; fl.add(lens); g.userData.lens = lens; }
    const cone = new T.Mesh(new T.ConeGeometry(1.3, 7, 20, 1, true), new T.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: .022, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    cone.rotation.x = -Math.PI / 2; cone.position.set(.25, 1.25, -3.8); g.add(cone); g.userData.cone = cone;
    const tag = hNameTag(hname(id), hcol(id)); tag.position.y = 2.05; g.add(tag);
  }
  g.userData.ch = ch;
  return g;
}
function charAnim(o, m, isG, dead, t, dt, ex, ez, iAmGhost) {
  const ch = m.userData.ch, sp = o.spd || 0, u = m.userData;
  if (isG) {
    const stun = o.f & 4, near = Math.hypot(o.x - ex, o.z - ez);
    if (stun) ch.play('Hit_Head', .1);
    else if (sp > .5) ch.play(sp > 3.6 ? 'Jog_Fwd_Loop' : 'Walk_Formal_Loop', .3, Math.min(1.6, sp / (sp > 3.6 ? 3.8 : 2.4)));
    else ch.play(near < 5 && !iAmGhost ? 'Spell_Simple_Idle_Loop' : 'Idle_Loop', .4);
    ch.update(dt);
    if (ch.bones.Head) ch.bones.Head.rotation.z += .35 + Math.sin(t / 900) * .1;
    m.position.y += .12 + Math.sin(t / 420) * .08 + (Math.random() < .02 ? (Math.random() - .5) * .3 : 0);
    const op = stun ? .4 + Math.random() * .5 : (o.f & 32 ? .95 : .72 + Math.sin(t / 130) * .1 + (Math.random() < .04 ? -.5 : 0));
    ch.root.traverse(c => { if (c.material) c.material.opacity = op; });
    if (u.eyes) u.eyes.intensity = iAmGhost || stun ? 0 : 1.5;
    if (!iAmGhost && t > (o.growlAt || 0) && near < 18) { o.growlAt = t + 5000 + Math.random() * 7000; snd(pick(['growl_0', 'growl_1', 'growl_2', 'growl_3', 'moan_0', 'moan_1', 'moan_2', 'moan_3']), .9, m.position.clone().setY(m.position.y + 1.8), 3); }
    return;
  }
  if (dead) ch.play('Idle_Loop', .3);
  else if (o.f & 64) ch.play('Crouch_Fwd_Loop', .3, .15);
  else if (o.f & 128) ch.play('Interact', .2);
  else if (sp < .4) ch.play(o.f & 1 ? 'Idle_Torch_Loop' : 'Idle_Loop', .25);
  else if (sp < 4.4) ch.play('Jog_Fwd_Loop', .2, Math.max(.6, sp / 3.6));
  else ch.play('Sprint_Loop', .2, sp / 6);
  ch.update(dt);
  const on = !!(o.f & 1) && !dead; if (u.cone) u.cone.visible = on; if (u.lens) u.lens.material.color.set(on ? 0xfff1c8 : 0x333333);
  if (dead !== u.wasDead) { u.wasDead = dead; ch.root.traverse(c => { if (c.material) { c.material.transparent = dead; c.material.opacity = dead ? .35 : 1; } }); }
  if (sp > .4 && t > (o.stepAt || 0) && Math.hypot(o.x - ex, o.z - ez) < 12) { o.stepAt = t + (sp > 4.4 ? 320 : 480); sfx('step2'); }
}

// ---------- الواجهة ----------
function hauntBuildUI(body) {
  body.dataset.built = 'haunt';
  body.innerHTML = `<div class="hauntw" id="hW">
    <div id="hCvBox" class="hcvbox"></div>
    <div id="hVig" class="hvig"></div><div class="hgrain"></div>
    <div id="hWardV" class="hwardv" hidden></div>
    <div class="hcross" id="hCross"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" class="bg"/><circle cx="20" cy="20" r="16" class="fg" id="hRingFg"/></svg></div>
    <div class="hprompt" id="hPrompt" hidden></div>
    <div class="hobj" id="hObj"></div>
    <div class="htop"><div class="hinv" id="hInv"></div><div class="htime" id="hTime">⏳</div></div>
    <div class="hrole" id="hRole"></div>
    <button type="button" class="sbtn hmapb" id="hMapB" title="الخريطة (M)">🗺️<b>الخريطة</b></button>
    <button type="button" class="hsetb" id="hSetB" title="الإعدادات">⚙️</button>
    <div class="hbars" id="hBars"><div class="hbar bat"><span>🔦</span><i id="hBat"></i></div><div class="hbar sta"><span>🏃</span><i id="hSta"></i></div></div>
    <div class="hbtns" id="hBtns">
      <button type="button" class="sbtn big yel" id="hUseB">✋<b>استخدم</b></button>
      <button type="button" class="sbtn" id="hFlB">🔦<b>الكشاف</b></button>
      <button type="button" class="sbtn" id="hRunB">🏃<b>اركض</b></button>
      <button type="button" class="sbtn red" id="hScrB">😱<b>اصرخ</b><i></i></button>
      <button type="button" class="sbtn" id="hMirB">🪞<b>مراية</b><i></i></button>
      <button type="button" class="skillbig hcatch" id="hCatchB"><span>👻</span><b>امسك</b><i></i></button>
      <button type="button" class="sbtn" id="hFolB">👁<b>تابع</b></button>
      <button type="button" class="sbtn" id="hUpB">⬆️<b>فوق</b></button>
      <button type="button" class="sbtn" id="hDnB">⬇️<b>تحت</b></button>
    </div>
    <div id="hJoy" class="sjoy" hidden><i></i></div>
    <div id="hTrap" class="htrap" hidden></div>
    <div id="hMapBox" class="smapbox hmapbox" hidden><div class="hmaptabs" id="hMapTabs"></div><canvas id="hMapCv"></canvas><small>اضغط برا الخريطة عشان تسكّر</small></div>
    <div id="hSet" class="hset" hidden></div>
    <div id="hLoad" class="hfull hload"><b>جاري فتح باب القصر…</b><div class="hlbar"><i id="hLoadI"></i></div></div>
    <div id="hIntro" class="hfull hintro" hidden></div>
    <div id="hJump" class="hjump" hidden></div>
    <div id="hLock" class="hlock" hidden>اضغط على الشاشة عشان تلف بالماوس 🖱️</div>
  </div>`;
  const w = $('#hW');
  w.addEventListener('pointerdown', e => {
    if (e.target.closest('button,.smapbox,.hset') || !hg()) return;
    if (e.pointerType === 'mouse') { if (!document.pointerLockElement && HU.r) { try { HU.r.domElement.requestPointerLock(); } catch {} } else if (hg().me && hg().me.ghost) hCatch(); return; }
    const rc = w.getBoundingClientRect();
    if (e.clientX - rc.left < rc.width * .45 && !HU.joy) { HU.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; hJoyDraw(); }
    else if (!HU.look) HU.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  w.addEventListener('pointermove', e => {
    const j = HU.joy;
    if (j && j.id === e.pointerId) { let dx = e.clientX - j.ox, dy = e.clientY - j.oy; const d = Math.hypot(dx, dy); if (d > 60) { dx *= 60 / d; dy *= 60 / d; } j.dx = dx; j.dy = dy; hJoyDraw(); }
    const l = HU.look;
    if (l && l.id === e.pointerId) { hTurn((e.clientX - l.x) * .0055 * hset.sens, (e.clientY - l.y) * .0045 * hset.sens); l.x = e.clientX; l.y = e.clientY; }
  });
  const up = e => { if (HU.joy && HU.joy.id === e.pointerId) { HU.joy = null; hJoyDraw(); } if (HU.look && HU.look.id === e.pointerId) HU.look = null; };
  w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
  $('#hUseB').onclick = hUse;
  $('#hFlB').onclick = hToggleFl;
  const rb = $('#hRunB'); rb.onpointerdown = e => { e.preventDefault(); HU.runBtn = !HU.runBtn; rb.classList.toggle('on', HU.runBtn); };
  $('#hScrB').onclick = () => send({ t: 'scream' });
  $('#hMirB').onclick = () => send({ t: 'use' });
  $('#hCatchB').onclick = hCatch;
  $('#hFolB').onclick = () => { HU.follow++; };
  $('#hUpB').onclick = () => hSpiritLv(1);
  $('#hDnB').onclick = () => hSpiritLv(-1);
  $('#hMapB').onclick = () => hMapToggle();
  $('#hMapBox').onclick = e => { if (e.target.id === 'hMapBox' || e.target.tagName === 'SMALL') hMapToggle(false); };
  $('#hSetB').onclick = () => hSettings();
}
const hSpirit = () => { const g = hg(); return !g || !g.me || (!g.me.ghost && (!g.me.alive || g.me.escaped)); };
function hSpiritLv(d) { if (!hSpirit()) return; HU.follow = 0; HU.lv = Math.max(0, Math.min(HMAP.LV - 1, HU.lv + d)); sfx('flick'); }
function hSettings() {
  const el = $('#hSet'); el.hidden = !el.hidden; if (el.hidden) return;
  el.innerHTML = `<b>الإعدادات</b><label>حساسية اللف <input type="range" id="hSens" min=".3" max="2.5" step=".1" value="${hset.sens}"></label>
    <label>الجودة <select id="hQ"><option value="0"${hset.q ? '' : ' selected'}>خفيفة (للجوال)</option><option value="1"${hset.q ? ' selected' : ''}>عالية</option></select></label><small>الجودة تتغير بعد ما تحدّث الصفحة</small><button type="button" class="btn sm" id="hSetX">تمام</button>`;
  $('#hSens').oninput = e => { hset.sens = +e.target.value; hsave(); };
  $('#hQ').onchange = e => { hset.q = +e.target.value; hsave(); };
  $('#hSetX').onclick = () => { el.hidden = true; };
}
function hJoyDraw() { const j = HU.joy, el = $('#hJoy'); if (!el) return; el.hidden = !j; if (!j) return; const w = $('#hW').getBoundingClientRect(); el.style.left = (j.ox - w.left) + 'px'; el.style.top = (j.oy - w.top) + 'px'; el.firstChild.style.transform = `translate(${j.dx}px,${j.dy}px)`; }
function hTurn(dx, dy) { HU.yaw -= dx; HU.pitch = Math.max(-1.25, Math.min(1.2, HU.pitch - dy)); }
function hToggleFl() { const g = hg(); if (!g || !g.me || g.me.ghost) return; HU.fl = !HU.fl; sfx('flick'); }
function hUse() { if (HU.hold) { send({ t: 'stop' }); return; } if (HU.act && HU.act.k !== 'catch') send({ t: 'use' }); }
function hCatch() { if (HU.act && HU.act.k === 'catch') send({ t: 'catch', id: HU.act.id }); else if (HU.act && (HU.act.k === 'ward' || HU.act.k === 'mirror')) send({ t: 'use' }); }
function hMapToggle(v) { HU.mapOn = v === undefined ? !HU.mapOn : v; const b = $('#hMapBox'); if (b) b.hidden = !HU.mapOn; if (HU.mapOn) { HU.mapLv = HU.lv; hDrawMap(); try { document.exitPointerLock(); } catch {} } }
document.addEventListener('mousemove', e => { if (hg() && HU.r && document.pointerLockElement === HU.r.domElement) hTurn(e.movementX * .0022 * hset.sens, e.movementY * .002 * hset.sens); });
document.addEventListener('pointerlockchange', () => { const l = $('#hLock'); if (l) l.hidden = !!document.pointerLockElement || isMob() || !hg() || S.phase !== 'play'; });
addEventListener('keydown', e => {
  if (!hg() || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'ص', 'ش', 'س', 'ي', 'shift'].includes(k)) { HU.keys[k] = 1; e.preventDefault(); }
  if (e.repeat) return;
  if (k === 'e' || k === ' ' || k === 'ث') { e.preventDefault(); const g = hg(); if (g.me && g.me.ghost) hCatch(); else hUse(); }
  if (k === 'f' || k === 'ب') hToggleFl();
  if (k === 'q' || k === 'ض') send({ t: 'scream' });
  if (k === 'm' || k === 'ة') hMapToggle();
  if (k === 'r' || k === 'ق') hSpiritLv(1);
  if (k === 'c' || k === 'ؤ') hSpiritLv(-1);
  if (k === 'tab') { e.preventDefault(); HU.follow++; }
});
addEventListener('keyup', e => { delete HU.keys[e.key.toLowerCase()]; });
addEventListener('blur', () => { HU.keys = {}; });

function renderHaunt(body) {
  if (body.dataset.built !== 'haunt' || !$('#hW')) { hauntBuildUI(body); HU.gameKey = null; }
  if (!HU.libsDone || !HU.worldDone) {
    if (!HU.loading) {
      HU.loading = true;
      const bar = p => { const i = $('#hLoadI'); if (i) i.style.width = Math.round(p * 100) + '%'; };
      hLibs().then(() => { HU.libsDone = true; return hLoadWorld(bar); }).then(() => { HU.worldDone = true; HU.loading = false; if (hg()) renderHaunt($('#g2body')); })
        .catch(e => { console.warn(e); HU.loading = false; HU.libs = null; HU.worldP = null; const l = $('#hLoad b'); if (l) l.textContent = 'ما قدرنا نحمّل القصر 😢 حدّث الصفحة'; });
    }
    return;
  }
  hRenderer(); if (typeof HX !== 'undefined' && HX.mode) hxStop();
  if (!HU.built) hBuild();
  const box = $('#hCvBox'); if (HU.r.domElement.parentNode !== box) { box.appendChild(HU.r.domElement); HU.w = 0; }
  $('#hLoad').hidden = true;
  const g = S.g, me = g.me;
  const gk = S.code + ':' + g.id;
  if (HU.gameKey !== gk) {
    HU.gameKey = gk;
    Object.values(HU.oth).forEach(o => o.mesh && HU.scene.remove(o.mesh)); HU.oth = {};
    HU.items.clear(); HU.itemMap = {}; HU.stam = 100; HU.fl = true; HU.nextScare = performance.now() + 25000 + Math.random() * 20000; HU.powerAt = 0;
    HU.exitDoor.t = 0; Object.values(HU.ward).forEach(w => { w.open = 0; }); HU.doors.forEach(d => { d.t = d.open = 0; });
    HU.yaw = 0; HU.pitch = 0; HU.follow = 0; HU.vx = HU.vz = 0;
    if (!me) { HU.me = { x: HMAP.spawn[1], z: HMAP.spawn[2] }; HU.lv = HMAP.spawn[0]; }
  }
  // الأغراض
  const want = {}; (g.items || []).forEach(([id, k, sub, lv, x, z]) => { want[id] = [k, sub, lv, x, z]; });
  Object.keys(HU.itemMap).forEach(k => { if (!want[k]) { HU.items.remove(HU.itemMap[k]); delete HU.itemMap[k]; } });
  Object.entries(want).forEach(([id, [k, sub, lv, x, z]]) => { if (HU.itemMap[id]) return; const m = itemMesh(k, sub); m.position.set(x, HMAP.baseY(lv) + .55, z); m.userData.ph = Math.random() * 6; m.userData.lv = lv; HU.items.add(m); HU.itemMap[id] = m; });
  if (HU.altarSlots) HU.altarSlots.forEach((s, i) => { s.visible = i < g.relicsIn; });
  if (HU.fuseLeds) HU.fuseLeds.forEach((l, i) => l.material.color.set(i < g.fuseIn ? 0x22ff44 : 0x550000));
  HU.doors.forEach(d => { if (d.lock) d.lock.visible = !g.open.includes(d.d.lock); });
  // الواجهة
  const ghost = !!(me && me.ghost), alive = !!(me && me.alive && !me.escaped), spirit = !me || (!alive && !ghost);
  const W = $('#hW'); W.classList.toggle('ghostv', ghost); W.classList.toggle('spirit', spirit);
  const t = g.team || {};
  $('#hInv').innerHTML = ghost ? '' : `<i title="فيوزات معكم">⚡<b>${t.fuse || 0}</b></i>` + (t.keys || []).filter(k => !g.open.includes(k)).map(k => `<i class="k${k}" title="مفتاح ${LOCKN[k]}">🔑</i>`).join('') + `<i title="قطع ملعونة معكم">🕯️<b>${t.relics || 0}</b></i>`;
  const o = g.obj || {}; $('#hObj').innerHTML = (ghost ? `<span>👻 امنعهم:</span> ` : '<span>المهمة:</span> ') + esc(o.t || '') + (o.of ? `<div class="hobjbar"><i style="width:${(o.n || 0) / o.of * 100}%"></i></div>` : '');
  $('#hRole').textContent = !me ? 'تتفرّج 👁' : ghost ? 'أنت الشبح 👻' : me.escaped ? 'هربت 🚪 تتفرّج' : !me.alive ? 'مت — صرت روح 👁' : me.trapped ? 'محبوس بالقفص 🔒' : me.hidden != null ? 'مختبي بالدولاب 🤫' : `ناجي 🔦 ${me.strikes ? '❤️🖤' : '❤️❤️'}`;
  $('#hBars').hidden = !(alive && !ghost);
  $('#hFlB').hidden = $('#hRunB').hidden = !(alive && !ghost);
  $('#hUseB').hidden = !alive || ghost;
  $('#hScrB').hidden = $('#hCatchB').hidden = $('#hMirB').hidden = !ghost;
  $('#hFolB').hidden = $('#hUpB').hidden = $('#hDnB').hidden = !spirit;
  $('#hWardV').hidden = !(me && me.hidden != null);
  $('#hTrap').hidden = !(me && me.trapped);
  HU.trapLeft = ((g.trapped || []).find(x => x[0] === S.me) || [])[1]; HU.trapAt = performance.now();
  // البداية: تعريف الدور
  const intro = $('#hIntro'); intro.hidden = g.sub !== 'intro';
  if (!intro.hidden && intro.dataset.k !== gk) {
    intro.dataset.k = gk;
    const G = g.ghosts.map(hname).join(' و ');
    intro.innerHTML = !me ? `<h2>القصر المسكون 🏚️</h2><p>تتفرّج على اللعبة</p>` : ghost
      ? `<div class="hbig">👻</div><h2>أنت الشبح</h2><p>القصر بيتك. لا تخليهم يكمّلون الطقس ويهربون.</p><ul><li>تشوف بالظلام، والكشافات تبان لك من بعيد</li><li>الكشاف لو انوجّه عليك <b>يحرقك ويجمّدك</b>، جيهم من وراهم</li><li>😱 الصرخة تطفّي كشافاتهم، و🪞 المرايا تنقلك لمراية ثانية</li><li>أول مسكة تحبسهم بقفص القبو، والثانية تقتلهم</li></ul>`
      : `<div class="hbig">🔦</div><h2>أنت من الناجين</h2><p>الشبح: <b>${esc(G)}</b>. عندكم مهمة طويلة قبل لا تقدرون تهربون:</p><ul><li>⚡ دوّروا ٣ فيوزات وركّبوها بصندوق الكهرباء في القبو</li><li>🔑 المفاتيح تفتح: مكتب الجد ← الغرفة الكبيرة ← العلّية</li><li>🕯️ جيبوا ٤ قطع ملعونة للمذبح بالعلّية وسوّوا الطقس</li><li>🚪 بعدها ينفتح الباب الأمامي. وجّه الكشاف على الشبح عشان تحرقه، واختبي بالدواليب</li></ul>`;
    intro.innerHTML += `<small class="hcred">أصوات: Little Robot Sound Factory (CC-BY 3.0) وغيرهم · أثاث وخامات: Poly Haven · شخصيات: Quaternius</small>`;
    snd(ghost ? 'laugh_1' : 'hit_7', .9);
  }
  if (S.phase === 'over' && !HU.overDone) { HU.overDone = true; try { document.exitPointerLock(); } catch {} snd((g.win === 'ghost') === ghost ? 'win' : 'lose', .7); hsAmb(false); }
  if (S.phase !== 'over') HU.overDone = false;
  $('#hLock').hidden = !!document.pointerLockElement || isMob() || S.phase !== 'play';
  HU.wakeIn = g.wakeIn; HU.wakeAt = performance.now();
  if (S.phase === 'play' && g.sub === 'play') hsAmb(true);
  if (!HU.loop) { HU.loop = true; HU.lt = performance.now(); requestAnimationFrame(hFrame); }
}

// ---------- الحلقة ----------
function hFrame(t) {
  const g = hg();
  if (!g || S.phase === 'lobby' || !$('#hCvBox') || !HU.built) { HU.loop = false; hsAmb(false); try { if (document.pointerLockElement) document.exitPointerLock(); } catch {} return; }
  requestAnimationFrame(hFrame);
  if (window.__noRender) return;
  const dt = Math.min(.05, (t - HU.lt) / 1000); HU.lt = t;
  const Mp = HMAP, me = g.me, cam = HU.cam, now = performance.now();
  const ghost = !!(me && me.ghost), alive = !!(me && me.alive && !me.escaped), hidden = !!(me && me.hidden != null), trapped = !!(me && me.trapped);
  const spirit = !me || (!alive && !ghost);
  const box = $('#hCvBox'), W = box.clientWidth, H = box.clientHeight;
  if (W && H && (HU.w !== W || HU.h !== H)) { HU.w = W; HU.h = H; HU.r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); }
  const playing = g.sub === 'play' && S.phase === 'play';
  const opt = { open: new Set(ghost ? ['study', 'master', 'attic'] : g.open), exitOpen: g.exitOpen };
  // الحركة: تسارع ناعم + انزلاق على الجدران
  let running = false;
  if (HU.me && (playing || spirit) && !HU.mapOn && !hidden && !trapped && !HU.hold) {
    const K = HU.keys;
    let f = 0, s = 0;
    if (K.w || K.arrowup || K['ص']) f++; if (K.s || K.arrowdown || K['س']) f--;
    if (K.d || K['ي']) s++; if (K.a || K['ش']) s--;
    if (K.arrowleft) HU.yaw += dt * 2.4; if (K.arrowright) HU.yaw -= dt * 2.4;
    let jr = false; if (HU.joy && Math.hypot(HU.joy.dx, HU.joy.dy) > 6) { s = HU.joy.dx / 60; f = -HU.joy.dy / 60; jr = Math.hypot(HU.joy.dx, HU.joy.dy) > 56; }
    const l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
    const stunned = ghost && HU.stun - (now - (HU.ghAt || 0)) > 0;
    const asleep = ghost && (HU.wakeIn || 0) - (now - HU.wakeAt) > 0;
    running = !ghost && alive && (K.shift || HU.runBtn || jr) && l > .2 && !HU.tired;
    const sp = spirit ? 7 : ghost ? HR.GSPEED * (g.ritualDone ? .85 : g.power ? 1.06 : 1) : running ? HR.RUN : HR.WALK;
    const sy = Math.sin(HU.yaw), cy = Math.cos(HU.yaw), frz = stunned || asleep;
    const tvx = frz ? 0 : (-sy * f + cy * s) * sp, tvz = frz ? 0 : (-cy * f - sy * s) * sp;
    const k = Math.min(1, dt * (l > .05 ? 11 : 15)); HU.vx += (tvx - HU.vx) * k; HU.vz += (tvz - HU.vz) * k;
    if (spirit && HU.follow) HU.vx = HU.vz = 0;
    const p = HU.me, mx = HU.vx * dt, mz = HU.vz * dt, vm = Math.hypot(HU.vx, HU.vz);
    if (vm > .02) {
      const tryMv = (nx, nz) => { const nl = spirit ? HU.lv : Mp.levelAfter(HU.lv, nx, nz); if (Mp.walk(nl, nx, nz, spirit ? { free: 1 } : opt)) { p.x = nx; p.z = nz; HU.lv = nl; return true; } return false; };
      if (!tryMv(p.x + mx, p.z + mz) && !tryMv(p.x + mx, p.z)) tryMv(p.x, p.z + mz);
      HU.bob += dt * (running ? 12 : 8) * Math.min(1, vm / HR.WALK);
      if (!spirit) { HU.stepT -= dt * Math.min(1.4, vm / HR.WALK); if (HU.stepT <= 0) { HU.stepT = .5; if (!ghost) sfx('step'); } }
    }
    if (running) { HU.stam = Math.max(0, HU.stam - dt * 20); if (!HU.stam) { HU.tired = true; HU.runBtn = false; const rb = $('#hRunB'); if (rb) rb.classList.remove('on'); snd(pick(['breath_0', 'breath_1', 'breath_2']), .6); } }
    else { HU.stam = Math.min(100, HU.stam + dt * 13); if (HU.tired && HU.stam > 30) HU.tired = false; }
    const flOn = HU.fl && HU.bat > 0;
    const key = [p.x.toFixed(2), p.z.toFixed(2), HU.yaw.toFixed(2), flOn, HU.lv].join();
    if (me && playing && key !== HU.last && t - HU.sent > 66) { HU.sent = t; HU.last = key; send({ t: 'mv', x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100, yaw: Math.round(HU.yaw * 100) / 100, fl: flOn, lv: HU.lv }); }
  } else { HU.vx = HU.vz = 0; }
  // الروح تتابع أحد
  if (spirit) {
    const alivePs = Object.values(HU.oth).filter(o => !o.gone && !(o.f & 16));
    const n = HU.follow % (alivePs.length + 1);
    if (n && alivePs.length) { const o = alivePs[n - 1]; HU.me = HU.me || { x: o.x, z: o.z }; HU.lv = o.lv; HU.me.x += (o.x + Math.sin(o.yaw) * 2.4 - HU.me.x) * Math.min(1, dt * 5); HU.me.z += (o.z + Math.cos(o.yaw) * 2.4 - HU.me.z) * Math.min(1, dt * 5); HU.yaw += angD(o.yaw, HU.yaw) * Math.min(1, dt * 4); HU.pitch += (-.25 - HU.pitch) * Math.min(1, dt * 3); }
  }
  // الكاميرا
  let ex = HU.me ? HU.me.x : 0, ez = HU.me ? HU.me.z : 0;
  let eyeY = (spirit ? Mp.baseY(HU.lv) : Mp.heightAt(HU.lv, ex, ez)) + (ghost ? HR.GEYE : spirit ? 2 : HR.EYE);
  if (hidden) { const w = Mp.PROPS[me.hidden]; if (w) { const a = -(w.r || 0) * Math.PI / 2; ex = w.x + Math.sin(a) * .15; ez = w.z + Math.cos(a) * .15; eyeY = Mp.baseY(w.lv) + 1.55; HU.lv = w.lv; } }
  if (trapped) eyeY = Mp.baseY(HU.lv) + 1.1;
  HU.camY += (eyeY - HU.camY) * Math.min(1, dt * 14); if (Math.abs(eyeY - HU.camY) > 2) HU.camY = eyeY;
  const bob = Math.sin(HU.bob) * (running ? .06 : .03);
  let shk = 0; if (HU.shake) { HU.shake = Math.max(0, HU.shake - dt * 1.6); shk = HU.shake * .12; }
  cam.position.set(ex + (Math.random() - .5) * shk, HU.camY + bob + (ghost ? Math.sin(t / 700) * .05 : 0), ez + (Math.random() - .5) * shk);
  cam.rotation.y = HU.yaw + (Math.random() - .5) * shk * .5; cam.rotation.x = HU.pitch + (trapped ? Math.sin(t / 600) * .05 : 0); cam.rotation.z = Math.sin(HU.bob * .5) * (running ? .012 : .005);
  // نرسم بس طابقك واللي جنبه
  const myLv = HU.lv, show = new Set([myLv]);
  Mp.STAIRS.forEach(st => { if ((st.lo === myLv || st.lo + 1 === myLv) && ex > st.x0 * Mp.T - 9 && ex < (st.x1 + 1) * Mp.T + 9 && ez > st.y0 * Mp.T - 9 && ez < (st.y1 + 1) * Mp.T + 9) { show.add(st.lo); show.add(st.lo + 1); } });
  HU.lvG.forEach((gr, i) => { gr.visible = show.has(i); });
  // الإضاءة حسب الدور
  const darkLeft = (HU.dark || 0) - (now - (HU.darkAt || 0));
  const near = alive && !ghost ? HU.near : 99;
  let flk = 1; if (near < 8) flk = Math.random() < (8 - near) / 16 ? Math.random() * .3 : 1;
  const flOn = alive && !ghost && HU.fl && HU.bat > 0 && darkLeft <= 0 && !hidden && !trapped;
  HU.spot.intensity = flOn ? 70 * flk * (HU.bat < 15 ? .45 + Math.random() * .2 : 1) : 0;
  HU.glow.intensity = flOn ? 1 * flk : trapped ? .25 : alive && !ghost ? .45 : 0; // بدون كشاف تشوف شوي حولك بس
  HU.claws.visible = ghost; if (ghost) { HU.claws.scale.x = Math.min(1, cam.aspect / 1.3); HU.claws.children.forEach((a, i) => { a.rotation.x = Math.sin(t / 300 + i) * .08 + (HU.act && HU.act.k === 'catch' ? -.25 : 0); }); }
  HU.amb.color.set(ghost ? 0xc06060 : spirit ? 0x5a6a90 : 0x223044); HU.amb.intensity = ghost ? 2.4 : spirit ? 1.2 : .08 + (g.power ? .06 : 0);
  HU.hemi.intensity = ghost ? 1.2 : spirit ? .5 : .05;
  const fogC = ghost ? 0x1a0303 : 0x020203; HU.scene.fog.color.set(fogC); HU.scene.background.set(fogC); HU.scene.fog.density = ghost ? .04 : spirit ? .035 : .065;
  // البرق من النوافذ
  if (t > (HU.boltAt || 0)) { HU.boltAt = t + 18000 + Math.random() * 25000; HU.boltT = t; if (HU.boltAt > 30000) { setTimeout(() => sfx('thunder'), 300); setTimeout(() => snd('hit_' + (6 + Math.random() * 3 | 0), .3), 500); } }
  const bk = HU.boltT ? t - HU.boltT : 1e9, fl2 = (bk < 90 || (bk > 160 && bk < 230)) ? 1 : 0;
  HU.bolt.intensity = fl2 * 2.2 * (myLv > 0 ? 1 : .2); HU.winGlass.color.setRGB(.04 + fl2 * .8, .07 + fl2 * .8, .13 + fl2 * .75);
  // اللمبات: أقرب ٤ شغالة بطابقك تاخذ ضو حقيقي (عدد ثابت عشان ما ينعاد بناء الشيدر)
  const powerK = g.power ? (HU.powerAt ? Math.min(1, (now - HU.powerAt) / 2500) : 1) : 0;
  if (t - (HU.poolT || 0) > 300) {
    HU.poolT = t;
    const lit = g.power ? HU.lamps.filter(l => l.p.lv === myLv).sort((a, b) => a.pos.distanceToSquared(cam.position) - b.pos.distanceToSquared(cam.position)).slice(0, 4) : [];
    HU.pool.forEach((pl, i) => { const l = lit[i]; pl.userData.l = l; if (l) pl.position.copy(l.pos); });
    if (HU.litState !== !!g.power) { HU.litState = !!g.power; HU.lamps.forEach(l => { l.bulb.material = g.power ? HU.lampOn : HU.lampOff; }); }
  }
  const chOff = HU.chandOff > t;
  HU.pool.forEach(pl => { const l = pl.userData.l; pl.intensity = l && !chOff ? (l.big ? 7 : 3.5) * powerK * (Math.random() < .015 ? .1 : 1) : 0; });
  HU.candle.intensity = HU.candle.userData.lv === myLv ? 1.4 + Math.sin(t / 90) * .25 + Math.random() * .3 : 0;
  // الأبواب تنفتح لما أحد يقرّب
  const people = [[myLv, ex, ez]].concat(Object.values(HU.oth).filter(o => !o.gone).map(o => [o.lv, o.x, o.z]));
  HU.doors.forEach(d => {
    if (Math.abs(d.lv - myLv) > 1) return;
    const locked = d.d.lock && !g.open.includes(d.d.lock) && !ghost;
    const nearP = !locked && people.some(([l, x, z]) => l === d.lv && Math.abs(x - d.cx) < 2.6 && Math.abs(z - d.cz) < 2.6);
    if (nearP && !d.open && d.lv === myLv && Math.hypot(d.cx - ex, d.cz - ez) < 12) sfx('creak');
    d.open = nearP ? 1 : 0; d.t += (d.open - d.t) * Math.min(1, dt * (d.open ? 5 : 2.2));
    d.leaves.forEach(h => { h.rotation.y = d.t * 1.45 * h.userData.sd; });
  });
  const ed = HU.exitDoor; ed.t += ((g.exitOpen ? 1 : 0) - ed.t) * Math.min(1, dt * 1.2); ed.leaves.forEach(h => { h.rotation.y = -ed.t * 1.6 * h.userData.sd; }); ed.chains.visible = !g.exitOpen; ed.rune.opacity = .5 + Math.sin(t / 200) * .3; HU.moon.intensity = ed.t * 12;
  Object.values(HU.ward).forEach(w => { w.t += (w.open - w.t) * Math.min(1, dt * 8); w.o.position.x = w.x0 + Math.sin(t / 25) * w.t * .02; if (w.open && t > w.closeAt) w.open = 0; });
  if (HU.altarFlames) HU.altarFlames.forEach((f, i) => { f.scale.y = .8 + Math.sin(t / 70 + i) * .3; f.visible = g.relicsIn > 0; });
  if (HU.altarCirc) HU.altarCirc.material.opacity = g.ritual ? .5 + Math.sin(t / 90) * .4 : .25 + g.relicsIn * .1;
  if (HU.altarL) HU.altarL.intensity = myLv === 3 ? (g.ritual ? 4 + Math.random() * 2 : g.relicsIn * .6) : 0;
  // الأغراض تلمع
  HU.items.children.forEach(m => { m.visible = m.userData.lv === myLv; if (!m.visible) return; m.rotation.y = t / 700 + m.userData.ph; m.position.y = Mp.baseY(m.userData.lv) + .55 + Math.sin(t / 500 + m.userData.ph) * .05; const d = m.position.distanceTo(cam.position); m.userData.glint.material.opacity = d < 8 ? (.35 + Math.sin(t / 300 + m.userData.ph) * .25) * (1 - d / 8) : 0; });
  // الفيران
  HU.rats.forEach(r => { if (r.lv !== myLv) return; if (t > r.wait) { const a = Math.random() * 6.28, d = 1 + Math.random() * 3, nx = r.x + Math.cos(a) * d, nz = r.z + Math.sin(a) * d; if (Mp.walk(r.lv, nx, nz)) { r.tx = nx; r.tz = nz; } r.wait = t + 1500 + Math.random() * 5000; } const dx = r.tx - r.o.position.x, dz = r.tz - r.o.position.z, dd = Math.hypot(dx, dz); if (dd > .05) { r.o.position.x += dx / dd * Math.min(dd, dt * 4); r.o.position.z += dz / dd * Math.min(dd, dt * 4); r.o.rotation.y = Math.atan2(dx, dz); } });
  // اللاعبين الثانين
  const lit = [];
  Object.entries(HU.oth).forEach(([id, o]) => {
    if (o.dieUntil > t && o.mesh && o.mesh.userData.ch) { o.mesh.userData.ch.update(dt); return; }
    if (o.gone) return;
    const isG = !!(o.f & 2), dead = !!(o.f & 16);
    if (!o.mesh || o.isG !== isG) { if (o.mesh) HU.scene.remove(o.mesh); o.mesh = HU.charsOk ? charObj(id, isG) : new HU.T.Group(); o.isG = isG; HU.scene.add(o.mesh); }
    const k = Math.min(1, dt * 12), dx = o.tx - o.x, dz = o.tz - o.z; o.x += dx * k; o.z += dz * k; o.yaw += angD(o.ty, o.yaw) * k;
    o.spd = (o.spd || 0) + ((Math.hypot(dx, dz) * k / Math.max(dt, .001)) - (o.spd || 0)) * Math.min(1, dt * 6);
    const m = o.mesh; m.visible = !(o.f & 8) && show.has(o.lv);
    m.position.set(o.x, Mp.heightAt(o.lv, o.x, o.z), o.z); m.rotation.y = o.yaw;
    if (m.userData.ch) { charAnim(o, m, isG, dead, t, dt, ex, ez, ghost); if (!isG && (o.f & 1) && !dead) lit.push(o); }
  });
  lit.sort((a, b) => Math.hypot(a.x - ex, a.z - ez) - Math.hypot(b.x - ex, b.z - ez));
  HU.oPool.forEach((l, i) => { const o = lit[i]; if (!o || o.lv !== myLv) { l.intensity = 0; return; } const y = Mp.heightAt(o.lv, o.x, o.z); l.intensity = 26; l.position.set(o.x - Math.sin(o.yaw) * .4 + Math.cos(o.yaw) * .25, y + 1.25, o.z - Math.cos(o.yaw) * .4 - Math.sin(o.yaw) * .25); l.target.position.set(o.x - Math.sin(o.yaw) * 6, y + .6, o.z - Math.cos(o.yaw) * 6); });
  hAct(g, me, ex, ez);
  // المؤثرات: القلب والنفس والحواف الحمرا والفجعات
  const vg = $('#hVig');
  if (alive && !ghost && playing) {
    if (near < 11 && t > HU.beat) { sfx('heart'); HU.beat = t + 300 + near * 110; }
    if (near < 6 && t > (HU.breathAt || 0)) { HU.breathAt = t + 2500 + Math.random() * 2000; snd('breath_' + (3 + Math.random() * 3 | 0), .55); }
    if (vg) vg.style.opacity = near < 11 ? Math.min(1, (11 - near) / 8) : 0;
    if (t > HU.nextScare && !hidden && !trapped) { HU.nextScare = t + 30000 + Math.random() * 30000; hScare(t); }
  } else if (vg) vg.style.opacity = 0;
  if (playing && t > (HU.ambAt || 0)) { HU.ambAt = t + 9000 + Math.random() * 9000; const lvA = { 0: ['drop_0', 'drop_2', 'drop_4', 'amb_3', 'drip'], 3: ['amb_crows', 'amb_4'] }[myLv] || ['amb_1', 'amb_5', 'fx_1']; snd(pick(lvA), .35); }
  if (t - (HU.hud || 0) > 120) { HU.hud = t; hHud(g, me, darkLeft); }
  if (HU.mapOn && t - (HU.mapT || 0) > 250) { HU.mapT = t; hDrawMap(); }
  HU.r.render(HU.scene, cam);
}
// وش تقدر تسوي الحين (حسب اللي قدامك)
function hAct(g, me, x, z) {
  let a = null;
  if (me && g.sub === 'play' && S.phase === 'play' && !me.trapped) {
    const Mp = HMAP, lv = HU.lv, d = (px, pz) => Math.hypot(px - x, pz - z), nr = (l, px, pz, r) => l === lv && d(px, pz) <= r;
    const front = p => { const a2 = -(p.r || 0) * Math.PI / 2, dd = (p.d || .6) / 2 + .7; return [p.x + Math.sin(a2) * dd, p.z + Math.cos(a2) * dd]; };
    if (me.ghost) {
      const T = Object.entries(HU.oth).filter(([, o]) => !o.gone && !(o.f & 2) && !(o.f & 16) && !(o.f & 8) && !(o.f & 64) && o.lv === lv && d(o.x, o.z) <= HR.CATCH + .1 && Mp.see(lv, x, z, o.x, o.z)).sort((a, b) => d(a[1].x, a[1].z) - d(b[1].x, b[1].z))[0];
      if (T) a = { k: 'catch', id: T[0], t: `امسك ${hname(T[0])}!` };
      else {
        const w = Mp.PROPS.find(p => p.hide && p.lv === lv && d(...front(p)) <= HR.USE + .3);
        if (w) a = { k: 'ward', t: 'افتح الدولاب' };
        else { const m = Mp.PROPS.find(p => p.mirror && p.lv === lv && d(...front(p)) <= HR.USE + .3); if (m) a = { k: 'mirror', t: 'ادخل المراية 🪞' }; }
      }
    } else if (me.alive && !me.escaped) {
      const t = g.team || {};
      if (me.hidden != null) a = { k: 'out', t: 'اطلع من الدولاب' };
      else if (HU.hold) a = { k: 'hold', t: 'استمر… (اضغط عشان توقف)' };
      else {
        const it = (g.items || []).find(([, , , l, ix, iz]) => nr(l, ix, iz, HR.USE - .1));
        const door = Mp.DOORS.find(dd => dd.lock && !g.open.includes(dd.lock) && nr(dd.lv, (dd.x + .5) * Mp.T, (dd.y + .5) * Mp.T, 2.4));
        const fb = Mp.PROPS.find(p => p.fuse), al = Mp.PROPS.find(p => p.altar), cg = Mp.PROPS.find(p => p.cage);
        if (it) a = { k: 'pick', t: it[1] === 'fuse' ? 'خذ الفيوز ⚡' : it[1] === 'key' ? `خذ مفتاح ${LOCKN[it[2]]} 🔑` : it[1] === 'relic' ? `خذ ${RELICN[it[2]]} 🕯️` : 'خذ البطارية 🔋' };
        else if (door) a = { k: 'door', t: (t.keys || []).includes(door.lock) ? `افتح ${LOCKN[door.lock]} 🔓` : `🔒 مقفل (${LOCKN[door.lock]})` };
        else if (fb && !g.power && nr(fb.lv, fb.x, fb.z, 2.3)) a = { k: 'fuse', t: t.fuse ? `ركّب الفيوزات (${t.fuse}) ⚡` : `صندوق الكهرباء (${g.fuseIn}/3)` };
        else if (al && nr(al.lv, al.x, al.z, 2.6)) a = { k: 'altar', t: t.relics ? `حط القطع على المذبح (${t.relics}) 🕯️` : g.relicsIn >= 4 && !g.ritualDone ? (g.power ? 'ابدأ الطقس 🔥' : 'الطقس يحتاج كهرباء ⚡') : `المذبح (${g.relicsIn}/4)` };
        else if (cg && (g.trapped || []).length && nr(cg.lv, cg.x, cg.z, 2.4)) a = { k: 'rescue', t: 'طلّع المحبوسين 🗝️' };
        else { const w = Mp.PROPS.find(p => p.hide && p.lv === lv && d(...front(p)) <= HR.USE + .2); if (w) a = { k: 'ward', t: 'اختبي بالدولاب 🤫' }; }
      }
    }
  }
  const was = HU.act && HU.act.t; HU.act = a;
  if ((a && a.t) !== was) { const p = $('#hPrompt'); if (p) { p.hidden = !a; if (a) p.textContent = (isMob() ? '' : (me && me.ghost && a.k === 'catch' ? 'كليك / E: ' : 'E: ')) + a.t; } }
}
function hHud(g, me, darkLeft) {
  const tm = $('#hTime'); if (!tm) return;
  const now = performance.now();
  const left = g.sub === 'play' ? Math.max(0, g.endIn - (Date.now() - S.t0)) : g.endIn;
  const s = Math.ceil(left / 1000); tm.textContent = `⏳ ${s / 60 | 0}:${String(s % 60).padStart(2, '0')}`; tm.classList.toggle('low', s <= 60 && g.sub === 'play');
  const wk = Math.ceil(((HU.wakeIn || 0) - (now - HU.wakeAt)) / 1000), rl = $('#hRole');
  if (g.sub === 'play' && wk > 0) { rl.textContent = me && me.ghost ? `تصحى بعد ${wk}… 👻` : `الشبح يصحى بعد ${wk}… تفرّقوا!`; rl.classList.add('wake'); HU.waking = true; }
  else if (HU.waking) { HU.waking = false; rl.classList.remove('wake'); renderHaunt($('#g2body')); if (g.sub === 'play') { snd('laugh_2', 1); hPop(me && me.ghost ? '👻 صحيت! روح امسكهم' : '👻 الشبح صحى…', 'red'); } }
  const bat = $('#hBat'), sta = $('#hSta');
  if (bat) { bat.style.width = Math.max(0, HU.bat) + '%'; bat.parentNode.classList.toggle('low', HU.bat < 20); bat.parentNode.classList.toggle('off', !HU.fl || darkLeft > 0); }
  if (sta) { sta.style.width = HU.stam + '%'; sta.parentNode.classList.toggle('low', HU.tired); }
  const ub = $('#hUseB');
  if (ub) { ub.disabled = !HU.act && !HU.hold; ub.classList.toggle('on', !!HU.act); ub.querySelector('b').textContent = HU.hold ? 'وقّف' : HU.act ? ({ pick: 'خذ', door: 'افتح', fuse: 'ركّب', altar: 'المذبح', rescue: 'طلّعهم', ward: 'اختبي', out: 'اطلع' }[HU.act.k] || 'استخدم') : 'استخدم'; }
  const fb = $('#hFlB'); if (fb) fb.classList.toggle('off', !HU.fl);
  // دائرة التقدّم (فيوز، مفتاح، طقس…)
  const ring = $('#hRingFg'), hd = HU.hold;
  if (ring) { const p = hd ? Math.min(1, (hd[1] + now - HU.holdAt) / hd[2]) : 0; ring.style.strokeDashoffset = 100.5 * (1 - p); $('#hCross').classList.toggle('holding', !!hd); }
  if (me && me.trapped) { const l = Math.max(0, Math.ceil(((HU.trapLeft || 0) - (now - HU.trapAt)) / 1000)); $('#hTrap').innerHTML = `<b>🔒 محبوس بقفص القبو</b><p>انتظر ربعك يطلّعونك… أو تكسر القفص بعد <b>${l}</b> ثانية</p><small>المرة الجاية لو مسكك الشبح بتموت</small>`; }
  if (me && me.ghost) {
    const n = now - (HU.ghAt || 0), stun = HU.stun - n, scr = HU.scr - n, mir = HU.mir - n, A = HU.act || {};
    const cb = $('#hCatchB');
    cb.disabled = stun > 0 || !(A.k === 'catch' || A.k === 'ward'); cb.classList.toggle('on', A.k === 'catch');
    cb.querySelector('b').textContent = A.k === 'ward' ? 'افتح' : 'امسك';
    cb.querySelector('i').textContent = stun > 0 ? Math.ceil(stun / 1000) : '';
    const sb = $('#hScrB'); sb.disabled = scr > 0 || stun > 0; sb.querySelector('i').textContent = scr > 0 ? Math.ceil(scr / 1000) : '';
    const mb = $('#hMirB'); mb.disabled = A.k !== 'mirror' || mir > 0; mb.querySelector('i').textContent = mir > 0 ? Math.ceil(mir / 1000) : '';
    $('#hW').classList.toggle('stunned', stun > 0);
  }
}
// فجعات عشوائية للناجين (بالمتصفح بس)
function hScare(t) {
  const Mp = HMAP;
  if (Math.random() < .3 && HU.near > 14 && HU.me && HU.charsOk) {
    for (let i = 0; i < 20; i++) {
      const a = HU.yaw + (Math.random() - .5) * .9, d = 7 + Math.random() * 6, x = HU.me.x - Math.sin(a) * d, z = HU.me.z - Math.cos(a) * d;
      if (Mp.walk(HU.lv, x, z) && Mp.see(HU.lv, HU.me.x, HU.me.z, x, z)) { const m = charObj('_fake', true); m.position.set(x, Mp.baseY(HU.lv) + .1, z); m.rotation.y = HU.yaw + Math.PI / 2; m.userData.ch.play('Walk_Formal_Loop', 0); HU.scene.add(m); setTimeout(() => HU.scene.remove(m), 500); snd('fx_2', .7); return; }
    }
  }
  const opts = [() => snd('moan_' + (Math.random() * 5 | 0), .5), () => { sfx('slam'); hShake(.3); }, () => { HU.chandOff = t + 1600; sfx('static'); }, () => sfx('mbox'), () => snd('laugh_0', .35), () => { snd('hit_' + (Math.random() * 6 | 0), .5); hFlash('rgba(0,0,0,.6)'); }, () => { for (let i = 0; i < 4; i++) setTimeout(() => sfx('step2'), i * 420); }];
  pick(opts)();
}
function hWard(i) { const w = HU.ward[i]; if (!w) return; w.open = 1; w.closeAt = performance.now() + 900; }
// الفجعة لما يمسكك الشبح
function hJump() {
  const box = $('#hJump'); if (!box) return;
  try { document.exitPointerLock(); } catch {}
  box.innerHTML = ''; box.className = 'hjump';
  const v = typeof pickScare === 'function' ? pickScare() : null;
  if (v) { box.classList.add('vid'); playScare(box, v); }
  else box.innerHTML = `<svg viewBox="0 0 200 260" class="hface"><path d="M100 6C40 6 18 70 22 130c4 60 30 120 78 124 48-4 74-64 78-124C182 70 160 6 100 6Z" fill="#dfe4ec"/><ellipse cx="68" cy="108" rx="22" ry="34" fill="#000"/><ellipse cx="132" cy="108" rx="22" ry="34" fill="#000"/><circle cx="70" cy="112" r="4" fill="#ff2a2a"/><circle cx="130" cy="112" r="4" fill="#ff2a2a"/><ellipse cx="100" cy="196" rx="26" ry="46" fill="#000"/></svg>`;
  snd('hit_8', 1); snd('scream_' + (Math.random() * 5 | 0), 1); snd('crack_1', .8);
  box.hidden = false; hShake(1.5);
  setTimeout(() => { box.hidden = true; box.innerHTML = ''; const g = hg(); if (g && g.me) hPop(g.me.alive ? 'انحبست بالقفص في القبو 🔒' : 'مت 💀 صرت روح، تقدر تتفرّج', 'red', 4500); }, v ? 1900 : 1500);
}
function hDrawMap() {
  const cv = $('#hMapCv'); if (!cv) return;
  const Mp = HMAP, g = hg(), lv = HU.mapLv >= 0 ? HU.mapLv : HU.lv, ghost = g && g.me && g.me.ghost;
  const tabs = $('#hMapTabs'), th = LVN.map((n, i) => `<button type="button" class="${i === lv ? 'on' : ''}" data-l="${i}">${n}${i === HU.lv ? ' 📍' : ''}</button>`).join('');
  if (tabs.dataset.h !== th) { tabs.dataset.h = th; tabs.innerHTML = th; $$('#hMapTabs button').forEach(b => b.onclick = e => { e.stopPropagation(); HU.mapLv = +b.dataset.l; if (hSpirit()) { HU.lv = HU.mapLv; HU.follow = 0; } hDrawMap(); }); }
  const s = Math.min((innerWidth - 40) / Mp.W, (innerHeight - 170) / Mp.H, 26);
  if (cv.width !== Math.round(Mp.W * s * 2)) { cv.width = Math.round(Mp.W * s * 2); cv.height = Math.round(Mp.H * s * 2); cv.style.width = Mp.W * s + 'px'; cv.style.height = Mp.H * s + 'px'; }
  const x = cv.getContext('2d'); x.setTransform(2, 0, 0, 2, 0, 0);
  x.fillStyle = '#16130f'; x.fillRect(0, 0, Mp.W * s, Mp.H * s);
  for (let y = 0; y < Mp.H; y++) for (let i = 0; i < Mp.W; i++) {
    const c = Mp.at(lv, i, y); if (!c) continue;
    x.fillStyle = c === 6 ? (g && g.exitOpen ? '#1f9d55' : '#8a2a1a') : c === 4 ? '#c9a25a' : c === 5 ? '#3a3026' : c === 3 ? (g && g.open.includes((Mp.doorAt(lv, i, y) || {}).lock) ? '#b8ad98' : '#e8362d') : c === 2 ? '#b8ad98' : '#e9e2d2';
    x.fillRect(i * s, y * s, s + .5, s + .5);
  }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#16130f'; x.font = `700 ${Math.max(8, s * .38)}px Tajawal, sans-serif`;
  Mp.ROOMS.filter(r => r.lv === lv && r.h > 1 && r.w > 1).forEach(r => x.fillText(r.n, (r.x + r.w / 2) * s, (r.y + r.h / 2) * s));
  x.font = `${s * .8}px sans-serif`;
  const mark = (p, t2) => { if (p.lv === lv) x.fillText(t2, p.x / Mp.T * s, p.z / Mp.T * s); };
  Mp.PROPS.forEach(p => { if (p.fuse) mark(p, '⚡'); if (p.altar) mark(p, '🕯️'); if (p.cage) mark(p, '🔒'); });
  Mp.STAIRS.forEach(st => { if (st.lo === lv || st.lo + 1 === lv) x.fillText(st.lo === lv ? '⬆️' : '⬇️', (st.x0 + 1) * s, (st.y0 + 2) * s); });
  if (lv === 1) x.fillText('🚪', (Mp.EXIT[0][1] + 1) * s, (Mp.EXIT[0][2] + .5) * s);
  if (ghost) Object.values(HU.oth).forEach(o => { if (o.gone || o.lv !== lv || (o.f & 2)) return; x.fillStyle = '#ffc928'; x.beginPath(); x.arc(o.x / Mp.T * s, o.z / Mp.T * s, s * .22, 0, 7); x.fill(); });
  if (HU.me && lv === HU.lv) { const px = HU.me.x / Mp.T * s, pz = HU.me.z / Mp.T * s; x.save(); x.translate(px, pz); x.rotate(-HU.yaw); x.fillStyle = ghost ? '#e8362d' : '#ffc928'; x.strokeStyle = '#16130f'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -s * .55); x.lineTo(s * .35, s * .35); x.lineTo(-s * .35, s * .35); x.closePath(); x.fill(); x.stroke(); x.restore(); }
}
function hauntOverHtml(g) {
  const tr = (g.trapped || []).map(x => x[0]);
  const row = id => { const st = g.ghosts.includes(id) ? '👻 الشبح' : (g.esc || []).includes(id) ? '🚪 هرب' : (g.dead || []).includes(id) ? '💀 مات' : tr.includes(id) ? '🔒 محبوس' : '🏚️ علق بالقصر'; return `<span class="hres" style="--c:${HCOL[g.col[id] || 0]}">${esc(hname(id))} <b>${st}</b></span>`; };
  return `<div class="hresw"><p>${esc(g.why || '')}</p>${Object.keys(g.col).map(row).join('')}</div>`;
}
