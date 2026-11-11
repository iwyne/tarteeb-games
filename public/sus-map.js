// خريطة لعبة المندس (سفينة فضاء) — مشتركة بين السيرفر والمتصفح
// الأرضية = الغرف + الممرات (مستطيلات). الممر يدخل بالغرفة ٦٠ عشان المرور يكون سلس.
// الأثاث (obs) يصطدم فيه اللاعب، والجدران تحجب الرؤية.
const SUSMAPS = {};
SUSMAPS.ship = {
  key: 'ship', name: 'السفينة', theme: 'ship', W: 4350, H: 2700, R: 22, vis: { crew: 560, imp: 700, dark: 210 },
  sabo: { lights: { btn: '💡 طفّ الكهرباء', msg: '💡 الكهرباء طافية! روحوا صلّحوها بغرفة الكهرباء', fixed: 'رجعت الكهرباء 💡' }, reactor: { btn: '☢️ فجّر المفاعل', msg: 'المفاعل بينفجر بعد', how: 'لازم اثنين يمسكون اللوحتين بالمفاعل مع بعض', fixed: 'انصلح المفاعل ✅', lose: 'انفجر المفاعل 💥' } },
  out: 'انطرد من السفينة', btnWord: 'ضغط الزر', meetWord: 'اجتماع طارئ!',
  rooms: [
    { id: 'eng', name: 'المحركات', x: 150, y: 200, w: 600, h: 550, f: '#f3d9c0' },
    { id: 'med', name: 'العيادة', x: 950, y: 250, w: 500, h: 500, f: '#d3ecee' },
    { id: 'caf', name: 'الكافتيريا', x: 1650, y: 150, w: 1000, h: 800, f: '#f1e6cf' },
    { id: 'wpn', name: 'الأسلحة', x: 2850, y: 200, w: 550, h: 550, f: '#e6dcf3' },
    { id: 'rea', name: 'المفاعل', x: 150, y: 1050, w: 600, h: 700, f: '#f5d3cd' },
    { id: 'sec', name: 'المراقبة', x: 950, y: 1150, w: 450, h: 450, f: '#dfe6d6' },
    { id: 'adm', name: 'الإدارة', x: 1850, y: 1250, w: 540, h: 450, f: '#f4ecc6' },
    { id: 'o2', name: 'الأوكسجين', x: 3000, y: 1100, w: 450, h: 450, f: '#d3efd9' },
    { id: 'nav', name: 'القيادة', x: 3750, y: 1000, w: 550, h: 700, f: '#d6e3f6' },
    { id: 'low', name: 'المحرك السفلي', x: 150, y: 1950, w: 600, h: 600, f: '#f3d9c0' },
    { id: 'ele', name: 'الكهرباء', x: 950, y: 2000, w: 500, h: 550, f: '#f6eec4' },
    { id: 'sto', name: 'المخزن', x: 1650, y: 1950, w: 1000, h: 700, f: '#eadfcc' },
    { id: 'com', name: 'الاتصالات', x: 2800, y: 2050, w: 450, h: 500, f: '#dcdff3' },
    { id: 'shd', name: 'الدروع', x: 3400, y: 1950, w: 550, h: 550, f: '#e4d8f1' }
  ],
  halls: [
    { x: 690, y: 400, w: 320, h: 140 }, { x: 1390, y: 400, w: 320, h: 140 }, { x: 2590, y: 400, w: 320, h: 140 },
    { x: 380, y: 690, w: 140, h: 420 }, { x: 380, y: 1690, w: 140, h: 320 }, { x: 690, y: 1330, w: 320, h: 140 },
    { x: 1110, y: 1540, w: 140, h: 520 }, { x: 690, y: 2260, w: 320, h: 140 }, { x: 1390, y: 2260, w: 320, h: 140 },
    { x: 2450, y: 890, w: 140, h: 1120 }, { x: 2330, y: 1400, w: 180, h: 140 }, { x: 3150, y: 690, w: 140, h: 470 },
    { x: 3390, y: 1250, w: 420, h: 140 }, { x: 3790, y: 1640, w: 140, h: 370 }, { x: 3190, y: 2130, w: 270, h: 140 },
    { x: 2590, y: 2260, w: 270, h: 140 }
  ],
  // أثاث يصطدم فيه: c دائرة، r مستطيل. k نوع الرسمة
  obs: [
    { t: 'c', x: 2150, y: 620, r: 75, k: 'button' },
    { t: 'c', x: 1850, y: 280, r: 60, k: 'table' }, { t: 'c', x: 2300, y: 260, r: 60, k: 'table' }, { t: 'c', x: 1850, y: 800, r: 60, k: 'table' }, { t: 'c', x: 2320, y: 830, r: 60, k: 'table' },
    { t: 'r', x: 170, y: 230, w: 220, h: 180, k: 'engine' }, { t: 'r', x: 560, y: 590, w: 170, h: 140, k: 'box' },
    { t: 'r', x: 980, y: 290, w: 170, h: 95, k: 'bed' }, { t: 'r', x: 980, y: 570, w: 170, h: 95, k: 'bed' }, { t: 'c', x: 1350, y: 650, r: 50, k: 'scan' },
    { t: 'c', x: 3060, y: 330, r: 70, k: 'gun' },
    { t: 'c', x: 270, y: 1250, r: 85, k: 'core' },
    { t: 'r', x: 980, y: 1175, w: 260, h: 70, k: 'desk' },
    { t: 'r', x: 1900, y: 1560, w: 220, h: 110, k: 'admin' },
    { t: 'c', x: 3080, y: 1180, r: 36, k: 'plant' }, { t: 'c', x: 3380, y: 1480, r: 36, k: 'plant' }, { t: 'c', x: 3080, y: 1480, r: 36, k: 'plant' },
    { t: 'r', x: 4140, y: 1200, w: 110, h: 260, k: 'console' }, { t: 'c', x: 3980, y: 1560, r: 45, k: 'seat' },
    { t: 'r', x: 180, y: 2050, w: 220, h: 180, k: 'engine' },
    { t: 'r', x: 1300, y: 2040, w: 120, h: 80, k: 'gen' },
    { t: 'r', x: 1720, y: 2020, w: 140, h: 140, k: 'crate' }, { t: 'r', x: 1900, y: 2470, w: 160, h: 120, k: 'crate' }, { t: 'r', x: 2250, y: 2030, w: 120, h: 120, k: 'crate' }, { t: 'r', x: 2200, y: 2480, w: 110, h: 110, k: 'crate' },
    { t: 'r', x: 2850, y: 2460, w: 150, h: 70, k: 'desk' },
    { t: 'c', x: 3600, y: 2400, r: 70, k: 'dish' }
  ],
  nodes: { btN: [2150, 455], btE: [2315, 620], btS: [2150, 785], btW: [1985, 620], cafW: [1760, 470], stoW: [1760, 2330], reaN: [450, 1120], eng: [450, 470], med: [1200, 470], caf: [2520, 470], wpn: [3220, 470], rea: [450, 1400], sec: [1180, 1400], ele: [1180, 2330], low: [450, 2330], sto: [2520, 2330], J: [2520, 1470], adm: [2100, 1470], comA: [3020, 2200], com: [3020, 2330], shd: [3860, 2200], nav: [3860, 1320], o2: [3220, 1320] },
  links: [['btN', 'btE'], ['btE', 'btS'], ['btS', 'btW'], ['btW', 'btN'], ['btN', 'caf'], ['btN', 'cafW'], ['eng', 'med'], ['med', 'cafW'], ['cafW', 'caf'], ['eng', 'reaN'], ['reaN', 'rea'], ['ele', 'stoW'], ['stoW', 'sto'], ['caf', 'wpn'], ['rea', 'low'], ['rea', 'sec'], ['sec', 'ele'], ['low', 'ele'], ['caf', 'J'], ['J', 'adm'], ['J', 'sto'], ['sto', 'com'], ['com', 'comA'], ['comA', 'shd'], ['shd', 'nav'], ['nav', 'o2'], ['o2', 'wpn']],
  // المهام: wires أسلاك، swipe بطاقة، nums أرقام، hold ضغط مطوّل، wait تحميل، slider مؤشر، simon ذاكرة، tap نظافة، code رمز، temp حرارة
  tasks: [
    { id: 't1', room: 'eng', kind: 'hold', name: 'عبّي الوقود', x: 200, y: 600 },
    { id: 't2', room: 'eng', kind: 'slider', name: 'عدّل المحرك', x: 690, y: 260 },
    { id: 't3', room: 'med', kind: 'wait', name: 'فحص طبي', x: 1360, y: 550 },
    { id: 't4', room: 'med', kind: 'tap', name: 'عقّم الأدوات', x: 1400, y: 300 },
    { id: 't5', room: 'caf', kind: 'wires', name: 'صلّح الأسلاك', x: 1700, y: 890 },
    { id: 't6', room: 'caf', kind: 'hold', name: 'فضّ الزبالة', x: 2600, y: 200 },
    { id: 't7', room: 'caf', kind: 'code', name: 'حمّل التحديث', x: 1700, y: 200 },
    { id: 't8', room: 'wpn', kind: 'tap', name: 'دمّر النيازك', x: 3350, y: 680 },
    { id: 't9', room: 'wpn', kind: 'slider', name: 'عاير المدفع', x: 2900, y: 680 },
    { id: 't10', room: 'rea', kind: 'simon', name: 'شغّل المفاعل', x: 210, y: 1690 },
    { id: 't11', room: 'rea', kind: 'nums', name: 'افتح البوابة', x: 690, y: 1110 },
    { id: 't12', room: 'sec', kind: 'wires', name: 'صلّح الأسلاك', x: 1350, y: 1550 },
    { id: 't13', room: 'sec', kind: 'code', name: 'حدّث الكاميرات', x: 1000, y: 1550 },
    { id: 't14', room: 'adm', kind: 'swipe', name: 'مرّر البطاقة', x: 2330, y: 1300 },
    { id: 't15', room: 'adm', kind: 'wait', name: 'ارفع البيانات', x: 1900, y: 1300 },
    { id: 't16', room: 'o2', kind: 'tap', name: 'نظّف الفلتر', x: 3220, y: 1500 },
    { id: 't17', room: 'o2', kind: 'temp', name: 'اضبط الضغط', x: 3400, y: 1150 },
    { id: 't18', room: 'nav', kind: 'swipe', name: 'حدّد المسار', x: 4250, y: 1080 },
    { id: 't19', room: 'nav', kind: 'slider', name: 'وجّه السفينة', x: 4240, y: 1640 },
    { id: 't20', room: 'low', kind: 'hold', name: 'عبّي المحرك', x: 200, y: 2500 },
    { id: 't21', room: 'low', kind: 'temp', name: 'برّد المحرك', x: 690, y: 2030 },
    { id: 't22', room: 'ele', kind: 'wires', name: 'صلّح الأسلاك', x: 1000, y: 2060 },
    { id: 't23', room: 'ele', kind: 'nums', name: 'عاير التوزيع', x: 1000, y: 2500 },
    { id: 't24', room: 'ele', kind: 'simon', name: 'شغّل المولد', x: 1400, y: 2500 },
    { id: 't25', room: 'sto', kind: 'hold', name: 'عبّي الجالون', x: 1700, y: 2600 },
    { id: 't26', room: 'sto', kind: 'tap', name: 'رتّب الصناديق', x: 2600, y: 2600 },
    { id: 't27', room: 'com', kind: 'code', name: 'صلّح الاتصالات', x: 3200, y: 2110 },
    { id: 't28', room: 'com', kind: 'slider', name: 'اضبط الإشارة', x: 2850, y: 2110 },
    { id: 't29', room: 'shd', kind: 'nums', name: 'شغّل الدروع', x: 3900, y: 2450 },
    { id: 't30', room: 'shd', kind: 'temp', name: 'اشحن الدروع', x: 3460, y: 2010 }
  ],
  button: [2150, 620], btnR: 75,
  vents: [
    [{ x: 680, y: 260 }, { x: 220, y: 1110 }, { x: 680, y: 2010 }],
    [{ x: 1250, y: 700 }, { x: 1350, y: 1250 }, { x: 1400, y: 2200 }],
    [{ x: 2600, y: 880 }, { x: 1910, y: 1300 }],
    [{ x: 3350, y: 260 }, { x: 3200, y: 1150 }, { x: 4220, y: 1050 }],
    [{ x: 3900, y: 2010 }, { x: 3200, y: 2500 }, { x: 2600, y: 2100 }]
  ],
  cams: [{ x: 1550, y: 470, n: 'ممر العيادة' }, { x: 2520, y: 1200, n: 'الممر الرئيسي' }, { x: 450, y: 1850, n: 'ممر المحركات' }, { x: 3600, y: 1320, n: 'ممر القيادة' }],
  camSpot: [1110, 1300], camR: 420,
  fix: { lights: [1000, 2200], reactor: [[200, 1100], [700, 1700]] },
  spawn: [2150, 620], spawnR: 160
};
// ===== الغابة الملعونة (ماب رعب) =====
SUSMAPS.forest = {
  key: 'forest', name: 'الغابة الملعونة', theme: 'forest', W: 4700, H: 3250, R: 22, vis: { crew: 430, imp: 560, dark: 150 },
  sabo: { lights: { btn: '🔦 طفّ الأنوار', msg: '🔦 الأنوار طافية! روحوا شغّلوا المولّد ببرج الراديو', fixed: 'رجعت الأنوار 🔦' }, reactor: { btn: '🩸 افتح الشق', msg: 'الشق بينفتح بعد', how: 'لازم اثنين يقفلون الختمين عند الشق مع بعض', fixed: 'انقفل الشق ✅', lose: 'انفتح الشق وطلع اللي فيه 🩸' } },
  out: 'انرمى بالغابة', btnWord: 'دقّ الجرس', meetWord: 'دقّوا الجرس!',
  rooms: [
    { id: 'cabin', name: 'الكوخ', x: 600, y: 300, w: 600, h: 500, ty: 'wood' },
    { id: 'well', name: 'البئر', x: 1500, y: 300, w: 450, h: 450, ty: 'stone', out: 1 },
    { id: 'tower', name: 'برج الراديو', x: 2300, y: 200, w: 550, h: 550, ty: 'tile' },
    { id: 'lab', name: 'المختبر المهجور', x: 3600, y: 300, w: 800, h: 700, ty: 'lab' },
    { id: 'grave', name: 'المقبرة', x: 300, y: 1300, w: 700, h: 700, ty: 'grass', out: 1 },
    { id: 'gate', name: 'الشق', x: 1350, y: 1300, w: 500, h: 500, ty: 'rift', out: 1 },
    { id: 'camp', name: 'المخيم', x: 2150, y: 1150, w: 900, h: 800, ty: 'dirt', out: 1 },
    { id: 'lake', name: 'البحيرة', x: 3500, y: 1250, w: 900, h: 800, ty: 'grass', out: 1 },
    { id: 'tunnel', name: 'النفق', x: 300, y: 2450, w: 600, h: 550, ty: 'rock' },
    { id: 'school', name: 'المدرسة القديمة', x: 1150, y: 2400, w: 700, h: 650, ty: 'wood2' },
    { id: 'fire', name: 'الأرض المحروقة', x: 2350, y: 2350, w: 900, h: 700, ty: 'ash', out: 1 },
    { id: 'church', name: 'الكنيسة المهجورة', x: 3700, y: 2400, w: 700, h: 600, ty: 'stone' }
  ],
  halls: [
    { x: 1140, y: 450, w: 420, h: 150 }, { x: 1890, y: 450, w: 470, h: 150 }, { x: 2790, y: 450, w: 870, h: 150 },
    { x: 940, y: 1450, w: 470, h: 150 }, { x: 1790, y: 1450, w: 420, h: 150 }, { x: 2990, y: 1450, w: 570, h: 150 },
    { x: 840, y: 2600, w: 370, h: 150 }, { x: 1790, y: 2600, w: 620, h: 150 }, { x: 3190, y: 2600, w: 570, h: 150 },
    { x: 750, y: 740, w: 150, h: 620 }, { x: 2450, y: 690, w: 150, h: 520 }, { x: 3900, y: 940, w: 150, h: 370 },
    { x: 500, y: 1940, w: 150, h: 570 }, { x: 2600, y: 1890, w: 150, h: 520 }, { x: 4000, y: 1990, w: 150, h: 470 },
    { x: 1500, y: 1740, w: 150, h: 720 }
  ],
  obs: [
    { t: 'c', x: 2350, y: 1750, r: 70, k: 'campfire' },
    { t: 'r', x: 630, y: 320, w: 150, h: 90, k: 'bed2' }, { t: 'r', x: 950, y: 650, w: 160, h: 100, k: 'table2' }, { t: 'r', x: 1050, y: 310, w: 130, h: 70, k: 'hearth' }, { t: 'r', x: 620, y: 680, w: 140, h: 60, k: 'shelf' },
    { t: 'c', x: 1720, y: 680, r: 70, k: 'well' }, { t: 'c', x: 1560, y: 360, r: 45, k: 'tree' }, { t: 'c', x: 1880, y: 360, r: 45, k: 'tree' },
    { t: 'r', x: 2620, y: 250, w: 180, h: 180, k: 'mast' }, { t: 'r', x: 2330, y: 620, w: 120, h: 90, k: 'gen2' }, { t: 'r', x: 2310, y: 215, w: 160, h: 50, k: 'monitors' },
    { t: 'r', x: 3650, y: 650, w: 200, h: 90, k: 'labtable' }, { t: 'c', x: 4250, y: 380, r: 60, k: 'tank' }, { t: 'r', x: 4100, y: 700, w: 220, h: 90, k: 'labtable' }, { t: 'c', x: 3700, y: 380, r: 50, k: 'pod' },
    { t: 'r', x: 350, y: 1350, w: 50, h: 70, k: 'tomb' }, { t: 'r', x: 450, y: 1380, w: 50, h: 70, k: 'tomb' }, { t: 'r', x: 350, y: 1650, w: 50, h: 70, k: 'tomb' }, { t: 'r', x: 700, y: 1650, w: 50, h: 70, k: 'tomb' }, { t: 'r', x: 400, y: 1850, w: 50, h: 70, k: 'tomb' }, { t: 'r', x: 750, y: 1850, w: 50, h: 70, k: 'tomb' },
    { t: 'c', x: 900, y: 1700, r: 40, k: 'deadtree' }, { t: 'c', x: 420, y: 1430, r: 40, k: 'deadtree' },
    { t: 'c', x: 1700, y: 1380, r: 60, k: 'rift' }, { t: 'c', x: 1420, y: 1700, r: 45, k: 'tree' }, { t: 'c', x: 1760, y: 1720, r: 45, k: 'tree' },
    { t: 'r', x: 2800, y: 1200, w: 200, h: 140, k: 'tent' }, { t: 'r', x: 2850, y: 1700, w: 170, h: 140, k: 'tent' }, { t: 'r', x: 2180, y: 1200, w: 220, h: 120, k: 'van' },
    { t: 'c', x: 3750, y: 1850, r: 150, k: 'water' }, { t: 'r', x: 4200, y: 1750, w: 150, h: 60, k: 'dock' }, { t: 'c', x: 4300, y: 1350, r: 40, k: 'boat' },
    { t: 'c', x: 380, y: 2900, r: 50, k: 'rock' }, { t: 'c', x: 800, y: 2900, r: 50, k: 'rock' }, { t: 'c', x: 380, y: 2520, r: 40, k: 'rock' },
    { t: 'r', x: 1200, y: 2450, w: 120, h: 70, k: 'desk2' }, { t: 'r', x: 1650, y: 2450, w: 120, h: 70, k: 'desk2' }, { t: 'r', x: 1250, y: 2850, w: 130, h: 70, k: 'desk2' }, { t: 'r', x: 1550, y: 2850, w: 130, h: 70, k: 'desk2' },
    { t: 'c', x: 2450, y: 2450, r: 45, k: 'burn' }, { t: 'c', x: 3100, y: 2450, r: 45, k: 'burn' }, { t: 'c', x: 2450, y: 2950, r: 45, k: 'burn' }, { t: 'c', x: 3100, y: 2900, r: 45, k: 'burn' }, { t: 'c', x: 2900, y: 2900, r: 80, k: 'lava' }, { t: 'r', x: 2800, y: 2400, w: 180, h: 100, k: 'wreck' },
    { t: 'r', x: 3750, y: 2800, w: 250, h: 60, k: 'pew' }, { t: 'r', x: 4150, y: 2800, w: 200, h: 60, k: 'pew' }, { t: 'r', x: 4200, y: 2450, w: 150, h: 80, k: 'altar' }, { t: 'c', x: 3780, y: 2470, r: 30, k: 'candles' }
  ],
  nodes: { cfN: [2350, 1580], cfE: [2520, 1750], cfS: [2350, 1920], cfW: [2180, 1750], cabin: [825, 525], well: [1720, 525], tower: [2525, 525], lab: [3975, 525], grave: [825, 1525], grave2: [575, 1525], gate: [1575, 1525], camp: [2525, 1525], campB: [2675, 1525], lake: [3975, 1525], lakeB: [4075, 1525], tunnel: [575, 2675], school: [1575, 2675], fire: [2675, 2675], church: [4075, 2675] },
  links: [['cfN', 'cfE'], ['cfE', 'cfS'], ['cfS', 'cfW'], ['cfW', 'cfN'], ['cfN', 'camp'], ['cfE', 'campB'], ['cabin', 'well'], ['well', 'tower'], ['tower', 'lab'], ['cabin', 'grave'], ['grave', 'grave2'], ['grave', 'gate'], ['gate', 'camp'], ['camp', 'campB'], ['campB', 'lake'], ['lake', 'lakeB'], ['tower', 'camp'], ['lab', 'lake'], ['grave2', 'tunnel'], ['campB', 'fire'], ['lakeB', 'church'], ['gate', 'school'], ['tunnel', 'school'], ['school', 'fire'], ['fire', 'church']],
  tasks: [
    { id: 'f1', room: 'cabin', kind: 'hold', name: 'ولّع المدفأة', x: 1100, y: 430 },
    { id: 'f2', room: 'cabin', kind: 'wires', name: 'صلّح الكهرباء', x: 650, y: 560 },
    { id: 'f3', room: 'cabin', kind: 'swipe', name: 'افتح الباب', x: 650, y: 460 },
    { id: 'f4', room: 'well', kind: 'hold', name: 'اسحب الدلو', x: 1720, y: 578 },
    { id: 'f5', room: 'well', kind: 'tap', name: 'طرّد الخفافيش', x: 1900, y: 700 },
    { id: 'f6', room: 'tower', kind: 'slider', name: 'اضبط الموجة', x: 2700, y: 680 },
    { id: 'f7', room: 'tower', kind: 'code', name: 'أرسل نداء استغاثة', x: 2330, y: 520 },
    { id: 'f8', room: 'tower', kind: 'tap', name: 'نظّف اللاقط', x: 2800, y: 700 },
    { id: 'f9', room: 'lab', kind: 'nums', name: 'شغّل الجهاز', x: 3950, y: 960 },
    { id: 'f10', room: 'lab', kind: 'simon', name: 'افتح الخزنة', x: 4350, y: 560 },
    { id: 'f11', room: 'lab', kind: 'wait', name: 'نزّل الملفات السرية', x: 3650, y: 560 },
    { id: 'f12', room: 'grave', kind: 'tap', name: 'نظّف القبور', x: 650, y: 1950 },
    { id: 'f13', room: 'grave', kind: 'code', name: 'اقرا الشاهد', x: 950, y: 1350 },
    { id: 'f14', room: 'grave', kind: 'hold', name: 'احفر', x: 330, y: 1560 },
    { id: 'f15', room: 'gate', kind: 'hold', name: 'راقب الشق', x: 1500, y: 1340 },
    { id: 'f16', room: 'gate', kind: 'slider', name: 'ثبّت الطاقة', x: 1800, y: 1550 },
    { id: 'f17', room: 'camp', kind: 'wires', name: 'صلّح الكشّاف', x: 2200, y: 1500 },
    { id: 'f18', room: 'camp', kind: 'temp', name: 'اطبخ العشا', x: 2600, y: 1900 },
    { id: 'f19', room: 'camp', kind: 'swipe', name: 'سجّل الحضور', x: 3000, y: 1560 },
    { id: 'f20', room: 'lake', kind: 'hold', name: 'اسحب الشبكة', x: 4340, y: 1640 },
    { id: 'f21', room: 'lake', kind: 'tap', name: 'طرّد الغربان', x: 3550, y: 1300 },
    { id: 'f22', room: 'lake', kind: 'nums', name: 'شغّل المضخة', x: 3550, y: 1650 },
    { id: 'f23', room: 'tunnel', kind: 'nums', name: 'شغّل العربة', x: 850, y: 2500 },
    { id: 'f24', room: 'tunnel', kind: 'wait', name: 'ولّع كشّاف النفق', x: 350, y: 2700 },
    { id: 'f25', room: 'tunnel', kind: 'temp', name: 'دفّي المكان', x: 870, y: 2780 },
    { id: 'f26', room: 'school', kind: 'code', name: 'افتح الخزانة', x: 1200, y: 2600 },
    { id: 'f27', room: 'school', kind: 'simon', name: 'حل اللغز', x: 1820, y: 2700 },
    { id: 'f28', room: 'school', kind: 'wires', name: 'صلّح الجرس', x: 1400, y: 2770 },
    { id: 'f29', room: 'fire', kind: 'hold', name: 'طفّ النار', x: 2400, y: 2700 },
    { id: 'f30', room: 'fire', kind: 'tap', name: 'اجمع الرماد', x: 3200, y: 2700 },
    { id: 'f31', room: 'fire', kind: 'slider', name: 'برّد الحمم', x: 2675, y: 2980 },
    { id: 'f32', room: 'fire', kind: 'wires', name: 'صلّح المضخة', x: 2675, y: 2400 },
    { id: 'f33', room: 'church', kind: 'simon', name: 'ردّد الترنيمة', x: 4350, y: 2700 },
    { id: 'f34', room: 'church', kind: 'wait', name: 'اقرا المخطوطة', x: 3750, y: 2650 },
    { id: 'f35', room: 'church', kind: 'code', name: 'افتح القبو', x: 4075, y: 2965 }
  ],
  button: [2350, 1750], btnR: 70,
  vents: [
    [{ x: 1150, y: 560 }, { x: 950, y: 1450 }, { x: 830, y: 2620 }],
    [{ x: 1550, y: 700 }, { x: 2350, y: 450 }, { x: 1400, y: 1480 }],
    [{ x: 4350, y: 950 }, { x: 4350, y: 1450 }, { x: 3750, y: 2580 }],
    [{ x: 3000, y: 1460 }, { x: 3200, y: 2420 }, { x: 1820, y: 2440 }]
  ],
  cams: [{ x: 1350, y: 525, n: 'درب الكوخ' }, { x: 3200, y: 525, n: 'درب المختبر' }, { x: 3300, y: 1525, n: 'درب البحيرة' }, { x: 2100, y: 2675, n: 'درب المدرسة' }],
  camSpot: [2390, 310], camR: 420,
  fix: { lights: [2390, 590], reactor: [[1400, 1350], [1800, 1650]] },
  spawn: [2350, 1750], spawnR: 160
};

function susPrep(M) {
  // الأرضية الخام (بدون نصف قطر اللاعب) — للرؤية والجدران
  M.area = (x, y) => M.rooms.some(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h) || M.halls.some(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
  // شبكة سريعة للرؤية: كل خانة ١٠ وحدات
  const C = 10, GW = Math.ceil(M.W / C), GH = Math.ceil(M.H / C), grid = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) grid[j * GW + i] = M.area(i * C + C / 2, j * C + C / 2) ? 1 : 0;
  M.open = (x, y) => { const i = x / C | 0, j = y / C | 0; return i >= 0 && j >= 0 && i < GW && j < GH && grid[j * GW + i] === 1; };
  // هل فيه خط نظر بين نقطتين (الجدران تحجب، الأثاث لا)
  M.see = (x1, y1, x2, y2) => { const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 12); for (let k = 1; k < n; k++) if (!M.open(x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n)) return false; return true; };
  const hitObs = (x, y, r) => M.obs.some(o => o.t === 'c' ? Math.hypot(x - o.x, y - o.y) < o.r + r : x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r);
  M.hitObs = hitObs;
  M.walk = function (x, y, free) {
    if (free) return x >= 20 && y >= 20 && x <= M.W - 20 && y <= M.H - 20;
    const r = M.R, inR = q => x >= q.x + r && x <= q.x + q.w - r && y >= q.y + r && y <= q.y + q.h - r;
    return (M.rooms.some(inR) || M.halls.some(inR)) && !hitObs(x, y, r);
  };
  M.roomAt = (x, y) => { const q = M.rooms.find(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h); return q ? q.name : 'الممرات'; };
  return M;
}
Object.values(SUSMAPS).forEach(susPrep);
var SUSMAP = SUSMAPS.ship;
if (typeof module !== 'undefined') module.exports = SUSMAPS;
