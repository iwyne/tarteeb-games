// مرسم ترتيب: كل واحد يرسم بكيفه (أدوات مثل بروكريت بالكلاينت).
// الكلاينت يرسل لقطات صغيرة للرسمة وهو يرسم (للتسريع)، ولما يضغط «انتهيت» يرسل الرسمة كاملة.
// لما الكل يخلص أو الأونر ينهي أو يخلص وقت المسابقة: تنعرض الرسومات وحدة وحدة مع مقطع التسريع، وبعدها تصويت.
// الصور تنحفظ بالذاكرة وتنزل بـ HTTP: /art/<code>/<key>/<pid>/(tl|final|last)
// الإضافات: وقت للمسابقة، حكام (يقدرون يكونون متفرجين)، رسم جماعي (كل واحد طبقته ونرسل الضربات ولقطات الطبقات)،
// بث (المتفرج يتابع رسام ويوصله بث لايف)، تشجيع، ومعرض دايم (store.js: سوبابيس أو data/).
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const MAXF = 240, FRAME_MAX = 160 * 1024, FINAL_MAX = 2400 * 1024, LIVE_MAX = 450 * 1024, LYR_MAX = 2600 * 1024, COLLECT_MS = 12000;
const ST = require('../store');
const MURAL = { v: 0, hist: [] }; ST.get('mural').then(o => { if (o && o.v) Object.assign(MURAL, o); }).catch(() => {}); // جدارية ترتيب: رسمة جماعية تكمل من جولة لجولة
const GALX = {}; ST.load('galx:').then(o => { for (const k in o) GALX[k.slice(5)] = o[k]; }).catch(() => {}); // لايكات وتعليقات المعرض
const MONO = ['#e63946', '#1d4ed8', '#0f766e', '#7c3aed', '#c2410c', '#be185d', '#15803d', '#0e7490'];
const GALS = {}; ST.load('gal:').then(o => { for (const k in o) GALS[k.slice(4)] = o[k]; }).catch(e => console.error('gallery load', e.message));
const PK = p => { const k = p.bot ? null : p.uid ? 'd:' + p.uid : p.dev ? 'v:' + p.dev : null; return k && crypto.createHash('sha256').update('tarteeb|' + k).digest('base64url').slice(0, 10); }; // نفس pid بـ points.js
module.exports = H => {
  const humans = r => r.players.filter(p => !p.bot);
  const A = (g, id) => g.art[id] || (g.art[id] = { frames: [], final: null, done: false, n: 0, at: 0 });
  const b64 = d => { try { const m = /^data:image\/(webp|jpeg|png);base64,(.+)$/.exec(String(d || '')); return m ? { t: m[1], b: Buffer.from(m[2], 'base64') } : null; } catch { return null; } };
  const everyone = r => r.players.concat(r.specs || []);
  const judges = r => (r.g.judges || []);
  function allDone(r) { const g = r.g; const hs = humans(r).filter(p => p.online !== false); return hs.length > 0 && hs.every(p => g.art[p.id] && g.art[p.id].done); }
  function collect(r) {
    const g = r.g; if (g.sub !== 'draw') return;
    g.sub = 'collect'; H.cast(r, { t: 'gnet', g: 'art', k: 'collect' });
    H.setTimer(r, COLLECT_MS, () => show(r)); H.push(r);
  }
  function show(r) {
    const g = r.g; if (g.sub !== 'draw' && g.sub !== 'collect') return;
    H.setTimer(r, 0, null);
    if (g.collab) { // الرسم الجماعي: رسمة وحدة (من الأونر أو أول واحد عنده لقطات)
      const id = [r.host, ...Object.keys(g.art)].find(x => g.art[x] && (g.art[x].final || g.art[x].frames.length));
      g.order = id ? [id] : [];
    } else g.order = H.shuffle(Object.keys(g.art).filter(id => g.art[id].final || g.art[id].frames.length)); // اللي رسم شي بس
    if (!g.order.length) { H.log(r, '🎨 محد رسم شي!'); return end(r); }
    if (g.mode === 'mural' && g.order[0]) saveMural(r, g.order[0]);
    g.sub = 'show'; g.i = 0; g.mins = Math.max(1, Math.round((Date.now() - g.t0) / 60000));
    H.log(r, g.collab ? '🖼️ وقت العرض! رسمتكم الجماعية' : `🖼️ وقت العرض! ${g.order.length} رسمات`); H.push(r);
  }
  function end(r) { const g = r.g; r.phase = 'over'; g.sub = 'over'; r.winner = r.winner || null; H.setTimer(r, 0, null); H.push(r); }
  // مين يصوّت: الكل، أو الحكام بس، أو الكل والحكم صوته بثلاثة
  const voters = r => { const g = r.g; if (g.jmode === 'judges' && judges(r).length) return everyone(r).filter(p => judges(r).includes(p.id) && p.online !== false); return humans(r).filter(p => p.online !== false).concat((r.specs || []).filter(p => judges(r).includes(p.id))); };
  function vote(r) {
    const g = r.g; if (g.collab || g.order.length < 2 || (humans(r).length < 2 && !judges(r).length)) return end(r);
    g.sub = 'vote'; g.votes = {}; H.log(r, g.jmode === 'judges' && judges(r).length ? '⚖️ الحكام يختارون أحلى رسمة!' : '🗳️ صوّتوا لأحلى رسمة!'); H.push(r);
  }
  function tally(r) {
    const g = r.g; if (g.sub !== 'vote') return; const c = {};
    Object.entries(g.votes).forEach(([v, id]) => c[id] = (c[id] || 0) + (g.jmode === 'mix' && judges(r).includes(v) ? 3 : 1));
    const mx = Math.max(0, ...Object.values(c)), ws = mx ? r.players.filter(p => c[p.id] === mx) : [];
    g.tally = c; g.best = ws.map(p => p.id);
    if (ws.length) { r.winner = ws.map(p => p.name).join(' و '); H.win(r, ws); H.log(r, `👑 أحلى رسمة: ${r.winner}`); }
    end(r); if (Object.keys(g.galSel || {}).length) saveGallery(r);
  }
  function saveMural(r, id) { // نسخة جديدة من الجدارية، ونخلي آخر ٤٠ نسخة
    const a = r.g.art[id], f = a && (a.final || a.frames[a.frames.length - 1]); if (!f || r.g.muralSaved) return; r.g.muralSaved = true;
    const v = MURAL.v + 1, names = humans(r).map(p => p.name).slice(0, 12);
    ST.putFile(`mural/${v}.img`, f, f[0] === 0xff ? 'image/jpeg' : f[0] === 0x89 ? 'image/png' : 'image/webp').then(() => {
      MURAL.v = v; MURAL.hist.push({ v, t: Date.now(), names, theme: r.g.theme || '' }); while (MURAL.hist.length > 40) { const o = MURAL.hist.shift(); ST.delFiles([`mural/${o.v}.img`]); }
      ST.put('mural', MURAL); H.log(r, `🧱 انحفظت نسخة ${v} من الجدارية`);
    }).catch(e => console.error('mural', e.message));
  }
  // المعرض الدايم: نحفظ الرسومات والتسريع على القرص
  // المعرض الدايم: الأونر يختار وش يروح له (agal). نرفع الملفات للي انختار، ونشيل اللي انلغى
  function saveGallery(r) {
    const g = r.g; const sel = g.order.filter(id => g.galSel && g.galSel[id]);
    const dir = g.galDir || (g.galDir = Date.now().toString(36) + '-' + r.code); g.galUp = g.galUp || {};
    const files = i => [`gal/${dir}/${i}.img`, `gal/${dir}/${i}.tl`];
    if (!sel.length) { if (GALS[dir]) { delete GALS[dir]; ST.del('gal:' + dir); } }
    else {
      const items = sel.map(id => { const i = g.order.indexOf(id), p = r.players.find(q => q.id === id) || { name: 'لاعب' };
        return { i, name: g.collab ? 'رسمة جماعية' : p.name, pid: g.collab ? null : PK(p), votes: g.tally ? g.tally[id] || 0 : 0, best: (g.best || []).includes(id) }; });
      const meta = { t: g.galT || (g.galT = Date.now()), theme: g.theme, mins: g.mins, items, collab: !!g.collab };
      GALS[dir] = meta; ST.put('gal:' + dir, meta);
    }
    (async () => {
      for (const id of g.order) { const i = g.order.indexOf(id), want = sel.includes(id);
        if (want && !g.galUp[id]) { g.galUp[id] = true; const a = g.art[id]; const f = a.final || a.frames[a.frames.length - 1];
          const parts = []; a.frames.forEach(fr => { const l = Buffer.alloc(4); l.writeUInt32BE(fr.length); parts.push(l, fr); });
          try { if (f) await ST.putFile(files(i)[0], f, f[0] === 0xff ? 'image/jpeg' : f[0] === 0x89 ? 'image/png' : 'image/webp'); await ST.putFile(files(i)[1], Buffer.concat(parts)); } catch (e) { g.galUp[id] = false; console.error('gallery', e.message); } }
        else if (!want && g.galUp[id]) { g.galUp[id] = false; ST.delFiles(files(i)); }
      }
      // نخلي آخر ٣٠٠ جولة بس
      const all = Object.keys(GALS).sort(); if (all.length > 300) for (const d of all.slice(0, all.length - 300)) { const n = Math.max(0, ...GALS[d].items.map(x => x.i)) + 1; delete GALS[d]; ST.del('gal:' + d); ST.delFiles([].concat(...Array.from({ length: n }, (_, i) => [`gal/${d}/${i}.img`, `gal/${d}/${i}.tl`]))); }
    })();
  }
  // أكمل الرسمة: نطلب من الكل يرفعون رسمتهم، وبعد شوي نلفها على اللي بعدهم
  function passTurn(r) {
    const g = r.g; if (!g || g.sub !== 'draw' || g.mode !== 'pass') return;
    if (g.pr + 1 >= g.prn) { H.log(r, '⏰ خلصت الأدوار!'); return collect(r); }
    g.passing = true; H.cast(r, { t: 'gnet', g: 'art', k: 'preq' }); H.push(r);
    H.setTimer(r, 4000, () => {
      if (g.sub !== 'draw') return; g.passing = false; const ring = g.ring.filter(id => r.players.some(q => q.id === id)), nh = {};
      ring.forEach((id, i) => { const prev = ring[(i - 1 + ring.length) % ring.length]; nh[id] = g.hold[prev]; });
      g.hold = nh; g.pr++; g.dl = Date.now() + g.ps;
      ring.forEach(id => { const p = r.players.find(q => q.id === id), ch = g.hold[id], st = r.players.find(q => q.id === ch); if (!g.who[ch]) g.who[ch] = []; if (p && !g.who[ch].includes(p.name)) g.who[ch].push(p.name);
        if (p) H.sendTo(p, { t: 'gnet', g: 'art', k: 'pass', ch, n: st ? st.name : '', last: g.pr + 1 >= g.prn }); });
      H.log(r, `🔁 الدور ${g.pr + 1} من ${g.prn}: كمّلوا الرسمة اللي جتكم`);
      H.setTimer(r, g.ps, () => passTurn(r)); H.push(r);
    });
  }
  const relay = (r, list, o) => list.forEach(q => H.sendTo(q, o));
  const watchersOf = (r, id) => everyone(r).filter(q => r.g.watch[q.id] === id);
  return {
    min: 1, max: 16,
    start(r) {
      const o = r.opts;
      r.g = { key: crypto.randomBytes(6).toString('base64url'), sub: 'draw', art: {}, order: [], i: 0, t0: Date.now(), theme: String(o.atheme || '').slice(0, 60),
        mode: o.amode || '', seed: crypto.randomInt(1e9), mono: MONO[crypto.randomInt(MONO.length)],
        collab: (!!o.acollab || o.amode === 'mural') && humans(r).length > 0, jmode: o.ajmode || 'all', judges: (o.ajudges || []).slice(), dl: o.atime ? Date.now() + o.atime * 60000 : 0, watch: {}, lyr: {} };
      r.winner = null; r.phase = 'play';
      const g = r.g; if (g.mode === 'mural') g.mural = MURAL.v; if (g.collab && g.mode !== 'mural' && ['pass'].includes(g.mode)) g.mode = '';
      if (g.mode === 'pass') { // أكمل الرسمة: كل واحد يرسم شوي وبعدين الرسمة تنتقل للي بعده
        const hs = humans(r); g.hold = {}; hs.forEach(p => { g.hold[p.id] = p.id; }); g.ring = hs.map(p => p.id); g.pr = 0; g.prn = Math.min(6, Math.max(2, hs.length)); g.ps = (o.apass || 60) * 1000; g.dl = Date.now() + g.ps; g.who = {}; hs.forEach(p => { g.who[p.id] = [p.name]; });
        H.setTimer(r, g.ps, () => passTurn(r));
      } else if (g.dl) H.setTimer(r, o.atime * 60000, () => { H.log(r, '⏰ خلص وقت المسابقة!'); collect(r); });
      if (g.mode) H.log(r, { pass: '🔁 أكمل الرسمة: كل شوي الرسمات تنتقل للي جنبك', blind: '🙈 رسم أعمى: ما تشوف اللي ترسمه لين تخلص', mono: '🎨 لون واحد بس', oneline: '〰️ خط واحد بدون ما ترفع', memory: '🧠 احفظ الصورة بعشر ثواني وارسمها', mural: '🧱 جدارية ترتيب: كملوا على الرسمة اللي قبل' }[g.mode] || '');
      H.log(r, (r.g.collab ? '🤝 رسم جماعي! ' : '') + (r.g.theme ? `🎨 الموضوع: ${r.g.theme}` : '🎨 ارسم اللي تبي') + (o.atime ? ` · ⏱️ ${o.atime} دقيقة` : ''));
    },
    act(r, p, m) {
      const g = r.g; if (!g || p.bot) return 'quiet';
      const host = r.host === p.id, drawing = g.sub === 'draw' || g.sub === 'collect';
      if (m.t === 'afr') { // لقطة للتسريع
        if (!drawing || p.spec || !H.rate(p, 'afr', 250)) return 'quiet';
        const x = b64(m.d); if (!x || x.b.length > FRAME_MAX) return 'quiet';
        const a = A(g, g.hold ? g.hold[p.id] || p.id : p.id); a.frames.push(x.b); a.n++; a.at = Date.now();
        if (a.frames.length > MAXF) a.frames = a.frames.filter((_, i) => i % 2 === 0 || i === a.frames.length - 1); // نخفف: نشيل لقطة كل ثنتين
        if (Date.now() - (g.pushAt || 0) > 6000) { g.pushAt = Date.now(); return; } // كل شوي نحدّث الكل
        return 'quiet';
      }
      if (m.t === 'afin') { // الرسمة كاملة
        if (!drawing || p.spec || !H.rate(p, 'afin', 1500)) return 'quiet';
        const x = b64(m.d); if (!x || x.b.length > FINAL_MAX) { H.sendTo(p, { t: 'err', msg: 'الرسمة كبيرة، جرّب مرة ثانية' }); return 'quiet'; }
        if (g.hold) { const a = A(g, g.hold[p.id] || p.id); a.final = x.b; a.ft = x.t; if (g.passing || m.pass || g.pr + 1 < g.prn) return 'quiet'; a.done = true; } // أكمل الرسمة: رفع بين الأدوار
        const a = A(g, g.hold ? g.hold[p.id] || p.id : p.id); a.final = x.b; a.ft = x.t; a.done = true;
        if (g.sub === 'draw') H.log(r, `✅ ${p.name} خلّص`);
        if (g.sub === 'draw' ? allDone(r) : Object.keys(g.art).every(id => g.art[id].done || !r.players.some(q => q.id === id && q.online !== false))) show(r);
        return;
      }
      // البث والرسم الجماعي
      if (m.t === 'ast' && drawing && !p.spec) { // ضربة (بداية/نقاط/نهاية) — للجماعي
        if (!g.collab || !H.rate(p, 'ast', 20)) return 'quiet';
        relay(r, humans(r).filter(q => q !== p), { t: 'gnet', g: 'art', k: 'st', from: p.id, d: m.d }); return 'quiet';
      }
      if (m.t === 'alyr' && drawing && !p.spec) { // لقطة طبقتي كاملة (الجماعي) — تنحفظ للي يدخل بعدين
        if (!g.collab || !H.rate(p, 'alyr', 800) || String(m.d || '').length > LYR_MAX) return 'quiet';
        g.lyr[p.id] = { d: m.d, v: (g.lyr[p.id] ? g.lyr[p.id].v : 0) + 1, n: p.name };
        relay(r, humans(r).filter(q => q !== p), { t: 'gnet', g: 'art', k: 'lyr', from: p.id, d: m.d, n: p.name }); return 'quiet';
      }
      if (m.t === 'acur' && drawing && !p.spec) { // مؤشرات الرسم الجماعي (وين كل واحد يرسم)
        if (!g.collab || !H.rate(p, 'acur', 90)) return 'quiet'; const x = +m.x, y = +m.y; if (!isFinite(x) || !isFinite(y)) return 'quiet';
        relay(r, humans(r).filter(q => q !== p), { t: 'gnet', g: 'art', k: 'cur', from: p.id, n: p.name, x: Math.round(x), y: Math.round(y), c: String(m.c || '').slice(0, 7) }); return 'quiet';
      }
      if (m.t === 'aneed' && !p.spec) { for (const id in g.lyr) if (id !== p.id) H.sendTo(p, { t: 'gnet', g: 'art', k: 'lyr', from: id, d: g.lyr[id].d, n: g.lyr[id].n }); return 'quiet'; }
      if (m.t === 'awatch') { // الأونر بس يتابع رسام لايف (الباقين ما يشوفون رسمات غيرهم لين يخلص الرسم)
        const id = host && m.id && r.players.some(q => q.id === m.id) && m.id !== p.id ? m.id : null; if (id) g.watch[p.id] = id; else delete g.watch[p.id]; return;
      }
      if (m.t === 'agal' && host && ['show', 'vote', 'over'].includes(g.sub)) { // الأونر يختار الرسمات اللي تروح للمعرض
        if (!g.order.includes(m.id)) return 'quiet'; g.galSel = g.galSel || {}; if (m.on) g.galSel[m.id] = true; else delete g.galSel[m.id]; saveGallery(r); return;
      }
      if (m.t === 'alv' && drawing && !p.spec) { // صورة لايف للي يتابعوني
        if (!H.rate(p, 'alv', 300) || String(m.d || '').length > LIVE_MAX) return 'quiet';
        relay(r, watchersOf(r, p.id), { t: 'gnet', g: 'art', k: 'lv', from: p.id, d: m.d }); return 'quiet';
      }
      if (m.t === 'acheer') { // تشجيع لرسام
        const to = r.players.find(q => q.id === m.id); if (!to || to === p || !H.rate(p, 'acheer', 700)) return 'quiet';
        const o = { t: 'gnet', g: 'art', k: 'cheer', to: to.id, from: p.name, e: String(m.e || 'clap').slice(0, 12) };
        relay(r, [to, ...watchersOf(r, to.id), p].filter((q, i, a) => a.indexOf(q) === i), o); return 'quiet';
      }
      if (m.t === 'aback' && g.sub === 'draw') { const a = g.art[p.id]; if (a) a.done = false; return; } // رجعت أرسم
      if (m.t === 'aend' && host && g.sub === 'draw') return collect(r); // الأونر ينهي للكل
      if (g.sub === 'show' && host) {
        if (m.t === 'ago') { const i = +m.i; if (i >= 0 && i < g.order.length) g.i = i; return; }
        if (m.t === 'adone') return vote(r);
      }
      if (g.sub === 'vote') {
        if (m.t === 'avote' && g.order.includes(m.id) && m.id !== p.id && voters(r).includes(p)) {
          g.votes[p.id] = m.id;
          if (voters(r).filter(q => g.order.some(x => x !== q.id)).every(q => g.votes[q.id])) return tally(r); return;
        }
        if (m.t === 'avend' && host) return tally(r);
      }
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const st = {}; for (const id in g.art) st[id] = { n: g.art[id].n, done: g.art[id].done, f: !!g.art[id].final, c: g.art[id].frames.length };
      const wc = p ? Object.values(g.watch).filter(x => x === p.id).length : 0;
      return { sub: g.sub, key: g.key, theme: g.theme, st, order: g.order, i: g.i, t0: g.t0, mins: g.mins || 0, dl: g.dl, collab: g.collab, jmode: g.jmode, judges: g.judges,
        canVote: g.sub === 'vote' && !!p && voters(r).includes(p), my: g.votes && p ? g.votes[p.id] || null : null, nv: g.votes ? Object.keys(g.votes).length : 0, nvt: g.sub === 'vote' ? voters(r).length : 0,
        mode: g.mode || '', passing: !!g.passing, seed: g.seed, mono: g.mode === 'mono' ? g.mono : null, mural: g.mode === 'mural' ? g.mural || 0 : null, pr: g.hold ? g.pr : null, prn: g.hold ? g.prn : null, hold: g.hold && p ? g.hold[p.id] || null : null, who: g.who && ['show', 'vote', 'over'].includes(g.sub) ? g.who : null,
        tally: g.tally || null, best: g.best || [], wc, watching: p ? g.watch[p.id] || null : null,
        vk: p ? (p.vk || (p.vk = crypto.randomBytes(9).toString('base64url'))) : null, gal: p && p.id === r.host ? Object.keys(g.galSel || {}) : null };
    },
    leave(r, p) { const g = r.g; if (!g) return; if (p) { delete g.watch[p.id]; for (const k in g.watch) if (g.watch[k] === p.id) delete g.watch[k]; } if (g.sub === 'draw' && allDone(r)) show(r); },
    // تنزيل الصور
    http(r, pid, what, vk) {
      const g = r.g, a = g && g.art[pid]; if (!a) return null;
      // مين يشوف: صاحب الرسمة والأونر دايماً، والباقين بعد ما يخلص الرسم (بالعرض لين الرسمة الحالية بس)
      const v = vk && r.players.concat(r.specs || []).find(q => q.vk === vk);
      const ok = v && (v.id === pid || v.id === r.host || (g.hold && g.hold[v.id] === pid) || ['vote', 'over'].includes(g.sub) || r.phase === 'over' || (g.sub === 'show' && g.order.indexOf(pid) > -1 && g.order.indexOf(pid) <= g.i));
      if (!ok) return null;
      const sniff = b => b[0] === 0xff ? 'image/jpeg' : b[0] === 0x89 ? 'image/png' : 'image/webp';
      if (what === 'final') { const b = a.final || a.frames[a.frames.length - 1]; return b ? { type: sniff(b), body: b } : null; }
      if (what === 'last') { const b = a.frames[a.frames.length - 1] || a.final; return b ? { type: sniff(b), body: b } : null; }
      if (what === 'tl') { // كل اللقطات ورا بعض: [طول ٤ بايت][الصورة]...
        const parts = []; a.frames.forEach(f => { const l = Buffer.alloc(4); l.writeUInt32BE(f.length); parts.push(l, f); });
        return { type: 'application/octet-stream', body: Buffer.concat(parts) };
      }
      return null;
    },
    GALS, GALX, MURAL
  };
};
