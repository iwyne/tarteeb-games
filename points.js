// نقاط السيرفر: كل لاعب (حسب جهازه أو حساب ديسكورد) يجمع نقاط من كل الألعاب.
// آخر كل جولة نرسل له وش أخذ (فوز +٢٠، لعب للآخر +٥، كل ٣ فوزات ورا بعض +١٠) ومستواه وترتيبه بالأسبوع.
// البيانات بـ data/points.json (أو POINTS_DATA). ريندر المجاني يمسح الملفات بعد إعادة النشر.
const fs = require('fs'), path = require('path');
const FILE = process.env.POINTS_DATA || path.join(__dirname, 'data', 'points.json');
const LVL = 200, MIN_MS = +process.env.POINTS_MIN_MS || 30000; // كل مستوى ٢٠٠ نقطة، والجولة لازم تطول ٣٠ ثانية عشان تنحسب
let D = {};
try { D = JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch {}
let saveT = null;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(D)); } catch (e) { console.error('points save', e.message); } }, 3000); };

// الأسبوع يبدأ السبت بتوقيت الرياض
function week(t = Date.now()) { const d = new Date(t + 3 * 3600e3); const day = (d.getUTCDay() + 1) % 7; return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 864e5 - day)); }
const keyOf = p => p.bot ? null : p.uid ? 'd:' + p.uid : p.dev ? 'v:' + p.dev : null;
function rankOf(k, wk) {
  const me = D[k]; if (!me || me.wk !== wk || !me.wp) return 0;
  let n = 1; for (const x in D) if (x !== k && D[x].wk === wk && D[x].wp > me.wp) n++;
  return n;
}
const lvl = pts => { const l = Math.floor(pts / LVL) + 1; return { lvl: l, into: pts - (l - 1) * LVL, need: LVL }; };

module.exports = ({ send }) => ({
  // بداية الجولة: نحفظ مين يلعب وكم فوز عنده
  start(r) { r.noPts = null; r.pts = { at: Date.now(), done: false, base: new Map(r.players.filter(p => !p.bot).map(p => [p, p.wins || 0])) }; },
  // نهاية الجولة: نوزّع النقاط مرة وحدة
  end(r) {
    const P = r.pts; if (!P || P.done || r.phase !== 'over') return;
    P.done = true;
    if (Date.now() - P.at < MIN_MS) return;
    const humans = r.players.filter(p => !p.bot).length, solo = humans < 2, wk = week();
    for (const p of r.players) {
      if (!P.base.has(p)) continue; // دخل بنص الجولة
      if (r.noPts && r.noPts.has(p.id)) continue;
      const k = keyOf(p); if (!k) continue;
      const won = (p.wins || 0) > P.base.get(p);
      const u = D[k] = D[k] || { n: p.name, pts: 0, wins: 0, games: 0, st: 0, wk, wp: 0 };
      if (u.wk !== wk) { u.wk = wk; u.wp = 0; }
      const before = rankOf(k, wk), items = [];
      if (won) items.push(['فزت', solo ? 10 : 20]);
      items.push(['لعبت للآخر', solo ? 2 : 5]);
      u.st = won ? u.st + 1 : 0;
      if (won && !solo && u.st % 3 === 0) items.push(['ثلاث فوزات ورا بعض', 10]);
      const add = items.reduce((a, x) => a + x[1], 0);
      const l0 = lvl(u.pts).lvl;
      u.pts += add; u.wp += add; u.games++; if (won) u.wins++; u.n = p.name;
      const after = rankOf(k, wk), L = lvl(u.pts);
      if (p.online && p.ws) send(p.ws, { t: 'pts', add, items, pts: u.pts, ...L, up: L.lvl > l0, rank: after, rankUp: after && (!before || after < before) && after <= 10 });
    }
    save();
  }
});
