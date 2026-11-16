// أدوات صغيرة للبوتات: كل بوت ينتظر وقت عشوائي، بس لو كل اللاعبين الحقيقيين خلصوا
// نخلّي البوتات الباقية تخلص بسرعة (بدل ما الكل ينتظر البوت ثواني طويلة)
const rnd = n => Math.random() * n | 0;
module.exports = (H, SCALE = 1) => {
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  // يجدول حركة بوت، ويسجلها عشان hurry تقدر تقدّمها
  function botLater(r, b, ms, fn) {
    const g = r.g; if (!g.pend) g.pend = {};
    const key = b.id + ':' + Math.random().toString(36).slice(2, 7);
    g.pend[key] = fn;
    later(r, ms, () => { if (g.pend[key] === fn) { delete g.pend[key]; fn(); } });
  }
  // تقدّم كل حركات البوتات المعلّقة (بفواصل صغيرة عشان تبان طبيعية)
  function hurry(r) {
    const g = r.g; if (!g || !g.pend) return;
    Object.keys(g.pend).forEach((key, i) => {
      const fn = g.pend[key];
      later(r, (450 + i * 300 + rnd(350)) * SCALE, () => { if (g.pend[key] === fn) { delete g.pend[key]; fn(); } });
    });
  }
  const clear = r => { if (r.g) r.g.pend = {}; };
  // هل كل اللاعبين الحقيقيين (المتصلين) سوّوا الشي؟
  const humansDone = (r, did) => r.players.filter(p => !p.bot && p.online && !p.spec).every(did);
  return { later, botLater, hurry, clear, humansDone };
};
