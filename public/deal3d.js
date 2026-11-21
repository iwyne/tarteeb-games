// ترتيب ديل: مجسّمات المعالم (ثري دي) + الأرضية والخشب. موديول ES ينحمل مع three.
// كل معلم يرجع Group قاعدته عند y=0 وطوله تقريباً ٣ وحدات. mat(c, o) يصنع خامة حسب الجودة.
export function makeLandmarks(T, lite) {
  const M = (color, o = {}) => lite ? new T.MeshLambertMaterial(Object.assign({ color }, o.emissive ? { emissive: o.emissive } : {}, o.transparent ? { transparent: true, opacity: o.opacity } : {}, o.side ? { side: o.side } : {}))
    : new T.MeshStandardMaterial(Object.assign({ color, roughness: .8 }, o));
  const flat = c => lite ? new T.MeshLambertMaterial({ color: c, flatShading: true }) : new T.MeshStandardMaterial({ color: c, roughness: .95, flatShading: true });
  const glassTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#d6ecfb'); gr.addColorStop(1, '#5f86a6'); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); g.fillStyle = 'rgba(20,40,60,.35)'; for (let y = 0; y < 512; y += 9) g.fillRect(0, y, 64, 2); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(4, .9); return t; })();
  const glass = lite ? new T.MeshLambertMaterial({ map: glassTex }) : new T.MeshStandardMaterial({ map: glassTex, metalness: .55, roughness: .22 });
  const gold = lite ? new T.MeshLambertMaterial({ color: 0xe7b54a, emissive: 0x3a2604 }) : new T.MeshStandardMaterial({ color: 0xe7b54a, metalness: 1, roughness: .25, emissive: 0x5a3a08, emissiveIntensity: .4 });
  const sand = flat(0xc8773d), mud = flat(0xb98552), dark = M(0x3a2416), white = M(0xf3ead8), green = flat(0x2f6b3c), water = M(0x2d7fd6, { metalness: .2, roughness: .15 });
  const add = (g, geo, mat, x = 0, y = 0, z = 0, o = {}) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz; if (o.s) m.scale.set(...o.s); m.castShadow = !lite; m.receiveShadow = !lite; g.add(m); return m; };
  const box = (w, h, d) => new T.BoxGeometry(w, h, d), cyl = (a, b, h, n = 12) => new T.CylinderGeometry(a, b, h, n), cone = (r, h, n = 8) => new T.ConeGeometry(r, h, n), sph = (r, a = 16, b = 10) => new T.SphereGeometry(r, a, b);
  function palm(g, x, z, h = 1.6, s = 1) {
    const trunk = add(g, cyl(.05 * s, .08 * s, h, 6), M(0x7a5a34), x, h / 2, z);
    const lm = M(0x2f7a3c, { side: T.DoubleSide });
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const l = add(g, new T.PlaneGeometry(.18 * s, .9 * s), lm, x + Math.cos(a) * .32 * s, h + .02, z + Math.sin(a) * .32 * s); l.rotation.set(-Math.PI / 2 + .55, 0, 0); l.rotation.order = 'YXZ'; l.rotation.y = -a + Math.PI / 2; }
    return trunk;
  }
  const B = {
    riyadh(g) {
      const sh = new T.Shape(); sh.moveTo(-.42, 0); sh.bezierCurveTo(-.40, 1.6, -.30, 2.6, -.06, 3.6); sh.lineTo(.06, 3.6); sh.bezierCurveTo(.30, 2.6, .40, 1.6, .42, 0); sh.lineTo(-.42, 0);
      const hole = new T.Path(); hole.moveTo(-.2, 2.55); hole.quadraticCurveTo(0, 2.3, .2, 2.55); hole.bezierCurveTo(.16, 3.0, .06, 3.4, .03, 3.6); hole.lineTo(-.03, 3.6); hole.bezierCurveTo(-.06, 3.4, -.16, 3.0, -.2, 2.55); sh.holes.push(hole);
      add(g, new T.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, curveSegments: 20 }), glass, -.25, 0, -.25);
      add(g, box(.42, .06, .5), white, -.25, 2.55, 0);
      add(g, cone(.42, 2.3, 4), glass, .6, 1.15, .3, { ry: Math.PI / 4 }); add(g, sph(.17), gold, .6, 1.75, .3); add(g, cyl(.015, .015, .7, 5), gold, .6, 2.1, .3);
    },
    ula(g) {
      const body = add(g, new T.IcosahedronGeometry(.9, 2), sand, 0, 1.35, 0, { s: [1.45, .72, .75] });
      const p = body.geometry.attributes.position; for (let i = 0; i < p.count; i++) { p.setY(i, p.getY(i) + Math.sin(p.getX(i) * 7) * .05); p.setX(i, p.getX(i) * (1 + ((i * 7919) % 13) / 220)); } body.geometry.computeVertexNormals();
      add(g, cyl(.42, .55, 1, 7), sand, .75, .5, 0);
      const cv = new T.CatmullRomCurve3([new T.Vector3(-.95, 1.25, 0), new T.Vector3(-1.3, .9, .05), new T.Vector3(-1.35, .4, .1), new T.Vector3(-1.25, .05, .1)]);
      add(g, new T.TubeGeometry(cv, 20, .24, 7), sand);
    },
    jeddah(g) {
      add(g, cyl(.6, .6, .08, 32), water, 0, .04, 0);
      add(g, cyl(.03, .07, 3.4, 10), M(0xffffff, { emissive: 0xbfe4ff, emissiveIntensity: .6, transparent: true, opacity: .85 }), 0, 1.75, 0);
      add(g, new T.ConeGeometry(.45, .9, 20, 1, true), M(0xe8f6ff, { transparent: true, opacity: .45, side: T.DoubleSide }), 0, 3.2, 0, { rx: Math.PI });
      for (const [x, z, h] of [[-.9, .3, .9], [.95, -.2, 1.2]]) { add(g, box(.5, h, .5), M(0xd8c3a0), x, h / 2, z); add(g, box(.52, .18, .3), M(0x6b4423), x, h * .6, z + .2); add(g, box(.52, .18, .3), M(0x6b4423), x, h * .3, z + .2); }
    },
    abha(g) {
      for (const [dx, h, r] of [[-.35, 1.8, .7], [.45, 1.3, .55]]) { add(g, cone(r, h, 7), green, dx, h / 2, 0); add(g, cone(r * .32, h * .32, 7), flat(0x8a8a7a), dx, h * .84, 0); }
      add(g, cyl(.01, .01, 1.6, 4), dark, .05, 1.4, .3, { rz: 1.1 }); add(g, box(.18, .14, .14), M(0xc62828), .1, 1.3, .3);
    },
    bisha(g) {
      add(g, box(2, .7, .35), M(0xa58a6a), 0, .35, -.2); for (let i = -2; i <= 2; i++) add(g, box(.16, .5, .05), M(0x6e5a44), i * .38, .33, -.01);
      add(g, box(2, .05, .5), water, 0, .03, .3);
      palm(g, -.7, .5, 1.5); palm(g, .1, .6, 1.9); palm(g, .8, .4, 1.3);
    },
    taif(g) {
      add(g, cone(1, 1.2, 6), flat(0x8a7a6a), 0, .6, -.5); add(g, cyl(.04, .04, 1.2, 5), M(0x2f6b3c), 0, .6, .3);
      const pet = M(0xe05a8a, lite ? {} : { roughness: .6 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(g, sph(.28, 10, 8), pet, Math.cos(a) * .25, 1.35, .3 + Math.sin(a) * .25, { s: [.7, 1, .45], ry: -a }); }
      add(g, sph(.2, 10, 8), M(0xb0204e), 0, 1.45, .3);
      for (const s of [-1, 1]) add(g, sph(.2, 8, 6), M(0x2f7a3c), s * .22, .7, .3, { s: [1, .3, .5] });
    },
    hail(g) {
      add(g, new T.DodecahedronGeometry(1.1, 0), flat(0x8d6e63), 0, .5, 0, { s: [1.3, .7, 1] });
      add(g, box(1, .5, .7), mud, 0, 1.25, 0); for (let i = -2; i <= 2; i++) add(g, cone(.08, .2, 4), mud, i * .22, 1.6, .3);
      add(g, cyl(.16, .18, .8, 8), mud, -.55, 1.4, 0); add(g, cyl(.16, .18, .8, 8), mud, .55, 1.4, 0);
      add(g, box(.16, .28, .02), dark, 0, 1.15, .36);
    },
    qassim(g) {
      add(g, cyl(.09, .12, 2.2, 10), M(0xe8e2d6), 0, 1.1, 0);
      add(g, sph(.55, 20, 12), M(0xd9d2c4), 0, 2.4, 0, { s: [1, .6, 1] }); add(g, cyl(.56, .56, .1, 20), M(0xc62828), 0, 2.35, 0);
      palm(g, -.75, .2, 1.3); palm(g, .8, -.1, 1.5);
      for (let i = 0; i < 6; i++) add(g, sph(.07, 6, 5), M(0x7a3a14), .3 + (i % 3) * .14, .07, .55 + (i / 3 | 0) * .14, { s: [1, 1.5, 1] });
    },
    hofuf(g) {
      const m = add(g, new T.DodecahedronGeometry(1.1, 1), flat(0xd28a4a), 0, .6, 0, { s: [1.3, .8, .9] });
      for (const [x, z] of [[-.4, .75], [.35, .8]]) add(g, cyl(.18, .22, .6, 8, 1), dark, x, .3, z);
      add(g, sph(.25, 12, 8), M(0xf3e2c0), .9, 1.0, -.3); add(g, cyl(.25, .25, .5, 12), M(0xf3e2c0), .9, .75, -.3);
    },
    jazan(g) {
      add(g, cyl(1.1, 1.2, .15, 24), water, 0, .07, 0);
      add(g, new T.DodecahedronGeometry(.8, 0), flat(0x6b5a3a), 0, .4, 0, { s: [1.2, .7, 1] });
      add(g, box(.6, .5, .5), mud, .1, 1.05, 0); for (let i = 0; i < 4; i++) add(g, box(.1, .14, .1), mud, -.12 + i * .15, 1.36, .2);
      palm(g, -.7, .4, 1.1, .8);
    },
    durrah(g) {
      add(g, box(2.2, .06, .7), water, 0, .03, .5); add(g, box(2.2, .08, .5), M(0xf1d9a4), 0, .04, -.05);
      for (const [x, z, w] of [[-.7, -.5, .5], [0, -.6, .6], [.7, -.5, .5]]) { add(g, box(w, .55, .45), white, x, .32, z); add(g, cone(w * .78, .35, 4), M(0x26a69a), x, .78, z, { ry: Math.PI / 4 }); add(g, box(w * .6, .18, .02), M(0x3d6f8a), x, .35, z + .23); }
      add(g, cyl(.02, .02, .7, 4), dark, .95, .35, .1); add(g, new T.ConeGeometry(.35, .2, 10, 1, true), M(0xe0524a, { side: T.DoubleSide }), .95, .72, .1);
    },
    tabuk(g) {
      add(g, new T.DodecahedronGeometry(.9, 0), flat(0x9a8a7a), -.6, .45, -.6, { s: [1.2, 1, 1] });
      add(g, box(1.3, .7, .9), M(0xc9a67a), 0, .35, .1);
      for (const x of [-.65, .65]) { add(g, box(.36, 1, .36), M(0xbd9a6e), x, .5, .1); for (let i = -1; i <= 1; i++) add(g, box(.08, .12, .08), M(0xbd9a6e), x + i * .12, 1.06, .1 + .14); }
      add(g, box(.3, .4, .02), dark, 0, .2, .56);
    },
    khobar(g) {
      add(g, cyl(1.1, 1.1, .08, 24), water, 0, .04, 0);
      add(g, cyl(.14, .2, 2, 10), white, 0, 1, 0);
      add(g, new T.SphereGeometry(.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd9e6ee), 0, 2.1, 0);
      add(g, cyl(.62, .62, .12, 20), M(0x1c5fd0), 0, 2.1, 0); add(g, cyl(.02, .02, .5, 4), white, 0, 2.9, 0);
    },
    diriyah(g) {
      for (const [x, z, w, h, d] of [[-.6, .1, .6, .8, .6], [0, -.1, .7, 1.4, .7], [.65, .2, .55, .7, .5]]) {
        add(g, box(w, h, d), mud, x, h / 2, z);
        for (let i = 0; i < Math.floor(w / .15); i++) add(g, cone(.05, .14, 3), mud, x - w / 2 + .08 + i * .15, h + .06, z + d / 2 - .03);
        add(g, box(.1, .14, .02), dark, x, h * .65, z + d / 2 + .01);
      }
      add(g, box(.22, 1.9, .22), mud, .05, .95, -.2); add(g, cone(.18, .3, 4), mud, .05, 2.05, -.2);
    },
    train(g) {
      add(g, box(2.4, .05, .5), M(0x5a5a5a), 0, .03, 0);
      for (let i = -5; i <= 5; i++) add(g, box(.08, .04, .6), M(0x6e5034), i * .22, .02, 0);
      add(g, box(1.6, .55, .45), M(0xeeeeee), -.15, .38, 0); add(g, box(1.6, .1, .46), M(0x37474f), -.15, .3, 0);
      const nose = add(g, sph(.3, 14, 10), M(0xeeeeee), .7, .38, 0, { s: [1.4, .9, .75] });
      add(g, box(.3, .14, .4), M(0x22303a), .78, .5, 0); for (let i = 0; i < 4; i++) add(g, box(.18, .14, .02), M(0x22303a), -.75 + i * .35, .48, .23);
    },
    util(g) {
      const m = M(0x8a8f96); for (const [x, z] of [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]]) add(g, cyl(.03, .06, 2.4, 4), m, x * .5, 1.2, z * .5, { rz: -x * .15, rx: z * .15 });
      add(g, box(1, .04, .04), m, 0, 2, 0); add(g, box(.7, .04, .04), m, 0, 1.6, 0);
      add(g, cyl(.45, .45, .9, 16), M(0xdfe6ea), 1, .45, .4); add(g, cyl(.46, .46, .08, 16), M(0x1c5fd0), 1, .7, .4);
    }
  };
  const baseM = M(0x3a2416), ringM = gold;
  return {
    keys: Object.keys(B),
    build(k) {
      const g = new T.Group(), inner = new T.Group(); g.add(inner);
      const r = k === 'train' ? 1.3 : 1.05;
      const base = new T.Mesh(cyl(r, r * 1.08, .12, 40), baseM); base.position.y = .06; base.receiveShadow = !lite; g.add(base);
      const ring = new T.Mesh(new T.TorusGeometry(r * 1.04, .025, 6, 48), ringM); ring.rotation.x = Math.PI / 2; ring.position.y = .12; g.add(ring);
      inner.position.y = .12; (B[k] || B.riyadh)(inner);
      g.userData.inner = inner; return g;
    },
    gold
  };
}
// ورق الريالات: خامة مرسومة لكل فئة
export function noteTex(T, v) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  const col = { 1: '#8aa6a1', 2: '#7d9a5c', 3: '#9a7d5c', 4: '#6e8aa6', 5: '#6b8f3a', 10: '#a0784a' }[v] || '#7d9a5c';
  x.fillStyle = col; x.fillRect(0, 0, 256, 128); x.strokeStyle = 'rgba(243,240,216,.7)'; x.lineWidth = 3; x.strokeRect(8, 8, 240, 112);
  x.globalAlpha = .25; for (let i = 0; i < 12; i++) { x.beginPath(); x.arc(190, 64, 6 + i * 5, 0, 7); x.stroke(); } x.globalAlpha = 1;
  x.fillStyle = '#f3f0d8'; x.font = '64px Lalezar, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(v).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]), 64, 70);
  x.font = '22px Tajawal, sans-serif'; x.fillText('مليون', 190, 70);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
