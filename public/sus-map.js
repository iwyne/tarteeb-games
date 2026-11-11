// خريطة لعبة المندس (سفينة فضاء) — مشتركة بين السيرفر والمتصفح
// المناطق اللي يمشي فيها اللاعب = الغرف + الممرات (مستطيلات). الممر يدخل بالغرفة ٥٠ عشان المرور يكون سلس.
const SUSMAP = {
  W: 2220, H: 1320, R: 18,
  rooms: [
    { id: 'eng', name: 'المحركات', x: 80, y: 140, w: 300, h: 280 },
    { id: 'med', name: 'العيادة', x: 500, y: 150, w: 240, h: 240 },
    { id: 'caf', name: 'الكافتيريا', x: 860, y: 80, w: 460, h: 400 },
    { id: 'lab', name: 'المختبر', x: 1440, y: 130, w: 300, h: 280 },
    { id: 'rea', name: 'المفاعل', x: 80, y: 560, w: 300, h: 320 },
    { id: 'sec', name: 'المراقبة', x: 520, y: 580, w: 220, h: 200 },
    { id: 'o2', name: 'الأوكسجين', x: 1460, y: 560, w: 220, h: 200 },
    { id: 'nav', name: 'القيادة', x: 1880, y: 520, w: 260, h: 320 },
    { id: 'ele', name: 'الكهرباء', x: 520, y: 960, w: 260, h: 250 },
    { id: 'sto', name: 'المخزن', x: 920, y: 880, w: 360, h: 360 },
    { id: 'shd', name: 'الدروع', x: 1460, y: 960, w: 280, h: 260 }
  ],
  halls: [
    { x: 330, y: 235, w: 220, h: 90 }, { x: 690, y: 235, w: 220, h: 90 }, { x: 1270, y: 235, w: 220, h: 90 },
    { x: 185, y: 370, w: 90, h: 240 }, { x: 1045, y: 430, w: 90, h: 500 }, { x: 330, y: 625, w: 1600, h: 90 },
    { x: 585, y: 730, w: 90, h: 280 }, { x: 730, y: 1040, w: 240, h: 90 }, { x: 1230, y: 1040, w: 280, h: 90 },
    { x: 1525, y: 360, w: 90, h: 250 }, { x: 1525, y: 710, w: 90, h: 300 }
  ],
  // نقاط مشي البوتات وكيف تتصل
  nodes: { eng: [230, 280], med: [620, 280], caf: [1090, 280], lab: [1570, 280], rea: [230, 670], sec: [630, 670], J1: [1090, 670], o2: [1570, 670], nav: [2010, 670], ele: [630, 1085], sto: [1090, 1085], shd: [1570, 1085] },
  links: [['eng', 'med'], ['med', 'caf'], ['caf', 'lab'], ['eng', 'rea'], ['caf', 'J1'], ['J1', 'sto'], ['rea', 'sec'], ['sec', 'J1'], ['J1', 'o2'], ['o2', 'nav'], ['sec', 'ele'], ['ele', 'sto'], ['sto', 'shd'], ['lab', 'o2'], ['o2', 'shd']],
  // المهام: wires أسلاك، swipe سحب بطاقة، nums أرقام بالترتيب، hold اضغط مطوّل، wait تحميل
  tasks: [
    { id: 't1', room: 'eng', kind: 'hold', name: 'عبّي الوقود', x: 130, y: 200 },
    { id: 't2', room: 'eng', kind: 'wires', name: 'صلّح الأسلاك', x: 300, y: 170 },
    { id: 't3', room: 'med', kind: 'wait', name: 'فحص طبي', x: 620, y: 340 },
    { id: 't4', room: 'caf', kind: 'hold', name: 'فضّ الزبالة', x: 1270, y: 130 },
    { id: 't5', room: 'caf', kind: 'wires', name: 'صلّح الأسلاك', x: 910, y: 430 },
    { id: 't6', room: 'lab', kind: 'nums', name: 'شغّل المختبر', x: 1690, y: 180 },
    { id: 't7', room: 'lab', kind: 'wait', name: 'نزّل البيانات', x: 1490, y: 370 },
    { id: 't8', room: 'nav', kind: 'swipe', name: 'حدّد المسار', x: 2090, y: 580 },
    { id: 't9', room: 'nav', kind: 'hold', name: 'وجّه السفينة', x: 2090, y: 790 },
    { id: 't10', room: 'o2', kind: 'nums', name: 'نظّف الفلتر', x: 1630, y: 600 },
    { id: 't11', room: 'shd', kind: 'nums', name: 'شغّل الدروع', x: 1690, y: 1170 },
    { id: 't12', room: 'sto', kind: 'hold', name: 'عبّي الجالون', x: 970, y: 1190 },
    { id: 't13', room: 'sto', kind: 'swipe', name: 'رتّب الصناديق', x: 1230, y: 930 },
    { id: 't14', room: 'ele', kind: 'wires', name: 'صلّح الأسلاك', x: 570, y: 1010 },
    { id: 't15', room: 'ele', kind: 'hold', name: 'عاير التوزيع', x: 730, y: 1170 },
    { id: 't16', room: 'sec', kind: 'swipe', name: 'مرّر البطاقة', x: 690, y: 740 },
    { id: 't17', room: 'rea', kind: 'nums', name: 'شغّل المفاعل', x: 140, y: 830 }
  ],
  button: [1090, 280],
  vents: [
    [{ x: 320, y: 390 }, { x: 320, y: 600 }],
    [{ x: 700, y: 190 }, { x: 560, y: 750 }, { x: 560, y: 1170 }],
    [{ x: 1480, y: 170 }, { x: 1500, y: 730 }, { x: 1920, y: 560 }],
    [{ x: 1500, y: 1180 }, { x: 1240, y: 1200 }]
  ],
  fix: { lights: [690, 985], reactor: [[110, 600], [350, 850]] },
  spawn: [1090, 360]
};
SUSMAP.walk = function (x, y, free) {
  if (free) return x >= 20 && y >= 20 && x <= SUSMAP.W - 20 && y <= SUSMAP.H - 20;
  const r = SUSMAP.R;
  const inR = q => x >= q.x + r && x <= q.x + q.w - r && y >= q.y + r && y <= q.y + q.h - r;
  return SUSMAP.rooms.some(inR) || SUSMAP.halls.some(inR);
};
SUSMAP.roomAt = function (x, y) { const q = SUSMAP.rooms.find(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h); return q ? q.name : 'الممرات'; };
if (typeof module !== 'undefined') module.exports = SUSMAP;
