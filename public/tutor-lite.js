// زر «شرح اللعبة بالفيديو»: الملف الكبير tutor.js ما ينحمّل إلا لما تضغط الزر (أخف على الجوال)
(() => {
  const HAS = ['auction', 'bomb', 'chess', 'codes', 'draw', 'feud', 'fib', 'flags', 'flip', 'haunt', 'hive', 'jackaroo', 'jwb', 'liars', 'mafia', 'mimic', 'outside', 'phone', 'sus', 'typing', 'uno'];
  let p = null; const load = () => p || (p = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'tutor.js' + (window.GV && GV['tutor.js'] ? '?v=' + GV['tutor.js'] : ''); s.onload = ok; s.onerror = () => { p = null; no(); }; document.body.appendChild(s); }));
  window.tutOpen = (g, i) => load().then(() => window.tutOpen(g, i)).catch(() => toast && toast('ما قدرنا نفتح الشرح، جرب مرة ثانية'));
  const r0 = render;
  render = function () {
    r0.apply(this, arguments);
    try {
      let b = $('#tutBtn');
      if (!b) { const h = $('#ghelp'); if (!h) return; b = document.createElement('button'); b.type = 'button'; b.id = 'tutBtn'; b.className = 'btn sm tutb'; b.innerHTML = '📺 شرح اللعبة بالفيديو'; h.after(b); b.onclick = () => S && window.tutOpen(S.game); }
      b.hidden = !(S && S.phase === 'lobby' && HAS.includes(S.game));
    } catch (e) { console.warn(e); }
  };
})();
