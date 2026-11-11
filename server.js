// ترتيب — سيرفر الألعاب (أونو)
// تشغيل: npm install ثم npm start ثم افتح http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.mp3': 'audio/mpeg' };

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
    const ext = path.extname(f);
    if (p === '/index.html') { const o = (req.headers['x-forwarded-proto'] || 'http').split(',')[0] + '://' + req.headers.host; d = Buffer.from(d.toString('utf8').replace('content="icons/og.png"', `content="${o}/icons/og.png"`)); }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ['.woff2', '.png', '.ico', '.mp3'].includes(ext) ? 'public, max-age=604800' : 'no-cache' });
    res.end(d);
  });
});

const wss = new WebSocketServer({ server });
const rooms = new Map();
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

// ---- الألعاب الثانية (غير أونو) ----
const H = {
  log: (r, s) => log(r, s), shuffle, rate: (p, k, ms) => rate(p, k, ms),
  win: (r, ps) => ps.forEach(p => { p.wins = (p.wins || 0) + 1; }),
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
for (const k of ['codes', 'hive', 'liars', 'outside', 'typing', 'jackaroo', 'draw', 'flip']) GAMES[k] = require('./games/' + k)(H);
const META = { uno: { bots: true }, codes: { teams: true }, hive: { teams: true, bots: true }, liars: { bots: true }, outside: { bots: true }, typing: { bots: true }, jackaroo: { teams: true, bots: true }, draw: {}, flip: { bots: true } };
const AVATARS = ['😎', '🦁', '🐪', '🦅', '🐺', '🦊', '🐯', '🐼', '🦄', '🐸', '👑', '🔥', '⚡', '🌙', '🎩', '🤠'];
const cleanAv = a => AVATARS.includes(a) ? a : '';
const optsView = (r, p) => ({ stack: !!r.opts.stack, turn: r.opts.turn || 15, lock: !!r.opts.lock, hasPass: !!r.opts.pass, pass: r.host === p.id ? (r.opts.pass || '') : null, target: r.opts.target || 5, nwords: r.opts.words ? r.opts.words.length : 0, wordsText: r.host === p.id ? (r.opts.wordsText || '') : '' });
const maxOf = r => GAMES[r.game].max;

const newRoom = (code, game = 'uno') => ({ code, game, g: null, opts: {}, owed: 0, botT: null, phase: 'lobby', players: [], host: null, deck: [], discard: [], color: null, dir: 1, turn: 0, pending: null, catchable: null, log: [], winner: null, chat: [], teams: false, score: [0, 0], winTeam: null, specs: [], recorded: false, banned: new Set(), turnSeq: 0, armed: -1, timer: null, deadline: 0 });
const cur = r => r.players[r.turn];
const log = (r, s) => { r.log.push(s); if (r.log.length > 30) r.log.shift(); };

function canPlay(r, p, c) {
  if (r.pending !== null && c.id !== r.pending) return false;
  const top = r.discard[r.discard.length - 1];
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
  r.pending = null; r.turnSeq++;
}

// وضع الفرق يحتاج عدد زوجي ٤ أو أكثر، والفريق = رقم المقعد زوجي/فردي (يتناوبون بالجلوس)
function fixTeams(r) { if (r.game !== 'uno') { r.teams = !!META[r.game].teams; return; } if (r.teams && !(r.players.length >= 4 && r.players.length % 2 === 0)) r.teams = false; }

function start(r) {
  fixTeams(r);
  r.deck = buildDeck(); r.discard = []; r.dir = 1; r.pending = null; r.catchable = null; r.winner = null; r.winTeam = null; r.log = []; r.recorded = false; r.owed = 0;
  r.players.forEach(p => { p.hand = []; p.uno = false; });
  for (let i = 0; i < 7; i++) r.players.forEach(p => p.hand.push(r.deck.pop()));
  let c;
  while (true) { c = r.deck.pop(); if (/^\d$/.test(c.v)) break; r.deck.unshift(c); }
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
  if ((card.v === 'draw2' || card.v === 'wild4') && r.opts.stack) {
    r.owed += card.v === 'draw2' ? 2 : 4;
    log(r, `السحب صار ${r.owed} — ورّد عليه بنفس النوع أو اسحب`);
  } else if (card.v === 'draw2' || card.v === 'wild4') {
    const v = r.players[mod(r.turn + r.dir, n)];
    const k = card.v === 'draw2' ? 2 : 4;
    drawCards(r, v, k); steps = 2;
    log(r, `${v.name} سحب ${k} وانمنع`);
  }
  if (p.hand.length === 0) {
    r.phase = 'over'; r.winner = p.name;
    if (r.teams) { r.winTeam = r.players.indexOf(p) % 2; r.score[r.winTeam]++; }
    log(r, `${p.name} خلّص أوراقه`);
    recordGame(r, p);
    return;
  }
  if (p.hand.length === 1 && !p.uno) r.catchable = p.id;
  advance(r, steps);
}
function draw(r, p) {
  if (r.phase !== 'play' || cur(r) !== p || r.pending !== null) return;
  r.catchable = null;
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

function view(r, p) {
  if (r.game !== 'uno') {
    return {
      t: 'state', game: r.game, min: GAMES[r.game].min, max: maxOf(r), code: r.code, phase: r.phase, me: p.id, spec: !!p.spec, specs: r.specs.map(s => ({ id: s.id, name: s.name })),
      players: r.players.map((q, i) => ({ id: q.id, name: q.name, n: q.hand ? q.hand.length : 0, on: q.online, h: q.id === r.host, tm: r.phase === 'lobby' ? i % 2 : q.team, w: q.wins || 0, av: q.av || '', bot: !!q.bot })),
      opts: optsView(r, p), teams: !!META[r.game].teams, score: r.score, winTeam: r.winTeam, hand: [], top: null, color: null, dir: 1, turn: null, deck: 0,
      left: r.phase === 'play' && r.deadline ? Math.max(0, r.deadline - Date.now()) : 0, ok: [], pending: null, catch: null,
      log: r.log.slice(-4), winner: r.winner, g: r.phase === 'lobby' ? null : GAMES[r.game].view(r, p)
    };
  }
  const c = r.phase === 'lobby' ? null : cur(r);
  const mine = !!c && c.id === p.id && r.phase === 'play';
  return {
    t: 'state', game: 'uno', min: GAMES.uno.min, max: GAMES.uno.max, code: r.code, phase: r.phase, me: p.id, spec: !!p.spec, specs: r.specs.map(s => ({ id: s.id, name: s.name })),
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
function closeRoom(r) {
  clearTimeout(r.timer); clearTimeout(r.botT); rooms.delete(r.code);
  r.specs.forEach(s => { if (s.ws) { const w = s.ws; w.ctx = null; send(w, { t: 'left' }); } });
  r.specs = [];
}
// مقاعد فاضية في اللوبي: المتفرجين ينتقلون لاعبين
function fill(r) {
  if (r.phase !== 'lobby') return;
  while (r.players.length < maxOf(r) && r.specs.length) {
    const s = r.specs.shift(); s.spec = false;
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
  if (r.game === 'uno') return start(r);
  fixTeams(r); r.log = []; r.recorded = false; GAMES[r.game].start(r);
}

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
      const nw = ok.filter(c => c.color !== 'wild');
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
  if (r.game === 'typing') {
    const g = r.g; if (g.sub !== 'go') return null;
    return { d: 4000 + rnd(7000), fn() {
      if (g.sub !== 'go' || r.g !== g) return;
      GAMES.typing.act(r, bots[rnd(bots.length)], { t: 'type', text: g.text });
    } };
  }
  if (r.game === 'outside') {
    const g = r.g, words = require('./games/outside-words')[g.cat] || [], pickW = ex => { const ok = words.filter(w => w !== ex); return ok[rnd(ok.length)] || '؟'; };
    if (g.sub === 'ask') {
      const b = bots.find(q => q.id === g.asker); if (!b) return null;
      return { d: 1800 + rnd(2500), fn() { if (r.g !== g || g.sub !== 'ask' || g.asker !== b.id) return; const o = GAMES.outside.view(r, b).canAsk || []; if (o.length) GAMES.outside.act(r, b, { t: 'ask', id: o[rnd(o.length)] }); } };
    }
    if (g.sub === 'qa') {
      const b = bots.find(q => q.id === g.target); if (!b) return null;
      return { d: 3500 + rnd(3500), fn() { if (r.g === g && g.sub === 'qa' && g.target === b.id) GAMES.outside.act(r, b, { t: 'done' }); } };
    }
    if (g.sub === 'vote') {
      const b = bots.find(q => !g.votes[q.id]); if (!b) return null;
      return { d: 2500 + rnd(5000), fn() { if (r.g !== g || g.sub !== 'vote' || g.votes[b.id]) return; const o = r.players.filter(q => q.id !== b.id); GAMES.outside.act(r, b, { t: 'vote', id: o[rnd(o.length)].id }); } };
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
  if (r.botT || r.phase !== 'play') return;
  const a = botAction(r); if (!a) return;
  r.botT = setTimeout(() => { r.botT = null; if (rooms.get(r.code) !== r || r.phase !== 'play') return; a.fn(); after(r); }, a.d);
}

function after(r) {
  if (!r.players.length) return;
  if (r.phase === 'lobby') { fill(r); fixTeams(r); }
  if (r.game === 'uno' && r.phase === 'play' && r.armed !== r.turnSeq) { r.armed = r.turnSeq; armTurn(r); }
  else if (r.phase !== 'play') clearTimeout(r.timer);
  broadcast(r);
  botTurn(r);
  if (r.phase !== 'play' || r.game !== 'uno') return;
  const p = cur(r);
  if (p.online) return;
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

function join(ws, m) {
  const r = rooms.get(String(m.code || '').toUpperCase().trim());
  if (!r) return send(ws, { t: 'err', msg: 'الغرفة غير موجودة', reset: true });
  const known = m.token && r.players.some(q => q.token === m.token);
  if (!known && r.banned.has('ip:' + ws.ip)) return send(ws, { t: 'err', msg: 'تم طردك من هذي الغرفة' });
  if (!known && r.opts.pass && String(m.pass || '') !== r.opts.pass) return send(ws, { t: 'err', msg: m.pass ? 'كلمة السر غلط' : 'الغرفة محمية بكلمة سر', needpass: true });
  let p = m.token && r.players.find(q => q.token === m.token);
  if (p) {
    if (p.ws && p.ws !== ws) { p.ws.ctx = null; try { p.ws.close(); } catch {} }
    p.ws = ws; p.online = true;
  } else {
    p = admit(ws, r, cleanName(m.name), { av: cleanAv(m.av) });
    if (!p) return;
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

wss.on('connection', (ws, req) => {
  ws.ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  ws.dead = false;
  ws.on('pong', () => { ws.dead = false; });
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'create') {
      const r = newRoom(newCode(), GAMES[m.game] ? m.game : 'uno');
      rooms.set(r.code, r);
      const p = addPlayer(r, cleanName(m.name), cleanAv(m.av)); p.ws = ws; ws.ctx = { r, p };
      send(ws, { t: 'joined', code: r.code, token: p.token, name: p.name });
      return after(r);
    }
    if (m.t === 'join') return join(ws, m);
    if (m.t === 'activity') return activity(ws, m);
    const c = ws.ctx; if (!c) return;
    const { r, p } = c;
    if (p.spec && !['chat', 'emoji', 'leave'].includes(m.t)) return; // المتفرّج يشوف ويسولف بس
    if (r.game !== 'uno' && !['start', 'teams', 'shuffle', 'again', 'leave', 'kick', 'chat', 'emoji', 'setgame', 'opt', 'addbot'].includes(m.t)) { if (GAMES[r.game].act(r, p, m) === 'quiet') return; return after(r); }
    switch (m.t) {
      case 'start': if (r.host === p.id && r.phase === 'lobby' && r.players.length >= GAMES[r.game].min) startGame(r); break;
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
        else if (k === 'turn' && r.game === 'uno' && [10, 15, 25, 40].includes(+v)) r.opts.turn = +v;
        else if (k === 'target' && r.game === 'typing' && [3, 5, 8, 12].includes(+v)) r.opts.target = +v;
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
          const bp = addPlayer(r, 'بوت ' + (r.players.filter(q => q.bot).length + 1), '🤖'); bp.bot = true;
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
        if (r.host !== p.id) return;
        const sp = r.specs.find(q => q.id === m.id);
        const t = sp || r.players.find(q => q.id === m.id);
        if (!t || t === p) return;
        if (t.ws && t.ws.ip) r.banned.add('ip:' + t.ws.ip);
        if (t.uid) r.banned.add('uid:' + t.uid);
        if (t.ws) { const tw = t.ws; tw.ctx = null; send(tw, { t: 'kicked' }); }
        if (sp) { r.specs = r.specs.filter(q => q !== sp); break; }
        if (r.phase === 'lobby') return removePlayer(r, t);
        leaveGame(r, t); break;
      }
    }
    after(r);
  });
  ws.on('close', () => {
    const c = ws.ctx; if (!c || c.p.ws !== ws) return;
    const { r, p } = c;
    p.online = false; p.ws = null;
    if (p.spec) { r.specs = r.specs.filter(q => q !== p); return broadcast(r); }
    if (r.phase === 'lobby') return removePlayer(r, p);
    if (r.players.every(q => !q.online)) setTimeout(() => { if (r.players.every(q => !q.online)) rooms.delete(r.code); }, 10 * 60 * 1000);
    after(r);
  });
});

setInterval(() => wss.clients.forEach(w => { if (w.dead) return w.terminate(); w.dead = true; w.ping(); }), 30000);
server.listen(PORT, () => console.log(`ترتيب شغّال على http://localhost:${PORT}`));
