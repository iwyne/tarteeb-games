// ================= ترتيب قفل (سكرو) — مجلس ثري دي =================
const QF = { seeQ: {}, T: null, libs: null, built: false, sc: null, cam: null, ren: null, raf: 0, clock: null, sz: '', tex: {}, mats: {}, cards: {}, seen: {}, mode: null, sel: null, tmr: 0, portrait: false, ray: null, deckG: null, discM: null, chips: {}, revK: '', overK: '' };
const QFV = 2;
const qfNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const QFSP = { swap: 'بدّل', eye: 'عين', mix: 'زي بعض', ss: 'شوف وبدّل', take: 'خذ بس', any: 'على كيفك' };
const qfImg = v => QFSP[v] ? v : v === -1 ? 'nm1' : 'n' + v;
const qfSrc = n => `qfl/${n}.webp?v=${QFV}`;
const qfName = v => QFSP[v] || (v === -1 ? '−١' : qfNum(v));
const QFPOW = { 7: ['شوف ورقة من أوراقك', 'own'], 8: ['شوف ورقة من أوراقك', 'own'], 9: ['شوف ورقة عند غيرك', 'spy'], 10: ['شوف ورقة عند غيرك', 'spy'], swap: ['بدّل ورقة من عندك بورقة خصم', 'swap'], eye: ['ورقة من كل خصم أو ورقتين لك', 'eye'], mix: ['تخلّص من ورقة من عندك', 'mix'], ss: ['شوف ورقتك وورقة خصم وقرر تبدّل', 'ss'], take: ['خصم ياخذ ورقة زيادة', 'take'], any: ['اختر أي قدرة تبيها', 'any'] };
const QFHINT = { own: 'اختر ورقة من أوراقك تشوفها', spy: 'اختر ورقة عند خصم تشوفها', eyeown: 'اختر ورقتين من أوراقك تشوفهم', eyeopp: 'اختر ورقة من كل خصم', mix: 'اختر ورقة من عندك ترميها', swap: 'اختر ورقتك أول، بعدين ورقة الخصم', ss: 'اختر ورقتك أول، بعدين ورقة الخصم وتشوفهم', take: 'اختر الخصم اللي ياخذ ورقة زيادة' };
const QFCOL = ['#2fbf6a', '#7b3fc7', '#1c5fd0', '#c4560f', '#c2185b', '#00838f'];
const qfPl = id => S.players.find(p => p.id === id) || { name: '؟' };
const qfCol = id => QFCOL[Math.max(0, (S.g.order || []).indexOf(id)) % QFCOL.length];
const qfAv = (id, sz) => `<span class="qfav" style="width:${sz}px;height:${sz}px;font-size:${sz * .5}px;background:${qfCol(id)}">${esc([...String(qfPl(id).name).trim()][0] || '؟')}</span>`;
function qfSnd(n) { try { sfx(n); } catch {} }
function qfLibs() { return QF.libs || (QF.libs = import('./vendor/three.module.min.js').then(T => { QF.T = T; })); }
function qfTex(n, flip) { const k = n + (flip ? 'f' : ''); if (QF.tex[k]) return QF.tex[k]; const t = new QF.T.TextureLoader().load(qfSrc(n)); t.colorSpace = QF.T.SRGBColorSpace; t.anisotropy = 4; if (flip) { t.center.set(.5, .5); t.rotation = Math.PI; } return QF.tex[k] = t; }
function qfMat(n, flip) { const k = n + (flip ? 'f' : ''); return QF.mats[k] || (QF.mats[k] = new QF.T.MeshLambertMaterial({ map: qfTex(n, flip), transparent: true, alphaTest: .5 })); }
function qfCv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new QF.T.CanvasTexture(c); t.colorSpace = QF.T.SRGBColorSpace; return t; }

// ============ المشهد: مجلس، زولية حمرا، طاولة قصيرة، مساند، دلة ============
function qfWorld() {
  const T = QF.T, sc = QF.sc = new T.Scene(), lite = QF.lite;
  sc.background = new T.Color(0x1a0f08); sc.fog = new T.Fog(0x1a0f08, 22, 44);
  sc.add(new T.HemisphereLight(0xffe2b8, 0x2a170b, lite ? 1.7 : 1));
  const s = new T.DirectionalLight(0xffd9a0, lite ? 1.3 : 2); s.position.set(-4, 12, 6);
  if (!lite) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); Object.assign(s.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11 }); }
  sc.add(s);
  const M = o => lite ? new T.MeshLambertMaterial(o) : new T.MeshStandardMaterial(Object.assign({ roughness: .7 }, o));
  const rug = qfCv(512, 512, (g, w, h) => { g.fillStyle = '#8a1c1c'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = (x + y) % 64 ? '#3a2416' : '#f3e2c0'; g.beginPath(); g.moveTo(x + 16, y + 4); g.lineTo(x + 28, y + 16); g.lineTo(x + 16, y + 28); g.lineTo(x + 4, y + 16); g.fill(); } g.strokeStyle = '#f3e2c0'; g.lineWidth = 14; g.strokeRect(20, 20, w - 40, h - 40); });
  const f = new T.Mesh(new T.PlaneGeometry(26, 20), M({ map: rug, roughness: 1 })); f.rotation.x = -Math.PI / 2; f.position.y = -.9; f.receiveShadow = !lite; sc.add(f);
  QF.tb = new T.Mesh(new T.BoxGeometry(1, .3, 1), M({ color: 0x6b3a1c })); QF.tb.position.y = -.15; QF.tb.receiveShadow = !lite; sc.add(QF.tb);
  QF.inl = new T.Mesh(new T.PlaneGeometry(1, 1), M({ color: 0x0f4a3c, roughness: .95 })); QF.inl.rotation.x = -Math.PI / 2; QF.inl.position.y = .005; QF.inl.receiveShadow = !lite; sc.add(QF.inl);
  QF.fr = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1, 1)), new T.LineBasicMaterial({ color: 0xe7b54a })); QF.fr.rotation.x = -Math.PI / 2; QF.fr.position.y = .01; sc.add(QF.fr);
  QF.cush = []; for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.BoxGeometry(3.6, 1.6, 1), M({ color: 0x8a1c1c, roughness: .85 })); m.position.y = -.1; sc.add(m); QF.cush.push(m); }
  const gold = lite ? new T.MeshLambertMaterial({ color: 0xe7b54a }) : new T.MeshStandardMaterial({ color: 0xe7b54a, metalness: 1, roughness: .3 });
  QF.dal = new T.Group(); sc.add(QF.dal); const d1 = new T.Mesh(new T.CylinderGeometry(.3, .44, .9, 16), gold); d1.position.y = .45; QF.dal.add(d1); const d2 = new T.Mesh(new T.ConeGeometry(.3, .45, 16), gold); d2.position.y = 1.12; QF.dal.add(d2);
  const sp = new T.Mesh(new T.CylinderGeometry(.03, .06, .6, 8), gold); sp.position.set(.42, .7, 0); sp.rotation.z = -.9; QF.dal.add(sp);
  for (let i = 0; i < 3; i++) { const fn = new T.Mesh(new T.CylinderGeometry(.12, .08, .16, 12), M({ color: 0xf3ead8 })); fn.position.set(-.6 - i * .32, .08, .5); QF.dal.add(fn); }
  QF.geo = new T.BoxGeometry(1.1, .025, 1.56); QF.side = new T.MeshLambertMaterial({ color: 0xe7b54a });
  QF.deckG = new T.Group(); sc.add(QF.deckG);
  QF.discM = qfCardMesh(); QF.discM.visible = false; sc.add(QF.discM);
  QF.ray = new T.Raycaster(); QF.glow = new T.MeshBasicMaterial({ color: 0xffc928, transparent: true, opacity: .5, depthWrite: false });
}
// وجه الورقة تحت (ny) والظهر فوق (py). نقلبها حول z عشان يبان الوجه
function qfCardMesh(v) {
  const T = QF.T, back = qfMat('back'), face = v === undefined ? back : qfMat(qfImg(v), 1);
  const m = new T.Mesh(QF.geo, [QF.side, QF.side, back, face, QF.side, QF.side]); m.castShadow = !QF.lite; m.receiveShadow = !QF.lite;
  m.userData = { tp: new T.Vector3(), up: 0, flip: 0, v: undefined, ry: 0 }; return m;
}
function qfSetFace(m, v) { if (m.userData.v === v) return; m.userData.v = v; m.material = [QF.side, QF.side, m.userData.hl ? QF.hlMat : qfMat('back'), v === undefined ? qfMat('back') : qfMat(qfImg(v), 1), QF.side, QF.side]; }
function qfLayout() {
  const P = QF.portrait, W = P ? 7.6 : 11.4, D = P ? 11 : 7.8;
  QF.tb.scale.set(W + .8, 1, D + .8); QF.inl.scale.set(W, D, 1); QF.fr.scale.set(W, D, 1);
  const cz = [[-(W / 2 + 2), 0, Math.PI / 2], [W / 2 + 2, 0, -Math.PI / 2], [0, -(D / 2 + 1.6), 0]];
  QF.cush.forEach((m, i) => { m.position.set(cz[i][0], -.1, cz[i][1]); m.rotation.y = cz[i][2]; });
  QF.dal.position.set(W / 2 - .9, 0, -D / 2 + 1);
  QF.deckG.position.set(-.8, 0, P ? .4 : -.2); QF.discM.userData.tp.set(.8, .03, P ? .4 : -.2); QF.discM.position.copy(QF.discM.userData.tp);
}
// أماكن اللاعبين: أنا تحت والباقين حول الطاولة. كل مكان: مركز + زاوية
function qfSeats() {
  const g = S.g, ids = g.order, me = ids.includes(S.me) ? S.me : null, others = ids.filter(id => id !== me), P = QF.portrait, out = {};
  const W = P ? 7.6 : 11.4, D = P ? 11 : 7.8;
  if (me) out[me] = { x: 0, z: D / 2 - 1.5, ry: 0 };
  const spots = [[-W / 2 + 1.7, 0, -Math.PI / 2], [0, -D / 2 + 1.5, Math.PI], [W / 2 - 1.7, 0, Math.PI / 2], [-2.6, -D / 2 + 1.5, Math.PI], [2.6, -D / 2 + 1.5, Math.PI]];
  if (!me) { const first = others.shift(); out[first] = { x: 0, z: D / 2 - 1.5, ry: 0, s: P ? .8 : 1 }; }
  if (P) { // بالجوال: الخصوم صفين فوق الكومة
    const n = others.length, r1 = n <= 3 ? n : 3, r2 = n - r1;
    others.forEach((id, i) => { const row = i < r1 ? 0 : 1, k = row ? i - r1 : i, cnt = row ? r2 : r1; out[id] = { x: (k - (cnt - 1) / 2) * 2.45, z: row ? -2.1 : -4.3, ry: Math.PI, s: .68 }; });
  } else {
    const ord = others.length === 1 ? [1] : others.length === 2 ? [0, 2] : others.length === 3 ? [0, 1, 2] : others.length === 4 ? [0, 3, 4, 2] : [0, 3, 1, 4, 2];
    others.forEach((id, i) => { const s2 = spots[ord[i]]; out[id] = { x: s2[0], z: s2[1], ry: s2[2], s: 1 }; });
  }
  if (me) out[me].s = P ? .9 : 1;
  return out;
}
// مكان كل ورقة: صفّين، الصف القريب من صاحبه = آخر ورقتين (اللي يشوفها أول الجولة)
function qfSlotPos(seat, i, n) {
  const cols = Math.max(2, Math.ceil(n / 2)), row = i < cols ? 0 : 1, col = i % cols, inRow = row ? n - cols : Math.min(cols, n);
  const k = seat.s || 1, lx = (col - (inRow - 1) / 2) * 1.3 * k, lz = (row ? .9 : -.9) * k, c = Math.cos(seat.ry), s = Math.sin(seat.ry);
  return [seat.x + lx * c + lz * s, seat.z - lx * s + lz * c];
}
function qfSync() {
  if (!QF.built || !S.g) return;
  const T = QF.T, g = S.g, seats = qfSeats(), live = {};
  const dn = Math.min(12, Math.ceil(g.deck / 4));
  if (QF.deckG.children.length !== dn) { QF.deckG.clear(); for (let i = 0; i < dn; i++) { const m = qfCardMesh(); m.position.y = .02 + i * .026; QF.deckG.add(m); } }
  if (g.top) { qfSetFace(QF.discM, g.top.v); QF.discM.userData.flip = 1; QF.discM.visible = true; QF.discM.rotation.z = Math.PI; } else QF.discM.visible = false;
  for (const id of g.order) {
    const seat = seats[id]; if (!seat) continue; const h = g.hands[id] || [];
    h.forEach((cid, i) => {
      let m = QF.cards[cid];
      if (!m) { m = QF.cards[cid] = qfCardMesh(); m.position.copy(QF.deckG.position); m.position.y = .4; QF.sc.add(m); }
      const q = QF.seeQ[cid]; if (q) { delete QF.seeQ[cid]; if (q.until > performance.now()) { qfSetFace(m, q.v); m.userData.flip = 1; QF.seen[cid] = q.until; } }
      const [x, z] = qfSlotPos(seat, i, h.length); m.userData.tp.set(x, .02, z); m.userData.ry = seat.ry; m.scale.setScalar(seat.s || 1); m.userData.owner = id; m.userData.cid = cid; live[cid] = 1;
    });
  }
  for (const cid of Object.keys(QF.cards)) if (!live[cid]) { const m = QF.cards[cid]; QF.sc.remove(m); delete QF.cards[cid]; delete QF.seen[cid]; }
  // كشف نهاية الجولة
  if (g.res) for (const [id, cs] of Object.entries(g.res.hands)) for (const c of cs) { const m = QF.cards[c.id]; if (m) { qfSetFace(m, c.v); m.userData.flip = 1; } }
  else for (const [cid, m] of Object.entries(QF.cards)) { if (!QF.seen[cid]) { m.userData.flip = 0; } }
  QF.seats = seats;
}
function qfFrame() {
  QF.raf = 0; const cv = document.getElementById('qfCv'); if (!cv || !QF.built || !S || S.game !== 'qfl') return;
  QF.raf = requestAnimationFrame(qfFrame);
  const T = QF.T, dt = Math.min(.05, QF.clock.getDelta()), now = QF.clock.elapsedTime;
  const st = cv.parentNode, w = st.clientWidth, h = st.clientHeight, k = w + 'x' + h;
  if (k !== QF.sz && w && h) { QF.sz = k; QF.ren.setSize(w, h, false); QF.cam.aspect = w / h; const P = w / h < .9; QF.cam.fov = P ? 58 : 40; QF.cam.updateProjectionMatrix(); if (P !== QF.portrait) { QF.portrait = P; qfLayout(); qfSync(); } QF.cam.position.set(0, P ? 15.5 : 9.6, P ? 8.6 : 8.8); QF.cam.lookAt(0, 0, P ? .9 : .7); }
  const now2 = performance.now();
  for (const m of Object.values(QF.cards)) {
    const u = m.userData, seeing = QF.seen[u.cid] && QF.seen[u.cid] > now2, sel = QF.sel && QF.sel.includes(u.cid);
    if (QF.seen[u.cid] && !seeing && !(S.g && S.g.res)) { delete QF.seen[u.cid]; u.flip = 0; }
    const lift = (u.flip ? .55 : 0) + (u.up || 0) + (sel ? .3 : 0) + (u.look && u.look > now2 ? .5 : 0);
    m.position.x += (u.tp.x - m.position.x) * Math.min(1, dt * 8); m.position.z += (u.tp.z - m.position.z) * Math.min(1, dt * 8);
    m.position.y += (u.tp.y + lift - m.position.y) * Math.min(1, dt * 10);
    m.rotation.y += (u.ry - m.rotation.y) * Math.min(1, dt * 8);
    const fz = u.flip ? Math.PI : 0; m.rotation.z += (fz - m.rotation.z) * Math.min(1, dt * 9);
    if (u.shake && u.shake > now2) m.position.x += Math.sin(now * 60) * .05;
  }
  // تلميع الأوراق اللي تقدر تختارها
  const pick = qfPickable();
  for (const m of Object.values(QF.cards)) { const on = pick.includes(m.userData.cid); if (on !== !!m.userData.hl) { m.userData.hl = on; m.material = m.material.map((x, i) => i === 2 && on ? (QF.hlMat || (QF.hlMat = new T.MeshLambertMaterial({ map: qfTex('back'), emissive: 0x6a4a00, transparent: true, alphaTest: .5 }))) : i === 2 ? qfMat('back') : x); } }
  // مكان أسماء الخصوم
  if (QF.seats) for (const [id, s] of Object.entries(QF.seats)) { const el = QF.chips[id]; if (!el || !s) continue; const n = (S.g.hands[id] || []).length, o = (n > 4 ? 2.4 : 1.95) * (s.s || 1), v = new T.Vector3(s.x + Math.sin(s.ry) * o, .3, s.z + Math.cos(s.ry) * o).project(QF.cam); el.style.left = ((v.x + 1) / 2 * w) + 'px'; el.style.top = ((1 - v.y) / 2 * h) + 'px'; }
  QF.ren.render(QF.sc, QF.cam);
}
function qfInitGL(stage) {
  const T = QF.T, cv = stage.querySelector('#qfCv');
  let q = 'full'; try { q = localStorage.getItem('tdeal-q') || (matchMedia('(pointer:coarse)').matches ? 'lite' : 'full'); } catch {}
  QF.lite = q === 'lite';
  QF.ren = new T.WebGLRenderer({ canvas: cv, antialias: !QF.lite, powerPreference: 'high-performance' });
  QF.ren.setPixelRatio(Math.min(devicePixelRatio || 1, QF.lite ? 1.25 : 1.75)); QF.ren.outputColorSpace = T.SRGBColorSpace;
  if (!QF.lite) { QF.ren.shadowMap.enabled = true; QF.ren.shadowMap.type = T.PCFSoftShadowMap; QF.ren.toneMapping = T.ACESFilmicToneMapping; }
  QF.cam = new T.PerspectiveCamera(40, 16 / 9, .1, 100); QF.clock = new T.Clock(); QF.cards = {}; QF.seen = {}; QF.portrait = false;
  qfWorld(); qfLayout(); QF.built = true;
  cv.addEventListener('pointerdown', qfTap);
}
// ============ الضغط على الأوراق ============
function qfPickable() {
  const g = S.g; if (!g || g.spec) return [];
  const mineIds = (g.hands[S.me] || []);
  if (QF.mode === 'swap' || QF.mode === 'match') return mineIds;
  if (g.sub === 'pick' && g.pend && g.pend.by === S.me) {
    const k = g.pend.k, others = g.order.filter(id => id !== S.me).flatMap(id => g.hands[id] || []);
    if (k === 'own' || k === 'mix') return mineIds;
    if (k === 'spy' || k === 'take') return others;
    if (k === 'eye') { if (g.pend.mode === 'own') return mineIds.filter(c => !g.pend.picks.some(p => p[1] === c)); if (g.pend.mode === 'opp') return g.order.filter(id => id !== S.me && !g.pend.picks.some(p => p[0] === id)).flatMap(id => g.hands[id] || []); return []; }
    if (k === 'swap' || k === 'ss') return g.pend.wait ? [] : g.pend.picks.length ? others : mineIds;
  }
  return [];
}
function qfTap(e) {
  if (!QF.built) return; const r = e.target.getBoundingClientRect(), T = QF.T;
  const v = new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  QF.ray.setFromCamera(v, QF.cam);
  const hit = QF.ray.intersectObjects(Object.values(QF.cards))[0]; if (!hit) return;
  const u = hit.object.userData; if (!qfPickable().includes(u.cid)) return;
  if (QF.mode === 'swap') { QF.mode = null; send({ t: 'qswap', sid: u.cid }); qfSnd('card'); return qfHud(); }
  if (QF.mode === 'match') { QF.mode = null; send({ t: 'qmatch', sid: u.cid }); return qfHud(); }
  send({ t: 'qpick', owner: u.owner, sid: u.cid }); qfSnd('card');
}
// ============ الواجهة ============
function renderQfl(body) {
  const g = S.g; if (!g) return;
  if (body.dataset.built !== 'qfl' || !document.getElementById('qfCv')) {
    body.dataset.built = 'qfl'; QF.built = false; QF.sz = ''; QF.mode = null; QF.chips = {}; QF.revK = ''; QF.overK = '';
    body.innerHTML = `<div class="qfw"><div class="qfstage" id="qfStage"><canvas id="qfCv"></canvas>
      <div class="qfload" id="qfLoad"><b>ترتيب قفل</b>نجهّز المجلس…</div>
      <div class="qfchips" id="qfChips"></div><div class="qftop" id="qfTop"></div><div class="qfhint" id="qfHint" hidden></div>
      <div class="qfdrawn" id="qfDrawn" hidden></div><div class="qfbar" id="qfBar"></div><div class="qffx" id="qfFx"></div>
      <div class="qfres" id="qfRes" hidden></div></div></div>`;
    qfLibs().then(() => { const st = document.getElementById('qfStage'); if (!st) return; qfInitGL(st); qfSync(); document.getElementById('qfLoad').hidden = true; if (!QF.raf) QF.raf = requestAnimationFrame(qfFrame); })
      .catch(e => { console.error(e); const l = document.getElementById('qfLoad'); if (l) l.innerHTML = '<b>!</b>ما قدرنا نحمّل الثري دي على جهازك'; });
  }
  if (QF.built) { qfSync(); if (!QF.raf) QF.raf = requestAnimationFrame(qfFrame); }
  if (g.sub !== 'turn' || g.turn !== S.me) QF.mode = null;
  qfHud();
  if (!QF.tmr) QF.tmr = setInterval(qfTick, 200);
}
function qfTick() {
  const el = document.getElementById('qfTime'); if (!el || !S.g) { if (!document.getElementById('qfStage')) { clearInterval(QF.tmr); QF.tmr = 0; } return; }
  const left = Math.max(0, QF.endAt - performance.now()); el.textContent = qfNum(Math.ceil(left / 1000));
  el.parentNode.classList.toggle('low', left < 6000 && S.g.turn === S.me);
}
function qfHud() {
  const g = S.g, mine = g.turn === S.me && !g.spec, over = S.phase === 'over';
  QF.endAt = performance.now() + (g.left || 0);
  // أسماء اللاعبين على الطاولة
  const ch = document.getElementById('qfChips');
  for (const id of g.order) {
    let el = QF.chips[id]; if (!el) { el = QF.chips[id] = document.createElement('div'); el.className = 'qfop'; el.dataset.id = id; ch.appendChild(el); }
    el.classList.toggle('on', g.turn === id && g.sub !== 'rev'); el.classList.toggle('me', id === S.me);
    el.innerHTML = `${qfAv(id, 30)}<span><b>${esc(qfPl(id).name)}${id === S.me ? ' (أنت)' : ''}</b><small>${qfNum(g.tot[id] || 0)} نقطة</small></span>${g.called === id ? '<i class="qflock">قفّل</i>' : ''}`;
  }
  for (const id of Object.keys(QF.chips)) if (!g.order.includes(id)) { QF.chips[id].remove(); delete QF.chips[id]; }
  document.getElementById('qfTop').innerHTML = `<span>الجولة ${qfNum(g.rnd)} من ${qfNum(g.rounds)}</span>${g.called ? `<span class="red">${esc(qfPl(g.called).name)} قفّل — آخر لفة</span>` : ''}`;
  // التلميح
  const hint = document.getElementById('qfHint'); let ht = '';
  if (g.sub === 'peek') ht = 'احفظ ورقتينك القريبة منك!';
  else if (QF.mode === 'swap') ht = 'اضغط على ورقة من أوراقك تبدّلها';
  else if (QF.mode === 'match') ht = 'اضغط على ورقتك اللي نفس رقم المكشوفة';
  else if (g.sub === 'pick' && g.pend && g.pend.by === S.me) ht = g.pend.k === 'eye' ? (g.pend.mode ? QFHINT['eye' + g.pend.mode] : '') : g.pend.k === 'any' || (g.pend.k === 'ss' && g.pend.wait) ? '' : QFHINT[g.pend.k];
  else if (g.sub === 'pick' && g.pend) ht = `${esc(qfPl(g.pend.by).name)} يستخدم قدرة…`;
  hint.hidden = !ht; hint.innerHTML = ht;
  // الورقة المسحوبة
  const dw = document.getElementById('qfDrawn'), d = g.drawn && g.drawn.c;
  if (mine && d && g.sub === 'turn' && QF.mode !== 'swap') {
    const pw = QFPOW[d.v], key = 'd' + d.id;
    if (dw.dataset.k !== key) { dw.dataset.k = key; qfSnd('draw'); }
    dw.hidden = false;
    dw.innerHTML = `<img src="${qfSrc(qfImg(d.v))}"><div class="qft">${g.drawn.from === 'disc' ? 'أخذت المكشوفة — لازم تبدّلها' : `سحبت ${qfName(d.v)}${pw ? ' — ' + pw[0] : ''}`}</div>
      <div class="qfbtns"><button class="qfb" data-a="swap">بدّلها بورقة من عندي</button>${pw && g.drawn.from === 'deck' ? `<button class="qfb gold" data-a="use">استخدم قدرتها (${pw[0]})</button>` : ''}${g.drawn.from === 'deck' ? '<button class="qfb red" data-a="throw">ارمها</button>' : ''}</div>`;
    dw.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = b.dataset.a; if (a === 'swap') { QF.mode = 'swap'; qfHud(); } else send({ t: 'qthrow', use: a === 'use' ? 1 : 0 }); });
  } else if (mine && g.sub === 'pick' && g.pend && g.pend.by === S.me && (g.pend.k === 'any' || (g.pend.k === 'eye' && !g.pend.mode) || (g.pend.k === 'ss' && g.pend.wait))) {
    const pd = g.pend, key = 'c' + pd.k + pd.wait; dw.hidden = false;
    if (dw.dataset.k !== key) {
      dw.dataset.k = key;
      if (pd.k === 'any') dw.innerHTML = `<img src="${qfSrc('any')}"><div class="qft">على كيفك — اختر القدرة</div><div class="qfbtns">${[['own', 'شوف ورقتك'], ['spy', 'شوف ورقة غيرك'], ['eye', 'عين'], ['swap', 'بدّل'], ['ss', 'شوف وبدّل'], ['take', 'خذ بس'], ['mix', 'زي بعض']].map(([k, t]) => `<button class="qfb${k === 'take' || k === 'swap' ? ' gold' : ''}" data-k="${k}">${t}</button>`).join('')}</div>`;
      else if (pd.k === 'eye') dw.innerHTML = `<img src="${qfSrc('eye')}"><div class="qft">عين — وش تبي تشوف؟</div><div class="qfbtns"><button class="qfb gold" data-m="opp">ورقة من كل خصم</button><button class="qfb" data-m="own">ورقتين من عندي</button></div>`;
      else dw.innerHTML = `<img src="${qfSrc('ss')}"><div class="qft">شفت الورقتين — تبدّلهم؟</div><div class="qfbtns"><button class="qfb gold" data-ok="1">بدّل</button><button class="qfb red" data-ok="0">لا خلهم</button></div>`;
      dw.querySelectorAll('[data-k]').forEach(b => b.onclick = () => send({ t: 'qmode', k: b.dataset.k }));
      dw.querySelectorAll('[data-m]').forEach(b => b.onclick = () => send({ t: 'qmode', m: b.dataset.m }));
      dw.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => send({ t: 'qmode', ok: b.dataset.ok === '1' }));
    }
    dw.classList.toggle('peek', pd.k === 'ss');
  } else { dw.hidden = true; dw.dataset.k = ''; dw.classList.remove('peek'); }
  // شريط الأزرار
  const can = mine && g.sub === 'turn' && !g.drawn, top = g.top;
  const myTot = g.tot[S.me] || 0;
  document.getElementById('qfBar').innerHTML = over ? `<button class="qfb gold" id="qfShow">النتيجة</button>` : g.spec ? `<span class="qfst">تتفرج · دور ${esc(qfPl(g.turn).name)}</span>` : `
    <button class="qfb" id="qfDraw" ${can ? '' : 'disabled'}>اسحب</button>
    <button class="qfb gold" id="qfTake" ${can && top ? '' : 'disabled'}>خذ ${top ? qfName(top.v) : ''}</button>
    <button class="qfcall" id="qfCall" ${mine && g.canCall ? '' : 'disabled'}>قفّل!</button>
    <button class="qfb ${QF.mode === 'match' ? 'on' : ''}" id="qfMatch" ${top && ['turn', 'pick'].includes(g.sub) ? '' : 'disabled'}>نفس الرقم</button>
    <span class="qfst">${mine ? 'دورك' : g.sub === 'peek' ? 'احفظ' : 'دور ' + esc(qfPl(g.turn).name)} · <b id="qfTime"></b>ث<br><small>نقاطك ${qfNum(myTot)}</small></span>`;
  const b = (id, fn) => { const e = document.getElementById(id); if (e) e.onclick = fn; };
  b('qfDraw', () => send({ t: 'qdraw' })); b('qfTake', () => send({ t: 'qtake' })); b('qfCall', () => send({ t: 'qcall' }));
  b('qfMatch', () => { QF.mode = QF.mode === 'match' ? null : 'match'; qfHud(); }); b('qfShow', () => qfFinal(true));
  // نهاية الجولة واللعبة
  if (g.res && g.sub === 'rev') { const k = 'r' + g.rnd; if (QF.revK !== k) { QF.revK = k; setTimeout(() => qfRound(), 1600); } }
  else if (!over) { const r = document.getElementById('qfRes'); if (r && !r.dataset.final) r.hidden = true; }
  if (over && QF.overK !== 'o') { QF.overK = 'o'; setTimeout(() => qfFinal(), 1800); }
}
function qfRound() {
  const g = S.g, r = document.getElementById('qfRes'); if (!g || !g.res || !r) return;
  const R = g.res, ids = g.order.slice().sort((a, b) => R.sums[a] - R.sums[b]);
  r.hidden = false; delete r.dataset.final;
  r.innerHTML = `<div class="qfrc"><h3>نهاية الجولة ${qfNum(g.rnd)}</h3>${ids.map((id, i) => `<div class="qfrr${id === R.called ? (R.ok ? ' win' : ' bad') : ''}" style="animation-delay:${i * .25}s">${qfAv(id, 30)}<b>${esc(qfPl(id).name)}</b><span class="qfcs">${(R.hands[id] || []).map(c => `<img src="${qfSrc(qfImg(c.v))}">`).join('')}</span><span class="qfsum">${qfNum(R.sums[id])}</span>${id === R.called ? `<em>${R.ok ? 'قفّل وصفّر' : 'قفّل وخسر ×٢'}</em>` : ''}<span class="qfpt">+${qfNum(R.pts[id])}</span></div>`).join('')}</div>`;
  qfSnd(R.called && !R.ok ? 'lose' : 'chime');
}
function qfFinal(force) {
  const g = S.g, r = document.getElementById('qfRes'); if (!g || !r || (S.phase !== 'over' && !force)) return;
  const ids = g.order.slice().sort((a, b) => g.tot[a] - g.tot[b]);
  r.hidden = false; r.dataset.final = 1;
  r.innerHTML = `<div class="qfrc"><h3 class="gold">${esc(S.winner || '')} فاز!</h3><p class="qfsub">أقل نقاط بعد ${qfNum(g.rnd)} جولات</p>${ids.map((id, i) => `<div class="qfrr${i ? '' : ' win'}" style="animation-delay:${i * .2}s"><span class="qfrank">${qfNum(i + 1)}</span>${qfAv(id, 30)}<b>${esc(qfPl(id).name)}</b><span class="qfsum">${qfNum(g.tot[id])}</span></div>`).join('')}<button class="qfb" id="qfClose">سكّر</button></div>`;
  document.getElementById('qfClose').onclick = () => { r.hidden = true; };
  if (!force) qfSnd('win');
}
// ============ المؤثرات ============
function net_qfl(m) {
  if (!S || S.game !== 'qfl' || !S.g) return; const fx = document.getElementById('qfFx'); if (!fx) return;
  const now = performance.now();
  if (m.k === 'see') {
    const sids = m.sids || [m.sid], vs = m.vs || [m.v], dur = m.ms || 4000;
    sids.forEach((sid, i) => { QF.seeQ[sid] = { v: vs[i], until: performance.now() + dur }; });
    if (QF.built) qfSync();
    if (m.owner !== S.me) qfToast(`شفت ورقة ${esc(qfPl(m.owner).name)}: <b>${qfName(vs[0])}</b>`);
    return;
  }
  if (m.k === 'look') {
    const c = QF.cards[m.sid]; if (c) c.userData.look = now + 2500;
    qfFloat(m.id, `<svg viewBox="0 0 48 48" width="44" height="44"><circle cx="24" cy="24" r="22" fill="${m.owner === m.id ? '#e7b54a' : '#1c5fd0'}" stroke="#3a2416" stroke-width="3"/><path d="M8 24 Q24 10 40 24 Q24 38 8 24Z" fill="#fff" stroke="#3a2416" stroke-width="2.5"/><circle cx="24" cy="24" r="6" fill="#3a2416"/></svg>`);
    if (m.owner === S.me && m.id !== S.me) { qfToast(`${esc(qfPl(m.id).name)} يتجسس على ورقتك!`, 'warn'); qfSnd('whoosh'); }
  }
  if (m.k === 'call') { qfStamp('قفّل!'); qfSnd('slam'); }
  if (m.k === 'match') { qfToast(`${esc(qfPl(m.id).name)} رمى ${qfName(m.v)} مع المكشوفة!`); qfSnd('ding'); }
  if (m.k === 'bad') { const c = QF.cards[m.sid]; if (c) { qfSetFace(c, m.v); c.userData.flip = 1; QF.seen[m.sid] = now + 1800; c.userData.shake = now + 700; } qfToast(`${esc(qfPl(m.id).name)} رمى غلط وأخذ عقوبة`, 'warn'); qfSnd('nope'); }
  if (m.k === 'swapc') { qfToast(`${esc(qfPl(m.id).name)} بدّل ورقة مع ${esc(qfPl(m.b[0]).name)}`); qfSnd('whoosh'); for (const [, sid] of [m.a, m.b]) { const c = QF.cards[sid]; if (c) c.userData.look = now + 1500; } }
  if (m.k === 'power' && m.id !== S.me) qfToast(`${esc(qfPl(m.id).name)} يستخدم ${{ own: '٧/٨', spy: '٩/١٠', swap: 'بدّل', eye: 'عين', mix: 'زي بعض', ss: 'شوف وبدّل', take: 'خذ بس', any: 'على كيفك' }[m.p]}`);
  if (m.k === 'take2') { qfToast(m.owner === S.me ? `${esc(qfPl(m.id).name)} خلاك تاخذ ورقة زيادة!` : `${esc(qfPl(m.id).name)} خلّى ${esc(qfPl(m.owner).name)} ياخذ ورقة زيادة`, m.owner === S.me ? 'warn' : ''); qfSnd('card'); }
  if (m.k === 'throw' || m.k === 'swapin' || m.k === 'drop') qfSnd('card');
  if (m.k === 'rev') qfSnd('bell');
}
function qfFloat(id, html) {
  const el = QF.chips[id], fx = document.getElementById('qfFx'); if (!el || !fx) return;
  const d = document.createElement('div'); d.className = 'qffloat'; d.innerHTML = html; d.style.left = el.style.left; d.style.top = el.style.top; fx.appendChild(d); setTimeout(() => d.remove(), 2200);
}
function qfToast(h, cls = '') { const fx = document.getElementById('qfFx'); if (!fx) return; const d = document.createElement('div'); d.className = 'qftoast ' + cls; d.innerHTML = h; fx.appendChild(d); setTimeout(() => d.remove(), 2600); }
function qfStamp(t) { const fx = document.getElementById('qfFx'); if (!fx) return; const d = document.createElement('div'); d.className = 'qfstamp'; d.textContent = t; fx.appendChild(d); setTimeout(() => d.remove(), 2000); }
