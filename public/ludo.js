// ================= لودو — رقعة سدو ثري دي =================
const LU = { T: null, libs: null, built: false, raf: 0, sz: '', pw: {}, anim: [], dice: null, roll: null, chips: {}, tmr: 0, portrait: false, lastSig: '' };
// أشكال اللودو (الطاولة + النرد + القطع). الأساسي السدو (اختاره علي)، والباقي جاهز لو بغينا نضيف خيار
const LUSKINS = {
  wood: { cols: ['#8a1c1c', '#2f6b3c', '#c98b3a', '#2a4a7a'], names: ['الأحمر', 'الأخضر', 'الذهبي', 'الأزرق'], bg: 0x1a0f08, paper: '#f3e2c0', line: '#3a2416', star: '#3a2416', pat: 'wood',
    frame: { color: 0x4a2a14 }, side: { color: 0x6b3a1c }, table: { color: 0x2a170b }, die: { bg: '#fffaf0', edge: '#c9a877', dot: '#8a1c1c' }, pawn: 'cone', pm: { roughness: .35 } },
  sadu: { cols: ['#a3231b', '#262220', '#d9a441', '#6b2f1a'], names: ['الأحمر', 'الأسود', 'الأصفر', 'البني'], bg: 0x24120c, paper: '#f2e4c8', line: '#2a1a10', star: '#a3231b', pat: 'sadu',
    frame: { color: 0x5a1a12, roughness: .8 }, side: { color: 0x7a2a1a, roughness: .8 }, table: { color: 0x3a1d12, roughness: .9 }, die: { bg: '#c79a5b', edge: '#7a5428', dot: '#2a1a10', grain: 1 }, pawn: 'dallah', pm: { roughness: .3, metalness: .35 } },
  marble: { cols: ['#9e2b3a', '#2e6b5a', '#c9a23a', '#2c4a80'], names: ['العنابي', 'الزمردي', 'الذهبي', 'الكحلي'], bg: 0x1b1a1f, paper: '#f6f3ee', line: '#c9a23a', star: '#c9a23a', pat: 'marble',
    frame: { color: 0xc9a23a, metalness: .9, roughness: .25 }, side: { color: 0xeae4da, roughness: .3 }, table: { color: 0x2b2a33, roughness: .5 }, die: { bg: '#f1d27a', edge: '#b8913a', dot: '#5a4310', metal: 1 }, pawn: 'king', pm: { roughness: .15, metalness: .2 } },
  neon: { cols: ['#ff2e88', '#19f0a0', '#ffd400', '#2ea8ff'], names: ['الوردي', 'الأخضر', 'الأصفر', 'الأزرق'], bg: 0x07060f, paper: '#151230', line: '#3a3270', star: '#8f84ff', pat: 'neon',
    frame: { color: 0x15122a, emissive: 0x2a1d6b, emissiveIntensity: .6, roughness: .4 }, side: { color: 0x0d0b1a }, table: { color: 0x0b0a14, roughness: .3, metalness: .5 }, die: { bg: '#1c1838', edge: '#19f0a0', dot: '#19f0a0', glow: 1 }, pawn: 'gem', pm: { roughness: .1, metalness: .1, transparent: true, opacity: .88, emissiveK: .55 } }
};
let LUCOL = LUSKINS.sadu.cols, LUNAME = LUSKINS.sadu.names;
function luSkin() { let k = 'sadu'; try { k = localStorage.getItem('tludo-skin') || 'sadu'; } catch {} return LUSKINS[k] ? k : 'sadu'; }
const luNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const luPl = id => S.players.find(p => p.id === id) || { name: '؟' };
function luSnd(n) { try { sfx(n); } catch {} }
// المسار: ٥٢ خانة تبدأ من بداية الأحمر (١،٦)
const LUPATH = (() => { const p = []; for (let x = 1; x <= 5; x++) p.push([x, 6]); for (let y = 5; y >= 0; y--) p.push([6, y]); p.push([7, 0]); for (let y = 0; y <= 5; y++) p.push([8, y]); for (let x = 9; x <= 14; x++) p.push([x, 6]); p.push([14, 7]); for (let x = 14; x >= 9; x--) p.push([x, 8]); for (let y = 9; y <= 14; y++) p.push([8, y]); p.push([7, 14]); for (let y = 14; y >= 9; y--) p.push([6, y]); for (let x = 5; x >= 0; x--) p.push([x, 8]); p.push([0, 7]); p.push([0, 6]); return p; })();
const LULANE = [k => [k, 7], k => [7, k], k => [14 - k, 7], k => [7, 14 - k]];
const LUBASE = [[0, 0], [9, 0], [9, 9], [0, 9]];
const LUHOME = [[6.4, 7], [7, 6.4], [7.6, 7], [7, 7.6]];
// مكان القطعة (خانة) حسب اللون والتقدّم
function luCell(c, p, i) {
  if (p === -1) { const [bx, by] = LUBASE[c], o = [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]][i]; return [bx + o[0], by + o[1]]; }
  if (p <= 50) return LUPATH[(p + 13 * c) % 52];
  if (p <= 55) return LULANE[c](p - 50);
  const h = LUHOME[c], o = [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]][i]; return [h[0] + o[0], h[1] + o[1]];
}
const luW = ([x, y]) => [(x + .5) / 15 * 10 - 5, (y + .5) / 15 * 10 - 5];
function luLibs() { return LU.libs || (LU.libs = import('./vendor/three.module.min.js').then(T => { LU.T = T; })); }
function luBoardTex(K) {
  const T = LU.T, c = document.createElement('canvas'); c.width = c.height = 1500; const g = c.getContext('2d'), u = 100, C = K.cols, P = K.paper, neon = K.pat === 'neon';
  g.fillStyle = P; g.fillRect(0, 0, 1500, 1500);
  if (K.pat === 'marble') { // عروق الرخام
    g.strokeStyle = 'rgba(150,140,130,.35)'; for (let i = 0; i < 40; i++) { g.lineWidth = 1 + Math.random() * 3; g.beginPath(); let x = Math.random() * 1500, y = Math.random() * 1500; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - .3) * 260; y += (Math.random() - .5) * 200; g.lineTo(x, y); } g.stroke(); }
  }
  const glow = (col, b) => { if (neon) { g.shadowColor = col; g.shadowBlur = b; } };
  const fill = (x, y, col) => { glow(col, 30); g.fillStyle = col; g.fillRect(x * u + (neon ? 8 : 0), y * u + (neon ? 8 : 0), u - (neon ? 16 : 0), u - (neon ? 16 : 0)); g.shadowBlur = 0; };
  LUBASE.forEach(([x, y], i) => {
    g.fillStyle = C[i]; g.fillRect(x * u, y * u, 6 * u, 6 * u);
    if (K.pat === 'sadu') { // نقشة السدو: معينات وخطوط
      g.save(); g.beginPath(); g.rect(x * u, y * u, 6 * u, 6 * u); g.clip();
      for (let r = 0; r < 12; r++) for (let q = 0; q < 12; q++) { const cx = x * u + q * 50 + 25, cy = y * u + r * 50 + 25; g.strokeStyle = 'rgba(255,240,215,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy - 22); g.lineTo(cx + 22, cy); g.lineTo(cx, cy + 22); g.lineTo(cx - 22, cy); g.closePath(); g.stroke(); g.fillStyle = 'rgba(255,240,215,.3)'; g.fillRect(cx - 5, cy - 5, 10, 10); }
      g.restore();
    }
    if (neon) { g.fillStyle = '#07060f'; g.fillRect(x * u + 14, y * u + 14, 6 * u - 28, 6 * u - 28); glow(C[i], 40); g.strokeStyle = C[i]; g.lineWidth = 10; g.strokeRect(x * u + 20, y * u + 20, 6 * u - 40, 6 * u - 40); g.shadowBlur = 0; }
    g.fillStyle = neon ? '#0d0b1a' : P; g.beginPath(); g.roundRect(x * u + u, y * u + u, 4 * u, 4 * u, 40); g.fill();
    if (K.pat === 'marble') { g.strokeStyle = K.line; g.lineWidth = 8; g.stroke(); }
    if (neon) { glow(C[i], 30); g.strokeStyle = C[i]; g.lineWidth = 6; g.stroke(); g.shadowBlur = 0; }
    [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]].forEach(([a, b]) => { g.beginPath(); g.arc((x + a + .5) * u, (y + b + .5) * u, 38, 0, 7); g.fillStyle = C[i]; g.globalAlpha = .3; g.fill(); g.globalAlpha = 1; g.lineWidth = 6; g.strokeStyle = C[i]; g.stroke(); });
    if (K.pat === 'wood') for (let k = 0; k < 6; k++) { g.fillStyle = '#16130f'; g.beginPath(); g.moveTo(x * u + k * u + 50, y * u + 8); g.lineTo(x * u + k * u + 88, y * u + 46); g.lineTo(x * u + k * u + 50, y * u + 84); g.lineTo(x * u + k * u + 12, y * u + 46); g.fill(); g.fillStyle = P; g.beginPath(); g.moveTo(x * u + k * u + 50, y * u + 30); g.lineTo(x * u + k * u + 66, y * u + 46); g.lineTo(x * u + k * u + 50, y * u + 62); g.lineTo(x * u + k * u + 34, y * u + 46); g.fill(); }
  });
  for (let k = 1; k < 6; k++) LULANE.forEach((f, i) => fill(...f(k), C[i]));
  fill(1, 6, C[0]); fill(8, 1, C[1]); fill(13, 8, C[2]); fill(6, 13, C[3]);
  [[6, 9, 6, 6, C[0]], [6, 6, 9, 6, C[1]], [9, 6, 9, 9, C[2]], [9, 9, 6, 9, C[3]]].forEach(([a, b, cc, d, col]) => { glow(col, 40); g.fillStyle = col; g.beginPath(); g.moveTo(a * u, b * u); g.lineTo(cc * u, d * u); g.lineTo(7.5 * u, 7.5 * u); g.fill(); g.shadowBlur = 0; });
  g.strokeStyle = K.line; g.lineWidth = K.pat === 'marble' ? 3 : 4;
  for (let x = 0; x < 15; x++) for (let y = 0; y < 15; y++) { if (((x < 6 || x > 8) && (y < 6 || y > 8)) || (x >= 6 && x <= 8 && y >= 6 && y <= 8)) continue; g.strokeRect(x * u, y * u, u, u); }
  if (K.pat === 'marble') { g.lineWidth = 10; g.strokeRect(6 * u, 6 * u, 3 * u, 3 * u); }
  g.fillStyle = K.star; g.font = '70px Lalezar, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; glow(K.star, 20);
  [[6, 2], [12, 6], [8, 12], [2, 8]].forEach(([x, y]) => g.fillText('★', x * u + 50, y * u + 55)); g.shadowBlur = 0;
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
function luWorld() {
  const T = LU.T, sc = LU.sc = new T.Scene(), lite = LU.lite, K = LUSKINS[LU.skin = luSkin()];
  LUCOL = K.cols; LUNAME = K.names;
  sc.background = new T.Color(K.bg); sc.fog = new T.Fog(K.bg, 24, 44);
  sc.add(new T.HemisphereLight(0xfff0e0, 0x2a170b, lite ? 1.8 : 1));
  const sun = new T.DirectionalLight(0xffe2b8, lite ? 1.3 : 2); sun.position.set(-5, 12, 6);
  if (!lite) { sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); }
  sc.add(sun);
  const M = o => { if (lite) { const { roughness, metalness, emissiveK, ...r } = o; return new T.MeshLambertMaterial(r); } const { emissiveK, ...r } = o; return new T.MeshStandardMaterial(Object.assign({ roughness: .6 }, r)); };
  if (!lite && (K.pat === 'marble' || K.pat === 'neon')) { // انعكاس بسيط للمعدن واللمعة
    const pm = new T.PMREMGenerator(LU.ren), es = new T.Scene(); es.background = new T.Color(K.pat === 'neon' ? 0x2a1d6b : 0xfff1d6);
    const l1 = new T.Mesh(new T.BoxGeometry(3, 3, 3), new T.MeshBasicMaterial({ color: K.pat === 'neon' ? 0xff2e88 : 0xffffff })); l1.position.set(4, 4, 2); es.add(l1);
    sc.environment = pm.fromScene(es, .04).texture;
  }
  const fm = M(K.side), bm = M({ map: luBoardTex(K), roughness: K.pat === 'marble' ? .25 : .6 });
  LU.root = new T.Group(); sc.add(LU.root); // الرقعة والقطع بمجموعة وحدة تندار عشان لونك يكون تحت يسار
  const board = new T.Mesh(new T.BoxGeometry(10, .3, 10), [fm, fm, bm, fm, fm, fm]); board.position.y = -.15; board.receiveShadow = !lite; LU.root.add(board);
  const fr = new T.Mesh(new T.BoxGeometry(10.8, .5, 10.8), M(K.frame)); fr.position.y = -.35; fr.receiveShadow = !lite; LU.root.add(fr);
  const tb = new T.Mesh(new T.CylinderGeometry(11, 11, .4, 64), M(K.table)); tb.position.y = -.8; tb.receiveShadow = !lite; sc.add(tb);
  // النرد
  const faces = []; for (let f = 1; f <= 6; f++) { const k = document.createElement('canvas'); k.width = k.height = 128; const x = k.getContext('2d'); const D = K.die; x.fillStyle = D.bg; x.fillRect(0, 0, 128, 128);
    if (D.grain) { x.strokeStyle = 'rgba(90,55,20,.35)'; for (let i = 0; i < 14; i++) { x.lineWidth = 1 + Math.random() * 2; x.beginPath(); x.moveTo(0, i * 9 + Math.random() * 4); x.bezierCurveTo(40, i * 9 + 6, 90, i * 9 - 6, 128, i * 9 + 3); x.stroke(); } }
    if (D.metal) { const gr = x.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#fff3c0'); gr.addColorStop(1, D.bg); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }
    x.strokeStyle = D.edge; x.lineWidth = 6; x.strokeRect(3, 3, 122, 122); x.fillStyle = D.dot; if (D.glow) { x.shadowColor = D.dot; x.shadowBlur = 16; } ({ 1: [[64, 64]], 2: [[32, 32], [96, 96]], 3: [[32, 32], [64, 64], [96, 96]], 4: [[32, 32], [96, 32], [32, 96], [96, 96]], 5: [[32, 32], [96, 32], [64, 64], [32, 96], [96, 96]], 6: [[32, 30], [96, 30], [32, 64], [96, 64], [32, 98], [96, 98]] })[f].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 13, 0, 7); x.fill(); }); const t = new T.CanvasTexture(k); t.colorSpace = T.SRGBColorSpace; faces.push(M(Object.assign({ map: t, roughness: .3 }, K.die.metal ? { metalness: .8, roughness: .25 } : {}, K.die.glow ? { emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .5 } : {}))); }
  LU.dice = new T.Mesh(new T.BoxGeometry(.8, .8, .8), [faces[0], faces[5], faces[4], faces[1], faces[2], faces[3]]); LU.dice.castShadow = !lite; LU.dice.position.set(0, .1, 0); LU.root.add(LU.dice);
  LU.pmat = LUCOL.map(c => M(Object.assign({ color: c }, K.pm, K.pm.emissiveK ? { emissive: c, emissiveIntensity: K.pm.emissiveK } : {})));
  LU.acc = M(K.pat === 'marble' ? { color: 0xc9a23a, metalness: .9, roughness: .25 } : { color: 0xd9a441, metalness: .6, roughness: .3 });
  LU.ring = new T.Mesh(new T.RingGeometry(.3, .42, 32), new T.MeshBasicMaterial({ color: 0xffc928, transparent: true, opacity: .9, side: 2, depthWrite: false }));
  LU.ray = new T.Raycaster();
}
// الوجه اللي فوق لكل رقم
const LUROT = { 1: [0, 0, Math.PI / 2], 6: [0, 0, -Math.PI / 2], 5: [0, 0, 0], 2: [Math.PI, 0, 0], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] };
function luPawn(c) {
  const T = LU.T, g = new T.Group(), m = LU.pmat[c], kind = LUSKINS[LU.skin].pawn, sh = !LU.lite;
  const add = (geo, y, mat = m, acc) => { const o = new T.Mesh(geo, mat); o.position.y = y; o.castShadow = sh; if (acc) o.userData.acc = 1; g.add(o); return o; };
  const lathe = pts => new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), 28);
  if (kind === 'dallah') { // دلة: جسم منفوخ، رقبة، غطا وراس، وبلبول
    add(lathe([[0, 0], [.24, 0], [.27, .06], [.25, .2], [.16, .3], [.1, .38], [.11, .46], [.08, .5], [0, .5]]), 0);
    add(new T.ConeGeometry(.1, .1, 20), .56, LU.acc, 1); add(new T.SphereGeometry(.04, 12, 10), .63, LU.acc, 1);
    const sp = add(new T.CylinderGeometry(.025, .045, .32, 12), .3); sp.rotation.z = -.9; sp.position.x = .25;
    const hd = add(new T.TorusGeometry(.1, .022, 8, 20, Math.PI), .28); hd.rotation.z = Math.PI / 2; hd.position.x = -.2;
  } else if (kind === 'king') { // قطعة شطرنج لامعة بحزام ذهب
    add(lathe([[0, 0], [.27, 0], [.27, .05], [.2, .09], [.13, .16], [.1, .4], [.15, .44], [.12, .48], [0, .48]]), 0);
    add(new T.TorusGeometry(.14, .025, 10, 24), .44, LU.acc, 1).rotation.x = Math.PI / 2;
    add(new T.SphereGeometry(.12, 20, 16), .58); add(new T.SphereGeometry(.035, 12, 10), .71, LU.acc, 1);
  } else if (kind === 'gem') { // جوهرة تنوّر على قاعدة
    add(new T.CylinderGeometry(.2, .25, .05, 24), .025);
    const gm = add(new T.OctahedronGeometry(.28, 0), .44); gm.scale.set(.75, 1.4, .75); gm.rotation.y = Math.PI / 4;
  } else {
    add(new T.CylinderGeometry(.2, .28, .12, 24), .06); add(new T.ConeGeometry(.19, .46, 24), .34); add(new T.SphereGeometry(.14, 20, 14), .62);
  }
  return g;
}
function luSync() {
  if (!LU.built || !S.g) return; const g = S.g, T = LU.T;
  // القواعد على الشاشة: ٠ فوق يسار، ١ فوق يمين، ٢ تحت يمين، ٣ تحت يسار. ندوّر لين يصير لونك تحت يسار
  const myC = g.seat[S.me] !== undefined ? g.seat[S.me] : 3; LU.root.rotation.y = -((3 - myC + 4) % 4) * Math.PI / 2;
  for (const id of g.order) {
    const c = g.seat[id]; if (!LU.pw[id]) LU.pw[id] = [0, 1, 2, 3].map(i => { const m = luPawn(c); m.userData = { id, i, p: -1, tx: 0, tz: 0 }; const [x, z] = luW(luCell(c, -1, i)); m.position.set(x, 0, z); LU.root.add(m); return m; });
    g.pcs[id].forEach((p, i) => { const m = LU.pw[id][i]; if (m.userData.p !== p && !m.userData.busy) { const [x, z] = luW(luCell(c, p, i)); m.position.set(x, 0, z); m.userData.p = p; } });
  }
  for (const id of Object.keys(LU.pw)) if (!g.order.includes(id)) { LU.pw[id].forEach(m => LU.root.remove(m)); delete LU.pw[id]; }
  // قطع مكدّسة بنفس الخانة: نزحزحها شوي
  const at = {}; for (const id of g.order) LU.pw[id].forEach(m => { if (m.userData.busy || m.userData.p < 0 || m.userData.p === 56) return; const k = luCell(g.seat[id], m.userData.p, 0).join(','); (at[k] = at[k] || []).push(m); });
  for (const ms of Object.values(at)) if (ms.length > 1) ms.forEach((m, j) => { const [x, z] = luW(luCell(g.seat[m.userData.id], m.userData.p, 0)); m.position.x = x + (j - (ms.length - 1) / 2) * .22; m.position.z = z + (j % 2 ? .12 : -.12); m.scale.setScalar(.85); }); else ms[0].scale.setScalar(1);
}
// حركة القطعة خانة خانة
function luAnimate(id, i, from, to, hit) {
  const g = S.g, m = LU.pw[id] && LU.pw[id][i]; if (!m) return; const c = g.seat[id];
  const steps = []; if (from === -1) steps.push(luCell(c, 0, i)); else for (let p = from + 1; p <= to; p++) steps.push(luCell(c, p, i));
  m.userData.busy = true; m.userData.p = to; const hv = hit && LU.pw[hit.id] && LU.pw[hit.id][hit.j]; if (hv) { hv.userData.busy = true; hv.userData.p = -1; }
  LU.anim.push({ m, steps: steps.map(luW), k: 0, t: 0, done: () => { m.userData.busy = false; if (hit) { const v = hv; if (v) { const [x, z] = luW(luCell(g.seat[hit.id], -1, hit.j)); LU.anim.push({ m: v, steps: [[x, z]], k: 0, t: 0, fly: 1, done: () => { v.userData.busy = false; v.userData.p = -1; luSync(); } }); } } luSync(); } });
}
function luFrame() {
  LU.raf = 0; const cv = document.getElementById('luCv'); if (!cv || !LU.built || !S || S.game !== 'ludo') return;
  LU.raf = requestAnimationFrame(luFrame);
  const T = LU.T, dt = Math.min(.05, LU.clock.getDelta()), now = LU.clock.elapsedTime, st = cv.parentNode, w = st.clientWidth, h = st.clientHeight, k = w + 'x' + h;
  if (k !== LU.sz && w && h) { LU.sz = k; LU.ren.setSize(w, h, false); LU.cam.aspect = w / h; const P = w / h < .9; LU.portrait = P; LU.cam.fov = P ? 52 : 36; LU.cam.updateProjectionMatrix(); LU.cam.position.set(0, P ? 24 : 12.5, P ? 5.5 : 8.5); LU.cam.lookAt(0, -.3, P ? .3 : .5); }
  for (let j = LU.anim.length - 1; j >= 0; j--) {
    const a = LU.anim[j], d = a.fly ? .55 : .22; a.t += dt;
    const [tx, tz] = a.steps[a.k], p = Math.min(1, a.t / d), sx = a.sx === undefined ? (a.sx = a.m.position.x) : a.sx, sz = a.sz === undefined ? (a.sz = a.m.position.z) : a.sz;
    a.m.position.x = sx + (tx - sx) * p; a.m.position.z = sz + (tz - sz) * p; a.m.position.y = Math.sin(p * Math.PI) * (a.fly ? 2 : .45);
    if (p >= 1) { a.k++; a.t = 0; a.sx = a.sz = undefined; if (a.k >= a.steps.length || a.fly) { a.m.position.y = 0; LU.anim.splice(j, 1); a.done && a.done(); } else luSnd('tick'); }
  }
  // النرد
  if (LU.roll) { const r = LU.roll; r.t += dt; const p = Math.min(1, r.t / .9); const goal = LUROT[r.d];
    if (p < 1) { LU.dice.rotation.set(r.r0[0] + (1 - p) * 14, r.r0[1] + (1 - p) * 9, r.r0[2] + (1 - p) * 11); LU.dice.position.y = .4 + Math.abs(Math.sin(p * Math.PI * 3)) * (1 - p) * 1.6; }
    else { LU.dice.rotation.set(goal[0], r.spin, goal[2]); LU.dice.rotation.order = 'YXZ'; LU.dice.position.y = .4; LU.roll = null; } }
  // حلقة القطع اللي تقدر تحركها
  const can = luCan(); LU.ring.visible = false;
  for (const id of Object.keys(LU.pw)) LU.pw[id].forEach(m => { const on = can.includes(m.userData.i) && id === S.me; m.children.forEach(o => { if (!o.userData.acc && o.material.emissive) o.material = on ? (m.userData.hl || (m.userData.hl = o.material.clone())) : LU.pmat[S.g.seat[id]]; }); if (on && m.userData.hl) m.userData.hl.emissive && m.userData.hl.emissive.setRGB(.22 + Math.sin(now * 6) * .18, .16 + Math.sin(now * 6) * .12, .02); });
  if (LU.chipPos) for (const [id, el] of Object.entries(LU.chips)) { const c = S.g.seat[id]; if (c === undefined) continue; const [bx, by] = LUBASE[c], v = new T.Vector3(...(() => { const [x, z] = luW([bx + 2.5, by + 2.5]); return [x, .3, z]; })()).applyMatrix4(LU.root.matrixWorld).project(LU.cam); el.style.left = ((v.x + 1) / 2 * w) + 'px'; el.style.top = ((1 - v.y) / 2 * h) + 'px'; }
  LU.ren.render(LU.sc, LU.cam);
}
function luSelK() { const g = S.g; if (!g || !g.opts || !g.opts.length) return -1; if (!g.opts.some(o => o.k === LU.selK)) LU.selK = g.opts[0].k; return LU.selK; }
function luCan() { const g = S.g; if (!g || g.sub !== 'move' || g.turn !== S.me) return []; const k = luSelK(); return (g.opts || []).filter(o => o.k === k).map(o => o.i); }
function luInit(stage) {
  const T = LU.T, cv = stage.querySelector('#luCv');
  let q = 'full'; try { q = localStorage.getItem('tdeal-q') || (matchMedia('(pointer:coarse)').matches ? 'lite' : 'full'); } catch {}
  LU.lite = q === 'lite';
  LU.ren = new T.WebGLRenderer({ canvas: cv, antialias: !LU.lite, powerPreference: 'high-performance' }); LU.ren.setPixelRatio(Math.min(devicePixelRatio || 1, LU.lite ? 1.25 : 1.75)); LU.ren.outputColorSpace = T.SRGBColorSpace;
  if (!LU.lite) { LU.ren.shadowMap.enabled = true; LU.ren.shadowMap.type = T.PCFSoftShadowMap; LU.ren.toneMapping = T.ACESFilmicToneMapping; }
  LU.cam = new T.PerspectiveCamera(36, 16 / 9, .1, 100); LU.clock = new T.Clock(); LU.pw = {}; LU.anim = [];
  luWorld(); LU.built = true; LU.chipPos = true;
  cv.addEventListener('pointerdown', e => {
    const can = luCan(); if (!can.length) { if (S.g.turn === S.me && S.g.sub === 'roll') send({ t: 'lroll' }); return; }
    const r = cv.getBoundingClientRect(); LU.ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), LU.cam);
    const hit = LU.ray.intersectObjects((LU.pw[S.me] || []).flatMap(m => m.children))[0]; if (!hit) return;
    const i = hit.object.parent.userData.i; if (can.includes(i)) send({ t: 'lmove', i, k: luSelK() });
  });
}
function renderLudo(body) {
  const g = S.g; if (!g) return;
  if (body.dataset.built !== 'ludo' || !document.getElementById('luCv')) {
    body.dataset.built = 'ludo'; LU.built = false; LU.sz = ''; LU.chips = {};
    body.innerHTML = `<div class="luw"><div class="lustage" id="luStage"><canvas id="luCv"></canvas><div class="luload" id="luLoad"><b>لودو</b>نجهّز الرقعة…</div><div class="luchips" id="luChips"></div><div class="lubar" id="luBar"></div><div class="lufx" id="luFx"></div></div></div>`;
    luLibs().then(() => { const st = document.getElementById('luStage'); if (!st) return; luInit(st); luSync(); document.getElementById('luLoad').hidden = true; if (!LU.raf) LU.raf = requestAnimationFrame(luFrame); }).catch(e => { console.error(e); const l = document.getElementById('luLoad'); if (l) l.innerHTML = '<b>!</b>ما قدرنا نحمّل الثري دي على جهازك'; });
  }
  if (LU.built) { luSync(); if (!LU.raf) LU.raf = requestAnimationFrame(luFrame); }
  luHud(); if (!LU.tmr) LU.tmr = setInterval(luTick, 250);
}
function luTick() { const el = document.getElementById('luTime'); if (!el || !S || !S.g) { if (!document.getElementById('luStage')) { clearInterval(LU.tmr); LU.tmr = 0; } return; } el.textContent = luNum(Math.ceil(Math.max(0, LU.endAt - performance.now()) / 1000)); }
function luHud() {
  const g = S.g, ch = document.getElementById('luChips'), mine = g.turn === S.me, over = S.phase === 'over';
  LU.endAt = performance.now() + (g.left || 0);
  for (const id of g.order) {
    let el = LU.chips[id]; if (!el) { el = LU.chips[id] = document.createElement('div'); el.className = 'luop'; el.dataset.id = id; ch.appendChild(el); }
    const c = g.seat[id], home = g.pcs[id].filter(x => x === 56).length;
    el.style.setProperty('--c', LUCOL[c]); el.classList.toggle('on', g.turn === id && !over);
    el.innerHTML = `<b>${esc(luPl(id).name)}${id === S.me ? ' (أنت)' : ''}</b><small>${LUNAME[c]} · وصّل ${luNum(home)}/٤</small>`;
  }
  const bar = document.getElementById('luBar'), myC = g.seat[S.me];
  bar.innerHTML = over ? `<span class="lust">${esc(S.winner || '')} فاز!</span>` : `<span class="lust" style="--c:${LUCOL[g.seat[g.turn]]}">${mine ? 'دورك' : 'دور ' + esc(luPl(g.turn).name)} · <b id="luTime"></b>ث</span>
    ${(g.dice && g.dice.length ? g.dice : g.die ? [g.die] : []).map((d, k) => `<button class="ludie${mine && g.sub === 'move' && g.dice.length > 1 ? ' pick' : ''}${mine && g.sub === 'move' && k === luSelK() && g.dice.length > 1 ? ' sel' : ''}${mine && g.sub === 'move' && g.dice.length > 1 && !(g.opts || []).some(o => o.k === k) ? ' dead' : ''}" data-k="${k}">${luNum(d)}</button>`).join('')}
    <button class="lub" id="luRoll" ${mine && g.sub === 'roll' ? '' : 'disabled'}>ارمِ النرد</button>
    <span class="luhint">${mine && g.sub === 'move' ? (g.dice.length > 1 ? 'اختر الرقم وبعدين القطعة' : 'اضغط على قطعة منوّرة تحرّكها') : mine && g.sub === 'roll' ? (g.dice && g.dice.length ? 'طلعت ستة! ارمِ مرة ثانية' : myC !== undefined ? 'الستة تطلّعك من البيت' : '') : ''}</span>`;
  bar.querySelectorAll('.ludie.pick').forEach(x => x.onclick = () => { if (x.classList.contains('dead')) return; LU.selK = +x.dataset.k; luHud(); luSnd('gclick'); });
  const b = document.getElementById('luRoll'); if (b) {
    b.onclick = () => { if (LU.held) { LU.held = false; return; } send({ t: 'lroll' }); };
    // حركة سرية لصاحب الموقع: اضغط مطوّل على زر النرد ويطلع لك صف أرقام صغير تختار منه (على مستوى الصفحة لأن الزر يتبدّل مع كل تحديث)
    if (S.boss && !LU.bossOn) {
      LU.bossOn = true; let tm = 0;
      document.addEventListener('pointerdown', e => { if (!S || !S.boss || !e.target.closest('#luRoll')) return; clearTimeout(tm); tm = setTimeout(() => { LU.held = true; const x = document.getElementById('luRoll'); if (x) luPick(x); }, 650); }, true);
      document.addEventListener('pointerup', () => clearTimeout(tm), true);
      document.addEventListener('contextmenu', e => { if (S && S.boss && e.target.closest('#luRoll')) e.preventDefault(); }, true);
    }
  }
}
function luPick(b) {
  let d = document.getElementById('luPick'); if (d) d.remove();
  d = document.createElement('div'); d.id = 'luPick'; d.className = 'lupick';
  d.innerHTML = [1, 2, 3, 4, 5, 6].map(n => `<button data-f="${n}">${luNum(n)}</button>`).join('');
  d.onclick = e => { const x = e.target.closest('[data-f]'); if (x) send({ t: 'lroll', f: +x.dataset.f }); d.remove(); };
  const rc = b.getBoundingClientRect(); d.style.left = rc.left + 'px'; d.style.top = Math.max(4, rc.top - 26) + 'px';
  document.body.appendChild(d); setTimeout(() => d.isConnected && d.remove(), 6000);
}
function net_ludo(m) {
  if (!S || S.game !== 'ludo' || !S.g || !LU.built) return;
  if (m.k === 'roll') { LU.roll = { d: m.d, t: 0, r0: [LU.dice.rotation.x, LU.dice.rotation.y, LU.dice.rotation.z], spin: Math.random() * 6 }; luSnd('whoosh'); if (m.d === 6) luToast(`${esc(luPl(m.id).name)}: ستة!`); }
  if (m.k === 'move') { luAnimate(m.id, m.i, m.from, m.to, m.hit); if (m.hit) { luToast(`💥 ${esc(luPl(m.id).name)} أكل قطعة ${esc(luPl(m.hit.id).name)}!`, 'hit'); setTimeout(() => luSnd('slam'), 300); } if (m.to === 56) { luToast(`${esc(luPl(m.id).name)} وصّل قطعة!`); luSnd('chime'); } }
}
function luToast(h, cls = '') { const fx = document.getElementById('luFx'); if (!fx) return; const d = document.createElement('div'); d.className = 'lutoast ' + cls; d.innerHTML = h; fx.appendChild(d); setTimeout(() => d.remove(), 2400); }
