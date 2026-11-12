// البيت المسكون من برا: المقدمة السينمائية (أول ما تدخل الغرفة)، مصمم الشخصية، واللوبي الثري دي
// (كل اللاعبين واقفين قدام البيت بشخصياتهم). نفس الرندرر حق اللعبة ننقله بين الشاشات.
const HX = { mode: null, scene: null, chars: {}, t0: 0, light: 0, nextBolt: 0, cust: null, look: null, rot: 0 };
const LOOK_KEY = 'tarteeb-look';
const hxLook = () => { try { const l = JSON.parse(localStorage.getItem(LOOK_KEY)); if (l) return l; } catch {} return null; };
const hxSaveLook = l => { try { localStorage.setItem(LOOK_KEY, JSON.stringify(l)); } catch {} };

// نحمّل ثري دي + الشخصيات مرة وحدة
function hLibs() {
  if (HU.libs) return HU.libs;
  return HU.libs = Promise.all([import('./vendor/three.module.min.js'), import('./haunt-chars.js')]).then(async ([T, HC]) => {
    HU.T = T; HU.HC = HC;
    try { await HC.load(); HU.charsOk = true; } catch (e) { console.warn('chars', e); HU.charsOk = false; }
    return HU;
  });
}
function hRenderer() {
  if (HU.r) return HU.r;
  const T = HU.T; HU.shadows = !isMob();
  const r = HU.r = new T.WebGLRenderer({ antialias: !isMob(), powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, isMob() ? 1.25 : 1.5));
  r.shadowMap.enabled = HU.shadows; r.shadowMap.type = T.PCFSoftShadowMap;
  r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.domElement.className = 'hcv';
  return r;
}
function hPut(box) { const r = hRenderer(); if (r.domElement.parentNode !== box) box.appendChild(r.domElement); HU.w = HU.h = 0; }

// ---------- البيت من برا ----------
function hxBuild() {
  const T = HU.T, s = HX.scene = new T.Scene();
  s.fog = new T.FogExp2(0x0b0f1a, .028);
  s.background = tex(cvs(16, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05060c'); g.addColorStop(.6, '#141a2e'); g.addColorStop(1, '#2a2438'); x.fillStyle = g; x.fillRect(0, 0, w, h); }));
  s.background.wrapS = s.background.wrapT = T.ClampToEdgeWrapping; s.background.repeat.set(1, 1);
  const M = c => new T.MeshLambertMaterial(c);
  const siding = M({ map: tex(cvs(128, 128, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#2c2a33' : '#33303b'; x.fillRect(0, i * 16, w, 16); x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, i * 16 + 14, w, 2); } grime(x, w, h, 30, .4); }), 3, 2) });
  const roofM = M({ map: tex(cvs(128, 128, (x, w, h) => { x.fillStyle = '#19161d'; x.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = 0; i < 6; i++) { x.fillStyle = `hsl(260,8%,${9 + Math.random() * 6}%)`; x.fillRect(i * 22 + (j % 2) * 11 - 6, j * 16, 20, 14); } }), 4, 3), side: T.DoubleSide });
  const trim = M({ color: 0x1a1414 }), wood = M({ color: 0x2a1e16 });
  const winM = new T.MeshBasicMaterial({ color: 0xffb547 }), winD = new T.MeshBasicMaterial({ color: 0x0a0a10 }), winR = new T.MeshBasicMaterial({ color: 0xff3a20 });
  const ground = new T.Mesh(new T.PlaneGeometry(120, 120), M({ map: tex(cvs(128, 128, (x, w, h) => { x.fillStyle = '#121a12'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `hsla(${80 + Math.random() * 40},25%,${6 + Math.random() * 10}%,.8)`; x.fillRect(Math.random() * w, Math.random() * h, 1.5, 4); } }), 30, 30) }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  const path = new T.Mesh(new T.PlaneGeometry(2.6, 16), M({ map: tex(TEX.stone(), 1, 6) })); path.rotation.x = -Math.PI / 2; path.position.set(0, .01, 3); s.add(path);
  const H = new T.Group(); H.position.set(0, 0, -9); s.add(H);
  box(13, 7, 8, siding, 0, 3.5, 0, H);
  const tri = new T.Shape(); tri.moveTo(-7.2, 0); tri.lineTo(0, 4.2); tri.lineTo(7.2, 0); tri.closePath();
  const roof = new T.Mesh(new T.ExtrudeGeometry(tri, { depth: 9, bevelEnabled: false }), roofM); roof.position.set(0, 7, -4.5); H.add(roof);
  const tower = cyl(1.9, 1.9, 11, siding, 5.2, 5.5, 3.2, H, 16); const cone = new T.Mesh(new T.ConeGeometry(2.5, 4.2, 16), roofM); cone.position.set(5.2, 13.1, 3.2); H.add(cone);
  box(.6, 3, .6, M({ color: 0x2a2026 }), -3.5, 9.5, -1, H);
  // النوافذ (بعضها منوّر وبعضها يرمش وواحد أحمر فيه ظل)
  HX.wins = [];
  [[-4.5, 2.3], [-2.2, 2.3], [2.2, 2.3], [-4.5, 5.3], [-1.5, 5.3], [1.5, 5.3], [5.2, 6.5, 1], [5.2, 9.5, 1]].forEach(([x, y, tw], i) => {
    const mat = i === 4 ? winR : Math.random() < .55 ? winM.clone() : winD;
    const w = new T.Mesh(new T.PlaneGeometry(1.1, 1.6), mat); w.position.set(x, y, tw ? 5.12 : 4.02); H.add(w);
    box(1.3, .12, .2, trim, x, y - .85, tw ? 5.1 : 4.05, H); box(1.3, .12, .2, trim, x, y + .85, tw ? 5.1 : 4.05, H); box(.08, 1.6, .1, trim, x, y, tw ? 5.14 : 4.05, H);
    if (mat !== winD) HX.wins.push(w);
    if (i === 4) { HX.redWin = w; const sh = new T.Mesh(new T.PlaneGeometry(.5, 1), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })); sh.position.set(x, y - .2, 4.04); H.add(sh); HX.shadow = sh; }
  });
  // الشرفة والباب
  box(8, .45, 3, wood, 0, .22, 5.5, H); box(8.4, .25, 3.3, trim, 0, 3.3, 5.6, H);
  [-3.7, -1.3, 1.3, 3.7].forEach(x => cyl(.13, .15, 3.1, M({ color: 0x3a3236 }), x, 1.75, 6.8, H, 8));
  for (let i = 0; i < 3; i++) box(3, .15, .45, wood, 0, .07 + i * .15 - .15 * 0, 7.3 + (2 - i) * .4 - .4, H).position.y = (i + 1) * .15 - .07;
  const doorP = new T.Group(); doorP.position.set(-.85, 0, 4.03); H.add(doorP); box(1.7, 2.8, .1, M({ color: 0x1e1410 }), .85, 1.85, 0, doorP); box(.1, .25, .1, M({ color: 0xb08a3a }), 1.5, 1.7, .1, doorP); HX.door = doorP;
  box(2.1, .25, .3, trim, 0, 3.35, 4.05, H);
  HX.doorLight = new T.PointLight(0xff7a2a, 0, 12, 1.5); HX.doorLight.position.set(0, 1.8, 3); H.add(HX.doorLight);
  const glowIn = new T.Mesh(new T.PlaneGeometry(1.7, 2.8), new T.MeshBasicMaterial({ color: 0xff8a3a })); glowIn.position.set(0, 1.85, 3.98); H.add(glowIn); HX.glowIn = glowIn; glowIn.visible = false;
  // سور وأشجار ميتة وقبور
  for (let x = -14; x <= 14; x += .8) { if (Math.abs(x) < 1.6) continue; box(.08, 1.1 + (Math.abs(x * 7) % 3) * .08, .08, M({ color: 0x15131a }), x, .55, 7.5, s); }
  box(12.4, .07, .05, M({ color: 0x15131a }), -8, .95, 7.5, s); box(12.4, .07, .05, M({ color: 0x15131a }), 8, .95, 7.5, s);
  const bark = M({ color: 0x17131a });
  const tree = (x, z, h, seed) => { const g = new T.Group(); g.position.set(x, 0, z); s.add(g); const br = (p, len, r, a, d) => { const m = new T.Mesh(new T.CylinderGeometry(r * .6, r, len, 5), bark); m.position.y = len / 2; const n = new T.Group(); n.position.copy(p); n.rotation.set(a[0], a[1], a[2]); n.add(m); g.add(n); if (d < 3) { const top = new T.Vector3(0, len, 0).applyEuler(n.rotation).add(p); for (let k = 0; k < 2 + (d === 0); k++) br(top, len * .65, r * .6, [a[0] + (Math.sin(seed + k * 3 + d) * .7), a[1] + k * 2.1, a[2] + Math.cos(seed * 2 + k + d) * .7], d + 1); } }; br(new T.Vector3(), h, .25, [0, 0, 0], 0); HX.trees.push(g); };
  HX.trees = []; [[-9, -1, 4.5, 1], [9.5, 0, 5, 2], [-13, -6, 6, 3], [12, -4, 4, 4], [-6, 5, 3.4, 5]].forEach(a => tree(...a));
  const stoneM = M({ color: 0x4a4852 });
  [[-6, 2], [-7.5, 3], [-5, 4.2], [-8.4, 1.2], [6.5, 3.4], [7.8, 2.2]].forEach(([x, z], i) => { const g = box(.7, 1 + (i % 2) * .3, .2, stoneM, x, .5, z, s); g.rotation.z = (i % 3 - 1) * .12; const top = cyl(.35, .35, .2, stoneM, x, 1 + (i % 2) * .3, z, s, 12); top.rotation.x = Math.PI / 2; top.rotation.z = g.rotation.z; });
  // القمر والضو
  const moon = new T.Mesh(new T.CircleGeometry(3, 32), new T.MeshBasicMaterial({ color: 0xf3ead8, fog: false })); moon.position.set(-18, 22, -45); moon.lookAt(0, 2, 10); s.add(moon);
  HX.amb = new T.AmbientLight(0x6a7aa8, .5); s.add(HX.amb);
  HX.moonL = new T.DirectionalLight(0x9ab4ff, 1.4); HX.moonL.position.set(-12, 18, 10); HX.moonL.castShadow = HU.shadows; HX.moonL.shadow.mapSize.set(1024, 1024); Object.assign(HX.moonL.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 }); s.add(HX.moonL);
  HX.porchL = new T.PointLight(0xffb36a, 4, 9, 1.6); HX.porchL.position.set(0, 3, -2.8); s.add(HX.porchL);
  HX.spot = new T.SpotLight(0xfff1d6, 0, 14, .45, .6, 1.4); s.add(HX.spot); s.add(HX.spot.target);
  HX.cam = new T.PerspectiveCamera(50, 1, .1, 200);
  // الضباب الأرضي: لوحات شفافة تتحرك
  const fogT = tex(cvs(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(160,170,200,.35)'); g.addColorStop(1, 'rgba(160,170,200,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }));
  HX.mist = []; for (let i = 0; i < 18; i++) { const m = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: .5 })); m.rotation.x = -Math.PI / 2; m.position.set(Math.random() * 30 - 15, .3 + Math.random() * .5, Math.random() * 18 - 8); s.add(m); HX.mist.push(m); }
  HX.stage = new T.Group(); s.add(HX.stage);
}
function hxBolt(t, loud) { HX.light = t; HX.light2 = t + 160; if (loud) setTimeout(() => sfx('thunder'), 300); }
function hxAnim(t, dt) {
  const fl = (t - HX.light < 90 || (t - HX.light2 > 0 && t - HX.light2 < 70)) ? 1 : 0;
  HX.amb.intensity = .45 + fl * 4; HX.moonL.intensity = 1.3 + fl * 4;
  HX.porchL.intensity = 3.6 + Math.sin(t / 90) * .4 + (Math.random() < .02 ? -3 : 0);
  HX.wins.forEach((w, i) => { if (i % 3 === 0 && w.material.color) w.material.color.setHSL(.09, 1, .5 + (Math.random() < .03 ? -.4 : 0)); });
  if (HX.shadow) HX.shadow.material.opacity = (t / 1000 % 9) > 7.6 ? .85 : 0;
  HX.trees.forEach((g, i) => { g.rotation.z = Math.sin(t / 1400 + i) * .02; });
  HX.mist.forEach((m, i) => { m.position.x += dt * (.25 + (i % 3) * .1); if (m.position.x > 16) m.position.x = -16; m.material.opacity = .35 + Math.sin(t / 2000 + i) * .15; });
}
function hxFrame(t) {
  if (!HX.mode) { HX.loop = false; return; }
  requestAnimationFrame(hxFrame);
  const dt = Math.min(.05, (t - (HX.lt || t)) / 1000); HX.lt = t;
  const box = HX.box; if (!box || !box.isConnected) { if (HX.mode === 'lobby') hxStop(); return; }
  const W = box.clientWidth, H = box.clientHeight;
  if (W && H && (HU.w !== W || HU.h !== H)) { HU.w = W; HU.h = H; HU.r.setSize(W, H, false); }
  const cam = HX.mode === 'cust' ? HX.ccam : HX.cam; if (W && H) { cam.aspect = W / H; cam.updateProjectionMatrix(); }
  if (HX.mode === 'cust') { hxCustFrame(t, dt); HU.r.render(HX.cscene, HX.ccam); return; }
  if (t > HX.nextBolt) { HX.nextBolt = t + (HX.mode === 'cine' ? 2600 : 14000 + Math.random() * 14000); hxBolt(t, HX.mode === 'cine' || Math.random() < .5); }
  hxAnim(t, dt);
  if (HX.mode === 'cine') { if (!HX.cineGo) { HX.cineGo = true; try { HU.r.compile(HX.scene, cam); } catch {} HX.t0 = performance.now() + 120; HX.nextBolt = HX.t0 + 500; } hxCineFrame(t); }
  else hxLobbyFrame(t, dt);
  Object.values(HX.chars).forEach(c => c.ch && c.ch.update(dt));
  HU.r.render(HX.scene, cam);
}
function hxStart(mode, box) {
  HX.mode = mode; HX.box = box; hPut(box);
  if (!HX.loop) { HX.loop = true; HX.lt = 0; requestAnimationFrame(hxFrame); }
}
function hxStop() { HX.mode = null; }

// ---------- المقدمة السينمائية ----------
function hCine(done) {
  let el = $('#hCine');
  if (!el) { el = document.createElement('div'); el.id = 'hCine'; el.className = 'hcine'; document.body.appendChild(el); }
  el.innerHTML = `<div class="hcinebox" id="hCineBox"></div><div class="hbars2"></div><div class="htitle" id="hTitle"><b>البيت المسكون</b><span>تتجرّأ تدخل؟</span></div><button type="button" class="hskip" id="hSkip">تخطّي ⏭</button><div class="hfade" id="hFade"></div>`;
  el.hidden = false; document.body.classList.add('hcine-on');
  const end = () => { if (HX.cineDone) return; HX.cineDone = true; el.classList.add('out'); setTimeout(() => { el.hidden = true; el.classList.remove('out'); document.body.classList.remove('hcine-on'); hxStop(); done && done(); }, 450); };
  $('#hSkip').onclick = end;
  HX.cineDone = false; HX.cineEnd = end; HX.cineGo = false; HX.creaked = false; HX.t0 = 1e15; HX.doorT = 0; const f = $('#hFade'); if (f) f.style.opacity = 0;
  HX.door.rotation.y = 0; HX.glowIn.visible = false; HX.doorLight.intensity = 0;
  hxStage([]);
  hxStart('cine', $('#hCineBox'));
  sfx('drone'); setTimeout(() => sfx('mbox'), 2200);
}
function hxCineFrame(t) {
  const T = HU.T, k = Math.max(0, (performance.now() - HX.t0) / 1000), cam = HX.cam, e = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const a = e(k / 5.2);
  cam.position.set(Math.sin(k * .4) * 4 * (1 - a), 10 - 7.6 * a, 34 - 26.5 * a);
  const look = new T.Vector3(0, 4.5 - 2.6 * a, -8);
  if (k > 5.4) { const b = e((k - 5.4) / 1.3); cam.position.lerp(new T.Vector3(0, 1.8, -4.2), b); look.set(0, 1.8, -9); }
  cam.lookAt(look);
  const ttl = $('#hTitle'); if (ttl && k > 1.6 && !ttl.classList.contains('on')) { ttl.classList.add('on'); sfx('slam'); }
  if (k > 4.6) { HX.door.rotation.y = -Math.min(1.9, (k - 4.6) * 1.6); HX.glowIn.visible = true; HX.doorLight.intensity = Math.min(8, (k - 4.6) * 8); if (!HX.creaked) { HX.creaked = true; sfx('creak'); } }
  if (k > 6.2) { const f = $('#hFade'); if (f) f.style.opacity = Math.min(1, (k - 6.2) / .5); }
  if (k > 6.8) HX.cineEnd();
}

// ---------- اللوبي: الكل قدام البيت ----------
function hxStage(players) {
  const T = HU.T, keep = {};
  if (!HU.charsOk) return;
  const n = players.length, perRow = n > 6 ? Math.ceil(n / 2) : n;
  players.forEach((p, i) => {
    const key = p.id + ':' + JSON.stringify(p.lk || {});
    keep[p.id] = 1;
    let c = HX.chars[p.id];
    if (!c || c.key !== key) {
      if (c) HX.stage.remove(c.g);
      const ch = HU.HC.makeChar(p.lk || HU.HC.DEFAULT_LOOK), g = new T.Group(); g.add(ch.root); ch.root.scale.setScalar(.92);
      ch.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      const tag = hNameTag(p.name, p.id === S.me ? '#ffc928' : '#f3ead8'); tag.position.y = 2.05; tag.scale.set(1.3, .33, 1); g.add(tag);
      ch.play(i % 3 === 1 ? 'Idle_Torch_Loop' : 'Idle_Loop', 0); ch.mixer.update(Math.random() * 3);
      c = HX.chars[p.id] = { key, ch, g }; HX.stage.add(g);
    }
    const row = i < perRow ? 0 : 1, idx = row ? i - perRow : i, cnt = row ? n - perRow : perRow;
    c.tx = (idx - (cnt - 1) / 2) * (cnt > 5 ? .95 : 1.15); c.tz = -1.2 - row * 1.3;
    if (c.g.position.lengthSq() === 0) c.g.position.set(c.tx, 0, c.tz + 3);
    c.g.rotation.y = Math.sin(i * 2.3) * .25;
    c.me = p.id === S.me;
  });
  Object.keys(HX.chars).forEach(id => { if (!keep[id]) { HX.stage.remove(HX.chars[id].g); delete HX.chars[id]; } });
}
function hxLobbyFrame(t, dt) {
  const cam = HX.cam, n = Object.keys(HX.chars).length;
  cam.position.set(Math.sin(t / 6000) * .5, 1.75 + Math.sin(t / 4000) * .06, 3.2 + (n > 6 ? 1.6 : n > 3 ? .5 : 0));
  cam.lookAt(0, 1.05, -2.2);
  Object.values(HX.chars).forEach(c => {
    const g = c.g, d = Math.hypot(c.tx - g.position.x, c.tz - g.position.z);
    if (d > .05) { g.position.x += (c.tx - g.position.x) * Math.min(1, dt * 2.5); g.position.z += (c.tz - g.position.z) * Math.min(1, dt * 2.5); if (!c.walk) { c.walk = 1; c.ch.play('Walk_Loop', .2); } }
    else if (c.walk) { c.walk = 0; c.ch.play('Idle_Loop', .3); }
    if (c.me) { HX.spot.intensity = 30; HX.spot.position.set(g.position.x, 5, g.position.z + 1.5); HX.spot.target.position.set(g.position.x, 0, g.position.z); }
  });
}
// يناديه app.js مع كل رسم
function hauntLobby(ph) {
  const on = ph === 'lobby' && S && S.game === 'haunt';
  let st = $('#hStage');
  hMenuMusic(on);
  if (!on) {
    if (st) st.hidden = true;
    if (HX.mode) { hxStop(); ['#hCust', '#hCine'].forEach(q => { const e = $(q); if (e) e.hidden = true; }); document.body.classList.remove('hcine-on'); HX.cineRunning = false; HX.cineDone = true; }
    return;
  }
  if (!st) {
    st = document.createElement('div'); st.id = 'hStage'; st.className = 'hstage';
    st.innerHTML = `<div class="hstagebox" id="hStageBox"></div><div class="hstageload" id="hStageLoad">جاري تجهيز البيت…</div><button type="button" class="btn hcustb" id="hCustB">🎭 صمّم شخصيتك</button><button type="button" class="hreplay" id="hReplay" title="شوف المقدمة">🎬</button><button type="button" class="hreplay hvolb" id="hVolL" title="الصوت">🔊</button><div class="hvolp" id="hVolLP" hidden></div>`;
    const l = $('#lobby'); l.insertBefore(st, l.querySelector('.ticket').nextSibling);
    $('#hCustB').onclick = () => hCust();
    $('#hReplay').onclick = () => { hxStop(); hCine(() => hauntLobby('lobby')); };
    $('#hVolL').onclick = () => hVolPanel($('#hVolLP'));
  }
  st.hidden = false;
  hLibs().then(() => {
    if (!S || S.game !== 'haunt' || S.phase !== 'lobby') return;
    if (!HX.scene) hxBuild();
    $('#hStageLoad').hidden = true;
    // أول مرة بالجلسة: المقدمة، وبعدها مصمم الشخصية لو ما عندك شكل محفوظ
    let seen = false; try { seen = sessionStorage.getItem('tarteeb-hcine') === '1'; } catch {}
    const mine = hxLook();
    const me = S.players.find(p => p.id === S.me);
    if (mine && me && JSON.stringify(me.lk) !== JSON.stringify(HU.HC.cleanLook(mine)) && !HX.sentLook) { HX.sentLook = 1; send({ t: 'look', v: HU.HC.cleanLook(mine) }); setTimeout(() => { HX.sentLook = 0; }, 1500); }
    if (!seen && !HX.cineRunning) { HX.cineRunning = true; try { sessionStorage.setItem('tarteeb-hcine', '1'); } catch {} hCine(() => { HX.cineRunning = false; if (!hxLook() && !S.spec) hCust(); else hauntLobby('lobby'); }); return; }
    if (HX.mode === 'cine' || HX.mode === 'cust') return;
    hxStage(S.players);
    if (HX.mode !== 'lobby' || HX.box !== $('#hStageBox')) hxStart('lobby', $('#hStageBox'));
  });
}

// ---------- مصمم الشخصية ----------
function hCust() {
  const HC = HU.HC; if (!HC || !HU.charsOk) return;
  const T = HU.T;
  HX.look = HC.cleanLook(hxLook() || Object.assign({}, HC.DEFAULT_LOOK, { b: Math.random() < .5 ? 0 : 1, c1: Math.random() * 12 | 0 }));
  let el = $('#hCust');
  if (!el) { el = document.createElement('div'); el.id = 'hCust'; el.className = 'hcust'; document.body.appendChild(el); }
  el.innerHTML = `<div class="hcustv"><div class="hcustbox" id="hCustBox"></div><div class="hcusthint">اسحب عشان تلفّه ↔</div></div>
    <div class="hcustp"><h2>صمّم شخصيتك</h2><div class="hctabs"><button type="button" class="hctab on" data-t="s">🔦 الناجي</button><button type="button" class="hctab" data-t="m">👹 الوحش</button></div><div id="hCustOpts"></div>
    <div class="hcustbtns"><button type="button" class="btn" id="hRand">🎲 عشوائي</button><button type="button" class="btn green" id="hDone">✓ تمام</button></div></div>`;
  el.hidden = false; document.body.classList.add('hcine-on');
  if (!HX.cscene) {
    const s = HX.cscene = new T.Scene(); s.background = new T.Color(0x0d0b14); s.fog = new T.Fog(0x0d0b14, 4, 12);
    const fl = new T.Mesh(new T.CircleGeometry(1.1, 40), new T.MeshLambertMaterial({ color: 0x2a2433 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; s.add(fl);
    const ring = new T.Mesh(new T.RingGeometry(1.08, 1.16, 48), new T.MeshBasicMaterial({ color: 0xffc928 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .005; s.add(ring);
    s.add(new T.HemisphereLight(0xaab4ff, 0x302020, 1.3));
    const sp = new T.SpotLight(0xfff1d6, 60, 12, .5, .5, 1.2); sp.position.set(1.2, 4.5, 2.5); sp.castShadow = HU.shadows; s.add(sp);
    const rim = new T.DirectionalLight(0xff5a3a, 1.6); rim.position.set(-2, 2, -3); s.add(rim);
    HX.ccam = new T.PerspectiveCamera(32, 1, .1, 50); HX.ccam.position.set(0, 1.2, 4.6); HX.ccam.lookAt(0, .95, 0);
    HX.dust = new T.Points(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute([...Array(240)].map((_, i) => i % 3 === 1 ? Math.random() * 3 : (Math.random() - .5) * 4), 3)), new T.PointsMaterial({ color: 0xfff1d6, size: .015, transparent: true, opacity: .6 }));
    s.add(HX.dust);
  }
  HX.rot = .4; HX.cust = null; HX.ctab = 's';
  $$('.hctab').forEach(t => t.onclick = () => { HX.ctab = t.dataset.t; $$('.hctab').forEach(x => x.classList.toggle('on', x === t)); hCustDraw(true); hui('ui_click'); });
  const box = $('#hCustBox');
  box.onpointerdown = e => { HX.drag = e.clientX; box.setPointerCapture(e.pointerId); };
  box.onpointermove = e => { if (HX.drag != null) { HX.rot += (e.clientX - HX.drag) * .012; HX.drag = e.clientX; } };
  box.onpointerup = box.onpointercancel = () => { HX.drag = null; };
  $('#hRand').onclick = () => { const r = n => Math.random() * n | 0, L = HX.look; if (HX.ctab === 'm') Object.assign(L, { mf: r(HC.MFORMS.length), ms: r(HC.MSKINS.length), me: r(HC.MEYES.length), mt: r(HC.MTALL.length) }); else Object.assign(L, { b: r(2), s: r(4), h: 1 + r(5), hc: r(8), o: r(HC.OUTFITS.length), c1: r(12), c2: r(12), bd: Math.random() < .4 ? 1 : 0 }); HX.look = HC.cleanLook(L); hCustDraw(true); hui('ui_ok'); };
  $('#hDone').onclick = () => {
    hxSaveLook(HX.look); send({ t: 'look', v: HX.look }); hui('ui_ok');
    if (HX.cust) HX.cust.play(HX.cust.ghost ? 'Zombie_Scratch' : 'Dance_Loop', .2);
    setTimeout(() => { el.hidden = true; document.body.classList.remove('hcine-on'); hxStop(); if (HX.cust) { HX.cscene.remove(HX.cust.root); HX.cust = null; } hauntLobby(S && S.phase === 'lobby' ? 'lobby' : ''); }, 900);
  };
  hCustDraw(true);
  hxStart('cust', box);
}
function hCustDraw(rebuild) {
  const HC = HU.HC, L = HX.look, O = HC.OUTFITS[L.o], mon = HX.ctab === 'm';
  const row = (title, key, items, kind) => `<div class="hcrow"><b>${title}</b><div class="hcchips">${items.map((it, i) => kind === 'sw' ? `<button type="button" class="hcsw${L[key] === i ? ' on' : ''}" data-k="${key}" data-v="${i}" style="--c:${it}"></button>` : `<button type="button" class="hcchip${L[key] === i ? ' on' : ''}" data-k="${key}" data-v="${i}">${it}</button>`).join('')}</div></div>`;
  $('#hCustOpts').innerHTML = mon
    ? `<p class="hcnote">لو طلعت أنت الوحش باللعبة، بتطلع بهالشكل</p>` + row('الشكل', 'mf', HC.MFORMS) + row('الجلد', 'ms', HC.MSKINS.map(x => x[1]), 'sw') + row('العيون', 'me', HC.MEYES.map(x => x[0])) + row('الطول', 'mt', HC.MTALL.map(x => x[0]))
    : row('الجسم', 'b', HC.BODIES) + row('البشرة', 's', HC.SKINS, 'sw') + row('اللبس', 'o', HC.OUTFITS.map(o => o.n))
      + (O.hood ? '' : row('الشعر', 'h', HC.HAIRS.map(h => h.n))) + row('لون الشعر', 'hc', HC.HAIRC, 'sw') + (L.b === 0 ? row('اللحية', 'bd', ['بدون', 'لحية']) : '')
      + (O.m ? '' : row(O.long ? 'لون الثوب' : 'لون البلوزة', 'c1', HC.PAL, 'sw') + (O.long ? '' : row('لون البنطلون', 'c2', HC.PAL, 'sw')));
  $$('#hCustOpts button').forEach(b => b.onclick = () => { HX.look[b.dataset.k] = +b.dataset.v; hCustDraw(true); hui('ui_click'); });
  if (rebuild) {
    if (HX.cust) HX.cscene.remove(HX.cust.root);
    const ch = HX.cust = HC.makeChar(HX.look, mon); HX.cscene.add(ch.root); ch.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    if (ch.ready) ch.ready.then(() => ch.root.traverse(o => { if (o.isMesh) o.castShadow = true; }));
    ch.play(mon ? (Math.random() < .5 ? 'Zombie_Idle_Loop' : 'Zombie_Scratch') : ['Idle_Loop', 'Idle_Torch_Loop', 'Idle_Lantern_Loop'][Math.random() * 3 | 0], 0);
    HX.pop = performance.now();
    HX.cscene.background.set(mon ? 0x140606 : 0x0d0b14); HX.cscene.fog.color.set(mon ? 0x140606 : 0x0d0b14);
  }
}
function hxCustFrame(t, dt) {
  const c = HX.cust; if (!c) return;
  if (HX.drag == null) HX.rot += dt * .25;
  c.root.rotation.y = HX.rot;
  const k = Math.min(1, (t - HX.pop) / 260); c.base = c.base || c.root.scale.x; c.root.scale.setScalar(c.base * (c.ghost ? .82 : .92) * (1 + Math.sin(k * Math.PI) * .06));
  c.update(dt);
  const p = HX.dust.geometry.attributes.position; for (let i = 1; i < p.array.length; i += 3) { p.array[i] += dt * .05; if (p.array[i] > 3) p.array[i] = 0; } p.needsUpdate = true;
}
