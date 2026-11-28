// رياكشنات لعبة «خمّن الرياكشن»: صفحة رفع /rx يرفع فيها أي أحد، والتيم يوافقون قبل ما تدخل اللعبة.
// الملفات: rx/<id>.<ext> بـ STORE (Supabase أو data/files)، والبيانات kv 'rx' = [{id,n,a[],c,by,t,st,ext,type,s,e,w,h,d,sz}]
const crypto = require('crypto');
const MAX = 12 * 1024 * 1024, MAX_PENDING = 400, CATS = ['عربي', 'عالمي', 'مشاهير', 'أطفال', 'أخرى'];
const TYPES = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', gif: 'image/gif', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
// نعرف نوع الملف من أوله (مو من اسمه)
function sniff(b) {
  if (b.length < 12) return null;
  if (b.slice(4, 8).toString() === 'ftyp') return b.slice(8, 12).toString().startsWith('qt') ? 'mov' : 'mp4';
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
  if (b.slice(0, 6).toString() === 'GIF89a' || b.slice(0, 6).toString() === 'GIF87a') return 'gif';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (b[0] === 0x89 && b.slice(1, 4).toString() === 'PNG') return 'png';
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const num = (v, lo, hi) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v * 10) / 10)) : null; };

module.exports = ({ STORE, STAFF }) => {
  let L = []; const ready = STORE.get('rx').then(o => { if (Array.isArray(o)) L = o; }).catch(() => {});
  const save = () => STORE.put('rx', L);
  const ups = new Map(); // IP → رفعات بالساعة
  const staff = req => { const t = req.headers['x-team']; return t && STAFF ? STAFF.check(String(t)) : null; };
  const pub = (x, full) => ({ id: x.id, n: x.n, a: x.a, c: x.c, ext: x.ext, s: x.s, e: x.e, w: x.w, h: x.h, d: x.d, ...(full ? { by: x.by, t: x.t, st: x.st, sz: x.sz, rv: x.rv } : {}) });
  const url = x => `/rx/${x.id}.${x.ext}`;

  async function handle(req, res, ip) {
    const json = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
    const u = new URL(req.url, 'http://x'); await ready;
    // الملف نفسه
    const mf = /^\/rx\/([a-f0-9]{12})\.(\w+)$/.exec(u.pathname);
    if (mf) { const x = L.find(q => q.id === mf[1]); if (!x || x.ext !== mf[2]) { res.writeHead(404); return res.end(); }
      const p = `rx/${x.id}.${x.ext}`, ext = STORE.fileUrl(p); if (ext) { res.writeHead(302, { Location: ext, 'Cache-Control': 'public, max-age=86400' }); return res.end(); }
      const b = STORE.getFileLocal(p); if (!b) { res.writeHead(404); return res.end(); }
      // نسمح بالتقديم الجزئي (Range) عشان الفيديو يشتغل على الآيفون
      const rg = /bytes=(\d*)-(\d*)/.exec(req.headers.range || ''); const H = { 'Content-Type': TYPES[x.ext], 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=86400' };
      if (rg) { const s = rg[1] ? +rg[1] : b.length - +rg[2], e = rg[1] && rg[2] ? Math.min(+rg[2], b.length - 1) : b.length - 1; if (s >= b.length || s > e) { res.writeHead(416, { 'Content-Range': `bytes */${b.length}` }); return res.end(); }
        res.writeHead(206, { ...H, 'Content-Range': `bytes ${s}-${e}/${b.length}`, 'Content-Length': e - s + 1 }); return res.end(b.slice(s, e + 1)); }
      res.writeHead(200, { ...H, 'Content-Length': b.length }); return res.end(b);
    }
    if (u.pathname === '/api/rx/list') { // المقبولة للكل، والانتظار للتيم بس
      const st = u.searchParams.get('st') || 'ok';
      if (st !== 'ok' && !staff(req)) return json(403, { err: 'للتيم بس' });
      return json(200, { list: L.filter(x => x.st === st).slice().reverse().map(x => ({ ...pub(x, st !== 'ok'), u: url(x) })), cats: CATS, counts: { ok: L.filter(x => x.st === 'ok').length, pending: L.filter(x => x.st === 'pending').length } });
    }
    if (u.pathname === '/api/rx/up' && req.method === 'POST') { // الرفع: الملف نفسه بالـ body، والبيانات بالرابط
      const now = Date.now(), h = (ups.get(ip) || []).filter(t => now - t < 3600e3); if (h.length >= 15) return json(429, { err: 'رفعت كثير، جرّب بعد شوي' });
      if (L.filter(x => x.st === 'pending').length >= MAX_PENDING) return json(429, { err: 'فيه رياكشنات كثير تنتظر الموافقة، جرّب بعدين' });
      if (+req.headers['content-length'] > MAX) return json(413, { err: 'الملف أكبر من ١٢ ميقا' });
      const q = u.searchParams, n = clean(q.get('n'), 60); if (!n) return json(400, { err: 'اكتب اسم الرياكشن' });
      const chunks = []; let size = 0, big = false;
      await new Promise(ok => { req.on('data', d => { size += d.length; if (size > MAX) { big = true; req.destroy(); return ok(); } chunks.push(d); }); req.on('end', ok); req.on('error', ok); req.on('close', ok); });
      if (big) return json(413, { err: 'الملف أكبر من ١٢ ميقا' });
      const b = Buffer.concat(chunks), ext = sniff(b); if (!ext) return json(415, { err: 'نوع الملف مو مدعوم (mp4, webm, mov, gif, صور)' });
      const a = clean(q.get('a'), 200).split(/[،,]/).map(s => clean(s, 50)).filter(Boolean).slice(0, 8), c = CATS.includes(q.get('c')) ? q.get('c') : 'أخرى';
      const id = crypto.randomBytes(6).toString('hex'), x = { id, n, a, c, by: clean(q.get('by'), 24) || 'مجهول', t: now, st: 'pending', ext, sz: b.length, s: num(q.get('s'), 0, 600) || 0, e: num(q.get('e'), 0, 600), w: num(q.get('w'), 0, 9999), h: num(q.get('h'), 0, 9999), d: num(q.get('d'), 0, 9999) };
      try { await STORE.putFile(`rx/${id}.${ext}`, b, TYPES[ext]); } catch (e) { console.error('rx up', e.message); return json(500, { err: 'ما قدرنا نحفظ الملف، جرّب مرة ثانية' }); }
      h.push(now); ups.set(ip, h); if (ups.size > 3000) ups.clear(); L.push(x); save();
      return json(200, { ok: true, id });
    }
    if (u.pathname === '/api/rx/rev' && req.method === 'POST') { // التيم: قبول/رفض/حذف/تعديل
      const who = staff(req); if (!who) return json(403, { err: 'للتيم بس' });
      let s = ''; await new Promise(ok => { req.on('data', d => { s += d; if (s.length > 4096) req.destroy(); }); req.on('end', ok); req.on('close', ok); });
      let m; try { m = JSON.parse(s); } catch { return json(400, {}); }
      const x = L.find(q => q.id === m.id); if (!x) return json(404, { err: 'مو موجود' });
      if (m.n != null) x.n = clean(m.n, 60) || x.n; if (m.a != null) x.a = clean(m.a, 200).split(/[،,]/).map(v => clean(v, 50)).filter(Boolean).slice(0, 8); if (CATS.includes(m.c)) x.c = m.c;
      if (m.s != null) x.s = num(m.s, 0, 600) || 0; if (m.e !== undefined) x.e = m.e == null || m.e === '' ? null : num(m.e, 0, 600);
      if (m.act === 'ok' || m.act === 'no') { x.st = m.act; x.rv = who; }
      if (m.act === 'del') { L = L.filter(q => q !== x); STORE.delFiles([`rx/${x.id}.${x.ext}`]); }
      save(); return json(200, { ok: true });
    }
    return json(404, {});
  }
  return { handle, list: () => L.filter(x => x.st === 'ok'), CATS };
};
