// ================= بينقو — ٣ أشكال (ديوانية / قاعة / برنامج تلفزيوني) =================
const BG = { mk: new Set(), pend: 0, last: -1, skin: null, tmr: 0, endT: 0, voice: false };
const BGL = ['ب', 'ي', 'ن', 'ق', 'و'];
const BGC = { hall: ['#d8342b', '#f2b705', '#1f8f52', '#1c5fd0', '#7b3fc7'], tv: ['#ff3b5c', '#ffd23b', '#3bff9a', '#3bd6ff', '#ff3bd6'] };
const bgNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const bgLet = n => BGL[Math.floor((n - 1) / 15)];
const BGSK = { diw: 'ديوانية', hall: 'قاعة بينقو', tv: 'برنامج تلفزيوني' };
function bgSkin() { let s = null; try { s = localStorage.getItem('tbingo-skin'); } catch {} return BGSK[s] ? s : (S.g.skin || 'diw'); }
function renderBingo(body) {
  const g = S.g; if (!g) return;
  if (body.dataset.built !== 'bingo' || !document.getElementById('bgW')) {
    body.dataset.built = 'bingo'; BG.last = -1; BG.mk = new Set(g.marks); BG.pend = 0;
    try { BG.voice = localStorage.getItem('tbingo-voice') === '1'; } catch {}
    body.innerHTML = `<div class="bgw" id="bgW"><div class="bgmain"><div class="bgcard" id="bgCard"></div><div class="bgside" id="bgSide"></div></div>
      <div class="bgtools"><span>الشكل:</span>${Object.entries(BGSK).map(([k, v]) => `<button data-sk="${k}">${v}</button>`).join('')}<button id="bgVoice"></button></div><div class="bgfx" id="bgFx"></div></div>`;
    body.querySelectorAll('[data-sk]').forEach(b => b.onclick = () => { try { localStorage.setItem('tbingo-skin', b.dataset.sk); } catch {} renderBingo(body); });
    body.querySelector('#bgVoice').onclick = () => { BG.voice = !BG.voice; try { localStorage.setItem('tbingo-voice', BG.voice ? '1' : '0'); } catch {} renderBingo(body); };
    body.querySelector('#bgCard').addEventListener('click', e => {
      const c = e.target.closest('[data-n]'); if (!c || S.phase !== 'play') return; const n = +c.dataset.n;
      if (!S.g.called.includes(n)) { c.classList.remove('nope'); void c.offsetWidth; c.classList.add('nope'); return; }
      BG.mk.has(n) ? BG.mk.delete(n) : BG.mk.add(n); BG.pend = Date.now(); send({ t: 'bmark', n }); bgCard(); try { sfx('gclick'); } catch {}
    });
  }
  const sk = bgSkin(), W = document.getElementById('bgW');
  W.className = 'bgw sk-' + sk; W.querySelectorAll('[data-sk]').forEach(b => b.classList.toggle('on', b.dataset.sk === sk));
  document.getElementById('bgVoice').textContent = BG.voice ? 'صوت المذيع: شغّال' : 'صوت المذيع: طافي';
  if (Date.now() - BG.pend > 1500) BG.mk = new Set(g.marks);
  if (g.auto) for (const n of g.called) if ((g.card || []).includes(n)) BG.mk.add(n);
  bgCard(); bgSide();
  if (g.last !== BG.last) { if (BG.last !== -1 && g.last) bgCall(g.last); BG.last = g.last; }
  BG.endT = performance.now() + (g.left || 0);
  if (!BG.tmr) BG.tmr = setInterval(() => { const t = document.getElementById('bgTime'); if (!t || !S || !S.g) { if (!document.getElementById('bgW')) { clearInterval(BG.tmr); BG.tmr = 0; } return; } const l = Math.max(0, BG.endT - performance.now()); t.style.width = (100 - l / (S.g.speed || 5000) * 100) + '%'; const f = document.getElementById('bgFrz'); if (f) { const fl = Math.max(0, BG.frzT - performance.now()); f.textContent = fl ? `انتظر ${bgNum(Math.ceil(fl / 1000))}` : ''; const b = document.getElementById('bgClaim'); if (b) b.disabled = fl > 0 || S.phase !== 'play'; } }, 200);
}
function bgCard() {
  const g = S.g, el = document.getElementById('bgCard'); if (!el) return;
  if (!g.card) { el.innerHTML = '<p class="bgspec">تتفرج — الأرقام تطلع على اليسار</p>'; return; }
  const sk = bgSkin(), called = new Set(g.called), win = g.winner === S.me;
  el.innerHTML = BGL.map((l, i) => `<div class="bgh" style="--c:${(BGC[sk] || [])[i] || ''}">${l}</div>`).join('') + g.card.map(n => {
    const on = n === 0 || BG.mk.has(n), can = n && called.has(n) && !on;
    return `<button class="bgc${on ? ' on' : ''}${can ? ' can' : ''}" ${n ? `data-n="${n}"` : ''}>${n ? bgNum(n) : `<span class="free">${sk === 'tv' ? '★' : sk === 'hall' ? 'مجاني' : 'ترتيب'}</span>`}${on && n ? '<i class="mk"></i>' : ''}</button>`;
  }).join('');
}
function bgSide() {
  const g = S.g, el = document.getElementById('bgSide'), sk = bgSkin(), over = S.phase === 'over';
  const goal = g.goal === 'full' ? 'الورقة كاملة' : g.goal === 'two' ? 'خطين' : 'خط واحد';
  const rec = g.called.slice(-6, -1).reverse();
  const ids = S.players.map(p => p.id).filter(id => g.near[id] !== undefined).sort((a, b) => g.near[a] - g.near[b]);
  const big = g.last ? (sk === 'hall' ? `<div class="bgball"><span><small>${bgLet(g.last)}</small><b>${bgNum(g.last)}</b></span></div>` : sk === 'tv' ? `<div class="bgscreen">${bgNum(g.last)}<small>${bgLet(g.last)}</small></div>` : `<div class="bgnote"><small>الرقم</small><b>${bgNum(g.last)}</b><small>عمود «${bgLet(g.last)}»</small></div>`) : `<div class="bgnote"><small>استعدوا…</small><b>؟</b></div>`;
  BG.frzT = performance.now() + (g.frozen || 0);
  el.innerHTML = `${sk === 'hall' ? '<div class="bgcage"><i></i><i></i><i></i><i></i><i></i></div>' : ''}${big}
    <div class="bgprog"><i id="bgTime"></i></div>
    <div class="bgrec">${rec.map(n => `<span style="--c:${(BGC[sk] || [])[Math.floor((n - 1) / 15)] || ''}">${bgNum(n)}</span>`).join('')}</div>
    <p class="bginfo">المطلوب: ${goal} · طلع ${bgNum(g.called.length)} من ٧٥</p>
    ${over ? `<div class="bgwin">${g.winner ? esc(pn(g.winner)) + ' قال بينقو!' : 'خلصت الأرقام'}</div>` : g.card ? `<button class="bgclaim" id="bgClaim">بينقو!</button><small id="bgFrz" class="bgfrz"></small>` : ''}
    <div class="bgnear"><b>${sk === 'tv' ? 'قريبين من بينقو:' : 'الأقرب للفوز:'}</b>${ids.slice(0, 8).map(id => `<i class="${g.near[id] <= 1 ? 'hot' : ''}${id === S.me ? ' me' : ''}">${esc(pn(id))} · ${g.near[id] ? 'باقي ' + bgNum(g.near[id]) : 'جاهز!'}</i>`).join('')}${ids.length > 8 ? `<i>+${bgNum(ids.length - 8)}</i>` : ''}</div>`;
  const b = document.getElementById('bgClaim'); if (b) b.onclick = () => send({ t: 'bclaim' });
}
function bgCall(n) {
  try { sfx('ding'); } catch {}
  const el = document.querySelector('.bgball,.bgscreen,.bgnote'); if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  if (BG.voice && window.speechSynthesis) { try { const u = new SpeechSynthesisUtterance(`${bgLet(n)}، ${n}`); u.lang = 'ar-SA'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {} }
}
function net_bingo(m) {
  if (!S || S.game !== 'bingo') return; const fx = document.getElementById('bgFx'); if (!fx) return;
  if (m.k === 'win') { const d = document.createElement('div'); d.className = 'bgstamp'; d.textContent = 'بينقو!'; fx.appendChild(d); setTimeout(() => d.remove(), 3000); try { sfx('win'); } catch {} }
  if (m.k === 'bad') { const d = document.createElement('div'); d.className = 'bgtoast'; d.innerHTML = `${esc(pn(m.id))} قال بينقو وهو غلطان!`; fx.appendChild(d); setTimeout(() => d.remove(), 2500); try { sfx('nope'); } catch {} }
}
