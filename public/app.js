// ====== غيّر هذا الرابط لرابط دعوة ديسكورد ترتيب ======
// ====== رابط موقع الدعم (اتركه فاضي لين تجهز الموقع) ======
const SUPPORT_URL = 'https://creators.sa/17mw';
const DISCORD_URL = 'https://discord.gg/xxVUG2ZdFP';
// =====================================================

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const HEX = { red: '#e8362d', yellow: '#ffc928', green: '#1fa35c', blue: '#2a5bd7', pink: '#ef6fae', teal: '#18a7a0', orange: '#f28a1c', purple: '#7b3fc7' };
const SYM = { skip: '⊘', reverse: '⇄', draw2: '+2', wild: '', wild4: '+4', draw1: '+1', draw5: '+5', skipall: '⊗', flip: '⟳', wd2: '+2', wdc: '+🎨' };
const CORDER = { red: 0, yellow: 1, green: 2, blue: 3, pink: 0, teal: 1, orange: 2, purple: 3, wild: 4 };

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const IN_DISCORD = new URLSearchParams(location.search).has('frame_id'); // ديسكورد يضيف frame_id لما تفتح اللعبة داخله
let session = IN_DISCORD ? {} : (store.get('tarteeb-session') || {});
let activityHello = null;
let lastJoin = null, S = null, prevS = null, ws, queue = [], wildId = null;

$$('[data-discord]').forEach(a => a.href = DISCORD_URL);
$$('[data-support]').forEach(a => {
  if (SUPPORT_URL) a.href = SUPPORT_URL;
  else a.onclick = e => { e.preventDefault(); toast('رابط الدعم ما انضاف بعد'); };
});
const T = s => window.I18N ? I18N.t(s) : s;
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
    if (m.needpass && lastJoin) { const pw = prompt(T('كلمة سر الغرفة:')); if (pw) send({ ...lastJoin, pass: pw }); }
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
  } else if (m.t === 'stroke' || m.t === 'strokes') {
    if (typeof drawNet === 'function') drawNet(m);
  } else if (m.t === 'pos' || m.t === 'snap' || m.t === 'sus') {
    if (typeof susNet === 'function') susNet(m);
  } else if (m.t === 'react') {
    showReact(m.from, m.e);
  } else if (m.t === 'state') {
    m.t0 = Date.now(); flipAdapt(m); prevS = S; S = m; render(); notifyTurn();
  }
}
function reset() { session = {}; store.set('tarteeb-session', {}); S = null; prevS = null; render(); }

// ---------- الرئيسية ----------
const nameEl = $('#name'), codeEl = $('#code');
nameEl.value = store.get('tarteeb-name') || '';
const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) codeEl.value = urlRoom.slice(0, 4).toUpperCase();

const AVS = ['😎', '🦁', '🐪', '🦅', '🐺', '🦊', '🐯', '🐼', '🦄', '🐸', '👑', '🔥', '⚡', '🌙', '🎩', '🤠'];
let myAv = store.get('tarteeb-av') || '';
const drawAv = () => { $('#avBtn').textContent = myAv || '🙂'; $$('#avPick button').forEach(b => b.classList.toggle('on', b.dataset.a === myAv)); };
$('#avPick').innerHTML = AVS.map(a => `<button type="button" data-a="${a}">${a}</button>`).join('');
$('#avBtn').onclick = () => { $('#avPick').hidden = !$('#avPick').hidden; };
$$('#avPick button').forEach(b => b.onclick = () => { myAv = myAv === b.dataset.a ? '' : b.dataset.a; store.set('tarteeb-av', myAv); drawAv(); $('#avPick').hidden = true; sfx('pop'); });
drawAv();
const face = p => p.av ? esc(p.av) : esc([...p.name][0] || '?');
function myName() { const n = nameEl.value.trim(); if (n) store.set('tarteeb-name', n); return n; }
$('#create').onclick = () => {
  const name = myName(); if (!name) { toast('اكتب اسمك أول'); return nameEl.focus(); }
  session = {}; lastJoin = null; send({ t: 'create', name, game: SEL, av: myAv });
};
$('#join').onclick = () => {
  const name = myName(); if (!name) { toast('اكتب اسمك أول'); return nameEl.focus(); }
  const code = codeEl.value.trim().toUpperCase();
  if (code.length !== 4) { toast('الكود أربع خانات'); return codeEl.focus(); }
  session = {}; lastJoin = { t: 'join', name, code, av: myAv }; send(lastJoin);
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
  $('#pcount').textContent = `(${S.players.length}/${S.max})`;
  $('#lobbyTitle').textContent = 'غرفة ' + GNAME[S.game];
  const plist = S.teams ? [...S.players].sort((a, b) => a.tm - b.tm) : S.players;
  $('#plist').innerHTML = plist.map(p =>
    `<li data-id="${p.id}" class="${p.on ? '' : 'off'}${S.teams ? ' t' + p.tm : ''}">${p.av ? `<span class="pav">${esc(p.av)}</span>` : ''}${esc(p.name)}${p.bot ? ' <span class="botx">بوت</span>' : ''}${p.w ? `<span class="wins">🏆 ${p.w}</span>` : ''}${S.teams ? `<span class="tag">فريق ${['أ', 'ب'][p.tm]}</span>` : ''}${p.id === S.me ? ' <em>(أنت)</em>' : ''}${p.h ? '<span class="crown">المضيف</span>' : ''}${amHost && !p.h && p.id !== S.me ? `<button class="kick" data-id="${p.id}" title="طرد">✕</button>` : ''}</li>`
  ).join('');
  const isHost = host && host.id === S.me, enough = S.players.length >= S.min;
  $('#specwrap').hidden = !S.specs.length;
  $('#scount').textContent = `(${S.specs.length})`;
  $('#slist').innerHTML = S.specs.map(p => `<li data-id="${p.id}">${esc(p.name)}${p.id === S.me ? ' <em>(أنت)</em>' : ''}${isHost ? `<button class="kick" data-id="${p.id}" title="طرد">✕</button>` : ''}</li>`).join('');
  $('#start').hidden = !isHost;
  $('#start').disabled = !enough;
  $('#hint').textContent = !enough ? `نحتاج ${S.min} لاعبين على الأقل، انتظر ناس يدخلون`
    : isHost ? 'كل شي جاهز، ابدأ متى ما تبي' : 'ننتظر المضيف يبدأ اللعبة';
  if (S.spec) $('#hint').textContent = 'الغرفة ممتلئة، أنت متفرّج وتنضم أول ما ينفضى مكان';
  renderLobbySet(isHost);
  renderTeams(isHost);
}
function renderTeams(isHost) {
  if (S.spec) { $('#teamrow').hidden = true; return; }
  if (S.game !== 'uno') return renderTeamsOther(isHost);
  $('#teamBtn').hidden = false;
  const can = S.players.length >= 4 && S.players.length % 2 === 0;
  $('#teamrow').hidden = !isHost;
  const tb = $('#teamBtn');
  tb.textContent = S.teams ? 'وضع الفرق: مفعّل ✓' : can ? 'وضع الفرق: مطفي' : 'وضع الفرق (يحتاج عدد زوجي، ٤ أو أكثر)';
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
const vrank = v => /^\d$/.test(v) ? +v : 10 + ['draw1', 'draw5', 'skip', 'skipall', 'reverse', 'flip', 'draw2', 'wild', 'wd2', 'wild4', 'wdc'].indexOf(v);
// أونو فليب تنعرض بنفس شاشة الأونو: نحوّل حالتها لنفس شكل حالة الأونو
function flipAdapt(s) {
  const g = s && s.game === 'flip' && s.g; if (!g) return;
  const cv = c => ({ id: c.id, color: c.c, v: c.v });
  s.turn = g.turn; s.hand = g.hand.map(cv); s.top = cv(g.top); s.color = g.color; s.deck = g.deckN; s.dir = g.dir;
  s.ok = g.sub === 'play' ? g.hand.filter(c => c.ok).map(c => c.id) : [];
  s.pending = null; s.owed = 0; s.catch = g.catchable; s.mates = g.backs || null;
  s.players.forEach(p => { p.u = !!g.called[p.id]; });
}
const MODALC = { L: [['red', 'أحمر', '#e8362d'], ['yellow', 'أصفر', '#ffc928'], ['green', 'أخضر', '#1fa35c'], ['blue', 'أزرق', '#2a5bd7']], D: [['pink', 'وردي', '#ef6fae'], ['teal', 'تركوازي', '#18a7a0'], ['orange', 'برتقالي', '#f28a1c'], ['purple', 'بنفسجي', '#7b3fc7']] };
function modalColors(side) {
  $$('#colorModal [data-c]').forEach((b, i) => { const [c, n, h] = MODALC[side][i]; b.dataset.c = c; b.textContent = n; b.style.cssText = `--b:${h}` + (c === 'yellow' ? ';color:#16130f' : ''); });
}

// ---------- اللعبة ----------
function playCard(c) {
  if (c.color === 'wild') { wildId = c.id; modalColors(S.game === 'flip' && S.g.side === 'D' ? 'D' : 'L'); $('#colorModal').hidden = false; }
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
$('#fcY').onclick = () => send({ t: 'chal', yes: true });
$('#fcN').onclick = () => send({ t: 'chal', yes: false });

const PAL = ['#e8362d', '#2a5bd7', '#1fa35c', '#ffc928'], TC = ['#e8362d', '#2a5bd7'];
function renderGame() {
  const FL = S.game === 'flip' ? S.g : null, chal = !!(FL && FL.sub === 'chal' && FL.chal && S.phase === 'play');
  const playing = S.phase === 'play' && !chal, mine = playing && S.turn === S.me;
  $('.room').classList.toggle('flipg', !!FL); $('.room').classList.toggle('dark', !!FL && FL.side === 'D');
  $('.tablename small').textContent = FL ? (FL.side === 'D' ? 'الوجه الغامق 🌙' : 'الوجه الفاتح ☀️') : 'ألعاب';
  const i = S.players.findIndex(p => p.id === S.me), n = S.players.length, spec = !!S.spec, m = spec ? n : n - 1;
  const myTm = spec ? null : S.players[i].tm;
  const amHost = !spec && S.players.some(p => p.h && p.id === S.me);

  // الخصوم يجلسون على قوس الطاولة: اللي بعدي على يساري، وآخرهم على يميني
  const others = Array.from({ length: m }, (_, k) => S.players[(spec ? k : i + 1 + k) % n]);
  $('#opps').innerHTML = others.map((p, k) => {
    const a = Math.PI * (k + 1) / (m + 1);
    const x = 50 - 40 * Math.cos(a), y = 58 - 46 * Math.sin(a);
    const col = S.teams ? TC[p.tm] : PAL[S.players.indexOf(p) % 4];
    return `<div class="seat${p.id === S.turn && playing ? ' turn' : ''}${p.on ? '' : ' off'}" data-id="${p.id}" style="left:${x}%;top:${y}%">
      ${p.id === S.turn && playing ? '<div class="arrow"><b></b>▼</div>' : ''}${amHost ? `<button class="kick" data-id="${p.id}" title="طرد">✕</button>` : ''}<div class="avatar" style="background:${col};color:${col === '#ffc928' ? '#16130f' : '#fff'}">${face(p)}</div>
      <div class="nm">${esc(p.name)}</div>${p.w ? `<span class="wins">🏆 ${p.w}</span>` : ''}${S.teams ? `<span class="tm${!spec && p.tm === myTm ? ' mate' : ''}">${spec ? 'فريق ' + ['أ', 'ب'][p.tm] : p.tm === myTm ? 'فريقك' : 'خصم'}</span>` : ''}<div class="backs${S.mates && S.mates[p.id] ? ' open' : ''}">${S.mates && S.mates[p.id] ? [...S.mates[p.id]].sort((x, y) => (x.color > y.color ? 1 : x.color < y.color ? -1 : vrank(x.v) - vrank(y.v))).map(c => `<i class="mc ${c.color}">${/^\d$/.test(c.v) ? c.v : (SYM[c.v] || "★")}</i>`).join('') : '<i></i>'.repeat(Math.min(p.n, 8))}</div><span class="cnt">${p.n}</span></div>`;
  }).join('');

  // وسط الطاولة
  const deck = $('#deck'); deck.innerHTML = ''; deck.appendChild(backEl());
  deck.insertAdjacentHTML('beforeend', `<small>${S.deck}</small>`);
  deck.classList.toggle('can', mine && S.pending === null);
  const disc = $('#discard'); disc.innerHTML = ''; if (S.top) disc.appendChild(cardEl(S.top));
  disc.style.setProperty('--glow', HEX[S.color] || '#555');
  const sc = $('#score'); sc.hidden = !S.teams;
  if (S.teams) sc.innerHTML = spec ? `<span style="background:${TC[0]}">فريق أ ${S.score[0]}</span><span style="background:${TC[1]}">${S.score[1]} فريق ب</span>`
    : `<span style="background:${TC[myTm]}">فريقك ${S.score[myTm]}</span><span style="background:${TC[1 - myTm]}">${S.score[1 - myTm]} الخصم</span>`;

  // ما عندك ورقة تنفع: كل شي يبهت إلا كومة السحب
  const must = mine && S.pending === null && S.ok.length === 0;
  $('.room').classList.toggle('mustdraw', must);
  $('#deck').classList.toggle('must', must);
  const t = $('#turn');
  t.className = 'turn' + (mine ? ' mine' : '') + (must ? ' warn' : '');
  const vic = chal && FL.chal.victim === S.me;
  $('#fcY').hidden = $('#fcN').hidden = !vic;
  if (chal) { t.className = 'turn' + (vic ? ' mine' : ''); }
  t.innerHTML = chal ? (vic ? `${esc(S.players.find(p => p.id === FL.chal.by)?.name || '')} لعب ${FL.chal.kind === 'wd2' ? '+٢ ملوّن' : 'ملوّن سحب لون'}: تقبل أو تتحدّاه؟ <span class="cd"></span>` : `${esc(S.players.find(p => p.id === FL.chal.victim)?.name || '')} يقرر: يقبل أو يتحدّى… <span class="cd"></span>`) : !playing ? '' : must ? 'ما عندك ورقة تنفع، اسحب من الكومة! <span class="cd"></span>'
    : mine ? (S.pending !== null ? 'العب الورقة اللي سحبتها أو مرّر' : S.owed > 0 ? `رد بـ +${S.top && S.top.v === 'wild4' ? '٤' : '٢'} أو اسحب ${S.owed}!` : 'دورك!') + ' <span class="cd"></span>'
    : `دور ${esc(S.players.find(p => p.id === S.turn)?.name || '')}${S.owed > 0 ? ` — عليه يسحب ${S.owed}` : ''} <span class="cd"></span>`;
  tick();
  $('#log').innerHTML = S.log.slice(-2).map(esc).join('<br>');

  // الأزرار
  const meP = S.players.find(q => q.id === S.me);
  $('#unoBtn').hidden = spec || !(playing && S.hand.length <= 2) || !!(meP && meP.u);
  $('#specTag').hidden = !spec; $('#hand').hidden = spec;
  $('.room').classList.toggle('watching', spec);
  const sb = $('#specBtn'); sb.hidden = !S.specs.length; $('#specN').textContent = S.specs.length;
  if (!S.specs.length) $('#specPanel').hidden = true;
  else if (!$('#specPanel').hidden) drawSpecPanel();
  $('#pass').hidden = !(mine && S.pending !== null);
  $('#catch').hidden = spec || !(playing && S.catch && S.catch !== S.me);

  // يدي على شكل مروحة
  const hand = $('#hand'); hand.innerHTML = '';
  const cards = [...S.hand].sort((a, b) => CORDER[a.color] - CORDER[b.color] || vrank(a.v) - vrank(b.v));
  const N = cards.length, cw = innerWidth < 760 ? 68 : 86;
  const sp = Math.min(cw * 0.72, (($('.handzone').clientWidth || innerWidth) - (innerWidth < 760 ? 0 : 120) - 56 - cw) / Math.max(N - 1, 1));
  const step = Math.min(3.4, 26 / Math.max(N, 1));
  cards.forEach((c, k) => {
    const el = cardEl(c, 'button'), d = k - (N - 1) / 2;
    el.dataset.id = c.id;
    el.style.marginLeft = (k ? sp - cw : 0) + 'px';
    el.style.setProperty('--r', d * step + 'deg');
    el.style.setProperty('--y', d * d * 1.1 + 'px');
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
    const me = S.players[i] || {};
    const wt = $('#winteam');
    if (S.teams && S.winTeam != null) {
      $('#winner').textContent = spec ? 'فاز فريق ' + ['أ', 'ب'][S.winTeam] : S.winTeam === myTm ? 'فاز فريقك! 🎉' : 'فاز الفريق الخصم';
      wt.hidden = false; wt.textContent = 'الفائزين: ' + S.players.filter(p => p.tm === S.winTeam).map(p => p.name).join(' و ');
    } else {
      wt.hidden = !FL; if (FL) wt.textContent = 'مجموع نقاط أوراق الباقين: ' + FL.total;
      $('#winner').textContent = !spec && S.winner === me.name && S.hand.length === 0 ? 'فزت! 🎉' : `فاز ${S.winner}`;
    }
    $('#board').innerHTML = [...S.players].sort((a, b) => b.w - a.w).map(p => `<li${p.id === S.me ? ' class="me"' : ''}><span>${esc(p.name)}</span><b>🏆 ${p.w}</b></li>`).join('');
    const host = S.players.find(p => p.h);
    $('#again').hidden = spec || !(host && host.id === S.me);
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
function unoBurst(name) {
  const el = document.createElement('div'); el.className = 'unoburst';
  el.innerHTML = `<b>أونووو!!</b><span>${esc(name || '')}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
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
    if (['draw2', 'wild4', 'draw1', 'draw5', 'wd2', 'wdc'].includes(s.top.v)) setTimeout(() => sfx('penalty'), 260);
    if (s.game === 'flip' && s.g && p.g && s.g.flips > p.g.flips) { setTimeout(() => sfx('catch'), 150); [$('#discard'), $('#hand'), $('.felt')].forEach(e => e.animate([{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0)' }], { duration: 520, easing: EASE })); }
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
    if (last.includes('أونو!')) { sfx('unoCall'); unoBurst(last.split(':')[0]); }
    else if (last.includes('مسك')) sfx('catch');
  }
  if (s.phase === 'over') {
    const mt = s.players.find(p => p.id === s.me)?.tm;
    const won = s.teams && s.winTeam != null ? s.winTeam === mt : s.hand.length === 0;
    if (!s.spec) setTimeout(() => { sfx('unoWin'); if (won) confetti(); }, 500);
    else if (p.phase !== 'over') setTimeout(() => sfx('unoWin'), 500);
  }
}

function render() {
  const ph = !S ? (IN_DISCORD ? 'connecting' : 'home') : S.phase === 'lobby' ? 'lobby' : S.game === 'uno' || S.game === 'flip' ? 'game' : 'game2';
  ['home', 'connecting', 'lobby', 'game', 'game2'].forEach(id => $('#' + id).hidden = id !== ph);
  document.body.classList.toggle('ingame', ph === 'game');
  document.body.classList.toggle('ingame2', ph === 'game2');
  $('#chatfab').hidden = !S; drawBell();
  if (!S) { $('#chatbox').hidden = true; $('#emojiBar').hidden = true; chatLog = []; unread = 0; badge(); }
  if (ph !== 'game') $('#colorModal').hidden = true;
  if (ph === 'lobby') renderLobby();
  if (ph === 'game') renderGame();
  if (ph === 'game2') renderOther();
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
  box.innerHTML = chatLog.map(m => `<div class="msg${S && m.from === S.me ? ' me' : ''}"><b>${esc(m.name)}:</b> <span class="nt">${esc(m.text)}</span></div>`).join('');
  box.scrollTop = box.scrollHeight;
}
function openChat(open) {
  $('#chatbox').hidden = !open; $('#emojiBar').hidden = true;
  if (open) { unread = 0; badge(); drawMsgs(); setTimeout(() => $('#chatin').focus(), 50); }
}
const QUICK = ['يلا!', 'دورك', 'حظ أوفر', 'ههههه', 'GG', 'لحظة', 'والله؟!', 'تسلم'];
$('#quick').innerHTML = QUICK.map(q => `<button type="button">${q}</button>`).join('');
$$('#quick button').forEach(b => b.onclick = () => send({ t: 'chat', text: b.textContent }));
// تنبيه الدور: يشتغل لين تكون الصفحة مفتوحة (حتى لو بتبويب ثاني)
let notifyOn = !!store.get('tarteeb-notify') && 'Notification' in window && Notification.permission === 'granted';
const drawBell = () => { const b = $('#bellBtn'); b.hidden = !S || !('Notification' in window); b.textContent = notifyOn ? '🔔' : '🔕'; };
$('#bellBtn').onclick = async () => {
  if (!notifyOn) {
    let perm = Notification.permission; if (perm === 'default') perm = await Notification.requestPermission();
    if (perm !== 'granted') return toast('التنبيهات محظورة من إعدادات المتصفح');
    notifyOn = true; toast('بنبّهك لما يجي دورك والصفحة بالخلفية');
  } else { notifyOn = false; toast('انطفى التنبيه'); }
  store.set('tarteeb-notify', notifyOn); drawBell();
};
function isMyTurn(s) {
  if (!s || s.spec || s.phase !== 'play') return false;
  const g = s.g, m = s.players.find(p => p.id === s.me), tm = m ? m.tm : null;
  if (s.game === 'uno') return s.turn === s.me;
  if (!g) return false;
  if (s.game === 'liars') return g.sub === 'play' && g.turn === s.me;
  if (s.game === 'outside') return (g.sub === 'ask' && g.asker === s.me) || (g.sub === 'qa' && g.target === s.me);
  if (s.game === 'flip') return g.turn === s.me;
  if (s.game === 'sus') return g.sub === 'meet' && !!g.meet && g.meet.sub === 'vote' && !!g.me && g.me.alive && !g.meet.mine;
  if (s.game === 'codes') return g.turn === tm;
  if (s.game === 'jackaroo') return g.turn === g.seat;
  if (s.game === 'draw') return g.sub === 'choose' && g.drawer === s.me;
  if (s.game === 'hive') return (g.sub === 'pick' && g.turn === tm) || g.answering === tm;
  return false;
}
function notifyTurn() {
  if (!notifyOn || !document.hidden) return;
  if (isMyTurn(S) && !(prevS && prevS.game === S.game && isMyTurn(prevS))) {
    try { new Notification('ترتيب — دورك!', { body: 'ارجع للعبة', tag: 'turn', icon: 'icons/icon-192.png' }); } catch {}
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
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
  const el = document.querySelector(`.seat[data-id="${id}"], .lp[data-id="${id}"], .pchip[data-id="${id}"]`) || document.querySelector(`#plist li[data-id="${id}"]`);
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
  const el = document.querySelector(`.seat[data-id="${id}"], .lp[data-id="${id}"], .pchip[data-id="${id}"]`) || document.querySelector(`#plist li[data-id="${id}"]`);
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
    activityHello = { t: 'activity', room: sdk.instanceId, token: access_token, av: myAv };
    connect();
  } catch (e) {
    console.error(e);
    msg.textContent = 'ما قدرنا نربط مع الديسكورد، جرّب تعيد تشغيل اللعبة';
  }
}

window.quitGame = () => {
  const host = S && S.players.find(p => p.h), amHost = !S.spec && host && host.id === S.me;
  if (amHost && S.phase === 'play') { if (confirm(T('تبي ترجع الكل للغرفة؟'))) send({ t: 'tolobby' }); return; }
  if (confirm(T('تبي تطلع من اللعبة؟'))) send({ t: 'leave' });
};
$('#quit').onclick = () => window.quitGame();
function drawSpecPanel() {
  const host = S.players.find(p => p.h), amHost = !S.spec && host && host.id === S.me;
  $('#specPanel').innerHTML = '<b>المتفرجين</b>' + S.specs.map(p => `<div>${esc(p.name)}${p.id === S.me ? ' <em>(أنت)</em>' : ''}${amHost ? `<button class="kick" data-id="${p.id}" title="طرد">✕</button>` : ''}</div>`).join('');
}
$('#specBtn').onclick = () => { const p = $('#specPanel'); p.hidden = !p.hidden; if (!p.hidden) drawSpecPanel(); };
document.addEventListener('click', e => {
  const k = e.target.closest('.kick'); if (!k || !S) return;
  const t = S.players.find(p => p.id === k.dataset.id) || S.specs.find(p => p.id === k.dataset.id);
  if (t && (IN_DISCORD || confirm(T('تطرد') + ` ${t.name} ` + T('من الغرفة؟')))) send({ t: 'kick', id: k.dataset.id });
});
const muteBtn = $('#mute');
muteBtn.textContent = sfx.on() ? '🔊' : '🔇';
muteBtn.onclick = () => { muteBtn.textContent = sfx.toggle() ? '🔊' : '🔇'; };

render();
IN_DISCORD ? startActivity() : connect();

// ---------- تثبيت التطبيق (PWA) ----------
let deferredInstall = null;
const installBtn = $('#install');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (!IN_DISCORD && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (!standalone) installBtn.hidden = false; });
window.addEventListener('appinstalled', () => { installBtn.hidden = true; deferredInstall = null; toast('انثبّت التطبيق 🎉'); });
if (!IN_DISCORD && !standalone && /iphone|ipad|ipod/i.test(navigator.userAgent) && !store.get('tarteeb-ioshint')) installBtn.hidden = false;
installBtn.onclick = async () => {
  if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; installBtn.hidden = true; }
  else { toast('في سفاري: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»'); store.set('tarteeb-ioshint', 1); installBtn.hidden = true; }
};
