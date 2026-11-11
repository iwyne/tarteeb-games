// ترتيب — سيرفر الألعاب (أونو)
// تشغيل: npm install ثم npm start ثم افتح http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

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

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/token') return tokenRoute(req, res);
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(d);
  });
});

const wss = new WebSocketServer({ server });
const rooms = new Map();
const COLORS = ['red', 'yellow', 'green', 'blue'];
const AR = { red: 'أحمر', yellow: 'أصفر', green: 'أخضر', blue: 'أزرق' };
const MIN = 2, MAX = 6;
const EMOJIS = ['😂', '😡', '😭', '👏', '🔥', '😎', '🤯', '❤️'];

const rid = () => Math.random().toString(36).slice(2, 9);
const mod = (a, n) => ((a % n) + n) % n;
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c;
  do { c = Array.from({ length: 4 }, () => A[Math.random() * A.length | 0]).join(''); } while (rooms.has(c));
  return c;
}
function buildDeck() {
  const d = []; let id = 0;
  const add = (color, v) => d.push({ id: id++, color, v });
  for (const c of COLORS) {
    add(c, '0');
    for (let i = 0; i < 2; i++) { for (let n = 1; n <= 9; n++) add(c, String(n)); add(c, 'skip'); add(c, 'reverse'); add(c, 'draw2'); }
  }
  for (let i = 0; i < 4; i++) { add('wild', 'wild'); add('wild', 'wild4'); }
  return shuffle(d);
}
function cname(c) {
  const v = { skip: 'منع', reverse: 'عكس', draw2: '+٢', wild: 'ملوّن', wild4: '+٤ ملوّن' }[c.v] || c.v;
  return c.color === 'wild' ? v : `${v} ${AR[c.color]}`;
}

const newRoom = code => ({ code, phase: 'lobby', players: [], host: null, deck: [], discard: [], color: null, dir: 1, turn: 0, pending: null, catchable: null, log: [], winner: null, chat: [], teams: false, score: [0, 0], winTeam: null });
const cur = r => r.players[r.turn];
const log = (r, s) => { r.log.push(s); if (r.log.length > 30) r.log.shift(); };

function canPlay(r, p, c) {
  if (r.pending !== null && c.id !== r.pending) return false;
  const top = r.discard[r.discard.length - 1];
  if (c.v === 'wild4') return !p.hand.some(x => x.color === r.color); // الرسمي: ما تلعبها إلا ما عندك لون الطاولة
  if (c.v === 'wild') return true;
  return c.color === r.color || c.v === top.v;
}
function drawCards(r, p, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    if (!r.deck.length) {
      const top = r.discard.pop();
      r.deck = shuffle(r.discard); r.discard = [top];
    }
    if (!r.deck.length) break;
    const c = r.deck.pop(); p.hand.push(c); out.push(c);
  }
  if (p.hand.length > 1) p.uno = false;
  return out;
}
function advance(r, steps) {
  r.turn = mod(r.turn + r.dir * steps, r.players.length);
  r.pending = null;
}

// وضع الفرق يحتاج ٤ أو ٦ لاعبين، والفريق = رقم المقعد زوجي/فردي (يتناوبون بالجلوس)
function fixTeams(r) { if (r.teams && !(r.players.length >= 4 && r.players.length % 2 === 0)) r.teams = false; }

function start(r) {
  fixTeams(r);
  r.deck = buildDeck(); r.discard = []; r.dir = 1; r.pending = null; r.catchable = null; r.winner = null; r.winTeam = null; r.log = [];
  r.players.forEach(p => { p.hand = []; p.uno = false; });
  for (let i = 0; i < 7; i++) r.players.forEach(p => p.hand.push(r.deck.pop()));
  let c;
  while (true) { c = r.deck.pop(); if (/^\d$/.test(c.v)) break; r.deck.unshift(c); }
  r.discard.push(c); r.color = c.color;
  r.turn = Math.random() * r.players.length | 0;
  r.phase = 'play';
  log(r, 'بدأت اللعبة');
}

function play(r, p, id, color) {
  if (r.phase !== 'play' || cur(r) !== p) return;
  const card = p.hand.find(c => c.id === id);
  if (!card || !canPlay(r, p, card)) return;
  if (card.color === 'wild' && !COLORS.includes(color)) return;
  p.hand.splice(p.hand.indexOf(card), 1);
  r.discard.push(card); r.pending = null; r.catchable = null;
  r.color = card.color === 'wild' ? color : card.color;
  log(r, `${p.name} لعب ${cname(card)}${card.color === 'wild' ? ' واختار ' + AR[color] : ''}`);

  const n = r.players.length;
  let steps = 1;
  if (card.v === 'reverse') { r.dir *= -1; if (n === 2) steps = 2; } // مع لاعبين العكس يعمل مثل المنع
  if (card.v === 'skip') { steps = 2; log(r, `${r.players[mod(r.turn + r.dir, n)].name} انمنع`); }
  if (card.v === 'draw2' || card.v === 'wild4') {
    const v = r.players[mod(r.turn + r.dir, n)];
    const k = card.v === 'draw2' ? 2 : 4;
    drawCards(r, v, k); steps = 2;
    log(r, `${v.name} سحب ${k} وانمنع`);
  }
  if (p.hand.length === 0) {
    r.phase = 'over'; r.winner = p.name;
    if (r.teams) { r.winTeam = r.players.indexOf(p) % 2; r.score[r.winTeam]++; }
    log(r, `${p.name} خلّص أوراقه`);
    return;
  }
  if (p.hand.length === 1 && !p.uno) r.catchable = p.id;
  advance(r, steps);
}
function draw(r, p) {
  if (r.phase !== 'play' || cur(r) !== p || r.pending !== null) return;
  r.catchable = null;
  const [c] = drawCards(r, p, 1);
  log(r, `${p.name} سحب ورقة`);
  if (c && canPlay(r, p, c)) r.pending = c.id; else advance(r, 1);
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

function view(r, p) {
  const c = r.phase === 'lobby' ? null : cur(r);
  const mine = !!c && c.id === p.id && r.phase === 'play';
  return {
    t: 'state', code: r.code, phase: r.phase, me: p.id,
    players: r.players.map((q, i) => ({ id: q.id, name: q.name, n: q.hand.length, on: q.online, h: q.id === r.host, tm: r.teams ? i % 2 : null })),
    teams: r.teams, score: r.score, winTeam: r.winTeam,
    hand: p.hand, top: r.discard[r.discard.length - 1] || null, color: r.color, dir: r.dir,
    turn: c ? c.id : null, deck: r.deck.length,
    ok: mine ? p.hand.filter(x => canPlay(r, p, x)).map(x => x.id) : [],
    pending: mine ? r.pending : null,
    catch: r.catchable, log: r.log.slice(-4), winner: r.winner
  };
}
function send(ws, o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
function cast(r, o) { r.players.forEach(p => p.online && send(p.ws, o)); }
const rate = (p, k, ms) => { const n = Date.now(); if (p['_' + k] && n - p['_' + k] < ms) return false; p['_' + k] = n; return true; };
function broadcast(r) { r.players.forEach(p => p.online && send(p.ws, view(r, p))); }

// لو دور لاعب انقطع نتصرف عنه بعد ثانيتين عشان اللعبة ما توقف
function after(r) {
  if (r.phase === 'lobby') fixTeams(r);
  broadcast(r);
  if (r.phase !== 'play') return;
  const p = cur(r);
  if (p.online) return;
  setTimeout(() => {
    if (r.phase !== 'play' || cur(r) !== p || p.online) return;
    draw(r, p); if (cur(r) === p && r.pending !== null) pass(r, p);
    after(r);
  }, 2000);
}

function addPlayer(r, name) {
  const p = { id: rid().slice(0, 5), token: rid() + rid(), name, ws: null, hand: [], uno: false, online: true };
  r.players.push(p); if (!r.host) r.host = p.id;
  return p;
}
function removePlayer(r, p) {
  r.players = r.players.filter(q => q !== p);
  if (!r.players.length) return rooms.delete(r.code);
  if (r.host === p.id) r.host = r.players[0].id;
  after(r);
}
const cleanName = s => String(s || '').trim().slice(0, 14) || 'لاعب';

function join(ws, m) {
  const r = rooms.get(String(m.code || '').toUpperCase().trim());
  if (!r) return send(ws, { t: 'err', msg: 'الغرفة غير موجودة', reset: true });
  let p = m.token && r.players.find(q => q.token === m.token);
  if (p) {
    if (p.ws && p.ws !== ws) { p.ws.ctx = null; try { p.ws.close(); } catch {} }
    p.ws = ws; p.online = true;
  } else {
    if (r.phase !== 'lobby') return send(ws, { t: 'err', msg: 'اللعبة بدأت، انتظر الجولة الجاية' });
    if (r.players.length >= MAX) return send(ws, { t: 'err', msg: 'الغرفة ممتلئة (٦ لاعبين)' });
    p = addPlayer(r, cleanName(m.name)); p.ws = ws;
  }
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
  let p = r.players.find(q => q.uid === u.id);
  if (p) {
    if (p.ws && p.ws !== ws) { p.ws.ctx = null; try { p.ws.close(); } catch {} }
    p.ws = ws; p.online = true;
  } else {
    if (r.phase !== 'lobby') return send(ws, { t: 'err', msg: 'اللعبة بدأت، انتظر الجولة الجاية' });
    if (r.players.length >= MAX) return send(ws, { t: 'err', msg: 'الغرفة ممتلئة (٦ لاعبين)' });
    p = addPlayer(r, cleanName(u.global_name || u.username)); p.uid = u.id; p.ws = ws;
  }
  ws.ctx = { r, p };
  send(ws, { t: 'joined', code: r.code, token: '', name: p.name });
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
  let p = r.players.find(q => q.uid === u.id);
  if (p) {
    if (p.ws && p.ws !== ws) { p.ws.ctx = null; try { p.ws.close(); } catch {} }
    p.ws = ws; p.online = true;
  } else {
    if (r.phase !== 'lobby') return send(ws, { t: 'err', msg: 'اللعبة بدأت، انتظر الجولة الجاية' });
    if (r.players.length >= MAX) return send(ws, { t: 'err', msg: 'الغرفة ممتلئة (٦ لاعبين)' });
    p = addPlayer(r, cleanName(u.global_name || u.username)); p.uid = u.id; p.ws = ws;
  }
  ws.ctx = { r, p };
  send(ws, { t: 'joined', code: r.code, token: '', name: p.name });
  after(r);
}

wss.on('connection', ws => {
  ws.dead = false;
  ws.on('pong', () => { ws.dead = false; });
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'create') {
      const r = newRoom(newCode());
      rooms.set(r.code, r);
      const p = addPlayer(r, cleanName(m.name)); p.ws = ws; ws.ctx = { r, p };
      send(ws, { t: 'joined', code: r.code, token: p.token, name: p.name });
      return after(r);
    }
    if (m.t === 'join') return join(ws, m);
    if (m.t === 'activity') return activity(ws, m);
    const c = ws.ctx; if (!c) return;
    const { r, p } = c;
    switch (m.t) {
      case 'start': if (r.host === p.id && r.phase === 'lobby' && r.players.length >= MIN) start(r); break;
      case 'play': play(r, p, m.id, m.color); break;
      case 'emoji':
        if (EMOJIS.includes(m.e) && rate(p, 'e', 700)) cast(r, { t: 'react', from: p.id, e: m.e });
        return;
      case 'chat': {
        const text = String(m.text || '').trim().slice(0, 120);
        if (text && rate(p, 'c', 500)) {
          const msg = { from: p.id, name: p.name, text };
          r.chat.push(msg); if (r.chat.length > 30) r.chat.shift();
          cast(r, { t: 'chat', ...msg });
        }
        return;
      }
      case 'teams':
        if (r.host === p.id && r.phase === 'lobby') { r.teams = !!m.on && r.players.length >= 4 && r.players.length % 2 === 0; r.score = [0, 0]; }
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
          r.phase = 'lobby'; r.winner = null; r.winTeam = null; r.log = [];
        }
        break;
      case 'leave':
        ws.ctx = null; send(ws, { t: 'left' });
        if (r.phase === 'lobby') return removePlayer(r, p);
        p.online = false; p.ws = null; break;
    }
    after(r);
  });
  ws.on('close', () => {
    const c = ws.ctx; if (!c || c.p.ws !== ws) return;
    const { r, p } = c;
    p.online = false; p.ws = null;
    if (r.phase === 'lobby') return removePlayer(r, p);
    if (r.players.every(q => !q.online)) setTimeout(() => { if (r.players.every(q => !q.online)) rooms.delete(r.code); }, 10 * 60 * 1000);
    after(r);
  });
});

setInterval(() => wss.clients.forEach(w => { if (w.dead) return w.terminate(); w.dead = true; w.ping(); }), 30000);
server.listen(PORT, () => console.log(`ترتيب شغّال على http://localhost:${PORT}`));
