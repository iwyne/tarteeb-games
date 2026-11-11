// ترتيب — حفظ الإحصائيات (المتصدرين)
// لو حطيت UPSTASH_REDIS_REST_URL و UPSTASH_REDIS_REST_TOKEN تنحفظ في Upstash (تبقى للأبد).
// بدونها تنحفظ في data/stats.json (تنمسح على Render المجاني مع كل نشر جديد).
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const URL_ = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const REMOTE = !!(URL_ && TOKEN);
const FILE = path.join(process.env.STATS_DIR || path.join(__dirname, 'data'), 'stats.json');
const SCALE = 1e7; // ترتيب المتصدرين: الفوز أولاً ثم النقاط

async function pipe(cmds) {
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('upstash ' + r.status);
  const out = await r.json();
  const bad = out.find(x => x && x.error);
  if (bad) throw new Error('upstash ' + bad.error);
  return out.map(x => x.result);
}

// ---- ملف محلي ----
let db = null, saveT = null;
function load() {
  if (db) return db;
  try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { db = {}; }
  return db;
}
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)); } catch (e) { console.log('stats save failed', e.message); }
  }, 500);
}
const sortFile = () => Object.entries(load()).filter(([, v]) => v.wins > 0)
  .sort((a, b) => (b[1].wins * SCALE + b[1].points) - (a[1].wins * SCALE + a[1].points));

const pidOf = cid => /^[\w-]{16,64}$/.test(String(cid || '')) ? 'w:' + crypto.createHash('sha256').update(String(cid)).digest('hex').slice(0, 24) : null;
const num = x => +x || 0;
const pack = (name, a) => ({ name: name || 'لاعب', games: num(a[0]), wins: num(a[1]), points: num(a[2]) });

let cache = null, cacheAt = 0;

// entries: [{pid, name, win:boolean, points:number}]
async function record(entries) {
  entries = entries.filter(e => e.pid);
  if (!entries.length) return;
  cache = null;
  if (!REMOTE) {
    const d = load();
    for (const e of entries) {
      const s = d[e.pid] || (d[e.pid] = { name: e.name, games: 0, wins: 0, points: 0 });
      s.name = e.name; s.games++;
      if (e.win) { s.wins++; s.points += e.points; }
    }
    return save();
  }
  const cmds = [];
  for (const e of entries) {
    const k = 'p:' + e.pid;
    cmds.push(['HSET', k, 'name', e.name], ['HINCRBY', k, 'games', 1], ['HINCRBY', k, 'wins', e.win ? 1 : 0], ['HINCRBY', k, 'points', e.win ? e.points : 0]);
  }
  const res = await pipe(cmds);
  const z = [];
  entries.forEach((e, i) => { if (e.win) z.push(['ZADD', 'lb', num(res[i * 4 + 2]) * SCALE + num(res[i * 4 + 3]), e.pid]); });
  if (z.length) await pipe(z);
}

async function top(n = 10) {
  if (cache && Date.now() - cacheAt < 20000) return cache;
  let list;
  if (!REMOTE) list = sortFile().slice(0, n).map(([pid, v]) => ({ pid, ...pack(v.name, [v.games, v.wins, v.points]) }));
  else {
    const [ids] = await pipe([['ZREVRANGE', 'lb', 0, n - 1]]);
    if (!ids.length) list = [];
    else {
      const rows = await pipe(ids.map(id => ['HMGET', 'p:' + id, 'name', 'games', 'wins', 'points']));
      list = ids.map((pid, i) => ({ pid, ...pack(rows[i][0], rows[i].slice(1)) }));
    }
  }
  cache = list; cacheAt = Date.now();
  return list;
}

async function mine(pid) {
  if (!pid) return null;
  if (!REMOTE) {
    const v = load()[pid]; if (!v) return null;
    const i = sortFile().findIndex(([id]) => id === pid);
    return { ...pack(v.name, [v.games, v.wins, v.points]), rank: i < 0 ? null : i + 1 };
  }
  const [h, rank] = await pipe([['HMGET', 'p:' + pid, 'name', 'games', 'wins', 'points'], ['ZREVRANK', 'lb', pid]]);
  if (h[0] == null) return null;
  return { ...pack(h[0], h.slice(1)), rank: rank == null ? null : rank + 1 };
}

module.exports = { record, top, mine, pidOf, REMOTE };
