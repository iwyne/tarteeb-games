// ================= الكراسي الموسيقية — المجلس =================
const CR = { k: -1, sub: '', t0: 0, ac: null, beat: 0, loop: 0, ring: null, sig: '' };
const chNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const CHCOL = ['#ffc928', '#ff8fc0', '#7fa6ff', '#5ed38c', '#ffb35c', '#c6a8ff', '#7fdcff', '#ff5a4f', '#f4f1ea', '#9ad1ff'];
const CHSPD = 26; // درجة بالثانية
// إيقاع طقاقة بسيط (دُم تك تك دُم تك) بالـ WebAudio
function chDrum(type) {
  try {
    const ac = CR.ac || (CR.ac = new (window.AudioContext || window.webkitAudioContext)()); if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    if (type === 'dum') { o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + .18); g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); }
    else { o.type = 'triangle'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(260, t + .05); g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .09); }
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + .3);
    if (type !== 'dum') { const n = ac.createBufferSource(), b = ac.createBuffer(1, ac.sampleRate * .06, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); n.buffer = b; const gn = ac.createGain(); gn.gain.value = .18; n.connect(gn); gn.connect(ac.destination); n.start(t); }
  } catch {}
}
function chMusic(on) {
  clearInterval(CR.loop); CR.loop = 0; let muted = false; try { muted = localStorage.getItem('tarteeb-mute') === '1'; } catch {} if (!on || muted) return;
  const pat = ['dum', '', 'tak', 'tak', 'dum', 'tak', '', 'tak']; CR.beat = 0;
  CR.loop = setInterval(() => { const p = pat[CR.beat++ % pat.length]; if (p) chDrum(p); }, 170);
}
function chBuild(body) {
  body.dataset.built = 'chairs';
  body.innerHTML = `<div class="chw"><div class="chstage" id="chStage">
      <div class="chrug"></div>
      <div class="chdallah"><svg viewBox="0 0 80 100"><path d="M28 30 Q20 30 20 40 L16 82 Q16 92 26 92 H54 Q64 92 64 82 L60 40 Q60 30 52 30Z" fill="#f0c45a" stroke="#16130f" stroke-width="4"/><path d="M60 46 Q74 36 76 18 Q66 26 62 30" fill="none" stroke="#16130f" stroke-width="4"/><path d="M60 46 Q74 36 76 18" fill="none" stroke="#f0c45a" stroke-width="2"/><path d="M22 52 Q8 56 10 72 Q12 82 20 80" fill="none" stroke="#16130f" stroke-width="5"/><ellipse cx="40" cy="30" rx="13" ry="5" fill="#d9a33a" stroke="#16130f" stroke-width="3"/><path d="M34 26 Q40 6 46 26" fill="#f0c45a" stroke="#16130f" stroke-width="3"/><circle cx="40" cy="9" r="4" fill="#f0c45a" stroke="#16130f" stroke-width="2.5"/></svg></div>
      <div class="chseats" id="chSeats"></div>
      <div class="chring" id="chRing"></div>
      <div class="chtop"><span class="chpill" id="chRnd"></span><span class="chpill" id="chCnt"></span></div>
      <div class="chban" id="chBan"></div>
      <p class="chkeys">اضغط على أي طرّاحة فاضية — أو مسافة تقعد على أقرب وحدة لك</p>
    </div>${logHtml()}</div>`;
  $('#chSeats').addEventListener('pointerdown', e => { const b = e.target.closest('[data-i]'); if (!b) return; e.preventDefault(); send({ t: 'cs', i: +b.dataset.i }); });
}
addEventListener('keydown', e => {
  if (!S || S.game !== 'chairs' || S.phase !== 'play' || e.key !== ' ' || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
  e.preventDefault(); const g = S.g; if (!g) return;
  // أقرب طرّاحة فاضية لمكانك بالدائرة
  const me = g.alive.indexOf(S.me); if (me < 0) return;
  const ang = chAngle(me, g.alive.length), free = g.seats.map((s, i) => s ? null : i).filter(i => i !== null);
  if (!free.length) return; let best = free[0], bd = 1e9;
  free.forEach(i => { const a = -90 + i / g.n * 360, d = Math.abs(((ang - a) % 360 + 540) % 360 - 180); if (d < bd) { bd = d; best = i; } });
  send({ t: 'cs', i: best });
});
function chAngle(i, n) { const run = CR.sub === 'music' ? (performance.now() - CR.t0) / 1000 * CHSPD : CR.frozen || 0; return -90 + i / n * 360 + run; }
function chBanner(html, cls, ms) { const b = $('#chBan'); if (!b) return; b.className = 'chban show ' + (cls || ''); b.innerHTML = html; clearTimeout(chBanner.t); if (ms) chBanner.t = setTimeout(() => b.classList.remove('show'), ms); }
window.net_chairs = m => { if (m.k === 'stop' && S && S.game === 'chairs') { CR.frozen = (performance.now() - CR.t0) / 1000 * CHSPD; chMusic(false); chBanner('✋ اقعد!', 'stop', 1500); sfx('thud'); } };
function chFrame() {
  const ring = $('#chRing'); if (!ring || !S || S.game !== 'chairs') { CR.raf = 0; return; }
  CR.raf = requestAnimationFrame(chFrame);
  const g = S.g; if (!g) return;
  const n = g.alive.length;
  ring.querySelectorAll('.chp').forEach(el => {
    const id = el.dataset.id, i = g.alive.indexOf(id), seat = g.seats.indexOf(id);
    let x, y;
    if (seat >= 0) { const a = (-90 + seat / g.n * 360) * Math.PI / 180; x = 50 + Math.cos(a) * 27; y = 50 + Math.sin(a) * 27; }
    else if (i >= 0) { const a = chAngle(i, n) * Math.PI / 180; x = 50 + Math.cos(a) * 41; y = 50 + Math.sin(a) * 41; }
    else return;
    el.style.left = x + '%'; el.style.top = y + '%';
  });
}
function renderChairs(body) {
  if (body.dataset.built !== 'chairs' || !$('#chSeats')) chBuild(body);
  const g = S.g, over = S.phase === 'over';
  // الطراحات
  const sig = g.k + ':' + g.n;
  if (CR.sig !== sig) { CR.sig = sig; $('#chSeats').innerHTML = Array.from({ length: g.n }, (_, i) => { const a = -90 + i / g.n * 360, r = a * Math.PI / 180; return `<button type="button" class="chseat" data-i="${i}" style="left:${50 + Math.cos(r) * 27}%;top:${50 + Math.sin(r) * 27}%;--a:${a + 90}deg"><i></i></button>`; }).join(''); }
  $('#chSeats').querySelectorAll('.chseat').forEach((b, i) => { b.classList.toggle('taken', !!g.seats[i]); b.classList.toggle('free', g.sub === 'grab' && !g.seats[i]); b.disabled = !g.alive.includes(S.me) || !!g.seats[i]; });
  // اللاعبين
  const ring = $('#chRing'), have = new Set([...ring.children].map(x => x.dataset.id));
  g.all.forEach((id, k) => { if (have.has(id)) return; const p = S.players.find(q => q.id === id); const el = document.createElement('div'); el.className = 'chp'; el.dataset.id = id; el.style.setProperty('--c', CHCOL[k % CHCOL.length]); el.innerHTML = `<span class="pav">${esc((p && (p.av || (p.bot ? '🤖' : [...p.name.trim()][0]))) || '؟')}</span><small>${esc(p ? p.name : '؟')}</small>`; ring.appendChild(el); });
  ring.querySelectorAll('.chp').forEach(el => { const id = el.dataset.id; el.classList.toggle('out', !g.alive.includes(id)); el.classList.toggle('me', id === S.me); el.classList.toggle('sat', g.seats.includes(id)); el.classList.toggle('stun', g.stun.includes(id)); el.classList.toggle('lost', !!(g.res && g.res.out.includes(id))); });
  // الحالة والصوت
  if (CR.sub !== g.sub || CR.k !== g.k) {
    const was = CR.sub; CR.sub = g.sub; CR.k = g.k;
    if (g.sub === 'music') { CR.t0 = performance.now() - (CR.frozen || 0) / CHSPD * 1000; chMusic(true); chBanner('🎵 الطقاقة شغالة…', 'music', 1600); }
    else chMusic(false);
    if (g.sub === 'res' && g.res) { const o = g.res.out; chBanner(o.includes(S.me) ? '💀 ما لقيت مكان!' : o.length ? `💀 ${o.map(id => esc(pn(id))).join('، ')}<small>ما لقى مكان</small>` : 'الكل قعد!', 'res', 3300); sfx(o.includes(S.me) ? 'lose' : 'bang', { gain: .6 }); }
    if (g.sub === 'intro') chBanner('🎵 الكراسي الموسيقية<small>لما توقف الطقاقة اقعد على أقرب طرّاحة</small>', 'music', 2800);
  }
  if (g.stun.includes(S.me) && g.sub === 'music' && !CR.stunned) { CR.stunned = 1; chBanner('😅 تسرّعت!<small>بتتأخر شوي لما توقف</small>', 'res', 1500); sfx('nope'); }
  if (g.sub !== 'music') CR.stunned = 0;
  if (over) { chMusic(false); chBanner(`👑 ${esc(S.winner || '')}<small>آخر واحد قاعد</small>`, 'res'); }
  $('#chRnd').textContent = over ? '🏆 انتهت' : g.k ? `الجولة ${chNum(g.k)}` : 'استعدوا';
  $('#chCnt').textContent = `👥 ${chNum(g.alive.length)} · 🪑 ${chNum(g.n)}`;
  if (!CR.raf) CR.raf = requestAnimationFrame(chFrame);
}
