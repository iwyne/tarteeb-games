// عوالم الصفحة الرئيسية + شاشة البداية (زر ابدأ + اختيار الجو)
(() => {
  const html = document.documentElement;
  // [المعرّف، الاسم، الإيموجي، خلفية المعاينة، لون مميز، لون الكتابة، وصف]
  const WORLDS = [
    ['classic', 'الكلاسيكي', '🎨', '#f3ead8', '#e8362d', '#16130f', 'ورق وحبر، الستايل الأصلي'],
    ['sadu', 'السدو', '🐪', '#efe1c4', '#a3201c', '#1b1310', 'مجلس بنقشة السدو'],
    ['arcade', 'أركيد', '🕹️', '#0d0b1a', '#ffd23f', '#f4f1e8', 'صالة ألعاب ليلية'],
    ['news', 'جريدة ترتيب', '📰', '#f2efe6', '#ff4b2b', '#141414', 'عناوين وأخبار عاجلة'],
    ['toybox', 'علبة ألعاب', '🎲', '#5a3a22', '#f3c969', '#f6efe2', 'خشب ولبّاد أخضر'],
    ['bakala', 'بقالة ترتيب', '🛒', '#f6e7c8', '#d8342b', '#2b1d12', 'رفوف وفاتورة'],
    ['tv', 'قناة ترتيب', '📺', '#2a1d3a', '#ffe08a', '#ffffff', 'تلفزيون التسعينات'],
    ['airport', 'مطار ترتيب', '✈️', '#14161a', '#ffc928', '#f2f2f2', 'لوحة المغادرة'],
    ['notebook', 'دفتر الشخبطة', '✏️', '#fdfbf4', '#ef4b4b', '#1f2a7a', 'ورق دفتر وشخبطة']
  ];
  const KICK = {
    sadu: '☕ مجلس ترتيب · حيّ الله الربع', arcade: '🕹️ PLAYER 1 · جاهز؟', news: '📰 جريدة ترتيب · العدد ٢٥ · تصدر من الديسكورد',
    toybox: '♠ طاولة الليلة جاهزة', bakala: 'مفتوح ٢٤ ساعة · ألعاب طازجة كل يوم', tv: 'على الهوا · قناة ترتيب',
    airport: '✈️ مطار ترتيب الدولي · الصالة ٢٥', notebook: '✏️ دفتر ألعاب الشلّة الرسمي'
  };
  const TICK = '⚡ عاجل: جوابك الترتيب نزلت رسمياً · المافيا تضرب من جديد · المندس ما زال طليق · رقم قياسي في سبّاق الكتابة · ٢٦ لعبة بدون تحميل ⚡';
  const GC = { uno: '#d8342b', codes: '#d6452f', hive: '#d99a1e', liars: '#7a4ee0', flip: '#c2367a', chess: '#7a5434', mimic: '#c93c78', auction: '#8a5a1c', jwb: '#0f8b8d',
    feud: '#1c3f8f', flags: '#2a5bd7', phone: '#13a3b5', fib: '#b8281f', bomb: '#c48a12', mafia: '#5b1b2a', haunt: '#3a2140', sus: '#2b3a8f', outside: '#1f8f52',
    typing: '#e0761a', jackaroo: '#1a8a4c', draw: '#2a5bd7', baloot: '#1d6b47', cars: '#3a3c43', rich: '#1fa35c', boxing: '#2b1f45', brawl: '#3b1e5c' };
  const FLIGHT = { uno: 'UNO7', codes: 'CODE', hive: 'HIVE', liars: 'LIAR', flip: 'FLIP', chess: 'CHSS', mimic: 'VOIC', auction: 'BIDS', jwb: 'JWB1', feud: 'FAML',
    flags: 'FLAG', phone: 'TELE', fib: 'LIES', bomb: 'BOOM', mafia: 'MFIA', haunt: 'GHST', sus: 'SUS4', outside: 'OUTS', typing: 'TYPE', jackaroo: 'JACK', draw: 'DRAW', cars: 'CHSE', rich: 'RICH', boxing: 'KO25', brawl: 'FZ26', baloot: 'BLOT' };
  const get = () => { try { return JSON.parse(localStorage.getItem('tarteeb-world')) || 'classic'; } catch { return 'classic'; } };
  const save = w => { try { localStorage.setItem('tarteeb-world', JSON.stringify(w)); } catch {} };

  // عناصر الزينة (تنعرض بس حسب الجو من الـCSS)
  const top = document.querySelector('header.top');
  if (top && !document.querySelector('.wdeco')) top.insertAdjacentHTML('beforebegin', '<div class="wdeco band" aria-hidden="true"></div><div class="wdeco awn" aria-hidden="true"></div>');
  const hero = document.querySelector('#home .hero');
  const kick = document.createElement('div'); kick.className = 'wkick'; if (hero) hero.prepend(kick);
  const ht = document.querySelector('#home .home-top');
  const tk = document.createElement('div'); tk.className = 'wticker'; tk.setAttribute('aria-hidden', 'true'); tk.innerHTML = `<span>${TICK}</span>`;
  if (ht) ht.after(tk);
  document.querySelectorAll('.game[data-game]').forEach(a => { const k = a.dataset.game; if (GC[k]) a.style.setProperty('--gc', GC[k]); if (FLIGHT[k]) a.dataset.flight = FLIGHT[k]; });

  function apply(w) {
    if (!WORLDS.some(x => x[0] === w)) w = 'classic';
    if (w === 'classic') delete html.dataset.world; else html.dataset.world = w;
    kick.textContent = KICK[w] || '';
    document.querySelectorAll('.sp-w').forEach(b => b.classList.toggle('on', b.dataset.w === w));
    const W = WORLDS.find(x => x[0] === w), sp = document.getElementById('splash');
    if (sp && W) { sp.style.setProperty('--sbg', W[3]); sp.style.setProperty('--sac', W[4]); sp.style.setProperty('--sfg', W[5]); sp.style.setProperty('--sgt', ['arcade', 'toybox', 'tv', 'airport'].includes(w) ? '#16130f' : '#fff'); }
    const mt = document.querySelector('meta[name=theme-color]'); if (mt && W && w !== 'classic') mt.content = W[3];
    return w;
  }
  window.setWorld = w => save(apply(w));

  // ---- شاشة البداية ----
  const sp = document.getElementById('splash');
  let cur = apply(get());
  if (!sp) return;
  const grid = document.getElementById('spW');
  grid.innerHTML = WORLDS.map(w => `<button type="button" class="sp-w" data-w="${w[0]}"><span class="pv" style="background:${w[3]};--pa:${w[4]}">${w[2]}</span>${w[1]}<small>${w[6]}</small></button>`).join('');
  grid.querySelectorAll('.sp-w').forEach(b => b.onclick = () => { cur = apply(b.dataset.w); try { sfx('pop'); } catch {} });
  apply(cur);
  const hide = () => {
    if (sp.classList.contains('out')) return;
    save(cur); sp.classList.add('out');
    try { sessionStorage.setItem('tarteeb-splash', '1'); } catch {}
    try { sfx('whoosh'); } catch {}
    setTimeout(() => { sp.hidden = true; sp.classList.remove('reopen'); }, 650);
  };
  document.getElementById('spGo').onclick = hide;
  sp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.target.closest('.sp-w')) hide(); });
  // ملاحظة: .nosplash تخفي الشاشة بالـCSS (لو انفتحت قبل بنفس الجلسة) فلازم نشيلها
  const open = () => { html.classList.remove('nosplash'); cur = get(); apply(cur); sp.hidden = false; sp.classList.add('reopen', 'out'); requestAnimationFrame(() => requestAnimationFrame(() => sp.classList.remove('out'))); sp.scrollTop = 0; };
  const wb = document.getElementById('worldBtn'); if (wb) wb.onclick = open;
  // داخل الديسكورد أو رابط دعوة لغرفة: ما نوقف اللاعب
  const skip = html.classList.contains('nosplash') || new URLSearchParams(location.search).get('room');
  if (skip) sp.hidden = true;
  else setTimeout(() => { const g = document.getElementById('spGo'); if (g) g.focus({ preventScroll: true }); }, 1300);
})();
