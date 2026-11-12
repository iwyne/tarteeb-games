// واجهات الألعاب الثانية: كلمة السر، خلية الحروف، الكذابين الترتيب
const GNAME = { uno: 'أونو', codes: 'كلمة السر', hive: 'خلية الحروف', liars: 'الكذابين الترتيب', outside: 'برا السالفة', typing: 'سبّاق الكتابة', jackaroo: 'جاكارو', draw: 'رسم وخمّن', flip: 'أونو فليب', sus: 'المندس', haunt: 'البيت المسكون', mafia: 'المافيا' };
const GINFO = { mafia: 'من ٥ إلى ١٦ لاعب (والبوتات تكمّل)', haunt: 'من ٢ إلى ١٠ لاعبين (ثري دي، والبوتات تكمّل)', sus: 'من ٤ إلى ١٢ لاعب (والبوتات تكمّل العدد)', flip: 'من ٢ إلى ٨ لاعبين', uno: 'من ٢ إلى ٨ لاعبين', codes: 'من ٤ إلى ١٠ لاعبين، فريقين', hive: 'من ٢ إلى ١٠ لاعبين، فريقين', liars: 'من ٢ إلى ٨ لاعبين', outside: 'من ٣ إلى ١٠ لاعبين', typing: 'من ٢ إلى ١٠ لاعبين', jackaroo: '٤ لاعبين بالضبط، فريقين (شريكك قبالتك)', draw: 'من ٢ إلى ١٠ لاعبين' };
const BOTGAMES = ['mafia', 'uno', 'hive', 'liars', 'jackaroo', 'outside', 'typing', 'flip', 'sus', 'haunt'];
const GHELP = {
  mafia: 'مدينة فيها مافيا متخفين بين الناس. بالبداية كل واحد يشوف كرت دوره بالسر. بالليل: المافيا يختارون ضحية (ويتكلمون بشات سري)، الطبيب يحمي شخص، المحقق يفتّش على شخص ويعرف هو مافيا ولا لا (الأب الروحي يطلع بريء)، والقناص عنده طلقة وحدة باللعبة. الصبح تطلع جريدة المدينة بأسماء الضحايا. بالنهار تتناقشون بصوت الديسكورد أو بالشات، وبعدها تصوّتون على شخص تطردونه. العمدة يقدر يكشف نفسه وصوته يصير بصوتين، والمهرج يفوز لو المدينة صوّتت عليه. المدينة تفوز لو طلّعت كل المافيا، والمافيا تفوز لو صار عددهم نفس الباقين.',
  haunt: 'لعبة رعب ثري دي بمنظور العين داخل قصر كبير بأربع طوابق (قبو، أرضي، علوي، علّية). واحد منكم شبح (اثنين لو كنتم ٧ أو أكثر) والباقين ناجين معهم كشافات. القصة بمراحل: دوّروا ٣ فيوزات وركّبوها بصندوق الكهرباء في القبو، بعدها المفاتيح تفتح مكتب الجد ثم الغرفة الكبيرة ثم العلّية، جيبوا ٤ قطع ملعونة للمذبح بالعلّية وسوّوا الطقس، وبعدها ينفتح الباب الأمامي وتهربون. الكشاف لو انوجّه على الشبح يحرقه ويجمّده، بس البطارية تخلص. أول مرة يمسكك الشبح تنحبس بقفص القبو وربعك يقدرون يطلّعونك، والمرة الثانية تموت. تقدر تختبي بالدواليب. الشبح يشوف بالظلام، يصرخ عشان يطفّي الكشافات، وينتقل بين المرايا. الكمبيوتر: WASD للمشي، الماوس للف، Shift للركض، F الكشاف، E استخدم، M الخريطة، Q صرخة الشبح. الجوال: يسار الشاشة للمشي (اسحب للآخر عشان تركض)، ويمينها للف. اللعبة تاخذ قريب نص ساعة، والناجين يفوزون لو هرب نصهم أو أكثر.',
  sus: 'أنتم طاقم سفينة وبينكم مندسين (١–٣ حسب اختيار المضيف). امشِ بالأسهم/WASD أو اسحب على الشاشة. ما تشوف إلا اللي قدامك، والغرف الثانية ظلام. الطاقم يخلّصون مهامهم (العلامات الصفراء)، والمندس يقتل ويخرّب ويتنقّل بالفتحات. غرفة المراقبة فيها كاميرات للممرات. لو لقيت جثة بلّغ، أو اضغط زر الطوارئ بالكافتيريا. وبطور الدكتور: الدكتور يعطي درع لشخص واحد كل جولة يحميه من القتل لين الاجتماع الجاي. الطاقم يفوز لو خلّصوا المهام أو طردوا المندسين، والمندس يفوز لو صار عددهم نفس الطاقم أو انفجر المفاعل.',
  flip: 'أونو بوجهين: فاتح (أحمر/أصفر/أخضر/أزرق) وغامق (وردي/تركوازي/برتقالي/بنفسجي). ورقة «فليب» تقلب كل اللعبة للوجه الثاني. الفاتح: +١ و+٢ ملوّن، والغامق: +٥ و«منع الكل» (تلعب مرة ثانية) و«ملوّن سحب لون» (الخصم يسحب لين يطلع له اللون). +٢ والسحب لون ما تنلعب إلا لو ما عندك لون الطاولة، ومن بعدك يقدر يتحدّاك. الورقة اللي تسحبها ما تنلعب. لو بقي عندك ورقة اضغط UNO! وإلا يمسكونك ويسحبك ٢.',
  uno: 'تخلّص من أوراقك قبل الكل. العب ورقة نفس اللون أو نفس الرقم/الرمز. لما يبقى عندك ورقة وحدة اضغط UNO! وإلا يمسكونك ويسحبك +٢. مع «تراكم السحب» تقدر ترد +٢ على +٢ و+٤ على +٤.',
  codes: 'فريقين (أ وب). كل فريق له قائد يشوف ألوان الكلمات السرية ويعطي تلميح بكلمة وحدة + رقم. الفريق يخمّن كلماته. أول فريق يكشف كل كلماته يفوز، واللي يضغط على الكلمة القاتلة يخسر فريقه.',
  hive: 'لوحة خلايا حروف. الأحمر يوصّل بالطول (من فوق لتحت) والأزرق بالعرض (من اليمين لليسار). اختر خلية، جاوب على سؤال يبدأ جوابه بحرف الخلية وتصير لفريقك، واللي يكسب خلية يكمّل. لو غلطت الفريق الثاني يسرقها، ولو ما أحد جاوب تنحرق. إذا ما أحد وصّل يفوز اللي جاوب أكثر.',
  liars: 'كل واحد يلعب ١–٣ أوراق مقلوبة ويقول إنها الورقة المطلوبة (ملك أو ملكة أو آص). اللي بعده يصدّق أو يقول «كذّاب!». اللي يخسر يسحب زناد المسدس (روليت: ٦ خانات وفيها رصاصة وحدة)، وآخر واحد ينجو يفوز.',
  outside: 'الكل يعرف الفئة والكلمة السرية إلا واحد (برا السالفة). كل واحد يسأل لاعب ثاني سؤال بصوته عن الكلمة بدون ما يقولها، والمسؤول يجاوب ثم يسأل غيره. بعد ما يخلص الكل تصوّتون على مين برا السالفة. لو انكشف يختار الكلمة من ٨ خيارات.',
  typing: 'يطلع نص وأسرع واحد يكتبه صح ياخذ نقطة. أول واحد يوصل الهدف يفوز. ما يهم التشكيل.',
  jackaroo: 'أنت وشريكك (قبالتك) تدخلون الـ٨ كرات للبيت. آص/شايب يطلّعون كرة، الباقي يحرّك بعدده، الولد يبدّل، الـ٤ رجوع، الـ٥ تحرّك أي كرة، الـ٧ تقسّمها. اللي تنزل عليه كرتك ينأكل.',
  draw: 'كل لاعب يرسم كلمة سرية والباقي يخمّنون بالكتابة. كل ما خمّنت أسرع ياخذ نقاط أكثر، والرسّام ياخذ نقاط على كل واحد يخمّن. الأعلى نقاط يفوز.'
};
const TN = ['أ', 'ب'], TCOL = ['#e8362d', '#2a5bd7'];
const me2 = () => S.players.find(p => p.id === S.me);
const nameOf = id => (S.players.find(p => p.id === id) || {}).name || '؟';
const cd2 = () => Math.max(0, Math.ceil((S.left - (Date.now() - S.t0)) / 1000));

// ---- اختيار اللعبة بالرئيسية ----
let SEL = 'uno';
function pickGame(g) {
  SEL = g;
  $$('.game[data-game]').forEach(a => a.classList.toggle('sel', a.dataset.game === g));
  $('#gname').textContent = GNAME[g]; $('#ginfo').textContent = GINFO[g];
}
$$('.game[data-game]').forEach(a => a.onclick = () => pickGame(a.dataset.game));
pickGame('uno');

// ---- اللوبي ----
function renderTeamsOther(isHost) {
  $('#teamrow').hidden = !isHost || !S.teams;
  $('#teamBtn').hidden = true; $('#shuffleBtn').hidden = false;
  const sl = $('#scoreline'); sl.hidden = !(S.score[0] + S.score[1] > 0);
  sl.textContent = `النتيجة — فريق أ ${S.score[0]} : ${S.score[1]} فريق ب`;
  const tip = { codes: ' — كل فريق له قائد (أول واحد فيه) يشوف الألوان السرية ويعطي التلميحات', hive: ' — الأحمر يوصّل من فوق لتحت، والأزرق من اليمين لليسار', liars: '', jackaroo: ' — شريكك قبالتك. لما تخلّص كراتك تلعب بكرات شريكك' }[S.game];
  if (S.teams) $('#hint').textContent += tip + ' — زر «اخلط الفرق» يبدّل الجلسة';
  else if (S.game === 'liars') $('#hint').textContent += ' — تلعب أوراق مقلوبة وتكذب، واللي ينكشف يسحب الزناد (روليت)';
}
$('#quit2').onclick = () => window.quitGame();
$('#leave2b').onclick = () => send({ t: 'leave' });
$('#again2').onclick = () => send({ t: 'again' });
$('#mute2').textContent = sfx.on() ? '🔊' : '🔇';
$('#mute2').onclick = () => { $('#mute2').textContent = sfx.toggle() ? '🔊' : '🔇'; $('#mute').textContent = $('#mute2').textContent; };
$('#specBtn2').onclick = () => { const p = $('#specPanel2'); p.hidden = !p.hidden; if (!p.hidden) drawSpecPanel2(); };
function drawSpecPanel2() {
  const host = S.players.find(p => p.h), amHost = !S.spec && host && host.id === S.me;
  $('#specPanel2').innerHTML = '<b>المتفرجين</b>' + S.specs.map(p => `<div>${esc(p.name)}${p.id === S.me ? ' <em>(أنت)</em>' : ''}${amHost ? `<button class="kick" data-id="${p.id}" title="طرد">✕</button>` : ''}</div>`).join('');
}

// نحفظ اللي كتبه اللاعب لما تنعاد الرسمة
function keep(el, fn) {
  const saved = {}; el.querySelectorAll('input,select').forEach(i => { saved[i.id] = [i.value, document.activeElement === i]; });
  fn();
  el.querySelectorAll('input,select').forEach(i => { const s = saved[i.id]; if (s) { i.value = s[0]; if (s[1]) { i.focus(); try { i.setSelectionRange(i.value.length, i.value.length); } catch {} } } });
}

function renderOther() {
  const m = me2(), mt = m ? m.tm : null;
  $('#g2name').textContent = GNAME[S.game];
  $('#g2sub').textContent = S.spec ? 'تتفرّج' : !S.teams ? '' : `أنت مع فريق ${TN[mt]}`;
  $('#specBtn2').hidden = !S.specs.length; $('#specN2').textContent = S.specs.length;
  if (!S.specs.length) $('#specPanel2').hidden = true; else if (!$('#specPanel2').hidden) drawSpecPanel2();
  const body = $('#g2body');
  if (body.dataset.built && body.dataset.built !== S.game) { body.innerHTML = ''; body.dataset.built = ''; }
  body.className = 'g2body ' + S.game;
  keep(body, () => ({ codes: renderCodes, hive: renderHive, liars: renderLiars, outside: renderOutside, typing: renderTyping, jackaroo: renderJack, draw: renderDraw, flip: renderFlip, sus: renderSus, haunt: renderHaunt, mafia: renderMafia })[S.game](body, mt));
  // نهاية الجولة
  const over = S.phase === 'over';
  $('#over2').hidden = !over;
  if (over) {
    const g = S.g || {}, amSpy = g.role === 'spy';
    if (S.game === 'haunt') $('#winner2').textContent = (g.win === 'surv' ? 'فاز الناجين 🔦' : 'فاز الشبح 👻') + (S.spec || !g.me ? '' : (g.win === 'ghost') === !!g.me.ghost ? ' — فزت!' : ' — خسرت');
    else if (S.game === 'mafia') $('#winner2').textContent = (g.win === 't' ? 'فازت المدينة 🏙️' : g.win === 'm' ? 'فازت المافيا 🎩' : 'فاز المهرج 🃏') + (S.spec || !g.me ? '' : (g.win === 'j' ? g.jWin === S.me : g.win === (MROLE[g.me.role] || {}).team) ? ' — فزت!' : ' — خسرت');
    else if (S.game === 'sus') $('#winner2').textContent = (g.win === 'crew' ? 'فاز الطاقم 🧑‍🚀' : 'فاز المندسين 😈') + (S.spec || !g.me ? '' : (g.win === 'imp') === !!g.me.imp ? ' — فزت!' : ' — خسرت');
    else if (S.game === 'outside') $('#winner2').textContent = S.spec ? (g.spyWins ? 'فاز برا السالفة' : 'فاز اللي داخل السالفة') : g.spyWins === amSpy ? 'فزت! 🎉' : (g.spyWins ? 'برا السالفة نجا!' : 'انكشف برا السالفة!');
    else $('#winner2').textContent = S.teams && S.winTeam != null ? (S.spec ? 'فاز ' + S.winner : S.winTeam === mt ? 'فاز فريقك! 🎉' : 'فاز ' + S.winner) : (S.winner === (m && m.name) ? 'فزت! 🎉' : S.winner === 'انتهت اللعبة' || S.winner === 'تعادل' ? S.winner : 'فاز ' + S.winner);
    const wt = $('#winteam2'); wt.hidden = !(S.teams && S.winTeam != null);
    if (S.game === 'sus') { wt.hidden = false; wt.innerHTML = susOverHtml(g); }
    else if (S.game === 'haunt') { wt.hidden = false; wt.innerHTML = hauntOverHtml(g); }
    else if (S.game === 'mafia') { wt.hidden = false; wt.innerHTML = mafiaOverHtml(g); }
    else if (!wt.hidden) wt.textContent = 'الفائزين: ' + S.players.filter(p => p.tm === S.winTeam).map(p => p.name).join(' و ');
    $('#board2').innerHTML = [...S.players].sort((a, b) => b.w - a.w).map(p => `<li${p.id === S.me ? ' class="me"' : ''}><span>${esc(p.name)}</span><b>🏆 ${p.w}</b></li>`).join('');
    const host = S.players.find(p => p.h);
    $('#again2').hidden = S.spec || !(host && host.id === S.me);
    $('#waitHost2').hidden = !$('#again2').hidden;
  }
  fx2();
  tick2();
}
const logHtml = () => `<div class="g2log">${S.log.slice(-2).map(esc).join('<br>')}</div>`;

// ================= كلمة السر =================
function renderCodes(body, mt) {
  const g = S.g, over = S.phase === 'over';
  const mine = mt === g.turn, spy = g.role === 'spy';
  const cls = c => c.open ? 'open k' + (c.k === -1 ? 'n' : c.k === -2 ? 'x' : c.k) : c.k !== null ? 'hint k' + (c.k === -1 ? 'n' : c.k === -2 ? 'x' : c.k) : '';
  let mid;
  if (over) mid = `<div class="clue">${esc(S.winner)} فاز</div>`;
  else if (g.sub === 'clue') {
    mid = mine && spy ? `<form class="clueform" id="clueForm"><input id="clueWord" maxlength="20" placeholder="كلمة وحدة بس" autocomplete="off"><select id="clueN">${[...Array(10).keys()].map(i => `<option${i === 2 ? ' selected' : ''}>${i}</option>`).join('')}</select><button class="btn green sm">أرسل التلميح</button></form>`
      : `<div class="clue">ننتظر قائد <b style="color:${TCOL[g.turn]}">فريق ${TN[g.turn]}</b> يعطي التلميح…</div>`;
  } else mid = `<div class="clue">التلميح: <b class="cw nt">${esc(g.clue.word)}</b> <i class="cn">${g.clue.n}</i> <span class="muted">— باقي ${g.left} ${g.left === 1 ? 'محاولة' : 'محاولات'}</span>${g.can ? ' <button id="endTurn" class="btn sm">أنهِ الدور</button>' : ''}</div>`;
  body.innerHTML = `
    <div class="cbar"><span class="tc t0${g.turn === 0 && !over ? ' on' : ''}">فريق أ <b>${g.remain[0]}</b></span><span class="role">${spy ? 'أنت قائد — تشوف الألوان' : S.spec ? 'تتفرّج' : 'خمّن مع فريقك'}</span><span class="tc t1${g.turn === 1 && !over ? ' on' : ''}"><b>${g.remain[1]}</b> فريق ب</span></div>
    ${mid}
    <div class="cboard">${g.cards.map((c, i) => `<button class="cc ${cls(c)}${g.can && !c.open ? ' go' : ''}" data-i="${i}"${g.can && !c.open ? '' : ' tabindex="-1"'}><span class="nt">${esc(c.w)}</span></button>`).join('')}</div>
    ${logHtml()}`;
  body.querySelectorAll('.cc.go').forEach(b => b.onclick = () => send({ t: 'guess', i: +b.dataset.i }));
  const f = $('#clueForm'); if (f) f.onsubmit = e => { e.preventDefault(); const w = $('#clueWord').value.trim(); if (!w) return toast('اكتب التلميح'); send({ t: 'clue', word: w, n: +$('#clueN').value }); $('#clueWord').value = ''; };
  const et = $('#endTurn'); if (et) et.onclick = () => send({ t: 'end' });
}

// ================= خلية الحروف =================
const HS = 34, R3 = Math.sqrt(3);
const hexPts = (cx, cy, a0 = 30) => [0, 1, 2, 3, 4, 5].map(k => { const a = (a0 + 60 * k) * Math.PI / 180; return `${(cx + HS * Math.cos(a)).toFixed(1)},${(cy + HS * Math.sin(a)).toFixed(1)}`; }).join(' ');
const vtx = (cx, cy, deg) => { const a = deg * Math.PI / 180; return [(cx + HS * Math.cos(a)).toFixed(1), (cy + HS * Math.sin(a)).toFixed(1)]; };
const hc = (r, c) => [HS * R3 * (c + r / 2) + HS * R3 / 2 + 8, HS * 1.5 * r + HS + 8];
function renderHive(body, mt) {
  const g = S.g, over = S.phase === 'over';
  const W = HS * R3 * 7 + 16, H = HS * 1.5 * 4 + HS * 2 + 16;
  const myPick = !S.spec && g.sub === 'pick' && mt === g.turn && !over;
  let cells = '', edges = '';
  g.cells.forEach((c, i) => {
    const r = i / 5 | 0, cc = i % 5, [x, y] = hc(r, cc);
    const fill = c.o === 0 ? TCOL[0] : c.o === 1 ? TCOL[1] : c.o === 2 ? '#8b8478' : 'var(--surf2)';
    const sel = g.cell === i;
    cells += `<g class="hx${c.o === null && myPick ? ' go' : ''}${sel ? ' sel' : ''}" data-i="${i}"><polygon points="${hexPts(x, y)}" style="fill:${sel ? '#ffc928' : fill}"/><text x="${x}" y="${y + 1}" style="fill:${c.o !== null && !sel ? '#fff' : sel ? '#16130f' : 'var(--ink)'}">${c.o === 2 ? '✕' : esc(c.l)}</text></g>`;
  });
  const line = (pts, col) => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
  let top = [], bot = [], lef = [], rig = [];
  for (let c = 0; c < 5; c++) { const [x, y] = hc(0, c); top.push(vtx(x, y, 210), vtx(x, y, 270), vtx(x, y, 330)); const [x2, y2] = hc(4, c); bot.push(vtx(x2, y2, 150), vtx(x2, y2, 90), vtx(x2, y2, 30)); }
  for (let r = 0; r < 5; r++) { const [x, y] = hc(r, 0); lef.push(vtx(x, y, 210), vtx(x, y, 150), vtx(x, y, 90)); const [x2, y2] = hc(r, 4); rig.push(vtx(x2, y2, 270), vtx(x2, y2, 330), vtx(x2, y2, 30)); }
  edges = line(top, TCOL[0]) + line(bot, TCOL[0]) + line(lef, TCOL[1]) + line(rig, TCOL[1]);
  let panel;
  if (over) panel = `<div class="hq"><b>${g.end === 'tie' ? 'تعادل — ما أحد وصّل والعدد متساوي' : g.end === 'count' ? esc(S.winner) + ' فاز — ما أحد وصّل وجاوب أكثر (' + g.counts[S.winTeam] + ' مقابل ' + g.counts[1 - S.winTeam] + ')' : esc(S.winner) + ' وصّل الخلية!'}</b></div>`;
  else if (g.sub === 'pick') panel = `<div class="hq"><span class="tc t${g.turn} on">فريق ${TN[g.turn]}</span> يختار حرف ${myPick ? '— اضغط على خلية' : ''} <span class="cd2"></span></div>`;
  else {
    const mineA = !S.spec && mt === g.answering;
    panel = `<div class="hq big"><div class="hl nt">${esc(g.q.l)}</div><div class="qt nt">${esc(g.q.q)}</div>
      <div class="who"><span class="tc t${g.answering} on">${g.sub === 'steal' ? 'سرقة! ' : ''}يجاوب فريق ${TN[g.answering]}</span> <span class="cd2"></span></div>
      ${mineA ? `<form id="ansForm" class="clueform"><input id="ansIn" maxlength="40" placeholder="الجواب يبدأ بحرف ${esc(g.q.l)}" autocomplete="off"><button class="btn green sm">جاوب</button></form>` : '<div class="muted">فريقك ينتظر…</div>'}</div>`;
  }
  const team = t => `<div class="hteam t${t}"><b>فريق ${TN[t]}</b> ${S.players.filter(p => p.tm === t).map(p => `<span class="pchip" data-id="${p.id}">${p.av ? esc(p.av) + ' ' : ''}${esc(p.name)}${p.w ? ` <i>🏆${p.w}</i>` : ''}</span>`).join('')}</div>`;
  body.innerHTML = `${team(0)}${team(1)}
    <svg class="hboard" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}">${edges}${cells}</svg>
    <div class="hint2">🔴 الأحمر يوصل بالطول (من فوق لتحت) &nbsp;•&nbsp; 🔵 الأزرق يوصل بالعرض (من اليمين لليسار) &nbsp;•&nbsp; اللي يكسب خلية يكمّل</div>
    ${panel}${logHtml()}`;
  body.querySelectorAll('.hx.go').forEach(el => el.onclick = () => send({ t: 'pick', i: +el.dataset.i }));
  const f = $('#ansForm'); if (f) { f.onsubmit = e => { e.preventDefault(); const t = $('#ansIn').value.trim(); if (!t) return; send({ t: 'answer', text: t }); $('#ansIn').value = ''; }; }
}


// ---- المسدس (روليت) ----
let gunSeen = '';
function gunSvg(pulls, hit) {
  const ch = [];
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 - 90) * Math.PI / 180, x = 120 + 44 * Math.cos(a), y = 132 + 44 * Math.sin(a);
    let inner = '<circle r="15" fill="#16130f"/>';
    if (hit && k === pulls - 1) inner = '<circle r="15" fill="#16130f"/><circle r="11" fill="#e0a526" stroke="#7a5410" stroke-width="2"/><circle r="4" fill="#fff3b0"/>';
    else if (k < pulls) inner = '<circle r="15" fill="#3b372f"/><path d="M-7-7L7 7M7-7L-7 7" stroke="#8b8478" stroke-width="3" stroke-linecap="round"/>';
    ch.push(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${inner}</g>`);
  }
  return `<svg class="gunsvg" viewBox="0 0 240 250" aria-hidden="true">
    <ellipse cx="124" cy="240" rx="82" ry="8" fill="rgba(0,0,0,.18)"/>
    <rect x="90" y="196" width="60" height="46" rx="14" fill="#8a5a2b" stroke="#16130f" stroke-width="5"/>
    <circle cx="120" cy="38" r="27" fill="#aeb4bf" stroke="#16130f" stroke-width="5"/>
    <circle cx="120" cy="38" r="12" fill="#16130f"/><circle cx="115" cy="33" r="3" fill="#6b7280"/>
    <rect x="112" y="60" width="16" height="22" fill="#aeb4bf" stroke="#16130f" stroke-width="4"/>
    <g class="cyl" style="transform-origin:120px 132px">
      <circle cx="120" cy="132" r="78" fill="#c9ced8" stroke="#16130f" stroke-width="6"/>
      <circle cx="120" cy="132" r="68" fill="none" stroke="#8d94a3" stroke-width="3"/>
      ${ch.join('')}
      <circle cx="120" cy="132" r="13" fill="#8d94a3" stroke="#16130f" stroke-width="4"/>
    </g>
  </svg>`;
}

// ================= الكذابين الترتيب =================
const LNAME = { K: 'ملك', Q: 'ملكة', A: 'آص', J: 'جوكر' }, LSYM = { K: '♚', Q: '♛', A: 'A', J: '★' };
let lsel = new Set();
const lcard = (t, extra = '') => `<span class="lc c${t}${extra}"><b>${LSYM[t]}</b><small>${LNAME[t]}</small></span>`;
function renderLiars(body) {
  const g = S.g, over = S.phase === 'over', myTurn = g.turn === S.me && g.sub === 'play' && !over;
  lsel = new Set([...lsel].filter(id => g.hand.some(c => c.id === id)));
  if (!myTurn) lsel.clear();
  const chips = S.players.map(p => {
    const q = g.pl.find(x => x.id === p.id) || {}, risk = 6 - (q.pulls || 0);
    return `<div class="lp${q.alive ? '' : ' dead'}${g.turn === p.id && g.sub === 'play' && !over ? ' cur' : ''}${p.on ? '' : ' off'}" data-id="${p.id}">
      <div class="av" style="background:${PAL[S.players.indexOf(p) % 4]};color:${S.players.indexOf(p) % 4 === 3 ? '#16130f' : '#fff'}">${q.alive ? face(p) : '💀'}</div>
      <div class="nm">${esc(p.name)}${p.w ? ` <i>🏆${p.w}</i>` : ''}</div>
      ${q.alive ? `<div class="backs">${'<i></i>'.repeat(Math.min(q.n, 6))}<span class="cnt">${q.n}</span></div><div class="risk" title="خطر الرصاصة">🔫 <bdi dir="ltr">1/${risk}</bdi></div>` : '<div class="risk">طلع</div>'}
      ${g.turn === p.id && g.sub === 'play' && !over ? '<div class="arrow"><b class="cd2"></b>▼</div>' : ''}</div>`;
  }).join('');
  let center;
  const res = g.result;
  if (res && g.sub === 'result') {
    center = `<div class="lres"><div class="rl">${esc(nameOf(res.caller))} قال «كذّاب!» على ${esc(nameOf(res.liar))}</div>
      <div class="rc">${res.cards.map((t, i) => lcard(t, ' flip" style="animation-delay:' + i * 150 + 'ms')).join('')}</div>
      <div class="rv ${res.truthful ? 'tr' : 'ly'}">${res.truthful ? 'كان صادق!' : 'فعلاً كذّاب!'}</div>
      <div class="rb">${esc(nameOf(res.loser))} يسحب الزناد (${res.pulls}/6): <b>${res.hit ? '💥 بووم! طلع' : 'كليك… نجا ✅'}</b></div></div>`;
  } else {
    center = `<div class="ltable"><div class="need">الورقة المطلوبة ${lcard(g.table)}</div>
      <div class="pile">${g.pile ? `<span class="pc">${Math.min(g.pile, 8) ? '<i></i>'.repeat(Math.min(g.pile, 8)) : ''}</span> ${g.pile} ورقة مقلوبة` : 'الطاولة فاضية'}</div>
      <div class="lastp">${g.last ? `${esc(nameOf(g.last.by))} لعب ${g.last.n} وقال: <b>${LNAME[g.table]}</b>` : ''}</div>
      <div class="turnl">${over ? '' : myTurn ? (g.must ? 'لازم تتهمه!' : 'دورك!') : `دور ${esc(nameOf(g.turn))}`}</div></div>`;
  }
  const hand = g.hand.map(c => `<button class="lc c${c.t}${lsel.has(c.id) ? ' sel' : ''}" data-id="${c.id}"${myTurn && !g.must ? '' : ' disabled'}><b>${LSYM[c.t]}</b><small>${LNAME[c.t]}</small></button>`).join('');
  const acts = myTurn ? `${g.must ? '' : `<button id="putBtn" class="btn green"${lsel.size ? '' : ' disabled'}>العب ${lsel.size ? lsel.size + ' ' + (lsel.size > 1 ? 'أوراق' : 'ورقة') : 'المحدد'}</button>`}${g.last ? '<button id="callBtn" class="btn red">كذّاب! ☝️</button>' : ''}` : '';
  const resNow = g.sub === 'result' && res ? res : null, myq = g.pl.find(x => x.id === S.me) || {};
  const gkey = resNow ? [resNow.loser, resNow.pulls, resNow.cards.join('')].join('-') : '', gAnim = !!resNow && gkey !== gunSeen;
  if (resNow) gunSeen = gkey; else if (!over) gunSeen = '';
  const gunPulls = resNow ? resNow.pulls : (myq.pulls || 0), imLoser = resNow && resNow.loser === S.me;
  const gunBox = S.spec || (!resNow && !myq.alive) || over ? '' : `<div class="gunbox${resNow ? ' live' : ''}${gAnim ? ' anim' : ''}${resNow && resNow.hit ? ' hit' : ''}${imLoser ? ' mine' : ''}">
      <div class="gunin"><div class="gunwrap">${gunSvg(gunPulls, resNow && resNow.hit)}</div>
      <div class="guntxt">${resNow ? (imLoser ? 'المسدس عليك! 😰' : 'المسدس على ' + esc(nameOf(resNow.loser))) : 'مسدسك — خطر الرصاصة <bdi dir="ltr">1/' + (6 - (myq.pulls || 0)) + '</bdi>'}</div>
      ${gAnim ? `<div class="gflash ${resNow.hit ? 'bang' : 'click'}"></div>` : ''}</div>`;
  body.innerHTML = `<div class="lrow">${chips}</div>${center}
    <div class="lhand">${S.spec ? '<div class="spectag2">أنت تتفرّج 👁</div>' : !g.alive ? '<div class="spectag2">طلعت من اللعبة، تتفرّج 👁</div>' : `<div class="acts">${acts}</div><div class="hand2">${hand}</div>`}</div>${gunBox}${logHtml()}`;
  body.querySelectorAll('.hand2 .lc').forEach(b => b.onclick = () => {
    const id = +b.dataset.id; if (lsel.has(id)) lsel.delete(id); else if (lsel.size < 3) lsel.add(id); else toast('أقصى شي ٣ أوراق');
    sfx('pop'); renderLiars(body);
  });
  const pb = $('#putBtn'); if (pb) pb.onclick = () => { send({ t: 'put', ids: [...lsel] }); lsel.clear(); };
  const cb = $('#callBtn'); if (cb) cb.onclick = () => { send({ t: 'call' }); lsel.clear(); };
}

// ---- مؤثرات وأصوات ----
function fx2() {
  const p = prevS, s = S; if (!p || !s || p.game !== s.game) return;
  const g = s.g, pg = p.g; if (!g || !pg) return;
  if (s.game === 'liars') {
    if (g.turn === s.me && pg.turn !== s.me && g.sub === 'play') sfx('turn');
    if (g.sub === 'result' && pg.sub !== 'result') { [0, 140, 280, 420, 560, 700].forEach(t => setTimeout(() => sfx('tick'), t)); setTimeout(() => sfx(g.result.hit ? 'bang' : 'gclick'), 1000); }
    else if (g.pile > pg.pile) sfx('card');
  } else if (s.game === 'codes') {
    if (g.cards.filter(c => c.open).length > pg.cards.filter(c => c.open).length) sfx('card');
    if (g.clue && (!pg.clue || pg.clue.word !== g.clue.word)) sfx('uno');
  } else if (s.game === 'jackaroo') {
    if (g.turn === g.seat && pg.turn !== pg.seat) sfx('turn');
    const kills = (g.marb || []).flat().filter(x => x < 0).length, pk = (pg.marb || []).flat().filter(x => x < 0).length;
    if (kills > pk) sfx('catch'); else if (JSON.stringify(g.marb) !== JSON.stringify(pg.marb)) sfx('card');
  } else if (s.game === 'draw') {
    if (g.sub === 'choose' && pg.sub !== 'choose' && g.drawer === s.me) sfx('turn');
    if (g.guessed.length > pg.guessed.length && g.turn === pg.turn) sfx('uno');
    if (g.sub === 'reveal' && pg.sub !== 'reveal') sfx('pop');
  } else if (s.game === 'flip') {
    if (g.turn === s.me && pg.turn !== s.me && s.phase === 'play') sfx('turn');
    else if (g.top.id !== pg.top.id) sfx('card');
    if (g.flips > pg.flips) setTimeout(() => sfx('catch'), 150);
    if (g.hand.length > pg.hand.length) sfx('draw');
    const last = s.log[s.log.length - 1];
    if (last && last !== p.log[p.log.length - 1]) { if (last.includes('أونو!')) { sfx('unoCall'); unoBurst(last.split(':')[0]); } else if (last.includes('مسك')) sfx('penalty'); }
    if (s.phase === 'over' && p.phase === 'play') setTimeout(() => sfx('unoWin'), 400);
  } else if (s.game === 'outside') {
    if ((g.sub === 'ask' && g.asker === s.me && !(pg.sub === 'ask' && pg.asker === s.me)) || (g.sub === 'qa' && g.target === s.me && pg.target !== s.me)) sfx('turn');
    else if (g.sub === 'qa' && pg.sub !== 'qa') sfx('card');
    if (g.sub === 'vote' && pg.sub !== 'vote') sfx('uno');
    if (g.sub === 'guess' && pg.sub !== 'guess') sfx('catch');
  } else if (s.game === 'typing') {
    if (g.sub === 'go' && pg.sub !== 'go') sfx('uno');
    if (g.last && !pg.last) sfx(g.last.id === s.me ? 'win' : 'nope');
  } else if (s.game === 'hive') {
    if (g.cells.filter(c => c.o !== null).length > pg.cells.filter(c => c.o !== null).length) sfx('catch');
    else if (g.sub !== pg.sub && g.sub === 'steal') sfx('nope');
    else if (g.q && !pg.q) sfx('pop');
  }
  if (s.phase === 'over' && p.phase !== 'over' && !s.spec) {
    const m = me2(), won = s.game === 'mafia' ? !!(g.me && (g.win === 'j' ? g.jWin === s.me : g.win === (MROLE[g.me.role] || {}).team)) : s.game === 'outside' ? g.spyWins === (g.role === 'spy') : s.teams && s.winTeam != null ? m.tm === s.winTeam : s.winner === m.name;
    setTimeout(() => { sfx(won ? 'win' : 'lose'); if (won) confetti(); }, 400);
  }
}
function tick2() {
  if (!S || S.game === 'uno' || S.phase !== 'play') return;
  const r = S.left ? cd2() : '';
  $$('.cd2').forEach(e => e.textContent = r);
}
setInterval(tick2, 300);

// ---- الثيمات ----
const THEMES = [
  ['paper', 'ورق', '#f3ead8', '#e8362d'], ['night', 'ليل', '#17161d', '#ffc928'], ['sea', 'بحر', '#d6edf2', '#2a5bd7'],
  ['sunset', 'غروب', '#ffd9c2', '#e8362d'], ['mint', 'نعناع', '#d3f0da', '#1fa35c'], ['lilac', 'ليلكي', '#e4d9fb', '#7a4ee0'], ['rose', 'ورد', '#ffd6e6', '#e0407a']
];
function setTheme(id, save = true) {
  if (!THEMES.some(t => t[0] === id)) id = 'paper';
  if (id === 'paper') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = id;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
  const mt = document.querySelector('meta[name=theme-color]'); if (mt && bg) mt.content = bg;
  if (save) store.set('tarteeb-theme', id);
  $$('.sw').forEach(b => b.classList.toggle('on', b.dataset.t === id));
}
function themeBar(top) {
  let bar = $('#themeBar');
  if (!bar) {
    bar = document.createElement('div'); bar.id = 'themeBar'; bar.className = 'themebar'; bar.hidden = true;
    bar.innerHTML = THEMES.map(t => `<button class="sw" data-t="${t[0]}" style="--ac:${t[3]}"><i style="background:${t[2]}"></i>${t[1]}</button>`).join('');
    document.body.appendChild(bar);
    bar.querySelectorAll('.sw').forEach(b => b.onclick = () => { setTheme(b.dataset.t); sfx('pop'); });
    document.addEventListener('click', e => { if (!bar.hidden && !e.target.closest('#themeBar, .themebtn')) bar.hidden = true; });
  }
  bar.classList.toggle('top', !!top);
  bar.hidden = !bar.hidden;
  if (!top) bar.style.bottom = (innerHeight - $('#themeFab').getBoundingClientRect().top + 10) + 'px'; else bar.style.bottom = '';
  setTheme(store.get('tarteeb-theme') || 'paper', false);
}
$('#themeTop').onclick = () => themeBar(true);
$('#themeFab').onclick = () => themeBar(false);
setTheme(store.get('tarteeb-theme') || 'paper', false);


// ================= برا السالفة =================
const pn = id => { const p = S.players.find(x => x.id === id); return p ? (p.av ? p.av + ' ' : '') + p.name : '؟'; };
function renderOutside(body) {
  const g = S.g, over = S.phase === 'over', amAsker = g.sub === 'ask' && g.asker === S.me, amTarget = g.sub === 'qa' && g.target === S.me;
  const role = g.role === 'spy' ? `<div class="orole spy">🤫 أنت <b>برا السالفة</b> — ما تعرف الكلمة. اسمع الأسئلة والأجوبة وتظاهر إنك تعرف</div>`
    : g.role === 'in' ? `<div class="orole">الكلمة السرية: <b class="oword nt">${esc(g.word)}</b></div>` : '<div class="orole">أنت تتفرّج 👁</div>';
  const live = g.sub === 'ask' || g.sub === 'qa';
  const rows = S.players.map(p => {
    const cur = live && (g.asker === p.id || (g.sub === 'qa' && g.target === p.id));
    return `<div class="orow${cur ? ' cur' : ''}${over && g.spy === p.id ? ' spyrow' : ''}" data-id="${p.id}"><span class="on">${esc(pn(p.id))}</span><span class="ocl">${g.sub === 'qa' && g.asker === p.id ? '<i>يسأل</i>' : g.sub === 'qa' && g.target === p.id ? '<i>يجاوب</i>' : g.sub === 'ask' && g.asker === p.id ? '<i>دوره يسأل</i>' : ''}</span>${g.sub === 'vote' && g.voted.includes(p.id) ? '<b class="ok">✓</b>' : ''}${g.tally && g.tally[p.id] ? `<b class="vt">${g.tally[p.id]} 🗳</b>` : ''}</div>`;
  }).join('');
  let act = '';
  if (over) {
    act = `<div class="oreveal"><div>برا السالفة كان: <b>${esc(pn(g.spy))}</b></div><div>الكلمة: <b class="oword nt">${esc(g.word)}</b></div>${g.guess ? `<div>تخمينه: «${esc(g.guess)}»</div>` : ''}</div>`;
  } else if (g.sub === 'ask') {
    act = amAsker ? `<div class="vlabel">دورك! اختر مين تسأله <span class="muted">(اسأله بصوتك)</span></div><div class="vbtns">${g.canAsk.map(id => `<button type="button" class="vb ask" data-id="${id}">${esc(pn(id))}</button>`).join('')}</div>`
      : `<div class="muted">دور ${esc(pn(g.asker))} يختار مين يسأل…</div>`;
  } else if (g.sub === 'qa') {
    act = `<div class="qabox"><b>${esc(pn(g.asker))}</b> ← يسأل ← <b>${esc(pn(g.target))}</b></div>` + (amTarget ? `<div class="muted">جاوب بصوتك، وبعدها اضغط</div><button type="button" id="qaDone" class="btn green">جاوبت — دوري أسأل</button>` : `<div class="muted">اسمعوا السؤال والجواب… <span class="cd2"></span></div>`);
  } else if (g.sub === 'vote') {
    act = S.spec ? '<div class="muted">التصويت شغّال…</div>' : `<div class="vlabel">مين برا السالفة؟ ${g.myVote ? '' : '<span class="muted">اختر واحد</span>'}</div><div class="vbtns">${S.players.filter(p => p.id !== S.me).map(p => `<button type="button" class="vb${g.myVote === p.id ? ' on' : ''}" data-id="${p.id}">${esc(pn(p.id))}</button>`).join('')}</div>`;
  } else if (g.sub === 'guess') {
    act = g.role === 'spy' ? `<div class="vlabel">انكشفت! اختر الكلمة الصح وتفوز (الفئة: ${esc(g.cat)})</div><div class="vbtns wopts">${g.opts.map(w => `<button type="button" class="vb gw nt" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`
      : `<div class="vlabel">انكشف <b>${esc(pn(g.accused))}</b> — ينتظر يخمّن الكلمة…</div>`;
  }
  const hostSkip = !over && !S.spec && live && S.players.find(p => p.h && p.id === S.me) && g.count >= S.players.length ? '<button type="button" id="toVote" class="btn sm">ابدأ التصويت الحين</button>' : '';
  const phaseTxt = over ? 'انتهت الجولة' : live ? `الأسئلة — ${Math.min(g.count + 1, g.total)} من ${g.total}` : g.sub === 'vote' ? 'وقت التصويت' : 'التخمين الأخير';
  const hist = g.hist.length && live ? `<div class="ohist">${g.hist.slice(-5).map(h => `<span>${esc(pn(h.from))} ← ${esc(pn(h.to))}</span>`).join('')}</div>` : '';
  body.innerHTML = `<div class="ocat"><span class="oc">الفئة: <b>${esc(g.cat)}</b></span><span class="ph">${phaseTxt} <span class="cd2"></span></span></div>${role}<div class="olist">${rows}</div>${hist}<div class="oact">${act}${hostSkip}</div>${logHtml()}`;
  body.querySelectorAll('.vb.ask').forEach(b => b.onclick = () => { send({ t: 'ask', id: b.dataset.id }); sfx('pop'); });
  body.querySelectorAll('.vb:not(.ask):not(.gw)').forEach(b => b.onclick = () => { send({ t: 'vote', id: b.dataset.id }); sfx('pop'); });
  body.querySelectorAll('.vb.gw').forEach(b => b.onclick = () => { send({ t: 'guess', text: b.dataset.w }); sfx('pop'); });
  const d = $('#qaDone'); if (d) d.onclick = () => send({ t: 'done' });
  const tv = $('#toVote'); if (tv) tv.onclick = () => { if (confirm(T('نبدأ التصويت الحين؟'))) send({ t: 'tovote' }); };
}

// ================= سبّاق الكتابة =================
const tyClean = t => String(t || '').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim();
let tySent = -1;
function renderTyping(body) {
  const g = S.g, over = S.phase === 'over', go = g.sub === 'go';
  const rows = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0)).map((p, i) => {
    const sc = g.scores[p.id] || 0;
    return `<div class="trow${p.id === S.me ? ' me' : ''}${g.last && g.last.id === p.id ? ' hit' : ''}" data-id="${p.id}"><span class="tn">${esc(pn(p.id))}</span><span class="tbar"><i style="width:${Math.min(100, sc / g.target * 100)}%"></i></span><b>${sc}/${g.target}</b></div>`;
  }).join('');
  let main;
  if (over) main = `<div class="tbox big">🏁 ${esc(S.winner)} وصل ${g.target} نقاط!</div>`;
  else if (g.sub === 'wait') main = `<div class="tbox big">استعد… <span class="cd2"></span></div><div class="muted">الجولة ${g.round} — النص بيظهر الحين</div>`;
  else if (go) main = `<div class="tbox"><div class="ttext nt">${esc(g.text)}</div></div>${S.spec ? '<div class="muted">تتفرّج 👁</div>' : `<input id="tyIn" class="tyin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="اكتب النص هنا…"><div class="muted">أسرع واحد يكتبه صح ياخذ النقطة <span class="cd2"></span></div>`}`;
  else main = `<div class="tbox big">${g.last ? `${esc(pn(g.last.id))} الأسرع! <small>${(g.last.ms / 1000).toFixed(1)} ث</small>` : 'ما أحد كتبها'}</div><div class="muted">الجولة الجاية بعد لحظات…</div>`;
  body.innerHTML = `<div class="ocat"><span class="oc">أول واحد يوصل <b>${g.target}</b> نقاط</span><span class="ph">الجولة ${g.round}</span></div><div class="tmain">${main}</div><div class="tlist">${rows}</div>${logHtml()}`;
  const inp = $('#tyIn');
  if (inp) {
    if (tySent !== g.round) setTimeout(() => inp.focus(), 30);
    const check = () => { if (tySent !== g.round && tyClean(inp.value) === tyClean(g.text)) { tySent = g.round; send({ t: 'type', text: inp.value }); } };
    inp.oninput = check; inp.onkeydown = e => { if (e.key === 'Enter') { send({ t: 'type', text: inp.value }); } };
  }
}

// ================= إعدادات الغرفة (اللوبي) =================
let lsSig = '';
function renderLobbySet(isHost) {
  const gh = $('#ghelp'); if (gh) { gh.hidden = !S || S.spec; $('#ghelpTxt').textContent = GHELP[S.game] || ''; }
  const box = $('#lobbyset'); if (!S || S.spec) { box.hidden = true; return; }
  const o = S.opts || {}, hasBots = BOTGAMES.includes(S.game);
  const sig = JSON.stringify([isHost, S.game, o, S.players.length >= S.max]);
  box.hidden = false;
  if (sig === lsSig) return; lsSig = sig;
  const sum = [o.lock ? '🔒 مقفلة بدون متفرجين' : '', o.hasPass ? '🔑 بكلمة سر' : '', S.game === 'uno' && o.stack ? 'تراكم +٢/+٤' : '', S.game === 'uno' && o.turn !== 15 ? `مهلة الدور ${o.turn} ث` : '', S.game === 'sus' ? (o.map === 'forest' ? '🌲 الغابة الملعونة' : '🚀 السفينة') : '', S.game === 'sus' ? `${o.imps || 1} ${(o.imps || 1) > 1 ? 'مندسين' : 'مندس'}` : '', S.game === 'sus' && o.doctor ? 'طور الدكتور 🩺' : '', S.game === 'typing' ? `الهدف ${o.target} نقاط` : '', S.game === 'codes' && o.nwords ? `كلمات مخصصة (${o.nwords})` : ''].filter(Boolean);
  if (!isHost) { box.innerHTML = sum.length ? `<div class="lsum">${sum.map(x => `<span>${x}</span>`).join('')}</div>` : ''; box.hidden = !sum.length; return; }
  const gm = Object.keys(GNAME).map(k => `<button type="button" class="gsw${k === S.game ? ' on' : ''}" data-g="${k}">${GNAME[k]}</button>`).join('');
  let extra = '';
  if (S.game === 'uno') extra = `<label class="chk"><input type="checkbox" id="oStack"${o.stack ? ' checked' : ''}> تراكم السحب (+٢ على +٢ و +٤ على +٤)</label>
    <label class="chk">مهلة الدور <select id="oTurn">${[10, 15, 25, 40].map(n => `<option value="${n}"${o.turn === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'sus') extra = `<label class="chk">الماب <select id="oMap"><option value="ship"${o.map !== 'forest' ? ' selected' : ''}>🚀 السفينة</option><option value="forest"${o.map === 'forest' ? ' selected' : ''}>🌲 الغابة الملعونة (رعب)</option></select></label>
    <label class="chk">عدد المندسين <select id="oImps">${[1, 2, 3].map(n => `<option value="${n}"${o.imps === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk"><input type="checkbox" id="oDoc"${o.doctor ? ' checked' : ''}> طور الدكتور 🩺 (يعطي درع لشخص كل جولة)</label><small class="muted">٢ مندسين يحتاج ٦ لاعبين، و٣ يحتاج ٩</small>`;
  else if (S.game === 'mafia') { const mr = o.mroles || {}, RN = { doc: '🩺 الطبيب', det: '🔍 المحقق', sniper: '🎯 القناص', god: '🎩 الأب الروحي', jester: '🃏 المهرج', mayor: '🎖️ العمدة' };
    extra = `<label class="chk">عدد المافيا <select id="oMc"><option value="0"${!o.mcount ? ' selected' : ''}>تلقائي</option>${[1, 2, 3, 4].map(n => `<option value="${n}"${o.mcount === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت النقاش <select id="oDay">${[60, 90, 120, 180].map(n => `<option value="${n}"${o.dayT === n ? ' selected' : ''}>${n / 60 >= 1 && n % 60 === 0 ? n / 60 + ' دقيقة' : n + ' ثانية'}</option>`).join('')}</select></label>
    <label class="chk"><input type="checkbox" id="oRev"${o.reveal !== false ? ' checked' : ''}> يبان دور اللي يموت</label>
    <div class="mfroles">${Object.keys(RN).map(k => `<label class="chk"><input type="checkbox" data-mr="${k}"${mr[k] !== 0 ? ' checked' : ''}> ${RN[k]}</label>`).join('')}</div><small class="muted">الأدوار تدخل لما يكون العدد كافي: الطبيب ٤+، المحقق ٥+، القناص والأب الروحي والمهرج ٧+، العمدة ٨+</small>`; }
  else if (S.game === 'typing') extra = `<label class="chk">الهدف <select id="oTarget">${[3, 5, 8, 12].map(n => `<option value="${n}"${o.target === n ? ' selected' : ''}>${n} نقاط</option>`).join('')}</select></label>`;
  else if (S.game === 'codes') extra = `<details class="wdet"><summary>كلمات مخصصة ${o.nwords ? `(مفعّلة: ${o.nwords})` : '(اختياري)'}</summary><textarea id="oWords" rows="4" placeholder="اكتب ٢٥ كلمة أو أكثر، كل كلمة بسطر أو افصلها بفاصلة">${esc(o.wordsText || '')}</textarea><div class="row"><button type="button" id="oWordsSave" class="btn sm">حفظ الكلمات</button><button type="button" id="oWordsClear" class="btn sm">رجّع الكلمات العادية</button></div></details>`;
  box.innerHTML = `<div class="ls-row"><b>اللعبة</b><div class="chips">${gm}</div></div>
    <div class="ls-row">${extra}</div>
    <div class="ls-row"><label class="chk"><input type="checkbox" id="oLock"${o.lock ? ' checked' : ''}> قفل الغرفة (بدون متفرجين)</label>
      <span class="passrow"><input id="oPass" maxlength="12" placeholder="كلمة سر (اختياري)" value="${esc(o.pass || '')}" autocomplete="off"><button type="button" id="oPassSave" class="btn sm">حفظ</button></span></div>
    ${hasBots ? `<div class="ls-row"><button type="button" id="addBot" class="btn sm"${S.players.length >= S.max ? ' disabled' : ''}>🤖 أضف بوت</button><small class="muted">يكمّل اللاعبين الناقصين، اطرده من ✕ لو ما تبيه</small></div>` : ''}`;
  box.querySelectorAll('.gsw').forEach(b => b.onclick = () => { if (b.dataset.g !== S.game) send({ t: 'setgame', game: b.dataset.g }); });
  const bind = (id, ev, fn) => { const e = $('#' + id); if (e) e[ev] = fn; };
  bind('oStack', 'onchange', e => send({ t: 'opt', k: 'stack', v: e.target.checked }));
  bind('oTurn', 'onchange', e => send({ t: 'opt', k: 'turn', v: +e.target.value }));
  bind('oMap', 'onchange', e => send({ t: 'opt', k: 'map', v: e.target.value }));
  bind('oImps', 'onchange', e => send({ t: 'opt', k: 'imps', v: +e.target.value }));
  bind('oDoc', 'onchange', e => send({ t: 'opt', k: 'doctor', v: e.target.checked }));
  bind('oTarget', 'onchange', e => send({ t: 'opt', k: 'target', v: +e.target.value }));
  bind('oMc', 'onchange', e => send({ t: 'opt', k: 'mcount', v: +e.target.value }));
  bind('oDay', 'onchange', e => send({ t: 'opt', k: 'dayT', v: +e.target.value }));
  bind('oRev', 'onchange', e => send({ t: 'opt', k: 'reveal', v: e.target.checked }));
  box.querySelectorAll('[data-mr]').forEach(c => c.onchange = () => send({ t: 'opt', k: 'mrole', r: c.dataset.mr, v: c.checked }));
  bind('oLock', 'onchange', e => send({ t: 'opt', k: 'lock', v: e.target.checked }));
  bind('oPassSave', 'onclick', () => { send({ t: 'opt', k: 'pass', v: $('#oPass').value }); toast($('#oPass').value.trim() ? 'انحفظت كلمة السر' : 'انشالت كلمة السر'); });
  bind('addBot', 'onclick', () => send({ t: 'addbot' }));
  bind('oWordsSave', 'onclick', () => send({ t: 'opt', k: 'words', v: $('#oWords').value }));
  bind('oWordsClear', 'onclick', () => { $('#oWords').value = ''; send({ t: 'opt', k: 'words', v: '' }); });
}

// ================= رسم وخمّن =================
const DCOL = ['#16130f', '#e8362d', '#2a5bd7', '#1fa35c', '#ffc928', '#8a4b2a', '#7a4ee0', '#fffaf0'], DW = [4, 8, 16, 30];
const DR = { strokes: [], ver: -1, n: 0, turn: undefined, color: 0, w: 1, cur: null, syncing: 0, ctx: null };
function dStroke(ctx, s, from = 0) {
  const pts = s.pts; if (!pts.length) return;
  ctx.strokeStyle = ctx.fillStyle = DCOL[s.c] || DCOL[0]; ctx.lineWidth = DW[s.w - 1] || 8; ctx.lineCap = ctx.lineJoin = 'round';
  if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], ctx.lineWidth / 2, 0, 7); ctx.fill(); return; }
  ctx.beginPath(); const a = Math.max(0, from - 1); ctx.moveTo(pts[a][0], pts[a][1]);
  for (let i = a + 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
function dRedraw() {
  const cv = $('#dcv'); if (!cv) return; const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, 1000, 1000);
  DR.strokes.forEach(s => dStroke(ctx, s));
}
function drawNet(m) {
  if (m.t === 'strokes') { DR.strokes = m.list; DR.ver = m.ver; DR.n = m.n; DR.syncing = 0; dRedraw(); return; }
  let s = DR.strokes.find(x => x.id === m.id);
  if (!s) { s = { id: m.id, c: m.c, w: m.w, pts: [] }; DR.strokes.push(s); }
  const from = s.pts.length; s.pts.push(...m.pts); DR.n++;
  const cv = $('#dcv'); if (cv) dStroke(cv.getContext('2d'), s, from);
}
function dBuild(body) {
  body.dataset.built = 'draw';
  body.innerHTML = `<div class="dinfo" id="dInfo"></div><div id="dChoose" class="dchoose"></div>
    <div class="dwrap"><canvas id="dcv" width="1000" height="1000"></canvas></div>
    <div id="dTools" class="dtools"></div>
    <form id="dGuess" class="clueform"><input id="dIn" maxlength="30" placeholder="اكتب تخمينك…" autocomplete="off"><button class="btn green sm">خمّن</button></form>
    <div id="dFeed" class="dfeed"></div><div id="dScores" class="dscores"></div>`;
  const cv = $('#dcv'), ctx = cv.getContext('2d');
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000), Math.round((e.clientY - r.top) / r.height * 1000)]; };
  let buf = [], tm = null;
  const flush = () => { if (!DR.cur || !buf.length) return; send({ t: 'stroke', id: DR.cur.id, c: DR.cur.c, w: DR.cur.w, pts: buf.splice(0, 40) }); if (buf.length) flush(); };
  const canDraw = () => S && S.g && S.g.sub === 'draw' && S.g.drawer === S.me && !S.spec;
  cv.addEventListener('pointerdown', e => {
    if (!canDraw()) return; e.preventDefault(); cv.setPointerCapture(e.pointerId);
    const p = pt(e); DR.cur = { id: (Date.now() % 1e8) | 0, c: DR.color, w: DR.w + 1 === 0 ? 1 : DR.w, pts: [p] };
    DR.cur.w = DR.w + 1; DR.strokes.push(DR.cur); DR.n++; buf = [p]; dStroke(ctx, DR.cur); clearInterval(tm); tm = setInterval(flush, 70);
  });
  cv.addEventListener('pointermove', e => {
    if (!DR.cur) return; const p = pt(e), l = DR.cur.pts[DR.cur.pts.length - 1];
    if (Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) < 3) return;
    DR.cur.pts.push(p); buf.push(p); DR.n++; dStroke(ctx, DR.cur, DR.cur.pts.length - 1);
  });
  const up = () => { if (!DR.cur) return; clearInterval(tm); flush(); DR.cur = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  $('#dGuess').onsubmit = e => { e.preventDefault(); const t = $('#dIn').value.trim(); if (t) { send({ t: 'guess', text: t }); $('#dIn').value = ''; } };
  $('#dTools').onclick = e => {
    const b = e.target.closest('[data-c],[data-w],[data-a]'); if (!b) return;
    if (b.dataset.c) DR.color = +b.dataset.c; if (b.dataset.w) DR.w = +b.dataset.w;
    if (b.dataset.a === 'undo') { DR.strokes.pop(); dRedraw(); send({ t: 'undo' }); }
    if (b.dataset.a === 'clear') { DR.strokes = []; dRedraw(); send({ t: 'clear' }); }
    drawTools();
  };
  dRedraw();
}
function drawTools() {
  const el = $('#dTools'); if (!el) return;
  el.innerHTML = DCOL.map((c, i) => `<button type="button" class="dcol${DR.color === i ? ' on' : ''}" data-c="${i}" style="background:${c}" title="${i === 7 ? 'ممحاة' : 'لون'}">${i === 7 ? '⌫' : ''}</button>`).join('') +
    DW.map((w, i) => `<button type="button" class="dwd${DR.w === i ? ' on' : ''}" data-w="${i}"><i style="width:${6 + i * 5}px;height:${6 + i * 5}px"></i></button>`).join('') +
    '<button type="button" class="btn sm" data-a="undo">تراجع</button><button type="button" class="btn sm" data-a="clear">امسح</button>';
}
function renderDraw(body) {
  const g = S.g, isD = g.drawer === S.me && !S.spec, over = S.phase === 'over';
  if (body.dataset.built !== 'draw') dBuild(body);
  // مزامنة الرسم
  if (DR.turn === undefined || DR.turn !== g.turn) { const first = DR.turn === undefined; DR.turn = g.turn; if (!first) { DR.strokes = []; DR.ver = g.ver; DR.n = 0; dRedraw(); } }
  if (isD && g.sub === 'draw') { if (DR.ver !== g.ver) DR.ver = g.ver; }
  else if (g.ver !== DR.ver || g.n !== DR.n) { if (!DR.syncing || Date.now() - DR.syncing > 1500) { DR.syncing = Date.now(); send({ t: 'sync' }); } }
  const dn = pn(g.drawer);
  let info;
  if (over) info = '<b>انتهت اللعبة</b>';
  else if (g.sub === 'choose') info = isD ? 'اختر كلمة وارسمها:' : `${esc(dn)} يختار كلمة… <span class="cd2"></span>`;
  else if (g.sub === 'reveal') info = `الكلمة كانت: <b class="oword nt">${esc(g.word || '')}</b>`;
  else info = isD ? `ارسم: <b class="oword nt">${esc(g.word)}</b> <span class="cd2"></span>` : `${esc(dn)} يرسم — <b class="dhint nt">${esc(g.hint)}</b> <span class="cd2"></span>`;
  $('#dInfo').innerHTML = `<span class="muted">الدور ${g.turn} من ${g.turns}</span><div>${info}</div>`;
  $('#dChoose').innerHTML = g.choices ? g.choices.map(w => `<button type="button" class="vb nt" data-w="${esc(w)}">${esc(w)}</button>`).join('') : '';
  $$('#dChoose .vb').forEach(b => b.onclick = () => send({ t: 'pickword', word: b.dataset.w }));
  const showTools = isD && g.sub === 'draw';
  $('#dTools').hidden = !showTools; if (showTools && !$('#dTools').children.length) drawTools();
  $('#dcv').classList.toggle('mine', showTools);
  const gf = $('#dGuess'); gf.hidden = isD || S.spec || g.sub !== 'draw';
  $('#dIn').disabled = g.done; $('#dIn').placeholder = g.done ? 'خمّنتها ✔ انتظر الباقي' : 'اكتب تخمينك…';
  $('#dFeed').innerHTML = [...g.guesses].slice(-6).map(x => `<div><b>${esc(pn(x.id))}:</b> <span class="nt">${esc(x.text)}</span></div>`).join('') + g.guessed.map(id => `<div class="gok">✔ ${esc(pn(id))} خمّن الكلمة</div>`).join('');
  $('#dScores').innerHTML = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0)).map(p => `<span class="pchip${p.id === g.drawer ? ' drw' : ''}" data-id="${p.id}">${p.id === g.drawer ? '✏️ ' : ''}${esc(pn(p.id))} <i>${g.scores[p.id] || 0}</i></span>`).join('');
}

// ================= جاكارو =================
const JCOL = ['#e8362d', '#2a5bd7', '#ff9f43', '#19b5c9'];
let jsel = null, jm = null;
const JDESC = { A: 'طلّع / ١ / ١١', K: 'طلّع / ١٣', Q: '١٢', J: 'بدّل', 4: 'رجوع ٤', 5: 'أي كرة ٥', 7: 'قسّمها', 10: '١٠' };
function jlabel(k) {
  const t = k.split('|')[1];
  if (t === 'out') return 'طلّع كرة';
  if (t === 'b4') return 'رجوع ٤';
  if (t[0] === 'f') return '+' + t.slice(1);
  return t;
}
function renderJack(body) {
  const g = S.g, over = S.phase === 'over', my = g.seat >= 0 ? g.seat : 0, mineTurn = g.turn === g.seat && !over;
  const C = 320, R = 235, TAU = Math.PI * 2;
  const ang = cell => ((cell - my * 20) / 80) * TAU + Math.PI / 2;
  const cellXY = (cell, r = R) => [C + r * Math.cos(ang(cell)), C + r * Math.sin(ang(cell))];
  if (g.split) jsel = g.split.card;
  const legal = jsel === null ? [] : g.legal.filter(l => l.c === jsel);
  if (jsel !== null && !g.hand.some(c => c.id === jsel)) { jsel = null; jm = null; }
  const movers = new Set(legal.map(l => l.s + '-' + l.i));
  const targets = jm && legal.some(l => l.x && l.s + '-' + l.i === jm) ? new Set(legal.filter(l => l.x && l.s + '-' + l.i === jm).map(l => l.x.join('-'))) : new Set();
  const xy = (s, p, k) => {
    if (p < 0) { const a = ang(s * 20) + (k - 1.5) * .09, rr = 290; return [C + rr * Math.cos(a), C + rr * Math.sin(a)]; }
    if (p <= 79) return cellXY((s * 20 + p) % 80);
    return cellXY((s * 20 + 79) % 80, R - 27 * (p - 79));
  };
  let cells = '';
  for (let c = 0; c < 80; c++) { const [x, y] = cellXY(c); const st = c % 20 === 0; cells += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${st ? 9.5 : 6.5}" class="jcell${st ? ' st' : ''}"${st ? ` style="stroke:${JCOL[c / 20]};stroke-width:4"` : ''}/>`; }
  for (let s = 0; s < 4; s++) { for (let k = 1; k <= 4; k++) { const [x, y] = cellXY((s * 20 + 79) % 80, R - 27 * k); cells += `<rect x="${(x - 8).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="16" height="16" rx="4" class="jlane" style="stroke:${JCOL[s]}"/>`; } for (let k = 0; k < 4; k++) { const [x, y] = xy(s, -1, k); cells += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" class="jbase" style="stroke:${JCOL[s]}"/>`; } }
  const dest = jm ? legal.filter(l => l.s + '-' + l.i === jm && !l.x).map(l => { const [x, y] = xy(l.s, l.np, 0); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" class="jdest"/>`; }).join('') : '';
  let marbles = '';
  for (let s = 0; s < 4; s++) g.marb[s].forEach((p, i) => {
    const [x, y] = xy(s, p, i), key = s + '-' + i, go = movers.has(key), tg = targets.has(key);
    marbles += `<g class="jm${go ? ' go' : ''}${tg ? ' tg' : ''}${jm === key ? ' sel' : ''}" data-m="${key}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="${JCOL[s]}"/><circle cx="${(x - 3).toFixed(1)}" cy="${(y - 3.5).toFixed(1)}" r="3" fill="#fff" opacity=".55"/></g>`;
  });
  const lab = [0, 1, 2, 3].map(s => {
    const a = ang(s * 20 + 10), x = C + 150 * Math.cos(a), y = C + 150 * Math.sin(a), p = S.players[s];
    return `<foreignObject x="${(x - 52).toFixed(0)}" y="${(y - 20).toFixed(0)}" width="104" height="40"><div class="jlab${g.turn === s && !over ? ' cur' : ''}" style="border-color:${JCOL[s]}"><b>${esc(p ? pn(p.id) : '؟')}</b><small>🃏${g.cnt[s]} · 🏠${g.home[s]}/4</small></div></foreignObject>`;
  }).join('');
  const centre = `<text x="${C}" y="${C - 6}" class="jtxt">${over ? '' : mineTurn ? 'دورك!' : 'دور ' + esc(pn((S.players[g.turn] || {}).id))}</text><text x="${C}" y="${C + 16}" class="jtxt sm">${g.last ? esc(pn((S.players[g.last.who] || {}).id) + ' ' + g.last.text) : ''}</text>`;
  const hand = g.hand.map(c => {
    const has = g.legal.some(l => l.c === c.id), red = c.s === '♥' || c.s === '♦';
    return `<button type="button" class="jc${red ? ' red' : ''}${jsel === c.id ? ' sel' : ''}${mineTurn && !has ? ' dim' : ''}" data-id="${c.id}"${mineTurn && has ? '' : ' disabled'}><b>${c.r}</b><span>${c.s}</span><small>${JDESC[c.r] || c.r}</small></button>`;
  }).join('');
  let hint = '';
  if (over) hint = '';
  else if (S.spec) hint = 'تتفرّج 👁';
  else if (!mineTurn) hint = 'ننتظر دورك…';
  else if (g.split) hint = `قسّمت الـ٧: باقي ${g.split.left} خطوات — اختر كرة وحرّكها`;
  else if (jsel === null) hint = 'اختر ورقة من يدك';
  else if (jm && legal.some(l => l.x)) hint = 'اختر الكرة اللي تبدّل معها';
  else hint = 'اضغط على الكرة اللي تبي تحرّكها (المتوهّجة)';
  const ctlNote = !S.spec && g.ctl !== g.seat ? '<div class="jnote">خلّصت كراتك — تلعب بكرات شريكك 🤝</div>' : '';
  const opts = jm ? legal.filter(l => l.s + '-' + l.i === jm && !l.x) : [];
  const optsHtml = opts.length > 1 ? `<div class="jopts">${opts.map(l => `<button type="button" class="btn sm" data-k="${esc(l.k)}">${jlabel(l.k)}</button>`).join('')}</div>` : '';
  const oldPos = window.JPOS || {};
  body.innerHTML = `<div class="jtop"><span class="tc t0${g.turn % 2 === 0 && !over ? ' on' : ''}">فريق أ <b>${g.home[0] + g.home[2]}/8</b></span><span class="muted">${hint} <span class="cd2"></span></span><span class="tc t1${g.turn % 2 === 1 && !over ? ' on' : ''}"><b>${g.home[1] + g.home[3]}/8</b> فريق ب</span></div>
    <svg class="jboard" viewBox="0 0 640 640"><circle cx="${C}" cy="${C}" r="${R + 22}" class="jtable"/>${cells}${dest}${lab}${centre}${marbles}</svg>
    ${ctlNote}${optsHtml}<div class="jhand">${hand}</div>${logHtml()}
    <details class="jhelp"><summary>شرح اللعبة</summary><ul><li><b>الهدف:</b> أنت وشريكك (قبالتك) تدخلون الـ٨ كرات في البيت. لما تخلّص كراتك تلعبون بكرات شريكك.</li><li><b>آص / شايب:</b> يطلّعون كرة من القاعدة. الآص يحرّك ١ أو ١١، والشايب ١٣.</li><li><b>بنت:</b> ١٢ خطوة. <b>ولد:</b> بدّل كرتك مع أي كرة ثانية على الطاولة.</li><li><b>٤:</b> رجوع ٤ خطوات. <b>٥:</b> حرّك أي كرة (حتى كرة خصمك) ٥ خطوات.</li><li><b>٧:</b> تقدر تقسّمها بين كراتك. باقي الأوراق تحرّك بعددها.</li><li>الكرة اللي تنزل عليها كرة غيرها <b>تنأكل</b> وترجع للقاعدة (حتى كرة شريكك!). ما تنزل على كرتك.</li><li>لو ما عندك حركة، أوراقك تنرمي وينتقل الدور.</li></ul></details>`;
  const newPos = {};
  body.querySelectorAll('.jm').forEach(el => {
    const c = el.querySelector('circle'), x = +c.getAttribute('cx'), y = +c.getAttribute('cy'), k = el.dataset.m; newPos[k] = [x, y];
    const o = oldPos[k]; if (o && (Math.abs(o[0] - x) > 1 || Math.abs(o[1] - y) > 1)) el.animate([{ transform: `translate(${o[0] - x}px,${o[1] - y}px)` }, { transform: 'translate(0,0)' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  window.JPOS = newPos;
  body.querySelectorAll('.jc').forEach(b => b.onclick = () => { if (g.split) return; jsel = jsel === +b.dataset.id ? null : +b.dataset.id; jm = null; sfx('pop'); renderJack(body); });
  body.querySelectorAll('.jopts .btn').forEach(b => b.onclick = () => { send({ t: 'move', id: jsel, key: b.dataset.k }); jsel = null; jm = null; });
  body.querySelectorAll('.jm').forEach(el => el.onclick = () => {
    const key = el.dataset.m;
    if (jm && targets.has(key)) { const l = legal.find(x => x.s + '-' + x.i === jm && x.x && x.x.join('-') === key); if (l) { send({ t: 'move', id: jsel, key: l.k }); jsel = null; jm = null; } return; }
    if (!mineTurn || jsel === null || !movers.has(key)) return;
    const mine = legal.filter(l => l.s + '-' + l.i === key);
    if (mine.length === 1 && !mine[0].x) { send({ t: 'move', id: jsel, key: mine[0].k }); jsel = null; jm = null; return; }
    jm = key; renderJack(body);
  });
}

// ================= أونو فليب =================
const FHEX = { red: '#e8362d', yellow: '#ffc928', green: '#1fa35c', blue: '#2a5bd7', pink: '#ef6fae', teal: '#18a7a0', orange: '#f28a1c', purple: '#7b3fc7', wild: '#16130f' };
const FAR = { red: 'أحمر', yellow: 'أصفر', green: 'أخضر', blue: 'أزرق', pink: 'وردي', teal: 'تركوازي', orange: 'برتقالي', purple: 'بنفسجي' };
const FSIDE = { L: ['red', 'yellow', 'green', 'blue'], D: ['pink', 'teal', 'orange', 'purple'] };
const FSYM = { draw1: '+1', draw5: '+5', reverse: '⇄', skip: '⊘', skipall: '⊗', flip: '⟳', wild: '✦', wd2: '+2', wdc: '🎨' };
const flipCard = (c, cls = '') => `<div class="fc ${cls}" style="--fc:${FHEX[c.c]}" data-id="${c.id}"><i>${FSYM[c.v] || c.v}</i><b>${FSYM[c.v] || c.v}</b><i class="r">${FSYM[c.v] || c.v}</i></div>`;
let flipPick = null;
function renderFlip(body) {
  const g = S.g, over = S.phase === 'over', dark = g.side === 'D', myTurn = !S.spec && g.turn === S.me && g.sub === 'play' && !over;
  const vic = g.chal && g.chal.victim === S.me;
  const rows = S.players.map(p => `<div class="frow${g.turn === p.id && !over ? ' cur' : ''}${g.winId === p.id ? ' win' : ''}" data-id="${p.id}"><span class="fn">${esc(pn(p.id))}</span>${g.called[p.id] && p.n <= 2 ? '<b class="fu">UNO</b>' : ''}<span class="fcnt">${over && g.points ? g.points[p.id] + ' نقطة' : p.n + ' 🂠'}</span>${g.catchable === p.id ? `<button type="button" class="catchb" data-id="${p.id}">امسكه!</button>` : ''}</div>`).join('');
  let mid = '';
  if (g.sub === 'chal' && g.chal && !over) {
    const k = g.chal.kind === 'wd2' ? '+٢ ملوّن' : 'ملوّن سحب لون';
    mid = vic ? `<div class="fchal"><b>${esc(pn(g.chal.by))}</b> لعب ${k} واختار <b style="color:${FHEX[g.chal.color]}">${FAR[g.chal.color]}</b><div class="muted">لو شكيت إنه عنده لون الطاولة تحدّاه</div><div class="fbtns"><button type="button" class="btn red sm" id="fcY">تحدّى</button><button type="button" class="btn green sm" id="fcN">اقبل</button></div></div>`
      : `<div class="muted">${esc(pn(g.chal.victim))} يقرر: يقبل ${k} أو يتحدّى…</div>`;
  } else if (over) mid = `<div class="fchal"><b>${esc(S.winner)}</b> فاز! 🎉<div class="muted">مجموع نقاط أوراق الباقين: ${g.total}</div></div>`;
  else mid = myTurn ? '<div class="vlabel">دورك — العب ورقة أو اسحب</div>' : `<div class="muted">دور ${esc(pn(g.turn))} <span class="cd2"></span></div>`;
  const hand = g.hand.map(c => flipCard(c, (c.ok ? 'ok' : myTurn ? 'no' : '') + (flipPick === c.id ? ' pick' : ''))).join('');
  const cols = flipPick != null ? `<div class="fcols">${FSIDE[g.side].map(c => `<button type="button" class="fcol" data-c="${c}" style="background:${FHEX[c]}">${FAR[c]}</button>`).join('')}</div>` : '';
  body.innerHTML = `<div class="fwrap${dark ? ' dark' : ''}">
    <div class="fbar"><span class="fside">${dark ? '🌙 الوجه الغامق' : '☀️ الوجه الفاتح'}</span><span class="fdir">${g.dir === 1 ? '↻' : '↺'}</span><span class="fcolr" style="background:${FHEX[g.color]}">${FAR[g.color] || ''}</span></div>
    <div class="flist">${rows}</div>
    <div class="ftable"><div class="fpile${myTurn ? ' can' : ''}" id="fDeck"><div class="fc back"><b>UNO</b></div><small>${g.deckN}</small></div>${flipCard(g.top, 'ftop')}</div>
    ${mid}${cols}
    <div class="fhand">${hand}</div>
    <div class="fact">${g.canUno ? '<button type="button" class="btn yellow" id="fUno">UNO!</button>' : ''}</div>
    ${logHtml()}</div>`;
  const fd = $('#fDeck'); if (fd) fd.onclick = () => { if (myTurn) { flipPick = null; send({ t: 'draw' }); } };
  body.querySelectorAll('.fc.ok').forEach(el => el.onclick = () => {
    const id = +el.dataset.id, c = g.hand.find(x => x.id === id);
    if (c.c === 'wild') { flipPick = flipPick === id ? null : id; renderFlip(body); return; }
    flipPick = null; send({ t: 'play', id }); sfx('pop');
  });
  body.querySelectorAll('.fcol').forEach(b => b.onclick = () => { const id = flipPick; flipPick = null; send({ t: 'play', id, color: b.dataset.c }); sfx('pop'); });
  const u = $('#fUno'); if (u) u.onclick = () => send({ t: 'uno' });
  body.querySelectorAll('.catchb').forEach(b => b.onclick = () => send({ t: 'catch' }));
  const y = $('#fcY'), n = $('#fcN'); if (y) y.onclick = () => send({ t: 'chal', yes: true }); if (n) n.onclick = () => send({ t: 'chal', yes: false });
}
