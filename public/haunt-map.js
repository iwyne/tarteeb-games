// خريطة القصر المسكون: ٤ طوابق (قبو، أرضي، علوي، علّية). كل طابق شبكة مربعات (المربع ٢ متر).
// الغرف مستطيلات، والجدران = أي مربع مو داخل غرفة. الأبواب تفتح بين الغرف، وبعضها مقفل بمفتاح.
// الدرج: منحدر يربط طابق بالطابق اللي فوقه. نفس الملف يستخدمه السيرفر والمتصفح.
(function () {
  const T = 2, W = 34, H = 27, LV = 4, FLOOR_H = 4, CEIL = 3.6;
  const baseY = lv => (lv - 1) * FLOOR_H; // القبو -4، الأرضي 0، العلوي 4، العلّية 8
  // f = أرضية، w = جدار، name = اسم الغرفة
  const R = (lv, n, x, y, w, h, f, wall, extra) => Object.assign({ lv, n, x, y, w, h, f, wall }, extra || {});
  const ROOMS = [
    // القبو
    R(0, 'غرفة المولّد', 19, 14, 6, 4, 'rubble', 'castle_brick_07', { k: 'boiler' }),
    R(0, 'قبو النبيذ', 26, 14, 7, 4, 'worn_tile_floor', 'old_stone_wall', { k: 'wine' }),
    R(0, 'ممر القبو', 19, 19, 12, 1, 'rubble', 'worn_brick_wall'),
    R(0, 'ممر القبو', 25, 19, 1, 7, 'rubble', 'worn_brick_wall'),
    R(0, 'ممر القبو', 19, 25, 14, 1, 'rubble', 'worn_brick_wall'),
    R(0, 'المستودع', 19, 21, 5, 3, 'dark_wooden_planks', 'worn_brick_wall', { k: 'storage' }),
    R(0, 'غرفة الأقفاص', 27, 21, 3, 3, 'rubble', 'old_stone_wall', { k: 'cage' }),
    // الأرضي
    R(1, 'الممر الكبير', 1, 12, 32, 2, 'old_wooden_floor_02', 'decrepit_wallpaper', { hall: 1 }),
    R(1, 'البهو', 13, 15, 8, 10, 'herringbone_parquet', 'patterned_plaster_wall', { k: 'foyer', tall: 1 }),
    R(1, 'المجلس', 1, 15, 11, 10, 'dirty_carpet', 'decrepit_wallpaper', { k: 'living' }),
    R(1, 'غرفة الطعام', 22, 15, 11, 4, 'herringbone_parquet', 'peeling_painted_wall', { k: 'dining' }),
    R(1, 'المطبخ', 22, 20, 11, 5, 'dirty_tiles', 'damaged_plaster', { k: 'kitchen' }),
    R(1, 'المكتبة', 1, 1, 9, 10, 'dark_wooden_planks', 'dark_paneled_wood', { k: 'library' }),
    R(1, 'مكتب الجد', 11, 1, 6, 4, 'old_wooden_floor_02', 'dark_paneled_wood', { k: 'study' }),
    R(1, 'غرفة الغسيل', 11, 6, 6, 5, 'worn_tile_floor', 'damaged_plaster', { k: 'laundry' }),
    R(1, 'غرفة البيانو', 18, 1, 7, 10, 'herringbone_parquet', 'patterned_plaster_wall', { k: 'music' }),
    R(1, 'البيت الزجاجي', 26, 1, 7, 10, 'worn_tile_floor', 'worn_cracked_plaster', { k: 'conserv' }),
    // العلوي
    R(2, 'الممر العلوي', 1, 12, 32, 2, 'dirty_carpet', 'decrepit_wallpaper', { hall: 1 }),
    R(2, 'الشرفة', 13, 15, 8, 10, 'old_wooden_floor_02', 'patterned_plaster_wall', { k: 'gallery' }),
    R(2, 'غرفة النوم الكبيرة', 1, 15, 11, 6, 'dirty_carpet', 'peeling_painted_wall', { k: 'master' }),
    R(2, 'حمّام الغرفة الكبيرة', 1, 22, 5, 3, 'dirty_tiles', 'damaged_plaster', { k: 'bath' }),
    R(2, 'غرفة الملابس', 7, 22, 5, 3, 'old_wooden_floor_02', 'decrepit_wallpaper', { k: 'dressing' }),
    R(2, 'غرفة الضيوف', 22, 15, 11, 5, 'herringbone_parquet', 'worn_cracked_plaster', { k: 'bed' }),
    R(2, 'الحمّام', 22, 21, 5, 4, 'dirty_tiles', 'damaged_plaster', { k: 'bath' }),
    R(2, 'غرفة الخادمة', 28, 21, 5, 4, 'worn_planks', 'damaged_plaster', { k: 'maid' }),
    R(2, 'غرفة الأطفال', 1, 1, 8, 10, 'old_wooden_floor_02', 'peeling_painted_wall', { k: 'nursery' }),
    R(2, 'غرفة البنت', 10, 1, 7, 5, 'dirty_carpet', 'patterned_plaster_wall', { k: 'girl' }),
    R(2, 'غرفة المخزن', 10, 7, 7, 4, 'worn_planks', 'damaged_plaster', { k: 'linen' }),
    R(2, 'غرفة الجد', 18, 1, 7, 10, 'herringbone_parquet', 'dark_paneled_wood', { k: 'grandpa' }),
    R(2, 'غرفة الألعاب', 26, 1, 7, 10, 'old_wooden_floor_02', 'peeling_painted_wall', { k: 'toys' }),
    // العلّية
    R(3, 'العلّية', 19, 1, 14, 10, 'worn_planks', 'weathered_plank_siding', { k: 'attic' })
  ];
  ROOMS.forEach((r, i) => { r.i = i; });
  // الأبواب: [طابق، x، y، رقم القفل (اختياري)]
  const DOORS = [
    [0, 21, 18], [0, 28, 18], [0, 21, 20], [0, 21, 24], [0, 28, 24], [0, 26, 22],
    [1, 5, 11], [1, 13, 11], [1, 14, 5, 'study'], [1, 21, 11], [1, 29, 11], [1, 25, 5], [1, 6, 14], [1, 16, 14], [1, 17, 14], [1, 27, 14], [1, 27, 19], [1, 12, 19], [1, 12, 20], [1, 21, 16], [1, 21, 22],
    [2, 4, 11], [2, 13, 11], [2, 13, 6], [2, 21, 11], [2, 28, 11, 'attic'], [2, 6, 14, 'master'], [2, 14, 14], [2, 19, 14], [2, 27, 14], [2, 3, 21], [2, 9, 21], [2, 24, 20], [2, 30, 20], [2, 21, 17]
  ].map(([lv, x, y, lock], i) => ({ i, lv, x, y, lock: lock || null }));
  const EXIT = [[1, 16, 25], [1, 17, 25]];
  // الدرج: lo = الطابق اللي تحت، x0..x1 أعمدة، y0 = آخر صف فوق (يطلع شمال)، y1 = أول صف تحت
  const STAIRS = [
    { lo: 1, x0: 16, x1: 17, y0: 17, y1: 20, n: 'الدرج الكبير' },
    { lo: 0, x0: 31, x1: 32, y0: 21, y1: 24, n: 'درج القبو' },
    { lo: 2, x0: 31, x1: 32, y0: 6, y1: 9, n: 'درج العلّية' }
  ];
  STAIRS.forEach((s, i) => { s.i = i; });

  // 0 جدار، 1 أرض، 2 باب، 3 باب مقفل، 4 درج، 5 فتحة درج (فراغ)، 6 الباب الأمامي
  const grid = [...Array(LV)].map(() => new Uint8Array(W * H)), room = [...Array(LV)].map(() => new Int16Array(W * H).fill(-1));
  const at = (lv, x, y) => (lv < 0 || lv >= LV || x < 0 || y < 0 || x >= W || y >= H) ? 0 : grid[lv][y * W + x];
  const set = (lv, x, y, v) => { grid[lv][y * W + x] = v; };
  ROOMS.forEach(r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { set(r.lv, x, y, 1); room[r.lv][y * W + x] = r.i; } });
  DOORS.forEach(d => set(d.lv, d.x, d.y, d.lock ? 3 : 2));
  EXIT.forEach(([lv, x, y]) => set(lv, x, y, 6));
  STAIRS.forEach(s => { for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) { set(s.lo, x, y, 4); set(s.lo + 1, x, y, 5); } });
  const doorAt = (lv, x, y) => DOORS.find(d => d.lv === lv && d.x === x && d.y === y);

  // ---------- الأثاث (تصادم) ----------
  // كل قطعة: {lv, m: اسم الموديل, x, z بالمتر, r: دوران (0..3 × 90°), w, d: الحجم} — نعبّيها من haunt-props (الحجم) وقت البناء
  const PROPS = [];
  const PR = {}; // أحجام الموديلات (من props.json) — يعبيها setSizes
  function setSizes(meta) { Object.assign(PR, meta); PROPS.forEach(p => fitProp(p)); if (typeof calcFloors === 'function') calcFloors(); }
  function fitProp(p) {
    const m = PR[p.m]; if (!m) return;
    const sx = (m.max[0] - m.min[0]) * (p.s || 1), sz = (m.max[2] - m.min[2]) * (p.s || 1), rot = (p.r || 0) % 2;
    p.w = rot ? sz : sx; p.d = rot ? sx : sz; p.h = (m.max[1] - m.min[1]) * (p.s || 1);
  }
  // r: 0 = الوجه جنوب (+z)، 1 = غرب، 2 = شمال، 3 = شرق (الدوران = -r × 90°). c: يتصادم (افتراضي نعم)، tall: يحجب النظر، hide: تختبي فيه
  const P = (lv, m, x, z, r, o) => PROPS.push(Object.assign({ lv, m, x, z, r: r || 0, c: true }, o || {}));
  const tx = v => v * T; // مربع → متر (ركن المربع)
  // --- القبو
  P(0, 'wooden_crate_01', tx(19.6), tx(14.4), 0); P(0, 'wooden_crate_01', tx(20.2), tx(14.4), 1); P(0, 'barrel_01', tx(24.5), tx(14.5), 0); P(0, 'barrel_01', tx(24.5), tx(15.3), 0);
  P(0, 'steel_box', tx(22), tx(14.25), 0, { fuse: 1 }); // صندوق الفيوزات (يتبني بالكود)
  P(0, 'wooden_display_shelves_01', tx(26.4), tx(15.5), 3); P(0, 'wooden_display_shelves_01', tx(32.6), tx(15.5), 1); P(0, 'barrel_01', tx(29), tx(14.5), 0); P(0, 'barrel_01', tx(30), tx(14.5), 0); P(0, 'wine_rack', tx(29.5), tx(17.6), 2);
  P(0, 'wooden_crate_01', tx(19.5), tx(21.5), 0); P(0, 'wooden_crate_01', tx(19.5), tx(22.3), 1); P(0, 'vintage_suitcase', tx(23), tx(21.3), 0); P(0, 'wheelchair_01', tx(22.5), tx(23.2), 2); P(0, 'old_gas_mask', tx(20.5), tx(23.5), 0, { c: false, y: .1 });
  P(0, 'medical_box', tx(28.5), tx(21.3), 0, { c: false });
  // --- الأرضي
  P(1, 'sofa_01', tx(3), tx(23.6), 2); P(1, 'armchair_01', tx(5.5), tx(21.5), 3); P(1, 'gothic_coffee_table', tx(3.2), tx(21.8), 0); P(1, 'rockingchair_01', tx(9.5), tx(23.5), 2);
  P(1, 'scandinavian_masonry_heater', tx(1.5), tx(18), 3, { tall: 1 }); P(1, 'vintage_grandfather_clock_01', tx(11.5), tx(15.4), 0, { tall: 1 }); P(1, 'throw_pillows_01', tx(3), tx(23.3), 2, { c: false, y: .45 });
  P(1, 'hanging_picture_frame_01', tx(6), tx(15.03), 0, { wall: 1, y: 1.7 }); P(1, 'lion_head', tx(9), tx(15.05), 0, { wall: 1, y: 2.2 });
  P(1, 'gothic_statue', tx(14), tx(23.8), 2, { tall: 1, s: .9 }); P(1, 'gothic_statue', tx(20), tx(23.8), 2, { tall: 1, s: .9 });
  P(1, 'ornate_mirror_01', tx(13.03), tx(17.5), 3, { wall: 1, y: 1.6, mirror: 1 }); P(1, 'marble_bust_01', tx(20.5), tx(15.5), 0, { y: .9 }); P(1, 'classicconsole_01', tx(20.5), tx(15.5), 0);
  P(1, 'dining_table', tx(27.5), tx(17), 1); [[26.4, 15.9], [26.4, 17], [26.4, 18.1], [28.6, 15.9], [28.6, 17], [28.6, 18.1]].forEach(([x, z], i) => P(1, 'dining_chair_02', tx(x), tx(z), i < 3 ? 3 : 1));
  P(1, 'vintage_cabinet_01', tx(32.5), tx(17), 1, { tall: 1, hide: 1 }); P(1, 'brass_candleholders', tx(27.5), tx(17), 1, { c: false, y: .87 }); P(1, 'bull_head', tx(27.5), tx(15.05), 0, { wall: 1, y: 2.2 });
  P(1, 'woodentable_01', tx(26), tx(23.5), 0); P(1, 'painted_wooden_cabinet', tx(23), tx(20.4), 0); P(1, 'painted_wooden_cabinet', tx(25), tx(20.4), 0); P(1, 'drawer_cabinet', tx(29.5), tx(20.4), 0, { tall: 1, hide: 1 });
  P(1, 'wooden_bookshelf_worn', tx(1.5), tx(3), 3, { tall: 1 }); P(1, 'wooden_bookshelf_worn', tx(1.5), tx(6), 3, { tall: 1 }); P(1, 'wooden_bookshelf_worn', tx(1.5), tx(9), 3, { tall: 1 });
  P(1, 'wooden_bookshelf_worn', tx(4), tx(1.4), 0, { tall: 1 }); P(1, 'wooden_bookshelf_worn', tx(7), tx(1.4), 0, { tall: 1 }); P(1, 'gothiccabinet_01', tx(9.5), tx(6), 1, { tall: 1, hide: 1 });
  P(1, 'woodentable_01', tx(5.5), tx(6), 1); P(1, 'woodenchair_01', tx(6.5), tx(6), 1); P(1, 'vintage_oil_lamp', tx(5.5), tx(5.6), 0, { c: false, y: .55, lamp: 1 }); P(1, 'book_encyclopedia_set_01', tx(5.2), tx(6.6), 1, { c: false, y: .55 });
  P(1, 'vintage_wooden_drawer_01', tx(14), tx(1.6), 0); P(1, 'woodenchair_01', tx(14), tx(2.8), 2); P(1, 'wall_clock', tx(16.9), tx(2.5), 1, { wall: 1, y: 2 }); P(1, 'treasure_chest', tx(11.7), tx(4.2), 3); P(1, 'mantel_clock_01', tx(14), tx(1.5), 0, { c: false, y: 1.1 });
  P(1, 'wooden_crate_01', tx(11.6), tx(9.5), 0); P(1, 'vintage_crutches_01', tx(16.6), tx(7), 1, { c: false }); P(1, 'gothiccommode_01', tx(16.6), tx(9), 1);
  P(1, 'piano', tx(21.5), tx(3), 0); P(1, 'woodenchair_01', tx(21.5), tx(5), 2); P(1, 'spinning_wheel_01', tx(19), tx(9), 1); P(1, 'fancy_picture_frame_01', tx(24.97), tx(6), 1, { wall: 1, y: 1.8 }); P(1, 'gothiccabinet_01', tx(18.5), tx(3), 3, { tall: 1, hide: 1 });
  P(1, 'dead_tree_trunk', tx(29.5), tx(5.5), 0, { c: false }); P(1, 'wooden_crate_01', tx(32.4), tx(9.6), 1); P(1, 'woodentable_02', tx(29.5), tx(8.5), 0); P(1, 'street_rat', tx(28), tx(8), 1, { c: false, rat: 1 });
  P(1, 'ornate_mirror_01', tx(1.03), tx(12.5), 3, { wall: 1, y: 1.6, mirror: 1 }); P(1, 'hanging_picture_frame_02', tx(10), tx(12.03), 0, { wall: 1, y: 1.8 }); P(1, 'hanging_picture_frame_01', tx(24), tx(12.03), 0, { wall: 1, y: 1.7 });
  // --- العلوي
  P(2, 'gothicbed_01', tx(3), tx(17.5), 3); P(2, 'classicnightstand_01', tx(1.6), tx(15.6), 3); P(2, 'gothiccabinet_01', tx(10.5), tx(15.5), 0, { tall: 1, hide: 1 }); P(2, 'ornate_mirror_01', tx(11.97), tx(18.5), 1, { wall: 1, y: 1.6, mirror: 1 }); P(2, 'vintage_wooden_drawer_01', tx(8), tx(20.4), 2);
  P(2, 'woodentable_01', tx(3), tx(23.5), 0, { s: .7 }); P(2, 'vintage_crutches_01', tx(5.6), tx(22.4), 1, { c: false });
  P(2, 'drawer_cabinet', tx(8), tx(22.4), 0, { tall: 1, hide: 1 }); P(2, 'vintage_suitcase', tx(10.5), tx(24.4), 2);
  P(2, 'old_bed_frame', tx(25), tx(17.5), 3); P(2, 'classicnightstand_01', tx(22.6), tx(15.6), 3); P(2, 'vintage_cabinet_01', tx(32.5), tx(17), 1, { tall: 1, hide: 1 }); P(2, 'rockingchair_01', tx(30), tx(19), 2);
  P(2, 'wooden_crate_01', tx(24), tx(24.4), 0); P(2, 'old_bed_frame', tx(31), tx(23), 1); P(2, 'wheelchair_01', tx(29), tx(24.3), 2);
  P(2, 'old_bed_frame', tx(3), tx(3), 0, { s: .8 }); P(2, 'old_bed_frame', tx(6.5), tx(3), 0, { s: .8 }); P(2, 'rockingchair_01', tx(7.5), tx(8.5), 3); P(2, 'painted_wooden_cabinet', tx(1.6), tx(8), 3); P(2, 'treasure_chest', tx(6.8), tx(10.4), 2);
  P(2, 'gothicbed_01', tx(13), tx(2.5), 0, { s: .9 }); P(2, 'gothiccommode_01', tx(16.5), tx(3), 1); P(2, 'standing_picture_frame_01', tx(16.5), tx(3), 1, { c: false, y: 1.22 });
  P(2, 'wooden_display_shelves_01', tx(10.4), tx(9), 3); P(2, 'wooden_crate_01', tx(16.5), tx(10.5), 1); P(2, 'wooden_crate_01', tx(15.7), tx(10.5), 0);
  P(2, 'old_bed_frame', tx(20), tx(3), 0); P(2, 'vintage_grandfather_clock_01', tx(24.5), tx(1.4), 0, { tall: 1 }); P(2, 'armchair_01', tx(22.5), tx(8), 2); P(2, 'gothiccabinet_01', tx(18.5), tx(8.5), 3, { tall: 1, hide: 1 });
  P(2, 'spinning_wheel_01', tx(27.5), tx(3), 0); P(2, 'treasure_chest', tx(29), tx(1.5), 0); P(2, 'rockingchair_01', tx(28), tx(7), 3);
  P(2, 'vintage_day_bed', tx(3), tx(12.5), 0); P(2, 'hanging_picture_frame_02', tx(9), tx(12.03), 0, { wall: 1, y: 1.8 }); P(2, 'ornate_mirror_01', tx(32.97), tx(12.5), 1, { wall: 1, y: 1.6, mirror: 1 });
  P(2, 'marble_bust_01', tx(14), tx(24.4), 2, { y: .9 }); P(2, 'classicconsole_01', tx(14), tx(24.4), 2);
  // --- العلّية
  P(3, 'wooden_crate_01', tx(19.6), tx(1.6), 0); P(3, 'wooden_crate_01', tx(20.4), tx(1.6), 1); P(3, 'wooden_crate_01', tx(20), tx(2.3), 0); P(3, 'vintage_suitcase', tx(22), tx(1.5), 0);
  P(3, 'old_bed_frame', tx(20.5), tx(9), 1); P(3, 'wheelchair_01', tx(28), tx(2), 0); P(3, 'gothic_statue', tx(27), tx(9.5), 2, { tall: 1, s: .9 }); P(3, 'treasure_chest', tx(23), tx(10.4), 2);
  P(3, 'altar', tx(25), tx(5.5), 0, { altar: 1 }); // المذبح (يتبني بالكود)
  P(3, 'ornate_mirror_01', tx(19.03), tx(6), 3, { wall: 1, y: 1.6, mirror: 1 });
  // الإضاءة: ثريات بالسقف وشمعدانات جدار (تشتغل لما ترجع الكهرباء)
  [[1, 17, 22.5], [1, 27.5, 17], [1, 21.5, 6], [1, 5.5, 6], [1, 6.5, 20], [2, 17, 22.5], [2, 6.5, 18], [2, 27.5, 17.5], [2, 21.5, 5.5], [1, 29.5, 6]].forEach(([lv, x, y]) => P(lv, 'chandelier_01', tx(x), tx(y), 0, { c: false, ceil: 1, lamp: 2 }));
  [1, 2].forEach(lv => [3, 9, 15, 21, 27, 31].forEach(x => P(lv, 'sconce', tx(x), tx(12) + .06, 0, { c: false, wall: 1, y: 2.1, lamp: 1 })));
  [[0, 22, 19, 0], [0, 28, 19, 0], [0, 22, 25, 0], [0, 29, 25, 0]].forEach(([lv, x, y]) => P(lv, 'sconce', tx(x), tx(y) + .06, 0, { c: false, wall: 1, y: 2.1, lamp: 1 }));
  // القفص (يتبني بالكود)
  P(0, 'cage', tx(28.5), tx(22.5), 0, { cage: 1, c: false });
  PROPS.forEach((p, i) => { p.i = i; });
  // الموديلات اللي نبنيها بالكود (مو من Poly Haven)
  Object.assign(PR, {
    steel_box: { min: [-.4, 0, -.15], max: [.4, 1.4, .15] }, sconce: { min: [-.15, -.2, 0], max: [.15, .3, .2] }, wine_rack: { min: [-1.4, 0, -.25], max: [1.4, 2.1, .25] },
    piano: { min: [-.8, 0, -.35], max: [.8, 1.3, .35] }, altar: { min: [-1, 0, -.6], max: [1, 1, .6] }, cage: { min: [-1, 0, -1], max: [1, 2.4, 1] },
    woodentable_02: { min: [-.7, 0, -.45], max: [.7, .8, .45] }
  });
  PROPS.forEach(fitProp);

  const R0 = .3; // نص قطر اللاعب
  const stairAt = (x, z) => { const tx_ = Math.floor(x / T), ty = Math.floor(z / T); return STAIRS.find(s => tx_ >= s.x0 && tx_ <= s.x1 && ty >= s.y0 && ty <= s.y1); };
  // تقدّم الدرج: 0 أسفله (الجنوب)، 1 أعلاه (الشمال)
  const stairP = (s, z) => Math.max(0, Math.min(1, ((s.y1 + 1) * T - z) / ((s.y1 - s.y0 + 1) * T)));
  const heightAt = (lv, x, z) => { const s = stairAt(x, z); if (s && (lv === s.lo || lv === s.lo + 1)) return baseY(s.lo) + stairP(s, z) * FLOOR_H; return baseY(lv); };
  const propBlocks = (lv, x, z, r) => PROPS.some(p => p.lv === lv && p.c && !p.wall && p.w && Math.abs(x - p.x) < p.w / 2 + r && Math.abs(z - p.z) < p.d / 2 + r);
  // يقدر يكون هنا؟ open = أقفال الأبواب المفتوحة (Set)، exitOpen = الباب الأمامي
  function walk(lv, x, z, o) {
    o = o || {};
    if (o.free) return x > .3 && z > .3 && x < W * T - .3 && z < H * T - .3 && lv >= 0 && lv < LV;
    const r = R0, x0 = Math.floor((x - r) / T), x1 = Math.floor((x + r) / T), y0 = Math.floor((z - r) / T), y1 = Math.floor((z + r) / T);
    const s = stairAt(x, z);
    let onStair = 0, off = 0;
    for (let y = y0; y <= y1; y++) for (let xx = x0; xx <= x1; xx++) {
      const c = at(lv, xx, y);
      if (c === 1 || c === 2) { off++; continue; }
      if (c === 3) { const d = doorAt(lv, xx, y); if (o.open && d && o.open.has(d.lock)) { off++; continue; } return false; }
      if (c === 6) { if (o.exitOpen) { off++; continue; } return false; }
      if (c === 4 || c === 5) {
        const st = STAIRS.find(q => xx >= q.x0 && xx <= q.x1 && y >= q.y0 && y <= q.y1);
        if (!st || (c === 5 && lv !== st.lo + 1) || (c === 4 && lv !== st.lo)) return false;
        if (c === 5 && stairP(st, z) < .5) return false; // من فوق ما تنزل إلا من جهة الدرج
        if (c === 4 && s !== st && stairP(st, z) > .5) return false;
        onStair++; continue;
      }
      return false;
    }
    // على الدرج: ممنوع تطلع من الجنب (الدرابزين)
    if (onStair && off) {
      const st = s || STAIRS.find(q => Math.floor(x / T) >= q.x0 - 1 && Math.floor(x / T) <= q.x1 + 1 && Math.floor(z / T) >= q.y0 - 1 && Math.floor(z / T) <= q.y1 + 1);
      if (st && (x - r < st.x0 * T - .05 || x + r > (st.x1 + 1) * T + .05)) return false;
    }
    if (!s && propBlocks(lv, x, z, r)) return false;
    return true;
  }
  // الطابق بعد الحركة (لو مشى على الدرج يتغير)
  function levelAfter(lv, x, z) { const s = stairAt(x, z); if (s && (lv === s.lo || lv === s.lo + 1)) return stairP(s, z) > .5 ? s.lo + 1 : s.lo; return lv; }
  // خط نظر (نفس الطابق، الجدران والأبواب المقفلة والأثاث الطويل تحجب)
  function see(lv, ax, az, bx, bz, o) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / .4);
    for (let i = 1; i < n; i++) {
      const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n, c = at(lv, Math.floor(x / T), Math.floor(z / T));
      if (c === 0 || c === 6) return false;
      if (c === 3) { const dd = doorAt(lv, Math.floor(x / T), Math.floor(z / T)); if (!(o && o.open && dd && o.open.has(dd.lock))) return false; }
      if (PROPS.some(p => p.lv === lv && p.tall && p.w && Math.abs(x - p.x) < p.w / 2 && Math.abs(z - p.z) < p.d / 2)) return false;
    }
    return true;
  }
  const roomOf = (lv, x, z) => { const i = room[lv] ? room[lv][Math.floor(z / T) * W + Math.floor(x / T)] : -1; return i >= 0 ? ROOMS[i] : null; };
  const roomName = (lv, x, z) => { const r = roomOf(lv, x, z); if (r) return r.n; const s = stairAt(x, z); return s ? s.n : 'الممر'; };
  const center = (x, y) => [x * T + T / 2, y * T + T / 2];
  // ---------- المسارات (للبوتات): عقد = (طابق، مربع) ----------
  const key = (lv, x, y) => (lv * H + y) * W + x;
  function nb(lv, x, y, o) {
    const out = [], c = at(lv, x, y);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; let nl = lv, cc = at(lv, nx, ny), top = false;
      if (cc === 0) continue;
      if ((cc === 1 || cc === 2) && (propBlocks(lv, (nx + .5) * T, (ny + .5) * T, .3) || propBlocks(lv, (x + nx + 1) / 2 * T, (y + ny + 1) / 2 * T, .3))) continue;
      if (cc === 3) { const d = doorAt(lv, nx, ny); if (!(o.open && d && o.open.has(d.lock))) continue; }
      if (cc === 6 && !o.exitOpen) continue;
      if (cc === 5) { // من فوق تدخل الدرج من أعلاه بس
        const st = STAIRS.find(q => nx >= q.x0 && nx <= q.x1 && ny >= q.y0 && ny <= q.y1);
        if (!st || dy !== 1 || ny !== st.y0) continue; nl = st.lo; cc = 4; top = true;
      }
      if (cc === 4 && !top) { const st = STAIRS.find(q => nx >= q.x0 && nx <= q.x1 && ny >= q.y0 && ny <= q.y1); if (c !== 4 && c !== 5 && !(dy === -1 && ny === st.y1)) continue; if (c === 4 && dx) continue; }
      if (c === 4 && cc !== 4 && cc !== 5) { const st = STAIRS.find(q => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1); if (dx) continue; if (dy === -1 && y === st.y0) nl = st.lo + 1; else if (!(dy === 1 && y === st.y1)) continue; }
      out.push([nl, nx, ny]);
    }
    return out;
  }
  function path(lv, sx, sz, tl, tx2, tz2, o) {
    o = o || {};
    const a = [lv, Math.floor(sx / T), Math.floor(sz / T)], b = [tl, Math.floor(tx2 / T), Math.floor(tz2 / T)];
    if (at(a[0], a[1], a[2]) === 5) { const st = STAIRS.find(q => a[1] >= q.x0 && a[1] <= q.x1 && a[2] >= q.y0 && a[2] <= q.y1); if (st) a[0] = st.lo; }
    if (at(b[0], b[1], b[2]) === 5) { const st = STAIRS.find(q => b[1] >= q.x0 && b[1] <= q.x1 && b[2] >= q.y0 && b[2] <= q.y1); if (st) b[0] = st.lo; }
    const goal = key(...b), prev = new Map([[key(...a), null]]), q = [a];
    let found = false;
    for (let qi = 0; qi < q.length; qi++) { const c = q[qi], k = key(...c); if (k === goal) { found = true; break; } for (const n of nb(...c, o)) { const nk = key(...n); if (!prev.has(nk)) { prev.set(nk, c); q.push(n); } } }
    if (!found) return null;
    const out = []; let c = b; while (c) { const [l, x, y] = c, [px, pz] = center(x, y); out.unshift([l, px, pz]); c = prev.get(key(...c)); }
    out.shift(); if (out.length) { out[out.length - 1][1] = tx2; out[out.length - 1][2] = tz2; }
    return out;
  }
  // كل المربعات اللي تنمشى (للتوزيع العشوائي)
  const floors = [];
  const calcFloors = () => { floors.length = 0; for (let lv = 0; lv < LV; lv++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(lv, x, y) === 1) { const [cx, cz] = center(x, y); if (!propBlocks(lv, cx, cz, .5)) floors.push([lv, x, y]); } };
  calcFloors();
  const HMAP = { T, W, H, LV, FLOOR_H, CEIL, baseY, ROOMS, DOORS, EXIT, STAIRS, PROPS, PR, grid, at, walk, levelAfter, see, roomOf, roomName, path, floors, center, stairAt, stairP, heightAt, doorAt, setSizes, R: R0,
    spawn: [1, 17 * T, 22 * T], ghostSpawn: [3, 27 * T, 4 * T], exitPt: [1, 17 * T, 25.6 * T], cagePt: [0, 28.5 * T, 22.5 * T] };
  if (typeof module !== 'undefined') module.exports = HMAP; else window.HMAP = HMAP;
})();
