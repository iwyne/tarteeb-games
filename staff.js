// مكان التيم 🔐 — لوحة تحكم + غرف خاصة + إحصائيات + دردشة وملاحظات للتيم بس.
// الدخول: رمز سري من متغير البيئة TEAM_PIN (بدونه المكان مقفول). الرمز ما ينحفظ بالمتصفح:
// نعطي توكن موقّع بـ HMAC صالح ٣٠ يوم، ولو غيّرت الرمز كل التوكنات القديمة تبطل.
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const PIN = String(process.env.TEAM_PIN || '').trim();
const FILE = process.env.TEAM_DATA || path.join(__dirname, 'data', 'team.json');
const MEMBERS = ['بشرى', 'مازن', 'أفراح', 'سلمان', 'ايزن', 'حميد', 'علي', 'هدهد', 'لافي'];
const DAY = 864e5, TOK_DAYS = 30, MAX_TRIES = 5, LOCK_MS = 15 * 60 * 1000;

let D = { chat: [], notes: [], stats: { total: 0, games: {}, days: {}, hours: Array(24).fill(0), peak: 0, peakAt: 0 } };
try { const j = JSON.parse(fs.readFileSync(FILE, 'utf8')); D = { ...D, ...j, stats: { ...D.stats, ...(j.stats || {}) } }; } catch {}
let saveT = null;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(D)); } catch (e) { console.error('team save', e.message); } }, 3000); };

const riyadh = (t = Date.now()) => new Date(t + 3 * 3600e3); // توقيت الرياض للإحصائيات
const sign = s => crypto.createHmac('sha256', 'tarteeb-team|' + PIN).update(s).digest('base64url');
function makeTok(who) { const exp = Date.now() + TOK_DAYS * DAY, body = Buffer.from(JSON.stringify({ who, exp })).toString('base64url'); return body + '.' + sign(body); }
function check(tok) {
  if (!PIN || typeof tok !== 'string' || tok.length > 400) return null;
  const [body, sig] = tok.split('.'); if (!body || !sig) return null;
  const a = Buffer.from(sign(body)), b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const o = JSON.parse(Buffer.from(body, 'base64url').toString()); return o.exp > Date.now() && MEMBERS.includes(o.who) ? o.who : null; } catch { return null; }
}
function pinOk(p) { const a = crypto.createHash('sha256').update(String(p || '')).digest(), b = crypto.createHash('sha256').update(PIN).digest(); return !!PIN && crypto.timingSafeEqual(a, b); }
const tries = new Map(); // IP → محاولات غلط (ضد التخمين)

module.exports = S => {
  const subs = new Set(); // اتصالات التيم المفتوحة على اللوحة
  const out = (ws, o) => S.send(ws, { t: 'staff', ...o });
  const toAll = o => subs.forEach(w => w.readyState === 1 ? out(w, o) : subs.delete(w));
  const clean = (t, n) => String(t || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const nameOf = (r, p) => p.name + (p.bot ? ' 🤖' : '');
  function roomsList() {
    return [...S.rooms.values()].map(r => ({
      code: r.code, game: r.game, phase: r.phase, team: !!r.teamOnly, age: Date.now() - (r.created || Date.now()), pass: !!r.opts.pass,
      players: r.players.map(p => ({ id: p.id, n: nameOf(r, p), on: !!p.online || !!p.bot, host: r.host === p.id, bot: !!p.bot })),
      specs: r.specs.map(p => ({ id: p.id, n: p.name, on: !!p.online }))
    })).sort((a, b) => b.players.length - a.players.length);
  }
  function live() {
    let players = 0; S.rooms.forEach(r => { players += r.players.filter(p => p.online && !p.bot).length + r.specs.filter(p => p.online).length; });
    return { players, rooms: S.rooms.size, sockets: S.wss.clients.size, up: Math.round(process.uptime()), mem: Math.round(process.memoryUsage().rss / 1048576) };
  }
  // نحدّث اللوحة كل ٣ ثواني لو فيه أحد فاتحها، ونسجّل أعلى عدد لاعبين
  setInterval(() => {
    const L = live();
    if (L.players > D.stats.peak) { D.stats.peak = L.players; D.stats.peakAt = Date.now(); save(); }
    if (subs.size) toAll({ k: 'rooms', rooms: roomsList(), live: L });
  }, 3000).unref();

  function onStart(r) {
    const s = D.stats, d = riyadh(), day = d.toISOString().slice(0, 10);
    s.total++; s.games[r.game] = (s.games[r.game] || 0) + 1; s.days[day] = (s.days[day] || 0) + 1; s.hours[d.getUTCHours()]++;
    const keep = Object.keys(s.days).sort().slice(-60); s.days = Object.fromEntries(keep.map(k => [k, s.days[k]])); // آخر ٦٠ يوم بس
    save();
  }
  function snapshot(ws) { out(ws, { k: 'snap', who: ws.staff, rooms: roomsList(), live: live(), stats: D.stats, chat: D.chat.slice(-150), notes: D.notes, members: MEMBERS }); }

  function handle(ws, m) {
    const k = m.k;
    if (k === 'info') return out(ws, { k: 'info', on: !!PIN, members: MEMBERS });
    if (k === 'login') {
      if (!PIN) return out(ws, { k: 'bad', msg: 'مكان التيم مو مفعّل — لازم TEAM_PIN بإعدادات السيرفر' });
      const ip = ws.ip || '?', now = Date.now(), t = tries.get(ip) || { n: 0, at: now };
      if (now - t.at > LOCK_MS) { t.n = 0; t.at = now; }
      if (t.n >= MAX_TRIES) return out(ws, { k: 'bad', msg: `محاولات كثير، جرّب بعد ${Math.ceil((LOCK_MS - (now - t.at)) / 60000)} دقيقة` });
      if (!MEMBERS.includes(m.who)) return out(ws, { k: 'bad', msg: 'اختر اسمك' });
      if (!pinOk(m.pin)) { t.n++; t.at = now; tries.set(ip, t); return out(ws, { k: 'bad', msg: `الرمز غلط (باقي ${MAX_TRIES - t.n})` }); }
      tries.delete(ip);
      ws.staff = m.who; subs.add(ws);
      out(ws, { k: 'ok', tok: makeTok(m.who), who: m.who });
      return snapshot(ws);
    }
    if (k === 'hello') {
      const who = check(m.tok); if (!who) return out(ws, { k: 'expired' });
      ws.staff = who; subs.add(ws); return snapshot(ws);
    }
    // كل اللي تحت يحتاج دخول
    const who = ws.staff; if (!who) return out(ws, { k: 'expired' });
    if (k === 'bye') { subs.delete(ws); return; }
    if (k === 'chat') {
      const text = clean(m.text, 500); if (!text || !S.rate(ws, 'stc', 400)) return;
      const msg = { who, text, at: Date.now() }; D.chat.push(msg); if (D.chat.length > 300) D.chat.splice(0, D.chat.length - 300); save();
      return toAll({ k: 'chat', msg });
    }
    if (k === 'note') {
      if (m.op === 'add') { const text = clean(m.text, 400); if (!text) return; D.notes.unshift({ id: crypto.randomBytes(5).toString('hex'), text, who, at: Date.now(), done: false }); D.notes = D.notes.slice(0, 200); }
      else { const n = D.notes.find(x => x.id === m.id); if (!n) return; if (m.op === 'done') { n.done = !n.done; n.by = who; } else if (m.op === 'del') D.notes = D.notes.filter(x => x !== n); }
      save(); return toAll({ k: 'notes', notes: D.notes });
    }
    if (k === 'announce') {
      const text = clean(m.text, 200); if (!text || !S.rate(ws, 'stan', 5000)) return;
      S.wss.clients.forEach(w => S.send(w, { t: 'announce', text, from: who }));
      const msg = { who, text: '📢 إعلان: ' + text, at: Date.now() }; D.chat.push(msg); save(); toAll({ k: 'chat', msg });
      return out(ws, { k: 'done', msg: 'وصل الإعلان لكل اللي بالموقع' });
    }
    const r = S.rooms.get(String(m.code || '').toUpperCase());
    if (k === 'close') {
      if (!r) return;
      [...r.players, ...r.specs].forEach(p => { if (p.ws) { const w = p.ws; w.ctx = null; S.send(w, { t: 'err', msg: 'الإدارة قفلت هالغرفة', reset: true }); } });
      S.closeRoom(r);
      return toAll({ k: 'rooms', rooms: roomsList(), live: live() });
    }
    if (k === 'kick') {
      if (!r) return;
      S.kick(r, m.id);
      return toAll({ k: 'rooms', rooms: roomsList(), live: live() });
    }
  }
  return { handle, check, onStart, onClose: ws => subs.delete(ws) };
};
