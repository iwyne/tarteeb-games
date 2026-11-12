// شخصيات البيت المسكون: موديلات Quaternius (رخصة CC0) + حركات Universal Animation Library.
// الموديلات الأصلية بدون ملابس، فنلبّسهم بالشيدر: كل نقطة بالجسم نعرف أي عظمة تحركها،
// فنلوّن الصدر والذراعين بلون البلوزة، والحوض والرجلين بلون البنطلون، والقدم بلون الجزمة.
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import * as SkeletonUtils from './vendor/SkeletonUtils.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';

const DIR = 'haunt/';
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const get = f => new Promise((ok, no) => loader.load(DIR + f + '?v=1', ok, undefined, no));

export const BODIES = ['رجل', 'بنت'];
export const HAIRS = [{ n: 'بدون', f: null }, { n: 'قصير', f: 'h_buzzed' }, { n: 'مفروق', f: 'h_simpleparted' }, { n: 'طويل', f: 'h_long' }, { n: 'كعكة', f: 'h_buns' }, { n: 'قصير ناعم', f: 'h_buzzedfemale' }];
export const SKINS = ['#f2d6c4', '#d9a882', '#a8734f', '#6e4630'];
export const HAIRC = ['#1b1512', '#4a2e1c', '#8a5a2e', '#c9a25a', '#b8462e', '#d8d4cc', '#3d5bd6', '#d14a8a'];
export const PAL = ['#e8362d', '#2a5bd7', '#1f9d55', '#ffc928', '#ff8a1f', '#8a4fd6', '#ff6fae', '#19c3d6', '#f2efe6', '#2b2b33', '#6b4a2e', '#7a8a5a'];
// ستايل اللبس: وين يروح لون البلوزة (t) والبنطلون (p)
export const OUTFITS = [
  { n: 'تيشيرت', top: [1, 1, 0], pants: [1, 1], shoe: 1 },
  { n: 'هودي', top: [1, 1, 1], pants: [1, 1], shoe: 1 },
  { n: 'ثوب / عباية', top: [1, 1, 1], pants: [0, 0], long: 1, shoe: 0 }
];
export const DEFAULT_LOOK = { b: 0, s: 1, h: 2, hc: 1, o: 1, c1: 1, c2: 9, bd: 0 };
export const cleanLook = l => {
  const n = (v, max, d) => Number.isInteger(+v) && +v >= 0 && +v < max ? +v : d, L = l || {};
  return { b: n(L.b, 2, 0), s: n(L.s, SKINS.length, 1), h: n(L.h, HAIRS.length, 2), hc: n(L.hc, HAIRC.length, 1), o: n(L.o, OUTFITS.length, 1), c1: n(L.c1, PAL.length, 1), c2: n(L.c2, PAL.length, 9), bd: n(L.bd, 2, 0) };
};

const A = { ready: null, body: [], hair: {}, beard: null, clips: {} };
const GROUPS = [/^spine|^clavicle/, /^upperarm/, /^lowerarm/, /^pelvis$/, /^thigh|^calf/, /^foot|^ball/];
// لكل نقطة: كم تتبع كل مجموعة عظام (صدر، عضد، ساعد، حوض، رجل، قدم)
function clothAttrs(mesh) {
  const g = mesh.geometry; if (g.getAttribute('cl0')) return;
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight'), n = si.count, bones = mesh.skeleton.bones;
  const grp = bones.map(b => GROUPS.findIndex(r => r.test(b.name)));
  const a0 = new Float32Array(n * 4), a1 = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) {
    const gi = grp[si.getComponent(i, k)], w = sw.getComponent(i, k); if (gi < 0 || !w) continue;
    if (gi < 4) a0[i * 4 + gi] += w; else a1[i * 2 + gi - 4] += w;
  }
  g.setAttribute('cl0', new THREE.BufferAttribute(a0, 4)); g.setAttribute('cl1', new THREE.BufferAttribute(a1, 2));
}
function toLambert(m) { const L = new THREE.MeshLambertMaterial({ map: m.map, color: m.color, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side }); L.name = m.name; return L; }
// شيدر الجسم: نلوّن مناطق الملابس فوق الخامة
function bodyMat(src) {
  const m = toLambert(src);
  const U = { uSkin: { value: new THREE.Color() }, uTop: { value: new THREE.Color() }, uPants: { value: new THREE.Color() }, uShoe: { value: new THREE.Color('#2a211b') }, uTopM: { value: new THREE.Vector3(1, 1, 1) }, uPantsM: { value: new THREE.Vector2(1, 1) }, uShoeM: { value: 1 }, uLong: { value: 0 }, uGlow: { value: new THREE.Color(0) } };
  m.userData.U = U;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec4 cl0; attribute vec2 cl1; varying vec4 vC0; varying vec2 vC1;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvC0 = cl0; vC1 = cl1;');
    sh.fragmentShader = 'uniform vec3 uSkin, uTop, uPants, uShoe, uTopM, uGlow; uniform vec2 uPantsM; uniform float uShoeM, uLong; varying vec4 vC0; varying vec2 vC1;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float lum = dot(diffuseColor.rgb, vec3(.3,.59,.11));
      float sh = clamp(.9 + (lum - .45) * .22, .72, 1.02);
      #ifdef USE_MAP
      vec2 wv = vMapUv * 700.;
      #else
      vec2 wv = vec2(0.);
      #endif
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
      diffuseColor.rgb = col;`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uGlow;');
  };
  m.customProgramCacheKey = () => 'hbody';
  return m;
}
function hairMat(src) {
  const m = toLambert(src); const U = { uHair: { value: new THREE.Color() } }; m.userData.U = U;
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U); sh.fragmentShader = 'uniform vec3 uHair;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat hl = dot(diffuseColor.rgb, vec3(.3,.59,.11));\ndiffuseColor.rgb = uHair * (.35 + hl * 1.6);'); };
  m.customProgramCacheKey = () => 'hhair';
  return m;
}

export function load() {
  if (A.ready) return A.ready;
  return A.ready = (async () => {
    const [male, female, anims, ...hair] = await Promise.all([get('male.glb'), get('female.glb'), get('anims.glb'), get('h_beard.glb'), ...HAIRS.slice(1).map(h => get(h.f + '.glb'))]);
    A.body = [male, female];
    [male, female].forEach(g => g.scene.traverse(o => { if (o.isSkinnedMesh) { clothAttrs(o); o.frustumCulled = false; } }));
    A.beard = hair[0]; HAIRS.slice(1).forEach((h, i) => { A.hair[h.f] = hair[i + 1]; });
    anims.animations.forEach(c => { A.clips[c.name] = c; });
    return A;
  })();
}

// نركّب شعر (مربوط بعظمة الراس) على هيكل الشخصية
function attachHair(root, bones, gltf, color) {
  const sc = SkeletonUtils.clone(gltf.scene); let hm = null;
  sc.traverse(o => { if (o.isSkinnedMesh) hm = o; });
  if (!hm) return null;
  const bs = hm.skeleton.bones.map(b => bones[b.name] || bones.Head);
  hm.removeFromParent(); hm.bind(new THREE.Skeleton(bs, hm.skeleton.boneInverses), hm.bindMatrix);
  hm.material = hairMat(hm.material); hm.material.userData.U.uHair.value.set(color); hm.frustumCulled = false;
  root.add(hm); return hm;
}

// قطعة لبس مربوطة بالهيكل: نبنيها بوضع الوقوف الأصلي ونعطي كل نقطة أوزان عظام
function bindPos(sk, name) { const i = sk.bones.findIndex(b => b.name === name); const m = new THREE.Matrix4().copy(sk.boneInverses[i]).invert(); return { i, p: new THREE.Vector3().setFromMatrixPosition(m) }; }
function skinPiece(body, geo, mat) { const m = new THREE.SkinnedMesh(geo, mat); m.bind(body.skeleton, body.bindMatrix); m.frustumCulled = false; m.castShadow = true; return m; }
// الثوب/العباية/فستان الشبح: تنورة طويلة تتبع الرجلين
function robe(body, color, ghost) {
  const sk = body.skeleton, P = bindPos(sk, 'pelvis'), TL = bindPos(sk, 'thigh_l'), TR = bindPos(sk, 'thigh_r'), CL = bindPos(sk, 'calf_l'), CR = bindPos(sk, 'calf_r'), FL = bindPos(sk, 'foot_l');
  const y0 = P.p.y + .06, y1 = FL.p.y - .03, seg = 28, rings = 12, cx = P.p.x, cz = P.p.z + .01, lx = Math.sign(TL.p.x - cx) || 1;
  const pos = [], idx = [], si = [], sw = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    for (let k = 0; k <= seg; k++) {
      const a = k / seg * Math.PI * 2, rx = (ghost ? .17 : .16) + t * (ghost ? .13 : .075), rz = (ghost ? .13 : .12) + t * (ghost ? .12 : .085);
      let y = y0 - (y0 - y1) * t; if (ghost && r === rings) y += (k % 2 ? .12 : 0) + Math.sin(k * 3.7) * .05;
      const x = Math.sin(a), z = Math.cos(a);
      pos.push(cx + x * rx, y, cz + z * rz);
      const side = Math.min(1, Math.abs(x) * 1.5), legW = THREE.MathUtils.smoothstep(t, .12, .75) * side, calfW = THREE.MathUtils.smoothstep(t, .5, .95);
      const left = x * lx > 0, th = left ? TL : TR, ca = left ? CL : CR;
      si.push(P.i, th.i, ca.i, P.i); sw.push(1 - legW, legW * (1 - calfW), legW * calfW, 0);
    }
  }
  for (let r = 0; r < rings; r++) for (let k = 0; k < seg; k++) { const a = r * (seg + 1) + k, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.computeVertexNormals();
  return skinPiece(body, g, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, transparent: !!ghost, opacity: ghost ? .82 : 1 }));
}
// قبعة الهودي ورا الرقبة
function hood(body, color) {
  const sk = body.skeleton, N = bindPos(sk, 'neck_01'), S3 = bindPos(sk, 'spine_03');
  const g = new THREE.SphereGeometry(.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.05, .75, .6); g.rotateX(-Math.PI / 2 - .35);
  g.translate(N.p.x, N.p.y - .02, N.p.z - .1);
  const n = g.attributes.position.count; g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Array(n).fill(0).flatMap(() => [S3.i, 0, 0, 0]), 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Array(n).fill(0).flatMap(() => [1, 0, 0, 0]), 4));
  return skinPiece(body, g, new THREE.MeshLambertMaterial({ color }));
}

// نبني شخصية: look = اختيارات اللاعب. ghost = نسخة الشبح
export function makeChar(look, ghost) {
  look = cleanLook(look);
  const src = A.body[ghost ? 1 : look.b], root = SkeletonUtils.clone(src.scene), bones = {}, mats = [];
  root.traverse(o => { if (o.isBone) bones[o.name] = o; });
  root.traverse(o => {
    if (!o.isSkinnedMesh) return;
    o.frustumCulled = false; o.castShadow = true;
    if (/Superhero/i.test(o.material.name)) { o.material = bodyMat(o.material); mats.push(o.material); }
    else if (/Eye/i.test(o.material.name)) { o.material = toLambert(o.material); if (ghost) { o.material.map = null; o.material.color.set('#000'); o.material.emissive = new THREE.Color('#5a0000'); } }
    else { o.material = hairMat(o.material); o.material.userData.U.uHair.value.set(ghost ? '#0a0808' : HAIRC[look.hc]); }
  });
  const U = mats[0].userData.U, O = OUTFITS[look.o]; let body = null; root.traverse(o => { if (o.isSkinnedMesh && o.material === mats[0]) body = o; });
  const shade = c => new THREE.Color(c).multiplyScalar(.82);
  if (ghost) {
    U.uSkin.value.set('#c8d0dc'); U.uTop.value.set('#d9d6cc'); U.uLong.value = 1; U.uShoeM.value = 0; U.uTopM.value.set(1, 1, 0); U.uGlow.value.set('#1a2230');
    attachHair(root, bones, A.hair.h_long, '#0a0808');
    body.parent.add(robe(body, '#cfcbbf', true));
  } else {
    U.uSkin.value.set(SKINS[look.s]); U.uTop.value.set(PAL[look.c1]); U.uPants.value.set(PAL[look.c2]);
    U.uTopM.value.set(...O.top); U.uPantsM.value.set(...O.pants); U.uLong.value = O.long || 0; U.uShoeM.value = O.shoe;
    if (O.long) { U.uShoe.value.set('#6b4a2e'); body.parent.add(robe(body, shade(PAL[look.c1]))); }
    if (look.o === 1) body.parent.add(hood(body, shade(PAL[look.c1])));
    const h = HAIRS[look.h]; if (h.f) attachHair(root, bones, A.hair[h.f], HAIRC[look.hc]);
    if (look.bd && look.b === 0) attachHair(root, bones, A.beard, HAIRC[look.hc]);
  }
  const mixer = new THREE.AnimationMixer(root), acts = {};
  let cur = null;
  const ch = {
    root, bones, mixer, mats,
    play(name, fade = .25, speed = 1) {
      const c = A.clips[name]; if (!c) return;
      const a = acts[name] || (acts[name] = mixer.clipAction(c));
      a.timeScale = speed;
      if (cur === a) return a;
      a.reset(); a.enabled = true; a.setEffectiveWeight(1);
      if (/Death|Interact|Punch|PickUp|Hit/.test(name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      if (cur) a.crossFadeFrom(cur, fade, false); a.play(); cur = a; return a;
    },
    update(dt) { mixer.update(dt); }
  };
  ch.play('Idle_Loop', 0);
  return ch;
}
export { THREE };
// تحميل أي موديل glb (للأثاث)
export const loadGLB = url => new Promise((ok, no) => loader.load(url, ok, undefined, no));
