// ================= تراتيب: قطع خشب ترتبها وتطلع الكلمة =================
const TR = { k: -1, pick: [], order: [], busy: false, endT: 0, tm: 0 };
const trNorm = s => String(s || '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
// نقاط الحروف (للزينة مثل سكرابل)
const TRPTS = { ا: 1, ل: 1, م: 1, ن: 1, ي: 1, و: 1, ه: 2, ة: 2, ر: 1, ب: 2, ت: 2, س: 2, ع: 3, ف: 3, ق: 3, ك: 3, د: 2, ح: 3, ج: 3, ش: 4, ص: 4, ط: 4, خ: 5, ز: 4, ث: 6, ذ: 6, ض: 6, ظ: 8, غ: 6, ء: 4, أ: 1, إ: 1, آ: 1, ى: 1, ئ: 4, ؤ: 4 };
const TRCAT = { 'حيوان': '🦁', 'طير': '🦅', 'فاكهة': '🍎', 'خضار': '🥕', 'أكل': '🍛', 'مشروب': '☕', 'دولة': '🌍', 'مدينة سعودية': '🏙️', 'رياضة': '⚽', 'مهنة': '👷', 'بالبيت': '🛋️', 'لون': '🎨', 'بالجسم': '🖐️', 'طبيعة': '🏔️', 'مواصلات': '🚗', 'أداة': '🔧', 'لعبة': '🎮', 'ملابس': '👕' };
const trNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function trBuild(body) {
  body.dataset.built = 'tartayb';
  body.innerHTML = `<div class="trw">
    <div class="trmain">
      <aside class="trside trhis"><h4>📜 الكلمات</h4><ol id="trHist"></ol></aside>
      <div class="trboard" id="trBoard">
        <div class="trtop"><span class="trrnd" id="trRnd"></span><div class="trpips" id="trPips"></div><div class="trring" id="trRing"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19"/><circle cx="22" cy="22" r="19" id="trArc"/></svg><b id="trClock">--</b></div></div>
        <div class="trhint" id="trHint"></div>
        <div class="trslots" id="trSlots"></div>
        <div class="trmsg" id="trMsg"></div>
        <div class="trrack" id="trRack"></div>
        <div class="trbtns" id="trBtns"><button type="button" class="btn sm" data-a="undo">↩ تراجع</button><button type="button" class="btn sm" data-a="mix">🔀 لخبط</button><button type="button" class="btn trsend" data-a="send">أرسل ✓</button></div>
        <p class="trkeys">تقدر تكتب بالكيبورد: الحروف · ⌫ تراجع · Enter أرسل · مسافة لخبط</p>
      </div>
      <aside class="trside"><h4>🏆 النقاط</h4><ol id="trScores"></ol><div class="trlast" id="trLast"></div></aside>
    </div>${logHtml()}</div>`;
  body.querySelector('.trw').addEventListener('click', e => {
    const t = e.target.closest('[data-t]'), b = e.target.closest('[data-a]');
    if (t) { if (t.dataset.from === 'rack') trPick(+t.dataset.t); else trUnpick(+t.dataset.s); return; }
    if (b) { const a = b.dataset.a; if (a === 'undo') trUndo(); else if (a === 'mix') trMix(); else if (a === 'send') trSend(); }
  });
}
const trCan = () => S && S.g && S.g.sub === 'q' && S.phase === 'play' && !S.spec && !TR.busy;
function trPick(i) {
  if (!trCan() || TR.pick.includes(i) || TR.pick.length >= S.g.tiles.length) return;
  TR.pick.push(i); sfx('gclick', { gain: .7 }); trDraw();
  if (TR.pick.length === S.g.tiles.length) setTimeout(trSend, 120);
}
function trUnpick(s) { if (!trCan() || s >= TR.pick.length) return; TR.pick.splice(s, 1); sfx('gclick', { gain: .4 }); trDraw(); }
function trUndo() { if (!trCan() || !TR.pick.length) return; TR.pick.pop(); trDraw(); }
function trMix() { if (!trCan()) return; for (let i = TR.order.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [TR.order[i], TR.order[j]] = [TR.order[j], TR.order[i]]; } sfx('shuffle', { gain: .5 }); trDraw(); }
function trSend() {
  if (!trCan() || !TR.pick.length) return;
  const w = TR.pick.map(i => S.g.tiles[i]).join('');
  send({ t: 'tw', w });
}
window.net_tartayb = m => {
  if (m.k !== 'no' || !S || S.game !== 'tartayb') return;
  const sl = $('#trSlots'); if (!sl) return;
  TR.busy = true; sl.classList.remove('bad'); void sl.offsetWidth; sl.classList.add('bad'); sfx('lose', { gain: .5 });
  setTimeout(() => { TR.busy = false; TR.pick = []; sl.classList.remove('bad'); trDraw(); }, 520);
};
addEventListener('keydown', e => {
  if (!S || S.game !== 'tartayb' || S.phase !== 'play' || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (!S.g || S.g.sub !== 'q') return;
  if (e.key === 'Backspace') { e.preventDefault(); trUndo(); return; }
  if (e.key === 'Enter') { e.preventDefault(); trSend(); return; }
  if (e.key === ' ') { e.preventDefault(); trMix(); return; }
  if (e.key === 'Escape') { TR.pick = []; trDraw(); return; }
  if (e.key.length !== 1 || !/[ء-ي]/.test(e.key)) return;
  const k = trNorm(e.key), i = TR.order.find(j => !TR.pick.includes(j) && trNorm(S.g.tiles[j]) === k);
  if (i != null) { e.preventDefault(); trPick(i); }
});
const trTile = (c, attrs, cls = '') => `<button type="button" class="trt ${cls}" ${attrs}><span>${esc(c)}</span><small>${trNum(TRPTS[c] || 1)}</small></button>`;
function trDraw() {
  const g = S.g; if (!g || !$('#trSlots')) return;
  const q = g.sub === 'q', show = g.sub === 'show' || S.phase === 'over', n = g.len || 0;
  // الخانات
  let slots = '';
  if (show && g.word) slots = [...g.word].map((c, i) => trTile(c, `style="--d:${i * 70}ms" tabindex="-1"`, 'gold')).join('');
  else for (let s = 0; s < n; s++) { const i = TR.pick[s]; slots += i != null ? trTile(g.tiles[i], `data-t="${i}" data-s="${s}" data-from="slot"`, 'in') : '<i class="trslot"></i>'; }
  $('#trSlots').innerHTML = slots;
  // الرف
  $('#trRack').innerHTML = q ? TR.order.map((i, k) => trTile(g.tiles[i], `data-t="${i}" data-from="rack" style="--r:${[-4, 3, -2, 5, -3, 2, -5, 4][k % 8]}deg"`, TR.pick.includes(i) ? 'used' : '')).join('') : '';
  $('#trBtns').hidden = !q || S.spec;
}
function renderTartayb(body) {
  if (body.dataset.built !== 'tartayb' || !$('#trSlots')) trBuild(body);
  const g = S.g, over = S.phase === 'over';
  if (TR.k !== g.k) { TR.k = g.k; TR.pick = []; TR.busy = false; TR.order = (g.tiles || []).map((_, i) => i); if (g.sub === 'q' && g.k > 0) sfx('shuffle', { gain: .6 }); }
  $('#trRnd').innerHTML = over ? '<b>انتهت اللعبة</b>' : g.sub === 'intro' ? '<b>استعدوا… 🔤</b>' : `الجولة <b>${trNum(g.k)}</b> من ${trNum(g.count)}`;
  $('#trHint').innerHTML = g.hint && !over ? `<span class="trcat">${TRCAT[g.hint] || '💡'}</span><span>تلميح: <b>${esc(g.hint)}</b></span><span class="trlen">${trNum(g.len)} حروف</span>` : '';
  $('#trHint').hidden = !$('#trHint').innerHTML;
  $('#trPips').innerHTML = Array.from({ length: g.count }, (_, i) => { const h = (g.hist || []).find(x => x.k === i + 1); return `<i class="${h ? (h.id === S.me ? 'me' : h.id ? 'done' : 'miss') : i + 1 === g.k ? 'cur' : ''}"></i>`; }).join('');
  $('#trHist').innerHTML = (g.hist || []).slice().reverse().map(h => `<li><span class="trc">${TRCAT[h.hint] || '•'}</span><b>${esc(h.w)}</b><small>${h.id ? esc(pn(h.id)) + ' · ' + trNum((h.ms / 1000).toFixed(1)) + 'ث' : 'محد حلّها'}</small></li>`).join('') || '<li class="emp">تطلع هنا الكلمات اللي انحلت</li>';
  const msg = $('#trMsg');
  if (g.sub === 'show' || over) {
    const w = g.win;
    msg.innerHTML = over ? `🏆 ${esc(S.winner || '')}` : w ? `⚡ <b>${esc(pn(w.id))}</b> رتّبها بـ ${trNum((w.ms / 1000).toFixed(1))} ث${w.id === S.me ? ' — نقطة لك! 🎉' : ''}` : '⏱ خلص الوقت ومحد حلّها';
    msg.className = 'trmsg on' + (w && w.id === S.me ? ' me' : '');
    if (msg.dataset.k !== String(g.k) + g.sub) { msg.dataset.k = String(g.k) + g.sub; if (!over) sfx(w && w.id === S.me ? 'win' : w ? 'bell' : 'thud', { gain: .6 }); }
  } else { msg.className = 'trmsg'; msg.innerHTML = g.sub === 'intro' ? 'أسرع واحد يرتّب الحروف ياخذ النقطة' : ''; }
  // النقاط
  const ps = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0));
  $('#trScores').innerHTML = ps.map((p, i) => `<li class="${p.id === S.me ? 'me' : ''}${g.win && g.win.id === p.id && g.sub === 'show' ? ' hit' : ''}"><b>${trNum(i + 1)}</b><span class="pav">${esc(p.av || (p.bot ? '🤖' : [...p.name.trim()][0] || '؟'))}</span><span class="nm nt">${esc(p.name)}</span><em>${trNum(g.scores[p.id] || 0)}</em></li>`).join('');
  $('#trLast').innerHTML = [g.best ? `⚡ أسرع حل: <b>${esc(pn(g.best.id))}</b> بـ ${trNum((g.best.ms / 1000).toFixed(1))} ث (${esc(g.best.w)})` : '', g.last && g.sub === 'q' ? `الكلمة اللي فاتت: <b>${esc(g.last.w)}</b>` : ''].filter(Boolean).map(x => `<p>${x}</p>`).join('');
  $('#trLast').hidden = !$('#trLast').innerHTML;
  // الوقت
  TR.endT = g.sub === 'q' ? performance.now() + g.left : 0;
  if (!TR.tm) TR.tm = setInterval(() => {
    const c = $('#trClock'), arc = $('#trArc'); if (!c) { clearInterval(TR.tm); TR.tm = 0; return; }
    const left = TR.endT ? Math.max(0, TR.endT - performance.now()) : 0, tot = ((S.g && S.g.sec) || 30) * 1000;
    c.textContent = TR.endT ? trNum(Math.ceil(left / 1000)) : '--'; c.parentNode.classList.toggle('low', !!TR.endT && left < 6000);
    arc.style.strokeDashoffset = 119.4 * (1 - (TR.endT ? left / tot : 0));
  }, 200);
  trDraw();
}
