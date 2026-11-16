// مطاردة: خريطة المدينة + فيزياء السيارة — مشتركة بين السيرفر والمتصفح عشان الحركة تكون نفسها بالضبط
var CARMAP = (() => {
  const W = 2200, H = 1400, CR = 21;
  // مباني (مستطيلات) — x, y, w, h, لون السطح
  const B = [
    [140, 140, 380, 170, 0], [140, 370, 160, 190, 1], [360, 370, 160, 190, 2],
    [700, 140, 300, 420, 3],
    [1680, 140, 380, 190, 4], [1680, 390, 380, 170, 1],
    [140, 840, 160, 420, 2], [360, 840, 160, 420, 0],
    [700, 840, 300, 170, 4], [700, 1080, 300, 180, 3],
    [1200, 840, 300, 420, 1]
  ];
  // حدايق: ما تصطدم فيها بس فيها نخل (دواير تصطدم)
  const PARKS = [[1200, 140, 300, 420], [1680, 840, 380, 420]];
  const TREES = [[1260, 210], [1440, 210], [1350, 350], [1260, 490], [1440, 490], [1760, 920], [1980, 920], [1870, 1050], [1760, 1180], [1980, 1180]];
  const ROUND = [1100, 700, 82]; // الدوّار
  const CIRC = TREES.map(([x, y]) => [x, y, 24]).concat([ROUND]);
  const SPAWN_H = [[1100, 590], [1100, 810], [990, 700], [1210, 700]];
  const SPAWN_R = [[80, 80], [2120, 80], [80, 1320], [2120, 1320], [610, 80], [1590, 80], [610, 1320], [1590, 1320], [80, 700], [2120, 700], [610, 700], [1590, 700]];
  function hits(x, y, r = CR) {
    if (x < r || y < r || x > W - r || y > H - r) return true;
    for (const b of B) { const cx = Math.max(b[0], Math.min(x, b[0] + b[2])), cy = Math.max(b[1], Math.min(y, b[1] + b[3])); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true; }
    for (const c of CIRC) if ((x - c[0]) ** 2 + (y - c[1]) ** 2 < (r + c[2]) ** 2) return true;
    return false;
  }
  const MAX = 330, HUNT = 1.06, BOOST = 1.65, BOOST_MS = 1100, BOOST_CD = 6000, TURN = 4.4, ACC = 620, FRIC = 520;
  // خطوة فيزياء: (ix,iy) اتجاه العصا/الأسهم، والسيارة تلف له تدريجياً
  function step(c, ix, iy, dt, o = {}) {
    const m = Math.min(1, Math.hypot(ix, iy));
    const top = MAX * (o.hunter ? HUNT : 1) * (o.boost ? BOOST : 1);
    if (m > .12) {
      let d = Math.atan2(iy, ix) - c.a; d = Math.atan2(Math.sin(d), Math.cos(d));
      const tr = TURN * dt * (o.boost ? .8 : 1);
      c.a += Math.max(-tr, Math.min(tr, d));
      const want = top * m * (Math.abs(d) > 2 ? .55 : 1);
      c.v += Math.max(-FRIC * dt, Math.min(ACC * dt * (o.boost ? 2.2 : 1), want - c.v));
    } else c.v = Math.max(0, c.v - FRIC * dt);
    c.a = Math.atan2(Math.sin(c.a), Math.cos(c.a));
    const dx = Math.cos(c.a) * c.v * dt, dy = Math.sin(c.a) * c.v * dt;
    let bump = false;
    if (!hits(c.x + dx, c.y + dy)) { c.x += dx; c.y += dy; }
    else { bump = true; if (!hits(c.x + dx, c.y)) c.x += dx; else if (!hits(c.x, c.y + dy)) c.y += dy; c.v *= .55; }
    if (hits(c.x, c.y)) unstick(c);
    return bump;
  }
  // لو علقت السيارة داخل شي (بعد سنب مثلاً) نطلّعها لأقرب مكان فاضي
  function unstick(c) {
    for (let r = 6; r < 200; r += 6) for (let k = 0; k < 12; k++) { const x = c.x + Math.cos(k / 12 * 6.283) * r, y = c.y + Math.sin(k / 12 * 6.283) * r; if (!hits(x, y)) { c.x = x; c.y = y; return; } }
  }
  // كم المسافة الفاضية قدام اتجاه (للبوتات)
  function free(x, y, a, max = 220) { const cx = Math.cos(a), cy = Math.sin(a); for (let d = 18; d <= max; d += 18) if (hits(x + cx * d, y + cy * d, CR - 4)) return d; return max; }
  return { W, H, CR, B, PARKS, TREES, ROUND, CIRC, SPAWN_H, SPAWN_R, hits, step, unstick, free, MAX, HUNT, BOOST, BOOST_MS, BOOST_CD };
})();
if (typeof module !== 'undefined') module.exports = CARMAP;
