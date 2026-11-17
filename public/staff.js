// مكان التيم 🔐 — يفتح بحركة سرية: اضغط «TRTB TEAM» في قسم الفريق ٥ مرات ورا بعض، بعدها الرمز.
(() => {
  const KEY = 'tarteeb-staff';
  const COL = { 'بشرى': '#ff4fa3', 'مازن': '#e8362d', 'أفراح': '#a66bff', 'سلمان': '#ff8a1f', 'ايزن': '#19c3d6', 'حميد': '#2a5bd7', 'علي': '#e0a800', 'هدهد': '#1fa35c', 'لافي': '#e86aa6' };
  const ST = { who: null, tab: 'rooms', rooms: [], live: {}, stats: null, chat: [], notes: [], members: [], unread: 0, lastMsg: 0, open: false };
  const auth = () => { const s = store.get(KEY); return s && typeof s === 'object' && s.tok ? s : null; };
  window.teamTok = () => { const a = auth(); return a ? a.tok : undefined; };
  const nn = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const hm = t => { const d = new Date(t); return nn(d.toLocaleTimeString('ar-SA-u-nu-latn', { hour: 'numeric', minute: '2-digit' })); };
  const ago = ms => { const m = Math.floor(ms / 60000); return m < 1 ? 'توّه' : m < 60 ? `${nn(m)} د` : `${nn(Math.floor(m / 60))} س`; };
  const PH = { lobby: 'لوبي', play: 'يلعبون', over: 'خلصت' };
  const ssend = o => send({ t: 'staff', ...o });

  // ---- الحركة السرية ----
  let taps = [];
  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('.tt-tag')) return;
    const now = Date.now(); taps = taps.filter(t => now - t < 3000); taps.push(now);
    if (taps.length >= 5) { taps = []; openPanel(); }
  });

  function shell() {
    let el = $('#stf'); if (el) return el;
    el = document.createElement('div'); el.id = 'stf'; el.className = 'stf'; el.hidden = true;
    el.innerHTML = `<div class="stf-box" role="dialog" aria-label="مكان التيم"><button type="button" class="stf-x" aria-label="سكّر">✕</button><div class="stf-in"></div></div>`;
    document.body.appendChild(el);
    el.querySelector('.stf-x').onclick = closePanel;
    el.addEventListener('click', e => { if (e.target === el) closePanel(); });
    return el;
  }
  function openPanel() {
    const el = shell(); el.hidden = false; ST.open = true; document.body.classList.add('stf-on'); sfx('pop');
    const a = auth();
    if (a) { ST.who = a.who; drawLoading(); ssend({ k: 'hello', tok: a.tok }); }
    else { drawLogin(); ssend({ k: 'info' }); }
  }
  function closePanel() { const el = $('#stf'); if (el) el.hidden = true; ST.open = false; document.body.classList.remove('stf-on'); ssend({ k: 'bye' }); }
  addEventListener('keydown', e => { if (e.key === 'Escape' && ST.open) closePanel(); });
  // لو انقطع الاتصال واللوحة مفتوحة نرجع نسلّم على السيرفر
  setInterval(() => { const a = auth(); if (ST.open && a && ST.who && Date.now() - ST.lastMsg > 9000) { ST.lastMsg = Date.now(); ssend({ k: 'hello', tok: a.tok }); } }, 3000);

  const inner = () => $('#stf .stf-in');
  function drawLoading() { inner().innerHTML = '<div class="stf-load">🔐 لحظة…</div>'; }
  function drawLogin(msg) {
    const mem = ST.members.length ? ST.members : Object.keys(COL);
    inner().innerHTML = `<div class="stf-login"><div class="stf-lock">🔐</div><h2>مكان التيم</h2><p>للتيم بس. اختر اسمك واكتب الرمز.</p>
      <div class="stf-mem">${mem.map(n => `<button type="button" data-n="${esc(n)}" style="--c:${COL[n] || '#16130f'}">${esc(n)}</button>`).join('')}</div>
      <input id="stfPin" type="password" inputmode="numeric" autocomplete="off" placeholder="الرمز السري" maxlength="40">
      <button type="button" class="btn stf-go" id="stfGo">ادخل</button><p class="stf-err" id="stfErr">${msg ? esc(msg) : ''}</p></div>`;
    let who = null;
    inner().querySelectorAll('.stf-mem button').forEach(b => b.onclick = () => { who = b.dataset.n; inner().querySelectorAll('.stf-mem button').forEach(x => x.classList.toggle('on', x === b)); $('#stfPin').focus(); });
    const go = () => { const pin = $('#stfPin').value; if (!who) return ($('#stfErr').textContent = 'اختر اسمك أول'); if (!pin) return $('#stfPin').focus(); $('#stfErr').textContent = '…'; ssend({ k: 'login', who, pin }); };
    $('#stfGo').onclick = go; $('#stfPin').addEventListener('keydown', e => e.key === 'Enter' && go());
  }

  window.onStaff = m => {
    ST.lastMsg = Date.now();
    if (m.k === 'info') { ST.members = m.members || []; if (ST.open && !auth()) drawLogin(m.on ? '' : 'المكان مقفول: لازم يتحط TEAM_PIN بإعدادات السيرفر'); return; }
    if (m.k === 'bad') { const e = $('#stfErr'); if (e) e.textContent = m.msg; sfx('bang'); return; }
    if (m.k === 'expired') { store.set(KEY, null); ST.who = null; if (ST.open) drawLogin('انتهت الجلسة، ادخل من جديد'); return; }
    if (m.k === 'ok') { store.set(KEY, { tok: m.tok, who: m.who }); ST.who = m.who; sfx('win'); return; }
    if (m.k === 'snap') { Object.assign(ST, { who: m.who, rooms: m.rooms, live: m.live, stats: m.stats, chat: m.chat, notes: m.notes, members: m.members }); if (ST.open) draw(); return; }
    if (m.k === 'rooms') { ST.rooms = m.rooms; ST.live = m.live; if (ST.open && (ST.tab === 'rooms' || ST.tab === 'stats')) drawBody(); drawTabs(); return; }
    if (m.k === 'chat') { ST.chat.push(m.msg); if (ST.chat.length > 300) ST.chat.shift(); if (ST.open && ST.tab === 'chat') drawBody(); else { ST.unread++; drawTabs(); } if (m.msg.who !== ST.who) sfx('pop'); return; }
    if (m.k === 'notes') { ST.notes = m.notes; if (ST.open && ST.tab === 'notes') drawBody(); return; }
    if (m.k === 'done') { toast(m.msg); return; }
  };

  // إعلان من التيم يوصل لكل اللي بالموقع
  window.onAnnounce = m => {
    let el = $('#annc'); if (!el) { el = document.createElement('div'); el.id = 'annc'; el.className = 'annc'; document.body.appendChild(el); }
    el.innerHTML = `<b>📢</b><div><p>${esc(m.text)}</p><small>— ${esc(m.from)} · تيم ترتيب</small></div><button type="button" aria-label="سكّر">✕</button>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    el.querySelector('button').onclick = () => el.classList.remove('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 12000);
    sfx('turn');
  };

  function draw() {
    inner().innerHTML = `<div class="stf-head"><span class="stf-me" style="--c:${COL[ST.who] || '#16130f'}">${esc(ST.who || '')}</span><h2>🔐 مكان التيم</h2><button type="button" class="stf-out" id="stfOut">تسجيل خروج</button></div>
      <nav class="stf-tabs" id="stfTabs"></nav>
      <div class="stf-acts">
        <div class="stf-act"><select id="stfGame">${Object.entries(GNAME).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select><button type="button" class="btn" id="stfPriv">➕ غرفة خاصة للتيم</button></div>
        <div class="stf-act"><input id="stfAnn" maxlength="200" placeholder="إعلان يوصل لكل اللي بالموقع…"><button type="button" class="btn" id="stfAnnGo">📢 أرسل</button></div>
      </div>
      <div class="stf-body" id="stfBody"></div>`;
    $('#stfOut').onclick = () => { store.set(KEY, null); ST.who = null; ssend({ k: 'bye' }); drawLogin(); ssend({ k: 'info' }); };
    $('#stfPriv').onclick = () => {
      const game = $('#stfGame').value; closePanel();
      session = {}; lastJoin = null;
      send({ t: 'create', name: ST.who, game, av: typeof myAv === 'string' ? myAv : '', dev: DEV, teamOnly: true, teamTok: teamTok() });
      toast('سوّينا غرفة خاصة 🔐 — بس التيم يقدر يدخلها بالكود');
    };
    $('#stfAnnGo').onclick = () => { const v = $('#stfAnn').value.trim(); if (!v) return; if (!confirm(`يوصل هالإعلان لكل اللي بالموقع الحين:\n\n${v}`)) return; ssend({ k: 'announce', text: v }); $('#stfAnn').value = ''; };
    drawTabs(); drawBody();
  }
  function drawTabs() {
    const n = $('#stfTabs'); if (!n) return;
    const T = [['rooms', `🎮 الغرف <i>${nn(ST.rooms.length)}</i>`], ['stats', '📊 الإحصائيات'], ['chat', `💬 الدردشة${ST.unread ? ` <i class="u">${nn(ST.unread)}</i>` : ''}`], ['notes', `📝 الملاحظات <i>${nn(ST.notes.filter(x => !x.done).length)}</i>`]];
    n.innerHTML = T.map(([k, l]) => `<button type="button" data-k="${k}" class="${ST.tab === k ? 'on' : ''}">${l}</button>`).join('');
    n.querySelectorAll('button').forEach(b => b.onclick = () => { ST.tab = b.dataset.k; if (ST.tab === 'chat') ST.unread = 0; drawTabs(); drawBody(); });
  }
  function drawBody() {
    const b = $('#stfBody'); if (!b) return;
    if (ST.tab === 'rooms') return drawRooms(b);
    if (ST.tab === 'stats') return drawStats(b);
    if (ST.tab === 'chat') return drawChat(b);
    if (ST.tab === 'notes') return drawNotes(b);
  }
  function drawRooms(b) {
    const L = ST.live;
    b.innerHTML = `<div class="stf-live"><span>🟢 <b>${nn(L.players || 0)}</b> لاعب الحين</span><span>🎮 <b>${nn(L.rooms || 0)}</b> غرفة</span><span>🔌 ${nn(L.sockets || 0)} اتصال</span></div>` +
      (ST.rooms.length ? ST.rooms.map(r => `<div class="stf-room${r.team ? ' team' : ''}">
        <div class="stf-rh"><b class="code">${esc(r.code)}</b><span>${esc(GNAME[r.game] || r.game)}</span><em class="ph ${r.phase}">${PH[r.phase] || r.phase}</em>${r.team ? '<em>🔐 تيم</em>' : ''}${r.pass ? '<em>🔑</em>' : ''}<small>${ago(r.age)}</small></div>
        <div class="stf-ps">${r.players.map(p => `<span class="${p.on ? '' : 'off'}">${p.host ? '👑 ' : ''}${esc(p.n)}<button type="button" data-kick="${esc(p.id)}" data-code="${esc(r.code)}" data-n="${esc(p.n)}" aria-label="اطرد">✕</button></span>`).join('')}${r.specs.length ? `<span class="spec">👁 ${nn(r.specs.length)}</span>` : ''}</div>
        <div class="stf-rb"><button type="button" data-join="${esc(r.code)}">ادخل</button><button type="button" class="dang" data-close="${esc(r.code)}">اقفل الغرفة</button></div></div>`).join('') : '<p class="stf-empty">ما فيه غرف شغّالة الحين 💤</p>');
    b.querySelectorAll('[data-kick]').forEach(x => x.onclick = () => { if (confirm(`تطرد ${x.dataset.n} من ${x.dataset.code}؟`)) ssend({ k: 'kick', code: x.dataset.code, id: x.dataset.kick }); });
    b.querySelectorAll('[data-close]').forEach(x => x.onclick = () => { if (confirm(`تقفل الغرفة ${x.dataset.close}؟ كل اللي فيها بيطلعون.`)) ssend({ k: 'close', code: x.dataset.close }); });
    b.querySelectorAll('[data-join]').forEach(x => x.onclick = () => {
      closePanel(); session = {};
      lastJoin = { t: 'join', name: ST.who, code: x.dataset.join, av: typeof myAv === 'string' ? myAv : '', dev: DEV, teamTok: teamTok() }; send(lastJoin);
    });
  }
  function bars(list, max, lab) { return `<div class="stf-bars">${list.map(([k, v]) => `<div class="bar"><span>${lab(k)}</span><i style="--w:${max ? Math.max(2, v / max * 100) : 0}%"></i><b>${nn(v)}</b></div>`).join('')}</div>`; }
  function drawStats(b) {
    const s = ST.stats || { total: 0, games: {}, days: {}, hours: [], peak: 0 }, L = ST.live;
    const today = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
    const days = Object.keys(s.days).sort(), last7 = days.slice(-7).reduce((a, k) => a + s.days[k], 0);
    const G = Object.entries(s.games).sort((a, c) => c[1] - a[1]), gmax = G.length ? G[0][1] : 0;
    const H = (s.hours || []).map((v, i) => [i, v]), hmax = Math.max(0, ...H.map(x => x[1]));
    const D14 = days.slice(-14).map(k => [k, s.days[k]]), dmax = Math.max(0, ...D14.map(x => x[1]));
    const up = L.up || 0, upT = up > 86400 ? `${nn(Math.floor(up / 86400))} يوم` : up > 3600 ? `${nn(Math.floor(up / 3600))} ساعة` : `${nn(Math.floor(up / 60))} دقيقة`;
    b.innerHTML = `<div class="stf-cards">
      <div><b>${nn(s.days[today] || 0)}</b><span>لعبة اليوم</span></div><div><b>${nn(last7)}</b><span>آخر ٧ أيام</span></div>
      <div><b>${nn(s.total)}</b><span>المجموع</span></div><div><b>${nn(s.peak)}</b><span>أعلى عدد بنفس الوقت${s.peakAt ? `<br><small>${nn(new Date(s.peakAt).toLocaleDateString('ar-SA-u-nu-latn'))}</small>` : ''}</span></div>
      <div><b>${nn(L.players || 0)}</b><span>لاعب الحين</span></div><div><b>${upT}</b><span>السيرفر شغّال من</span></div></div>
      <h3>أكثر الألعاب لعباً</h3>${G.length ? bars(G.slice(0, 12), gmax, k => esc(GNAME[k] || k)) : '<p class="stf-empty">لسا ما انلعبت ألعاب</p>'}
      <h3>أوقات الذروة (بتوقيت الرياض)</h3><div class="stf-hours">${H.map(([h, v]) => `<i style="--h:${hmax ? Math.max(3, v / hmax * 100) : 3}%" title="${nn(h)}:٠٠ — ${nn(v)}"><span>${h % 3 === 0 ? nn(h) : ''}</span></i>`).join('')}</div>
      <h3>آخر ١٤ يوم</h3>${D14.length ? bars(D14, dmax, k => nn(k.slice(5).replace('-', '/'))) : '<p class="stf-empty">—</p>'}
      <p class="stf-note">الإحصائيات تنحفظ بملف على السيرفر. لو ريندر نزّل نسخة جديدة أو أعاد التشغيل ممكن تتصفّر.</p>`;
  }
  function drawChat(b) {
    b.innerHTML = `<div class="stf-chat" id="stfMsgs">${ST.chat.length ? ST.chat.map(m => `<div class="msg${m.who === ST.who ? ' me' : ''}"><b style="color:${COL[m.who] || '#16130f'}">${esc(m.who)}</b><p>${esc(m.text)}</p><small>${hm(m.at)}</small></div>`).join('') : '<p class="stf-empty">ابدأ السالفة 👋</p>'}</div>
      <div class="stf-send"><input id="stfMsg" maxlength="500" placeholder="اكتب للتيم…"><button type="button" class="btn" id="stfMsgGo">أرسل</button></div>`;
    const box = $('#stfMsgs'); box.scrollTop = box.scrollHeight;
    const go = () => { const v = $('#stfMsg').value.trim(); if (!v) return; ssend({ k: 'chat', text: v }); $('#stfMsg').value = ''; $('#stfMsg').focus(); };
    $('#stfMsgGo').onclick = go; $('#stfMsg').addEventListener('keydown', e => e.key === 'Enter' && go());
  }
  function drawNotes(b) {
    b.innerHTML = `<div class="stf-send"><input id="stfNote" maxlength="400" placeholder="فكرة، طلب، شي لازم ينسوّى…"><button type="button" class="btn" id="stfNoteGo">➕ أضف</button></div>
      <div class="stf-notes">${ST.notes.length ? ST.notes.map(n => `<div class="note${n.done ? ' done' : ''}"><button type="button" class="ck" data-done="${n.id}" aria-label="تم">${n.done ? '✓' : ''}</button><div><p>${esc(n.text)}</p><small style="color:${COL[n.who] || 'inherit'}">${esc(n.who)} · ${ago(Date.now() - n.at)}${n.done && n.by ? ` · خلّصها ${esc(n.by)}` : ''}</small></div><button type="button" class="del" data-del="${n.id}" aria-label="احذف">🗑</button></div>`).join('') : '<p class="stf-empty">ما فيه ملاحظات</p>'}</div>`;
    const go = () => { const v = $('#stfNote').value.trim(); if (!v) return; ssend({ k: 'note', op: 'add', text: v }); $('#stfNote').value = ''; };
    $('#stfNoteGo').onclick = go; $('#stfNote').addEventListener('keydown', e => e.key === 'Enter' && go());
    b.querySelectorAll('[data-done]').forEach(x => x.onclick = () => ssend({ k: 'note', op: 'done', id: x.dataset.done }));
    b.querySelectorAll('[data-del]').forEach(x => x.onclick = () => { if (confirm('تحذف الملاحظة؟')) ssend({ k: 'note', op: 'del', id: x.dataset.del }); });
  }
})();
