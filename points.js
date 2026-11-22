// نقاط السيرفر والملف الشخصي: كل لاعب (حسب جهازه أو حساب ديسكورد) يجمع نقاط من كل الألعاب.
// آخر كل جولة نرسل له وش أخذ (فوز +٢٠، لعب للآخر +٥، كل ٣ فوزات ورا بعض +١٠) ومستواه وترتيبه بالأسبوع.
// الحفظ عن طريق store.js (سوبابيس لو مفعّل، ولا ملفات data/). كل لاعب مفتاح u:<key>.
// الرصيد (bal) ينصرف بمتجر التجميل، والنقاط (pts) للترتيب ما تنقص.
const crypto = require('crypto');
const ST = require('./store');
const LVL = 200, MIN_MS = +process.env.POINTS_MIN_MS || 30000; // كل مستوى ٢٠٠ نقطة، والجولة لازم تطول ٣٠ ثانية عشان تنحسب
const D = {}; let loaded = false;
const pidOf = k => crypto.createHash('sha256').update('tarteeb|' + k).digest('base64url').slice(0, 10);
const PID = {}; // pid ← key
const ready = ST.load('u:').then(o => { for (const k in o) { const key = k.slice(2); D[key] = Object.assign(o[k], D[key] || {}); }
  if (!Object.keys(o).length) { try { const old = JSON.parse(require('fs').readFileSync(process.env.POINTS_DATA || require('path').join(__dirname, 'data', 'points.json'), 'utf8')); for (const k in old) { D[k] = Object.assign({ bal: old[k].pts || 0 }, old[k]); ST.put('u:' + k, D[k]); } console.log('points: نقلنا', Object.keys(old).length, 'من points.json'); } catch {} } loaded = true; for (const k in D) PID[pidOf(k)] = k; console.log('points loaded', Object.keys(D).length, ST.on ? '(supabase)' : '(files)'); }).catch(e => { loaded = true; console.error('points load', e.message); });
const save = k => ST.put('u:' + k, D[k]);

// الأسبوع يبدأ السبت بتوقيت الرياض، والشهر ميلادي بتوقيت الرياض
const RY = t => new Date(t + 3 * 3600e3);
function week(t = Date.now()) { const d = RY(t); const day = (d.getUTCDay() + 1) % 7; return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 864e5 - day)); }
const month = (t = Date.now()) => { const d = RY(t); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
const dayN = (t = Date.now()) => Math.floor((t + 3 * 3600e3) / 864e5);
const keyOf = p => p.bot ? null : p.uid ? 'd:' + p.uid : p.dev ? 'v:' + p.dev : null;
const lvl = pts => { const l = Math.floor(pts / LVL) + 1; return { lvl: l, into: pts - (l - 1) * LVL, need: LVL }; };

// قيمة اللاعب بفترة معيّنة (للترتيب)
function val(u, per, g) {
  const s = g && g !== 'all' ? (u.g && u.g[g]) : u; if (!s) return 0;
  if (per === 'week') return s.wk === week() ? s.wp || 0 : 0;
  if (per === 'month') return s.mo === month() ? s.mp || 0 : 0;
  return g && g !== 'all' ? s.pts || 0 : s.pts || 0;
}
function board(per = 'week', g = 'all', n = 50) {
  return Object.keys(D).map(k => ({ k, v: val(D[k], per, g) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, n);
}
function rankOf(k, per = 'week', g = 'all') { const me = val(D[k] || {}, per, g); if (!me) return 0; let n = 1; for (const x in D) if (x !== k && val(D[x], per, g) > me) n++; return n; }

// ===== الشارات =====
const gw = (u, g) => (u.g && u.g[g] && u.g[g].w) || 0;
const BADGES = [
  ['uno', 'ملك الأونو', '١٠ انتصارات بالأونو', u => gw(u, 'uno') >= 10],
  ['baloot', 'شيخ البلوت', '١٠ انتصارات بالبلوت', u => gw(u, 'baloot') >= 10],
  ['ludo', 'سلطان اللودو', '١٠ انتصارات باللودو', u => gw(u, 'ludo') >= 10],
  ['jackaroo', 'معلّم الجاكارو', '١٠ انتصارات بالجاكارو', u => gw(u, 'jackaroo') >= 10],
  ['chess', 'أستاذ الشطرنج', '١٠ انتصارات بالشطرنج', u => gw(u, 'chess') >= 10],
  ['tartayb', 'نجم تراتيب', '١٠ انتصارات بتراتيب', u => gw(u, 'tartayb') >= 10],
  ['art', 'فنّان ترتيب', 'أحلى رسمة ٣ مرات', u => gw(u, 'art') >= 3],
  ['w50', 'القنّاص', '٥٠ فوز بأي لعبة', u => (u.wins || 0) >= 50],
  ['w200', 'الأسطورة', '٢٠٠ فوز', u => (u.wins || 0) >= 200],
  ['g100', 'ما يمل', '١٠٠ جولة', u => (u.games || 0) >= 100],
  ['st5', 'ما ينغلب', '٥ انتصارات ورا بعض', u => (u.bst || 0) >= 5],
  ['run7', 'ما يوقف', 'تلعب ٧ أيام ورا بعض', u => (u.days && u.days.best || 0) >= 7],
  ['multi', 'متعدد المواهب', 'تفوز بـ ١٠ ألعاب مختلفة', u => Object.values(u.g || {}).filter(x => x.w > 0).length >= 10],
  ['lvl10', 'مستوى ١٠', 'توصل المستوى ١٠', u => lvl(u.pts || 0).lvl >= 10],
  ['wk1', 'بطل الأسبوع', 'الأول بترتيب الأسبوع', null],
  ['mo1', 'بطل الشهر', 'الأول بترتيب الشهر', null],
  ['tour', 'بطل البطولة', 'تفوز ببطولة', null]
];
const BMAP = Object.fromEntries(BADGES.map(b => [b[0], b]));
function grant(u, id) { u.b = u.b || {}; if (u.b[id]) return false; u.b[id] = Date.now(); return true; }

// ===== متجر التجميل =====
const SHOP = {
  'fr:gold': { t: 'إطار ذهبي', c: 500, k: 'fr' }, 'fr:rainbow': { t: 'إطار قوس قزح', c: 800, k: 'fr' }, 'fr:neon': { t: 'إطار نيون', c: 1200, k: 'fr' }, 'fr:royal': { t: 'إطار ملكي', c: 2000, k: 'fr' }, 'fr:champ': { t: 'إطار البطل', c: 0, k: 'fr', only: 'tour' },
  'nc:red': { t: 'اسم أحمر بالشات', c: 300, k: 'nc' }, 'nc:blue': { t: 'اسم أزرق بالشات', c: 300, k: 'nc' }, 'nc:green': { t: 'اسم أخضر بالشات', c: 300, k: 'nc' }, 'nc:gold': { t: 'اسم ذهبي بالشات', c: 600, k: 'nc' },
  'ludo:wood': { t: 'لودو خشب', c: 600, k: 'ludo' }, 'ludo:marble': { t: 'لودو رخام', c: 600, k: 'ludo' }, 'ludo:neon': { t: 'لودو نيون', c: 900, k: 'ludo' }
};
const owns = (u, id) => !!(u && ((u.own || []).includes(id) || (SHOP[id] && SHOP[id].only && u.b && u.b[SHOP[id].only])));
const equipped = u => (u && u.eq) || {};

function pub(k, full) { // الملف اللي يشوفه الكل
  const u = D[k]; if (!u) return null; const L = lvl(u.pts || 0);
  const o = { pid: pidOf(k), n: u.n, a: u.a || '', dc: k.startsWith('d:'), pts: u.pts || 0, ...L, wins: u.wins || 0, games: u.games || 0, since: u.since || 0, run: u.days ? u.days.run : 0, best: u.days ? u.days.best : 0,
    rank: { week: rankOf(k, 'week'), month: rankOf(k, 'month'), all: rankOf(k, 'all') }, eq: equipped(u),
    g: Object.fromEntries(Object.entries(u.g || {}).map(([g, x]) => [g, { w: x.w || 0, p: x.p || 0, pts: x.pts || 0 }])),
    b: Object.entries(u.b || {}).filter(([id]) => BMAP[id]).map(([id, t]) => ({ id, t })) };
  if (full) { o.bal = u.bal || 0; o.own = u.own || []; }
  return o;
}

module.exports = ({ send }) => {
  // تبديل الأسبوع/الشهر: نعلن الفايز بالديسكورد ونعطيه شارة (نتأكد كل ١٠ دقايق)
  async function rollover() {
    if (!loaded) return;
    const meta = (await ST.get('meta:roll').catch(() => null)) || {};
    const wk = week(), mo = month(); let ch = false;
    if (meta.wk && meta.wk !== wk) { const top = Object.keys(D).map(k => ({ k, v: D[k].wk === meta.wk ? D[k].wp || 0 : 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 10); if (top[0]) { grant(D[top[0].k], 'wk1'); save(top[0].k); } announce('نتايج أسبوع ترتيب', top); ch = true; }
    if (meta.mo && meta.mo !== mo) { const top = Object.keys(D).map(k => ({ k, v: D[k].mo === meta.mo ? D[k].mp || 0 : 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 10); if (top[0]) { grant(D[top[0].k], 'mo1'); save(top[0].k); } announce('نتايج شهر ترتيب', top); ch = true; }
    if (ch || meta.wk !== wk || meta.mo !== mo) ST.put('meta:roll', { wk, mo });
    // لقطة الترتيب أول اليوم (للأسهم ▲▼)
    const dn = dayN(); if (SNAP.d !== dn) { SNAP.d = dn; SNAP.r = Object.fromEntries(board('week', 'all', 200).map((x, i) => [x.k, i + 1])); }
  }
  const SNAP = { d: 0, r: {} };
  async function announce(title, top) {
    const url = process.env.DISCORD_WEBHOOK; if (!url || !top.length) return;
    const medal = ['١', '٢', '٣'];
    const lines = top.map((x, i) => `**${medal[i] || (i + 1)}.** ${D[x.k].n} — ${x.v} نقطة`);
    try { await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'ترتيب', embeds: [{ title, description: lines.join('\n') + `\n\nمبروك **${D[top[0].k].n}** بطل ${title.includes('أسبوع') ? 'الأسبوع' : 'الشهر'}!`, color: 0xffc928 }] }) }); } catch (e) { console.error('webhook', e.message); }
  }
  ready.then(() => { rollover(); setInterval(rollover, 10 * 60e3); });

  return {
    keyOf, pidOf, pub, board, rankOf, BADGES, SHOP, ready,
    user: k => D[k] || null,
    byPid: pid => PID[pid] || null,
    lb(per, g) {
      const per2 = ['week', 'month', 'all'].includes(per) ? per : 'week';
      return board(per2, g || 'all', 50).map((x, i) => { const u = D[x.k], prev = per2 === 'week' && (!g || g === 'all') ? SNAP.r[x.k] : 0; return { pid: pidOf(x.k), n: u.n, a: u.a || '', v: x.v, eq: equipped(u), lvl: lvl(u.pts || 0).lvl, d: prev ? prev - (i + 1) : null }; });
    },
    // تجميل اللاعب داخل الغرفة (إطار الاسم ولونه)
    look(p) { const k = keyOf(p); if (!k) return null; const e = equipped(D[k]); return { pid: pidOf(k), fr: e.fr || null, nc: e.nc || null, ld: e.ludo ? e.ludo.slice(5) : null }; },
    // المتجر: شراء ولبس
    buy(k, id) {
      const u = D[k], it = SHOP[id]; if (!u || !it) return { err: 'ما لقينا الغرض' };
      if (owns(u, id)) return { err: 'عندك هذا من قبل' };
      if (it.only) return { err: 'هذا ينطلع بالبطولة بس' };
      if ((u.bal || 0) < it.c) return { err: 'رصيدك ما يكفي' };
      u.bal -= it.c; (u.own = u.own || []).push(id); save(k); return { ok: true, me: pub(k, true) };
    },
    equip(k, id, kind) {
      const u = D[k]; if (!u) return { err: 'العب جولة وحدة أول' };
      if (!['fr', 'nc', 'ludo'].includes(kind)) return { err: 'غلط' };
      if (id && (!owns(u, id) || SHOP[id].k !== kind)) return { err: 'ما تملكه' };
      u.eq = u.eq || {}; if (id) u.eq[kind] = id; else delete u.eq[kind]; save(k); return { ok: true, me: pub(k, true) };
    },
    // بداية الجولة: نحفظ مين يلعب وكم فوز عنده
    start(r) { r.noPts = null; r.pts = { at: Date.now(), done: false, base: new Map(r.players.filter(p => !p.bot).map(p => [p, p.wins || 0])) }; },
    // نهاية الجولة: نوزّع النقاط مرة وحدة
    end(r) {
      const P = r.pts; if (!P || P.done || r.phase !== 'over') return;
      P.done = true;
      if (Date.now() - P.at < MIN_MS) return;
      const humans = r.players.filter(p => !p.bot).length, solo = humans < 2, wk = week(), mo = month(), dn = dayN(), G = r.game;
      for (const p of r.players) {
        if (!P.base.has(p)) continue; // دخل بنص الجولة
        if (r.noPts && r.noPts.has(p.id)) continue;
        const k = keyOf(p); if (!k) continue;
        const won = (p.wins || 0) > P.base.get(p);
        const fresh = !D[k];
        const u = D[k] = D[k] || { n: p.name, pts: 0, bal: 0, wins: 0, games: 0, st: 0, wk, wp: 0, mo, mp: 0, since: Date.now() };
        if (fresh) PID[pidOf(k)] = k;
        if (u.bal == null) u.bal = u.pts || 0; if (!u.since) u.since = Date.now();
        if (u.wk !== wk) { u.wk = wk; u.wp = 0; }
        if (u.mo !== mo) { u.mo = mo; u.mp = 0; }
        const before = rankOf(k, 'week'), items = [];
        if (won) items.push(['فزت', solo ? 10 : 20]);
        items.push(['لعبت للآخر', solo ? 2 : 5]);
        u.st = won ? (u.st || 0) + 1 : 0; u.bst = Math.max(u.bst || 0, u.st);
        if (won && !solo && u.st % 3 === 0) items.push(['ثلاث فوزات ورا بعض', 10]);
        // أيام ورا بعض
        const dd = u.days = u.days || { last: 0, run: 0, best: 0 };
        if (dd.last !== dn) { dd.run = dd.last === dn - 1 ? dd.run + 1 : 1; dd.last = dn; dd.best = Math.max(dd.best, dd.run); if (dd.run > 1 && !solo) items.push([`${dd.run} أيام ورا بعض`, Math.min(5 * dd.run, 25)]); }
        const add = items.reduce((a, x) => a + x[1], 0);
        const l0 = lvl(u.pts).lvl;
        u.pts += add; u.bal += add; u.wp += add; u.mp += add; u.games++; if (won) u.wins++; u.n = p.name; if (p.dcA) u.a = p.dcA;
        const s = (u.g = u.g || {})[G] = (u.g[G] || { w: 0, p: 0, pts: 0, wk, wp: 0, mo, mp: 0 });
        if (s.wk !== wk) { s.wk = wk; s.wp = 0; } if (s.mo !== mo) { s.mo = mo; s.mp = 0; }
        s.p++; if (won) s.w++; s.pts += add; s.wp += add; s.mp += add;
        const nb = BADGES.filter(b => b[3] && b[3](u) && grant(u, b[0])).map(b => ({ id: b[0], t: b[1] }));
        save(k);
        const after = rankOf(k, 'week'), L = lvl(u.pts);
        if (p.online && p.ws) send(p.ws, { t: 'pts', add, items, pts: u.pts, bal: u.bal, ...L, up: L.lvl > l0, rank: after, rankUp: after && (!before || after < before) && after <= 10, badges: nb, pid: pidOf(k) });
      }
    },
    // بطل البطولة
    champion(p) { const k = keyOf(p); if (!k || !D[k]) return; if (grant(D[k], 'tour')) save(k); }
  };
};
