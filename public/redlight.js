// ================= إشارة حمرا خضرا — شارع ثري دي بشخصيات حقيقية =================
// نستخدم نفس محرك الشخصيات حق البيت المسكون (haunt-chars.js + Three.js من vendor)، وينحمل بس لما تفتح اللعبة.
const RL = { T: null, HC: null, libs: null, built: false, scene: null, cam: null, ren: null, chars: {}, P: {}, light: 'r', run: false, raf: 0, clock: null, lamps: null, glow: null, endT: 0, lastLight: '', cam0: null, keyRun: false, padRun: false, btnRun: false, sz: '' };
const RLZ = 0.72, RLLEN = 100 * RLZ; // طول الشارع بوحدات العالم
const rlNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const rlHash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
function rlLibs() {
  return RL.libs || (RL.libs = Promise.all([import('./vendor/three.module.min.js'), import('./haunt-chars.js')]).then(async ([T, HC]) => {
    RL.T = T; RL.HC = HC; await HC.load(); return true;
  }));
}
// شكل اللاعب: اللي اختاره بالبيت المسكون، أو شكل ثابت من اسمه
function rlLook(p) {
  if (p && p.lk) return p.lk;
  const h = rlHash(p ? p.id + p.name : 'x'), HC = RL.HC;
  return HC.cleanLook({ b: h % 2, s: (h >> 2) % HC.SKINS.length, h: 1 + (h >> 4) % (HC.HAIRS.length - 1), hc: (h >> 7) % HC.HAIRC.length, o: 4 + (h >> 10) % 3, c1: (h >> 12) % HC.PAL.length, c2: (h >> 16) % HC.PAL.length, bd: (h >> 20) % 3 === 0 ? 1 : 0 });
}
function rlCanvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new RL.T.CanvasTexture(c); t.colorSpace = RL.T.SRGBColorSpace; return t; }
function rlBuildWorld() {
  const T = RL.T, sc = RL.scene = new T.Scene();
  sc.background = rlCanvasTex(16, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1236'); g.addColorStop(.45, '#7a2f5c'); g.addColorStop(.7, '#ff7a59'); g.addColorStop(1, '#ffb36b'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  sc.fog = new T.Fog(0x4a2140, 40, 150);
  sc.add(new T.HemisphereLight(0xffd2b0, 0x2a2440, 1.5));
  const sun = new T.DirectionalLight(0xffc49a, 1.4); sun.position.set(-20, 30, -10); sc.add(sun);
  const mat = c => new T.MeshLambertMaterial({ color: c });
  // الشارع
  const road = new T.Mesh(new T.PlaneGeometry(20, RLLEN + 90), mat(0x2b2d33)); road.rotation.x = -Math.PI / 2; road.position.z = RLLEN / 2 + 15; sc.add(road);
  for (const s of [-1, 1]) {
    const walk = new T.Mesh(new T.BoxGeometry(5, .3, RLLEN + 90), mat(0x8a8a92)); walk.position.set(s * 12.5, .15, RLLEN / 2 + 15); sc.add(walk);
    const curb = new T.Mesh(new T.BoxGeometry(.4, .35, RLLEN + 90), mat(0xdad6cc)); curb.position.set(s * 10.1, .17, RLLEN / 2 + 15); sc.add(curb);
  }
  // الخط الأصفر بالنص
  const dash = new T.MeshBasicMaterial({ color: 0xffd84d });
  for (let z = -12; z < RLLEN + 55; z += 5) { const d = new T.Mesh(new T.PlaneGeometry(.35, 2.6), dash); d.rotation.x = -Math.PI / 2; d.position.set(0, .02, z); sc.add(d); }
  // خط البداية والنهاية
  const checker = rlCanvasTex(256, 32, (x, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#16130f' : '#fff'; x.fillRect(i * 16, j * 16, 16, 16); } });
  const fin = new T.Mesh(new T.PlaneGeometry(20, 2.4), new T.MeshBasicMaterial({ map: checker })); fin.rotation.x = -Math.PI / 2; fin.position.set(0, .03, RLLEN); sc.add(fin);
  const st = new T.Mesh(new T.PlaneGeometry(20, .5), new T.MeshBasicMaterial({ color: 0xffffff })); st.rotation.x = -Math.PI / 2; st.position.set(0, .03, .4); sc.add(st);
  // المباني على الجنبين بشبابيك منوّرة
  const winTex = rlCanvasTex(128, 256, (x, w, h) => { x.fillStyle = '#1a1236'; x.fillRect(0, 0, w, h); for (let j = 0; j < 12; j++) for (let i = 0; i < 4; i++) { x.fillStyle = Math.random() < .45 ? ['#ffd27a', '#ffe9b0', '#ff9f5a'][Math.random() * 3 | 0] : '#2a2050'; x.fillRect(10 + i * 30, 10 + j * 20, 18, 12); } });
  winTex.wrapS = winTex.wrapT = T.RepeatWrapping;
  for (const s of [-1, 1]) for (let z = -16; z < RLLEN + 60; z += 9 + Math.random() * 5) {
    const w = 6 + Math.random() * 4, h = 10 + Math.random() * 26, d = 7 + Math.random() * 3;
    const t = winTex.clone(); t.needsUpdate = true; t.repeat.set(w / 6, h / 12);
    const b = new T.Mesh(new T.BoxGeometry(w, h, d), [new T.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .55 }), new T.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .55 }), mat(0x241a48), mat(0x241a48), new T.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .55 }), new T.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .55 })]);
    b.position.set(s * (16 + w / 2 + Math.random() * 2), h / 2, z); sc.add(b);
  }
  // أعمدة إنارة
  const lampM = new T.MeshBasicMaterial({ color: 0xfff1c4 });
  for (let z = 4; z < RLLEN + 30; z += 14) for (const s of [-1, 1]) {
    const pole = new T.Mesh(new T.CylinderGeometry(.12, .15, 6.5, 6), mat(0x333340)); pole.position.set(s * 10.8, 3.25, z); sc.add(pole);
    const arm = new T.Mesh(new T.BoxGeometry(1.6, .12, .12), mat(0x333340)); arm.position.set(s * 10.1, 6.4, z); sc.add(arm);
    const bulb = new T.Mesh(new T.SphereGeometry(.28, 10, 8), lampM); bulb.position.set(s * 9.4, 6.25, z); sc.add(bulb);
  }
  // الإشارة الكبيرة عند خط النهاية
  const sig = new T.Group(); sig.position.set(0, 0, RLLEN + 7); sc.add(sig);
  const pole = new T.Mesh(new T.CylinderGeometry(.35, .4, 8, 10), mat(0x22222a)); pole.position.y = 4; sig.add(pole);
  const box = new T.Mesh(new T.BoxGeometry(3.4, 8.6, 1.6), mat(0x1c1c22)); box.position.y = 12.2; sig.add(box);
  const cols = [0xff3b30, 0xffc928, 0x30ff6a], lamps = [];
  cols.forEach((c, i) => {
    const m = new T.MeshBasicMaterial({ color: c }); const l = new T.Mesh(new T.CircleGeometry(1.15, 24), m);
    l.position.set(0, 14.8 - i * 2.6, -.82); l.rotation.y = Math.PI; sig.add(l); lamps.push(m);
    const visor = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, .8, 16, 1, true, 0, Math.PI), mat(0x111116)); visor.rotation.x = Math.PI / 2; visor.rotation.y = Math.PI; visor.position.set(0, 15 - i * 2.6, -1.2); sig.add(visor);
  });
  RL.lamps = lamps; RL.lampCols = cols.map(c => new T.Color(c));
  // ضو ملوّن يلوّن الشارع بلون الإشارة
  RL.glow = new T.PointLight(0xff3b30, 60, 70, 1.6); RL.glow.position.set(0, 12, RLLEN + 2); sc.add(RL.glow);
}
function rlInit(stage) {
  const T = RL.T, cv = stage.querySelector('#rlCv');
  RL.ren = new T.WebGLRenderer({ canvas: cv, antialias: !matchMedia('(pointer:coarse)').matches, powerPreference: 'high-performance' });
  RL.ren.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer:coarse)').matches ? 1.25 : 1.5));
  RL.ren.outputColorSpace = T.SRGBColorSpace;
  RL.cam = new T.PerspectiveCamera(58, 16 / 9, .1, 400); RL.cam.position.set(0, 9, -14); RL.cam.lookAt(0, 1, 20);
  RL.clock = new T.Clock(); rlBuildWorld(); RL.chars = {}; RL.built = true;
}
function rlTag(name, me) {
  return rlCanvasTex(256, 64, (x, w, h) => { x.font = '900 34px Tajawal, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; const tw = Math.min(w - 8, x.measureText(name).width + 28); x.fillStyle = me ? '#ffc928' : 'rgba(22,19,15,.75)'; x.beginPath(); x.roundRect((w - tw) / 2, 8, tw, 48, 24); x.fill(); x.fillStyle = me ? '#16130f' : '#fff'; x.fillText(name, w / 2, 33); });
}
function rlSyncChars() {
  const T = RL.T, g = S.g; if (!RL.built || !g || !g.ids) return;
  const ids = g.ids, keep = new Set(ids);
  for (const id in RL.chars) if (!keep.has(id)) { RL.scene.remove(RL.chars[id].g); delete RL.chars[id]; }
  ids.forEach((id, i) => {
    if (RL.chars[id]) { RL.chars[id].i = i; return; }
    const p = S.players.find(q => q.id === id), ch = RL.HC.makeChar(rlLook(p)), grp = new T.Group();
    grp.add(ch.root); ch.root.scale.setScalar(1.15); ch.root.rotation.y = Math.PI;
    const tag = new T.Sprite(new T.SpriteMaterial({ map: rlTag(p ? p.name : '؟', id === S.me), depthTest: false, transparent: true }));
    tag.scale.set(2.6, .65, 1); tag.position.y = 2.65; tag.renderOrder = 9; grp.add(tag);
    if (id === S.me) { const ring = new T.Mesh(new T.RingGeometry(.55, .8, 28), new T.MeshBasicMaterial({ color: 0xffc928, transparent: true, opacity: .9 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; grp.add(ring); }
    RL.scene.add(grp);
    RL.chars[id] = { g: grp, ch, i, z: 0, st: '' };
  });
}
function rlLane(i, n) { const per = Math.min(14, Math.max(1, n)); const row = Math.floor(i / per), col = i % per; return { x: (col - (per - 1) / 2) * Math.min(1.3, 17 / per), row }; }
function rlFrame() {
  RL.raf = 0;
  const cv = document.getElementById('rlCv'); if (!cv || !RL.built || !S || S.game !== 'redlight') return;
  RL.raf = requestAnimationFrame(rlFrame);
  const T = RL.T, dt = Math.min(.05, RL.clock.getDelta()), g = S.g, n = (g && g.ids || []).length;
  // المقاس
  const st = cv.parentNode, w = st.clientWidth, h = st.clientHeight, k = w + 'x' + h;
  if (k !== RL.sz && w && h) { RL.sz = k; RL.ren.setSize(w, h, false); RL.cam.aspect = w / h; RL.cam.fov = w / h < 1 ? 72 : 58; RL.cam.updateProjectionMatrix(); }
  // الإشارة
  const li = { r: 0, y: 1, g: 2 }[RL.light] ?? 0;
  RL.lamps.forEach((m, i) => m.color.copy(RL.lampCols[i]).multiplyScalar(i === li ? 1.25 : .12));
  RL.glow.color.copy(RL.lampCols[li]); RL.glow.intensity = 40 + Math.sin(performance.now() / 120) * (RL.light === 'y' ? 25 : 4);
  // اللاعبين
  let me = null, sumZ = 0, cnt = 0, minZ = 1e9;
  for (const id in RL.chars) {
    const c = RL.chars[id], P = RL.P[id] || [id, 0, 0], ln = rlLane(c.i, n);
    const tz = P[1] * RLZ + (1 - P[1] / 100) * (-ln.row * 1.7);
    c.z += (tz - c.z) * Math.min(1, dt * 8);
    c.g.position.set(ln.x, 0, c.z);
    const dead = P[2] & 1, fin = P[2] & 2, run = P[2] & 4;
    const want = dead ? 'Death01' : fin ? 'Dance_Loop' : run ? 'Sprint_Loop' : 'Idle_Loop';
    if (c.st !== want) { c.st = want; c.ch.play(want, .15, want === 'Sprint_Loop' ? 1.1 : 1); }
    c.ch.update(dt);
    if (!dead) { sumZ += c.z; cnt++; minZ = Math.min(minZ, c.z); }
    if (id === S.me) me = c;
  }
  // الكاميرا: ورا لاعبك، أو منظر عام لو تتفرج
  const meP = RL.P[S.me], alive = me && meP && !(meP[2] & 1) && !(meP[2] & 2);
  const cp = new T.Vector3(), lk = new T.Vector3();
  if (alive) { cp.set(me.g.position.x * .55, 4.4, me.z - 7.8); lk.set(me.g.position.x * .3, 1.4, me.z + 12); }
  else { const az = cnt ? sumZ / cnt : 0; cp.set(0, 13, Math.max(-16, (cnt ? minZ : 0) - 15)); lk.set(0, 0, az + 14); }
  if (!RL.cam0) RL.cam0 = { p: cp.clone(), l: lk.clone() };
  RL.cam0.p.lerp(cp, Math.min(1, dt * 3)); RL.cam0.l.lerp(lk, Math.min(1, dt * 3));
  RL.cam.position.copy(RL.cam0.p); RL.cam.lookAt(RL.cam0.l);
  RL.ren.render(RL.scene, RL.cam);
}
// التحكم: اضغط مطوّل تركض
function rlSetRun() {
  const on = !!(RL.keyRun || RL.btnRun || RL.padRun);
  if (on === RL.run) return; RL.run = on; send({ t: 'rl', on });
  const b = document.getElementById('rlRun'); if (b) b.classList.toggle('on', on);
}
addEventListener('keydown', e => {
  if (!S || S.game !== 'redlight' || S.phase !== 'play' || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === 'ص') { e.preventDefault(); if (!RL.keyRun) { RL.keyRun = true; rlSetRun(); } }
});
addEventListener('keyup', e => { if (!S || S.game !== 'redlight') return; if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === 'ص') { RL.keyRun = false; rlSetRun(); } });
addEventListener('blur', () => { if (RL.run) { RL.keyRun = RL.btnRun = false; rlSetRun(); } });
function rlBanner(html, cls, ms) {
  const b = document.getElementById('rlBan'); if (!b) return;
  b.className = 'rlban ' + (cls || ''); b.innerHTML = html; void b.offsetWidth; b.classList.add('show');
  clearTimeout(rlBanner.t); if (ms) rlBanner.t = setTimeout(() => b.classList.remove('show'), ms);
}
function rlFeed(txt) {
  const f = document.getElementById('rlFeed'); if (!f) return;
  const el = document.createElement('div'); el.textContent = txt; f.prepend(el);
  while (f.children.length > 5) f.lastChild.remove(); setTimeout(() => el.classList.add('old'), 3500);
}
window.net_redlight = m => {
  if (!S || S.game !== 'redlight') return;
  if (m.k === 'st') {
    (m.P || []).forEach(p => { RL.P[p[0]] = p; });
    if (m.L && m.L !== RL.light) {
      RL.light = m.L;
      if (m.sub === 'race') {
        if (m.L === 'g') { rlBanner('🟢 اركض!', 'g', 1300); sfx('chime'); }
        else if (m.L === 'y') { rlBanner('🟡 انتبه…', 'y', 900); sfx('gclick'); }
        else { rlBanner('🔴 ثبّت مكانك!', 'r', 1600); sfx('thud'); }
      }
    }
    if (m.sub === 'race') RL.endT = performance.now() + (m.left || 0);
    (m.ev || []).forEach(e => {
      const nmE = pn(e.id);
      if (e.k === 'dead') { rlFeed(e.why === 'red' ? `💀 ${nmE} تحرّك بالأحمر` : `⏱ ${nmE} ما وصل`); sfx(e.id === S.me ? 'lose' : 'bang', { gain: e.id === S.me ? 1 : .5 }); if (e.id === S.me) { RL.keyRun = RL.btnRun = RL.padRun = false; rlSetRun(); rlBanner('💀 طلعت!', 'r', 2200); } }
      if (e.k === 'fin') { rlFeed(`🏁 ${nmE} وصل ${e.n === 1 ? 'الأول' : rlNum(e.n)}`); if (e.id === S.me) { sfx('win'); rlBanner('🏁 نجيت!', 'g', 2000); } }
    });
    rlHud();
  } else if (m.k === 'res') {
    const r = m.res || {}; rlBanner(`🏁 نجا ${rlNum((r.surv || []).length)}<small>💀 طلع ${rlNum((r.dead || []).length)}</small>`, 'res', 4500);
  }
};
function rlHud() {
  const g = S.g; if (!g) return;
  const ids = g.ids || [], alive = ids.filter(id => !((RL.P[id] || [0, 0, 0])[2] & 1)).length, fin = ids.filter(id => (RL.P[id] || [0, 0, 0])[2] & 2).length;
  const a = document.getElementById('rlAlive'); if (a) a.innerHTML = `👥 ${rlNum(alive)} من ${rlNum(ids.length)} · 🏁 ${rlNum(fin)}`;
  const meP = RL.P[S.me], b = document.getElementById('rlRun');
  if (b) { const can = g.sub === 'race' && meP && !(meP[2] & 3) && S.phase === 'play'; b.disabled = !can; b.hidden = !ids.includes(S.me) || !!(meP && meP[2] & 3) || S.phase !== 'play'; }
  const pr = document.getElementById('rlProg'); if (pr && meP) pr.style.width = meP[1] + '%';
}
function renderRedlight(body) {
  const g = S.g, over = S.phase === 'over';
  if (body.dataset.built !== 'redlight' || !document.getElementById('rlCv')) {
    body.dataset.built = 'redlight'; RL.built = false; RL.sz = ''; RL.cam0 = null; RL.P = {}; RL.light = 'r';
    body.innerHTML = `<div class="rlw"><div class="rlstage" id="rlStage"><canvas id="rlCv"></canvas>
      <div class="rlload" id="rlLoad"><b>🚦</b>نجهّز الشارع والشخصيات…</div>
      <div class="rltop"><span class="rlpill" id="rlRace"></span><span class="rlclock" id="rlClock">--</span><span class="rlpill" id="rlAlive"></span></div>
      <div class="rlprog"><i id="rlProg"></i><span>🏁</span></div>
      <div class="rlban" id="rlBan"></div><div class="rlfeed" id="rlFeed"></div>
      <button type="button" class="rlrun" id="rlRun">🏃 اضغط مطوّل تركض<small>أو مسافة / ↑</small></button></div>${logHtml()}</div>`;
    const b = document.getElementById('rlRun');
    const dn = e => { e.preventDefault(); if (b.disabled) return; try { b.setPointerCapture(e.pointerId); } catch {} RL.btnRun = true; rlSetRun(); };
    const up = () => { RL.btnRun = false; rlSetRun(); };
    b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
    rlLibs().then(() => {
      const st = document.getElementById('rlStage'); if (!st) return;
      rlInit(st); rlSyncChars(); document.getElementById('rlLoad').hidden = true;
      if (!RL.raf) RL.raf = requestAnimationFrame(rlFrame);
    }).catch(e => { console.error(e); const l = document.getElementById('rlLoad'); if (l) l.innerHTML = '<b>⚠️</b>ما قدرنا نحمّل الثري دي على جهازك'; });
  }
  if (RL.built) { rlSyncChars(); if (!RL.raf) RL.raf = requestAnimationFrame(rlFrame); }
  if (g.light && g.sub !== 'race') RL.light = g.light;
  document.getElementById('rlRace').innerHTML = over ? '🏆 انتهت' : `السباق ${rlNum(g.race)} من ${rlNum(g.max)}`;
  if (g.sub === 'intro' && !over) { const k = 'i' + g.race; if (RL.introK !== k) { RL.introK = k; rlBanner(`🚦 السباق ${rlNum(g.race)}<small>${rlNum((g.ids || []).length)} لاعب · اركض بالأخضر وثبّت بالأحمر</small>`, 'intro', 3800); sfx('whistle'); RL.P = {}; } }
  if (over) rlBanner(`👑 ${esc(S.winner || '')}<small>آخر واحد واقف</small>`, 'res');
  RL.endT = g.sub === 'race' ? performance.now() + g.left : 0;
  if (!RL.tm) RL.tm = setInterval(() => {
    const c = document.getElementById('rlClock'); if (!c) { clearInterval(RL.tm); RL.tm = 0; return; }
    const left = RL.endT ? Math.max(0, RL.endT - performance.now()) : 0;
    c.textContent = RL.endT ? rlNum(Math.ceil(left / 1000)) : '--'; c.classList.toggle('low', !!RL.endT && left < 10000);
  }, 100);
  rlHud();
}
