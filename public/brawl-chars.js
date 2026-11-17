// ساحة القتال: الشخصيات وقدراتها — مشتركة بين السيرفر والمتصفح
// الأنواع: proj مقذوف، dash اندفاع بضربة، grab مسكة (ما تنصد)، tele انتقال ورا الخصم، stomp ضربة أرضية ما تنصد،
// shield درع يمتص ضربة، counter وقفة صد مضاد، spin ركلة دوّارة متعددة، poke ضربة بعيدة.
// السوبر: rush اندفاع بضربات متتالية، beam شعاع بعرض الساحة، quake زلزال ما ينصد، heal علاج مع ضربة.
var FZ = (() => {
  const BASE = {
    p: { n: 'لكمة', wind: 110, rec: 170, range: 82, dmg: 5, kb: 24, stun: 260 },
    k: { n: 'ركلة', wind: 270, rec: 290, range: 114, dmg: 10, kb: 70, stun: 420 }
  };
  const C = [
    { id: 'fahd', n: 'فهد', t: 'حارس الصحراء', col: '#c98b3a', col2: '#2b4d3a', skin: '#c88a5e', head: 'shemagh', hp: 100, spd: 330, pow: 1, def: 1,
      s1: { n: 'ركلة الصقر', ty: 'dash', wind: 190, dist: 230, range: 90, dmg: 13, kb: 140, stun: 520, cd: 3500 },
      s2: { n: 'عاصفة رمل', ty: 'proj', wind: 300, speed: 620, dmg: 11, cd: 4000, fx: 'sand' },
      sup: { n: 'غضب الصحراء', ty: 'rush', dist: 330, hits: 5, dmg: 30 } },
    { id: 'noura', n: 'نورة', t: 'البرق', col: '#9b59d0', col2: '#16130f', skin: '#e3b48c', head: 'pony', hp: 85, spd: 420, pow: .92, def: .95,
      s1: { n: 'خطفة البرق', ty: 'tele', wind: 120, cd: 3800 },
      s2: { n: 'ركلة دوّارة', ty: 'spin', wind: 170, range: 118, dmg: 6, hits: 2, kb: 60, stun: 380, cd: 3000 },
      sup: { n: 'ألف ضربة', ty: 'rush', dist: 360, hits: 8, dmg: 28 } },
    { id: 'azzam', n: 'عزّام', t: 'الجبل', col: '#8b2f2f', col2: '#3a2210', skin: '#b67a52', head: 'bald', hp: 125, spd: 250, pow: 1.25, def: 1.1,
      s1: { n: 'مسكة الدب', ty: 'grab', wind: 160, range: 78, dmg: 16, kb: 280, stun: 700, cd: 4000 },
      s2: { n: 'دوسة الأرض', ty: 'stomp', wind: 520, range: 270, dmg: 10, kb: 120, stun: 650, cd: 5000 },
      sup: { n: 'زلزال', ty: 'quake', range: 460, dmg: 28 } },
    { id: 'sultana', n: 'سلطانة', t: 'ساحرة النار', col: '#e8362d', col2: '#f2b705', skin: '#e9bf98', head: 'hijab', hp: 90, spd: 300, pow: 1, def: .95,
      s1: { n: 'كرة نار', ty: 'proj', wind: 260, speed: 600, dmg: 12, cd: 2600, fx: 'fire' },
      s2: { n: 'درع', ty: 'shield', wind: 120, dur: 3200, cd: 7000 },
      sup: { n: 'نيزك', ty: 'beam', speed: 1400, dmg: 30 } },
    { id: 'bandar', n: 'بندر', t: 'الظل', col: '#2b2b3a', col2: '#19c3d6', skin: '#d8a27a', head: 'mask', hp: 95, spd: 380, pow: .95, def: 1,
      s1: { n: 'شوريكن', ty: 'proj', wind: 150, speed: 950, dmg: 7, cd: 1800, fx: 'star' },
      s2: { n: 'ظل مضاد', ty: 'counter', wind: 60, dur: 650, dmg: 14, cd: 4500 },
      sup: { n: 'قطع الظلال', ty: 'rush', dist: 999, hits: 6, dmg: 29, tele: true } },
    { id: 'jaddo', n: 'جدّو', t: 'المعلّم', col: '#f3ead8', col2: '#7a5a3a', skin: '#c99a76', head: 'ghutra', hp: 110, spd: 260, pow: 1.05, def: 1.1,
      s1: { n: 'صدّة المعلّم', ty: 'counter', wind: 60, dur: 450, dmg: 13, cd: 4000 },
      s2: { n: 'العكّاز', ty: 'poke', wind: 260, range: 235, dmg: 10, kb: 90, stun: 450, cd: 2200 },
      sup: { n: 'حكمة الأجداد', ty: 'heal', heal: 25, range: 220, dmg: 15 } }
  ];
  const STAGES = [
    { id: 'souq', n: 'سوق الزل' }, { id: 'dunes', n: 'كثبان النفود' }, { id: 'city', n: 'سطح برج المملكة' }
  ];
  const byId = Object.fromEntries(C.map(c => [c.id, c]));
  return { BASE, C, byId, STAGES, W: 1000, HALF: 42, GAP: 72 };
})();
if (typeof module !== 'undefined') module.exports = FZ;
