// ترتيب — سيرفر الألعاب (أونو)
// تشغيل: npm install ثم npm start ثم افتح http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.gz': 'application/gzip' };

// تبادل كود تسجيل الدخول مع ديسكورد (وضع Activity فقط)
function tokenRoute(req, res) {
  let b = '';
  req.on('data', d => { b += d; if (b.length > 4096) req.destroy(); });
  req.on('end', async () => {
    const json = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    try {
      const { code } = JSON.parse(b);
      const r = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID || '', client_secret: process.env.DISCORD_CLIENT_SECRET || '', grant_type: 'authorization_code', code: String(code || '') })
      });
      const j = await r.json();
      json(j.access_token ? 200 : 400, { access_token: j.access_token });
    } catch { json(500, {}); }
  });
}

// ===== الدخول بحساب ديسكورد (الموقع العادي) =====
// /auth/discord يودّيك لديسكورد، وبعدها يرجع على /auth/discord/cb ونعطيك توكن موقّع (٩٠ يوم) ينحفظ بالمتصفح
// لازم يكون الرابط https://موقعك/auth/discord/cb مضاف بـ Discord Developer Portal ← OAuth2 ← Redirects
const crypto = require('crypto');
const DSEC = () => process.env.SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET || '';
const dSign = o => { const b = Buffer.from(JSON.stringify(o)).toString('base64url'); return b + '.' + crypto.createHmac('sha256', 'tarteeb-dc|' + DSEC()).update(b).digest('base64url'); };
function dCheck(t) { // يرجع {id, n} لو التوكن سليم
  if (!t || typeof t !== 'string' || !DSEC()) return null; const [b, sig] = t.split('.');
  const ok = sig && crypto.timingSafeEqual(Buffer.from(crypto.createHmac('sha256', 'tarteeb-dc|' + DSEC()).update(b).digest('base64url')), Buffer.from(sig.padEnd(43).slice(0, 43)));
  if (!ok) return null; try { const o = JSON.parse(Buffer.from(b, 'base64url')); return o.exp > Date.now() ? o : null; } catch { return null; }
}
const reqOrigin = req => (req.headers['x-forwarded-proto'] || 'http').split(',')[0] + '://' + req.headers.host;
async function discordAuth(req, res, u) {
  const back = reqOrigin(req) + '/auth/discord/cb', id = process.env.DISCORD_CLIENT_ID;
  const page = (js, msg) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(`<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;padding:40px">${msg}<script>${js}</script>`); };
  if (!id || !DSEC()) return page("setTimeout(()=>location.href='/',2500)", 'الدخول بديسكورد مو مفعّل بالسيرفر');
  if (u.pathname === '/auth/discord') {
    const st = crypto.randomBytes(12).toString('base64url');
    res.writeHead(302, { Location: 'https://discord.com/oauth2/authorize?' + new URLSearchParams({ client_id: id, response_type: 'code', scope: 'identify', redirect_uri: back, state: st }), 'Set-Cookie': `dcst=${st}; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=600` + (back.startsWith('https') ? '; Secure' : '') });
    return res.end();
  }
  const ck = /(?:^|;\s*)dcst=([\w-]+)/.exec(req.headers.cookie || '');
  if (!u.searchParams.get('code') || !ck || ck[1] !== u.searchParams.get('state')) return page("setTimeout(()=>location.href='/',2000)", 'ما تم الدخول، جرّب مرة ثانية');
  try {
    const tr = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: id, client_secret: process.env.DISCORD_CLIENT_SECRET || '', grant_type: 'authorization_code', code: u.searchParams.get('code'), redirect_uri: back }) });
    const tj = await tr.json(); if (!tj.access_token) throw new Error('token');
    const me = await (await fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + tj.access_token } })).json(); if (!me.id) throw new Error('me');
    const prof = { id: me.id, n: cleanName(me.global_name || me.username), a: me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=64` : '', exp: Date.now() + 90 * 864e5 };
    const tok = dSign(prof);
    page(`try{localStorage.setItem('tarteeb-dc',${JSON.stringify(JSON.stringify({ tok, n: prof.n, a: prof.a, id: prof.id }))})}catch(e){};location.replace('/')`, 'تم الدخول...');
  } catch (e) { console.error('discord auth', e.message); page("setTimeout(()=>location.href='/',2500)", 'صار خطأ بالدخول، جرّب مرة ثانية'); }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/token') return tokenRoute(req, res);
  if (req.url.startsWith('/gallery-data') || req.url.startsWith('/gal/')) { // المعرض الدايم للمرسم
    const G = GAMES.art.GAL, u = req.url.split('?')[0];
    try {
      if (u === '/gallery-data') { const ds = fs.existsSync(G) ? fs.readdirSync(G).sort().reverse().slice(0, 120) : []; const out = ds.map(d => { try { return { d, ...JSON.parse(fs.readFileSync(path.join(G, d, 'meta.json'), 'utf8')) }; } catch { return null; } }).filter(Boolean); res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify(out)); }
      const [, , d, f] = u.split('/'); if (!/^[\w-]+$/.test(d || '') || !/^\d+\.(img|tl)$/.test(f || '')) throw 0;
      const b = fs.readFileSync(path.join(G, d, f)); res.writeHead(200, { 'Content-Type': f.endsWith('.tl') ? 'application/octet-stream' : (b[0] === 0xff ? 'image/jpeg' : b[0] === 0x89 ? 'image/png' : 'image/webp'), 'Cache-Control': 'public, max-age=86400' }); return res.end(b);
    } catch { res.writeHead(404); return res.end(); }
  }
  if (req.url.startsWith('/art/')) { // صور مرسم ترتيب: /art/<code>/<key>/<pid>/<tl|final|last>
    const [, , code, key, pid, what] = req.url.split('?')[0].split('/'); const r = rooms.get(String(code || '').toUpperCase());
    const out = r && r.game === 'art' && r.g && r.g.key === key && GAMES.art.http(r, decodeURIComponent(pid || ''), what);
    if (!out) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': out.type, 'Content-Length': out.body.length, 'Cache-Control': what === 'last' ? 'no-store' : 'private, max-age=600' }); return res.end(out.body);
  }
  if (req.url.startsWith('/auth/discord')) { const u = new URL(req.url, 'http://x'); if (u.pathname === '/auth/discord' || u.pathname === '/auth/discord/cb') return discordAuth(req, res, u); }
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (se, st) => {
    if (se || !st.isFile()) { res.writeHead(404); return res.end('404'); }
    const ext = path.extname(f);
    const isIndex = p === '/index.html';
    const origin = isIndex ? (req.headers['x-forwarded-proto'] || 'http').split(',')[0] + '://' + req.headers.host : '';
    // ETag: يتغير مع تعديل الملف، فالمتصفح يرجع 304 بدل ما ينزل الملف كامل كل مرة
    const tag = '"' + st.size.toString(36) + '-' + Math.floor(st.mtimeMs).toString(36) + (isIndex ? '-' + Buffer.from(origin).toString('base64url').slice(-8) : '') + '"';
    // صور الفريق بدون كاش طويل عشان لو تغيّرت تبان فوراً (ETag يكفي)
    const versioned = /[?&]v=/.test(req.url) && (ext === '.js' || ext === '.css'); // ملف بنسخة (?v=) ما يتغير أبد
    const longCache = versioned || !p.startsWith('/team/') && (['.woff2', '.png', '.ico', '.mp3', '.mp4', '.webp', '.jpg', '.glb'].includes(ext) || /^\/(vendor|haunt|flags|mimic|chess|tut)\//.test(p));
    const head = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': versioned ? 'public, max-age=31536000, immutable' : longCache ? 'public, max-age=604800' : 'no-cache', ETag: isIndex ? tag.slice(0, -1) + '-' + allVer() + '"' : tag, Vary: 'Accept-Encoding' };
    if (req.headers['if-none-match'] === head.ETag) { res.writeHead(304, head); return res.end(); }
    getBody(f, st, head.ETag, origin, ext, (e, body) => {
      if (e) { res.writeHead(404); return res.end('404'); }
      const ae = req.headers['accept-encoding'] || '';
      let out = body.raw;
      if (body.br && /\bbr\b/.test(ae)) { out = body.br; head['Content-Encoding'] = 'br'; }
      else if (body.gz && /\bgzip\b/.test(ae)) { out = body.gz; head['Content-Encoding'] = 'gzip'; }
      head['Content-Length'] = out.length;
      res.writeHead(200, head);
      res.end(req.method === 'HEAD' ? undefined : out);
    });
  });
});

// تخفيف الموقع للجوال:
// ١) نصغّر ملفات JS وCSS (نشيل المسافات والتعليقات بدون ما نغيّر أسماء المتغيرات) بـ esbuild لو موجود
// ٢) كل ملف بالصفحة ياخذ ?v=بصمته، فالمتصفح يخزنه سنة وما يسأل عنه مرة ثانية إلا لو تغيّر
let ESB = null; try { ESB = require('esbuild'); } catch {}
function minify(d, ext) {
  if (!ESB) return d;
  try { return Buffer.from(ESB.transformSync(d.toString('utf8'), { loader: ext === '.css' ? 'css' : 'js', minifyWhitespace: true, minifySyntax: ext === '.css', charset: 'utf8', legalComments: 'none', target: ext === '.css' ? ['chrome90', 'safari14'] : undefined }).code); }
  catch (e) { console.error('minify', path.basename(String(e.message)).slice(0, 120)); return d; }
}
const VER = new Map(); // ملف → [mtime, بصمة]
function verOf(rel) {
  const f = path.join(PUB, rel); let st; try { st = fs.statSync(f); } catch { return ''; }
  const h = VER.get(f); if (h && h[0] === st.mtimeMs) return h[1];
  const v = require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('base64url').slice(0, 8);
  VER.set(f, [st.mtimeMs, v]); return v;
}
// ملفات الألعاب تنحمّل بس لما تدخل اللعبة (public/app.js: GAME_JS)
const LAZY = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8').match(/GAME_JS = (\{[^}]+\})/);
const LAZY_FILES = LAZY ? [...new Set([...LAZY[1].matchAll(/'([\w-]+\.js)'/g)].map(m => m[1]))] : [];
function versionIndex(html) {
  html = html.replace(/(<(?:script|link)\b[^>]*?\b(?:src|href)=")([\w\-/]+\.(?:js|css))(")/g, (m, a, f, b) => { const v = verOf(f); return v ? a + f + '?v=' + v + b : m; });
  const gv = {}; LAZY_FILES.forEach(f => gv[f] = verOf(f));
  return html.replace('<script src="sfx.js', `<script>window.GV=${JSON.stringify(gv)}</script>\n<script src="sfx.js`);
}
function allVer() {
  const h = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8'), fs2 = [...h.matchAll(/(?:src|href)="([\w\-/]+\.(?:js|css))"/g)].map(m => m[1]).concat(LAZY_FILES);
  return require('crypto').createHash('md5').update(fs2.map(verOf).join('')).digest('base64url').slice(0, 6);
}
// كاش بالذاكرة للملفات النصية مضغوطة (br + gzip) — يقلل حجم التحميل تقريباً للربع
const zlib = require('zlib');
const ZIP = new Set(['.html', '.css', '.js', '.svg', '.json', '.webmanifest', '.txt']);
const BODY = new Map();
function getBody(f, st, tag, origin, ext, cb) {
  const key = f + tag, hit = BODY.get(key);
  if (hit) return cb(null, hit);
  fs.readFile(f, (e, d) => {
    if (e) return cb(e);
    if (origin) d = Buffer.from(versionIndex(d.toString('utf8').replace('content="icons/og.png"', `content="${origin}/icons/og.png"`)));
    else if ((ext === '.js' || ext === '.css') && !/\.min\.|[\\/]vendor[\\/]|discord-sdk/.test(f)) d = minify(d, ext);
    const body = { raw: d };
    if (ZIP.has(ext) && d.length > 1024) {
      body.gz = zlib.gzipSync(d, { level: 9 });
      body.br = zlib.brotliCompressSync(d, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 10, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: d.length } });
      for (const k of BODY.keys()) if (k.startsWith(f + '"')) BODY.delete(k); // نسخة قديمة من نفس الملف
      BODY.set(key, body);
    }
    cb(null, body);
  });
}

const wss = new WebSocketServer({ server, maxPayload: 3 * 1024 * 1024 }); // أكبر رسالة ١ ميغا (تسجيل الأصوات تحت ٤٠٠ كيلو)
const rooms = new Map();
let PTS = null; // نقاط السيرفر (points.js)
let STAFF = null; // مكان التيم (staff.js) — يتجهّز تحت قبل ما نستقبل اتصالات
const COLORS = ['red', 'yellow', 'green', 'blue'];
const AR = { red: 'أحمر', yellow: 'أصفر', green: 'أخضر', blue: 'أزرق' };
const MAXSPEC = 30;
const TURN_MS = +process.env.TURN_MS || 15000; // مهلة الدور
const EMOJIS = ['😂', '😡', '😭', '👏', '🔥', '😎', '🤯', '❤️'];

const rid = () => Math.random().toString(36).slice(2, 9);
const mod = (a, n) => ((a % n) + n) % n;
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c;
  do { c = Array.from({ length: 4 }, () => A[Math.random() * A.length | 0]).join(''); } while (rooms.has(c));
  return c;
}
// قدرات الأونو (خيار بالغرفة): أوراق خاصة تنخلط مع الكومة
const POWERS = { spy: '👀 تجسّس', steal: '🫳 سرقة', rain: '🌧️ مطر أوراق', swap: '🔄 بدّل اليد', shield: '🛡️ درع', freeze: '🧊 تجميد', gift: '🎁 هدية', bomb: '💣 قنبلة' };
const PTARGET = ['spy', 'steal', 'swap', 'freeze', 'gift'];
function buildDeck(powers) {
  const d = []; let id = 0;
  const add = (color, v) => d.push({ id: id++, color, v });
  if (powers) for (const k in POWERS) for (let i = 0; i < 2; i++) add('power', k);
  for (const c of COLORS) {
    add(c, '0');
    for (let i = 0; i < 2; i++) { for (let n = 1; n <= 9; n++) add(c, String(n)); add(c, 'skip'); add(c, 'reverse'); add(c, 'draw2'); }
  }
  for (let i = 0; i < 4; i++) { add('wild', 'wild'); add('wild', 'wild4'); }
  return shuffle(d);
}
function cname(c) {
  const v = { skip: 'منع', reverse: 'عكس', draw2: '+٢', wild: 'ملوّن', wild4: '+٤ ملوّن' }[c.v] || c.v;
  if (c.color === 'power') return POWERS[c.v] || 'قدرة';
  return c.color === 'wild' ? v : `${v} ${AR[c.color]}`;
}

// ---- الألعاب الثانية (غير أونو) ----
const H = {
  log: (r, s) => log(r, s), shuffle, rate: (p, k, ms) => rate(p, k, ms),
  win: (r, ps) => ps.forEach(p => { p.wins = (p.wins || 0) + 1; }),
  alive: r => rooms.get(r.code) === r,
  err: (p, msg) => send(p.ws, { t: 'err', msg }), sendTo: (p, o) => p.online && send(p.ws, o), push: r => after(r),
  cast: (r, o, except) => everyone(r).forEach(q => q !== except && q.online && send(q.ws, o)),
  setTimer(r, ms, fn) {
    clearTimeout(r.timer); r.deadline = 0;
    if (!fn || !ms) return;
    r.deadline = Date.now() + ms;
    r.timer = setTimeout(() => { if (rooms.get(r.code) !== r) return; fn(); after(r); }, ms + 100);
  }
};
const GAMES = { uno: { min: 2, max: 8 } };
for (const k of ['codes', 'hive', 'liars', 'outside', 'typing', 'jackaroo', 'draw', 'flip', 'sus', 'haunt', 'mafia', 'phone', 'fib', 'bomb', 'auction', 'feud', 'flags', 'mimic', 'chess', 'jwb', 'baloot', 'cars', 'rich', 'boxing', 'brawl', 'tartayb', 'redlight', 'bwb', 'elim', 'emo', 'chairs', 'deal', 'qfl', 'ludo', 'bingo', 'art']) GAMES[k] = require('./games/' + k)(H);
const META = { uno: { bots: true }, codes: { teams: true }, hive: { teams: true, bots: true }, liars: { bots: true }, outside: { bots: true }, typing: { bots: true }, jackaroo: { teams: true, bots: true }, draw: {}, flip: { bots: true }, sus: { bots: true }, haunt: { bots: true }, mafia: { bots: true }, phone: {}, fib: { bots: true }, bomb: { bots: true }, auction: { bots: true }, feud: { teams: true, bots: true }, flags: { bots: true }, mimic: {}, chess: { bots: true }, jwb: { bots: true }, baloot: { teams: true, bots: true }, cars: { bots: true }, rich: { bots: true }, boxing: { bots: true }, brawl: { bots: true }, tartayb: { bots: true }, redlight: { bots: true }, bwb: { bots: true }, elim: { bots: true }, emo: { bots: true }, chairs: { bots: true }, deal: { bots: true }, qfl: { bots: true }, ludo: { bots: true }, bingo: { bots: true }, art: {} };
const AVATARS = ['😎', '🦁', '🐪', '🦅', '🐺', '🦊', '🐯', '🐼', '🦄', '🐸', '👑', '🔥', '⚡', '🌙', '🎩', '🤠'];
const cleanAv = a => AVATARS.includes(a) ? a : '';
// شكل الشخصية بالبيت المسكون: جسم، بشرة، شعر، لون الشعر، اللبس، لونين، لحية
const LOOKMAX = { b: 2, s: 4, h: 6, hc: 8, o: 7, c1: 12, c2: 12, bd: 2, mf: 4, ms: 4, me: 4, mt: 3 };
const cleanLook = l => { if (!l || typeof l !== 'object') return null; const o = {}; for (const k in LOOKMAX) { const v = +l[k]; o[k] = Number.isInteger(v) && v >= 0 && v < LOOKMAX[k] ? v : 0; } return o; };
const randLook = () => { const l = Object.fromEntries(Object.entries(LOOKMAX).map(([k, n]) => [k, Math.random() * n | 0])); l.h = 1 + (Math.random() * 5 | 0); l.hc = Math.random() * 6 | 0; return l; };
const optsView = (r, p) => ({ stack: !!r.opts.stack, powers: !!r.opts.powers, turn: r.opts.turn || 15, lock: !!r.opts.lock, hasPass: !!r.opts.pass, pass: r.host === p.id ? (r.opts.pass || '') : null, target: r.opts.target || 5, imps: r.opts.imps || 1, doctor: !!r.opts.doctor, map: r.opts.map || 'ship', nwords: r.opts.words ? r.opts.words.length : 0, wordsText: r.host === p.id ? (r.opts.wordsText || '') : '', mcount: r.opts.mcount || 0, dayT: r.opts.dayT || 90, reveal: r.opts.reveal !== false, mroles: Object.assign({ doc: 1, det: 1, sniper: 1, god: 1, jester: 1, mayor: 1 }, r.opts.mroles), blives: r.opts.blives || 3, bdiff: r.opts.bdiff || 'mid', frounds: r.opts.frounds || 7, psteps: r.opts.psteps || 0, pdraw: r.opts.pdraw || 90, aitems: r.opts.aitems || 8, drounds: r.opts.drounds || 4, fcount: r.opts.fcount || 10, fmode: r.opts.fmode || 'flags', fdiff: r.opts.fdiff || 'easy', mrounds: r.opts.mrounds || 5, mpack: r.opts.mpack || 'all', ctime: r.opts.ctime || 'none', clevel: r.opts.clevel || 'mid', ccolor: r.opts.ccolor || 'rand' , jrounds: r.opts.jrounds || 7, jtime: r.opts.jtime || 30, jn: r.opts.jn || 3, krounds: r.opts.krounds || 3, ktime: r.opts.ktime || 75, mlim: r.opts.mlim == null ? 25 : r.opts.mlim, bwins: r.opts.bwins || 2, fwins: r.opts.fwins || 2, trounds: r.opts.trounds || 10, ttime: r.opts.ttime || 30, rtime: r.opts.rtime || 60, brounds: r.opts.brounds || 5, btime: r.opts.btime || 90, elives: r.opts.elives || 1, etime: r.opts.etime || 15, erounds: r.opts.erounds || 8, emtime: r.opts.emtime || 45, dsets: r.opts.dsets || 3, dtime: r.opts.dtime || 60, dxbld: r.opts.dxbld || 0, dxbig: r.opts.dxbig || 0, qrounds: r.opts.qrounds || 5, qtime: r.opts.qtime || 30, ltime: r.opts.ltime || 20, bspeed: r.opts.bspeed || 5, bgoal: r.opts.bgoal || 'line', bskin: r.opts.bskin || 'diw', atheme: r.opts.atheme || '', atime: r.opts.atime || 0, ajmode: r.opts.ajmode || 'all', ajudges: r.opts.ajudges || [], acollab: !!r.opts.acollab });
const maxOf = r => GAMES[r.game].max;

const newRoom = (code, game = 'uno') => ({ code, game, g: null, opts: {}, owed: 0, botT: null, phase: 'lobby', players: [], host: null, deck: [], discard: [], color: null, dir: 1, turn: 0, pending: null, catchable: null, log: [], winner: null, chat: [], teams: false, score: [0, 0], winTeam: null, specs: [], recorded: false, banned: new Set(), turnSeq: 0, armed: -1, timer: null, deadline: 0, created: Date.now(), teamOnly: false });
const cur = r => r.players[r.turn];
const log = (r, s) => { r.log.push(s); if (r.log.length > 30) r.log.shift(); };

function canPlay(r, p, c) {
  if (r.pending !== null && c.id !== r.pending) return false;
  const top = r.discard[r.discard.length - 1];
  if (c.color === 'power') return c.v !== 'shield' && r.owed === 0;
  if (r.owed > 0) return top.v === 'draw2' ? (c.v === 'draw2' || c.v === 'wild4') : c.v === 'wild4'; // تراكم السحب
  if (c.v === 'wild4') return !p.hand.some(x => x.color === r.color); // الرسمي: ما تلعبها إلا ما عندك لون الطاولة
  if (c.v === 'wild') return true;
  return c.color === r.color || c.v === top.v;
}
function drawCards(r, p, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    if (!r.deck.length) {
      const top = r.discard.pop();
      r.deck = shuffle(r.discard.concat(r.pdisc || [])); r.discard = [top]; r.pdisc = [];
    }
    if (!r.deck.length) break;
    const c = r.deck.pop(); p.hand.push(c); out.push(c);
  }
  if (p.hand.length > 1) p.uno = false;
  return out;
}
function advance(r, steps) {
  r.turn = mod(r.turn + r.dir * steps, r.players.length);
  // التجميد: اللاعب المجمّد يفوّت دوره
  for (let k = 0; k < r.players.length && r.frozen && r.frozen[cur(r).id] > 0; k++) {
    const f = cur(r); r.frozen[f.id]--; log(r, `🧊 ${f.name} مجمّد ويفوّت دوره`);
    r.turn = mod(r.turn + r.dir, r.players.length);
  }
  r.pending = null; r.turnSeq++;
}
const shieldOf = p => p.hand.find(c => c.color === 'power' && c.v === 'shield');
function usePower(r, p, card, targetId) {
  const others = r.players.filter(q => q !== p);
  let t = others.find(q => q.id === targetId);
  if (!t && PTARGET.includes(card.v)) {
    // بدون هدف (بوت أو مهلة): نختار المنطقي
    const by = f => others.slice().sort(f)[0];
    t = card.v === 'swap' ? by((a, b) => a.hand.length - b.hand.length) : card.v === 'steal' ? by((a, b) => b.hand.length - a.hand.length) : card.v === 'freeze' ? r.players[mod(r.turn + r.dir, r.players.length)] : others[Math.random() * others.length | 0];
  }
  const nm = POWERS[card.v];
  switch (card.v) {
    case 'spy': send(p.ws, { t: 'peek', name: t.name, id: t.id, hand: t.hand, ms: 5000 }); log(r, `${nm}: ${p.name} يتجسّس على أوراق ${t.name}`); break;
    case 'steal': { if (!t.hand.length) { log(r, `${nm}: ${t.name} ما عنده شي ينسرق`); break; } const c = t.hand.splice(Math.random() * t.hand.length | 0, 1)[0]; p.hand.push(c); send(p.ws, { t: 'pfx', k: 'got', card: c }); log(r, `${nm}: ${p.name} سرق ورقة من ${t.name}`); break; }
    case 'rain': others.forEach(q => drawCards(r, q, 2)); log(r, `${nm}: كل الباقين سحبوا ٢!`); break;
    case 'bomb': others.forEach(q => drawCards(r, q, 1)); log(r, `${nm}: انفجرت! الكل سحب ورقة`); break;
    case 'swap': { const h = p.hand; p.hand = t.hand; t.hand = h; p.uno = t.uno = false; log(r, `${nm}: ${p.name} بدّل أوراقه مع ${t.name}`); break; }
    case 'freeze': r.frozen = r.frozen || {}; r.frozen[t.id] = (r.frozen[t.id] || 0) + 2; log(r, `${nm}: ${t.name} بيفوّت دورين`); break;
    case 'gift': { let n = 0; for (; n < 2 && p.hand.length; n++) t.hand.push(p.hand.splice(Math.random() * p.hand.length | 0, 1)[0]); t.uno = false; log(r, `${nm}: ${p.name} أهدى ${t.name} ${n === 2 ? 'ورقتين' : 'ورقة'} 🎁`); break; }
  }
  cast(r, { t: 'pfx', k: card.v, from: p.id, to: t ? t.id : null });
  // أي أحد صار عنده ورقة وحدة بسبب القدرة ولا قال أونو ينمسك
  r.players.forEach(q => { if (q.hand.length > 1) q.uno = false; });
}
function winIfEmpty(r, p) {
  if (p.hand.length) return false;
  r.phase = 'over'; r.winner = p.name;
  if (r.teams) { r.winTeam = r.players.indexOf(p) % 2; r.score[r.winTeam]++; }
  log(r, `${p.name} خلّص أوراقه`);
  recordGame(r, p);
  return true;
}

// وضع الفرق يحتاج عدد زوجي ٤ أو أكثر، والفريق = رقم المقعد زوجي/فردي (يتناوبون بالجلوس)
function fixTeams(r) { if (r.game !== 'uno') { r.teams = !!META[r.game].teams; return; } if (r.teams && !(r.players.length >= 4 && r.players.length % 2 === 0)) r.teams = false; }

function start(r) {
  fixTeams(r);
  r.deck = buildDeck(!!r.opts.powers); r.discard = []; r.pdisc = []; r.frozen = {}; r.dir = 1; r.pending = null; r.catchable = null; r.winner = null; r.winTeam = null; r.log = []; r.recorded = false; r.owed = 0;
  r.players.forEach(p => { p.hand = []; p.uno = false; });
  for (let i = 0; i < 7; i++) r.players.forEach(p => p.hand.push(r.deck.pop()));
  let c;
  while (true) { c = r.deck.pop(); if (/^\d$/.test(c.v) && c.color !== 'power') break; r.deck.unshift(c); }
  r.discard.push(c); r.color = c.color;
  r.turn = Math.random() * r.players.length | 0;
  r.phase = 'play'; r.turnSeq++;
  log(r, 'بدأت اللعبة');
}

// عدد مرات الفوز يُحسب للجلسة فقط: لو اللاعب طلع من الغرفة يروح عدّه
function recordGame(r, w) {
  if (r.recorded) return; r.recorded = true;
  const wt = r.teams ? r.players.indexOf(w) % 2 : null;
  const isWin = (q, i) => r.teams ? i % 2 === wt : q === w;
  r.players.forEach((q, i) => { if (isWin(q, i)) q.wins = (q.wins || 0) + 1; });
}

function play(r, p, id, color, target) {
  if (r.phase !== 'play' || cur(r) !== p) return;
  const card = p.hand.find(c => c.id === id);
  if (!card || !canPlay(r, p, card)) return;
  if (card.color === 'power') {
    p.hand.splice(p.hand.indexOf(card), 1); (r.pdisc = r.pdisc || []).push(card); r.pending = null; r.catchable = null;
    usePower(r, p, card, target);
    if (winIfEmpty(r, p)) return;
    // ممكن الهدية/السرقة/التبديل تخلّي أحد ثاني بدون أوراق
    const z = r.players.find(q => !q.hand.length); if (z && winIfEmpty(r, z)) return;
    if (p.hand.length === 1 && !p.uno) r.catchable = p.id;
    advance(r, 1); return;
  }
  if (card.color === 'wild' && !COLORS.includes(color)) return;
  p.hand.splice(p.hand.indexOf(card), 1);
  r.discard.push(card); r.pending = null; r.catchable = null;
  r.color = card.color === 'wild' ? color : card.color;
  log(r, `${p.name} لعب ${cname(card)}${card.color === 'wild' ? ' واختار ' + AR[color] : ''}`);

  const n = r.players.length;
  let steps = 1;
  if (card.v === 'reverse') { r.dir *= -1; if (n === 2) steps = 2; } // مع لاعبين العكس يعمل مثل المنع
  if (card.v === 'skip') { steps = 2; log(r, `${r.players[mod(r.turn + r.dir, n)].name} انمنع`); }
  if ((card.v === 'draw2' || card.v === 'wild4') && r.opts.stack) {
    r.owed += card.v === 'draw2' ? 2 : 4; r.owedBy = p.id;
    log(r, `السحب صار ${r.owed} — ورّد عليه بنفس النوع أو اسحب`);
  } else if (card.v === 'draw2' || card.v === 'wild4') {
    const v = r.players[mod(r.turn + r.dir, n)];
    const k = card.v === 'draw2' ? 2 : 4;
    const sh = shieldOf(v);
    if (sh) { v.hand.splice(v.hand.indexOf(sh), 1); (r.pdisc = r.pdisc || []).push(sh); drawCards(r, p, k); log(r, `🛡️ ${v.name} عنده درع! الـ +${k} رجعت على ${p.name}`); cast(r, { t: 'pfx', k: 'shield', from: v.id, to: p.id }); steps = 1; }
    else { drawCards(r, v, k); steps = 2; log(r, `${v.name} سحب ${k} وانمنع`); }
  }
  if (winIfEmpty(r, p)) return;
  if (p.hand.length === 1 && !p.uno) r.catchable = p.id;
  advance(r, steps);
}
function draw(r, p) {
  if (r.phase !== 'play' || cur(r) !== p || r.pending !== null) return;
  r.catchable = null;
  if (r.owed > 0 && shieldOf(p)) { const k = r.owed, sh = shieldOf(p), a = r.players.find(q => q.id === r.owedBy) || p; r.owed = 0; p.hand.splice(p.hand.indexOf(sh), 1); (r.pdisc = r.pdisc || []).push(sh); if (a !== p) drawCards(r, a, k); log(r, `🛡️ ${p.name} عنده درع! الـ ${k} رجعت على ${a.name}`); cast(r, { t: 'pfx', k: 'shield', from: p.id, to: a.id }); advance(r, 1); return; }
  if (r.owed > 0) { const k = r.owed; r.owed = 0; drawCards(r, p, k); log(r, `${p.name} سحب ${k} وانمنع`); advance(r, 1); return; }
  drawCards(r, p, 1);
  log(r, `${p.name} سحب ورقة`);
  advance(r, 1); // قاعدتنا: الورقة المسحوبة ما تنلعب والدور يروح
}
function pass(r, p) {
  if (r.phase !== 'play' || cur(r) !== p || r.pending === null) return;
  advance(r, 1);
}
function uno(r, p) {
  if (r.phase !== 'play' || p.hand.length > 2) return;
  p.uno = true;
  if (r.catchable === p.id) r.catchable = null;
  log(r, `${p.name}: أونو!`);
}
function catchUno(r, p) {
  if (r.phase !== 'play' || !r.catchable || r.catchable === p.id) return;
  const v = r.players.find(q => q.id === r.catchable);
  r.catchable = null;
  if (!v) return;
  drawCards(r, v, 2);
  log(r, `${p.name} مسك ${v.name} ما قال أونو، وسحب ٢`);
}

// تصويت المتفرجين: العدد لكل لاعب + صوتي أنا
function votesView(r, p) {
  if (!r.votes || r.phase === 'lobby') return null;
  const c = {}; r.specs.forEach(s => { const v = r.votes.get(s.id); if (v && r.players.some(q => q.id === v)) c[v] = (c[v] || 0) + 1; });
  return { c, me: r.votes.get(p.id) || null };
}
function view(r, p) {
  if (r.game !== 'uno') {
    return {
      t: 'state', game: r.game, min: GAMES[r.game].min, max: maxOf(r), code: r.code, phase: r.phase, me: p.id, spec: !!p.spec, specs: r.specs.map(s => ({ id: s.id, name: s.name })), vt: votesView(r, p), boss: !!p.boss,
      players: r.players.map((q, i) => ({ id: q.id, name: q.name, n: q.hand ? q.hand.length : 0, on: q.online, h: q.id === r.host, tm: r.phase === 'lobby' ? i % 2 : q.team, w: q.wins || 0, av: q.av || '', bot: !!q.bot, lk: q.look || null })),
      opts: optsView(r, p), teams: !!META[r.game].teams, score: r.score, winTeam: r.winTeam, hand: [], top: null, color: null, dir: 1, turn: null, deck: 0,
      left: r.phase === 'play' && r.deadline ? Math.max(0, r.deadline - Date.now()) : 0, ok: [], pending: null, catch: null,
      log: r.log.slice(-4), winner: r.winner, g: r.phase === 'lobby' ? null : GAMES[r.game].view(r, p)
    };
  }
  const c = r.phase === 'lobby' ? null : cur(r);
  const mine = !!c && c.id === p.id && r.phase === 'play';
  return {
    t: 'state', game: 'uno', min: GAMES.uno.min, max: GAMES.uno.max, code: r.code, phase: r.phase, me: p.id, spec: !!p.spec, specs: r.specs.map(s => ({ id: s.id, name: s.name })), vt: votesView(r, p),
    players: r.players.map((q, i) => ({ id: q.id, name: q.name, n: q.hand.length, on: q.online, h: q.id === r.host, tm: r.teams ? i % 2 : null, w: q.wins || 0, av: q.av || '', bot: !!q.bot, u: !!q.uno })),
    teams: r.teams, score: r.score, winTeam: r.winTeam,
    hand: p.hand, top: r.discard[r.discard.length - 1] || null, color: r.color, dir: r.dir,
    turn: c ? c.id : null, deck: r.deck.length, left: r.phase === 'play' ? Math.max(0, r.deadline - Date.now()) : 0,
    ok: mine ? p.hand.filter(x => canPlay(r, p, x)).map(x => x.id) : [],
    pending: mine ? r.pending : null,
    mates: (r.teams && r.phase === 'play' && !p.spec) ? Object.fromEntries(r.players.filter((q, i) => q !== p && i % 2 === r.players.indexOf(p) % 2).map(q => [q.id, q.hand])) : null,
    catch: r.catchable, log: r.log.slice(-4), winner: r.winner, owed: r.owed, opts: optsView(r, p)
  };
}
function send(ws, o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
const everyone = r => r.players.concat(r.specs);
const reHost = r => { const h = r.players.find(q => !q.bot); if (h) r.host = h.id; return !!h; };
function cast(r, o) { everyone(r).forEach(p => p.online && send(p.ws, o)); }
const rate = (p, k, ms) => { const n = Date.now(); if (p['_' + k] && n - p['_' + k] < ms) return false; p['_' + k] = n; return true; };
function broadcast(r) { everyone(r).forEach(p => p.online && send(p.ws, view(r, p))); }

// لو دور لاعب انقطع نتصرف عنه بعد ثانيتين عشان اللعبة ما توقف
// مهلة الدور: لو انتهت الثواني يسحب السيرفر عن اللاعب (وإذا الورقة تنفع يمرّر)
function armTurn(r) {
  clearTimeout(r.timer);
  if (r.phase !== 'play') return;
  const ms = r.opts.turn ? r.opts.turn * 1000 : TURN_MS;
  r.deadline = Date.now() + ms;
  const seq = r.turnSeq;
  r.timer = setTimeout(() => {
    if (r.phase !== 'play' || r.turnSeq !== seq) return;
    const p = cur(r);
    log(r, `${p.name} تأخر، انسحبت له ورقة`);
    draw(r, p);
    if (r.phase === 'play' && cur(r) === p && r.pending !== null) pass(r, p);
    after(r);
  }, ms + 150);
}

// لاعب يطلع (أو ينطرد) أثناء اللعب: أوراقه ترجع للكومة والدور يتعدّل
// طرد لاعب (من المضيف أو من لوحة التيم)
function kickPlayer(r, id) {
  const sp = r.specs.find(q => q.id === id);
  const t = sp || r.players.find(q => q.id === id);
  if (!t) return;
  if (t.dev) r.banned.add('dev:' + t.dev); // نحظر الجهاز مو الـIP (بيت واحد أو شبكة جوال وحدة فيها ناس كثير)
  if (t.uid) r.banned.add('uid:' + t.uid);
  if (t.ws) { const tw = t.ws; tw.ctx = null; send(tw, { t: 'kicked' }); }
  if (sp) { r.specs = r.specs.filter(q => q !== sp); return after(r); }
  if (r.phase === 'lobby') return removePlayer(r, t);
  leaveGame(r, t); after(r);
}
function closeRoom(r) {
  clearTimeout(r.timer); clearTimeout(r.botT); rooms.delete(r.code);
  r.specs.forEach(s => { if (s.ws) { const w = s.ws; w.ctx = null; send(w, { t: 'left' }); } });
  r.specs = [];
}
// مقاعد فاضية في اللوبي: المتفرجين ينتقلون لاعبين
function fill(r) {
  if (r.phase !== 'lobby') return;
  while (r.players.length < maxOf(r)) {
    const s = r.specs.find(q => !(q.wo && r.game === 'art')); if (!s) break; // اللي اختار يتفرّج بالمرسم (حكم) يبقى متفرّج
    r.specs = r.specs.filter(q => q !== s); s.spec = false;
    r.players.push(s); if (!r.host) r.host = s.id;
  }
}

function leaveOther(r, p) {
  const idx = r.players.indexOf(p); if (idx < 0) return;
  p._idx = idx; p.hand = [];
  r.players.splice(idx, 1);
  if (!r.players.some(q => !q.bot)) return closeRoom(r);
  if (r.host === p.id) reHost(r);
  if (r.phase !== 'play') return;
  log(r, `${p.name} طلع من اللعبة`);
  const G = GAMES[r.game]; if (G.leave) G.leave(r, p);
  if (r.phase === 'play' && r.players.length < G.min) { r.phase = 'over'; r.winner = r.winner || 'انتهت اللعبة'; clearTimeout(r.timer); r.deadline = 0; }
}
function startGame(r) {
  statStart(r); PTS.start(r); r.votes = new Map();
  if (r.game === 'uno') return start(r);
  fixTeams(r); r.log = []; r.recorded = false; GAMES[r.game].start(r);
}
const statStart = r => { try { if (STAFF) STAFF.onStart(r); } catch (e) { console.error('stats', e); } };

function leaveGame(r, p) {
  if (r.game !== 'uno') return leaveOther(r, p);
  const idx = r.players.indexOf(p);
  if (idx < 0) return;
  const wasTurn = r.phase === 'play' && r.turn === idx;
  r.deck.unshift(...p.hand); p.hand = [];
  r.players.splice(idx, 1);
  if (!r.players.some(q => !q.bot)) return closeRoom(r);
  if (r.host === p.id) reHost(r);
  if (r.catchable === p.id) r.catchable = null;
  if (r.phase !== 'play') return;
  log(r, `${p.name} طلع من اللعبة`);
  if (r.teams) { r.teams = false; log(r, 'انلغى وضع الفرق'); }
  if (r.players.length < 2) { r.phase = 'over'; r.winner = r.players[0].name; r.winTeam = null; log(r, `${r.winner} فاز، الباقين طلعوا`); return; }
  const n = r.players.length;
  if (idx < r.turn) r.turn--;
  else if (wasTurn) { r.turn = r.dir === 1 ? idx % n : mod(idx - 1, n); r.pending = null; r.turnSeq++; }
  r.turn = mod(r.turn, n);
}

// ---- البوتات ----
const rnd = n => Math.random() * n | 0;
// البوت يكتب بالشات مثل أي لاعب
function botSay(r, b, text) { if (!b || rooms.get(r.code) !== r) return; const msg = { from: b.id, name: b.name, text }; r.chat.push(msg); if (r.chat.length > 30) r.chat.shift(); cast(r, { t: 'chat', ...msg }); }
const OUT_ANS = ['إيه أحبه 😄', 'يعتمد على المزاج', 'مرة بالأسبوع تقريباً', 'لا والله ما أحبه', 'كل يوم تقريباً!', 'أكيد، مع الربع', 'حسب الوقت', 'آخر مرة كانت من زمان', 'إيه بس مو كثير', 'هههه سؤال صعب', 'أحس عادي', 'أحياناً'];
const OUT_SUS = n => [`أشك في ${n} 🤨`, `${n} جوابه غريب`, `أحس إنه ${n}`, `${n} مرتبك شوي 👀`][rnd(4)];
function botAction(r) {
  const bots = r.players.filter(q => q.bot);
  if (!bots.length || r.phase !== 'play') return null;
  if (r.game === 'uno') {
    const p = cur(r); if (!p.bot) return null;
    return { d: 1000 + rnd(900), fn() {
      if (cur(r) !== p) return;
      if (r.pending !== null) { const c = p.hand.find(x => x.id === r.pending); return c ? botPlay(r, p, c) : pass(r, p); }
      const ok = p.hand.filter(c => canPlay(r, p, c));
      if (!ok.length) return draw(r, p);
      const pw = ok.filter(c => c.color === 'power');
      if (pw.length && Math.random() < .45) return botPlay(r, p, pw[rnd(pw.length)]);
      const nw = ok.filter(c => c.color !== 'wild' && c.color !== 'power');
      botPlay(r, p, (nw.length ? nw : ok)[rnd((nw.length ? nw : ok).length)]);
    } };
  }
  if (r.game === 'liars') {
    const g = r.g, p = r.players.find(q => q.id === g.turn);
    if (!p || !p.bot || g.sub !== 'play') return null;
    return { d: 1500 + rnd(1800), fn() {
      if (g.turn !== p.id || g.sub !== 'play') return;
      const L = GAMES.liars, n = g.last ? g.last.cards.length : 0, prev = g.last && r.players.find(q => q.id === g.last.by);
      const must = g.last && (!p.hand.length || (prev && !prev.hand.length));
      if (must || (g.last && Math.random() < .12 + .2 * (n - 1) + (g.pile > 6 ? .12 : 0))) return L.act(r, p, { t: 'call' });
      const truth = p.hand.filter(c => c.t === g.table || c.t === 'J'), pool = truth.length ? truth : p.hand;
      const k = Math.min(pool.length, 1 + rnd(2));
      L.act(r, p, { t: 'put', ids: H.shuffle(pool.slice()).slice(0, k).map(c => c.id) });
    } };
  }
  // سبّاق الكتابة: البوتات تتسابق من داخل games/typing.js
  if (r.game === 'outside') {
    const g = r.g, words = require('./games/outside-words')[g.cat] || [], pickW = ex => { const ok = words.filter(w => w !== ex); return ok[rnd(ok.length)] || '؟'; };
    if (g.sub === 'ask') {
      const b = bots.find(q => q.id === g.asker); if (!b) return null;
      return { d: 1800 + rnd(2500), fn() { if (r.g !== g || g.sub !== 'ask' || g.asker !== b.id) return; const o = GAMES.outside.view(r, b).canAsk || []; if (o.length) GAMES.outside.act(r, b, { t: 'ask', id: o[rnd(o.length)] }); } };
    }
    if (g.sub === 'qa') {
      const b = bots.find(q => q.id === g.target); if (!b) return null;
      return { d: 2500 + rnd(2500), fn() { if (r.g === g && g.sub === 'qa' && g.target === b.id) { botSay(r, b, OUT_ANS[rnd(OUT_ANS.length)]); GAMES.outside.act(r, b, { t: 'done' }); } } };
    }
    if (g.sub === 'vote') {
      const b = bots.find(q => !g.votes[q.id]); if (!b) return null;
      // التصويت: أول بوت ياخذ وقته، والباقين ورا بعض بسرعة — ولو كل اللاعبين الحقيقيين صوّتوا نخلص على طول
      const humansVoted = r.players.filter(q => !q.bot && q.online).every(q => g.votes[q.id]);
      const anyBotVoted = bots.some(q => g.votes[q.id]);
      return { d: humansVoted ? 500 + rnd(500) : anyBotVoted ? 800 + rnd(1400) : 2000 + rnd(2500), fn() { if (r.g !== g || g.sub !== 'vote' || g.votes[b.id]) return; const o = r.players.filter(q => q.id !== b.id), t = o[rnd(o.length)]; if (Math.random() < .45) botSay(r, b, OUT_SUS(t.name)); GAMES.outside.act(r, b, { t: 'vote', id: t.id }); } };
    }
    if (g.sub === 'guess') {
      const b = bots.find(q => q.id === g.spy); if (!b) return null;
      return { d: 3000 + rnd(4000), fn() { if (r.g === g && g.sub === 'guess') GAMES.outside.act(r, b, { t: 'guess', text: g.opts[rnd(g.opts.length)] }); } };
    }
    return null;
  }
  if (r.game === 'flip') {
    const g = r.g, F = GAMES.flip;
    if (g.sub === 'chal') {
      const b = bots.find(q => q.id === g.chal.victim); if (!b) return null;
      return { d: 1500 + rnd(2000), fn() { if (r.g === g && g.sub === 'chal') GAMES.flip.act(r, b, { t: 'chal', yes: Math.random() < .2 }); } };
    }
    const b = bots.find(q => q === r.players[g.turn]); if (!b) return null;
    return { d: 1400 + rnd(2200), fn() {
      if (r.g !== g || g.sub !== 'play' || r.players[g.turn] !== b) return;
      const ok = b.hand.filter(c => F.playable(g, b, c));
      if (!ok.length) return GAMES.flip.act(r, b, { t: 'draw' });
      if (b.hand.length === 2) GAMES.flip.act(r, b, { t: 'uno' });
      const pri = c => { const v = F.face(g, c).v; return /^\d$/.test(v) ? 1 : v === 'wild' ? 0 : 3; };
      ok.sort((x, y) => pri(y) - pri(x) + (Math.random() - .5) * 2);
      const c = ok[0], f = F.face(g, c); let color;
      if (f.c === 'wild') { const cnt = {}; b.hand.forEach(x => { const xf = F.face(g, x); if (xf.c !== 'wild') cnt[xf.c] = (cnt[xf.c] || 0) + 1; }); color = Object.keys(cnt).sort((p, q) => cnt[q] - cnt[p])[0] || F.SIDES[g.side][rnd(4)]; }
      GAMES.flip.act(r, b, { t: 'play', id: c.id, color });
    } };
  }
  if (r.game === 'jackaroo') {
    const g = r.g, p = r.players[g.turn]; if (!p || !p.bot) return null;
    return { d: 1100 + rnd(900), fn() {
      if (r.players[g.turn] !== p) return;
      const b = GAMES.jackaroo.bot(r, p); if (b) GAMES.jackaroo.move(r, p, b);
    } };
  }
  if (r.game === 'hive') {
    const g = r.g, hum = t => r.players.some(q => !q.bot && q.team === t);
    if (g.sub === 'pick' && !hum(g.turn)) {
      const b = bots.find(q => q.team === g.turn), free = g.cells.map((c, i) => c.o === null ? i : -1).filter(i => i >= 0);
      if (b && free.length) return { d: 1500, fn() { GAMES.hive.act(r, b, { t: 'pick', i: free[rnd(free.length)] }); } };
    }
    const at = g.sub === 'answer' ? g.turn : g.sub === 'steal' ? 1 - g.picker : null;
    if (at !== null && !hum(at)) {
      const b = bots.find(q => q.team === at);
      if (b && g.q) return { d: 3000 + rnd(3500), fn() { GAMES.hive.act(r, b, { t: 'answer', text: Math.random() < .45 ? g.q.a[0] : 'مدري' }); } };
    }
  }
  return null;
}
function botPlay(r, p, c) {
  if (p.hand.length === 2) uno(r, p);
  let color;
  if (c.color === 'wild') { const cnt = {}; p.hand.forEach(x => { if (x.color !== 'wild') cnt[x.color] = (cnt[x.color] || 0) + 1; }); color = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || COLORS[rnd(4)]; }
  play(r, p, c.id, color);
}
function botTurn(r) {
  if (r.phase !== 'play') return;
  const a = botAction(r); if (!a) return;
  // لو فيه حركة بوت مجدولة بس الحين صار لازم أسرع (مثلاً الكل صوّت)، نقدّمها
  if (r.botT) { if (Date.now() + a.d >= r.botAt - 300) return; clearTimeout(r.botT); }
  r.botAt = Date.now() + a.d;
  r.botT = setTimeout(() => { r.botT = null; if (rooms.get(r.code) !== r || r.phase !== 'play') return; a.fn(); after(r); }, a.d);
}

function after(r) {
  if (!r.players.length || rooms.get(r.code) !== r) return; // الغرفة انقفلت
  try { afterInner(r); } catch (e) { console.error('after() error', r.game, e); }
}
function afterInner(r) {
  if (r.phase === 'lobby') { fill(r); fixTeams(r); }
  if (r.phase === 'over' && r.pts && !r.pts.done) { try { PTS.end(r); } catch (e) { console.error('points', e); } }
  if (r.game === 'uno' && r.phase === 'play' && r.armed !== r.turnSeq) { r.armed = r.turnSeq; armTurn(r); }
  else if (r.phase !== 'play') clearTimeout(r.timer);
  broadcast(r);
  botTurn(r);
  if (r.phase !== 'play' || r.game !== 'uno') return;
  const p = cur(r);
  if (!p || p.online) return;
  setTimeout(() => {
    if (r.phase !== 'play' || cur(r) !== p || p.online) return;
    draw(r, p); if (cur(r) === p && r.pending !== null) pass(r, p);
    after(r);
  }, 2000);
}

function addPlayer(r, name, av = '') {
  const p = { id: rid().slice(0, 5), token: rid() + rid(), name, av, ws: null, hand: [], uno: false, online: true };
  r.players.push(p); if (!r.host) r.host = p.id;
  return p;
}
function removePlayer(r, p) {
  r.players = r.players.filter(q => q !== p);
  if (!r.players.some(q => !q.bot)) { r.players = []; if (r.specs.length && r.phase === 'lobby') { fill(r); reHost(r); return after(r); } return closeRoom(r); }
  if (r.host === p.id) reHost(r);
  after(r);
}
const cleanName = s => String(s || '').trim().slice(0, 14) || 'لاعب';

// لاعب جديد: لو اللعبة بدأت أو الغرفة ممتلئة يدخل متفرّج بدل ما ينرفض
function admit(ws, r, name, extra = {}) {
  if (r.phase === 'lobby' && r.players.length < maxOf(r)) {
    const p = addPlayer(r, name, extra.av); Object.assign(p, extra); p.ws = ws; return p;
  }
  if (r.opts.lock) { send(ws, { t: 'err', msg: 'الغرفة مقفلة، ما تقبل متفرجين' }); return null; }
  if (r.specs.length >= MAXSPEC) { send(ws, { t: 'err', msg: 'المتفرجين كثير، جرّب بعدين' }); return null; }
  const s = { id: rid().slice(0, 5), token: rid() + rid(), name, av: extra.av || '', ws, hand: [], uno: false, online: true, spec: true, ...extra };
  r.specs.push(s); return s;
}

// صاحب الموقع (علي، داخل مكان التيم): يقدر يختار رقم النرد بلودو بحركة سرية
const markBoss = (p, m) => {
  if (m.teamTok && STAFF && STAFF.check(m.teamTok) === 'علي') p.boss = true;
  const d = dCheck(m.dtok); if (d && !p.uid) { p.uid = d.id; p.name = d.n; p.dc = true; } // داخل بحساب ديسكورد: اسمه من ديسكورد ونقاطه على حسابه
};
function join(ws, m) {
  const r = rooms.get(String(m.code || '').toUpperCase().trim());
  if (!r) return send(ws, { t: 'err', msg: 'الغرفة غير موجودة', reset: true });
  const known = m.token && (r.players.some(q => q.token === m.token) || r.specs.some(q => q.token === m.token));
  const dev = String(m.dev || '').slice(0, 40);
  if (!known && dev && r.banned.has('dev:' + dev)) return send(ws, { t: 'err', msg: 'تم طردك من هذي الغرفة' });
  if (!known && r.teamOnly && !(STAFF && STAFF.check(m.teamTok))) return send(ws, { t: 'err', msg: 'هذي غرفة خاصة بتيم ترتيب 🔐', reset: true });
  if (!known && r.opts.pass && String(m.pass || '') !== r.opts.pass) return send(ws, { t: 'err', msg: m.pass ? 'كلمة السر غلط' : 'الغرفة محمية بكلمة سر', needpass: true });
  let p = m.token && (r.players.find(q => q.token === m.token) || r.specs.find(q => q.token === m.token));
  if (p) {
    if (p.ws && p.ws !== ws) { p.ws.ctx = null; try { p.ws.close(); } catch {} }
    p.ws = ws; p.online = true;
  } else {
    p = admit(ws, r, cleanName(m.name), { av: cleanAv(m.av) });
    if (!p) return;
  }
  if (dev) p.dev = dev;
  markBoss(p, m);
  ws.ctx = { r, p };
  send(ws, { t: 'joined', code: r.code, token: p.token, name: p.name });
  send(ws, { t: 'chathist', list: r.chat });
  after(r);
}

// دخول من داخل ديسكورد: الغرفة = معرّف النشاط، والهوية من حساب ديسكورد (نتحقق من التوكن)
async function activity(ws, m) {
  let u;
  try {
    const r = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + String(m.token || '') } });
    if (!r.ok) throw 0;
    u = await r.json();
  } catch { return send(ws, { t: 'err', msg: 'تعذّر التحقق من حساب الديسكورد' }); }
  const key = String(m.room || '').slice(0, 64).toUpperCase();
  if (!key || !u.id) return;
  let r = rooms.get(key);
  if (!r) { r = newRoom(key); rooms.set(key, r); }
  if (r.banned.has('uid:' + u.id)) return send(ws, { t: 'err', msg: 'تم طردك من هذي الغرفة' });
  let p = r.players.find(q => q.uid === u.id) || r.specs.find(q => q.uid === u.id);
  if (p) {
    if (p.ws && p.ws !== ws) { p.ws.ctx = null; try { p.ws.close(); } catch {} }
    p.ws = ws; p.online = true;
  } else {
    p = admit(ws, r, cleanName(u.global_name || u.username), { uid: u.id, av: cleanAv(m.av) });
    if (!p) return;
  }
  ws.ctx = { r, p };
  send(ws, { t: 'joined', code: r.code, token: '', name: p.name });
  send(ws, { t: 'chathist', list: r.chat });
  after(r);
}

PTS = require('./points')({ send });
STAFF = require('./staff')({ rooms, wss, send, rate, closeRoom, kick: kickPlayer });

wss.on('connection', (ws, req) => {
  ws.ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  ws.dead = false;
  ws.on('pong', () => { ws.dead = false; });
  ws.on('message', raw => { try { onMsg(ws, raw); } catch (e) { console.error('message error', e); } });
  function onMsg(ws, raw) {
    // حماية من الإغراق: أكثر من ١٠٠ رسالة بالثانية من نفس الاتصال تنتجاهل
    const now = Date.now();
    if (!ws.rl || now - ws.rl.t > 1000) ws.rl = { t: now, n: 0 };
    if (++ws.rl.n > 100) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    if (m.t === 'create') { // ما يسوي أكثر من ٨ غرف بالدقيقة
      ws.cr = (ws.cr || []).filter(t => now - t < 60000);
      if (ws.cr.length >= 8) return send(ws, { t: 'err', msg: 'سويت غرف كثير، انتظر دقيقة' });
      ws.cr.push(now);
    }
    if (m.t === 'create') {
      const r = newRoom(newCode(), GAMES[m.game] ? m.game : 'uno');
      if (m.teamOnly && STAFF && STAFF.check(m.teamTok)) r.teamOnly = true;
      rooms.set(r.code, r);
      const p = addPlayer(r, cleanName(m.name), cleanAv(m.av)); p.ws = ws; ws.ctx = { r, p }; if (m.dev) p.dev = String(m.dev).slice(0, 40); markBoss(p, m);
      send(ws, { t: 'joined', code: r.code, token: p.token, name: p.name });
      return after(r);
    }
    if (m.t === 'staff') return STAFF && STAFF.handle(ws, m);
    if (m.t === 'join') return join(ws, m);
    if (m.t === 'activity') return activity(ws, m);
    const c = ws.ctx; if (!c) return;
    const { r, p } = c;
    if (m.t === 'svote') { // تصويت المتفرجين: مين بيفوز؟
      if (p.spec && r.phase === 'play' && r.votes && rate(p, 'sv', 600) && (m.id === null || r.players.some(q => q.id === m.id))) { if (m.id) r.votes.set(p.id, m.id); else r.votes.delete(p.id); broadcast(r); }
      return;
    }
    if (m.t === 'aspec' && r.game === 'art' && r.phase === 'lobby') { // المرسم: أتفرّج بس (عشان أكون حكم) أو أرجع ألعب
      if (!p.spec && r.host !== p.id && r.players.length > 1) { r.players = r.players.filter(q => q !== p); p.spec = true; p.wo = true; r.specs.push(p); }
      else if (p.spec && r.players.length < maxOf(r)) { r.specs = r.specs.filter(q => q !== p); p.spec = false; p.wo = false; r.players.push(p); }
      return after(r);
    }
    if (p.spec && !['chat', 'emoji', 'leave'].includes(m.t) && !(r.game === 'deal' && ['dst', 'dsv'].includes(m.t)) && !(r.game === 'art' && ['avote', 'awatch', 'acheer', 'aneed'].includes(m.t))) return; // المتفرّج يشوف ويسولف بس
    if (r.game !== 'uno' && !['start', 'teams', 'shuffle', 'again', 'leave', 'kick', 'chat', 'emoji', 'setgame', 'opt', 'addbot', 'tolobby', 'look'].includes(m.t)) { if (GAMES[r.game].act(r, p, m) === 'quiet') return; return after(r); }
    switch (m.t) {
      case 'start': if (r.host === p.id && r.phase === 'lobby' && r.players.length >= GAMES[r.game].min) startGame(r); break;
      case 'play': play(r, p, m.id, m.color, typeof m.target === 'string' ? m.target : null); break;
      case 'look': { const l = cleanLook(m.v); if (l && rate(p, 'lk', 400)) p.look = l; else return; break; }
      case 'emoji':
        if (EMOJIS.includes(m.e) && rate(p, 'e', 700)) cast(r, { t: 'react', from: p.id, e: m.e, c: ['abu', 'umm', 'jad', 'hmd'].includes(m.c) ? m.c : 'abu' });
        return;
      case 'chat': {
        const text = String(m.text || '').trim().slice(0, 120);
        if (text && rate(p, 'c', 500)) {
          const msg = { from: p.id, name: p.name, text };
          // المندس: الأحياء يسولفون وقت الاجتماع بس، والأموات يسولفون بينهم
          const sg = r.game === 'sus' && r.phase === 'play' && r.g && r.g.P[p.id];
          if (sg && !sg.alive) { msg.ghost = 1; everyone(r).forEach(q => { const Q = r.g.P[q.id]; if (q.online && (!Q || !Q.alive)) send(q.ws, { t: 'chat', ...msg }); }); return; }
          if (sg && !['meet', 'eject'].includes(r.g.sub)) { send(ws, { t: 'err', msg: 'السوالف وقت الاجتماع بس 🤫' }); return; }
          r.chat.push(msg); if (r.chat.length > 30) r.chat.shift();
          cast(r, { t: 'chat', ...msg });
        }
        return;
      }
      case 'setgame':
        if (r.host !== p.id || r.phase !== 'lobby' || !GAMES[m.game] || m.game === r.game) break;
        if (r.players.length > GAMES[m.game].max) { send(ws, { t: 'err', msg: 'عدد اللاعبين أكثر من المسموح لهذه اللعبة' }); break; }
        r.game = m.game; r.teams = false; r.score = [0, 0]; r.g = null;
        r.opts = { lock: r.opts.lock, pass: r.opts.pass };
        if (!META[r.game].bots) r.players = r.players.filter(q => !q.bot);
        fixTeams(r); break;
      case 'opt': {
        if (r.host !== p.id || r.phase !== 'lobby') break;
        const k = m.k, v = m.v;
        if (k === 'lock') r.opts.lock = !!v;
        else if (k === 'pass') r.opts.pass = String(v || '').replace(/\s/g, '').slice(0, 12);
        else if (k === 'stack' && r.game === 'uno') r.opts.stack = !!v;
        else if (k === 'powers' && r.game === 'uno') r.opts.powers = !!v;
        else if (k === 'turn' && r.game === 'uno' && [10, 15, 25, 40].includes(+v)) r.opts.turn = +v;
        else if (k === 'imps' && r.game === 'sus' && [1, 2, 3].includes(+v)) r.opts.imps = +v;
        else if (k === 'doctor' && r.game === 'sus') r.opts.doctor = !!v;
        else if (k === 'map' && r.game === 'sus' && ['ship', 'forest'].includes(v)) r.opts.map = v;
        else if (k === 'target' && r.game === 'typing' && [3, 5, 8, 12].includes(+v)) r.opts.target = +v;
        else if (k === 'mcount' && r.game === 'mafia' && [0, 1, 2, 3, 4].includes(+v)) r.opts.mcount = +v;
        else if (k === 'dayT' && r.game === 'mafia' && [60, 90, 120, 180].includes(+v)) r.opts.dayT = +v;
        else if (k === 'reveal' && r.game === 'mafia') r.opts.reveal = !!v;
        else if (k === 'mrole' && r.game === 'mafia' && ['doc', 'det', 'sniper', 'god', 'jester', 'mayor'].includes(m.r)) { r.opts.mroles = Object.assign({ doc: 1, det: 1, sniper: 1, god: 1, jester: 1, mayor: 1 }, r.opts.mroles); r.opts.mroles[m.r] = v ? 1 : 0; }
        else if (k === 'blives' && r.game === 'bomb' && [2, 3, 4].includes(+v)) r.opts.blives = +v;
        else if (k === 'bdiff' && r.game === 'bomb' && ['easy', 'mid', 'hard'].includes(v)) r.opts.bdiff = v;
        else if (k === 'frounds' && r.game === 'fib' && [5, 7, 10].includes(+v)) r.opts.frounds = +v;
        else if (k === 'psteps' && r.game === 'phone' && [0, 4, 6, 8].includes(+v)) r.opts.psteps = +v;
        else if (k === 'pdraw' && r.game === 'phone' && [60, 90, 120].includes(+v)) r.opts.pdraw = +v;
        else if (k === 'aitems' && r.game === 'auction' && [6, 8, 10].includes(+v)) r.opts.aitems = +v;
        else if (k === 'drounds' && r.game === 'feud' && [4, 6].includes(+v)) r.opts.drounds = +v;
        else if (k === 'jrounds' && r.game === 'jwb' && [5, 7, 10].includes(+v)) r.opts.jrounds = +v;
        else if (k === 'krounds' && r.game === 'cars' && [1, 3, 5].includes(+v)) r.opts.krounds = +v;
        else if (k === 'ktime' && r.game === 'cars' && [60, 75, 90].includes(+v)) r.opts.ktime = +v;
        else if (k === 'mlim' && r.game === 'rich' && [15, 25, 0].includes(+v)) r.opts.mlim = +v;
        else if (k === 'bwins' && r.game === 'boxing' && [1, 2, 3].includes(+v)) r.opts.bwins = +v;
        else if (k === 'fwins' && r.game === 'brawl' && [1, 2, 3].includes(+v)) r.opts.fwins = +v;
        else if (k === 'bspeed' && r.game === 'bingo' && [3, 5, 7].includes(+v)) r.opts.bspeed = +v;
        else if (k === 'bgoal' && r.game === 'bingo' && ["line", "two", "full"].includes(v)) r.opts.bgoal = v;
        else if (k === 'atheme' && r.game === 'art') r.opts.atheme = String(v || '').slice(0, 60);
        else if (k === 'atime' && r.game === 'art' && [0, 10, 15, 20, 30, 45, 60, 90, 120].includes(+v)) r.opts.atime = +v;
        else if (k === 'ajmode' && r.game === 'art' && ['all', 'judges', 'mix'].includes(v)) r.opts.ajmode = v;
        else if (k === 'ajudges' && r.game === 'art' && Array.isArray(v)) r.opts.ajudges = v.map(String).filter(id => r.players.some(q => q.id === id) || r.specs.some(q => q.id === id)).slice(0, 10);
        else if (k === 'acollab' && r.game === 'art') r.opts.acollab = !!v;
        else if (k === 'bskin' && r.game === 'bingo' && ["diw", "hall", "tv"].includes(v)) r.opts.bskin = v;
        else if (k === 'ltime' && r.game === 'ludo' && [10, 20, 30].includes(+v)) r.opts.ltime = +v;
        else if (k === 'qrounds' && r.game === 'qfl' && [3, 5, 7].includes(+v)) r.opts.qrounds = +v;
        else if (k === 'qtime' && r.game === 'qfl' && [20, 30, 45].includes(+v)) r.opts.qtime = +v;
        else if (k === 'dsets' && r.game === 'deal' && [2, 3, 4].includes(+v)) r.opts.dsets = +v;
        else if (k === 'dtime' && r.game === 'deal' && [30, 60, 90].includes(+v)) r.opts.dtime = +v;
        else if (k === 'dxbld' && r.game === 'deal' && [0, 1].includes(+v)) r.opts.dxbld = +v;
        else if (k === 'dxbig' && r.game === 'deal' && [0, 1].includes(+v)) r.opts.dxbig = +v;
        else if (k === 'erounds' && r.game === 'emo' && [5, 8, 12].includes(+v)) r.opts.erounds = +v;
        else if (k === 'emtime' && r.game === 'emo' && [30, 45, 60].includes(+v)) r.opts.emtime = +v;
        else if (k === 'elives' && r.game === 'elim' && [1, 2, 3].includes(+v)) r.opts.elives = +v;
        else if (k === 'etime' && r.game === 'elim' && [10, 15, 20].includes(+v)) r.opts.etime = +v;
        else if (k === 'brounds' && r.game === 'bwb' && [3, 5, 8].includes(+v)) r.opts.brounds = +v;
        else if (k === 'btime' && r.game === 'bwb' && [60, 90, 120].includes(+v)) r.opts.btime = +v;
        else if (k === 'rtime' && r.game === 'redlight' && [45, 60, 90].includes(+v)) r.opts.rtime = +v;
        else if (k === 'trounds' && r.game === 'tartayb' && [5, 10, 15].includes(+v)) r.opts.trounds = +v;
        else if (k === 'ttime' && r.game === 'tartayb' && [20, 30, 45].includes(+v)) r.opts.ttime = +v;
        else if (k === 'jtime' && r.game === 'jwb' && [20, 30, 45].includes(+v)) r.opts.jtime = +v;
        else if (k === 'jn' && r.game === 'jwb' && [1, 3, 5].includes(+v)) r.opts.jn = +v;
        else if (k === 'fcount' && r.game === 'flags' && [10, 15, 20].includes(+v)) r.opts.fcount = +v;
        else if (k === 'fmode' && r.game === 'flags' && ['flags', 'cap', 'mix'].includes(v)) r.opts.fmode = v;
        else if (k === 'fdiff' && r.game === 'flags' && ['easy', 'all'].includes(v)) r.opts.fdiff = v;
        else if (k === 'mrounds' && r.game === 'mimic' && [5, 8, 10].includes(+v)) r.opts.mrounds = +v;
        else if (k === 'mpack' && r.game === 'mimic' && ['all', 'react', 'basic'].includes(v)) r.opts.mpack = v;
        else if (k === 'ctime' && r.game === 'chess' && ['none', '3+2', '5', '10'].includes(v)) r.opts.ctime = v;
        else if (k === 'clevel' && r.game === 'chess' && ['easy', 'mid', 'hard'].includes(v)) r.opts.clevel = v;
        else if (k === 'ccolor' && r.game === 'chess' && ['rand', 'host'].includes(v)) r.opts.ccolor = v;
        else if (k === 'words' && r.game === 'codes') {
          const text = String(v || '').slice(0, 1500);
          const list = [...new Set(text.split(/[\n,،؛;]+/).map(x => x.trim()).filter(x => x && x.length <= 16))];
          if (!list.length) { r.opts.words = null; r.opts.wordsText = ''; }
          else if (list.length < 25) { send(ws, { t: 'err', msg: `نحتاج ٢٥ كلمة على الأقل (كتبت ${list.length})` }); break; }
          else { r.opts.words = list; r.opts.wordsText = text; }
        }
        break;
      }
      case 'addbot':
        if (r.host === p.id && r.phase === 'lobby' && META[r.game].bots && r.players.length < maxOf(r)) {
          const bp = addPlayer(r, 'بوت ' + (r.players.filter(q => q.bot).length + 1), '🤖'); bp.bot = true; bp.look = randLook();
        }
        break;
      case 'teams':
        if (r.game === 'uno' && r.host === p.id && r.phase === 'lobby') { r.teams = !!m.on && r.players.length >= 4 && r.players.length % 2 === 0; r.score = [0, 0]; }
        break;
      case 'shuffle':
        if (r.host === p.id && r.phase === 'lobby' && r.teams) shuffle(r.players);
        break;
      case 'draw': draw(r, p); break;
      case 'pass': pass(r, p); break;
      case 'uno': uno(r, p); break;
      case 'catch': catchUno(r, p); break;
      case 'again':
        if (r.host === p.id && r.phase === 'over') {
          r.players = r.players.filter(q => q.online);
          r.players.forEach(q => { q.hand = []; q.uno = false; });
          r.phase = 'lobby'; r.winner = null; r.winTeam = null; r.log = []; r.g = null; clearTimeout(r.timer); r.deadline = 0;
        }
        break;
      case 'tolobby':
        if (r.host === p.id && r.phase === 'play') {
          clearTimeout(r.timer); clearTimeout(r.botT); r.botT = null;
          if (r.g && r.g.hintT) clearTimeout(r.g.hintT);
          r.players = r.players.filter(q => q.online || q.bot);
          r.players.forEach(q => { q.hand = []; q.uno = false; });
          r.phase = 'lobby'; r.winner = null; r.winTeam = null; r.log = []; r.g = null; r.owed = 0; r.pending = null; r.catchable = null; r.deadline = 0;
        }
        break;
      case 'leave':
        ws.ctx = null; send(ws, { t: 'left' });
        if (p.spec) { r.specs = r.specs.filter(q => q !== p); break; }
        if (r.phase === 'lobby') return removePlayer(r, p);
        leaveGame(r, p); break;
      case 'kick': {
        if (r.host !== p.id || m.id === p.id) return;
        return kickPlayer(r, m.id);
      }
    }
    after(r);
  }
  ws.on('close', () => {
    if (STAFF) STAFF.onClose(ws);
    const c = ws.ctx; if (!c || c.p.ws !== ws) return;
    const { r, p } = c;
    p.online = false; p.ws = null;
    if (p.spec) { // المتفرج ياخذ مهلة يرجع فيها بنفس مكانه
      broadcast(r);
      return setTimeout(() => { if (!p.online && r.specs.includes(p)) { r.specs = r.specs.filter(q => q !== p); broadcast(r); } }, 60000);
    }
    if (r.phase === 'lobby') {
      // قبل كان ينشال من اللوبي على طول — فلو الجوال قطع ثانية (طلع من التطبيق مثلاً) يرجع متفرج أو يطلب كلمة السر
      broadcast(r);
      return setTimeout(() => { if (!p.online && r.phase === 'lobby' && r.players.includes(p) && rooms.get(r.code) === r) removePlayer(r, p); }, 60000);
    }
    if (r.players.every(q => !q.online)) setTimeout(() => { if (r.players.every(q => !q.online)) rooms.delete(r.code); }, 10 * 60 * 1000);
    after(r);
  });
});

setInterval(() => wss.clients.forEach(w => { if (w.dead) return w.terminate(); w.dead = true; w.ping(); }), 30000);
server.listen(PORT, () => console.log(`ترتيب شغّال على http://localhost:${PORT}`));

// شبكة أمان: خطأ في لعبة وحدة ما يطيّح السيرفر كامل (ويطلّع كل الغرف)
process.on('uncaughtException', e => { console.error('uncaught', e); if (e && (e.code === 'EADDRINUSE' || e.code === 'EACCES')) process.exit(1); });
process.on('unhandledRejection', e => console.error('unhandled', e));
