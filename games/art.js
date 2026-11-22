// مرسم ترتيب: كل واحد يرسم بكيفه بدون وقت (أدوات مثل بروكريت بالكلاينت).
// الكلاينت يرسل لقطات صغيرة للرسمة وهو يرسم (للتسريع)، ولما يضغط «انتهيت» يرسل الرسمة كاملة.
// لما الكل يخلص أو الأونر ينهي: تنعرض الرسومات وحدة وحدة مع مقطع التسريع.
// الصور تنحفظ بالذاكرة وتنزل بـ HTTP: /art/<code>/<key>/<pid>/(tl|final|last)
const crypto = require('crypto');
const MAXF = 240, FRAME_MAX = 160 * 1024, FINAL_MAX = 1000 * 1024, COLLECT_MS = 12000;
module.exports = H => {
  const humans = r => r.players.filter(p => !p.bot);
  const A = (g, id) => g.art[id] || (g.art[id] = { frames: [], final: null, done: false, n: 0, at: 0 });
  const b64 = d => { try { const m = /^data:image\/(webp|jpeg|png);base64,(.+)$/.exec(String(d || '')); return m ? { t: m[1], b: Buffer.from(m[2], 'base64') } : null; } catch { return null; } };
  function allDone(r) { const g = r.g; const hs = humans(r).filter(p => p.online !== false); return hs.length > 0 && hs.every(p => g.art[p.id] && g.art[p.id].done); }
  function collect(r) {
    const g = r.g; if (g.sub !== 'draw') return;
    g.sub = 'collect'; H.cast(r, { t: 'gnet', g: 'art', k: 'collect' });
    H.setTimer(r, COLLECT_MS, () => show(r)); H.push(r);
  }
  function show(r) {
    const g = r.g; if (g.sub !== 'draw' && g.sub !== 'collect') return;
    H.setTimer(r, 0, null);
    // اللي رسم شي بس (وترتيب عشوائي)
    g.order = H.shuffle(Object.keys(g.art).filter(id => g.art[id].final || g.art[id].frames.length));
    if (!g.order.length) { H.log(r, '🎨 محد رسم شي!'); return end(r); }
    g.sub = 'show'; g.i = 0; g.mins = Math.max(1, Math.round((Date.now() - g.t0) / 60000));
    H.log(r, `🖼️ وقت العرض! ${g.order.length} رسمات`); H.push(r);
  }
  function end(r) { const g = r.g; r.phase = 'over'; g.sub = 'over'; r.winner = null; H.setTimer(r, 0, null); H.push(r); }
  return {
    min: 1, max: 16,
    start(r) {
      r.g = { key: crypto.randomBytes(6).toString('base64url'), sub: 'draw', art: {}, order: [], i: 0, t0: Date.now(), theme: String(r.opts.atheme || '').slice(0, 60) };
      r.winner = null; r.phase = 'play';
      H.log(r, r.g.theme ? `🎨 الموضوع: ${r.g.theme}` : '🎨 ارسم اللي تبي، وخذ وقتك');
    },
    act(r, p, m) {
      const g = r.g; if (!g || p.bot) return 'quiet';
      const host = r.host === p.id;
      if (m.t === 'afr') { // لقطة للتسريع
        if (!(g.sub === 'draw' || g.sub === 'collect') || !H.rate(p, 'afr', 250)) return 'quiet';
        const x = b64(m.d); if (!x || x.b.length > FRAME_MAX) return 'quiet';
        const a = A(g, p.id); a.frames.push(x.b); a.n++; a.at = Date.now();
        if (a.frames.length > MAXF) a.frames = a.frames.filter((_, i) => i % 2 === 0 || i === a.frames.length - 1); // نخفف: نشيل لقطة كل ثنتين
        if (Date.now() - (g.pushAt || 0) > 6000) { g.pushAt = Date.now(); return; } // كل شوي نحدّث الكل (عشان المتفرجين يشوفون الرسومات)
        return 'quiet';
      }
      if (m.t === 'afin') { // الرسمة كاملة
        if (!(g.sub === 'draw' || g.sub === 'collect') || !H.rate(p, 'afin', 1500)) return 'quiet';
        const x = b64(m.d); if (!x || x.b.length > FINAL_MAX) { H.sendTo(p, { t: 'err', msg: 'الرسمة كبيرة، جرّب مرة ثانية' }); return 'quiet'; }
        const a = A(g, p.id); a.final = x.b; a.ft = x.t; a.done = true;
        if (g.sub === 'draw') H.log(r, `✅ ${p.name} خلّص رسمته`);
        if (g.sub === 'draw' ? allDone(r) : Object.keys(g.art).every(id => g.art[id].done || !r.players.some(q => q.id === id && q.online !== false))) show(r);
        return;
      }
      if (m.t === 'aback' && g.sub === 'draw') { const a = g.art[p.id]; if (a) a.done = false; return; } // رجعت أرسم
      if (m.t === 'aend' && host && g.sub === 'draw') return collect(r); // الأونر ينهي للكل
      if (g.sub === 'show' && host) {
        if (m.t === 'ago') { const i = +m.i; if (i >= 0 && i < g.order.length) g.i = i; return; }
        if (m.t === 'adone') return end(r);
      }
      return 'quiet';
    },
    view(r) {
      const g = r.g; if (!g) return null;
      const st = {}; for (const id in g.art) st[id] = { n: g.art[id].n, done: g.art[id].done, f: !!g.art[id].final, c: g.art[id].frames.length };
      return { sub: g.sub, key: g.key, theme: g.theme, st, order: g.order, i: g.i, t0: g.t0, mins: g.mins || 0 };
    },
    leave(r) { const g = r.g; if (g && g.sub === 'draw' && allDone(r)) show(r); },
    // تنزيل الصور
    http(r, pid, what) {
      const g = r.g, a = g && g.art[pid]; if (!a) return null;
      const sniff = b => b[0] === 0xff ? 'image/jpeg' : b[0] === 0x89 ? 'image/png' : 'image/webp';
      if (what === 'final') { const b = a.final || a.frames[a.frames.length - 1]; return b ? { type: sniff(b), body: b } : null; }
      if (what === 'last') { const b = a.frames[a.frames.length - 1] || a.final; return b ? { type: sniff(b), body: b } : null; }
      if (what === 'tl') { // كل اللقطات ورا بعض: [طول ٤ بايت][الصورة]...
        const parts = []; a.frames.forEach(f => { const l = Buffer.alloc(4); l.writeUInt32BE(f.length); parts.push(l, f); });
        return { type: 'application/octet-stream', body: Buffer.concat(parts) };
      }
      return null;
    }
  };
};
