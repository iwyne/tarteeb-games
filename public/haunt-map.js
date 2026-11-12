// خريطة البيت المسكون: شبكة مربعات (كل مربع ٢ متر). نفس الملف يستخدمه السيرفر والمتصفح.
// الغرف والأبواب والأثاث محددة هنا، والجدران = كل شي برا الغرف.
(function () {
  const T = 2, W = 30, Hh = 22;
  const ROOMS = [
    { n: 'غرفة النوم الكبيرة', x: 1, y: 1, w: 8, h: 5, f: 'carpet' },
    { n: 'المكتبة', x: 10, y: 1, w: 8, h: 5, f: 'wood' },
    { n: 'غرفة الأطفال', x: 19, y: 1, w: 5, h: 5, f: 'kids' },
    { n: 'الحمّام', x: 25, y: 1, w: 4, h: 5, f: 'tile' },
    { n: 'الممر العلوي', x: 1, y: 7, w: 28, h: 1, f: 'hall' },
    { n: 'غرفة الطعام', x: 1, y: 9, w: 8, h: 4, f: 'wood' },
    { n: 'الصالة الكبيرة', x: 10, y: 9, w: 10, h: 4, f: 'marble' },
    { n: 'المطبخ', x: 21, y: 9, w: 8, h: 4, f: 'tile' },
    { n: 'الممر السفلي', x: 1, y: 14, w: 28, h: 1, f: 'hall' },
    { n: 'المجلس', x: 1, y: 16, w: 8, h: 5, f: 'carpet' },
    { n: 'المدخل', x: 10, y: 16, w: 8, h: 5, f: 'marble' },
    { n: 'المكتب', x: 19, y: 16, w: 5, h: 5, f: 'wood' },
    { n: 'القبو', x: 25, y: 16, w: 4, h: 5, f: 'stone' }
  ];
  const DOORS = [[4, 6], [13, 6], [21, 6], [26, 6], [5, 8], [12, 8], [17, 8], [24, 8], [3, 13], [14, 13], [26, 13],
    [5, 15], [12, 15], [15, 15], [21, 15], [27, 15], [9, 10], [20, 11], [9, 18], [18, 17], [9, 3], [18, 3]];
  const EXIT = [[13, 21], [14, 21]];
  // الأثاث: k = النوع، tall = يحجب النظر، hide = تقدر تختبي فيه
  const FURN = [
    { k: 'bed', x: 2, y: 1, w: 2, h: 3 }, { k: 'ward', x: 6, y: 1 }, { k: 'ward', x: 1, y: 5 }, { k: 'dresser', x: 6, y: 5, w: 2 }, { k: 'mirror', x: 8, y: 1 },
    { k: 'shelf', x: 10, y: 1, w: 3 }, { k: 'shelf', x: 15, y: 1, w: 3 }, { k: 'table', x: 13, y: 3, w: 2 }, { k: 'ward', x: 17, y: 5 }, { k: 'arm', x: 11, y: 4 },
    { k: 'crib', x: 19, y: 1, h: 2 }, { k: 'ward', x: 23, y: 1 }, { k: 'box', x: 22, y: 4 }, { k: 'horse', x: 20, y: 4 },
    { k: 'tub', x: 27, y: 1, w: 2 }, { k: 'sink', x: 25, y: 1 }, { k: 'ward', x: 28, y: 4 },
    { k: 'table', x: 3, y: 10, w: 4, h: 2 }, { k: 'ward', x: 1, y: 9 }, { k: 'clock', x: 8, y: 9 },
    { k: 'piano', x: 10, y: 12, w: 2 }, { k: 'sofa', x: 15, y: 11, w: 3 }, { k: 'clock', x: 19, y: 9 }, { k: 'fire', x: 14, y: 9, w: 2 },
    { k: 'counter', x: 21, y: 9, w: 3 }, { k: 'fridge', x: 26, y: 9 }, { k: 'counter', x: 28, y: 10, h: 2 }, { k: 'ward', x: 28, y: 12 }, { k: 'table', x: 23, y: 11, w: 2 },
    { k: 'fire', x: 1, y: 16, h: 2 }, { k: 'table', x: 3, y: 17, w: 2 }, { k: 'sofa', x: 2, y: 19, w: 3 }, { k: 'ward', x: 8, y: 20 }, { k: 'arm', x: 6, y: 17 },
    { k: 'stairs', x: 10, y: 16, w: 2, h: 2 }, { k: 'clock', x: 17, y: 16 }, { k: 'dresser', x: 10, y: 20 }, { k: 'ward', x: 17, y: 20 },
    { k: 'desk', x: 20, y: 18, w: 2 }, { k: 'shelf', x: 23, y: 17, h: 3 }, { k: 'ward', x: 19, y: 20 },
    { k: 'crate', x: 25, y: 16, h: 2 }, { k: 'crate', x: 28, y: 19, h: 2 }, { k: 'ward', x: 25, y: 20 }
  ].map(o => Object.assign({ w: 1, h: 1 }, o));
  const TALL = { ward: 1, shelf: 1, clock: 1, fridge: 1, stairs: 1, mirror: 1, fire: 0 };
  FURN.forEach((o, i) => { o.i = i; o.tall = !!TALL[o.k]; o.hide = o.k === 'ward'; });

  // 0 = جدار، 1 = أرض، 2 = أثاث واطي (يمنع المشي بس يشوف من فوقه)، 3 = أثاث طويل، 4 = باب الخروج
  const grid = new Uint8Array(W * Hh), room = new Int8Array(W * Hh).fill(-1), furnAt = new Int16Array(W * Hh).fill(-1);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= Hh) ? 0 : grid[y * W + x];
  ROOMS.forEach((r, i) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { grid[y * W + x] = 1; room[y * W + x] = i; } });
  DOORS.forEach(([x, y]) => { grid[y * W + x] = 1; });
  EXIT.forEach(([x, y]) => { grid[y * W + x] = 4; });
  FURN.forEach(o => { for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) { grid[y * W + x] = o.tall ? 3 : 2; furnAt[y * W + x] = o.i; } });
  const isDoor = (x, y) => DOORS.some(d => d[0] === x && d[1] === y);

  const R = 0.32; // نص قطر اللاعب
  // يقدر يمشي هنا؟ (ندور على كل المربعات اللي يلمسها اللاعب)
  function walk(px, pz, free, exitOpen) {
    if (free) return px > 0.3 && pz > 0.3 && px < W * T - 0.3 && pz < Hh * T - 0.3;
    const x0 = Math.floor((px - R) / T), x1 = Math.floor((px + R) / T), y0 = Math.floor((pz - R) / T), y1 = Math.floor((pz + R) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = at(x, y); if (c === 1) continue; if (c === 4 && exitOpen) continue; return false; }
    return true;
  }
  // خط نظر بين نقطتين (الجدران والأثاث الطويل يحجبون)
  function see(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.5);
    for (let i = 1; i < n; i++) { const c = at(Math.floor((ax + (bx - ax) * i / n) / T), Math.floor((az + (bz - az) * i / n) / T)); if (c === 0 || c === 3) return false; }
    return true;
  }
  const roomAt = (px, pz) => { const i = room[Math.floor(pz / T) * W + Math.floor(px / T)]; return i >= 0 ? ROOMS[i].n : 'الممر'; };
  const roomIdx = (px, pz) => room[Math.floor(pz / T) * W + Math.floor(px / T)];
  // أقرب مربع أرض فاضي (للمسار)
  const tileOf = (px, pz) => [Math.floor(px / T), Math.floor(pz / T)];
  const center = (x, y) => [x * T + T / 2, y * T + T / 2];
  const clear = (ax, az, bx, bz, eo) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / .2); for (let i = 1; i <= n; i++) if (!walk(ax + (bx - ax) * i / n, az + (bz - az) * i / n, false, eo)) return false; return true; };
  // مسار بالشبكة (BFS) للبوتات
  function path(sx, sz, tx, tz, exitOpen) {
    const [ax, ay] = tileOf(sx, sz), [bx, by] = tileOf(tx, tz);
    const ok = (x, y) => { const c = at(x, y); return c === 1 || (c === 4 && exitOpen); };
    const prev = new Int32Array(W * Hh).fill(-2), q = [ay * W + ax]; prev[ay * W + ax] = -1;
    const goal = by * W + bx;
    while (q.length) {
      const c = q.shift(); if (c === goal) break;
      const x = c % W, y = c / W | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if ((ok(nx, ny) || k === goal) && prev[k] === -2) { prev[k] = c; q.push(k); } }
    }
    if (prev[goal] === -2) return null;
    const out = []; let c = goal; while (c !== -1) { out.unshift(center(c % W, c / W | 0)); c = prev[c]; }
    out.shift(); if (out.length) out[out.length - 1] = [tx, tz];
    // لو الخط المباشر لأول نقطة يقص زاوية جدار، نرجع لنص المربع أول
    if (out.length && !clear(sx, sz, out[0][0], out[0][1], exitOpen)) out.unshift(center(ax, ay));
    return out;
  }
  const floors = []; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (grid[y * W + x] === 1 && !isDoor(x, y)) floors.push([x, y]);
  // اتجاه وجه الأثاث: عكس الجدار اللي وراه (بنفس اتجاه الدوران: الوجه = (-sin, -cos))
  FURN.forEach(o => {
    const cnt = (xs, ys) => xs.filter((x, i) => at(x, ys[i]) === 0).length, rng = n => [...Array(n).keys()];
    const sides = [
      { c: cnt(rng(o.w).map(i => o.x + i), rng(o.w).map(() => o.y - 1)), yaw: Math.PI, f: [0, 1] },
      { c: cnt(rng(o.w).map(i => o.x + i), rng(o.w).map(() => o.y + o.h)), yaw: 0, f: [0, -1] },
      { c: cnt(rng(o.h).map(() => o.x - 1), rng(o.h).map(i => o.y + i)), yaw: -Math.PI / 2, f: [1, 0] },
      { c: cnt(rng(o.h).map(() => o.x + o.w), rng(o.h).map(i => o.y + i)), yaw: Math.PI / 2, f: [-1, 0] }
    ].sort((a, b) => b.c - a.c);
    const s = (o.hide && sides.find(q => q.c && at(o.x + q.f[0], o.y + q.f[1]) === 1)) || sides[0];
    o.face = s.c ? s.yaw : 0;
    if (o.hide) { o.c = center(o.x, o.y); o.front = center(o.x + s.f[0], o.y + s.f[1]); o.yaw = o.face; }
  });
  const HMAP = { clear, T, W, H: Hh, ROOMS, DOORS, EXIT, FURN, grid, at, walk, see, roomAt, roomIdx, path, floors, isDoor, center, tileOf, R,
    spawn: [14 * T, 18.5 * T], ghostSpawn: [27 * T, 18 * T], exitPt: [14 * T, 21 * T + 0.6] };
  if (typeof module !== 'undefined') module.exports = HMAP; else window.HMAP = HMAP;
})();
