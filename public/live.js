// ================= نقاط السيرفر + المتفرجين (عدد، تصويت مين بيفوز) =================
const lvNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

// بطاقة «خلصت الجولة»: كم نقطة أخذت ومن وين، ومستواك
function showPts(m) {
  setTimeout(() => {
    let c = document.getElementById('ptsCard'); if (c) c.remove();
    c = document.createElement('div'); c.id = 'ptsCard'; c.className = 'ptscard';
    const left = m.need - m.into;
    const chip = m.up ? `وصلت المستوى ${lvNum(m.lvl)}` : m.rankUp ? `طلعت للمركز ${lvNum(m.rank)} بالأسبوع` : '';
    c.innerHTML = `<button class="ptsx" aria-label="إغلاق">✕</button><h3>خلصت الجولة</h3><div class="ptsbig">+${lvNum(m.add)}</div><p>نقطة سيرفر</p>
      ${m.items.map(([t, n]) => `<div class="ptsrow"><span>${esc(t)}</span><em>+${lvNum(n)}</em></div>`).join('')}
      <div class="ptslv"><span>المستوى ${lvNum(m.lvl)}</span><span>باقي ${lvNum(left)} للمستوى ${lvNum(m.lvl + 1)}</span></div>
      <div class="ptsbar"><i style="width:${Math.round((m.into - (m.up ? 0 : Math.min(m.add, m.into))) / m.need * 100)}%"></i></div>
      ${chip ? `<div class="ptschip">${chip}</div>` : ''}<small class="ptstot">مجموعك ${lvNum(m.pts)}</small>`;
    document.body.appendChild(c);
    const bar = c.querySelector('.ptsbar i');
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = Math.round(m.into / m.need * 100) + '%'; }));
    const close = () => { c.classList.add('out'); setTimeout(() => c.remove(), 350); };
    c.querySelector('.ptsx').onclick = close;
    setTimeout(() => c.isConnected && close(), 9000);
    try { sfx('coin'); if (m.up || m.rankUp) setTimeout(() => sfx('chime'), 400); } catch {}
  }, 1300);
}

// لوحة التصويت: تطلع وقت اللعب إذا فيه متفرجين. المتفرج يضغط على لاعب يصوّت له، والكل يشوف النسب.
const LV = { open: null };
function lvUpdate() {
  let el = document.getElementById('spvote');
  const show = S && S.phase === 'play' && S.vt && S.specs && S.specs.length && S.players.length > 1;
  if (!show) { if (el) el.hidden = true; return; }
  if (!el) {
    el = document.createElement('div'); el.id = 'spvote'; el.className = 'spv'; document.body.appendChild(el);
    el.addEventListener('click', e => {
      if (e.target.closest('.spvh')) { LV.open = !lvIsOpen(); lvUpdate(); return; }
      const b = e.target.closest('[data-v]'); if (!b || !S.spec) return;
      send({ t: 'svote', id: S.vt.me === b.dataset.v ? null : b.dataset.v }); try { sfx('gclick'); } catch {}
    });
  }
  el.hidden = false;
  const c = S.vt.c, tot = Object.values(c).reduce((a, n) => a + n, 0);
  const ps = [...S.players].sort((a, b) => (c[b.id] || 0) - (c[a.id] || 0));
  const lead = tot ? ps[0] : null, pc = id => tot ? Math.round((c[id] || 0) / tot * 100) : 0;
  const open = lvIsOpen();
  el.classList.toggle('open', open); el.classList.toggle('canvote', !!S.spec);
  el.innerHTML = `<button class="spvh"><b>مين بيفوز؟</b><small>${open ? (S.spec ? 'اضغط على لاعب وصوّت' : 'تصويت المتفرجين') : lead ? `${esc(lead.name)} ${lvNum(pc(lead.id))}٪` : 'تصويت المتفرجين'}</small><i>${open ? '▾' : '▴'}</i></button>
    ${open ? `<div class="spvl">${ps.map((p, i) => `<div class="spvr${S.vt.me === p.id ? ' mine' : ''}" data-v="${p.id}"><span>${esc(p.name)}</span><div class="spvbar"><i style="width:${pc(p.id)}%;background:${['var(--yellow)', 'var(--blue)', 'var(--red)', 'var(--green)'][i % 4]}"></i></div><small>${lvNum(pc(p.id))}٪</small></div>`).join('')}</div>
    <div class="spvf">${lvNum(tot)} صوت</div>` : ''}`;
}
const lvIsOpen = () => LV.open === null ? !!(S && S.spec) : LV.open;
