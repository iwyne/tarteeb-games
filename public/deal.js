// ================= ترتيب ديل — طاولة خشب ثري دي بمعالم سعودية =================
const DL = { T: null, L3: null, libs: null, built: false, scene: null, cam: null, ren: null, raf: 0, clock: null, sz: '', tex: {}, zones: {}, lm: {}, fly: [], beams: [], focus: null, camT: null, sig: '', fxn: 0, lite: false, ghosts: {}, deckG: null, discM: null, rain: null, notes: {}, seen: {}, tutDone: {}, sel: null, drag: null, lp: 0, tmr: 0, cur: null };
const DLV = 1; // غيّره لو تغيرت صور البطايق
const dlNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const DSETS = {
  bisha: ['بيشة', '#7a4a24', 2], taif: ['الطائف', '#c2185b', 2], hail: ['حائل', '#8d6e63', 3], qassim: ['القصيم', '#a1887f', 3], hofuf: ['الهفوف', '#e07a1f', 3], jazan: ['جازان', '#00838f', 3],
  durrah: ['الدرّة', '#26a69a', 3], tabuk: ['تبوك', '#5c6bc0', 3], abha: ['أبها', '#1f8f52', 3], khobar: ['الخبر', '#1c5fd0', 3], ula: ['العُلا', '#c4560f', 3], jeddah: ['جدة', '#0d47a1', 3],
  diriyah: ['الدرعية', '#8a5a2b', 2], riyadh: ['الرياض', '#c62828', 2], train: ['قطار سار', '#37474f', 4], util: ['الخدمات', '#607d8b', 2]
};
const DACTS = {
  big: ['الصفقة الكبرى', 'اسحب مجموعة كاملة من خصم', 5], take: ['خذها', 'اسحب أرض وحدة (مو من مجموعة كاملة) من خصم', 3], swap: ['بدّل', 'بدّل أرض من عندك بأرض خصم', 3],
  no: ['لا شكراً', 'تلغي أي حركة تنلعب عليك (تنلعب وقت الرد بس)', 4], debt: ['دَين', 'خصم واحد يدفع لك ٥ مليون', 3], eid: ['عيدية', 'الكل يعطيك ٢ مليون', 2],
  draw: ['اسحب ورقتين', 'تسحب ورقتين زيادة', 1], double: ['دبّل الإيجار', 'تنلعب مع ورقة الإيجار وتضاعفه (تاخذ حركة)', 1], rent: ['إيجار', 'الكل يدفع لك إيجار مدينة من مدنك', 1],
  house: ['ملحق', 'على مجموعة كاملة: الإيجار +٣', 3], tower: ['برج', 'فوق الملحق: الإيجار +٤', 4], wasta: ['واسطة', 'تاخذ ورقة عشوائية من يد خصم', 3],
  faz: ['فزعة', 'كل لاعب يعطيك ورقة يختارها', 3], saher: ['ساهر', 'خصم يدفع مخالفة ٣ مليون', 3]
};
const DLCOL = ['#2fbf6a', '#7b3fc7', '#1c5fd0', '#c4560f', '#c2185b', '#00838f'];
const DTARGET = ['big', 'take', 'swap', 'debt', 'saher', 'wasta'];
const dlImg = c => !c ? 'back' : c.k === 'land' ? 'land_' + c.s : c.k === 'wild' ? 'wild' : c.k === 'money' ? 'money_' + c.v : 'act_' + c.a;
const dlSrc = n => `deal/${n}.webp?v=${DLV}`;
const dlVal = c => c.k === 'money' ? c.v : c.k === 'act' ? DACTS[c.a][2] : c.k === 'land' ? ({ bisha: 1, taif: 1, hail: 2, qassim: 2, hofuf: 2, jazan: 2, durrah: 3, tabuk: 3, abha: 3, khobar: 3, ula: 4, jeddah: 4, diriyah: 4, riyadh: 4, train: 2, util: 2 })[c.s] : 0;
const dlName = c => !c ? '' : c.k === 'land' ? DSETS[c.s][0] : c.k === 'wild' ? 'أرض جوكر' : c.k === 'money' ? dlNum(c.v) + ' مليون' : DACTS[c.a][0];
const dlSetOf = c => c.k === 'wild' ? c.as : c.s;
function dlP(id) { return (S.g.players || []).find(p => p.id === id); }
function dlPl(id) { return S.players.find(p => p.id === id) || { name: '؟' }; }
function dlCol(id) { const i = (S.g.players || []).findIndex(p => p.id === id); return DLCOL[(i < 0 ? 0 : i) % DLCOL.length]; }
const dlInit = id => esc([...String(dlPl(id).name).trim()][0] || '؟');
const dlAv = (id, sz = 40) => `<span class="dav" style="width:${sz}px;height:${sz}px;font-size:${sz * .5}px;background:${dlCol(id)}">${dlInit(id)}</span>`;
function dlMe() { return S.g && !S.g.spec ? dlP(S.me) : null; }
function dlSnd(n) { try { sfx(n); } catch {} }

// ============ تحميل المكتبات ============
function dlLibs() {
  return DL.libs || (DL.libs = Promise.all([import('./vendor/three.module.min.js'), import('./deal3d.js')]).then(([T, L3]) => { DL.T = T; DL.L3mod = L3; return true; }));
}
function dlTex(n) {
  if (DL.tex[n]) return DL.tex[n];
  const t = new DL.T.TextureLoader().load(dlSrc(n)); t.colorSpace = DL.T.SRGBColorSpace; t.anisotropy = 4; return DL.tex[n] = t;
}
function dlCanvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new DL.T.CanvasTexture(c); t.colorSpace = DL.T.SRGBColorSpace; return t; }

// ============ بناء المشهد ============
function dlWorld() {
  const T = DL.T, sc = DL.scene = new T.Scene(), lite = DL.lite;
  sc.background = new T.Color(0x140d08); sc.fog = new T.Fog(0x140d08, 26, 46);
  sc.add(new T.HemisphereLight(0xffe2b8, 0x2a170b, lite ? 1.6 : .9));
  const sun = new T.DirectionalLight(0xffd9a0, lite ? 1.4 : 2.2); sun.position.set(-5, 14, 7);
  if (!lite) { sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13 }); }
  sc.add(sun);
  if (!lite) { const lamp = new T.PointLight(0xffb060, 40, 18); lamp.position.set(0, 7, 0); sc.add(lamp);
    const env = new T.Scene(); env.add(new T.Mesh(new T.SphereGeometry(20, 24, 12), new T.MeshBasicMaterial({ color: 0xffd9a8, side: T.BackSide }))); const sky = new T.Mesh(new T.PlaneGeometry(14, 14), new T.MeshBasicMaterial({ color: 0xffffff, side: 2 })); sky.rotation.x = Math.PI / 2; sky.position.y = 12; env.add(sky);
    const pm = new T.PMREMGenerator(DL.ren); sc.environment = pm.fromScene(env, .04).texture; }
  const wood = dlCanvasTex(1024, 1024, (g) => { g.fillStyle = '#7a4422'; g.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${40 + Math.random() * 30 | 0},${18 + Math.random() * 12 | 0},6,${.08 + Math.random() * .18})`; g.lineWidth = 1 + Math.random() * 4; g.beginPath(); let y = Math.random() * 1024; g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x / 140 + i) * 6); g.stroke(); } });
  wood.wrapS = wood.wrapT = T.RepeatWrapping; wood.repeat.set(2, 2);
  const M = (o) => lite ? new T.MeshLambertMaterial(o) : new T.MeshStandardMaterial(Object.assign({ roughness: .55 }, o));
  const top = new T.Mesh(new T.CylinderGeometry(1, 1, .4, 96), M({ map: wood })); DL.tab = [top]; top.scale.set(11, 1, 7.4); top.position.y = -.2; top.receiveShadow = !lite; sc.add(top);
  const rim = new T.Mesh(new T.TorusGeometry(1, .03, 12, 128), lite ? new T.MeshLambertMaterial({ color: 0xd9a24a }) : new T.MeshStandardMaterial({ color: 0xd9a24a, metalness: .9, roughness: .3 })); rim.rotation.x = Math.PI / 2; rim.scale.set(11, 7.4, 1); sc.add(rim); DL.rim = rim;
  const edge = new T.Mesh(new T.CylinderGeometry(1.02, .98, .5, 96), M({ color: 0x2a170b })); edge.scale.set(11, 1, 7.4); edge.position.y = -.45; sc.add(edge); DL.tab.push(edge);
  // مفرش سدو بالنص
  const run = dlCanvasTex(140, 560, (g, w, h) => { for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 24) { g.fillStyle = '#8a1c1c'; g.fillRect(x, y, 24, 16); g.fillStyle = '#f3e2c0'; g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x + 6, y + 2); g.lineTo(x + 12, y + 8); g.lineTo(x + 18, y + 2); g.lineTo(x + 24, y + 8); g.lineTo(x + 18, y + 14); g.lineTo(x + 12, y + 8); g.lineTo(x + 6, y + 14); g.fill(); g.fillStyle = '#16130f'; g.fillRect(x + 7, y + 6, 4, 4); g.fillRect(x + 19, y + 6, 4, 4); } g.strokeStyle = '#f3e2c0'; g.lineWidth = 5; g.strokeRect(0, 0, w, h); });
  const rm = DL.run = new T.Mesh(new T.PlaneGeometry(2.4, 9), M({ map: run, roughness: .9 })); rm.rotation.x = -Math.PI / 2; rm.position.y = .004; rm.receiveShadow = !lite; sc.add(rm);
  DL.L3 = DL.L3mod.makeLandmarks(T, lite);
  DL.cardGeo = new T.BoxGeometry(1.1, .02, 1.56); DL.side = new T.MeshLambertMaterial({ color: 0xf3e2c0 });
  DL.bkMat = new T.MeshLambertMaterial({ map: dlTex('back') });
  // الكومة والمرمي
  DL.deckG = new T.Group(); DL.deckG.position.set(-.8, 0, -.6); sc.add(DL.deckG);
  DL.discM = dlCardMesh(null); DL.discM.position.set(.8, .03, -.6); DL.discM.rotation.y = .12; DL.discM.visible = false; sc.add(DL.discM);
  DL.zoneRoot = new T.Group(); sc.add(DL.zoneRoot);
}
const DLMAT = {};
function dlCardMesh(c) {
  const T = DL.T, n = dlImg(c);
  const face = DLMAT[n] || (DLMAT[n] = new T.MeshLambertMaterial({ map: dlTex(n), transparent: true, alphaTest: .5 }));
  const m = new T.Mesh(DL.cardGeo, [DL.side, DL.side, face, DL.bkMat, DL.side, DL.side]); m.castShadow = !DL.lite; m.receiveShadow = !DL.lite; m.userData.n = n; return m;
}
function dlSprite(text, col = '#f3e2c0', bg = 'rgba(22,19,15,.85)', w = 256) {
  const T = DL.T, t = dlCanvasTex(w, 64, (x, W, Hh) => { x.font = '800 30px Tajawal, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; const tw = Math.min(W - 6, x.measureText(text).width + 26); x.fillStyle = bg; x.beginPath(); x.roundRect((W - tw) / 2, 6, tw, 52, 18); x.fill(); x.fillStyle = col; x.fillText(text, W / 2, 33); });
  const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthWrite: false })); s.scale.set(w / 64 * .55, .55, 1); return s;
}
// مكان كل لاعب على الطاولة: أنا تحت، والباقين على القوس البعيد
function dlSeats() {
  const ps = S.g.players.map(p => p.id), me = ps.includes(S.me) ? S.me : null, others = ps.filter(id => id !== me), out = {}, P = DL.portrait;
  if (me) out[me] = P ? { x: 0, z: 4.3, ry: 0, s: .8 } : { x: 0, z: 3.1, ry: 0, s: .9 };
  const n = others.length, arc = me ? Math.PI * (P ? (n > 2 ? 1 : .62) : .74) : Math.PI * 1.2;
  others.forEach((id, i) => {
    const t = n === 1 ? 0 : (i / (n - 1) - .5) * arc;
    const rx = P ? 3.7 : 7.0, rz = P ? 5.4 : 4.3;
    out[id] = { x: Math.sin(t) * rx, z: -Math.cos(t) * rz + (me ? 0 : 1), ry: -t * .45, s: P ? (n > 2 ? .48 : .6) : (n > 3 ? .5 : .62) };
  });
  return out;
}
function dlSyncTable() {
  if (!DL.built || !S.g) return;
  const T = DL.T, g = S.g, seats = dlSeats();
  // الكومة
  const dn = Math.min(14, Math.ceil(g.deck / 6));
  if (DL.deckG.children.length !== dn) { DL.deckG.clear(); for (let i = 0; i < dn; i++) { const m = dlCardMesh(null); m.rotation.x = Math.PI; m.position.y = .02 + i * .022; m.rotation.y = (i % 3 - 1) * .02; DL.deckG.add(m); } }
  if (g.top) { const n = dlImg(g.top); if (DL.discM.userData.n !== n) { const nm = dlCardMesh(g.top); DL.discM.material = nm.material; DL.discM.userData.n = n; } DL.discM.visible = true; } else DL.discM.visible = false;
  for (const p of g.players) dlSyncZone(p, seats[p.id]);
  for (const id of Object.keys(DL.zones)) if (!seats[id]) { DL.zoneRoot.remove(DL.zones[id].g); delete DL.zones[id]; }
  dlGhosts();
}
function dlSyncZone(p, seat) {
  const T = DL.T; if (!seat) return;
  let Z = DL.zones[p.id];
  if (!Z) { Z = DL.zones[p.id] = { g: new T.Group(), sets: {}, bankG: new T.Group(), bankSig: '' }; Z.g.add(Z.bankG); DL.zoneRoot.add(Z.g); }
  Z.g.position.set(seat.x, 0, seat.z); Z.g.rotation.y = seat.ry; Z.g.scale.setScalar(seat.s);
  const keys = Object.keys(p.lands).sort((a, b) => Object.keys(DSETS).indexOf(a) - Object.keys(DSETS).indexOf(b));
  const mine = p.id === S.me, per = mine ? (DL.portrait ? 5 : 8) : DL.portrait ? 3 : (keys.length > 8 ? 5 : 4), W = 1.5;
  const cols = Math.max(1, Math.min(keys.length, per));
  keys.forEach((k, i) => {
    let st = Z.sets[k]; const L = p.lands[k], full = (p.full || []).includes(k), b = p.bld[k] || {};
    const sig = L.map(c => c.id).join(',') + (full ? 'F' : '') + (b.h ? 'h' : '') + (b.t ? 't' : '');
    if (!st) { st = Z.sets[k] = { g: new T.Group(), cards: new T.Group(), lm: null, sig: '', n: 0, full: false }; st.g.add(st.cards); Z.g.add(st.g); }
    const row = Math.floor(i / per), col = i % per, inRow = Math.min(per, keys.length - row * per);
    st.g.position.set((col - (inRow - 1) / 2) * W, 0, .2 + row * (mine ? -3.1 : 3.2));
    if (st.sig !== sig) {
      st.cards.clear(); L.forEach((c, j) => { const m = dlCardMesh(c); m.position.set(0, .02 + j * .024, j * .3); st.cards.add(m); });
      const size = DSETS[k][2], sc = .55 + .4 * Math.min(1, L.length / size);
      if (!st.lm) { st.lm = DL.L3.build(k); st.lm.position.set(0, 0, -1.6); st.g.add(st.lm); st.lm.scale.setScalar(.001); dlRise(st.lm, sc, p.id); }
      else if (Math.abs(st.lm.userData.ts - sc) > .01) dlTween(st.lm, sc);
      st.lm.userData.ts = sc;
      if (full && !st.full) dlCompleteFx(p.id, k, st);
      // ملحق وبرج: مجسمات صغيرة جنب المعلم
      for (const n of ['h', 't']) { const o = st.g.getObjectByName('b' + n); if (b[n] && !o) { const m = n === 'h' ? new T.Mesh(new T.BoxGeometry(.4, .3, .4), new T.MeshLambertMaterial({ color: 0xb98552 })) : new T.Mesh(new T.CylinderGeometry(.08, .16, 1, 8), new T.MeshLambertMaterial({ color: 0x8fb4cf })); m.name = 'b' + n; m.position.set(n === 'h' ? .62 : -.62, n === 'h' ? .15 : .5, -1.2); st.g.add(m); } else if (!b[n] && o) st.g.remove(o); }
      st.full = full; st.sig = sig;
    }
  });
  for (const k of Object.keys(Z.sets)) if (!p.lands[k]) { Z.g.remove(Z.sets[k].g); delete Z.sets[k]; }
  // البنك: رزمة ريالات مفرودة
  const bsig = p.bank.map(c => c.id).join(',');
  if (Z.bankSig !== bsig) {
    Z.bankSig = bsig; Z.bankG.clear();
    const notes = p.bank.map(dlVal).sort((a, b) => a - b).slice(-9);
    Z.bankG.position.set((cols + 1) / 2 * W + .4, 0, .5);
    notes.forEach((v, i) => { const m = new T.Mesh(new T.BoxGeometry(1.2, .012, .6), [DL.side, DL.side, DL.notes[v] || (DL.notes[v] = new T.MeshLambertMaterial({ map: DL.L3mod.noteTex(T, v) })), DL.side, DL.side, DL.side]); m.position.set(0, .02 + i * .014, 0); m.rotation.y = (i - notes.length / 2) * .16; m.castShadow = !DL.lite; Z.bankG.add(m); });
    if (p.bv) { const s = dlSprite(dlNum(p.bv) + ' م', '#ffc928'); s.position.set(0, .9, 0); Z.bankG.add(s); }
  }
}
// ============ حركات ثري دي ============
function dlTween(o, s) { DL.fly.push({ o, a: o.scale.x, b: s, t: 0, d: .5 }); }
function dlRise(o, s, pid) {
  DL.fly.push({ o, a: .001, b: s, t: 0, d: .9, rise: 1 });
  const T = DL.T, ring = new T.Mesh(new T.RingGeometry(.6, 1.4, 40), new T.MeshBasicMaterial({ color: 0xffcf6a, transparent: true, opacity: .5, side: 2, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.copy(o.position); ring.position.y = .03; o.parent.add(ring); DL.beams.push({ o: ring, t: 0, d: 1.2, ring: 1 });
}
function dlCompleteFx(pid, k, st) {
  const T = DL.T, beam = new T.Mesh(new T.CylinderGeometry(.9, 1.1, 9, 24, 1, true), new T.MeshBasicMaterial({ color: 0xffdc78, transparent: true, opacity: 0, side: 2, depthWrite: false, blending: T.AdditiveBlending }));
  beam.position.set(0, 4.5, -1.6); st.g.add(beam); DL.beams.push({ o: beam, t: 0, d: 2.6, beam: 1 });
  if (st.lm) DL.fly.push({ o: st.lm, a: st.lm.scale.x, b: st.lm.scale.x * 1.35, t: 0, d: .6, back: st.lm.scale.x });
}
function dlGhosts() {
  // تنبيه الخطر: طيف الورقة الناقصة فوق أراضي الخصم اللي ناقصه أرض وحدة ويفوز
  const T = DL.T, g = S.g, want = {};
  if (g.sub !== 'over') for (const p of g.players) {
    if (p.id === S.me || (p.full || []).length < g.need - 1) continue;
    for (const [k, L] of Object.entries(p.lands)) if (!(p.full || []).includes(k) && L.length === DSETS[k][2] - 1) { want[p.id + k] = { id: p.id, k }; break; }
  }
  for (const key of Object.keys(DL.ghosts)) if (!want[key]) { const o = DL.ghosts[key]; o.parent && o.parent.remove(o); delete DL.ghosts[key]; }
  for (const [key, w] of Object.entries(want)) {
    if (DL.ghosts[key]) continue; const Z = DL.zones[w.id], st = Z && Z.sets[w.k]; if (!st) continue;
    const grp = new T.Group(), m = new T.Mesh(new T.PlaneGeometry(1.1, 1.56), new T.MeshBasicMaterial({ map: dlTex('land_' + w.k), color: 0xff6060, transparent: true, opacity: .55, side: 2, depthWrite: false }));
    const fr = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1.16, 1.62)), new T.LineBasicMaterial({ color: 0xff3b3b }));
    grp.add(m, fr); grp.position.set(0, 1.9, .2); grp.rotation.x = -.5; grp.userData.ghost = 1;
    const lab = dlSprite(dlPl(w.id).name + ' تنتظر هذي الورقة', '#fff', 'rgba(198,40,40,.95)', 420); lab.position.set(0, -1.05, .1); grp.add(lab);
    st.g.add(grp); DL.ghosts[key] = grp;
    if (!DL.seen['gh' + key]) { DL.seen['gh' + key] = 1; dlSnd('heart'); }
  }
}
function dlCamGoal() {
  const g = S.g, seats = dlSeats(); let pos, look;
  const portrait = !!DL.portrait;
  if (DL.focus && seats[DL.focus]) { const s = seats[DL.focus]; pos = [s.x * .8, 7.5, s.z + (s.z < 0 ? 6.5 : 5)]; look = [s.x, 0, s.z - (s.z < 0 ? .5 : 1)]; }
  else if (g.spec) { pos = [0, portrait ? 24 : 17, portrait ? 11 : 10]; look = [0, 0, -.4]; }
  else if (portrait) { pos = [0, 17.5, 10]; look = [0, 0, .5]; }
  else { pos = [0, 12.5, 12.8]; look = [0, 0, .9]; }
  return { pos, look };
}
function dlShape() {
  const P = DL.portrait, a = P ? 7.6 : 11, b = P ? 11.4 : 7.4;
  for (const m of DL.tab) m.scale.set(a, 1, b); DL.rim.scale.set(a, b, 1); DL.run.scale.set(1, P ? 1.3 : 1, 1);
}
function dlFrame() {
  DL.raf = 0;
  const cv = document.getElementById('dlCv'); if (!cv || !DL.built || !S || S.game !== 'deal') return;
  DL.raf = requestAnimationFrame(dlFrame);
  const T = DL.T, dt = Math.min(.05, DL.clock.getDelta()), now = DL.clock.elapsedTime;
  const st = cv.parentNode, w = st.clientWidth, h = st.clientHeight, k = w + 'x' + h;
  if (k !== DL.sz && w && h) { DL.sz = k; DL.ren.setSize(w, h, false); DL.cam.aspect = w / h; DL.cam.fov = w / h < 1 ? 58 : 40; DL.cam.updateProjectionMatrix(); const P = w / h < .9; if (P !== DL.portrait) { DL.portrait = P; dlShape(); dlSyncTable(); } }
  const goal = dlCamGoal(); if (!DL.camP) { DL.camP = new T.Vector3(...goal.pos); DL.camL = new T.Vector3(...goal.look); }
  DL.camP.lerp(new T.Vector3(...goal.pos), Math.min(1, dt * 3)); DL.camL.lerp(new T.Vector3(...goal.look), Math.min(1, dt * 3));
  // لفة الكاميرا وقت الفوز
  if (S.g && S.g.sub === 'over' && S.g.winner && DL.zones[S.g.winner]) { const z = DL.zones[S.g.winner].g.position, a = now * .35; DL.cam.position.set(z.x + Math.sin(a) * 7, 5.5, z.z + Math.cos(a) * 7); DL.cam.lookAt(z.x, .8, z.z); }
  else { DL.cam.position.copy(DL.camP); DL.cam.lookAt(DL.camL); }
  for (let i = DL.fly.length - 1; i >= 0; i--) {
    const f = DL.fly[i]; f.t += dt; const p = Math.min(1, f.t / f.d), e = f.rise ? 1 - Math.pow(1 - p, 3) * Math.cos(p * 7) * (1 - p) : 1 - Math.pow(1 - p, 3);
    const s = f.a + (f.b - f.a) * (f.rise ? Math.min(1.15, e) : e); f.o.scale.set(s, f.rise ? s * Math.min(1, p * 1.4) + .001 : s, s);
    if (p >= 1) { DL.fly.splice(i, 1); if (f.back) DL.fly.push({ o: f.o, a: f.o.scale.x, b: f.back, t: 0, d: 1.4 }); }
  }
  for (let i = DL.beams.length - 1; i >= 0; i--) {
    const b = DL.beams[i]; b.t += dt; const p = b.t / b.d;
    if (b.beam) b.o.material.opacity = Math.sin(Math.min(1, p) * Math.PI) * .32;
    if (b.ring) { b.o.material.opacity = .5 * (1 - p); b.o.scale.setScalar(1 + p * .8); }
    if (p >= 1) { b.o.parent && b.o.parent.remove(b.o); DL.beams.splice(i, 1); }
  }
  for (const o of Object.values(DL.ghosts)) { o.position.y = 1.9 + Math.sin(now * 2.4) * .12; o.children[0].material.opacity = .4 + Math.sin(now * 5) * .2; }
  if (DL.rain) { const a = DL.rain.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 14; if (y < 0) y += 12; a.setY(i, y); } a.needsUpdate = true; if (now > DL.rainEnd) { DL.scene.remove(DL.rain); DL.rain = null; } }
  DL.ren.render(DL.scene, DL.cam);
}
function dlInitGL(stage) {
  const T = DL.T, cv = stage.querySelector('#dlCv');
  let q = 'full'; try { q = localStorage.getItem('tdeal-q') || (matchMedia('(pointer:coarse)').matches ? 'lite' : 'full'); } catch {}
  DL.lite = q === 'lite';
  DL.ren = new T.WebGLRenderer({ canvas: cv, antialias: !DL.lite, powerPreference: 'high-performance' });
  DL.ren.setPixelRatio(Math.min(devicePixelRatio || 1, DL.lite ? 1.25 : 1.75)); DL.ren.outputColorSpace = T.SRGBColorSpace;
  if (!DL.lite) { DL.ren.shadowMap.enabled = true; DL.ren.shadowMap.type = T.PCFSoftShadowMap; DL.ren.toneMapping = T.ACESFilmicToneMapping; DL.ren.toneMappingExposure = .95; }
  DL.cam = new T.PerspectiveCamera(40, 16 / 9, .1, 100); DL.clock = new T.Clock();
  DL.zones = {}; DL.ghosts = {}; DL.fly = []; DL.beams = []; DL.camP = null;
  dlWorld(); DL.built = true;
}
function dlRainFx() {
  if (!DL.built) return; const T = DL.T, n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 24; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = (Math.random() - .5) * 16; }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  if (DL.rain) DL.scene.remove(DL.rain);
  DL.rain = new T.Points(geo, new T.PointsMaterial({ color: 0xbfe0ff, size: .07, transparent: true, opacity: .7 })); DL.scene.add(DL.rain); DL.rainEnd = DL.clock.elapsedTime + 6;
}

// ============ الواجهة ============
function renderDeal(body) {
  const g = S.g; if (!g) return;
  if (body.dataset.built !== 'deal' || !document.getElementById('dlCv')) {
    body.dataset.built = 'deal'; DL.built = false; DL.sz = ''; DL.focus = null; DL.sig = ''; DL.seen = {}; DL.sel = null;
    try { DL.tutDone = JSON.parse(localStorage.getItem('tdeal-tut') || '{}'); } catch { DL.tutDone = {}; }
    body.innerHTML = `<div class="dlw" id="dlW"><div class="dlstage" id="dlStage"><canvas id="dlCv"></canvas>
      <div class="dlload" id="dlLoad"><b>ترتيب ديل</b>نرتّب الطاولة والمعالم…</div>
      <div class="dltint" id="dlTint"></div>
      <div class="dlops" id="dlOps"></div>
      <div class="dlturn" id="dlTurn"></div>
      <div class="dllog" id="dlLog"></div>
      <div class="dlmine" id="dlMine"></div>
      <div class="dlhand" id="dlHand"></div>
      <div class="dlbar" id="dlBar"></div>
      <div class="dlfx" id="dlFx"></div>
      <div class="dlmod" id="dlMod" hidden></div>
      <div class="dlsheet" id="dlSheet" hidden></div>
      <div class="dlhelp" id="dlHelp" hidden></div>
      <div class="dltut" id="dlTut" hidden></div>
      <div class="dlnews" id="dlNews" hidden></div>
    </div></div>`;
    dlBindHand();
    document.getElementById('dlSheet').addEventListener('click', e => { if (e.target.id === 'dlSheet') dlCloseSheet(); });
    dlLibs().then(() => {
      const st = document.getElementById('dlStage'); if (!st) return;
      dlInitGL(st); dlSyncTable(); document.getElementById('dlLoad').hidden = true;
      if (!DL.raf) DL.raf = requestAnimationFrame(dlFrame);
    }).catch(e => { console.error(e); const l = document.getElementById('dlLoad'); if (l) l.innerHTML = '<b>!</b>ما قدرنا نحمّل الثري دي على جهازك'; });
  }
  if (DL.built) { dlSyncTable(); if (!DL.raf) DL.raf = requestAnimationFrame(dlFrame); }
  dlHud(); dlModals(); dlTutor();
  if (!DL.tmr) DL.tmr = setInterval(dlTick, 200);
}
function dlTick() {
  const el = document.getElementById('dlTime'); if (!el || !S || !S.g) { if (!document.getElementById('dlW')) { clearInterval(DL.tmr); DL.tmr = 0; } return; }
  const left = Math.max(0, DL.endAt - performance.now()), tot = S.g.total || 60000;
  el.style.width = (left / tot * 100) + '%'; const t = document.getElementById('dlSec'); if (t) t.textContent = dlNum(Math.ceil(left / 1000)) + ' ثانية';
  const mb = document.getElementById('dlModT'); if (mb) mb.style.width = (left / tot * 100) + '%';
}
function dlHud() {
  const g = S.g, me = dlMe(), myTurn = g.turn === S.me && !g.spec, over = g.sub === 'over';
  DL.endAt = performance.now() + (g.left || 0);
  const opp = g.players.filter(p => p.id !== S.me);
  const boxes = p => `<span class="dlsets">${Array.from({ length: g.need }, (_, i) => { const k = (p.full || [])[i]; return `<i style="${k ? 'background:' + DSETS[k][1] : ''}"></i>`; }).join('')}</span>`;
  const danger = p => (p.full || []).length >= g.need - 1 && Object.entries(p.lands).some(([k, L]) => !(p.full || []).includes(k) && L.length === DSETS[k][2] - 1);
  document.getElementById('dlOps').innerHTML = (g.spec ? `<span class="dllive">مباشر — ${dlNum((S.specs || []).length)} متفرج</span>` : '') + opp.map(p => `<button type="button" class="dlop${g.turn === p.id ? ' on' : ''}${DL.focus === p.id ? ' foc' : ''}${danger(p) ? ' hot' : ''}" data-id="${p.id}">${dlAv(p.id, 40)}
      <span class="dlopi"><b>${esc(dlPl(p.id).name)}</b><small>بنك ${dlNum(p.bv)} م · بيده ${dlNum(p.n)}</small>${boxes(p)}${p.fav && p.fav !== '?' ? `<em style="color:${DSETS[p.fav][1]}">♥ ${DSETS[p.fav][0]}</em>` : ''}${p.ally ? `<em class="dlally">حليف ${esc(dlPl(p.ally).name)}</em>` : ''}</span>${g.spec && g.votes[p.id] ? `<span class="dlvt">${dlNum(g.votes[p.id])}</span>` : ''}</button>`).join('');
  document.querySelectorAll('.dlop').forEach(b => b.onclick = () => { if (DL.drag) return; const id = b.dataset.id; DL.focus = DL.focus === id ? null : id; dlHud(); if (DL.focus) dlLandsPanel(id); else dlCloseSheet(); });
  // لوحة الدور
  const tp = dlPl(g.turn).name;
  let turn = '';
  if (over) turn = `<div class="dlth">انتهت</div><button class="dlbtn" id="dlNewsB">الجريدة والملخص</button>`;
  else if (g.sub === 'pick') turn = `<div class="dlth">اختيار المدن</div><div class="dlts">كل واحد يختار مدينته المفضلة</div>`;
  else if (g.spec || !myTurn) turn = `<div class="dlth">دور ${esc(tp)}</div><div class="dlts">${g.sub === 'resp' ? 'ينتظر الردود…' : g.sub === 'auc' ? 'مزاد!' : `باقي له ${dlNum(g.mv)} حركات`}</div>`;
  else turn = `<div class="dlth">دورك يا ${esc(dlPl(S.me).name)}</div><div class="dlts">${g.sub === 'disc' ? 'ارمِ لين يصير بيدك ٧' : g.mv ? `باقي لك ${dlNum(g.mv)} ${g.mv === 1 ? 'حركة' : 'حركات'}` : ''}</div>
    <div class="dlpip">${[1, 2, 3].map(i => `<b class="${i <= 3 - g.mv ? 'u' : ''}">${dlNum(i)}</b>`).join('')}</div>`;
  if (!over) turn += `<div class="dltimer"><i id="dlTime"></i></div><div class="dlsec" id="dlSec"></div>`;
  if (myTurn && g.sub === 'turn') turn += `<button class="dlbtn" id="dlEnd">خلّص دوري</button>${!opp.some(p => p.ally) && !(me && me.ally) && opp.length > 1 ? '<button class="dlbtn2" id="dlAlly">اطلب تحالف</button>' : ''}`;
  turn += `<div class="dlmini"><button id="dlHelpB" title="شرح">؟</button><button id="dlStk" title="ستيكرات">ستيكر</button><button id="dlQ" title="الجودة">${DL.lite ? 'خفيف' : 'كامل'}</button>${DL.focus ? '<button id="dlBack">رجوع</button>' : ''}${g.spec ? '<button id="dlObs">بث</button>' : ''}</div>`;
  document.getElementById('dlTurn').innerHTML = turn;
  const bind = (id, fn) => { const e = document.getElementById(id); if (e) e.onclick = fn; };
  bind('dlEnd', () => send({ t: 'dend' })); bind('dlHelpB', dlHelp); bind('dlStk', dlStickers); bind('dlBack', () => { DL.focus = null; dlCloseSheet(); dlHud(); });
  bind('dlAlly', () => dlSheet('<h3>تحالف مع مين؟</h3><p class="dlsub">٣ أدوار ما تلعبون على بعض، والخيانة = غرامة ٥ مليون</p>' + dlPickPlayers(opp.map(p => p.id)), s => s.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => { send({ t: 'dally', id: b.dataset.pid }); dlCloseSheet(); })));
  bind('dlQ', () => { try { localStorage.setItem('tdeal-q', DL.lite ? 'full' : 'lite'); } catch {} location.reload(); });
  bind('dlNewsB', () => dlShowNews(true)); bind('dlObs', () => document.getElementById('dlW').classList.toggle('obs'));
  document.getElementById('dlLog').innerHTML = `<b>اللي صار</b>${S.log.slice(-4).map(l => `<div>${esc(l)}</div>`).join('')}`;
  // بنكي
  document.getElementById('dlMine').innerHTML = me ? `${dlAv(S.me, 42)}<span><b>بنكك: ${dlNum(me.bv)} مليون</b>${boxes(me)}${me.fav ? `<em style="color:${DSETS[me.fav][1]}">♥ ${DSETS[me.fav][0]}</em>` : ''}</span>` : '';
  document.getElementById('dlMine').hidden = !me;
  // شريط البث السفلي للمتفرجين
  document.getElementById('dlBar').innerHTML = g.players.map(p => `<span>${dlAv(p.id, 26)}<small>${esc(dlPl(p.id).name)}<br>${dlNum((p.full || []).length)}/${dlNum(g.need)} · ${dlNum(p.bv)}م</small></span>`).join('');
  dlRenderHand();
}
// ===== اليد =====
function dlRenderHand() {
  const g = S.g, el = document.getElementById('dlHand'), hand = g.hand || [];
  el.hidden = !hand.length;
  const sig = hand.map(c => c.id).join(',') + '|' + DL.sel;
  if (el.dataset.sig === sig) return; el.dataset.sig = sig;
  const n = hand.length, mid = (n - 1) / 2, spread = n > 7 ? 5 : 7;
  el.innerHTML = hand.map((c, i) => `<img class="dlc${DL.sel === c.id ? ' sel' : ''}" draggable="false" data-id="${c.id}" src="${dlSrc(dlImg(c))}" style="--r:${(i - mid) * spread}deg;--y:${Math.abs(i - mid) * (n > 7 ? 5 : 8)}px;z-index:${i + 1}" alt="${esc(dlName(c))}">`).join('');
}
function dlCard(id) { return (S.g.hand || []).find(c => c.id === +id); }
function dlBindHand() {
  const el = document.getElementById('dlHand');
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('pointerdown', e => {
    const img = e.target.closest('.dlc'); if (!img) return; e.preventDefault();
    const c = dlCard(img.dataset.id); if (!c) return;
    const sx = e.clientX, sy = e.clientY; let moved = false, ghost = null;
    DL.lp = setTimeout(() => { if (!moved) { DL.lpDone = 1; dlZoom(c); } }, 520); DL.lpDone = 0;
    const mv = ev => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 12) {
        moved = true; clearTimeout(DL.lp); if (!dlCanAct()) return;
        ghost = document.createElement('img'); ghost.src = img.src; ghost.className = 'dlghost'; document.body.appendChild(ghost); DL.drag = c; dlDropZones(c, true);
      }
      if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; dlDropHover(ev.clientX, ev.clientY); }
    };
    const up = ev => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); clearTimeout(DL.lp);
      if (ghost) { ghost.remove(); const z = dlDropAt(ev.clientX, ev.clientY); dlDropZones(c, false); DL.drag = null; if (z) dlDrop(c, z); return; }
      if (!moved && !DL.lpDone) dlTapCard(c);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
}
const dlCanAct = () => S.g.turn === S.me && S.g.sub === 'turn' && S.g.mv > 0 && !S.g.spec;
// أماكن الإفلات: أراضيك، بنكك، الخصوم، النص
function dlZonesFor(c) {
  const z = [];
  if (c.k === 'land' || c.k === 'wild') z.push('lands');
  if (c.k === 'money' || c.k === 'act') z.push('bank');
  if (c.k === 'act' && DTARGET.includes(c.a)) z.push('opp');
  if (c.k === 'act' && ['draw', 'eid', 'rent', 'faz', 'house', 'tower'].includes(c.a)) z.push('mid');
  return z;
}
function dlDropZones(c, on) {
  const st = document.getElementById('dlStage'); if (!st) return;
  st.querySelectorAll('.dldz').forEach(e => e.remove()); document.querySelectorAll('.dlop').forEach(b => b.classList.remove('dz', 'dzh'));
  if (!on) return;
  const zs = dlZonesFor(c), mk = (cls, lab) => { const d = document.createElement('div'); d.className = 'dldz ' + cls; d.innerHTML = `<span>${lab}</span>`; d.dataset.z = cls; st.appendChild(d); };
  if (zs.includes('lands')) mk('lands', 'أراضيك'); if (zs.includes('bank')) mk('bank', 'بنكك'); if (zs.includes('mid')) mk('mid', 'العبها');
  if (zs.includes('opp')) document.querySelectorAll('.dlop').forEach(b => b.classList.add('dz'));
}
function dlDropAt(x, y) {
  const el = document.elementsFromPoint(x, y);
  for (const e of el) { if (e.classList && e.classList.contains('dldz')) return { z: e.dataset.z }; const op = e.closest && e.closest('.dlop.dz'); if (op) return { z: 'opp', id: op.dataset.id }; }
  return null;
}
function dlDropHover(x, y) {
  const z = dlDropAt(x, y);
  document.querySelectorAll('.dldz').forEach(e => e.classList.toggle('hv', !!z && e.dataset.z === z.z));
  document.querySelectorAll('.dlop').forEach(b => b.classList.toggle('dzh', !!z && z.z === 'opp' && b.dataset.id === z.id));
  let tip = document.getElementById('dlTip'); if (!tip) { tip = document.createElement('div'); tip.id = 'dlTip'; tip.className = 'dltip'; document.body.appendChild(tip); }
  tip.hidden = !(z && z.z === 'opp'); if (!tip.hidden) { tip.style.left = x + 'px'; tip.style.top = (y - 70) + 'px'; tip.innerHTML = `أفلت هنا: <b>${DACTS[DL.drag.a][0]} على ${esc(dlPl(z.id).name)}</b>`; }
  if (!DL.drag) tip.hidden = true;
}
function dlDrop(c, z) {
  const t = document.getElementById('dlTip'); if (t) t.hidden = true;
  if (z.z === 'bank') return send({ t: 'dbank', id: c.id });
  if (z.z === 'lands') return c.k === 'wild' ? dlWildPick(c) : send({ t: 'dland', id: c.id });
  if (z.z === 'opp') return dlActFlow(c, z.id);
  if (z.z === 'mid') return dlActFlow(c);
}
function dlTapCard(c) {
  DL.sel = c.id; dlRenderHand();
  const can = dlCanAct(), v = dlVal(c);
  let opts = '';
  if (can) {
    if (c.k === 'land') opts += `<button class="dlbtn" data-o="land">حطها أرض</button>`;
    if (c.k === 'wild') opts += `<button class="dlbtn" data-o="wild">حطها مع مدينة…</button>`;
    if (c.k === 'act' && !['no', 'double'].includes(c.a)) opts += `<button class="dlbtn" data-o="play">العبها: ${DACTS[c.a][0]}</button>`;
    if (c.k === 'money' || c.k === 'act') opts += `<button class="dlbtn g" data-o="bank">حطها بالبنك (${dlNum(v)}م)</button>`;
  }
  const note = !can ? `<p class="dlsub">${S.g.turn === S.me ? 'خلصت حركاتك' : 'مو دورك الحين'}</p>` : c.a === 'no' ? '<p class="dlsub">«لا شكراً» تنلعب لما أحد يلعب عليك</p>' : c.a === 'double' ? '<p class="dlsub">تنلعب مع ورقة الإيجار</p>' : '';
  dlSheet(`<img class="dlbig" src="${dlSrc(dlImg(c))}"><h3>${esc(dlName(c))}</h3>${note}${opts}<button class="dlbtn n" data-o="x">رجّعها</button>`, s => s.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
    const o = b.dataset.o; dlCloseSheet();
    if (o === 'land') send({ t: 'dland', id: c.id }); if (o === 'wild') dlWildPick(c); if (o === 'bank') send({ t: 'dbank', id: c.id }); if (o === 'play') dlActFlow(c);
  }));
}
function dlZoom(c) {
  const d = c.k === 'land' ? `لما يكون عندك ${dlNum(DSETS[c.s][2])} من ${DSETS[c.s][0]} تكمّل المجموعة.<br>قيمتها لو دفعت فيها: ${dlNum(dlVal(c))}م` : c.k === 'wild' ? 'تنحط مع أي مدينة تبيها وتحسب منها. ما تنحط بالبنك.' : c.k === 'money' ? 'تنحط بالبنك وتدفع منها الإيجارات والديون.' : `${DACTS[c.a][1]}<br>قيمتها بالبنك: ${dlNum(DACTS[c.a][2])}م`;
  dlSheet(`<div class="dlzoom"><img src="${dlSrc(dlImg(c))}"><div><h3>${esc(dlName(c))}</h3><p>${d}</p></div></div><button class="dlbtn n" data-o="x">تمام</button>`, s => s.querySelector('[data-o]').onclick = dlCloseSheet);
}
function dlSheet(html, bindFn) { const s = document.getElementById('dlSheet'); s.innerHTML = `<div class="dlsh"><div class="dlgrip"></div>${html}</div>`; s.hidden = false; if (bindFn) bindFn(s); }
function dlCloseSheet() { const s = document.getElementById('dlSheet'); if (s) s.hidden = true; DL.sel = null; dlRenderHand(); }
function dlPickPlayers(ids) { return `<div class="dlpp">${ids.map(id => `<button class="dlppb" data-pid="${id}">${dlAv(id, 34)}<span>${esc(dlPl(id).name)}</span></button>`).join('')}</div>`; }
function dlCardsPick(cards, attr = 'data-cid') { return `<div class="dlcp">${cards.map(c => `<button class="dlcpb" ${attr}="${c.id}"><img src="${dlSrc(dlImg(c))}"></button>`).join('')}</div>`; }
function dlWildPick(c) {
  const me = dlMe(), own = Object.keys(me.lands);
  dlSheet(`<h3>حط أرض الجوكر مع…</h3><div class="dlcity">${Object.entries(DSETS).map(([k, [n, col, sz]]) => `<button data-k="${k}" class="${own.includes(k) ? 'own' : ''}" style="--c:${col}"><b>${n}</b><small>${own.includes(k) ? dlNum((me.lands[k] || []).length) + '/' + dlNum(sz) : dlNum(sz) + ' أراضي'}</small></button>`).join('')}</div>`,
    s => s.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { dlCloseSheet(); send({ t: 'dland', id: c.id, as: b.dataset.k }); }));
}
// تدفق لعب ورقة الحركة: نختار الخصم والأراضي حسب نوعها
function dlActFlow(c, tg) {
  const a = c.a, me = dlMe(), g = S.g, opp = g.players.filter(p => p.id !== S.me);
  const loose = p => Object.entries(p.lands).filter(([k]) => !(p.full || []).includes(k)).flatMap(([, L]) => L);
  const go = m => { dlCloseSheet(); send(Object.assign({ t: 'dact', id: c.id }, m)); };
  const chooseT = (ok, then) => { const ids = opp.filter(ok).map(p => p.id); if (!ids.length) return dlSheet(`<h3>${DACTS[a][0]}</h3><p class="dlsub">ما فيه أحد تنفع عليه الحين</p><button class="dlbtn n" data-o="x">طيب</button>`, s => s.querySelector('[data-o]').onclick = dlCloseSheet); if (tg && ids.includes(tg)) return then(tg); dlSheet(`<img class="dlbig sm" src="${dlSrc(dlImg(c))}"><h3>${DACTS[a][0]} على مين؟</h3>` + dlPickPlayers(ids), s => s.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => then(b.dataset.pid))); };
  if (a === 'draw' || a === 'eid' || a === 'faz') return go({});
  if (a === 'debt' || a === 'saher') return chooseT(() => true, id => go({ tg: id }));
  if (a === 'wasta') return chooseT(p => p.n > 0, id => go({ tg: id }));
  if (a === 'take') return chooseT(p => loose(p).length, id => dlSheet(`<h3>أي أرض تاخذ من ${esc(dlPl(id).name)}؟</h3>` + dlCardsPick(loose(dlP(id))), s => s.querySelectorAll('[data-cid]').forEach(b => b.onclick = () => go({ tg: id, their: +b.dataset.cid }))));
  if (a === 'swap') { const mine = loose(me); if (!mine.length) return dlSheet('<h3>بدّل</h3><p class="dlsub">لازم يكون عندك أرض مو بمجموعة كاملة</p><button class="dlbtn n" data-o="x">طيب</button>', s => s.querySelector('[data-o]').onclick = dlCloseSheet);
    return chooseT(p => loose(p).length, id => dlSheet(`<h3>اختر أرضك اللي بتعطيها</h3>` + dlCardsPick(mine), s => s.querySelectorAll('[data-cid]').forEach(b => b.onclick = () => { const my = +b.dataset.cid; dlSheet(`<h3>وش تاخذ من ${esc(dlPl(id).name)}؟</h3>` + dlCardsPick(loose(dlP(id))), s2 => s2.querySelectorAll('[data-cid]').forEach(b2 => b2.onclick = () => go({ tg: id, my, their: +b2.dataset.cid }))); }))); }
  if (a === 'big') return chooseT(p => (p.full || []).length, id => { const p = dlP(id); dlSheet(`<h3>أي مجموعة تخطف من ${esc(dlPl(id).name)}؟</h3><div class="dlcity">${p.full.map(k => `<button data-k="${k}" style="--c:${DSETS[k][1]}"><b>${DSETS[k][0]}</b><small>${dlNum(p.lands[k].length)} أراضي</small></button>`).join('')}</div>`, s => s.querySelectorAll('[data-k]').forEach(b => b.onclick = () => go({ tg: id, set: b.dataset.k }))); });
  if (a === 'rent') {
    const ks = Object.keys(me.lands); if (!ks.length) return dlSheet('<h3>إيجار</h3><p class="dlsub">لازم يكون عندك أرض عشان تطالب بإيجارها</p><button class="dlbtn n" data-o="x">طيب</button>', s => s.querySelector('[data-o]').onclick = dlCloseSheet);
    const dbl = (g.hand || []).find(x => x.k === 'act' && x.a === 'double' && x.id !== c.id), canD = dbl && g.mv >= 2;
    return dlSheet(`<h3>إيجار أي مدينة؟</h3><p class="dlsub">الكل يدفع لك${opp.some(p => p.ally === S.me) ? ' (إلا حليفك)' : ''}</p>${canD ? '<label class="dlchk"><input type="checkbox" id="dlDbl"> دبّل الإيجار (تاخذ حركة زيادة)</label>' : ''}<div class="dlcity">${ks.map(k => `<button data-k="${k}" style="--c:${DSETS[k][1]}"><b>${DSETS[k][0]}</b><small>${dlNum(me.rent[k] || 0)} مليون</small></button>`).join('')}</div>`,
      s => s.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const d = s.querySelector('#dlDbl'); go({ set: b.dataset.k, dbl: d && d.checked ? dbl.id : 0 }); }));
  }
  if (a === 'house' || a === 'tower') {
    const ks = (me.full || []).filter(k => !['train', 'util'].includes(k) && (a === 'house' ? !(me.bld[k] || {}).h : (me.bld[k] || {}).h && !(me.bld[k] || {}).t));
    if (!ks.length) return dlSheet(`<h3>${DACTS[a][0]}</h3><p class="dlsub">${a === 'house' ? 'يحتاج مجموعة كاملة (مو القطار والخدمات)' : 'يحتاج مجموعة كاملة فيها ملحق'}</p><button class="dlbtn n" data-o="x">طيب</button>`, s => s.querySelector('[data-o]').onclick = dlCloseSheet);
    return dlSheet(`<h3>${DACTS[a][0]} على أي مجموعة؟</h3><div class="dlcity">${ks.map(k => `<button data-k="${k}" style="--c:${DSETS[k][1]}"><b>${DSETS[k][0]}</b></button>`).join('')}</div>`, s => s.querySelectorAll('[data-k]').forEach(b => b.onclick = () => go({ set: b.dataset.k })));
  }
}
function dlLandsPanel(id) {
  const p = dlP(id), g = S.g; if (!p) return;
  const sets = Object.entries(p.lands);
  const near = sets.filter(([k, L]) => !(p.full || []).includes(k) && L.length === DSETS[k][2] - 1).map(([k]) => DSETS[k][0]);
  dlSheet(`<h3>أراضي ${esc(dlPl(id).name)}</h3>${sets.length ? `<div class="dlsetsv">${sets.map(([k, L]) => `<div><div class="dlst">${L.map(c => `<img src="${dlSrc(dlImg(c))}">`).join('')}</div><small style="color:${DSETS[k][1]}">${DSETS[k][0]} ${dlNum(L.length)}/${dlNum(DSETS[k][2])}${(p.full || []).includes(k) ? ' ✓' : ''}</small></div>`).join('')}</div>` : '<p class="dlsub">ما عنده أراضي للحين</p>'}
    ${near.length ? `<p class="dlwarn">ناقصه أرض وحدة ويكمّل ${near.join(' و')}!</p>` : ''}<p class="dlsub">البنك: ${dlNum(p.bv)} مليون · بيده ${dlNum(p.n)} ورق</p>
    ${g.spec && g.sub !== 'over' ? `<button class="dlbtn" data-vote="${id}">أتوقع ${esc(dlPl(id).name)} يفوز</button>` : ''}<button class="dlbtn n" data-o="x">رجوع</button>`,
    s => { s.querySelector('[data-o]').onclick = () => { DL.focus = null; dlCloseSheet(); dlHud(); }; const v = s.querySelector('[data-vote]'); if (v) v.onclick = () => { send({ t: 'dsv', id }); dlCloseSheet(); }; });
}
// ===== النوافذ (الرد، الدفع، المزاد، التحالف، اختيار المدينة، الرمي) =====
function dlModals() {
  const g = S.g, m = document.getElementById('dlMod'), me = dlMe(); let html = '', key = '';
  const pend = g.pend, my = pend && pend.t[S.me];
  if (g.sub === 'pick' && me && !me.fav) {
    key = 'pick'; html = `<h3>اختر مدينتك المفضلة</h3><p class="dlsub">لما تكمّلها، إيجارها يزيد لك مليون</p><div class="dlfav">${Object.keys(DSETS).filter(k => !['train', 'util'].includes(k)).map(k => `<button data-fav="${k}"><img src="${dlSrc('land_' + k)}"></button>`).join('')}</div><div class="dlmt"><i id="dlModT"></i></div>`;
  } else if (pend && my === 'ask') {
    const by = pend.by, nm = esc(dlPl(by).name), hasNo = (g.hand || []).some(c => c.k === 'act' && c.a === 'no');
    key = 'ask' + pend.a + by; html = `<h3>${nm} ${pend.a === 'rent' ? 'يطالبك بإيجار' : 'لعب عليك'} «${DACTS[pend.a] ? DACTS[pend.a][0] : ''}»</h3>${dlPendDesc(pend)}<div class="dlmt"><i id="dlModT"></i></div>
      <div class="dlrow">${hasNo ? '<button class="dlbtn g" data-r="no">لا شكراً</button>' : ''}<button class="dlbtn n" data-r="ok">${pend.amt ? 'طيب، بدفع' : 'خلها'}</button></div>`;
  } else if (pend && pend.by === S.me && Object.values(pend.t).includes('counter')) {
    const who = Object.keys(pend.t).find(id => pend.t[id] === 'counter'), hasNo = (g.hand || []).some(c => c.k === 'act' && c.a === 'no');
    key = 'ctr' + who; html = `<h3>${esc(dlPl(who).name)} قال «لا شكراً»!</h3><p class="dlsub">تكسرها بـ «لا شكراً» من عندك؟</p><div class="dlmt"><i id="dlModT"></i></div><div class="dlrow">${hasNo ? `<button class="dlbtn g" data-c="no" data-w="${who}">لا شكراً</button>` : ''}<button class="dlbtn n" data-c="ok" data-w="${who}">خلاص</button></div>`;
  } else if (pend && my === 'pay') {
    const all = me.bank.concat(Object.values(me.lands).flat()), avail = all.reduce((a, c) => a + dlVal(c), 0);
    key = 'pay' + pend.by + pend.amt; DL.paySel = DL.payKey === key ? DL.paySel : new Set(); DL.payKey = key;
    html = `<h3>${esc(dlPl(pend.by).name)} يطالبك بـ ${dlNum(pend.amt)} مليون</h3><p class="dlsub">${pend.a === 'rent' ? 'إيجار ' + (DSETS[pend.x.set] || [''])[0] : DACTS[pend.a] ? DACTS[pend.a][0] : 'غرامة'} · اختر وش تدفع${avail < pend.amt ? ' (ما يكفي، بتدفع كل شي)' : ''}</p>
      <div class="dlpay">${me.bank.map(c => `<button data-pay="${c.id}"><img src="${dlSrc(dlImg(c))}"></button>`).join('')}${Object.values(me.lands).flat().map(c => `<button data-pay="${c.id}" class="ld"><img src="${dlSrc(dlImg(c))}"></button>`).join('')}</div>
      <div class="dlpays" id="dlPayS"></div><div class="dlmt"><i id="dlModT"></i></div><button class="dlbtn g" id="dlPayB">ادفع</button>`;
    DL.payAll = all; DL.payNeed = Math.min(pend.amt, avail);
  } else if (pend && my === 'give') {
    key = 'give' + pend.by; html = `<h3>فزعة لـ ${esc(dlPl(pend.by).name)}</h3><p class="dlsub">اختر ورقة من يدك تعطيه إياها</p>${dlCardsPick(g.hand || [], 'data-give')}<div class="dlmt"><i id="dlModT"></i></div>`;
  } else if (g.sub === 'disc' && g.turn === S.me) {
    const need = (g.hand || []).length - 7; key = 'disc' + need; DL.discSel = DL.discKey === key ? DL.discSel : new Set(); DL.discKey = key;
    html = `<h3>ارمِ ${dlNum(need)} ${need === 1 ? 'ورقة' : 'ورق'}</h3><p class="dlsub">ما يصير بيدك أكثر من ٧</p><div class="dlpay">${(g.hand || []).map(c => `<button data-disc="${c.id}"><img src="${dlSrc(dlImg(c))}"></button>`).join('')}</div><button class="dlbtn" id="dlDiscB">ارمِ</button><div class="dlmt"><i id="dlModT"></i></div>`;
  } else if (g.sub === 'auc' && g.auc && me) {
    key = 'auc'; const top = g.auc.top;
    html = `<h3 class="gold">مزاد!</h3><div class="dlauc"><img src="${dlSrc('wild')}"><div><b>${dlNum(g.auc.v)} م</b><small>${top ? 'أعلى مزايد: ' + esc(dlPl(top).name) : 'محد زايد للحين'}</small></div></div><div class="dlmt"><i id="dlModT"></i></div>
      <div class="dlrow">${[1, 2, 3].map(d => `<button class="dlbtn" data-bid="${g.auc.v + d}" ${g.auc.v + d > me.bv || top === S.me ? 'disabled' : ''}>+${dlNum(d)}</button>`).join('')}<button class="dlbtn n" data-o="hide">أنسحب</button></div><p class="dlsub">بنكك ${dlNum(me.bv)} مليون</p>`;
    if (DL.aucHide) { html = ''; key = ''; }
  } else if (g.allyReq && g.allyReq.to === S.me) {
    key = 'ally' + g.allyReq.from; html = `<h3>${esc(dlPl(g.allyReq.from).name)} تبي تتحالف معك</h3><div class="dlally2">${dlAv(g.allyReq.from, 50)}<svg width="50" height="30" viewBox="0 0 50 30"><path d="M4 16 L16 8 L26 14 L34 8 L46 16 L34 26 L16 26Z" fill="#e7b54a" stroke="#3a2416" stroke-width="2"/></svg>${dlAv(S.me, 50)}</div><p class="dlsub">٣ أدوار ما تلعبون على بعض · الخيانة = ٥ مليون غرامة</p><div class="dlrow"><button class="dlbtn g" data-al="1">موافق</button><button class="dlbtn n" data-al="0">لا</button></div>`;
  }
  if (g.sub !== 'auc') DL.aucHide = false;
  if (!html) { m.hidden = true; m.dataset.k = ''; return; }
  if (m.dataset.k === key && key !== 'auc') { dlPayRefresh(); return; }
  m.dataset.k = key; m.hidden = false; m.innerHTML = `<div class="dlmc">${html}</div>`;
  m.querySelectorAll('[data-fav]').forEach(b => b.onclick = () => { send({ t: 'dfav', s: b.dataset.fav }); m.hidden = true; });
  m.querySelectorAll('[data-r]').forEach(b => b.onclick = () => send({ t: 'dresp', id: S.me, ans: b.dataset.r }));
  m.querySelectorAll('[data-c]').forEach(b => b.onclick = () => send({ t: 'dresp', id: b.dataset.w, ans: b.dataset.c }));
  m.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => { const id = +b.dataset.pay; DL.paySel.has(id) ? DL.paySel.delete(id) : DL.paySel.add(id); dlPayRefresh(); });
  const pb = m.querySelector('#dlPayB'); if (pb) pb.onclick = () => send({ t: 'dpay', ids: [...DL.paySel] });
  m.querySelectorAll('[data-give]').forEach(b => b.onclick = () => send({ t: 'dgive', id: +b.dataset.give }));
  m.querySelectorAll('[data-disc]').forEach(b => b.onclick = () => { const id = +b.dataset.disc; DL.discSel.has(id) ? DL.discSel.delete(id) : DL.discSel.add(id); b.classList.toggle('on', DL.discSel.has(id)); });
  const db = m.querySelector('#dlDiscB'); if (db) db.onclick = () => send({ t: 'ddisc', ids: [...DL.discSel] });
  m.querySelectorAll('[data-bid]').forEach(b => b.onclick = () => send({ t: 'dbid', v: +b.dataset.bid }));
  m.querySelectorAll('[data-o="hide"]').forEach(b => b.onclick = () => { DL.aucHide = true; m.hidden = true; });
  m.querySelectorAll('[data-al]').forEach(b => b.onclick = () => send({ t: 'dallyok', ok: b.dataset.al === '1' }));
  dlPayRefresh();
}
function dlPendDesc(p) {
  const by = dlP(p.by), me = dlMe(); const find = id => { for (const pl of S.g.players) for (const L of Object.values(pl.lands)) { const c = L.find(x => x.id === id); if (c) return c; } return null; };
  if (p.a === 'take') { const c = find(p.x.their); return `<div class="dlvs"><img src="${dlSrc('act_take')}"><span>←</span>${c ? `<img src="${dlSrc(dlImg(c))}">` : ''}</div>`; }
  if (p.a === 'swap') { const a = find(p.x.my), b = find(p.x.their); return `<div class="dlvs">${a ? `<img src="${dlSrc(dlImg(a))}">` : ''}<span>⇄</span>${b ? `<img src="${dlSrc(dlImg(b))}">` : ''}</div>`; }
  if (p.a === 'big') return `<div class="dlvs"><img src="${dlSrc('act_big')}"><span>←</span><b style="color:${DSETS[p.x.set][1]}">${DSETS[p.x.set][0]} كاملة!</b></div>`;
  if (p.amt) return `<div class="dlvs"><img src="${dlSrc('act_' + (DACTS[p.a] ? p.a : 'debt'))}"><b>${dlNum(p.amt)} مليون${p.x && p.x.dbl ? ' (مدبّل)' : ''}</b></div>`;
  return `<div class="dlvs"><img src="${dlSrc('act_' + p.a)}"></div>`;
}
function dlPayRefresh() {
  const s = document.getElementById('dlPayS'); if (!s || !DL.payAll) return;
  const tot = DL.payAll.filter(c => DL.paySel.has(c.id)).reduce((a, c) => a + dlVal(c), 0);
  s.innerHTML = `مختار: <b style="color:${tot >= DL.payNeed ? '#1f5f3a' : '#8a1c1c'}">${dlNum(tot)} / ${dlNum(DL.payNeed)} م</b>`;
  document.querySelectorAll('[data-pay]').forEach(b => b.classList.toggle('on', DL.paySel.has(+b.dataset.pay)));
  const pb = document.getElementById('dlPayB'); if (pb) pb.disabled = tot < DL.payNeed;
}
// ===== المؤثرات من السيرفر =====
function net_deal(m) {
  if (!S || S.game !== 'deal' || !S.g) return;
  const fx = document.getElementById('dlFx'); if (!fx) return;
  const chip = id => id === S.me ? document.getElementById('dlMine') : document.querySelector(`.dlop[data-id="${id}"]`);
  const ctr = el => { if (!el || el.hidden) return null; const r = el.getBoundingClientRect(), s = fx.getBoundingClientRect(); return [r.left + r.width / 2 - s.left, r.top + r.height / 2 - s.top]; };
  const stamp = (txt, col) => { const d = document.createElement('div'); d.className = 'dlstamp'; d.style.setProperty('--c', col); d.textContent = txt; fx.appendChild(d); setTimeout(() => d.remove(), 1900); dlSnd('slam'); };
  if (m.k === 'draw') { if (m.id === S.me) dlSnd('draw'); if (m.id === S.me && !S.g.spec) dlSnd('ding'); }
  if (m.k === 'land') { dlSnd('card'); if (m.done) { setTimeout(() => dlRibbon(m.id, m.s), 900); dlSnd('chime'); } }
  if (m.k === 'bank') dlSnd('coin');
  if (m.k === 'pay' || m.k === 'give' || m.k === 'wasta') {
    const a = ctr(chip(m.from)), b = ctr(chip(m.to)); if (a && b) for (let i = 0; i < Math.min(8, (m.v || 1) + 1); i++) { const c = document.createElement('div'); c.className = m.k === 'pay' ? 'dlcoin' : 'dlflyc'; c.style.left = a[0] + 'px'; c.style.top = a[1] + 'px'; fx.appendChild(c); setTimeout(() => { c.style.transform = `translate(${b[0] - a[0]}px,${b[1] - a[1]}px) scale(.7)`; c.style.opacity = '.2'; }, 30 + i * 90); setTimeout(() => c.remove(), 1200 + i * 90); }
    if (m.k === 'pay' && m.v) { const t = document.createElement('div'); t.className = 'dlminus'; t.textContent = '-' + dlNum(m.v) + ' م'; if (a) { t.style.left = a[0] + 'px'; t.style.top = a[1] + 'px'; } fx.appendChild(t); setTimeout(() => t.remove(), 1600); }
    dlSnd('coin');
  }
  if (m.k === 'no') stamp('لا شكراً!', '#1f8f52');
  if (m.k === 'betray') stamp('خيانة!', '#c62828');
  if (m.k === 'steal') dlToast(`${esc(dlPl(m.to).name)} ${m.big ? 'خطف' : 'أخذ'} ${DSETS[m.s] ? DSETS[m.s][0] : ''}${m.big ? ' كاملة' : ''} من ${esc(dlPl(m.from).name)}!`, m.big ? 'big' : '');
  if (m.k === 'swap') dlToast(`${esc(dlPl(m.a).name)} بدّل ${DSETS[m.sa][0]} بـ ${DSETS[m.sb][0]} مع ${esc(dlPl(m.b).name)}`);
  if (m.k === 'act') { dlSnd('whoosh'); if (DACTS[m.a]) dlToast(`${esc(dlPl(m.id).name)} لعب «${DACTS[m.a][0]}»${m.tg ? ' على ' + esc(dlPl(m.tg).name) : ''}`); }
  if (m.k === 'event') dlEvent(m.ev);
  if (m.k === 'sticker') { const el = chip(m.id), a = ctr(el); const d = document.createElement('div'); d.className = 'dlstk' + (m.spec ? ' spec' : ''); d.textContent = m.s; d.style.setProperty('--c', ['#c4560f', '#8a1c1c', '#1f5f3a', '#1c5fd0', '#6b5634'][[...m.s].length % 5]); if (a && !m.spec) { d.style.left = a[0] + 'px'; d.style.top = (a[1] + 40) + 'px'; } else { d.style.right = '14px'; d.style.top = (60 + Math.random() * 160) + 'px'; d.classList.add('fly'); } fx.appendChild(d); setTimeout(() => d.remove(), 2600); dlSnd('pop'); }
  if (m.k === 'bid') dlSnd('tick');
  if (m.k === 'aucEnd') dlToast(m.id ? `${esc(dlPl(m.id).name)} فاز بالمزاد بـ ${dlNum(m.v)} مليون` : 'محد زايد');
  if (m.k === 'ally') { dlToast(`${esc(dlPl(m.a).name)} و${esc(dlPl(m.b).name)} تحالفوا`); dlSnd('bell'); }
  if (m.k === 'allyNo' && m.to === S.me) dlToast(`${esc(dlPl(m.from).name)} رفض التحالف`);
}
function dlToast(html, cls = '') { const fx = document.getElementById('dlFx'); if (!fx) return; const d = document.createElement('div'); d.className = 'dltoast ' + cls; d.innerHTML = html; fx.appendChild(d); setTimeout(() => d.remove(), 2600); }
function dlRibbon(pid, k) {
  const fx = document.getElementById('dlFx'); if (!fx || !DSETS[k]) return;
  const d = document.createElement('div'); d.className = 'dlribbon'; d.style.setProperty('--c', DSETS[k][1]);
  d.innerHTML = `<div>${Array.from({ length: DSETS[k][2] }, (_, i) => `<img src="${dlSrc('land_' + k)}" style="rotate:${(i - 1) * 7}deg">`).join('')}<b>${pid === S.me ? 'كمّلت' : esc(dlPl(pid).name) + ' كمّل'} ${DSETS[k][0]}!</b></div>`;
  fx.appendChild(d); setTimeout(() => d.remove(), 2700);
}
// الأحداث: كل مرة بشكل (ورقة تنقلب / شريط أخبار + تأثير / لون الطاولة + شارة)
function dlEvent(ev) {
  const fx = document.getElementById('dlFx'); if (!fx || !ev) return; dlSnd('bell');
  if (ev.style === 0) { const d = document.createElement('div'); d.className = 'dlevc'; d.innerHTML = `<div class="dlevin"><svg width="64" height="64" viewBox="0 0 70 70">${dlEvIcon(ev.key)}</svg><b>${esc(ev.n)}</b><small>${esc(ev.d)}</small></div>`; fx.appendChild(d); setTimeout(() => d.remove(), 3600); }
  else if (ev.style === 1) { const d = document.createElement('div'); d.className = 'dlticker'; d.innerHTML = `<span>عاجل</span><p><b>${esc(ev.n)}</b> — ${esc(ev.d)}</p>`; fx.appendChild(d); setTimeout(() => d.remove(), 6000); if (ev.key === 'rain' || ev.key === 'gift') dlRainFx(); }
  else { const t = document.getElementById('dlTint'); t.className = 'dltint on ' + ev.key; setTimeout(() => t.className = 'dltint', 5000); dlToast(`<b>${esc(ev.n)}</b> · ${esc(ev.d)}`, 'ev'); }
}
function dlEvIcon(k) {
  return { season: '<path d="M8 62 L14 22 L28 42 L35 10 L42 42 L56 22 L62 62Z" fill="#ffc928"/>', rain: '<path d="M14 36 Q14 20 32 20 Q38 8 50 16 Q62 18 60 34Z" fill="#cfe6ff"/>' + [18, 30, 42, 54].map(x => `<path d="M${x} 44 l-4 12" stroke="#7fb8ff" stroke-width="4" stroke-linecap="round"/>`).join(''), sale: '<path d="M10 40 L30 10 H60 V40 L30 64Z" fill="#ffc928"/><circle cx="48" cy="22" r="5" fill="#3a2416"/>', auction: '<rect x="8" y="10" width="34" height="16" rx="3" fill="#ffc928" transform="rotate(-30 25 18)"/><path d="M30 30 L56 58" stroke="#ffc928" stroke-width="7" stroke-linecap="round"/>', zakat: '<circle cx="35" cy="35" r="24" fill="#ffc928"/><text x="35" y="44" text-anchor="middle" font-family="Lalezar" font-size="26" fill="#3a2416">٢</text>', gift: '<rect x="12" y="28" width="46" height="34" fill="#ffc928"/><rect x="8" y="20" width="54" height="12" fill="#ffe38a"/><path d="M35 20 V62" stroke="#c62828" stroke-width="6"/>' }[k] || '';
}
function dlStickers() {
  const S2 = ['ههههه', 'ظلم!', 'يا حظك', 'استعجل', 'ما عليه', 'لا تسويها', 'كفو', 'حرامي!'];
  dlSheet(`<h3>ستيكر</h3><div class="dlstks">${S2.map((s, i) => `<button data-s="${s}" style="--c:${['#c4560f', '#8a1c1c', '#1f5f3a', '#1c5fd0', '#6b5634', '#7b3fc7', '#00838f', '#c2185b'][i]}">${s}</button>`).join('')}</div>`, s => s.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { send({ t: 'dst', s: b.dataset.s }); dlCloseSheet(); }));
}
// ===== الشرح (؟) =====
function dlHelp() {
  const h = document.getElementById('dlHelp'), st = document.getElementById('dlStage').getBoundingClientRect();
  const items = [['dlOps', 'الخصوم', 'اضغط على أي واحد تشوف أراضيه، والمربعات = كم مجموعة كمّل'], ['dlTurn', 'الدور', 'عندك ٣ حركات بالدور، والشريط وقتك. «خلّص دوري» لو خلصت قبل'], ['dlLog', 'اللي صار', 'آخر الحركات عشان ما يفوتك شي'], ['dlMine', 'بنكك', 'فلوسك اللي تدفع منها، وتحتها مجموعاتك'], ['dlHand', 'يدك', 'اسحب الورقة للطاولة، أو اضغطها ضغطة تطلع خياراتها، ومطوّل تتكبر']];
  h.innerHTML = items.map(([id, t, d], i) => { const e = document.getElementById(id); if (!e || e.hidden) return ''; const r = e.getBoundingClientRect(); const x = r.left - st.left, y = r.top - st.top; const below = y < st.height / 2;
    return `<div class="dlhb" style="left:${x - 4}px;top:${y - 4}px;width:${r.width + 8}px;height:${r.height + 8}px"><i>${dlNum(i + 1)}</i></div><div class="dlhn" style="left:${Math.min(Math.max(8, x), st.width - 230)}px;top:${below ? y + r.height + 10 : Math.max(8, y - 74)}px"><b>${t}</b>${d}</div>`; }).join('') + '<div class="dlhx">اضغط أي مكان تقفل</div>';
  h.hidden = false; h.onclick = () => h.hidden = true;
}
// ===== أبو ترتيب: تدريب أول مرة =====
function dlTutor() {
  const g = S.g; if (g.spec || g.sub === 'over') return;
  const me = dlMe(); if (!me) return;
  const steps = [
    ['pick', g.sub === 'pick' && !me.fav, 'هلا! أنا أبو ترتيب. اختر مدينتك المفضلة، ولما تكمّلها إيجارها يزيد لك.'],
    ['land', g.turn === S.me && g.sub === 'turn' && (g.hand || []).some(c => c.k === 'land'), 'دورك! اسحب ورقة أرض وحطها على الطاولة، ويطلع لك معلم المدينة. كمّل ' + dlNum(g.need) + ' مدن وتفوز.'],
    ['bank', g.turn === S.me && g.sub === 'turn' && (g.hand || []).some(c => c.k === 'money'), 'ورق الفلوس حطه بالبنك، تدفع منه لما أحد يطالبك.'],
    ['act', g.turn === S.me && g.sub === 'turn' && (g.hand || []).some(c => c.k === 'act' && !['no', 'double'].includes(c.a)), 'أوراق الحركة تسرق وتطالب. اضغط مطوّل على أي ورقة تقرا شرحها.'],
    ['end', g.turn === S.me && g.sub === 'turn' && g.mv === 1, 'باقي لك حركة وحدة. لو ما تبي تلعب شي اضغط «خلّص دوري».']
  ];
  const t = document.getElementById('dlTut'), s = steps.find(([k, ok]) => ok && !DL.tutDone[k]);
  if (!s) { t.hidden = true; return; }
  if (t.dataset.k === s[0] && !t.hidden) return;
  t.dataset.k = s[0]; t.hidden = false;
  t.innerHTML = `<svg width="78" height="104" viewBox="0 0 90 120"><path d="M10 120 Q10 70 45 66 Q80 70 80 120Z" fill="#f3e2c0" stroke="#3a2416" stroke-width="3"/><circle cx="45" cy="40" r="24" fill="#d9a57a" stroke="#3a2416" stroke-width="3"/><path d="M18 34 Q45 4 72 34 L78 58 Q45 44 12 58Z" fill="#fff" stroke="#3a2416" stroke-width="3"/><path d="M18 34 Q45 22 72 34" stroke="#c62828" stroke-width="5" fill="none"/><circle cx="37" cy="42" r="3"/><circle cx="53" cy="42" r="3"/><path d="M38 52 Q45 57 52 52" stroke="#3a2416" stroke-width="2.5" fill="none"/></svg>
    <div class="dltb"><b>أبو ترتيب:</b> ${s[2]}<div><button data-t="ok">فهمت</button><button data-t="all">لا تعلّمني</button></div></div>`;
  t.querySelector('[data-t="ok"]').onclick = () => { DL.tutDone[s[0]] = 1; dlTutSave(); t.hidden = true; };
  t.querySelector('[data-t="all"]').onclick = () => { steps.forEach(([k]) => DL.tutDone[k] = 1); dlTutSave(); t.hidden = true; };
}
function dlTutSave() { try { localStorage.setItem('tdeal-tut', JSON.stringify(DL.tutDone)); } catch {} }
// ===== الجريدة والملخص =====
function dlShowNews(force) {
  const g = S.g, n = document.getElementById('dlNews'); if (!g.news || !n) return;
  if (!force && n.dataset.done) return; n.dataset.done = 1; n.hidden = false;
  const w = dlP(g.winner) || { full: [], lands: {} };
  n.innerHTML = `<div class="dlpaper"><div class="dlmast"><span>جريدة ترتيب</span><small>العدد ${dlNum(g.turnNo)} · ${new Date().toLocaleDateString('ar-SA-u-nu-arab', { weekday: 'long', day: 'numeric', month: 'long' })}</small></div>
    <h2>${esc(g.news.head)}</h2><div class="dlpb">${(w.full || []).map(k => `<img src="${dlSrc('land_' + k)}">`).join('')}<p>${esc(g.news.body)}</p></div>
    <div class="dltabs"><button data-tab="card" class="on">البطاقة</button><button data-tab="titles">الألقاب</button><button data-tab="graph">قصة اللعبة</button></div><div class="dltab" id="dlTab"></div>
    <div class="dlrow"><button class="dlbtn n" data-x="1">سكّر</button></div></div>`;
  const tab = k => { n.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === k)); document.getElementById('dlTab').innerHTML = k === 'card' ? dlShareCard() : k === 'titles' ? dlTitles() : dlGraph(); const sv = document.getElementById('dlSave'); if (sv) sv.onclick = dlSaveCard; };
  n.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => tab(b.dataset.tab)); n.querySelector('[data-x]').onclick = () => n.hidden = true; tab('card');
}
function dlShareCard() {
  const g = S.g, w = dlP(g.winner) || { full: [] };
  return `<div class="dlshare" id="dlShareC"><div class="dlsadu"></div><b class="t">ترتيب ديل</b><b class="w">${esc(dlPl(g.winner).name)} فاز</b><div class="ims">${(w.full || []).map(k => `<img src="${dlSrc('land_' + k)}">`).join('')}</div><small>${dlNum(g.turnNo)} دور · ${dlNum(g.players.length)} لاعبين</small></div><button class="dlbtn" id="dlSave">احفظ الصورة</button>`;
}
function dlSaveCard() {
  const g = S.g, w = dlP(g.winner) || { full: [] }, c = document.createElement('canvas'); c.width = 600; c.height = 800; const x = c.getContext('2d');
  x.fillStyle = '#f3e2c0'; x.fillRect(0, 0, 600, 800); x.strokeStyle = '#3a2416'; x.lineWidth = 10; x.strokeRect(5, 5, 590, 790);
  for (let i = 0; i < 600; i += 24) { x.fillStyle = '#8a1c1c'; x.fillRect(i, 10, 24, 26); x.fillStyle = '#f3e2c0'; x.beginPath(); x.moveTo(i, 23); x.lineTo(i + 12, 12); x.lineTo(i + 24, 23); x.lineTo(i + 12, 34); x.fill(); }
  x.textAlign = 'center'; x.fillStyle = '#8a1c1c'; x.font = '56px Lalezar'; x.fillText('ترتيب ديل', 300, 120); x.fillStyle = '#3a2416'; x.font = '72px Lalezar'; x.fillText(dlPl(g.winner).name + ' فاز', 300, 220);
  const ks = w.full || [], imgs = ks.map(k => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = dlSrc('land_' + k); }));
  Promise.all(imgs).then(ims => { ims.forEach((im, i) => { if (im) x.drawImage(im, 300 - ims.length * 85 + i * 170 + 5, 270, 160, 227); }); x.font = '30px Tajawal'; x.fillText(`${dlNum(g.turnNo)} دور · ${dlNum(g.players.length)} لاعبين`, 300, 560);
    const st = g.stats || {}; let y = 620; for (const [t, id] of dlTitleList().slice(0, 3)) { x.font = '28px Tajawal'; x.fillText(`${t}: ${dlPl(id).name}`, 300, y); y += 44; }
    c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'tarteeb-deal.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }); });
}
function dlTitleList() {
  const g = S.g, st = g.stats || {}, ids = g.players.map(p => p.id), get = (id, k) => (st[id] || {})[k] || 0, out = [];
  const best = (k, min = 1) => { const id = ids.slice().sort((a, b) => get(b, k) - get(a, k))[0]; return get(id, k) >= min ? id : null; };
  let id;
  if ((id = best('stole'))) out.push(['أكبر حرامي', id, `سرق ${dlNum(get(id, 'stole'))} أراضي`]);
  if ((id = best('paid'))) out.push(['أكثر واحد دفع', id, `${dlNum(get(id, 'paid'))} مليون`]);
  if ((id = best('got'))) out.push(['جامع الإيجارات', id, `${dlNum(get(id, 'got'))} مليون`]);
  if ((id = best('nos'))) out.push(['حارس «لا شكراً»', id, `استخدمها ${dlNum(get(id, 'nos'))} مرات`]);
  const stingy = ids.slice().sort((a, b) => get(a, 'paid') - get(b, 'paid'))[0]; out.push(['بخيل اللعبة', stingy, get(stingy, 'paid') ? `دفع ${dlNum(get(stingy, 'paid'))} بس` : 'ما دفع ولا ريال']);
  return out.map(([t, id, d]) => [t, id, d]);
}
function dlTitles() { return `<div class="dltit">${dlTitleList().map(([t, id, d]) => `<div style="border-color:${dlCol(id)}"><small>${t}</small><b style="color:${dlCol(id)}">${esc(dlPl(id).name)}</b><small>${d}</small></div>`).join('')}</div>`; }
function dlGraph() {
  const g = S.g, h = g.hist || []; if (h.length < 2) return '<p class="dlsub">اللعبة كانت قصيرة مرة</p>';
  const ids = g.players.map(p => p.id), max = Math.max(1, ...h.flatMap(o => ids.map(id => o[id] || 0))), W = 320, Hh = 150;
  const line = id => h.map((o, i) => `${(i / (h.length - 1) * W).toFixed(1)},${(Hh - (o[id] || 0) / max * (Hh - 10)).toFixed(1)}`).join(' ');
  return `<svg class="dlgr" viewBox="-4 -4 ${W + 8} ${Hh + 8}">${ids.map(id => `<polyline points="${line(id)}" fill="none" stroke="${dlCol(id)}" stroke-width="3.5" stroke-linejoin="round"/>`).join('')}</svg><div class="dlleg">${ids.map(id => `<span><i style="background:${dlCol(id)}"></i>${esc(dlPl(id).name)}</span>`).join('')}</div><p class="dlsub">ثروة كل لاعب (البنك + الأراضي) دور بدور</p>`;
}
// يفتح الجريدة لحاله لما تخلص اللعبة
setInterval(() => { if (typeof S !== 'undefined' && S && S.game === 'deal' && S.g && S.g.sub === 'over' && document.getElementById('dlNews')) { if (!DL.newsT) DL.newsT = setTimeout(() => { dlShowNews(); dlSnd('win'); }, 3500); } else if (DL.newsT && !(S && S.g && S.g.sub === 'over')) { clearTimeout(DL.newsT); DL.newsT = 0; const n = document.getElementById('dlNews'); if (n) { n.hidden = true; delete n.dataset.done; } } }, 700);
