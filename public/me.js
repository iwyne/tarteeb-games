// ===== الملف الشخصي، الترتيب، الشارات، متجر التجميل، وشرح أول مرة لكل لعبة =====
// ينحمّل بس لما تفتح وحدة منها (GAME_JS._me بـ app.js). البيانات من /api/* بالسيرفر (points.js).
(() => {
  const N = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const NN = n => N(Number(n || 0).toLocaleString('en-US').replace(/,/g, '٬'));
  const ME = { meta: null };
  const post = (u, o) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ dev: DEV, dtok: DC && DC.tok }, o)) }).then(r => r.json());
  const meta = () => ME.meta || (ME.meta = fetch('/api/shop').then(r => r.json()));
  const avCol = s => ['#7fb2ff', '#ff9aa8', '#7fd6a4', '#ffd27f', '#c9b3ff', '#ffc3a0', '#9fe3e0'][[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % 7];
  const av = (u, sz = '') => u.a ? `<img class="meav${sz}" src="${esc(u.a)}" alt="">` : `<span class="meav${sz}" style="background:${avCol(u.n)}">${esc([...String(u.n || '؟').trim()][0] || '؟')}</span>`;
  const nm = u => { const f = u.eq && u.eq.fr; return f ? `<span class="nf nf-${f.slice(3)}">${esc(u.n)}</span>` : esc(u.n); };
  const gname = g => (typeof GNAME !== 'undefined' && GNAME[g]) || g;

  function ov(html, cls = '') {
    let o = document.getElementById('meOv'); if (!o) { o = document.createElement('div'); o.id = 'meOv'; document.body.appendChild(o); o.addEventListener('click', e => { if (e.target === o) close(); }); }
    o.className = 'meov ' + cls; o.innerHTML = `<div class="mebox"><button class="mex" aria-label="إغلاق">✕</button>${html}</div>`; o.hidden = false;
    o.querySelector('.mex').onclick = close; document.body.classList.add('meopen'); return o;
  }
  function close() { const o = document.getElementById('meOv'); if (o) o.hidden = true; document.body.classList.remove('meopen'); }
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  const loading = t => ov(`<div class="meload">${t || 'نحمّل…'}</div>`);

  // ===== الملف =====
  async function profile(pid) {
    loading();
    let u, mine = false;
    try {
      if (pid === 'me') {
        mine = true;
        if (IN_DISCORD) { const q = S && S.players.find(x => x.id === S.me); if (!q || !q.cs) return ov('<div class="meload">افتح ملفك من داخل غرفة</div>'); pid = q.cs.pid; u = await fetch('/api/u/' + pid).then(r => r.ok ? r.json() : null); }
        else u = await post('/api/me', {});
        if (!u || u.none) return ov(`<div class="meempty"><b>ما عندك ملف للحين</b><p>العب جولة وحدة وتطلع نقاطك وملفك هنا.</p>${DC ? '' : '<p>ادخل بحساب ديسكورد عشان ملفك يمشي معك بكل الأجهزة.</p>'}</div>`);
      } else u = await fetch('/api/u/' + encodeURIComponent(pid)).then(r => r.ok ? r.json() : null);
    } catch { return ov('<div class="meload">ما قدرنا نجيب الملف</div>'); }
    if (!u) return ov('<div class="meempty"><b>هذا اللاعب ما لعب للحين</b><p>أول ما يخلّص جولة يطلع ملفه.</p></div>');
    const M = await meta().catch(() => ({ badges: [] })), have = new Set(u.b.map(x => x.id));
    const winp = u.games ? Math.round(u.wins / u.games * 100) : 0;
    const top = Object.entries(u.g).sort((a, b) => b[1].p - a[1].p).slice(0, 6);
    const since = u.since ? new Date(u.since).toLocaleDateString('ar-SA-u-nu-arab', { month: 'long', year: 'numeric' }) : '';
    ov(`<div class="mepf">
      <div class="mehd">${av(u, ' big')}<div><div class="menm">${nm(u)}</div><div class="memut">${since ? `عضو من ${since} · ` : ''}مستوى ${N(u.lvl)}${u.rank.week ? ` · المركز ${N(u.rank.week)} بالأسبوع` : ''}</div>
        <div class="melvbar"><i style="width:${Math.round(u.into / u.need * 100)}%"></i></div><small class="memut">باقي ${N(u.need - u.into)} للمستوى ${N(u.lvl + 1)}</small></div></div>
      <div class="mestats"><div><b>${NN(u.pts)}</b>نقطة</div><div><b>${NN(u.games)}</b>جولة</div><div><b>${NN(u.wins)}</b>فوز</div><div><b>${N(winp)}٪</b>نسبة الفوز</div></div>
      ${top.length ? `<div class="mesec">ألعابه</div><div class="megl">${top.map(([g, x]) => { const p = x.p ? Math.round(x.w / x.p * 100) : 0; return `<span>${esc(gname(g))}</span><div class="mebar"><i style="width:${p}%"></i></div><span>${N(p)}٪</span><small>${N(x.w)} فوز من ${N(x.p)}</small>`; }).join('')}</div>` : ''}
      <div class="mesec">الشارات <small>${N(have.size)} من ${N(M.badges.length)}</small></div>
      <div class="meribs">${M.badges.slice().sort((a, b) => have.has(b.id) - have.has(a.id)).map(b => `<div class="${have.has(b.id) ? '' : 'lock'}"><span class="rib rib-${b.id}">${esc(b.t)}</span><small>${esc(b.d)}</small></div>`).join('')}</div>
      ${u.run > 1 ? `<div class="memut" style="margin-top:8px">يلعب ${N(u.run)} أيام ورا بعض (أكثر شي ${N(u.best)})</div>` : ''}
      <div class="mebtns">${mine && !IN_DISCORD ? `<span class="mebal">رصيدك للمتجر <b>${NN(u.bal)}</b></span><button class="btn yellow" id="meShop">المتجر</button>` : ''}<button class="btn" id="meArt">رسوماته بالمعرض</button><button class="btn" id="meLb">الترتيب</button></div>
    </div>`, 'mepro');
    const s = document.getElementById('meShop'); if (s) s.onclick = () => shop();
    document.getElementById('meArt').onclick = () => window.open('/gallery.html?pid=' + encodeURIComponent(u.pid), '_blank');
    document.getElementById('meLb').onclick = () => board();
  }

  // ===== الترتيب =====
  const LB = { per: 'week', g: 'all' };
  async function board() {
    loading();
    let d; try { d = await fetch(`/api/lb?per=${LB.per}&g=${LB.g}`).then(r => r.json()); } catch { return ov('<div class="meload">ما قدرنا نجيب الترتيب</div>'); }
    const L = d.list, top3 = L.slice(0, 3), rest = L.slice(3);
    const games = typeof GNAME !== 'undefined' ? Object.keys(GNAME) : [];
    const pd = (x, k) => x ? `<div class="mepd p${k}" data-pid="${x.pid}">${av(x, k === 1 ? ' big' : '')}<b>${nm(x)}</b><small>${NN(x.v)}</small><div class="meblk">${N(k)}</div></div>` : `<div class="mepd p${k} empty"><div class="meblk">${N(k)}</div></div>`;
    ov(`<div class="melb"><h2>الترتيب</h2>
      <div class="metabs">${[['week', 'الأسبوع'], ['month', 'الشهر'], ['all', 'الكل']].map(([k, t]) => `<button data-per="${k}" class="${LB.per === k ? 'on' : ''}">${t}</button>`).join('')}
        <select id="meG"><option value="all">كل الألعاب</option>${games.map(g => `<option value="${g}"${LB.g === g ? ' selected' : ''}>${esc(gname(g))}</option>`).join('')}</select></div>
      ${L.length ? `<div class="mepod">${pd(top3[1], 2)}${pd(top3[0], 1)}${pd(top3[2], 3)}</div>
      <div class="melist">${rest.map((x, i) => `<button class="melr" data-pid="${x.pid}"><span class="mern">${N(i + 4)}</span>${av(x)}<b>${nm(x)}</b>${x.d ? `<span class="${x.d > 0 ? 'meup' : 'medn'}">${x.d > 0 ? '▲' : '▼'} ${N(Math.abs(x.d))}</span>` : ''}<small>مستوى ${N(x.lvl)}</small><span class="mesc">${NN(x.v)}</span></button>`).join('')}</div>` : '<div class="meempty"><p>محد لعب بهالفترة للحين، العب وكن الأول</p></div>'}
      <small class="memut">${LB.per === 'week' ? 'الأسبوع يبدأ السبت وينقفل الجمعة ١٢ بالليل، والنتيجة تنزل بروم الديسكورد' : LB.per === 'month' ? 'الشهر ينقفل آخر يوم ١٢ بالليل' : 'كل النقاط من أول ما بدأ الموقع'}</small></div>`, 'mewide');
    document.querySelectorAll('#meOv [data-per]').forEach(b => b.onclick = () => { LB.per = b.dataset.per; board(); });
    document.getElementById('meG').onchange = e => { LB.g = e.target.value; board(); };
    document.querySelectorAll('#meOv [data-pid]').forEach(b => b.onclick = () => profile(b.dataset.pid));
  }

  // ===== المتجر =====
  async function shop() {
    loading();
    const [M, u] = await Promise.all([meta(), post('/api/me', {})]).catch(() => [null, null]);
    if (!M || !u || u.none) return ov('<div class="meempty"><b>العب جولة أول</b><p>النقاط اللي تجمعها تصير رصيد تشتري فيه.</p></div>');
    const own = new Set(u.own), eq = u.eq || {}, haveB = new Set(u.b.map(x => x.id));
    const isOwn = it => own.has(it.id) || (it.only && haveB.has(it.only));
    const prev = it => it.k === 'fr' ? `<span class="nf nf-${it.id.slice(3)}">${esc(u.n)}</span>` : it.k === 'nc' ? `<span class="menc" style="color:${NCOL[it.id]}">${esc(u.n)}</span>` : `<span class="meludo ml-${it.id.slice(5)}"></span>`;
    const sec = (k, t, hint) => { const its = M.items.filter(x => x.k === k); return `<div class="mesec">${t} <small>${hint}</small></div><div class="meshop">
      <div class="meit${!eq[k] ? ' on' : ''}" data-eq="" data-k="${k}">${k === 'fr' ? `<span class="nf0">${esc(u.n)}</span>` : k === 'nc' ? `<span class="menc">${esc(u.n)}</span>` : '<span class="meludo ml-sadu"></span>'}<b>${k === 'ludo' ? 'سدو' : 'عادي'}</b><span class="mepr">${!eq[k] ? 'لابسه' : 'البس'}</span></div>
      ${its.map(it => { const o = isOwn(it); return `<div class="meit${eq[k] === it.id ? ' on' : ''}${!o && it.only ? ' lock' : ''}" ${o ? `data-eq="${it.id}" data-k="${k}"` : it.only ? '' : `data-buy="${it.id}"`}>${prev(it)}<b>${esc(it.t.replace(/^إطار |^اسم |^لودو /, ''))}</b><span class="mepr">${eq[k] === it.id ? 'لابسه' : o ? 'البس' : it.only ? 'بالبطولة بس' : NN(it.c) + ' نقطة'}</span></div>`; }).join('')}</div>`; };
    ov(`<div class="meshp"><h2>متجر التجميل</h2><div class="mebal big">رصيدك <b>${NN(u.bal)}</b> نقطة <small>(الشراء ما ينقص ترتيبك)</small></div>
      ${sec('fr', 'إطار الاسم', 'يطلع باللوبي والملف والترتيب')}${sec('nc', 'لون اسمك بالشات', '')}${sec('ludo', 'شكل رقعة اللودو', 'يتغيّر عندك أنت')}
      <div class="mebtns"><button class="btn" id="meBack">ملفي</button></div></div>`, 'mewide');
    document.getElementById('meBack').onclick = () => profile('me');
    document.querySelectorAll('#meOv [data-buy]').forEach(b => b.onclick = async () => {
      const it = M.items.find(x => x.id === b.dataset.buy); if (!confirm(`تشتري «${it.t}» بـ ${it.c} نقطة؟`)) return;
      const r = await post('/api/buy', { id: it.id }); if (r.err) return toast(r.err); try { sfx('coin'); } catch {} toast('صار عندك ' + it.t); shop();
    });
    document.querySelectorAll('#meOv [data-eq]').forEach(b => b.onclick = async () => {
      const r = await post('/api/equip', { id: b.dataset.eq || null, kind: b.dataset.k }); if (r.err) return toast(r.err);
      if (b.dataset.k === 'ludo') { try { localStorage.setItem('tludo-skin', (b.dataset.eq || 'ludo:sadu').slice(5)); } catch {} }
      shop();
    });
  }

  // ===== شرح أول مرة (بطاقات) =====
  function tut(game, force) {
    const key = 'tarteeb-tut'; let seen = {}; try { seen = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
    if (seen[game] && !force) return; const txt = typeof GHELP !== 'undefined' && GHELP[game]; if (!txt) return;
    seen[game] = 1; try { localStorage.setItem(key, JSON.stringify(seen)); } catch {}
    // نقسم الشرح لجمل ونجمعها بثلاث أو أربع بطاقات
    const sents = txt.split(/(?<=[.؟!])\s+/).map(x => x.trim()).filter(Boolean), n = Math.min(4, Math.max(1, Math.ceil(sents.length / 2))), per = Math.ceil(sents.length / n);
    const cards = Array.from({ length: n }, (_, i) => sents.slice(i * per, i * per + per).join(' ')).filter(Boolean);
    const col = (typeof LBCOL !== 'undefined' && LBCOL[game]) || '#8a5a2b';
    let i = 0;
    const draw = () => {
      ov(`<div class="metut"><h2>كيف تلعب ${esc(gname(game))}؟</h2>
        <div class="metcards">${cards.map((c, k) => `<div class="metc${k === i ? ' on' : k < i ? ' done' : ''}"><div class="metill" style="--c:${col}"><span>${N(k + 1)}</span><i></i><i></i><i></i></div><p>${esc(c)}</p></div>`).join('')}</div>
        <div class="medots">${cards.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="mebtns">${i ? '<button class="btn" id="mtPrev">السابق</button>' : ''}${i < cards.length - 1 ? '<button class="btn yellow" id="mtNext">التالي</button>' : '<button class="btn yellow" id="mtGo">فهمت، يلا</button>'}${typeof tutHas === 'function' && tutHas(game) ? '<button class="btn" id="mtVid">الشرح بالفيديو</button>' : ''}</div></div>`, 'metutov');
      const $b = id => document.getElementById(id);
      if ($b('mtPrev')) $b('mtPrev').onclick = () => { i--; draw(); };
      if ($b('mtNext')) $b('mtNext').onclick = () => { i++; draw(); };
      if ($b('mtGo')) $b('mtGo').onclick = close;
      if ($b('mtVid')) $b('mtVid').onclick = () => { close(); tutOpen(game); };
    };
    draw();
  }

  window.meProfile = profile; window.meBoard = board; window.meShop = shop; window.meTut = tut;
})();
