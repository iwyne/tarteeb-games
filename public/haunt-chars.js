// شخصيات القصر المسكون: موديلات Quaternius (رخصة CC0) + حركات Universal Animation Library 1 و 2.
// الناجين: لبس مرسوم بالشيدر (تيشيرت/هودي/ثوب) أو لبس حقيقي من حزمة Modular Character Outfits.
// الوحش: نبنيه من نفس الهيكل بأشكال مختلفة (مسخ، عروس، صاحب القلنسوة، زومبي) والشبح يخصّصه.
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import * as SkeletonUtils from './vendor/SkeletonUtils.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';

const DIR = 'haunt/', V = '?v=2';
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const get = f => new Promise((ok, no) => loader.load(DIR + f + V, ok, undefined, no));
const texL = new THREE.TextureLoader();

export const BODIES = ['رجل', 'بنت'];
export const HAIRS = [{ n: 'بدون', f: null }, { n: 'قصير', f: 'h_buzzed' }, { n: 'مفروق', f: 'h_simpleparted' }, { n: 'طويل', f: 'h_long' }, { n: 'كعكة', f: 'h_buns' }, { n: 'قصير ناعم', f: 'h_buzzedfemale' }];
export const SKINS = ['#f2d6c4', '#d9a882', '#a8734f', '#6e4630'];
export const HAIRC = ['#1b1512', '#4a2e1c', '#8a5a2e', '#c9a25a', '#b8462e', '#d8d4cc', '#3d5bd6', '#d14a8a'];
export const PAL = ['#e8362d', '#2a5bd7', '#1f9d55', '#ffc928', '#ff8a1f', '#8a4fd6', '#ff6fae', '#19c3d6', '#f2efe6', '#2b2b33', '#6b4a2e', '#7a8a5a'];
// اللبس: المرسوم (t/p وين يروح لون البلوزة والبنطلون) أو الحقيقي (m موديل، v نسخة الألوان)
export const OUTFITS = [
  { n: 'قروي', m: 'peasant', v: 0 },
  { n: 'قروي ٢', m: 'peasant', v: 1 },
  { n: 'مستكشف', m: 'ranger', v: 0, hood: 1 },
  { n: 'مستكشف ٢', m: 'ranger', v: 1, hood: 1 },
  { n: 'تيشيرت', top: [1, 1, 0], pants: [1, 1], shoe: 1 },
  { n: 'هودي', top: [1, 1, 1], pants: [1, 1], shoe: 1 },
  { n: 'ثوب / عباية', top: [1, 1, 1], pants: [0, 0], long: 1, shoe: 0 }
];
// الوحش
export const MFORMS = ['المسخ', 'العروس', 'صاحب القلنسوة', 'الزومبي'];
export const MSKINS = [['شاحب', '#d6d2c6'], ['رمادي ميت', '#8e958a'], ['محروق', '#4a3b33'], ['دموي', '#c08a7c']];
export const MEYES = [['أحمر', '#ff1a0a'], ['أبيض', '#dff2ff'], ['أصفر', '#ffbf1a'], ['أسود', '#000000']];
export const MTALL = [['عادي', 1.04], ['طويل', 1.16], ['عملاق', 1.3]];
export const DEFAULT_LOOK = { b: 0, s: 1, h: 2, hc: 1, o: 0, c1: 1, c2: 9, bd: 0, mf: 0, ms: 0, me: 0, mt: 1 };
const LIM = { b: 2, s: SKINS.length, h: HAIRS.length, hc: HAIRC.length, o: OUTFITS.length, c1: PAL.length, c2: PAL.length, bd: 2, mf: MFORMS.length, ms: MSKINS.length, me: MEYES.length, mt: MTALL.length };
export const cleanLook = l => { const L = l || {}, o = {}; for (const k in LIM) { const v = +L[k]; o[k] = Number.isInteger(v) && v >= 0 && v < LIM[k] ? v : DEFAULT_LOOK[k]; } return o; };

const A = { ready: null, body: [], hair: {}, beard: null, clips: {}, outfit: {}, otex: {} };
const GROUPS = [/^spine|^clavicle/, /^upperarm/, /^lowerarm/, /^pelvis$/, /^thigh|^calf/, /^foot|^ball/];
// لكل نقطة: كم تتبع كل مجموعة عظام (صدر، عضد، ساعد، حوض، رجل، قدم) + الراس
function clothAttrs(mesh) {
  const g = mesh.geometry; if (g.getAttribute('cl0')) return;
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight'), n = si.count, bones = mesh.skeleton.bones;
  const grp = bones.map(b => GROUPS.findIndex(r => r.test(b.name))), head = bones.map(b => /^Head$|^neck/.test(b.name) ? 1 : 0), hand = bones.map(b => /^hand|thumb|index|middle|ring|pinky/.test(b.name) ? 1 : 0);
  const a0 = new Float32Array(n * 4), a1 = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) {
    const bi = si.getComponent(i, k), w = sw.getComponent(i, k); if (!w) continue;
    const gi = grp[bi];
    if (gi >= 0 && gi < 4) a0[i * 4 + gi] += w; else if (gi >= 4) a1[i * 4 + gi - 4] += w;
    a1[i * 4 + 2] += head[bi] * w; a1[i * 4 + 3] += hand[bi] * w;
  }
  g.setAttribute('cl0', new THREE.BufferAttribute(a0, 4)); g.setAttribute('cl1', new THREE.BufferAttribute(a1, 4));
}
function toLambert(m) { const L = new THREE.MeshLambertMaterial({ map: m.map, color: m.color, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side }); L.name = m.name; return L; }
// شيدر الجسم: نلوّن مناطق الملابس فوق الخامة، أو نخفي الجسم (لما يلبس لبس حقيقي)، أو جلد الوحش
function bodyMat(src) {
  const m = toLambert(src);
  const U = { uSkin: { value: new THREE.Color() }, uTop: { value: new THREE.Color() }, uPants: { value: new THREE.Color() }, uShoe: { value: new THREE.Color('#2a211b') }, uTopM: { value: new THREE.Vector3(1, 1, 1) }, uPantsM: { value: new THREE.Vector2(1, 1) }, uShoeM: { value: 1 }, uLong: { value: 0 }, uGlow: { value: new THREE.Color(0) }, uHide: { value: 0 }, uMon: { value: 0 }, uBlood: { value: 0 }, uVoid: { value: 0 } };
  m.userData.U = U;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec4 cl0; attribute vec4 cl1; varying vec4 vC0; varying vec4 vC1;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvC0 = cl0; vC1 = cl1;');
    sh.fragmentShader = `uniform vec3 uSkin, uTop, uPants, uShoe, uTopM, uGlow; uniform vec2 uPantsM; uniform float uShoeM, uLong, uHide, uMon, uBlood, uVoid; varying vec4 vC0; varying vec4 vC1;
      float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float nz(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hh(i), hh(i + vec2(1, 0)), f.x), mix(hh(i + vec2(0, 1)), hh(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * nz(p); p *= 2.1; a *= .5; } return s; }
` + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if (uHide > .5 && vC1.z < .45 && vC1.w < .5) discard;
      float lum = dot(diffuseColor.rgb, vec3(.3,.59,.11));
      #ifdef USE_MAP
      vec2 uv0 = vMapUv;
      #else
      vec2 uv0 = vec2(0.);
      #endif
      if (uMon > .5) {
        // جلد ميت: عروق، بقع، وخطوط سودا
        float n1 = fbm(uv0 * 38.), n2 = fbm(uv0 * 9. + 3.1);
        float vein = smoothstep(.06, 0., abs(n1 - .5)) * .7;
        vec3 col = uSkin * (.55 + lum * .9) * (.75 + n2 * .45);
        col = mix(col, vec3(.08, .1, .12), vein * .6);
        col = mix(col, vec3(.35, .02, .02), smoothstep(.62, .78, fbm(uv0 * 6. + 9.)) * uBlood);
        col *= 1. - smoothstep(.55, .9, vC1.z) * .25;
        if (uLong > .5) { float tm = smoothstep(.3, .62, clamp(vC0.x * uTopM.x + vC0.y * uTopM.y, 0., 1.)); vec3 cl = uTop * (.75 + n2 * .35); cl = mix(cl, vec3(.3, .03, .02), smoothstep(.6, .75, fbm(uv0 * 5. + 2.)) * .8); col = mix(col, cl, tm); }
        if (uVoid > .5) col = mix(col, vec3(.012, .01, .01), smoothstep(.4, .7, vC1.z));
        diffuseColor.rgb = col;
      } else {
        float sh = clamp(.9 + (lum - .45) * .22, .72, 1.02);
        vec2 wv = uv0 * 700.;
        float weave = .95 + .05 * sin(wv.x) * sin(wv.y);
        vec3 col = diffuseColor.rgb * uSkin;
        float top = clamp(vC0.x * uTopM.x + vC0.y * uTopM.y + vC0.z * uTopM.z, 0., 1.);
        float hip = vC0.w, leg = vC1.x;
        float pants = clamp(hip * uPantsM.x + leg * uPantsM.y, 0., 1.);
        float robe = uLong * clamp(hip + leg, 0., 1.);
        float tm = smoothstep(.3, .62, top + robe), pm = smoothstep(.3, .62, pants) * (1. - uLong);
        float seam = (1. - abs(tm * 2. - 1.)) * step(.02, tm) + (1. - abs(pm * 2. - 1.)) * step(.02, pm);
        col = mix(col, uTop * sh * weave, tm);
        col = mix(col, uPants * sh * weave, pm);
        col = mix(col, uShoe * sh, smoothstep(.35, .7, vC1.y) * uShoeM);
        col *= 1. - seam * .35;
        diffuseColor.rgb = col;
      }`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uGlow;');
  };
  m.customProgramCacheKey = () => 'hbody3';
  return m;
}
function hairMat(src) {
  const m = toLambert(src); const U = { uHair: { value: new THREE.Color() } }; m.userData.U = U;
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U); sh.fragmentShader = 'uniform vec3 uHair;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat hl = dot(diffuseColor.rgb, vec3(.3,.59,.11));\ndiffuseColor.rgb = uHair * (.35 + hl * 1.6);'); };
  m.customProgramCacheKey = () => 'hhair';
  return m;
}
// لبس حقيقي: نلوّن الجلد اللي يطلع منه (اليدين) بلون البشرة، ونقدر نوسّخه للزومبي
function outfitMat(src, skin, tex, dirt) {
  const m = toLambert(src); if (tex) m.map = tex;
  const isSkin = /Regular/i.test(src.name);
  const U = { uSkin: { value: new THREE.Color(skin || '#ffffff') }, uDirt: { value: dirt || 0 }, uIsSkin: { value: isSkin ? 1 : 0 } }; m.userData.U = U;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = 'uniform vec3 uSkin; uniform float uDirt, uIsSkin;\nfloat hh2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat nz2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hh2(i), hh2(i + vec2(1, 0)), f.x), mix(hh2(i + vec2(0, 1)), hh2(i + vec2(1, 1)), f.x), f.y); }\nfloat fbm2(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * nz2(p); p *= 2.1; a *= .5; } return s; }\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if (uIsSkin > .5) { float l = dot(diffuseColor.rgb, vec3(.3,.59,.11)); diffuseColor.rgb = uSkin * (.3 + l * .62); }
      if (uDirt > 0.) {
        #ifdef USE_MAP
        vec2 q = vMapUv;
        #else
        vec2 q = vec2(0.);
        #endif
        float d = fbm2(q * 7.), sp = fbm2(q * 23. + 5.);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.42, .4, .34) * (.8 + sp * .4), uDirt);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.2, .02, .012) * (.7 + sp * .6), smoothstep(.6, .72, d + sp * .12) * uDirt * .9);
      }`);
  };
  m.customProgramCacheKey = () => 'houtfit';
  return m;
}

export function load() {
  if (A.ready) return A.ready;
  return A.ready = (async () => {
    const [male, female, anims, anims2, ...hair] = await Promise.all([get('male.glb'), get('female.glb'), get('anims.glb'), get('anims2.glb').catch(() => null), get('h_beard.glb'), ...HAIRS.slice(1).map(h => get(h.f + '.glb'))]);
    A.body = [male, female];
    [male, female].forEach(g => g.scene.traverse(o => { if (o.isSkinnedMesh) { clothAttrs(o); o.frustumCulled = false; } }));
    A.beard = hair[0]; HAIRS.slice(1).forEach((h, i) => { A.hair[h.f] = hair[i + 1]; });
    anims.animations.forEach(c => { A.clips[c.name] = c; });
    if (anims2) anims2.animations.forEach(c => { A.clips[c.name] = c; });
    return A;
  })();
}
// اللبس الحقيقي ينحمل بس لما أحد يلبسه
function loadOutfit(b, m) {
  const k = (b ? 'female_' : 'male_') + m;
  return A.outfit[k] || (A.outfit[k] = get('o_' + k + '.glb'));
}
function loadOTex(name) {
  return A.otex[name] || (A.otex[name] = new Promise(ok => texL.load(DIR + name + V, t => { t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; ok(t); }, undefined, () => ok(null))));
}

// نركّب قطعة مربوطة بهيكل ثاني (شعر، لبس) على هيكل الشخصية بأسماء العظام
function rebind(root, bones, gltf, matFn) {
  const sc = SkeletonUtils.clone(gltf.scene), out = [];
  sc.traverse(o => { if (o.isSkinnedMesh) out.push(o); });
  out.forEach(hm => {
    const bs = hm.skeleton.bones.map(b => bones[b.name] || bones.Head);
    hm.removeFromParent(); hm.bind(new THREE.Skeleton(bs, hm.skeleton.boneInverses), hm.bindMatrix);
    hm.material = matFn(hm.material, hm); hm.frustumCulled = false; hm.castShadow = true;
    root.add(hm);
  });
  return out;
}
function attachHair(root, bones, gltf, color) {
  return rebind(root, bones, gltf, m => { const h = hairMat(m); h.userData.U.uHair.value.set(color); return h; })[0] || null;
}

// قطعة مرسومة مربوطة بالهيكل
function bindPos(sk, name) { const i = sk.bones.findIndex(b => b.name === name); const m = new THREE.Matrix4().copy(sk.boneInverses[i]).invert(); return { i, p: new THREE.Vector3().setFromMatrixPosition(m) }; }
function skinPiece(body, geo, mat) { const m = new THREE.SkinnedMesh(geo, mat); m.bind(body.skeleton, body.bindMatrix); m.frustumCulled = false; m.castShadow = true; return m; }
// الثوب/العباية/فستان العروس: تنورة طويلة تتبع الرجلين
function robe(body, color, ghost) {
  const sk = body.skeleton, P = bindPos(sk, 'pelvis'), TL = bindPos(sk, 'thigh_l'), TR = bindPos(sk, 'thigh_r'), CL = bindPos(sk, 'calf_l'), CR = bindPos(sk, 'calf_r'), FL = bindPos(sk, 'foot_l');
  const y0 = P.p.y + .06, y1 = FL.p.y - .03, seg = 32, rings = 14, cx = P.p.x, cz = P.p.z + .01, lx = Math.sign(TL.p.x - cx) || 1;
  const pos = [], idx = [], si = [], sw = [], uv = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    for (let k = 0; k <= seg; k++) {
      const a = k / seg * Math.PI * 2, rx = (ghost ? .17 : .16) + t * (ghost ? .15 : .075), rz = (ghost ? .13 : .12) + t * (ghost ? .13 : .085);
      let y = y0 - (y0 - y1) * t; if (ghost && r === rings) y += (k % 2 ? .16 : 0) + Math.sin(k * 3.7) * .06;
      const x = Math.sin(a), z = Math.cos(a), wob = ghost ? 1 + Math.sin(k * 2.3 + r) * .04 * t : 1;
      pos.push(cx + x * rx * wob, y, cz + z * rz * wob); uv.push(k / seg, t);
      const side = Math.min(1, Math.abs(x) * 1.5), legW = THREE.MathUtils.smoothstep(t, .12, .75) * side, calfW = THREE.MathUtils.smoothstep(t, .5, .95);
      const left = x * lx > 0, th = left ? TL : TR, ca = left ? CL : CR;
      si.push(P.i, th.i, ca.i, P.i); sw.push(1 - legW, legW * (1 - calfW), legW * calfW, 0);
    }
  }
  for (let r = 0; r < rings; r++) for (let k = 0; k < seg; k++) { const a = r * (seg + 1) + k, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
  if (ghost) mat.map = ragTex();
  return skinPiece(body, g, mat);
}
// خامة قماش ممزّق ومتوسّخ (للعروس)
let RAG = null;
function ragTex() {
  if (RAG) return RAG;
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#e8e2d2'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(80,70,55,${Math.random() * .25})`; x.lineWidth = 1 + Math.random() * 3; x.beginPath(); const sx = Math.random() * 256; x.moveTo(sx, 0); x.bezierCurveTo(sx + 10, 80, sx - 10, 160, sx + Math.random() * 20, 256); x.stroke(); }
  for (let i = 0; i < 14; i++) { const r = 8 + Math.random() * 30, g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(110,8,6,.55)'); g.addColorStop(1, 'rgba(110,8,6,0)'); x.save(); x.translate(Math.random() * 256, 120 + Math.random() * 136); x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2); x.restore(); }
  const g2 = x.createLinearGradient(0, 0, 0, 256); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(40,30,20,.55)'); x.fillStyle = g2; x.fillRect(0, 0, 256, 256);
  RAG = new THREE.CanvasTexture(c); RAG.colorSpace = THREE.SRGBColorSpace; RAG.wrapS = RAG.wrapT = THREE.RepeatWrapping;
  return RAG;
}
// قبعة الهودي ورا الرقبة
function hood(body, color) {
  const sk = body.skeleton, N = bindPos(sk, 'neck_01'), S3 = bindPos(sk, 'spine_03');
  const g = new THREE.SphereGeometry(.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.05, .75, .6); g.rotateX(-Math.PI / 2 - .35);
  g.translate(N.p.x, N.p.y - .02, N.p.z - .1);
  const n = g.attributes.position.count; g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Array(n).fill(0).flatMap(() => [S3.i, 0, 0, 0]), 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Array(n).fill(0).flatMap(() => [1, 0, 0, 0]), 4));
  return skinPiece(body, g, new THREE.MeshLambertMaterial({ color }));
}

// ---------- أجزاء الوحش (مربوطة بعظمة الراس واليدين) ----------
// نحسب مكان العيون بإحداثيات عظمة الراس (من وضع الوقوف الأصلي)
function eyeSpots(root, bones) {
  let eye = null; root.traverse(o => { if (o.isSkinnedMesh && /Eye/i.test(o.material.name)) eye = o; });
  if (!eye) return null;
  const sk = eye.skeleton, hi = sk.bones.findIndex(b => b.name === 'Head'); if (hi < 0) return null;
  const M = new THREE.Matrix4().multiplyMatrices(sk.boneInverses[hi], eye.bindMatrix), P = eye.geometry.attributes.position, v = new THREE.Vector3();
  const L = new THREE.Vector3(), R = new THREE.Vector3(); let nl = 0, nr = 0;
  const pts = []; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); pts.push(v.clone()); }
  // نقسمهم يمين ويسار حسب المحور اللي فيه أكبر فرق
  const bb = new THREE.Box3().setFromPoints(pts), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
  const ax = sz.x >= sz.z ? 'x' : 'z';
  pts.forEach(p => { if (p[ax] > c[ax]) { L.add(p); nl++; } else { R.add(p); nr++; } });
  L.divideScalar(nl || 1); R.divideScalar(nr || 1);
  // قدّام = بعيد عن محور العظمة (Y)
  const mid = L.clone().add(R).multiplyScalar(.5), fwd = new THREE.Vector3(mid.x, 0, mid.z).normalize(), side = L.clone().sub(R).normalize();
  return { L, R, mid, fwd, side, up: new THREE.Vector3(0, 1, 0), span: L.distanceTo(R) };
}
let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,255,255,.85)'); g.addColorStop(.4, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); GLOW = new THREE.CanvasTexture(c); return GLOW;
}
// عيون تلمع بالظلام
function glowEyes(head, E, color) {
  const g = new THREE.Group(); head.add(g);
  const sockM = new THREE.MeshBasicMaterial({ color: 0x050303 });
  [E.L, E.R].forEach(p => {
    const sock = new THREE.Mesh(new THREE.SphereGeometry(E.span * .38, 10, 8), sockM); sock.position.copy(p).addScaledVector(E.fwd, E.span * .05); sock.scale.set(1, 1.15, .55); g.add(sock);
    if (color === '#000000') return;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(E.span * .1, 8, 6), new THREE.MeshBasicMaterial({ color })); pupil.position.copy(p).addScaledVector(E.fwd, E.span * .22); g.add(pupil);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(p).addScaledVector(E.fwd, E.span * .3); s.scale.setScalar(E.span * 1.5); g.add(s); g.userData.glow = (g.userData.glow || []).concat(s);
  });
  return g;
}
// فم مشقوق بأسنان
function tornMouth(head, E, wide) {
  const g = new THREE.Group(); head.add(g);
  const s = E.span, c = E.mid.clone().addScaledVector(E.up, -s * 1.25).addScaledVector(E.fwd, s * .18);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0x0a0202, side: THREE.DoubleSide }));
  mouth.scale.set(s * (wide ? 1.15 : .65), s * (wide ? .55 : 1.05), 1);
  const q = new THREE.Matrix4().makeBasis(E.side, E.up, E.fwd); mouth.quaternion.setFromRotationMatrix(q); mouth.position.copy(c); g.add(mouth);
  const gum = new THREE.Mesh(new THREE.RingGeometry(.86, 1.08, 20), new THREE.MeshLambertMaterial({ color: 0x4a0a0a, side: THREE.DoubleSide })); gum.scale.copy(mouth.scale); gum.quaternion.copy(mouth.quaternion); gum.position.copy(c).addScaledVector(E.fwd, .001); g.add(gum);
  const toothM = new THREE.MeshLambertMaterial({ color: 0xd8d0b0 }), tg = new THREE.ConeGeometry(s * .07, s * .3, 4);
  const n = wide ? 14 : 10;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, t = new THREE.Mesh(tg, toothM);
    const px = Math.cos(a) * mouth.scale.x * .9, py = Math.sin(a) * mouth.scale.y * .9;
    t.position.copy(c).addScaledVector(E.side, px).addScaledVector(E.up, py).addScaledVector(E.fwd, s * .02);
    // السن يأشر لداخل الفم
    const dir = new THREE.Vector3().addScaledVector(E.side, -px).addScaledVector(E.up, -py).normalize();
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); t.scale.y = .7 + Math.random() * .7; g.add(t);
  }
  return g;
}
// مخالب طويلة على كل إصبع
function claws(bones) {
  const m = new THREE.MeshLambertMaterial({ color: 0x1a1612 }), geo = new THREE.ConeGeometry(.007, .11, 5); geo.translate(0, .07, 0);
  ['l', 'r'].forEach(sd => ['index', 'middle', 'ring', 'pinky', 'thumb'].forEach(f => {
    const b = bones[f + '_03_' + sd]; if (!b) return;
    const c = new THREE.Mesh(geo, m); c.scale.y = f === 'thumb' ? .7 : 1 + Math.random() * .3; c.rotation.x = .25; b.add(c);
  }));
}
// ستارة شعر طويل تغطي الوجه (العروس): مربوطة بالراس فوق والصدر تحت عشان تتدلّى
function hairVeil(body, E) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d');
  for (let i = 0; i < 260; i++) { const sx = 6 + Math.random() * 116, len = 150 + Math.random() * 106; x.strokeStyle = `rgba(5,4,4,${.55 + Math.random() * .45})`; x.lineWidth = 1 + Math.random() * 2.2; x.beginPath(); x.moveTo(sx, 0); x.bezierCurveTo(sx + Math.random() * 10 - 5, len * .35, sx + Math.random() * 16 - 8, len * .7, sx + Math.random() * 22 - 11, len); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sk = body.skeleton, hi = sk.bones.findIndex(b => b.name === 'Head'), ni = sk.bones.findIndex(b => b.name === 'neck_01'), si3 = sk.bones.findIndex(b => b.name === 'spine_03');
  const G = new THREE.Matrix4().copy(body.bindMatrix).invert().multiply(new THREE.Matrix4().copy(sk.boneInverses[hi]).invert());
  const s = E.span, w = s * 3.6, h = s * 11, cols = 10, rows = 12, pos = [], uv = [], si = [], sw = [], idx = [];
  const top = E.mid.clone().addScaledVector(E.up, s * 1.5).addScaledVector(E.fwd, s * .55), v = new THREE.Vector3();
  for (let r = 0; r <= rows; r++) for (let k = 0; k <= cols; k++) {
    const u = k / cols - .5, tt = r / rows;
    v.copy(top).addScaledVector(E.side, u * w * (1 + tt * .35)).addScaledVector(E.up, -tt * h).addScaledVector(E.fwd, -Math.pow(u * 2, 2) * s * .9 + Math.sin(tt * 3) * s * .25).applyMatrix4(G);
    pos.push(v.x, v.y, v.z); uv.push(k / cols, 1 - tt);
    const wh = Math.max(0, 1 - tt * 2.2), ws = Math.max(0, tt * 1.6 - .5), wn = Math.max(0, 1 - wh - ws);
    si.push(hi, ni, si3, hi); sw.push(wh, wn, ws, 0);
  }
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const a = r * (cols + 1) + k, b = a + cols + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.computeVertexNormals();
  t.flipY = true;
  return skinPiece(body, g, new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: .3, side: THREE.DoubleSide, color: 0x1c1616 }));
}

// نبني شخصية: look = اختيارات اللاعب. ghost = الوحش
export function makeChar(look, ghost) {
  look = cleanLook(look);
  const form = ghost ? look.mf : -1;
  const bodyIdx = ghost ? (form === 1 ? 1 : 0) : look.b;
  const src = A.body[bodyIdx], root = SkeletonUtils.clone(src.scene), bones = {}, mats = [];
  root.traverse(o => { if (o.isBone) bones[o.name] = o; });
  let eyeMesh = null, brow = null;
  root.traverse(o => {
    if (!o.isSkinnedMesh) return;
    o.frustumCulled = false; o.castShadow = true;
    if (/Superhero/i.test(o.material.name)) { o.material = bodyMat(o.material); mats.push(o.material); }
    else if (/Eye/i.test(o.material.name)) { o.material = toLambert(o.material); eyeMesh = o; }
    else { o.material = hairMat(o.material); o.material.userData.U.uHair.value.set(ghost ? '#0a0808' : HAIRC[look.hc]); brow = o; }
  });
  const U = mats[0].userData.U, O = OUTFITS[look.o]; let body = null; root.traverse(o => { if (o.isSkinnedMesh && o.material === mats[0]) body = o; });
  const shade = c => new THREE.Color(c).multiplyScalar(.82);
  const ch = { root, bones, mats, ghost: !!ghost, extras: [] };
  const wearOutfit = (m, v, dirt, skin) => {
    const p = Promise.all([loadOutfit(bodyIdx, m), v ? loadOTex(m === 'peasant' ? 'o_peasant_2.webp' : 'o_ranger_3.webp') : null]).then(([gl, tex]) => {
      const parts = rebind(root, bones, gl, (mt, mesh) => outfitMat(mt, skin, /Regular/i.test(mt.name) ? null : tex, dirt));
      ch.outfit = parts; U.uHide.value = 1; return parts;
    }).catch(e => { console.warn('outfit', e); U.uHide.value = 0; });
    ch.ready = p; return p;
  };
  if (ghost) {
    const ms = MSKINS[look.ms][1], ec = MEYES[look.me][1];
    U.uMon.value = 1; U.uSkin.value.set(ms); U.uBlood.value = look.ms === 3 ? 1 : .35; U.uGlow.value.set(form === 2 ? '#000' : '#0c0a0a');
    if (brow) brow.visible = false; if (eyeMesh) eyeMesh.visible = false;
    const E = eyeSpots(root, bones);
    if (form === 0) { // المسخ: جلد ميت، فم مشقوق، مخالب، شعر قليل
      U.uLong.value = 0;
      if (E) { ch.extras.push(glowEyes(bones.Head, E, ec), tornMouth(bones.Head, E, true)); }
      attachHair(root, bones, A.hair.h_buzzed, '#1a1614');
    } else if (form === 1) { // العروس: فستان ممزّق وشعر يغطي وجهها
      if (E) { ch.extras.push(glowEyes(bones.Head, E, ec), tornMouth(bones.Head, E, false)); body.parent.add(hairVeil(body, E)); }
      attachHair(root, bones, A.hair.h_long, '#060404');
      U.uTop.value.set('#d8d2c2'); U.uTopM.value.set(1, 1, 0); U.uLong.value = 1;
      body.parent.add(robe(body, '#d8d2c2', true));
    } else if (form === 2) { // صاحب القلنسوة: وجه أسود وعيون تلمع
      U.uSkin.value.set('#3a3230'); U.uVoid.value = 1;
      if (E) ch.extras.push(glowEyes(bones.Head, E, ec === '#000000' ? '#ff1a0a' : ec));
      wearOutfit('ranger', 1, .85, '#151112').then(parts => (parts || []).forEach(p => { if (p.material.userData.U) p.material.color.multiplyScalar(.45); }));
    } else { // الزومبي: لبس قروي وسخ ودم
      if (E) ch.extras.push(glowEyes(bones.Head, E, ec), tornMouth(bones.Head, E, true));
      attachHair(root, bones, A.hair.h_simpleparted, '#2a2420');
      wearOutfit('peasant', 0, 1, ms);
    }
    claws(bones);
    // جسم أطول ونحيف وأيادي طويلة
    const T = MTALL[look.mt][1];
    root.scale.setScalar(T);
    ['upperarm_l', 'upperarm_r'].forEach(n => { if (bones[n]) bones[n].scale.set(.85, 1.18, .85); });
    ['lowerarm_l', 'lowerarm_r'].forEach(n => { if (bones[n]) bones[n].position.y *= 1.12; });
    ['hand_l', 'hand_r'].forEach(n => { if (bones[n]) { bones[n].position.y *= 1.08; bones[n].scale.set(1.1, 1.25, 1.1); } });
    if (bones.Head) bones.Head.position.y *= form === 1 ? 1.25 : 1.7;
    ['spine_02', 'spine_03'].forEach(n => { if (bones[n]) bones[n].scale.set(.9, 1, .9); });
    if (bones.spine_03) bones.spine_03.scale.set(.92, 1.06, .88);
  } else {
    U.uSkin.value.set(SKINS[look.s]);
    if (O.m) {
      wearOutfit(O.m, O.v, 0, SKINS[look.s]);
      const h = HAIRS[look.h]; if (h.f && !O.hood) attachHair(root, bones, A.hair[h.f], HAIRC[look.hc]);
      if (look.bd && look.b === 0) attachHair(root, bones, A.beard, HAIRC[look.hc]);
    } else {
      U.uTop.value.set(PAL[look.c1]); U.uPants.value.set(PAL[look.c2]);
      U.uTopM.value.set(...O.top); U.uPantsM.value.set(...O.pants); U.uLong.value = O.long || 0; U.uShoeM.value = O.shoe;
      if (O.long) { U.uShoe.value.set('#6b4a2e'); body.parent.add(robe(body, shade(PAL[look.c1]))); }
      if (look.o === 5) body.parent.add(hood(body, shade(PAL[look.c1])));
      const h = HAIRS[look.h]; if (h.f) attachHair(root, bones, A.hair[h.f], HAIRC[look.hc]);
      if (look.bd && look.b === 0) attachHair(root, bones, A.beard, HAIRC[look.hc]);
    }
  }
  const mixer = new THREE.AnimationMixer(root), acts = {};
  let cur = null, curName = '';
  // الوحش: نحذف حركة المكان من الأطراف (عشان التطويل يثبت) ونخلي الحوض بس
  const clipFor = name => {
    const c = A.clips[name]; if (!c || !ghost) return c;
    const k = name + '#m'; if (A.clips[k]) return A.clips[k];
    return A.clips[k] = new THREE.AnimationClip(k, c.duration, c.tracks.filter(t => !/\.position$/.test(t.name) || /^(root|pelvis)\./.test(t.name)));
  };
  const qa = new THREE.Quaternion(), ax = new THREE.Vector3(1, 0, 0), az = new THREE.Vector3(0, 0, 1);
  Object.assign(ch, {
    mixer,
    play(name, fade = .25, speed = 1) {
      const c = clipFor(name); if (!c) return;
      const a = acts[name] || (acts[name] = mixer.clipAction(c));
      a.timeScale = speed;
      if (cur === a) return a;
      a.reset(); a.enabled = true; a.setEffectiveWeight(1);
      if (/Death|Interact|Punch|PickUp|Hit|Scratch/.test(name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      if (cur) a.crossFadeFrom(cur, fade, false); a.play(); cur = a; curName = name; return a;
    },
    update(dt) {
      mixer.update(dt);
      if (!ghost) return;
      // انحناءة مخيفة: الظهر محني والراس مايل ويرجف
      const t = performance.now() / 1000, B = bones;
      if (B.spine_02) B.spine_02.quaternion.multiply(qa.setFromAxisAngle(ax, .07));
      if (B.spine_03) B.spine_03.quaternion.multiply(qa.setFromAxisAngle(ax, .05));
      if (B.neck_01) B.neck_01.quaternion.multiply(qa.setFromAxisAngle(ax, -.25));
      if (B.Head) { B.Head.quaternion.multiply(qa.setFromAxisAngle(az, (form === 1 ? .5 : .32) + Math.sin(t * .9) * .08 + (Math.random() < .03 ? (Math.random() - .5) * .5 : 0))); }
      ch.extras.forEach(g => (g.userData.glow || []).forEach(s => { s.material.opacity = .75 + Math.sin(t * 7 + s.id) * .2; }));
    },
    get anim() { return curName; }
  });
  ch.play(ghost ? 'Zombie_Idle_Loop' : 'Idle_Loop', 0);
  if (!ch.ready) ch.ready = Promise.resolve();
  return ch;
}
export { THREE };
// تحميل أي موديل glb (للأثاث)
export const loadGLB = url => new Promise((ok, no) => loader.load(url, ok, undefined, no));
