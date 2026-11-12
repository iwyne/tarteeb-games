// المافيا — واجهة "مدينة بالليل": سما تتغير بين الليل والفجر والنهار، طاولة اللاعبين، كرت الدور، جريدة الصباح، وشات.
const MROLE = {
  mafia: { n: 'مافيا', team: 'm', d: 'كل ليلة تختار مع ربعك المافيا ضحية. بالنهار تخبّى بين الناس وتكذب.' },
  god: { n: 'الأب الروحي', team: 'm', d: 'زعيم المافيا. لو المحقق فتّش عليك يطلع لك «بريء»، ولو اختلفت المافيا على الضحية كلمتك هي اللي تمشي.' },
  doc: { n: 'الطبيب', team: 't', d: 'كل ليلة تحمي شخص من الموت. تقدر تحمي نفسك، بس ما تحمي نفس الشخص ليلتين ورا بعض.' },
  det: { n: 'المحقق', team: 't', d: 'كل ليلة تفتّش على شخص وتعرف هو مافيا ولا لا. انتبه: الأب الروحي يطلع بريء.' },
  sniper: { n: 'القناص', team: 't', d: 'عندك طلقة وحدة باللعبة كلها. تطلقها بالليل على اللي تشك فيه، فلا تضيعها.' },
  mayor: { n: 'العمدة', team: 't', d: 'تقدر تكشف نفسك بالنهار، وبعدها يصير صوتك بصوتين.' },
  jester: { n: 'المهرج', team: 'j', d: 'هدفك إن المدينة تصوّت عليك وتطردك. لو صار، تفوز لحالك!' },
  cit: { n: 'مواطن', team: 't', d: 'ما عندك قدرة بالليل. ركّز بالنقاش، اكشف الكذابين وصوّت صح.' }
};
const MTEAM = { m: 'المافيا', t: 'المدينة', j: 'لحاله' };
// أيقونات الأدوار (مرسومة)
const MICON = {
  mafia: '<path d="M14 40h72l-8-6H22z" fill="#16130f"/><path d="M26 34c0-14 6-22 24-22s24 8 24 22z" fill="#16130f"/><path d="M27 31h46" stroke="#a3140c" stroke-width="4"/><rect x="28" y="48" width="44" height="12" rx="6" fill="#16130f"/><circle cx="40" cy="54" r="3.5" fill="#f3ead8"/><circle cx="60" cy="54" r="3.5" fill="#f3ead8"/>',
  god: '<path d="M10 40h80l-9-7H19z" fill="#16130f"/><path d="M24 33c0-15 7-23 26-23s26 8 26 23z" fill="#16130f"/><path d="M25 30h50" stroke="#d4a24c" stroke-width="4"/><path d="M50 52q-12 0-14 10 14 6 28 0-2-10-14-10z" fill="#16130f"/><rect x="58" y="60" width="22" height="5" rx="2" fill="#d4a24c"/><circle cx="82" cy="62" r="2.5" fill="#e8362d"/>',
  doc: '<rect x="18" y="30" width="64" height="46" rx="8" fill="#f3ead8" stroke="#16130f" stroke-width="5"/><path d="M38 30v-8h24v8" fill="none" stroke="#16130f" stroke-width="5"/><path d="M50 40v26M37 53h26" stroke="#a3140c" stroke-width="9"/>',
  det: '<circle cx="42" cy="42" r="20" fill="#cfe3ee" stroke="#16130f" stroke-width="6"/><path d="M57 57l22 22" stroke="#16130f" stroke-width="10" stroke-linecap="round"/><path d="M34 36q6-8 14-4" stroke="#fff" stroke-width="4" fill="none"/>',
  sniper: '<circle cx="50" cy="50" r="30" fill="none" stroke="#16130f" stroke-width="5"/><circle cx="50" cy="50" r="12" fill="none" stroke="#a3140c" stroke-width="4"/><path d="M50 10v24M50 66v24M10 50h24M66 50h24" stroke="#16130f" stroke-width="5"/><circle cx="50" cy="50" r="3" fill="#a3140c"/>',
  mayor: '<path d="M30 14h40v30H30z" fill="#16130f"/><rect x="20" y="42" width="60" height="7" rx="3" fill="#16130f"/><path d="M30 36h40" stroke="#d4a24c" stroke-width="4"/><circle cx="50" cy="70" r="14" fill="#d4a24c" stroke="#16130f" stroke-width="4"/><path d="M50 62l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill="#16130f"/>',
  jester: '<path d="M50 44C38 26 24 22 14 30c10 2 16 10 18 20zM50 44c12-18 26-22 36-14-10 2-16 10-18 20z" fill="#a3140c" stroke="#16130f" stroke-width="4"/><path d="M50 44c-6-16-2-28 0-32 2 4 6 16 0 32z" fill="#d4a24c" stroke="#16130f" stroke-width="4"/><circle cx="14" cy="30" r="5" fill="#d4a24c"/><circle cx="86" cy="30" r="5" fill="#d4a24c"/><path d="M30 52h40l-6 26H36z" fill="#f3ead8" stroke="#16130f" stroke-width="4"/><path d="M40 64q10 8 20 0" stroke="#16130f" stroke-width="4" fill="none"/>',
  cit: '<path d="M18 50L50 22l32 28" fill="none" stroke="#16130f" stroke-width="6" stroke-linejoin="round"/><path d="M26 46v34h48V46" fill="#f3ead8" stroke="#16130f" stroke-width="5"/><rect x="43" y="58" width="14" height="22" fill="#16130f"/><rect x="31" y="54" width="9" height="9" fill="#d4a24c"/>',
  unk: '<circle cx="50" cy="38" r="16" fill="#16130f"/><path d="M20 84c4-20 16-28 30-28s26 8 30 28z" fill="#16130f"/><text x="50" y="45" text-anchor="middle" font-size="22" fill="#f3ead8" font-family="Lalezar">?</text>'
};
const micon = (r, cls = '') => `<svg class="mico ${cls}" viewBox="0 0 100 100" aria-hidden="true">${MICON[r] || MICON.unk}</svg>`;
const MF = { sub: '', key: '', sel: null, chatN: 0, peek: false, lastDay: -1, lastNight: -1, seenDawn: '', seenVerd: '' };

// السما والمدينة (تنرسم مرة وحدة)
function mfScene() {
  let win = '';
  const bld = [[0, 52, 38], [36, 70, 30], [62, 44, 26], [86, 80, 34], [118, 58, 22], [138, 92, 30], [166, 50, 28], [192, 74, 36], [226, 60, 24], [248, 86, 30], [276, 48, 26], [300, 66, 32]];
  bld.forEach(([x, h, w], i) => { for (let yy = 100 - h + 8; yy < 96; yy += 9) for (let xx = x + 4; xx < x + w - 5; xx += 8) if ((xx * 7 + yy * 3 + i) % 5 < 2) win += `<rect class="mfw" x="${xx}" y="${yy}" width="4" height="5" style="animation-delay:${(xx * yy) % 7}s"/>`; });
  const sky = bld.map(([x, h, w], i) => `<rect x="${x}" y="${100 - h}" width="${w}" height="${h}"/>` + (i % 4 === 1 ? `<rect x="${x + w / 2 - 2}" y="${100 - h - 10}" width="3" height="10"/>` : i % 4 === 3 ? `<path d="M${x} ${100 - h}l${w / 2} -10l${w / 2} 10z"/>` : '')).join('');
  return `<div class="mfsky"><i class="mfmoon"></i><i class="mfsun"></i><div class="mfstars"></div>
    <svg class="mfcity" viewBox="0 0 332 100" preserveAspectRatio="xMidYMax slice"><g class="mfbld">${sky}</g><g class="mfwins">${win}</g></svg>
    <div class="mfrain"></div><div class="mffog"></div></div>`;
}

function renderMafia(body) {
  const g = S.g; if (!g) return;
  if (body.dataset.built !== 'mafia') {
    body.dataset.built = 'mafia';
    body.innerHTML = `<div class="mfwrap" id="mfW">${mfScene()}
      <div class="mftop"><div class="mfphase" id="mfPhase"></div><div class="mftime"><b class="cd2"></b><small>ثانية</small></div></div>
      <div class="mfmain"><div class="mftable" id="mfTable"></div>
        <aside class="mfside"><div class="mfrole" id="mfRole"></div><div class="mfact" id="mfAct"></div>
          <div class="mfchat"><div class="mfmsgs" id="mfMsgs"></div><form class="mfform" id="mfForm"><input id="mfIn" maxlength="200" autocomplete="off"><button class="btn sm" type="submit">ارسل</button></form></div></aside></div>
      <div class="mfover" id="mfOver" hidden></div></div>`;
    $('#mfForm').onsubmit = e => { e.preventDefault(); const i = $('#mfIn'), t = i.value.trim(); if (!t) return; send({ t: S.g.sub === 'night' ? 'mchat' : 'dchat', text: t }); i.value = ''; };
    $('#mfRole').onclick = () => { MF.peek = !MF.peek; sfx('card'); clearTimeout(MF.peekT); if (MF.peek) MF.peekT = setTimeout(() => { MF.peek = false; if (S && S.game === 'mafia' && S.g) renderMafia($('#g2body')); }, 7000); renderMafia($('#g2body')); };
    MF.chatN = 0; MF.peek = false;
  }
  const W = $('#mfW'), me = g.me, myP = g.P.find(p => p.id === S.me), alive = me && me.alive;
  const night = g.sub === 'night', dawnish = g.sub === 'dawn';
  W.className = 'mfwrap ' + (g.sub === 'intro' || night ? 'night' : dawnish ? 'dawn' : 'daytime') + (alive || !me ? '' : ' ghost');
  // العنوان
  const ph = { intro: 'المدينة تتعرف على أدوارها…', night: `الليلة ${g.night} 🌙`, dawn: `فجر اليوم ${g.night} 🌅`, day: `اليوم ${g.day} — نقاش`, vote: `اليوم ${g.day} — التصويت`, verdict: 'الحكم ⚖️', end: 'انتهت اللعبة' }[g.sub] || '';
  $('#mfPhase').textContent = ph;
  // كرت دوري
  const R = me ? MROLE[me.role] : null;
  $('#mfRole').className = 'mfrole t' + (R ? R.team : 'x') + (MF.peek ? ' open' : '');
  $('#mfRole').innerHTML = !me ? `<div class="mfrc">${micon('unk')}<b>تتفرّج</b></div>` : MF.peek
    ? `<div class="mfrc">${micon(me.role)}<b>${R.n}</b><small>فريقك: ${MTEAM[R.team]}</small><p>${R.d}</p>${me.role === 'sniper' ? `<em>${me.used ? 'استخدمت طلقتك' : 'الطلقة معك 🎯'}</em>` : ''}${me.alive ? '' : '<em>💀 ميت — تشوف كل شي الحين</em>'}</div>`
    : `<div class="mfrc back"><span>🎩</span><b>كرت دورك</b><small>اضغط عشان تشوفه (خلّه مخفي عن اللي جنبك)</small></div>`;
  // الطاولة
  const mates = me && MROLE[me.role].team === 'm';
  const nv = g.nv || {}, mk = nv.mk || {}, my = nv.my;
  const tgtMode = mfTarget(g);
  const cnt = {}; if (g.tally) Object.entries(g.tally).forEach(([k, v]) => { cnt[k] = v; });
  const vby = {}; if (g.votes) Object.entries(g.votes).forEach(([v, t]) => { (vby[t] = vby[t] || []).push(v); });
  $('#mfTable').innerHTML = g.P.map((p, i) => {
    const role = p.role, dead = !p.alive, isMe = p.id === S.me;
    const can = tgtMode && tgtMode.ok(p);
    const sel = my === p.id || (g.sub === 'vote' && g.myVote === p.id);
    const mpicks = Object.entries(mk).filter(([, t]) => t === p.id).map(([b]) => b);
    const chk = me && me.checks && me.checks[p.id] != null ? (me.checks[p.id] ? '<i class="mfchk bad">🔴 مافيا</i>' : '<i class="mfchk ok">🟢 بريء</i>') : '';
    const voted = g.voted && g.voted.includes(p.id), rdy = g.ready && g.ready.includes(p.id);
    return `<button type="button" class="mfp${dead ? ' dead' : ''}${isMe ? ' me' : ''}${can ? ' can' : ''}${sel ? ' sel' : ''}${role && MROLE[role] && MROLE[role].team === 'm' && (mates || dead || S.phase === 'over') ? ' maf' : ''}" data-id="${p.id}" ${can ? '' : 'tabindex="-1"'} style="--i:${i}">
      <span class="mfav">${role ? micon(role) : micon('unk')}${dead ? '<i class="mfx"></i>' : ''}</span>
      <b>${esc(p.name)}${isMe ? ' <small>(أنت)</small>' : ''}</b>
      <span class="mfrl">${role ? MROLE[role].n : dead ? 'ميت' : ''}${p.rev ? ' 🎖️' : ''}</span>
      ${chk}${mpicks.length ? `<i class="mfmk">🔪 ${mpicks.map(id => esc((g.P.find(q => q.id === id) || {}).name || '')).join('، ')}</i>` : ''}
      ${voted ? '<i class="mfvd">✓ صوّت</i>' : ''}${rdy ? '<i class="mfvd">✋ جاهز</i>' : ''}
      ${cnt[p.id] ? `<i class="mfvc">${cnt[p.id]}</i><i class="mfvb">${(vby[p.id] || []).map(v => esc((g.P.find(q => q.id === v) || {}).name || '')).join('، ')}</i>` : ''}
    </button>`;
  }).join('');
  $$('#mfTable .mfp.can').forEach(b => b.onclick = () => { const t = mfTarget(S.g); if (t) { t.go(b.dataset.id); sfx(t.snd || 'pop'); } });
  // لوحة الأفعال
  $('#mfAct').innerHTML = mfActHtml(g, me, tgtMode);
  $$('#mfAct [data-a]').forEach(b => b.onclick = () => { const a = b.dataset.a; if (a === 'skipvote') send({ t: 'vote', id: 'skip' }); else if (a === 'nosnipe') send({ t: 'snipe', id: null }); else send({ t: a }); sfx('gclick'); });
  // الشات
  const inp = $('#mfIn'), canChat = me && (!me.alive || (night ? mates : g.sub !== 'intro'));
  inp.disabled = !canChat;
  inp.placeholder = !me ? 'تتفرّج' : !me.alive ? 'شات الأموات (بس الأموات يشوفونه)' : night ? (mates ? 'شات المافيا السري 🤫' : 'المدينة نايمة… ما تقدر تتكلم') : g.sub === 'intro' ? 'انتظر…' : 'اكتب للمدينة';
  const msgs = $('#mfMsgs'), list = g.chat;
  if (list.length !== MF.chatN || MF.key !== g.sub) {
    MF.chatN = list.length; MF.key = g.sub;
    msgs.innerHTML = list.map(c => c.ch === 'sys' ? `<p class="sys">${esc(c.text)}</p>` : `<p class="c${c.ch}"><b>${esc((g.P.find(q => q.id === c.from) || {}).name || '؟')}${c.ch === 'm' ? ' 🔪' : c.ch === 'x' ? ' 👻' : ''}:</b> ${esc(c.text)}</p>`).join('');
    msgs.scrollTop = msgs.scrollHeight;
  }
  mfOverlays(g, me);
  mfSounds(g);
}
// مين أقدر أختار الحين
function mfTarget(g) {
  const me = g.me; if (!me || !me.alive || S.phase !== 'play') return null;
  const r = me.role, al = p => p.alive, notMe = p => p.id !== S.me;
  if (g.sub === 'night') {
    if (MROLE[r].team === 'm') return { ok: p => al(p) && !(p.role && MROLE[p.role] && MROLE[p.role].team === 'm'), go: id => send({ t: 'kill', id }), snd: 'stab' };
    if (r === 'doc') return { ok: p => al(p) && p.id !== me.lastSave, go: id => send({ t: 'save', id }), snd: 'ding' };
    if (r === 'det' && !(g.nv && g.nv.my)) return { ok: p => al(p) && notMe(p) && !(me.checks && me.checks[p.id] != null), go: id => send({ t: 'check', id }), snd: 'whisper' };
    if (r === 'sniper' && !me.used && !(g.nv && g.nv.my)) return { ok: p => al(p) && notMe(p), go: id => send({ t: 'snipe', id }), snd: 'gclick' };
    return null;
  }
  if (g.sub === 'vote') return { ok: p => al(p) && notMe(p), go: id => send({ t: 'vote', id }), snd: 'card' };
  return null;
}
function mfActHtml(g, me, tm) {
  const host = S.players.find(p => p.h), amHost = host && host.id === S.me;
  if (g.sub === 'intro') return `<p class="mfhint">اضغط على كرت دورك تحت عشان تعرف وش أنت… والليل جاي.</p>`;
  if (!me) return `<p class="mfhint">تتفرّج على المدينة.</p>`;
  if (!me.alive) return `<p class="mfhint">💀 أنت ميت. تشوف أدوار الكل وشات المافيا، بس ما تقدر تأثر على اللعبة.</p>`;
  const nm = id => esc((g.P.find(p => p.id === id) || {}).name || '');
  if (g.sub === 'night') {
    const r = me.role, my = g.nv && g.nv.my;
    if (MROLE[r].team === 'm') return `<p class="mfhint">🔪 اختاروا ضحية الليلة (اضغط على شخص). ربعك يشوفون اختيارك، واتفقوا بالشات السري.</p>${my ? `<p class="mfok">اخترت: <b>${nm(my)}</b></p>` : ''}`;
    if (r === 'doc') return `<p class="mfhint">🩺 مين تحمي الليلة؟</p>${my ? `<p class="mfok">بتحمي: <b>${nm(my)}</b></p>` : ''}`;
    if (r === 'det') return `<p class="mfhint">🔍 فتّش على شخص. النتيجة تطلع على كرته الصبح.</p>${my ? `<p class="mfok">بتفتّش: <b>${nm(my)}</b></p>` : ''}`;
    if (r === 'sniper') return me.used ? `<p class="mfhint">استخدمت طلقتك. نام وانتظر.</p>` : my ? `<p class="mfok">${my === 'none' ? 'قررت ما تطلق الليلة' : 'بتطلق على: <b>' + nm(my) + '</b>'}</p>` : `<p class="mfhint">🎯 تبي تستخدم طلقتك الوحيدة الليلة؟ اضغط على الهدف…</p><button type="button" class="btn sm" data-a="nosnipe">لا، ما أطلق</button>`;
    return `<p class="mfhint">😴 المدينة نايمة… غمّض عيونك. الأدوار الخاصة قاعدة تشتغل.</p>`;
  }
  if (g.sub === 'dawn') return `<p class="mfhint">طلع الصبح… شوف جريدة المدينة.</p>`;
  if (g.sub === 'day') {
    const rd = g.ready && g.ready.includes(S.me);
    return `<p class="mfhint">🗣️ تناقشوا بالصوت أو بالشات: مين المافيا؟</p><div class="mfbtns"><button type="button" class="btn sm${rd ? ' on' : ''}" data-a="ready"${rd ? ' disabled' : ''}>${rd ? 'جاهز ✓' : '✋ جاهز للتصويت'}</button>${amHost ? '<button type="button" class="btn sm" data-a="tovote">ابدأ التصويت الحين</button>' : ''}${me.role === 'mayor' && !me.revealed ? '<button type="button" class="btn sm gold" data-a="reveal">🎖️ اكشف إني العمدة</button>' : ''}</div>`;
  }
  if (g.sub === 'vote') return `<p class="mfhint">🗳️ اضغط على اللي تبي تطرده.</p>${g.myVote ? `<p class="mfok">صوّت على: <b>${g.myVote === 'skip' ? 'ما أطرد أحد' : nm(g.myVote)}</b> (تقدر تغيّر)</p>` : ''}<div class="mfbtns"><button type="button" class="btn sm" data-a="skipvote">ما أطرد أحد</button>${me.role === 'mayor' && !me.revealed ? '<button type="button" class="btn sm gold" data-a="reveal">🎖️ اكشف إني العمدة</button>' : ''}</div>`;
  if (g.sub === 'verdict') return `<p class="mfhint">⚖️ المدينة قالت كلمتها…</p>`;
  return '';
}
// الطبقات الكبيرة: كرت الدور بالبداية، جريدة الصبح، الحكم
function mfOverlays(g, me) {
  const o = $('#mfOver'), key = S.code + g.P.length;
  if (g.sub === 'intro' && me && o.dataset.k !== 'intro' + key) {
    o.dataset.k = 'intro' + key; const R = MROLE[me.role];
    const mates = R.team === 'm' ? g.P.filter(p => p.id !== S.me && p.role && MROLE[p.role].team === 'm').map(p => esc(p.name) + ' (' + MROLE[p.role].n + ')') : [];
    o.innerHTML = `<div class="mfintro"><small>دورك بالمدينة</small><div class="mfcard t${R.team}"><div class="fr">🎩</div><div class="bk">${micon(me.role)}<b>${R.n}</b><p>${R.d}</p>${mates.length ? `<em>ربعك: ${mates.join('، ')}</em>` : ''}</div></div><button type="button" class="btn sm" id="mfOk">فهمت 🤫</button></div>`;
    o.hidden = false; o.onclick = null; sfx('drone'); setTimeout(() => sfx('card'), 900);
    $('#mfOk').onclick = () => { o.hidden = true; };
    return;
  }
  if (g.sub === 'dawn' && g.dawn && MF.seenDawn !== key + 'n' + g.night) {
    MF.seenDawn = key + 'n' + g.night;
    const d = g.dawn.dead, nm = id => esc((g.P.find(p => p.id === id) || {}).name || '؟'), rl = id => { const p = g.P.find(q => q.id === id); return p && p.role ? MROLE[p.role].n : null; };
    const head = d.length ? d.map(x => `${x.how === 'sniper' ? 'رصاصة قنّاص تُسقط' : 'العثور على جثة'} ${nm(x.id)}`).join(' — ') : g.dawn.saved ? 'معجزة! الطبيب ينقذ ضحية المافيا' : 'ليلة هادية… ما أحد مات';
    o.innerHTML = `<div class="mfpaper"><div class="mfmast">جريدة المدينة<small>العدد ${g.night} · طبعة الصباح</small></div><h2>${head}</h2>${d.map(x => `<div class="mfobit">${micon(rl(x.id) ? g.P.find(q => q.id === x.id).role : 'unk')}<p><b>${nm(x.id)}</b>${rl(x.id) ? 'كان ' + rl(x.id) : 'دوره مجهول'}</p></div>`).join('')}<p class="mfcol">${d.length ? 'الشرطة تحقق… والمافيا ما زالت بيننا. الأهالي يجتمعون اليوم بالساحة.' : 'الأهالي يجتمعون بالساحة. هل المافيا قاعدة تخطط لشي أكبر؟'}</p></div>`;
    o.hidden = false; o.onclick = () => { o.hidden = true; };
    sfx(d.some(x => x.how === 'sniper') ? 'bang' : d.length ? 'scream' : 'bell');
    setTimeout(() => { if (S.g && S.g.sub !== 'dawn') o.hidden = true; }, 7500);
    return;
  }
  if (g.sub === 'verdict' && MF.seenVerd !== key + 'd' + g.day) {
    MF.seenVerd = key + 'd' + g.day;
    const ex = g.exec, p = ex && g.P.find(q => q.id === ex);
    o.innerHTML = `<div class="mfverd">${p ? `${micon(p.role || 'unk')}<h2>المدينة طردت ${esc(p.name)}</h2><p>كان: <b>${p.role ? MROLE[p.role].n : '؟'}</b></p><i class="mfstamp">مطرود</i>` : `<h2>ما انطرد أحد</h2><p>${g.tally && Object.keys(g.tally).length > 1 ? 'الأصوات تعادلت' : 'المدينة ما اتفقت'}</p>`}</div>`;
    o.hidden = false; o.onclick = () => { o.hidden = true; }; sfx(p ? 'slam' : 'nope');
    setTimeout(() => { if (S.g && S.g.sub !== 'verdict') o.hidden = true; }, 7000);
    return;
  }
  if (!['intro', 'dawn', 'verdict'].includes(g.sub) && !o.hidden && !o.dataset.keep) o.hidden = true;
}
function mfSounds(g) {
  if (g.sub === 'night' && MF.lastNight !== g.night) { MF.lastNight = g.night; sfx('thunder'); }
  if (g.sub === 'vote' && MF.lastDay !== g.day) { MF.lastDay = g.day; sfx('bell'); }
}
function mafiaOverHtml(g) {
  const win = g.win === 't' ? 'المدينة' : g.win === 'm' ? 'المافيا' : 'المهرج';
  return `<div class="mfres"><p>${esc(g.why || '')}</p>${g.P.map(p => `<span class="mfr t${p.role ? MROLE[p.role].team : ''}${p.alive ? '' : ' dead'}">${micon(p.role || 'unk')}<b>${esc(p.name)}</b><small>${p.role ? MROLE[p.role].n : ''}</small></span>`).join('')}</div>`;
}
