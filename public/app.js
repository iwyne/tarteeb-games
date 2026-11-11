// ====== غيّر هذا الرابط لرابط دعوة ديسكورد ترتيب ======
// ====== رابط موقع الدعم (اتركه فاضي لين تجهز الموقع) ======
const SUPPORT_URL = '';
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
let S = null, prevS = null, ws, queue = [], wildId = null;

$$('[data-discord]').forEach(a => a.href = DISCORD_URL);
$$('[data-support]').forEach(a => {
  if (SUPPORT_URL) a.href = SUPPORT_URL;
  else a.onclick = e => { e.preventDefault(); toast('رابط الدعم ما انضاف بعد'); };
});
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
  } else if (m.t === 'kicked') {
    toast('طردك المضيف من الغرفة'); reset();
  } else if (m.t === 'chathist') {
    chatLog = m.list || []; if (!$('#chatbox').hidden) drawMsgs();
  } else if (m.t === 'chat') {
    chatLog.push(m); if (chatLog.length > 30) chatLog.shift();
    showBubble(m.from, m.text);
    if (!$('#chatbox').hidden) drawMsgs();
    else if (S && m.from !== S.me) { unread++; badge(); sfx('pop'); }
  } else if (m.t === 'react') {
    showReact(m.from, m.e);
  } else if (m.t === 'state') {
    m.t0 = Date.now(); prevS = S; S = m; render();
  }
}
function reset() { session = {}; store.set('tarteeb-session', {}); S = null; prevS = null; render(); }

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
$('#teamBtn').onclick = () => send({ t: 'teams', on: !S.teams });
$('#shuffleBtn').onclick = () => send({ t: 'shuffle' });
$('#leave').onclick = $('#leave2').onclick = () => send({ t: 'leave' });
$('#again').onclick = () => send({ t: 'again' });

function renderLobby() {
  const host = S.players.find(p => p.h);
  const amHost = !!host && host.id === S.me;
  $('#roomcode').textContent = S.code;
  $('#pcount').textContent = `(${S.players.length}/6)`;
  const plist = S.teams ? [...S.players].sort((a, b) => a.tm - b.tm) : S.players;
  $('#plist').innerHTML = plist.map(p =>
    `<li data-id="${p.id}" class="${p.on ? '' : 'off'}${S.teams ? ' t' + p.tm : ''}">${esc(p.name)}${S.teams ? `<span class="tag">فريق ${['أ', 'ب'][p.tm]}</span>` : ''}${p.id === S.me ? ' <em>(أنت)</em>' : ''}${p.h ? '<span class="crown">المضيف</span>' : ''}${amHost && !p.h && p.id !== S.me ? `<button class="kick" data-id="${p.id}" title="طرد">✕</button>` : ''}</li>`
  ).join('');
  const isHost = host && host.id === S.me, enough = S.players.length >= 2;
  $('#start').hidden = !isHost;
  $('#start').disabled = !enough;
  $('#hint').textContent = !enough ? 'نحتاج لاعبين اثنين على الأقل، انتظر أحد يدخل'
    : isHost ? 'كل شي جاهز، ابدأ متى ما تبي' : 'ننتظر المضيف يبدأ اللعبة';
  renderTeams(isHost);
}
function renderTeams(isHost) {
  const can = S.players.length >= 4 && S.players.length % 2 === 0;
  $('#teamrow').hidden = !isHost;
  const tb = $('#teamBtn');
  tb.textContent = S.teams ? 'وضع الفرق: مفعّل ✓' : can ? 'وضع الفرق: مطفي' : 'وضع الفرق (يحتاج ٤ أو ٦ لاعبين)';
  tb.disabled = !S.teams && !can;
  $('#shuffleBtn').hidden = !S.teams;
  const sl = $('#scoreline');
  sl.hidden = !(S.teams && S.score[0] + S.score[1] > 0);
  sl.textContent = `النتيجة — فريق أ ${S.score[0]} : ${S.score[1]} فريق ب`;
  if (S.teams) $('#hint').textContent += ' — الفرق تتناوب بالجلوس: لاعب منكم ولاعب منهم';
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

const PAL = ['#e8362d', '#2a5bd7', '#1fa35c', '#ffc928'], TC = ['#e8362d', '#2a5bd7'];
function renderGame() {
  const playing = S.phase === 'play', mine = playing && S.turn === S.me;
  const i = S.players.findIndex(p => p.id === S.me), n = S.players.length, m = n - 1;
  const myTm = S.players[i].tm;
  const amHost = S.players.some(p => p.h && p.id === S.me);

  // الخصوم يجلسون على قوس الطاولة: اللي بعدي على يساري، وآخرهم على يميني
  const others = Array.from({ length: m }, (_, k) => S.players[(i + 1 + k) % n]);
  $('#opps').innerHTML = others.map((p, k) => {
    const a = Math.PI * (k + 1) / (m + 1);
    const x = 50 - 40 * Math.cos(a), y = 52 - 44 * Math.sin(a);
    const col = S.teams ? TC[p.tm] : PAL[S.players.indexOf(p) % 4];
    return `<div class="seat${p.id === S.turn && playing ? ' turn' : ''}${p.on ? '' : ' off'}" data-id="${p.id}" style="left:${x}%;top:${y}%">
      ${p.id === S.turn && playing ? '<div class="arrow"><b></b>▼</div>' : ''}${amHost ? `<button class="kick" data-id="${p.id}" title="طرد">✕</button>` : ''}<div class="avatar" style="background:${col};color:${col === '#ffc928' ? '#16130f' : '#fff'}">${esc([...p.name][0] || '?')}</div>
      <div class="nm">${esc(p.name)}</div>${S.teams ? `<span class="tm${p.tm === myTm ? ' mate' : ''}">${p.tm === myTm ? 'فريقك' : 'خصم'}</span>` : ''}<div class="backs">${'<i></i>'.repeat(Math.min(p.n, 8))}</div><span class="cnt">${p.n}</span></div>`;
  }).join('');

  // وسط الطاولة
  const deck = $('#deck'); deck.innerHTML = ''; deck.appendChild(backEl());
  deck.insertAdjacentHTML('beforeend', `<small>${S.deck}</small>`);
  deck.classList.toggle('can', mine && S.pending === null);
  const disc = $('#discard'); disc.innerHTML = ''; if (S.top) disc.appendChild(cardEl(S.top));
  disc.style.setProperty('--glow', HEX[S.color] || '#555');
  const sc = $('#score'); sc.hidden = !S.teams;
  if (S.teams) sc.innerHTML = `<span style="background:${TC[myTm]}">فريقك ${S.score[myTm]}</span><span style="background:${TC[1 - myTm]}">${S.score[1 - myTm]} الخصم</span>`;

  // ما عندك ورقة تنفع: كل شي يبهت إلا كومة السحب
  const must = mine && S.pending === null && S.ok.length === 0;
  $('.room').classList.toggle('mustdraw', must);
  $('#deck').classList.toggle('must', must);
  const t = $('#turn');
  t.className = 'turn' + (mine ? ' mine' : '') + (must ? ' warn' : '');
  t.innerHTML = !playing ? '' : must ? 'ما عندك ورقة تنفع، اسحب من الكومة! <span class="cd"></span>'
    : mine ? (S.pending !== null ? 'العب الورقة اللي سحبتها أو مرّر' : 'دورك!') + ' <span class="cd"></span>'
    : `دور ${esc(S.players.find(p => p.id === S.turn)?.name || '')} <span class="cd"></span>`;
  tick();
  $('#log').innerHTML = S.log.slice(-2).map(esc).join('<br>');

  // الأزرار
  $('#unoBtn').hidden = !(playing && S.hand.length <= 2);
  $('#pass').hidden = !(mine && S.pending !== null);
  $('#catch').hidden = !(playing && S.catch && S.catch !== S.me);

  // يدي على شكل مروحة
  const hand = $('#hand'); hand.innerHTML = '';
  const cards = [...S.hand].sort((a, b) => CORDER[a.color] - CORDER[b.color] || vrank(a.v) - vrank(b.v));
  const N = cards.length, cw = innerWidth < 760 ? 68 : 86;
  const sp = Math.min(cw * 0.72, ((hand.clientWidth || innerWidth) - cw - 20) / Math.max(N - 1, 1));
  const step = Math.min(5, 50 / Math.max(N, 1));
  cards.forEach((c, k) => {
    const el = cardEl(c, 'button'), d = k - (N - 1) / 2;
    el.dataset.id = c.id;
    el.style.marginLeft = (k ? sp - cw : 0) + 'px';
    el.style.setProperty('--r', d * step + 'deg');
    el.style.setProperty('--y', d * d * 1.6 + 'px');
    if (mine) {
      const ok = S.ok.includes(c.id);
      el.classList.add(ok ? 'ok' : 'no');
      el.onclick = () => ok ? playCard(c) : (sfx('nope'), toast('ما تنفع الحين'));
    }
    hand.appendChild(el);
  });
  hand.classList.toggle('mine', mine);
  fx();

  // نهاية الجولة
  const over = S.phase === 'over';
  $('#over').hidden = !over;
  if (over) {
    const me = S.players[i];
    const wt = $('#winteam');
    if (S.teams && S.winTeam != null) {
      $('#winner').textContent = S.winTeam === myTm ? 'فاز فريقك! 🎉' : 'فاز الفريق الخصم';
      wt.hidden = false; wt.textContent = 'الفائزين: ' + S.players.filter(p => p.tm === S.winTeam).map(p => p.name).join(' و ');
    } else {
      wt.hidden = true;
      $('#winner').textContent = S.winner === me.name && S.hand.length === 0 ? 'فزت! 🎉' : `فاز ${S.winner}`;
    }
    const host = S.players.find(p => p.h);
    $('#again').hidden = !(host && host.id === S.me);
    $('#waitHost').hidden = !$('#again').hidden;
  }
}

// ---------- الحركات والأصوات ----------
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const ctr = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
function fromDeck(el, deck, delay = 0) {
  const c = ctr(el);
  el.animate([{ translate: `${deck.x - c.x}px ${deck.y - c.y}px`, scale: .5, opacity: 0 }, { translate: '0 0', scale: 1, opacity: 1 }],
    { duration: 420, delay, easing: EASE, fill: 'backwards' });
}
function flyBack(from, to, delay = 0) {
  const b = backEl(); b.classList.add('fly');
  b.style.left = from.x - 20 + 'px'; b.style.top = from.y - 29 + 'px';
  document.body.appendChild(b);
  b.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(.8)`, opacity: .9 }],
    { duration: 380, delay, easing: EASE, fill: 'both' }).onfinish = () => b.remove();
}
function confetti() {
  const cols = ['#e8362d', '#ffc928', '#1fa35c', '#2a5bd7'];
  for (let i = 0; i < 40; i++) {
    const d = document.createElement('i'); d.className = 'confetti';
    d.style.cssText = `left:${Math.random() * 100}vw;top:-20px;width:10px;height:14px;background:${cols[i % 4]}`;
    document.body.appendChild(d);
    d.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(${innerHeight + 40}px) rotate(${360 + Math.random() * 540}deg)` }],
      { duration: 1800 + Math.random() * 1600, delay: Math.random() * 500, easing: 'ease-in', fill: 'backwards' }).onfinish = () => d.remove();
  }
}
function fx() {
  const p = prevS, s = S;
  if (!p || !s) return;
  const deck = ctr($('#deck')), cards = $$('#hand .card');
  const seatPos = id => { const e = document.querySelector(`.seat[data-id="${id}"]`); return e ? ctr(e) : null; };

  // بداية الجولة: توزيع الأوراق
  if (p.phase !== 'play' && s.phase === 'play') {
    cards.forEach((el, k) => { fromDeck(el, deck, k * 90); setTimeout(() => sfx('draw'), k * 90); });
    return;
  }
  if (p.phase !== 'play') return;

  // ورقة انلعبت: تطير من مكان اللاعب لورقة الرمي
  if (s.top && (!p.top || p.top.id !== s.top.id)) {
    const disc = $('#discard .card'), dc = ctr(disc);
    const src = p.turn === s.me ? { x: innerWidth / 2, y: innerHeight - 100 } : (seatPos(p.turn) || deck);
    disc.animate([{ translate: `${src.x - dc.x}px ${src.y - dc.y}px`, rotate: '-30deg', scale: .7 }, { translate: '0 0', rotate: '0deg', scale: 1 }], { duration: 400, easing: EASE });
    sfx('card');
    if (s.top.v === 'draw2' || s.top.v === 'wild4') setTimeout(() => sfx('penalty'), 260);
  }

  // سحب الخصوم: ظهر ورقة يطير من الكومة لمقعدهم
  s.players.forEach(q => {
    if (q.id === s.me) return;
    const pq = p.players.find(x => x.id === q.id), to = seatPos(q.id);
    if (!pq || !to || q.n <= pq.n) return;
    for (let i = 0; i < Math.min(q.n - pq.n, 4); i++) flyBack(deck, to, i * 110);
    sfx('draw');
  });

  // أوراقي الجديدة تطير من الكومة ليدي
  const had = new Set(p.hand.map(c => c.id));
  const fresh = cards.filter(el => !had.has(+el.dataset.id));
  fresh.forEach((el, k) => fromDeck(el, deck, k * 110));
  if (fresh.length) sfx('draw');

  if (s.phase === 'play' && s.turn === s.me && p.turn !== s.me) sfx('turn');
  const last = s.log[s.log.length - 1];
  if (last && last !== p.log[p.log.length - 1]) {
    if (last.includes('أونو!')) sfx('uno');
    else if (last.includes('مسك')) sfx('catch');
  }
  if (s.phase === 'over') {
    const mt = s.players.find(p => p.id === s.me)?.tm;
    const won = s.teams && s.winTeam != null ? s.winTeam === mt : s.hand.length === 0;
    setTimeout(() => { sfx(won ? 'win' : 'lose'); if (won) confetti(); }, 500);
  }
}

function render() {
  const ph = !S ? (IN_DISCORD ? 'connecting' : 'home') : S.phase === 'lobby' ? 'lobby' : 'game';
  ['home', 'connecting', 'lobby', 'game'].forEach(id => $('#' + id).hidden = id !== ph);
  document.body.classList.toggle('ingame', ph === 'game');
  $('#chatfab').hidden = !S;
  if (!S) { $('#chatbox').hidden = true; $('#emojiBar').hidden = true; chatLog = []; unread = 0; badge(); }
  if (ph !== 'game') $('#colorModal').hidden = true;
  if (ph === 'lobby') renderLobby();
  if (ph === 'game') renderGame();
}

// ---------- شات وتفاعل بالايموجي ----------
let chatLog = [], unread = 0;
const EMOJIS = ['😂', '😡', '😭', '👏', '🔥', '😎', '🤯', '❤️'];
$('#emojiBar').innerHTML = EMOJIS.map(e => `<button data-e="${e}">${e}</button>`).join('');
$('#emojiBtn').onclick = () => { $('#emojiBar').hidden = !$('#emojiBar').hidden; $('#chatbox').hidden = true; };
$$('#emojiBar button').forEach(b => b.onclick = () => { send({ t: 'emoji', e: b.dataset.e }); $('#emojiBar').hidden = true; });
function badge() { const u = $('#unread'); u.hidden = !unread; u.textContent = unread; }
function drawMsgs() {
  const box = $('#msgs');
  box.innerHTML = chatLog.map(m => `<div class="msg${S && m.from === S.me ? ' me' : ''}"><b>${esc(m.name)}:</b> ${esc(m.text)}</div>`).join('');
  box.scrollTop = box.scrollHeight;
}
function openChat(open) {
  $('#chatbox').hidden = !open; $('#emojiBar').hidden = true;
  if (open) { unread = 0; badge(); drawMsgs(); setTimeout(() => $('#chatin').focus(), 50); }
}
$('#chatBtn').onclick = () => openChat($('#chatbox').hidden);
function sendChat() { const t = $('#chatin').value.trim(); if (!t) return; send({ t: 'chat', text: t }); $('#chatin').value = ''; }
$('#chatsend').onclick = sendChat;
$('#chatin').addEventListener('keydown', e => e.key === 'Enter' && sendChat());
// ---------- مؤقت الدور (١٥ ثانية) ----------
let lastTick = -1;
function tick() {
  if (!S || S.phase !== 'play') return;
  const r = Math.max(0, Math.ceil((S.left - (Date.now() - S.t0)) / 1000));
  $$('.arrow b, #turn .cd').forEach(b => b.textContent = r);
  const urgent = r <= 5;
  $('#turn').classList.toggle('urgent', urgent);
  $$('.arrow').forEach(a => a.classList.toggle('urgent', urgent));
  if (S.turn === S.me && urgent && r > 0 && r !== lastTick) sfx('tick');
  lastTick = r;
}
setInterval(tick, 250);

// فقاعة رسالة فوق صاحبها
function showBubble(id, text) {
  document.querySelectorAll(`.bubble[data-id="${id}"]`).forEach(b => b.remove());
  const el = document.querySelector(`.seat[data-id="${id}"]`) || document.querySelector(`#plist li[data-id="${id}"]`);
  const pos = el ? ctr(el) : { x: innerWidth / 2, y: innerHeight - 190 };
  const b = document.createElement('div'); b.className = 'bubble'; b.dataset.id = id; b.textContent = text;
  b.style.left = Math.min(Math.max(pos.x, 120), innerWidth - 120) + 'px';
  b.style.top = (el ? pos.y - 85 : pos.y) + 'px';
  document.body.appendChild(b);
  b.animate([
    { transform: 'translate(-50%,-100%) scale(.3)', opacity: 0 },
    { transform: 'translate(-50%,-112%) scale(1.08)', opacity: 1, offset: .12 },
    { transform: 'translate(-50%,-100%) scale(1)', opacity: 1, offset: .8 },
    { transform: 'translate(-50%,-125%) scale(.95)', opacity: 0 }
  ], { duration: 4200, easing: 'ease-out' }).onfinish = () => b.remove();
}
// ايموجي يطلع فوق مقعد صاحبه ويطير
function showReact(id, e) {
  const el = document.querySelector(`.seat[data-id="${id}"]`) || document.querySelector(`#plist li[data-id="${id}"]`);
  const pos = el ? ctr(el) : { x: innerWidth / 2, y: innerHeight - 200 };
  const d = document.createElement('div'); d.className = 'react'; d.textContent = e;
  d.style.left = pos.x + 'px'; d.style.top = pos.y + 'px';
  document.body.appendChild(d);
  d.animate([
    { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
    { transform: 'translate(-50%,-90%) scale(1.7)', opacity: 1, offset: .25 },
    { transform: 'translate(-50%,-230%) scale(1.3) rotate(10deg)', opacity: 0 }
  ], { duration: 1900, easing: 'ease-out' }).onfinish = () => d.remove();
  sfx('pop');
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

$('#quit').onclick = () => { if (confirm('تبي تطلع من اللعبة؟')) send({ t: 'leave' }); };
document.addEventListener('click', e => {
  const k = e.target.closest('.kick'); if (!k || !S) return;
  const t = S.players.find(p => p.id === k.dataset.id);
  if (t && (IN_DISCORD || confirm(`تطرد ${t.name} من الغرفة؟`))) send({ t: 'kick', id: k.dataset.id });
});
const muteBtn = $('#mute');
muteBtn.textContent = sfx.on() ? '🔊' : '🔇';
muteBtn.onclick = () => { muteBtn.textContent = sfx.toggle() ? '🔊' : '🔇'; };

render();
IN_DISCORD ? startActivity() : connect();
