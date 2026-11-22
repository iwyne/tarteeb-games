// إعادة آخر لحظة بالألعاب الحركية (الملاكمة، ساحة القتال، المطاردة، إشارة حمرا خضرا):
// نحفظ آخر ٨ ثواني من اللي يوصل من السيرفر (حالة اللعبة ورسايل الحركة gnet)، ولما تخلص الجولة يطلع زر «شوف آخر لحظة»
// يعيد تشغيلها بنفس الرسم بالحركة البطيئة، وبعدها نرجع للحالة الحقيقية.
const RP = { buf: [], on: false, real: null, held: [], game: null, end: 0 };
const RP_GAMES = ['boxing', 'brawl', 'cars', 'redlight'];
const rpKeep = () => { const cut = Date.now() - 8000; while (RP.buf.length && RP.buf[0].t < cut) RP.buf.shift(); };
function rpHook(m) { // حالة اللعبة. يرجع true لو لازم ما نرسم الحين (وقت الإعادة)
  if (RP.on) { RP.real = m; return true; }
  if (!RP_GAMES.includes(m.game)) { RP.buf = []; RP.game = null; return false; }
  if (m.game !== RP.game || m.phase === 'lobby') { RP.buf = []; RP.game = m.game; RP.end = 0; }
  if (m.phase === 'play') { RP.buf.push({ k: 's', m, t: Date.now() }); rpKeep(); }
  if (m.phase === 'over') { if (!RP.end) RP.end = Date.now(); setTimeout(rpButton, 50); }
  return false;
}
function rpNet(m) { // رسايل الحركة
  if (!RP_GAMES.includes(m.g)) return false;
  if (RP.on) { RP.held.push(m); return true; }
  if (S && S.game === m.g && (S.phase === 'play' || (S.phase === 'over' && Date.now() - RP.end < 2500))) { RP.buf.push({ k: 'n', m, t: Date.now() }); rpKeep(); }
  return false;
}
function rpButton() {
  let b = document.getElementById('rpBtn');
  if (!S || S.phase !== 'over' || !RP_GAMES.includes(S.game) || RP.buf.length < 8) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('button'); b.id = 'rpBtn'; b.className = 'btn yellow rpbtn'; b.textContent = 'شوف آخر لحظة'; b.onclick = rpPlay; }
  const o = document.getElementById('over2'); if (o && b.parentNode !== o) o.prepend(b);
}
async function rpPlay() {
  if (RP.on || RP.buf.length < 2) return;
  RP.on = true; RP.real = S; RP.held = []; const frames = RP.buf.slice(), slow = 1.7, net = window['net_' + S.game];
  document.body.classList.add('rplay'); const tag = document.createElement('div'); tag.className = 'rptag'; tag.textContent = 'إعادة'; document.body.appendChild(tag);
  const first = frames.find(f => f.k === 's'); if (first) { S = Object.assign({}, first.m, { t0: Date.now() }); render(); }
  try {
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      if (f.k === 's') { S = Object.assign({}, f.m, { t0: Date.now() }); render(); } else if (typeof net === 'function') net(f.m);
      const nx = frames[i + 1]; if (nx) await new Promise(ok => setTimeout(ok, Math.min(400, nx.t - f.t) * slow));
    }
    await new Promise(ok => setTimeout(ok, 1200));
  } catch (e) { console.warn('replay', e); }
  RP.on = false; tag.remove(); document.body.classList.remove('rplay');
  S = RP.real; RP.real = null; render(); RP.held.forEach(m => { if (typeof net === 'function') net(m); }); RP.held = []; rpButton();
}
