// ====== غيّر هذا الرابط لرابط دعوة ديسكورد ترتيب ======
const DISCORD_URL = 'https://discord.gg/xxVUG2ZdFP';
// =====================================================

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const HEX = { red: '#e8362d', yellow: '#ffc928', green: '#1fa35c', blue: '#2a5bd7' };
const SYM = { skip: '⊘', reverse: '⇄', draw2: '+2', wild: '', wild4: '+4' };
const CORDER = { red: 0, yellow: 1, green: 2, blue: 3, wild: 4 };

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const IN_DISCORD = new URLSearchParams(location.search).has('frame_id'); // ديسكورد يضيف frame_id لما تفتح اللعبة داخله
let session = IN_DISCORD ? {} : (store.get('tarteeb-session') || {});
let activityHello = null;
let S = null, ws, queue = [], wildId = null;

$$('[data-discord]').forEach(a => a.href = DISCORD_URL);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400); }

// ---------- الاتصال ----------
function connect() {
  ws = new WebSocket(IN_DISCORD ? `wss://${location.host}/.proxy/ws` : (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => {
    if (activityHello) ws.send(JSON.stringify(activityHello));
    else if (session.code && session.token) ws.send(JSON.stringify({ t: 'join', ...session }));
    while (queue.length) ws.send(JSON.stringify(queue.shift()));
  };
  ws.onmessage = e => on(JSON.parse(e.data));
  ws.onclose = () => { if (S) toast('انقطع الاتصال… نرجع نتصل'); setTimeout(connect, 1500); };
}
function send(o) { ws && ws.readyState === 1 ? ws.send(JSON.stringify(o)) : queue.push(o); }

function on(m) {
  if (m.t === 'joined') {
    if (IN_DISCORD) return;
    session = { code: m.code, token: m.token, name: m.name };
    store.set('tarteeb-session', session);
    history.replaceState(null, '', location.pathname);
  } else if (m.t === 'err') {
    toast(m.msg);
    if (m.reset) reset();
  } else if (m.t === 'left') {
    reset();
  } else if (m.t === 'state') {
    S = m; render();
  }
}
function reset() { session = {}; store.set('tarteeb-session', {}); S = null; render(); }

// ---------- الرئيسية ----------
const nameEl = $('#name'), codeEl = $('#code');
nameEl.value = store.get('tarteeb-name') || '';
const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) codeEl.value = urlRoom.slice(0, 4).toUpperCase();

function myName() { const n = nameEl.value.trim(); if (n) store.set('tarteeb-name', n); return n; }
$('#create').onclick = () => {
  const name = myName(); if (!name) { toast('اكتب اسمك أول'); return nameEl.focus(); }
  session = {}; send({ t: 'create', name });
};
$('#join').onclick = () => {
  const name = myName(); if (!name) { toast('اكتب اسمك أول'); return nameEl.focus(); }
  const code = codeEl.value.trim().toUpperCase();
  if (code.length !== 4) { toast('الكود أربع خانات'); return codeEl.focus(); }
  session = {}; send({ t: 'join', name, code });
};
codeEl.addEventListener('keydown', e => e.key === 'Enter' && $('#join').click());
nameEl.addEventListener('keydown', e => e.key === 'Enter' && (codeEl.value.trim() ? $('#join') : $('#create')).click());

// ---------- اللوبي ----------
$('#copy').onclick = async () => {
  const link = `${location.origin}/?room=${S.code}`;
  try { await navigator.clipboard.writeText(link); toast('اننسخ الرابط، ارسله في الديسكورد'); }
  catch { toast('الكود: ' + S.code); }
};
$('#start').onclick = () => send({ t: 'start' });
$('#leave').onclick = $('#leave2').onclick = () => send({ t: 'leave' });
$('#again').onclick = () => send({ t: 'again' });

function renderLobby() {
  const host = S.players.find(p => p.h);
  $('#roomcode').textContent = S.code;
  $('#pcount').textContent = `(${S.players.length}/6)`;
  $('#plist').innerHTML = S.players.map(p =>
    `<li class="${p.on ? '' : 'off'}">${esc(p.name)}${p.id === S.me ? ' <em>(أنت)</em>' : ''}${p.h ? '<span class="crown">المضيف</span>' : ''}</li>`
  ).join('');
  const isHost = host && host.id === S.me, enough = S.players.length >= 2;
  $('#start').hidden = !isHost;
  $('#start').disabled = !enough;
  $('#hint').textContent = !enough ? 'نحتاج لاعبين اثنين على الأقل، انتظر أحد يدخل'
    : isHost ? 'كل شي جاهز، ابدأ متى ما تبي' : 'ننتظر المضيف يبدأ اللعبة';
}

// ---------- الكروت ----------
function cardEl(c, tag = 'div') {
  const el = document.createElement(tag);
  const lab = /^\d$/.test(c.v) ? c.v : SYM[c.v];
  el.className = 'card ' + c.color;
  el.innerHTML = `<span class="tl">${lab}</span><span class="mid"><span>${lab}</span></span><span class="br">${lab}</span>`;
  return el;
}
function backEl() {
  const el = document.createElement('div');
  el.className = 'card back';
  el.innerHTML = '<span class="mid"><span>UNO</span></span>';
  return el;
}
const vrank = v => /^\d$/.test(v) ? +v : 10 + ['skip', 'reverse', 'draw2', 'wild', 'wild4'].indexOf(v);

// ---------- اللعبة ----------
function playCard(c) {
  if (c.color === 'wild') { wildId = c.id; $('#colorModal').hidden = false; }
  else send({ t: 'play', id: c.id });
}
$$('#colorModal [data-c]').forEach(b => b.onclick = () => {
  $('#colorModal').hidden = true;
  if (wildId !== null) send({ t: 'play', id: wildId, color: b.dataset.c });
  wildId = null;
});
$('#colorModal').addEventListener('click', e => { if (e.target.id === 'colorModal') { e.currentTarget.hidden = true; wildId = null; } });
$('#deck').onclick = () => { if (S.turn === S.me && S.phase === 'play' && S.pending === null) send({ t: 'draw' }); else if (S.turn === S.me && S.pending !== null) toast('لعب الورقة اللي سحبتها أو مرّر'); };
$('#unoBtn').onclick = () => send({ t: 'uno' });
$('#pass').onclick = () => send({ t: 'pass' });
$('#catch').onclick = () => send({ t: 'catch' });

function renderGame() {
  const playing = S.phase === 'play', mine = playing && S.turn === S.me;

  // الخصوم بترتيب الجلوس بعدي
  const i = S.players.findIndex(p => p.id === S.me), n = S.players.length;
  const others = Array.from({ length: n - 1 }, (_, k) => S.players[(i + 1 + k) % n]);
  $('#opps').innerHTML = others.map(p =>
    `<div class="opp ${p.id === S.turn && playing ? 'turn' : ''} ${p.on ? '' : 'off'}"><span>${esc(p.name)}</span><span class="n">${p.n}</span></div>`
  ).join('');

  // الطاولة
  const deck = $('#deck'); deck.innerHTML = ''; deck.appendChild(backEl());
  deck.insertAdjacentHTML('beforeend', `<small>${S.deck}</small>`);
  const disc = $('#discard'); disc.innerHTML = ''; if (S.top) disc.appendChild(cardEl(S.top));
  $('#ring').style.background = HEX[S.color] || '#555';

  const t = $('#turn');
  t.className = 'turn' + (mine ? ' mine' : '');
  t.textContent = !playing ? '' : mine ? (S.pending !== null ? 'تقدر تلعب الورقة اللي سحبتها' : 'دورك!') : `دور ${S.players.find(p => p.id === S.turn)?.name || ''}`;
  $('#log').innerHTML = S.log.slice(-2).map(esc).join('<br>');

  // الأزرار
  const me = S.players[i];
  $('#unoBtn').hidden = !(playing && S.hand.length <= 2);
  $('#pass').hidden = !(mine && S.pending !== null);
  $('#catch').hidden = !(playing && S.catch && S.catch !== S.me);

  // يدي
  const hand = $('#hand'); hand.innerHTML = '';
  [...S.hand].sort((a, b) => CORDER[a.color] - CORDER[b.color] || vrank(a.v) - vrank(b.v)).forEach(c => {
    const el = cardEl(c, 'button');
    if (mine) {
      const ok = S.ok.includes(c.id);
      el.classList.add(ok ? 'ok' : 'no');
      el.onclick = () => ok ? playCard(c) : toast('ما تنفع الحين');
    }
    hand.appendChild(el);
  });

  // نهاية الجولة
  const over = S.phase === 'over';
  $('#over').hidden = !over;
  if (over) {
    $('#winner').textContent = S.winner === me.name && S.hand.length === 0 ? 'فزت! 🎉' : `فاز ${S.winner}`;
    const host = S.players.find(p => p.h);
    $('#again').hidden = !(host && host.id === S.me);
    $('#waitHost').hidden = !$('#again').hidden;
  }
}

function render() {
  const ph = !S ? (IN_DISCORD ? 'connecting' : 'home') : S.phase === 'lobby' ? 'lobby' : 'game';
  ['home', 'connecting', 'lobby', 'game'].forEach(id => $('#' + id).hidden = id !== ph);
  document.body.classList.toggle('ingame', ph === 'game');
  if (ph !== 'game') $('#colorModal').hidden = true;
  if (ph === 'lobby') renderLobby();
  if (ph === 'game') renderGame();
}

// ---------- وضع ديسكورد Activity ----------
async function startActivity() {
  document.body.classList.add('activity');
  const msg = $('#connecting h2');
  try {
    await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'discord-sdk.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    const clientId = location.hostname.split('.')[0]; // العنوان داخل ديسكورد: <ApplicationID>.discordsays.com
    const sdk = new window.DiscordSDK(clientId);
    await sdk.ready();
    const { code } = await sdk.commands.authorize({ client_id: clientId, response_type: 'code', state: '', prompt: 'none', scope: ['identify'] });
    const r = await fetch('/.proxy/api/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const { access_token } = await r.json();
    if (!access_token) throw new Error('no token');
    await sdk.commands.authenticate({ access_token });
    activityHello = { t: 'activity', room: sdk.instanceId, token: access_token };
    connect();
  } catch (e) {
    console.error(e);
    msg.textContent = 'ما قدرنا نربط مع الديسكورد، جرّب تعيد تشغيل اللعبة';
  }
}

render();
IN_DISCORD ? startActivity() : connect();
