// ================= ساحة القتال (لعبة قتال بشخصيات وقدرات) =================
const FC = { f: [], pr: [], sub: '', keys: {}, mv: 0, hov: null, sel: '', last: {}, dmg: {}, combo: {}, padT: 0, endT: 0 };
const fzName = id => { const p = S.players.find(q => q.id === id); return p ? p.name : '؟'; };
const fzNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const fzIn = () => S.g && S.g.pair && S.g.pair.includes(S.me);
const fzMeF = () => FC.f.find(F => F.id === S.me);
const fzChOf = id => { const g = S.g; return g && g.picks && FZ.byId[g.picks[id]]; };

// ---- رسم المقاتل (يطالع يمين) ----
const fzLimb = (d, c, w) => `<path d="${d}" stroke="#16130f" stroke-width="${w + 7}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const fzFist = (x, y, c, r = 10) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#16130f" stroke-width="4"/>`;
function fzHead(c) {
  const sk = c.skin, I = '#16130f';
  const face = `<circle cx="82" cy="64" r="21" fill="${sk}" stroke="${I}" stroke-width="4"/><path d="M90 58 h8" stroke="${I}" stroke-width="4" stroke-linecap="round"/><circle cx="94" cy="64" r="2.6" fill="${I}"/><path d="M90 76 q5 2 9 -1" stroke="${I}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  switch (c.head) {
    case 'shemagh': return `${face}<path d="M58 70 q-4 -34 24 -36 q26 0 26 28 l-8 -2 q-6 -16 -20 -14 q-14 4 -14 22 l-2 36 q-12 -10 -6 -34z" fill="#fff" stroke="${I}" stroke-width="4" stroke-linejoin="round"/><path d="M66 44 l8 8 M78 38 l8 8 M90 38 l8 8 M62 58 l6 6 M60 74 l6 6" stroke="#e8362d" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="82" cy="42" rx="24" ry="6" fill="${I}"/><path d="M88 80 q6 8 12 0" stroke="${I}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case 'ghutra': return `${face}<path d="M58 70 q-4 -34 24 -36 q26 0 26 28 l-8 -2 q-6 -16 -20 -14 q-14 4 -14 22 l-2 36 q-12 -10 -6 -34z" fill="#fffaf0" stroke="${I}" stroke-width="4" stroke-linejoin="round"/><ellipse cx="82" cy="42" rx="24" ry="6" fill="${I}"/><path d="M72 74 q14 26 30 0 q-6 6 -14 6 q-10 0 -16 -6z" fill="#f4f1ea" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/><path d="M88 58 h10" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/>`;
    case 'pony': return `${face}<path d="M60 62 q0 -28 24 -28 q22 0 24 22 q-14 -4 -26 4 q-8 -8 -18 6z" fill="#1d1612" stroke="${I}" stroke-width="4" stroke-linejoin="round"/><path d="M62 52 q-22 6 -24 34 q12 -8 16 -24" fill="#1d1612" stroke="${I}" stroke-width="4" stroke-linejoin="round"/><path d="M62 52 l-4 -6" stroke="${c.col}" stroke-width="7" stroke-linecap="round"/>`;
    case 'bald': return `${face}<path d="M70 48 q8 -8 18 -6" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55" fill="none"/><path d="M66 72 q4 18 18 18 q14 0 18 -16 q-8 6 -18 6 q-10 0 -18 -8z" fill="#2b1a10" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/><path d="M86 56 l12 -3" stroke="${I}" stroke-width="5" stroke-linecap="round"/>`;
    case 'hijab': return `<path d="M56 76 q-6 -44 26 -44 q30 0 28 40 q2 26 -6 34 h-44 q-10 -8 -4 -30z" fill="${c.col}" stroke="${I}" stroke-width="4" stroke-linejoin="round"/><ellipse cx="88" cy="66" rx="14" ry="17" fill="${c.skin}" stroke="${I}" stroke-width="3.5"/><path d="M90 60 h8" stroke="${I}" stroke-width="3.5" stroke-linecap="round"/><circle cx="95" cy="65" r="2.4" fill="${I}"/><path d="M90 76 q4 2 8 -1" stroke="${I}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M62 92 q20 10 40 0" stroke="${c.col2}" stroke-width="4" fill="none"/>`;
    case 'mask': return `<circle cx="82" cy="64" r="22" fill="${c.col}" stroke="${I}" stroke-width="4"/><rect x="74" y="56" width="32" height="11" rx="5" fill="${c.skin}" stroke="${I}" stroke-width="3"/><path d="M90 61 l10 -1" stroke="${I}" stroke-width="4" stroke-linecap="round"/><path d="M60 58 q-16 -2 -24 10 M60 62 q-12 6 -18 18" stroke="${c.col2}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M60 56 h50" stroke="${c.col2}" stroke-width="5"/>`;
  }
  return face;
}
function fzSvg(c, crop) {
  const I = '#16130f', A = c.col, B = c.col2, sk = c.skin, sleeve = c.head === 'hijab' || c.head === 'ghutra' || c.head === 'mask' ? A : sk;
  const vb = crop ? '34 22 96 96' : '0 0 170 240';
  return `<svg viewBox="${vb}" class="fzsvg" aria-hidden="true">
    ${crop ? '' : `<ellipse cx="82" cy="233" rx="48" ry="7" class="fzsh"/>`}
    <g class="fzbody">
      <g class="fzlegB">${fzLimb('M74 158 L66 196 L58 228', B, 16)}<path d="M50 226 h22 v8 h-26z" fill="${I}"/></g>
      <g class="fzlegF">${fzLimb('M90 158 L98 196 L104 228', B, 16)}<path d="M98 226 h22 v8 h-26z" fill="${I}"/></g>
      <g class="fzlegX">${fzLimb('M90 158 L128 150 L162 136', B, 16)}<path d="M158 126 l12 4 v14 l-12 2z" fill="${I}"/></g>
      <g class="fzlegS">${fzLimb('M90 158 L112 132 L112 162', B, 16)}<path d="M104 160 h22 v8 h-26z" fill="${I}"/></g>
      <g class="fzarmB">${fzLimb('M70 104 L58 128 L72 124', sleeve, 13)}${fzFist(74, 122, sk)}</g>
      <path d="M62 98 q20 -12 40 0 l6 62 h-52z" fill="${A}" stroke="${I}" stroke-width="4" stroke-linejoin="round"/>
      ${c.head === 'ghutra' ? `<path d="M82 92 v66" stroke="${B}" stroke-width="5"/>` : `<path d="M70 100 l12 18 l12 -18" stroke="${B}" stroke-width="4" fill="none" stroke-linejoin="round"/>`}
      <rect x="56" y="148" width="52" height="11" rx="3" fill="${B}" stroke="${I}" stroke-width="4"/>
      <g class="fzhead">${fzHead(c)}</g>
      <g class="fzarmF">${fzLimb('M94 104 L112 130 L120 112', sleeve, 13)}${fzFist(122, 110, sk, 11)}</g>
      <g class="fzarmX">${fzLimb('M94 104 L128 104 L150 102', sleeve, 13)}${fzFist(156, 101, sk, 12)}${c.id === 'jaddo' ? `<path d="M150 108 L214 92" stroke="${I}" stroke-width="9" stroke-linecap="round"/><path d="M150 108 L214 92" stroke="#a87a4a" stroke-width="5" stroke-linecap="round"/>` : ''}</g>
      <g class="fzarmG">${fzLimb('M94 104 L114 116 L112 82', sleeve, 13)}${fzFist(112, 78, sk, 12)}${fzLimb('M72 104 L98 112 L100 86', sleeve, 13)}${fzFist(100, 84, sk, 11)}</g>
      <g class="fzarmW">${fzLimb('M94 104 L108 70 L106 34', sleeve, 13)}${fzFist(106, 28, sk, 12)}</g>
      <g class="fzarmC">${fzLimb('M94 104 L130 96 L146 88', sleeve, 13)}${fzFist(150, 86, sk, 12)}<circle cx="156" cy="84" r="14" class="fzorb"/></g>
    </g>
    <g class="fzdizzy"><text x="60" y="30">⭐</text><text x="98" y="22">💫</text></g>
  </svg>`;
}
// ---- الخلفيات ----
function fzStageBg(id) {
  if (id === 'dunes') return `<svg viewBox="0 0 1000 460" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="fzSkD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7b267"/><stop offset=".6" stop-color="#f4845f"/><stop offset="1" stop-color="#c8553d"/></linearGradient></defs><rect width="1000" height="460" fill="url(#fzSkD)"/><circle cx="760" cy="150" r="70" fill="#ffe29a"/><circle cx="760" cy="150" r="96" fill="#ffe29a" opacity=".25"/>
    <path d="M0 280 q160 -70 340 -10 t360 -20 t300 10 V460 H0z" fill="#d9774a"/><path d="M0 330 q200 -60 420 0 t580 -10 V460 H0z" fill="#e8955c"/><path d="M140 300 l10 -40 l10 40 M150 268 l-14 -6 M150 268 l14 -8" stroke="#6b3a22" stroke-width="5" fill="none"/>
    <path d="M610 296 q20 -20 40 0 l6 -10 q8 6 4 14 h-60z" fill="#6b3a22"/><rect y="372" width="1000" height="88" fill="#f0b27a"/><path d="M0 372 H1000" stroke="#16130f" stroke-width="5"/><path d="M60 410 q40 -10 80 0 M420 430 q50 -12 100 0 M780 404 q40 -10 80 0" stroke="#d4884f" stroke-width="5" fill="none"/></svg>`;
  if (id === 'city') return `<svg viewBox="0 0 1000 460" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="fzSkC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0b26"/><stop offset=".7" stop-color="#3b1e5c"/><stop offset="1" stop-color="#8a3a6b"/></linearGradient></defs><rect width="1000" height="460" fill="url(#fzSkC)"/>
    ${[[80, 40], [220, 90], [340, 30], [610, 60], [880, 50], [930, 120], [470, 110], [150, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#fff" opacity=".8"/>`).join('')}<circle cx="860" cy="80" r="26" fill="#fff4d6"/><circle cx="872" cy="72" r="24" fill="#0d0b26" opacity=".9"/>
    <path d="M0 300 h40 v-60 h50 v80 h30 v-120 h60 v120 h40 v-70 h50 v70 H1000 V372 H0z" fill="#1a1236"/><path d="M640 372 v-160 h40 v-30 h50 v190z M800 372 v-110 h60 v110z" fill="#1a1236"/>
    <path d="M430 372 L452 70 Q500 38 548 70 L570 372z" fill="#241a48" stroke="#5b4a9a" stroke-width="4"/><path d="M466 96 Q500 120 534 96 L540 150 Q500 128 460 150z" fill="#0d0b26"/><path d="M480 90 Q500 76 520 90" stroke="#ffd34d" stroke-width="4" fill="none"/>
    ${[200, 230, 260, 290, 320].map(y => `<path d="M${458 - (y - 70) * .04} ${y} H${542 + (y - 70) * .04}" stroke="#ffd34d" stroke-width="3" opacity=".5" stroke-dasharray="8 10"/>`).join('')}
    <rect y="372" width="1000" height="88" fill="#2c2a3a"/><path d="M0 372 H1000" stroke="#16130f" stroke-width="5"/><path d="M0 380 H1000" stroke="#ffd34d" stroke-width="3" stroke-dasharray="30 20"/><circle cx="500" cy="420" r="34" fill="none" stroke="#5b4a9a" stroke-width="5"/><text x="500" y="432" text-anchor="middle" font-size="34" fill="#5b4a9a" font-weight="900">H</text></svg>`;
  return `<svg viewBox="0 0 1000 460" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="fzSkS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4d6e"/><stop offset="1" stop-color="#f2a65a"/></linearGradient></defs><rect width="1000" height="460" fill="url(#fzSkS)"/>
    <path d="M0 372 V150 h1000 V372z" fill="#c9965e"/><path d="M0 150 h1000" stroke="#16130f" stroke-width="5"/>
    ${[0, 1, 2, 3, 4].map(i => { const x = 40 + i * 200; return `<path d="M${x} 372 V230 q60 -76 120 0 V372z" fill="#5a3418" stroke="#16130f" stroke-width="5"/><path d="M${x + 14} 372 V240 q46 -56 92 0 V372z" fill="#3a2010"/><path d="M${x + 60} 150 v34" stroke="#16130f" stroke-width="3"/><path d="M${x + 48} 184 h24 l-4 26 h-16z" fill="#ffcf5a" stroke="#16130f" stroke-width="3"/><circle cx="${x + 60}" cy="198" r="22" fill="#ffcf5a" opacity=".25"/>`; }).join('')}
    <path d="M0 150 l40 -26 h920 l40 26" fill="#8a5a2b" stroke="#16130f" stroke-width="5"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<path d="M${i * 100 + 20} 124 l40 26" stroke="#6b4320" stroke-width="4"/>`).join('')}
    <rect y="372" width="1000" height="88" fill="#d8b07a"/><path d="M0 372 H1000" stroke="#16130f" stroke-width="5"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<path d="M${i * 100} 372 l-30 88" stroke="#b8894f" stroke-width="3"/>`).join('')}<path d="M0 414 H1000" stroke="#b8894f" stroke-width="3"/></svg>`;
}

// ---- البناء ----
function fzBuild(body) {
  body.dataset.built = 'brawl'; FC.last = {}; FC.dmg = {};
  body.innerHTML = `<div class="fzw">
    <div class="fzsel" id="fzSel"></div>
    <div class="fzarena" id="fzArena" hidden>
      <div class="fzhud" id="fzHud"></div>
      <div class="fzstage" id="fzStage"><div class="fzbg" id="fzBg"></div><div class="fzfl" id="fzFl"></div><div class="fzpr" id="fzPr"></div><div class="fzpop" id="fzPop"></div><div class="fzov" id="fzOv"></div></div>
      <div class="fzctl" id="fzCtl"></div>
    </div>
    <div class="fzq" id="fzQ"></div>${logHtml()}
  </div>`;
  const ctl = $('#fzCtl');
  ctl.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; e.preventDefault(); b.classList.add('on');
    try { b.setPointerCapture(e.pointerId); } catch {}
    const a = b.dataset.a;
    if (a === 'L' || a === 'R') { FC.keys[a] = 1; fzMove(); } else if (a === 'block') send({ t: 'fz', a: 'block', on: 1 }); else send({ t: 'fz', a });
  });
  const up = e => { const b = e.target.closest('[data-a]'); if (!b) return; b.classList.remove('on'); const a = b.dataset.a; if (a === 'L' || a === 'R') { FC.keys[a] = 0; fzMove(); } else if (a === 'block') send({ t: 'fz', a: 'block', on: 0 }); };
  ctl.addEventListener('pointerup', up); ctl.addEventListener('pointercancel', up);
  $('#fzSel').addEventListener('click', e => {
    const c = e.target.closest('[data-ch]'); if (c) { FC.hov = c.dataset.ch; fzSelDraw(true); sfx('gclick'); return; }
    if (e.target.closest('#fzLock') && FC.hov) { send({ t: 'fpick', ch: FC.hov }); sfx('bell'); }
  });
  $('#fzSel').addEventListener('dblclick', e => { const c = e.target.closest('[data-ch]'); if (c && fzIn()) send({ t: 'fpick', ch: c.dataset.ch }); });
}
function fzMove() {
  const d = (FC.keys.R ? 1 : 0) - (FC.keys.L ? 1 : 0) || (typeof PAD !== 'undefined' && PAD.on && PAD.mode === 'brawl' && Math.abs(PAD.lx) > .35 ? Math.sign(PAD.lx) : 0);
  if (d !== FC.mv) { FC.mv = d; send({ t: 'fz', a: 'move', d }); }
}
setInterval(() => { if (typeof S !== 'undefined' && S && S.game === 'brawl' && FC.sub === 'fight' && typeof PAD !== 'undefined' && PAD.on) fzMove(); }, 60);
const FZKEY = { j: 'p', 'ت': 'p', k: 'k', 'ن': 'k', u: 's1', 'ع': 's1', i: 's2', 'ه': 's2', o: 'sup', 'خ': 'sup', l: 'sup', 'م': 'sup' };
addEventListener('keydown', e => {
  if (!S || S.game !== 'brawl' || S.phase !== 'play' || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
  const k = e.key.toLowerCase(), g = S.g;
  // شاشة الاختيار بالكيبورد
  if (g && g.sub === 'select' && fzIn() && !g.picks[S.me]) {
    const i = FZ.C.findIndex(c => c.id === FC.hov), n = FZ.C.length;
    const dl = { arrowleft: -1, a: -1, 'ش': -1, arrowright: 1, d: 1, 'ي': 1, arrowup: -3, w: -3, arrowdown: 3, s: 3 }[k];
    if (dl) { e.preventDefault(); FC.hov = FZ.C[((i < 0 ? 0 : i + dl) % n + n) % n].id; fzSelDraw(true); sfx('gclick'); return; }
    if ((k === 'enter' || k === 'j' || k === ' ') && FC.hov) { e.preventDefault(); send({ t: 'fpick', ch: FC.hov }); return; }
    return;
  }
  if (!fzMeF() || FC.sub !== 'fight') return;
  if (['arrowleft', 'a', 'ش'].includes(k)) { e.preventDefault(); if (!FC.keys.L) { FC.keys.L = 1; fzMove(); } return; }
  if (['arrowright', 'd', 'ي'].includes(k)) { e.preventDefault(); if (!FC.keys.R) { FC.keys.R = 1; fzMove(); } return; }
  if (['arrowdown', 's', 'س'].includes(k)) { e.preventDefault(); if (!FC.keys.B) { FC.keys.B = 1; send({ t: 'fz', a: 'block', on: 1 }); } return; }
  if (e.repeat) return;
  const a = FZKEY[k]; if (a) { e.preventDefault(); send({ t: 'fz', a }); }
});
addEventListener('keyup', e => {
  if (!S || S.game !== 'brawl') return; const k = e.key.toLowerCase();
  if (['arrowleft', 'a', 'ش'].includes(k) && FC.keys.L) { FC.keys.L = 0; fzMove(); }
  if (['arrowright', 'd', 'ي'].includes(k) && FC.keys.R) { FC.keys.R = 0; fzMove(); }
  if (['arrowdown', 's', 'س'].includes(k) && FC.keys.B) { FC.keys.B = 0; send({ t: 'fz', a: 'block', on: 0 }); }
});
addEventListener('blur', () => { if (typeof S !== 'undefined' && S && S.game === 'brawl' && (FC.keys.L || FC.keys.R || FC.keys.B)) { if (FC.keys.B) send({ t: 'fz', a: 'block', on: 0 }); FC.keys = {}; fzMove(); } });

// ---- شاشة الاختيار ----
const fzBar = (v, mx) => `<i style="--v:${Math.round(Math.min(1, v / mx) * 100)}%"></i>`;
const FZTY = { proj: 'مقذوف', dash: 'اندفاع', tele: 'انتقال', spin: 'ركلات متتالية', grab: 'مسكة ما تنصد', stomp: 'ضربة أرضية ما تنصد', shield: 'درع', counter: 'صد مضاد', poke: 'ضربة بعيدة', rush: 'هجوم متتالي', beam: 'شعاع', quake: 'زلزال ما ينصد', heal: 'علاج + ضربة' };
function fzSelDraw(force) {
  const g = S.g, el = $('#fzSel'); if (!el || !g || !g.pair) return;
  const mine = fzIn(), locked = mine && g.picks[S.me];
  if (!FC.hov || !FZ.byId[FC.hov]) FC.hov = locked || FZ.C[0].id;
  if (locked) FC.hov = locked;
  const key = JSON.stringify([g.matchN, g.picks, FC.hov]);
  if (!force && el.dataset.k === key) return; el.dataset.k = key;
  const side = (i) => { const id = g.pair[i], c = FZ.byId[g.picks[id]] || (id === S.me ? FZ.byId[FC.hov] : null); return `<div class="fzside s${i}${g.picks[id] ? ' lk' : ''}" style="--c:${c ? c.col : '#555'}">
      <div class="fzbig">${c ? fzSvg(c) : '<b class="fzq">؟</b>'}</div>
      <b>${esc(fzName(id))}${id === S.me ? ' (أنت)' : ''}${id === g.champ && g.matchN > 1 ? ' 👑' : ''}</b><small>${g.picks[id] ? '✔ ' + esc(FZ.byId[g.picks[id]].n) : c ? 'يختار… ' + esc(c.n) : 'يختار…'}</small></div>`; };
  const h = FZ.byId[FC.hov];
  el.innerHTML = `<div class="fzseltop"><h3>اختر مقاتلك</h3><span class="fzst">${esc(FZ.STAGES.find(s => s.id === g.stage).n)}</span><b class="fzclock" id="fzSelT">--</b></div>
    <div class="fzselmid">${side(0)}
      <div class="fzgrid">${FZ.C.map(c => { const taken = Object.entries(g.picks).filter(([, v]) => v === c.id).map(([k]) => g.pair.indexOf(k)); return `<button type="button" class="fzcard${c.id === FC.hov ? ' on' : ''}${taken.length ? ' tk' : ''}" data-ch="${c.id}" style="--c:${c.col};--c2:${c.col2}"${!mine || locked ? ' tabindex="-1"' : ''}>${fzSvg(c, true)}<b>${esc(c.n)}</b>${taken.map(i => `<em class="p${i}">P${i + 1}</em>`).join('')}</button>`; }).join('')}</div>
      ${side(1)}</div>
    <div class="fzinfo" style="--c:${h.col}"><div class="fzih"><b>${esc(h.n)}</b><small>${esc(h.t)}</small></div>
      <div class="fzstats"><span>صحة</span><div>${fzBar(h.hp, 125)}</div><span>سرعة</span><div>${fzBar(h.spd, 420)}</div><span>قوة</span><div>${fzBar(h.pow, 1.25)}</div><span>دفاع</span><div>${fzBar(h.def, 1.1)}</div></div>
      <ul class="fzab"><li><kbd>U</kbd><b>${esc(h.s1.n)}</b><small>${FZTY[h.s1.ty]}</small></li><li><kbd>I</kbd><b>${esc(h.s2.n)}</b><small>${FZTY[h.s2.ty]}</small></li><li class="sup"><kbd>O</kbd><b>${esc(h.sup.n)}</b><small>سوبر · ${FZTY[h.sup.ty]}</small></li></ul>
      ${mine ? (locked ? '<p class="fzwait">✔ تم الاختيار — ننتظر خصمك…</p>' : '<button type="button" class="btn fzlock" id="fzLock">قفّل الاختيار ⚔️</button>') : '<p class="fzwait">تتفرّج 👀 — اللاعبين يختارون</p>'}
    </div>`;
}

// ---- الساحة ----
function fzArenaKey() { const g = S.g; return g.pair.map(id => g.picks[id]).join(',') + '|' + g.matchN; }
function fzArenaBuild() {
  const g = S.g; $('#fzBg').innerHTML = fzStageBg(g.stage);
  $('#fzFl').innerHTML = g.pair.map((id, i) => { const c = fzChOf(id); return `<div class="fzf st-idle" id="fzF${i}" style="--c:${c.col};left:${i ? 70 : 30}%"><div class="fzflip">${fzSvg(c)}</div><span class="fztag${id === S.me ? ' me' : ''}">${id === S.me ? 'أنت' : esc(fzName(id))}</span></div>`; }).join('');
  $('#fzHud').innerHTML = g.pair.map((id, i) => { const c = fzChOf(id); return `<div class="fzhp s${i}" style="--c:${c.col}"><div class="fzpt">${fzSvg(c, true)}</div><div class="fzbars"><div class="fzname"><b>${esc(fzName(id))}</b><small>${esc(c.n)}</small><span class="fzpips" id="fzPip${i}"></span></div><div class="fzlife"><i class="d" id="fzD${i}"></i><i class="h" id="fzH${i}"></i></div><div class="fzmeter"><i id="fzM${i}"></i><small>سوبر</small></div></div></div>`; }).join('<div class="fzmid"><b id="fzTime">٦٠</b><small id="fzRnd"></small></div>');
  const me = g.pair.indexOf(S.me), c = fzChOf(S.me);
  $('#fzCtl').innerHTML = me < 0 ? '<p class="fzwait">تتفرّج 👀 — شجّع بالإيموجي!</p>' : `<div class="fzpad"><button type="button" data-a="L">◀</button><button type="button" data-a="block" class="blk">🛡<small>صد</small></button><button type="button" data-a="R">▶</button></div>
    <div class="fzbtns"><button type="button" data-a="p" class="p">👊<small>لكمة</small></button><button type="button" data-a="k" class="k">🦵<small>ركلة</small></button><button type="button" data-a="s1" class="s s1">✨<small>${esc(c.s1.n)}</small><i></i></button><button type="button" data-a="s2" class="s s2">🌀<small>${esc(c.s2.n)}</small><i></i></button><button type="button" data-a="sup" class="sup">🔥<small>${esc(c.sup.n)}</small></button></div>
    <p class="fzkeys">←/→ أو A/D مشي · S صد · J لكمة · K ركلة · U و I القدرات · O السوبر</p>`;
  FC.last = {}; FC.dmg = {};
}
// الوضعية حسب الحركة
function fzPose(c, st, mv) {
  if (st === 'ko') return 'ko'; if (st === 'win') return 'win'; if (st === 'hit') return 'hit'; if (st === 'block') return 'block'; if (st === 'stance') return 'guard';
  if (st === 'walk') return 'walk'; if (st === 'idle' || !mv) return 'idle';
  const ty = mv === 'p' ? 'punch' : mv === 'k' ? 'kick' : ({ proj: 'cast', beam: 'cast', heal: 'cast', dash: 'kick', spin: 'spin', grab: 'grab', stomp: 'stomp', quake: 'stomp', poke: 'punch', rush: 'rush', counter: 'guard', shield: 'cast', tele: 'idle' })[(c[mv] || {}).ty] || 'punch';
  return (st === 'wind' ? 'w-' : 'x-') + ty;
}
function fzDraw() {
  const g = S.g; if (!g || !g.pair || !FC.f.length) return;
  g.pair.forEach((id, i) => {
    const F = FC.f.find(q => q.id === id), el = $('#fzF' + i); if (!F || !el) return;
    const c = fzChOf(id), pose = fzPose(c, F.st, F.mv);
    el.style.left = (F.x / 10) + '%';
    const cls = `fzf st-${pose.replace(/^[wx]-/, '')} ${pose.startsWith('w-') ? 'wind' : pose.startsWith('x-') ? 'act' : ''} ${F.face < 0 ? 'fl' : ''}${F.fx & 1 ? ' shd' : ''}${F.fx & 2 ? ' inv' : ''}${F.st === 'dash' ? ' dash' : ''}`;
    if (el.dataset.c !== cls) { el.dataset.c = cls; el.className = cls + (el.classList.contains('hurt') ? ' hurt' : ''); }
    if (FC.last[id] !== F.st && F.st === 'wind' && F.mv !== 'p') sfx('whoosh', { gain: .5 });
    FC.last[id] = F.st;
    const pct = Math.max(0, F.hp / F.max * 100);
    const H = $('#fzH' + i), D = $('#fzD' + i); if (H) { H.style.width = pct + '%'; H.className = 'h' + (pct < 25 ? ' low' : pct < 50 ? ' mid' : ''); }
    if (D) { clearTimeout(FC.dmg[id]); FC.dmg[id] = setTimeout(() => { D.style.width = pct + '%'; }, 450); if (parseFloat(D.style.width || 100) < pct) D.style.width = pct + '%'; }
    const M = $('#fzM' + i); if (M) { M.style.width = F.meter + '%'; M.parentNode.classList.toggle('full', F.meter >= 100); }
  });
  // أزرار القدرات (التبريد)
  const me = fzMeF(), ctl = $('#fzCtl');
  if (me && ctl) {
    [['s1', me.c1], ['s2', me.c2]].forEach(([k, t]) => { const b = ctl.querySelector('.' + k); if (!b) return; b.classList.toggle('cd', t > 0); b.querySelector('i').textContent = t > 0 ? fzNum((t / 10).toFixed(1)) : ''; });
    const sb = ctl.querySelector('.sup'); if (sb) sb.classList.toggle('ready', me.meter >= 100);
  }
  // المقذوفات
  const pr = $('#fzPr'); if (pr) {
    while (pr.children.length < FC.pr.length) pr.appendChild(document.createElement('i'));
    [...pr.children].forEach((el, i) => { const p = FC.pr[i]; if (!p) { el.style.display = 'none'; return; } el.style.display = ''; el.className = `fzp ${p[2]}${p[3] ? ' big' : ''}${p[1] < 0 ? ' fl' : ''}`; el.style.left = (p[0] / 10) + '%'; });
  }
}
function fzSide(id) { const g = S.g; return g.pair.indexOf(id); }
function fzEvent(e) {
  const g = S.g, xOf = id => { const F = FC.f.find(q => q.id === id); return F ? F.x / 10 : 50; };
  if (e.k === 'hit') {
    const i = fzSide(e.to), el = $('#fzF' + i), x = xOf(e.to);
    if (el) { el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt'); setTimeout(() => el.classList.remove('hurt'), 260); }
    if (e.tag === 'block') { fzSpark(x, 'blk'); fzPop(`🛡 ${fzNum(e.dmg)}`, 'blk', x); sfx('gclick'); return; }
    fzSpark(x, e.big ? 'big' : '');
    fzPop(`${e.tag === 'counter' ? 'كاونتر! ' : ''}−${fzNum(e.dmg)}`, e.tag === 'counter' ? 'ctr' : e.big ? 'big' : '', x);
    if (e.combo >= 2) fzCombo(e.by, e.combo);
    sfx(e.big || e.tag === 'sup' ? 'smash' : e.tag === 'p' ? 'slap' : 'catch', { gain: e.tag === 'sup' ? .6 : 1 });
    if (e.big || e.tag === 'counter') fzShake();
  } else if (e.k === 'whiff') sfx('whoosh', { gain: .4 });
  else if (e.k === 'super') { fzCutIn(e.id, e.n2); sfx('thunder'); }
  else if (e.k === 'fx') {
    const x = e.x != null ? e.x / 10 : xOf(e.id);
    if (e.fx === 'tele') { fzSpark(x, 'tele'); sfx('zap'); }
    else if (e.fx === 'shield') sfx('chime');
    else if (e.fx === 'shieldbreak') { fzPop('🛡💥', 'blk', x); sfx('bang'); }
    else if (e.fx === 'heal') { fzPop('+💚', 'heal', x); sfx('chime'); }
    else if (e.fx === 'quake') { fzShake(true); sfx('slam'); fzSpark(x, 'quake'); }
    else if (e.fx === 'clash') { fzSpark(x, 'big'); sfx('bang'); }
  }
}
function fzSpark(x, cls) { const p = $('#fzPop'); if (!p) return; const s = document.createElement('i'); s.className = 'fzspk ' + (cls || ''); s.style.left = x + '%'; p.appendChild(s); setTimeout(() => s.remove(), 500); }
function fzPop(html, cls, x) { const p = $('#fzPop'); if (!p) return; const el = document.createElement('b'); el.className = 'fzpx ' + (cls || ''); el.innerHTML = html; el.style.left = x + '%'; el.style.setProperty('--rot', (Math.random() * 14 - 7) + 'deg'); p.appendChild(el); setTimeout(() => el.remove(), 1000); }
function fzCombo(id, n) { const i = fzSide(id), p = $('#fzPop'); if (!p) return; p.querySelectorAll('.fzcombo.s' + i).forEach(x => x.remove()); const el = document.createElement('b'); el.className = 'fzcombo s' + i; el.innerHTML = `${fzNum(n)}<small>ضربات</small>`; p.appendChild(el); setTimeout(() => el.remove(), 1100); }
function fzShake(big) { const s = $('#fzStage'); if (!s) return; s.classList.remove('shake', 'quake'); void s.offsetWidth; s.classList.add(big ? 'quake' : 'shake'); }
function fzCutIn(id, n) {
  const c = fzChOf(id), ov = $('#fzOv'); if (!c || !ov) return;
  const el = document.createElement('div'); el.className = 'fzcut s' + fzSide(id); el.style.setProperty('--c', c.col); el.style.setProperty('--c2', c.col2);
  el.innerHTML = `<div class="fzcutp">${fzSvg(c, true)}</div><b>${esc(n)}</b>`; ov.appendChild(el); setTimeout(() => el.remove(), 1100);
}
function fzBanner(html, cls, ms) {
  const ov = $('#fzOv'); if (!ov) return; ov.querySelectorAll('.fzban').forEach(x => x.remove());
  const el = document.createElement('div'); el.className = 'fzban ' + (cls || ''); el.innerHTML = html; ov.appendChild(el); if (ms) setTimeout(() => el.remove(), ms);
}
window.net_brawl = m => {
  if (!S || S.game !== 'brawl' || !S.g) return;
  if (m.k === 'st') {
    const was = FC.sub; FC.sub = m.sub;
    FC.f = m.f.map(([id, x, hp, meter, st, mv, face, fx, c1, c2]) => ({ id, x, hp, meter, st, mv, face, fx, c1, c2, max: (fzChOf(id) || {}).hp || 100 }));
    FC.pr = m.pr || [];
    if (was === 'rin' && m.sub === 'fight') { fzBanner('قاتل!', 'go', 900); sfx('bell'); }
    fzDraw(); (m.ev || []).forEach(fzEvent);
  } else if (m.k === 'rko') {
    const me = m.w === S.me;
    fzBanner(`${m.ko ? 'K.O!' : 'انتهى الوقت'}${m.perfect ? '<small>PERFECT 🌟</small>' : ''}`, m.ko ? 'ko' : 'to');
    sfx('bell'); if (m.ko) { setTimeout(() => sfx('thud'), 250); fzShake(true); }
    if (me) setTimeout(() => sfx('win'), 900); else if (fzIn()) setTimeout(() => sfx('lose'), 900);
  }
};
function renderBrawl(body) {
  if (body.dataset.built !== 'brawl' || !$('#fzSel')) bxBuildSafe(body);
  const g = S.g, over = S.phase === 'over', sel = $('#fzSel'), ar = $('#fzArena');
  const inSel = g.sub === 'select' && !over;
  sel.hidden = !inSel; ar.hidden = inSel || !g.pair || !g.pair.every(id => g.picks[id]);
  if (over && ar.hidden) { sel.hidden = false; sel.dataset.k = 'over'; sel.innerHTML = `<div class="fzchamp">👑<b>${esc(S.winner || '')}</b><small>بطل الساحة</small></div>`; }
  else if (inSel) { fzSelDraw(); FC.endT = performance.now() + g.left; }
  else if (g.pair && g.pair.every(id => g.picks[id])) {
    const k = fzArenaKey(); if (ar.dataset.k !== k) { ar.dataset.k = k; fzArenaBuild(); FC.f = []; }
    if (!FC.f.length && g.f) FC.f = g.f.map((F, i) => ({ ...F, x: i ? 700 : 300, meter: 0, st: 'idle', face: i ? -1 : 1, fx: 0, c1: 0, c2: 0 }));
    g.pair.forEach((id, i) => { const p = $('#fzPip' + i); if (p) p.innerHTML = [0, 1].map(n => `<i class="${(g.rwins[id] || 0) > n ? 'on' : ''}"></i>`).join(''); });
    const rn = $('#fzRnd'); if (rn) rn.textContent = `الجولة ${fzNum(g.round || 1)}`;
    FC.endT = g.sub === 'fight' ? performance.now() + g.left : 0;
    // الشاشات: VS وبداية الجولة
    const ov = $('#fzOv');
    if (g.sub === 'vs' && ov.dataset.k !== 'vs' + g.matchN) {
      ov.dataset.k = 'vs' + g.matchN; ov.querySelectorAll('.fzvs,.fzban').forEach(x => x.remove());
      const el = document.createElement('div'); el.className = 'fzvs';
      el.innerHTML = g.pair.map((id, i) => { const c = fzChOf(id); return `<div class="v s${i}" style="--c:${c.col};--c2:${c.col2}"><div class="vp">${fzSvg(c)}</div><b>${esc(c.n)}</b><small>${esc(fzName(id))}${id === g.champ && g.matchN > 1 ? ' 👑' : ''}</small></div>`; }).join('<em>VS</em>') + `<p>${esc(FZ.STAGES.find(s => s.id === g.stage).n)}</p>`;
      ov.appendChild(el); setTimeout(() => el.remove(), 3300); sfx('thunder');
    }
    if (g.sub === 'rin' && ov.dataset.r !== g.matchN + ':' + g.round) {
      ov.dataset.r = g.matchN + ':' + g.round; ov.querySelectorAll('.fzvs').forEach(x => x.remove());
      const last = g.rwins[g.pair[0]] === 1 && g.rwins[g.pair[1]] === 1;
      fzBanner(`${last ? 'الجولة الحاسمة' : 'الجولة ' + fzNum(g.round)}`, 'rnd', 1900); sfx('bell');
    }
    if (over) fzBanner(`👑 ${esc(S.winner || '')}<small>بطل الساحة</small>`, 'champ');
    fzDraw();
  }
  if (!FC.timer) FC.timer = setInterval(() => {
    const t = $('#fzTime'), st = $('#fzSelT'); if (!t && !st) { clearInterval(FC.timer); FC.timer = 0; return; }
    const v = FC.endT ? fzNum(Math.max(0, Math.ceil((FC.endT - performance.now()) / 1000))) : '--';
    if (t) { t.textContent = FC.sub === 'fight' || (S.g && S.g.sub === 'fight') ? v : '٦٠'; t.classList.toggle('low', FC.endT && FC.endT - performance.now() < 10000); }
    if (st) st.textContent = v;
  }, 250);
  // الترتيب
  const order = [g.champ, ...(g.pair || []), ...(g.queue || [])].filter((v, i, a) => v && a.indexOf(v) === i);
  $('#fzQ').innerHTML = `<h4>🏆 الترتيب · البطل يحتاج ${fzNum(g.target)}</h4><div>${order.map(id => `<span class="${id === S.me ? 'me' : ''}${(g.pair || []).includes(id) ? ' in' : ''}">${esc(fzName(id))} ${'🏅'.repeat(g.wins[id] || 0)}${'⚪'.repeat(Math.max(0, g.target - (g.wins[id] || 0)))}</span>`).join('')}</div>`;
}
function bxBuildSafe(body) { fzBuild(body); }
