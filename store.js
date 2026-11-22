// حفظ دائم للنقاط والملفات الشخصية والمعرض.
// لو فيه SUPABASE_URL و SUPABASE_KEY (مفتاح service_role) نحفظ بجدول kv (k text, v jsonb) وبـ Storage (bucket اسمه gallery، عام).
// ولو ما فيه، نحفظ بملفات data/ (تنمسح مع كل نشر بريندر المجاني).
const fs = require('fs'), path = require('path');
const SB = String(process.env.SUPABASE_URL || '').replace(/\/+$/, ''), KEY = process.env.SUPABASE_KEY || '', BUCKET = process.env.SUPABASE_BUCKET || 'gallery';
const ON = !!(SB && KEY);
const DIR = process.env.STORE_DIR || path.join(__dirname, 'data');
const KVF = path.join(DIR, 'kv.json'), FDIR = path.join(DIR, 'files');
// المفاتيح الجديدة (sb_secret_...) مو JWT فتنرسل بـ apikey بس، والقديمة (service_role eyJ...) بالاثنين
const H = (x = {}) => Object.assign(KEY.startsWith('sb_') ? { apikey: KEY } : { apikey: KEY, Authorization: 'Bearer ' + KEY }, x);

let KV = {}; // نسخة الملفات بالذاكرة (لما ما فيه سوبابيس)
if (!ON) { try { KV = JSON.parse(fs.readFileSync(KVF, 'utf8')) || {}; } catch {} }
let kvT = null; const kvSave = () => { clearTimeout(kvT); kvT = setTimeout(() => { try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(KVF, JSON.stringify(KV)); } catch (e) { console.error('store save', e.message); } }, 1500); };

// الكتابة تتجمّع وتنرسل دفعة وحدة كل ثانيتين
const dirty = new Map(); let flushT = null, flushing = null;
async function flush() {
  flushT = null; if (!dirty.size) return;
  const rows = [...dirty].map(([k, v]) => ({ k, v, t: new Date().toISOString() })); dirty.clear();
  for (let i = 0; i < rows.length; i += 200) {
    const part = rows.slice(i, i + 200);
    try {
      const r = await fetch(`${SB}/rest/v1/kv`, { method: 'POST', headers: H({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(part) });
      if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 200));
    } catch (e) { console.error('store flush', e.message); part.forEach(x => { if (!dirty.has(x.k)) dirty.set(x.k, x.v); }); schedule(15000); return; }
  }
}
function schedule(ms = 2000) { if (!flushT) flushT = setTimeout(() => { flushing = flush(); }, ms); }

module.exports = {
  on: ON,
  // كل المفاتيح اللي تبدأ بـ prefix
  async load(prefix) {
    if (!ON) { const o = {}; for (const k in KV) if (k.startsWith(prefix)) o[k] = KV[k]; return o; }
    const o = {}; let from = 0;
    for (;;) {
      const r = await fetch(`${SB}/rest/v1/kv?select=k,v&k=like.${encodeURIComponent(prefix.replace(/[%_]/g, m => '\\' + m))}*&order=k`, { headers: H({ Range: `${from}-${from + 999}`, 'Range-Unit': 'items' }) });
      if (!r.ok) throw new Error('store load ' + r.status + ' ' + (await r.text()).slice(0, 200));
      const rows = await r.json(); rows.forEach(x => { o[x.k] = x.v; });
      if (rows.length < 1000) break; from += 1000;
    }
    return o;
  },
  async get(k) { if (!ON) return KV[k] == null ? null : KV[k]; const o = await this.load(k); return o[k] == null ? null : o[k]; },
  put(k, v) { if (!ON) { KV[k] = v; return kvSave(); } dirty.set(k, v); schedule(); },
  async del(k) {
    if (!ON) { delete KV[k]; return kvSave(); }
    dirty.delete(k);
    try { await fetch(`${SB}/rest/v1/kv?k=eq.${encodeURIComponent(k)}`, { method: 'DELETE', headers: H() }); } catch (e) { console.error('store del', e.message); }
  },
  async flushNow() { clearTimeout(flushT); await flush(); if (flushing) await flushing; },
  // الملفات (صور المعرض ولقطات التسريع)
  async putFile(p, buf, type = 'application/octet-stream') {
    if (!ON) { const f = path.join(FDIR, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); return; }
    const r = await fetch(`${SB}/storage/v1/object/${BUCKET}/${p}`, { method: 'POST', headers: H({ 'Content-Type': type, 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' }), body: buf });
    if (!r.ok) throw new Error('upload ' + r.status + ' ' + (await r.text()).slice(0, 200));
  },
  getFileLocal(p) { if (ON) return null; try { return fs.readFileSync(path.join(FDIR, p)); } catch { return null; } },
  fileUrl(p) { return ON ? `${SB}/storage/v1/object/public/${BUCKET}/${p}` : null; },
  async delFiles(list) {
    if (!list.length) return;
    if (!ON) { list.forEach(p => { try { fs.rmSync(path.join(FDIR, p), { force: true }); } catch {} }); return; }
    try { await fetch(`${SB}/storage/v1/object/${BUCKET}`, { method: 'DELETE', headers: H({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: list }) }); } catch (e) { console.error('store delFiles', e.message); }
  }
};
