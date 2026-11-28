// الترجمة: القاموس الكبير (i18n-dict.js) ما ينحمّل إلا لو اللغة إنجليزي أو ضغطت EN (أخف على الجوال)
(function () {
  let p = null; const load = () => p || (p = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'i18n-dict.js' + (window.GV && GV['i18n-dict.js'] ? '?v=' + GV['i18n-dict.js'] : ''); s.onload = ok; s.onerror = () => { p = null; no(); }; document.body.appendChild(s); }));
  const I = window.I18N = { lang: 'ar', lite: true, t: s => s, set(l) { if (l !== 'en') return; load().then(() => { if (!window.I18N.lite) window.I18N.set('en'); }).catch(() => {}); } };
  let saved = 'ar'; try { saved = JSON.parse(localStorage.getItem('tarteeb-lang')) || 'ar'; } catch {}
  if (saved === 'en') load();
})();

// زر اللغة + شاشة البداية
(function () {
  const toggle = () => I18N.set(I18N.lang === 'en' ? 'ar' : 'en');
  const lb = document.getElementById('langBtn'); if (lb) lb.onclick = toggle;
  const sp = document.getElementById('splash'); if (!sp) return;
  const sl = document.getElementById('spLang'); sl.textContent = I18N.lang === 'en' ? 'ع' : 'EN';
  sl.onclick = e => { e.stopPropagation(); toggle(); sl.textContent = I18N.lang === 'en' ? 'ع' : 'EN'; };
  // زر «ابدأ» واختيار الجو في worlds.js
})();
